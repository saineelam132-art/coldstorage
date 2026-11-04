"""Live Year Run simulator: the cold room on REAL 2026 weather (or the ISHRAE design year) with the
FIXED inputs in config/design.json -> live_run.

Same physics as twin/simulate.py, with these differences (all asked for):
  * 200 kg of produce is ALWAYS inside. At 8 am every day the 200 kg inside goes out and 200 kg of
    fresh produce comes in at THAT HOUR'S OUTSIDE TEMPERATURE. We record how long it takes to
    reach 5.5 C (within 0.5 K of the 5 C set-point).
  * Door: 4 openings a day, 15 s each, at fixed times (8:00, 8:10, 12:00, 17:00). No randomness.
  * Compressor maximum 1.5 kW cooling (DC inverter, 30-100 %). The real load is calculated every
    5 minutes; 1.5 kW is only the limit.
  * NO battery for cooling. The compressor AND the 40 W evaporator fan run only on solar or grid.
    When they are off, the wax panels cool the room by natural convection only (h = 4 W/m2K
    instead of 15 W/m2K with the fan). A small 12 V battery runs only the controller, sensors and
    IoT gateway (10 W), charged from the panels.
  * mode 'grid_only': same room, no wax, no solar, grid always on (for the money comparison).

Every 5-minute step is integrated (explicit Euler) and summed per hour.
"""
import math

import numpy as np
import pandas as pd

from engine import loads, pv, r290
from engine.config import load_config, load_crops

DT = 300.0


def _steps(hourly, centre_offset_h, n_hours):
    """Hourly values -> 5-minute steps by straight lines between hour 'centres'."""
    x = np.arange(n_hours) + centre_offset_h
    t = (np.arange(n_hours * 12) + 0.5) / 12.0
    return np.interp(t, x, np.asarray(hourly, dtype=float))


def cycle_table(cfg):
    T = np.arange(-5.0, 55.01, 0.25)
    rows = [r290.cycle_from_config(cfg, T_amb_C=t, Q_evap_kW=1.0) for t in T]
    return T, {k: np.array([r[k] for r in rows]) for k in ("COP_elec", "P_evap_bar", "P_cond_bar", "T_cond_C", "T2_C", "T_evap_C")}


def poa_hourly(cfg, weather):
    site, p = cfg["site"], cfg["pv"]
    mid = weather["time_ist"] + pd.Timedelta(minutes=30)
    return np.array([pv.poa_irradiance(g, t.dayofyear, t.hour + t.minute / 60, site["lat_deg"], site["lon_deg"],
                                       site["utc_offset_h"], p["tilt_deg"], p["azimuth_deg"], p["ground_albedo"])
                     for g, t in zip(weather["ghi"].values, mid)])


def simulate_live(weather, design="current", mode="solar_pcm", cfg=None, crop_key=None, init=None):
    """Run the live twin. weather: hourly frame with time_ist, T_out, RH_out, ps_Pa, ghi, wind.
    Returns (hourly DataFrame, totals dict, end_state dict)."""
    cfg = cfg or load_config()
    lr = cfg["live_run"]
    crop = load_crops()[crop_key or cfg["product"]["default_crop"]]
    des = lr["designs"][design]
    grid_only = mode == "grid_only"
    nH = len(weather)
    n = nH * 12
    t0 = pd.Timestamp(weather["time_ist"].iloc[0])

    # ---- weather at every step
    T_out = _steps(weather["T_out"], 0.0, nH)
    RH = np.clip(_steps(weather["RH_out"], 0.0, nH), 1, 100)
    ps = _steps(weather["ps_Pa"], 0.0, nH)
    poa = np.clip(_steps(poa_hourly(cfg, weather), 0.5, nH), 0, None)
    pvc = cfg["pv"]
    kWp = 0.0 if grid_only else des["pv_kWp"]
    T_cell = T_out + (pvc["NOCT_C"] - 20.0) / 800.0 * poa
    P_pv = np.clip(kWp * poa / 1000.0 * pvc["performance_ratio"] * (1 + pvc["temp_coeff_per_C"] * (T_cell - 25.0)), 0, None)
    Tt, CT = cycle_table(cfg)
    cop = np.interp(T_out, Tt, CT["COP_elec"])

    # ---- room
    W_in, H_in, L_in = lr["inside_m"]
    tw = lr["insulation_thickness_m"]
    k = cfg["chamber"]["insulation_k_W_mK"]
    A_env = 2 * ((W_in + 2 * tw) * (H_in + 2 * tw) + (L_in + 2 * tw) * (H_in + 2 * tw) + (W_in + 2 * tw) * (L_in + 2 * tw))
    A_env = cfg["chamber"]["envelope_area_m2"] if [W_in, H_in, L_in] == [2.0, 2.2, 2.0] else A_env
    UAw = k / tw * A_env / 1000.0                                     # kW/K
    C_room = 1.25 * W_in * H_in * L_in * 1.006 + cfg["simulation"]["structure_heat_capacity_kJ_K"]
    Tset, (blo, bhi) = lr["setpoint_C"], lr["band_C"]
    protect = cfg["controller"]["protect_above_C"]
    ats_thr = cfg["controller"]["ats_pcm_pct"]
    Qmax = lr["compressor_max_kW"]
    Qmin = cfg["simulation"]["inverter_min_capacity_frac"] * Qmax
    fan_kW = lr["evaporator_fan_W"] / 1000.0
    il = cfg["internal_loads"]
    ctrl_kW = il["controller_sensors_W"] / 1000.0
    rh_in = cfg["setpoint"]["rh_room_pct"]
    curtain = lr["curtain_installed"]
    assist = lr.get("grid_assist_during_loading", True)
    load_steps = int(lr.get("loading_window_h", 3) * 3600 / DT)

    # ---- produce: one 200 kg node, swapped daily
    m_b, cp = lr["produce_kg"], cfg["product"]["cp_kJ_kgK"]
    UA_b = m_b * cp * math.log(8.0) / (cfg["product"]["pulldown_hours"] * 3600.0)   # same 7/8-in-4-h rate as before
    r_ref, Q10, T_ref = crop.get("respiration_W_per_kg_at_ref", 0.0), crop["Q10"], crop["T_ref_C"]

    # ---- wax
    pc = cfg["pcm"]
    m_p = 0.0 if grid_only else float(des["pcm_kg"])
    L, cps, cpl, Tm = pc["latent_kJ_kg"], pc["cp_solid_kJ_kgK"], pc["cp_liquid_kJ_kgK"], pc["T_melt_C"]
    if m_p > 0:
        A = pc["slab_area_m2"]
        thick = m_p / (pc["density_kg_m3"] * A)
        half = thick / 2 / pc["k_W_mK"]
        UA_fan = A / (1 / pc["air_side_h_W_m2K"] + half) / 1000.0
        UA_nat = A / (1 / lr["natural_convection_h_W_m2K"] + half) / 1000.0
        UA_ch = A / (half + cfg["simulation"]["pcm_charge_coil_R_m2K_W"]) / 1000.0
    else:
        UA_fan = UA_nat = UA_ch = 0.0
    h_min = cps * (cfg["simulation"]["pcm_charge_stop_C"] - Tm)
    T_evap = cfg["refrigeration"]["T_evap_C"]
    T_pcm_of = lambda h: Tm + h / cps if h < 0 else (Tm + (h - L) / cpl if h > L else Tm)

    # ---- door schedule (fixed)
    door = np.zeros(n)
    hrs = (t0 + pd.to_timedelta(np.arange(n) * DT, unit="s"))
    hod, minute, day = hrs.hour.values, hrs.minute.values, ((hrs - t0.normalize()).days).values
    for (hh, mm) in lr["door_openings"]:
        door[(hod == hh) & (minute == (mm // 5) * 5)] += lr["door_seconds"]
    swap = (hod == lr["swap_hour"]) & (minute == 0)

    # ---- state
    st = init or {}
    T_r = st.get("T_room", Tset)
    T_b = st.get("T_batch", Tset)
    h = st.get("pcm_h", 0.0) if m_p > 0 else 0.0
    grid_mode = st.get("grid_mode", False)
    E0 = C_room * T_r + m_b * cp * T_b + m_p * h

    out = {k: np.zeros(n) for k in ("T_room", "T_batch", "pcm_pct", "Q_wall", "Q_door", "Q_batch", "Q_resp", "Q_int",
                                    "Q_air", "Q_ch", "Q_pcm_room", "P_comp", "P_pv", "P_solar_used", "P_grid", "grid_on",
                                    "running", "door_s", "solar_ok")}
    acc = dict(in_=0.0, out=0.0, prod_in=0.0, prod_out=0.0)
    batches = []        # (swap step, T_in, steps to cool or None)
    cool_from = None

    for i in range(n):
        if swap[i]:
            acc["prod_out"] += m_b * cp * T_b
            T_b = T_out[i]
            acc["prod_in"] += m_b * cp * T_b
            if cool_from is not None and batches[-1][2] is None:
                pass
            batches.append([i, T_b, None])
            cool_from = i
        if cool_from is not None and batches[-1][2] is None and T_b <= Tset + lr["cooled_within_K"]:
            batches[-1][2] = i - cool_from

        T_p = T_pcm_of(h) if m_p > 0 else T_r
        pct = 100.0 * (1 - min(1.0, max(0.0, h / L))) if m_p > 0 else 0.0

        # power available. 'hot' = room above the protection limit; during the loading window the
        # rule can be switched off (grid_assist_during_loading=false): then only the fresh batch is warm.
        loading = cool_from is not None and i - cool_from < load_steps
        hot = T_r > protect and (assist or not loading)
        if grid_only:
            Q_sun, solar_ok, grid_mode = 0.0, False, True
        else:
            Q_sun = min(Qmax, max(0.0, P_pv[i] - fan_kW) * cop[i])
            solar_ok = Q_sun >= Qmin
            if not solar_ok:
                Q_sun = 0.0
            if solar_ok:
                grid_mode = hot
            else:
                grid_mode = grid_mode or (m_p > 0 and pct < ats_thr) or (m_p == 0) or hot
        Q_avail = Qmax if grid_mode else Q_sun

        Dt = min(1.0, door[i] / DT)
        Q_wall = UAw * (T_out[i] - T_r)
        if Dt > 0:
            inf = loads.infiltration_load(cfg, T_out[i], RH[i], T_r, rh_in, D_t=1.0, curtain=curtain, p=ps[i])
            Q_door = inf["Q_kW"] * Dt
        else:
            Q_door = 0.0
        Q_resp = m_b * r_ref * Q10 ** ((T_b - T_ref) / 10.0) / 1000.0
        Q_b = UA_b * (T_b - T_r)

        # cooling needed to hold the set-point (decide with the fan on)
        Q_pa_fan = UA_fan * (T_r - T_p) if m_p > 0 else 0.0
        lights = il["lights_W"] / 1000.0 * max(il["lights_on_fraction"], Dt)
        base = Q_wall + Q_door + Q_resp + Q_b + lights + ctrl_kW
        Q_req = base + fan_kW - Q_pa_fan + C_room * (T_r - Tset) / DT
        Q_air = min(max(Q_req, 0.0), Q_avail)
        Q_ch = 0.0
        if m_p > 0 and solar_ok and not grid_mode and Q_avail - Q_air > 0:
            Q_ch = max(0.0, min(Q_avail - Q_air, UA_ch * (T_p - T_evap), m_p * (h - h_min) / DT))
        running = (Q_air + Q_ch) > 1e-9
        # the fan only runs with the compressor (no battery for cooling)
        Q_fan = fan_kW if running else 0.0
        Q_pa = (UA_fan if running else UA_nat) * (T_r - T_p) if m_p > 0 else 0.0
        if not running:
            Q_air = 0.0
        Q_int = lights + ctrl_kW + Q_fan
        net = Q_wall + Q_door + Q_resp + Q_b + Q_int - Q_pa

        P_comp = (Q_air + Q_ch) / cop[i] + Q_fan if running else 0.0
        if grid_mode:
            P_sol = min(P_comp, P_pv[i]) if solar_ok else 0.0
            P_grid = P_comp - P_sol
        else:
            P_sol, P_grid = P_comp, 0.0

        T_r += (net - Q_air) * DT / C_room
        T_b -= Q_b * DT / (m_b * cp)
        if m_p > 0:
            h += (Q_pa - Q_ch) * DT / m_p

        acc["in_"] += (Q_wall + Q_door + Q_resp + Q_int) * DT
        acc["out"] += (Q_air + Q_ch) * DT
        for key, val in (("T_room", T_r), ("T_batch", T_b), ("pcm_pct", pct), ("Q_wall", Q_wall), ("Q_door", Q_door),
                         ("Q_batch", Q_b), ("Q_resp", Q_resp), ("Q_int", Q_int), ("Q_air", Q_air), ("Q_ch", Q_ch),
                         ("Q_pcm_room", Q_pa), ("P_comp", P_comp), ("P_pv", P_pv[i]), ("P_solar_used", P_sol),
                         ("P_grid", P_grid), ("grid_on", float(grid_mode)), ("running", float(running)),
                         ("door_s", door[i]), ("solar_ok", float(solar_ok))):
            out[key][i] = val

    E1 = C_room * T_r + m_b * cp * T_b + m_p * h
    heat_in = acc["in_"] + acc["prod_in"]
    heat_out = acc["out"] + acc["prod_out"]
    bal = heat_in - heat_out - (E1 - E0)

    # ---- hourly table (means of the 12 five-minute steps; energies in kWh)
    H = pd.DataFrame({k: v.reshape(nH, 12).mean(axis=1) for k, v in out.items()})
    H["door_s"] = out["door_s"].reshape(nH, 12).sum(axis=1)
    H["running_h"] = H.pop("running")
    H.insert(0, "time_ist", weather["time_ist"].values)
    for c in ("T_out", "RH_out", "ghi", "wind", "ps_Pa"):
        H[c] = weather[c].values
    if "is_forecast" in weather:
        H["is_forecast"] = weather["is_forecast"].values
    if "source" in weather:
        H["source"] = weather["source"].values
    H["Q_cool"] = H["Q_air"] + H["Q_ch"]
    H["comp_speed_pct"] = 100 * H["Q_cool"] / np.maximum(H["running_h"], 1e-9) / Qmax * (H["running_h"] > 0)
    for c, kk in (("COP", "COP_elec"), ("P_evap_bar", "P_evap_bar"), ("P_cond_bar", "P_cond_bar"),
                  ("T_cond_C", "T_cond_C"), ("T_discharge_C", "T2_C")):
        H[c] = np.interp(H["T_out"], Tt, CT[kk])
    H["T_evap_C"] = T_evap
    H.loc[H["running_h"] == 0, ["COP", "P_evap_bar", "P_cond_bar", "T_cond_C", "T_discharge_C"]] = np.nan
    H["Q_load"] = H["Q_wall"] + H["Q_door"] + H["Q_batch"] + H["Q_resp"] + H["Q_int"]

    bt = pd.DataFrame(batches, columns=["step", "T_in_C", "cool_steps"])
    bt["date"] = (t0 + pd.to_timedelta(bt["step"] * DT, unit="s")).dt.date.astype(str)
    bt["cool_h"] = bt["cool_steps"] * DT / 3600.0
    totals = {"design": design, "mode": mode, "pcm_kg": m_p, "pv_kWp": kWp, "hours": nH,
              "energy_in_kWh": heat_in / 3600, "energy_out_kWh": heat_out / 3600,
              "stored_change_kWh": (E1 - E0) / 3600, "energy_balance_error_kWh": bal / 3600,
              "energy_balance_error_pct": 100 * abs(bal) / heat_out if heat_out else 0.0}
    end_state = {"T_room": T_r, "T_batch": T_b, "pcm_h": h, "grid_mode": grid_mode}
    return H, totals, end_state, bt[["date", "T_in_C", "cool_h"]]
