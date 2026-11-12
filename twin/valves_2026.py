"""Valve study 2026: the older two-EEV split vs the chosen solenoid + TXV split (ON/OFF branches).

Same 2026 weather, same final design, same everything - only the valve logic changes
(twin/live_sim.py, valves="eev" or "sv_txv"). Writes results/live/valves_2026.json (a NEW file) and
web/live/data/valves_2026.js for the website.

    python -m twin.valves_2026
"""
import datetime as dt
import json

from engine.config import load_config
from twin import live_weather as LW
from twin.live_run import RES, clean, daily, r, totals, write_js
from twin.live_sim import simulate_live

KEYS = [("days_full_solar_wax", "Days fully on solar + wax", "days"), ("grid_h", "Grid hours", "h"),
        ("grid_kWh", "Grid energy", "kWh"), ("wax_sunset_avg", "Wax frozen at sunset (average)", "%"),
        ("hours_above_8C", "Hours with room air above 8 °C", "h"), ("comp_kWh", "Compressor energy", "kWh"),
        ("wax_stored_kWh", "Cold stored in the wax", "kWh")]
def cost(cfg):
    P = cfg["refrigeration"]["valves"]["price_INR_E"]
    sv = [2 * (P["solenoid_valve"][i] + P["txv"][i]) for i in (0, 1)]
    ev = [2 * P["eev_with_driver"][i] for i in (0, 1)]
    return {"eev": {"label": "2 × electronic expansion valve (EEV) + driver", "lo": ev[0], "hi": ev[1]},
            "sv_txv": {"label": "2 × (liquid-line solenoid valve + TXV)", "lo": sv[0], "hi": sv[1]},
            "tag": "E", "note": "estimate – quotation pending",
            "chosen": "Chosen: solenoid + TXV – lowest cost, proven, enough control because the compressor is inverter-driven."}


def run_one(W, cfg, now, valves):
    H, tot, _, bt = simulate_live(W, "current", cfg=cfg, valves=valves, steps=True)
    S = tot.pop("steps")
    H.attrs["pcm_kg"] = cfg["live_run"]["designs"]["current"]["pcm_kg"]
    D = daily(H, bt, cfg, now)
    t = totals(D, tot)
    last = str(D[D.status == "actual"].index.max())
    act = (H.time_ist.dt.date.astype(str) <= last).values                # finished days only, like the totals
    t["hours_above_8C"] = float((H.T_room.values[act] > cfg["live_run"]["band_C"][1]).sum())
    s = S[S.index.astype(str) <= last + " 23:59"] if len(S) else S
    if valves == "sv_txv" and len(s):
        b = s["sv_b"].values
        t["sv_b_on_h"] = float(b.sum() * 5 / 60)
        t["sv_b_switch_ons_per_day"] = float(((b[1:] > 0) & (b[:-1] == 0)).sum() / max(1, t["days"]))
        t["sv_a_on_h"] = float(s["sv_a"].values.sum() * 5 / 60)
        t["both_shut_while_running_steps"] = int(((s["running"] > 0) & (s["sv_a"] == 0) & (s["sv_b"] == 0)).sum())
    return t


def run(now=None):
    cfg = load_config()
    if now is None:
        try:
            g = json.loads((RES / "summary.json").read_text())["generated"]       # same 'now' as the stored Live Year Run
            now = dt.datetime.strptime(g.replace(" IST", ""), "%Y-%m-%d %H:%M")
        except Exception:  # noqa: BLE001
            now = LW.now_ist()
    W = LW.load_actual(now.date())
    res = {k: run_one(W, cfg, now, k) for k in ("eev", "sv_txv")}
    rows = []
    for k, lab, unit in KEYS:
        a, b = res["eev"].get(k), res["sv_txv"].get(k)
        rows.append({"key": k, "label": lab, "unit": unit, "eev": r(a, 2), "sv_txv": r(b, 2),
                     "change": r(b - a, 2) if a is not None and b is not None else None})
    v = cfg["refrigeration"]["valves"]
    out = {"generated": now.strftime("%Y-%m-%d %H:%M IST"), "days": res["sv_txv"]["days"],
           "first": res["sv_txv"]["first"], "last": res["sv_txv"]["last"], "design": "current (final design)",
           "chosen": "sv_txv", "rows": rows,
           "sv_txv_extra": {k: r(res["sv_txv"].get(k), 2) for k in ("sv_b_on_h", "sv_b_switch_ons_per_day", "sv_a_on_h",
                                                                      "both_shut_while_running_steps")},
           "assumptions": {"min_on_min": v["min_on_min"], "txv_superheat_K": v["txv_superheat_K"],
                           "txv_min_load_kW_E": v["txv_min_load_kW_E"],
                           "txv_superheat_coil_frac_E": v["txv_superheat_coil_frac_E"]},
           "cost": cost(cfg),
           "headline": {k: r(res["sv_txv"].get(k), 2) for k in ("days_full_solar_wax", "grid_h", "grid_kWh", "wax_sunset_avg",
                                                                 "hours_above_8C", "days")},
           "headline_eev": {k: r(res["eev"].get(k), 2) for k in ("days_full_solar_wax", "grid_h", "grid_kWh", "wax_sunset_avg",
                                                                     "hours_above_8C", "days")}}
    RES.mkdir(parents=True, exist_ok=True)
    (RES / "valves_2026.json").write_text(json.dumps(clean(out), indent=1, allow_nan=False))
    write_js("valves_2026", out)
    return out


if __name__ == "__main__":
    o = run()
    print(f"Valve study 2026 ({o['days']} days {o['first']} -> {o['last']})")
    for x in o["rows"]:
        print(f"  {x['label']:<38} EEV {x['eev']:>9}  SV+TXV {x['sv_txv']:>9}  change {x['change']:>8} {x['unit']}")
    print("  SV+TXV:", o["sv_txv_extra"])
