// Formatting, tooltip, side panel, data bar, small graphs.
import { U2, SiteError } from './siteerr.js';

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
  if (sensor.quantity === 'wind') return `${fmt(v * U2, sensor.unit)} <small>at 2 m</small>`;      // FAO-56: 2 m = 0.748 × 10 m
  return fmt(v, sensor.unit);
}
const TAGS = { M: 'Measured by a sensor', C: 'Calculated by a formula', E: 'Estimated / design value', AI: 'Prediction',
  W: 'Real weather (Open-Meteo)', S: 'Digital-twin simulation', L: 'Live sensor reading',
  Wpm: 'Expected range from published studies – not measured' };
export const tagChip = t => `<span class="tag ${t}" title="${TAGS[t] || ''}">${t === 'Wpm' ? 'W±' : t}</span>`;
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
export function closePanel() {
  panel.classList.remove('on'); refresh = null;
  document.dispatchEvent(new Event('panelclose'));
}
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

// ---------------------------------------------------------------- sensor graph (Chart.js)
// Clear axis titles with units, grid lines, and a tooltip + vertical line at the nearest time.
const hoverLine = {
  id: 'hoverLine',
  afterDatasetsDraw(chart) {
    const a = chart.tooltip?.getActiveElements?.() || [];
    if (!a.length) return;
    const x = a[0].element.x, { top, bottom } = chart.chartArea, g = chart.ctx;
    g.save(); g.strokeStyle = 'rgba(13,27,42,.45)'; g.lineWidth = 1; g.setLineDash([4, 3]);
    g.beginPath(); g.moveTo(x, top); g.lineTo(x, bottom); g.stroke(); g.restore();
  },
};
// red vertical line at the time being shown (calendar / clock)
const markLine = {
  id: 'markLine',
  afterDatasetsDraw(chart, args, opts) {
    const i = opts?.index;
    if (i === null || i === undefined || i < 0) return;
    const x = chart.scales.x.getPixelForValue(i), { top, bottom } = chart.chartArea, g = chart.ctx;
    if (!(x >= chart.chartArea.left - 1 && x <= chart.chartArea.right + 1)) return;
    g.save(); g.strokeStyle = '#e34948'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, top); g.lineTo(x, bottom); g.stroke();
    g.fillStyle = '#e34948'; g.font = 'bold 11px sans-serif'; g.fillText(chart.data.labels[i] || '', Math.min(x + 3, chart.chartArea.right - 34), top + 11);
    g.restore();
  },
};
let histChart = null;
// opts: {quantity, t, unit, yTitle, today: {labels, values} | null, note}
// opts: {labels, values, src, unit, yTitle, band: {lo:[], hi:[], label, source} | null}
export function drawHistory(canvas, { labels, values, src = '', unit, yTitle, band = null, mark = null }) {
  if (histChart) { histChart.destroy(); histChart = null; }
  const box = canvas.parentElement, note = box.parentElement.querySelector('.histsrc');
  if (note) note.innerHTML = src + (band ? `<br><span class="bandsrc">Shaded: ${band.label}. Source: ${band.source}</span>` : '');
  if (!window.Chart || !values.some(v => v !== null && !Number.isNaN(v))) {
    box.innerHTML = '<div class="histnone">No history for this value</div>'; return;
  }
  const dec = DEC[unit] ?? 2, u = unit ? ' ' + unit : '', f = v => (v === null || v === undefined ? '—' : Number(v).toFixed(dec));
  const ds = [{ label: `${yTitle} (Open-Meteo / twin)`, data: values, borderColor: '#2a78d6', backgroundColor: 'rgba(42,120,214,.10)',
    fill: !band, pointRadius: 0, pointHoverRadius: 5, pointHoverBackgroundColor: '#ef4444', borderWidth: 2, tension: 0.25, spanGaps: true, order: 0 }];
  if (band) {
    ds.push({ label: '_lo', data: band.lo, borderWidth: 0, pointRadius: 0, pointHoverRadius: 0, fill: false, tension: 0.25, spanGaps: true, order: 2 });
    ds.push({ label: band.label, data: band.hi, borderWidth: 0, pointRadius: 0, pointHoverRadius: 0, backgroundColor: 'rgba(14,116,144,.18)',
      borderColor: 'rgba(14,116,144,.5)', fill: '-1', tension: 0.25, spanGaps: true, order: 1 });
  }
  histChart = new window.Chart(canvas, {
    type: 'line',
    data: { labels, datasets: ds },
    options: {
      responsive: true, maintainAspectRatio: false, animation: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        markLine: { index: mark },
        legend: { display: !!band, position: 'bottom', labels: { boxWidth: 14, font: { size: 11 }, filter: it => !it.text.startsWith('_') } },
        tooltip: { displayColors: false, filter: it => it.datasetIndex === 0, callbacks: {
          title: it => `${it[0].label} IST`,
          label: c => `${yTitle}: ${f(c.parsed.y)}${u}` } },
      },
      scales: {
        x: { title: { display: true, text: 'Time (IST)', color: '#41566b', font: { weight: '600' } },
          ticks: { maxTicksLimit: 7, maxRotation: 0, color: '#41566b', font: { size: 11 } }, grid: { color: '#e3ecf3' } },
        y: { title: { display: true, text: unit ? `${yTitle} (${unit})` : yTitle, color: '#41566b', font: { weight: '600' } },
          ticks: { color: '#41566b', font: { size: 11 } }, grid: { color: '#e3ecf3' } },
      },
    },
    plugins: [hoverLine, markLine],
  });
}

export function setHistMark(i) {                     // move the red 'time shown' line without re-drawing
  if (!histChart || histChart.options.plugins.markLine.index === i) return;
  histChart.options.plugins.markLine.index = i; histChart.update('none');
}

// ---------------------------------------------------------------- data bar
const $ = id => document.getElementById(id);
export function updateDataBar(s, cfg) {
  const v = s.values, sp = cfg.design.setpoint;
  const room = $('d_room'), Tr = v.T_room_sensor ?? v.T_room;          // what the room SENSOR shows
  room.innerHTML = fmt(Tr, '°C') + (v.fault_active ? `<small class="flag">${v.sensor_suspicious ? '⚠ SENSOR SUSPICIOUS' : 'sensor ≠ physics…'}</small>` : '');
  room.className = v.sensor_suspicious ? 'bad' : (Tr < sp.band_low_C || Tr > sp.band_high_C ? 'bad' : (Tr > sp.band_high_C - 0.5 ? 'warn' : 'good'));
  $('d_out').textContent = fmt(v.T_out, '°C');
  const E = (updateDataBar.E ||= new SiteError(cfg.site_error_budget));
  if (E.ok) {
    const b = E.temp(v.T_out, s.time ? +s.time.slice(11, 13) : 12, (v.poa || 0) / (cfg.design.live_run?.sun_factor || 1), v.wind);
    $('d_out').title = `Open-Meteo ${fmt(v.T_out, '°C')} · expected at site ${b[0].toFixed(1)}–${b[1].toFixed(1)} °C (W±: ${E.B.label})`;
  }
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
