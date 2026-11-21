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
    look: { default: 'standard', doc: '"standard" (lila Grund, Stichwort in der weißen Sprechblase) oder "partikel" (wie im Vorbild "zwei Cafés": schwarzer Grund voller kleiner leuchtender Personen-Symbole, die langsam treiben, darüber klein die Zeile über der Blase, das Stichwort riesig und weiß mit blauem Schein, darunter klein der Rest). "partikel" malt seinen Grund selbst und kann deshalb auch als Teil mit "enter": "kreuz" über das letzte Bild blenden' },
    // figur (seit 20.11.2026, Nachbau "zwei Cafés": der Betreiber wollte im Schlussbild "anstatt so viele Figuren mein Logo sehr oft").
    // Vorgabe "person", damit jedes aeltere Schlussbild mit "partikel" Pixel fuer Pixel bleibt, wie es war.
    figur: { default: 'person', doc: 'Nur "look": "partikel": was im Feld treibt. "person" (Vorgabe: kleine leuchtende Personen-Symbole wie im Vorbild) oder "logo" (das App-Symbol von Stampit, lila Kachel mit weißem Stempel genau wie in Logo.jsx, viele Male zwischen 54 und 84 px mit leichtem Schein, nie übereinander)' }
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
  .pk-bg { position: absolute; inset: 0; background: radial-gradient(ellipse 70% 45% at 50% 50%, #000 0%, #010206 60%, #010104 100%); }
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
    if (!['person', 'logo'].includes(p.figur)) ctx.fail('"figur" muss "person" oder "logo" sein')
    // Ohne Feld gaebe es nichts, was treibt: still ignoriert haette der Schalter so getan, als wirke er
    if (p.figur !== 'person' && p.look !== 'partikel') ctx.fail('"figur" gilt nur mit "look": "partikel"')
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
  // "figur": "logo" hat ein eigenes Feld (logoFeld unten); der Weg mit Personen bleibt darunter unveraendert
  if (p.figur === 'logo') return logoFeld(ctx, rng)
  // Symbol einmal malen. Runde 4 (Review: unsere Symbole lasen sich wie Laternen mit weissem oder beigem Kern und weissem Bogen, 25 bis
  // 30 px, klein und dicht; im Vorbild ein flaches, sattes Blau #2A4BE8 fuer Kopf und Schultern, an einer Seite der Schultern ein kleines
  // helles Quadrat #A8BCFF, weicher blauer Schein, rund 35 bis 40 px mit Schein, alle etwa gleich gross): Kopf und Schultern voll #2E4FF0
  // ohne Kern, Schein 7 px #3050FF, rechts an den Schultern ein helles Quadrat mit eigenem kleinen Schein.
  const S = 48, spr = document.createElement('canvas'); spr.width = spr.height = S
  { const g = spr.getContext('2d')
    const body = () => { g.beginPath(); g.arc(21, 15, 6, 0, Math.PI * 2); g.fill(); g.beginPath(); g.ellipse(23, 36, 11.5, 12, 0, Math.PI, 0); g.closePath(); g.fill() }
    g.shadowColor = 'rgba(48,80,255,1)'; g.shadowBlur = 7; g.fillStyle = '#2E4FF0'; body(); g.shadowBlur = 0; body()
    g.shadowColor = 'rgba(157,178,255,1)'; g.shadowBlur = 4; g.fillStyle = '#B4C6FF'; g.beginPath(); g.roundRect(29.5, 28, 6, 6, 1.5); g.fill() }
  // Runde 4: ein Viertel weniger Symbole (975 statt 1300), alle fast gleich gross (0,9- bis 1,15-fach statt 0,6- bis 1,5-fach)
  const R = rng(20261119), N = 975, pts = []
  for (let i = 0; i < N; i++) pts.push({ x: R() * 1180 - 50, y: R() * 2020 - 50, z: 0.9 + R() * 0.25, vx: (R() - 0.5) * 14, vy: -6 - R() * 12, tw: R() * 6.28, k: R() })
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
      // Review Fassung 3, Runde 3: im Vorbild ein knackiges Feld mit weissen Kernen (unten 99. Perzentil 193 gegen 124 bei uns), die Mitte
      // heller (Band 0,5 bis 0,7: 42 bis 47 gegen 22 bis 35), oben ab rund 10 % schon vereinzelte, schwache Figuren und der Grund fast
      // schwarz. Deshalb groesserer weisser Kern, voller Deckungsgrad, Mitte weniger zurueckgenommen, oben ab 9 % langsam einblenden (bis
      // 35 % voll; mit 14 bis 26 % stand dort eine harte Kante, mit 8 bis 18 % war das Band 0,1 bis 0,35 doppelt so hell wie im Vorbild).
      const d = Math.hypot((x - 540) / 520, (y - 950) / 330), a = Math.min(1, 0.85 + 0.15 * Math.min(1, Math.max(0, (d - 0.6) / 0.6)))
      const yy = Math.min(1, Math.max(0, y / 1920)), top = Math.min(1, Math.max(0, (yy - 0.09) / 0.26))
      const low = 1 - 0.5 * Math.min(1, Math.max(0, (yy - 0.72) / 0.22))
      // Runde 4: hinter dem Stichwort (Mitte y 955) duenner wie im Vorbild: bis 0,15 der Bildhoehe darueber und darunter faellt bis zur
      // Haelfte der Symbole weg (fest je Symbol, q.k)
      const near = Math.max(0, 1 - Math.abs(y - 955) / 288)
      if (q.k < 0.5 * near) continue
      g.globalAlpha = a * top * top * low * (0.8 + 0.2 * Math.sin(q.tw + u * 1.6)); const sz = S * q.z * (1.0 + 0.2 * yy)
      g.drawImage(spr, x - sz / 2, y - sz / 2, sz, sz)
    }
    g.globalAlpha = 1
  })
}

// ================================================================================================ "partikel" mit "figur": "logo"
// Seit dem 20.11.2026 (Nachbau "zwei Cafés"): der Betreiber wollte im Schlussbild statt der vielen Figuren "mein Logo sehr oft".
// Was hier festgelegt ist und warum:
// - Das echte App-Symbol, nicht nachgezeichnet: ctx.logoSvg (engine/brand.js, dieselben Formen wie src/components/Logo.jsx und
//   public/favicon.svg) mit Kachel #3C3489 und weissem Stempel, einmal gross (192 px) in ein Bild gerechnet und je Kachel verkleinert.
// - 54 bis 84 px je Kachel: auf dem Handy rund 20 bis 30 pt, der Stempel bleibt als Stempel erkennbar. In der Groesse der
//   Personen-Symbole (rund 48 px, fast 1000 Stueck) waere das Logo nur ein lila Punkt in einem Teppich.
// - Leichter blauer Schein um die Kachel: das dunkle Lila #3C3489 allein geht auf dem fast schwarzen Grund unter.
// - Nie uebereinander: jede Kachel haelt zu jeder anderen ueber die GANZE Dauer des Teils Abstand (geprueft beim Setzen, siehe
//   unten). Zwei halb verdeckte Logos saehen nach einem Fehler aus, nicht nach "sehr oft".
// - Treiben wie die Figuren (langsam nach oben, leicht seitlich; grosse etwas schneller, als laegen sie naeher), ohne Umlauf am Rand:
//   unter dem Bild liegen genug Kacheln, die nachruecken. Ein Umlauf haette die Abstandsregel an der Naht gebrochen.
// - Hinter den drei Zeilen (y rund 705 bis 1165) dunkler und duenner, oben bis 6 % schwarz und bis 18 % eingeblendet, sonst ueberall
//   kraeftig: das Logo soll das ganze Bild fuellen, nicht nur die untere Haelfte.
// - Seitlich nie angeschnitten (siehe Setzen).
// - Lage und Deckkraft nur aus t und festem Zufall: jedes Bild gleich, egal in welcher Reihenfolge gerechnet.
async function logoFeld(ctx, rng) {
  const T = 192, PAD = 56, S = T + 2 * PAD
  const img = new Image()
  // ohne xmlns laesst sich ein SVG nicht als Bild laden ("cannot be decoded"); logoSvg ist fuer HTML gebaut
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(ctx.logoSvg(T, ctx.B.brand, '#FFFFFF').replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" '))
  await img.decode()
  const spr = document.createElement('canvas'); spr.width = spr.height = S
  { const g = spr.getContext('2d')
    // Schein: die Kachel (Ecken wie im Logo, rx 6 von 24) wirft ihn, weit und eng; das Logo liegt danach genau darueber
    g.fillStyle = ctx.B.brand
    for (const [blur, c] of [[46, 'rgba(64,84,255,0.85)'], [14, 'rgba(120,130,255,0.9)']]) { g.shadowColor = c; g.shadowBlur = blur; g.beginPath(); g.roundRect(PAD, PAD, T, T, T / 4); g.fill() }
    g.shadowBlur = 0; g.shadowColor = 'rgba(0,0,0,0)'
    g.drawImage(img, PAD, PAD, T, T) }
  const s0 = ctx.s, U = Math.max(1, ctx.e - s0) + 0.3
  // Kacheln setzen: Zufallsorte, angenommen nur mit Abstand zu allen bisherigen ueber die ganze Dauer (geprueft alle 0,2 s; in 0,2 s
  // ruecken zwei Kacheln hoechstens rund 2 px gegeneinander). Abstand wie zwischen Quadraten gemessen: in x ODER y mindestens die
  // halben Breiten beider (gedreht etwas breiter) plus GAP. Mit einem Kreis um jede Kachel lagen sie weiter auseinander als noetig.
  const R = rng(20261120), pts = [], VMAX = 16, H = 1920 + 140 + VMAX * U, GAP = 18
  const half = q => q.s / 2 * (Math.cos(q.rot) + Math.abs(Math.sin(q.rot)))
  const clear = (a, b) => {
    const need = half(a) + half(b) + GAP, vx = b.vx - a.vx, vy = b.vy - a.vy
    if (Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y)) > need + Math.hypot(vx, vy) * U) return true
    for (let u = 0; u <= U + 1e-9; u += 0.2) if (Math.max(Math.abs(b.x - a.x + vx * u), Math.abs(b.y - a.y + vy * u)) < need) return false
    return true
  }
  // Seitlich ganz im Bild, auch nach dem Treiben: am Rand halb abgeschnittene Logos sahen unordentlich aus (Pruefung Runde 5); bei
  // den Personen fiel das nicht auf, beim eigenen Logo schon. Nur unten herein und oben hinaus duerfen sie angeschnitten sein.
  for (let i = 0; i < 30000; i++) {
    const s = 54 + R() * 30, vx = (R() - 0.5) * 8, m = s / 2 + 10
    const lo = m + Math.max(0, -vx * U), hi = 1080 - m - Math.max(0, vx * U)
    const q = { x: lo + R() * (hi - lo), y: R() * H - 70, s, vx, vy: -(9 + 5 * R()) * s / 70, rot: (R() - 0.5) * 0.2, tw: R() * 6.28, k: R() }
    if (pts.every(o => clear(o, q))) pts.push(q)
  }
  const cv = ctx.$('.pk-cv'), g = cv.getContext('2d')
  g.imageSmoothingQuality = 'high'
  // Nur fuer tools/test_3d_nachbau_v3.mjs: wie viele Kacheln gesetzt sind und wo sie im zuletzt gemalten Bild lagen [x, y, Seite]
  const dbg = { figur: 'logo', placed: pts.length, last: [] }
  cv.logoDebug = dbg
  ctx.frame(t => {
    const u = Math.max(0, t - s0), grow = 1 + 0.25 * Math.max(0, 1 - u / 0.35) ** 2
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, 1080, 1920)
    dbg.last = []
    for (const q of pts) {
      let x = q.x + q.vx * u, y = q.y + q.vy * u
      // Erscheinen wie beim Feld mit Personen: in 0,35 s von leicht auseinander zusammenziehen (die Stadt "loest sich auf")
      x = 540 + (x - 540) * grow; y = 960 + (y - 960) * grow
      if (x < -q.s || x > 1080 + q.s || y < -q.s || y > 1920 + q.s) continue
      // Oben nur ein schmaler Saum (6 bis 18 %, gerade statt quadratisch) und unten kaum zurueckgenommen. Vorher (Saum bis 35 %
      // quadratisch, dazu ein breites Band) erreichte ueber y 1357 keine Kachel mehr als rund 45 % Deckkraft: oben nur graue
      // Geister, das Feld las sich als "Logos steigen von unten", nicht als "mein Logo sehr oft" (Pruefung Runde 5).
      const yy = Math.min(1, Math.max(0, y / 1920)), top = Math.min(1, Math.max(0, (yy - 0.06) / 0.12))
      const low = 1 - 0.2 * Math.min(1, Math.max(0, (yy - 0.72) / 0.22))
      // Zeilen in der Mitte (Kommentiere ab y 708, Stichwort 800 bis 1036, "und wir melden uns." bis 1160): bis 230 px um y 935 ganz
      // im dunklen Band (zwei Drittel der Kacheln fallen weg, der Rest auf 18 %), in 110 px weich zurueck auf voll. Das Band liegt
      // eng um die Zeilen, damit es nicht wie vorher fast das halbe Bild abdunkelt.
      const band = 1 - Math.min(1, Math.max(0, (Math.abs(y - 935) - 230) / 110)), sb = band * band * (3 - 2 * band)
      if (q.k < 0.66 * sb) continue
      const a = top * low * (1 - 0.82 * sb) * (0.88 + 0.12 * Math.sin(q.tw + u * 1.4))
      if (a < 0.01) continue
      const k = q.s / T, c = Math.cos(q.rot), sn = Math.sin(q.rot)
      g.globalAlpha = a
      g.setTransform(c * k, sn * k, -sn * k, c * k, x, y)
      g.drawImage(spr, -S / 2, -S / 2)
      dbg.last.push([+x.toFixed(1), +y.toFixed(1), +q.s.toFixed(1)])
    }
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1
  })
}
