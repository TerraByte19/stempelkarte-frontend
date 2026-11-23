#!/usr/bin/env node
// beitrag.mjs - prueft den Beitragstext eines Videos (Feld "caption" auf dem Board).
//
//   node studio/tools/beitrag.mjs hashtags   --branche cafe|friseur|doener|eiscafe
//   node studio/tools/beitrag.mjs pruefen    --text DATEI --branche B --stichwort WORT [--hook "erster Satz"]
//   (--hook: captions[0].text aus out/report.json, also ohne * und |)
//   node studio/tools/beitrag.mjs selbsttest
//
// Warum es das gibt: der Betreiber kopiert den Text vom Board und postet ihn mit
// Metricool auf Instagram, Facebook und TikTok zugleich. Instagram nimmt
// hoechstens 5 Hashtags; ein sechster laesst den Beitrag dort scheitern oder
// wirft Hashtags weg. Ein Geviertstrich, ein fremdes Konto mit @ oder ein
// anderes Stichwort als im Video faellt erst auf, wenn der Beitrag draussen ist.
// Der unbeaufsichtigte Lauf schreibt den Text jeden Tag neu; zaehlen und
// vergleichen soll er nicht im Kopf (studio/AUTOMATIK.md, Abschnitt 6.6).
//
// Was das Werkzeug NICHT prueft: ob jeder Satz von PRODUKT.md, Klasse 1,
// gedeckt ist. Das bleibt Sache dessen, der den Text schreibt.
//
// Die Regeln kommen aus studio/state/konfig.json, Abschnitt "beitrag".
// Ende-Codes: 0 in Ordnung | 1 Regel verletzt | 2 Aufruf oder Datei unlesbar.
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HIER = path.dirname(fileURLToPath(import.meta.url))
const KONFIG = path.join(HIER, '..', 'state', 'konfig.json')

class Fehler extends Error {}

function regeln(konfig) {
  const b = konfig && konfig.beitrag
  if (!b || !Array.isArray(b.hashtags) || !Array.isArray(b.hashtags_immer) || !b.hashtags_je_branche) throw new Fehler('konfig.json: Abschnitt "beitrag" fehlt oder ist unvollständig')
  return b
}

/** Die fuenf Hashtags eines Videos: zuerst die zwei der Branche, dann die festen. */
export function hashtagsFuer(b, branche) {
  const paar = b.hashtags_je_branche[branche]
  if (!Array.isArray(paar)) throw new Fehler(`unbekannte Branche "${branche}" (bekannt: ${Object.keys(b.hashtags_je_branche).join(', ')})`)
  return [...paar, ...b.hashtags_immer]
}

// Buchstaben und Ziffern, klein, ohne Satzzeichen und Emojis: so laesst sich der
// Anfang des Hooks mit der ersten Zeile vergleichen, auch wenn dort ein Emoji steht.
const kern = s => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()

/**
 * Prueft einen Text. erwartet = die fuenf Hashtags in dieser Reihenfolge.
 * Liefert { ok, zeichen, zeilen, hashtags, fehler }.
 */
export function pruefe(text, { b, erwartet, stichwort, hook }) {
  const fehler = []
  const t = String(text ?? '').replace(/\r\n?/g, '\n').trim()
  const teile = t.split(/\n[ \t]*\n/)
  const tagsZeile = teile.length > 1 ? teile[teile.length - 1].trim() : ''
  const rumpf = teile.length > 1 ? teile.slice(0, -1).join('\n\n').trim() : t
  const zeilen = rumpf ? rumpf.split('\n').map(z => z.trim()) : []
  const zeichen = [...rumpf].length
  if (!rumpf) fehler.push('Der Text ist leer.')
  if (!tagsZeile) fehler.push('Es fehlt die Zeile mit den Hashtags nach einer Leerzeile.')
  if (zeichen > b.max_zeichen_ohne_hashtags) fehler.push(`Vor den Hashtags stehen ${zeichen} Zeichen, erlaubt sind höchstens ${b.max_zeichen_ohne_hashtags}.`)
  // Geviertstrich U+2014 und Halbgeviertstrich U+2013; die Meldung nennt sie nur in Worten
  if (/[\u2014\u2013]/.test(t)) fehler.push('Ein langer oder halblanger Gedankenstrich steht im Text. Normale Bindestriche nehmen.')
  if (/#/.test(rumpf)) fehler.push('Hashtags gehören nur in die letzte Zeile.')
  if (/@/.test(t)) fehler.push('Ein @ steht im Text. Kein Konto nennen.')
  if (/https?:|www\./i.test(t)) fehler.push('Ein Link steht im Text.')
  const tags = tagsZeile ? tagsZeile.split(/\s+/).filter(Boolean) : []
  if (tags.some(x => !/^#[\p{L}\p{N}_]+$/u.test(x))) fehler.push(`In der letzten Zeile steht etwas anderes als Hashtags: "${tagsZeile}".`)
  if (tags.length !== b.hashtags_anzahl) fehler.push(`Es sind ${tags.length} Hashtags, es müssen genau ${b.hashtags_anzahl} sein (Grenze von Instagram).`)
  if (new Set(tags.map(x => x.toLowerCase())).size !== tags.length) fehler.push('Ein Hashtag steht doppelt.')
  const fremd = tags.filter(x => !b.hashtags.includes(x))
  // Feste Regel des Betreibers (23.11.2026): ein verbotener Hashtag steht nirgends im Text,
  // auch nicht mitten im Satz oder gross geschrieben.
  const verboten = (b.hashtags_verboten || []).filter(x => t.toLowerCase().includes(String(x).toLowerCase()))
  if (verboten.length) fehler.push(`Verbotener Hashtag im Text: ${verboten.join(" ")}. Er darf nie in einem Beitragstext stehen.`)
  if (fremd.length) fehler.push(`Nicht in der Liste aus konfig.json: ${fremd.join(' ')}.`)
  if (erwartet && tags.join(' ') !== erwartet.join(' ')) fehler.push(`Die Hashtags müssen genau diese sein: ${erwartet.join(' ')}.`)
  const wort = String(stichwort || '').trim()
  if (!/^[A-ZÄÖÜ]{2,12}$/.test(wort)) fehler.push(`Das Stichwort "${wort}" ist kein Wort in Großbuchstaben.`)
  else {
    const mitWort = zeilen.filter(z => new RegExp(`(^|[^\\p{L}])${wort}([^\\p{L}]|$)`, 'u').test(z))
    if (!mitWort.length) fehler.push(`Das Stichwort ${wort} fehlt. Es muss genau so dastehen wie im Video.`)
    else if (!mitWort.some(z => /kommentier/i.test(z))) fehler.push(`Die Zeile mit ${wort} fordert nicht zum Kommentieren auf.`)
  }
  if (hook) {
    const h = kern(hook).split(' ').slice(0, 3).join(' ')
    if (h && !kern(zeilen[0] || '').startsWith(h)) fehler.push(`Die erste Zeile beginnt nicht mit dem Hook ("${hook}").`)
  }
  if (zeilen.length > 5) fehler.push(`Vor den Hashtags stehen ${zeilen.length} Zeilen, höchstens 5.`)
  // AUTOMATIK.md 6.6 verlangt hoechstens drei Emojis; bis zum 16.11.2026 stand das nur im
  // Dokument, und niemand zaehlte nach. Gezaehlt wird jedes Bildzeichen (Extended_Pictographic):
  // das Auswahlzeichen U+FE0F hinter der Schere zaehlt nicht mit, eine zusammengesetzte Familie zaehlt
  // mehrfach. Das ist streng, aber nie zu milde.
  const emojis = (rumpf.match(/\p{Extended_Pictographic}/gu) || []).length
  const maxEmojis = b.max_emojis ?? 3
  if (emojis > maxEmojis) fehler.push(`Vor den Hashtags stehen ${emojis} Emojis, höchstens ${maxEmojis}.`)
  return { ok: fehler.length === 0, zeichen, zeilen: zeilen.length, emojis, hashtags: tags, fehler }
}

function args(liste) {
  const a = {}
  for (let i = 0; i < liste.length; i++) {
    if (!liste[i].startsWith('--')) throw new Fehler(`unerwartet: ${liste[i]}`)
    a[liste[i].slice(2)] = liste[i + 1]; i++
  }
  return a
}

function selbsttest() {
  const b = regeln(JSON.parse(readFileSync(KONFIG, 'utf8')))
  let n = 0, schlecht = 0
  const soll = (name, ist, wert) => { n++; if (ist !== wert) { schlecht++; console.error(`FEHLER ${name}: ${JSON.stringify(ist)} statt ${JSON.stringify(wert)}`) } }
  const tags = hashtagsFuer(b, 'cafe').join(' ')
  const gut = `Wer sagt deiner Kundin, dass die Karte voll ist? 🤔\nIst ihre Stempelkarte voll und sie kommt in die Nähe deiner Bäckerei, zeigt ihr Handy sie von selbst an.\n👉 Kommentiere BROT und wir melden uns.\n\n${tags}`
  const p = t => pruefe(t, { b, erwartet: hashtagsFuer(b, 'cafe'), stichwort: 'BROT', hook: 'Wer sagt deiner Kundin, dass die Karte voll ist?' })
  soll('ein Text nach den Regeln geht durch', p(gut).ok, true)
  soll('genau fünf Hashtags je Branche', hashtagsFuer(b, 'friseur').length, b.hashtags_anzahl)
  // Der Text des Betreibers fuer das zweite Video (Cafe, eigene Hashtags) muss nach denselben Regeln gelten
  const bsp = pruefe(b.beispiel, { b, erwartet: ['#baristalife', '#cafe', ...b.hashtags_immer], stichwort: 'KARTE', hook: 'Ist das koscher?' })
  soll('das Beispiel des Betreibers geht durch', bsp.ok, true)
  soll('die ersten fünf der Liste (vier vom Betreiber, #stammkunden statt #stempelkarte)', b.hashtags.slice(0, 5).join(' '), '#baristalife #cafe #berlincity #kleinunternehmen #stammkunden')
  soll('#stempelkarte fällt durch, auch groß geschrieben', p(gut.replace('#berlincity', '#Stempelkarte')).ok, false)
  soll('kein verbotener Hashtag in der Liste', (b.hashtags_verboten || []).some(x => b.hashtags.includes(x)), false)
  soll('sechs Hashtags fallen durch', p(gut + ' #eisdiele').ok, false)
  soll('ein fremder Hashtag fällt durch', p(gut.replace('#cafe', '#coffee')).ok, false)
  soll('Hashtags einer anderen Branche fallen durch', p(gut.replace(hashtagsFuer(b, 'cafe').slice(0, 2).join(' '), hashtagsFuer(b, 'friseur').slice(0, 2).join(' '))).ok, false)
  soll('ein Geviertstrich fällt durch', p(gut.replace('voll ist?', 'voll ist \u2014 ?')).ok, false)
  soll('ein Halbgeviertstrich fällt durch', p(gut.replace('voll ist?', 'voll ist \u2013 ?')).ok, false)
  soll('ein anderes Stichwort fällt durch', p(gut.replace('BROT', 'KARTE')).ok, false)
  soll('ohne Aufforderung zum Kommentieren fällt durch', p(gut.replace('Kommentiere BROT', 'Schreib BROT')).ok, false)
  soll('ein @ fällt durch', p(gut.replace('Bäckerei,', 'Bäckerei @trytappi,')).ok, false)
  soll('zu lang fällt durch', p(gut.replace('von selbst an.', 'von selbst an. ' + 'Noch ein Satz, der nur Platz braucht. '.repeat(4))).ok, false)
  soll('ohne Leerzeile vor den Hashtags fällt durch', p(gut.replace('\n\n#', '\n#')).ok, false)
  soll('ein anderer Hook fällt durch', p(gut.replace('Wer sagt deiner Kundin', 'Heute ist Montag')).ok, false)
  soll('Windows-Zeilenenden stören nicht', p(gut.replace(/\n/g, '\r\n')).ok, true)
  soll('das Beispiel des Betreibers hat genau drei Emojis', bsp.emojis, 3)
  soll('vier Emojis fallen durch', p(gut.replace('🤔', '🤔✂️✅')).ok, false)
  soll('eine Schere mit Auswahlzeichen zählt als ein Emoji', p(gut.replace('🤔', '✂️')).emojis, 2)
  soll('unbekannte Branche wird abgelehnt', (() => { try { hashtagsFuer(b, 'kiosk'); return 'kein Fehler' } catch (e) { return e instanceof Fehler } })(), true)
  for (const x of b.hashtags) soll(`Hashtag ${x} ist ein Wort`, /^#[\p{L}\p{N}_]+$/u.test(x), true)
  for (const [k, paar] of Object.entries(b.hashtags_je_branche)) soll(`Branche ${k}: zwei Hashtags aus der Liste`, paar.length === 2 && paar.every(x => b.hashtags.includes(x)), true)
  soll('die festen Hashtags stehen in der Liste', b.hashtags_immer.every(x => b.hashtags.includes(x)), true)
  if (schlecht) { console.error(`beitrag.mjs: ${schlecht} von ${n} Fällen falsch`); return 1 }
  console.log(`beitrag.mjs: Selbsttest bestanden (${n} Fälle)`)
  return 0
}

function haupt(argv) {
  const [befehl, ...rest] = argv
  if (befehl === 'selbsttest') return selbsttest()
  const a = args(rest)
  const b = regeln(JSON.parse(readFileSync(KONFIG, 'utf8')))
  if (befehl === 'hashtags') { console.log(hashtagsFuer(b, a.branche).join(' ')); return 0 }
  if (befehl === 'pruefen') {
    if (!a.text) throw new Fehler('--text DATEI fehlt')
    const r = pruefe(readFileSync(a.text, 'utf8'), { b, erwartet: hashtagsFuer(b, a.branche), stichwort: a.stichwort, hook: a.hook })
    console.log(JSON.stringify(r, null, 1))
    return r.ok ? 0 : 1
  }
  throw new Fehler('Befehl: hashtags, pruefen oder selbsttest')
}

try {
  process.exitCode = haupt(process.argv.slice(2))
} catch (e) {
  console.error(e instanceof Fehler ? `beitrag.mjs: ${e.message}` : e)
  process.exitCode = 2
}
