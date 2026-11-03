"""Download one full year of HOURLY NASA POWER weather for Visakhapatnam and save it in data/.

Run once (needs internet):     python -m twin.fetch_weather --year 2025

Parameters: ALLSKY_SFC_SW_DWN (sunlight on flat ground, W/m2), T2M (air temp, C),
            RH2M (relative humidity, %), WS10M (wind, m/s), PS (pressure, kPa)
Time standard: UTC (we convert to Indian time, IST = UTC + 5:30, when loading).

Route 1: the NASA POWER web API (power.larc.nasa.gov).
Route 2: if the API is blocked, NASA's official copy of the same POWER data on
         AWS Open Data (s3://nasa-power, needs:  pip install xarray zarr s3fs).
Route 3: if both fail, the script prints how to download the file BY HAND.
It never invents weather data.
"""
import argparse
import datetime as dt
import io
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
LAT, LON = 17.68, 83.20
PARAMS = ["ALLSKY_SFC_SW_DWN", "T2M", "RH2M", "WS10M", "PS"]


def out_path(year):
    return DATA / f"weather_vizag_{year}.csv"


MANUAL_STEPS = """
------------------------------------------------------------------
 Could not download automatically. Please download it BY HAND:
------------------------------------------------------------------
 1. Open  https://power.larc.nasa.gov/data-access-viewer/
 2. Choose:  User community = Renewable Energy,  Temporal average = Hourly
 3. Latitude = 17.68   Longitude = 83.20
 4. Start date = 01/01/{y}   End date = 12/31/{y}
 5. Time standard = UTC   (important!)
 6. Tick these parameters:
       All Sky Surface Shortwave Downward Irradiance (ALLSKY_SFC_SW_DWN)
       Temperature at 2 Meters (T2M)
       Relative Humidity at 2 Meters (RH2M)
       Wind Speed at 10 Meters (WS10M)
       Surface Pressure (PS)
 7. Output format = CSV, press Submit, then download the CSV.
 8. Rename the file to   nasa_power_hourly_{y}.csv
    and put it in the folder:   {data}
 The program reads that file directly (no changes needed).
------------------------------------------------------------------
"""


def _write(df, year, source_lines):
    DATA.mkdir(exist_ok=True)
    p = out_path(year)
    with open(p, "w", encoding="utf-8", newline="") as f:
        for line in source_lines:
            f.write(f"# {line}\n")
        df.to_csv(f, index=False, float_format="%.3f")
    return p


def via_api(year):
    import pandas as pd
    import urllib.request
    url = ("https://power.larc.nasa.gov/api/temporal/hourly/point?"
           f"parameters={','.join(PARAMS)}&community=RE&longitude={LON}&latitude={LAT}"
           f"&start={year}0101&end={year}1231&format=CSV&time-standard=UTC")
    print("Trying NASA POWER API ...")
    with urllib.request.urlopen(url, timeout=180) as r:
        text = r.read().decode("utf-8")
    from twin.weather import parse_power_csv
    df = parse_power_csv(io.StringIO(text))
    return df, ["NASA POWER hourly API (power.larc.nasa.gov), time standard UTC",
                f"Point {LAT} N, {LON} E. Downloaded {dt.date.today()}", url]


def via_aws(year):
    import numpy as np
    import pandas as pd
    import xarray as xr
    print("Trying NASA POWER on AWS Open Data (s3://nasa-power) ...")
    so = {"anon": True}
    sol = xr.open_zarr("s3://nasa-power/syn1deg/temporal/power_syn1deg_hourly_temporal_utc.zarr",
                       storage_options=so)
    met = xr.open_zarr("s3://nasa-power/merra2/temporal/power_merra2_hourly_temporal_utc.zarr",
                       storage_options=so)
    span = slice(f"{year}-01-01T00", f"{year}-12-31T23")
    s = sol.sel(lat=LAT, lon=LON, method="nearest").sel(time=span)
    m = met.sel(lat=LAT, lon=LON, method="nearest").sel(time=span)
    df = pd.DataFrame({
        "time_utc": pd.to_datetime(s.time.values).strftime("%Y-%m-%d %H:%M"),
        "ALLSKY_SFC_SW_DWN": s["ALLSKY_SFC_SW_DWN"].values,
        "T2M": m["T2M"].values, "RH2M": m["RH2M"].values,
        "WS10M": m["WS10M"].values, "PS": m["PS"].values,
    })
    if len(df) < 8760 or df.drop(columns="time_utc").isna().any().any():
        raise RuntimeError("AWS data for this year is incomplete")
    # The POWER API gives PS in kPa; the AWS store gives it in hPa -> convert to kPa.
    ps_units = str(m["PS"].attrs.get("units", "")).lower()
    if "hpa" in ps_units or df["PS"].mean() > 200:
        df["PS"] = df["PS"] / 10.0
    src = ["NASA POWER on AWS Open Data (s3://nasa-power) - the same data the POWER API serves",
           f"Solar: CERES SYN1deg hourly, grid cell {float(s.lat)} N, {float(s.lon)} E (1 deg grid)",
           f"Weather: MERRA-2 hourly, grid cell {float(m.lat)} N, {float(m.lon)} E (0.5 x 0.625 deg grid)",
           f"Requested point {LAT} N, {LON} E (nearest grid cell used). Retrieved {dt.date.today()}",
           "Time stamps are UTC, start of hour; each value is the average over that hour"]
    return df, src


def climatology_aws(first=2001, last=2024):
    """Long-term monthly average sunlight (GHI) from NASA POWER DAILY data, for comparison.
    Computed here as the plain average of all days in each month over first..last."""
    import pandas as pd
    import xarray as xr
    d = xr.open_zarr("s3://nasa-power/syn1deg/temporal/power_syn1deg_daily_temporal_utc.zarr",
                     storage_options={"anon": True})
    q = d.sel(lat=LAT, lon=LON, method="nearest")["ALLSKY_SFC_SW_DWN"].sel(
        time=slice(f"{first}-01-01", f"{last}-12-31"))
    s = pd.Series(q.values, index=pd.to_datetime(q.time.values)) * 24 / 1000   # W/m2 -> kWh/m2/day
    by_year = s.groupby(s.index.year).mean()
    monthly = s.groupby(s.index.month).mean()
    df = pd.DataFrame({"month": monthly.index, "ghi_kWh_m2_day": monthly.values.round(3)})
    p = DATA / "solar_climatology_vizag.csv"
    with open(p, "w", encoding="utf-8", newline="") as f:
        f.write(f"# NASA POWER CERES SYN1deg DAILY all-sky GHI, cell {float(q.lat)} N {float(q.lon)} E\n")
        f.write(f"# Long-term monthly mean of daily values, {first}-{last}. Retrieved {dt.date.today()}\n")
        f.write("# Annual means by year (kWh/m2/day): "
                + ", ".join(f"{y}:{v:.2f}" for y, v in by_year.items()) + "\n")
        df.to_csv(f, index=False)
    print(f"Saved long-term solar averages to {p}")


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--year", type=int, default=2025)
    a = ap.parse_args(argv)
    for route in (via_api, via_aws):
        try:
            df, src = route(a.year)
            p = _write(df, a.year, src)
            print(f"Saved {len(df)} hours to {p}")
            try:
                climatology_aws()
            except Exception as e:  # noqa: BLE001
                print(f"   (optional long-term averages not saved: {e})")
            return 0
        except Exception as e:  # noqa: BLE001
            print(f"   ...failed: {e}")
    print(MANUAL_STEPS.format(y=a.year, data=DATA))
    return 1


if __name__ == "__main__":
    sys.path.insert(0, str(ROOT))
    sys.exit(main())
