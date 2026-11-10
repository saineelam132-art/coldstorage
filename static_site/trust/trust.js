// KoolKisaan – Trust & Trade page (plain script: works from a folder, on Vercel and with the Python server).
// Data: window.TRUST_DATA (python -m twin.trust_nodes), maths: window.TrustCore (trust_core.js).
// Demo ledger is kept in this browser (localStorage). A real deployment keeps it on the server (docs/cloud_architecture.md).
(function () {
  'use strict';
  const D = window.TRUST_DATA, T = window.TrustCore, CFG = D.trust_cfg, CROP = D.crop, PH = CFG.phi;
  const $ = id => document.getElementById(id);
  const STORE = 'kk_trust_v2';
  const DEMO_KEY = 'KOOLKISAAN-DEMO-KEY-public-not-a-secret';
  const CAP = CFG.payload_limit_kg, NB = CFG.bays;
  const HONESTY = 'Hash chain proves data was not changed later. Physics check shows whether the data itself is believable. ' +
    'Neither is a court-level proof alone; together they make cheating hard.';
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const f1 = x => (x === null || x === undefined || !isFinite(x)) ? '–' : (+x).toFixed(1);
  const f0 = x => (x === null || x === undefined || !isFinite(x)) ? '–' : Math.round(x).toLocaleString('en-IN');
  let signMode = 'demo';

  // ------------------------------------------------------------------ state
  function fresh(scenario) {
    const sc = D.scenarios[scenario || 'normal'];
    return { v: 2, scenario: scenario || 'normal', clk: sc.checkin_step, fakeFrom: null, seq: {}, slips: {}, order: [], anchors: {}, tamper: null };
  }
  function load() {
    try { const s = JSON.parse(localStorage.getItem(STORE)); if (s && s.v === 2 && D.scenarios[s.scenario]) return s; } catch (e) { /* private window */ }
    return fresh();
  }
  let S = load();
  function save() { try { localStorage.setItem(STORE, JSON.stringify(S)); } catch (e) { /* storage full or blocked: demo still runs */ } }
  const sc = () => D.scenarios[S.scenario];
  const NSTEP = () => sc().phi.length;

  // ------------------------------------------------------------------ time (twin time is IST; blocks use ISO UTC)
  const t0ms = () => Date.parse(sc().t0.replace(' ', 'T') + '+05:30');
  const tsAt = i => new Date(t0ms() + i * 300e3).toISOString().replace('.000Z', 'Z');
  const ist = (ts) => { const d = new Date(Date.parse(ts) + 5.5 * 3600e3); return d; };
  const hhmm = ts => { const d = ist(ts); return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`; };
  const dayLbl = ts => ist(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
  const whenLbl = ts => `${dayLbl(ts)} ${hhmm(ts)}`;

  // ------------------------------------------------------------------ reported node values (fake readings applied)
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function gauss(r) { return Math.sqrt(-2 * Math.log(r() + 1e-12)) * Math.cos(2 * Math.PI * r()); }
  let cache = null;
  function stream() {
    const key = S.scenario + '|' + S.fakeFrom;
    if (cache && cache.key === key) return cache;
    const s = sc(), n = NSTEP();
    const rep = {
      T_s: s.N1.T_s.slice(), RH_s: s.N1.RH_s, v_s: s.N1.v_s, T_core: s.N2.T_core.slice(), Q_door_kW: s.N3.Q_door_kW,
      T_r: s.N4.T_r.slice(), RH_r: s.N4.RH_r, T_out: s.out.T_out, p_hPa: s.out.p_hPa,
      P_el_kW: s.ctl.P_el_kW, P_fan_kW: s.ctl.P_fan_kW, cop: s.ctl.cop, Q_wax_branch_kW: s.ctl.Q_wax_branch_kW,
      Q_int_kW: s.ctl.Q_int_kW, G_wax_kW_K: s.ctl.G_wax_kW_K, T_pcm: s.ctl.T_pcm, load_event: s.ctl.load_event,
    };
    if (S.fakeFrom !== null) {
      const r = rng(11);
      for (let i = S.fakeFrom; i < n; i++) for (const c of ['T_s', 'T_r', 'T_core']) rep[c][i] = Math.round((CFG.fake_reading_C + CFG.sensor_noise.T_K * gauss(r)) * 100) / 100;
    }
    const res = T.residuals(rep, D.const);
    const { phi, z } = T.phiFrom(res, D.sigma, PH.weights, PH.window_steps);
    const flags = T.phiFlags(phi, PH.red_at, PH.red_steps);
    cache = { key, rep, phi, z, flags };
    return cache;
  }
  function readingPayload(i) {
    const { rep } = stream(), s = sc();
    return { step: i, N1: { T_s: rep.T_s[i], RH_s: rep.RH_s[i], v_m_s: rep.v_s[i] }, N2: { T_core: rep.T_core[i] },
      N3: { open: s.N3.open[i], angle_deg: s.N3.angle_deg[i], Q_door_W: rep.Q_door_kW[i] * 1000 },
      N4: { T_r: rep.T_r[i], RH_r: rep.RH_r[i] }, out: { T_out: rep.T_out[i], RH_out: s.out.RH_out[i] }, P_el_W: rep.P_el_kW[i] * 1000 };
  }
  // flag raised at step r (Φ >= red_at for red_steps readings) is written into the NEXT block (step r + 1)
  function physicsAt(i) {
    const { phi, z, flags } = stream(), out = [];
    for (const [a, b] of flags) {
      const r = a + PH.red_steps - 1;
      if (r === i - 1) {
        let mx = 0; for (let k = a; k <= r; k++) mx = Math.max(mx, phi[k]);
        out.push({ type: 'PHYSICS', from: tsAt(a), raised: tsAt(r), phi: mx, reason: T.phiReason(z, a, r).text });
      }
    }
    return { phi: phi[i], flags: out };
  }

  // ------------------------------------------------------------------ ledger actions
  const stored = () => S.order.map(id => S.slips[id]).filter(x => x.status === 'STORED');
  const used = () => stored().reduce((a, x) => a + x.kg, 0);
  function bayLoads() { const b = Array(NB).fill(0); for (const x of stored()) b[+x.bay.slice(1) - 1] += x.kg; return b; }
  function append(slip, i, type, actor, payload, physics) {
    slip.blocks.push(T.makeBlock(slip.blocks, slip.id, tsAt(i), type, actor, payload, physics));
  }
  function publishAnchor(day) {
    const heads = {};
    for (const id of S.order) { const h = T.dayHeads(S.slips[id].blocks)[day]; if (h) heads[id] = h; }
    if (Object.keys(heads).length) S.anchors[day] = { anchor: T.dailyAnchor(day, heads), heads, published: tsAt(S.clk) };
  }
  function advance(n) {
    let k = 0;
    while (k < n && S.clk < NSTEP() - 1) {
      const d0 = tsAt(S.clk).slice(0, 10);
      S.clk++; k++;
      const d1 = tsAt(S.clk).slice(0, 10);
      if (d1 !== d0) publishAnchor(d0);
      for (const x of stored()) append(x, S.clk, 'READING', 'owner', readingPayload(S.clk), physicsAt(S.clk));
    }
    save();
    return k;
  }
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
  function latestAnchor() { const ks = Object.keys(S.anchors).sort(); return ks.length ? { day: ks[ks.length - 1], ...S.anchors[ks[ks.length - 1]] } : null; }

  // ------------------------------------------------------------------ freshness along a chain
  function settle(slip) {
    const F = new T.Freshness(CROP), b0 = slip.blocks[0], p0 = b0.payload, vOff = CFG.produce_air_speed_fan_off_m_s;
    const curve = [];
    F.step(p0.T_field_C, p0.RH_field_pct, vOff, p0.harvest_h, p0.T_field_C);
    const Fc = F.value;
    curve.push({ ts: b0.ts, F: Fc, T: p0.T_field_C, leg: 'farm' });
    let Fout = null, Fin = null, last = b0, Tbox = null;
    for (const b of slip.blocks.slice(1)) {
      const dt = (Date.parse(b.ts) - Date.parse(last.ts)) / 3600e3, p = b.payload;
      if (b.type === 'READING') {
        const v = p.N1.v_m_s > 0.1 ? CFG.produce_air_speed_fan_on_m_s : vOff;
        F.step(p.N4.T_r, p.N4.RH_r, v, dt, p.N2.T_core);
        curve.push({ ts: b.ts, F: F.value, T: p.N2.T_core, leg: 'storage' });
      } else if (b.type === 'HANDOVER_OUT') { Fout = F.value; Tbox = p.produce_T_C; curve.push({ ts: b.ts, F: Fout, T: Tbox, leg: 'transport' }); }
      else if (b.type === 'TRANSIT') {
        F.step(p.T_box_C, CFG.vehicle_rh_pct, CFG.vehicle_air_speed_m_s, dt, p.T_box_C); Tbox = p.T_box_C;
        curve.push({ ts: b.ts, F: F.value, T: p.T_box_C, leg: 'transport' });
      } else if (b.type === 'HANDOVER_IN') {
        if (dt > 0 && Tbox !== null) F.step(p.produce_T_C, CFG.vehicle_rh_pct, CFG.vehicle_air_speed_m_s, dt, p.produce_T_C);
        Fin = F.value; curve.push({ ts: b.ts, F: Fin, T: p.produce_T_C, leg: 'transport' });
      }
      last = b;
    }
    const Fnow = F.value, kg = p0.kg, base = p0.basePrice_INR_kg;
    const endStore = Fout !== null ? Fout : Fnow, endTrans = Fin !== null ? Fin : Fnow;
    const legs = { farm: 100 - Fc, storage: Fc - endStore, transport: Fout !== null ? Fout - endTrans : 0 };
    const rs = {}; for (const k in legs) rs[k] = kg * base * legs[k] / 100;
    return { F_checkin: Fc, F_out: Fout, F_in: Fin, F_now: Fnow, legs, loss_INR: rs, curve, damaged: F.damaged, kg, base,
      price: T.price(base, Fin !== null ? Fin : Fnow) };
  }

  // ------------------------------------------------------------------ header, clock, key note
  function renderTop() {
    $('clock').textContent = whenLbl(tsAt(S.clk)) + ' IST';
    $('clockTag').innerHTML = `<span class="chip S">S</span>`;
    const sel = $('scenario');
    if (!sel.options.length) for (const [k, v] of Object.entries(D.scenarios)) sel.add(new Option(v.label, k));
    sel.value = S.scenario;
  }
  function renderKeyNote() {
    const n = $('keyNote'); n.hidden = false;
    n.innerHTML = signMode === 'server'
      ? '🔐 Slips are signed on the server (key from the environment variable KOOLKISAAN_HMAC_KEY – never sent to the browser).'
      : `🔑 <b>${esc(CFG.demo_key_note)}</b> This version has no server, so it signs in your browser with a public demo key.`;
  }

  // ------------------------------------------------------------------ FARMER
  function drawLoad() {
    const u = used(), p = u / CAP * 100;
    $('loadKg').textContent = u; $('loadCap').textContent = CAP; $('loadPct').textContent = p.toFixed(0);
    $('fFree').textContent = CAP - u; $('fCap').textContent = CAP;
    const bar = $('loadBar'); bar.style.width = Math.min(100, p) + '%';
    bar.style.background = p >= 100 ? '#dc2626' : p >= CFG.load_warn_frac * 100 ? '#f59e0b' : '#16a34a';
    const w = $('loadWarn'); w.className = 'msg ' + (p >= 100 ? 'bd' : 'wn');
    w.textContent = p >= 100 ? '⛔ FULL – payload limit reached' : p >= CFG.load_warn_frac * 100 ? '⚠ above 80 % – nearly full' : '';
    const bl = bayLoads(), per = CAP / NB;
    $('bays').innerHTML = bl.map((k, i) => {
      const x = (i % 3) * 100 + 5, y = Math.floor(i / 3) * 72 + 4, h = Math.min(k / per, 1) * 60;
      const col = k > per ? '#f59e0b' : '#14b8a6';
      return `<rect x="${x}" y="${y}" width="90" height="64" rx="5" fill="none" stroke="currentColor" opacity=".5"/>
        <rect x="${x + 1}" y="${y + 63 - h}" width="88" height="${h}" fill="${col}" opacity=".5"/>
        <text x="${x + 8}" y="${y + 16}" font-size="12" font-weight="700">B${i + 1}</text><text x="${x + 8}" y="${y + 56}" font-size="11">${k} kg</text>`;
    }).join('');
  }
  function checkQty() {
    const q = +$('fKg').value, free = CAP - used(), m = $('fMsg');
    m.className = 'msg ' + (q > free || q > CAP ? 'bd' : 'wn');
    m.textContent = q > CAP ? `⛔ At most ${CAP} kg per check-in` : q > free ? `⛔ Only ${free} kg free in the room` :
      (used() + q >= CAP * CFG.load_warn_frac ? '⚠ This load takes the room above 80 %' : '');
  }
  async function checkIn() {
    const q = +$('fKg').value, base = +$('fBase').value, name = $('fName').value.trim(), free = CAP - used(), m = $('fMsg');
    if (!name || !(q > 0) || !(base > 0)) { m.className = 'msg bd'; m.textContent = '⛔ Fill in name, quantity and price'; return; }
    if (q > CAP || q > free) { checkQty(); return; }
    $('fGo').disabled = true;
    const bl = bayLoads(), bi = bl.indexOf(Math.min(...bl)), bay = 'B' + (bi + 1);
    const ts = tsAt(S.clk), d = ist(ts), ymd = `${String(d.getUTCFullYear()).slice(2)}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;
    S.seq[ymd] = (S.seq[ymd] || 0) + 1;
    const id = `CT-${ymd}-${String(S.seq[ymd]).padStart(3, '0')}`;
    const s = sc(), anc = latestAnchor();
    const payload = { slipId: id, farmer: name, crop: D.crop_key, kg: q, basePrice_INR_kg: base, bay, harvest_h: Math.max(0, +$('fHarv').value || 0),
      T_field_C: s.out.T_out[S.clk], RH_field_pct: s.out.RH_out[S.clk], lastAnchor: anc ? `${anc.day}:${anc.anchor}` : 'none yet' };
    const slip = { id, bay, kg: q, status: 'STORED', blocks: [] };
    append(slip, S.clk, 'CHECKIN', 'farmer', payload, { phi: 0, flags: [] });
    const { sig, mode } = await signSlip(id, bay, slip.blocks[0].hash);
    slip.qr = { slipId: id, bay, genesisHash: slip.blocks[0].hash, sig };
    slip.sigMode = mode;
    S.slips[id] = slip; S.order.push(id); save();
    $('fGo').disabled = false; m.className = 'msg ok'; m.textContent = `✔ Checked in: ${id} → bay ${bay}`;
    showSlip(slip); renderAll();
  }
  function qrSvg(text) {
    try { const q = qrcode(0, 'M'); q.addData(text); q.make(); return q.createSvgTag({ cellSize: 4, margin: 2, scalable: true }); }
    catch (e) { return '<div class="muted">QR library missing</div>'; }
  }
  function showSlip(slip) {
    const p = slip.blocks[0].payload, qrText = JSON.stringify(slip.qr), when = whenLbl(slip.blocks[0].ts);
    const note = slip.sigMode === 'server' ? 'Signed on the server' : esc(CFG.demo_key_note);
    $('slipBox').innerHTML = `<div class="slip"><div class="qr">${qrSvg(qrText)}</div>
      <div><div class="id">${esc(slip.id)}</div><div class="kv">
        <span>Farmer</span><b>${esc(p.farmer)}</b><span>Produce</span><b>${esc(CROP.label)} · ${p.kg} kg</b>
        <span>Base price</span><b>₹${p.basePrice_INR_kg}/kg at 100 % freshness</b><span>Bay</span><b>${esc(slip.bay)}</b>
        <span>Check-in</span><b>${when} IST</b><span>Genesis hash</span><b class="mono">${slip.blocks[0].hash.slice(0, 24)}…</b>
        <span>Signature</span><b class="mono">${slip.qr.sig.slice(0, 24)}…</b><span>Last daily anchor</span><b class="mono">${esc(String(p.lastAnchor).slice(0, 30))}${String(p.lastAnchor).length > 30 ? '…' : ''}</b>
      </div><p class="note">${note}</p>
      <button id="printBtn">🖨 Print A6 slip</button><button id="copyQR">Copy QR text</button></div></div>`;
    $('printSlip').innerHTML = `<h2>KoolKisaan cold-room slip</h2><div class="id">${esc(slip.id)}</div>
      <div class="qr">${qrSvg(qrText)}</div>
      <div>Farmer: <b>${esc(p.farmer)}</b><br>${esc(CROP.label)} · <b>${p.kg} kg</b> · Bay <b>${esc(slip.bay)}</b><br>
      Base ₹${p.basePrice_INR_kg}/kg (at 100 % freshness)<br>Check-in ${when} IST</div>
      <div class="small">Genesis ${slip.blocks[0].hash}<br>Sig ${slip.qr.sig}<br>Daily anchor ${esc(p.lastAnchor)}<br>${note}</div>`;
    $('printBtn').onclick = () => window.print();
    $('copyQR').onclick = () => { try { navigator.clipboard.writeText(qrText); $('copyQR').textContent = 'Copied ✔'; } catch (e) { /* no clipboard */ } };
  }
  function renderFarmer() {
    drawLoad();
    const rows = S.order.map(id => S.slips[id]).map(x => {
      const st = settle(x);
      return `<tr><td>${esc(x.id)}</td><td>${esc(x.bay)}</td><td class="n">${x.kg}</td><td>${x.status.replace('_', ' ').toLowerCase()}</td>
        <td class="n">${f1(st.F_now)} %</td><td class="n">₹${f1(T.price(st.base, st.F_now))}</td><td class="n">₹${f0(st.kg * T.price(st.base, st.F_now))}</td></tr>`;
    });
    $('fMine').innerHTML = rows.length ? `<div class="tablewrap"><table><tr><th>Slip</th><th>Bay</th><th class="n">kg</th><th>Status</th><th class="n">Freshness now</th><th class="n">Price now</th><th class="n">Value now</th></tr>${rows.join('')}</table></div>
      <p class="note">Freshness from the ledger readings (core temperature, air humidity and air speed) with the model below. Price = base × freshness.</p>` : 'Nothing stored yet.';
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
  function renderOwner() {
    const st = stream(), i = S.clk, p = readingPayload(i), s = sc();
    const fault = s.from_step !== null ? (i >= s.from_step ? ` – fault active since ${whenLbl(tsAt(s.from_step))}` : ` – fault starts ${whenLbl(tsAt(s.from_step))}`) : '';
    $('scenarioNote').innerHTML = `Scenario: <b>${esc(s.label)}</b>${fault}. 3-day twin run from the day before the hottest day of 2026.`;
    gauge($('gauge'), st.phi[i]);
    const lastFlag = st.flags.filter(([a]) => a + PH.red_steps - 1 <= i).pop();
    $('phiTx').innerHTML = `${phiWord(st.phi[i])}<br><span class="note">Φ = √(Σ w·z² / Σ w) over 4 checks (moisture, energy, room heat balance, core lag), 15-min mean.
      Green &lt; ${PH.green_below}, orange ${PH.green_below}–${PH.red_at}, flag when ≥ ${PH.red_at} for ${PH.red_steps} readings.</span>` +
      (lastFlag ? `<div class="alarm wn">Last flag: ${hhmm(tsAt(lastFlag[0]))}–${hhmm(tsAt(Math.min(lastFlag[1], i)))} · ${esc(T.phiReason(st.z, lastFlag[0], lastFlag[0] + PH.red_steps - 1).text)}</div>` : '');
    const node = (t, v, sub, tag) => `<div class="node"><b>${t} <span class="chip ${tag}">${tag}</span></b><span class="v">${v}</span><small>${sub}</small></div>`;
    $('nodes').innerHTML =
      node('N1 supply air', `${f1(p.N1.T_s)} °C`, `RH ${f1(p.N1.RH_s)} % · v ${f1(p.N1.v_m_s)} m/s`, 'S') +
      node('N2 produce core', `${f1(p.N2.T_core)} °C`, `probe in the fruit (lag τ = 4 h / ln 8)`, 'S') +
      node('N3 door', p.N3.open ? 'OPEN' : 'closed', `angle ${p.N3.angle_deg}° · leak ${f0(p.N3.Q_door_W)} W (ASHRAE)`, 'S') +
      node('N4 return air', `${f1(p.N4.T_r)} °C`, `RH ${f1(p.N4.RH_r)} %`, 'S') +
      node('Outside air', `${f1(p.out.T_out)} °C`, `RH ${f0(p.out.RH_out)} %`, 'W') +
      node('Compressor power', `${f0(p.P_el_W)} W`, `${s.ctl.grid_on[i] ? 'GRID backup on' : 'solar / wax'} · wax ${f0(s.ctl.pcm_pct[i])} % frozen`, 'S');
    // 24-h chart
    const a = Math.max(0, i - 287), lab = [], tr = [], tc = [], lo = [], hi = [];
    for (let k = a; k <= i; k++) { lab.push(hhmm(tsAt(k))); tr.push(st.rep.T_r[k]); tc.push(st.rep.T_core[k]); lo.push(2); hi.push(8); }
    const data = { labels: lab, datasets: [
      { label: '8 °C', data: hi, borderWidth: 0, pointRadius: 0, backgroundColor: 'rgba(22,163,74,.12)', fill: '+1' },
      { label: '2 °C', data: lo, borderWidth: 0, pointRadius: 0, fill: false },
      { label: 'Room air N4 (reported)', data: tr, borderColor: '#2a78d6', borderWidth: 2, pointRadius: 0 },
      { label: 'Produce core N2 (reported)', data: tc, borderColor: '#e8590c', borderWidth: 2, pointRadius: 0 }] };
    c24 = chart(c24, $('c24'), data, { y: { title: { display: true, text: '°C' } } });
    // alarms
    const al = [];
    for (const [f, b] of st.flags) { const r = f + PH.red_steps - 1; if (r <= i) al.push(`<div class="alarm wn">⚠ Physics flag ${whenLbl(tsAt(f))}–${hhmm(tsAt(Math.min(b, i)))}: ${esc(T.phiReason(st.z, f, r).text)}</div>`); }
    if (p.N4.T_r > 8) al.push(`<div class="alarm bd">🌡 Room air ${f1(p.N4.T_r)} °C – above 8 °C</div>`);
    if (p.N2.T_core < CROP.freshness.T_freeze_C) al.push(`<div class="alarm bd">❄ Produce core ${f1(p.N2.T_core)} °C – below the freezing point ${CROP.freshness.T_freeze_C} °C</div>`);
    else if (p.N4.T_r < 2) al.push(`<div class="alarm bd">❄ Room air ${f1(p.N4.T_r)} °C – below 2 °C (chilling / freezing risk)</div>`);
    if (p.N3.open) al.push('<div class="alarm wn">🚪 Door open now</div>');
    $('alarms').innerHTML = al.length ? al.slice(-6).join('') : '<div class="alarm ok">✔ No alarms</div>';
    $('fakeC').textContent = f1(CFG.fake_reading_C);
    $('cheatState').innerHTML = (S.fakeFrom !== null ? `<div class="alarm wn">Fake readings ON since ${whenLbl(tsAt(S.fakeFrom))} – advance the clock and watch Φ.</div>` : '') +
      (S.tamper ? `<div class="alarm bd">Block #${S.tamper.index} of ${esc(S.tamper.slipId)} was edited${S.tamper.rehashed ? ' and all later hashes re-made' : ''}. Ask the buyer to check it.</div>` : '');
    $('dFake').textContent = S.fakeFrom !== null ? 'Demo: stop fake readings' : 'Demo: Report fake readings from now on';
    // ledger
    fillSlipSelect($('oSlip'), () => true);
    const slip = S.slips[$('oSlip').value];
    if (!slip) $('ledger').innerHTML = '<p class="muted">No slips yet – a farmer must check in first.</p>';
    else {
      const ver = T.verifyChain(slip.blocks), rows = slip.blocks.slice(-40).reverse().map(b => {
        const bad = ver.first_bad !== null && b.index >= ver.first_bad, fl = (b.physics.flags || []).length;
        return `<tr class="${bad ? 'bad' : fl ? 'flag' : ''}"><td class="n">${b.index}</td><td>${whenLbl(b.ts)}</td><td>${b.type}</td><td>${b.actor}</td><td>${blockSummary(b)}</td>
          <td class="n">${f1(b.physics.phi)}${fl ? ' ⚠' : ''}</td><td class="mono">${b.hash.slice(0, 12)}…</td></tr>`;
      });
      $('ledger').innerHTML = `<p class="note">${slip.blocks.length} blocks · chain ${ver.valid ? '<b class="ok">valid</b>' : `<b class="bd">BROKEN at block #${ver.first_bad}</b>`} · newest first, last 40 shown.</p>
        <table><tr><th class="n">#</th><th>Time (IST)</th><th>Type</th><th>Actor</th><th>Data</th><th class="n">Φ</th><th>Hash</th></tr>${rows.join('')}</table>`;
    }
    const an = Object.entries(S.anchors).sort().reverse();
    $('anchors').innerHTML = an.length ? `<table><tr><th>UTC day</th><th>Anchor</th><th class="n">Slips</th><th>Published</th></tr>${an.map(([d, v]) =>
      `<tr><td>${d}</td><td class="mono">${v.anchor.slice(0, 32)}…</td><td class="n">${Object.keys(v.heads).length}</td><td>${whenLbl(v.published)}</td></tr>`).join('')}</table>` :
      'None yet – the first anchor is published when the clock passes midnight UTC (05:30 IST).';
  }
  function blockSummary(b) {
    const p = b.payload;
    if (b.type === 'READING') return `air ${f1(p.N4.T_r)} · core ${f1(p.N2.T_core)} °C · RH ${f0(p.N4.RH_r)} %${p.N3.open ? ' · door open' : ''}`;
    if (b.type === 'CHECKIN') return `${esc(p.farmer)} · ${p.kg} kg · ₹${p.basePrice_INR_kg}/kg · ${esc(p.bay)}`;
    if (b.type === 'HANDOVER_OUT') return `${esc(p.transporterId)} · ${esc(p.vehicle)} · ${f1(p.produce_T_C)} °C`;
    if (b.type === 'TRANSIT') return `box ${f1(p.T_box_C)} °C · outside ${f1(p.T_out_C)} °C (${p.source})`;
    if (b.type === 'HANDOVER_IN') return `${esc(p.buyerId)} · ${f1(p.produce_T_C)} °C`;
    if (b.type === 'SALE') return `F ${f1(p.freshness_pct)} % · ₹${f1(p.price_INR_kg)}/kg · ₹${f0(p.total_INR)}`;
    return '';
  }
  function fillSlipSelect(sel, keep) {
    const cur = sel.value, ids = S.order.filter(id => keep(S.slips[id]));
    sel.innerHTML = ids.length ? ids.map(id => `<option value="${id}">${id} · ${S.slips[id].status.replace('_', ' ').toLowerCase()}</option>`).join('') : '<option value="">– none –</option>';
    if (ids.includes(cur)) sel.value = cur; else if (ids.length) sel.value = ids[ids.length - 1];
  }
  function editOld(rehash) {
    const slip = S.slips[$('oSlip').value] || stored()[0];
    if (!slip) { alert('No slip yet – check in as the farmer first.'); return; }
    const reads = slip.blocks.filter(b => b.type === 'READING' && b.index < slip.blocks.length - 12);
    if (!reads.length) { alert('Need at least 1 h of readings first – advance the clock.'); return; }
    let tgt = reads.reduce((m, b) => (b.payload.N4.T_r > m.payload.N4.T_r ? b : m), reads[0]);
    if (tgt.payload.N4.T_r < 5.5) tgt = reads[Math.floor(reads.length / 2)];
    tgt.payload.N4.T_r = 5.0; tgt.payload.N2.T_core = 5.0;            // hide a warm spell
    if (rehash) for (let k = tgt.index; k < slip.blocks.length; k++) {
      const b = slip.blocks[k]; b.prevHash = k ? slip.blocks[k - 1].hash : T.GENESIS_PREV; b.hash = T.blockHash(b);
    }
    S.tamper = { slipId: slip.id, index: tgt.index, rehashed: !!rehash }; save(); renderAll();
  }

  // ------------------------------------------------------------------ TRANSPORTER
  let tCur = null;
  function parseQR(txt) { try { const o = JSON.parse(txt); return o && o.slipId ? o : null; } catch (e) { return null; } }
  async function tVerify() {
    const qr = parseQR($('tQR').value) || (S.slips[$('tSlip').value] || {}).qr, m = $('tVmsg');
    tCur = null; $('tOut').disabled = true;
    if (!qr) { m.className = 'msg bd'; m.textContent = '❌ Not a valid QR text'; return; }
    const slip = S.slips[qr.slipId];
    if (!slip) { m.className = 'msg bd'; m.textContent = '❌ Slip ID not found in this ledger'; return; }
    const v = await verifyQR(qr, slip.sigMode);
    if (!v.ok || qr.genesisHash !== slip.blocks[0].hash || qr.bay !== slip.bay) {
      m.className = 'msg bd'; m.textContent = `❌ INVALID slip – signature or genesis does not match (${v.how}). Do not load.`; return;
    }
    tCur = slip.id; m.className = 'msg ok'; m.textContent = `✔ Genuine slip ${slip.id} · bay ${slip.bay} · ${slip.kg} kg (${v.how})`;
    $('tTemp').value = f1(stream().rep.T_core[S.clk]);
    renderTransporter();
  }
  function tHandOut() {
    const slip = S.slips[tCur]; if (!slip || slip.status !== 'STORED') return;
    append(slip, S.clk, 'HANDOVER_OUT', 'transporter', { transporterId: $('tId').value.trim(), vehicle: $('tVeh').value.trim(), produce_T_C: +$('tTemp').value }, { phi: stream().phi[S.clk], flags: [] });
    slip.status = 'IN_TRANSIT'; save(); $('tOmsg').className = 'msg ok'; $('tOmsg').textContent = `✔ ${slip.id} handed over at ${whenLbl(tsAt(S.clk))} – bay ${slip.bay} is free again`;
    renderAll();
  }
  function lastT(slip) { for (let k = slip.blocks.length - 1; k >= 0; k--) { const p = slip.blocks[k].payload; if (p.T_box_C !== undefined) return p.T_box_C; if (p.produce_T_C !== undefined) return p.produce_T_C; } return null; }
  function tTransit(manualT) {
    const slip = S.slips[tCur]; if (!slip || slip.status !== 'IN_TRANSIT') return;
    const n = CFG.transit_interval_min / 5;
    if (advance(n) < n) { alert('End of the 3-day twin run – reset the demo to drive again.'); }
    const To = sc().out.T_out[S.clk], prev = lastT(slip);
    const Tb = manualT !== undefined ? manualT : To + (prev - To) * Math.exp(-(CFG.transit_interval_min / 60) / CFG.vehicle_time_constant_h);
    append(slip, S.clk, 'TRANSIT', 'transporter', { T_box_C: Tb, T_out_C: To, source: manualT !== undefined ? 'manual' : 'vehicle model (E)' }, { phi: 0, flags: [] });
    save();
  }
  function tHandIn() {
    const slip = S.slips[tCur]; if (!slip || slip.status !== 'IN_TRANSIT') return;
    append(slip, S.clk, 'HANDOVER_IN', 'buyer', { buyerId: $('tBuyer').value.trim(), produce_T_C: +$('tInTemp').value }, { phi: 0, flags: [] });
    slip.status = 'DELIVERED'; save(); $('tImsg').className = 'msg ok'; $('tImsg').textContent = `✔ Delivered to ${$('tBuyer').value} – the buyer can now check it`;
    renderAll();
  }
  function blameTable(st) {
    const leg = (n, who, k) => `<tr><td>${n}</td><td>${who}</td><td class="n">${f1(st.legs[k])} %</td><td class="n">₹${f0(st.loss_INR[k])}</td></tr>`;
    return `<table><tr><th>Leg</th><th>Who held it</th><th class="n">Freshness lost</th><th class="n">₹ lost</th></tr>
      ${leg('Farm (harvest → check-in)', 'farmer', 'farm')}${leg('Storage (cold room)', 'cold-store owner', 'storage')}${leg('Transport', 'transporter', 'transport')}</table>
      <p class="note">₹ lost = kg × base price × freshness lost. Freshness ${f1(st.F_checkin)} % at check-in${st.F_out !== null ? `, ${f1(st.F_out)} % at pick-up` : ''}${st.F_in !== null ? `, ${f1(st.F_in)} % at delivery` : `, ${f1(st.F_now)} % now`}.</p>`;
  }
  function renderTransporter() {
    fillSlipSelect($('tSlip'), x => x.status !== 'SOLD');
    $('tTau').textContent = CFG.vehicle_time_constant_h;
    const slip = S.slips[tCur];
    $('tOut').disabled = !(slip && slip.status === 'STORED');
    const tr = !!(slip && slip.status === 'IN_TRANSIT');
    $('tAdd').disabled = $('tModel').disabled = $('tIn').disabled = !tr;
    if (tr) { const lt = lastT(slip); if (lt !== null && document.activeElement !== $('tInTemp')) $('tInTemp').value = f1(lt); }
    const trips = slip ? slip.blocks.filter(b => b.type === 'TRANSIT') : [];
    $('tTrip').innerHTML = trips.length ? trips.map(b => `${hhmm(b.ts)} · box ${f1(b.payload.T_box_C)} °C (outside ${f1(b.payload.T_out_C)} °C)`).join('<br>') : 'No transit readings yet.';
    const show = slip || S.slips[$('tSlip').value];
    $('tBlame').innerHTML = show ? `<b>${esc(show.id)}</b>${blameTable(settle(show))}` : 'Pick a slip.';
  }

  // ------------------------------------------------------------------ BUYER
  async function buyerCheck() {
    const qr = parseQR($('bQR').value) || (S.slips[$('bSlip').value] || {}).qr;
    const ol = $('bChecks'), V = $('bVerdict'), pay = $('bPay');
    ol.innerHTML = ''; pay.innerHTML = '';
    if (!qr || !S.slips[qr.slipId]) { V.className = 'verdict bd'; V.innerHTML = '❌ Unknown slip'; return; }
    const slip = S.slips[qr.slipId], li = (cls, t) => { ol.insertAdjacentHTML('beforeend', `<li class="${cls}">${t}</li>`); };
    // 1 signature
    const v = await verifyQR(qr, slip.sigMode), sigOk = v.ok && qr.genesisHash === slip.blocks[0].hash && qr.bay === slip.bay;
    li(sigOk ? 'ok' : 'bd', sigOk ? `✔ Slip signature (HMAC-SHA256) is genuine – ${v.how}` : `✖ Slip signature does NOT match – ${v.how}`);
    // 2 hashes
    const ver = T.verifyChain(slip.blocks, CFG.reading_interval_s);
    li(ver.valid ? 'ok' : 'bd', ver.valid ? `✔ All ${slip.blocks.length} block hashes and links re-computed – unchanged` : `✖ Block #${ver.first_bad}: ${ver.why}`);
    // 3 gaps
    li(ver.gaps.length ? 'wn' : 'ok', ver.gaps.length ? `⚠ ${ver.gaps.length} gap(s) in the 5-min readings (first after block #${ver.gaps[0].after})` : '✔ No gaps in the 5-minute READING sequence');
    // 4 anchors
    const heads = T.dayHeads(slip.blocks); let ancBad = null, nAnc = 0;
    for (const [day, a] of Object.entries(S.anchors)) {
      if (!(slip.id in a.heads)) continue; nAnc++;
      if (heads[day] !== a.heads[slip.id] || T.dailyAnchor(day, a.heads) !== a.anchor) { ancBad = day; break; }
    }
    li(ancBad ? 'bd' : 'ok', ancBad ? `✖ Day ${ancBad} does not match its published daily anchor – that day was re-written` :
      nAnc ? `✔ Matches ${nAnc} published daily anchor(s)` : '✔ No daily anchor covers this slip yet (checked when one is published)');
    // 5 physics
    const fl = ver.physics_flags;
    li(fl.length ? 'wn' : 'ok', fl.length ? `⚠ ${fl.length} physics flag(s) in the chain` : '✔ No physics flags – the readings fit the physics of the room');
    const st = settle(slip);
    const custodyAt = idx => { let c = 'farmer'; for (const b of slip.blocks.slice(0, idx + 1)) c = T.CUSTODY[b.type] || c; return c; };
    const phis = slip.blocks.filter(b => b.type === 'READING').map(b => b.physics.phi);
    gauge($('gaugeB'), phis.length ? Math.max(...phis) : 0);
    $('phiTxB').innerHTML = `Highest Φ in this chain. ${phiWord(phis.length ? Math.max(...phis) : 0)}`;
    if (!sigOk || !ver.valid || ancBad) {
      let where, who;
      if (!sigOk) { where = 'the slip signature is forged'; who = 'farmer / slip holder'; }
      else if (!ver.valid) { where = `broken at block #${ver.first_bad}`; who = ver.custody_at_break; }
      else {
        const inDay = slip.blocks.filter(b => b.ts.slice(0, 10) === ancBad);
        where = `UTC day ${ancBad} (blocks #${inDay[0].index}–#${inDay[inDay.length - 1].index}) re-written after its anchor was published`;
        who = custodyAt(inDay[inDay.length - 1].index);
      }
      V.className = 'verdict bd';
      V.innerHTML = `⛔ EVIDENCE TAMPERED – ${where}<small>Payment <b>FROZEN</b> · penalty mode · custody holder at the break: <b>${esc(who)}</b></small>`;
      pay.innerHTML = `<p class="note">Penalty mode: the agreed penalty goes against the ${esc(who)} who held the produce when the record was changed; an inspection decides the rest.</p>`;
    } else if (fl.length || ver.gaps.length) {
      let txt = '';
      if (fl.length) {
        const f = fl[0], fromI = slip.blocks.findIndex(b => b.ts === f.raised) + 1;
        let to = f.raised, mx = f.phi;
        for (const b of slip.blocks.slice(Math.max(1, fromI))) { if (b.type !== 'READING' || b.physics.phi < PH.green_below) break; to = b.ts; mx = Math.max(mx, b.physics.phi); }
        txt = `DATA DOES NOT MATCH PHYSICS from ${hhmm(f.from)} to ${hhmm(to)} (Φ = ${f1(mx)})<small>Payment <b>ON HOLD</b> · ${esc(f.reason)}${fl.length > 1 ? ` · ${fl.length} flags in total` : ''}</small>`;
      } else txt = `READINGS MISSING<small>Payment <b>ON HOLD</b> · ${ver.gaps.length} gap(s) in the 5-minute readings</small>`;
      V.className = 'verdict wn'; V.innerHTML = '⚠ ' + txt;
      pay.innerHTML = blameTable(st);
    } else {
      const F = st.F_in !== null ? st.F_in : st.F_now, pr = T.price(st.base, F);
      V.className = 'verdict ok';
      V.innerHTML = `✔ RECORD INTACT – freshness ${f1(F)} %<small>${st.damaged ? '❄ freezing damage recorded · ' : ''}price ₹${f1(pr)}/kg × ${st.kg} kg = <b>₹${f0(pr * st.kg)}</b></small>`;
      const sold = slip.status === 'SOLD';
      pay.innerHTML = blameTable(st) + (slip.status === 'DELIVERED' ? `<button id="bPayBtn" class="primary">Demo: accept &amp; pay (SALE block)</button>` :
        sold ? '<p class="msg ok">Paid – SALE block written.</p>' : '<p class="note">Not delivered yet – this is the price if sold now.</p>');
      const btn = $('bPayBtn');
      if (btn) btn.onclick = () => {
        append(slip, S.clk, 'SALE', 'buyer', { freshness_pct: F, price_INR_kg: pr, total_INR: pr * st.kg, loss_INR: st.loss_INR }, { phi: 0, flags: [] });
        slip.status = 'SOLD'; save(); renderAll(); buyerCheck();
      };
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
    if (!had) { const dl = S.order.filter(id => S.slips[id].status === 'DELIVERED'); if (dl.length) sel.value = dl[dl.length - 1]; }
  }

  // ------------------------------------------------------------------ charts
  function chart(old, canvas, data, scales) {
    if (typeof Chart === 'undefined') return null;
    if (old) { old.data = data; old.update('none'); return old; }
    return new Chart(canvas, { type: 'line', data, options: { animation: false, responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false }, plugins: { legend: { labels: { filter: it => !/^\d °C$/.test(it.text), boxWidth: 12 } } },
      scales: { x: { ticks: { maxTicksLimit: 8, autoSkip: true } }, ...scales } } });
  }

  // ------------------------------------------------------------------ wiring
  let role = 'farmer';
  function renderAll() {
    renderTop(); renderFarmer();
    if (role === 'owner') renderOwner();
    if (role === 'transporter') renderTransporter();
    if (role === 'buyer') renderBuyer();
  }
  function setRole(r) {
    role = r;
    for (const b of document.querySelectorAll('#roles button')) b.classList.toggle('on', b.dataset.role === r);
    for (const v of document.querySelectorAll('.view')) v.classList.toggle('on', v.id === 'v-' + r);
    try { localStorage.setItem(STORE + '_role', r); } catch (e) { /* ignore */ }
    renderAll();
  }
  function init() {
    $('honestyO').innerHTML = $('honestyB').innerHTML = `<b>What this proves – honestly.</b> ${HONESTY}<p class="note">${esc(D.generated_note)}
      Φ tuned on the twin's normal 2026 run: ${D.stats.false_flags} false flags in ${Math.round(D.stats.days)} days; the ${CFG.fake_reading_C} °C fake is caught in a median of ${f0(D.stats.fake_detection_all.median_min)} min.</p>`;
    $('fCrop').innerHTML = `<option value="${D.crop_key}">${esc(CROP.label)}</option>`;
    $('fHarv').value = CFG.harvest_to_checkin_h_default !== undefined ? CFG.harvest_to_checkin_h_default : 2;
    $('fKg').oninput = checkQty; $('fGo').onclick = checkIn;
    for (const b of document.querySelectorAll('#roles button')) b.onclick = () => setRole(b.dataset.role);
    for (const b of document.querySelectorAll('[data-adv]')) b.onclick = () => { if (!advance(+b.dataset.adv)) alert('End of the 3-day twin run – use “Demo: reset” to start again.'); renderAll(); };
    $('scenario').onchange = e => {
      if (S.order.length && !confirm('Changing the scenario starts a new demo (all demo slips are cleared). Continue?')) { e.target.value = S.scenario; return; }
      S = fresh(e.target.value); cache = null; save(); renderAll();
    };
    $('resetBtn').onclick = () => { if (confirm('Delete all demo slips and start again?')) { S = fresh(S.scenario); cache = null; save(); $('slipBox').innerHTML = 'No slip yet – check in first.'; renderAll(); } };
    $('dEdit').onclick = () => editOld(false);
    $('dFake').onclick = () => { S.fakeFrom = S.fakeFrom === null ? Math.min(S.clk + 1, NSTEP() - 1) : null; cache = null; save(); renderAll(); };
    $('oSlip').onchange = renderOwner;
    $('tVerify').onclick = tVerify; $('tOut').onclick = tHandOut;
    $('tAdd').onclick = () => { const v = parseFloat($('tManual').value); if (!isFinite(v)) { alert('Type the box temperature first.'); return; } tTransit(v); renderAll(); };
    $('tModel').onclick = () => { for (let k = 0; k < 120 / CFG.transit_interval_min; k++) tTransit(); renderAll(); };
    $('tIn').onclick = tHandIn; $('tSlip').onchange = () => { $('tQR').value = ''; tCur = null; $('tVmsg').textContent = ''; renderTransporter(); };
    $('bCheck').onclick = buyerCheck; $('bSlip').onchange = () => { $('bQR').value = ''; };
    // the smarter cheat (re-hash everything after the edit) – caught by the daily anchor
    $('dEdit').insertAdjacentHTML('afterend', ' <button id="dEdit2" class="danger" title="Edit, then re-make every later hash so the chain looks valid">Demo: edit + re-hash the chain</button>');
    $('dEdit2').onclick = () => editOld(true);
    renderFreshModel();
    renderKeyNote();
    let r0 = 'farmer'; try { r0 = localStorage.getItem(STORE + '_role') || 'farmer'; } catch (e) { /* ignore */ }
    const q = new URLSearchParams(location.search).get('role'); if (q) r0 = q;
    setRole(['farmer', 'owner', 'transporter', 'buyer'].includes(r0) ? r0 : 'farmer');
    const last = S.order.length ? S.slips[S.order[S.order.length - 1]] : null; if (last) showSlip(last);
    // server signing if the Python server is running (not on file:// or the static Vercel copy)
    if (/^https?:$/.test(location.protocol)) {
      const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const to = setTimeout(() => ctl && ctl.abort(), 1500);
      fetch('api/trust/info', ctl ? { signal: ctl.signal } : {}).then(r => r.ok ? r.json() : null).then(j => {
        clearTimeout(to); if (j && j.mode === 'server') { signMode = 'server'; renderKeyNote(); }
      }).catch(() => clearTimeout(to));
    }
  }
  init();
})();
