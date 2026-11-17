// Eine Zahl, gross, auf einer Fallblatt-Tafel wie am Bahnhof: auf "show" klappern die Blaetter
// bis zur Zahl, darunter steht in einer Zeile, was sie bedeutet. Fuer die eine Studienzahl
// eines Videos (FORMATE.md, F10) und fuer die Schritte einer Rechnung (F04), je Teil eine Zahl.
//
// Warum es diesen Baustein gibt: THEMEN.md fuehrte "Eine Zahl gross im Bild" auf der
// Warteliste (es fehlte eine Tafel fuer eine einzelne Zahl; calc-panel rechnet nur Produkte und
// steht mit vier Zeilen rund 10 s ohne Bildwechsel). Hier ist jede Zahl ein eigenes Bild, und
// eine Rechnung wird Schritt fuer Schritt mit harten Schnitten erzaehlt.
//
// Was hier nie steht: die Quelle einer Studie. PRODUKT.md verlangt sie im gesprochenen Satz,
// ohne Fussnote im Bild. "sub" ist deshalb nur fuer "Schritt 2" oder "Beispiel", nie fuer
// einen Namen oder ein Jahr.
//
// Gezeichnet bis zum Bildrand: Holzlatten an der Wand, die Tafel an zwei Stangen, darunter
// eine Bank mit zwei kleinen Tafeln als Beiwerk. Kein Zufall: alle Zeichenfolgen der Blaetter
// stehen fest im Code. Eine Kamera 1,15 um die Mitte der Tafel bleibt im gezeichneten Bild.
// Aufteilung (Buehnen-Pixel): Zeile ueber der Tafel 584 bis 630, Tafel 646 bis 976 (die Zellen
// zusammen hoechstens 700 px breit und mittig, also rechts vor x = 890, auch mit Kamera 1,15: ab 950 liegt bei
// y ueber 900 die Knopfspalte von TikTok), Zeile darunter 1030 bis
// 1180 und hoechstens bis x = 920, Bank ab 1330 (Beiwerk). Alle Klassen beginnen mit "bn-".

const BOARD = { x: 50, y: 646, w: 980, h: 330 }, ROOM = 700   // Zellen zusammen hoechstens so breit, mittig: rechts bis x = 890
// Blaetter, durch die jede Zelle klappert, bevor sie stehen bleibt
const SPIN = ['7', '3', '9', '1', '5']

export default {
  title: 'Eine Zahl, groß: Fallblatt-Tafel',
  use: 'Für eine Zahl im Bild (FORMATE.md, F10 Studie, F04 Rechnung): die Blätter klappern auf "show" bis zur Zahl, darunter eine Zeile, was sie bedeutet. Mit "from" klappert eine Zahl in die nächste (Zwischenstand einer Rechnung).',
  params: {
    value: { default: '5-25×', doc: 'Die Zahl mit Zeichen, höchstens 7 Zeichen (Leerzeichen, Komma und Punkt zählen halb). Normale Bindestriche, nie Gedankenstriche' },
    from: { default: '', doc: 'Was vor "show" auf der Tafel steht, z. B. die Zahl des Schritts davor. Leer = leere Blätter' },
    label: { default: 'so teuer ist ein neuer Kunde wie einer, der bleibt', doc: 'Zeile unter der Tafel, was die Zahl bedeutet (höchstens etwa 60 Zeichen, bis 2 Zeilen)' },
    sub: { default: '', doc: 'Kleine Zeile über der Tafel, z. B. "Schritt 2" oder "Beispiel" (höchstens etwa 24 Zeichen). Nie eine Quelle: die wird gesprochen, nicht gezeigt' },
    tones: { default: true, doc: 'Eigene Töne (tick beim Klappern, pop, wenn die Zahl steht). false, wenn das Skript Klänge aus der Bibliothek setzt' }
  },
  captions: { min: 1 },
  anchors: {
    show: { cap: 0, word: 0, doc: 'Die Blätter klappern bis zur Zahl (Töne: tick, pop). Auf das Wort, das die Zahl nennt' }
  },
  demo: {
    params: { value: '5-25×', label: 'so teuer ist ein neuer Kunde wie einer, der bleibt' },
    captions: [{ lines: ['Fünf- bis', 'fünfundzwanzigmal', 'so teuer.'], accent: 3 }],
    at: { cap: 0, word: -1, offset: 0.6 }
  },
  css: `
  .bn-wall { left: 0; top: 0; width: 1080px; height: 1920px; }
  .bn-sub { left: 0; right: 0; top: 584px; text-align: center; font: 700 30px var(--body); letter-spacing: .14em; text-transform: uppercase; color: var(--lilac); }
  .bn-board { left: ${BOARD.x}px; top: ${BOARD.y}px; width: ${BOARD.w}px; height: ${BOARD.h}px; border-radius: 28px; background: #0B081E; border: 10px solid #3A3180; box-shadow: 0 30px 70px rgba(0,0,0,.6), inset 0 0 0 4px rgba(255,255,255,.05); display: flex; justify-content: center; align-items: center; gap: 12px; padding: 0 20px; }
  .bn-cell { position: relative; height: 262px; border-radius: 14px; background: linear-gradient(180deg, #221C5A 0 49.5%, #0B081E 49.5% 50.5%, #1B1650 50.5%); box-shadow: inset 0 0 0 2px rgba(255,255,255,.06); overflow: hidden; }
  .bn-cell i { position: absolute; inset: 0; display: grid; place-items: center; font: 700 190px/1 var(--display); font-style: normal; color: #fff; opacity: 0; letter-spacing: -.03em; }
  .bn-cell i.end { color: var(--lilac); text-shadow: 0 0 40px rgba(142,130,245,.55); }
  .bn-cell b { position: absolute; left: 0; right: 0; top: 0; height: 50%; background: rgba(0,0,0,.35); opacity: 0; }
  .bn-cell::after { content: ''; position: absolute; left: -2px; right: -2px; top: 50%; height: 4px; margin-top: -2px; background: #0B081E; }
  .bn-label { left: 80px; width: 840px; top: 1030px; text-align: center; font: 600 62px/1.16 var(--display); letter-spacing: -.01em; }
  `,
  build(ctx) {
    const { p, key, cue } = ctx, { OUT } = ctx.ease
    const width = s => [...s].reduce((w, ch) => w + (' ,.'.includes(ch) ? 0.5 : 1), 0)
    if (typeof p.value !== 'string' || !p.value.trim()) ctx.fail('"value" darf nicht leer sein')
    if (width(p.value) > 7 || width(p.from) > 7) ctx.fail('"value" und "from" höchstens 7 Zeichen (Leerzeichen, Komma und Punkt zählen halb)')
    if (p.label.length > 64) ctx.fail(`"label" hat ${p.label.length} Zeichen, höchstens etwa 60 passen in zwei Zeilen`)
    if (p.sub.length > 26) ctx.fail('"sub" höchstens etwa 24 Zeichen')

    // ---- Wand mit Latten, Stangen, Bank mit zwei kleinen Tafeln: bis zum Bildrand
    const g = [`<defs><pattern id="bn-slat" width="72" height="40" patternUnits="userSpaceOnUse"><rect width="72" height="40" fill="#2A2166"/><rect x="0" y="0" width="6" height="40" fill="#221A58"/><rect x="40" y="12" width="3" height="18" rx="1.5" fill="rgba(255,255,255,.05)"/></pattern>
      <linearGradient id="bn-fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0E0A24"/><stop offset="1" stop-color="#0E0A24" stop-opacity="0"/></linearGradient>
      <radialGradient id="bn-spot" cx=".5" cy="0" r="1"><stop offset="0" stop-color="#B9B0FF" stop-opacity=".28"/><stop offset="1" stop-color="#B9B0FF" stop-opacity="0"/></radialGradient></defs>`]
    g.push('<rect x="0" y="500" width="1080" height="1420" fill="url(#bn-slat)"/>')
    g.push('<path d="M120 560 L-80 1300 H1160 L960 560 Z" fill="url(#bn-spot)"/>')
    for (const x of [260, 820]) g.push(`<rect x="${x - 7}" y="500" width="14" height="${BOARD.y - 490}" fill="#5A4FCF"/><rect x="${x - 22}" y="${BOARD.y - 24}" width="44" height="26" rx="6" fill="#3A3180"/>`)
    // Bank: Sitz, Beine, darauf zwei kleine Tafeln mit Strichen (ohne Zahl, nur Beiwerk)
    g.push('<rect x="0" y="1330" width="1080" height="590" fill="#1F1855"/><rect x="0" y="1330" width="1080" height="14" fill="#4A40A8"/>')
    for (const x of [0, 540]) {
      g.push(`<g transform="translate(${x + 60} 1384)"><rect width="420" height="170" rx="16" fill="#0B081E" stroke="#3A3180" stroke-width="6"/>`)
      for (let i = 0; i < 4; i++) g.push(`<rect x="${26 + i * 98}" y="26" width="80" height="118" rx="8" fill="#1B1650"/><rect x="${26 + i * 98}" y="83" width="80" height="4" fill="#0B081E"/><rect x="${46 + i * 98}" y="78" width="40" height="12" rx="6" fill="rgba(255,255,255,.2)"/>`)
      g.push('</g>')
    }
    for (let x = 30; x < 1080; x += 180) g.push(`<rect x="${x}" y="1620" width="140" height="220" rx="12" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="4"/>`)
    g.push('<rect x="0" y="500" width="1080" height="150" fill="url(#bn-fade)"/>')
    ctx.html(`<svg class="abs bn-wall" viewBox="0 0 1080 1920">${g.join('')}</svg>`)

    // ---- Tafel: eine Zelle je Zeichen, schmale Zellen fuer Leerzeichen, Komma, Punkt
    const target = [...p.value], start = [...p.from]
    const n = Math.max(target.length, start.length), full = width(p.value) >= width(p.from) ? width(p.value) : width(p.from)
    const cw = Math.min(150, Math.floor((ROOM - (n - 1) * 12) / Math.max(full, 1)))
    let cells = ''
    for (let i = 0; i < n; i++) {
      const ch = target[i] ?? ' ', narrow = ' ,.'.includes(ch) && (start[i] == null || ' ,.'.includes(start[i]))
      cells += `<div class="bn-cell" style="width:${narrow ? Math.round(cw / 2) : cw}px"><b></b></div>`
    }
    ctx.html(`${p.sub ? '<div class="abs bn-sub" data-oneline="Zeile über der Tafel"></div>' : ''}<div class="abs bn-board" data-safe="Zahlentafel">${cells}</div>
      <div class="abs bn-label" data-safe="Zeile unter der Tafel" data-maxlines="Zeile unter der Tafel" data-max="2"></div>`)
    if (p.sub) ctx.$('.bn-sub').textContent = p.sub
    const label = ctx.$('.bn-label'); label.textContent = p.label
    // Zeichen so gross, dass auch "€" und "×" in die Zelle passen
    const fs = Math.min(220, Math.round(cw * 1.4))

    const ts = ctx.at('show')
    ctx.$$('.bn-cell').forEach((cell, i) => {
      const from = start[i] ?? ' ', to = target[i] ?? ' ', same = from === to
      const seq = same ? [to] : [from, ...SPIN.slice(0, 3 + (i % 3)), to]
      const t0 = ts + i * 0.05, step = 0.055
      seq.forEach((ch, k) => {
        const e = ctx.el('i', k === seq.length - 1 ? 'end' : ''); e.textContent = ch.trim() ? ch : ''; e.style.fontSize = fs + 'px'; cell.append(e)
        const a = k === 0 ? ctx.s - 0.001 : t0 + k * step, b = t0 + (k + 1) * step
        const fr = [[a, { opacity: 0 }], [Math.max(a + 0.001, k === 0 ? ctx.s : a), { opacity: 1 }]]
        if (k < seq.length - 1) fr.push([b - 0.001, { opacity: 1 }], [b, { opacity: 0 }])
        if (k === 0 && seq.length === 1) { e.style.opacity = 1; return }
        key(e, fr)
      })
      // Beim Klappern verdunkelt sich die obere Haelfte kurz: das Blatt faellt
      if (!same) key(cell.querySelector('b'), [[t0, { opacity: 0 }], [t0 + 0.02, { opacity: 1 }], [t0 + seq.length * step, { opacity: 1 }], [t0 + seq.length * step + 0.06, { opacity: 0 }]])
    })
    const end = ts + (n - 1) * 0.05 + 6 * 0.055
    key(label, [[ts + 0.1, { opacity: 0, translate: '0px 30px' }, OUT], [end + 0.1, { opacity: 1, translate: '0px 0px' }]])
    if (p.tones) { cue(ts, 'tick', 0.6); cue(ts + 0.15, 'tick', 0.5); cue(end, 'pop', 0.8, 1.05) }
  }
}
