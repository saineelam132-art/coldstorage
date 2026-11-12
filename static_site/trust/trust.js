// KoolKisaan – Trust & Trade page. Shared, saved data through window.KKStore (Cloud Firestore when the site is on Firebase
// Hosting; offline demo otherwise). Physics: window.TrustCore, detection: window.TamperDetector, twin data: window.TRUST_DATA.
// The chamber clock is SHARED (run by the owner's device = "controller"); roles, the selected slip and views are per viewer.
(function () {
  'use strict';
  const D = window.TRUST_DATA, T = window.TrustCore, X = window.TamperDetector, CFG = D.trust_cfg, CROP = D.crop, PH = CFG.phi;
  const $ = id => document.getElementById(id);
  const ROLE_KEY = 'kk_trust_role';
  const DEMO_KEY = 'KOOLKISAAN-DEMO-KEY-public-not-a-secret';
  const HONESTY = 'Hash chain proves data was not changed later. Physics check shows whether the data itself is believable. ' +
    'Neither is a court-level proof alone; together they make cheating hard.';
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const f1 = x => (x === null || x === undefined || !isFinite(x)) ? '–' : (+x).toFixed(1);
  const f0 = x => (x === null || x === undefined || !isFinite(x)) ? '–' : Math.round(x).toLocaleString('en-IN');
  const DWELL_DAYS = { pomegranate: 7 };                                // default expected stay (E, editable at check-in)
  let store = null, signMode = 'demo', role = 'farmer';

  // ------------------------------------------------------------------ chamber clock (shared)
  const ctrl = () => (store && store.ch && store.ch.ctrl) || null;
  const scKey = () => (ctrl() && D.scenarios[ctrl().scenario] ? ctrl().scenario : 'normal');
  const sc = () => D.scenarios[scKey()];
  const step = () => (ctrl() ? ctrl().step : sc().checkin_step);
  const NSTEP = () => sc().phi.length;
  const t0ms = () => Date.parse(sc().t0.replace(' ', 'T') + '+05:30');
  const tsAt = i => new Date(t0ms() + i * 300e3).toISOString().replace('.000Z', 'Z');
  const ist = ts => new Date(Date.parse(ts) + 5.5 * 3600e3);
  const hhmm = ts => { const d = ist(ts); return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`; };
  const dayLbl = ts => ist(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
  const whenLbl = ts => `${dayLbl(ts)} ${hhmm(ts)}`;
  const dateOf = ts => ist(ts).toISOString().slice(0, 10);
  const addDays = (iso, n) => new Date(Date.parse(iso + 'T00:00:00Z') + n * 864e5).toISOString().slice(0, 10);
  const amController = () => store.mode === 'offline' || (ctrl() && ctrl().uid === store.uid);

  // ------------------------------------------------------------------ blocks (watched for every batch of this epoch)
  const blocksBy = {}, watching = {};
  function watchAll() {
    for (const id of Object.keys(store.batches)) {
      if (watching[id]) continue;
      watching[id] = store.watchBlocks(id, bl => { blocksBy[id] = bl; schedule(); });
    }
  }
  // "Demo: edit an old stored reading": the database refuses edits; the demo shows what an edit WITH direct database
  // access would look like by applying the recorded edit on top of what is read.
  function withEdits(id, bl) {
    const ed = store.edits().filter(e => e.slipId === id);
    if (!ed.length) return bl;
    const out = bl.map(b => JSON.parse(JSON.stringify(b)));
    for (const e of ed) { const b = out.find(x => x.index === e.index); if (b) { let o = b.payload; const p = e.path.split('.'); for (const k of p.slice(0, -1)) o = o[k]; o[p[p.length - 1]] = e.value; } }
    return out;
  }
  const blocksOf = id => withEdits(id, blocksBy[id] || []);
  const batchList = () => Object.values(store.batches).sort((a, b) => (a.created < b.created ? -1 : 1));
  const activeList = () => store.active().sort((a, b) => (a.created < b.created ? -1 : 1));

  // ------------------------------------------------------------------ reported readings + automatic detection (controller only)
  let tamper = null, det = null;
  function reported(i) {
    let r = X.truthAt(D, scKey(), i);
    if (tamper) r = X.applyTamper(D, scKey(), i, r, tamper);
    return r;
  }
  function readingPayload(i, r) {
    const s = sc();
    return { step: i, N1: { T_s: r.T_s, RH_s: r.RH_s, v_m_s: r.v_s }, N2: { T_core: r.T_core },
      N3: { open: r.door_open, angle_deg: r.door_open ? s.N3.angle_deg[i] : 0, Q_door_W: r.Q_door_kW === null ? null : r.Q_door_kW * 1000 },
      N4: { T_r: r.T_r, RH_r: r.RH_r }, out: { T_out: r.T_out, RH_out: r.RH_out }, P_el_W: r.P_el_kW * 1000 };
  }
  const openAlerts = {};                                  // kind|sensors -> alert id while it is active
  async function raise(ev, i, phi) {
    const key = ev.kind + '|' + ev.sensors.join(',');
    if (openAlerts[key]) { await store.updateAlert(openAlerts[key], { to_step: i, to_ts: tsAt(i), phi_max: Math.max(phi, store.alerts[openAlerts[key]]?.phi_max || 0) }); return; }
    const affected = activeList().map(b => b.slipId);
    const id = await store.createAlert({ kind: ev.kind, sensors: ev.sensors, check: ev.check || null, reason: ev.reason, z: ev.z || null,
      from_step: ev.from, from_ts: tsAt(ev.from), raised_step: ev.raised, raised_ts: tsAt(ev.raised), to_step: i, to_ts: tsAt(i),
      phi_max: phi, scenario: scKey(), custody: 'owner (cold store)', batches: affected, status: 'active',
      hash: ev.hash || null, label: ev.kind === 'hash' ? 'Evidence tampered – payment frozen' : 'Payment on hold – data does not match physics' });
    openAlerts[key] = id;
    const flag = { type: ev.kind === 'hash' ? 'HASH' : 'PHYSICS', alertId: id, from: tsAt(ev.from), raised: tsAt(ev.raised), phi, reason: ev.reason, sensors: ev.sensors };
    for (const sid of affected) await store.appendBlock(sid, 'FLAG', 'system', { alertId: id, kind: ev.kind, sensors: ev.sensors, reason: ev.reason }, { phi, flags: [flag] }, tsAt(i));
    await store.audit({ what: 'alert', id, kind: ev.kind });
  }
  function hashCheck() {                                   // a stored block that no longer matches its hash
    for (const b of activeList()) {
      const bl = blocksOf(b.slipId), v = T.verifyChain(bl, CFG.reading_interval_s);
      if (!v.valid) {
        const blk = bl[v.first_bad];
        return { kind: 'hash', sensors: ['ledger'], from: blk?.payload?.step ?? step(), raised: step(), slip: b.slipId,
          reason: `Ledger of ${b.slipId}: block #${v.first_bad} – ${v.why}`,
          hash: { slipId: b.slipId, index: v.first_bad, stored: blk?.hash, recomputed: blk ? T.blockHash(blk) : null } };
      }
    }
    return null;
  }
  let busy = false;
  async function advance(n) {
    if (busy || !amController()) return 0;
    busy = true;
    let k = 0;
    try {
      while (k < n && step() < NSTEP() - 1) {
        const i = step() + 1, r = reported(i);
        det = det || new X.Detector(D, scKey());
        const out = det.push(i, r);
        const phys = { phi: out.phi, flags: [] };
        await store.addTelemetry({ step: i, ts: tsAt(i), scenario: scKey(), rep: r, phi: out.phi, z: out.z, missing: out.missing });
        await Promise.all(activeList().map(b => store.appendBlock(b.slipId, 'READING', 'owner', readingPayload(i, r), phys, tsAt(i))));
        const d0 = dateOf(tsAt(i - 1)), d1 = dateOf(tsAt(i));
        if (d0 !== d1) await publishAnchor(tsAt(i - 1).slice(0, 10));
        for (const ev of out.events) await raise(ev, i, out.phi);
        const hc = hashCheck();
        if (hc) await raise(hc, i, out.phi);
        await store.setCtrl({ ...ctrl(), step: i, updated: new Date().toISOString(), uid: store.uid, scenario: scKey() });
        k++;
      }
    } catch (e) { console.error(e); alert('Could not write: ' + e.message); }
    busy = false;
    return k;
  }
  async function publishAnchor(day) {
    const heads = {};
    for (const b of batchList()) { const h = T.dayHeads(blocksOf(b.slipId))[day]; if (h) heads[b.slipId] = h; }
    if (Object.keys(heads).length) await store.putAnchor(day, { anchor: T.dailyAnchor(day, heads), heads, published: tsAt(step()) });
  }
  let playTimer = null;
  function play(on) {
    clearInterval(playTimer); playTimer = null;
    $('playBtn').textContent = on ? '❚❚ Pause' : '▶ Run';
    if (on) playTimer = setInterval(() => { if (!busy) advance(1); }, +$('speedSel').value * 1000);
  }

  // ------------------------------------------------------------------ signing
  async function signSlip(id, bay, gen) {
    if (signMode === 'server') {
      try {
        const r = await fetch('api/trust/sign', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slipId: id, bay, genesisHash: gen }) });
        if (r.ok) return { sig: (await r.json()).sig, mode: 'server' };
      } catch (e) { /* fall back below */ }
    }
    return { sig: T.sign(DEMO_KEY, id, bay, gen), mode: 'demo' };
  }
  async function verifyQR(qr, mode) {
    if (mode === 'server') {
      try {
        const r = await fetch('api/trust/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(qr) });
        if (r.ok) return { ok: (await r.json()).valid, how: 'server key' };
      } catch (e) { /* server not reachable */ }
      return { ok: false, how: 'server not reachable – cannot check a server-signed slip here' };
    }
    return { ok: T.verifySig(DEMO_KEY, qr), how: 'demo key' };
  }
  function latestAnchor() { const ks = Object.keys(store.anchors).sort(); return ks.length ? store.anchors[ks[ks.length - 1]] : null; }

  // ------------------------------------------------------------------ freshness along a chain
  function settle(bl) {
    const F = new T.Freshness(CROP), b0 = bl[0], p0 = b0.payload, vOff = CFG.produce_air_speed_fan_off_m_s;
    const curve = [];
    F.step(p0.T_field_C, p0.RH_field_pct, vOff, p0.harvest_h || 0, p0.T_field_C);
    const Fc = F.value;
    curve.push({ ts: b0.ts, F: Fc, T: p0.T_field_C, leg: 'farm' });
    let Fout = null, Fin = null, last = b0, Tbox = null, lastR = { T_r: 5, RH_r: 90, T_core: 5, v: 0 };
    for (const b of bl.slice(1)) {
      const dt = (Date.parse(b.ts) - Date.parse(last.ts)) / 3600e3, p = b.payload;
      if (!p) { continue; }
      if (b.type === 'READING') {
        if (!p.N4 || !p.N2 || !p.N1) continue;                 // a half-written / rejected block: ignore
        const R = { T_r: p.N4.T_r ?? lastR.T_r, RH_r: p.N4.RH_r ?? lastR.RH_r, T_core: p.N2.T_core ?? lastR.T_core, v: p.N1.v_m_s ?? lastR.v };
        lastR = R;
        F.step(R.T_r, R.RH_r, R.v > 0.1 ? CFG.produce_air_speed_fan_on_m_s : vOff, dt, R.T_core);
        curve.push({ ts: b.ts, F: F.value, T: R.T_core, leg: 'storage' });
      } else if (b.type === 'HANDOVER_OUT') { Fout = F.value; Tbox = p.produce_T_C; curve.push({ ts: b.ts, F: Fout, T: Tbox, leg: 'transport' }); }
      else if (b.type === 'TRANSIT') {
        F.step(p.T_box_C, CFG.vehicle_rh_pct, CFG.vehicle_air_speed_m_s, dt, p.T_box_C); Tbox = p.T_box_C;
        curve.push({ ts: b.ts, F: F.value, T: p.T_box_C, leg: 'transport' });
      } else if (b.type === 'HANDOVER_IN') {
        if (dt > 0 && Tbox !== null) F.step(p.produce_T_C, CFG.vehicle_rh_pct, CFG.vehicle_air_speed_m_s, dt, p.produce_T_C);
        Fin = F.value; curve.push({ ts: b.ts, F: Fin, T: p.produce_T_C, leg: 'transport' });
      }
      if (b.type !== 'FLAG' && b.type !== 'REVIEW') last = b;
    }
    const Fnow = F.value, kg = p0.kg, base = p0.basePrice_INR_kg;
    const endStore = Fout !== null ? Fout : Fnow, endTrans = Fin !== null ? Fin : Fnow;
    const legs = { farm: 100 - Fc, storage: Fc - endStore, transport: Fout !== null ? Fout - endTrans : 0 };
    const rs = {}; for (const k in legs) rs[k] = kg * base * legs[k] / 100;
    return { F_checkin: Fc, F_out: Fout, F_in: Fin, F_now: Fnow, legs, loss_INR: rs, curve, damaged: F.damaged, kg, base,
      price: T.price(base, Fin !== null ? Fin : Fnow) };
  }

  // ------------------------------------------------------------------ header
  function renderTop() {
    $('clock').textContent = whenLbl(tsAt(step())) + ' IST';
    $('clockTag').innerHTML = `<span class="chip S">S</span>`;
    const sel = $('scenario');
    if (!sel.options.length) for (const [k, v] of Object.entries(D.scenarios)) sel.add(new Option(v.label, k));
    sel.value = scKey();
    sel.disabled = !amController();
    $('resetBtn').hidden = !store.isAdmin();
  }
  function renderKeyNote() {
    const n = $('keyNote'); n.hidden = false;
    n.innerHTML = signMode === 'server'
      ? '🔐 Slips are signed on the server (key from the environment variable KOOLKISAAN_HMAC_KEY – never sent to the browser).'
      : `🔑 <b>${esc(CFG.demo_key_note)}</b> There is no signing server yet, so slips are signed in the browser with a public demo key.`;
  }

  // ------------------------------------------------------------------ FARMER
  const CAP = () => store.ch.capacity_kg;
  function drawLoad() {
    const ch = store.ch, u = ch.stored_kg, p = u / CAP() * 100;
    $('loadKg').textContent = f1(u); $('loadCap').textContent = CAP(); $('loadPct').textContent = p.toFixed(0);
    $('fFree').textContent = f1(CAP() - u); $('fCap').textContent = CAP();
    const bar = $('loadBar'); bar.style.width = Math.min(100, p) + '%';
    bar.style.background = p >= 100 ? '#dc2626' : p >= CFG.load_warn_frac * 100 ? '#f59e0b' : '#16a34a';
    const w = $('loadWarn'); w.className = 'msg ' + (p >= 100 ? 'bd' : 'wn');
    w.textContent = p >= 100 ? '⛔ FULL – payload limit reached' : p >= CFG.load_warn_frac * 100 ? '⚠ above 80 % – nearly full' : '';
    const lim = ch.bay_limit_kg;
    $('bays').innerHTML = KKStore.BAYS.map((b, i) => {
      const k = ch.bays[b] || 0, x = (i % 3) * 100 + 5, y = Math.floor(i / 3) * 72 + 4, h = Math.min(k / lim, 1) * 60;
      const col = k >= lim - 1e-9 ? '#dc2626' : k >= 0.8 * lim ? '#f59e0b' : '#14b8a6';
      return `<rect x="${x}" y="${y}" width="90" height="64" rx="5" fill="none" stroke="currentColor" opacity=".5"/>
        <rect x="${x + 1}" y="${y + 63 - h}" width="88" height="${h}" fill="${col}" opacity=".5"/>
        <text x="${x + 8}" y="${y + 16}" font-size="12" font-weight="700">${b}</text><text x="${x + 8}" y="${y + 56}" font-size="11">${f1(k)} / ${lim} kg</text>`;
    }).join('');
  }
  function checkQty() {
    const q = +$('fKg').value, free = CAP() - store.ch.stored_kg, m = $('fMsg');
    m.className = 'msg ' + (q > free || q > CAP() ? 'bd' : 'wn');
    m.textContent = q > CAP() ? `⛔ At most ${CAP()} kg per check-in` : q > free ? `⛔ Only ${f1(free)} kg free in the room` :
      (store.ch.stored_kg + q >= CAP() * CFG.load_warn_frac ? '⚠ This load takes the room above 80 %' : '');
  }
  async function checkIn() {
    const q = +$('fKg').value, base = +$('fBase').value, name = $('fName').value.trim(), m = $('fMsg');
    if (!name || !(q > 0) || !(base > 0)) { m.className = 'msg bd'; m.textContent = '⛔ Fill in name, quantity and price'; return; }
    $('fGo').disabled = true;
    try {
      const s = sc(), i = step(), anc = latestAnchor();
      const b = await store.checkIn({ kg: q, ts: tsAt(i), expected_out: $('fOut').value || null, payload: {
        farmer: name, crop: D.crop_key, basePrice_INR_kg: base, harvest_h: Math.max(0, +$('fHarv').value || 0),
        T_field_C: s.out.T_out[i], RH_field_pct: s.out.RH_out[i], expected_out: $('fOut').value || null,
        lastAnchor: anc ? `${anc.day}:${anc.anchor}` : 'none yet' } });
      const { sig, mode } = await signSlip(b.slipId, b.bay, b.genesisHash);
      await store.setSig(b.slipId, { slipId: b.slipId, bay: b.bay, genesisHash: b.genesisHash, sig }, mode);
      m.className = 'msg ok'; m.textContent = `✔ Checked in: ${b.slipId} → ${b.bay}`;
      lastSlip = b.slipId;
    } catch (e) { m.className = 'msg bd'; m.textContent = '⛔ ' + e.message; }
    $('fGo').disabled = false;
    schedule();
  }
  function qrSvg(text) {
    try { const q = qrcode(0, 'M'); q.addData(text); q.make(); return q.createSvgTag({ cellSize: 4, margin: 2, scalable: true }); }
    catch (e) { return '<div class="muted">QR library missing</div>'; }
  }
  let lastSlip = null, shownSlip = null;
  function showSlip(b) {
    const bl = blocksBy[b.slipId];
    if (!b.qr || !bl || !bl.length) return;
    const key = b.slipId + '|' + b.sig;
    if (shownSlip === key) return;
    shownSlip = key;
    const p = bl[0].payload, qrText = JSON.stringify(b.qr), when = whenLbl(bl[0].ts);
    const note = b.sigMode === 'server' ? 'Signed on the server' : esc(CFG.demo_key_note);
    $('slipBox').innerHTML = `<div class="slip"><div class="qr">${qrSvg(qrText)}</div>
      <div><div class="id">${esc(b.slipId)}</div><div class="kv">
        <span>Farmer</span><b>${esc(p.farmer)}</b><span>Produce</span><b>${esc(CROP.label)} · ${p.kg} kg</b>
        <span>Base price</span><b>₹${p.basePrice_INR_kg}/kg at 100 % freshness</b><span>Bay(s)</span><b>${esc(b.bay)}</b>
        <span>Check-in</span><b>${when} IST</b><span>Expected take-out</span><b>${esc(b.expected_out || '–')}</b>
        <span>Genesis hash</span><b class="mono">${b.genesisHash.slice(0, 24)}…</b>
        <span>Signature</span><b class="mono">${b.qr.sig.slice(0, 24)}…</b><span>Last daily anchor</span><b class="mono">${esc(String(p.lastAnchor).slice(0, 30))}…</b>
      </div><p class="note">${note}</p>
      <button id="printBtn">🖨 Print A6 slip</button><button id="copyQR">Copy QR text</button></div></div>`;
    $('printSlip').innerHTML = `<h2>KoolKisaan cold-room slip</h2><div class="id">${esc(b.slipId)}</div>
      <div class="qr">${qrSvg(qrText)}</div>
      <div>Farmer: <b>${esc(p.farmer)}</b><br>${esc(CROP.label)} · <b>${p.kg} kg</b> · Bay <b>${esc(b.bay)}</b><br>
      Base ₹${p.basePrice_INR_kg}/kg (at 100 % freshness)<br>Check-in ${when} IST · take-out ${esc(b.expected_out || '–')}</div>
      <div class="small">Genesis ${b.genesisHash}<br>Sig ${b.qr.sig}<br>Daily anchor ${esc(p.lastAnchor)}<br>${note}</div>`;
    $('printBtn').onclick = () => window.print();
    $('copyQR').onclick = () => { try { navigator.clipboard.writeText(qrText); $('copyQR').textContent = 'Copied ✔'; } catch (e) { /* no clipboard */ } };
  }
  const STATUS = { stored: 'stored', partly_removed: 'partly removed', removed: 'removed', void: 'VOID', in_transit: 'in transit', delivered: 'delivered', sold: 'sold' };
  function renderFarmer() {
    drawLoad();
    const rows = batchList().filter(b => b.status !== 'void').map(b => {
      const bl = blocksOf(b.slipId);
      if (!bl.length) return '';
      const st = settle(bl), pr = T.price(st.base, st.F_now);
      return `<tr><td>${esc(b.slipId)}</td><td>${esc(b.bay)}</td><td class="n">${f1(b.kg_stored)} / ${b.kg}</td><td>${STATUS[b.status] || b.status}</td>
        <td>${esc(b.expected_out || '–')}</td><td class="n">${f1(st.F_now)} %</td><td class="n">₹${f1(pr)}</td><td class="n">₹${f0(b.kg_stored * pr)}</td></tr>`;
    });
    $('fMine').innerHTML = rows.length ? `<div class="tablewrap"><table><tr><th>Slip</th><th>Bay</th><th class="n">kg in room</th><th>Status</th><th>Take-out</th><th class="n">Freshness now</th><th class="n">Price now</th><th class="n">Value in room</th></tr>${rows.join('')}</table></div>
      <p class="note">Freshness from the ledger readings (core temperature, air humidity and air speed). Price = base × freshness.</p>` : 'Nothing stored yet.';
    fillSlipSelect($('coSlip'), b => b.status === 'stored' || b.status === 'partly_removed');
    const cur = store.batches[$('coSlip').value];
    if (cur && document.activeElement !== $('coKg')) $('coKg').max = cur.kg_stored;
    const b = store.batches[lastSlip] || batchList().filter(x => x.status !== 'void').pop();
    if (b) showSlip(b);
  }
  async function doCheckout() {
    const id = $('coSlip').value, kg = +$('coKg').value, m = $('coMsg');
    try { await store.checkout(id, kg, 'farmer', tsAt(step())); m.className = 'msg ok'; m.textContent = `✔ ${kg} kg taken out of ${id}`; }
    catch (e) { m.className = 'msg bd'; m.textContent = '⛔ ' + e.message; }
  }

  // ------------------------------------------------------------------ space calendar + reservations
  function spaceDays(n = 30) {
    const today = dateOf(tsAt(step())), cap = CAP(), out = [];
    for (let k = 0; k < n; k++) {
      const d = addDays(today, k);
      let kg = 0;
      for (const b of activeList()) if (!b.expected_out || b.expected_out > d) kg += b.kg_stored;
      for (const r of Object.values(store.res)) if (r.status !== 'rejected' && r.date <= d && addDays(r.date, r.days) > d) kg += r.kg;
      out.push({ d, kg, free: Math.max(0, cap - kg) });
    }
    return out;
  }
  function freeOn(d, days) {
    const sd = spaceDays(60), from = sd.findIndex(x => x.d === d);
    if (from < 0) return null;
    return Math.min(...sd.slice(from, from + days).map(x => x.free));
  }
  async function reserve() {
    const kg = +$('rsKg').value, d = $('rsDate').value, days = +$('rsDays').value, m = $('rsMsg');
    if (!(kg > 0) || !d || !(days >= 1)) { m.className = 'msg bd'; m.textContent = '⛔ Fill in kg, date and days'; return; }
    const free = freeOn(d, days);
    if (free === null) { m.className = 'msg bd'; m.textContent = '⛔ Pick a date within the next 60 days'; return; }
    if (free + 1e-9 < kg) {
      const sd = spaceDays(60); let alt = null;
      for (let k = 0; k < sd.length - days; k++) if (sd[k].d >= d && Math.min(...sd.slice(k, k + days).map(x => x.free)) >= kg) { alt = sd[k].d; break; }
      m.className = 'msg wn'; m.textContent = `Not enough space on all those days (only ${f1(free)} kg free). ${alt ? `Nearest date with ${kg} kg free for ${days} days: ${alt}.` : 'No date in the next 60 days.'}`;
      return;
    }
    try { await store.reserve({ kg, date: d, days, status: 'booked', farmer: $('fName').value.trim() || 'farmer' }); m.className = 'msg ok'; m.textContent = `✔ Booked: ${kg} kg from ${d} for ${days} days (the owner can accept or reject)`; }
    catch (e) { m.className = 'msg bd'; m.textContent = '⛔ ' + e.message; }
  }
  function renderSpace() {
    const sd = spaceDays(30), cap = CAP();
    $('spaceCal').innerHTML = `<div class="spacegrid">${sd.map(x => {
      const p = x.kg / cap * 100, col = p >= 100 ? 'red' : p >= 80 ? 'orange' : 'green';
      return `<div class="sday ${col}" title="${x.d}: ${f1(x.kg)} kg expected, ${f1(x.free)} kg free"><b>${x.d.slice(8)}</b><span>${f0(x.free)}</span></div>`;
    }).join('')}</div><p class="note">Number = kg free that day (capacity ${cap} kg), from the expected take-out dates and the reservations. Green &lt; 80 %, orange ≥ 80 %, red full.</p>`;
    const rs = Object.values(store.res).sort((a, b) => (a.date < b.date ? -1 : 1));
    $('oRes').innerHTML = rs.length ? `<table><tr><th>Farmer</th><th>Date</th><th class="n">kg</th><th class="n">days</th><th>Status</th><th></th></tr>${rs.map(r =>
      `<tr><td>${esc(r.farmer)}</td><td>${r.date}</td><td class="n">${r.kg}</td><td class="n">${r.days}</td><td>${r.status}</td>
        <td>${r.status === 'booked' && store.isAdmin() ? `<button data-acc="${r.id}">Accept</button><button data-rej="${r.id}">Reject</button>` : ''}</td></tr>`).join('')}</table>` : 'None.';
    $('oRes').querySelectorAll('[data-acc]').forEach(b => (b.onclick = () => store.decideReservation(b.dataset.acc, 'accepted')));
    $('oRes').querySelectorAll('[data-rej]').forEach(b => (b.onclick = () => store.decideReservation(b.dataset.rej, 'rejected')));
  }
  function answer() {
    const d = $('ansDate').value; if (!d) return;
    const free = freeOn(d, 1);
    const txt = free === null ? 'Pick a date within the next 60 days.' : `KoolKisaan cold room: on ${d} you can bring up to ${Math.floor(free)} kg.`;
    $('ansOut').innerHTML = `${esc(txt)} <a href="https://wa.me/?text=${encodeURIComponent(txt)}" target="_blank" rel="noopener">Send on WhatsApp</a>
      <button id="ansCopy">Copy</button>`;
    $('ansCopy').onclick = () => { try { navigator.clipboard.writeText(txt); } catch (e) { /* ignore */ } };
  }

  // ------------------------------------------------------------------ Φ gauge
  function gauge(el, phi) {
    const max = 5, a = v => Math.PI * (1 - Math.min(v, max) / max), pt = (v, r) => [100 + r * Math.cos(a(v)), 100 - r * Math.sin(a(v))];
    const arc = (v0, v1, col) => { const [x0, y0] = pt(v0, 80), [x1, y1] = pt(v1, 80); return `<path d="M${x0} ${y0} A80 80 0 0 1 ${x1} ${y1}" stroke="${col}" stroke-width="16" fill="none"/>`; };
    const [nx, ny] = pt(isFinite(phi) ? phi : 0, 70);
    const col = phi >= PH.red_at ? '#dc2626' : phi >= PH.green_below ? '#f59e0b' : '#16a34a';
    el.innerHTML = `<svg viewBox="0 0 200 120" style="width:100%;max-width:260px" role="img" aria-label="Physics check gauge, phi ${f1(phi)}">
      ${arc(0, PH.green_below, '#16a34a')}${arc(PH.green_below, PH.red_at, '#f59e0b')}${arc(PH.red_at, max, '#dc2626')}
      <line x1="100" y1="100" x2="${nx}" y2="${ny}" stroke="currentColor" stroke-width="3"/><circle cx="100" cy="100" r="5" fill="currentColor"/>
      <text x="100" y="92" text-anchor="middle" font-size="22" font-weight="800" fill="${col}">Φ ${f1(phi)}</text>
      <text x="18" y="116" font-size="10" fill="currentColor">0</text><text x="176" y="116" font-size="10" fill="currentColor">5+</text></svg>`;
  }
  const phiWord = phi => phi >= PH.red_at ? '<b class="bd">Data does not match physics</b>' : phi >= PH.green_below ? '<b class="wn">Unusual – watch</b>' : '<b class="ok">Data fits physics</b>';

  // ------------------------------------------------------------------ OWNER
  let c24 = null, cFresh = null;
  const lastTele = () => store.tele.length ? store.tele[store.tele.length - 1] : null;
  function renderOwner() {
    const i = step(), s = sc(), tl = lastTele();
    const fault = s.from_step !== null ? (i >= s.from_step ? ` – fault active since ${whenLbl(tsAt(s.from_step))}` : ` – fault starts ${whenLbl(tsAt(s.from_step))}`) : '';
    $('scenarioNote').innerHTML = `Scenario: <b>${esc(s.label)}</b>${fault}. 3-day twin run from the day before the hottest day of 2026.`;
    const c = ctrl(), live = store.mode === 'live';
    $('ctrlBox').innerHTML = amController() ? `<div class="alarm ok">This device runs the chamber clock${live ? ' (controller)' : ''}.</div>`
      : `<div class="alarm wn">The chamber clock is run by ${c ? 'another device' : 'nobody yet'}${c ? ` (last step ${whenLbl(tsAt(c.step))})` : ''}.
        ${store.isAdmin() ? '<button id="takeCtrl">Run it on this device</button>' : 'Only an owner device can run it.'}</div>`;
    if ($('takeCtrl')) $('takeCtrl').onclick = () => store.setCtrl({ uid: store.uid, scenario: scKey(), step: step(), updated: new Date().toISOString() });
    ['playBtn', 'speedSel'].forEach(id => ($(id).disabled = !amController()));
    document.querySelectorAll('[data-adv]').forEach(b => (b.disabled = !amController()));
    $('adminBox').innerHTML = live ? `Device id (uid): <code>${esc(store.uid)}</code> · ${store.isAdmin() ? '<b>owner (admin)</b>' : 'not an owner – add this uid to chambers/CH-DEMO → admins in the Firebase console'}` : '';
    gauge($('gauge'), tl ? tl.phi : 0);
    $('phiTx').innerHTML = `${phiWord(tl ? tl.phi : 0)}<br><span class="note">Φ = √(Σ w·z² / Σ w) over 4 checks (moisture, energy, room heat balance, core lag), 15-min mean.
      Green &lt; ${PH.green_below}, orange ${PH.green_below}–${PH.red_at}, alert when ≥ ${PH.red_at} for ${PH.red_steps} readings.</span>`;
    const r = tl ? tl.rep : X.truthAt(D, scKey(), i), p = readingPayload(i, r);
    const v = (x, u) => (x === null || x === undefined ? '<span class="bd">no reading</span>' : `${f1(x)} ${u}`);
    const node = (t, val, sub, tag) => `<div class="node"><b>${t} <span class="chip ${tag}">${tag}</span></b><span class="v">${val}</span><small>${sub}</small></div>`;
    $('nodes').innerHTML =
      node('N1 supply air', v(p.N1.T_s, '°C'), `RH ${f1(p.N1.RH_s)} % · v ${f1(p.N1.v_m_s)} m/s`, 'S') +
      node('N2 produce core', v(p.N2.T_core, '°C'), 'probe in the fruit (lag τ = 4 h / ln 8)', 'S') +
      node('N3 door', p.N3.open === null ? '<span class="bd">no reading</span>' : p.N3.open ? 'OPEN' : 'closed', `leak ${f0(p.N3.Q_door_W)} W (ASHRAE)`, 'S') +
      node('N4 return air', v(p.N4.T_r, '°C'), `RH ${p.N4.RH_r === null ? 'no reading' : f1(p.N4.RH_r) + ' %'}`, 'S') +
      node('Outside air', v(p.out.T_out, '°C'), `RH ${f0(p.out.RH_out)} %`, 'W') +
      node('Compressor power', `${f0(p.P_el_W)} W`, `${s.ctl.grid_on[i] ? 'GRID backup on' : 'solar / wax'} · wax ${f0(s.ctl.pcm_pct[i])} % frozen`, 'S');
    // 24 h of shared telemetry
    const tt = store.tele.filter(x => x.scenario === scKey() && x.step > i - 288);
    const data = { labels: tt.map(x => hhmm(x.ts)), datasets: [
      { label: '8 °C', data: tt.map(() => 8), borderWidth: 0, pointRadius: 0, backgroundColor: 'rgba(22,163,74,.12)', fill: '+1' },
      { label: '2 °C', data: tt.map(() => 2), borderWidth: 0, pointRadius: 0, fill: false },
      { label: 'Room air N4 (reported)', data: tt.map(x => x.rep.T_r), borderColor: '#2a78d6', borderWidth: 2, pointRadius: 0, spanGaps: false },
      { label: 'Produce core N2 (reported)', data: tt.map(x => x.rep.T_core), borderColor: '#e8590c', borderWidth: 2, pointRadius: 0 },
      { label: 'Room air – twin (true)', data: tt.map(x => s.T_room_true[x.step]), borderColor: '#94a3b8', borderDash: [4, 4], borderWidth: 1.5, pointRadius: 0 }] };
    c24 = chart(c24, $('c24'), data, { y: { title: { display: true, text: '°C' } } });
    // alerts
    const al = Object.values(store.alerts).sort((a, b) => (a.created < b.created ? 1 : -1)).map(a =>
      `<div class="alarm ${a.status === 'reviewed' ? 'ok' : a.kind === 'hash' ? 'bd' : 'wn'}">⚠ <a href="${KKStore.link(`alert.html?id=${encodeURIComponent(a.id)}`)}">${esc(a.label)}</a> –
        ${esc(a.reason)} · ${whenLbl(a.from_ts)}–${hhmm(a.to_ts)} · ${a.status}</div>`);
    if (r.T_r > 8) al.push(`<div class="alarm bd">🌡 Room air ${f1(r.T_r)} °C – above 8 °C</div>`);
    if (r.T_core !== null && r.T_core < CROP.freshness.T_freeze_C) al.push(`<div class="alarm bd">❄ Produce core ${f1(r.T_core)} °C – below the freezing point</div>`);
    $('alarms').innerHTML = al.length ? al.slice(0, 8).join('') : '<div class="alarm ok">✔ No alarms</div>';
    // tamper panel
    $('tpState').innerHTML = tamper ? `<span class="bd">Tampering ON since ${whenLbl(tsAt(tamper.from))}: ${esc(X.SENSORS[tamper.sensor].label)} – ${esc(X.ACTIONS[tamper.action])}.</span>`
      : (amController() ? 'No tampering.' : 'Tampering works only on the device that runs the chamber clock.');
    $('tpStart').disabled = !amController() || !!tamper; $('tpStop').disabled = !tamper;
    renderLedger();
    renderBatches();
    renderSpace();
    const an = Object.values(store.anchors).sort((a, b) => (a.day < b.day ? 1 : -1));
    $('anchors').innerHTML = an.length ? `<table><tr><th>UTC day</th><th>Anchor</th><th class="n">Slips</th><th>Published</th></tr>${an.map(v2 =>
      `<tr><td>${v2.day}</td><td class="mono">${v2.anchor.slice(0, 32)}…</td><td class="n">${Object.keys(v2.heads).length}</td><td>${whenLbl(v2.published)}</td></tr>`).join('')}</table>` :
      'None yet – the first anchor is published when the clock passes midnight UTC (05:30 IST).';
  }
  function renderLedger() {
    fillSlipSelect($('oSlip'), () => true);
    const id = $('oSlip').value, bl = blocksOf(id);
    if (!bl.length) { $('ledger').innerHTML = '<p class="muted">No slips yet – a farmer must check in first.</p>'; return; }
    const ver = T.verifyChain(bl), rows = bl.slice(-40).reverse().map(b => {
      const bad = ver.first_bad !== null && b.index >= ver.first_bad, fl = (b.physics.flags || []).length;
      return `<tr class="${bad ? 'bad' : fl ? 'flag' : ''}"><td class="n">${b.index}</td><td>${whenLbl(b.ts)}</td><td>${b.type}</td><td>${b.actor}</td><td>${blockSummary(b)}</td>
        <td class="n">${f1(b.physics.phi)}${fl ? ' ⚠' : ''}</td><td class="mono">${b.hash.slice(0, 12)}…</td></tr>`;
    });
    $('ledger').innerHTML = `<p class="note">${bl.length} blocks · chain ${ver.valid ? '<b class="ok">valid</b>' : `<b class="bd">BROKEN at block #${ver.first_bad}</b>`} · newest first, last 40 shown.</p>
      <table><tr><th class="n">#</th><th>Time (IST)</th><th>Type</th><th>Actor</th><th>Data</th><th class="n">Φ</th><th>Hash</th></tr>${rows.join('')}</table>`;
  }
  function renderBatches() {
    const tab = $('oBatches').dataset.tab || 'active';
    const list = batchList().filter(b => (tab === 'active' ? ['stored', 'partly_removed'].includes(b.status) : !['stored', 'partly_removed'].includes(b.status)));
    $('oBatches').innerHTML = `<div class="row"><button data-bt="active" class="${tab === 'active' ? 'primary' : ''}">Active</button><button data-bt="history" class="${tab === 'history' ? 'primary' : ''}">History</button></div>
      ${list.length ? `<table><tr><th>Slip</th><th>Farmer</th><th class="n">kg in room / in</th><th>Bay</th><th>Status</th><th>Take-out</th><th></th></tr>${list.map(b =>
        `<tr><td>${esc(b.slipId)}</td><td>${esc(b.farmer)}</td><td class="n">${f1(b.kg_stored)} / ${b.kg}</td><td>${esc(b.bay)}</td><td>${STATUS[b.status] || b.status}${b.void_reason ? ` (${esc(b.void_reason)})` : ''}</td>
          <td>${esc(b.expected_out || '–')}</td><td>${tab === 'active' && store.isAdmin() ? `<button data-void="${b.slipId}" class="danger">Void</button>` : ''}</td></tr>`).join('')}</table>`
      : `<p class="muted">${tab === 'active' ? 'Nothing in the room.' : 'No removed or voided batches yet.'}</p>`}
      <p class="note">Void = a wrong check-in: a VOID block is written, the space is freed, the history stays (the ledger is never deleted).</p>`;
    $('oBatches').querySelectorAll('[data-bt]').forEach(b => (b.onclick = () => { $('oBatches').dataset.tab = b.dataset.bt; renderBatches(); }));
    $('oBatches').querySelectorAll('[data-void]').forEach(b => (b.onclick = async () => {
      const why = prompt(`Void ${b.dataset.void}? Give a reason (written into the ledger):`, 'wrong quantity typed');
      if (!why) return;
      try { await store.voidBatch(b.dataset.void, why, tsAt(step())); } catch (e) { alert(e.message); }
    }));
  }
  function blockSummary(b) {
    const p = b.payload || {};
    if (b.type === 'READING' && !p.N4) return '(incomplete)';
    if (b.type === 'READING') return `air ${f1(p.N4.T_r)} · core ${f1(p.N2.T_core)} °C · RH ${f0(p.N4.RH_r)} %${p.N3.open ? ' · door open' : ''}`;
    if (b.type === 'CHECKIN') return `${esc(p.farmer)} · ${p.kg} kg · ₹${p.basePrice_INR_kg}/kg · ${esc(p.bay)}`;
    if (b.type === 'CHECKOUT') return `${f1(p.kg)} kg out · ${f1(p.kg_left)} kg left`;
    if (b.type === 'VOID') return `VOID: ${esc(p.reason)} · ${f1(p.kg)} kg freed`;
    if (b.type === 'FLAG') return `⚠ ${esc(p.reason)}`;
    if (b.type === 'REVIEW') return `reviewed alert ${esc(p.alertId)}: ${esc(p.note)}`;
    if (b.type === 'HANDOVER_OUT') return `${esc(p.transporterId)} · ${esc(p.vehicle)} · ${f1(p.produce_T_C)} °C`;
    if (b.type === 'TRANSIT') return `box ${f1(p.T_box_C)} °C · outside ${f1(p.T_out_C)} °C (${p.source})`;
    if (b.type === 'HANDOVER_IN') return `${esc(p.buyerId)} · ${f1(p.produce_T_C)} °C`;
    if (b.type === 'SALE') return `F ${f1(p.freshness_pct)} % · ₹${f1(p.price_INR_kg)}/kg · ₹${f0(p.total_INR)}`;
    return '';
  }
  function fillSlipSelect(sel, keep) {
    const cur = sel.value, ids = batchList().filter(keep).map(b => b.slipId);
    const html = ids.length ? ids.map(id => `<option value="${id}">${id} · ${STATUS[store.batches[id].status] || ''}</option>`).join('') : '<option value="">– none –</option>';
    if (sel.innerHTML !== html) sel.innerHTML = html;
    if (ids.includes(cur)) sel.value = cur; else if (ids.length) sel.value = ids[ids.length - 1];
  }
  async function startTamper() {
    const sensor = $('tpSensor').value, action = $('tpAction').value;
    if (action === 'edit') return editOld();
    tamper = { sensor, action, from: step() + 1 };
    if (sensor === 'humidity' && action === 'freeze') tamper.frozen = X.truthAt(D, scKey(), step()).RH_r;
    await store.audit({ what: 'demo tamper start', sensor, action, step: step() });
    if (!playTimer) play(true);
    schedule();
  }
  async function stopTamper() { tamper = null; await store.audit({ what: 'demo tamper stop', step: step() }); schedule(); }
  async function editOld() {                              // edit an old stored reading (hide a warm spell)
    const b = activeList()[0];
    if (!b) { alert('Check in a batch first.'); return; }
    const bl = blocksBy[b.slipId] || [], reads = bl.filter(x => x.type === 'READING' && x.index < bl.length - 3);
    if (!reads.length) { alert('Need a few readings first – run the clock.'); return; }
    const tgt = reads.reduce((m, x) => ((x.payload.N4.T_r ?? 0) > (m.payload.N4.T_r ?? 0) ? x : m), reads[0]);
    let msg = '';
    if (store.mode === 'live') msg = await store.tryEditBlock(b.slipId, tgt.index, { ...tgt.payload, N4: { ...tgt.payload.N4, T_r: 5.0 } });
    await store.demoEdit({ slipId: b.slipId, index: tgt.index, path: 'N4.T_r', value: 5.0, was: tgt.payload.N4.T_r });
    $('tpState').innerHTML = `<span class="bd">Edited block #${tgt.index} of ${esc(b.slipId)}: room air ${f1(tgt.payload.N4.T_r)} → 5.0 °C.</span>
      ${msg ? `<br>The database itself: <b>${esc(msg)}</b> (append-only rules) – the demo now shows what an edit with direct database access looks like.` : ''}`;
    if (!playTimer && amController()) play(true);
  }

  // ------------------------------------------------------------------ TRANSPORTER
  let tCur = null;
  function parseQR(txt) { try { const o = JSON.parse(txt); return o && o.slipId ? o : null; } catch (e) { return null; } }
  async function tVerify() {
    const qr = parseQR($('tQR').value) || (store.batches[$('tSlip').value] || {}).qr, m = $('tVmsg');
    tCur = null; $('tOut').disabled = true;
    if (!qr) { m.className = 'msg bd'; m.textContent = '❌ Not a valid QR text'; return; }
    const b = store.batches[qr.slipId];
    if (!b) { m.className = 'msg bd'; m.textContent = '❌ Slip ID not found in the ledger'; return; }
    const v = await verifyQR(qr, b.sigMode);
    if (!v.ok || qr.genesisHash !== b.genesisHash || qr.bay !== b.qr.bay) { m.className = 'msg bd'; m.textContent = `❌ INVALID slip – signature or genesis does not match (${v.how}). Do not load.`; return; }
    tCur = b.slipId; m.className = 'msg ok'; m.textContent = `✔ Genuine slip ${b.slipId} · ${b.bay} · ${f1(b.kg_stored)} kg in the room (${v.how})`;
    $('tTemp').value = f1(X.truthAt(D, scKey(), step()).T_core);
    renderTransporter();
  }
  async function tHandOut() {
    const b = store.batches[tCur]; if (!b || !['stored', 'partly_removed'].includes(b.status)) return;
    await store.leaveRoom(b.slipId, 'HANDOVER_OUT', 'transporter', { transporterId: $('tId').value.trim(), vehicle: $('tVeh').value.trim(), produce_T_C: +$('tTemp').value }, tsAt(step()), 'in_transit');
    $('tOmsg').className = 'msg ok'; $('tOmsg').textContent = `✔ ${b.slipId} handed over at ${whenLbl(tsAt(step()))} – its bay space is free again`;
  }
  function lastT(bl) { for (let k = bl.length - 1; k >= 0; k--) { const p = bl[k].payload || {}; if (p.T_box_C !== undefined) return p.T_box_C; if (p.produce_T_C !== undefined) return p.produce_T_C; } return null; }
  let tripStep = null;
  async function tTransit(manualT) {
    const b = store.batches[tCur]; if (!b || b.status !== 'in_transit') return;
    const bl = blocksBy[b.slipId] || [], n = CFG.transit_interval_min / 5;
    tripStep = Math.min(NSTEP() - 1, (tripStep ?? step()) + n);        // the transporter's own clock on the road
    const To = sc().out.T_out[tripStep], prev = lastT(bl);
    const Tb = manualT !== undefined ? manualT : To + (prev - To) * Math.exp(-(CFG.transit_interval_min / 60) / CFG.vehicle_time_constant_h);
    await store.setStatus(b.slipId, 'TRANSIT', 'transporter', { T_box_C: Tb, T_out_C: To, source: manualT !== undefined ? 'manual' : 'vehicle model (E)' }, tsAt(tripStep), 'in_transit');
  }
  async function tHandIn() {
    const b = store.batches[tCur]; if (!b || b.status !== 'in_transit') return;
    await store.setStatus(b.slipId, 'HANDOVER_IN', 'buyer', { buyerId: $('tBuyer').value.trim(), produce_T_C: +$('tInTemp').value }, tsAt(tripStep ?? step()), 'delivered');
    tripStep = null;
    $('tImsg').className = 'msg ok'; $('tImsg').textContent = `✔ Delivered to ${$('tBuyer').value} – the buyer can now check it`;
  }
  function blameTable(st) {
    const leg = (n, who, k) => `<tr><td>${n}</td><td>${who}</td><td class="n">${f1(st.legs[k])} %</td><td class="n">₹${f0(st.loss_INR[k])}</td></tr>`;
    return `<table><tr><th>Leg</th><th>Who held it</th><th class="n">Freshness lost</th><th class="n">₹ lost</th></tr>
      ${leg('Farm (harvest → check-in)', 'farmer', 'farm')}${leg('Storage (cold room)', 'cold-store owner', 'storage')}${leg('Transport', 'transporter', 'transport')}</table>
      <p class="note">₹ lost = kg × base price × freshness lost. Freshness ${f1(st.F_checkin)} % at check-in${st.F_out !== null ? `, ${f1(st.F_out)} % at pick-up` : ''}${st.F_in !== null ? `, ${f1(st.F_in)} % at delivery` : `, ${f1(st.F_now)} % now`}.</p>`;
  }
  function renderTransporter() {
    fillSlipSelect($('tSlip'), b => !['sold', 'void'].includes(b.status));
    $('tTau').textContent = CFG.vehicle_time_constant_h;
    const b = store.batches[tCur];
    $('tOut').disabled = !(b && ['stored', 'partly_removed'].includes(b.status));
    const tr = !!(b && b.status === 'in_transit');
    $('tAdd').disabled = $('tModel').disabled = $('tIn').disabled = !tr;
    const bl = b ? blocksBy[b.slipId] || [] : [];
    if (tr) { const lt = lastT(bl); if (lt !== null && document.activeElement !== $('tInTemp')) $('tInTemp').value = f1(lt); }
    const trips = bl.filter(x => x.type === 'TRANSIT');
    $('tTrip').innerHTML = trips.length ? trips.map(x => `${hhmm(x.ts)} · box ${f1(x.payload.T_box_C)} °C (outside ${f1(x.payload.T_out_C)} °C)`).join('<br>') : 'No transit readings yet.';
    const show = b || store.batches[$('tSlip').value], sb = show ? blocksOf(show.slipId) : [];
    $('tBlame').innerHTML = show && sb.length ? `<b>${esc(show.slipId)}</b>${blameTable(settle(sb))}` : 'Pick a slip.';
  }

  // ------------------------------------------------------------------ BUYER
  async function buyerCheck() {
    const qr = parseQR($('bQR').value) || (store.batches[$('bSlip').value] || {}).qr;
    const ol = $('bChecks'), V = $('bVerdict'), pay = $('bPay');
    ol.innerHTML = ''; pay.innerHTML = '';
    if (!qr || !store.batches[qr.slipId]) { V.className = 'verdict bd'; V.innerHTML = '❌ Unknown slip'; return; }
    const b = store.batches[qr.slipId], bl = withEdits(b.slipId, await store.loadBlocks(b.slipId));
    const li = (cls, t) => { ol.insertAdjacentHTML('beforeend', `<li class="${cls}">${t}</li>`); };
    const v = await verifyQR(qr, b.sigMode), sigOk = v.ok && qr.genesisHash === b.genesisHash;
    li(sigOk ? 'ok' : 'bd', sigOk ? `✔ Slip signature (HMAC-SHA256) is genuine – ${v.how}` : `✖ Slip signature does NOT match – ${v.how}`);
    const ver = T.verifyChain(bl, CFG.reading_interval_s);
    li(ver.valid ? 'ok' : 'bd', ver.valid ? `✔ All ${bl.length} block hashes and links re-computed – unchanged` : `✖ Block #${ver.first_bad}: ${ver.why}`);
    li(ver.gaps.length ? 'wn' : 'ok', ver.gaps.length ? `⚠ ${ver.gaps.length} gap(s) in the 5-min readings (first after block #${ver.gaps[0].after})` : '✔ No gaps in the 5-minute READING sequence');
    const heads = T.dayHeads(bl); let ancBad = null, nAnc = 0;
    for (const a of Object.values(store.anchors)) {
      if (!(b.slipId in a.heads)) continue; nAnc++;
      if (heads[a.day] !== a.heads[b.slipId] || T.dailyAnchor(a.day, a.heads) !== a.anchor) { ancBad = a.day; break; }
    }
    li(ancBad ? 'bd' : 'ok', ancBad ? `✖ Day ${ancBad} does not match its published daily anchor – that day was re-written` :
      nAnc ? `✔ Matches ${nAnc} published daily anchor(s)` : '✔ No daily anchor covers this slip yet');
    const fl = ver.physics_flags;
    li(fl.length ? 'wn' : 'ok', fl.length ? `⚠ ${fl.length} automatic flag(s) in the chain` : '✔ No flags – the readings fit the physics of the room');
    const st = settle(bl);
    const phis = bl.filter(x => x.type === 'READING').map(x => x.physics.phi);
    gauge($('gaugeB'), phis.length ? Math.max(...phis) : 0);
    $('phiTxB').innerHTML = `Highest Φ in this chain. ${phiWord(phis.length ? Math.max(...phis) : 0)}`;
    const link = f => (f && f.alertId ? ` · <a href="${KKStore.link(`alert.html?id=${encodeURIComponent(f.alertId)}`)}">open the investigation</a>` : '');
    if (!sigOk || !ver.valid || ancBad) {
      const where = !sigOk ? 'the slip signature is forged' : !ver.valid ? `broken at block #${ver.first_bad}` : `UTC day ${ancBad} re-written after its anchor was published`;
      const who = !ver.valid ? ver.custody_at_break : 'owner';
      const hf = fl.find(f => f.type === 'HASH');
      V.className = 'verdict bd';
      V.innerHTML = `⛔ EVIDENCE TAMPERED – ${where}<small>Payment <b>FROZEN</b> · penalty mode · custody holder at the break: <b>${esc(who)}</b>${link(hf)}</small>`;
      pay.innerHTML = `<p class="note">Penalty mode: the agreed penalty goes against the ${esc(who)} who held the produce when the record was changed; an inspection decides the rest.</p>`;
    } else if (fl.length || ver.gaps.length) {
      let txt = '';
      if (fl.length) {
        const f = fl[0], a = store.alerts[f.alertId];
        txt = `DATA DOES NOT MATCH PHYSICS from ${hhmm(f.from)} to ${hhmm(a ? a.to_ts : f.raised)} (Φ = ${f1(a ? a.phi_max : f.phi)})<small>Payment <b>ON HOLD</b> · ${esc(f.reason)}${fl.length > 1 ? ` · ${fl.length} flags in total` : ''}${link(f)}</small>`;
      } else txt = `READINGS MISSING<small>Payment <b>ON HOLD</b> · ${ver.gaps.length} gap(s) in the 5-minute readings</small>`;
      V.className = 'verdict wn'; V.innerHTML = '⚠ ' + txt;
      pay.innerHTML = blameTable(st);
    } else {
      const F = st.F_in !== null ? st.F_in : st.F_now, pr = T.price(st.base, F);
      V.className = 'verdict ok';
      V.innerHTML = `✔ RECORD INTACT – freshness ${f1(F)} %<small>${st.damaged ? '❄ freezing damage recorded · ' : ''}price ₹${f1(pr)}/kg × ${st.kg} kg = <b>₹${f0(pr * st.kg)}</b></small>`;
      pay.innerHTML = blameTable(st) + (b.status === 'delivered' ? `<button id="bPayBtn" class="primary">Demo: accept &amp; pay (SALE block)</button>` :
        b.status === 'sold' ? '<p class="msg ok">Paid – SALE block written.</p>' : '<p class="note">Not delivered yet – this is the price if sold now.</p>');
      const btn = $('bPayBtn');
      if (btn) btn.onclick = async () => { await store.setStatus(b.slipId, 'SALE', 'buyer', { freshness_pct: F, price_INR_kg: pr, total_INR: pr * st.kg, loss_INR: st.loss_INR }, tsAt(step()), 'sold'); buyerCheck(); };
    }
    freshChart(st);
  }
  function freshChart(st) {
    const c = st.curve, lab = c.map(p => whenLbl(p.ts)), opt = CROP.freshness.T_opt_C;
    const data = { labels: lab, datasets: [
      { label: 'Freshness F (%)', data: c.map(p => p.F), borderColor: '#0f766e', borderWidth: 2.5, pointRadius: 0, yAxisID: 'y' },
      { label: '8 °C', data: c.map(() => 8), borderWidth: 0, pointRadius: 0, backgroundColor: 'rgba(22,163,74,.12)', fill: '+1', yAxisID: 'y1' },
      { label: '2 °C', data: c.map(() => 2), borderWidth: 0, pointRadius: 0, fill: false, yAxisID: 'y1' },
      { label: `Best ${opt} °C`, data: c.map(() => opt), borderColor: '#16a34a', borderDash: [5, 4], borderWidth: 1.5, pointRadius: 0, yAxisID: 'y1' },
      { label: 'Produce temperature (°C)', data: c.map(p => p.T), borderColor: '#e8590c', borderWidth: 1.5, pointRadius: 0, yAxisID: 'y1' }] };
    cFresh = chart(cFresh, $('cFresh'), data, { y: { min: 0, max: 100, title: { display: true, text: 'Freshness %' } },
      y1: { position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: '°C' } } });
  }
  function renderFreshModel() {
    const f = CROP.freshness, tag = s => /^E/.test(s || '') ? '<span class="chip E">E</span>' : '';
    $('fModel').innerHTML = `<p>Life used per hour = k(T) / ${f.SL_ref_h} h, with k = max(Q10<sup>(T − ${f.T_opt_C})/10</sup>, 1 + a<sub>c</sub>(${CROP.chill_injury_below_C} − T)²)
      (Q10 = ${CROP.Q10}; chilling term only below ${CROP.chill_injury_below_C} °C, a<sub>c</sub> = ${f.chill_a_c_per_K2} ${tag(f.chill_source)}).
      Water loss %/h = K<sub>t</sub>·VPD·(v/1 m/s)<sup>0.5</sup>, K<sub>t</sub> = ${f.K_t_mg_kg_s_MPa} mg/kg·s·MPa ${tag(f.K_t_source)}.
      F = 100 × (1 − life used) × (1 − water loss / ${f.WL_max_pct} %). Core below ${f.T_freeze_C} °C for more than ${f.freeze_minutes_to_damage} min → F capped at ${f.damaged_freshness_pct} % ${tag(f.damaged_source)}.</p>
      <div class="tablewrap"><table><tr><th>${esc(CROP.label)}: 1 hour at</th>${D.life_table.map(r => `<th class="n">${r.T_C} °C</th>`).join('')}</tr>
      <tr><td>= hours of life used</td>${D.life_table.map(r => `<td class="n"><b>${r.hours_of_life.toFixed(2)}</b></td>`).join('')}</tr></table></div>
      <p class="note">Sources: ${esc(f.T_opt_source)} ${esc(f.SL_ref_source)} E = assumption to be checked or measured.</p>`;
  }
  function renderBuyer() {
    const sel = $('bSlip'), had = sel.value;
    fillSlipSelect(sel, () => true);
    if (!had) { const dl = batchList().filter(b => b.status === 'delivered'); if (dl.length) sel.value = dl[dl.length - 1].slipId; }
  }

  function chart(old, canvas, data, scales) {
    if (typeof Chart === 'undefined') return null;
    if (old) { old.data = data; old.update('none'); return old; }
    return new Chart(canvas, { type: 'line', data, options: { animation: false, responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false }, plugins: { legend: { labels: { filter: it => !/^\d °C$/.test(it.text), boxWidth: 12 } } },
      scales: { x: { ticks: { maxTicksLimit: 8, autoSkip: true } }, ...scales } } });
  }

  // ------------------------------------------------------------------ wiring
  let pending = false;
  function schedule() { if (pending) return; pending = true; requestAnimationFrame(() => { pending = false; renderAll(); }); }
  function renderAll() {
    if (!store) return;
    watchAll();
    renderTop(); renderFarmer();
    if (role === 'owner') renderOwner();
    if (role === 'transporter') renderTransporter();
    if (role === 'buyer') renderBuyer();
  }
  function setRole(r) {
    role = r;
    for (const b of document.querySelectorAll('#roles button')) b.classList.toggle('on', b.dataset.role === r);
    for (const v of document.querySelectorAll('.view')) v.classList.toggle('on', v.id === 'v-' + r);
    try { localStorage.setItem(ROLE_KEY, r); } catch (e) { /* ignore */ }
    renderAll();
  }
  async function init() {
    $('honestyO').innerHTML = $('honestyB').innerHTML = `<b>What this proves – honestly.</b> ${HONESTY}<p class="note">${esc(D.generated_note)}
      Φ tuned on the twin's normal 2026 run: ${D.stats.false_flags} false flags in ${Math.round(D.stats.days)} days; the ${CFG.fake_reading_C} °C fake is caught in a median of ${f0(D.stats.fake_detection_all.median_min)} min.
      A door switch stuck on "closed" cannot be caught by physics (a 15 s opening is too little heat) – it needs a second, independent door sensor.</p>`;
    $('fCrop').innerHTML = `<option value="${D.crop_key}">${esc(CROP.label)}</option>`;
    $('fHarv').value = CFG.harvest_to_checkin_h_default !== undefined ? CFG.harvest_to_checkin_h_default : 2;
    $('tpSensor').innerHTML = Object.entries(X.SENSORS).map(([k, v]) => `<option value="${k}">${esc(v.label)}</option>`).join('');
    $('tpAction').innerHTML = Object.entries(X.ACTIONS).map(([k, v]) => `<option value="${k}">${esc(v)}</option>`).join('');
    $('banner') && ($('banner').hidden = true);
    store = await KKStore.get();
    KKStore.banner($('kkBanner'), store);
    store.on(() => schedule());
    const today = dateOf(tsAt(step()));
    $('fOut').value = addDays(today, DWELL_DAYS[D.crop_key] || 7);
    $('rsDate').value = addDays(today, 1); $('ansDate').value = addDays(today, 1);
    $('fKg').oninput = checkQty; $('fGo').onclick = checkIn; $('coGo').onclick = doCheckout; $('rsGo').onclick = reserve; $('ansGo').onclick = answer;
    $('coSlip').onchange = () => { const b = store.batches[$('coSlip').value]; if (b) $('coKg').value = b.kg_stored; };
    for (const b of document.querySelectorAll('#roles button')) b.onclick = () => setRole(b.dataset.role);
    for (const b of document.querySelectorAll('[data-adv]')) b.onclick = async () => { if (!(await advance(+b.dataset.adv))) alert('End of the 3-day twin run – reset the demo to start again.'); };
    $('playBtn').onclick = () => play(!playTimer);
    $('speedSel').onchange = () => { if (playTimer) play(true); };
    $('scenario').onchange = async e => {
      if (!amController()) { e.target.value = scKey(); return; }
      if (activeList().length && !confirm('Changing the scenario restarts the chamber clock for everyone. Continue?')) { e.target.value = scKey(); return; }
      det = null; await store.setCtrl({ uid: store.uid, scenario: e.target.value, step: D.scenarios[e.target.value].checkin_step, updated: new Date().toISOString() });
    };
    $('resetBtn').textContent = 'Demo: reset (admin)';
    $('resetBtn').onclick = async () => {
      if (!confirm('Reset the DEMO chamber CH-DEMO? All demo batches, alerts and bookings go to history (nothing is deleted; a new demo round starts).')) return;
      try { play(false); tamper = null; det = null; await store.resetDemo(); $('slipBox').innerHTML = 'No slip yet – check in first.'; shownSlip = null; } catch (e) { alert(e.message); }
    };
    $('tpStart').onclick = startTamper; $('tpStop').onclick = stopTamper;
    $('oSlip').onchange = renderOwner;
    $('tVerify').onclick = tVerify; $('tOut').onclick = tHandOut;
    $('tAdd').onclick = async () => { const v = parseFloat($('tManual').value); if (!isFinite(v)) { alert('Type the box temperature first.'); return; } await tTransit(v); };
    $('tModel').onclick = async () => { for (let k = 0; k < 120 / CFG.transit_interval_min; k++) await tTransit(); };
    $('tIn').onclick = tHandIn; $('tSlip').onchange = () => { $('tQR').value = ''; tCur = null; $('tVmsg').textContent = ''; renderTransporter(); };
    $('bCheck').onclick = buyerCheck; $('bSlip').onchange = () => { $('bQR').value = ''; };
    if (store.mode === 'offline' && !ctrl()) await store.setCtrl({ uid: store.uid, scenario: 'normal', step: D.scenarios.normal.checkin_step, updated: new Date().toISOString() });
    if (store.mode === 'live' && store.isAdmin() && !ctrl()) await store.setCtrl({ uid: store.uid, scenario: 'normal', step: D.scenarios.normal.checkin_step, updated: new Date().toISOString() });
    renderFreshModel();
    renderKeyNote();
    let r0 = 'farmer'; try { r0 = localStorage.getItem(ROLE_KEY) || 'farmer'; } catch (e) { /* ignore */ }
    const q = new URLSearchParams(location.search).get('role'); if (q) r0 = q;
    setRole(['farmer', 'owner', 'transporter', 'buyer'].includes(r0) ? r0 : 'farmer');
    if (/^https?:$/.test(location.protocol)) {
      const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const to = setTimeout(() => ctl && ctl.abort(), 1500);
      fetch('api/trust/info', ctl ? { signal: ctl.signal } : {}).then(r => r.ok ? r.json() : null).then(j => {
        clearTimeout(to); if (j && j.mode === 'server') { signMode = 'server'; renderKeyNote(); }
      }).catch(() => clearTimeout(to));
    }
    window.__tt = { store: () => store, advance, step, startTamper: (sensor, action) => { $('tpSensor').value = sensor; $('tpAction').value = action; return startTamper(); }, stopTamper, play };
  }
  init();
})();
