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
  wordMin: 44, keyMin: 72, // Modus "wort": kleiner wird ein Wort beim Einpassen nicht, ohne dass der Bau abbricht
  chunkSeconds: 0.14,      // Modus "wort": so lange steht eine Tafel mindestens (vier Bilder), sonst Warnung
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
 * @param sounds   nur bei Klaengen aus der Bibliothek: { speech: [[anfang, ende]], length: { name: s }, maxOverlap }
 */
export function runChecks({ state, measured, problems, voice, motion = null, sounds = null }) {
  const checks = []
  const add = (name, what, fails, level = 'error') => checks.push({ name, what, ok: fails.length === 0, level: fails.length ? level : 'ok', details: fails })

  add('seite', 'Die Seite baut ohne Fehler', [...new Set([...problems, ...(state.errors || [])])])

  const wide = [], many = []
  for (const c of measured.caps) {
    for (const r of c.rows) if (r.width > LIMITS.capWidth || r.wrapped) wide.push(`${c.id}: "${r.text}" ist ${r.width} px breit (erlaubt ${LIMITS.capWidth}). Zeile im Skript früher umbrechen.`)
    // Im Modus "wort" zaehlt die hoechste Tafel (c.lines), nicht die Summe aller Tafeln
    const n = c.lines ?? c.rows.length
    if (n > LIMITS.capLines) many.push(`${c.id}: ${n} Zeilen (erlaubt ${LIMITS.capLines}). Satz kürzen oder in zwei Textzeilen teilen.`)
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
    if (a.scene !== b.scene || (a.part || 0) !== (b.part || 0) || a.group !== b.group) continue
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
    // Im Modus "wort" steht nie ein ganzer Satz da: dort zaehlt die einzelne Tafel (Pruefung "tafelzeit")
    if (c.mode === 'wort') continue
    if (per < LIMITS.secondsPerWord) short.push(`${c.id}: "${c.text}" steht nur ${visible.toFixed(2)} s für ${c.words} Wörter (${per.toFixed(2)} s je Wort, nötig ${LIMITS.secondsPerWord}). Satz kürzen oder teilen.`)
  }
  add('lesezeit', `Jeder Text ist mindestens ${LIMITS.secondsPerWord} s je Wort zu sehen`, short)

  // ---- nur im Modus "wort" (Skripte ohne ihn bekommen diese Pruefungen gar nicht erst)
  const wort = (state.caps || []).filter(c => c.mode === 'wort')
  if (wort.length) {
    // Eine Tafel, die zum Passen stark verkleinert werden musste, ist auf dem Handy nicht mehr zu lesen
    add('wortgroesse', `Wörter im Modus "wort" bleiben lesbar (normale mindestens ${LIMITS.wordMin} px, Schlüsselwörter mindestens ${LIMITS.keyMin} px, Breite höchstens ${LIMITS.capWidth} px)`,
      (state.capFit || []).filter(f => f.width > LIMITS.capWidth || (f.word != null && f.word < LIMITS.wordMin) || (f.keyWord != null && f.keyWord < LIMITS.keyMin))
        .map(f => `${f.id}: "${f.text}" steht nur noch in ${[f.word, f.keyWord].filter(x => x != null).join(' / ')} px (${f.width} px breit). Tafel im Skript mit | teilen oder das Wort kürzen.`))
    const flash = []
    for (const c of wort) for (const ch of c.chunks) if (ch.seconds < LIMITS.chunkSeconds) flash.push(`${c.id}: "${ch.text}" steht nur ${ch.seconds.toFixed(2)} s. Mit dem Nachbarwort zu einer Tafel verbinden (im Skript ohne | dazwischen).`)
    add('tafelzeit', `Jede Tafel im Modus "wort" steht mindestens ${LIMITS.chunkSeconds} s`, flash, 'warn')
  }
  // ---- nur mit "pace" im Skript: Richtwerte fuer den Bildwechsel
  if (state.pace) {
    const end = state.duration - (state.hold || 0), ts = [0, ...(state.pictures || []).map(x => x.t).filter(t => t < end), end], slow = []
    for (let i = 1; i < ts.length; i++) if (state.pace.maxStill != null && ts[i] - ts[i - 1] > state.pace.maxStill + 0.005) slow.push(`Von ${ts[i - 1].toFixed(1)} bis ${ts[i].toFixed(1)} s steht dasselbe Bild ${(ts[i] - ts[i - 1]).toFixed(1)} s lang (Richtwert höchstens ${state.pace.maxStill} s). Einen Teil, einen Schnitt oder eine Kamerabewegung ergänzen.`)
    const count = (state.pictures || []).length
    if (state.pace.minChanges != null && count < state.pace.minChanges) slow.push(`Nur ${count} Bildwechsel (Richtwert mindestens ${state.pace.minChanges}).`)
    add('bildwechsel', 'Bildwechsel nach den Richtwerten aus "pace" (Szenen, Teile, Kamera; ohne das stehende Schlussbild)', slow, 'warn')
  }

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
  // ---- nur mit Klaengen aus der Bibliothek ("sounds" im Skript): kein Klang soll ein Wort zudecken.
  // Abgesenkte Klaenge ("duck", die Vorgabe) duerfen ueber Woertern liegen, sie sind dort leiser; wie
  // weit die Stimme darueber liegt, misst der Bau mit Stimme (Bericht: soundLib, Pruefung "effekt-abstand").
  // Ein Klang ohne Absenkung darf nur kurz in ein Wort reichen.
  const libCues = (state.cues || []).filter(c => c.lib)
  if (sounds && libCues.length) {
    const sec = t => t.toFixed(2).replace('.', ','), loud = []
    for (const c of libCues) {
      const len = sounds.length[c.name] ?? 0, end = c.t + len
      c.seconds = +len.toFixed(3)
      c.overlapWords = +sounds.speech.reduce((n, [s, e]) => n + Math.max(0, Math.min(end, e) - Math.max(c.t, s)), 0).toFixed(3)
      if (!c.duck && c.overlapWords > sounds.maxOverlap) loud.push(`"${c.name}" bei ${sec(c.t)} s (Szene ${c.scene}) liegt ${sec(c.overlapWords)} s über gesprochenen Wörtern, ohne Absenkung ("duck": false). In eine Pause legen, kürzer wählen oder "duck" weglassen.`)
    }
    add('effekte', `Klänge aus der Bibliothek ohne Absenkung liegen höchstens ${sounds.maxOverlap} s über Wörtern`, loud, 'warn')
  }
  add('hinweise', 'Hinweise der Bausteine (z. B. Anker, die nicht zum Text passen)', state.warnings || [], 'warn')

  const errors = checks.filter(c => c.level === 'error').flatMap(c => c.details.map(x => `[${c.name}] ${x}`))
  const warnings = checks.filter(c => c.level === 'warn').flatMap(c => c.details.map(x => `[${c.name}] ${x}`))
  return { ok: errors.length === 0, checks, errors, warnings, wpm }
}
