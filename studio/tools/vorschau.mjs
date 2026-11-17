#!/usr/bin/env node
// Vorschau eines Videos fuer das Board, als Teile fuer die Datenbank.
//
// Warum: Auf dem iPhone (Claude-App und Safari) laedt das Board keine Datei
// von der eigenen Adresse. Am 17.11. kam fuer "/_blob/<id>" 404 und fuer eine
// Datei neben der Seite 403, obwohl beides auf dem Server lag (Diagnose in der
// Sammlung "diagnose"). Die Datenbank des Boards geht dort aber, sie laeuft
// ueber die Bruecke der Seite statt ueber eine eigene Anfrage. Also kommt eine
// kleine Fassung des Videos (720x1280, etwa 3 MB) als base64 in Teilen in die
// Sammlung "vorschau", und das Board setzt sie wieder zusammen.
//
// Falle: ein Dokument darf serialisiert hoechstens 256 KiB haben (db.d.ts),
// ein Batch hoechstens 1 MiB. Deshalb Teile zu 240000 Zeichen und je Batch
// hoechstens 3 Teile.
//
// Aufruf: node studio/tools/vorschau.mjs <video.mp4> <video_id> <ausgabeordner>
// Ergebnis im Ausgabeordner: vorschau.mp4, teil-<n>.json (je ein Dokument)
// und batch-<n>.json (fertige "writes"-Listen fuer ArtifactData action
// "batch"), dazu info.json mit { teile, bytes }.
//
// Aufraeumen (AUTOMATIK.md Schritt 22a):
//   node studio/tools/vorschau.mjs loeschliste <abfrage-ordner> <video_id> <liste.json> [versionen.json]
// liest die Teile, die eine Abfrage mit out_dir abgelegt hat, und schreibt die
// fertige "writes"-Liste zum Loeschen. Ende-Code 0: Liste geschrieben (auch leer).
// 1: mindestens ein Teil ohne Version, KEINE Liste. 2: Aufruf falsch.
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

// Warum es keine geratene Version mehr gibt: die erste Fassung des Aufraeumens
// setzte fuer Teile ohne "version" einfach 1. Stimmte das nicht, scheiterte der
// ganze Batch, die Antwort nannte nur die Version des ersten falschen Teils, und
// die Teile blieben Tag fuer Tag liegen, waehrend die Datenbank (100 MB) mit
// rund 5 MB je Video volllief. Jetzt kommt die Version aus der abgelegten Datei
// oder aus einer Liste, die der Lauf aus der Antwort der Abfrage abschreibt;
// fehlt sie, wird nichts geloescht.
function loeschliste(ordner, videoId, versionen = {}) {
  const dateien = []
  const sammeln = (d, tiefe) => {
    if (!fs.existsSync(d) || tiefe > 3) return
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name)
      if (e.isDirectory()) sammeln(p, tiefe + 1)
      else if (e.name.endsWith('.json')) dateien.push(p)
    }
  }
  sammeln(ordner, 0)
  // Nur Dokument-ids der Form <video_id>-<n>: "...-v1" darf nie die Teile von "...-v10" treffen.
  const passt = id => typeof id === 'string' && id.startsWith(videoId + '-') && /^[0-9]+$/.test(id.slice(videoId.length + 1))
  const gesehen = new Map()
  for (const f of dateien) {
    let j
    try { j = JSON.parse(fs.readFileSync(f, 'utf8')) } catch { continue }
    // Abgelegt wird entweder das Dokument selbst oder die Huelle { id, data, version }, auch als Liste.
    for (const x of Array.isArray(j) ? j : [j]) {
      if (!x || typeof x !== 'object') continue
      const id = typeof x.id === 'string' ? x.id : (Array.isArray(j) ? null : path.basename(f, '.json'))
      if (!passt(id) || gesehen.has(id)) continue
      const v = Number.isInteger(x.version) ? x.version : versionen[id]
      gesehen.set(id, Number.isInteger(v) ? v : null)
    }
  }
  const ids = [...gesehen.keys()].sort((a, b) => +a.slice(videoId.length + 1) - +b.slice(videoId.length + 1))
  const ohne = ids.filter(id => gesehen.get(id) === null)
  return { teile: ids.length, ohne_version: ohne.length, writes: ohne.length ? null : ids.map(id => ({ op: 'delete', collection: 'vorschau', doc_id: id, if_version: gesehen.get(id) })) }
}

if (process.argv[2] === 'loeschliste') {
  const [, ordner, id, liste, vdatei] = process.argv.slice(2)
  if (!ordner || !id || !liste) { console.error('Aufruf: node studio/tools/vorschau.mjs loeschliste <abfrage-ordner> <video_id> <liste.json> [versionen.json]'); process.exit(2) }
  let versionen = {}
  if (vdatei) {
    try { versionen = JSON.parse(fs.readFileSync(vdatei, 'utf8')) } catch (e) { console.error('versionen.json unlesbar: ' + e.message); process.exit(2) }
  }
  const r = loeschliste(ordner, id, versionen)
  // Ein Batch nimmt hoechstens 50 Schreibvorgaenge; eine Vorschau hat hoechstens 40 Teile (unten).
  if (r.teile > 50) { console.error('mehr als 50 Teile: ' + r.teile); process.exit(2) }
  if (r.writes) fs.writeFileSync(liste, JSON.stringify(r.writes))
  console.log(JSON.stringify({ video_id: id, teile: r.teile, ohne_version: r.ohne_version }))
  process.exit(r.writes ? 0 : 1)
}

const [quelle, videoId, aus] = process.argv.slice(2)
if (!quelle || !videoId || !aus) {
  console.error('Aufruf: node studio/tools/vorschau.mjs <video.mp4> <video_id> <ausgabeordner>')
  process.exit(2)
}
if (!/^[A-Za-z0-9_\-.~:@+]{1,180}$/.test(videoId)) { console.error('video_id passt nicht als Dokument-id'); process.exit(2) }
fs.mkdirSync(aus, { recursive: true })
const mp4 = path.join(aus, 'vorschau.mp4')
const r = spawnSync('ffmpeg', ['-v', 'error', '-y', '-i', quelle,
  '-vf', 'scale=720:1280', '-c:v', 'libx264', '-profile:v', 'main', '-preset', 'slow',
  '-b:v', '700k', '-maxrate', '700k', '-bufsize', '1400k', '-pix_fmt', 'yuv420p',
  '-c:a', 'aac', '-b:a', '64k', '-ac', '1', '-movflags', '+faststart', mp4], { stdio: 'inherit' })
if (r.status !== 0) { console.error('ffmpeg ist gescheitert'); process.exit(1) }

const b64 = fs.readFileSync(mp4).toString('base64')
const GROESSE = 240000
const teile = Math.ceil(b64.length / GROESSE)
// Mehr als 40 Teile (etwa 7 MB) waere ein Zeichen, dass die Vorschau nicht
// klein gerechnet wurde. Lieber abbrechen als die Datenbank fuellen.
if (teile > 40) { console.error('Vorschau zu gross: ' + teile + ' Teile'); process.exit(1) }
const writes = []
for (let n = 0; n < teile; n++) {
  const doc = { video_id: videoId, n, von: teile, typ: 'video/mp4', b64: b64.slice(n * GROESSE, (n + 1) * GROESSE) }
  fs.writeFileSync(path.join(aus, `teil-${n}.json`), JSON.stringify(doc))
  writes.push({ op: 'set', collection: 'vorschau', doc_id: `${videoId}-${n}`, file_path: path.resolve(aus, `teil-${n}.json`) })
}
let b = 0
for (let i = 0; i < writes.length; i += 3) fs.writeFileSync(path.join(aus, `batch-${b++}.json`), JSON.stringify(writes.slice(i, i + 3), null, 1))
const info = { video_id: videoId, teile, bytes: fs.statSync(mp4).size, batches: b }
fs.writeFileSync(path.join(aus, 'info.json'), JSON.stringify(info, null, 1))
console.log(JSON.stringify(info))
