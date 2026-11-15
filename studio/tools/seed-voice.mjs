#!/usr/bin/env node
// seed-voice.mjs <video-ordner> <aufnahme.wav> <alignment.json>
// Legt eine VORHANDENE Aufnahme in den Stimm-Cache eines Videos, ohne etwas zu
// senden oder zu bezahlen. So kam die Aufnahme des ersten Videos ins Studio:
//   node studio/tools/seed-voice.mjs studio/videos/2026-11-14-kaffee-aufs-haus \
//        launch-video/build/voice/liam.wav launch-video/build/voice/alignment.json
// Die Aufnahme muss 44,1 kHz, mono, 16 bit sein, und ihre Zeichen muessen genau
// der gesprochene Text des Skripts sein - sonst lehnt voice.py ab.
import { readFileSync, writeFileSync, existsSync, mkdtempSync, rmSync } from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { normalize } from '../engine/script.mjs'
import { run, STUDIO_ROOT } from '../engine/render.mjs'

const [target, wav, alignment] = process.argv.slice(2)
const dir = target && [path.resolve(target), path.join(STUDIO_ROOT, 'videos', target)].find(d => existsSync(path.join(d, 'script.json')))
if (!dir || !wav || !alignment) { console.error('Aufruf: node studio/tools/seed-voice.mjs <video-ordner> <aufnahme.wav> <alignment.json>'); process.exit(2) }
const norm = normalize(JSON.parse(readFileSync(path.join(dir, 'script.json'), 'utf8')))
const tmp = mkdtempSync(path.join(os.tmpdir(), 'stampit-seed-'))
writeFileSync(path.join(tmp, 'spoken.txt'), norm.spoken); writeFileSync(path.join(tmp, 'settings.json'), JSON.stringify(norm.voice))
const r = await run('python3', [path.join(STUDIO_ROOT, 'tools', 'voice.py'), 'seed', '--dir', path.join(dir, 'voice'), '--text-file', path.join(tmp, 'spoken.txt'), '--settings', path.join(tmp, 'settings.json'), '--wav', path.resolve(wav), '--alignment', path.resolve(alignment)])
rmSync(tmp, { recursive: true })
process.stdout.write(r.out); process.stderr.write(r.err); process.exit(r.code)
