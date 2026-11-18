#!/usr/bin/env node
// test_3d_iso_street_naehe.mjs - prueft iso-street mit mode "nah" (C1: Lichtring um den eigenen Laden, der Kunde
// betritt ihn, ueber ihm springt aus seinem Handy der Sperrbildschirm mit "Noch 2 Stempel bis: Gratis-Döner").
//
//   node studio/tools/test_3d_iso_street_naehe.mjs
//
// Was festgenagelt wird und warum:
//  1. Gleiches Bild, gleiche Pixel: Bild t, dann andere Zeiten (auch rueckwaerts), dann wieder t ergibt Pixel
//     fuer Pixel dasselbe, auch auf einer zweiten Seite. renderVideo verteilt die Bilder auf mehrere Seiten;
//     die Blase haengt an Kamera und Kunde, beides muss eine reine Funktion von t sein, sonst flackert sie.
//  2. Die Szene ist nicht leer (WebGL laeuft ohne Grafikkarte; faellt es aus, sieht man nur Nachthimmel), und
//     der Ring ist zu sehen (helle lila Pixel am Boden).
//  3. Die Anker feuern, wo sie sollen: zu "near" steht der Kunde genau auf dem Ring (auf 5 cm), vorher draussen,
//     und mindestens 9,5 m von der Tuer. "In der Naehe" ist nicht "vor der Tuer" (Korrektur des Betreibers am
//     zweiten Video). Vor "near" gibt es keine Blase, danach eine, nach dem Zurueckgehen keine mehr.
//  4. Pruefkaesten liegen auf den Dingen: Schilder (hell), Blase (helle Karte darin), Kunde und Blase umfassen
//     alles, was von ihnen gezeichnet wird (Bild mit und ohne). In der ersten Probe war der Kasten der Blase die
//     achsparallele Huelle in der Welt: y 404 bis 1215 statt 606 bis 936, und die Knopfspalte schlug falsch an.
//  5. Die Blase steht im Streifen unter den Textzeilen (Oberkante ab 600), zwischen x 60 und 940 (rechts davon die
//     Knoepfe von TikTok), und deckt kein Schild zu; die Bewegungsprobe von make.mjs sieht sie. In der ersten
//     Probe reichte sie beim Aufspringen fuer 0,2 s bis x = 1008.
//  6. Text in der Blase: Wortlaut aus C1, zwei Zeilen geteilt nach dem Doppelpunkt, gross genug fuers Handy.
//     Volle Karte: "Gratis-Döner wartet auf dich".
//  7. "rein": er beruehrt das Tuerblatt nicht und ist danach weg. "stadt": der ganze Ring im Bild. Eigener Laden
//     rechts: gespiegelt, alles bleibt im Bild. Falsche Angaben enden mit einer verstaendlichen Meldung.
//  8. Sekunden je Bild werden gemessen (Warnung ab 3 s, Fehler ab 8 s).
// Kein Netz, keine Kosten, etwa drei Minuten.
import { createHash } from 'node:crypto'
import { normalize, estimateTimes, STAGE } from '../engine/script.mjs'
import { openStudio, seek, sampleMotion } from '../engine/render.mjs'

const base = { mode: 'nah', shop: 'Döner Palast', icon: 'kebab', rival: 'Imbiss Sonne', rivalIcon: 'kebab', reward: 'Gratis-Döner', left: 2 }
// Wie die Probe videos/_probe-iso-street-naehe, Szene 1: er geht ab dem ersten Bild, betritt den Ring auf "Nähe",
// dreht sich kurz nach "zeigt" und ist am Ende der Szene drin. Eine zweite Szene folgt, damit die erste ein Ende hat.
const sceneRein = extra => ({
  component: 'iso-street',
  params: { ...base, frame: 'laden', then: 'rein', ...extra },
  anchors: { walk: { at: 'start', offset: 0 }, near: { cap: 0, word: 2, offset: 0.05 }, turn: { cap: 1, word: 0, offset: 0.27 }, enter: { at: 'end', offset: -0.12 } },
  captions: [{ lines: ['In der *Nähe'], instant: true }, { lines: ['zeigt sein Handy | deine *Karte.'] }]
})
const tail = { component: 'big-number', params: { value: '1', label: 'Probe' }, captions: [{ lines: ['Fertig.'] }] }
const script = { meta: { title: 'test 3d nah', slug: 'test-3d-nah' }, timing: { lead: 0.2, hold: 0.7 }, captionStyle: { mode: 'wort' }, scenes: [sceneRein(), tail] }

let failed = 0
const check = (label, ok, info = '') => { console.log(`${ok ? 'ok    ' : 'FEHLER'} ${label}${info ? ' - ' + info : ''}`); if (!ok) failed++ }
const MARGIN = 60, COL = STAGE.column, SAFE_TOP = STAGE.safeTop, SAFE_BOTTOM = STAGE.h - STAGE.safeBottom
const dbg = (pg, fn, arg) => pg.evaluate(({ fn, arg }) => { const d = document.querySelector('canvas.is-canvas').isoDebug; return fn === 'nah' ? d.nah : fn === 'signs' ? d.signs : d[fn](arg) }, { fn, arg })

// Pixel der 3D-Leinwand: Fingerabdruck, Anteil nicht Himmel, helle Pixel, Ring (helles Lila unterhalb y 1100)
const canvasStats = pg => pg.evaluate(() => {
  const c = document.querySelector('canvas.is-canvas')
  if (!c) return null
  const g = document.createElement('canvas'); g.width = c.width; g.height = c.height
  const x = g.getContext('2d', { willReadFrequently: true }); x.drawImage(c, 0, 0)
  const d = x.getImageData(0, 0, c.width, c.height).data
  let h = 0x811c9dc5
  for (let i = 0; i < d.length; i++) { h ^= d[i]; h = Math.imul(h, 0x01000193) >>> 0 }
  const sky = [14, 10, 36]
  let notSky = 0, bright = 0, ring = 0, n = 0
  for (let i = 0; i < d.length; i += 16) {
    const r = d[i], gg = d[i + 1], b = d[i + 2], y = Math.floor(i / 4 / c.width); n++
    if (Math.abs(r - sky[0]) + Math.abs(gg - sky[1]) + Math.abs(b - sky[2]) > 18) notSky++
    if (r + gg + b > 600) bright++
    if (y > 1100 && b > 200 && r > 140 && b > r + 15 && b > gg + 25) ring++
  }
  return { hash: h.toString(16), w: c.width, notSky: notSky / n, bright: bright / n, ring: ring / n }
})
// Was in den Pruefkaesten liegt: Anteil heller Pixel
const boxStats = pg => pg.evaluate(() => {
  const c = document.querySelector('canvas.is-canvas'), g = document.createElement('canvas'); g.width = c.width; g.height = c.height
  const x = g.getContext('2d', { willReadFrequently: true }); x.drawImage(c, 0, 0)
  return window.STUDIO.probe().map(it => {
    const x0 = Math.max(0, Math.round(it.left)), y0 = Math.max(0, Math.round(it.top)), w = Math.min(c.width, Math.round(it.right)) - x0, h = Math.min(c.height, Math.round(it.bottom)) - y0
    if (w < 2 || h < 2) return { ...it, bright: 0 }
    const d = x.getImageData(x0, y0, w, h).data
    let bright = 0
    for (let i = 0; i < d.length; i += 4) if (d[i] + d[i + 1] + d[i + 2] > 600) bright++
    return { ...it, bright: bright / (w * h) }
  })
})
// Die Szene ohne Zeichnen durchgehen und sammeln, wohin jeder Kasten reicht (und wann)
const sweep = (pg, t0, t1, step) => pg.evaluate(({ t0, t1, step }) => {
  const out = {}
  for (let t = t0; t <= t1 + 1e-6; t = +(t + step).toFixed(3)) {
    window.seek(t, { paint: false })
    for (const it of window.STUDIO.probe()) {
      const o = out[it.what] || (out[it.what] = { left: 1e9, right: -1e9, top: 1e9, bottom: -1e9, bandRight: -1e9, seen: [] })
      o.left = Math.min(o.left, it.left); o.right = Math.max(o.right, it.right); o.top = Math.min(o.top, it.top); o.bottom = Math.max(o.bottom, it.bottom)
      if (it.bottom > 900 && it.top < 1540) o.bandRight = Math.max(o.bandRight, it.right)
      o.seen.push(t)
    }
  }
  return out
}, { t0, t1, step })
const anchorsOf = (st, scene = 1) => Object.fromEntries(st.anchors.filter(a => a.scene === scene).map(a => [a.name, a.t]))
const fmt = b => b ? `x ${Math.round(b.left)} bis ${Math.round(b.right)}, y ${Math.round(b.top)} bis ${Math.round(b.bottom)}` : 'fehlt'

// ---------------------------------------------------------------- Hauptfall: "laden", "rein"
{
  const studio = await openStudio({ script, times: estimateTimes(normalize(script)) })
  try {
    const t0 = Date.now()
    const a = await studio.page(), st = await studio.state(a)
    const buildSeconds = (Date.now() - t0) / 1000
    check('Seite baut ohne Fehler', !st.errors.length && !studio.problems.length, [...st.errors, ...studio.problems].join(' | ').slice(0, 200) || `${buildSeconds.toFixed(1)} s`)
    const own = st.warnings.filter(w => /iso-street/.test(w))
    check('Keine Hinweise des Bausteins (Text zu klein, Kunde rennt, Anker)', !own.length, own.join(' | ').slice(0, 300))
    const A = anchorsOf(st), nah = await dbg(a, 'nah')
    check('Anker walk, near, turn, enter feuern in dieser Reihenfolge', ['walk', 'near', 'turn', 'enter'].every(k => A[k] != null) && A.walk < A.near && A.near < A.turn && A.turn < A.enter, JSON.stringify(A))

    // 3. Lage zu den Ankern (reine Funktion von t, ohne Bilder)
    const wNear = await dbg(a, 'walkerAt', A.near), wStart = await dbg(a, 'walkerAt', A.walk), wBefore = await dbg(a, 'walkerAt', A.near - 0.15), wAfter = await dbg(a, 'walkerAt', A.near + 0.15)
    check('"near": der Kunde steht genau auf dem Ring (auf 5 cm), kurz vorher draussen, kurz danach drin', Math.abs(wNear.ring - nah.R) < 0.05 && wBefore.ring > nah.R && wAfter.ring < nah.R && wStart.ring > nah.R + 0.5, `Abstand zur Mitte ${wStart.ring} / ${wBefore.ring} / ${wNear.ring} / ${wAfter.ring} m, Ring ${nah.R} m`)
    const doorDist = Math.hypot(wNear.x - nah.door[0], wNear.z - nah.door[1])
    check('Er betritt den Ring weit weg von der Tür (mindestens 9,5 m): nicht "vor der Tür"', doorDist >= 9.5, `${doorDist.toFixed(2)} m`)
    const wEnd = await dbg(a, 'walkerAt', A.enter + 0.45)
    check('"enter": danach ist er drin (nicht mehr zu sehen)', wEnd.visible === false && (await dbg(a, 'walkerAt', A.enter - 0.3)).visible === true)

    // 1. und 2. Pixel
    const T = +(A.near + 0.6).toFixed(2)
    await seek(a, T); const s1 = await canvasStats(a), shot1 = await a.screenshot()
    check('Leinwand vorhanden (WebGL läuft)', !!s1 && s1.w === 1080)
    if (s1) {
      check('Szene nicht leer: mindestens 60 % des Bildes sind nicht Himmel', s1.notSky > 0.6, `${(s1.notSky * 100).toFixed(1)} %`)
      check('Licht zu sehen (Fenster, Schilder, Blase): mindestens 1 % helle Pixel', s1.bright > 0.01, `${(s1.bright * 100).toFixed(2)} %`)
      check('Ring zu sehen: helles Lila am Boden (mindestens 0,3 % der Pixel unterhalb y 1100)', s1.ring > 0.003, `${(s1.ring * 100).toFixed(2)} %`)
    }
    const per = []
    for (const t of [A.enter - 0.2, 0.3, A.turn + 0.1]) { const q = Date.now(); await seek(a, t); await a.screenshot({ type: 'jpeg', quality: 95 }); per.push((Date.now() - q) / 1000) }
    const s3 = await canvasStats(a)
    await seek(a, T); const s2 = await canvasStats(a), shot2 = await a.screenshot()
    check(`Gleiches Bild (t = ${T} s) nach Sprüngen gleich: Leinwand Pixel für Pixel`, !!s1 && s1.hash === s2.hash, `${s1 && s1.hash} / ${s2 && s2.hash}`)
    check('Gleiches Bild nach Sprüngen gleich: ganzer Bildschirm (mit Textzeilen)', createHash('sha256').update(shot1).digest('hex') === createHash('sha256').update(shot2).digest('hex'))
    check('Andere Zeit, anderes Bild (die Szene bewegt sich)', !!s3 && s3.hash !== s1.hash)
    const b = await studio.page()
    await seek(b, T); const sb = await canvasStats(b), shotB = await b.screenshot()
    check('Gleiches Bild auf einer zweiten Seite gleich', !!sb && sb.hash === s1.hash && createHash('sha256').update(shotB).digest('hex') === createHash('sha256').update(shot1).digest('hex'), `${sb && sb.hash}`)
    await b.evaluate(() => window.seek(0.2, { paint: false })); const sp = await canvasStats(b)
    check('seek(t, { paint: false }) zeichnet nicht', !!sp && sp.hash === s1.hash)
    await b.close()
    const spf = per.reduce((x, y) => x + y, 0) / per.length
    console.log(`Sekunden je Bild (rechnen + Foto, eine Seite): ${per.map(x => x.toFixed(2)).join(' / ')}, Mittel ${spf.toFixed(2)}; Seite gebaut in ${buildSeconds.toFixed(1)} s`)
    check('Rechenzeit unter 8 s je Bild', spf < 8, spf.toFixed(2) + ' s')
    if (spf > 3) console.log('WARNUNG: über 3 s je Bild')

    // 4. Kaesten auf den Dingen
    await seek(a, T)
    const bx = await boxStats(a), by = w => bx.find(it => it.what === w)
    check('Prüfkästen vorhanden: beide Schilder, Benachrichtigung, Kunde', ['Schild Döner Palast', 'Schild Imbiss Sonne', 'Benachrichtigung', 'Kunde'].every(by), bx.map(it => it.what).join(', '))
    for (const w of ['Schild Döner Palast', 'Schild Imbiss Sonne', 'Benachrichtigung']) {
      const it = by(w)
      check(`Kasten "${w}" liegt auf dem Ding (mindestens 25 % helle Pixel darin)`, !!it && it.bright > 0.25, it ? `${(it.bright * 100).toFixed(0)} %, ${fmt(it)}` : 'fehlt')
    }
    for (const [what, key] of [['Kunde', 'walker'], ['Benachrichtigung', 'bubble']]) {
      const it = by(what), d = await dbg(a, 'drawnBox', key), tol = 4
      const inside = !!it && !!d && d.pixels > 200 && d.left >= it.left - tol && d.right <= it.right + tol && d.top >= it.top - tol && d.bottom <= it.bottom + tol
      check(`Kasten "${what}" umfasst alles, was davon gezeichnet wird`, inside, it && d ? `gezeichnet x ${d.left} bis ${d.right}, y ${d.top} bis ${d.bottom} (${d.pixels} Pixel); Kasten ${fmt(it)}` : 'fehlt')
    }
    // 5. Blase: Streifen, Rand, keine Ueberdeckung mit Schildern; ueber die ganze Szene (ohne Bilder)
    const seen = await sweep(a, 0, A.enter + 0.4, 0.05), bub = seen['Benachrichtigung'] || null
    const signTop = Math.min(...['Schild Döner Palast', 'Schild Imbiss Sonne'].map(w => seen[w] ? seen[w].top : 0))
    check('Blase nie vor "near", nach dem Zurückgehen weg', !!bub && Math.min(...bub.seen) >= A.near && Math.max(...bub.seen) <= nah.tClose + 0.3, bub ? `zu sehen ${Math.min(...bub.seen)} bis ${Math.max(...bub.seen)} s ("near" ${A.near}, zurück ab ${nah.tClose})` : 'nie gesehen')
    check('Blase im Streifen unter den Textzeilen, zwischen x 60 und 940, über allen Schildern', !!bub && bub.top >= 600 && bub.left >= MARGIN && bub.right <= 940 && bub.bottom < signTop, bub ? `${fmt(bub)}; oberstes Schild ab y ${Math.round(signTop)}` : 'fehlt')
    const wk = seen['Kunde']
    check('Kunde die ganze Szene 60 px vom Rand und vor der Knopfspalte', !!wk && wk.left >= MARGIN && wk.right <= 1080 - MARGIN && wk.bandRight <= 940, wk ? fmt(wk) : 'fehlt')
    const st1 = await studio.state(a), all = await sampleMotion(a, st1.duration), col = await sampleMotion(a, st1.duration, { band: COL })
    check('Bewegungsprobe sieht Blase und Kunde (sonst prüft "knopfspalte" in 3D nichts)', ['Benachrichtigung', 'Kunde'].every(w => all.some(x => x.what === w)))
    check(`Knopfspalte frei: nichts reicht bei y ${COL.top} bis ${COL.bottom} über x = ${COL.left}`, col.length === 0, col.map(x => `${x.what} bis x = ${x.right}`).join(', '))
    const r = await studio.page({ rest: true }), m = await r.evaluate(() => window.STUDIO.measure()); await r.close()
    const restSigns = m.safe.filter(sf => /^Schild /.test(sf.what))
    check(`Ruhelage: beide Schilder zählen (data-safe) und liegen zwischen y ${SAFE_TOP} und ${SAFE_BOTTOM}`, restSigns.length === 2 && restSigns.every(sf => sf.top >= SAFE_TOP && sf.bottom <= SAFE_BOTTOM), restSigns.map(sf => `${sf.what} y ${sf.top} bis ${sf.bottom}`).join(', '))
    // 6. Text
    check('Text der Blase: Wortlaut aus C1 in zwei Zeilen, geteilt nach dem Doppelpunkt, mindestens 40 px', JSON.stringify(nah.bodyLines) === '["Noch 2 Stempel bis:","Gratis-Döner"]' && nah.bodySize >= 40 && nah.titleSize >= 36, `${JSON.stringify(nah.bodyLines)}, ${nah.bodySize} px, Absender ${nah.titleSize} px`)
    // 7. Tuer
    const gaps = await a.evaluate(({ t0, t1 }) => {
      const c = document.querySelector('canvas.is-canvas'), out = []
      for (let t = t0; t <= t1 + 1e-6; t = +(t + 0.05).toFixed(3)) { window.seek(t, { paint: false }); const g = c.isoDebug.doorGap(); if (g != null) out.push([t, g]) }
      return out
    }, { t0: A.enter - 1.4, t1: A.enter + 0.6 })
    const worst = gaps.reduce((mn, x) => x[1] < mn[1] ? x : mn, [null, Infinity])
    check('"rein": er berührt das Türblatt nicht (Abstand in 0,05-s-Schritten über 3 cm)', gaps.length >= 5 && worst[1] > 0.03, `${gaps.length} Bilder mit offener Tür, knappster Abstand ${worst[1]} m bei ${worst[0]} s`)
  } finally { await studio.close() }
}

// ---------------------------------------------------------------- "stadt", "weiter", volle Karte
{
  const sc = { meta: { title: 'test nah stadt', slug: 'test-nah-stadt' }, timing: { lead: 0.2, hold: 0.7 }, captionStyle: { mode: 'wort' }, scenes: [{
    component: 'iso-street', params: { ...base, frame: 'stadt', then: 'weiter', left: 0 },
    anchors: { walk: { at: 'start' }, near: { cap: 0, word: 2, offset: 0.05 } },
    captions: [{ lines: ['Ganz von *selbst.'], instant: true }, { lines: ['Ohne dass du | *etwas tust.'] }]
  }] }
  const st = await openStudio({ script: sc, times: estimateTimes(normalize(sc)) })
  try {
    const pg = await st.page(), s0 = await st.state(pg)
    check('"stadt": Seite baut ohne Fehler und ohne Hinweise des Bausteins', !s0.errors.length && !st.problems.length && !s0.warnings.some(w => /iso-street/.test(w)), [...s0.errors, ...st.problems, ...s0.warnings].join(' | ').slice(0, 200))
    const nah = await dbg(pg, 'nah'), A = anchorsOf(s0)
    check('Volle Karte: "Gratis-Döner wartet auf dich"', nah.bodyLines.join(' ') === 'Gratis-Döner wartet auf dich', JSON.stringify(nah.bodyLines))
    await pg.evaluate(t => window.seek(t, { paint: false }), s0.duration - 0.1)
    const ring = await dbg(pg, 'ringScreen'), xs = ring.map(p => p[0]), ys = ring.map(p => p[1])
    check('"stadt": der ganze Ring im Bild (60 px vom Rand, unter den Textzeilen, über der Sperrzone unten)', Math.min(...xs) >= MARGIN && Math.max(...xs) <= 1080 - MARGIN && Math.min(...ys) >= 600 && Math.max(...ys) <= SAFE_BOTTOM, `x ${Math.min(...xs)} bis ${Math.max(...xs)}, y ${Math.min(...ys)} bis ${Math.max(...ys)}`)
    const w1 = await dbg(pg, 'walkerAt', s0.duration - 0.6), w2 = await dbg(pg, 'walkerAt', s0.duration)
    check('"weiter": er bleibt im Ring stehen (mit dem Handy)', w1.x === w2.x && w1.z === w2.z && w2.ring < nah.R && w2.visible, `${JSON.stringify(w1)} / ${JSON.stringify(w2)}`)
    const seen = await sweep(pg, 0, s0.duration, 0.05), bub = seen['Benachrichtigung']
    check('"stadt": Blase bleibt bis zum Ende, im Streifen, zwischen x 60 und 940', !!bub && Math.max(...bub.seen) >= s0.duration - 0.06 && bub.top >= 600 && bub.left >= MARGIN && bub.right <= 940, bub ? fmt(bub) : 'fehlt')
    const col = await sampleMotion(pg, s0.duration, { band: COL })
    check('"stadt": Knopfspalte frei', col.length === 0, col.map(x => `${x.what} bis x = ${x.right}`).join(', '))
    await seek(pg, s0.duration - 0.1)
    const bx = (await boxStats(pg)).find(it => it.what === 'Benachrichtigung')
    check('"stadt": Kasten der Blase liegt auf der Blase', !!bx && bx.bright > 0.25, bx ? `${(bx.bright * 100).toFixed(0)} % hell` : 'fehlt')
    void A
  } finally { await st.close() }
}

// ---------------------------------------------------------------- Eigener Laden rechts (gespiegelt), "dreht"
{
  const s1 = sceneRein({ ours: 'right', then: 'dreht' }); delete s1.anchors.enter
  const sc = { ...script, scenes: [s1, tail] }
  const st = await openStudio({ script: sc, times: estimateTimes(normalize(sc)) })
  try {
    const pg = await st.page(), s0 = await st.state(pg)
    check('Rechts, "dreht": Seite baut ohne Fehler', !s0.errors.length && !st.problems.length, [...s0.errors, ...st.problems].join(' | ').slice(0, 200))
    const A = anchorsOf(s0), nah = await dbg(pg, 'nah'), wn = await dbg(pg, 'walkerAt', A.near)
    check('Rechts: zu "near" auf dem Ring und weit von der Tür', Math.abs(wn.ring - nah.R) < 0.05 && Math.hypot(wn.x - nah.door[0], wn.z - nah.door[1]) >= 9.5, JSON.stringify(wn))
    const seen = await sweep(pg, 0, s0.scenes[0].e, 0.05), bad = []
    for (const [w, o] of Object.entries(seen)) {
      if (o.left < MARGIN || o.right > 1080 - MARGIN) bad.push(`${w} x ${Math.round(o.left)} bis ${Math.round(o.right)}`)
      if (o.bandRight > 940) bad.push(`${w} in der Knopfspalte bis x = ${Math.round(o.bandRight)}`)
    }
    check('Rechts: Schilder, Blase und Kunde die ganze Szene 60 px vom Rand und vor der Knopfspalte', !bad.length && ['Benachrichtigung', 'Kunde'].every(w => seen[w]), bad.join('; ') || Object.keys(seen).join(', '))
    const wEnd = await dbg(pg, 'walkerAt', s0.scenes[0].e)
    const dNear = Math.hypot(wn.x - nah.door[0], wn.z - nah.door[1]), dEnd = Math.hypot(wEnd.x - nah.door[0], wEnd.z - nah.door[1])
    check('"dreht": er geht auf die Tür zu (mindestens 3 m näher als bei "near"), aber nicht hinein', wEnd.visible && dEnd < dNear - 3, `Abstand zur Tür ${dNear.toFixed(1)} m bei "near", ${dEnd.toFixed(1)} m am Ende`)
  } finally { await st.close() }
}

// ---------------------------------------------------------------- Falsche Angaben
for (const [label, params, anchors, want] of [
  ['"enter" zu kurz nach "turn"', { then: 'rein' }, { turn: { cap: 1, word: 0, offset: 0.27 }, enter: { cap: 1, word: 1 } }, /zu kurz nach "turn"|mindestens 0,5 s nach "turn"/],
  ['unbekanntes "then"', { then: 'rennt' }, null, /"then" muss/],
  ['Gedankenstrich in der Belohnung', { reward: 'Gratis—Döner' }, null, /Gedankenstrich/]
]) {
  const s1 = sceneRein(params); if (anchors) Object.assign(s1.anchors, anchors); else if (params.then === 'rennt') { delete s1.anchors.turn; delete s1.anchors.enter }
  const sc = { ...script, scenes: [s1, tail] }
  const st = await openStudio({ script: sc, times: estimateTimes(normalize(sc)) })
  try {
    const pg = await st.page(), s0 = await st.state(pg), msg = [...s0.errors, ...st.problems].join(' | ')
    check(`Falsche Angabe (${label}) endet mit verständlicher Meldung`, want.test(msg), msg.slice(0, 200))
  } finally { await st.close() }
}

// ---------------------------------------------------------------- Ohne "nah" bleibt alles beim Alten
{
  const mod = (await import('../components/iso-street.js')).default
  const duell = Object.keys(mod.anchors({ heart: true, back: false, walker: true, mode: 'duell' })).join(',')
  check('mode "duell" (Vorgabe): dieselben Anker wie vorher (crack, walk, cross, enter)', mod.params.mode.default === 'duell' && duell === 'crack,walk,cross,enter', duell)
}

console.log(failed ? `${failed} Prüfung(en) gescheitert` : 'Alle Prüfungen bestanden')
process.exit(failed ? 1 : 0)
