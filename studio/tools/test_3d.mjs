#!/usr/bin/env node
// test_3d.mjs - prueft den 3D-Baustein iso-street, den 3D-Baukasten engine/kit3d.js und damit den Weg
// ctx.frame -> seek(t) -> WebGL.
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
//  5. Pruefkaesten: der Baustein legt unsichtbare Kaesten mit data-safe auf beide Schilder, das Herz
//     und den Stammkunden. Geprueft wird, dass es sie gibt, dass sie auf dem Bild liegen (im Kasten
//     eines Schildes ist es hell, in dem des Herzens rosa) und dass die Pruefungen des Studios sie
//     sehen (Ruhelage fuer Sperrzonen, Bewegungsprobe fuer die Knopfspalte). Vorher stand das Schild
//     rechts bis x = 1069 unter den TikTok-Knoepfen, und make.mjs meldete trotzdem "ok knopfspalte".
//  6. Bildausschnitt an den Grenzen der Parameter: eigener Laden links und rechts, push 0 und 0,25,
//     orbit 0 und 12. Ueber die ganze Szene bleiben Schilder und Herz 60 px vom Bildrand, in den
//     Sperrzonen-Grenzen und rechts vor x = 940 (Knopfspalte); das letzte Bild wird dazu gerechnet und
//     nachgesehen, ob die Kaesten dort noch auf den Schildern liegen. Vorher schnitt push 0,25 die
//     Schilder an ("...sse Sonne", "Café M..."), und das Herz flog beim Bruch bis 19 px an den Rand.
//  7. Die Tuer: in 0,05-s-Schritten um "walk" und "enter" hat der Stammkunde Abstand zu jedem
//     Tuerblatt (canvas.isoDebug.doorGap, in Metern). Vorher schwang das Blatt in ihn hinein und sein
//     Arm steckte bei 4,7 s im Glas.
//  8. Lange Ladennamen ("Döner Nordwind") stehen in zwei Zeilen, das letzte Wort gross, ohne Warnung
//     "sehr klein"; kurze ("Döner Palast") bleiben einzeilig wie in der Probe. Vorher stand der Name des
//     Doener-Videos einzeilig auf 0,38 der Schildhoehe, auf dem Handy kaum lesbar.
//  9. Folgt eine Szene, dunkelt die Stadt beim Wechsel ab (als letzte Szene und in der Ruhelage nicht).
//     Vorher stand die halb durchsichtige naechste Szene rund 0,25 s lang ueber der hellen Stadt.
// 10. Der 3D-Baukasten engine/kit3d.js (seit 17.11.2026, abends; iso-street baut darauf): in Node
//     importierbar mit festen reinen Funktionen (rng, walkCycle, splitName); EIN Renderer fuer 20 Szenen
//     auf einer Seite, ohne dass eine ihr Bild verliert (Chromium haelt nur 16 WebGL-Kontexte je Seite, mit
//     einem Renderer je Szene waeren die ersten schwarz); fitFrame haelt Punkte ueber die ganze Fahrt im
//     Rahmen und fuellt ihn.
// 11. Zwei 3D-Teile in einer Szene (seit 18.11.2026): jeder rechnet nur, solange sein Teil zu sehen sein
//     kann. Vorher rechneten beide die ganze Szene lang, und ein Video fast ganz in 3D kam nicht auf die
//     Bildwechsel von Stil C.
//
// Kein Netz, keine Kosten, etwa zwei Minuten. Laeuft seit dem 17.11.2026 (abends) auch in
// tools/selftest.mjs mit; vorher arbeitete dort eine andere Sitzung.
import { createHash } from 'node:crypto'
import { normalize, estimateTimes, STAGE } from '../engine/script.mjs'
import { openStudio, seek, sampleMotion } from '../engine/render.mjs'

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

// Was in den Pruefkaesten auf der Leinwand liegt: Anteil heller Pixel (Schild) und rosa Pixel (Herz).
// Die Kaesten sitzen in Buehnenpunkten; die Leinwand ist so gross wie die Buehne und die 2D-Kamerafahrt
// ist aufgehoben (.is-wrap), also sind es dieselben Punkte.
const boxStats = pg => pg.evaluate(() => {
  const c = document.querySelector('canvas.is-canvas'), g = document.createElement('canvas'); g.width = c.width; g.height = c.height
  const x = g.getContext('2d', { willReadFrequently: true }); x.drawImage(c, 0, 0)
  return window.STUDIO.probe().map(it => {
    const x0 = Math.max(0, Math.round(it.left)), y0 = Math.max(0, Math.round(it.top)), w = Math.min(c.width, Math.round(it.right)) - x0, h = Math.min(c.height, Math.round(it.bottom)) - y0
    if (w < 2 || h < 2) return { ...it, bright: 0, pink: 0 }
    const d = x.getImageData(x0, y0, w, h).data
    let bright = 0, pink = 0
    for (let i = 0; i < d.length; i += 4) { const r = d[i], gg = d[i + 1], b = d[i + 2]; if (r + gg + b > 600) bright++; if (r > 180 && gg < 110 && b > 80 && b < 170) pink++ }
    return { ...it, bright: bright / (w * h), pink: pink / (w * h) }
  })
})
const MARGIN = 60, COL = STAGE.column, SAFE_TOP = STAGE.safeTop, SAFE_BOTTOM = STAGE.h - STAGE.safeBottom
const isMain = what => /^Schild |^Herz$/.test(what)
// Geht die Szene ohne Zeichnen durch und sammelt, wohin jeder Kasten reicht (und wann)
const sweep = (pg, duration, step) => pg.evaluate(({ duration, step }) => {
  const out = {}
  for (let t = 0; t <= duration + 1e-6; t = +(t + step).toFixed(3)) {
    window.seek(t, { paint: false })
    for (const it of window.STUDIO.probe()) {
      const o = out[it.what] || (out[it.what] = { left: 1e9, right: -1e9, top: 1e9, bottom: -1e9, bandRight: -1e9, at: {} })
      if (it.left < o.left) { o.left = it.left; o.at.left = t }
      if (it.right > o.right) { o.right = it.right; o.at.right = t }
      o.top = Math.min(o.top, it.top); o.bottom = Math.max(o.bottom, it.bottom)
      if (it.bottom > 900 && it.top < 1540 && it.right > o.bandRight) { o.bandRight = it.right; o.at.band = t }
    }
  }
  window.seek(0, { paint: false })
  return out
}, { duration, step })

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

  // ---- 5. Pruefkaesten
  await seek(a, T)
  const bx = await boxStats(a), by = w => bx.find(it => it.what === w)
  check('Prüfkästen vorhanden: beide Schilder, Herz, Stammkunde', ['Schild Döner Palast', 'Schild Imbiss Sonne', 'Herz', 'Stammkunde'].every(by), bx.map(it => it.what).join(', '))
  for (const w of ['Schild Döner Palast', 'Schild Imbiss Sonne']) {
    const it = by(w)
    check(`Kasten "${w}" liegt auf dem Schild (mindestens 25 % helle Pixel darin)`, !!it && it.bright > 0.25, it ? `${(it.bright * 100).toFixed(0)} %, x ${Math.round(it.left)} bis ${Math.round(it.right)}, y ${Math.round(it.top)} bis ${Math.round(it.bottom)}` : 'fehlt')
  }
  const hz = by('Herz'), wk = by('Stammkunde')
  check('Kasten "Herz" liegt auf dem Herz (mindestens 10 % rosa Pixel)', !!hz && hz.pink > 0.1, hz ? `${(hz.pink * 100).toFixed(0)} %` : 'fehlt')
  // Figur und Herz genauer: Bild mit und ohne sie rechnen; alles, was sich aendert, muss im Kasten liegen
  for (const [what, key] of [['Stammkunde', 'walker'], ['Herz', 'heart']]) {
    const it = by(what), d = await a.evaluate(k => document.querySelector('canvas.is-canvas').isoDebug.drawnBox(k), key), tol = 4
    const inside = !!it && !!d && d.pixels > 200 && d.left >= it.left - tol && d.right <= it.right + tol && d.top >= it.top - tol && d.bottom <= it.bottom + tol
    check(`Kasten "${what}" umfasst alles, was davon gezeichnet wird`, inside, it && d ? `gezeichnet x ${d.left} bis ${d.right}, y ${d.top} bis ${d.bottom} (${d.pixels} Pixel); Kasten x ${Math.round(it.left)} bis ${Math.round(it.right)}, y ${Math.round(it.top)} bis ${Math.round(it.bottom)}` : 'fehlt')
  }
  // Ruhelage: dort messen Sperrzonen und Textabstand
  const r = await studio.page({ rest: true }), m = await r.evaluate(() => window.STUDIO.measure()); await r.close()
  const restSafe = m.safe.filter(sf => isMain(sf.what))
  check('Ruhelage: Schilder und Herz zählen für Sperrzonen und Textabstand (data-safe)', restSafe.length === 3, restSafe.map(sf => `${sf.what} y ${sf.top} bis ${sf.bottom}`).join(', '))
  check(`Ruhelage: Schilder und Herz liegen zwischen y ${SAFE_TOP} und ${SAFE_BOTTOM}`, restSafe.length === 3 && restSafe.every(sf => sf.top >= SAFE_TOP && sf.bottom <= SAFE_BOTTOM))
  // Bewegungsprobe wie in make.mjs: in der Knopfspalte darf nichts liegen, aber die Probe muss die Kaesten sehen
  const st1 = await studio.state(a), all = await sampleMotion(a, st1.duration), col = await sampleMotion(a, st1.duration, { band: COL })
  check('Bewegungsprobe sieht die Kästen (sonst prüft "knopfspalte" in 3D nichts)', ['Schild Döner Palast', 'Schild Imbiss Sonne', 'Herz', 'Stammkunde'].every(w => all.some(x => x.what === w)))
  check(`Knopfspalte frei: nichts reicht bei y ${COL.top} bis ${COL.bottom} über x = ${COL.left}`, col.length === 0, col.map(x => `${x.what} bis x = ${x.right}`).join(', '))
  // Schlussbild ("after"): nach "enter" wird der verlassene Laden dunkler. Vorher stand das Bild still.
  await seek(a, st1.duration - 0.05)
  const endOur = (await boxStats(a)).find(it => it.what === 'Schild Döner Palast'), startOur = by('Schild Döner Palast')
  check('Schlussbild: das Schild des verlassenen Ladens ist am Ende deutlich dunkler', !!endOur && !!startOur && endOur.bright < startOur.bright * 0.5, endOur && startOur ? `helle Pixel ${(startOur.bright * 100).toFixed(0)} % bei ${T} s, ${(endOur.bright * 100).toFixed(0)} % am Ende` : 'fehlt')
  // Kurze Namen bleiben einzeilig: so sah der Betreiber die Probe, und so bleibt sie
  const shortSigns = await a.evaluate(() => document.querySelector('canvas.is-canvas').isoDebug.signs)
  check('Kurze Namen ("Döner Palast", "Imbiss Sonne") stehen in einer Zeile wie in der Probe', !!shortSigns && shortSigns.length === 2 && shortSigns.every(s => s.lines === 1 && s.size >= 0.42), JSON.stringify(shortSigns))
} finally { await studio.close() }

// ---- 8. Lange Namen: zwei Zeilen statt winziger Schrift
// Im Doener-Video heissen die Laeden "Döner Nordwind" und "Döner Südwind" (wie in allen 2D-Szenen). In einer
// Zeile standen sie auf 0,38 und 0,41 der Schildhoehe, unter der Grenze 0,42, und make.mjs warnte "sehr klein"
// (17.11.2026). Jetzt: vorn klein, das letzte Wort gross, keine Warnung, und die Kaesten liegen weiter auf den
// Schildern (deren Form hat sich nicht geaendert, nur die Schrift darauf).
{
  const sc = JSON.parse(JSON.stringify(script)); Object.assign(sc.scenes[0].params, { shop: 'Döner Nordwind', rival: 'Döner Südwind' })
  const st = await openStudio({ script: sc, times: estimateTimes(normalize(sc)) })
  try {
    const pg = await st.page(), s0 = await st.state(pg)
    const small = s0.warnings.filter(w => /sehr klein/.test(w))
    check('Lange Namen: Seite baut ohne Fehler und ohne Warnung "sehr klein"', !s0.errors.length && !st.problems.length && !small.length, [...s0.errors, ...st.problems, ...small].join(' | ').slice(0, 200))
    await seek(pg, 1.4)
    const signs = await pg.evaluate(() => document.querySelector('canvas.is-canvas').isoDebug.signs)
    check('Lange Namen stehen in zwei Zeilen, das letzte Wort mindestens 0,5 der Schildhöhe', !!signs && signs.length === 2 && signs.every(s => s.lines === 2 && s.size >= 0.5 && s.fits), JSON.stringify(signs))
    const boxes = (await boxStats(pg)).filter(it => it.what.startsWith('Schild '))
    check('Lange Namen: Kästen liegen auf beiden Schildern (mindestens 25 % helle Pixel)', boxes.length === 2 && boxes.every(it => it.bright > 0.25), boxes.map(it => `${it.what} ${(it.bright * 100).toFixed(0)} %`).join(', '))
  } finally { await st.close() }
}

// ---- 9. Abblenden beim Szenenwechsel
// Folgt eine Szene, dunkelt die Stadt ab 0,06 s vor dem Wechsel ab: sonst stand im Doener-Video die halb
// durchsichtige Wochenleiste rund 0,25 s lang ueber der hellen Stadt (17.11.2026). Als letzte Szene (Teil 5
// oben, Schlussbild) bleibt sie hell. Gemessen an .is-dim, ohne Bilder zu rechnen.
{
  const sc = JSON.parse(JSON.stringify(script))
  sc.scenes.push({ component: 'big-number', params: { value: '832 €', label: 'Umsatz im Jahr' }, captions: [{ lines: ['Das sind 832 Euro.'] }] })
  const st = await openStudio({ script: sc, times: estimateTimes(normalize(sc)) })
  try {
    const pg = await st.page(), s0 = await st.state(pg)
    const e = s0.scenes ? s0.scenes[0].e : null
    const dimAt = t => pg.evaluate(t => { window.seek(t, { paint: false }); return +getComputedStyle(document.querySelector('.is-dim')).opacity }, t)
    const before = e != null ? await dimAt(e - 0.3) : null, after = e != null ? await dimAt(e + 0.2) : null
    check('Szenenwechsel: vorher nicht abgedunkelt, 0,2 s nach dem Wechsel mindestens 0,7', !s0.errors.length && e != null && before === 0 && after >= 0.7, `Szenenende ${e}, Deckkraft ${before} / ${after}`)
    const r = await st.page({ rest: true }); const restDim = await r.evaluate(() => +getComputedStyle(document.querySelector('.is-dim')).opacity); await r.close()
    check('Ruhelage (Prüfungen): nicht abgedunkelt', restDim === 0, String(restDim))
  } finally { await st.close() }
}

// ---- 11. Zwei 3D-Teile in einer Szene (seit 18.11.2026, "3D zuerst")
// Ein 3D-Teil rechnet nur noch, solange SEIN Teil zu sehen sein kann, nicht mehr die ganze Szene lang. Vorher
// kosteten zwei 3D-Teile einer Szene doppelt, und ein Video fast ganz in 3D kam nicht auf die 12 Bildwechsel
// von Stil C (eine 2D-Kamera gibt es an 3D-Teilen nicht). Gemessen an den Pixeln der Leinwand von Teil 1: die
// Kamera fliegt (push, orbit), also aendert sich jedes gerechnete Bild. Mitten in Teil 2 (mehr als 0,8 s nach
// dem Schnitt) bleibt die Leinwand von Teil 1 stehen, die von Teil 2 bewegt sich; in Teil 1 umgekehrt.
{
  const sc = JSON.parse(JSON.stringify(script)), p = sc.scenes[0]
  sc.scenes[0] = { parts: [
    { component: 'iso-street', params: { ...p.params, push: 0.2, orbit: 12, heart: false, walker: false }, captions: [{ lines: ['Zwei Läden,', 'eine Kreuzung.'], instant: true }, { lines: ['Und noch ein Satz.'] }] },
    { component: 'iso-street', enter: 'cut', params: { ...p.params, ours: 'right', push: 0.2, orbit: 12, heart: false, walker: false }, captions: [{ lines: ['Jetzt von der anderen Seite,'] }, { lines: ['mit einem langen zweiten Satz dazu.'] }] }
  ] }
  const st = await openStudio({ script: sc, times: estimateTimes(normalize(sc)) })
  try {
    const pg = await st.page(), s0 = await st.state(pg)
    const cut = s0.pictures ? (s0.pictures.find(x => x.kind === 'teil') || {}).t : null
    const hashes = pg2 => pg2.evaluate(() => [...document.querySelectorAll('canvas.is-canvas')].map(c => {
      const g = document.createElement('canvas'); g.width = c.width; g.height = c.height
      const x = g.getContext('2d', { willReadFrequently: true }); x.drawImage(c, 0, 0)
      const d = x.getImageData(0, 0, c.width, c.height).data; let h = 0x811c9dc5
      for (let i = 0; i < d.length; i += 7) { h ^= d[i]; h = Math.imul(h, 0x01000193) >>> 0 }
      return h.toString(16)
    }))
    const at = async t => { await seek(pg, t); return hashes(pg) }
    if (s0.errors.length || st.problems.length || cut == null) check('Zwei 3D-Teile: Seite baut', false, [...s0.errors, ...st.problems].join(' | ').slice(0, 200) || 'kein Schnitt in state.pictures')
    else {
      const a1 = await at(0.4), a2 = await at(0.9), b1 = await at(cut + 1.0), b2 = await at(cut + 1.6)
      check('Zwei 3D-Teile in einer Szene: in Teil 1 rechnet nur Teil 1, mitten in Teil 2 nur Teil 2',
        a1.length === 2 && a1[0] !== a2[0] && b1[0] === b2[0] && b1[1] !== b2[1] && a1[1] === a2[1],
        `Schnitt bei ${cut} s; Teil 1: ${a1[0]}/${a2[0]} dann ${b1[0]}/${b2[0]}; Teil 2: ${a1[1]}/${a2[1]} dann ${b1[1]}/${b2[1]}`)
    }
  } finally { await st.close() }
}

// ---- 6. und 7. Bildausschnitt an den Grenzen der Parameter, und die Tuer
const limits = [
  { ours: 'left', push: 0, orbit: 0 }, { ours: 'left', push: 0.25, orbit: 12 },
  { ours: 'right', push: 0, orbit: 12 }, { ours: 'right', push: 0.25, orbit: 0 }
]
for (const lim of limits) {
  // after: false, damit das eigene Schild am Ende nicht abgedunkelt ist (das prueft schon Teil 5)
  const sc = JSON.parse(JSON.stringify(script)); Object.assign(sc.scenes[0].params, lim, { after: false })
  const tm = estimateTimes(normalize(sc)), st = await openStudio({ script: sc, times: tm })
  const tag = `ours ${lim.ours}, push ${lim.push}, orbit ${lim.orbit}`
  try {
    const pg = await st.page(), s0 = await st.state(pg)
    if (s0.errors.length || st.problems.length) { check(`${tag}: Seite baut`, false, [...s0.errors, ...st.problems].join(' | ').slice(0, 200)); continue }
    const seen = await sweep(pg, s0.duration, 0.1), bad = []
    for (const [w, o] of Object.entries(seen)) {
      if (!isMain(w)) continue
      if (o.left < MARGIN) bad.push(`${w} links bis x = ${o.left} (${o.at.left} s)`)
      if (o.right > 1080 - MARGIN) bad.push(`${w} rechts bis x = ${o.right} (${o.at.right} s)`)
      if (o.top < SAFE_TOP || o.bottom > SAFE_BOTTOM) bad.push(`${w} y ${o.top} bis ${o.bottom}`)
      if (o.bandRight > 940) bad.push(`${w} in der Knopfspalte bis x = ${o.bandRight} (${o.at.band} s)`)
    }
    const got = Object.keys(seen).filter(isMain).length
    check(`${tag}: Schilder und Herz die ganze Szene ${MARGIN} px vom Rand, rechts vor x = 940`, got === 3 && !bad.length, bad.join('; ') || Object.entries(seen).filter(([w]) => isMain(w)).map(([w, o]) => `${w} ${o.left}..${o.right}`).join(', '))
    // Letztes Bild wirklich rechnen: liegen die Kaesten dort noch auf den Schildern?
    await seek(pg, s0.duration - 0.05)
    const last = (await boxStats(pg)).filter(it => it.what.startsWith('Schild '))
    check(`${tag}: letztes Bild, Kästen liegen auf beiden Schildern`, last.length === 2 && last.every(it => it.bright > 0.25), last.map(it => `${it.what} ${(it.bright * 100).toFixed(0)} % hell`).join(', '))
    // Tuer: Abstand zwischen Figur und Tuerblaettern in 0,05-s-Schritten um "walk" und "enter"
    const anchors = s0.anchors.filter(x => x.scene === 1 || x.scene == null), at = n => (anchors.find(x => x.name === n) || {}).t
    const tW = at('walk'), tE = at('enter')
    const gaps = await pg.evaluate(({ ranges }) => {
      const c = document.querySelector('canvas.is-canvas'), out = []
      for (const [t0, t1] of ranges) for (let t = t0; t <= t1 + 1e-6; t = +(t + 0.05).toFixed(3)) { window.seek(t, { paint: false }); const g = c.isoDebug.doorGap(); if (g != null) out.push([t, g]) }
      return out
    }, { ranges: [[Math.max(0, tW - 0.5), tW + 1.6], [tE - 1.6, tE + 0.6]] })
    const worst = gaps.reduce((mn, x) => x[1] < mn[1] ? x : mn, [null, Infinity])
    check(`${tag}: Stammkunde berührt kein Türblatt (Abstand bei "walk" und "enter" in 0,05-s-Schritten über 3 cm)`, gaps.length > 20 && worst[1] > 0.03, `${gaps.length} Bilder, knappster Abstand ${worst[1]} m bei ${worst[0]} s`)
  } finally { await st.close() }
}
// ---- 10. Der Baukasten selbst (engine/kit3d.js)
// a) In Node importierbar und die reinen Funktionen fest: Katalog und Selbsttest laden Bausteine in Node, und
//    ein Baustein, der kit3d.js oben importierte, haette sonst three.js (700 KB, braucht eine Seite) mitgezogen.
//    rng muss in jedem Lauf dieselbe Folge geben, sonst steht die Stadt in jedem Video anders.
{
  const K = await import('../engine/kit3d.js')
  const R = K.rng(20261117), seq = [R(), R(), R()].map(x => x.toFixed(6)).join(' ')
  const R2 = K.rng(20261117), same = [R2(), R2(), R2()].map(x => x.toFixed(6)).join(' ') === seq
  const w1 = K.walkCycle(2.2, true), w2 = K.walkCycle(2.2, true), still = K.walkCycle(2.2, false)
  check('Baukasten: in Node importierbar, rng fest, walkCycle rein, splitName teilt das letzte Wort ab',
    typeof K.createKit === 'function' && same && seq === '0.876016 0.086642 0.997853' && JSON.stringify(w1) === JSON.stringify(w2) && still.legL === 0 && still.bob === 0 &&
    JSON.stringify(K.splitName('Döner Nordwind')) === '["Döner","Nordwind"]' && K.splitName('Palast') === null, `rng ${seq}`)
}
// b) Geteilter Renderer: 20 Szenen auf einer Seite. Chromium haelt je Seite hoechstens 16 WebGL-Kontexte und
//    nimmt beim 17. dem aeltesten sein Bild (gemessen 17.11.2026: von 24 waren die ersten 8 verloren). Mit
//    einem Renderer je Szene waeren hier die ersten vier schwarz. Jede Szene zeigt eine eigene Farbe; danach
//    wird Szene 1 noch einmal gerechnet und muss Pixel fuer Pixel gleich sein (kein Zustand von den anderen).
// c) fitFrame: der berechnete Ausschnitt haelt Punkte ueber die ganze Fahrt (push 0,25, orbit 12) im Rahmen
//    und fuellt ihn (Breite oder Hoehe zu mindestens 97 % genutzt), sonst ist das 9:16-Bild halb leer.
{
  const sc = { meta: { title: 'test kit', slug: 'test-kit' }, scenes: [{ component: 'big-number', params: { value: '3', label: 'Probe' }, captions: [{ lines: ['Drei.'] }] }] }
  const st = await openStudio({ script: sc, times: estimateTimes(normalize(sc)) })
  const msgs = []
  try {
    const pg = await st.page()
    pg.on('console', m => msgs.push(m.text()))
    // Ein verlorener Kontext laesst three.js beim Rechnen werfen: das soll als gescheiterte Pruefung erscheinen
    const r = await pg.evaluate(async () => {
      const K = await import('/engine/kit3d.js')
      const placers = [], drawers = []
      const fake = i => {
        const root = document.createElement('div'); root.style.cssText = 'position:absolute;left:0;top:0;width:1080px;height:1920px'; document.body.append(root)
        return { root, el: (tag, cls) => { const e = document.createElement(tag); if (cls) e.className = cls; return e }, fail: m => { throw new Error(m) }, warn: () => {}, place: f => placers.push(f), frame: f => drawers.push(f), s: 0, e: 2, sceneStart: 0, sceneEnd: 2, rest: false, isLast: true, i }
      }
      const kits = []
      for (let i = 0; i < 20; i++) {
        const kit = await K.createKit(fake(i), { calm: false, vignette: false, dim: false })
        const { THREE } = kit
        // Flaeche quer zur Kamera, eigene Farbe, ohne Tonwertkurve: in der Bildmitte steht genau diese Farbe
        const m = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshBasicMaterial({ color: new THREE.Color(`hsl(${i * 18}, 80%, 50%)`), toneMapped: false, side: THREE.DoubleSide }))
        const cam = kit.isoCamera({ frame: { dist: 100, dx: 0, dy: 0 } }); cam.set(1, { push: 0, orbit: 0 })
        m.lookAt(cam.camera.position); kit.scene.add(m)
        kit.run(t => { cam.set(t, {}); kit.sync() })
        kits.push(kit)
      }
      const center = c => { const g = document.createElement('canvas'); g.width = 8; g.height = 8; const x = g.getContext('2d'); x.drawImage(c, 536, 956, 8, 8, 0, 0, 8, 8); return Array.from(x.getImageData(4, 4, 1, 1).data.slice(0, 3)) }
      const full = c => { const g = document.createElement('canvas'); g.width = c.width; g.height = c.height; const x = g.getContext('2d'); x.drawImage(c, 0, 0); const d = x.getImageData(0, 0, c.width, c.height).data; let h = 0x811c9dc5; for (let i = 0; i < d.length; i += 7) { h ^= d[i]; h = Math.imul(h, 0x01000193) >>> 0 } return h }
      for (const f of placers) f(1); for (const f of drawers) f(1)
      const colors = kits.map(k => center(k.canvas)), first = full(kits[0].canvas)
      kits[0].render(); const again = full(kits[0].canvas)
      // fitFrame an drei Laeden-grossen Kisten, mit Fahrt und Drehung
      const kit = kits[0], { THREE } = kit, pts = []
      for (const [x, z] of [[-9, -3], [3, 8], [6, -6]]) for (const dx of [-2.5, 2.5]) for (const y of [0, 9]) for (const dz of [-2.5, 2.5]) pts.push(new THREE.Vector3(x + dx, y, z + dz))
      const o = { push: 0.25, orbit: 12, az: 45, el: 34, elDrop: 1.5, aim: kit.aimAcross(pts, 3) }
      const fr = kit.fitFrame(pts, o), cam = kit.isoCamera({ frame: fr }), F = K.FIT
      let worst = 0, x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9
      for (let t = 0; t <= 2.0001; t += 0.05) {
        cam.set(t, o); cam.camera.updateMatrixWorld()
        const [a, b, c, d] = kit.project(pts)
        worst = Math.max(worst, F.left - a, c - F.right, F.top - b, d - F.bottom)
        if (t > 1.999) { x0 = a; x1 = c; y0 = b; y1 = d }
      }
      const use = Math.max((x1 - x0) / (F.right - F.left), (y1 - y0) / (F.bottom - F.top))
      return { colors, same: first === again, frame: fr, worst, use }
    }).catch(e => ({ error: e.message.split('\n')[0], colors: [], same: false, frame: null, worst: Infinity, use: 0 }))
    const distinct = new Set(r.colors.map(c => c.join(','))).size, dark = r.colors.filter(c => c[0] + c[1] + c[2] < 60).length
    const lost = msgs.filter(m => /Too many active WebGL|Kontext verloren/.test(m))
    check('Geteilter Renderer: 20 Szenen auf einer Seite, keine verliert ihr Bild (Chromium hält nur 16 WebGL-Kontexte)', !r.error && distinct === 20 && dark === 0 && !lost.length, r.error || `${distinct} verschiedene Farben, ${dark} dunkel${lost.length ? ', ' + lost[0] : ''}`)
    check('Geteilter Renderer: Szene 1 nach den anderen neu gerechnet, Pixel für Pixel gleich', r.same)
    check('fitFrame: Punkte über die ganze Fahrt (push 0,25, orbit 12) im Rahmen, Rahmen zu mindestens 97 % genutzt', r.worst <= 0.5 && r.use >= 0.97, `Ausschnitt ${JSON.stringify(r.frame)}, schlimmster Überstand ${r.worst.toFixed(2)} px, genutzt ${(r.use * 100).toFixed(1)} %`)
  } finally { await st.close() }
}

console.log(failed ? `${failed} Prüfung(en) gescheitert` : 'Alle Prüfungen bestanden')
process.exit(failed ? 1 : 0)
