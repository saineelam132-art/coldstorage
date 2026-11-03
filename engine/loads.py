"""Heat loads on the cold room (all results in kW).

1. Wall heat leak            Q_wall = U * A * (T_out - T_in)
2. Door infiltration         ASHRAE Refrigeration Handbook (Gosney-Olama form)
3. Product load              Q = m * cp * dT / time  +  respiration heat
4. Internal (fans, lights)   simple sum of electrical power
5. Total                     sum of the above, + safety margin shown separately
"""
import math

from . import psychro
from .config import u_value

G = 9.81  # m/s2


# ---------------------------------------------------------------- 1. walls
def wall_load(cfg, T_out_C, T_in_C):
    U = u_value(cfg)
    A = cfg["chamber"]["envelope_area_m2"]
    Q_kW = U * A * (T_out_C - T_in_C) / 1000.0
    return {
        "U_W_m2K": U, "A_m2": A, "dT_K": T_out_C - T_in_C, "Q_kW": Q_kW,
        "formula": "Q_wall = U * A * (T_out - T_in)",
    }


# ------------------------------------------------------ 2. door infiltration
def door_open_fraction(openings_per_hour, seconds_per_opening):
    """D_t = fraction of time the door is open."""
    return min(1.0, openings_per_hour * seconds_per_opening / 3600.0)


def infiltration_load(cfg, T_out_C, rh_out_pct, T_in_C, rh_in_pct,
                      D_t=None, curtain=None, p=None):
    """Door infiltration, ASHRAE Refrigeration Handbook (2018) ch. 24, eq. (9)-(12).

    q      = 0.221 * A * (h_out - h_in) * rho_in * (1 - rho_out/rho_in)^0.5 * (g*H)^0.5 * F_m
    F_m    = [2 / (1 + (rho_in/rho_out)^(1/3))]^1.5         (density factor)
    Q_avg  = q * D_t * D_f * (1 - E)

    'in' = the cold room air, 'out' = the warm air coming in.
    q is the load while the door is fully open; Q_avg is the time average.
    The total is split into sensible (temperature) and latent (moisture) parts:
        sensible = h(T_out, W_out) - h(T_in, W_out)
        latent   = h(T_in,  W_out) - h(T_in, W_in)
    """
    door = cfg["door"]
    p = p or cfg["site"]["pressure_Pa"]
    if D_t is None:
        D_t = door_open_fraction(door["openings_per_hour"], door["seconds_per_opening"])
    if curtain is None:
        curtain = door["curtain_installed"]
    E = door["curtain_effectiveness_E"] if curtain else 0.0
    D_f = door["flow_factor_Df"]
    W_d, H_d = door["width_m"], door["height_m"]
    A = W_d * H_d

    W_out = psychro.humidity_ratio(T_out_C, rh_out_pct, p)
    W_in = psychro.humidity_ratio(T_in_C, rh_in_pct, p)
    h_out = psychro.enthalpy_from_W(T_out_C, W_out)
    h_in = psychro.enthalpy_from_W(T_in_C, W_in)
    rho_out = psychro.density(T_out_C, rh_out_pct, p)
    rho_in = psychro.density(T_in_C, rh_in_pct, p)

    if rho_in <= rho_out or h_out <= h_in:
        # Outside is colder/denser than inside: no cold air spills out, no load.
        q_open, F_m = 0.0, 0.0
    else:
        F_m = (2.0 / (1.0 + (rho_in / rho_out) ** (1.0 / 3.0))) ** 1.5
        q_open = (0.221 * A * (h_out - h_in) * rho_in
                  * math.sqrt(1.0 - rho_out / rho_in) * math.sqrt(G * H_d) * F_m)

    Q_avg = q_open * D_t * D_f * (1.0 - E)

    dh_total = h_out - h_in
    dh_sens = psychro.enthalpy_from_W(T_out_C, W_out) - psychro.enthalpy_from_W(T_in_C, W_out)
    dh_lat = psychro.enthalpy_from_W(T_in_C, W_out) - psychro.enthalpy_from_W(T_in_C, W_in)
    sens_frac = dh_sens / dh_total if dh_total > 0 else 1.0
    lat_frac = dh_lat / dh_total if dh_total > 0 else 0.0

    return {
        "A_m2": A, "H_m": H_d,
        "h_out_kJ_kg": h_out, "h_in_kJ_kg": h_in,
        "W_out": W_out, "W_in": W_in,
        "rho_out": rho_out, "rho_in": rho_in,
        "F_m": F_m, "D_t": D_t, "D_f": D_f, "E": E,
        "q_open_kW": q_open,
        "Q_kW": Q_avg,
        "Q_sensible_kW": Q_avg * sens_frac,
        "Q_latent_kW": Q_avg * lat_frac,
        "formula": "q = 0.221*A*(h_out-h_in)*rho_in*(1-rho_out/rho_in)^0.5*(g*H)^0.5*F_m ; "
                   "Q = q*D_t*D_f*(1-E)",
    }


# ------------------------------------------------------------ 3. product
def respiration_W_per_kg(crop, T_C):
    """Respiration heat of living produce. Table value at T_ref, scaled by the
    crop's Q10 (respiration and spoilage speed up together with temperature)."""
    r_ref = crop.get("respiration_W_per_kg_at_ref", 0.0)
    return r_ref * crop["Q10"] ** ((T_C - crop["T_ref_C"]) / 10.0)


def product_load(cfg, crop, mass_kg=None, T_entry_C=None, T_final_C=None,
                 hours=None, in_pulldown=True, T_room_C=None):
    """Q_pulldown = m * cp * (T_entry - T_final) / time ;  Q_resp = m * r(T)."""
    pr = cfg["product"]
    m = pr["batch_mass_kg"] if mass_kg is None else mass_kg
    T1 = pr["T_entry_C"] if T_entry_C is None else T_entry_C
    T2 = pr["T_final_C"] if T_final_C is None else T_final_C
    t_h = pr["pulldown_hours"] if hours is None else hours
    cp = pr["cp_kJ_kgK"]
    T_room = cfg["setpoint"]["target_C"] if T_room_C is None else T_room_C

    Q_pull = m * cp * (T1 - T2) / (t_h * 3600.0) if in_pulldown else 0.0
    Q_resp = m * respiration_W_per_kg(crop, T_room) / 1000.0
    return {
        "m_kg": m, "cp_kJ_kgK": cp, "dT_K": T1 - T2, "hours": t_h,
        "Q_pulldown_kW": Q_pull, "Q_respiration_kW": Q_resp,
        "Q_kW": Q_pull + Q_resp,
        "formula": "Q = m*cp*(T_entry-T_final)/time + m*r_resp(T)",
    }


# ----------------------------------------------------------- 4. internal
def internal_load(cfg, door_open_fraction_=0.0):
    il = cfg["internal_loads"]
    lights_frac = max(il["lights_on_fraction"], door_open_fraction_)
    W = il["evaporator_fan_W"] + il["lights_W"] * lights_frac + il["controller_sensors_W"]
    return {"Q_kW": W / 1000.0, "formula": "Q = P_fan + P_lights*on_fraction + P_controller"}


# -------------------------------------------------------------- 5. total
def total_load(cfg, crop, T_out_C, rh_out_pct, T_in_C=None, rh_in_pct=None,
               D_t=None, curtain=None, in_pulldown=True):
    sp = cfg["setpoint"]
    T_in = sp["target_C"] if T_in_C is None else T_in_C
    rh_in = sp["rh_room_pct"] if rh_in_pct is None else rh_in_pct

    wall = wall_load(cfg, T_out_C, T_in)
    inf = infiltration_load(cfg, T_out_C, rh_out_pct, T_in, rh_in, D_t=D_t, curtain=curtain)
    prod = product_load(cfg, crop, in_pulldown=in_pulldown, T_room_C=T_in)
    internal = internal_load(cfg, inf["D_t"])

    subtotal = wall["Q_kW"] + inf["Q_kW"] + prod["Q_kW"] + internal["Q_kW"]
    margin = cfg["internal_loads"]["safety_margin_frac"] * subtotal
    return {
        "wall": wall, "infiltration": inf, "product": prod, "internal": internal,
        "subtotal_kW": subtotal,
        "safety_margin_kW": margin,
        "total_with_margin_kW": subtotal + margin,
        "breakdown_kW": {
            "Walls": wall["Q_kW"],
            "Door (sensible)": inf["Q_sensible_kW"],
            "Door (latent)": inf["Q_latent_kW"],
            "Product pull-down": prod["Q_pulldown_kW"],
            "Respiration": prod["Q_respiration_kW"],
            "Fans & lights": internal["Q_kW"],
        },
    }
