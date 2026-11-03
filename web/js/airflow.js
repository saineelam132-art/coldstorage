// Door air exchange drawn on top of a picture (2D canvas).
// Physics (from the twin, per ASHRAE Gosney–Olama): cold, heavy room air spills OUT along the
// floor in the lower half of the doorway; warm outside air flows IN through the upper half.
// The "neutral line" in the middle is where the flow changes direction (Δp = 0).
// Particles per second ∝ heat entering (kW); particle speed ∝ doorway air speed (m/s).

const WARM = [255, 122, 61], COLD = [80, 170, 255];

export class Airflow {
  // spec: {x0, x1, y0, y1, view: 'outside'|'inside', label_y} in % of the picture
  constructor(host, spec) {
    this.spec = spec; this.p = []; this.acc = 0; this.heat = 0; this.speed = 0.3; this.on = false; this.low = false;
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'airflow';
    host.appendChild(this.canvas);
    this.label = document.createElement('div');
    this.label.className = 'flowlbl';
    this.label.style.left = `${(spec.x0 + spec.x1) / 2}%`;
    this.label.style.top = `${spec.label_y}%`;
    host.appendChild(this.label);
    this.neutral = document.createElement('div');
    this.neutral.className = 'neutral';
    this.neutral.style.cssText = `left:${spec.x0 - 1}%;width:${spec.x1 - spec.x0 + 2}%;top:${(spec.y0 + spec.y1) / 2}%`;
    this.neutral.innerHTML = '<span>neutral line · Δp = 0</span>';
    host.appendChild(this.neutral);
  }

  set(v, curtain) {
    this.heat = v.heat_if_open_kW;                     // this picture shows the door OPEN
    this.speed = 0.35 + 1.4 * v.v_door_if_open;        // depth units per second
    const lat = v.heat_if_open_kW * (v.heat_latent_now_kW && v.heat_now_kW ? v.heat_latent_now_kW / v.heat_now_kW : 0.58);
    this.label.innerHTML = `Heat entering now (door open): <b>${v.heat_if_open_kW.toFixed(1)} kW</b> <span class="tag C">C</span>`
      + `<span class="per">this opening lasted <b>${v.last_open_s.toFixed(0)} s</b> → energy per opening <b>${v.last_open_kJ.toFixed(0)} kJ</b>`
      + ` (= ${v.last_open_wall_minutes.toFixed(0)} min of wall heat)</span>`
      + `<small>strip curtain ${curtain ? 'ON – cuts it by 85 %' : 'OFF'} · big kW, but only for seconds · warm air in at the top, cold air out at the bottom</small>`;
  }

  resize() {
    const r = this.canvas.parentElement.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, this.low ? 1 : 1.5);
    this.canvas.width = r.width * dpr / (this.scaleHint || 1); this.canvas.height = r.height * dpr / (this.scaleHint || 1);
    this.W = this.canvas.width; this.H = this.canvas.height;
  }

  spawn(warm) {
    // u across the opening (0..1), v height (0 top..1 floor), d = distance from the door plane (0..1, toward the camera)
    const v = warm ? 0.04 + Math.random() * 0.42 : 0.56 + Math.random() * 0.4;
    const towardCamera = (this.spec.view === 'outside') ? !warm : warm;   // cold comes out to an outside camera
    this.p.push({ warm, u: Math.random(), v, d: towardCamera ? 0 : 1, dir: towardCamera ? 1 : -1,
                  jit: Math.random() * Math.PI * 2, life: 0 });
  }

  step(dt) {
    if (!this.on) { if (this.p.length) this.p.length = 0; return; }
    if (!this.W) this.resize();
    const rate = Math.min(this.low ? 160 : 360, 9 * this.heat);     // particles per second
    this.acc += rate * dt;
    while (this.acc >= 1) { this.acc -= 1; this.spawn(Math.random() < 0.5); }
    const s = this.spec, W = this.W, H = this.H, g = this.canvas.getContext('2d');
    g.clearRect(0, 0, W, H);
    const x0 = s.x0 / 100 * W, x1 = s.x1 / 100 * W, y0 = s.y0 / 100 * H, y1 = s.y1 / 100 * H;
    const cx = (x0 + x1) / 2, w = x1 - x0, h = y1 - y0;
    const inside = s.view === 'inside';
    const keep = [];
    for (const q of this.p) {
      q.d += q.dir * this.speed * dt; q.life += dt;
      if (q.d < -0.02 || q.d > 1.02) continue;
      keep.push(q);
      const d = Math.max(0, Math.min(1, q.d));
      let x = cx + (q.u - 0.5) * w * (1 + 1.3 * d) + Math.sin(q.life * 3 + q.jit) * 3 * d;
      let y = y0 + q.v * h;
      if (q.warm) y -= d * h * (inside ? 0.18 : 0.06);              // warm air hugs the ceiling inside
      else y += d * h * (inside ? 0.06 : 0.14) + d * d * h * 0.05;  // cold air sinks along the floor
      const r = (2 + 6 * d) * (W / 1400);
      const a = Math.min(1, q.life * 3) * (q.dir > 0 ? (1 - d * 0.75) : (0.25 + d * 0.75)) * 0.75;
      const c = q.warm ? WARM : COLD;
      g.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${a})`;
      g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    }
    this.p = keep;
  }

  show(on) {
    this.on = on;
    this.canvas.style.display = this.label.style.display = this.neutral.style.display = on ? '' : 'none';
    if (on) this.resize();
  }
}
