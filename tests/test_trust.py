"""Trust & Trade: freshness model, per-slip hash chain + HMAC, physics check Φ, Python/JavaScript parity."""
import json
import math
import shutil
import subprocess
from pathlib import Path

import numpy as np
import pytest

from engine import physics_check as PC
from engine import shelf_life as SL
from engine import trust_ledger as TL
from engine.config import load_config, load_crops

ROOT = Path(__file__).resolve().parent.parent
CORE = ROOT / "web" / "trust" / "trust_core.js"
DATA = ROOT / "web" / "trust" / "data" / "trust_data.js"


@pytest.fixture(scope="module")
def crop():
    return load_crops()["pomegranate"]


# ---------------------------------------------------------------- freshness (Part 4)
def test_rate_is_one_at_the_best_temperature(crop):
    assert SL.rate_k(crop, crop["freshness"]["T_opt_C"]) == pytest.approx(1.0)


def test_rate_doubles_every_10_over_log2_Q10_kelvin(crop):
    d = 10.0 / math.log2(crop["Q10"])
    T = crop["freshness"]["T_opt_C"] + 1.0
    assert SL.rate_k(crop, T + d) / SL.rate_k(crop, T) == pytest.approx(2.0)


def test_chilling_makes_cold_worse_than_best(crop):
    assert SL.rate_k(crop, 2.0) > 1.0 and SL.rate_k(crop, 2.0) > SL.rate_k(crop, 8.0)


def test_no_water_loss_in_saturated_air(crop):
    assert SL.water_loss_rate(crop, 5.0, 100.0, 1.0) == 0.0
    assert SL.water_loss_rate(crop, 5.0, 80.0, 1.0) > SL.water_loss_rate(crop, 5.0, 90.0, 1.0) > 0


def test_freshness_is_100_at_the_start(crop):
    assert SL.Freshness(crop).value == pytest.approx(100.0)


def test_freezing_for_more_than_30_min_caps_freshness(crop):
    f = SL.Freshness(crop)
    for _ in range(7):                       # 7 × 5 min = 35 min below the freezing point
        f.step(-4.0, 90, 1.0, 5 / 60, T_core=-4.0)
    assert f.damaged and f.value <= crop["freshness"]["damaged_freshness_pct"]


def test_old_shelf_life_functions_still_there(crop):
    assert callable(SL.assess) and SL.rate_per_day(crop, crop["T_ref_C"]) > 0


# ---------------------------------------------------------------- ledger
def chain(n=5, flags=False):
    c = TL.BatchChain("CT-260522-001")
    c.append("2026-05-22T00:30:00Z", "CHECKIN", "farmer", {"farmer": "A", "kg": 40, "basePrice_INR_kg": 120})
    for k in range(1, n):
        ph = {"phi": 3.5, "flags": [{"type": "PHYSICS", "reason": "test"}]} if flags and k == 3 else None
        c.append(f"2026-05-22T00:{30 + 5 * k:02d}:00Z", "READING", "owner", {"N4": {"T_r": 5.0 + 0.1 * k}}, ph)
    return c


def test_intact_chain_pays():
    v = TL.verify_chain(chain().blocks)
    assert v["valid"] and not v["gaps"] and TL.payment_status(v) == "OK"


def test_tampered_chain_freezes_payment_and_names_custody():
    c = chain()
    c.blocks[2]["payload"]["N4"]["T_r"] = 4.0            # edit an old reading
    v = TL.verify_chain(c.blocks)
    assert not v["valid"] and v["first_bad"] == 2 and v["custody_at_break"] == "owner"
    assert TL.payment_status(v) == "FROZEN"


def test_physics_flag_puts_payment_on_hold():
    v = TL.verify_chain(chain(flags=True).blocks)
    assert v["valid"] and TL.payment_status(v) == "ON_HOLD"


def test_reading_gap_is_found():
    c = chain(4)
    c.append("2026-05-22T01:30:00Z", "READING", "owner", {"N4": {"T_r": 5.0}})
    assert TL.verify_chain(c.blocks)["gaps"]


def test_hmac_rejects_a_changed_bay():
    qr = {"slipId": "CT-1", "bay": "B2", "genesisHash": "a" * 64}
    qr["sig"] = TL.sign(qr["slipId"], qr["bay"], qr["genesisHash"], key="k")
    assert TL.verify_sig(qr, key="k")
    assert not TL.verify_sig({**qr, "bay": "B1"}, key="k")


def test_daily_anchor_changes_if_a_day_is_rewritten():
    c = chain()
    a = TL.daily_anchor("2026-05-22", TL.day_heads(c.blocks))
    c.blocks[-1]["payload"]["N4"]["T_r"] = 9.9
    c.blocks[-1]["hash"] = TL.block_hash(c.blocks[-1])       # re-hashed by a cheater
    assert TL.verify_chain(c.blocks)["valid"]
    assert TL.daily_anchor("2026-05-22", TL.day_heads(c.blocks)) != a


# ---------------------------------------------------------------- Φ (Part 3)
@pytest.fixture(scope="module")
def year():
    from twin import trust_nodes as TN
    stats, sigma, cfg, const = TN.year_study()
    return stats, sigma, cfg, const


def test_normal_year_has_few_false_flags(year):
    stats = year[0]
    assert stats["false_flags_per_year"] < 12


def test_fake_readings_are_flagged_within_6_steps(year):
    stats = year[0]
    for k in ("fake_detection_day_07_17", "fake_detection_night"):
        assert stats[k]["caught_pct"] > 95
        assert stats[k]["median_min"] <= 30


def test_fake_demo_on_the_scenario_window_is_caught_within_6_steps(year):
    from twin import trust_nodes as TN
    _, sigma, cfg, const = year
    w = TN.study_weather()
    from twin.live_sim import simulate_live
    _, T, _, _ = simulate_live(w.iloc[3000:3072].reset_index(drop=True), "current", cfg=cfg, crop_key="pomegranate", steps=True)
    S = T["steps"]
    S["ps_Pa"] = np.repeat(w["ps_Pa"].values[3000:3072], 12)
    R = TN.add_noise(TN.truth_nodes(S, cfg), cfg)
    for start in (300, 500, 700):                   # morning, night, afternoon-ish
        d = TN.detection_steps(R, cfg, const, sigma, start)
        assert d is not None and d <= 6, (start, d)


def test_impossible_humidity_gives_high_phi(year):
    _, sigma, cfg, _ = year
    res = {k: np.zeros(4) for k in ("r1", "r2", "r3", "r4")}
    res["impossible"] = np.array([False, True, True, True])
    res["coil_on"] = np.ones(4, bool)
    phi, _ = PC.phi_from(res, sigma)
    assert phi[0] == 0 and phi[1] >= 3


def test_scenario_hooks_change_the_twin_only_when_asked():
    from twin import trust_nodes as TN
    from twin.live_sim import simulate_live
    cfg = load_config()
    w = TN.study_weather().iloc[3000:3048].reset_index(drop=True)
    a = simulate_live(w, "current", cfg=cfg, steps=True)[1]["steps"]
    b = simulate_live(w, "current", cfg=cfg, steps=True, scenario=None)[1]["steps"]
    c = simulate_live(w, "current", cfg=cfg, steps=True, scenario={"door_leak": 0.06, "from_step": 0})[1]["steps"]
    assert np.allclose(a["T_room"], b["T_room"])
    assert c["Q_door"].sum() > a["Q_door"].sum()


# ---------------------------------------------------------------- server keeps the key
def test_server_signs_and_verifies(monkeypatch):
    from fastapi.testclient import TestClient
    from server import app as A
    monkeypatch.setenv("KOOLKISAAN_HMAC_KEY", "test-key-only")
    c = TestClient(A.app)
    body = {"slipId": "CT-260522-001", "bay": "B3", "genesisHash": "b" * 64}
    sig = c.post("/api/trust/sign", json=body).json()["sig"]
    assert sig == TL.sign(body["slipId"], body["bay"], body["genesisHash"], key="test-key-only")
    assert c.post("/api/trust/verify", json={**body, "sig": sig}).json()["valid"]
    assert not c.post("/api/trust/verify", json={**body, "bay": "B1", "sig": sig}).json()["valid"]
    info = c.get("/api/trust/info").json()
    assert info["key_from_env"] and "test-key-only" not in json.dumps(info)


def test_no_secret_key_in_committed_config():
    txt = (ROOT / "config" / "design.json").read_text(encoding="utf-8")
    assert "KOOLKISAAN_HMAC_KEY" not in txt


# ---------------------------------------------------------------- Python <-> JavaScript parity
def run_node(code):
    node = shutil.which("node")
    if not node:
        pytest.skip("node not installed")
    out = subprocess.run([node, "-e", code], capture_output=True, text=True, timeout=120)
    assert out.returncode == 0, out.stderr
    return out.stdout


def test_js_verifies_python_chain_and_hmac(tmp_path):
    c = chain(6)
    sig = TL.sign("CT-260522-001", "B2", c.blocks[0]["hash"], key="k3y")
    f = tmp_path / "c.json"
    f.write_text(json.dumps({"blocks": c.blocks, "sig": sig}, ensure_ascii=False), encoding="utf-8")
    out = run_node(f"const T=require({json.dumps(str(CORE))});const d=require({json.dumps(str(f))});"
                   "const ok=T.verifyChain(d.blocks).valid && T.sign('k3y','CT-260522-001','B2',d.blocks[0].hash)===d.sig;"
                   "const ch=[];for(const b of d.blocks)ch.push(T.makeBlock(ch,b.slipId,b.ts,b.type,b.actor,b.payload,b.physics));"
                   "console.log(ok && ch.every((b,i)=>b.hash===d.blocks[i].hash)?'SAME':'DIFF')")
    assert "SAME" in out


def test_js_phi_and_freshness_match_python():
    txt = DATA.read_text(encoding="utf-8")
    data = json.loads(txt[txt.index("{"):txt.rstrip().rstrip(";").rindex("}") + 1])
    s = data["scenarios"]["door_seal"]
    out = run_node(
        f"global.window={{}};require({json.dumps(str(DATA))});const T=require({json.dumps(str(CORE))});const D=window.TRUST_DATA;"
        "const s=D.scenarios.door_seal,P=D.trust_cfg.phi;"
        "const d={T_s:s.N1.T_s,RH_s:s.N1.RH_s,v_s:s.N1.v_s,T_core:s.N2.T_core,Q_door_kW:s.N3.Q_door_kW,T_r:s.N4.T_r,RH_r:s.N4.RH_r,"
        "T_out:s.out.T_out,p_hPa:s.out.p_hPa,...s.ctl};"
        "const r=T.phiFrom(T.residuals(d,D.const),D.sigma,P.weights,P.window_steps);"
        "const F=new T.Freshness(D.crop);F.step(12,80,1,3,12);F.step(2,90,0.5,5,2);"
        "console.log(JSON.stringify({phi:Array.from(r.phi),flags:T.phiFlags(r.phi,P.red_at,P.red_steps),F:F.value}))")
    js = json.loads(out)
    # same inputs (the exported, rounded node values) through the Python code
    d = {"T_s": s["N1"]["T_s"], "RH_s": s["N1"]["RH_s"], "v_s": s["N1"]["v_s"], "T_core": s["N2"]["T_core"],
         "Q_door_kW": s["N3"]["Q_door_kW"], "T_r": s["N4"]["T_r"], "RH_r": s["N4"]["RH_r"], "T_out": s["out"]["T_out"],
         "p_hPa": s["out"]["p_hPa"], **{k: v for k, v in s["ctl"].items()}, **data["const"]}
    cfg = load_config()
    p = cfg["trust"]["phi"]
    phi, _ = PC.phi_from(PC.residuals(d, cfg), data["sigma"], p["weights"], p["window_steps"])
    assert np.allclose(js["phi"], phi, atol=1e-9)
    assert js["flags"] == PC.phi_flags(phi, p["red_at"], p["red_steps"])
    f = SL.Freshness(load_crops()["pomegranate"])
    f.step(12, 80, 1, 3, 12)
    f.step(2, 90, 0.5, 5, 2)
    assert js["F"] == pytest.approx(f.value, rel=1e-12)


def test_trust_page_and_data_are_in_place():
    for p in ("web/trust.html", "web/trust/trust.js", "web/trust/trust_core.js", "web/trust/trust.css",
              "web/trust/data/trust_data.js", "docs/schemas/block.schema.json", "docs/schemas/telemetry.schema.json",
              "docs/cloud_architecture.md", "tools/mqtt_simulator.py"):
        assert (ROOT / p).exists(), p
    html = (ROOT / "web/trust.html").read_text(encoding="utf-8")
    assert "cdn" not in html.lower() and "vendor/qrcode/qrcode.js" in html
