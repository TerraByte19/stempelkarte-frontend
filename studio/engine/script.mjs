// Reine Rechenlogik rund um script.json. Laeuft unveraendert in Node (make.mjs,
// Werkzeuge) UND im Browser (engine.js) - deshalb hier kein DOM, kein fs.
// Grund fuer die gemeinsame Datei: im ersten Video gab es den Zeitplan
// zweimal (timeline.js fuer das Bild, events.mjs fuer den Ton), und beide
// mussten von Hand gleich gehalten werden. Jetzt gibt es genau eine Quelle.

export const STAGE = {
  w: 1080, h: 1920, safeTop: 220, safeBottom: 384, capMargin: 70, capMaxLines: 3,
  // Rechte Knopfspalte von TikTok (Herz, Kommentar, Teilen): das Video laeuft auf
  // Instagram UND TikTok, dort liegt ab x = 950 zwischen y = 900 und 1540 die Bedienung darueber.
  column: { left: 950, top: 900, bottom: 1540 }
}

// Zeitkonstanten des Referenzvideos. Wer sie aendert, aendert jedes Video.
export const TIMING = {
  lead: 0.35,      // die Stimme setzt kurz nach dem ersten Bild ein
  hold: 3.2,       // Schlussbild bleibt stehen
  sceneLead: 0.3,  // eine Szene beginnt so viel vor ihrem ersten Wort
  capGap: 0.12,    // eine Textzeile verschwindet so viel vor der naechsten
  step: 0.36,      // geschaetzte Sekunden pro Wort, solange es keine Stimme gibt
  capPause: 0.5,   // geschaetzte Pause zwischen zwei Textzeilen (nur Entwurf)
  scenePause: 0.35, // zusaetzliche Pause vor einer neuen Szene (nur Entwurf)
  // Ein Teil mit "enter": "cut" erscheint so viel vor seinem ersten Wort. Ein harter
  // Schnitt sitzt knapp vor dem Wort; die 0,3 s einer Ueberblendung waeren hier ein
  // Bild, das stumm dasteht.
  cutLead: 0.1,
  // "timing.maxGap": laengste stille Luecke der Stimme in Sekunden. Laengere werden
  // beim Bau gekuerzt (tools/tighten.py). null = die Aufnahme bleibt, wie sie ist.
  maxGap: null
}

// Lautstaerke des Wisch-Tons beim Szenenwechsel. 0,35 ist die Haelfte des ersten
// Entwurfs: dem Nutzer waren die Wischer zu laut. 0 schaltet ihn ab.
export const SOUND = { sceneWhoosh: 0.35 }

// Klaenge aus der Bibliothek (studio/sounds/, Skript: "sounds" an einer Szene oder einem Teil).
// Nur wirksam, wenn ein Skript sie benutzt; deshalb stehen die Vorgaben NICHT in SOUND, sonst
// stuenden sie im Bericht jedes alten Videos. Im Skript unter "sound" einstellbar:
//   duck        so weit (dB) werden Bibliotheksklaenge abgesenkt, solange gesprochen wird
//   maxOverlap  ein Klang ohne Absenkung ("duck": false), der laenger als so viele Sekunden
//               ueber Woertern liegt, ergibt eine Warnung (Pruefung "effekte")
//   minMargin   die Stimme soll mindestens so viele dB ueber jedem Klang liegen, wo beide zu
//               hoeren sind (gemessen beim Bau mit Stimme; darunter Warnung)
export const LIBSOUND = { duck: -10, maxOverlap: 0.3, minMargin: 8 }

// Mischung: Stimme vorn, Effekte deutlich darunter. limit ist die Obergrenze des
// Begrenzers (0,89 = rund -1 dBFS). level: true laesst ffmpeg danach wieder auf
// 0 dBFS anheben - so waren die ersten Videos gemischt (limit 0,95), ihre
// Skripte setzen das ausdruecklich, damit der Vergleich mit ihnen genau bleibt.
export const MIX = { voice: 1.5, sfx: 0.45, limit: 0.89, level: false, lufs: null, truePeak: -1 }
// lufs: Ziel-Lautheit der fertigen Mischung (z. B. -14, so laut sind die Reels der
// Vorbilder). null = die feste Mischung oben, wie bei den ersten Videos. truePeak ist
// die Obergrenze der wahren Spitze in dBTP und gilt nur zusammen mit lufs.

// Textzeilen im Modus "wort": oben steht immer nur EIN Wort (zwei, wenn beide sehr
// kurz sind), jedes loest das vorige im Takt der Stimme ab. Normale Woerter klein und
// hell, Schluesselwoerter (im Skript mit * davor) gross und lila.
//   pair     zwei normale Woerter teilen sich eine Tafel, wenn sie zusammen hoechstens so viele Zeichen haben (0 = nie)
//   size     Schriftgroesse normaler Woerter, keySize die der Schluesselwoerter (px)
//   minShow  eine Tafel, die kuerzer stuende, wird mit der naechsten zusammengelegt (s)
export const CAPTION = { mode: 'zeile', pair: 10, size: 70, keySize: 136, minShow: 0.16 }
export const CAPTION_MODES = ['zeile', 'wort']
// Bis zu drei Schluesselwoerter hintereinander bleiben zusammen ("vor deiner Tür")
const KEY_RUN = 3

// Was script.json enthalten darf. Alles andere ist fast immer ein Tippfehler
// ("parms" statt "params") und fiel frueher still auf die Vorgaben zurueck:
// ein Baeckerei-Video zeigte dann "Café Nordwind". Namen mit "_" am Anfang
// sind Hinweise und werden ueberall ignoriert.
const KEYS = {
  script: ['meta', 'voice', 'timing', 'say', 'poster', 'sound', 'mix', 'scenes', 'captionStyle', 'pace', 'progress'],
  timing: ['lead', 'hold', 'maxGap'],
  captionStyle: Object.keys(CAPTION),
  pace: ['maxStill', 'minChanges'],
  progress: ['words'],
  chapter: ['n', 'word', 'offset'],
  camera: ['cap', 'word', 'offset', 'at', 'zoom', 'focus', 'to', 'dur', 'whoosh'],
  sound: [...Object.keys(SOUND), ...Object.keys(LIBSOUND)],
  sounds: ['sound', 'cap', 'word', 'offset', 'at', 'anchor', 'vol', 'duck'],
  mix: Object.keys(MIX),
  voice: ['voice_id', 'model_id', 'language_code', 'output_format', 'seed', 'voice_settings', 'stability', 'similarity_boost', 'style', 'speed', 'use_speaker_boost'],
  scene: ['component', 'params', 'anchors', 'captions', 'enter', 'camera', 'sounds'],
  parts: ['parts'],
  caption: ['lines', 'accent', 'keep', 'role', 'instant', 'mode', 'scale', 'gapBefore', 'chapter']
}

// Die Marke wird "Stampit" geschrieben, aber englisch "Stamp It" gesprochen.
// Ohne diese Vorgabe liest die Stimme "Stampit" wie ein deutsches Wort. Auch
// "StampIt" kam nicht verlaesslich englisch heraus (Doener-Video, 16.11.2026);
// von vier Proben hat der Betreiber "Staemp-it" gewaehlt (Probe C). Die beiden
// Referenzvideos setzen "StampIt" selbst im Skript und bleiben dadurch gleich.
export const SAY_DEFAULT = { Stampit: 'Stämp-it' }

const PUNCT = /[.,!?:;]+$/

function fail(msg) { const e = new Error(msg); e.script = true; throw e }

function onlyKeys(obj, allowed, where) {
  if (obj == null) return
  if (typeof obj !== 'object' || Array.isArray(obj)) fail(`${where} muss ein Objekt sein ({ ... })`)
  for (const k of Object.keys(obj)) if (!k.startsWith('_') && !allowed.includes(k)) fail(`${where}: "${k}" gibt es nicht. Erlaubt: ${allowed.join(', ')} (Hinweise beginnen mit "_")`)
}
const num = (v, lo, hi, where) => { if (typeof v !== 'number' || !(v >= lo && v <= hi)) fail(`${where} muss eine Zahl zwischen ${lo} und ${hi} sein (bekam ${JSON.stringify(v)})`); return v }

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

// Eine Textzeile im Modus "wort". Zwei Zeichen kommen dazu, beide nur hier, damit ein
// Stern oder Strich in einem alten Skript weiter so auf dem Bild steht wie bisher:
//   *Wort   Schluesselwort (gross, lila)
//   |       Grenze zwischen zwei Tafeln. Steht in einer Zeile ein |, gelten dort NUR
//           die Grenzen aus dem Skript; ohne | teilt die Zeile sich von selbst auf.
// Jede Zeile in "lines" ist ausserdem eine Grenze. Mit "instant" stehen alle Zeilen
// als EINE Tafel untereinander da (der Einstieg: die ganze Frage ab dem ersten Bild).
function parseWortCaption(c, sayMap, where, style) {
  if (c.accent != null) fail(`${where}: "accent" gibt es im Modus "wort" nicht. Schlüsselwörter bekommen einen Stern davor: *Handy`)
  if (c.keep) fail(`${where}: "keep" gibt es im Modus "wort" nicht (dort steht immer nur eine Tafel). Für eine Zeile, die stehen bleibt: "mode": "zeile"`)
  const scale = c.scale == null ? 1 : num(c.scale, 0.5, 2, `${where}: "scale"`)
  const words = [], say = [], key = [], lines = [], groups = []
  c.lines.forEach((line, li) => {
    const raw = Array.isArray(line) ? line : String(line).trim().split(/\s+/)
    if (!raw.length || raw[0] === '') fail(`${where}: Zeile ${li + 1} ist leer`)
    const explicit = raw.includes('|'), row = []
    let cur = null
    for (const x of raw) {
      if (x === '|') { cur = null; continue }
      const star = typeof x === 'string' && x.startsWith('*')
      const w = parseWord(star ? x.slice(1) : x, sayMap, `${where}, Zeile ${li + 1}`), isKey = star || !!(x && typeof x === 'object' && x.key)
      const k = words.length; words.push(w.show); say.push(w.say); key.push(isKey); row.push(w)
      // Von selbst zusammen: zwei kurze normale Woerter, oder Schluesselwoerter in Folge.
      // Nie ueber ein Satzzeichen hinweg: dort macht die Stimme eine Pause.
      const prev = cur && words[cur[cur.length - 1]]
      const joins = cur && !explicit && !PUNCT.test(prev) && key[cur[0]] === isKey &&
        (isKey ? cur.length < KEY_RUN : cur.length < 2 && prev.length + 1 + w.show.length <= style.pair)
      if (cur && (explicit || joins)) cur.push(k)
      else { cur = [k]; groups.push(cur) }
    }
    if (!row.length) fail(`${where}: Zeile ${li + 1} enthält kein Wort`)
    lines.push(row)
  })
  // "instant": alle Zeilen als eine Tafel, jede Zeile eine Reihe
  let k = 0
  const rows = lines.map(l => l.map(() => k++))
  return { lines, words, say, accent: words.length, keep: false, role: null, instant: !!c.instant, mode: 'wort', scale, key, groups: c.instant ? null : groups, rows }
}

function parseCaption(c, sayMap, where, style = CAPTION) {
  if (!c || !Array.isArray(c.lines) || !c.lines.length) fail(`${where}: braucht "lines" (Liste von Zeilen)`)
  onlyKeys(c, KEYS.caption, where)
  const mode = c.mode ?? style.mode
  if (!CAPTION_MODES.includes(mode)) fail(`${where}: "mode" muss ${CAPTION_MODES.map(m => `"${m}"`).join(' oder ')} sein (bekam ${JSON.stringify(mode)})`)
  // Zeilen mit "role" zeichnet der Baustein selbst: fuer sie gibt es keinen Modus
  if (mode === 'wort' && !c.role) return parseWortCaption(c, sayMap, where, style)
  if (c.scale != null) fail(`${where}: "scale" gibt es nur im Modus "wort"`)
  const lines = c.lines.map((line, li) => {
    const raw = Array.isArray(line) ? line : String(line).trim().split(/\s+/)
    if (!raw.length || raw[0] === '') fail(`${where}: Zeile ${li + 1} ist leer`)
    return raw.map(x => parseWord(x, sayMap, `${where}, Zeile ${li + 1}`))
  })
  const words = lines.flat()
  const accent = c.accent == null ? words.length : Number(c.accent)
  if (!Number.isInteger(accent) || accent < 0) fail(`${where}: "accent" muss ein Wort-Index >= 0 sein`)
  return { lines, words: words.map(x => x.show), say: words.map(x => x.say), accent, keep: !!c.keep, role: c.role || null, instant: !!c.instant, mode: 'zeile' }
}

// Kamerabewegungen eines Teils: Zeitpunkt wie ein Anker ({cap, word, offset} oder {at, offset}),
// dazu wohin. Geprueft wird hier, damit ein Tippfehler nicht erst im Browser auffaellt.
function parseCamera(list, where) {
  if (list == null) return []
  if (!Array.isArray(list)) fail(`${where}: "camera" muss eine Liste sein ([ { ... } ])`)
  const pair = (v, what) => { if (!Array.isArray(v) || v.length !== 2 || v.some(n => typeof n !== 'number')) fail(`${where}: "${what}" muss [x, y] in Pixeln sein`); return v }
  return list.map((m, i) => {
    const w = `${where}, Kamera ${i + 1}`
    onlyKeys(m, KEYS.camera, w)
    if (!m || typeof m !== 'object') fail(`${w} muss ein Objekt sein`)
    if (m.at != null && m.at !== 'start' && m.at !== 'end') fail(`${w}: "at" muss "start" oder "end" sein`)
    const out = { zoom: m.zoom == null ? 1 : num(m.zoom, 0.5, 3, `${w}: "zoom"`), dur: m.dur == null ? 0.18 : num(m.dur, 0, 3, `${w}: "dur"`), whoosh: m.whoosh == null ? 0 : num(m.whoosh, 0, 1, `${w}: "whoosh"`) }
    if (m.focus != null) out.focus = pair(m.focus, 'focus')
    if (m.to != null) out.to = pair(m.to, 'to')
    for (const k of ['cap', 'word', 'offset', 'at']) if (m[k] != null) out[k] = m[k]
    return out
  })
}

// Klaenge aus der Bibliothek an einem Teil: welcher Klang, wann, wie laut. Zeitpunkt wie ein Anker
// ({cap, word, offset} oder {at, offset}) oder an einem Anker des Bausteins ({anchor, offset}), damit
// ein Klang dort sitzt, wo die Bewegung passiert (der Stempel trifft, die Karte faellt in den Eimer).
// Ob es den Namen gibt, prueft die Seite gegen studio/sounds/sounds.json; hier nur die Form.
function parseSounds(list, where) {
  if (list == null) return []
  if (!Array.isArray(list)) fail(`${where}: "sounds" muss eine Liste sein ([ { "sound": "vine-boom", ... } ])`)
  return list.map((m, i) => {
    const w = `${where}, Klang ${i + 1}`
    if (!m || typeof m !== 'object' || Array.isArray(m)) fail(`${w} muss ein Objekt sein`)
    onlyKeys(m, KEYS.sounds, w)
    if (typeof m.sound !== 'string' || !/^[a-z0-9-]+$/.test(m.sound)) fail(`${w}: "sound" fehlt oder ist kein Name aus der Bibliothek (Kleinbuchstaben, Ziffern, Bindestriche)`)
    const kinds = [m.anchor != null, m.at != null, m.cap != null || m.word != null].filter(Boolean).length
    if (kinds !== 1) fail(`${w}: Zeitpunkt genau EINMAL angeben: "anchor" (Anker des Bausteins), "at" ("start"/"end") oder "cap" und "word"`)
    if (m.at != null && m.at !== 'start' && m.at !== 'end') fail(`${w}: "at" muss "start" oder "end" sein`)
    if (m.anchor != null && typeof m.anchor !== 'string') fail(`${w}: "anchor" muss der Name eines Ankers sein`)
    for (const k of ['cap', 'word']) if (m[k] != null && !Number.isInteger(m[k])) fail(`${w}: "${k}" muss eine ganze Zahl sein`)
    if (m.offset != null) num(m.offset, -5, 5, `${w}: "offset"`)
    if (m.duck != null && typeof m.duck !== 'boolean') fail(`${w}: "duck" muss true oder false sein`)
    const out = { sound: m.sound, vol: m.vol == null ? 1 : num(m.vol, 0, 3, `${w}: "vol"`), duck: m.duck !== false, offset: m.offset || 0 }
    for (const k of ['cap', 'word', 'at', 'anchor']) if (m[k] != null) out[k] = m[k]
    return out
  })
}

/** Macht aus script.json die flache Form, mit der alle rechnen. Wirft bei Fehlern. */
export function normalize(script) {
  if (!script || typeof script !== 'object') fail('script.json ist leer')
  const meta = script.meta || {}
  if (!meta.title || !meta.slug) fail('meta.title und meta.slug fehlen')
  if (!Array.isArray(script.scenes) || !script.scenes.length) fail('scenes fehlt oder ist leer')
  onlyKeys(script, KEYS.script, 'script.json'); onlyKeys(script.timing, KEYS.timing, '"timing"')
  onlyKeys(script.sound, KEYS.sound, '"sound"'); onlyKeys(script.mix, KEYS.mix, '"mix"'); onlyKeys(script.voice, KEYS.voice, '"voice"')
  onlyKeys(script.captionStyle, KEYS.captionStyle, '"captionStyle"'); onlyKeys(script.pace, KEYS.pace, '"pace"')
  const sayMap = { ...SAY_DEFAULT, ...(script.say || {}) }
  const t = script.timing || {}
  const timing = { ...TIMING, ...(t.lead != null ? { lead: +t.lead } : {}), ...(t.hold != null ? { hold: +t.hold } : {}) }
  if (t.maxGap != null) timing.maxGap = num(t.maxGap, 0.15, 3, '"timing.maxGap"')
  const captionStyle = { ...CAPTION, ...Object.fromEntries(Object.entries(script.captionStyle || {}).filter(([k]) => !k.startsWith('_'))) }
  if (!CAPTION_MODES.includes(captionStyle.mode)) fail(`"captionStyle.mode" muss ${CAPTION_MODES.map(m => `"${m}"`).join(' oder ')} sein (bekam ${JSON.stringify(captionStyle.mode)})`)
  num(captionStyle.pair, 0, 40, '"captionStyle.pair"'); num(captionStyle.size, 30, 140, '"captionStyle.size"')
  num(captionStyle.keySize, 40, 260, '"captionStyle.keySize"'); num(captionStyle.minShow, 0, 1, '"captionStyle.minShow"')
  // "pace": Richtwerte fuer den Bildwechsel (nur Warnungen): laengstes stehendes Bild und Mindestzahl der Wechsel
  let pace = null
  if (script.pace) pace = { maxStill: script.pace.maxStill == null ? null : num(script.pace.maxStill, 0.5, 60, '"pace.maxStill"'), minChanges: script.pace.minChanges == null ? null : num(script.pace.minChanges, 0, 200, '"pace.minChanges"') }
  // "progress": die Wortleiste oben (seit 19.11.2026, Nachbau "zwei Cafés"). Statt eines Stempels je Szene
  // stehen dort Kapitel mit je einem Wort, und ein Kapitel beginnt an einer Textzeile ("chapter"), nicht an
  // einer Szene. Grund: ein Video aus langen Kamerafahrten hat fast alles in EINER Szene (Teile blenden
  // ineinander, Szenen schieben seitlich), die Stempelreihe zeigte dort einen einzigen Punkt. Ohne "progress"
  // bleibt die Stempelreihe, wie sie war (tools/regress.mjs haelt die alten Videos Bild fuer Bild fest).
  let progress = null
  if (script.progress != null) {
    onlyKeys(script.progress, KEYS.progress, '"progress"')
    const w = script.progress.words
    if (!Array.isArray(w) || w.length < 2 || w.length > 5) fail('"progress.words" muss eine Liste mit 2 bis 5 Kapitelwörtern sein, z. B. ["WALLET", "VON SELBST", "DESIGN", "DEIN ZUG"]')
    for (const x of w) if (typeof x !== 'string' || !x.trim() || x.length > 14) fail(`"progress.words": "${x}" muss ein kurzer Text sein (1 bis 14 Zeichen); die Leiste hat oben eine Zeile für alle Kapitel`)
    progress = { words: w.map(x => x.trim()) }
  }
  const sound = { ...SOUND, ...(script.sound || {}) }
  num(sound.sceneWhoosh, 0, 1, '"sound.sceneWhoosh"')
  if (sound.duck != null) num(sound.duck, -40, 0, '"sound.duck"')
  if (sound.maxOverlap != null) num(sound.maxOverlap, 0, 10, '"sound.maxOverlap"')
  if (sound.minMargin != null) num(sound.minMargin, -20, 40, '"sound.minMargin"')
  const mix = { ...MIX, ...(script.mix || {}) }
  num(mix.voice, 0, 4, '"mix.voice"'); num(mix.sfx, 0, 4, '"mix.sfx"'); num(mix.limit, 0.0625, 1, '"mix.limit"')
  if (typeof mix.level !== 'boolean') fail('"mix.level" muss true oder false sein')
  if (mix.lufs != null) { num(mix.lufs, -30, -8, '"mix.lufs"'); num(mix.truePeak, -9, 0, '"mix.truePeak"') }
  const caps = [], scenes = []
  script.scenes.forEach((sc, si) => {
    if (!sc || typeof sc !== 'object') fail(`Szene ${si + 1} muss ein Objekt sein`)
    const rawParts = Array.isArray(sc.parts) ? sc.parts : [sc]
    if (!rawParts.length) fail(`Szene ${si + 1}: "parts" ist leer`)
    // Eine Szene mit Teilen traegt selbst nichts ausser "parts": ein "params" daneben wuerde nie gelesen.
    if (Array.isArray(sc.parts)) onlyKeys(sc, KEYS.parts, `Szene ${si + 1} (mit "parts")`)
    const parts = rawParts.map((p, pi) => {
      const where = `Szene ${si + 1}${rawParts.length > 1 ? `, Teil ${pi + 1}` : ''}`
      if (!p || typeof p !== 'object') fail(`${where} muss ein Objekt sein`)
      onlyKeys(p, KEYS.scene, where)
      if (!p.component || !/^[a-z0-9-]+$/.test(p.component)) fail(`${where}: "component" fehlt oder hat unerlaubte Zeichen`)
      if (!Array.isArray(p.captions) || !p.captions.length) fail(`${where}: braucht mindestens eine Textzeile in "captions" (die Zeit hängt an den Wörtern)`)
      // "enter": wie ein Teil erscheint. "fade" (Vorgabe) blendet ueber, "cut" schneidet hart.
      // "kreuz" blendet den neuen Teil UEBER den alten, der bis zum Ende der Blende ganz stehen bleibt (und ein
      // 3D-Teil dunkelt davor nicht ab): fuer zwei 3D-Bilder hintereinander. Mit "fade" werden beide zugleich
      // durchsichtig, und das Bild lief bei jedem Wechsel kurz durchs Dunkle (Nachbau "zwei Cafés", 19.11.2026:
      // Helligkeit von rund 50 auf 33 fuer 0,3 bis 0,5 s, am Handy wie ein Blinzeln). Nicht fuer 2D-Teile mit
      // durchsichtigem Grund: durch sie saehe man den alten Teil, bis er nach der Blende verschwindet.
      // Der erste Teil einer Szene schiebt immer von der Seite herein, dort gibt es nichts zu waehlen.
      const enter = p.enter ?? 'fade'
      if (!['fade', 'cut', 'kreuz'].includes(enter)) fail(`${where}: "enter" muss "fade", "cut" oder "kreuz" sein (bekam ${JSON.stringify(p.enter)})`)
      if (p.enter != null && pi === 0) fail(`${where}: "enter" gilt nur für Teile nach dem ersten. Der erste Teil einer Szene schiebt immer herein`)
      const camera = parseCamera(p.camera, where)
      const sounds = parseSounds(p.sounds, where)
      const idx = p.captions.map((c, ci) => {
        const cap = parseCaption(c, sayMap, `${where}, Text ${ci + 1}`, captionStyle)
        // "gapBefore": die Pause vor dieser Textzeile bekommt genau diese Laenge (gekuerzt oder
        // verlaengert, tools/tighten.py). Nur zusammen mit "timing.maxGap": ohne das wird die
        // Aufnahme gar nicht angefasst, und die Angabe bliebe still ohne Wirkung.
        if (c.gapBefore != null) {
          if (timing.maxGap == null) fail(`${where}, Text ${ci + 1}: "gapBefore" gilt nur zusammen mit "timing.maxGap"`)
          if (!caps.length) fail(`${where}, Text ${ci + 1}: "gapBefore" an der ersten Textzeile des Videos geht nicht, davor wird nichts gesprochen`)
          cap.gapBefore = num(c.gapBefore, 0.15, 1.5, `${where}, Text ${ci + 1}: "gapBefore"`)
        }
        // "chapter": ab dieser Textzeile gilt Kapitel n der Wortleiste ("progress"); 0 = keins, die Leiste
        // dunkelt ab (das Gegenbild). Als Zahl beginnt das Kapitel mit dem ersten Wort, als Objekt
        // { "n": 1, "word": -1, "offset": 0 } auf einem bestimmten Wort (die Pointe "anders" am Satzende).
        if (c.chapter != null) {
          const w2 = `${where}, Text ${ci + 1}: "chapter"`
          if (!progress) fail(`${w2} gilt nur zusammen mit "progress" oben im Skript (die Kapitelwörter)`)
          const ch = typeof c.chapter === 'number' ? { n: c.chapter } : c.chapter
          if (!ch || typeof ch !== 'object' || Array.isArray(ch)) fail(`${w2} muss eine Zahl oder { "n": ..., "word": ... } sein`)
          onlyKeys(ch, KEYS.chapter, w2)
          if (!Number.isInteger(ch.n) || ch.n < 0 || ch.n > progress.words.length) fail(`${w2}: "n" muss eine ganze Zahl von 0 bis ${progress.words.length} sein (0 = kein Kapitel, Leiste abgedunkelt)`)
          const wi = ch.word ?? 0
          if (!Number.isInteger(wi) || wi >= cap.words.length || wi < -cap.words.length) fail(`${w2}: "word" ${wi} gibt es nicht, die Textzeile hat ${cap.words.length} Wörter`)
          cap.chapter = { n: ch.n, word: wi < 0 ? wi + cap.words.length : wi, offset: ch.offset == null ? 0 : num(ch.offset, -2, 2, `${w2}: "offset"`) }
        }
        cap.scene = si; cap.part = pi; cap.k = ci; cap.id = `s${si + 1}${rawParts.length > 1 ? 'abcdefgh'[pi] : ''}.${ci + 1}`
        caps.push(cap); return caps.length - 1
      })
      return { component: p.component, params: p.params || {}, anchors: p.anchors || {}, caps: idx, enter, camera, ...(sounds.length ? { sounds } : {}) }
    })
    scenes.push({ parts })
  })
  if (progress && !caps.some(c => c.chapter)) fail('"progress" braucht mindestens eine Textzeile mit "chapter" (dort beginnt Kapitel 1); ohne bliebe die Leiste unsichtbar')
  const spoken = caps.flatMap(c => c.say).join(' ')
  return {
    meta: { language: 'de', ...meta }, voice: script.voice || {}, timing, sound, mix, poster: script.poster ?? null, captionStyle, pace, progress,
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

/**
 * Tafeln einer Textzeile im Modus "wort": welche Woerter zusammen dastehen, von wann
 * bis wann. Die Aufteilung kommt aus dem Skript (groups); hier kommt nur die Zeit dazu.
 * Eine Tafel, die kuerzer als minShow stuende (die Stimme verschluckt "sie" oder "die"
 * in einer Zehntelsekunde), wird mit der folgenden zusammengelegt: ein Wort, das nur
 * drei Bilder lang aufblitzt, liest niemand. Die letzte Tafel bleibt bis zum Ende der
 * Textzeile stehen und haengt sich notfalls an die davor.
 */
export function wortChunks(c, minShow = CAPTION.minShow) {
  const LEAD = 0.03 // wie bei den Textzeilen bisher: das Wort ist einen Hauch vor dem Laut da
  if (!c.groups) return [{ rows: c.rows, words: c.rows.flat(), s: +(c.t[0] - LEAD).toFixed(3), e: +c.e.toFixed(3), merged: false }]
  const list = c.groups.map(g => ({ words: [...g], merged: false }))
  const start = x => c.t[x.words[0]]
  for (let i = 0; i < list.length - 1;) {
    if (start(list[i + 1]) - start(list[i]) < minShow) { list[i].words.push(...list[i + 1].words); list[i].merged = true; list.splice(i + 1, 1) }
    else i++
  }
  if (list.length > 1 && c.e - start(list[list.length - 1]) < minShow) { const last = list.pop(); list[list.length - 1].words.push(...last.words); list[list.length - 1].merged = true }
  return list.map((x, i) => ({ rows: [x.words], words: x.words, s: +(start(x) - LEAD).toFixed(3), e: +(i + 1 < list.length ? start(list[i + 1]) - LEAD : c.e).toFixed(3), merged: x.merged }))
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
  for (const c of caps) if (c.mode === 'wort') c.chunks = wortChunks(c, (norm.captionStyle || CAPTION).minShow)
  const scenes = norm.scenes.map((sc, n) => ({
    index: n,
    s: n === 0 ? 0 : caps[sc.parts[0].caps[0]].t[0] - T.sceneLead,
    parts: sc.parts.map((p, j) => ({ ...p, s: j === 0 ? null : caps[p.caps[0]].t[0] - (p.enter === 'cut' ? T.cutLead : T.sceneLead) }))
  }))
  scenes.forEach((sc, n) => {
    sc.e = n + 1 < scenes.length ? scenes[n + 1].s : caps[caps.length - 1].e
    sc.parts.forEach((p, j) => { if (j === 0) p.s = sc.s; p.e = j + 1 < sc.parts.length ? sc.parts[j + 1].s : sc.e })
  })
  return { caps, scenes, duration: +scenes[scenes.length - 1].e.toFixed(3) }
}

/** Was eine neue Aufnahme bei ElevenLabs kosten wuerde (1 Zeichen = 1 Credit). */
export function voiceCost(norm) { return norm.spoken.length }
