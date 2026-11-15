// Automatische Pruefungen. Ergebnis landet in out/report.json; jeder harte
// Fehler laesst make.mjs mit Code 1 enden, bevor lange gerendert wird. Fehlt
// die Stimme im Cache, laufen dieselben Pruefungen vorher einmal mit
// geschaetzten Zeiten: erst ein sauberer Entwurf darf eine Aufnahme kosten.
//
// Gemessen wird in der Ruhelage der Seite (?rest=1, keine Animation): dort
// sitzt jedes Element an seinem Platz, ohne Einflug und Kamerafahrt. Das
// faengt die Fehler, die ein neues Skript wirklich macht - laengerer Text,
// mehr Zeilen, mehr Stempel - und bleibt unabhaengig vom Zeitpunkt.
// Einzige Ausnahme ist "knopfspalte": die braucht die Bewegung (motion), weil
// z. B. die Becherreihe erst zur Seite rueckt und dann ihre Becher zeigt.
import { STAGE } from './script.mjs'

export const LIMITS = {
  capWidth: STAGE.w - 2 * STAGE.capMargin, // 940 px
  capLines: STAGE.capMaxLines,
  safeTop: STAGE.safeTop, safeBottom: STAGE.h - STAGE.safeBottom, // 220 .. 1536
  secondsPerWord: 0.3,
  minDuration: 20, maxDuration: 60,
  wpmWarn: 190,
  capGap: 40,    // so viel Luft braucht eine Textzeile nach unten bis zum Bild
  apartGap: 12,  // so viel Luft zwischen Elementen, die sich nicht beruehren duerfen
  column: STAGE.column
}

// Gedankenstriche (Geviert und Halbgeviert) sind in Texten fuer Nutzer nicht erlaubt (Hausregel)
const DASHES = /[\u2012-\u2015]/

/**
 * @param state    window.STUDIO der Hauptseite (Szenen, Texte, Fehler, Warnungen)
 * @param measured STUDIO.measure() der Ruhelage-Seite
 * @param problems Seitenfehler (pageerror, Konsole, fehlgeschlagene Anfragen)
 * @param voice    { words, seconds, chars } oder null
 * @param motion   Ergebnis von sampleMotion() fuer die Knopfspalte, oder null (dann entfaellt die Pruefung)
 */
export function runChecks({ state, measured, problems, voice, motion = null }) {
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

  add('sperrzonen', `Wichtige Elemente (data-safe) bleiben zwischen ${LIMITS.safeTop} px und ${LIMITS.safeBottom} px (oben ${STAGE.safeTop}, unten ${STAGE.safeBottom} px gehören Instagram und TikTok)`,
    measured.safe.filter(s => s.top < LIMITS.safeTop || s.bottom > LIMITS.safeBottom)
      .map(s => `Szene ${s.scene}: "${s.what}" reicht von ${s.top} bis ${s.bottom} px`))

  add('einzeiler', 'Texte in Bausteinen bleiben in ihrer Zeilenzahl (meist eine Zeile)',
    measured.lines.filter(l => l.rows > (l.max || 1) || ((l.max || 1) === 1 && l.width > l.room + 1))
      .map(l => `Szene ${l.scene}: "${l.what}" passt nicht ("${l.text}", ${l.rows} Zeile(n), erlaubt ${l.max || 1}; ${l.width} px bei ${l.room} px Platz). Text kürzen.`))

  add('ueberlauf', 'Kein Inhalt läuft seitlich aus seinem Feld (data-fit)',
    (measured.fits || []).filter(f => f.width > f.room + 1)
      .map(f => `Szene ${f.scene}: "${f.what}" läuft ${f.width - f.room} px über ("${f.text}"). Text kürzen.`))

  const touch = [], ap = measured.apart || [], g = LIMITS.apartGap
  for (let i = 0; i < ap.length; i++) for (let j = i + 1; j < ap.length; j++) {
    const a = ap[i], b = ap[j]
    if (a.scene !== b.scene || a.group !== b.group) continue
    if (a.left < b.right + g && b.left < a.right + g && a.top < b.bottom + g && b.top < a.bottom + g) touch.push(`Szene ${a.scene}: "${a.what}" und "${b.what}" stoßen aneinander (weniger als ${g} px Abstand). Text kürzen.`)
  }
  add('ueberdeckung', 'Texte und Zeichen im Bild überdecken sich nicht (data-apart)', touch)

  const near = []
  for (const c of measured.caps) {
    const scene = +(/^s(\d+)/.exec(c.id) || [])[1], top = Math.min(...measured.safe.filter(s => s.scene === scene).map(s => s.top))
    if (c.box.bottom + LIMITS.capGap > top) near.push(`${c.id}: die Textzeile endet bei ${c.box.bottom} px, das Bild darunter beginnt bei ${top} px (nötig sind ${LIMITS.capGap} px Luft). Eine Zeile weniger.`)
  }
  add('textabstand', `Zwischen Textzeile und Bild bleiben mindestens ${LIMITS.capGap} px`, near)

  add('schreibweise', 'Keine Gedankenstriche im Bild (weder — noch –), normale Bindestriche',
    (state.texts || []).filter(t => DASHES.test(t.text)).map(t => `${t.where}: "${t.text}" enthält einen Gedankenstrich. Durch Komma, Punkt oder normalen Bindestrich ersetzen.`))

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
  if (motion) {
    const col = LIMITS.column, sec = t => t.toFixed(1).replace('.', ',')
    add('knopfspalte', `Nichts Wichtiges in der rechten Knopfspalte von TikTok (x über ${col.left} px zwischen y ${col.top} und ${col.bottom})`,
      motion.filter(m => m.right > col.left).map(m => `Szene ${m.scene}: "${m.what}" reicht von ${sec(m.from)} bis ${sec(m.to)} s bis x = ${m.right} px (y ${m.top} bis ${m.bottom}). Auf TikTok liegen dort die Knöpfe darüber.`), 'warn')
  }
  add('hinweise', 'Hinweise der Bausteine (z. B. Anker, die nicht zum Text passen)', state.warnings || [], 'warn')

  const errors = checks.filter(c => c.level === 'error').flatMap(c => c.details.map(x => `[${c.name}] ${x}`))
  const warnings = checks.filter(c => c.level === 'warn').flatMap(c => c.details.map(x => `[${c.name}] ${x}`))
  return { ok: errors.length === 0, checks, errors, warnings, wpm }
}
