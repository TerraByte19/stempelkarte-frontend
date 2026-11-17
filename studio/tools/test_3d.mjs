#!/usr/bin/env node
// test_3d.mjs - prueft den 3D-Baustein iso-street (und damit den Weg ctx.frame -> seek(t) -> WebGL).
//
//   node studio/tools/test_3d.mjs
//
// Was festgenagelt wird und warum:
//  1. Gleiches Bild, gleiche Pixel: Bild t, dann ein anderes, dann wieder t ergibt Pixel fuer Pixel
//     dasselbe. renderVideo verteilt die Bilder auf mehrere Seiten und rechnet sie nicht der Reihe
//     nach; haengt ein Bild von dem davor ab (Zufall, Uhr, Zustand, der sich ansammelt), flackert
//     das Video. Dasselbe Bild auf einer ZWEITEN Seite muss ebenfalls gleich sein.
//  2. Die Szene ist nicht leer: WebGL laeuft in Chromium ohne Grafikkarte (SwiftShader). Faellt es
//     aus oder zeichnet die Szene nichts, sieht man nur den Nachthimmel, und keine andere Pruefung
//     merkt es (die Leinwand hat kein data-safe). Gezaehlt wird, wie viel vom Bild nicht Himmel ist
//     und ob dort Licht (Fenster, Schilder) und Farbe (Herz) zu sehen sind.
//  3. seek(t, { paint: false }) zeichnet nicht: die Bewegungsprobe in render.mjs ruft seek alle
//     0,25 s auf; mit Zeichnen kostete das am 17.11.2026 bei 8 s Video vier Minuten.
//  4. Sekunden je Bild werden gemessen und ausgegeben (Warnung ab 3 s, Fehler ab 8 s).
//
// Kein Netz, keine Kosten, etwa eine Minute. NOCH NICHT in tools/selftest.mjs eingebunden (dort
// arbeitete beim Bau eine andere Sitzung); das soll spaeter dort aufgerufen werden.
import { createHash } from 'node:crypto'
import { normalize, estimateTimes } from '../engine/script.mjs'
import { openStudio, seek } from '../engine/render.mjs'

const script = {
  meta: { title: 'test 3d', slug: 'test-3d' },
  scenes: [{
    component: 'iso-street',
    params: { shop: 'Döner Palast', icon: 'kebab', rival: 'Imbiss Sonne', rivalIcon: 'kebab' },
    anchors: { crack: { cap: 0, word: 4 }, walk: { at: 'start', offset: 0.2 }, enter: { cap: 1, word: -1 } },
    captions: [{ lines: ['Dein Stammkunde', 'hat dich betrogen.'], instant: true }, { lines: ['Mit dem Dönerladen gegenüber.'] }]
  }]
}

let failed = 0
const check = (label, ok, info = '') => { console.log(`${ok ? 'ok    ' : 'FEHLER'} ${label}${info ? ' - ' + info : ''}`); if (!ok) failed++ }

// Pixel der 3D-Leinwand selbst (ohne Textzeilen und Verlaeufe darueber): Fingerabdruck und Kennzahlen
const canvasStats = pg => pg.evaluate(() => {
  const c = document.querySelector('canvas.is-canvas')
  if (!c) return null
  const g = document.createElement('canvas'); g.width = c.width; g.height = c.height
  const x = g.getContext('2d', { willReadFrequently: true }); x.drawImage(c, 0, 0)
  const d = x.getImageData(0, 0, c.width, c.height).data
  // Fingerabdruck: FNV-1a ueber alle Bytes (schnell, in der Seite, ohne Bibliothek)
  let h = 0x811c9dc5
  for (let i = 0; i < d.length; i++) { h ^= d[i]; h = Math.imul(h, 0x01000193) >>> 0 }
  const sky = [14, 10, 36] // BRAND.night, Hintergrund und Dunst
  let notSky = 0, bright = 0, pink = 0, n = 0
  for (let i = 0; i < d.length; i += 16) { // jedes vierte Pixel reicht fuer die Anteile
    const r = d[i], gg = d[i + 1], b = d[i + 2]; n++
    if (Math.abs(r - sky[0]) + Math.abs(gg - sky[1]) + Math.abs(b - sky[2]) > 18) notSky++
    if (r + gg + b > 600) bright++
    if (r > 180 && gg < 110 && b > 80 && b < 170) pink++
  }
  return { hash: h.toString(16), w: c.width, h: c.height, notSky: notSky / n, bright: bright / n, pink: pink / n }
})

const times = estimateTimes(normalize(script))
const studio = await openStudio({ script, times })
try {
  const t0 = Date.now()
  const a = await studio.page(), st = await studio.state(a)
  const buildSeconds = (Date.now() - t0) / 1000
  check('Seite baut ohne Fehler', !st.errors.length && !studio.problems.length, [...st.errors, ...studio.problems].join(' | ').slice(0, 200) || `${buildSeconds.toFixed(1)} s`)
  const T = 1.4
  await seek(a, T); const s1 = await canvasStats(a), shot1 = await a.screenshot()
  check('Leinwand vorhanden (WebGL läuft)', !!s1 && s1.w === 1080, s1 ? `${s1.w}x${s1.h}` : 'keine canvas.is-canvas')
  if (s1) {
    check('Szene nicht leer: mindestens 60 % des Bildes sind nicht Himmel', s1.notSky > 0.6, `${(s1.notSky * 100).toFixed(1)} %`)
    check('Licht zu sehen (Fenster, Schilder): mindestens 0,5 % helle Pixel', s1.bright > 0.005, `${(s1.bright * 100).toFixed(2)} %`)
    check('Herz zu sehen: rosa Pixel vorhanden', s1.pink > 0.0005, `${(s1.pink * 100).toFixed(3)} %`)
  }
  // Andere Zeitpunkte rechnen (auch rueckwaerts), dann zurueck: muss wieder genau dasselbe sein
  const per = []
  for (const t of [3.2, 0.5, 2.7]) { const q = Date.now(); await seek(a, t); await a.screenshot({ type: 'jpeg', quality: 95 }); per.push((Date.now() - q) / 1000) }
  const s3 = await canvasStats(a)
  await seek(a, T); const s2 = await canvasStats(a), shot2 = await a.screenshot()
  check(`Gleiches Bild (t = ${T} s) nach Sprüngen gleich: Leinwand Pixel für Pixel`, !!s1 && s1.hash === s2.hash, `${s1 && s1.hash} / ${s2 && s2.hash}`)
  check('Gleiches Bild nach Sprüngen gleich: ganzer Bildschirm (mit Textzeilen)', createHash('sha256').update(shot1).digest('hex') === createHash('sha256').update(shot2).digest('hex'))
  check('Andere Zeit, anderes Bild (die Szene bewegt sich)', !!s3 && s3.hash !== s1.hash)
  const b = await studio.page()
  await seek(b, T); const sb = await canvasStats(b), shotB = await b.screenshot()
  check('Gleiches Bild auf einer zweiten Seite gleich (renderVideo rechnet auf mehreren)', !!sb && sb.hash === s1.hash && createHash('sha256').update(shotB).digest('hex') === createHash('sha256').update(shot1).digest('hex'), `${sb && sb.hash}`)
  // paint: false stellt nur die Zeit, die Leinwand bleibt, wie sie war
  await b.evaluate(() => window.seek(3.5, { paint: false })); const sp = await canvasStats(b)
  check('seek(t, { paint: false }) zeichnet nicht (Bewegungsprobe bleibt schnell)', !!sp && sp.hash === s1.hash)
  const spf = per.reduce((x, y) => x + y, 0) / per.length
  console.log(`Sekunden je Bild (rechnen + Foto, eine Seite): ${per.map(x => x.toFixed(2)).join(' / ')}, Mittel ${spf.toFixed(2)}; Seite gebaut in ${buildSeconds.toFixed(1)} s`)
  check('Rechenzeit unter 8 s je Bild', spf < 8, spf.toFixed(2) + ' s')
  if (spf > 3) console.log('WARNUNG: über 3 s je Bild, ein Video mit langer 3D-Szene dauert dann sehr lange')
} finally { await studio.close() }
console.log(failed ? `${failed} Prüfung(en) gescheitert` : 'Alle Prüfungen bestanden')
process.exit(failed ? 1 : 0)
