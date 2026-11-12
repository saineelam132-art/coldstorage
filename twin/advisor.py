"""Tomorrow advisor: what the room will need tomorrow (and the day after), from the Open-Meteo forecast.

    python -m twin.advisor         ->  web/live/data/advisor.js  (card on the home page and the Live page)

The twin runs from 1 Jan 2026 straight through the forecast, so tomorrow starts from TODAY's predicted
wax % at midnight. For each day: hours on solar + wax, hours needing the grid (and diesel if the grid is cut
in the cut window), their cost, the saving vs a grid-only and a diesel-only room, and one advice line from
simple rules (thresholds in ADV below). Forecast values = F, twin values = S. We do not predict cyclones:
the card links to the official IMD warnings.
"""
import json
from pathlib import Path

import numpy as np
import pandas as pd

from engine import economics as EC

ROOT = Path(__file__).resolve().parent.parent
OUT_JS = ROOT / "web" / "live" / "data" / "advisor.js"
ADV = {
    "storm_codes": [65, 67, 75, 82, 86, 95, 96, 99],   # WMO: heavy rain / snow showers, violent showers, thunderstorm
    "storm_gust_kmh": 60.0,
    "storm_sun_kWh_m2": 1.0,
    "storm_rain_mm_day": 64.5,                        # IMD 'heavy rainfall' starts at 64.5 mm/day
    "low_sun_kWh_m2": 2.5,                            # = the twin's 'rainy' day class limit (config day_classes)
    "precool_grid_h": 2.0,
    "reduce_intake_grid_h": 4.0,
    "reduced_intake_kg": 100,
    "imd_url": "https://mausam.imd.gov.in/",
}


def weather_summary(wx):
    """wx: hourly forecast rows of one day (columns ghi W/m2 raw Open-Meteo, rain_mm, cloud_pct, gust_kmh, wcode, T_out)."""
    g = lambda c: pd.to_numeric(wx[c], errors="coerce") if c in wx else pd.Series([np.nan] * len(wx))
    codes = [int(c) for c in g("wcode").dropna().unique()]
    return {"T_max_C": float(g("T_out").max()), "T_min_C": float(g("T_out").min()),
            "sun_kWh_m2": float(g("ghi").fillna(0).sum() / 1000.0), "rain_mm": float(g("rain_mm").fillna(0).sum()),
            "cloud_mean_pct": float(g("cloud_pct").mean()) if g("cloud_pct").notna().any() else None,
            "gust_max_kmh": float(g("gust_kmh").max()) if g("gust_kmh").notna().any() else None,
            "codes": codes, "has_gust_code": bool(g("gust_kmh").notna().any() or g("wcode").notna().any())}


def advise(w, plan, adv=ADV, who="Tomorrow"):
    """Rules -> (rule id, advice line, extra lines). w = weather_summary, plan = day_plan."""
    storm_why = []
    if any(c in adv["storm_codes"] for c in w["codes"]):
        storm_why.append("thunderstorm / heavy rain in the forecast")
    if w["gust_max_kmh"] is not None and w["gust_max_kmh"] > adv["storm_gust_kmh"]:
        storm_why.append(f"gusts up to {w['gust_max_kmh']:.0f} km/h")
    if w["sun_kWh_m2"] < adv["storm_sun_kWh_m2"]:
        storm_why.append(f"almost no sun ({w['sun_kWh_m2']:.1f} kWh/m²)")
    if w["rain_mm"] >= adv["storm_rain_mm_day"]:
        storm_why.append(f"{w['rain_mm']:.0f} mm of rain")
    extra = []
    if storm_why:
        rule = "storm"
        line = ("Storm expected – solar will be weak and power cuts are likely. Charge the wax fully today (run on grid tonight if "
                "needed) and keep the diesel generator ready.")
        extra.append("Why: " + ", ".join(storm_why) + ".")
        extra.append(f"Official cyclone alerts: IMD ({adv['imd_url']}) – we do not predict cyclones ourselves.")
    elif plan["grid_h"] > 0.05 or w["sun_kWh_m2"] < adv["low_sun_kWh_m2"]:
        rule = "low_sun"
        when = plan["first_grid_hhmm"] or plan["wax_low_hhmm"] or "the evening"
        line = (f"Low sun {who.lower()} – wax will drop to {plan['wax_night_pct']:.0f} % by night. Keep grid ready from {when}.")
    else:
        rule = "normal"
        line = f"{who} runs fully on solar + wax. No grid needed."
    if rule == "storm" or plan["grid_h"] >= adv["precool_grid_h"]:
        extra.append("The night before: pre-cool the room to 3 °C and let the wax freeze fully before midnight (use the grid if the sun is gone).")
    else:
        extra.append("The night before: no pre-cooling needed.")
    if rule == "storm" or plan["grid_h"] >= adv["reduce_intake_grid_h"]:
        extra.append(f"Intake: take about {adv['reduced_intake_kg']} kg instead of 150 kg that morning (less warm produce to cool).")
    else:
        extra.append("Intake: the normal 150 kg is fine.")
    return rule, line, extra


def day_plan(H, Hg, cfg, P=None):
    """H / Hg: hourly twin rows of ONE day for our room / a grid-only room. -> hours and ₹ by power source."""
    P = dict(EC.DEFAULTS, **(P or {}))
    m = cfg["live_run"]["money"]
    t, dp = m["grid_tariff_INR_kWh"], m["diesel_INR_L"]
    a, b = m["power_cut_hours"]
    hod = H.time_ist.dt.hour.values
    cut = (hod >= a) & (hod < b)
    from twin.live_sim import cycle_table
    Tt, CT = cycle_table(cfg)
    lr = cfg["live_run"]
    full = lr["compressor_max_kW"] / np.interp(H["T_out"].values, Tt, CT["COP_elec"]) + lr["evaporator_fan_W"] / 1000.0
    g_kWh, g_h = H["P_grid"].values, H["grid_on"].values
    grid_h = float(g_h.sum())
    diesel_h = float(g_h[cut].sum())
    grid_kWh = float(g_kWh[~cut].sum())
    d_kWh = g_kWh[cut]
    d_fuel = float(EC.fuel_L(d_kWh, np.minimum(1, d_kWh / full[cut]), P["genset_F0_L_h"], P["genset_F1_L_kWh"]).sum())
    go = Hg["P_comp"].values
    fullg = lr["compressor_max_kW"] / np.interp(Hg["T_out"].values, Tt, CT["COP_elec"]) + lr["evaporator_fan_W"] / 1000.0
    go_fuel = float(EC.fuel_L(go, np.minimum(1, go / fullg), P["genset_F0_L_h"], P["genset_F1_L_kWh"]).sum())
    ours_fuel_all = float(EC.fuel_L(g_kWh, np.minimum(1, g_kWh / full), P["genset_F0_L_h"], P["genset_F1_L_kWh"]).sum())   # our room on diesel only
    on = np.where(g_h > 0.05)[0]
    pct = H["pcm_pct"].values
    night = pct[hod >= 18] if (hod >= 18).any() else pct
    low = np.where(pct < cfg["controller"]["ats_pcm_pct"] + 10)[0]
    cost_grid = grid_kWh * t + (float(g_kWh[cut].sum()) * t)          # if the grid is NOT cut, all grid hours cost the tariff
    cost_cut = grid_kWh * t + d_fuel * dp                             # if it is cut in the cut window, those hours run on diesel
    return {"solar_wax_h": 24.0 - grid_h, "grid_h": grid_h, "diesel_h_if_cut": diesel_h,
            "cost_grid_INR": cost_grid, "cost_with_cuts_INR": cost_cut, "diesel_L_if_cut": d_fuel,
            "grid_only_room_INR": float(go.sum() * t), "diesel_only_room_INR": go_fuel * dp,
            "saved_vs_grid_INR": float(go.sum() * t) - cost_grid, "saved_vs_diesel_INR": go_fuel * dp - ours_fuel_all * dp,
            "first_grid_hhmm": f"{int(hod[on[0]]):02d}:00" if len(on) else None,
            "wax_low_hhmm": f"{int(hod[low[0]]):02d}:00" if len(low) else None,
            "wax_night_pct": float(night.min()), "wax_sunset_pct": float(pct[hod == 18][0]) if (hod == 18).any() else None,
            "room_max_C": float(H["T_room"].max()), "cut_hours": [a, b]}


def run():
    from engine.config import load_config
    from twin.live_sim import simulate_live
    from twin.live_weather import LIVE, load_actual, now_ist
    cfg = load_config()
    today = now_ist().date()
    W = load_actual(today=today + pd.Timedelta(days=1))          # actual + forecast, up to the end of the day after tomorrow
    H = simulate_live(W, "current", cfg=cfg)[0]
    Hg = simulate_live(W, "current", mode="grid_only", cfg=cfg)[0]
    meta = json.loads((LIVE / "weather_meta.json").read_text(encoding="utf-8")) if (LIVE / "weather_meta.json").exists() else {}
    fc = pd.read_csv(LIVE / "openmeteo_forecast_latest.csv", parse_dates=["time_ist"]) if (LIVE / "openmeteo_forecast_latest.csv").exists() else None
    days = []
    for k, label in ((1, "Tomorrow"), (2, "Day after tomorrow")):
        d = pd.Timestamp(today) + pd.Timedelta(days=k)
        sel = H.time_ist.dt.normalize() == d
        if sel.sum() < 24 or fc is None:
            continue
        wx = fc[fc.time_ist.dt.normalize() == d]
        if len(wx) < 24:
            continue
        w = weather_summary(wx)
        plan = day_plan(H[sel], Hg[Hg.time_ist.dt.normalize() == d], cfg)
        rule, line, extra = advise(w, plan, who="Tomorrow" if k == 1 else "The day after tomorrow")
        days.append({"date": str(d.date()), "label": label, "confidence": "normal" if k == 1 else "lower (2 days ahead)",
                     "weather_F": w, "plan_S": plan, "rule": rule, "advice": line, "extra": extra,
                     "hourly": {"hour": list(range(24)), "pcm_pct": [round(float(x), 1) for x in H[sel].pcm_pct],
                                "grid_on": [round(float(x), 2) for x in H[sel].grid_on], "T_room": [round(float(x), 2) for x in H[sel].T_room]}})
    out = {"generated": now_ist().strftime("%Y-%m-%d %H:%M IST"),
           "forecast_from": (meta.get("forecast") or {}).get("updated"), "days": days, "thresholds": ADV,
           "tags": {"F": "Open-Meteo forecast", "S": "digital twin run on that forecast"},
           "tariff": cfg["live_run"]["money"]["grid_tariff_INR_kWh"], "diesel": cfg["live_run"]["money"]["diesel_INR_L"]}
    OUT_JS.write_text("(window.LIVE=window.LIVE||{}).advisor=" + json.dumps(out, separators=(",", ":"), default=float, ensure_ascii=False) + ";\n",
                      encoding="utf-8")
    return out


if __name__ == "__main__":
    o = run()
    for d in o["days"]:
        p = d["plan_S"]
        print(f"{d['label']} {d['date']}: {d['advice']} | solar+wax {p['solar_wax_h']:.1f} h, grid {p['grid_h']:.1f} h ₹{p['cost_grid_INR']:.0f}, "
              f"diesel if cut {p['diesel_h_if_cut']:.1f} h ₹{p['cost_with_cuts_INR']:.0f}; saved vs grid ₹{p['saved_vs_grid_INR']:.0f}, vs diesel ₹{p['saved_vs_diesel_INR']:.0f}")
        print("   ", d["weather_F"], d["extra"])
