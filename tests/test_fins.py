"""Final design checks: finned wax panels (passive), optional fans only when allowed, fan heat counted,
12 V battery covers the night, energy balance, floor space."""
import copy

import numpy as np
import pytest

from engine import fan as FAN
from engine import fins as F
from engine.config import load_config
from twin import live_weather as LW
from twin.live_sim import simulate_live

HAVE_DATA = (LW.LIVE / "openmeteo_archive_2026.csv").exists()
CFG = load_config()
HX = CFG["live_run"]["wax_hx"]
R = FAN.wax_resistance(CFG, CFG["live_run"]["designs"]["current"]["pcm_kg"])


def test_final_design_is_finned_passive_with_40Ah_battery():
    assert HX["kind"] == "fins" and HX["b"] == 0.04 and HX["S"] == 0.023 and HX["L"] == 1.6
    assert HX["optional_fans"]["installed"] == 0
    assert CFG["live_run"]["night_fan"]["enabled"] is False
    assert CFG["live_run"]["battery_12V"]["capacity_Ah"] == 40


def test_fin_calculation_by_hand():
    c = F.array(12.0, HX["L"], HX["S"], HX["b"], HX["t"], R, 3.0)
    # area multiplier = (S + 2b + t)/(S + t) with the base under the fins removed
    assert c["area_mult"] == pytest.approx((23 + 80 + 1) / 24, rel=1e-6)
    m = np.sqrt(2 * c["h"] / (200 * 0.001))
    assert c["eta"] == pytest.approx(np.tanh(m * 0.0405) / (m * 0.0405), rel=1e-9)
    assert c["h"] == pytest.approx(min(c["h_bar_cohen"], c["h_van_de_pol"]))
    assert c["UA"] < c["UA_air"]                                    # wax layer in series
    assert c["UA"] > 2 * F.plain(12.0, HX["L"], R, 3.0)["UA"]       # fins at least double the plain panel


def test_bar_cohen_optimum_gap_is_about_20mm():
    assert 0.018 < F.s_opt(1.2, 3.0) < 0.022


def test_fins_carry_the_hottest_night_load_at_3K():
    load, _ = FAN.design_night_load(CFG, 31.9, 7.0)
    assert F.array(12.0, HX["L"], HX["S"], HX["b"], HX["t"], R, 3.0)["Q_W"] > load


@pytest.fixture(scope="module")
def week():
    w = LW.load_actual()
    return w[(w.time_ist >= "2026-05-15") & (w.time_ist < "2026-05-29")].reset_index(drop=True)


@pytest.mark.skipif(not HAVE_DATA, reason="no saved 2026 weather")
def test_final_design_uses_no_fan_power_and_balances(week):
    H, T, _, _ = simulate_live(week, "current", cfg=CFG)
    assert T["wax_hx"]["kind"] == "fins"
    assert (H.fan_W == 0).all() and (H.fan_speed == 0).all()
    assert T["energy_balance_error_pct"] < 1e-6
    hod = H.time_ist.dt.hour
    load_h = {(e["hour"] + j) % 24 for e in CFG["live_run"]["loading"] for j in range(3)}
    assert ((H.T_room[~hod.isin(load_h)] > 8) | (H.T_room[~hod.isin(load_h)] < 2)).sum() == 0


@pytest.mark.skipif(not HAVE_DATA, reason="no saved 2026 weather")
def test_optional_fans_only_run_when_allowed_and_their_heat_is_counted(week):
    c = copy.deepcopy(CFG)
    rule = HX["optional_fans"]["rule"]
    c["live_run"]["night_fan"].update(rule)
    hx = {**HX, "h_scale": 0.75, "fan": {"name": "120 mm", "d_mm": 120, "flow_m3h": 150, "watts": 3.0, "pressure_Pa": 30, "count": 2}}
    H, T, _, _ = simulate_live(week, "current", cfg=c, fan_on=True, hx=hx, steps=True)
    S = T["steps"]
    on = S.fan_speed > 0
    assert on.any()
    load_steps = int(CFG["live_run"]["loading_window_h"] * 12)
    hours = S.index.hour + S.index.minute / 60.0
    ld = CFG["live_run"]["loading"][0]["hour"]
    in_loading = (hours >= ld) & (hours < ld + load_steps / 12)
    T0 = S.T_room.shift(1).bfill()                    # the rule decides on the room temperature at the START of the step
    ok_night = (S.Q_air + S.Q_ch <= 1e-9) & (T0 > rule["on_above_C"])
    ok_morning = in_loading & (T0 > rule["morning_assist_above_C"])
    assert (on <= (ok_night | ok_morning)).all()
    # fan heat is part of Q_int: Q_int = lights + controller + evaporator fan + night fans
    assert (S.Q_int[on] >= S.fan_W[on] / 1000 - 1e-12).all()
    assert T["energy_balance_error_pct"] < 1e-6


@pytest.mark.skipif(not HAVE_DATA, reason="no saved 2026 weather")
def test_12V_battery_covers_the_worst_night_and_a_reserve_day():
    from twin.design_study_2026 import battery
    w = LW.load_actual()
    w = w[~w.is_forecast].reset_index(drop=True)
    H = simulate_live(w, "current", cfg=CFG)[0]
    b = battery(H, CFG)
    usable_Wh = CFG["live_run"]["battery_12V"]["capacity_Ah"] * CFG["live_run"]["battery_12V"]["voltage"] * 0.8
    assert usable_Wh >= b["worst_night_Wh"] + b["worst_day_Wh"]


def test_150kg_of_crates_fits_with_the_keep_clear_zone():
    from twin.design_study_2026 import floor_check
    f = floor_check(CFG)
    assert f["fits_150kg"] and f["usable_floor_m2"] > 2.5
