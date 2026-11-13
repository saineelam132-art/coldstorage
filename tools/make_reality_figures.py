"""Poster figures for the reality check (large fonts). Every number is read from the result files.

    python tools/make_reality_figures.py
      -> figures/final_12_energy_day.png/.svg, final_13_stress_cases.png/.svg, final_14_best_load.png/.svg
(final_11_space_budget is made by python -m engine.space)
"""
import json
import sys
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
import numpy as np  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
FIG = ROOT / "figures"
plt.rcParams.update({"font.size": 15, "axes.titlesize": 18, "axes.titleweight": "bold", "axes.spines.top": False, "axes.spines.right": False})
C = {"pv": "#eda100", "used": "#1baf7a", "waste": "#c9c6bd", "comp": "#2a78d6", "room": "#0e7490", "wax_in": "#6250d6", "wax_out": "#e87ba4", "grid": "#e34948"}


def save(fig, name):
    from tools.axislabels import ensure_axis_labels
    ensure_axis_labels(fig, name)                      # every graph names its x and y axis
    fig.savefig(FIG / f"{name}.png", dpi=150)
    fig.savefig(FIG / f"{name}.svg")
    plt.close(fig)


def energy_day(S):
    E = S["energy_day"]
    fig = plt.figure(figsize=(20, 11))
    gs = fig.add_gridspec(2, 3, height_ratios=[1, 0.9])
    h = np.arange(24)
    for j, (key, title) in enumerate((("average_day", "Average day (2026)"), ("clear_summer_day", "Clear summer day"), ("monsoon_day", "Monsoon day"))):
        d = E[key]
        ax = fig.add_subplot(gs[0, j])
        ax.fill_between(h, d["pv_available_kW"], color=C["pv"], alpha=.25, step="mid", label="PV available")
        ax.step(h, d["pv_used_kW"], where="mid", color=C["used"], lw=2.5, label="PV used")
        ax.step(h, d["compressor_kW"], where="mid", color=C["comp"], lw=2, label="compressor power")
        ax.step(h, d["cold_to_room_kW"], where="mid", color=C["room"], lw=2, ls="--", label="cold to room")
        ax.step(h, d["cold_into_wax_kW"], where="mid", color=C["wax_in"], lw=2, ls="--", label="cold into wax")
        ax.step(h, d["cold_wax_to_room_kW"], where="mid", color=C["wax_out"], lw=2.5, label="cold wax → room")
        ax.set_title(title + (f" ({d['date']})" if "date" in d else ""))
        ax.set_xlabel("hour (IST)"); ax.set_xticks(range(0, 25, 6))
        ax.set_ylabel("Power (kW)")
        if j == 0:
            ax.legend(fontsize=12, loc="upper left")
    s = E["sankey_average_day_kWh"]
    ax = fig.add_subplot(gs[1, :])
    ax.axis("off")
    ax.set_title("Average day, kWh (digital twin S): where the sun goes and where the cold goes", loc="left")
    bars = [("Solar available", s["solar_available_kWh"], C["pv"]), ("→ used for the room", s["used_for_room_kWh"], C["room"]),
            ("→ used to freeze the wax", s["used_for_wax_kWh"], C["wax_in"]), ("→ wasted (wax full / no need)", s["solar_wasted_kWh"], C["waste"]),
            ("Cold straight to the room", s["cold_direct_to_room_kWh"], C["room"]), ("Cold put into the wax", s["cold_into_wax_kWh"], C["wax_in"]),
            ("Wax → room by day", s["cold_wax_to_room_day_kWh"], C["wax_out"]), ("Wax → room at night", s["cold_wax_to_room_night_kWh"], C["wax_out"]),
            ("Cold for the 6 am batch (6–10 h)", s["cold_for_6am_batch_kWh"], C["comp"]), ("Grid (electric)", s["grid_kWh"], C["grid"])]
    mx = max(b[1] for b in bars)
    for i, (lab, v, col) in enumerate(bars):
        y = len(bars) - i
        ax.barh(y, v / mx, color=col, height=.7)
        ax.text(-0.01, y, lab, ha="right", va="center", fontsize=14)
        ax.text(v / mx + .01, y, f"{v:.2f}", va="center", fontsize=14, weight="bold")
    ax.set_xlim(-0.55, 1.12)
    fig.tight_layout()
    save(fig, "final_12_energy_day")


def stress(S):
    order = [k for k in S["order"] if k in S["cases"]]
    SHORT = {"base": "Base model (as published)", "precool": "Pre-cool to 3 °C at dawn (grid)", "thermal_mass": "Racks + crates + pomegranate",
             "walls": "Walls: outside area + 10 % bridges", "door": "Door: 8 × 20 s, worn curtain", "fans_lights": "Fans, lights, controller",
             "defrost": "Defrost (off-cycle)", "defrost_heater": "Defrost with 250 W heater", "wax_real": "Wax: 90 % latent, 3–5 °C, fins −25 %",
             "machine_real": "Machine: starts, hot COP, dust, wiring", "weather_hot": "Weather error: hot site", "load_var": "Load 50–250 kg/day",
             "thermostat": "Thermostat ±1 °C on/off", "no_grid": "No grid at all", "controller_fix": "Smart controller (software)",
             "realistic": "REALISTIC (all together)", "realistic_no_grid": "REALISTIC, no grid", "realistic_precool": "REALISTIC + pre-cool",
             "realistic_fix": "REALISTIC + smart controller", "realistic_fix_no_grid": "REALISTIC + smart ctrl, no grid"}
    lab = [SHORT.get(k, S["cases"][k]["label"][:40]) for k in order]
    nog = [k.endswith("no_grid") for k in order]
    days = [0 if ng else S["cases"][k]["days_full_solar_wax"] for k, ng in zip(order, nog)]
    grid = [S["cases"][k]["grid_h_per_year"] for k in order]
    air = [S["cases"][k]["air_above_8C_h_day"] for k in order]
    fig, ax = plt.subplots(1, 3, figsize=(22, 11), sharey=True)
    y = np.arange(len(order))[::-1]
    col = ["#1baf7a" if k == "base" else "#e34948" if k.startswith("realistic") else "#2a78d6" for k in order]
    ax[0].barh(y, days, color=col); ax[0].set_title(f"Days fully on solar + wax (of {S['cases']['base']['days']})")
    ax[1].barh(y, grid, color=col); ax[1].set_title("Grid hours per year")
    ax[2].barh(y, air, color=col); ax[2].set_title("Hours/day room air > 8 °C")
    ax[0].set_yticks(y); ax[0].set_yticklabels(lab, fontsize=13)
    ax[0].set_ylabel("Case tested"); ax[0].set_xlabel("days in 2026"); ax[1].set_xlabel("hours per year"); ax[2].set_xlabel("hours per day")
    for a, vals, f in ((ax[0], days, "{:.0f}"), (ax[1], grid, "{:.0f}"), (ax[2], air, "{:.1f}")):
        for yy, v, ng in zip(y, vals, nog):
            a.text(v, yy, " n/a – no grid to use" if (a is ax[0] and ng) else " " + f.format(v), va="center", fontsize=12)
    fig.suptitle("Reality check: each loophole alone, then all together (digital twin S, 2026 weather; assumptions E)", fontsize=20, weight="bold")
    fig.tight_layout(rect=[0, 0, 1, 0.95])
    save(fig, "final_13_stress_cases")


def best(B):
    fig, ax = plt.subplots(1, 3, figsize=(22, 8.5))
    for base, ls in (("realistic", "--"), ("realistic_fix", "-")):
        for d, colr in zip((1, 3, 7), ("#2a78d6", "#eb6834", "#1baf7a")):
            rows = [r for r in B["sweep"][base] if r["dwell_days"] == d]
            ax[0].plot([r["intake_kg_day"] for r in rows], [r["days_full_solar_wax"] for r in rows], ls, marker="o", color=colr, lw=2.5,
                       label=f"{d}-day stay – {'smart controller' if base == 'realistic_fix' else 'realistic (dashed)'}")
    ax[0].axhline(B["rule"]["a_days_min"], color="#e34948", lw=2, ls=":")
    ax[0].text(100, B["rule"]["a_days_min"] + 4, "90 % target", color="#e34948")
    ax[0].axvspan(B["capacity_kg"], 360, color="#c9c6bd", alpha=.3)
    ax[0].text(B["capacity_kg"] + 5, 5, f"does not fit\n(> {B['capacity_kg']} kg)", fontsize=13)
    ax[0].set_xlabel("daily intake (kg/day)"); ax[0].set_ylabel("days fully on solar + wax"); ax[0].set_title("Daily load (REALISTIC)")
    ax[0].legend(fontsize=11)
    sz = B["sizing"]["realistic_fix"]
    for wax, colr in zip((115, 172, 230), ("#2a78d6", "#6250d6", "#e87ba4")):
        rr = [r for r in sz if round(r["pcm_kg"]) == wax]
        ax[1].plot([r["pv_kWp"] for r in rr], [r["grid_h_per_year"] for r in rr], marker="o", lw=2.5, color=colr, label=f"{wax} kg wax")
    ax[1].set_xlabel("PV size (kWp)"); ax[1].set_ylabel("grid hours per year"); ax[1].set_title("PV and wax size at 150 kg/day")
    ax[1].legend(fontsize=12)
    fn = B.get("fins", {}).get("realistic_fix", [])
    if fn:
        ax[2].bar([f"×{r['fin_UA_frac']}" for r in fn], [r["days_full_solar_wax"] for r in fn], color="#0e7490")
        for i, r in enumerate(fn):
            ax[2].text(i, r["days_full_solar_wax"], f"{r['days_full_solar_wax']}\n{r['grid_h_per_year']:.0f} h grid", ha="center", va="bottom", fontsize=12)
        ax[2].set_title("Night heat transfer from the wax (fins)"); ax[2].set_xlabel("fin heat transfer vs design (0.75 = realistic)")
        ax[2].set_ylabel("days fully on solar + wax")
    fig.suptitle("Best daily load and sizing under REALISTIC conditions (digital twin S)", fontsize=20, weight="bold")
    fig.tight_layout(rect=[0, 0, 1, 0.94])
    save(fig, "final_14_best_load")


def main():
    S = json.loads((ROOT / "results/live/stress_2026.json").read_text(encoding="utf-8"))
    energy_day(S)
    stress(S)
    bp = ROOT / "results/live/best_load_2026.json"
    if bp.exists():
        best(json.loads(bp.read_text(encoding="utf-8")))
    print("figures written")


if __name__ == "__main__":
    main()
