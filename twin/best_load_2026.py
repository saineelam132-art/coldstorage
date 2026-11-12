"""Best daily load: how much pomegranate a day can the room take under REALISTIC conditions?

    python -m twin.best_load_2026     ->  results/live/best_load_2026.json

Sweep daily intake 100-350 kg and dwell time 1 / 3 / 7 days (produce that stays several days takes crate
places and is extra thermal mass), on the REALISTIC case of twin/stress_2026.py (all loopholes together) and
on REALISTIC + smart controller (grid only after 15 min above 7.5 °C, sun first, grid off below 6 °C). 'Best load' = the largest intake with (a) >= 90 % of days fully on solar + wax,
(b) every batch's produce core at or below 8 °C within 8 h, (c) fits the crate places of the space budget.
Also: PV right-sizing (1.2 / 1.8 / 2.4 kWp) and wax size at 150 kg/day, and the effect of pre-cooling.
Digital twin (S) + calculated (C); assumptions E as in stress_2026.py and space_budget.json.
"""
import json
import os
from multiprocessing import Pool
from pathlib import Path

from engine.config import load_config
from twin import stress_2026 as ST
from twin import uncertainty_2026 as U
from twin.live_sim import published_cfg

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "results" / "live" / "best_load_2026.json"
INTAKES = [100, 150, 200, 250, 300, 350]
DWELLS = [1, 3, 7]
BASES = {"realistic": {}, "realistic_fix": {"ats_release_C": 6.0, "ats_delay_steps": 3, "solar_first": True}}
_G = {}


def _init():
    _G["cfg"] = published_cfg(load_config())
    _G["w"] = U.study_weather()
    _G["night"] = U.hottest_night(_G["w"])


def spec(base, extra):
    real, wkind, crop = ST.spec_of("realistic")
    real = dict(real)
    real.pop("intake_random", None)                     # the sweep sets a fixed daily intake
    real.update(BASES[base])
    real.update(extra)
    return real, wkind, crop


def _run(job):
    if not _G:
        _init()
    key, base, extra, dwell, kg = job
    ex = dict(extra)
    if kg is not None:
        ex["intake_kg"] = [kg] * 400
    o = ST.run_one(spec(base, ex), _G["cfg"], _G["w"], _G["night"], dwell=dwell)
    o.pop("_H")
    cfg = _G["cfg"]
    kWp = ex.get("pv_kWp", cfg["live_run"]["designs"]["current"]["pv_kWp"])
    kg_day = kg if kg is not None else 150
    in_room = kg_day * dwell
    grid_cost_day = o["grid_kWh_per_year"] / 365 * cfg["live_run"]["money"]["grid_tariff_INR_kWh"]
    o.update({"intake_kg_day": kg_day, "dwell_days": dwell, "kg_in_room": in_room,
              "kWh_per_kg_stored": o["comp_kWh_day"] / in_room, "INR_per_kg_day": grid_cost_day / in_room,
              "W_PV_per_kg": 1000 * kWp / in_room, "pv_kWp": kWp,
              "pcm_kg": ex.get("pcm_kg", cfg["live_run"]["designs"]["current"]["pcm_kg"])})
    return key, o


def run(procs=None):
    _init()
    space = ST.space()
    cap = space["capacity_kg"]
    jobs = []
    for base in BASES:
        for d in DWELLS:
            for kg in INTAKES:
                jobs.append((f"{base}|{kg}|{d}", base, {}, d, kg))
        for kWp in (1.2, 1.8, 2.4):
            for wax in (115, 172, 230):
                jobs.append((f"{base}|size|{kWp}|{wax}", base, {"pv_kWp": kWp, "pcm_kg": wax}, 1, 150))
        jobs.append((f"{base}|precool", base, {"precool": {"from_h": 5, "target_C": 3.0}}, 1, 150))
        for f in (0.75, 1.0, 1.5, 2.0):                 # night-time heat transfer from the wax (fins; 0.75 = realistic)
            jobs.append((f"{base}|fins|{f}", base, {"fin_UA_frac": f}, 1, 150))
    with Pool(procs or max(1, os.cpu_count() or 2), initializer=_init) as p:
        res = dict(p.map(_run, jobs))
    days = res[f"realistic|150|1"]["days"]
    need = 0.9 * days
    out = {"about": __doc__.strip().splitlines()[0], "days": days, "capacity_kg": space["capacity_kg"], "crate_places": space["crate_places"],
           "rule": {"a_days_min": need, "a_text": "≥ 90 % of days fully on solar + wax", "b_text": "every batch's core ≤ 8 °C within 8 h",
                    "c_text": f"intake × dwell ≤ {cap} kg (room capacity, space budget)"},
           "sweep": {}, "sizing": {}, "precool": {}, "best": {}}
    for base in BASES:
        rows = []
        for d in DWELLS:
            for kg in INTAKES:
                o = res[f"{base}|{kg}|{d}"]
                o["ok_a"] = o["days_full_solar_wax"] >= need
                o["ok_b"] = o["batches_over_8h_to_8C"] == 0
                o["ok_c"] = kg * d <= cap
                o["ok"] = o["ok_a"] and o["ok_b"] and o["ok_c"]
                rows.append(o)
        out["sweep"][base] = rows
        best = {}
        for d in DWELLS:
            ok = [r["intake_kg_day"] for r in rows if r["dwell_days"] == d and r["ok"]]
            best[str(d)] = max(ok) if ok else None
        out["best"][base] = best
        out["sizing"][base] = [{**res[f"{base}|size|{k}|{w}"]} for k in (1.2, 1.8, 2.4) for w in (115, 172, 230)]
        out["precool"][base] = {"without": res[f"{base}|150|1"], "with": res[f"{base}|precool"]}
        out.setdefault("fins", {})[base] = [{"fin_UA_frac": f, **res[f"{base}|fins|{f}"]} for f in (0.75, 1.0, 1.5, 2.0)]
    OUT.write_text(json.dumps(out, indent=1, default=float, ensure_ascii=False), encoding="utf-8")
    return out


def show(o):
    for base in BASES:
        print("==", base, "best:", o["best"][base])
        for r in o["sweep"][base]:
            print(f"  {r['intake_kg_day']:4d} kg × {r['dwell_days']} d: days {r['days_full_solar_wax']:3d} grid {r['grid_h_per_year']:6.0f} h "
                  f"core≤8 in 8h {'yes' if r['ok_b'] else 'NO '} fits {'yes' if r['ok_c'] else 'NO '} kWh/kg {r['kWh_per_kg_stored']:.3f} "
                  f"solar used {r['solar_used_pct']:.0f} %")
        for r in o["sizing"][base]:
            print(f"  size {r['pv_kWp']} kWp / {r['pcm_kg']:.0f} kg wax: days {r['days_full_solar_wax']} grid {r['grid_h_per_year']:.0f} h, solar used {r['solar_used_pct']:.0f} %")
        for r in o["fins"][base]:
            print(f"  fins x{r['fin_UA_frac']}: days {r['days_full_solar_wax']} grid {r['grid_h_per_year']:.0f} h air>8 {r['air_above_8C_h_day']:.2f} h/day")
        pc = o["precool"][base]
        print("  precool:", pc["with"]["days_full_solar_wax"], "days vs", pc["without"]["days_full_solar_wax"],
              "| produce >8 h/day", round(pc["with"]["produce_above_8C_h_day"], 2), "vs", round(pc["without"]["produce_above_8C_h_day"], 2))


if __name__ == "__main__":
    show(run())
