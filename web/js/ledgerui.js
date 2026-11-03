// Ledger drawer: linked block cards, Tamper / Undo, sensor fault, one-line explanation.
import { getJSON, postJSON } from './api.js';
import { verifyBlocks } from './ledger.js';

const $ = id => document.getElementById(id);
const short = h => `${h.slice(0, 6)}…${h.slice(-4)}`;

export class LedgerUI {
  constructor(clock, feed) {
    this.clock = clock; this.feed = feed; this.seen = new Set(); this.msg = '';
    $('ledgerBtn').onclick = () => (this.isOpen() ? this.close() : this.open());
    $('ledgerClose').onclick = () => this.close();
    $('tamperBtn').onclick = async () => {
      const r = await postJSON('api/ledger/tamper');
      this.msg = r.explain ? `✗ ${r.explain}` : 'Ledger too short – let the clock run a few hours.';
      this.refresh(true);
    };
    $('resetBtn').onclick = async () => { await postJSON('api/ledger/reset'); this.msg = 'Tamper undone – every hash matches again.'; this.refresh(true); };
    $('faultBtn').onclick = async () => {
      const on = $('faultBtn').dataset.on === '1';
      await postJSON('api/fault', on ? { clear: true } : { t: this.clock.t, offset: 3.0 });
      this.msg = on ? 'Sensor fault cleared.' : 'Room sensor now reads 3 °C too high. The twin predicts the real value; after 15 simulated minutes the reading is flagged “Sensor suspicious – check”, and the flag is sealed in the next block.';
      this.feed.poll(); this.refresh(true);
    };
    setInterval(() => this.isOpen() && this.refresh(), 1500);
    feed.on(s => this.badge(s));
  }

  isOpen() { return $('ledgerDrawer').classList.contains('on'); }
  open(msg) { if (msg) this.msg = msg; $('ledgerDrawer').classList.add('on'); this.refresh(true); }
  close() { $('ledgerDrawer').classList.remove('on'); }

  badge(s) {
    const b = $('ledgerBadge');
    b.className = 'lb ' + (s.ledger.valid ? 'ok' : 'bad'); b.textContent = s.ledger.valid ? `✓ ${s.ledger.length}` : '✗';
    const f = s.values.fault_active;
    $('faultBtn').dataset.on = f ? '1' : '0';
    $('faultBtn').textContent = f ? 'Clear sensor fault' : 'Inject sensor fault (+3 °C)';
  }

  async refresh(force = false) {
    const L = await getJSON('api/ledger?last=14');
    const local = verifyBlocks(L.blocks);            // this browser re-checks the hashes itself
    const st = $('ledgerStatus');
    st.className = L.valid ? 'ok' : 'bad';
    st.textContent = L.valid ? `✓ all ${L.length} blocks verified (server and this browser agree)` : `✗ chain broken at block ${L.first_bad}`;
    const ex = $('ledgerExplain'); ex.textContent = this.msg; ex.className = 'explain' + (this.msg.startsWith('✗') ? ' bad' : '');
    const html = [];
    L.blocks.forEach((b, i) => {
      const s = L.status[i], bad = s !== 'ok', lc = local[i];
      const isNew = !this.seen.has(b.hash); this.seen.add(b.hash);
      if (i) html.push(`<div class="link ${bad ? 'bad' : ''}" title="prev_hash = hash of the block before">${bad ? '✗' : '→'}</div>`);
      html.push(`<div class="blk ${bad ? 'bad' : ''} ${b.flag !== 'OK' ? 'flag' : ''} ${isNew && !force ? 'newb' : ''}">
        <h4>#${b.index} · ${b.timestamp.slice(5)}</h4>
        <div>T ${b.summary.T_min.toFixed(1)} / <b>${b.summary.T_avg.toFixed(1)}</b> / ${b.summary.T_max.toFixed(1)} °C</div>
        <div>door ${b.summary.door_min.toFixed(1)} min · wax ${b.summary.pcm_pct.toFixed(0)} %</div>
        <div class="ids">${b.batch_ids.length ? b.batch_ids.join(' ') : '—'}</div>
        <div>${b.flag === 'OK' ? 'physics check OK' : '⚠ ' + b.flag}</div>
        <div class="h">prev ${short(b.prev_hash)}</div><div class="h">hash ${short(b.hash)}</div>
        <div class="st ${bad ? 'bad' : 'ok'}">${s === 'ok' ? '✓ verified' : '✗ ' + s}${lc && !lc.ownOk ? ' (hash ≠ data)' : ''}</div></div>`);
    });
    const ch = $('chain');
    const atEnd = ch.scrollLeft + ch.clientWidth >= ch.scrollWidth - 30;
    ch.innerHTML = html.join('');
    if (atEnd || force) ch.scrollLeft = ch.scrollWidth;
  }
}
