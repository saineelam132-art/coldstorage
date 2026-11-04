"""Live Year Run checks: energy balance, fixed inputs respected, no battery for cooling,
forecast labelled as a prediction, sunlight timing, offline behaviour, ISHRAE licence."""
import json
import subprocess
from pathlib import Path

import numpy as np
import pandas as pd
import pytest

from engine.config import load_config
from twin import live_weather as LW
from twin.live_sim import simulate_live

ROOT = Path(__file__).resolve().parent.parent
HAVE_DATA = (LW.LIVE / "openmeteo_archive_2026.csv").exists()
pytestmark = pytest.mark.skipif(not HAVE_DATA, reason="no saved 2026 weather")


@pytest.fixture(scope="module")
def weather():
    w = LW.load_actual()
    return w[(w.time_ist >= "2026-05-01") & (w.time_ist < "2026-05-22")].reset_index(drop=True)   # hot weeks


@pytest.fixture(scope="module", params=[("current", "solar_pcm"), ("recommended", "solar_pcm"), ("current", "grid_only")])
def run(request, weather):
    des, mode = request.param
    return (des, mode) + simulate_live(weather, des, mode=mode)


def test_energy_balance_within_1_percent(run):
    *_, H, tot, end, bt = run
    assert tot["energy_balance_error_pct"] < 1.0
    assert tot["energy_in_kWh"] == pytest.approx(tot["energy_out_kWh"] + tot["stored_change_kWh"], rel=0.01)


def test_four_door_openings_of_15_s_every_day(run):
    *_, H, tot, end, bt = run
    per_day = H.groupby(H.time_ist.dt.date).door_s.sum()
    assert (per_day == 4 * 15).all()


def test_compressor_never_above_its_maximum(run):
    *_, H, tot, end, bt = run
    assert H.Q_cool.max() <= load_config()["live_run"]["compressor_max_kW"] + 1e-9


def test_fresh_batch_enters_at_8_am_at_outside_temperature(run, weather):
    *_, H, tot, end, bt = run
    first = H[H.time_ist.dt.hour == 8].iloc[0]
    assert first.T_batch > 20                                # hot May morning, warmer than the room
    w8 = weather[weather.time_ist.dt.hour == 8].T_out.values
    assert np.allclose(bt.T_in_C.values[: len(w8)], w8, atol=1.5)   # interpolated within the hour


def test_no_battery_for_cooling(run):
    """With no sun and the grid switch off, the compressor AND the fan must be off."""
    des, mode, H, tot, end, bt = run
    if mode == "grid_only":
        assert (H.grid_on == 1).all() and (H.P_pv == 0).all()
        return
    dark = (H.P_pv == 0) & (H.grid_on == 0)
    assert dark.sum() > 50
    assert (H.loc[dark, "P_comp"] == 0).all()


def test_batch_cooling_time_is_recorded(run):
    *_, H, tot, end, bt = run
    assert bt.cool_h.notna().mean() > 0.9
    assert (bt.cool_h.dropna() > 3).all()                  # 200 kg cannot cool in less than 3 h


def test_summary_marks_tomorrow_as_prediction():
    s = json.loads((ROOT / "results/live/summary.json").read_text())
    assert "PREDICTION" in s["prediction_label"] and "Open-Meteo" in s["prediction_label"]
    assert "not measured" in s["prediction_label"] and "not AI" in s["prediction_label"]
    d = s["designs"]["current"]["daily"]
    status = dict(zip(d["index"], [r[d["columns"].index("status")] for r in d["data"]]))
    assert status[s["tomorrow"]] == "prediction" and status[s["today"]] == "today"
    assert s["credit"] == "Weather data by Open-Meteo.com"
    js = (ROOT / "web/live/live.js").read_text()
    assert "PREDICTION" in js and "Open-Meteo" in (ROOT / "web/live.html").read_text()


def test_hours_after_now_are_flagged_as_forecast():
    w = LW.load_actual()
    now = pd.Timestamp(LW.now_ist().replace(minute=0, second=0, microsecond=0))
    assert w.loc[w.time_ist >= now, "is_forecast"].all()
    assert not w.loc[w.time_ist < now, "is_forecast"].any()


def test_sunlight_lines_up_with_the_sun():
    from twin.suncheck import clear_offset_min
    w = LW.load_actual()
    assert abs(clear_offset_min(w[~w.is_forecast])) < 10
    if (LW.ISHRAE_DIR / LW.EPW_NAME).exists():
        assert abs(clear_offset_min(LW.load_ishrae())) < 10


def test_failed_download_keeps_the_saved_files(monkeypatch, tmp_path):
    """Offline: every download fails, nothing saved is lost, the error is recorded."""
    before = {p.name: p.stat().st_mtime for p in LW.LIVE.glob("*.csv")}
    meta_before = (LW.LIVE / "weather_meta.json").read_text()

    def boom(*a, **k):
        raise OSError("no internet")
    monkeypatch.setattr(LW, "_get_json", boom)
    monkeypatch.setattr(LW, "fetch_ishrae", boom)
    try:
        meta = LW.update(verbose=False)
        assert "archive" in meta["errors"] and "forecast" in meta["errors"]
        assert {p.name: p.stat().st_mtime for p in LW.LIVE.glob("*.csv")} == before
        assert len(LW.load_actual()) > 1000                  # still works from the saved files
    finally:
        (LW.LIVE / "weather_meta.json").write_text(meta_before)


def test_ishrae_weather_is_never_committed():
    r = subprocess.run(["git", "check-ignore", "-q", "data/live/ishrae/x.epw"], cwd=ROOT)
    assert r.returncode == 0
    tracked = subprocess.run(["git", "ls-files", "data/live"], cwd=ROOT, capture_output=True, text=True).stdout
    assert ".epw" not in tracked


def test_money_inputs_add_up():
    s = json.loads((ROOT / "results/live/summary.json").read_text())
    m = s["money"]
    total = sum(map(sum, m["gridonly_kWh_by_hour"]))
    assert total == pytest.approx(s["grid_only"]["totals"]["comp_kWh"], rel=0.002)
    assert len(m["days"]) == s["designs"]["current"]["totals"]["days"]
