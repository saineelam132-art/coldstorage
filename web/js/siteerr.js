// EXPECTED site error of the Open-Meteo weather (config/site_error_budget.json, from published studies).
// These bands are NOT measurements: they show how far a sensor at our exact site may differ from the
// grid data. Same rules as twin/site_error.py.  Tag on screen: "W±".
const LAT = 17.69, LON = 83.22, IST_MIN = 330;
export const U2 = 4.87 / Math.log(67.8 * 10 - 5.42);          // FAO-56: wind at 2 m = 0.748 × wind at 10 m
export const u2 = u10 => (u10 === null || u10 === undefined ? null : u10 * U2);
const esat = T => 6.1094 * Math.exp(17.625 * T / (T + 243.04));
export function dewpoint(T, RH) {
  const g = Math.log(Math.max(0.5, Math.min(100, RH)) / 100) + 17.625 * T / (T + 243.04);
  return 243.04 * g / (17.625 - g);
}
export const rhFrom = (T, Td) => Math.max(1, Math.min(100, 100 * esat(Math.min(Td, T)) / esat(T)));

// sun elevation (deg) at IST date 'YYYY-MM-DD' and decimal hour, and Haurwitz clear-sky sunlight (W/m²)
export function sunElev(day, hour) {
  const [y, m, d] = day.split('-').map(Number);
  const doy = Math.round((Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 1)) / 864e5) + 1;
  const g = 2 * Math.PI / 365 * (doy - 1 + (hour - 12) / 24);
  const eq = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
  const decl = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g)
    - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
  const tst = hour * 60 + eq + 4 * LON - IST_MIN, ha = (tst / 4 - 180) * Math.PI / 180, lat = LAT * Math.PI / 180;
  const cz = Math.sin(lat) * Math.sin(decl) + Math.cos(lat) * Math.cos(decl) * Math.cos(ha);
  return Math.asin(Math.max(-1, Math.min(1, cz))) * 180 / Math.PI;
}
export function clearSky(day, hour) {
  const cz = Math.sin(sunElev(day, hour + 0.5) * Math.PI / 180);
  return cz > 0.01 ? 1098 * cz * Math.exp(-0.057 / cz) : 0;
}

export class SiteError {
  constructor(budget) { this.B = budget || null; }
  get ok() { return !!this.B; }
  band(k) { return this.B?.bands?.[k]; }
  // ± for the air temperature: larger on sunny, calm afternoons
  tempPM(hour, ghi, wind10) {
    const b = this.band('temp_C'), r = b.sunny_calm_rule;
    const calm = hour >= r.hours[0] && hour <= r.hours[1] && ghi > r.ghi_min_W_m2 && u2(wind10) < r.wind2m_max_m_s;
    return calm ? b.hourly_sunny_calm : b.hourly;
  }
  temp(T, hour, ghi, wind10) { const d = this.tempPM(hour, ghi, wind10); return [T - d, T + d, d]; }
  dew(Td) { const d = this.band('dewpoint_C').hourly; return [Td - d, Td + d, d]; }
  // RH band from the temperature band and the dew-point band (not a flat %)
  rh(T, RH, dT, Td = null) {
    const td = Td ?? dewpoint(T, RH), dd = this.band('dewpoint_C').hourly;
    return [rhFrom(T + dT, td - dd), rhFrom(T - dT, td + dd)];
  }
  ghiRel(ghi, cs) {
    const b = this.band('ghi_rel');
    return cs > 20 && ghi / cs < b.overcast_rule.clearness_index_below ? b.hourly_overcast : b.hourly;
  }
  ghi(ghi, cs) { const r = this.ghiRel(ghi, cs); return [Math.max(0, ghi * (1 - r)), ghi * (1 + r), r]; }
  wind2(w2) { const d = this.band('wind_ms').hourly; return [Math.max(0, w2 - d), w2 + d, d]; }
  pv(p) { const r = this.band('pv_energy_rel').hourly; return [Math.max(0, p * (1 - r)), p * (1 + r), r]; }
  src(k) { return this.band(k)?.source || ''; }
}

export const pmTag = () => '<span class="tag Wpm" title="Expected range from published studies – not measured">W±</span>';
