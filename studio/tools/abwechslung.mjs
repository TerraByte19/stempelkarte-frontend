#!/usr/bin/env node
// abwechslung.mjs - liest die Felder der Abwechslung aus einem Skript ab und prueft sie gegen
// die letzten Videos (studio/FORMATE.md, Abschnitt 2, Regeln V1 bis V11).
//
//   node studio/tools/abwechslung.mjs felder   <ordner>
//   node studio/tools/abwechslung.mjs pruefen  <ordner> --verlauf DATEI [--ziel JJJJ-MM-TT]
//   node studio/tools/abwechslung.mjs selbsttest
//
// <ordner> ist ein Videoordner mit script.json. DATEI ist eine JSON-Liste der Videos vom Board
// (Antwort der Abfrage aus AUTOMATIK.md Schritt 6, je Eintrag { id, data } oder nur data).
// --ziel ist der Tag des neuen Videos; ohne Angabe meta.datum des Skripts.
//
// Warum es das gibt: nach der Beschwerde des Betreibers am 17.11.2026 ("fast die gleichen
// Videos die ganze Zeit") bekam jedes Video Felder wie format, einstieg und motive, und Regeln,
// welche Felder sich wiederholen duerfen. Die Gegenpruefung zeigte zwei Luecken: der Lauf trug
// die Felder selbst ein (ein Video, das "kein Bild der Naehe" vermerkt und doch shop-map zeigt,
// faellt so nicht auf), und keine Regel sah auf die Saetze. Drei Entwuerfe in neuen Formaten
// sagten wieder "Der Stempel ist sofort auf seinem Handy" und "einmal den QR-Code": mit dem
// Video vom 18.11. teilten sie 7 und 8 Gruppen aus vier Woertern, die alten Videos
// untereinander 0 bis 5. Hier werden die Felder aus den Bausteinen abgelesen, nicht geglaubt,
// und die Saetze gezaehlt.
//
// Was das Werkzeug NICHT prueft: ob eine Aussage in PRODUKT.md, Klasse 1 steht, und ob der
// Text in den alten Bogen kippt, ohne die Motive zu treffen. Das bleibt beim Ansehen.
// Ende-Codes: 0 in Ordnung | 1 Regel verletzt | 2 Aufruf oder Datei unlesbar.
import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { normalize } from '../engine/script.mjs'

const HIER = path.dirname(fileURLToPath(import.meta.url))
const STUDIO = path.resolve(HIER, '..')
class Fehler extends Error {}

// ---- Die Formate (FORMATE.md, Abschnitt 4). Der Selbsttest vergleicht diese Tabelle mit dem
// Dokument: aendert sich dort eine Schlussfrage, faellt der Unterschied hier auf.
// einstieg: erlaubte Bausteine des ersten Teils (leer = je nach Meme, HOOKS.md 3.2)
export const FORMATE = {
  F01: { kern_bild: 'zettel', schluss: 'Gleich probieren?', einstieg: ['tip-cards'], belege: ['tipps'] },
  F02: { kern_bild: 'zettel', schluss: 'Welcher zuerst?', einstieg: ['tip-cards'], belege: ['tipps'] },
  F03: { kern_bild: 'kommentar', schluss: 'Noch Fragen?', einstieg: ['comment-thread'], belege: ['ohne-app', 'stempeln', 'gestalten', 'papier'] },
  F04: { kern_bild: 'zahl', schluss: "Lohnt sich's?", einstieg: ['big-number'], belege: ['rechnung'] },
  F05: { kern_bild: 'tag', schluss: "Kennst du's?", einstieg: ['day-clock'], belege: ['stempeln'] },
  F06: { kern_bild: 'duell', schluss: 'Dein Favorit?', einstieg: ['versus-split'], belege: ['papier'] },
  F07: { kern_bild: 'meme', schluss: null, einstieg: [], belege: ['papier', 'ohne-app', 'stempeln', 'gestalten'] },
  F08: { kern_bild: 'naehe', schluss: 'Klingt interessant?', einstieg: ['lock-notification'], belege: ['naehe'] },
  F09: { kern_bild: 'kommentar', schluss: 'Alles gewusst?', einstieg: ['comment-thread'], belege: ['ohne-app', 'stempeln', 'gestalten'] },
  F10: { kern_bild: 'zahl', schluss: 'Überrascht?', einstieg: ['shop-counter', 'week-strip'], belege: ['studie'] }
}
export const BELEGE = ['ohne-app', 'stempeln', 'papier', 'naehe', 'gestalten', 'studie', 'rechnung', 'tipps']

// Fenster der Regeln (FORMATE.md 2). Zahlen = so viele der letzten Videos zaehlen.
export const FENSTER = { format: 5, formatLaden: 10, motiv: 2, einstieg: 2, kernBild: 3, schluss: 2, beleg: 2, saetze: 3, gruppen: 2, hookTage: 60, studieTage: 30, themaTage: 7, themaLadenTage: 21 }

const NAEHE = ['shop-map', 'shop-street', 'lock-notification']
const PAPIER = ['paper-card', 'guest-ghost', 'wallet-vanish', 'card-bin', 'versus-split']
const LAEDEN = ['Salon Haarscharf', 'Döner Palast', 'Eis am Markt', 'Bäckerei Morgenrot', 'Café Nordwind']

/** Alle Teile eines Skripts der Reihe nach: { component, params }. Der Schluss (cta-comment) zaehlt nicht. */
function teile(script) {
  return (script.scenes || []).flatMap(sc => Array.isArray(sc.parts) ? sc.parts : [sc]).filter(p => p && p.component !== 'cta-comment')
    .map(p => ({ component: p.component, params: p.params || {} }))
}

/** Motive aus den Bausteinen (FORMATE.md 2): naehe, papier, scan. */
export function motiveAus(parts) {
  const m = new Set()
  for (const { component: c, params: p } of parts) {
    if (NAEHE.includes(c)) m.add('naehe')
    if (PAPIER.includes(c)) m.add('papier')
    // wallet-pass: Scan-Rahmen ist Vorgabe (scan: true), Stempel kommen dazu, wenn after > before (Vorgabe 2 und 5)
    if (c === 'wallet-pass' && (p.scan !== false || (p.after ?? 5) > (p.before ?? 2))) m.add('scan')
    if (c === 'versus-split' && p.scene === 'vergessen') m.add('scan')
  }
  return ['naehe', 'papier', 'scan'].filter(x => m.has(x))
}

const woerter = s => String(s || '').toLowerCase().replace(/[^\p{L}\p{N}'’\- ]+/gu, ' ').split(/\s+/).filter(Boolean)
const gleich = s => woerter(s).join(' ')

/** Gesprochener Text ohne Schlussfrage und Aufforderung, Laeden als Platzhalter, in Woertern. */
export function rumpfWoerter(text) {
  let t = String(text || '')
  // Die Aufforderung gibt es lang ("Dann kommentiere jetzt KARTE, und wir melden uns bei dir.") und
  // kurz ("Kommentiere KARTE, und wir melden uns.": Doener-Video vom 17.11.2026 und der Plan
  // docs/plaene/deutschland-technik.md). Frueher fiel nur die lange weg. Die kurze zaehlte als Satz,
  // und der Plan teilte so mit dem Doener-Video drei Vierergruppen ("kommentiere karte und wir ...")
  // und waere an V10 gescheitert, ohne einen Satz zu wiederholen. Die letzte Aufforderung zaehlt.
  const auf = [...t.matchAll(/(?:\bDann\s+)?\bkommentiere\s+(?:jetzt\s+)?[^\s,.!?]+,?\s+und wir melden uns/gi)].pop()
  const i = auf ? auf.index : -1
  if (i >= 0) {
    t = t.slice(0, i).trimEnd()
    // die Schlussfrage davor: der letzte Satz, wenn er mit ? endet
    if (t.endsWith('?')) { const k = Math.max(t.lastIndexOf('. ', t.length - 2), t.lastIndexOf('! ', t.length - 2), t.lastIndexOf('? ', t.length - 2)); t = k >= 0 ? t.slice(0, k + 1) : '' }
  }
  for (const l of LAEDEN) t = t.split(l).join(' LADENNAME ')
  return woerter(t)
}

/** Gruppen aus n Woertern, ohne die mit dem Ladennamen. */
export function gruppen(ws, n = 4) {
  const s = new Set()
  for (let i = 0; i + n <= ws.length; i++) { const g = ws.slice(i, i + n); if (!g.includes('ladenname')) s.add(g.join(' ')) }
  return s
}

/** Felder eines Skripts: aus meta, was nur der Lauf weiss; aus den Bausteinen, was sich ablesen laesst. */
export function felderAus(script) {
  const meta = script.meta || {}, parts = teile(script)
  const norm = normalize(script)
  const ctaScene = (script.scenes || []).findIndex(sc => (Array.isArray(sc.parts) ? sc.parts[0] : sc).component === 'cta-comment')
  const cta = ctaScene >= 0 ? (script.scenes[ctaScene].parts ? script.scenes[ctaScene].parts[0] : script.scenes[ctaScene]) : null
  // Schlussfrage wie gelesen: ohne Schluesselwort-Sterne, Tafelgrenzen und gesprochene Formen in {}
  const frage = cta && cta.captions && cta.captions[0] && cta.captions[0].role !== 'cta'
    ? cta.captions[0].lines.join(' ').replace(/\{[^}]*\}/g, '').replace(/[*|]/g, '').replace(/\s+/g, ' ').trim() : ''
  const format = meta.format || 'A0'
  const f = FORMATE[format]
  const hook = norm.caps[0] ? norm.caps[0].say.join(' ') : ''
  return {
    format, kern_bild: f ? f.kern_bild : 'naehe', einstieg: parts[0] ? parts[0].component : '',
    motive: motiveAus(parts), beleg_kern: meta.beleg_kern || '', schluss: frage,
    branche: meta.branche || '', thema: meta.thema || '', meme: meta.meme || '', hook_muster: meta.hook_muster || '', studie: meta.studie || '',
    hook, text: norm.spoken
  }
}

// ---- Altbestand: Videos ohne Felder auf dem Board. Quelle ist die Tabelle in FORMATE.md, damit
// es nur eine Stelle gibt. Spalten nach ihrer Ueberschrift, nicht nach der Reihenfolge.
export function altbestand(md = readFileSync(path.join(STUDIO, 'FORMATE.md'), 'utf8')) {
  const zeilen = md.split('\n'), a = zeilen.findIndex(z => z.includes('**Altbestand**'))
  if (a < 0) throw new Fehler('FORMATE.md: Tabelle "Altbestand" nicht gefunden')
  const tab = []
  for (let i = a + 1; i < zeilen.length; i++) {
    const z = zeilen[i].trim()
    if (!z.startsWith('|')) { if (tab.length) break; continue }
    tab.push(z.slice(1, -1).split('|').map(x => x.trim().replace(/`/g, '')))
  }
  const kopf = tab[0], out = {}
  for (const r of tab.slice(2)) {
    const o = Object.fromEntries(kopf.map((k, i) => [k.toLowerCase(), r[i]]))
    out[o.ordner] = { format: o.format, kern_bild: o.kern_bild, einstieg: o.einstieg, motive: o.motive ? o.motive.split(',').map(x => x.trim()).filter(Boolean) : [], beleg_kern: o.beleg_kern, branche: o.branche, schluss: o.schluss }
  }
  return out
}

/** Ein Video vom Board vervollstaendigen: Board, dann Altbestand, dann script.json im Repo. */
function vervollstaendige(v, alt, videos) {
  const d = { ...v }
  const fehlt = k => d[k] == null || d[k] === '' || (Array.isArray(d[k]) && k !== 'motive' && !d[k].length)
  const a = alt[d.ordner]
  if (a) for (const k of Object.keys(a)) if (fehlt(k) && (k !== 'motive' || d.motive == null)) d[k] = a[k]
  const datei = d.ordner && path.join(videos, d.ordner, 'script.json')
  if (datei && existsSync(datei) && ['format', 'einstieg', 'motive', 'schluss', 'text', 'hook', 'kern_bild', 'beleg_kern', 'branche', 'meme'].some(k => k === 'motive' ? d.motive == null : fehlt(k))) {
    const s = felderAus(JSON.parse(readFileSync(datei, 'utf8')))
    for (const k of Object.keys(s)) if (k === 'motive' ? d.motive == null : fehlt(k)) d[k] = s[k]
  }
  // Ein Video im Format F07 ohne Feld meme gilt als Meme-Video (HOOKS.md 4.1); das alte Motiv papier-knick heisst papier
  if (!d.meme && d.format === 'F07') d.meme = 'F07'
  d.motive = [...new Set((d.motive || []).map(m => m === 'papier-knick' ? 'papier' : m))]
  return d
}

/** Die Videos vor ZIEL, neuestes zuerst: je Datum die hoechste Fassung, verworfene mitgezaehlt, "ersetzt" nicht. */
export function letzte(verlauf, ziel, { alt = altbestand(), videos = path.join(STUDIO, 'videos') } = {}) {
  const liste = (Array.isArray(verlauf) ? verlauf : verlauf.videos || []).map(e => e && e.data ? { id: e.id, ...e.data } : e)
    .filter(v => v && v.datum && v.datum < ziel && v.status !== 'ersetzt')
  const je = new Map()
  for (const v of liste) { const o = je.get(v.datum); if (!o || (v.version || 1) > (o.version || 1)) je.set(v.datum, v) }
  return [...je.values()].sort((a, b) => a.datum < b.datum ? 1 : -1).map(v => vervollstaendige(v, alt, videos))
}

const tageVor = (ziel, n) => { const d = new Date(ziel + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() - n); return d.toISOString().slice(0, 10) }
const fmt = f => f === 'A0' ? 'F08' : f

/**
 * Prueft ein neues Video (Felder) gegen die letzten Videos (neuestes zuerst).
 * Liefert [{ regel, ok, text }]. Fallen lassen darf der Lauf nur, was FORMATE.md 3 nennt, in dieser Reihenfolge:
 * V7, V6, V4, "themenpause" (7 Tage), V9 gegen das vorletzte Video, zuletzt V1 und V9 ganz. Nie: V2, V3, V5,
 * V8, V10, V11 und "thema-laden" (21 Tage).
 */
export function pruefeFelder(neu, vorher, ziel) {
  const W = FENSTER, out = [], r = (regel, ok, text) => out.push({ regel, ok: !!ok, text })
  const n = k => vorher.slice(0, k)
  const f = FORMATE[neu.format]
  r('format', !!f, f ? `Format ${neu.format}` : `"${neu.format}" ist kein Format (F01 bis F10)`)
  const fm = n(W.format).map(v => fmt(v.format))
  r('V1', !fm.includes(neu.format), `Format ${neu.format} gegen die letzten ${W.format}: ${fm.join(', ') || 'keine'}`)
  const fl = n(W.formatLaden).filter(v => fmt(v.format) === neu.format && v.branche === neu.branche)
  r('V1', !fl.length, `Format ${neu.format} mit ${neu.branche} in den letzten ${W.formatLaden}: ${fl.map(v => v.datum).join(', ') || 'nein'}`)
  for (const [regel, motiv] of [['V2', 'naehe'], ['V3', 'papier'], ['V8', 'scan']]) {
    if (!neu.motive.includes(motiv)) { r(regel, true, `kein Motiv ${motiv}`); continue }
    const hat = n(W.motiv).filter(v => v.motive.includes(motiv))
    r(regel, !hat.length, `Motiv ${motiv}; in den letzten ${W.motiv}: ${hat.map(v => v.datum).join(', ') || 'nein'}`)
  }
  const ein = n(W.einstieg).map(v => v.einstieg)
  r('V4', !ein.includes(neu.einstieg), `Einstieg ${neu.einstieg} gegen ${ein.join(', ') || 'keine'}`)
  if (f && f.einstieg.length) r('V4', f.einstieg.includes(neu.einstieg), `Einstieg des Formats ${neu.format}: ${f.einstieg.join(' oder ')}`)
  r('V5', !vorher[0] || vorher[0].branche !== neu.branche, `Laden ${neu.branche} gegen ${vorher[0] ? vorher[0].branche : 'keinen'}`)
  const kb = n(W.kernBild).map(v => v.kern_bild)
  r('V6', !kb.includes(neu.kern_bild), `Kern-Bild ${neu.kern_bild} gegen die letzten ${W.kernBild}: ${kb.join(', ') || 'keine'}`)
  const kl = n(W.formatLaden).filter(v => v.kern_bild === neu.kern_bild && v.branche === neu.branche)
  r('V1', !kl.length, `Kern-Bild ${neu.kern_bild} mit ${neu.branche} in den letzten ${W.formatLaden}: ${kl.map(v => v.datum).join(', ') || 'nein'}`)
  const sw = new Set(n(W.schluss).flatMap(v => woerter(v.schluss)))
  const geteilt = woerter(neu.schluss).filter(w => sw.has(w))
  r('V7', !geteilt.length, `Schlussfrage "${neu.schluss}"${geteilt.length ? ', gleiches Wort: ' + geteilt.join(', ') : ''}`)
  r('V7', woerter(neu.schluss).length >= 1 && woerter(neu.schluss).length <= 2 && /\?$/.test(neu.schluss.trim()), `Schlussfrage hat ${woerter(neu.schluss).length} Wörter (höchstens 2, mit Fragezeichen)`)
  if (f && f.schluss) r('V7', gleich(neu.schluss) === gleich(f.schluss), `Schlussfrage des Formats ${neu.format}: "${f.schluss}"`)
  r('V9', f ? f.belege.includes(neu.beleg_kern) : BELEGE.includes(neu.beleg_kern), `Kernaussage "${neu.beleg_kern}"${f ? ' (im Format erlaubt: ' + f.belege.join(', ') + ')' : ''}`)
  const bk = n(W.beleg).map(v => v.beleg_kern).filter(Boolean)
  r('V9', !bk.includes(neu.beleg_kern), `Kernaussage ${neu.beleg_kern} gegen ${bk.join(', ') || 'keine'}`)
  if (neu.studie) {
    const st = vorher.filter(v => v.datum >= tageVor(ziel, W.studieTage) && v.studie === neu.studie)
    r('V9', !st.length, `Studie ${neu.studie} in den letzten ${W.studieTage} Tagen: ${st.map(v => v.datum).join(', ') || 'nein'}`)
  }
  if (neu.format === 'F10') r('V9', /^S[1-5]$/.test(neu.studie || ''), `F10 nennt seine Studie in meta.studie (S1 bis S5): "${neu.studie || ''}"`)
  const meine = gruppen(rumpfWoerter(neu.text))
  for (const v of n(W.saetze)) {
    const g = [...gruppen(rumpfWoerter(v.text))].filter(x => meine.has(x))
    r('V10', g.length <= W.gruppen, `${g.length} gleiche Gruppen aus vier Wörtern mit dem Video vom ${v.datum}${g.length ? ': ' + g.slice(0, 8).join(' | ') : ''}`)
  }
  const grenze = tageVor(ziel, W.hookTage), alteHooks = vorher.filter(v => v.datum >= grenze && v.hook && gleich(v.hook) === gleich(neu.hook))
  r('V10', !alteHooks.length, `Hook in den letzten ${W.hookTage} Tagen: ${alteHooks.map(v => v.datum).join(', ') || 'nein'}`)
  const alle = ['naehe', 'papier', 'scan'].every(m => neu.motive.includes(m))
  r('V11', !alle, `Motive ${neu.motive.join(', ') || 'keine'} (nie alle drei: das war der alte Bogen)`)
  if (neu.format === 'F07') r('V11', !neu.motive.includes('naehe') && !neu.motive.includes('scan') && neu.motive.length <= 1, `F07 zeigt keine Nähe, keinen Scan und höchstens ein Papier-Motiv: ${neu.motive.join(', ') || 'keine'}`)
  if (neu.format === 'F08') r('V11', !neu.motive.includes('papier'), `F08 zeigt kein Papier: ${neu.motive.join(', ') || 'keine'}`)
  r('meme', neu.format === 'F07' ? !!neu.meme : !neu.meme, neu.format === 'F07' ? `F07 braucht ein Meme (meta.meme): "${neu.meme}"` : `Meme nur im Format F07: "${neu.meme || ''}"`)
  const t7 = tageVor(ziel, W.themaTage), tp = vorher.filter(v => v.datum >= t7 && v.thema && v.thema === neu.thema)
  r('themenpause', !tp.length, `Thema ${neu.thema} in den letzten ${W.themaTage} Tagen: ${tp.map(v => v.datum).join(', ') || 'nein'}`)
  const t21 = tageVor(ziel, W.themaLadenTage), tl = vorher.filter(v => v.datum >= t21 && v.thema === neu.thema && v.branche === neu.branche && neu.thema)
  r('thema-laden', !tl.length, `Thema ${neu.thema} mit ${neu.branche} in den letzten ${W.themaLadenTage} Tagen: ${tl.map(v => v.datum).join(', ') || 'nein'}`)
  return out
}

/** Weicht meta des Skripts von den abgelesenen Feldern ab? (Der Lauf uebernimmt die abgelesenen.) */
function metaAbweichung(script, fe) {
  const m = script.meta || {}, out = []
  for (const k of ['kern_bild', 'einstieg', 'schluss']) if (m[k] != null && m[k] !== fe[k]) out.push(`meta.${k} "${m[k]}", abgelesen "${fe[k]}"`)
  if (m.motive != null && [...m.motive].sort().join(',') !== fe.motive.join(',')) out.push(`meta.motive [${m.motive}], abgelesen [${fe.motive}]`)
  for (const k of ['format', 'beleg_kern', 'branche', 'thema']) if (!m[k]) out.push(`meta.${k} fehlt`)
  return out
}

function ladeSkript(ordner) {
  const f = path.join(path.resolve(ordner), 'script.json')
  if (!existsSync(f)) throw new Fehler(`${f} gibt es nicht`)
  return JSON.parse(readFileSync(f, 'utf8'))
}

function selbsttest() {
  let n = 0, schlecht = 0
  const soll = (name, ist, wert) => { n++; if (JSON.stringify(ist) !== JSON.stringify(wert)) { schlecht++; console.error(`FEHLER ${name}: ${JSON.stringify(ist)} statt ${JSON.stringify(wert)}`) } }
  // 1. Die Tabelle hier stimmt mit FORMATE.md ueberein (Schlussfrage und Kern-Bild je Format)
  const md = readFileSync(path.join(STUDIO, 'FORMATE.md'), 'utf8')
  for (const [k, f] of Object.entries(FORMATE)) {
    const abschnitt = md.split(new RegExp(`^### ${k} `, 'm'))[1]
    soll(`${k} steht in FORMATE.md`, !!abschnitt, true)
    if (!abschnitt) continue
    const teil = abschnitt.split(/^### /m)[0]
    const sch = (teil.match(/^\| Schluss \| "([^"]+)"/m) || [])[1] || null
    soll(`${k}: Schlussfrage wie in FORMATE.md`, f.schluss ? sch : null, f.schluss)
    const kb = (teil.match(/^\| Kern-Bild \| `([a-z-]+)`/m) || [])[1]
    soll(`${k}: Kern-Bild wie in FORMATE.md`, kb, f.kern_bild)
    const bk = ((teil.match(/^\| Kernaussage \| ([^|]+)\|/m) || [])[1] || '').match(/`[a-z-]+`/g)
    soll(`${k}: Kernaussagen wie in FORMATE.md`, (bk || []).map(x => x.slice(1, -1)), f.belege)
    if (f.schluss) soll(`${k}: Schlussfrage hat höchstens zwei Wörter`, woerter(f.schluss).length <= 2, true)
  }
  // Keine zwei Formate teilen ein Wort der Schlussfrage (sonst bremst V7 sie gegenseitig ohne Grund)
  const ws = Object.values(FORMATE).filter(f => f.schluss).flatMap(f => woerter(f.schluss))
  soll('Schlussfragen der Formate teilen kein Wort', ws.length, new Set(ws).size)
  // 2. Altbestand aus FORMATE.md
  const alt = altbestand(md)
  soll('Altbestand: vier alte Videos', Object.keys(alt).length, 4)
  soll('Altbestand: Salon vom 18.11. hat Scan und Kernaussage', [alt['2026-11-18-salon-karte-im-handy'].motive.includes('scan'), alt['2026-11-18-salon-karte-im-handy'].beleg_kern], [true, 'ohne-app'])
  // 3. Motive aus Bausteinen
  soll('wallet-pass ohne Angaben ist ein Scan', motiveAus([{ component: 'wallet-pass', params: {} }]), ['scan'])
  soll('wallet-pass ohne Scan und ohne neuen Stempel ist kein Scan', motiveAus([{ component: 'wallet-pass', params: { scan: false, before: 3, after: 3 } }]), [])
  soll('wallet-pass ohne Scan, aber mit neuem Stempel ist ein Scan', motiveAus([{ component: 'wallet-pass', params: { scan: false, before: 3, after: 4 } }]), ['scan'])
  soll('Duell ist Papier, Runde "vergessen" auch Scan', motiveAus([{ component: 'versus-split', params: { scene: 'regen' } }, { component: 'versus-split', params: { scene: 'vergessen' } }]), ['papier', 'scan'])
  soll('Sperrbildschirm und Karte von oben sind Nähe', motiveAus([{ component: 'lock-notification', params: {} }, { component: 'shop-map', params: {} }]), ['naehe'])
  // 4. Saetze: Aufforderung, Schlussfrage und Ladenname zaehlen nicht
  const a = rumpfWoerter('Der Stempel ist sofort auf seinem Handy. Noch Fragen? Dann kommentiere jetzt Imbiss, und wir melden uns bei dir.')
  soll('Schluss und Aufforderung fallen weg', a.join(' '), 'der stempel ist sofort auf seinem handy')
  soll('kurze Aufforderung fällt auch weg, mit Schlussfrage davor', rumpfWoerter('Nicht die von gegenüber. Willst du deine Stammkunden behalten? Kommentiere Karte, und wir melden uns.').join(' '), 'nicht die von gegenüber')
  soll('kurze Aufforderung ohne Schlussfrage (Plan deutschland-technik)', rumpfWoerter('Sei der Laden, der nicht zwanzig Jahre hinterher ist. Kommentiere KARTE, und wir melden uns.').join(' '), 'sei der laden der nicht zwanzig jahre hinterher ist')
  soll('"kommentiert" mitten im Text bleibt stehen', rumpfWoerter('Ein Kunde kommentiert: zu viele Stempel. Noch Fragen? Dann kommentiere jetzt Imbiss, und wir melden uns bei dir.').join(' '), 'ein kunde kommentiert zu viele stempel')
  soll('Ladenname zählt nicht', [...gruppen(rumpfWoerter('Bei Eis am Markt liegt sie im Handy.'))], ['liegt sie im handy'])
  // 5. Regeln an einem Verlauf: die vier alten Videos (nur ordner und datum auf dem Board)
  const verlauf = Object.keys(alt).map(o => ({ id: o + '-v1', data: { datum: o.slice(0, 10), ordner: o, version: 1, status: 'neu' } }))
  const vor = letzte(verlauf, '2026-11-19', { alt })
  soll('letzte Videos: neuestes zuerst', vor.map(v => v.datum), ['2026-11-18', '2026-11-17', '2026-11-16', '2026-11-15'])
  const gut = { format: 'F09', kern_bild: 'kommentar', einstieg: 'comment-thread', motive: [], beleg_kern: 'gestalten', schluss: 'Alles gewusst?', branche: 'doener', thema: 'stempelzahl', meme: '', hook: 'Zehn Stempel sind Pflicht?', text: 'Zehn Stempel sind Pflicht? Stimmt nicht. Wie viele es braucht, legst du selbst fest.' }
  const fehler = (x, z = '2026-11-19', v = vor) => [...new Set(pruefeFelder(x, v, z).filter(c => !c.ok).map(c => c.regel))]
  soll('ein Quiz zur Stempelzahl am 19.11. geht durch', fehler(gut), [])
  soll('F08 am 19.11.: A0 zählt als F08 (V1), Nähe am 18.11. (V2)', fehler({ ...gut, format: 'F08', kern_bild: 'naehe', einstieg: 'lock-notification', motive: ['naehe'], beleg_kern: 'naehe', schluss: 'Klingt interessant?' }).filter(x => x !== 'V4'), ['V1', 'V2', 'V6', 'V7', 'V9'])
  soll('Scan am 19.11.: der Salon vom 18.11. hatte einen (V8)', fehler({ ...gut, motive: ['scan'] }), ['V8'])
  soll('Friseur nach dem Friseur (V5)', fehler({ ...gut, branche: 'friseur' }), ['V5'])
  soll('drei Wörter in der Schlussfrage (V7)', fehler({ ...gut, schluss: 'Lohnt sich das?' }), ['V7'])
  const satz = { ...gut, text: 'Danach liegt die Karte in Apple oder Google Wallet. Der Stempel ist sofort auf seinem Handy.' }
  soll('Sätze des Videos vom 18.11. noch einmal (V10)', fehler(satz), ['V10'])
  soll('alle drei Motive (V11, dazu V2, V3, V8)', fehler({ ...gut, motive: ['naehe', 'papier', 'scan'] }).filter(x => x === 'V11'), ['V11'])
  soll('Meme außerhalb von F07', fehler({ ...gut, meme: 'M23' }), ['meme'])
  const mitF07 = [{ datum: '2026-11-20', format: 'F07', branche: 'eiscafe', kern_bild: 'meme', einstieg: 'big-number', motive: ['papier'], beleg_kern: 'papier', schluss: 'Und du?', text: '', ordner: 'x' }, ...vor]
  const f07 = { ...gut, format: 'F07', kern_bild: 'meme', einstieg: 'comment-thread', motive: ['papier'], beleg_kern: 'papier', schluss: 'Na und?', branche: 'doener', meme: 'M08' }
  soll('F07 ohne Feld meme zählt als Meme-Video', letzte([{ data: mitF07[0] }], '2026-11-21')[0].meme, 'F07')
  soll('F07 zwei Tage nach F07 (V1, V3, V6, V7 wegen "und", V9)', fehler(f07, '2026-11-21', mitF07), ['V1', 'V3', 'V6', 'V7', 'V9'])
  soll('F07 mit Karte von oben (V11)', fehler({ ...f07, motive: ['naehe'] }, '2026-11-19').includes('V11'), true)
  const h = { ...gut, hook: 'Neun Haarschnitte bei dir.' }, mitHook = [{ ...vor[0], hook: 'Neun Haarschnitte bei dir.' }, ...vor.slice(1)]
  soll('derselbe Hook innerhalb von 60 Tagen (V10)', fehler(h, '2026-11-19', mitHook), ['V10'])
  soll('Themenpause (7 Tage) und Thema mit Laden (21 Tage)', fehler({ ...gut, thema: 'kein-download', branche: 'friseur' }, '2026-11-19', [{ ...vor[0], branche: 'friseur', thema: 'kein-download' }, ...vor.slice(1)]).filter(x => x === 'themenpause' || x === 'thema-laden'), ['themenpause', 'thema-laden'])
  // 6. Felder aus einem echten Skript: das Salon-Video vom 18.11. (alter Bogen)
  const salon = felderAus(JSON.parse(readFileSync(path.join(STUDIO, 'videos', '2026-11-18-salon-karte-im-handy', 'script.json'), 'utf8')))
  soll('Salon 18.11.: abgelesene Felder', [salon.format, salon.einstieg, salon.motive, salon.schluss], ['A0', 'wallet-pass', ['naehe', 'papier', 'scan'], 'Klingt interessant?'])
  soll('Salon 18.11.: Altbestand stimmt mit den Bausteinen überein', alt['2026-11-18-salon-karte-im-handy'].motive, salon.motive)
  if (schlecht) { console.error(`abwechslung.mjs: ${schlecht} von ${n} Fällen falsch`); return 1 }
  console.log(`abwechslung.mjs: Selbsttest bestanden (${n} Fälle)`)
  return 0
}

function haupt(argv) {
  const [befehl, ...rest] = argv
  if (befehl === 'selbsttest') return selbsttest()
  const ordner = rest.find(x => !x.startsWith('--'))
  const wert = name => { const i = rest.indexOf(name); return i >= 0 ? rest[i + 1] : null }
  if (befehl === 'felder') {
    if (!ordner) throw new Fehler('Ordner fehlt')
    const s = ladeSkript(ordner), fe = felderAus(s)
    console.log(JSON.stringify({ ...fe, text: undefined, abweichung: metaAbweichung(s, fe) }, null, 1))
    return 0
  }
  if (befehl === 'pruefen') {
    if (!ordner) throw new Fehler('Ordner fehlt')
    const datei = wert('--verlauf')
    if (!datei) throw new Fehler('--verlauf DATEI fehlt (Videos vom Board als JSON, AUTOMATIK.md Schritt 6)')
    const s = ladeSkript(ordner), fe = felderAus(s), ziel = wert('--ziel') || (s.meta && s.meta.datum)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(ziel || '')) throw new Fehler('--ziel JJJJ-MM-TT fehlt (oder meta.datum im Skript)')
    let verlauf
    try { verlauf = JSON.parse(readFileSync(datei, 'utf8')) } catch (e) { throw new Fehler(`${datei}: ${e.message}`) }
    const vor = letzte(verlauf, ziel)
    const checks = pruefeFelder(fe, vor, ziel), abw = metaAbweichung(s, fe)
    const ok = checks.every(c => c.ok) && !abw.length
    console.log(JSON.stringify({ ok, ziel, felder: { ...fe, text: undefined }, letzte: vor.slice(0, FENSTER.formatLaden).map(v => `${v.datum} ${v.format} ${v.branche} ${v.einstieg} [${v.motive}] ${v.beleg_kern} "${v.schluss}"`), abweichung: abw, verletzt: checks.filter(c => !c.ok), erfuellt: checks.filter(c => c.ok).map(c => `${c.regel}: ${c.text}`) }, null, 1))
    return ok ? 0 : 1
  }
  throw new Fehler('Befehl: felder, pruefen oder selbsttest')
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = haupt(process.argv.slice(2))
  } catch (e) {
    console.error(e instanceof Fehler ? `abwechslung.mjs: ${e.message}` : e)
    process.exitCode = 2
  }
}
