/**
 * Hochformat und Querformat im Scanner.
 *
 * Das Tablet am Tresen liegt oft quer in einer Halterung, das Handy wird
 * hochkant gehalten - und manche drehen mitten im Scannen. Der alte Leser
 * (html5-qrcode) merkt sich beim Start, wie gross das Kamerafenster ist, und
 * liest danach nur noch diesen Ausschnitt. Nach dem Drehen stimmt der nicht
 * mehr. Hier wird er nachgezogen, ohne die Kamera neu zu starten: ein
 * Neustart waere fuer das iPhone eine neue Kamera-Anfrage.
 *
 * Die Herausforderer-Leser (scannerLeser) lesen das Videobild direkt und
 * brauchen das nicht.
 *
 * lageAus und neueFlaeche sind reine Logik und mit node:test pruefbar.
 */

/** 'quer' | 'hoch' | null. typ = screen.orientation.type, sonst zaehlt das Fenster. */
export function lageAus(typ, breite, hoehe) {
  if (typeof typ === 'string') {
    if (typ.startsWith('landscape')) return 'quer'
    if (typ.startsWith('portrait')) return 'hoch'
  }
  if (breite > 0 && hoehe > 0) return breite > hoehe ? 'quer' : 'hoch'
  return null
}

export function lage() {
  try {
    return lageAus(window.screen?.orientation?.type, window.innerWidth, window.innerHeight)
  } catch {
    return null
  }
}

/**
 * Die Leseflaeche, die zum jetzigen Kamerafenster passt - oder null, wenn
 * nichts zu tun ist (unveraendert, Fenster gerade unsichtbar) oder der Leser
 * mit einem eigenen Rahmen (qrbox) arbeitet, der nicht uns gehoert.
 */
export function neueFlaeche(flaeche, breite, hoehe) {
  if (!flaeche || flaeche.x !== 0 || flaeche.y !== 0) return null
  const b = Math.round(breite)
  const h = Math.round(hoehe)
  if (!(b > 0) || !(h > 0)) return null
  if (flaeche.width === b && flaeche.height === h) return null
  return { x: 0, y: 0, width: b, height: h }
}

/**
 * Leseflaeche des alten Lesers an das Kamerafenster anpassen. Greift in
 * Innereien von html5-qrcode 2.3.8 (qrRegion, canvasElement); fehlen die
 * in einer spaeteren Version, passiert einfach nichts.
 */
export function passeLeseflaecheAn(leser, video) {
  try {
    if (!leser || !video || !leser.canvasElement) return false
    const neu = neueFlaeche(leser.qrRegion, video.clientWidth, video.clientHeight)
    if (!neu) return false
    leser.canvasElement.width = neu.width
    leser.canvasElement.height = neu.height
    leser.qrRegion = neu
    return true
  } catch {
    return false
  }
}

/**
 * Haelt die Leseflaeche aktuell, solange die Kamera laeuft: beim Drehen des
 * Geraets, bei geaenderter Fenstergroesse und wenn das Kamerabild selbst
 * sein Format wechselt. holeLeser liefert die laufende Html5Qrcode-Instanz
 * (oder null). Gibt die Funktion zum Aufraeumen zurueck.
 */
export function beobachteLage(behaelter, holeLeser) {
  if (!behaelter) return () => {}
  const anpassen = () => passeLeseflaecheAn(holeLeser(), behaelter.querySelector('video'))
  // Nach dem Drehen steht die neue Groesse nicht sofort: kurz spaeter noch einmal.
  let wecker = null
  const spaeter = () => {
    anpassen()
    clearTimeout(wecker)
    wecker = setTimeout(anpassen, 400)
  }
  let beobachter = null
  if (typeof ResizeObserver !== 'undefined') {
    beobachter = new ResizeObserver(spaeter)
    beobachter.observe(behaelter)
  }
  window.addEventListener('resize', spaeter)
  window.addEventListener('orientationchange', spaeter)
  // 'resize' am <video> meldet, dass die Kamera ein anderes Bildformat liefert.
  // Das Ereignis steigt nicht auf, deshalb in der Einfangphase am Behaelter.
  behaelter.addEventListener('resize', spaeter, true)
  spaeter()
  return () => {
    clearTimeout(wecker)
    beobachter?.disconnect()
    window.removeEventListener('resize', spaeter)
    window.removeEventListener('orientationchange', spaeter)
    behaelter.removeEventListener('resize', spaeter, true)
  }
}

/** Was die stille Messung ueber Lage und Kamerabild mitschickt. */
export function lageDaten(video) {
  return {
    lage: lage(),
    bildBreite: video?.videoWidth || null,
    bildHoehe: video?.videoHeight || null,
  }
}
