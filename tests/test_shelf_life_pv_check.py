import pytest

from engine import pv, shelf_life
from engine.physics_check import PhysicsCheck


@pytest.mark.parametrize("crop_key", ["tomato", "leafy_greens", "grapes", "pomegranate",
                                      "mango", "milk", "vaccines"])
def test_shelf_life_is_monotonic_with_temperature(crops, crop_key):
    crop = crops[crop_key]
    # 12 hours at each temperature (short enough that nothing is fully spoiled)
    remaining = [shelf_life.assess(crop, [T] * 12, 1.0)["remaining_days_at_ref"]
                 for T in range(0, 31, 2)]
    assert all(b < a for a, b in zip(remaining, remaining[1:]))


def test_fully_spoiled_stays_at_zero(crops):
    r = shelf_life.assess(crops["milk"], [30.0] * 24 * 5, 1.0)
    assert r["remaining_days_at_ref"] == 0.0 and r["freshness_score"] == 0.0


def test_at_reference_temp_life_is_used_linearly(crops):
    c = crops["pomegranate"]
    r = shelf_life.assess(c, [c["T_ref_C"]] * 24 * 10, 1.0)   # 10 days at T_ref
    assert r["remaining_days_at_ref"] == pytest.approx(c["SL_ref_days"] - 10)


def test_chilling_warning(crops):
    r = shelf_life.assess(crops["pomegranate"], [3.0] * 5, 1.0)
    assert r["warnings"] and "Chilling" in r["warnings"][0]
    assert shelf_life.assess(crops["pomegranate"], [6.0] * 5, 1.0)["warnings"] == []
    assert shelf_life.chilling_warning_now(crops["mango"], 5.0)


def test_pv_at_standard_conditions(cfg):
    # At 1000 W/m2 and T_cell = 25 C, power = rated * PR
    T_amb = 25 - (45 - 20) / 800 * 1000
    assert pv.pv_power(cfg, 1000, T_amb)["P_kW"] == pytest.approx(1.8 * 0.79)


def test_pv_hot_panel_makes_less_power(cfg):
    assert pv.pv_power(cfg, 800, 40)["P_kW"] < pv.pv_power(cfg, 800, 20)["P_kW"]


def test_sun_position_vizag():
    # Around local noon the sun is high; at midnight it is below the horizon.
    noon, *_ = pv.solar_position(172, 11.9, 17.68, 83.2, 5.5)
    night, *_ = pv.solar_position(172, 0.0, 17.68, 83.2, 5.5)
    assert noon > 0.95 and night < 0


def test_poa_is_zero_at_night_and_sensible_at_noon():
    assert pv.poa_irradiance(0, 100, 0, 17.68, 83.2, 5.5, 17) == 0.0
    g = pv.poa_irradiance(900, 15, 12.0, 17.68, 83.2, 5.5, 17)   # January noon
    assert 900 < g < 1200      # south tilt gains in winter


def test_physics_check_needs_persistence():
    pc = PhysicsCheck(threshold_K=1.5, persist_minutes=15)
    # short spike (5 min) -> not flagged
    for minute in range(5):
        r = pc.update(minute * 60, 9.0, 5.0)
    assert not r["suspicious"]
    r = pc.update(6 * 60, 5.1, 5.0)          # back to normal, timer resets
    assert r["status"].startswith("OK")
    # 20 minutes of disagreement -> flagged
    for minute in range(20):
        r = pc.update(1000 + minute * 60, 9.0, 5.0)
    assert r["suspicious"] and r["status"] == "Sensor suspicious - check"
