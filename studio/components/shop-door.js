// Ladentuer in Nahaufnahme, auf Augenhoehe: Schild ueber der Tuer, Glastuer mit Griff und
// "Offen"-Schild, Ladenglocke am Ausleger, beleuchtetes Schaufenster mit drehendem
// Doenerspiess, Ziegelwand, Wandlaterne, Stufe und Gehweg. Auf den Anker "close" faellt die
// Tuer zu (der Stammkunde ist gerade hinein, hinter dem Milchglas noch als Schatten), die
// Glocke schwingt und klingelt, das Licht flackert einmal, das Schild wackelt.
//
// Warum es diesen Baustein gibt: im Doener-Video (17.11.2026) zoomte die Kamera zweimal in
// shop-duel auf die Tuer gegenueber (Faktor 1,5 und 1,6). Der Betreiber: "wenn du zoomst
// bei dem Klinge-Soundeffekt sieht man, dass du nur einen Teil animiert hast und der Rest
// ist leer". shop-duel ist fuer die Totale gezeichnet; vergroessert bleiben von ihm grosse
// flache Flaechen uebrig (dunkle Strasse, leere Wand, das Ende der Strasse). Eine Nahaufnahme
// braucht ein Bild, das fuer die Naehe gezeichnet ist: hier ist jede Flaeche bis zum
// Bildrand gefuellt (Ziegel, Fugen, Licht, Platten), und das Bild steht ohne Kamera.
// Deshalb gilt: auf diesen Baustein keine Kamera, hoechstens ein langsames Heranfahren,
// das im gezeichneten Bereich bleibt (siehe PLAYBOOK, Stil C, Kamera).
//
// Aufteilung (Buehnen-Pixel, 1080 x 1920): oben bis 522 px nichts (Textbereich), bis 620 px
// blendet die Wand ein. Schild 650 bis 816, Markise 836 bis 944, Tuer 104 bis 426 (x) und
// 984 bis 1590 (y), Schaufenster 580 bis 1040 (x) und 1004 bis 1430 (y), Gehweg ab 1600.
// Alles Wichtige (Schild, "Offen", Glocke, Spiess) liegt links von x = 950 und ueber
// y = 1536; rechts in der Knopfspalte von TikTok und unten im Bereich von Instagram liegt
// nur Beiwerk (Fensterrand, Gehweg, Aufsteller).
//
// Alle Klassen beginnen mit "dr-" (eine Szene aus mehreren Teilen traegt die Klassen aller
// ihrer Bausteine). Kein Zufall: jede "unregelmaessige" Stelle (dunklere Ziegel, Platten)
// steht als feste Liste im Code, damit jedes Bild bei jedem Lauf gleich ist.

const FADE = 620                                   // ab hier voll sichtbar, darueber blendet das Bild zum Textbereich hin aus
const DOOR = { x: 104, y: 984, w: 322, h: 606 }    // Tuerblatt = Oeffnung im Rahmen
const WIN = { x: 580, y: 1004, w: 460, h: 426 }    // Scheibe des Schaufensters
const HORIZON = 1128                               // Augenhoehe: 1,6 m ueber dem Boden bei 2,1 m Tuerhoehe
const GROUND = 1600                                // Fuss der Hauswand
const BELL = { x: 372, y: 952 }                    // Aufhaengepunkt der Glocke am Ausleger
const GUEST = { w: 200, h: 520 }                   // Stammkunde von hinten, im Tuerrahmen (k = 1)
const OPEN = 'perspective(1400px) rotateY(74deg)', SHUT = 'perspective(1400px) rotateY(0deg)'

const pts = list => list.map(p => p.map(n => (+n).toFixed(1)).join(',')).join(' ')
// Farbe abdunkeln (f < 1) fuer die zweite Bahn der Markise und die Kanten
function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.round(v * f))
  return '#' + c.map(v => v.toString(16).padStart(2, '0')).join('')
}

// Ziegelwand: zwei Muster uebereinander. Das zweite hat eine andere Periode und setzt einzelne
// dunklere und hellere Steine, sonst saehe die Wand wie Tapete aus.
const BRICK_W = 132, BRICK_H = 44
const brickDefs = () => {
  let a = `<pattern id="dr-brick" width="${BRICK_W}" height="${BRICK_H * 2}" patternUnits="userSpaceOnUse">
    <rect width="${BRICK_W}" height="${BRICK_H * 2}" fill="#2F2250"/>
    <rect x="3" y="3" width="126" height="38" rx="3" fill="#3F2D63"/>
    <rect x="-63" y="47" width="126" height="38" rx="3" fill="#3C2B5F"/><rect x="69" y="47" width="126" height="38" rx="3" fill="#3C2B5F"/>
    <rect x="3" y="3" width="126" height="6" rx="3" fill="rgba(185,176,255,.06)"/></pattern>`
  // Einzelne Steine: [Spalte, Reihe, Farbe] in einem Feld von 5 x 4 Ziegeln
  const odd = [[0, 0, '#4A3570'], [3, 1, '#35264F'], [1, 2, '#46336C'], [4, 3, '#33244D'], [2, 3, '#4B3772']]
  a += `<pattern id="dr-brick2" width="${BRICK_W * 5}" height="${BRICK_H * 4}" patternUnits="userSpaceOnUse">`
  for (const [c, r, f] of odd) a += `<rect x="${c * BRICK_W + 3 + (r % 2 ? -66 : 0)}" y="${r * BRICK_H + 3}" width="126" height="38" rx="3" fill="${f}"/>`
  return a + '</pattern>'
}

// Figur von hinten (Kopf mit Haaren, Rumpf, Arme, Beine). Dieselbe Form zweimal: hell im
// offenen Tuerrahmen, dunkel und unscharf als Schatten hinter dem Milchglas.
const guestFigure = cls => `<div class="dr-guest ${cls}"><i class="dr-lg dr-l1"></i><i class="dr-lg dr-l2"></i><i class="dr-ar dr-a1"></i><i class="dr-ar dr-a2"></i><i class="dr-tor"></i><i class="dr-hd"></i><i class="dr-hair"></i></div>`

export default {
  title: 'Ladentür nah: Tür fällt zu, Glocke klingelt',
  use: 'Die Tür eines Ladens in Nahaufnahme, voll gezeichnet: Schild, Glastür mit "Offen"-Schild, Ladenglocke, Schaufenster mit drehendem Dönerspieß, Wandlaterne. Der Stammkunde ist gerade hinein, die Tür fällt zu, die Glocke klingelt. Für "Und tschüss" und jede Nahaufnahme einer Ladentür (statt in shop-duel hineinzuzoomen).',
  params: {
    shop: { default: 'Café Südwind', doc: 'Name auf dem Schild über der Tür (höchstens etwa 18 Zeichen, längere werden kleiner gesetzt)' },
    icon: { default: 'cup', doc: 'Symbol auf dem Schild und auf dem Aufsteller: cup, bread, scissors, star, heart, check, kebab' },
    accent: { default: '#E58A45', doc: 'Farbe des Ladens als #RRGGBB: Markise, Symbolfeld, Rand des "Offen"-Schilds. Orange wie der Laden gegenüber in shop-duel; "#5A4FCF" für den eigenen Laden' },
    guest: { default: true, doc: 'Der Stammkunde ist gerade hinein: hinter der offenen Tür von hinten, nach dem Zufallen als Schatten hinter dem Milchglas' },
    spit: { default: true, doc: 'Drehender Dönerspieß vor dem Grill im Schaufenster (Imbiss, Dönerladen); false zeigt ein Regal mit Gläsern und Kuchen' },
    wobble: { default: true, doc: 'Das Schild über der Tür wackelt kurz (Anker "sign")' },
    tones: { default: true, doc: 'Eigene Töne (thud beim Zufallen, ding der Glocke). false, wenn das Skript Klänge aus der Bibliothek setzt ("ladenglocke")' }
  },
  captions: { min: 1 },
  anchors: p => ({
    close: { cap: -1, word: -1, doc: 'Die Tür fällt zu: Glocke schwingt und klingelt, das Licht flackert einmal (Töne: thud, ding). Davor steht sie offen' },
    ...(p.wobble ? { sign: { cap: -1, word: -1, offset: 0.06, doc: 'Das Schild wackelt. Vorgabe: mit dem Zufallen; liegt "close" auf einem anderen Wort, "sign" mit offset 0.06 dazulegen' } } : {})
  }),
  demo: {
    params: { shop: 'Döner Südwind', icon: 'kebab' },
    captions: [{ lines: ['Und tschüss.'], accent: 1 }],
    at: { cap: 0, word: -1, offset: 0.2 }
  },
  css: `
  .dr-all { position: absolute; inset: 0; overflow: hidden; -webkit-mask-image: linear-gradient(180deg, transparent 0, transparent 522px, #000 ${FADE}px); mask-image: linear-gradient(180deg, transparent 0, transparent 522px, #000 ${FADE}px); }
  .dr-svg { left: 0; top: 0; }
  .dr-signwrap { top: 650px; height: 170px; transform-origin: 50% 0; z-index: 6; }
  .dr-chain { position: absolute; top: 0; width: 8px; height: 36px; border-radius: 4px; background: repeating-linear-gradient(180deg, #8C80C8 0 8px, #5A4A88 8px 12px); }
  .dr-sign { position: relative; margin-top: 34px; height: 132px; display: flex; align-items: center; justify-content: center; gap: 22px; padding: 0 34px;
    border-radius: 22px; background: var(--paper); color: var(--ink); white-space: nowrap; box-shadow: 0 18px 34px rgba(0,0,0,.5), inset 0 -8px 0 rgba(26,26,46,.08); }
  .dr-sign span { flex: none; width: 96px; height: 96px; border-radius: 24px; color: #fff; display: grid; place-items: center; }
  .dr-sign span svg { width: 64px; }
  .dr-sign b { font: 700 66px var(--display); letter-spacing: -.015em; }
  .dr-in { left: ${DOOR.x}px; top: ${DOOR.y}px; width: ${DOOR.w}px; height: ${DOOR.h}px; overflow: hidden; z-index: 2; }
  .dr-in > svg { position: absolute; left: 0; top: 0; }
  .dr-guest { position: absolute; left: ${(DOOR.w - GUEST.w) / 2}px; top: ${DOOR.h - GUEST.h}px; width: ${GUEST.w}px; height: ${GUEST.h}px; transform-origin: 50% 100%; }
  .dr-guest i { position: absolute; }
  .dr-lg { top: 330px; width: 36px; height: 190px; border-radius: 18px; }
  .dr-l1 { left: 60px; background: #6A5EDB; } .dr-l2 { left: 104px; background: #8C80EE; }
  .dr-ar { top: 128px; width: 32px; height: 186px; border-radius: 16px; background: #A397F6; }
  .dr-a1 { left: 22px; rotate: 6deg; } .dr-a2 { left: 146px; rotate: -6deg; }
  .dr-tor { left: 38px; top: 110px; width: 124px; height: 246px; border-radius: 56px 56px 30px 30px; background: var(--lilac); }
  .dr-hd { left: 56px; top: 8px; width: 88px; height: 96px; border-radius: 50%; background: #EDE6FF; }
  .dr-hair { left: 53px; top: 2px; width: 94px; height: 86px; border-radius: 47px 47px 34px 34px; background: #2E2560; }
  .dr-leaf { left: ${DOOR.x}px; top: ${DOOR.y}px; width: ${DOOR.w}px; height: ${DOOR.h}px; transform-origin: 0 50%; z-index: 3;
    background: linear-gradient(90deg, #4E3E80, #44366F); border-radius: 4px; box-shadow: inset 0 0 0 4px #5C4C92, inset -10px 0 0 rgba(0,0,0,.12); }
  .dr-glass { position: absolute; left: 22px; top: 24px; width: 278px; height: 404px; overflow: hidden; border-radius: 6px;
    background: linear-gradient(180deg, rgba(255,226,172,.95), rgba(244,176,108,.9)); box-shadow: inset 0 0 0 5px #2A1D4F; }
  .dr-ghost { left: ${(DOOR.w - GUEST.w) / 2 - 22}px; top: ${DOOR.h - GUEST.h - 24}px; opacity: 0; filter: blur(9px); }
  .dr-ghost i { background: #5B3A62; }
  .dr-frost { position: absolute; inset: 0; background: repeating-linear-gradient(115deg, rgba(255,255,255,0) 0 34px, rgba(255,255,255,.1) 34px 46px, rgba(255,255,255,0) 46px 120px); }
  .dr-gdim, .dr-wdim { position: absolute; inset: 0; background: #120C33; opacity: 0; }
  .dr-open { position: absolute; left: 66px; top: 58px; width: 190px; height: 74px; border-radius: 14px; background: var(--paper); border: 5px solid; color: var(--ink);
    display: grid; place-items: center; box-shadow: 0 8px 16px rgba(0,0,0,.3); transform-origin: 50% -26px; rotate: -2deg; }
  .dr-open b { font: 700 42px var(--display); letter-spacing: .01em; }
  .dr-open::before, .dr-open::after { content: ''; position: absolute; top: -30px; width: 3px; height: 34px; background: #2A1D4F; }
  .dr-open::before { left: 62px; rotate: 24deg; transform-origin: 50% 100%; } .dr-open::after { right: 62px; rotate: -24deg; transform-origin: 50% 100%; }
  .dr-hook { position: absolute; left: 154px; top: 30px; width: 14px; height: 14px; border-radius: 50%; background: #2A1D4F; }
  .dr-handle { position: absolute; left: 282px; top: 240px; width: 18px; height: 230px; border-radius: 9px; background: linear-gradient(90deg, #FFE1A0, #E8B36A 45%, #A8742A); box-shadow: -6px 0 0 -2px #2A1D4F, 0 6px 10px rgba(0,0,0,.35); }
  .dr-rail { position: absolute; left: 22px; right: 22px; top: 440px; height: 20px; border-radius: 4px; background: #3A2E64; }
  .dr-kick { position: absolute; left: 22px; right: 22px; top: 470px; height: 112px; border-radius: 6px; background: repeating-linear-gradient(90deg, #6D5FA0 0 3px, #7A6CAE 3px 7px); box-shadow: inset 0 0 0 4px #3A2E64; }
  .dr-bell { left: ${BELL.x - 32}px; top: ${BELL.y - 4}px; width: 64px; height: 84px; transform-origin: 32px 4px; z-index: 5; filter: drop-shadow(0 8px 10px rgba(0,0,0,.45)); }
  .dr-bell svg { width: 64px; height: 84px; overflow: visible; }
  .dr-ring { left: ${BELL.x - 110}px; top: ${BELL.y + 4}px; width: 220px; height: 90px; opacity: 0; z-index: 5; }
  .dr-win { left: ${WIN.x}px; top: ${WIN.y}px; width: ${WIN.w}px; height: ${WIN.h}px; overflow: hidden; z-index: 1; }
  .dr-win > svg { position: absolute; left: 0; top: 0; }
  .dr-grill { position: absolute; left: 34px; top: 92px; width: 190px; height: 238px; border-radius: 16px; background: #3A1E2A; box-shadow: inset 0 0 0 6px #5A3440; }
  .dr-grill i { position: absolute; inset: 16px 18px; border-radius: 8px; background: repeating-linear-gradient(180deg, rgba(255,126,62,.95) 0 10px, rgba(255,126,62,.18) 10px 26px); }
  .dr-heat { position: absolute; left: -10px; top: 60px; width: 290px; height: 300px; border-radius: 50%; background: radial-gradient(closest-side, rgba(255,150,70,.55), rgba(255,150,70,0)); }
  .dr-spit { position: absolute; left: 54px; top: 74px; width: 150px; height: 278px; }
  .dr-spit .rod { position: absolute; left: 71px; top: 0; width: 8px; height: 278px; border-radius: 4px; background: #D8D2F0; }
  .dr-spit .cap { position: absolute; left: 50px; top: 16px; width: 50px; height: 16px; border-radius: 6px; background: #8A86A8; }
  .dr-spit .meat, .dr-spit .grain, .dr-spit .round { position: absolute; left: 4px; top: 30px; width: 142px; height: 214px; clip-path: polygon(0 0, 100% 0, 74% 100%, 26% 100%); }
  .dr-spit .meat { background: repeating-linear-gradient(180deg, #B8662E 0 20px, #94491F 20px 27px, #C97A3A 27px 31px); }
  .dr-spit .grain { background: repeating-linear-gradient(90deg, rgba(90,40,16,0) 0 22px, rgba(90,40,16,.45) 22px 28px, rgba(255,200,130,.25) 28px 32px, rgba(90,40,16,0) 32px 52px); background-size: 52px 100%; }
  .dr-spit .round { background: linear-gradient(90deg, rgba(40,14,6,.55) 0%, rgba(40,14,6,0) 30%, rgba(255,214,150,.4) 52%, rgba(40,14,6,0) 72%, rgba(40,14,6,.6) 100%); }
  .dr-spit .tray { position: absolute; left: 30px; top: 246px; width: 90px; height: 16px; border-radius: 50%; background: #8A86A8; }
  .dr-steam { position: absolute; width: 70px; height: 70px; border-radius: 50%; background: radial-gradient(closest-side, rgba(255,240,220,.55), rgba(255,240,220,0)); opacity: 0; }
  .dr-shelf { position: absolute; left: 30px; top: 96px; width: 220px; height: 230px; }
  `,
  build(ctx) {
    const { p, key, loop, cue } = ctx, { OUT, IN } = ctx.ease
    if (!/^#[0-9a-fA-F]{6}$/.test(p.accent)) ctx.fail(`"accent" muss eine Farbe wie "#E58A45" sein (bekam ${JSON.stringify(p.accent)})`)
    const A = p.accent, A2 = shade(A, 0.72), A3 = shade(A, 0.5)
    const g = []

    // ---- Wand: Ziegel bis zum Bildrand, oben dunkler (dort blendet das Bild aus), unten Sockel
    g.push(`<defs>${brickDefs()}
      <linearGradient id="dr-top" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0E0A24" stop-opacity=".7"/><stop offset="1" stop-color="#0E0A24" stop-opacity="0"/></linearGradient>
      <radialGradient id="dr-lamp"><stop offset="0" stop-color="#FFD08A" stop-opacity=".5"/><stop offset="1" stop-color="#FFD08A" stop-opacity="0"/></radialGradient>
      <radialGradient id="dr-cone" cx=".5" cy="0" r="1"><stop offset="0" stop-color="#FFE2A8" stop-opacity=".42"/><stop offset="1" stop-color="#FFE2A8" stop-opacity="0"/></radialGradient>
      <linearGradient id="dr-spillw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFBE78" stop-opacity=".2"/><stop offset="1" stop-color="#FFBE78" stop-opacity="0"/></linearGradient>
      <linearGradient id="dr-spilld" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFD696" stop-opacity=".42"/><stop offset="1" stop-color="#FFD696" stop-opacity="0"/></linearGradient>
      <linearGradient id="dr-pave" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2A2063"/><stop offset="1" stop-color="#1A1446"/></linearGradient>
      <linearGradient id="dr-shadow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0E0A24" stop-opacity=".55"/><stop offset="1" stop-color="#0E0A24" stop-opacity="0"/></linearGradient>
    </defs>`)
    g.push(`<rect x="0" y="380" width="1080" height="${GROUND - 380}" fill="url(#dr-brick)"/><rect x="0" y="380" width="1080" height="${GROUND - 380}" fill="url(#dr-brick2)"/>`)
    g.push(`<rect x="0" y="380" width="1080" height="420" fill="url(#dr-top)"/>`)
    // Fallrohr links am Bildrand, mit Schellen
    g.push(`<rect x="16" y="380" width="26" height="${GROUND - 380}" fill="#5A4A88"/><rect x="16" y="380" width="7" height="${GROUND - 380}" fill="rgba(255,255,255,.12)"/>`)
    for (const y of [700, 980, 1260, 1520]) g.push(`<rect x="10" y="${y}" width="38" height="12" rx="4" fill="#3A2E64"/>`)
    // Sockel unter dem Schaufenster: dunkle Platten
    g.push(`<rect x="548" y="1474" width="532" height="${GROUND - 1474}" fill="#2B2050"/>`)
    for (let x = 548; x < 1080; x += 104) g.push(`<rect x="${x + 4}" y="1480" width="96" height="${GROUND - 1486}" rx="4" fill="#33275C"/>`)
    // Lichtschein der Wandlaterne und der beiden Schildleuchten auf der Wand
    g.push(`<circle class="dr-lglow" cx="505" cy="1056" r="170" fill="url(#dr-lamp)"/>`)

    // ---- Schildleuchten: zwei Schwanenhaelse ueber der Schiene, ihr Licht faellt aufs Schild
    for (const x of [300, 780]) {
      g.push(`<path class="dr-cone" d="M${x - 20} 646 L${x - 150} 830 L${x + 150} 830 L${x + 20} 646 Z" fill="url(#dr-cone)"/>`)
      g.push(`<rect x="${x - 10}" y="598" width="20" height="16" rx="4" fill="#3A2E64"/><path d="M${x} 606 C${x} 580 ${x + 2} 590 ${x} 628" fill="none" stroke="#5A4A88" stroke-width="7"/>`)
      g.push(`<path d="M${x - 24} 646 Q${x} 618 ${x + 24} 646 Z" fill="#5A4A88"/><ellipse cx="${x}" cy="646" rx="18" ry="5" fill="#FFE2A8"/>`)
    }
    // Schiene, an der das Schild haengt, mit zwei Wandhaltern
    g.push(`<rect x="96" y="646" width="888" height="12" rx="6" fill="#5A4A88"/>`)
    for (const x of [120, 960]) g.push(`<path d="M${x - 10} 622 L${x + 10} 622 L${x + 4} 652 L${x - 4} 652 Z" fill="#3A2E64"/>`)

    // ---- Markise ueber Tuer und Fenster: Bahnen in der Farbe des Ladens, Volant mit Boegen
    g.push(`<rect x="0" y="836" width="1080" height="12" fill="#2A1D4F"/>`)
    for (let i = 0; i < 13; i++) {
      const x0 = -20 + i * 86
      g.push(`<polygon points="${pts([[x0, 848], [x0 + 86, 848], [x0 + 86 + (x0 + 43 - 540) * 0.03, 912], [x0 + (x0 + 43 - 540) * 0.03, 912]])}" fill="${i % 2 ? A2 : A}"/>`)
      g.push(`<path d="M${x0} 912 h86 v10 a43 22 0 0 1 -86 0 Z" fill="${i % 2 ? A2 : A}"/>`)
    }
    g.push(`<rect x="0" y="848" width="1080" height="10" fill="rgba(255,255,255,.14)"/><rect x="0" y="944" width="1080" height="56" fill="url(#dr-shadow)"/>`)

    // ---- Tuerrahmen, Stufe, Wandlaterne, Hausnummer, Ausleger der Glocke
    g.push(`<rect x="${DOOR.x - 24}" y="${DOOR.y - 24}" width="${DOOR.w + 48}" height="${GROUND - DOOR.y + 24}" rx="6" fill="#1A1236"/>`)
    g.push(`<rect x="${DOOR.x - 8}" y="${DOOR.y - 8}" width="${DOOR.w + 16}" height="${GROUND - DOOR.y + 8}" fill="none" stroke="${A3}" stroke-width="4"/>`)
    // Stufe vor der Tuer: Trittflaeche und Vorderkante
    g.push(`<polygon points="${pts([[60, 1588], [470, 1588], [492, 1626], [38, 1626]])}" fill="#5E4E92"/><rect x="38" y="1626" width="454" height="32" fill="#44377A"/><rect x="60" y="1588" width="410" height="5" fill="rgba(255,255,255,.12)"/>`)
    // Wandlaterne auf dem Pfeiler zwischen Tuer und Fenster
    g.push(`<rect x="497" y="1060" width="16" height="44" rx="4" fill="#2A1D4F"/>
      <path d="M476 1018 L505 996 L534 1018 Z" fill="#2A1D4F"/><rect x="503" y="984" width="4" height="14" fill="#2A1D4F"/>
      <rect x="482" y="1018" width="46" height="74" rx="4" fill="#2A1D4F"/><rect x="488" y="1024" width="34" height="62" rx="2" fill="#FFD68A" class="dr-lamp"/>
      <rect x="503" y="1024" width="4" height="62" fill="#2A1D4F"/><rect x="478" y="1090" width="54" height="10" rx="3" fill="#2A1D4F"/>`)
    g.push(`<rect x="478" y="1190" width="54" height="40" rx="8" fill="#F4EEE2"/><text x="505" y="1219" text-anchor="middle" style="font: 700 24px 'Space Grotesk', sans-serif" fill="#1A1A2E">17</text>`)
    g.push(`<rect x="444" y="908" width="16" height="34" rx="3" fill="#2A1D4F"/>
      <path d="M452 924 C430 922 400 926 ${BELL.x} ${BELL.y - 4}" fill="none" stroke="#2A1D4F" stroke-width="7" stroke-linecap="round"/>
      <path d="M430 923 c-6 -16 12 -22 14 -10" fill="none" stroke="#2A1D4F" stroke-width="5" stroke-linecap="round"/>`)

    // ---- Schaufenster: Rahmen und Sims (der Inhalt liegt in .dr-win darueber)
    g.push(`<rect x="${WIN.x - 20}" y="${WIN.y - 20}" width="${WIN.w + 40}" height="${WIN.h + 40}" rx="6" fill="#1A1236"/>`)
    g.push(`<rect x="548" y="1450" width="524" height="24" rx="4" fill="#5E4E92"/><rect x="548" y="1450" width="524" height="5" fill="rgba(255,255,255,.14)"/>`)

    // ---- Gehweg: Platten in Fluchtpunkt-Perspektive zur Augenhoehe, Licht aus Fenster und Tuer
    const vx = (x0, y) => 540 + (x0 - 540) * (y - HORIZON) / (GROUND - HORIZON)
    g.push(`<rect x="0" y="${GROUND}" width="1080" height="${1920 - GROUND}" fill="url(#dr-pave)"/>`)
    // Ein paar Platten etwas heller: [Spalte, Reihe]
    const ys = [GROUND, 1636, 1690, 1770, 1880, 2040]
    for (const [c, r] of [[1, 1], [4, 2], [2, 3], [6, 1], [5, 3], [0, 2]]) {
      const x0 = -480 + c * 240, x1 = x0 + 240, y0 = ys[r], y1 = ys[r + 1]
      g.push(`<polygon points="${pts([[vx(x0, y0), y0], [vx(x1, y0), y0], [vx(x1, y1), y1], [vx(x0, y1), y1]])}" fill="rgba(185,176,255,.05)"/>`)
    }
    for (const y of ys.slice(1, -1)) g.push(`<line x1="0" y1="${y}" x2="1080" y2="${y}" stroke="#3B2F80" stroke-width="${(2 + (y - GROUND) / 60).toFixed(1)}"/>`)
    for (let x0 = -480; x0 <= 1560; x0 += 240) g.push(`<line x1="${vx(x0, GROUND)}" y1="${GROUND}" x2="${vx(x0, 1920)}" y2="1920" stroke="#3B2F80" stroke-width="4"/>`)
    g.push(`<rect x="0" y="${GROUND}" width="1080" height="10" fill="rgba(14,10,36,.5)"/>`)
    g.push(`<polygon class="dr-wspill" points="${pts([[WIN.x, GROUND], [WIN.x + WIN.w, GROUND], [1180, 1920], [470, 1920]])}" fill="url(#dr-spillw)"/>`)
    g.push(`<polygon class="dr-dspill" points="${pts([[DOOR.x, 1658], [DOOR.x + DOOR.w, 1658], [580, 1920], [-40, 1920]])}" fill="url(#dr-spilld)" opacity="0"/>`)
    // Aufsteller (Kundenstopper) auf dem Gehweg: Tafel mit dem Symbol des Ladens in Kreide
    g.push(`<polygon points="${pts([[676, 1590], [692, 1590], [672, 1852], [656, 1852]])}" fill="#4A2E1C"/>
      <polygon points="${pts([[680, 1580], [858, 1580], [886, 1830], [652, 1830]])}" fill="#8A5A34"/>
      <polygon points="${pts([[694, 1596], [844, 1596], [866, 1812], [672, 1812]])}" fill="#1E1732"/>
      <use href="#ico-${p.icon}" x="718" y="1614" width="102" height="102" fill="none" stroke="#F4EEE2" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" opacity=".9"/>
      <path d="M704 1742 q30 -8 60 0 t60 0 M708 1772 q26 -6 52 0 t48 0" fill="none" stroke="#F4EEE2" stroke-width="5" stroke-linecap="round" opacity=".55"/>
      <rect x="648" y="1830" width="22" height="18" rx="4" fill="#4A2E1C"/><rect x="866" y="1830" width="22" height="18" rx="4" fill="#4A2E1C"/>`)

    ctx.html(`<div class="dr-all"><svg class="abs dr-svg" width="1080" height="1920" viewBox="0 0 1080 1920">${g.join('')}</svg></div>`)
    const all = ctx.$('.dr-all'), add = h => all.insertAdjacentHTML('beforeend', h)

    // ---- Schaufenster innen: Fliesen, Leuchtkasten, Haengelampe, Grill mit Spiess, Theke mit Salatbar
    const w = []
    w.push(`<defs><linearGradient id="dr-back" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C98048"/><stop offset="1" stop-color="#9E5A3A"/></linearGradient>
      <pattern id="dr-tile" width="38" height="38" patternUnits="userSpaceOnUse"><rect width="38" height="38" fill="none" stroke="rgba(255,236,200,.2)" stroke-width="2"/></pattern>
      <radialGradient id="dr-pend" cx=".5" cy="0" r="1"><stop offset="0" stop-color="#FFE9B8" stop-opacity=".55"/><stop offset="1" stop-color="#FFE9B8" stop-opacity="0"/></radialGradient></defs>`)
    w.push(`<rect width="${WIN.w}" height="${WIN.h}" fill="url(#dr-back)"/><rect width="${WIN.w}" height="${WIN.h}" fill="url(#dr-tile)"/><rect width="${WIN.w}" height="30" fill="#4A2A30"/>`)
    // Leuchtkasten mit Speisen: Bild, Strich, Preisfeld je Zeile (kein Text: auf dem Handy waere er ohnehin zu klein)
    w.push(`<rect x="262" y="44" width="176" height="150" rx="10" fill="#2B1A2E" stroke="${A}" stroke-width="4"/>`)
    for (let i = 0; i < 4; i++) w.push(`<circle cx="286" cy="${70 + i * 32}" r="10" fill="#F4EEE2" opacity=".85"/><rect x="304" y="${65 + i * 32}" width="${70 - (i % 2) * 18}" height="9" rx="4" fill="#F4EEE2" opacity=".6"/><rect x="396" y="${63 + i * 32}" width="28" height="14" rx="5" fill="${A}"/>`)
    w.push(`<path d="M150 0 V44" stroke="#2A1D4F" stroke-width="4"/><path d="M118 70 Q150 30 182 70 Z" fill="#2A1D4F"/><ellipse cx="150" cy="70" rx="30" ry="6" fill="#FFE9B8"/>
      <path class="dr-pcone" d="M122 70 L60 260 L240 260 L178 70 Z" fill="url(#dr-pend)"/>`)
    let inner = ''
    if (p.spit) inner = `<div class="dr-heat"></div><div class="dr-grill"><i></i></div>
      <div class="dr-spit"><i class="rod"></i><i class="cap"></i><i class="meat"></i><i class="grain"></i><i class="round"></i><i class="tray"></i></div>
      ${[0, 1, 2].map(i => `<i class="dr-steam dr-st${i}" style="left:${80 + i * 34}px;top:70px"></i>`).join('')}`
    else {
      // Ohne Spiess: Regal mit Glaesern und Kuchen hinter der Theke
      let sh = '<svg class="dr-shelf" width="220" height="230" viewBox="0 0 220 230">'
      for (const y of [70, 150, 228]) sh += `<rect x="0" y="${y - 8}" width="220" height="8" fill="#5A3440"/>`
      for (let i = 0; i < 5; i++) sh += `<rect x="${10 + i * 42}" y="22" width="30" height="40" rx="6" fill="rgba(255,240,220,.55)"/><rect x="${10 + i * 42}" y="18" width="30" height="8" rx="3" fill="${i % 2 ? A : '#F4EEE2'}"/>`
      for (let i = 0; i < 3; i++) sh += `<path d="M${14 + i * 70} 142 h56 v-26 a28 14 0 0 0 -56 0 Z" fill="${['#F4EEE2', '#E7B7C8', A][i]}"/><rect x="${14 + i * 70}" y="130" width="56" height="6" fill="rgba(90,40,16,.35)"/>`
      inner = `<div class="dr-heat"></div>${sh}</svg>`
    }
    // Theke vorn: Stahlkante, Holzfront, Salatbar mit Schuesseln, zwei Saucenflaschen
    let f = `<svg width="${WIN.w}" height="${WIN.h}" viewBox="0 0 ${WIN.w} ${WIN.h}">`
    f += `<rect x="236" y="262" width="214" height="62" rx="8" fill="rgba(255,255,255,.14)" stroke="rgba(255,255,255,.35)" stroke-width="3"/>`
    const bowls = ['#6FBF5A', '#E2553F', '#F4EEE2', '#9B5DB5', '#E8C25A']
    bowls.forEach((c, i) => { f += `<ellipse cx="${262 + i * 40}" cy="306" rx="18" ry="9" fill="#D8D2F0"/><ellipse cx="${262 + i * 40}" cy="302" rx="15" ry="7" fill="${c}"/>` })
    f += `<rect x="212" y="270" width="16" height="52" rx="6" fill="#D9452F"/><rect x="215" y="262" width="10" height="12" rx="3" fill="#F4EEE2"/>`
    f += `<rect x="188" y="276" width="16" height="46" rx="6" fill="#F4EEE2"/><rect x="191" y="268" width="10" height="12" rx="3" fill="#D9452F"/>`
    f += `<rect x="0" y="322" width="${WIN.w}" height="16" fill="#CFC8E8"/><rect x="0" y="322" width="${WIN.w}" height="4" fill="#FFFFFF" opacity=".5"/>`
    f += `<rect x="0" y="338" width="${WIN.w}" height="${WIN.h - 338}" fill="#6B3A2E"/>`
    for (let x = 14; x < WIN.w; x += 112) f += `<rect x="${x}" y="352" width="96" height="62" rx="6" fill="none" stroke="rgba(255,214,150,.22)" stroke-width="4"/>`
    // Spiegelungen auf der Scheibe
    f += `<polygon points="${pts([[40, 0], [120, 0], [0, 150], [0, 50]])}" fill="rgba(255,255,255,.1)"/><polygon points="${pts([[330, 0], [360, 0], [130, WIN.h], [100, WIN.h]])}" fill="rgba(255,255,255,.07)"/>`
    f += '</svg>'
    add(`<div class="abs dr-win"><svg width="${WIN.w}" height="${WIN.h}" viewBox="0 0 ${WIN.w} ${WIN.h}">${w.join('')}</svg>${inner}${f}<i class="dr-wdim"></i></div>`)

    // ---- Durch die offene Tuer: warmer Raum, Fliesenboden, hinten Theke im Licht des Grills
    const VPX = 540 - DOOR.x, HZ = HORIZON - DOOR.y // Fluchtpunkt im Tuerrahmen gerechnet
    let r = `<svg width="${DOOR.w}" height="${DOOR.h}" viewBox="0 0 ${DOOR.w} ${DOOR.h}">
      <defs><linearGradient id="dr-room" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E3A866"/><stop offset="1" stop-color="#C27A45"/></linearGradient>
      <radialGradient id="dr-rglow"><stop offset="0" stop-color="#FFB060" stop-opacity=".8"/><stop offset="1" stop-color="#FFB060" stop-opacity="0"/></radialGradient></defs>
      <rect width="${DOOR.w}" height="${DOOR.h}" fill="url(#dr-room)"/>
      <rect x="18" y="40" width="120" height="70" rx="8" fill="#2B1A2E"/><rect x="30" y="56" width="70" height="8" rx="4" fill="#F4EEE2" opacity=".6"/><rect x="30" y="76" width="54" height="8" rx="4" fill="#F4EEE2" opacity=".6"/>
      <circle cx="262" cy="170" r="110" fill="url(#dr-rglow)"/>
      <rect x="170" y="196" width="${DOOR.w - 170}" height="66" fill="#8A4A32"/><rect x="170" y="192" width="${DOOR.w - 170}" height="8" fill="#CFC8E8"/>`
    const floorTop = 262
    r += `<rect x="0" y="${floorTop}" width="${DOOR.w}" height="${DOOR.h - floorTop}" fill="#7A4232"/>`
    for (const k of [1.2, 1.5, 2, 2.6, 3.4]) { const y = HZ + (DOOR.h - HZ) / k; if (y > floorTop) r += `<line x1="0" y1="${y.toFixed(1)}" x2="${DOOR.w}" y2="${y.toFixed(1)}" stroke="rgba(255,214,150,.18)" stroke-width="3"/>` }
    for (let x0 = -400; x0 <= 800; x0 += 100) {
      const xt = VPX + (x0 - VPX) * (floorTop - HZ) / (DOOR.h - HZ)
      r += `<line x1="${xt.toFixed(1)}" y1="${floorTop}" x2="${x0}" y2="${DOOR.h}" stroke="rgba(255,214,150,.18)" stroke-width="3"/>`
    }
    r += `<path d="M96 0 V40" stroke="#2A1D4F" stroke-width="4"/><path d="M70 62 Q96 30 122 62 Z" fill="#2A1D4F"/><ellipse cx="96" cy="62" rx="24" ry="5" fill="#FFE9B8"/></svg>`
    add(`<div class="abs dr-in">${r}${p.guest ? guestFigure('dr-real') : ''}</div>`)

    // ---- Tuerblatt: Milchglas (mit dem Schatten des Stammkunden), "Offen"-Schild, Griff, Trittblech
    add(`<div class="abs dr-leaf"><div class="dr-glass">${p.guest ? guestFigure('dr-ghost') : ''}<i class="dr-frost"></i><i class="dr-gdim"></i></div>
      <i class="dr-hook"></i><div class="dr-open" data-safe="Schild Offen an der Tür" style="border-color:${A}"><b data-oneline="Schild Offen">Offen</b></div>
      <i class="dr-rail"></i><i class="dr-kick"></i><i class="dr-handle"></i></div>`)

    // ---- Ladenglocke am Ausleger, mit Klang-Boegen
    add(`<div class="abs dr-bell" data-safe="Ladenglocke"><svg viewBox="0 0 64 84">
        <defs><linearGradient id="dr-brass" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFE1A0"/><stop offset=".45" stop-color="#F2C46D"/><stop offset="1" stop-color="#A8742A"/></linearGradient></defs>
        <path d="M32 0 V12" stroke="#2A1D4F" stroke-width="5"/><circle cx="32" cy="14" r="6" fill="url(#dr-brass)"/>
        <path d="M13 60 C13 32 20 18 32 18 C44 18 51 32 51 60 L57 68 H7 Z" fill="url(#dr-brass)"/>
        <path d="M21 56 C21 38 24 28 30 24" fill="none" stroke="rgba(255,255,255,.6)" stroke-width="4" stroke-linecap="round"/>
        <rect x="5" y="66" width="54" height="7" rx="3.5" fill="#C99A4A"/><circle class="dr-clap" cx="32" cy="77" r="6.5" fill="#7A4E18"/></svg></div>
      <svg class="abs dr-ring" viewBox="0 0 220 90"><g fill="none" stroke="#F4EEE2" stroke-width="6" stroke-linecap="round">
        <path d="M60 18 Q46 40 60 64"/><path d="M38 8 Q18 40 38 76"/><path d="M160 18 Q174 40 160 64"/><path d="M182 8 Q202 40 182 76"/></g></svg>`)

    // ---- Schild ueber der Tuer: haengt an zwei Ketten an der Schiene, darf wackeln
    add(`<div class="abs dr-signwrap"><i class="dr-chain dr-c1"></i><i class="dr-chain dr-c2"></i>
      <div class="dr-sign" data-safe="Schild über der Tür"><span style="background:${A}">${ctx.icon(p.icon)}</span><b data-oneline="Ladenname auf dem Schild"></b></div></div>`)
    const name = ctx.$('.dr-sign b'); name.textContent = p.shop
    if (ctx.fit(name, 600, 34) < 44) ctx.warn(`der Name "${p.shop}" steht auf dem Schild sehr klein. Namen kürzen.`)
    // Breite erst nach dem Einpassen messen: das Schild waechst mit dem Namen (Ruhelage, ohne Drehung)
    const wrap = ctx.$('.dr-signwrap'), sw = Math.max(560, wrap.offsetWidth)
    wrap.style.width = sw + 'px'; wrap.style.left = (540 - sw / 2).toFixed(0) + 'px'
    ctx.$('.dr-c1').style.left = (sw * 0.16).toFixed(0) + 'px'; ctx.$('.dr-c2').style.left = (sw * 0.84 - 8).toFixed(0) + 'px'

    // ---- Bewegung, die immer laeuft: Spiess dreht, Grill glueht, Dampf steigt
    if (p.spit) {
      loop('.dr-spit .grain', [{ backgroundPosition: '0px 0' }, { backgroundPosition: '52px 0' }], 0.9)
      loop('.dr-grill i', [{ opacity: 0.85 }, { opacity: 1 }, { opacity: 0.85 }], 1.4)
      ctx.$$('.dr-steam').forEach((s, i) => loop(s, [{ opacity: 0, translate: '0px 10px', scale: '0.6 0.6' }, { opacity: 1, translate: '6px -24px', scale: '1 1' }, { opacity: 0, translate: '-8px -70px', scale: '1.7 1.7' }], 1.8, i * 0.6))
    }
    loop('.dr-heat', [{ opacity: 0.8 }, { opacity: 1 }, { opacity: 0.8 }], 1.4)

    // ---- Die Tuer faellt zu (Anker "close")
    const tc = ctx.at('close')
    // Bis kurz davor steht sie weit offen (nach innen, Angel links); das Zufallen beschleunigt, prallt einmal ab
    key('.dr-leaf', [[tc - 0.22, { transform: OPEN }, IN], [tc, { transform: SHUT }, OUT], [tc + 0.07, { transform: 'perspective(1400px) rotateY(4deg)' }, OUT], [tc + 0.17, { transform: SHUT }]])
    key('.dr-dspill', [[tc - 0.22, { opacity: 1 }, IN], [tc, { opacity: 0 }]])
    // Glocke: schwingt aus, der Kloeppel schlaegt gegen; Klang-Boegen
    key('.dr-bell', [[tc, { rotate: '0deg' }, OUT], [tc + 0.07, { rotate: '-30deg' }], [tc + 0.19, { rotate: '24deg' }], [tc + 0.31, { rotate: '-16deg' }], [tc + 0.43, { rotate: '10deg' }], [tc + 0.55, { rotate: '-5deg' }], [tc + 0.68, { rotate: '0deg' }]])
    key('.dr-ring', [[tc, { opacity: 0, scale: 0.6 }, OUT], [tc + 0.1, { opacity: 1, scale: 1 }], [tc + 0.32, { opacity: 0.8, scale: 1.12 }], [tc + 0.6, { opacity: 0, scale: 1.3 }]])
    // Licht flackert einmal: Fenster, Milchglas, Laterne, Schildleuchten
    const dim = [[tc, { opacity: 0 }], [tc + 0.03, { opacity: 0.5 }], [tc + 0.08, { opacity: 0.05 }], [tc + 0.13, { opacity: 0.3 }], [tc + 0.22, { opacity: 0 }]]
    key('.dr-wdim', dim); key('.dr-gdim', dim)
    for (const s of ['.dr-lglow', '.dr-lamp', '.dr-wspill', '.dr-pcone']) key(s, [[tc, { opacity: 1 }], [tc + 0.03, { opacity: 0.35 }], [tc + 0.08, { opacity: 1 }], [tc + 0.13, { opacity: 0.6 }], [tc + 0.22, { opacity: 1 }]])
    ctx.$$('.dr-cone').forEach(c => key(c, [[tc, { opacity: 1 }], [tc + 0.03, { opacity: 0.3 }], [tc + 0.08, { opacity: 1 }], [tc + 0.13, { opacity: 0.55 }], [tc + 0.22, { opacity: 1 }]]))
    if (p.tones) { cue(tc, 'thud', 0.4); cue(tc + 0.02, 'ding', 0.6) }

    // ---- Schild wackelt
    if (p.wobble) {
      const ts = ctx.at('sign')
      key('.dr-signwrap', [[ts, { rotate: '0deg' }, OUT], [ts + 0.08, { rotate: '1.8deg' }], [ts + 0.22, { rotate: '-1.3deg' }], [ts + 0.36, { rotate: '0.8deg' }], [ts + 0.5, { rotate: '-0.4deg' }], [ts + 0.66, { rotate: '0deg' }]])
    }

    // ---- Der Stammkunde: geht von der Schwelle in den Laden, danach als Schatten hinter dem Milchglas.
    // k = Abstand im Verhaeltnis zur Tuerebene; Fuesse wandern zur Augenhoehe, die Figur wird kleiner.
    if (p.guest) {
      const t0 = ctx.s - 0.3, t1 = tc + 1.0, rise = DOOR.y + DOOR.h - HORIZON
      const kAt = t => Math.min(3.2, 1.15 + 1.3 * Math.max(0, t - ctx.s))
      const fr = [], l1 = [], l2 = []
      for (let t = t0; t <= t1 + 1e-6; t += 0.05) {
        const k = kAt(t), bob = Math.abs(Math.sin((t - t0) * Math.PI / 0.32)) * -6 / k
        fr.push([t, { translate: `${(48 * (k - 1)).toFixed(1)}px ${(-rise * (1 - 1 / k) + bob).toFixed(1)}px`, scale: (1 / k).toFixed(3) }, 'linear'])
        const ph = Math.sin((t - t0) * Math.PI / 0.32)
        l1.push([t, { translate: `0px ${(Math.max(0, ph) * -14).toFixed(1)}px` }, 'linear']); l2.push([t, { translate: `0px ${(Math.max(0, -ph) * -14).toFixed(1)}px` }, 'linear'])
      }
      for (const sel of ['.dr-real', '.dr-ghost']) {
        key(sel, fr)
        key(`${sel} .dr-l1`, l1); key(`${sel} .dr-l2`, l2)
      }
      // Hinter dem Milchglas erst, wenn die Tuer zu ist; dann verschwindet er nach hinten
      key('.dr-ghost', [[tc - 0.02, { opacity: 0 }], [tc, { opacity: 0.7 }, 'linear'], [tc + 0.5, { opacity: 0.55 }, IN], [tc + 0.95, { opacity: 0 }]])
    }
  }
}
