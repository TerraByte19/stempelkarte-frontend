#!/usr/bin/env node
// test_nachbau_v2.mjs - prueft die Schalter der Seite, die der Nachbau "zwei Cafés" in Fassung 2 brauchte (19.11.2026:
// der Betreiber sah in Fassung 1 "unsere Videos von vorher" und wollte es "mehr wie er"). Alle sind aus, solange ein
// Skript sie nicht setzt; die 3D-Schalter prueft tools/test_3d_nachbau_v2.mjs.
//
//   node studio/tools/test_nachbau_v2.mjs
//
// Was festgenagelt wird und warum:
//  1. "timing.draft" (Entwurf ohne Stimme): eigenes Tempo je Wort, eigene Pause, und "gapBefore" zaehlt als Pause
//     vor seiner Textzeile. Ohne "draft" schaetzt der Entwurf genau wie vorher (0,36 s je Wort, 0,5 s Pause, gapBefore
//     unbeachtet). Vorher lag der Entwurf des Nachbaus rund 6 s hinter dem Vorbild, und Kamerafahrten an Woertern
//     liessen sich nicht gegen dessen Sekunden pruefen. Tippfehler im Objekt brechen ab (Code 2).
//  2. "look": "neon": Buehne und Seite bekommen die Klasse (fast schwarzer Grund); ohne "look" keine Klasse, der
//     Grund bleibt lila. Ein unbekannter Name bricht ab, statt still lila zu bleiben.
//  3. "captionStyle.box": weisse, gleich grosse Woerter; *Wort im blauen Kasten (#1842EA), **Wort im orangen
//     (#D8963C); "/" bricht in die zweite Zeile der Tafel; mit "instant" steht nur die erste Zeile der ersten Tafel
//     ab Bild 0. Nur zusammen mit "mode": "wort" (sonst Abbruch), "box" muss true/false sein.
//  4. "progress.style": "worte": nur gesperrte Woerter mit Punkten dazwischen, keine Stempelfelder; nur das aktuelle
//     Kapitel leuchtet blau (#8AA2FC), erledigte werden wieder grau; Kapitel 0 laesst die Leiste stehen (alle grau),
//     Kapitel -1 blendet sie aus. Unbekannter Stil bricht ab.
//  5. cta-comment "look": "partikel": Stichwort riesig, Leinwand mit Partikeln, die je Bild nur an t haengt (gleiche
//     Pixel nach Spruengen hin und zurueck); unbekannter Look bricht ab.
// Kein Netz, keine Kosten, etwa eine Minute.
import { createHash } from 'node:crypto'
import { normalize, estimateTimes, TIMING } from '../engine/script.mjs'
import { openStudio, seek } from '../engine/render.mjs'

let failed = 0
const check = (label, ok, info = '') => { console.log(`${ok ? 'ok    ' : 'FEHLER'} ${label}${info ? ' - ' + info : ''}`); if (!ok) failed++ }
const throws = (label, s, re) => {
  let msg = ''
  try { normalize(s) } catch (e) { msg = e.message }
  check(label, re.test(msg), msg.slice(0, 160) || 'kein Fehler')
}
const num = v => ({ component: 'big-number', params: { value: String(v), label: 'Probe' } })
const WORDS = ['DIE KARTE', 'IN DER NÄHE', 'NACHRICHTEN', 'KOMMENTAR']
const mk = (extra = {}, ctaParams = { look: 'partikel', logo: false }) => ({
  meta: { title: 'test v2', slug: 'test-v2' }, timing: { lead: 0.3, hold: 1.2, maxGap: 0.5 },
  captionStyle: { mode: 'wort', box: true }, look: 'neon',
  progress: { words: WORDS, style: 'worte' },
  scenes: [
    { parts: [
      { ...num(1), captions: [{ lines: ['Gleiche Straße. / Zwei *Cafés.'], instant: true }, { lines: ['Es hat | ein *System.'], chapter: { n: 1, word: -1 } }] },
      { ...num(2), captions: [{ lines: ['In der *Nähe | von selbst.'], chapter: 2, gapBefore: 0.9 }] },
      { ...num(3), captions: [{ lines: ['Die landen | im **Müll.'], chapter: 0 }, { lines: ['Und *du?'], chapter: 4 }] }
    ] },
    { component: 'cta-comment', params: ctaParams, captions: [{ role: 'cta', lines: ['Kommentiere KARTE,{Karte,}', 'und wir melden uns.'], chapter: -1 }] }
  ],
  ...extra
})

// ---------------------------------------------------------------- 1. timing.draft
{
  const plain = mk(); delete plain.timing.maxGap; delete plain.scenes[0].parts[1].captions[0].gapBefore
  const n0 = normalize(plain), t0 = estimateTimes(n0)
  // Erwartet nach der alten Formel (0,36 s je Wort, 0,5 s Pause, 0,35 s mehr zwischen Szenen)
  let t = 0.3; const old = n0.caps.map((c, i) => { if (i > 0) t += TIMING.capPause + (n0.caps[i - 1].scene !== c.scene ? TIMING.scenePause : 0); const row = c.words.map((_, k) => +(t + k * TIMING.step).toFixed(3)); t = row[row.length - 1] + TIMING.step; return row })
  check('Ohne "draft": Schätzung wie vorher', JSON.stringify(t0) === JSON.stringify(old))
  const ig = mk(); delete ig.timing.draft
  check('Ohne "draft": "gapBefore" ändert die Schätzung nicht (wie vorher)', JSON.stringify(estimateTimes(normalize(ig))) === JSON.stringify(estimateTimes(normalize({ ...ig, scenes: JSON.parse(JSON.stringify(ig.scenes).replace('"gapBefore":0.9,', '')) }))))
  const s = mk({ timing: { lead: 0.3, hold: 1.2, maxGap: 0.5, draft: { step: 0.25, pause: 0.2 } } }), n = normalize(s), tt = estimateTimes(n)
  const end = row => row[row.length - 1] + 0.25
  check('"draft.step": 0,25 s je Wort', Math.abs(tt[0][1] - tt[0][0] - 0.25) < 1e-6, String(tt[0]))
  check('"draft.pause": 0,2 s zwischen zwei Textzeilen', Math.abs(tt[1][0] - end(tt[0]) - 0.2) < 1e-3, `${tt[1][0]} / ${end(tt[0])}`)
  check('"gapBefore" (0,9) ist mit "draft" die Pause vor seiner Textzeile', Math.abs(tt[2][0] - end(tt[1]) - 0.9) < 1e-3, `${tt[2][0]} / ${end(tt[1])}`)
  throws('Tippfehler in "draft" bricht ab', mk({ timing: { lead: 0.3, draft: { stepp: 0.3 } } }), /"stepp" gibt es nicht/)
  throws('"draft.step" außerhalb 0,15 bis 0,8 bricht ab', mk({ timing: { lead: 0.3, draft: { step: 2 } } }), /draft.step/)
  throws('"draft" als Zahl bricht ab', mk({ timing: { lead: 0.3, draft: 0.3 } }), /muss ein Objekt sein/)
}

// ---------------------------------------------------------------- Skript: look, box, worte, partikel
throws('Unbekannter "look" bricht ab', mk({ look: 'lila' }), /"look" muss/)
throws('"box" ohne Modus "wort" bricht ab', mk({ captionStyle: { mode: 'zeile', box: true } }), /nur zusammen mit "mode": "wort"/)
throws('"box" als Text bricht ab', mk({ captionStyle: { mode: 'wort', box: 'ja' } }), /true oder false/)
{
  const s = mk(); s.scenes[0].parts[0].captions[0].lines = ['/ Gleiche Straße.']
  throws('"/" ohne Wort davor bricht ab', s, /braucht ein Wort davor/)
}
throws('Unbekannter Leistenstil bricht ab', mk({ progress: { words: WORDS, style: 'punkte' } }), /"progress.style" muss/)
{
  const s = mk(); s.scenes[0].parts[2].captions[0].chapter = -2
  throws('Kapitel -2 bricht ab', s, /von -1 bis 4/)
}
check('Ohne "look" gilt "standard"', normalize({ ...mk(), look: undefined }).look === 'standard')
{
  const n = normalize(mk()), c = n.caps[0]
  check('"box": **Wort warm, *Wort nur blau, "/" beginnt eine Zeile', n.caps[3].warm.join() === 'false,false,false,true' && c.key.join() === 'false,false,false,true' && c.brk.join() === 'false,false,true,false', JSON.stringify({ warm: n.caps[3].warm, key: c.key, brk: c.brk }))
}

// ---------------------------------------------------------------- 2. bis 5. auf der Seite
const pix = (pg, sel) => pg.evaluate(sel => {
  const c = document.querySelector(sel); if (!c) return null
  const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data
  let h = 0x811c9dc5, lit = 0
  for (let i = 0; i < d.length; i += 4) { h ^= d[i] ^ (d[i + 2] << 8); h = Math.imul(h, 0x01000193) >>> 0; if (d[i + 2] > 180 && d[i + 3] > 100) lit++ }
  return { hash: h.toString(16), lit }
}, sel)
{
  const s = mk(), norm = normalize(s), times = estimateTimes(norm)
  const studio = await openStudio({ script: s, times })
  try {
    const pg = await studio.page(), st = await studio.state(pg)
    check('Seite baut ohne Fehler', !st.errors.length && !studio.problems.length, [...st.errors, ...studio.problems].join(' | ').slice(0, 200))
    // 2. look
    const cls = await pg.evaluate(() => ({ stage: document.getElementById('stage').className, html: document.documentElement.className, bg: getComputedStyle(document.body).backgroundColor }))
    check('"look": "neon": Bühne und Seite tragen die Klasse, Grund fast schwarz', /look-neon/.test(cls.stage) && /look-neon/.test(cls.html) && cls.bg === 'rgb(3, 4, 10)', JSON.stringify(cls))
    // 3. Tafeln
    await seek(pg, 0.01)
    const b0 = await pg.evaluate(() => {
      const ch = document.querySelector('#caps .capw.capb .chunk'), rows = [...ch.querySelectorAll('.row')]
      return { rows: rows.length, first: [...rows[0].querySelectorAll('.w')].map(w => +getComputedStyle(w).opacity), second: [...rows[1].querySelectorAll('.w')].map(w => +getComputedStyle(w).opacity), chunk: +getComputedStyle(ch).opacity }
    })
    check('"box" mit "instant": zwei Zeilen, nur die erste steht ab Bild 0', b0.rows === 2 && b0.chunk === 1 && b0.first.every(o => o === 1) && b0.second.every(o => o === 0), JSON.stringify(b0))
    const cap = st.caps.find(c => c.id === 's1a.2')
    await seek(pg, cap.start + 1.2)
    const k = await pg.evaluate(() => [...document.querySelectorAll('#caps .capb .w.key')].map(w => ({ t: w.textContent, bg: getComputedStyle(w).backgroundColor, c: getComputedStyle(w).color, warm: w.classList.contains('warm') })))
    const blue = k.find(x => x.t === 'System.'), warm = k.find(x => x.t === 'Müll.')
    check('*Wort im blauen Kasten, weiß', blue && blue.bg === 'rgb(24, 66, 234)' && blue.c === 'rgb(255, 255, 255)', JSON.stringify(blue))
    check('**Wort im orangen Kasten, dunkle Schrift', warm && warm.warm && warm.bg === 'rgb(216, 150, 60)' && warm.c === 'rgb(23, 18, 12)', JSON.stringify(warm))
    const sizes = await pg.evaluate(() => [...new Set([...document.querySelectorAll('#caps .capb .w')].map(w => w.dataset.size))])
    check('Alle Wörter einer Tafel gleich groß (84 px)', sizes.length === 1 && +sizes[0] === 84, sizes.join())
    // 4. Leiste
    const ev = st.progress.events
    check('Bericht nennt den Stil "worte" und die Kapitel 1, 2, 0, 4, -1', st.progress.style === 'worte' && ev.map(e => e.n).join() === '1,2,0,4,-1', JSON.stringify(ev.map(e => e.n)))
    const look = t => pg.evaluate(async t => {
      window.seek(t); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))
      const bar = document.getElementById('prog')
      return { bar: +getComputedStyle(bar).opacity, cls: bar.className, dots: bar.querySelectorAll('.p').length, seps: bar.querySelectorAll('.sep').length, words: [...bar.querySelectorAll('b')].map(b => getComputedStyle(b).color) }
    }, t)
    const BL = 'rgb(138, 162, 252)'
    const w1 = await look(ev[0].t + 0.5), w2 = await look(ev[1].t + 0.5), w0 = await look(ev[2].t + 0.5), w4 = await look(ev[3].t + 0.5), wx = await look(ev[4].t + 0.5)
    check('"worte": keine Stempelfelder, Punkte zwischen den Wörtern', /worte/.test(w1.cls) && w1.dots === 0 && w1.seps === WORDS.length - 1, JSON.stringify(w1))
    check('Kapitel 1 leuchtet blau, die anderen nicht', w1.bar === 1 && w1.words[0] === BL && w1.words.slice(1).every(c => c !== BL), w1.words.join(' '))
    check('Kapitel 2: nur Wort 2 blau, Wort 1 wieder grau', w2.words[1] === BL && w2.words[0] !== BL, w2.words.join(' '))
    check('Kapitel 0: Leiste bleibt stehen, kein Wort blau', w0.bar === 1 && w0.words.every(c => c !== BL), `${w0.bar} ${w0.words.join(' ')}`)
    check('Kapitel 4 blau', w4.words[3] === BL && w4.words.slice(0, 3).every(c => c !== BL))
    check('Kapitel -1: Leiste weg', wx.bar === 0, String(wx.bar))
    // 5. Partikel
    const ctaT = st.caps.find(c => c.role === 'cta').start + 1
    await seek(pg, ctaT)
    const word = await pg.evaluate(() => { const w = document.querySelector('.pkw'); return w && { t: w.textContent, fs: parseFloat(getComputedStyle(w).fontSize), o: +getComputedStyle(w).opacity } })
    check('"partikel": Stichwort riesig (über 150 px) und sichtbar', word && word.t === 'KARTE' && word.fs > 150 && word.o > 0.9, JSON.stringify(word))
    const p1 = await pix(pg, '.pk-cv')
    await seek(pg, ctaT - 0.7); await seek(pg, 0.5); await seek(pg, ctaT)
    const p2 = await pix(pg, '.pk-cv')
    check('Partikel: Leinwand nicht leer, gleiche Pixel nach Sprüngen', p1 && p1.lit > 5000 && p1.hash === p2.hash, `${p1 && p1.lit} ${p1 && p1.hash} / ${p2 && p2.hash}`)
    await seek(pg, ctaT + 0.5)
    const p3 = await pix(pg, '.pk-cv')
    check('Partikel bewegen sich (anderes Bild 0,5 s später)', p3.hash !== p1.hash)
  } finally { await studio.close() }
}
// Ohne "look", "box", "worte", "partikel": nichts davon auf der Seite
{
  const s = mk({ captionStyle: { mode: 'wort' }, progress: { words: WORDS } }, {}); delete s.look
  s.scenes[0].parts[0].captions[0].lines = ['Gleiche Straße.', 'Zwei *Cafés.']
  s.scenes[0].parts[2].captions[0].lines = ['Die landen | im *Müll.']
  s.scenes[1].captions[0].chapter = 4
  const studio = await openStudio({ script: s, times: estimateTimes(normalize(s)) })
  try {
    const pg = await studio.page(), st = await studio.state(pg)
    const r = await pg.evaluate(() => ({ stage: document.getElementById('stage').className, html: document.documentElement.className, capb: document.querySelectorAll('.capb').length, worte: document.getElementById('prog').classList.contains('worte'), dots: document.querySelectorAll('#prog .p').length, pk: document.querySelectorAll('.pk-cv').length }))
    check('Ohne die Schalter: keine Klasse "look-", keine Kasten-Tafeln, Stempelleiste, Schlussbild mit Blase', !st.errors.length && !/look-/.test(r.stage + r.html) && r.capb === 0 && !r.worte && r.dots === WORDS.length && r.pk === 0, JSON.stringify(r))
  } finally { await studio.close() }
}

console.log(failed ? `\n${failed} Prüfung(en) gescheitert` : '\nAlle Prüfungen bestanden')
process.exit(failed ? 1 : 0)
