// Photo view: the Gemini pictures with Ken Burns zoom, light parallax, cross-fades,
// and glowing hotspots placed at % positions from assets/hotspots.json.
import { showTip, hideTip } from './ui.js';
import { sensorTip, partTip, openSensor, openPart } from './details.js';

export class PhotoView {
  constructor(root, manifest, scenes, hotspots) {
    this.root = root; this.manifest = manifest; this.scenes = scenes; this.hot = hotspots;
    this.story = scenes.story.filter(n => manifest.A[n]);          // skip missing pictures
    this.idx = 0; this.mode = 'day'; this.layers = {}; this.low = false;
    this.caption = document.getElementById('caption');
    this.dots = document.getElementById('storyDots');
    this.build();
    addEventListener('resize', () => this.layout());
    root.addEventListener('mousemove', e => this.parallax(e));
    root.addEventListener('wheel', e => this.onWheel(e), { passive: true });
    document.getElementById('prevScene').onclick = () => this.go(this.idx - 1);
    document.getElementById('nextScene').onclick = () => this.go(this.idx + 1);
    this.layout();
    this.show();
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
        b.setAttribute('aria-label', h.sensor || h.part);
        const tipHtml = () => (h.sensor ? sensorTip(h.sensor) : partTip(h.part));
        b.onmouseenter = e => showTip(tipHtml(), e.clientX, e.clientY);
        b.onmousemove = e => showTip(tipHtml(), e.clientX, e.clientY);
        b.onmouseleave = hideTip;
        b.onclick = () => { hideTip(); h.sensor ? openSensor(h.sensor) : openPart(h.part); };
        b.dataset.sensor = h.sensor || '';
        hots.appendChild(b);
      });
      this.root.appendChild(el);
      this.layers[name] = el;
    }
    this.dots.innerHTML = this.story.map((_, i) => `<i data-i="${i}"></i>`).join('');
    this.dots.onclick = e => { if (e.target.dataset.i) this.go(+e.target.dataset.i); };
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
    this.go(this.idx + (e.deltaY > 0 ? 1 : -1));
  }

  go(i) { this.idx = Math.max(0, Math.min(this.story.length - 1, i)); this.show(); }
  setMode(m) { if (m !== this.mode) { this.mode = m; this.show(); } }
  setLow(low) {
    this.low = low;
    for (const [n, el] of Object.entries(this.layers)) {
      const a = this.manifest.A[n];
      el.querySelector('img').src = low ? a.small : a.src;
      if (low) el.style.transform = '';
    }
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
  }

  // colour the dots of out-of-range values
  update(state) {
    const v = state.values;
    this.root.querySelectorAll('.hot[data-sensor="door_switch"]').forEach(b => b.classList.toggle('warn', !!v.door_open));
  }
}
