// Page "Money: how we calculate": editable inputs -> every formula with its numbers (MoneyCalc = live/money.js).
(function () {
  'use strict';
  const E = window.LIVE && window.LIVE.economics, M = window.MoneyCalc, main = document.getElementById('m');
  if (!E) { main.innerHTML = '<div class="card">No money data yet. Run <code>python -m engine.economics</code>.</div>'; return; }
  const inr = v => (v === null || v === undefined || !isFinite(v) ? '—' : '₹' + Math.round(v).toLocaleString('en-IN'));
  const f = (v, d = 2) => (v === null || v === undefined || !isFinite(v) ? '—' : Number(v).toFixed(d));
  const yrs = v => (v === null ? 'no payback within ' + P.horizon_yr + ' years' : v < 0.05 ? 'at once' : f(v, 1) + ' years');
  const KEY = 'kk-money-v1';
  const P = {};
  for (const [k, v] of Object.entries(E.inputs)) P[k] = v.value;
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { /* ignore */ }
  Object.assign(P, saved);
  const EDIT = [['grid_tariff_INR_kWh', 'Grid tariff (₹/kWh)', 0.5], ['diesel_INR_L', 'Diesel price (₹/L)', 1], ['cut_start_h', 'Power cut starts (hour)', 1],
    ['cut_end_h', 'Power cut ends (hour)', 1], ['random_cut_prob', 'Extra random cuts (chance per hour, 0–1)', 0.01], ['genset_F0_L_h', 'Genset no-load fuel F0 (L/h)', 0.01],
    ['genset_F1_L_kWh', 'Genset fuel per kWh F1 (L/kWh)', 0.01], ['produce_price_INR_kg', 'Produce price (₹/kg)', 1], ['loss_without_pct', 'Loss WITHOUT cold room (%)', 0.5],
    ['loss_with_pct', 'Loss WITH cold room (%)', 0.5], ['produce_kg_day', 'Produce per day (kg)', 1], ['extra_capex_INR', 'Our extra cost (₹) – estimate, quotation pending', 1000],
    ['subsidy_pct', 'Subsidy on our extra cost (%)', 1], ['genset_INR', 'Genset price (₹)', 1000], ['pv_cleaning_INR_yr', 'PV cleaning (₹/yr)', 100],
    ['maintenance_pct_capex_yr', 'Maintenance (% of our extra cost per yr)', 0.5], ['pv_degradation_pct_yr', 'PV degradation (%/yr)', 0.1]];

  function render() {
    const capex = +P.extra_capex_INR || 0, R = M.summary(E.data, P, capex), y = R.per_year, d = R.per_day_avg || {};
    const pd = k => y[k] / 365;
    const n = R.days, S = window.LIVE.summary;
    // ---- check: yearly from the daily rows (sum) vs the headline; and vs the Live Year Run's own grid-only kWh
    const sumDays = k => R.daily[k].reduce((a, b) => a + b, 0) * 365 / n;
    let live = null;
    if (S && S.money) {
      const mIx = new Map(S.money.days.map((x, i) => [x, i]));
      let a = 0, b = 0;
      E.data.days.forEach((dd, i) => { const k = mIx.get(dd); if (k !== undefined) { a += S.money.gridonly_kWh_by_hour[k].reduce((p, q) => p + q, 0); b += R.daily.go_kWh[i]; } });
      live = { a, b };
    }
    const chk = [['Grid-only room, ₹/yr', sumDays('a_grid_only'), y.a_grid_only], ['Diesel-only room, ₹/yr', sumDays('b_diesel_only'), y.b_diesel_only],
      ['Grid + diesel in cuts, ₹/yr', sumDays('c_grid_diesel'), y.c_grid_diesel], ['Our room (grid), ₹/yr', sumDays('d_ours_vs_a'), y.d_ours_vs_a]];
    const py = E.result;
    const pyRow = [['Grid-only ₹/yr (Python file)', py.per_year.a_grid_only], ['Diesel-only ₹/yr (Python file)', py.per_year.b_diesel_only], ['Mixed ₹/yr (Python file)', py.per_year.c_grid_diesel]];
    const dflt = Object.entries(E.inputs).every(([k, v]) => P[k] === v.value);
    const okp = (a, b) => (Math.abs(a - b) <= 0.01 * Math.max(1, Math.abs(b)) ? '<span class="ok">✔ within 1 %</span>' : '<span class="bad">✖ differs</span>');
    const pay = (k, lab) => `<td>${yrs(R.payback_years[`${k}|${lab}|energy`])}</td><td>${yrs(R.payback_years[`${k}|${lab}|with_produce`])}</td>`;
    const months = Object.entries(R.per_month).map(([m, v]) => `<tr><td>${m}</td><td class="n">${inr(v.a_grid_only)}</td><td class="n">${inr(v.b_diesel_only)}</td><td class="n">${inr(v.c_grid_diesel)}</td>
      <td class="n">${inr(v.d_ours_vs_a)}</td><td class="n">${inr(v.a_grid_only - v.d_ours_vs_a)}</td><td class="n">${inr(v.b_diesel_only - v.d_ours_vs_b)}</td><td class="n">${inr(v.c_grid_diesel - v.d_ours_vs_c)}</td></tr>`).join('');
    main.innerHTML = `
    <div class="card"><h2>Inputs (edit – everything below recomputes)</h2>
      <div class="inputs">${EDIT.map(([k, lab, st]) => `<label>${lab}<input type="number" step="${st}" data-k="${k}" value="${P[k]}"><small>${(E.inputs[k].note || '').replace(/^E – /, '<span class="tagE">E</span> ')}</small></label>`).join('')}</div>
      <p><button class="btn ghost" id="reset">Back to default values</button> <span class="note">Your values are kept in this browser only.</span></p></div>

    <div class="card"><h2>1 · The same room, four ways (${n} real days of 2026, then × 365 / ${n})</h2>
      <p class="note">kWh per hour come from the digital twin ${'<b>(S)</b>'}: the grid-only room and our room on the same weather and the same 150 kg loaded at 6 am.</p>
      <h3>a) Grid-only room (no wax, no solar)</h3>
      <div class="f">cost/day = kWh/day × tariff = ${f(pd('go_kWh'), 2)} kWh × ₹${P.grid_tariff_INR_kWh} = ${inr(pd('a_grid_only'))}/day → ${inr(y.a_grid_only)}/year</div>
      <h3>b) Diesel-only room (2 kVA genset)</h3>
      <div class="f">genset hours/day = kWh ÷ full-speed compressor power (on diesel the compressor runs flat out, on/off) = ${f(pd('go_run_h'), 1)} h<br>
        fuel = F0 × hours + F1 × kWh = ${P.genset_F0_L_h} × ${f(pd('go_run_h'), 1)} + ${P.genset_F1_L_kWh} × ${f(pd('go_kWh'), 2)} = ${f(pd('fuel_b_L'), 2)} L/day
        (= ${f(pd('fuel_b_L') / pd('go_kWh'), 2)} L/kWh; at 30 % load ${f(R.fuel_L_per_kWh_30pct, 2)} L/kWh, at full load ${f(R.fuel_L_per_kWh_100pct, 2)} L/kWh)<br>
        cost/day = ${f(pd('fuel_b_L'), 2)} L × ₹${P.diesel_INR_L} = ${inr(pd('b_diesel_only'))}/day → ${inr(y.b_diesel_only)}/year</div>
      <h3>c) Grid + diesel during power cuts (${P.cut_start_h}:00–${P.cut_end_h}:00${P.random_cut_prob > 0 ? ` + random cuts ${P.random_cut_prob * 100} %/h` : ''})</h3>
      <div class="f">cost/day = grid kWh outside cuts × tariff + diesel fuel in cut hours × price = ${inr(pd('c_grid_diesel'))}/day
        (diesel ${f(pd('fuel_c_L'), 2)} L/day in ${f(pd('cut_run_h_c'), 1)} genset hours) → ${inr(y.c_grid_diesel)}/year</div>
      <h3>d) Our solar + wax room – only what it really uses</h3>
      <div class="f">grid kWh/day = ${f(pd('ours_kWh'), 3)} kWh (of which ${f(pd('ours_kWh_in_cuts'), 3)} kWh in cut hours)<br>
        vs a: ${inr(pd('d_ours_vs_a'))}/day = ${inr(y.d_ours_vs_a)}/yr · vs b (on diesel): ${inr(y.d_ours_vs_b)}/yr · vs c (grid + diesel in cuts): ${inr(y.d_ours_vs_c)}/yr</div></div>

    <div class="card"><h2>2 · Energy saving = (a, b or c) − d</h2>
      <div class="big3"><div><span>vs grid-only room</span><b>${inr(R.energy_saving_yr.vs_grid)}/yr</b><span>${inr(R.energy_saving_yr.vs_grid / 365)}/day · ${inr(R.energy_saving_yr.vs_grid / 12)}/month</span></div>
        <div><span>vs diesel-only room</span><b>${inr(R.energy_saving_yr.vs_diesel)}/yr</b><span>${inr(R.energy_saving_yr.vs_diesel / 365)}/day · ${inr(R.energy_saving_yr.vs_diesel / 12)}/month</span></div>
        <div><span>vs grid + diesel in cuts</span><b>${inr(R.energy_saving_yr.vs_mixed)}/yr</b><span>${inr(R.energy_saving_yr.vs_mixed / 365)}/day · ${inr(R.energy_saving_yr.vs_mixed / 12)}/month</span></div></div>
      <details><summary>Per month (₹)</summary><div class="scroll"><table class="t"><tr><th>Month</th><th class="n">a grid</th><th class="n">b diesel</th><th class="n">c mixed</th><th class="n">d ours (grid)</th>
        <th class="n">saved vs a</th><th class="n">saved vs b</th><th class="n">saved vs c</th></tr>${months}</table></div></details></div>

    <div class="card"><h2>3 · Costs that are not energy (per year)</h2>
      <div class="f">ours = cleaning ₹${P.pv_cleaning_INR_yr} + maintenance ${P.maintenance_pct_capex_yr} % × ${inr(capex)} + sensors ₹${P.sensor_replacement_INR}/${P.sensor_life_yr} yr
        + wax ₹${P.wax_INR}/${P.wax_life_yr} yr = <b>${inr(R.extras_yr.ours_INR_yr)}/yr</b><br>
        diesel / mixed rooms: genset ${inr(P.genset_INR)} / ${P.genset_life_yr} yr = ${inr(R.extras_yr.genset_capex_INR_yr)}/yr + upkeep ₹${P.genset_upkeep_INR_per_run_h}/run-hour
        (b ${inr(R.genset_upkeep_yr.b)}/yr, c ${inr(R.genset_upkeep_yr.c)}/yr)<br>
        PV degradation ${P.pv_degradation_pct_yr} %/yr: the yearly saving shrinks by that much each year in the payback.</div>
      <table class="t"><tr><th></th><th class="n">vs grid-only</th><th class="n">vs diesel-only</th><th class="n">vs grid + diesel</th></tr>
        <tr><td>Energy saving</td><td class="n">${inr(R.energy_saving_yr.vs_grid)}</td><td class="n">${inr(R.energy_saving_yr.vs_diesel)}</td><td class="n">${inr(R.energy_saving_yr.vs_mixed)}</td></tr>
        <tr><td><b>Net saving after the extra costs</b></td><td class="n"><b>${inr(R.net_saving_yr.vs_grid)}</b></td><td class="n"><b>${inr(R.net_saving_yr.vs_diesel)}</b></td><td class="n"><b>${inr(R.net_saving_yr.vs_mixed)}</b></td></tr></table></div>

    <div class="card est"><h2>4 · Value of produce saved – ESTIMATE (separate line)</h2>
      <div class="f">${P.produce_kg_day} kg/day × ₹${P.produce_price_INR_kg}/kg × (${P.loss_without_pct} % − ${P.loss_with_pct} %) × 365 = <b>${inr(R.produce_value_yr)}/yr</b></div>
      <p>Not mixed into the energy saving. Total including it: vs grid ${inr(R.total_with_produce_yr.vs_grid)}, vs diesel ${inr(R.total_with_produce_yr.vs_diesel)},
        vs grid + diesel ${inr(R.total_with_produce_yr.vs_mixed)} per year. The loss percentages and the price are guesses – change them above.</p></div>

    <div class="card"><h2>5 · Payback of our extra cost (${inr(capex)}, estimate – quotation pending; after ${P.subsidy_pct} % subsidy ${inr(R.capex_after_subsidy)})</h2>
      <table class="t"><tr><th>Compared with</th><th>No subsidy: energy only</th><th>No subsidy: + produce value</th><th>With subsidy: energy only</th><th>With subsidy: + produce value</th></tr>
        <tr><td>Grid-only room</td>${pay('vs_grid', 'no_subsidy')}${pay('vs_grid', 'subsidy')}</tr>
        <tr><td>Diesel-only room</td>${pay('vs_diesel', 'no_subsidy')}${pay('vs_diesel', 'subsidy')}</tr>
        <tr><td>Grid + diesel in cuts</td>${pay('vs_mixed', 'no_subsidy')}${pay('vs_mixed', 'subsidy')}</tr></table>
      <details><summary>What is in the extra cost</summary><table class="t">${(E.capex_items || []).map(i => `<tr><td>${i.item}</td><td class="n">${inr(i.INR)}</td></tr>`).join('')}</table></details></div>

    <div class="card"><h2>6 · Check: recomputed by hand from the daily rows</h2>
      <table class="t"><tr><th></th><th class="n">sum of the ${n} daily rows × 365/${n}</th><th class="n">headline</th><th></th></tr>
        ${chk.map(([l, a, b]) => `<tr><td>${l}</td><td class="n">${inr(a)}</td><td class="n">${inr(b)}</td><td>${okp(a, b)}</td></tr>`).join('')}
        ${dflt ? pyRow.map(([l, v], i) => `<tr><td>${l} vs this page</td><td class="n">${inr(v)}</td><td class="n">${inr(chk[i][2])}</td><td>${okp(v, chk[i][2])}</td></tr>`).join('') : '<tr><td colspan="4" class="note">Python cross-check shown with the default inputs only.</td></tr>'}
        ${live ? `<tr><td>Grid-only kWh: this twin run vs the Live Year Run file</td><td class="n">${f(live.b, 1)} kWh</td><td class="n">${f(live.a, 1)} kWh</td><td>${okp(live.b, live.a)}</td></tr>` : ''}</table></div>

    `;
    main.querySelectorAll('input[data-k]').forEach(i => i.addEventListener('change', () => {
      P[i.dataset.k] = +i.value; const o = {}; EDIT.forEach(([k]) => (o[k] = P[k]));
      try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) { /* ignore */ }
      render();
    }));
    document.getElementById('reset').onclick = () => { try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ } for (const [k, v] of Object.entries(E.inputs)) P[k] = v.value; render(); };
  }
  render();
})();
