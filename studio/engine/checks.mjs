// Automatische Pruefungen. Ergebnis landet in out/report.json; jeder harte
// Fehler laesst make.mjs mit Code 1 enden, BEVOR lange gerendert oder gar
// eine Stimme bezahlt wird.
//
// Gemessen wird in der Ruhelage der Seite (?rest=1, keine Animation): dort
// sitzt jedes Element an seinem Platz, ohne Einflug und Kamerafahrt. Das
// faengt die Fehler, die ein neues Skript wirklich macht - laengerer Text,
// mehr Zeilen, mehr Stempel - und bleibt unabhaengig vom Zeitpunkt.
import { STAGE } from './script.mjs'

export const LIMITS = {
  capWidth: STAGE.w - 2 * STAGE.capMargin, // 940 px
  capLines: STAGE.capMaxLines,
  safeTop: STAGE.safeTop, safeBottom: STAGE.h - STAGE.safeBottom, // 220 .. 1536
  secondsPerWord: 0.3,
  minDuration: 20, maxDuration: 60,
  wpmWarn: 190
}

/**
 * @param state    window.STUDIO der Hauptseite (Szenen, Texte, Fehler, Warnungen)
 * @param measured STUDIO.measure() der Ruhelage-Seite
 * @param problems Seitenfehler (pageerror, Konsole, fehlgeschlagene Anfragen)
 * @param voice    { words, seconds, chars } oder null
 */
export function runChecks({ state, measured, problems, voice }) {
  const checks = []
  const add = (name, what, fails, level = 'error') => checks.push({ name, what, ok: fails.length === 0, level: fails.length ? level : 'ok', details: fails })

  add('seite', 'Die Seite baut ohne Fehler', [...new Set([...problems, ...(state.errors || [])])])

  const wide = [], many = []
  for (const c of measured.caps) {
    for (const r of c.rows) if (r.width > LIMITS.capWidth || r.wrapped) wide.push(`${c.id}: "${r.text}" ist ${r.width} px breit (erlaubt ${LIMITS.capWidth}). Zeile im Skript früher umbrechen.`)
    if (c.rows.length > LIMITS.capLines) many.push(`${c.id}: ${c.rows.length} Zeilen (erlaubt ${LIMITS.capLines}). Satz kürzen oder in zwei Textzeilen teilen.`)
  }
  add('textbreite', `Keine Textzeile breiter als ${LIMITS.capWidth} px (Bühne minus 70 px Rand je Seite)`, wide)
  add('textzeilen', `Höchstens ${LIMITS.capLines} Zeilen je Text`, many)

  add('sperrzonen', `Wichtige Elemente (data-safe) bleiben zwischen ${LIMITS.safeTop} px und ${LIMITS.safeBottom} px (oben ${STAGE.safeTop}, unten ${STAGE.safeBottom} px gehören Instagram)`,
    measured.safe.filter(s => s.top < LIMITS.safeTop || s.bottom > LIMITS.safeBottom)
      .map(s => `Szene ${s.scene}: "${s.what}" reicht von ${s.top} bis ${s.bottom} px`))

  add('einzeiler', 'Texte in Bausteinen passen in ihre eine Zeile (data-oneline)',
    measured.lines.filter(l => l.rows > 1 || l.width > l.room + 1)
      .map(l => `Szene ${l.scene}: "${l.what}" passt nicht ("${l.text}", ${l.width} px bei ${l.room} px Platz, ${l.rows} Zeile(n)). Text kürzen.`))

  const short = []
  for (const c of state.caps || []) {
    const visible = ((c.keep || c.role) ? state.duration : c.end) - c.start, per = visible / c.words
    c.visible = +visible.toFixed(3); c.secondsPerWord = +per.toFixed(3)
    if (per < LIMITS.secondsPerWord) short.push(`${c.id}: "${c.text}" steht nur ${visible.toFixed(2)} s für ${c.words} Wörter (${per.toFixed(2)} s je Wort, nötig ${LIMITS.secondsPerWord}). Satz kürzen oder teilen.`)
  }
  add('lesezeit', `Jeder Text ist mindestens ${LIMITS.secondsPerWord} s je Wort zu sehen`, short)

  const d = state.duration
  add('laenge', `Gesamtlänge zwischen ${LIMITS.minDuration} und ${LIMITS.maxDuration} s`,
    d >= LIMITS.minDuration && d <= LIMITS.maxDuration ? [] : [`Das Video ist ${d} s lang`])

  let wpm = null
  if (voice && voice.seconds > 0) {
    wpm = +(voice.words / voice.seconds * 60).toFixed(1)
    add('sprechtempo', `Stimme höchstens ${LIMITS.wpmWarn} Wörter pro Minute`, wpm > LIMITS.wpmWarn ? [`${wpm} Wörter pro Minute, das ist schwer mitzulesen`] : [], 'warn')
  }
  add('hinweise', 'Hinweise der Bausteine (z. B. Anker, die nicht zum Text passen)', state.warnings || [], 'warn')

  const errors = checks.filter(c => c.level === 'error').flatMap(c => c.details.map(x => `[${c.name}] ${x}`))
  const warnings = checks.filter(c => c.level === 'warn').flatMap(c => c.details.map(x => `[${c.name}] ${x}`))
  return { ok: errors.length === 0, checks, errors, warnings, wpm }
}
