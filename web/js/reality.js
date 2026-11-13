// Control centre tabs "Room & capacity" (results/live/space_budget.json) and "Reality check"
// (results/live/stress_2026.json + best_load_2026.json). Every number is read from those files.
import { getJSON } from './api.js';
import { tagChip } from './ui.js';

const n = (x, d = 0) => (x === null || x === undefined ? '—' : Number(x).toFixed(d));
const inr = x => (x === null || x === undefined ? '—' : '₹' + Math.round(x).toLocaleString('en-IN'));
async function tryJSON(u) { try { return await getJSON(u); } catch (e) { return null; } }

export async function roomHTML() {
  const S = await tryJSON('results/live/space_budget.json');
  if (!S) return '<p>No space budget yet – run <code>python -m engine.space</code>.</p>';
  const P = S.pomegranate, L = S.layout;
  const opts = Object.entries(L.options).map(([k, v]) => `<tr><td>${{ two_side_racks: 'Racks on left + right wall', L_shape: 'L-shape: left wall + back wall', back_only: 'One rack on the back wall' }[k] || k}${k === L.chosen ? ' <b>(chosen)</b>' : ''}</td>
    <td class="num">${n(v.aisle_m, 2)} m</td><td class="num">${v.crates}</td><td>${v.ok ? 'aisle OK' : '<b class="warnc">aisle too narrow (&lt; 0.6 m)</b>'}</td></tr>`).join('');
  const E = Object.entries(S.assumptions_E).filter(([, v]) => String(v.note).startsWith('E')).map(([k, v]) =>
    `<tr><td>${k.replace(/_/g, ' ')}</td><td class="num">${Array.isArray(v.value) ? v.value.join(' × ') : v.value}</td><td>${v.note.replace(/^E – /, '')}</td></tr>`).join('');
  return `    <img class="ccfig" src="figures/final_11_space_budget.png" alt="Top and side view of the room: wax panels, keep-clear air, racks, crates, aisle">
    <h3>Space budget (adds up to ${n(S.zones_sum_m3, 2)} m³)</h3>
    <table class="calc"><tr class="grp"><td>Item</td><td class="num">Floor m²</td><td class="num">Volume m³</td><td class="num">% of room</td></tr>
    ${S.table.map(r => `<tr><td>${r.item}</td><td class="num">${n(r.floor_m2, 2)}</td><td class="num">${n(r.volume_m3, 2)}</td><td class="num">${n(r.pct_of_room, 1)} %</td></tr>`).join('')}</table>
    <p class="note">Wax ${n(S.wax.wax_kg)} kg = ${n(S.wax.wax_volume_liquid_m3, 3)} m³ liquid (${n(S.wax.slab_mm, 1)} mm slab on ${S.wax.panel_area_m2} m² of wall);
      aluminium ${n(S.aluminium_kg.total)} kg (fins ${n(S.aluminium_kg.fins)} kg + casing ${n(S.aluminium_kg.casing)} kg). Panel + fins stand
      ${n(S.wax.panel_depth_m * 100, 1)} cm out from the wall, plus ${n(S.wax.keep_clear_m * 100)} cm keep-clear air for natural convection.</p>
    <h3>Rack layouts</h3><table class="calc"><tr class="grp"><td>Layout</td><td class="num">Aisle</td><td class="num">Crate places</td><td></td></tr>${opts}</table>
    <h3>Capacity and pomegranate count</h3>
    <div class="kv">
      <span>Crate places (${L.shelves_m.length} shelves, one crate high)</span><b>${S.crate_places}</b>
      <span>Pomegranate per crate (bruising limit ${tagChip('E')})</span><b>${S.kg_per_crate} kg</b>
      <span>Room capacity</span><b>${S.capacity_kg} kg</b>
      <span>Fruit (${P.fruit_mass_g} g each ${tagChip('E')}) per kg</span><b>${n(P.fruits_per_kg, 1)}</b>
      <span>Fruits per crate</span><b>${P.fruits_per_crate}</b>
      <span>Fruits in 150 kg</span><b>${P.fruits_per_150_kg}</b>
      <span>Fruits with the room full</span><b>${P.fruits_full_room}</b>
      <span>Fruit volume per crate vs crate inside</span><b>${n(P.net_fruit_volume_per_crate_m3, 3)} / ${n(P.crate_inner_m3, 3)} m³</b></div>
    <p class="note">So 150 kg a day works only if each day's produce leaves the next day (1-day stay). Produce that stays 3 days needs 450 kg of
      crate places – more than the room holds.</p>
    <h3>Assumptions ${tagChip('E')}</h3><table class="calc">${E}</table>`;
}

const ROWS = [['days_full_solar_wax', 'Days fully on solar + wax', 0], ['grid_h_per_year', 'Grid h/yr', 0], ['grid_kWh_per_year', 'Grid kWh/yr', 0],
  ['comp_kWh_day', 'Compressor kWh/day', 2], ['solar_used_pct', 'Solar used %', 0], ['wax_sunset_worst_pct', 'Wax at sunset, worst %', 0],
  ['air_above_8C_h_day', 'Air > 8 °C h/day', 1], ['produce_above_8C_h_day', 'Produce core > 8 °C h/day', 1],
  ['hottest_night_room_max_C', 'Hottest night room max °C', 1], ['freshness_lost_pct_per_batch', 'Freshness lost per batch %', 1],
  ['saved_vs_grid_INR_yr', '₹/yr saved vs grid', -1], ['saved_vs_diesel_INR_yr', '₹/yr saved vs diesel', -1]];

export async function realityHTML() {
  const S = await tryJSON('results/live/stress_2026.json');
  if (!S) return '<p>No reality check yet – run <code>python -m twin.stress_2026</code>.</p>';
  const B = await tryJSON('results/live/best_load_2026.json');
  const order = S.order.filter(k => S.cases[k]);
  const head = `<tr class="grp"><td>Case</td>${ROWS.map(r => `<td class="num">${r[1]}</td>`).join('')}</tr>`;
  const body = order.map(k => {
    const c = S.cases[k], ng = k.endsWith('no_grid');
    return `<tr class="${k === 'base' ? 'base' : k.startsWith('realistic') ? 'real' : ''}"><td>${c.label}${c.E ? ` <span class="tag E" title="${c.E}">E</span>` : ''}</td>
      ${ROWS.map(([f, , d]) => `<td class="num">${f === 'days_full_solar_wax' && ng ? 'n/a' : d < 0 ? inr(c[f]) : n(c[f], d)}</td>`).join('')}</tr>`;
  }).join('');
  const lines = order.filter(k => k !== 'base').map(k => `<li>${S.cases[k].line}</li>`).join('');
  const loo = S.leave_one_out ? Object.entries(S.leave_one_out.without).map(([k, v]) =>
    `<tr><td>${S.cases[k] ? S.cases[k].label : k}</td><td class="num">${v.days_full_solar_wax}</td><td class="num">${n(v.grid_h_per_year)}</td></tr>`).join('') : '';
  let best = '';
  if (B) {
    const bb = B.best.realistic_fix || {};
    const sz = (B.sizing.realistic_fix || []).map(r => `<tr><td>${r.pv_kWp} kWp + ${n(r.pcm_kg)} kg wax</td><td class="num">${r.days_full_solar_wax}</td><td class="num">${n(r.grid_h_per_year)}</td><td class="num">${n(r.solar_used_pct)} %</td></tr>`).join('');
    best = `<h3>Best daily load ${tagChip('S')}</h3>
      <p>Rule: ${B.rule.a_text} (${n(B.rule.a_days_min)} of ${B.days} days), ${B.rule.b_text}, ${B.rule.c_text}.
      Largest intake that passes all three (REALISTIC + smart controller): 1-day stay <b>${bb['1'] ?? 'none'}</b>, 3-day stay <b>${bb['3'] ?? 'none'}</b>,
      7-day stay <b>${bb['7'] ?? 'none'}</b> kg/day.</p>
      <img class="ccfig" src="figures/final_14_best_load.png" alt="Days on solar + wax against daily intake, and PV / wax sizing">
      <table class="calc"><tr class="grp"><td>Size at 150 kg/day (REALISTIC + smart controller)</td><td class="num">Days solar + wax</td><td class="num">Grid h/yr</td><td class="num">Solar used</td></tr>${sz}</table>`;
  }
  return `<p class="lead">The published numbers are the <b>best case</b>. Here every "loophole" is closed one at a time, then all together
    ${tagChip('S')}. Same 2026 weather (${S.cases.base.days} days) and the same final design. Values marked ${tagChip('E')} are assumptions.</p>
    <div class="headpair"><div><span>Best case (published)</span><b>${S.headline.base_days} days</b></div>
      <div><span>Realistic (all loopholes)</span><b>${S.headline.realistic_days} days</b></div>
      <div><span>Realistic + smart controller</span><b>${S.headline.realistic_fix_days} days</b></div></div>
    <img class="ccfig" src="figures/final_13_stress_cases.png" alt="Bar charts: days on solar + wax, grid hours and hours above 8 °C for every case">
    <div class="scroll"><table class="calc stress">${head}${body}</table></div>
    <h3>In plain words</h3><ul class="plain">${lines}</ul>
    ${loo ? `<h3>Which loophole matters most?</h3><p class="note">${S.leave_one_out.about}</p>
      <table class="calc"><tr class="grp"><td>Left out</td><td class="num">Days solar + wax</td><td class="num">Grid h/yr</td></tr>
      <tr><td><b>nothing left out</b></td><td class="num">${S.leave_one_out.with_all.days_full_solar_wax}</td><td class="num">${n(S.leave_one_out.with_all.grid_h_per_year)}</td></tr>${loo}</table>` : ''}
    <h3>Energy of one day ${tagChip('S')}</h3><img class="ccfig" src="figures/final_12_energy_day.png" alt="Hour-by-hour solar, compressor and wax cold for three days, and where the energy goes">
    ${best}
    <h3>Notes</h3><ul class="plain">${Object.values(S.notes).map(x => `<li>${x}</li>`).join('')}</ul>`;
}
