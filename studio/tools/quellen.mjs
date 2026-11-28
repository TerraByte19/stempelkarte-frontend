#!/usr/bin/env node
// quellen.mjs - packt alles, was man zum spaeteren Aendern eines Videos braucht, in EINE Datei.
//
//   node studio/tools/quellen.mjs packen    <video-ordner> <paket.json>
//   node studio/tools/quellen.mjs pruefen   <paket.json>
//   node studio/tools/quellen.mjs auspacken <paket.json> --nach <ordner studio/videos> [--ueberschreiben]
//   node studio/tools/quellen.mjs teilen    <paket.json> <leerer ordner> [--groesse 180000]
//   node studio/tools/quellen.mjs zusammen  <ordner mit teilen> <paket.json>
//   node studio/tools/quellen.mjs selbsttest
//
// Warum es das gibt: ein unbeaufsichtigter Lauf arbeitet in einer Maschine, die
// danach weg ist, und sein git push kann abgelehnt werden. Skript und bezahlte
// Aufnahme (script.json und der Ordner voice/) muessen deshalb auch auf dem
// Board liegen, sonst muesste ein Aenderungswunsch die ganze Aufnahme noch
// einmal bezahlen.
//
// Warum ein JSON-Paket mit Base64: der Asset-Speicher des Boards nimmt weder
// .mp3 noch .zip, wohl aber .json. Base64 bringt jede Datei Byte fuer Byte
// zurueck (jede traegt ihre Pruefsumme). Ein Umpacken der Aufnahme in einen
// erlaubten Container waere nicht bytegleich, und dann passen die Wort-Zeiten
// der Aufnahme nicht mehr sicher zum Ton.
//
// Warum "teilen": als Notweg, falls das Board die Paket-Datei nicht annimmt.
// Ein Dokument der Datenbank fasst 256 KiB, das Paket hat rund 1 MB. Die Teile
// sind reine ASCII-Stuecke des Pakets und gehen je als ein Dokument in die
// Sammlung quellen/<video-id>/teile.
//
// Das Werkzeug kennt das Netz nicht. Hochladen und Herunterladen macht der Lauf
// mit den Werkzeugen Artifact und ArtifactData (studio/AUTOMATIK.md, Abschnitt 7).
// Ende-Codes: 0 gut | 1 Fehler (Meldung auf stderr) | 2 falscher Aufruf
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, lstatSync, mkdtempSync, rmSync } from 'node:fs'
import { createHash, randomBytes } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import os from 'node:os'

// Ordner- und Dateinamen: nur diese Zeichen, kein Schraegstrich, kein Punkt am Anfang.
// Damit kann ein Paket beim Auspacken nie ausserhalb seines Video-Ordners schreiben.
const NAME = /^[A-Za-z0-9][A-Za-z0-9._-]{0,150}$/
const MAX_ROH = 12 * 1024 * 1024   // Base64 macht daraus 16 MiB; das Board nimmt je Datei 20 MiB
const TEIL = 180000                // Zeichen je Teil; mit Huelle bleibt ein Dokument unter 256 KiB
const sha = x => createHash('sha256').update(x).digest('hex')
const istAscii = t => !/[^\x20-\x7e]/.test(t)

// script.json und alles aus voice/, ausser .wav: die entsteht nur als Zwischenergebnis
// und gehoert nie zum Cache (siehe tools/voice.py).
function sammeln(dir) {
  const skript = path.join(dir, 'script.json')
  if (!existsSync(skript)) throw new Error(`kein script.json in ${dir}`)
  const liste = [{ pfad: 'script.json', buf: readFileSync(skript) }]
  const v = path.join(dir, 'voice')
  if (existsSync(v)) {
    for (const n of readdirSync(v).sort()) {
      const abs = path.join(v, n)
      if (!lstatSync(abs).isFile() || n.endsWith('.wav')) continue
      if (!NAME.test(n)) throw new Error(`unerwarteter Dateiname in voice/: "${n}"`)
      liste.push({ pfad: 'voice/' + n, buf: readFileSync(abs) })
    }
  }
  const roh = liste.reduce((s, f) => s + f.buf.length, 0)
  if (roh > MAX_ROH) throw new Error(`die Quellen sind ${roh} Bytes groß, mehr als ${MAX_ROH}. So viel hat kein Video; erst nachsehen, was in voice/ liegt.`)
  return liste
}

function lesen(datei) {
  const text = readFileSync(datei, 'utf8')
  let p
  try { p = JSON.parse(text) } catch (e) { throw new Error(`${datei} ist kein JSON: ${e.message}`) }
  if (!p || p.format !== 1 || p.art !== 'stampit-quellen' || !Array.isArray(p.dateien)) throw new Error(`${datei} ist kein Quellen-Paket`)
  if (typeof p.ordner !== 'string' || !NAME.test(p.ordner)) throw new Error('das Paket nennt keinen gültigen Ordner')
  const gesehen = new Set()
  const dateien = p.dateien.map(d => {
    const pfad = String(d && d.pfad)
    const erlaubt = pfad === 'script.json' || (pfad.startsWith('voice/') && NAME.test(pfad.slice(6)))
    if (!erlaubt) throw new Error(`unerlaubter Pfad im Paket: "${pfad}"`)
    if (gesehen.has(pfad)) throw new Error(`"${pfad}" steht zweimal im Paket`)
    gesehen.add(pfad)
    const buf = Buffer.from(String(d.b64), 'base64')
    if (buf.length !== d.bytes || sha(buf) !== d.sha256) throw new Error(`"${pfad}" ist beschädigt (Länge oder Prüfsumme stimmt nicht)`)
    return { pfad, buf }
  })
  if (!gesehen.has('script.json')) throw new Error('im Paket fehlt script.json')
  return { ordner: p.ordner, erstellt: p.erstellt, dateien, text }
}

const kurz = p => ({
  ordner: p.ordner, dateien: p.dateien.length, aufnahmen: p.dateien.filter(f => f.pfad.endsWith('.mp3')).length,
  bytes_roh: p.dateien.reduce((s, f) => s + f.buf.length, 0), bytes_paket: p.text.length,
  paket_sha256: sha(p.text), skript_sha256: sha(p.dateien.find(f => f.pfad === 'script.json').buf)
})

function packen(dir, ziel) {
  const ordner = path.basename(path.resolve(dir))
  if (!NAME.test(ordner)) throw new Error(`der Ordnername "${ordner}" enthält Zeichen, die nicht erlaubt sind (nur A-Z a-z 0-9 . _ -)`)
  const paket = {
    format: 1, art: 'stampit-quellen', ordner, erstellt: new Date().toISOString(),
    dateien: sammeln(dir).map(f => ({ pfad: f.pfad, bytes: f.buf.length, sha256: sha(f.buf), b64: f.buf.toString('base64') }))
  }
  const text = JSON.stringify(paket)
  // Reines ASCII ist die Voraussetzung dafuer, dass "teilen" das Paket an beliebiger Stelle schneiden darf.
  if (!istAscii(text)) throw new Error('das Paket enthält Zeichen außerhalb von ASCII, das darf nicht sein')
  writeFileSync(ziel, text)
  return { paket: ziel, ...kurz(lesen(ziel)) }   // sofort gegenlesen: ein Paket, das sich nicht lesen laesst, ist keins
}

function auspacken(datei, nach, ueberschreiben) {
  const p = lesen(datei)
  const ziel = path.join(nach, p.ordner)
  const stelle = f => path.join(ziel, ...f.pfad.split('/'))
  const gleich = f => existsSync(stelle(f)) && readFileSync(stelle(f)).equals(f.buf)
  // Liegt dort schon eine ANDERE Fassung, wird nichts angefasst: das koennte der neuere Stand sein.
  const anders = p.dateien.filter(f => existsSync(stelle(f)) && !gleich(f)).map(f => f.pfad)
  if (anders.length && !ueberschreiben) {
    throw new Error(`in ${ziel} liegen schon andere Fassungen von: ${anders.join(', ')}. Nichts wurde geschrieben. Erst klären, welcher Stand gilt; --ueberschreiben nimmt den aus dem Paket.`)
  }
  let geschrieben = 0
  for (const f of p.dateien) {
    if (gleich(f)) continue
    mkdirSync(path.dirname(stelle(f)), { recursive: true })
    writeFileSync(stelle(f), f.buf)
    geschrieben++
  }
  return { ziel, geschrieben, ...kurz(p) }
}

function teilen(datei, zielOrdner, groesse = TEIL) {
  const { text } = lesen(datei)
  if (!istAscii(text)) throw new Error('das Paket enthält Zeichen außerhalb von ASCII und lässt sich so nicht teilen')
  if (!Number.isInteger(groesse) || groesse < 1000 || groesse > 200000) throw new Error('--groesse muss zwischen 1000 und 200000 liegen')
  if (existsSync(zielOrdner) && readdirSync(zielOrdner).length) throw new Error(`${zielOrdner} ist nicht leer. Teile verschiedener Pakete dürfen sich nicht mischen.`)
  const von = Math.ceil(text.length / groesse)
  if (von > 120) throw new Error(`das wären ${von} Teile, mehr als 120. So groß ist kein Paket.`)
  mkdirSync(zielOrdner, { recursive: true })
  const summe = sha(text), doc_ids = []
  for (let i = 0; i < von; i++) {
    const name = `teil-${String(i).padStart(3, '0')}`
    writeFileSync(path.join(zielOrdner, name + '.json'),
      JSON.stringify({ format: 1, art: 'stampit-quellen-teil', n: i, von, sha256: summe, daten: text.slice(i * groesse, (i + 1) * groesse) }))
    doc_ids.push(name)
  }
  return { ordner: zielOrdner, teile: von, doc_ids, paket_sha256: summe }
}

function zusammen(ordner, ziel) {
  const teile = []
  for (const n of readdirSync(ordner).sort()) {
    if (!n.endsWith('.json')) continue
    let o
    try { o = JSON.parse(readFileSync(path.join(ordner, n), 'utf8')) } catch (e) { throw new Error(`${n} ist kein JSON: ${e.message}`) }
    // ArtifactData kann ein gelesenes Dokument in eine Huelle {id, data, version} stecken
    const d = o && o.data && typeof o.data === 'object' && o.data.art === 'stampit-quellen-teil' ? o.data : o
    if (d && d.art === 'stampit-quellen-teil') teile.push(d)
  }
  if (!teile.length) throw new Error(`in ${ordner} liegt kein Teil eines Pakets`)
  const von = teile[0].von, summe = teile[0].sha256
  if (!Number.isInteger(von) || teile.length !== von) throw new Error(`es liegen ${teile.length} Teile da, erwartet werden ${von}`)
  teile.sort((a, b) => a.n - b.n)
  teile.forEach((t, i) => {
    if (t.n !== i || t.von !== von || t.sha256 !== summe || typeof t.daten !== 'string') throw new Error(`Teil ${i} fehlt oder gehört zu einem anderen Paket`)
  })
  const text = teile.map(t => t.daten).join('')
  if (sha(text) !== summe) throw new Error('die Teile ergeben nicht das Paket, zu dem sie gehören (Prüfsumme stimmt nicht)')
  writeFileSync(ziel, text)
  return { paket: ziel, teile: von, ...kurz(lesen(ziel)) }
}

// ---------------------------------------------------------------- Selbsttest (eigener Zwischenordner, ohne Netz)
function selbsttest() {
  const tmp = mkdtempSync(path.join(os.tmpdir(), 'quellen-test-'))
  let n = 0
  const pruef = (ok, was) => { n++; if (!ok) throw new Error('Selbsttest gescheitert: ' + was) }
  const wirft = f => { try { f(); return false } catch { return true } }
  try {
    const v = path.join(tmp, 'videos', '2099-01-01-probe')
    mkdirSync(path.join(v, 'voice'), { recursive: true })
    const dateien = {
      'script.json': Buffer.from(JSON.stringify({ meta: { title: 'Grüße aus dem Selbsttest', slug: 'probe' } }), 'utf8'),
      'voice/0123456789abcdef.alignment.json': Buffer.from('{"characters":["ä","ö"]}', 'utf8'),
      'voice/0123456789abcdef.meta.json': Buffer.from('{"key":"0123456789abcdef"}', 'utf8'),
      'voice/0123456789abcdef.mp3': randomBytes(400000)
    }
    for (const [rel, buf] of Object.entries(dateien)) writeFileSync(path.join(v, ...rel.split('/')), buf)
    writeFileSync(path.join(v, 'voice', 'zwischen.wav'), randomBytes(1000))

    const paket = path.join(tmp, 'paket.json')
    const p = packen(v, paket)
    pruef(p.dateien === 4 && p.aufnahmen === 1, 'vier Dateien im Paket, die .wav bleibt draußen')
    pruef(p.skript_sha256 === sha(dateien['script.json']), 'der Fingerabdruck des Skripts ist der von script.json')
    pruef(istAscii(readFileSync(paket, 'utf8')), 'das Paket ist reines ASCII, obwohl das Skript Umlaute hat')

    const t = teilen(paket, path.join(tmp, 'teile'), 100000)
    pruef(t.teile >= 5 && t.doc_ids[0] === 'teil-000', 'das Paket zerfällt in mehrere Teile')
    pruef(wirft(() => teilen(paket, path.join(tmp, 'teile'), 100000)), 'in einen Ordner mit Teilen wird nicht noch einmal geteilt')
    const eins = path.join(tmp, 'teile', 'teil-001.json')
    writeFileSync(eins, JSON.stringify({ id: 'teil-001', version: 1, data: JSON.parse(readFileSync(eins, 'utf8')) }, null, 2))
    const wieder = path.join(tmp, 'wieder.json')
    zusammen(path.join(tmp, 'teile'), wieder)
    pruef(readFileSync(wieder, 'utf8') === readFileSync(paket, 'utf8'), 'geteilt und zusammengesetzt ergibt dasselbe Paket, auch mit einem Teil in der Hülle')
    rmSync(path.join(tmp, 'teile', 'teil-002.json'))
    pruef(wirft(() => zusammen(path.join(tmp, 'teile'), path.join(tmp, 'luecke.json'))), 'ein fehlender Teil wird bemerkt')

    const aus = path.join(tmp, 'aus')
    pruef(auspacken(wieder, aus, false).geschrieben === 4, 'auspacken schreibt alle vier Dateien')
    for (const [rel, buf] of Object.entries(dateien)) {
      pruef(readFileSync(path.join(aus, '2099-01-01-probe', ...rel.split('/'))).equals(buf), `${rel} kommt Byte für Byte zurück`)
    }
    pruef(auspacken(wieder, aus, false).geschrieben === 0, 'ein zweites Auspacken schreibt nichts')
    writeFileSync(path.join(aus, '2099-01-01-probe', 'script.json'), '{}')
    pruef(wirft(() => auspacken(wieder, aus, false)), 'eine andere Fassung wird nicht still überschrieben')
    pruef(readFileSync(path.join(aus, '2099-01-01-probe', 'script.json'), 'utf8') === '{}', 'und bleibt dabei unberührt')
    pruef(auspacken(wieder, aus, true).geschrieben === 1, 'mit --ueberschreiben wird genau sie ersetzt')

    const kaputt = JSON.parse(readFileSync(paket, 'utf8'))
    kaputt.dateien[1].b64 = kaputt.dateien[1].b64.slice(4)
    writeFileSync(path.join(tmp, 'kaputt.json'), JSON.stringify(kaputt))
    pruef(wirft(() => lesen(path.join(tmp, 'kaputt.json'))), 'ein beschädigtes Paket wird erkannt')
    const boese = JSON.parse(readFileSync(paket, 'utf8'))
    boese.dateien[1].pfad = 'voice/../../draussen.json'
    writeFileSync(path.join(tmp, 'boese.json'), JSON.stringify(boese))
    pruef(wirft(() => lesen(path.join(tmp, 'boese.json'))), 'ein Pfad, der aus dem Ordner herausführt, wird abgelehnt')
    return { ok: true, meldung: `quellen.mjs: Selbsttest bestanden (${n} Prüfpunkte)` }
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
}

// ---------------------------------------------------------------- Aufruf
const SCHALTER = new Set(['ueberschreiben'])   // Schalter ohne Wert
function argumente(argv) {
  const o = { _: [] }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (!a.startsWith('--')) { o._.push(a); continue }
    const k = a.slice(2)
    if (SCHALTER.has(k)) o[k] = true
    else o[k] = argv[++i]
  }
  return o
}

const [befehl, ...rest] = process.argv.slice(2)
const a = argumente(rest)
try {
  let r
  if (befehl === 'packen' && a._.length === 2) r = packen(a._[0], a._[1])
  else if (befehl === 'pruefen' && a._.length === 1) r = kurz(lesen(a._[0]))
  else if (befehl === 'auspacken' && a._.length === 1 && a.nach) r = auspacken(a._[0], a.nach, a.ueberschreiben === true)
  else if (befehl === 'teilen' && a._.length === 2) r = teilen(a._[0], a._[1], a.groesse === undefined ? TEIL : Number(a.groesse))
  else if (befehl === 'zusammen' && a._.length === 2) r = zusammen(a._[0], a._[1])
  else if (befehl === 'selbsttest') r = selbsttest()
  else {
    console.error(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').filter(l => l.startsWith('//')).slice(0, 9).map(l => l.slice(3)).join('\n'))
    process.exit(2)
  }
  console.log(JSON.stringify(r, null, 1))
} catch (e) {
  console.error('quellen: ' + e.message)
  process.exit(1)
}
