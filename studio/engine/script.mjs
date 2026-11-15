// Reine Rechenlogik rund um script.json. Laeuft unveraendert in Node (make.mjs,
// Werkzeuge) UND im Browser (engine.js) - deshalb hier kein DOM, kein fs.
// Grund fuer die gemeinsame Datei: im ersten Video gab es den Zeitplan
// zweimal (timeline.js fuer das Bild, events.mjs fuer den Ton), und beide
// mussten von Hand gleich gehalten werden. Jetzt gibt es genau eine Quelle.

export const STAGE = { w: 1080, h: 1920, safeTop: 220, safeBottom: 384, capMargin: 70, capMaxLines: 3 }

// Zeitkonstanten des Referenzvideos. Wer sie aendert, aendert jedes Video.
export const TIMING = {
  lead: 0.35,      // die Stimme setzt kurz nach dem ersten Bild ein
  hold: 3.2,       // Schlussbild bleibt stehen
  sceneLead: 0.3,  // eine Szene beginnt so viel vor ihrem ersten Wort
  capGap: 0.12,    // eine Textzeile verschwindet so viel vor der naechsten
  step: 0.36,      // geschaetzte Sekunden pro Wort, solange es keine Stimme gibt
  capPause: 0.5,   // geschaetzte Pause zwischen zwei Textzeilen (nur Entwurf)
  scenePause: 0.35 // zusaetzliche Pause vor einer neuen Szene (nur Entwurf)
}

// Die Marke wird "Stampit" geschrieben, aber "Stamp It" gesprochen. Ohne
// diese Vorgabe liest die Stimme "Stampit" wie ein deutsches Wort.
export const SAY_DEFAULT = { Stampit: 'StampIt' }

const PUNCT = /[.,!?:;]+$/

function fail(msg) { const e = new Error(msg); e.script = true; throw e }

// Ein Wort im Skript: "Kaffee" | "6.500{sechstausendfünfhundert}" | { show, say }
function parseWord(raw, sayMap, where) {
  let show, say
  if (raw && typeof raw === 'object') { show = raw.show; say = raw.say }
  else {
    const m = /^(.+?)\{(.+)\}$/.exec(String(raw))
    if (m) { show = m[1]; say = m[2] } else show = String(raw)
  }
  if (!show || /\s/.test(show)) fail(`${where}: "${show}" ist kein einzelnes Wort`)
  // "28{acht und zwanzig}" wird an den Leerzeichen zerteilt und kaeme als "28{acht" aufs Bild.
  if (/[{}]/.test(show) || (say != null && /[{}]/.test(say))) fail(`${where}: geschweifte Klammer in "${show}". Die gesprochene Form muss ein einziges Wort sein und direkt am Wort stehen: 28{achtundzwanzig}`)
  if (say == null) {
    const tail = (PUNCT.exec(show) || [''])[0], core = tail ? show.slice(0, -tail.length) : show
    say = Object.prototype.hasOwnProperty.call(sayMap, core) ? sayMap[core] + tail : show
  }
  // Ein gezeigtes Wort = ein gesprochenes Wort. Sonst passen die Wort-Zeiten
  // der Aufnahme nicht mehr zu den Woertern auf dem Bild.
  if (!say || /\s/.test(say)) fail(`${where}: gesprochene Form "${say}" von "${show}" muss genau ein Wort sein (ohne Leerzeichen)`)
  return { show, say }
}

function parseCaption(c, sayMap, where) {
  if (!c || !Array.isArray(c.lines) || !c.lines.length) fail(`${where}: braucht "lines" (Liste von Zeilen)`)
  const lines = c.lines.map((line, li) => {
    const raw = Array.isArray(line) ? line : String(line).trim().split(/\s+/)
    if (!raw.length || raw[0] === '') fail(`${where}: Zeile ${li + 1} ist leer`)
    return raw.map(x => parseWord(x, sayMap, `${where}, Zeile ${li + 1}`))
  })
  const words = lines.flat()
  const accent = c.accent == null ? words.length : Number(c.accent)
  if (!Number.isInteger(accent) || accent < 0) fail(`${where}: "accent" muss ein Wort-Index >= 0 sein`)
  return { lines, words: words.map(x => x.show), say: words.map(x => x.say), accent, keep: !!c.keep, role: c.role || null }
}

/** Macht aus script.json die flache Form, mit der alle rechnen. Wirft bei Fehlern. */
export function normalize(script) {
  if (!script || typeof script !== 'object') fail('script.json ist leer')
  const meta = script.meta || {}
  if (!meta.title || !meta.slug) fail('meta.title und meta.slug fehlen')
  if (!Array.isArray(script.scenes) || !script.scenes.length) fail('scenes fehlt oder ist leer')
  const sayMap = { ...SAY_DEFAULT, ...(script.say || {}) }
  const t = script.timing || {}
  const timing = { ...TIMING, ...(t.lead != null ? { lead: +t.lead } : {}), ...(t.hold != null ? { hold: +t.hold } : {}) }
  const caps = [], scenes = []
  script.scenes.forEach((sc, si) => {
    const rawParts = Array.isArray(sc.parts) ? sc.parts : [sc]
    if (!rawParts.length) fail(`Szene ${si + 1}: "parts" ist leer`)
    const parts = rawParts.map((p, pi) => {
      const where = `Szene ${si + 1}${rawParts.length > 1 ? `, Teil ${pi + 1}` : ''}`
      if (!p.component || !/^[a-z0-9-]+$/.test(p.component)) fail(`${where}: "component" fehlt oder hat unerlaubte Zeichen`)
      if (!Array.isArray(p.captions) || !p.captions.length) fail(`${where}: braucht mindestens eine Textzeile in "captions" (die Zeit hängt an den Wörtern)`)
      const idx = p.captions.map((c, ci) => {
        const cap = parseCaption(c, sayMap, `${where}, Text ${ci + 1}`)
        cap.scene = si; cap.part = pi; cap.k = ci; cap.id = `s${si + 1}${rawParts.length > 1 ? 'abcdefgh'[pi] : ''}.${ci + 1}`
        caps.push(cap); return caps.length - 1
      })
      return { component: p.component, params: p.params || {}, anchors: p.anchors || {}, caps: idx }
    })
    scenes.push({ parts })
  })
  const spoken = caps.flatMap(c => c.say).join(' ')
  return {
    meta: { language: 'de', ...meta }, voice: script.voice || {}, timing, poster: script.poster ?? null,
    scenes, caps, spoken, words: caps.reduce((n, c) => n + c.words.length, 0)
  }
}

/** Wort-Zeiten ohne Stimme: 0,36 s pro Wort, damit ein Entwurf nichts kostet. */
export function estimateTimes(norm) {
  const T = norm.timing; let t = T.lead
  return norm.caps.map((c, i) => {
    if (i > 0) t += T.capPause + (norm.caps[i - 1].scene !== c.scene ? T.scenePause : 0)
    const row = c.words.map((_, k) => +(t + k * T.step).toFixed(3))
    t = row[row.length - 1] + T.step
    return row
  })
}

/** Zerlegt die Zeichen-Zeiten der Aufnahme in Woerter (Trennung an Leerraum). */
export function alignmentWords(al) {
  const words = []; let cur = null
  al.characters.forEach((ch, i) => {
    if (/\s/.test(ch)) { cur = null; return }
    if (!cur) { cur = { w: '', s: al.character_start_times_seconds[i] }; words.push(cur) }
    cur.w += ch; cur.e = al.character_end_times_seconds[i]
  })
  return words
}

/** Wort-Zeiten aus der echten Aufnahme. Prueft Wort fuer Wort, dass Text und Aufnahme zusammenpassen. */
export function timesFromAlignment(norm, al) {
  const words = alignmentWords(al), lead = norm.timing.lead
  if (words.length !== norm.words) fail(`Wortzahl passt nicht: Skript ${norm.words}, Aufnahme ${words.length}`)
  let k = 0
  const times = norm.caps.map(c => c.say.map(say => {
    const x = words[k++]
    if (x.w !== say) fail(`Aufnahme und Skript laufen auseinander bei Wort ${k}: Skript "${say}", Aufnahme "${x.w}" (${c.id})`)
    return +(x.s + lead).toFixed(3)
  }))
  return { times, voiceEnd: +(words[words.length - 1].e + lead).toFixed(3), voiceLength: words[words.length - 1].e }
}

/** Der Zeitplan: wann jede Textzeile, jeder Teil und jede Szene beginnt und endet. */
export function timeline(norm, times) {
  const T = norm.timing
  const caps = norm.caps.map((c, i) => {
    const t = times[i]
    if (!Array.isArray(t) || t.length !== c.words.length) fail(`Zeiten für ${c.id} fehlen oder haben die falsche Länge`)
    return { ...c, t, last: t[t.length - 1] }
  })
  caps.forEach((c, i) => { c.e = i + 1 < caps.length ? caps[i + 1].t[0] - T.capGap : c.last + T.hold })
  const scenes = norm.scenes.map((sc, n) => ({
    index: n,
    s: n === 0 ? 0 : caps[sc.parts[0].caps[0]].t[0] - T.sceneLead,
    parts: sc.parts.map((p, j) => ({ ...p, s: j === 0 ? null : caps[p.caps[0]].t[0] - T.sceneLead }))
  }))
  scenes.forEach((sc, n) => {
    sc.e = n + 1 < scenes.length ? scenes[n + 1].s : caps[caps.length - 1].e
    sc.parts.forEach((p, j) => { if (j === 0) p.s = sc.s; p.e = j + 1 < sc.parts.length ? sc.parts[j + 1].s : sc.e })
  })
  return { caps, scenes, duration: +scenes[scenes.length - 1].e.toFixed(3) }
}

/** Was eine neue Aufnahme bei ElevenLabs kosten wuerde (1 Zeichen = 1 Credit). */
export function voiceCost(norm) { return norm.spoken.length }
