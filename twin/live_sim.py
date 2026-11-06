"""Live Year Run simulator: the cold room on REAL 2026 weather (or the ISHRAE design year) with the
FIXED inputs in config/design.json -> live_run.

Same physics as twin/simulate.py, with these differences (all asked for):
  * 150 kg of produce (rated capacity) is ALWAYS inside. Loading events (live_run.loading) swap
    produce: at each event that share goes out and the same mass of fresh produce comes in at
    THAT HOUR'S OUTSIDE TEMPERATURE. We record how long it takes to reach 5.5 C.
  * Door: each loading = 2 openings (hh:00 and hh:10); with one event, 2 more at 12:00 and 17:00.
    4 a day, 15 s each. No randomness.
  * Wax panels sit behind a BAFFLE CHANNEL (engine/fan.py). Fan off: cold air falls down the
    channel by itself (natural draft). Night fan: runs only when the compressor is off and the room
    is above 5 C, at the lowest speed that holds about 6 C. Its power is heat added to the room.
  * Sunlight is multiplied by live_run.sun_factor (0.88 = NASA level, conservative).
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


def _hottest_night(weather):
    """Mean outside temperature (19:00-06:00) of the hottest night in the weather given."""
    w = weather[(weather.time_ist.dt.hour >= 19) | (weather.time_ist.dt.hour < 6)]
    nights = (w.time_ist - pd.Timedelta(hours=7)).dt.date
    return w.groupby(nights).T_out.mean().max()


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


def door_times(loading):
    """B6: each loading = 2 openings (hh:00, hh:10); with one event add 12:00 and 17:00."""
    t = []
    for ev in loading:
        t += [(ev["hour"], 0), (ev["hour"], 10)]
    if len(loading) == 1:
        t += [(12, 0), (17, 0)]
    return t


def simulate_live(weather, design="current", mode="solar_pcm", cfg=None, crop_key=None, init=None,
                  fan_on=None, sun_factor=None, loading=None, steps=False, hx=None):
    """Run the live twin. weather: hourly frame with time_ist, T_out, RH_out, ps_Pa, ghi, wind.
    Returns (hourly DataFrame, totals dict, end_state dict, batches DataFrame)."""
    from engine import fan as FAN
    cfg = cfg or load_config()
    lr = cfg["live_run"]
    sun = lr.get("sun_factor", 1.0) if sun_factor is None else sun_factor
    weather = weather.copy()
    weather["ghi"] = weather["ghi"] * sun
    loading = loading or lr["loading"]
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
    wind_s = _steps(weather["wind"], 0.0, nH)
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

    # ---- produce: one node per loading event (masses add up to the 150 kg always inside)
    cp = cfg["product"]["cp_kJ_kgK"]
    tau = cfg["product"]["pulldown_hours"] * 3600.0 / math.log(8.0)     # same 7/8-in-4-h rate as before
    masses = [float(ev["kg"]) for ev in loading]
    m_b = sum(masses)
    r_ref, Q10, T_ref = crop.get("respiration_W_per_kg_at_ref", 0.0), crop["Q10"], crop["T_ref_C"]

    # ---- wax
    pc = cfg["pcm"]
    m_p = 0.0 if grid_only else float(des["pcm_kg"])
    L, cps, cpl, Tm = pc["latent_kJ_kg"], pc["cp_solid_kJ_kgK"], pc["cp_liquid_kJ_kgK"], pc["T_melt_C"]
    nf = lr["night_fan"]
    fan_enabled = nf["enabled"] if fan_on is None else fan_on
    fan_info = None
    if m_p > 0:
        A = pc["slab_area_m2"]
        thick = m_p / (pc["density_kg_m3"] * A)
        half = thick / 2 / pc["k_W_mK"]
        UA_ch = A / (half + cfg["simulation"]["pcm_charge_coil_R_m2K_W"]) / 1000.0
        T_night = float(_hottest_night(weather))
        hx = dict(lr.get("wax_hx") or {"kind": "baffle"}) if hx is None else dict(hx)
        kind = hx.get("kind", "baffle")
        if kind == "baffle":                    # plain panels + baffle channel + night fans (engine/fan.py)
            fan_info = FAN.size_fan(cfg, T_night, m_p, nf["design_room_max_C"], nf["margin"])
            fan_info["kind"] = "baffle"
            if nf.get("fan"):                   # the chosen fan is fixed in design.json (stable results)
                f = nf["fan"]
                geo = FAN.geometry(cfg)
                dp = FAN.channel_pressure(fan_info["v_needed_m_s"], geo)
                eff = f["flow_m3h"] * max(0.1, 1 - dp / f["pressure_Pa"])
                fan_info["fan"] = {**f, "total_W": f["count"] * f["watts"], "total_flow_m3h": f["count"] * eff}
            speeds, G_fan_tab, dTs, G_nat_tab, v_max = FAN.conductance_tables(cfg, m_p, fan_info["fan"])
            G_fan_tab, G_nat_tab = G_fan_tab / 1000.0, G_nat_tab / 1000.0          # kW/K
            fan_rated_kW = fan_info["fan"]["total_W"] / 1000.0
        else:                                   # 'fins' (final design) or 'plain' panels, no baffle (engine/fins.py)
            from engine import fins as FINS
            Lp = hx.get("L", nf["panel_height_m"])
            load_W, parts = FAN.design_night_load(cfg, T_night, 7.0)
            if kind == "plain":
                dTs = np.linspace(0, 15, 61)
                G_nat_tab = np.array([FINS.plain(A, Lp, half, max(d, 1e-3))["UA"] for d in dTs])
                speeds, G_fan_tab, fsp = np.linspace(0, 1, 51), np.full(51, G_nat_tab[12]), None
                calc = FINS.plain(A, Lp, half, 3.0)
            else:
                fsp = hx.get("fan")
                if fsp:
                    fsp = {**fsp, "total_W": fsp["count"] * fsp["watts"],
                           "total_flow_m3h": fsp["count"] * fsp["flow_m3h"] * hx.get("flow_fraction", 0.7)}
                speeds, G_fan_tab, dTs, G_nat_tab, v_max = FINS.conductance_tables(
                    A, Lp, hx["S"], hx["b"], hx["t"], half, fsp, hx.get("cover_m", 1.0))
                calc = FINS.array(A, Lp, hx["S"], hx["b"], hx["t"], half, 3.0)
            k = hx.get("h_scale", 1.0)               # sensitivity: correlation uncertainty
            G_fan_tab, G_nat_tab = k * G_fan_tab / 1000.0, k * G_nat_tab / 1000.0
            fan_rated_kW = fsp["total_W"] / 1000.0 if fsp else 0.0
            if not fsp:
                fan_enabled = False
            fan_info = {"kind": kind, "L_m": Lp, "A_m2": A, "R_wax_m2K_W": half, "dT_K": 3.0, "T_out_design_night_C": T_night,
                        "load_W": load_W, "load_parts_W": parts, "calc_3K": calc, "fan": fsp,
                        **{k_: v for k_, v in hx.items() if k_ in ("S", "b", "t", "h_scale")}}
    else:
        UA_ch = 0.0
    h_min = cps * (cfg["simulation"]["pcm_charge_stop_C"] - Tm)
    T_evap = cfg["refrigeration"]["T_evap_C"]
    T_pcm_of = lambda h: Tm + h / cps if h < 0 else (Tm + (h - L) / cpl if h > L else Tm)

    # ---- door schedule (fixed)
    door = np.zeros(n)
    hrs = (t0 + pd.to_timedelta(np.arange(n) * DT, unit="s"))
    hod, minute, day = hrs.hour.values, hrs.minute.values, ((hrs - t0.normalize()).days).values
    for (hh, mm) in door_times(loading):
        door[(hod == hh) & (minute == (mm // 5) * 5)] += lr["door_seconds"]
    event_at = np.full(n, -1)
    for k, ev in enumerate(loading):
        event_at[(hod == ev["hour"]) & (minute == 0)] = k

    # ---- state
    st = init or {}
    T_r = st.get("T_room", Tset)
    T_n = list(st.get("T_nodes", [Tset] * len(masses)))
    h = st.get("pcm_h", 0.0) if m_p > 0 else 0.0
    grid_mode = st.get("grid_mode", False)
    E0 = C_room * T_r + sum(m * cp * t for m, t in zip(masses, T_n)) + m_p * h

    out = {k: np.zeros(n) for k in ("T_room", "T_batch", "pcm_pct", "Q_wall", "Q_door", "Q_batch", "Q_resp", "Q_int",
                                    "Q_air", "Q_ch", "Q_pcm_room", "P_comp", "P_pv", "P_solar_used", "P_grid", "grid_on",
                                    "running", "door_s", "solar_ok", "fan_speed", "fan_W", "G_wax", "batt12_W",
                                    "T_pcm", "pcm_h", "cop", "T_out", "RH_out", "poa", "wind", "Q_door_lat")}
    acc = dict(in_=0.0, out=0.0, prod_in=0.0, prod_out=0.0)
    batches = []        # [step, event k, T_in, steps to cool or None, T after 4 h, T after 2 h]
    last_event = None
    last_k = 0
    since = [None] * len(masses)
    batt_base_kW = sum(lr["battery_12V"]["loads_W"].values()) / 1000.0
    s4 = int(4 * 3600 / DT)

    for i in range(n):
        k = event_at[i]
        if k >= 0:                                    # loading event k: that share goes out, fresh in
            acc["prod_out"] += masses[k] * cp * T_n[k]
            T_n[k] = T_out[i]
            acc["prod_in"] += masses[k] * cp * T_n[k]
            batches.append([i, k, T_n[k], None, None, None])
            since[k] = len(batches) - 1
            last_event = i
            last_k = k
        for kk, bi in enumerate(since):
            if bi is None:
                continue
            b = batches[bi]
            if b[3] is None and T_n[kk] <= Tset + lr["cooled_within_K"]:
                b[3] = i - b[0]
            if b[4] is None and i - b[0] >= s4:
                b[4] = T_n[kk]
            if b[5] is None and i - b[0] >= s4 // 2:
                b[5] = T_n[kk]

        T_p = T_pcm_of(h) if m_p > 0 else T_r
        pct = 100.0 * (1 - min(1.0, max(0.0, h / L))) if m_p > 0 else 0.0

        # power available. 'hot' = room above the protection limit; during the loading window the
        # rule can be switched off (grid_assist_during_loading=false): then only the fresh batch is warm.
        loading_now = last_event is not None and i - last_event < load_steps
        hot = T_r > protect and (assist or not loading_now)
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
            Q_door_lat = inf["Q_latent_kW"] * Dt
        else:
            Q_door = Q_door_lat = 0.0
        Q_resp = sum(m * r_ref * Q10 ** ((t - T_ref) / 10.0) for m, t in zip(masses, T_n)) / 1000.0
        Q_bs = [m * cp / tau * (t - T_r) for m, t in zip(masses, T_n)]
        Q_b = sum(Q_bs)

        # wax channel with the fan OFF (natural draft): conductance depends on the temperature difference
        dTw = T_r - T_p if m_p > 0 else 0.0
        G_nat = float(np.interp(max(dTw, 0.0), dTs, G_nat_tab)) if m_p > 0 else 0.0
        Q_pa_nat = G_nat * dTw if dTw > 0 else (G_nat_tab[1] * dTw if m_p > 0 else 0.0)
        lights = il["lights_W"] / 1000.0 * max(il["lights_on_fraction"], Dt)
        base = Q_wall + Q_door + Q_resp + Q_b + lights + ctrl_kW
        Q_req = base + fan_kW - Q_pa_nat + C_room * (T_r - Tset) / DT
        Q_air = min(max(Q_req, 0.0), Q_avail)
        Q_ch = 0.0
        if m_p > 0 and solar_ok and not grid_mode and Q_avail - Q_air > 0:
            Q_ch = max(0.0, min(Q_avail - Q_air, UA_ch * (T_p - T_evap), m_p * (h - h_min) / DT))
        running = (Q_air + Q_ch) > 1e-9
        # the evaporator fan only runs with the compressor (no battery for cooling)
        Q_fan = fan_kW if running else 0.0
        if not running:
            Q_air = 0.0
        # NIGHT WAX FAN: only when the compressor is off and the room is above 5 C; lowest speed
        # that holds the fan target (about 6 C). Its power is heat in the room (counted in Q_int).
        spd, P_nf, G_w = 0.0, 0.0, G_nat
        assist_C = nf.get("morning_assist_above_C")
        if m_p > 0 and fan_enabled and assist_C is not None and loading_now and T_r > assist_C and dTw > 0.05:
            # MORNING ASSIST: while a fresh batch cools, run the wax fans flat out whenever the air is
            # above the assist limit - even with the compressor on - to pull cold out of the wax.
            spd, P_nf = 1.0, fan_rated_kW
            G_w = max(G_nat, float(G_fan_tab[-1]))
        elif m_p > 0 and fan_enabled and not running and T_r > nf["on_above_C"] and dTw > 0.05:
            need = (base - Q_pa_nat * 0 + C_room * (T_r - nf["target_C"]) / 1800.0)
            for _ in range(2):                                # fan heat is part of what it must remove
                G_need = (need + P_nf) / dTw
                if G_need <= G_nat:
                    spd, P_nf = 0.0, 0.0
                    break
                spd = float(np.interp(G_need, G_fan_tab, speeds)) if G_need < G_fan_tab[-1] else 1.0
                P_nf = fan_rated_kW * spd ** 3
            G_w = max(G_nat, float(np.interp(spd, speeds, G_fan_tab))) if spd > 0 else G_nat
        Q_pa = G_w * dTw if m_p > 0 else 0.0
        Q_int = lights + ctrl_kW + Q_fan + P_nf
        net = Q_wall + Q_door + Q_resp + Q_b + Q_int - Q_pa

        P_comp = (Q_air + Q_ch) / cop[i] + Q_fan if running else 0.0
        if grid_mode:
            P_sol = min(P_comp, P_pv[i]) if solar_ok else 0.0
            P_grid = P_comp - P_sol
        else:
            P_sol, P_grid = P_comp, 0.0

        T_r += (net - Q_air) * DT / C_room
        for kk in range(len(masses)):
            T_n[kk] -= Q_bs[kk] * DT / (masses[kk] * cp)
        T_b = T_n[last_k]                              # the most recently loaded produce
        if m_p > 0:
            h += (Q_pa - Q_ch) * DT / m_p

        acc["in_"] += (Q_wall + Q_door + Q_resp + Q_int) * DT
        acc["out"] += (Q_air + Q_ch) * DT
        for key, val in (("T_room", T_r), ("T_batch", T_b), ("pcm_pct", pct), ("Q_wall", Q_wall), ("Q_door", Q_door),
                         ("Q_batch", Q_b), ("Q_resp", Q_resp), ("Q_int", Q_int), ("Q_air", Q_air), ("Q_ch", Q_ch),
                         ("Q_pcm_room", Q_pa), ("P_comp", P_comp), ("P_pv", P_pv[i]), ("P_solar_used", P_sol),
                         ("P_grid", P_grid), ("grid_on", float(grid_mode)), ("running", float(running)),
                         ("door_s", door[i]), ("solar_ok", float(solar_ok)), ("fan_speed", spd), ("fan_W", P_nf * 1000),
                         ("G_wax", G_w * 1000), ("batt12_W", (batt_base_kW + P_nf) * 1000),
                         ("T_pcm", T_pcm_of(h) if m_p > 0 else np.nan), ("pcm_h", h), ("cop", cop[i]),
                         ("T_out", T_out[i]), ("RH_out", RH[i]), ("poa", poa[i]), ("wind", wind_s[i]), ("Q_door_lat", Q_door_lat)):
            out[key][i] = val

    E1 = C_room * T_r + sum(m * cp * t for m, t in zip(masses, T_n)) + m_p * h
    heat_in = acc["in_"] + acc["prod_in"]
    heat_out = acc["out"] + acc["prod_out"]
    bal = heat_in - heat_out - (E1 - E0)

    # ---- hourly table (means of the 12 five-minute steps; energies in kWh)
    S5 = None
    if steps:                                  # every 5-minute step (for the main site replay)
        S5 = pd.DataFrame(out, index=hrs)
        S5["T_batch"] = out["T_batch"]
    out = {k: v for k, v in out.items() if k not in ("T_pcm", "pcm_h", "cop", "T_out", "RH_out", "poa", "wind", "Q_door_lat")}
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

    bt = pd.DataFrame(batches, columns=["step", "event", "T_in_C", "cool_steps", "T_after_4h_C", "T_after_2h_C"])
    bt["date"] = (t0 + pd.to_timedelta(bt["step"] * DT, unit="s")).dt.date.astype(str)
    bt["cool_h"] = bt["cool_steps"].astype(float) * DT / 3600.0
    bt["kg"] = [masses[e] for e in bt["event"]]
    totals = {"design": design, "mode": mode, "pcm_kg": m_p, "pv_kWp": kWp, "hours": nH,
              "energy_in_kWh": heat_in / 3600, "energy_out_kWh": heat_out / 3600,
              "stored_change_kWh": (E1 - E0) / 3600, "energy_balance_error_kWh": bal / 3600,
              "energy_balance_error_pct": 100 * abs(bal) / heat_out if heat_out else 0.0,
              "sun_factor": sun, "fan_enabled": bool(fan_enabled and m_p > 0), "wax_hx": fan_info,
              "loading": loading, "produce_kg": m_b}
    end_state = {"T_room": T_r, "T_nodes": T_n, "pcm_h": h, "grid_mode": grid_mode}
    if steps:
        totals["steps"] = S5
    return H, totals, end_state, bt[["date", "event", "kg", "T_in_C", "cool_h", "T_after_2h_C", "T_after_4h_C"]]
