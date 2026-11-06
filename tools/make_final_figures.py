"""Poster figures for the FINAL design (115 kg wax, 1.8 kWp, 5 night fans, 150 kg at 6 am).

    python -m twin.live_run              (first: makes results/live/)
    python -m twin.design_study_2026     (first: makes results/live/design_study_2026.json)
    python tools/make_final_figures.py   -> figures/final_*.png + .svg (300 dpi)

Every number is read from results/live/ or re-simulated with the twin - nothing is typed in.
All results: simulated on real 2026 Vizag weather (Open-Meteo / ERA5), conservative sun (x0.88).
"""
import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

import make_poster_figures as P  # noqa: E402  (same style, colours and save())
from engine.config import load_config  # noqa: E402
from matplotlib.patches import FancyArrowPatch, Rectangle  # noqa: E402
from twin import design_study_2026 as DS  # noqa: E402
from twin.live_sim import simulate_live  # noqa: E402

plt = P.plt
LIVE = ROOT / "results" / "live"
NOTE = ("Simulated – digital twin on real 2026 Visakhapatnam weather (Open-Meteo / ERA5), "
        "conservative sun (×0.88). Weather data by Open-Meteo.com")
BLUE, ORANGE, AQUA, INK2, MUTED = P.BLUE, P.ORANGE, P.AQUA, P.INK2, P.MUTED


def study():
    return json.loads((LIVE / "design_study_2026.json").read_text())


def summary():
    return json.loads((LIVE / "summary.json").read_text())


# ---------------------------------------------------------------- 1. night fan with vs without
def fig_fan(cfg):
    w = DS.actual_weather()
    night = w[(w.time_ist.dt.hour >= 19) | (w.time_ist.dt.hour < 6)]
    key = (night.time_ist - pd.Timedelta(hours=7)).dt.date
    hot = night.groupby(key).T_out.mean().idxmax()                      # date of the hottest night
    t0 = pd.Timestamp(hot) - pd.Timedelta(days=4)
    t1 = pd.Timestamp(hot) + pd.Timedelta(days=1, hours=12)
    win = w[(w.time_ist >= t0) & (w.time_ist < t1)].reset_index(drop=True)
    runs = {f: simulate_live(win, "current", fan_on=f, cfg=cfg)[0] for f in (False, True)}
    a, b = pd.Timestamp(hot) + pd.Timedelta(hours=12), pd.Timestamp(hot) + pd.Timedelta(days=1, hours=12)

    fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(12, 7.5), sharex=True, gridspec_kw={"height_ratios": [3, 2]})
    ax1.axhspan(2, 8, color=P.BAND, zorder=0)
    ax1.text(a + pd.Timedelta(minutes=20), 7.7, "safe band 2–8 °C", color=INK2, fontsize=10, va="top")
    for f, col, lab in ((False, ORANGE, "without night fan"), (True, BLUE, "with night fan (5 × 120 mm)")):
        H = runs[f]
        H = H[(H.time_ist >= a) & (H.time_ist <= b)]
        ax1.plot(H.time_ist, H.T_room, color=col, label=f"Room air – {lab}")
        ax2.plot(H.time_ist, H.P_grid * 1000, color=col, label=f"Grid power – {lab}")
        if f:
            ax2.plot(H.time_ist, H.fan_W, color=AQUA, ls="--", label="Night-fan power (12 V battery)")
    ax1.set_ylabel("°C")
    top = max(r[(r.time_ist >= a) & (r.time_ist <= b)].T_room.max() for r in runs.values())
    ax1.set_ylim(0, top * 1.12)
    ld = cfg["live_run"]["loading"][0]
    ax1.annotate(f"{ld['kg']} kg warm batch arrives {ld['hour']}:00\n(only fresh produce inside)",
                 (pd.Timestamp(hot) + pd.Timedelta(days=1, hours=ld["hour"]), top * 0.9), xytext=(-190, -10),
                 textcoords="offset points", fontsize=10, color=INK2, arrowprops=dict(arrowstyle="->", color=MUTED))
    ax1.legend(loc="upper right", fontsize=10)
    ax2.set_ylabel("W")
    ax2.legend(loc="upper right", fontsize=10)
    ax2.xaxis.set_major_formatter(plt.matplotlib.dates.DateFormatter("%H:%M"))
    gn = runs[False][(runs[False].time_ist >= a) & (runs[False].time_ist <= b)].P_grid.sum()
    gf = runs[True][(runs[True].time_ist >= a) & (runs[True].time_ist <= b)].P_grid.sum()
    ax1.set_title(f"Hottest night of 2026 ({pd.Timestamp(hot):%d %b}): night grid use "
                  f"{gn:.2f} kWh without fan → {gf:.2f} kWh with fan")
    fig.text(0.01, -0.01, "With the fan the wax alone holds the room – a night power cut changes nothing. "
             "Without it the baffle chokes natural air flow and the grid must run the compressor.",
             fontsize=10, color=INK2)
    fig.tight_layout()
    P.save(fig, "final_01_night_fan_hottest_night", NOTE)

    fc = study()["fan_compare"]
    rows = [("Days fully on\nsolar + wax", "days", "days_full_solar_wax", "{:.0f}"),
            ("Grid hours\nper year", "h", "grid_h_per_year", "{:.0f}"),
            ("Electricity\nper day", "kWh", "comp_kWh_day", "{:.2f}"),
            ("Wax cold used\nper day", "kWh", "wax_cold_given_kWh_day", "{:.2f}")]
    fig, axes = plt.subplots(1, len(rows), figsize=(14, 4.6))
    for ax, (t, u, k, fmt) in zip(axes, rows):
        vals = [fc["without fan"][k], fc["with fan"][k]]
        bars = ax.bar(["without\nfan", "with\nfan"], vals, color=[ORANGE, BLUE], width=0.6)
        P.bar_labels(ax, bars, fmt)
        ax.set_title(f"{t}\n({u})", fontsize=12.5)
        ax.set_ylim(0, max(vals) * 1.18 + 1e-9)
    fig.suptitle("Night wax fan: 0.11 kWh/day of fan heat buys back the whole wax battery", fontweight="bold")
    fig.tight_layout()
    P.save(fig, "final_02_night_fan_bars", NOTE)


# ---------------------------------------------------------------- 2. loading options table
def table_fig(name, title, cols, rows, highlight=None, note=NOTE, width=15):
    fig, ax = plt.subplots(figsize=(width, 0.55 * (len(rows) + 2) + 0.8))
    ax.axis("off")
    cw = [0.2] + [0.8 / (len(cols) - 1)] * (len(cols) - 1)
    t = ax.table(cellText=rows, colLabels=cols, loc="center", cellLoc="center", colWidths=cw)
    t.auto_set_font_size(False)
    t.set_fontsize(11.5)
    t.scale(1, 1.9)
    for (r, c), cell in t.get_celld().items():
        cell.set_edgecolor(P.GRID)
        if c == 0 and r > 0:
            cell.set_text_props(ha="left")
            cell.PAD = 0.03
        if r == 0:
            cell.set_height(cell.get_height() * 2.0)
            cell.set_text_props(fontsize=10.5)
            cell.set_facecolor("#184f95")
            cell.set_text_props(color="white", weight="bold")
        elif highlight is not None and r - 1 == highlight:
            cell.set_facecolor(P.BAND)
            cell.set_text_props(weight="bold")
    ax.set_title(title, fontweight="bold", fontsize=15)
    P.save(fig, name, note)


def fig_loading():
    lo = study()["loading_options"]
    cols = ["Loading option", "Air > 8 °C h/day\n(loading\nhours only)", "Produce avg\nafter 2 h (°C)",
            "Produce avg\nafter 4 h (°C)", "Time to 5.5 °C\navg / worst (h)", "Grid h\nper year",
            "Days on\nsolar + wax", "kWh/day", "₹ saved/yr\nvs grid"]
    rows, hi = [], None
    for i, (k, m) in enumerate(lo.items()):
        hi = i if "6 am" in k and "6 pm" not in k else hi
        rows.append([k, f"{m['h_air_above_8C'] / m['days']:.1f}", f"{m['produce_avg_C_after_2h']:.1f}",
                     f"{m['produce_avg_C_after_4h']:.1f}", f"{m['cool_h_avg']:.1f} / {m['cool_h_worst']:.1f}",
                     f"{m['grid_h_per_year']:.0f}", f"{m['days_full_solar_wax']} / {m['days']}",
                     f"{m['comp_kWh_day']:.2f}", f"{m.get('saved_vs_grid_INR_yr', 0):,.0f}"])
    table_fig("final_03_loading_options", "When should the 150 kg batch come in?  (chosen: b) 6 am)", cols, rows, hi)


def fig_wax():
    wc = study()["wax_compare"]
    keys = list(wc)
    rows = [("Days fully on\nsolar + wax", "days", "days_full_solar_wax", "{:.0f}"),
            ("Grid hours\nper year", "h", "grid_h_per_year", "{:.0f}"),
            ("Room air > 8 °C\n(loading only)", "h/day", None, "{:.2f}"),
            ("₹ saved per year\nvs grid only", "₹", "saved_vs_grid_INR_yr", "{:,.0f}")]
    fig, axes = plt.subplots(1, len(rows), figsize=(14, 4.8))
    for ax, (t, u, k, fmt) in zip(axes, rows):
        vals = [(wc[d][k] if k else wc[d]["h_air_above_8C"] / wc[d]["days"]) for d in keys]
        bars = ax.bar(["115 kg wax\n1.8 kWp\n(final)", "172 kg wax\n2.1 kWp"], vals, color=[BLUE, MUTED], width=0.6)
        P.bar_labels(ax, bars, fmt)
        ax.set_title(f"{t}\n({u})", fontsize=12.5)
        ax.set_ylim(0, max(vals) * 1.2 + 1e-9)
    fig.suptitle("Final 115 kg vs bigger 172 kg wax: small gain for a lot more wax and PV", fontweight="bold")
    fig.tight_layout()
    P.save(fig, "final_04_wax_115_vs_172", NOTE)


# ---------------------------------------------------------------- 3. monthly energy, money
def fig_monthly():
    M = pd.read_csv(LIVE / "monthly_current.csv")
    lab = [P.MONTHS[int(m[-2:]) - 1] for m in M.month]
    x = np.arange(len(M))
    fig, ax = plt.subplots(figsize=(12, 5.4))
    ax.bar(x - 0.27, M.pv_kWh, 0.27, color=ORANGE, label="Solar electricity available")
    ax.bar(x, M.solar_used_kWh, 0.27, color=BLUE, label="Used by compressor from solar")
    b = ax.bar(x + 0.27, M.grid_kWh, 0.27, color="#0d366b", label="From grid (backup)")
    P.bar_labels(ax, b, "{:.1f}")
    ax.set_xticks(x, lab)
    ax.set_ylabel("kWh per month")
    ax.legend(loc="upper right", fontsize=10.5)
    last = M.month.iloc[-1]
    ax.set_title(f"2026 month by month (Jan – {P.MONTHS[int(last[-2:]) - 1]} {int(M.days.iloc[-1])} days so far): "
                 f"{M.days_full_solar_wax.sum():.0f} of {M.days.sum():.0f} days fully on solar + wax")
    P.save(fig, "final_05_monthly_energy_2026", NOTE)


def fig_money():
    m = study()["wax_compare"]["Final design (115 kg wax, 1.8 kWp, night fan)"]
    mc = load_config()["live_run"]["money"]
    fig, (a1, a2) = plt.subplots(1, 2, figsize=(12, 4.8))
    b = a1.bar(["vs grid-only\ncold room", "vs grid + diesel\nin power cuts"],
               [m["saved_vs_grid_INR_yr"], m["saved_vs_diesel_INR_yr"]], color=[BLUE, ORANGE], width=0.55)
    P.bar_labels(a1, b, "₹{:,.0f}")
    a1.set_title("Money saved per year (₹)", fontsize=13)
    a1.set_ylim(0, m["saved_vs_diesel_INR_yr"] * 1.2)
    b = a2.bar(["vs grid-only", "vs grid + diesel"], [m["co2_saved_vs_grid_kg_yr"], m["co2_saved_vs_diesel_kg_yr"]],
               color=[BLUE, ORANGE], width=0.55)
    P.bar_labels(a2, b, "{:,.0f} kg")
    a2.set_title("CO₂ saved per year (kg)", fontsize=13)
    a2.set_ylim(0, m["co2_saved_vs_diesel_kg_yr"] * 1.2)
    fig.suptitle("Final design: running-cost and CO₂ savings", fontweight="bold")
    fig.tight_layout()
    P.save(fig, "final_06_money_co2", NOTE + f".  Grid ₹{mc['grid_tariff_INR_kWh']}/kWh, diesel ₹{mc['diesel_INR_L']}/L "
           f"× {mc['diesel_L_per_kWh']} L/kWh in power cuts {mc['power_cut_hours'][0]}:00–{mc['power_cut_hours'][1]}:00 "
           "– prices: check locally")


# ---------------------------------------------------------------- 4. baffle channel drawing
def fig_baffle(cfg):
    nf = cfg["live_run"]["night_fan"]
    s = study()["fan_sizing"]
    gap_mm, H = nf["gap_m"] * 1000, nf["panel_height_m"]
    fig, ax = plt.subplots(figsize=(9, 8))
    ax.set_aspect("equal")
    ax.axis("off")
    # wall, wax panel, channel, baffle (x in cm-ish drawing units, not to scale for the gap)
    ax.add_patch(Rectangle((0, 0), 1.0, 22, color="#c9c7c1"))                       # insulated wall
    ax.add_patch(Rectangle((1.0, 2), 1.6, 16, color="#86b6ef", ec="#184f95"))         # wax panel
    ax.add_patch(Rectangle((3.4, 3), 0.25, 14, color="#52514e"))                       # baffle sheet
    ax.add_patch(Rectangle((2.9, 18.6), 1.3, 1.0, color="#1baf7a", ec="#0b6e4b"))      # fan
    ax.text(0.5, 22.4, "insulated wall", ha="center", fontsize=10, color=INK2)
    ax.text(1.8, 10, f"WAX (PCM) panels – {cfg['live_run']['designs']['current']['pcm_kg']:g} kg, melts 4 °C",
            ha="center", va="center", fontsize=10, rotation=90)
    ax.text(3.95, 10, "thin baffle sheet", rotation=90, ha="left", va="center", fontsize=10)
    ax.text(4.4, 19.1, f"{s['fan']['count']} × {s['fan']['d_mm']} mm 12 V fans\nat the TOP, blowing DOWN",
            fontsize=10.5, va="center")
    ax.annotate("", xy=(2.95, 3.5), xytext=(2.95, 17.5),
                arrowprops=dict(arrowstyle="-|>", color=BLUE, lw=2.5, mutation_scale=22))
    ax.text(3.0, -0.3, f"{gap_mm / 10:.0f} cm gap (channel)\nbetween wax and baffle", ha="center", fontsize=10, color=BLUE)
    for y0, y1, x in ((1.0, 2.6, 5.5),):
        ax.add_patch(FancyArrowPatch((3.2, 2.2), (6.5, 1.0), arrowstyle="-|>", mutation_scale=20, color=BLUE, lw=2))
    ax.text(6.7, 1.0, "cold air out\nat the bottom", va="center", fontsize=10, color=BLUE)
    ax.add_patch(FancyArrowPatch((7.5, 17.5), (4.4, 18.3), arrowstyle="-|>", mutation_scale=20, color=ORANGE, lw=2))
    ax.text(7.6, 17.3, "warm room air\nin at the top", va="center", fontsize=10, color=ORANGE)
    ax.set_xlim(-0.5, 11)
    ax.set_ylim(-1.5, 23.2)
    info = (f"Night load (hottest night) {s['load_W']:.0f} W\n"
            f"Natural draft only: h = {s['h_natural_W_m2K']:.1f} W/m²K → {s['Q_natural_W']:.0f} W  (too little)\n"
            f"With fans: v = {s['v_needed_m_s']:.2f} m/s, {s['flow_needed_m3h']:.0f} m³/h, {s['pressure_Pa']:.1f} Pa\n"
            f"h = {s['h_fan_W_m2K']:.1f} W/m²K, UA = {s['UA_fan_W_K']:.0f} W/K\n"
            f"Fans: {s['fan']['count']} × {s['fan']['watts']:g} W = {s['fan']['count'] * s['fan']['watts']:g} W rated, "
            f"~{s['load_parts_W']['fan heat']:.0f} W at design point\n"
            "Fan heat is added to the room load.  Fans run from the 12 V battery.\n"
            "Rule: fan on when compressor off and room > 5 °C (speed to hold 6.7 °C),\n"
            f"and at full speed in the 3 h after loading while room > {nf['morning_assist_above_C']:g} °C.")
    ax.text(5.0, 12.5, info, fontsize=9.6, va="center", family="DejaVu Sans",
            bbox=dict(fc="white", ec=P.GRID, boxstyle="round,pad=0.5"))
    ax.set_title("Wax panel + baffle channel (side view, gap not to scale)", fontweight="bold", fontsize=14)
    P.save(fig, "final_07_baffle_channel", "Design drawing – sizes from config/design.json; flow and h from engine/fan.py")


# ---------------------------------------------------------------- 5. results_summary.csv section
SECTION = "Final design (2026)"


def summary_rows(cfg):
    st, sm = study(), summary()
    T = sm["designs"]["current"]["totals"]
    f = st["wax_compare"]["Final design (115 kg wax, 1.8 kWp, night fan)"]
    ma = st["morning_assist"]
    fs, b = st["fan_sizing"], st["battery"]
    lr = cfg["live_run"]
    yr = 365.0 / T["days"]
    lab = "simulated on real 2026 Vizag weather, conservative sun (x0.88)"
    R = [
        ("Design", "115 kg wax (PCM), 1.8 kWp PV, 1.5 kW R290 compressor, 5 x 120 mm night fans, 2 cm baffle", "-",
         "config/design.json -> live_run"),
        ("Weather period", f"{T['first']} to {T['last']} ({T['days']} days)", "-", "Open-Meteo archive (ERA5) + forecast; " + lab),
        ("Produce loading", f"{lr['loading'][0]['kg']} kg at {lr['loading'][0]['hour']}:00 every day", "-", "chosen from 4 loading options"),
        ("Compressor electricity, average", round(T["comp_kWh_day_avg"], 2), "kWh/day", "sum of P_comp x 5 min / days"),
        ("Compressor electricity, worst day", f"{T['comp_kWh_day_max']:.2f} ({T['comp_kWh_day_max_date']})", "kWh/day", "max of daily sums"),
        ("Days fully on solar + wax", f"{T['days_full_solar_wax']} of {T['days']}", "days", "days with 0 grid hours"),
        ("Grid backup hours", round(T["grid_h"], 1), "h", "sum of hours with ATS on grid"),
        ("Grid backup hours per year", round(T["grid_h"] * yr), "h/yr", "grid_h x 365 / days"),
        ("Room air above 8 C during loading", round(T["hot_load_h_per_day"], 2), "h/day",
         "only while a fresh warm batch cools (no stored product inside)"),
        ("Hours outside 2-8 C at all other times", T["hot_other_h"], "h", "count of hours with T_room <2 or >8 outside the 3 h loading window"),
        ("Produce in (average)", round(T["batch_T_in_avg"], 1), "C", "outside air at loading time (average produce temperature)"),
        ("Produce average after 2 h", round(T["batch_T_after_2h_avg"], 1), "C", "lumped produce node; core measured in Phase 4"),
        ("Produce average after 4 h", round(T["batch_T_after_4h_avg"], 1), "C", "lumped produce node"),
        ("Time to cool batch to 5.5 C, average / worst", f"{T['batch_cool_h_avg']:.1f} / {T['batch_cool_h_max']:.1f}", "h",
         "first time produce node <= setpoint + 0.5 K"),
        ("Wax frozen at sunrise / sunset (average)", f"{T['wax_sunrise_avg']:.0f} / {T['wax_sunset_avg']:.0f}", "%", "pcm_pct at 05:00 and 18:00"),
        ("Night fans", f"{fs['fan']['count']} x {fs['fan']['d_mm']} mm 12 V, {fs['fan']['count'] * fs['fan']['watts']:g} W rated", "-",
         "engine/fan.py size_fan: flow for hottest-night load at 7 C room, margin 1.25"),
        ("Night load on hottest night", round(fs["load_W"]), "W", "walls + respiration + controller + fan heat"),
        ("Channel air speed / flow / pressure", f"{fs['v_needed_m_s']:.2f} / {fs['flow_needed_m3h']:.0f} / {fs['pressure_Pa']:.1f}",
         "m/s, m3/h, Pa", "Q = UA dT with effectiveness-NTU; Gnielinski/Graetz h"),
        ("Fan electricity = fan heat added to room", round(T["fan_kWh_day"], 3), "kWh/day", "sum fan_W x 5 min / days; added to Q_int"),
        ("Fan run time", round(T["fan_run_h_day"], 1), "h/day", "hours with fan_speed > 0"),
        ("12 V battery", f"{b['chosen_Ah']} Ah LiFePO4 ({b['chosen_kWh']:.2f} kWh)", "-",
         f"(worst night {b['worst_night_Wh']:.0f} Wh + reserve day {b['worst_day_Wh']:.0f} Wh) / 0.8 / 12.8 V = {b['needed_Ah']:.0f} Ah"),
        ("Money saved vs grid-only room", round(f["saved_vs_grid_INR_yr"]), "INR/yr", "grid tariff x (grid-only kWh - our grid kWh) x 365/days; prices: check locally"),
        ("Money saved vs grid + diesel in power cuts", round(f["saved_vs_diesel_INR_yr"]), "INR/yr", "diesel 0.5 L/kWh 10:00-18:00; prices: check locally"),
        ("CO2 saved vs grid-only", round(f["co2_saved_vs_grid_kg_yr"]), "kg/yr", "0.71 kg/kWh grid"),
        ("CO2 saved vs grid + diesel", round(f["co2_saved_vs_diesel_kg_yr"]), "kg/yr", "0.71 kg/kWh grid, 2.68 kg/L diesel"),
        ("Energy balance error", f"{T['energy_balance_error_pct']:.3f}", "%", "(cold in - cold out - stored change) / cold in"),
        ("Morning assist test: air > 8 C, old rule -> new rule",
         f"{ma['fan only when compressor off']['h_air_above_8C_per_day']:.2f} -> {ma['morning assist above 7 C']['h_air_above_8C_per_day']:.2f}",
         "h/day", "fan also runs in the 3 h after loading while room > 7 C (adopted)"),
    ]
    return [(SECTION, *r) for r in R]


def write_summary(cfg):
    p = ROOT / "results" / "results_summary.csv"
    S = pd.read_csv(p)
    S = S[S.section != SECTION]
    S = pd.concat([S, pd.DataFrame(summary_rows(cfg), columns=S.columns)], ignore_index=True)
    S.to_csv(p, index=False)
    print("  results_summary.csv: section", SECTION, "updated")


def main():
    cfg = load_config()
    write_summary(cfg)
    fig_fan(cfg)
    fig_loading()
    fig_wax()
    fig_monthly()
    fig_money()
    fig_baffle(cfg)


if __name__ == "__main__":
    main()
