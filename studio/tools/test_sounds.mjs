#!/usr/bin/env node
// test_sounds.mjs - Pruefungen fuer die Klangbibliothek (studio/sounds/) und ihren Weg ins Video.
// Kein Netz, keine Kosten, rund eine halbe Minute.  node studio/tools/test_sounds.mjs
//
// Festgenagelt wird:
//   - die Bibliothek ist vollstaendig: 21 Klaenge, je Original (wie geliefert) und bearbeitete
//     Fassung, Herkunft, Anweisung, Datum, Lizenzhinweis, Laenge und Lautheit; die Dateien passen
//     zu ihren Fingerabdruecken (tools/soundlib.py verify), alle auf Spitze -1 dBFS, 48 kHz mono
//   - ALTE SKRIPTE KLINGEN WIE VORHER: sfx.py ergibt fuer die Toene der beiden Referenzvideos und
//     des zweiten Videos bytegleich dieselbe Datei wie die Fassung vor der Bibliothek (git HEAD).
//     Davor war die Sorge: ein Klang aus der Bibliothek durch dieselbe Schleife wie die
//     berechneten Toene haette deren gemeinsamen Zufall und ihre Normierung verschoben.
//   - "sounds" im Skript: Form wird geprueft (Tippfehler, doppelter Zeitpunkt, Lautstaerke), ein
//     altes Skript bekommt kein neues Feld; die Seite setzt den Klang auf Anker, Wort oder Anfang,
//     lehnt unbekannte Namen ab und laesst die Ereignisse alter Art unveraendert
//   - sfx.py mischt den Klang auf die richtige Zeit, senkt ihn unter Woertern um "duck" dB ab und
//     misst, wie weit die Stimme darueber liegt; die Pruefung "effekte" warnt bei einem Klang
//     ohne Absenkung ueber Woertern
//   - der Server der Seite gibt aus sounds/ nur die Liste heraus, keine Klangdatei
//
// Spaeter in tools/selftest.mjs einhaengen (siehe NOTIZEN.md des Doener-Videos):
//   const ts = await run('node', [path.join(STUDIO_ROOT, 'tools', 'test_sounds.mjs')])
//   check('Klangbibliothek (tools/test_sounds.mjs)', ts.code === 0, ts.out.trim().split('\n').pop())
import { readFileSync, writeFileSync, mkdtempSync, rmSync, existsSync } from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import http from 'node:http'
import { normalize, estimateTimes, LIBSOUND, SOUND } from '../engine/script.mjs'
import { openStudio, run, STUDIO_ROOT } from '../engine/render.mjs'
import { runChecks } from '../engine/checks.mjs'

process.env.STUDIO_VOICE_OFFLINE = '1'
const results = []
const check = (name, ok, detail = '') => { results.push(!!ok); console.log(`${ok ? 'ok    ' : 'FEHLER'} ${name}${detail ? ' - ' + detail : ''}`) }
const throws = fn => { try { fn(); return null } catch (e) { return e.message } }
const tmp = mkdtempSync(path.join(os.tmpdir(), 'stampit-sounds-'))
const SFX = path.join(STUDIO_ROOT, 'tools', 'sfx.py'), LIB = path.join(STUDIO_ROOT, 'tools', 'soundlib.py')
const lib = JSON.parse(readFileSync(path.join(STUDIO_ROOT, 'sounds', 'sounds.json'), 'utf8'))

// ---- 1. Die Bibliothek
const WANT = ['vine-boom', 'plattenkratzer', 'publikum-keucht', 'publikum-ooh', 'drama-stoss', 'grillen-stille', 'kasse', 'muenzen', 'ladenglocke', 'grill-brutzeln', 'papier-knuellen', 'muelleimer', 'trauriger-trompeter', 'erfolg-pling', 'wischer', 'handy-vibriert', 'herzschlag', 'applaus', 'keuchen-1', 'keuchen-2', 'keuchen-3']
const names = lib.sounds.map(s => s.name)
// Die Sammlung waechst (z. B. kam am 16.11.2026 "herz-zerspringt" auf Wunsch des Betreibers
// dazu). Festgenagelt wird deshalb nur: die ersten 21 sind alle da, kein Name doppelt.
check('Bibliothek: die ersten 21 Klänge sind da, kein Name doppelt', names.length >= 21 && new Set(names).size === names.length && WANT.every(n => names.includes(n)), names.join(', '))
const incomplete = lib.sounds.filter(s => !(s.file && s.original && s.source && ('prompt' in s) && s.date === '2026-11-16' && /kommerzielle Nutzung/.test(s.licence || '') && s.duration > 0 && typeof s.lufs === 'number' && s.sha256 && s.pcmSha256 && s.sha256Original))
check('Bibliothek: jeder Klang mit Herkunft, Anweisung, Datum, Lizenz, Länge, Lautheit und Fingerabdrücken', !incomplete.length, incomplete.map(s => s.name).join(', '))
// Fremde Aufnahmen gehoeren nie in die Sammlung: nur was mit dem Tarif des Betreibers
// erzeugt wurde (Soundeffekte oder unsere eigene Stimme).
check('Bibliothek: nur eigene Quellen (ElevenLabs Sound Effects oder ElevenLabs TTS mit Liam)',
  lib.sounds.every(s => s.source === 'ElevenLabs Sound Effects' || s.source === 'ElevenLabs TTS eleven_v3, Stimme Liam'),
  lib.sounds.filter(s => s.source !== 'ElevenLabs Sound Effects' && s.source !== 'ElevenLabs TTS eleven_v3, Stimme Liam').map(s => s.name).join(', '))
check('Bibliothek: gemeinsame Spitze -1 dBFS, bearbeitet nie länger als das Original',
  lib.sounds.every(s => Math.abs(s.peakDb - -1) <= 0.1 && s.duration <= s.durationOriginal + 0.001), lib.sounds.map(s => s.peakDb).filter(p => Math.abs(p + 1) > 0.1).join(', '))
{
  const v = await run('python3', [LIB, 'verify'])
  check('Bibliothek: Dateien passen zu ihren Fingerabdrücken (soundlib.py verify)', v.code === 0, (v.out || v.err).trim().slice(0, 160))
  const pr = await run('ffprobe', ['-v', 'error', '-show_entries', 'stream=sample_rate,channels,codec_name', '-of', 'csv=p=0', path.join(STUDIO_ROOT, 'sounds', lib.sounds[0].file)])
  check('Bibliothek: FLAC, 48 kHz, mono', pr.out.trim() === 'flac,48000,1', pr.out.trim())
  check('Bibliothek: keine .wav (von Git ausgenommen)', !lib.sounds.some(s => /\.wav$/.test(s.file) || /\.wav$/.test(s.original)))
}

// ---- 2. Alte Skripte klingen wie vorher: sfx.py gegen die Fassung vor der Bibliothek
{
  const old = await run('git', ['-C', STUDIO_ROOT, 'show', 'HEAD:studio/tools/sfx.py'])
  if (old.code !== 0 || !/def pop/.test(old.out)) check('sfx.py vor der Bibliothek aus git (HEAD) lesbar', false, old.err.trim())
  else if (/lib = \[e for e/.test(old.out)) console.log('(übersprungen) git HEAD enthält schon die Bibliothek; der Vergleich gilt nur vor dem ersten Commit. regress.mjs vergleicht weiter mit den Originalen.')
  else {
    const oldPy = path.join(tmp, 'sfx-alt.py'); writeFileSync(oldPy, old.out)
    const cases = [['Fassung 7', path.join(STUDIO_ROOT, 'tools', 'fixtures', 'referenz-cues.json')], ['Fassung 10', path.join(STUDIO_ROOT, 'tools', 'fixtures', 'final-cues.json')]]
    const k = path.join(STUDIO_ROOT, 'videos', '2026-11-16-ist-das-koscher', 'out', 'cues.json')
    if (existsSync(k)) cases.push(['zweites Video', k])
    for (const [label, cues] of cases) {
      const a = path.join(tmp, 'alt.wav'), b = path.join(tmp, 'neu.wav')
      const ra = await run('python3', [oldPy, cues, a]), rb = await run('python3', [SFX, cues, b])
      const same = ra.code === 0 && rb.code === 0 && readFileSync(a).equals(readFileSync(b))
      check(`Alte Töne bytegleich: ${label} (sfx.py vor und nach der Bibliothek)`, same, `${readFileSync(b).length} Bytes`)
    }
  }
}

// ---- 3. Skript: Form von "sounds"
const tiny = (extra = {}, top = {}) => normalize({ meta: { title: 't', slug: 't' }, ...top, scenes: [{ component: 'stamp-check', captions: [{ lines: ['Natürlich geht das!'] }], ...extra }] })
check('"sounds" wird gelesen (Vorgaben vol 1, duck an, offset 0)', JSON.stringify(tiny({ sounds: [{ sound: 'vine-boom', anchor: 'hit' }] }).scenes[0].parts[0].sounds) === '[{"sound":"vine-boom","vol":1,"duck":true,"offset":0,"anchor":"hit"}]')
check('"sounds": Tippfehler, doppelter Zeitpunkt, fehlender Name und zu laut werden abgelehnt',
  /"vlo" gibt es nicht/.test(throws(() => tiny({ sounds: [{ sound: 'vine-boom', at: 'start', vlo: 1 }] })) || '') &&
  /genau EINMAL/.test(throws(() => tiny({ sounds: [{ sound: 'vine-boom', at: 'start', anchor: 'hit' }] })) || '') &&
  /genau EINMAL/.test(throws(() => tiny({ sounds: [{ sound: 'vine-boom' }] })) || '') &&
  /"sound" fehlt/.test(throws(() => tiny({ sounds: [{ at: 'start' }] })) || '') &&
  /"vol" muss/.test(throws(() => tiny({ sounds: [{ sound: 'vine-boom', at: 'start', vol: 9 }] })) || ''))
check('"sound.duck", "maxOverlap", "minMargin" sind erlaubt und geprüft, andere Namen nicht',
  tiny({}, { sound: { duck: -12 } }).sound.duck === -12 && /"sound.duck"/.test(throws(() => tiny({}, { sound: { duck: 5 } })) || '') && /"dukc" gibt es nicht/.test(throws(() => tiny({}, { sound: { dukc: -3 } })) || ''))
{
  // Ein altes Skript: kein Teil bekommt ein Feld "sounds", "sound" bleibt genau die alte Vorgabe
  const ref = normalize(JSON.parse(readFileSync(path.join(STUDIO_ROOT, 'videos', '2026-11-15-kaffee-aufs-haus', 'script.json'), 'utf8')))
  check('altes Skript: keine neuen Felder (kein "sounds" an Teilen, "sound" wie vorher)', ref.scenes.every(sc => sc.parts.every(p => !('sounds' in p))) && JSON.stringify(ref.sound) === JSON.stringify(SOUND), JSON.stringify(ref.sound))
}

// ---- 4. Seite: Zeitpunkte, unbekannte Namen, Ereignisse alter Art
const base = {
  meta: { title: 't', slug: 't' }, captionStyle: { mode: 'wort' },
  scenes: [{ component: 'stamp-check', anchors: { hit: { cap: 0, word: 0, offset: 0.3 } },
    sounds: [{ sound: 'vine-boom', anchor: 'hit', vol: 0.8 }, { sound: 'erfolg-pling', cap: 0, word: 2, offset: 0.1, duck: false }, { sound: 'wischer', at: 'start', offset: 0.2 }],
    captions: [{ lines: ['Natürlich | ist das | koscher!'] }] }, { component: 'cta-comment', captions: [{ role: 'cta', lines: ['Kommentiere KARTE,{Karte,}', 'und wir melden uns.'] }] }]
}
async function stateOf(script) {
  const st = await openStudio({ script, times: estimateTimes(normalize(script)) })
  const pg = await st.page(), s = await st.state(pg)
  await st.close()
  return { s, problems: st.problems }
}
{
  const { s } = await stateOf(base), libs = s.cues.filter(c => c.lib), n = normalize(base), t = estimateTimes(n)[0], hit = s.anchors.find(a => a.name === 'hit')
  const at = name => libs.find(c => c.name === name)
  check('Seite: Klang am Anker, am Wort und am Anfang auf die richtige Zeit', libs.length === 3 && Math.abs(at('vine-boom').t - hit.t) < 0.002 && Math.abs(at('erfolg-pling').t - (t[2] + 0.1)) < 0.002 && Math.abs(at('wischer').t - 0.2) < 0.002, libs.map(c => `${c.name} ${c.t}`).join(', '))
  check('Seite: Bibliotheksklänge tragen "lib" und "duck" in cues.json, alle anderen nur t, name, vol, pitch',
    s.cuesFile.events.filter(e => e.lib).length === 3 && s.cuesFile.events.filter(e => e.lib).every(e => typeof e.duck === 'boolean') &&
    s.cuesFile.events.filter(e => !e.lib).every(e => Object.keys(e).join() === 't,name,vol,pitch'))
  const bad = JSON.parse(JSON.stringify(base)); bad.scenes[0].sounds[0].sound = 'vine-bum'
  const r = await stateOf(bad)
  check('Seite: unbekannter Klang bricht ab und nennt die erlaubten', r.s.errors.some(e => /"vine-bum" gibt es nicht/.test(e) && /vine-boom/.test(e)), r.s.errors.join(' | ').slice(0, 140))
  const badA = JSON.parse(JSON.stringify(base)); badA.scenes[0].sounds[0].anchor = 'hut'
  const ra = await stateOf(badA)
  check('Seite: Klang an einem Anker, den es nicht gibt, bricht ab', ra.s.errors.some(e => /Anker "hut" gibt es in diesem Baustein nicht/.test(e)), ra.s.errors.join(' | ').slice(0, 140))
}

// ---- 5. Pruefung "effekte": Klang ohne Absenkung ueber Woertern
{
  const state = { cues: [{ t: 1.0, name: 'grillen-stille', lib: true, duck: false, scene: 1 }, { t: 1.0, name: 'applaus', lib: true, duck: true, scene: 1 }], caps: [], duration: 30, warnings: [] }
  const r = runChecks({ state, measured: { caps: [], safe: [], lines: [] }, problems: [], voice: null, sounds: { speech: [[1.2, 2.0]], length: { 'grillen-stille': 2.4, applaus: 1.9 }, maxOverlap: LIBSOUND.maxOverlap } })
  const c = r.checks.find(x => x.name === 'effekte')
  check('Prüfung "effekte" warnt bei Klang ohne Absenkung über Wörtern, nicht beim abgesenkten', c && c.level === 'warn' && c.details.length === 1 && /grillen-stille/.test(c.details[0]) && r.ok, c ? c.details.join(' | ') : 'fehlt')
  const r0 = runChecks({ state: { cues: [], caps: [], duration: 30, warnings: [] }, measured: { caps: [], safe: [], lines: [] }, problems: [], voice: null })
  check('Prüfung "effekte" gibt es ohne Bibliotheksklänge gar nicht (alte Berichte bleiben gleich)', !r0.checks.some(x => x.name === 'effekte'))
}

// ---- 6. sfx.py: Zeit, Absenkung, Abstand zur Stimme
{
  const cues = path.join(tmp, 'c.json'), sp = path.join(tmp, 's.json'), a = path.join(tmp, 'a.wav'), b = path.join(tmp, 'b.wav')
  writeFileSync(cues, JSON.stringify({ duration: 4, events: [{ t: 0.5, name: 'pop', vol: 0.8, pitch: 1 }, { t: 1.0, name: 'grillen-stille', vol: 1, pitch: 1, lib: true, duck: true }] }))
  writeFileSync(sp, JSON.stringify([[1.6, 2.4]]))
  const r1 = await run('python3', [SFX, cues, a]), r2 = await run('python3', [SFX, cues, b, '--speech', sp, '--duck', '-10'])
  const pcm = async f => { const r = await run('python3', ['-c', `import numpy as np,subprocess,sys\nx=np.frombuffer(subprocess.run(['ffmpeg','-v','error','-i',sys.argv[1],'-f','f32le','-ac','1','-ar','48000','-'],capture_output=True).stdout,dtype='<f4')\nrms=lambda a,b: 10*np.log10(np.mean(x[int(a*48000):int(b*48000)]**2)+1e-20)\nloud=np.nonzero(np.abs(x[int(0.8*48000):])>0.005)[0]\nprint(round(float(rms(1.75,2.3)),2), round(float(rms(1.1,1.5)),2), round(0.8+loud[0]/48000,4), round(float(np.abs(x).max()),3))`, f]); return r.out.trim().split(' ').map(Number) }
  if (r1.code !== 0 || r2.code !== 0) check('sfx.py mischt Bibliotheksklänge', false, (r1.err + r2.err).slice(-300))
  else {
    const [wA, freeA, onA] = await pcm(a), [wB, freeB] = await pcm(b), info = JSON.parse(readFileSync(b + '.lib.json', 'utf8'))
    check('sfx.py: Bibliotheksklang beginnt auf seiner Zeit (1,0 s plus 5 ms Vorlauf der Datei, auf 6 ms)', Math.abs(onA - 1.005) <= 0.006, `${onA} s`)
    check('sfx.py: unter Wörtern um rund 10 dB abgesenkt, außerhalb unverändert', Math.abs((wA - wB) - 10) <= 1.5 && Math.abs(freeA - freeB) <= 0.3, `unter Wörtern ${(wA - wB).toFixed(2)} dB leiser, außerhalb ${(freeA - freeB).toFixed(2)} dB`)
    check('sfx.py: Bericht je Klang mit Überlappung der Wörter', info.sounds.length === 1 && Math.abs(info.sounds[0].overlapWords - 0.8) < 0.01 && info.sounds[0].duck === true, JSON.stringify(info.sounds[0]).slice(0, 160))
    const hd = readFileSync(b).subarray(20, 22).readUInt16LE(0)
    check('sfx.py: Spur mit Bibliotheksklängen als 32-bit-Float (nichts wird abgeschnitten), alte als 16 bit', hd === 3 && readFileSync(a).subarray(20, 22).readUInt16LE(0) === 3 && (await run('python3', [SFX, path.join(STUDIO_ROOT, 'tools', 'fixtures', 'final-cues.json'), path.join(tmp, 'f.wav')])).code === 0 && readFileSync(path.join(tmp, 'f.wav')).subarray(20, 22).readUInt16LE(0) === 1)
    // Abstand zur Stimme: eine gleichmaessige "Stimme" (Ton 220 Hz) ueber dem abgesenkten Klang
    const voice = path.join(tmp, 'v.wav')
    await run('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', 'sine=frequency=220:sample_rate=48000:duration=3', '-af', 'volume=0.3', voice])
    const r3 = await run('python3', [SFX, cues, path.join(tmp, 'm.wav'), '--speech', sp, '--duck', '-10', '--voice', voice, '--lead', '0', '--gains', '1.5,0.45'])
    const mi = r3.code === 0 ? JSON.parse(readFileSync(path.join(tmp, 'm.wav.lib.json'), 'utf8')).sounds[0].marginDb : null
    check('sfx.py: misst mit Stimme, wie weit sie über dem Klang liegt', mi && mi.windows >= 5 && mi.min > 0, JSON.stringify(mi) + (r3.code ? r3.err.slice(-200) : ''))
  }
}

// ---- 7. Server der Seite: aus sounds/ nur die Liste
{
  const st = await openStudio({ script: base, times: estimateTimes(normalize(base)) }), pg = await st.page()
  const codes = await pg.evaluate(async () => [(await fetch('/sounds/sounds.json')).status, (await fetch('/sounds/vine-boom.flac')).status, (await fetch('/sounds/original/vine-boom.mp3')).status])
  await st.close()
  check('Server: /sounds/sounds.json ja, Klangdateien nein', codes.join() === '200,403,403', codes.join())
}

rmSync(tmp, { recursive: true, force: true })
const bad = results.filter(x => !x).length
console.log(`\n${results.length - bad} von ${results.length} Prüfungen bestanden${bad ? `, ${bad} FEHLER` : ''}`)
process.exit(bad ? 1 : 0)
