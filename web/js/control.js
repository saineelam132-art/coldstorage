// Control centre: Calculations, What-If, Two rooms, Year results, Sensors.
import { getJSON } from './api.js';
import { fmt, tagChip } from './ui.js';
import { splitHTML, splitUpdate, valveWhyHTML } from './split.js';
import { photoFile } from './photos.js';
import { howSureHTML } from './howsure.js';
import { roomHTML, realityHTML } from './reality.js';

const $ = id => document.getElementById(id);
const FINAL = [
  ['final_15_day_profiles.webp', 'Typical day: sunny, partly cloudy and rainy – solar and compressor (illustration)'],
  ['final_10_uncertainty', 'How sure are we? Expected site weather error (studies)'], ['final_01_fins_hottest_night', 'Hottest night: plain vs finned panels'],
  ['final_07_fin_panel_drawing', 'Finned panel + drip tray (drawing)'],
  ['final_03_loading_options', 'When should the 150 kg come in?'], ['final_04_wax_115_vs_172', '115 kg vs 172 kg wax'],
  ['final_05_monthly_energy_2026', 'Monthly energy 2026'], ['final_06_money_co2', 'Money and CO₂ saved'], ['final_08_payback', 'Payback estimate (prices GUESS)'],
];
const FIGS = [
  ['11_heatmap_wax_solar', 'Wax × solar: grid backup hours per year'], ['14_current_vs_recommended', 'Current vs recommended design'],
  ['05_power_cut_night', 'Power-cut night: with vs without wax'], ['12_curtain_vs_none', 'Strip curtain vs no curtain'],
  ['13_forecast_vs_normal', 'Normal vs forecast charging'], ['02_day_counts', 'Sunny / cloudy / rainy days 2025'],
  ['04_pcm_battery_heatmap', 'Wax battery % by hour and month'], ['10_monthly_energy', 'Monthly solar vs cooling energy'],
  ['01_weather_monthly', 'Vizag sunlight 2025 vs long-term'], ['09_r290_ph_diagram', 'R290 cycle on the P–h diagram'],
  ['08_load_breakdown', 'Design-point heat load'], ['07_pcm_melt_front', 'Wax slab melt front (FTCS)'],
];

export class Control {
  constructor({ cfg, sensors, feed }) {
    Object.assign(this, { cfg, sensors, feed });
    this.tab = 'calc';
    $('ccBtn').onclick = () => this.open();
    $('ccClose').onclick = () => this.close();
    $('ccTabs').onclick = e => { const b = e.target.closest('button'); if (b) this.show(b.dataset.tab); };
    feed.on(s => { if (this.isOpen() && ['rooms', 'sensors', 'calc', 'how'].includes(this.tab)) this.live(s); });
  }
  isOpen() { return $('cc').classList.contains('on'); }
  open(tab) { $('cc').classList.add('on'); this.show(tab || this.tab); }
  close() { $('cc').classList.remove('on'); }

  async show(tab) {
    this.tab = tab;
    [...$('ccTabs').children].forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
    const body = $('ccBody');
    if (tab === 'how') {
      body.innerHTML = splitHTML(photoFile('condensing_unit')); if (this.feed.state) splitUpdate(this.feed.state.values, this.cfg);
      getJSON('results/live/valves_2026.json').then(V => { const w = $('valveWhy'); if (w) w.innerHTML = valveWhyHTML(V); }).catch(() => {});
    }
    if (tab === 'sure') body.innerHTML = await howSureHTML(this.cfg);
    if (tab === 'room') body.innerHTML = await roomHTML();
    if (tab === 'reality') body.innerHTML = await realityHTML();
    if (tab === 'calc') body.innerHTML = await this.calc();
    if (tab === 'whatif') { body.innerHTML = await this.whatifHTML(); this.whatifWire(); }
    if (tab === 'rooms') body.innerHTML = this.roomsHTML();
    if (tab === 'year') body.innerHTML = this.yearHTML();
    if (tab === 'sensors') body.innerHTML = this.sensorsHTML();
    if (this.feed.state) this.live(this.feed.state);
  }

  // ---------------------------------------------------------------- calculations
  async calc() {
    this.dp = this.dp || await getJSON('results/design_point.json');
    let html = `<p class="lead">Every formula with the numbers put in, at the design point (35 °C, 65 % RH outside, room 5 °C).
      All values are calculated by the engine (tag ${tagChip('C')}); design inputs are tag ${tagChip('E')}.</p>
      <h3>Heat entering the room, by source</h3><div id="bySource"></div><h3>Formulas</h3><table class="calc">`;
    let g = null;
    for (const r of this.dp) {
      if (r.value !== r.value || r.value === null) continue;
      if (r.group !== g) { g = r.group; html += `<tr class="grp"><td colspan="3">${g}</td></tr>`; }
      html += `<tr><td>${r.name}</td><td><code>${r.formula}</code>${r.substituted ? `<br><code class="sub">= ${r.substituted}</code>` : ''}</td>
        <td class="num">${Number(r.value).toPrecision(4)} ${r.unit}</td></tr>`;
    }
    return html + '</table>';
  }
  bySource(s) {
    const y = this.cfg.year_summary, v = s.values;
    const rows = [['Walls (U·A·ΔT)', v.Q_wall, y.load_wall_kWh], ['Door – sensible', v.Q_door - (v.Q_door * (y.load_door_latent_kWh / y.load_door_kWh)), y.load_door_kWh - y.load_door_latent_kWh],
      ['Door – latent (moisture)', v.Q_door * (y.load_door_latent_kWh / y.load_door_kWh), y.load_door_latent_kWh],
      ['Produce pull-down', v.Q_batch, y.load_product_kWh], ['Respiration', v.Q_resp, y.load_resp_kWh], ['Evaporator fan, lights, controller', v.Q_int, y.load_internal_kWh]];
    const tot = rows.reduce((a, r) => a + r[2], 0);
    return `<table class="calc"><tr class="grp"><td>Source</td><td class="num">Now (kW) ${tagChip('C')}</td><td class="num">2026 so far (kWh)</td><td class="num">Share of year</td></tr>
      ${rows.map(r => `<tr><td>${r[0]}</td><td class="num">${r[1].toFixed(3)}</td><td class="num">${r[2].toFixed(0)}</td>
      <td class="num"><span class="sharebar"><i style="width:${(100 * r[2] / tot).toFixed(1)}%"></i></span>${(100 * r[2] / tot).toFixed(0)} %</td></tr>`).join('')}
      <tr class="grp"><td>Total</td><td class="num">${(v.Q_total).toFixed(3)}</td><td class="num">${tot.toFixed(0)}</td><td></td></tr></table>
      <p class="small">"Now" = this 5-minute step of the simulated 2026 (door load averaged over the 5 minutes). Year = final design, 1 Jan 2026 to today.</p>`;
  }

  // ---------------------------------------------------------------- what-if
  async whatifHTML() {
    this.wi = this.wi || await getJSON('results/whatif.json');
    const G = this.wi.grid, crops = this.cfg.crops;
    const sl = (id, label, arr, val, unit) => `<label class="sl"><span>${label}: <b id="${id}V"></b> ${unit}</span>
      <input type="range" id="${id}" min="0" max="${arr.length - 1}" step="1" value="${Math.max(0, arr.indexOf(val))}"></label>`;
    return `<p class="lead">Move a slider – the result comes from the engine (every slider position was calculated with the same formulas as the twin).</p>
      <div class="wi"><div class="wiIn">
        ${sl('wT', 'Outside temperature', G.T_out, 35, '°C')}${sl('wRH', 'Outside humidity', G.RH_out, 65, '%')}
        ${sl('wDoor', 'Door openings per hour', G.door_per_h, 4, `(${this.wi.seconds_per_opening} s each)`)}
        ${sl('wPcm', 'Wax (PCM) mass', G.pcm_kg, this.cfg.design.pcm.mass_kg, 'kg')}
        <label class="chk2"><input type="checkbox" id="wCur" checked> Strip curtain</label>
        <label class="chk2"><input type="checkbox" id="wCloud"> Cloudy day</label>
        <label class="sl"><span>Crop</span><select id="wCrop">${Object.entries(crops).map(([k, c]) => `<option value="${k}" ${k === 'pomegranate' ? 'selected' : ''}>${c.label}</option>`).join('')}</select></label>
      </div><div class="wiOut" id="wiOut"></div></div><p class="small">${this.wi.note}</p>`;
  }
  whatifWire() {
    ['wT', 'wRH', 'wDoor', 'wPcm', 'wCur', 'wCloud', 'wCrop'].forEach(id => ($(id).oninput = () => this.whatif()));
    this.whatif();
  }
  whatif() {
    const G = this.wi.grid, F = this.wi.fields;
    const T = G.T_out[$('wT').value], RH = G.RH_out[$('wRH').value], n = G.door_per_h[$('wDoor').value], m = G.pcm_kg[$('wPcm').value];
    $('wTV').textContent = T; $('wRHV').textContent = RH; $('wDoorV').textContent = n; $('wPcmV').textContent = m;
    const key = `${T.toFixed(1)}|${RH}|${n}|${$('wCur').checked ? 1 : 0}|${m}|${$('wCloud').checked ? 1 : 0}`;
    const r = Object.fromEntries(F.map((f, i) => [f, this.wi.rows[key][i]]));
    const crop = this.cfg.crops[$('wCrop').value];
    const rate = Tc => (1 / crop.SL_ref_days) * crop.Q10 ** ((Tc - crop.T_ref_C) / 10);
    const sl5 = 1 / rate(this.cfg.design.setpoint.target_C), slN = 1 / rate(r.T_room_night_C);
    const chill = crop.chill_injury_below_C !== null && this.cfg.design.setpoint.target_C < crop.chill_injury_below_C;
    const over = r.load_pulldown_kW > this.wi.Qmax_kW;
    const box = (t, v, sub = '', cls = '') => `<div class="out ${cls}"><span>${t}</span><b>${v}</b><small>${sub}</small></div>`;
    $('wiOut').innerHTML =
      box('Total heat load (with new batch)', fmt(r.load_pulldown_kW, 'kW'), over ? `more than the ${this.wi.Qmax_kW} kW compressor – the wax covers the gap` : `holding load ${fmt(r.load_holding_kW, 'kW')}`, over ? 'warn' : '') +
      box('…of which door', fmt(r.door_kW, 'kW'), `latent (moisture) ${fmt(r.door_latent_kW, 'kW')}`) +
      box('Compressor electricity', fmt(r.comp_kW, 'kW'), `COP ${r.cop.toFixed(2)} (T_cond = ${T + 10} °C)`) +
      box('Wax battery after a 12 h night', `${r.pcm_after_night_pct.toFixed(0)} %`, `started full: ${r.pcm_kWh.toFixed(1)} kWh of cold`, r.pcm_after_night_pct < 15 ? 'bad' : '') +
      box('Backup time (no sun, no grid)', `${r.backup_h.toFixed(1)} h`, `room stays near ${r.T_room_night_C.toFixed(1)} °C on wax only`, r.T_room_night_C > 8 ? 'bad' : '') +
      box(`Solar covers the day (${$('wCloud').checked ? 'cloudy' : 'sunny'})`, `${r.solar_cover_pct.toFixed(0)} %`, `${r.solar_day_kWh.toFixed(1)} kWh solar vs ${r.need_day_kWh.toFixed(1)} kWh needed`, r.solar_cover_pct < 100 ? 'warn' : '') +
      box(`Shelf life – ${crop.label}`, `${sl5.toFixed(0)} days`, `at 5 °C; ${slN.toFixed(0)} days if the room sits at ${r.T_room_night_C.toFixed(1)} °C` + (chill ? ' · ⚠ 5 °C is below this crop’s chilling limit' : ''), chill ? 'warn' : '');
  }

  // ---------------------------------------------------------------- two rooms
  roomsHTML() {
    return `<p class="lead">The <b>same room, same 2026 weather, same 150 kg loading</b> – left with PLAIN wax panels,
      right with FINNED wax panels (final design). Plain panels have too little surface: at night the wax cannot take the room's heat fast enough
      and the grid must help. The fins multiply the surface by 4.3 – no fan, no battery for cooling, nothing that moves.</p>
      <div class="rooms"><div class="room" id="rmN"></div><div class="room smart" id="rmS"></div></div><div id="rmY"></div>
      <div class="figs one"><figure><a href="figures/final_00_design_journey.png" target="_blank"><img loading="lazy" src="figures/final_00_design_journey.png"
        alt="Design journey: plain panels, baffle + fans, fins"></a><figcaption>Design journey: plain → baffle + fans → fins</figcaption></figure>
        <figure><a href="figures/final_02_fin_calculation.png" target="_blank"><img loading="lazy" src="figures/final_02_fin_calculation.png"
        alt="Fin calculation: depth, gap, UA"></a><figcaption>Fin calculation: depth, gap, UA</figcaption></figure></div>`;
  }
  roomCard(title, r, how) {
    const pc = Math.max(0, Math.min(100, r.pcm_pct));
    return `<h3>${title}</h3><div class="rbig">${r.T_room.toFixed(1)} °C</div>
      <div class="tank"><i style="height:${pc}%"></i><span>${pc.toFixed(0)} %<br>wax</span></div>
      <div class="kv2"><span>Power now</span><b class="${r.grid_on ? 'g' : 's'}">${r.grid_on ? 'GRID (ATS)' : 'solar / wax'}</b>
      <span>Grid hours so far in 2026</span><b>${r.grid_h_so_far.toFixed(0)} h</b></div><p class="small">${how}</p>`;
  }

  // ---------------------------------------------------------------- year results
  yearHTML() {
    const fig = ([f, t]) => { const u = `figures/${f.includes('.') ? f : f + '.png'}`; return `<figure><a href="${u}" target="_blank"><img loading="lazy" src="${u}" alt="${t}"></a><figcaption>${t}</figcaption></figure>`; };
    return `<p class="lead"><b>Final design on real 2026 weather</b> (simulated, conservative sun). Click a graph to enlarge.</p>
      <div class="figs">${FINAL.map(fig).join('')}</div>
      <p class="lead">How we chose the size (NASA POWER 2025 study, Phase 2):</p><div class="figs">
      ${FIGS.map(([f, t]) => `<figure><a href="figures/${f}.png" target="_blank"><img loading="lazy" src="figures/${f}.png" alt="${t}"></a><figcaption>${t}</figcaption></figure>`).join('')}</div>`;
  }

  // ---------------------------------------------------------------- sensors
  sensorsHTML() {
    return `<p class="lead">Every sensor: type, range, accuracy, location and protocol. Tag M = measured, C = calculated from a formula.</p>
      <table class="calc sens"><tr class="grp"><td>Sensor</td><td>Type</td><td>Range</td><td>Accuracy</td><td>Location</td><td>Protocol</td><td class="num">Now</td></tr>
      ${this.sensors.sensors.map(s => `<tr><td>${s.name} ${tagChip(s.tag)}</td><td>${s.type}</td><td>${s.range}</td><td>${s.accuracy}</td><td>${s.location}</td><td>${s.protocol}</td><td class="num" data-q="${s.quantity}" data-u="${s.unit}"></td></tr>`).join('')}</table>`;
  }

  live(s) {
    if (this.tab === 'how') splitUpdate(s.values, this.cfg);
    if (this.tab === 'calc' && $('bySource')) $('bySource').innerHTML = this.bySource(s);
    if (this.tab === 'rooms' && $('rmN')) {
      const c = s.compare;
      $('rmN').innerHTML = this.roomCard('Plain wax panels', c.normal, 'Flat panel face, natural convection only.');
      $('rmS').innerHTML = this.roomCard('Finned wax panels (final design)', c.smart, '40 mm aluminium fins, 23 mm gap: cooled air falls between the fins by itself.');
      $('rmY').innerHTML = `<div class="kv2 wide"><span>Whole year: grid backup hours</span><b>${c.year.normal_grid_h.toFixed(0)} h → ${c.year.smart_grid_h.toFixed(0)} h</b>
        <span>Days fully on solar + wax</span><b>${c.year.normal_days_pct.toFixed(1)} % → ${c.year.smart_days_pct.toFixed(1)} %</b></div>
        <p class="small">${s.clock} · ${s.label}. Final design: 115 kg wax with fins, 1.8 kWp, 150 kg produce loaded at 6 am.</p>`;
    }
    if (this.tab === 'sensors') document.querySelectorAll('#ccBody td[data-q]').forEach(td => {
      const v = s.values[td.dataset.q];
      td.textContent = v === null || v === undefined ? '—' : typeof v === 'boolean' ? (v ? 'YES' : 'no') : fmt(v, td.dataset.u);
    });
  }
}
