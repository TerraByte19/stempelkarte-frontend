#!/usr/bin/env node
// test_wortleiste.mjs - prueft die Wortleiste oben ("progress" im Skript, "chapter" an einer Textzeile; seit
// 19.11.2026, Nachbau "zwei Cafés, eine Straße" auf Wunsch des Betreibers).
//
//   node studio/tools/test_wortleiste.mjs
//
// Was festgenagelt wird und warum:
//  1. Das Skript wird streng gelesen: "chapter" ohne "progress", "progress" ohne ein einziges "chapter", ein
//     Kapitel, das es nicht gibt, ein Wort, das es in der Textzeile nicht gibt, ein Tippfehler im Objekt und zu
//     lange Kapitelwoerter brechen mit Code 2 ab. Still uebergangen saehe man nur eine leere oder falsche Leiste.
//  2. Ohne "progress" bleibt die Stempelreihe, wie sie war: ein Stempel je Szene vor dem Schluss, keine Woerter
//     (die alten Videos haelt tools/regress.mjs Bild fuer Bild fest; hier der schnelle Blick darauf).
//  3. Mit "progress": je Kapitel ein Feld und ein Wort; unsichtbar bis zum ersten Kapitel (der Einstieg bleibt
//     frei), das Kapitel springt kurz vor seinem Wort um, sein Stempel bleibt danach stehen, Kapitel 0 dunkelt
//     die Leiste ab, das naechste Kapitel hellt sie wieder auf. Ein Kapitel auf einem bestimmten Wort ("word")
//     springt dort um, nicht am Satzanfang. Der Bericht nennt die Zeiten (state.progress).
//  4. Die Kapitelwoerter zaehlen fuer die Pruefung "schreibweise" (kein Gedankenstrich im Bild).
//  5. Die Leiste liegt unter der oberen Sperrzone und ueber den Tafeln: Mitte zwischen 220 und 250 px, unterer
//     Rand vor der Schrift einer Tafel, und sie passt in die Breite (60 px Rand).
// Kein Netz, keine Kosten, etwa eine halbe Minute.
import { normalize, estimateTimes } from '../engine/script.mjs'
import { openStudio, seek } from '../engine/render.mjs'

let failed = 0
const check = (label, ok, info = '') => { console.log(`${ok ? 'ok    ' : 'FEHLER'} ${label}${info ? ' - ' + info : ''}`); if (!ok) failed++ }
const WORDS = ['WALLET', 'VON SELBST', 'DESIGN', 'DEIN ZUG']
const num = v => ({ component: 'big-number', params: { value: String(v), label: 'Probe' } })
const mk = (caps2, extra = {}) => ({
  meta: { title: 'test leiste', slug: 'test-leiste' }, captionStyle: { mode: 'wort' }, timing: { lead: 0.3, hold: 1 },
  progress: { words: WORDS },
  scenes: [
    { parts: [
      { ...num(1), captions: [{ lines: ['Ganz frei | am Anfang.'], instant: true }, { lines: ['Mond macht | eine Sache | *anders.'], chapter: { n: 1, word: -1 } }] },
      { ...num(2), captions: [{ lines: ['In der *Nähe | von selbst.'], chapter: 2 }] },
      { ...num(3), captions: caps2 || [{ lines: ['Und bei *Sonne?'], chapter: 0 }, { lines: ['Und dein *Laden?'], chapter: 4 }] }
    ] },
    { component: 'cta-comment', captions: [{ lines: ['Lieber Mond?'], accent: 1, keep: true, mode: 'zeile' }, { role: 'cta', lines: ['Kommentiere KARTE,{Karte,}', 'und wir melden uns.'] }] }
  ],
  ...extra
})

// ---------------------------------------------------------------- 1. Skript
const throws = (label, s, re) => {
  let msg = ''
  try { normalize(s) } catch (e) { msg = e.message }
  check(label, re.test(msg), msg.slice(0, 160) || 'kein Fehler')
}
{
  const s = mk(); delete s.progress
  throws('"chapter" ohne "progress" bricht ab', s, /chapter.*nur zusammen mit "progress"/)
}
{
  const s = mk(); for (const p of s.scenes[0].parts) for (const c of p.captions) delete c.chapter
  throws('"progress" ohne "chapter" bricht ab', s, /mindestens eine Textzeile mit "chapter"/)
}
throws('Kapitel 5 bei vier Wörtern bricht ab', mk([{ lines: ['Und bei Sonne?'], chapter: 5 }]), /"n" muss eine ganze Zahl von 0 bis 4/)
throws('Wort, das es nicht gibt, bricht ab', mk([{ lines: ['Und bei Sonne?'], chapter: { n: 3, word: 7 } }]), /"word" 7 gibt es nicht/)
throws('Tippfehler im Objekt bricht ab', mk([{ lines: ['Und bei Sonne?'], chapter: { n: 3, wort: 1 } }]), /"wort" gibt es nicht/)
throws('Zu langes Kapitelwort bricht ab', mk(null, { progress: { words: ['WALLET', 'GANZ VON ALLEIN DA'] } }), /1 bis 14 Zeichen/)
throws('Nur ein Kapitelwort bricht ab', mk(null, { progress: { words: ['WALLET'] } }), /2 bis 5 Kapitelwörtern/)
check('Ein gültiges Skript wird gelesen, "chapter" steht an der Textzeile', (() => { const n = normalize(mk()); return n.progress.words.length === 4 && n.caps[1].chapter.n === 1 && n.caps[1].chapter.word === 4 })())

// ---------------------------------------------------------------- 2. Ohne "progress": Stempelreihe wie bisher
{
  const s = mk(); delete s.progress; for (const p of s.scenes[0].parts) for (const c of p.captions) delete c.chapter
  const studio = await openStudio({ script: s, times: estimateTimes(normalize(s)) })
  try {
    const pg = await studio.page(), st = await studio.state(pg)
    const r = await pg.evaluate(() => ({ cls: document.getElementById('prog').className, dots: document.querySelectorAll('#prog > .p').length, words: document.querySelectorAll('#prog b').length }))
    check('Ohne "progress": ein Stempel je Szene vor dem Schluss, keine Wörter, kein Bericht', !st.errors.length && r.cls === '' && r.dots === 1 && r.words === 0 && !st.progress, JSON.stringify(r))
  } finally { await studio.close() }
}

// ---------------------------------------------------------------- 3. bis 5. Mit "progress"
{
  const s = mk(), norm = normalize(s), times = estimateTimes(norm)
  const studio = await openStudio({ script: s, times })
  try {
    const pg = await studio.page(), st = await studio.state(pg)
    check('Seite baut ohne Fehler', !st.errors.length && !studio.problems.length, [...st.errors, ...studio.problems].join(' | ').slice(0, 200))
    const ev = st.progress && st.progress.events
    check('Bericht nennt die Kapitel mit Zeit und Wort', !!ev && ev.map(e => e.n).join() === '1,2,0,4' && ev[0].word === 'anders.', JSON.stringify(ev))
    const tAnders = times[1][4], tNaehe = times[2][0]
    check('Kapitel 1 auf "anders" (Wort 5, nicht am Satzanfang), 0,12 s davor', Math.abs(ev[0].t - (tAnders - 0.12)) < 0.002, `${ev[0].t} / ${tAnders}`)
    check('Kapitel 2 am ersten Wort seiner Textzeile, 0,12 s davor', Math.abs(ev[1].t - (tNaehe - 0.12)) < 0.002)
    const look = t => pg.evaluate(async t => {
      window.seek(t); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))
      const bar = document.getElementById('prog'), sts = [...bar.querySelectorAll('.st')]
      return { bar: +getComputedStyle(bar).opacity, words: sts.map(x => ({ o: +getComputedStyle(x.querySelector('b')).opacity, c: getComputedStyle(x.querySelector('b')).color, fill: +getComputedStyle(x.querySelector('.p i')).opacity })) }
    }, t)
    const LIL = 'rgb(185, 176, 255)'
    const a0 = await look(0.5), a1 = await look(ev[0].t + 0.5), a2 = await look(ev[1].t + 0.5), a3 = await look(ev[2].t + 0.5), a4 = await look(ev[3].t + 0.5)
    check('Vor dem ersten Kapitel unsichtbar (der Einstieg bleibt frei)', a0.bar === 0, String(a0.bar))
    check('Kapitel 1: sichtbar, sein Wort lila und hell, sein Stempel da, die anderen grau und leer', a1.bar === 1 && a1.words[0].c === LIL && a1.words[0].o === 1 && a1.words[0].fill === 1 && a1.words.slice(1).every(w => w.fill === 0 && w.o < 0.5), JSON.stringify(a1.words))
    check('Kapitel 2: Wort 1 erledigt (weiß, Stempel bleibt), Wort 2 lila', a2.words[0].c !== LIL && a2.words[0].fill === 1 && a2.words[0].o > 0.6 && a2.words[1].c === LIL && a2.words[1].fill === 1, JSON.stringify(a2.words.slice(0, 2)))
    check('Kapitel 0: Leiste abgedunkelt, kein Wort lila, Stempel bleiben', a3.bar < 0.5 && a3.words.every(w => w.c !== LIL) && a3.words[1].fill === 1, `${a3.bar}`)
    check('Kapitel 4 (Kapitel 3 übersprungen): wieder hell, Wort 4 lila, Feld 3 leer', a4.bar === 1 && a4.words[3].c === LIL && a4.words[2].fill === 0, JSON.stringify(a4.words.map(w => w.fill)))
    check('Kapitelwörter zählen für "schreibweise"', (st.texts || []).some(x => /Wortleiste/.test(x.where) && x.text === WORDS.join(' ')))
    // 5. Lage (am letzten Kapitel gemessen, die Tafel "Laden?" steht dann)
    await seek(pg, ev[3].t + 0.3)
    const geo = await pg.evaluate(() => {
      const r = e => e.getBoundingClientRect(), bar = document.getElementById('prog'), sts = [...bar.querySelectorAll('.st')]
      const ink = [...document.querySelectorAll('#caps .capw .chunk')].filter(c => +getComputedStyle(c).opacity > 0.5).flatMap(c => [...c.querySelectorAll('.w')].map(w => r(w).top))
      return { top: Math.min(...sts.map(x => r(x).top)), bottom: Math.max(...sts.map(x => r(x).bottom)), left: Math.min(...sts.map(x => r(x).left)), right: Math.max(...sts.map(x => r(x).right)), tafel: ink.length ? Math.min(...ink) : null }
    })
    const mid = (geo.top + geo.bottom) / 2
    check('Mitte unter der oberen Sperrzone (220 bis 250 px)', mid >= 220 && mid <= 250, `${mid.toFixed(1)} px`)
    check('Passt in die Breite (60 px Rand)', geo.left >= 60 && geo.right <= 1020, `${Math.round(geo.left)} bis ${Math.round(geo.right)}`)
    check('Über der Tafel, mit Luft', geo.tafel != null && geo.bottom + 20 <= geo.tafel, `Leiste bis ${Math.round(geo.bottom)}, Tafel ab ${geo.tafel && Math.round(geo.tafel)}`)
  } finally { await studio.close() }
}

console.log(failed ? `\n${failed} Prüfung(en) gescheitert` : '\nAlle Prüfungen bestanden')
process.exit(failed ? 1 : 0)
