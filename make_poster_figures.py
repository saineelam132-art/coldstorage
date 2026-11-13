"""Export the poster graphs (300-dpi PNG + SVG) into figures/.

    python -m twin.run_all          (first, makes results/)
    python make_poster_figures.py

Every graph is drawn from numbers in results/ or from the engine - nothing is typed in.
Colours: a colour-blind-checked palette (blue / orange / aqua); heat maps use one hue,
light = low, dark = high. Every series is also labelled in words.
"""
import json
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402
from matplotlib.colors import LinearSegmentedColormap  # noqa: E402

from engine import loads, r290  # noqa: E402
from engine.config import load_config, load_crops  # noqa: E402
from engine.pcm_slab import simulate_slab  # noqa: E402

ROOT = Path(__file__).resolve().parent
RES = ROOT / "results"
OUT = ROOT / "figures"

BLUE, ORANGE, AQUA = "#2a78d6", "#eb6834", "#1baf7a"
INK, INK2, MUTED, GRID, SURFACE = "#0b0b0b", "#52514e", "#8a8984", "#e4e3df", "#ffffff"
BAND = "#eaf2fc"
SEQ = LinearSegmentedColormap.from_list("blue", ["#cde2fb", "#86b6ef", "#3987e5", "#256abf", "#184f95", "#0d366b"])
SIM_NOTE = ("How we chose the size (NASA POWER 2025 study) – simulated digital twin, real Visakhapatnam weather 2025. "
            "Final-design results: see figures/final_*")

plt.rcParams.update({
    "font.family": "DejaVu Sans", "font.size": 13, "axes.titlesize": 16, "axes.titleweight": "bold",
    "axes.labelsize": 13, "axes.edgecolor": MUTED, "axes.labelcolor": INK2, "xtick.color": INK2,
    "ytick.color": INK2, "axes.spines.top": False, "axes.spines.right": False, "axes.grid": True,
    "grid.color": GRID, "grid.linewidth": 0.8, "axes.axisbelow": True, "legend.frameon": False,
    "figure.facecolor": SURFACE, "axes.facecolor": SURFACE, "lines.linewidth": 2.2,
    "svg.fonttype": "none",
})
MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]


def save(fig, name, note=SIM_NOTE):
    from tools.axislabels import ensure_axis_labels
    ensure_axis_labels(fig, name)                      # every graph names its x and y axis
    if note:
        fig.text(0.01, -0.06, note, fontsize=9, color=MUTED, ha="left", va="top")
    OUT.mkdir(exist_ok=True)
    for ext in ("png", "svg"):
        fig.savefig(OUT / f"{name}.{ext}", dpi=300, bbox_inches="tight")
    plt.close(fig)
    print("  saved", name)


def bar_labels(ax, bars, fmt="{:.0f}", inside=False):
    for b in bars:
        v = b.get_height()
        ax.annotate(fmt.format(v), (b.get_x() + b.get_width() / 2, v), xytext=(0, 3),
                    textcoords="offset points", ha="center", va="bottom", fontsize=10, color=INK2)


# ------------------------------------------------------------------ weather
def fig_weather():
    m = pd.read_csv(RES / "weather_monthly.csv")
    fig, ax = plt.subplots(figsize=(11, 5.2))
    x = np.arange(12)
    w = 0.38
    ax.axhspan(5.0, 5.2, color="#d6e6f9", zorder=0, label="Old report: 5.0–5.2 annual")
    b1 = ax.bar(x - w / 2 - 0.01, m["ghi_2025_kWh_m2_day"], w, color=BLUE, label="2025 (used in the twin)")
    b2 = ax.bar(x + w / 2 + 0.01, m["ghi_longterm_kWh_m2_day"], w, color=ORANGE, label="Long-term mean 2001–2024")
    for b in (b1, b2):
        for r in b:
            r.set_edgecolor(SURFACE)
    bar_labels(ax, b1, "{:.1f}")
    ax.set_xticks(x, MONTHS)
    ax.set_ylabel("Sunlight on flat ground (GHI), kWh/m²/day")
    ax.set_ylim(0, 7.2)
    s = pd.read_csv(RES / "results_summary.csv")
    g25 = float(s.loc[s.item == "Mean daily sunlight on flat ground (GHI)", "value"].iloc[0])
    glt = float(s.loc[s.item == "Long-term mean GHI 2001-2024", "value"].iloc[0])
    ax.set_title(f"Visakhapatnam sunlight: 2025 = {g25:.2f}, long-term = {glt:.2f} kWh/m²/day")
    ax.legend(loc="upper center", ncol=3, bbox_to_anchor=(0.5, -0.1), fontsize=11)
    save(fig, "01_weather_monthly", "Source: NASA POWER (CERES SYN1deg), cell 17.5 N 83.5 E")


def fig_day_counts():
    c = pd.read_csv(RES / "day_counts.csv", index_col=0)
    c = c.drop(index="Whole year")
    fig, ax = plt.subplots(figsize=(11, 5))
    y = np.arange(len(c))[::-1]
    left = np.zeros(len(c))
    for col, colr, lab in [("sunny", ORANGE, "Sunny ≥ 5.0"), ("cloudy", BLUE, "Cloudy 2.5–5.0"),
                           ("rainy", AQUA, "Rainy < 2.5")]:
        bars = ax.barh(y, c[col], left=left, color=colr, edgecolor=SURFACE, linewidth=2, height=0.6, label=lab)
        for b, v, l0 in zip(bars, c[col], left):
            if v >= 4:
                ax.text(l0 + v / 2, b.get_y() + b.get_height() / 2, f"{v}", ha="center", va="center",
                        color="white", fontsize=12, fontweight="bold")
        left += c[col].values
    ax.set_yticks(y, c.index)
    ax.set_xlabel("Days (classified by daily panel irradiation, kWh/m²)")
    ax.set_ylabel("Season")
    tot = pd.read_csv(RES / "day_counts.csv", index_col=0).loc["Whole year"]
    ax.set_title(f"2025: {tot.sunny} sunny, {tot.cloudy} cloudy, {tot.rainy} rainy days")
    ax.legend(loc="lower right", ncol=3, bbox_to_anchor=(1, -0.32))
    ax.grid(axis="y", visible=False)
    save(fig, "02_day_counts", "Source: NASA POWER 2025; panel tilt 17° south")


# ------------------------------------------------------------- year results
def fig_monthly_energy():
    h = pd.read_csv(RES / "year_recommended_hourly.csv", index_col=0, parse_dates=True)
    m = pd.DataFrame({
        "pv": h["P_pv"].resample("ME").sum(),
        "comp": ((h["Q_coil_air"] + h["Q_coil_pcm"]) / 1).resample("ME").sum(),
        "used": h["P_solar_used"].resample("ME").sum(),
        "grid": h["P_grid"].resample("ME").sum(),
    })
    fig, ax = plt.subplots(figsize=(11, 5.2))
    x = np.arange(12)
    w = 0.27
    b1 = ax.bar(x - w, m["pv"], w, color=ORANGE, label="Solar electricity available")
    b2 = ax.bar(x, m["used"] + m["grid"], w, color=BLUE, label="Compressor electricity")
    b3 = ax.bar(x + w, m["comp"], w, color=AQUA, label="Cooling delivered (heat removed)")
    for bs in (b1, b2, b3):
        for r in bs:
            r.set_edgecolor(SURFACE)
    ax.set_xticks(x, MONTHS)
    ax.set_ylabel("Energy per month, kWh")
    ax.set_title("Monthly solar electricity vs. cooling (recommended design)")
    ax.legend(loc="upper center", ncol=3, bbox_to_anchor=(0.5, -0.1), fontsize=11)
    save(fig, "10_monthly_energy")


def fig_parametric_heatmap():
    p = pd.read_csv(RES / "parametric.csv")
    rec = json.loads((RES / "recommended_overrides.json").read_text())
    rm, rpv, rq = rec["pcm"]["mass_kg"], rec["pv"]["rated_kWp"], rec["refrigeration"]["design_capacity_kW"]
    comps = sorted(p.Qmax_kW.unique())
    vmax = p.grid_hours.max()
    fig, axes = plt.subplots(1, len(comps), figsize=(15, 6), sharey=True)
    for ax, q in zip(axes, comps):
        g = p[p.Qmax_kW == q].pivot(index="pcm_mass_kg", columns="pv_kWp", values="grid_hours")
        d = p[p.Qmax_kW == q].pivot(index="pcm_mass_kg", columns="pv_kWp", values="pct_days_full_solar_pcm")
        im = ax.imshow(g.values, cmap=SEQ, vmin=0, vmax=vmax, aspect="auto", origin="lower")
        for i in range(g.shape[0]):
            for j in range(g.shape[1]):
                v = g.values[i, j]
                ax.text(j, i, f"{v:.0f} h\n{d.values[i, j]:.0f}%", ha="center", va="center", fontsize=9.5,
                        color="white" if v > vmax * 0.45 else INK)
        ax.set_xticks(range(g.shape[1]), [f"{c:g}" for c in g.columns])
        ax.set_yticks(range(g.shape[0]), [f"{r:g}" for r in g.index])
        ax.set_xlabel("PV size, kWp")
        ax.set_title(f"Compressor {q:g} kW", fontsize=14)
        ax.grid(False)
        if q == rq:
            i = list(g.index).index(rm)
            j = list(g.columns).index(rpv)
            ax.add_patch(plt.Rectangle((j - 0.5, i - 0.5), 1, 1, fill=False, ec=ORANGE, lw=3.5))
            ax.annotate("recommended", (j, i + 0.5), xytext=(0, 6), textcoords="offset points",
                        ha="center", color=INK, fontsize=10, fontweight="bold")
    axes[0].set_ylabel("PCM mass, kg")
    cb = fig.colorbar(im, ax=axes, shrink=0.85, pad=0.02)
    cb.set_label("Grid backup hours per year (lower is better)")
    fig.suptitle("Parametric study – grid backup hours and % of days fully on solar + PCM",
                 fontweight="bold", fontsize=16)
    save(fig, "03_parametric_heatmap")


def fig_pcm_heatmap():
    h = pd.read_csv(RES / "year_recommended_hourly.csv", index_col=0, parse_dates=True)
    t = h.pivot_table(index=h.index.hour, columns=h.index.month, values="pcm_pct", aggfunc="mean")
    fig, ax = plt.subplots(figsize=(11, 6))
    vmin = max(0, int(np.floor(np.nanmin(t.values) / 10) * 10))
    im = ax.imshow(t.values, cmap=SEQ, vmin=vmin, vmax=100, aspect="auto", origin="lower")
    ax.set_xticks(range(12), MONTHS)
    ax.set_yticks(range(0, 24, 3), [f"{x:02d}:00" for x in range(0, 24, 3)])
    ax.set_ylabel("Hour of day (IST)")
    ax.grid(False)
    cb = fig.colorbar(im, ax=ax, pad=0.02)
    cb.set_label(f"PCM battery % (frozen fraction), monthly average\n(scale starts at {vmin} %)")
    ax.set_title("PCM battery level through the day and the year (recommended design)")
    save(fig, "04_pcm_battery_heatmap")


def fig_power_cut():
    c = pd.read_csv(RES / "power_cut_night.csv", header=[0, 1], index_col=0, parse_dates=True)
    s = pd.read_csv(RES / "results_summary.csv")
    meth = s.loc[s.section == "Power-cut night", "formula_or_method"].iloc[0]
    fig, ax = plt.subplots(figsize=(11, 5.5))
    idx = c.index
    day = idx[0].normalize()
    start, end = day + pd.Timedelta(hours=18), day + pd.Timedelta(hours=30)
    ax.axvspan(start, end, color="#f1f1ef", zorder=0)
    ax.text(start + (end - start) / 2, 12.0, "Power cut: no grid, no sun", ha="center", fontsize=11, color=INK2)
    ax.axhspan(2, 8, color=BAND, zorder=0)
    ax.text(idx[0], 2.2, " safe band 2–8 °C", fontsize=10, color=INK2)
    lines = [("with PCM", BLUE, "-"), ("without PCM", ORANGE, "-"),
             ("with PCM, light room", BLUE, "--"), ("without PCM, light room", ORANGE, "--")]
    for name, col, ls in lines:
        y = c[(name, "T_room")]
        tmax = y[start:end].max()
        ax.plot(idx, y, color=col, ls=ls, label=f"{name} – max {tmax:.1f} °C during cut")
    ax.set_ylim(1, 12.5)
    ax.set_ylabel("Room temperature, °C")
    ax.set_title(f"Hottest night of 2025 ({day:%d %b}) with a 12-hour power cut")
    ax.legend(loc="upper center", fontsize=10.5, ncol=2, bbox_to_anchor=(0.5, -0.1))
    ax.xaxis.set_major_formatter(matplotlib.dates.DateFormatter("%H:%M"))
    save(fig, "05_power_cut_night", SIM_NOTE + ". Full room = 600 kg stored; light room = 200 kg.")


def fig_comparisons():
    comp = pd.read_csv(RES / "comparisons.csv")
    pairs = ["PCM", "Door curtain", "Charging", "Charging (current design)"]
    titles = {"PCM": "With vs. without PCM", "Door curtain": "Strip curtain vs. none",
              "Charging": "Normal vs. forecast charging", "Charging (current design)": "Same, current design"}
    fig, axes = plt.subplots(1, 4, figsize=(15, 5))
    for ax, p in zip(axes, pairs):
        r = comp[(comp.comparison == p) & (comp.metric == "grid_hours")].iloc[0]
        vals = [r.value_A, r.value_B]
        bars = ax.bar([0, 1], vals, color=[BLUE, ORANGE], width=0.6, edgecolor=SURFACE)
        for b, v in zip(bars, vals):
            ax.annotate(f"{v:.0f} h", (b.get_x() + b.get_width() / 2, v), xytext=(0, 3),
                        textcoords="offset points", ha="center", fontsize=12, fontweight="bold", color=INK)
        ax.set_xticks([0, 1], [r.case_A.replace("current design, ", ""), r.case_B.replace("current design, ", "")],
                      fontsize=10)
        ax.set_title(titles[p], fontsize=13)
        ax.set_ylim(0, max(vals) * 1.18 + 1)
        ax.grid(axis="x", visible=False)
    for a_ in axes:
        a_.set_ylabel("Grid backup hours per year")
    fig.suptitle("Before / after – grid backup hours (each panel has its own scale)", fontweight="bold")
    fig.tight_layout()
    save(fig, "06_comparisons")


def fig_heatmap_wax_solar():
    """One clear heat map for the poster: 1.5 kW compressor (the best size), wax x solar."""
    p = pd.read_csv(RES / "parametric.csv")
    rec = json.loads((RES / "recommended_overrides.json").read_text())
    q = rec["refrigeration"]["design_capacity_kW"]
    x = p[p.Qmax_kW == q]
    g = x.pivot(index="pcm_mass_kg", columns="pv_kWp", values="grid_hours")
    d = x.pivot(index="pcm_mass_kg", columns="pv_kWp", values="pct_days_full_solar_pcm")
    cfg = load_config()
    marks = {(cfg["pcm"]["mass_kg"], cfg["pv"]["rated_kWp"]): "current", (rec["pcm"]["mass_kg"], rec["pv"]["rated_kWp"]): "recommended"}
    fig, ax = plt.subplots(figsize=(9, 7))
    vmax = g.values.max()
    im = ax.imshow(g.values, cmap=SEQ, vmin=0, vmax=vmax, aspect="auto", origin="lower")
    for i in range(g.shape[0]):
        for j in range(g.shape[1]):
            v = g.values[i, j]
            ax.text(j, i, f"{v:.0f} h\n{d.values[i, j]:.0f} % days", ha="center", va="center", fontsize=11,
                    color="white" if v > vmax * 0.45 else INK)
    for (m, pv), name in marks.items():
        i, j = list(g.index).index(m), list(g.columns).index(pv)
        ax.add_patch(plt.Rectangle((j - 0.5, i - 0.5), 1, 1, fill=False, ec=ORANGE if name == "recommended" else INK, lw=3.5,
                                   ls="-" if name == "recommended" else "--"))
        ax.text(j + 0.47, i + 0.42, name, ha="right", va="top", fontsize=10, fontweight="bold",
                color=INK if g.values[i, j] < vmax * 0.45 else "white")
    ax.set_xticks(range(g.shape[1]), [f"{c:g}" for c in g.columns])
    ax.set_yticks(range(g.shape[0]), [f"{r:g}" for r in g.index])
    ax.set_xlabel("Solar PV size, kWp"); ax.set_ylabel("Wax (PCM) mass, kg")
    ax.grid(False)
    cb = fig.colorbar(im, ax=ax, pad=0.02); cb.set_label("Grid backup hours per year (lower is better)")
    ax.set_title(f"Grid backup hours per year – wax × solar ({q:g} kW compressor)")
    save(fig, "11_heatmap_wax_solar", SIM_NOTE + ". Second line in each cell = % of days fully on solar + wax.")


def pair_fig(name, title, label_a, label_b, rows, note=SIM_NOTE):
    """Before/after small multiples: each metric gets its own panel and its own scale."""
    fig, axes = plt.subplots(1, len(rows), figsize=(3.6 * len(rows), 4.8))
    for ax, (metric, unit, a, b) in zip(axes, rows):
        bars = ax.bar([0, 1], [a, b], color=[BLUE, ORANGE], width=0.62, edgecolor=SURFACE)
        top = max(a, b) if max(a, b) > 0 else 1
        for bar, v in zip(bars, [a, b]):
            ax.annotate(f"{v:,.0f}" if abs(v) >= 10 else f"{v:.1f}", (bar.get_x() + bar.get_width() / 2, v),
                        xytext=(0, 3), textcoords="offset points", ha="center", fontsize=13, fontweight="bold", color=INK)
        ax.set_ylim(0, top * 1.2)
        if a == 0 and b == 0:
            ax.text(0.5, 0.5, "0 h in both:\nnever left 2–8 °C", transform=ax.transAxes, ha="center", va="center",
                    fontsize=13, color=INK2)
        ax.set_xticks([0, 1], [label_a, label_b], fontsize=11)
        ax.set_title(f"{metric}\n({unit})", fontsize=12.5)
        ax.grid(axis="x", visible=False)
    fig.suptitle(title, fontweight="bold", fontsize=16)
    fig.tight_layout()
    save(fig, name, note)


def comparison_figs():
    comp = pd.read_csv(RES / "comparisons.csv")
    get = lambda c, m: comp[(comp.comparison == c) & (comp.metric == m)].iloc[0]
    metrics = [("pct_days_full_solar_pcm", "Days fully on solar + wax", "% of days"),
               ("grid_hours", "Grid backup", "hours / year"),
               ("hours_outside_2_8C", "Room outside 2–8 °C", "hours / year"),
               ("compressor_kWh_e", "Compressor electricity", "kWh / year")]
    rows = lambda c: [(t, u, get(c, m).value_A, get(c, m).value_B) for m, t, u in metrics]
    pair_fig("12_curtain_vs_none", "Strip curtain vs. no curtain (recommended design)", "strip curtain", "no curtain", rows("Door curtain"))
    pair_fig("13_forecast_vs_normal", "Normal vs. forecast-based charging (recommended design)", "normal", "forecast",
             rows("Charging"), SIM_NOTE + ". Forecast = next day's real weather from the file (a perfect forecast).")
    s = pd.read_csv(RES / "results_summary.csv")
    val = lambda sec, item: float(s[(s.section == sec) & (s["item"] == item)].value.iloc[0])
    items = [("Days fully on solar + PCM", "Days fully on solar + wax", "% of days"),
             ("Grid backup hours", "Grid backup", "hours / year"),
             ("Hours outside 2-8 C", "Room outside 2–8 °C", "hours / year"),
             ("Solar energy wasted", "Solar not needed", "kWh / year")]
    rows2 = [(t, u, val("Year - current design", i), val("Year - recommended design", i)) for i, t, u in items]
    rec = json.loads((RES / "recommended_overrides.json").read_text())
    cfg = load_config()
    pair_fig("14_current_vs_recommended",
             f"Current ({cfg['pcm']['mass_kg']:g} kg wax, {cfg['pv']['rated_kWp']:g} kWp) vs. recommended "
             f"({rec['pcm']['mass_kg']:g} kg, {rec['pv']['rated_kWp']:g} kWp) – both 1.5 kW", "current", "recommended", rows2)


# ----------------------------------------------------------------- engine
def fig_melt_front(cfg):
    s = simulate_slab(cfg, hours=24, T_init_C=2.0, T_air_C=8.0)
    fig, (a1, a2) = plt.subplots(2, 1, figsize=(10, 7), sharex=True)
    a1.plot(s["hours"], s["melt_front_mm"], color=BLUE)
    a1.axhline(s["thickness_mm"], color=MUTED, lw=1, ls=":")
    a1.text(0.2, s["thickness_mm"] + 0.3, f"slab thickness {s['thickness_mm']:.1f} mm", fontsize=10, color=INK2)
    a1.set_ylabel("Melt front, mm")
    a1.set_ylim(0, s["thickness_mm"] * 1.15)
    a2.plot(s["hours"], np.array(s["liquid_fraction"]) * 100, color=ORANGE)
    a2.set_ylabel("Liquid fraction, %")
    a2.set_xlabel("Time, hours (room air held at 8 °C, slab starts solid at 2 °C)")
    a1.set_title(f"PCM wall slab – enthalpy method, explicit FTCS  (r = αΔt/Δx² = {s['r']:.2f} ≤ 0.5)")
    save(fig, "07_pcm_melt_front", f"Engine model: {s['nx']} cells, Δx = {s['dx_mm']:.2f} mm, Δt = {s['dt_s']:.2f} s, "
                                   f"h = {cfg['pcm']['air_side_h_W_m2K']} W/m²K, back face insulated")


def fig_load_breakdown(cfg, crops):
    T = cfg["design_ambient"]
    t = loads.total_load(cfg, crops[cfg["product"]["default_crop"]], T["T_out_C"], T["rh_out_pct"])
    br = pd.Series(t["breakdown_kW"]).sort_values()
    fig, ax = plt.subplots(figsize=(10, 5))
    bars = ax.barh(br.index, br.values * 1000, color=BLUE, height=0.6)
    for b, v in zip(bars, br.values):
        ax.text(b.get_width() + 10, b.get_y() + b.get_height() / 2, f"{v*1000:.0f} W", va="center", fontsize=11)
    ax.set_xlabel("Heat load, W")
    ax.set_ylabel("Heat source")
    ax.set_xlim(0, br.max() * 1000 * 1.15)
    ax.grid(axis="y", visible=False)
    ax.set_title(f"Design-point load = {t['subtotal_kW']:.2f} kW (+10 % margin = {t['total_with_margin_kW']:.2f} kW)")
    save(fig, "08_load_breakdown", f"Engine calculation at {T['T_out_C']} °C, {T['rh_out_pct']} % RH outside, room 5 °C, "
                                   "strip curtain, during 4 h produce pull-down")


def fig_ph(cfg):
    dome = r290.saturation_dome(n=80)
    c = r290.cycle_from_config(cfg)
    fig, ax = plt.subplots(figsize=(10, 6.5))
    from CoolProp.CoolProp import PropsSI
    crit = (PropsSI("H", "T", PropsSI("Tcrit", "Propane"), "D", PropsSI("rhocrit", "Propane"), "Propane") / 1000,
            PropsSI("pcrit", "Propane") / 1e5)
    hl, pl = zip(*(dome["liquid"] + [crit]))
    hv, pv_ = zip(*(dome["vapour"] + [crit]))
    ax.plot(*crit, marker="o", ms=5, color=MUTED)
    ax.annotate(f"critical point {crit[1]:.1f} bar", crit, xytext=(0, -18), textcoords="offset points", ha="center",
                fontsize=10, color=INK2)
    ax.plot(hl, pl, color=MUTED, lw=1.6)
    ax.plot(hv, pv_, color=MUTED, lw=1.6)
    ax.text(hl[len(hl) // 3] - 5, pl[len(pl) // 3], "sat. liquid", fontsize=10, color=INK2, ha="right")
    k = int(np.argmin(np.abs(np.array(pv_) - 25)))
    ax.text(hv[k] + 8, pv_[k], "sat. vapour", fontsize=10, color=INK2)
    pts = r290.cycle_polyline(c)
    h, P = zip(*pts)
    ax.plot(h, P, color=BLUE, lw=2.5, marker="o", ms=8, markerfacecolor=SURFACE, markeredgewidth=2)
    ax.plot([c["h1"], c["h2s"]], [c["P_evap_bar"], c["P_cond_bar"]], color=ORANGE, ls="--", lw=1.6)
    lab = {1: (c["h1"], c["P_evap_bar"], f"1  {c['h1']:.0f} kJ/kg"),
           2: (c["h2"], c["P_cond_bar"], f"2  {c['h2']:.0f} (2s {c['h2s']:.0f})"),
           3: (c["h3"], c["P_cond_bar"], f"3  {c['h3']:.0f}"),
           4: (c["h4"], c["P_evap_bar"], f"4  {c['h4']:.0f}")}
    off = {1: (8, -16), 2: (8, 6), 3: (-8, 8), 4: (-8, -16)}
    for k, (x, y, t) in lab.items():
        ax.annotate(t, (x, y), xytext=off[k], textcoords="offset points", fontsize=11,
                    ha="left" if k in (1, 2) else "right", color=INK)
    ax.set_yscale("log")
    ax.set_yticks([1, 2, 4, 10, 20, 40], ["1", "2", "4", "10", "20", "40"])
    ax.set_xlim(100, 720)
    ax.set_ylim(1, 45)
    ax.set_xlabel("Specific enthalpy h, kJ/kg")
    ax.set_ylabel("Pressure, bar (log scale)")
    ax.set_title(f"R290 cycle  −5 °C / +50 °C:  {c['P_evap_bar']:.2f} / {c['P_cond_bar']:.2f} bar,  "
                 f"COP {c['COP_ideal']:.2f} / {c['COP_real']:.2f} / {c['COP_elec']:.2f}")
    ax.text(0.02, 0.97, f"q_e = {c['q_e']:.1f} kJ/kg   w_s = {c['w_s']:.1f} kJ/kg\n"
                        f"ṁ = {c['m_dot_g_s']:.2f} g/s   P_elec = {c['P_elec_kW']:.2f} kW  (for 1.5 kW)\n"
                        "dashed = ideal isentropic compression",
            transform=ax.transAxes, va="top", fontsize=10.5, color=INK2)
    save(fig, "09_r290_ph_diagram", "Engine calculation, properties from CoolProp (Propane); "
                                    "η_is = 0.75, η_motor = 0.85, no superheat / subcooling")


def main():
    cfg, crops = load_config(), load_crops()
    print("Making poster figures ->", OUT)
    fig_weather()
    fig_day_counts()
    fig_monthly_energy()
    fig_parametric_heatmap()
    fig_pcm_heatmap()
    fig_power_cut()
    fig_comparisons()
    fig_melt_front(cfg)
    fig_load_breakdown(cfg, crops)
    fig_ph(cfg)
    fig_heatmap_wax_solar()
    comparison_figs()


if __name__ == "__main__":
    main()
