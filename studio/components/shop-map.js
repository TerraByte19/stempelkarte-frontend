// Karte von oben: ein paar Haeuserblocks und Strassen, der Laden als Ortsnadel
// mit Namensschild, darum ein weicher Kreis "in der Naehe", und eine Kundin,
// die eine Strasse WEITER geht und dort, sichtbar entfernt von der Nadel, ihre
// Karten-Benachrichtigung bekommt.
//
// Warum es das Bild gibt: in der ersten Fassung des zweiten Videos ging die
// Figur in jedem Bild direkt an der Ladenfront vorbei (shop-street). Der
// Betreiber las daraus, man muesse vor der Tuer stehen. Wahr ist: die volle
// Karte meldet sich, sobald das Handy in einen Umkreis um den Laden kommt.
// Von der Seite laesst sich "in der Naehe, aber nicht davor" nicht zeigen,
// von oben in zwei Sekunden.
//
// Eigener Baustein und kein weiterer "view" von shop-street: dort ist alles
// eine Strasse von der Seite (Gehweg, Ladenfront, Wegpunkte als Anteil der
// Bildbreite), hier ein Strassennetz von oben mit Wegen ueber Kreuzungen. Die
// beiden teilen kein Mass und keine Kulisse. Was sie teilen, ist das, woran
// der Zuschauer die Geschichte wiedererkennt - Figur, Benachrichtigung, Nadel,
// Auge, Kreis - und das liegt in engine/parts.js.
//
// Bewusst NICHT im Bild: eine Entfernung in Zahlen (die App kennt mehrere
// Umkreise, der Laden waehlt), Strassennamen, eine echte Stadt, Farben oder
// Zeichen eines Kartendienstes.
//
// Das Strassennetz (Wegpunkte in "path" sind [Spalte, Reihe], Zwischenwerte
// liegen zwischen zwei Kreuzungen, Werte unter 0 oder ueber 3 ausserhalb des Bildes):
//
//          Sp. 0    Sp. 1    Sp. 2    Sp. 3
//   R. 0  ---+--------+--------+--------+---
//            | Platz  |        |        |
//   R. 1  ---+--------+--------+--------+---   eine Strasse weiter: hier geht die Kundin
//            |        | LADEN  |        |
//   R. 2  ---+--------+--Tuer--+--------+---   die Strasse vor der Ladentuer
//            |        |        | Park   |
//   R. 3  ---+--------+--------+--------+---
//
// Alle Klassen beginnen mit "sm-" (siehe shop-street: eine Szene aus mehreren
// Teilen traegt die Klassen aller ihrer Bausteine).
import { WALKER, walkerFigure, walkerCss, walkerSteps, walkerBuzz, chipCss, noteChip, pinSvg, EYE_SVG, badgeCss, zoneCss } from '../engine/parts.js'

const PITCH = i => +(2 ** (i * 2 / 12)).toFixed(2)
const COL0 = 130, COLW = 270   // Mitte der Strasse in Spalte 0, Abstand der Spalten
const ROW0 = 760, ROWH = 240   // Mitte der Strasse in Reihe 0, Abstand der Reihen
const STREET = 56              // Breite einer Strasse
const gx = c => COL0 + COLW * c, gy = r => ROW0 + ROWH * r
const SHOP = { x: 560, y: 1166 } // Spitze der Ortsnadel = Mitte des Ladens = Mitte des Kreises
const DOOR = { x: 560, y: gy(2) } // vor der Tuer, auf der Strasse in Reihe 2
const DOOR_KEEP = 170          // so nah kommt kein Weg der Tuer: sonst zeigt das Bild wieder "vor dem Laden"
const R = 400                  // Halbmesser des Kreises. Nur ein Bild fuer "in der Naehe", keine Entfernung
const INSET = 46               // so weit ist die Kundin im Kreis, wenn das Handy brummt: klar drin, noch weit weg
const K = 0.62                 // die Figur der Strasse, verkleinert: auf der Karte ist sie eine Spielfigur
const FW = WALKER.w * K, FH = WALKER.h * K
const PIN = 150                // Groesse der Ortsnadel; ihre Spitze sitzt bei 50 % / 92 %
const LABEL_TOP = SHOP.y + 82  // Namensschild unter der Nadel, auf der Strasse vor dem Laden
// Die Karte ist links und rechts breiter als das Bild: so kann die Kamera ("camera" im Skript)
// zur Seite ruecken, ohne dass der Stadtplan an einer Kante aufhoert.
const PAD = 400
const FADE = 640               // ab hier ist die Karte voll sichtbar, darueber blendet sie zum Textbereich hin aus
// Wo die Kunden im Blick des Betreibers stehen: rund um den Laden, alle im Kreis, keiner vor der Tuer
// (leicht ungleich verteilt: vier Figuren im Quadrat saehen gestellt aus). Jeder geht waehrend des Bildes
// DRIFT px auf seinen Platz zu; auch am Anfang dieses Stuecks muss er schon im Kreis stehen.
const SPOTS = [{ c: 0.58, r: 1, face: 1 }, { c: 2.58, r: 1, face: -1 }, { c: 0.86, r: 3, face: 1 }, { c: 2.3, r: 3, face: -1 }]
const DRIFT = 34
// "spread": die beiden unteren stehen weiter aussen. Mit den Plaetzen oben stehen sie eng neben dem
// Namensschild, und die vier wirken wie zwei oben, zwei am Schild statt wie "rund um den Laden".
// In Reihe 3 ist der Kreis schmal: weiter aussen passt nur, wer waehrend des Bildes weniger weit geht.
const SPOTS_WIDE = [SPOTS[0], SPOTS[1], { c: 0.77, r: 3, face: 1, drift: 16 }, { c: 2.41, r: 3, face: -1, drift: 16 }]
const whole = v => Math.abs(v - Math.round(v)) < 1e-6

// ---- Der Stadtplan als SVG: Strassen sind die helle Flaeche, darauf dunkle Bloecke mit Haeusern.
// Festes Muster, kein Zufall: jedes Bild muss bei jedem Bau gleich sein.
function plan(B) {
  const C = { street: '#372E86', block: '#160F3B', house: '#1D1650', plaza: '#292070', park: '#1A1B52', tree: 'rgba(185,176,255,.2)', shop: '#4A40A8', trim: '#8E82F5' }
  const h = STREET / 2, r = (x, y, w, hh, fill, rx = 10, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${hh}" rx="${rx}" fill="${fill}"${extra}/>`
  let out = r(-PAD, 0, 1080 + 2 * PAD, 1920, C.street, 0)
  for (let ci = -3; ci <= 5; ci++) for (let ri = -2; ri <= 4; ri++) {
    const x0 = gx(ci) + h, y0 = gy(ri) + h, w = COLW - STREET, hh = ROWH - STREET
    if (ci === 0 && ri === 0) {
      // Platz mit ein paar Baeumen: eine offene Flaeche, an der die Kundin entlanggeht
      // (bewusst ohne Brunnen-Ring in der Mitte: ein Ring auf der Karte sieht aus wie ein zweites Ziel)
      out += r(x0, y0, w, hh, C.plaza, 18)
      for (const [dx, dy] of [[34, 34], [w / 2, 34], [w - 34, 34], [34, hh - 34], [w / 2, hh - 34], [w - 34, hh - 34]]) out += `<circle cx="${x0 + dx}" cy="${y0 + dy}" r="14" fill="${C.tree}"/>`
      continue
    }
    if (ci === 2 && ri === 2) {
      out += r(x0, y0, w, hh, C.park, 18)
      for (const [dx, dy, rr] of [[44, 46, 24], [112, 38, 18], [170, 60, 22], [60, 118, 20], [130, 112, 26], [182, 138, 16], [92, 160, 15]]) out += `<circle cx="${x0 + dx}" cy="${y0 + dy}" r="${rr}" fill="${C.tree}"/>`
      continue
    }
    out += r(x0, y0, w, hh, C.block, 16)
    const a = x0 + 14, b = y0 + 14, iw = w - 28, ih = hh - 28, g = 10
    if (ci === 1 && ri === 1) {
      // Der Block des Ladens: Nachbarhaeuser oben, unten an der Strasse der Laden selbst mit
      // gestreifter Markise zur Strasse hin (dieselben Streifen wie an der Ladenfront von der Seite)
      out += r(a, b, iw * 0.46, 70, C.house) + r(a + iw * 0.46 + g, b, iw * 0.54 - g, 70, C.house) + r(a, b + 80, 46, ih - 80, C.house)
      const sx = a + 56, sw = iw - 56, sy = b + 80, sh = ih - 80
      out += r(sx, sy, sw, sh, C.shop, 10, ` stroke="${C.trim}" stroke-width="4"`)
      for (let i = 0; i < 6; i++) out += `<rect x="${sx - 4 + i * (sw + 8) / 6}" y="${sy + sh - 2}" width="${(sw + 8) / 6}" height="20" fill="${i % 2 ? '#5A4FCF' : B.lilac}"/>`
      continue
    }
    switch (((ci + 3) * 3 + (ri + 2) * 5) % 4) {
      case 0: out += r(a, b, (iw - g) / 2, ih, C.house) + r(a + (iw + g) / 2, b, (iw - g) / 2, ih, C.house); break
      case 1: out += r(a, b, iw, (ih - g) * 0.42, C.house) + r(a, b + (ih - g) * 0.42 + g, (iw - g) * 0.6, (ih - g) * 0.58, C.house) + r(a + (iw - g) * 0.6 + g, b + (ih - g) * 0.42 + g, (iw - g) * 0.4, (ih - g) * 0.58, C.house); break
      case 2: out += r(a, b, (iw - g) * 0.4, ih, C.house) + r(a + (iw - g) * 0.4 + g, b, (iw - g) * 0.6, (ih - g) / 2, C.house) + r(a + (iw - g) * 0.4 + g, b + (ih + g) / 2, (iw - g) * 0.6, (ih - g) / 2, C.house); break
      default: for (const [i, j] of [[0, 0], [1, 0], [0, 1], [1, 1]]) out += r(a + i * (iw + g) / 2, b + j * (ih + g) / 2, (iw - g) / 2, (ih - g) / 2, C.house)
    }
  }
  return `<svg class="abs sm-plan" width="${1080 + 2 * PAD}" height="1920" viewBox="${-PAD} 0 ${1080 + 2 * PAD} 1920">${out}</svg>`
}

export default {
  title: 'Karte von oben: Laden, Kreis "in der Nähe", Kundin eine Straße weiter',
  use: 'Zeigt, dass niemand vor dem Laden stehen muss: die Kundin geht eine Straße weiter, tritt in den Kreis "in der Nähe", und ihr Handy zeigt die Karte, sichtbar entfernt von der Ortsnadel. Mit "track" die Frage, ob der Laden einen verfolgt, mit "view": "owner" mehrere Kunden rund um den eigenen Laden. Nie eine Entfernung in Zahlen dazuschreiben.',
  params: {
    shop: { default: 'Café Nordwind', doc: 'Name am Schild unter der Ortsnadel und in der kleinen Karten-Benachrichtigung (höchstens etwa 22 Zeichen, längere werden kleiner gesetzt)', same: 'Ladenname' },
    icon: { default: 'cup', doc: 'Symbol in der Ortsnadel und in der Benachrichtigung: cup, bread, scissors, star, heart, check', same: 'Symbol' },
    view: { default: 'walker', doc: '"walker": eine Kundin geht ihren Weg ("path"). "owner": Blick des Betreibers, mehrere Kunden stehen rund um den Laden und ihre Handys leuchten auf ("phones")' },
    path: { default: [[-0.75, 1], [0.55, 1]], doc: 'Weg der Kundin als Liste von Punkten [Spalte, Reihe] im Straßennetz: Spalten 0 bis 3 von links, Reihen 0 bis 3 von oben, Zwischenwerte zwischen zwei Kreuzungen, Werte unter 0 oder über 3 außerhalb des Bildes. Der Laden liegt zwischen Spalte 1 und 2 an Reihe 2, seine Tür zeigt zur Reihe 2. Jeder Abschnitt folgt einer Straße; ein Weg an der Tür vorbei wird abgelehnt. Den Weg kurz hinter dem Rand des Kreises enden lassen: wer nach dem Brummen weitergeht, steht am Ende doch wieder nah am Laden' },
    via: { default: -1, doc: 'Wo die Kundin auf den Anker "buzz" ist, als Anteil des Weges (0 bis 1). -1 = von selbst: dort, wo ihr Weg in den Kreis tritt (auch wenn der Kreis nicht gezeigt wird)' },
    walker: { default: true, doc: 'Kundin zeigen (false: nur Karte, Ortsnadel und Kreis)' },
    circle: { default: true, doc: 'Weichen Kreis um die Ortsnadel zeigen ("in der Nähe"). Steht nie mit einer Zahl im Bild' },
    notify: { default: true, doc: 'Das Handy der Kundin brummt und zeigt die kleine Karten-Benachrichtigung (Anker "buzz")' },
    note: { default: '', doc: 'Zweite Zeile in der kleinen Benachrichtigung, z. B. "6 von 6, dein Kaffee wartet" (höchstens etwa 30 Zeichen). Leer = nur der Ladenname' },
    track: { default: false, doc: 'Auge an der Ortsnadel mit Blicklinie zur Kundin und Fragezeichen; reißt auf den Anker "no" ab. Für die Frage, ob der Laden einen verfolgt' },
    phones: { default: 4, doc: 'Nur bei "view": "owner": wie viele Kunden rund um den Laden stehen, 0 bis 4 (Anker phone1, phone2, ...). Alle stehen im Kreis, keiner vor der Tür' },
    spread: { default: false, doc: 'Nur bei "view": "owner": die beiden unteren Kunden stehen weiter außen, noch im Kreis. So verteilen sich alle vier rund um den Laden, statt dass zwei unten eng am Namensschild stehen' },
    whoosh: { default: 0.16, doc: 'Lautstärke des Wisch-Tons, wenn der Kreis aufgeht (0 bis 1, 0 = aus). Die Vorgabe ist bewusst leise' }
  },
  captions: { min: 1 },
  anchors: p => {
    const a = {}
    if (p.view === 'owner') {
      a.shine = { at: 'start', offset: 0.05, doc: 'Blick des Betreibers: die Ortsnadel des eigenen Ladens leuchtet auf (Ton: pop)' }
      for (let i = 0; i < p.phones; i++) a['phone' + (i + 1)] = { at: 'start', offset: +(0.5 + i * 0.3).toFixed(2), doc: `Handy ${i + 1} rund um den Laden leuchtet auf (Ton: pop, jedes etwas höher). Im Skript auf ein Wort legen und "offset": 0 dazuschreiben, sonst bleibt der Versatz der Vorgabe stehen` }
    } else if (p.walker) {
      a.walk = { at: 'start', offset: 0, doc: 'Die Kundin geht los' }
      if (p.notify) a.buzz = { cap: 0, word: -1, doc: 'Das Handy brummt, die kleine Karte springt auf (Töne: buzz, pop). Die Kundin ist dann am Punkt "via": von selbst genau dort, wo sie in den Kreis tritt' }
      a.arrive = { at: 'end', offset: -0.2, doc: 'Die Kundin kommt am Ende ihres Weges an und bleibt stehen' }
    }
    if (p.circle) a.circle = { at: 'start', offset: 0.1, doc: 'Der Kreis "in der Nähe" geht auf (Ton: leiser whoosh)' }
    if (p.track) {
      a.eye = { cap: 0, word: 0, doc: 'Das Auge an der Ortsnadel geht auf, die Blicklinie folgt der Kundin (Ton: pop). Auf "Verfolgt"' }
      a.no = { cap: -1, word: 0, doc: 'Die Blicklinie reißt ab, das Auge wird durchgestrichen (Ton: drop). Auf "Nein"' }
    }
    return a
  },
  demo: {
    params: { note: '6 von 6, dein Kaffee wartet' },
    captions: [{ lines: ['Kommst du in die Nähe,', 'meldet sich dein Handy.'], accent: 4 }],
    at: { cap: 0, word: -1, offset: 0.7 }
  },
  css: `
  /* Zum Textbereich hin blendet die Karte aus, an derselben Stelle wie die Kamera-Ebene der
     Engine: ein Stadtplan, der unter den Woertern weiterliefe, machte sie schwer lesbar. */
  .sm-map { position: absolute; left: ${-PAD}px; right: ${-PAD}px; top: 0; bottom: 0; -webkit-mask-image: linear-gradient(180deg, transparent 0, transparent 522px, #000 ${FADE}px); mask-image: linear-gradient(180deg, transparent 0, transparent 522px, #000 ${FADE}px); }
  .sm-in { position: absolute; left: ${PAD}px; top: 0; width: 1080px; height: 1920px; }
  .sm-plan { left: ${-PAD}px; top: 0; }
  .sm-shade { left: ${-PAD}px; right: ${-PAD}px; top: 1480px; bottom: 0; z-index: 1; background: linear-gradient(180deg, rgba(14,10,36,0), rgba(14,10,36,.62)); }
${zoneCss('sm')}
  .sm-pinglow { left: ${SHOP.x - 150}px; top: ${SHOP.y - 232}px; width: 300px; height: 300px; border-radius: 50%; opacity: 0; z-index: 4;
    background: radial-gradient(closest-side, rgba(185,176,255,.75), rgba(185,176,255,0)); }
  .sm-pin { left: ${SHOP.x - PIN / 2}px; top: ${Math.round(SHOP.y - PIN * 0.92)}px; width: ${PIN}px; height: ${PIN}px; z-index: 6; color: var(--card-to);
    transform-origin: 50% 92%; filter: drop-shadow(0 14px 16px rgba(0,0,0,.55)); }
  .sm-pin > svg { display: block; }
  .sm-dot { left: ${SHOP.x - 9}px; top: ${SHOP.y - 9}px; width: 18px; height: 18px; border-radius: 50%; background: #fff; z-index: 5; box-shadow: 0 0 0 6px rgba(185,176,255,.4); }
  .sm-label { left: ${SHOP.x}px; top: ${LABEL_TOP}px; translate: -50% 0; z-index: 6; padding: 10px 22px 12px; border-radius: 14px; background: var(--paper); color: var(--ink);
    font: 700 36px/1.15 var(--display); letter-spacing: -.01em; white-space: nowrap; box-shadow: 0 10px 22px rgba(0,0,0,.45); }

  .sm-cust { width: 0; height: 0; }
  .sm-puck { position: absolute; left: -23px; top: -23px; width: 46px; height: 46px; border-radius: 50%; background: var(--lilac); border: 5px solid #fff;
    box-shadow: 0 0 0 11px rgba(185,176,255,.26), 0 6px 14px rgba(0,0,0,.45); }
  .sm-body { position: absolute; left: ${-WALKER.w / 2}px; top: ${-WALKER.h - 2}px; width: ${WALKER.w}px; height: ${WALKER.h}px; transform-origin: 50% 100%; scale: ${K};
    filter: drop-shadow(0 8px 10px rgba(0,0,0,.5)); }
${walkerCss('sm')}
  .sm-note { width: 0; height: 0; z-index: 9; }
${chipCss('sm')}
  .sm-mini { position: absolute; top: ${Math.round(-FH - 20 - 64)}px; width: 64px; height: 64px; border-radius: 18px; opacity: 0; color: var(--card-to);
    background: #fff; display: grid; place-items: center; box-shadow: 0 12px 22px rgba(0,0,0,.5), 0 0 0 5px rgba(185,176,255,.55); }
  .sm-mini svg { width: 40px; }
  .sm-box { position: absolute; inset: 0; }
${badgeCss('sm')}
  /* auf der Karte etwas kleiner als an der Ladenfront: neben der Nadel soll das Auge nicht groesser wirken als der Laden */
  .sm-map .sm-badge { width: 108px; height: 108px; }
  .sm-map .sm-badge svg { width: 66px; height: 66px; }
  .sm-map .sm-q { width: 72px; height: 72px; font-size: 52px; }
  `,
  build(ctx) {
    const { p, key, loop, pop, cue, el } = ctx, { BACK, OUT } = ctx.ease, B = ctx.B
    const owner = p.view === 'owner'
    if (!['walker', 'owner'].includes(p.view)) ctx.fail(`"view" muss "walker" oder "owner" sein (bekam "${p.view}")`)
    if (!Number.isInteger(p.phones) || p.phones < 0 || p.phones > SPOTS.length) ctx.fail(`"phones" muss zwischen 0 und ${SPOTS.length} liegen: mehr Kunden passen nicht in den Kreis, ohne dass einer vor der Tür steht`)
    if (owner && p.track) ctx.fail('"track" (verfolgt mich der Laden?) gehört zur Kundin, nicht zum Blick des Betreibers')

    // ---- Karte, Ortsnadel, Namensschild. Alles haengt in .sm-in und ist in Buehnen-Pixeln gesetzt.
    ctx.html(`<div class="sm-map"><div class="sm-in">${plan(B)}<div class="abs sm-shade"></div></div></div>`)
    const map = ctx.$('.sm-in'), add = h => map.insertAdjacentHTML('beforeend', h)
    const cup = `<circle cx="75" cy="56" r="29" fill="#fff"/><svg class="ico" x="56" y="37" width="38" height="38" viewBox="0 0 24 24"><use href="#ico-${p.icon}"/></svg>`
    add(`<div class="abs sm-pinglow"></div><div class="abs sm-dot"></div>
      <div class="abs sm-pin" data-safe="Ortsnadel des Ladens" data-apart="karte" data-label="Ortsnadel des Ladens">${pinSvg(B, PIN, cup)}</div>
      <div class="abs sm-label" data-safe="Ladenname an der Ortsnadel" data-oneline="Ladenname an der Ortsnadel"></div>`)
    const label = ctx.$('.sm-label'); label.textContent = p.shop
    // Fuer die Pruefung "ueberdeckung" zaehlt das ganze Schild, nicht nur seine Schrift: ein leeres
    // Feld ueber dem Schild wird mit seinem Kasten gemessen. Sonst duerfte eine Karte ueber einem
    // Kunden den Rand des Schildes ueberdecken, solange sie die Buchstaben nicht beruehrt.
    label.insertAdjacentHTML('beforeend', '<u class="sm-box" data-apart="karte" data-label="Ladenname an der Ortsnadel"></u>')
    // Langer Ladenname: kleiner setzen. Unter 28 px ist er auf dem Handy kaum noch zu lesen.
    if (ctx.fit(label, 400, 22) < 28) ctx.warn(`der Ladenname "${p.shop}" steht an der Ortsnadel sehr klein. Namen kürzen.`)
    // Was die Benachrichtigung nie verdecken darf: Nadel und Schild (mit etwas Luft)
    const lw = label.offsetWidth, lh = label.offsetHeight
    const KEEP = [{ l: SHOP.x - 54, t: SHOP.y - PIN * 0.92 + 6, r: SHOP.x + 54, b: SHOP.y + 4 }, { l: SHOP.x - lw / 2, t: LABEL_TOP, r: SHOP.x + lw / 2, b: LABEL_TOP + lh }]

    // ---- Kreis "in der Naehe": weich, ohne Zahl
    if (p.circle) {
      add(`<div class="abs sm-zone" style="left:${SHOP.x - R}px;top:${SHOP.y - R}px;width:${2 * R}px;height:${2 * R}px"><u></u></div>`)
      const tz = ctx.at('circle')
      key('.sm-zone', [[tz, { opacity: 0, scale: 0.55 }, OUT], [tz + 0.55, { opacity: 1, scale: 1 }]])
      // langsames Atmen, damit der Kreis nicht wie eine feste Grenze wirkt
      loop('.sm-zone u', [{ opacity: 0.75, scale: 1 }, { opacity: 0, scale: 1.09 }], 2.2)
      if (p.whoosh > 0) cue(tz, 'whoosh', p.whoosh)
    }

    // Eine Figur auf der Karte: Standpunkt (heller Punkt wie die eigene Position auf einer Karte)
    // und darauf die verkleinerte Figur der Strasse. Wer weiter unten steht, steht weiter vorn.
    const customer = (x, y, face) => {
      const c = el('div', 'abs sm-cust', `<i class="sm-puck"></i><div class="sm-body">${walkerFigure('sm', face < 0 ? 'flip' : '')}</div>`)
      c.style.left = x.toFixed(1) + 'px'; c.style.top = y.toFixed(1) + 'px'; c.style.zIndex = y > SHOP.y ? 7 : 5
      map.append(c); return c
    }

    // ---- Kundin auf ihrem Weg
    if (!owner && p.walker) {
      // Weg pruefen: jeder Punkt auf einer Strasse, jeder Abschnitt entlang EINER Strasse, nie an der Tuer vorbei
      if (!Array.isArray(p.path) || p.path.length < 2) ctx.fail('"path" braucht mindestens zwei Punkte [Spalte, Reihe]')
      const pts = p.path.map((q, i) => {
        if (!Array.isArray(q) || q.length !== 2 || q.some(v => typeof v !== 'number' || !Number.isFinite(v))) ctx.fail(`"path", Punkt ${i + 1}: erwartet [Spalte, Reihe] als zwei Zahlen`)
        if (!whole(q[0]) && !whole(q[1])) ctx.fail(`"path", Punkt ${i + 1} [${q.join(', ')}] liegt mitten in einem Häuserblock. Spalte oder Reihe muss eine ganze Zahl sein, dort verläuft eine Straße`)
        return { c: q[0], r: q[1], x: gx(q[0]), y: gy(q[1]) }
      })
      const cum = [0], face = []
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1], b = pts[i], row = whole(a.r) && Math.abs(a.r - b.r) < 1e-6, col = whole(a.c) && Math.abs(a.c - b.c) < 1e-6
        if (!row && !col) ctx.fail(`"path": von Punkt ${i} nach Punkt ${i + 1} ginge es quer durch einen Häuserblock. Jeder Abschnitt folgt einer Straße (gleiche ganze Reihe oder gleiche ganze Spalte)`)
        const d = Math.hypot(b.x - a.x, b.y - a.y)
        if (d < 1) ctx.fail(`"path": Punkt ${i} und Punkt ${i + 1} sind derselbe`)
        // Abstand des Abschnitts zur Ladentuer
        const u = Math.max(0, Math.min(1, ((DOOR.x - a.x) * (b.x - a.x) + (DOOR.y - a.y) * (b.y - a.y)) / (d * d)))
        if (Math.hypot(a.x + u * (b.x - a.x) - DOOR.x, a.y + u * (b.y - a.y) - DOOR.y) < DOOR_KEEP) ctx.fail(`"path" führt zwischen Punkt ${i} und Punkt ${i + 1} an der Ladentür vorbei. Genau das soll die Karte nicht zeigen: die Kundin geht eine Straße weiter (Reihe 1 oder 3) oder biegt vorher ab`)
        cum.push(cum[i - 1] + d); face.push(Math.sign(b.x - a.x))
      }
      // Blickrichtung je Abschnitt: auf einer Querstrasse schaut die Figur weiter dorthin, wohin sie davor ging
      for (let i = 0; i < face.length; i++) if (!face[i]) face[i] = face[i - 1] || face.slice(i).find(Boolean) || 1
      const len = cum[cum.length - 1]
      const at = d => {
        const dd = Math.max(0, Math.min(len, d)); let i = 1
        while (i < cum.length - 1 && dd > cum[i]) i++
        const a = pts[i - 1], b = pts[i], f = (dd - cum[i - 1]) / (cum[i] - cum[i - 1])
        return { x: a.x + f * (b.x - a.x), y: a.y + f * (b.y - a.y), seg: i - 1 }
      }
      const near = d => { const q = at(d); return Math.hypot(q.x - SHOP.x, q.y - SHOP.y) }
      // "via" von selbst: der erste Punkt des Weges, der klar im Kreis liegt
      let dVia = null
      if (p.notify) {
        if (p.via >= 0) {
          if (p.via > 1) ctx.fail('"via" ist ein Anteil des Weges zwischen 0 und 1 (oder -1 für "von selbst")')
          dVia = p.via * len
          if (p.circle && near(dVia) > R) ctx.fail('"via" liegt außerhalb des Kreises: das Handy meldete sich, bevor die Kundin in der Nähe ist. "via" weglassen, dann liegt der Punkt von selbst am Rand des Kreises')
        } else {
          for (let d = 0; d <= len; d += 2) if (near(d) <= R - INSET) { dVia = d; break }
          if (dVia == null) ctx.fail('"path" kommt nie in die Nähe des Ladens: kein Punkt des Weges liegt im Kreis. Den Weg näher heranführen oder "notify": false setzen')
          if (dVia === 0) ctx.fail('"path" beginnt schon im Kreis: dann hätte sich das Handy längst gemeldet. Den Weg außerhalb beginnen lassen (z. B. Spalte -0.75)')
        }
      }
      const tW = ctx.at('walk'), tA = ctx.at('arrive'), tB = p.notify ? ctx.at('buzz') : null
      if (!(tA > tW)) ctx.fail('Anker "arrive" muss nach "walk" liegen')
      if (p.notify && !(tB > tW && tB < tA + 0.001)) ctx.fail('Anker "buzz" muss zwischen "walk" und "arrive" liegen: die Kundin ist dann am Punkt "via"')
      // Zeit <-> Strecke: bis zum Brummen gleichmaessig bis "via", danach gleichmaessig bis ans Ende
      const stops = p.notify ? [[tW, 0], [tB, dVia], [tA, len]] : [[tW, 0], [tA, len]]
      const dAt = t => {
        if (t <= stops[0][0]) return 0
        for (let i = 1; i < stops.length; i++) if (t <= stops[i][0]) { const [t0, d0] = stops[i - 1], [t1, d1] = stops[i]; return d0 + (d1 - d0) * (t - t0) / (t1 - t0 || 1) }
        return len
      }
      const tOf = d => {
        for (let i = 1; i < stops.length; i++) { const [t0, d0] = stops[i - 1], [t1, d1] = stops[i]; if (d <= d1 + 1e-6) return d1 - d0 < 1e-6 ? t0 : t0 + (t1 - t0) * (d - d0) / (d1 - d0) }
        return stops[stops.length - 1][0]
      }
      const end = at(len), last = face[face.length - 1]
      const w = customer(end.x, end.y, last), body = w.querySelector('.sm-body')
      // Ruhelage = am Ende des Weges: dort messen die Pruefungen. Stuetzpunkte an jeder Ecke.
      const marks = [...new Set([...stops.map(s => s[1]), ...cum.slice(1, -1)].map(d => +d.toFixed(2)))].sort((a, b) => a - b)
      const move = marks.map(d => { const q = at(d); return [tOf(d), { translate: `${(q.x - end.x).toFixed(1)}px ${(q.y - end.y).toFixed(1)}px` }, 'linear'] })
      key(w, move)
      // An einer Ecke dreht sich die Figur um, wenn es danach in die andere Richtung geht
      const turn = [[tW, { scale: face[0] === last ? '1 1' : '-1 1' }]]
      for (let i = 1; i < face.length; i++) if (face[i] !== face[i - 1]) { const t = tOf(cum[i]); turn.push([t - 0.001, { scale: face[i - 1] === last ? '1 1' : '-1 1' }], [t, { scale: face[i] === last ? '1 1' : '-1 1' }]) }
      if (turn.length > 1) key(w.querySelector('.sm-fig'), turn)
      walkerSteps(key, body, 'sm', tW, tA)

      if (p.notify) {
        const note = el('div', 'abs sm-note'); note.style.left = end.x.toFixed(1) + 'px'; note.style.top = end.y.toFixed(1) + 'px'
        map.append(note); key(note, move)
        const chip = noteChip(ctx, 'sm', note, p, 360), cw = chip.offsetWidth, ch = chip.offsetHeight
        chip.dataset.apart = 'karte'; chip.dataset.label = 'Karten-Benachrichtigung'
        // Die Karte haengt ueber dem Kopf und zeigt mit ihrer Spitze aufs Handy. Auf dem ganzen
        // Stueck vom Brummen bis ans Ende darf sie nicht aus dem Bild laufen und weder Nadel noch
        // Schild verdecken: gerade der Abstand zwischen beiden ist die Aussage dieses Bildes.
        const dir = face[at(dVia).seg], phone = dir * (140 - WALKER.w / 2) * K, top = -FH - 28 - ch
        const tail = []; for (let d = dVia; d < len; d += 6) tail.push(at(d)); tail.push(end)
        const xs = tail.map(q => q.x), ys = tail.map(q => q.y), lo = Math.min(...xs), hi = Math.max(...xs)
        // rechts endet der Platz vor der Knopfspalte von TikTok, wenn die Karte auf deren Hoehe haengt
        const col = ctx.STAGE.column, inCol = Math.max(...ys) + top + ch > col.top && Math.min(...ys) + top < col.bottom
        const maxRight = inCol ? col.left - 14 : ctx.STAGE.w - 40, minLeft = 40
        let left = dir > 0 ? -FW / 2 + 16 : FW / 2 - 16 - cw
        if (hi + left + cw > maxRight) left = maxRight - cw - hi
        if (lo + left < minLeft) left = minLeft - lo
        // Oben blendet die Karte zum Textbereich hin aus (bis y = 640, FADE): eine Benachrichtigung, die
        // dort hinge, waere halb durchsichtig und stuende unter den Woertern.
        if (Math.min(...ys) + top < FADE) ctx.fail('Die Benachrichtigung der Kundin hinge im Textbereich: ihr Weg liegt beim Brummen zu weit oben. Reihe 1 nehmen, oder auf einer Querstraße erst unterhalb von Reihe 1 in den Kreis treten')
        for (const q of [at(dVia), end]) {
          const c = { l: q.x + left, t: q.y + top, r: q.x + left + cw, b: q.y + top + ch + 22 }
          if (KEEP.some(k => c.l < k.r + 14 && k.l < c.r + 14 && c.t < k.b + 14 && k.t < c.b + 14)) ctx.fail('Die Benachrichtigung der Kundin verdeckt Ortsnadel oder Namensschild. Den Weg so legen, dass sie beim Brummen und am Ende links, rechts oder oberhalb der Nadel steht (z. B. Reihe 1)')
        }
        chip.style.left = left.toFixed(1) + 'px'; chip.style.top = top.toFixed(1) + 'px'
        chip.style.setProperty('--tail', Math.max(20, Math.min(cw - 52, phone - left - 16)).toFixed(1) + 'px')
        chip.style.transformOrigin = `${Math.max(20, Math.min(cw - 20, phone - left)).toFixed(1)}px 100%`

        // das Handy brummt, der Bildschirm wird hell, die Karte springt auf
        walkerBuzz(key, body, 'sm', tB, OUT)
        key(chip, [[tB + 0.04, { opacity: 0, scale: 0.3 }, BACK], [tB + 0.46, { opacity: 1, scale: 1 }]])
        cue(tB, 'buzz', 0.6)
        cue(tB + 0.08, 'pop', 0.85, 1.2)
        // der Standpunkt blitzt auf, der Kreis antwortet auf den Eintritt: einmal kurz heller
        key(w.querySelector('.sm-puck'), [[tB, { scale: 1 }, OUT], [tB + 0.14, { scale: 1.5 }, OUT], [tB + 0.6, { scale: 1 }]])
        if (p.circle) key('.sm-zone', [[ctx.at('circle'), { filter: 'brightness(1)' }], [tB, { filter: 'brightness(1)' }, OUT], [tB + 0.16, { filter: 'brightness(1.9)' }], [tB + 0.7, { filter: 'brightness(1)' }]])
      }

      // ---- "Verfolgt dich der Laden?": Auge an der Nadel, Blicklinie zum Kopf der Kundin, Fragezeichen
      if (p.track) {
        // Das Auge sitzt neben dem Kopf der Nadel, auf der Seite, von der die Kundin kommt:
        // so laeuft die Blicklinie nicht quer ueber die Nadel.
        const side = Math.sign((p.notify ? at(dVia) : end).x - SHOP.x) || 1
        const E = { x: SHOP.x + side * 118, y: SHOP.y - 104 }
        add(`<div class="abs sm-sight" style="left:${E.x}px;top:${E.y - 4}px"><i></i></div>
          <div class="abs sm-badge sm-eye" data-safe="Auge an der Ortsnadel" style="left:${E.x - 54}px;top:${E.y - 54}px">${EYE_SVG}<i class="sm-slash"></i></div>
          <div class="abs sm-q" style="left:${E.x + side * 34 - 36}px;top:${E.y - 124}px">?</div>`)
        const te = ctx.at('eye'), tn = ctx.at('no')
        if (!(tn > te)) ctx.fail('Anker "no" muss nach "eye" liegen')
        pop('.sm-eye', te, 0.4); cue(te, 'pop', 0.8, 0.8)
        // Die Blicklinie haengt am Auge und zeigt auf den Kopf. Die Kundin geht stueckweise
        // gleichmaessig, also reichen Stuetzpunkte alle 0,1 s (dazwischen rechnet der Browser gerade).
        const fr = []
        for (let t = te; t <= tn + 0.4; t = +(t + 0.1).toFixed(3)) {
          const q = at(dAt(t)), dx = q.x - E.x, dy = q.y - FH + 24 - E.y
          fr.push([t, { rotate: `${(Math.atan2(dy, dx) * 180 / Math.PI).toFixed(2)}deg`, width: `${Math.max(0, Math.hypot(dx, dy) - 30).toFixed(1)}px` }, 'linear'])
        }
        key('.sm-sight', fr)
        key('.sm-sight', [[te + 0.2, { opacity: 0 }, OUT], [te + 0.5, { opacity: 0.95 }], [tn, { opacity: 0.95 }, OUT], [tn + 0.22, { opacity: 0 }]])
        loop('.sm-sight i', [{ translate: '0px 0px' }, { translate: '-34px 0px' }], 0.5)
        // Aufspringen und Verschwinden stehen in EINER Bewegung: zwei getrennte auf denselben
        // Eigenschaften ueberschreiben sich, und das Fragezeichen stand dann schon da, bevor das Auge aufging.
        key('.sm-q', [[te + 0.3, { opacity: 0, scale: 0.4 }, BACK], [te + 0.7, { opacity: 1, scale: 1 }], [tn, { opacity: 1, scale: 1 }, OUT], [tn + 0.2, { opacity: 0, scale: 0.4 }]])
        cue(te + 0.3, 'pop', 0.7, 1.3)
        key('.sm-eye .sm-slash', [[tn, { scale: '0 1' }, OUT], [tn + 0.18, { scale: '1 1' }]])
        cue(tn, 'drop', 0.5)
      }
    }

    // ---- Blick des Betreibers: die Nadel ist sein Laden, rundherum leuchten Handys auf
    if (owner) {
      const ts = ctx.at('shine')
      key('.sm-pinglow', [[ts, { opacity: 0, scale: 0.6 }, OUT], [ts + 0.5, { opacity: 1, scale: 1 }]])
      key('.sm-pin', [[ts, { scale: 1 }, OUT], [ts + 0.16, { scale: 1.16 }, OUT], [ts + 0.55, { scale: 1 }]])
      key(label, [[ts, { scale: 1 }, OUT], [ts + 0.16, { scale: 1.08 }, OUT], [ts + 0.55, { scale: 1 }]])
      cue(ts, 'pop', 0.85, 0.8)
      for (let i = 0; i < p.phones; i++) {
        const s = (p.spread ? SPOTS_WIDE : SPOTS)[i], drift = s.drift ?? DRIFT, g = customer(gx(s.c), gy(s.r), s.face), body = g.querySelector('.sm-body')
        const mini = el('div', 'sm-mini', ctx.icon(p.icon) + `<u class="sm-box" data-apart="karte" data-label="Karte über Kunde ${i + 1}"></u>`)
        // die kleine Karte sitzt ueber dem Kopf, einen Hauch vom Laden weggerueckt
        mini.style.left = (-32 - s.face * 12) + 'px'; g.append(mini)
        // jeder geht langsam seine Strasse entlang: ein Bild, in dem alle stillstehen, wirkt wie ein Standfoto
        key(g, [[ctx.s, { translate: `${-s.face * drift}px 0px` }, 'linear'], [ctx.e, { translate: '0px 0px' }]])
        walkerSteps(key, body, 'sm', ctx.s, ctx.e + 0.3)
        const t = ctx.at('phone' + (i + 1))
        walkerBuzz(key, body, 'sm', t, OUT, false)
        key(g.querySelector('.sm-puck'), [[t, { scale: 1 }, OUT], [t + 0.14, { scale: 1.5 }, OUT], [t + 0.6, { scale: 1 }]])
        pop(mini, t + 0.04, 0.4)
        cue(t + 0.04, 'pop', 0.85, PITCH(i))
        if (i === 0) cue(t, 'buzz', 0.45)
      }
    }
  }
}
