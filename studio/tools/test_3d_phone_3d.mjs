#!/usr/bin/env node
// test_3d_phone_3d.mjs - prueft den 3D-Baustein phone-3d (Handy mit Wallet, Sperrbildschirm, Kartendesign).
//
//   node studio/tools/test_3d_phone_3d.mjs
//
// Was festgenagelt wird und warum:
//  1. Gleiches Bild, gleiche Pixel: Bild t, dann andere (auch rueckwaerts), dann wieder t ergibt Pixel fuer
//     Pixel dasselbe, auf derselben und auf einer ZWEITEN Seite. renderVideo verteilt die Bilder auf mehrere
//     Seiten und rechnet sie nicht der Reihe nach; haengt ein Bild vom vorigen ab (Zufall, Uhr, eine Textur,
//     die nur beim Weiterlaufen neu gemalt wird), flackert das Video.
//  2. Die Szene ist nicht leer: ohne Grafikkarte rechnet SwiftShader; faellt WebGL aus, sieht man nur den
//     Nachthimmel und keine andere Pruefung merkt es. Gezaehlt wird, wie viel nicht Nachthimmel ist und ob es
//     Helles (Karte, QR-Code, Benachrichtigung) gibt.
//  3. seek(t, { paint: false }) zeichnet nicht (die Bewegungsprobe ruft es alle 0,25 s auf).
//  4. Sekunden je Bild werden gemessen (Fehler ab 8 s, Warnung ab 3 s).
//  5. Anker wirken: Handy steigt ein (rise), Karte erst nach "card" da, Stempel erst nach "stamp1/2", Scan-Rahmen
//     und Haken nach "scan", Benachrichtigung und Aufleuchten nach "notify", graue Karte weg nach "paint", Logo
//     nach "logo". Gelesen aus dem Zustand (canvas.phoneDebug.state), ohne Bilder.
//  6. Pruefkaesten: es gibt sie (Karte, Ladenname, Belohnungszeile, QR-Code bzw. Datum, Uhr, Benachrichtigung),
//     sie liegen auf dem Gezeichneten (alles, was die Karte bzw. die Benachrichtigung an Pixeln aendert, liegt
//     im Kasten; im QR-Kasten ist es hell), und die Pruefungen des Studios sehen sie (Ruhelage, Bewegungsprobe).
//     Die Leinwand allein ist fuer Sperrzonen, Textabstand und Knopfspalte nur eine Flaeche.
//  7. Lesbarkeit auf dem Handy: Ladenname, Belohnungszeile und Text der Benachrichtigung stehen im fertigen Bild
//     mindestens so gross wie in den 2D-Bausteinen (wallet-pass: Belohnung 23 px, lock-notification: 25 px).
//  8. Ausschnitt an den Grenzen der Parameter (push 0 und 0,25, orbit 0 und 14, angle -24 und 24, iphone und
//     android, alle drei Ansichten): nach dem Einstieg bleiben alle Kaesten unter den Textzeilen (ab 480 px),
//     ueber 1536 px, 60 px vom Rand und rechts vor x = 940, wo die Knopfspalte von TikTok liegt.
//  9. Wortlaut aus C1 (PRODUKT.md): "Noch 2 Stempel bis: Gratis-Döner", voll "Gratis-Döner wartet auf dich";
//     ein Text mit "vibriert" bricht den Bau ab; ein zu langer Ladenname warnt statt still zu schrumpfen.
// 10. Neben iso-street auf derselben Seite: der Renderer ist geteilt (engine/kit3d.js), und phone-3d laesst
//     three.js beim ersten Bild eine Umgebung fuer die Spiegelungen vorrechnen. Danach muss das Bild der Stadt
//     Pixel fuer Pixel dasselbe sein wie vorher (kein Zustand, der von einer Szene in die andere sickert).
//
// Kein Netz, keine Kosten, etwa drei Minuten (rechnet rund 25 Bilder in 3D).
import { createHash } from 'node:crypto'
import { normalize, estimateTimes, STAGE } from '../engine/script.mjs'
import { openStudio, seek, sampleMotion } from '../engine/render.mjs'
import { runChecks } from '../engine/checks.mjs'

let failed = 0
const check = (label, ok, info = '') => { console.log(`${ok ? 'ok    ' : 'FEHLER'} ${label}${info ? ' - ' + info : ''}`); if (!ok) failed++ }
const sha = b => createHash('sha256').update(b).digest('hex')

// Skripte: eine Szene phone-3d, Textzeilen in Stil C (Modus "wort"), wie in jedem neuen Video
const scene = (params, anchors, captions) => ({ meta: { title: 'test phone-3d', slug: 'test-phone-3d' }, captionStyle: { mode: 'wort' }, timing: { lead: 0.3, hold: 1.2, maxGap: 0.3 }, scenes: [{ component: 'phone-3d', params, anchors, captions }] })
const WALLET = scene({ mode: 'wallet', shop: 'Döner Palast', icon: 'kebab', stamps: 10, before: 6, after: 8, reward: 'Gratis-Döner' },
  { card: { cap: 0, word: 1 }, scan: { cap: 1, word: 0 }, stamp1: { cap: 1, word: 1 }, stamp2: { cap: 1, word: 2 } },
  [{ lines: ['Ab in die *Wallet.'], instant: true }, { lines: ['*Scannen, | *Stempel, | *Stempel.'] }])
const LOCK = scene({ mode: 'lock', shop: 'Döner Palast', icon: 'kebab', reward: 'Gratis-Döner', left: 2, angle: -12 },
  { notify: { cap: 0, word: 1 } }, [{ lines: ['Sie *meldet | sich von *selbst.'] }])
const DESIGN = scene({ mode: 'design', shop: 'Döner Palast', icon: 'kebab', stamps: 10, before: 5, reward: 'Gratis-Döner', colors: '#C2502E,#7A2617', rise: false },
  { paint: { cap: 0, word: 1 }, logo: { cap: 0, word: 3 }, symbol: { cap: 0, word: 3, offset: 0.3 } }, [{ lines: ['Deine *Farben, | dein *Logo.'] }])

const open = async sc => { const studio = await openStudio({ script: sc, times: estimateTimes(normalize(sc)) }); const pg = await studio.page(); return { studio, pg, st: await studio.state(pg) } }
const anchorT = (st, n) => (st.anchors.find(a => a.name === n) || {}).t
const dbg = (pg, fn, arg) => pg.evaluate(([fn, arg]) => document.querySelector('canvas.ph-canvas').phoneDebug[fn](arg), [fn, arg])
const stateAt = (pg, t) => pg.evaluate(t => { window.seek(t, { paint: false }); return document.querySelector('canvas.ph-canvas').phoneDebug.state() }, t)

// Pixel der 3D-Leinwand selbst: Fingerabdruck und Anteile (ohne Textzeilen und Verlaeufe darueber)
const canvasStats = pg => pg.evaluate(() => {
  const c = document.querySelector('canvas.ph-canvas'); if (!c) return null
  const g = document.createElement('canvas'); g.width = c.width; g.height = c.height
  const x = g.getContext('2d', { willReadFrequently: true }); x.drawImage(c, 0, 0)
  const d = x.getImageData(0, 0, c.width, c.height).data
  let h = 0x811c9dc5
  for (let i = 0; i < d.length; i++) { h ^= d[i]; h = Math.imul(h, 0x01000193) >>> 0 }
  let notSky = 0, bright = 0, n = 0
  for (let i = 0; i < d.length; i += 16) { n++; const r = d[i], gg = d[i + 1], b = d[i + 2]; if (Math.abs(r - 14) + Math.abs(gg - 10) + Math.abs(b - 36) > 18) notSky++; if (r + gg + b > 600) bright++ }
  return { hash: h.toString(16), w: c.width, notSky: notSky / n, bright: bright / n }
})
// Was in den Pruefkaesten auf der Leinwand liegt (Anteil heller Pixel)
const boxStats = pg => pg.evaluate(() => {
  const c = document.querySelector('canvas.ph-canvas'), g = document.createElement('canvas'); g.width = c.width; g.height = c.height
  const x = g.getContext('2d', { willReadFrequently: true }); x.drawImage(c, 0, 0)
  return window.STUDIO.probe().map(it => {
    const x0 = Math.max(0, Math.round(it.left)), y0 = Math.max(0, Math.round(it.top)), w = Math.min(c.width, Math.round(it.right)) - x0, h = Math.min(c.height, Math.round(it.bottom)) - y0
    if (w < 2 || h < 2) return { ...it, bright: 0 }
    const d = x.getImageData(x0, y0, w, h).data; let bright = 0
    for (let i = 0; i < d.length; i += 4) if (d[i] + d[i + 1] + d[i + 2] > 600) bright++
    return { ...it, bright: bright / (w * h) }
  })
})
// Szene ohne Zeichnen durchgehen: wohin reicht jeder Kasten ab "from"
const sweep = (pg, from, to, step = 0.1) => pg.evaluate(({ from, to, step }) => {
  const out = {}
  for (let t = from; t <= to + 1e-6; t = +(t + step).toFixed(3)) {
    window.seek(t, { paint: false })
    for (const it of window.STUDIO.probe()) {
      const o = out[it.what] || (out[it.what] = { left: 1e9, right: -1e9, top: 1e9, bottom: -1e9, band: -1e9, at: {} })
      if (it.left < o.left) { o.left = it.left; o.at.left = t } if (it.right > o.right) { o.right = it.right; o.at.right = t }
      if (it.top < o.top) { o.top = it.top; o.at.top = t } if (it.bottom > o.bottom) { o.bottom = it.bottom; o.at.bottom = t }
      if (it.bottom > 900 && it.top < 1540 && it.right > o.band) { o.band = it.right; o.at.band = t }
    }
  }
  window.seek(0, { paint: false }); return out
}, { from, to, step })
const MARGIN = 60, TOP = 480, BOTTOM = STAGE.h - STAGE.safeBottom, COL = STAGE.column
const limitsOk = seen => {
  const bad = []
  for (const [w, o] of Object.entries(seen)) {
    if (o.left < MARGIN) bad.push(`${w} links bis x = ${o.left} (${o.at.left} s)`)
    if (o.right > STAGE.w - MARGIN) bad.push(`${w} rechts bis x = ${o.right} (${o.at.right} s)`)
    if (o.top < TOP) bad.push(`${w} oben bis y = ${o.top} (${o.at.top} s)`)
    if (o.bottom > BOTTOM) bad.push(`${w} unten bis y = ${o.bottom} (${o.at.bottom} s)`)
    if (o.band > 940) bad.push(`${w} in der Knopfspalte bis x = ${o.band} (${o.at.band} s)`)
  }
  return bad
}
// Die Pruefungen des Studios wie in make.mjs (Ruhelage + Bewegungsprobe); "laenge" zaehlt hier nicht (Probe)
const studioChecks = async (studio, pg, st) => {
  const r = await studio.page({ rest: true }), measured = await r.evaluate(() => window.STUDIO.measure()); await r.close()
  const motion = await sampleMotion(pg, st.duration, { band: COL })
  const res = runChecks({ state: st, measured, problems: studio.problems, voice: null, motion })
  return { measured, bad: res.checks.filter(c => !c.ok && c.name !== 'laenge').map(c => `${c.name}: ${c.details.slice(0, 2).join(' | ')}`) }
}

// ================================================================ 1. bis 7.: Wallet
{
  const { studio, pg, st } = await open(WALLET)
  try {
    check('Wallet: Seite baut ohne Fehler und Warnungen', !st.errors.length && !studio.problems.length && !st.warnings.length, [...st.errors, ...studio.problems, ...st.warnings].join(' | ').slice(0, 300))
    const tCard = anchorT(st, 'card'), tScan = anchorT(st, 'scan'), tS1 = anchorT(st, 'stamp1'), tS2 = anchorT(st, 'stamp2'), T = +(Math.min(st.duration - 0.1, tScan + 1.6)).toFixed(2)
    await seek(pg, T); const s1 = await canvasStats(pg), shot1 = await pg.screenshot()
    check('Leinwand vorhanden (WebGL läuft)', !!s1 && s1.w === 1080, s1 ? `${s1.w} breit` : 'keine canvas.ph-canvas')
    check('Szene nicht leer: mindestens 70 % des Bildes sind nicht Nachthimmel', !!s1 && s1.notSky > 0.7, s1 && `${(s1.notSky * 100).toFixed(1)} %`)
    check('Helles zu sehen (Karte, QR-Code): mindestens 1 % helle Pixel', !!s1 && s1.bright > 0.01, s1 && `${(s1.bright * 100).toFixed(2)} %`)
    const per = []
    for (const t of [tScan + 0.4, 0.4, tCard + 0.2, T - 0.7]) { const q = Date.now(); await seek(pg, t); await pg.screenshot({ type: 'jpeg', quality: 95 }); per.push((Date.now() - q) / 1000) }
    const s3 = await canvasStats(pg)
    await seek(pg, T); const s2 = await canvasStats(pg), shot2 = await pg.screenshot()
    check(`Gleiches Bild (t = ${T} s) nach Sprüngen gleich: Leinwand Pixel für Pixel`, !!s1 && s1.hash === s2.hash, `${s1 && s1.hash} / ${s2 && s2.hash}`)
    check('Gleiches Bild nach Sprüngen gleich: ganzer Bildschirm (mit Textzeilen)', sha(shot1) === sha(shot2))
    check('Andere Zeit, anderes Bild (die Szene bewegt sich)', !!s3 && s3.hash !== s1.hash)
    const pg2 = await studio.page(); await seek(pg2, T); const sb = await canvasStats(pg2), shotB = await pg2.screenshot()
    check('Gleiches Bild auf einer zweiten Seite gleich (renderVideo rechnet auf mehreren)', !!sb && sb.hash === s1.hash && sha(shotB) === sha(shot1), sb && sb.hash)
    await pg2.evaluate(() => window.seek(0.5, { paint: false })); const sp = await canvasStats(pg2)
    check('seek(t, { paint: false }) zeichnet nicht (Bewegungsprobe bleibt schnell)', !!sp && sp.hash === s1.hash)
    await pg2.close()
    const spf = per.reduce((a, b) => a + b, 0) / per.length
    console.log(`Sekunden je Bild (rechnen + Foto, eine Seite, Wallet): ${per.map(x => x.toFixed(2)).join(' / ')}, Mittel ${spf.toFixed(2)}`)
    check('Rechenzeit unter 8 s je Bild', spf < 8, spf.toFixed(2) + ' s')
    if (spf > 3) console.log('WARNUNG: über 3 s je Bild')

    // ---- 5. Anker
    const a0 = await stateAt(pg, 0), a1 = await stateAt(pg, 1.3)
    check('Anker "rise": das Handy steigt von unten ein und steht nach 0,9 s', a0.phoneY < -5 && Math.abs(a1.phoneY) < 0.2, `y ${a0.phoneY} bei 0 s, ${a1.phoneY} bei 1,3 s`)
    const c0 = await stateAt(pg, tCard - 0.15), c1 = await stateAt(pg, tCard + 0.8)
    check('Anker "card": vorher keine Karte, danach liegt sie', !c0.cardVisible && c1.cardVisible, `${c0.cardVisible} / ${c1.cardVisible}`)
    const k0 = await stateAt(pg, tS1 - 0.15), k1 = await stateAt(pg, tS2 - 0.15), k2 = await stateAt(pg, tS2 + 0.6)
    check('Anker "stamp1"/"stamp2": Stempel 7 und 8 erscheinen erst auf ihr Wort, die ersten 6 sind da', k0.stamps[6] === 0 && k1.stamps[6] > 0 && k1.stamps[7] === 0 && k2.stamps[6] === 1 && k2.stamps[7] === 1 && k0.stamps.slice(0, 6).every(x => x === 1), JSON.stringify([k0.stamps, k1.stamps, k2.stamps]))
    const q0 = await stateAt(pg, tScan - 0.1), q1 = await stateAt(pg, tScan + 0.5), q2 = await stateAt(pg, tScan + 1.3)
    check('Anker "scan": Rahmen nach "scan", Haken 0,95 s später', !q0.scan && !q0.ok && q1.scan && !q1.ok && q2.ok, JSON.stringify([q0.scan, q0.ok, q1.scan, q1.ok, q2.ok]))

    // ---- 6. Pruefkaesten
    await seek(pg, T)
    const bx = await boxStats(pg), by = w => bx.find(it => it.what === w)
    const names = ['Wallet-Karte', 'Ladenname auf der Karte', 'Belohnungszeile', 'QR-Code']
    check('Prüfkästen: Karte, Ladenname, Belohnungszeile, QR-Code', names.every(by), bx.map(it => it.what).join(', '))
    const qr = by('QR-Code'), nm = by('Ladenname auf der Karte')
    check('Kasten "QR-Code" liegt auf dem QR-Code (mindestens 35 % helle Pixel)', !!qr && qr.bright > 0.35, qr && `${(qr.bright * 100).toFixed(0)} %`)
    check('Kasten "Ladenname" liegt auf Schrift und Logo (mindestens 4 % helle Pixel)', !!nm && nm.bright > 0.04, nm && `${(nm.bright * 100).toFixed(0)} %`)
    const card = by('Wallet-Karte'), d = await dbg(pg, 'drawnBox', 'card'), tol = 6
    check('Kasten "Wallet-Karte" umfasst alles, was die Karte zeichnet', !!card && !!d && d.pixels > 5000 && d.left >= card.left - tol && d.right <= card.right + tol && d.top >= card.top - tol && d.bottom <= card.bottom + tol,
      card && d ? `gezeichnet x ${d.left} bis ${d.right}, y ${d.top} bis ${d.bottom}; Kasten x ${Math.round(card.left)} bis ${Math.round(card.right)}, y ${Math.round(card.top)} bis ${Math.round(card.bottom)}` : 'fehlt')
    const px = await dbg(pg, 'textPx')
    check('Lesbar: Ladenname mindestens 28 px, Belohnungszeile mindestens 24 px hoch gesetzt', px.name >= 28 && px.line >= 24, JSON.stringify(px))
    const { measured, bad } = await studioChecks(studio, pg, await studio.state(pg))
    const restSafe = measured.safe.filter(s => names.includes(s.what))
    check('Ruhelage: alle vier Kästen zählen für Sperrzonen und Textabstand (data-safe)', restSafe.length === 4, restSafe.map(s => `${s.what} y ${s.top} bis ${s.bottom}`).join(', '))
    check('Prüfungen des Studios (Sperrzonen, Textabstand, Knopfspalte, ...) ohne Befund', !bad.length, bad.join(' / '))
    const all = await sampleMotion(pg, st.duration)
    check('Bewegungsprobe sieht die Kästen (sonst prüft "knopfspalte" in 3D nichts)', names.every(w => all.some(x => x.what === w)))
  } finally { await studio.close() }
}

// ================================================================ Sperrbildschirm (C1)
{
  const { studio, pg, st } = await open(LOCK)
  try {
    check('Sperrbildschirm: Seite baut ohne Fehler und Warnungen', !st.errors.length && !studio.problems.length && !st.warnings.length, [...st.errors, ...studio.problems, ...st.warnings].join(' | ').slice(0, 300))
    const msg = await pg.evaluate(() => document.querySelector('canvas.ph-canvas').phoneDebug.msg)
    check('Wortlaut aus C1: "Noch 2 Stempel bis: Gratis-Döner"', msg === 'Noch 2 Stempel bis: Gratis-Döner', msg)
    const tN = anchorT(st, 'notify'), n0 = await stateAt(pg, tN - 0.2), n1 = await stateAt(pg, tN + 0.8)
    check('Anker "notify": vorher gedimmt und ohne Benachrichtigung, danach hell und da', n0.notif === 0 && n0.lit < 0.5 && n1.notif === 1 && n1.lit === 1, JSON.stringify([n0.notif, n0.lit, n1.notif, n1.lit]))
    const T = +(Math.min(st.duration - 0.1, tN + 1.8)).toFixed(2)
    const per = []
    for (const t of [tN + 0.3, T]) { const q = Date.now(); await seek(pg, t); await pg.screenshot({ type: 'jpeg', quality: 95 }); per.push((Date.now() - q) / 1000) }
    console.log(`Sekunden je Bild (Sperrbildschirm): ${per.map(x => x.toFixed(2)).join(' / ')}`)
    const s1 = await canvasStats(pg)
    check('Sperrbildschirm nicht leer (70 % nicht Nachthimmel, helle Pixel)', !!s1 && s1.notSky > 0.7 && s1.bright > 0.01, s1 && `${(s1.notSky * 100).toFixed(1)} % / ${(s1.bright * 100).toFixed(2)} %`)
    const bx = await boxStats(pg), by = w => bx.find(it => it.what === w)
    check('Prüfkästen: Datum, Uhr, Benachrichtigung', ['Datum', 'Uhr', 'Benachrichtigung'].every(by), bx.map(it => it.what).join(', '))
    const nb = by('Benachrichtigung'), d = await dbg(pg, 'drawnBox', 'notif'), tol = 6
    check('Kasten "Benachrichtigung" umfasst die gezeichnete Benachrichtigung und ist hell', !!nb && !!d && d.pixels > 5000 && nb.bright > 0.3 && d.left >= nb.left - tol && d.right <= nb.right + tol && d.top >= nb.top - tol && d.bottom <= nb.bottom + tol,
      nb && d ? `gezeichnet x ${d.left} bis ${d.right}, y ${d.top} bis ${d.bottom}; Kasten x ${Math.round(nb.left)} bis ${Math.round(nb.right)}, y ${Math.round(nb.top)} bis ${Math.round(nb.bottom)}, hell ${(nb.bright * 100).toFixed(0)} %` : 'fehlt')
    const uhr = by('Uhr')
    check('Kasten "Uhr" liegt auf der Uhr (mindestens 15 % helle Pixel)', !!uhr && uhr.bright > 0.15, uhr && `${(uhr.bright * 100).toFixed(0)} %`)
    const px = await dbg(pg, 'textPx')
    check('Lesbar: Text der Benachrichtigung mindestens 26 px, Absender mindestens 26 px', px.body >= 26 && px.title >= 26, JSON.stringify(px))
    const { bad } = await studioChecks(studio, pg, await studio.state(pg))
    check('Sperrbildschirm: Prüfungen des Studios ohne Befund', !bad.length, bad.join(' / '))
  } finally { await studio.close() }
}

// ================================================================ Design (D1)
{
  const { studio, pg, st } = await open(DESIGN)
  try {
    check('Design: Seite baut ohne Fehler und Warnungen', !st.errors.length && !studio.problems.length && !st.warnings.length, [...st.errors, ...studio.problems, ...st.warnings].join(' | ').slice(0, 300))
    const tP = anchorT(st, 'paint'), tL = anchorT(st, 'logo')
    const d0 = await stateAt(pg, tP - 0.1), d1 = await stateAt(pg, tP + 0.7), l0 = await stateAt(pg, tL - 0.1), l1 = await stateAt(pg, tL + 0.5)
    check('Anker "paint": die graue Karte ist vorher ganz da und danach ganz weg', d0.wipe === 0 && d1.wipe === 1, `${d0.wipe} / ${d1.wipe}`)
    check('Anker "logo": vorher kein Logo, danach in voller Größe', l0.logo === 0 && l1.logo === 1, `${l0.logo} / ${l1.logo}`)
    // Graue Karte: vor "paint" ist die Karte grau (kaum Farbe), danach in den Farben des Ladens (rot-orange)
    const hue = async t => { await seek(pg, t); return pg.evaluate(() => { const b = window.STUDIO.probe().find(x => x.what === 'Wallet-Karte'), c = document.querySelector('canvas.ph-canvas'), g = document.createElement('canvas'); g.width = c.width; g.height = c.height; const x = g.getContext('2d'); x.drawImage(c, 0, 0); const d = x.getImageData(Math.round(b.left) + 20, Math.round((b.top + b.bottom) / 2), Math.round(b.right - b.left) - 40, 4).data; let warm = 0, n = 0; for (let i = 0; i < d.length; i += 4) { n++; if (d[i] > d[i + 2] + 60) warm++ } return warm / n }) }
    const w0 = await hue(tP - 0.1), w1 = await hue(tP + 0.8)
    check('Karte erst grau, nach "paint" in den Farben des Ladens', w0 < 0.05 && w1 > 0.4, `warme Pixel ${(w0 * 100).toFixed(0)} % / ${(w1 * 100).toFixed(0)} %`)
    const { bad } = await studioChecks(studio, pg, await studio.state(pg))
    check('Design: Prüfungen des Studios ohne Befund', !bad.length, bad.join(' / '))
  } finally { await studio.close() }
}

// ================================================================ 8. Ausschnitt an den Grenzen der Parameter
const LIMITS = [
  [WALLET, { push: 0, orbit: 0, angle: -24 }], [WALLET, { push: 0.25, orbit: 14, angle: 24, device: 'android' }],
  [LOCK, { push: 0.25, orbit: 14, angle: 24 }], [LOCK, { push: 0, orbit: 0, angle: -24, device: 'android' }],
  [DESIGN, { push: 0.25, orbit: 14, angle: -24, device: 'android' }]
]
for (const [base, lim] of LIMITS) {
  const sc = JSON.parse(JSON.stringify(base)); Object.assign(sc.scenes[0].params, lim)
  const tag = `${sc.scenes[0].params.mode}, ${lim.device || 'iphone'}, push ${lim.push}, orbit ${lim.orbit}, angle ${lim.angle}`
  const { studio, pg, st } = await open(sc)
  try {
    if (st.errors.length || studio.problems.length) { check(`${tag}: Seite baut`, false, [...st.errors, ...studio.problems].join(' | ').slice(0, 200)); continue }
    // Ab dem Ende des Einstiegs (Handy steht, Karte liegt bzw. Benachrichtigung ist da)
    const from = Math.max(anchorT(st, 'rise') ?? 0, 0) + 0.95, starts = ['card', 'notify'].map(n => anchorT(st, n)).filter(x => x != null).map(x => x + 0.7)
    const seen = await sweep(pg, Math.max(from, ...starts), st.duration)
    const bad = limitsOk(seen)
    check(`${tag}: alle Kästen die ganze Szene unter den Textzeilen, über 1536, ${MARGIN} px vom Rand, rechts vor x = 940`, Object.keys(seen).length >= 3 && !bad.length, bad.join('; ') || Object.entries(seen).map(([w, o]) => `${w} ${o.left}..${o.right} / ${o.top}..${o.bottom}`).join(', '))
    // Letztes Bild wirklich rechnen: das Gezeichnete liegt im Kasten
    await seek(pg, st.duration - 0.05)
    const key = sc.scenes[0].params.mode === 'lock' ? ['notif', 'Benachrichtigung'] : ['card', 'Wallet-Karte']
    const box = (await boxStats(pg)).find(it => it.what === key[1]), d = await dbg(pg, 'drawnBox', key[0]), tol = 6
    check(`${tag}: letztes Bild, Kasten "${key[1]}" liegt auf dem Gezeichneten`, !!box && !!d && d.left >= box.left - tol && d.right <= box.right + tol && d.top >= box.top - tol && d.bottom <= box.bottom + tol, box && d ? `gezeichnet ${d.left}..${d.right} / ${d.top}..${d.bottom}, Kasten ${Math.round(box.left)}..${Math.round(box.right)} / ${Math.round(box.top)}..${Math.round(box.bottom)}` : 'fehlt')
  } finally { await studio.close() }
}

// ================================================================ 9. Wortlaut, Grenzen, Warnungen
{
  const full = JSON.parse(JSON.stringify(LOCK)); full.scenes[0].params.left = 0
  const { studio, pg, st } = await open(full)
  try {
    const msg = await pg.evaluate(() => document.querySelector('canvas.ph-canvas').phoneDebug.msg)
    const lines = await pg.evaluate(() => document.querySelector('canvas.ph-canvas').phoneDebug.bodyLines)
    check('Volle Karte: "Gratis-Döner wartet auf dich" (C1), ohne einzelnes Wort in der zweiten Zeile', !st.errors.length && msg === 'Gratis-Döner wartet auf dich' && (lines.length === 1 || lines[1].split(' ').length > 1), `${msg} | ${JSON.stringify(lines)}`)
  } finally { await studio.close() }
}
for (const [label, params, re] of [
  ['"vibriert" in der Benachrichtigung bricht den Bau ab', { mode: 'lock', reward: 'Döner, es vibriert' }, /vibriert/],
  ['Unbekannte Ansicht bricht den Bau ab', { mode: 'karte' }, /"mode"/],
  ['Zu weit gedreht bricht den Bau ab', { angle: 40 }, /"angle"/]
]) {
  const sc = JSON.parse(JSON.stringify(WALLET)); Object.assign(sc.scenes[0].params, params)
  if (params.mode === 'lock') sc.scenes[0].anchors = { notify: { cap: 0, word: 1 } }
  if (params.mode === 'karte') sc.scenes[0].anchors = {}
  const studio = await openStudio({ script: sc, times: estimateTimes(normalize(sc)) })
  try { const pg = await studio.page(), st = await studio.state(pg); check(label, st.errors.some(e => re.test(e)), st.errors.join(' | ').slice(0, 200)) }
  catch (e) { check(label, re.test(e.message), e.message.slice(0, 200)) }
  finally { await studio.close() }
}
{
  const sc = JSON.parse(JSON.stringify(WALLET)); Object.assign(sc.scenes[0].params, { shop: 'Dönerhaus Morgenland am Markt', location: 'HH-ALTONA' })
  const { studio, st } = await open(sc)
  try { check('Zu langer Ladenname: Warnung statt still winziger Schrift', !st.errors.length && st.warnings.some(w => /Ladenname/.test(w)), st.warnings.join(' | ').slice(0, 200)) }
  finally { await studio.close() }
}

// ================================================================ 10. Neben iso-street auf derselben Seite
{
  const sc = { meta: { title: 'test mix', slug: 'test-mix' }, captionStyle: { mode: 'wort' }, scenes: [
    { component: 'iso-street', params: { shop: 'Döner Palast', icon: 'kebab', rival: 'Imbiss Sonne', rivalIcon: 'kebab' }, anchors: { crack: { cap: 0, word: 1 }, walk: { at: 'start', offset: 0.2 }, enter: { cap: 0, word: -1 } }, captions: [{ lines: ['Dein *Stammkunde | ist *weg.'], instant: true }] },
    WALLET.scenes[0]] }
  const { studio, pg, st } = await open(sc)
  try {
    const iso = () => pg.evaluate(() => { const c = document.querySelector('canvas.is-canvas'), g = document.createElement('canvas'); g.width = c.width; g.height = c.height; const x = g.getContext('2d'); x.drawImage(c, 0, 0); const d = x.getImageData(0, 0, c.width, c.height).data; let h = 0x811c9dc5; for (let i = 0; i < d.length; i++) { h ^= d[i]; h = Math.imul(h, 0x01000193) >>> 0 } return h.toString(16) })
    const tIso = +(st.scenes[0].e - 0.5).toFixed(2), tPh = +(st.scenes[1].s + 2).toFixed(2)
    await seek(pg, tIso); const h1 = await iso()
    await seek(pg, tPh); const p1 = await canvasStats(pg)
    await seek(pg, tIso); const h2 = await iso()
    check('Neben iso-street: Seite baut, das Handy zeichnet, und die Stadt ist danach Pixel für Pixel dieselbe', !st.errors.length && !studio.problems.length && !!p1 && p1.notSky > 0.7 && h1 === h2, `${h1} / ${h2} ${[...st.errors, ...studio.problems].join(' | ').slice(0, 200)}`)
  } finally { await studio.close() }
}

console.log(failed ? `${failed} Prüfung(en) gescheitert` : 'Alle Prüfungen bestanden')
process.exit(failed ? 1 : 0)
