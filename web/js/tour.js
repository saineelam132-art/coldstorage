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
    this.steps = [
      { s: 9, cap: () => `This is our solar–PCM cold room for farmers near Visakhapatnam. Everything you see runs on a digital twin with the <b>real 2025 weather</b> of Vizag.`,
        go: () => { reset(); this.app.toPhoto(); clock.jump(hot + 7 * 3600); clock.speed = 720; photo.goByName('A1_outside'); } },
      { s: 10, cap: () => `Every glowing dot is a sensor. Outside air now: <b>${v().T_out?.toFixed(1)} °C</b>, ${v().RH_out?.toFixed(0)} % humidity – this is the hottest day of 2025.`,
        go: () => { photo.goByName('A2_front'); openSensor('t_out'); } },
      { s: 9, cap: () => `The 1.8 kWp solar canopy faces south at 17°. Right now it gives <b>${v().P_pv?.toFixed(2)} kW</b> to the R290 (propane) compressor – no grid.`,
        go: () => { closePanel(); photo.goByName('A3_exterior_side_condenser'); openPart('solar'); } },
      { s: 10, cap: () => `Opening the door lets warm air in at the top and cold air out at the bottom. <b>Without the strip curtain: ${v().heat_if_open_kW?.toFixed(1)} kW</b> pours in…`,
        go: () => { closePanel(); curtain(false); photo.goByName('A6_door_worker'); } },
      { s: 8, cap: () => `…with the curtain only <b>${v().heat_if_open_kW?.toFixed(1)} kW</b> – and only for ${v().last_open_s?.toFixed(0)} seconds per opening.`,
        go: () => curtain(true) },
      { s: 14, cap: () => `A farmer brings 80 kg of pomegranates. The batch gets an ID and a QR code, and is <b>sealed into a hash-chain ledger</b> every hour.`,
        go: async () => { await batches.create(new Map([['farmer', 'Demo farmer (tour)'], ['crop', 'pomegranate'], ['weight_kg', '80']])); } },
      { s: 9, cap: () => `Inside it is <b>${v().T_room?.toFixed(1)} °C</b>. The blue wax (PCM) panels are the cold battery: <b>${v().pcm_pct?.toFixed(0)} % frozen</b>, enough for <b>${v().backup_h?.toFixed(0)} hours</b> without sun.`,
        go: () => { $('cardModal').classList.remove('on'); ledgerUI.close(); photo.goByName('A8_interior_wide'); openPart('pcm'); } },
      { s: 9, cap: () => `The evaporator runs on R290 at −5 °C. Live COP <b>${v().cop?.toFixed(2)}</b>, calculated with CoolProp from today's outside temperature.`,
        go: () => { closePanel(); photo.goByName('A10_interior_evaporator'); openPart('evaporator'); } },
      { s: 9, cap: () => `Each crate knows its <b>remaining shelf life in days</b>, from the real temperature history of this room (Q10 model).`,
        go: () => { closePanel(); photo.goByName('A8_interior_wide'); openPart('crate_greens'); } },
      { s: 12, cap: () => `Now a dull monsoon day and its night. The same room with normal and smart control: the wax keeps both at <b>2–8 °C</b>; smart control needs the grid less.`,
        go: () => { closePanel(); clock.jump(rainy + 13 * 3600); photo.goByName('A1_outside'); control.open('rooms'); } },
      { s: 11, cap: () => `Over the whole year: <b>88 % of days fully on solar + wax</b> today; with 172 kg wax and 2.1 kWp, <b>94 %</b> and only 95 grid hours a year.`,
        go: () => control.open('year') },
      { s: 12, cap: () => `Can someone cheat? We change one old temperature reading… <b>the chain turns red from that block onward</b>, and the buyer's QR page shows “Record changed ✗”.`,
        go: async () => { control.close(); ledgerUI.open(); await wait(1500); const r = await postJSON('api/ledger/tamper'); ledgerUI.msg = `✗ ${r.explain}`; ledgerUI.refresh(true); } },
      { s: 8, cap: () => `Thank you! Scan any batch QR code with your phone, or ask us to change any slider in the What-If screen.`,
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
