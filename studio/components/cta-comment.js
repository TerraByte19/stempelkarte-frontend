// Schlussbild: "Dann kommentiere jetzt [KARTE], und wir melden uns bei dir."
// Das Stichwort steht gross in einer Sprechblase, darunter das Logo.
// Gehoert ans Ende: die Stempelreihe oben ist dann voll und pulsiert.
//
// Der Satz kommt aus der Textzeile mit "role": "cta":
//   Zeile 1 = Text ueber der Blase, das LETZTE Wort ist das Stichwort
//   alle weiteren Zeilen = Text unter der Blase
const PUNCT = /[.,!?:;]+$/

export default {
  title: 'Schluss: Kommentiere STICHWORT',
  use: 'Handlungsaufforderung am Ende: ein Wort kommentieren, dann meldet sich Stampit. Der Satz steht in der Textzeile mit "role": "cta": Zeile 1 ist der Text über der Blase und endet mit dem Stichwort, alle weiteren Zeilen stehen unter der Blase. Eine Textzeile davor mit "keep": true bleibt als Frage oben stehen.',
  params: {
    bubble: { default: '', doc: 'Wort in der Sprechblase. Leer = das Stichwort aus dem Text (ohne Satzzeichen)' },
    brand: { default: 'Stampit', doc: 'Schriftzug neben dem Logo' },
    logo: { default: true, doc: 'Logo und Schriftzug unten zeigen' }
  },
  captions: { min: 1, roles: ['cta'] },
  anchors: {
    logo: { cap: -1, word: -1, doc: 'Bezugswort für das Logo: es steigt 0,5 s danach auf (Ton: chime), die Stempelreihe pulsiert. Vorgabe: letztes Wort' }
  },
  demo: { captions: [{ lines: ['Klingt interessant?'], accent: 1, keep: true }, { role: 'cta', lines: ['Dann kommentiere jetzt KARTE,{Karte,}', 'und wir melden uns bei dir.'] }], at: { cap: -1, word: -1, offset: 1.6 } },
  css: `
  .bg7 { position: absolute; inset: 0; background: radial-gradient(circle at 50% 44%, #5A4FCF 0%, var(--brand) 40%, var(--night2) 88%); }
  .k1 { left: 0; right: 0; top: 548px; text-align: center; font: 600 64px var(--display); color: #E6E1FF; }
  .k1 span { display: inline-block; margin: 0 .11em; opacity: 0; }
  .bubble { left: 120px; top: 670px; width: 840px; height: 300px; border-radius: 64px; background: #fff; color: var(--brand); display: grid; place-items: center;
    font: 700 216px/1 var(--display); letter-spacing: -.02em; box-shadow: 0 34px 80px rgba(0,0,0,.4); opacity: 0; transform-origin: 20% 100%; white-space: nowrap; }
  .bubble::after { content: ''; position: absolute; left: 120px; bottom: -58px; width: 0; height: 0; border-left: 0 solid transparent; border-right: 74px solid transparent; border-top: 62px solid #fff; }
  .k2 { left: 0; right: 0; top: 1076px; text-align: center; font: 600 56px var(--display); }
  .k2 span { display: inline-block; margin: 0 .11em; opacity: 0; }
  .lock7 { left: 0; right: 0; top: 1290px; display: flex; justify-content: center; align-items: center; gap: 24px; font: 700 76px var(--display); letter-spacing: -.01em; opacity: 0; }
  `,
  build(ctx) {
    const { p, key, rise, cue, el } = ctx, { BACK } = ctx.ease
    const c = ctx.cap('cta'), bi = c.lines[0].length - 1
    ctx.backdrop('<div class="bg7"></div>')
    ctx.html(`
      <div class="abs k1" data-safe="Zeile über der Blase" data-oneline="Zeile über der Blase"></div>
      <div class="abs bubble" data-safe="Sprechblase"></div>
      <div class="abs k2" data-safe="Zeile unter der Blase" data-oneline="Zeile unter der Blase"></div>
      ${p.logo ? `<div class="abs lock7" data-safe="Logo">${ctx.logoSvg(104)}<span></span></div>` : ''}`)
    const bubble = ctx.$('.bubble')
    bubble.textContent = p.bubble || c.words[bi].replace(PUNCT, '')
    ctx.fit(bubble, 740, 90)
    const word = (box, k) => { const sp = el('span'); sp.textContent = c.words[k]; box.append(sp); rise(sp, c.t[k] - 0.03, 0.25, 18) }
    for (let k = 0; k < bi; k++) word(ctx.$('.k1'), k)
    key(bubble, [[c.t[bi] - 0.05, { opacity: 0, scale: 0.3, rotate: '-8deg' }, BACK], [c.t[bi] + 0.5, { opacity: 1, scale: 1, rotate: '0deg' }]])
    cue(c.t[bi], 'pop', 1, 0.6)
    for (let k = bi + 1; k < c.words.length; k++) word(ctx.$('.k2'), k)
    // Lange Saetze: Schrift verkleinern, statt in die Blase oder ins Logo zu laufen
    for (const sel of ['.k1', '.k2']) ctx.fit(sel, 880, 34)

    const tl = ctx.at('logo')
    if (p.logo) {
      ctx.$('.lock7 span').textContent = p.brand
      rise('.lock7', tl + 0.5, 0.6)
      cue(tl + 0.55, 'chime', 0.7)
    }
    // volle Stempelreihe pulsiert zum Schluss
    ctx.progressPulse(tl + 0.6)
  }
}
