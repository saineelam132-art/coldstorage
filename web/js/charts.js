// Small canvas charts for the detail panels (no chart library needed).
const INK2 = '#41566b', GRID = '#d5e2ec';

function setup(canvas) {
  const dpr = devicePixelRatio || 1, W = canvas.clientWidth, H = canvas.clientHeight;
  canvas.width = W * dpr; canvas.height = H * dpr;
  const g = canvas.getContext('2d'); g.scale(dpr, dpr); g.font = '11px sans-serif';
  return { g, W, H };
}

// series: [{y:[...], color, label}], x: labels (same length), band: [lo, hi] shaded (e.g. 2–8 °C)
export function lineChart(canvas, { x, series, unit = '', band = null, yMin = null, yMax = null, xTitle = '' }) {
  const { g, W, H } = setup(canvas);
  const all = series.flatMap(s => s.y).filter(v => v !== null && !Number.isNaN(v));
  if (band) all.push(...band);
  let lo = yMin ?? Math.min(...all), hi = yMax ?? Math.max(...all);
  if (hi - lo < 1e-6) { lo -= 1; hi += 1; }
  const pad = { l: 36, r: 8, t: 10, b: 30 };
  const n = Math.max(...series.map(s => s.y.length));
  const X = i => pad.l + (W - pad.l - pad.r) * i / Math.max(1, n - 1);
  const Y = v => pad.t + (H - pad.t - pad.b) * (1 - (v - lo) / (hi - lo));
  if (band) { g.fillStyle = 'rgba(42,120,214,.08)'; g.fillRect(pad.l, Y(band[1]), W - pad.l - pad.r, Y(band[0]) - Y(band[1])); }
  g.strokeStyle = GRID; g.fillStyle = INK2; g.lineWidth = 1;
  for (let k = 0; k <= 3; k++) {
    const v = lo + (hi - lo) * k / 3;
    g.beginPath(); g.moveTo(pad.l, Y(v)); g.lineTo(W - pad.r, Y(v)); g.stroke();
    g.fillText(v.toFixed(Math.abs(hi - lo) < 5 ? 1 : 0), 2, Y(v) + 4);
  }
  if (x?.length) {
    g.fillText(x[0], pad.l, H - 16);
    g.textAlign = 'right'; g.fillText(x[x.length - 1], W - pad.r, H - 16); g.textAlign = 'left';
  }
  g.fillText(`${xTitle}${unit ? '   (' + unit + ')' : ''}`, pad.l, H - 3);
  series.forEach(s => {
    g.strokeStyle = s.color; g.lineWidth = 2; g.beginPath();
    let pen = false;
    s.y.forEach((v, i) => { if (v === null || Number.isNaN(v)) { pen = false; return; } pen ? g.lineTo(X(i), Y(v)) : g.moveTo(X(i), Y(v)); pen = true; });
    g.stroke();
  });
  let lx = W - pad.r;
  g.textAlign = 'right';
  [...series].reverse().forEach(s => { if (!s.label) return; g.fillStyle = s.color; g.fillText(s.label, lx, pad.t + 10); lx -= g.measureText(s.label).width + 14; });
  g.textAlign = 'left';
}

// R290 pressure–enthalpy diagram: saturation dome + live cycle 1-2-3-4.
export function phChart(canvas, data) {
  const { g, W, H } = setup(canvas);
  const pad = { l: 40, r: 10, t: 10, b: 30 };
  const hMin = 100, hMax = 720, pMin = 1, pMax = 45;
  const X = h => pad.l + (W - pad.l - pad.r) * (h - hMin) / (hMax - hMin);
  const Y = p => pad.t + (H - pad.t - pad.b) * (1 - Math.log(p / pMin) / Math.log(pMax / pMin));
  g.strokeStyle = GRID; g.fillStyle = INK2;
  [1, 2, 4, 10, 20, 40].forEach(p => { g.beginPath(); g.moveTo(pad.l, Y(p)); g.lineTo(W - pad.r, Y(p)); g.stroke(); g.fillText(p, 4, Y(p) + 4); });
  [200, 400, 600].forEach(h => g.fillText(h, X(h) - 8, H - 16));
  g.fillText('h, kJ/kg   ·   P, bar (log)', pad.l, H - 3);
  g.strokeStyle = '#8a8984'; g.lineWidth = 1.5;
  for (const line of [data.dome.liquid, data.dome.vapour]) {
    g.beginPath(); line.forEach(([h, p], i) => (i ? g.lineTo(X(h), Y(p)) : g.moveTo(X(h), Y(p)))); g.stroke();
  }
  g.strokeStyle = '#2a78d6'; g.lineWidth = 2.5; g.beginPath();
  data.points.forEach(([h, p], i) => (i ? g.lineTo(X(h), Y(p)) : g.moveTo(X(h), Y(p)))); g.stroke();
  g.fillStyle = '#0d1b2a'; g.font = 'bold 12px sans-serif';
  const c = data.cycle;
  [[c.h1, c.P_evap_bar, '1', 6, 14], [c.h2, c.P_cond_bar, '2', 6, -4], [c.h3, c.P_cond_bar, '3', -12, -4], [c.h4, c.P_evap_bar, '4', -12, 14]]
    .forEach(([h, p, t, dx, dy]) => { g.beginPath(); g.arc(X(h), Y(p), 3.5, 0, 7); g.fill(); g.fillText(t, X(h) + dx, Y(p) + dy); });
}
