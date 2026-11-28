#!/usr/bin/env node
// reference-voice.mjs [--force] [--into <ordner>]
// Stellt die Stimmen der beiden Referenzvideos wieder her, OHNE etwas zu senden:
//
//   2026-11-14-kaffee-aufs-haus (Fassung 7)   aus tools/fixtures: die Aufnahme vor dem
//       Satz-Austausch und der neu aufgenommene Satz "Und das lohnt sich!". Der fertige
//       Ton wird daraus bei jedem Bau gleich neu zusammengesetzt.
//   2026-11-15-kaffee-aufs-haus (Fassung 10, veroeffentlicht)   aus
//       launch-video/final-build/voice/liam.mp3 + alignment.json, unveraendert kopiert.
//
// Wozu: frueher lag die Stimme des Referenzvideos nur als .wav im Cache, und .wav
// ist von Git ausgenommen. Ein frischer Checkout hatte sie nicht, die Selbstpruefung
// scheiterte und make.mjs wollte 698 Zeichen neu bezahlen. Jetzt liegen .mp3,
// Zeiten und Bauanleitung im Repo; dieses Werkzeug baut genau diese Dateien neu,
// falls der Ordner voice/ einmal fehlt. selftest.mjs prueft, dass beides
// uebereinstimmt, und ruft es wie regress.mjs bei Bedarf selbst auf.
//
// Ohne Schalter: nur was fehlt. --force: alles neu schreiben. --into <ordner>:
// statt in die Video-Ordner nach <ordner>/<video>/voice schreiben (fuer Tests).
import { readFileSync, writeFileSync, existsSync, mkdtempSync, rmSync } from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { pathToFileURL } from 'node:url'
import { normalize } from '../engine/script.mjs'
import { run, STUDIO_ROOT } from '../engine/render.mjs'

const FIX = path.join(STUDIO_ROOT, 'tools', 'fixtures'), LAUNCH = path.resolve(STUDIO_ROOT, '..', 'launch-video')
const PY = path.join(STUDIO_ROOT, 'tools', 'voice.py')

/** Die beiden Videos, an denen sich das Studio messen laesst. regress.mjs benutzt dieselbe Liste. */
export const REFERENCES = [
  {
    id: 'v7', video: '2026-11-14-kaffee-aufs-haus', title: 'Fassung 7 (erstes Video, laute Wischer, Aufnahme mit Satz-Austausch)',
    original: path.join(LAUNCH, 'build'), mp4: path.join(LAUNCH, 'Stampit-Werbevideo-v7.mp4'),
    seed: ['seed-splice', '--audio', path.join(FIX, 'satz-austausch-vorher.mp3'), '--alignment', path.join(FIX, 'satz-austausch-vorher.alignment.json'),
      '--clip-audio', path.join(FIX, 'satz-austausch-neuer-satz.mp3'), '--clip-alignment', path.join(FIX, 'satz-austausch-neuer-satz.alignment.json')]
  },
  {
    id: 'v10', video: '2026-11-15-kaffee-aufs-haus', title: 'Fassung 10 (veröffentlicht: Aufnahme mit Tempo 1,05, leise Wischer)',
    original: path.join(LAUNCH, 'final-build'), mp4: path.join(LAUNCH, 'Stampit-Werbevideo-v10.mp4'),
    seed: ['seed', '--audio', path.join(LAUNCH, 'final-build', 'voice', 'liam.mp3'), '--alignment', path.join(LAUNCH, 'final-build', 'voice', 'alignment.json')]
  }
]
export const videoDir = ref => path.join(STUDIO_ROOT, 'videos', ref.video)

/** Gesprochener Text und Stimm-Einstellungen eines Videos als Dateien fuer voice.py. */
export function voiceArgs(dir, tmp) {
  const norm = normalize(JSON.parse(readFileSync(path.join(dir, 'script.json'), 'utf8')))
  const textFile = path.join(tmp, 'spoken.txt'), setFile = path.join(tmp, 'settings.json')
  writeFileSync(textFile, norm.spoken); writeFileSync(setFile, JSON.stringify(norm.voice))
  return { norm, args: ['--text-file', textFile, '--settings', setFile] }
}

/** Liegt die Stimme vollstaendig im Cache? Sonst wiederherstellen. Gibt { ok, key, restored, message } zurueck. */
export async function ensureReferenceVoice(ref, { force = false, into = null } = {}) {
  const tmp = mkdtempSync(path.join(os.tmpdir(), 'stampit-ref-'))
  try {
    const voiceDir = into ? path.join(into, ref.video, 'voice') : path.join(videoDir(ref), 'voice')
    const { args } = voiceArgs(videoDir(ref), tmp)
    const plan = async () => JSON.parse((await run('python3', [PY, 'plan', '--dir', voiceDir, ...args], { env: { ...process.env, STUDIO_VOICE_OFFLINE: '1' } })).out)
    let pl = await plan()
    if (pl.cached && !force) return { ok: true, key: pl.key, restored: false, dir: voiceDir }
    const missing = ref.seed.filter(a => path.isAbsolute(a) && !existsSync(a))
    if (missing.length) return { ok: false, key: pl.key, restored: false, dir: voiceDir, message: 'Quelle fehlt: ' + missing.join(', ') }
    const r = await run('python3', [PY, ref.seed[0], '--dir', voiceDir, ...args, ...ref.seed.slice(1)], { env: { ...process.env, STUDIO_VOICE_OFFLINE: '1' } })
    if (r.code !== 0) return { ok: false, key: pl.key, restored: false, dir: voiceDir, message: (r.err || r.out).trim() }
    pl = await plan()
    return { ok: pl.cached, key: pl.key, restored: true, dir: voiceDir, message: pl.cached ? '' : 'nach dem Wiederherstellen immer noch nicht im Cache' }
  } finally { rmSync(tmp, { recursive: true }) }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const argv = process.argv.slice(2), i = argv.indexOf('--into')
  let bad = 0
  for (const ref of REFERENCES) {
    const r = await ensureReferenceVoice(ref, { force: argv.includes('--force'), into: i >= 0 ? path.resolve(argv[i + 1]) : null })
    console.log(`${ref.video}: ${r.ok ? (r.restored ? 'wiederhergestellt' : 'vollständig, nichts zu tun') : 'FEHLER - ' + r.message} (Schlüssel ${r.key}, ${r.dir})`)
    if (!r.ok) bad++
  }
  process.exit(bad ? 1 : 0)
}
