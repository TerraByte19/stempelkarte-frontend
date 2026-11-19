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
    logo: { default: true, doc: 'Logo und Schriftzug unten zeigen' },
    // tones (seit 20.11.2026, Nachbau Fassung 3): im Vorbild klingt beim Schlussbild nur ein dumpfer Stoss, den das Skript
    // aus der Bibliothek setzt; der eigene "pop" auf dem Stichwort war ein weiterer Effekt. Vorgabe true wie bisher.
    tones: { default: true, doc: 'Eigene Töne (pop auf dem Stichwort, chime am Logo). false, wenn das Skript Klänge aus der Bibliothek setzt' },
    look: { default: 'standard', doc: '"standard" (lila Grund, Stichwort in der weißen Sprechblase) oder "partikel" (wie im Vorbild "zwei Cafés": schwarzer Grund voller kleiner leuchtender Personen-Symbole, die langsam treiben, darüber klein die Zeile über der Blase, das Stichwort riesig und weiß mit blauem Schein, darunter klein der Rest). "partikel" malt seinen Grund selbst und kann deshalb auch als Teil mit "enter": "kreuz" über das letzte Bild blenden' }
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
  /* "partikel" (Fassung 2 des Nachbaus, gemessen am Vorbild: kleines Wort bei y 740, Stichwort rund 200 px mit Mitte
     bei 955, kleiner Satz bei 1140; Partikel weiss mit blauem Schein #2442D8 auf Schwarz) */
  .pk-bg { position: absolute; inset: 0; background: radial-gradient(ellipse 70% 45% at 50% 50%, #000 0%, #020309 60%, #04050C 100%); }
  .pk-cv { position: absolute; left: 0; top: 0; width: 1080px; height: 1920px; }
  .pk1 { left: 0; right: 0; top: 708px; text-align: center; font: 500 50px var(--body); color: #8AA2FC; }
  .pk1 span, .pk2 span { display: inline-block; margin: 0 .11em; opacity: 0; }
  .pkw { left: 0; right: 0; top: 800px; text-align: center; font: 700 236px/1 var(--body); letter-spacing: -.01em; color: #FFFFFF; opacity: 0; white-space: nowrap;
    text-shadow: 0 0 30px rgba(60,100,255,.95), 0 0 70px rgba(40,80,255,.7), 0 0 140px rgba(30,60,230,.5); }
  .pk2 { left: 0; right: 0; top: 1110px; text-align: center; font: 500 46px var(--body); color: #FFFFFF; }
  .lock7 { left: 0; right: 0; top: 1290px; display: flex; justify-content: center; align-items: center; gap: 24px; font: 700 76px var(--display); letter-spacing: -.01em; opacity: 0; }
  `,
  async build(ctx) {
    const { p, key, rise, cue, el } = ctx, { BACK } = ctx.ease
    const c = ctx.cap('cta'), bi = c.lines[0].length - 1
    if (!['standard', 'partikel'].includes(p.look)) ctx.fail('"look" muss "standard" oder "partikel" sein')
    if (p.look === 'partikel') return partikel(ctx, c, bi)
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
    if (p.tones) cue(c.t[bi], 'pop', 1, 0.6)
    for (let k = bi + 1; k < c.words.length; k++) word(ctx.$('.k2'), k)
    // Lange Saetze: Schrift verkleinern, statt in die Blase oder ins Logo zu laufen
    for (const sel of ['.k1', '.k2']) ctx.fit(sel, 880, 34)

    const tl = ctx.at('logo')
    if (p.logo) {
      ctx.$('.lock7 span').textContent = p.brand
      rise('.lock7', tl + 0.5, 0.6)
      if (p.tones) cue(tl + 0.55, 'chime', 0.7)
    }
    // volle Stempelreihe pulsiert zum Schluss
    ctx.progressPulse(tl + 0.6)
  }
}

// ================================================================================================ "partikel"
// Schlussbild wie im Vorbild "zwei Cafés" (Fassung 2 des Nachbaus, 19.11.2026): ein Feld aus kleinen leuchtenden
// Personen-Symbolen (eine Menge Kunden) treibt langsam, in der Mitte dunkler; darueber das Stichwort riesig. Warum
// eine eigene Fassung: der Betreiber sah in unserem lila Schlussbild mit Sprechblase "unsere Videos von vorher".
// Gezeichnet in eine 2D-Leinwand je Bild (ctx.frame): rund 900 Kopien eines einmal gemalten Symbols, Lage nur aus
// t und festem Zufall (mulberry32 aus kit3d), also jedes Bild gleich, egal in welcher Reihenfolge gerechnet wird.
async function partikel(ctx, c, bi) {
  const { p, key, rise, cue, el } = ctx, { BACK, OUT } = ctx.ease
  const { rng } = await import('../engine/kit3d.js')
  ctx.html(`<div class="pk-bg"></div><canvas class="pk-cv" width="1080" height="1920"></canvas>
    <div class="abs pk1" data-safe="Zeile über dem Stichwort" data-oneline="Zeile über dem Stichwort"></div>
    <div class="abs pkw" data-safe="Stichwort"></div>
    <div class="abs pk2" data-safe="Zeile unter dem Stichwort" data-oneline="Zeile unter dem Stichwort"></div>
    ${p.logo ? `<div class="abs lock7" data-safe="Logo">${ctx.logoSvg(104)}<span></span></div>` : ''}`)
  const word = ctx.$('.pkw')
  word.textContent = p.bubble || c.words[bi].replace(PUNCT, '')
  ctx.fit(word, 900, 120)
  const put = (box, k) => { const sp = el('span'); sp.textContent = c.words[k]; box.append(sp); rise(sp, c.t[k] - 0.03, 0.25, 14) }
  for (let k = 0; k < bi; k++) put(ctx.$('.pk1'), k)
  for (let k = bi + 1; k < c.words.length; k++) put(ctx.$('.pk2'), k)
  for (const sel of ['.pk1', '.pk2']) ctx.fit(sel, 880, 30)
  key(word, [[c.t[bi] - 0.06, { opacity: 0, scale: 0.86 }, BACK], [c.t[bi] + 0.4, { opacity: 1, scale: 1 }]])
  if (p.tones) cue(c.t[bi], 'pop', 0.8, 0.7)
  const tl = ctx.at('logo')
  if (p.logo) { ctx.$('.lock7 span').textContent = p.brand; rise('.lock7', tl + 0.5, 0.6); if (p.tones) cue(tl + 0.55, 'chime', 0.7) }
  // Symbol einmal malen: Kopf und Schultern, kleiner weisser Kern, kraeftig blauer Schein #2442D8 wie im Vorbild (Review Fassung 3,
  // Runde 1: unser Feld war weisser und flacher; Kern vorher 3,2 px, Schein heller und blasser)
  const S = 40, spr = document.createElement('canvas'); spr.width = spr.height = S
  { const g = spr.getContext('2d'); g.shadowColor = 'rgba(36,66,216,1)'; g.shadowBlur = 10; g.fillStyle = '#3A5CF0'
    for (let i = 0; i < 2; i++) { g.beginPath(); g.arc(S / 2, 14, 5, 0, Math.PI * 2); g.fill(); g.beginPath(); g.ellipse(S / 2, 28, 9, 6, 0, Math.PI, 0); g.fill() }
    g.shadowBlur = 0; g.fillStyle = '#E8EEFF'; g.beginPath(); g.arc(S / 2, 14, 2.2, 0, Math.PI * 2); g.fill(); g.beginPath(); g.ellipse(S / 2, 28, 4.6, 2.9, 0, Math.PI, 0); g.fill() }
  const R = rng(20261119), N = 1300, pts = []
  for (let i = 0; i < N; i++) pts.push({ x: R() * 1180 - 50, y: R() * 2020 - 50, z: 0.6 + R() * 0.9, vx: (R() - 0.5) * 14, vy: -6 - R() * 12, tw: R() * 6.28 })
  const cv = ctx.$('.pk-cv'), g = cv.getContext('2d'), s0 = ctx.s
  // Erscheinen: das Feld zieht sich in 0,8 s von leicht vergroessert zusammen (die Stadt "loest sich auf")
  // Review Fassung 3, Runde 2: das Feld war in der Mitte halb so hell wie im Vorbild (Band y 0,25 bis 0,62: Helligkeit 6 bis 7 gegen 13
  // bis 15), unten zu hell (26 gegen 16), die Symbole halb so gross und zur Mitte hin stark verkleinert (wie eine Ebene mit Horizont);
  // im Vorbild ein flacher Schwarm gleich grosser, heller Figuren. Und es war erst gegen 35,2 s voll da (im Vorbild 34,3 s). Deshalb:
  // groesser (1,05- bis 1,5-fach statt 0,5- bis 1,4-fach), in der Mitte nur wenig dunkler, oben (bis rund 25 % der Hoehe) weiter
  // schwarz, unten etwas zurueckgenommen, und das Zusammenziehen beim Erscheinen in 0,35 s statt 0,8 s.
  ctx.frame(t => {
    const u = Math.max(0, t - s0), grow = 1 + 0.25 * Math.max(0, 1 - u / 0.35) ** 2
    g.clearRect(0, 0, 1080, 1920)
    for (const q of pts) {
      let x = q.x + q.vx * u, y = q.y + q.vy * u
      x = ((x + 50) % 1180 + 1180) % 1180 - 50; y = ((y + 50) % 2020 + 2020) % 2020 - 50
      x = 540 + (x - 540) * grow; y = 960 + (y - 960) * grow
      const d = Math.hypot((x - 540) / 520, (y - 950) / 330), a = Math.min(1, 0.55 + 0.45 * Math.min(1, Math.max(0, (d - 0.6) / 0.6)))
      const yy = Math.min(1, Math.max(0, y / 1920)), top = Math.min(1, Math.max(0, (yy - 0.14) / 0.12))
      const low = 1 - 0.6 * Math.min(1, Math.max(0, (yy - 0.72) / 0.22))
      g.globalAlpha = 0.9 * a * top * top * low * (0.75 + 0.25 * Math.sin(q.tw + u * 1.6)); const sz = S * q.z * (1.05 + 0.45 * yy)
      g.drawImage(spr, x - sz / 2, y - sz / 2, sz, sz)
    }
    g.globalAlpha = 1
  })
}
