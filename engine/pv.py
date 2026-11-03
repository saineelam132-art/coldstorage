"""Solar PV power.

Step A - where is the sun?    (Cooper declination, Spencer equation of time)
Step B - split GHI into direct and diffuse light   (Erbs correlation)
Step C - light on the tilted panel, G_POA         (isotropic sky, Liu-Jordan)
Step D - PV power:
    T_cell = T_amb + (NOCT - 20) / 800 * G_POA
    P      = P_rated * (G_POA / 1000) * PR * [1 + gamma * (T_cell - 25)]
    with gamma = -0.004 /C  ->  [1 - 0.004 * (T_cell - 25)]
"""
import math

SOLAR_CONSTANT = 1361.0  # W/m2


def solar_position(day_of_year, local_std_hour, lat_deg, lon_deg, utc_offset_h):
    """Return (cos_zenith, declination_deg, hour_angle_deg) for the middle of the time
    given (local standard time, decimal hours)."""
    B = 2.0 * math.pi * (day_of_year - 1) / 365.0
    eot_min = 229.18 * (0.000075 + 0.001868 * math.cos(B) - 0.032077 * math.sin(B)
                        - 0.014615 * math.cos(2 * B) - 0.040849 * math.sin(2 * B))
    decl = 23.45 * math.sin(math.radians(360.0 * (284 + day_of_year) / 365.0))
    std_meridian = 15.0 * utc_offset_h
    solar_time = local_std_hour + (4.0 * (lon_deg - std_meridian) + eot_min) / 60.0
    hour_angle = 15.0 * (solar_time - 12.0)
    lat, d, w = map(math.radians, (lat_deg, decl, hour_angle))
    cos_z = math.sin(lat) * math.sin(d) + math.cos(lat) * math.cos(d) * math.cos(w)
    return cos_z, decl, hour_angle


def extraterrestrial(day_of_year):
    return SOLAR_CONSTANT * (1.0 + 0.033 * math.cos(2.0 * math.pi * day_of_year / 365.0))


def erbs_diffuse_fraction(kt):
    if kt <= 0.22:
        return 1.0 - 0.09 * kt
    if kt <= 0.80:
        return 0.9511 - 0.1604 * kt + 4.388 * kt**2 - 16.638 * kt**3 + 12.336 * kt**4
    return 0.165


def poa_irradiance(ghi, day_of_year, local_std_hour, lat_deg, lon_deg, utc_offset_h,
                   tilt_deg, azimuth_deg=180.0, albedo=0.2):
    """Plane-of-array irradiance [W/m2] on a tilted panel (azimuth 180 = facing south)."""
    if ghi <= 0:
        return 0.0
    cos_z, decl, w = solar_position(day_of_year, local_std_hour, lat_deg, lon_deg, utc_offset_h)
    if cos_z <= 0.02:          # sun at / below horizon: only diffuse
        return ghi * (1 + math.cos(math.radians(tilt_deg))) / 2.0
    kt = min(1.0, ghi / (extraterrestrial(day_of_year) * cos_z))
    dhi = ghi * erbs_diffuse_fraction(kt)
    dni = (ghi - dhi) / cos_z

    # Angle of incidence on the tilted surface
    lat, d, ww, b = map(math.radians, (lat_deg, decl, w, tilt_deg))
    gam = math.radians(azimuth_deg - 180.0)   # surface azimuth from south
    cos_theta = (math.sin(d) * math.sin(lat) * math.cos(b)
                 - math.sin(d) * math.cos(lat) * math.sin(b) * math.cos(gam)
                 + math.cos(d) * math.cos(lat) * math.cos(b) * math.cos(ww)
                 + math.cos(d) * math.sin(lat) * math.sin(b) * math.cos(gam) * math.cos(ww)
                 + math.cos(d) * math.sin(b) * math.sin(gam) * math.sin(ww))
    beam = dni * max(0.0, cos_theta)
    sky = dhi * (1 + math.cos(b)) / 2.0
    ground = ghi * albedo * (1 - math.cos(b)) / 2.0
    return max(0.0, beam + sky + ground)


def cell_temperature(T_amb_C, G_poa, NOCT_C=45.0):
    return T_amb_C + (NOCT_C - 20.0) / 800.0 * G_poa


def pv_power(cfg, G_poa, T_amb_C):
    """PV DC power after losses [kW]."""
    pv = cfg["pv"]
    T_cell = cell_temperature(T_amb_C, G_poa, pv["NOCT_C"])
    temp_factor = 1.0 + pv["temp_coeff_per_C"] * (T_cell - 25.0)
    P = pv["rated_kWp"] * (G_poa / 1000.0) * pv["performance_ratio"] * temp_factor
    return {
        "G_poa_W_m2": G_poa, "T_cell_C": T_cell, "temp_factor": temp_factor,
        "P_kW": max(0.0, P),
        "formula": "P = P_rated*(G/1000)*PR*[1 - 0.004*(T_cell-25)], "
                   "T_cell = T_amb + (NOCT-20)/800*G",
    }
