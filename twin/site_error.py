"""Expected SITE error of the Open-Meteo weather (from published studies, NOT our measurements).

One place for the numbers: config/site_error_budget.json. This module turns them into
  * bands for the website (expected range at our site),
  * physics corrections that are NOT errors (10 m -> 2 m wind, dew point),
  * perturbed weather for the uncertainty study (hot site, cool site, random runs).
"""
import json
import math
from pathlib import Path

import numpy as np
import pandas as pd

from engine import pv

ROOT = Path(__file__).resolve().parent.parent
BUDGET_FILE = ROOT / "config" / "site_error_budget.json"


def load_budget(path=BUDGET_FILE):
    return json.loads(Path(path).read_text(encoding="utf-8"))


# ------------------------------------------------------------------ physics corrections (not errors)
def u2_from_u10(u10, ratio=None):
    """FAO-56 eq. 47: wind at 2 m from wind at 10 m over open ground (u2 = 0.748 x u10)."""
    if ratio is None:
        ratio = 4.87 / math.log(67.8 * 10.0 - 5.42)
    return np.asarray(u10, dtype=float) * ratio


def e_sat(T):
    """Saturation vapour pressure over water [hPa] (Magnus, Alduchov & Eskridge 1996)."""
    T = np.asarray(T, dtype=float)
    return 6.1094 * np.exp(17.625 * T / (T + 243.04))


def dewpoint(T, RH):
    """Dew point [°C] from air temperature [°C] and relative humidity [%] (Magnus)."""
    T, RH = np.asarray(T, dtype=float), np.clip(np.asarray(RH, dtype=float), 0.5, 100.0)
    g = np.log(RH / 100.0) + 17.625 * T / (T + 243.04)
    return 243.04 * g / (17.625 - g)


def rh_from(T, Td):
    """Relative humidity [%] from air temperature and dew point (Td is capped at T)."""
    T, Td = np.asarray(T, dtype=float), np.asarray(Td, dtype=float)
    return np.clip(100.0 * e_sat(np.minimum(Td, T)) / e_sat(T), 1.0, 100.0)


# ------------------------------------------------------------------ sun
def clear_sky_ghi(times, cfg):
    """Haurwitz clear-sky sunlight on flat ground [W/m²] for the middle of each hour."""
    site = cfg["site"]
    out = []
    for t in pd.to_datetime(times):
        tm = t + pd.Timedelta(minutes=30)
        elev, _ = pv.sun_angles(tm.dayofyear, tm.hour + tm.minute / 60, site["lat_deg"], site["lon_deg"], site["utc_offset_h"])
        cz = math.sin(math.radians(elev))
        out.append(1098.0 * cz * math.exp(-0.057 / cz) if cz > 0.01 else 0.0)
    return np.array(out)


def clearness(ghi, ghi_cs):
    ghi, ghi_cs = np.asarray(ghi, dtype=float), np.asarray(ghi_cs, dtype=float)
    return np.where(ghi_cs > 20, ghi / np.maximum(ghi_cs, 1e-6), np.nan)


def day_clearness(times, ghi, ghi_cs):
    """Daily clearness index (daily sunlight / daily clear-sky sunlight), one value per hour row."""
    d = pd.DataFrame({"day": pd.to_datetime(times).dt.date, "g": ghi, "c": ghi_cs})
    k = d.groupby("day").g.transform("sum") / d.groupby("day").c.transform("sum").clip(lower=1e-6)
    return k.values


# ------------------------------------------------------------------ bands (for the website)
def sunny_calm(times, ghi, wind10, B):
    r = B["bands"]["temp_C"]["sunny_calm_rule"]
    h = pd.to_datetime(times).dt.hour.values if hasattr(pd.to_datetime(times), "dt") else pd.DatetimeIndex(times).hour.values
    return ((h >= r["hours"][0]) & (h <= r["hours"][1]) & (np.asarray(ghi) > r["ghi_min_W_m2"])
            & (u2_from_u10(wind10) < r["wind2m_max_m_s"]))


def temp_band(times, ghi, wind10, B):
    b = B["bands"]["temp_C"]
    return np.where(sunny_calm(pd.Series(pd.to_datetime(times)), ghi, wind10, B), b["hourly_sunny_calm"], b["hourly"])


def rh_band(T, RH, dT, dTd):
    """RH band [low, high] from the temperature band and the dew-point band (not a flat %).
    Lowest RH: warmer air with drier air; highest RH: cooler air with moister air."""
    Td = dewpoint(T, RH)
    lo = rh_from(np.asarray(T) + dT, Td - dTd)
    hi = rh_from(np.asarray(T) - dT, Td + dTd)
    return lo, hi


def ghi_rel_band(ghi, ghi_cs, B):
    b = B["bands"]["ghi_rel"]
    kt = clearness(ghi, ghi_cs)
    return np.where(np.nan_to_num(kt, nan=1.0) < b["overcast_rule"]["clearness_index_below"], b["hourly_overcast"], b["hourly"])


# ------------------------------------------------------------------ perturbed weather (uncertainty study)
def _with(w, T=None, Td=None, ghi=None, wind=None, ps=None):
    """New weather frame; RH is recomputed from (T, Td) so humidity stays physical."""
    w = w.copy()
    Td0 = dewpoint(w["T_out"].values, w["RH_out"].values)
    T1 = w["T_out"].values if T is None else T
    Td1 = Td0 if Td is None else Td
    if T is not None or Td is not None:
        w["RH_out"] = rh_from(T1, Td1)
    w["T_out"] = T1
    if ghi is not None:
        w["ghi"] = ghi
    if wind is not None:
        w["wind"] = wind
    if ps is not None:
        w["ps_Pa"] = ps
    return w


def site_case(w, cfg, B, kind):
    """'hot' or 'cool' site: the systematic worst cases asked for in the study brief."""
    T, rh, ghi, u10 = (w[c].values.astype(float) for c in ("T_out", "RH_out", "ghi", "wind"))
    Td = dewpoint(T, rh)
    cs = clear_sky_ghi(w["time_ist"], cfg)
    kd = day_clearness(w["time_ist"], ghi, cs)
    clear_day = kd >= B["bands"]["ghi_rel"]["clear_day_rule"]["daily_clearness_index_at_least"]
    tb = B["bands"]["temp_C"]
    ratio = B["bands"]["wind_ms"]["height_conversion"]["u2_over_u10"]
    if kind == "hot":
        calm = sunny_calm(pd.Series(pd.to_datetime(w["time_ist"])), ghi, u10, B)
        T1 = T + np.where(calm, tb["hourly_sunny_calm"], tb["hourly"])
        Td1 = Td + 1.0
        g1 = ghi * np.where(clear_day, 0.90, 0.70)
        u2 = np.maximum(0.0, 0.75 * u10 * ratio - 1.0)          # brief: x0.75 at 2 m and -1 m/s
    elif kind == "cool":
        T1 = T - tb["hourly"]
        Td1 = Td - 1.0
        g1 = np.minimum(ghi * np.where(clear_day, 1.10, 1.30), np.maximum(cs, ghi))
        u2 = u10 * ratio + 1.0
    else:
        raise ValueError(kind)
    return _with(w, T=T1, Td=Td1, ghi=g1, wind=u2 / ratio)


def ar1(n, rng, tau_h):
    """Unit-variance AR(1) noise with correlation time tau_h hours."""
    phi = math.exp(-1.0 / tau_h)
    z = rng.standard_normal(n)
    x = np.empty(n)
    x[0] = z[0]
    s = math.sqrt(1 - phi * phi)
    for i in range(1, n):
        x[i] = phi * x[i - 1] + s * z[i]
    return x


def random_case(w, cfg, B, seed, run, cs=None):
    """One random site: each hour's error ~ Normal(0, hourly band), correlated over ~6 h. Repeatable:
    the same (seed, run) always gives the same weather."""
    rng = np.random.default_rng([int(seed), int(run)])
    tau = B["random_runs"]["correlation_hours"]
    n = len(w)
    T, rh, ghi, u10, ps = (w[c].values.astype(float) for c in ("T_out", "RH_out", "ghi", "wind", "ps_Pa"))
    cs = clear_sky_ghi(w["time_ist"], cfg) if cs is None else cs
    b = B["bands"]
    sT = temp_band(w["time_ist"], ghi, u10, B)
    T1 = T + sT * ar1(n, rng, tau)
    Td1 = dewpoint(T, rh) + b["dewpoint_C"]["hourly"] * ar1(n, rng, tau)
    g1 = np.clip(ghi * (1.0 + ghi_rel_band(ghi, cs, B) * ar1(n, rng, tau)), 0.0, np.maximum(cs, ghi))
    ratio = b["wind_ms"]["height_conversion"]["u2_over_u10"]
    u2 = np.maximum(0.0, u10 * ratio + b["wind_ms"]["hourly"] * ar1(n, rng, tau))
    ps1 = ps + 100.0 * b["pressure_hPa"]["hourly"] * ar1(n, rng, tau)
    return _with(w, T=T1, Td=Td1, ghi=g1, wind=u2 / ratio, ps=ps1)
