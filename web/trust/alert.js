// Alert / investigation page (alert.html?id=…): reported vs physics, which checks failed, hash evidence, consequences.
(function () {
  'use strict';
  const D = window.TRUST_DATA, T = window.TrustCore, X = window.TamperDetector, PH = D.trust_cfg.phi;
  const $ = id => document.getElementById(id), main = $('m');
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const f1 = x => (x === null || x === undefined || !isFinite(x)) ? '–' : (+x).toFixed(1);
  const ist = ts => new Date(Date.parse(ts) + 5.5 * 3600e3);
  const hhmm = ts => { const d = ist(ts); return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`; };
  const when = ts => `${ist(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })} ${hhmm(ts)}`;
  const id = new URLSearchParams(location.search).get('id');
  const BAND = 2 * D.trust_cfg.sensor_noise.T_K + 0.3;           // expected error band of the twin + sensor (E)
  let store, charts = [];

  function chart(canvas, labels, sets, y) {
    return new Chart(canvas, { type: 'line', data: { labels, datasets: sets }, options: { animation: false, responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false }, plugins: { legend: { labels: { boxWidth: 12, filter: it => !it.text.startsWith('_') } } },
      scales: { x: { ticks: { maxTicksLimit: 10 } }, y } } });
  }
  async function render() {
    const a = store.alerts[id];
    if (!a) { main.innerHTML = `<div class="card">Alert <b>${esc(id)}</b> not found${store.mode === 'offline' ? ' in this browser (offline demo)' : ''}. <a href="${KKStore.link('trust.html?role=owner')}">Owner page</a></div>`; return; }
    const s = D.scenarios[a.scenario] || D.scenarios.normal;
    const tele = store.tele.filter(x => x.scenario === a.scenario && x.step >= a.from_step - 24 && x.step <= a.to_step + 12);
    const lab = tele.map(x => hhmm(x.ts));
    const sensors = a.sensors || [];
    const fields = sensors.includes('core') ? [['T_core', 'Produce core N2', s.T_core_true]] : sensors.includes('outside') ? [['T_out', 'Outside air', s.out.T_out]]
      : sensors.includes('humidity') ? [['RH_r', 'Return-air RH N4', null]] : [['T_r', 'Room air N4', s.T_room_true]];
    const [fk, fl, truth] = fields[0];
    const batches = (a.batches || []).map(sid => store.batches[sid]).filter(Boolean);
    const verdicts = [];
    for (const b of batches) {
      const bl = await store.loadBlocks(b.slipId);
      const ed = store.edits().filter(e => e.slipId === b.slipId);
      const bl2 = bl.map(x => JSON.parse(JSON.stringify(x)));
      for (const e of ed) { const x = bl2.find(y => y.index === e.index); if (x) { let o = x.payload; const p = e.path.split('.'); for (const k of p.slice(0, -1)) o = o[k]; o[p[p.length - 1]] = e.value; } }
      const v = T.verifyChain(bl2);
      verdicts.push({ b, v, frozen: !v.valid, hold: v.physics_flags.length > 0 });
    }
    // worst |z| of each check over the alert window, from the stored readings (every reading carries its z values)
    const win = tele.filter(x => x.step >= a.from_step && x.step <= a.to_step && x.z);
    const zmax = k => (win.length ? Math.max(...win.map(x => Math.abs(x.z[k] || 0))) : null);
    const z = { moisture: zmax(0), energy: zmax(1), heat: zmax(2), core: zmax(3) };
    const zRow = (k, lab2) => { const val = z[k]; const bad = val !== undefined && val !== null && Math.abs(val) >= PH.red_at;
      return `<tr class="${bad ? 'bad' : ''}"><td>${lab2}</td><td class="n">${val === undefined || val === null ? '–' : f1(Math.abs(val))}</td><td>${bad ? '<b class="bd">FAILED</b>' : 'ok'}</td></tr>`; };
    main.innerHTML = `
      <div class="grid">
      <div class="card wide"><h3>${a.kind === 'hash' ? '⛔' : '⚠'} ${esc(a.label)}</h3>
        <p class="big">${esc(a.reason)}</p>
        <div class="kvt"><span>Sensor(s) under suspicion</span><b>${sensors.map(x => esc((X.SENSORS[x] || {}).label || x)).join(', ')}</b>
          <span>From – to (twin time, IST)</span><b>${when(a.from_ts)} – ${when(a.to_ts)}</b>
          <span>Alert raised</span><b>${when(a.raised_ts)} (automatically, no manual step)</b>
          <span>Who had custody</span><b>${esc(a.custody)}</b>
          <span>Affected slips</span><b>${batches.length ? batches.map(b => esc(b.slipId)).join(', ') : 'none in the room'}</b>
          <span>Highest Φ</span><b>${f1(a.phi_max)}</b><span>Status</span><b>${esc(a.status)}${a.reviewed_at ? ` (reviewed ${esc(a.reviewed_at)})` : ''}</b></div></div>
      ${a.kind === 'hash' && a.hash ? `<div class="card wide"><h3>Hash chain broken</h3>
        <p>Slip <b>${esc(a.hash.slipId)}</b>, block <b>#${a.hash.index}</b>: the data in the block was changed after it was written.</p>
        <div class="kvt"><span>Hash stored in the chain</span><b class="mono">${esc(a.hash.stored)}</b><span>Hash re-computed from the data now</span><b class="mono bd">${esc(a.hash.recomputed)}</b></div>
        <p class="note">The database rules refuse any edit of a stored block; this demo shows what an edit by someone with direct database access looks like – the next hash check finds it.</p></div>` : ''}
      <div class="card wide"><h3>What the sensor reported vs what physics says <span class="chip S">S</span></h3>
        <div class="chartbox"><canvas id="cRep"></canvas></div>
        <p class="note">Blue = reported by ${esc(fl)}. Grey = what the twin (true physics) expects, shaded ± ${f1(BAND)} ${fk === 'RH_r' ? '%' : 'K'} expected error band (sensor + model, E).
          Red zone = the alert window.</p></div>
      <div class="card"><h3>Which checks failed (|z|, limit ${PH.red_at}) <span class="chip C">C</span></h3>
        <table><tr><th>Check</th><th class="n">|z|</th><th></th></tr>
          ${zRow('moisture', 'Moisture link: water in supply vs return air')}${zRow('energy', 'Energy link: heat removed vs electricity × COP')}
          ${zRow('heat', 'Room heat-balance link')}${zRow('core', 'Core-lag link (fruit follows the air)')}</table>
        <p class="note">${a.kind === 'gap' ? 'This alert is a missing-data alert: the sensor stopped sending.' : a.kind === 'stuck' ? 'This alert: the sensor sent exactly the same value again and again – real sensors always wobble a little.' :
          a.kind === 'outside' ? 'This alert: the outside sensor disagrees with the weather service.' : a.kind === 'pair' ? 'This alert: supply and return humidity disagree while the air is not being cooled.' : ''}</p></div>
      <div class="card"><h3>Φ timeline <span class="chip C">C</span></h3><div class="chartbox"><canvas id="cPhi"></canvas></div></div>
      <div class="card wide"><h3>Consequence for the batches</h3>
        ${verdicts.length ? `<table><tr><th>Slip</th><th>Farmer</th><th>Verdict</th></tr>${verdicts.map(x => `<tr class="${x.frozen ? 'bad' : x.hold ? 'flag' : ''}"><td>${esc(x.b.slipId)}</td><td>${esc(x.b.farmer)}</td>
          <td>${x.frozen ? `<b class="bd">Evidence tampered – payment frozen</b> (block #${x.v.first_bad})` : x.hold ? '<b class="wn">Payment on hold – data does not match physics</b>' : 'no effect'}</td></tr>`).join('')}</table>` : '<p class="muted">No batch was in the room.</p>'}
        <div class="row"><button id="revBtn" class="primary" ${store.isAdmin() && a.status !== 'reviewed' ? '' : 'disabled'}>Mark reviewed</button>
          <button onclick="history.length > 1 ? history.back() : (location.href=KKStore.link('trust.html?role=owner'))">Back</button></div>
        <p class="note">"Mark reviewed" writes a REVIEW block into each affected slip's ledger. It does NOT erase the alert or the flags.${store.isAdmin() ? '' : ' Only an owner device can do it.'}</p></div>
      </div>`;
    charts.forEach(c => c.destroy()); charts = [];
    const inWin = x => x.step >= a.from_step && x.step <= a.to_step;
    const rep = tele.map(x => x.rep[fk]);
    const exp = truth ? tele.map(x => truth[x.step]) : tele.map(() => D.rh_room_pct);
    charts.push(chart($('cRep'), lab, [
      { label: '_hi', data: exp.map(v => v + BAND), borderWidth: 0, pointRadius: 0, backgroundColor: 'rgba(148,163,184,.25)', fill: '+1' },
      { label: '_lo', data: exp.map(v => v - BAND), borderWidth: 0, pointRadius: 0, fill: false },
      { label: 'Twin expects (true physics)', data: exp, borderColor: '#64748b', borderDash: [5, 4], borderWidth: 2, pointRadius: 0 },
      { label: `${fl} – reported`, data: rep, borderColor: '#2a78d6', borderWidth: 2.5, pointRadius: 0, spanGaps: false },
      { label: '_alert', data: tele.map(x => (inWin(x) ? (Math.max(...exp.filter(isFinite), ...rep.filter(v => v !== null && isFinite(v))) + 1) : null)), borderWidth: 0, pointRadius: 0, backgroundColor: 'rgba(220,38,38,.12)', fill: 'origin' }],
      { title: { display: true, text: fk === 'RH_r' ? '%RH' : '°C' } }));
    charts.push(chart($('cPhi'), lab, [
      { label: 'Φ', data: tele.map(x => x.phi), borderColor: '#b91c1c', borderWidth: 2, pointRadius: 0 },
      { label: `alert limit ${PH.red_at}`, data: tele.map(() => PH.red_at), borderColor: '#dc2626', borderDash: [6, 4], borderWidth: 1.5, pointRadius: 0 },
      { label: `green below ${PH.green_below}`, data: tele.map(() => PH.green_below), borderColor: '#16a34a', borderDash: [3, 3], borderWidth: 1, pointRadius: 0 }],
      { min: 0, title: { display: true, text: 'Φ' } }));
    const rb = $('revBtn');
    if (rb) rb.onclick = async () => {
      const note = prompt('What did you find? (written into the ledger)', 'checked the sensor on site');
      if (note === null) return;
      rb.disabled = true;
      for (const b of batches) await store.appendBlock(b.slipId, 'REVIEW', 'owner', { alertId: a.id, note }, { phi: 0, flags: [] }, a.to_ts);
      await store.updateAlert(a.id, { status: 'reviewed', reviewed_at: new Date().toISOString(), review_note: note, reviewed_by: store.uid });
    };
  }
  (async () => {
    store = await KKStore.get();
    KKStore.banner($('kkBanner'), store);
    let t = null;
    store.on(() => { clearTimeout(t); t = setTimeout(render, 300); });
    render();
  })();
})();
