"""What-If table for the judges' sliders (computed by the engine for every slider position).

Every combination of
    outside temperature, outside RH, door openings per hour, strip curtain on/off,
    wax (PCM) mass, cloudy day yes/no
is calculated ONCE here with the real engine formulas and saved as a JSON table. The website
(live or static backup) only looks the answer up, so both always show the same numbers.

Outputs per combination:
    load_pulldown_kW  wall + door + produce pull-down + respiration + fans (with new batch)
    load_holding_kW   the same without the new batch
    cop               R290 COP_elec at T_cond = T_out + 10 K
    comp_kW           electricity to cover the pull-down load (compressor capped at its maximum)
    pcm_kWh           cold stored in the full wax (latent + liquid sensible to 8 C)
    backup_h          pcm_kWh / holding load
    pcm_after_night   wax battery % left after a 12-hour night on wax only
    T_room_night      room temperature while cooled by the wax only = T_m + holding / UA_air
    solar_cover_pct   solar electricity of an average sunny / cloudy 2025 day vs the day's compressor need
"""
import itertools
import json
import math

import numpy as np

from engine import loads, r290
from engine.config import load_config, load_crops, with_overrides
from engine.pcm import PCMBattery

GRID = {
    "T_out": [25.0, 27.5, 30.0, 32.5, 35.0, 37.5, 40.0, 42.5, 45.0],
    "RH_out": [50, 65, 80, 95],
    "door_per_h": [0, 2, 4, 6, 10, 15, 20],
    "curtain": [0, 1],
    "pcm_kg": [60, 90, 115, 140, 172, 230],
    "cloudy": [0, 1],
}


def day_solar_kWh(weather, cfg):
    """Average PV energy of a sunny and of a cloudy 2025 day (from the real weather file)."""
    from twin.simulate import daily_poa_kWh, pv_power_array
    P = pv_power_array(cfg, weather["poa"].values, weather["T_out"].values)
    day = weather["time_ist"].dt.normalize()
    pv_day = (P.groupby(day.values).sum() if hasattr(P, "groupby") else
              np.bincount(day.factorize()[0], weights=P))
    dpoa = daily_poa_kWh(weather).values
    dc = cfg["day_classes"]
    sunny = pv_day[dpoa >= dc["sunny_min_kWh_m2"]].mean()
    cloudy = pv_day[(dpoa < dc["sunny_min_kWh_m2"]) & (dpoa >= dc["cloudy_min_kWh_m2"])].mean()
    return float(sunny), float(cloudy)


def build(cfg=None, weather=None):
    from twin.weather import load_weather
    cfg = cfg or load_config()
    weather = weather if weather is not None else load_weather(cfg=cfg)
    crop = load_crops()[cfg["product"]["default_crop"]]
    sunny_kWh, cloudy_kWh = day_solar_kWh(weather, cfg)
    sec = cfg["door"]["seconds_per_opening"]
    Qmax = cfg["refrigeration"]["design_capacity_kW"]
    rows = {}
    for T, RH, n, cur, m, cl in itertools.product(*GRID.values()):
        c = with_overrides(cfg, {"pcm": {"mass_kg": m}})
        Dt = loads.door_open_fraction(n, sec)
        pull = loads.total_load(c, crop, T, RH, D_t=Dt, curtain=bool(cur), in_pulldown=True)
        hold = loads.total_load(c, crop, T, RH, D_t=Dt, curtain=bool(cur), in_pulldown=False)
        cop = r290.cycle_from_config(c, T_amb_C=T, Q_evap_kW=1.0)["COP_elec"]
        b = PCMBattery(c)
        pcm_kWh = b.energy_remaining_kJ / 3600
        Lh = hold["subtotal_kW"]
        p = c["pcm"]
        thick = m / (p["density_kg_m3"] * p["slab_area_m2"])
        UA = p["slab_area_m2"] / (1 / p["air_side_h_W_m2K"] + thick / 2 / p["k_W_mK"]) / 1000
        after = max(0.0, 100 * (1 - Lh * 12 / (m * p["latent_kJ_kg"] / 3600)))
        # daily compressor need: 4 h pull-down + 20 h holding, at this day's COP
        need = (pull["subtotal_kW"] * 4 + Lh * 20) / cop
        solar = cloudy_kWh if cl else sunny_kWh
        key = f"{T}|{RH}|{n}|{cur}|{m}|{cl}"
        rows[key] = [round(x, 4) for x in (
            pull["subtotal_kW"], Lh, pull["wall"]["Q_kW"], pull["infiltration"]["Q_kW"],
            pull["infiltration"]["Q_latent_kW"], pull["product"]["Q_kW"], pull["internal"]["Q_kW"],
            cop, min(pull["subtotal_kW"], Qmax) / cop, pcm_kWh, pcm_kWh / max(Lh, 1e-6), after,
            p["T_melt_C"] + Lh / UA, min(100.0, 100 * solar / need), solar, need)]
    return {"grid": GRID,
            "fields": ["load_pulldown_kW", "load_holding_kW", "wall_kW", "door_kW", "door_latent_kW", "product_kW",
                       "internal_kW", "cop", "comp_kW", "pcm_kWh", "backup_h", "pcm_after_night_pct",
                       "T_room_night_C", "solar_cover_pct", "solar_day_kWh", "need_day_kWh"],
            "Qmax_kW": Qmax, "seconds_per_opening": sec, "pv_kWp": cfg["pv"]["rated_kWp"],
            "note": "Computed with engine/ formulas for every slider position (twin/whatif.py). "
                    "Solar per day = average of the real sunny / cloudy days of 2025 for this PV size.",
            "rows": rows}


if __name__ == "__main__":
    import time
    t = time.time()
    d = build()
    print(len(d["rows"]), "combinations", round(time.time() - t, 1), "s")
