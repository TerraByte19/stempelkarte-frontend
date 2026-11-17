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
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

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
