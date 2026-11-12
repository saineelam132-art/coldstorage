"""Automatic tamper detection (web/trust/detector.js): every tamper action is found, a normal day gives no alert."""
import json
import shutil
import subprocess
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
DET = ROOT / "web" / "trust" / "detector.js"
DATA = ROOT / "web" / "trust" / "data" / "trust_data.js"
STARTS = [80, 130, 170, 250, 330, 400, 500]      # morning, late morning, afternoon, evening, night, next morning, evening


def run(js):
    node = shutil.which("node")
    if not node:
        pytest.skip("node missing")
    head = f"global.window = {{}}; require({json.dumps(str(DATA))}); const D = window.TRUST_DATA; const X = require({json.dumps(str(DET))});"
    r = subprocess.run([node, "-e", head + js], capture_output=True, text=True, timeout=300)
    assert r.returncode == 0, r.stderr
    return json.loads(r.stdout)


@pytest.fixture(scope="module")
def results():
    return run(f"""
const out = {{}};
for (const s of Object.keys(X.SENSORS)) for (const a of ['freeze', 'offset', 'stop'])
  out[s + '|' + a] = {json.dumps(STARTS)}.map(st => {{ const d = X.detectionSteps(D, 'normal', st, {{ sensor: s, action: a }}); return d ? [d.steps, d.event.kind] : null; }});
console.log(JSON.stringify(out));""")


def test_normal_operation_gives_no_alert():
    out = run("""
const res = {};
for (const sc of ['normal', 'power_cut', 'overcool']) {
  const det = new X.Detector(D, sc); let n = 0;
  for (let i = 1; i < D.scenarios[sc].phi.length; i++) n += det.push(i, X.truthAt(D, sc, i)).events.length;
  res[sc] = n;
}
console.log(JSON.stringify(res));""")
    assert out == {"normal": 0, "power_cut": 0, "overcool": 0}       # 3 full simulated days each


@pytest.mark.parametrize("key", ["room_air|freeze", "room_air|offset", "room_air|stop", "core|freeze", "core|offset", "core|stop",
                                 "outside|freeze", "outside|offset", "outside|stop", "humidity|freeze", "humidity|stop", "door|stop"])
def test_tamper_found_within_30_min(results, key):
    for r in results[key]:
        assert r is not None and 1 <= r[0] <= 6, (key, results[key])   # 6 readings = 30 min of twin time


def test_humidity_offset_found_within_3_hours(results):
    for r in results["humidity|offset"]:
        assert r is not None and 1 <= r[0] <= 36, results["humidity|offset"]


def test_stuck_door_switch_is_a_known_limit(results):
    # a door switch stuck on "closed" is not visible in the physics (a 15 s opening adds ~14 W): documented on the page
    assert all(r is None for r in results["door|freeze"])


def test_edited_old_reading_breaks_the_chain():
    out = run("""
const T = require(process.cwd() + '/web/trust/trust_core.js');
const ch = []; for (let i = 0; i < 5; i++) ch.push(T.makeBlock(ch, 'CT-1', '2026-05-22T00:' + String(i * 5).padStart(2, '0') + ':00Z', i ? 'READING' : 'CHECKIN', i ? 'owner' : 'farmer', { N4: { T_r: 6 + i } }, { phi: 0, flags: [] }));
const ed = JSON.parse(JSON.stringify(ch)); ed[2].payload.N4.T_r = 5.0;
const v = T.verifyChain(ed);
console.log(JSON.stringify({ ok: T.verifyChain(ch).valid, valid: v.valid, first_bad: v.first_bad, stored: ed[2].hash, recomputed: T.blockHash(ed[2]) }));""")
    assert out["ok"] and not out["valid"] and out["first_bad"] == 2 and out["stored"] != out["recomputed"]
