// Wires the page together: clock, live state, photo view, 3D model, data bar, controls.
import { getJSON, SimClock, StateFeed } from './api.js';
import { updateDataBar, refreshPanel, hideTip } from './ui.js';
import { initDetails } from './details.js';
import { PhotoView } from './photo.js';
import { LedgerUI } from './ledgerui.js';
import { Batches } from './batch.js';
import { Control } from './control.js';
import { Tour } from './tour.js';

const $ = id => document.getElementById(id);

async function boot() {
  const [cfg, sensors, manifest, scenes, hotspots, demo] = await Promise.all([
    getJSON('api/config'), getJSON('api/sensors'), getJSON('assets/manifest.json'),
    getJSON('assets/scenes.json'), getJSON('assets/hotspots.json'), getJSON('api/demo_days')]);

  // start on the hottest day, 7 am, so the 8 am batch arrives soon
  const clock = new SimClock(demo[0].t, 720);
  const feed = new StateFeed(clock);
  initDetails(cfg, sensors, manifest, scenes, () => feed.state, () => clock.t);

  const photo = new PhotoView($('photoFrame'), manifest, scenes, hotspots);
  let model = null, view = 'photo', mode = 'auto';

  async function ensureModel() {
    if (model) return model;
    const { Model3D } = await import('./model3d.js');     // load three.js only when needed
    model = new Model3D($('three'), cfg, sensors, manifest);
    model.setLow($('lowgfx').checked);
    model.showDims($('dims').checked);
    if (feed.state) model.update(feed.state, mode);
    model.fps = info => (renderInfo = info);
    window.__model = model;   // for automated tests
    model.onInside = inside => { $('enter3d').textContent = inside ? '◂ Back outside' : 'Enter the cold room ▸'; };
    return model;
  }

  const ledgerUI = new LedgerUI(clock, feed);
  const batches = new Batches({ cfg, manifest, photo, getModel: () => model, clock, feed, ledgerUI });
  const control = new Control({ cfg, sensors, feed });
  const toPhoto = () => { if (view !== 'photo') $('viewSeg').querySelector('[data-view=photo]').click(); };
  new Tour({ photo, clock, feed, demo, ledgerUI, control, batches, toPhoto });

  // 2D mode: photo view only, three.js is never loaded (safest on a weak laptop). Remembered; also ?2d=1
  const set2d = on => {
    document.body.classList.toggle('flat', on); $('flat2d').checked = on;
    try { localStorage.setItem('ct2d', on ? '1' : '0'); } catch (e) { /* private mode */ }
    if (on) toPhoto();
  };
  $('flat2d').onchange = e => set2d(e.target.checked);
  let want2d = new URLSearchParams(location.search).get('2d') === '1';
  try { want2d = want2d || localStorage.getItem('ct2d') === '1'; } catch (e) { /* ignore */ }

  // ---- controls
  $('viewSeg').onclick = async e => {
    const b = e.target.closest('button'); if (!b) return;
    view = b.dataset.view;
    [...$('viewSeg').children].forEach(x => x.classList.toggle('on', x === b));
    $('photoView').classList.toggle('on', view === 'photo');
    $('modelView').classList.toggle('on', view === 'model');
    document.body.classList.toggle('model', view === 'model');
    hideTip();
    if (view === 'model') (await ensureModel()).setActive(true); else model?.setActive(false);
  };
  // Day / Night / Monsoon move the SIMULATED CLOCK to a real matching moment,
  // so the picture and every number always agree. The view then follows the clock (Auto).
  $('modeSeg').onclick = e => {
    const b = e.target.closest('button'); if (!b) return;
    const day0 = Math.floor(clock.t / 86400) * 86400;
    const rainy = demo.find(d => d.why.startsWith('Dullest'));
    if (b.dataset.mode === 'day') clock.jump(day0 + 11 * 3600);
    if (b.dataset.mode === 'night') clock.jump(day0 + 22 * 3600);
    if (b.dataset.mode === 'monsoon' && rainy) clock.jump(Math.floor(rainy.t / 86400) * 86400 + 11 * 3600);
    feed.poll();
    flash(b);
  };
  function flash(b) {
    [...$('modeSeg').children].forEach(x => x.classList.toggle('on', x === b));
    setTimeout(() => [...$('modeSeg').children].forEach(x => x.classList.toggle('on', x.dataset.mode === 'auto')), 1500);
  }
  $('enter3d').onclick = async () => { const m = await ensureModel(); m.inside ? m.exit() : m.enter(); };

  // ---- performance readout: press F to show / hide (for testing on the stall laptop)
  let renderInfo = null, frames = 0, fpsT = performance.now();
  addEventListener('keydown', e => {
    if ((e.key === 'f' || e.key === 'F') && !['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) $('fps').classList.toggle('on');
  });
  const fpsLoop = now => {
    frames++;
    if (now - fpsT >= 1000) {
      if ($('fps').classList.contains('on')) {
        const fps = frames * 1000 / (now - fpsT);
        let txt = `${fps.toFixed(0)} fps  (${view === 'model' ? '3D model' : 'photo view'})`;
        txt += fps >= 30 ? '  OK' : fps >= 20 ? '  try Low graphics' : '  SLOW – use Low graphics';
        if (view === 'model' && renderInfo) txt += `\n${renderInfo.calls} draw calls · ${(renderInfo.triangles / 1000).toFixed(0)}k triangles`;
        txt += `\nscreen ${innerWidth}×${innerHeight} @${devicePixelRatio}x · low gfx ${$('lowgfx').checked ? 'ON' : 'off'}`;
        $('fps').textContent = txt;
      }
      frames = 0; fpsT = now;
    }
    requestAnimationFrame(fpsLoop);
  };
  requestAnimationFrame(fpsLoop);

  $('curtain').onchange = e => { feed.curtain = e.target.checked; feed.poll(); };
  $('dims').onchange = e => model?.showDims(e.target.checked);
  $('lowgfx').onchange = e => {
    document.body.classList.toggle('lowgfx', e.target.checked);
    photo.setLow(e.target.checked); model?.setLow(e.target.checked);
  };
  $('play').onclick = () => { clock.playing = !clock.playing; $('play').textContent = clock.playing ? '❚❚' : '▶'; };
  $('speed').onchange = e => (clock.speed = +e.target.value);
  demo.forEach(d => $('jump').insertAdjacentHTML('beforeend', `<option value="${d.t}">${d.date}: ${d.why}</option>`));
  $('jump').onchange = e => { if (e.target.value) { clock.jump(+e.target.value); feed.poll(); } e.target.value = ''; };
  addEventListener('keydown', e => {
    if (view !== 'photo' || e.target.tagName === 'SELECT') return;
    if (e.key === 'ArrowRight') photo.go(photo.idx + 1, true);
    if (e.key === 'ArrowLeft') photo.go(photo.idx - 1, true);
  });

  function autoMode(s) {
    if (s.sun.elevation_deg < -2) return 'night';
    return s.day_class === 'rainy' ? 'monsoon' : 'day';
  }

  feed.on(s => {
    updateDataBar(s, cfg);
    photo.update(s);
    photo.setMode(autoMode(s));
    model?.update(s, mode);
    refreshPanel();
  });
  feed.start();
  if (want2d || window.STATIC_FORCE_2D) set2d(true);
  const loop = () => { clock.tick(); requestAnimationFrame(loop); };
  loop();
}

boot().catch(err => {
  document.body.insertAdjacentHTML('beforeend',
    `<div style="position:fixed;inset:30% 20%;background:#fff;color:#000;padding:20px;border-radius:10px;z-index:99">
     <b>Could not start.</b> Is the server running? Start it with <code>python run.py</code>.<br><small>${err}</small></div>`);
  console.error(err);
});
