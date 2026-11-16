// Zwei Laeden gegenueber: eine Strasse, die in die Tiefe laeuft, links der eigene
// Laden, rechts der Laden gegenueber. Ueber dem eigenen Laden ein Herz, das auf ein
// Wort zerbricht, und der Stammkunde, der ueber die Strasse geht und gegenueber
// durch die Tuer verschwindet (die Ladenglocke dort schwingt).
// Entstanden fuer das Doener-Video ("Dein Stammkunde hat dich betrogen. Mit dem
// Doenerladen gegenueber."), gebaut fuer jeden Ladentyp: Namen und Symbole beider
// Laeden sind Parameter.
//
// Warum Fluchtpunkt-Perspektive und nicht die Strasse von der Seite (shop-street):
// "gegenueber" heisst, die Ladenfronten schauen sich an. Von der Seite sieht man nur
// eine Front, und zwei Laeden nebeneinander lesen sich als Nachbarn. Die Schilder
// haengen als Ausleger quer zur Wand: so stehen sie flach zum Zuschauer und die
// Namen bleiben auf dem Handy lesbar (Schrift auf einer schraegen Wand waere es nicht).
//
// Alle Klassen beginnen mit "sd-" (eine Szene aus mehreren Teilen traegt die Klassen
// aller ihrer Bausteine). Gezeichnet wird alles in Buehnen-Pixeln; die Figur ist die
// aus engine/parts.js, damit der Stammkunde aussieht wie die Kundin der anderen Bilder.
import { WALKER, walkerFigure, walkerCss, walkerSteps } from '../engine/parts.js'

const VP = { x: 540, y: 760 }                          // Fluchtpunkt: Augenhoehe der Kamera
const HUMAN = 0.46                                      // Koerpergroesse = 0,46 x Abstand der Fuesse zur Augenhoehe (Kamera auf etwa 4 m)
const L = { xn: 30, xf: 330, top: 600, bot: 1500 }     // linke Hauswand: vordere Kante x = 30, hintere x = 330
const R = { xn: 1050, xf: 750, top: 600, bot: 1500 }   // rechte Hauswand, gespiegelt
const CURB = 0.45                                       // Bordstein: x = VP.x +- CURB * (y - VP.y)
const DOOR = [0.55, 0.8], WIN = [0.08, 0.42]            // Tuer und Schaufenster als Anteil der Wand (0 vorn, 1 hinten)
const FADE = 640                                        // ab hier voll sichtbar, darueber blendet das Bild zum Textbereich hin aus
const RIVAL = { wall: '#3B2A5E', awn: ['#F0A35E', '#B8662E'], tile: '#E58A45' }
const OURS = { wall: '#332A7C', awn: ['#B9B0FF', '#5A4FCF'], tile: '#3C3489' }

const lerp = (a, b, t) => a + (b - a) * t
// Punkt auf einer Hauswand: s = Anteil von der vorderen zur hinteren Kante (im Bild gleichmaessig),
// v = Anteil von oben nach unten. Ober- und Unterkante laufen auf den Fluchtpunkt zu.
function wallPt(F, s, v) {
  const x = lerp(F.xn, F.xf, s), k = (x - F.xn) / (VP.x - F.xn)
  return [x, lerp(lerp(F.top, VP.y, k), lerp(F.bot, VP.y, k), v)]
}
const pts = list => list.map(p => p.map(n => n.toFixed(1)).join(',')).join(' ')
const quad = (F, s0, s1, v0, v1) => pts([wallPt(F, s0, v0), wallPt(F, s1, v0), wallPt(F, s1, v1), wallPt(F, s0, v1)])
// Boden: x = VP.x + r * (y - VP.y), r < 0 links
const ground = (r, y) => [VP.x + r * (y - VP.y), y]
const scaleAt = y => HUMAN * (y - VP.y) / WALKER.h

// Eine Hauswand mit Ladenfront: Wand, Obergeschoss-Fenster, Markise, Schaufenster, Tuer
function facade(F, C, uid) {
  // Die Wand laeuft vorn ueber den Bildrand hinaus weiter (s < 0): eine Kamerafahrt zur Seite
  // zeigte sonst neben der vorderen Kante den leeren Himmel
  let out = `<polygon points="${quad(F, -0.8, 1, 0, 1)}" fill="${C.wall}"/>`
  for (const [a, b] of [[0.1, 0.36], [0.55, 0.82]]) out += `<polygon points="${quad(F, a, b, 0.1, 0.34)}" fill="rgba(185,176,255,.16)"/>`
  out += `<polygon points="${quad(F, WIN[0], WIN[1], 0.6, 0.9)}" fill="rgba(185,176,255,.3)" stroke="#4A40A8" stroke-width="6"/>`
  out += `<polygon class="sd-door-${uid}" points="${quad(F, DOOR[0], DOOR[1], 0.6, 1)}" fill="#17113C" stroke="#4A40A8" stroke-width="6"/>`
  for (let i = 0; i < 8; i++) out += `<polygon points="${quad(F, 0.02 + i * 0.12, 0.14 + i * 0.12, 0.47, 0.56)}" fill="${C.awn[i % 2]}"/>`
  return out
}

export default {
  title: 'Zwei Läden gegenüber: Herz bricht, Stammkunde geht rüber',
  use: 'Der eigene Laden und der Laden gegenüber, Fronten zueinander. Über dem eigenen Laden zerbricht ein Herz, der Stammkunde geht über die Straße und verschwindet gegenüber durch die Tür. Für "Dein Stammkunde ... gegenüber".',
  params: {
    shop: { default: 'Café Nordwind', doc: 'Name des eigenen Ladens auf dem linken Schild (höchstens etwa 18 Zeichen, längere werden kleiner gesetzt)', same: 'Ladenname' },
    icon: { default: 'cup', doc: 'Symbol des eigenen Ladens: cup, bread, scissors, star, heart, check, kebab', same: 'Symbol' },
    rival: { default: 'Café Südwind', doc: 'Name des Ladens gegenüber, auf dem rechten Schild (höchstens etwa 18 Zeichen)' },
    rivalIcon: { default: 'cup', doc: 'Symbol des Ladens gegenüber' },
    heart: { default: true, doc: 'Herz über dem eigenen Laden, zerbricht auf den Anker "crack"' },
    walker: { default: true, doc: 'Der Stammkunde geht über die Straße zum Laden gegenüber und verschwindet auf den Anker "enter" durch dessen Tür' },
    from: { default: 0, doc: 'Wo der Stammkunde auf den Anker "walk" steht, als Anteil des Weges: 0 = vor dem eigenen Laden, 1 = an der Tür gegenüber' },
    smoke: { default: true, doc: 'Rauch steigt über dem Laden gegenüber auf (Grill)' },
    tones: { default: true, doc: 'Eigene Töne des Bausteins (thud beim Zerbrechen, ding an der Tür). false, wenn das Skript Klänge aus der Bibliothek setzt' }
  },
  captions: { min: 1 },
  anchors: p => ({
    ...(p.heart ? { crack: { cap: 0, word: -1, doc: 'Das Herz über dem eigenen Laden zerbricht (Ton: thud). Auf "betrogen" o. ä.' } } : {}),
    ...(p.walker ? {
      walk: { at: 'start', offset: 0, doc: 'Der Stammkunde geht los (von "from" aus)' },
      enter: { cap: -1, word: -1, doc: 'Er ist an der Tür gegenüber und verschwindet hinein, die Ladenglocke schwingt (Ton: ding)' }
    } : {})
  }),
  demo: {
    params: { shop: 'Döner Nordwind', icon: 'kebab', rival: 'Döner Südwind', rivalIcon: 'kebab' },
    captions: [{ lines: ['Dein Stammkunde', 'hat dich betrogen.'], accent: 2 }],
    at: { cap: 0, word: -1, offset: 0.4 }
  },
  css: `
  .sd-all { position: absolute; inset: 0; -webkit-mask-image: linear-gradient(180deg, transparent 0, transparent 522px, #000 ${FADE}px); mask-image: linear-gradient(180deg, transparent 0, transparent 522px, #000 ${FADE}px); }
  .sd-svg { left: 0; top: 0; }
  .sd-sign { height: 108px; display: flex; align-items: center; gap: 16px; padding: 0 22px 0 14px; border-radius: 18px; background: var(--paper); color: var(--ink);
    box-shadow: 0 14px 30px rgba(0,0,0,.45); white-space: nowrap; z-index: 4; }
  .sd-sign span { flex: none; width: 76px; height: 76px; border-radius: 18px; color: #fff; display: grid; place-items: center; }
  .sd-sign span svg { width: 50px; }
  .sd-sign b { font: 700 42px var(--display); letter-spacing: -.01em; }
  .sd-arm { height: 12px; border-radius: 6px; background: #4A40A8; z-index: 3; }
  .sd-heart { left: 96px; top: 772px; width: 250px; height: 230px; z-index: 6; filter: drop-shadow(0 16px 26px rgba(0,0,0,.5)); }
  .sd-heart svg { position: absolute; inset: 0; overflow: visible; }
  .sd-shard { position: absolute; width: 22px; height: 22px; background: #FF6B8B; opacity: 0; z-index: 6; }
  .sd-walker { width: ${WALKER.w}px; height: ${WALKER.h}px; transform-origin: 50% 100%; z-index: 5; }
${walkerCss('sd')}
  .sd-smoke { width: 64px; height: 64px; border-radius: 50%; background: radial-gradient(closest-side, rgba(232,229,243,.5), rgba(232,229,243,0)); opacity: 0; z-index: 2; }
  .sd-bell { width: 64px; height: 64px; transform-origin: 50% 6px; z-index: 4; color: var(--paper); }
  .sd-bell svg { width: 64px; height: 64px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
  .sd-ring { width: 120px; height: 60px; border-radius: 50%; border: 5px solid var(--paper); opacity: 0; z-index: 4; }
  `,
  build(ctx) {
    const { p, key, loop, cue, el } = ctx, { BACK, OUT, IN } = ctx.ease
    // Tuer gegenueber: dort verschwindet der Stammkunde. Er steht ein Stueck vor der Tuer auf dem Gehweg.
    const doorMid = wallPt(R, (DOOR[0] + DOOR[1]) / 2, 1), doorTop = wallPt(R, (DOOR[0] + DOOR[1]) / 2, 0.6)
    const END = [doorMid[0] - 6, doorMid[1] + 10], START = ground(-0.56, 1392)

    // ---- Kulisse: Himmel bleibt der Hintergrund der Buehne. Strasse, Gehwege, Haeuser am Ende der Strasse, beide Waende.
    const g = [], far = '#1F1850', farLit = 'rgba(185,176,255,.14)'
    // Haeuser hinten quer zur Strasse und die Fortsetzung beider Haeuserzeilen bis kurz vor den Fluchtpunkt
    g.push(`<rect x="430" y="610" width="220" height="160" fill="${far}"/>`, `<rect x="456" y="636" width="34" height="26" fill="${farLit}"/><rect x="520" y="636" width="34" height="26" fill="${farLit}"/><rect x="586" y="636" width="34" height="26" fill="${farLit}"/>`)
    g.push(`<polygon points="${pts([[330, 694], [470, 738], [470, 806], [330, 1065]])}" fill="#261E60"/>`, `<polygon points="${pts([[750, 694], [610, 738], [610, 806], [750, 1065]])}" fill="#2B1F55"/>`)
    // Gehwege (zwischen Hauskante und Bordstein) und Fahrbahn
    const yb = 2000
    g.push(`<polygon points="${pts([ground(-0.69, VP.y + 40), ground(-CURB, VP.y + 40), ground(-CURB, yb), ground(-0.69, yb)])}" fill="#2C2269"/>`)
    g.push(`<polygon points="${pts([ground(0.69, VP.y + 40), ground(CURB, VP.y + 40), ground(CURB, yb), ground(0.69, yb)])}" fill="#2C2269"/>`)
    g.push(`<polygon points="${pts([ground(-CURB, VP.y + 40), ground(CURB, VP.y + 40), ground(CURB, yb), ground(-CURB, yb)])}" fill="#120C33"/>`)
    for (const r of [-CURB, CURB]) g.push(`<line x1="${ground(r, VP.y + 40)[0]}" y1="${VP.y + 40}" x2="${ground(r, yb)[0]}" y2="${yb}" stroke="#4A40A8" stroke-width="8"/>`)
    // Mittelstreifen: Striche, die zur Tiefe hin kuerzer werden (gleiche Abstaende auf dem Boden)
    // Tiefe z: y = VP.y + 1240 / z. Gleiche Schritte in z sind gleiche Abstaende auf dem Boden.
    for (let i = 0; i < 16; i++) {
      const z0 = 1 + i * 0.8, y0 = VP.y + 1240 / z0, y1 = VP.y + 1240 / (z0 + 0.4)
      if (y1 < VP.y + 40) break
      const w0 = 0.02 * (y0 - VP.y), w1 = 0.02 * (y1 - VP.y)
      g.push(`<polygon points="${pts([[VP.x - w0, y0], [VP.x + w0, y0], [VP.x + w1, y1], [VP.x - w1, y1]])}" fill="rgba(185,176,255,.32)"/>`)
    }
    g.push(facade(L, OURS, 'l'), facade(R, RIVAL, 'r'))
    // Doenerspiess im eigenen Schaufenster, Glut dahinter; gegenueber steigt Rauch auf (siehe unten)
    const wl = wallPt(L, 0.25, 0.75)
    g.push(`<ellipse cx="${wl[0]}" cy="${wl[1]}" rx="34" ry="70" fill="rgba(240,163,94,.35)"/>`)
    ctx.html(`<div class="sd-all"><svg class="abs sd-svg" width="1080" height="1920" viewBox="0 0 1080 1920">${g.join('')}
      <polygon class="sd-glow" points="${quad(R, DOOR[0], DOOR[1], 0.6, 1)}" fill="rgba(255,214,150,.85)" opacity="0"/></svg></div>`)
    const all = ctx.$('.sd-all'), add = h => all.insertAdjacentHTML('beforeend', h)

    // ---- Schilder: Ausleger quer zur Wand, also flach zum Zuschauer. Links der eigene Laden, rechts der gegenueber.
    const sign = (x, side, name, ic, tile, safe) => {
      add(`<div class="abs sd-arm" style="left:${side < 0 ? x : x - 60}px;top:654px;width:60px"></div>
        <div class="abs sd-sign sd-sign-${side < 0 ? 'l' : 'r'}" data-safe="${safe}" style="top:620px"><span style="background:${tile}">${ctx.icon(ic)}</span><b data-oneline="${safe}"></b></div>`)
      const s = ctx.$(`.sd-sign-${side < 0 ? 'l' : 'r'}`); s.querySelector('b').textContent = name
      // Langer Name: kleiner setzen statt ueber die Bildmitte hinaus. Unter 32 px ist er auf dem Handy kaum zu lesen.
      if (ctx.fit(s.querySelector('b'), 286, 26) < 32) ctx.warn(`der Name "${name}" steht auf dem Schild sehr klein. Namen kürzen.`)
      const w = s.offsetWidth
      s.style.left = (side < 0 ? x + 54 : x - 54 - w) + 'px'
      return s
    }
    const xl = wallPt(L, 0.02, 0)[0] - 24, xr = wallPt(R, 0.02, 0)[0] + 24
    sign(xl, -1, p.shop, p.icon, OURS.tile, 'Schild des eigenen Ladens')
    sign(xr, 1, p.rival, p.rivalIcon, RIVAL.tile, 'Schild des Ladens gegenüber')

    // ---- Herz ueber dem eigenen Laden: steht von Anfang an da, zerbricht auf "crack"
    if (p.heart) {
      const H = 'M125 214 C74 176 12 132 12 72 C12 38 38 12 72 12 C96 12 114 26 125 46 C136 26 154 12 178 12 C212 12 238 38 238 72 C238 132 176 176 125 214 Z'
      // Riss im Zickzack: die linke Haelfte ist alles links davon, die rechte alles rechts
      const crack = [[125, 40], [108, 82], [136, 112], [112, 150], [130, 182], [125, 216]]
      const cl = `M0 0 L125 0 ${crack.map(([x, y]) => `L${x} ${y}`).join(' ')} L125 240 L0 240 Z`, cr = `M250 0 L125 0 ${crack.map(([x, y]) => `L${x} ${y}`).join(' ')} L125 240 L250 240 Z`
      add(`<div class="abs sd-heart" data-safe="Herz über dem eigenen Laden"><svg viewBox="0 0 250 230">
        <defs><clipPath id="sd-cl"><path d="${cl}"/></clipPath><clipPath id="sd-cr"><path d="${cr}"/></clipPath></defs>
        <g class="sd-hl" style="transform-origin:110px 214px"><path d="${H}" fill="#FF6B8B" clip-path="url(#sd-cl)"/><ellipse cx="62" cy="58" rx="22" ry="14" fill="rgba(255,255,255,.35)" transform="rotate(-35 62 58)"/></g>
        <g class="sd-hr" style="transform-origin:140px 214px"><path d="${H}" fill="#FF6B8B" clip-path="url(#sd-cr)"/></g>
        <g class="sd-whole"><path d="${H}" fill="#FF6B8B"/><ellipse cx="62" cy="58" rx="22" ry="14" fill="rgba(255,255,255,.35)" transform="rotate(-35 62 58)"/></g>
        <path class="sd-crack" d="M${crack.map(([x, y]) => `${x} ${y}`).join(' L')}" fill="none" stroke="#2A1240" stroke-width="7" stroke-linejoin="round" opacity="0"/>
      </svg></div>`)
      for (let i = 0; i < 5; i++) add(`<i class="abs sd-shard sd-sh${i}" style="left:${210 + (i % 3) * 8}px;top:${870 + i * 18}px;rotate:${i * 37}deg"></i>`)
      // Leichtes Pochen bis zum Bruch: ein stehendes Herz saehe aus wie ein Aufkleber
      const tc = ctx.at('crack')
      key('.sd-heart', [[ctx.s, { scale: 1 }], [tc - 0.5, { scale: 1 }, 'ease-in-out'], [tc - 0.3, { scale: 1.07 }, 'ease-in-out'], [tc - 0.1, { scale: 1 }], [tc, { scale: 1.1 }, OUT], [tc + 0.2, { scale: 1 }]])
      // Bis zum Bruch liegt das ganze Herz ueber den beiden Haelften: an ihrer gemeinsamen Kante bliebe sonst eine feine Naht stehen
      key('.sd-whole', [[tc - 0.001, { opacity: 1 }], [tc, { opacity: 0 }]])
      key('.sd-crack', [[tc - 0.01, { opacity: 0 }], [tc, { opacity: 1 }, OUT], [tc + 0.12, { opacity: 0 }]])
      key('.sd-hl', [[tc + 0.04, { rotate: '0deg', translate: '0px 0px' }, OUT], [tc + 0.5, { rotate: '-16deg', translate: '-26px 18px' }]])
      key('.sd-hr', [[tc + 0.04, { rotate: '0deg', translate: '0px 0px' }, OUT], [tc + 0.5, { rotate: '15deg', translate: '28px 22px' }]])
      ctx.$$('.sd-shard').forEach((s, i) => key(s, [[tc, { opacity: 0, translate: '0px 0px' }, OUT], [tc + 0.06, { opacity: 1, translate: '0px 0px' }], [tc + 0.6, { opacity: 0, translate: `${(i - 2) * 46}px ${60 + i * 22}px` }]]))
      if (p.tones) cue(tc, 'thud', 0.7)
    }

    // ---- Rauch ueber dem Laden gegenueber: der Grill laeuft
    if (p.smoke) {
      // Rauchwolken ueber der Markise, neben der Ladenglocke; sie steigen auf und werden groesser
      const sm = wallPt(R, 0.42, 0.42)
      for (let i = 0; i < 3; i++) {
        add(`<i class="abs sd-smoke sd-sm${i}" style="left:${(sm[0] - 20 + i * 18).toFixed(0)}px;top:${(sm[1] - 70).toFixed(0)}px"></i>`)
        loop(`.sd-sm${i}`, [{ opacity: 0, translate: '0px 20px', scale: '0.6 0.6' }, { opacity: 1, translate: '4px -30px', scale: '1 1' }, { opacity: 0, translate: '-10px -120px', scale: '1.8 1.8' }], 2.1, i * 0.7)
      }
    }

    // ---- Ladenglocke ueber der Tuer gegenueber
    add(`<div class="abs sd-bell" style="left:${(doorTop[0] - 32).toFixed(0)}px;top:${(doorTop[1] - 76).toFixed(0)}px"><svg viewBox="0 0 24 24"><path d="M12 2.5v1.8"/><path d="M6.2 16.8V11a5.8 5.8 0 0 1 11.6 0v5.8l1.6 1.7H4.6Z"/><path d="M10.2 20.6a1.9 1.9 0 0 0 3.6 0"/></svg></div>
      <i class="abs sd-ring" style="left:${(doorTop[0] - 60).toFixed(0)}px;top:${(doorTop[1] - 66).toFixed(0)}px"></i>`)

    // ---- Der Stammkunde: geht ueber die Strasse, verschwindet gegenueber durch die Tuer
    if (p.walker) {
      if (typeof p.from !== 'number' || p.from < 0 || p.from >= 1) ctx.fail('"from" muss zwischen 0 und 1 liegen (1 wäre schon an der Tür)')
      const tW = ctx.at('walk'), tE = ctx.at('enter')
      if (!(tE > tW + 0.2)) ctx.fail('Anker "enter" muss mindestens 0,2 s nach "walk" liegen')
      const at = f => [lerp(START[0], END[0], f), lerp(START[1], END[1], f)]
      const w = el('div', 'abs sd-walker', walkerFigure('sd')), fig = w.querySelector('.sd-fig'); all.append(w)
      // Ruhelage = an der Tuer (dort messen die Pruefungen); die Bewegung rechnet von dort aus
      const sEnd = scaleAt(END[1])
      w.style.left = (END[0] - WALKER.w / 2).toFixed(1) + 'px'; w.style.top = (END[1] - WALKER.h).toFixed(1) + 'px'
      const fr = []
      for (let i = 0; i <= 8; i++) {
        const f = lerp(p.from, 1, i / 8), q = at(f), t = lerp(tW, tE - 0.12, i / 8)
        fr.push([t, { translate: `${(q[0] - END[0]).toFixed(1)}px ${(q[1] - END[1]).toFixed(1)}px`, scale: scaleAt(q[1]).toFixed(3) }, 'linear'])
      }
      fr.push([tE, { translate: '0px 0px', scale: sEnd.toFixed(3) }])
      key(w, fr)
      walkerSteps(key, fig, 'sd', tW, tE - 0.12)
      // In der Tuer: das Licht drinnen geht an, er ist weg, die Tuer faellt zu
      key(w, [[ctx.s, { opacity: 1 }], [tE - 0.06, { opacity: 1 }, IN], [tE + 0.16, { opacity: 0 }]])
      key('.sd-glow', [[tE - 0.2, { opacity: 0 }, OUT], [tE - 0.05, { opacity: 1 }], [tE + 0.35, { opacity: 1 }, IN], [tE + 0.6, { opacity: 0 }]])
      key('.sd-bell', [[tE, { rotate: '0deg' }], [tE + 0.08, { rotate: '-26deg' }], [tE + 0.2, { rotate: '22deg' }], [tE + 0.32, { rotate: '-15deg' }], [tE + 0.44, { rotate: '9deg' }], [tE + 0.58, { rotate: '0deg' }]])
      key('.sd-ring', [[tE, { opacity: 0, scale: 0.4 }, OUT], [tE + 0.12, { opacity: 0.9, scale: 1 }], [tE + 0.5, { opacity: 0, scale: 1.6 }]])
      if (p.tones) cue(tE, 'ding', 0.6)
    }
  }
}
