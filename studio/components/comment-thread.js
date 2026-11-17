// Kommentarbereich, wie unter einem Reel: oben die Liste, unten Eingabefeld und Tastatur.
// Eine Frage wird unten getippt, wandert auf "send" in die Liste und steht dort gross; auf
// "reply" erscheint darunter die Antwort. Mit "verdict" bekommt der Kommentar einen Stempel
// "Stimmt" oder "Stimmt nicht" (Quiz, FORMATE.md F09).
//
// Warum es diesen Baustein gibt: die ersten vier Videos liefen alle denselben Bogen
// (Papier, Handy, Stempel, Karte von oben, Sperrbildschirm). Ein Einwand ("Brauchen meine
// Kunden dafuer eine App?") ist ein eigenes Format (FORMATE.md F03): erst die Frage, getippt,
// dann die Antwort. Der Kommentarbereich passt zum Schluss jedes Videos ("kommentiere
// STICHWORT") und zeigt keine Nachricht des Ladens an Kunden: ein Chat saehe aus, als
// schicke Stampit Nachrichten, und das steht nicht in PRODUKT.md (N9, N14).
//
// Was bewusst fehlt: Namen fremder Leute, Zahlen von Likes oder Kommentaren, lesbarer Text
// in den uebrigen Kommentaren. Das saehe nach echten Kundenstimmen aus (PRODUKT.md N12).
// Der Absender der Frage ist "Du" (der Zuschauer, der einen Laden hat).
//
// Gezeichnet bis zum Bildrand: Liste mit Platzhalter-Kommentaren, Eingabefeld und eine
// Tastatur bis unten. Eine Kamera 1,1 auf den Kommentar zeigt nur Gezeichnetes.
// Aufteilung (Buehnen-Pixel): Blatt ab 560 px, Kommentar ab 716, Eingabefeld 1400 bis 1496,
// Tastatur ab 1530 (Beiwerk in der Sperrzone von Instagram). Kommentar und Antwort enden bei
// x = 880: mit der Kamera 1,1 auf focus x = 470 bleiben sie links von der Knopfspalte (x = 950). Alle Klassen beginnen mit "ct-".
//
// Gegenpruefung am Salon-Video (17.11.2026), drei Maengel, alle hier behoben:
// - Die erste Sekunde stand fast still: die ganze Frage wurde auf die Feldbreite verkleinert (rund
//   26 px), die Schreibmarke stand von Anfang an rechts am Ende, die Tasten blieben dunkel. Gemessen
//   4- bis 8-mal weniger Bewegung als in jedem frueheren Video. Jetzt bleibt die Schrift gross, das
//   Feld rollt mit wie ein echtes Eingabefeld, die Marke laeuft hinter dem letzten Buchstaben her
//   und jede getippte Taste leuchtet kurz auf.
// - Kommentar und Antwort lagen ueber den Platzhalter-Zeilen (Bildchen und graue Balken zwischen
//   und unter den Karten). Jetzt rutscht die Liste nach unten unter die Leiste, wenn der Kommentar
//   oder die Antwort dazukommt, wie in einer echten App.
// - Fuer eine Pointe, die zum Einwand vom Anfang zurueckkehrt, gibt es "strike": ein Teil des
//   Kommentars wird auf seinen Anker durchgestrichen (statt des Stempels aus stamp-check, den die
//   alten Videos schon hatten).

const TOP = 560, ROW = 168, INPUT = { x: 40, y: 1400, w: 820, h: 96 }
// Platzhalter-Kommentare: Laenge des Namens und der beiden Zeilen (Anteile), Farbe des Bildchens
const ROWS = [[.5, .92, .55, '#8E82F5'], [.36, .7, 0, '#E58A45'], [.44, .86, .4, '#5A4FCF'], [.3, .8, .62, '#B9B0FF'],
  [.4, .66, 0, '#C97A3A'], [.52, .9, .5, '#7A6CAE'], [.34, .76, .3, '#8E82F5'], [.46, .84, 0, '#5A4FCF']]
const KEYS = ['QWERTZUIOPÜ', 'ASDFGHJKLÖÄ', 'YXCVBNM']
// Schriftgroesse im Eingabefeld. Bis zum 17.11.2026 wurde die ganze Frage auf die Feldbreite
// verkleinert (bei 56 Zeichen rund 26 px, auf dem Handy kaum zu sehen); jetzt rollt das Feld mit.
const TYPED = 46
let uid = 0

export default {
  title: 'Kommentar: Frage getippt, dann beantwortet',
  use: 'Für Einwände und Fragen (FORMATE.md, F03) und das Quiz (F09): die Frage wird unten getippt und steht dann groß in der Liste, darunter erscheint die Antwort. Mit "verdict" ein Stempel "Stimmt" oder "Stimmt nicht" am Kommentar.',
  params: {
    text: { default: 'Brauchen meine Kunden dafür eine App?', doc: 'Die Frage oder Behauptung im Kommentar (höchstens etwa 70 Zeichen, bis 3 Zeilen)' },
    author: { default: 'Du', doc: 'Absender des Kommentars (höchstens etwa 20 Zeichen). Nie ein echter oder erfundener Name einer Person: das sähe aus wie eine Kundenstimme' },
    typed: { default: true, doc: 'Die Frage wird ab dem Anker "type" unten im Eingabefeld getippt und auf "send" abgeschickt. false: der Kommentar springt auf "send" in die Liste, ohne Tippen' },
    reply: { default: '', doc: 'Antwort unter dem Kommentar (höchstens etwa 60 Zeichen, bis 2 Zeilen). Leer = keine Antwort' },
    replyName: { default: 'Stampit', doc: 'Absender der Antwort, mit dem Logo davor (höchstens etwa 20 Zeichen)' },
    verdict: { default: '', doc: '"stimmt" oder "falsch": Stempel "Stimmt" oder "Stimmt nicht" am Kommentar (Anker "verdict"). Leer = kein Stempel' },
    strike: { default: '', doc: 'Ein Stück des Kommentars, wörtlich aus "text", das auf den Anker "strike" durchgestrichen wird (Pointe, die zum Einwand vom Anfang zurückkehrt). Leer = nichts' },
    tones: { default: true, doc: 'Eigene Töne (pop beim Absenden und bei der Antwort, thud beim Stempel). false, wenn das Skript Klänge aus der Bibliothek setzt' }
  },
  captions: { min: 1 },
  anchors: p => {
    const a = {}
    if (p.typed) a.type = { at: 'start', offset: 0.05, doc: 'Das Eingabefeld leuchtet auf, die Frage wird Buchstabe für Buchstabe getippt (Ton: pop), bis kurz vor "send"' }
    a.send = p.typed ? { cap: 0, word: -1, doc: 'Die Frage wird abgeschickt und steht groß in der Liste (Ton: pop). Auf das letzte Wort der Frage' }
      : { at: 'start', offset: 0.05, doc: 'Der Kommentar springt in die Liste (Ton: pop)' }
    if (p.reply) a.reply = { cap: -1, word: 0, doc: 'Die Antwort erscheint unter dem Kommentar (Ton: pop, höher). Auf das erste Wort der Antwort' }
    if (p.verdict) a.verdict = { cap: -1, word: 0, doc: 'Der Stempel "Stimmt" oder "Stimmt nicht" landet am Kommentar (Ton: thud). Auf das Wort, das das Urteil spricht' }
    if (p.strike) a.strike = { cap: 0, word: 0, doc: 'Ein Strich fährt Zeile für Zeile durch das Stück aus "strike" (Ton: whoosh). Auf das Wort, das den Einwand zurücknimmt' }
    return a
  },
  demo: {
    params: { reply: 'Nein. Einmal scannen, fertig.' },
    captions: [{ lines: ['Brauchen meine', 'Kunden dafür', 'eine App?'], accent: 4 }, { lines: ['Nein. Einmal scannen,', 'fertig.'], accent: 1 }],
    at: { cap: 1, word: -1, offset: 0.6 }
  },
  css: `
  .ct-wall, .ct-rows, .ct-keys { left: 0; top: 0; width: 1080px; height: 1920px; }
  .ct-key { position: absolute; border-radius: 12px; background: #B9B0FF; color: #1E1850; display: grid; place-items: center; font: 600 40px 'Hanken Grotesk', sans-serif; opacity: 0; box-shadow: 0 0 26px rgba(185,176,255,.7); }
  .ct-title { left: 0; right: 0; top: 604px; text-align: center; font: 700 40px var(--display); letter-spacing: -.01em; }
  .ct-post { left: 40px; top: 716px; width: 840px; padding: 30px 34px 26px 140px; border-radius: 30px; background: #2E2672; border: 2px solid rgba(185,176,255,.45); box-shadow: 0 30px 60px rgba(0,0,0,.45); }
  .ct-av { position: absolute; left: 30px; top: 30px; width: 86px; height: 86px; border-radius: 50%; background: var(--lilac); color: var(--night); display: grid; place-items: center; font: 700 40px var(--display); }
  .ct-name { font: 700 34px var(--body); }
  .ct-name i { font-style: normal; font-weight: 500; opacity: .55; margin-left: 14px; }
  .ct-text { position: relative; margin-top: 10px; font: 600 58px/1.16 var(--display); letter-spacing: -.01em; }
  .ct-strike { position: absolute; border-radius: 6px; background: #FF6B8B; transform-origin: 0 50%; scale: 0 1; box-shadow: 0 0 18px rgba(255,107,139,.55); }
  .ct-act { margin-top: 18px; display: flex; gap: 34px; align-items: center; font: 600 28px var(--body); opacity: .6; }
  .ct-act svg { width: 34px; }
  .ct-reply { left: 150px; width: 730px; padding: 26px 30px 26px 124px; border-radius: 28px; background: #3C3489; border: 2px solid rgba(185,176,255,.3); box-shadow: 0 24px 50px rgba(0,0,0,.4); opacity: 0; }
  .ct-reply .ct-logo { position: absolute; left: 26px; top: 26px; }
  .ct-reply .ct-text { font-size: 50px; color: var(--lilac); }
  .ct-input { left: ${INPUT.x}px; top: ${INPUT.y}px; width: ${INPUT.w}px; height: ${INPUT.h}px; border-radius: 48px; background: #2C2468; border: 2px solid rgba(185,176,255,.35); padding: 0 40px; display: flex; align-items: center; overflow: hidden; }
  .ct-ph { font: 500 38px var(--body); color: rgba(255,255,255,.4); white-space: nowrap; }
  .ct-typed { position: absolute; left: 40px; top: 50%; translate: 0 -50%; display: block; font: 600 ${TYPED}px/1.25 var(--body); white-space: nowrap; }
  .ct-typed b { font-weight: inherit; opacity: 0; white-space: pre; }
  .ct-caret { position: absolute; left: 2px; top: 8%; width: 5px; height: 84%; border-radius: 3px; background: var(--lilac); opacity: 0; }
  .ct-send { left: 870px; top: ${INPUT.y + 8}px; width: 80px; height: 80px; border-radius: 50%; background: var(--brand); color: #fff; display: grid; place-items: center; }
  .ct-send svg { width: 40px; }
  .ct-verdict { position: absolute; right: 24px; bottom: -30px; padding: 10px 26px 12px; border-radius: 16px; border: 7px solid; font: 700 50px var(--display); display: flex; gap: 12px; align-items: center; rotate: -8deg; opacity: 0; background: rgba(14,10,36,.82); white-space: nowrap; }
  .ct-verdict svg { width: 52px; stroke-width: 3.2; }
  .ct-verdict.ja { color: var(--lilac); border-color: var(--lilac); }
  .ct-verdict.nein { color: #FF6B8B; border-color: #FF6B8B; }
  `,
  build(ctx) {
    const { p, key, loop, cue } = ctx, { BACK, OUT } = ctx.ease
    const id = 'ct' + (++uid), esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    if (typeof p.text !== 'string' || !p.text.trim()) ctx.fail('"text" darf nicht leer sein')
    if (p.text.length > 70) ctx.fail(`"text" hat ${p.text.length} Zeichen, höchstens 70 passen in den Kommentar`)
    if (p.reply.length > 60) ctx.fail(`"reply" hat ${p.reply.length} Zeichen, höchstens 60`)
    if (p.author.length > 20 || p.replyName.length > 20) ctx.fail('"author" und "replyName" höchstens 20 Zeichen')
    if (!['', 'stimmt', 'falsch'].includes(p.verdict)) ctx.fail('"verdict" ist "stimmt", "falsch" oder leer')

    // ---- Blatt mit Liste, Eingabefeld und Tastatur, bis zum Bildrand
    const g = [`<defs><linearGradient id="${id}-fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0E0A24" stop-opacity=".9"/><stop offset="1" stop-color="#0E0A24" stop-opacity="0"/></linearGradient></defs>`]
    g.push(`<rect x="0" y="${TOP}" width="1080" height="${1920 - TOP}" rx="48" fill="#1E1850"/><rect x="0" y="${TOP + 60}" width="1080" height="${1860 - TOP}" fill="#1E1850"/>`)
    g.push(`<rect x="500" y="${TOP + 18}" width="80" height="10" rx="5" fill="rgba(255,255,255,.3)"/><rect x="0" y="${TOP + 116}" width="1080" height="2" fill="rgba(255,255,255,.1)"/>`)
    // Platzhalter-Zeilen in einer eigenen Ebene unter der Leiste: sie ruecken nach unten, wenn
    // Kommentar und Antwort dazukommen, und verschwinden dabei hinter Eingabefeld und Tastatur.
    // Eine Zeile mehr als sichtbar, damit beim Ruecken keine Luecke oben entsteht.
    const rg = []
    ROWS.forEach(([n, a, b, c], i) => {
      const y = TOP + 150 + i * ROW
      if (y > INPUT.y + 120) return
      const g = rg
      g.push(`<g opacity=".5"><circle cx="100" cy="${y + 36}" r="38" fill="${c}"/><rect x="164" y="${y + 6}" width="${Math.round(300 * n)}" height="18" rx="9" fill="rgba(255,255,255,.55)"/>`)
      g.push(`<rect x="164" y="${y + 44}" width="${Math.round(720 * a)}" height="16" rx="8" fill="rgba(255,255,255,.3)"/>`)
      if (b) g.push(`<rect x="164" y="${y + 76}" width="${Math.round(720 * b)}" height="16" rx="8" fill="rgba(255,255,255,.3)"/>`)
      g.push(`<path transform="translate(984 ${y + 18}) scale(1.6)" d="M12 19.5S4.5 15 4.5 9.6A3.9 3.9 0 0 1 12 8a3.9 3.9 0 0 1 7.5 1.6c0 5.4-7.5 9.9-7.5 9.9Z" fill="none" stroke="rgba(255,255,255,.5)" stroke-width="2"/></g>`)
    })
    // Leiste unten: Eingabe und Tastatur, deckt die Liste ab (eigene Ebene ueber den Zeilen)
    const bar = []
    bar.push(`<rect x="0" y="${INPUT.y - 34}" width="1080" height="${1920 - INPUT.y + 34}" fill="#171140"/><rect x="0" y="${INPUT.y - 34}" width="1080" height="2" fill="rgba(255,255,255,.1)"/>`)
    const ky = 1532, kh = 84, kg = 12, keyAt = {}
    KEYS.forEach((row, r) => {
      const n = row.length + (r === 2 ? 2 : 0), w = Math.floor((1040 - (11 - 1) * kg) / 11)
      let x = (1080 - (n * w + (n - 1) * kg)) / 2
      const keys = r === 2 ? ['⇧', ...row, '⌫'] : [...row]
      for (const k of keys) {
        bar.push(`<rect x="${x.toFixed(1)}" y="${ky + r * (kh + kg)}" width="${w}" height="${kh}" rx="12" fill="${k.length > 1 || '⇧⌫'.includes(k) ? '#2A2363' : '#3A3180'}"/>`)
        // Umschalt- und Loeschtaste ohne Zeichen: die Schrift hat keine Pfeile, ein Ersatzzeichen saehe kaputt aus
        if (k.length === 1 && !'⇧⌫'.includes(k)) { bar.push(`<text x="${(x + w / 2).toFixed(1)}" y="${ky + r * (kh + kg) + 56}" text-anchor="middle" style="font: 500 36px 'Hanken Grotesk', sans-serif" fill="rgba(255,255,255,.75)">${k}</text>`); keyAt[k] = { x, y: ky + r * (kh + kg), w, h: kh } }
        x += w + kg
      }
    })
    const ry = ky + 3 * (kh + kg)
    keyAt[' '] = { x: 226, y: ry, w: 628, h: kh }
    bar.push(`<rect x="20" y="${ry}" width="190" height="${kh}" rx="12" fill="#2A2363"/><rect x="226" y="${ry}" width="628" height="${kh}" rx="12" fill="#3A3180"/><rect x="870" y="${ry}" width="190" height="${kh}" rx="12" fill="#2A2363"/>`)
    bar.push(`<rect x="0" y="${TOP - 40}" width="1080" height="120" fill="url(#${id}-fade)"/>`)
    ctx.html(`<svg class="abs ct-wall" viewBox="0 0 1080 1920">${g.join('')}</svg><svg class="abs ct-rows" viewBox="0 0 1080 1920">${rg.join('')}</svg>
      <svg class="abs ct-wall" viewBox="0 0 1080 1920">${bar.join('')}</svg><div class="abs ct-keys"></div><div class="abs ct-title">Kommentare</div>`)
    const rows = ctx.$('.ct-rows')

    // ---- Eingabefeld: Platzhalter, getippte Buchstaben, Schreibmarke, Senden-Knopf
    ctx.html(`<div class="abs ct-input" data-safe="Eingabefeld"><span class="ct-ph">Kommentar hinzufügen …</span><span class="ct-typed" data-oneline="Getippte Frage"></span></div>
      <div class="abs ct-send"><svg class="ico" viewBox="0 0 24 24"><path d="M5 12h13"/><path d="M13 6l6 6-6 6"/></svg></div>`)
    const typed = ctx.$('.ct-typed'), ph = ctx.$('.ct-ph')
    // Die Frage in Buchstaben teilen, in voller Groesse. Wie weit jeder Buchstabe reicht, steht nach
    // dem Setzen fest; daraus folgen Stelle der Schreibmarke und wie weit das Feld schon gerollt ist.
    const letters = [...p.text].map(ch => { const b = ctx.el('b'); b.textContent = ch; typed.append(b); return b })
    const caret = ctx.el('i', 'ct-caret'); typed.append(caret)
    const room = INPUT.w - 80 - 14, ends = letters.map(b => b.offsetLeft + b.offsetWidth)

    // ---- Der Kommentar in der Liste
    const initial = [...p.author.trim()][0] || '?'
    ctx.html(`<div class="abs ct-post" data-safe="Kommentar"><div class="ct-av">${esc(initial.toUpperCase())}</div>
      <div class="ct-name" data-oneline="Absender des Kommentars"><span></span><i>gerade eben</i></div>
      <div class="ct-text" data-maxlines="Kommentar" data-max="3"></div>
      <div class="ct-act"><span>Antworten</span>${ctx.icon('heart')}</div>
      ${p.verdict ? `<div class="ct-verdict ${p.verdict === 'stimmt' ? 'ja' : 'nein'}" data-oneline="Stempel am Kommentar">${ctx.icon('check')}<span></span></div>` : ''}</div>`)
    const post = ctx.$('.ct-post'), text = ctx.$('.ct-post .ct-text')
    ctx.$('.ct-post .ct-name span').textContent = p.author
    text.textContent = p.text
    const shrink = (e, size, min, lines) => { e.style.fontSize = size + 'px'; while (e.offsetHeight > size * 1.16 * lines + 4 && size > min) { size -= 2; e.style.fontSize = size + 'px' } }
    shrink(text, 58, 40, 3)

    const ts = ctx.at('send')
    if (p.typed) {
      const t0 = ctx.at('type'), t1 = Math.max(t0 + 0.2, ts - 0.12), step = (t1 - t0) / letters.length
      if (ts <= t0 + 0.2) ctx.fail('Zwischen "type" und "send" bleibt keine Zeit zum Tippen: "send" auf ein späteres Wort legen')
      // Platzhalter: weg, solange getippt wird, danach wieder da (EINE Bewegung: zwei auf derselben
      // Eigenschaft ueberschrieben sich, und der Platzhalter fehlte im ersten Bild)
      key(ph, [[t0 - 0.01, { opacity: 1 }], [t0, { opacity: 0 }], [ts + 0.05, { opacity: 0 }], [ts + 0.3, { opacity: 1 }]])
      letters.forEach((b, i) => key(b, [[t0 + i * step - 0.001, { opacity: 0 }], [t0 + i * step, { opacity: 1 }]]))
      // Schreibmarke hinter dem letzten Buchstaben, Feld rollt nach links, sobald die Zeile voll ist.
      // Vorher stand die Marke von Anfang an am Ende der (unsichtbar gesetzten) ganzen Frage.
      const at = i => t0 + i * step, shift = i => Math.max(0, ends[i] - room)
      const cf = [[t0 - 0.01, { opacity: 0, translate: '0px 0px' }], [t0, { opacity: 1, translate: '0px 0px' }]], tf = [[t0 - 0.01, { opacity: 1, translate: '0px -50%' }]]
      letters.forEach((b, i) => {
        if (i) cf.push([at(i) - 0.001, { opacity: 1, translate: `${ends[i - 1]}px 0px` }])
        cf.push([at(i), { opacity: 1, translate: `${ends[i]}px 0px` }])
        if (shift(i) > (i ? shift(i - 1) : 0)) { tf.push([at(i) - 0.001, { opacity: 1, translate: `${-(i ? shift(i - 1) : 0)}px -50%` }], [at(i), { opacity: 1, translate: `${-shift(i)}px -50%` }]) }
      })
      cf.push([ts - 0.01, { opacity: 1, translate: `${ends.at(-1)}px 0px` }], [ts, { opacity: 0, translate: `${ends.at(-1)}px 0px` }])
      key(caret, cf)
      const last = shift(letters.length - 1)
      tf.push([ts - 0.01, { opacity: 1, translate: `${-last}px -50%` }], [ts + 0.05, { opacity: 0, translate: `${-last}px -50%` }])
      key(typed, tf)
      // Jede getippte Taste leuchtet kurz auf. Zeichen ohne Taste (Fragezeichen, Punkt, Komma) bleiben dunkel.
      const presses = {}
      letters.forEach((b, i) => { const k = b.textContent === ' ' ? ' ' : b.textContent.toUpperCase(); if (keyAt[k]) (presses[k] ||= []).push(at(i)) })
      for (const [k, list] of Object.entries(presses)) {
        const r = keyAt[k], e = ctx.el('div', 'ct-key'); e.textContent = k.trim()
        Object.assign(e.style, { left: r.x.toFixed(1) + 'px', top: r.y + 'px', width: r.w + 'px', height: r.h + 'px' })
        ctx.$('.ct-keys').append(e)
        const fr = [[list[0] - 0.002, { opacity: 0 }]]
        list.forEach((t, j) => { const d = Math.min(0.11, (list[j + 1] ?? Infinity) - t - 0.004); fr.push([t - 0.001, { opacity: 0 }], [t, { opacity: 1 }], [t + d, { opacity: 0 }]) })
        key(e, fr)
      }
      key(ctx.$('.ct-input'), [[t0, { borderColor: 'rgba(185,176,255,.35)' }], [t0 + 0.15, { borderColor: 'rgba(185,176,255,1)' }], [ts, { borderColor: 'rgba(185,176,255,1)' }], [ts + 0.3, { borderColor: 'rgba(185,176,255,.35)' }]])
      key(ctx.$('.ct-send'), [[ts - 0.06, { scale: 1 }], [ts, { scale: 0.82 }], [ts + 0.16, { scale: 1 }]])
      if (p.tones) cue(t0 + 0.02, 'pop', 0.45, 1.3)
      // Die Frage steigt aus dem Eingabefeld in die Liste
      key(post, [[ts - 0.001, { opacity: 0, translate: '0px 560px', scale: 0.7 }, BACK], [ts, { opacity: 1, translate: '0px 560px', scale: 0.7 }, BACK], [ts + 0.4, { opacity: 1, translate: '0px 0px', scale: 1 }]])
    } else {
      key(post, [[ts, { opacity: 0, translate: '0px 80px', scale: 0.9 }, BACK], [ts + 0.32, { opacity: 1, translate: '0px 0px', scale: 1 }]])
    }
    if (p.tones) cue(ts + 0.05, 'pop', 0.85, 1)

    // ---- Antwort darunter
    if (p.reply) {
      ctx.html(`<div class="abs ct-reply" data-safe="Antwort"><span class="ct-logo">${ctx.logoSvg(72)}</span><div class="ct-name" data-oneline="Absender der Antwort"><span></span><i>Antwort</i></div><div class="ct-text" data-maxlines="Antwort" data-max="2"></div></div>`)
      const r = ctx.$('.ct-reply')
      ctx.$('.ct-reply .ct-name span').textContent = p.replyName
      const rt = ctx.$('.ct-reply .ct-text'); rt.textContent = p.reply
      shrink(rt, 50, 36, 2)
      r.style.top = (post.offsetTop + post.offsetHeight + 26) + 'px'
      // Lange Frage und Antwort zusammen: erst beide Schriften etwas kleiner, dann erst abbrechen
      for (let k = 0; k < 12 && r.offsetTop + r.offsetHeight > INPUT.y - 44; k++) {
        text.style.fontSize = Math.max(40, parseFloat(text.style.fontSize) - 2) + 'px'
        rt.style.fontSize = Math.max(36, parseFloat(rt.style.fontSize) - 2) + 'px'
        r.style.top = (post.offsetTop + post.offsetHeight + 26) + 'px'
      }
      if (r.offsetTop + r.offsetHeight > INPUT.y - 44) ctx.fail(`Kommentar und Antwort zusammen reichen bis ${r.offsetTop + r.offsetHeight} px und decken das Eingabefeld zu. Frage oder Antwort kürzen`)
      const tr = ctx.at('reply')
      key(r, [[tr, { opacity: 0, translate: '0px 50px' }, BACK], [tr + 0.32, { opacity: 1, translate: '0px 0px' }]])
      if (p.tones) cue(tr + 0.05, 'pop', 0.8, 1.25)
    }

    // ---- Die Liste rueckt nach unten, erst um den Kommentar, dann um die Antwort. Vorher lagen beide
    // ueber den Platzhalter-Zeilen, Bildchen und Balken schauten zwischen und unter ihnen hervor.
    {
      const first = TOP + 150, gap = 34
      const s1 = post.offsetTop + post.offsetHeight + gap - first
      const fr = [[ts - 0.001, { translate: '0px 0px' }, OUT], [ts + 0.4, { translate: `0px ${s1}px` }]]
      if (p.reply) {
        const r = ctx.$('.ct-reply'), tr = ctx.at('reply'), s2 = r.offsetTop + r.offsetHeight + gap - first
        fr.push([tr, { translate: `0px ${s1}px` }, OUT], [tr + 0.32, { translate: `0px ${s2}px` }])
      }
      key(rows, fr)
    }

    // ---- Durchgestrichen: ein Stueck des Kommentars, Zeile fuer Zeile. Erst hier, wenn die Schrift
    // des Kommentars endgueltig steht (die Antwort kann sie oben noch verkleinert haben).
    if (p.strike) {
      const i = p.text.indexOf(p.strike)
      if (i < 0) ctx.fail('"strike" muss wörtlich im Kommentar ("text") stehen')
      // Die Woerter des Stuecks einzeln setzen: nur so laesst sich ablesen, wo jede Zeile beginnt und endet
      text.textContent = ''
      text.append(document.createTextNode(p.text.slice(0, i)))
      const spans = []
      for (const bit of p.strike.split(/(\s+)/)) {
        if (!bit) continue
        if (/^\s+$/.test(bit)) { text.append(document.createTextNode(bit)); continue }
        const sp = ctx.el('span'); sp.textContent = bit; text.append(sp); spans.push(sp)
      }
      text.append(document.createTextNode(p.text.slice(i + p.strike.length)))
      const lines = []
      for (const sp of spans) {
        const l = lines.find(x => Math.abs(x.top - sp.offsetTop) < 6)
        if (l) { l.left = Math.min(l.left, sp.offsetLeft); l.right = Math.max(l.right, sp.offsetLeft + sp.offsetWidth); l.spans.push(sp) }
        else lines.push({ top: sp.offsetTop, h: sp.offsetHeight, left: sp.offsetLeft, right: sp.offsetLeft + sp.offsetWidth, spans: [sp] })
      }
      const tk = ctx.at('strike'), fs = parseFloat(getComputedStyle(text).fontSize), thick = Math.max(6, Math.round(fs * 0.11))
      lines.forEach((l, j) => {
        const e = ctx.el('i', 'ct-strike')
        Object.assign(e.style, { left: (l.left - 6) + 'px', width: (l.right - l.left + 12) + 'px', top: Math.round(l.top + l.h * 0.55 - thick / 2) + 'px', height: thick + 'px' })
        text.append(e)
        const t = tk + j * 0.16
        key(e, [[t, { scale: '0 1' }, OUT], [t + 0.24, { scale: '1 1' }]])
        for (const sp of l.spans) key(sp, [[t, { opacity: 1 }], [t + 0.24, { opacity: 0.5 }]])
      })
      if (p.tones) cue(tk, 'whoosh', 0.5)
    }

    // ---- Stempel am Kommentar
    if (p.verdict) {
      const v = ctx.$('.ct-verdict'), tv = ctx.at('verdict')
      v.querySelector('span').textContent = p.verdict === 'stimmt' ? 'Stimmt' : 'Stimmt nicht'
      if (p.verdict === 'falsch') v.querySelector('svg').innerHTML = '<path d="M6 6l12 12"/><path d="M18 6L6 18"/>'
      key(v, [[tv - 0.01, { opacity: 0, scale: 1.8 }, OUT], [tv + 0.14, { opacity: 1, scale: 1 }]])
      if (p.tones) { cue(tv, 'thud', 0.9); if (p.verdict === 'stimmt') cue(tv + 0.1, 'ok', 0.6) }
    }
    loop(ctx.$('.ct-send'), [{ boxShadow: '0 0 0 0 rgba(185,176,255,.0)' }, { boxShadow: '0 0 0 12px rgba(185,176,255,.18)' }, { boxShadow: '0 0 0 0 rgba(185,176,255,.0)' }], 1.6)
  }
}
