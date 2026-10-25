/**
 * Ort des Scanner-Geraets.
 *
 * Seit 25.10.2026 Pflicht: der Server lehnt Scans ohne Ort oder ausserhalb
 * des Ladens ab. Vorher lief der Scan auch ohne Ort durch - wer die Abfrage
 * wegklickte, hatte die Pruefung umgangen. Deshalb fragt der Scanner jetzt
 * beim Oeffnen und laesst erst nach der Freigabe scannen.
 *
 * holeStandort liefert im Zweifel null und wartet hoechstens ein paar
 * Sekunden; was dann passiert, entscheidet der Aufrufer.
 */

const WARTEZEIT_MS = 8000
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

/**
 * Erlaubnis-Status des Browsers fuer den Standort, als PermissionStatus
 * (state: 'granted' | 'denied' | 'prompt', meldet Aenderungen ueber
 * onchange). Null, wo es die Permissions-API nicht gibt - dann klaert erst
 * die Abfrage selbst, woran wir sind.
 */
export async function erlaubnisStatus() {
  try {
    if (!navigator.permissions?.query) return null
    return await navigator.permissions.query({ name: 'geolocation' })
  } catch {
    return null
  }
}
