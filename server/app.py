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
