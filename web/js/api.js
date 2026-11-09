// Talks to the Python server. Every number on screen comes from these calls.
export async function getJSON(url) {
  if (window.STATIC_API) return window.STATIC_API.get(url);       // static backup (no Python)
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url}: ${r.status}`);
  return r.json();
}

export async function postJSON(url, data = {}) {
  if (window.STATIC_API) return window.STATIC_API.post(url, data);
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  if (!r.ok) throw new Error(`${url}: ${r.status}`);
  return r.json();
}

// Simulated clock: t = seconds from 1 Jan 2025 00:00 (IST). speed = simulated seconds per real second.
export class SimClock {
  constructor(t0 = 0, speed = 720) { this.t = t0; this.speed = speed; this.playing = true; this.last = performance.now(); }
  tick(now = performance.now()) {
    const dt = Math.min(0.25, (now - this.last) / 1000);
    this.last = now;
    if (this.playing) this.t = (this.t + dt * this.speed) % (365 * 86400);
    if (window.STATIC_API) this.t = window.STATIC_API.clamp(this.t);   // static backup: stay in saved days
    return this.t;
  }
  jump(t) { this.t = window.STATIC_API ? window.STATIC_API.clamp(t) : t; }
}

// Polls /api/state about 3 times a second and hands the newest state to listeners.
export class StateFeed {
  constructor(clock) {
    this.clock = clock; this.curtain = true; this.listeners = []; this.state = null; this.raw = null; this.busy = false;
    this.transform = s => s;                      // e.g. the demo door animation (door.js)
  }
  on(fn) { this.listeners.push(fn); if (this.state) fn(this.state); }
  emit() {                                         // re-send the last twin state through the transform
    if (!this.raw) return;
    this.state = this.transform({ ...this.raw, values: { ...this.raw.values } });
    this.listeners.forEach(fn => fn(this.state));
  }
  async poll() {
    if (this.busy) return;
    this.busy = true;
    try {
      this.raw = await getJSON(`api/state?t=${this.clock.t.toFixed(0)}&curtain=${this.curtain ? 1 : 0}`);
      this.emit();
    } catch (e) { console.warn(e); }
    this.busy = false;
  }
  start(ms = 330) { this.poll(); setInterval(() => this.poll(), ms); }
}
