"""Study: FINNED wax panels vs the baffle channel + night fans (final design, real 2026 weather).

    python -m twin.fin_study_2026   ->  results/live/fin_study_2026.json  (+ printed tables)

Options (115 kg wax, 1.8 kWp, 150 kg at 6 am, sun x0.88):
  A) plain panels + 2 cm baffle + 5 x 120 mm fans (current choice)
  B) finned panels, no fan, no baffle (fully passive)
  C) finned panels + 1-2 small fans only when the room is above 7 C
Prices are GUESSES - get a quotation.
"""
import copy
import json
from pathlib import Path

import pandas as pd

from engine import fan as FAN
from engine import fins as F
from engine.config import load_config
from twin import design_study_2026 as DS
from twin.live_sim import simulate_live, published_cfg

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "results" / "live" / "fin_study_2026.json"
L_PANEL = 1.7            # panel height [m] (first run used 1.2 m, then 1.6 m; final 1.7 m so 12 m2 fits the walls)
T_FIN = 0.001
PRICE_AL_FIN = 500       # Rs/kg, aluminium fin stock + cutting + bonding to the panel - GUESS
PRICE_TRAY = 3000        # Rs, condensate drip tray + drain under the panels - GUESS
PRICE_FAN = 600          # Rs per 120 mm 12 V fan with PWM - GUESS (same as BOM)
PRICE_BAFFLE = 4000      # Rs, baffle sheet + spacers - GUESS (same as BOM)
PRICE_BATT_PER_AH = 200  # Rs per Ah, 12 V LiFePO4 incl. charge controller - GUESS (80 Ah ~ Rs 16,000)
FAN120 = {"name": "120 mm 12 V DC", "d_mm": 120, "flow_m3h": 150, "watts": 3.0, "pressure_Pa": 30}


def hottest_night(w):
    n = w[(w.time_ist.dt.hour >= 19) | (w.time_ist.dt.hour < 6)]
    key = (n.time_ist - pd.Timedelta(hours=7)).dt.date
    g = n.groupby(key).T_out.mean()
    return g.idxmax(), float(g.max())


def calc_table(cfg, w):
    """Step-by-step numbers at a 3 K room-wax difference."""
    A = cfg["pcm"]["slab_area_m2"]
    R = FAN.wax_resistance(cfg, cfg["live_run"]["designs"]["current"]["pcm_kg"])
    day, T_night = hottest_night(w)
    load, parts = FAN.design_night_load(cfg, T_night, 7.0)
    dT = 3.0
    out = {"hottest_night": str(day), "T_out_night_avg_C": T_night, "night_load_W_at_7C": load, "load_parts_W": parts,
           "dT_K": dT, "L_m": L_PANEL, "R_wax_m2K_W": R, "S_opt_bar_cohen_mm": F.s_opt(L_PANEL, dT) * 1000}
    out["plain_no_baffle"] = F.plain(A, L_PANEL, R, dT)
    nat = FAN.natural(FAN.geometry(cfg), R, dT)
    out["plain_with_baffle_fan_off"] = {"h": nat["h"], "UA": nat["G"], "Q_W": nat["Q"]}
    out["fins"] = {}
    for b in (0.02, 0.03, 0.04):
        best, rows = F.best_spacing(A, L_PANEL, b, T_FIN, R, dT)
        out["fins"][f"{b * 1000:.0f} mm"] = {"best": best, "at_20mm": F.array(A, L_PANEL, 0.02, b, T_FIN, R, dT),
                                             "sweep": [{k: r[k] for k in ("S_mm", "h", "UA", "Q_W")} for r in rows[::2]]}
    b16 = F.best_spacing(A, 1.6, 0.04, T_FIN, R, dT)[0]
    out["check_1.6m_panel_40mm"] = b16
    return out


def run():
    cfg = published_cfg(load_config())
    w = DS.actual_weather()
    m = cfg["live_run"]["money"]
    ld = cfg["live_run"]["loading"]
    calc = calc_table(cfg, w)
    A = cfg["pcm"]["slab_area_m2"]
    R = calc["R_wax_m2K_W"]
    Hg = simulate_live(w, "current", mode="grid_only", cfg=cfg)[0]

    def fins(b, n_fans=0, L=L_PANEL, scale=1.0):
        S = 0.023 if b == 0.04 else F.best_spacing(A, L, b, T_FIN, R, 3.0)[0]["S_mm"] / 1000   # 40 mm: chosen 23 mm gap
        hx = {"kind": "fins", "L": L, "h_scale": scale, "S": S, "b": b, "t": T_FIN, "cover_m": 1.0, "flow_fraction": 0.7}
        if n_fans:
            hx["fan"] = {**FAN120, "count": n_fans}
        return hx

    c7 = copy.deepcopy(cfg)                          # option C rule: fans only when the room > 7 C
    c7["live_run"]["night_fan"].update({"on_above_C": 7.0, "target_C": 7.0, "morning_assist_above_C": 7.0})
    options = {
        "A) plain + 2 cm baffle + 5 fans": (cfg, {"kind": "baffle"}, True),
        "B) fins 30 mm, passive": (cfg, fins(0.03), False),
        "B) fins 40 mm, passive": (cfg, fins(0.04), False),
        "C) fins 30 mm + 1 fan > 7 C": (c7, fins(0.03, 1), True),
        "C) fins 30 mm + 2 fans > 7 C": (c7, fins(0.03, 2), True),
        "C) fins 40 mm + 1 fan > 7 C": (c7, fins(0.04, 1), True),
        "check: B 40 mm, h -25 %": (cfg, fins(0.04, scale=0.75), False),
        "check: C 40 mm + 1 fan, h -25 %": (c7, fins(0.04, 1, scale=0.75), True),
    }
    res = {}
    for name, (c, hx, fan_on) in options.items():
        H, T, _, bt = simulate_live(w, "current", cfg=c, fan_on=fan_on, hx=hx)
        r = {**DS.metrics(H, T, bt, ld), **DS.money(H, Hg, m)}
        b = DS.battery(H, c)
        r["battery_needed_Ah"], r["battery_Ah"] = b["needed_Ah"], b["chosen_Ah"]
        r["fan_heat_kWh_day"] = r["fan_kWh_day"]                  # all fan power ends up as heat in the room
        if hx.get("kind") == "fins":
            arr = F.array(A, hx["L"], hx["S"], hx["b"], T_FIN, R, 3.0)
            nf = hx.get("fan", {}).get("count", 0) if hx.get("fan") else 0
            r.update({"fin_S_mm": hx["S"] * 1000, "fin_b_mm": hx["b"] * 1000, "aluminium_kg": arr["al_kg"],
                      "UA_3K_W_K": arr["UA"], "fans": nf})
            r["extra_cost_INR_guess"] = arr["al_kg"] * PRICE_AL_FIN + PRICE_TRAY + nf * PRICE_FAN + b["chosen_Ah"] * PRICE_BATT_PER_AH
        else:
            r.update({"aluminium_kg": 0.0, "fans": 5, "UA_3K_W_K": T["wax_hx"]["UA_fan_W_K"]})
            r["extra_cost_INR_guess"] = 5 * PRICE_FAN + PRICE_BAFFLE + PRICE_TRAY + b["chosen_Ah"] * PRICE_BATT_PER_AH
        res[name] = r
    out = {"calc": calc, "options": res, "prices_note": "Extra cost = fins/baffle + fans + drip tray + 12 V battery. "
           f"GUESS: aluminium fins Rs {PRICE_AL_FIN}/kg, tray Rs {PRICE_TRAY}, fan Rs {PRICE_FAN}, baffle Rs {PRICE_BAFFLE}, "
           f"battery Rs {PRICE_BATT_PER_AH}/Ah - get a quotation."}
    OUT.write_text(json.dumps(out, indent=1, default=float))
    return out


def show(out):
    c = out["calc"]
    print(f"Hottest night {c['hottest_night']}: outside avg {c['T_out_night_avg_C']:.1f} C, load at 7 C room "
          f"{c['night_load_W_at_7C']:.0f} W; dT = {c['dT_K']} K; S_opt (Bar-Cohen) {c['S_opt_bar_cohen_mm']:.1f} mm")
    print("plain, no baffle:", {k: round(v, 2) for k, v in c["plain_no_baffle"].items()})
    print("plain + baffle, fan off:", {k: round(v, 2) for k, v in c["plain_with_baffle_fan_off"].items()})
    for k, v in c["fins"].items():
        for lab in ("best", "at_20mm"):
            x = v[lab]
            print(f"fins {k} {lab:8s} S={x['S_mm']:.0f} N={x['N_fins']:.0f} mult={x['area_mult']:.2f} hBC={x['h_bar_cohen']:.2f} "
                  f"hVdP={x['h_van_de_pol']:.2f} eta={x['eta']:.3f} UAair={x['UA_air']:.1f} UA={x['UA']:.1f} Q={x['Q_W']:.0f} W "
                  f"Al={x['al_kg']:.0f} kg")
    print("check 1.6 m panel, 40 mm:", round(c["check_1.6m_panel_40mm"]["UA"], 1), "W/K")
    keys = ["night_room_avg_C", "night_room_max_C", "h_outside_2_8_loading", "h_outside_2_8_other", "days_full_solar_wax",
            "grid_h_per_year", "fan_kWh_day", "battery_needed_Ah", "battery_Ah", "aluminium_kg", "extra_cost_INR_guess",
            "wax_cold_used_before_morning_pct", "h_air_above_8C_per_day", "produce_avg_C_after_4h", "cool_h_avg", "comp_kWh_day",
            "saved_vs_grid_INR_yr"]
    print(pd.DataFrame(out["options"]).loc[keys].round(2).to_string())


if __name__ == "__main__":
    show(run())
