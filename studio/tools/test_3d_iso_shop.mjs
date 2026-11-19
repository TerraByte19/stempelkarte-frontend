#!/usr/bin/env node
// test_3d_iso_shop.mjs - prueft den 3D-Baustein iso-shop (Laden von innen: Theke, Inhaber, Kunde, Scan,
// Stempel, Papierkarte) auf dem Weg ctx.frame -> seek(t) -> WebGL.
//
//   node studio/tools/test_3d_iso_shop.mjs
//
// Was festgenagelt wird und warum:
//  1. Gleiches Bild, gleiche Pixel: Bild t, dann andere Zeiten (auch rueckwaerts), dann wieder t ergibt Pixel
//     fuer Pixel dasselbe, auch auf einer ZWEITEN Seite. renderVideo verteilt die Bilder auf mehrere Seiten;
//     haengt ein Bild von dem davor ab (Zufall, Uhr, Zustand, der sich ansammelt), flackert das Video. Hier
//     besonders: die Papierkarte knuellt sich durch Umrechnen ihrer Punkte, die Handys haengen an den Armen,
//     die Kamera faehrt zwischen zwei Ausschnitten. Alles muss allein aus t folgen.
//  2. Die Szene ist nicht leer: Raum und Stadt fuellen das Bild, Schild und Fenster leuchten. Faellt WebGL aus
//     oder zeichnet die Szene nichts, sieht man nur Nachthimmel, und keine andere Pruefung merkt es.
//  3. seek(t, { paint: false }) zeichnet nicht (die Bewegungsprobe in render.mjs ruft seek alle 0,25 s).
//  4. Sekunden je Bild werden gemessen (Warnung ab 3 s, Fehler ab 8 s).
//  5. Die Anker wirken, und zwar zur richtigen Zeit: im ersten Bild ist die Tuer zu und der Kunde draussen
//     (in der ersten Probe stand er im ersten Bild schon in der offenen Tuer, die Glocke wie ein Hut auf dem
//     Kopf), auf "enter" in der Tuer (Tuer offen, Ton ding), Sprechblase auf "order", Papierkarte flach vor und
//     Kugel nach "crumple", danach im Papierkorb, Scan-Linie und Scanner auf "scan", Haken danach, auf "stamp"
//     der Stempel und ein Stempel mehr im Handy, Nahaufnahme ab "zoom", "leave" geht er hinaus. Dazu die Toene.
//  6. Pruefkaesten: Schild, Tafel, Inhaber, Kunde, Blase, Handys, Stempel bekommen unsichtbare Kaesten
//     (data-safe), damit Sperrzonen, Knopfspalte und Textabstand in die Leinwand sehen. Geprueft wird, dass
//     sie da sind, auf dem Gezeichneten liegen (Bild mit und ohne das Ding) und dass in der Nahaufnahme nur
//     noch Handys, Haken und Stempel zaehlen (Schild und Figuren sind dann angeschnitten). In der ersten Probe
//     reichte der Kasten des Kunden in der Nahaufnahme bis x = 1287 und "knopfspalte" schlug an.
//  7. Ausschnitt: ueber die ganze Szene bleiben alle Kaesten in den Sperrzonen-Grenzen und vor der Knopfspalte.
//  8. Die Tuer: in 0,05-s-Schritten um "enter" und "leave" beruehrt der Kunde das Tuerblatt nicht (in der
//     ersten Fassung ragte das offene Blatt 0,5 m an seinen Weg heran).
//  9. Alle fuenf Branchen bauen auf EINER Seite (geteilter Renderer), ohne Fehler und Warnung, und jede zeigt
//     ein eigenes, nicht leeres Bild. Ein langer Name steht in zwei Zeilen ohne Warnung "sehr klein".
// 10. Falsche Angaben brechen mit einer verstaendlichen Meldung ab (Branche, close ohne Handy), und Anker, die
//     ein Bild verderben, geben eine Warnung ("enter" zu frueh: Tuer im ersten Bild offen; "zoom" weniger als
//     1 s nach "order": Sprechblase steht keine Sekunde).
// 11. Der QR-Code bleibt frei: Bild mit und ohne Arm des Kunden, mindestens 95 % der Pixel im Code gleich (beim
//     Scan und im Schlussbild). In der ersten Fassung hielt die Hand das Handy in der Mitte, also auf dem Code;
//     Unterarm und Hand deckten rund ein Drittel davon zu, die Scan-Linie lief darunter (Abnahme 18.11.2026).
// 12. Die Bestellung ist zu sehen: die Sprechblase steht mindestens 1 s, davon mindestens 0,8 s in voller
//     Groesse, und ist in der ganzen Ansicht mindestens 150 px breit. Vorher: 0,3 s bei 84 px, am Handy ein
//     weisser Fleck.
// 13. Das Knuellen ist zu sehen: die Papierkarte mit und ohne Kunde gezeichnet gibt fast dieselben Pixel (er
//     steht nicht davor), flach mindestens 120 px, als Kugel mindestens 40 px breit. Vorher stand sein Kopf
//     genau beim Knuellen vor der Karte, die Kugel war 32 px gross.
// 14. Voller und leerer Laden (Nachbau "zwei Cafés", 19.11.2026): mit "guests" sitzen Gaeste im Bild (das
//     Bild ist ein anderes als ohne), mit "start": "none" ist kein Kunde da, mit "dim" ist der Raum deutlich
//     dunkler. Vorher sahen Mond (voll) und Sonne (leer) innen gleich aus, und bei Sonne stand sogar ein Gast.
//     Dazu das Knuellen in der Nahaufnahme "counter": Karte, Flug und Papierkorb bleiben ganz im Bild (in der
//     ganzen Ansicht war die Karte am Handy 3 mm gross, die Kugel 25 px; in der Nahaufnahme rund 250 px).
//
// Kein Netz, keine Kosten, etwa zwei Minuten (rechnet rund 30 Bilder).
import { createHash } from 'node:crypto'
import { normalize, estimateTimes, STAGE } from '../engine/script.mjs'
import { openStudio, seek, sampleMotion } from '../engine/render.mjs'

let failed = 0
const check = (label, ok, info = '') => { console.log(`${ok ? 'ok    ' : 'FEHLER'} ${label}${info ? ' - ' + info : ''}`); if (!ok) failed++ }
const COL = STAGE.column, SAFE_TOP = STAGE.safeTop, SAFE_BOTTOM = STAGE.h - STAGE.safeBottom

// Alles in einer Szene: Kunde kommt herein, Papier knuellt sich, Bestellung, Kamera faehrt an die Handys,
// Scan, Stempel. Anker fest in Sekunden, damit der Test nicht an der Schaetzung der Wortzeiten haengt.
const caps = [{ lines: ['Kommt rein,'], instant: true }, { lines: ['*Papier? | Weg damit.'] }, { lines: ['Handy | *scannen,'] }, { lines: ['*Stempel | drauf.'] }]
// Zeiten wie in der Probe videos/_probe-iso-shop; das Schlussbild steht laenger, damit der Stempel am Ende
// wieder weg ist
const script = {
  meta: { title: 'test iso-shop', slug: 'test-iso-shop' }, timing: { lead: 0.3, hold: 1.8 }, captionStyle: { mode: 'wort' },
  scenes: [{
    component: 'iso-shop',
    params: { branch: 'cafe', shop: 'Café Mond', icon: 'cup', start: 'door', paper: true, phone: true, bubble: true, stamps: 6, have: 3, close: 'phone' },
    anchors: { enter: { at: 'start', offset: 1.0 }, crumple: { at: 'start', offset: 1.87 }, order: { at: 'start', offset: 2.5 }, zoom: { at: 'start', offset: 3.5 }, scan: { at: 'start', offset: 4.11 }, stamp: { at: 'start', offset: 4.82 } },
    captions: caps
  }]
}
const A = { enter: 1.0, crumple: 1.87, order: 2.5, zoom: 3.5, scan: 4.11, stamp: 4.82 }

// Pixel der 3D-Leinwand (ohne Textzeilen und Verlaeufe): Fingerabdruck und Anteile
const canvasStats = (pg, i = 0) => pg.evaluate(i => {
  const c = document.querySelectorAll('canvas.ish-canvas')[i]
  if (!c) return null
  const g = document.createElement('canvas'); g.width = c.width; g.height = c.height
  const x = g.getContext('2d', { willReadFrequently: true }); x.drawImage(c, 0, 0)
  const d = x.getImageData(0, 0, c.width, c.height).data
  let h = 0x811c9dc5
  for (let k = 0; k < d.length; k++) { h ^= d[k]; h = Math.imul(h, 0x01000193) >>> 0 }
  let notSky = 0, bright = 0, warm = 0, n = 0
  for (let k = 0; k < d.length; k += 16) {
    const r = d[k], gg = d[k + 1], b = d[k + 2]; n++
    if (Math.abs(r - 14) + Math.abs(gg - 10) + Math.abs(b - 36) > 18) notSky++
    if (r + gg + b > 600) bright++
    if (r > 150 && r > b + 40 && gg > 70) warm++
  }
  return { hash: h.toString(16), w: c.width, notSky: notSky / n, bright: bright / n, warm: warm / n }
}, i)
// Was in jedem Pruefkasten auf der Leinwand liegt: Anteil heller, weisser und lila (Ladenfarbe) Pixel
const boxStats = pg => pg.evaluate(() => {
  const c = document.querySelector('canvas.ish-canvas'), g = document.createElement('canvas'); g.width = c.width; g.height = c.height
  const x = g.getContext('2d', { willReadFrequently: true }); x.drawImage(c, 0, 0)
  return window.STUDIO.probe().map(it => {
    const x0 = Math.max(0, Math.round(it.left)), y0 = Math.max(0, Math.round(it.top)), w = Math.min(c.width, Math.round(it.right)) - x0, h = Math.min(c.height, Math.round(it.bottom)) - y0
    if (w < 2 || h < 2) return { ...it, bright: 0, lilac: 0 }
    const d = x.getImageData(x0, y0, w, h).data
    let bright = 0, lilac = 0
    for (let k = 0; k < d.length; k += 4) { const r = d[k], gg = d[k + 1], b = d[k + 2]; if (r + gg + b > 600) bright++; if (b > 190 && r > 80 && r < 170 && gg > 70 && gg < 150) lilac++ }
    return { ...it, bright: bright / (w * h), lilac: lilac / (w * h) }
  })
})
const live = (pg, t) => pg.evaluate(t => { window.seek(t, { paint: false }); return document.querySelector('canvas.ish-canvas').isoShop.live() }, t)
const sha = b => createHash('sha256').update(b).digest('hex')

const studio = await openStudio({ script, times: estimateTimes(normalize(script)) })
try {
  const t0 = Date.now(), a = await studio.page(), st = await studio.state(a), buildSeconds = (Date.now() - t0) / 1000
  check('Seite baut ohne Fehler und Warnung', !st.errors.length && !studio.problems.length && !st.warnings.length, [...st.errors, ...studio.problems, ...st.warnings].join(' | ').slice(0, 300) || `${buildSeconds.toFixed(1)} s`)

  // ---- 1. bis 4.: gleiche Pixel, nicht leer, paint: false, Rechenzeit
  const T = 2.7
  await seek(a, T); const s1 = await canvasStats(a), shot1 = await a.screenshot()
  check('Leinwand vorhanden (WebGL läuft)', !!s1 && s1.w === 1080, s1 ? `${s1.w} px breit` : 'keine canvas.ish-canvas')
  if (s1) {
    check('Szene nicht leer: mindestens 70 % des Bildes sind nicht Nachthimmel', s1.notSky > 0.7, `${(s1.notSky * 100).toFixed(1)} %`)
    check('Licht zu sehen (Schild, Tafel, Fenster): mindestens 0,5 % helle Pixel', s1.bright > 0.005, `${(s1.bright * 100).toFixed(2)} %`)
    check('Warmes Licht zu sehen (Lichtflecken, Holz, Lampen): mindestens 2 % warme Pixel', s1.warm > 0.02, `${(s1.warm * 100).toFixed(1)} %`)
  }
  const per = []
  for (const t of [4.8, 0.4, 2.1, 3.9]) { const q = Date.now(); await seek(a, t); await a.screenshot({ type: 'jpeg', quality: 95 }); per.push((Date.now() - q) / 1000) }
  const s3 = await canvasStats(a)
  await seek(a, T); const s2 = await canvasStats(a), shot2 = await a.screenshot()
  check(`Gleiches Bild (t = ${T} s) nach Sprüngen gleich: Leinwand Pixel für Pixel`, !!s1 && !!s2 && s1.hash === s2.hash, `${s1 && s1.hash} / ${s2 && s2.hash}`)
  check('Gleiches Bild nach Sprüngen gleich: ganzer Bildschirm (mit Textzeilen)', sha(shot1) === sha(shot2))
  check('Andere Zeit, anderes Bild (die Szene bewegt sich)', !!s3 && s3.hash !== s1.hash)
  // Nach dem Knuellen und in der Nahaufnahme: auch dort muss der Rueckweg dasselbe Bild geben
  await seek(a, 5.2); const c1 = await canvasStats(a); await seek(a, 1.0); await seek(a, 5.2); const c2 = await canvasStats(a)
  check('Nahaufnahme nach dem Stempel (t = 5,2 s) nach einem Sprung zurück gleich (Papierkugel, Handys, Kamera)', !!c1 && !!c2 && c1.hash === c2.hash)
  await seek(a, 2.2); const k1 = await canvasStats(a); await seek(a, 4.5); await seek(a, 2.2); const k2 = await canvasStats(a)
  check('Mitten im Knüllen (t = 2,2 s) nach einem Sprung zurück gleich', !!k1 && !!k2 && k1.hash === k2.hash)
  const b = await studio.page()
  await seek(b, T); const sb = await canvasStats(b), shotB = await b.screenshot()
  check('Gleiches Bild auf einer zweiten Seite gleich (renderVideo rechnet auf mehreren)', !!sb && sb.hash === s1.hash && sha(shotB) === sha(shot1), sb && sb.hash)
  await seek(b, 5.2); const sb5 = await canvasStats(b)
  check('Nahaufnahme auf der zweiten Seite gleich', !!sb5 && !!c1 && sb5.hash === c1.hash)
  await b.evaluate(() => window.seek(3.9, { paint: false })); const sp = await canvasStats(b)
  check('seek(t, { paint: false }) zeichnet nicht (Bewegungsprobe bleibt schnell)', !!sp && sp.hash === sb5.hash)
  const spf = per.reduce((x, y) => x + y, 0) / per.length
  console.log(`Sekunden je Bild (rechnen + Foto, eine Seite): ${per.map(x => x.toFixed(2)).join(' / ')}, Mittel ${spf.toFixed(2)}; Seite gebaut in ${buildSeconds.toFixed(1)} s`)
  check('Rechenzeit unter 8 s je Bild', spf < 8, spf.toFixed(2) + ' s')
  if (spf > 3) console.log('WARNUNG: über 3 s je Bild, ein Video mit langer 3D-Szene dauert dann sehr lange')

  // ---- 5. Anker
  const L = {}
  const times = await a.evaluate(() => document.querySelector('canvas.ish-canvas').isoShop.times)
  for (const [k, t] of Object.entries({ before: 0.0, entered: A.enter + 0.15, walking: A.enter + 1.0, preCrumple: A.crumple - 0.05, crumpled: A.crumple + 0.52, binned: A.crumple + 1.15, bubble: A.order + 0.5, atCounter: A.scan - 0.8, wide: A.zoom - 0.05, scanning: A.scan + 0.3, checked: times.check + 0.06, preStamp: A.stamp - 0.05, stamped: A.stamp + 0.6, end: st.duration - 0.05 })) L[k] = await live(a, t)
  // Im ersten Bild ist die Tuer zu und der Kunde noch draussen hinter der Wand (zaehlt fuer keine Pruefung)
  const boxBefore = await a.evaluate(() => { window.seek(0, { paint: false }); return window.STUDIO.probe().map(x => x.what) })
  check('Erstes Bild: Tür zu, der Kunde draußen, ohne Prüfkasten', L.before.door === 0 && (!L.before.guest || L.before.guest[1] < 0) && !boxBefore.includes('Kunde'), `Tür ${L.before.door}, ${JSON.stringify(L.before.guest)}, Kästen ${boxBefore.join(', ')}`)
  check('Auf "enter" steht er in der Tür, die Tür ist offen', !!L.entered.guest && Math.abs(L.entered.guest[1]) < 0.9 && L.entered.door > 0.8, `Lage ${JSON.stringify(L.entered.guest)}, Tür ${L.entered.door}`)
  check('Danach geht er zur Theke (vorn herum), die Tür ist wieder zu, vor dem Heben des Handys steht er an der Theke', !!L.walking.guest && L.walking.guest[1] > 1 && L.walking.door === 0 && Math.abs(L.atCounter.guest[0] + 2.25) < 0.01 && Math.abs(L.atCounter.guest[1] - 3.5) < 0.01, `${JSON.stringify(L.walking.guest)} Tür ${L.walking.door}; vor dem Scan ${JSON.stringify(L.atCounter.guest)}`)
  check('Papierkarte flach vor "crumple", Kugel danach, nach 1,1 s im Papierkorb', L.preCrumple.crumple === 0 && L.crumpled.crumple === 1 && !L.crumpled.binned && L.binned.binned, `${L.preCrumple.crumple} / ${L.crumpled.crumple} / Korb ${L.crumpled.binned} ${L.binned.binned}`)
  check('Sprechblase auf "order"', !L.walking.bubble && L.bubble.bubble)
  check('Nahaufnahme erst ab "zoom", danach ganz nah', L.wide.zoom === 0 && L.stamped.zoom === 1, `${L.wide.zoom} / ${L.stamped.zoom}`)
  check('Auf "scan": Handy gehoben, Scanner darüber, Scan-Linie läuft, noch kein Haken', L.scanning.up === 1 && L.scanning.scannerUp === 1 && L.scanning.scanning && !L.scanning.ok, JSON.stringify(L.scanning))
  check('Nach dem Scan der Haken (Bildschirm des Inhabers und Haken über dem Handy)', L.checked.ok && L.checked.check, JSON.stringify(L.checked))
  check('Auf "stamp": vorher noch nicht, danach Stempel über dem Handy und ein Stempel mehr auf der Karte', !L.preStamp.after && !L.preStamp.stamp && L.stamped.after && L.stamped.stamp, `${JSON.stringify(L.preStamp)} / ${JSON.stringify(L.stamped)}`)
  check('Am Ende ist der Stempel wieder weg und die Karte zeigt ihn', !L.end.stamp && L.end.after)
  const cue = (name, t) => (st.cues || []).some(c => c.name === name && Math.abs(c.t - t) < 0.08)
  check('Töne: ding auf "enter", crumple, drop im Korb, pop auf "order", scan, ok, pop auf "stamp"', cue('ding', A.enter - 0.05) && cue('crumple', A.crumple) && cue('drop', A.crumple + 1.1) && cue('pop', A.order) && cue('scan', A.scan + 0.02) && cue('ok', times.check) && cue('pop', A.stamp), (st.cues || []).map(c => `${c.name}@${c.t}`).join(' '))

  // ---- 12. Bestellung: wie lange und wie gross die Sprechblase steht
  const bubS = await a.evaluate(([o, z]) => { const c = document.querySelector('canvas.ish-canvas'), out = []; for (let t = o; t <= z + 0.6; t = +(t + 0.05).toFixed(2)) { window.seek(t, { paint: false }); out.push(c.isoShop.live().bubbleScale) } return out }, [A.order, A.zoom])
  const shownS = bubS.filter(x => x > 0.01).length * 0.05, fullS = bubS.filter(x => x >= 0.9).length * 0.05
  check('Sprechblase steht mindestens 1 s, davon mindestens 0,8 s in voller Größe', shownS >= 1.0 - 1e-6 && fullS >= 0.8 - 1e-6, `${shownS.toFixed(2)} s zu sehen, ${fullS.toFixed(2)} s voll`)
  await seek(a, A.order + 0.6)
  const bubD = await a.evaluate(() => document.querySelector('canvas.ish-canvas').isoShop.drawnBox('bubble'))
  check('Sprechblase in der ganzen Ansicht mindestens 150 px breit (am Handy rund 55 pt)', !!bubD && bubD.right - bubD.left >= 150, bubD ? `${Math.round(bubD.right - bubD.left)} x ${Math.round(bubD.bottom - bubD.top)} px` : 'nicht gezeichnet')

  // ---- 13. Knuellen: nicht verdeckt, gross genug
  const paperPx = async t => { await seek(a, t); return a.evaluate(() => { const s = document.querySelector('canvas.ish-canvas').isoShop, w = s.drawnBox('paper'); s.hide('guest', true); const wo = s.drawnBox('paper'); s.hide('guest', false); return { w, wo } }) }
  for (const [label, t, minW] of [['flach', A.crumple - 0.05, 120], ['mitten im Knüllen', A.crumple + 0.25, 0], ['als Kugel', A.crumple + 0.52, 40], ['im Flug', A.crumple + 0.8, 40]]) {
    const r = await paperPx(t), wpx = r.w ? r.w.right - r.w.left : 0
    check(`Papierkarte ${label} (t = ${t.toFixed(2)} s) nicht vom Kunden verdeckt${minW ? ` und mindestens ${minW} px breit` : ''}`, !!r.w && !!r.wo && r.w.pixels >= 0.95 * r.wo.pixels && wpx >= minW, r.w && r.wo ? `${r.w.pixels} von ${r.wo.pixels} Pixeln zu sehen, ${Math.round(wpx)} px breit` : 'nicht gezeichnet')
  }

  // ---- 11. QR-Code frei vom Arm des Kunden (beim Scan und im Schlussbild)
  const qrFree = async t => {
    await seek(a, t)
    return a.evaluate(() => {
      const c = document.querySelector('canvas.ish-canvas'), s = c.isoShop, quad = s.qrQuad()
      const grab = () => { const g = document.createElement('canvas'); g.width = c.width; g.height = c.height; const x = g.getContext('2d', { willReadFrequently: true }); x.drawImage(c, 0, 0); return x.getImageData(0, 0, c.width, c.height).data }
      const inQuad = (x, y) => { let inside = false; for (let i = 0, j = 3; i < 4; j = i++) { const [xi, yi] = quad[i], [xj, yj] = quad[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside } return inside }
      const withArm = grab(); s.hide('arm', true); const without = grab(); s.hide('arm', false)
      const xs = quad.map(q => q[0]), ys = quad.map(q => q[1]); let n = 0, same = 0
      for (let y = Math.max(0, Math.floor(Math.min(...ys))); y < Math.min(c.height, Math.ceil(Math.max(...ys))); y++) for (let x = Math.max(0, Math.floor(Math.min(...xs))); x < Math.min(c.width, Math.ceil(Math.max(...xs))); x++) {
        if (!inQuad(x + 0.5, y + 0.5)) continue
        const i = (y * c.width + x) * 4; n++
        if (Math.abs(withArm[i] - without[i]) + Math.abs(withArm[i + 1] - without[i + 1]) + Math.abs(withArm[i + 2] - without[i + 2]) < 30) same++
      }
      return { n, same, quad: quad.map(q => q.map(Math.round)) }
    })
  }
  for (const [label, t] of [['beim Scan', A.scan + 0.3], ['im Schlussbild', st.duration - 0.05]]) {
    const r = await qrFree(t)
    check(`QR-Code ${label} frei: mit und ohne Arm des Kunden mindestens 95 % gleich`, r.n > 2000 && r.same / r.n >= 0.95, `${r.n} Pixel im Code, ${(100 * r.same / Math.max(1, r.n)).toFixed(1)} % gleich`)
  }

  // ---- 6. Pruefkaesten
  await seek(a, A.order + 0.4)
  const bx = await boxStats(a), by = w => bx.find(it => it.what === w)
  const wideBoxes = ['Schild Café Mond', 'Tafel', 'Inhaber', 'Kunde', 'Bestellung', 'Handy', 'Papierkarte']
  check('Ganze Ansicht: Kästen für Schild, Tafel, Inhaber, Kunde, Blase, Handy, Papierkarte', wideBoxes.every(by), bx.map(it => it.what).join(', '))
  const sign = by('Schild Café Mond'), menuB = by('Tafel'), bub = by('Bestellung')
  check('Kasten "Schild" liegt auf dem Schild (mindestens 25 % helle Pixel)', !!sign && sign.bright > 0.25, sign ? `${(sign.bright * 100).toFixed(0)} %` : 'fehlt')
  check('Kasten "Tafel" liegt auf der Tafel (helle Schrift darin, mindestens 3 %)', !!menuB && menuB.bright > 0.03, menuB ? `${(menuB.bright * 100).toFixed(1)} %` : 'fehlt')
  check('Kasten "Bestellung" liegt auf der Blase (mindestens 20 % helle Pixel)', !!bub && bub.bright > 0.2, bub ? `${(bub.bright * 100).toFixed(0)} %` : 'fehlt')
  const inside = async (what, key, page = a) => {
    const it = (await page.evaluate(() => window.STUDIO.probe())).find(x => x.what === what)
    const d = await page.evaluate(k => document.querySelector('canvas.ish-canvas').isoShop.drawnBox(k), key), tol = 4
    const ok = !!it && !!d && d.pixels > 150 && d.left >= it.left - tol && d.right <= it.right + tol && d.top >= it.top - tol && d.bottom <= it.bottom + tol
    check(`Kasten "${what}" umfasst alles, was davon gezeichnet wird`, ok, it && d ? `gezeichnet x ${d.left} bis ${d.right}, y ${d.top} bis ${d.bottom} (${d.pixels} Pixel); Kasten x ${Math.round(it.left)} bis ${Math.round(it.right)}, y ${Math.round(it.top)} bis ${Math.round(it.bottom)}` : `fehlt (${!!it} / ${JSON.stringify(d)})`)
  }
  await inside('Kunde', 'guest'); await inside('Inhaber', 'owner'); await inside('Bestellung', 'bubble'); await inside('Papierkarte', 'paper')
  await seek(a, A.stamp + 0.8)
  const bc = await boxStats(a), nearOnly = bc.map(it => it.what)
  check('Nahaufnahme: nur noch Handy, Handy Inhaber, Haken und Stempel zählen (Schild und Figuren sind angeschnitten)', nearOnly.length > 0 && nearOnly.every(w => ['Handy', 'Handy Inhaber', 'Haken', 'Stempel'].includes(w)) && nearOnly.includes('Stempel'), nearOnly.join(', '))
  const stB = bc.find(it => it.what === 'Stempel')
  check('Kasten "Stempel" liegt auf dem Stempel (mindestens 20 % Ladenfarbe darin)', !!stB && stB.lilac > 0.2, stB ? `${(stB.lilac * 100).toFixed(0)} %` : 'fehlt')
  await inside('Stempel', 'stamp'); await inside('Handy', 'phone')
  // Ruhelage: Sperrzonen und Textabstand messen dort
  const r = await studio.page({ rest: true }), m = await r.evaluate(() => window.STUDIO.measure()); await r.close()
  const restSafe = m.safe.filter(sf => ['Schild Café Mond', 'Tafel', 'Inhaber'].includes(sf.what))
  check(`Ruhelage: Schild, Tafel, Inhaber zählen (data-safe) und liegen zwischen y ${SAFE_TOP} und ${SAFE_BOTTOM}`, restSafe.length === 3 && restSafe.every(sf => sf.top >= SAFE_TOP && sf.bottom <= SAFE_BOTTOM), restSafe.map(sf => `${sf.what} y ${sf.top} bis ${sf.bottom}`).join(', '))
  const capBottom = Math.max(...m.caps.map(c => c.box.bottom)), topSafe = Math.min(...m.safe.map(sf => sf.top))
  check('Ruhelage: zwischen Textzeilen und Bild mindestens 40 px', capBottom + 40 <= topSafe, `Text bis ${capBottom}, Bild ab ${topSafe}`)

  // ---- 7. Ausschnitt und Knopfspalte ueber die ganze Szene
  const all = await sampleMotion(a, st.duration, { step: 0.1 }), col = await sampleMotion(a, st.duration, { step: 0.1, band: COL })
  check('Bewegungsprobe sieht die Kästen (sonst prüft "knopfspalte" in 3D nichts)', ['Schild Café Mond', 'Kunde', 'Stempel', 'Handy'].every(w => all.some(x => x.what === w)), all.map(x => x.what).join(', '))
  check(`Knopfspalte frei: nichts reicht bei y ${COL.top} bis ${COL.bottom} über x = ${COL.left}`, col.length === 0, col.map(x => `${x.what} bis x = ${x.right} (${x.from} bis ${x.to} s)`).join(', '))
  const out = all.filter(x => x.top < SAFE_TOP || x.bottom > SAFE_BOTTOM)
  check(`Alle Kästen die ganze Szene zwischen y ${SAFE_TOP} und ${SAFE_BOTTOM}`, out.length === 0, out.map(x => `${x.what} y ${x.top} bis ${x.bottom}`).join(', '))

  // ---- 8. Tuer beim Hereinkommen
  const gapsIn = await a.evaluate(() => { const c = document.querySelector('canvas.ish-canvas'), o = []; for (let t = 0; t <= 2.6; t = +(t + 0.05).toFixed(2)) { window.seek(t, { paint: false }); const g = c.isoShop.doorGap(); if (g != null) o.push([t, g]) } return o })
  const worstIn = gapsIn.reduce((mn, x) => x[1] < mn[1] ? x : mn, [null, Infinity])
  check('Tür beim Hereinkommen: der Kunde berührt das Türblatt nicht (über 5 cm, 0,05-s-Schritte)', gapsIn.length > 8 && worstIn[1] > 0.05, `${gapsIn.length} Bilder mit offener Tür, knappster Abstand ${worstIn[1]} m bei ${worstIn[0]} s`)
} finally { await studio.close() }

// ---- 5./8. Hinausgehen ("leave") und Tuer
{
  const sc = { meta: { title: 'test leave', slug: 'test-leave' }, timing: { lead: 0.3, hold: 6 }, captionStyle: { mode: 'wort' }, scenes: [{ component: 'iso-shop', params: { branch: 'doener', shop: 'Döner Palast', icon: 'kebab', leaves: true, bubble: false, phone: false, customer: 4 }, anchors: { leave: { at: 'start', offset: 1.0 } }, captions: [{ lines: ['Bis morgen.'], instant: true }] }] }
  const s2 = await openStudio({ script: sc, times: estimateTimes(normalize(sc)) })
  try {
    const pg = await s2.page(), st = await s2.state(pg)
    check('Hinausgehen: Seite baut ohne Fehler und Warnung', !st.errors.length && !s2.problems.length && !st.warnings.length, [...st.errors, ...s2.problems, ...st.warnings].join(' | ').slice(0, 300))
    const tm = await pg.evaluate(() => document.querySelector('canvas.ish-canvas').isoShop.times)
    const l0 = await live(pg, 0.9), l1 = await live(pg, tm.walkOut.tDoor), lEnd = await live(pg, st.duration - 0.05)
    check('Vor "leave" steht er an der Theke, auf dem Weg hinaus ist die Tür offen, am Ende ist er weg und die Tür zu', !!l0.guest && l1.door > 0.8 && lEnd.guest === null && lEnd.door === 0, `${JSON.stringify(l0.guest)}, Tür ${l1.door}, Ende ${JSON.stringify(lEnd.guest)} / ${lEnd.door}`)
    check('Ton ding, wenn er durch die Tür geht', (st.cues || []).some(c => c.name === 'ding' && Math.abs(c.t - (tm.walkOut.tDoor - 0.05)) < 0.08))
    const gaps = await pg.evaluate(d => { const c = document.querySelector('canvas.ish-canvas'), o = []; for (let t = 0.8; t <= d; t = +(t + 0.05).toFixed(2)) { window.seek(t, { paint: false }); const g = c.isoShop.doorGap(); if (g != null) o.push([t, g]) } return o }, st.duration)
    const worst = gaps.reduce((mn, x) => x[1] < mn[1] ? x : mn, [null, Infinity])
    check('Tür beim Hinausgehen: der Kunde berührt das Türblatt nicht (über 5 cm)', gaps.length > 8 && worst[1] > 0.05, `${gaps.length} Bilder, knappster Abstand ${worst[1]} m bei ${worst[0]} s`)
  } finally { await s2.close() }
}

// ---- 9. Alle Branchen auf einer Seite, langer Name in zwei Zeilen
{
  const B = [['cafe', 'Café Mond', 'cup'], ['doener', 'Döner Nordwind', 'kebab'], ['friseur', 'Salon Schnitt', 'scissors'], ['baeckerei', 'Bäckerei Korn', 'bread'], ['eis', 'Eis Wolke', 'star']]
  const sc = { meta: { title: 'test branchen', slug: 'test-branchen' }, timing: { lead: 0.3, hold: 1 }, scenes: B.map(([branch, shop, icon], i) => ({ component: 'iso-shop', params: { branch, shop, icon, customer: i, paper: i % 2 === 0, bubble: false }, captions: [{ lines: [`Eine Probe für Branche ${i + 1}`] }] })) }
  const s3 = await openStudio({ script: sc, times: estimateTimes(normalize(sc)) })
  try {
    const pg = await s3.page(), st = await s3.state(pg)
    // Fuenf verschiedene Laeden in einem Video: dass Name, Symbol und Stempelzahl nicht ueberall gleich sind,
    // meldet engine.js zu Recht; hier ist es gewollt
    const warn = st.warnings.filter(w => !/nicht in allen Szenen gleich/.test(w))
    check('Fünf Branchen auf einer Seite: baut ohne Fehler und Warnung', !st.errors.length && !s3.problems.length && !warn.length, [...st.errors, ...s3.problems, ...warn].join(' | ').slice(0, 300))
    const hashes = []
    for (let i = 0; i < B.length; i++) {
      const s = st.scenes[i], t = (s.s + s.e) / 2
      await seek(pg, t); const cs = await canvasStats(pg, i)
      hashes.push(cs && cs.hash)
      check(`Branche ${B[i][0]}: eigenes Bild, nicht leer (mindestens 70 % nicht Nachthimmel, helles Schild)`, !!cs && cs.notSky > 0.7 && cs.bright > 0.004, cs ? `${(cs.notSky * 100).toFixed(0)} %, hell ${(cs.bright * 100).toFixed(2)} %` : 'fehlt')
    }
    check('Die fünf Branchen sehen verschieden aus', new Set(hashes).size === B.length)
    const signs = await pg.evaluate(() => [...document.querySelectorAll('canvas.ish-canvas')].map(c => c.isoShop.sign))
    const nord = signs.find(x => x.name === 'Döner Nordwind'), mond = signs.find(x => x.name === 'Café Mond')
    check('Langer Name ("Döner Nordwind") in zwei Zeilen, das letzte Wort mindestens 0,5 der Schildhöhe; kurzer in einer', !!nord && nord.lines === 2 && nord.size >= 0.5 && nord.fits && !!mond && mond.lines === 1 && mond.size >= 0.42, JSON.stringify(signs))
  } finally { await s3.close() }
}

// ---- 10. Falsche Angaben
{
  for (const [params, want] of [[{ branch: 'kino' }, /"branch" gibt es nicht/], [{ phone: false, close: 'phone' }, /"close": "phone" braucht "phone": true/], [{ have: 6 }, /"have" muss/],
    [{ start: 'none' }, /"start": "none" \(kein Kunde\) geht nur mit/], [{ guests: 7, phone: false }, /"guests" muss/], [{ branch: 'friseur', icon: 'scissors', guests: 2, phone: false, bubble: false }, /"guests" gibt es beim Friseur/]]) {
    const sc = { meta: { title: 'test fehler', slug: 'test-fehler' }, scenes: [{ component: 'iso-shop', params, captions: [{ lines: ['Probe'] }] }] }
    const s4 = await openStudio({ script: sc, times: estimateTimes(normalize(sc)) })
    try {
      const pg = await s4.page(), st = await s4.state(pg)
      check(`Falsche Angabe ${JSON.stringify(params)} bricht verständlich ab`, st.errors.some(e => want.test(e)), st.errors.join(' | ').slice(0, 200))
    } finally { await s4.close() }
  }
  // Anker, die ein Bild verderben: Warnung statt stiller Fehler
  for (const [label, params, anchors, want] of [
    ['"enter" 0,1 s nach Szenenbeginn', { start: 'door', phone: false, bubble: false }, { enter: { at: 'start', offset: 0.1 } }, /Glastür steht im ersten Bild schon offen/],
    ['"zoom" 0,4 s nach "order"', { close: 'phone' }, { order: { at: 'start', offset: 0.5 }, zoom: { at: 'start', offset: 0.9 }, scan: { at: 'start', offset: 2.0 }, stamp: { at: 'start', offset: 2.8 } }, /Sprechblase steht keine Sekunde/]
  ]) {
    const sc = { meta: { title: 'test warnung', slug: 'test-warnung' }, timing: { lead: 0.3, hold: 3 }, scenes: [{ component: 'iso-shop', params, anchors, captions: [{ lines: ['Probe'] }] }] }
    const s5 = await openStudio({ script: sc, times: estimateTimes(normalize(sc)) })
    try {
      const pg = await s5.page(), st = await s5.state(pg)
      check(`Warnung bei ${label}`, !st.errors.length && st.warnings.some(w => want.test(w)), [...st.errors, ...st.warnings].join(' | ').slice(0, 300))
    } finally { await s5.close() }
  }
}

// ---- 14. Voller und leerer Laden, Knuellen in der Nahaufnahme
{
  const base = { branch: 'cafe', icon: 'cup', bubble: false, phone: false }
  const sc = {
    meta: { title: 'test voll leer', slug: 'test-voll-leer' }, timing: { lead: 0.3, hold: 3 }, captionStyle: { mode: 'wort' },
    scenes: [
      { component: 'iso-shop', params: { ...base, shop: 'Café Mond' }, captions: [{ lines: ['Ohne Gäste.'], instant: true }] },
      { component: 'iso-shop', params: { ...base, shop: 'Café Mond', guests: 5 }, captions: [{ lines: ['Mit Gästen.'] }] },
      { component: 'iso-shop', params: { ...base, shop: 'Café Sonne', accent: '#E58A45', start: 'none', dim: true, paper: true, close: 'counter' }, anchors: { zoom: { at: 'start', offset: 0.6 }, crumple: { at: 'start', offset: 1.7 } }, captions: [{ lines: ['Leer und dunkel.'] }] }
    ]
  }
  const s6 = await openStudio({ script: sc, times: estimateTimes(normalize(sc)) })
  try {
    const pg = await s6.page(), st = await s6.state(pg)
    const warn = st.warnings.filter(w => !/nicht in allen Szenen gleich/.test(w))
    check('Voll und leer: baut ohne Fehler und Warnung', !st.errors.length && !s6.problems.length && !warn.length, [...st.errors, ...s6.problems, ...warn].join(' | ').slice(0, 300))
    // mittlere Helligkeit der Leinwand i
    const luma = i => pg.evaluate(i => {
      const c = document.querySelectorAll('canvas.ish-canvas')[i], g = document.createElement('canvas'); g.width = c.width; g.height = c.height
      const x = g.getContext('2d', { willReadFrequently: true }); x.drawImage(c, 0, 0); const d = x.getImageData(0, 0, c.width, c.height).data
      let sum = 0, n = 0; for (let k = 0; k < d.length; k += 16) { sum += 0.2126 * d[k] + 0.7152 * d[k + 1] + 0.0722 * d[k + 2]; n++ } return sum / n
    }, i)
    // Gleicher Blick (Szenenanfang, Ruhe der Kamera ist hier egal: beide Szenen fahren gleich), einmal mit Gaesten
    const at = k => st.scenes[k].s + 0.35
    await seek(pg, at(0)); const empty = await canvasStats(pg, 0), l0 = await luma(0)
    await seek(pg, at(1)); const full = await canvasStats(pg, 1)
    check('"guests": das Bild mit Gästen ist ein anderes als ohne', !!empty && !!full && empty.hash !== full.hash)
    const n = await pg.evaluate(() => document.querySelectorAll('canvas.ish-canvas')[1].isoShop.live())
    check('"guests": der Kunde steht trotzdem an der Theke', !!n.guest)
    const t2 = st.scenes[2].s + 0.3
    await seek(pg, t2); const l2 = await luma(2)
    const none = await pg.evaluate(t => { window.seek(t, { paint: false }); return document.querySelectorAll('canvas.ish-canvas')[2].isoShop.live() }, t2)
    check('"start": "none": kein Kunde im Bild', none.guest === null, JSON.stringify(none.guest))
    check('"dim": der leere Laden ist deutlich dunkler (höchstens 75 % der Helligkeit)', l2 < 0.75 * l0, `${l2.toFixed(1)} gegen ${l0.toFixed(1)}`)
    // Nahaufnahme: Karte beim Knuellen, Kugel im Flug und im Korb ganz im Bild
    const tm = await pg.evaluate(() => document.querySelectorAll('canvas.ish-canvas')[2].isoShop.times)
    const boxes = []
    for (const dt of [0.05, 0.3, 0.8, 1.15]) {
      await seek(pg, tm.crumple + dt)
      boxes.push(await pg.evaluate(() => document.querySelectorAll('canvas.ish-canvas')[2].isoShop.drawnBox('paper')))
    }
    const inside = boxes.every(b => b && b.left >= 20 && b.right <= 1060 && b.top >= 0 && b.bottom <= 1900)
    check('Nahaufnahme "counter": Karte, Flug und Kugel im Korb ganz im Bild', inside, boxes.map(b => b ? `${Math.round(b.left)}-${Math.round(b.right)} / ${Math.round(b.top)}-${Math.round(b.bottom)}` : 'fehlt').join(', '))
    // Gemessen 249 px (ganze Ansicht: rund 120 px, im Nachbau mit "push" 0,25 sogar nur 60 px)
    check('Nahaufnahme "counter": die flache Karte ist mindestens 200 px breit', !!boxes[0] && boxes[0].right - boxes[0].left >= 200, boxes[0] ? `${Math.round(boxes[0].right - boxes[0].left)} px` : 'fehlt')
  } finally { await s6.close() }
}

console.log(failed ? `${failed} Prüfung(en) gescheitert` : 'Alle Prüfungen bestanden')
process.exit(failed ? 1 : 0)
