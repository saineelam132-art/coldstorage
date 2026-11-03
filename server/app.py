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

from fastapi import FastAPI, Query
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

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
    return {"design": _strip(tw.cfg), "geometry": geometry(tw.cfg), "year_summary": {
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


@app.get("/api/demo_days")
def api_demo_days():
    return twin().demo_days()


@app.get("/api/health")
def health():
    return JSONResponse({"ok": True})


app.mount("/", StaticFiles(directory=ROOT / "web", html=True), name="web")
