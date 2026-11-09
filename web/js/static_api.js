// STATIC BACKUP ONLY: answers the website's /api/... requests from saved files (data.js), so the
// site works with no Python, straight from a folder (file://). Same formulas and data as the server:
// every 5-minute state was exported from the digital twin; the ledger uses the same SHA-256 rules.
import { blockHash, GENESIS_PREV } from './ledger.js';

const D = window.STATIC_DATA;
const C = D.cols, N = D.n, DT = D.dt;
const SAVE = 'coldtrust-static-v1';

// ---------------------------------------------------------------- time windows
const W = D.windows;                                  // [[t0, i0, steps], ...]
export function clamp(t) {
  for (const [t0, , n] of W) if (t >= t0 && t < t0 + n * DT) return t;
  const next = W.find(([t0]) => t0 > t);              // jump forward to the next saved window
  return next ? next[0] : W[0][0];
}
function idx(t) {
  t = clamp(t);
  for (const [t0, i0, n] of W) if (t >= t0 && t < t0 + n * DT) return i0 + Math.floor((t - t0) / DT);
  return 0;
}
function windowOf(i) { return W.find(([, i0, n]) => i >= i0 && i < i0 + n); }
const tOf = i => { const [t0, i0] = windowOf(i); return t0 + (i - i0) * DT; };
function rangeBack(i, steps) {                        // indices going back in time, not past the window start
  const [, i0] = windowOf(i);
  const a = Math.max(i0, i - steps); const out = [];
  for (let k = a; k <= i; k++) out.push(k);
  return out;
}
const pad = n => String(n).padStart(2, '0');
const T0 = Date.parse((D.t0 || '2026-01-01T00:00:00') + 'Z');      // IST wall clock stored as if UTC
function timeStr(t, sec = true) {
  const d = new Date(T0 + t * 1000);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}` + (sec ? `:${pad(d.getUTCSeconds())}` : '');
}
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function clockStr(t) { const d = new Date(T0 + t * 1000); return `${pad(d.getUTCDate())} ${MON[d.getUTCMonth()]} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`; }

// ---------------------------------------------------------------- ledger state (saved in the browser)
let S = null;
function load() {
  try { S = JSON.parse(localStorage.getItem(SAVE)); } catch (e) { S = null; }
  if (!S) S = { blocks: [], batches: {}, seq: 0, lastHour: null, fault: null, orig: {} };
}
function save() { try { localStorage.setItem(SAVE, JSON.stringify(S)); } catch (e) { /* storage blocked */ } }
load();
const TH = D.design.physics_check.threshold_K, PERSIST = D.design.physics_check.persist_minutes * 60;
const offset = t => (S.fault && t >= S.fault.since ? S.fault.offset : 0);

function newBatch(t, farmer, crop, kg) {
  S.seq += 1;
  const ts = timeStr(t, false), id = `CT-${ts.slice(2, 4)}${ts.slice(5, 7)}${ts.slice(8, 10)}-${String(S.seq).padStart(3, '0')}`;
  const b = { id, farmer: (farmer || 'Farmer').trim().slice(0, 40), crop, crop_label: D.crops[crop].label, weight_kg: +kg, entry_t: t, entry_time: ts };
  S.batches[id] = b; save(); return b;
}
function addBlock(ts, ids, summary, flag) {
  const prev = S.blocks.length ? S.blocks[S.blocks.length - 1].hash : GENESIS_PREV;
  const r2 = x => Math.round(x * 100) / 100;
  const b = { index: S.blocks.length, timestamp: ts, batch_ids: [...ids].sort(), flag, prev_hash: prev,
    summary: Object.fromEntries(Object.entries(summary).map(([k, v]) => [k, r2(v)])) };
  b.hash = blockHash(b); S.blocks.push(b);
}
function sealHour(h) {
  const i0 = idx(h * 3600), n = 3600 / DT;
  const T = [], off = [];
  for (let k = 0; k < n; k++) { const tt = h * 3600 + k * DT; T.push(C.T_room[i0 + k] + offset(tt)); off.push(offset(tt)); }
  let door = 0; for (let k = 0; k < n; k++) door += C.door_s[i0 + k];
  const bad = off.some(o => Math.abs(o) > TH);
  const long = S.fault && (h + 1) * 3600 - S.fault.since >= PERSIST;
  const ids = Object.values(S.batches).filter(b => b.entry_t < (h + 1) * 3600).map(b => b.id);
  addBlock(timeStr(h * 3600, false), ids, { T_min: Math.min(...T), T_avg: T.reduce((a, x) => a + x, 0) / n, T_max: Math.max(...T),
    RH_avg: D.design.setpoint.rh_room_pct, door_min: door / 60, pcm_pct: C.pcm_pct[i0 + n - 1] }, bad && long ? 'Sensor suspicious – check' : 'OK');
}
function advance(t) {
  t = clamp(t);
  const h = Math.floor(t / 3600);
  if (S.lastHour === null) {
    [['grapes', 5, 'Ramu (Anakapalle)', 120], ['leafy_greens', 2, 'Lakshmi (Sabbavaram)', 60], ['milk', 1, 'Dairy co-op Pendurthi', 80]]
      .forEach(([c, d, f, kg]) => newBatch(t - d * 86400, f, c, kg));
    S.lastHour = h - 24;
    const [w0] = windowOf(idx(t)); S.lastHour = Math.max(S.lastHour, Math.ceil(w0 / 3600));
  }
  if (h < S.lastHour) { S.lastHour = h; save(); return; }
  let start = S.lastHour;
  const [w0] = windowOf(idx(t));
  start = Math.max(start, Math.ceil(w0 / 3600), h - 24);         // only hours inside the saved window
  for (let hr = start; hr < h; hr++) sealHour(hr);
  if (h !== S.lastHour) { S.lastHour = h; save(); }
}
function verify() {
  let first = null; const st = [];
  S.blocks.forEach((b, i) => {
    const own = blockHash(b) === b.hash, link = b.prev_hash === (i ? S.blocks[i - 1].hash : GENESIS_PREV);
    let s = first !== null ? 'untrusted' : !own ? 'data changed' : !link ? 'link broken' : 'ok';
    if (s !== 'ok' && first === null) first = i;
    st.push(s);
  });
  return { valid: first === null, first_bad: first, status: st };
}

// ---------------------------------------------------------------- engine pieces needed in the browser
function assess(crop, temps, dtH) {      // = engine/shelf_life.py assess()
  let used = 0, chill = 0, frz = 0;
  const lim = crop.chill_injury_below_C, fl = crop.freeze_below_C ?? null;
  for (const T of temps) {
    used += (1 / crop.SL_ref_days) * crop.Q10 ** ((T - crop.T_ref_C) / 10) * dtH / 24;
    if (lim !== null && lim !== undefined && T < lim) chill += dtH * 60;
    if (fl !== null && T < fl) frz += dtH * 60;
  }
  used = Math.min(1, used);
  const Tn = temps[temps.length - 1], rate = (1 / crop.SL_ref_days) * crop.Q10 ** ((Tn - crop.T_ref_C) / 10);
  const warnings = [];
  if (lim !== null && lim !== undefined && chill >= 60) warnings.push(`Chilling injury risk: ${(chill / 60).toFixed(1)} h below ${lim} C (safe range for ${crop.label} is ${crop.T_opt_low_C}-${crop.T_opt_high_C} C).`);
  if (fl !== null && frz > 0) warnings.push(`Freezing risk: ${frz.toFixed(0)} min below ${fl} C.`);
  return { fraction_used: used, freshness_score: Math.round(1000 * (1 - used)) / 10, remaining_days_at_ref: crop.SL_ref_days * (1 - used),
    remaining_days_at_current_T: (1 - used) / rate, T_ref_C: crop.T_ref_C, T_now_C: Tn, chill_minutes: chill, freeze_minutes: frz, warnings };
}

// ---------------------------------------------------------------- /api/state
function state(t, curtain) {
  t = clamp(t); advance(t);
  const i = idx(t), cur = curtain === null ? D.design.door.curtain_installed : curtain;
  const k = cur ? 'on' : 'off';
  const doorS = C.door_s[i], into = (t - tOf(i));
  const open = doorS > 0 && into < doorS;
  const hif = C[`heat_if_open_${k}`][i];
  const off = offset(t), dur = S.fault && t >= S.fault.since ? t - S.fault.since : 0;
  const susp = Math.abs(off) > TH && dur >= PERSIST;
  const v = {};
  for (const f of D.state_fields) v[f] = C[f][i];
  Object.assign(v, {
    RH_room: D.design.setpoint.rh_room_pct, T_batch: Number.isNaN(C.T_batch[i]) || C.T_batch[i] === null ? null : C.T_batch[i],
    grid_on: !!C.grid_on[i], backup_h: C.backup_h[i], door_open: open,
    door_angle: open ? 90 * Math.max(0, Math.min(1, into / 2, (doorS - into) / 2)) : 0, door_s_this_5min: doorS,
    door_open_today_s: (C.door_before ? C.door_before[i] : 0) + Math.min(into, doorS),
    heat_if_open_kW: hif, heat_now_kW: open ? hif : 0, heat_sensible_now_kW: open ? hif * (1 - C.lat_frac[i]) : 0,
    heat_latent_now_kW: open ? hif * C.lat_frac[i] : 0, v_door_if_open: C[`v_if_open_${k}`][i],
    v_door_top: open ? C[`v_if_open_${k}`][i] : 0, v_door_mid: 0, v_door_bot: open ? C[`v_if_open_${k}`][i] : 0,
    last_open_kJ: hif * C.last_open_s[i], last_open_wall_minutes: hif * C.last_open_s[i] / Math.max(C.Q_wall[i], 1e-6) / 60,
    curtain: cur, E: cur ? D.design.door.curtain_effectiveness_E : 0, gas_ppm: null,
    T_room_sensor: C.T_room[i] + off, physics_residual_K: off, sensor_suspicious: susp, fault_active: !!S.fault,
    physics_status: susp ? 'Sensor suspicious – check' : (Math.abs(off) > TH ? 'Disagrees with physics – watching' : 'OK – matches physics'),
  });
  const v2 = verify();
  return { t, time: timeStr(t), clock: clockStr(t), label: D.label, source: 'SIMULATED',
    sun: { elevation_deg: C.sun_elev[i], azimuth_deg: C.sun_az[i] }, day_class: D.day_classes[C.day[i]], day_poa_kWh_m2: C.day_poa[i],
    values: v, ledger: { length: S.blocks.length, valid: v2.valid, batches: Object.keys(S.batches).length },
    compare: { normal: { T_room: (C.n_T_room || C.T_room)[i], pcm_pct: (C.n_pcm_pct || C.pcm_pct)[i], grid_on: !!(C.n_grid_on || C.grid_on)[i], grid_h_so_far: C.grid_h_n[i] },
      smart: { T_room: C.s_T_room[i], pcm_pct: C.s_pcm_pct[i], grid_on: !!C.s_grid_on[i], grid_h_so_far: C.grid_h_s[i] }, year: D.compare_year } };
}

function cycle(t) {
  const i = idx(t), T = Math.round(C.T_out[i] * 4) / 4;
  const c = { ...D.cycles[String(Math.min(D.cycle_T[1], Math.max(D.cycle_T[0], T)).toFixed(2))] };
  const Q = Math.max(0.3, C.Q_coil_air[i] + C.Q_coil_pcm[i]);
  ['Q_evap_kW', 'm_dot_kg_s', 'm_dot_g_s', 'P_shaft_kW', 'P_elec_kW', 'Q_cond_kW'].forEach(k => (c[k] *= Q));
  const pts = [[c.h1, c.P_evap_bar], [c.h2, c.P_cond_bar], [c.h3, c.P_cond_bar], [c.h4, c.P_evap_bar], [c.h1, c.P_evap_bar]];
  return { cycle: c, points: pts, dome: D.dome, design: D.cycle_design };
}

function crop(key, t, days) {
  const i = idx(t), cr = D.crops[key], ix = rangeBack(i, Math.round(days * 86400 / DT));
  const T = ix.map(j => C.T_room[j]);
  const a = assess(cr, T, DT / 3600);
  const lim = cr.chill_injury_below_C;
  return { crop: key, label: cr.label, days_stored: days, source: cr.source, T_opt: [cr.T_opt_low_C, cr.T_opt_high_C], chill_below_C: lim,
    SL_ref_days: cr.SL_ref_days, T_ref_C: cr.T_ref_C, Q10: cr.Q10, assess: a, history_T: T.filter((_, k) => k % 12 === 0),
    chill_now: lim !== null && lim !== undefined && T[T.length - 1] < lim ? `Room ${T[T.length - 1].toFixed(1)} C is below the chilling-injury limit of ${lim} C for ${cr.label}.` : null };
}

function batchView(id, t) {
  const b = S.batches[id]; if (!b) return null;
  t = clamp(t >= 0 ? t : (S.lastHour || 0) * 3600);
  const cr = D.crops[b.crop], days = Math.max(1 / 24, (t - b.entry_t) / 86400);
  const ix = rangeBack(idx(t), Math.round(days * 86400 / DT)), T = ix.map(j => C.T_room[j]);
  const step = Math.max(1, Math.floor(T.length / 120));
  return { batch: b, crop: { label: cr.label, T_opt: [cr.T_opt_low_C, cr.T_opt_high_C], SL_ref_days: cr.SL_ref_days, T_ref_C: cr.T_ref_C, Q10: cr.Q10, source: cr.source },
    days_stored: days, assess: assess(cr, T, DT / 3600), history_T: T.filter((_, k) => k % step === 0),
    blocks: S.blocks.filter(x => x.batch_ids.includes(id)), chain_valid: verify().valid, now: timeStr(t, false) };
}

function series(q, t, hours) {
  const ix = rangeBack(idx(t), Math.round(hours * 3600 / DT)).filter((_, k) => k % 3 === 0);
  const col = C[q] || (q === 'T_room_sensor' ? C.T_room : null);
  if (!col) return { quantity: q, t: [], v: [] };
  return { quantity: q, t: ix.map(j => clockStr(tOf(j)).slice(-5)), v: ix.map(j => col[j]) };
}

// ---------------------------------------------------------------- router
export async function get(url) {
  const [path, qs] = url.split('?'); const q = new URLSearchParams(qs || '');
  const num = (k, d = 0) => (q.has(k) ? +q.get(k) : d);
  if (D.files[path]) return JSON.parse(JSON.stringify(D.files[path]));
  if (path === 'api/state') return state(num('t'), q.has('curtain') && q.get('curtain') !== '-1' ? q.get('curtain') === '1' : null);
  if (path === 'api/series') return series(q.get('q'), num('t'), num('hours', 24));
  if (path === 'api/cycle') return cycle(num('t'));
  if (path === 'api/crop') return crop(q.get('key'), num('t'), num('days', 2));
  if (path === 'api/batches') return Object.values(S.batches);
  if (path.startsWith('api/batch/')) { const r = batchView(decodeURIComponent(path.slice(10)), num('t', -1)); if (!r) throw new Error('batch not found'); return r; }
  if (path === 'api/ledger') {
    const v = verify(), last = num('last', 40), lo = Math.max(0, S.blocks.length - last);
    return { blocks: S.blocks.slice(lo), status: v.status.slice(lo), valid: v.valid, first_bad: v.first_bad, length: S.blocks.length, note: D.ledger_note };
  }
  if (path === 'api/health') return { ok: true, static: true };
  throw new Error(`static backup has no data for ${path}`);
}
export async function post(url, data = {}) {
  load();
  if (url === 'api/batch') { advance(+data.t); return newBatch(+data.t, data.farmer, data.crop, data.weight_kg); }
  if (url === 'api/ledger/tamper') {
    const n = S.blocks.length; if (n < 3) return { error: 'ledger too short' };
    const i = Math.max(0, n - 7), b = S.blocks[i];
    if (!S.orig[i]) S.orig[i] = JSON.parse(JSON.stringify(b));
    const old = b.summary.T_max; b.summary.T_max = Math.round((old - 3) * 100) / 100; save();
    return { index: i, field: 'T_max', old, new: b.summary.T_max,
      explain: `Block ${i}'s T_max was changed from ${old} to ${b.summary.T_max} °C. Its hash no longer matches the copy stored in block ${i + 1}, so block ${i} and every block after it are untrusted.` };
  }
  if (url === 'api/ledger/reset') { Object.entries(S.orig).forEach(([i, b]) => (S.blocks[i] = b)); S.orig = {}; save(); return { ok: true }; }
  if (url === 'api/fault') { S.fault = data.clear ? null : { offset: +(data.offset || 3), since: +data.t }; save(); return { fault: S.fault }; }
  throw new Error(`static backup cannot handle ${url}`);
}
export function resetAll() { try { localStorage.removeItem(SAVE); } catch (e) { /* ignore */ } load(); }

window.STATIC_API = { get, post, clamp, resetAll };
