// KoolKisaan Trust & Trade – shared maths (plain script, also loads in Node for the parity tests).
// SAME rules as engine/trust_ledger.py (blocks, hashes, HMAC, anchors), engine/physics_check.py (Φ)
// and engine/shelf_life.py (freshness). If you change one side, change the other and run the tests.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TrustCore = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  // ---------------------------------------------------------------- SHA-256 + HMAC (works offline, over http, on phones)
  const K = new Uint32Array([0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2]);
  const utf8 = s => new TextEncoder().encode(s);
  const toHex = b => Array.from(b, x => x.toString(16).padStart(2, '0')).join('');
  function sha256Bytes(msg) {
    const len = msg.length, n = ((len + 9 + 63) >> 6) << 6;
    const buf = new Uint8Array(n); buf.set(msg); buf[len] = 0x80;
    const dv = new DataView(buf.buffer);
    dv.setUint32(n - 4, (len * 8) >>> 0); dv.setUint32(n - 8, Math.floor(len * 8 / 2 ** 32));
    const H = new Uint32Array([0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]);
    const W = new Uint32Array(64), rotr = (x, r) => (x >>> r) | (x << (32 - r));
    for (let o = 0; o < n; o += 64) {
      for (let i = 0; i < 16; i++) W[i] = dv.getUint32(o + i * 4);
      for (let i = 16; i < 64; i++) {
        const s0 = rotr(W[i - 15], 7) ^ rotr(W[i - 15], 18) ^ (W[i - 15] >>> 3);
        const s1 = rotr(W[i - 2], 17) ^ rotr(W[i - 2], 19) ^ (W[i - 2] >>> 10);
        W[i] = (W[i - 16] + s0 + W[i - 7] + s1) >>> 0;
      }
      let [a, b, c, d, e, f, g, h] = H;
      for (let i = 0; i < 64; i++) {
        const t1 = (h + (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + W[i]) >>> 0;
        const t2 = ((rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) >>> 0;
        h = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
      }
      H[0] += a; H[1] += b; H[2] += c; H[3] += d; H[4] += e; H[5] += f; H[6] += g; H[7] += h;
    }
    const out = new Uint8Array(32), ov = new DataView(out.buffer);
    for (let i = 0; i < 8; i++) ov.setUint32(i * 4, H[i]);
    return out;
  }
  const sha256 = s => toHex(sha256Bytes(utf8(s)));
  function hmacHex(key, msg) {
    let k = utf8(key);
    if (k.length > 64) k = sha256Bytes(k);
    const kp = new Uint8Array(64); kp.set(k);
    const ip = kp.map(x => x ^ 0x36), op = kp.map(x => x ^ 0x5c), m = utf8(msg);
    const inner = new Uint8Array(64 + m.length); inner.set(ip); inner.set(m, 64);
    const ih = sha256Bytes(inner), outer = new Uint8Array(96); outer.set(op); outer.set(ih, 64);
    return toHex(sha256Bytes(outer));
  }
  function safeEqual(a, b) {                       // constant-time compare of two hex strings
    if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
    let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return d === 0;
  }

  // ---------------------------------------------------------------- blocks (same as engine/trust_ledger.py)
  const GENESIS_PREV = '0'.repeat(64);
  const TYPES = ['CHECKIN', 'READING', 'HANDOVER_OUT', 'TRANSIT', 'HANDOVER_IN', 'SALE'];
  const ACTORS = ['farmer', 'owner', 'transporter', 'buyer'];
  function norm(x) {                                // numbers: 4 decimals; whole numbers as integers
    if (x === null || x === undefined) return null;
    if (typeof x === 'number') { if (!isFinite(x)) return null; const v = Math.round(x * 1e4) / 1e4; return v === 0 ? 0 : v; }
    if (typeof x === 'string' || typeof x === 'boolean') return x;
    if (Array.isArray(x)) return x.map(norm);
    const o = {}; for (const k of Object.keys(x)) o[k] = norm(x[k]); return o;
  }
  function canonical(x) {
    x = norm(x);
    if (x === null || typeof x !== 'object') return JSON.stringify(x);
    if (Array.isArray(x)) return '[' + x.map(canonical).join(',') + ']';
    return '{' + Object.keys(x).sort().map(k => JSON.stringify(k) + ':' + canonical(x[k])).join(',') + '}';
  }
  const blockString = b => [b.index, b.ts, b.slipId, b.type, b.actor, canonical(b.payload),
    canonical(b.physics || { phi: 0, flags: [] }), b.prevHash].join('|');
  const blockHash = b => sha256(blockString(b));
  function makeBlock(chain, slipId, ts, type, actor, payload, physics) {
    if (!TYPES.includes(type) || !ACTORS.includes(actor)) throw new Error('bad block type/actor');
    const prev = chain.length ? chain[chain.length - 1].hash : GENESIS_PREV;
    const b = { index: chain.length, ts, slipId, type, actor,
      payload: norm(payload), physics: norm(physics || { phi: 0, flags: [] }), prevHash: prev };
    b.hash = blockHash(b);
    return b;
  }
  const signMsg = (slipId, bay, gen) => `${slipId}|${bay}|${gen}`;
  const sign = (key, slipId, bay, gen) => hmacHex(key, signMsg(slipId, bay, gen));
  const verifySig = (key, qr) => safeEqual(sign(key, qr.slipId, qr.bay, qr.genesisHash), qr.sig);
  const CUSTODY = { CHECKIN: 'owner', READING: 'owner', HANDOVER_OUT: 'transporter', TRANSIT: 'transporter', HANDOVER_IN: 'buyer', SALE: 'buyer' };
  function verifyChain(blocks, intervalS = 300) {
    let firstBad = null, why = null;
    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i];
      if (blockHash(b) !== b.hash) { firstBad = i; why = 'data changed (hash does not match)'; break; }
      if (b.prevHash !== (i ? blocks[i - 1].hash : GENESIS_PREV)) { firstBad = i; why = 'link broken (prevHash does not match)'; break; }
    }
    const reads = blocks.filter(b => b.type === 'READING'), gaps = [];
    for (let i = 1; i < reads.length; i++) {
      const dt = (Date.parse(reads[i].ts) - Date.parse(reads[i - 1].ts)) / 1000;
      if (Math.abs(dt - intervalS) > 1) gaps.push({ after: reads[i - 1].index, seconds: dt });
    }
    let custody = null;
    if (firstBad !== null) { custody = 'farmer'; for (const b of blocks.slice(0, firstBad + 1)) custody = CUSTODY[b.type] || custody; }
    const flags = [];
    for (const b of blocks) for (const f of ((b.physics || {}).flags || [])) flags.push(f);
    return { valid: firstBad === null, first_bad: firstBad, why, custody_at_break: custody, gaps, physics_flags: flags };
  }
  function dayHeads(blocks) { const h = {}; for (const b of blocks) h[b.ts.slice(0, 10)] = b.hash; return h; }
  function dailyAnchor(day, headsBySlip) {
    return sha256(day + '|' + Object.keys(headsBySlip).sort().map(k => `${k}:${headsBySlip[k]}`).join(';'));
  }

  // ---------------------------------------------------------------- physics check Φ (same as engine/physics_check.py)
  const RHO_AIR = 1.27, CP_AIR = 1006.0, H_FG = 2.50e6;
  const e_s = T => 6.112 * Math.exp(17.62 * T / (243.12 + T));
  const humidityRatio = (T, RH, p = 1013.25) => { const e = RH / 100 * e_s(T); return 0.622 * e / (p - e); };
  const dewPoint = (T, RH) => { RH = Math.min(200, Math.max(0.5, RH)); const g = Math.log(RH / 100) + 17.62 * T / (243.12 + T); return 243.12 * g / (17.62 - g); };
  // d: arrays T_s RH_s v_s T_r RH_r T_core P_el_kW P_fan_kW cop Q_wax_branch_kW Q_int_kW G_wax_kW_K T_pcm T_out Q_door_kW p_hPa load_event
  // c: scalars dt_s m_kg cp_kJ_kgK tau_s C_room_kJ_K UA_kW_K A_face_m2 r_ref_W_kg Q10 T_ref_C
  function residuals(d, c) {
    const n = d.T_r.length, r1 = new Float64Array(n), r2 = new Float64Array(n), r3 = new Float64Array(n), r4 = new Float64Array(n);
    const impossible = new Array(n), coilOn = new Array(n), Qair = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      const p = d.p_hPa[i], Ts = d.T_s[i], Tr = d.T_r[i], Tc = d.T_core[i];
      const Ws = humidityRatio(Ts, d.RH_s[i], p), Wr = humidityRatio(Tr, d.RH_r[i], p), Wsat = humidityRatio(Ts, 100, p);
      r1[i] = Ws - Math.min(Wr, Wsat);
      impossible[i] = d.RH_s[i] > 100.5 || d.RH_r[i] > 100.5;
      const mdot = RHO_AIR * d.v_s[i] * c.A_face_m2;
      const qa = mdot * (CP_AIR * (Tr - Ts) + H_FG * (Wr - Ws)) / 1000;
      Qair[i] = qa;
      const qref = d.cop[i] * Math.max(d.P_el_kW[i] - d.P_fan_kW[i], 0) - d.Q_wax_branch_kW[i];
      r2[i] = (qa - qref) * 1000;
      const j = i ? i - 1 : 0, Trp = d.T_r[j], Tcp = d.T_core[j], Tpp = d.T_pcm[j];
      const Qresp = c.m_kg * c.r_ref_W_kg * Math.pow(c.Q10, (Tcp - c.T_ref_C) / 10) / 1000;
      const Qprod = Qresp + c.m_kg * c.cp_kJ_kgK / c.tau_s * (Tcp - Trp);
      const Qwax = d.G_wax_kW_K[i] * (Trp - Tpp);
      const rhs = c.UA_kW_K * (d.T_out[i] - Trp) + d.Q_door_kW[i] + Qprod + d.Q_int_kW[i] - Qwax - qa;
      r3[i] = (c.C_room_kJ_K * (Tr - Trp) / c.dt_s - rhs) * 1000;
      r4[i] = Tc - (Tcp + (Trp - Tcp) * (1 - Math.exp(-c.dt_s / c.tau_s)));
      if (d.load_event[i] > 0.5) { r3[i] = 0; r4[i] = 0; }
      coilOn[i] = d.v_s[i] > 0.1 || d.P_el_kW[i] > d.P_fan_kW[i] + 0.02;
    }
    r1[0] = r2[0] = r3[0] = r4[0] = 0;
    return { r1, r2, r3, r4, impossible, coil_on: coilOn, Q_air_kW: Qair };
  }
  function trailingMean(x, k) {
    const n = x.length, out = new Float64Array(n), c = new Float64Array(n + 1);
    for (let i = 0; i < n; i++) c[i + 1] = c[i] + x[i];
    for (let i = 0; i < n; i++) { const lo = Math.max(i + 1 - k, 0); out[i] = (c[i + 1] - c[lo]) / (i + 1 - lo); }
    return k <= 1 ? Float64Array.from(x) : out;
  }
  function phiFrom(res, sigma, weights = [1, 1, 1, 1], window = 1) {
    const r = ['r1', 'r2', 'r3', 'r4'].map(k => trailingMean(res[k], window));
    const s = [sigma.W_kg_kg, sigma.E_W, sigma.Q_W, sigma.core_K], n = r[0].length;
    const phi = new Float64Array(n), z = [0, 1, 2, 3].map(() => new Float64Array(n));
    for (let i = 0; i < n; i++) {
      let num = 0, den = 0;
      for (let k = 0; k < 4; k++) {
        let zk = r[k][i] / s[k];
        if (k === 0 && res.impossible[i]) zk = 10;
        z[k][i] = zk;
        const on = res.coil_on[i] || res.impossible[i];
        const w = k < 2 && !on ? 0 : weights[k];
        num += w * zk * zk; den += w;
      }
      phi[i] = Math.sqrt(num / den);
    }
    return { phi, z };
  }
  function phiFlags(phi, redAt = 3, redSteps = 3) {
    const out = []; let run = 0;
    for (let i = 0; i < phi.length; i++) {
      run = phi[i] >= redAt ? run + 1 : 0;
      if (run === redSteps) out.push([i - redSteps + 1, i]);
      else if (run > redSteps) out[out.length - 1][1] = i;
    }
    return out;
  }
  const PHI_REASON = [
    'supply air holds more water than the room air – humidity readings do not fit',
    'cooling seen in the air does not match the cooling the energy meter paid for',
    'room heat balance does not close – heat is appearing or vanishing (door seal? wrong reading?)',
    'produce core does not follow the air the way real fruit does',
  ];
  function phiReason(z, a, b) {               // the residual with the largest mean |z| in [a, b]
    let best = 0, bv = -1;
    for (let k = 0; k < 4; k++) { let s = 0; for (let i = a; i <= b; i++) s += Math.abs(z[k][i]); if (s > bv) { bv = s; best = k; } }
    return { k: best, text: PHI_REASON[best] };
  }

  // ---------------------------------------------------------------- freshness (same as engine/shelf_life.py)
  function rateK(crop, T) {
    const f = crop.freshness, kT = Math.pow(crop.Q10, (T - f.T_opt_C) / 10), ci = crop.chill_injury_below_C;
    const kC = ci !== undefined && ci !== null && T < ci ? 1 + f.chill_a_c_per_K2 * (ci - T) ** 2 : 1;
    return Math.max(kT, kC);
  }
  function waterLossRate(crop, T, RH, v) {
    const vpd = 6.112 * Math.exp(17.62 * T / (243.12 + T)) * (1 - Math.min(100, Math.max(0, RH)) / 100);
    return crop.freshness.K_t_mg_kg_s_MPa * 3.6e-5 * vpd * Math.sqrt(Math.max(v, 0));
  }
  class Freshness {
    constructor(crop, s = {}) { this.crop = crop; this.f = crop.freshness; this.life_used = s.life_used || 0; this.wl = s.wl_pct || 0; this.freeze_min = s.freeze_min || 0; this.damaged = !!s.damaged; }
    step(T_air, RH, v, dt_h, T_core) {
      if (T_core === undefined || T_core === null) T_core = T_air;
      this.life_used += rateK(this.crop, T_core) * dt_h / this.f.SL_ref_h;
      this.wl += waterLossRate(this.crop, T_air, RH, v) * dt_h;
      this.freeze_min = T_core < this.f.T_freeze_C ? this.freeze_min + dt_h * 60 : 0;
      if (this.freeze_min > this.f.freeze_minutes_to_damage) this.damaged = true;
      return this.value;
    }
    get value() {
      const F = 100 * Math.max(0, 1 - this.life_used) * Math.max(0, 1 - this.wl / this.f.WL_max_pct);
      return this.damaged ? Math.min(F, this.f.damaged_freshness_pct) : F;
    }
    state() { return { life_used: this.life_used, wl_pct: this.wl, freeze_min: this.freeze_min, damaged: this.damaged, freshness_pct: this.value }; }
  }
  const price = (base, F) => base * F / 100;
  // insulated box on the vehicle: warms toward the outside air with time constant tau
  const vehicleTemp = (T0, T_out, t_h, tau_h) => T_out + (T0 - T_out) * Math.exp(-t_h / tau_h);

  return { sha256, sha256Bytes, hmacHex, safeEqual, norm, canonical, blockString, blockHash, makeBlock, sign, verifySig,
    verifyChain, dayHeads, dailyAnchor, GENESIS_PREV, TYPES, ACTORS, CUSTODY, humidityRatio, dewPoint, residuals,
    trailingMean, phiFrom, phiFlags, phiReason, PHI_REASON, rateK, waterLossRate, Freshness, price, vehicleTemp };
});
