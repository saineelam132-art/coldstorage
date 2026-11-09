// Door animation for the demo: when the farmer walks in, the door swings 0° -> 90° in about 2 s,
// stays open while the farmer is inside, then swings 90° -> 0°. While it runs it OVERRIDES the twin's
// door_angle / door_open (and the heat coming in), so the door-angle sensor and the door card show
// exactly what the picture shows. Between animations the twin's own 15-second openings are used.
const SWING_MS = 2000;
const ease = k => (k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2);

export const door = {
  active: false, from: 0, to: 0, t0: 0, openSince: null, extraS: 0, day: null, lastDay: null, listeners: [],
  now() {
    if (!this.active) return 0;
    const k = Math.min(1, (performance.now() - this.t0) / SWING_MS);
    return this.from + (this.to - this.from) * ease(k);
  },
  swing(to) {
    this.from = this.now(); this.to = to; this.t0 = performance.now(); this.active = true;
    if (to > 0 && this.openSince === null) {
      this.openSince = performance.now();
      if (this.day !== this.lastDay) { this.extraS = 0; this.day = this.lastDay; }   // demo seconds count for that day only
    }
    this.listeners.forEach(fn => fn());
    if (to === 0) {
      setTimeout(() => {
        if (this.to !== 0) return;
        this.extraS += this.openSince === null ? 0 : (performance.now() - this.openSince) / 1000;
        this.openSince = null; this.active = false; this.listeners.forEach(fn => fn());
      }, SWING_MS + 50);
    }
  },
  open() { this.swing(90); },
  close() { this.swing(0); },
  onChange(fn) { this.listeners.push(fn); },
  // apply to a state from the twin (copy of values)
  apply(v, t = 0) {
    this.lastDay = Math.floor(t / 86400);
    const extra = this.day === this.lastDay ? this.extraS : 0;
    if (!this.active) { if (extra) v.door_open_today_s = (v.door_open_today_s || 0) + extra; return v; }
    const a = this.now(), open = a > 0.5;
    const frac = a / 90;                                   // opening area grows with the angle
    const lat = v.heat_if_open_kW ? (v.heat_latent_now_kW && v.heat_now_kW ? v.heat_latent_now_kW / v.heat_now_kW : 0.58) : 0;
    v.door_angle = a; v.door_open = open;
    v.heat_now_kW = open ? v.heat_if_open_kW * frac : 0;
    v.heat_latent_now_kW = v.heat_now_kW * lat; v.heat_sensible_now_kW = v.heat_now_kW - v.heat_latent_now_kW;
    v.v_door_top = open ? v.v_door_if_open : 0; v.v_door_bot = v.v_door_top;
    v.door_open_today_s = (v.door_open_today_s || 0) + extra + (this.openSince === null ? 0 : (performance.now() - this.openSince) / 1000);
    v.door_by_demo = true;
    return v;
  },
};
