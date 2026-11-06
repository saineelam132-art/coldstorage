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
  let sunRaw = false;
  const key = () => (sunRaw && design === 'current' && S.designs.current_uncorrected ? 'current_uncorrected' : design);
  const D = () => S.designs[key()];
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
    if (des === 'current_uncorrected' || des === 'current_plain') des = 'current';
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
  $('sunRaw').onchange = e => { sunRaw = e.target.checked; render(); };
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
      <p class="lead">${D().label}. Fixed inputs: <b>150 kg rated capacity</b>, swapped every day at ${S.inputs.loading.map(e => e.hour + ':00 (' + e.kg + ' kg)').join(' + ')}, 4 door openings a day, compressor max 1.5 kW, sunlight × ${S.sun_factor}.</p>
      <div class="tiles">
        ${tile('Compressor electricity', `${fmt(t.comp_kWh_day_avg, 2)} kWh/day`, `max ${fmt(t.comp_kWh_day_max, 2)} on ${t.comp_kWh_day_max_date} · total ${fmt(t.comp_kWh, 0)} kWh`)}
        ${tile('Cooling delivered', `${fmt(t.cool_kWh, 0)} kWh`, `compressor ran ${fmt(t.run_h, 0)} h`)}
        ${tile('Days fully on solar + wax', `${t.days_full_solar_wax} / ${t.days}`, `${fmt(100 * t.days_full_solar_wax / t.days, 0)} % of days`, 'good')}
        ${tile('Grid backup', `${fmt(t.grid_h, 0)} h`, `${fmt(t.grid_kWh, 1)} kWh from the grid`, 'warn')}
        ${tile('Solar used', `${fmt(t.solar_used_kWh, 0)} kWh`, `of ${fmt(t.pv_kWh, 0)} kWh produced`)}
        ${tile('Fresh batch to 5.5 °C', `${fmt(t.batch_cool_h_avg, 1)} h avg`, `worst ${fmt(t.batch_cool_h_max, 1)} h (${t.batch_cool_h_max_date})`)}
        ${tile('Wax: PCM effectiveness', `${fmt(t.pcm_effectiveness_pct, 0)} %`, `cold given ÷ cold stored · ${fmt(t.wax_cycles, 0)} full cycles`)}
        ${tile('Wax cold given with no sun', `${fmt(t.wax_useful_share_pct, 0)} %`, 'the real time-shift')}
        ${tile('Hours outside 2–8 °C (except loading)', `${fmt(t.hot_other_h, 0)} h`, `room air above 8 °C only while a fresh batch cools: ${fmt(t.hot_load_h_per_day, 1)} h/day`, t.hot_other_h > 0 ? 'bad' : 'good')}
        ${tile('Wax fins (passive)', `0 W · UA ${fmt(S.wax_hx && S.wax_hx.calc_3K ? S.wax_hx.calc_3K.UA : null, 0)} W/K`, `40 mm aluminium fins: area × ${fmt(S.wax_hx && S.wax_hx.calc_3K ? S.wax_hx.calc_3K.area_mult : null, 1)}, no fan, no moving parts`, 'good')}
        ${tile('Fresh produce (avg)', `${fmt(t.batch_T_in_avg, 1)} °C in`, `${fmt(t.batch_T_after_2h_avg, 1)} °C after 2 h · ${fmt(t.batch_T_after_4h_avg, 1)} °C after 4 h (average; core measured in Phase 4)`)}
        ${tile('Wax at sunrise / sunset', `${fmt(t.wax_sunrise_avg, 0)} / ${fmt(t.wax_sunset_avg, 0)} %`, 'average frozen fraction')}
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
      <div><span>Fresh 150 kg in at ${S.inputs.loading[0].hour}:00</span><b>${fmt(d.batch_T_in, 1)} °C</b>, to 5.5 °C in ${d.batch_cool_h === null ? 'not yet' : fmt(d.batch_cool_h, 1) + ' h'}</div>
      <div><span>Door openings</span><b>${fmt(d.door_openings, 0)}</b></div>
      <div><span>Room air &gt; 8 °C while fresh produce cools</span><b>${fmt(d.hot_load_h, 1)} h</b> (other times ${fmt(d.hot_other_h, 0)} h)</div>
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
        <div class="card"><h4>Heat taken from the room by the finned wax panels (kW)</h4><div class="chartbox"><canvas id="d13"></canvas></div></div>
        <div class="card"><h4>Wax ↔ room conductance (W/K)</h4><div class="chartbox"><canvas id="d14"></canvas></div></div>
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
    if (h.Q_pcm_room) chart('d13', 'bar', L, [{ label: 'Wax panels', data: h.Q_pcm_room, color: C.s1 }], { unit: 'kW', ...o });
    if (h.G_wax) chart('d14', 'line', L, [{ label: 'UA finned panels', data: h.G_wax, color: C.s3 }], { unit: 'W/K', yMin: 0, ...o });
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
    const PB = S.payback;
    let p = { ...dflt, cut0: dflt.power_cut_hours[0], cut1: dflt.power_cut_hours[1], subsidy_pct: PB ? PB.subsidy_pct : 35, genset: PB ? PB.diesel_genset_INR : 45000 };
    try { p = { ...p, ...JSON.parse(localStorage.getItem('live-money') || '{}') }; } catch (e) { /* ignore */ }
    const field = (k, label, step) => `<label>${label}<input type="number" step="${step}" data-k="${k}" value="${p[k]}"></label>`;
    main.innerHTML = `<h2>Money and CO₂ (running cost only)</h2>
      <p class="lead"><span class="check">All prices are guesses – check locally.</span> The 10:00–18:00 power cut is an assumption. Equipment cost only in the payback ESTIMATE at the bottom.</p>
      <div class="card"><div class="form">${field('grid_tariff_INR_kWh', 'Grid tariff (₹/kWh)', 0.5)}${field('diesel_INR_L', 'Diesel price (₹/L)', 1)}
        ${field('diesel_L_per_kWh', 'Diesel use (L per kWh)', 0.05)}${field('cut0', 'Power cut starts (hour)', 1)}${field('cut1', 'Power cut ends (hour)', 1)}
        ${field('grid_kg_CO2_kWh', 'Grid CO₂ (kg/kWh)', 0.01)}${field('diesel_kg_CO2_L', 'Diesel CO₂ (kg/L)', 0.01)}
        ${field('subsidy_pct', 'Government subsidy (%)', 5)}${field('genset', 'Diesel genset price (₹, GUESS)', 1000)}</div>
        <p><button class="btn ghost" id="mReset">Back to default values</button></p></div><div id="mOut"></div>`;
    const payCard = (svG, svD) => {
      const ex = PB.extra_cost_INR, sub = p.subsidy_pct / 100, exD = ex - p.genset;
      const yrs = (c, sv) => (sv > 0 ? `${fmt(c / sv, 1)} years` : 'no saving');
      return `<div class="card"><h4>Payback – ESTIMATE (all prices GUESS – get quotations)</h4>
        <table class="t"><tr><th></th><th>vs a plain grid-only cold room</th><th>vs a grid + diesel cold room</th></tr>
        <tr><td>Extra cost of our system (solar + wax + fins + IoT)</td><td>${inr(ex)}</td><td>${inr(exD)} (${inr(ex)} − ${inr(p.genset)} genset it needs and we do not)</td></tr>
        <tr><td>Saving per year (running cost, above)</td><td>${inr(svG)}</td><td>${inr(svD)}</td></tr>
        <tr><td><b>Simple payback</b></td><td><b>${yrs(ex, svG)}</b></td><td><b>${yrs(exD, svD)}</b></td></tr>
        <tr><td>With ${fmt(p.subsidy_pct, 0)} % government subsidy on our extra cost</td><td><b>${yrs(ex * (1 - sub), svG)}</b></td><td><b>${yrs(exD - sub * ex, svD)}</b></td></tr></table>
        <details><summary>What is in the extra cost</summary><table class="t">${PB.extra_items.map(i => `<tr><td>${i.item}</td><td>${inr(i.INR)}</td></tr>`).join('')}</table></details>
        <p class="note">${PB.note} Same room, door, curtain, evaporator, compressor and labour in all three rooms (assumption). Change the subsidy % and genset price above.</p></div>`;
    };
    const calc = () => {
      main.querySelectorAll('input[data-k]').forEach(i => (p[i.dataset.k] = +i.value));
      try { localStorage.setItem('live-money', JSON.stringify(p)); } catch (e) { /* ignore */ }
      const n = M.days.length, inCut = h => (p.cut0 <= p.cut1 ? h >= p.cut0 && h < p.cut1 : h >= p.cut0 || h < p.cut1);
      let go = 0, cut = 0;
      M.gridonly_kWh_by_hour.forEach(row => row.forEach((v, h) => { go += v; if (inCut(h)) cut += v; }));
      const ours = M.ours_grid_kWh[key()].reduce((a, b) => a + b, 0);
      const cost = { grid: go * p.grid_tariff_INR_kWh, diesel: (go - cut) * p.grid_tariff_INR_kWh + cut * p.diesel_L_per_kWh * p.diesel_INR_L, ours: ours * p.grid_tariff_INR_kWh };
      const co2 = { grid: go * p.grid_kg_CO2_kWh, diesel: (go - cut) * p.grid_kg_CO2_kWh + cut * p.diesel_L_per_kWh * p.diesel_kg_CO2_L, ours: ours * p.grid_kg_CO2_kWh };
      const yr = 365 / n;
      $('mOut').innerHTML = `<div class="tiles">
          ${tile('Grid-only cold room', inr(cost.grid), `${fmt(go, 0)} kWh from the grid in ${n} days · ${inr(cost.grid / n)}/day`)}
          ${tile('Diesel-backed cold room', inr(cost.diesel), `${fmt(cut * p.diesel_L_per_kWh, 0)} L diesel in power cuts · ${inr(cost.diesel / n)}/day`)}
          ${tile('Our system (' + (design === 'current' ? 'final design' : 'bigger option') + ')', inr(cost.ours), `${fmt(ours, 1)} kWh grid backup · ${inr(cost.ours / n)}/day`, 'good')}
          ${tile('Saved vs grid-only', inr(cost.grid - cost.ours), `${inr((cost.grid - cost.ours) / n)}/day · about ${inr((cost.grid - cost.ours) * yr)}/year`, 'good')}
          ${tile('Saved vs diesel-backed', inr(cost.diesel - cost.ours), `${inr((cost.diesel - cost.ours) / n)}/day · about ${inr((cost.diesel - cost.ours) * yr)}/year`, 'good')}
          ${tile('CO₂ saved', `${fmt(co2.grid - co2.ours, 0)} kg vs grid`, `${fmt(co2.diesel - co2.ours, 0)} kg vs diesel-backed (${n} days)`, 'good')}</div>
        <div class="card"><h4>Running cost so far in 2026 (₹)</h4><div class="chartbox short"><canvas id="m1"></canvas></div>
        <p class="note">Grid-only room: the same room, loads and fixed inputs, with no wax and no solar; the grid holds 5 °C all the time (twin run).
        Diesel-backed: the same energy, but during the power cut a diesel generator supplies it. Our system: only the grid backup the twin actually used.
        "Per year" = so far × 365 / ${n} days. Fans and controller are included in the grid-only and diesel rooms; in our system they run on solar (fan) and the small 12 V battery (controller).</p></div>
        ${PB ? payCard((cost.grid - cost.ours) * yr, (cost.diesel - cost.ours) * yr) : ''}`;
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
        ${row('Produce always inside (rated capacity, kg)', I.produce_kg)}${row('Set-point (°C)', I.setpoint_C, 'setpoint_C', 0.5)}
        ${row('Allowed band (°C)', I.band_C.join(' – '))}${row('Loading', I.loading.map(e => `${e.kg} kg at ${e.hour}:00`).join(' + ') + ' (at that hour’s outside temperature)')}
        ${row('Door openings per day', '4 × ' + I.door_seconds + ' s (2 at each loading, rest at 12:00 and 17:00)')}
        ${row('Sunlight', '× ' + I.sun_factor + ' (Open-Meteo corrected to NASA level, conservative)')}
        ${row('Wax heat exchanger', `finned panels: ${I.wax_hx.b * 1000} mm aluminium fins, ${I.wax_hx.S * 1000} mm gap, ${I.wax_hx.t * 1000} mm thick, panels ${I.wax_hx.L} m tall – passive, no fan, no baffle`)}
        ${row('“Cooled” = within (K) of the set-point', I.cooled_within_K, 'cooled_within_K', 0.1)}
        ${row('Grid helps during morning loading', I.grid_assist_during_loading ? 'yes' : 'no (default)')}
        ${row('Optional fans', `${I.wax_hx.optional_fans.provision} × 120 mm – mounting points + 12 V cable only; add only if the Phase 4 test shows the fins &gt;25 % weaker`)}
        ${row('Keep-clear / drip tray', `${I.wax_hx.keep_clear_m * 100} cm free in front of the fins (floor stoppers); sloped drip tray with drain and trap`)}
        ${row('Designs', Object.values(I.designs).map(d => d.label).join(' / '))}</table>
        ${editable ? '<p><button class="btn" id="save">Save and re-run (about 15 s)</button> <span id="saveMsg"></span></p>' : '<p class="note">To change these, edit config/design.json → live_run, or open this page from the Python version (python run.py) to edit here.</p>'}</div>
      <div class="card"><h4>🔋 Power: no battery for cooling</h4>
        <p>The compressor <b>and the 40 W evaporator fan</b> run only on solar or, when needed, grid (automatic transfer switch). <b>The wax is the cold storage.</b>
        The wax panels need no power at all (fins, natural convection).</p>
        <p>A small <b>12 V ${b.capacity_Ah} Ah ${b.chemistry}</b> battery (${fmt(12 * b.capacity_Ah / 1000, 2)} kWh) runs only the controller, sensors and IoT gateway:
        ${Object.entries(b.loads_W).map(([k, v]) => `${k.replace('_', ' ')} ${v} W`).join(', ')} = ${loadsW} W → ${fmt(loadsW * 24 / 1000, 2)} kWh/day.
        Sized for the worst 2026 night (${fmt(S.battery ? S.battery.worst_night_Wh : null, 0)} Wh) plus one reserve day (${fmt(S.battery ? S.battery.worst_day_Wh : null, 0)} Wh) at 80 % usable → ${b.capacity_Ah} Ah. It is charged from the panels.</p>
        <p class="note">${b.note}</p>
        <h4>Assumptions added for the Live Year Run</h4><ul class="note">
          <li>“Reached 5 °C” = within ${I.cooled_within_K} K of the set-point (5.5 °C).</li>
          <li>Door: 2 openings at each loading (hh:00, hh:10), the rest at 12:00 and 17:00, ${I.door_seconds} s each (4 a day).</li>
          <li>The whole ${I.produce_kg} kg (rated capacity) is swapped every day at ${I.loading.map(e => e.hour + ':00').join(' and ')} at that hour's outside temperature.</li>
          <li>Fresh produce cools at the same rate as before (7/8 of the way in 4 h when the room is at 5 °C); slower if the compressor is at its limit.</li>
          <li>The evaporator fan runs only with the compressor. With the compressor off, the finned wax panels cool the room by natural convection only (engine/fins.py, lower of two fin-array correlations; radiation ignored – conservative).</li>
          <li>Average produce temperature is reported (single-lump model); the core of a crate is warmer and is measured with the product probe in Phase 4.</li>
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

  function designTab() {
    const st = S.design_study, b = S.battery || {};
    if (!st) { main.innerHTML = '<div class="card">Design study not found – run python -m twin.design_study_2026.</div>'; return; }
    const w = st.wax_hx || {}, c3 = w.calc_3K || {}, fl = st.floor || {}, hx = S.inputs.wax_hx;
    const tbl = (obj, rows) => { const cols = Object.keys(obj);
      return `<div class="scroll"><table class="t"><tr><th></th>${cols.map(c => `<th>${c}</th>`).join('')}</tr>${rows.map(([k, lab, d]) =>
        `<tr><td>${lab}</td>${cols.map(c => `<td>${typeof obj[c][k] === 'string' ? obj[c][k] : fmt(obj[c][k], d)}</td>`).join('')}</tr>`).join('')}</table></div>`; };
    const common = [['produce_in_C', 'Produce temperature when loaded (°C)', 1], ['h_air_above_8C_per_day', 'Room air > 8 °C, h/day (only while fresh produce cools)', 2],
      ['produce_avg_C_after_2h', 'Average produce after 2 h (°C)', 1], ['produce_avg_C_after_4h', 'Average produce after 4 h (°C)', 1],
      ['cool_h_avg', 'Time to 5.5 °C – average (h)', 1], ['cool_h_worst', 'Time to 5.5 °C – worst (h)', 1],
      ['grid_h_per_year', 'Grid hours per year', 0], ['days_full_solar_wax', 'Days fully on solar + wax', 0], ['comp_kWh_day', 'Compressor kWh/day', 2],
      ['saved_vs_grid_INR_yr', '₹ saved/year vs grid-only', 0], ['saved_vs_diesel_INR_yr', '₹ saved/year vs diesel-backed', 0]];
    const J = st.journey, jk = Object.keys(J).filter(k => !k.startsWith('check'));
    const bar = (v, max, col) => `<div class="jbar"><i style="width:${Math.max(2, 100 * v / max).toFixed(0)}%;background:${col}"></i></div>`;
    const maxG = Math.max(...jk.map(k => J[k].grid_h_per_year));
    const jcard = jk.map((k, i) => { const r = J[k]; const col = ['#8a8984', '#eb6834', '#2a78d6'][i];
      return `<div class="jstep${i === jk.length - 1 ? ' final' : ''}"><h5>${k}</h5>
        <div class="jrow"><span>Days fully on solar + wax</span><b>${r.days_full_solar_wax} / ${r.days}</b>${bar(r.days_full_solar_wax, r.days, col)}</div>
        <div class="jrow"><span>Grid hours / year</span><b>${fmt(r.grid_h_per_year, 0)} h</b>${bar(r.grid_h_per_year, maxG, col)}</div>
        <div class="jrow"><span>Moving parts</span><b>${r.moving_parts}</b></div>
        <div class="jrow"><span>12 V battery</span><b>${r.battery_Ah} Ah</b></div>
        <div class="jrow"><span>Wax ↔ room UA at 3 K</span><b>${fmt(r.UA_3K_W_K, 0)} W/K</b></div>
        <div class="jrow"><span>Fan energy (= heat into room)</span><b>${fmt(r.fan_kWh_day, 3)} kWh/day</b></div></div>`; }).join('<div class="jarrow">→</div>');
    const fins = [], N = 14;
    for (let i = 0; i < N; i++) fins.push(`<rect x="${70 + i * 18}" y="150" width="3" height="40" fill="#b9c6d2"/>`);
    main.innerHTML = `<h2>Design choices (2026 weather, sunlight × ${st.sun_factor}, ${st.period[0]} → ${st.period[1]})</h2>
      <div class="card"><h4>How we improved the wax heat exchanger</h4><div class="journey">${jcard}</div>
        <p class="note">Plain panels have too little surface: at night the wax cannot take the room's heat fast enough, so the grid runs almost every night.
        A baffle + 5 fans fixed that but added moving parts, 0.11 kWh/day of fan heat and an 80 Ah battery. Fins give almost the same result
        (the fans save a few more grid hours) with <b>nothing that moves and no power</b>, and halve the battery.</p>
        ${tbl(Object.fromEntries(Object.entries(J).filter(([k]) => k.startsWith('check'))), [['night_room_max_C', 'Night room max (°C)', 2], ['h_outside_2_8_other', 'Hours outside 2–8 °C (not loading)', 0], ['days_full_solar_wax', 'Days fully on solar + wax', 0], ['grid_h_per_year', 'Grid hours per year', 0], ['battery_Ah', '12 V battery (Ah)', 0]])}
        <p class="note">Safety check: if the real fins are 25 % weaker than calculated, the room still stays in 2–8 °C but grid hours rise; then fit the 2 optional fans
        (rule: compressor off → hold 6.5 °C) and a 50 Ah battery. The Phase 4 test decides.</p></div>
      <div class="card"><h4>Finned wax panel – ${hx.b * 1000} mm fins, ${hx.S * 1000} mm gap, ${hx.L} m tall</h4>
        <svg class="chan" viewBox="0 0 420 240" role="img" aria-label="Finned wax panel drawing, seen from above and from the side">
          <text x="200" y="146" font-size="11" fill="#41566b">seen from above</text>
          <rect x="60" y="190" width="270" height="14" fill="#9cc9f5" stroke="#2a78d6"/><text x="64" y="225" font-size="11" fill="#0d1b2a">wax (PCM) panel on the wall</text>
          ${fins.join('')}<text x="300" y="168" font-size="11" fill="#41566b">${hx.b * 1000} mm fins</text>
          <text x="20" y="20" font-size="11" fill="#41566b">side view</text>
          <rect x="30" y="30" width="10" height="90" fill="#9cc9f5" stroke="#2a78d6"/><rect x="40" y="30" width="16" height="90" fill="#d9e1e8"/>
          <path d="M70 32 V112" stroke="#2a78d6" stroke-width="3" marker-end="url(#ar)"/><text x="78" y="70" font-size="11" fill="#2a78d6">cooled air falls between the fins by itself</text>
          <path d="M20 124 h56 l-6 6 h-44 z" fill="#8795a3"/><text x="82" y="130" font-size="11" fill="#41566b">sloped drip tray → drain + trap</text>
          <path d="M120 32 h70" stroke="#8a8984" stroke-dasharray="4 3"/><text x="196" y="36" font-size="11" fill="#41566b">${hx.keep_clear_m * 100} cm keep-clear zone · floor stoppers</text>
          <defs><marker id="ar" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8z" fill="#2a78d6"/></marker></defs></svg>
        <table class="t"><tr><th>Calculation at 3 K (room 7 °C, wax 4 °C)</th><th>Value</th></tr>
          <tr><td>Fins</td><td>${fmt(c3.N_fins, 0)} fins × ${fmt(c3.b_mm, 0)} mm deep × ${fmt(c3.t_mm, 0)} mm thick, gap ${fmt(c3.S_mm, 0)} mm, over ${fmt(w.A_m2 / w.L_m, 1)} m of wall</td></tr>
          <tr><td>Area multiplier / fin efficiency</td><td>× ${fmt(c3.area_mult, 2)} / ${fmt(c3.eta, 3)}</td></tr>
          <tr><td>h (Bar-Cohen & Rohsenow / Van de Pol & Tierney → used, the lower)</td><td>${fmt(c3.h_bar_cohen, 2)} / ${fmt(c3.h_van_de_pol, 2)} → ${fmt(c3.h, 2)} W/m²K</td></tr>
          <tr><td>UA air side / with the wax layer</td><td>${fmt(c3.UA_air, 1)} / <b>${fmt(c3.UA, 1)} W/K</b> (plain panel: ${fmt(st.fin_table['plain panel'].UA, 1)} W/K)</td></tr>
          <tr><td>Heat removed at 3 K vs needed on the hottest night (${fmt(w.T_out_design_night_C, 1)} °C outside)</td><td><b>${fmt(c3.Q_W, 0)} W</b> vs ${fmt(w.load_W, 0)} W</td></tr>
          <tr><td>Aluminium</td><td>${fmt(c3.al_kg, 0)} kg, ${hx.material}, removable ${hx.section_length_m} m sections</td></tr>
          <tr><td>12 V battery (worst night + reserve day, 80 % usable)</td><td>${fmt(b.needed_Ah, 0)} Ah needed → ${b.chosen_Ah} Ah LiFePO4 (${fmt(b.chosen_kWh, 2)} kWh) – controller, sensors, IoT gateway only</td></tr></table>
        ${tbl(st.fin_table, [['S_mm', 'Gap (mm)', 0], ['area_mult', 'Area ×', 2], ['eta', 'Fin efficiency', 3], ['h', 'h (W/m²K)', 2], ['UA', 'UA (W/K)', 1], ['Q_W', 'Heat at 3 K (W)', 0], ['al_kg', 'Aluminium (kg)', 0]])}
        <p class="note">Condensation: the fins (about 4–5 °C) are below the room's dew point (5.5 °C at 7 °C, 90 % RH) → sloped drip tray with drain and trap; the wax never goes below 3 °C, so no frost. Clean the fin sections monthly.</p></div>
      <div class="card"><h4>Floor space with the keep-clear zone</h4><table class="t">
          <tr><td>Wall length for ${fmt(S.pcm.slab_area_m2, 0)} m² of ${hx.L} m tall panels</td><td>${fmt(fl.panel_length_needed_m, 2)} m needed · ${fmt(fl.wall_length_available_m, 2)} m of wall beside the door
            ${fl.panels_fit_on_walls ? '✓ fits' : '⚠ does not fit'}</td></tr>
          <tr><td>Panel height in the ${fmt(fl.room_height_m, 1)} m high room</td><td>from ${fmt(fl.panel_bottom_m, 2)} m to ${fmt(fl.panel_top_m, 2)} m above the floor; drip tray below; ${fmt(fl.top_gap_m * 100, 0)} cm free above for warm air to enter</td></tr>
          <tr><td>Band taken from the floor along the walls</td><td>${fmt(fl.band_from_wall_m * 100, 1)} cm (panel + ${hx.b * 100} cm fins + ${hx.keep_clear_m * 100} cm keep-clear)</td></tr>
          <tr><td>Usable floor</td><td>${fmt(fl.usable_floor_m2, 2)} m² of ${fmt(fl.floor_m2, 1)} m²</td></tr>
          <tr><td>150 kg of produce</td><td>${fl.crates} crates (600 × 400 × 300 mm, ~20 kg each – assumption) in ${fl.stacks_of_4} stacks of 4 → ${fmt(fl.crate_footprint_m2, 2)} m²</td></tr>
          <tr><td>Walking aisle from the door (60 cm)</td><td>${fmt(fl.aisle_m2, 2)} m²</td></tr>
          <tr><td>Free after crates and aisle</td><td><b>${fmt(fl.free_after_crates_and_aisle_m2, 2)} m²</b> ${fl.fits_150kg ? '✓ 150 kg fits' : '⚠ does not fit'}</td></tr></table></div>
      <div class="card"><h4>Loading options for 150 kg (finned panels, 115 kg wax, 1.8 kWp) – chosen: 6 am</h4>${tbl(st.loading_options, common)}
        <p class="note">6 am: realistic dawn harvest, cool produce, fewest grid hours. 4 am and 6 pm load warm produce when there is no sun, so the grid is needed most days.</p></div>
      <div class="card"><h4>Wax size (finned panels)</h4>${tbl(st.wax_compare, common)}
        <p class="note">The bigger option saves only about ₹${fmt(Object.values(st.wax_compare)[1].saved_vs_grid_INR_yr - Object.values(st.wax_compare)[0].saved_vs_grid_INR_yr, 0)} more a year but costs about ₹29,000 more (guess) → 115 kg + 1.8 kWp is the final design.</p></div>`;
  }

  function render() {
    killCharts();
    const sl = sunRaw && design === 'current' ? '<span class="sunlabel raw">UNcorrected Open-Meteo sun – comparison only</span>' : `<span class="sunlabel">${S.sun_label || 'Sunlight corrected to NASA level (conservative)'}</span>`;
    $('loadline').innerHTML = `${D().loading_statement || ''} ${sl}`;
    ({ year, calendar, today, tomorrow, compare, money, inputs, design: designTab })[tab]();
  }
  render();
})();
