// Der Betreiber hinter seiner Theke, ahnungslos: er wischt die Theke, ueber ihm eine
// Denkblase mit drei Punkten, die Uhr laeuft, und vor der Theke rollt ein Steppenlaeufer
// durchs Bild - das Bild fuer peinliche Stille ("Du hast es nicht mal gemerkt.").
// Entstanden fuer das Doener-Video; ohne Spiess (Parameter "spit": false) passt es zu
// jedem Laden mit Theke.
//
// Kein Kunde im Bild, mit Absicht: die Aussage ist, dass einer FEHLT und der Laden es
// nicht sieht. Der Steppenlaeufer ist ein bekanntes Bild fuer "hier passiert nichts";
// die Grillen dazu liefert das Skript als Klang aus der Bibliothek ("grillen-stille").
// Alle Klassen beginnen mit "oc-".
export default {
  title: 'Betreiber an der Theke, ahnungslos',
  use: 'Der Betreiber hinter seiner Theke merkt nichts: Denkblase mit drei Punkten, die Uhr läuft, ein Steppenläufer rollt durchs leere Bild. Für "Du hast es nicht mal gemerkt".',
  params: {
    shop: { default: 'Café Nordwind', doc: 'Name auf dem Schild an der Rückwand (höchstens etwa 20 Zeichen, längere werden kleiner gesetzt)', same: 'Ladenname' },
    icon: { default: 'cup', doc: 'Symbol auf dem Schild: cup, bread, scissors, star, heart, check, kebab', same: 'Symbol' },
    spit: { default: true, doc: 'Dönerspieß links hinter der Theke (für Imbiss und Dönerladen; false für alle anderen Läden)' },
    tumbleweed: { default: true, doc: 'Ein Steppenläufer rollt vor der Theke durchs Bild (Anker "roll")' },
    tones: { default: true, doc: 'Eigene Töne (pop für die Denkblase). false, wenn das Skript Klänge aus der Bibliothek setzt' }
  },
  captions: { min: 1 },
  anchors: p => ({
    bubble: { cap: -1, word: 2, doc: 'Die Denkblase mit drei Punkten springt auf (Ton: pop). Auf "nicht" o. ä.' },
    ...(p.tumbleweed ? { roll: { cap: -1, word: 0, doc: 'Der Steppenläufer rollt los und quert das Bild in 2,4 s' } } : {})
  }),
  demo: {
    params: { shop: 'Döner Nordwind', icon: 'kebab' },
    captions: [{ lines: ['Und das Schlimmste:'], accent: 2 }, { lines: ['Du hast es', 'nicht mal gemerkt.'], accent: 3 }],
    at: { cap: -1, word: -1, offset: 0.3 }
  },
  css: `
  .oc-wall { left: 0; right: 0; top: 560px; height: 620px; background: linear-gradient(180deg, rgba(42,33,102,0), #2A2166 30%, #241C5C); }
  .oc-tiles { left: 0; right: 0; top: 980px; height: 170px; background: repeating-linear-gradient(90deg, rgba(185,176,255,.07) 0 58px, rgba(185,176,255,0) 58px 62px), repeating-linear-gradient(180deg, rgba(185,176,255,.07) 0 40px, rgba(185,176,255,0) 40px 44px); }
  .oc-sign { left: 220px; top: 640px; width: 480px; height: 104px; border-radius: 18px; background: var(--paper); color: var(--ink); display: flex; align-items: center; gap: 16px; padding: 0 22px 0 14px;
    box-shadow: 0 12px 28px rgba(0,0,0,.4); white-space: nowrap; }
  .oc-sign span { flex: none; width: 76px; height: 76px; border-radius: 18px; background: var(--brand); color: #fff; display: grid; place-items: center; }
  .oc-sign span svg { width: 50px; }
  .oc-sign b { font: 700 46px var(--display); letter-spacing: -.01em; }
  .oc-clock { left: 792px; top: 640px; width: 120px; height: 120px; border-radius: 50%; background: var(--paper); border: 8px solid #4A40A8; }
  .oc-clock i { position: absolute; left: 50%; top: 50%; width: 6px; margin-left: -3px; border-radius: 3px; background: var(--ink); transform-origin: 3px 0; }
  .oc-heat { left: 92px; top: 770px; width: 220px; height: 420px; border-radius: 26px; background: linear-gradient(180deg, #4A2A44, #6B3A3A); }
  .oc-heat::after { content: ''; position: absolute; inset: 22px; border-radius: 16px; background: repeating-linear-gradient(180deg, rgba(240,140,70,.55) 0 18px, rgba(240,140,70,.15) 18px 30px); }
  .oc-spit { left: 120px; top: 760px; width: 170px; height: 440px; }
  .oc-spit .rod { position: absolute; left: 81px; top: 0; width: 8px; height: 440px; border-radius: 4px; background: #CFC6F4; }
  .oc-spit .meat { position: absolute; left: 6px; top: 46px; width: 158px; height: 320px; clip-path: polygon(0 0, 100% 0, 78% 100%, 22% 100%);
    background: repeating-linear-gradient(180deg, #B8662E 0 22px, #9A4E22 22px 30px); }
  .oc-spit .shine { position: absolute; left: 6px; top: 46px; width: 158px; height: 320px; clip-path: polygon(0 0, 100% 0, 78% 100%, 22% 100%);
    background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,214,150,.45) 40%, rgba(255,255,255,0) 70%); background-size: 220px 100%; }
  .oc-owner { left: 430px; top: 830px; width: 220px; height: 340px; }
  .oc-owner .h { position: absolute; left: 66px; top: 0; width: 88px; height: 88px; border-radius: 50%; background: #EDE6FF; }
  .oc-owner .cap { position: absolute; left: 60px; top: -6px; width: 100px; height: 40px; border-radius: 50px 50px 8px 8px; background: var(--paper); }
  .oc-owner .t { position: absolute; left: 30px; top: 96px; width: 160px; height: 250px; border-radius: 60px 60px 20px 20px; background: var(--lilac); }
  .oc-owner .a { position: absolute; left: 60px; top: 150px; width: 100px; height: 196px; border-radius: 14px 14px 24px 24px; background: var(--paper); }
  .oc-arm { left: 590px; top: 1100px; width: 150px; height: 40px; border-radius: 20px; background: #EDE6FF; transform-origin: 20px 20px; }
  .oc-cloth { left: 700px; top: 1112px; width: 90px; height: 44px; border-radius: 12px; background: var(--paper); }
  .oc-top { left: 0; right: 0; top: 1150px; height: 34px; background: #4A40A8; border-radius: 6px; box-shadow: 0 10px 24px rgba(0,0,0,.35); }
  .oc-front { left: 0; right: 0; top: 1184px; height: 200px; background: linear-gradient(180deg, #2C2269, #1A1345); }
  .oc-front i { position: absolute; top: 34px; width: 210px; height: 132px; border-radius: 16px; border: 4px solid rgba(185,176,255,.16); }
  .oc-floor { left: 0; right: 0; top: 1384px; bottom: 0; background: linear-gradient(180deg, #160F3B, #0E0A24); }
  .oc-bub { left: 640px; top: 760px; width: 210px; height: 124px; opacity: 0; transform-origin: 0 100%; }
  .oc-bub .c { position: absolute; inset: 0; border-radius: 62px; background: var(--paper); box-shadow: 0 12px 26px rgba(0,0,0,.4); }
  .oc-bub .d1, .oc-bub .d2 { position: absolute; border-radius: 50%; background: var(--paper); }
  .oc-bub .d1 { left: -14px; top: 118px; width: 34px; height: 34px; }
  .oc-bub .d2 { left: -40px; top: 158px; width: 20px; height: 20px; }
  .oc-bub u { position: absolute; top: 48px; width: 28px; height: 28px; border-radius: 50%; background: var(--ink); opacity: 0; }
  .oc-weed { left: 0; top: 1376px; width: 140px; height: 140px; opacity: 0; }
  .oc-weed svg { width: 140px; height: 140px; fill: none; stroke: #C9A36B; stroke-width: 5; stroke-linecap: round; }
  `,
  build(ctx) {
    const { p, key, loop, cue, el } = ctx, { BACK, OUT } = ctx.ease
    // Steppenlaeufer: verschlungene Boegen aus einem festen Muster (kein Zufall: jedes Bild gleich)
    let weed = ''
    for (let i = 0; i < 9; i++) { const a = i * 40, r = 40 + (i % 3) * 10; weed += `<ellipse cx="70" cy="70" rx="${r}" ry="${r * 0.55}" transform="rotate(${a} 70 70)"/>` }
    ctx.html(`
      <div class="abs oc-wall"></div><div class="abs oc-tiles"></div>
      <div class="abs oc-sign" data-safe="Schild an der Rückwand"><span>${ctx.icon(p.icon)}</span><b data-oneline="Ladenname auf dem Schild"></b></div>
      <div class="abs oc-clock" data-safe="Uhr"><i class="m" style="height:44px"></i><i class="hr" style="height:30px;width:8px;margin-left:-4px;transform-origin:4px 0"></i></div>
      ${p.spit ? '<div class="abs oc-heat"></div><div class="abs oc-spit"><i class="rod"></i><i class="meat"></i><i class="shine"></i></div>' : ''}
      <div class="abs oc-owner" data-safe="Betreiber"><i class="t"></i><i class="a"></i><i class="h"></i><i class="cap"></i></div>
      <div class="abs oc-top"></div>
      <div class="abs oc-arm"></div><div class="abs oc-cloth"></div>
      <div class="abs oc-front"><i style="left:60px"></i><i style="left:300px"></i><i style="left:540px"></i><i style="left:780px"></i></div>
      <div class="abs oc-floor"></div>
      <div class="abs oc-bub" data-safe="Denkblase"><i class="d2"></i><i class="d1"></i><i class="c"></i><u style="left:48px"></u><u style="left:91px"></u><u style="left:134px"></u></div>
      ${p.tumbleweed ? `<div class="abs oc-weed"><svg viewBox="0 0 140 140">${weed}</svg></div>` : ''}`)
    const name = ctx.$('.oc-sign b'); name.textContent = p.shop
    if (ctx.fit(name, 360, 26) < 32) ctx.warn(`der Ladenname "${p.shop}" steht auf dem Schild sehr klein. Namen kürzen.`)

    // Alles lebt ein wenig: der Spiess glaenzt im Drehen, die Uhr laeuft, der Betreiber wischt
    if (p.spit) loop('.oc-spit .shine', [{ backgroundPosition: '-220px 0' }, { backgroundPosition: '220px 0' }], 1.6)
    ctx.key('.oc-clock .m', [[ctx.s, { rotate: '150deg' }, 'linear'], [ctx.e + 0.3, { rotate: `${150 + (ctx.e + 0.3 - ctx.s) * 120}deg` }]])
    ctx.key('.oc-clock .hr', [[ctx.s, { rotate: '250deg' }, 'linear'], [ctx.e + 0.3, { rotate: `${250 + (ctx.e + 0.3 - ctx.s) * 10}deg` }]])
    loop('.oc-cloth', [{ translate: '0px 0px' }, { translate: '-70px 0px' }, { translate: '0px 0px' }], 1.2)
    loop('.oc-arm', [{ rotate: '0deg' }, { rotate: '-8deg' }, { rotate: '0deg' }], 1.2)
    loop('.oc-owner', [{ rotate: '0deg' }, { rotate: '1.5deg' }, { rotate: '0deg' }, { rotate: '-1.5deg' }, { rotate: '0deg' }], 2.4)

    // Denkblase: drei Punkte nacheinander - er denkt an nichts Besonderes
    const tb = ctx.at('bubble')
    key('.oc-bub', [[tb, { opacity: 0, scale: 0.3 }, BACK], [tb + 0.4, { opacity: 1, scale: 1 }]])
    ctx.$$('.oc-bub u').forEach((u, i) => key(u, [[tb + 0.25 + i * 0.16, { opacity: 0, scale: 0.4 }, BACK], [tb + 0.45 + i * 0.16, { opacity: 1, scale: 1 }]]))
    if (p.tones) cue(tb, 'pop', 0.7, 0.9)

    // Steppenlaeufer: rollt von links nach rechts mit zwei kleinen Hopsern, dreht sich dabei
    if (p.tumbleweed) {
      const tr = ctx.at('roll'), D = 2.4, x0 = -160, x1 = 1120
      const fr = []
      for (let i = 0; i <= 12; i++) {
        const f = i / 12, hop = Math.abs(Math.sin(f * Math.PI * 3)) * -46
        fr.push([tr + f * D, { translate: `${(x0 + (x1 - x0) * f).toFixed(1)}px ${hop.toFixed(1)}px`, rotate: `${(f * 720).toFixed(1)}deg`, opacity: 1 }, 'linear'])
      }
      key('.oc-weed', [[tr - 0.01, { opacity: 0, translate: `${x0}px 0px`, rotate: '0deg' }], ...fr])
    }
  }
}
