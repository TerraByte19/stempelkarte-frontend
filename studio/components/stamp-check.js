// Die Pointe als Stempel: ein grosser Stempel knallt ins Bild und hinterlaesst
// einen runden Abdruck mit Haken. Gedacht fuer den EINEN Satz, auf den ein
// Video hinauslaeuft ("Natürlich ist das koscher!"), als harter Schnitt.
//
// Bewusst nur ein Haken und kein Wort im Abdruck: ein Siegel mit Schrift saehe
// schnell aus wie ein echtes Pruefzeichen, und das waere eine Behauptung, die
// das Video nicht machen darf. Das Wort steht oben in der Textzeile.
//
// Alle Klassen beginnen mit "sc-": der Baustein steht meist als Teil in einer
// Szene mit anderen Bausteinen, deren Klassen dort ebenfalls gelten.
export default {
  title: 'Pointe: Stempel mit Haken',
  use: 'Der eine Satz, auf den das Video hinausläuft: ein großer Stempel trifft, ein Abdruck mit Haken bleibt stehen. Am besten als Teil mit "enter": "cut".',
  params: {
    icon: { default: 'check', doc: 'Zeichen im Abdruck: check, cup, bread, scissors, star, heart' },
    tilt: { default: -9, doc: 'Schräglage des Abdrucks in Grad (-20 bis 20). Ein gerader Abdruck sieht gedruckt aus' }
  },
  captions: { min: 1 },
  anchors: {
    hit: { cap: 0, word: -1, doc: 'Der Stempel trifft (Töne: thud, ok), der Abdruck bleibt stehen. Auf das Wort der Pointe' }
  },
  demo: { captions: [{ lines: ['Natürlich', 'geht das!'], accent: 1 }], at: { cap: 0, word: -1, offset: 0.7 } },
  css: `
  .sc-glow { left: 60px; top: 530px; width: 960px; height: 960px; border-radius: 50%; opacity: 0;
    background: radial-gradient(closest-side, rgba(90,79,207,.75), rgba(90,79,207,0)); }
  .sc-seal { left: 250px; top: 720px; width: 580px; height: 580px; border-radius: 50%; border: 22px solid var(--lilac); color: var(--lilac);
    display: grid; place-items: center; opacity: 0; box-shadow: 0 0 90px rgba(142,130,245,.45), inset 0 0 0 16px rgba(14,10,36,0), inset 0 0 0 22px rgba(185,176,255,.45); }
  .sc-seal svg { width: 330px; stroke-width: 3.1; filter: drop-shadow(0 0 26px rgba(142,130,245,.6)); }
  .sc-ray { left: 540px; top: 1010px; width: 0; height: 0; }
  .sc-ray i { position: absolute; left: -7px; top: -420px; width: 14px; height: 70px; border-radius: 7px; background: #fff; opacity: 0; transform-origin: 7px 420px; }
  .sc-slot { left: 250px; top: 720px; width: 580px; height: 580px; border-radius: 50%; border: 10px dashed rgba(185,176,255,.45); color: rgba(185,176,255,.28);
    display: grid; place-items: center; }
  .sc-slot svg { width: 300px; stroke-width: 2.2; }
  .sc-st { left: 330px; top: 590px; width: 420px; filter: drop-shadow(0 30px 34px rgba(0,0,0,.5)); z-index: 4; }
  `,
  build(ctx) {
    const { p, key, loop, cue } = ctx, { OUT, IN } = ctx.ease
    if (typeof p.tilt !== 'number' || p.tilt < -20 || p.tilt > 20) ctx.fail('"tilt" muss zwischen -20 und 20 liegen')
    let rays = ''
    for (let i = 0; i < 10; i++) rays += `<i style="rotate:${i * 36 + 8}deg"></i>`
    // Eigene Ebene fuer den Schlag: die Ebene des Teils gehoert der Engine (Blende, Kamera)
    ctx.html(`<div class="abs sc-all" style="inset:0">
      <div class="abs sc-glow"></div>
      <div class="abs sc-slot" style="rotate:${p.tilt}deg">${ctx.icon(p.icon)}</div>
      <div class="abs sc-ray">${rays}</div>
      <div class="abs sc-seal" data-safe="Stempelabdruck" style="rotate:${p.tilt}deg">${ctx.icon(p.icon)}</div>
      <svg class="abs sc-st" viewBox="0 0 220 236"><circle cx="110" cy="58" r="58" fill="url(#stg)"/><rect x="88" y="104" width="44" height="66" fill="url(#stg)"/><rect x="8" y="160" width="204" height="58" rx="16" fill="url(#stg)"/><rect x="22" y="222" width="176" height="12" rx="6" fill="${ctx.B.lilac}"/></svg>
    </div>`)
    const hit = ctx.at('hit'), st = ctx.$('.sc-st')
    // Beiwerk in Bewegung: der Stempelgriff fliegt durchs Bild und zaehlt nicht als Inhalt
    st.dataset.deco = 'Stempel'
    // Vom ersten Bild an steht etwas da: das leere Stempelfeld (gestrichelt, wie auf der
    // Papierkarte) und der Stempel, der rechts darueber wartet. Sonst waere das Bild bis zum
    // Schlag leer. Der Stempel bleibt unter dem Textbereich, damit er kein Wort verdeckt.
    // Dann holt er aus, trifft, und hebt sofort wieder ab: der Abdruck ist die Nachricht.
    const wait = { opacity: 1, translate: '300px -20px', rotate: '24deg', scale: 0.92 }
    key(st, [
      [ctx.s, wait, 'ease-in-out'],
      [Math.max(ctx.s + 0.01, hit - 0.34), { ...wait, translate: '330px -56px', rotate: '28deg' }, IN],
      [hit, { opacity: 1, translate: '0px 0px', rotate: '0deg', scale: 1 }],
      [hit + 0.1, { opacity: 1, translate: '0px 0px', rotate: '0deg', scale: 1 }, OUT],
      [hit + 0.55, { opacity: 0, translate: '360px -120px', rotate: '26deg', scale: 0.95 }]
    ])
    key('.sc-slot', [[hit - 0.01, { opacity: 1 }], [hit + 0.05, { opacity: 0 }]])
    key('.sc-seal', [[hit - 0.01, { opacity: 0, scale: 1.35 }, OUT], [hit + 0.16, { opacity: 1, scale: 1 }]])
    key('.sc-glow', [[ctx.s, { opacity: 0.35 }], [hit, { opacity: 0.35 }, OUT], [hit + 0.4, { opacity: 1 }]])
    loop('.sc-glow', [{ scale: 1 }, { scale: 1.06 }, { scale: 1 }], 1.6)
    // Der Schlag: das ganze Bild zuckt kurz, Strahlen springen nach aussen
    key('.sc-all', [[hit - 0.01, { translate: '0px 0px' }], [hit + 0.03, { translate: '0px 16px' }], [hit + 0.09, { translate: '0px -9px' }], [hit + 0.16, { translate: '0px 5px' }], [hit + 0.26, { translate: '0px 0px' }]])
    ctx.$$('.sc-ray i').forEach(r => key(r, [[hit, { opacity: 0, translate: '0px 90px' }, OUT], [hit + 0.1, { opacity: 0.95, translate: '0px 20px' }], [hit + 0.42, { opacity: 0, translate: '0px -40px' }]]))
    cue(hit, 'thud')
    cue(hit + 0.1, 'ok', 0.75)
  }
}
