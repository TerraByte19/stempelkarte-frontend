// Beispielrechnung: erst eine Muenze, dann eine Tafel, deren Zeilen im Takt
// der Stimme erscheinen, am Ende das grosse Ergebnis.
//
// Die Tafel rechnet nach: das Produkt der Zeilen muss das Ergebnis ergeben.
// Ein Video mit einer falschen Zahl waere der teuerste Fehler, den dieser
// Baustein machen kann - deshalb bricht der Bau dann ab.

// "2,50 €" -> 2.5, "× 50" -> 50, "= 6.500 €" -> 6500 (deutsche Schreibweise)
export function germanNumber(text) {
  const m = /-?\d[\d.]*(?:,\d+)?/.exec(String(text))
  if (!m) return null
  const n = Number(m[0].replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

// Wort im Skript, auf dem jede Zeile erscheint (Vorgabe wie im ersten Video)
const ROW_ANCHORS = [{ cap: 1, word: 1 }, { cap: 2, word: 1 }, { cap: 2, word: 4 }, { cap: 3, word: 0, offset: -0.45 }, { cap: 3, word: 1 }]

export default {
  title: 'Beispielrechnung',
  use: 'Macht aus dem Versprechen eine Zahl: wenige Zeilen, ein großes Ergebnis.',
  params: {
    rows: {
      default: [
        { big: '2,50 €', label: 'bleiben pro Kaffee', small: '3,50 € − 1,00 €' },
        { big: '× 50', label: 'Stammkunden' },
        { big: '× 1', label: 'Besuch mehr pro Woche' },
        { big: '× 52', label: 'Wochen' }
      ],
      doc: 'Zeilen der Rechnung, 2 bis 5. Je Zeile: big (Zahl links, höchstens 6 Zeichen), label (Text rechts), small (optionale kleine Herleitung)'
    },
    result: { default: { big: '= 6.500 €', label: 'mehr im Jahr' }, doc: 'Ergebnis: big (große Zahl, höchstens 9 Zeichen) und label (Zeile darunter)' },
    coin: { default: '€', doc: 'Zeichen auf der Münze, die vor der Tafel erscheint. Leer lassen ("") für keine Münze' },
    check: { default: true, doc: 'Nachrechnen: Produkt aller big-Zahlen der Zeilen muss die Zahl in result.big ergeben. Nur auf false setzen, wenn die Tafel keine Multiplikation zeigt' },
    gone: { default: false, doc: 'Das Ergebnis wird auf den Anker "gone" durchgestrichen und fliegt mit ein paar Münzen davon (für "Weg."). Ohne: Tafel wie bisher' }
  },
  captions: { min: 2 },
  anchors: p => {
    const a = {}
    if (p.coin) a.coin = { cap: 0, word: 0, doc: 'Die Münze springt auf (Ton: pop)' }
    a.panel = { cap: 1, word: 0, doc: 'Die Münze weicht, die Tafel erscheint. Erstes Wort des Satzes, der die Rechnung beginnt' }
    p.rows.forEach((r, i) => { a['row' + (i + 1)] = { ...(ROW_ANCHORS[i] || { cap: -1, word: 0 }), doc: `Zeile ${i + 1} ("${r.big}") erscheint (Ton: tick). Auf das Wort legen, das diese Zahl nennt` } })
    a.result = { cap: 3, word: 2, doc: 'Das Ergebnis springt auf (Ton: kaching). Auf die gesprochene Ergebniszahl' }
    // Nur auf Wunsch: ein Anker mehr im Bericht jedes alten Videos waere eine Aenderung ohne Grund
    if (p.gone) a.gone = { cap: -1, word: 0, doc: 'Das Ergebnis wird durchgestrichen und fliegt mit Münzen davon (Ton: drop). Auf "Weg."' }
    return a
  },
  demo: { captions: [{ lines: ['Und das lohnt sich!'], accent: 99 }, { lines: ['Bleiben dir pro Kaffee', 'zwei Euro fünfzig,'], accent: 4 }, { lines: ['und fünfzig', 'Stammkunden kommen', 'einmal mehr pro Woche,'], accent: 3 }, { lines: ['sind das 6.500 Euro', 'mehr im Jahr.'], accent: 2 }] },
  css: `
  .calc { left: 90px; top: 640px; width: 900px; padding: 30px 52px 44px; border-radius: 40px; background: rgba(255,255,255,.06); border: 1.5px solid rgba(185,176,255,.3); }
  .crow { display: flex; align-items: center; gap: 30px; height: 116px; border-bottom: 1.5px solid rgba(255,255,255,.12); opacity: 0; }
  .crow b { flex: none; width: 270px; font: 700 64px var(--display); letter-spacing: -.02em; white-space: nowrap; }
  .crow span { font: 500 40px/1.2 var(--body); opacity: .9; }
  .crow span small { display: block; font-size: 27px; opacity: .65; }
  .cres { padding-top: 34px; text-align: center; opacity: 0; }
  .cres b { display: block; font: 700 156px/1.05 var(--display); color: var(--lilac); letter-spacing: -.03em; text-shadow: 0 0 70px rgba(142,130,245,.65); white-space: nowrap; }
  .cres span { font: 600 48px var(--display); }
  .cgone { position: absolute; left: 60px; right: 60px; top: 104px; height: 18px; border-radius: 9px; background: #FF6B8B; scale: 0 1; transform-origin: 0 50%; rotate: -6deg; box-shadow: 0 0 0 5px rgba(14,10,36,.5); }
  .ccoin { position: absolute; left: 50%; top: 90px; width: 64px; height: 64px; margin-left: -32px; border-radius: 50%; background: var(--lilac); color: var(--brand); opacity: 0;
    display: grid; place-items: center; font: 700 40px var(--display); box-shadow: 0 0 30px rgba(142,130,245,.6); }
  .coin { left: 390px; top: 810px; width: 300px; height: 300px; border-radius: 50%; background: var(--lilac); color: var(--brand); opacity: 0;
    display: grid; place-items: center; font: 700 190px var(--display); box-shadow: 0 0 110px rgba(142,130,245,.7); }
  `,
  build(ctx) {
    const { p, key, loop, rise, cue, el } = ctx, { BACK, OUT, IN } = ctx.ease
    if (!Array.isArray(p.rows) || p.rows.length < 2 || p.rows.length > 5) ctx.fail('"rows" braucht 2 bis 5 Zeilen, mehr passen nicht zwischen Text und untere Sperrzone')
    if (!p.result || !p.result.big) ctx.fail('"result" braucht mindestens "big"')
    if (p.check) {
      const nums = p.rows.map(r => germanNumber(r.big)), res = germanNumber(p.result.big)
      if (nums.includes(null) || res == null) ctx.fail(`Rechnung lässt sich nicht nachprüfen: in ${JSON.stringify([...p.rows.map(r => r.big), p.result.big])} fehlt eine Zahl. Zahlen ergänzen oder "check": false setzen`)
      const prod = nums.reduce((a, b) => a * b, 1)
      if (Math.abs(prod - res) > 0.005) ctx.fail(`Rechnung geht nicht auf: ${nums.join(' × ')} = ${+prod.toFixed(2)}, im Ergebnis steht aber ${res} ("${p.result.big}")`)
    }
    ctx.html(`${p.coin ? '<div class="abs coin" data-safe="Münze"></div>' : ''}<div class="abs calc" data-safe="Rechentafel"></div>`)
    const calc = ctx.$('.calc')
    // Vier Zeilen sitzen wie im ersten Video. Eine fuenfte braucht Platz nach oben, sonst ragt das Ergebnis in die untere Sperrzone.
    if (p.rows.length > 4) calc.style.top = 640 - (p.rows.length - 4) * 96 + 'px'
    const rows = p.rows.map(r => {
      const row = el('div', 'crow'), b = el('b'), sp = el('span')
      b.textContent = r.big; sp.textContent = r.label || ''
      if (r.small) { const sm = el('small'); sm.textContent = r.small; sp.append(sm) }
      row.append(b, sp); calc.append(row)
      return row
    })
    const cres = el('div', 'cres'), rb = el('b'), rs = el('span')
    rb.textContent = p.result.big; rs.textContent = p.result.label || ''; cres.append(rb, rs); calc.append(cres)
    ctx.fit(rb, 796, 80)
    rows.forEach(row => ctx.fit(row.firstChild, 270, 36))

    rows.forEach((row, i) => { const t = ctx.at('row' + (i + 1)); rise(row, t - 0.05, 0.45, 30); cue(t, 'tick', 0.8) })
    // erst die Muenze, dann macht sie der Rechnung Platz
    const t1 = ctx.at('panel') - 0.15
    if (p.coin) {
      const coin = ctx.$('.coin'); coin.textContent = p.coin
      const t0 = ctx.at('coin') + 0.05
      key(coin, [[t0, { opacity: 0, scale: 0.3 }, BACK], [t0 + 0.45, { opacity: 1, scale: 1 }], [t1, { opacity: 1, scale: 1 }, IN], [t1 + 0.3, { opacity: 0, scale: 0.4 }]])
      cue(t0, 'pop', 0.9, 0.75)
    }
    key(calc, [[t1 + 0.1, { opacity: 0, translate: '0px 40px' }, OUT], [t1 + 0.55, { opacity: 1, translate: '0px 0px' }]])
    const tr = ctx.at('result')
    key(cres, [[tr - 0.05, { opacity: 0, scale: 0.7 }, BACK], [tr + 0.5, { opacity: 1, scale: 1 }]])
    loop(rb, [{ scale: 1 }, { scale: 1.03 }, { scale: 1 }], 1.8)
    cue(tr, 'kaching')
    // "Weg.": Strich durch das Ergebnis, dann fliegt es samt ein paar Muenzen nach oben aus dem Bild
    if (p.gone) {
      const tg = ctx.at('gone')
      if (!(tg > tr + 0.2)) ctx.fail('Anker "gone" muss mindestens 0,2 s nach "result" liegen')
      // Strich und Muenzen sitzen am Ergebnis; nur hier wird es dafuer zum Bezugsrahmen (alte Videos: unveraendert)
      cres.style.position = 'relative'
      const strike = el('i', 'cgone'); cres.append(strike)
      key(strike, [[tg - 0.02, { scale: '0 1' }, OUT], [tg + 0.16, { scale: '1 1' }]])
      key(cres, [[tr - 0.05, { opacity: 0, scale: 0.7 }, BACK], [tr + 0.5, { opacity: 1, scale: 1, translate: '0px 0px', rotate: '0deg' }], [tg + 0.28, { opacity: 1, scale: 1, translate: '0px 0px', rotate: '0deg' }, IN], [tg + 0.8, { opacity: 0, scale: 0.6, translate: '160px -420px', rotate: '14deg' }]])
      const DIRS = [[-300, -260], [-170, -380], [-40, -440], [110, -400], [250, -300], [330, -180]]
      DIRS.forEach(([dx, dy], i) => {
        const c = el('div', 'ccoin'); c.textContent = '€'; cres.parentNode.append(c)
        c.style.top = (cres.offsetTop + 90) + 'px'
        const t = tg + 0.1 + i * 0.03
        key(c, [[t, { opacity: 0, translate: '0px 0px', rotate: '0deg' }, OUT], [t + 0.08, { opacity: 1, translate: `${dx * 0.2}px ${dy * 0.2}px`, rotate: '0deg' }], [t + 0.7, { opacity: 0, translate: `${dx}px ${dy}px`, rotate: `${(i % 2 ? 1 : -1) * 200}deg` }]])
      })
      cue(tg + 0.1, 'drop', 0.5)
    }
  }
}
