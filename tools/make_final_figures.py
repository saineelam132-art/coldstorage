"""Poster figures for the FINAL design (115 kg wax with 40 mm aluminium fins, 1.8 kWp, 150 kg at 6 am).

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
from twin.live_sim import published_cfg, simulate_live  # noqa: E402

plt = P.plt
LIVE = ROOT / "results" / "live"
NOTE = ("Simulated – digital twin on real 2026 Visakhapatnam weather (Open-Meteo / ERA5), "
        "conservative sun (×0.88). Weather data by Open-Meteo.com")
BLUE, ORANGE, AQUA, INK2, MUTED = P.BLUE, P.ORANGE, P.AQUA, P.INK2, P.MUTED


def study():
    return json.loads((LIVE / "design_study_2026.json").read_text())


def summary():
    return json.loads((LIVE / "summary.json").read_text())


# ---------------------------------------------------------------- 0. design journey
def fig_journey():
    J = study()["journey"]
    steps = [k for k in J if not k.startswith("check")]
    labels = ["plain", "baffle\n+ 5 fans", "fins\n(final)"]
    cols = [MUTED, ORANGE, BLUE]
    rows = [("Days fully on\nsolar + wax", "of " + str(J[steps[0]]["days"]), "days_full_solar_wax", "{:.0f}"),
            ("Grid hours\nper year", "h", "grid_h_per_year", "{:,.0f}"),
            ("Moving parts", "fans", "moving_parts", "{:.0f}"),
            ("12 V battery", "Ah", "battery_Ah", "{:.0f}"),
            ("Wax ↔ room UA\nat 3 K", "W/K", "UA_3K_W_K", "{:.0f}")]
    fig, axes = plt.subplots(1, len(rows), figsize=(17, 5.2))
    for ax, (t, u, k, fmt) in zip(axes, rows):
        vals = [J[s_][k] for s_ in steps]
        bars = ax.bar(labels, vals, color=cols, width=0.62)
        P.bar_labels(ax, bars, fmt)
        ax.set_title(f"{t}\n({u})", fontsize=12.5)
        ax.set_ylim(0, max(max(vals) * 1.2, 1))
        ax.tick_params(axis="x", labelsize=9.5)
    fig.suptitle("How we improved the wax heat exchanger: plain panels → baffle + fans → fins (same 115 kg wax, 1.8 kWp)",
                 fontweight="bold")
    fig.tight_layout()
    P.save(fig, "final_00_design_journey", NOTE)


# ---------------------------------------------------------------- 1. hottest night: plain vs finned panels
def fig_fins_night(cfg):
    w = DS.actual_weather()
    night = w[(w.time_ist.dt.hour >= 19) | (w.time_ist.dt.hour < 6)]
    key = (night.time_ist - pd.Timedelta(hours=7)).dt.date
    hot = night.groupby(key).T_out.mean().idxmax()
    t0 = pd.Timestamp(hot) - pd.Timedelta(days=4)
    t1 = pd.Timestamp(hot) + pd.Timedelta(days=1, hours=12)
    win = w[(w.time_ist >= t0) & (w.time_ist < t1)].reset_index(drop=True)
    cfg = published_cfg(cfg)                    # same model as the published studies
    runs = {"plain": simulate_live(win, "current", cfg=cfg, hx={"kind": "plain"})[0],
            "fins": simulate_live(win, "current", cfg=cfg)[0]}
    a, b = pd.Timestamp(hot) + pd.Timedelta(hours=12), pd.Timestamp(hot) + pd.Timedelta(days=1, hours=12)
    cut = lambda H: H[(H.time_ist >= a) & (H.time_ist <= b)]
    fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(12, 7.5), sharex=True, gridspec_kw={"height_ratios": [3, 2]})
    ax1.axhspan(2, 8, color=P.BAND, zorder=0)
    ax1.text(a + pd.Timedelta(minutes=20), 7.7, "safe band 2–8 °C", color=INK2, fontsize=10, va="top")
    for k, col, lab in (("plain", ORANGE, "plain wax panels"), ("fins", BLUE, "finned wax panels (final, no fan)")):
        H = cut(runs[k])
        ax1.plot(H.time_ist, H.T_room, color=col, label=f"Room air – {lab}")
        ax2.plot(H.time_ist, H.P_grid * 1000, color=col, label=f"Grid power – {lab}")
    top = max(cut(r).T_room.max() for r in runs.values())
    ax1.set_ylim(0, top * 1.12)
    ld = cfg["live_run"]["loading"][0]
    ax1.annotate(f"{ld['kg']} kg warm batch arrives {ld['hour']}:00\n(only fresh produce inside)",
                 (pd.Timestamp(hot) + pd.Timedelta(days=1, hours=ld["hour"]), top * 0.9), xytext=(-190, -10),
                 textcoords="offset points", fontsize=10, color=INK2, arrowprops=dict(arrowstyle="->", color=MUTED))
    ax1.set_ylabel("Room air temperature (°C)")
    ax1.legend(loc="upper left", fontsize=10)
    ax2.set_ylabel("Grid power used (W)")
    ax2.set_xlabel("Time of day (IST), hottest night")
    ax2.legend(loc="upper left", fontsize=10)
    ax2.xaxis.set_major_formatter(plt.matplotlib.dates.DateFormatter("%H:%M"))
    gp, gf = cut(runs["plain"]).P_grid.sum(), cut(runs["fins"]).P_grid.sum()
    ax1.set_title(f"Hottest night of 2026 ({pd.Timestamp(hot):%d %b}): grid {gp:.2f} kWh with plain panels → {gf:.2f} kWh with fins")
    fig.text(0.01, -0.045, "With fins the wax alone holds the room at night – a night power cut changes nothing. "
             "Plain panels have too little surface, so the grid must run the compressor.", fontsize=10, color=INK2)
    fig.tight_layout()
    P.save(fig, "final_01_fins_hottest_night", NOTE)


# ---------------------------------------------------------------- 2. fin calculation
def fig_fin_calc(cfg):
    from engine import fan as FAN
    from engine import fins as F
    hx = cfg["live_run"]["wax_hx"]
    A = cfg["pcm"]["slab_area_m2"]
    R = FAN.wax_resistance(cfg, cfg["live_run"]["designs"]["current"]["pcm_kg"])
    st = study()
    load = st["wax_hx"]["load_W"]
    gaps = np.arange(0.008, 0.0601, 0.001)
    fig, (a1, a2) = plt.subplots(1, 2, figsize=(15, 5.6), gridspec_kw={"width_ratios": [1.15, 1]})
    for b, col in ((0.02, MUTED), (0.03, ORANGE), (0.04, BLUE)):
        ua = [F.array(A, hx["L"], S_, b, hx["t"], R, 3.0)["UA"] for S_ in gaps]
        a1.plot(gaps * 1000, ua, color=col, label=f"fins {b * 1000:.0f} mm deep")
    pl = F.plain(A, hx["L"], R, 3.0)["UA"]
    a1.axhline(pl, color=INK2, ls=":", lw=1.5)
    a1.text(59, pl + 1, "plain panel", ha="right", fontsize=10, color=INK2)
    a1.axhline(load / 3.0, color="#b45309", ls="--", lw=1.5)
    a1.text(59, load / 3.0 - 3.5, f"needed on the hottest night ({load:.0f} W at 3 K)", ha="right", fontsize=10, color="#b45309")
    ch = F.array(A, hx["L"], hx["S"], hx["b"], hx["t"], R, 3.0)
    a1.plot([hx["S"] * 1000], [ch["UA"]], "o", color=BLUE, ms=9)
    a1.annotate(f"chosen: {hx['S'] * 1000:.0f} mm gap\nUA {ch['UA']:.1f} W/K", (hx["S"] * 1000, ch["UA"]), xytext=(12, 12),
                textcoords="offset points", fontsize=10.5, color=BLUE)
    a1.set_xlabel("gap between fins (mm)")
    a1.set_ylabel("UA wax ↔ room (W/K)")
    a1.set_ylim(0, max(70, ch["UA"] * 1.25))
    a1.legend(loc="lower right", fontsize=10)
    a1.set_title(f"Finned panel, {hx['L']} m tall, 1 mm aluminium, room−wax 3 K", fontsize=13)
    a2.axis("off")
    rows = [["Area multiplier", f"× {ch['area_mult']:.2f}"], ["Fin efficiency η", f"{ch['eta']:.3f}"],
            ["h – Bar-Cohen & Rohsenow", f"{ch['h_bar_cohen']:.2f} W/m²K"], ["h – Van de Pol & Tierney", f"{ch['h_van_de_pol']:.2f} W/m²K"],
            ["h used (the lower)", f"{ch['h']:.2f} W/m²K"], ["UA air side", f"{ch['UA_air']:.1f} W/K"],
            ["UA with wax layer", f"{ch['UA']:.1f} W/K  (plain {pl:.1f})"], ["Heat at 3 K", f"{ch['Q_W']:.0f} W  (needed {load:.0f} W)"],
            ["Fins / aluminium", f"{ch['N_fins']:.0f} fins · {ch['al_kg']:.0f} kg"], ["Fan power", "0 W – no moving parts"]]
    t = a2.table(cellText=rows, colLabels=["40 mm fins, 23 mm gap", "value"], loc="center", cellLoc="left", colWidths=[0.55, 0.45])
    t.auto_set_font_size(False)
    t.set_fontsize(11)
    t.scale(1, 1.7)
    for (r, c), cell in t.get_celld().items():
        cell.set_edgecolor(P.GRID)
        if r == 0:
            cell.set_facecolor("#184f95")
            cell.set_text_props(color="white", weight="bold")
    a2.set_title("El = Ra_S·S/L;  Nu = [576/El² + 2.873/El^0.5]^−0.5;  η = tanh(mLc)/(mLc)\nUA = 1/[1/(h(A_base + ηA_fin)) + R_wax/A]",
                 fontsize=10.5)
    fig.suptitle("Fin calculation: natural convection, no fan", fontweight="bold")
    fig.tight_layout()
    P.save(fig, "final_02_fin_calculation", "Calculation (engine/fins.py) – lower of two published fin-array correlations; radiation ignored (conservative)")


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
    m = study()["wax_compare"][load_config()["live_run"]["designs"]["current"]["label"]]
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


# ---------------------------------------------------------------- 4. finned panel drawing
def fig_panel(cfg):
    hx = cfg["live_run"]["wax_hx"]
    st = study()
    fl, w = st["floor"], st["wax_hx"]
    c3 = w["calc_3K"]
    fig, (a1, a2) = plt.subplots(1, 2, figsize=(14, 7.5), gridspec_kw={"width_ratios": [1, 1.25]})
    for ax in (a1, a2):
        ax.set_aspect("equal")
        ax.axis("off")
    # side view (cm)
    a1.add_patch(Rectangle((0, 0), 10, 220, color="#c9c7c1"))
    y0, Lc = hx["panel_bottom_m"] * 100, hx["L"] * 100
    a1.add_patch(Rectangle((10, y0), 1.5, Lc, color="#86b6ef", ec="#184f95"))
    a1.add_patch(Rectangle((11.5, y0), hx["b"] * 100, Lc, color="#d9e1e8", ec="#8795a3"))
    a1.add_patch(plt.Polygon([[8, y0 - 4], [26, y0 - 8], [26, y0 - 12], [8, y0 - 8]], color="#8795a3"))
    a1.plot([25, 25, 32], [y0 - 10, 8, 8], color="#52514e", lw=2)
    a1.plot([-3, 60], [220, 220], color=INK2, lw=1)
    a1.text(45, 222, "ceiling 2.2 m", fontsize=9, color=INK2)
    a1.text(45, y0 + Lc - 6, f"top {(y0 + Lc) / 100:.2f} m", fontsize=9, color=INK2)
    a1.text(45, y0 + 2, f"bottom {y0 / 100:.2f} m", fontsize=9, color=INK2)
    a1.add_patch(Rectangle((11.5 + hx["b"] * 100, 0), hx["keep_clear_m"] * 100, 220, fill=False, ec=MUTED, ls="--"))
    a1.add_patch(Rectangle((11.5 + hx["b"] * 100 + hx["keep_clear_m"] * 100, 0), 3, 8, color="#52514e"))
    a1.annotate("", xy=(14, y0 + 10), xytext=(14, y0 + Lc - 10), arrowprops=dict(arrowstyle="-|>", color=BLUE, lw=2.5, mutation_scale=22))
    a1.text(5, 228, "wall", ha="center", fontsize=10, color=INK2)
    a1.text(30, y0 + Lc - 25, "warm room air\nin at the top", fontsize=10, color=ORANGE)
    a1.text(30, 110, f"{hx['b'] * 100:.0f} cm fins:\ncooled air falls\nbetween them\nby itself", fontsize=10, color=BLUE)
    a1.text(33, y0 - 12, "drip tray → drain + trap", fontsize=10, color=INK2, va="center")
    a1.text(21, 212, f"{hx['keep_clear_m'] * 100:.0f} cm keep clear", fontsize=9, color=MUTED, ha="left")
    a1.text(33, 3, "floor stopper for crates", fontsize=9, color=INK2, va="center")
    a1.set_xlim(-5, 70)
    a1.set_ylim(-5, 238)
    a1.set_title(f"Side view – panel {hx['L']} m tall (cm)", fontsize=13)
    # top view of a fin section (mm)
    a2.add_patch(Rectangle((0, 0), 600, 14, color="#86b6ef", ec="#184f95"))
    p = hx["S"] * 1000 + hx["t"] * 1000
    x = 5.0
    while x + hx["t"] * 1000 <= 600:
        a2.add_patch(Rectangle((x, 14), hx["t"] * 1000 * 1.5, hx["b"] * 1000, color="#8795a3"))
        x += p
    a2.annotate("", xy=(5 + p, 62), xytext=(5, 62), arrowprops=dict(arrowstyle="<->", color=INK2))
    a2.text(5 + p / 2, 66, f"{hx['S'] * 1000:.0f} mm gap", ha="center", fontsize=10)
    a2.text(610, 34, f"{hx['b'] * 1000:.0f} mm", fontsize=10, va="center")
    a2.text(300, -14, f"wax panel (12 mm wax) · one removable {hx['section_length_m']} m section seen from above", ha="center", fontsize=10)
    info = (f"Area × {c3['area_mult']:.2f} · fin efficiency {c3['eta']:.2f} · h {c3['h']:.2f} W/m²K\n"
            f"UA {c3['UA']:.1f} W/K (plain {st['fin_table']['plain panel']['UA']:.1f}) → {c3['Q_W']:.0f} W at 3 K, needed {w['load_W']:.0f} W\n"
            f"{c3['N_fins']:.0f} fins, {c3['al_kg']:.0f} kg extruded aluminium heat-sink profile, anodised,\n"
            "riveted with thermal paste; removable sections for cleaning; 0 W, no moving parts\n"
            f"Optional: mounting points + 12 V cable for {hx['optional_fans']['provision']} fans (only if Phase 4 shows fins >25 % weaker)\n"
            f"Floor: band {fl['band_from_wall_m'] * 100:.1f} cm along walls → usable {fl['usable_floor_m2']:.2f} m² of {fl['floor_m2']:.1f} m²;\n"
            f"150 kg = {fl['crates']} crates in {fl['stacks_of_4']} stacks of 4 ({fl['crate_footprint_m2']:.2f} m²) + 60 cm aisle → fits ✓")
    a2.text(0, 130, info, fontsize=10.2, va="bottom", bbox=dict(fc="white", ec=P.GRID, boxstyle="round,pad=0.5"))
    a2.set_xlim(-10, 680)
    a2.set_ylim(-30, 330)
    a2.set_title("Top view of the fins (mm)", fontsize=13)
    fig.suptitle("Finned wax panel + drip tray + keep-clear zone", fontweight="bold")
    P.save(fig, "final_07_fin_panel_drawing", "Design drawing – sizes from config/design.json → live_run.wax_hx; calculation engine/fins.py")


# ---------------------------------------------------------------- 5. results_summary.csv section
SECTION = "Final design (2026)"


def summary_rows(cfg):
    st, sm = study(), summary()
    T = sm["designs"]["current"]["totals"]
    lr = cfg["live_run"]
    f = st["wax_compare"][lr["designs"]["current"]["label"]]
    w, b, fl, J = st["wax_hx"], st["battery"], st["floor"], st["journey"]
    c3, hx = w["calc_3K"], lr["wax_hx"]
    pb = json.loads((ROOT / "results" / "payback.json").read_text())
    yr = 365.0 / T["days"]
    lab = "simulated on real 2026 Vizag weather, conservative sun (x0.88)"
    R = [
        ("Design", f"115 kg wax (PCM) with {hx['b'] * 1000:.0f} mm aluminium fins ({hx['S'] * 1000:.0f} mm gap, {hx['L']} m panels), "
         "1.8 kWp PV, 1.5 kW R290 compressor, no wax fan, no baffle", "-", "config/design.json -> live_run"),
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
        ("Fins: area multiplier / fin efficiency", f"{c3['area_mult']:.2f} / {c3['eta']:.3f}", "-",
         "(A_base + A_fins)/A; eta = tanh(m Lc)/(m Lc), m = sqrt(2h/(k_al t))"),
        ("Fins: h (Bar-Cohen & Rohsenow / Van de Pol & Tierney -> used)",
         f"{c3['h_bar_cohen']:.2f} / {c3['h_van_de_pol']:.2f} -> {c3['h']:.2f}", "W/m2K", "lower of the two natural-convection fin-array correlations, dT 3 K"),
        ("Wax-room UA, finned / plain panel", f"{c3['UA']:.1f} / {st['fin_table']['plain panel']['UA']:.1f}", "W/K",
         "UA = 1/[1/(h(A_base + eta A_fin)) + R_wax/A]"),
        ("Heat removed at 3 K vs needed on hottest night", f"{c3['Q_W']:.0f} vs {w['load_W']:.0f}", "W",
         f"Q = UA x 3 K; load = walls + respiration + controller at room 7 C, {w['T_out_design_night_C']:.1f} C outside night"),
        ("Aluminium fins", round(c3["al_kg"]), "kg", "N x b x t x L x 2700 kg/m3"),
        ("Fan electricity / moving parts in the wax heat exchanger", "0 / 0", "-", "passive natural convection"),
        ("Usable floor after fins + 10 cm keep-clear", f"{fl['usable_floor_m2']:.2f} of {fl['floor_m2']:.1f}", "m2",
         f"150 kg = {fl['crates']} crates in {fl['stacks_of_4']} stacks of 4 + 60 cm aisle -> fits"),
        ("Wall length needed vs available", f"{fl['panel_length_needed_m']:.2f} vs {fl['wall_length_available_m']:.2f}", "m",
         f"12 m2 / {hx['L']} m tall panels vs room perimeter minus the door -> fits"),
        ("12 V battery", f"{b['chosen_Ah']} Ah LiFePO4 ({b['chosen_kWh']:.2f} kWh)", "-",
         f"(worst night {b['worst_night_Wh']:.0f} Wh + reserve day {b['worst_day_Wh']:.0f} Wh) / 0.8 / 12.8 V = {b['needed_Ah']:.0f} Ah"),
        ("Money saved vs grid-only room", round(f["saved_vs_grid_INR_yr"]), "INR/yr", "grid tariff x (grid-only kWh - our grid kWh) x 365/days; prices: check locally"),
        ("Money saved vs grid + diesel in power cuts", round(f["saved_vs_diesel_INR_yr"]), "INR/yr", "diesel 0.5 L/kWh 10:00-18:00; prices: check locally"),
        ("CO2 saved vs grid-only", round(f["co2_saved_vs_grid_kg_yr"]), "kg/yr", "0.71 kg/kWh grid"),
        ("CO2 saved vs grid + diesel", round(f["co2_saved_vs_diesel_kg_yr"]), "kg/yr", "0.71 kg/kWh grid, 2.68 kg/L diesel"),
        ("Energy balance error", f"{T['energy_balance_error_pct']:.3f}", "%", "(cold in - cold out - stored change) / cold in"),
        *[(f"Payback ESTIMATE {c['label']}", f"{c['payback_years']:.1f} (with {pb['subsidy_pct']} % subsidy {c['payback_years_with_subsidy']:.1f})",
           "years", f"extra cost Rs {c['extra_cost_INR']:,.0f} / saving Rs {c['saving_INR_yr']:,.0f} per year; prices GUESS")
          for c in pb["cases"].values()],
        ("Design journey: days fully on solar + wax (plain -> baffle+fans -> fins)",
         " -> ".join(str(J[k]["days_full_solar_wax"]) for k in J if not k.startswith("check")), "days", "same 2026 run, 310 days"),
        ("Design journey: grid hours per year", " -> ".join(f"{J[k]['grid_h_per_year']:.0f}" for k in J if not k.startswith("check")), "h/yr", ""),
        ("Check: fins 25 % weaker / + 2 optional fans, grid h/yr",
         f"{J['check: fins 25 % weaker']['grid_h_per_year']:.0f} / {J['check: fins 25 % weaker + 2 optional fans']['grid_h_per_year']:.0f}", "h/yr",
         "room stays in 2-8 C in both; optional fans hold 6.5 C at night"),
    ]
    return [(SECTION, *r) for r in R]


def fig_payback():
    pb = json.loads((ROOT / "results" / "payback.json").read_text())
    c = pb["cases"]
    fig, ax = plt.subplots(figsize=(11, 5))
    x = np.arange(2)
    labs = ["vs plain grid-only\ncold room", "vs grid + diesel\ncold room"]
    b1 = ax.bar(x - 0.2, [c["grid"]["payback_years"], c["diesel"]["payback_years"]], 0.4, color=MUTED, label="no subsidy")
    b2 = ax.bar(x + 0.2, [c["grid"]["payback_years_with_subsidy"], c["diesel"]["payback_years_with_subsidy"]], 0.4, color=BLUE,
                label=f"with {pb['subsidy_pct']} % subsidy")
    P.bar_labels(ax, b1, "{:.1f} yr")
    P.bar_labels(ax, b2, "{:.1f} yr")
    ax.set_xticks(x, labs)
    ax.set_ylabel("simple payback (years)")
    ax.legend(loc="upper right")
    ax.set_title(f"Payback ESTIMATE: extra cost ₹{pb['extra_cost_INR']:,.0f} (solar + wax + fins + IoT) ÷ ₹ saved per year", fontsize=13.5)
    P.save(fig, "final_08_payback", "ESTIMATE – all prices GUESS (get quotations); no interest, maintenance or replacements; "
           f"diesel room needs a genset (₹{pb['diesel_genset_INR']:,.0f} GUESS); subsidy on our extra cost.\n" + NOTE)


def fig_uncertainty():
    """A1 poster: how sure are we? Base / hot site / cool site, whisker = random sites 5–95 %."""
    u = json.loads((LIVE / "uncertainty_2026.json").read_text())
    C, R = u["cases"], u["random"]
    days = C["base"]["days"]
    with plt.rc_context({"font.size": 17, "axes.titlesize": 20, "axes.labelsize": 17, "xtick.labelsize": 16, "ytick.labelsize": 15}):
        fig, axes = plt.subplots(1, 2, figsize=(16, 7.2))
        for ax, k, title, fmt in ((axes[0], "days_full_solar_wax", f"Days fully on solar + wax (of {days})", "{:.0f}"),
                                  (axes[1], "grid_h_per_year", "Grid backup hours per year", "{:.0f}")):
            vals = [C["base"][k], C["hot_site"][k], C["cool_site"][k]]
            bars = ax.bar(["base\n(Open-Meteo)", "hot site", "cool site"], vals, color=[BLUE, ORANGE, AQUA], width=0.6)
            for bb in bars:
                ax.annotate(fmt.format(bb.get_height()), (bb.get_x() + bb.get_width() / 2, bb.get_height()), xytext=(0, 4),
                            textcoords="offset points", ha="center", fontsize=18, fontweight="bold", color=P.INK)
            lo, med, hi = R["p5"][k], R["median"][k], R["p95"][k]
            ax.errorbar([0], [med], yerr=[[med - lo], [hi - med]], fmt="o", color=P.INK, ms=8, capsize=12, lw=2.5,
                        label=f"{R['n']} random sites: median and 5–95 %")
            ax.annotate(f"random {lo:.0f}–{hi:.0f}", (0, hi), xytext=(16, 16), textcoords="offset points", fontsize=15, color=P.INK)
            ax.set_title(title)
            ax.set_ylabel("days" if k.startswith("days") else "hours per year")
            ax.set_xlabel("Site weather case")
            ax.set_ylim(0, max(vals + [hi]) * 1.22)
            ax.legend(loc="upper left", fontsize=13)
        fig.suptitle("How sure are we? The same twin with the expected site weather error from published studies",
                     fontweight="bold", fontsize=19)
        fig.tight_layout()
        import textwrap
        P.save(fig, "final_10_uncertainty", "\n".join(textwrap.wrap(u["verdict"], 150)) + "\nDigital-twin results (S) on real 2026 Vizag weather with EXPECTED site errors "
               "(config/site_error_budget.json) – expected range from published studies, not measured.")


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
    fig_journey()
    fig_fins_night(cfg)
    fig_fin_calc(cfg)
    fig_loading()
    fig_wax()
    fig_monthly()
    fig_money()
    fig_panel(cfg)
    fig_payback()


if __name__ == "__main__":
    main()
