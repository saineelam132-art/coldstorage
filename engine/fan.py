"""Night wax fan: a small 12 V DC axial fan pushing room air DOWN a baffle channel in front of the
wax (PCM) panels.

Geometry (config/design.json -> live_run.night_fan):
    wax panels  : total face area A (12 m2), height H, so channel width W = A / H
    baffle      : thin sheet a gap s (5 cm) in front of the panels, open at top and bottom
    fan(s)      : at the TOP, blowing DOWN - the same way cold air falls by itself, so with the fan
                  off the channel still works as a natural 'chimney'

Heat taken from the room by the channel (heat-exchanger, effectiveness-NTU method):
    m      = rho * v * s * W                          air mass flow       [kg/s]
    U      = 1 / (1/h + R_wax)                        air film + half the wax slab
    NTU    = U * A / (m * cp)
    Q      = m * cp * (T_room - T_wax) * (1 - exp(-NTU))      [W]
    h from the channel correlations (hydraulic diameter Dh = 2 s, one wall cooled, baffle adiabatic):
        laminar  (Re < 2300): Nu = 4.86 + 0.0668 Gz / (1 + 0.04 Gz^(2/3)),  Gz = Re Pr Dh / H
        turbulent           : Gnielinski
    natural (fan off): the cooled, heavier air in the channel falls by itself; its speed comes from
        buoyancy  rho*beta*dT_air/2 * g * H  =  laminar friction 12 mu H v / s^2 + 1.5 * rho v^2 / 2
    Radiation from the room to the panels is ignored (the baffle blocks most of it) -> conservative.

Fan power ~ speed^3 (fan laws); airflow ~ speed. ALL fan power becomes heat inside the room.
"""
import math

import numpy as np

# dry air near 5 C
RHO, CP, K_AIR, NU, PR, MU = 1.27, 1006.0, 0.0244, 1.37e-5, 0.71, 1.74e-5
BETA, G = 1.0 / 278.0, 9.81

# typical 12 V DC axial fans (free-air values, typical catalogue data - check the chosen model)
CATALOGUE = [
    {"name": "80 mm 12 V DC", "d_mm": 80, "flow_m3h": 50, "watts": 1.0, "pressure_Pa": 20},
    {"name": "92 mm 12 V DC", "d_mm": 92, "flow_m3h": 70, "watts": 1.5, "pressure_Pa": 25},
    {"name": "120 mm 12 V DC", "d_mm": 120, "flow_m3h": 150, "watts": 3.0, "pressure_Pa": 30},
    {"name": "140 mm 12 V DC", "d_mm": 140, "flow_m3h": 200, "watts": 4.0, "pressure_Pa": 30},
    {"name": "172 mm 12 V DC", "d_mm": 172, "flow_m3h": 400, "watts": 12.0, "pressure_Pa": 60},
]


def geometry(cfg):
    nf = cfg["live_run"]["night_fan"]
    A = cfg["pcm"]["slab_area_m2"]
    return {"A": A, "H": nf["panel_height_m"], "W": A / nf["panel_height_m"], "s": nf["gap_m"]}


def h_channel(v, s, H):
    """Heat-transfer coefficient in the channel [W/m2K] and Reynolds number."""
    Dh = 2.0 * s
    Re = max(v, 1e-6) * Dh / NU
    if Re < 2300:
        Gz = Re * PR * Dh / H
        Nu = 4.86 + 0.0668 * Gz / (1.0 + 0.04 * Gz ** (2.0 / 3.0))
    else:
        f = (0.79 * math.log(Re) - 1.64) ** -2
        Nu = (f / 8) * (Re - 1000) * PR / (1 + 12.7 * math.sqrt(f / 8) * (PR ** (2 / 3) - 1))
    return Nu * K_AIR / Dh, Re


def channel(v, geo, R_wax, dT):
    """Heat taken from the room [W] at air speed v (m/s) and room-wax difference dT (K)."""
    if dT <= 0:
        return {"Q": 0.0, "h": 0.0, "Re": 0.0, "NTU": 0.0, "G": 0.0, "v": v}
    h, Re = h_channel(v, geo["s"], geo["H"])
    U = 1.0 / (1.0 / h + R_wax)
    mcp = RHO * v * geo["s"] * geo["W"] * CP
    NTU = U * geo["A"] / mcp
    G = mcp * (1.0 - math.exp(-NTU))           # W/K
    return {"Q": G * dT, "h": h, "Re": Re, "NTU": NTU, "G": G, "v": v, "U": U}


def natural(geo, R_wax, dT):
    """Fan off: speed of the cold air falling down the channel by itself, and the heat it takes."""
    if dT <= 0:
        return channel(0.0, geo, R_wax, 0.0)
    v = 0.1
    for _ in range(80):
        c = channel(v, geo, R_wax, dT)
        dT_air = c["Q"] / (RHO * v * geo["s"] * geo["W"] * CP)
        dp = RHO * BETA * (dT_air / 2) * G * geo["H"]
        a, b = 1.5 * RHO / 2, 12 * MU * geo["H"] / geo["s"] ** 2
        vn = (-b + math.sqrt(b * b + 4 * a * dp)) / (2 * a)
        v = 0.5 * v + 0.5 * vn
    return channel(v, geo, R_wax, dT)


def channel_pressure(v, geo):
    """Pressure the fan must give at speed v: friction + entry/exit + baffle turn (K = 1.5)."""
    h, Re = h_channel(v, geo["s"], geo["H"])
    Dh = 2 * geo["s"]
    if Re < 2300:
        dp_f = 12 * MU * geo["H"] * v / geo["s"] ** 2
    else:
        f = (0.79 * math.log(Re) - 1.64) ** -2
        dp_f = f * geo["H"] / Dh * RHO * v * v / 2
    return dp_f + 1.5 * RHO * v * v / 2


def wax_resistance(cfg, pcm_kg):
    p = cfg["pcm"]
    thick = pcm_kg / (p["density_kg_m3"] * p["slab_area_m2"])
    return thick / 2 / p["k_W_mK"]


def design_night_load(cfg, T_out_night, T_room=7.0, fan_W=0.0):
    """Heat entering the room at night with the door shut and no pull-down [W]."""
    lr = cfg["live_run"]
    W_in, H_in, L_in = lr["inside_m"]
    UAw = cfg["chamber"]["insulation_k_W_mK"] / lr["insulation_thickness_m"] * cfg["chamber"]["envelope_area_m2"]
    from engine.config import load_crops
    crop = load_crops()[cfg["product"]["default_crop"]]
    resp = lr["produce_kg"] * crop["respiration_W_per_kg_at_ref"] * crop["Q10"] ** ((T_room - crop["T_ref_C"]) / 10)
    ctrl = cfg["internal_loads"]["controller_sensors_W"]
    parts = {"walls": UAw * (T_out_night - T_room), "respiration": resp, "controller": ctrl, "fan heat": fan_W}
    return sum(parts.values()), parts


def size_fan(cfg, T_out_night, pcm_kg, T_room_max=7.0, margin=1.25):
    """Pick the fan: the air speed needed so the channel takes the whole night load with the room at
    T_room_max and the wax at its melting point, then the smallest catalogue fan set that gives
    that airflow (with a margin) at the channel's pressure drop."""
    geo = geometry(cfg)
    R = wax_resistance(cfg, pcm_kg)
    T_wax = cfg["pcm"]["T_melt_C"]
    dT = T_room_max - T_wax
    nat = natural(geo, R, dT)
    best = None
    fan_W = 0.0
    for _ in range(6):                          # fan heat is part of the load -> iterate
        Q_need, parts = design_night_load(cfg, T_out_night, T_room_max, fan_W)
        lo, hi = 0.01, 5.0
        for _ in range(60):
            mid = 0.5 * (lo + hi)
            lo, hi = (mid, hi) if channel(mid, geo, R, dT)["Q"] < Q_need else (lo, mid)
        v_need = hi
        flow = v_need * geo["s"] * geo["W"] * 3600
        dp = channel_pressure(v_need, geo)
        options = []
        for f in CATALOGUE:
            n = max(1, math.ceil(flow * margin / f["flow_m3h"]))
            # a fan's airflow falls as the pressure rises (straight-line fan curve)
            eff_flow = f["flow_m3h"] * max(0.1, 1 - dp / f["pressure_Pa"])
            n = max(n, math.ceil(flow * margin / eff_flow))
            options.append({**f, "count": n, "total_W": n * f["watts"], "total_flow_m3h": n * eff_flow})
        # practical: at most about one fan per 0.5 m of channel, then the least watts
        max_count = math.ceil(geo["W"] / 0.5)
        ok = [o for o in options if o["count"] <= max_count] or options
        best = min(ok, key=lambda o: (o["total_W"], o["count"]))
        # power actually drawn at the design point: fan laws, speed = needed / available flow
        speed = min(1.0, flow / best["total_flow_m3h"])
        fan_W_new = best["total_W"] * speed ** 3
        if abs(fan_W_new - fan_W) < 0.05:
            break
        fan_W = fan_W_new
    c = channel(v_need, geo, R, dT)
    return {"geometry": geo, "R_wax_m2K_W": R, "T_out_design_night_C": T_out_night, "T_room_max_C": T_room_max,
            "T_wax_C": T_wax, "load_W": Q_need, "load_parts_W": parts, "v_needed_m_s": v_need,
            "flow_needed_m3h": flow, "pressure_Pa": dp, "h_fan_W_m2K": c["h"], "Re_fan": c["Re"], "UA_fan_W_K": c["G"],
            "h_natural_W_m2K": nat["h"], "v_natural_m_s": nat["v"], "UA_natural_W_K": nat["G"],
            "Q_natural_W": nat["Q"], "fan": best, "speed_at_design": speed, "fan_W_at_design": fan_W_new, "margin": margin}


def conductance_tables(cfg, pcm_kg, fan, n=51):
    """Fast lookup for the simulator: channel conductance G (W/K) vs fan speed (0..1), and
    natural-draft conductance vs room-wax temperature difference."""
    geo = geometry(cfg)
    R = wax_resistance(cfg, pcm_kg)
    v_max = fan["total_flow_m3h"] / 3600 / (geo["s"] * geo["W"])
    speeds = np.linspace(0, 1, n)
    G_fan = np.array([channel(max(1e-3, s * v_max), geo, R, 1.0)["G"] for s in speeds])
    dTs = np.linspace(0, 15, 61)
    G_nat = np.array([natural(geo, R, max(dT, 1e-3))["G"] for dT in dTs])
    return speeds, G_fan, dTs, G_nat, v_max
