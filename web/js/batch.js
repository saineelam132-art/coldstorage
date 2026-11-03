// Farmer batch: form -> worker walks in -> crate placed -> batch card with QR -> sealed in the ledger.
import { getJSON, postJSON } from './api.js';
import { lineChart } from './charts.js';

const $ = id => document.getElementById(id);

const WORKER_SVG = `<svg viewBox="0 0 60 120" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="30" cy="116" rx="18" ry="3.5" fill="rgba(0,0,0,.25)"/>
  <circle cx="30" cy="14" r="9" fill="#6b4a32"/><path d="M21 12 q9 -10 18 0" fill="#222"/>
  <path d="M19 28 q11 -6 22 0 l3 42 h-28z" fill="#e9e2d2" stroke="#b9ae98"/>
  <path d="M21 70 l-2 42 h9 l3 -36 l3 36 h9 l-2 -42z" fill="#3b3f46"/>
  <rect x="9" y="40" width="42" height="22" rx="2" fill="#4f8f47" stroke="#2f5f2a"/>
  <path d="M11 44 h38 M11 50 h38 M11 56 h38" stroke="#2f5f2a" stroke-width="1.2"/>
  <ellipse cx="30" cy="40" rx="18" ry="5" fill="#3f9a3a"/>
</svg>`;

// Where a new crate of each crop appears in the inside picture (A8), in % of the picture
const SPOT = { leafy_greens: [15, 55.2], grapes: [85.8, 57.5], milk: [30, 71.6], vaccines: [80, 40], default: [22, 84] };

export class Batches {
  constructor({ cfg, manifest, photo, getModel, clock, feed, ledgerUI }) {
    Object.assign(this, { cfg, manifest, photo, getModel, clock, feed, ledgerUI });
    const sel = $('cropSel');
    Object.entries(cfg.crops).forEach(([k, c]) => sel.insertAdjacentHTML('beforeend', `<option value="${k}">${c.label} (best ${c.T_opt[0]}–${c.T_opt[1]} °C)</option>`));
    sel.value = 'pomegranate';
    $('newBatchBtn').onclick = () => $('batchModal').classList.add('on');
    $('batchCancel').onclick = () => $('batchModal').classList.remove('on');
    $('batchForm').onsubmit = e => { e.preventDefault(); this.create(new FormData(e.target)); };
    $('cardModal').onclick = e => { if (e.target.id === 'cardModal') $('cardModal').classList.remove('on'); };
    document.addEventListener('openbatch', e => this.showCard(e.detail));
    const w = Object.entries(manifest.B || {}).find(([k]) => /worker/i.test(k));
    this.workerHTML = w ? `<img src="${w[1].src}" alt="worker">` : WORKER_SVG;     // B cut-out when available
  }

  buyerURL(id) {
    const h = location.hostname;
    const host = (h === 'localhost' || h === '127.0.0.1') ? `${this.cfg.lan_ip}:${location.port || 8000}` : location.host;
    return `http://${host}/buyer.html?b=${encodeURIComponent(id)}`;
  }

  async create(form) {
    $('batchModal').classList.remove('on');
    const data = Object.fromEntries(form.entries());
    data.t = this.clock.t;
    const b = await postJSON('api/batch', data);
    this.feed.poll();
    const view = document.body.classList.contains('model') ? 'model' : 'photo';
    if (view === 'model') await this.getModel()?.walkIn(b.id);
    else await this.walkPhoto(b);
    this.showCard(b.id, true);
    this.ledgerUI.open(`New batch ${b.id} is in the room. It will be sealed in the next hourly block (watch a new block appear on the right).`);
  }

  // Photo story: worker walks to the door (A2) -> door opens (A6) -> crate on the rack (A8)
  async walkPhoto(b) {
    const P = this.photo, wait = ms => new Promise(r => setTimeout(r, ms));
    P.goByName('A2_front');
    await wait(1500);
    const el = P.layers.A2_front;
    const r = el.getBoundingClientRect();
    const W = $('walker'); W.innerHTML = this.workerHTML; W.classList.add('on');
    const h = r.height * 0.44, w = h * 0.5;
    W.style.width = `${w}px`; W.style.height = `${h}px`;
    const x0 = r.left + r.width * 0.12, x1 = r.left + r.width * 0.47, yFeet = r.top + r.height * 0.86;
    const t0 = performance.now(), dur = 2600;
    await new Promise(res => {
      const step = now => {
        const k = Math.min(1, (now - t0) / dur);
        const x = x0 + (x1 - x0) * k, bob = Math.abs(Math.sin(k * Math.PI * 7)) * h * 0.025;
        W.style.left = `${x - w / 2}px`; W.style.top = `${yFeet - h - bob}px`;
        W.style.opacity = k > 0.85 ? (1 - k) / 0.15 : 1;
        k < 1 ? requestAnimationFrame(step) : res();
      };
      requestAnimationFrame(step);
    });
    W.classList.remove('on');
    P.goByName('A6_door_worker');
    await wait(3500);
    P.goByName('A8_interior_wide');
    P.addBatchSpot(b.id, SPOT[b.crop] || SPOT.default);
    await wait(1600);
  }

  async showCard(id, fresh = false) {
    const d = await getJSON(`api/batch/${encodeURIComponent(id)}?t=${this.clock.t.toFixed(0)}`);
    const b = d.batch, a = d.assess, url = this.buyerURL(id);
    const sc = a.freshness_score, col = sc > 70 ? '#22c55e' : sc > 40 ? '#f59e0b' : '#ef4444';
    $('cardBody').innerHTML = `
      <div class="bc"><div>
        <div class="note">${fresh ? 'New batch created' : 'Batch card'}</div>
        <div class="id">${b.id}</div>
        <div class="kv" style="display:grid;grid-template-columns:1fr auto;gap:4px 10px;margin-top:8px;font-size:14px">
          <span>Farmer</span><b>${b.farmer}</b><span>Crop</span><b>${b.crop_label}</b>
          <span>Weight</span><b>${b.weight_kg} kg</b><span>Entered (sim. time)</span><b>${b.entry_time}</b>
          <span>Remaining shelf life</span><b>${a.remaining_days_at_ref.toFixed(1)} days at ${d.crop.T_ref_C} °C</b>
          <span>Freshness</span><b style="color:${col}">${sc.toFixed(0)} / 100</b>
          <span>Ledger blocks for this batch</span><b>${d.blocks.length}</b>
          <span>Record</span><b style="color:${d.chain_valid ? '#15803d' : '#b91c1c'}">${d.chain_valid ? 'verified ✓' : 'changed ✗'}</b></div>
        ${a.warnings.map(w => `<div class="warnbox">⚠ ${w}</div>`).join('')}
        <canvas id="cardHist" style="width:100%;height:100px"></canvas>
      </div><div>
        <div id="qr"></div><div class="url">${url}</div>
        <div class="note">Buyers scan this on a phone connected to the laptop's Wi-Fi hotspot.</div>
        <a href="buyer.html?b=${encodeURIComponent(id)}" target="_blank">Open buyer page ▸</a>
      </div></div>
      <div class="row"><button class="ghost" onclick="document.getElementById('cardModal').classList.remove('on')">Close</button></div>`;
    const qr = qrcode(0, 'M'); qr.addData(url); qr.make();          // offline QR (vendor/qrcode)
    $('qr').innerHTML = qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
    $('cardModal').classList.add('on');
    lineChart($('cardHist'), { x: ['entry', 'now'], series: [{ y: d.history_T, color: '#2a78d6', label: 'room T since entry' }], unit: '°C', band: [2, 8] });
  }
}
