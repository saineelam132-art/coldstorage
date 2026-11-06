"""Make the STATIC BACKUP: the website as plain files that open with NO Python.

    python tools/export_static.py          ->  static_site/   (open static_site/index.html)

What it does:
  1. Runs the digital twin (same code as the server) and saves every 5-minute state of the
     demo days (hottest, sunniest, rainiest, most-grid days and their neighbours) into data.js.
  2. Saves the design values, sensor list, crop table, R290 cycles, wax-slab curve, design-point
     table, What-If table and the picture list into the same data.js.
  3. Copies the pictures, poster figures and the JavaScript bundles (web/static/*.bundle.js).

The bundles are made from web/js/ with  tools/build_static_bundle.sh  (needs Node.js once, on any
computer). They are saved in the repository, so this exporter needs only Python.
"""
import json
import math
import shutil
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
from engine import r290  # noqa: E402
from server.twin_state import SIM_LABEL, TwinState, _strip, geometry  # noqa: E402

OUT = ROOT / "static_site"


def r(x, nd=4):
    if x is None or (isinstance(x, float) and (math.isnan(x) or math.isinf(x))):
        return None
    if isinstance(x, (bool, np.bool_)):
        return int(x)
    return float(f"{float(x):.{nd}g}")


def main():
    tw = TwinState()
    cfg = tw.cfg
    dt = tw.dt
    demo = tw.demo_days()

    # ---- which days to save: each demo day from the day before to two days after (merged)
    spans = []
    for d in demo:
        day = int(d["t"] // 86400)
        spans.append([max(0, day - 1), min(364, day + 2)])
    spans.sort()
    merged = []
    for a, b in spans:
        if merged and a <= merged[-1][1] + 1:
            merged[-1][1] = max(merged[-1][1], b)
        else:
            merged.append([a, b])
    steps_per_day = int(86400 // dt)

    state_fields = ["T_out", "RH_out", "wind", "poa", "T_room", "T_pcm", "pcm_pct", "P_pv", "P_comp", "P_solar_used",
                    "P_grid", "Q_cool", "Q_coil_air", "Q_coil_pcm", "comp_speed_pct", "cop", "Q_total", "Q_wall", "Q_door",
                    "Q_int", "Q_resp", "Q_batch", "dp_top", "last_open_s", "last_open_ago_min", "fan_W", "fan_speed_pct", "G_wax_W_K"]
    cols = {k: [] for k in state_fields + ["T_batch", "grid_on", "backup_h", "door_s", "heat_if_open_on", "heat_if_open_off",
                                           "v_if_open_on", "v_if_open_off", "lat_frac", "sun_elev", "sun_az", "day", "day_poa",
                                           "s_T_room", "s_pcm_pct", "s_grid_on", "grid_h_n", "grid_h_s"]}
    classes = ["sunny", "cloudy", "rainy"]
    windows, k = [], 0
    for a, b in merged:
        t0 = a * 86400
        n = (b - a + 1) * steps_per_day
        windows.append([t0, k, n])
        for j in range(n):
            t = t0 + j * dt
            i = tw.index(t)
            s_on = tw.state(t + 1, curtain=True)
            s_off = tw.state(t + 1, curtain=False)
            v = s_on["values"]
            for f in state_fields:
                cols[f].append(r(v[f]))
            cols["T_batch"].append(r(v["T_batch"]))
            cols["grid_on"].append(int(v["grid_on"]))
            cols["backup_h"].append(r(v["backup_h"]))
            cols["door_s"].append(r(v["door_s_this_5min"]))
            cols["heat_if_open_on"].append(r(v["heat_if_open_kW"]))
            cols["heat_if_open_off"].append(r(s_off["values"]["heat_if_open_kW"]))
            cols["v_if_open_on"].append(r(v["v_door_if_open"]))
            cols["v_if_open_off"].append(r(s_off["values"]["v_door_if_open"]))
            inf_lat = tw.doorway(v["T_out"], v["RH_out"], v["T_room"], cfg["setpoint"]["rh_room_pct"], True, True)
            cols["lat_frac"].append(r(inf_lat["heat_latent_now_kW"] / inf_lat["heat_now_kW"] if inf_lat["heat_now_kW"] else 0.0))
            cols["sun_elev"].append(r(s_on["sun"]["elevation_deg"]))
            cols["sun_az"].append(r(s_on["sun"]["azimuth_deg"]))
            cols["day"].append(classes.index(s_on["day_class"]))
            cols["day_poa"].append(r(s_on["day_poa_kWh_m2"]))
            cp = s_on["compare"]
            cols["s_T_room"].append(r(cp["smart"]["T_room"]))
            cols["s_pcm_pct"].append(r(cp["smart"]["pcm_pct"]))
            cols["s_grid_on"].append(int(cp["smart"]["grid_on"]))
            cols["grid_h_n"].append(r(cp["normal"]["grid_h_so_far"]))
            cols["grid_h_s"].append(r(cp["smart"]["grid_h_so_far"]))
        k += n
    compare_year = tw.state(0)["compare"]["year"]

    # ---- R290 cycle for every outside temperature (per 1 kW; the browser scales by the cooling)
    lo, hi = math.floor(min(cols["T_out"]) * 4) / 4 - 1, math.ceil(max(cols["T_out"]) * 4) / 4 + 1
    cycles = {}
    for T in np.arange(lo, hi + 0.001, 0.25):
        c = r290.cycle_from_config(cfg, T_amb_C=float(T), Q_evap_kW=1.0)
        cycles[f"{T:.2f}"] = {kk: r(vv, 6) for kk, vv in c.items()}

    sensors = _strip(json.loads((ROOT / "config/sensors.json").read_text(encoding="utf-8")))
    manifest = json.loads((ROOT / "web/assets/manifest.json").read_text())
    scenes = json.loads((ROOT / "web/assets/scenes.json").read_text(encoding="utf-8"))
    hotspots = json.loads((ROOT / "web/assets/hotspots.json").read_text(encoding="utf-8"))
    crops_full = tw.crops
    fs = tw.final_totals.get("fan_sizing") or {}
    night_fan = {k: fs.get(k) for k in ("h_natural_W_m2K", "UA_natural_W_K", "h_fan_W_m2K", "UA_fan_W_K", "v_needed_m_s",
                                         "flow_needed_m3h", "pressure_Pa", "load_W", "T_out_design_night_C")}
    night_fan["fan"] = fs.get("fan")
    api_config = {"design": _strip(cfg), "geometry": geometry(cfg), "lan_ip": "", "night_fan": night_fan,
                  "crops": {kk: {"label": v["label"], "T_opt": [v["T_opt_low_C"], v["T_opt_high_C"]], "T_ref_C": v["T_ref_C"],
                                 "SL_ref_days": v["SL_ref_days"], "Q10": v["Q10"], "chill_injury_below_C": v.get("chill_injury_below_C")}
                            for kk, v in crops_full.items()},
                  "year_summary": {kk: vv for kk, vv in tw.summary.items() if isinstance(vv, (int, float, str, bool))}}
    data = {
        "label": SIM_LABEL, "dt": dt, "n": k, "windows": windows, "cols": cols, "state_fields": state_fields,
        "day_classes": classes, "design": _strip(cfg), "crops": crops_full, "compare_year": compare_year,
        "cycles": cycles, "cycle_T": [float(f"{lo:.2f}"), float(f"{hi:.2f}")],
        "dome": r290.saturation_dome(), "cycle_design": {kk: r(vv, 6) for kk, vv in r290.cycle_from_config(cfg).items()},
        "ledger_note": "Demo uses a local hash-chain. Real deployment: permissioned ledger (Hyperledger Fabric) with farmer, transporter and buyer nodes.",
        "files": {
            "api/config": api_config, "api/sensors": sensors, "api/slab": tw.slab(),
            "api/demo_days": [d for d in demo],
            "assets/manifest.json": manifest, "assets/scenes.json": scenes, "assets/hotspots.json": hotspots,
            "results/design_point.json": json.loads((ROOT / "results/design_point.json").read_text()),
            "results/whatif.json": json.loads((ROOT / "results/whatif.json").read_text()),
        },
    }

    # ---- write the folder
    if OUT.exists():
        shutil.rmtree(OUT)
    (OUT / "js").mkdir(parents=True)
    with open(OUT / "js" / "data.js", "w", encoding="utf-8") as f:
        f.write("// ColdTrust Twin - STATIC BACKUP data, made by tools/export_static.py from the digital twin.\n")
        f.write("window.STATIC_DATA = ")
        json.dump(data, f, separators=(",", ":"), allow_nan=False)
        f.write(";\n")
    for sub in ("assets/img", "assets/cutouts", "assets/tex", "css", "vendor/qrcode", "vendor/chartjs", "live"):
        src = ROOT / "web" / sub
        if src.exists():
            shutil.copytree(src, OUT / sub)
    shutil.copytree(ROOT / "figures", OUT / "figures", ignore=shutil.ignore_patterns("*.svg"))
    for b in ("app.bundle.js", "buyer.bundle.js"):
        shutil.copy(ROOT / "web" / "static" / b, OUT / "js" / b)
    html = (ROOT / "web/index.html").read_text(encoding="utf-8")
    html = html.replace('<script type="importmap">', '<!-- importmap not needed in the static backup -->\n<script type="text/plain">')
    html = html.replace('<script type="module" src="js/main.js"></script>',
                        '<script src="js/data.js"></script>\n<script src="js/app.bundle.js"></script>')
    html = html.replace('<div id="simnote" class="simnote">', '<div id="simnote" class="simnote"><b>STATIC BACKUP (no Python, saved demo days)</b> · ')
    (OUT / "index.html").write_text(html, encoding="utf-8")
    bh = (ROOT / "web/buyer.html").read_text(encoding="utf-8")
    bh = bh.replace('<script type="module" src="js/buyer/buyer.js"></script>',
                    '<script src="js/data.js"></script>\n<script src="js/buyer.bundle.js"></script>')
    (OUT / "buyer.html").write_text(bh, encoding="utf-8")
    # the Live Year Run page is a plain script page: it works from a folder as it is
    shutil.copy(ROOT / "web" / "live.html", OUT / "live.html")
    (OUT / "README.txt").write_text(
        "ColdTrust Twin - STATIC BACKUP (no Python needed)\n\n"
        "Double-click index.html (Chrome or Edge). Everything runs from these files.\n"
        f"Saved demo days: {', '.join(f'day {a + 1}-{b + 1} of 2025' for a, b in merged)} (the clock jumps between them).\n"
        "All numbers come from the same digital twin as the full version (exported by tools/export_static.py).\n"
        "Limits: phones cannot open the buyer QR page (no server); new batches and the ledger are saved in this\n"
        "browser only. If the 3D view is slow or blank, tick '2D mode'.\n", encoding="utf-8")
    size = sum(p.stat().st_size for p in OUT.rglob("*") if p.is_file()) / 1e6
    print(f"Static backup written to {OUT} ({size:.1f} MB, {k} saved 5-min steps in {len(windows)} windows)")


if __name__ == "__main__":
    main()
