// "Money: how we calculate" – the same formulas as engine/economics.py (parity test in tests/test_economics.py).
// Data: window.LIVE.economics (python -m engine.economics). Plain script: works offline, on Vercel and Firebase.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.MoneyCalc = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const fuel = (kWh, runH, F0, F1) => F0 * runH + F1 * kWh;
  function cutMask(nDays, P) {
    const a = P.cut_start_h, b = P.cut_end_h, m = [];
    let seed = (P.random_cut_seed >>> 0) || 1;
    const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };   // page-only random cuts
    for (let d = 0; d < nDays; d++) {
      const row = [];
      for (let h = 0; h < 24; h++) {
        let c = a <= b ? h >= a && h < b : h >= a || h < b;
        if (P.random_cut_prob > 0 && rnd() < P.random_cut_prob) c = true;
        row.push(c);
      }
      m.push(row);
    }
    return m;
  }
  function dayCosts(D, P) {
    const n = D.days.length, cut = cutMask(n, P), t = P.grid_tariff_INR_kWh, dp = P.diesel_INR_L, F0 = P.genset_F0_L_h, F1 = P.genset_F1_L_kWh;
    const keys = ['a_grid_only', 'b_diesel_only', 'c_grid_diesel', 'd_ours_vs_a', 'd_ours_vs_b', 'd_ours_vs_c', 'fuel_b_L', 'fuel_c_L', 'go_kWh', 'ours_kWh', 'go_run_h', 'cut_run_h_c', 'ours_kWh_in_cuts'];
    const o = Object.fromEntries(keys.map(k => [k, new Array(n).fill(0)]));
    for (let d = 0; d < n; d++) for (let h = 0; h < 24; h++) {
      const go = D.go_kWh[d][h], gr = D.go_run_h[d][h], ok = D.ours_kWh[d][h], orn = D.ours_run_h[d][h], c = cut[d][h];
      const fg = fuel(go, gr, F0, F1), fo = fuel(ok, orn, F0, F1);
      o.a_grid_only[d] += go * t; o.b_diesel_only[d] += fg * dp; o.c_grid_diesel[d] += c ? fg * dp : go * t;
      o.d_ours_vs_a[d] += ok * t; o.d_ours_vs_b[d] += fo * dp; o.d_ours_vs_c[d] += c ? fo * dp : ok * t;
      o.fuel_b_L[d] += fg; if (c) { o.fuel_c_L[d] += fg; o.cut_run_h_c[d] += gr; o.ours_kWh_in_cuts[d] += ok; }
      o.go_kWh[d] += go; o.ours_kWh[d] += ok; o.go_run_h[d] += gr;
    }
    return o;
  }
  const sum = a => a.reduce((x, y) => x + y, 0);
  function payback(capex, s1, degr, horizon) {
    if (capex <= 0) return 0;
    let cum = 0;
    for (let y = 1; y <= horizon; y++) {
      const s = s1 * Math.pow(1 - degr / 100, y - 1);
      if (s <= 0) return null;
      if (cum + s >= capex) return y - 1 + (capex - cum) / s;
      cum += s;
    }
    return null;
  }
  function summary(D, P, capex) {
    const n = D.days.length, c = dayCosts(D, P), yr = {};
    for (const k in c) yr[k] = sum(c[k]) * 365 / n;
    const ours = P.pv_cleaning_INR_yr + P.maintenance_pct_capex_yr / 100 * capex + P.sensor_replacement_INR / P.sensor_life_yr + P.wax_INR / P.wax_life_yr;
    const gk = P.genset_INR / P.genset_life_yr, upB = yr.go_run_h * P.genset_upkeep_INR_per_run_h, upC = yr.cut_run_h_c * P.genset_upkeep_INR_per_run_h;
    const energy = { vs_grid: yr.a_grid_only - yr.d_ours_vs_a, vs_diesel: yr.b_diesel_only - yr.d_ours_vs_b, vs_mixed: yr.c_grid_diesel - yr.d_ours_vs_c };
    const net = { vs_grid: energy.vs_grid - ours,
      vs_diesel: energy.vs_diesel - ours + upB + (P.ours_needs_genset_in_diesel_village ? 0 : gk),
      vs_mixed: energy.vs_mixed - ours + upC + (P.ours_needs_genset_with_grid_cuts ? 0 : gk) };
    const pv = P.produce_kg_day * P.produce_price_INR_kg * (P.loss_without_pct - P.loss_with_pct) / 100 * 365;
    const sub = capex * (1 - P.subsidy_pct / 100), pay = {};
    for (const k in net) for (const [lab, cap] of [['no_subsidy', capex], ['subsidy', sub]]) {
      pay[`${k}|${lab}|energy`] = payback(cap, net[k], P.pv_degradation_pct_yr, P.horizon_yr);
      pay[`${k}|${lab}|with_produce`] = payback(cap, net[k] + pv, P.pv_degradation_pct_yr, P.horizon_yr);
    }
    const months = {};
    D.days.forEach((d, i) => {
      const m = months[d.slice(0, 7)] = months[d.slice(0, 7)] || { a_grid_only: 0, b_diesel_only: 0, c_grid_diesel: 0, d_ours_vs_a: 0, d_ours_vs_b: 0, d_ours_vs_c: 0 };
      for (const k in m) m[k] += c[k][i];
    });
    const kW = f => P.genset_kVA * P.genset_pf * f;
    return { days: n, daily: c, per_year: yr, energy_saving_yr: energy, extras_yr: { ours_INR_yr: ours, genset_capex_INR_yr: gk },
      genset_upkeep_yr: { b: upB, c: upC }, net_saving_yr: net, produce_value_yr: pv,
      total_with_produce_yr: Object.fromEntries(Object.entries(net).map(([k, v]) => [k, v + pv])), payback_years: pay,
      capex, capex_after_subsidy: sub, per_month: months,
      fuel_L_per_kWh_30pct: fuel(kW(0.3), 1, P.genset_F0_L_h, P.genset_F1_L_kWh) / kW(0.3),
      fuel_L_per_kWh_100pct: fuel(kW(1), 1, P.genset_F0_L_h, P.genset_F1_L_kWh) / kW(1) };
  }
  return { fuel, cutMask, dayCosts, payback, summary };
});
