"""Solenoid + TXV split (ON/OFF branches) and the real-photo rules."""
import json
from pathlib import Path

import numpy as np
import pytest

from engine.config import load_config
from twin import live_weather as LW
from twin.live_sim import published_cfg, simulate_live

ROOT = Path(__file__).resolve().parent.parent


@pytest.fixture(scope="module")
def week():
    w = LW.load_actual()
    return w.iloc[24 * 120:24 * 127].reset_index(drop=True)          # one week in May (hot, sunny)


def test_config_chooses_solenoid_txv():
    v = load_config()["refrigeration"]["valves"]
    assert v["type"] == "sv_txv" and v["min_on_min"] == 3 and v["txv_superheat_K"] == 5.0


def test_published_cfg_keeps_the_old_eev_model(week):
    cfg = load_config()
    a = simulate_live(week, "current", cfg=published_cfg(cfg))[0]
    b = simulate_live(week, "current", cfg=cfg, valves="eev")[0]
    assert np.allclose(a.T_room, b.T_room) and np.allclose(a.Q_ch, b.Q_ch)


def test_on_off_rules_hold_every_5_minutes(week):
    cfg = load_config()
    v = cfg["refrigeration"]["valves"]
    S = simulate_live(week, "current", cfg=cfg, steps=True)[1]["steps"]
    run = S.running > 0
    assert not (run & (S.sv_a == 0) & (S.sv_b == 0)).any()                     # never both shut while running
    assert ((S.sv_b == 0) | ((S.grid_on == 0) & (S.solar_ok > 0))).all()       # SV-B only on spare SOLAR
    assert (S.Q_ch[S.sv_b > 0] >= v["txv_min_load_kW_E"] - 1e-9).all()        # never a trickle the TXV cannot hold
    assert (S.Q_ch[S.sv_b == 0] == 0).all()
    night = S.poa < 1
    assert (S.sv_b[night] == 0).all()                                          # night: wax branch shut
    assert S.sv_b.sum() > 0 and S.sv_a.sum() > 0                               # both branches used in a sunny week
    room = S[(S.sv_a > 0) & (S.sv_b == 0)]                                     # SV-A alone: >= 3 min at minimum speed
    Qmin = cfg["simulation"]["inverter_min_capacity_frac"] * cfg["live_run"]["compressor_max_kW"]
    assert (room.Q_air >= Qmin * v["min_on_min"] / 5 - 1e-9).all()


def test_valve_study_file_and_cost_table():
    V = json.loads((ROOT / "results/live/valves_2026.json").read_text())
    rows = {r["key"]: r for r in V["rows"]}
    for k in ("days_full_solar_wax", "grid_h", "wax_sunset_avg", "hours_above_8C"):
        assert rows[k]["eev"] is not None and rows[k]["sv_txv"] is not None
    assert V["headline"]["days_full_solar_wax"] == rows["days_full_solar_wax"]["sv_txv"]
    s = json.loads((ROOT / "results/live/summary.json").read_text())
    if s["generated"] == V["generated"]:                     # the Live Year Run uses the chosen valves (solenoid + TXV)
        assert rows["days_full_solar_wax"]["sv_txv"] == s["designs"]["current"]["totals"]["days_full_solar_wax"]
    c = V["cost"]
    assert (c["eev"]["lo"], c["eev"]["hi"]) == (15000, 35000) and (c["sv_txv"]["lo"], c["sv_txv"]["hi"]) == (6000, 12000)
    assert c["note"] == "estimate – quotation pending"


def test_diagram_has_solenoids_and_txvs_not_eevs():
    js = (ROOT / "web/js/split.js").read_text(encoding="utf-8")
    for s in ("SV-A", "SV-B", "TXV-A", "TXV-B", "liquid line", "SV-A: ${onA ? 'ON' : 'OFF'} · SV-B"):
        assert s in js
    assert "EEV-A" not in js and "EEV-B" not in js


def test_cards_use_real_photos_or_drawings_only():
    P = json.loads((ROOT / "web/assets/photos.json").read_text(encoding="utf-8"))
    credits = (ROOT / "web/assets/CREDITS.md").read_text(encoding="utf-8")
    for key, p in P["photos"].items():
        assert p["kind"] in ("own", "commons", "drawing"), key
        if p["kind"] == "drawing":
            continue
        assert (ROOT / "web" / p["file"]).exists(), p["file"]
        assert not p["file"].startswith(("assets/img/", "assets/cutouts/", "assets/tex/")), "AI picture in a card"
        assert p["caption"].startswith("Example of a " if p["kind"] == "commons" else "Our ")
        assert p["credit"].startswith("Photo: ")
        if p["kind"] == "commons":
            assert any(l in p["licence"].lower() for l in ("cc0", "cc by", "public domain")), p["licence"]
            assert p["source"].startswith("https://commons.wikimedia.org/") and p["source"] in credits
    used = {k for m in P["use"].values() for k in (m if isinstance(m, list) else m.values())}
    assert used <= set(P["photos"]) | {m["key"] for m in P["missing"]}
