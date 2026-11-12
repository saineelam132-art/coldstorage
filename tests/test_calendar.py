"""Calendar / time picker: any day of 2026 can be shown, offline too (days rebuilt from the hourly Live Year Run)."""
import json
import shutil
import subprocess
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "static_site" / "js" / "data.js"
SITE = ROOT / "static_site" / "index.html"
need_node = pytest.mark.skipif(not DATA.exists() or not shutil.which("node"), reason="static_site not built or node missing")


@pytest.fixture(scope="module")
def tw():
    from server.twin_state import TwinState
    return TwinState()


def test_server_day_series_covers_the_whole_day(tw):
    t = 141 * 86400 + 14 * 3600 + 600
    s = tw.series("T_room", t, day=True)
    assert len(s["t"]) == 96 and s["t"][0] == "00:00" and s["t"][-1] == "23:45"
    assert s["t"][s["mark"]] == "14:00"


def test_quick_links_exist(tw):
    keys = {d["key"] for d in tw.demo_days()}
    assert {"hot_day", "hot_night", "grid_day", "monsoon_day"} <= keys


def node_states(times, tmp_path):
    months = sorted(p.name for p in (ROOT / "static_site/live/data").glob("h_current_*.js"))
    js = tmp_path / "s.mjs"
    js.write_text(f"""
import fs from 'fs';
const store = {{}};
globalThis.localStorage = {{ getItem: k => store[k] ?? null, setItem: (k, v) => (store[k] = v), removeItem: k => delete store[k] }};
globalThis.window = globalThis;
new Function(fs.readFileSync({json.dumps(str(DATA))}, 'utf8'))();
for (const m of {json.dumps(months)}) new Function(fs.readFileSync({json.dumps(str(ROOT / 'static_site/live/data'))} + '/' + m, 'utf8'))();
const A = await import({json.dumps((ROOT / 'web/js/static_api.js').as_uri())});
const out = [];
for (const t of {json.dumps(times)}) {{ const s = await A.get(`api/state?t=${{t}}&curtain=1`); out.push([s.t, s.time, s.values]); }}
out.push(A.canShow(-1), A.canShow(100000));
console.log(JSON.stringify(out));
""")
    r = subprocess.run(["node", str(js)], capture_output=True, text=True, timeout=120)
    assert r.returncode == 0, r.stderr
    return json.loads(r.stdout)


@need_node
def test_picked_day_loads_that_days_rows_offline(tw, tmp_path):
    """A day with no saved 5-min steps is rebuilt from the hourly Live Year Run: same day, close to the server."""
    times = [d * 86400 + h * 3600 + 120 for d in (10, 100, 200, 290) for h in (3, 10, 14, 21)]
    out = node_states(times, tmp_path)
    no_before, no_after = out[-2:]
    assert no_before is False and no_after is False             # days outside the data cannot be shown
    for t, (ts, when, v) in zip(times, out[:-2]):
        w = tw.state(t, curtain=True)
        assert ts == pytest.approx(t, abs=1) and when[:13] == w["time"][:13]
        assert v["T_out"] == pytest.approx(w["values"]["T_out"], abs=0.05)
        assert v["P_pv"] == pytest.approx(w["values"]["P_pv"], abs=0.01)
        assert v["grid_on"] == w["values"]["grid_on"]
        assert v["T_room"] == pytest.approx(w["values"]["T_room"], abs=1.0)
        assert v["pcm_pct"] == pytest.approx(w["values"]["pcm_pct"], abs=5.0)


def browser_check(script, tmp_path):
    node = shutil.which("node")
    probe = subprocess.run([node, "-e", "require('playwright')"], capture_output=True, text=True) if node else None
    if not node or not SITE.exists() or probe.returncode != 0:
        pytest.skip("node + playwright not available")
    f = tmp_path / "b.js"
    f.write_text(script)
    r = subprocess.run([node, str(f)], capture_output=True, text=True, timeout=240)
    assert r.returncode == 0, r.stderr + r.stdout
    return json.loads(r.stdout.strip().splitlines()[-1])


def test_browser_t_link_calendar_grey_days_and_now(tmp_path):
    url = SITE.as_uri()
    res = browser_check(f"""
const {{ chromium }} = require('playwright');
(async () => {{
  const b = await chromium.launch(); const p = await b.newPage({{ viewport: {{ width: 1366, height: 820 }} }});
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('{url}?t=2026-05-23T14:00'); await p.waitForFunction(() => window.__kk, null, {{ timeout: 60000 }}); await p.waitForTimeout(1500);
  const r = {{ link: await p.textContent('#d_clock'), url: p.url() }};
  await p.click('#calBtn'); await p.keyboard.press('PageUp'); await p.waitForTimeout(200);
  await p.click('.cday[data-date="2026-04-10"]'); await p.waitForTimeout(1500);
  r.pick = await p.textContent('#d_clock'); r.pickTime = await p.evaluate(() => window.__kk.feed.state.time);
  await p.click('#calBtn');
  // the first day after the data (tomorrow + 1) is grey; it may be in the next month
  const greyDate = await p.evaluate(() => {{
    const n = window.__kk.nav, c0 = n.ctx(), last = c0.forecastDay ?? Math.min(c0.todayDay, c0.lastDataDay), tb = window.__kk.tb;
    let g = last + 1;
    if (tb.date(g * 86400).getUTCMonth() !== tb.date(last * 86400).getUTCMonth()) {{   // month end: pretend the data ends 2 days earlier
      n.ctx = () => ({{ ...c0, lastDataDay: last - 2, todayDay: Math.min(c0.todayDay, last - 2), forecastDay: null }}); g = last - 1;
    }}
    n.focusDay = g - 1; n.render(true); return tb.dateStr(g); }});
  await p.waitForTimeout(200);
  const before = await p.evaluate(() => window.__kk.clock.t);
  const grey = await p.$(`.cday[data-date="${{greyDate}}"]`);
  r.greyDisabled = grey ? await grey.getAttribute('aria-disabled') : 'missing';
  if (grey) await grey.click({{ force: true }});
  await p.waitForTimeout(400);
  r.greyMoved = Math.abs((await p.evaluate(() => window.__kk.clock.t)) - before) > 600;
  await p.keyboard.press('Escape');
  await p.click('#liveNow'); await p.waitForTimeout(1500);
  const nowT = (Date.now() + 5.5 * 3600e3 - Date.parse('2026-01-01T00:00:00Z')) / 1000;
  r.nowDiff = Math.abs((await p.evaluate(() => window.__kk.clock.t)) - nowT);
  r.nowUrl = p.url(); r.errs = errs;
  console.log(JSON.stringify(r)); await b.close();
}})();
""", tmp_path)
    assert res["link"].startswith("23 May 14:0"), res
    assert "t=2026-05-23T14:00" in res["url"]
    assert res["pick"].startswith("10 Apr 14:0") and res["pickTime"].startswith("2026-04-10 14:0")
    assert res["greyDisabled"] == "true" and res["greyMoved"] is False
    assert res["nowDiff"] < 120 and "t=" not in res["nowUrl"]
    assert res["errs"] == []
