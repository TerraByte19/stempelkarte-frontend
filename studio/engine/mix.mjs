// Die Tonmischung an EINER Stelle: make.mjs baut damit das Video,
// tools/regress.mjs baut damit denselben Ton zum Vergleich mit den
// veroeffentlichten Videos. Stuende der Filter zweimal da, wuerde der
// Vergleich nur noch sich selbst pruefen.
import { run } from './render.mjs'

export const AUDIO = { codec: 'aac', bitrate: '192k' }

/**
 * ffmpeg-Filter fuer die Mischung. voiceIn/sfxIn sind die Nummern der
 * Eingaben (voiceIn = null: Entwurf ohne Stimme). Ausgang heisst [a].
 *
 * Stimme um den Vorlauf verzoegert und angehoben, Effekte deutlich darunter,
 * dann ein Begrenzer. Achtung Falle: alimiter hebt nach dem Begrenzen von
 * sich aus wieder auf 0 dBFS an ("level", Vorgabe an). "limit=0.89" allein
 * ergibt also KEINE Reserve: gemessen -0,2 dB Spitze, genau wie mit 0,95. Erst mit level=disabled
 * bleibt die Spitze bei rund -1 dBFS. Die ersten beiden Videos sind mit
 * limit 0,95 und Anhebung gemischt; ihre Skripte setzen "mix" ausdruecklich.
 */
export function mixFilter({ voiceIn, sfxIn, lead, len, mix }) {
  const limiter = `alimiter=limit=${mix.limit}${mix.level ? '' : ':level=disabled'}`
  const end = `${limiter},apad,atrim=0:${len},aformat=sample_rates=44100:channel_layouts=mono[a]`
  return voiceIn != null
    ? `[${voiceIn}:a]adelay=${Math.round(lead * 1000)}:all=1,volume=${mix.voice}[v];[${sfxIn}:a]volume=${mix.sfx}[s];[v][s]amix=inputs=2:normalize=0:duration=longest,${end}`
    : `[${sfxIn}:a]volume=${mix.sfx},${end}`
}

/** Spitze und Mittel des Tons einer Datei in dBFS (ffmpeg volumedetect). */
export async function loudness(file) {
  const r = await run('ffmpeg', ['-hide_banner', '-nostats', '-i', file, '-vn', '-af', 'volumedetect', '-f', 'null', '-'])
  const pick = k => { const m = new RegExp(k + ': (-?[\\d.]+) dB').exec(r.err); return m ? +m[1] : null }
  return { peakDb: pick('max_volume'), meanDb: pick('mean_volume') }
}

/**
 * Pausen in der Aufnahme: Stellen, an denen mindestens 0,5 s lang nichts zu
 * hoeren ist (unter -40 dB), ohne Anfang und Ende. Beim ersten Video waren das
 * fast 9 Sekunden; ein Vorbild-Reel kam mit gut 2 Sekunden aus. Die Zahl steht
 * im Bericht, damit ein neues Skript sich daran messen kann.
 */
export async function pauses(file) {
  const r = await run('ffmpeg', ['-hide_banner', '-nostats', '-i', file, '-vn', '-af', 'silencedetect=noise=-40dB:d=0.5', '-f', 'null', '-'])
  const starts = [...r.err.matchAll(/silence_start: (-?[\d.]+)/g)].map(m => +m[1])
  const ends = [...r.err.matchAll(/silence_end: ([\d.]+) \| silence_duration: ([\d.]+)/g)].map(m => ({ end: +m[1], d: +m[2] }))
  // Eine Stille, die bis zum Dateiende reicht, hat keinen silence_end und zaehlt damit von selbst nicht mit
  const inner = ends.filter((e, i) => starts[i] > 0.05)
  return { count: inner.length, seconds: +inner.reduce((s, e) => s + e.d, 0).toFixed(2), longest: +Math.max(0, ...inner.map(e => e.d)).toFixed(2) }
}

/** Jede stille Stelle ab `d` Sekunden (unter `noise` dB) mit Anfang und Laenge, auch am Anfang und Ende der Datei. */
export async function silences(file, d = 0.5, noise = -40) {
  const r = await run('ffmpeg', ['-hide_banner', '-nostats', '-i', file, '-vn', '-af', `silencedetect=noise=${noise}dB:d=${d}`, '-f', 'null', '-'])
  const starts = [...r.err.matchAll(/silence_start: (-?[\d.]+)/g)].map(m => Math.max(0, +m[1]))
  const ends = [...r.err.matchAll(/silence_end: ([\d.]+) \| silence_duration: ([\d.]+)/g)].map(m => +m[2])
  return starts.map((s, i) => ({ at: +s.toFixed(3), seconds: ends[i] == null ? null : +ends[i].toFixed(3) }))
}

/** Lautheit nach EBU R128 (ffmpeg ebur128): integriert in LUFS, wahre Spitze in dBTP, Lautheitsbereich in LU. */
export async function ebur128(file) {
  const r = await run('ffmpeg', ['-hide_banner', '-nostats', '-i', file, '-vn', '-af', 'ebur128=peak=true', '-f', 'null', '-'])
  // Nur die Zusammenfassung am Ende lesen: davor steht dieselbe Angabe fuer jede Zehntelsekunde
  const sum = r.err.slice(r.err.lastIndexOf('Summary:'))
  const pick = re => { const m = re.exec(sum); return m ? +m[1] : null }
  return { lufs: pick(/I:\s+(-?[\d.]+) LUFS/), truePeak: pick(/Peak:\s+(-?[\d.]+) dBFS/), range: pick(/LRA:\s+(-?[\d.]+) LU/) }
}

/**
 * Mischung mit Ziel-Lautheit ("mix.lufs", z. B. -14) und Obergrenze fuer die wahre
 * Spitze ("mix.truePeak", z. B. -1 dBTP). Schreibt den fertigen Ton als AAC nach `out`
 * und gibt zurueck, was am Ergebnis GEMESSEN wurde.
 *
 * Warum nicht einfach lauter drehen: die Stimme hat Spitzen, die 15 dB ueber ihrem
 * Mittel liegen. Wer nur anhebt, stoesst mit den Spitzen an die Decke, lange bevor der
 * Satz laut ist. Deshalb in drei Schritten: ein sanfter Kompressor nimmt die Spitzen
 * etwas zurueck, dann wird angehoben, dann haelt ein Begrenzer die Decke. Der Begrenzer
 * arbeitet bei vierfacher Abtastrate, weil die wahre Spitze ZWISCHEN den Abtastwerten
 * liegen kann, und die Decke haelt Abstand, weil AAC beim Kodieren noch einmal
 * ueberschwingt. Wie viel Anhebung und wie viel Abstand es braucht, haengt von der
 * Aufnahme ab - also wird gemessen und nachgestellt, bis das kodierte Ergebnis stimmt.
 *
 * Die Mischung davor (Stimme mal mix.voice, Effekte mal mix.sfx) ist dieselbe wie
 * immer: das Verhaeltnis von Stimme zu Effekten bleibt, wie der Nutzer es kennt.
 */
export async function loudMix({ voiceFile, sfxFile, lead, len, mix, out, work, log = () => {} }) {
  const pre = `${work}/premix.wav`, db = x => Math.round(x * 100) / 100
  const a = await run('ffmpeg', ['-v', 'error', '-y', '-i', voiceFile, '-i', sfxFile, '-filter_complex',
    `[0:a]adelay=${Math.round(lead * 1000)}:all=1,volume=${mix.voice}[v];[1:a]volume=${mix.sfx}[s];[v][s]amix=inputs=2:normalize=0:duration=longest,apad,atrim=0:${len},aformat=sample_fmts=flt:sample_rates=48000:channel_layouts=mono[a]`,
    '-map', '[a]', '-c:a', 'pcm_f32le', pre])
  if (a.code !== 0) throw new Error('ffmpeg (Vormischung): ' + a.err)
  const before = await ebur128(pre)
  if (before.lufs == null) throw new Error('Lautheit der Vormischung lässt sich nicht messen')
  // Kompressor: setzt 5 dB ueber dem Mittel der Vormischung an und nimmt, was darueber liegt, im Verhaeltnis 2,5:1 zurueck
  const threshold = db(before.lufs + 5)
  // Decke 0,3 dB unter der erlaubten Spitze: so viel schwingt AAC beim Kodieren etwa ueber. Reicht das nicht, wird nachgestellt.
  let gain = db(mix.lufs - before.lufs), ceiling = db(mix.truePeak - 0.3), got = null
  const steps = []
  for (let i = 0; i < 10; i++) {
    const chain = `acompressor=threshold=${threshold}dB:ratio=2.5:attack=8:release=150:knee=4:makeup=1,volume=${gain}dB,aresample=192000,alimiter=limit=${(10 ** (ceiling / 20)).toFixed(5)}:level=disabled:attack=4:release=60,aresample=44100,aformat=sample_rates=44100:channel_layouts=mono`
    const e = await run('ffmpeg', ['-v', 'error', '-y', '-i', pre, '-af', chain, '-c:a', AUDIO.codec, '-b:a', AUDIO.bitrate, out])
    if (e.code !== 0) throw new Error('ffmpeg (laute Mischung): ' + e.err)
    got = await ebur128(out)
    steps.push({ gainDb: gain, ceilingDb: ceiling, lufs: got.lufs, truePeak: got.truePeak })
    log(`  Lautheit, Durchgang ${i + 1}: Anhebung ${gain} dB, Decke ${ceiling} dB -> ${got.lufs} LUFS, wahre Spitze ${got.truePeak} dBTP`)
    const okLoud = Math.abs(got.lufs - mix.lufs) <= 0.1, okPeak = got.truePeak <= mix.truePeak
    if (okLoud && okPeak) break
    if (!okPeak) ceiling = db(ceiling - (got.truePeak - mix.truePeak) - 0.05)
    // etwas mehr als der fehlende Rest: ein Teil jeder Anhebung bleibt im Begrenzer haengen
    if (!okLoud) gain = db(gain + (mix.lufs - got.lufs) * 1.25)
  }
  const ok = Math.abs(got.lufs - mix.lufs) <= 0.5 && got.truePeak <= mix.truePeak + 0.05
  // gain und ceiling koennen nach dem letzten Durchgang schon weitergestellt sein: gemeldet wird, womit die Datei entstand
  const used = steps[steps.length - 1]
  return { ...got, ok, target: { lufs: mix.lufs, truePeak: mix.truePeak }, before: { lufs: before.lufs, truePeak: before.truePeak }, gainDb: used.gainDb, ceilingDb: used.ceilingDb, compressor: { thresholdDb: threshold, ratio: 2.5 }, passes: steps.length, steps }
}
