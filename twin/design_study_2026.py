"""Design study on real 2026 weather (sunlight corrected to NASA level):
  1. night wax fan: with vs without
  2. loading options for 150 kg (8 am, 6 am, 4 am, 75 kg 6 am + 75 kg 6 pm)
  3. wax size with the fan: 115 kg + 1.8 kWp vs 172 kg + 2.1 kWp
  4. 12 V battery size for controller + sensors + IoT gateway + night fan

    python -m twin.design_study_2026        ->  results/live/design_study_2026.json + tables printed
"""
import json
import math
from pathlib import Path

import numpy as np
import pandas as pd

from engine.config import load_config
from twin import live_weather as LW
from twin.live_sim import simulate_live

ROOT = Path(__file__).resolve().parent.parent
RES = ROOT / "results" / "live"
OPTIONS = {
    "a) 150 kg at 8 am": [{"hour": 8, "kg": 150}],
    "b) 150 kg at 6 am": [{"hour": 6, "kg": 150}],
    "c) 150 kg at 4 am": [{"hour": 4, "kg": 150}],
    "d) 75 kg 6 am + 75 kg 6 pm": [{"hour": 6, "kg": 75}, {"hour": 18, "kg": 75}],
}


def actual_weather():
    w = LW.load_actual()
    return w[~w.is_forecast].reset_index(drop=True)          # only real hours for the study


def money(H_ours, H_grid, m):
    n = H_ours.time_ist.dt.date.nunique()
    hod = H_grid.time_ist.dt.hour
    c0, c1 = m["power_cut_hours"]
    cut = H_grid.P_comp[(hod >= c0) & (hod < c1)].sum()
    go = H_grid.P_comp.sum()
    ours = H_ours.P_grid.sum()
    t, d = m["grid_tariff_INR_kWh"], m["diesel_L_per_kWh"]
    cost = {"grid": go * t, "diesel": (go - cut) * t + cut * d * m["diesel_INR_L"], "ours": ours * t}
    co2 = {"grid": go * m["grid_kg_CO2_kWh"], "diesel": (go - cut) * m["grid_kg_CO2_kWh"] + cut * d * m["diesel_kg_CO2_L"],
           "ours": ours * m["grid_kg_CO2_kWh"]}
    yr = 365.0 / n
    return {"saved_vs_grid_INR_yr": (cost["grid"] - cost["ours"]) * yr, "saved_vs_diesel_INR_yr": (cost["diesel"] - cost["ours"]) * yr,
            "co2_saved_vs_grid_kg_yr": (co2["grid"] - co2["ours"]) * yr, "co2_saved_vs_diesel_kg_yr": (co2["diesel"] - co2["ours"]) * yr,
            "gridonly_kWh_day": go / n}


def metrics(H, T, bt, loading):
    days = H.time_ist.dt.date
    n = days.nunique()
    g = H.groupby(days).grid_on.sum()
    hod = H.time_ist.dt.hour
    load_h = set()
    for ev in loading:
        load_h |= {(ev["hour"] + j) % 24 for j in range(3)}
    hot = (H.T_room > 8) | (H.T_room < 2)
    nightmask = (hod >= 19) | (hod < 6)
    # wax cold used before morning: frozen % at 18:00 vs 06:00 next day
    p18 = H[hod == 18].set_index(days[hod == 18]).pcm_pct
    p06 = H[hod == 5].set_index(days[hod == 5]).pcm_pct
    p06.index = pd.to_datetime(p06.index) - pd.Timedelta(days=1)
    p18.index = pd.to_datetime(p18.index)
    j = pd.concat([p18.rename("e"), p06.rename("m")], axis=1).dropna()
    used = ((j.e - j.m) / j.e.clip(lower=1)).clip(0, 1)
    deliv = H.Q_pcm_room.clip(lower=0)
    return {
        "produce_in_C": float((bt.T_in_C * bt.kg).sum() / bt.kg.sum()),
        "h_air_above_8C": int((H.T_room > 8).sum()),
        "h_outside_2_8_loading": int((hot & hod.isin(load_h)).sum()), "h_outside_2_8_other": int((hot & ~hod.isin(load_h)).sum()),
        "produce_avg_C_after_2h": float(bt.T_after_2h_C.mean()),
        "produce_avg_C_after_4h": float(bt.T_after_4h_C.mean()),
        "h_air_above_8C_per_day": float((H.T_room > 8).sum() / n),
        "wax_pct_sunrise": float(H.pcm_pct[hod == 5].mean()), "wax_pct_sunset": float(H.pcm_pct[hod == 18].mean()),
        "cool_h_avg": float(bt.cool_h.mean()), "cool_h_worst": float(bt.cool_h.max()),
        "not_cooled_before_next_load": int(bt.cool_h.isna().sum()),
        "grid_h": float(H.grid_on.sum()), "grid_h_per_year": float(H.grid_on.sum() * 365 / n),
        "days_full_solar_wax": int((g == 0).sum()), "days": int(n),
        "comp_kWh_day": float(H.P_comp.sum() / n),
        "night_room_avg_C": float(H.T_room[nightmask].mean()), "night_room_max_C": float(H.T_room[nightmask].max()),
        "wax_cold_used_before_morning_pct": float(100 * used.mean()),
        "wax_cold_given_night_kWh_day": float(deliv[nightmask].sum() / n),
        "wax_cold_given_kWh_day": float(deliv.sum() / n),
        "fan_kWh_day": float(H.fan_W.sum() / 1000 / n), "fan_run_h_day": float((H.fan_speed > 0).sum() / n),
        "fan_W_avg_when_on": float(H.fan_W[H.fan_speed > 0].mean()) if (H.fan_speed > 0).any() else 0.0,
        "energy_balance_error_pct": T["energy_balance_error_pct"],
    }


def battery(H, cfg):
    """12 V battery: the worst night (18:00 -> 07:00) plus one reserve day of all 12 V loads, LiFePO4 80 % usable."""
    hod = H.time_ist.dt.hour
    night_id = (H.time_ist - pd.Timedelta(hours=18)).dt.date
    night = H[(hod >= 18) | (hod < 7)]
    worst_night_Wh = float(night.groupby(night_id[night.index]).batt12_W.sum().max())
    worst_day_Wh = float(H.groupby(H.time_ist.dt.date).batt12_W.sum().max())
    need_Wh = (worst_night_Wh + worst_day_Wh) / 0.8
    Ah = need_Wh / 12.8
    std = next(s for s in (20, 30, 40, 50, 60, 80, 100, 120, 150, 200) if s >= Ah)
    base = sum(cfg["live_run"]["battery_12V"]["loads_W"].values())
    return {"base_loads_W": base, "worst_night_Wh": worst_night_Wh, "worst_day_Wh": worst_day_Wh,
            "needed_Wh": need_Wh, "needed_Ah": Ah, "chosen_Ah": std, "chosen_kWh": std * 12.8 / 1000,
            "note": "LiFePO4 12.8 V, 80 % usable: worst night + one reserve day of controller, sensors, IoT gateway and night fan."}


def run():
    cfg = load_config()
    w = actual_weather()
    m = cfg["live_run"]["money"]
    out = {"period": [str(w.time_ist.min().date()), str(w.time_ist.max().date())], "sun_factor": cfg["live_run"]["sun_factor"]}

    # ---- 1. loading options (fan on, current design)
    rows = {}
    for name, ld in OPTIONS.items():
        H, T, _, bt = simulate_live(w, "current", cfg=cfg, loading=ld, fan_on=True)
        Hg, _, _, _ = simulate_live(w, "current", mode="grid_only", cfg=cfg, loading=ld)
        rows[name] = {**metrics(H, T, bt, ld), **money(H, Hg, m)}
    out["loading_options"] = rows

    # ---- 2. fan with vs without (default loading)
    ld = cfg["live_run"]["loading"]
    res = {}
    for label, on in (("without fan", False), ("with fan", True)):
        H, T, _, bt = simulate_live(w, "current", cfg=cfg, fan_on=on)
        res[label] = metrics(H, T, bt, ld)
        if on:
            out["fan_sizing"] = T["fan_sizing"]
            out["battery"] = battery(H, cfg)
    out["fan_compare"] = res

    # ---- 3. wax size with the fan (default loading)
    wax = {}
    for des in ("current", "recommended"):
        H, T, _, bt = simulate_live(w, des, cfg=cfg, fan_on=True)
        Hg, _, _, _ = simulate_live(w, des, mode="grid_only", cfg=cfg)
        wax[cfg["live_run"]["designs"][des]["label"]] = {**metrics(H, T, bt, ld), **money(H, Hg, m)}
    out["wax_compare"] = wax

    # ---- 3b. morning assist on/off (final design)
    import copy as _c
    ma = {}
    for lab, val in (("fan only when compressor off", None), ("morning assist above 7 C", 7.0)):
        c = _c.deepcopy(cfg)
        c["live_run"]["night_fan"]["morning_assist_above_C"] = val
        H, T, _, bt = simulate_live(w, "current", cfg=c, fan_on=True)
        ma[lab] = metrics(H, T, bt, ld)
    out["morning_assist"] = ma

    # ---- 4. channel gap (information): fan size for 5, 3, 2 cm
    from engine import fan as FAN
    import copy
    gaps = {}
    for gap in (0.05, 0.03, 0.02):
        c = copy.deepcopy(cfg)
        c["live_run"]["night_fan"]["gap_m"] = gap
        c["live_run"]["night_fan"]["fan"] = None
        f = FAN.size_fan(c, out["fan_sizing"]["T_out_design_night_C"], cfg["live_run"]["designs"]["current"]["pcm_kg"])
        gaps[f"{gap * 100:.0f} cm"] = {"fans": f"{f['fan']['count']} x {f['fan']['name']}", "rated_W": f["fan"]["total_W"],
                                       "W_at_design": f["fan_W_at_design"], "flow_m3h": f["flow_needed_m3h"]}
    out["gap_options"] = gaps
    RES.mkdir(parents=True, exist_ok=True)
    (RES / "design_study_2026.json").write_text(json.dumps(out, indent=1, default=float))
    return out


if __name__ == "__main__":
    o = run()
    pd.set_option("display.width", 250)
    print(pd.DataFrame(o["loading_options"]).round(2).to_string())
    print(pd.DataFrame(o["fan_compare"]).round(3).to_string())
    print(pd.DataFrame(o["wax_compare"]).round(2).to_string())
    print(json.dumps(o["battery"], indent=1, default=float)); print(json.dumps(o["gap_options"], indent=1, default=float))
    f = o["fan_sizing"]; print({k: f[k] for k in ("load_W", "v_needed_m_s", "flow_needed_m3h", "pressure_Pa", "h_fan_W_m2K", "UA_fan_W_K", "h_natural_W_m2K", "UA_natural_W_K", "Q_natural_W", "fan_W_at_design")}, f["fan"])
