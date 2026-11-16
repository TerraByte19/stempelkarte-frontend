// Strasse mit Ladenfront: jemand geht mit dem Handy vorbei, ein weicher Kreis
// um den Laden steht fuer "in der Naehe", und das Handy meldet sich mit einer
// kleinen Karten-Benachrichtigung, sobald die Figur in den Kreis tritt.
// Das Schluesselbild fuer alles rund um die Erinnerung auf dem Sperrbildschirm.
//
// Ein Bild, mehrere Ebenen, jede einzeln zuschaltbar - so traegt derselbe
// Baustein mehrere Saetze, ohne dass sich das Bild wiederholt:
//   circle   der Kreis "in der Naehe" (bewusst OHNE Meterangabe: die App kennt
//            mehrere Radien, ein Video soll keinen davon versprechen)
//   notify   das Handy brummt, die kleine Karte springt auf
//   track    Auge ueber dem Laden mit Blicklinie zur Figur ("Verfolgt dich der
//            Laden?"), die auf den Anker "no" abreisst
//   card     Wallet-Karte im Vordergrund, eine Ortsnadel auf der Karte und eine
//            auf dem Laden ("In der Karte steht, wo der Laden ist")
//   privacy  zwei durchgestrichene Zeichen am Laden: nichts gesendet, nichts gesehen
//   view     "owner": Blick des Betreibers - er steht in der Tuer, vor dem Laden
//            leuchten mehrere Handys auf
//   across   der Passant geht auf der ANDEREN Strassenseite vorbei, der Laden steht
//            klein im Hintergrund. Dazugekommen, weil in der ersten Fassung des
//            zweiten Videos jedes Bild so aussah, als muesse man vor der Tuer stehen
//
// Figur, Karten-Benachrichtigung, Ortsnadel, Zeichen und Kreis kommen aus
// engine/parts.js: die Karte von oben (shop-map) zeigt dieselben, und beide
// Bilder sollen nie auseinanderlaufen.
//
// Alle Klassen beginnen mit "ss-": eine Szene aus mehreren Teilen traegt die
// Klassen aller ihrer Bausteine, und ".pin" oder ".chip" gibt es dort schon.
//
// Gezeichnet ist die Strasse in einem eigenen Mass (Gehweg bei y = 1300) und
// wird als Ganzes vergroessert und nach unten geschoben (SCALE, DROP): so
// fuellt sie den freien Bildbereich bis knapp ueber die untere Sperrzone, und
// Schild und Benachrichtigung sind auf dem Handy gut zu lesen. Alles, was in
// Buehnen-Pixeln gedacht ist (Wegpunkte als Anteil der Bildbreite, die Grenze
// vor der Knopfspalte), wird mit inX() in dieses Mass umgerechnet.

import { WALKER, walkerFigure, walkerCss, walkerSteps, walkerBuzz, chipCss, noteChip, pinSvg, EYE_SVG as EYE, badgeCss, zoneCss } from '../engine/parts.js'

// Tonhoehe der Pops, wenn mehrere Handys nacheinander aufleuchten
const PITCH = i => +(2 ** (i * 2 / 12)).toFixed(2)
const GROUND = 1300   // Oberkante Gehweg (eigenes Mass)
const FEET = 1418     // dort stehen die Figuren: etwas vor der Hauswand
const CX = 540        // Mitte des Ladens = Mitte des Kreises
const DOOR = 685      // Mitte der Tuer
const FIG_W = WALKER.w, FIG_H = WALKER.h
const SCALE = 1.16, DROP = 86
const R = 400         // Halbmesser des Kreises (eigenes Mass)
const CY = 1130       // Mitte des Kreises: mitten in der Ladenfront, so umschliesst er den ganzen Laden
// Wo die Figur (Koerpermitte) den Rand des Kreises kreuzt, gemessen von der Kreismitte aus
const EDGE = Math.sqrt(R * R - (FEET - FIG_H / 2 - CY) ** 2)
const inX = x => CX + (x - CX) / SCALE
// "across": der Laden samt Haeuserzeile rueckt als Ganzes nach hinten - kleiner und hoeher im
// Bild. Dazwischen liegt die Fahrbahn, vorn bleibt der Gehweg, auf dem der Passant geht.
const FAR_K = 0.6     // so klein steht die Haeuserzeile hinten
const FAR_GROUND = 1000 // dort liegt hinten die Kante zwischen Haus und Gehweg (eigenes Mass)
const FAR_WALK = 44   // Tiefe des hinteren Gehwegs

const PLANE = '<svg viewBox="0 0 24 24"><path d="M21 3.5 3 10.6l6.8 2.7L12.6 20 21 3.5Z"/><path d="M9.8 13.3 21 3.5"/></svg>'
const figure = (extra = '') => walkerFigure('ss', extra)
// Haus im Hintergrund: Fensterraster aus einem festen Muster (kein Zufall, jedes Bild muss gleich sein)
const house = (left, top, width, cols, lit, cls = '') => {
  let w = ''
  const rows = Math.ceil((GROUND - top - 60) / 92)
  for (let i = 0; i < cols * rows; i++) w += `<i${lit.includes(i) ? ' class="on"' : ''}></i>`
  return `<div class="abs ss-house ${cls}" style="left:${left}px;top:${top}px;width:${width}px;height:${GROUND - top}px;grid-template-columns:repeat(${cols},1fr)">${w}</div>`
}

export default {
  title: 'Straße mit Laden, Passant und Kreis "in der Nähe"',
  use: 'Zeigt, wie die Erinnerung wirklich entsteht: jemand geht am Laden vorbei, tritt in den Kreis "in der Nähe", und das eigene Handy meldet sich. Mit "view": "owner" derselbe Ort aus Sicht des Betreibers. Nie eine Entfernung in Zahlen dazuschreiben.',
  params: {
    shop: { default: 'Café Nordwind', doc: 'Name auf dem Ladenschild und in der kleinen Karten-Benachrichtigung (höchstens etwa 22 Zeichen, längere werden kleiner gesetzt)', same: 'Ladenname' },
    icon: { default: 'cup', doc: 'Symbol im Schaufenster und in der Benachrichtigung: cup, bread, scissors, star, heart, check', same: 'Symbol' },
    view: { default: 'walker', doc: '"walker": ein Passant geht vorbei. "owner": Blick des Betreibers, er steht in der Tür und vor dem Laden leuchten Handys auf' },
    direction: { default: 'right', doc: 'Laufrichtung des Passanten: "right" (von links nach rechts) oder "left"' },
    walker: { default: true, doc: 'Passanten zeigen (false: nur die Straße, z. B. zusammen mit "card")' },
    from: { default: -0.1, doc: 'Start des Passanten als Anteil der Bildbreite in Laufrichtung: 0 = Bildrand, an dem er hereinkommt, 1 = gegenüberliegender Rand, die Tür liegt bei etwa 0,65 (von rechts kommend 0,35)' },
    to: { default: 0.56, doc: 'Ziel des Passanten (Anteil der Bildbreite wie bei "from"). Dort bleibt er auf den Anker "arrive" stehen' },
    via: { default: -1, doc: 'Wo der Passant auf den Anker "buzz" ist (Anteil der Bildbreite). -1 = von selbst: mit Kreis genau am Rand des Kreises, ohne Kreis auf halbem Weg' },
    circle: { default: true, doc: 'Weichen Kreis um den Laden zeigen ("in der Nähe"). Steht nie mit einer Zahl im Bild' },
    notify: { default: true, doc: 'Das Handy des Passanten brummt und zeigt die kleine Karten-Benachrichtigung (Anker "buzz")' },
    note: { default: '', doc: 'Zweite Zeile in der kleinen Benachrichtigung, z. B. "6 von 6" (höchstens etwa 22 Zeichen). Leer = nur der Ladenname' },
    track: { default: false, doc: 'Auge über dem Laden mit Blicklinie zum Passanten und Fragezeichen; reißt auf den Anker "no" ab. Für die Frage, ob der Laden einen verfolgt' },
    card: { default: false, doc: 'Wallet-Karte im Vordergrund; auf den Anker "pin" erscheint eine Ortsnadel auf der Karte und eine auf dem Laden. Nur ohne Passanten ("walker": false)' },
    privacy: { default: false, doc: 'Zwei durchgestrichene Zeichen über dem Laden: Senden (Anker "nosend") und Sehen (Anker "nosee")' },
    phones: { default: 3, doc: 'Nur bei "view": "owner": wie viele Kunden mit Handy vor dem Laden stehen, 0 bis 3 (Anker phone1, phone2, ...)' },
    across: { default: false, doc: 'Der Passant geht auf der ANDEREN Straßenseite vorbei: der Laden steht klein im Hintergrund, dazwischen liegt die Fahrbahn. Zeigt, dass niemand vor der Tür stehen muss. Nur mit Passant; "circle", "track", "card" und "privacy" gibt es in diesem Bild nicht ("circle": false dazuschreiben)' },
    shopAt: { default: 0.68, doc: 'Nur bei "across": wo die Mitte des Ladens im Hintergrund liegt, als Anteil der Bildbreite von links (0,3 bis 0,7). Den Passanten auf den Anker "buzz" auf die andere Bildhälfte legen ("via"), sonst deckt die Benachrichtigung den Laden zu' },
    whoosh: { default: 0.16, doc: 'Lautstärke des Wisch-Tons, wenn der Kreis aufgeht (0 bis 1, 0 = aus). Die Vorgabe ist bewusst leise' }
  },
  captions: { min: 1 },
  anchors: p => {
    const a = {}
    if (p.view === 'owner') {
      a.shine = { cap: 0, word: 0, doc: 'Blick des Betreibers: Tür und Schild leuchten auf, der Betreiber tritt in die Tür (Ton: pop). Auf "dein Laden"' }
      for (let i = 0; i < p.phones; i++) a['phone' + (i + 1)] = { at: 'start', offset: +(0.5 + i * 0.3).toFixed(2), doc: `Handy ${i + 1} vor der Tür leuchtet auf (Ton: pop, jedes etwas höher). Im Skript auf ein Wort legen und "offset": 0 dazuschreiben, sonst bleibt der Versatz der Vorgabe stehen` }
    } else if (p.walker) {
      a.walk = { at: 'start', offset: 0, doc: 'Der Passant geht los' }
      if (p.notify) a.buzz = { cap: 0, word: -1, doc: 'Das Handy brummt, die kleine Karte springt auf (Töne: buzz, pop). Mit Kreis ist das genau der Moment, in dem der Passant in den Kreis tritt' }
      a.arrive = { at: 'end', offset: -0.2, doc: 'Der Passant kommt am Ziel ("to") an und bleibt stehen' }
    }
    if (p.circle) a.circle = { at: 'start', offset: 0.1, doc: 'Der Kreis "in der Nähe" geht auf (Ton: leiser whoosh)' }
    if (p.track) {
      a.eye = { cap: 0, word: 0, doc: 'Das Auge über dem Laden geht auf, die Blicklinie folgt dem Passanten (Ton: pop). Auf "Verfolgt"' }
      a.no = { cap: -1, word: 0, doc: 'Die Blicklinie reißt ab, das Auge wird durchgestrichen (Ton: drop). Auf "Nein"' }
    }
    if (p.card) {
      a.card = { at: 'start', offset: 0.2, doc: 'Die Wallet-Karte kommt ins Bild (Ton: pop)' }
      a.pin = { cap: 0, word: -1, doc: 'Ortsnadel auf der Karte, gleich danach eine auf dem Laden (Töne: pop, pop). Auf "wo der Laden ist"' }
    }
    if (p.privacy) {
      a.nosend = { cap: 0, word: -1, doc: 'Das Zeichen für Senden erscheint und wird durchgestrichen (Töne: pop, tick). Auf "nichts"' }
      a.nosee = { cap: -1, word: -1, doc: 'Das Auge erscheint und wird durchgestrichen (Töne: pop, tick). Auf "sieht nicht"' }
    }
    return a
  },
  demo: {
    params: { note: '6 von 6' },
    captions: [{ lines: ['Kommst du in die Nähe,', 'meldet sich dein Handy.'], accent: 4 }],
    at: { cap: 0, word: -1, offset: 0.7 }
  },
  css: `
  .ss-world { position: absolute; inset: 0; transform-origin: ${CX}px ${GROUND}px; transform: translateY(${DROP}px) scale(${SCALE}); }
  .ss-house { display: grid; align-content: start; gap: 34px 26px; padding: 44px 30px 0; background: #1F1850; border-radius: 10px 10px 0 0; }
  .ss-house.near { background: #261E60; }
  .ss-house i { height: 58px; border-radius: 6px; background: rgba(185,176,255,.1); }
  .ss-house i.on { background: rgba(185,176,255,.4); }
  .ss-shop { left: 280px; top: 730px; width: 520px; height: 570px; background: #332A7C; border-radius: 10px 10px 0 0; }
  .ss-roof { position: absolute; left: -14px; right: -14px; top: -22px; height: 28px; border-radius: 8px; background: #4A40A8; }
  .ss-sign { position: absolute; left: 40px; top: 34px; width: 440px; height: 98px; border-radius: 16px; background: var(--paper); color: var(--ink);
    display: grid; place-items: center; font: 700 52px var(--display); letter-spacing: -.01em; box-shadow: 0 10px 24px rgba(0,0,0,.4); white-space: nowrap; }
  .ss-awn { position: absolute; left: -26px; right: -26px; top: 160px; height: 76px; border-radius: 8px 8px 24px 24px;
    background: repeating-linear-gradient(90deg, var(--lilac) 0 44px, #5A4FCF 44px 88px); box-shadow: 0 14px 22px rgba(0,0,0,.35); }
  .ss-win { position: absolute; left: 40px; top: 272px; width: 250px; height: 226px; border-radius: 14px; border: 8px solid #4A40A8;
    background: linear-gradient(180deg, rgba(185,176,255,.4), rgba(185,176,255,.14)); color: rgba(255,255,255,.5); }
  .ss-win svg { position: absolute; left: 24px; top: 18px; width: 74px; }
  .ss-door { position: absolute; left: 330px; top: 280px; width: 150px; height: 290px; border-radius: 14px 14px 0 0; background: #17113C; border: 8px solid #4A40A8; border-bottom: 0; }
  .ss-glass { position: absolute; left: 16px; right: 16px; top: 16px; height: 128px; border-radius: 8px; background: linear-gradient(180deg, rgba(185,176,255,.55), rgba(185,176,255,.2)); }
  .ss-knob { position: absolute; right: 12px; top: 172px; width: 14px; height: 14px; border-radius: 50%; background: var(--lilac); }
  .ss-doorglow { position: absolute; left: 250px; top: 200px; width: 310px; height: 420px; border-radius: 50%; opacity: 0;
    background: radial-gradient(closest-side, rgba(185,176,255,.6), rgba(185,176,255,0)); }
  .ss-far { position: absolute; inset: 0; transform-origin: ${CX}px ${GROUND}px; }
  .ss-road { left: -200px; right: -200px; background: linear-gradient(180deg, #0F0A2A, #150F38); }
  .ss-road i { position: absolute; left: 0; right: 0; top: 46%; height: 9px; background: repeating-linear-gradient(90deg, rgba(185,176,255,.34) 0 74px, transparent 74px 132px); }
${zoneCss('ss')}
  .ss-walker { top: ${FEET - FIG_H}px; width: ${FIG_W}px; height: ${FIG_H}px; z-index: 6; }
${walkerCss('ss')}${chipCss('ss')}  .ss-chip { bottom: ${FIG_H + 26}px; }
${badgeCss('ss')}
  .ss-card { left: 132px; top: 1136px; width: 430px; padding: 26px 28px 30px; border-radius: 30px; rotate: -5deg; opacity: 0; z-index: 7;
    background: linear-gradient(163deg, var(--card-from), var(--card-to)); box-shadow: 0 26px 50px rgba(0,0,0,.55), inset 0 0 0 2px rgba(255,255,255,.16); }
  .ss-chead { display: flex; align-items: center; gap: 16px; }
  .ss-chead span { flex: none; width: 58px; height: 58px; border-radius: 15px; background: #fff; color: var(--card-to); display: grid; place-items: center; }
  .ss-chead span svg { width: 36px; }
  .ss-chead b { font: 600 33px var(--display); white-space: nowrap; }
  .ss-cdots { display: flex; gap: 14px; margin-top: 22px; }
  .ss-cdots i { width: 42px; height: 42px; border-radius: 50%; border: 3px dashed rgba(255,255,255,.4); }
  .ss-cdots i.on { border: 0; background: #fff; }
  .ss-cloc { display: flex; align-items: center; gap: 12px; margin-top: 20px; height: 52px; padding: 0 18px; border-radius: 16px; background: rgba(255,255,255,.14); }
  .ss-cloc u { flex: 1; height: 12px; border-radius: 6px; background: rgba(255,255,255,.3); }
  .ss-cpin { position: absolute; right: 6px; bottom: 26px; opacity: 0; filter: drop-shadow(0 10px 14px rgba(0,0,0,.4)); }
  .ss-spin { opacity: 0; z-index: 8; filter: drop-shadow(0 14px 20px rgba(0,0,0,.45)); }
  .ss-link { z-index: 7; opacity: 0; overflow: visible; }

  .ss-keeper { left: ${DOOR - 70}px; top: ${GROUND - 262}px; width: 140px; height: 262px; opacity: 0; z-index: 4; }
  .ss-keeper .kh { position: absolute; left: 38px; top: 0; width: 64px; height: 64px; border-radius: 50%; background: #EDE6FF; }
  .ss-keeper .kt { position: absolute; left: 22px; top: 72px; width: 96px; height: 150px; border-radius: 40px 40px 14px 14px; background: var(--lilac); }
  .ss-keeper .ka { position: absolute; left: 40px; top: 118px; width: 60px; height: 104px; border-radius: 10px 10px 22px 22px; background: var(--paper); }
  .ss-keeper .kl { position: absolute; top: 214px; width: 30px; height: 48px; background: #6A5EDB; border-radius: 0 0 10px 10px; }
  .ss-guest { top: ${FEET - FIG_H}px; width: ${FIG_W}px; height: ${FIG_H}px; z-index: 6; }
  .ss-mini { position: absolute; left: 50px; bottom: ${FIG_H + 18}px; width: 76px; height: 76px; border-radius: 20px; opacity: 0; color: var(--card-to);
    background: #fff; display: grid; place-items: center; box-shadow: 0 14px 26px rgba(0,0,0,.5), 0 0 0 5px rgba(185,176,255,.55); }
  .ss-mini svg { width: 46px; }
  `,
  build(ctx) {
    const { p, key, loop, pop, cue, el } = ctx, { BACK, OUT } = ctx.ease, B = ctx.B
    const owner = p.view === 'owner'
    if (!['walker', 'owner'].includes(p.view)) ctx.fail(`"view" muss "walker" oder "owner" sein (bekam "${p.view}")`)
    if (!['right', 'left'].includes(p.direction)) ctx.fail(`"direction" muss "right" oder "left" sein (bekam "${p.direction}")`)
    if (!Number.isInteger(p.phones) || p.phones < 0 || p.phones > 3) ctx.fail('"phones" muss zwischen 0 und 3 liegen, mehr Figuren passen nicht vor die Ladenfront')
    if (p.card && p.walker && !owner) ctx.fail('"card" steht im Vordergrund, wo sonst der Passant geht: nur zusammen mit "walker": false')
    if (p.across) {
      const no = [owner && '"view": "owner"', !p.walker && '"walker": false', p.circle && '"circle"', p.track && '"track"', p.card && '"card"', p.privacy && '"privacy"'].filter(Boolean)
      if (no.length) ctx.fail(`"across" zeigt nur den Passanten auf der anderen Straßenseite, mit oder ohne Benachrichtigung. Nicht zusammen mit ${no.join(', ')} (für den Kreis "in der Nähe" aus der Ferne gibt es den Baustein shop-map)`)
      if (typeof p.shopAt !== 'number' || p.shopAt < 0.3 || p.shopAt > 0.7) ctx.fail('"shopAt" muss zwischen 0.3 und 0.7 liegen, sonst ragt der Laden aus dem Bild oder in die Knopfspalte von TikTok')
    }
    const dir = p.direction === 'right' ? 1 : -1
    // Anteil der Bildbreite (in Laufrichtung) -> x im Mass der Strasse
    const xOf = f => Math.round(inX(dir > 0 ? f * ctx.STAGE.w : (1 - f) * ctx.STAGE.w))

    // ---- Kulisse: Haeuser hinten, Nachbarn, Ladenfront, Gehweg. Alles haengt in .ss-world.
    ctx.html('<div class="ss-world"></div>')
    const world = ctx.$('.ss-world'), add = h => world.insertAdjacentHTML('beforeend', h)
    const row = `
      ${house(-70, 900, 250, 2, [1, 4])}${house(880, 820, 270, 2, [0, 3, 6])}
      ${house(-40, 1010, 300, 3, [2, 3], 'near')}${house(820, 960, 300, 3, [1, 5], 'near')}
      <div class="abs ss-shop">
        <div class="ss-roof"></div>
        <div class="ss-sign" data-safe="Ladenschild"><span data-oneline="Ladenname auf dem Schild"></span></div>
        <div class="ss-awn"></div>
        <div class="ss-win">${ctx.icon(p.icon)}</div>
        <div class="ss-doorglow"></div>
        <div class="ss-door"><i class="ss-glass"></i><i class="ss-knob"></i></div>
      </div>`
    if (p.across) {
      // Andere Strassenseite: dieselbe Haeuserzeile, als Ganzes verkleinert und nach oben gerueckt,
      // davor ihr Gehweg, dann die Fahrbahn mit Mittelstrich. Verkleinert reicht die Zeile nicht
      // mehr ueber die Bildbreite, deshalb kommen links und rechts Haeuser dazu (festes Muster).
      const dx = Math.round(inX(p.shopAt * ctx.STAGE.w) - CX)
      add(`<div class="ss-far" style="transform:translate(${dx}px,${FAR_GROUND - GROUND}px) scale(${FAR_K})">
        ${house(-700, 930, 290, 2, [1])}${house(-420, 870, 280, 2, [0, 3])}${house(1140, 900, 270, 2, [1, 2])}${house(1420, 850, 290, 2, [0, 5])}
        ${house(-640, 990, 320, 3, [2, 3], 'near')}${house(-330, 1040, 300, 3, [1, 5], 'near')}${house(1110, 1020, 300, 3, [0, 4], 'near')}${house(1400, 970, 330, 3, [2, 6], 'near')}
        ${row}
        <div class="abs counter" style="top:${GROUND}px;left:-1400px;right:-1400px;bottom:auto;height:${Math.round(FAR_WALK / FAR_K)}px"></div>
      </div>
      <div class="abs ss-road" style="top:${FAR_GROUND + FAR_WALK}px;height:${GROUND - FAR_GROUND - FAR_WALK}px"><i></i></div>`)
    } else add(row)
    add(`
      <div class="abs counter" style="top:${GROUND}px;left:-200px;right:-200px;bottom:-400px"></div>`)
    const sign = ctx.$('.ss-sign'), signText = sign.firstChild; signText.textContent = p.shop
    // Langer Ladenname: kleiner setzen statt ueber das Schild hinaus. Unter 32 px ist er im Video kaum noch zu lesen.
    if (ctx.fit(signText, 400, 26) < 32) ctx.warn(`der Ladenname "${p.shop}" steht auf dem Schild sehr klein. Namen kürzen.`)

    // ---- Kreis "in der Naehe": weich, ohne Zahl. Liegt als heller Schein ueber der Kulisse und unter den Figuren.
    if (p.circle) {
      add(`<div class="abs ss-zone" style="left:${CX - R}px;top:${CY - R}px;width:${2 * R}px;height:${2 * R}px"><u></u></div>`)
      const tz = ctx.at('circle')
      key('.ss-zone', [[tz, { opacity: 0, scale: 0.55 }, OUT], [tz + 0.55, { opacity: 1, scale: 1 }]])
      // langsames Atmen, damit der Kreis nicht wie eine feste Grenze wirkt
      loop('.ss-zone u', [{ opacity: 0.75, scale: 1 }, { opacity: 0, scale: 1.09 }], 2.2)
      if (p.whoosh > 0) cue(tz, 'whoosh', p.whoosh)
    }

    // ---- Passant
    if (!owner && p.walker) {
      const xTo = xOf(p.to), xFrom = xOf(p.from)
      // "via" von selbst: mit Kreis der Rand des Kreises (die Figur ist dann gerade ganz drin), sonst halber Weg
      const xVia = p.via >= 0 ? xOf(p.via) : p.circle ? Math.round(CX - dir * (EDGE - 56)) : Math.round((xFrom + xTo) / 2)
      const tW = ctx.at('walk'), tA = ctx.at('arrive'), tB = p.notify ? ctx.at('buzz') : null
      if (!(tA > tW)) ctx.fail('Anker "arrive" muss nach "walk" liegen')
      if (p.notify && !(tB > tW && tB < tA + 0.001)) ctx.fail('Anker "buzz" muss zwischen "walk" und "arrive" liegen: der Passant ist dann am Punkt "via"')
      if (p.notify && (xVia - xFrom) * dir < 0) ctx.fail('"via" liegt vor "from": der Passant müsste rückwärts gehen')
      const pts = [[tW, xFrom], ...(p.notify ? [[tB, xVia]] : []), [tA, xTo]]
      const xAt = t => {
        if (t <= pts[0][0]) return pts[0][1]
        for (let i = 1; i < pts.length; i++) if (t <= pts[i][0]) { const [t0, x0] = pts[i - 1], [t1, x1] = pts[i]; return x0 + (x1 - x0) * (t - t0) / (t1 - t0 || 1) }
        return pts[pts.length - 1][1]
      }
      const w = el('div', 'abs ss-walker', figure(dir < 0 ? 'flip' : '')); world.append(w)
      // Ruhelage = am Ziel: dort messen die Pruefungen, und dort steht die Figur am laengsten
      w.style.left = xTo - FIG_W / 2 + 'px'
      key(w, pts.map(([t, x]) => [t, { translate: `${x - xTo}px 0px` }, 'linear']))
      // Schritte nur solange die Figur geht (engine/parts.js)
      walkerSteps(key, w, 'ss', tW, tA)

      if (p.notify) {
        const chip = noteChip(ctx, 'ss', w, p)
        // Die Karte haengt ueber dem Kopf und zeigt mit ihrer Spitze aufs Handy. Sie darf auf dem
        // ganzen Weg von "via" bis "to" nicht aus dem Bild laufen: lieber gegen die Figur verschieben.
        // Rechts endet der Platz vor der Knopfspalte von TikTok, links 40 px vor dem Rand.
        const cw = chip.offsetWidth, phone = dir > 0 ? 140 : FIG_W - 140
        let left = dir > 0 ? 34 : FIG_W - 34 - cw
        const lo = Math.min(xVia, xTo) - FIG_W / 2, hi = Math.max(xVia, xTo) - FIG_W / 2
        let maxRight = inX(ctx.STAGE.column.left - 14), minLeft = inX(40)
        if (p.across) {
          // Hinten steht der Laden, und um den geht es: die Karte bleibt auf der Seite, auf der der
          // Passant geht. Geht er unter dem Laden durch, ist kein Platz daneben, dann lieber warnen.
          const sx = inX(p.shopAt * ctx.STAGE.w), half = 286 * FAR_K + 18
          if (Math.max(xVia, xTo) <= sx) maxRight = Math.min(maxRight, sx - half)
          else if (Math.min(xVia, xTo) >= sx) minLeft = Math.max(minLeft, sx + half)
          else ctx.warn('"across": der Passant geht unter dem Laden durch, die Benachrichtigung verdeckt ihn dann. "via" und "to" auf dieselbe Seite des Ladens legen ("shopAt").')
        }
        if (hi + left + cw > maxRight) left = maxRight - cw - hi
        if (lo + left < minLeft) left = minLeft - lo
        // Beide Grenzen zugleich gehen nur, wenn der Passant nach dem Brummen nicht mehr weit geht:
        // die Karte wandert mit ihm, und zwischen Bildrand und Laden ist wenig Platz.
        if (p.across && (hi + left + cw > maxRight + 1 || lo + left < minLeft - 1)) ctx.warn('"across": neben dem Laden ist kein Platz für die Benachrichtigung, sie verdeckt ihn. Den Passanten nach dem Brummen nur noch ein kurzes Stück gehen lassen ("to" näher an "via"), ihn weiter weg vom Laden halten oder den Laden verschieben ("shopAt").')
        chip.style.left = left.toFixed(1) + 'px'
        chip.style.setProperty('--tail', Math.max(20, Math.min(cw - 52, phone - left - 16)).toFixed(1) + 'px')
        chip.style.transformOrigin = `${Math.max(20, Math.min(cw - 20, phone - left)).toFixed(1)}px 100%`

        // das Handy brummt, der Bildschirm wird hell, die Karte springt auf
        walkerBuzz(key, w, 'ss', tB, OUT)
        key(chip, [[tB + 0.04, { opacity: 0, scale: 0.3 }, BACK], [tB + 0.46, { opacity: 1, scale: 1 }]])
        cue(tB, 'buzz', 0.6)
        cue(tB + 0.08, 'pop', 0.85, 1.2)
        // der Kreis antwortet auf den Eintritt: einmal kurz heller
        if (p.circle) key('.ss-zone', [[ctx.at('circle'), { filter: 'brightness(1)' }], [tB, { filter: 'brightness(1)' }, OUT], [tB + 0.16, { filter: 'brightness(1.9)' }], [tB + 0.7, { filter: 'brightness(1)' }]])
      }

      // ---- "Verfolgt dich der Laden?": Auge, Blicklinie zum Kopf der Figur, Fragezeichen
      if (p.track) {
        // Das Auge sitzt auf der Dachkante, auf der Seite, von der die Figur kommt: so laeuft
        // die Blicklinie nicht gleich quer ueber das Ladenschild.
        const E = { x: CX - dir * 150, y: 668 }
        add(`<div class="abs ss-sight" style="left:${E.x}px;top:${E.y - 4}px"><i></i></div>
          <div class="abs ss-badge ss-eye" data-safe="Auge über dem Laden" style="left:${E.x - 64}px;top:${E.y - 64}px">${EYE}<i class="ss-slash"></i></div>
          <div class="abs ss-q" style="left:${E.x - dir * 60 - 42}px;top:${E.y - 96}px">?</div>`)
        const te = ctx.at('eye'), tn = ctx.at('no')
        if (!(tn > te)) ctx.fail('Anker "no" muss nach "eye" liegen')
        pop('.ss-eye', te, 0.4); cue(te, 'pop', 0.8, 0.8)
        // Die Blicklinie haengt am Auge und zeigt auf den Kopf. Die Figur geht stueckweise
        // gleichmaessig, also reichen Stuetzpunkte alle 0,1 s (dazwischen rechnet der Browser gerade).
        const head = t => ({ x: xAt(t), y: FEET - FIG_H + 44 }), fr = []
        for (let t = te; t <= tn + 0.4; t = +(t + 0.1).toFixed(3)) {
          const h = head(t), dx = h.x - E.x, dy = h.y - E.y
          fr.push([t, { rotate: `${(Math.atan2(dy, dx) * 180 / Math.PI).toFixed(2)}deg`, width: `${Math.max(0, Math.hypot(dx, dy) - 44).toFixed(1)}px` }, 'linear'])
        }
        key('.ss-sight', fr)
        key('.ss-sight', [[te + 0.2, { opacity: 0 }, OUT], [te + 0.5, { opacity: 0.95 }], [tn, { opacity: 0.95 }, OUT], [tn + 0.22, { opacity: 0 }]])
        loop('.ss-sight i', [{ translate: '0px 0px' }, { translate: '-34px 0px' }], 0.5)
        // Aufspringen und Verschwinden stehen in EINER Bewegung: zwei getrennte auf denselben
        // Eigenschaften ueberschreiben sich, und das Fragezeichen stand dann schon da, bevor das Auge aufging.
        key('.ss-q', [[te + 0.3, { opacity: 0, scale: 0.4 }, BACK], [te + 0.7, { opacity: 1, scale: 1 }], [tn, { opacity: 1, scale: 1 }, OUT], [tn + 0.2, { opacity: 0, scale: 0.4 }]])
        cue(te + 0.3, 'pop', 0.7, 1.3)
        key('.ss-eye .ss-slash', [[tn, { scale: '0 1' }, OUT], [tn + 0.18, { scale: '1 1' }]])
        cue(tn, 'drop', 0.5)
      }
    }

    // ---- Zwei durchgestrichene Zeichen ueber dem Laden: nichts gesendet, nichts gesehen
    if (p.privacy) {
      add(`<div class="abs ss-badge ss-send" data-safe="Zeichen: nichts gesendet" style="left:${CX - 214}px;top:604px">${PLANE}<i class="ss-slash"></i></div>
        <div class="abs ss-badge ss-see" data-safe="Zeichen: nichts gesehen" style="left:${CX + 86}px;top:604px">${EYE}<i class="ss-slash"></i></div>`)
      for (const [sel, name, pitch] of [['.ss-send', 'nosend', 0.8], ['.ss-see', 'nosee', 0.95]]) {
        const t = ctx.at(name)
        pop(sel, t - 0.22, 0.36); cue(t - 0.22, 'pop', 0.75, pitch)
        key(`${sel} .ss-slash`, [[t, { scale: '0 1' }, OUT], [t + 0.16, { scale: '1 1' }]])
        cue(t, 'tick', 0.9)
      }
    }

    // ---- "In der Karte steht, wo der Laden ist": Karte vorn, Nadel auf der Karte, Nadel auf dem Laden
    if (p.card) {
      add(`<div class="abs ss-card" data-safe="Wallet-Karte im Vordergrund">
          <div class="ss-chead"><span>${ctx.icon(p.icon)}</span><b data-oneline="Ladenname auf der Karte im Vordergrund"></b></div>
          <div class="ss-cdots"><i class="on"></i><i class="on"></i><i class="on"></i><i></i><i></i><i></i></div>
          <div class="ss-cloc"><u></u><u style="flex:.6"></u></div>
          <div class="ss-cpin">${pinSvg(B, 130)}</div>
        </div>
        <svg class="abs ss-link" style="left:0;top:0" width="1080" height="1920" viewBox="0 0 1080 1920"><path d="M514 1256 C680 1170 620 920 ${CX} 742" fill="none" stroke="${B.lilac}" stroke-width="8" stroke-linecap="round" stroke-dasharray="4 24"/></svg>
        <div class="abs ss-spin" data-safe="Ortsnadel auf dem Laden" style="left:${CX - 80}px;top:592px">${pinSvg(B, 160)}</div>`)
      const name = ctx.$('.ss-chead b'); name.textContent = p.shop
      ctx.fit(name, 290, 20)
      const tc = ctx.at('card'), tp = ctx.at('pin')
      key('.ss-card', [[tc, { opacity: 0, translate: '-90px 120px', rotate: '-14deg' }, BACK], [tc + 0.5, { opacity: 1, translate: '0px 0px', rotate: '-5deg' }]])
      cue(tc + 0.05, 'pop', 0.9, 0.7)
      key('.ss-cpin', [[tp, { opacity: 0, translate: '0px -60px' }, BACK], [tp + 0.4, { opacity: 1, translate: '0px 0px' }]])
      cue(tp + 0.05, 'pop', 0.8, 1.1)
      key('.ss-link', [[tp + 0.25, { opacity: 0 }, OUT], [tp + 0.6, { opacity: 0.95 }]])
      key('.ss-spin', [[tp + 0.45, { opacity: 0, translate: '0px -110px' }, BACK], [tp + 0.9, { opacity: 1, translate: '0px 0px' }]])
      cue(tp + 0.5, 'pop', 0.85, 1.4)
    }

    // ---- Blick des Betreibers: er steht in der Tuer, vor dem Laden leuchten Handys auf
    if (owner) {
      add('<div class="abs ss-keeper"><i class="kl" style="left:36px"></i><i class="kl" style="left:74px"></i><i class="kt"></i><i class="ka"></i><i class="kh"></i></div>')
      const ts = ctx.at('shine')
      key('.ss-keeper', [[ts, { opacity: 0, translate: '0px 26px' }, OUT], [ts + 0.4, { opacity: 1, translate: '0px 0px' }]])
      key('.ss-doorglow', [[ts, { opacity: 0 }, OUT], [ts + 0.5, { opacity: 1 }]])
      key(sign, [[ts, { scale: 1 }, OUT], [ts + 0.16, { scale: 1.09 }, OUT], [ts + 0.55, { scale: 1 }]])
      cue(ts, 'pop', 0.85, 0.8)
      // Kunden stehen fest (links, links der Tuer, rechts) und schauen zur Tuer.
      // Der rechte steht noch vor der Knopfspalte von TikTok.
      const SPOTS = [{ x: 170, flip: false }, { x: 400, flip: false }, { x: 850, flip: true }]
      for (let i = 0; i < p.phones; i++) {
        const s = SPOTS[i], g = el('div', 'abs ss-guest', figure(s.flip ? 'flip' : '') + `<div class="ss-mini">${ctx.icon(p.icon)}</div>`)
        g.style.left = s.x - FIG_W / 2 + 'px'; world.append(g)
        if (s.flip) g.querySelector('.ss-mini').style.left = '34px'
        const t = ctx.at('phone' + (i + 1))
        walkerBuzz(key, g, 'ss', t, OUT, false)
        pop(g.querySelector('.ss-mini'), t + 0.04, 0.4)
        cue(t + 0.04, 'pop', 0.85, PITCH(i))
        if (i === 0) cue(t, 'buzz', 0.45)
      }
    }
  }
}
