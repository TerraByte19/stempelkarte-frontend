// Duell in Runden: links die Papierkarte, rechts das Handy mit der Karte in der Wallet, oben
// ein Spielstand. Je Teil eine Runde ("round", "title", "scene"): auf "action" passiert beiden
// Seiten dasselbe (Regen, Knick, Karte vergessen, App laden), auf "point" bekommt der Sieger
// den Haken, der Verlierer das Kreuz, und der Spielstand zaehlt hoch.
//
// Warum es diesen Baustein gibt: bis zum 17.11.2026 erzaehlte jedes Video Papier und Handy
// nacheinander (erst das Problem, dann die Loesung). Das Duell (FORMATE.md, F06) stellt beide
// nebeneinander und laesst sie Runde fuer Runde gegeneinander antreten: ein anderer Takt, ein
// Spielstand, der Spannung haelt, und eine ehrliche Runde ("app": beide brauchen keine App,
// Unentschieden). Jede Runde ist eine Aussage aus PRODUKT.md: "regen" und "knick" A4,
// "vergessen" A4 mit B1 und B2 (Scan mit der Handy-Kamera, Stempel sofort), "app" A2.
// Eine Runde zur Naehe des Ladens (C1) gibt es hier bewusst nicht: die zeigt shop-map, und das
// Bild "Naehe" ist in den Formaten knapp (hoechstens eins in drei Videos).
//
// Gezeichnet bis zum Bildrand: zwei Haelften mit eigener Wand (links warm gestreift, rechts
// kuehles Punktraster) und Theke, Beiwerk auf beiden Theken, Leuchtlinie in der Mitte.
// Aufteilung (Buehnen-Pixel): Spielstand 572 bis 692, Papierkarte 40 bis 500 (x) ab y = 960,
// Handy 586 bis 900 (x) und 716 bis 1440 (y), Ergebnis-Zettel 1462 bis 1532, Theken ab 1450.
// Jede Runde beginnt mit einem Banner quer durchs Bild ("Runde 2 / Vergessen"): im ersten Entwurf
// (17.11.2026) stand 43 s lang dasselbe Bild, die Runden waren nur an kleinen Zeichen zu erkennen. Rechts endet alles bei
// x = 900, damit eine Kamera 1,1 um die Mitte (x = 540) die Knopfspalte (ab 950) nicht trifft;
// eine Kamera auf eine Haelfte schoebe die andere hinein, deshalb nur mittig. Alle Klassen beginnen mit "vs-".
const SCENES = ['start', 'regen', 'knick', 'vergessen', 'app', 'ende']
// Regenstriche: [x, Phase, Laenge]; feste Liste, damit jedes Bild bei jedem Lauf gleich ist
const RAIN = [[40, 0, 70], [110, .3, 90], [170, .55, 60], [230, .15, 80], [300, .7, 70], [350, .4, 95], [420, .05, 65], [480, .6, 85],
  [580, .25, 75], [630, .5, 90], [700, .1, 60], [760, .65, 80], [820, .35, 70], [880, .8, 95], [940, .2, 65], [1010, .45, 85]]
const DROPS = [[40, 120, .1], [190, 200, .5], [110, 330, .3], [220, 420, .75], [60, 480, .6]]

export default {
  title: 'Duell: Papier gegen Handy, Runde für Runde',
  use: 'Für das Duell (FORMATE.md, F06): links die Papierkarte, rechts die Karte in der Wallet, oben der Spielstand. Je Teil eine Runde: auf "action" passiert beiden dasselbe (Regen, Knick, vergessen, App), auf "point" Haken, Kreuz und neuer Spielstand.',
  params: {
    shop: { default: 'Café Nordwind', doc: 'Name des Ladens auf beiden Karten (höchstens etwa 20 Zeichen, längere werden kleiner gesetzt)', same: 'Ladenname' },
    icon: { default: 'cup', doc: 'Stempel-Symbol: cup, bread, scissors, star, heart, check, kebab', same: 'Symbol' },
    stamps: { default: 10, doc: 'Felder auf beiden Karten, 4 bis 10', same: 'Stempelzahl' },
    filled: { default: 6, doc: 'So viele Stempel sind auf beiden Karten (in der Runde "vergessen" kommt rechts einer dazu)' },
    leftLabel: { default: 'Papier', doc: 'Name der linken Seite im Spielstand (höchstens etwa 10 Zeichen)' },
    rightLabel: { default: 'Handy', doc: 'Name der rechten Seite im Spielstand (höchstens etwa 10 Zeichen)' },
    round: { default: 1, doc: 'Nummer der Runde im Spielstand, 1 bis 9. 0 = keine Nummer (Einstieg und Ende)' },
    title: { default: 'Regen', doc: 'Name der Runde in der Mitte des Spielstands (höchstens etwa 14 Zeichen)' },
    scene: { default: 'regen', doc: 'Was in dieser Runde passiert: "start" (beide nur da), "regen" (A4), "knick" (A4), "vergessen" (links bleibt die Karte zu Hause, rechts Scan und Stempel: A4, B1, B2), "app" (beide ohne App: A2), "ende" (Pokal für den Sieger)' },
    winner: { default: 'right', doc: '"right", "left", "both" (Unentschieden, beide bekommen einen Punkt) oder "none" (kein Punkt)' },
    score: { default: [0, 0], doc: 'Spielstand VOR dieser Runde, [links, rechts]. Auf "point" kommt der Punkt dazu' },
    leftNote: { default: '', doc: 'Ergebnis links, erscheint auf "point" unter der Karte (höchstens etwa 16 Zeichen, z. B. "Matsch")' },
    rightNote: { default: '', doc: 'Ergebnis rechts (höchstens etwa 16 Zeichen, z. B. "Alles da")' },
    intro: { default: true, doc: 'Banner der Runde quer durchs Bild ("Runde 2", darunter "title"), vom Anfang des Teils bis kurz vor "action". Nicht bei "scene": "start". false: kein Banner' },
    tones: { default: true, doc: 'Eigene Töne (je Runde, ok und tick beim Punkt). false, wenn das Skript Klänge aus der Bibliothek setzt' }
  },
  captions: { min: 1 },
  anchors: p => {
    const a = {}
    if (!['start', 'ende'].includes(p.scene)) a.action = { cap: 0, word: 1, doc: 'Die Runde passiert: Regen setzt ein, die Papierkarte knickt, die Karte bleibt zu Hause und rechts wird gescannt, oder die App wird durchgestrichen' }
    if (p.winner !== 'none' || p.scene === 'ende') a.point = { cap: -1, word: -1, doc: 'Haken für den Sieger, Kreuz für den Verlierer, der Spielstand zählt hoch (Töne: ok, tick). Beim Ende: der Pokal' }
    return a
  },
  demo: {
    params: { shop: 'Eis am Markt', icon: 'heart', round: 1, title: 'Regen', scene: 'regen', winner: 'right', leftNote: 'Matsch', rightNote: 'Alles da' },
    captions: [{ lines: ['Runde eins:', 'Regen.'], accent: 2 }, { lines: ['Papier wird Matsch.', 'Punkt für das Handy.'], accent: 3 }],
    at: { cap: 1, word: -1, offset: 0.8 }
  },
  css: `
  .vs-wall { left: 0; top: 0; width: 1080px; height: 1920px; }
  .vs-board { left: 60px; right: 60px; top: 572px; height: 120px; border-radius: 30px; background: #120E2E; border: 2px solid rgba(185,176,255,.35); display: grid; grid-template-columns: 1fr 1.25fr 1fr; align-items: center; box-shadow: 0 18px 40px rgba(0,0,0,.45); }
  .vs-side { display: flex; align-items: center; justify-content: center; gap: 22px; }
  .vs-side b { font: 700 38px var(--display); white-space: nowrap; }
  .vs-num { position: relative; width: 70px; height: 84px; border-radius: 14px; background: #2A2270; font: 700 62px/84px var(--display); text-align: center; overflow: hidden; }
  .vs-num i { position: absolute; inset: 0; font-style: normal; }
  .vs-mid { text-align: center; border-left: 2px solid rgba(255,255,255,.1); border-right: 2px solid rgba(255,255,255,.1); }
  .vs-mid span { display: block; font: 600 24px var(--body); letter-spacing: .14em; text-transform: uppercase; opacity: .6; }
  .vs-mid b { display: block; font: 700 46px/1.05 var(--display); color: var(--lilac); white-space: nowrap; }
  .vs-vs { left: 480px; top: 1020px; width: 120px; height: 120px; border-radius: 50%; background: #120E2E; border: 5px solid var(--lilac); display: grid; place-items: center; font: 700 46px var(--display); color: var(--lilac); box-shadow: 0 0 40px rgba(142,130,245,.55); }
  .vs-paper { left: 40px; top: 960px; width: 460px; padding: 26px 30px 32px; border-radius: 16px; background: var(--paper); color: var(--ink); rotate: -6deg; box-shadow: 0 24px 40px rgba(0,0,0,.5); }
  .vs-ptop { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 16px; }
  .vs-ptop b { font: 700 32px var(--display); white-space: nowrap; }
  .vs-ptop span { font: 700 15px var(--body); letter-spacing: .16em; opacity: .5; }
  .vs-grid { display: grid; grid-template-columns: repeat(5, 66px); gap: 14px; justify-content: center; }
  .vs-slot { width: 66px; height: 66px; border-radius: 50%; border: 3px dashed rgba(26,26,46,.28); display: grid; place-items: center; position: relative; }
  .vs-slot.on { border: 5px solid var(--brand); color: var(--brand); }
  .vs-slot svg { width: 32px; }
  .vs-wet { position: absolute; inset: 0; border-radius: 16px; opacity: 0; background: radial-gradient(circle at 30% 40%, rgba(70,50,40,.55) 0 18%, transparent 30%), radial-gradient(circle at 72% 64%, rgba(70,50,40,.5) 0 20%, transparent 33%), radial-gradient(circle at 55% 18%, rgba(70,50,40,.4) 0 12%, transparent 22%); }
  .vs-crease { position: absolute; inset: 0; opacity: 0; }
  .vs-ghost { left: 40px; top: 960px; width: 460px; height: 290px; border-radius: 16px; border: 6px dashed rgba(244,238,226,.5); rotate: -6deg; display: grid; place-items: center; font: 700 120px var(--display); color: rgba(244,238,226,.6); opacity: 0; }
  .vs-phone { left: 586px; top: 716px; width: 314px; height: 724px; border-radius: 52px; padding: 10px; background: #06041A; border: 3px solid rgba(185,176,255,.42); box-shadow: 0 34px 60px rgba(0,0,0,.55); }
  .vs-screen { position: relative; width: 100%; height: 100%; border-radius: 42px; overflow: hidden; background: linear-gradient(180deg, #17123A, #0B0822); }
  .vs-island { position: absolute; top: 14px; left: 50%; width: 80px; height: 22px; margin-left: -40px; border-radius: 11px; background: #000; }
  .vs-wt { position: absolute; left: 22px; top: 58px; font: 700 28px var(--display); }
  .vs-card { position: absolute; left: 12px; right: 12px; top: 110px; padding: 20px 16px; border-radius: 22px; background: linear-gradient(163deg, var(--card-from), var(--card-to)); box-shadow: inset 0 0 0 1.5px rgba(255,255,255,.12); }
  .vs-chead { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
  .vs-chead span { flex: none; width: 40px; height: 40px; border-radius: 11px; background: #fff; color: var(--card-to); display: grid; place-items: center; }
  .vs-chead span svg { width: 26px; }
  .vs-chead b { font: 600 25px var(--display); white-space: nowrap; }
  .vs-cgrid { display: grid; grid-template-columns: repeat(5, 46px); gap: 9px; justify-content: center; }
  .vs-cs { width: 46px; height: 46px; border-radius: 50%; border: 2px dashed rgba(255,255,255,.4); position: relative; display: grid; place-items: center; }
  .vs-cs.on, .vs-cs .vs-new { background: #fff; color: var(--card-to); border: none; }
  .vs-cs svg { width: 24px; }
  .vs-cs .vs-new { position: absolute; inset: 0; border-radius: 50%; display: grid; place-items: center; opacity: 0; }
  .vs-peek { position: absolute; left: 12px; right: 12px; height: 90px; border-radius: 22px; background: rgba(255,255,255,.08); }
  .vs-beam { position: absolute; left: 12px; right: 12px; top: 120px; height: 6px; border-radius: 3px; background: var(--lilac); box-shadow: 0 0 20px var(--lilac); opacity: 0; }
  .vs-drop { position: absolute; width: 22px; height: 28px; border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%; background: rgba(185,220,255,.45); border: 2px solid rgba(255,255,255,.55); opacity: 0; }
  .vs-noapp { width: 120px; height: 120px; border-radius: 28px; background: #2A2270; border: 3px solid rgba(185,176,255,.5); display: grid; place-items: center; color: #fff; opacity: 0; }
  .vs-noapp svg { width: 70px; }
  .vs-noapp::after { content: ''; position: absolute; left: 10px; right: 10px; top: 54px; height: 10px; border-radius: 5px; background: #FF6B8B; rotate: -40deg; }
  .vs-mark { width: 150px; height: 150px; border-radius: 50%; display: grid; place-items: center; opacity: 0; box-shadow: 0 16px 34px rgba(0,0,0,.5); }
  .vs-mark svg { width: 92px; stroke-width: 3.2; }
  .vs-mark.win { background: var(--lilac); color: var(--night); }
  .vs-mark.lose { background: #FF6B8B; color: #fff; }
  .vs-note { top: 1462px; height: 70px; border-radius: 35px; padding: 0 24px; display: grid; place-items: center; font: 700 36px var(--display); white-space: nowrap; opacity: 0; }
  .vs-note b { display: block; line-height: 1.2; }
  .vs-note.l { left: 60px; width: 420px; background: rgba(244,238,226,.14); }
  .vs-note.r { left: 590px; width: 310px; background: rgba(185,176,255,.2); color: var(--lilac); }
  .vs-cup { width: 190px; opacity: 0; filter: drop-shadow(0 0 30px rgba(255,214,120,.55)); }
  .vs-intro { left: 0; right: 0; top: 900px; height: 250px; display: grid; place-items: center; align-content: center; gap: 6px; opacity: 0; z-index: 8;
    background: linear-gradient(90deg, rgba(60,52,137,0), rgba(60,52,137,.97) 16%, rgba(60,52,137,.97) 84%, rgba(60,52,137,0)); box-shadow: 0 0 80px rgba(14,10,36,.6); }
  .vs-intro span { font: 700 34px var(--body); letter-spacing: .2em; text-transform: uppercase; color: var(--lilac); }
  .vs-intro b { font: 700 124px/1 var(--display); letter-spacing: -.02em; white-space: nowrap; }
  `,
  build(ctx) {
    const { p, key, loop, cue, el } = ctx, { BACK, OUT, IN } = ctx.ease
    if (!SCENES.includes(p.scene)) ctx.fail(`"scene" ist eins von: ${SCENES.join(', ')}`)
    if (!['right', 'left', 'both', 'none'].includes(p.winner)) ctx.fail('"winner" ist "right", "left", "both" oder "none"')
    if (!Array.isArray(p.score) || p.score.length !== 2 || p.score.some(n => !Number.isInteger(n) || n < 0 || n > 9)) ctx.fail('"score" ist [links, rechts] mit ganzen Zahlen von 0 bis 9')
    if (!Number.isInteger(p.round) || p.round < 0 || p.round > 9) ctx.fail('"round" muss zwischen 0 und 9 liegen')
    if (!Number.isInteger(p.stamps) || p.stamps < 4 || p.stamps > 10) ctx.fail('"stamps" muss zwischen 4 und 10 liegen')
    if (!Number.isInteger(p.filled) || p.filled < 0 || p.filled > p.stamps - (p.scene === 'vergessen' ? 1 : 0)) ctx.fail(`"filled" muss zwischen 0 und ${p.stamps - (p.scene === 'vergessen' ? 1 : 0)} liegen (in der Runde "vergessen" kommt rechts einer dazu)`)
    for (const [k, n] of [['title', 16], ['leftNote', 18], ['rightNote', 16], ['leftLabel', 10], ['rightLabel', 10]]) if (String(p[k]).length > n) ctx.fail(`"${k}" ist zu lang (höchstens ${n} Zeichen)`)
    const gain = { right: [0, 1], left: [1, 0], both: [1, 1], none: [0, 0] }[p.winner]
    const after = p.scene === 'ende' ? p.score : [p.score[0] + gain[0], p.score[1] + gain[1]]

    // ---- Zwei Haelften bis zum Rand: Wand, Theke, Beiwerk, Leuchtlinie
    const g = [`<defs><pattern id="vs-hatch" width="36" height="36" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="36" height="36" fill="#34234A"/><rect width="9" height="36" fill="#3A284F"/></pattern>
      <pattern id="vs-dots" width="44" height="44" patternUnits="userSpaceOnUse"><rect width="44" height="44" fill="#1C1752"/><circle cx="22" cy="22" r="3" fill="rgba(185,176,255,.16)"/></pattern>
      <linearGradient id="vs-fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0E0A24"/><stop offset="1" stop-color="#0E0A24" stop-opacity="0"/></linearGradient>
      <linearGradient id="vs-glow" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#B9B0FF" stop-opacity="0"/><stop offset=".5" stop-color="#B9B0FF" stop-opacity=".45"/><stop offset="1" stop-color="#B9B0FF" stop-opacity="0"/></linearGradient></defs>`]
    g.push('<rect x="0" y="500" width="540" height="1420" fill="url(#vs-hatch)"/><rect x="540" y="500" width="540" height="1420" fill="url(#vs-dots)"/>')
    // Theken: links Holz mit Maserung, rechts glatt mit Glanzstreifen
    g.push('<rect x="0" y="1450" width="540" height="470" fill="#4A2F45"/><rect x="0" y="1450" width="540" height="14" fill="#6B4A5E"/>')
    for (const [y, x1, x2] of [[1500, 30, 380], [1560, 120, 520], [1630, 0, 300], [1700, 200, 540], [1770, 40, 420], [1840, 140, 540], [1900, 0, 330]]) g.push(`<path d="M${x1} ${y} q ${(x2 - x1) / 2} 14 ${x2 - x1} 0" fill="none" stroke="rgba(0,0,0,.18)" stroke-width="5"/>`)
    g.push('<rect x="540" y="1450" width="540" height="470" fill="#2A2270"/><rect x="540" y="1450" width="540" height="14" fill="#4A40A8"/>')
    for (const y of [1530, 1640, 1800]) g.push(`<rect x="540" y="${y}" width="540" height="${y === 1520 ? 40 : 18}" fill="rgba(255,255,255,.035)"/>`)
    // Beiwerk links: Stempelkissen und Kassenbons; rechts: Schale mit Muenzen und eine Pflanze
    g.push('<rect x="40" y="1600" width="170" height="90" rx="10" fill="#2B1E33"/><rect x="52" y="1610" width="146" height="58" rx="6" fill="#5A4FCF"/><rect x="270" y="1640" width="120" height="150" rx="6" fill="#E9E1D2" transform="rotate(12 330 1710)"/><rect x="292" y="1670" width="70" height="8" rx="4" fill="#B9AE9A" transform="rotate(12 330 1710)"/><rect x="292" y="1692" width="54" height="8" rx="4" fill="#B9AE9A" transform="rotate(12 330 1710)"/>')
    g.push('<ellipse cx="660" cy="1680" rx="90" ry="26" fill="#1A1446"/><circle cx="640" cy="1670" r="18" fill="#C9A94A"/><circle cx="676" cy="1674" r="18" fill="#D9B95A"/><rect x="930" y="1560" width="110" height="110" rx="14" fill="#3A2E64"/><path d="M985 1560 q-40 -90 -10 -150 M985 1560 q10 -110 50 -140 M985 1560 q-60 -40 -80 -100" fill="none" stroke="#5FA77A" stroke-width="14" stroke-linecap="round"/>')
    g.push('<rect x="510" y="500" width="60" height="1420" fill="url(#vs-glow)"/><rect x="537" y="500" width="6" height="1420" fill="#B9B0FF" opacity=".75"/>')
    g.push('<rect x="0" y="500" width="1080" height="150" fill="url(#vs-fade)"/>')
    ctx.html(`<svg class="abs vs-wall" viewBox="0 0 1080 1920">${g.join('')}</svg>`)

    // Regen liegt hinter den Karten, damit die Striche nicht ueber der Schrift stehen
    if (p.scene === 'regen') {
      ctx.html(`<div class="abs vs-rain" style="inset:0;opacity:0">${RAIN.map(([x, , l]) => `<i style="position:absolute;left:${x}px;top:560px;width:5px;height:${l}px;border-radius:3px;background:rgba(185,210,255,.55);rotate:12deg"></i>`).join('')}</div>`)
      ctx.$$('.vs-rain i').forEach((r, i) => loop(r, [{ translate: '0px 0px' }, { translate: '-180px 900px' }], 0.62, RAIN[i][1] * 0.62))
    }

    // ---- Spielstand
    const lab = `<span>${p.round ? 'Runde ' + p.round : p.scene === 'ende' ? 'Ergebnis' : 'Duell'}</span>`
    ctx.html(`<div class="abs vs-board" data-safe="Spielstand"><div class="vs-side"><b data-oneline="Name links">${''}</b><div class="vs-num"><i class="o"></i><i class="n"></i></div></div>
      <div class="vs-mid">${lab}<b data-oneline="Name der Runde"></b></div>
      <div class="vs-side"><div class="vs-num"><i class="o"></i><i class="n"></i></div><b data-oneline="Name rechts"></b></div></div>`)
    const [sl, sr] = ctx.$$('.vs-side')
    sl.querySelector('b').textContent = p.leftLabel; sr.querySelector('b').textContent = p.rightLabel
    const mid = ctx.$('.vs-mid b'); mid.textContent = p.title; ctx.fit(mid, 340, 28)
    const nums = [sl.querySelector('.vs-num'), sr.querySelector('.vs-num')]
    nums.forEach((n, i) => { n.querySelector('.o').textContent = p.score[i]; n.querySelector('.n').textContent = after[i] })
    ctx.html('<div class="abs vs-vs">VS</div>')

    // ---- Links: Papierkarte (mit Naesse, Knick und Umriss fuer "vergessen")
    const slots = (n, on, cls) => Array.from({ length: n }, (_, i) => `<div class="${cls}${i < on ? ' on' : ''}">${i < on ? ctx.icon(p.icon) : ''}</div>`).join('')
    ctx.html(`<div class="abs vs-paper" data-safe="Papierkarte"><div class="vs-ptop"><b data-oneline="Ladenname auf der Papierkarte"></b><span>STEMPELKARTE</span></div>
      <div class="vs-grid">${slots(p.stamps, p.filled, 'vs-slot')}</div><i class="vs-wet"></i>
      <svg class="vs-crease" viewBox="0 0 420 262" preserveAspectRatio="none"><path d="M40 20 L150 140 L120 250 M200 0 L240 120 L380 200 M260 262 L300 150 L420 90" fill="none" stroke="rgba(26,26,46,.35)" stroke-width="4"/></svg></div>
      <div class="abs vs-ghost">?</div>`)
    const paper = ctx.$('.vs-paper'), pname = ctx.$('.vs-ptop b')
    pname.textContent = p.shop; ctx.fit(pname, 250, 16)

    // ---- Rechts: Handy mit der Karte in der Wallet
    ctx.html(`<div class="abs vs-phone" data-safe="Handy"><div class="vs-screen"><i class="vs-island"></i><div class="vs-wt">Wallet</div>
      <div class="vs-card"><div class="vs-chead"><span>${ctx.icon(p.icon)}</span><b data-oneline="Ladenname auf der Wallet-Karte"></b></div><div class="vs-cgrid">${slots(p.stamps, p.filled, 'vs-cs')}</div></div>
      <div class="vs-peek" style="top:${p.stamps > 5 ? 350 : 290}px"></div><div class="vs-peek" style="top:${p.stamps > 5 ? 460 : 400}px;opacity:.6"></div><i class="vs-beam"></i>
      ${p.scene === 'regen' ? DROPS.map(([x, y]) => `<i class="vs-drop" style="left:${x}px;top:${y}px"></i>`).join('') : ''}</div></div>`)
    const phone = ctx.$('.vs-phone'), cname = ctx.$('.vs-chead b')
    cname.textContent = p.shop; ctx.fit(cname, 200, 13)

    // ---- Was in der Runde passiert
    const ta = ['start', 'ende'].includes(p.scene) ? null : ctx.at('action'), tp = p.winner !== 'none' || p.scene === 'ende' ? ctx.at('point') : null
    // Banner der Runde: kommt mit dem Teil, ist vor dem Geschehen der Runde wieder weg
    if (p.intro && p.scene !== 'start') {
      ctx.html('<div class="abs vs-intro"><span></span><b data-safe="Banner der Runde" data-oneline="Banner der Runde"></b></div>')
      const ib = ctx.$('.vs-intro b'), ia = ctx.$('.vs-intro')
      ctx.$('.vs-intro span').textContent = p.scene === 'ende' ? 'Ergebnis' : (p.round ? 'Runde ' + p.round : 'Duell')
      ib.textContent = p.title; ctx.fit(ib, 760, 60)
      const t0 = ctx.s, t1 = Math.max(t0 + 0.5, Math.min(t0 + 1.0, (ta ?? tp ?? t0 + 1.05) - 0.08))
      key(ia, [[t0, { opacity: 0, translate: '-220px 0px' }, OUT], [t0 + 0.14, { opacity: 1, translate: '0px 0px' }], [t1, { opacity: 1, translate: '0px 0px' }, IN], [t1 + 0.2, { opacity: 0, translate: '0px -60px' }]])
      if (p.tones) cue(t0, 'whoosh', 0.25)
    }
    if (ta != null && tp != null && tp < ta) ctx.fail('Anker "point" muss nach "action" liegen')
    if (p.scene === 'regen') {
      key('.vs-rain', [[ta - 0.05, { opacity: 0 }], [ta + 0.2, { opacity: 1 }]])
      key('.vs-wet', [[ta + 0.2, { opacity: 0 }], [ta + 1.1, { opacity: 1 }]])
      key('.vs-grid', [[ta + 0.3, { filter: 'blur(0px)' }], [ta + 1.2, { filter: 'blur(3px)' }]])
      key(paper, [[ta + 0.2, { skew: '0deg 0deg', scale: 1 }], [ta + 1.2, { skew: '-4deg 3deg', scale: 0.97 }]])
      ctx.$$('.vs-drop').forEach((d, i) => key(d, [[ta + DROPS[i][2], { opacity: 0, translate: '0px 0px' }], [ta + DROPS[i][2] + 0.15, { opacity: 1, translate: '0px 0px' }], [ta + DROPS[i][2] + 1.1, { opacity: 0, translate: '0px 120px' }]]))
      if (p.tones) cue(ta, 'whoosh', 0.22)
    }
    if (p.scene === 'knick') {
      const flat = 'polygon(0% 0%, 50% 0%, 100% 0%, 100% 50%, 100% 100%, 50% 100%, 0% 100%, 0% 50%)'
      const bent = 'polygon(6% 10%, 48% 4%, 94% 14%, 86% 52%, 96% 88%, 54% 94%, 4% 86%, 12% 46%)'
      key(paper, [[ta - 0.02, { clipPath: flat, scale: 1, rotate: '-6deg' }, BACK], [ta + 0.3, { clipPath: bent, scale: 0.86, rotate: '-14deg' }]])
      key('.vs-crease', [[ta, { opacity: 0 }], [ta + 0.15, { opacity: 1 }]])
      if (p.tones) cue(ta, 'crumple', 0.8)
    }
    if (p.scene === 'vergessen') {
      key(paper, [[ta - 0.02, { opacity: 1, translate: '0px 0px' }, IN], [ta + 0.35, { opacity: 0, translate: '-60px 40px' }]])
      key('.vs-ghost', [[ta + 0.2, { opacity: 0, scale: 0.9 }, BACK], [ta + 0.5, { opacity: 1, scale: 1 }]])
      key('.vs-beam', [[ta + 0.15, { opacity: 0, translate: '0px 0px' }], [ta + 0.2, { opacity: 1, translate: '0px 0px' }], [ta + 0.75, { opacity: 1, translate: '0px 140px' }], [ta + 0.85, { opacity: 0, translate: '0px 140px' }]])
      const slot = ctx.$$('.vs-cs')[p.filled], nw = el('i', 'vs-new', ctx.icon(p.icon)); slot.append(nw)
      key(nw, [[ta + 0.85, { opacity: 0, scale: 1.8 }, BACK], [ta + 1.1, { opacity: 1, scale: 1 }]])
      if (p.tones) { cue(ta + 0.15, 'scan', 0.7); cue(ta + 0.9, 'pop', 0.85, 1.2) }
    }
    if (p.scene === 'app') {
      ctx.html('<div class="abs vs-noapp" style="left:210px;top:810px"><svg class="ico" viewBox="0 0 24 24"><path d="M12 4v11"/><path d="M7 10l5 5 5-5"/><path d="M5 20h14"/></svg></div><div class="abs vs-noapp" style="left:683px;top:1040px;z-index:3"><svg class="ico" viewBox="0 0 24 24"><path d="M12 4v11"/><path d="M7 10l5 5 5-5"/><path d="M5 20h14"/></svg></div>')
      ctx.$$('.vs-noapp').forEach((n, i) => key(n, [[ta + i * 0.12, { opacity: 0, scale: 0.4 }, BACK], [ta + i * 0.12 + 0.3, { opacity: 1, scale: 1 }]]))
      if (p.tones) cue(ta + 0.05, 'pop', 0.7, 0.9)
    }

    // ---- Punkt: Haken, Kreuz, Ergebnis-Zettel, Spielstand
    if (tp != null) {
      const mark = (left, win) => {
        const m = el('div', 'abs vs-mark ' + (win ? 'win' : 'lose'), win ? ctx.icon('check') : '<svg class="ico" viewBox="0 0 24 24"><path d="M6 6l12 12"/><path d="M18 6L6 18"/></svg>')
        m.style.left = (left ? 195 : 668) + 'px'; m.style.top = (left ? 1190 : 1250) + 'px'; m.style.zIndex = 6
        ctx.root.append(m)
        key(m, [[tp, { opacity: 0, scale: 2 }, BACK], [tp + 0.28, { opacity: 1, scale: 1 }]])
      }
      if (p.scene === 'ende') {
        const left = p.score[0] > p.score[1]
        ctx.html(`<svg class="abs vs-cup" style="left:${left ? 175 : 648}px;top:${left ? 1240 : 1200}px;z-index:6" viewBox="0 0 120 120"><path d="M30 14h60v26c0 22-14 36-30 36S30 62 30 40Z" fill="#FFD27A"/><path d="M30 22H12c0 18 8 28 20 30M90 22h18c0 18-8 28-20 30" fill="none" stroke="#FFD27A" stroke-width="7"/><rect x="52" y="74" width="16" height="18" fill="#E8B04A"/><rect x="34" y="92" width="52" height="14" rx="5" fill="#E8B04A"/></svg>`)
        key('.vs-cup', [[tp, { opacity: 0, scale: 0.3, translate: '0px 60px' }, BACK], [tp + 0.4, { opacity: 1, scale: 1, translate: '0px 0px' }]])
        key(left ? phone : paper, [[tp, { opacity: 1 }], [tp + 0.4, { opacity: 0.45 }]])
        if (p.tones) cue(tp + 0.1, 'chime', 0.8)
      } else {
        const lw = p.winner === 'left' || p.winner === 'both', rw = p.winner === 'right' || p.winner === 'both'
        mark(true, lw); mark(false, rw)
        if (!lw && p.scene !== 'vergessen') key(paper, [[tp, { opacity: 1 }], [tp + 0.4, { opacity: 0.55 }]])
        if (!rw) key(phone, [[tp, { opacity: 1 }], [tp + 0.4, { opacity: 0.55 }]])
        nums.forEach((n, i) => {
          if (after[i] === p.score[i]) { key(n.querySelector('.n'), [[tp, { opacity: 0 }]]); return }
          key(n.querySelector('.o'), [[tp + 0.1, { opacity: 1, translate: '0px 0px' }, IN], [tp + 0.3, { opacity: 0, translate: '0px -70px' }]])
          key(n.querySelector('.n'), [[tp + 0.18, { opacity: 0, translate: '0px 70px' }, BACK], [tp + 0.42, { opacity: 1, translate: '0px 0px' }]])
        })
        if (p.tones) { cue(tp, 'ok', 0.7); cue(tp + 0.3, 'tick', 0.8) }
      }
      for (const [side, txt] of [['l', p.leftNote], ['r', p.rightNote]]) {
        if (!txt) continue
        ctx.html(`<div class="abs vs-note ${side}" data-safe="Ergebnis ${side === 'l' ? 'links' : 'rechts'}"><b data-oneline="Ergebnis ${side === 'l' ? 'links' : 'rechts'}"></b></div>`)
        const nt = ctx.$(`.vs-note.${side}`), nb = nt.querySelector('b'); nb.textContent = txt; ctx.fit(nb, side === 'l' ? 360 : 260, 24)
        key(nt, [[tp + 0.15, { opacity: 0, translate: '0px 30px' }, OUT], [tp + 0.45, { opacity: 1, translate: '0px 0px' }]])
      }
    }
    nums.forEach(n => { if (tp == null || p.scene === 'ende') key(n.querySelector('.n'), [[ctx.s, { opacity: 0 }]]) })
  }
}
