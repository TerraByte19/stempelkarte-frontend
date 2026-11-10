/**
 * Support-Zugang: der Betreiber oeffnet aus dem Admin-Panel das Dashboard
 * eines Ladens (POST /api/admin/shops/{id}/zugang). Das Backend gibt einen
 * Laden-Token mit der Markierung "support" heraus, eine Stunde gueltig.
 *
 * Reine Logik ohne React, damit node --test sie pruefen kann. Der Speicher
 * wird hereingereicht (im Browser localStorage).
 */

/**
 * Liest die Markierung aus dem Token. Antwort { bis } (Millisekunden) nur fuer
 * einen laufenden Support-Token, sonst null - auch bei kaputtem Token. Der
 * Balken im Dashboard haengt allein daran, nicht an einem eigenen Merker, der
 * nach einem normalen Login stehen bleiben koennte.
 *
 * Das ist nur Anzeige. Ob der Token gilt, entscheidet das Backend.
 */
export function supportAusToken(token, jetzt = Date.now()) {
  if (typeof token !== 'string') return null
  const teile = token.split('.')
  if (teile.length !== 3) return null
  try {
    const b64 = teile[1].replace(/-/g, '+').replace(/_/g, '/')
    const daten = JSON.parse(atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4)))
    if (daten?.support !== true || typeof daten.exp !== 'number') return null
    const bis = daten.exp * 1000
    return bis > jetzt ? { bis } : null
  } catch {
    return null
  }
}

/**
 * Legt den Support-Zugang so ab, wie der Login es fuer einen Laden tut.
 *
 * Der Mitarbeiter-Token wird entfernt und NICHT neu gesetzt: laege noch einer
 * von einem anderen Laden im Browser, wuerde der Scanner dort stempeln,
 * waehrend das Dashboard diesen Laden zeigt. Im Support-Zugang wird nicht
 * gestempelt.
 */
export function supportStarten(speicher, zugang) {
  if (!zugang?.token || !zugang?.shopId) throw new Error('Antwort ohne Token')
  speicher.setItem('token', zugang.token)
  speicher.setItem('shop', JSON.stringify({ id: zugang.shopId, name: zugang.name }))
  speicher.removeItem('staffToken')
  speicher.removeItem('staffTokenLabel')
}

/** Beendet den Zugang: nichts vom Laden bleibt im Browser zurueck. */
export function supportBeenden(speicher) {
  speicher.removeItem('token')
  speicher.removeItem('shop')
  speicher.removeItem('staffToken')
  speicher.removeItem('staffTokenLabel')
}

/** "14:05" in Ortszeit, fuer "endet um ...". */
export function uhrzeit(ms) {
  const d = new Date(ms)
  const p = n => String(n).padStart(2, '0')
  return `${p(d.getHours())}:${p(d.getMinutes())}`
}
