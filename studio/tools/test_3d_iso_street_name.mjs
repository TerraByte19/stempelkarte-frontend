#!/usr/bin/env node
// test_3d_iso_street_name.mjs - prueft den Schriftzug ueber der Kreuzung in iso-street (Duell mit einer Textzeile
// "role": "name", seit 19.11.2026; Nachbau "zwei Cafés, eine Straße" auf Wunsch des Betreibers).
//
//   node studio/tools/test_3d_iso_street_name.mjs
//
// Was festgenagelt wird und warum:
//  1. Die Textzeile mit "role": "name" steht NICHT oben als Tafel: der Name soll ueber der Strasse leuchten, nicht
//     im Textbereich wie jedes andere Wort (im Vorbild steht oben gerade nichts, wenn der Name kommt).
//  2. Anker "name" liegt auf ihrem ersten Wort; vorher ist kein Schriftzug zu sehen (kein Pruefkasten, keine hellen
//     lila Pixel in seiner Flaeche), danach leuchtet er, und er zuendet wie eine Roehre (Flackern, dann an).
//  3. Der Pruefkasten liegt im Streifen unter den Textzeilen (ab y 600), links und rechts mit 60 px Rand und vor der
//     Knopfspalte (x 940), und mit Luft ueber beiden Schildern (data-apart). Gezeichnet wird nur in diesem Kasten
//     (Bild mit und ohne Schriftzug). Ohne das koennte er in eine Tafel oder unter die TikTok-Knoepfe rutschen,
//     und keine Pruefung saehe es: die Leinwand ist fuer die Pruefungen nur eine Flaeche.
//  4. Gleiches Bild, gleiche Pixel (auch auf einer zweiten Seite): der Schriftzug haengt an der Kamera, die Kamera
//     an t; ein Rest von Zustand liesse ihn im Video flackern, wo er nicht soll.
//  5. Ein Ton (thud) zum Namen; mit "tones": false keiner.
//  6. Ohne Textzeile "name" gibt es keinen Anker "name" und keinen Schriftzug (das Duell bleibt, wie es war); mit
//     "mode": "nah" oder mit Herz bricht der Bau mit einer verstaendlichen Meldung ab (Blase bzw. Herz stehen im
//     selben Streifen, und "ueberdeckung" misst in der Ruhelage, wo der Schriftzug noch aus ist).
// Kein Netz, keine Kosten, etwa eine bis zwei Minuten.
import { createHash } from 'node:crypto'
import { normalize, estimateTimes, STAGE } from '../engine/script.mjs'
import { openStudio, seek } from '../engine/render.mjs'

const base = { shop: 'Café Mond', icon: 'cup', rival: 'Café Sonne', rivalIcon: 'cup', heart: false, back: true, from: 0.9, smoke: false, push: 0.2, orbit: 12 }
const scene = (extra = {}, caps = null) => ({
  component: 'iso-street',
  params: { ...base, ...extra },
  anchors: { walk: { at: 'start', offset: -0.4 }, enter: { at: 'start', offset: 0.4 } },
  captions: caps || [{ lines: ['Und diese | eine *Sache?'] }, { role: 'name', lines: ['Stampit.'] }, { lines: ['Und dein *Laden?'] }]
})
const tail = { component: 'big-number', params: { value: '1', label: 'Probe' }, captions: [{ lines: ['Fertig.'] }] }
const mk = (sc, extra = {}) => ({ meta: { title: 'test name', slug: 'test-name' }, timing: { lead: 0.2, hold: 0.7 }, captionStyle: { mode: 'wort' }, scenes: [sc, tail], ...extra })

let failed = 0
const check = (label, ok, info = '') => { console.log(`${ok ? 'ok    ' : 'FEHLER'} ${label}${info ? ' - ' + info : ''}`); if (!ok) failed++ }
const dbg = (pg, fn, arg) => pg.evaluate(({ fn, arg }) => { const d = document.querySelector('canvas.is-canvas').isoDebug; return typeof d[fn] === 'function' ? d[fn](arg) : d[fn] }, { fn, arg })
const boxes = pg => pg.evaluate(() => window.STUDIO.probe())
// Helle lila Pixel (Leuchtschrift) und Fingerabdruck der Leinwand, auf Wunsch nur in einem Rechteck
const stats = (pg, r = null) => pg.evaluate(r => {
  const c = document.querySelector('canvas.is-canvas'), g = document.createElement('canvas'); g.width = c.width; g.height = c.height
  const x = g.getContext('2d', { willReadFrequently: true }); x.drawImage(c, 0, 0)
  const x0 = r ? Math.max(0, Math.round(r.left)) : 0, y0 = r ? Math.max(0, Math.round(r.top)) : 0
  const w = r ? Math.min(c.width, Math.round(r.right)) - x0 : c.width, h = r ? Math.min(c.height, Math.round(r.bottom)) - y0 : c.height
  const d = x.getImageData(x0, y0, w, h).data
  let hsh = 0x811c9dc5, glow = 0
  for (let i = 0; i < d.length; i += 4) {
    hsh ^= d[i]; hsh = Math.imul(hsh, 0x01000193) >>> 0
    if (d[i] > 200 && d[i + 1] > 190 && d[i + 2] > 235) glow++
  }
  return { hash: hsh.toString(16), glow: glow / (w * h) }
}, r)

// ---------------------------------------------------------------- Hauptfall
{
  const script = mk(scene())
  const studio = await openStudio({ script, times: estimateTimes(normalize(script)) })
  try {
    const a = await studio.page(), st = await studio.state(a)
    check('Seite baut ohne Fehler', !st.errors.length && !studio.problems.length, [...st.errors, ...studio.problems].join(' | ').slice(0, 200))
    const own = st.warnings.filter(w => /iso-street/.test(w))
    check('Keine Hinweise des Bausteins', !own.length, own.join(' | ').slice(0, 300))
    // 1. nicht oben als Tafel
    const top = await a.evaluate(() => [...document.querySelectorAll('#caps .capw, #caps .cap')].map(e => e.textContent).join(' | '))
    check('Die Textzeile "name" steht nicht oben als Tafel', !/Stampit/.test(top), top.slice(0, 120))
    // 2. Anker und Zuenden
    const cap = st.caps.find(c => c.role === 'name'), an = st.anchors.find(x => x.name === 'name')
    check('Anker "name" liegt auf dem ersten Wort der Textzeile "name" (0,04 s davor)', !!an && Math.abs(an.t - (cap.start - 0.04)) < 0.002, `${an && an.t} / ${cap && cap.start}`)
    const info = await dbg(a, 'name'), t0 = an.t
    check('Schriftzug hat den Text der Textzeile ohne Satzzeichen', info && info.text === 'Stampit', JSON.stringify(info))
    const on = await Promise.all([t0 - 0.05, t0 + 0.06, t0 + 0.08, t0 + 0.12, t0 + 1].map(t => dbg(a, 'nameOn', t)))
    check('Zündet wie eine Röhre: vorher aus, flackert (hell, dunkel, hell), danach an', on[0] === 0 && on[1] > 0.5 && on[2] < 0.5 && on[3] > 0.9 && on[4] > 0.85, on.map(v => v.toFixed(2)).join(' / '))
    await seek(a, t0 - 0.1)
    const before = (await boxes(a)).find(b => /^Schriftzug/.test(b.what)), signsBefore = (await boxes(a)).filter(b => /^Schild/.test(b.what))
    check('Vor dem Anker kein Prüfkasten', !before)
    const T = +(t0 + 0.8).toFixed(2)
    await seek(a, T)
    const bx = await boxes(a), nb = bx.find(b => /^Schriftzug/.test(b.what)), signs = bx.filter(b => /^Schild/.test(b.what))
    check('Nach dem Anker ein Prüfkasten "Schriftzug Stampit"', !!nb, nb ? `x ${nb.left} bis ${nb.right}, y ${nb.top} bis ${nb.bottom}` : '')
    if (nb) {
      // 3. Lage
      check('Im Streifen unter den Textzeilen (Oberkante ab 600 px)', nb.top >= 600, `${nb.top}`)
      check('60 px Rand links, rechts vor der Knopfspalte (bis 940)', nb.left >= 60 && nb.right <= 940, `${nb.left} bis ${nb.right}`)
      const minSign = Math.min(...signs.map(s => s.top))
      check('Mit Luft (12 px) über beiden Schildern', signs.length === 2 && nb.bottom + 12 <= minSign, `unten ${nb.bottom}, Schilder ab ${minSign}`)
      const minSign0 = Math.min(...signsBefore.map(s => s.top))
      check('Auch am Anfang der Fahrt (Schilder dort weiter weg) frei', nb.bottom + 12 <= minSign0, `Schilder am Anfang ab ${minSign0}`)
      const drawn = await dbg(a, 'drawnBox', 'name')
      check('Gezeichnet wird nur im Prüfkasten (Bild mit und ohne Schriftzug, 8 px Spiel)', !!drawn && drawn.left >= nb.left - 8 && drawn.right <= nb.right + 8 && drawn.top >= nb.top - 8 && drawn.bottom <= nb.bottom + 8, drawn ? `gezeichnet x ${drawn.left} bis ${drawn.right}, y ${drawn.top} bis ${drawn.bottom}` : 'nichts')
      const lit = await stats(a, nb)
      await seek(a, t0 - 0.1); const dark = await stats(a, nb)
      check('Leuchtet: helles Lila in seiner Fläche, vorher kaum', lit.glow > 0.04 && dark.glow < 0.01, `${(lit.glow * 100).toFixed(1)} % / vorher ${(dark.glow * 100).toFixed(2)} %`)
    }
    // 4. gleiche Pixel
    await seek(a, T); const s1 = await stats(a)
    await seek(a, t0 - 0.5); await seek(a, T + 0.7); await seek(a, T); const s2 = await stats(a)
    check(`Gleiches Bild (t = ${T} s) nach Sprüngen gleich`, s1.hash === s2.hash, `${s1.hash} / ${s2.hash}`)
    const b = await studio.page(); await seek(b, T); const sb = await stats(b); await b.close()
    check('Gleiches Bild auf einer zweiten Seite gleich', sb.hash === s1.hash, sb.hash)
    // 5. Ton
    const thud = st.cues.filter(c => c.name === 'thud' && Math.abs(c.t - (t0 + 0.02)) < 0.01)
    check('Ton zum Namen: thud', thud.length === 1, JSON.stringify(st.cues.filter(c => c.name === 'thud')))
  } finally { await studio.close() }
}

// ---------------------------------------------------------------- Ohne Textzeile "name", ohne Ton, mit "nah"
{
  const script = mk(scene({}, [{ lines: ['Und diese | eine *Sache?'] }, { lines: ['Und dein *Laden?'] }]))
  const studio = await openStudio({ script, times: estimateTimes(normalize(script)) })
  try {
    const a = await studio.page(), st = await studio.state(a)
    check('Ohne Textzeile "name": kein Anker "name", kein Schriftzug', !st.errors.length && !st.anchors.some(x => x.name === 'name') && (await dbg(a, 'name')) === null, st.errors.join(' | '))
  } finally { await studio.close() }
}
{
  const script = mk(scene({ tones: false }))
  const studio = await openStudio({ script, times: estimateTimes(normalize(script)) })
  try {
    const a = await studio.page(), st = await studio.state(a)
    check('"tones": false: kein Ton zum Namen', !st.errors.length && !st.cues.some(c => c.name === 'thud'), st.errors.join(' | '))
  } finally { await studio.close() }
}
{
  const script = mk(scene({ heart: true }))
  const studio = await openStudio({ script, times: estimateTimes(normalize(script)) })
  try {
    const a = await studio.page(), st = await studio.state(a)
    check('Mit Herz (selber Streifen) bricht der Bau ab und sagt warum', st.errors.some(e => /"heart": false/.test(e)), st.errors.join(' | ').slice(0, 200))
  } finally { await studio.close() }
}
{
  const script = mk(scene({ mode: 'nah', reward: 'Gratis-Kuchen', left: 2 }, [{ lines: ['In der *Nähe'] }, { role: 'name', lines: ['Stampit.'] }]))
  script.scenes[0].anchors = {}
  const studio = await openStudio({ script, times: estimateTimes(normalize(script)) })
  try {
    const a = await studio.page(), st = await studio.state(a)
    check('Mit "mode": "nah" bricht der Bau ab und sagt warum', st.errors.some(e => /role.*name.*nur im Duell/.test(e)), st.errors.join(' | ').slice(0, 200))
  } finally { await studio.close() }
}

console.log(failed ? `\n${failed} Prüfung(en) gescheitert` : '\nAlle Prüfungen bestanden')
process.exit(failed ? 1 : 0)
