"""Shared, saved data (web/kk/kkstore.js) and the judge demo flow in a real browser.

Offline demo: always (needs node + playwright). Live Firestore: only when a Firestore + Auth emulator is running on
127.0.0.1:8080 / 9099 (firebase emulators:start --only firestore,auth --project demo-koolkisan), so the security rules
(firestore.rules) are tested for real.
"""
import functools
import http.server
import json
import shutil
import socket
import socketserver
import subprocess
import threading
import urllib.request
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / "static_site"
EMU = "&emu=127.0.0.1:8080&authemu=127.0.0.1:9099"


def node_playwright():
    node = shutil.which("node")
    if not node or subprocess.run([node, "-e", "require('playwright')"], capture_output=True).returncode != 0:
        return None
    return node


@pytest.fixture(scope="module")
def server():
    if not (SITE / "trust.html").exists():
        pytest.skip("static_site not built")
    h = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(SITE))
    h.log_message = lambda *a: None
    srv = socketserver.TCPServer(("127.0.0.1", 0), h)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    yield f"http://127.0.0.1:{srv.server_address[1]}/"
    srv.shutdown()


def run(script, *args):
    node = node_playwright()
    if not node:
        pytest.skip("node + playwright not available")
    r = subprocess.run([node, str(ROOT / "tests" / "e2e" / script), *args], capture_output=True, text=True, timeout=400)
    assert r.returncode == 0, r.stderr[-2000:]
    return json.loads(r.stdout.strip().splitlines()[-1])


def emulator_up():
    try:
        for port in (8080, 9099):
            socket.create_connection(("127.0.0.1", port), timeout=1).close()
        return True
    except OSError:
        return False


def clear_emulator():
    for url in ("http://127.0.0.1:8080/emulator/v1/projects/demo-koolkisan/databases/(default)/documents",
                "http://127.0.0.1:9099/emulator/v1/projects/demo-koolkisan/accounts"):
        urllib.request.urlopen(urllib.request.Request(url, method="DELETE"), timeout=5)


def check_flow(o, mode):
    assert o["mode"] == mode
    assert o["checkin"].startswith("✔ Checked in")
    assert o["tileBefore"] == "cell" and "alerted" in o["tileAfter"] and "SENSOR SUSPICIOUS" in o["tileText"]
    assert o["alerts"] and min(a["minutes"] for a in o["alerts"]) <= 30
    assert "Payment on hold" in o["alertPage"] or "tampered" in o["alertPage"]
    assert "ON HOLD" in o["buyer"]
    assert o["checkout"].startswith("✔ 15 kg") and o["storedAfter"] == 25
    assert "at most 25 kg" in o["overdraw"]
    assert o["afterVoid"] == {"stored": 0, "status": "void"}
    assert o["afterReload"]["batches"] == 1 and o["afterReload"]["alerts"] >= 1
    assert o["errs"] == []


def test_offline_demo_judge_flow(server):
    check_flow(run("judge_flow.js", server, "&offline=1"), "offline")


@pytest.mark.skipif(not emulator_up(), reason="Firestore/Auth emulator not running")
def test_live_judge_flow_on_emulator(server):
    clear_emulator()
    check_flow(run("judge_flow.js", server, EMU), "live")


@pytest.mark.skipif(not emulator_up(), reason="Firestore/Auth emulator not running")
def test_live_sync_and_security_rules(server):
    clear_emulator()
    o = run("live_rules.js", server, EMU)
    assert o["ownerAdmin"] is True and o["phoneAdmin"] is False
    assert o["syncMs"] < 5000 and o["phoneStep"] == o["ownerStep"]
    r = o["rules"]
    assert r["editBlock"].startswith("REFUSED")
    for k in ("overwriteBlock", "makeAdmin", "overfill", "voidAsFarmer", "resetAsFarmer", "fakeAlert"):
        assert r[k] == "refused", (k, r)
    assert r["checkoutOwnBatch"] == "ACCEPTED" and o["ownerSeesCheckout"] == 35
    assert o["phoneReset"] == "refused"                                   # only the owner can reset the demo
    assert o["afterReset"] == {"epoch": 2, "batches": 0, "stored": 0}      # everybody sees a fresh demo round
    assert o["oldBlocksKept"] > 0                                          # ... and the old ledger is still there
