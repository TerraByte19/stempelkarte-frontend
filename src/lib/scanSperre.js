/**
 * Sperre fuer den QR-Code des Kunden davor.
 *
 * Zwischen zwei Kunden wird die Kamera nur pausiert. Nach "Naechster Kunde"
 * oder "Abbrechen" kann sie im ersten Moment noch den alten Code liefern:
 * das eingefrorene Bild von vorhin, oder der Kunde haelt sein Handy noch
 * hin. Bis 18.11.2026 bekam der vorige Kunde dann den Stempel des naechsten
 * (Meldung aus einem Laden) - das Personal sah "QR erkannt" und tippte auf
 * Stempeln.
 *
 * Deshalb wird genau dieser Code verworfen, bis er SPERRE_MS lang nicht mehr
 * erkannt wurde. Jede erneute Erkennung verlaengert die Sperre: ein
 * eingefrorenes Bild kommt so nie durch, ein bewusst neu gezeigter Code
 * nach kurzem Wegnehmen schon. Ein anderer Code (der naechste Kunde) geht
 * sofort.
 */
export const SPERRE_MS = 1500

export function neueSperre() {
  let gesperrt = null
  let bis = 0
  return {
    /** Nach Weiter/Abbrechen: den eben bearbeiteten Code sperren. */
    setze(text, jetzt) {
      gesperrt = text || null
      bis = jetzt + SPERRE_MS
    },
    /** true = Treffer verwerfen. Verlaengert dabei die Sperre. */
    verwirft(text, jetzt) {
      if (!gesperrt || text !== gesperrt || jetzt > bis) return false
      bis = jetzt + SPERRE_MS
      return true
    },
  }
}
