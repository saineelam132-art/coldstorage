// One row per day of 2026 for the calendar, from the Live Year Run results (live/data/summary.js) and the
// twin's day classes (/api/day_classes). Same files on the Python server, offline and on Firebase / Vercel.
import { getJSON } from './api.js';

const pad = n => String(n).padStart(2, '0');
export const MON3 = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function loadScript(src) {
  return new Promise((ok, bad) => {
    const s = document.createElement('script');
    s.src = src; s.onload = () => { s.remove(); ok(); }; s.onerror = () => { s.remove(); bad(new Error(src)); };
    document.head.appendChild(s);
  });
}

// ---- time: t = seconds after t0 (IST wall clock, 1 Jan 2026 00:00)
export class TimeBase {
  constructor(t0 = '2026-01-01T00:00:00') { this.T0 = Date.parse(t0 + 'Z'); }
  date(t) { return new Date(this.T0 + t * 1000); }                       // UTC fields = IST fields
  dayIndex(t) { return Math.floor(t / 86400); }
  dateStr(day) { const d = this.date(day * 86400); return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`; }
  dayOf(dateStr) { return Math.round((Date.parse(dateStr + 'T00:00:00Z') - this.T0) / 864e5); }
  toParam(t) { const d = this.date(t); return `${this.dateStr(this.dayIndex(t))}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`; }
  // "2026-05-22T14:00" (or "2026-05-22", "2026-05-22T14", "2026-05-22 14:05") -> t, or null if not a date
  fromParam(s) {
    const m = /^(\d{4})-(\d\d)-(\d\d)(?:[T ](\d\d)(?::(\d\d))?)?$/.exec((s || '').trim());
    if (!m) return null;
    const ms = Date.UTC(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0));
    const d = new Date(ms);
    if (d.getUTCMonth() !== +m[2] - 1 || +(m[4] || 0) > 23 || +(m[5] || 0) > 59) return null;
    return (ms - this.T0) / 1000;
  }
  nice(t, withTime = true) {
    const d = this.date(t);
    return `${d.getUTCDate()} ${MON3[d.getUTCMonth()]} ${d.getUTCFullYear()}` + (withTime ? ` ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}` : '');
  }
}

// ---- the days: weather, sun, grid hours, money (Live Year Run) + day class (twin)
export class YearDays {
  constructor() { this.byDate = new Map(); this.S = null; this.classes = null; }
  async load() {
    window.LIVE = window.LIVE || {};
    if (!window.LIVE.summary) { try { await loadScript('live/data/summary.js'); } catch (e) { /* no Live Year Run files */ } }
    this.S = window.LIVE.summary || null;
    try { this.classes = await getJSON('api/day_classes'); } catch (e) { this.classes = null; }
    this.build();
    return this;
  }
  build() {
    const S = this.S;
    if (!S) return;
    const d = S.designs.current.daily, col = Object.fromEntries(d.columns.map((c, i) => [c, i]));
    const M = S.money || {}, tariff = M.defaults?.grid_tariff_INR_kWh ?? 8, ours = M.ours_grid_kWh?.current || [];
    const mIx = new Map((M.days || []).map((x, i) => [x, i]));
    d.index.forEach((date, r) => {
      const row = d.data[r], k = mIx.get(date);
      let saved = null;
      if (k !== undefined && M.gridonly_kWh_by_hour) saved = (M.gridonly_kWh_by_hour[k].reduce((a, b) => a + b, 0) - (ours[k] || 0)) * tariff;
      this.byDate.set(date, { date, maxT: row[col.T_out_max], sun: row[col.ghi_kWh_m2], grid_h: row[col.grid_h],
        full: !!row[col.full_solar_wax], status: row[col.status], saved, tariff });
    });
    this.today = S.today; this.tomorrow = S.tomorrow;
  }
  info(date) { return this.byDate.get(date) || null; }
  // dot colour: orange = grid used, grey = rainy / cloudy day (twin class, by panel sunlight), green = fully solar + wax
  kind(date, day) {
    const i = this.info(date);
    if (!i) return null;
    if (i.grid_h > 0) return 'grid';
    const c = this.classes?.classes?.[day];
    if (c ? c !== 'sunny' : i.sun < 5) return 'dull';
    return 'full';
  }
}
