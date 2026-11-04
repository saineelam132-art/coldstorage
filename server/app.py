"""ColdTrust Twin web server (FastAPI).

    python run.py          then open http://localhost:8000

Serves the website in web/ and these JSON APIs:
    /api/config      design values + 3D geometry (from config/design.json)
    /api/sensors     sensor list (config/sensors.json)
    /api/state?t=    every sensor value at simulated time t (seconds from 1 Jan 00:00)
    /api/series?q=&t=&hours=   history of one value (for small graphs)
    /api/demo_days   interesting moments of the simulated year
"""
from pathlib import Path

from fastapi import Body, FastAPI, HTTPException, Query
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from server.ledger_service import lan_ip
from server.twin_state import TwinState, _strip, geometry

ROOT = Path(__file__).resolve().parent.parent
app = FastAPI(title="ColdTrust Twin")
TWIN = None


def twin():
    global TWIN
    if TWIN is None:
        TWIN = TwinState()
    return TWIN


@app.on_event("startup")
def _startup():
    twin()


@app.get("/api/config")
def api_config():
    tw = twin()
    return {"design": _strip(tw.cfg), "geometry": geometry(tw.cfg), "lan_ip": lan_ip(), "crops": {
        k: {"label": v["label"], "T_opt": [v["T_opt_low_C"], v["T_opt_high_C"]], "T_ref_C": v["T_ref_C"],
            "SL_ref_days": v["SL_ref_days"], "Q10": v["Q10"], "chill_injury_below_C": v.get("chill_injury_below_C")}
        for k, v in tw.crops.items()},
        "year_summary": {
        k: v for k, v in tw.summary.items() if isinstance(v, (int, float, str, bool))}}


@app.get("/api/sensors")
def api_sensors():
    return twin().sensors


@app.get("/api/state")
def api_state(t: float = 0.0, curtain: int = Query(-1)):
    return twin().state(t, None if curtain < 0 else bool(curtain))


@app.get("/api/series")
def api_series(q: str, t: float, hours: float = 24.0):
    return twin().series(q, t, hours)


@app.get("/api/cycle")
def api_cycle(t: float = 0.0):
    return twin().cycle(t)


@app.get("/api/slab")
def api_slab():
    return twin().slab()


@app.get("/api/crop")
def api_crop(key: str, t: float = 0.0, days: float = 2.0):
    return twin().crop(key, t, days)


# ------------------------------------------------------------ batches + ledger
@app.post("/api/batch")
def api_new_batch(data: dict = Body(...)):
    tw = twin()
    t = float(data.get("t", 0))
    tw.ledger.advance(t)
    try:
        b = tw.ledger.new_batch(t, str(data.get("farmer", "")), str(data.get("crop", "")), float(data.get("weight_kg", 0)))
    except ValueError as e:
        raise HTTPException(400, str(e))
    return b


@app.get("/api/batches")
def api_batches():
    return list(twin().ledger.batches.values())


@app.get("/api/batch/{bid}")
def api_batch(bid: str, t: float = -1):
    tw = twin()
    t = t if t >= 0 else (tw.ledger.last_hour or 0) * 3600.0
    v = tw.ledger.batch_view(bid, t)
    if v is None:
        raise HTTPException(404, "batch not found")
    return v


@app.get("/api/ledger")
def api_ledger(last: int = 40):
    return twin().ledger.ledger(last)


@app.post("/api/ledger/tamper")
def api_tamper():
    return twin().ledger.tamper() or {"error": "ledger too short"}


@app.post("/api/ledger/reset")
def api_reset():
    twin().ledger.chain.reset_tamper()
    return {"ok": True}


@app.post("/api/fault")
def api_fault(data: dict = Body(...)):
    tw = twin()
    if data.get("clear"):
        tw.ledger.clear_fault()
        return {"fault": None}
    return {"fault": tw.ledger.inject_fault(float(data.get("t", 0)), float(data.get("offset", 3.0)))}


# ------------------------------------------------------------ Live Year Run
LIVE_KEYS = {"compressor_max_kW", "produce_kg", "setpoint_C", "swap_hour", "cooled_within_K", "natural_convection_h_W_m2K"}


@app.get("/api/live/config")
def api_live_config():
    from engine.config import load_config
    return load_config()["live_run"]


@app.post("/api/live/config")
def api_live_config_save(data: dict = Body(...)):
    """Save edited fixed inputs into config/design.json -> live_run and re-run the twin (offline)."""
    import json as _json
    import re
    path = ROOT / "config" / "design.json"
    text = path.read_text(encoding="utf-8")
    for k, v in data.items():
        if k not in LIVE_KEYS:
            raise HTTPException(400, f"{k} cannot be edited here")
        v = float(v)
        if k == "swap_hour":
            v = int(v)
        # replace the value inside the live_run block only, keeping the file's comments and layout
        start = text.index('"live_run"')
        m = re.compile(rf'("{k}":\s*)([-0-9.]+)').search(text, start)
        if not m:
            raise HTTPException(400, f"{k} not found")
        text = text[:m.start(2)] + _json.dumps(v) + text[m.end(2):]
    _json.loads(text)
    path.write_text(text, encoding="utf-8")
    from twin import live_run
    live_run.run(fetch=False)
    return {"ok": True}


def _live_refresh_loop():
    """While the server runs: refresh the weather and the Live Year Run every hour if online."""
    import time
    from twin import live_run
    while True:
        try:
            live_run.run(fetch=True)
        except Exception as e:  # noqa: BLE001 - offline is fine: the saved data keeps working
            print("live refresh skipped:", e)
        time.sleep(3600)


@app.on_event("startup")
def _start_live_refresh():
    import os
    import threading
    if os.environ.get("COLDTRUST_NO_LIVE_REFRESH") != "1":
        threading.Thread(target=_live_refresh_loop, daemon=True).start()


@app.get("/api/demo_days")
def api_demo_days():
    return twin().demo_days()


@app.get("/api/health")
def health():
    return JSONResponse({"ok": True})


for _d in ("results", "figures"):
    (ROOT / _d).mkdir(exist_ok=True)
app.mount("/results", StaticFiles(directory=ROOT / "results"), name="results")
app.mount("/figures", StaticFiles(directory=ROOT / "figures"), name="figures")
app.mount("/", StaticFiles(directory=ROOT / "web", html=True), name="web")
