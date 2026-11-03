"""R290 (propane) vapour-compression refrigeration cycle, properties from CoolProp.

State points (standard simple cycle):
  1  compressor inlet   - saturated vapour at T_evap (+ superheat)
  2s compressor outlet  - ideal (isentropic): same entropy as 1, at P_cond
  2  compressor outlet  - real: h2 = h1 + (h2s - h1) / eta_isentropic
  3  condenser outlet   - saturated liquid at T_cond (- subcooling)
  4  evaporator inlet   - after expansion valve, h4 = h3 (throttling)

  q_e       = h1 - h4                  refrigerating effect     [kJ/kg]
  w_s       = h2s - h1                 ideal compressor work    [kJ/kg]
  COP_ideal = q_e / w_s
  COP_real  = q_e / (w_s / eta_is)     = COP_ideal * eta_is
  COP_elec  = COP_real * eta_motor     (includes motor + inverter losses)
  m_dot     = Q_evap / q_e
  P_elec    = Q_evap / COP_elec
"""
from functools import lru_cache

from CoolProp.CoolProp import PropsSI

FLUID = "Propane"   # CoolProp name for R290


@lru_cache(maxsize=4096)
def _cycle_states(T_evap_C, T_cond_C, superheat_K, subcool_K, fluid):
    Te = T_evap_C + 273.15
    Tc = T_cond_C + 273.15
    P_e = PropsSI("P", "T", Te, "Q", 1, fluid)
    P_c = PropsSI("P", "T", Tc, "Q", 0, fluid)

    if superheat_K > 0:
        T1 = Te + superheat_K
        h1 = PropsSI("H", "T", T1, "P", P_e, fluid)
        s1 = PropsSI("S", "T", T1, "P", P_e, fluid)
    else:
        T1 = Te
        h1 = PropsSI("H", "T", Te, "Q", 1, fluid)
        s1 = PropsSI("S", "T", Te, "Q", 1, fluid)

    h2s = PropsSI("H", "P", P_c, "S", s1, fluid)
    T2s = PropsSI("T", "P", P_c, "S", s1, fluid)

    if subcool_K > 0:
        T3 = Tc - subcool_K
        h3 = PropsSI("H", "T", T3, "P", P_c, fluid)
    else:
        T3 = Tc
        h3 = PropsSI("H", "T", Tc, "Q", 0, fluid)
    return P_e, P_c, T1, h1, s1, h2s, T2s, T3, h3


def cycle(T_evap_C=-5.0, T_cond_C=50.0, Q_evap_kW=1.5, eta_is=0.75, eta_motor=0.85,
          superheat_K=0.0, subcool_K=0.0, fluid=FLUID):
    """Solve the cycle. Returns a dict (pressures in bar, enthalpies in kJ/kg)."""
    # Round temperatures so repeated calls hit the cache (0.01 K is far below sensor accuracy).
    P_e, P_c, T1, h1, s1, h2s, T2s, T3, h3 = _cycle_states(
        round(T_evap_C, 2), round(T_cond_C, 2), round(superheat_K, 2), round(subcool_K, 2), fluid)

    h1, h2s, h3 = h1 / 1000.0, h2s / 1000.0, h3 / 1000.0
    h4 = h3
    q_e = h1 - h4
    w_s = h2s - h1
    w_real = w_s / eta_is
    h2 = h1 + w_real
    T2 = PropsSI("T", "P", P_c, "H", h2 * 1000.0, fluid) - 273.15

    cop_ideal = q_e / w_s
    cop_real = q_e / w_real
    cop_elec = cop_real * eta_motor
    m_dot = Q_evap_kW / q_e                     # kg/s
    P_shaft = m_dot * w_real                    # kW
    P_elec = Q_evap_kW / cop_elec               # kW
    Q_cond = Q_evap_kW + P_shaft                # heat rejected

    return {
        "T_evap_C": T_evap_C, "T_cond_C": T_cond_C,
        "P_evap_bar": P_e / 1e5, "P_cond_bar": P_c / 1e5,
        "pressure_ratio": P_c / P_e,
        "h1": h1, "h2s": h2s, "h2": h2, "h3": h3, "h4": h4,
        "T1_C": T1 - 273.15, "T2s_C": T2s - 273.15, "T2_C": T2, "T3_C": T3 - 273.15,
        "s1_kJ_kgK": s1 / 1000.0,
        "q_e": q_e, "w_s": w_s, "w_real": w_real,
        "COP_ideal": cop_ideal, "COP_real": cop_real, "COP_elec": cop_elec,
        "Q_evap_kW": Q_evap_kW,
        "m_dot_kg_s": m_dot, "m_dot_g_s": m_dot * 1000.0,
        "P_shaft_kW": P_shaft, "P_elec_kW": P_elec, "Q_cond_kW": Q_cond,
        "eta_is": eta_is, "eta_motor": eta_motor,
    }


def cycle_from_config(cfg, T_amb_C=None, Q_evap_kW=None):
    """Live cycle: T_cond = T_amb + approach (10 K). If T_amb is None use the design T_cond."""
    r = cfg["refrigeration"]
    T_cond = r["T_cond_design_C"] if T_amb_C is None else T_amb_C + r["cond_approach_K"]
    Q = r["design_capacity_kW"] if Q_evap_kW is None else Q_evap_kW
    return cycle(r["T_evap_C"], T_cond, Q, r["eta_isentropic"], r["eta_motor_drive"],
                 r["superheat_K"], r["subcool_K"], r["coolprop_name"])


@lru_cache(maxsize=4)
def saturation_dome(fluid=FLUID, n=60, T_min_C=-40.0):
    """Points on the saturated-liquid and saturated-vapour lines, for the P-h diagram.
    Returns lists of (h kJ/kg, P bar)."""
    T_crit = PropsSI("Tcrit", fluid)
    liq, vap = [], []
    T0 = T_min_C + 273.15
    for i in range(n + 1):
        T = T0 + (T_crit - 0.5 - T0) * i / n
        P = PropsSI("P", "T", T, "Q", 0, fluid) / 1e5
        liq.append((PropsSI("H", "T", T, "Q", 0, fluid) / 1000.0, P))
        vap.append((PropsSI("H", "T", T, "Q", 1, fluid) / 1000.0, P))
    return {"liquid": liq, "vapour": vap}


def cycle_polyline(c):
    """The cycle drawn on a P-h diagram: 1 -> 2 -> 3 -> 4 -> 1 as (h, P) points."""
    return [(c["h1"], c["P_evap_bar"]), (c["h2"], c["P_cond_bar"]),
            (c["h3"], c["P_cond_bar"]), (c["h4"], c["P_evap_bar"]),
            (c["h1"], c["P_evap_bar"])]
