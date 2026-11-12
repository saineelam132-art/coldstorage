"""Tomorrow advisor: each advice rule, and the plan numbers add up."""
import pandas as pd
import pytest

from twin import advisor as AD


def wx(sun=5.5, rain=0.0, gust=None, code=None, cloud=10):
    g = [0.0] * 6 + [sun * 1000 / 12] * 12 + [0.0] * 6
    return pd.DataFrame({"T_out": [28.0] * 24, "ghi": g, "rain_mm": [rain / 24] * 24, "cloud_pct": [cloud] * 24,
                         "gust_kmh": [gust] * 24 if gust is not None else [None] * 24, "wcode": [code] * 24 if code is not None else [None] * 24})


def plan(grid_h=0.0, first=None, wax=60.0):
    return {"grid_h": grid_h, "first_grid_hhmm": first, "wax_low_hhmm": None, "wax_night_pct": wax}


def test_normal_day():
    rule, line, extra = AD.advise(AD.weather_summary(wx()), plan())
    assert rule == "normal" and line == "Tomorrow runs fully on solar + wax. No grid needed."
    assert any("no pre-cooling" in x for x in extra) and any("150 kg is fine" in x for x in extra)


def test_low_sun_keeps_grid_ready():
    rule, line, extra = AD.advise(AD.weather_summary(wx(sun=2.0, cloud=90)), plan(grid_h=1.5, first="19:00", wax=12))
    assert rule == "low_sun"
    assert line == "Low sun tomorrow – wax will drop to 12 % by night. Keep grid ready from 19:00."


def test_grid_needed_even_with_some_sun_is_low_sun():
    rule, _, _ = AD.advise(AD.weather_summary(wx(sun=4.0)), plan(grid_h=0.5, first="05:00"))
    assert rule == "low_sun"


@pytest.mark.parametrize("kw", [{"code": 95}, {"code": 82}, {"gust": 75.0}, {"sun": 0.6}, {"rain": 80.0}])
def test_storm_rules(kw):
    rule, line, extra = AD.advise(AD.weather_summary(wx(**kw)), plan(grid_h=5.0, first="02:00"))
    assert rule == "storm" and line.startswith("Storm expected")
    assert any("IMD" in x and "mausam.imd.gov.in" in x for x in extra)
    assert any("pre-cool" in x for x in extra) and any("100 kg" in x for x in extra)


def test_precool_and_reduce_intake_thresholds():
    _, _, extra = AD.advise(AD.weather_summary(wx(sun=3.0)), plan(grid_h=2.5, first="20:00"))
    assert any("pre-cool the room" in x for x in extra) and any("150 kg is fine" in x for x in extra)
    _, _, extra = AD.advise(AD.weather_summary(wx(sun=3.0)), plan(grid_h=4.5, first="20:00"))
    assert any("100 kg" in x for x in extra)


def test_no_gust_data_does_not_trigger_storm():
    w = AD.weather_summary(wx())
    assert w["gust_max_kmh"] is None and AD.advise(w, plan())[0] == "normal"


def test_day_plan_hours_and_costs_add_up():
    from engine.config import load_config
    cfg = load_config()
    t = pd.date_range("2026-11-13", periods=24, freq="h")
    H = pd.DataFrame({"time_ist": t, "T_out": 28.0, "P_grid": [0.3] * 3 + [0.0] * 21, "grid_on": [1.0] * 3 + [0.0] * 21,
                      "pcm_pct": [50.0] * 24, "T_room": [5.0] * 24})
    Hg = pd.DataFrame({"time_ist": t, "T_out": 28.0, "P_comp": [0.15] * 24})
    p = AD.day_plan(H, Hg, cfg)
    tar = cfg["live_run"]["money"]["grid_tariff_INR_kWh"]
    assert p["grid_h"] == pytest.approx(3.0) and p["solar_wax_h"] == pytest.approx(21.0)
    assert p["cost_grid_INR"] == pytest.approx(0.9 * tar)
    assert p["diesel_h_if_cut"] == 0.0                                  # grid hours are at night, outside the 10-18 h cut
    assert p["saved_vs_grid_INR"] == pytest.approx(0.15 * 24 * tar - 0.9 * tar)
    assert p["first_grid_hhmm"] == "00:00"
