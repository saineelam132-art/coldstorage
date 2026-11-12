"""Firebase Hosting config (front end = static_site/) and the backend CORS allow-list."""
import json
from pathlib import Path

from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parent.parent


def test_firebase_serves_the_static_folder_on_site_koolkisan():
    h = json.loads((ROOT / "firebase.json").read_text(encoding="utf-8"))["hosting"]
    assert h["public"] == "static_site" and h["site"] == "koolkisan"
    assert (ROOT / "static_site" / "index.html").exists() and (ROOT / "static_site" / "trust.html").exists()
    assert "rewrites" not in h            # several real pages, not a one-page app


def test_no_licensed_weather_files_in_the_public_folder():
    assert not list((ROOT / "static_site").rglob("*.epw"))
    assert not (ROOT / "static_site" / "data" / "live" / "ishrae").exists()


def test_cors_allows_firebase_and_blocks_others():
    from server import app as A
    c = TestClient(A.app)
    ok = c.options("/api/trust/info", headers={"Origin": "https://koolkisan.web.app", "Access-Control-Request-Method": "GET"})
    assert ok.headers.get("access-control-allow-origin") == "https://koolkisan.web.app"
    bad = c.options("/api/trust/info", headers={"Origin": "https://evil.example", "Access-Control-Request-Method": "GET"})
    assert "access-control-allow-origin" not in bad.headers


def test_extra_origins_from_environment(monkeypatch):
    from server import app as A
    monkeypatch.setenv("KOOLKISAAN_CORS_ORIGINS", "https://my-backup.vercel.app/, https://x.example")
    o = A.cors_origins()
    assert "https://koolkisan.web.app" in o and "https://my-backup.vercel.app" in o
