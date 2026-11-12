"""Space budget of the 2.0 x 2.0 x 2.2 m room (8.8 m3): what takes the space and how much produce fits.

    python -m engine.space         ->  results/live/space_budget.json + figures/final_11_space_budget.png/.svg

Method: the room is cut into 1 cm cubes. Each zone (wax panels + fins, keep-clear air in front of the fins,
evaporator + the free air in front of it, door walkway / aisle, racks with their shelves and crates) is
"painted" in turn, so no cube is counted twice and the zones always add up to exactly 8.8 m3.
Then the racks are filled with crates (one crate high per shelf, air gaps between crates) and the crates
with produce (bruising limit per crate). Values marked E are assumptions (listed in the JSON).
"""
import json
import math
from pathlib import Path

import numpy as np

from .config import load_config, load_crops

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "results" / "live" / "space_budget.json"
FIG = ROOT / "figures" / "final_11_space_budget"
RES = 0.01                                     # 1 cm cubes

# ------------------------------------------------------------------ inputs (E = assumption, edit here)
E = {
    "wax_density_solid_kg_m3": (880, "E – typical paraffin (solid); the datasheet of the chosen wax must confirm"),
    "wax_density_liquid_kg_m3": (770, "E – typical paraffin (liquid); used for the container volume (wax expands when it melts)"),
    "casing_mm": (3, "E – aluminium panel casing, total of both faces"),
    "casing_sheet_mm_each_face": (1.0, "E – 1 mm aluminium sheet on each face of the panel"),
    "al_density_kg_m3": (2700, "aluminium"),
    "door_clear_width_m": (0.9, "E – door opening kept free of panels (config door is 0.8 m leaf; 0.9 m with frame)"),
    "evaporator_m": ([0.6, 0.4, 0.3], "E – unit cooler width × height × depth; mounted above the door, under the ceiling"),
    "evaporator_free_air_m": (0.3, "E – free air in front of the evaporator (air throw)"),
    "aisle_min_m": (0.6, "E – farmer walks in with a crate"),
    "rack_depth_m": (0.55, "E – galvanised slotted-angle rack"),
    "rack_gap_from_keep_clear_m": (0.05, "E – gap between rack and the fins' keep-clear line"),
    "shelf_levels": (4, "E"),
    "bottom_shelf_m": (0.10, "E"),
    "shelf_pitch_m": (0.45, "E – 30 cm crate + 15 cm air above it"),
    "top_crate_max_m": (1.9, "E – keep ≥ 0.3 m free under the 2.2 m ceiling for the evaporator air"),
    "rack_steel_kg_each": (25, "E – slotted-angle rack, 4 shelves"),
    "crate_outer_m": ([0.60, 0.40, 0.30], "E – standard ventilated plastic crate 600 × 400 × 300 mm"),
    "crate_inner_m": ([0.56, 0.36, 0.28], "E – inside of that crate"),
    "crate_empty_kg": (1.8, "E – polypropylene crate"),
    "crate_gap_m": (0.025, "E – 2–3 cm air gap between crates"),
    "crate_max_kg_pomegranate": (15, "E – bruising limit for pomegranate (no source found; check with a packhouse)"),
    "steel_cp_kJ_kgK": (0.50, "steel"),
    "pp_cp_kJ_kgK": (1.9, "E – polypropylene"),
}
V = {k: v[0] for k, v in E.items()}


def _box(g, x0, x1, y0, y1, z0, z1):
    s = lambda a: int(round(a / RES))
    return (slice(max(0, s(x0)), s(x1)), slice(max(0, s(y0)), s(y1)), slice(max(0, s(z0)), s(z1)))


def layouts(cfg):
    """Rack layouts that could fit; each must leave the aisle (>= 0.6 m) from the door."""
    W, L, H = cfg["live_run"]["inside_m"][0], cfg["live_run"]["inside_m"][1], cfg["live_run"]["inside_m"][2]
    hx = cfg["live_run"]["wax_hx"]
    band = wax_band(cfg)["band_m"]
    off = band + V["rack_gap_from_keep_clear_m"]
    d = V["rack_depth_m"]
    door = V["door_clear_width_m"]
    out = {}
    # A) racks on the left AND right wall, aisle in the middle
    aisle = W - 2 * off - 2 * d
    out["two_side_racks"] = {"racks": [("left", off, off + d, off, L - off), ("right", W - off - d, W - off, off, L - off)],
                             "aisle_m": aisle, "door_x": [(W - door) / 2, (W + door) / 2]}
    # B) L-shape: rack on the left wall + rack on the back wall; door on the right of the front wall
    out["L_shape"] = {"racks": [("left", off, off + d, off, L - off), ("back", off + d, W - off, L - off - d, L - off)],
                      "aisle_m": W - off - (off + d), "door_x": [W - band - door - 0.05, W - band - 0.05]}
    # C) one rack on the back wall only
    out["back_only"] = {"racks": [("back", off, W - off, L - off - d, L - off)], "aisle_m": L - off - d - band,
                        "door_x": [(W - door) / 2, (W + door) / 2]}
    for k, v in out.items():
        v["ok"] = v["aisle_m"] >= V["aisle_min_m"] - 1e-9
    return out


def wax_band(cfg):
    pc, hx = cfg["pcm"], cfg["live_run"]["wax_hx"]
    m = cfg["live_run"]["designs"]["current"]["pcm_kg"]
    A = pc["slab_area_m2"]
    vol_liq = m / V["wax_density_liquid_kg_m3"]
    slab = vol_liq / A
    depth = slab + V["casing_mm"] / 1000 + hx["b"]
    return {"wax_kg": m, "wax_volume_solid_m3": m / V["wax_density_solid_kg_m3"], "wax_volume_liquid_m3": vol_liq,
            "slab_mm": 1000 * slab, "panel_area_m2": A, "panel_height_m": hx["L"], "wall_length_m": A / hx["L"],
            "panel_bottom_m": hx["panel_bottom_m"], "fin_depth_m": hx["b"], "panel_depth_m": depth,
            "keep_clear_m": hx["keep_clear_m"], "band_m": depth + hx["keep_clear_m"]}


def crates_on(rack, levels):
    """Crates on one rack: 600 mm along the rack, 400 mm across (depth 0.55 m)."""
    _, x0, x1, y0, y1 = rack
    length = max(x1 - x0, y1 - y0)
    cw, cd, ch = V["crate_outer_m"]
    g = V["crate_gap_m"]
    per = int(math.floor((length + g) / (cw + g))) if cd <= V["rack_depth_m"] else 0
    return per, per * levels


def build(cfg=None, crop_key="pomegranate"):
    cfg = cfg or load_config()
    crop = load_crops()[crop_key]
    W, L, H = cfg["live_run"]["inside_m"]
    nx, ny, nz = int(round(W / RES)), int(round(L / RES)), int(round(H / RES))
    zone = np.zeros((nx, ny, nz), np.uint8)      # 0 = free air
    ZN = {1: "wax_panels_fins", 2: "keep_clear_air", 3: "evaporator", 4: "evaporator_free_air", 5: "racks_crates_produce", 6: "door_walkway_aisle"}
    wb = wax_band(cfg)
    lay = layouts(cfg)
    choice = max((k for k in lay if lay[k]["ok"]), key=lambda k: sum(crates_on(r, V["shelf_levels"])[1] for r in lay[k]["racks"]))
    Lc = lay[choice]
    door_x = Lc["door_x"]
    # wax panels on every wall except the door; from panel_bottom (drip tray below) to panel_bottom + 1.7 m
    pd, kc, z0, z1 = wb["panel_depth_m"], wb["keep_clear_m"], 0.0, wb["panel_bottom_m"] + wb["panel_height_m"]
    walls = [("front", (0, W), (0, pd), (0, W), (pd, pd + kc)), ("back", (0, W), (L - pd, L), (0, W), (L - pd - kc, L - pd)),
             ("left", (0, pd), (0, L), (pd, pd + kc), (0, L)), ("right", (W - pd, W), (0, L), (W - pd - kc, W - pd), (0, L))]
    for name, xr, yr, kx, ky in walls:                 # keep-clear first, panels over it at the corners
        zone[_box(zone, kx[0], kx[1], ky[0], ky[1], z0, z1)] = 2
    for name, xr, yr, kx, ky in walls:
        zone[_box(zone, xr[0], xr[1], yr[0], yr[1], z0, z1)] = 1
    # door opening on the front wall: no panels, no keep-clear (walkway)
    zone[_box(zone, door_x[0], door_x[1], 0, pd + kc, 0, 1.8)] = 6
    # evaporator above the door, its free air in front
    ew, eh, ed = V["evaporator_m"]
    ex0 = (door_x[0] + door_x[1]) / 2 - ew / 2
    zone[_box(zone, ex0, ex0 + ew, 0, ed, H - eh, H)] = 3
    zone[_box(zone, ex0, ex0 + ew, ed, ed + V["evaporator_free_air_m"], H - eh, H)] = 4
    # racks (footprint up to the top crate)
    top = min(V["bottom_shelf_m"] + (V["shelf_levels"] - 1) * V["shelf_pitch_m"] + V["crate_outer_m"][2], V["top_crate_max_m"])
    for r in Lc["racks"]:
        _, x0, x1, y0, y1 = r
        zone[_box(zone, x0, x1, y0, y1, 0, top)] = 5
    # aisle: from the door to the back of the racks, floor to 1.8 m (only cubes that are still free air)
    a_x0 = door_x[0] if choice != "two_side_racks" else Lc["racks"][0][2]
    a_x1 = door_x[1] if choice != "two_side_racks" else Lc["racks"][1][1]
    if choice == "L_shape":
        a_x0, a_x1 = Lc["racks"][0][2], W - pd - kc
        a_y1 = Lc["racks"][1][3]
    else:
        a_y1 = L - pd - kc
    sl = _box(zone, a_x0, a_x1, pd + kc, a_y1, 0, 1.8)
    sub = zone[sl]
    sub[sub == 0] = 6
    cube = RES ** 3
    vols = {ZN[k]: float((zone == k).sum() * cube) for k in ZN}
    vols["free_air_other"] = float((zone == 0).sum() * cube)
    floor = {ZN[k]: float(((zone == k).any(axis=2)).sum() * RES * RES) for k in ZN}
    # contents of the zones
    per_rack = [crates_on(r, V["shelf_levels"]) for r in Lc["racks"]]
    n_crates = sum(n for _, n in per_rack)
    kg_crate = V["crate_max_kg_pomegranate"]
    cap = n_crates * kg_crate
    f = crop.get("fruit", {})
    fruit_g = f.get("mass_g", 250)
    rho_fruit = f.get("fruit_density_kg_m3", 1000)
    bulk = f.get("bulk_density_kg_m3", 550)
    inner = float(np.prod(V["crate_inner_m"]))
    al_casing = wb["panel_area_m2"] * 2 * V["casing_sheet_mm_each_face"] / 1000 * V["al_density_kg_m3"]
    from . import fins as FINS
    hx = cfg["live_run"]["wax_hx"]
    al_fins = FINS.array(wb["panel_area_m2"], hx["L"], hx["S"], hx["b"], hx["t"], 0.03, 3.0)["al_kg"]
    steel = len(Lc["racks"]) * V["rack_steel_kg_each"]
    contents = {
        "wax_m3_liquid": wb["wax_volume_liquid_m3"], "aluminium_m3": (al_casing + al_fins) / V["al_density_kg_m3"],
        "crates_outer_m3": n_crates * float(np.prod(V["crate_outer_m"])),
        "produce_net_fruit_m3": cap / rho_fruit, "produce_bulk_m3": cap / bulk,
        "rack_steel_m3": steel / 7850.0,
    }
    total = 8.8
    rows = []
    label = {"wax_panels_fins": "Wax panels + casing + fins (along the walls, incl. drip tray below)", "keep_clear_air": "Keep-clear air in front of the fins (natural convection)",
             "evaporator": "Evaporator unit (above the door)", "evaporator_free_air": "Free air in front of the evaporator",
             "racks_crates_produce": "Racks with crates and produce (up to the top crate)", "door_walkway_aisle": "Door walkway + aisle",
             "free_air_other": "Other free air (above racks, corners, under the panels)"}
    for k in list(ZN.values()) + ["free_air_other"]:
        rows.append({"item": label[k], "key": k, "floor_m2": round(floor.get(k, 0.0), 3), "volume_m3": round(vols[k], 3),
                     "pct_of_room": round(100 * vols[k] / total, 1)})
    fruits_per_kg = 1000.0 / fruit_g
    out = {
        "room": {"inside_m": [W, L, H], "floor_m2": W * L, "volume_m3": W * L * H},
        "wax": wb, "aluminium_kg": {"fins": al_fins, "casing": al_casing, "total": al_fins + al_casing},
        "layout": {"chosen": choice, "options": {k: {"aisle_m": round(v["aisle_m"], 3), "ok": v["ok"],
                                                      "crates": sum(crates_on(r, V["shelf_levels"])[1] for r in v["racks"])} for k, v in lay.items()},
                   "racks": [{"name": r[0], "x": [round(r[1], 3), round(r[2], 3)], "y": [round(r[3], 3), round(r[4], 3)],
                              "crates_per_shelf": p, "crates": n} for r, (p, n) in zip(Lc["racks"], per_rack)],
                   "door_x": [round(x, 3) for x in door_x], "shelves_m": [round(V["bottom_shelf_m"] + i * V["shelf_pitch_m"], 2) for i in range(V["shelf_levels"])],
                   "top_crate_m": round(top, 2), "aisle_m": round(Lc["aisle_m"], 3)},
        "table": rows, "zones_sum_m3": round(sum(vols.values()), 6), "contents_m3": {k: round(v, 4) for k, v in contents.items()},
        "usable_rack_floor_m2": round(sum((r[2] - r[1]) * (r[4] - r[3]) for r in Lc["racks"]), 3),
        "crate_places": n_crates, "kg_per_crate": kg_crate, "capacity_kg": cap,
        "crate_fill_by_bulk_density_kg": round(inner * bulk, 1),
        "thermal_mass": {"rack_steel_kg": steel, "rack_kJ_K": steel * V["steel_cp_kJ_kgK"],
                         "crate_kg_each": V["crate_empty_kg"], "crate_kJ_K_each": V["crate_empty_kg"] * V["pp_cp_kJ_kgK"]},
        "pomegranate": {"fruit_mass_g": fruit_g, "fruits_per_kg": round(fruits_per_kg, 2),
                        "fruits_per_crate": int(kg_crate * fruits_per_kg), "fruits_per_150_kg": int(round(150 * fruits_per_kg)),
                        "fruits_full_room": int(round(cap * fruits_per_kg)),
                        "net_fruit_volume_per_crate_m3": round(kg_crate / rho_fruit, 4), "crate_inner_m3": round(inner, 4),
                        "fill_of_crate_pct": round(100 * (kg_crate / bulk) / inner, 1)},
        "assumptions_E": {k: {"value": v[0], "note": v[1]} for k, v in E.items()},
        "note": "C = calculated from the dimensions; E = assumption. Not measured.",
    }
    return out, zone, Lc


def draw(out, zone, Lc, path=FIG):
    """Top view + side view (large fonts) -> SVG + PNG."""
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    from matplotlib.colors import ListedColormap
    cols = ["#ffffff", "#2a78d6", "#bfe3f5", "#41566b", "#d7e9f7", "#1baf7a", "#fde68a"]
    cmap = ListedColormap(cols)
    W, L, H = out["room"]["inside_m"]
    plt.rcParams.update({"font.size": 15})
    fig, ax = plt.subplots(1, 2, figsize=(17, 8.2), gridspec_kw={"width_ratios": [1, 1.1]})
    zt = int(round(1.0 / RES))
    top = zone[:, :, zt].T.astype(int)
    ev = (zone == 3).any(axis=2).T
    top = np.where(ev & (top == 0), 3, top)
    ax[0].imshow(top, origin="lower", extent=[0, W, 0, L], cmap=cmap, vmin=0, vmax=6, interpolation="nearest")
    ax[0].set_title("Top view (cut at 1.0 m)", fontsize=18, weight="bold")
    for r in out["layout"]["racks"]:
        x0, x1 = r["x"]; y0, y1 = r["y"]
        ax[0].text((x0 + x1) / 2, (y0 + y1) / 2, f"rack\n{r['crates']} crates", ha="center", va="center", fontsize=14, color="white", weight="bold")
    dx = out["layout"]["door_x"]
    ax[0].annotate("DOOR", ((dx[0] + dx[1]) / 2, 0.02), ha="center", va="bottom", fontsize=15, weight="bold")
    ax[0].text(1.25, 0.75, f"aisle\n{out['layout']['aisle_m']:.2f} m", ha="center", fontsize=14)
    ax[0].set_xlabel("width (m)"); ax[0].set_ylabel("depth (m)")
    side = zone[int(round(0.5 / RES)), :, :].T.astype(int)
    ax[1].imshow(side, origin="lower", extent=[0, L, 0, H], cmap=cmap, vmin=0, vmax=6, interpolation="nearest")
    ax[1].set_title("Side view (cut through the left rack)", fontsize=18, weight="bold")
    from matplotlib.patches import Rectangle
    left = out["layout"]["racks"][0]
    cw, cd, chh = V["crate_outer_m"]
    for z in out["layout"]["shelves_m"]:
        ax[1].plot(left["y"], [z, z], color="#0d1b2a", lw=2)
        for k in range(left["crates_per_shelf"]):
            y0 = left["y"][0] + 0.02 + k * (cw + V["crate_gap_m"])
            ax[1].add_patch(Rectangle((y0, z), cw, chh, fc="#eb6834", ec="#7a2e0e", lw=1.5))
            ax[1].text(y0 + cw / 2, z + chh / 2, f"{V['crate_max_kg_pomegranate']} kg", ha="center", va="center", fontsize=12, color="white", weight="bold")
    ev = out["layout"]["door_x"]
    ew = V["evaporator_m"][0]
    ax[0].add_patch(Rectangle(((ev[0] + ev[1]) / 2 - ew / 2, 0), ew, V["evaporator_m"][2], fill=False, ec="#41566b", lw=2, ls="--"))
    ax[0].text((ev[0] + ev[1]) / 2, V["evaporator_m"][2] + 0.03, "evaporator above door", ha="center", fontsize=11, color="#41566b")
    ax[1].set_xlabel("depth (m)"); ax[1].set_ylabel("height (m)")
    names = ["Wax panels + fins", "Keep-clear air", "Evaporator", "Evaporator air", "Racks + crates", "Door walkway / aisle"]
    from matplotlib.patches import Patch
    fig.legend([Patch(color=c, ec="#999") for c in cols[1:]], names, loc="lower center", ncol=6, fontsize=13, frameon=False)
    fig.suptitle(f"Room 2.0 × 2.0 × 2.2 m = 8.8 m³ · {out['crate_places']} crate places × {out['kg_per_crate']} kg = "
                 f"{out['capacity_kg']} kg pomegranate (C, E)", fontsize=19, weight="bold")
    fig.tight_layout(rect=[0, 0.07, 1, 0.94])
    fig.savefig(str(path) + ".png", dpi=150)
    fig.savefig(str(path) + ".svg")
    plt.close(fig)


def main():
    out, zone, Lc = build()
    OUT.write_text(json.dumps(out, indent=1, ensure_ascii=False), encoding="utf-8")
    draw(out, zone, Lc)
    for r in out["table"]:
        print(f"{r['item']:60s} {r['floor_m2']:6.2f} m2 {r['volume_m3']:6.3f} m3 {r['pct_of_room']:5.1f} %")
    print("sum", out["zones_sum_m3"], "layout", out["layout"]["chosen"], out["layout"]["options"])
    print("crates", out["crate_places"], "capacity", out["capacity_kg"], "kg", out["pomegranate"])


if __name__ == "__main__":
    main()
