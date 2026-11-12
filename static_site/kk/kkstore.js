// KoolKisaan shared data (plain script -> window.KKStore). One API, two backends:
//   LIVE    Cloud Firestore (Firebase project of the site) + Anonymous Auth. Shared by every device, saved, real-time
//           (onSnapshot). Config from Firebase Hosting's /__/firebase/init.json (or ?emu=host:port for the emulator).
//   OFFLINE when Firestore cannot be reached (file://, Vercel, no network): this browser only, banner
//           "Offline demo – changes not saved".
// Collections: chambers/{ch}  batches/{slipId}  batches/{slipId}/blocks/{index}  telemetry/{ch}/readings/{step}
//              anchors/{ch_date}  alerts/{id}  reservations/{id}  audit/{id}  demo_edits/{id}
// The ledger is append-only (firestore.rules): a block can only be created at head+1 with the right prevHash;
// nothing is ever updated or deleted. "Reset demo" starts a new epoch for CH-DEMO; old data stays.
(function (root) {
  'use strict';
  const CH = 'CH-DEMO';
  const T = () => root.TrustCore;
  const LS = 'kk_store_offline_v1';
  const pad = n => String(n).padStart(2, '0');
  const now = () => new Date().toISOString();
  const BAYS = ['B1', 'B2', 'B3', 'B4', 'B5', 'B6'];

  function defaultChamber(uid) {
    return { chamberId: CH, name: 'KoolKisaan demo chamber', capacity_kg: 150, bay_limit_kg: 30, bays: Object.fromEntries(BAYS.map(b => [b, 0])),
      stored_kg: 0, epoch: 1, seq: {}, admins: uid ? [uid] : [], demo: true, ctrl: null, created: now(), updated: now() };
  }

  // bay allocation: least-loaded bays first, a slip may spread over several bays (each bay <= limit)
  function allocate(ch, kg) {
    const load = { ...ch.bays }, out = {};
    let left = kg;
    while (left > 1e-9) {
      const free = BAYS.filter(b => load[b] < ch.bay_limit_kg - 1e-9).sort((a, b) => load[a] - load[b]);
      if (!free.length) return null;
      const b = free[0], put = Math.min(left, ch.bay_limit_kg - load[b]);
      load[b] += put; out[b] = (out[b] || 0) + put; left -= put;
    }
    return { bays: out, load };
  }
  // take kg out of the bays a slip uses (largest share first)
  function release(ch, slipBays, kg) {
    const load = { ...ch.bays }, sb = { ...slipBays };
    let left = kg;
    for (const b of Object.keys(sb).sort((a, c) => sb[c] - sb[a])) {
      const take = Math.min(left, sb[b]);
      sb[b] = Math.round((sb[b] - take) * 1000) / 1000; load[b] = Math.max(0, Math.round((load[b] - take) * 1000) / 1000); left -= take;
      if (sb[b] <= 1e-9) delete sb[b];
      if (left <= 1e-9) break;
    }
    return { load, slipBays: sb };
  }
  const bayLabel = bays => Object.keys(bays).sort().join('+') || '–';

  // ------------------------------------------------------------------ base (events, validation, shared logic)
  class Base {
    constructor() { this.fns = new Set(); this.ch = null; this.batches = {}; this.alerts = {}; this.res = {}; this.anchors = {}; this.blocksBy = {}; this.tele = []; this.lastUpdate = null; }
    on(fn) { this.fns.add(fn); return () => this.fns.delete(fn); }
    emit(what) { this.lastUpdate = new Date(); this.fns.forEach(f => { try { f(what, this); } catch (e) { console.error(e); } }); }
    isAdmin() { return !!(this.ch && this.uid && (this.ch.admins || []).includes(this.uid)); }
    active() { return Object.values(this.batches).filter(b => b.status === 'stored' || b.status === 'partly_removed'); }
    newSlipId(ch, ts) {
      const d = new Date(Date.parse(ts) + 5.5 * 3600e3), ymd = `${String(d.getUTCFullYear()).slice(2)}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`;
      const n = ((ch.seq || {})[ymd] || 0) + 1;
      return { id: `CT-${ymd}-${String(n).padStart(3, '0')}`, ymd, n };
    }
    // produce leaves the room: CHECKOUT (part or all), hand-over to the transporter, or VOID (owner) – frees bay space
    checkout(slipId, kg, actor, ts) {
      const left = b => Math.round((b.kg_stored - kg) * 1000) / 1000;
      return this.appendBlock(slipId, 'CHECKOUT', actor, b => {
        if (!(kg > 0) || kg > b.kg_stored + 1e-9) throw new Error(`You can take out at most ${b.kg_stored} kg`);
        return { kg, kg_left: left(b) };
      }, { phi: 0, flags: [] }, ts, (b, ch) => {
        const r = release(ch, b.bays, kg), l = left(b);
        return { kg_stored: l, bays: r.slipBays, bay: bayLabel(r.slipBays), status: l <= 1e-9 ? 'removed' : 'partly_removed', out_ts: l <= 1e-9 ? ts : null };
      }, (b, ch) => { const r = release(ch, b.bays, kg); return { bays: r.load, stored_kg: Math.max(0, Math.round((ch.stored_kg - kg) * 1000) / 1000) }; });
    }
    leaveRoom(slipId, type, actor, payload, ts, status, extra) {
      return this.appendBlock(slipId, type, actor, b => ({ ...payload, kg: b.kg_stored }), { phi: 0, flags: [] }, ts,
        b => ({ status, kg_stored: 0, bays: {}, bay: '–', out_ts: ts, ...(extra || {}) }),
        (b, ch) => { const r = release(ch, b.bays, b.kg_stored); return { bays: r.load, stored_kg: Math.max(0, Math.round((ch.stored_kg - b.kg_stored) * 1000) / 1000) }; });
    }
    voidBatch(slipId, reason, ts) {
      if (!this.isAdmin()) return Promise.reject(new Error('Only the owner can void a batch'));
      return this.leaveRoom(slipId, 'VOID', 'owner', { reason }, ts, 'void', { void_reason: reason });
    }
    setStatus(slipId, type, actor, payload, ts, status, physics) {
      return this.appendBlock(slipId, type, actor, payload, physics || { phi: 0, flags: [] }, ts, { status });
    }
    checkinPlan(ch, kg) {
      if (!(kg > 0)) throw new Error('Quantity must be more than 0 kg');
      if (kg > ch.capacity_kg) throw new Error(`At most ${ch.capacity_kg} kg per check-in`);
      const free = ch.capacity_kg - ch.stored_kg;
      if (kg > free + 1e-9) throw new Error(`Only ${Math.round(free * 10) / 10} kg free in the room`);
      const a = allocate(ch, kg);
      if (!a) throw new Error('No bay has space left');
      return a;
    }
  }

  // ------------------------------------------------------------------ OFFLINE backend (this browser only)
  class Offline extends Base {
    constructor() {
      super(); this.mode = 'offline'; this.uid = 'offline-device';
      try { this.bc = new BroadcastChannel('kk-store'); this.bc.onmessage = () => { this.load(); this.emit('all'); }; if (this.bc.unref) this.bc.unref(); } catch (e) { this.bc = null; }
      this.load();
    }
    load() {
      let s = null;
      try { s = JSON.parse(localStorage.getItem(LS)); } catch (e) { s = null; }
      s = s || { ch: defaultChamber(this.uid), batches: {}, blocks: {}, alerts: {}, res: {}, anchors: {}, tele: [], audit: [], edits: [] };
      this.s = s; this.ch = s.ch; this.batches = s.batches; this.alerts = s.alerts; this.res = s.res; this.anchors = s.anchors; this.tele = s.tele;
      this.blocksBy = s.blocks;
    }
    save(what) {
      try { localStorage.setItem(LS, JSON.stringify(this.s)); } catch (e) { /* storage full or blocked */ }
      if (this.bc) this.bc.postMessage(what);
      this.emit(what);
    }
    cur(fn) { return fn(this.s); }
    async checkIn(o) {
      const ch = this.s.ch, a = this.checkinPlan(ch, o.kg), sid = this.newSlipId(ch, o.ts);
      const blocks = [];
      const payload = { ...o.payload, slipId: sid.id, kg: o.kg, bays: a.bays, bay: bayLabel(a.bays) };
      blocks.push(T().makeBlock(blocks, sid.id, o.ts, 'CHECKIN', 'farmer', payload, { phi: 0, flags: [] }));
      const b0 = blocks[0];
      ch.seq = { ...(ch.seq || {}), [sid.ymd]: sid.n }; ch.bays = a.load; ch.stored_kg = Math.round((ch.stored_kg + o.kg) * 1000) / 1000; ch.updated = now();
      const batch = { slipId: sid.id, chamberId: CH, epoch: ch.epoch, farmer: payload.farmer, crop: payload.crop, kg: o.kg, kg_stored: o.kg, bays: a.bays,
        bay: bayLabel(a.bays), status: 'stored', checkin_ts: o.ts, expected_out: o.expected_out || null, basePrice: payload.basePrice_INR_kg,
        genesisHash: b0.hash, head: { index: 0, hash: b0.hash }, sigMode: 'demo', created: now() };
      this.s.batches[sid.id] = batch; this.s.blocks[sid.id] = blocks;
      this.save('batches');
      return batch;
    }
    async setSig(slipId, qr, sigMode) { const b = this.s.batches[slipId]; b.qr = qr; b.sig = qr.sig; b.sigMode = sigMode; this.save('batches'); }
    async appendBlock(slipId, type, actor, payload, physics, ts, patch, chPatch) {
      const bl = this.s.blocks[slipId] = this.s.blocks[slipId] || [];
      const b = this.s.batches[slipId];
      const pl = typeof payload === 'function' ? payload(b, this.s.ch) : payload;
      const blk = T().makeBlock(bl, slipId, ts, type, actor, pl, physics);
      bl.push(blk);
      b.head = { index: blk.index, hash: blk.hash };
      const chp = chPatch ? chPatch(b, this.s.ch) : null;
      if (patch) Object.assign(b, typeof patch === 'function' ? patch(b, this.s.ch) : patch);
      if (chp) Object.assign(this.s.ch, chp, { updated: now() });
      this.save('blocks:' + slipId);
      return blk;
    }
    async loadBlocks(slipId) { return this.s.blocks[slipId] || []; }
    watchBlocks(slipId, cb) { cb(this.s.blocks[slipId] || []); return this.on(w => { if (w === 'all' || w === 'blocks:' + slipId || w === 'batches') cb(this.s.blocks[slipId] || []); }); }
    async addTelemetry(r) { this.s.tele.push(r); if (this.s.tele.length > 3000) this.s.tele.splice(0, this.s.tele.length - 3000); this.save('telemetry'); }
    async createAlert(a) { const id = a.id || `AL-${Date.now().toString(36)}`; this.s.alerts[id] = { ...a, id, chamberId: CH, epoch: this.s.ch.epoch, created: now() }; this.save('alerts'); return id; }
    async updateAlert(id, f) { Object.assign(this.s.alerts[id], f); this.save('alerts'); }
    async putAnchor(day, a) { this.s.anchors[day] = { ...a, day, epoch: this.s.ch.epoch }; this.save('anchors'); }
    async reserve(r) { const id = `RS-${Date.now().toString(36)}`; this.s.res[id] = { ...r, id, chamberId: CH, epoch: this.s.ch.epoch, created: now() }; this.save('reservations'); return id; }
    async decideReservation(id, status) { if (!this.isAdmin()) throw new Error('Only the owner can decide'); this.s.res[id].status = status; this.s.res[id].decided = now(); this.save('reservations'); }
    async setCtrl(c) { this.s.ch.ctrl = c; this.save('chamber'); }
    async demoEdit(e) { (this.s.edits = this.s.edits || []).push({ ...e, epoch: this.s.ch.epoch }); this.save('edits'); }
    edits() { return (this.s.edits || []).filter(e => e.epoch === this.s.ch.epoch); }
    async audit(e) { (this.s.audit = this.s.audit || []).push({ ...e, ts: now() }); }
    async resetDemo() {
      if (!this.isAdmin()) throw new Error('Only the owner can reset the demo');
      const ep = this.s.ch.epoch + 1;
      this.s = { ch: { ...defaultChamber(this.uid), epoch: ep }, batches: {}, blocks: {}, alerts: {}, res: {}, anchors: {}, tele: [], audit: [], edits: [] };
      this.load(); this.save('all');
    }
  }

  // ------------------------------------------------------------------ LIVE backend (Cloud Firestore)
  class Live extends Base {
    constructor(F, app, db, auth, uid) { super(); this.mode = 'live'; this.F = F; this.db = db; this.auth = auth; this.uid = uid; this.unsub = []; this._edits = []; }
    ref(...p) { return this.F.doc(this.db, ...p); }
    async start() {
      const F = this.F, chRef = this.ref('chambers', CH);
      const snap = await F.getDoc(chRef);
      if (!snap.exists()) { try { await F.setDoc(chRef, defaultChamber(this.uid)); } catch (e) { /* someone else created it first */ } }
      await new Promise(ok => {
        let first = true;
        this.unsub.push(F.onSnapshot(chRef, s => {
          const prevEpoch = this.ch && this.ch.epoch;
          this.ch = s.data();
          if (this.ch && this.ch.epoch !== prevEpoch) this.subscribeEpoch();
          this.emit('chamber');
          if (first) { first = false; ok(); }
        }, () => ok()));
      });
    }
    subscribeEpoch() {
      const F = this.F, ep = this.ch.epoch;
      (this.epochUnsub || []).forEach(u => u());
      this.epochUnsub = [];
      this.batches = {}; this.alerts = {}; this.res = {}; this.anchors = {}; this.tele = []; this._edits = [];
      const q = (c, ...w) => F.query(F.collection(this.db, c), F.where('chamberId', '==', CH), F.where('epoch', '==', ep), ...w);
      const map = (name, target) => s => { s.docChanges().forEach(c => { if (c.type === 'removed') delete this[target][c.doc.id]; else this[target][c.doc.id] = c.doc.data(); }); this.emit(name); };
      this.epochUnsub.push(F.onSnapshot(q('batches'), map('batches', 'batches')));
      this.epochUnsub.push(F.onSnapshot(q('alerts'), map('alerts', 'alerts')));
      this.epochUnsub.push(F.onSnapshot(q('reservations'), map('reservations', 'res')));
      this.epochUnsub.push(F.onSnapshot(q('anchors'), map('anchors', 'anchors')));
      this.epochUnsub.push(F.onSnapshot(q('demo_edits'), s => { this._edits = s.docs.map(d => d.data()); this.emit('edits'); }));
      this.epochUnsub.push(F.onSnapshot(F.query(F.collection(this.db, 'telemetry', CH, 'readings'), F.where('epoch', '==', ep)), s => {
        s.docChanges().forEach(c => { if (c.type === 'added') this.tele.push(c.doc.data()); });
        this.tele.sort((a, b) => a.step - b.step);
        if (this.tele.length > 3000) this.tele.splice(0, this.tele.length - 3000);
        this.emit('telemetry');
      }));
    }
    edits() { return this._edits; }
    async checkIn(o) {
      const F = this.F, chRef = this.ref('chambers', CH);
      return F.runTransaction(this.db, async tx => {
        const ch = (await tx.get(chRef)).data();
        const a = this.checkinPlan(ch, o.kg), sid = this.newSlipId(ch, o.ts);
        const payload = { ...o.payload, slipId: sid.id, kg: o.kg, bays: a.bays, bay: bayLabel(a.bays) };
        const b0 = T().makeBlock([], sid.id, o.ts, 'CHECKIN', 'farmer', payload, { phi: 0, flags: [] });
        const batch = { slipId: sid.id, chamberId: CH, epoch: ch.epoch, farmer: payload.farmer, crop: payload.crop, kg: o.kg, kg_stored: o.kg, bays: a.bays,
          bay: bayLabel(a.bays), status: 'stored', checkin_ts: o.ts, expected_out: o.expected_out || null, basePrice: payload.basePrice_INR_kg,
          genesisHash: b0.hash, head: { index: 0, hash: b0.hash }, sigMode: 'demo', created: now() };
        tx.set(this.ref('batches', sid.id), batch);
        tx.set(this.ref('batches', sid.id, 'blocks', '0'), b0);
        tx.update(chRef, { [`seq.${sid.ymd}`]: sid.n, bays: a.load, stored_kg: Math.round((ch.stored_kg + o.kg) * 1000) / 1000, updated: now() });
        return batch;
      });
    }
    async setSig(slipId, qr, sigMode) { await this.F.updateDoc(this.ref('batches', slipId), { qr, sig: qr.sig, sigMode }); }
    async appendBlock(slipId, type, actor, payload, physics, ts, patch, chPatch) {
      const F = this.F, bRef = this.ref('batches', slipId), chRef = this.ref('chambers', CH);
      return F.runTransaction(this.db, async tx => {
        const b = (await tx.get(bRef)).data();
        const ch = chPatch ? (await tx.get(chRef)).data() : null;
        const prev = { hash: b.head.hash }, idx = b.head.index + 1;
        const fake = Array(idx).fill(null); fake[idx - 1] = prev;            // makeBlock reads only the last hash and the length
        const pl = typeof payload === 'function' ? payload(b, ch) : payload;
        const blk = T().makeBlock(fake, slipId, ts, type, actor, pl, physics);
        tx.set(this.ref('batches', slipId, 'blocks', String(idx)), blk);
        const p = typeof patch === 'function' ? patch(b, ch) : (patch || {});
        tx.update(bRef, { head: { index: idx, hash: blk.hash }, ...p });
        if (chPatch) tx.update(chRef, { ...chPatch(b, ch), updated: now() });
        return blk;
      });
    }
    async loadBlocks(slipId) {
      const s = await this.F.getDocs(this.F.query(this.F.collection(this.db, 'batches', slipId, 'blocks')));
      return s.docs.map(d => d.data()).sort((a, b) => a.index - b.index);
    }
    watchBlocks(slipId, cb) {
      return this.F.onSnapshot(this.F.collection(this.db, 'batches', slipId, 'blocks'), s => cb(s.docs.map(d => d.data()).sort((a, b) => a.index - b.index)));
    }
    async addTelemetry(r) { await this.F.setDoc(this.ref('telemetry', CH, 'readings', `${this.ch.epoch}-${String(r.step).padStart(6, '0')}`), { ...r, chamberId: CH, epoch: this.ch.epoch }); }
    async createAlert(a) {
      const id = a.id || `AL-${this.ch.epoch}-${Date.now().toString(36)}`;
      await this.F.setDoc(this.ref('alerts', id), { ...a, id, chamberId: CH, epoch: this.ch.epoch, created: now() });
      return id;
    }
    async updateAlert(id, f) { await this.F.updateDoc(this.ref('alerts', id), f); }
    async putAnchor(day, a) { await this.F.setDoc(this.ref('anchors', `${CH}_${this.ch.epoch}_${day}`), { ...a, day, chamberId: CH, epoch: this.ch.epoch }); }
    async reserve(r) { const id = `RS-${this.ch.epoch}-${Date.now().toString(36)}`; await this.F.setDoc(this.ref('reservations', id), { ...r, id, chamberId: CH, epoch: this.ch.epoch, by: this.uid, created: now() }); return id; }
    async decideReservation(id, status) { await this.F.updateDoc(this.ref('reservations', id), { status, decided: now() }); }
    async setCtrl(c) { await this.F.updateDoc(this.ref('chambers', CH), { ctrl: c, updated: now() }); }
    async demoEdit(e) { await this.F.addDoc(this.F.collection(this.db, 'demo_edits'), { ...e, chamberId: CH, epoch: this.ch.epoch, by: this.uid, created: now() }); }
    async audit(e) { try { await this.F.addDoc(this.F.collection(this.db, 'audit'), { ...e, chamberId: CH, epoch: this.ch.epoch, by: this.uid, ts: now() }); } catch (x) { /* audit is best effort */ } }
    async tryEditBlock(slipId, index, payload) {          // the rules must refuse this (append-only ledger)
      try { await this.F.updateDoc(this.ref('batches', slipId, 'blocks', String(index)), { payload }); return 'ACCEPTED'; } catch (e) { return 'REFUSED: ' + (e.code || e.message); }
    }
    async resetDemo() {
      if (!this.isAdmin()) throw new Error('Only the owner can reset the demo');
      await this.F.updateDoc(this.ref('chambers', CH), { epoch: this.ch.epoch + 1, bays: Object.fromEntries(BAYS.map(b => [b, 0])), stored_kg: 0, seq: {}, ctrl: null, updated: now() });
    }
  }
  // ------------------------------------------------------------------ connect
  async function loadConfig() {
    const p = new URLSearchParams(location.search);
    if (p.get('offline') === '1') return null;
    if (p.get('emu')) return { emu: p.get('emu'), authEmu: p.get('authemu') || p.get('emu').replace(/:\d+$/, ':9099'), config: { apiKey: 'demo-key', projectId: p.get('project') || 'demo-koolkisan', authDomain: 'localhost' } };
    if (root.KK_FIREBASE_CONFIG) return { config: root.KK_FIREBASE_CONFIG };
    if (!/^https?:$/.test(location.protocol)) return null;
    try {
      const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 3000);
      const r = await fetch('/__/firebase/init.json', { signal: ctl.signal });
      clearTimeout(to);
      if (!r.ok) return null;
      const c = await r.json();
      return c && c.projectId ? { config: c } : null;
    } catch (e) { return null; }
  }
  const withTimeout = (p, ms) => Promise.race([p, new Promise((_, bad) => setTimeout(() => bad(new Error('timeout')), ms))]);

  let started = null;
  async function connect() {
    const F = root.KKFirebase, cfg = await loadConfig();
    if (!F || !cfg || !root.TrustCore) return new Offline();
    try {
      const app = F.initializeApp(cfg.config, 'kk');
      const auth = F.getAuth(app), db = F.getFirestore(app);
      if (cfg.emu) {
        const [h, port] = cfg.emu.split(':');
        F.connectFirestoreEmulator(db, h, +port);
        F.connectAuthEmulator(auth, `http://${cfg.authEmu}`, { disableWarnings: true });
      }
      const cred = await withTimeout(F.signInAnonymously(auth), 10000);
      const s = new Live(F, app, db, auth, cred.user.uid);
      await withTimeout(s.start(), 10000);
      if (!s.ch) throw new Error('chamber not readable');
      s.subscribeEpoch();
      return s;
    } catch (e) {
      console.warn('Firestore not reachable – offline demo:', e);
      const o = new Offline(); o.why = String(e.message || e); return o;
    }
  }
  root.KKStore = {
    CH, BAYS, allocate, release, bayLabel, defaultChamber,
    get() { return (started ||= connect()); },
    // internal links keep the test parameters (?emu=…, ?offline=1) so a test session stays on the same database
    link(url) {
      const cur = new URLSearchParams(location.search), keep = ['emu', 'authemu', 'project', 'offline'].filter(k => cur.has(k));
      if (!keep.length) return url;
      const u = new URL(url, location.href);
      keep.forEach(k => u.searchParams.set(k, cur.get(k)));
      return u.pathname.split('/').pop() + u.search;
    },
    banner(el, store) {
      if (!el) return;
      const tick = () => {
        const t = store.lastUpdate ? store.lastUpdate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '–';
        el.innerHTML = store.mode === 'live'
          ? `<span class="kklive">● Live</span> shared database · last update ${t}`
          : `<span class="kkoff">Offline demo – changes not saved</span> to the shared database (kept in this browser only)${store.why ? ` · ${String(store.why).slice(0, 60)}` : ''}`;
        el.className = 'kkbanner ' + store.mode;
      };
      tick(); store.on(tick); setInterval(tick, 5000);
    },
  };
})(typeof self !== 'undefined' ? self : this);
