// Clean technical drawings made in code (SVG). Used where no real photo can exist because the part is
// our own design (the finned wax panel). Labelled "Design drawing" – never an AI picture.
// Numbers come from /api/config (design.json -> live_run.wax_hx, pcm), so the drawing follows the design.

export function waxPanelDrawing(cfg) {
  const hx = cfg?.design?.live_run?.wax_hx || {}, pcm = cfg?.design?.pcm || {};
  const b = Math.round((hx.b || 0.04) * 1000), S = Math.round((hx.S || 0.023) * 1000), t = Math.round((hx.t || 0.001) * 1000);
  const slab = pcm.mass_kg && pcm.density_kg_m3 && pcm.slab_area_m2 ? Math.round(1000 * pcm.mass_kg / (pcm.density_kg_m3 * pcm.slab_area_m2)) : 12;
  const L = hx.L || 1.7, bottom = hx.panel_bottom_m || 0.25, clear = Math.round((hx.keep_clear_m || 0.1) * 100);
  // ---- 1) side section: wall | wax slab with copper coil | fins | cold air falling | drip tray
  const top = 58, h = 210, wall = 34, slabX = 62, slabW = 30, finX = slabX + slabW, finW = 70;
  const coils = Array.from({ length: 6 }, (_, i) => `<circle cx="${slabX + slabW / 2}" cy="${top + 22 + i * 34}" r="7" class="dcu"/>`).join('');
  const fins = Array.from({ length: 11 }, (_, i) => `<line x1="${finX}" y1="${top + 8 + i * 19.5}" x2="${finX + finW}" y2="${top + 8 + i * 19.5}" class="dfin"/>`).join('');
  const air = [0, 1].map(i => `<path d="M${finX + finW + 16 + i * 14} ${top + 30} v${h - 60}" class="dair" marker-end="url(#dArr)"/>`).join('');
  const lx = 222;                                                     // label column
  const lab = (y, ty, txt) => `<path d="M${lx - 4} ${ty - 4} L${lx - 30} ${y}" class="ddim"/><text x="${lx}" y="${ty}" class="dl">${txt}</text>`;
  // ---- 2) top view of the fins
  const py = 360, pn = 8, px = 40;
  const plan = Array.from({ length: pn }, (_, i) => `<rect x="${px + 14 + i * 34}" y="${py + 18}" width="3" height="46" class="dfinr"/>`).join('');
  return `<figure class="drawing"><svg viewBox="0 0 400 484" role="img" aria-label="Design drawing of the finned wax panel: side section and top view of the fins">
    <defs><marker id="dArr" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8z" fill="#0e7490"/></marker>
      <pattern id="dIns" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M0 8 L8 0" stroke="#cbd5e1" stroke-width="1.5"/></pattern></defs>
    <style>.dl{font:13px Segoe UI,system-ui,sans-serif;fill:#334155}.dlb{font:700 14px Segoe UI,system-ui,sans-serif;fill:#0f172a}
      .dwax{fill:#dbeafe;stroke:#1e3a8a;stroke-width:1.5}.dcu{fill:#c27a3a;stroke:#7a4a1f;stroke-width:1.5}
      .dfin{stroke:#64748b;stroke-width:2.5}.dfinr{fill:#64748b}.dair{stroke:#0e7490;stroke-width:2;fill:none;stroke-dasharray:5 4}
      .ddim{stroke:#64748b;stroke-width:1;fill:none}.dtray{fill:#e2e8f0;stroke:#334155;stroke-width:1.5}</style>
    <text x="14" y="24" class="dlb">1 · Side section through one panel</text>
    <rect x="${wall}" y="${top - 10}" width="24" height="${h + 26}" fill="url(#dIns)" stroke="#94a3b8"/>
    <rect x="${slabX}" y="${top}" width="${slabW}" height="${h}" class="dwax"/>${coils}
    <rect x="${finX}" y="${top}" width="3" height="${h}" fill="#64748b"/>${fins}${air}
    <path d="M${slabX - 4} ${top + h + 12} h${slabW + finW + 44} l-6 12 h-${slabW + finW + 32} z" class="dtray"/>
    <path d="M${slabX + slabW + finW + 34} ${top + h + 24} v16" stroke="#334155" stroke-width="3"/>
    ${lab(top + 40, 62, 'insulated wall')}
    ${lab(top + 56, 84, `wax slab ${slab} mm`)}
    ${lab(top + 90, 106, 'copper coil (branch B)')}
    ${lab(top + 124, 128, `aluminium fins ${b} mm deep`)}
    ${lab(top + 160, 150, 'cold air sinks – no fan')}
    ${lab(top + h + 18, 172, 'drip tray + drain')}
    <text x="${lx}" y="212" class="dl">panel ${L} m tall,</text><text x="${lx}" y="230" class="dl">from ${bottom} m above floor</text>
    <text x="14" y="${py - 16}" class="dlb">2 · Top view of the fins</text>
    <rect x="${px}" y="${py}" width="${pn * 34 + 14}" height="18" class="dwax"/><text x="${px + pn * 34 + 22}" y="${py + 14}" class="dl">wax</text>${plan}
    <path d="M${px + 17} ${py + 74} h34" class="ddim"/><path d="M${px + 17} ${py + 68} v12 M${px + 51} ${py + 68} v12" class="ddim"/>
    <text x="${px + 34}" y="${py + 92}" class="dl" text-anchor="middle">${S} mm gap</text>
    <text x="${px + 100}" y="${py + 92}" class="dl">${t} mm thick · ${hx.section_length_m || 0.6} m removable sections</text>
    <text x="${px}" y="${py + 112}" class="dl">room side ↓ · keep ${clear} cm clear in front</text>
  </svg><figcaption><b>Design drawing</b> – our own finned wax panel (not a photo). Sizes from the design file.</figcaption></figure>`;
}
