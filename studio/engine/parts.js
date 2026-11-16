// Bauteile, die mehrere Bausteine teilen (das zugehoerige CSS steht in base.css).
// Hier liegt nur, was wirklich doppelt gebraucht wird - alles andere bleibt
// beim einzelnen Baustein, damit man ihn in einer Datei versteht.

// Schiefe der Papierstempel: von Hand gesetzt, damit es nicht gedruckt aussieht
const TILT = [-9, 6, -4, 11, -7, 8, -5, 10, -8, 5]

/** Spalten fuer ein Stempelraster: immer zwei Reihen (6 -> 3 Spalten wie im ersten Video, 8 -> 4, 10 -> 5). */
export const stampCols = n => Math.ceil(n / 2)

/**
 * Fuellt ein Papier-Stempelraster: `filled` Felder tragen schon einen
 * Tintenstempel, das letzte Feld ist das Gratis-Feld.
 * Gibt die Felder zurueck (slot.ink = der Tintenstempel, falls vorhanden).
 */
export function paperGrid(ctx, grid, { stamps, filled, freeLabel, icon, glow = false }) {
  const slots = []
  grid.style.gridTemplateColumns = `repeat(${stampCols(stamps)}, ${grid.dataset.cell}px)`
  for (let i = 0; i < stamps; i++) {
    const s = ctx.el('div', 'slot'); grid.append(s); slots.push(s)
    if (i === stamps - 1) {
      s.textContent = freeLabel
      if (glow) { const on = ctx.el('div', 'freeon'); on.textContent = freeLabel; s.append(ctx.el('div', 'freeglow'), on) }
      // "GRATIS" fuellt den Kreis gerade so. Laengere Aufschriften werden kleiner gesetzt, statt ueberzulaufen.
      if (freeLabel.length > 6) {
        const size = (parseFloat(getComputedStyle(s).fontSize) * 6.4 / freeLabel.length).toFixed(1) + 'px'
        s.style.fontSize = size; const on = s.querySelector('.freeon'); if (on) on.style.fontSize = size
      }
    } else if (i < filled) {
      const ink = ctx.el('div', 'ink', ctx.icon(icon)); ink.style.rotate = TILT[i % TILT.length] + 'deg'; s.append(ink); s.ink = ink
    }
  }
  return slots
}

/** Prueft Stempelzahlen einmal fuer alle Bausteine mit Karte. */
export function checkStamps(ctx, stamps, filled, max = 10) {
  if (!Number.isInteger(stamps) || stamps < 4 || stamps > max) ctx.fail(`"stamps" muss zwischen 4 und ${max} liegen (bekam ${stamps}), sonst passt das Raster nicht auf die Karte`)
  if (!Number.isInteger(filled) || filled < 1 || filled > stamps - 1) ctx.fail(`"filled" muss zwischen 1 und ${stamps - 1} liegen (das letzte Feld ist das Gratis-Feld)`)
}

// ---------- Rund um die Erinnerung in Ladennaehe (shop-street, shop-map) ----------
// Die Strasse von der Seite und die Karte von oben zeigen dieselbe Geschichte. Der Zuschauer
// soll in beiden Bildern DIESELBE Kundin mit DERSELBEN Benachrichtigung wiedererkennen; laegen
// Figur und Karte zweimal im Code, liefen sie mit der ersten Aenderung auseinander.
//
// Das CSS kommt als Text mit Klassen-Vorsilbe zurueck (pre = "ss", "sm"): das CSS eines
// Bausteins gilt nur in seiner eigenen Szene (@scope), eine Szene aus mehreren Teilen traegt
// aber die Klassen ALLER ihrer Bausteine. Mit eigener Vorsilbe stoert keiner den anderen.

/** Masse der Figur in ihrem eigenen Mass (die Karte zeigt sie verkleinert). */
export const WALKER = { w: 160, h: 340 }

/** Figur von der Seite, Blick nach rechts: zwei Beine, Rumpf, Kopf, ein Arm, der das Handy haelt. */
export const walkerFigure = (pre, extra = '') => `<div class="${pre}-fig ${extra}"><i class="${pre}-leg ${pre}-lb"></i><i class="${pre}-leg ${pre}-lf"></i><div class="${pre}-up"><i class="${pre}-torso"></i><i class="${pre}-head"></i><i class="${pre}-arm"></i><div class="${pre}-ph"><b></b><i></i></div><s class="${pre}-bz ${pre}-bz1"></s><s class="${pre}-bz ${pre}-bz2"></s></div></div>`

export const walkerCss = pre => `
  .${pre}-fig { position: absolute; inset: 0; }
  .${pre}-fig.flip { transform: scaleX(-1); }
  .${pre}-leg { position: absolute; top: 194px; width: 28px; height: 146px; border-radius: 14px; transform-origin: 50% 12px; }
  .${pre}-lb { left: 58px; background: #6A5EDB; }
  .${pre}-lf { left: 74px; background: #9488F2; }
  .${pre}-up { position: absolute; inset: 0; }
  .${pre}-torso { position: absolute; left: 38px; top: 82px; width: 84px; height: 152px; border-radius: 38px 38px 28px 28px; background: var(--lilac); }
  .${pre}-head { position: absolute; left: 46px; top: 6px; width: 68px; height: 68px; border-radius: 50%; background: #EDE6FF; }
  .${pre}-arm { position: absolute; left: 84px; top: 114px; width: 60px; height: 22px; border-radius: 11px; background: #EDE6FF; transform-origin: 11px 50%; transform: rotate(34deg); }
  .${pre}-ph { position: absolute; left: 118px; top: 102px; width: 44px; height: 76px; border-radius: 10px; background: #06041A; border: 3px solid #EDE6FF; transform: rotate(9deg); transform-origin: 50% 100%; }
  .${pre}-ph i { position: absolute; inset: 4px; border-radius: 5px; background: #3C3489; }
  .${pre}-ph b { position: absolute; inset: -26px; border-radius: 50%; opacity: 0; background: radial-gradient(closest-side, rgba(255,255,255,.85), rgba(185,176,255,0)); }
  .${pre}-bz { position: absolute; top: 96px; width: 26px; height: 84px; border: 6px solid transparent; border-radius: 50%; opacity: 0; }
  .${pre}-bz1 { left: 92px; border-left-color: #fff; }
  .${pre}-bz2 { left: 164px; border-right-color: #fff; }
`

/**
 * Schritte von tW bis tA, danach steht die Figur. Eigene Stuetzpunkte statt Dauerschleife:
 * eine Schleife liefe im Stehen weiter, und die Figur traete auf der Stelle.
 */
export function walkerSteps(key, fig, pre, tW, tA) {
  const STEP = 0.3, la = [], lb = [], bob = []
  for (let k = 0; tW + k * STEP < tA - 0.05; k++) {
    const t = tW + k * STEP, a = (k % 2 ? -24 : 24)
    la.push([t, { rotate: a + 'deg' }, 'ease-in-out']); lb.push([t, { rotate: -a + 'deg' }, 'ease-in-out'])
    bob.push([t, { translate: '0px 0px' }, 'ease-out'], [t + STEP / 2, { translate: '0px -9px' }, 'ease-in'])
  }
  la.push([tA, { rotate: '0deg' }]); lb.push([tA, { rotate: '0deg' }]); bob.push([tA, { translate: '0px 0px' }])
  key(fig.querySelector(`.${pre}-lf`), la); key(fig.querySelector(`.${pre}-lb`), lb); key(fig.querySelector(`.${pre}-up`), bob)
}

/**
 * Das Handy der Figur brummt auf t: es wackelt, der Bildschirm wird hell, ein Schein geht auf.
 * long = das ausfuehrliche Brummen des einen Passanten mit Schwingungsboegen links und rechts;
 * ohne long das kurze fuer mehrere Kunden nebeneinander.
 */
export function walkerBuzz(key, fig, pre, t, OUT, long = true) {
  const ph = fig.querySelector(`.${pre}-ph`)
  key(ph, long
    ? [[t, { rotate: '0deg' }], [t + 0.06, { rotate: '-11deg' }], [t + 0.13, { rotate: '11deg' }], [t + 0.2, { rotate: '-8deg' }], [t + 0.27, { rotate: '8deg' }], [t + 0.34, { rotate: '-4deg' }], [t + 0.42, { rotate: '0deg' }]]
    : [[t, { rotate: '0deg' }], [t + 0.06, { rotate: '-11deg' }], [t + 0.13, { rotate: '11deg' }], [t + 0.2, { rotate: '-7deg' }], [t + 0.28, { rotate: '0deg' }]])
  key(ph.querySelector('i'), [[t, { backgroundColor: '#3C3489' }], [t + 0.12, { backgroundColor: '#FFFFFF' }]])
  key(ph.querySelector('b'), [[t, { opacity: 0 }, OUT], [t + 0.25, { opacity: 1 }]])
  if (long) for (const z of fig.querySelectorAll(`.${pre}-bz`)) key(z, [[t, { opacity: 0, scale: 0.7 }, OUT], [t + 0.12, { opacity: 0.95, scale: 1 }], [t + 0.42, { opacity: 0.95, scale: 1.1 }], [t + 0.62, { opacity: 0, scale: 1.25 }]])
}

/** Aussehen der kleinen Karten-Benachrichtigung. Wo sie sitzt, legt der Baustein fest. */
export const chipCss = pre => `
  .${pre}-chip { position: absolute; display: flex; align-items: center; gap: 16px; padding: 14px 24px 14px 14px; border-radius: 26px; opacity: 0;
    background: linear-gradient(163deg, var(--card-from), var(--card-to)); box-shadow: 0 18px 36px rgba(0,0,0,.5), inset 0 0 0 2px rgba(255,255,255,.28); white-space: nowrap; }
  .${pre}-chip span { flex: none; width: 62px; height: 62px; border-radius: 16px; background: #fff; color: var(--card-to); display: grid; place-items: center; }
  .${pre}-chip span svg { width: 38px; }
  .${pre}-chip b { display: block; font: 700 31px var(--body); }
  .${pre}-chip em { display: block; font: 500 24px var(--body); font-style: normal; opacity: .9; margin-top: 2px; }
  .${pre}-chip::after { content: ''; position: absolute; left: var(--tail, 60px); bottom: -20px; border-left: 16px solid transparent; border-right: 16px solid transparent; border-top: 22px solid var(--card-to); }
`

/**
 * Die kleine Karten-Benachrichtigung: Symbol, Ladenname, auf Wunsch eine zweite Zeile.
 * Wird in `into` eingehaengt (erst dann laesst sich die Schrift messen) und auf `room` px
 * Textbreite eingepasst. Gibt das Element zurueck.
 */
export function noteChip(ctx, pre, into, { shop, note, icon }, room = 330) {
  const chip = ctx.el('div', `${pre}-chip`, `<span>${ctx.icon(icon)}</span><div><b data-oneline="Ladenname in der Karten-Benachrichtigung"></b>${note ? '<em data-oneline="Zweite Zeile der Karten-Benachrichtigung"></em>' : ''}</div>`)
  chip.dataset.safe = 'Karten-Benachrichtigung'
  chip.querySelector('b').textContent = shop
  if (note) chip.querySelector('em').textContent = note
  into.append(chip)
  ctx.fit(chip.querySelector('b'), room, 20)
  if (note) ctx.fit(chip.querySelector('em'), room, 18)
  return chip
}

/** Ortsnadel. inner = was im Kopf der Nadel sitzt (Vorgabe: dunkler Punkt). */
export const pinSvg = (B, size, inner = `<circle cx="75" cy="56" r="20" fill="${B.night2}"/>`) => `<svg width="${size}" height="${size}" viewBox="0 0 150 150"><path fill="${B.lilac}" d="M75 8 C47 8 26 29 26 56 C26 92 75 138 75 138 C75 138 124 92 124 56 C124 29 103 8 75 8 Z"/>${inner}</svg>`

export const EYE_SVG = '<svg viewBox="0 0 24 24"><path d="M2.5 12C5 7.6 8.2 5.6 12 5.6s7 2 9.5 6.4c-2.5 4.4-5.7 6.4-9.5 6.4S5 16.4 2.5 12Z"/><circle cx="12" cy="12" r="3.1" fill="currentColor"/></svg>'

/** Runde Zeichen (Auge, Papierflieger) mit Strich zum Durchstreichen, Fragezeichen, Blicklinie. */
export const badgeCss = pre => `
  .${pre}-badge { width: 128px; height: 128px; border-radius: 50%; background: var(--paper); color: var(--ink); display: grid; place-items: center; opacity: 0; z-index: 8;
    box-shadow: 0 16px 30px rgba(0,0,0,.45); }
  .${pre}-badge svg { width: 78px; height: 78px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
  .${pre}-slash { position: absolute; left: -8px; right: -8px; top: 50%; height: 14px; margin-top: -7px; border-radius: 7px; background: #6A5EDB; rotate: -38deg; scale: 0 1;
    box-shadow: 0 0 0 5px var(--paper); }
  .${pre}-q { width: 84px; height: 84px; border-radius: 50%; background: var(--lilac); color: var(--night); display: grid; place-items: center; font: 700 60px var(--display); opacity: 0; z-index: 8; }
  .${pre}-sight { height: 8px; overflow: hidden; transform-origin: 0 50%; opacity: 0; z-index: 5; }
  .${pre}-sight i { display: block; width: 1400px; height: 8px; background: repeating-linear-gradient(90deg, var(--lilac) 0 18px, transparent 18px 34px); }
`

/** Weicher Kreis "in der Naehe" mit einem Ring, der langsam atmet. Nie mit einer Zahl daneben. */
export const zoneCss = pre => `
  .${pre}-zone { border-radius: 50%; opacity: 0; z-index: 3;
    background: radial-gradient(closest-side, rgba(185,176,255,.2) 0%, rgba(185,176,255,.13) 72%, rgba(185,176,255,.3) 97%, rgba(185,176,255,0) 100%); }
  .${pre}-zone u { position: absolute; inset: 0; border-radius: 50%; border: 5px solid rgba(185,176,255,.7); opacity: 0; }
`
