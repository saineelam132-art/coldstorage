"""Reality check: the 2026 year again with each 'loophole' closed one at a time, then all together.

    python -m twin.stress_2026       ->  results/live/stress_2026.json  (+ figures via tools/make_reality_figures.py)

Same frozen study weather and final design as the published base (data/uncertainty/weather_2026_study.csv),
so 'base' reproduces results/live/uncertainty_2026.json exactly (test). Every case switches on options of
twin/live_sim.py (real=...), which are OFF in the base model. Values marked E are assumptions (listed in the
JSON with their numbers). Results are digital-twin (S) or calculated (C); nothing is measured.
"""
import copy
import json
import math
import os
from multiprocessing import Pool
from pathlib import Path

import numpy as np
import pandas as pd

from engine import shelf_life as SL
from engine.config import load_config, load_crops
from twin import design_study_2026 as DS
from twin import site_error as SE
from twin import uncertainty_2026 as U
from twin.live_sim import DT, simulate_live

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "results" / "live" / "stress_2026.json"
SPACE = ROOT / "results" / "live" / "space_budget.json"

# ------------------------------------------------------------------ the loopholes (E = assumption values)
def space():
    if SPACE.exists():
        return json.loads(SPACE.read_text(encoding="utf-8"))
    from engine.space import build
    return build()[0]


def thermal_mass_opts():
    sp = space()
    tm = sp["thermal_mass"]
    return {"extra_C_room_kJ_K": tm["rack_kJ_K"], "crate": {"kg_per_crate": sp["kg_per_crate"], "kJ_K_each": tm["crate_kJ_K_each"]},
            "crop_cp": True}


W_OUT, W_IN = 30.8, 25.6
CASES = {
    "base": {"label": "Base model (as published)", "real": {}},
    "precool": {"label": "Pre-cool to 3 °C from 05:00 before the batch", "real": {"precool": {"from_h": 5, "target_C": 3.0}},
                "E": "pre-cool 05:00–06:00 to 3 °C; grid allowed at dawn (no sun)"},
    "thermal_mass": {"label": "Racks + crates + pomegranate (Part C)", "real": "TM", "crop": "pomegranate",
                     "E": "2 racks × 25 kg steel (0.50 kJ/kg·K) follow the room air; crates 1.8 kg PP (1.9 kJ/kg·K) arrive with the produce; pomegranate cp 3.56, respiration 17.8 mW/kg at 5 °C"},
    "walls": {"label": "Walls: outside area 30.8 m² + 10 % thermal bridges", "real": {"wall_factor": W_OUT / W_IN * 1.10},
              "E": "+10 % for corners and the door frame"},
    "door": {"label": "Door: 8 openings × 20 s a day, worn curtain (E = 0.70)",
             "real": {"door_times": [[6, 0], [6, 10], [8, 0], [10, 0], [12, 0], [14, 0], [16, 0], [17, 0]], "door_seconds": 20, "curtain_E": 0.70},
             "E": "opening times 06:00, 06:10, 08, 10, 12, 14, 16, 17 h"},
    "fans_lights": {"label": "Fans and lights: coil fan 30 W, 10 W circulation fan, lights only at the door, controller 10 W",
                    "real": {"evap_fan_W": 30, "circ_fan_W": 10, "lights_door_only": True, "controller_W": 10},
                    "E": "circulation fan 10 W day and night (on the 12 V battery), controller 10 W"},
    "defrost": {"label": "Defrost: 2 × 20 min a day (off-cycle)", "real": {"defrost": {"times": [[3, 0], [15, 0]], "minutes": 20, "heater_W": 0, "fan_on": True}},
                "E": "off-cycle defrost at 03:00 and 15:00: compressor stopped 20 min, coil fan keeps running (its heat counted), no heater – usual for rooms kept above 2 °C"},
    "defrost_heater": {"label": "Defrost with a 250 W electric heater (2 × 20 min)", "real": {"defrost": {"times": [[11, 0], [15, 0]], "minutes": 20, "heater_W": 250}},
                       "E": "electric defrost at 11:00 and 15:00 (on solar), 250 W, ALL heat into the room air (worst case)"},
    "wax_real": {"label": "Wax real-life: 90 % of latent heat, melts over 3–5 °C, fins 25 % weaker",
                 "real": {"latent_frac": 0.90, "melt_range_C": [3.0, 5.0], "fin_UA_frac": 0.75}},
    "machine_real": {"label": "Machine real-life: start losses, COP −10 % when hot, PV dust + 3 % wiring loss",
                     "real": {"start_loss_frac": 0.20, "cop_hot_penalty": {"above_T_out_C": 35.0, "frac": 0.10},
                              "pv_dust_per_day": 0.003, "pv_clean_days": 7, "pv_wiring_loss": 0.03},
                     "E": "each start loses the first minute of cooling (20 % of that 5-min step; minimum run = 5 min); COP −10 % above 35 °C outside (condensing > 45 °C); dust 0.3 %/day, cleaned every 7 days; wiring/controller 3 %"},
    "weather_hot": {"label": "Weather error: hot site (+1.5 °C, sun −10 % clear / −30 % cloudy)", "real": {}, "weather": "hot"},
    "load_var": {"label": "Load varies 50–250 kg a day (mean 150), produce at the day's outside temperature",
                 "real": {"intake_random": [50.0, 250.0, 2026]}, "E": "uniform 50–250 kg, fixed seed 2026"},
    "thermostat": {"label": "Thermostat band ±1 °C around 5 °C (on/off)", "real": {"band_K": 1.0}},
    "no_grid": {"label": "No grid at all (power-cut village)", "real": {"no_grid": True}},
    "controller_fix": {"label": "Smart controller: grid only after 15 min above 7.5 °C, sun first, grid off again below 6 °C",
                       "real": {"ats_release_C": 6.0, "ats_delay_steps": 3, "solar_first": True},
                       "E": "proposed software change, not in the base design"},
}
ALL = ["thermal_mass", "walls", "door", "fans_lights", "defrost", "wax_real", "machine_real", "weather_hot", "load_var", "thermostat"]
CASES["realistic"] = {"label": "REALISTIC: all of the above together (grid allowed)", "all": True}
CASES["realistic_no_grid"] = {"label": "REALISTIC + no grid", "all": True, "extra": {"no_grid": True}}
CASES["realistic_precool"] = {"label": "REALISTIC + pre-cool", "all": True, "extra": {"precool": {"from_h": 5, "target_C": 3.0}}}
SMART = {"ats_release_C": 6.0, "ats_delay_steps": 3, "solar_first": True}
CASES["realistic_fix"] = {"label": "REALISTIC + smart controller", "all": True, "extra": dict(SMART)}
CASES["realistic_fix_no_grid"] = {"label": "REALISTIC + smart controller, no grid", "all": True, "extra": {**SMART, "no_grid": True}}


def spec_of(name):
    """-> (real options, weather kind or None, crop key or None)."""
    c = CASES[name]
    if c.get("all"):
        real, wkind, crop = {}, None, None
        for k in ALL:
            r, w, cr = spec_of(k)
            real.update(r)
            wkind = wkind or w
            crop = crop or cr
        real.update(c.get("extra", {}))
        return real, wkind, crop
    real = thermal_mass_opts() if c["real"] == "TM" else copy.deepcopy(c["real"])
    return real, c.get("weather"), c.get("crop")


# ------------------------------------------------------------------ metrics
def freshness_lost(S, bt, crop, dwell=1, cfg=None):
    """Mean freshness lost (pomegranate model) per batch while in the room: the first day with the produce core
    temperature, later days (if it stays longer) at the room air temperature. RH = 90 %; air speed 1.0 m/s
    while the coil fan runs, else 0.5 m/s."""
    tr = (cfg or load_config())["trust"]
    Tr, Tb, run = S["T_room"].values, S["T_batch"].values, S["running"].values
    spd = int(86400 / DT)
    out = []
    for b in bt["step"].values if "step" in bt else []:
        F = SL.Freshness(crop)
        for i in range(int(b), min(len(Tr), int(b) + dwell * spd)):
            core = Tb[i] if i < b + spd else Tr[i]
            F.step(Tr[i], 90.0, tr["produce_air_speed_fan_on_m_s"] if run[i] > 0.5 else tr["produce_air_speed_fan_off_m_s"], DT / 3600.0, T_core=core)
        out.append(100.0 - F.value)
    return float(np.mean(out)) if out else None


def metrics(H, T, bt, Hg, cfg, night, crop, dwell=1, money=True):
    ld = cfg["live_run"]["loading"]
    m = DS.metrics(H, T, bt, ld)
    n = m["days"]
    hod = H.time_ist.dt.hour
    nm = (H.time_ist >= night) & (H.time_ist < night + pd.Timedelta(hours=11))
    p_used = H.P_solar_used.sum() / n
    pv = H.P_pv.sum() / n
    o = {
        "days": n, "days_full_solar_wax": m["days_full_solar_wax"], "grid_h_per_year": m["grid_h_per_year"],
        "grid_kWh_per_year": float(H.P_grid.sum() * 365 / n), "comp_kWh_day": m["comp_kWh_day"],
        "solar_available_kWh_day": float(pv), "solar_used_kWh_day": float(p_used), "solar_wasted_kWh_day": float(pv - p_used),
        "solar_used_pct": float(100 * p_used / pv) if pv else 0.0,
        "wax_sunrise_mean_pct": float(H.pcm_pct[hod == 6].mean()), "wax_sunrise_worst_pct": float(H.pcm_pct[hod == 6].min()),
        "wax_sunset_mean_pct": float(H.pcm_pct[hod == 18].mean()), "wax_sunset_worst_pct": float(H.pcm_pct[hod == 18].min()),
        "air_above_8C_h_day": float((H.T_room > 8).sum() / n), "produce_above_8C_h_day": float((H.T_batch > 8).sum() / n),
        "air_outside_2_8_h_day": float(((H.T_room > 8) | (H.T_room < 2)).sum() / n),
        "hottest_night_room_max_C": float(H.T_room[nm].max()),
        "produce_cool_h_avg": float(bt.cool_h.mean()), "produce_cool_h_worst": float(bt.cool_h.max()),
        "batches_above_8C_after_4h": int(((bt.T_after_4h_C > 8)).sum()),
        "freshness_lost_pct_per_batch": freshness_lost(T["steps"], bt.assign(step=T["_bt_steps"]), crop, dwell, cfg),
        "h_outside_2_8_loading": m["h_outside_2_8_loading"], "h_outside_2_8_other": m["h_outside_2_8_other"],
        "energy_balance_error_pct": m["energy_balance_error_pct"],
    }
    if money and Hg is not None:
        mo = DS.money(H, Hg, cfg["live_run"]["money"])
        o.update({"saved_vs_grid_INR_yr": mo["saved_vs_grid_INR_yr"], "saved_vs_diesel_INR_yr": mo["saved_vs_diesel_INR_yr"]})
    return o


def produce_8h(S, bt):
    """Hours until the produce core of each batch is at or below 8 °C (None if not within 24 h)."""
    Tb = S["T_batch"].values
    out = []
    for b in bt:
        seg = Tb[int(b):int(b) + 288]
        k = np.where(seg <= 8.0)[0]
        out.append(k[0] * DT / 3600.0 if len(k) else None)
    return out


def run_one(name_or_spec, cfg=None, w=None, night=None, dwell=1, extra=None, crop_key=None, money=True):
    """Run one case (name or (real, weather kind, crop)) over the study year -> metrics dict."""
    cfg = cfg or load_config()
    w = U.study_weather() if w is None else w
    night = U.hottest_night(w) if night is None else night
    real, wkind, crop = spec_of(name_or_spec) if isinstance(name_or_spec, str) else name_or_spec
    real = dict(real)
    real.update(extra or {})
    crop = crop_key or crop
    if dwell > 1:
        real["dwell_days"] = dwell
    ww = SE.site_case(w, cfg, SE.load_budget(), wkind) if wkind else w
    H, T, _, bt = simulate_live(ww, "current", cfg=cfg, crop_key=crop, steps=True, real=real)
    # the batches table has no step numbers: rebuild them from the loading hour
    S = T["steps"]
    lh = cfg["live_run"]["loading"][0]["hour"]
    steps = [i for i in np.where((S.index.hour == lh) & (S.index.minute == 0))[0]]
    T["_bt_steps"] = steps[: len(bt)]
    Hg = None
    if money:
        rg = {k: v for k, v in real.items() if k not in ("no_grid", "precool")}
        Hg = simulate_live(ww, "current", mode="grid_only", cfg=cfg, crop_key=crop, real=rg)[0]
    croppom = load_crops()["pomegranate"]
    o = metrics(H, T, bt, Hg, cfg, night, croppom, dwell=dwell, money=money)
    c8 = produce_8h(S, T["_bt_steps"])
    ok = [x for x in c8 if x is not None]
    o["produce_to_8C_h_avg"] = float(np.mean(ok)) if ok else None
    o["produce_to_8C_h_worst"] = float(max(ok)) if ok and len(ok) == len(c8) else None
    o["batches_over_8h_to_8C"] = int(sum(1 for x in c8 if x is None or x > 8))
    o["_H"] = H
    return o


def energy_day(H, cfg):
    """Hour-by-hour energy picture of an average day, a clear summer day and a monsoon day (+ Sankey numbers)."""
    days = H.time_ist.dt.date
    day_pv = H.groupby(days).P_pv.sum()
    summer = [d for d in day_pv.index if d.month in (4, 5, 6)]
    clear = max(summer, key=lambda d: day_pv[d]) if summer else day_pv.idxmax()
    mons = [d for d in day_pv.index if d.month in (7, 8)]
    monsoon = min(mons, key=lambda d: day_pv[d]) if mons else day_pv.idxmin()
    cols = {"pv_available_kW": "P_pv", "pv_used_kW": "P_solar_used", "compressor_kW": "P_comp", "cold_to_room_kW": "Q_air",
            "cold_into_wax_kW": "Q_ch", "cold_wax_to_room_kW": "Q_pcm_room", "grid_kW": "P_grid"}
    def prof(sel):
        d = H[sel].groupby(H[sel].time_ist.dt.hour)
        o = {k: [round(float(x), 4) for x in d[c].mean().values] for k, c in cols.items()}
        o["pv_wasted_kW"] = [round(a - b, 4) for a, b in zip(o["pv_available_kW"], o["pv_used_kW"])]
        return o
    hod = H.time_ist.dt.hour
    n = days.nunique()
    day = (hod >= 6) & (hod < 18)
    lh = cfg["live_run"]["loading"][0]["hour"]
    batch = (hod >= lh) & (hod < lh + 4)
    pv, used = H.P_pv.sum() / n, H.P_solar_used.sum() / n
    qa, qc, qw = H.Q_air.sum() / n, H.Q_ch.sum() / n, H.Q_pcm_room.clip(lower=0).sum() / n
    sankey = {"solar_available_kWh": pv, "solar_used_kWh": used, "solar_wasted_kWh": pv - used,
              "used_for_room_kWh": used * qa / max(qa + qc, 1e-9), "used_for_wax_kWh": used * qc / max(qa + qc, 1e-9),
              "cold_direct_to_room_kWh": qa, "cold_into_wax_kWh": qc,
              "cold_wax_to_room_day_kWh": H.Q_pcm_room.clip(lower=0)[day].sum() / n,
              "cold_wax_to_room_night_kWh": H.Q_pcm_room.clip(lower=0)[~day].sum() / n,
              "cold_for_6am_batch_kWh": H.Q_batch.clip(lower=0)[batch].sum() / n,
              "grid_kWh": H.P_grid.sum() / n}
    return {"average_day": prof(slice(None)), "clear_summer_day": {"date": str(clear), **prof(days == clear)},
            "monsoon_day": {"date": str(monsoon), **prof(days == monsoon)},
            "sankey_average_day_kWh": {k: round(float(v), 4) for k, v in sankey.items()}}


_G = {}


def _init():
    _G["cfg"] = load_config()
    _G["w"] = U.study_weather()
    _G["night"] = U.hottest_night(_G["w"])


def _case(name):
    if not _G:
        _init()
    o = run_one(name, _G["cfg"], _G["w"], _G["night"])
    H = o.pop("_H")
    if name == "base":
        o["_energy_day"] = energy_day(H, _G["cfg"])
    return name, o


SENT = {
    "days_full_solar_wax": lambda b, c: f"{c - b:+d} days on solar + wax",
    "grid_h_per_year": lambda b, c: f"{c - b:+.0f} grid h/yr",
}


def plain_line(name, base, c):
    if name == "base":
        return "The published model."
    d = c["days_full_solar_wax"] - base["days_full_solar_wax"]
    g = c["grid_h_per_year"] - base["grid_h_per_year"]
    a = c["air_above_8C_h_day"] - base["air_above_8C_h_day"]
    p = c["produce_above_8C_h_day"] - base["produce_above_8C_h_day"]
    s = f"{CASES[name]['label']}: {d:+d} days on solar + wax, {g:+.0f} grid h/yr, air above 8 °C {a:+.1f} h/day, produce above 8 °C {p:+.1f} h/day"
    if c.get("days_full_solar_wax") is not None and name.endswith("no_grid") or name == "no_grid":
        s += f"; with no grid the air is above 8 °C {c['air_above_8C_h_day']:.1f} h/day and each batch loses {c['freshness_lost_pct_per_batch']:.1f} % freshness"
    return s + "."


def spec_without(skip, extra):
    """REALISTIC (+extra) with one loophole left out -> (real, weather kind, crop)."""
    real, wkind, crop = {}, None, None
    for k in ALL:
        if k == skip:
            continue
        r, w, cr = spec_of(k)
        real.update(r)
        wkind = wkind or w
        crop = crop or cr
    real.update(extra)
    return real, wkind, crop


def _loo(skip):
    if not _G:
        _init()
    o = run_one(spec_without(skip, dict(SMART)), _G["cfg"], _G["w"], _G["night"], money=False)
    o.pop("_H")
    return skip, {k: o[k] for k in ("days_full_solar_wax", "grid_h_per_year", "air_above_8C_h_day", "produce_above_8C_h_day")}


def run(procs=None):
    _init()
    names = list(CASES)
    with Pool(procs or max(1, min(len(names), os.cpu_count() or 2)), initializer=_init) as p:
        res = dict(p.map(_case, names))
        loo = dict(p.map(_loo, ALL))
    energy = res["base"].pop("_energy_day")
    base = res["base"]
    rows = {k: {"label": CASES[k]["label"], "line": plain_line(k, base, v), "E": CASES[k].get("E"), **v} for k, v in res.items()}
    w = _G["w"]
    out = {
        "about": "Reality check (stress cases): digital twin (S) on the frozen 2026 study weather "
                 f"({str(w.time_ist.min())[:10]} to {str(w.time_ist.max())[:10]}, {base['days']} days), final design. "
                 "Each case changes one thing; REALISTIC changes all of them together. Values marked E are assumptions.",
        "cases": rows, "order": names, "all_together": ALL,
        "energy_day": energy,
        "leave_one_out": {"about": "REALISTIC + smart controller, with ONE loophole left out: how many days come back tells how big that loophole is.",
                          "with_all": {k: res["realistic_fix"][k] for k in ("days_full_solar_wax", "grid_h_per_year", "air_above_8C_h_day", "produce_above_8C_h_day")},
                          "without": loo},
        "headline": {"base_days": base["days_full_solar_wax"], "realistic_days": res["realistic"]["days_full_solar_wax"],
                     "realistic_fix_days": res["realistic_fix"]["days_full_solar_wax"], "days": base["days"]},
        "notes": {
            "field_temperature": "Produce already arrives at the outside air temperature of that morning (not a fixed 25 °C) in the base model.",
            "controller_12V": "The 12 V controller, sensors and gateway (10 W) are on the battery in the base model; their heat in the room "
                              "was 5 W (controller) – the fans_lights case uses 10 W.",
            "start_loss": "Interpreted as: the first minute of every compressor start gives power but no cold (20 % of that 5-minute step).",
            "days_counted": "The study weather ends on 6 Nov 2026 (310 days), the same frozen file as the published base, so results are repeatable.",
        },
    }
    OUT.write_text(json.dumps(out, indent=1, default=float, ensure_ascii=False), encoding="utf-8")
    return out


def show(o):
    keys = ["days_full_solar_wax", "grid_h_per_year", "grid_kWh_per_year", "comp_kWh_day", "solar_used_pct", "wax_sunset_worst_pct",
            "air_above_8C_h_day", "produce_above_8C_h_day", "hottest_night_room_max_C", "freshness_lost_pct_per_batch",
            "saved_vs_grid_INR_yr", "saved_vs_diesel_INR_yr"]
    df = pd.DataFrame({k: {kk: o["cases"][k].get(kk) for kk in keys} for k in o["order"]}).T
    pd.set_option("display.width", 250)
    print(df.round(2).to_string())
    print("leave one out (realistic + fix):", json.dumps(o["leave_one_out"], default=float)[:1500])


if __name__ == "__main__":
    show(run())
