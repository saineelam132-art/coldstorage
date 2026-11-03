"""Design-point report: every formula with the numbers plugged in.

Run it:   python -m engine.report            (prints a table)
          python -m engine.report --csv out.csv

The same list of steps will feed the website's "Calculations" screen.
"""
import argparse
import csv
import sys

from . import loads, psychro, pv, r290, shelf_life
from .config import load_config, load_crops, u_value
from .pcm import PCMBattery
from .pcm_slab import simulate_slab


def _row(group, name, formula, substituted, value, unit):
    return {"group": group, "name": name, "formula": formula,
            "substituted": substituted, "value": value, "unit": unit}


def design_point(cfg=None, crops=None, T_out_C=None, rh_out_pct=None, crop_key=None,
                 G_poa=800.0, include_slab=True):
    cfg = cfg or load_config()
    crops = crops or load_crops()
    T_out = cfg["design_ambient"]["T_out_C"] if T_out_C is None else T_out_C
    rh_out = cfg["design_ambient"]["rh_out_pct"] if rh_out_pct is None else rh_out_pct
    crop = crops[crop_key or cfg["product"]["default_crop"]]
    T_in = cfg["setpoint"]["target_C"]
    rh_in = cfg["setpoint"]["rh_room_pct"]
    rows = []

    # --- 1. wall
    w = loads.wall_load(cfg, T_out, T_in)
    ch = cfg["chamber"]
    rows.append(_row("1 Wall", "U-value", "U = k / t",
                     f"{ch['insulation_k_W_mK']} / {ch['insulation_thickness_m']}",
                     u_value(cfg), "W/m2K"))
    rows.append(_row("1 Wall", "Q_wall", w["formula"],
                     f"{w['U_W_m2K']:.3f} x {w['A_m2']} x ({T_out} - {T_in}) / 1000",
                     w["Q_kW"], "kW"))

    # --- 2. infiltration
    inf = loads.infiltration_load(cfg, T_out, rh_out, T_in, rh_in)
    rows += [
        _row("2 Door", "h_out", "h = 1.006T + W(2501 + 1.86T)",
             f"T={T_out}, RH={rh_out}% -> W={inf['W_out']:.4f}", inf["h_out_kJ_kg"], "kJ/kg"),
        _row("2 Door", "h_in", "h = 1.006T + W(2501 + 1.86T)",
             f"T={T_in}, RH={rh_in}% -> W={inf['W_in']:.4f}", inf["h_in_kJ_kg"], "kJ/kg"),
        _row("2 Door", "rho_out", "rho = p/(R_da*T)*(1+W)/(1+1.608W)", "", inf["rho_out"], "kg/m3"),
        _row("2 Door", "rho_in", "rho = p/(R_da*T)*(1+W)/(1+1.608W)", "", inf["rho_in"], "kg/m3"),
        _row("2 Door", "F_m", "F_m = [2/(1+(rho_in/rho_out)^(1/3))]^1.5",
             f"rho_in/rho_out = {inf['rho_in']/inf['rho_out']:.4f}", inf["F_m"], "-"),
        _row("2 Door", "q (door fully open)",
             "q = 0.221*A*(h_out-h_in)*rho_in*(1-rho_out/rho_in)^0.5*(g*H)^0.5*F_m",
             f"0.221 x {inf['A_m2']:.2f} x {inf['h_out_kJ_kg']-inf['h_in_kJ_kg']:.1f} x "
             f"{inf['rho_in']:.3f} x {(1-inf['rho_out']/inf['rho_in'])**0.5:.3f} x "
             f"{(9.81*inf['H_m'])**0.5:.3f} x {inf['F_m']:.3f}", inf["q_open_kW"], "kW"),
        _row("2 Door", "Q_infiltration (average)", "Q = q * D_t * D_f * (1 - E)",
             f"{inf['q_open_kW']:.2f} x {inf['D_t']:.4f} x {inf['D_f']} x (1 - {inf['E']})",
             inf["Q_kW"], "kW"),
        _row("2 Door", "  sensible part", "h(T_out,W_out) - h(T_in,W_out)", "", inf["Q_sensible_kW"], "kW"),
        _row("2 Door", "  latent part", "h(T_in,W_out) - h(T_in,W_in)", "", inf["Q_latent_kW"], "kW"),
    ]
    inf_nc = loads.infiltration_load(cfg, T_out, rh_out, T_in, rh_in, curtain=False)
    rows.append(_row("2 Door", "Q_infiltration WITHOUT curtain", "Q = q * D_t * D_f * (1 - 0)",
                     "", inf_nc["Q_kW"], "kW"))

    # --- 3. product
    pr = loads.product_load(cfg, crop)
    rows += [
        _row("3 Product", "Q_pulldown", "Q = m * cp * (T_entry - T_final) / time",
             f"{pr['m_kg']} x {pr['cp_kJ_kgK']} x {pr['dT_K']} / ({pr['hours']} x 3600)",
             pr["Q_pulldown_kW"], "kW"),
        _row("3 Product", f"Q_respiration ({crop['label']})", "Q = m * r_ref * Q10^((T-T_ref)/10)",
             f"{pr['m_kg']} x {crop['respiration_W_per_kg_at_ref']} W/kg x "
             f"{crop['Q10']}^(({T_in}-{crop['T_ref_C']})/10) / 1000",
             pr["Q_respiration_kW"], "kW"),
    ]

    # --- 4. total
    tot = loads.total_load(cfg, crop, T_out, rh_out)
    rows += [
        _row("4 Total", "Fans, lights, controller", tot["internal"]["formula"], "", tot["internal"]["Q_kW"], "kW"),
        _row("4 Total", "Total load (pull-down hours)", "wall + door + product + internal",
             " + ".join(f"{v:.3f}" for v in (w["Q_kW"], inf["Q_kW"], pr["Q_kW"], tot["internal"]["Q_kW"])),
             tot["subtotal_kW"], "kW"),
        _row("4 Total", "Safety margin (10 %)", "0.10 x total", "", tot["safety_margin_kW"], "kW"),
        _row("4 Total", "Total with margin", "total x 1.10", "", tot["total_with_margin_kW"], "kW"),
    ]
    hold = loads.total_load(cfg, crop, T_out, rh_out, in_pulldown=False)
    rows.append(_row("4 Total", "Holding load (no pull-down)", "wall + door + respiration + internal",
                     "", hold["subtotal_kW"], "kW"))

    # --- 5. R290 cycle (design temperatures)
    c = r290.cycle_from_config(cfg)
    rows += [
        _row("5 R290", "P_evap", "P_sat(T_evap)", f"T_evap = {c['T_evap_C']} C", c["P_evap_bar"], "bar"),
        _row("5 R290", "P_cond", "P_sat(T_cond)", f"T_cond = {c['T_cond_C']} C", c["P_cond_bar"], "bar"),
        _row("5 R290", "h1", "sat. vapour at T_evap", "", c["h1"], "kJ/kg"),
        _row("5 R290", "h2s", "h(P_cond, s = s1)", "", c["h2s"], "kJ/kg"),
        _row("5 R290", "h2 (real)", "h2 = h1 + (h2s-h1)/eta_is",
             f"{c['h1']:.1f} + {c['w_s']:.1f}/{c['eta_is']}", c["h2"], "kJ/kg"),
        _row("5 R290", "h3 = h4", "sat. liquid at T_cond", "", c["h3"], "kJ/kg"),
        _row("5 R290", "q_e", "q_e = h1 - h4", f"{c['h1']:.1f} - {c['h4']:.1f}", c["q_e"], "kJ/kg"),
        _row("5 R290", "w_s", "w_s = h2s - h1", f"{c['h2s']:.1f} - {c['h1']:.1f}", c["w_s"], "kJ/kg"),
        _row("5 R290", "COP_ideal", "q_e / w_s", f"{c['q_e']:.1f} / {c['w_s']:.1f}", c["COP_ideal"], "-"),
        _row("5 R290", "COP_real", "COP_ideal x eta_is", f"{c['COP_ideal']:.3f} x {c['eta_is']}", c["COP_real"], "-"),
        _row("5 R290", "COP_elec", "COP_real x eta_motor", f"{c['COP_real']:.3f} x {c['eta_motor']}", c["COP_elec"], "-"),
        _row("5 R290", "mass flow", "m = Q / q_e", f"{c['Q_evap_kW']} / {c['q_e']:.1f}", c["m_dot_g_s"], "g/s"),
        _row("5 R290", "Electrical power", "P = Q / COP_elec", f"{c['Q_evap_kW']} / {c['COP_elec']:.3f}", c["P_elec_kW"], "kW"),
    ]
    c_live = r290.cycle_from_config(cfg, T_amb_C=T_out)
    rows.append(_row("5 R290", f"COP_elec live (T_cond = {T_out}+10 C)", "same cycle, T_cond = T_amb + 10 K",
                     "", c_live["COP_elec"], "-"))

    # --- 6. PV
    p = pv.pv_power(cfg, G_poa, T_out)
    pvc = cfg["pv"]
    rows += [
        _row("6 PV", "T_cell", "T_cell = T_amb + (NOCT-20)/800 * G",
             f"{T_out} + ({pvc['NOCT_C']}-20)/800 x {G_poa}", p["T_cell_C"], "C"),
        _row("6 PV", "P_pv", "P = P_rated*(G/1000)*PR*[1-0.004*(T_cell-25)]",
             f"{pvc['rated_kWp']} x {G_poa/1000} x {pvc['performance_ratio']} x {p['temp_factor']:.3f}",
             p["P_kW"], "kW"),
    ]

    # --- 7. PCM battery
    b = PCMBattery(cfg, frozen_fraction=1.0)
    pc = cfg["pcm"]
    rows += [
        _row("7 PCM", "Latent store", "E = m * L * frozen_fraction",
             f"{pc['mass_kg']} x {pc['latent_kJ_kg']} x 1.0", b.latent_remaining_kJ / 3600.0, "kWh"),
        _row("7 PCM", "Total cold store (to 8 C)", "E = m * [L + cp_l*(T_used - T_m)]",
             f"{pc['mass_kg']} x [{pc['latent_kJ_kg']} + {pc['cp_liquid_kJ_kgK']} x ({pc['T_fully_used_C']} - {pc['T_melt_C']})]",
             b.energy_remaining_kJ / 3600.0, "kWh"),
        _row("7 PCM", "Backup time (holding load)", "t = E_remaining / Q_holding",
             f"{b.energy_remaining_kJ:.0f} kJ / {hold['subtotal_kW']:.3f} kW / 3600",
             b.backup_hours(hold["subtotal_kW"]), "h"),
    ]

    # --- 8. PCM slab (FTCS)
    if include_slab:
        s = simulate_slab(cfg, hours=12, T_init_C=2.0, T_air_C=8.0)
        rows += [
            _row("8 Slab", "Slab thickness", "t = m / (rho * A)",
                 f"{pc['mass_kg']} / ({pc['density_kg_m3']} x {pc['slab_area_m2']})", s["thickness_mm"], "mm"),
            _row("8 Slab", "Stability number r", "r = alpha*dt/dx^2 <= 0.5",
                 f"{s['alpha_m2_s']:.3e} x {s['dt_s']:.3f} / ({s['dx_mm']/1000:.4f})^2", s["r"], "-"),
            _row("8 Slab", "Liquid fraction after 12 h in 8 C air", "enthalpy method", "",
                 s["liquid_fraction"][-1], "-"),
            _row("8 Slab", "Melt front after 12 h", "sum(liquid fraction * dx)", "", s["melt_front_mm"][-1], "mm"),
        ]

    # --- 9. Shelf life (example: 3 days at 5 C)
    sl = shelf_life.assess(crop, [T_in] * 72, 1.0)
    rows += [
        _row("9 Shelf life", f"rate at {T_in} C ({crop['label']})", "rate = 1/SL_ref * Q10^((T-T_ref)/10)",
             f"1/{crop['SL_ref_days']} x {crop['Q10']}^(({T_in}-{crop['T_ref_C']})/10)",
             shelf_life.rate_per_day(crop, T_in), "1/day"),
        _row("9 Shelf life", "Remaining after 3 days at 5 C (at T_ref)", "SL_ref * (1 - sum(rate*dt))",
             "", sl["remaining_days_at_ref"], "days"),
        _row("9 Shelf life", "Freshness score", "100 * (1 - used)", "", sl["freshness_score"], "/100"),
    ]
    for wmsg in sl["warnings"]:
        rows.append(_row("9 Shelf life", "WARNING", "", wmsg, float("nan"), ""))

    return rows


def print_table(rows, out=sys.stdout):
    group = None
    for r in rows:
        if r["group"] != group:
            group = r["group"]
            out.write(f"\n=== {group} " + "=" * (60 - len(group)) + "\n")
        val = "" if r["value"] != r["value"] else f"{r['value']:.4g}"   # NaN -> blank
        out.write(f"  {r['name']:<42} {val:>10} {r['unit']:<6}  {r['formula']}\n")
        if r["substituted"]:
            out.write(f"  {'':<42} {'':>10} {'':<6}    = {r['substituted']}\n")


def main(argv=None):
    ap = argparse.ArgumentParser(description="Print every design-point formula with numbers.")
    ap.add_argument("--csv", help="also save the table to this CSV file")
    ap.add_argument("--crop", default=None)
    ap.add_argument("--tout", type=float, default=None, help="outside temperature, C")
    ap.add_argument("--rh", type=float, default=None, help="outside RH, %")
    a = ap.parse_args(argv)
    rows = design_point(T_out_C=a.tout, rh_out_pct=a.rh, crop_key=a.crop)
    print("ColdTrust Twin - design-point calculations (all values computed, none typed in)")
    print_table(rows)
    if a.csv:
        with open(a.csv, "w", newline="", encoding="utf-8") as f:
            wr = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
            wr.writeheader()
            wr.writerows(rows)
        print(f"\nSaved {a.csv}")


if __name__ == "__main__":
    main()
