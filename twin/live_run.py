"""Live Year Run: run the twin on real 2026 weather (+ today's and tomorrow's forecast) and on the
ISHRAE design year, then save everything the website needs as small files.

    python -m twin.live_run            (uses the saved weather; offline is fine)
    python -m twin.live_run --fetch    (download new weather first; needs internet)

Output:
  web/live/data/*.js        what the Live Year Run page reads (works from file:// too)
  results/live/*.csv/json   the same numbers as tables, for checking and the poster
"""
import argparse
import datetime as dt
import json
import math
from pathlib import Path

import numpy as np
import pandas as pd

from engine.config import load_config
from twin import live_weather as LW
from twin.live_sim import simulate_live

ROOT = Path(__file__).resolve().parent.parent
WEB = ROOT / "web" / "live" / "data"
RES = ROOT / "results" / "live"
DESIGNS = ("current", "recommended")
HOURLY_FIELDS = ["T_out", "RH_out", "ghi", "wind", "T_room", "T_batch", "pcm_pct", "Q_wall", "Q_door", "Q_batch", "Q_resp",
                 "Q_int", "Q_load", "Q_cool", "Q_ch", "Q_pcm_room", "comp_speed_pct", "P_comp", "COP", "P_evap_bar",
                 "P_cond_bar", "T_cond_C", "T_discharge_C", "P_pv", "P_solar_used", "P_grid", "grid_on", "door_s", "running_h"]


def r(x, nd=3):
    if x is None:
        return None
    x = float(x)
    return None if (math.isnan(x) or math.isinf(x)) else round(x, nd)


def clean(o):
    """numpy numbers -> plain Python; NaN/inf -> None (so the files are valid JSON)."""
    if isinstance(o, dict):
        return {str(k): clean(v) for k, v in o.items()}
    if isinstance(o, (list, tuple)):
        return [clean(v) for v in o]
    if isinstance(o, (bool, np.bool_)):
        return bool(o)
    if isinstance(o, (int, np.integer)):
        return int(o)
    if isinstance(o, (float, np.floating)):
        return None if (math.isnan(o) or math.isinf(o)) else float(o)
    return o


def write_js(name, obj):
    WEB.mkdir(parents=True, exist_ok=True)
    txt = json.dumps(clean(obj), separators=(",", ":"), allow_nan=False)
    (WEB / f"{name}.js").write_text(f"(window.LIVE=window.LIVE||{{}})[{json.dumps(name)}]={txt};\n", encoding="utf-8")


def daily(H, bt, cfg, now):
    lr = cfg["live_run"]
    loading = lr.get("loading_window_h", 3)
    d = H.assign(date=H.time_ist.dt.date.astype(str), hod=H.time_ist.dt.hour)
    d["deliv"] = d.Q_pcm_room.clip(lower=0)
    d["deliv_nosun"] = d.deliv * (d.solar_ok < 0.5)
    hot = (d.T_room > lr["band_C"][1]) | (d.T_room < lr["band_C"][0])
    d["hot_load"] = hot & d.hod.between(lr["swap_hour"], lr["swap_hour"] + loading - 1)
    d["hot_other"] = hot & ~d.hot_load
    in_load = d.hod.between(lr["swap_hour"], lr["swap_hour"] + loading - 1)
    d["grid_load"] = d.grid_on * in_load
    d["grid_other"] = d.grid_on * ~in_load
    g = d.groupby("date")
    m_L = cfg["pcm"]["latent_kJ_kg"] / 3600.0
    D = pd.DataFrame({
        "cool_kWh": g.Q_cool.sum(), "load_kWh": g.Q_load.sum(), "comp_kWh": g.P_comp.sum(), "run_h": g.running_h.sum(),
        "solar_used_kWh": g.P_solar_used.sum(), "grid_kWh": g.P_grid.sum(), "grid_h": g.grid_on.sum(),
        "pv_kWh": g.P_pv.sum(), "wax_stored_kWh": g.Q_ch.sum(), "wax_given_kWh": g.deliv.sum(),
        "wax_given_nosun_kWh": g.deliv_nosun.sum(), "hot_load_h": g.hot_load.sum(), "hot_other_h": g.hot_other.sum(),
        "grid_load_h": g.grid_load.sum(), "grid_other_h": g.grid_other.sum(),
        "T_room_min": g.T_room.min(), "T_room_max": g.T_room.max(), "T_out_max": g.T_out.max(), "T_out_mean": g.T_out.mean(),
        "ghi_kWh_m2": g.ghi.sum() / 1000, "pcm_min": g.pcm_pct.min(), "pcm_end": g.pcm_pct.last(),
        "door_openings": g.door_s.sum() / lr["door_seconds"], "forecast_h": g.is_forecast.sum() if "is_forecast" in d else 0,
        "hours": g.size(),
    })
    D["full_solar_wax"] = D.grid_h <= 1e-9
    D["wax_cycles"] = D.wax_given_kWh / max(1e-9, (H.attrs.get("pcm_kg", 0) or 0) * m_L) if H.attrs.get("pcm_kg") else 0.0
    b = bt.set_index("date")
    D["batch_T_in"] = b.T_in_C.reindex(D.index)
    D["batch_cool_h"] = b.cool_h.reindex(D.index)
    D["status"] = np.where(D.index > str(now.date()), "prediction", np.where(D.index == str(now.date()), "today", "actual"))
    return D


def monthly(D):
    s = D[D.status == "actual"].copy()
    s["month"] = s.index.str[:7]
    g = s.groupby("month")
    M = g[["cool_kWh", "load_kWh", "comp_kWh", "run_h", "solar_used_kWh", "grid_kWh", "grid_h", "pv_kWh", "wax_stored_kWh",
           "wax_given_kWh", "wax_given_nosun_kWh", "hot_load_h", "hot_other_h", "wax_cycles", "ghi_kWh_m2"]].sum()
    M["days"] = g.size()
    M["days_full_solar_wax"] = g.full_solar_wax.sum()
    M["T_out_mean"] = g.T_out_mean.mean()
    M["batch_cool_h_avg"] = g.batch_cool_h.mean()
    M["batch_cool_h_max"] = g.batch_cool_h.max()
    return M


def totals(D, tot):
    a = D[D.status == "actual"]
    ws, wg = a.wax_stored_kWh.sum(), a.wax_given_kWh.sum()
    return {"days": int(len(a)), "first": a.index.min(), "last": a.index.max(),
            "comp_kWh": a.comp_kWh.sum(), "comp_kWh_day_avg": a.comp_kWh.mean(), "comp_kWh_day_max": a.comp_kWh.max(),
            "comp_kWh_day_max_date": a.comp_kWh.idxmax(), "cool_kWh": a.cool_kWh.sum(), "run_h": a.run_h.sum(),
            "solar_used_kWh": a.solar_used_kWh.sum(), "grid_kWh": a.grid_kWh.sum(), "grid_h": a.grid_h.sum(),
            "pv_kWh": a.pv_kWh.sum(), "days_full_solar_wax": int(a.full_solar_wax.sum()),
            "wax_stored_kWh": ws, "wax_given_kWh": wg, "pcm_effectiveness_pct": 100 * wg / ws if ws else None,
            "wax_useful_share_pct": 100 * a.wax_given_nosun_kWh.sum() / wg if wg else None, "wax_cycles": a.wax_cycles.sum(),
            "hot_load_h": a.hot_load_h.sum(), "hot_other_h": a.hot_other_h.sum(),
            "batch_cool_h_avg": a.batch_cool_h.mean(), "batch_cool_h_max": a.batch_cool_h.max(),
            "batch_cool_h_max_date": a.batch_cool_h.idxmax() if a.batch_cool_h.notna().any() else None,
            "batch_not_cooled_days": int(a.batch_cool_h.isna().sum()),
            "energy_balance_error_pct": tot["energy_balance_error_pct"]}


def money_inputs(Hg, D_designs, cfg):
    """Per actual day: grid-only room kWh in each hour (for any power-cut window) and our grid kWh."""
    a = Hg.assign(date=Hg.time_ist.dt.date.astype(str), hod=Hg.time_ist.dt.hour)
    piv = a.pivot_table(index="date", columns="hod", values="P_comp", aggfunc="sum").fillna(0.0)
    days = [d for d in piv.index if D_designs["current"].loc[d, "status"] == "actual"] if len(piv) else []
    return {"days": days, "gridonly_kWh_by_hour": [[r(x, 4) for x in piv.loc[d].reindex(range(24), fill_value=0).values] for d in days],
            "ours_grid_kWh": {k: [r(D.loc[d, "grid_kWh"], 4) for d in days] for k, D in D_designs.items()},
            "defaults": cfg["live_run"]["money"]}


def jsonable(df):
    return {"index": list(df.index), "columns": list(df.columns),
            "data": [[r(v) if isinstance(v, (int, float, np.floating, np.integer)) and not isinstance(v, (bool, np.bool_)) else
                      (bool(v) if isinstance(v, (bool, np.bool_)) else v) for v in row] for row in df.itertuples(index=False)]}


def run(fetch=False, now=None):
    cfg = load_config()
    now = now or LW.now_ist()
    meta_w = LW.update(verbose=True) if fetch else json.loads((LW.LIVE / "weather_meta.json").read_text())
    W = LW.load_actual(now.date())
    out = {"generated": now.strftime("%Y-%m-%d %H:%M IST"), "weather": meta_w, "credit": LW.CREDIT,
           "inputs": cfg["live_run"], "pcm": {k: cfg["pcm"][k] for k in ("latent_kJ_kg", "T_melt_C", "slab_area_m2")},
           "designs": {}, "design_year": {}}
    RES.mkdir(parents=True, exist_ok=True)
    D_all, H_all = {}, {}
    for des in DESIGNS:
        H, tot, end, bt = simulate_live(W, des, cfg=cfg)
        H.attrs["pcm_kg"] = cfg["live_run"]["designs"][des]["pcm_kg"]
        D = daily(H, bt, cfg, now)
        M = monthly(D)
        D_all[des], H_all[des] = D, H
        out["designs"][des] = {"label": cfg["live_run"]["designs"][des]["label"], "totals": {k: (r(v) if isinstance(v, float) else v) for k, v in totals(D, tot).items()},
                               "monthly": jsonable(M), "daily": jsonable(D)}
        D.to_csv(RES / f"daily_{des}.csv"); M.to_csv(RES / f"monthly_{des}.csv")
        H.to_csv(RES / f"hourly_{des}.csv", index=False, float_format="%.4g")
    Hg, totg, _, btg = simulate_live(W, "current", mode="grid_only", cfg=cfg)
    out["grid_only"] = {"totals": {k: (r(v) if isinstance(v, float) else v) for k, v in totals(daily(Hg, btg, cfg, now), totg).items()}}
    out["money"] = money_inputs(Hg, D_all, cfg)

    # ---- design year (ISHRAE): results only, never the weather itself (licence)
    try:
        E = LW.load_ishrae()
        for des in DESIGNS:
            He, tote, _, bte = simulate_live(E, des, cfg=cfg)
            De = daily(He.assign(is_forecast=False), bte, cfg, dt.datetime(2027, 1, 1))
            Me = monthly(De)
            out["design_year"][des] = {"totals": {k: (r(v) if isinstance(v, float) else v) for k, v in totals(De, tote).items()},
                                       "monthly": jsonable(Me)}
            Me.to_csv(RES / f"monthly_design_year_{des}.csv")
    except Exception as e:  # noqa: BLE001
        out["design_year_error"] = str(e)

    # ---- today and tomorrow (tomorrow = PREDICTION from the Open-Meteo forecast through our twin)
    tdy, tmw = str(now.date()), str(now.date() + dt.timedelta(days=1))
    out["today"], out["tomorrow"] = tdy, tmw
    out["prediction_label"] = ("PREDICTION: Open-Meteo weather forecast run through our physics twin "
                               "(not measured, not AI).")
    for des in DESIGNS:
        D = D_all[des]
        out["designs"][des]["tomorrow"] = {k: r(D.loc[tmw, k]) if tmw in D.index else None for k in
                                           ("load_kWh", "cool_kWh", "comp_kWh", "pv_kWh", "solar_used_kWh", "grid_kWh", "grid_h",
                                            "T_room_min", "T_room_max", "pcm_end", "pcm_min", "T_out_max", "ghi_kWh_m2", "batch_cool_h")}
    write_js("summary", out)

    # ---- hourly per month (calendar) for both designs
    for des in DESIGNS:
        H = H_all[des]
        H = H.assign(month=H.time_ist.dt.strftime("%Y-%m"))
        for mon, g in H.groupby("month"):
            rows = {"t": g.time_ist.dt.strftime("%Y-%m-%d %H").tolist(),
                    "pred": [bool(x) for x in g.get("is_forecast", pd.Series(False, index=g.index))],
                    "src": g.get("source", pd.Series("", index=g.index)).fillna("").tolist()}
            for f in HOURLY_FIELDS:
                rows[f] = [r(x) for x in g[f].values]
            write_js(f"h_{des}_{mon}", rows)
    (RES / "summary.json").write_text(json.dumps(clean(out), indent=1, allow_nan=False))
    return out


def print_summary(out):
    print(f"\nLIVE YEAR RUN  (generated {out['generated']}, weather: {out['credit']})")
    for des in DESIGNS:
        t = out["designs"][des]["totals"]
        print(f"  {out['designs'][des]['label']}: {t['days']} days {t['first']} -> {t['last']}")
        print(f"     compressor {t['comp_kWh_day_avg']:.2f} kWh/day avg, {t['comp_kWh_day_max']:.2f} max ({t['comp_kWh_day_max_date']}); "
              f"grid {t['grid_h']:.0f} h / {t['grid_kWh']:.1f} kWh; days fully solar+wax {t['days_full_solar_wax']}")
        print(f"     batch cooling to 5.5 C: avg {t['batch_cool_h_avg']:.1f} h, worst {t['batch_cool_h_max']:.1f} h ({t['batch_cool_h_max_date']}); "
              f"hours outside 2-8 C: loading {t['hot_load_h']:.0f}, other {t['hot_other_h']:.0f}; "
              f"PCM effectiveness {t['pcm_effectiveness_pct']:.1f} %, no-sun share {t['wax_useful_share_pct']:.0f} %; "
              f"energy balance error {t['energy_balance_error_pct']:.1e} %")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--fetch", action="store_true", help="download new weather first")
    a = ap.parse_args()
    print_summary(run(fetch=a.fetch))
