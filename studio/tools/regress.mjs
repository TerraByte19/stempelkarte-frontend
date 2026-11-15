#!/usr/bin/env node
// regress.mjs [--n 60] [--out <ordner>] [--keep]
// Beweist, dass das Studio das erste Video noch genauso baut wie am ersten Tag.
// Nach JEDER Aenderung an engine/ oder an einem der Bausteine laufen lassen.
//
//   a) Standbilder: gleich viele Zeitpunkte gleichmaessig verteilt + der Zeitpunkt
//      jedes Tons, einmal aus dem Studio, einmal aus dem Original
//      (launch-video/build/video/render.mjs). Jedes Paar muss mindestens 45 dB
//      PSNR erreichen; Ziel ist "bildgleich".
//   b) Toene: dieselbe Liste wie launch-video/build/events.json (Zahl, Namen,
//      Zeiten auf 0,002 s, Lautstaerke, Tonhoehe).
//   c) Laenge: wie das Original.
//
// Liest launch-video/ nur, schreibt dort nichts. Braucht die Stimme im Cache
// des Referenzvideos (kostet nichts, sendet nichts).
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { normalize, timesFromAlignment } from '../engine/script.mjs'
import { openStudio, still, run, STUDIO_ROOT } from '../engine/render.mjs'

const argv = process.argv.slice(2), value = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d }
const N = Number(value('--n', 60)), keep = argv.includes('--keep'), MIN_PSNR = 45
const dir = path.join(STUDIO_ROOT, 'videos', '2026-11-14-kaffee-aufs-haus')
const orig = path.resolve(STUDIO_ROOT, '..', 'launch-video', 'build')
const out = path.resolve(value('--out', path.join(os.tmpdir(), 'stampit-regress-' + process.pid)))
if (!existsSync(path.join(orig, 'video', 'render.mjs'))) { console.error('Das Original fehlt: ' + orig + '\nOhne launch-video/ lässt sich nur tools/selftest.mjs prüfen.'); process.exit(2) }
mkdirSync(out, { recursive: true })

const script = JSON.parse(readFileSync(path.join(dir, 'script.json'), 'utf8')), norm = normalize(script)
const textFile = path.join(out, 'spoken.txt'), setFile = path.join(out, 'settings.json')
writeFileSync(textFile, norm.spoken); writeFileSync(setFile, JSON.stringify(norm.voice))
const pl = JSON.parse((await run('python3', [path.join(STUDIO_ROOT, 'tools', 'voice.py'), 'plan', '--dir', path.join(dir, 'voice'), '--text-file', textFile, '--settings', setFile])).out)
if (!pl.cached) { console.error('Die Stimme des Referenzvideos liegt nicht im Cache (videos/2026-11-14-kaffee-aufs-haus/voice). Siehe PLAYBOOK, Abschnitt Referenzvideo.'); process.exit(2) }
const { times } = timesFromAlignment(norm, JSON.parse(readFileSync(path.join(dir, 'voice', pl.key + '.alignment.json'), 'utf8')))

const studio = await openStudio({ script, times }), page = await studio.page(), state = await studio.state(page)
const ref = JSON.parse(readFileSync(path.join(orig, 'events.json'), 'utf8'))
const result = { ok: true, problems: [] }
const bad = msg => { result.ok = false; result.problems.push(msg); console.error('FEHLER ' + msg) }
if (state.errors.length || studio.problems.length) bad('Seite: ' + [...state.errors, ...studio.problems].join(' | '))

// ---- b) Toene
const cues = state.cuesFile.events
let cuesSame = cues.length === ref.events.length, maxDt = 0
if (cuesSame) cues.forEach((c, i) => { const r = ref.events[i], dt = Math.abs(c.t - r.t); maxDt = Math.max(maxDt, dt); if (c.name !== r.name || dt > 0.002 || c.vol !== r.vol || c.pitch !== r.pitch) cuesSame = false })
result.cues = { count: cues.length, reference: ref.events.length, identical: cuesSame, maxTimeDiff: +maxDt.toFixed(4), names: [...new Set(cues.map(c => c.name))].sort() }
if (!cuesSame) bad(`Töne weichen ab (${cues.length} gegen ${ref.events.length})`)

// ---- c) Laenge
result.duration = { studio: state.duration, original: ref.duration }
if (Math.abs(state.duration - ref.duration) > 1 / 30) bad(`Länge ${state.duration} s gegen ${ref.duration} s`)

// ---- a) Standbilder. Das Original benennt seine Bilder nach t.toFixed(2): zwei Zeiten mit gleichem Namen wuerden sich ueberschreiben.
const want = [...Array.from({ length: N }, (_, i) => +((i + 0.5) * state.duration / N).toFixed(3)), ...cues.map(c => c.t), ...cues.map(c => +(c.t + 0.15).toFixed(3))]
const seen = new Map()
for (const t of want.sort((a, b) => a - b)) if (!seen.has(t.toFixed(2)) && t < state.duration) seen.set(t.toFixed(2), t)
const ts = [...seen.values()]
console.log(`${ts.length} Standbilder (${N} gleichmäßig verteilt + Zeitpunkt jedes Tons und 0,15 s danach) ...`)
const o = await run('node', ['render.mjs', 'still', path.join(out, 'orig'), ...ts.map(String)], { cwd: path.join(orig, 'video') })
if (o.code !== 0) bad('Original-Renderer: ' + o.err)
const pairs = []
for (const t of ts) {
  const name = t.toFixed(2), b = path.join(out, `neu-${name}.png`)
  await still(page, t, b); pairs.push({ name, t, a: path.join(out, `orig-${name}.png`), b })
}
await studio.close()
const listFile = path.join(out, 'pairs.json'); writeFileSync(listFile, JSON.stringify(pairs))
const ps = await run('python3', [path.join(STUDIO_ROOT, 'tools', 'psnr.py'), listFile])
if (ps.code !== 0) { bad('psnr.py: ' + ps.err); process.exit(1) }
const rows = JSON.parse(ps.out), worst = rows.reduce((a, b) => a.psnr <= b.psnr ? a : b)
result.stills = { compared: rows.length, identical: rows.filter(r => r.identical).length, minPsnrDb: worst.psnr, worstAt: worst.name, threshold: MIN_PSNR, notIdentical: rows.filter(r => !r.identical) }
for (const r of rows) if (r.psnr < MIN_PSNR) bad(`Standbild ${r.name} s: ${r.psnr} dB (${r.diffPixels} Pixel, größter Abstand ${r.maxDiff})`)
if (!keep) for (const p of pairs) { rmSync(p.a, { force: true }); rmSync(p.b, { force: true }) }
writeFileSync(path.join(out, 'regress.json'), JSON.stringify(result, null, 1))
console.log(`Standbilder: ${result.stills.compared} verglichen, ${result.stills.identical} bildgleich, schlechtestes Paar ${worst.psnr === 999 ? 'identisch' : worst.psnr + ' dB bei ' + worst.name + ' s'}`)
console.log(`Töne: ${result.cues.count} (Original ${result.cues.reference}), gleich: ${cuesSame}, größter Zeitabstand ${result.cues.maxTimeDiff} s`)
console.log(`Länge: ${state.duration} s (Original ${ref.duration} s)`)
console.log((result.ok ? 'BESTANDEN' : 'GESCHEITERT') + ' - Einzelheiten: ' + path.join(out, 'regress.json'))
process.exit(result.ok ? 0 : 1)
