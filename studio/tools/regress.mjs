#!/usr/bin/env node
// regress.mjs [--only v7|v10] [--n 60] [--out <ordner>] [--keep] [--no-audio]
// Beweist, dass das Studio die beiden vorhandenen Videos noch genauso baut wie
// ihre von Hand gebauten Originale. Nach JEDER Aenderung an engine/ oder an
// einem der Bausteine laufen lassen.
//
//   v7   videos/2026-11-14-kaffee-aufs-haus  gegen  launch-video/build        (erste Fassung, laute Wischer)
//   v10  videos/2026-11-15-kaffee-aufs-haus  gegen  launch-video/final-build  (veroeffentlicht)
//
// Je Video:
//   a) Standbilder: --n Zeitpunkte gleichmaessig verteilt + der Zeitpunkt jedes
//      Tons und 0,15 s danach, einmal aus dem Studio, einmal aus dem Original
//      (<original>/video/render.mjs). JEDES Paar muss bildgleich sein. Frueher
//      reichten 45 dB: eine leicht verschobene Farbe waere durchgerutscht.
//   b) Toene: dieselbe Liste, die <original>/video/events.mjs ausgibt.
//   c) Laenge: wie das Original, auf ein Bild genau.
//   d) Ton (abschaltbar mit --no-audio): Effektspur bytegleich mit der des
//      Originals (dessen eigenes sfx.py), Aufnahme gleich der des Originals,
//      und die fertige Mischung nach dem Dekodieren gleich dem Ton des
//      veroeffentlichten Videos. Die .mp4 liegen nicht im Repo; fehlen sie, wird
//      gegen den festgehaltenen Fingerabdruck in tools/fixtures/referenz-ton.json
//      verglichen.
//
// Liest launch-video/ nur, schreibt dort nichts. Sendet nichts, kostet nichts.
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import path from 'node:path'
import os from 'node:os'
import { timesFromAlignment } from '../engine/script.mjs'
import { openStudio, still, run, STUDIO_ROOT } from '../engine/render.mjs'
import { mixFilter, AUDIO } from '../engine/mix.mjs'
import { REFERENCES, ensureReferenceVoice, videoDir, voiceArgs } from './reference-voice.mjs'

const argv = process.argv.slice(2), value = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d }
const N = Number(value('--n', 60)), keep = argv.includes('--keep'), withAudio = !argv.includes('--no-audio'), only = value('--only', null)
const outRoot = path.resolve(value('--out', path.join(os.tmpdir(), 'stampit-regress-' + process.pid)))
const cases = REFERENCES.filter(r => !only || r.id === only || r.video === only)
if (!cases.length) { console.error(`--only ${only}: gibt es nicht. Erlaubt: ${REFERENCES.map(r => r.id).join(', ')}`); process.exit(2) }
const PY = f => path.join(STUDIO_ROOT, 'tools', f)
const PINNED = JSON.parse(readFileSync(path.join(STUDIO_ROOT, 'tools', 'fixtures', 'referenz-ton.json'), 'utf8'))
const sha = f => createHash('sha256').update(readFileSync(f)).digest('hex')
const offline = { env: { ...process.env, STUDIO_VOICE_OFFLINE: '1' } }

async function runCase(ref) {
  const dir = videoDir(ref), out = path.join(outRoot, ref.id), result = { id: ref.id, video: ref.video, ok: true, problems: [], notes: [] }
  const bad = msg => { result.ok = false; result.problems.push(msg); console.error('FEHLER ' + msg) }
  console.log(`\n== ${ref.id}: ${ref.video} gegen ${path.relative(path.resolve(STUDIO_ROOT, '..'), ref.original)} ==`)
  if (!existsSync(path.join(ref.original, 'video', 'render.mjs'))) { bad('Das Original fehlt: ' + ref.original + ' (ohne launch-video/ lässt sich nur tools/selftest.mjs prüfen)'); return result }
  mkdirSync(out, { recursive: true })

  // Stimme: liegt im Repo. Fehlt der Ordner voice/ doch einmal, wird er ohne Netz wiederhergestellt.
  const v = await ensureReferenceVoice(ref)
  if (!v.ok) { bad('Stimme: ' + v.message); return result }
  if (v.restored) result.notes.push('Stimme war nicht im Cache und wurde wiederhergestellt (tools/reference-voice.mjs)')
  const { norm, args } = voiceArgs(dir, out)
  const en = await run('python3', [PY('voice.py'), 'ensure', '--dir', path.join(dir, 'voice'), ...args, '--work', out], offline)
  if (en.code !== 0) { bad('voice.py: ' + (en.err || en.out).trim()); return result }
  const voice = JSON.parse(en.out.trim().split('\n').pop())
  const script = JSON.parse(readFileSync(path.join(dir, 'script.json'), 'utf8'))
  const { times } = timesFromAlignment(norm, JSON.parse(readFileSync(voice.alignment, 'utf8')))

  const studio = await openStudio({ script, times }), page = await studio.page(), state = await studio.state(page)
  if (state.errors.length || studio.problems.length) bad('Seite: ' + [...state.errors, ...studio.problems].join(' | '))
  if (!state.cuesFile) { await studio.close(); return result }

  // ---- b) Toene: gegen das, was das Original JETZT ausgibt (nicht gegen eine abgelegte Kopie)
  const ev = await run('node', ['events.mjs'], { cwd: path.join(ref.original, 'video') })
  if (ev.code !== 0) { bad('events.mjs des Originals: ' + ev.err); await studio.close(); return result }
  const orig = JSON.parse(ev.out), cues = state.cuesFile.events
  let cuesSame = cues.length === orig.events.length, maxDt = 0
  if (cuesSame) cues.forEach((c, i) => { const r = orig.events[i], dt = Math.abs(c.t - r.t); maxDt = Math.max(maxDt, dt); if (c.name !== r.name || dt > 0.002 || c.vol !== r.vol || c.pitch !== r.pitch) cuesSame = false })
  result.cues = { count: cues.length, reference: orig.events.length, identical: cuesSame, maxTimeDiff: +maxDt.toFixed(4), whoosh: [...new Set(cues.filter(c => c.name === 'whoosh').map(c => c.vol))].sort() }
  if (!cuesSame) bad(`Töne weichen ab (${cues.length} gegen ${orig.events.length})`)

  // ---- c) Laenge
  result.duration = { studio: state.duration, original: orig.duration }
  if (Math.abs(state.duration - orig.duration) > 1 / 30) bad(`Länge ${state.duration} s gegen ${orig.duration} s`)

  // ---- a) Standbilder. Das Original benennt seine Bilder nach t.toFixed(2): zwei Zeiten mit gleichem Namen wuerden sich ueberschreiben.
  const want = [...Array.from({ length: N }, (_, i) => +((i + 0.5) * state.duration / N).toFixed(3)), ...cues.map(c => c.t), ...cues.map(c => +(c.t + 0.15).toFixed(3))]
  const seen = new Map()
  for (const t of want.sort((a, b) => a - b)) if (!seen.has(t.toFixed(2)) && t < state.duration) seen.set(t.toFixed(2), t)
  const ts = [...seen.values()]
  console.log(`${ts.length} Standbilder (${N} gleichmäßig verteilt + Zeitpunkt jedes Tons und 0,15 s danach) ...`)
  // Der Original-Renderer wartet nach seek() nicht auf den naechsten Bildwechsel. Sein
  // ERSTES Foto nach dem Laden zeigt deshalb manchmal eine noch nicht neu gezeichnete
  // Ebene (gemessen: 2 von 4 Laeufen, 71 dB). Darum wird der erste Zeitpunkt zweimal
  // verlangt; das zweite Foto ueberschreibt das erste.
  const original = async list => {
    const o = await run('node', ['render.mjs', 'still', path.join(out, 'orig'), String(list[0]), ...list.map(String)], { cwd: path.join(ref.original, 'video') })
    if (o.code !== 0) bad('Original-Renderer: ' + o.err)
  }
  await original(ts)
  const pairs = []
  for (const t of ts) {
    const name = t.toFixed(2), b = path.join(out, `neu-${name}.png`)
    await still(page, t, b); pairs.push({ name, t, a: path.join(out, `orig-${name}.png`), b })
  }
  await studio.close()
  const listFile = path.join(out, 'pairs.json')
  const compare = async list => {
    writeFileSync(listFile, JSON.stringify(list))
    const ps = await run('python3', [PY('psnr.py'), listFile])
    if (ps.code !== 0) { bad('psnr.py: ' + ps.err); return null }
    return JSON.parse(ps.out)
  }
  let rows = await compare(pairs)
  if (!rows) return result
  // Dieselbe Schwaeche kann unter Last auch mitten in der Reihe zuschlagen. Ein Paar, das
  // abweicht, bekommt deshalb bis zu zwei neue Fotos VOM ORIGINAL; das Bild des Studios bleibt
  // stehen. Ein echter Unterschied bleibt dabei ein Unterschied.
  const redone = []
  for (let round = 0; round < 2; round++) {
    const off = rows.filter(r => !r.identical && !r.error)
    if (!off.length) break
    const again = pairs.filter(p => off.some(r => r.name === p.name))
    redone.push(...again.map(p => p.name))
    await original(again.map(p => p.t))
    const fresh = await compare(again)
    if (!fresh) return result
    rows = rows.map(r => fresh.find(f => f.name === r.name) || r)
  }
  if (redone.length) result.notes.push(`Original-Renderer neu fotografiert bei ${[...new Set(redone)].join(', ')} s (sein Foto war beim ersten Mal nicht stabil)`)
  writeFileSync(listFile, JSON.stringify(pairs))
  const worst = rows.reduce((a, b) => a.psnr <= b.psnr ? a : b)
  result.stills = { compared: rows.length, identical: rows.filter(r => r.identical).length, cueTimesIncluded: cues.length, rephotographed: [...new Set(redone)], minPsnrDb: worst.psnr, worstAt: worst.name, notIdentical: rows.filter(r => !r.identical) }
  for (const r of rows) if (!r.identical) bad(`Standbild ${r.name} s ist nicht bildgleich: ${r.psnr} dB (${r.diffPixels ?? '?'} Pixel, größter Abstand ${r.maxDiff ?? '?'}${r.error ? ', ' + r.error : ''})`)
  if (!keep) for (const p of pairs) { rmSync(p.a, { force: true }); rmSync(p.b, { force: true }) }

  // ---- d) Ton
  if (withAudio) {
    const a = result.audio = {}, pin = PINNED[ref.id] || {}
    // Effekte: Toene des Studios durch das sfx.py des Studios, Toene des Originals durch DESSEN sfx.py
    const cuesFile = path.join(out, 'cues.json'), origEv = path.join(out, 'orig-events.json')
    writeFileSync(cuesFile, JSON.stringify(state.cuesFile)); writeFileSync(origEv, JSON.stringify(orig))
    const sfx = path.join(out, 'sfx.wav'), sfxOrig = path.join(out, 'orig-sfx.wav')
    const s1 = await run('python3', [PY('sfx.py'), cuesFile, sfx]), s2 = await run('python3', [path.join(ref.original, 'sfx.py'), origEv, sfxOrig])
    if (s1.code !== 0 || s2.code !== 0) bad('sfx.py: ' + (s1.err || s2.err))
    else { a.sfxIdentical = readFileSync(sfx).equals(readFileSync(sfxOrig)); if (!a.sfxIdentical) bad('Effektspur ist nicht bytegleich mit der des Originals') }

    // Aufnahme: dieselbe Datei wie im Original (v10) bzw. derselbe Ton nach dem Satz-Austausch (v7)
    if (pin.voiceFileSha256) {
      a.voice = { how: 'Datei wie geliefert', sha256: sha(voice.audio), pinned: pin.voiceFileSha256 }
      const of = path.join(ref.original, 'voice', 'liam.mp3')
      if (existsSync(of)) a.voice.sameAsOriginalFile = sha(of) === a.voice.sha256
      a.voice.identical = a.voice.sha256 === pin.voiceFileSha256 && a.voice.sameAsOriginalFile !== false
    } else {
      const h = JSON.parse((await run('python3', [PY('audiocmp.py'), 'sha', voice.audio])).out)
      a.voice = { how: 'aus Aufnahme davor + neuem Satz zusammengesetzt', samples: h.samples, sha256: h.sha256, pinned: pin.voicePcmSha256, identical: h.sha256 === pin.voicePcmSha256 && h.samples === pin.voiceSamples }
      const ow = path.join(ref.original, 'voice', 'liam.wav') // nicht im Repo; wenn sie da ist, zusaetzlich direkt vergleichen
      if (existsSync(ow)) { const c = JSON.parse((await run('python3', [PY('audiocmp.py'), 'cmp', voice.audio, ow])).out); a.voice.againstOriginalWav = { differing: c.differing, samples: c.samplesB }; if (c.differing || c.extraSamples) a.voice.identical = false }
    }
    if (!a.voice.identical) bad('Die Aufnahme ist nicht die des Originals')

    // Mischung: derselbe Filter wie in make.mjs, kodiert wie im Video, dann dekodiert verglichen
    const len = (Math.round(state.duration * 30) / 30).toFixed(4), mix = path.join(out, 'mix.m4a')
    const mx = await run('ffmpeg', ['-v', 'error', '-y', '-i', voice.audio, '-i', sfx, '-filter_complex', mixFilter({ voiceIn: 0, sfxIn: 1, lead: norm.timing.lead, len, mix: norm.mix }), '-map', '[a]', '-c:a', AUDIO.codec, '-b:a', AUDIO.bitrate, mix])
    if (mx.code !== 0) bad('ffmpeg (Mischung): ' + mx.err)
    else if (existsSync(ref.mp4)) {
      const c = JSON.parse((await run('python3', [PY('audiocmp.py'), 'cmp', mix, ref.mp4])).out)
      a.mix = { against: path.basename(ref.mp4), ...c, identical: c.differing === 0 && c.extraPeak === 0 }
      // "gleichwertig" heisst: Unterschied mindestens 60 dB unter dem Signal. Erreicht wird Gleichheit.
      if (!(c.rmsDiffDb <= -60 && c.correlation >= 0.9999 && c.extraPeak <= 1 && c.extraSamples <= 4410)) bad(`Ton der Mischung weicht vom veröffentlichten Video ab: ${c.differing} von ${c.common} Abtastwerten, Unterschied ${c.rmsDiffDb} dB, Korrelation ${c.correlation}`)
    } else {
      const h = JSON.parse((await run('python3', [PY('audiocmp.py'), 'sha', mix, String(pin.mixSamples || 0)])).out)
      const ff = ((await run('ffmpeg', ['-version'])).out.split('\n')[0].match(/version (\S+)/) || [])[1]
      a.mix = { against: 'Fingerabdruck (das .mp4 liegt nicht im Repo)', sha256: h.sha256, pinned: pin.mixSha256, identical: h.sha256 === pin.mixSha256, ffmpeg: ff, pinnedWith: PINNED.ffmpeg }
      if (!a.mix.identical) {
        // Ein anderes ffmpeg kodiert AAC anders: dann sagt der Fingerabdruck nichts. Mit demselben ffmpeg ist es ein Fehler.
        if (ff === PINNED.ffmpeg) bad('Ton der Mischung hat einen anderen Fingerabdruck als das veröffentlichte Video')
        else result.notes.push(`Mischung nicht vergleichbar: ffmpeg ${ff} statt ${PINNED.ffmpeg}, und ${path.basename(ref.mp4)} liegt nicht vor. Effektspur und Aufnahme sind geprüft.`)
      }
    }
    if (!keep) for (const f of [sfx, sfxOrig, mix, ...(voice.audio.startsWith(out + path.sep) ? [voice.audio] : [])]) rmSync(f, { force: true })
  }

  writeFileSync(path.join(out, 'regress.json'), JSON.stringify(result, null, 1))
  console.log(`Standbilder: ${result.stills.compared} verglichen, ${result.stills.identical} bildgleich${result.stills.identical === result.stills.compared ? '' : `, schlechtestes Paar ${worst.psnr} dB bei ${worst.name} s`}`)
  console.log(`Töne: ${result.cues.count} (Original ${result.cues.reference}), gleich: ${cuesSame}, größter Zeitabstand ${result.cues.maxTimeDiff} s, Wischer-Lautstärken ${result.cues.whoosh.join(' / ')}`)
  console.log(`Länge: ${state.duration} s (Original ${orig.duration} s)`)
  if (result.audio) {
    const a = result.audio, m = a.mix || {}
    console.log(`Ton: Effektspur bytegleich: ${a.sfxIdentical}; Aufnahme gleich: ${a.voice.identical} (${a.voice.how}); Mischung gegen ${m.against}: ${m.identical ? 'gleich' : 'NICHT gleich'}${m.common ? ` (${m.differing} von ${m.common} Abtastwerten verschieden, Unterschied ${m.rmsDiffDb} dB, Korrelation ${m.correlation}, Studio ${m.samplesA} / Video ${m.samplesB} Abtastwerte, Überhang still: ${m.extraPeak === 0})` : ''}`)
  }
  for (const n of result.notes) console.log('Hinweis: ' + n)
  console.log((result.ok ? 'BESTANDEN' : 'GESCHEITERT') + ` (${ref.id}) - Einzelheiten: ${path.join(out, 'regress.json')}`)
  return result
}

const results = []
for (const ref of cases) results.push(await runCase(ref))
const ok = results.every(r => r.ok)
console.log(`\n${ok ? 'BESTANDEN' : 'GESCHEITERT'}: ${results.map(r => `${r.id} ${r.ok ? 'gut' : 'FEHLER'}`).join(', ')}`)
process.exit(ok ? 0 : 1)
