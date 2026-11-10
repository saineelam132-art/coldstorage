"""Weather for the Live Year Run (2026), saved in data/live/ so the site works offline.

    python -m twin.live_weather          download / update everything (needs internet)

Sources (hourly, Indian Standard Time):
  1. Actual 2026  : Open-Meteo HISTORICAL archive (ERA5 re-analysis), 1 Jan 2026 -> ~5 days ago
  2. Recent days  : Open-Meteo FORECAST API with past_days=7 (best-estimate hours), fills the gap
                    from the end of the archive up to now
  3. Today+tomorrow: Open-Meteo FORECAST API (forecast_days=3)  -> PREDICTION, not measured
  4. Design year  : ISHRAE 2014 typical year for Visakhapatnam (WMO 431500) from
                    climate.onebuilding.org. ISHRAE's licence forbids passing the data on, so the
                    EPW file is kept OUT of git (data/live/ishrae/ is ignored) and downloaded
                    fresh where it is used. Only our simulation RESULTS are published.
  Backup          : NASA POWER (on AWS) if Open-Meteo cannot be reached.

Open-Meteo convention: 'shortwave_radiation' at time H is the AVERAGE over the hour BEFORE H
(H-1 -> H). We store each hour by its START time, so that value is moved one hour back.
Weather data by Open-Meteo.com (CC BY 4.0).

HALF-HOUR CORRECTION: checked against the sun's position on the clearest days, both the
Open-Meteo and the ISHRAE sunlight came out 30 minutes EARLY. India is UTC+5:30, while the
weather models work in whole UTC hours, so their hourly blocks run :30 -> :30 IST. We move the
sunlight back into whole IST hours with  ghi(h) = (ghi(h-1) + ghi(h)) / 2 , which keeps the daily
total. tests/test_live.py checks the result stays within 10 minutes of the sun.
"""
import datetime as dt
import io
import json
import sys
import urllib.request
import zipfile
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
LIVE = ROOT / "data" / "live"
ISHRAE_DIR = LIVE / "ishrae"
LAT, LON = 17.69, 83.22
TZ = "Asia/Kolkata"
VARS = "temperature_2m,relative_humidity_2m,surface_pressure,shortwave_radiation,wind_speed_10m,precipitation,cloud_cover,dew_point_2m"
EPW_URL = ("https://climate.onebuilding.org/WMO_Region_2_Asia/IND_India/AP_Andhra_Pradesh/"
           "IND_AP_Vishakhapatnam.431500_ISHRAE2014.zip")
EPW_NAME = "IND_AP_Vishakhapatnam.431500_ISHRAE2014.epw"
COLS = ["time_ist", "T_out", "RH_out", "ps_Pa", "ghi", "wind", "source"]
EXTRA = ["rain_mm", "cloud_pct", "dew_C"]   # for the website only (sky icon, dew point); the physics never uses them
CREDIT = "Weather data by Open-Meteo.com"


def now_ist():
    return dt.datetime.now(dt.timezone(dt.timedelta(hours=5, minutes=30))).replace(tzinfo=None)


def _get_json(url, timeout=120):
    req = urllib.request.Request(url, headers={"User-Agent": "KoolKisaan/1.0 (student project)"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode("utf-8"))


def _om_frame(js, source):
    h = js["hourly"]
    df = pd.DataFrame({
        "time_end": pd.to_datetime(h["time"]),
        "T_out": h["temperature_2m"], "RH_out": h["relative_humidity_2m"],
        "ps_Pa": [None if v is None else v * 100.0 for v in h["surface_pressure"]],   # hPa -> Pa
        "ghi_end": h["shortwave_radiation"], "wind": [None if v is None else v / 3.6 for v in h["wind_speed_10m"]],  # km/h -> m/s
    })
    # temperatures etc. are instantaneous at the time stamp; radiation is the mean of the hour BEFORE it.
    df["time_ist"] = df["time_end"]
    df["ghi"] = df["ghi_end"].shift(-1)          # value stored at H+1 describes hour H -> H+1
    df["source"] = source
    # precipitation is the total of the hour BEFORE the time stamp (like radiation); cloud cover is instantaneous
    df["rain_mm"] = pd.Series(h.get("precipitation", [None] * len(df)), dtype=float).shift(-1)
    df["cloud_pct"] = pd.Series(h.get("cloud_cover", [None] * len(df)), dtype=float)
    df["dew_C"] = pd.Series(h.get("dew_point_2m", [None] * len(df)), dtype=float)        # instantaneous, like temperature
    return df[COLS + EXTRA]


def half_hour_fix(ghi):
    """Shift an hourly sunlight series 30 min later (see the note at the top). Keeps the total."""
    g = pd.Series(ghi, dtype=float).fillna(0.0).reset_index(drop=True)
    return (0.5 * (g + g.shift(1).fillna(0.0))).values


def fetch_archive(start="2026-01-01", end=None):
    end = end or (now_ist().date() - dt.timedelta(days=1)).isoformat()
    url = (f"https://archive-api.open-meteo.com/v1/archive?latitude={LAT}&longitude={LON}"
           f"&start_date={start}&end_date={end}&hourly={VARS}&timezone=Asia%2FKolkata")
    return _om_frame(_get_json(url), "Open-Meteo archive (ERA5)"), url


def fetch_forecast():
    url = (f"https://api.open-meteo.com/v1/forecast?latitude={LAT}&longitude={LON}"
           f"&hourly={VARS}&past_days=7&forecast_days=3&timezone=Asia%2FKolkata")
    return _om_frame(_get_json(url), "Open-Meteo forecast"), url


def fetch_ishrae():
    """Download the ISHRAE EPW into data/live/ishrae/ (git-ignored, see licence)."""
    ISHRAE_DIR.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(EPW_URL, headers={"User-Agent": "KoolKisaan/1.0"})
    with urllib.request.urlopen(req, timeout=180) as r:
        z = zipfile.ZipFile(io.BytesIO(r.read()))
    (ISHRAE_DIR / EPW_NAME).write_bytes(z.read(EPW_NAME))
    (ISHRAE_DIR / "LICENSE_ISHRAE.txt").write_bytes(z.read("ISHRAE_Copyright_and_Weather_Data_License.txt"))
    return ISHRAE_DIR / EPW_NAME


def load_ishrae(path=None):
    """EPW -> hourly frame in IST. EPW hour h (1..24) covers h-1 -> h local standard time (IST)."""
    path = Path(path) if path else ISHRAE_DIR / EPW_NAME
    if not path.exists():
        path = fetch_ishrae()
    rows = path.read_text(encoding="latin-1").splitlines()[8:]
    recs = []
    for r in rows:
        f = r.split(",")
        if len(f) < 22:
            continue
        mo, d, h = int(f[1]), int(f[2]), int(f[3])
        recs.append((dt.datetime(2026, mo, d) + dt.timedelta(hours=h - 1), float(f[6]), float(f[8]), float(f[9]), float(f[13]), float(f[21])))
    df = pd.DataFrame(recs, columns=["time_ist", "T_out", "RH_out", "ps_Pa", "ghi", "wind"])
    df["ghi"] = half_hour_fix(df["ghi"])
    df["source"] = "ISHRAE 2014 typical year"
    return df


def fetch_nasa_backup(start, end):
    """NASA POWER on AWS (no API key) - only used when Open-Meteo fails. Solar may lag months."""
    import numpy as np
    import xarray as xr
    so = {"anon": True}
    sol = xr.open_zarr("s3://nasa-power/syn1deg/temporal/power_syn1deg_hourly_temporal_utc.zarr", storage_options=so)
    met = xr.open_zarr("s3://nasa-power/geosit/temporal/power_geosit_hourly_temporal_utc.zarr", storage_options=so)
    span = slice(pd.Timestamp(start) - pd.Timedelta(hours=6), pd.Timestamp(end) + pd.Timedelta(hours=1))
    s = sol.sel(lat=LAT, lon=LON, method="nearest").sel(time=span)
    m = met.sel(lat=LAT, lon=LON, method="nearest").sel(time=span)
    t = pd.to_datetime(m.time.values) + pd.Timedelta(hours=5, minutes=30)
    ghi = pd.Series(s["ALLSKY_SFC_SW_DWN"].values, index=pd.to_datetime(s.time.values) + pd.Timedelta(hours=5, minutes=30))
    df = pd.DataFrame({"time_ist": t, "T_out": m["T2M"].values, "RH_out": m["RH2M"].values,
                       "ps_Pa": m["PS"].values * (100.0 if np.nanmean(m["PS"].values) > 200 else 1000.0),
                       "ghi": ghi.reindex(t).values, "wind": m["WS10M"].values})
    # NASA hours start at :30 IST - shift to whole hours by averaging neighbours
    df = df.set_index("time_ist").resample("h").mean().interpolate(limit=2).reset_index()
    df["source"] = "NASA POWER (backup)"
    return df[COLS]


def merge_actual(archive, forecast_df, today):
    """One continuous series 1 Jan 2026 -> end of tomorrow. Archive wins where it has data;
    the forecast fills the rest. Hours from 'now' on are marked as PREDICTION."""
    a = archive.dropna(subset=["T_out", "ghi"])
    f = forecast_df.dropna(subset=["T_out"])
    f = f[f["time_ist"] > a["time_ist"].max()] if len(a) else f
    df = pd.concat([a, f], ignore_index=True).sort_values("time_ist").drop_duplicates("time_ist")
    for c in EXTRA:                                   # older saved files have no rain / cloud columns
        if c not in df:
            df[c] = float("nan")
    df["ghi"] = half_hour_fix(df["ghi"].fillna(0.0).clip(lower=0))
    num = ["T_out", "RH_out", "ps_Pa", "ghi", "wind"]
    df[num] = df[num].astype(float).interpolate(limit=3).ffill()
    df["is_forecast"] = df["time_ist"] >= pd.Timestamp(now_ist().replace(minute=0, second=0, microsecond=0))
    end = pd.Timestamp(today) + pd.Timedelta(days=2)
    return df[df["time_ist"] < end].reset_index(drop=True)


def update(verbose=True):
    """Download everything that can be downloaded; keep the last saved files if a source fails."""
    LIVE.mkdir(parents=True, exist_ok=True)
    meta_p = LIVE / "weather_meta.json"
    meta = json.loads(meta_p.read_text()) if meta_p.exists() else {}
    stamp = now_ist().strftime("%Y-%m-%d %H:%M IST")
    say = print if verbose else (lambda *a: None)
    try:
        arch, url = fetch_archive()
        arch.to_csv(LIVE / "openmeteo_archive_2026.csv", index=False)
        meta["archive"] = {"updated": stamp, "url": url, "last_valid": str(arch.dropna(subset=["T_out", "ghi"])["time_ist"].max())}
        say(f"archive: {len(arch)} hours, valid to {meta['archive']['last_valid']}")
    except Exception as e:  # noqa: BLE001
        meta.setdefault("errors", {})["archive"] = f"{stamp}: {e}"
        say(f"archive FAILED ({e}) - keeping the last saved file")
    try:
        fc, url = fetch_forecast()
        fc.to_csv(LIVE / "openmeteo_forecast_latest.csv", index=False)
        snap = LIVE / "forecasts"
        snap.mkdir(exist_ok=True)
        fc.to_csv(snap / f"forecast_{now_ist():%Y-%m-%d}.csv", index=False)     # kept for a later forecast-vs-actual check
        meta["forecast"] = {"updated": stamp, "url": url, "from": str(fc["time_ist"].min()), "to": str(fc["time_ist"].max())}
        say(f"forecast: {fc['time_ist'].min()} -> {fc['time_ist'].max()}")
    except Exception as e:  # noqa: BLE001
        meta.setdefault("errors", {})["forecast"] = f"{stamp}: {e}"
        say(f"forecast FAILED ({e}) - keeping the last saved file")
    try:
        p = fetch_ishrae()
        meta["ishrae"] = {"updated": stamp, "url": EPW_URL, "note": "kept out of git (ISHRAE licence)"}
        say(f"ISHRAE design year saved to {p}")
    except Exception as e:  # noqa: BLE001
        meta.setdefault("errors", {})["ishrae"] = f"{stamp}: {e}"
        say(f"ISHRAE FAILED ({e})")
    if not (LIVE / "openmeteo_archive_2026.csv").exists():
        try:
            nb = fetch_nasa_backup("2026-01-01", now_ist().date().isoformat())
            nb.to_csv(LIVE / "nasa_backup_2026.csv", index=False)
            meta["backup"] = {"updated": stamp, "source": "NASA POWER (AWS)"}
            say("Open-Meteo archive missing - saved NASA POWER backup")
        except Exception as e:  # noqa: BLE001
            say(f"NASA backup FAILED ({e})")
    meta["last_attempt"] = stamp
    meta["credit"] = CREDIT
    meta_p.write_text(json.dumps(meta, indent=2))
    return meta


def load_actual(today=None):
    """The saved 2026 series (archive + forecast) as one frame. Works offline."""
    today = today or now_ist().date()
    parse = lambda p: pd.read_csv(p, parse_dates=["time_ist"])
    a = LIVE / "openmeteo_archive_2026.csv"
    arch = parse(a) if a.exists() else parse(LIVE / "nasa_backup_2026.csv")
    fp = LIVE / "openmeteo_forecast_latest.csv"
    fc = parse(fp) if fp.exists() else arch.iloc[0:0]
    return merge_actual(arch, fc, today)


if __name__ == "__main__":
    sys.path.insert(0, str(ROOT))
    update()
