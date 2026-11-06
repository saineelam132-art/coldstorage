// Formatting, tooltip, side panel, data bar, small graphs.
import { getJSON } from './api.js';

const DEC = { '°C': 1, '%': 0, 'kW': 2, 'm/s': 2, 'Pa': 2, 'h': 1, '°': 0, 'ppm': 0, '': 2, 'W/m²': 0 };
export function fmt(v, unit = '') {
  if (v === null || v === undefined || Number.isNaN(v)) return '—';
  if (typeof v === 'boolean') return v ? 'YES' : 'NO';
  const d = DEC[unit] ?? 2;
  return `${Number(v).toFixed(d)}${unit ? ' ' + unit : ''}`;
}
export function sensorValue(sensor, state) {
  const v = state?.values?.[sensor.quantity];
  if (sensor.quantity === 'door_open') return v ? 'OPEN' : 'CLOSED';
  if (sensor.quantity === 'grid_on') return v ? 'GRID' : 'SOLAR / PCM';
  if (sensor.quantity === 'gas_ppm' && (v === null || v === undefined)) return 'no sensor connected';
  return fmt(v, sensor.unit);
}
export const tagChip = t => `<span class="tag ${t}" title="${{M: 'Measured by a sensor', C: 'Calculated by a formula', E: 'Estimated / design value', AI: 'Prediction'}[t] || ''}">${t}</span>`;
export function sourceBadge(state) {
  return state?.source === 'LIVE' ? '<span class="badge live">LIVE sensor</span>' : '<span class="badge sim">SIMULATED</span>';
}

// ---------------------------------------------------------------- tooltip
const tip = document.getElementById('tip');
export function showTip(html, x, y) {
  tip.innerHTML = html;
  tip.classList.add('on');
  const r = tip.getBoundingClientRect(), W = innerWidth, H = innerHeight;
  let left = x + 16, top = y - 10 - 52;
  if (left + r.width > W - 8) left = x - r.width - 16;
  if (top + r.height > H - 140) top = H - 140 - r.height;
  tip.style.left = `${left}px`; tip.style.top = `${Math.max(4, top)}px`;
}
export function hideTip() { tip.classList.remove('on'); }

// ---------------------------------------------------------------- panel
const panel = document.getElementById('panel');
const body = document.getElementById('panelBody');
document.getElementById('panelClose').onclick = () => closePanel();
let refresh = null;
export function openPanel(render) {
  refresh = render;
  body.innerHTML = render();
  panel.classList.add('on');
  return body;
}
export function closePanel() { panel.classList.remove('on'); refresh = null; }
export function refreshPanel() {
  if (!refresh) return;
  // only update elements marked as live, so graphs are not redrawn every tick
  const tmp = document.createElement('div');
  tmp.innerHTML = refresh();
  tmp.querySelectorAll('[data-live]').forEach(el => {
    const cur = body.querySelector(`[data-live="${el.dataset.live}"]`);
    if (cur) cur.innerHTML = el.innerHTML;
  });
}

// ---------------------------------------------------------------- small graph
export async function drawHistory(canvas, quantity, t, unit, label) {
  const d = await getJSON(`api/series?q=${quantity}&t=${t.toFixed(0)}&hours=24`);
  const ctx = canvas.getContext('2d');
  const dpr = devicePixelRatio || 1;
  const W = canvas.clientWidth, H = canvas.clientHeight;
  canvas.width = W * dpr; canvas.height = H * dpr; ctx.scale(dpr, dpr);
  const v = d.v.map(x => (x === null ? NaN : (typeof x === 'boolean' ? +x : x)));
  const ok = v.filter(x => !Number.isNaN(x));
  if (!ok.length) { ctx.fillStyle = '#7b8a99'; ctx.font = '12px sans-serif'; ctx.fillText('No history for this value', 8, 20); return; }
  let lo = Math.min(...ok), hi = Math.max(...ok);
  if (hi - lo < 1e-6) { lo -= 1; hi += 1; }
  const pad = { l: 38, r: 8, t: 14, b: 18 };
  const X = i => pad.l + (W - pad.l - pad.r) * i / (v.length - 1);
  const Y = y => pad.t + (H - pad.t - pad.b) * (1 - (y - lo) / (hi - lo));
  ctx.strokeStyle = '#d5e2ec'; ctx.lineWidth = 1; ctx.fillStyle = '#41566b'; ctx.font = '11px sans-serif';
  [lo, (lo + hi) / 2, hi].forEach(g => { ctx.beginPath(); ctx.moveTo(pad.l, Y(g)); ctx.lineTo(W - pad.r, Y(g)); ctx.stroke();
    ctx.fillText(fmt(g, unit).replace(' ' + unit, ''), 2, Y(g) + 4); });
  ctx.fillText(d.t[0], pad.l, H - 4); ctx.textAlign = 'right'; ctx.fillText(`${d.t[d.t.length - 1]}  (last 24 h, ${unit})`, W - pad.r, H - 4); ctx.textAlign = 'left';
  ctx.strokeStyle = '#2a78d6'; ctx.lineWidth = 2; ctx.beginPath();
  let pen = false;
  v.forEach((y, i) => { if (Number.isNaN(y)) { pen = false; return; } pen ? ctx.lineTo(X(i), Y(y)) : ctx.moveTo(X(i), Y(y)); pen = true; });
  ctx.stroke();
}

// ---------------------------------------------------------------- data bar
const $ = id => document.getElementById(id);
export function updateDataBar(s, cfg) {
  const v = s.values, sp = cfg.design.setpoint;
  const room = $('d_room'), Tr = v.T_room_sensor ?? v.T_room;          // what the room SENSOR shows
  room.innerHTML = fmt(Tr, '°C') + (v.fault_active ? `<small class="flag">${v.sensor_suspicious ? '⚠ SENSOR SUSPICIOUS' : 'sensor ≠ physics…'}</small>` : '');
  room.className = v.sensor_suspicious ? 'bad' : (Tr < sp.band_low_C || Tr > sp.band_high_C ? 'bad' : (Tr > sp.band_high_C - 0.5 ? 'warn' : 'good'));
  $('d_out').textContent = fmt(v.T_out, '°C');
  $('d_load').textContent = fmt(v.Q_total, 'kW');
  $('d_pv').textContent = fmt(v.P_pv, 'kW');
  const pcm = $('d_pcm');
  pcm.textContent = fmt(v.pcm_pct, '%');
  pcm.className = v.pcm_pct < cfg.design.controller.ats_pcm_pct ? 'bad' : (v.pcm_pct < 40 ? 'warn' : '');
  $('d_backup').textContent = v.backup_h === null ? '∞' : fmt(v.backup_h, 'h');
  $('d_src').textContent = v.grid_on ? 'GRID' : (v.P_solar_used > 0 ? 'SOLAR' : 'WAX');
  $('d_src').className = v.grid_on ? 'warn' : 'good';
  $('d_fan').textContent = `${(v.G_wax_W_K ?? 0).toFixed(0)} W/K`; $('d_fan').title = 'Finned wax panels: passive, 0 W';
  $('d_clock').textContent = s.clock;
  $('d_src_label').innerHTML = sourceBadge(s);
}
