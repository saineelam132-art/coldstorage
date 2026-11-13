// Real photos for "How it works" and the component cards (assets/photos.json, made by tools/photos.py).
// Order: our own photo -> freely licensed example photo (with credit line) -> design drawing made in code.
// AI pictures are NOT used here (only in the home concept scene, labelled "Concept illustration").
import { waxPanelDrawing } from './drawings.js';

let P = null, CFG = null;
export function setPhotos(photos, cfg) { P = photos; CFG = cfg; }

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const DRAW = { wax_panel: () => waxPanelDrawing(CFG) };

export function photoFigure(key) {
  const p = P?.photos?.[key];
  if (!p) return '';
  if (p.kind === 'drawing') return DRAW[p.drawing] ? DRAW[p.drawing]() : '';
  const src = p.source ? ` · <a href="${esc(p.source)}" target="_blank" rel="noopener">source</a>` : '';
  return `<figure class="realph" data-photo="${esc(key)}"><img src="${esc(p.file)}" alt="${esc(p.caption)}" loading="lazy">
    <figcaption>${esc(p.caption)}<span class="credit">${esc(p.credit)}${src}</span></figcaption></figure>`;
}

// kind: 'parts' | 'sensors'
export function photoFor(kind, id) { return photoFigure(P?.use?.[kind]?.[id]); }

export function howPhotos() {
  const figs = (P?.use?.how || []).map(photoFigure).filter(Boolean);
  return figs.length ? `<div class="photostrip">${figs.join('')}</div>` : '';
}

export function photoFile(key) { const p = P?.photos?.[key]; return p && p.kind !== 'drawing' ? p.file : null; }
