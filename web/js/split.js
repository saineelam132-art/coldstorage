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

export function splitHTML(photo) {
  return `<p class="lead">One R290 inverter compressor. The liquid line splits in two; each branch has an on/off
    <b>solenoid valve (SV)</b> and a <b>TXV</b>. Live from the digital twin ${tagChip('S')}.</p>
  <div class="splitwrap"><svg id="splitSvg" viewBox="0 0 780 424" role="img" aria-label="Refrigerant flow: compressor, condenser, split point in the liquid line, solenoid valve and TXV on each branch, air evaporator and wax coil, both joining in the suction line">
    <defs><marker id="sar" markerWidth="9" markerHeight="9" refX="5" refY="4.5" orient="auto"><path d="M0 0 L9 4.5 L0 9z" fill="#0e7490"/></marker></defs>
    <!-- equipment -->
    <clipPath id="cpCond"><rect x="44" y="34" width="78" height="54" rx="5"/></clipPath>
    <clipPath id="cpComp"><circle cx="125" cy="300" r="46"/></clipPath>
    <rect x="40" y="30" width="170" height="62" rx="8" class="box cond"/>
    ${photo ? `<g clip-path="url(#cpCond)"><svg x="44" y="34" width="78" height="54" viewBox="290 120 380 230" preserveAspectRatio="xMidYMid slice"><image href="${photo}" width="730" height="960"/></svg></g>` : ''}
    <text x="166" y="58" class="lbl b" text-anchor="middle">Condenser</text><text x="166" y="76" class="lbl" text-anchor="middle">outside</text>
    <circle cx="125" cy="300" r="46" class="box comp"/>
    ${photo ? `<g clip-path="url(#cpComp)"><svg x="79" y="254" width="92" height="92" viewBox="300 360 380 300" preserveAspectRatio="xMidYMid slice"><image href="${photo}" width="730" height="960"/></svg></g>
      <circle cx="125" cy="300" r="46" fill="none" stroke="#41566b" stroke-width="2.5"/>` : ''}
    <text x="125" y="364" class="lbl b" text-anchor="middle">Compressor</text>
    <text x="125" y="380" class="lbl" text-anchor="middle">inverter: sets total cooling</text>
    <rect x="520" y="34" width="200" height="70" rx="8" class="box cold"/><text x="620" y="62" class="lbl b" text-anchor="middle">Air evaporator</text>
    <text x="620" y="82" class="lbl" text-anchor="middle">cools the room air</text>
    <rect x="520" y="170" width="200" height="78" rx="8" class="box wax"/>
    <g class="fins">${Array.from({ length: 14 }, (_, i) => `<line x1="${530 + i * 13.5}" y1="176" x2="${530 + i * 13.5}" y2="242"/>`).join('')}</g>
    <g>${Array.from({ length: 7 }, (_, i) => `<circle cx="${538 + i * 27}" cy="235" r="4.5" fill="#c27a3a" stroke="#7a4a1f"/>`).join('')}</g>
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
    <path d="M465 41 V16 H736 V57" class="capil" fill="none"/>${bulb(736, 69)}
    <path d="M465 189 V150 H736 V197" class="capil" fill="none"/>${bulb(736, 209)}
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
    <text x="480" y="414" class="lbl stopnote" id="stopNote" text-anchor="middle"></text>
  </svg>
  </div>
  <div class="splitnums" id="splitNums"></div>
  ${photo ? '<p class="note">Compressor and condenser: example photo (AnyNameWillExpire, CC BY-SA 4.0). Wax box: our design drawing.</p>' : ''}
  <div id="valveWhy"></div>`;
}

// "Why this valve?" + the 2026 comparison, both read from results/live/valves_2026.json (twin/valves_2026.py)
export function valveWhyHTML(V) {
  if (!V) return '';
  const c = V.cost, k = x => `₹${Math.round(x / 1000)}k`, row = key => V.rows.find(r => r.key === key) || {};
  const n = (x, d = 0) => (x === null || x === undefined ? '–' : Number(x).toFixed(d));
  const lines = [['Cost, 2 branches (estimate)', `${k(c.eev.lo)}–${k(c.eev.hi)}`, `${k(c.sv_txv.lo)}–${k(c.sv_txv.hi)}`],
    ['Days on solar + wax (2026)', n(row('days_full_solar_wax').eev), n(row('days_full_solar_wax').sv_txv)],
    ['Grid hours (2026)', n(row('grid_h').eev), n(row('grid_h').sv_txv)],
    ['Wax frozen at sunset', `${n(row('wax_sunset_avg').eev, 1)} %`, `${n(row('wax_sunset_avg').sv_txv, 1)} %`]];
  return `<table class="calc valvetbl"><tr><th>Valve choice</th><th class="num">2 EEVs</th><th class="num">Solenoid + TXV ✔</th></tr>
    ${lines.map(([a, b, d]) => `<tr><td>${a}</td><td class="num">${b}</td><td class="num"><b>${d}</b></td></tr>`).join('')}</table>
  <p class="note">Chosen: solenoid + TXV – cheaper, proven, and the inverter compressor already sets the total cooling. Costs: estimate – quotation pending.</p>`;
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
