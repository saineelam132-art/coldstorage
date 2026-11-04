"""The static backup (no Python) must show the same numbers as the live server."""
import json
import shutil
import subprocess
from pathlib import Path

import pytest

from server.twin_state import TwinState

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "static_site" / "js" / "data.js"


@pytest.mark.skipif(not DATA.exists() or not shutil.which("node"), reason="static_site not built or node missing")
def test_static_backup_matches_server(tmp_path):
    tw = TwinState()
    data_js = DATA.read_text(encoding="utf-8")
    windows = json.loads(data_js[data_js.index("{"):data_js.rindex("}") + 1])["windows"]
    times = [w[0] + k * 3600 + 120 for w in windows for k in (7, 13, 22)]
    api = (ROOT / "web/js/static_api.js").as_uri()
    script = tmp_path / "check.mjs"
    script.write_text(f"""
import fs from 'fs';
const store = {{}};
globalThis.localStorage = {{ getItem: k => store[k] ?? null, setItem: (k, v) => (store[k] = v), removeItem: k => delete store[k] }};
globalThis.window = globalThis;
new Function(fs.readFileSync({json.dumps(str(DATA))}, 'utf8'))();
const {{ get }} = await import({json.dumps(api)});
const out = [];
for (const t of {json.dumps(times)}) {{ const s = await get(`api/state?t=${{t}}&curtain=1`); out.push(s.values); }}
console.log(JSON.stringify(out));
""")
    res = subprocess.run(["node", str(script)], capture_output=True, text=True, timeout=120)
    assert res.returncode == 0, res.stderr
    static_vals = json.loads(res.stdout)
    for t, sv in zip(times, static_vals):
        v = tw.state(t, curtain=True)["values"]
        for k in ("T_out", "T_room", "pcm_pct", "P_pv", "Q_total", "cop", "heat_if_open_kW", "backup_h"):
            assert sv[k] == pytest.approx(v[k], rel=2e-3, abs=2e-3), (t, k)
        assert sv["grid_on"] == v["grid_on"]
