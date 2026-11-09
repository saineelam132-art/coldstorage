// Wires the page together: clock, live state, photo view, 3D model, data bar, controls.
import { getJSON, SimClock, StateFeed } from './api.js';
import { updateDataBar, refreshPanel, hideTip } from './ui.js';
import { initDetails } from './details.js';
import { PhotoView } from './photo.js';
import { LedgerUI } from './ledgerui.js';
import { Batches } from './batch.js';
import { Control } from './control.js';
import { Tour } from './tour.js';
import { Today } from './today.js';
import { door } from './door.js';

const $ = id => document.getElementById(id);

async function boot() {
  const [cfg, sensors, manifest, scenes, hotspots, demo] = await Promise.all([
    getJSON('api/config'), getJSON('api/sensors'), getJSON('assets/manifest.json'),
    getJSON('assets/scenes.json'), getJSON('assets/hotspots.json'), getJSON('api/demo_days')]);

  // TODAY strip: real date, IST clock, real weather of this hour and the twin's state (live/data files)
  const today = new Today(cfg);
  const todayEl = $('today');
  let lastH = -1;
  const setTodayH = () => {
    if (todayEl.offsetHeight === lastH) return;
    lastH = todayEl.offsetHeight;
    document.documentElement.style.setProperty('--todayH', `${lastH}px`);
    dispatchEvent(new Event('resize'));                    // pictures re-fit the smaller stage
  };
  new ResizeObserver(setTodayH).observe(todayEl); setTodayH();
  today.load();

  // the simulated clock starts at the REAL present moment (IST) when the twin has data for it;
  // otherwise on the hottest day of 2026, just before the 6 am batch
  const tinfo = cfg.time || {};
  const nowT = () => (Date.now() + 5.5 * 3600e3 - Date.parse((tinfo.t0 || '2026-01-01T00:00:00') + 'Z')) / 1000;
  const hasNow = () => tinfo.t_end && nowT() >= 0 && nowT() < tinfo.t_end;
  const startLive = hasNow() && new URLSearchParams(location.search).get('judge') !== '1';
  const clock = new SimClock(startLive ? nowT() : demo[0].t, startLive ? 1 : 720);
  if (window.STATIC_API && startLive && Math.abs(window.STATIC_API.clamp(clock.t) - clock.t) > 3600) { clock.t = demo[0].t; clock.speed = 720; }
  $('speed').value = String(clock.speed);
  const isLive = () => hasNow() && Math.abs(clock.t - nowT()) < 1800;
  $('liveNow').onclick = () => {
    if (!hasNow()) { alert('The saved data does not reach today yet – the next data update will add it.'); return; }
    clock.jump(nowT()); clock.speed = 1; clock.playing = true; $('speed').value = '1'; $('play').textContent = '❚❚'; feed.poll();
  };
  setInterval(() => $('liveNow').classList.toggle('on', isLive()), 1000);
  const feed = new StateFeed(clock);
  feed.transform = s => (door.apply(s.values, s.t), s);
  let doorTimer = null;                                    // 12 updates a second while the door swings
  door.onChange(() => {
    clearInterval(doorTimer);
    doorTimer = setInterval(() => { feed.emit(); if (!door.active) clearInterval(doorTimer); }, 80);
  });
  // weather-sensor graphs use TODAY's real hourly weather when the clock is at the live moment
  const todaySeries = q => {
    if (!today.rows || today.stale || !isLive() || !today.rows[q]) return null;
    const day = today.rows.t[today.i].slice(0, 10), ix = today.dayRows(day).filter(j => j <= today.i);
    return { labels: ix.map(j => `${today.rows.t[j].slice(11)}:00`), values: ix.map(j => today.rows[q][j]) };
  };
  initDetails(cfg, sensors, manifest, scenes, () => feed.state, () => clock.t, todaySeries);

  // the loading statement, on every page
  const Y = cfg.year_summary || {};
  if (Y.hot_load_h_per_day !== undefined) {
    $('simnote').innerHTML += ` · Rated 150 kg. Room air above 8 °C only while a fresh warm batch is cooling (no stored product inside): ${Y.hot_load_h_per_day.toFixed(1)} h/day average. All other times: ${Y.hot_other_h.toFixed(0)} h outside 2–8 °C.`;
  }
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
  const tour = new Tour({ photo, clock, feed, demo, ledgerUI, control, batches, toPhoto, cfg });

  // poster headline numbers, read from results/live/design_study_2026.json (never typed in)
  getJSON('results/live/design_study_2026.json').then(st => {
    const fin = Object.entries(st.journey || {}).find(([k]) => k.startsWith('3)'))?.[1];
    const money = Object.values(st.wax_compare || {})[0];
    if (!fin || !money) return;
    $('tdHeadline').innerHTML = `<span class="hlt">Poster headline · simulated on real 2026 Vizag weather:</span>
      <span class="hn"><b>${fin.days_full_solar_wax}/${fin.days}</b> days on solar + wax</span>
      <span class="hn"><b>${fin.moving_parts}</b> fans</span>
      <span class="hn"><b>${fin.grid_h_per_year.toFixed(0)}</b> grid h/yr</span>
      <span class="hn"><b>₹${(money.saved_vs_diesel_INR_yr / 1000).toFixed(1)}k</b>/yr vs diesel</span>
      <span class="hn"><b>${(money.co2_saved_vs_diesel_kg_yr / 1000).toFixed(1)} t</b> CO₂/yr</span>`;
    setTodayH();
  }).catch(e => console.warn('headline', e));

  // JUDGE MODE (?judge=1): full screen, big fonts, the demo plays slowly and loops; a click pauses it
  if (new URLSearchParams(location.search).get('judge') === '1') {
    document.body.classList.add('judge');
    tour.slow = 1.6; tour.loop = true;
    const go = document.createElement('button');
    go.className = 'judgego'; go.innerHTML = '▶ Start the demo<br><small>full screen · click anywhere to pause / resume</small>';
    document.body.appendChild(go);
    go.onclick = async () => {
      go.remove();
      try { await document.documentElement.requestFullscreen(); } catch (e) { /* not allowed: carry on in the window */ }
      tour.start();
      $('stage').addEventListener('click', e => {
        if (!tour.running || e.target.closest('#panel,.tourbar,button,a,select,input')) return;
        tour.pause();
      });
    };
  }

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
  $('jump').onchange = e => {
    if (e.target.value) {
      clock.jump(+e.target.value);
      if (clock.speed === 1) { clock.speed = 720; $('speed').value = '720'; }     // demo days play fast
      feed.poll();
    }
    e.target.value = '';
  };
  addEventListener('keydown', e => {
    if (view !== 'photo' || e.target.tagName === 'SELECT') return;
    if (e.key === 'ArrowRight') photo.go(photo.idx + 1, true);
    if (e.key === 'ArrowLeft') photo.go(photo.idx - 1, true);
  });

  // day picture between sunrise and sunset, night picture otherwise; monsoon picture on a rainy day
  // (at the live moment 'rainy' = today's real rain from Open-Meteo, otherwise the twin's day class)
  function autoMode(s) {
    if (s.sun.elevation_deg < -0.83) return 'night';
    if (isLive() && today.rows) return today.rainToday ? 'monsoon' : 'day';
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
