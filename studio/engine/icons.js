// Stempel-Symbole. Alle im selben Raster (24x24, nur Linien), damit jeder
// Baustein jedes Symbol zeigen kann: params.icon = "cup" | "scissors" | ...
// "cup" ist dieselbe Tasse wie auf der Landing Page (StampCard.jsx).
export const ICONS = {
  cup: '<path d="M4 8h12v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8Z"/><path d="M16 9.5h2a2.5 2.5 0 0 1 0 5h-2"/>',
  // Brotlaib mit drei Einschnitten: fuer Baeckereien
  bread: '<path d="M4 13.2C4 9.2 7.6 6.4 12 6.4s8 2.8 8 6.8v3.3a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 16.5v-3.3Z"/><path d="M8.6 10.4l1.5 2.6"/><path d="M11.6 9.8l1.5 2.6"/><path d="M14.6 10.4l1.5 2.6"/>',
  scissors: '<circle cx="6.2" cy="6.6" r="2.7"/><circle cx="6.2" cy="17.4" r="2.7"/><path d="M8.4 8.3 20 18.6"/><path d="M8.4 15.7 20 5.4"/>',
  star: '<path d="M12 3.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8Z"/>',
  heart: '<path d="M12 19.5S4.5 15 4.5 9.6A3.9 3.9 0 0 1 12 8a3.9 3.9 0 0 1 7.5 1.6c0 5.4-7.5 9.9-7.5 9.9Z"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>'
}

/** Die <symbol>-Sammlung, einmal oben in der Seite. */
export const symbolDefs = () =>
  Object.entries(ICONS).map(([id, body]) => `<symbol id="ico-${id}" viewBox="0 0 24 24">${body}</symbol>`).join('') +
  // Verlauf fuer den Stempelgriff
  '<linearGradient id="stg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#D5CEFF"/></linearGradient>'

/** Ein Symbol als SVG. Unbekannte Namen lehnt engine.js vorher ab; die Tasse hier ist nur das letzte Netz. */
export const icon = name => `<svg class="ico" viewBox="0 0 24 24"><use href="#ico-${ICONS[name] ? name : 'cup'}"/></svg>`
