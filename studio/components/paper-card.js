// Papier-Stempelkarte auf der Theke: ein Stempel saust herunter, danach
// leuchtet das Gratis-Feld auf. Der Einstieg des ersten Videos ("Der sechste
// Kaffee geht aufs Haus. Warum eigentlich?").
import { paperGrid, checkStamps } from '../engine/parts.js'

export default {
  title: 'Papier-Stempelkarte auf der Theke',
  use: 'Einstieg: zeigt das Bekannte (Papierkarte, letzter Stempel, Gratis-Feld), bevor das Video es in Frage stellt.',
  params: {
    shop: { default: 'Café Nordwind', doc: 'Name des Ladens, oben rechts auf der Karte' },
    header: { default: 'Stempelkarte', doc: 'Aufdruck oben links (wird in Großbuchstaben gesetzt)' },
    stamps: { default: 6, doc: 'Felder auf der Karte, 4 bis 10. Das letzte ist das Gratis-Feld' },
    filled: { default: 5, doc: 'Wie viele Felder am Ende gestempelt sind. Der letzte davon ist der Stempel, der im Bild fällt' },
    freeLabel: { default: 'GRATIS', doc: 'Aufschrift im Gratis-Feld (kurz halten, etwa 6 Buchstaben)' },
    icon: { default: 'cup', doc: 'Stempel-Symbol: cup, scissors, star, heart, check' },
    mug: { default: true, doc: 'Dampfende Tasse links auf der Theke. Für alles außer Café/Bäckerei auf false' }
  },
  captions: { min: 1 },
  anchors: {
    hit: { at: 'start', offset: 0.5, doc: 'Der Stempel trifft die Karte (Ton: thud)' },
    free: { cap: 0, word: 5, doc: 'Das Gratis-Feld leuchtet auf (Ton: chime). Auf das Wort legen, das die Belohnung nennt' }
  },
  demo: { captions: [{ lines: ['Der sechste Kaffee', 'geht aufs Haus.', 'Warum eigentlich?'], accent: 6 }] },
  css: `
  .shelf { left: 560px; top: 806px; width: 520px; height: 12px; border-radius: 6px; background: var(--wall); }
  .shelf b { position: absolute; bottom: 12px; background: #241C5C; border-radius: 6px 6px 18px 18px; }
  .mug { left: 86px; top: 800px; width: 230px; color: #EDE6FF; }
  .pcard { left: 140px; top: 1058px; width: 800px; padding: 44px; border-radius: 28px; color: var(--ink);
    background: linear-gradient(160deg, #FBF6EC, #EBE2D0); box-shadow: 0 34px 70px rgba(0,0,0,.5), inset 0 0 0 1px rgba(26,26,46,.06);
    rotate: -3deg; }
  .pcard header { display: flex; justify-content: space-between; align-items: baseline; font-size: 27px; padding-bottom: 20px;
    border-bottom: 2px solid rgba(26,26,46,.14); }
  .pcard header b { font-weight: 700; letter-spacing: .14em; text-transform: uppercase; }
  .pcard header span { font-weight: 500; opacity: .6; }
  .pgrid { display: grid; justify-content: space-between; row-gap: 26px; margin-top: 28px; }
  .stamper { position: absolute; left: 50%; bottom: 50%; width: 220px; margin-left: -110px; z-index: 5;
    transform-origin: 50% 100%; filter: drop-shadow(0 22px 26px rgba(0,0,0,.45)); }
  `,
  build(ctx) {
    const { p, key, loop, pop, cue, el } = ctx, { BACK, OUT, IN } = ctx.ease
    checkStamps(ctx, p.stamps, p.filled)
    ctx.html(`
      <div class="abs glow" style="left:330px;top:420px;width:1000px;height:1000px"></div>
      <div class="abs shelf"><b style="left:44px;width:66px;height:76px"></b><b style="left:132px;width:66px;height:76px"></b><b style="left:220px;width:66px;height:76px"></b><b style="left:350px;width:88px;height:108px;border-radius:14px 14px 10px 10px"></b></div>
      <div class="abs counter" style="top:1000px"></div>
      ${p.mug ? `<svg class="abs mug" viewBox="0 0 230 220">
        <g fill="none" stroke="rgba(255,255,255,.4)" stroke-width="7" stroke-linecap="round">
          <path class="steam" d="M78 82 C62 62 96 48 80 22"/><path class="steam" d="M122 86 C106 66 140 50 124 22"/>
        </g>
        <path fill="currentColor" d="M26 104 H170 V150 C170 186 144 210 110 210 H86 C52 210 26 186 26 150 Z"/>
        <path fill="none" stroke="currentColor" stroke-width="17" d="M170 122 H186 C204 122 212 134 212 147 C212 160 204 172 186 172 H168"/>
        <rect x="26" y="104" width="144" height="14" fill="#CFC6F4"/>
      </svg>` : ''}
      <div class="abs pcard">
        <header data-safe="Kartenkopf"><b></b><span data-oneline="Ladenname"></span></header>
        <div class="pgrid" data-cell="124" data-safe="Stempelraster"></div>
      </div>`)
    ctx.$('.pcard header b').textContent = p.header
    ctx.$('.pcard header span').textContent = p.shop
    const grid = ctx.$('.pgrid')
    const slots = paperGrid(ctx, grid, { ...p, glow: true })

    // Der Stempel trifft das letzte gefuellte Feld
    const hit = ctx.at('hit'), target = slots[p.filled - 1]
    const st = el('div', 'stamper', '<svg viewBox="0 0 220 236"><circle cx="110" cy="58" r="58" fill="url(#stg)"/><rect x="88" y="104" width="44" height="66" fill="url(#stg)"/><rect x="8" y="160" width="204" height="58" rx="16" fill="url(#stg)"/><rect x="22" y="222" width="176" height="12" rx="6" fill="' + ctx.B.lilac + '"/></svg>')
    target.append(st); target.style.zIndex = 4
    key(st, [
      [ctx.s, { translate: '250px -470px', rotate: '20deg' }, IN],
      [hit, { translate: '0px 0px', rotate: '0deg' }],
      [hit + 0.12, { translate: '0px 0px', rotate: '0deg' }, OUT],
      [hit + 0.7, { translate: '190px -420px', rotate: '15deg' }],
    ])
    loop(st.firstChild, [{ translate: '0px 0px' }, { translate: '0px -14px' }, { translate: '0px 0px' }], 2.6)
    key(target.ink, [[hit - 0.01, { opacity: 0, scale: 1.3 }, OUT], [hit + 0.14, { opacity: 1, scale: 1 }]])
    key('.pcard', [[hit - 0.02, { scale: 1 }], [hit + 0.06, { scale: 0.975 }, OUT], [hit + 0.4, { scale: 1 }]])
    cue(hit, 'thud')

    // Das Gratis-Feld leuchtet auf dem Wort, das die Belohnung nennt
    const free = slots[p.stamps - 1], tf = ctx.at('free')
    pop(free.querySelector('.freeon'), tf, 0.4)
    key(free.querySelector('.freeglow'), [[tf, { opacity: 0 }, OUT], [tf + 0.4, { opacity: 1 }]])
    loop(free.querySelector('.freeglow'), [{ scale: 1 }, { scale: 1.22 }, { scale: 1 }], 1.4)
    cue(tf, 'chime', 0.8)

    ctx.$$('.steam').forEach((s, i) => loop(s, [{ opacity: 0.15, translate: '0px 10px' }, { opacity: 1, translate: '0px -4px' }, { opacity: 0.15, translate: '0px -18px' }], 2.4, i * 1.1))
  }
}
