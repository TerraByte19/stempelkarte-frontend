// Tipp-Karten an einer Pinnwand: oben eine Ueberschrift, darunter eine Leiste mit einem
// kleinen Zettel je Tipp (erledigt, jetzt, noch verdeckt), in der Mitte gross der Tipp, um
// den es gerade geht. Mit "better" an einem Tipp wird der Satz auf der Karte durchgestrichen
// und ein zweiter Zettel mit dem besseren Satz darueber gepinnt ("Sag nicht ... Sag lieber").
//
// Warum es diesen Baustein gibt: bis zum 17.11.2026 lief jedes Video denselben Bogen (Papier,
// Handy, Stempel, Karte von oben, Sperrbildschirm). Der Betreiber: "fast die gleiche Videos
// die ganze Zeit". Die neuen Formate (FORMATE.md, F01 und F02) erzaehlen nuetzliche Tipps fuer
// Ladenbesitzer, und das Produkt kommt erst als letzter Tipp. Dafuer braucht es ein Bild, das
// weder Papierkarte noch Handy ist. Die Zettel-Leiste oben zeigt, wie viel noch kommt (bei
// den Vorbildern hielt eine Kapitel-Leiste die Zuschauer, siehe Konkurrenz-Auswertung).
//
// Gezeichnet bis zum Bildrand: Korkwand mit festem Sprenkelmuster, Rahmen links und rechts,
// angepinnte Notizen ohne Schrift am Rand. Eine Kamera bis 1,2 auf die grosse Karte zeigt
// deshalb keine leere Flaeche (Regel "Zoom nur auf Bausteine, die dafuer gezeichnet sind").
// Kein Zufall: jeder Sprenkel und jeder Randzettel steht als feste Liste im Code.
//
// Aufteilung (Buehnen-Pixel): bis 522 px Textbereich, die Wand blendet bis 640 px ein.
// Ueberschrift 580 bis 660, Zettel-Leiste 690 bis 790, grosse Karte ab 840 und hoechstens
// bis 1500 (darunter beginnt die Sperrzone von Instagram), rechts hoechstens bis x = 900
// (Knopfspalte von TikTok ab 950). Unter der Karte liegen nur Randzettel als Beiwerk.
// Alle Klassen beginnen mit "tc-".
import { ICONS } from '../engine/icons.js'

const CARD = { x: 120, y: 840, w: 760, maxBottom: 1500 }
// Sprenkel der Korkwand: [x, y, Radius, Deckkraft] in einem Feld von 180 x 180, wiederholt
const SPECK = [[12, 20, 3, .16], [64, 8, 2, .1], [130, 30, 4, .12], [40, 70, 2, .14], [98, 92, 3, .1], [160, 80, 2, .16],
  [20, 128, 4, .1], [76, 150, 2, .12], [140, 140, 3, .15], [110, 52, 2, .08], [168, 170, 3, .1], [52, 110, 3, .08]]
// Randzettel ohne Schrift: [x, y, Breite, Hoehe, Drehung, Farbe]. Sie fuellen die Raender und
// den Bereich unter der Karte, damit auch vergroessert nirgends nur Kork steht.
const DECO = [[-40, 900, 150, 170, -8, '#E9E5FF'], [950, 860, 170, 150, 7, '#F4EEE2'], [-30, 1280, 140, 190, 5, '#F4EEE2'],
  [960, 1250, 150, 180, -6, '#D9D2FF'], [80, 1560, 260, 200, -4, '#F4EEE2'], [400, 1610, 220, 180, 3, '#E9E5FF'],
  [700, 1560, 300, 210, -2, '#F4EEE2'], [-20, 1760, 220, 200, 6, '#D9D2FF'], [860, 1790, 240, 180, -5, '#E9E5FF']]

export default {
  title: 'Tipp-Karten an der Pinnwand',
  use: 'Für Tipps und Listen (FORMATE.md, F01 und F02): oben die Überschrift, darunter je Tipp ein kleiner Zettel, in der Mitte groß der Tipp, um den es gerade geht. Je Teil ein Tipp ("show"). Mit "better" wird der Satz durchgestrichen und ein besserer darüber gepinnt.',
  params: {
    head: { default: '3 Tipps für Stammkunden', doc: 'Überschrift auf dem Streifen oben (höchstens etwa 30 Zeichen)' },
    items: {
      default: [
        { title: 'Sprich ihn mit Namen an.', text: 'Wer erkannt wird, kommt gern wieder.' },
        { title: 'Sag, wie weit er ist.', text: '"Noch zwei, dann ist der nächste gratis."' },
        { title: 'Gib ihm eine Karte, die er nicht verliert.', icon: 'check' }
      ],
      doc: 'Die Tipps, 1 bis 5, in jedem Teil dieselbe Liste. Je Tipp: title (der Satz, höchstens etwa 60 Zeichen, bis 3 Zeilen), text (kleine Zeile darunter, freiwillig, höchstens etwa 70 Zeichen), icon (Symbol unten rechts, freiwillig), label (kleine Zeile über dem Satz, z. B. "Sag nicht:"), better (besserer Satz, der auf "swap" darübergepinnt wird) und betterLabel (Vorgabe "Sag lieber:")'
    },
    show: { default: 1, doc: 'Welcher Tipp in diesem Teil groß im Bild ist (1 = der erste). Die Zettel davor gelten als erledigt, die danach sind noch verdeckt' },
    numbered: { default: true, doc: 'Nummer im runden Feld der Karte. false: dort steht das Symbol des Tipps (oder ein Haken)' },
    rise: { default: true, doc: 'Die Karte fliegt auf den Anker "card" von unten herein. false: sie hängt ab dem ersten Bild (für den Einstieg, Bild 0 muss fertig sein)' },
    tones: { default: true, doc: 'Eigene Töne (pop beim Anpinnen, whoosh beim Durchstreichen). false, wenn das Skript Klänge aus der Bibliothek setzt' }
  },
  captions: { min: 1 },
  anchors: p => {
    const a = { card: { at: 'start', offset: 0, doc: 'Die große Karte wird angepinnt, ihr Zettel in der Leiste leuchtet auf (Ton: pop)' } }
    const it = Array.isArray(p.items) ? p.items[p.show - 1] : null
    if (it && it.better) {
      a.strike = { cap: 0, word: -1, doc: 'Der Satz auf der Karte wird durchgestrichen (Ton: whoosh). Auf das letzte Wort des alten Satzes' }
      a.swap = { cap: -1, word: 0, doc: 'Der bessere Satz wird darübergepinnt (Ton: pop). Auf das erste Wort des neuen Satzes' }
    }
    return a
  },
  demo: {
    params: { show: 2 },
    captions: [{ lines: ['Tipp zwei:', 'Sag ihm, wie weit er ist.'], accent: 2 }],
    at: { cap: 0, word: -1, offset: 0.6 }
  },
  css: `
  .tc-wall { left: 0; top: 0; width: 1080px; height: 1920px; }
  .tc-head { left: 90px; right: 90px; top: 580px; height: 84px; display: grid; place-items: center; }
  .tc-head b { display: block; max-width: 900px; padding: 12px 34px 14px; border-radius: 8px; background: var(--lilac); color: var(--night); font: 700 46px var(--display); letter-spacing: -.01em; white-space: nowrap; rotate: -1deg; box-shadow: 0 10px 22px rgba(0,0,0,.35); }
  .tc-strip { left: 60px; right: 60px; top: 690px; height: 104px; display: flex; justify-content: center; gap: 26px; }
  .tc-mini { position: relative; width: 92px; height: 92px; border-radius: 10px; display: grid; place-items: center; font: 700 44px var(--display); box-shadow: 0 8px 16px rgba(0,0,0,.35); }
  .tc-mini.done { background: #8E82F5; color: #fff; }
  .tc-mini.now { background: #F4EEE2; color: var(--ink); }
  .tc-mini.later { background: #3E3384; color: rgba(255,255,255,.35); }
  .tc-mini svg { width: 46px; stroke-width: 2.6; }
  .tc-mini .tc-ring { position: absolute; inset: -9px; border-radius: 16px; border: 5px solid var(--lilac); opacity: 0; }
  .tc-card { left: ${CARD.x}px; top: ${CARD.y}px; width: ${CARD.w}px; min-height: 560px; padding: 100px 64px 64px; border-radius: 18px; background: #F4EEE2; color: var(--ink); rotate: -1.5deg; box-shadow: 0 34px 60px rgba(0,0,0,.5); }
  .tc-better { left: ${CARD.x + 40}px; width: ${CARD.w - 40}px; padding: 86px 60px 58px; border-radius: 18px; background: #E9E5FF; color: var(--ink); rotate: 2deg; box-shadow: 0 34px 60px rgba(0,0,0,.55); opacity: 0; }
  .tc-pin { position: absolute; left: 50%; top: 18px; width: 44px; height: 44px; margin-left: -22px; border-radius: 50%; background: radial-gradient(circle at 35% 30%, #FFFFFF 0 12%, #B9B0FF 13% 55%, #5A4FCF 100%); box-shadow: 0 6px 10px rgba(0,0,0,.4); }
  .tc-badge { position: absolute; left: -26px; top: -30px; width: 124px; height: 124px; border-radius: 50%; background: var(--brand); color: #fff; display: grid; place-items: center; font: 700 70px var(--display); box-shadow: 0 10px 20px rgba(0,0,0,.4); }
  .tc-badge svg { width: 66px; stroke-width: 2.6; }
  .tc-label { font: 700 30px var(--body); letter-spacing: .1em; text-transform: uppercase; color: var(--brand); margin-bottom: 14px; }
  .tc-title { position: relative; font: 700 74px/1.12 var(--display); letter-spacing: -.02em; }
  .tc-text { position: relative; margin-top: 26px; font: 500 40px/1.3 var(--body); opacity: .75; }
  .tc-water { position: absolute; right: 44px; bottom: 22px; font: 700 260px/.8 var(--display); color: var(--brand); opacity: .1; }
  .tc-ico { position: absolute; right: 40px; bottom: 34px; width: 96px; color: var(--brand); opacity: .9; }
  .tc-ico svg { width: 96px; stroke-width: 2.2; }
  .tc-strike { position: absolute; left: -10px; right: -10px; top: 50%; height: 14px; margin-top: -7px; border-radius: 7px; background: #FF6B8B; transform-origin: 0 50%; scale: 0 1; rotate: -4deg; }
  `,
  build(ctx) {
    const { p, key, cue } = ctx, { BACK, OUT } = ctx.ease
    const items = p.items
    if (!Array.isArray(items) || items.length < 1 || items.length > 5) ctx.fail('"items" braucht 1 bis 5 Tipps')
    items.forEach((it, i) => {
      if (!it || typeof it.title !== 'string' || !it.title.trim()) ctx.fail(`Tipp ${i + 1} braucht "title"`)
      for (const k of Object.keys(it)) if (!['title', 'text', 'icon', 'label', 'better', 'betterLabel'].includes(k)) ctx.fail(`Tipp ${i + 1}: "${k}" gibt es nicht. Erlaubt: title, text, icon, label, better, betterLabel`)
      if (it.title.length > 60) ctx.fail(`Tipp ${i + 1}: "title" hat ${it.title.length} Zeichen, höchstens 60 passen auf die Karte`)
      if (it.text && it.text.length > 70) ctx.fail(`Tipp ${i + 1}: "text" hat ${it.text.length} Zeichen, höchstens 70`)
      if (it.better && it.better.length > 60) ctx.fail(`Tipp ${i + 1}: "better" hat ${it.better.length} Zeichen, höchstens 60`)
      if (it.icon && !ICONS[it.icon]) ctx.fail(`Tipp ${i + 1}: Symbol "${it.icon}" gibt es nicht. Erlaubt: ${Object.keys(ICONS).join(', ')}`)
    })
    if (!Number.isInteger(p.show) || p.show < 1 || p.show > items.length) ctx.fail(`"show" muss zwischen 1 und ${items.length} liegen`)
    if (typeof p.head !== 'string' || p.head.length > 34) ctx.fail('"head" ist zu lang (höchstens etwa 30 Zeichen)')
    const cur = items[p.show - 1], esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')

    // ---- Korkwand bis zum Rand, Rahmen, Randzettel
    const g = []
    g.push(`<defs><pattern id="tc-speck" width="180" height="180" patternUnits="userSpaceOnUse">${SPECK.map(([x, y, r, o]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#FFFFFF" opacity="${o}"/>`).join('')}</pattern>
      <linearGradient id="tc-fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0E0A24"/><stop offset="1" stop-color="#0E0A24" stop-opacity="0"/></linearGradient>
      <linearGradient id="tc-cork" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#30256E"/><stop offset="1" stop-color="#241C58"/></linearGradient></defs>`)
    g.push('<rect x="0" y="500" width="1080" height="1420" fill="url(#tc-cork)"/><rect x="0" y="500" width="1080" height="1420" fill="url(#tc-speck)"/>')
    g.push('<rect x="0" y="500" width="30" height="1420" fill="#1A1446"/><rect x="24" y="500" width="6" height="1420" fill="rgba(185,176,255,.18)"/>')
    g.push('<rect x="1050" y="500" width="30" height="1420" fill="#1A1446"/><rect x="1050" y="500" width="6" height="1420" fill="rgba(185,176,255,.18)"/>')
    for (const [x, y, w, h, r, f] of DECO) {
      g.push(`<g transform="rotate(${r} ${x + w / 2} ${y + h / 2})" opacity=".55"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="${f}"/>`)
      for (let k = 0; k < 3; k++) g.push(`<rect x="${x + 24}" y="${y + 44 + k * 34}" width="${(w - 48) * (k === 2 ? 0.6 : 1)}" height="10" rx="5" fill="#1A1A2E" opacity=".18"/>`)
      g.push(`<circle cx="${x + w / 2}" cy="${y + 16}" r="11" fill="#8E82F5"/></g>`)
    }
    g.push('<rect x="0" y="500" width="1080" height="150" fill="url(#tc-fade)"/>')
    ctx.html(`<svg class="abs tc-wall" viewBox="0 0 1080 1920">${g.join('')}</svg>`)

    // ---- Ueberschrift und Zettel-Leiste
    ctx.html(`<div class="abs tc-head" data-safe="Überschrift der Pinnwand"><b data-oneline="Überschrift der Pinnwand"></b></div>`)
    const head = ctx.$('.tc-head b'); head.textContent = p.head; ctx.fit(head, 830, 30)
    let strip = ''
    items.forEach((it, i) => {
      const n = i + 1, state = n < p.show ? 'done' : n === p.show ? 'now' : 'later'
      const inner = state === 'done' ? ctx.icon('check') : state === 'now' ? (p.numbered ? String(n) : ctx.icon(it.icon || 'check')) : (p.numbered ? String(n) : '')
      strip += `<div class="tc-mini ${state}" style="rotate:${i % 2 ? 4 : -4}deg">${inner}${state === 'now' ? '<i class="tc-ring"></i>' : ''}</div>`
    })
    ctx.html(`<div class="abs tc-strip" data-safe="Zettel-Leiste">${strip}</div>`)

    // ---- Die grosse Karte
    const badge = p.numbered ? String(p.show) : ctx.icon(cur.icon || 'check')
    ctx.html(`<div class="abs tc-card" data-safe="Tipp-Karte"><i class="tc-pin"></i><div class="tc-badge">${badge}</div>
      ${cur.label ? `<div class="tc-label" data-oneline="Kleine Zeile über dem Tipp">${esc(cur.label)}</div>` : ''}
      <div class="tc-title" data-maxlines="Tipp auf der Karte" data-max="3"><span></span><i class="tc-strike"></i></div>
      ${cur.text ? '<div class="tc-text" data-maxlines="Zeile unter dem Tipp" data-max="2"></div>' : ''}
      ${cur.icon && p.numbered ? `<div class="tc-ico">${ctx.icon(cur.icon)}</div>` : p.numbered ? `<div class="tc-water">${p.show}</div>` : ''}</div>`)
    const card = ctx.$('.tc-card'), title = ctx.$('.tc-title'), titleText = ctx.$('.tc-title span')
    titleText.textContent = cur.title
    if (cur.text) ctx.$('.tc-text').textContent = cur.text
    // Lange Saetze: Schrift verkleinern, bis sie in drei Zeilen passen (Breite allein reicht nicht)
    const shrink = (e, size, min, lines) => { e.style.fontSize = size + 'px'; while (e.offsetHeight > size * 1.12 * lines + 4 && size > min) { size -= 2; e.style.fontSize = size + 'px' } return size }
    shrink(title, 74, 50, 3)
    if (card.offsetTop + card.offsetHeight > CARD.maxBottom) ctx.fail(`Die Karte reicht bis ${card.offsetTop + card.offsetHeight} px und damit in die untere Sperrzone. Satz oder Zeile darunter kürzen`)

    const t = ctx.at('card')
    // Die Karte kommt von unten und wird angepinnt; der Zettel in der Leiste leuchtet mit
    if (p.rise) {
      key(card, [[t, { opacity: 0, translate: '0px 120px', rotate: '4deg' }, BACK], [t + 0.3, { opacity: 1, translate: '0px 0px', rotate: '-1.5deg' }]])
      if (p.tones) cue(t + 0.22, 'pop', 0.8, 0.9)
    }
    // Der Zettel in der Leiste leuchtet auf, auch wenn die Karte schon haengt (Bewegung mit Ton im Einstieg)
    const ring = ctx.$('.tc-mini.now .tc-ring')
    if (ring) key(ring, [[t + 0.08, { opacity: 0, scale: 1.3 }, OUT], [t + 0.38, { opacity: 1, scale: 1 }]])
    if (!p.rise && p.tones) cue(t + 0.1, 'pop', 0.7, 1.1)

    if (cur.better) {
      const ts = ctx.at('strike'), tw = ctx.at('swap')
      if (tw <= ts) ctx.fail('Anker "swap" muss nach "strike" liegen: erst streichen, dann den besseren Satz zeigen')
      key(ctx.$('.tc-strike'), [[ts - 0.05, { scale: '0 1' }, OUT], [ts + 0.25, { scale: '1 1' }]])
      key(titleText, [[ts + 0.1, { opacity: 1 }], [ts + 0.35, { opacity: 0.45 }]])
      if (p.tones) cue(ts, 'whoosh', 0.3)
      ctx.html(`<div class="abs tc-better" data-safe="Besserer Satz"><i class="tc-pin"></i><div class="tc-label" data-oneline="Kleine Zeile über dem besseren Satz"></div><div class="tc-title" data-maxlines="Besserer Satz" data-max="3"></div></div>`)
      const b = ctx.$('.tc-better'), bt = ctx.$('.tc-better .tc-title')
      ctx.$('.tc-better .tc-label').textContent = cur.betterLabel || 'Sag lieber:'
      bt.textContent = cur.better
      shrink(bt, 74, 50, 3)
      // Der bessere Zettel liegt etwas tiefer als die Karte und deckt ihren unteren Teil zu
      b.style.top = Math.round(CARD.y + Math.min(card.offsetHeight * 0.45, 260)) + 'px'
      if (b.offsetTop + b.offsetHeight > CARD.maxBottom) ctx.fail(`Der bessere Satz reicht bis ${b.offsetTop + b.offsetHeight} px und damit in die untere Sperrzone. Kürzen`)
      key(b, [[tw - 0.02, { opacity: 0, translate: '160px 60px', rotate: '12deg' }, BACK], [tw + 0.34, { opacity: 1, translate: '0px 0px', rotate: '2deg' }]])
      if (p.tones) cue(tw + 0.26, 'pop', 0.85, 1.15)
    }
  }
}
