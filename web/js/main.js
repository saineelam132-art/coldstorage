// Wires the page together: clock, live state, photo view, outside menu, data bar, controls.
import { getJSON, SimClock, StateFeed } from './api.js';
import { updateDataBar, refreshPanel } from './ui.js';
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

  // the header may wrap onto two rows on narrow screens: the page starts below it
  const top = document.querySelector('.topbar');
  let topH = 0;
  const fitTop = () => { if (top.offsetHeight !== topH) { topH = top.offsetHeight; document.documentElement.style.setProperty('--topH', `${topH}px`); dispatchEvent(new Event('resize')); } };
  new ResizeObserver(fitTop).observe(top); fitTop();

  // left menu (☰): today's date, IST clock and the OUTSIDE weather of this hour (live/data files)
  const today = new Today(cfg);
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
    setMode('auto', false);
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

  const photo = new PhotoView($('photoFrame'), manifest, scenes, hotspots);
  let mode = 'auto', win = null;

  const ledgerUI = new LedgerUI(clock, feed);
  const batches = new Batches({ cfg, manifest, photo, clock, feed, ledgerUI });
  const control = new Control({ cfg, sensors, feed });
  const tour = new Tour({ photo, clock, feed, demo, ledgerUI, control, batches, toPhoto: () => {}, cfg });

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
      setMode('auto', false);
      tour.start();
      $('stage').addEventListener('click', e => {
        if (!tour.running || e.target.closest('#panel,.tourbar,button,a,select,input')) return;
        tour.pause();
      });
    };
  }

  // ---- Auto / Day / Night / Monsoon
  // Auto: the picture and numbers follow the clock (real time now) and the weather by themselves.
  // Day / Night / Monsoon STAY until another button is clicked: the simulated clock plays a real
  // stretch of 2026 of that kind in a loop, so every reading shown belongs to that mode.
  const startOf = why => { const d = demo.find(x => x.why.startsWith(why)) || demo[0]; return Math.floor(d.t / 86400) * 86400; };
  const WINDOWS = {
    day: () => [startOf('Sunniest') + 9 * 3600, startOf('Sunniest') + 16 * 3600],       // sunniest day, 9 am – 4 pm
    night: () => [startOf('Hottest') + 20 * 3600, startOf('Hottest') + 29 * 3600],      // hottest day's night, 8 pm – 5 am
    monsoon: () => [startOf('Dullest') + 9 * 3600, startOf('Dullest') + 16 * 3600],     // rainiest day, 9 am – 4 pm
  };
  function setMode(m, moveClock = true) {
    mode = m;
    [...$('modeSeg').children].forEach(x => x.classList.toggle('on', x.dataset.mode === m));
    win = m === 'auto' ? null : WINDOWS[m]();
    if (moveClock && win) {
      clock.jump(win[0]); clock.playing = true; $('play').textContent = '❚❚';
      if (clock.speed === 1) { clock.speed = 720; $('speed').value = '720'; }
    }
    if (moveClock && m === 'auto' && hasNow()) { clock.jump(nowT()); clock.speed = 1; $('speed').value = '1'; }
    if (m !== 'auto') photo.setMode(m);
    feed.poll();
  }
  $('modeSeg').onclick = e => { const b = e.target.closest('button'); if (b) setMode(b.dataset.mode); };
  // anything else that moves the clock (demo, Jump to…, Now) goes back to Auto
  $('tourBtn').addEventListener('click', () => setMode('auto', false), true);

  // ---- performance readout: press F to show / hide (for testing on the stall laptop)
  let frames = 0, fpsT = performance.now();
  addEventListener('keydown', e => {
    if ((e.key === 'f' || e.key === 'F') && !['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) $('fps').classList.toggle('on');
  });
  const fpsLoop = now => {
    frames++;
    if (now - fpsT >= 1000) {
      if ($('fps').classList.contains('on')) {
        const fps = frames * 1000 / (now - fpsT);
        let txt = `${fps.toFixed(0)} fps  (photo view)`;
        txt += fps >= 30 ? '  OK' : fps >= 20 ? '  try Low graphics' : '  SLOW – use Low graphics';
        txt += `\nscreen ${innerWidth}×${innerHeight} @${devicePixelRatio}x · low gfx ${$('lowgfx').checked ? 'ON' : 'off'}`;
        $('fps').textContent = txt;
      }
      frames = 0; fpsT = now;
    }
    requestAnimationFrame(fpsLoop);
  };
  requestAnimationFrame(fpsLoop);

  $('curtain').onchange = e => { feed.curtain = e.target.checked; feed.poll(); };
  $('lowgfx').onchange = e => {
    document.body.classList.toggle('lowgfx', e.target.checked);
    photo.setLow(e.target.checked);
  };
  $('play').onclick = () => { clock.playing = !clock.playing; $('play').textContent = clock.playing ? '❚❚' : '▶'; };
  $('speed').onchange = e => (clock.speed = +e.target.value);
  demo.forEach(d => $('jump').insertAdjacentHTML('beforeend', `<option value="${d.t}">${d.date}: ${d.why}</option>`));
  $('jump').onchange = e => {
    if (e.target.value) {
      setMode('auto', false);
      clock.jump(+e.target.value);
      if (clock.speed === 1) { clock.speed = 720; $('speed').value = '720'; }     // demo days play fast
      feed.poll();
    }
    e.target.value = '';
  };
  addEventListener('keydown', e => {
    if (e.target.tagName === 'SELECT' || e.target.tagName === 'INPUT') return;
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
    photo.setMode(mode === 'auto' ? autoMode(s) : mode);
    refreshPanel();
  });
  feed.start();
  const loop = () => {
    clock.tick();
    if (win && (clock.t < win[0] || clock.t >= win[1])) clock.jump(win[0]);     // stay inside the chosen mode
    requestAnimationFrame(loop);
  };
  loop();
}

boot().catch(err => {
  document.body.insertAdjacentHTML('beforeend',
    `<div style="position:fixed;inset:30% 20%;background:#fff;color:#000;padding:20px;border-radius:10px;z-index:99">
     <b>Could not start.</b> Is the server running? Start it with <code>python run.py</code>.<br><small>${err}</small></div>`);
  console.error(err);
});
