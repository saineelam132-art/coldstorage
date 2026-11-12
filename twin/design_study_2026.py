"""Design study on real 2026 weather (sunlight corrected to NASA level), final design = finned wax panels:
  1. loading options for 150 kg (8 am, 6 am, 4 am, 75 kg 6 am + 75 kg 6 pm)
  2. DESIGN JOURNEY: plain panels -> baffle + 5 night fans -> finned panels (+ checks: fins 25 % weaker,
     with the 2 optional fans)
  3. wax size: 115 kg + 1.8 kWp vs 172 kg + 2.1 kWp
  4. 12 V battery size for controller + sensors + IoT gateway
  5. floor space: keep-clear zone in front of the fins, does 150 kg of crates fit?

    python -m twin.design_study_2026        ->  results/live/design_study_2026.json + tables printed
"""
import json
import math
from pathlib import Path

import numpy as np
import pandas as pd

from engine.config import load_config
from twin import live_weather as LW
from twin.live_sim import simulate_live, published_cfg

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
            "note": "LiFePO4 12.8 V, 80 % usable: worst night + one reserve day of all 12 V loads (controller, sensors, IoT gateway; plus any wax fans)."}


def floor_check(cfg):
    """Floor space left after wax panels + fins + 10 cm keep-clear zone, and whether 150 kg of crates fits.
    Panels: 12 m2 at the configured height (1.7 m tall = 7.06 m of wall). Crate: standard 600 x 400 x 300 mm plastic crate, about
    20 kg of produce each (ASSUMPTION - check with the crop), stacked at most 4 high (1.2 m)."""
    lr, hx, pc = cfg["live_run"], cfg["live_run"]["wax_hx"], cfg["pcm"]
    ch = cfg["chamber"]
    W, L, Hh = ch["width_m"], ch["length_m"], ch["height_m"]
    door_w = cfg["door"]["width_m"] if "door" in cfg and "width_m" in cfg["door"] else 0.8
    wall_len = 2 * (W + L) - door_w
    need_len = pc["slab_area_m2"] / hx["L"]
    wax_t = lr["designs"]["current"]["pcm_kg"] / (pc["density_kg_m3"] * pc["slab_area_m2"])
    panel_t = wax_t + 0.003                          # wax + 1.5 mm aluminium skin each side
    band = panel_t + hx["b"] + hx["keep_clear_m"]   # depth taken from the floor along the panel walls
    # panels on the back wall and both side walls, the rest beside the door: keep-clear band on all 4 sides
    usable = (W - 2 * band) * (L - 2 * band)
    crate = {"L": 0.6, "W": 0.4, "H": 0.3, "kg": 20.0}
    n = math.ceil(lr["produce_kg"] / crate["kg"])
    per_stack = 4
    stacks = math.ceil(n / per_stack)
    foot = stacks * crate["L"] * crate["W"]
    aisle = 0.6 * (L - 2 * band)                     # 60 cm walking aisle from the door
    return {"wall_length_available_m": wall_len, "panel_length_needed_m": need_len,
            "panel_bottom_m": hx.get("panel_bottom_m", 0.25), "panel_top_m": hx.get("panel_bottom_m", 0.25) + hx["L"],
            "room_height_m": Hh, "top_gap_m": Hh - hx.get("panel_bottom_m", 0.25) - hx["L"],
            "panels_fit_on_walls": need_len <= wall_len, "wax_thickness_mm": wax_t * 1000,
            "band_from_wall_m": band, "floor_m2": W * L, "usable_floor_m2": usable, "crates": n, "stacks_of_4": stacks,
            "crate_footprint_m2": foot, "aisle_m2": aisle, "free_after_crates_and_aisle_m2": usable - foot - aisle,
            "fits_150kg": usable - foot - aisle >= 0,
            "note": "Crate 600 x 400 x 300 mm with about 20 kg produce (ASSUMPTION), max 4 high; floor stoppers hold crates 10 cm off the fins."}


def run():
    cfg = published_cfg(load_config())
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

    # ---- 2. design journey (default loading)
    ld = cfg["live_run"]["loading"]
    hx = dict(cfg["live_run"]["wax_hx"])
    fan2 = {"name": "120 mm 12 V DC", "d_mm": 120, "flow_m3h": 150, "watts": 3.0, "pressure_Pa": 30, "count": 2}
    import copy as _c
    c7 = _c.deepcopy(cfg)                                  # optional fans: compressor off -> hold 6.5 C at night
    c7["live_run"]["night_fan"].update(cfg["live_run"]["wax_hx"]["optional_fans"]["rule"])
    steps = {
        "1) plain wax panels": (cfg, {"kind": "plain", "L": hx["L"]}, False, 0),
        "2) baffle + 5 night fans": (cfg, {"kind": "baffle"}, True, 5),
        "3) finned panels (final)": (cfg, hx, False, 0),
        "check: fins 25 % weaker": (cfg, {**hx, "h_scale": 0.75}, False, 0),
        "check: fins 25 % weaker + 2 optional fans": (c7, {**hx, "h_scale": 0.75, "fan": fan2}, True, 2),
    }
    Hg0 = simulate_live(w, "current", mode="grid_only", cfg=cfg)[0]
    jr = {}
    for label, (c, h_, on, nfans) in steps.items():
        H, T, _, bt = simulate_live(w, "current", cfg=c, fan_on=on, hx=h_)
        r = {**metrics(H, T, bt, ld), **money(H, Hg0, m)}
        b_ = battery(H, c)
        r.update({"battery_needed_Ah": b_["needed_Ah"], "battery_Ah": b_["chosen_Ah"], "moving_parts": nfans,
                  "UA_3K_W_K": (T["wax_hx"].get("UA_fan_W_K") if h_["kind"] == "baffle"
                                else T["wax_hx"]["calc_3K"]["UA"] * h_.get("h_scale", 1.0))})
        jr[label] = r
        if label.startswith("3)"):
            out["wax_hx"] = T["wax_hx"]
            out["battery"] = b_
    out["journey"] = jr

    # ---- 3. wax size (default loading, finned panels)
    wax = {}
    for des in ("current", "recommended"):
        H, T, _, bt = simulate_live(w, des, cfg=cfg)
        Hg, _, _, _ = simulate_live(w, des, mode="grid_only", cfg=cfg)
        wax[cfg["live_run"]["designs"][des]["label"]] = {**metrics(H, T, bt, ld), **money(H, Hg, m)}
    out["wax_compare"] = wax

    # ---- 4. fin depth / gap table (calculation at 3 K, hottest night)
    from engine import fins as FINS
    from engine import fan as FAN
    R = FAN.wax_resistance(cfg, cfg["live_run"]["designs"]["current"]["pcm_kg"])
    A = cfg["pcm"]["slab_area_m2"]
    ft = {"plain panel": FINS.plain(A, hx["L"], R, 3.0)}
    for b in (0.02, 0.03, 0.04):
        best = FINS.best_spacing(A, hx["L"], b, hx["t"], R, 3.0)[0]
        ft[f"{b * 1000:.0f} mm deep, best gap"] = best
    ft["40 mm deep, 23 mm gap (chosen)"] = FINS.array(A, hx["L"], hx["S"], hx["b"], hx["t"], R, 3.0)
    out["fin_table"] = ft
    out["floor"] = floor_check(cfg)
    RES.mkdir(parents=True, exist_ok=True)
    (RES / "design_study_2026.json").write_text(json.dumps(out, indent=1, default=float))
    return out


if __name__ == "__main__":
    o = run()
    pd.set_option("display.width", 250)
    print(pd.DataFrame(o["loading_options"]).round(2).to_string())
    print(pd.DataFrame(o["journey"]).round(2).to_string())
    print(pd.DataFrame(o["wax_compare"]).round(2).to_string())
    print(pd.DataFrame(o["fin_table"]).round(2).to_string())
    print(json.dumps(o["battery"], indent=1, default=float)); print(json.dumps(o["floor"], indent=1, default=float))
