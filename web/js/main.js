// Wires the page together: clock, live state, photo view, outside menu, data bar, controls.
import { setPhotos } from './photos.js';
import { getJSON, SimClock, StateFeed } from './api.js';
import { updateDataBar, refreshPanel } from './ui.js';
import { initDetails, openSensor, openPart, followClock } from './details.js';
import { PhotoView } from './photo.js';
import { LedgerUI } from './ledgerui.js';
import { Batches } from './batch.js';
import { Control } from './control.js';
import { Tour } from './tour.js';
import { Today } from './today.js';
import { door } from './door.js';
import { TimeBase, YearDays } from './yeardata.js';
import { TimeNav } from './calendar.js';
import { fmt } from './ui.js';

const $ = id => document.getElementById(id);

async function boot() {
  const [cfg, sensors, manifest, scenes, hotspots, demo] = await Promise.all([
    getJSON('api/config'), getJSON('api/sensors'), getJSON('assets/manifest.json'),
    getJSON('assets/scenes.json'), getJSON('assets/hotspots.json'), getJSON('api/demo_days')]);
  setPhotos(await getJSON('assets/photos.json').catch(() => null), cfg);   // real photos for the cards (tools/photos.py)

  // the header may wrap onto two rows on narrow screens: the page starts below it
  const top = document.querySelector('.topbar');
  let topH = 0;
  const fitTop = () => { if (top.offsetHeight !== topH) { topH = top.offsetHeight; document.documentElement.style.setProperty('--topH', `${topH}px`); dispatchEvent(new Event('resize')); } };
  new ResizeObserver(fitTop).observe(top); fitTop();
  // the bottom bar grows when its controls wrap; the 'Showing:' strip pushes the caption down on phones
  const bar = document.querySelector('.databar'), strip = $('showing');
  const fitBar = () => document.documentElement.style.setProperty('--barH', `${bar.offsetHeight}px`);
  const fitStrip = () => document.documentElement.style.setProperty('--stripH', `${strip.offsetHeight ? strip.offsetHeight + 4 : 0}px`);
  new ResizeObserver(fitBar).observe(bar); fitBar();
  new ResizeObserver(fitStrip).observe(strip); fitStrip();

  // left menu (☰): today's date, IST clock and the OUTSIDE weather of this hour (live/data files)
  const today = new Today(cfg);
  today.load();

  // the simulated clock starts at the REAL present moment (IST) when the twin has data for it;
  // otherwise on the hottest day of 2026, just before the 6 am batch
  const tinfo = cfg.time || {};
  const nowT = () => (Date.now() + 5.5 * 3600e3 - Date.parse((tinfo.t0 || '2026-01-01T00:00:00') + 'Z')) / 1000;
  const hasNow = () => tinfo.t_end && nowT() >= 0 && nowT() < tinfo.t_end;
  const SA = window.STATIC_API;
  const tb = new TimeBase(tinfo.t0);
  const tEnd = () => (SA ? SA.range().days * 86400 : (tinfo.t_end || 365 * 86400));
  const params = new URLSearchParams(location.search);
  const judge = params.get('judge') === '1';
  // ?t=2026-05-22T14:00 opens the site at that moment (shareable link; judge mode can open on a fixed day)
  let tParam = params.has('t') ? tb.fromParam(params.get('t')) : null;
  if (tParam !== null && !(tParam >= 0 && tParam < tEnd())) { console.warn('?t= is outside the data range:', params.get('t')); tParam = null; }
  if (tParam !== null && SA && !(await SA.prepare(tParam))) tParam = null;
  const startLive = tParam === null && hasNow() && !judge;
  const clock = new SimClock(tParam !== null ? tParam : startLive ? nowT() : demo[0].t, tParam !== null ? (judge ? 720 : 1) : startLive ? 1 : 720);
  if (SA && startLive && Math.abs(SA.clamp(clock.t) - clock.t) > 3600) { clock.t = demo[0].t; clock.speed = 720; }
  $('speed').value = String(clock.speed);
  const isLive = () => hasNow() && Math.abs(clock.t - nowT()) < 1800;
  $('liveNow').onclick = async () => {
    if (!hasNow()) { alert('The saved data does not reach today yet – the next data update will add it.'); return; }
    setMode('auto', false);
    if (SA) await SA.prepare(nowT());
    clock.jump(nowT()); clock.speed = 1; clock.playing = true; $('speed').value = '1'; $('play').textContent = '❚❚'; feed.poll();
    setURL(null);
  };
  function setURL(t) {                                     // the picked moment goes into the address (shareable)
    try {
      const u = new URL(location.href);
      if (t === null) u.searchParams.delete('t'); else u.searchParams.set('t', tb.toParam(t));
      history.replaceState(null, '', u.pathname + (u.search || '').replace(/%3A/gi, ':') + u.hash);
    } catch (e) { /* some browsers block this for file:// pages */ }
  }
  // ONE way to move the whole site to a moment: calendar, time slider, quick links and ?t= all use it.
  // The clock keeps running from there at the selected speed.
  async function goTo(t) {
    t = Math.max(0, Math.min(tEnd() - 1, t));
    setMode('auto', false);
    if (SA) await SA.prepare(t);
    clock.jump(t); clock.playing = true; $('play').textContent = '❚❚';
    feed.poll();
    setURL(t);
  }
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
    const R = today.rows, sf = today.S?.sun_factor || 1, col = f => ix.map(j => (R[f] ? R[f][j] : null));
    return { labels: ix.map(j => `${R.t[j].slice(11)}:00`), values: col(q),
      ctx: { T_out: col('T_out'), wind: col('wind'), dew_C: col('dew_C'), ghi: ix.map(j => (R.ghi[j] ?? 0) / sf) } };
  };
  initDetails(cfg, sensors, manifest, scenes, () => feed.state, () => clock.t, todaySeries);
  window.__openSensor = openSensor;                     // for automated page checks

  // ---- calendar + time picker (bottom bar) and the "Showing:" strip
  const days = await new YearDays().load();
  // Tomorrow's plan (twin/advisor.py -> live/data/advisor.js): in the side menu + a chip in the strip
  let planChip = '';
  const loadPlain = src => new Promise(ok => { const sc = document.createElement('script'); sc.src = src; sc.onload = sc.onerror = () => { sc.remove(); ok(); }; document.head.appendChild(sc); });
  Promise.all([loadPlain('live/data/advisor.js'), loadPlain('live/advisor_card.js')]).then(() => {
    if (!window.renderAdvisor) return;
    window.renderAdvisor($('tdPlan'));
    const d = window.LIVE?.advisor?.days?.[0];
    if (d) planChip = `<button class="planchip ${d.rule}" onclick="document.getElementById('menuBtn').click()" title="${d.advice.replace(/"/g, '')}">🗓 Tomorrow: ${{ normal: '☀ solar + wax only', low_sun: '⛅ grid may be needed', storm: '⛈ storm – prepare' }[d.rule]}</button>`;
  });
  let headline = '';                                     // best case vs realistic (results/live/stress_2026.json)
  getJSON('results/live/stress_2026.json').then(S => {
    const h = S.headline;
    headline = `<span class="hl" title="Reality check (Control centre): best case vs all loopholes together, of ${h.days} days">☀ ${h.base_days} days best case · ${h.realistic_days} realistic (${h.realistic_fix_days} with smart controller)</span>`;
    return getJSON('results/live/valves_2026.json');
  }).then(V => {                                         // chosen valves (solenoid + TXV), same 2026 weather
    if (!V || !V.headline) return;
    const v = V.headline, e = V.headline_eev || {};
    headline += ` <span class="hl" title="2026 twin with the chosen solenoid + TXV valves (two EEVs: ${e.days_full_solar_wax} days, ${Math.round(e.grid_h)} grid h). From results/live/valves_2026.json">🔧 Solenoid + TXV: ${v.days_full_solar_wax} of ${v.days} days on solar + wax · ${Math.round(v.grid_h)} grid h</span>`;
  }).catch(() => {});
  const calCtx = () => {
    const last = Math.floor(tEnd() / 86400) - 1, todayDay = Math.floor(nowT() / 86400);
    const tm = days.tomorrow ? tb.dayOf(days.tomorrow) : null;
    const forecastDay = tm !== null && tm === todayDay + 1 && tm <= last && days.info(days.tomorrow) ? tm : null;
    return { lastDataDay: last, todayDay, forecastDay, canShow: SA ? SA.canShow : null };
  };
  const nav = new TimeNav({ tb, days, demo, getT: () => clock.t, goTo, ctx: calCtx });
  window.__kk = { clock, feed, goTo, tb, nav, days, control: () => control, openPart, openSensor };      // for automated page checks
  if (SA) setTimeout(() => SA.preloadAll(), 1500);      // all months in the background: the clock can play on freely
  setInterval(followClock, 1000);                        // open sensor graph: red line follows the clock
  let stripT = 0;
  function showStrip(s) {
    if (performance.now() - stripT < 700) return;
    stripT = performance.now();
    const v = s.values, live = isLive(), day = tb.dayIndex(s.t), date = tb.dateStr(day), info = days.info(date);
    const src = v.grid_on ? 'GRID' : (v.P_solar_used > 0 ? 'SOLAR' : 'WAX');
    const fc = info && (info.status === 'prediction' || (info.status === 'today' && s.t > nowT() + 3600));
    const room = v.T_room_sensor ?? v.T_room;
    $('showing').innerHTML = `<span class="when ${live ? '' : 'past'}">${live ? '● Live now' : 'Showing'}: ${tb.nice(s.t)}</span>
      <span>Outside <b>${fmt(v.T_out, '°C')}</b></span><span>Room <b>${fmt(room, '°C')}</b></span>
      <span>Wax <b>${fmt(v.pcm_pct, '%')}</b></span><span>Power <b>${src}</b></span>
      ${info && info.saved !== null ? `<span><b>₹${Math.round(info.saved)}</b> saved that day</span>` : ''}
      <span class="badge sim">SIMULATED</span><span class="wx">WEATHER: ${fc ? 'forecast' : 'real'} (Open-Meteo)</span>
      ${headline}${planChip}${kk ? (kk.mode === 'live' ? '<span class="kklivechip" title="Batches, ledger and alerts are shared and saved">● Live data</span>' : '<span class="kkoffchip" title="Firestore not reachable: batches and alerts stay in this browser">Offline demo</span>') : ''}
      ${SA && SA.isRebuilt && SA.isRebuilt(day) ? '<span class="rebuilt" title="This day has no saved 5-minute steps in the offline copy: they are rebuilt from the hourly Live Year Run results (same twin run).">5-min detail from hourly results</span>' : ''}`;
    $('liveLink').href = live ? 'live.html' : `live.html?d=${date}`;
    today.focus(live ? null : `${date} ${String(tb.date(s.t).getUTCHours()).padStart(2, '0')}`);
  }

  const photo = new PhotoView($('photoFrame'), manifest, scenes, hotspots);
  let mode = 'auto', win = null;

  const ledgerUI = new LedgerUI(clock, feed);
  const batches = new Batches({ cfg, manifest, photo, clock, feed, ledgerUI });
  const control = new Control({ cfg, sensors, feed });
  const tour = new Tour({ photo, clock, feed, demo, ledgerUI, control, batches, toPhoto: () => {}, cfg });

  // JUDGE MODE (?judge=1): full screen, big fonts, the demo plays slowly and loops; a click pauses it
  if (judge) {
    document.body.classList.add('judge');
    tour.slow = 1.6; tour.loop = true;
    const go = document.createElement('button');
    go.className = 'judgego';
    go.innerHTML = tParam !== null ? `▶ Start – ${tb.nice(tParam, false)}<br><small>full screen · this day plays in a loop · click to pause / resume</small>`
      : '▶ Start the demo<br><small>full screen · click anywhere to pause / resume</small>';
    document.body.appendChild(go);
    go.onclick = async () => {
      go.remove();
      try { await document.documentElement.requestFullscreen(); } catch (e) { /* not allowed: carry on in the window */ }
      setMode('auto', false);
      if (tParam !== null) {                               // judge mode on a fixed day (?t=): that day in a loop
        const d0 = Math.floor(tParam / 86400) * 86400;
        win = [d0, d0 + 86400]; clock.jump(tParam); clock.speed = 720; $('speed').value = '720'; clock.playing = true;
        $('stage').addEventListener('click', e => { if (!e.target.closest('#panel,button,a,select,input')) clock.playing = !clock.playing; });
        return;
      }
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

  // shared alerts (Firestore or the offline demo): the affected tiles turn red and open the investigation page
  let kk = null, alertTiles = {};
  if (window.KKStore) window.KKStore.get().then(st => {
    kk = st;
    const upd = () => {
      alertTiles = {};
      for (const a of Object.values(st.alerts)) {
        if (a.status === 'reviewed') continue;
        const tiles = (a.sensors || []).map(x => (x === 'outside' ? 'd_out' : 'd_room'));
        for (const t of tiles) if (!alertTiles[t] || a.created > alertTiles[t].created) alertTiles[t] = a;
      }
      applyAlerts();
    };
    st.on(upd); upd();
  });
  function applyAlerts() {
    for (const t of ['d_room', 'd_out']) {
      const el = $(t), a = alertTiles[t], cell = el.closest('.cell');
      cell.classList.toggle('alerted', !!a);
      cell.onclick = a ? () => { location.href = window.KKStore.link(`alert.html?id=${encodeURIComponent(a.id)}`); } : null;
      cell.title = a ? `${a.label}: ${a.reason} – click to investigate` : '';
      if (a) { el.className = 'bad'; if (!el.querySelector('.flag')) el.insertAdjacentHTML('beforeend', '<small class="flag">⚠ SENSOR SUSPICIOUS</small>'); }
    }
  }
  feed.on(s => {
    updateDataBar(s, cfg);
    applyAlerts();
    photo.update(s);
    photo.setMode(mode === 'auto' ? autoMode(s) : mode);
    refreshPanel();
    showStrip(s);
  });
  feed.start();
  const loop = () => {
    clock.tick();
    if (win && (clock.t < win[0] || clock.t >= win[1])) clock.jump(win[0]);     // stay inside the chosen mode
    if (!win && clock.t >= tEnd()) { clock.t = tEnd() - 1; clock.playing = false; $('play').textContent = '▶'; }   // end of the data
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
