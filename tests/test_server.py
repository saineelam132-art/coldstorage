"""Phase 3 step 1 checks: the numbers the website shows come from the twin and the engine."""
import json
from pathlib import Path

import pytest

from engine import pv
from server.twin_state import TwinState, geometry

ROOT = Path(__file__).resolve().parent.parent


@pytest.fixture(scope="module")
def tw():
    return TwinState()


def test_every_sensor_quantity_is_in_the_state(tw):
    s = tw.state(100 * 86400 + 9 * 3600)
    for sensor in tw.sensors["sensors"] + tw.sensors["computed"]:
        assert sensor["quantity"] in s["values"], sensor["id"]
    assert s["source"] == "SIMULATED" and "Simulated" in s["label"]


def test_state_matches_the_simulation(tw):
    t = 150 * 86400 + 14 * 3600
    i = tw.index(t)
    v = tw.state(t)["values"]
    assert v["T_room"] == pytest.approx(tw.df["T_room"].iloc[i])
    assert v["pcm_pct"] == pytest.approx(tw.df["pcm_pct"].iloc[i])
    assert v["Q_total"] == pytest.approx(sum(tw.df[k].iloc[i] for k in ("Q_wall", "Q_door", "Q_int", "Q_resp", "Q_batch")))


def test_curtain_cuts_doorway_heat_by_E(tw):
    t = 120 * 86400 + 12 * 3600
    on = tw.state(t, curtain=True)["values"]["heat_if_open_kW"]
    off = tw.state(t, curtain=False)["values"]["heat_if_open_kW"]
    assert on == pytest.approx(off * (1 - 0.85))


def test_door_open_matches_door_switch_record(tw):
    i = int(next(j for j, s in enumerate(tw.df["door_s"].values) if s > 10))
    t = i * tw.dt
    assert tw.state(t + 1)["values"]["door_open"] is True
    assert tw.state(t + tw.dt - 1)["values"]["door_open"] is False


def test_geometry_follows_design(tw):
    g = geometry(tw.cfg)
    assert g["outer"][0] == pytest.approx(g["inner"][0] + 2 * g["wall_t"])
    assert g["pv"]["modules"] == 8 and g["pv"]["array_kWp"] == pytest.approx(1.8)
    assert g["door"] == [0.8, 1.8]


def test_hotspots_point_to_real_sensors_and_parts():
    sensors = {s["id"] for s in json.loads((ROOT / "config/sensors.json").read_text(encoding="utf-8"))["sensors"]}
    parts = {"solar", "condenser", "door", "crates", "worker", "evaporator", "pcm", "crate_greens", "crate_grapes", "milk", "vaccine"}
    hs = json.loads((ROOT / "web/assets/hotspots.json").read_text(encoding="utf-8"))
    for img, spots in hs.items():
        if img.startswith("_"):
            continue
        for h in spots:
            assert 0 <= h["x"] <= 100 and 0 <= h["y"] <= 100
            assert h.get("sensor") in sensors or h.get("part") in parts, (img, h)


def test_sun_is_south_at_noon_in_winter():
    elev, az = pv.sun_angles(15, 11.9, 17.68, 83.2, 5.5)
    assert 45 < elev < 55 and 170 < az < 190
    _, az_morning = pv.sun_angles(15, 8.0, 17.68, 83.2, 5.5)
    assert 100 < az_morning < 140                   # morning sun in the south-east


def test_doorway_settings_are_inside_the_pictures():
    sc = json.loads((ROOT / "web/assets/scenes.json").read_text(encoding="utf-8"))
    for name, d in sc["doorways"].items():
        if name.startswith("_"):
            continue
        assert 0 <= d["x0"] < d["x1"] <= 100 and 0 <= d["label_y"] < d["y0"] < d["y1"] <= 100
        assert d["view"] in ("outside", "inside")


def test_last_opening_energy_is_power_times_time(tw):
    t = 86 * 86400 + 8.3 * 3600
    v = tw.state(t)["values"]
    assert v["last_open_s"] > 0
    assert v["last_open_kJ"] == pytest.approx(v["heat_if_open_kW"] * v["last_open_s"])


def test_crop_shelf_life_uses_room_history(tw):
    d = tw.crop("leafy_greens", 86 * 86400 + 12 * 3600, 2)
    a = d["assess"]
    assert 0 < a["remaining_days_at_ref"] < d["SL_ref_days"]
    assert len(d["history_T"]) == 2 * 24 + 1
    assert all(2 <= T <= 8 for T in d["history_T"])


def test_live_cycle_uses_outside_temperature(tw):
    t = 86 * 86400 + 12 * 3600
    c = tw.cycle(t)["cycle"]
    assert c["T_cond_C"] == pytest.approx(tw.state(t)["values"]["T_out"] + 10, abs=0.02)
