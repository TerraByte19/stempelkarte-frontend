/**
 * Kundengruppen, wie sie das Backend liefert (service.Kundengruppe).
 * Reihenfolge = Anzeige-Reihenfolge in Kundenliste, Dashboard und Profil.
 */
export const GRUPPEN = ['NEU', 'STAMMGAST', 'GELEGENTLICH', 'WIRD_RUHIG', 'VERLOREN']

/** Marken-Farben je Gruppe: Text und Hintergrund. */
export const GRUPPEN_FARBEN = {
  NEU: { color: '#1d5fa8', background: '#e3eefc' },
  STAMMGAST: { color: '#1e7a4c', background: '#ddf2e6' },
  GELEGENTLICH: { color: '#666', background: '#f0f0f0' },
  WIRD_RUHIG: { color: '#9a5d00', background: '#fbecd2' },
  VERLOREN: { color: '#8a3b3b', background: '#f4e1e1' },
}

export function istGruppe(wert) {
  return GRUPPEN.includes(wert)
}
