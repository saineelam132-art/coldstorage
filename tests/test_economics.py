"""Money audit: every formula, the yearly check, and the page (JS) giving the same numbers as Python."""
import json
import shutil
import subprocess
from pathlib import Path

import numpy as np
import pytest

from engine import economics as EC

ROOT = Path(__file__).resolve().parent.parent
P = dict(EC.DEFAULTS, extra_capex_INR=100000.0)


def toy(n=3):
    go = [[0.2] * 24 for _ in range(n)]
    return {"days": [f"2026-01-0{i + 1}" for i in range(n)], "go_kWh": go, "go_run_h": [[0.4] * 24 for _ in range(n)],
            "ours_kWh": [[0.0] * 23 + [0.1] for _ in range(n)], "ours_run_h": [[0.0] * 23 + [0.2] for _ in range(n)]}


def test_fuel_curve_is_a_straight_line():
    assert EC.fuel_L(2.0, 1.0, 0.25, 0.30) == pytest.approx(0.85)
    assert 0.8 <= EC.fuel_per_kWh_at_load(0.30, P) <= 1.2          # typical small genset at 30 % load
    assert EC.fuel_per_kWh_at_load(1.0, P) < EC.fuel_per_kWh_at_load(0.3, P)


def test_cut_mask_window_and_random_repeatable():
    m = EC.cut_mask(2, P)
    assert m[0].sum() == P["cut_end_h"] - P["cut_start_h"] and m[0][P["cut_start_h"]] and not m[0][P["cut_end_h"]]
    q = dict(P, random_cut_prob=0.2)
    assert (EC.cut_mask(5, q) == EC.cut_mask(5, q)).all() and EC.cut_mask(5, q).sum() > m[0].sum() * 5 / 2


def test_day_costs_by_hand():
    D = toy()
    c = EC.day_costs(D, P)
    t, dp = P["grid_tariff_INR_kWh"], P["diesel_INR_L"]
    assert c["a_grid_only"][0] == pytest.approx(24 * 0.2 * t)
    fuel_h = 0.25 * 0.4 + 0.30 * 0.2
    assert c["b_diesel_only"][0] == pytest.approx(24 * fuel_h * dp)
    cut = P["cut_end_h"] - P["cut_start_h"]
    assert c["c_grid_diesel"][0] == pytest.approx(cut * fuel_h * dp + (24 - cut) * 0.2 * t)
    assert c["d_ours_vs_a"][0] == pytest.approx(0.1 * t)


def test_saving_payback_and_produce_value():
    D = toy(10)
    r = EC.summary(D, P, 100000.0)
    assert r["energy_saving_yr"]["vs_grid"] == pytest.approx(r["per_year"]["a_grid_only"] - r["per_year"]["d_ours_vs_a"])
    assert r["produce_value_yr"] == pytest.approx(150 * 100 * 0.08 * 365)
    assert r["total_with_produce_yr"]["vs_grid"] == pytest.approx(r["net_saving_yr"]["vs_grid"] + r["produce_value_yr"])
    assert EC.payback_years(1000, 500, 0, 25) == pytest.approx(2.0)
    assert EC.payback_years(1000, 10, 0, 25) is None
    assert EC.payback_years(1000, 500, 10, 25) > 2.0                 # degradation makes it longer
    assert r["capex_after_subsidy"] == pytest.approx(100000 * (1 - P["subsidy_pct"] / 100))


def test_yearly_equals_sum_of_daily_rows():
    D = toy(7)
    r = EC.summary(D, P, 0.0)
    c = EC.day_costs(D, P)
    for k in ("a_grid_only", "b_diesel_only", "c_grid_diesel", "d_ours_vs_a"):
        assert r["per_year"][k] == pytest.approx(float(np.sum(c[k])) * 365 / 7, rel=0.01)
    assert sum(m["a_grid_only"] for m in r["per_month"].values()) == pytest.approx(float(np.sum(c["a_grid_only"])))


@pytest.mark.skipif(not (ROOT / "results/live/economics_2026.json").exists(), reason="run python -m engine.economics")
def test_result_file_matches_the_live_year_run():
    E = json.loads((ROOT / "results/live/economics_2026.json").read_text(encoding="utf-8"))
    S = json.loads((ROOT / "results/live/summary.json").read_text(encoding="utf-8"))
    ix = {d: i for i, d in enumerate(S["money"]["days"])}
    a = sum(sum(S["money"]["gridonly_kWh_by_hour"][ix[d]]) for d in E["data"]["days"] if d in ix)
    b = sum(sum(E["data"]["go_kWh"][i]) for i, d in enumerate(E["data"]["days"]) if d in ix)
    assert b == pytest.approx(a, rel=0.01)


def test_page_formulas_match_python():
    node = shutil.which("node")
    if not node:
        pytest.skip("node missing")
    D = toy(9)
    py = EC.summary(D, P, 100000.0)
    js = subprocess.run([node, "-e", f"const M=require({json.dumps(str(ROOT / 'web/live/money.js'))});"
                         f"console.log(JSON.stringify(M.summary({json.dumps(D)},{json.dumps(P)},100000)))"], capture_output=True, text=True)
    assert js.returncode == 0, js.stderr
    j = json.loads(js.stdout)
    for k in ("a_grid_only", "b_diesel_only", "c_grid_diesel", "d_ours_vs_a", "d_ours_vs_b", "d_ours_vs_c"):
        assert j["per_year"][k] == pytest.approx(py["per_year"][k])
    for k in py["net_saving_yr"]:
        assert j["net_saving_yr"][k] == pytest.approx(py["net_saving_yr"][k])
    for k, v in py["payback_years"].items():
        assert (j["payback_years"][k] is None) == (v is None) and (v is None or j["payback_years"][k] == pytest.approx(v))
