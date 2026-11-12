"""Space budget, pomegranate capacity, reality-check (stress) cases and best load."""
import json
from pathlib import Path

import numpy as np
import pytest

from engine import space as SP
from engine.config import load_config, load_crops

ROOT = Path(__file__).resolve().parent.parent


@pytest.fixture(scope="module")
def sb():
    return SP.build()[0]


def test_space_budget_adds_up_to_the_room(sb):
    assert sb["room"]["volume_m3"] == pytest.approx(8.8)
    assert sum(r["volume_m3"] for r in sb["table"]) == pytest.approx(8.8, abs=0.01)
    assert sb["zones_sum_m3"] == pytest.approx(8.8, abs=1e-6)


def test_crates_times_kg_is_capacity(sb):
    racks = sb["layout"]["racks"]
    assert sum(r["crates"] for r in racks) == sb["crate_places"]
    assert sb["crate_places"] * sb["kg_per_crate"] == sb["capacity_kg"]


def test_chosen_layout_keeps_the_aisle(sb):
    assert sb["layout"]["aisle_m"] >= 0.6
    assert sb["layout"]["options"]["two_side_racks"]["ok"] is False      # 0.49 m aisle is too narrow


def test_wax_volume_and_pomegranate_counts(sb):
    assert 0.12 <= sb["wax"]["wax_volume_liquid_m3"] <= 0.16
    p = sb["pomegranate"]
    assert p["fruits_per_150_kg"] == round(150 * 1000 / p["fruit_mass_g"])
    assert p["fruits_full_room"] == round(sb["capacity_kg"] * 1000 / p["fruit_mass_g"])


def test_pomegranate_data_has_sources():
    c = load_crops()["pomegranate"]
    for k in ("cp_source", "respiration_source"):
        assert c[k]
    for k, v in c["fruit"].items():
        if k.endswith("_source"):
            assert v.startswith("E") or "http" in v or "study" in v


@pytest.fixture(scope="module")
def study():
    from twin import uncertainty_2026 as U
    w = U.study_weather()
    return load_config(), w, U.hottest_night(w)


def test_base_case_reproduces_published_results_exactly(study):
    from twin import uncertainty_2026 as U
    cfg, w, night = study
    ref = json.loads((ROOT / "results/live/uncertainty_2026.json").read_text())["cases"]["base"]
    assert U.run_case(w, cfg, night) == ref
    from twin.live_sim import simulate_live
    a = simulate_live(w.iloc[:72], "current", cfg=cfg)[0]
    b = simulate_live(w.iloc[:72], "current", cfg=cfg, real={})[0]
    assert a.equals(b)


def test_stress_cases_are_repeatable(study):
    from twin import stress_2026 as ST
    from twin.live_sim import simulate_live
    cfg, w, _ = study
    real, _, crop = ST.spec_of("realistic")
    win = w.iloc[3000:3000 + 96].reset_index(drop=True)
    a = simulate_live(win, "current", cfg=cfg, crop_key=crop, real=real)[0]
    b = simulate_live(win, "current", cfg=cfg, crop_key=crop, real=real)[0]
    assert a.equals(b)


def test_crates_add_a_few_percent_of_the_produce_heat(sb):
    crop = load_crops()["pomegranate"]
    crates = np.ceil(150 / sb["kg_per_crate"]) * sb["thermal_mass"]["crate_kJ_K_each"]
    share = crates / (150 * crop["cp_kJ_kgK"])
    assert 0.02 < share < 0.10


def test_lots_of_produce_stays_stable(study):
    from twin.live_sim import simulate_live
    cfg, w, _ = study
    H = simulate_live(w.iloc[:96].reset_index(drop=True), "current", cfg=cfg, real={"dwell_days": 7, "intake_kg": [350] * 10})[0]
    assert H.T_room.between(-10, 40).all()


def test_result_files_exist_and_agree():
    S = json.loads((ROOT / "results/live/stress_2026.json").read_text(encoding="utf-8"))
    ref = json.loads((ROOT / "results/live/uncertainty_2026.json").read_text())["cases"]["base"]
    assert S["cases"]["base"]["days_full_solar_wax"] == ref["days_full_solar_wax"]
    assert S["headline"]["base_days"] == ref["days_full_solar_wax"]
    B = json.loads((ROOT / "results/live/best_load_2026.json").read_text(encoding="utf-8"))
    for row in B["sweep"]["realistic"]:
        assert row["ok_c"] == (row["intake_kg_day"] * row["dwell_days"] <= B["capacity_kg"])
