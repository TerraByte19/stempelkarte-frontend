/**
 * Ort des Scanner-Geraets, so gut er zu bekommen ist.
 *
 * Der Server vergleicht ihn mit dem hinterlegten Ort des Ladens und meldet
 * Scans, die weit weg passieren. Gesperrt wird nichts: der Browser gibt den
 * Ort nur mit Erlaubnis her, ein Tablet ohne GPS schaetzt ueber das WLAN,
 * und in einem Hinterzimmer kommt gar nichts. Ein Scan darf daran nicht
 * scheitern - deshalb liefert diese Funktion im Zweifel null und wartet
 * hoechstens ein paar Sekunden.
 */

const WARTEZEIT_MS = 4000
// Eine Minute alte Position reicht: der Laden bewegt sich nicht.
const MAX_ALTER_MS = 60_000

export function holeStandort(timeoutMs = WARTEZEIT_MS) {
  return new Promise(resolve => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve(null)
      return
    }
    let erledigt = false
    const fertig = (wert) => {
      if (erledigt) return
      erledigt = true
      resolve(wert)
    }

    // Eigener Wecker: manche Browser rufen den Fehler-Rueckruf nie auf,
    // wenn der Nutzer den Erlaubnis-Dialog einfach stehen laesst. Ohne das
    // haenge der Scan dort fest.
    const wecker = setTimeout(() => fertig(null), timeoutMs)

    navigator.geolocation.getCurrentPosition(
      pos => {
        clearTimeout(wecker)
        fertig({ lat: pos.coords.latitude, lon: pos.coords.longitude })
      },
      () => {
        clearTimeout(wecker)
        fertig(null)
      },
      { enableHighAccuracy: false, timeout: timeoutMs, maximumAge: MAX_ALTER_MS }
    )
  })
}
