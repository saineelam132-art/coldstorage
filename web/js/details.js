// What the detail panel shows for each sensor and each building part.
// Numbers come only from /api/state (digital twin) and /api/config (design.json).
import { fmt, sensorValue, tagChip, sourceBadge, openPanel, drawHistory } from './ui.js';

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
  openPanel(() => {
    const st = getState();
    return `<h2>${p.name}</h2><div class="sub">${sourceBadge(st)}</div>
      <div class="big" data-live="head">${st ? p.headline(st.values) : '—'}</div>
      ${st ? p.body(st.values, CFG) : ''}<div class="note">${st?.label || ''}</div>`;
  });
}
