"""Money audit: the SAME room on the SAME 2026 weather and load, run four ways, every formula shown.

    python -m engine.economics      ->  results/live/economics_2026.json  +  web/live/data/economics.js (for the page)

    a) grid-only room            cost = kWh × tariff
    b) diesel-only room          fuel (L) = F0 × genset hours + F1 × kWh   (2 kVA genset, part-load curve); on diesel the
                                 compressor runs at full speed for fewer hours: genset hours = kWh / full-speed power (E)
                                 cost = fuel × diesel price
    c) grid + diesel in cuts     grid outside the cut hours, diesel inside them
    d) our solar + wax room      only the grid (or diesel, in cut hours) it really uses
    saving = (a, b or c) − d     per day, per month, per year (year = sum of the days × 365 / days)
Missing costs (PV cleaning, degradation, maintenance, wax / sensor replacement, genset purchase and upkeep) and
the value of produce saved are SEPARATE lines. Every input is editable on the page (web/money.html); the page uses
the same formulas (web/live/money.js; parity test in tests/test_economics.py). E = assumption.
"""
import json
import math
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "results" / "live" / "economics_2026.json"
OUT_JS = ROOT / "web" / "live" / "data" / "economics.js"

# ------------------------------------------------------------------ inputs (value, note). E = assumption.
INPUTS = {
    "grid_tariff_INR_kWh": (8.0, "E – commercial tariff guess. Agricultural connections in Andhra Pradesh can be much cheaper (often subsidised); "
                                 "put your own bill's rate here."),
    "diesel_INR_L": (93.0, "E – diesel price guess (₹/L); check the local pump price."),
    "genset_kVA": (2.0, "E – smallest common diesel genset that starts the compressor"),
    "genset_pf": (0.8, "E – power factor (2 kVA × 0.8 = 1.6 kW)"),
    "genset_F0_L_h": (0.25, "E – fuel used just to keep the genset running (no load), L/h. Straight-line (Willans) curve chosen so that "
                            "a small genset uses about 0.8–1.2 L per kWh at 30–40 % load, as typical; check the genset datasheet."),
    "genset_F1_L_kWh": (0.30, "E – extra fuel per kWh delivered (slope of the curve)"),
    "cut_start_h": (10, "E – power cut starts (hour)"),
    "cut_end_h": (18, "E – power cut ends (hour)"),
    "random_cut_prob": (0.0, "E – extra random cuts: chance that any other hour is cut (0 = off)"),
    "random_cut_seed": (2026, "fixed seed so random cuts repeat"),
    "extra_capex_INR": (None, "estimate – quotation pending (from the Live page payback list)"),
    "subsidy_pct": (35.0, "E – government subsidy on our extra cost"),
    "genset_INR": (45000.0, "E – 2 kVA diesel genset price (quotation pending)"),
    "genset_life_yr": (10.0, "E"),
    "genset_upkeep_INR_per_run_h": (3.0, "E – oil, filters, service per running hour"),
    "ours_needs_genset_in_diesel_village": (True, "E – in a village with no grid our room still needs a backup source, so the genset cost cancels"),
    "ours_needs_genset_with_grid_cuts": (False, "E – with grid + cuts we assume the wax and sun carry the room through the cut hours "
                                                 "(the twin shows how many cut hours still need power)"),
    "pv_degradation_pct_yr": (0.5, "E – typical crystalline PV; our grid use grows a little each year"),
    "pv_cleaning_INR_yr": (1560.0, "E – 52 cleanings × ₹30 labour"),
    "maintenance_pct_capex_yr": (1.0, "E – solar + wax + controls upkeep, % of our extra cost per year"),
    "sensor_replacement_INR": (2000.0, "E – sensors replaced every 5 years"),
    "sensor_life_yr": (5.0, "E"),
    "wax_INR": (34500.0, "E – wax + panels (from the payback list)"),
    "wax_life_yr": (15.0, "E – paraffin is stable for thousands of cycles; replacement assumed after 15 years"),
    "produce_kg_day": (150.0, "the design load"),
    "produce_price_INR_kg": (100.0, "E – pomegranate farm-gate price guess (₹/kg); varies a lot by grade and season"),
    "loss_without_pct": (10.0, "E – Indian studies report fruit and vegetable post-harvest losses of about 4.6–11 % (guava 15 %, "
                               "tomato 12 %); no pomegranate-specific figure found – 10 % used, edit it"),
    "loss_with_pct": (2.0, "E – loss left with the cold room (handling, sorting)"),
    "horizon_yr": (25, "years checked for payback"),
}
DEFAULTS = {k: v[0] for k, v in INPUTS.items()}


# ------------------------------------------------------------------ formulas (each one small and testable)
def fuel_L(kWh, run_h, F0, F1):
    """Diesel genset fuel: F0 × running hours + F1 × kWh delivered (straight-line part-load curve)."""
    return F0 * run_h + F1 * kWh


def fuel_per_kWh_at_load(frac, P):
    """L/kWh at a given load fraction of the genset (for the page: 30 % load -> about 0.8 L/kWh)."""
    kW = P["genset_kVA"] * P["genset_pf"] * frac
    return fuel_L(kW, 1.0, P["genset_F0_L_h"], P["genset_F1_L_kWh"]) / kW


def cut_mask(n_days, P):
    """True for every (day, hour) in a power cut: the daily cut window + optional random cuts (fixed seed)."""
    h = np.arange(24)
    a, b = P["cut_start_h"], P["cut_end_h"]
    win = (h >= a) & (h < b) if a <= b else (h >= a) | (h < b)
    m = np.tile(win, (n_days, 1))
    if P.get("random_cut_prob", 0) > 0:
        rng = np.random.default_rng(int(P["random_cut_seed"]))
        m |= rng.random((n_days, 24)) < P["random_cut_prob"]
    return m


def day_costs(D, P):
    """D: arrays [day][hour]: go_kWh, go_run_h (grid-only room), ours_kWh, ours_run_h (our room's grid use).
    -> per-day cost of each way of running the room, ₹."""
    t, dp, F0, F1 = P["grid_tariff_INR_kWh"], P["diesel_INR_L"], P["genset_F0_L_h"], P["genset_F1_L_kWh"]
    go, gr, ok, orn = (np.asarray(D[k], float) for k in ("go_kWh", "go_run_h", "ours_kWh", "ours_run_h"))
    cut = cut_mask(go.shape[0], P)
    fuel_go = fuel_L(go, gr, F0, F1)
    fuel_ours = fuel_L(ok, orn, F0, F1)
    return {
        "a_grid_only": (go * t).sum(1),
        "b_diesel_only": (fuel_go * dp).sum(1),
        "c_grid_diesel": (np.where(cut, fuel_go * dp, go * t)).sum(1),
        "d_ours_vs_a": (ok * t).sum(1),
        "d_ours_vs_b": (fuel_ours * dp).sum(1),
        "d_ours_vs_c": (np.where(cut, fuel_ours * dp, ok * t)).sum(1),
        "fuel_b_L": fuel_go.sum(1), "fuel_c_L": np.where(cut, fuel_go, 0).sum(1),
        "go_kWh": go.sum(1), "ours_kWh": ok.sum(1), "go_run_h": gr.sum(1), "cut_run_h_c": np.where(cut, gr, 0).sum(1),
        "ours_kWh_in_cuts": np.where(cut, ok, 0).sum(1),
    }


def per_year(daily, n_days):
    return float(np.sum(daily)) * 365.0 / n_days


def annual_extras(P, capex):
    """Yearly costs that are NOT energy: ours (extra) and the genset of the diesel / mixed rooms."""
    ours = (P["pv_cleaning_INR_yr"] + P["maintenance_pct_capex_yr"] / 100.0 * capex
            + P["sensor_replacement_INR"] / P["sensor_life_yr"] + P["wax_INR"] / P["wax_life_yr"])
    return {"ours_INR_yr": ours, "genset_capex_INR_yr": P["genset_INR"] / P["genset_life_yr"]}


def produce_value_yr(P):
    """Value of produce saved (estimate, separate line): kg/day × ₹/kg × (loss without − loss with) × 365."""
    return P["produce_kg_day"] * P["produce_price_INR_kg"] * (P["loss_without_pct"] - P["loss_with_pct"]) / 100.0 * 365.0


def payback_years(capex, saving_y1, degr_pct, horizon):
    """Years until the cumulative saving pays back the extra cost (saving shrinks by the PV degradation each year)."""
    if capex <= 0:
        return 0.0
    cum = 0.0
    for y in range(1, int(horizon) + 1):
        s = saving_y1 * (1 - degr_pct / 100.0) ** (y - 1)
        if s <= 0:
            return None
        if cum + s >= capex:
            return y - 1 + (capex - cum) / s
        cum += s
    return None


def summary(D, P, capex):
    n = len(D["days"])
    c = day_costs(D, P)
    yr = {k: per_year(v, n) for k, v in c.items()}
    ex = annual_extras(P, capex)
    run_h_b = yr["go_run_h"]
    genset_upkeep = run_h_b * P["genset_upkeep_INR_per_run_h"]
    genset_upkeep_c = yr["cut_run_h_c"] * P["genset_upkeep_INR_per_run_h"]
    energy = {"vs_grid": yr["a_grid_only"] - yr["d_ours_vs_a"], "vs_diesel": yr["b_diesel_only"] - yr["d_ours_vs_b"],
              "vs_mixed": yr["c_grid_diesel"] - yr["d_ours_vs_c"]}
    # net yearly saving after the non-energy costs (genset purchase spread over its life)
    gk = ex["genset_capex_INR_yr"]
    net = {"vs_grid": energy["vs_grid"] - ex["ours_INR_yr"],
           "vs_diesel": energy["vs_diesel"] - ex["ours_INR_yr"] + genset_upkeep + (0.0 if P["ours_needs_genset_in_diesel_village"] else gk),
           "vs_mixed": energy["vs_mixed"] - ex["ours_INR_yr"] + genset_upkeep_c + (0.0 if P["ours_needs_genset_with_grid_cuts"] else gk)}
    pv = produce_value_yr(P)
    sub = capex * (1 - P["subsidy_pct"] / 100.0)
    pay = {}
    for k in net:
        for lab, cap in (("no_subsidy", capex), ("subsidy", sub)):
            pay[f"{k}|{lab}|energy"] = payback_years(cap, net[k], P["pv_degradation_pct_yr"], P["horizon_yr"])
            pay[f"{k}|{lab}|with_produce"] = payback_years(cap, net[k] + pv, P["pv_degradation_pct_yr"], P["horizon_yr"])
    months = {}
    for i, d in enumerate(D["days"]):
        m = months.setdefault(d[:7], {k: 0.0 for k in ("a_grid_only", "b_diesel_only", "c_grid_diesel", "d_ours_vs_a", "d_ours_vs_b", "d_ours_vs_c")})
        for k in m:
            m[k] += float(c[k][i])
    return {"days": n, "per_year": yr, "energy_saving_yr": energy, "extras_yr": ex, "genset_upkeep_yr": {"b": genset_upkeep, "c": genset_upkeep_c},
            "net_saving_yr": net, "produce_value_yr": pv, "total_with_produce_yr": {k: v + pv for k, v in net.items()},
            "payback_years": pay, "capex": capex, "capex_after_subsidy": sub, "per_month": months,
            "per_day_avg": {k: v / 365.0 for k, v in yr.items()},
            "fuel_L_per_kWh_30pct": fuel_per_kWh_at_load(0.30, P), "fuel_L_per_kWh_100pct": fuel_per_kWh_at_load(1.0, P)}


# ------------------------------------------------------------------ data from the twin (same weather, same load)
def twin_hours():
    """Our room and the grid-only room on the real 2026 weather (actual days only, not the forecast)."""
    from engine.config import load_config
    from twin.live_sim import simulate_live
    from twin.live_weather import load_actual
    cfg = load_config()
    W = load_actual()
    H = simulate_live(W, "current", cfg=cfg)[0]
    Hg = simulate_live(W, "current", mode="grid_only", cfg=cfg)[0]
    real = ~H["is_forecast"].values if "is_forecast" in H else np.ones(len(H), bool)
    H, Hg = H[real], Hg[real]
    # on a genset the compressor runs at FULL speed for fewer hours (on/off), not slowly all day:
    # hours = kWh / (full-speed electrical power at that hour's outside temperature)
    from twin.live_sim import cycle_table
    Tt, CT = cycle_table(cfg)
    lr = cfg["live_run"]
    full_kW = lambda df: lr["compressor_max_kW"] / np.interp(df["T_out"].values, Tt, CT["COP_elec"]) + lr["evaporator_fan_W"] / 1000.0
    Hg = Hg.assign(diesel_run_h=np.minimum(1.0, Hg["P_comp"].values / full_kW(Hg)))
    H = H.assign(diesel_run_h=np.minimum(1.0, H["P_grid"].values / full_kW(H)))
    days = sorted(set(H.time_ist.dt.strftime("%Y-%m-%d")))
    days = [d for d in days if (H.time_ist.dt.strftime("%Y-%m-%d") == d).sum() == 24]
    pick = lambda df, col: [[round(float(x), 5) for x in df[df.time_ist.dt.strftime("%Y-%m-%d") == d][col].values] for d in days]
    return cfg, {"days": days, "go_kWh": pick(Hg, "P_comp"), "go_run_h": pick(Hg, "diesel_run_h"),
                 "ours_kWh": pick(H, "P_grid"), "ours_run_h": pick(H, "diesel_run_h")}


def payback_items():
    p = ROOT / "results" / "live" / "summary.json"
    S = json.loads(p.read_text(encoding="utf-8")) if p.exists() else {}
    pb = S.get("payback") or {}
    return pb.get("extra_items", []), pb.get("extra_cost_INR")


def main():
    cfg, D = twin_hours()
    items, capex = payback_items()
    P = dict(DEFAULTS)
    m = cfg["live_run"]["money"]
    P["grid_tariff_INR_kWh"], P["diesel_INR_L"] = m["grid_tariff_INR_kWh"], m["diesel_INR_L"]
    P["cut_start_h"], P["cut_end_h"] = m["power_cut_hours"]
    P["extra_capex_INR"] = capex
    res = summary(D, P, capex or 0.0)
    out = {"about": __doc__.strip().splitlines()[0], "inputs": {k: {"value": P[k], "note": INPUTS[k][1]} for k in INPUTS},
           "capex_items": items, "data": D, "result": res,
           "label": "S = digital twin on the real 2026 weather (actual days only); money values are calculations (C) with guessed prices (E)."}
    OUT.write_text(json.dumps(out, indent=1, default=float, ensure_ascii=False), encoding="utf-8")
    OUT_JS.write_text("(window.LIVE=window.LIVE||{}).economics=" + json.dumps(out, separators=(",", ":"), default=float, ensure_ascii=False) + ";\n",
                      encoding="utf-8")
    r = res
    print(f"{r['days']} days. Energy saving/yr vs grid ₹{r['energy_saving_yr']['vs_grid']:.0f}, vs diesel ₹{r['energy_saving_yr']['vs_diesel']:.0f}, "
          f"vs mixed ₹{r['energy_saving_yr']['vs_mixed']:.0f}; net {json.dumps({k: round(v) for k, v in r['net_saving_yr'].items()})}; "
          f"produce value ₹{r['produce_value_yr']:.0f}/yr; payback {json.dumps({k: (round(v, 1) if v else v) for k, v in r['payback_years'].items()})}")


if __name__ == "__main__":
    main()
