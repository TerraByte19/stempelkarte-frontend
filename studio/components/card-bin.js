// Papierkarte im Altpapier: die Stempelkarte liegt da, ihre Stempel springen einer nach
// dem anderen auf, dann knuellt sie sich zu einer Kugel zusammen und fliegt in die
// Papiertonne. Fuer "Seine Papierkarte mit sechs Stempeln liegt im Altpapier." - die
// Stempel, die der Laden schon investiert hat, landen mit im Muell.
// Entstanden fuer das Doener-Video. Verwandt mit wallet-vanish (Karte verschwindet im
// Portemonnaie), aber eine eigene Geschichte: dort geht die Karte verloren, hier wird sie
// weggeworfen, und das Bild zaehlt vorher sichtbar die Stempel.
//
// Stempelraster und Felder kommen aus engine/parts.js (dieselben wie auf paper-card).
// Alle Klassen beginnen mit "cb-".
import { paperGrid, checkStamps } from '../engine/parts.js'

export default {
  title: 'Papierkarte landet im Altpapier',
  use: 'Die Papierkarte mit ihren Stempeln, die Stempel springen einzeln auf, dann wird sie zerknüllt und landet in der Papiertonne. Für "Seine Papierkarte ... liegt im Altpapier".',
  params: {
    shop: { default: 'Café Nordwind', doc: 'Name des Ladens oben rechts auf der Karte (höchstens etwa 24 Zeichen)', same: 'Ladenname' },
    header: { default: 'Stempelkarte', doc: 'Aufdruck oben links (wird in Großbuchstaben gesetzt)' },
    stamps: { default: 8, doc: 'Felder auf der Karte, 4 bis 10. Das letzte ist das Gratis-Feld', same: 'Stempelzahl' },
    filled: { default: 6, doc: 'Wie viele Stempel auf der Karte sind. Sie springen auf den Anker "stamps" nacheinander auf' },
    freeLabel: { default: 'GRATIS', doc: 'Aufschrift im Gratis-Feld' },
    icon: { default: 'cup', doc: 'Stempel-Symbol: cup, bread, scissors, star, heart, check, kebab', same: 'Symbol' },
    bin: { default: 'Altpapier', doc: 'Aufschrift auf der Tonne (höchstens etwa 12 Zeichen)' },
    tones: { default: true, doc: 'Eigene Töne (tick je Stempel, crumple, drop). false, wenn das Skript Klänge aus der Bibliothek setzt' }
  },
  captions: { min: 1 },
  anchors: {
    stamps: { cap: 0, word: 3, doc: 'Die Stempel springen nacheinander auf, je 0,07 s (Ton: tick). Auf die gesprochene Zahl' },
    crumple: { cap: 0, word: -3, doc: 'Die Karte knüllt sich zu einer Kugel (Ton: crumple)' },
    land: { cap: 0, word: -1, doc: 'Die Kugel fällt in die Tonne, die Tonne wackelt (Ton: drop). Auf "Altpapier"' }
  },
  demo: {
    params: { shop: 'Döner Nordwind', icon: 'kebab' },
    captions: [{ lines: ['Seine Papierkarte mit sechs', 'Stempeln liegt im Altpapier.'], accent: 7 }],
    at: { cap: 0, word: 4, offset: 0.2 }
  },
  css: `
  .cb-card { left: 150px; top: 630px; width: 780px; padding: 38px 40px 40px; border-radius: 28px; color: var(--ink); z-index: 3;
    background: linear-gradient(160deg, #FBF6EC, #EBE2D0); box-shadow: 0 30px 60px rgba(0,0,0,.5), inset 0 0 0 1px rgba(26,26,46,.06); rotate: -3deg; }
  .cb-card header { display: flex; justify-content: space-between; align-items: baseline; gap: 20px; font-size: 27px; padding-bottom: 18px; border-bottom: 2px solid rgba(26,26,46,.14); white-space: nowrap; }
  .cb-card header b { font-weight: 700; letter-spacing: .14em; text-transform: uppercase; }
  .cb-card header span { font-weight: 500; opacity: .6; }
  .cb-grid { display: grid; justify-content: space-between; row-gap: 24px; margin-top: 26px; }
  .cb-ball { left: 445px; top: 740px; width: 190px; height: 190px; opacity: 0; z-index: 4; }
  .cb-ball svg { width: 190px; height: 190px; }
  .cb-bin { left: 560px; top: 1150px; width: 300px; height: 350px; z-index: 5; transform-origin: 50% 100%; }
  .cb-body { position: absolute; left: 14px; right: 14px; top: 44px; bottom: 0; border-radius: 10px 10px 30px 30px; background: linear-gradient(180deg, #3D6FD6, #2A4FA8);
    box-shadow: 0 24px 40px rgba(0,0,0,.45); }
  .cb-body i { position: absolute; top: 40px; bottom: 30px; width: 14px; border-radius: 7px; background: rgba(255,255,255,.14); }
  .cb-lid { position: absolute; left: 0; right: 0; top: 0; height: 52px; border-radius: 14px; background: #4F82E8; box-shadow: 0 8px 14px rgba(0,0,0,.3); transform-origin: 10% 100%; }
  .cb-lab { position: absolute; left: 34px; right: 34px; top: 128px; height: 74px; border-radius: 12px; background: var(--paper); color: #2A4FA8; display: grid; place-items: center;
    font: 700 34px var(--display); white-space: nowrap; }
  .cb-mouth { position: absolute; left: 30px; right: 30px; top: 40px; height: 22px; border-radius: 50%; background: #0E0A24; opacity: 0; }
  `,
  build(ctx) {
    const { p, key, cue, el } = ctx, { BACK, OUT, IN } = ctx.ease
    checkStamps(ctx, p.stamps, p.filled)
    ctx.html(`
      <div class="abs glow" style="left:40px;top:420px;width:1000px;height:1000px"></div>
      <div class="abs cb-card" data-safe="Papierkarte">
        <header><b></b><span data-oneline="Ladenname auf der Papierkarte"></span></header>
        <div class="cb-grid" data-cell="124"></div>
      </div>
      <div class="abs cb-ball"><svg viewBox="0 0 150 150"><path d="M75 8 L112 20 L138 52 L142 92 L120 128 L80 144 L38 134 L12 100 L10 58 L34 22 Z" fill="#EFE7D6"/>
        <path d="M34 22 L62 60 L112 20 M62 60 L48 104 L80 144 M62 60 L104 84 L138 52 M104 84 L120 128 M48 104 L12 100 M104 84 L80 144" fill="none" stroke="rgba(26,26,46,.28)" stroke-width="4" stroke-linejoin="round"/>
        <circle cx="96" cy="46" r="13" fill="none" stroke="#3C3489" stroke-width="5" opacity=".7"/><circle cx="44" cy="76" r="11" fill="none" stroke="#3C3489" stroke-width="5" opacity=".6"/></svg></div>
      <div class="abs cb-bin" data-safe="Papiertonne"><div class="cb-body"><i style="left:44px"></i><i style="right:44px"></i><div class="cb-lab"><span data-oneline="Aufschrift der Tonne"></span></div></div><div class="cb-lid"></div><i class="cb-mouth"></i></div>`)
    ctx.$('.cb-card header b').textContent = p.header
    ctx.$('.cb-card header span').textContent = p.shop
    // Die Schrift steckt in einem eigenen Feld: das Schild hat eine feste Hoehe, und daran gemessen
    // saehe die Pruefung "einzeiler" zwei Zeilen, wo eine steht
    const lab = ctx.$('.cb-lab span'); lab.textContent = p.bin
    ctx.fit(lab, 184, 22)
    const slots = paperGrid(ctx, ctx.$('.cb-grid'), { ...p, glow: false })

    // Die Stempel springen nacheinander auf: der Zuschauer soll sehen, was da weggeworfen wird
    const ts = ctx.at('stamps'), tc = ctx.at('crumple'), tl = ctx.at('land')
    if (!(tc > ts + 0.1 && tl > tc + 0.25)) ctx.fail('Reihenfolge der Anker: "stamps" vor "crumple" vor "land", "land" mindestens 0,25 s nach "crumple"')
    slots.slice(0, p.filled).forEach((s, i) => {
      const t = ts + i * 0.07
      key(s.ink, [[t, { opacity: 0, scale: 1.6 }, BACK], [t + 0.22, { opacity: 1, scale: 1 }]])
      if (p.tones) cue(t, 'tick', 0.6)
    })
    // Zerknuellen: die Karte schrumpft und dreht sich zur Mitte, an ihrer Stelle bleibt die Kugel
    key('.cb-card', [[tc, { scale: 1, rotate: '-3deg', opacity: 1 }, IN], [tc + 0.22, { scale: 0.22, rotate: '-40deg', opacity: 1 }], [tc + 0.26, { scale: 0.18, rotate: '-46deg', opacity: 0 }]])
    // Die Kugel fliegt im Bogen in die Tonne: Stuetzpunkte auf einer Parabel
    const fly = [], A = [0, 0], B = [170, 430], H = -170, t0 = tc + 0.2, t1 = tl
    for (let i = 0; i <= 8; i++) {
      const f = i / 8, x = A[0] + (B[0] - A[0]) * f, y = A[1] + (B[1] - A[1]) * f + H * 4 * f * (1 - f)
      fly.push([t0 + (t1 - t0) * f, { translate: `${x.toFixed(1)}px ${y.toFixed(1)}px`, rotate: `${(f * 300).toFixed(0)}deg`, scale: (1 - f * 0.35).toFixed(3) }, 'linear'])
    }
    key('.cb-ball', [[t0 - 0.02, { opacity: 0 }], [t0, { opacity: 1 }], [t1 - 0.02, { opacity: 1 }], [t1 + 0.04, { opacity: 0 }]])
    key('.cb-ball', fly)
    // Deckel springt auf, die Kugel faellt hinein, Deckel zu, die Tonne wackelt
    key('.cb-lid', [[t1 - 0.3, { rotate: '0deg' }, OUT], [t1 - 0.12, { rotate: '-28deg' }], [t1 + 0.05, { rotate: '-28deg' }, IN], [t1 + 0.2, { rotate: '0deg' }]])
    key('.cb-mouth', [[t1 - 0.3, { opacity: 0 }], [t1 - 0.12, { opacity: 1 }], [t1 + 0.12, { opacity: 1 }], [t1 + 0.2, { opacity: 0 }]])
    key('.cb-bin', [[t1 + 0.18, { rotate: '0deg' }], [t1 + 0.26, { rotate: '-4deg' }], [t1 + 0.36, { rotate: '3deg' }], [t1 + 0.46, { rotate: '-1.5deg' }], [t1 + 0.56, { rotate: '0deg' }]])
    if (p.tones) { cue(tc, 'crumple', 0.9); cue(tl + 0.18, 'drop', 0.6) }
  }
}
