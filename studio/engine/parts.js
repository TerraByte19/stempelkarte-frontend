// Bauteile, die mehrere Bausteine teilen (das zugehoerige CSS steht in base.css).
// Hier liegt nur, was wirklich doppelt gebraucht wird - alles andere bleibt
// beim einzelnen Baustein, damit man ihn in einer Datei versteht.

// Schiefe der Papierstempel: von Hand gesetzt, damit es nicht gedruckt aussieht
const TILT = [-9, 6, -4, 11, -7, 8, -5, 10, -8, 5]

/** Spalten fuer ein Stempelraster: immer zwei Reihen (6 -> 3 Spalten wie im ersten Video, 8 -> 4, 10 -> 5). */
export const stampCols = n => Math.ceil(n / 2)

/**
 * Fuellt ein Papier-Stempelraster: `filled` Felder tragen schon einen
 * Tintenstempel, das letzte Feld ist das Gratis-Feld.
 * Gibt die Felder zurueck (slot.ink = der Tintenstempel, falls vorhanden).
 */
export function paperGrid(ctx, grid, { stamps, filled, freeLabel, icon, glow = false }) {
  const slots = []
  grid.style.gridTemplateColumns = `repeat(${stampCols(stamps)}, ${grid.dataset.cell}px)`
  for (let i = 0; i < stamps; i++) {
    const s = ctx.el('div', 'slot'); grid.append(s); slots.push(s)
    if (i === stamps - 1) {
      s.textContent = freeLabel
      if (glow) { const on = ctx.el('div', 'freeon'); on.textContent = freeLabel; s.append(ctx.el('div', 'freeglow'), on) }
      // "GRATIS" fuellt den Kreis gerade so. Laengere Aufschriften werden kleiner gesetzt, statt ueberzulaufen.
      if (freeLabel.length > 6) {
        const size = (parseFloat(getComputedStyle(s).fontSize) * 6.4 / freeLabel.length).toFixed(1) + 'px'
        s.style.fontSize = size; const on = s.querySelector('.freeon'); if (on) on.style.fontSize = size
      }
    } else if (i < filled) {
      const ink = ctx.el('div', 'ink', ctx.icon(icon)); ink.style.rotate = TILT[i % TILT.length] + 'deg'; s.append(ink); s.ink = ink
    }
  }
  return slots
}

/** Prueft Stempelzahlen einmal fuer alle Bausteine mit Karte. */
export function checkStamps(ctx, stamps, filled, max = 10) {
  if (!Number.isInteger(stamps) || stamps < 4 || stamps > max) ctx.fail(`"stamps" muss zwischen 4 und ${max} liegen (bekam ${stamps}), sonst passt das Raster nicht auf die Karte`)
  if (!Number.isInteger(filled) || filled < 1 || filled > stamps - 1) ctx.fail(`"filled" muss zwischen 1 und ${stamps - 1} liegen (das letzte Feld ist das Gratis-Feld)`)
}
