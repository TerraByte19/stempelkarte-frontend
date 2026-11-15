// Becherreihe auf der Theke: bezahlte Becher, dann der Gratis-Becher mit
// Preisschild ("kostet dich vielleicht einen Euro"), danach rueckt die Reihe
// weiter und neue Becher kommen dazu ("und der Kunde kommt wieder").
export default {
  title: 'Becherreihe mit Preisschild',
  use: 'Erklärt, warum sich die Belohnung rechnet: der Gratis-Becher kostet wenig, die Besuche danach bringen mehr.',
  params: {
    paid: { default: 5, doc: 'Bezahlte Becher vor dem Gratis-Becher, 2 bis 5' },
    extra: { default: 3, doc: 'Becher, die nach dem Gratis-Becher dazukommen (Wiederkommen), 0 bis 4' },
    freeLabel: { default: 'GRATIS', doc: 'Aufschrift auf dem Gratis-Becher (höchstens 7 Buchstaben)' },
    price: { default: '1 €', doc: 'Text auf dem Preisschild (kurz, etwa 4 Zeichen)' },
    whoosh: { default: 0.2, doc: 'Lautstärke des Wisch-Tons, wenn die Reihe weiterrückt (0 bis 1, 0 = aus). Die Vorgabe ist bewusst leise' }
  },
  captions: { min: 1 },
  anchors: {
    free: { at: 'start', offset: 0.25, doc: 'Der Gratis-Becher fällt in die Reihe (Ton: pop)' },
    tag: { cap: 0, word: 4, doc: 'Das Preisschild springt auf (Ton: pop). Auf das Wort mit dem Preis legen' },
    more: { cap: 1, word: 3, doc: 'Die Reihe rückt weiter, neue Becher kommen (Töne: whoosh, pop je Becher). Auf "wiederkommst" o. ä.' }
  },
  demo: { captions: [{ lines: ['Weil der Gratis-Kaffee', 'vielleicht einen', 'Euro kostet.'], accent: 3 }, { lines: ['Und du dafür', 'wiederkommst.'], accent: 3 }] },
  css: `
  .tcup { position: absolute; bottom: 624px; }
  .tcup svg { display: block; width: 100%; }
  .tnum { position: absolute; top: 1326px; text-align: center; font: 600 32px var(--body); color: rgba(255,255,255,.4); }
  .tag { position: absolute; top: 1010px; width: 176px; height: 96px; border-radius: 16px; background: linear-gradient(160deg, #FBF6EC, #EBE2D0);
    color: var(--ink); font: 700 54px/96px var(--display); text-align: center; padding-left: 18px; transform-origin: 14px 14px; rotate: 9deg;
    box-shadow: 0 16px 30px rgba(0,0,0,.45); white-space: nowrap; }
  .tag::before { content: ''; position: absolute; left: 14px; top: 38px; width: 18px; height: 18px; border-radius: 50%; background: var(--night2); }
  `,
  build(ctx) {
    const { p, key, loop, cue, el } = ctx, { BACK, OUT } = ctx.ease
    if (!Number.isInteger(p.paid) || p.paid < 2 || p.paid > 5) ctx.fail('"paid" muss zwischen 2 und 5 liegen, mehr Becher passen nicht ins Bild')
    if (!Number.isInteger(p.extra) || p.extra < 0 || p.extra > 4) ctx.fail('"extra" muss zwischen 0 und 4 liegen')
    if (!(p.whoosh >= 0 && p.whoosh <= 1)) ctx.fail('"whoosh" muss zwischen 0 und 1 liegen')
    ctx.html(`
      <div class="abs glow" style="left:380px;top:740px;width:860px;height:860px"></div>
      <div class="abs counter" style="top:1290px"></div>
      <div class="abs row" style="inset:0"></div>`)
    const row = ctx.$('.row')
    const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))
    // Pappbecher mit Deckel und Manschette. Die Zahlen mit drei Nachkommastellen stammen so aus dem ersten Video.
    const togo = (body, lid, sleeve, label) => `<svg viewBox="0 0 100 140"><path fill="${body}" d="M14 18 H86 L78 134 Q77.500 140 71 140 H29 Q22.500 140 22 134 Z"/><path fill="${sleeve}" d="M17.500 58 H82.500 L79.200 102 H20.800 Z"/><rect x="7" y="0" width="86" height="18" rx="7" fill="${lid}"/>${label ? `<text x="50" y="86" text-anchor="middle" font-family="Hanken Grotesk" font-weight="700" font-size="13" letter-spacing="1.2" fill="#fff">${esc(label)}</text>` : ''}</svg>`
    const add = (x, wd, html, num, numColor) => {
      const c = el('div', 'tcup', html); c.style.left = x + 'px'; c.style.width = wd + 'px'; c.dataset.safe = 'Becher'; row.append(c)
      const n = el('div', 'tnum'); n.textContent = num; n.style.left = x + 'px'; n.style.width = wd + 'px'; if (numColor) n.style.color = numColor; n.dataset.safe = 'Becher-Nummer'; row.append(n)
      return [c, n]
    }
    // Bei weniger als 5 bezahlten Bechern rueckt die Reihe zur Mitte
    const x0 = 60 + (5 - p.paid) * 63, xf = x0 + p.paid * 126 + 26
    for (let i = 0; i < p.paid; i++) add(x0 + i * 126, 110, togo('#3D3390', '#5348B5', ctx.B.cardTo), i + 1)
    const glow = el('div', 'abs glow'); glow.style.cssText = `left:${xf - 142}px;top:900px;width:460px;height:460px;background:radial-gradient(closest-side, rgba(142,130,245,.6), rgba(142,130,245,0))`; row.prepend(glow)
    const [free] = add(xf, 176, togo(ctx.B.paper, '#FFFFFF', ctx.B.brand, p.freeLabel), p.paid + 1, ctx.B.lilac)
    loop(glow, [{ scale: 1 }, { scale: 1.12 }, { scale: 1 }], 1.8)
    const t0 = ctx.at('free')
    key(free, [[t0, { translate: '0px -60px', opacity: 0 }, BACK], [t0 + 0.5, { translate: '0px 0px', opacity: 1 }]])
    cue(t0 + 0.25, 'pop', 0.8, 0.8)

    // Preisschild auf dem Wort mit dem Preis
    const tt = ctx.at('tag')
    const tag = el('div', 'tag'); tag.textContent = p.price; tag.style.left = xf + 130 + 'px'; tag.dataset.safe = 'Preisschild'
    const tw = el('div', 'abs'); tw.style.inset = 0; tw.append(tag); row.append(tw)
    key(tw, [[tt - 0.1, { opacity: 0 }, OUT], [tt + 0.15, { opacity: 1 }]])
    key(tag, [[tt - 0.1, { scale: 0.3 }, BACK], [tt + 0.35, { scale: 1 }]])
    loop(tag, [{ rotate: '5deg' }, { rotate: '13deg' }, { rotate: '5deg' }], 2.2)
    cue(tt - 0.05, 'pop', 0.9, 1.3)

    // "wiederkommst": die Reihe rueckt weiter, neue Becher kommen dazu
    if (p.extra > 0) {
      const tb = ctx.at('more') - 0.2
      key(row, [[tb, { translate: '0px 0px' }, OUT], [tb + 0.8, { translate: `-${p.extra * 126 + 62}px 0px` }]])
      // Vorgabe 0,2: dem Nutzer waren die Wischer im ersten Entwurf (0,4) zu laut
      if (p.whoosh > 0) cue(tb, 'whoosh', p.whoosh)
      for (let i = 0; i < p.extra; i++) {
        const [c, n] = add(xf + 234 + i * 126, 110, togo(ctx.B.lilac, '#FFFFFF', ctx.B.brand), p.paid + 2 + i, ctx.B.lilac)
        const t = tb + 0.3 + i * 0.2
        key(c, [[t, { opacity: 0, translate: '0px -50px' }, BACK], [t + 0.45, { opacity: 1, translate: '0px 0px' }]])
        key(n, [[t, { opacity: 0 }], [t + 0.3, { opacity: 1 }]])
        cue(tb + 0.35 + i * 0.2, 'pop', 0.8, 1 + i * 0.15)
      }
    }
  }
}
