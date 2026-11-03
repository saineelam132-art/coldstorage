// What the detail panel shows for each sensor and each building part.
// Numbers come only from /api/state (digital twin) and /api/config (design.json).
import { fmt, sensorValue, tagChip, sourceBadge, openPanel, drawHistory } from './ui.js';
import { getJSON } from './api.js';
import { lineChart, phChart } from './charts.js';

let CFG = null, SENSORS = {}, MANIFEST = null, SCENES = null, getState = () => null, getT = () => 0;
export function initDetails(cfg, sensors, manifest, scenes, stateFn, tFn) {
  CFG = cfg; MANIFEST = manifest; SCENES = scenes; getState = stateFn; getT = tFn;
  sensors.sensors.forEach(s => (SENSORS[s.id] = s));
}
export const sensorById = id => SENSORS[id];

function closeupImg(key) {
  const name = SCENES?.closeups?.[key];
  const a = name && MANIFEST?.A?.[name];
  return a ? `<img class="closeup" src="${a.small}" alt="${key} close-up">` : '';
}

// ------------------------------------------------------------- tooltips
export function sensorTip(id) {
  const s = SENSORS[id], st = getState();
  if (!s) return '';
  return `<b>${s.name}</b>${tagChip(s.tag)}<span class="v">${sensorValue(s, st)}</span><small>${s.location}</small>`;
}
export function partTip(id) {
  const p = PARTS[id], st = getState();
  if (!p || !st) return '';
  return `<b>${p.name}</b><span class="v">${p.headline(st.values)}</span><small>Click for details</small>`;
}

// ------------------------------------------------------------- sensor panel
export function openSensor(id) {
  const s = SENSORS[id];
  if (!s) return;
  const hasHistory = !['door_open', 'door_angle', 'v_door_top', 'v_door_mid', 'v_door_bot', 'dp_top', 'gas_ppm', 'RH_room'].includes(s.quantity);
  const render = () => {
    const st = getState();
    return `<h2>${s.name}</h2><div class="sub">${tagChip(s.tag)} ${sourceBadge(st)}</div>
      <div class="big" data-live="v">${sensorValue(s, st)}</div>
      ${s.tag === 'C' ? `<div class="note">In the twin this value is <b>calculated</b> from the door physics (ASHRAE Gosney–Olama). With the real sensor fitted it becomes a measurement (M) that checks the formula.</div>` : ''}
      ${extraFor(s, st)}
      ${hasHistory ? '<canvas id="hist"></canvas>' : ''}
      <table>
        <tr><td>Sensor type</td><td>${s.type}</td></tr>
        <tr><td>Range</td><td>${s.range}</td></tr>
        <tr><td>Accuracy</td><td>${s.accuracy}</td></tr>
        <tr><td>Location</td><td>${s.location}</td></tr>
        <tr><td>Protocol</td><td>${s.protocol}</td></tr>
        <tr><td>Used in</td><td>${s.used_in}</td></tr>
      </table>
      ${s.id === 't_out' || s.id === 'wind' ? closeupImg('mast') : ''}
      <div class="note">${st?.label || ''}</div>`;
  };
  const el = openPanel(render);
  if (hasHistory) drawHistory(el.querySelector('#hist'), s.quantity, getT(), s.unit, s.name);
}

function extraFor(s, st) {
  const v = st?.values || {};
  if (s.id.startsWith('v_') || s.id === 'dp') {
    return `<div class="kv" data-live="door">
      <span>Door now</span><b>${v.door_open ? 'OPEN' : 'closed'}</b>
      <span>Air speed if the door opens</span><b>${fmt(v.v_door_if_open, 'm/s')}</b>
      <span>Heat entering if open</span><b>${fmt(v.heat_if_open_kW, 'kW')}</b>
      <span>Strip curtain</span><b>${v.curtain ? 'ON (E = 0.85)' : 'OFF'}</b></div>
      <div class="formula">V̇ = 0.221·A·√(g·H·(1 − ρ_out/ρ_in))·F_m<br>v ≈ V̇ / (A/2) · (1 − E)<br>Δp_top = (ρ_in − ρ_out)·g·H/2</div>`;
  }
  return '';
}

// ------------------------------------------------------------- parts
const pct = x => fmt(x, '%');
export const PARTS = {
  solar: {
    name: 'Solar PV array',
    headline: v => `${fmt(v.P_pv, 'kW')} now`,
    body: (v, c) => {
      const g = c.geometry.pv;
      return `<div class="kv" data-live="pv">
        <span>PV power now ${tagChip('M')}</span><b>${fmt(v.P_pv, 'kW')}</b>
        <span>Sunlight on the panel ${tagChip('M')}</span><b>${fmt(v.poa, 'W/m²')}</b>
        <span>Used by the compressor</span><b>${fmt(v.P_solar_used, 'kW')}</b>
        <span>Spare (not needed now)</span><b>${fmt(Math.max(0, v.P_pv - v.P_solar_used), 'kW')}</b></div>
        <table><tr><td>Array</td><td>${g.modules} modules × ${g.module_W} W = ${g.array_kWp.toFixed(2)} kWp ${tagChip('E')}</td></tr>
        <tr><td>Tilt / facing</td><td>${g.tilt_deg}° , south ${tagChip('E')}</td></tr>
        <tr><td>Performance ratio</td><td>${c.design.pv.performance_ratio}</td></tr></table>
        <div class="formula">P = P_rated·(G/1000)·PR·[1 − 0.004·(T_cell − 25)]<br>T_cell = T_amb + (NOCT − 20)/800·G</div>
        ${closeupImg('solar')}`;
    },
  },
  condenser: {
    name: 'R290 condensing unit',
    headline: v => `${fmt(v.P_comp, 'kW')} · COP ${fmt(v.cop, '')}`,
    body: (v, c) => `<div class="kv" data-live="cond">
        <span>Compressor power ${tagChip('M')}</span><b>${fmt(v.P_comp, 'kW')}</b>
        <span>Cooling now ${tagChip('C')}</span><b>${fmt(v.Q_cool, 'kW')}</b>
        <span>Compressor speed ${tagChip('C')}</span><b>${pct(v.comp_speed_pct)}</b>
        <span>COP (electrical) ${tagChip('C')}</span><b>${fmt(v.cop, '')}</b>
        <span>Condensing temperature ${tagChip('C')}</span><b>${fmt(v.T_out + c.design.refrigeration.cond_approach_K, '°C')}</b>
        <span>Power from</span><b>${v.grid_on ? 'GRID (ATS)' : 'SOLAR'}</b></div>
        <table><tr><td>Refrigerant</td><td>R290 (propane), ${c.design.refrigeration.charge_g_min}–${c.design.refrigeration.charge_g_max} g</td></tr>
        <tr><td>Max cooling</td><td>${c.design.refrigeration.design_capacity_kW} kW (inverter, 30–100 %)</td></tr>
        <tr><td>Evaporating</td><td>${c.design.refrigeration.T_evap_C} °C</td></tr></table>
        <div class="formula">T_cond = T_out + 10 K<br>COP_elec = (q_e / w_s)·η_is·η_motor (CoolProp)</div>
        ${closeupImg('condenser')}`,
  },
  door: {
    name: 'Door (0.8 × 1.8 m) and strip curtain',
    headline: v => (v.door_open ? `OPEN – ${fmt(v.heat_now_kW, 'kW')} coming in` : 'closed'),
    body: (v, c) => `<div class="kv" data-live="door">
        <span>Door ${tagChip('M')}</span><b>${v.door_open ? 'OPEN' : 'closed'}</b>
        <span>Heat entering now ${tagChip('C')}</span><b>${fmt(v.heat_now_kW, 'kW')}</b>
        <span>…of which moisture (latent)</span><b>${fmt(v.heat_latent_now_kW, 'kW')}</b>
        <span>Heat if the door opens now</span><b>${fmt(v.heat_if_open_kW, 'kW')}</b>
        <span>Last opening lasted ${tagChip('M')}</span><b>${v.last_open_s.toFixed(0)} s</b>
        <span>Energy of that opening ${tagChip('C')}</span><b>${v.last_open_kJ.toFixed(0)} kJ</b>
        <span>…same as the walls leak in</span><b>${v.last_open_wall_minutes.toFixed(0)} min</b>
        <span>Strip curtain</span><b>${v.curtain ? 'ON (E = 0.85)' : 'OFF (E = 0)'}</b>
        <span>Door open in this 5 min</span><b>${fmt(v.door_s_this_5min, '')} s</b>
        <span>Door load, 5-min average ${tagChip('C')}</span><b>${fmt(v.Q_door, 'kW')}</b></div>
        <div class="formula">q = 0.221·A·(h_out − h_in)·ρ_in·(1 − ρ_out/ρ_in)^0.5·(g·H)^0.5·F_m<br>Q = q·D_t·D_f·(1 − E)</div>
        <div class="note">Try the Curtain switch at the top: the heat entering changes immediately.</div>`,
  },
  crates: {
    name: 'Produce crates',
    headline: v => (v.T_batch !== null ? `new batch at ${fmt(v.T_batch, '°C')}` : `stored at ${fmt(v.T_room, '°C')}`),
    body: (v, c) => `<div class="kv" data-live="crates">
        <span>New batch temperature ${tagChip('M')}</span><b>${v.T_batch !== null ? fmt(v.T_batch, '°C') : 'no new batch now'}</b>
        <span>Heat from new batch ${tagChip('C')}</span><b>${fmt(v.Q_batch, 'kW')}</b>
        <span>Respiration heat ${tagChip('C')}</span><b>${fmt(v.Q_resp, 'kW')}</b></div>
        <table><tr><td>Daily batch</td><td>${c.design.product.batch_mass_kg} kg at ${c.design.product.T_entry_C} °C, arrives ${c.design.simulation.batch_arrival_hour}:00 ${tagChip('E')}</td></tr>
        <tr><td>Pull-down</td><td>to ${c.design.product.T_final_C} °C in ${c.design.product.pulldown_hours} h (7/8 cooling time)</td></tr>
        <tr><td>Already stored</td><td>${c.design.simulation.stock_mass_kg} kg ${tagChip('E')}</td></tr></table>
        <div class="formula">Q_batch = UA·(T_batch − T_room),  UA = m·cp·ln 8 / 4 h</div>
        <div class="note">Batch IDs, QR codes and shelf life come in build step 4.</div>`,
  },
  worker: {
    name: 'Farmer bringing a crate',
    headline: v => `door ${v.door_open ? 'OPEN' : 'closed'} · ${fmt(v.heat_if_open_kW, 'kW')} if open`,
    body: (v, c) => PARTS.door.body(v, c),
  },
};

export function openPart(id) {
  const p = PARTS[id];
  if (!p) return;
  const el = openPanel(() => {
    const st = getState();
    return `<h2>${p.name}</h2><div class="sub">${sourceBadge(st)}</div>
      <div class="big" data-live="head">${st ? p.headline(st.values) : '—'}</div>
      ${st ? p.body(st.values, CFG) : ''}<div class="note">${st?.label || ''}</div>`;
  });
  if (p.after) p.after(el, getT());
}

// ------------------------------------------------------------- inside the room
const CROPS = {
  crate_greens: { key: 'leafy_greens', days: 2, name: 'Crate of leafy greens (spinach)' },
  crate_grapes: { key: 'grapes', days: 5, name: 'Crate of grapes' },
  milk: { key: 'milk', days: 1, name: 'Milk cans' },
  vaccine: { key: 'vaccines', days: 20, name: 'Vaccine box (illustration)' },
};
function cropPart(id) {
  const c = CROPS[id];
  return {
    name: c.name,
    headline: v => `room ${fmt(v.T_room, '°C')}`,
    body: () => `<div id="cropBody">Calculating shelf life from the room's temperature history…</div>
      <canvas id="cropHist"></canvas>
      <div class="note">Entry time is an example (${c.days} day${c.days > 1 ? 's' : ''} ago) ${tagChip('E')}. Batch ID, QR code and the
      “Record verified ✓” check come with the ledger in build step 4.</div>`,
    async after(el, t) {
      const d = await getJSON(`api/crop?key=${c.key}&t=${t.toFixed(0)}&days=${c.days}`);
      const a = d.assess;
      const sc = a.freshness_score, col = sc > 70 ? '#22c55e' : sc > 40 ? '#f59e0b' : '#ef4444';
      const warn = [...a.warnings, d.chill_now].filter(Boolean);
      el.querySelector('#cropBody').innerHTML = `
        <div class="kv">
          <span>Stored for</span><b>${d.days_stored} day${d.days_stored > 1 ? 's' : ''}</b>
          <span>Remaining shelf life (at ${d.T_ref_C} °C) ${tagChip('C')}</span><b>${a.remaining_days_at_ref.toFixed(1)} days</b>
          <span>If kept at today's ${a.T_now_C.toFixed(1)} °C ${tagChip('C')}</span><b>${a.remaining_days_at_current_T.toFixed(1)} days</b>
          <span>Freshness score</span><b style="color:${col}">${sc.toFixed(0)} / 100</b>
          <span>Best storage</span><b>${d.T_opt[0]}–${d.T_opt[1]} °C</b></div>
        <div class="fresh"><i style="width:${sc}%;background:${col}"></i></div>
        ${warn.length ? warn.map(w => `<div class="warnbox">⚠ ${w}</div>`).join('') : '<div class="okbox">✓ No chilling or freezing risk</div>'}
        <div class="formula">rate(T) = 1/SL_ref · Q10^((T − T_ref)/10)<br>remaining = SL_ref · (1 − Σ rate·Δt)<br>
        SL_ref = ${d.SL_ref_days} d at ${d.T_ref_C} °C, Q10 = ${d.Q10}</div>
        <div class="note">Source: ${d.source}</div>`;
      lineChart(el.querySelector('#cropHist'), { x: [`${d.days_stored} d ago`, 'now'],
        series: [{ y: d.history_T, color: '#2a78d6', label: 'room T while stored' }], unit: '°C', band: [2, 8], xTitle: 'storage history' });
    },
  };
}
Object.keys(CROPS).forEach(id => (PARTS[id] = cropPart(id)));

PARTS.pcm = {
  name: 'Wax (PCM) cold battery',
  headline: v => `${fmt(v.pcm_pct, '%')} frozen`,
  body: (v, c) => {
    const p = c.design.pcm, g = c.geometry.pcm;
    const latent = p.mass_kg * p.latent_kJ_kg * v.pcm_pct / 100 / 3600;
    return `<div class="kv" data-live="pcm">
        <span>Battery (frozen fraction) ${tagChip('C')}</span><b>${fmt(v.pcm_pct, '%')}</b>
        <span>Backup time left ${tagChip('C')}</span><b>${v.backup_h === null ? '∞' : fmt(v.backup_h, 'h')}</b>
        <span>Wax temperature ${tagChip('M')}</span><b>${fmt(v.T_pcm, '°C')}</b>
        <span>Latent cold left ${tagChip('C')}</span><b>${latent.toFixed(2)} kWh</b>
        <span>Melted thickness now ${tagChip('C')}</span><b>${((1 - v.pcm_pct / 100) * g.thickness_mm).toFixed(1)} of ${g.thickness_mm.toFixed(1)} mm</b>
        <span>Being charged by the coil</span><b>${fmt(v.Q_coil_pcm, 'kW')}</b></div>
      <table><tr><td>Wax</td><td>${p.mass_kg} kg paraffin, melts at ${p.T_melt_C} °C, L = ${p.latent_kJ_kg} kJ/kg ${tagChip('E')}</td></tr>
      <tr><td>Panels</td><td>${g.area_m2} m² of wall, ${g.thickness_mm.toFixed(1)} mm thick</td></tr></table>
      <div class="formula">E = m·L·frozen fraction  ·  backup = E_remaining / holding load</div>
      <b>Melt front in one slab (FTCS model, room air 8 °C)</b>
      <canvas id="slab"></canvas>
      <div class="note" id="slabNote"></div>${closeupImg('pcm')}`;
  },
  async after(el) {
    const s = await getJSON('api/slab');
    const x = s.hours.map(h => `${h.toFixed(0)} h`);
    lineChart(el.querySelector('#slab'), { x: [x[0], x[x.length - 1]], series: [{ y: s.melt_front_mm, color: '#eb6834', label: 'melt front, mm' }],
      unit: 'mm', yMin: 0, yMax: s.thickness_mm * 1.05, xTitle: 'time' });
    el.querySelector('#slabNote').textContent = `Enthalpy method, explicit FTCS: ${s.nx} cells, Δx = ${s.dx_mm.toFixed(2)} mm, Δt = ${s.dt_s.toFixed(2)} s, r = αΔt/Δx² = ${s.r.toFixed(2)} ≤ 0.5 (stable).`;
  },
};

PARTS.evaporator = {
  name: 'Evaporator (R290 at −5 °C)',
  headline: v => `${fmt(v.Q_coil_air, 'kW')} from the air`,
  body: (v, c) => `<div class="kv" data-live="evap">
      <span>Cooling the room air ${tagChip('C')}</span><b>${fmt(v.Q_coil_air, 'kW')}</b>
      <span>Freezing the wax ${tagChip('C')}</span><b>${fmt(v.Q_coil_pcm, 'kW')}</b>
      <span>Compressor speed ${tagChip('C')}</span><b>${fmt(v.comp_speed_pct, '%')}</b>
      <span>Room temperature ${tagChip('M')}</span><b>${fmt(v.T_room, '°C')}</b></div>
      <b>Live R290 cycle (T_cond = outside + 10 K)</b>
      <canvas id="ph" style="height:200px"></canvas>
      <div class="kv" id="cyc"></div>
      <div class="formula">q_e = h1 − h4 · w = (h2s − h1)/η_is · COP_elec = q_e/w · η_motor</div>${closeupImg('evaporator')}`,
  async after(el, t) {
    const d = await getJSON(`api/cycle?t=${t.toFixed(0)}`);
    phChart(el.querySelector('#ph'), d);
    const c = d.cycle;
    el.querySelector('#cyc').innerHTML = `
      <span>Evaporating / condensing</span><b>${c.T_evap_C.toFixed(0)} / ${c.T_cond_C.toFixed(1)} °C</b>
      <span>Pressures</span><b>${c.P_evap_bar.toFixed(2)} / ${c.P_cond_bar.toFixed(2)} bar</b>
      <span>h1 · h2 · h3 = h4</span><b>${c.h1.toFixed(0)} · ${c.h2.toFixed(0)} · ${c.h3.toFixed(0)} kJ/kg</b>
      <span>COP ideal / real / electrical</span><b>${c.COP_ideal.toFixed(2)} / ${c.COP_real.toFixed(2)} / ${c.COP_elec.toFixed(2)}</b>
      <span>R290 mass flow</span><b>${c.m_dot_g_s.toFixed(2)} g/s</b>
      <span>Design point (50 °C condensing)</span><b>COP_elec ${d.design.COP_elec.toFixed(2)}</b>`;
  },
};
