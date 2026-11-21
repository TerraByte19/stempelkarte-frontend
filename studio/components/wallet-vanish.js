// Die Papierkarte wird zerknickt, rutscht ins Portemonnaie und ist weg.
// Zurueck bleibt ein gestrichelter Umriss mit Fragezeichen.
// Im ersten Video der erste Teil von Szene 3, direkt gefolgt von guest-ghost.
import { paperGrid, checkStamps } from '../engine/parts.js'

export default {
  title: 'Papierkarte verschwindet im Portemonnaie',
  use: 'Das Problem mit Papier: zerknickt, vergessen, verloren. Drei Schläge auf drei Wörter.',
  params: {
    shop: { default: 'Café Nordwind', doc: 'Name des Ladens auf der Karte (höchstens etwa 30 Zeichen)', same: 'Ladenname' },
    header: { default: 'Stempelkarte', doc: 'Aufdruck oben links (wird in Großbuchstaben gesetzt)' },
    stamps: { default: 6, doc: 'Felder auf der Karte, 4 bis 10', same: 'Stempelzahl' },
    filled: { default: 5, doc: 'Wie viele Felder gestempelt sind' },
    freeLabel: { default: 'GRATIS', doc: 'Aufschrift im Gratis-Feld' },
    icon: { default: 'cup', doc: 'Stempel-Symbol: cup, bread, scissors, star, heart, check', same: 'Symbol' },
    whoosh: { default: 0.22, doc: 'Lautstärke des Wisch-Tons, wenn die Karte ins Portemonnaie rutscht (0 bis 1, 0 = aus). Die Vorgabe ist bewusst leise' }
  },
  captions: { min: 1 },
  anchors: {
    crumple: { cap: 1, word: 0, doc: 'Die Karte knickt (Ton: crumple). Wort wie "Zerknickt,"' },
    wallet: { cap: 1, word: 1, doc: 'Das Portemonnaie fährt hoch, die Karte rutscht hinein (Ton: whoosh). Wort wie "vergessen,"' },
    drop: { cap: 1, word: 2, doc: 'Karte und Portemonnaie fallen aus dem Bild (Ton: drop). Wort wie "verloren."' }
  },
  demo: { captions: [{ lines: ['Nur die Papierkarte', 'macht nicht mit.'], accent: 3 }, { lines: ['Zerknickt,', 'vergessen,', 'verloren.'], accent: 2 }], at: { cap: 1, word: 1, offset: 0.3 } },
  css: `
  .pc3 { left: 220px; top: 690px; width: 640px; padding: 34px; border-radius: 24px; color: var(--ink); z-index: 3;
    background: linear-gradient(160deg, #FBF6EC, #EBE2D0); box-shadow: 0 30px 60px rgba(0,0,0,.5); rotate: -3deg; }
  .pc3 header { display: flex; justify-content: space-between; font-size: 22px; padding-bottom: 16px; border-bottom: 2px solid rgba(26,26,46,.14); }
  .pc3 header b { font-weight: 700; letter-spacing: .14em; text-transform: uppercase; }
  .pc3 header span { font-weight: 500; opacity: .6; }
  .pg3 { display: grid; justify-content: space-between; row-gap: 20px; margin-top: 22px; }
  .pg3 .slot { width: 100px; height: 100px; font-size: 17px; }
  .pg3 .ink { border-width: 7px; } .pg3 .ink svg { width: 52px; }
  .crease { position: absolute; inset: 0; border-radius: 24px; opacity: 0; background:
    linear-gradient(112deg, transparent 46%, rgba(26,26,46,.26) 49.4%, rgba(255,255,255,.65) 50.6%, transparent 54%),
    linear-gradient(64deg, transparent 20%, rgba(26,26,46,.2) 23.4%, rgba(255,255,255,.55) 24.6%, transparent 28%); }
  .dogear { position: absolute; right: -1px; top: -1px; width: 96px; height: 96px; opacity: 0; border-radius: 0 24px 0 0;
    background: linear-gradient(225deg, #171138 50%, #D6CCB8 50%); }
  .ghost { left: 220px; top: 690px; width: 640px; height: 372px; border-radius: 24px; border: 5px dashed rgba(185,176,255,.55); rotate: -3deg; opacity: 0;
    display: grid; place-items: center; font: 700 150px var(--display); color: rgba(185,176,255,.55); }
  .walA, .walB { position: absolute; inset: 0; }
  .walA { z-index: 2; } .walB { z-index: 4; }
  .walback { left: 150px; top: 1180px; width: 780px; height: 380px; border-radius: 40px 40px 30px 30px; background: #1D164C; }
  .bon { width: 150px; height: 300px; border-radius: 6px; background: #E9E2D4; padding: 26px 20px; }
  .bon u { display: block; height: 8px; border-radius: 4px; background: rgba(26,26,46,.22); margin-bottom: 14px; }
  .walfront { left: 150px; top: 1262px; width: 780px; height: 330px; border-radius: 30px; background: linear-gradient(180deg, #382E82, #271F63);
    border-top: 3px solid rgba(185,176,255,.3); box-shadow: 0 -18px 30px rgba(0,0,0,.35), 0 40px 60px rgba(0,0,0,.45); }
  .walfront::before { content: ''; position: absolute; inset: 18px; border-radius: 18px; border: 3px dashed rgba(185,176,255,.3); }
  .walfront::after { content: ''; position: absolute; left: 50%; top: 60px; margin-left: -26px; width: 52px; height: 52px; border-radius: 50%; background: #1D164C; border: 3px solid rgba(185,176,255,.4); }
  `,
  build(ctx) {
    const { p, key, loop, cue } = ctx, { OUT, IN } = ctx.ease
    checkStamps(ctx, p.stamps, p.filled)
    if (!(p.whoosh >= 0 && p.whoosh <= 1)) ctx.fail('"whoosh" muss zwischen 0 und 1 liegen')
    ctx.html(`
      <div class="abs ghost">?</div>
      <div class="walA">
        <div class="abs walback"></div>
        <div class="abs bon" style="left:240px;top:1120px;rotate:-6deg"><u></u><u style="width:70%"></u><u></u><u style="width:50%"></u></div>
        <div class="abs bon" style="left:690px;top:1140px;rotate:5deg"><u style="width:80%"></u><u></u><u style="width:60%"></u></div>
      </div>
      <div class="abs pc3">
        <header data-safe="Kartenkopf"><b></b><span data-oneline="Ladenname"></span></header>
        <div class="pg3" data-cell="100" data-safe="Stempelraster"></div>
        <div class="crease"></div><div class="dogear"></div>
      </div>
      <div class="walB"><div class="abs walfront"></div></div>`)
    ctx.$('.pc3 header b').textContent = p.header
    ctx.$('.pc3 header span').textContent = p.shop
    paperGrid(ctx, ctx.$('.pg3'), p)

    // zerknickt -> ins Portemonnaie -> weg
    const tz = ctx.at('crumple'), tw = ctx.at('wallet'), tv = tw - 0.25, tl = ctx.at('drop') - 0.05
    key('.pc3', [
      [tz - 0.05, { translate: '0px 0px', rotate: '-3deg', scale: 1 }, OUT],
      [tz + 0.3, { translate: '0px 0px', rotate: '-9deg', scale: 0.94 }],
      [tv + 0.3, { translate: '0px 0px', rotate: '-9deg', scale: 0.94 }, 'ease-in-out'],
      [tv + 0.95, { translate: '0px 440px', rotate: '6deg', scale: 0.88 }],
      [tl, { translate: '0px 440px', rotate: '6deg', scale: 0.88 }, IN],
      [tl + 0.55, { translate: '0px 1400px', rotate: '6deg', scale: 0.88 }],
    ])
    key('.crease', [[tz, { opacity: 0 }], [tz + 0.15, { opacity: 1 }]])
    key('.dogear', [[tz + 0.05, { opacity: 0 }], [tz + 0.2, { opacity: 1 }]])
    cue(tz, 'crumple')
    for (const part of ['.walA', '.walB']) key(part, [[tv, { translate: '0px 980px' }, OUT], [tv + 0.6, { translate: '0px 0px' }], [tl, { translate: '0px 0px' }, IN], [tl + 0.55, { translate: '0px 960px' }]])
    // Vorgabe 0,22: dem Nutzer waren die Wischer im ersten Entwurf (0,45) zu laut
    if (p.whoosh > 0) cue(tw - 0.2, 'whoosh', p.whoosh)
    cue(tl, 'drop', 0.9)
    key('.ghost', [[tl + 0.3, { opacity: 0 }], [tl + 0.7, { opacity: 1 }]])
    loop('.ghost', [{ scale: 1 }, { scale: 1.03 }, { scale: 1 }], 1.6)
  }
}
