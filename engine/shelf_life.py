"""Shelf life from temperature history - Q10 model.

    rate(T) = (1 / SL_ref) * Q10 ^ ((T - T_ref) / 10)          [fraction of life used per day]
    used    = sum( rate(T_i) * dt_i )                          (dt in days)
    Remaining shelf life (at reference temperature) = SL_ref * (1 - used)        [days]
    Remaining shelf life (if kept at today's temp)  = (1 - used) / rate(T_now)    [days]
    Freshness score = 100 * (1 - used)                                           [0-100]

Chilling-injury warning: tropical crops (tomato, mango, pomegranate) get damaged if kept
below a limit temperature, even though the Q10 model says "colder = longer life".
"""


def rate_per_day(crop, T_C):
    return (1.0 / crop["SL_ref_days"]) * crop["Q10"] ** ((T_C - crop["T_ref_C"]) / 10.0)


def assess(crop, temps_C, dt_hours, chill_minutes_alarm=60.0):
    """temps_C: list of temperatures, one per time step of length dt_hours
    (a single number for equal steps, or a list of the same length)."""
    if not isinstance(dt_hours, (list, tuple)):
        dt_hours = [dt_hours] * len(temps_C)

    used = 0.0
    chill_limit = crop.get("chill_injury_below_C")
    freeze_limit = crop.get("freeze_below_C")
    chill_min = 0.0
    freeze_min = 0.0
    for T, dh in zip(temps_C, dt_hours):
        used += rate_per_day(crop, T) * dh / 24.0
        if chill_limit is not None and T < chill_limit:
            chill_min += dh * 60.0
        if freeze_limit is not None and T < freeze_limit:
            freeze_min += dh * 60.0

    used = min(1.0, used)
    T_now = temps_C[-1] if temps_C else crop["T_ref_C"]
    remaining_ref = crop["SL_ref_days"] * (1.0 - used)
    remaining_now = (1.0 - used) / rate_per_day(crop, T_now)

    warnings = []
    if chill_limit is not None and chill_min >= chill_minutes_alarm:
        warnings.append(
            f"Chilling injury risk: {chill_min/60:.1f} h below {chill_limit:g} C "
            f"(safe range for {crop['label']} is {crop['T_opt_low_C']:g}-{crop['T_opt_high_C']:g} C).")
    if freeze_limit is not None and freeze_min > 0:
        warnings.append(f"Freezing risk: {freeze_min:.0f} min below {freeze_limit:g} C.")

    return {
        "fraction_used": used,
        "freshness_score": round(100.0 * (1.0 - used), 1),
        "remaining_days_at_ref": remaining_ref,
        "remaining_days_at_current_T": remaining_now,
        "T_ref_C": crop["T_ref_C"],
        "T_now_C": T_now,
        "chill_minutes": chill_min,
        "freeze_minutes": freeze_min,
        "warnings": warnings,
        "formula": "rate(T) = 1/SL_ref * Q10^((T-T_ref)/10); remaining = SL_ref*(1 - sum(rate*dt))",
    }


def chilling_warning_now(crop, T_room_C):
    """Instant check for the live screen: is the room colder than this crop can take?"""
    lim = crop.get("chill_injury_below_C")
    if lim is not None and T_room_C < lim:
        return (f"Room {T_room_C:.1f} C is below the chilling-injury limit of "
                f"{lim:g} C for {crop['label']}.")
    return None


# =========================================================================================
# Freshness model v2 (asymmetric around the best temperature + water loss + freezing damage)
# for ONE produce first (data/crops.json -> <crop>.freshness). The old assess() above is unchanged.
#
#   k_T = Q10 ^ ((T - T_opt) / 10)                         warm side (k = 1 at T_opt)
#   k_C = 1 + a_c * (T_ci - T)^2   for T < T_ci             cold side (chilling-sensitive produce)
#   k   = max(k_T, k_C);  LifeUsed += k * dt / SL_ref        (dt, SL_ref in hours)
#   VPD = e_s(T) * (1 - RH/100)                             [hPa]
#   WL += K_t * VPD * (v / 1 m/s)^0.5 * dt                  [% of weight]
#   F   = 100 * max(0, 1 - LifeUsed) * max(0, 1 - WL / WL_max)
#   core below T_freeze for more than 30 min -> F capped at the 'damaged' level
#   price = base * F / 100
# =========================================================================================
import math as _m

KT_UNIT = 3.6e-5          # mg kg^-1 s^-1 MPa^-1  ->  % per hour per hPa


def e_s_hPa(T):
    """Saturation vapour pressure (Magnus, as in the brief)."""
    return 6.112 * _m.exp(17.62 * T / (243.12 + T))


def rate_k(crop, T):
    """Life-use speed relative to the best temperature (1 = one hour of life per hour)."""
    f = crop["freshness"]
    kT = crop["Q10"] ** ((T - f["T_opt_C"]) / 10.0)
    ci = crop.get("chill_injury_below_C")
    kC = 1.0 + f["chill_a_c_per_K2"] * (ci - T) ** 2 if ci is not None and T < ci else 1.0
    return max(kT, kC)


def water_loss_rate(crop, T, RH, v):
    """Weight-loss rate in % per hour."""
    f = crop["freshness"]
    vpd = e_s_hPa(T) * (1.0 - min(100.0, max(0.0, RH)) / 100.0)
    return f["K_t_mg_kg_s_MPa"] * KT_UNIT * vpd * (max(v, 0.0) / 1.0) ** 0.5


class Freshness:
    """Step-by-step freshness of one batch. state = {life_used, wl_pct, freeze_min, damaged}."""

    def __init__(self, crop, state=None):
        self.crop, self.f = crop, crop["freshness"]
        s = state or {}
        self.life_used = s.get("life_used", 0.0)
        self.wl = s.get("wl_pct", 0.0)
        self.freeze_min = s.get("freeze_min", 0.0)
        self.damaged = s.get("damaged", False)

    def step(self, T_air, RH, v, dt_h, T_core=None):
        T_core = T_air if T_core is None else T_core
        self.life_used += rate_k(self.crop, T_core) * dt_h / self.f["SL_ref_h"]
        self.wl += water_loss_rate(self.crop, T_air, RH, v) * dt_h
        self.freeze_min = self.freeze_min + dt_h * 60.0 if T_core < self.f["T_freeze_C"] else 0.0
        if self.freeze_min > self.f["freeze_minutes_to_damage"]:
            self.damaged = True
        return self.value

    @property
    def value(self):
        F = 100.0 * max(0.0, 1.0 - self.life_used) * max(0.0, 1.0 - self.wl / self.f["WL_max_pct"])
        return min(F, self.f["damaged_freshness_pct"]) if self.damaged else F

    def state(self):
        return {"life_used": self.life_used, "wl_pct": self.wl, "freeze_min": self.freeze_min, "damaged": self.damaged,
                "freshness_pct": self.value}


def price(base_inr_kg, F):
    return base_inr_kg * F / 100.0


def life_table(crop, temps=(2, 3, 5, 8, 10, 12)):
    """'1 hour at X °C = Y hours of life used' (at the best temperature)."""
    return [{"T_C": t, "hours_of_life": rate_k(crop, t)} for t in temps]
