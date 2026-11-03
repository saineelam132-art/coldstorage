"""Load the saved NASA POWER weather and add panel irradiance (POA) for every hour.

Accepts either
  data/weather_vizag_<year>.csv       (made by fetch_weather.py), or
  data/nasa_power_hourly_<year>.csv   (downloaded by hand from the POWER website).

Time: files are in UTC; each value is the average over the hour that STARTS at the
time stamp. We convert to Indian Standard Time (IST = UTC + 5:30) and compute the sun
position at the MIDDLE of each hour.
"""
from pathlib import Path

import numpy as np
import pandas as pd

from engine import pv
from engine.config import load_config

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"


class WeatherMissing(FileNotFoundError):
    pass


def parse_power_csv(fobj):
    """Parse the CSV format that the NASA POWER website / API produces."""
    lines = fobj.read().splitlines()
    try:
        end = next(i for i, l in enumerate(lines) if "-END HEADER-" in l)
    except StopIteration:
        end = -1
    header_text = "\n".join(lines[:end + 1])
    from io import StringIO
    df = pd.read_csv(StringIO("\n".join(lines[end + 1:])))
    df = df.replace(-999.0, np.nan)
    t = pd.to_datetime(dict(year=df.YEAR, month=df.MO, day=df.DY, hour=df.HR))
    if "LST" in header_text and "UTC" not in header_text:
        # Local Solar Time -> UTC (shift by longitude / 15 hours)
        t = t - pd.to_timedelta(83.20 / 15.0, unit="h")
    out = pd.DataFrame({"time_utc": t.dt.strftime("%Y-%m-%d %H:%M")})
    for c in ["ALLSKY_SFC_SW_DWN", "T2M", "RH2M", "WS10M", "PS"]:
        out[c] = df[c].values
    return out


def find_weather_file(year=None):
    pats = [f"weather_vizag_{year}.csv", f"nasa_power_hourly_{year}.csv"] if year else \
           ["weather_vizag_*.csv", "nasa_power_hourly_*.csv"]
    for pat in pats:
        hits = sorted(DATA.glob(pat))
        if hits:
            return hits[-1]
    raise WeatherMissing(
        "No weather file in data/. Run:  python -m twin.fetch_weather  "
        "(it explains how to download by hand if the internet route fails).")


def read_source_notes(path):
    notes = []
    with open(path, encoding="utf-8") as f:
        for line in f:
            if not line.startswith("#"):
                break
            notes.append(line[1:].strip())
    return notes


def load_weather(path=None, cfg=None):
    cfg = cfg or load_config()
    path = Path(path) if path else find_weather_file()
    if path.name.startswith("nasa_power_hourly"):
        with open(path, encoding="utf-8") as f:
            raw = parse_power_csv(f)
    else:
        raw = pd.read_csv(path, comment="#")
    if raw.drop(columns="time_utc").isna().any().any():
        n = int(raw.drop(columns="time_utc").isna().sum().sum())
        raise ValueError(f"Weather file has {n} missing values - please re-download.")

    ps = raw["PS"].astype(float)
    if ps.mean() > 200:          # file is in hPa, not kPa
        ps = ps / 10.0
    raw["PS"] = ps
    site, pvc = cfg["site"], cfg["pv"]
    t_utc = pd.to_datetime(raw["time_utc"])
    t_ist = t_utc + pd.Timedelta(hours=site["utc_offset_h"])
    # Converting UTC to IST pushes the last 5 hours of the year into next January 1st.
    # Those are night hours of 31 Dec / 1 Jan, so we wrap them to the start of the same
    # year (00:30-04:30 IST on 1 January) to get 365 complete IST days.
    year0 = t_ist.iloc[0].year
    late = t_ist.dt.year > year0
    t_ist = t_ist.where(~late, t_ist - pd.DateOffset(years=1))
    order = np.argsort(t_ist.values, kind="stable")
    raw = raw.iloc[order].reset_index(drop=True)
    t_ist = t_ist.iloc[order].reset_index(drop=True)
    mid = t_ist + pd.Timedelta(minutes=30)           # middle of the hour
    df = pd.DataFrame({
        "time_ist": t_ist,
        "ghi": raw["ALLSKY_SFC_SW_DWN"].clip(lower=0).values,
        "T_out": raw["T2M"].values,
        "RH_out": raw["RH2M"].clip(1, 100).values,
        "wind": raw["WS10M"].values,
        "ps_Pa": raw["PS"].values * 1000.0,
    })
    doy = mid.dt.dayofyear.values
    hr = (mid.dt.hour + mid.dt.minute / 60.0).values
    df["poa"] = [pv.poa_irradiance(g, d, h, site["lat_deg"], site["lon_deg"], site["utc_offset_h"],
                                   pvc["tilt_deg"], pvc["azimuth_deg"], pvc["ground_albedo"])
                 for g, d, h in zip(df["ghi"].values, doy, hr)]
    df.attrs["source_file"] = str(path)
    df.attrs["source_notes"] = read_source_notes(path) if path.suffix == ".csv" else []
    return df
