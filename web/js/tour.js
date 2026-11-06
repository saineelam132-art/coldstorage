// 2-minute guided tour for judges. Arrow keys: next / back. Space: pause. Esc: stop.
// Every number shown during the tour is the live twin value at that moment.
import { postJSON } from './api.js';
import { openPart, openSensor } from './details.js';
import { closePanel } from './ui.js';

const $ = id => document.getElementById(id);
const wait = ms => new Promise(r => setTimeout(r, ms));

export class Tour {
  constructor(app) {
    this.app = app; this.i = -1; this.paused = false; this.running = false; this.timer = null;
    const { photo, clock, feed, demo, ledgerUI, control, batches } = app;
    const day = name => Math.floor(demo.find(d => d.why.startsWith(name)).t / 86400) * 86400;
    const hot = day('Hottest'), rainy = day('Dullest');
    const curtain = on => { $('curtain').checked = on; feed.curtain = on; feed.poll(); };
    const v = () => feed.state?.values || {};
    const reset = () => { closePanel(); ledgerUI.close(); control.close(); $('cardModal').classList.remove('on'); };
    const Y = app.cfg.year_summary;
    this.steps = [
      { s: 9, cap: () => `This is our solar–PCM cold room for farmers near Visakhapatnam, rated for <b>150 kg</b> of fresh produce. It runs on a digital twin with the <b>real 2026 weather</b> of Vizag.`,
        go: () => { reset(); this.app.toPhoto(); clock.jump(hot + 5 * 3600); clock.speed = 720; photo.goByName('A1_outside'); } },
      { s: 9, cap: () => `Every glowing dot is a sensor. Outside air now: <b>${v().T_out?.toFixed(1)} °C</b>, ${v().RH_out?.toFixed(0)} % humidity – this is the hottest day of 2026.`,
        go: () => { photo.goByName('A2_front'); openSensor('t_out'); } },
      { s: 9, cap: () => `The 1.8 kWp solar canopy faces south at 17°. Right now it gives <b>${v().P_pv?.toFixed(2)} kW</b> to the R290 (propane) compressor. No battery for cooling – the wax is the storage.`,
        go: () => { closePanel(); photo.goByName('A3_exterior_side_condenser'); openPart('solar'); } },
      { s: 9, cap: () => `Opening the door lets warm air in at the top and cold air out at the bottom. <b>Without the strip curtain: ${v().heat_if_open_kW?.toFixed(1)} kW</b> pours in…`,
        go: () => { closePanel(); curtain(false); photo.goByName('A6_door_worker'); } },
      { s: 7, cap: () => `…with the curtain only <b>${v().heat_if_open_kW?.toFixed(1)} kW</b> – and only for ${v().last_open_s?.toFixed(0)} seconds per opening.`,
        go: () => curtain(true) },
      { s: 13, cap: () => `At 6 am the farmer brings the day's 150 kg. The batch gets an ID and a QR code, and is <b>sealed into a hash-chain ledger</b> every hour.`,
        go: async () => { await batches.create(new Map([['farmer', 'Demo farmer (tour)'], ['crop', 'pomegranate'], ['weight_kg', '150']])); } },
      { s: 9, cap: () => `Inside it is <b>${v().T_room?.toFixed(1)} °C</b>. The blue wax (PCM) panels are the cold battery: <b>${v().pcm_pct?.toFixed(0)} % frozen</b>, enough for <b>${v().backup_h?.toFixed(0)} hours</b> without sun.`,
        go: () => { $('cardModal').classList.remove('on'); ledgerUI.close(); photo.goByName('A8_interior_wide'); openPart('pcm'); } },
      { s: 11, cap: () => `Night: the compressor sleeps. <b>5 small 12 V fans</b> push room air down a 2 cm channel behind a baffle, across the wax – now <b>${v().fan_W?.toFixed(0)} W</b>, room <b>${v().T_room?.toFixed(1)} °C</b>. Their heat is counted; without them the grid would come on every night.`,
        go: () => { closePanel(); clock.jump(hot + 22 * 3600); photo.goByName('A9_interior_pcm_wall'); openPart('nightfan'); } },
      { s: 8, cap: () => `By day the evaporator runs on R290 at −5 °C. COP <b>${v().cop?.toFixed(2)}</b>, calculated with CoolProp from the outside temperature.`,
        go: () => { closePanel(); clock.jump(hot + 13 * 3600 + 86400); photo.goByName('A10_interior_evaporator'); openPart('evaporator'); } },
      { s: 8, cap: () => `Each crate knows its <b>remaining shelf life in days</b>, from the real temperature history of this room (Q10 model).`,
        go: () => { closePanel(); photo.goByName('A8_interior_wide'); openPart('crate_greens'); } },
      { s: 11, cap: () => `A dull monsoon night. The same room <b>without</b> and <b>with</b> the night fan: with it, the wax alone holds 2–8 °C.`,
        go: () => { closePanel(); clock.jump(rainy + 21 * 3600); photo.goByName('A1_outside'); control.open('rooms'); } },
      { s: 12, cap: () => `2026 so far: <b>${Y.days_full_solar_pcm} of ${Y.days} days fully on solar + wax</b>, ${Y.grid_hours.toFixed(0)} grid hours. Room air above 8 °C only while a fresh warm batch cools (${Y.hot_load_h_per_day.toFixed(1)} h/day); all other times 0 h outside 2–8 °C.`,
        go: () => control.open('year') },
      { s: 11, cap: () => `Can someone cheat? We change one old temperature reading… <b>the chain turns red from that block onward</b>, and the buyer's QR page shows “Record changed ✗”.`,
        go: async () => { control.close(); ledgerUI.open(); await wait(1500); const r = await postJSON('api/ledger/tamper'); ledgerUI.msg = `✗ ${r.explain}`; ledgerUI.refresh(true); } },
      { s: 7, cap: () => `Thank you! Scan any batch QR code, open “📅 Live 2026” for today and tomorrow, or ask us to move a What-If slider.`,
        go: async () => { await postJSON('api/ledger/reset'); ledgerUI.close(); photo.goByName('A1_outside'); clock.jump(hot + 11 * 3600); } },
    ];
    $('tourBtn').onclick = () => (this.running ? this.stop() : this.start());
    $('tourPrev').onclick = () => this.goto(this.i - 1);
    $('tourNext').onclick = () => this.goto(this.i + 1);
    $('tourPause').onclick = () => this.pause();
    $('tourStop').onclick = () => this.stop();
    addEventListener('keydown', e => {
      if (!this.running || ['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (e.key === 'ArrowRight') { e.stopImmediatePropagation(); this.goto(this.i + 1); }
      if (e.key === 'ArrowLeft') { e.stopImmediatePropagation(); this.goto(this.i - 1); }
      if (e.key === ' ') { e.preventDefault(); this.pause(); }
      if (e.key === 'Escape') this.stop();
    }, true);
    feed.on(() => this.running && this.render());
  }

  start() { this.running = true; document.body.classList.add('touring'); $('tourBtn').textContent = '■ Stop tour'; this.goto(0); }
  stop() {
    this.running = false; clearTimeout(this.timer); document.body.classList.remove('touring');
    $('tourBtn').textContent = '▶ Start tour'; $('tourBar').classList.remove('on');
  }
  pause() { this.paused = !this.paused; $('tourPause').textContent = this.paused ? '▶' : '❚❚'; if (!this.paused) this.schedule(); else clearTimeout(this.timer); }

  async goto(i) {
    if (i < 0) i = 0;
    if (i >= this.steps.length) return this.stop();
    clearTimeout(this.timer);
    this.i = i; this.t0 = performance.now();
    $('tourBar').classList.add('on');
    this.render();
    const step = this.steps[i];
    try { await step.go(); } catch (e) { console.warn('tour step', i, e); }
    this.render();
    if (!this.paused) this.schedule();
  }
  schedule() { clearTimeout(this.timer); this.timer = setTimeout(() => this.goto(this.i + 1), this.steps[this.i].s * 1000); }
  render() {
    if (this.i < 0) return;
    $('tourCap').innerHTML = this.steps[this.i].cap();
    $('tourStep').textContent = `${this.i + 1} / ${this.steps.length}`;
    const done = this.steps.slice(0, this.i).reduce((a, s) => a + s.s, 0), tot = this.steps.reduce((a, s) => a + s.s, 0);
    $('tourProg').style.width = `${(100 * done / tot).toFixed(1)}%`;
  }
}
