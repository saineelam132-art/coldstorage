// Control centre tab "How sure are we?": the expected site error budget (published studies, NOT
// measured) and the twin re-run with those errors (results/live/uncertainty_2026.json). Every number is
// read from config/site_error_budget.json or the study file – nothing typed in here.
import { getJSON } from './api.js';
import { tagChip } from './ui.js';
import { pmTag } from './siteerr.js';

const pct = x => `${Math.round(x * 100)} %`;
function bandRows(B) {
  const b = B.bands;
  return [
    [b.temp_C, `±${b.temp_C.hourly} °C (±${b.temp_C.hourly_sunny_calm} °C on sunny, calm afternoons ${b.temp_C.sunny_calm_rule.hours.join('–')} h)`, `±${b.temp_C.daily} °C`],
    [b.dewpoint_C, `±${b.dewpoint_C.hourly} °C`, `±${b.dewpoint_C.daily} °C`],
    [b.rh_pct, 'worked out from the temperature and dew-point bands (typically ±5–15 %RH)', `±${b.rh_pct.daily_range.join('–')} %RH`],
    [b.ghi_rel, `±${pct(b.ghi_rel.hourly)} (±${pct(b.ghi_rel.hourly_overcast)} on overcast hours)`, `±${pct(b.ghi_rel.daily_clear)} clear days, ±${pct(b.ghi_rel.daily_cloudy)} cloudy days`],
    [b.wind_ms, `±${b.wind_ms.hourly} m/s at 2 m`, `±${b.wind_ms.daily} m/s`],
    [b.pressure_hPa, `±${b.pressure_hPa.hourly} hPa`, `±${b.pressure_hPa.daily} hPa`],
    [b.pv_energy_rel, `±${pct(b.pv_energy_rel.hourly)}`, `±${pct(b.pv_energy_rel.daily_clear)} clear day, ±${pct(b.pv_energy_rel.daily_cloudy)} cloudy day, ±${pct(b.pv_energy_rel.monthly)} monthly`],
  ];
}
const METRICS = [
  ['days_full_solar_wax', 'Days fully on solar + wax', 0, ''], ['grid_h_per_year', 'Grid backup hours per year', 0, 'h'],
  ['comp_kWh_day', 'Compressor electricity', 2, 'kWh/day'], ['wax_sunset_mean_pct', 'Wax at sunset – average', 0, '%'],
  ['wax_sunset_worst_pct', 'Wax at sunset – worst day', 0, '%'], ['hottest_night_room_max_C', 'Hottest night: room maximum', 1, '°C'],
  ['h_outside_2_8_loading', 'Hours outside 2–8 °C while a fresh batch cools', 0, 'h'], ['h_outside_2_8_other', 'Hours outside 2–8 °C at all other times', 0, 'h'],
  ['saved_vs_grid_INR_yr', '₹ saved per year vs grid-only room', 0, '₹'], ['saved_vs_diesel_INR_yr', '₹ saved per year vs grid + diesel', 0, '₹'],
];
const fmtv = (v, d, u) => (u === '₹' ? `₹${Math.round(v).toLocaleString('en-IN')}` : `${Number(v).toFixed(d)}${u && u !== '%' ? ' ' + u : u}`);

export async function howSureHTML(cfg) {
  const B = cfg.site_error_budget;
  let U = null;
  try { U = await getJSON('results/live/uncertainty_2026.json'); } catch (e) { /* study not run yet */ }
  const C = U?.cases, R = U?.random, rg = U?.range;
  const head = U ? `<div class="hs-head">
      <div><b>${C.base.days_full_solar_wax}</b> of ${C.base.days} days on solar + wax <span>(range ${rg.days_full_solar_wax.map(x => x.toFixed(0)).join('–')})</span></div>
      <div><b>${C.base.grid_h_per_year.toFixed(0)}</b> grid h/yr <span>(range ${rg.grid_h_per_year.map(x => x.toFixed(0)).join('–')})</span></div>
      <div><b>${C.base.h_outside_2_8_other.toFixed(0)} h</b> outside 2–8 °C apart from loading <span>(range ${rg.h_outside_2_8_other.map(x => x.toFixed(0)).join('–')})</span></div>
      <div><b>₹${(C.base.saved_vs_diesel_INR_yr / 1000).toFixed(1)}k</b>/yr vs diesel <span>(range ₹${rg.saved_vs_diesel_INR_yr.map(x => (x / 1000).toFixed(1) + 'k').join('–')})</span></div>
    </div>
    <p class="hs-verdict">${U.verdict}</p>
    <p class="note">${U.range_rule.charAt(0).toUpperCase() + U.range_rule.slice(1)}. ${tagChip('S')} digital-twin results on the 2026 weather (${U.period[0].slice(0, 10)} → ${U.period[1].slice(0, 10)}), with the expected site errors ${pmTag()}.</p>` :
    '<p class="note">The uncertainty study has not been run yet (python -m twin.uncertainty_2026).</p>';
  const cases = U ? `<div class="scroll"><table class="calc"><tr class="grp"><td></td><td class="num">Base (Open-Meteo)</td><td class="num">Hot site</td>
      <td class="num">Cool site</td><td class="num">${R.n} random sites: median</td><td class="num">5–95 %</td></tr>
      ${METRICS.map(([k, l, d, u]) => `<tr><td>${l}</td><td class="num"><b>${fmtv(C.base[k], d, u)}</b></td><td class="num">${fmtv(C.hot_site[k], d, u)}</td>
        <td class="num">${fmtv(C.cool_site[k], d, u)}</td><td class="num">${fmtv(R.median[k], d, u)}</td>
        <td class="num">${fmtv(R.p5[k], d, u)} – ${fmtv(R.p95[k], d, u)}</td></tr>`).join('')}</table></div>
    ` : '';
  const budget = `<table class="calc hs-budget hs-short"><tr class="grp"><td>Weather value</td><td>Each hour</td><td>Over a day</td></tr>
    ${bandRows(B).map(([b, h, d]) => `<tr><td><b>${b.name}</b></td><td>${h}</td><td>${d}</td></tr>`).join('')}</table>`;
  return `<div class="hs">
    <h3>How sure are the results?</h3>${head}
    <figure class="hs-fig"><a href="figures/final_10_uncertainty.png" target="_blank"><img src="figures/final_10_uncertainty.png" alt="Days on solar + wax and grid hours for base, hot site and cool site, with the random-run 5–95 % range"></a></figure>
    ${cases}
    <h3>Expected site weather difference vs Open-Meteo</h3>
    ${budget}</div>`;
}
