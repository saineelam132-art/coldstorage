// Calendar + time picker in the bottom time bar. Pick any day of 2026 (1 Jan -> today; tomorrow only as a
// forecast) and a time (5-minute steps): the whole site jumps there through goTo(t). Dots and tooltips come
// from the Live Year Run results (yeardata.js). Keyboard: arrows move days, PgUp/PgDn months, Enter picks,
// Esc closes. On a phone it opens as a bottom sheet.
import { MON3, MONTHS } from './yeardata.js';

const pad = n => String(n).padStart(2, '0');
const hhmm = m => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
const inr = v => '₹' + Math.round(v).toLocaleString('en-IN');
const KIND_TXT = { full: 'fully on solar + wax', grid: 'some grid use', dull: 'rainy / cloudy day (no grid)' };

// which days can be picked. ctx: {lastDataDay, todayDay, forecastDay|null, canShow(day)}
export function dayState(day, ctx) {
  if (day < 0 || day > ctx.lastDataDay) return { ok: false, why: 'no data' };
  if (ctx.canShow && !ctx.canShow(day)) return { ok: false, why: 'no data' };
  if (day <= ctx.todayDay) return { ok: true };
  if (ctx.forecastDay !== null && day === ctx.forecastDay) return { ok: true, forecast: true };
  return { ok: false, why: 'future' };
}

export class TimeNav {
  // o: {tb (TimeBase), days (YearDays), demo, getT, goTo(t), ctx() -> dayState context}
  constructor(o) {
    Object.assign(this, o);
    this.btn = document.getElementById('calBtn');
    this.slider = document.getElementById('timeSlider');
    this.sliderTx = document.getElementById('timeTx');
    this.open = false; this.dragging = false;
    this.build();
    this.btn.onclick = e => { e.stopPropagation(); this.toggle(!this.open); };
    this.slider.addEventListener('input', () => {
      this.dragging = true; this.sliderTx.textContent = hhmm(+this.slider.value * 5); this.slider.parentElement.classList.add('drag');
    });
    this.slider.addEventListener('change', () => {
      this.dragging = false; this.slider.parentElement.classList.remove('drag');
      const day = this.tb.dayIndex(this.getT());
      this.goTo(day * 86400 + +this.slider.value * 300);
    });
    document.addEventListener('click', e => { if (this.open && !this.pop.contains(e.target) && e.target !== this.btn) this.toggle(false); });
    addEventListener('keydown', e => { if (this.open && e.key === 'Escape') { this.toggle(false); this.btn.focus(); } });
    setInterval(() => this.sync(), 500);
    this.sync();
  }

  build() {
    const p = document.createElement('div');
    p.id = 'calPop'; p.className = 'calpop'; p.hidden = true;
    p.setAttribute('role', 'dialog'); p.setAttribute('aria-label', 'Pick a date and time');
    p.innerHTML = `
      <div class="calhead">
        <button class="calnav" data-m="-1" aria-label="Previous month">‹</button>
        <b id="calMon" aria-live="polite"></b>
        <button class="calnav" data-m="1" aria-label="Next month">›</button>
        <button id="calTodayBtn" class="calsmall">Today</button>
        <button id="calClose" class="calx" aria-label="Close">×</button>
      </div>
      <div class="calwd" aria-hidden="true">${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(w => `<span>${w}</span>`).join('')}</div>
      <div id="calGrid" class="calgrid" role="grid" aria-label="Days"></div>
      <div id="calInfo" class="calinfo">Point at a day to see its numbers.</div>
      <div class="caltime"><label for="calTime">Time</label><input id="calTime" type="range" min="0" max="287" step="1"><b id="calTimeTx">00:00</b>
        <button id="calGo" class="calsmall">Show</button></div>
      <div class="calquick"><span>Quick links</span><div id="calLinks"></div></div>
      <div class="calleg"><span><i class="dot full"></i>fully on solar + wax</span><span><i class="dot grid"></i>some grid use</span>
        <span><i class="dot dull"></i>rainy / cloudy day</span><span><i class="fc">forecast</i> tomorrow</span><span class="muted">grey number = no data</span></div>
      <div id="calTip" class="caltip" role="tooltip" hidden></div>`;
    document.body.appendChild(p);
    this.pop = p;
    const $ = id => p.querySelector('#' + id);
    this.grid = $('calGrid'); this.info = $('calInfo'); this.tip = $('calTip'); this.mon = $('calMon');
    this.time = $('calTime'); this.timeTx = $('calTimeTx');
    p.querySelectorAll('.calnav').forEach(b => (b.onclick = () => this.month(+b.dataset.m)));
    $('calClose').onclick = () => { this.toggle(false); this.btn.focus(); };
    $('calTodayBtn').onclick = () => { const c = this.ctx(); this.focusDay = Math.min(c.todayDay, c.lastDataDay); this.render(true); };
    this.time.oninput = () => (this.timeTx.textContent = hhmm(+this.time.value * 5));
    $('calGo').onclick = () => this.pick(this.focusDay);
    const L = { hot_day: 'Hottest day', hot_night: 'Hottest night', grid_day: 'Most grid use day', monsoon_day: 'A monsoon day',
      sunny_day: 'Sunniest day', dull_day: 'Dullest day' };
    $('calLinks').innerHTML = this.demo.filter(d => L[d.key]).map(d =>
      `<button class="calq" data-t="${d.t}" title="${d.why}">${L[d.key]} (${d.date.replace(/^0/, '')})</button>`).join('');
    $('calLinks').onclick = e => { const b = e.target.closest('.calq'); if (b) { this.toggle(false); this.goTo(+b.dataset.t); } };
    this.grid.addEventListener('keydown', e => this.key(e));
    this.grid.addEventListener('click', e => { const b = e.target.closest('.cday'); if (b) this.pick(+b.dataset.day); });
    this.grid.addEventListener('mouseover', e => { const b = e.target.closest('.cday'); if (b) this.hover(b, true); });
    this.grid.addEventListener('mouseleave', () => (this.tip.hidden = true));
    this.grid.addEventListener('focusin', e => { const b = e.target.closest('.cday'); if (b) { this.focusDay = +b.dataset.day; this.hover(b, false); } });
  }

  toggle(on) {
    this.open = on;
    this.pop.hidden = !on;
    this.btn.setAttribute('aria-expanded', String(on));
    if (on) {
      const t = this.getT();
      this.focusDay = this.tb.dayIndex(t);
      this.time.value = String(Math.floor((t % 86400) / 300));
      this.timeTx.textContent = hhmm(+this.time.value * 5);
      this.render(true);
    } else this.tip.hidden = true;
  }

  sync() {                                     // the bar follows the clock
    const t = this.getT();
    this.btn.textContent = `📅 ${this.tb.nice(t, false)}`;
    if (!this.dragging && document.activeElement !== this.slider) {
      const v = Math.floor((t % 86400) / 300);
      if (+this.slider.value !== v) this.slider.value = String(v);
      this.sliderTx.textContent = hhmm(v * 5);
    }
  }

  month(dm) {
    const d = this.tb.date(this.focusDay * 86400);
    const target = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + dm, 1);
    const c = this.ctx(), first = 0, last = c.forecastDay ?? Math.min(c.todayDay, c.lastDataDay);
    let day = Math.round((target - this.tb.T0) / 864e5);
    day = Math.max(first, Math.min(last, day));
    this.focusDay = day; this.render(true);
  }

  render(focus) {
    const c = this.ctx(), fd = this.tb.date(this.focusDay * 86400), y = fd.getUTCFullYear(), m = fd.getUTCMonth();
    this.mon.textContent = `${MONTHS[m]} ${y}`;
    const firstDay = Math.round((Date.UTC(y, m, 1) - this.tb.T0) / 864e5), nDays = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    const lead = (new Date(Date.UTC(y, m, 1)).getUTCDay() + 6) % 7;
    const lastOk = c.forecastDay ?? Math.min(c.todayDay, c.lastDataDay);
    this.pop.querySelector('[data-m="-1"]').disabled = firstDay <= 0;
    this.pop.querySelector('[data-m="1"]').disabled = firstDay + nDays > lastOk;
    const shown = this.tb.dayIndex(this.getT());
    let html = '<span class="cpad"></span>'.repeat(lead);
    for (let k = 0; k < nDays; k++) {
      const day = firstDay + k, date = this.tb.dateStr(day), st = dayState(day, c), kind = st.ok ? this.days.kind(date, day) : null;
      const lab = `${k + 1} ${MONTHS[m]} ${y}` + (st.ok ? (st.forecast ? ', forecast' : '') + (kind ? `, ${KIND_TXT[kind]}` : '') : ', no data');
      html += `<button class="cday${st.ok ? '' : ' off'}${st.forecast ? ' fcst' : ''}${day === shown ? ' shown' : ''}${day === c.todayDay ? ' today' : ''}"
        data-day="${day}" data-date="${date}" role="gridcell" tabindex="${day === this.focusDay ? 0 : -1}"
        aria-disabled="${!st.ok}" aria-label="${lab}" aria-selected="${day === shown}">${k + 1}${kind ? `<i class="dot ${kind}"></i>` : ''}${st.forecast ? '<em>forecast</em>' : ''}</button>`;
    }
    this.grid.innerHTML = html;
    if (focus) {
      const b = this.grid.querySelector(`[data-day="${this.focusDay}"]`);
      if (b) { b.focus({ preventScroll: true }); this.hover(b, false); }
    }
  }

  hover(b, near) {
    const day = +b.dataset.day, date = b.dataset.date, st = dayState(day, this.ctx()), i = this.days.info(date);
    const when = `${this.tb.nice(day * 86400, false)}`;
    let txt;
    if (!st.ok) txt = `<b>${when}</b> – ${st.why === 'future' ? 'not happened yet' : 'no data for this day'}`;
    else if (!i) txt = `<b>${when}</b>${st.forecast ? ' (forecast)' : ''}`;
    else txt = `<b>${when}</b>${st.forecast ? ' <i class="fc">forecast</i>' : ''}<br>Max outside <b>${i.maxT.toFixed(1)} °C</b> · Sun <b>${i.sun.toFixed(1)} kWh/m²</b>
      · Grid <b>${i.grid_h.toFixed(1)} h</b> · Saved <b>${i.saved === null ? '— (day not over)' : inr(i.saved)}</b>`;
    this.info.innerHTML = txt;
    if (!near) { this.tip.hidden = true; return; }
    this.tip.innerHTML = txt; this.tip.hidden = false;
    const r = b.getBoundingClientRect(), pr = this.pop.getBoundingClientRect();
    const w = this.tip.offsetWidth;
    this.tip.style.left = `${Math.max(4, Math.min(pr.width - w - 4, r.left - pr.left + r.width / 2 - w / 2))}px`;
    this.tip.style.top = `${r.top - pr.top - this.tip.offsetHeight - 6}px`;
  }

  key(e) {
    const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
    const c = this.ctx(), last = c.forecastDay ?? Math.min(c.todayDay, c.lastDataDay);
    if (step) { e.preventDefault(); this.focusDay = Math.max(0, Math.min(last, this.focusDay + step)); this.render(true); return; }
    if (e.key === 'PageUp' || e.key === 'PageDown') { e.preventDefault(); this.month(e.key === 'PageUp' ? -1 : 1); return; }
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.pick(this.focusDay); }
  }

  pick(day) {
    if (!dayState(day, this.ctx()).ok) return false;              // grey days cannot be picked
    this.toggle(false);
    this.goTo(day * 86400 + +this.time.value * 300);
    return true;
  }
}

export { MON3 };
