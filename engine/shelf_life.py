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
