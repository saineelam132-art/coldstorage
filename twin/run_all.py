"""Run all Phase 2 studies and save the results in results/.

    python -m twin.run_all

Outputs (results/):
  weather_monthly.csv, day_counts.csv, daily_weather.csv
  year_current_hourly.csv, year_recommended_hourly.csv
  parametric.csv, recommendation.txt, comparisons.csv
  power_cut_night.csv, results_summary.csv
"""
import json
import time
from pathlib import Path

import pandas as pd

from engine.config import load_config, with_overrides
from engine.report import design_point
from twin import studies
from twin.simulate import door_seconds, simulate
from twin.weather import load_weather

ROOT = Path(__file__).resolve().parent.parent
RES = ROOT / "results"


def hourly(df):
    h = df.resample("h").mean(numeric_only=True)
    h["grid_on"] = df["grid_on"].resample("h").mean()
    return h.round(4)


def main():
    t0 = time.time()
    RES.mkdir(exist_ok=True)
    cfg = load_config()
    weather = load_weather(cfg=cfg)
    door = door_seconds(cfg, weather)
    print(f"Weather: {weather.attrs['source_file']}")
    print(f"Random seed {cfg['simulation']['random_seed']}: {door.sum()/3600:.1f} h of door opening per year")

    # 1. weather check
    monthly, counts, days, annual = studies.weather_check(weather, cfg)
    monthly.round(3).to_csv(RES / "weather_monthly.csv")
    counts.to_csv(RES / "day_counts.csv")
    days.round(3).to_csv(RES / "daily_weather.csv")
    print("\nWEATHER CHECK")
    print(monthly.round(2).to_string())
    print(f"Annual GHI 2025 = {annual['ghi_2025_kWh_m2_day']:.2f}, long-term = "
          f"{annual['ghi_longterm_kWh_m2_day']:.2f}, old report = 5.0-5.2 kWh/m2/day")
    print(counts.to_string())

    # 2. current design, full year
    base, base_df = simulate(cfg, weather, door_secs=door)
    hourly(base_df).to_csv(RES / "year_current_hourly.csv")
    print(f"\nCURRENT DESIGN: {base['pct_days_full_solar_pcm']:.1f} % days solar+PCM, "
          f"{base['grid_hours']:.0f} grid h, energy balance error {base['energy_balance_error_pct']:.2e} %")

    # 3. parametric
    print("\nPARAMETRIC STUDY (72 full-year runs) ...")
    par = studies.parametric(cfg, weather, door)
    par.round(3).to_csv(RES / "parametric.csv", index=False)
    par = studies.add_cost(par, cfg)
    par.round(3).to_csv(RES / "parametric.csv", index=False)
    pick, passing = studies.recommend(par, cfg)
    sens = studies.price_sensitivity(par, cfg)
    sens.to_csv(RES / "price_sensitivity.csv", index=False)
    print(sens.to_string(index=False))
    rec_ov = {"pcm": {"mass_kg": float(pick["pcm_mass_kg"])}, "pv": {"rated_kWp": float(pick["pv_kWp"])},
              "refrigeration": {"design_capacity_kW": float(pick["Qmax_kW"])}}
    cfg_rec = with_overrides(cfg, rec_ov)
    (RES / "recommended_overrides.json").write_text(json.dumps(rec_ov, indent=2))
    print(f"Recommended: PCM {pick['pcm_mass_kg']:g} kg, PV {pick['pv_kWp']:g} kWp, "
          f"compressor {pick['Qmax_kW']:g} kW ({pick['grid_hours']:.0f} grid h, {len(passing)} designs pass)")

    rec, rec_df = simulate(cfg_rec, weather, door_secs=door)
    hourly(rec_df).to_csv(RES / "year_recommended_hourly.csv")

    # 4. comparisons
    comp, comp_out = studies.comparisons(cfg_rec, weather, door, cfg_current=cfg)
    comp.round(3).to_csv(RES / "comparisons.csv", index=False)
    print("\nCOMPARISONS")
    print(comp.round(1).to_string(index=False))

    # 5. power-cut night
    cut = studies.power_cut_night(cfg_rec, weather, door)
    day, start, end, traces = cut
    pcn = pd.concat({k: v[["T_out", "T_room", "T_pcm", "pcm_pct"]] for k, v in traces.items()}, axis=1)
    for k, v in traces.items():
        print(f"   {k:28s} max room T during the cut {v.loc[start:end, 'T_room'].max():.2f} C")
    pcn.round(3).to_csv(RES / "power_cut_night.csv")
    print(f"POWER CUT {start} -> {end}")

    # 6. summary (+ files the website reads: design point, what-if table)
    rows = design_point(cfg, include_slab=True)
    from twin import whatif
    clean = [{k: (None if isinstance(v, float) and v != v else v) for k, v in r.items()} for r in rows]   # NaN -> null
    (RES / "design_point.json").write_text(json.dumps(clean, indent=1, allow_nan=False))
    (RES / "whatif.json").write_text(json.dumps(whatif.build(cfg, weather)))
    summ = studies.summary_rows(cfg, annual, counts, base, rec, pick, comp_out, cut, rows)
    old = RES / "results_summary.csv"                          # keep the "Final design (2026)" rows
    if old.exists():                                          # (written by tools/make_final_figures.py)
        prev = pd.read_csv(old)
        summ = pd.concat([summ, prev[prev.section == "Final design (2026)"]], ignore_index=True)
    summ.to_csv(old, index=False, float_format="%.4g")
    (RES / "recommendation.txt").write_text(recommendation_text(cfg, pick, passing, base, rec, sens), encoding="utf-8")
    print(f"\nSaved results to {RES}  ({time.time()-t0:.0f} s)")


def recommendation_text(cfg, pick, passing, base, rec, sens):
    dc = cfg["design_choice"]
    return (
        "RECOMMENDED DESIGN  (rule in twin/studies.py -> recommend)\n"
        f"  PCM {pick['pcm_mass_kg']:g} kg, PV {pick['pv_kWp']:g} kWp, compressor {pick['Qmax_kW']:g} kW\n"
        f"  {rec['pct_days_full_solar_pcm']:.1f} % of days fully on solar + PCM, "
        f"{rec['grid_hours']:.0f} grid hours/yr, {rec['hours_outside_2_8C']:.1f} h outside 2-8 C, "
        f"{rec['solar_wasted_kWh']:.0f} kWh/yr solar not used\n"
        f"  Rule: never outside 2-8 C, grid <= {dc['max_grid_hours_per_year']} h/yr, then cheapest at "
        f"Rs {dc['price_pcm_INR_per_kg']}/kg PCM, Rs {dc['price_pv_INR_per_kWp']}/kWp PV (indicative prices).\n"
        f"  {len(passing)} of 72 designs pass the rule.\n"
        f"CURRENT DESIGN (115 kg, 1.8 kWp, 1.5 kW): {base['pct_days_full_solar_pcm']:.1f} % days, "
        f"{base['grid_hours']:.0f} grid h/yr\n\n"
        "WHAT IF PRICES CHANGE?\n" + sens.to_string(index=False) + "\n"
    )


if __name__ == "__main__":
    main()
