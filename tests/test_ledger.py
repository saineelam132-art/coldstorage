import hashlib

from engine.ledger import Chain, block_hash, block_string, GENESIS_PREV


def make(n=5):
    c = Chain()
    for i in range(n):
        c.add(f"2025-03-28 {i:02d}:00", ["CT-1"], {"T_min": 4.9, "T_avg": 5.1 + i / 10, "T_max": 5.6,
                                                     "RH_avg": 90, "door_min": 1.5, "pcm_pct": 80 - i}, "OK")
    return c


def test_hash_is_sha256_of_the_block_string():
    c = make(1)
    b = c.blocks[0]
    assert b["prev_hash"] == GENESIS_PREV
    assert b["hash"] == hashlib.sha256(block_string(b).encode()).hexdigest()


def test_untouched_chain_is_valid():
    v = make().verify()
    assert v["valid"] and v["first_bad"] is None


def test_tamper_breaks_chain_from_that_block_onward():
    c = make(6)
    c.tamper(2, "T_max", 4.0)
    v = c.verify()
    assert not v["valid"] and v["first_bad"] == 2
    assert v["status"][:2] == ["ok", "ok"]
    assert v["status"][2] == "data changed"
    assert all(s == "untrusted" for s in v["status"][3:])


def test_resealing_one_block_still_breaks_the_link():
    c = make(5)
    c.tamper(1, "T_max", 4.0)
    c.blocks[1]["hash"] = block_hash(c.blocks[1])          # cheater re-computes this block's hash
    v = c.verify()
    assert v["first_bad"] == 2 and v["status"][2] == "link broken"


def test_reset_restores_valid_chain():
    c = make(4)
    c.tamper(1)
    c.reset_tamper()
    assert c.verify()["valid"]


def test_javascript_ledger_gives_the_same_hashes(tmp_path):
    """The buyer's phone (web/js/ledger.js) must compute exactly the Python hashes."""
    import json
    import shutil
    import subprocess
    from pathlib import Path
    import pytest
    node = shutil.which("node")
    if not node:
        pytest.skip("node not installed")
    c = make(4)
    f = tmp_path / "b.json"
    f.write_text(json.dumps(c.blocks))
    js = Path(__file__).resolve().parent.parent / "web" / "js" / "ledger.js"
    code = (f"import {{ blockHash }} from '{js.as_uri()}'; import fs from 'fs';"
            f"const b = JSON.parse(fs.readFileSync('{f.as_posix()}'));"
            "console.log(b.every(x => blockHash(x) === x.hash) ? 'SAME' : 'DIFF');")
    out = subprocess.run([node, "--input-type=module", "-e", code], capture_output=True, text=True, timeout=60)
    assert "SAME" in out.stdout, out.stderr
