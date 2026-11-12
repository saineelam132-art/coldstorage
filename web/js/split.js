// "How it works": animated refrigerant flow, built in code (SVG). The compressor first meets the room
// load (Q_air, branch A: SV-A + TXV-A -> air evaporator); spare SOLAR cooling goes to the wax (Q_ch,
// branch B: SV-B + TXV-B -> coil in the wax panels). The solenoids are ON/OFF only. Same split as the twin (twin/live_sim.py). Dot speed and pipe width follow
// the twin's numbers for this moment; at night branch B stops and the wax gives cold to the room air.
import { tagChip } from './ui.js';

const COPPER = '#c27a3a', LIQ = '#2a78d6', VAP = '#8fb8de';

// liquid-line solenoid valve: valve body + square coil on top (ON/OFF only)
function solenoid(x, y, id, label) {
  return `<g id="${id}" class="valve sv" transform="translate(${x},${y})">
    <path d="M-12 -9 L12 9 L12 -9 L-12 9 Z" fill="#e8eef3" stroke="#41566b" stroke-width="2"/>
    <line x1="0" y1="-9" x2="0" y2="-14" stroke="#41566b" stroke-width="3"/>
    <rect x="-9" y="-31" width="18" height="17" rx="2" class="coil"/><text x="0" y="-18.5" text-anchor="middle" class="coilt">S</text>
    <text x="0" y="27" text-anchor="middle" class="lbl b">${label}</text><text x="0" y="41" text-anchor="middle" class="lbl svst" id="${id}St">OFF</text></g>`;
}
// thermostatic expansion valve: valve body + diaphragm head; the capillary + bulb are drawn separately
function txv(x, y, id, label) {
  return `<g id="${id}" class="valve txv" transform="translate(${x},${y})">
    <path d="M-12 -9 L12 9 L12 -9 L-12 9 Z" fill="#e8eef3" stroke="#41566b" stroke-width="2"/>
    <line x1="0" y1="-9" x2="0" y2="-14" stroke="#41566b" stroke-width="3"/>
    <path d="M-11 -14 A11 9 0 0 1 11 -14 Z" fill="#cbd5e1" stroke="#41566b" stroke-width="2"/>
    <text x="0" y="27" text-anchor="middle" class="lbl b">${label}</text></g>`;
}
const bulb = (x, y) => `<rect x="${x - 6}" y="${y - 12}" width="12" height="10" rx="3" class="bulb"/>`;

export function splitHTML(photos) {
  return `<p class="lead">How the solar cold reaches the room <b>and</b> the wax: one R290 inverter compressor, one liquid line, split into two
    branches. Each branch has a <b>liquid-line solenoid valve</b> (SV, on/off) and a <b>thermostatic expansion valve</b> (TXV).
    Live numbers from the digital twin ${tagChip('S')}.</p>
  <div class="splitwrap"><svg id="splitSvg" viewBox="0 0 780 390" role="img" aria-label="Refrigerant flow: compressor, condenser, split point in the liquid line, solenoid valve and TXV on each branch, air evaporator and wax coil, both joining in the suction line">
    <defs><marker id="sar" markerWidth="9" markerHeight="9" refX="5" refY="4.5" orient="auto"><path d="M0 0 L9 4.5 L0 9z" fill="#0e7490"/></marker></defs>
    <!-- equipment -->
    <rect x="40" y="30" width="170" height="62" rx="8" class="box cond"/><text x="125" y="56" class="lbl b" text-anchor="middle">Condenser (outside)</text>
    <text x="125" y="76" class="lbl" text-anchor="middle">heat out to the air</text>
    <circle cx="125" cy="300" r="40" class="box comp"/><text x="125" y="296" class="lbl b" text-anchor="middle">Compressor</text>
    <text x="125" y="314" class="lbl" text-anchor="middle">R290, DC inverter</text>
    <text x="125" y="358" class="lbl" text-anchor="middle">sets the TOTAL cooling</text>
    <rect x="520" y="34" width="200" height="70" rx="8" class="box cold"/><text x="620" y="62" class="lbl b" text-anchor="middle">Air evaporator</text>
    <text x="620" y="82" class="lbl" text-anchor="middle">cools the room air</text>
    <rect x="520" y="170" width="200" height="78" rx="8" class="box wax"/>
    <g class="fins">${Array.from({ length: 14 }, (_, i) => `<line x1="${530 + i * 13.5}" y1="176" x2="${530 + i * 13.5}" y2="242"/>`).join('')}</g>
    <text x="620" y="198" class="lbl b" text-anchor="middle">Coil inside the wax panels</text>
    <text x="620" y="218" class="lbl" text-anchor="middle">freezes the wax (cold battery)</text>
    <!-- pipes: base copper + moving dots on top -->
    <g class="pipes">
      <path id="pDis" d="M125 260 V92"/>
      <path id="pLiq" d="M210 61 H330"/>
      <path id="pA" d="M330 61 H520"/>
      <path id="pB" d="M330 61 V209 H520"/>
      <path id="pSucA" d="M720 69 H750 V330 H165"/>
      <path id="pSucB" d="M720 209 H750"/>
    </g>
    <g class="flow">
      <path id="fDis" d="M125 260 V92" class="vap"/>
      <path id="fLiq" d="M210 61 H330" class="liq"/>
      <path id="fA1" d="M330 61 H465" class="liq"/><path id="fA2" d="M465 61 H520" class="mix"/>
      <path id="fB1" d="M330 61 V209 H465" class="liq"/><path id="fB2" d="M465 209 H520" class="mix"/>
      <path id="fSuc" d="M720 69 H750 V330 H165" class="vap"/>
      <path id="fSucB" d="M720 209 H750" class="vap"/>
    </g>
    <!-- TXV sensing bulbs on each coil outlet + capillaries -->
    <path d="M465 41 V16 H736 V57" class="capil"/>${bulb(736, 69)}
    <path d="M465 189 V150 H736 V197" class="capil"/>${bulb(736, 209)}
    <text x="600" y="12" class="lbl sm" text-anchor="middle">TXV bulb: keeps the gas leaving the coil ≈ 5 K superheated</text>
    <circle cx="330" cy="61" r="7" fill="${COPPER}" stroke="#7a4a1f" stroke-width="2"/>
    <text x="322" y="46" class="lbl b" text-anchor="end">split point</text><text x="322" y="84" class="lbl" text-anchor="end">100 % liquid</text>
    ${solenoid(385, 61, 'svA', 'SV-A')}${txv(465, 61, 'txvA', 'TXV-A')}
    ${solenoid(385, 209, 'svB', 'SV-B')}${txv(465, 209, 'txvB', 'TXV-B')}
    <text x="430" y="128" class="lbl" text-anchor="middle">branch A: room</text>
    <text x="430" y="270" class="lbl" text-anchor="middle">branch B: wax</text>
    <text x="430" y="144" class="lbl sm" text-anchor="middle">(liquid → SV → TXV → liquid + vapour mixture)</text>
    <text x="760" y="200" class="lbl" text-anchor="end" transform="rotate(-90 760 200)">suction line (both join)</text>
    <!-- night: wax gives cold to the room through the fins -->
    <g id="waxNight" class="night">
      <path d="M560 250 V282" stroke="#0e7490" stroke-width="3" marker-end="url(#sar)"/><path d="M620 250 V282" stroke="#0e7490" stroke-width="3" marker-end="url(#sar)"/><path d="M680 250 V282" stroke="#0e7490" stroke-width="3" marker-end="url(#sar)"/>
      <text x="620" y="300" class="lbl b nightt" text-anchor="middle">wax → room air through the fins, no fan</text>
      <text x="620" y="316" class="lbl nightt" text-anchor="middle" id="waxNightW"></text>
    </g>
    <text x="440" y="378" class="lbl stopnote" id="stopNote" text-anchor="middle"></text>
  </svg>
  ${photos || ''}</div>
  <div class="splitnums" id="splitNums"></div>
  <p class="note"><b>Why split before the valves?</b> The split is in the liquid line, where the refrigerant is 100 % liquid, so it divides evenly.
  After an expansion valve it becomes a mixture (about 39 % vapour by mass, ~97 % by volume at −5 °C), which splits unevenly.
  Each solenoid only switches its branch on or off; each TXV drops the pressure and keeps the gas leaving its coil about 5 K superheated
  so no liquid reaches the compressor. The inverter compressor sets the total cooling. Both branches join again in the suction line.</p>
  <p class="note"><b>Control (every 5 minutes):</b> SV-A opens when the room needs cold. SV-B opens <b>only</b> when there is spare solar
  after the room is satisfied and the wax is not yet full. Night: both shut, the compressor is off, the wax cools the room through the fins.
  Safety: the compressor never runs with both valves shut; each solenoid stays open at least 3 minutes once opened.</p>
  <div id="valveWhy"></div>`;
}

// "Why this valve?" + the 2026 comparison, both read from results/live/valves_2026.json (twin/valves_2026.py)
export function valveWhyHTML(V) {
  if (!V) return '';
  const inr = x => `₹${Math.round(x / 1000)}k`;
  const c = V.cost, f = (x, u) => (x === null || x === undefined ? '–' : `${Number(x).toLocaleString('en-IN', { maximumFractionDigits: u === '%' || Math.abs(x) < 100 ? 1 : 0 })}${u === '%' ? ' %' : ''}`);
  const sign = x => (x > 0 ? '+' : '') + (Math.abs(x) < 10 ? Number(x).toFixed(1) : f(x));
  const row = k => V.rows.find(r => r.key === k) || {};
  const better = (row('days_full_solar_wax').change || 0) >= 0 && (row('grid_h').change || 0) <= 0;
  return `<div class="valvewhy"><h3>Why this valve? ${tagChip('E')}</h3>
    <table class="calc"><tr><th>Option (for 2 branches)</th><th class="num">Cost</th></tr>
      <tr><td>${c.eev.label}</td><td class="num">${inr(c.eev.lo)}–${inr(c.eev.hi)} <small>(${c.note})</small></td></tr>
      <tr class="chosen"><td>${c.sv_txv.label}</td><td class="num">${inr(c.sv_txv.lo)}–${inr(c.sv_txv.hi)} <small>(${c.note})</small></td></tr></table>
    <p><b>${c.chosen}</b></p></div>
  <div class="valvewhy"><h3>2026 twin: EEV vs solenoid + TXV ${tagChip('S')} <span class="vhint">${V.days} days, ${V.first} → ${V.last}, same weather</span></h3>
    <table class="calc"><tr><th></th><th class="num">2 EEVs (old)</th><th class="num">SV + TXV (chosen)</th><th class="num">change</th></tr>
    ${V.rows.map(r => `<tr><td>${r.label}</td><td class="num">${f(r.eev, r.unit)} ${r.unit === '%' ? '' : r.unit}</td><td class="num"><b>${f(r.sv_txv, r.unit)} ${r.unit === '%' ? '' : r.unit}</b></td><td class="num">${sign(r.change)}</td></tr>`).join('')}</table>
    <p class="note">SV-B was open ${f(V.sv_txv_extra.sv_b_on_h)} h in total and switched on about ${f(V.sv_txv_extra.sv_b_switch_ons_per_day)} times a day;
      the compressor never ran with both valves shut (${f(V.sv_txv_extra.both_shut_while_running_steps)} steps).
      Assumptions ${tagChip('E')}: SV-B opens only for at least ${V.assumptions.txv_min_load_kW_E * 1000} W of spare cooling (a small TXV hunts below that);
      ${Math.round(V.assumptions.txv_superheat_coil_frac_E * 100)} % of the wax coil is used to superheat the gas; minimum ON ${V.assumptions.min_on_min} min.
      ${better ? `Why a little better: when the spare sun is small, the 3-minute minimum run cools the room a little below set point instead of
      trickling cold into the wax; that cold is used in the evening.` : 'On/off control costs a little against fully modulating EEVs.'}
      The difference is small – within what the model can tell apart.</p></div>`;
}

// speed: seconds per dash cycle (smaller = faster); width proportional to the heat flow
function setFlow(el, kW, maxKW) {
  if (!el) return;
  const on = kW > 0.005;
  const k = Math.min(1, kW / maxKW);
  el.style.strokeWidth = on ? (3 + 9 * k).toFixed(1) : 0;
  el.style.animationDuration = `${(1.6 - 1.2 * k).toFixed(2)}s`;
  el.style.opacity = on ? 1 : 0;
}

export function splitUpdate(v, cfg) {
  const svg = document.getElementById('splitSvg');
  if (!svg) return;
  const qa = Math.max(0, v.Q_coil_air || 0), qb = Math.max(0, v.Q_coil_pcm || 0), q = qa + qb;
  const max = cfg.design.refrigeration.design_capacity_kW || 1.5;
  setFlow(svg.querySelector('#fA1'), qa, max); setFlow(svg.querySelector('#fA2'), qa, max);
  setFlow(svg.querySelector('#fB1'), qb, max); setFlow(svg.querySelector('#fB2'), qb, max);
  setFlow(svg.querySelector('#fLiq'), q, max); setFlow(svg.querySelector('#fDis'), q, max);
  setFlow(svg.querySelector('#fSuc'), q, max); setFlow(svg.querySelector('#fSucB'), qb, max);
  const onA = qa > 0.005, onB = qb > 0.005;
  for (const [id, on] of [['svA', onA], ['svB', onB], ['txvA', onA], ['txvB', onB]]) svg.querySelector('#' + id).classList.toggle('shut', !on);
  svg.querySelector('#svASt').textContent = onA ? 'ON' : 'OFF'; svg.querySelector('#svBSt').textContent = onB ? 'ON' : 'OFF';
  svg.querySelector('#pB').classList.toggle('idle', qb <= 0.005);
  const waxToRoom = Math.max(0, v.Q_pcm_room || 0);
  const night = qb <= 0.005 && waxToRoom > 0.002;
  svg.querySelector('#waxNight').style.display = night ? '' : 'none';
  svg.querySelector('#waxNightW').textContent = night ? `${(waxToRoom * 1000).toFixed(0)} W of cold from the wax now` : '';
  svg.querySelector('#stopNote').textContent = q <= 0.005
    ? (v.poa > 20 ? 'Both valves shut, compressor off: room cold enough and wax full' : 'Night: SV-A and SV-B shut, compressor off – the wax cools the room')
    : (qb <= 0.005 ? 'SV-B shut: all the cooling goes to the room (no spare solar for the wax, or the wax is full)' : '');
  document.getElementById('splitNums').innerHTML =
    `<span><b>SV-A: ${onA ? 'ON' : 'OFF'} · SV-B: ${onB ? 'ON' : 'OFF'}</b></span>
     <span>Room: <b>${(qa * 1000).toFixed(0)} W</b></span><span>Wax charging: <b>${(qb * 1000).toFixed(0)} W</b></span>
     <span>Solar used: <b>${((v.P_solar_used || 0) * 1000).toFixed(0)} W</b> (electric)</span>
     <span>Wax → room: <b>${(waxToRoom * 1000).toFixed(0)} W</b></span>
     <span>Power from: <b>${v.grid_on ? 'GRID' : (v.P_solar_used > 0 ? 'SOLAR' : 'WAX')}</b></span>`;
}
