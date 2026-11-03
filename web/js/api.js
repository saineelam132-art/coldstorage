// Talks to the Python server. Every number on screen comes from these calls.
export async function getJSON(url) {
  const r = await fetch(url);
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
    return this.t;
  }
  jump(t) { this.t = t; }
}

// Polls /api/state about 3 times a second and hands the newest state to listeners.
export class StateFeed {
  constructor(clock) { this.clock = clock; this.curtain = true; this.listeners = []; this.state = null; this.busy = false; }
  on(fn) { this.listeners.push(fn); if (this.state) fn(this.state); }
  async poll() {
    if (this.busy) return;
    this.busy = true;
    try {
      const s = await getJSON(`api/state?t=${this.clock.t.toFixed(0)}&curtain=${this.curtain ? 1 : 0}`);
      this.state = s;
      this.listeners.forEach(fn => fn(s));
    } catch (e) { console.warn(e); }
    this.busy = false;
  }
  start(ms = 330) { this.poll(); setInterval(() => this.poll(), ms); }
}
