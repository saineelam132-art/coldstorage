// Left side menu "Outside now" (opened with the ☰ button): today's date, the IST clock and the OUTSIDE
// conditions for this hour from Open-Meteo (air temperature, humidity, wind, solar irradiance, sky),
// read from the Live Year Run files (live/data/summary.js + live/data/h_current_YYYY-MM.js).
// Only measured weather here – calculated room values are on the Sensors page.
// Works offline: the files are on the laptop; if they are old it says so and uses the newest hour.
import { tagChip } from './ui.js';
import { SiteError, pmTag, u2, dewpoint, clearSky } from './siteerr.js';

const LAT = 17.69, LON = 83.22, IST_MIN = 330;
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const pad = n => String(n).padStart(2, '0');
const $ = id => document.getElementById(id);

// IST wall-clock time as a Date whose UTC fields ARE the IST fields
export const istNow = () => new Date(Date.now() + IST_MIN * 60e3);
const keyOf = d => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}`;
const dateOf = d => keyOf(d).slice(0, 10);
const hm = mins => `${pad(Math.floor(mins / 60) % 24)}:${pad(Math.round(mins % 60) % 60)}`;
function parseIST(s) {                         // "2026-11-08 11:53 IST" -> Date (IST fields in UTC)
  const m = /^(\d{4})-(\d\d)-(\d\d) (\d\d):(\d\d)/.exec(s || '');
  return m ? new Date(Date.UTC(+m[1], m[2] - 1, +m[3], +m[4], +m[5])) : null;
}
const niceDate = d => `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()].slice(0, 3)} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;

// NOAA sunrise / sunset (minutes after IST midnight) for Visakhapatnam
export function sunTimes(d) {
  const y = d.getUTCFullYear(), doy = Math.round((Date.UTC(y, d.getUTCMonth(), d.getUTCDate()) - Date.UTC(y, 0, 1)) / 864e5) + 1;
  const g = 2 * Math.PI / 365 * (doy - 1);
  const eq = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
  const decl = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g)
    - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
  const lat = LAT * Math.PI / 180;
  const ha = Math.acos(Math.cos(90.833 * Math.PI / 180) / (Math.cos(lat) * Math.cos(decl)) - Math.tan(lat) * Math.tan(decl)) * 180 / Math.PI;
  return { rise: 720 - 4 * (LON + ha) - eq + IST_MIN, set: 720 - 4 * (LON - ha) - eq + IST_MIN };
}

function loadScript(src) {
  return new Promise((ok, bad) => {
    const s = document.createElement('script');
    s.src = src; s.onload = () => { s.remove(); ok(); }; s.onerror = () => { s.remove(); bad(new Error(src)); };
    document.head.appendChild(s);
  });
}

// sky for one hour: rain > cloud cover > (if no cloud data) how bright the sun is
function skyOf(r, sunUp) {
  if (r.rain_mm !== null && r.rain_mm !== undefined && r.rain_mm >= 0.5) return 'rain';
  if (r.cloud_pct !== null && r.cloud_pct !== undefined) {
    if (r.cloud_pct >= 70) return 'cloudy';
    if (r.cloud_pct >= 30) return sunUp ? 'partly cloudy' : 'cloudy';
    return sunUp ? 'sunny' : 'clear';
  }
  if (!sunUp) return 'night';
  return r.poa > 450 ? 'sunny' : r.poa > 150 ? 'partly cloudy' : 'cloudy';
}
const ICON = { sunny: '☀️', clear: '🌙', night: '🌙', 'partly cloudy': '⛅', cloudy: '☁️', rain: '🌧️' };

export class Today {
  constructor(cfg) {
    this.cfg = cfg; this.rows = null; this.S = null; this.i = -1; this.listeners = []; this.focusKey = null;
    this.err = new SiteError(cfg.site_error_budget);
    this.el = $('outside');
    $('menuBtn').onclick = e => { e.stopPropagation(); this.open(!this.el.classList.contains('on')); };
    $('outsideClose').onclick = () => this.open(false);
    document.addEventListener('click', e => { if (this.el.classList.contains('on') && !this.el.contains(e.target)) this.open(false); });
    addEventListener('keydown', e => { if (e.key === 'Escape') this.open(false); });
    addEventListener('online', () => { this.badge(); this.refresh(); });
    addEventListener('offline', () => this.badge());
    setInterval(() => this.tick(), 1000);
    setInterval(() => this.refresh(), 30 * 60e3);            // new data every 30 min when online
  }
  on(fn) { this.listeners.push(fn); }
  open(on) {
    this.el.classList.toggle('on', on);
    this.el.setAttribute('aria-hidden', String(!on));
    $('menuBtn').setAttribute('aria-expanded', String(on));
  }

  async load(bust = false) {
    const v = bust ? `?v=${Date.now()}` : '';
    window.LIVE = window.LIVE || {};
    try { await loadScript(`live/data/summary.js${v}`); } catch (e) { /* keep what we have */ }
    this.S = window.LIVE.summary || null;
    const now = istNow(), mon = d => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`;
    const months = new Set([mon(now), mon(new Date(now - 864e5)), mon(new Date(+now + 864e5))]);
    if (this.S?.today) months.add(this.S.today.slice(0, 7));          // the newest data we have (fallback)
    const rows = { t: [] };
    for (const m of [...months].sort()) {
      const k = `h_current_${m}`;
      try { await loadScript(`live/data/${k}.js${v}`); } catch (e) { continue; }
      const h = window.LIVE[k]; if (!h) continue;
      const fields = Object.keys(h);
      fields.forEach(f => { rows[f] = rows[f] || []; });
      h.t.forEach((t, j) => { if (!rows.t.includes(t)) fields.forEach(f => rows[f].push(h[f][j])); });
    }
    this.rows = rows.t.length ? rows : null;
    this.compute();
  }
  refresh() { if (navigator.onLine) this.load(true); }

  // the calendar picked another moment: show the outside weather of THAT hour ('YYYY-MM-DD HH'), null = now
  async focus(key) {
    if (key === this.focusKey) return;
    this.focusKey = key;
    if (key && this.rows && !this.rows.t.includes(key)) {
      const k = `h_current_${key.slice(0, 7)}`;
      try { if (!window.LIVE[k]) await loadScript(`live/data/${k}.js`); } catch (e) { /* no file */ }
      const h = window.LIVE[k];
      if (h) {
        const R = this.rows, have = new Set(R.t), fields = Object.keys(h);
        fields.forEach(f => { R[f] = R[f] || new Array(R.t.length).fill(null); });
        const add = h.t.map((t, j) => (have.has(t) ? -1 : j)).filter(j => j >= 0);
        add.forEach(j => Object.keys(R).forEach(f => R[f].push(h[f] ? h[f][j] : null)));
        const order = R.t.map((t, i) => i).sort((a, b) => (R.t[a] < R.t[b] ? -1 : 1));
        Object.keys(R).forEach(f => { const c = R[f]; R[f] = order.map(i => c[i]); });
      }
    }
    if (this.focusKey === key) this.compute();
  }

  row(i) { const R = this.rows, o = {}; Object.keys(R).forEach(f => (o[f] = R[f][i])); return o; }
  dayRows(date) { return this.rows.t.map((t, i) => (t.startsWith(date) ? i : -1)).filter(i => i >= 0); }

  compute() {
    const now = istNow();
    this.stale = false; this.missing = !this.rows;
    if (!this.rows) { this.render(); return; }
    const gen = parseIST(this.S?.weather?.forecast?.updated || this.S?.generated);
    if (this.focusKey) {                              // a picked moment (calendar): that hour, no staleness warning
      const j = this.rows.t.indexOf(this.focusKey);
      if (j >= 0) { this.i = j; this.gen = gen; this.render(); this.listeners.forEach(fn => fn(this)); return; }
    }
    let i = this.rows.t.indexOf(keyOf(now));
    if (gen && now - gen > 24 * 3600e3) this.stale = true;
    if (i < 0) {                                     // newest available hour not after now (or the last one)
      this.stale = true;
      const k = keyOf(now);
      i = this.rows.t.reduce((b, t, j) => (t <= k ? j : b), -1);
      if (i < 0) i = this.rows.t.length - 1;
    }
    this.i = i; this.gen = gen;
    this.render();
    this.listeners.forEach(fn => fn(this));
  }

  // what the rest of the page needs: is it raining today (for the monsoon picture)?
  get rainToday() {
    if (!this.rows || this.i < 0) return false;
    const day = this.rows.t[this.i].slice(0, 10), ix = this.dayRows(day);
    const rain = ix.reduce((a, j) => a + (this.rows.rain_mm?.[j] || 0), 0);
    if (this.rows.rain_mm?.some(x => x !== null && x !== undefined)) return rain >= 2.0;
    const kwh = ix.reduce((a, j) => a + (this.rows.ghi[j] || 0), 0) / 1000;
    return kwh < (this.cfg.design.day_classes?.cloudy_min_kWh_m2 ?? 2.5);
  }

  tick() {
    const now = istNow();
    if (this.focusKey) {
      const d = new Date(Date.UTC(+this.focusKey.slice(0, 4), +this.focusKey.slice(5, 7) - 1, +this.focusKey.slice(8, 10), +this.focusKey.slice(11, 13)));
      $('smTitle').textContent = `Outside at ${pad(d.getUTCHours())}:00`;
      $('tdDate').textContent = `${DAYS[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
      $('tdClock').textContent = 'picked in the calendar';
      return;
    }
    $('smTitle').textContent = 'Outside now';
    $('tdDate').textContent = `${DAYS[now.getUTCDay()]}, ${now.getUTCDate()} ${MONTHS[now.getUTCMonth()]} ${now.getUTCFullYear()}`;
    $('tdClock').textContent = `${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(now.getUTCSeconds())} IST`;
    if (this.rows && this.i >= 0 && keyOf(now) !== this.rows.t[this.i] && !this.stale) this.compute();   // new hour
    else if (this.rows && this.stale && now.getUTCSeconds() === 0) this.compute();
  }
  badge() {
    const off = !navigator.onLine;
    const b = $('tdOffline');
    b.hidden = !off;
    b.textContent = `Offline – using data from ${this.gen ? niceDate(this.gen) : 'the copy on this laptop'}`;
  }

  render() {
    this.tick(); this.badge();
    const live = $('tdLive'), warn = $('tdWarn'), box = $('tdWx');
    if (this.missing) {
      live.textContent = 'No weather data file found';
      warn.hidden = true; box.innerHTML = '';
      return;
    }
    const r = this.row(this.i), when = this.rows.t[this.i];
    const day = when.slice(0, 10), hh = +when.slice(11, 13);
    const dd = new Date(Date.UTC(+day.slice(0, 4), +day.slice(5, 7) - 1, +day.slice(8, 10)));
    const st = sunTimes(dd), mins = hh * 60 + 30;
    const sky = skyOf(r, mins > st.rise && mins < st.set);
    live.textContent = `Data updated ${this.gen ? niceDate(this.gen) : '—'}`;
    warn.hidden = !this.stale || !!this.focusKey;
    warn.textContent = `Showing data from ${day} ${pad(hh)}:00 – live update pending`;
    const ghi = (r.ghi ?? 0) / (this.S?.sun_factor || 1);          // Open-Meteo value (the files store the ×0.88 model value)
    const W = tagChip('W'), fc = r.pred ? '<i class="fc">forecast</i>' : '';
    const E = this.err, f = (x, d) => Number(x).toFixed(d);
    const band = (lo, hi, d, u) => E.ok ? `<small class="band">expected at site: ${f(lo, d)}–${f(hi, d)} ${u} ${pmTag()}</small>` : '';
    const w2 = u2(r.wind);
    const omTd = r.dew_C !== null && r.dew_C !== undefined;
    const Td = omTd ? r.dew_C : dewpoint(r.T_out, r.RH_out);
    const [tl, th, dT] = E.ok ? E.temp(r.T_out, hh, ghi, r.wind) : [0, 0, 0];
    const [hl, hhi] = E.ok ? E.rh(r.T_out, r.RH_out, dT, Td) : [0, 0];
    const [dl, dh] = E.ok ? E.dew(Td) : [0, 0];
    const [gl, gh] = E.ok ? E.ghi(ghi, clearSky(day, hh)) : [0, 0];
    const [wl, wh] = E.ok ? E.wind2(w2) : [0, 0];
    box.innerHTML = `
      <div class="om"><span>Outside air temperature${W}</span><b>${r.T_out?.toFixed(1)} °C</b>${fc}${band(tl, th, 1, '°C')}</div>
      <div class="om"><span>Outside relative humidity${W}</span><b>${r.RH_out?.toFixed(0)} %</b>${band(hl, hhi, 0, '%')}
        <span class="sub">Dew point <b>${Td.toFixed(1)} °C</b>${omTd ? '' : ' (from temperature + humidity)'}</span>${band(dl, dh, 1, '°C')}</div>
      <div class="om"><span>Wind at 2 m (converted from 10 m)${W}</span><b>${(w2 * 3.6).toFixed(0)} km/h</b>${band(wl * 3.6, wh * 3.6, 0, 'km/h')}</div>
      <div class="om"><span>Solar irradiance (horizontal)${W}</span><b>${ghi.toFixed(0)} W/m²</b>${band(gl, gh, 0, 'W/m²')}</div>
      <div class="om"><span>Sky${W}</span><b class="sky">${ICON[sky] || ''} ${sky}</b></div>
      ${E.ok ? `<div class="omnote band">${pmTag()} ${E.B.statement}</div>` : ''}
      <div class="omnote">Hour ${pad(hh)}:00–${pad((hh + 1) % 24)}:00 IST. Weather data by Open-Meteo.com.</div>`;
  }
}
