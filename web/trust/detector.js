// Automatic tamper detection (plain script / Node module). Pure functions, tested in tests/test_tamper.py.
//   applyTamper(D, scenario, step, reported, tamper)  -> what a tampered sensor reports at this step
//   new Detector(D, scenario).push(step, reported)    -> {phi, z, missing, events: [...]}
// Checks every reading (5 min of twin time):
//   physics  Φ >= red_at for red_steps readings in a row (moisture, energy, heat-balance, core-lag residuals; same Φ as trust_core.js)
//   gap      a sensor sent nothing for gap_steps readings in a row
//   outside  the outside sensor disagrees with the weather service by more than outside_K for red_steps readings (E)
//   stuck    a sensor repeats exactly the same value stuck_steps times (real sensors always wobble a little)
//   pair     with the coil fan off, supply (N1) and return (N4) humidity must agree within pair_RH %RH (red_steps readings)
// A broken hash (edited old reading) is found by verifying the chain (TrustCore.verifyChain) – see trust.js.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./trust_core.js'));
  else root.TamperDetector = factory(root.TrustCore);
})(typeof self !== 'undefined' ? self : this, function (T) {
  'use strict';
  const SENSORS = {
    room_air: { label: 'Room air (N1 supply / N4 return)', fields: ['T_s', 'T_r'], unit: '°C' },
    core: { label: 'Produce core (N2)', fields: ['T_core'], unit: '°C' },
    door: { label: 'Door (N3)', fields: ['door_open', 'Q_door_kW'], unit: '' },
    outside: { label: 'Outside temperature', fields: ['T_out'], unit: '°C' },
    humidity: { label: 'Humidity (N4 return air RH)', fields: ['RH_r'], unit: '%' },
  };
  const ACTIONS = {
    freeze: 'Freeze reading at 4 °C (door: always "closed"; humidity: stuck at its value)',
    offset: 'Offset −5 °C (humidity: −5 %RH)',
    stop: 'Stop sending',
    edit: 'Edit an old stored reading',
  };
  const OPTS = { gap_steps: 2, outside_K: 4.0, stuck_steps: 6, pair_RH: 3.5 };

  function truthAt(D, sc, i) {                      // what the (noisy, honest) nodes report at step i
    const s = D.scenarios[sc];
    return { T_s: s.N1.T_s[i], RH_s: s.N1.RH_s[i], v_s: s.N1.v_s[i], T_core: s.N2.T_core[i], door_open: s.N3.open[i],
      Q_door_kW: s.N3.Q_door_kW[i], T_r: s.N4.T_r[i], RH_r: s.N4.RH_r[i], T_out: s.out.T_out[i], RH_out: s.out.RH_out[i],
      p_hPa: s.out.p_hPa[i], P_el_kW: s.ctl.P_el_kW[i] };
  }
  function applyTamper(D, sc, i, rep, tp) {
    if (!tp || i < tp.from || tp.action === 'edit') return rep;
    const r = { ...rep }, f = SENSORS[tp.sensor].fields;
    if (tp.action === 'stop') { f.forEach(k => { r[k] = null; }); return r; }
    if (tp.sensor === 'door') { r.door_open = 0; r.Q_door_kW = 0; return r; }           // both actions: door always "closed"
    if (tp.action === 'freeze') {
      if (tp.sensor === 'humidity') { r.RH_r = tp.frozen !== undefined ? tp.frozen : rep.RH_r; return r; }
      f.forEach(k => { r[k] = 4.0; }); return r;
    }
    if (tp.action === 'offset') { f.forEach(k => { r[k] = rep[k] - 5.0; }); return r; }
    return r;
  }

  const WHICH = [['moisture', 'Moisture link: water in the supply air vs the return air', ['humidity', 'room_air']],
    ['energy', 'Energy link: heat removed by the coil vs electricity × COP', ['room_air']],
    ['heat', 'Room heat-balance link: walls + door + produce + fans − wax − coil', ['room_air', 'core', 'door', 'outside']],
    ['core', 'Core-lag link: the fruit core follows the air with a 4-h lag', ['core', 'room_air']]];

  class Detector {
    constructor(D, sc, opts) {
      this.D = D; this.sc = sc; this.o = Object.assign({}, OPTS, opts || {});
      this.P = D.trust_cfg.phi; this.hist = []; this.run = 0; this.runOut = 0; this.runPair = 0; this.miss = {}; this.same = {}; this.prev = {}; this.active = {};
      this.window = Math.max(4, this.P.window_steps + 2);
    }
    // the residuals need the controller log of the same steps (compressor COP, wax, fans) – from the twin data
    input(rows) {
      const s = this.D.scenarios[this.sc], d = {};
      const fill = (k, def) => rows.map(r => (r.rep[k] === null || r.rep[k] === undefined ? (r.last[k] ?? def) : r.rep[k]));
      for (const k of ['T_s', 'RH_s', 'v_s', 'T_core', 'Q_door_kW', 'T_r', 'RH_r', 'T_out', 'p_hPa', 'P_el_kW']) d[k] = fill(k, 0);
      for (const k of ['P_fan_kW', 'cop', 'Q_wax_branch_kW', 'Q_int_kW', 'G_wax_kW_K', 'T_pcm', 'load_event']) d[k] = rows.map(r => s.ctl[k][r.step]);
      return d;
    }
    push(step, rep) {
      const last = this.hist.length ? { ...this.hist[this.hist.length - 1].last } : {};
      for (const [k, v] of Object.entries(rep)) if (v !== null && v !== undefined) last[k] = v;
      this.hist.push({ step, rep, last });
      if (this.hist.length > this.window) this.hist.shift();
      const ev = [];
      // gap: which sensors sent nothing this reading
      const missing = [];
      for (const [name, s] of Object.entries(SENSORS)) {
        const gone = s.fields.some(k => rep[k] === null || rep[k] === undefined);
        this.miss[name] = gone ? (this.miss[name] || 0) + 1 : 0;
        if (gone) missing.push(name);
        if (this.miss[name] === this.o.gap_steps) ev.push({ kind: 'gap', sensors: [name], from: step - this.o.gap_steps + 1, raised: step,
          reason: `${s.label} sent no reading for ${this.o.gap_steps} readings in a row (${this.o.gap_steps * 5} min)` });
      }
      // physics: Φ on the last few readings (missing values carried from the last good reading – the gap check covers them)
      let phi = 0, z = [0, 0, 0, 0];
      if (this.hist.length >= 2) {
        const res = T.residuals(this.input(this.hist), this.D.const);
        const pz = T.phiFrom(res, this.D.sigma, this.P.weights, this.P.window_steps), n = this.hist.length - 1;
        phi = pz.phi[n]; z = [0, 1, 2, 3].map(k => pz.z[k][n]);
        if (this.hist[n].rep && this.D.scenarios[this.sc].ctl.load_event[step] > 0.5) phi = 0;
      }
      this.run = phi >= this.P.red_at ? this.run + 1 : 0;
      if (this.run === this.P.red_steps) {
        const k = [0, 1, 2, 3].reduce((a, b) => (Math.abs(z[b]) > Math.abs(z[a]) ? b : a), 0);
        ev.push({ kind: 'physics', sensors: WHICH[k][2], check: WHICH[k][0], from: step - this.P.red_steps + 1, raised: step, phi,
          z: { moisture: z[0], energy: z[1], heat: z[2], core: z[3] }, reason: `${WHICH[k][1]} does not close (|z| = ${Math.abs(z[k]).toFixed(1)})` });
      }
      // outside sensor vs the weather service
      const wx = this.D.scenarios[this.sc].out.T_out[step];
      const dO = rep.T_out === null || rep.T_out === undefined ? 0 : Math.abs(rep.T_out - wx);
      this.runOut = dO > this.o.outside_K ? this.runOut + 1 : 0;
      if (this.runOut === this.P.red_steps) ev.push({ kind: 'outside', sensors: ['outside'], from: step - this.P.red_steps + 1, raised: step,
        reason: `Outside sensor is ${dO.toFixed(1)} K away from the weather service (limit ${this.o.outside_K} K)` });
      // stuck: exactly the same value again and again (temperatures and humidity; the door switch is normally constant)
      for (const [name, s] of Object.entries(SENSORS)) {
        if (name === 'door') continue;
        const v = s.fields.map(k => rep[k]);
        if (v.some(x => x === null || x === undefined)) { this.same[name] = 0; continue; }
        const key = v.join('|');
        this.same[name] = this.prev[name] === key ? (this.same[name] || 0) + 1 : 0;
        this.prev[name] = key;
        if (this.same[name] === this.o.stuck_steps - 1) ev.push({ kind: 'stuck', sensors: [name], from: step - this.o.stuck_steps + 1, raised: step,
          reason: `${s.label} sent exactly the same value (${v.join(' / ')}) ${this.o.stuck_steps} times in a row – real sensors always change a little` });
      }
      // humidity pair: fan off -> supply and return air are the same air
      const fanOff = rep.v_s !== null && rep.v_s !== undefined && rep.v_s < 0.1;
      const dRH = rep.RH_s === null || rep.RH_r === null || rep.RH_s === undefined || rep.RH_r === undefined ? 0 : Math.abs(rep.RH_s - rep.RH_r);
      this.runPair = fanOff && dRH > this.o.pair_RH ? this.runPair + 1 : (fanOff ? 0 : this.runPair);
      if (this.runPair === this.P.red_steps) ev.push({ kind: 'pair', sensors: ['humidity'], from: step - this.P.red_steps + 1, raised: step,
        reason: `With the coil fan off, supply and return humidity differ by ${dRH.toFixed(1)} %RH (limit ${this.o.pair_RH})` });
      return { phi, z, missing, events: ev, ok: !ev.length && phi < this.P.green_below };
    }
  }

  // run a tamper scenario from 'start' and return the readings (5 min each) until the first alert (null if none)
  function detectionSteps(D, sc, start, tamper, horizon = 72) {
    const det = new Detector(D, sc), tp = tamper ? { ...tamper, from: start } : null;
    if (tp && tp.sensor === 'humidity' && tp.action === 'freeze') tp.frozen = D.scenarios[sc].N4.RH_r[start];
    const n = D.scenarios[sc].phi.length;
    for (let i = Math.max(1, start - 12); i < Math.min(n, start + horizon); i++) {
      const out = det.push(i, applyTamper(D, sc, i, truthAt(D, sc, i), tp));
      if (out.events.length && i >= start) return { steps: i - start + 1, event: out.events[0] };
      if (out.events.length && i < start) return { steps: -1, event: out.events[0] };          // false alarm before tampering
    }
    return null;
  }
  return { SENSORS, ACTIONS, OPTS, WHICH, truthAt, applyTamper, Detector, detectionSteps };
});
