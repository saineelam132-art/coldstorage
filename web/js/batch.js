// Farmer batch: form -> worker walks in -> crate placed -> batch card with QR -> sealed in the ledger.
import { door } from './door.js';
import { getJSON, postJSON } from './api.js';
import { lineChart } from './charts.js';
import { photoFor } from './photos.js';

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

// The new crate is put down on the floor of the aisle in the inside picture (A8), in % of the picture
const SPOT = [50, 86];

export class Batches {
  constructor({ cfg, manifest, photo, clock, feed, ledgerUI }) {
    Object.assign(this, { cfg, manifest, photo, clock, feed, ledgerUI });
    const sel = $('cropSel');
    Object.entries(cfg.crops).forEach(([k, c]) => sel.insertAdjacentHTML('beforeend', `<option value="${k}">${c.label} (best ${c.T_opt[0]}–${c.T_opt[1]} °C)</option>`));
    sel.value = 'pomegranate';
    // the '+ New batch' button was removed from the top bar (farmers check in on Trust & Trade)
    $('batchCancel').onclick = () => $('batchModal').classList.remove('on');
    $('batchForm').onsubmit = e => { e.preventDefault(); this.create(new FormData(e.target)); };
    $('cardModal').onclick = e => { if (e.target.id === 'cardModal') $('cardModal').classList.remove('on'); };
    document.addEventListener('openbatch', e => this.showCard(e.detail));
    const cut = this.cut = n => (n && manifest.B?.[n]?.src) || null;
    const sc = photo.scenes.cutouts || {};
    this.side = cut(sc.worker_side); this.back = cut(sc.worker_back);           // B5a / B5b cut-outs
    this.cropImg = crop => cut(sc.crops?.[crop]) || cut(sc.crops?.default);
    this.workerHTML = this.side ? `<img src="${this.side}" alt="worker" style="transform:scaleX(-1)">` : WORKER_SVG;
  }

  buyerURL(id) {
    if (location.protocol === 'file:') return `buyer.html?b=${encodeURIComponent(id)}`;   // static backup
    const h = location.hostname;
    const host = (h === 'localhost' || h === '127.0.0.1') ? `${this.cfg.lan_ip}:${location.port || 8000}` : location.host;
    return `http://${host}/buyer.html?b=${encodeURIComponent(id)}`;
  }

  async create(form) {
    $('batchModal').classList.remove('on');
    const data = Object.fromEntries(form.entries());   // FormData or Map
    data.t = this.clock.t;
    const b = await postJSON('api/batch', data);
    this.feed.poll();
    await this.walkPhoto(b);
    this.showCard(b.id, true);
    this.ledgerUI.open(`New batch ${b.id} is in the room. It will be sealed in the next hourly block (watch a new block appear on the right).`);
  }

  // Photo story: worker walks to the door (A2) -> door opens (A6) -> crate on the rack (A8)
  async walkPhoto(b) {
    const P = this.photo, wait = ms => new Promise(r => setTimeout(r, ms));
    const FRONT = 'A2b_front_door_closed_nocurtain';
    P.goByName(FRONT);
    await wait(1500);
    const el = P.layers[FRONT];
    const r = el.getBoundingClientRect();
    const W = $('walker'); W.innerHTML = this.workerHTML; W.classList.add('on');
    const h = r.height * 0.46, w = h * (this.side ? 507 / 900 : 0.5);
    W.style.width = `${w}px`; W.style.height = `${h}px`;
    const x0 = r.left + r.width * 0.10, x1 = r.left + r.width * 0.44, yFeet = r.top + r.height * 0.88;
    const walk = (xa, xb, ms, scaleTo = 1, fade = false) => new Promise(res => {
      const t0 = performance.now();
      const step = now => {
        const k = Math.min(1, (now - t0) / ms);
        const sc = 1 + (scaleTo - 1) * k, x = xa + (xb - xa) * k, bob = Math.abs(Math.sin(k * Math.PI * ms / 380)) * h * 0.018;
        W.style.width = `${w * sc}px`; W.style.height = `${h * sc}px`;
        W.style.left = `${x - w * sc / 2}px`; W.style.top = `${yFeet - h * sc - bob - (1 - sc) * h * 0.35}px`;
        W.style.opacity = fade ? 1 - k : 1;
        k < 1 ? requestAnimationFrame(step) : res();
      };
      requestAnimationFrame(step);
    });
    await walk(x0, x1, 2600);                                        // side view, walking to the door
    if (this.back) W.innerHTML = `<img src="${this.back}" alt="worker from behind">`;   // turns: back view
    const xd = r.left + r.width * 0.515;
    await walk(x1, xd, 600);
    door.open();                                                     // door swings open (0 -> 90 deg, 2 s), curtain appears
    await wait(2100);
    await walk(xd, xd, 900, 0.82, true);                             // steps through the curtain, smaller and fading
    W.classList.remove('on');
    await wait(2600);                                                // door-open picture: farmer with the crate
    P.goByName('A8_interior_wide');
    P.addBatchSpot(b.id, SPOT, this.cropImg(b.crop));
    await wait(1600);
    door.close();                                                    // 90 -> 0 deg behind the farmer
  }

  async showCard(id, fresh = false) {
    const d = await getJSON(`api/batch/${encodeURIComponent(id)}?t=${this.clock.t.toFixed(0)}`);
    const b = d.batch, a = d.assess, url = this.buyerURL(id);
    const sc = a.freshness_score, col = sc > 70 ? '#22c55e' : sc > 40 ? '#f59e0b' : '#ef4444';
    $('cardBody').innerHTML = `
      <div class="bc"><div>
        <div class="note">${fresh ? 'New batch created' : 'Batch card'}</div>
        ${photoFor('crops', b.crop)}
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
        <div class="note">${location.protocol === 'file:' ? 'Static backup (no server): the buyer page opens on this laptop only – phones need the Python version.' : "Buyers scan this on a phone connected to the laptop's Wi-Fi hotspot."}</div>
        <a href="buyer.html?b=${encodeURIComponent(id)}" target="_blank">Open buyer page ▸</a>
      </div></div>
      <div class="row"><button class="ghost" onclick="document.getElementById('cardModal').classList.remove('on')">Close</button></div>`;
    const qr = qrcode(0, 'M'); qr.addData(url); qr.make();          // offline QR (vendor/qrcode)
    $('qr').innerHTML = qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
    $('cardModal').classList.add('on');
    lineChart($('cardHist'), { x: ['entry', 'now'], series: [{ y: d.history_T, color: '#2a78d6', label: 'room T since entry' }], unit: '°C', band: [2, 8] });
  }
}
