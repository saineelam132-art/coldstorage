// What the detail panel shows for each sensor and each building part.
// Numbers come only from /api/state (digital twin) and /api/config (design.json).
import { photoFor, photoFigure } from './photos.js';
import { fmt, sensorValue, tagChip, sourceBadge, openPanel, drawHistory, setHistMark } from './ui.js';
import { getJSON } from './api.js';
import { lineChart, phChart } from './charts.js';
import { SiteError, U2, pmTag, dewpoint } from './siteerr.js';

let ERR = new SiteError(null);
let CFG = null, SENSORS = {}, MANIFEST = null, SCENES = null, getState = () => null, getT = () => 0, todaySeries = () => null;
export function initDetails(cfg, sensors, manifest, scenes, stateFn, tFn, todayFn) {
  CFG = cfg; MANIFEST = manifest; SCENES = scenes; getState = stateFn; getT = tFn; if (todayFn) todaySeries = todayFn;
  ERR = new SiteError(cfg.site_error_budget);
  sensors.sensors.forEach(s => (SENSORS[s.id] = s));
}
export const sensorById = id => SENSORS[id];

// Data tag shown on the cards: W = real weather (Open-Meteo), S = digital-twin simulation of a sensor
// (no real sensor fitted yet), C = calculated by a formula, L = live sensor (Phase 4).
export const WEATHER_Q = ['T_out', 'RH_out', 'wind'];
export function tagFor(s, st) {
  if (st?.source === 'LIVE' && s.tag === 'M') return 'L';
  if (WEATHER_Q.includes(s.quantity)) return 'W';
  return s.tag === 'C' ? 'C' : 'S';
}

// Close-up pictures in the cards are REAL photos now (assets/photos.json); the AI scene pictures stay in the
// home concept scene only.
const CLOSEUP = {};   // photos are shown once, small, at the END of each card
function closeupImg(key) { return CLOSEUP[key] ? photoFigure(CLOSEUP[key]) : ''; }

// kept for the batch animation (home concept scene): AI cut-outs of crates and workers
export function cutoutSrc(name) { return name && MANIFEST?.B?.[name]?.src; }
// card picture: own photo -> free example photo -> design drawing (never an AI picture)
function cutoutImg(kind, id) { return photoFor(kind, id); }

// ------------------------------------------------------------- tooltips
export function sensorTip(id) {
  const s = SENSORS[id], st = getState();
  if (!s) return '';
  return `<b>${s.name}</b>${tagChip(tagFor(s, st))}<span class="v">${sensorValue(s, st)}</span>`;
}
export function partTip(id) {
  if (id.startsWith('batch:')) return `<b>New batch ${id.slice(6)}</b><span class="v">click for batch card + QR</span>`;
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
    return `<h2>${s.name} ${tagChip(tagFor(s, st))}</h2><div class="sub">${sourceBadge(st)}</div>
      <div class="big" data-live="v">${sensorValue(s, st)}</div>
      <div class="bandnow" data-live="band">${bandNow(s, st)}</div>
      ${s.tag === 'C' ? `<div class="note">In the twin this value is <b>calculated</b> from the door physics (ASHRAE Gosney–Olama). With the real sensor fitted it becomes a measurement (M) that checks the formula.</div>` : ''}
      ${extraFor(s, st)}
      ${hasHistory ? '<div class="hist"><div class="histbox"><canvas id="hist"></canvas></div><div class="histsrc"></div></div>' : ''}
      <table>
        <tr><td>Sensor type</td><td>${s.type}</td></tr>
        <tr><td>Range</td><td>${s.range}</td></tr>
        <tr><td>Accuracy</td><td>${s.accuracy}</td></tr>
        <tr><td>Used in</td><td>${s.used_in}</td></tr>
      </table>
      <div class="note">${st?.label || ''}</div>
      ${cutoutImg('sensors', s.id)}`;
  };
  const el = openPanel(render);
  document.dispatchEvent(new CustomEvent('highlight', { detail: { kind: 'sensor', id, label: `${s.name} sensor` } }));
  if (hasHistory) historyFor(s, el.querySelector('#hist'));
}

// ---- expected SITE range (published studies – not measured) for the weather-based sensors
const BAND_Q = { T_out: 'temp_C', RH_out: 'rh_pct', wind: 'wind_ms', P_pv: 'pv_energy_rel' };
const sunFactor = () => CFG?.design?.live_run?.sun_factor || 1;
function bandAt(q, v, x) {          // x = {T, RH, ghi (Open-Meteo), wind10, hour, Td}
  if (!ERR.ok || v === null || v === undefined) return null;
  if (q === 'T_out') return ERR.temp(v, x.hour, x.ghi, x.wind10);
  if (q === 'RH_out') { const [, , dT] = ERR.temp(x.T, x.hour, x.ghi, x.wind10); return ERR.rh(x.T, v, dT, x.Td ?? null); }
  if (q === 'wind') return ERR.wind2(v);
  if (q === 'P_pv') return ERR.pv(v);
  return null;
}
function bandNow(s, st) {
  const q = s.quantity, v = st?.values;
  if (!BAND_Q[q] || !v || !ERR.ok) return '';
  const hour = st.time ? +st.time.slice(11, 13) : 12;
  const val = q === 'wind' ? v.wind * U2 : v[q];
  const b = bandAt(q, val, { T: v.T_out, ghi: (v.poa || 0) / sunFactor(), wind10: v.wind, hour });
  if (!b) return '';
  const d = { T_out: 1, RH_out: 0, wind: 1, P_pv: 2 }[q];
  let txt = `Expected at site: ${b[0].toFixed(d)}–${b[1].toFixed(d)} ${s.unit} ${pmTag()}<br><small>${ERR.B.label} (source under the graph)</small>`;
  if (q === 'RH_out') txt += `<br><small>Dew point ${dewpoint(v.T_out, v.RH_out).toFixed(1)} °C (from temperature + humidity), expected at site ±${ERR.band('dewpoint_C').hourly} °C</small>`;
  if (q === 'wind') txt += '<br><small>Wind at 2 m (converted from 10 m, FAO-56: × 0.748).</small>';
  return txt;
}
// the open sensor graph follows the clock: new day -> new graph, same day -> the red line moves
let openHist = null;
export function followClock() {
  if (!openHist || !openHist.canvas.isConnected) { openHist = null; return; }
  const t = getT(), day = Math.floor(t / 86400);
  if (openHist.live) return;
  if (day !== openHist.day) { historyFor(openHist.s, openHist.canvas); return; }
  setHistMark(Math.floor((t % 86400) / 900));
}
async function historyFor(s, canvas) {
  const q = s.quantity, t = getT();
  openHist = { s, canvas, day: Math.floor(t / 86400), live: false };
  const yTitle = { T_out: 'Outside temperature', RH_out: 'Outside humidity', wind: 'Wind at 2 m', P_pv: 'Solar PV power' }[q] || s.name;
  const today = WEATHER_Q.includes(q) ? todaySeries(q, t) : null;
  let labels, values, src, ctx, mark;
  if (today) {
    labels = today.labels; values = today.values; src = 'Real weather today (Open-Meteo, hourly) · red line = now'; mark = labels.length - 1;
    openHist.live = true;
    ctx = today.labels.map((l, i) => ({ T: today.ctx.T_out[i], ghi: today.ctx.ghi[i], wind10: today.ctx.wind[i], Td: today.ctx.dew_C[i] ?? null, hour: +l.slice(0, 2) }));
  } else {
    const need = BAND_Q[q] ? ['T_out', 'wind', 'poa'] : [];
    const [d, ...extra] = await Promise.all([q, ...need].map(x => getJSON(`api/series?q=${x}&t=${t.toFixed(0)}&hours=24&day=1`)));
    labels = d.t; values = d.v.map(x => (x === null ? null : (typeof x === 'boolean' ? +x : x))); mark = d.mark;
    src = (BAND_Q[q] ? 'This day 00:00–24:00 of the twin\'s Open-Meteo weather (15-min points)' : 'This day 00:00–24:00 of the digital twin (15-min points)')
      + ' · red line = the time shown';
    if (need.length) ctx = labels.map((l, i) => ({ T: extra[0].v[i], wind10: extra[1].v[i], ghi: (extra[2].v[i] || 0) / sunFactor(), hour: +l.slice(0, 2) }));
  }
  if (q === 'wind') values = values.map(v => (v === null ? null : v * U2));            // 10 m -> 2 m
  let band = null;
  if (BAND_Q[q] && ERR.ok && ctx) {
    const b = values.map((v, i) => bandAt(q, v, ctx[i]) || [null, null]);
    band = { lo: b.map(x => x[0]), hi: b.map(x => x[1]), label: 'Expected site range (published studies) – not measured', source: ERR.src(BAND_Q[q]) };
  }
  drawHistory(canvas, { labels, values, src, unit: s.unit, yTitle, band, mark });
}

function extraFor(s, st) {
  const v = st?.values || {};
  if (s.id === 'door_angle' || s.id === 'door_switch') {
    return `<div class="kv" data-live="doorsens">
      <span>Door now</span><b>${v.door_open ? 'OPEN' : 'closed'}${v.door_by_demo ? ' (demo)' : ''}</b>
      <span>Angle</span><b>${fmt(v.door_angle, '°')}</b>
      <span>Seconds open today</span><b>${(v.door_open_today_s ?? 0).toFixed(0)} s</b>
      <span>Warm air entering now</span><b>${v.door_open ? `${(v.heat_now_kW * 1000).toFixed(0)} W` : '0 W'}</b></div>
      <div class="note">0° = shut, 90° = fully open. It swings in about 2 s each way.</div>`;
  }
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
    headline: v => (v.door_open ? `OPEN ${fmt(v.door_angle, '°')} – ${(v.heat_now_kW * 1000).toFixed(0)} W warm air coming in` : 'closed'),
    body: (v, c) => `<div class="kv" data-live="door">
        <span>Door ${tagChip('S')}</span><b class="${v.door_open ? 'warnc' : ''}">${v.door_open ? 'OPEN' : 'closed'}${v.door_by_demo ? ' (demo)' : ''}</b>
        <span>Door angle ${tagChip('S')}</span><b>${fmt(v.door_angle, '°')}</b>
        <span>Seconds open today ${tagChip('S')}</span><b>${(v.door_open_today_s ?? 0).toFixed(0)} s</b>
        <span>Warm air entering now ${tagChip('C')}</span><b>${v.door_open ? `${(v.heat_now_kW * 1000).toFixed(0)} W` : '0 W (door shut)'}</b>
        <span>…of which moisture (latent)</span><b>${(v.heat_latent_now_kW * 1000).toFixed(0)} W</b>
        <span>If the door opens fully now</span><b>${(v.heat_if_open_kW * 1000).toFixed(0)} W</b>
        <span>Strip curtain</span><b>${v.curtain ? 'ON (E = 0.85) – hangs in the doorway' : 'OFF (E = 0)'}</b>
        <span>Last opening lasted ${tagChip('S')}</span><b>${v.last_open_s.toFixed(0)} s</b>
        <span>Energy of that opening ${tagChip('C')}</span><b>${v.last_open_kJ.toFixed(0)} kJ</b>
        <span>…same as the walls leak in</span><b>${v.last_open_wall_minutes.toFixed(0)} min</b></div>
        <div class="formula">q = 0.221·A·(h_out − h_in)·ρ_in·(1 − ρ_out/ρ_in)^0.5·(g·H)^0.5·F_m<br>Q = q·D_f·(1 − E) · (angle / 90°)</div>
        <div class="note">The strip curtain is seen only while the door is open (it hangs inside the doorway).
        Try the Curtain switch at the top: the warm air coming in changes immediately.</div>`,
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
  if (id.startsWith('batch:')) { document.dispatchEvent(new CustomEvent('openbatch', { detail: id.slice(6) })); return; }
  const p = PARTS[id];
  if (!p) return;
  const el = openPanel(() => {
    const st = getState();
    return `<h2>${p.name}</h2><div class="sub">${sourceBadge(st)}</div>
      <div class="big" data-live="head">${st ? p.headline(st.values) : '—'}</div>
      ${st ? p.body(st.values, CFG) : ''}<div class="note">${st?.label || ''}</div>
      ${cutoutImg('parts', id)}`;
  });
  document.dispatchEvent(new CustomEvent('highlight', { detail: { kind: 'part', id, label: p.name } }));
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

// Fin data box (final design): every number from /api/config -> wax_hx (engine/fins.py) and design.json
function finBox(c) {
  const f = c.wax_hx || {}, hx = c.design.live_run?.wax_hx || {}, n = (x, d = 0) => (x === null || x === undefined ? '—' : Number(x).toFixed(d));
  return `<div class="finbox"><b>Finned wax panel (final design)</b>
    <div class="kv"><span>Fins</span><b>${n(f.b_mm)} mm deep · ${n(f.S_mm)} mm gap · ${n(f.t_mm)} mm thick</b>
    <span>Panel height</span><b>${n(f.L_m, 1)} m</b>
    <span>Number of fins</span><b>${n(f.N_fins)}</b>
    <span>Surface area</span><b>× ${n(f.area_mult, 1)}</b>
    <span>UA (room ↔ wax)</span><b>${n(f.UA, 1)} W/K</b>
    <span>Heat at 3 K</span><b>${n(f.Q_W)} W, no fan</b>
    <span>Below</span><b>drip tray + drain</b>
    <span>In front</span><b>${n((hx.keep_clear_m || 0) * 100)} cm keep-clear zone</b></div></div>`;
}

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
      ${finBox(c)}
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

const n = (x, d = 0) => (x === null || x === undefined || Number.isNaN(x) ? '—' : Number(x).toFixed(d));
PARTS.fins = {
  name: 'Finned wax panels (passive – no fan, no baffle)',
  headline: v => `area × ${n((CFG?.wax_hx || {}).area_mult, 1)} · UA ${n(v.G_wax_W_K)} W/K · 0 W`,
  body: (v, c) => {
    const f = c.wax_hx || {}, hx = c.design.live_run.wax_hx, b = c.design.live_run.battery_12V, p = f.plain || {};
    const dT = v.T_room - (v.T_pcm ?? 4);
    return `<div class="kv" data-live="fins">
        <span>Heat into the wax now ${tagChip('C')}</span><b>${fmt(v.Q_pcm_room, 'kW')}</b>
        <span>Wax ↔ room conductance now ${tagChip('C')}</span><b>${n(v.G_wax_W_K, 1)} W/K</b>
        <span>Room − wax ${tagChip('C')}</span><b>${fmt(dT, 'K')}</b>
        <span>Electricity used ${tagChip('E')}</span><b>0 W (no moving parts)</b>
        <span>Room temperature ${tagChip('M')}</span><b>${fmt(v.T_room, '°C')}</b></div>
      <table><tr><td>Fins</td><td>${n(f.b_mm)} mm deep, ${n(f.S_mm)} mm gap, ${n(f.t_mm)} mm thick aluminium, ${n(f.N_fins)} fins over ${n(f.A_m2 / f.L_m, 1)} m of wall, ${n(f.L_m, 1)} m tall ${tagChip('E')}</td></tr>
      <tr><td>Surface area</td><td><b>× ${n(f.area_mult, 2)}</b> compared with a plain panel; fin efficiency ${n(f.eta, 3)}</td></tr>
      <tr><td>Air film (natural convection)</td><td>h = ${n(f.h, 2)} W/m²K (lower of Bar-Cohen & Rohsenow ${n(f.h_bar_cohen, 2)} and Van de Pol & Tierney ${n(f.h_van_de_pol, 2)})</td></tr>
      <tr><td>Conductance at 3 K</td><td>fins: UA = <b>${n(f.UA, 1)} W/K</b> → ${n(f.Q_W)} W · plain panel: UA = ${n(p.UA, 1)} W/K → ${n(p.Q_W)} W</td></tr>
      <tr><td>Needed</td><td>hottest 2026 night (${n(f.T_out_design_night_C, 1)} °C outside): ${n(f.load_W)} W at room 7 °C</td></tr>
      <tr><td>Build</td><td>${hx.material}; removable ${hx.section_length_m} m sections for cleaning; ${n(f.al_kg)} kg aluminium</td></tr>
      <tr><td>Keep clear</td><td>${hx.keep_clear_m * 100} cm free zone in front of the fins, floor stoppers for the crates</td></tr>
      <tr><td>Optional fans</td><td>mounting points + 12 V cable for ${hx.optional_fans.provision} × 120 mm fans – <b>optional</b>, add only if the Phase 4 test shows the fins &gt;25 % weaker</td></tr>
      <tr><td>12 V battery</td><td>${b.capacity_Ah} Ah ${b.chemistry} for controller, sensors and IoT gateway only – NO battery for cooling</td></tr></table>
      <div class="formula">El = Ra_S·S/L, Nu_S = [576/El² + 2.873/El^0.5]^−0.5 (Bar-Cohen & Rohsenow)<br>
        η = tanh(m·Lc)/(m·Lc), m = √(2h/(k_al·t))<br>UA = 1 / [1/(h·(A_base + η·A_fins)) + R_wax/A]</div>
      <div class="note">Cooled air falls between the fins by itself – nothing to switch on, nothing to break, nothing to power at night.</div>`;
  },
};

PARTS.driptray = {
  name: 'Drip tray under the wax panels',
  headline: () => 'sloped tray · drain + trap',
  body: (v, c) => `<div class="kv"><span>Fin surface ${tagChip('C')}</span><b>about ${fmt((v.T_pcm ?? 4) + 0.5, '°C')}</b>
      <span>Room air ${tagChip('M')}</span><b>${fmt(v.T_room, '°C')} / ${fmt(c.design.setpoint.rh_room_pct, '%')} RH</b></div>
    <p>The fins sit at about 4–5 °C, below the dew point of the room air (about 5.5 °C at 7 °C and 90 % RH), so water condenses on them –
    mostly moisture given off by the fresh produce. A sloped stainless tray under the panels collects it and a drain with a water trap
    takes it out (the trap stops warm outside air coming in). The wax never goes below 3 °C, so the fins never frost.</p>
    <div class="note">Clean the tray and the fin sections (removable, 0.6 m long) every month – wet surfaces in a food room must not grow mould.</div>`,
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
