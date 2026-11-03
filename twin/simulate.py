"""Digital twin: simulate the cold room for a full year, step by step (5-minute steps).

What is inside the room model (all heat in kW, temperatures in C):

  ROOM node  (air + inner structure + produce already stored)
      C_room * dT_room/dt = Q_wall + Q_door + Q_internal + Q_respiration
                            + Q_batch_to_room - Q_room_to_PCM - Q_air_coil
  NEW BATCH node (200 kg at 25 C arriving at 8 am)
      m*cp * dT_batch/dt = - UA_batch * (T_batch - T_room)
      UA_batch is chosen so the batch reaches 7/8 of the way to room temperature in
      4 h (the "seven-eighths cooling time" used in industry): UA = m*cp*ln(8)/4h
  PCM node (wax slabs on the walls, lumped, same equations as engine/pcm.py)
      m_pcm * dh/dt = Q_room_to_PCM - Q_charge_coil
      Q_room_to_PCM = UA_air * (T_room - T_pcm),  UA_air = A / (1/h + t/(2k))
      Q_charge_coil <= UA_coil * (T_pcm - T_evap), UA_coil = A / (t/(2k) + R_coil)

Controller (simple and explainable):
  * Sun strong enough to run the compressor (inverter >= 30 % of max)?  -> run on SOLAR:
      first hold the room at target, then put ALL spare cooling into freezing the PCM
      (until the wax is fully frozen and at 3 C).
  * No sun: the PCM cools the room on its own (compressor off).
  * Automatic transfer switch (ATS) to GRID when there is no sun AND (PCM < 15 % OR room
    > 7.5 C). Grid then holds the room at target (it does not recharge the PCM).
    Grid stays on until the sun returns.
  * 'forecast' mode uses tomorrow's weather from the file as a PERFECT forecast:
      - if tomorrow is sunny, tonight the PCM may be used down to 5 % before the ATS
      - if tomorrow is cloudy/rainy, today's spare sun pre-cools the room to 3 C.

Energy bookkeeping (checked at the end):
   change in stored energy = heat in (walls, door, fans/lights, respiration, warm produce in)
                             - heat out (evaporator coils, cold produce out)
"""
import math

import numpy as np
import pandas as pd

from engine import loads, r290
from engine.config import load_config, load_crops, u_value


# ------------------------------------------------------------------ helpers
def cop_table(cfg):
    """COP_elec vs ambient temperature (T_cond = T_amb + 10 K), for fast lookup."""
    T = np.arange(-5.0, 55.01, 0.25)
    cop = np.array([r290.cycle_from_config(cfg, T_amb_C=t, Q_evap_kW=1.0)["COP_elec"] for t in T])
    return T, cop


def pv_power_array(cfg, poa, T_amb):
    pvc = cfg["pv"]
    T_cell = T_amb + (pvc["NOCT_C"] - 20.0) / 800.0 * poa
    P = pvc["rated_kWp"] * poa / 1000.0 * pvc["performance_ratio"] * (1 + pvc["temp_coeff_per_C"] * (T_cell - 25.0))
    return np.clip(P, 0.0, None)


def step_times_for(weather, dt):
    """5-minute step start times, from 00:00 on 1 January (IST)."""
    start = weather["time_ist"].iloc[0].normalize()
    n = len(weather) * int(3600 // dt)
    return start + pd.to_timedelta(np.arange(n) * dt, unit="s")


def to_steps(weather, values, dt):
    """Each NASA hourly value is the AVERAGE over its hour, so it belongs to the middle of
    that hour. We draw straight lines between those middles to get a value for every
    5-minute step (taken at the middle of the step)."""
    centres = (weather["time_ist"] + pd.Timedelta(minutes=30)).values.astype("datetime64[s]").astype(float)
    t = step_times_for(weather, dt).values.astype("datetime64[s]").astype(float) + dt / 2
    return np.interp(t, centres, np.asarray(values, dtype=float))


def door_seconds(cfg, weather, seed=None):
    """Random door openings: seconds the door is open in every 5-min step.
    Same for every case, because the random seed is fixed."""
    sim, ds = cfg["simulation"], cfg["door_schedule"]
    seed = sim["random_seed"] if seed is None else seed
    rng = np.random.default_rng(seed)
    n_sub = int(3600 // sim["dt_s"])
    n_hours = len(weather)
    secs = np.zeros(n_hours * n_sub)
    rate = np.asarray(ds["openings_per_hour"], dtype=float)
    counts = rng.poisson(np.tile(rate, n_hours // 24 + 1)[:n_hours])   # clock hour 0, 1, 2 ...
    for H, k in enumerate(counts):
        for _ in range(k):
            secs[H * n_sub + rng.integers(0, n_sub)] += rng.uniform(ds["seconds_min"], ds["seconds_max"])
    return secs


def daily_poa_kWh(weather):
    d = weather.assign(date=weather["time_ist"].dt.normalize())
    return d.groupby("date")["poa"].sum() / 1000.0


# -------------------------------------------------------------- simulation
def simulate(cfg, weather, crop=None, door_secs=None, record=True, outages=None):
    """Run one full year. Returns (summary dict, step DataFrame or None)."""
    crop = crop or load_crops()[cfg["product"]["default_crop"]]
    sim, ctl, sp = cfg["simulation"], cfg["controller"], cfg["setpoint"]
    dt = float(sim["dt_s"])
    n_sub = int(3600 // dt)
    n_hours = len(weather)
    n = n_hours * n_sub

    # ---- inputs for every 5-min step (interpolated from the hourly weather)
    T_out_s = to_steps(weather, weather["T_out"], dt)
    RH_out_s = to_steps(weather, weather["RH_out"], dt)
    p_s = to_steps(weather, weather["ps_Pa"], dt)
    poa_s = np.clip(to_steps(weather, weather["poa"], dt), 0.0, None)
    P_pv_s = pv_power_array(cfg, poa_s, T_out_s)
    Tt, Ct = cop_table(cfg)
    cop_s = np.interp(T_out_s, Tt, Ct)
    if door_secs is None:
        door_secs = door_seconds(cfg, weather)
    D_t = np.minimum(1.0, door_secs / dt)

    step_times = step_times_for(weather, dt)
    step_hour = step_times.hour.values
    step_min = step_times.minute.values
    step_day = ((step_times - step_times[0].normalize()).days).values

    # forecast: next daylight's panel irradiation (perfect forecast from the file)
    dpoa = daily_poa_kWh(weather).values
    sunny_thr = ctl["forecast_sunny_kWh_m2"]

    # ---- room
    UAw = u_value(cfg) * cfg["chamber"]["envelope_area_m2"] / 1000.0          # kW/K
    ch = cfg["chamber"]
    V = ch["length_m"] * ch["width_m"] * ch["height_m"]
    cp_prod = cfg["product"]["cp_kJ_kgK"]
    C_air = 1.25 * V * 1.006
    C_room = C_air + sim["structure_heat_capacity_kJ_K"] + sim["stock_mass_kg"] * cp_prod   # kJ/K
    il = cfg["internal_loads"]
    T_target = sp["target_C"]
    rh_in = sp["rh_room_pct"]
    curtain = cfg["door"]["curtain_installed"]
    r_ref, Q10, T_ref = crop.get("respiration_W_per_kg_at_ref", 0.0), crop["Q10"], crop["T_ref_C"]

    # ---- batch
    pr = cfg["product"]
    m_b = pr["batch_mass_kg"]
    tau = pr["pulldown_hours"] * 3600.0 / math.log(8.0)
    UA_b = m_b * cp_prod / tau                                                  # kW/K
    arrive_h = sim["batch_arrival_hour"]
    merge_after = sim["batch_hours_in_room_before_merge"] * 3600.0

    # ---- PCM
    pc = cfg["pcm"]
    m_p = float(pc["mass_kg"])
    has_pcm = m_p > 0.0
    L, cps, cpl, Tm = pc["latent_kJ_kg"], pc["cp_solid_kJ_kgK"], pc["cp_liquid_kJ_kgK"], pc["T_melt_C"]
    if has_pcm:
        A = pc["slab_area_m2"]
        thick = m_p / (pc["density_kg_m3"] * A)
        half_R = thick / 2.0 / pc["k_W_mK"]
        UA_pa = A / (1.0 / pc["air_side_h_W_m2K"] + half_R) / 1000.0                 # kW/K
        UA_ch = A / (half_R + sim["pcm_charge_coil_R_m2K_W"]) / 1000.0                # kW/K
    else:
        thick = UA_pa = UA_ch = 0.0
    h_min = cps * (sim["pcm_charge_stop_C"] - Tm)
    T_evap = cfg["refrigeration"]["T_evap_C"]

    def T_pcm_of(h):
        if h < 0.0:
            return Tm + h / cps
        if h > L:
            return Tm + (h - L) / cpl
        return Tm

    # ---- compressor / power
    Qmax = cfg["refrigeration"]["design_capacity_kW"]
    Qmin_frac = sim["inverter_min_capacity_frac"]
    ats_thr = ctl["ats_pcm_pct"]
    protect = ctl["protect_above_C"]
    mode = ctl["mode"]
    band_lo, band_hi = sp["band_low_C"], sp["band_high_C"]

    outage = np.zeros(n, dtype=bool)
    for a, b in (outages if outages is not None else sim.get("grid_outage_windows", [])):
        outage |= (step_times >= pd.Timestamp(a)) & (step_times < pd.Timestamp(b))

    # ---- initial state: room at target, PCM fully frozen at T_m, no batch
    T_r = T_target
    h = 0.0
    T_b = None
    b_age = 0.0
    grid_mode = False

    E0 = C_room * T_r + m_p * h
    acc = dict(wall=0.0, door=0.0, door_lat=0.0, internal=0.0, resp=0.0, coil_air=0.0, coil_pcm=0.0,
               prod_in=0.0, prod_out=0.0, pv=0.0, pv_used=0.0, grid=0.0, comp_e=0.0, aux=0.0)

    if record:
        rec = {k: np.empty(n) for k in ("T_out", "T_room", "T_pcm", "pcm_pct", "T_batch", "Q_wall", "Q_door",
                                        "Q_int", "Q_resp", "Q_batch", "Q_coil_air", "Q_coil_pcm",
                                        "P_pv", "P_solar_used", "P_grid", "door_s")}
        rec_grid = np.zeros(n, dtype=bool)

    aux_kW = (il["evaporator_fan_W"] + il["controller_sensors_W"]) / 1000.0

    for i in range(n):
        T_out = T_out_s[i]
        P_pv = P_pv_s[i]
        cop = cop_s[i]
        hod = step_hour[i]

        # -- produce arrives / leaves
        if T_b is not None:
            b_age += dt
            if b_age >= merge_after:
                acc["prod_out"] += m_b * cp_prod * T_r              # old batch leaves at room temp
                T_r += m_b * cp_prod * (T_b - T_r) / C_room          # new batch joins the stock
                T_b = None
        if T_b is None and hod == arrive_h and step_min[i] == 0 and m_b > 0:
            T_b = pr["T_entry_C"]
            b_age = 0.0
            acc["prod_in"] += m_b * cp_prod * T_b

        # -- PCM state
        T_p = T_pcm_of(h) if has_pcm else T_r
        pcm_pct = 100.0 * (1.0 - min(1.0, max(0.0, h / L))) if has_pcm else 0.0

        # -- what can the sun do?
        Q_sun = min(Qmax, P_pv * cop)
        solar_ok = Q_sun >= Qmin_frac * Qmax
        if not solar_ok:
            Q_sun = 0.0

        # -- controller set-points
        T_set = T_target
        thr = ats_thr
        if mode == "forecast":
            day = step_day[i]
            next_light = day if hod < 12 else day + 1
            tomorrow_sunny = dpoa[min(next_light, len(dpoa) - 1)] >= sunny_thr
            if tomorrow_sunny:
                thr = ctl["forecast_ats_pcm_pct_if_sunny_tomorrow"]
            if hod >= 6 and dpoa[min(day + 1, len(dpoa) - 1)] < sunny_thr:
                T_set = ctl["forecast_precool_target_C"]

        # -- ATS
        grid_ok = not outage[i]
        if solar_ok:
            grid_mode = grid_ok and T_r > protect
        else:
            grid_mode = grid_ok and (grid_mode or pcm_pct < thr or T_r > protect)

        # -- heat flows (kW)
        Q_wall = UAw * (T_out - T_r)
        Dt = D_t[i]
        if Dt > 0.0:
            inf = loads.infiltration_load(cfg, T_out, RH_out_s[i], T_r, rh_in, D_t=1.0,
                                          curtain=curtain, p=p_s[i])
            Q_door = inf["Q_kW"] * Dt
            Q_door_lat = inf["Q_latent_kW"] * Dt
        else:
            Q_door = Q_door_lat = 0.0
        Q_int = aux_kW + il["lights_W"] / 1000.0 * max(il["lights_on_fraction"], Dt)
        m_live = sim["stock_mass_kg"] + (m_b if T_b is not None else 0.0)
        Q_resp = m_live * r_ref * Q10 ** ((T_r - T_ref) / 10.0) / 1000.0
        Q_b = UA_b * (T_b - T_r) if T_b is not None else 0.0
        Q_pa = UA_pa * (T_r - T_p) if has_pcm else 0.0

        net = Q_wall + Q_door + Q_int + Q_resp + Q_b - Q_pa
        Q_avail = Qmax if grid_mode else Q_sun
        Q_req = net + C_room * (T_r - T_set) / dt
        Q_air = min(max(Q_req, 0.0), Q_avail)

        Q_ch = 0.0
        if has_pcm and solar_ok and not grid_mode:
            spare = Q_avail - Q_air
            if spare > 0.0:
                Q_ch = max(0.0, min(spare, UA_ch * (T_p - T_evap), m_p * (h - h_min) / dt))

        # -- electricity
        P_comp = (Q_air + Q_ch) / cop
        if grid_mode:                     # ATS on grid: use whatever sun there is, grid the rest
            P_solar_used = min(P_comp, P_pv) if solar_ok else 0.0
            P_grid = P_comp - P_solar_used
        else:                             # solar only (Q_avail was limited to what the sun gives)
            P_solar_used = min(P_comp, P_pv)
            P_grid = 0.0

        # -- integrate (explicit Euler, 5 min)
        T_r += (net - Q_air) * dt / C_room
        if T_b is not None:
            T_b -= Q_b * dt / (m_b * cp_prod)
        if has_pcm:
            h += (Q_pa - Q_ch) * dt / m_p

        # -- totals (kJ)
        acc["wall"] += Q_wall * dt
        acc["door"] += Q_door * dt
        acc["door_lat"] += Q_door_lat * dt
        acc["internal"] += Q_int * dt
        acc["resp"] += Q_resp * dt
        acc["coil_air"] += Q_air * dt
        acc["coil_pcm"] += Q_ch * dt
        acc["pv"] += P_pv * dt
        acc["pv_used"] += P_solar_used * dt
        acc["grid"] += P_grid * dt
        acc["comp_e"] += P_comp * dt

        if record:
            rec["T_out"][i] = T_out
            rec["T_room"][i] = T_r
            rec["T_pcm"][i] = T_pcm_of(h) if has_pcm else np.nan
            rec["pcm_pct"][i] = 100.0 * (1.0 - min(1.0, max(0.0, h / L))) if has_pcm else 0.0
            rec["T_batch"][i] = T_b if T_b is not None else np.nan
            rec["Q_wall"][i] = Q_wall
            rec["Q_door"][i] = Q_door
            rec["Q_int"][i] = Q_int
            rec["Q_resp"][i] = Q_resp
            rec["Q_batch"][i] = Q_b
            rec["Q_coil_air"][i] = Q_air
            rec["Q_coil_pcm"][i] = Q_ch
            rec["P_pv"][i] = P_pv
            rec["P_solar_used"][i] = P_solar_used
            rec["P_grid"][i] = P_grid
            rec["door_s"][i] = door_secs[i]
            rec_grid[i] = grid_mode

        # quick statistics without recording
        if i == 0:
            out_band_steps = 0
            grid_steps = 0
            grid_days = set()
            Tmin, Tmax = T_r, T_r
        if T_r < band_lo or T_r > band_hi:
            out_band_steps += 1
        if grid_mode:
            grid_steps += 1
            grid_days.add(step_day[i])
        Tmin, Tmax = min(Tmin, T_r), max(Tmax, T_r)

    # ---- energy balance
    E_end = C_room * T_r + m_p * h + (m_b * cp_prod * T_b if T_b is not None else 0.0)
    heat_in = acc["wall"] + acc["door"] + acc["internal"] + acc["resp"] + acc["prod_in"]
    heat_out = acc["coil_air"] + acc["coil_pcm"] + acc["prod_out"]
    stored = E_end - E0
    bal_err = heat_in - heat_out - stored
    n_days = n // (24 * n_sub)
    kWh = 1 / 3600.0

    summary = {
        "pcm_mass_kg": m_p, "pv_kWp": cfg["pv"]["rated_kWp"], "Qmax_kW": Qmax,
        "curtain": curtain, "mode": mode,
        "days": n_days,
        "days_full_solar_pcm": n_days - len(grid_days),
        "pct_days_full_solar_pcm": 100.0 * (n_days - len(grid_days)) / n_days,
        "grid_hours": grid_steps * dt / 3600.0,
        "grid_kWh": acc["grid"] * kWh,
        "hours_outside_2_8C": out_band_steps * dt / 3600.0,
        "T_room_min_C": Tmin, "T_room_max_C": Tmax,
        "pv_kWh": acc["pv"] * kWh,
        "pv_used_kWh": acc["pv_used"] * kWh,
        "solar_wasted_kWh": (acc["pv"] - acc["pv_used"]) * kWh,
        "solar_wasted_pct": 100.0 * (acc["pv"] - acc["pv_used"]) / acc["pv"] if acc["pv"] > 0 else 0.0,
        "compressor_kWh_e": acc["comp_e"] * kWh,
        "cooling_kWh_th": (acc["coil_air"] + acc["coil_pcm"]) * kWh,
        "cooling_to_pcm_kWh_th": acc["coil_pcm"] * kWh,
        "seasonal_COP_elec": (acc["coil_air"] + acc["coil_pcm"]) / acc["comp_e"] if acc["comp_e"] else float("nan"),
        "load_wall_kWh": acc["wall"] * kWh, "load_door_kWh": acc["door"] * kWh,
        "load_door_latent_kWh": acc["door_lat"] * kWh,
        "load_internal_kWh": acc["internal"] * kWh, "load_resp_kWh": acc["resp"] * kWh,
        "load_product_kWh": (acc["prod_in"] - acc["prod_out"]) * kWh,
        "energy_in_kWh": heat_in * kWh, "energy_out_kWh": heat_out * kWh,
        "stored_change_kWh": stored * kWh,
        "energy_balance_error_kWh": bal_err * kWh,
        "energy_balance_error_pct": 100.0 * abs(bal_err) / heat_out if heat_out else 0.0,
        "door_openings_s_per_day": door_secs.sum() / n_days,
        "C_room_kJ_K": C_room, "UA_pcm_air_W_K": UA_pa * 1000, "UA_pcm_coil_W_K": UA_ch * 1000,
        "pcm_slab_thickness_mm": thick * 1000, "UA_batch_W_K": UA_b * 1000,
    }
    if not record:
        return summary, None
    df = pd.DataFrame(rec, index=step_times)
    df["grid_on"] = rec_grid
    return summary, df


def run(overrides=None, weather=None, record=True, outages=None, cfg=None):
    """Convenience wrapper: load config, apply overrides, run the year."""
    from engine.config import with_overrides
    from twin.weather import load_weather
    cfg = with_overrides(cfg or load_config(), overrides or {})
    weather = weather if weather is not None else load_weather(cfg=cfg)
    return simulate(cfg, weather, record=record, outages=outages)
