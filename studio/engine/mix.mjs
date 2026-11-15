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
