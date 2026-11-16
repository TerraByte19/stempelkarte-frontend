// Die Maschine hinter jedem Video. Liest script.json + Wort-Zeiten, baut die
// Buehne (Szenen, Textzeilen, Stempelreihe), laesst jeden Baustein sein Bild
// und seine Toene anmelden und stellt window.seek(t) bereit.
//
// Grundidee (bewaehrt im ersten Video): jede Bewegung ist eine ANGEHALTENE
// Web-Animation ueber die ganze Videolaenge. seek(t) stellt alle auf denselben
// Zeitpunkt - so laesst sich jedes Bild einzeln und immer gleich rendern,
// egal wie schnell der Rechner ist.
import { normalize, timeline, STAGE } from './script.mjs'
import { BRAND, CSS_VARS, logoSvg } from './brand.js'
import { icon, symbolDefs, ICONS } from './icons.js'

export const EASE = { BACK: 'cubic-bezier(.34,1.56,.64,1)', OUT: 'cubic-bezier(.16,1,.3,1)', IN: 'cubic-bezier(.7,0,.84,0)' }
// Was tools/sfx.py spielen kann. Ein Tippfehler im Namen soll hier auffallen
// und nicht erst als stiller Fehler im Ton.
export const SOUNDS = ['pop', 'thud', 'whoosh', 'drop', 'chime', 'ding', 'buzz', 'tick', 'scan', 'ok', 'crumple', 'kaching', 'sparkle', 'riser', 'impact', 'wtick']

const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html) e.innerHTML = html; return e }

export async function boot() {
  const state = window.STUDIO = { ready: false, errors: [], warnings: [], anchors: [], cues: [], pictures: [] }
  try { await build(state) }
  // Fehler landen in STUDIO.errors (und damit im Bericht), nicht zusaetzlich in der Konsole - sonst stehen sie doppelt da
  catch (e) { state.errors.push(String(e && e.message || e)) }
  state.ready = true
}

async function build(state) {
  // ?rest=1 an der Seitenadresse wird durchgereicht, der Server setzt daraus data.rest
  const data = await (await fetch('/__video/data.json' + location.search)).json()
  // rest = Ruhelage: keine Animation wird angelegt. So messen die Pruefungen,
  // wo jedes Element von sich aus sitzt, ohne dass Einflug oder Kamerafahrt stoeren.
  const rest = !!data.rest
  for (const [k, v] of Object.entries(CSS_VARS)) document.documentElement.style.setProperty(k, v)
  document.documentElement.lang = (data.script.meta && data.script.meta.language) || 'de'
  document.body.insertAdjacentHTML('afterbegin', `<svg width="0" height="0" style="position:absolute"><defs>${symbolDefs()}</defs></svg>`)
  // Erst alle Schriften laden: Bausteine messen Textbreiten (fit), und ein
  // Bild mit Ersatzschrift waere der haeufigste stille Fehler.
  await Promise.all([...document.fonts].map(f => f.load().catch(() => state.errors.push('Schrift lädt nicht: ' + f.family))))
  await document.fonts.ready

  const norm = normalize(data.script), TL = timeline(norm, data.times), DUR = TL.duration, S = TL.scenes
  const stage = document.getElementById('stage'), capsEl = document.getElementById('caps'), progEl = document.getElementById('prog')

  // ---- Animationen
  const anims = []
  function key(e, frames) {
    if (!e) throw new Error('key(): Element fehlt')
    if (rest) return
    const f = [...frames].sort((a, b) => a[0] - b[0]), k = []
    if (f[0][0] > 0) k.push({ offset: 0, ...f[0][1] })
    for (const [t, p, ease] of f) k.push({ offset: Math.max(0, Math.min(1, t / DUR)), ...p, ...(ease ? { easing: ease } : {}) })
    if (f[f.length - 1][0] < DUR) k.push({ offset: 1, ...f[f.length - 1][1] })
    const a = e.animate(k, { duration: DUR * 1000, fill: 'both' }); a.pause(); anims.push(a)
  }
  function loop(e, frames, period, phase = 0) {
    if (!e) throw new Error('loop(): Element fehlt')
    if (rest) return
    const a = e.animate(frames, { duration: period * 1000, iterations: Infinity, delay: -phase * 1000 }); a.pause(); anims.push(a)
  }
  const pop = (e, t, d = 0.42) => key(e, [[t, { opacity: 0, scale: 0.4 }, EASE.BACK], [t + d, { opacity: 1, scale: 1 }]])
  const rise = (e, t, d = 0.45, dy = 26) => key(e, [[t, { opacity: 0, translate: `0px ${dy}px` }, EASE.OUT], [t + d, { opacity: 1, translate: '0px 0px' }]])
  window.seek = t => { for (const a of anims) a.currentTime = t * 1000 }

  // ---- Toene: jeder meldet seinen Ton dort an, wo die Bewegung entsteht
  const cue = (meta) => (t, name, vol = 1, pitch = 1) => {
    if (!SOUNDS.includes(name)) throw new Error(`Ton "${name}" gibt es nicht (${meta.by}). Erlaubt: ${SOUNDS.join(', ')}`)
    if (!(t >= 0) || t > DUR) { state.warnings.push(`Ton "${name}" von ${meta.by} liegt bei ${t} s außerhalb des Videos und entfällt`); return }
    state.cues.push({ t: +t.toFixed(3), name, vol, pitch, ...meta })
  }
  const engineCue = cue({ scene: 0, by: 'engine' })
  // Klaenge aus der Bibliothek (studio/sounds/, im Skript "sounds"). Die Namensliste wird nur geladen,
  // wenn ein Skript sie braucht: aeltere Videos fragen den Server nichts Neues und bauen wie vorher.
  // Im Ereignis steht "lib": true; tools/sfx.py mischt sie getrennt von den berechneten Toenen.
  let lib = null
  const loadLib = async () => {
    const r = await fetch('/sounds/sounds.json')
    if (!r.ok) throw new Error('Die Klangbibliothek studio/sounds/sounds.json lässt sich nicht laden (HTTP ' + r.status + ')')
    return (await r.json()).sounds.map(x => x.name)
  }

  // ---- Szenen: alte Szene schiebt nach links weg, neue kommt von rechts
  const sceneEls = S.map((sc, n) => {
    const scene = el('div', 'scene'); scene.id = 's' + (n + 1)
    const ill = el('div', 'ill'); scene.append(ill); stage.insertBefore(scene, capsEl)
    const { s, e } = sc, fr = []
    if (n === 0) fr.push([0, { opacity: 1, translate: '0px 0px' }])
    else fr.push([s, { opacity: 0, translate: '110px 0px' }, EASE.OUT], [s + 0.45, { opacity: 1, translate: '0px 0px' }])
    if (n < S.length - 1) fr.push([e, { opacity: 1, translate: '0px 0px' }, EASE.IN], [e + 0.28, { opacity: 0, translate: '-110px 0px' }])
    key(scene, fr)
    // langsame Kamerafahrt, damit kein Bild stillsteht
    key(ill, [[s, { scale: 1.05 }, 'linear'], [e + 0.3, { scale: 1 }]])
    // Wisch-Ton zum Szenenwechsel. Lautstaerke aus "sound.sceneWhoosh" (Vorgabe 0,35; 0 = keiner).
    if (n > 0 && norm.sound.sceneWhoosh > 0) engineCue(s - 0.05, 'whoosh', norm.sound.sceneWhoosh)
    if (n > 0) state.pictures.push({ t: +s.toFixed(3), kind: 'szene', how: 'schieben', scene: n + 1, part: null, component: sc.parts[0].component })
    return { scene, ill }
  })

  // ---- Stempelreihe: ein Stempel pro Szene, die Schluss-Szene zaehlt nicht mit
  const dots = []
  for (let i = 0; i < S.length - 1; i++) {
    const p = el('div', 'p', '<i></i>'); progEl.append(p); dots.push(p)
    if (i === 0) p.firstChild.style.opacity = 1
    else pop(p.firstChild, S[i].s + 0.2)
  }
  const progressPulse = t => dots.forEach((p, i) => key(p, [[t + i * 0.08, { scale: 1 }, EASE.OUT], [t + 0.18 + i * 0.08, { scale: 1.35 }, EASE.OUT], [t + 0.5 + i * 0.08, { scale: 1 }]]))

  // ---- Textzeilen oben. Zeilen mit "role" zeichnet der Baustein selbst.
  // Modus "wort": oben steht immer nur EINE Tafel (ein Wort, zwei kurze, oder bei "instant"
  // der ganze Satz in Reihen). Jede loest die vorige im Takt der Stimme ab. Welche Woerter
  // zusammengehoeren und wann, steht schon im Zeitplan (script.mjs, wortChunks); hier
  // entsteht nur das Bild dazu. Jede Tafel wird so weit verkleinert, dass sie in die
  // Breite passt: "Benachrichtigung" oder "Sperrbildschirm" in voller Groesse liefen
  // sonst links und rechts aus dem Bild.
  const capRoom = STAGE.w - 2 * STAGE.capMargin
  state.capFit = []
  function wortCaption(c, first) {
    const st = norm.captionStyle, box = el('div', 'capw'); box.dataset.cap = c.id
    capsEl.append(box)
    c.chunks.forEach((ch, i) => {
      const chunk = el('div', 'chunk'), spans = []
      for (const rowWords of ch.rows) {
        const row = el('div', 'row')
        for (const k of rowWords) {
          const sp = el('span', 'w' + (c.key[k] ? ' key' : '')); sp.textContent = c.words[k]
          sp.dataset.size = (c.key[k] ? st.keySize : st.size) * c.scale
          sp.style.fontSize = sp.dataset.size + 'px'; row.append(sp); spans.push(sp)
        }
        chunk.append(row)
      }
      box.append(chunk)
      // Breite der breitesten Reihe messen (Schrift ist geladen) und alle Woerter der
      // Tafel im selben Verhaeltnis verkleinern, bis sie passt
      const width = () => Math.max(...[...chunk.children].map(row => [...row.children].reduce((w, sp) => { const m = getComputedStyle(sp); return w + sp.offsetWidth + parseFloat(m.marginLeft) + parseFloat(m.marginRight) }, 0)))
      let f = 1, w = width()
      for (let n = 0; w > capRoom && n < 30; n++) {
        f = Math.floor(f * Math.min(0.98, capRoom / w) * 1000) / 1000
        for (const sp of spans) sp.style.fontSize = (sp.dataset.size * f).toFixed(1) + 'px'
        w = width()
      }
      const text = ch.rows.map(r => r.map(k => c.words[k]).join(' ')).join(' / ')
      ch.fit = f; ch.text = text
      // kleinste Schrift getrennt nach normalem Wort und Schluesselwort: fuer beide gilt eine eigene Untergrenze
      const least = cls => { const v = spans.filter(sp => sp.classList.contains('key') === cls).map(sp => parseFloat(sp.style.fontSize)); return v.length ? +Math.min(...v).toFixed(1) : null }
      state.capFit.push({ id: c.id, text, factor: f, width: Math.round(w), word: least(false), keyWord: least(true) })
      // Die Tafel springt auf ihr erstes Wort herein und ist weg, sobald die naechste kommt.
      // Die letzte einer Textzeile blendet aus, und zwar in 0,07 s: die Textzeile endet 0,12 s
      // vor der naechsten, deren erste Tafel 0,03 s vor ihrem Wort erscheint. Mit den 0,1 s der
      // Textzeilen bisher laegen beide ein Bild lang uebereinander.
      const last = i === c.chunks.length - 1, out = last ? 0.07 : 0.001
      // Hereinspringen in 0,12 s, bei einer sehr kurzen Tafel entsprechend schneller: sonst laege
      // das Ende des Hereinspringens hinter dem Verschwinden, und die Tafel tauchte wieder auf.
      const up = Math.min(0.12, Math.max(0.02, (ch.e - ch.s) * 0.6))
      if (c.instant && first) { chunk.style.opacity = 1; key(chunk, [[ch.e, { opacity: 1 }], [ch.e + out, { opacity: 0 }]]) }
      else key(chunk, [[ch.s, { opacity: 0, scale: 0.84 }, EASE.OUT], [ch.s + up, { opacity: 1, scale: 1 }], [ch.e, { opacity: 1, scale: 1 }], [ch.e + out, { opacity: 0, scale: 1 }]])
    })
  }

  for (const c of TL.caps) {
    if (c.role) continue
    if (c.mode === 'wort') { wortCaption(c, c === TL.caps.find(x => !x.role)); continue }
    const box = el('div', 'cap'); box.dataset.cap = c.id; let k = 0
    // "instant": der ganze Satz steht auf einmal da statt Wort fuer Wort. Bei der
    // allerersten Textzeile schon im ersten Bild: dort entscheidet sich, ob jemand
    // weiterschaut, und ohne das ist der Textbereich die ersten 0,4 s leer.
    const first = c === TL.caps.find(x => !x.role)
    for (const line of c.lines) {
      const row = el('div')
      for (const word of line) {
        const sp = el('span', 'w' + (k >= c.accent ? ' acc' : '')); sp.textContent = word.show; row.append(sp)
        const t = c.instant ? c.t[0] : c.t[k]
        if (c.instant && first) sp.style.opacity = 1
        else key(sp, [[t - 0.03, { opacity: 0, translate: '0px 18px' }, EASE.OUT], [t + 0.22, { opacity: 1, translate: '0px 0px' }]])
        k++
      }
      box.append(row)
    }
    if (!c.keep) key(box, [[c.e, { opacity: 1 }], [c.e + 0.1, { opacity: 0 }]])
    capsEl.append(box)
  }

  // ---- Bausteine
  const ruler = el('span'); ruler.style.cssText = 'position:absolute;left:0;top:-4000px;visibility:hidden;white-space:nowrap'
  document.body.append(ruler)
  const loaded = new Map()
  // Alles, was ein Zuschauer lesen kann: fuer die Pruefung "schreibweise"
  state.texts = TL.caps.map(c => ({ where: `Textzeile ${c.id}`, text: c.words.join(' ') }))
  const collectTexts = (v, where) => {
    if (typeof v === 'string') { if (v) state.texts.push({ where, text: v }) }
    else if (v && typeof v === 'object') for (const x of Object.values(v)) collectTexts(x, where)
  }
  const same = {}
  async function component(name) {
    if (!loaded.has(name)) {
      let mod
      try { mod = (await import(`/components/${name}.js`)).default }
      catch (e) { throw new Error(`Baustein "${name}" lässt sich nicht laden (studio/components/${name}.js): ${e.message}`) }
      if (!mod || typeof mod.build !== 'function') throw new Error(`Baustein "${name}" hat keine build(ctx)-Funktion`)
      // @scope haelt die Regeln eines Bausteins in seiner eigenen Szene: zwei
      // Bausteine duerfen dieselbe Klasse verwenden, ohne sich zu stoeren.
      if (mod.css) { const st = el('style'); st.dataset.component = name; st.textContent = `@scope (.c-${name}) {\n${mod.css}\n}`; document.head.append(st) }
      loaded.set(name, mod)
    }
    return loaded.get(name)
  }

  for (const [n, sc] of S.entries()) {
    const { scene, ill } = sceneEls[n], multi = sc.parts.length > 1
    for (const [j, part] of sc.parts.entries()) {
      const mod = await component(part.component), by = `Szene ${n + 1}${multi ? ', Teil ' + (j + 1) : ''} (${part.component})`
      scene.classList.add('c-' + part.component)
      let root = ill
      if (multi) {
        root = el('div', 'part'); ill.append(root)
        // Teile blenden ineinander ueber, kurz bevor der erste Satz des neuen Teils beginnt.
        // Mit "enter": "cut" am neuen Teil wird stattdessen hart geschnitten (part.s liegt
        // dann schon knapp vor dem Wort, siehe script.mjs).
        // Ein- und Ausblenden stehen in EINER Bewegung: zwei getrennte auf derselben
        // Eigenschaft ueberschreiben sich, und ein mittlerer von drei Teilen waere dann
        // von Anfang an sichtbar gewesen (bei zwei Teilen fiel das nie auf).
        const fr = []
        if (j > 0) fr.push(...(part.enter === 'cut' ? [[part.s - 0.001, { opacity: 0 }], [part.s, { opacity: 1 }]] : [[part.s + 0.1, { opacity: 0 }], [part.s + 0.5, { opacity: 1 }]]))
        if (j + 1 < sc.parts.length) { const nx = sc.parts[j + 1], t2 = nx.s; fr.push(...(nx.enter === 'cut' ? [[t2 - 0.001, { opacity: 1 }], [t2, { opacity: 0 }]] : [[t2, { opacity: 1 }], [t2 + 0.3, { opacity: 0 }]])) }
        if (fr.length) key(root, fr)
        if (j > 0) state.pictures.push({ t: +(part.enter === 'cut' ? part.s : part.s + 0.1).toFixed(3), kind: 'teil', how: part.enter === 'cut' ? 'schnitt' : 'blende', scene: n + 1, part: j + 1, component: part.component })
      }
      // "camera": Kamerabewegungen in diesem Teil (Hineinspringen auf ein Wort). Das Bild des
      // Bausteins sitzt dafuer in einer eigenen Ebene, die vergroessert und verschoben wird;
      // die Ebene darueber blendet es zum Textbereich hin aus, damit ein vergroessertes Handy
      // nie unter die Woerter oben rutscht. Ohne "camera" bleibt alles, wie es war.
      const camRoot = root
      if (part.camera.length) { camRoot.classList.add('camview'); root = el('div', 'cam'); camRoot.append(root) }
      // Parameter: Vorgaben des Bausteins + Angaben im Skript. Unbekannte Namen
      // sind fast immer Tippfehler und sollen nicht still ignoriert werden.
      const decl = mod.params || {}, p = {}
      for (const [k, d] of Object.entries(decl)) p[k] = d.default
      for (const [k, v] of Object.entries(part.params)) {
        if (k.startsWith('_')) continue // Hinweis im Skript
        if (!(k in decl)) throw new Error(`${by}: Parameter "${k}" gibt es nicht. Erlaubt: ${Object.keys(decl).join(', ') || '(keine)'}`)
        const dv = decl[k].default
        if (dv != null && v != null && typeof dv !== typeof v) throw new Error(`${by}: Parameter "${k}" erwartet ${Array.isArray(dv) ? 'eine Liste' : typeof dv}, bekam ${JSON.stringify(v)}`)
        if (Array.isArray(dv) !== Array.isArray(v) && dv != null && v != null) throw new Error(`${by}: Parameter "${k}" erwartet ${Array.isArray(dv) ? 'eine Liste' : 'keinen Listenwert'}`)
        p[k] = v
      }
      // Ein unbekanntes Symbol fiel frueher still auf die Tasse zurueck: ein Friseur-Video mit Kaffeetasse.
      if ('icon' in decl && !ICONS[p.icon]) throw new Error(`${by}: Symbol "${p.icon}" gibt es nicht. Erlaubt: ${Object.keys(ICONS).join(', ')}`)
      for (const [k, d] of Object.entries(decl)) {
        // "same": Angaben, die im ganzen Video gleich sein sollten (Ladenname, Stempelzahl, Symbol)
        if (d.same) (same[d.same] ||= []).push({ value: p[k], by, explicit: k in part.params })
        collectTexts(p[k], `${by}, Parameter "${k}"`)
      }
      const caps = part.caps.map(i => TL.caps[i])
      const need = mod.captions || {}
      if (need.min && caps.length < need.min) throw new Error(`${by}: braucht mindestens ${need.min} Textzeile(n), hat ${caps.length}`)
      for (const role of need.roles || []) if (!caps.some(c => c.role === role)) throw new Error(`${by}: braucht eine Textzeile mit "role": "${role}"`)

      // Anker: benannte Zeitpunkte des Bausteins. Vorgabe steht im Baustein,
      // das Skript kann sie je Szene ueberschreiben ({cap, word, offset} oder {at, offset}).
      const adecl = typeof mod.anchors === 'function' ? mod.anchors(p, caps) : (mod.anchors || {})
      for (const k of Object.keys(part.anchors)) if (!(k in adecl)) throw new Error(`${by}: Anker "${k}" gibt es nicht. Erlaubt: ${Object.keys(adecl).join(', ') || '(keine)'}`)
      const resolved = {}
      const at = name => {
        if (name in resolved) return resolved[name]
        if (!(name in adecl)) throw new Error(`${by}: Anker "${name}" ist im Baustein nicht deklariert`)
        const over = part.anchors[name], base = adecl[name]
        let spec = { ...base }, source = 'vorgabe'
        if (over != null) {
          source = 'skript'
          if (typeof over === 'number') spec = { abs: over }
          else {
            // "wrod" statt "word" fiele sonst still auf die Vorgabe des Bausteins zurueck
            for (const k of Object.keys(over)) if (!k.startsWith('_') && !['cap', 'word', 'offset', 'at'].includes(k)) throw new Error(`${by}: Anker "${name}": "${k}" gibt es nicht. Erlaubt: cap, word, offset, at`)
            if ('cap' in over || 'word' in over) delete spec.at
            if ('at' in over) { delete spec.cap; delete spec.word }
            spec = { ...spec, ...over }
          }
        }
        const info = { scene: n + 1, part: multi ? j + 1 : null, component: part.component, name, source, doc: base.doc || '' }
        let t
        if (spec.abs != null) t = spec.abs
        else if (spec.at) {
          if (spec.at !== 'start' && spec.at !== 'end') throw new Error(`${by}: Anker "${name}": "at" muss "start" oder "end" sein`)
          t = (spec.at === 'start' ? part.s : part.e) + (spec.offset || 0); info.at = spec.at
        } else {
          let ci = spec.cap ?? 0, clamped = false
          if (ci < 0) ci += caps.length
          if (ci < 0 || ci >= caps.length) { ci = Math.max(0, Math.min(caps.length - 1, ci)); clamped = true }
          const c = caps[ci]; let wi = spec.word ?? 0
          if (wi < 0) wi += c.t.length
          if (wi < 0 || wi >= c.t.length) { wi = Math.max(0, Math.min(c.t.length - 1, wi)); clamped = true }
          t = c.t[wi] + (spec.offset || 0)
          Object.assign(info, { cap: ci, word: wi, wordText: c.words[wi], clamped })
          if (clamped) {
            const msg = `${by}: Anker "${name}" zeigt auf Text ${(spec.cap ?? 0) + 1}, Wort ${(spec.word ?? 0) + 1}, das gibt es in dieser Szene nicht. Genommen wurde "${c.words[wi]}" (Text ${ci + 1}, Wort ${wi + 1}).`
            if (source === 'skript') throw new Error(msg)
            state.warnings.push(msg + ' Bitte im Skript unter "anchors" festlegen.')
          }
        }
        info.offset = spec.offset || 0; info.t = +t.toFixed(3)
        state.anchors.push(info)
        return (resolved[name] = t)
      }

      const $ = sel => root.querySelector(sel)
      const res = x => typeof x === 'string' ? ($(x) || scene.querySelector(x)) : x
      const ctx = {
        root, scene, p, caps,
        s: part.s, e: part.e, sceneStart: sc.s, sceneEnd: sc.e, duration: DUR,
        isFirst: n === 0, isLast: n === S.length - 1, rest,
        w: (c, k) => {
          const cap = caps[c < 0 ? c + caps.length : c]
          if (!cap) throw new Error(`${by}: Text ${c + 1} gibt es nicht`)
          const t = cap.t[k < 0 ? k + cap.t.length : k]
          if (t == null) throw new Error(`${by}: Text ${c + 1} hat kein Wort ${k + 1}`)
          return t
        },
        cap: role => caps.find(c => c.role === role) || null,
        at,
        key: (x, frames) => key(res(x), frames), loop: (x, frames, period, phase) => loop(res(x), frames, period, phase),
        pop: (x, t, d) => pop(res(x), t, d), rise: (x, t, d, dy) => rise(res(x), t, d, dy),
        cue: cue({ scene: n + 1, by: part.component }),
        el, $, $$: sel => [...root.querySelectorAll(sel)],
        html: h => { root.insertAdjacentHTML('beforeend', h) },
        // Hintergrund hinter der Kamerafahrt: liegt in der Szene, nicht in .ill
        backdrop: h => { scene.insertBefore(el('div', null, h).firstElementChild, ill) },
        icon, logoSvg, ease: EASE, B: BRAND, STAGE, progressPulse,
        // Schrift so weit verkleinern, bis der Text in die Breite passt (lange Woerter,
        // laengere Ladennamen). Gemessen wird in einem unsichtbaren Feld ausserhalb der
        // Szene, weil dort keine Kamerafahrt und keine Drehung die Breite verfaelscht.
        fit: (x, maxWidth, min = 24) => {
          const e = res(x), cs = getComputedStyle(e); let size = parseFloat(cs.fontSize), steps = 0
          for (const k of ['fontFamily', 'fontWeight', 'fontStyle', 'letterSpacing', 'textTransform']) ruler.style[k] = cs[k]
          ruler.style.fontSize = size + 'px'; ruler.textContent = e.textContent
          if (ruler.offsetWidth <= maxWidth) return size
          while (ruler.offsetWidth > maxWidth && size > min && steps++ < 200) { size = Math.max(min, Math.floor(size * 0.97)); ruler.style.fontSize = size + 'px' }
          e.style.fontSize = size + 'px'
          return size
        },
        warn: msg => state.warnings.push(`${by}: ${msg}`),
        fail: msg => { throw new Error(`${by}: ${msg}`) }
      }
      try { await mod.build(ctx) }
      catch (e) { throw new Error(e.message.startsWith('Szene') ? e.message : `${by}: ${e.message}`) }
      if (part.camera.length) {
        // Zeitpunkt wie bei einem Anker: {cap, word, offset} oder {at, offset}
        const when = (m, i) => {
          if (m.at) return (m.at === 'start' ? part.s : part.e) + (m.offset || 0)
          let ci = m.cap ?? 0; if (ci < 0) ci += caps.length
          const c = caps[ci]; if (!c) throw new Error(`${by}: Kamera ${i + 1} zeigt auf Text ${(m.cap ?? 0) + 1}, den gibt es in diesem Teil nicht`)
          let wi = m.word ?? 0; if (wi < 0) wi += c.t.length
          if (c.t[wi] == null) throw new Error(`${by}: Kamera ${i + 1} zeigt auf Wort ${(m.word ?? 0) + 1} in Text ${ci + 1}, das gibt es nicht`)
          return c.t[wi] + (m.offset || 0)
        }
        // Drehpunkt ist die Buehnenmitte. "focus" ist der Punkt im unvergroesserten Bild, um den
        // es geht; er bleibt stehen, oder wandert nach "to". Daraus folgt die Verschiebung.
        const C = [STAGE.w / 2, STAGE.h / 2], moves = part.camera.map((m, i) => ({ ...m, t: when(m, i) })).sort((a, b) => a.t - b.t)
        let cur = { scale: 1, translate: '0px 0px' }
        const fr = [[Math.min(part.s, moves[0].t) - 0.002, cur]]
        for (const m of moves) {
          const f = m.focus || C, to = m.to || f
          const next = { scale: m.zoom, translate: `${(to[0] - C[0] - m.zoom * (f[0] - C[0])).toFixed(1)}px ${(to[1] - C[1] - m.zoom * (f[1] - C[1])).toFixed(1)}px` }
          if (m.dur > 0) fr.push([m.t, cur, EASE.OUT], [m.t + m.dur, next])
          else fr.push([m.t - 0.001, cur], [m.t, next])
          cur = next
          if (m.whoosh > 0) engineCue(m.t, 'whoosh', m.whoosh)
          // Eine Kamera, die schon mit dem Teil beginnt, ist kein eigener Bildwechsel
          if (m.t > part.s + 0.05) state.pictures.push({ t: +m.t.toFixed(3), kind: 'kamera', how: m.dur > 0 ? 'fahrt' : 'sprung', zoom: m.zoom, scene: n + 1, part: multi ? j + 1 : null, component: part.component })
        }
        key(root, fr)
      }
      // "sounds": Klaenge aus der Bibliothek. Erst nach build(), weil ein Klang an einem Anker des
      // Bausteins haengen darf ("anchor": "hit") und der dann aufgeloest ist.
      for (const [i, m] of (part.sounds || []).entries()) {
        if (!lib) lib = await loadLib()
        const w = `${by}, Klang ${i + 1}`
        if (!lib.includes(m.sound)) throw new Error(`${w}: "${m.sound}" gibt es nicht in studio/sounds/sounds.json. Erlaubt: ${lib.join(', ')}`)
        let t
        if (m.anchor != null) {
          if (!(m.anchor in adecl)) throw new Error(`${w}: Anker "${m.anchor}" gibt es in diesem Baustein nicht. Erlaubt: ${Object.keys(adecl).join(', ') || '(keine)'}`)
          t = at(m.anchor) + m.offset
        } else if (m.at) t = (m.at === 'start' ? part.s : part.e) + m.offset
        else {
          let ci = m.cap ?? 0; if (ci < 0) ci += caps.length
          const c = caps[ci]; if (!c) throw new Error(`${w} zeigt auf Text ${(m.cap ?? 0) + 1}, den gibt es in diesem Teil nicht`)
          let wi = m.word ?? 0; if (wi < 0) wi += c.t.length
          if (c.t[wi] == null) throw new Error(`${w} zeigt auf Wort ${(m.word ?? 0) + 1} in Text ${ci + 1}, das gibt es nicht`)
          t = c.t[wi] + m.offset
        }
        if (!(t >= 0) || t > DUR) { state.warnings.push(`${w}: "${m.sound}" liegt bei ${t.toFixed(2)} s außerhalb des Videos und entfällt`); continue }
        state.cues.push({ t: +t.toFixed(3), name: m.sound, vol: m.vol, pitch: 1, lib: true, duck: m.duck, scene: n + 1, by: 'skript (sounds)' })
      }
      // Jeder deklarierte Anker soll im Bericht stehen, auch wenn der Baustein ihn (noch) nicht benutzt
      for (const k of Object.keys(adecl)) if (!(k in resolved)) { try { at(k) } catch (e) { state.errors.push(e.message) } }
    }
  }

  // Derselbe Laden in jeder Szene? Der haeufigste Fehler bei neuem Skript: eine Szene
  // vergisst "shop" und zeigt die Vorgabe des Bausteins.
  for (const [what, list] of Object.entries(same)) {
    const values = [...new Set(list.map(x => JSON.stringify(x.value)))]
    if (values.length < 2) continue
    state.warnings.push(`${what} ist nicht in allen Szenen gleich: ` + values.map(v => `${v} in ${list.filter(x => JSON.stringify(x.value) === v).map(x => x.by + (x.explicit ? '' : ' [Vorgabe des Bausteins, im Skript nicht gesetzt]')).join(' und ')}`).join('; '))
  }

  state.cues.sort((a, b) => a.t - b.t)
  // Bildwechsel: Szenen, Teile und Kamerabewegungen der Reihe nach (was INNERHALB eines Bildes
  // passiert, steht bei den Ankern). Fuer den Bericht und die Richtwerte aus "pace".
  state.pictures.sort((a, b) => a.t - b.t)
  state.pace = norm.pace
  state.hold = norm.timing.hold
  const hook = TL.caps.find(c => !c.role) || TL.caps[0]
  // Bibliotheksklaenge tragen zusaetzlich "lib" und "duck"; alle anderen Ereignisse sehen aus wie immer
  window.CUES = { duration: DUR, events: state.cues.map(({ t, name, vol, pitch, lib, duck }) => lib ? { t, name, vol, pitch, lib: true, duck } : { t, name, vol, pitch }) }
  Object.assign(state, {
    duration: DUR, rest,
    scenes: S.map((sc, n) => ({ index: n + 1, s: +sc.s.toFixed(3), e: +sc.e.toFixed(3), parts: sc.parts.map(p => ({ component: p.component, s: +p.s.toFixed(3), e: +p.e.toFixed(3) })) })),
    caps: TL.caps.map(c => ({ id: c.id, scene: c.scene + 1, text: c.words.join(' '), lines: c.lines.map(l => l.map(w => w.show).join(' ')), words: c.words.length, role: c.role, keep: c.keep, start: c.t[0], last: c.last, end: +c.e.toFixed(3),
      // nur im Modus "wort": die Tafeln mit ihrer Zeit (fuer Bericht und Pruefung "tafelzeit")
      ...(c.chunks ? { mode: 'wort', chunks: c.chunks.map(ch => ({ text: ch.text, start: ch.s, end: ch.e, seconds: +(ch.e - ch.s).toFixed(3), fit: ch.fit, merged: ch.merged })) } : {}) })),
    // Titelbild: der Moment, in dem die ERSTE Textzeile des Videos vollstaendig dasteht (der
    // Aufhaenger), bevor sie verschwindet und bevor ueberblendet oder weggeschoben wird.
    // Frueher zaehlte der letzte Satz des letzten Teils der ersten Szene: bei "Papierkarte +
    // Karte verschwindet" war das Titelbild dann ein leerer Umriss mit Fragezeichen.
    poster: Math.max(0, Math.min(DUR - 0.05, typeof norm.poster === 'number' ? norm.poster : Math.min(hook.last + 0.5, hook.e - 0.05, S[0].parts[0].e - 0.15))),
    measure, probe
  })
  window.seek(0)

  // ---- Messen fuer die Pruefungen (nur in Ruhelage sinnvoll)
  function measure() {
    const sr = stage.getBoundingClientRect(), rect = e => { const r = e.getBoundingClientRect(); return { left: Math.round(r.left - sr.left), top: Math.round(r.top - sr.top), right: Math.round(r.right - sr.left), bottom: Math.round(r.bottom - sr.top) } }
    const caps = [...capsEl.children].map(box => {
      if (box.classList.contains('capw')) {
        // Modus "wort": jede Reihe jeder Tafel zaehlt fuer die Breite, fuer die Zeilenzahl
        // die hoechste Tafel, und der Kasten ist die Flaeche, die die Tafeln wirklich belegen
        const rows = [], rects = []; let lines = 0
        for (const chunk of box.children) {
          lines = Math.max(lines, chunk.children.length); rects.push(rect(chunk))
          for (const row of chunk.children) {
            let w = 0
            for (const sp of row.children) { const m = getComputedStyle(sp); w += sp.offsetWidth + parseFloat(m.marginLeft) + parseFloat(m.marginRight) }
            rows.push({ text: [...row.children].map(s => s.textContent).join(' '), width: Math.round(w), wrapped: false })
          }
        }
        return { id: box.dataset.cap, rows, lines, maxWidth: box.clientWidth, box: { left: Math.min(...rects.map(r => r.left)), top: Math.min(...rects.map(r => r.top)), right: Math.max(...rects.map(r => r.right)), bottom: Math.max(...rects.map(r => r.bottom)) } }
      }
      const cs = getComputedStyle(box), lh = parseFloat(cs.lineHeight)
      const rows = [...box.children].map(row => {
        let w = 0
        for (const sp of row.children) { const m = getComputedStyle(sp); w += sp.offsetWidth + parseFloat(m.marginLeft) + parseFloat(m.marginRight) }
        return { text: [...row.children].map(s => s.textContent).join(' '), width: Math.round(w), wrapped: row.offsetHeight > lh * 1.5 }
      })
      return { id: box.dataset.cap, rows, box: rect(box), maxWidth: box.clientWidth }
    })
    const label = e => e.dataset.safe || e.className.toString().split(' ').filter(Boolean).join('.') || e.tagName.toLowerCase()
    const sceneOf = e => { const sc = e.closest('.scene'); return sc ? +sc.id.slice(1) : 0 }
    const safe = [...stage.querySelectorAll('[data-safe]')].map(e => ({ scene: sceneOf(e), what: label(e), ...rect(e) }))
    // data-oneline: Text, der in genau einer Zeile bleiben muss. Gezaehlt wird ueber die
    // Hoehe des Elements (offsetHeight), weil die von Drehungen der Karte unberuehrt bleibt.
    const lines = [...stage.querySelectorAll('[data-oneline]')].map(e => {
      const cs = getComputedStyle(e), px = k => parseFloat(cs[k]) || 0
      const lh = parseFloat(cs.lineHeight) || px('fontSize') * 1.2
      const h = e.offsetHeight - px('paddingTop') - px('paddingBottom') - px('borderTopWidth') - px('borderBottomWidth')
      return { scene: sceneOf(e), what: e.dataset.oneline || e.dataset.maxlines || label(e), text: e.textContent.trim().slice(0, 60), width: e.scrollWidth, room: e.clientWidth, rows: Math.max(1, Math.round(h / lh)), max: 1 }
    })
    // data-maxlines="Name" data-max="2": Text, der umbrechen darf, aber nur bis zu so vielen Zeilen
    for (const e of stage.querySelectorAll('[data-maxlines]')) {
      const cs = getComputedStyle(e), lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.2
      lines.push({ scene: sceneOf(e), what: e.dataset.maxlines, text: e.textContent.trim().slice(0, 60), width: e.scrollWidth, room: e.clientWidth, rows: Math.max(1, Math.round(e.offsetHeight / lh)), max: +e.dataset.max || 1 })
    }
    // data-fit: ein Feld, aus dem sein Inhalt nicht seitlich herauslaufen darf (Kopfzeile der
    // Wallet-Karte: der Ladenname bricht nicht um, er schiebt das Kuerzel aus der Karte)
    const fits = [...stage.querySelectorAll('[data-fit]')].map(e => ({ scene: sceneOf(e), what: e.dataset.fit, text: e.textContent.trim().replace(/\s+/g, ' ').slice(0, 60), width: e.scrollWidth, room: e.clientWidth }))
    // data-apart="gruppe": Elemente derselben Gruppe duerfen sich nicht ueberdecken
    // (Absender und "jetzt" in der Benachrichtigung, Datum und Ortsnadel). Gemessen wird
    // die Schrift selbst, nicht ihr Kasten: der ist bei zentriertem Text bildschirmbreit.
    const apart = [...stage.querySelectorAll('[data-apart]')].map(e => ({ scene: sceneOf(e), group: e.dataset.apart, what: e.dataset.label || e.textContent.trim().slice(0, 40) || label(e), ...ink(e, sr) })).filter(a => a.right > a.left)
    return { caps, safe, lines, fits, apart }
  }

  // Wo die Schrift und die Zeichnungen eines Elements wirklich sitzen (nicht sein Kasten).
  // visible(knoten) entscheidet, was mitzaehlt; ohne Schrift und Zeichnung zaehlt der Kasten.
  // Was in einem Element mit data-deco steckt, ist Beiwerk in Bewegung (der Stempel, der
  // von rechts oben hereinfliegt) und zaehlt nicht als Inhalt.
  function ink(e, sr, visible = () => true) {
    const rects = [], walker = document.createTreeWalker(e, NodeFilter.SHOW_TEXT), range = document.createRange()
    const counts = x => !x.closest('[data-deco]') && visible(x)
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (!n.nodeValue.trim() || !counts(n.parentElement)) continue
      range.selectNodeContents(n); rects.push(...range.getClientRects())
    }
    for (const g of [...(e instanceof SVGElement ? [e] : []), ...e.querySelectorAll('svg')]) if (counts(g)) rects.push(g.getBoundingClientRect())
    if (!rects.length && !e.textContent.trim() && !e.querySelector('svg') && visible(e)) rects.push(e.getBoundingClientRect())
    const real = rects.filter(r => r.width > 0 && r.height > 0)
    if (!real.length) return { left: 0, top: 0, right: 0, bottom: 0 }
    return { left: Math.round(Math.min(...real.map(r => r.left)) - sr.left), top: Math.round(Math.min(...real.map(r => r.top)) - sr.top), right: Math.round(Math.max(...real.map(r => r.right)) - sr.left), bottom: Math.round(Math.max(...real.map(r => r.bottom)) - sr.top) }
  }

  // ---- Momentaufnahme fuer Pruefungen IN der Bewegung (nach seek(t)): wo sitzt gerade
  // sichtbare Schrift/Zeichnung der wichtigen Elemente? Die Ruhelage reicht dafuer nicht:
  // die Becherreihe rueckt zur Seite, ein Preisschild steht nur zwei Sekunden am Rand.
  function probe() {
    const sr = stage.getBoundingClientRect(), memo = new Map()
    const opacity = e => {
      if (!e || e === stage) return 1
      if (!memo.has(e)) memo.set(e, parseFloat(getComputedStyle(e).opacity) * opacity(e.parentElement))
      return memo.get(e)
    }
    const visible = e => opacity(e) >= 0.5
    const out = []
    for (const e of stage.querySelectorAll('[data-safe]')) {
      const sc = e.closest('.scene'); if (!sc || !visible(e)) continue
      const r = ink(e, sr, visible)
      if (r.right > r.left) out.push({ scene: +sc.id.slice(1), what: e.dataset.safe, ...r })
    }
    return out
  }
}
