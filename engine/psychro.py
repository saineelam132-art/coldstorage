"""Moist-air (psychrometric) properties from temperature and relative humidity.

Standard equations from the ASHRAE Handbook - Fundamentals (2017), Chapter 1.
We write them out ourselves (instead of a black box) so every step can be shown
on screen. A unit test checks them against CoolProp's HumidAir library.

Units: T in deg C, RH in %, pressure in Pa,
       W (humidity ratio) in kg water / kg dry air,
       h (enthalpy) in kJ / kg dry air, density in kg / m3 of moist air.
"""
import math

R_DRY_AIR = 287.042      # J/kg.K
P_ATM = 101325.0         # Pa


def p_sat(T_C):
    """Saturation vapour pressure [Pa] - Hyland-Wexler equations (ASHRAE eq. 5 and 6)."""
    T = T_C + 273.15
    if T_C >= 0.0:   # over liquid water
        c8, c9, c10, c11, c12, c13 = (-5.8002206e3, 1.3914993, -4.8640239e-2,
                                      4.1764768e-5, -1.4452093e-8, 6.5459673)
        ln_p = c8 / T + c9 + c10 * T + c11 * T**2 + c12 * T**3 + c13 * math.log(T)
    else:            # over ice
        c1, c2, c3, c4, c5, c6, c7 = (-5.6745359e3, 6.3925247, -9.6778430e-3,
                                      6.2215701e-7, 2.0747825e-9, -9.4840240e-13, 4.1635019)
        ln_p = (c1 / T + c2 + c3 * T + c4 * T**2 + c5 * T**3 + c6 * T**4
                + c7 * math.log(T))
    return math.exp(ln_p)


def humidity_ratio(T_C, rh_pct, p=P_ATM):
    """W = 0.621945 * p_w / (p - p_w), with p_w = RH * p_sat(T)."""
    p_w = (rh_pct / 100.0) * p_sat(T_C)
    return 0.621945 * p_w / (p - p_w)


def enthalpy_from_W(T_C, W):
    """h = 1.006*T + W*(2501 + 1.86*T)   [kJ/kg dry air]."""
    return 1.006 * T_C + W * (2501.0 + 1.86 * T_C)


def enthalpy(T_C, rh_pct, p=P_ATM):
    return enthalpy_from_W(T_C, humidity_ratio(T_C, rh_pct, p))


def density(T_C, rh_pct, p=P_ATM):
    """Density of moist air [kg/m3]:
    rho = p / (R_da * T) * (1 + W) / (1 + 1.607858 * W)
    """
    W = humidity_ratio(T_C, rh_pct, p)
    T = T_C + 273.15
    return p / (R_DRY_AIR * T) * (1.0 + W) / (1.0 + 1.607858 * W)


def state(T_C, rh_pct, p=P_ATM):
    """All properties at once, as a dict (handy for the Calculations screen)."""
    W = humidity_ratio(T_C, rh_pct, p)
    return {
        "T_C": T_C,
        "rh_pct": rh_pct,
        "p_Pa": p,
        "p_sat_Pa": p_sat(T_C),
        "W_kg_kg": W,
        "h_kJ_kg": enthalpy_from_W(T_C, W),
        "rho_kg_m3": density(T_C, rh_pct, p),
    }
