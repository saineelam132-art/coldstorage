"""Phase 2 checks: weather file, door schedule, seed, energy balance, controller logic."""
import numpy as np
import pandas as pd
import pytest

from engine.config import with_overrides
from twin import studies
from twin.simulate import door_seconds, simulate
from twin.weather import load_weather


@pytest.fixture(scope="module")
def weather(cfg):
    return load_weather(cfg=cfg)


@pytest.fixture(scope="module")
def base(cfg, weather):
    return simulate(cfg, weather)


def test_weather_is_a_complete_real_year(weather):
    assert len(weather) == 8760
    assert weather.isna().sum().sum() == 0
    days = weather["time_ist"].dt.normalize().value_counts()
    assert len(days) == 365 and (days == 24).all()
    assert (weather["ghi"] >= 0).all()
    annual = weather["ghi"].sum() / 1000 / 365
    assert 4.3 < annual < 5.6                  # Vizag: about 5 kWh/m2/day
    assert 20 < weather["T_out"].mean() < 32
    assert 95_000 < weather["ps_Pa"].mean() < 103_000   # pressure in Pa (not hPa/kPa)


def test_sun_peaks_around_noon(weather):
    by_hour = weather.groupby(weather["time_ist"].dt.hour)["ghi"].mean()
    assert by_hour.idxmax() in (11, 12)        # slot 11:30-12:30 or 12:30-13:30 IST


def test_door_schedule_busy_at_loading_quiet_at_night(cfg, weather):
    secs = door_seconds(cfg, weather)
    s = pd.Series(secs, index=pd.date_range("2025-01-01", periods=len(secs), freq="5min"))
    by_hour = s.groupby(s.index.hour).sum()
    loading = by_hour[[7, 8, 9, 16, 17, 18]].mean()
    night = by_hour[[22, 23, 0, 1, 2, 3, 4, 5]].mean()
    day = by_hour[[11, 12, 13, 14]].mean()
    assert loading > 2 * day > 2 * night * 2


def test_fixed_seed_gives_identical_results(cfg, weather, base):
    again, _ = simulate(cfg, weather, record=False)
    for k, v in base[0].items():
        if isinstance(v, float):
            assert again[k] == v, k
    assert np.array_equal(door_seconds(cfg, weather), door_seconds(cfg, weather))
    other = door_seconds(with_overrides(cfg, {"simulation": {"random_seed": 1}}), weather)
    assert not np.array_equal(other, door_seconds(cfg, weather))


def test_year_energy_balance_within_1_percent(base):
    s = base[0]
    assert s["energy_balance_error_pct"] < 1.0
    assert s["energy_in_kWh"] == pytest.approx(s["energy_out_kWh"] + s["stored_change_kWh"], rel=0.01)


def test_solar_used_plus_wasted_equals_produced(base):
    s = base[0]
    assert s["pv_used_kWh"] + s["solar_wasted_kWh"] == pytest.approx(s["pv_kWh"])


def test_room_stays_in_band_for_current_design(base):
    s, df = base
    assert s["hours_outside_2_8C"] == 0
    assert df["T_room"].between(2, 8).all()


def test_pcm_never_below_charge_stop(cfg, base):
    _, df = base
    assert df["T_pcm"].min() >= cfg["simulation"]["pcm_charge_stop_C"] - 1e-6


def test_no_pcm_means_grid_every_night(cfg, weather):
    s, _ = simulate(with_overrides(cfg, {"pcm": {"mass_kg": 0}}), weather, record=False)
    assert s["days_full_solar_pcm"] == 0
    assert s["grid_hours"] > 3000


def test_more_pcm_means_fewer_grid_hours(cfg, weather):
    g = [simulate(with_overrides(cfg, {"pcm": {"mass_kg": m}}), weather, record=False)[0]["grid_hours"]
         for m in (60, 115, 230)]
    assert g[0] > g[1] > g[2]


def test_forecast_charging_saves_grid_hours(cfg, weather, base):
    f, _ = simulate(with_overrides(cfg, {"controller": {"mode": "forecast"}}), weather, record=False)
    assert f["grid_hours"] < base[0]["grid_hours"]
    assert f["T_room_min_C"] >= cfg["setpoint"]["band_low_C"]


def test_grid_only_used_when_ats_allows(cfg, base):
    _, df = base
    assert (df.loc[~df["grid_on"], "P_grid"] == 0).all()


def test_day_classes_cover_the_year(cfg, weather):
    _, counts, days, _ = studies.weather_check(weather, cfg)
    whole = counts.loc["Whole year"]
    assert whole["sunny"] + whole["cloudy"] + whole["rainy"] == 365
    assert set(days["class"]) <= {"sunny", "cloudy", "rainy"}


def test_recommendation_rule(cfg):
    par = pd.DataFrame([
        dict(pcm_mass_kg=60, pv_kWp=1.5, Qmax_kW=1.5, hours_outside_2_8C=0, grid_hours=500, pct_days_full_solar_pcm=50),
        dict(pcm_mass_kg=115, pv_kWp=1.8, Qmax_kW=1.5, hours_outside_2_8C=0, grid_hours=90, pct_days_full_solar_pcm=90),
        dict(pcm_mass_kg=230, pv_kWp=2.4, Qmax_kW=1.5, hours_outside_2_8C=0, grid_hours=20, pct_days_full_solar_pcm=96),
        dict(pcm_mass_kg=90, pv_kWp=1.8, Qmax_kW=1.5, hours_outside_2_8C=5, grid_hours=50, pct_days_full_solar_pcm=93),
    ])
    pick, ok = studies.recommend(par, cfg)
    # 60 kg fails the grid limit, 90 kg leaves the band -> cheapest passing is 115 kg / 1.8 kWp
    assert (pick["pcm_mass_kg"], pick["pv_kWp"]) == (115, 1.8)
