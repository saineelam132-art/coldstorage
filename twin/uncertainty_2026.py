"""Uncertainty study: how sure are the 2026 results if the weather AT OUR SITE differs from the
Open-Meteo grid data by the amounts found in published studies (config/site_error_budget.json)?

    python -m twin.uncertainty_2026          ->  results/live/uncertainty_2026.json

Same weather as the design study (data/uncertainty/weather_2026_study.csv, frozen) and the same final
design. Cases: a) base (as now), b) hot site, c) cool site, d) 200 random sites (errors correlated over
~6 h, fixed seed so the result is repeatable). Nothing here is measured: the inputs are expected errors
from studies, the outputs are digital-twin (S) results. Existing result files are not changed.
"""
import json
import os
from multiprocessing import Pool
from pathlib import Path

import numpy as np
import pandas as pd

from engine.config import load_config
from twin import design_study_2026 as DS
from twin import site_error as SE
from twin.live_sim import simulate_live

ROOT = Path(__file__).resolve().parent.parent
WEATHER = ROOT / "data" / "uncertainty" / "weather_2026_study.csv"
OUT = ROOT / "results" / "live" / "uncertainty_2026.json"
KEYS = ["days_full_solar_wax", "grid_h_per_year", "comp_kWh_day", "wax_sunset_mean_pct", "wax_sunset_worst_pct",
        "hottest_night_room_max_C", "h_outside_2_8_loading", "h_outside_2_8_other", "saved_vs_grid_INR_yr",
        "saved_vs_diesel_INR_yr"]


def study_weather():
    return pd.read_csv(WEATHER, parse_dates=["time_ist"])


def hottest_night(w):
    """Start (19:00) of the night with the highest mean outside temperature (19:00-06:00)."""
    n = w[(w.time_ist.dt.hour >= 19) | (w.time_ist.dt.hour < 6)]
    key = (n.time_ist - pd.Timedelta(hours=7)).dt.date
    d = n.groupby(key).T_out.mean().idxmax()
    return pd.Timestamp(d) + pd.Timedelta(hours=19)


def run_case(w, cfg, night):
    """Final design + grid-only room on this weather -> the numbers the brief asks for."""
    ld = cfg["live_run"]["loading"]
    H, T, _, bt = simulate_live(w, "current", cfg=cfg)
    Hg = simulate_live(w, "current", mode="grid_only", cfg=cfg)[0]
    m = DS.metrics(H, T, bt, ld)
    mo = DS.money(H, Hg, cfg["live_run"]["money"])
    hod = H.time_ist.dt.hour
    sunset = H.pcm_pct[hod == 18]
    nm = (H.time_ist >= night) & (H.time_ist < night + pd.Timedelta(hours=11))
    return {"days": m["days"], "days_full_solar_wax": m["days_full_solar_wax"], "grid_h_per_year": m["grid_h_per_year"],
            "comp_kWh_day": m["comp_kWh_day"], "wax_sunset_mean_pct": float(sunset.mean()), "wax_sunset_worst_pct": float(sunset.min()),
            "hottest_night_room_max_C": float(H.T_room[nm].max()), "h_outside_2_8_loading": m["h_outside_2_8_loading"],
            "h_outside_2_8_other": m["h_outside_2_8_other"], "saved_vs_grid_INR_yr": mo["saved_vs_grid_INR_yr"],
            "saved_vs_diesel_INR_yr": mo["saved_vs_diesel_INR_yr"], "energy_balance_error_pct": T["energy_balance_error_pct"]}


_G = {}


def _init():
    _G["cfg"] = load_config()
    _G["B"] = SE.load_budget()
    _G["w"] = study_weather()
    _G["cs"] = SE.clear_sky_ghi(_G["w"]["time_ist"], _G["cfg"])
    _G["night"] = hottest_night(_G["w"])


def _random(k):
    if not _G:
        _init()
    B = _G["B"]
    w = SE.random_case(_G["w"], _G["cfg"], B, B["random_runs"]["seed"], k, cs=_G["cs"])
    return run_case(w, _G["cfg"], _G["night"])


def run(n=None, procs=None):
    _init()
    cfg, B, w, night = _G["cfg"], _G["B"], _G["w"], _G["night"]
    n = B["random_runs"]["n"] if n is None else n
    cases = {"base": run_case(w, cfg, night),
             "hot_site": run_case(SE.site_case(w, cfg, B, "hot"), cfg, night),
             "cool_site": run_case(SE.site_case(w, cfg, B, "cool"), cfg, night)}
    with Pool(procs or max(1, (os.cpu_count() or 2)), initializer=_init) as p:
        runs = p.map(_random, range(n))
    R = {k: np.array([r[k] for r in runs], dtype=float) for k in KEYS}
    rnd = {"n": n, "seed": B["random_runs"]["seed"], "correlation_hours": B["random_runs"]["correlation_hours"],
           "median": {k: float(np.median(v)) for k, v in R.items()},
           "p5": {k: float(np.percentile(v, 5)) for k, v in R.items()},
           "p95": {k: float(np.percentile(v, 95)) for k, v in R.items()}}

    def rng_of(k):
        vals = [cases["hot_site"][k], cases["cool_site"][k], rnd["p5"][k], rnd["p95"][k]]
        return [min(vals), max(vals)]

    days = cases["base"]["days"]
    worst_days = min(cases["hot_site"]["days_full_solar_wax"], cases["cool_site"]["days_full_solar_wax"], rnd["p5"]["days_full_solar_wax"])
    worst_grid = max(cases["hot_site"]["grid_h_per_year"], cases["cool_site"]["grid_h_per_year"], rnd["p95"]["grid_h_per_year"])
    worst_other = max(cases["hot_site"]["h_outside_2_8_other"], cases["cool_site"]["h_outside_2_8_other"], rnd["p95"]["h_outside_2_8_other"])
    verdict = (f"Even with the worst expected site error, the room stays fully on solar + wax on {worst_days:.0f} of {days} days "
               f"(base {cases['base']['days_full_solar_wax']}), grid backup stays at or below {worst_grid:.0f} h/yr "
               f"(base {cases['base']['grid_h_per_year']:.0f}), and the room is outside 2–8 °C for "
               + ("0 h outside the morning loading hours." if worst_other == 0 else f"at most {worst_other:.0f} h outside the morning loading hours."))
    out = {
        "about": "Uncertainty study: digital-twin results (S) on the 2026 weather with the EXPECTED site errors from published "
                 "studies (config/site_error_budget.json). Not measured.",
        "statement": B["statement"], "label": B["label"],
        "weather": str(WEATHER.relative_to(ROOT)), "period": [str(w.time_ist.min()), str(w.time_ist.max())],
        "hottest_night_start": str(night),
        "cases": cases, "random": rnd,
        "range": {k: rng_of(k) for k in KEYS},
        "range_rule": "range = lowest to highest of: hot site, cool site, and the 5–95 % band of the random runs",
        "verdict": verdict,
        "wind_note": "The room model does not use wind (the fins are inside the room and the condenser COP depends on the air "
                     "temperature), so wind errors do not change these results. Wind is still converted to 2 m for display.",
        "case_rules": {
            "hot_site": "temperature +1.5 °C all hours (+3 °C on sunny calm hours 11–16 h), dew point +1.0 °C, sunlight −10 % on "
                        "clear days and −30 % on cloudy days, wind at 2 m ×0.75 and −1 m/s (min 0)",
            "cool_site": "temperature −1.5 °C, dew point −1.0 °C, sunlight +10 % clear / +30 % cloudy days (capped at clear sky), "
                         "wind +1 m/s",
            "random": "each hour drawn from a normal distribution with the hourly bands, correlated over ~6 h; median and 5–95 %"},
    }
    OUT.write_text(json.dumps(out, indent=1, default=float))
    return out


def show(o):
    rows = {"base": o["cases"]["base"], "hot site": o["cases"]["hot_site"], "cool site": o["cases"]["cool_site"],
            "random median": o["random"]["median"], "random 5 %": o["random"]["p5"], "random 95 %": o["random"]["p95"]}
    pd.set_option("display.width", 220)
    print(pd.DataFrame(rows).loc[KEYS].round(2).to_string())
    print(o["verdict"])


if __name__ == "__main__":
    show(run())
