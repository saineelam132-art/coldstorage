// "Tomorrow's plan" card (data: window.LIVE.advisor from python -m twin.advisor). Plain script for the home page
// (side menu) and the Live page. F = Open-Meteo forecast, S = digital twin run on that forecast.
(function () {
  'use strict';
  const inr = v => '₹' + Math.round(v).toLocaleString('en-IN');
  const f1 = v => (v === null || v === undefined || !isFinite(v) ? '—' : Number(v).toFixed(1));
  const chip = (t, tip) => `<span class="advtag ${t}" title="${tip}">${t}</span>`;
  const ICON = { normal: '☀️', low_sun: '⛅', storm: '⛈️' };
  function card(d, A) {
    const w = d.weather_F, p = d.plan_S;
    return `<div class="advcard ${d.rule}"><div class="advhead"><b>${ICON[d.rule] || ''} ${d.label}'s plan</b><span>${d.date}${d.confidence !== 'normal' ? ' · ' + d.confidence + ' confidence' : ''}</span></div>
      <div class="advline">${d.advice}</div>
      <div class="advwx">${chip('F', 'Open-Meteo forecast')} ${f1(w.T_min_C)}–${f1(w.T_max_C)} °C · sun ${f1(w.sun_kWh_m2)} kWh/m² · rain ${f1(w.rain_mm)} mm${w.gust_max_kmh !== null ? ` · gusts ${Math.round(w.gust_max_kmh)} km/h` : ''}${w.cloud_mean_pct !== null ? ` · cloud ${Math.round(w.cloud_mean_pct)} %` : ''}</div>
      <table class="advt"><tr><th>Power source ${chip('S', 'digital twin on the forecast')}</th><th>Hours needed</th><th>Cost</th></tr>
        <tr><td>Solar + wax</td><td>${f1(p.solar_wax_h)} h</td><td>₹0</td></tr>
        <tr><td>Grid</td><td>${f1(p.grid_h)} h</td><td>${inr(p.cost_grid_INR)}</td></tr>
        <tr><td>Diesel (if the grid is cut ${p.cut_hours[0]}–${p.cut_hours[1]} h)</td><td>${f1(p.diesel_h_if_cut)} h</td><td>${inr(p.diesel_L_if_cut * A.diesel)}</td></tr></table>
      <div class="advsave">Saved vs a grid-only room <b>${inr(p.saved_vs_grid_INR)}</b> · vs a diesel-only room <b>${inr(p.saved_vs_diesel_INR)}</b></div>
      <ul class="advx">${d.extra.map(x => `<li>${x.replace(/(https?:\/\/[^\s)]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>')}</li>`).join('')}</ul>
      <div class="advnote">Wax at night ${Math.round(p.wax_night_pct)} % · room max ${f1(p.room_max_C)} °C</div></div>`;
  }
  window.renderAdvisor = function (el, A) {
    A = A || (window.LIVE && window.LIVE.advisor);
    if (!el) return;
    if (!A || !A.days || !A.days.length) { el.innerHTML = '<div class="advcard"><b>Tomorrow\'s plan</b><div class="advnote">No forecast saved yet.</div></div>'; return; }
    el.innerHTML = A.days.map(d => card(d, A)).join('') +
      `<div class="advnote">Forecast from ${A.forecast_from || A.generated}${navigator.onLine === false ? ' (offline – last saved forecast)' : ''}.
       ${chip('F', '')} = forecast, ${chip('S', '')} = digital twin. Prices: grid ₹${A.tariff}/kWh, diesel ₹${A.diesel}/L (guesses).</div>`;
  };
})();
