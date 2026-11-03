import pytest

from engine.pcm import PCMBattery
from engine.pcm_slab import simulate_slab, stability_number


def test_full_battery_latent_energy_is_m_times_L(cfg):
    b = PCMBattery(cfg, frozen_fraction=1.0)
    assert b.latent_remaining_kJ == pytest.approx(115 * 190)
    assert b.battery_pct == pytest.approx(100.0)


def test_melting_exactly_mL_empties_the_battery(cfg):
    b = PCMBattery(cfg, frozen_fraction=1.0)
    b.step(Q_net_kW=1.0, dt_s=115 * 190)          # 1 kW for m*L seconds = m*L kJ
    assert b.battery_pct == pytest.approx(0.0, abs=1e-9)
    assert b.temperature_C == pytest.approx(4.0)


def test_sensible_heat_of_solid_and_liquid(cfg):
    b = PCMBattery(cfg, T_C=0.0)                  # solid at 0 C, 4 K below melting
    assert b.h == pytest.approx(1.8 * (0 - 4))
    b2 = PCMBattery(cfg, T_C=8.0)                 # liquid at 8 C
    assert b2.energy_remaining_kJ == pytest.approx(0.0)
    # solid at 0 C stores more cold than solid at 4 C, by m*cp_s*4
    b3 = PCMBattery(cfg, frozen_fraction=1.0)
    assert b.energy_remaining_kJ - b3.energy_remaining_kJ == pytest.approx(115 * 1.8 * 4)


def test_energy_balance_over_many_steps(cfg):
    b = PCMBattery(cfg, frozen_fraction=0.5)
    E0 = b.energy_total_kJ
    for q in [0.3, -1.0, 0.5, 0.2, -0.4] * 100:
        b.step(q, 60)
    assert b.energy_total_kJ - E0 == pytest.approx(b.heat_in_kJ - b.heat_out_kJ)


def test_backup_hours(cfg):
    b = PCMBattery(cfg, frozen_fraction=1.0)
    assert b.backup_hours(0.3) == pytest.approx(b.energy_remaining_kJ / 0.3 / 3600)


def test_ftcs_stability_condition_is_met(cfg):
    s = simulate_slab(cfg, hours=1, T_init_C=2, T_air_C=8)
    assert s["r"] <= 0.5
    assert stability_number(0.2, 800, 1800, s["dt_s"], s["dx_mm"] / 1000) <= 0.5


def test_ftcs_refuses_unstable_time_step(cfg):
    with pytest.raises(ValueError):
        simulate_slab(cfg, hours=0.1, r_target=0.6)


def test_slab_melts_steadily_and_conserves_energy(cfg):
    s = simulate_slab(cfg, hours=6, T_init_C=2, T_air_C=10)
    lf = s["liquid_fraction"]
    assert lf[0] == 0.0 and lf[-1] > 0.2
    assert all(b >= a - 1e-12 for a, b in zip(lf, lf[1:]))     # never refreezes in warm air
    assert abs(s["energy_balance_error_J_m2"]) < 1e-6 * s["heat_absorbed_kJ_m2"][-1] * 1000


def test_slab_stays_frozen_in_cold_air(cfg):
    s = simulate_slab(cfg, hours=2, T_init_C=0, T_air_C=-5)
    assert s["liquid_fraction"][-1] == 0.0
