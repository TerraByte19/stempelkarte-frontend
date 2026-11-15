#!/usr/bin/env node
// make.mjs <video-ordner> [Schalter]   -   baut EIN Video aus seinem script.json
//
//   node studio/make.mjs studio/videos/<datum>-<slug> --no-voice     Entwurf: geschaetzte Zeiten, nur Effekte, kostet nichts
//   node studio/make.mjs studio/videos/<datum>-<slug> --stills 2,8.5 nur Standbilder (PNG) zu diesen Sekunden, in Sekunden fertig
//   node studio/make.mjs studio/videos/<datum>-<slug> --check        nur pruefen, nichts rendern
//   node studio/make.mjs studio/videos/<datum>-<slug>                fertiges Video mit Stimme aus dem Cache
//   ... --allow-voice-spend                                           fehlt die Stimme im Cache: jetzt bei ElevenLabs aufnehmen (kostet!)
//   ... --allow-voice-spend --splice                                  nur den EINEN geaenderten Satz neu aufnehmen
//
// Ablauf: Stimme (nur Cache, solange nicht freigegeben) -> Wort-Zeiten ->
// Pruefungen -> Bilder (Playwright -> ffmpeg) -> Toene aus der Seite ->
// sfx.py -> Mischung -> out/video.mp4, out/poster.png, out/sheet.png, out/report.json
// (--check, --stills und Abbrueche vor dem Bau schreiben nach out/check.json,
// damit der Bericht eines fertigen Videos stehen bleibt)
//
// Ende-Codes: 0 gut | 1 Pruefung gescheitert | 2 Skript fehlerhaft | 3 Stimme muesste bezahlt werden, ist aber nicht freigegeben
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { normalize, estimateTimes, timesFromAlignment, voiceCost, TIMING } from './engine/script.mjs'
import { openStudio, still, renderVideo, run, STUDIO_ROOT } from './engine/render.mjs'
import { runChecks } from './engine/checks.mjs'

const FPS = 30
// Mischung wie im ersten Video: Stimme vorn, Effekte deutlich darunter, Begrenzer gegen Uebersteuern
const MIX = { voice: 1.5, sfx: 0.45, limit: 0.95, bitrate: '192k' }

const argv = process.argv.slice(2), flag = n => argv.includes(n)
const value = n => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : null }
const target = argv.find((a, i) => !a.startsWith('--') && !['--stills', '--jobs'].includes(argv[i - 1]))
if (!target || flag('--help')) { console.log(readFileSync(new URL(import.meta.url), 'utf8').split('\n').filter(l => l.startsWith('//')).map(l => l.slice(3)).join('\n')); process.exit(target ? 0 : 2) }
const dir = [path.resolve(target), path.join(STUDIO_ROOT, 'videos', target)].find(d => existsSync(path.join(d, 'script.json')))
if (!dir) { console.error(`Kein script.json gefunden in "${target}" (auch nicht unter studio/videos/${target}).`); process.exit(2) }

const noVoice = flag('--no-voice'), allowSpend = flag('--allow-voice-spend'), splice = flag('--splice'), force = flag('--force'), checkOnly = flag('--check')
const stills = value('--stills') ? value('--stills').split(',').map(Number).filter(t => Number.isFinite(t) && t >= 0) : null
const jobs = Math.max(1, Math.min(6, Number(value('--jobs') || 3)))
const out = path.join(dir, 'out'), work = path.join(out, 'work')
mkdirSync(work, { recursive: true })
const log = (...a) => console.log(...a)
const t0 = Date.now()
const report = { video: path.basename(dir), builtAt: new Date().toISOString(), mode: stills ? 'stills' : checkOnly ? 'check' : noVoice ? 'no-voice' : 'voice', ok: false, files: {} }
// report.json beschreibt immer den letzten ECHTEN Bauversuch (das Video daneben).
// Schnelle Laeufe (--check, --stills) und Abbrueche vor dem Bau (Skriptfehler,
// Stimme nicht freigegeben) schreiben nach check.json - sonst wuerde ein kurzer
// Blick mit --check den Bericht eines fertigen Videos ueberschreiben.
let reportName = 'check.json'
const finish = code => {
  report.seconds = +((Date.now() - t0) / 1000).toFixed(1)
  writeFileSync(path.join(out, reportName), JSON.stringify(report, null, 1))
  log(`Bericht: ${path.join(out, reportName)}`)
  process.exit(code)
}

// ---------------------------------------------------------------- 1. Skript
let script, norm
try { script = JSON.parse(readFileSync(path.join(dir, 'script.json'), 'utf8')); norm = normalize(script) }
catch (e) { console.error('script.json: ' + e.message); report.errors = ['[skript] ' + e.message]; finish(2) }
const chars = voiceCost(norm)
report.title = norm.meta.title
report.text = { words: norm.words, spoken: norm.spoken }
log(`${norm.meta.title}: ${norm.scenes.length} Szenen, ${norm.words} Wörter, ${chars} Zeichen gesprochener Text`)

// ---------------------------------------------------------------- 2. Stimme
// Die Stimme ist das Einzige, das Geld kostet. Ohne --allow-voice-spend wird
// nur der Cache gelesen; fehlt die Aufnahme, endet der Lauf hier mit Code 3.
let times, voice = null
report.elevenLabs = { chars, cached: false, wouldSpend: chars, spent: 0 }
if (noVoice) {
  times = estimateTimes(norm)
  log(`Stimme: aus (--no-voice), Zeiten geschätzt mit ${TIMING.step} s je Wort. Eine Aufnahme würde ${chars} Zeichen kosten.`)
} else {
  const textFile = path.join(work, 'spoken.txt'), setFile = path.join(work, 'voice-settings.json'), py = path.join(STUDIO_ROOT, 'tools', 'voice.py')
  writeFileSync(textFile, norm.spoken); writeFileSync(setFile, JSON.stringify(norm.voice))
  const base = ['--dir', path.join(dir, 'voice'), '--text-file', textFile, '--settings', setFile, ...(splice ? ['--splice'] : [])]
  const pl = await run('python3', [py, 'plan', ...base])
  if (pl.code !== 0) { console.error(pl.err || pl.out); report.errors = ['[stimme] ' + (pl.err || pl.out).trim()]; finish(2) }
  const plan = JSON.parse(pl.out)
  Object.assign(report.elevenLabs, { cached: plan.cached, wouldSpend: plan.would_spend, how: plan.how, key: plan.key })
  if (plan.cached) log(`Stimme: im Cache (${plan.key}), dieser Lauf kostet 0 Zeichen.`)
  else if (!allowSpend) {
    console.error(`Stimme: NICHT im Cache. Eine Aufnahme würde ${plan.would_spend} Zeichen bei ElevenLabs kosten (${plan.how === 'splice' ? 'nur der geänderte Satz: "' + plan.sentence + '"' : 'ganzer Text'}).`)
    console.error('Es wurde nichts gesendet. Erst den Entwurf mit --no-voice prüfen, dann denselben Aufruf mit --allow-voice-spend wiederholen.')
    report.errors = [`[stimme] keine Aufnahme im Cache; ${plan.would_spend} Zeichen wären nötig (--allow-voice-spend)`]
    finish(3)
  } else log(`Stimme: nicht im Cache. --allow-voice-spend ist gesetzt: ${plan.would_spend} Zeichen werden jetzt bei ElevenLabs verbraucht (${plan.how}).`)
  const en = await run('python3', [py, 'ensure', ...base, ...(allowSpend ? ['--allow-voice-spend'] : [])])
  if (en.code !== 0) { console.error(en.err || en.out); report.errors = ['[stimme] ' + (en.err || en.out).trim().slice(-600)]; finish(en.code === 3 ? 3 : 2) }
  const got = JSON.parse(en.out.trim().split('\n').pop())
  report.elevenLabs.spent = got.spent
  try {
    const al = JSON.parse(readFileSync(got.alignment, 'utf8')), r = timesFromAlignment(norm, al)
    times = r.times
    voice = { wav: got.wav, key: got.key, source: got.source, words: norm.words, seconds: r.voiceLength, voiceEnd: r.voiceEnd, chars }
  } catch (e) { console.error('Stimme: ' + e.message); report.errors = ['[stimme] ' + e.message]; finish(2) }
}
writeFileSync(path.join(out, 'times.json'), JSON.stringify({ estimated: noVoice, lead: norm.timing.lead, hold: norm.timing.hold, voiceEnd: voice ? voice.voiceEnd : null, times: Object.fromEntries(norm.caps.map((c, i) => [c.id, times[i]])) }))

// ---------------------------------------------------------------- 3. Seite aufbauen und pruefen
const studio = await openStudio({ script, times })
let code = 0
try {
  const restPage = await studio.page({ rest: true })
  const restState = await studio.state(restPage)
  const measured = restState.errors.length ? { caps: [], safe: [], lines: [] } : await restPage.evaluate(() => window.STUDIO.measure())
  await restPage.close()
  const main = await studio.page(), state = await studio.state(main)
  if (!state.duration) {
    report.errors = [...new Set([...state.errors, ...studio.problems])].map(e => '[seite] ' + e)
    report.errors.forEach(e => console.error('FEHLER ' + e))
    await studio.close(); finish(1)
  }
  const res = runChecks({ state, measured, problems: studio.problems, voice })
  if (!stills && !checkOnly) reportName = 'report.json'
  Object.assign(report, {
    duration: state.duration, fps: FPS, frames: Math.round(state.duration * FPS),
    voice: voice ? { source: voice.source, key: voice.key, seconds: +voice.seconds.toFixed(3), words: voice.words, wordsPerMinute: res.wpm } : null,
    checks: res.checks, errors: res.errors, warnings: res.warnings,
    scenes: state.scenes, captions: state.caps, anchors: state.anchors,
    cues: state.cues, cueCount: state.cues.length
  })
  log(`Länge ${state.duration} s, ${state.scenes.length} Szenen, ${state.cues.length} Töne${res.wpm ? `, Stimme ${res.wpm} Wörter/Minute` : ''}`)
  for (const c of res.checks) log(`  ${c.ok ? 'ok    ' : c.level === 'warn' ? 'WARNUNG' : 'FEHLER'} ${c.name}: ${c.what}${c.ok ? '' : '\n      - ' + c.details.join('\n      - ')}`)
  writeFileSync(path.join(out, 'cues.json'), JSON.stringify(state.cuesFile))
  report.files.cues = 'out/cues.json'

  if (stills) {
    // Standbilder gibt es auch bei gescheiterter Pruefung: man will ja sehen, was nicht passt
    const sd = path.join(out, 'stills'); mkdirSync(sd, { recursive: true }); report.files.stills = []
    for (const t of stills) {
      const f = path.join(sd, `still-${t.toFixed(2)}.png`); await still(main, Math.min(t, state.duration), f); report.files.stills.push(path.relative(dir, f)); log('Standbild ' + f)
    }
    report.ok = res.ok; code = res.ok ? 0 : 1
  } else if (checkOnly) {
    report.ok = res.ok; code = res.ok ? 0 : 1
  } else if (!res.ok && !force) {
    console.error('Prüfung gescheitert: es wird nicht gerendert. Fehler beheben (Hinweise oben und im Bericht) oder mit --stills nachsehen. --force rendert trotzdem.')
    code = 1
  } else {
    // ------------------------------------------------------------ 4. Bilder
    const pages = [main]
    while (pages.length < jobs) pages.push(await studio.page())
    const sheetDir = path.join(work, 'sheet'); mkdirSync(sheetDir, { recursive: true })
    for (const f of readdirSync(sheetDir)) if (/^\d+\.jpg$/.test(f)) rmSync(path.join(sheetDir, f))
    const silent = path.join(work, 'silent.mp4')
    const n = await renderVideo(pages, {
      duration: state.duration, fps: FPS, out: silent, log,
      onFrame: (i, buf) => { if (i % FPS === 0) writeFileSync(path.join(sheetDir, `${i / FPS}.jpg`), buf) }
    })
    await still(main, state.poster, path.join(out, 'poster.png'))
    // ------------------------------------------------------------ 5. Toene
    const sfx = path.join(work, 'sfx.wav')
    const sx = await run('python3', [path.join(STUDIO_ROOT, 'tools', 'sfx.py'), path.join(out, 'cues.json'), sfx])
    if (sx.code !== 0) throw new Error('sfx.py: ' + (sx.err || sx.out))
    // ------------------------------------------------------------ 6. Mischung
    const len = (n / FPS).toFixed(4), lead = Math.round(norm.timing.lead * 1000)
    const end = `alimiter=limit=${MIX.limit},apad,atrim=0:${len},aformat=sample_rates=44100:channel_layouts=mono[a]`
    const inputs = voice ? ['-i', voice.wav, '-i', sfx] : ['-i', sfx]
    const graph = voice
      ? `[1:a]adelay=${lead}:all=1,volume=${MIX.voice}[v];[2:a]volume=${MIX.sfx}[s];[v][s]amix=inputs=2:normalize=0:duration=longest,${end}`
      : `[1:a]volume=${MIX.sfx},${end}`
    const video = path.join(out, 'video.mp4')
    const mx = await run('ffmpeg', ['-v', 'error', '-y', '-i', silent, ...inputs, '-filter_complex', graph, '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', MIX.bitrate, '-movflags', '+faststart', video])
    if (mx.code !== 0) throw new Error('ffmpeg (Mischung): ' + mx.err)
    // ------------------------------------------------------------ 7. Uebersicht
    const sh = await run('python3', [path.join(STUDIO_ROOT, 'tools', 'sheet.py'), sheetDir, path.join(out, 'sheet.png')])
    if (sh.code !== 0) throw new Error('sheet.py: ' + (sh.err || sh.out))
    const probe = await run('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_type,codec_name,duration,nb_frames', '-of', 'json', video])
    report.streams = JSON.parse(probe.out).streams
    Object.assign(report.files, { video: 'out/video.mp4', poster: 'out/poster.png', sheet: 'out/sheet.png' })
    report.posterAt = +state.poster.toFixed(3)
    // Zwischenergebnisse wegraeumen (nur die Dateien, die dieser Lauf selbst angelegt hat)
    if (!flag('--keep-work')) {
      for (const f of [silent, sfx]) rmSync(f, { force: true })
      for (const f of readdirSync(sheetDir)) if (/^\d+\.jpg$/.test(f)) rmSync(path.join(sheetDir, f))
    }
    report.ok = res.ok; code = res.ok ? 0 : 1
    log(`Fertig: ${video} (${n} Bilder, ${len} s${voice ? ', mit Stimme' : ', OHNE Stimme (Entwurf)'})`)
    log(`Ansehen: ${path.join(out, 'sheet.png')} (ein Bild je Sekunde)`)
  }
} catch (e) {
  console.error('FEHLER ' + (e.stack || e.message)); report.errors = [...(report.errors || []), '[bau] ' + e.message]; code = 1
}
await studio.close()
finish(code)
