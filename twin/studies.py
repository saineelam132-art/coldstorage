"""Phase 2 studies: weather check, parametric study, comparison runs, power-cut night,
and the results_summary.csv table.

Run everything (about 1-2 minutes):      python -m twin.run_all
"""
import itertools
from concurrent.futures import ProcessPoolExecutor

import numpy as np
import pandas as pd

from engine.config import load_config, with_overrides
from twin.simulate import daily_poa_kWh, simulate
from twin.weather import DATA, load_weather

PCM_MASSES = [60, 90, 115, 140, 172, 230]
PV_SIZES = [1.5, 1.8, 2.1, 2.4]
COMP_SIZES = [1.5, 2.0, 2.5]

KEY_COLS = ["pct_days_full_solar_pcm", "days_full_solar_pcm", "grid_hours", "grid_kWh",
            "hours_outside_2_8C", "solar_wasted_kWh", "solar_wasted_pct", "T_room_max_C",
            "T_room_min_C", "pv_kWh", "compressor_kWh_e", "cooling_kWh_th", "seasonal_COP_elec",
            "energy_balance_error_pct"]


# ----------------------------------------------------------------- weather
def classify_days(weather, cfg):
    dc = cfg["day_classes"]
    d = daily_poa_kWh(weather).to_frame("poa_kWh_m2")
    d["ghi_kWh_m2"] = weather.assign(date=weather["time_ist"].dt.normalize()).groupby("date")["ghi"].sum() / 1000
    d["class"] = np.where(d["poa_kWh_m2"] >= dc["sunny_min_kWh_m2"], "sunny",
                          np.where(d["poa_kWh_m2"] >= dc["cloudy_min_kWh_m2"], "cloudy", "rainy"))
    seasons = {m: name for name, months in cfg["seasons"].items() for m in months}
    d["season"] = [seasons[t.month] for t in d.index]
    return d


def weather_check(weather, cfg):
    days = classify_days(weather, cfg)
    w = weather.assign(month=weather["time_ist"].dt.month)
    monthly = pd.DataFrame({
        "ghi_2025_kWh_m2_day": w.groupby("month")["ghi"].sum() / 1000 / days.groupby(days.index.month).size(),
        "poa_2025_kWh_m2_day": w.groupby("month")["poa"].sum() / 1000 / days.groupby(days.index.month).size(),
        "T_mean_C": w.groupby("month")["T_out"].mean(),
        "T_max_C": w.groupby("month")["T_out"].max(),
        "RH_mean_pct": w.groupby("month")["RH_out"].mean(),
    })
    clim_path = DATA / "solar_climatology_vizag.csv"
    if clim_path.exists():
        clim = pd.read_csv(clim_path, comment="#").set_index("month")["ghi_kWh_m2_day"]
        monthly["ghi_longterm_kWh_m2_day"] = clim
        monthly["diff_2025_vs_longterm_pct"] = 100 * (monthly["ghi_2025_kWh_m2_day"] / clim - 1)
    monthly.index.name = "month"

    counts = days.groupby(["season", "class"]).size().unstack(fill_value=0)
    for c in ["sunny", "cloudy", "rainy"]:
        if c not in counts:
            counts[c] = 0
    counts = counts[["sunny", "cloudy", "rainy"]]
    order = list(cfg["seasons"].keys())
    counts = counts.reindex(order)
    counts.loc["Whole year"] = counts.sum()
    counts["days"] = counts.sum(axis=1)

    annual = {
        "ghi_2025_kWh_m2_day": weather["ghi"].sum() / 1000 / len(days),
        "poa_2025_kWh_m2_day": weather["poa"].sum() / 1000 / len(days),
        "ghi_longterm_kWh_m2_day": (float((monthly["ghi_longterm_kWh_m2_day"]
                                           * days.groupby(days.index.month).size()).sum() / len(days))
                                    if "ghi_longterm_kWh_m2_day" in monthly else float("nan")),
        "old_report_range": "5.0-5.2",
        "T_mean_C": weather["T_out"].mean(), "T_max_C": weather["T_out"].max(),
        "RH_mean_pct": weather["RH_out"].mean(),
    }
    return monthly, counts, days, annual


# --------------------------------------------------------------- parametric
def _run_case(args):
    cfg, weather, door, m, pv, q = args
    c = with_overrides(cfg, {"pcm": {"mass_kg": m}, "pv": {"rated_kWp": pv},
                             "refrigeration": {"design_capacity_kW": q}})
    s, _ = simulate(c, weather, door_secs=door, record=False)
    return s


def parametric(cfg, weather, door, workers=None):
    cases = [(cfg, weather, door, m, pv, q) for m, pv, q in itertools.product(PCM_MASSES, PV_SIZES, COMP_SIZES)]
    with ProcessPoolExecutor(max_workers=workers) as ex:
        res = list(ex.map(_run_case, cases, chunksize=4))
    df = pd.DataFrame(res)
    return df[["pcm_mass_kg", "pv_kWp", "Qmax_kW"] + KEY_COLS]


def add_cost(par, cfg):
    dc = cfg["design_choice"]
    par = par.copy()
    par["indicative_cost_INR"] = (par["pcm_mass_kg"] * dc["price_pcm_INR_per_kg"]
                                  + par["pv_kWp"] * dc["price_pv_INR_per_kWp"]
                                  + par["Qmax_kW"] * dc["price_compressor_INR_per_kW"])
    return par


def recommend(par, cfg, pcm_price_factor=1.0, pv_price_factor=1.0):
    """Pick ONE design in plain, checkable steps:
      1. the room must never leave 2-8 C                      (food safety first)
      2. grid backup must be at most 100 h/yr                 (about 2 h a week)
      3. of the designs that pass, choose the CHEAPEST, using the indicative prices
         in config/design.json -> design_choice.
    The two price factors let us test 'what if PCM / PV were cheaper or dearer?'.
    """
    dc = cfg["design_choice"]
    c = with_overrides(cfg, {"design_choice": {
        "price_pcm_INR_per_kg": dc["price_pcm_INR_per_kg"] * pcm_price_factor,
        "price_pv_INR_per_kWp": dc["price_pv_INR_per_kWp"] * pv_price_factor}})
    p = add_cost(par, c)
    ok = p[(p["hours_outside_2_8C"] <= dc["max_hours_outside_band"])
           & (p["grid_hours"] <= dc["max_grid_hours_per_year"])]
    if ok.empty:   # nothing meets the target: take the fewest grid hours
        ok = p[p["grid_hours"] == p["grid_hours"].min()]
    return ok.sort_values(["indicative_cost_INR", "grid_hours"]).iloc[0], ok


def price_sensitivity(par, cfg):
    rows = []
    for f_pcm, f_pv in [(1, 1), (0.5, 1), (2, 1), (1, 0.75), (1, 1.25)]:
        pick, _ = recommend(par, cfg, f_pcm, f_pv)
        rows.append({"PCM price x": f_pcm, "PV price x": f_pv,
                     "pick": f"{pick['pcm_mass_kg']:g} kg PCM, {pick['pv_kWp']:g} kWp, {pick['Qmax_kW']:g} kW",
                     "grid_hours": round(pick["grid_hours"]), "pct_days": round(pick["pct_days_full_solar_pcm"], 1)})
    return pd.DataFrame(rows)


# ------------------------------------------------------------- comparisons
def comparisons(cfg_rec, weather, door, cfg_current=None):
    runs = {
        "with PCM": {}, "without PCM": {"pcm": {"mass_kg": 0}},
        "strip curtain": {"door": {"curtain_installed": True}},
        "no curtain": {"door": {"curtain_installed": False}},
        "normal charging": {"controller": {"mode": "normal"}},
        "forecast charging": {"controller": {"mode": "forecast"}},
    }
    out = {}
    for name, ov in runs.items():
        s, _ = simulate(with_overrides(cfg_rec, ov), weather, door_secs=door, record=False)
        out[name] = s
    pairs = [("PCM", "with PCM", "without PCM"), ("Door curtain", "strip curtain", "no curtain"),
             ("Charging", "normal charging", "forecast charging")]
    if cfg_current is not None:
        for name, mode in [("current design, normal charging", "normal"),
                           ("current design, forecast charging", "forecast")]:
            out[name], _ = simulate(with_overrides(cfg_current, {"controller": {"mode": mode}}),
                                    weather, door_secs=door, record=False)
        pairs.append(("Charging (current design)", "current design, normal charging",
                      "current design, forecast charging"))
    rows = []
    for title, a, b in pairs:
        for k, unit in [("pct_days_full_solar_pcm", "%"), ("grid_hours", "h/yr"), ("grid_kWh", "kWh/yr"),
                        ("hours_outside_2_8C", "h/yr"), ("solar_wasted_kWh", "kWh/yr"),
                        ("T_room_max_C", "C"), ("compressor_kWh_e", "kWh/yr")]:
            rows.append({"comparison": title, "metric": k, "unit": unit,
                         "case_A": a, "value_A": out[a][k], "case_B": b, "value_B": out[b][k],
                         "change_B_minus_A": out[b][k] - out[a][k]})
    return pd.DataFrame(rows), out


# ------------------------------------------------------------ power-cut night
def pick_power_cut_night(weather):
    """The hottest evening (mean 6 pm-6 am temperature) of the year."""
    w = weather.set_index("time_ist")["T_out"]
    best, best_T = None, -99
    for day in pd.date_range(w.index[0].normalize(), w.index[-1].normalize() - pd.Timedelta(days=2)):
        T = w[day + pd.Timedelta(hours=18): day + pd.Timedelta(hours=30)].mean()
        if T > best_T:
            best, best_T = day, T
    return best


def power_cut_night(cfg_rec, weather, door, day=None):
    day = day or pick_power_cut_night(weather)
    start, end = day + pd.Timedelta(hours=18), day + pd.Timedelta(hours=30)
    window = [(str(start), str(end))]
    traces = {}
    light = {"simulation": {"stock_mass_kg": 200}}
    for name, ov in [("with PCM", {}), ("without PCM", {"pcm": {"mass_kg": 0}}),
                     ("with PCM, light room", light),
                     ("without PCM, light room", {**light, "pcm": {"mass_kg": 0}})]:
        s, df = simulate(with_overrides(cfg_rec, ov), weather, door_secs=door, outages=window)
        seg = df[day + pd.Timedelta(hours=12): day + pd.Timedelta(hours=36)]
        traces[name] = seg
    return day, start, end, traces


# ------------------------------------------------------------- summary CSV
def summary_rows(cfg, weather_annual, counts, base, rec, pick, comp_out, cut, design_rows):
    """Every key number with its unit and the formula / method behind it."""
    R = []

    def add(section, item, value, unit, method):
        if isinstance(value, (float, np.floating)):
            value = float(f"{float(value):.4g}")
        R.append({"section": section, "item": item, "value": value, "unit": unit,
                  "formula_or_method": method})

    for r in design_rows:
        if r["value"] == r["value"]:   # skip NaN warning rows
            add("Design point (35 C, 65 % RH)", f"{r['group']}: {r['name']}", r["value"], r["unit"],
                r["formula"] + (f"  =  {r['substituted']}" if r["substituted"] else ""))

    wa = weather_annual
    add("Weather 2025", "Mean daily sunlight on flat ground (GHI)", wa["ghi_2025_kWh_m2_day"], "kWh/m2/day",
        "sum of NASA POWER hourly ALLSKY_SFC_SW_DWN / 1000 / 365")
    add("Weather 2025", "Long-term mean GHI 2001-2024", wa["ghi_longterm_kWh_m2_day"], "kWh/m2/day",
        "NASA POWER daily GHI averaged by month, 2001-2024")
    add("Weather 2025", "Old report value", wa["old_report_range"], "kWh/m2/day", "from earlier project report")
    add("Weather 2025", "Mean daily sunlight on the 17 deg panel (POA)", wa["poa_2025_kWh_m2_day"], "kWh/m2/day",
        "Erbs diffuse split + isotropic sky model, tilt 17 deg south")
    add("Weather 2025", "Mean air temperature", wa["T_mean_C"], "C", "mean of hourly T2M")
    add("Weather 2025", "Highest air temperature", wa["T_max_C"], "C", "max of hourly T2M")
    for season, row in counts.iterrows():
        for c in ["sunny", "cloudy", "rainy"]:
            add("Day count", f"{season}: {c} days", int(row[c]), "days",
                "daily POA irradiation: sunny >= 5.0, cloudy 2.5-5.0, rainy < 2.5 kWh/m2")

    def year_rows(section, s):
        add(section, "Design", f"PCM {s['pcm_mass_kg']:g} kg, PV {s['pv_kWp']:g} kWp, compressor {s['Qmax_kW']:g} kW",
            "", "")
        add(section, "Days fully on solar + PCM", s["pct_days_full_solar_pcm"], "% of days",
            "days with no grid connection / 365")
        add(section, "Grid backup hours", s["grid_hours"], "h/yr", "time the ATS is switched to grid")
        add(section, "Grid energy", s["grid_kWh"], "kWh/yr", "sum of compressor power drawn from grid x dt")
        add(section, "Hours outside 2-8 C", s["hours_outside_2_8C"], "h/yr", "time with room T < 2 C or > 8 C")
        add(section, "Room temperature range", f"{s['T_room_min_C']:.2f} to {s['T_room_max_C']:.2f}", "C", "min / max of room T")
        add(section, "Solar energy produced", s["pv_kWh"], "kWh/yr",
            "P = P_rated*(G_POA/1000)*PR*[1-0.004*(T_cell-25)], summed")
        add(section, "Solar energy wasted", s["solar_wasted_kWh"], "kWh/yr",
            "PV available - PV used by compressor (wax already frozen, room cold)")
        add(section, "Compressor electricity", s["compressor_kWh_e"], "kWh/yr", "sum of Q_cooling / COP_elec x dt")
        add(section, "Cooling delivered", s["cooling_kWh_th"], "kWh/yr", "air coil + PCM charging coil")
        add(section, "Seasonal COP (electrical)", s["seasonal_COP_elec"], "-",
            "= cooling delivered over the year / compressor electricity over the year. Same definition as the "
            "2.2 design value (COP_elec, includes isentropic 0.75 and motor/inverter 0.85 losses). Higher than 2.2 "
            "because the design value is at 50 C condensing (40 C outside), while the real year is cooler: see next line")
        add(section, "Outside temperature weighted by cooling", s["T_out_cooling_weighted_C"], "C",
            "sum(Q_cooling x T_out) / sum(Q_cooling): typical condensing temperature is this + 10 K, not 50 C")
        add(section, "Heat in: walls", s["load_wall_kWh"], "kWh/yr", "U*A*(T_out-T_room)")
        add(section, "Heat in: door (total)", s["load_door_kWh"], "kWh/yr", "ASHRAE Gosney-Olama x D_t x D_f x (1-E)")
        add(section, "Heat in: door (latent part)", s["load_door_latent_kWh"], "kWh/yr", "moisture part of the door load")
        add(section, "Heat in: fans, lights", s["load_internal_kWh"], "kWh/yr", "electrical power of fan/lights/controller")
        add(section, "Heat in: respiration", s["load_resp_kWh"], "kWh/yr", "m * r_ref * Q10^((T-T_ref)/10)")
        add(section, "Heat in: produce (in minus out)", s["load_product_kWh"], "kWh/yr", "m*cp*(T_in) - m*cp*(T_out)")
        add(section, "ENERGY BALANCE: heat in", s["energy_in_kWh"], "kWh/yr", "sum of all heat entering")
        add(section, "ENERGY BALANCE: heat out", s["energy_out_kWh"], "kWh/yr", "evaporator coils + cold produce out")
        add(section, "ENERGY BALANCE: stored change", s["stored_change_kWh"], "kWh/yr", "end - start of room, batch and PCM energy")
        add(section, "ENERGY BALANCE: error", s["energy_balance_error_pct"], "% of heat out",
            "|in - out - stored change| / out x 100 (must be < 1 %). This checks the model's BOOKKEEPING "
            "(no heat is lost or created by the code). It does NOT prove the physics is right - "
            "the small-box test in Phase 4 (model vs measured) checks the physics")

    year_rows("Year - current design", base)
    year_rows("Year - recommended design", rec)

    for name, s in comp_out.items():
        for k, unit in [("pct_days_full_solar_pcm", "%"), ("grid_hours", "h/yr"), ("grid_kWh", "kWh/yr"),
                        ("hours_outside_2_8C", "h/yr"), ("solar_wasted_kWh", "kWh/yr")]:
            add("Comparison (recommended design)", f"{name}: {k}", s[k], unit, "full-year simulation")
    day, start, end, traces = cut
    for name, seg in traces.items():
        add("Power-cut night", f"{name}: highest room temperature during the cut",
            seg.loc[start:end, "T_room"].max(), "C",
            f"grid off {start:%d %b %H:%M} to {end:%d %b %H:%M}, no sun; light room = 200 kg stored instead of 600 kg")
    return pd.DataFrame(R)
