"""Expected site error (published studies, not measured) and the uncertainty study."""
import json
from pathlib import Path

import numpy as np
import pandas as pd
import pytest

from engine.config import load_config
from twin import site_error as SE
from twin import live_weather as LW

ROOT = Path(__file__).resolve().parent.parent
B = SE.load_budget()
CFG = load_config()


def test_error_budget_loads_with_sources_and_statement():
    for k in ("temp_C", "dewpoint_C", "rh_pct", "ghi_rel", "wind_ms", "pressure_hPa", "pv_energy_rel"):
        assert k in B["bands"] and B["bands"][k]["source"]
    assert B["bands"]["temp_C"]["hourly"] == 1.5 and B["bands"]["temp_C"]["hourly_sunny_calm"] == 3.0
    assert B["bands"]["ghi_rel"]["hourly"] == 0.25 and B["bands"]["ghi_rel"]["hourly_overcast"] == 0.40
    assert "not our measurements" in B["statement"]


def test_wind_10m_to_2m_fao56():
    assert SE.u2_from_u10(10.0) == pytest.approx(7.48, abs=0.01)
    assert SE.u2_from_u10(1.0) == pytest.approx(B["bands"]["wind_ms"]["height_conversion"]["u2_over_u10"], abs=1e-3)


def test_rh_band_is_derived_from_temperature_and_dewpoint_bands():
    T, RH = 30.0, 70.0
    lo, hi = SE.rh_band(np.array([T]), np.array([RH]), 1.5, 1.5)
    Td = SE.dewpoint(T, RH)
    assert lo[0] == pytest.approx(SE.rh_from(T + 1.5, Td - 1.5)[()] if np.ndim(SE.rh_from(T + 1.5, Td - 1.5)) == 0 else SE.rh_from(T + 1.5, Td - 1.5))
    assert lo[0] < RH < hi[0]
    assert 5 <= hi[0] - RH <= 15 and 5 <= RH - lo[0] <= 15            # "typically ±5–15 %RH"
    assert SE.rh_from(T, SE.dewpoint(T, RH)) == pytest.approx(RH, abs=1e-6)
    # a warmer site with the same moisture has LOWER relative humidity (not a flat %)
    assert SE.rh_band(np.array([20.0]), np.array([70.0]), 3.0, 0.0)[0][0] < SE.rh_band(np.array([20.0]), np.array([70.0]), 1.5, 0.0)[0][0]


def test_temperature_band_doubles_only_on_sunny_calm_afternoons():
    t = pd.Series(pd.to_datetime(["2026-05-22 13:00", "2026-05-22 13:00", "2026-05-22 09:00"]))
    b = SE.temp_band(t, np.array([800, 800, 800]), np.array([0.5, 5.0, 0.5]), B)
    assert list(b) == [3.0, 1.5, 1.5]


def test_radiation_timestamps_follow_preceding_hour_convention():
    """Open-Meteo shortwave_radiation at time stamp H+1 is the mean of hour H -> H+1; we store it at H."""
    js = {"hourly": {"time": ["2026-05-22T10:00", "2026-05-22T11:00", "2026-05-22T12:00"], "temperature_2m": [30, 31, 32],
                     "relative_humidity_2m": [60, 60, 60], "surface_pressure": [1000, 1000, 1000],
                     "shortwave_radiation": [500, 700, 800], "wind_speed_10m": [7.2, 7.2, 7.2]}}
    df = LW._om_frame(js, "test")
    assert df.loc[df.time_ist == pd.Timestamp("2026-05-22 10:00"), "ghi"].item() == 700
    assert df.loc[df.time_ist == pd.Timestamp("2026-05-22 11:00"), "ghi"].item() == 800
    assert df.wind.iloc[0] == pytest.approx(2.0)                      # km/h -> m/s, still 10 m (2 m only for display)


def test_random_runs_are_repeatable_with_a_fixed_seed():
    from twin.uncertainty_2026 import study_weather
    w = study_weather().iloc[:24 * 10].reset_index(drop=True)
    a = SE.random_case(w, CFG, B, 2026, 7)
    b = SE.random_case(w, CFG, B, 2026, 7)
    c = SE.random_case(w, CFG, B, 2026, 8)
    pd.testing.assert_frame_equal(a, b)
    assert not np.allclose(a.T_out.values, c.T_out.values)
    assert (a.RH_out.between(1, 100)).all() and (a.ghi >= 0).all() and (a.wind >= 0).all()


def test_hot_and_cool_site_rules():
    from twin.uncertainty_2026 import study_weather
    w = study_weather().iloc[24 * 140:24 * 147].reset_index(drop=True)
    h, c = SE.site_case(w, CFG, B, "hot"), SE.site_case(w, CFG, B, "cool")
    dT = h.T_out - w.T_out
    assert set(np.round(dT.unique(), 6)) <= {1.5, 3.0}
    assert np.allclose(c.T_out - w.T_out, -1.5)
    assert (h.ghi <= w.ghi + 1e-9).all() and (c.ghi >= w.ghi - 1e-9).all()


def test_base_case_reproduces_the_published_design_study_exactly():
    from twin.uncertainty_2026 import _init, _G, run_case
    _init()
    base = run_case(_G["w"], _G["cfg"], _G["night"])
    ref = json.loads((ROOT / "results/live/design_study_2026.json").read_text())["journey"]["3) finned panels (final)"]
    for k in ("days_full_solar_wax", "grid_h_per_year", "comp_kWh_day", "h_outside_2_8_loading", "h_outside_2_8_other",
              "saved_vs_grid_INR_yr", "saved_vs_diesel_INR_yr"):
        assert base[k] == ref[k], k
    saved = json.loads((ROOT / "results/live/uncertainty_2026.json").read_text())
    assert saved["cases"]["base"]["days_full_solar_wax"] == ref["days_full_solar_wax"]
    assert "not measured" in saved["label"]
