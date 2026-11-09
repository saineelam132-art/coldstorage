// Photo view: the Gemini pictures with Ken Burns zoom, light parallax, cross-fades,
// and glowing hotspots placed at % positions from assets/hotspots.json.
import { showTip, hideTip } from './ui.js';
import { sensorTip, partTip, openSensor, openPart } from './details.js';
import { Airflow } from './airflow.js';
import { door } from './door.js';

export class PhotoView {
  constructor(root, manifest, scenes, hotspots) {
    this.root = root; this.manifest = manifest; this.scenes = scenes; this.hot = hotspots;
    // a REAL photo (scenes.home_photo) replaces the first AI picture once it is added
    if (scenes.home_photo && manifest.A[scenes.home_photo]) {
      scenes.story = [scenes.home_photo, ...scenes.story.slice(1)];
      scenes.modes = { ...scenes.modes, day: scenes.home_photo };
      scenes.real_photos = [...new Set([...(scenes.real_photos || []), scenes.home_photo])];
    }
    this.story = scenes.story.filter(n => manifest.A[n]);          // skip missing pictures
    this.doorOpen = false;
    this.concept = document.createElement('div'); this.concept.className = 'concepttag';
    root.parentElement.appendChild(this.concept);
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
    // highlight the sensor / part whose card is open (red blinking dot + label); cleared when the card closes
    document.addEventListener('highlight', e => this.highlight(e.detail));
    document.addEventListener('panelclose', () => this.highlight(null));
    if (new URLSearchParams(location.search).get('edit') === '1') this.editor();
    let last = performance.now();
    const loop = now => {
      const dt = Math.min(0.1, (now - last) / 1000); last = now;
      const f = this.flows[this.current()];
      if (f && this.root.parentElement.classList.contains('on')) f.step(dt);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  // Walk in: front (door shut, no curtain) -> the door swings open, the strip curtain appears ->
  // doorway from inside -> inside the room -> the door swings shut behind the farmer.
  enter() {
    const seq = (this.scenes.enter_sequence || []).filter(n => this.story.includes(n));
    clearTimeout(this.enterTimer);
    const [front, , ...inside] = seq;
    const plan = [[front, 1400, () => {}], [null, 2600, () => door.open()]];
    inside.forEach(n => plan.push([n, 4200, () => {}]));
    plan.push([null, 0, () => door.close()]);
    let k = 0;
    const next = () => {
      if (k >= plan.length) return;
      const [name, ms, act] = plan[k++];
      if (name) this.go(this.story.indexOf(name));
      act();
      this.enterTimer = setTimeout(next, ms);
    };
    next();
  }

  build() {
    const alts = [this.scenes.door_open_alt, this.scenes.night_alt].flatMap(o => Object.entries(o || {}).filter(([k]) => !k.startsWith('_')).map(([, v]) => v));
    const names = new Set([...this.story, ...Object.values(this.scenes.modes), ...alts].filter(n => this.manifest.A[n]));
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
        b.dataset.part = h.part || '';
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
      // finned wax panels + drip tray (drawn in code; no picture of them yet)
      (this.scenes.fins?.[name] || []).forEach(([x0, y0, x1, y1]) => {
        const d = document.createElement('div'); d.className = 'finpack';
        d.style.cssText = `left:${x0}%;top:${y0}%;width:${x1 - x0}%;height:${y1 - y0}%`;
        kb.insertBefore(d, kb.querySelector('.hots'));
      });
      (this.scenes.drip_trays?.[name] || []).forEach(([x0, y0, x1, y1]) => {
        const d = document.createElement('div'); d.className = 'driptray';
        d.style.cssText = `left:${x0}%;top:${y0}%;width:${x1 - x0}%;height:${y1 - y0}%`;
        kb.insertBefore(d, kb.querySelector('.hots'));
      });
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
    const el = this.layers[this.current()] || this.layers.A8_interior_wide;     // A8 by day, A14 at night
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
    const alt = (o, n) => (o && o[n] && this.manifest.A[o[n]] ? o[n] : n);
    if (this.doorOpen) name = alt(this.scenes.door_open_alt, name);        // door open -> picture with the curtain
    if (this.mode === 'night') name = alt(this.scenes.night_alt, name);    // inside at night
    // the outside hero scene changes with day / night / monsoon
    if (name === this.scenes.modes.day && this.mode !== 'day') {
      const alt = this.scenes.modes[this.mode];
      if (alt && this.manifest.A[alt]) name = alt;
    }
    return name;
  }

  highlight(h) {
    this.hl = h;
    this.root.querySelectorAll('.hot.hl').forEach(b => b.classList.remove('hl'));
    this.root.querySelectorAll('.hots.dimmed').forEach(x => x.classList.remove('dimmed'));
    this.root.querySelectorAll('.hllabel').forEach(x => x.remove());
    this.root.style.transform = '';
    if (!h) return;
    const sel = h.kind === 'sensor' ? `.hot[data-sensor="${h.id}"]` : `.hot[data-part="${h.id}"]`;
    let el = this.layers[this.current()];
    if (!el?.querySelector(sel) && h.move !== false) {                // not on this picture: go to one that has it
      const name = this.story.find(n => this.layers[n]?.querySelector(sel));
      if (name) { this.goByName(name); return; }                      // show() calls highlight again
    }
    if (!el) return;
    const dots = [...el.querySelectorAll(sel)];
    if (!dots.length) return;
    const hots = el.querySelector('.hots');
    hots.classList.add('dimmed');
    dots.forEach(b => b.classList.add('hl'));
    const b = dots[0], lb = document.createElement('div');
    lb.className = 'hllabel'; lb.textContent = h.label;
    const x = parseFloat(b.style.left), y = parseFloat(b.style.top);
    lb.style.top = `${y}%`;
    if (x > 70) { lb.style.right = `${100 - x + 2.2}%`; lb.classList.add('left'); } else lb.style.left = `${x + 2.2}%`;
    hots.appendChild(lb);
    // if the open card (or the demo caption bar) covers the dot, slide the picture so it shows;
    // measured after the card has finished sliding in
    clearTimeout(this.fitTimer);
    this.fitTimer = setTimeout(() => this.fitHighlight(b), 450);
  }

  fitHighlight(b) {
    if (!b.isConnected || !b.classList.contains('hl')) return;
    this.root.style.transform = '';
    const panel = document.getElementById('panel'), bar = document.getElementById('tourBar');
    const r = b.getBoundingClientRect();
    let tx = 0, ty = 0;
    if (panel.classList.contains('on')) {
      const pl = panel.getBoundingClientRect().left;
      if (r.left > pl - 40) tx = -Math.min(panel.offsetWidth + 10, r.left - pl + 90);
    }
    if (bar.classList.contains('on')) {
      const bt = bar.getBoundingClientRect().top;
      if (r.bottom > bt - 30) ty = -Math.min(bar.offsetHeight + 60, r.bottom - bt + 50);
    }
    if (tx || ty) this.root.style.transform = `translate(${tx}px, ${ty}px)`;
  }

  // ?edit=1 : click anywhere on a picture -> its x, y in % (for hotspots.json) in the console and on screen
  editor() {
    document.body.classList.add('editmode');
    const toast = document.createElement('div'); toast.className = 'edittoast';
    toast.textContent = 'EDIT MODE: click on the picture to read x, y (%)';
    document.body.appendChild(toast);
    this.root.addEventListener('click', e => {
      const name = this.current(), kb = this.layers[name]?.querySelector('.kb');
      if (!kb) return;
      const r = kb.getBoundingClientRect();
      const x = (100 * (e.clientX - r.left) / r.width).toFixed(1), y = (100 * (e.clientY - r.top) / r.height).toFixed(1);
      const txt = `${name}: "x": ${x}, "y": ${y}`;
      console.log(txt);
      toast.textContent = txt + '   (also in the console)';
      const m = document.createElement('div'); m.className = 'editmark'; m.style.left = `${x}%`; m.style.top = `${y}%`;
      kb.querySelector('.hots').appendChild(m); setTimeout(() => m.remove(), 4000);
    }, true);
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
    if (this.hl) this.highlight({ ...this.hl, move: false });
    const outside = (this.hot[name] || []).some(h => h.sensor === 't_out');
    this.enterBtn.style.display = outside ? '' : 'none';
    const real = (this.scenes.real_photos || []).includes(name);
    this.concept.textContent = real ? 'Real photo' : 'Concept illustration (AI-generated picture)';
    this.concept.classList.toggle('real', real);
  }

  // colour the dots of out-of-range values
  update(state) {
    const v = state.values;
    const open = v.door_angle > 1 || (v.door_open && !v.door_by_demo);
    if (open !== this.doorOpen) { this.doorOpen = open; this.show(); }
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
