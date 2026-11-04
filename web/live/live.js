// Live Year Run page. Plain script (no modules) so it works from the Python server, from a
// folder (file://) and on Vercel. All numbers come from files made by twin/live_run.py.
(function () {
  'use strict';
  const S = window.LIVE && window.LIVE.summary;
  const $ = id => document.getElementById(id);
  const main = $('main');
  if (!S) { main.innerHTML = '<div class="card">No Live Year Run data yet. Run <code>python -m twin.live_run --fetch</code>.</div>'; return; }

  const C = { s1: '#2a78d6', s2: '#eb6834', s3: '#1baf7a', s4: '#eda100', s5: '#e87ba4', s6: '#008300', s7: '#6250d6', s8: '#e34948', grey: '#8a8984' };
  let design = 'current', tab = 'year', charts = [], selDay = null;
  try { design = localStorage.getItem('live-design') || 'current'; } catch (e) { /* ignore */ }

  // ------------------------------------------------------------------ helpers
  const fmt = (v, d = 1) => (v === null || v === undefined || Number.isNaN(v) ? '—' : Number(v).toFixed(d));
  const inr = v => '₹' + Math.round(v).toLocaleString('en-IN');
  const D = () => S.designs[design];
  const table = j => j.index.map((ix, r) => Object.fromEntries([['_', ix], ...j.columns.map((c, k) => [c, j.data[r][k]])]));
  const tile = (label, value, sub = '', cls = '') => `<div class="tile ${cls}"><span>${label}</span><b>${value}</b><small>${sub}</small></div>`;
  function killCharts() { charts.forEach(c => c.destroy()); charts = []; }
  function loadScript(src) {
    return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error(src)); document.head.appendChild(s); });
  }
  async function month(des, mon) {
    const key = `h_${des}_${mon}`;
    if (!window.LIVE[key]) await loadScript(`live/data/${key}.js`);
    return window.LIVE[key];
  }
  async function dayHours(des, date) {
    const m = await month(des, date.slice(0, 7));
    const idx = m.t.map((t, i) => (t.startsWith(date) ? i : -1)).filter(i => i >= 0);
    const pick = f => idx.map(i => m[f][i]);
    const out = { hours: idx.map(i => m.t[i].slice(11) + ':00'), pred: pick('pred'), src: pick('src') };
    Object.keys(m).forEach(f => { if (!['t', 'pred', 'src'].includes(f)) out[f] = pick(f); });
    return out;
  }
  function istNow() { const d = new Date(Date.now() + 5.5 * 3600e3); return { date: d.toISOString().slice(0, 10), hour: d.getUTCHours() + d.getUTCMinutes() / 60 }; }

  // Chart.js helpers: one unit per chart (no dual axes); a shaded 'prediction' zone and a 'now' line.
  const shade = {
    id: 'predShade',
    beforeDraw(ch, a, o) {
      const { ctx, chartArea: ca, scales: { x } } = ch;
      if (o.from !== undefined && o.from !== null && o.from >= 0) {
        const x0 = x.getPixelForValue(o.from) - (x.getPixelForValue(1) - x.getPixelForValue(0)) / 2;
        ctx.save(); ctx.fillStyle = 'rgba(237,161,0,.10)'; ctx.fillRect(Math.max(ca.left, x0), ca.top, ca.right - Math.max(ca.left, x0), ca.bottom - ca.top);
        ctx.fillStyle = '#7a4b00'; ctx.font = '11px sans-serif'; ctx.fillText('prediction', Math.max(ca.left, x0) + 4, ca.top + 12); ctx.restore();
      }
      if (o.now !== undefined && o.now !== null) {
        const xn = x.getPixelForValue(o.now);
        ctx.save(); ctx.strokeStyle = '#e34948'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(xn, ca.top); ctx.lineTo(xn, ca.bottom); ctx.stroke();
        ctx.fillStyle = '#e34948'; ctx.font = 'bold 11px sans-serif'; ctx.fillText('now', xn + 3, ca.bottom - 4); ctx.restore();
      }
    },
  };
  function chart(id, type, labels, sets, { unit = '', stacked = false, yMin, yMax, pred, now, legend = true } = {}) {
    const el = $(id); if (!el) return;
    const c = new Chart(el, {
      type, data: { labels, datasets: sets.map((s, i) => ({ borderWidth: 2, pointRadius: 0, tension: 0.25, borderColor: s.color, backgroundColor: s.fill || s.color, ...s })) },
      options: {
        responsive: true, maintainAspectRatio: false, animation: false, interaction: { mode: 'index', intersect: false },
        plugins: { legend: { display: legend && sets.length > 1, labels: { boxWidth: 12, font: { size: 11 } } },
          tooltip: { callbacks: { label: t => `${t.dataset.label}: ${fmt(t.parsed.y, 2)} ${unit}` } }, predShade: { from: pred, now } },
        scales: { x: { stacked, grid: { display: false }, ticks: { maxTicksLimit: 12, font: { size: 11 } } },
          y: { stacked, min: yMin, max: yMax, title: { display: !!unit, text: unit }, grid: { color: '#e4e3df' }, ticks: { font: { size: 11 } } } },
      },
      plugins: [shade],
    });
    charts.push(c);
  }

  // ------------------------------------------------------------------ header
  $('updated').textContent = `Weather last updated: ${(S.weather.archive && S.weather.archive.updated) || S.weather.last_attempt || '–'}` +
    (S.weather.forecast ? ` · forecast ${S.weather.forecast.updated}` : '');
  $('genAt').textContent = `Results generated ${S.generated}.`;
  function setDesign(d) {
    design = d; try { localStorage.setItem('live-design', d); } catch (e) { /* ignore */ }
    [...$('designSeg').children].forEach(b => b.classList.toggle('on', b.dataset.d === d)); render();
  }
  $('designSeg').onclick = e => { const b = e.target.closest('button'); if (b) setDesign(b.dataset.d); };
  $('tabs').onclick = e => { const b = e.target.closest('button'); if (!b) return; tab = b.dataset.tab; [...$('tabs').children].forEach(x => x.classList.toggle('on', x === b)); render(); };
  [...$('designSeg').children].forEach(b => b.classList.toggle('on', b.dataset.d === design));

  // ------------------------------------------------------------------ Year so far
  function year() {
    const t = D().totals, M = table(D().monthly), days = table(D().daily).filter(d => d.status === 'actual');
    main.innerHTML = `<h2>Year so far: ${t.first} → ${t.last} (${t.days} days)</h2>
      <p class="lead">${D().label}. Fixed inputs: 200 kg swapped every day at 8 am, 4 door openings a day, compressor max 1.5 kW.</p>
      <div class="tiles">
        ${tile('Compressor electricity', `${fmt(t.comp_kWh_day_avg, 2)} kWh/day`, `max ${fmt(t.comp_kWh_day_max, 2)} on ${t.comp_kWh_day_max_date} · total ${fmt(t.comp_kWh, 0)} kWh`)}
        ${tile('Cooling delivered', `${fmt(t.cool_kWh, 0)} kWh`, `compressor ran ${fmt(t.run_h, 0)} h`)}
        ${tile('Days fully on solar + wax', `${t.days_full_solar_wax} / ${t.days}`, `${fmt(100 * t.days_full_solar_wax / t.days, 0)} % of days`, 'good')}
        ${tile('Grid backup', `${fmt(t.grid_h, 0)} h`, `${fmt(t.grid_kWh, 1)} kWh from the grid`, 'warn')}
        ${tile('Solar used', `${fmt(t.solar_used_kWh, 0)} kWh`, `of ${fmt(t.pv_kWh, 0)} kWh produced`)}
        ${tile('Fresh batch to 5.5 °C', `${fmt(t.batch_cool_h_avg, 1)} h avg`, `worst ${fmt(t.batch_cool_h_max, 1)} h (${t.batch_cool_h_max_date})`)}
        ${tile('Wax: PCM effectiveness', `${fmt(t.pcm_effectiveness_pct, 0)} %`, `cold given ÷ cold stored · ${fmt(t.wax_cycles, 0)} full cycles`)}
        ${tile('Wax cold given with no sun', `${fmt(t.wax_useful_share_pct, 0)} %`, 'the real time-shift')}
        ${tile('Hours outside 2–8 °C', `${fmt(t.hot_other_h, 0)} h`, `+ ${fmt(t.hot_load_h, 0)} h of warm air while a fresh batch cools (8–11 am)`, t.hot_other_h > 0 ? 'bad' : 'good')}
      </div>
      <div class="card"><h4>Monthly energy (kWh)</h4><div class="chartbox tall"><canvas id="cM"></canvas></div></div>
      <div class="grid2">
        <div class="card"><h4>Every day: compressor electricity and grid (kWh)</h4><div class="chartbox"><canvas id="cD"></canvas></div></div>
        <div class="card"><h4>Every day: hours the fresh batch took to reach 5.5 °C</h4><div class="chartbox"><canvas id="cB"></canvas></div></div>
      </div>
      <div class="card"><h4>Monthly table</h4><div class="scroll"><table class="t"><tr><th>Month</th><th>Days</th><th>Cooling kWh</th><th>Compressor kWh</th><th>Run h</th>
        <th>Solar used kWh</th><th>Grid kWh</th><th>Grid h</th><th>Days solar+wax</th><th>Wax cycles</th><th>PCM eff. %</th><th>Batch cool h (avg / max)</th><th>Outside 2–8 °C h (loading / other)</th><th>Outside °C</th></tr>
        ${M.map(m => `<tr><td>${m._}</td><td>${m.days}</td><td>${fmt(m.cool_kWh, 0)}</td><td>${fmt(m.comp_kWh, 0)}</td><td>${fmt(m.run_h, 0)}</td><td>${fmt(m.solar_used_kWh, 0)}</td>
          <td>${fmt(m.grid_kWh, 1)}</td><td>${fmt(m.grid_h, 0)}</td><td>${m.days_full_solar_wax}</td><td>${fmt(m.wax_cycles, 1)}</td>
          <td>${m.wax_stored_kWh ? fmt(100 * m.wax_given_kWh / m.wax_stored_kWh, 0) : '—'}</td><td>${fmt(m.batch_cool_h_avg, 1)} / ${fmt(m.batch_cool_h_max, 1)}</td>
          <td>${fmt(m.hot_load_h, 0)} / ${fmt(m.hot_other_h, 0)}</td><td>${fmt(m.T_out_mean, 1)}</td></tr>`).join('')}</table></div>
        <p class="note">PCM effectiveness = cold given by the wax to the room ÷ cold stored in the wax by the charging coil. In this model the wax can only lose cold to the room, so it is close to 100 %;
        real panels lose a little through the wall – the Phase 4 box test measures that. "With no sun" = share of the wax's cold given when the panels could not run the compressor.</p></div>`;
    const mon = M.map(m => m._);
    chart('cM', 'bar', mon, [{ label: 'Cooling delivered', data: M.map(m => m.cool_kWh), color: C.s3 },
      { label: 'Compressor electricity', data: M.map(m => m.comp_kWh), color: C.s1 },
      { label: 'Solar used', data: M.map(m => m.solar_used_kWh), color: C.s4 }, { label: 'Grid', data: M.map(m => m.grid_kWh), color: C.s8 }], { unit: 'kWh' });
    chart('cD', 'line', days.map(d => d._.slice(5)), [{ label: 'Compressor', data: days.map(d => d.comp_kWh), color: C.s1 },
      { label: 'Grid', data: days.map(d => d.grid_kWh), color: C.s8 }], { unit: 'kWh' });
    chart('cB', 'bar', days.map(d => d._.slice(5)), [{ label: 'Hours to 5.5 °C', data: days.map(d => d.batch_cool_h), color: C.s2 }], { unit: 'h' });
  }

  // ------------------------------------------------------------------ one day (calendar / today / tomorrow)
  function dayCardHTML(d, date) {
    if (!d) return '';
    return `<div class="daycard">
      <div><span>Outside</span><b>${fmt(d.T_out_mean, 1)} °C</b> (max ${fmt(d.T_out_max, 1)})</div>
      <div><span>Sunlight</span><b>${fmt(d.ghi_kWh_m2, 2)} kWh/m²</b></div>
      <div><span>Heat load</span><b>${fmt(d.load_kWh, 1)} kWh</b></div>
      <div><span>Cooling delivered</span><b>${fmt(d.cool_kWh, 1)} kWh</b></div>
      <div><span>Compressor electricity</span><b>${fmt(d.comp_kWh, 2)} kWh</b> (${fmt(d.run_h, 1)} h)</div>
      <div><span>Solar produced / used</span><b>${fmt(d.pv_kWh, 1)} / ${fmt(d.solar_used_kWh, 1)} kWh</b></div>
      <div><span>Grid</span><b>${fmt(d.grid_kWh, 2)} kWh</b> (${fmt(d.grid_h, 1)} h)</div>
      <div><span>Room min / max</span><b>${fmt(d.T_room_min, 1)} / ${fmt(d.T_room_max, 1)} °C</b></div>
      <div><span>Wax lowest / end of day</span><b>${fmt(d.pcm_min, 0)} / ${fmt(d.pcm_end, 0)} %</b></div>
      <div><span>Fresh batch in at 8 am</span><b>${fmt(d.batch_T_in, 1)} °C</b>, cooled in ${d.batch_cool_h === null ? 'not yet' : fmt(d.batch_cool_h, 1) + ' h'}</div>
      <div><span>Door openings</span><b>${fmt(d.door_openings, 0)}</b></div>
      <div><span>Day</span><b>${d.full_solar_wax ? 'fully solar + wax' : 'grid used'}</b></div></div>`;
  }
  async function dayView(date, box, { now } = {}) {
    const dd = table(D().daily).find(x => x._ === date);
    const h = await dayHours(design, date);
    const pred = h.pred.indexOf(true);
    const nowIdx = now !== undefined ? now : null;
    box.innerHTML = `<div class="card"><h4>${date} – day summary ${dd && dd.status !== 'actual' ? '<span class="pred">' + (dd.status === 'prediction' ? 'PREDICTION' : 'today: actual + forecast hours') + '</span>' : ''}</h4>${dayCardHTML(dd, date)}
        <p class="note">Weather source this day: ${[...new Set(h.src)].filter(Boolean).join(', ')}. Room humidity is not modelled (held at the 90 % design value).</p></div>
      <div class="grid3">
        <div class="card"><h4>Temperatures (°C)</h4><div class="chartbox"><canvas id="d1"></canvas></div></div>
        <div class="card"><h4>Outside humidity (%)</h4><div class="chartbox"><canvas id="d2"></canvas></div></div>
        <div class="card"><h4>Sunlight on flat ground (W/m²)</h4><div class="chartbox"><canvas id="d3"></canvas></div></div>
        <div class="card"><h4>Heat load by source (kW)</h4><div class="chartbox"><canvas id="d4"></canvas></div></div>
        <div class="card"><h4>Compressor speed (% of 1.5 kW)</h4><div class="chartbox"><canvas id="d5"></canvas></div></div>
        <div class="card"><h4>Solar vs compressor vs grid (kW)</h4><div class="chartbox"><canvas id="d6"></canvas></div></div>
        <div class="card"><h4>R290 pressures (bar)</h4><div class="chartbox"><canvas id="d7"></canvas></div></div>
        <div class="card"><h4>R290 temperatures (°C)</h4><div class="chartbox"><canvas id="d8"></canvas></div></div>
        <div class="card"><h4>COP (electrical)</h4><div class="chartbox"><canvas id="d9"></canvas></div></div>
        <div class="card"><h4>Wax battery (% frozen)</h4><div class="chartbox"><canvas id="d10"></canvas></div></div>
        <div class="card"><h4>Door open (seconds per hour)</h4><div class="chartbox"><canvas id="d11"></canvas></div></div>
        <div class="card"><h4>Compressor power from grid (kW)</h4><div class="chartbox"><canvas id="d12"></canvas></div></div>
      </div>`;
    const L = h.hours, o = { pred: pred >= 0 ? pred : null, now: nowIdx };
    chart('d1', 'line', L, [{ label: 'Outside', data: h.T_out, color: C.s2 }, { label: 'Room', data: h.T_room, color: C.s1 }, { label: 'Fresh batch', data: h.T_batch, color: C.s3 }], { unit: '°C', ...o });
    chart('d2', 'line', L, [{ label: 'Outside RH', data: h.RH_out, color: C.s7 }], { unit: '%', yMin: 0, yMax: 100, ...o });
    chart('d3', 'bar', L, [{ label: 'Sunlight', data: h.ghi, color: C.s4 }], { unit: 'W/m²', ...o });
    chart('d4', 'bar', L, [{ label: 'Walls', data: h.Q_wall, color: C.s1 }, { label: 'Door', data: h.Q_door, color: C.s2 },
      { label: 'Fresh produce', data: h.Q_batch, color: C.s3 }, { label: 'Respiration', data: h.Q_resp, color: C.s4 }, { label: 'Fan, lights, controller', data: h.Q_int, color: C.s5 }], { unit: 'kW', stacked: true, ...o });
    chart('d5', 'bar', L, [{ label: 'Speed', data: h.comp_speed_pct, color: C.s1 }], { unit: '%', yMin: 0, yMax: 100, ...o });
    chart('d6', 'line', L, [{ label: 'Solar available', data: h.P_pv, color: C.s4 }, { label: 'Compressor + fan', data: h.P_comp, color: C.s1 }, { label: 'From grid', data: h.P_grid, color: C.s8 }], { unit: 'kW', ...o });
    chart('d7', 'line', L, [{ label: 'Condensing', data: h.P_cond_bar, color: C.s2 }, { label: 'Evaporating', data: h.P_evap_bar, color: C.s1 }], { unit: 'bar', yMin: 0, ...o });
    chart('d8', 'line', L, [{ label: 'Discharge', data: h.T_discharge_C, color: C.s8 }, { label: 'Condensing', data: h.T_cond_C, color: C.s2 }, { label: 'Evaporating', data: h.P_evap_bar.map(v => (v === null ? null : -5)), color: C.s1 }], { unit: '°C', ...o });
    chart('d9', 'line', L, [{ label: 'COP', data: h.COP, color: C.s3 }], { unit: '', ...o });
    chart('d10', 'line', L, [{ label: 'Wax', data: h.pcm_pct, color: C.s1, fill: 'rgba(42,120,214,.15)' }], { unit: '%', yMin: 0, yMax: 100, ...o });
    chart('d11', 'bar', L, [{ label: 'Door open', data: h.door_s, color: C.s2 }], { unit: 's', ...o });
    chart('d12', 'bar', L, [{ label: 'Grid', data: h.P_grid, color: C.s8 }], { unit: 'kW', ...o });
  }

  // ------------------------------------------------------------------ calendar
  function calendar() {
    const days = table(D().daily);
    const byMon = {};
    days.forEach(d => (byMon[d._.slice(0, 7)] = byMon[d._.slice(0, 7)] || []).push(d));
    const MN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    main.innerHTML = `<h2>Calendar – click a day</h2>
      <div class="legend"><span><i style="background:#bbf7d0"></i>fully on solar + wax</span><span><i style="background:#fde68a"></i>grid only during morning loading</span>
        <span><i style="background:#fecaca"></i>grid at other times</span><span><i style="background:repeating-linear-gradient(45deg,#e3ecf3 0 4px,#f8fafc 4px 8px)"></i>today / tomorrow (forecast)</span></div>
      <div class="cal">${Object.entries(byMon).map(([m, ds]) => {
        const first = new Date(m + '-01T00:00:00Z').getUTCDay(), pad = (first + 6) % 7;
        return `<div class="month"><h4>${MN[+m.slice(5) - 1]} ${m.slice(0, 4)}</h4><div class="days">${['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(w => `<div class="wd">${w}</div>`).join('')}
          ${'<div></div>'.repeat(pad)}${ds.map(d => { const cls = d.status !== 'actual' ? 'pred' : d.full_solar_wax ? 'full' : (d.grid_other_h > 0 ? 'grid' : 'gridload');
            return `<button class="day ${cls} ${d.status === 'today' ? 'today' : ''} ${d._ === selDay ? 'sel' : ''}" data-d="${d._}" title="${d._}: compressor ${fmt(d.comp_kWh, 2)} kWh, grid ${fmt(d.grid_h, 1)} h">${+d._.slice(8)}</button>`; }).join('')}</div></div>`;
      }).join('')}</div><div id="dayBox"></div>`;
    main.querySelector('.cal').onclick = e => { const b = e.target.closest('.day'); if (!b) return; selDay = b.dataset.d; calendar(); };
    if (selDay) dayView(selDay, $('dayBox'));
  }

  // ------------------------------------------------------------------ today
  function today() {
    const n = istNow();
    const date = S.today;
    const stale = n.date !== date;
    main.innerHTML = `<h2>Today: ${date}</h2>
      <p class="lead">Hours before now use the latest Open-Meteo estimate of what happened; hours after now are the forecast run through our twin (shaded). The red line moves with the real clock.
      ${stale ? `<br><b class="check">These results are from ${S.generated}. They refresh every day at 6 am (or run <code>python -m twin.live_run --fetch</code>).</b>` : ''}</p>
      <div id="dayBox"></div>`;
    const draw = () => { killCharts(); const now = istNow(); dayView(date, $('dayBox'), { now: now.date === date ? Math.min(23, now.hour) : null }); };
    draw();
    clearInterval(window.__todayTimer); window.__todayTimer = setInterval(() => tab === 'today' && draw(), 60000);
  }

  // ------------------------------------------------------------------ tomorrow
  function tomorrow() {
    const t = D().tomorrow, date = S.tomorrow;
    main.innerHTML = `<h2>Tomorrow: ${date}</h2><div class="pred">${S.prediction_label}</div>
      <div class="tiles">
        ${tile('Heat load (prediction)', `${fmt(t.load_kWh, 1)} kWh`, `outside up to ${fmt(t.T_out_max, 1)} °C, sunlight ${fmt(t.ghi_kWh_m2, 2)} kWh/m²`)}
        ${tile('Compressor electricity', `${fmt(t.comp_kWh, 2)} kWh`, `cooling ${fmt(t.cool_kWh, 1)} kWh`)}
        ${tile('Solar', `${fmt(t.pv_kWh, 1)} kWh`, `${fmt(t.solar_used_kWh, 1)} kWh used`)}
        ${tile('Grid use', `${fmt(t.grid_kWh, 2)} kWh`, `${fmt(t.grid_h, 1)} h`, t.grid_h > 0 ? 'warn' : 'good')}
        ${tile('Wax at the end of the day', `${fmt(t.pcm_end, 0)} %`, `lowest ${fmt(t.pcm_min, 0)} %`)}
        ${tile('Room lowest / highest', `${fmt(t.T_room_min, 1)} / ${fmt(t.T_room_max, 1)} °C`, `fresh batch cooled in ${fmt(t.batch_cool_h, 1)} h`)}
      </div><div id="dayBox"></div>`;
    dayView(date, $('dayBox'));
  }

  // ------------------------------------------------------------------ design year vs 2026
  function compare() {
    const dy = S.design_year[design];
    if (!dy) { main.innerHTML = `<div class="card">Design-year results are missing (${S.design_year_error || 'ISHRAE file not available'}).</div>`; return; }
    const A = table(D().monthly), Y = table(dy.monthly).map(m => ({ ...m, mon: m._.slice(5) }));
    const rows = Y.map(y => ({ y, a: A.find(a => a._.slice(5) === y.mon) }));
    const per = (m, k) => (m ? m[k] / m.days : null);
    const ta = D().totals, ty = dy.totals;
    main.innerHTML = `<h2>Design year (ISHRAE typical year) vs actual 2026</h2>
      <p class="lead">The same room and fixed inputs on two kinds of weather: the ISHRAE 2014 typical year for Visakhapatnam (what designers use) and the real 2026 weather so far.
      Only our simulation results are shown – the ISHRAE weather itself may not be shared (licence).</p>
      <div class="tiles">${tile('Compressor kWh/day', `${fmt(ty.comp_kWh_day_avg, 2)} → ${fmt(ta.comp_kWh_day_avg, 2)}`, 'design year → 2026')}
        ${tile('Days fully on solar + wax', `${fmt(100 * ty.days_full_solar_wax / ty.days, 0)} % → ${fmt(100 * ta.days_full_solar_wax / ta.days, 0)} %`, 'design year → 2026')}
        ${tile('Grid hours per day', `${fmt(ty.grid_h / ty.days, 2)} → ${fmt(ta.grid_h / ta.days, 2)}`, 'design year → 2026')}
        ${tile('Fresh batch to 5.5 °C', `${fmt(ty.batch_cool_h_avg, 1)} → ${fmt(ta.batch_cool_h_avg, 1)} h`, 'average')}</div>
      <div class="grid2"><div class="card"><h4>Compressor electricity per day (kWh)</h4><div class="chartbox"><canvas id="k1"></canvas></div></div>
        <div class="card"><h4>Average outside temperature (°C)</h4><div class="chartbox"><canvas id="k2"></canvas></div></div>
        <div class="card"><h4>Sunlight per day (kWh/m²)</h4><div class="chartbox"><canvas id="k3"></canvas></div></div>
        <div class="card"><h4>Grid hours per day</h4><div class="chartbox"><canvas id="k4"></canvas></div></div></div>`;
    const L = rows.map(r => r.y.mon);
    const two = (id, f, unit) => chart(id, 'bar', L, [{ label: 'Design year (ISHRAE)', data: rows.map(r => f(r.y)), color: C.grey }, { label: 'Actual 2026', data: rows.map(r => (r.a ? f(r.a) : null)), color: C.s1 }], { unit });
    two('k1', m => per(m, 'comp_kWh'), 'kWh'); two('k2', m => m.T_out_mean, '°C'); two('k3', m => per(m, 'ghi_kWh_m2'), 'kWh/m²'); two('k4', m => per(m, 'grid_h'), 'h');
  }

  // ------------------------------------------------------------------ money
  function money() {
    const M = S.money, dflt = M.defaults;
    let p = { ...dflt, cut0: dflt.power_cut_hours[0], cut1: dflt.power_cut_hours[1] };
    try { p = { ...p, ...JSON.parse(localStorage.getItem('live-money') || '{}') }; } catch (e) { /* ignore */ }
    const field = (k, label, step) => `<label>${label}<input type="number" step="${step}" data-k="${k}" value="${p[k]}"></label>`;
    main.innerHTML = `<h2>Money and CO₂ (running cost only)</h2>
      <p class="lead"><span class="check">All prices are guesses – check locally.</span> The 10:00–18:00 power cut is an assumption. Equipment cost is not included.</p>
      <div class="card"><div class="form">${field('grid_tariff_INR_kWh', 'Grid tariff (₹/kWh)', 0.5)}${field('diesel_INR_L', 'Diesel price (₹/L)', 1)}
        ${field('diesel_L_per_kWh', 'Diesel use (L per kWh)', 0.05)}${field('cut0', 'Power cut starts (hour)', 1)}${field('cut1', 'Power cut ends (hour)', 1)}
        ${field('grid_kg_CO2_kWh', 'Grid CO₂ (kg/kWh)', 0.01)}${field('diesel_kg_CO2_L', 'Diesel CO₂ (kg/L)', 0.01)}</div>
        <p><button class="btn ghost" id="mReset">Back to default values</button></p></div><div id="mOut"></div>`;
    const calc = () => {
      main.querySelectorAll('input[data-k]').forEach(i => (p[i.dataset.k] = +i.value));
      try { localStorage.setItem('live-money', JSON.stringify(p)); } catch (e) { /* ignore */ }
      const n = M.days.length, inCut = h => (p.cut0 <= p.cut1 ? h >= p.cut0 && h < p.cut1 : h >= p.cut0 || h < p.cut1);
      let go = 0, cut = 0;
      M.gridonly_kWh_by_hour.forEach(row => row.forEach((v, h) => { go += v; if (inCut(h)) cut += v; }));
      const ours = M.ours_grid_kWh[design].reduce((a, b) => a + b, 0);
      const cost = { grid: go * p.grid_tariff_INR_kWh, diesel: (go - cut) * p.grid_tariff_INR_kWh + cut * p.diesel_L_per_kWh * p.diesel_INR_L, ours: ours * p.grid_tariff_INR_kWh };
      const co2 = { grid: go * p.grid_kg_CO2_kWh, diesel: (go - cut) * p.grid_kg_CO2_kWh + cut * p.diesel_L_per_kWh * p.diesel_kg_CO2_L, ours: ours * p.grid_kg_CO2_kWh };
      const yr = 365 / n;
      $('mOut').innerHTML = `<div class="tiles">
          ${tile('Grid-only cold room', inr(cost.grid), `${fmt(go, 0)} kWh from the grid in ${n} days · ${inr(cost.grid / n)}/day`)}
          ${tile('Diesel-backed cold room', inr(cost.diesel), `${fmt(cut * p.diesel_L_per_kWh, 0)} L diesel in power cuts · ${inr(cost.diesel / n)}/day`)}
          ${tile('Our system (' + design + ')', inr(cost.ours), `${fmt(ours, 1)} kWh grid backup · ${inr(cost.ours / n)}/day`, 'good')}
          ${tile('Saved vs grid-only', inr(cost.grid - cost.ours), `${inr((cost.grid - cost.ours) / n)}/day · about ${inr((cost.grid - cost.ours) * yr)}/year`, 'good')}
          ${tile('Saved vs diesel-backed', inr(cost.diesel - cost.ours), `${inr((cost.diesel - cost.ours) / n)}/day · about ${inr((cost.diesel - cost.ours) * yr)}/year`, 'good')}
          ${tile('CO₂ saved', `${fmt(co2.grid - co2.ours, 0)} kg vs grid`, `${fmt(co2.diesel - co2.ours, 0)} kg vs diesel-backed (${n} days)`, 'good')}</div>
        <div class="card"><h4>Running cost so far in 2026 (₹)</h4><div class="chartbox short"><canvas id="m1"></canvas></div>
        <p class="note">Grid-only room: the same room, loads and fixed inputs, with no wax and no solar; the grid holds 5 °C all the time (twin run).
        Diesel-backed: the same energy, but during the power cut a diesel generator supplies it. Our system: only the grid backup the twin actually used.
        "Per year" = so far × 365 / ${n} days. Fans and controller are included in the grid-only and diesel rooms; in our system they run on solar (fan) and the small 12 V battery (controller).</p></div>`;
      killCharts();
      chart('m1', 'bar', ['Grid-only', 'Diesel-backed', 'Our system'], [{ label: '₹', data: [cost.grid, cost.diesel, cost.ours], backgroundColor: [C.grey, C.s2, C.s3], color: C.s1 }], { unit: '₹', legend: false });
    };
    main.querySelectorAll('input[data-k]').forEach(i => (i.oninput = calc));
    $('mReset').onclick = () => { try { localStorage.removeItem('live-money'); } catch (e) { /* ignore */ } money(); };
    calc();
  }

  // ------------------------------------------------------------------ fixed inputs
  async function inputs() {
    const I = S.inputs, b = I.battery_12V, loadsW = Object.values(b.loads_W).reduce((a, c) => a + c, 0);
    let editable = false;
    try { editable = location.protocol !== 'file:' && (await fetch('api/live/config', { method: 'GET' })).ok; } catch (e) { /* static */ }
    const row = (k, v, key, step) => `<tr><td>${k}</td><td>${editable && key ? `<input data-k="${key}" type="number" step="${step || 1}" value="${v}" style="width:110px">` : v}</td></tr>`;
    main.innerHTML = `<h2>Fixed inputs (saved in config/design.json → live_run)</h2>
      <div class="grid2"><div class="card"><table class="t">
        ${row('Room inside (m)', I.inside_m.join(' × '))}${row('Insulation (mm PUF)', I.insulation_thickness_m * 1000)}
        ${row('Strip curtain', I.curtain_installed ? 'on' : 'off')}${row('Compressor maximum cooling (kW)', I.compressor_max_kW, 'compressor_max_kW', 0.1)}
        ${row('Produce always inside (kg)', I.produce_kg, 'produce_kg', 10)}${row('Set-point (°C)', I.setpoint_C, 'setpoint_C', 0.5)}
        ${row('Allowed band (°C)', I.band_C.join(' – '))}${row('Daily swap hour', I.swap_hour, 'swap_hour', 1)}
        ${row('Door openings per day', I.door_openings.length + ' × ' + I.door_seconds + ' s at ' + I.door_openings.map(o => `${o[0]}:${String(o[1]).padStart(2, '0')}`).join(', '))}
        ${row('“Cooled” = within (K) of the set-point', I.cooled_within_K, 'cooled_within_K', 0.1)}
        ${row('Grid helps during morning loading', I.grid_assist_during_loading ? 'yes' : 'no (default)')}
        ${row('Night: wax cools by natural convection (W/m²K)', I.natural_convection_h_W_m2K, 'natural_convection_h_W_m2K', 0.5)}
        ${row('Designs', Object.values(I.designs).map(d => d.label).join(' / '))}</table>
        ${editable ? '<p><button class="btn" id="save">Save and re-run (about 15 s)</button> <span id="saveMsg"></span></p>' : '<p class="note">To change these, edit config/design.json → live_run, or open this page from the Python version (python run.py) to edit here.</p>'}</div>
      <div class="card"><h4>🔋 Power: no battery for cooling</h4>
        <p>The compressor <b>and the 40 W evaporator fan</b> run only on solar or, when needed, grid (automatic transfer switch). <b>The wax is the cold storage.</b></p>
        <p>A small <b>12 V ${b.capacity_Ah} Ah ${b.chemistry}</b> battery (${fmt(12 * b.capacity_Ah / 1000, 2)} kWh) runs only the controller, sensors and IoT gateway:
        ${Object.entries(b.loads_W).map(([k, v]) => `${k.replace('_', ' ')} ${v} W`).join(', ')} = ${loadsW} W → ${fmt(loadsW * 24 / 1000, 2)} kWh/day,
        about ${fmt(12 * b.capacity_Ah * 0.8 / (loadsW * 24), 1)} days with no sun at 80 % depth of discharge. It is charged from the panels.</p>
        <p class="note">${b.note}</p>
        <h4>Assumptions added for the Live Year Run</h4><ul class="note">
          <li>“Reached 5 °C” = within ${I.cooled_within_K} K of the set-point (5.5 °C).</li>
          <li>Door: 2 openings at loading (8:00, 8:10), 1 at 12:00, 1 at 17:00, ${I.door_seconds} s each.</li>
          <li>The whole ${I.produce_kg} kg is swapped every day at ${I.swap_hour}:00 at that hour's outside temperature.</li>
          <li>Fresh produce cools at the same rate as before (7/8 of the way in 4 h when the room is at 5 °C); slower if the compressor is at its limit.</li>
          <li>The evaporator fan runs only with the compressor; at night the wax panels cool the room by natural convection (h = ${I.natural_convection_h_W_m2K} W/m²K).</li>
          <li>Sunlight time-stamps corrected by 30 min (India is UTC + 5:30); checked against the sun on clear days.</li>
          <li>Money: running cost only; power cut ${I.money.power_cut_hours[0]}:00–${I.money.power_cut_hours[1]}:00 assumed; CO₂ ${I.money.grid_kg_CO2_kWh} kg/kWh grid, ${I.money.diesel_kg_CO2_L} kg/L diesel.</li></ul></div></div>`;
    if (editable) $('save').onclick = async () => {
      const upd = {}; main.querySelectorAll('input[data-k]').forEach(i => (upd[i.dataset.k] = +i.value));
      $('saveMsg').textContent = 'Running the twin…';
      const r = await fetch('api/live/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(upd) });
      $('saveMsg').textContent = r.ok ? 'Saved – reloading…' : 'Failed: ' + (await r.text());
      if (r.ok) setTimeout(() => location.reload(), 800);
    };
  }

  function render() {
    killCharts();
    ({ year, calendar, today, tomorrow, compare, money, inputs })[tab]();
  }
  render();
})();
