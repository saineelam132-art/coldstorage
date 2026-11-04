// Buyer (QR) page logic.
  import { verifyBlocks } from '../ledger.js';
  import { lineChart } from '../charts.js';
  import { getJSON } from '../api.js';
  const id = new URLSearchParams(location.search).get('b');
  const m = document.getElementById('m');
  async function load() {
    let d;
    try { d = await getJSON(`api/batch/${encodeURIComponent(id)}`); }
    catch (e) { m.innerHTML = `<div class="card">Batch <b>${id}</b> not found.</div>`; return; }
    const b = d.batch, a = d.assess;
    // This phone re-computes every SHA-256 hash of this batch's blocks.
    const v = verifyBlocks(d.blocks);
    const consecutive = d.blocks.every((x, i) => i === 0 || x.index === d.blocks[i - 1].index + 1);
    const mine = v.every(x => x.ownOk) && (consecutive ? v.every(x => x.linkOk) : true);
    const ok = mine && d.chain_valid;
    const sc = a.freshness_score, col = sc > 70 ? '#22c55e' : sc > 40 ? '#f59e0b' : '#ef4444';
    m.innerHTML = `
      <div class="verdict ${ok ? 'ok' : 'bad'}">${ok ? 'Record verified ✓' : 'Record changed ✗'}
        <small>${ok ? `Your phone re-checked ${d.blocks.length} sealed hourly records – every hash matches.`
                    : 'At least one stored reading no longer matches its seal. Do not trust this record.'}</small></div>
      <div class="card"><div class="id">${b.id}</div>
        <div class="kv" style="margin-top:8px"><span>Crop</span><b>${b.crop_label}</b><span>Farmer</span><b>${b.farmer}</b>
        <span>Weight</span><b>${b.weight_kg} kg</b><span>Stored since</span><b>${b.entry_time}</b>
        <span>Time in storage</span><b>${d.days_stored.toFixed(1)} days</b></div></div>
      <div class="card"><div class="kv"><span>Freshness score</span><b class="big" style="color:${col}">${sc.toFixed(0)}</b></div>
        <div class="bar"><i style="width:${sc}%;background:${col}"></i></div>
        <div class="kv" style="margin-top:10px"><span>Remaining shelf life</span><b>${a.remaining_days_at_ref.toFixed(1)} days (at ${d.crop.T_ref_C} °C)</b>
        <span>If kept at ${a.T_now_C.toFixed(1)} °C</span><b>${a.remaining_days_at_current_T.toFixed(1)} days</b>
        <span>Best storage</span><b>${d.crop.T_opt[0]}–${d.crop.T_opt[1]} °C</b></div>
        ${a.warnings.map(w => `<div class="warn">⚠ ${w}</div>`).join('')}
        ${d.blocks.some(x => x.flag !== 'OK') ? `<div class="warn">⚠ ${d.blocks.filter(x => x.flag !== 'OK').length} hourly record(s) were flagged “sensor suspicious”: the room sensor disagreed with the physics model. Those readings are sealed as-is, with the flag.</div>` : ''}</div>
      <div class="card"><b>Storage timeline (room temperature)</b><canvas id="c"></canvas></div>
      <div class="card"><b>Sealed hourly records</b><table>
        ${d.blocks.slice(-8).reverse().map((x, i) => `<tr><td>#${x.index}<br><span class="h">${x.hash.slice(0, 10)}…</span></td>
          <td>${x.timestamp.slice(5)}</td><td>${x.summary.T_min.toFixed(1)}–${x.summary.T_max.toFixed(1)} °C${x.flag !== 'OK' ? '<br><span style="color:#b45309;font-size:12px">⚠ sensor flagged</span>' : ''}</td>
          <td>${v[d.blocks.length - 1 - i].ownOk ? '✓' : '✗'}</td></tr>`).join('')}</table>
        <div class="note">Showing the latest 8 of ${d.blocks.length}. Each record holds that hour's min/avg/max temperature, door-open minutes and wax battery %, sealed with SHA-256 and linked to the record before it.</div></div>
      <p class="note">Simulated – digital twin using real Visakhapatnam weather. Demo uses a local hash-chain; a real deployment would use a permissioned ledger (Hyperledger Fabric) with farmer, transporter and buyer nodes.</p>`;
    lineChart(document.getElementById('c'), { x: [b.entry_time.slice(5), 'now'], series: [{ y: d.history_T, color: '#2a78d6', label: 'room °C' }], unit: '°C', band: [2, 8] });
  }
  load().catch(e => (m.innerHTML = `<div class="card">Could not load: ${e}</div>`));
