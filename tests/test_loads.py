import pytest
from CoolProp.HumidAirProp import HAPropsSI

from engine import loads, psychro


def test_wall_load_at_40C_is_about_0_20_kW(cfg):
    # U*A*dT = 0.22 * 25.6 * (40 - 5) = 197 W
    w = loads.wall_load(cfg, 40.0, 5.0)
    assert w["U_W_m2K"] == pytest.approx(0.22)
    assert w["Q_kW"] == pytest.approx(0.20, abs=0.005)


@pytest.mark.parametrize("T, rh", [(5, 90), (35, 65), (25, 50), (40, 30)])
def test_psychro_matches_coolprop(T, rh):
    TK, p, R = T + 273.15, 101325.0, rh / 100
    W_cp = HAPropsSI("W", "T", TK, "P", p, "R", R)
    v_cp = HAPropsSI("Vha", "T", TK, "P", p, "R", R)   # m3 per kg humid air
    assert psychro.humidity_ratio(T, rh) == pytest.approx(W_cp, rel=0.01)
    assert psychro.density(T, rh) == pytest.approx(1 / v_cp, rel=0.005)
    # enthalpy datums differ between libraries, so compare enthalpy DIFFERENCES
    dh_ours = psychro.enthalpy(T, rh) - psychro.enthalpy(5, 90)
    dh_cp = (HAPropsSI("H", "T", TK, "P", p, "R", R)
             - HAPropsSI("H", "T", 278.15, "P", p, "R", 0.9)) / 1000
    assert dh_ours == pytest.approx(dh_cp, rel=0.01)


def test_infiltration_parts_add_up(cfg):
    r = loads.infiltration_load(cfg, 35, 65, 5, 90, curtain=False)
    assert r["Q_sensible_kW"] + r["Q_latent_kW"] == pytest.approx(r["Q_kW"])
    assert r["Q_latent_kW"] > 0     # humid Vizag air brings in moisture


def test_curtain_cuts_infiltration_by_E(cfg):
    open_ = loads.infiltration_load(cfg, 35, 65, 5, 90, curtain=False)
    curt = loads.infiltration_load(cfg, 35, 65, 5, 90, curtain=True)
    assert curt["Q_kW"] == pytest.approx(open_["Q_kW"] * (1 - 0.85))


def test_infiltration_grows_with_door_time(cfg):
    a = loads.infiltration_load(cfg, 35, 65, 5, 90, D_t=0.01)
    b = loads.infiltration_load(cfg, 35, 65, 5, 90, D_t=0.02)
    assert b["Q_kW"] == pytest.approx(2 * a["Q_kW"])


def test_no_infiltration_load_when_outside_is_colder(cfg):
    r = loads.infiltration_load(cfg, 2, 80, 5, 90)
    assert r["Q_kW"] == 0.0


def test_product_pulldown(cfg, crops):
    p = loads.product_load(cfg, crops["milk"])          # milk has no respiration
    assert p["Q_kW"] == pytest.approx(200 * 3.9 * 20 / (4 * 3600))


def test_total_is_sum_of_parts(cfg, crops):
    t = loads.total_load(cfg, crops["tomato"], 35, 65)
    assert sum(t["breakdown_kW"].values()) == pytest.approx(t["subtotal_kW"])
    assert t["total_with_margin_kW"] == pytest.approx(1.1 * t["subtotal_kW"])
