"""The corrected R290 numbers from the prompt (Section 3) must be reproduced."""
import pytest

from engine import r290


@pytest.fixture(scope="module")
def c():
    return r290.cycle(T_evap_C=-5, T_cond_C=50, Q_evap_kW=1.5, eta_is=0.75, eta_motor=0.85)


@pytest.mark.parametrize("key, expected, tol", [
    ("P_evap_bar", 4.06, 0.01),
    ("P_cond_bar", 17.13, 0.01),
    ("h1", 569.0, 1.0),
    ("h2s", 637.0, 1.0),
    ("h3", 337.0, 1.0),
    ("h4", 337.0, 1.0),
    ("q_e", 233.0, 1.0),
    ("w_s", 67.5, 0.5),
    ("COP_ideal", 3.44, 0.01),
    ("COP_real", 2.58, 0.01),
    ("COP_elec", 2.2, 0.01),
    ("m_dot_g_s", 6.5, 0.1),
    ("P_elec_kW", 0.68, 0.01),
])
def test_poster_values(c, key, expected, tol):
    assert c[key] == pytest.approx(expected, abs=tol)


def test_energy_balance_of_cycle(c):
    # condenser heat = evaporator heat + compressor shaft work
    assert c["Q_cond_kW"] == pytest.approx(c["Q_evap_kW"] + c["P_shaft_kW"], rel=1e-9)


def test_cop_falls_when_ambient_rises(cfg):
    cool = r290.cycle_from_config(cfg, T_amb_C=25)
    hot = r290.cycle_from_config(cfg, T_amb_C=40)
    assert cool["COP_elec"] > hot["COP_elec"]
    assert hot["T_cond_C"] == 50.0


def test_ph_dome_has_both_lines():
    d = r290.saturation_dome()
    assert len(d["liquid"]) == len(d["vapour"]) > 10
    # vapour enthalpy is always above liquid enthalpy at the same pressure
    assert all(v[0] > l[0] for l, v in zip(d["liquid"], d["vapour"]))
