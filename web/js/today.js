// Home page "TODAY in Visakhapatnam": the real date and IST clock, the REAL weather for this hour
// (Open-Meteo) and the digital twin's state for this hour, read from the Live Year Run files
// (live/data/summary.js + live/data/h_current_YYYY-MM.js, written by the GitHub Action).
// Works offline: the files are on the laptop; if they are old it says so and uses the newest hour.
import { tagChip } from './ui.js';

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
    this.cfg = cfg; this.rows = null; this.S = null; this.i = -1; this.listeners = [];
    this.el = $('today');
    this.el.querySelector('.tdtoggle').onclick = () => this.toggle();
    if (innerWidth < 760) this.toggle(true);
    addEventListener('online', () => { this.badge(); this.refresh(); });
    addEventListener('offline', () => this.badge());
    setInterval(() => this.tick(), 1000);
    setInterval(() => this.refresh(), 30 * 60e3);            // new data every 30 min when online
  }
  on(fn) { this.listeners.push(fn); }
  toggle(force) {
    const c = force ?? !this.el.classList.contains('small');
    this.el.classList.toggle('small', c);
    this.el.querySelector('.tdtoggle').textContent = c ? '▾ more' : '▴ less';
    this.el.querySelector('.tdtoggle').setAttribute('aria-expanded', String(!c));
    dispatchEvent(new Event('resize'));
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

  row(i) { const R = this.rows, o = {}; Object.keys(R).forEach(f => (o[f] = R[f][i])); return o; }
  dayRows(date) { return this.rows.t.map((t, i) => (t.startsWith(date) ? i : -1)).filter(i => i >= 0); }

  compute() {
    const now = istNow();
    this.stale = false; this.missing = !this.rows;
    if (!this.rows) { this.render(); return; }
    let i = this.rows.t.indexOf(keyOf(now));
    const gen = parseIST(this.S?.weather?.forecast?.updated || this.S?.generated);
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

  saving(ix) {
    const tariff = this.S?.money?.defaults?.grid_tariff_INR_kWh ?? 8;
    if (!this.rows.gonly_kWh) return null;
    return ix.reduce((a, j) => a + ((this.rows.gonly_kWh[j] || 0) - (this.rows.P_grid[j] || 0)), 0) * tariff;
  }

  tick() {
    const now = istNow();
    $('tdDate').textContent = `${DAYS[now.getUTCDay()]}, ${now.getUTCDate()} ${MONTHS[now.getUTCMonth()]} ${now.getUTCFullYear()}`;
    $('tdClock').textContent = `${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(now.getUTCSeconds())} IST`;
    if (this.rows && this.i >= 0 && keyOf(now) !== this.rows.t[this.i] && !this.stale) this.compute();   // new hour
    else if (this.rows && this.stale && now.getUTCSeconds() === 0) this.compute();
  }
  badge() {
    const off = !navigator.onLine;
    const b = $('tdOffline');
    b.hidden = !off;
    b.textContent = `Offline – using data from ${this.gen ? niceDate(this.gen) : 'the laptop copy'}`;
  }

  render() {
    this.tick(); this.badge();
    const live = $('tdLive'), warn = $('tdWarn');
    if (this.missing) {
      live.innerHTML = '<span class="dot off"></span>No live data file';
      warn.hidden = false; warn.textContent = 'Live data not found – showing the simulation only (run python -m twin.live_run).';
      ['tdWx', 'tdTwin', 'tdTom'].forEach(id => ($(id).innerHTML = ''));
      return;
    }
    const r = this.row(this.i), when = this.rows.t[this.i];
    const day = when.slice(0, 10), hh = +when.slice(11, 13);
    const dd = new Date(Date.UTC(+day.slice(0, 4), +day.slice(5, 7) - 1, +day.slice(8, 10)));
    const st = sunTimes(dd), mins = hh * 60 + 30;
    const sunUp = mins > st.rise && mins < st.set;
    const sky = skyOf(r, sunUp);
    const ix = this.dayRows(day), Tday = ix.map(j => this.rows.T_out[j]).filter(x => x !== null);
    live.innerHTML = this.stale
      ? `<span class="dot old"></span>Updated ${this.gen ? niceDate(this.gen) : '—'}`
      : `<span class="dot"></span>Live · updated ${this.gen ? niceDate(this.gen) : '—'}`;
    warn.hidden = !this.stale;
    warn.textContent = `Showing data from ${day} ${pad(hh)}:00 – live update pending`;
    const fc = r.pred ? ' <i class="fc">forecast</i>' : '';
    const W = tagChip('W'), S = tagChip('S'), C = tagChip('C');
    $('tdWx').innerHTML = `
      <span class="sky" title="${sky}">${ICON[sky] || ''} <b>${sky}</b></span>
      <span><b>${r.T_out?.toFixed(1)} °C</b> outside${W}${fc}</span>
      <span>RH <b>${r.RH_out?.toFixed(0)} %</b>${W}</span>
      <span>Wind <b>${(r.wind * 3.6).toFixed(0)} km/h</b>${W}</span>
      <span>Sun on panel <b>${(r.poa ?? 0).toFixed(0)} W/m²</b>${S}</span>
      <span>🌅 ${hm(st.rise)} · 🌇 ${hm(st.set)}${C}</span>
      <span>Today <b>${Math.min(...Tday).toFixed(1)} – ${Math.max(...Tday).toFixed(1)} °C</b>${W}</span>`;
    const src = r.grid_on > 0.5 ? 'Grid' : r.P_solar_used > 0.01 ? 'Solar' : 'Wax';
    const done = ix.filter(j => j <= this.i), sav = this.saving(done);
    $('tdTwin').innerHTML = `
      <span>Room <b>${r.T_room?.toFixed(1)} °C</b>${S}</span>
      <span>Wax <b>${r.pcm_pct?.toFixed(0)} %</b> charged${S}</span>
      <span>Power now <b class="src ${src.toLowerCase()}">${src}</b>${S}</span>
      <span>Saved today so far <b>${sav === null ? '—' : '₹' + Math.max(0, sav).toFixed(0)}</b>${C}</span>`;
    const tmw = new Date(+dd + 864e5), tk = dateOf(tmw), tx = this.dayRows(tk);
    if (tx.length >= 20) {
      const tmax = Math.max(...tx.map(j => this.rows.T_out[j]));
      const noon = this.row(tx[Math.min(tx.length - 1, 12)]);
      const tst = sunTimes(tmw);
      const rainT = tx.reduce((a, j) => a + (this.rows.rain_mm?.[j] || 0), 0);
      const skyT = rainT >= 2 ? 'rain' : skyOf(noon, 12 * 60 > tst.rise && 12 * 60 < tst.set);
      const sT = this.saving(tx);
      $('tdTom').innerHTML = `Tomorrow: max <b>${tmax.toFixed(0)} °C</b>, ${ICON[skyT] || ''} ${skyT}, expected saving <b>${sT === null ? '—' : '₹' + Math.max(0, sT).toFixed(0)}</b> <i class="fc">prediction</i>`;
    } else $('tdTom').innerHTML = 'Tomorrow: forecast pending (next data update)';
  }
}
