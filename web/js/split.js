// "How it works": animated refrigerant flow, built in code (SVG). The compressor first meets the room
// load (Q_air, branch A -> air evaporator); any spare SOLAR cooling goes to the wax (Q_ch, branch B ->
// coil in the wax panels). Same split as the twin (twin/live_sim.py). Dot speed and pipe width follow
// the twin's numbers for this moment; at night branch B stops and the wax gives cold to the room air.
import { tagChip } from './ui.js';

const COPPER = '#c27a3a', LIQ = '#2a78d6', VAP = '#8fb8de';

function valve(x, y, id, label) {
  return `<g id="${id}" class="eev" transform="translate(${x},${y})">
    <path d="M-14 -10 L14 10 L14 -10 L-14 10 Z" fill="#e8eef3" stroke="#41566b" stroke-width="2"/>
    <rect x="-7" y="-30" width="14" height="16" rx="3" fill="#41566b"/><line x1="0" y1="-14" x2="0" y2="-3" stroke="#41566b" stroke-width="3"/>
    <text x="0" y="-36" text-anchor="middle" class="lbl b">${label}</text></g>`;
}

export function splitHTML(img) {
  return `<p class="lead">How the solar cold reaches the room <b>and</b> the wax: one R290 compressor, one liquid line, split into two
    branches with their own electronic expansion valve (EEV). Live numbers from the digital twin ${tagChip('S')}.</p>
  <div class="splitwrap"><svg id="splitSvg" viewBox="0 0 780 380" role="img" aria-label="Refrigerant flow: compressor, condenser, split point, two expansion valves, air evaporator and wax coil">
    <defs><marker id="sar" markerWidth="9" markerHeight="9" refX="5" refY="4.5" orient="auto"><path d="M0 0 L9 4.5 L0 9z" fill="#0e7490"/></marker></defs>
    <!-- equipment -->
    <rect x="40" y="30" width="170" height="62" rx="8" class="box cond"/><text x="125" y="56" class="lbl b" text-anchor="middle">Condenser (outside)</text>
    <text x="125" y="76" class="lbl" text-anchor="middle">heat out to the air</text>
    <circle cx="125" cy="300" r="40" class="box comp"/><text x="125" y="296" class="lbl b" text-anchor="middle">Compressor</text>
    <text x="125" y="314" class="lbl" text-anchor="middle">R290, DC inverter</text>
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
      <path id="fA" d="M330 61 H520" class="liq"/>
      <path id="fB" d="M330 61 V209 H520" class="liq"/>
      <path id="fSuc" d="M720 69 H750 V330 H165" class="vap"/>
      <path id="fSucB" d="M720 209 H750" class="vap"/>
    </g>
    <circle cx="330" cy="61" r="7" fill="${COPPER}" stroke="#7a4a1f" stroke-width="2"/>
    <text x="330" y="22" class="lbl b" text-anchor="middle">split point</text><text x="330" y="38" class="lbl" text-anchor="middle">(liquid line)</text>
    ${valve(430, 61, 'eevA', 'EEV-A')}${valve(430, 209, 'eevB', 'EEV-B')}
    <text x="460" y="128" class="lbl" text-anchor="middle">branch A: room</text>
    <text x="430" y="262" class="lbl" text-anchor="middle">branch B: wax</text>
    <text x="760" y="200" class="lbl" text-anchor="end" transform="rotate(-90 760 200)">suction line</text>
    <!-- night: wax gives cold to the room through the fins -->
    <g id="waxNight" class="night">
      <path d="M560 250 V282" stroke="#0e7490" stroke-width="3" marker-end="url(#sar)"/><path d="M620 250 V282" stroke="#0e7490" stroke-width="3" marker-end="url(#sar)"/><path d="M680 250 V282" stroke="#0e7490" stroke-width="3" marker-end="url(#sar)"/>
      <text x="620" y="300" class="lbl b nightt" text-anchor="middle">wax → room air through the fins, no fan</text>
      <text x="620" y="316" class="lbl nightt" text-anchor="middle" id="waxNightW"></text>
    </g>
    <text x="430" y="365" class="lbl stopnote" id="stopNote" text-anchor="middle"></text>
  </svg>
  ${img ? `<figure class="splitimg"><img src="${img}" alt="Copper Y-split in the liquid line with two electronic expansion valves"><figcaption>The split: a copper Y in the liquid line, then one EEV per branch</figcaption></figure>` : ''}</div>
  <div class="splitnums" id="splitNums"></div>
  <p class="note">The controller opens <b>EEV-B</b> only when there is spare solar after the room is cold enough. The split happens in the
  <b>liquid line, before expansion</b>, so each branch gets an even flow; each EEV then sets its own branch's flow and superheat.
  Both branches join again in the suction line back to the compressor.</p>`;
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
  setFlow(svg.querySelector('#fA'), qa, max); setFlow(svg.querySelector('#fB'), qb, max);
  setFlow(svg.querySelector('#fLiq'), q, max); setFlow(svg.querySelector('#fDis'), q, max);
  setFlow(svg.querySelector('#fSuc'), q, max); setFlow(svg.querySelector('#fSucB'), qb, max);
  svg.querySelector('#eevA').classList.toggle('shut', qa <= 0.005);
  svg.querySelector('#eevB').classList.toggle('shut', qb <= 0.005);
  svg.querySelector('#pB').classList.toggle('idle', qb <= 0.005);
  const waxToRoom = Math.max(0, v.Q_pcm_room || 0);
  const night = qb <= 0.005 && waxToRoom > 0.002;
  svg.querySelector('#waxNight').style.display = night ? '' : 'none';
  svg.querySelector('#waxNightW').textContent = night ? `${(waxToRoom * 1000).toFixed(0)} W of cold from the wax now` : '';
  svg.querySelector('#stopNote').textContent = q <= 0.005
    ? (v.poa > 20 ? 'Compressor off: room cold enough and wax full' : 'Compressor off (no sun): branch B stopped – the wax cools the room')
    : (qb <= 0.005 ? 'All the cooling goes to the room now (no spare solar for the wax)' : '');
  document.getElementById('splitNums').innerHTML =
    `<span>Room: <b>${(qa * 1000).toFixed(0)} W</b></span><span>Wax charging: <b>${(qb * 1000).toFixed(0)} W</b></span>
     <span>Solar used: <b>${((v.P_solar_used || 0) * 1000).toFixed(0)} W</b> (electric)</span>
     <span>Wax → room: <b>${(waxToRoom * 1000).toFixed(0)} W</b></span>
     <span>Power from: <b>${v.grid_on ? 'GRID' : (v.P_solar_used > 0 ? 'SOLAR' : 'WAX')}</b></span>`;
}
