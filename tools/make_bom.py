"""Cost tables (bill of materials).

    python tools/make_bom.py        ->  results/bom_final.csv        (FINAL design: 115 kg wax with aluminium fins,
                                                                       1.8 kWp, drip tray, 12 V 40 Ah battery)
                                        results/bom_recommended.csv  (2025 sizing-study design, kept for reference)

EVERY PRICE HERE IS A GUESS (marked 'GUESS' in the CSV). Replace them with real quotations.
Quantities come from config/design.json and results/recommended_overrides.json, so they
follow the design. The three prices used by the design-choice rule (wax, PV, compressor)
are read from design.json -> design_choice, so this table and the rule always agree.
"""
import csv
import json
import math
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
from engine.config import load_config, with_overrides  # noqa: E402


def main():
    write(final_cfg(), "bom_final.csv", final=True)
    cfg = load_config()
    rec = json.loads((ROOT / "results" / "recommended_overrides.json").read_text())
    write(with_overrides(cfg, rec), "bom_recommended.csv", final=False)


def final_cfg():
    """Final design numbers come from design.json -> live_run (the 2026 run)."""
    cfg = load_config()
    lr = cfg["live_run"]
    d = lr["designs"]["current"]
    return with_overrides(cfg, {"pcm": {"mass_kg": d["pcm_kg"]}, "pv": {"rated_kWp": d["pv_kWp"]},
                                "refrigeration": {"design_capacity_kW": lr["compressor_max_kW"]}})


def write(cfg, name, final):
    dc, ch, pv, pcm = cfg["design_choice"], cfg["chamber"], cfg["pv"], cfg["pcm"]
    t = ch["insulation_thickness_m"]
    W, H, L = ch["width_m"] + 2 * t, ch["height_m"] + 2 * t, ch["length_m"] + 2 * t
    panel_area = 2 * (W * H + L * H + W * L)
    n_mod = math.ceil(pv["rated_kWp"] * 1000 / pv["module_W"] - 1e-9)
    q = cfg["refrigeration"]["design_capacity_kW"]

    rows = [
        # item, qty, unit, unit price (INR), in design rule?, basis / note
        ("Wax (PCM) paraffin, Tm = 4 °C, filled in aluminium panels", pcm["mass_kg"], "kg", dc["price_pcm_INR_per_kg"], "yes",
         "price includes the aluminium panel containers; from design.json"),
        (f"Solar PV, {n_mod} × {pv['module_W']} W, with MPPT/DC drive and wiring", pv["rated_kWp"], "kWp", dc["price_pv_INR_per_kWp"], "yes",
         "installed price without battery; from design.json"),
        ("R290 DC-inverter condensing unit (compressor + condenser)", q, "kW cooling", dc["price_compressor_INR_per_kW"], "yes",
         "from design.json"),
        ("PUF sandwich panels 100 mm (walls, roof, floor)", round(panel_area, 1), "m²", 2200, "no", "outside area of the 6 faces"),
        ("Cold-room door 0.8 × 1.8 m with frame and hinges", 1, "set", 25000, "no", ""),
        ("PVC strip curtain for the doorway", 1, "set", 3000, "no", "E = 0.85 in the model"),
        ("Evaporator (unit cooler) with fan", 1, "no.", 12000, "no", ""),
        ("Copper charging coil for the wax panels + fittings", 1, "lot", 6000, "no", ""),
        ("R290 refrigerant charge (150–300 g) + brazing, vacuum, test", 1, "lot", 4000, "no", "must be done by an R290-trained technician"),
        ("Galvanised steel canopy, 17° tilt", 1, "lot", 20000, "no", ""),
        ("Concrete pad 3.7 × 3.6 × 0.15 m", 2.0, "m³", 7500, "no", ""),
        ("ATS (grid backup switch), breakers, control box", 1, "lot", 8000, "no", ""),
    ]
    if final:
        hx, b = cfg["live_run"]["wax_hx"], cfg["live_run"]["battery_12V"]
        from engine import fins as FINS
        from engine import fan as FAN
        al = FINS.array(pcm["slab_area_m2"], hx["L"], hx["S"], hx["b"], hx["t"], FAN.wax_resistance(cfg, pcm["mass_kg"]), 3.0)["al_kg"]
        rows += [
            (f"Aluminium fins: extruded heat-sink profile {hx['b'] * 1000:.0f} mm deep, {hx['t'] * 1000:.0f} mm, {hx['S'] * 1000:.0f} mm gap, "
             f"anodised, riveted with thermal paste, removable {hx['section_length_m']} m sections", round(al, 1), "kg", 500, "no",
             "price per kg includes cutting, anodising, rivets and thermal paste"),
            ("Sloped stainless drip tray under the wax panels + drain pipe + water trap", 1, "lot", 3000, "no",
             "fins are below the dew point -> condensate"),
            (f"Floor stoppers for crates ({hx['keep_clear_m'] * 100:.0f} cm keep-clear zone in front of the fins)", 1, "lot", 1000, "no", ""),
            (f"Provision for {hx['optional_fans']['provision']} optional 12 V fans: mounting brackets + 12 V cable (fans NOT fitted)", 1, "lot", 800,
             "no", "add the fans (about Rs 600 each) only if the Phase 4 test shows the fins >25 % weaker"),
            (f"12 V {b['capacity_Ah']} Ah LiFePO4 battery ({b['capacity_Ah'] * b['voltage']:.0f} Wh) + charge controller", 1, "set", 8000, "no",
             "controller, sensors and IoT gateway only – NO battery for cooling"),
        ]
    else:
        rows += [("Small 12 V battery for controller and fans", 1, "no.", 5000, "no", "night-time power for fans and sensors")]
    rows += [
        ("ESP32 + T/RH (SHT31 ×2) + DS18B20 ×4 + thermocouple + reed switch + encoder", 1, "set", 4500, "no", "Phase 4 sensor kit"),
        ("Doorway hot-wire anemometers ×3 + differential pressure sensor", 1, "set", 25000, "no", "research sensors – optional for a farm unit"),
        ("Power meters (PV DC + compressor AC) and wind/RH mast", 1, "set", 6000, "no", ""),
        ("Installation labour", 1, "lot", 20000, "no", ""),
    ]
    out = ROOT / "results" / name
    total = rule_total = 0.0
    with open(out, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["item", "quantity", "unit", "unit_price_INR", "price_status", "line_total_INR", "used_in_design_choice_rule", "note"])
        for item, qty, unit, price, rule, note in rows:
            line = qty * price
            total += line
            rule_total += line if rule == "yes" else 0
            w.writerow([item, qty, unit, price, "GUESS - get a quotation", round(line), rule, note])
        w.writerow(["TOTAL (all lines)", "", "", "", "GUESS", round(total), "", ""])
        w.writerow(["Subtotal used by the design-choice rule (wax + PV + compressor)", "", "", "", "GUESS", round(rule_total), "yes", ""])
    print(f"Saved {out}: total Rs {total:,.0f} (rule subtotal Rs {rule_total:,.0f}) - ALL PRICES ARE GUESSES")


if __name__ == "__main__":
    main()
