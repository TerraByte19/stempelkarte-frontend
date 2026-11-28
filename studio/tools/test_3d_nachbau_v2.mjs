#!/usr/bin/env node
// test_3d_nachbau_v2.mjs - prueft die 3D-Schalter, die der Nachbau "zwei Cafés" in Fassung 2 brauchte (19.11.2026: der
// Betreiber wollte es "mehr wie er"; Fassung 1 sah aus wie unsere alten Videos). Alle sind aus, solange ein Skript sie
// nicht setzt; die Schalter der Seite (look, box, worte, partikel, timing.draft) prueft tools/test_nachbau_v2.mjs.
//
//   node studio/tools/test_3d_nachbau_v2.mjs
//
// Was festgenagelt wird und warum:
//  1. kit3d "look": "neon": die Welt ist fast schwarz (mittlere Helligkeit der Leinwand unter 45 von 255; die lila
//     Welt lag bei rund 50 und mehr, das Vorbild bei 17 bis 33). Gleiches Bild, gleiche Pixel nach Spruengen.
//  2. iso-street "camera": "descent" sinkt (steil am Anfang, flacher am Ende) und faehrt auf "pan" an den eigenen
//     Laden heran; "front" laesst den eigenen Laden links (rechts steht das Handy); "top" steht fast senkrecht;
//     "kran" beginnt flach vor dem Laden gegenueber und steht nach 2,4 s fast senkrecht. Ein falscher Name bricht ab.
//  3. "tags" und "boards": Schildchen springen auf "tags" auf und gehen mit dem Schwenk; Tafeln erst ab "boards",
//     Zeilen auf "lines" gezeichnet, weg nach "boardsOut".
//  4. "phoneUi": "lock": Handy erst schwarz, auf "uiNotify" der Sperrbildschirm mit dem Wortlaut aus C1 ("Noch 2
//     Stempel bis: ..."), nie "vibriert"; die gestrichelte Linie beginnt am leuchtenden Punkt auf der Strasse (dem
//     Kunden; der Punkt liegt im Baustein gut 10 m von der eigenen Tuer, Naehe ist nie "vor der Tuer").
//  5. "phoneUi": "message": das Fenster tippt die Nachricht Zeichen fuer Zeichen, "Gesendet" erst ab "uiSend", danach
//     Mitteilungen mit genau dieser Nachricht ueber der Strasse, alle im Bild. "SMS" in der Nachricht bricht ab (N9).
//  6. iso-shop "roof": das Haus steht bis zum Anker und ist danach weg; mit "view": "haus" steigt die Kamera dabei von
//     36 auf 46 Grad. "phoneUi": "wallet": Scanner, Blatt mit "Zu Apple Wallet hinzufügen", Wallet mit der Karte.
//     "trash": Korb erst ab "trash", Karte und E-Mail ab ihren Ankern, nach "trashDrop" im Korb verschwunden; mit
//     Kunde oder "paper" bricht der Bau ab. "standing" ueber 6 bricht ab.
//  7. phone-3d "message": die Mitteilung auf dem Sperrbildschirm ist genau die Nachricht des Ladens; "SMS", zu lang
//     oder ausserhalb von "lock" bricht ab.
// Kein Netz, keine Kosten, etwa drei bis fuenf Minuten (fuenf 3D-Strassen und zwei Laeden ohne Grafikkarte).
import { normalize, estimateTimes } from '../engine/script.mjs'
import { openStudio, seek } from '../engine/render.mjs'

let failed = 0
const check = (label, ok, info = '') => { console.log(`${ok ? 'ok    ' : 'FEHLER'} ${label}${info ? ' - ' + info : ''}`); if (!ok) failed++ }
const street = { shop: 'Café 1', icon: 'cup', accent: '#2F5BFF', rival: 'Café 2', rivalIcon: 'cup', rivalAccent: '#E58A45', ours: 'right', heart: false, walker: false, smoke: false, crowd: 12, dark: 0.5, tones: false }
const tail = { component: 'big-number', params: { value: '1', label: 'Probe' }, captions: [{ lines: ['Fertig.'] }] }
const mk = parts => ({ meta: { title: 'test 3d v2', slug: 'test-3d-v2' }, look: 'neon', timing: { lead: 0.3, hold: 0.8 }, captionStyle: { mode: 'wort', box: true }, scenes: [{ parts }, tail] })
// Zeit einstellen ohne zu zeichnen (Kamera, Schildchen, Handy und Fenster stellt der Baustein dabei trotzdem)
const at = (pg, t) => pg.evaluate(t => { window.seek(t, { paint: false }) }, t)
// Fingerabdruck und mittlere Helligkeit einer 3D-Leinwand
const canvasStats = (pg, sel) => pg.evaluate(sel => {
  const c = document.querySelector(sel), g = document.createElement('canvas'); g.width = c.width; g.height = c.height
  const x = g.getContext('2d', { willReadFrequently: true }); x.drawImage(c, 0, 0)
  const d = x.getImageData(0, 0, c.width, c.height).data
  let h = 0x811c9dc5, sum = 0
  for (let i = 0; i < d.length; i += 4) { h ^= d[i] ^ (d[i + 1] << 8) ^ (d[i + 2] << 16); h = Math.imul(h, 0x01000193) >>> 0; sum += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2] }
  return { hash: h.toString(16), mean: sum / (d.length / 4) }
}, sel)
// Debug eines bestimmten iso-street-Teils (n-te Leinwand)
const cam = (pg, n) => pg.evaluate(n => document.querySelectorAll('canvas.is-canvas')[n].isoDebug.camera(), n)
const fails = async (label, parts, re) => {
  const s = mk(parts)
  const studio = await openStudio({ script: s, times: estimateTimes(normalize(s)) })
  try { const pg = await studio.page(), st = await studio.state(pg); const msg = [...st.errors, ...studio.problems].join(' | '); check(label, re.test(msg), msg.slice(0, 180) || 'kein Fehler') } finally { await studio.close() }
}

// ---------------------------------------------------------------- iso-street: Kamera, Schildchen, Tafeln, Handy, Fenster
{
  const s = mk([
    { component: 'iso-street', params: { ...street, camera: 'descent', tags: 'CAFÉ 1,CAFÉ 2', boards: 'cup' },
      anchors: { tags: { cap: 0, word: 1 }, boards: { cap: 1, word: 0 }, lines: { cap: 1, word: 1 }, boardsOut: { cap: 2, word: 0, offset: -0.2 }, pan: { cap: 2, word: 0, offset: -0.2 } },
      captions: [{ lines: ['Zwei *Cafés.'], instant: true }, { lines: ['Gleicher Kaffee, | gleiche Preise.'] }, { lines: ['Aber eins | ist immer *voll | und gut | besucht | heute.'] }] },
    { component: 'iso-street', enter: 'kreuz', params: { ...street, camera: 'front', phoneUi: 'lock', reward: 'Gratis-Kaffee', left: 2, clock: '19:12' },
      anchors: { ui: { cap: 0, word: 0 }, uiNotify: { cap: 0, word: 3 } },
      captions: [{ lines: ['Sind sie | in der *Nähe, | erscheint sie | auf dem *Sperrbildschirm.'] }] },
    { component: 'iso-street', enter: 'kreuz', params: { ...street, camera: 'top', phoneUi: 'message', message: 'Frischer Kuchen ist da!' },
      anchors: { ui: { cap: 0, word: 0 }, uiType: { cap: 0, word: 1 }, uiSend: { cap: 0, word: 6 }, uiOut: { cap: 0, word: 7 } },
      captions: [{ lines: ['Und das Café | kann ihnen | *Nachrichten schicken, | direkt aufs *Handy.'] }] },
    { component: 'iso-street', enter: 'kreuz', params: { ...street, camera: 'kran', tags: 'CAFÉ 1,CAFÉ 2' },
      anchors: { tags: { at: 'start', offset: 0 } },
      captions: [{ lines: ['Dieses System | heißt | bei uns | ganz einfach | so.'] }] }
  ])
  const norm = normalize(s), times = estimateTimes(norm)
  const studio = await openStudio({ script: s, times })
  try {
    const pg = await studio.page(), st = await studio.state(pg)
    check('Seite baut ohne Fehler', !st.errors.length && !studio.problems.length, [...st.errors, ...studio.problems].join(' | ').slice(0, 200))
    const parts = st.scenes ? st.scenes[0].parts : null
    const P = i => parts ? parts[i] : null
    const an = (name, part) => st.anchors.find(a => a.name === name && (part == null || a.part === part))
    // 1. look neon: dunkel, gleiche Pixel
    const tm = P(0).s + 1
    await seek(pg, tm); const a1 = await canvasStats(pg, 'canvas.is-canvas')
    await seek(pg, P(2).s + 1); await seek(pg, 0.2); await seek(pg, tm); const a2 = await canvasStats(pg, 'canvas.is-canvas')
    check('"look": "neon": Welt fast schwarz (mittlere Helligkeit unter 45)', a1.mean < 45 && a1.mean > 3, a1.mean.toFixed(1))
    check('Gleiche Pixel nach Sprüngen', a1.hash === a2.hash, `${a1.hash} / ${a2.hash}`)
    // 2. Kamera "descent"
    const pan = an('pan', 1).t
    await at(pg, P(0).s + 0.01); const c0 = await cam(pg, 0)
    await at(pg, pan - 0.01); const c1 = await cam(pg, 0)
    await at(pg, P(0).e - 0.01); const c2 = await cam(pg, 0)
    const dist = c => Math.hypot(c.x, c.y, c.z)
    check('"descent": steil am Anfang (über 60 Grad), flacher am Ende (unter 53)', c0.el > 60 && c2.el < 53, `${c0.el.toFixed(1)} / ${c1.el.toFixed(1)} / ${c2.el.toFixed(1)}`)
    check('"descent": vor "pan" beide Schilder im Bild', [c1.our, c1.riv].every(([x, y]) => x > 0 && x < 1080 && y > 300 && y < 1700), JSON.stringify([c1.our, c1.riv].map(v => v.map(Math.round))))
    check('"descent": am Ende steht der eigene Laden in der Mitte, die Kamera ist näher', Math.abs(c2.our[0] - 540) < 260 && dist(c2) < dist(c0), JSON.stringify(c2.our.map(Math.round)))
    // 3. Schildchen und Tafeln
    const vis = sel => pg.evaluate(sel => [...document.querySelectorAll(sel)].map(e => +getComputedStyle(e).opacity), sel)
    const tT = an('tags', 1).t, tB = an('boards', 1).t, tL = an('lines', 1).t, tO = an('boardsOut', 1).t
    await at(pg, tT - 0.05); const g0 = await vis('.is-tag')
    await at(pg, tT + 0.5); const g1 = await vis('.is-tag')
    await at(pg, pan + 0.5); const g2 = await vis('.is-tag')
    check('"tags": vorher unsichtbar, nach dem Anker da, nach dem Schwenk weg', g0.slice(0, 2).every(o => o === 0) && g1.slice(0, 2).every(o => o > 0.9) && g2.slice(0, 2).every(o => o === 0), JSON.stringify([g0, g1, g2]))
    await at(pg, tB - 0.05); const b0 = await vis('.is-board')
    await at(pg, tL + 0.7); const b1 = await vis('.is-board')
    const drawn = await pg.evaluate(() => [...document.querySelectorAll('.is-board svg.ln path')].filter(p => !p.getAttribute('stroke-dasharray')).every(p => /^1(px)?,? 1(px)?$/.test(p.style.strokeDasharray)))
    await at(pg, tO + 0.4); const b2 = await vis('.is-board')
    check('"boards": erst ab dem Anker, Zeilen gezeichnet, nach "boardsOut" weg', b0.every(o => o === 0) && b1.every(o => o > 0.9) && drawn && b2.every(o => o === 0), JSON.stringify([b0, b1, b2, drawn]))
    // Kamera "front", "top", "kran"
    await at(pg, P(1).s + 1); const cf = await cam(pg, 1)
    check('"front": eigener Laden links der Mitte (rechts steht das Handy)', cf.our[0] < 540 && cf.our[0] > 60, cf.our.map(Math.round).join())
    await at(pg, P(2).s + 1); const ct = await cam(pg, 2)
    check('"top": fast senkrecht (über 70 Grad)', ct.el > 70, ct.el.toFixed(1))
    await at(pg, P(3).s + 0.05); const k0 = await cam(pg, 3)
    await at(pg, P(3).s + 2.45); const k1 = await cam(pg, 3)
    check('"kran": flach am Anfang (unter 45), nach 2,4 s fast senkrecht (über 70)', k0.el < 45 && k1.el > 70, `${k0.el.toFixed(1)} / ${k1.el.toFixed(1)}`)
    // 4. Sperrbildschirm
    const tU = an('ui', 2).t, tN = an('uiNotify', 2).t
    const lock = () => pg.evaluate(() => {
      const pui = document.querySelector('.pui'), dark = document.querySelector('[data-dark]'), note = document.querySelector('[data-note]'), path = document.querySelector('.pui-link path'), dot = document.querySelector('.pui-dot')
      return { pui: +getComputedStyle(pui).opacity, dark: +getComputedStyle(dark).opacity, note: note.querySelector('.bd').textContent, all: pui.textContent, d: path.getAttribute('d'), dot: dot.style.transform, link: +getComputedStyle(document.querySelector('.pui-link')).opacity }
    })
    await at(pg, tU + 0.5); const l0 = await lock()
    await at(pg, tN + 0.8); const l1 = await lock()
    check('"lock": Handy da, vor "uiNotify" schwarz, danach der Sperrbildschirm', l0.pui > 0.9 && l0.dark === 1 && l1.dark === 0, `${l0.pui} ${l0.dark} ${l1.dark}`)
    check('"lock": Wortlaut aus C1, nie "vibriert"', l1.note === 'Noch 2 Stempel bis: Gratis-Kaffee' && !/vibrier|brumm/i.test(l1.all), l1.note)
    const m = /translate\(([\d.]+)px, ([\d.]+)px\)/.exec(l1.dot), start = /^M([\d.]+) ([\d.]+)/.exec(l1.d || '')
    const ld = await pg.evaluate(() => document.querySelectorAll('canvas.is-canvas')[1].isoDebug.lockDot())
    check('"lock": der Kunde steht 9,5 bis 14 m von der eigenen Tür (nie "vor der Tür")', ld && ld.dist >= 9.5 && ld.dist <= 14, JSON.stringify(ld))
    check('"lock": der leuchtende Punkt steht links im Bild', !!m && +m[1] >= 80 && +m[1] <= 480 && +m[2] >= 700 && +m[2] <= 1450, l1.dot)
    check('"lock": Linie beginnt am leuchtenden Punkt und ist ganz da', !!m && !!start && Math.abs(+m[1] - +start[1]) < 0.5 && Math.abs(+m[2] - +start[2]) < 0.5 && l1.link === 1, `${l1.dot} / ${(l1.d || '').slice(0, 40)}`)
    // 5. Nachricht
    const tI = an('ui', 3).t, tY = an('uiType', 3).t, tS = an('uiSend', 3).t, tX = an('uiOut', 3).t
    const msg = () => pg.evaluate(() => {
      const w = document.querySelector('.pui-win'), sp = [...w.querySelectorAll('.in span')], [b1, b2] = w.querySelectorAll('.send b')
      return { win: +getComputedStyle(w).opacity, typed: sp.filter(x => +getComputedStyle(x).opacity > 0.5).map(x => x.textContent.replace(' ', ' ')).join(''), n: sp.length, send: +getComputedStyle(b1).opacity, sent: +getComputedStyle(b2).opacity, sentText: b2.textContent,
        pops: [...document.querySelectorAll('.pui-pop')].map(p => { const r = p.getBoundingClientRect(); return { o: +p.style.opacity, t: p.querySelector('.bd').textContent, x0: r.left, x1: r.right, y0: r.top } }) }
    })
    await at(pg, (tY + tS) / 2); const m0 = await msg()
    await at(pg, tS + 0.2); const m1 = await msg()
    await at(pg, tX + 1.2); const m2 = await msg()
    check('"message": Fenster da, die Nachricht tippt sich (halb getippt)', m0.win > 0.9 && m0.typed.length > 3 && m0.typed.length < m0.n && 'Frischer Kuchen ist da!'.startsWith(m0.typed), JSON.stringify(m0.typed))
    check('"message": nach "uiSend" ganz getippt und "Gesendet"', m1.typed === 'Frischer Kuchen ist da!' && m1.sent === 1 && m1.send === 0 && /^Gesendet/.test(m1.sentText), JSON.stringify({ t: m1.typed, s: m1.sent }))
    const shown = m2.pops.filter(p => p.o > 0.9)
    check('"message": danach Fenster weg, mindestens drei Mitteilungen mit genau der Nachricht, alle im Bild', m2.win === 0 && shown.length >= 3 && shown.every(p => p.t === 'Frischer Kuchen ist da!' && p.x0 >= 0 && p.x1 <= 1080 && p.y0 > 250), JSON.stringify(m2.pops.map(p => [p.o, Math.round(p.x0), Math.round(p.x1), Math.round(p.y0)])))
    await at(pg, tI - 0.2); const m3 = await msg()
    check('"message": vor "ui" kein Fenster, keine Mitteilung', m3.win === 0 && m3.pops.every(p => !(p.o > 0)), JSON.stringify(m3.win))
  } finally { await studio.close() }
}
await fails('"camera": unbekannter Weg bricht ab', [{ component: 'iso-street', params: { ...street, camera: 'flug' }, captions: [{ lines: ['Zwei *Cafés.'] }] }], /"camera" muss/)
await fails('"message" mit "SMS" bricht ab (N9)', [{ component: 'iso-street', params: { ...street, camera: 'top', phoneUi: 'message', message: 'Per SMS: Kuchen!' }, captions: [{ lines: ['Und das Café | kann ihnen | *Nachrichten schicken, | direkt aufs *Handy.'] }] }], /SMS oder WhatsApp/)

// ---------------------------------------------------------------- iso-shop: Dach, Handy, Korb; phone-3d: Nachricht
const shop = { branch: 'cafe', icon: 'cup', bubble: false, phone: false, paper: false, stamps: 10, have: 3, push: 0.1, orbit: 6, tones: false, roof: true, view: 'haus' }
{
  const s = mk([
    { component: 'iso-shop', params: { ...shop, shop: 'Café 1', accent: '#2F5BFF', start: 'counter', guests: 6, standing: 6, tone: 'kalt', phoneUi: 'wallet', reward: 'Gratis-Kaffee' },
      anchors: { roof: { cap: 0, word: 0, offset: 0.2 }, ui: { cap: 1, word: 0 }, uiAdd: { cap: 1, word: 2 }, uiCard: { cap: 1, word: 4 }, uiNoApp: { cap: 2, word: 0 } },
      captions: [{ lines: ['Es hat | ein *System.'] }, { lines: ['Die Gäste | scannen einen | *QR-Code, | und fertig.'] }, { lines: ['Nichts herunterladen.'] }] },
    { component: 'iso-shop', enter: 'kreuz', params: { ...shop, shop: 'Café 2', accent: '#E58A45', start: 'none', trash: true, tone: 'warm' },
      anchors: { roof: { cap: 0, word: 0, offset: 0.2 }, trash: { cap: 1, word: 1 }, trashCard: { cap: 1, word: 3 }, trashMail: { cap: 1, word: 5 }, trashDrop: { cap: 1, word: 8 } },
      captions: [{ lines: ['Gegenüber?'] }, { lines: ['Da gibt\'s noch | Papierkarten | und E-Mails, | die im **Müll | landen.'] }] },
    { component: 'phone-3d', enter: 'kreuz', params: { mode: 'lock', shop: 'Café 1', icon: 'cup', message: 'Frischer Kuchen ist da!', tones: false },
      captions: [{ lines: ['Eine *Nachricht | vom Café.'] }] }
  ])
  const studio = await openStudio({ script: s, times: estimateTimes(normalize(s)) })
  try {
    const pg = await studio.page(), st = await studio.state(pg)
    check('Läden bauen ohne Fehler', !st.errors.length && !studio.problems.length, [...st.errors, ...studio.problems].join(' | ').slice(0, 200))
    const an = (name, part) => st.anchors.find(a => a.name === name && (part == null || a.part === part))
    const dbg = (n, fn) => pg.evaluate(({ n, fn }) => document.querySelectorAll('canvas.ish-canvas, canvas[class*="ish"]')[n].isoShop[fn](), { n, fn })
    const shops = await pg.evaluate(() => document.querySelectorAll('canvas').length)
    // 6. Dach
    const tR = an('roof', 1).t
    await at(pg, tR - 0.1); const r0 = await dbg(0, 'cover'), e0 = await dbg(0, 'camEl')
    await at(pg, tR + 1.3); const r1 = await dbg(0, 'cover'), e1 = await dbg(0, 'camEl')
    check('"roof": Haus steht bis zum Anker, danach weg', r0 && r0.visible && r0.y === 0 && r1 && !r1.visible, JSON.stringify([r0, r1]))
    check('"view": "haus" mit "roof": Kamera steigt von rund 36 auf rund 46 Grad', e0 < 39 && e1 > 43, `${e0} / ${e1}`)
    // Handy mit Wallet
    const pane = () => pg.evaluate(() => Object.fromEntries([...document.querySelectorAll('[data-pane]')].map(p => [p.dataset.pane, +getComputedStyle(p).opacity])))
    const tU = an('ui', 1).t, tA = an('uiAdd', 1).t, tC = an('uiCard', 1).t, tN = an('uiNoApp', 1).t
    await at(pg, tU + 0.2); const p0 = await pane()
    await at(pg, tA + 0.2); const p1 = await pane(), btn = await pg.evaluate(() => document.querySelector('.pui-btn').textContent)
    await at(pg, tC + 0.6); const p2 = await pane(), crd = await pg.evaluate(() => document.querySelector('[data-pane="card"] .pui-head .c').textContent)
    await at(pg, tN + 0.5); const na = await pg.evaluate(() => +getComputedStyle(document.querySelector('.pui-noapp')).opacity)
    check('"phoneUi": "wallet": Scanner, dann Blatt mit "Zu Apple Wallet hinzufügen", dann Wallet mit 3/10, dann kein Download', p0.scan === 1 && p1.add === 1 && /Zu Apple Wallet hinzufügen/.test(btn) && p2.card === 1 && crd === '3/10' && na === 1, JSON.stringify({ p0, p1, p2, crd, na }))
    // Korb
    const T = n => an(n, 2).t
    await at(pg, T('trash') - 0.05); const k0 = await dbg(1, 'trash')
    await at(pg, T('trashMail') + 0.5); const k1 = await dbg(1, 'trash')
    await at(pg, T('trashDrop') + 0.6); const k2 = await dbg(1, 'trash')
    check('"trash": Korb erst ab dem Anker, Karte und E-Mail schweben, nach "trashDrop" im Korb verschwunden', k0.bin === 0 && !k0.card && k1.bin === 1 && k1.card && k1.mail && !k2.card && !k2.mail && k2.bin === 1, JSON.stringify([k0, k1, k2]))
    // 7. phone-3d
    const msg = await pg.evaluate(() => { const d = [...document.querySelectorAll('canvas')].map(c => c.phoneDebug).find(Boolean); return d ? { msg: d.msg, mode: d.mode } : null })
    check('phone-3d "message": die Mitteilung ist genau die Nachricht des Ladens', msg && msg.msg === 'Frischer Kuchen ist da!' && msg.mode === 'lock', JSON.stringify(msg && { m: msg.msg, mode: msg.mode, n: shops }))
  } finally { await studio.close() }
}
await fails('"trash" mit Kunde bricht ab', [{ component: 'iso-shop', params: { ...shop, shop: 'Café 2', accent: '#E58A45', start: 'counter', trash: true }, captions: [{ lines: ['Im Müll.'] }] }], /"trash".*"start": "none"/)
await fails('"standing" über 6 bricht ab', [{ component: 'iso-shop', params: { ...shop, shop: 'Café 2', accent: '#E58A45', start: 'counter', standing: 7 }, captions: [{ lines: ['Voll.'] }] }], /"standing" muss/)
await fails('phone-3d "message" mit "SMS" bricht ab', [{ component: 'phone-3d', params: { mode: 'lock', shop: 'Café 1', icon: 'cup', message: 'Neue SMS vom Café' }, captions: [{ lines: ['Eine Nachricht.'] }] }], /SMS oder WhatsApp/)
await fails('phone-3d "message" außerhalb von "lock" bricht ab', [{ component: 'phone-3d', params: { mode: 'wallet', shop: 'Café 1', icon: 'cup', message: 'Hallo!' }, captions: [{ lines: ['Eine Karte | im *Handy.'] }] }], /nur mit "mode": "lock"/)
await fails('phone-3d "message" über 60 Zeichen bricht ab', [{ component: 'phone-3d', params: { mode: 'lock', shop: 'Café 1', icon: 'cup', message: 'x'.repeat(61) }, captions: [{ lines: ['Eine Nachricht.'] }] }], /1 bis 60 Zeichen/)

console.log(failed ? `\n${failed} Prüfung(en) gescheitert` : '\nAlle Prüfungen bestanden')
process.exit(failed ? 1 : 0)
