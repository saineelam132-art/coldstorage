"""Check that hourly sunlight lines up with the sun: energy-weighted time of day on the clearest days
vs the same for the sun's position. Used by tests/test_live.py (should be within 10 minutes)."""
import numpy as np
from engine import pv
def clear_offset_min(df):
    df = df.copy()
    df["cz"] = [max(0, pv.solar_position(t.dayofyear, t.hour + 0.5, 17.69, 83.22, 5.5)[0]) for t in df.time_ist]
    df["ext"] = [pv.extraterrestrial(t.dayofyear) for t in df.time_ist] * df.cz
    day = df.time_ist.dt.date
    kt = df.groupby(day).ghi.sum() / df.groupby(day).ext.sum()
    x = df[day.isin(kt[kt > kt.quantile(0.85)].index)]
    return 60 * (np.average(x.time_ist.dt.hour + 0.5, weights=x.ghi) - np.average(x.time_ist.dt.hour + 0.5, weights=x.cz))
