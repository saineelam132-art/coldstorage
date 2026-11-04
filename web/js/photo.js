// Photo view: the Gemini pictures with Ken Burns zoom, light parallax, cross-fades,
// and glowing hotspots placed at % positions from assets/hotspots.json.
import { showTip, hideTip } from './ui.js';
import { sensorTip, partTip, openSensor, openPart } from './details.js';
import { Airflow } from './airflow.js';

export class PhotoView {
  constructor(root, manifest, scenes, hotspots) {
    this.root = root; this.manifest = manifest; this.scenes = scenes; this.hot = hotspots;
    this.story = scenes.story.filter(n => manifest.A[n]);          // skip missing pictures
    this.idx = 0; this.mode = 'day'; this.layers = {}; this.low = false; this.flows = {};
    this.caption = document.getElementById('caption');
    this.dots = document.getElementById('storyDots');
    this.build();
    addEventListener('resize', () => this.layout());
    root.addEventListener('mousemove', e => this.parallax(e));
    root.addEventListener('wheel', e => this.onWheel(e), { passive: true });
    document.getElementById('prevScene').onclick = () => this.go(this.idx - 1, true);
    document.getElementById('nextScene').onclick = () => this.go(this.idx + 1, true);
    this.enterBtn = document.createElement('button');
    this.enterBtn.className = 'enterbtn';
    this.enterBtn.textContent = 'Enter the cold room ▸';
    this.enterBtn.onclick = () => this.enter();
    root.parentElement.appendChild(this.enterBtn);
    this.layout();
    this.show();
    let last = performance.now();
    const loop = now => {
      const dt = Math.min(0.1, (now - last) / 1000); last = now;
      const f = this.flows[this.current()];
      if (f && this.root.parentElement.classList.contains('on')) f.step(dt);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  // Walk in: front -> door opens with a worker -> doorway from inside -> inside the room.
  enter() {
    const seq = (this.scenes.enter_sequence || []).filter(n => this.story.includes(n));
    clearTimeout(this.enterTimer);
    let k = 0;
    const next = () => {
      if (k >= seq.length) return;
      this.go(this.story.indexOf(seq[k++]));
      this.enterTimer = setTimeout(next, k === 1 ? 2200 : 5200);
    };
    next();
  }

  build() {
    const names = new Set([...this.story, ...Object.values(this.scenes.modes)].filter(n => this.manifest.A[n]));
    for (const name of names) {
      const a = this.manifest.A[name];
      const el = document.createElement('div');
      el.className = 'scene';
      el.dataset.name = name;
      el.innerHTML = `<div class="kb"><img alt="${name}" src="${a.src}" loading="${name === this.story[0] ? 'eager' : 'lazy'}"><div class="hots"></div></div>`;
      el.aspect = a.w / a.h;
      const hots = el.querySelector('.hots');
      (this.hot[name] || []).forEach(h => {
        const b = document.createElement('button');
        b.className = 'hot' + (h.part ? ' part' : '');
        b.style.left = `${h.x}%`; b.style.top = `${h.y}%`;
        b.setAttribute('aria-label', h.label || h.sensor || h.part);
        const tipHtml = () => (h.sensor ? sensorTip(h.sensor) : partTip(h.part));
        b.onmouseenter = e => showTip(tipHtml(), e.clientX, e.clientY);
        b.onmousemove = e => showTip(tipHtml(), e.clientX, e.clientY);
        b.onmouseleave = hideTip;
        b.onclick = () => { hideTip(); h.sensor ? openSensor(h.sensor) : openPart(h.part); };
        b.dataset.sensor = h.sensor || '';
        hots.appendChild(b);
      });
      // wax panels: tinted blue (frozen) -> clear (melted) from the live battery %
      const kb = el.querySelector('.kb');
      const rects = this.scenes.pcm_panels?.[name];
      if (rects) {
        el.pcm = rects.map(([x0, y0, x1, y1]) => {
          const d = document.createElement('div'); d.className = 'pcmtint';
          d.style.cssText = `left:${x0}%;top:${y0}%;width:${x1 - x0}%;height:${y1 - y0}%`;
          kb.insertBefore(d, kb.querySelector('.hots')); return d;
        });
        const lb = document.createElement('div'); lb.className = 'pcmlbl';
        const [x0, y0, x1] = rects[0];
        lb.style.left = `${Math.min(80, Math.max(20, (x0 + x1) / 2))}%`; lb.style.top = `${Math.max(8, y0)}%`;
        kb.insertBefore(lb, kb.querySelector('.hots')); el.pcmLabel = lb;
      }
      // evaporator fan: glows and spins with the compressor speed
      const fan = this.scenes.fans?.[name];
      if (fan) {
        const f = document.createElement('div'); f.className = 'fanglow';
        f.style.cssText = `left:${fan.x}%;top:${fan.y}%;width:${2 * fan.r}%;aspect-ratio:1`;
        kb.insertBefore(f, kb.querySelector('.hots')); el.fan = f;
      }
      const door = this.scenes.doorways?.[name];
      if (door) this.flows[name] = new Airflow(el.querySelector('.kb'), door);
      this.root.appendChild(el);
      this.layers[name] = el;
    }
    this.dots.innerHTML = this.story.map((_, i) => `<i data-i="${i}"></i>`).join('');
    this.dots.onclick = e => { if (e.target.dataset.i) this.go(+e.target.dataset.i, true); };
  }

  // Size each picture to COVER the screen while keeping its shape, so % hotspots stay on target.
  layout() {
    const W = this.root.clientWidth, H = this.root.clientHeight;
    for (const el of Object.values(this.layers)) {
      const ar = el.aspect;
      let w = W, h = W / ar;
      if (h < H) { h = H; w = H * ar; }
      w *= 1.04; h *= 1.04;                       // a little extra room for parallax
      el.style.width = `${w}px`; el.style.height = `${h}px`;
      el.style.marginLeft = `${-w / 2}px`; el.style.marginTop = `${-h / 2}px`;
    }
    Object.values(this.flows).forEach(f => f.resize());
  }

  parallax(e) {
    if (this.low) return;
    const x = (e.clientX / innerWidth - 0.5) * -14, y = (e.clientY / innerHeight - 0.5) * -10;
    for (const el of Object.values(this.layers)) el.style.transform = `translate(${x}px, ${y}px)`;
  }

  onWheel(e) {
    const now = performance.now();
    if (now - (this.lastWheel || 0) < 900 || Math.abs(e.deltaY) < 20) return;
    this.lastWheel = now;
    this.go(this.idx + (e.deltaY > 0 ? 1 : -1), true);
  }

  go(i, user = false) {
    if (user) clearTimeout(this.enterTimer);
    this.idx = Math.max(0, Math.min(this.story.length - 1, i)); this.show();
  }
  goByName(name) { const i = this.story.indexOf(name); if (i >= 0) this.go(i, true); }

  // a glowing "NEW" crate marker on the inside picture for a new batch
  addBatchSpot(id, [x, y], img) {
    const el = this.layers.A8_interior_wide;
    if (!el) return;
    const hots = el.querySelector('.hots');
    hots.querySelectorAll('.newtag,.crate-cut,.hot[aria-label^="batch:"]').forEach(n => n.remove());
    if (img) {                                    // the B cut-out crate, put down in the aisle
      const c = document.createElement('img'); c.className = 'crate-cut'; c.src = img;
      c.style.left = `${x}%`; c.style.top = `${y}%`; c.style.width = '15%';
      hots.appendChild(c);
    }
    const b = document.createElement('button');
    b.className = 'hot part'; b.style.left = `${x}%`; b.style.top = `${y - 6}%`; b.setAttribute('aria-label', 'batch:' + id);
    b.onclick = () => document.dispatchEvent(new CustomEvent('openbatch', { detail: id }));
    const tag = document.createElement('div'); tag.className = 'newtag'; tag.style.left = `${x}%`; tag.style.top = `${y - 14}%`;
    tag.textContent = `NEW · ${id}`;
    hots.append(b, tag);
  }

  setMode(m) { if (m !== this.mode) { this.mode = m; this.show(); } }
  setLow(low) {
    this.low = low;
    for (const [n, el] of Object.entries(this.layers)) {
      const a = this.manifest.A[n];
      el.querySelector('img').src = low ? a.small : a.src;
      if (low) el.style.transform = '';
    }
    Object.values(this.flows).forEach(f => { f.low = low; f.resize(); });
  }

  current() {
    let name = this.story[this.idx];
    // the outside hero scene changes with day / night / monsoon
    if (name === this.scenes.modes.day && this.mode !== 'day') {
      const alt = this.scenes.modes[this.mode];
      if (alt && this.manifest.A[alt]) name = alt;
    }
    return name;
  }

  show() {
    const name = this.current();
    for (const [n, el] of Object.entries(this.layers)) el.classList.toggle('on', n === name);
    [...this.dots.children].forEach((d, i) => d.classList.toggle('on', i === this.idx));
    const cap = this.scenes.mode_captions?.[name] || this.scenes.story_captions[this.story[this.idx]] || '';
    this.caption.textContent = cap;
    this.caption.style.display = cap ? '' : 'none';
    this.caption.classList.toggle('right', (this.scenes.caption_right || []).includes(name));
    for (const [n, f] of Object.entries(this.flows)) f.show(n === name);
    const outside = name === this.story[0] || name === this.scenes.modes.night || name === this.scenes.modes.monsoon || name === 'A3_exterior_side_condenser' || name === 'A2_front';
    this.enterBtn.style.display = outside ? '' : 'none';
  }

  // colour the dots of out-of-range values
  update(state) {
    const v = state.values;
    Object.values(this.flows).forEach(f => f.set(v, v.curtain));
    const frozen = Math.max(0, Math.min(1, v.pcm_pct / 100));
    for (const el of Object.values(this.layers)) {
      if (el.pcm) {
        el.pcm.forEach(d => (d.style.backgroundColor = `rgba(70,150,255,${(0.03 + 0.27 * frozen).toFixed(3)})`));
        el.pcmLabel.innerHTML = `Wax battery <b>${v.pcm_pct.toFixed(0)} % frozen</b> · backup <b>${v.backup_h === null ? '∞' : v.backup_h.toFixed(1) + ' h'}</b> <span class="tag C">C</span>`;
      }
      if (el.fan) {
        const sp = Math.max(0, Math.min(1, v.comp_speed_pct / 100));
        el.fan.style.opacity = (0.15 + 0.85 * sp).toFixed(2);
        el.fan.style.animationDuration = sp > 0.02 ? `${(1.6 - 1.3 * sp).toFixed(2)}s` : '0s';
        el.fan.style.animationPlayState = sp > 0.02 ? 'running' : 'paused';
        el.fan.title = `Compressor ${v.comp_speed_pct.toFixed(0)} %`;
      }
    }
    this.root.querySelectorAll('.hot[data-sensor="door_switch"]').forEach(b => b.classList.toggle('warn', !!v.door_open));
  }
}
