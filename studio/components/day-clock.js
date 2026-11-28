// Ein Tag im Laden: Wanduhr, Fenster mit Himmel zur Tageszeit, Uhrzeit gross darunter und
// eine Zeitleiste vom Oeffnen bis zum Schliessen. Je Teil eine Uhrzeit: auf "move" laufen
// Zeiger, Himmel und Markierung von "from" auf "time", auf "event" springt an dieser Stelle
// ein Punkt auf die Zeitleiste ("Erster Kunde", "Mittagsschlange").
//
// Warum es diesen Baustein gibt: die ersten vier Videos hatten denselben Bogen (Papier,
// Handy, Stempel, Karte von oben, Sperrbildschirm). Das Format "Ein Tag im Laden"
// (FORMATE.md, F05) erzaehlt stattdessen einen Tag in Uhrzeiten, und jede Uhrzeit ist ein
// Bildwechsel. Die Vorbilder mit einem durchgespielten Ablauf (Wochentag, Uhrzeit) trugen
// gerade durch diese Genauigkeit (Konkurrenz-Auswertung). Die Uhrzeiten sind Beispiele,
// keine Aussage ueber die App.
//
// Gezeichnet bis zum Bildrand: Fliesenwand, Fenster mit Daechern, Theke mit Kasse und
// Aufsteller bis unten. Kein Zufall: Daecher, Fenster und Sterne stehen als feste Listen hier.
// Eine Kamera 1,15 um die Bildmitte bleibt im gezeichneten Bild.
// Aufteilung (Buehnen-Pixel): Ladenschild 572 bis 650, Uhr um (300, 850) mit Radius 175,
// Fenster 560 bis 1010 (x) und 690 bis 1140 (y, Beiwerk), Uhrzeit und Zeile darunter 1050
// bis 1240, Zeitleiste 1280 bis 1430 (x 70 bis 860: mit einer Kamera 1,15 um x = 540 bleibt
// sie links der Knopfspalte von TikTok ab x = 950), Theke mit Vitrine ab 1470 (Beiwerk).
// Auf der Theke steht nur rechts aussen ein Aufsteller: alles andere laege unter der Zeitleiste.
// Alle Klassen beginnen mit "dc-".

const CLOCK = { x: 300, y: 850, r: 175 }, WIN = { x: 560, y: 690, w: 450, h: 450 }, LINE = { x: 90, w: 740, y: 1360 }
// Himmel je Stunde: [Stunde, oben, unten]; dazwischen wird gemischt
const SKY = [[0, '#0B0A2A', '#1E1650'], [5, '#0E0C33', '#2A1E5E'], [6.5, '#3A2A6E', '#F2A27A'], [8, '#6574D8', '#F3C59E'], [11, '#7F9EF0', '#CCD8FF'],
  [16, '#7488E2', '#E9C8E2'], [18.5, '#4A3A8E', '#F08A6A'], [20, '#1C1650', '#4A2E70'], [24, '#0B0A2A', '#1E1650']]
const ROOFS = [[0, 1040, 120, 130], [110, 990, 110, 180], [210, 1060, 130, 110], [330, 1010, 120, 160]]
const STARS = [[40, 50], [120, 90], [210, 40], [300, 110], [380, 60], [90, 180], [260, 200], [410, 170]]
let uid = 0

const hhmm = t => { const m = /^(\d{1,2}):(\d{2})$/.exec(String(t)); return m && +m[2] < 60 && +m[1] < 24 ? +m[1] + +m[2] / 60 : null }
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16))
function sky(h) {
  let i = 0; while (i < SKY.length - 2 && SKY[i + 1][0] <= h) i++
  const [a, at, ab] = SKY[i], [b, bt, bb] = SKY[i + 1], f = Math.max(0, Math.min(1, (h - a) / (b - a)))
  const mix = (x, y) => '#' + hex(x).map((v, k) => Math.round(v + (hex(y)[k] - v) * f).toString(16).padStart(2, '0')).join('')
  return [mix(at, bt), mix(ab, bb)]
}
const night = h => h < 6.2 || h > 19.6

export default {
  title: 'Tag im Laden: Uhr, Fenster und Zeitleiste',
  use: 'Für "Ein Tag im Laden" (FORMATE.md, F05): je Teil eine Uhrzeit. Auf "move" laufen Zeiger, Himmel im Fenster und Markierung auf der Zeitleiste von "from" auf "time", auf "event" springt dort ein Punkt auf. Die Zeile unter der Uhrzeit sagt, was gerade ist.',
  params: {
    shop: { default: 'Café Nordwind', doc: 'Name auf dem Schild oben (höchstens etwa 24 Zeichen)', same: 'Ladenname' },
    icon: { default: 'cup', doc: 'Symbol auf dem Schild und auf dem Aufsteller: cup, bread, scissors, star, heart, check, kebab', same: 'Symbol' },
    time: { default: '07:10', doc: 'Uhrzeit dieses Teils, "HH:MM", zwischen "open" und "close"' },
    from: { default: '', doc: 'Uhrzeit, von der Zeiger, Himmel und Markierung auf "move" loslaufen (meist die Zeit des Teils davor). Leer = sie stehen schon auf "time"' },
    label: { default: 'Erster Kunde', doc: 'Zeile unter der Uhrzeit (höchstens etwa 24 Zeichen). Leer = keine' },
    open: { default: 6, doc: 'Erste Stunde der Zeitleiste (0 bis 22)' },
    close: { default: 20, doc: 'Letzte Stunde der Zeitleiste (größer als "open", höchstens 24)' },
    events: { default: [], doc: 'Frühere Ereignisse als Liste von "HH:MM": sie stehen schon als Punkte auf der Zeitleiste' },
    mark: { default: true, doc: 'Auf "event" springt an der Uhrzeit dieses Teils ein Punkt auf (Ton: pop). false: kein neuer Punkt' },
    tones: { default: true, doc: 'Eigene Töne (tick beim Weiterlaufen, pop beim Punkt). false, wenn das Skript Klänge aus der Bibliothek setzt' }
  },
  captions: { min: 1 },
  anchors: p => {
    const a = { move: { at: 'start', offset: 0.05, doc: 'Zeiger, Himmel und Markierung laufen von "from" auf "time" (Ton: tick), die Uhrzeit springt um' } }
    if (p.mark) a.event = { cap: 0, word: -1, doc: 'Ein Punkt springt an dieser Uhrzeit auf die Zeitleiste (Ton: pop)' }
    return a
  },
  demo: {
    params: { shop: 'Bäckerei Morgenrot', icon: 'bread', time: '07:10', from: '06:00', label: 'Erster Kunde', events: [] },
    captions: [{ lines: ['Sieben Uhr zehn.', 'Der erste Kunde.'], accent: 3 }],
    at: { cap: 0, word: -1, offset: 0.7 }
  },
  css: `
  .dc-wall { left: 0; top: 0; width: 1080px; height: 1920px; }
  .dc-sign { left: 90px; right: 90px; top: 572px; height: 80px; display: flex; justify-content: center; }
  .dc-sign div { display: flex; align-items: center; gap: 16px; padding: 10px 28px 10px 12px; border-radius: 20px; background: #F4EEE2; color: var(--ink); box-shadow: 0 10px 24px rgba(0,0,0,.4); }
  .dc-sign span { width: 58px; height: 58px; border-radius: 14px; background: var(--brand); color: #fff; display: grid; place-items: center; }
  .dc-sign span svg { width: 36px; }
  .dc-sign b { font: 700 40px var(--display); white-space: nowrap; }
  .dc-clock { left: ${CLOCK.x - CLOCK.r}px; top: ${CLOCK.y - CLOCK.r}px; width: ${CLOCK.r * 2}px; height: ${CLOCK.r * 2}px; border-radius: 50%; background: #F4EEE2; border: 16px solid #3C3489; box-shadow: 0 24px 50px rgba(0,0,0,.5), inset 0 0 0 4px rgba(26,26,46,.08); }
  .dc-clock svg { position: absolute; inset: -16px; width: ${CLOCK.r * 2}px; height: ${CLOCK.r * 2}px; }
  .dc-hand { position: absolute; left: 50%; bottom: 50%; border-radius: 6px; transform-origin: 50% 100%; }
  .dc-hand.h { width: 16px; margin-left: -8px; height: 92px; background: var(--ink); }
  .dc-hand.m { width: 10px; margin-left: -5px; height: 138px; background: var(--brand); }
  .dc-pin { position: absolute; left: 50%; top: 50%; width: 30px; height: 30px; margin: -15px 0 0 -15px; border-radius: 50%; background: var(--ink); border: 6px solid #F4EEE2; }
  .dc-time { left: 40px; width: 520px; top: 1046px; height: 136px; text-align: center; font: 700 124px/136px var(--display); letter-spacing: -.02em; overflow: hidden; }
  .dc-time i { position: absolute; inset: 0; font-style: normal; }
  .dc-time i.n { color: var(--lilac); text-shadow: 0 0 50px rgba(142,130,245,.5); }
  .dc-label { left: 40px; width: 520px; top: 1184px; text-align: center; font: 600 42px var(--body); white-space: nowrap; }
  .dc-line { left: ${LINE.x - 20}px; width: ${LINE.w + 40}px; top: ${LINE.y - 80}px; height: 150px; }
  .dc-bar { position: absolute; left: 20px; right: 20px; top: 72px; height: 22px; border-radius: 11px; background: rgba(255,255,255,.14); }
  .dc-fill { position: absolute; left: 0; right: 0; top: 0; bottom: 0; border-radius: 9px; background: var(--lilac); transform-origin: 0 50%; }
  .dc-tick { position: absolute; top: 110px; width: 60px; margin-left: -30px; text-align: center; font: 600 30px var(--body); opacity: .7; }
  .dc-tick::before { content: ''; position: absolute; left: 29px; top: -24px; width: 2px; height: 12px; background: rgba(255,255,255,.4); }
  .dc-dot { position: absolute; top: 66px; width: 34px; height: 34px; margin-left: -17px; border-radius: 50%; background: #8E82F5; border: 4px solid #0E0A24; }
  .dc-dot.new { background: #fff; opacity: 0; }
  .dc-ring { position: absolute; top: 58px; width: 50px; height: 50px; margin-left: -25px; border-radius: 50%; border: 5px solid #fff; opacity: 0; }
  .dc-mark { position: absolute; top: 0; width: 68px; height: 68px; margin-left: -34px; border-radius: 50% 50% 50% 0; rotate: -45deg; background: var(--brand); border: 4px solid var(--lilac); display: grid; place-items: center; box-shadow: 0 8px 16px rgba(0,0,0,.4); }
  .dc-mark svg { width: 34px; rotate: 45deg; color: #fff; }
  `,
  build(ctx) {
    const { p, key, cue } = ctx, { BACK, OUT } = ctx.ease
    const id = 'dc' + (++uid)
    const T = hhmm(p.time), F = p.from ? hhmm(p.from) : T
    if (T == null) ctx.fail(`"time" muss "HH:MM" sein (bekam ${JSON.stringify(p.time)})`)
    if (F == null) ctx.fail(`"from" muss "HH:MM" sein oder leer (bekam ${JSON.stringify(p.from)})`)
    if (!Number.isInteger(p.open) || !Number.isInteger(p.close) || p.open < 0 || p.close > 24 || p.close - p.open < 4) ctx.fail('"open" und "close" sind ganze Stunden, mindestens 4 Stunden auseinander, zwischen 0 und 24')
    for (const [k, v] of [['time', T], ['from', F]]) if (v < p.open || v > p.close) ctx.fail(`"${k}" liegt außerhalb der Zeitleiste (${p.open} bis ${p.close} Uhr)`)
    if (F > T) ctx.fail('"from" liegt nach "time": der Tag läuft nur vorwärts')
    if (!Array.isArray(p.events) || p.events.some(e => hhmm(e) == null || hhmm(e) < p.open || hhmm(e) > p.close)) ctx.fail('"events" ist eine Liste von Uhrzeiten "HH:MM" innerhalb der Zeitleiste')
    if (typeof p.label !== 'string' || p.label.length > 26) ctx.fail('"label" höchstens etwa 24 Zeichen')
    const X = h => LINE.x + (h - p.open) / (p.close - p.open) * LINE.w
    const two = n => String(n).padStart(2, '0'), fmt = h => two(Math.floor(h + 1e-6)) + ':' + two(Math.round((h - Math.floor(h + 1e-6)) * 60))

    // ---- Wand, Fenster mit Himmel und Daechern, Theke: bis zum Bildrand
    const [sT, sB] = sky(T), [fT, fB] = sky(F)
    const g = [`<defs><pattern id="${id}-tile" width="90" height="46" patternUnits="userSpaceOnUse"><rect width="90" height="46" fill="#2A2166"/><rect x="2" y="2" width="86" height="42" rx="4" fill="#30287A"/><rect x="2" y="2" width="86" height="6" rx="3" fill="rgba(255,255,255,.04)"/></pattern>
      <linearGradient id="${id}-a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${fT}"/><stop offset="1" stop-color="${fB}"/></linearGradient>
      <linearGradient id="${id}-b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sT}"/><stop offset="1" stop-color="${sB}"/></linearGradient>
      <linearGradient id="${id}-fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0E0A24"/><stop offset="1" stop-color="#0E0A24" stop-opacity="0"/></linearGradient>
      <linearGradient id="${id}-wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4A3A8E"/><stop offset="1" stop-color="#2A2166"/></linearGradient>
      <clipPath id="${id}-win"><rect x="${WIN.x}" y="${WIN.y}" width="${WIN.w}" height="${WIN.h}"/></clipPath></defs>`]
    g.push(`<rect x="0" y="500" width="1080" height="1420" fill="url(#${id}-tile)"/>`)
    // Fenster: Rahmen, Himmel (alt und neu), Sterne, Sonne oder Mond, Daecher mit Fenstern
    g.push(`<rect x="${WIN.x - 26}" y="${WIN.y - 26}" width="${WIN.w + 52}" height="${WIN.h + 52}" rx="10" fill="#1A1236"/>`)
    g.push(`<g clip-path="url(#${id}-win)"><rect class="dc-skya" x="${WIN.x}" y="${WIN.y}" width="${WIN.w}" height="${WIN.h}" fill="url(#${id}-a)"/><rect class="dc-skyb" x="${WIN.x}" y="${WIN.y}" width="${WIN.w}" height="${WIN.h}" fill="url(#${id}-b)" opacity="0"/>`)
    g.push(`<g class="dc-stars" opacity="${night(F) ? 1 : 0}">${STARS.map(([x, y]) => `<circle cx="${WIN.x + x}" cy="${WIN.y + y}" r="3" fill="#fff" opacity=".8"/>`).join('')}</g>`)
    const sunAt = h => { const f = Math.max(0, Math.min(1, (h - 6) / 13)); return [WIN.x + 50 + f * (WIN.w - 100), WIN.y + 330 - Math.sin(Math.PI * f) * 260] }
    const [sx, sy] = sunAt(T), [fx, fy] = sunAt(F)
    g.push(`<g transform="translate(${fx} ${fy})"><g class="dc-sun"><g class="dc-day" opacity="${night(F) ? 0 : 1}"><circle r="46" fill="#FFD27A"/><circle r="72" fill="#FFD27A" opacity=".2"/></g><g class="dc-night" opacity="${night(F) ? 1 : 0}"><circle r="40" fill="#F4EEE2"/><circle cx="16" cy="-10" r="34" fill="${fT}" class="dc-bite"/></g></g></g>`)
    ROOFS.forEach(([x, y, w, h], i) => {
      g.push(`<path d="M${WIN.x + x} ${WIN.y + WIN.h} V${y} l${w / 2} -50 l${w / 2} 50 V${WIN.y + WIN.h} Z" fill="#1A1446"/>`)
      for (let k = 0; k < 2; k++) g.push(`<rect class="dc-lit" x="${WIN.x + x + 22 + k * (w / 2 - 6)}" y="${y + 30 + (i % 2) * 20}" width="26" height="34" rx="3" fill="#FFD68A" opacity="${night(F) ? .85 : .15}"/>`)
    })
    g.push(`</g><rect x="${WIN.x + WIN.w / 2 - 7}" y="${WIN.y}" width="14" height="${WIN.h}" fill="#1A1236"/><rect x="${WIN.x}" y="${WIN.y + WIN.h * 0.45}" width="${WIN.w}" height="14" fill="#1A1236"/>`)
    g.push(`<rect x="${WIN.x - 40}" y="${WIN.y + WIN.h + 20}" width="${WIN.w + 80}" height="24" rx="6" fill="#4A40A8"/>`)
    // Pflanze auf dem Fensterbrett, rechts in der Knopfspalte nur Beiwerk
    g.push(`<rect x="930" y="${WIN.y + WIN.h - 40}" width="80" height="62" rx="10" fill="#5A4FCF"/><path d="M970 ${WIN.y + WIN.h - 40} q-30 -70 -6 -120 M970 ${WIN.y + WIN.h - 40} q8 -80 40 -110 M970 ${WIN.y + WIN.h - 40} q-50 -26 -66 -80" fill="none" stroke="#5FA77A" stroke-width="12" stroke-linecap="round"/>`)
    // Theke mit Vitrine bis zum Bildrand: Glas, Ablagen, darin das Symbol des Ladens als Ware
    g.push(`<rect x="0" y="1470" width="1080" height="450" fill="url(#${id}-wood)"/><rect x="0" y="1470" width="1080" height="16" fill="#5A4FCF"/>`)
    g.push(`<rect x="30" y="1510" width="1020" height="250" rx="16" fill="rgba(185,176,255,.1)" stroke="rgba(255,255,255,.22)" stroke-width="4"/><rect x="30" y="1632" width="1020" height="8" fill="rgba(255,255,255,.16)"/>`)
    for (let i = 0; i < 9; i++) for (let r = 0; r < 2; r++) g.push(`<use href="#ico-${p.icon}" x="${62 + i * 110 + (r ? 50 : 0)}" y="${1532 + r * 118}" width="${r ? 70 : 80}" height="${r ? 70 : 80}" fill="none" stroke="#F4EEE2" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" opacity="${r ? .35 : .5}"/>`)
    for (let x = 30; x < 1080; x += 260) g.push(`<rect x="${x}" y="1790" width="220" height="140" rx="14" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="4"/>`)
    g.push(`<g transform="translate(944 1376)"><path d="M10 94 L28 0 h64 l18 94" fill="#8A5A34"/><rect x="22" y="10" width="76" height="76" rx="8" fill="#F4EEE2"/><use href="#ico-${p.icon}" x="30" y="18" width="60" height="60" fill="none" stroke="#3C3489" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></g>`)
    g.push(`<rect x="0" y="500" width="1080" height="150" fill="url(#${id}-fade)"/>`)
    ctx.html(`<svg class="abs dc-wall" viewBox="0 0 1080 1920">${g.join('')}</svg>`)

    // ---- Schild, Uhr, Uhrzeit, Zeile
    ctx.html(`<div class="abs dc-sign" data-safe="Ladenschild"><div><span>${ctx.icon(p.icon)}</span><b data-oneline="Ladenname auf dem Schild"></b></div></div>`)
    const sign = ctx.$('.dc-sign b'); sign.textContent = p.shop; ctx.fit(sign, 640, 26)
    let ticks = ''
    for (let i = 0; i < 60; i++) {
      const a = i * 6 * Math.PI / 180, big = i % 5 === 0, r1 = CLOCK.r - 30, r2 = r1 - (big ? 26 : 10)
      ticks += `<line x1="${CLOCK.r + Math.sin(a) * r1}" y1="${CLOCK.r - Math.cos(a) * r1}" x2="${CLOCK.r + Math.sin(a) * r2}" y2="${CLOCK.r - Math.cos(a) * r2}" stroke="#1A1A2E" stroke-width="${big ? 8 : 3}" stroke-linecap="round" opacity="${big ? .85 : .4}"/>`
    }
    ctx.html(`<div class="abs dc-clock" data-safe="Uhr"><svg viewBox="0 0 ${CLOCK.r * 2} ${CLOCK.r * 2}">${ticks}</svg><i class="dc-hand h"></i><i class="dc-hand m"></i><i class="dc-pin"></i></div>`)
    ctx.html(`<div class="abs dc-time" data-safe="Uhrzeit"><i class="o"></i><i class="n"></i></div>${p.label ? '<div class="abs dc-label" data-safe="Zeile unter der Uhrzeit" data-oneline="Zeile unter der Uhrzeit"></div>' : ''}`)
    ctx.$('.dc-time .o').textContent = fmt(F); ctx.$('.dc-time .n').textContent = fmt(T)
    if (p.label) { const l = ctx.$('.dc-label'); l.textContent = p.label; ctx.fit(l, 500, 28) }

    // ---- Zeitleiste
    let line = `<div class="dc-bar"><i class="dc-fill"></i></div>`
    for (let h = p.open; h <= p.close; h += (p.close - p.open > 10 ? 2 : 1)) line += `<span class="dc-tick" style="left:${X(h) - LINE.x + 20}px">${h}</span>`
    for (const e of p.events) line += `<i class="dc-dot" style="left:${X(hhmm(e)) - LINE.x + 20}px"></i>`
    if (p.mark) line += `<i class="dc-ring" style="left:${X(T) - LINE.x + 20}px"></i><i class="dc-dot new" style="left:${X(T) - LINE.x + 20}px"></i>`
    line += `<div class="dc-mark" style="left:${X(T) - LINE.x + 20}px">${ctx.icon(p.icon)}</div>`
    ctx.html(`<div class="abs dc-line" data-safe="Zeitleiste">${line}</div>`)

    // ---- Bewegung: Zeiger, Himmel, Sonne, Markierung, Uhrzeit
    const tm = ctx.at('move'), d = F === T ? 0.001 : 0.7
    const ang = h => [(h % 12) * 30, h * 360]       // Stundenzeiger, Minutenzeiger (ganze Umdrehungen je Stunde)
    const [ha0, ma0] = ang(F), [ha1, ma1] = ang(T)
    key('.dc-hand.h', [[tm, { rotate: ha0 + 'deg' }, OUT], [tm + d, { rotate: ha1 + 'deg' }]])
    key('.dc-hand.m', [[tm, { rotate: ma0 + 'deg' }, OUT], [tm + d, { rotate: ma1 + 'deg' }]])
    key('.dc-skyb', [[tm, { opacity: 0 }], [tm + d, { opacity: 1 }]])
    key('.dc-stars', [[tm, { opacity: night(F) ? 1 : 0 }], [tm + d, { opacity: night(T) ? 1 : 0 }]])
    key('.dc-day', [[tm, { opacity: night(F) ? 0 : 1 }], [tm + d, { opacity: night(T) ? 0 : 1 }]])
    key('.dc-night', [[tm, { opacity: night(F) ? 1 : 0 }], [tm + d, { opacity: night(T) ? 1 : 0 }]])
    key('.dc-sun', [[tm, { translate: '0px 0px' }, OUT], [tm + d, { translate: `${(sx - fx).toFixed(1)}px ${(sy - fy).toFixed(1)}px` }]])
    ctx.$$('.dc-lit').forEach(e => key(e, [[tm, { opacity: night(F) ? .85 : .15 }], [tm + d, { opacity: night(T) ? .85 : .15 }]]))
    key('.dc-fill', [[tm, { scale: `${(F - p.open) / (p.close - p.open)} 1` }, OUT], [tm + d, { scale: `${(T - p.open) / (p.close - p.open)} 1` }]])
    key('.dc-mark', [[tm, { left: (X(F) - LINE.x + 20) + 'px' }, OUT], [tm + d, { left: (X(T) - LINE.x + 20) + 'px' }]])
    if (F === T) key('.dc-time .o', [[ctx.s, { opacity: 0 }]])
    else {
      key('.dc-time .o', [[tm + 0.2, { opacity: 1, translate: '0px 0px' }], [tm + 0.45, { opacity: 0, translate: '0px -90px' }]])
      key('.dc-time .n', [[tm + 0.3, { opacity: 0, translate: '0px 90px' }, BACK], [tm + 0.6, { opacity: 1, translate: '0px 0px' }]])
      // Die Zeile unter der Uhrzeit gehoert zur neuen Uhrzeit: sie kommt erst mit ihr, sonst stuende
      // "Feierabend" kurz unter "12:15" (so im Entwurf vom 17.11.2026)
      if (p.label) key('.dc-label', [[tm + 0.35, { opacity: 0 }, OUT], [tm + 0.6, { opacity: 1 }]])
      if (p.tones) { cue(tm + 0.05, 'tick', 0.7); cue(tm + 0.35, 'tick', 0.6); cue(tm + 0.62, 'tick', 0.7) }
    }
    if (p.mark) {
      const te = ctx.at('event')
      key('.dc-dot.new', [[te, { opacity: 0, scale: 2 }, BACK], [te + 0.3, { opacity: 1, scale: 1 }]])
      key('.dc-ring', [[te + 0.1, { opacity: 0.9, scale: 1 }, OUT], [te + 0.7, { opacity: 0, scale: 2.4 }]])
      if (p.tones) cue(te + 0.05, 'pop', 0.8, 1.1)
    }
  }
}
