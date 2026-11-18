// Zwei Laeden gegenueber, in 3D: eine Kreuzung bei Nacht, schraeg von oben (isometrisch),
// spielzeughaft. Der eigene Laden steht an der einen Ecke, der Laden gegenueber an der
// anderen; ueber dem eigenen Laden schwebt ein Herz, das auf ein Wort zerbricht, und der
// Stammkunde geht aus dem eigenen Laden quer ueber die Kreuzung und verschwindet gegenueber
// durch die Tuer (die Ladenglocke dort schwingt). Dieselbe Geschichte wie shop-duel, aber als
// 3D-Bild, wie es die staerksten Mitbewerber zeigen (Stil gelernt, nichts uebernommen: eigene
// Laeden, eigene Farben, eigene Symbole).
//
// Warum Kreuzung und nicht zwei Fronten an derselben Strasse: in einer Ansicht schraeg von
// oben sieht man nur Waende, deren Vorderseite zur Kamera zeigt. Zwei Fronten, die sich an
// einer Strasse genau anschauen, zeigen beide quer zur Kamera und waeren nur hauchduenne
// Streifen. An einer Kreuzung zeigt die Front links nach rechts unten und die Front rechts
// nach links unten: im Bild schauen sich beide Laeden an, und beide Schilder sind lesbar.
//
// Wie das Bild entsteht: mit dem 3D-Baukasten engine/kit3d.js (three.js aus engine/vendor, ohne
// Netz). Seit dem 17.11.2026 (abends) stehen Renderer, Licht, Palette, Laden, Figur, Herz,
// Glocke, Rauch, Kamera und Pruefkaesten dort, damit jeder weitere 3D-Baustein dieselbe Welt
// zeigt; hier bleibt, was nur diese Szene hat: der Stadtplan um die Kreuzung, der Platz mit dem
// Brunnen, der Weg des Stammkunden und der vermessene Ausschnitt. Das Bild blieb dabei Pixel fuer
// Pixel gleich (Standbilder des Doener-Videos und von videos/_probe-3d vorher und nachher).
// Alles, was sich bewegt (Kamera, Figur, Herz, Glocke, Rauch), ist eine reine Funktion von t;
// die Stadt entsteht aus einem festen Startwert. Kein Math.random, keine Uhr: Bild N sieht in
// jedem Lauf gleich aus (tools/test_3d.mjs prueft das).
//
// Rechenzeit: Chromium rechnet WebGL hier ohne Grafikkarte (SwiftShader). Gemessen am
// 17.11.2026: Schatten jedes Bild neu zu werfen kostete eine Sekunde je Bild, durchsichtige
// Flecken am Boden (Lichtkegel, Kontaktschatten) noch einmal so viel. Deshalb: der Schatten
// wird EINMAL geworfen (nur Dinge, die stillstehen, werfen ihn; die Figur hat einen weichen
// Fleck), Lichtkegel und Kontaktschatten sind in eine Bodentextur gemalt, die Stadt hat
// einfache Materialien. Kanten glaettet 4-faches Multisampling.
//
// Pruefungen: die Leinwand ist fuer die Pruefungen des Studios nur eine Flaeche. Deshalb legt der
// Baustein bei jedem seek(t) (ctx.place, auch ohne Zeichnen) unsichtbare Kaesten mit data-safe auf beide
// Schilder, das Herz und den Stammkunden, genau dorthin, wo die Kamera sie hinwirft. So sehen Sperrzonen,
// Knopfspalte und Textabstand auch in 3D, was sie in 2D sehen. Vorher stand das Schild rechts bis x = 1069
// unter den TikTok-Knoepfen, und make.mjs meldete "ok knopfspalte" (Review 17.11.2026).
//
// Bildausschnitt: die Kamera endet immer im selben, vermessenen Ausschnitt (beide Fronten, Schilder und Herz
// mit Rand, rechts frei von der Knopfspalte) und faehrt von weiter weg heran. "push" bestimmt also nur, wie
// weit sie VORHER weg war, und kann nichts mehr abschneiden; frueher fuhr sie ueber den Ausschnitt hinaus,
// und bei push 0,25 waren "...sse Sonne" und "Café M..." angeschnitten.
//
// ================================================================================================ mode "nah"
// Seit dem 18.11.2026 zeigt dieselbe Kreuzung auch C1 (PRODUKT.md): ein weicher Lichtring liegt um den
// eigenen Laden auf dem Boden (das Gebiet, in dem das Handy die Karte von selbst zeigt), ein Kunde geht auf
// dem Gehweg gegenueber des Platzes vorbei, und sobald er den Ring betritt, springt ueber ihm eine Blase aus
// seinem Handy: der Sperrbildschirm mit "Noch 2 Stempel bis: Gratis-Döner". Danach kann er sich zur Tuer
// drehen und hineingehen. Was dabei zaehlt und warum:
// - "In der Naehe" ist nicht "vor der Tuer" (Korrektur des Betreibers am zweiten Video). Der Ring ist deshalb
//   gross (10,5 m um die Tuer, die ganze Kreuzung), und der Kunde betritt ihn auf der anderen Seite der
//   Kreuzung, gut 10 m von der Tuer weg. Eine Zahl steht nie im Bild (PRODUKT.md N3).
// - Der Laden sieht nichts und schickt nichts: keine Linie, keine Welle vom Laden zum Handy. Der Ring steht
//   still (er pulsiert nicht vom Laden aus, das saehe aus wie ein Sender), und er reagiert nicht, wenn der
//   Kunde ihn betritt. Leuchten tut nur das Handy, und die Blase kommt aus dem Handy (Lichtkegel vom Handy
//   hinauf zur Blase).
// - Die Blase ist ein 3D-Koerper (Platte mit Kante, leicht gedreht) mit fester Groesse im BILD, nicht in der
//   Welt: sonst waere der Text in der weiten Ansicht ("stadt") zu klein. Sie schwebt im Streifen zwischen den
//   Textzeilen und den Schildern (y 600 bis knapp ueber dem hoechsten Schild) und deckt nie ein Schild zu.
//   Sie steht physisch hoch ueber der Stadt (70 % des Wegs von der Kamera zum Kunden): dort ist kein Haus
//   davor, also braucht sie keinen Sondertrick mit dem Tiefentest.
// - Der Kunde geht auf dem Gehweg westlich der Nord-Sued-Strasse nach Norden: der einzige Weg, auf dem er im
//   Ausschnitt des Doener-Videos frei zu sehen ist, den Ring weit weg von der Tuer betritt und die Blase ueber
//   ihm keinen Laden verdeckt. Vor dem Laden gegenueber (x = 2,25) haette ihm die Markise den Kopf verdeckt;
//   von Westen kommend laege der Eintritt unter dem eigenen Laden, und die Blase deckte dessen Schild zu.
// - Ohne mode "nah" bleibt alles wie vorher (Standbilder des Doener-Videos vorher und nachher Pixel fuer
//   Pixel verglichen, 18.11.2026).
import { ICONS } from '../engine/icons.js'

const SS = 1 // Bildpunkte je Buehnenpunkt; 2 waere glatter, kostet aber das Dreifache

// Stadtplan in Metern. Strassen liegen im Raster P, die Kreuzung im Ursprung.
const RH = 1.9          // halbe Fahrbahn
const B = RH + 1.25     // Hauskante, von der Strassenmitte aus (Fahrbahn + Gehweg)
const P = 24            // Abstand der Strassen
const CURB = 0.15       // Hoehe der Gehwege
const SHOP = { w: 5.6, d: 6, h: 9, door: 1.25 }   // Laden: Breite der Front, Tiefe, Hoehe, Tuermitte ab Ecke
const LIGHT = 18        // Staerke des Lichts vor jedem Laden (Punktlicht)
// Bodentextur: deckt x und z von GO bis GO + GS ab (weiter hinten liegt Dunst)
const GO = -72, GS = 144, GN = 1024

// mode "nah" (Masse fuer den eigenen Laden links; rechts wird gespiegelt, siehe build)
const NAH = {
  R: 10.5,        // Ring um die Tuer: ueber die ganze Kreuzung, damit niemand "vor der Tuer" stehen muss
  XL: -2.55,      // Gehweg westlich der Nord-Sued-Strasse (am Platz), auf dem der Kunde nach Norden geht
  KZ: 2.45,       // Ecke des Platzes: hier endet der Gehweg (Bordstein bei z = 1,9)
  WALK: 2.3,      // Gehtempo in m/s, wie in iso-shop
  BW: 640, BH: 300, BR: 44,   // Blase im Bild: Breite, Hoehe, Eckradius (Bildpunkte). Hoeher als 300 reichte ihre
                               // Unterkante im Ausschnitt "laden" bis an die Schilder (oberstes ab y 925)
  TOP: 607        // Oberkante der Blase: darueber stehen die Textzeilen (FIT.top 600; die Drehung hebt die Ecken um 4 px)
}
const DASH = /[\u2012-\u2015]/
// Vermessener Endausschnitt des Duells und sein Ziel (warum so: Abschnitt "Kamera" in build). Auf Modulebene,
// weil mode "nah" im Ausschnitt "laden" genau dieselbe Kamera nimmt: ein Video kann vom Duell in die Naehe
// schneiden, und die Stadt steht still an ihrem Platz.
const FRAME = { dist: 100, dx: 46, dy: 108 }
const aimDuell = (az, target) => { const c = SHOP.w * (Math.sin(az) - Math.cos(az)) / 2; target.set(c * Math.cos(az), 1.6, c * Math.sin(az)) }

export default {
  title: 'Zwei Läden gegenüber in 3D: Kreuzung bei Nacht, Stammkunde geht rüber',
  use: 'Isometrische Nachtszene in 3D: der eigene Laden und der Laden gegenüber an einer Kreuzung, beide Fronten zueinander. Über dem eigenen Laden zerbricht ein Herz, der Stammkunde geht über die Kreuzung und verschwindet gegenüber durch die Tür, die Ladenglocke schwingt. Die Kamera fährt langsam heran und dreht sich ein paar Grad. Für "Dein Stammkunde ... gegenüber", wenn es nach den großen Mitbewerbern aussehen soll. Mit "mode": "nah" dieselbe Kreuzung für C1: ein Lichtring um den eigenen Laden, ein Kunde betritt ihn auf der anderen Seite der Kreuzung, und über ihm springt aus seinem Handy der Sperrbildschirm mit "Noch 2 Stempel bis: Gratis-Döner"; der 3D-Ersatz für shop-map und shop-street. Rechnet etwa 1,3 s je Bild (ohne Grafikkarte), also deutlich länger als die 2D-Bausteine.',
  params: {
    shop: { default: 'Döner Palast', doc: 'Name des eigenen Ladens auf seinem Schild (höchstens etwa 14 Zeichen). Passt er in einer Zeile nur klein, steht er in zwei Zeilen: vorn klein, das letzte Wort groß ("Döner" über "Nordwind")', same: 'Ladenname' },
    icon: { default: 'kebab', doc: 'Symbol des eigenen Ladens: cup, bread, scissors, star, heart, check, kebab', same: 'Symbol' },
    accent: { default: '#7366E8', doc: 'Farbe des eigenen Ladens (Markise, Symbolfeld)' },
    rival: { default: 'Imbiss Sonne', doc: 'Name des Ladens gegenüber (höchstens etwa 14 Zeichen, lange Namen wie bei "shop" in zwei Zeilen)' },
    rivalIcon: { default: 'kebab', doc: 'Symbol des Ladens gegenüber' },
    rivalAccent: { default: '#E58A45', doc: 'Farbe des Ladens gegenüber' },
    ours: { default: 'left', doc: 'Auf welcher Seite der eigene Laden steht: "left" oder "right"' },
    heart: { default: true, doc: 'Herz über dem eigenen Laden, zerbricht auf den Anker "crack"' },
    walker: { default: true, doc: 'Der Stammkunde geht über die Kreuzung (Anker "walk", "cross", "enter")' },
    back: { default: false, doc: 'true: er kommt vom Laden gegenüber zurück in den eigenen Laden (Schluss "so bleibt er bei dir"); das Herz zerbricht dann nicht, es pocht' },
    from: { default: 0, doc: 'Wo der Stammkunde auf "walk" steht, als Anteil des Weges (0 = drinnen hinter der eigenen Tür, 0,5 = mitten auf der Kreuzung)' },
    smoke: { default: true, doc: 'Rauch steigt aus dem Schornstein des Ladens gegenüber (Grill)' },
    push: { default: 0.05, doc: 'Wie weit die Kamera während der Szene heranfährt (0 = steht, 0,05 = 5 % näher, höchstens 0,25). Sie endet immer im selben Ausschnitt, in dem beide Läden ganz zu sehen sind; mehr "push" heißt nur, dass sie weiter weg anfängt' },
    orbit: { default: 7, doc: 'Um wie viele Grad sich die Kamera während der Szene dreht (0 bis 12)' },
    after: { default: true, doc: 'Schlussbild nach "enter": der Laden, den er verlassen hat, wird dunkler, der andere leuchtet auf. false, wenn die Szene gleich danach endet' },
    tones: { default: true, doc: 'Eigene Töne (thud beim Zerbrechen, ding an der Tür). false, wenn das Skript Klänge aus der Bibliothek setzt' },
    mode: { default: 'duell', doc: '"duell": zwei Läden, Herz, Stammkunde geht rüber (wie bisher). "nah": C1, Lichtring um den eigenen Laden, ein Kunde betritt ihn auf der anderen Seite der Kreuzung, über ihm springt aus seinem Handy der Sperrbildschirm mit "Noch {left} Stempel bis: {reward}" (Anker "walk", "near", "turn", "enter"). In "nah" gibt es kein Herz; "heart", "walker", "back", "from" gelten nur in "duell"' },
    frame: { default: 'laden', doc: 'Nur "nah": "laden" = derselbe Ausschnitt wie im Duell (beide Läden, Kreuzung, der Ring links angeschnitten). "stadt" = weiter weg und höher: der ganze Ring, beide Läden und mehr Stadt, für "das Handy macht das von selbst, der Laden sieht nichts"' },
    then: { default: 'weiter', doc: 'Nur "nah": was der Kunde nach der Benachrichtigung tut. "weiter": geht noch ein paar Schritte und bleibt mit dem Handy stehen. "dreht": bleibt stehen, dreht sich zur Tür und geht auf sie zu (Anker "turn"). "rein": dazu geht er hinein, die Glocke klingelt, der Laden leuchtet auf (Anker "turn" und "enter")' },
    reward: { default: 'Gratis-Döner', doc: 'Nur "nah": die Belohnung, kurz (höchstens etwa 16 Zeichen), steht in der Benachrichtigung: "Noch 2 Stempel bis: Gratis-Döner"' },
    left: { default: 2, doc: 'Nur "nah": wie viele Stempel noch fehlen (1 bis 20). 0 = die Karte ist voll, dann steht dort "{reward} wartet auf dich" (C1)' },
    clock: { default: '18:42', doc: 'Nur "nah": Uhrzeit oben auf dem Sperrbildschirm in der Blase' }
  },
  captions: { min: 1 },
  anchors: p => p.mode === 'nah' ? {
    walk: { at: 'start', offset: 0, doc: 'Der Kunde geht los, unten rechts auf dem Gehweg am Platz, noch außerhalb des Rings' },
    near: { cap: 0, word: -1, doc: 'Er betritt den Ring: sein Handy leuchtet, die Blase mit dem Sperrbildschirm springt heraus (Ton: ding). Genau jetzt steht er auf dem Rand des Rings, gut 10 m von der Tür. Auf "Nähe" o. ä.' },
    ...(p.then === 'dreht' || p.then === 'rein' ? { turn: { at: 'end', offset: -1.7, doc: 'Er dreht sich zur Tür des eigenen Ladens und geht los (vorher bleibt er stehen, wenn er die Ecke schon erreicht hat). Mindestens 0,4 s nach "near"' } } : {}),
    ...(p.then === 'rein' ? { enter: { at: 'end', offset: -0.25, doc: 'Er steht auf der Schwelle und geht hinein, die Glocke schwingt (Ton: ding), der Laden leuchtet auf' } } : {})
  } : {
    ...(p.heart && !p.back ? { crack: { cap: 0, word: -1, doc: 'Das Herz über dem eigenen Laden zerbricht (Ton: thud). Auf "betrogen" o. ä.' } } : {}),
    ...(p.walker ? {
      walk: { at: 'start', offset: 0, doc: 'Der Stammkunde geht los (von "from" aus); die Tür, aus der er kommt, geht kurz vorher auf' },
      cross: { at: 'start', offset: 0, doc: 'Er tritt an die Bordsteinkante und geht auf die Fahrbahn. Vorgabe: gleich mit "walk", dann geht er gleichmäßig durch. Auf ein Wort gesetzt, ist er genau dann an der Kante' },
      enter: { cap: -1, word: -1, doc: 'Er ist an der Tür drüben und verschwindet hinein, die Ladenglocke schwingt (Ton: ding)' }
    } : {})
  },
  demo: {
    params: { shop: 'Döner Palast', icon: 'kebab', rival: 'Imbiss Sonne', rivalIcon: 'kebab' },
    captions: [{ lines: ['Dein Stammkunde', 'hat dich betrogen.'], accent: 2 }, { lines: ['Mit dem Dönerladen gegenüber.'] }],
    at: { cap: 0, word: -1, offset: 0.3 }
  },
  // Leinwand, Verlaeufe (oben ruhig fuer die Textzeilen, Ecken dunkler), Abblende und Pruefkaesten legt
  // der Baukasten an (engine/kit3d.js, Klassen k3-* und zusaetzlich is-* fuer tools/test_3d.mjs)
  async build(ctx) {
    const { p } = ctx
    if (!['left', 'right'].includes(p.ours)) ctx.fail('"ours" muss "left" oder "right" sein')
    if (!ICONS[p.rivalIcon]) ctx.fail(`Symbol "${p.rivalIcon}" gibt es nicht. Erlaubt: ${Object.keys(ICONS).join(', ')}`)
    if (typeof p.from !== 'number' || p.from < 0 || p.from > 0.9) ctx.fail('"from" muss zwischen 0 und 0,9 liegen')
    // Die Fahrt endet immer im vermessenen Ausschnitt; mehr als 0,25 hiesse nur, dass die Laeden am Anfang winzig sind
    if (!(p.push >= 0 && p.push <= 0.25)) ctx.fail('"push" muss zwischen 0 und 0,25 liegen (mehr lässt die Kamera so weit weg anfangen, dass die Läden am Anfang winzig sind)')
    if (!(p.orbit >= 0 && p.orbit <= 12)) ctx.fail('"orbit" muss zwischen 0 und 12 Grad liegen (mehr zeigt den Rand der Stadt)')
    if (!['duell', 'nah'].includes(p.mode)) ctx.fail('"mode" muss "duell" oder "nah" sein')
    const nah = p.mode === 'nah'
    // Wortlaut aus C1 (Backend: ApplePassService, sperrbildschirmOrte); "Stempel" ist Einzahl wie Mehrzahl
    const msg = p.left > 0 ? `Noch ${p.left} Stempel bis: ${p.reward}` : `${p.reward} wartet auf dich`
    if (nah) {
      if (!['laden', 'stadt'].includes(p.frame)) ctx.fail('"frame" muss "laden" oder "stadt" sein')
      if (!['weiter', 'dreht', 'rein'].includes(p.then)) ctx.fail('"then" muss "weiter", "dreht" oder "rein" sein')
      if (!(Number.isInteger(p.left) && p.left >= 0 && p.left <= 20)) ctx.fail('"left" ist die Zahl der fehlenden Stempel, 0 bis 20')
      if (!String(p.reward).trim()) ctx.fail('"reward" darf nicht leer sein (steht in der Benachrichtigung)')
      for (const [k, v] of [['reward', p.reward], ['shop', p.shop], ['clock', p.clock]]) if (DASH.test(v)) ctx.fail(`"${k}" enthält einen Gedankenstrich. Normalen Bindestrich nehmen.`)
      // PRODUKT.md C1: die Karte meldet sich, ein Video sagt oder zeigt nie, dass das Handy vibriert
      if (/vibrier|brumm|summ/i.test(msg)) ctx.fail('Die Benachrichtigung sagt nie, dass das Handy vibriert (PRODUKT.md, C1)')
    }

    // Baukasten (und mit ihm three.js) erst hier laden: so bleibt der Baustein in Node (Katalog, Selbsttest)
    // ohne die 700 KB importierbar
    const K = await import('../engine/kit3d.js')
    const { PAL: C, rng, clamp01, smooth, lerp, walkCycle } = K
    const kit = await K.createKit(ctx, { name: 'iso-street', prefix: 'is', ss: SS, exposure: 1.05, fog: [98, 172], calm: 760 })
    const { THREE, RoundedBoxGeometry, scene, col, lam, glow } = kit
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v3 = new THREE.Vector3(), s3 = new THREE.Vector3()

    // ---------------------------------------------------------------- Licht
    // Mond von hinten (Nordost), Himmel, schwache Aufhellung von der Kamera her (kit.nightLights)
    kit.nightLights()

    // ---------------------------------------------------------------- Laeden: Lage
    // Links: Block nordwestlich der Kreuzung, Front nach Sueden (+z). Rechts: Block suedoestlich, Front nach
    // Westen (-x). Ein Laden wird im eigenen Koordinatensystem gebaut (Front zeigt nach +z, Ecke zur Kreuzung
    // bei x = 0, der Laden reicht nach -x und -z) und dann an seinen Platz gedreht (kit.shop).
    // Rechts ist der Laden gespiegelt: gedreht reichte er sonst in die Kreuzung hinein statt von ihr weg
    // (so stand er im ersten Versuch). "flip" legt Tuer und Glocke dort an das andere Ende der Front.
    const lots = { left: { pos: new THREE.Vector3(-B, CURB, -B), rot: 0, flip: false }, right: { pos: new THREE.Vector3(B, CURB, B + SHOP.w), rot: -Math.PI / 2, flip: true } }
    const oursSide = p.ours, rivalSide = p.ours === 'left' ? 'right' : 'left'
    // Grundflaeche eines Ladens in Weltkoordinaten (fuer Bodentextur und Freihalten)
    const shopRect = side => side === 'left' ? [-B - SHOP.w, -B, -B - SHOP.d, -B] : [B, B + SHOP.d, B, B + SHOP.w]

    // ---------------------------------------------------------------- Stadt planen (vor dem Malen des Bodens)
    const R = rng(20261117)
    const N = 4 // Bloecke je Richtung um die Kreuzung
    const blocks = []
    for (let i = -N; i < N; i++) for (let j = -N; j < N; j++) blocks.push({ i, j, x0: i * P + RH, x1: (i + 1) * P - RH, z0: j * P + RH, z1: (j + 1) * P - RH })
    const overlaps = (a, b) => a[1] > b[0] && a[0] < b[1] && a[3] > b[2] && a[2] < b[3]
    const keepFree = [shopRect('left'), shopRect('right')].map(([x0, x1, z0, z1]) => [x0 - 0.6, x1 + 0.6, z0 - 0.6, z1 + 0.6])
    const houses = [], windows = [], trees = [], roofBits = []
    const addHouse = (x, z, w, d, h, c) => {
      houses.push({ x, z, w, d, h, c })
      const floors = Math.max(1, Math.floor((h - 0.6) / 3))
      const per = len => Math.max(1, Math.floor((len - 0.8) / 1.7))
      // Fenster nur an den Seiten, die zur Kamera zeigen (+z und -x); die anderen sieht nie jemand
      for (let f = 0; f < floors; f++) {
        const y = CURB + 1.8 + f * 3, nW = per(w), nD = per(d)
        for (let k = 0; k < nW; k++) windows.push({ x: x - w / 2 + (k + 0.5) * w / nW, y, z: z + d / 2 + 0.03, ry: 0, on: R() })
        for (let k = 0; k < nD; k++) windows.push({ x: x - w / 2 - 0.03, y, z: z - d / 2 + (k + 0.5) * d / nD, ry: -Math.PI / 2, on: R() })
      }
      if (R() < 0.65) { const bw = 0.8 + R() * 1.4; roofBits.push([x + (R() - 0.5) * (w - bw - 0.6), CURB + h, z + (R() - 0.5) * (d - bw - 0.6), bw, 0.5 + R() * 0.9, bw * (0.6 + R() * 0.6)]) }
    }
    for (const b of blocks) {
      if (b.i === -1 && b.j === 0) continue // Platz vorn: dort stuende ein Haus vor der Kreuzung
      const bx0 = b.x0 + 1.4, bx1 = b.x1 - 1.4, bz0 = b.z0 + 1.4, bz1 = b.z1 - 1.4
      // Naehe zur Kamera (Suedwesten): dort niedrig bauen, damit nichts die Mitte verdeckt
      const nearCam = (-(b.x0 + b.x1) / 2 + (b.z0 + b.z1) / 2) / Math.SQRT2
      const maxFloors = nearCam > 20 ? 2 : nearCam > 4 ? 3 : 6
      const nx = 3, nz = 3, cw = (bx1 - bx0) / nx, cd = (bz1 - bz0) / nz
      for (let a = 0; a < nx; a++) for (let c = 0; c < nz; c++) {
        if (a === 1 && c === 1) continue // Hof
        const w = cw - 0.2 - R() * 0.7, d = cd - 0.2 - R() * 0.7
        const x = bx0 + a * cw + cw / 2, z = bz0 + c * cd + cd / 2
        if (keepFree.some(k => overlaps([x - w / 2, x + w / 2, z - d / 2, z + d / 2], k))) continue
        const floors = 2 + Math.floor(R() * (maxFloors - 1)), h = floors * 3 + 0.6
        addHouse(x, z, w, d, h, C.city[Math.floor(R() * C.city.length)])
      }
      // Baeume am Gehweg zur Kamera hin, locker
      for (let k = 0; k < 3; k++) if (R() < 0.55) {
        const tx = lerp(b.x0 + 1, b.x1 - 1, R()), tz = b.z1 - 0.7
        if (!keepFree.some(f => overlaps([tx - 1, tx + 1, tz - 1, tz + 1], f)) && !(Math.abs(tx) < B + 1 && Math.abs(tz) < B + 1)) trees.push([tx, tz, 0.55 + R() * 0.25, Math.floor(R() * 4)])
      }
    }
    // Nachbarhaeuser direkt neben den Laeden: hoeher, damit die Laeden in einer Strasse stehen und nicht frei
    const nb = [[-B - SHOP.w - 3.9, -B - 3.1, 7.2, 6.2, 12.6], [-B - 3.1, -B - SHOP.d - 3.9, 6.2, 7.2, 15.6], [B + 3.1, B + SHOP.w + 3.9, 6.2, 7.2, 12.6], [B + SHOP.d + 3.9, B + 3.1, 7.2, 6.2, 15.6]]
    for (const [x, z, w, d, h] of nb) addHouse(x, z, w, d, h, C.city[3])
    // Platz vorn (suedwestlicher Block): kleine Baeume, Baenke, Laternen
    // Mitte des Platzes: ein runder Brunnen; Baeume locker drumherum, nicht als Wand
    const FOUNT = [-12.4, 12.4]
    // Baeume auf den vier Rasenstuecken zwischen den Wegen (die Wege laufen ueber Kreuz zum Brunnen)
    const plaza = [[-6.2, 6.4], [-9.6, 5.9], [-17.3, 6.4], [-5.9, 9.8], [-6.4, 18.0], [-18.6, 11.4], [-17.6, 18.3], [-10.6, 19.4]]
    plaza.forEach(([x, z], k) => trees.push([x, z, 0.5 + ((k * 37) % 10) / 45, k % 4]))
    // Keine Laterne an der Ecke zur Kamera: im Bild stand ihr Mast mitten auf dem Weg des Stammkunden.
    // Auch keine am Gehweg vor dem Platz bei x = -8,65: ihr leuchtender Kopf lag im Bild genau vor der eigenen
    // Tuer und deckte die Beine des Stammkunden, als er herauskam (Review 17.11.2026).
    const lamps = [[B - 0.45, -B + 0.45], [-B + 0.45, -B - 12], [-B - 12.5, B - 0.45], [B + 12, -B + 0.45], [B - 0.45, B + 12.5], [-B + 0.45, -B - 34], [-B - 34, -B + 0.45], [B + 34, B - 0.45], [-B - 24, B - 0.45], [B - 0.45, B + 34], [B + 24, -B + 0.45]]
    // mode "nah": ohne die Laterne an der hinteren Ecke der Kreuzung. Ihr Kopf liegt im Bild genau hinter der Blase
    // mit dem Sperrbildschirm, und unter der Blase stand nur noch ihr Mast: wie ein Pfosten, auf dem die Blase
    // steckt (erste Probe 18.11.2026). Sie liegt auf der Spiegelachse, gilt also fuer beide Seiten.
    if (nah) lamps.shift()
    // Laternen auf dem Platz, an den Wegen zum Brunnen: ihre warmen Lichtkreise geben dem unteren Bilddrittel
    // etwas zu sehen. In der ersten Probe war es dort fast schwarz, der Brunnen las sich wie ein Pilz.
    // Am Rand des Pflasterrings, nicht naeher zur Kreuzung: naeher lag der Schein im Bild auf den Fuessen des
    // Stammkunden, wenn er ueber die Kreuzung geht
    const plazaLamps = [[FOUNT[0] + 1.0, FOUNT[1] - 4.4], [FOUNT[0] - 1.0, FOUNT[1] + 4.4], [FOUNT[0] + 4.4, FOUNT[1] + 1.0], [FOUNT[0] - 4.4, FOUNT[1] - 1.0]]
    lamps.push(...plazaLamps)

    // ---------------------------------------------------------------- Boden malen
    // Grundfarben, Bordsteinkanten und Kontaktschatten in die Farbtextur, Lichtkegel in die Leuchttextur.
    const map = kit.groundMap({ origin: GO, size: GS, px: GN }), gx = map.gx
    const shopGlow = { [oursSide]: C.poolOurs, [rivalSide]: C.poolRival }
    const groundTex = kit.canvasTex(GN, GN, g => {
      g.fillStyle = C.road; g.fillRect(0, 0, GN, GN)
      // Gehwege mit eckigen Ecken: die Platten darauf (slabs) sind eckig. Gemalt waren sie gerundet, und an
      // jeder Ecke stand die eckige Platte ueber den runden Rand hinaus.
      for (const b of blocks) {
        g.fillStyle = C.walk; g.fillRect(gx(b.x0), gx(b.z0), gx(b.x1) - gx(b.x0), gx(b.z1) - gx(b.z0))
        g.strokeStyle = C.curb; g.lineWidth = 0.2 * GN / GS; g.strokeRect(gx(b.x0 + 0.12), gx(b.z0 + 0.12), gx(b.x1) - gx(b.x0) - 0.24 * GN / GS, gx(b.z1) - gx(b.z0) - 0.24 * GN / GS)
      }
      // Platz: vier Rasenstuecke, dazwischen helle Wege ueber Kreuz und ein gepflasterter Ring um den Brunnen
      {
        const [fx, fz] = FOUNT, m = GN / GS
        g.fillStyle = C.lawn
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const x0 = sx < 0 ? fx - 8.8 : fx + 0.8, z0 = sz < 0 ? fz - 8.8 : fz + 0.8; g.beginPath(); g.roundRect(gx(x0), gx(z0), 8 * m, 8 * m, 1.2 * m); g.fill() }
        g.fillStyle = C.pave; g.beginPath(); g.arc(gx(fx), gx(fz), 4.4 * m, 0, Math.PI * 2); g.fill()
        g.strokeStyle = C.curb; g.lineWidth = 0.14 * m; g.beginPath(); g.arc(gx(fx), gx(fz), 4.4 * m, 0, Math.PI * 2); g.stroke()
      }
      // Kontaktschatten: weiche dunkle Flaeche um jede Grundflaeche. Liest sich wie Umgebungsverdeckung.
      g.filter = `blur(${Math.round(0.55 * GN / GS)}px)`; g.fillStyle = 'rgba(6,3,20,.62)'
      const rects = [...houses.map(h => [h.x - h.w / 2, h.x + h.w / 2, h.z - h.d / 2, h.z + h.d / 2]), shopRect('left'), shopRect('right')]
      for (const [x0, x1, z0, z1] of rects) g.fillRect(gx(x0 - 0.35), gx(z0 - 0.35), gx(x1 + 0.35) - gx(x0 - 0.35), gx(z1 + 0.35) - gx(z0 - 0.35))
      g.filter = 'blur(10px)'; g.fillStyle = 'rgba(6,3,20,.4)'
      for (const [x, z, s] of trees) { g.beginPath(); g.arc(gx(x), gx(z), 1.1 * s * GN / GS, 0, Math.PI * 2); g.fill() }
      g.filter = 'none'
    })
    const glowTex = kit.canvasTex(GN, GN, g => {
      g.fillStyle = '#000'; g.fillRect(0, 0, GN, GN); g.globalCompositeOperation = 'lighter'
      const spot = (x, z, r, rgb, a) => map.spot(g, x, z, r, rgb, a)
      for (const [x, z] of lamps) spot(x, z, 3.6, C.poolLamp, 0.4)
      for (const [x, z] of plazaLamps) spot(x, z, 3.2, '255,196,130', 0.22)
      // Schein des Brunnens auf dem Pflaster (Lila wie das Wasser)
      spot(FOUNT[0], FOUNT[1], 4.6, '150,138,255', 0.24)
      // Licht aus Schaufenster und Tuer faellt vor dem Laden auf den Gehweg
      for (const side of ['left', 'right']) {
        const along = side === 'left' ? [[-B - 1.3, -B + 1.2], [-B - 3.8, -B + 1.3]] : [[B - 1.2, B + 1.3], [B - 1.3, B + 3.8]]
        for (const [x, z] of along) spot(x, z, 3.4, shopGlow[side], 0.42)
      }
    })
    const groundMat = map.worldMapped(lam('#FFFFFF', { map: groundTex, emissive: '#FFFFFF', emissiveMap: glowTex }))
    // Boden und Gehwege zuletzt zeichnen (renderOrder): was Haeuser verdecken, faellt dann schon am Tiefentest
    // heraus, statt erst teuer beleuchtet und dann uebermalt zu werden
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(GS * 3, GS * 3), groundMat); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; ground.renderOrder = 2; scene.add(ground)
    // Gehwege als flache Platten mit abgeschraegter Kante: die Kante faengt Licht wie ein Bordstein
    const slabs = new THREE.InstancedMesh(new RoundedBoxGeometry(1, 1, 1, 1, 0.06), groundMat, blocks.length)
    blocks.forEach((b, k) => { m4.compose(v3.set((b.x0 + b.x1) / 2, CURB / 2, (b.z0 + b.z1) / 2), q.identity(), s3.set(b.x1 - b.x0, CURB, b.z1 - b.z0)); slabs.setMatrixAt(k, m4) })
    slabs.receiveShadow = true; slabs.renderOrder = 1; scene.add(slabs)
    // Mittelstreifen und Zebrastreifen als echte Koerper (gemalt waeren sie unscharf); sie lesen dieselbe
    // Leuchttextur, sonst laegen sie im Lichtkegel einer Laterne als dunkle Striche
    const stripes = []
    for (let k = -N; k <= N; k++) for (let s = -N * P; s < N * P; s += 3) {
      const m = ((s % P) + P) % P
      if (m < RH + 1.6 || m > P - RH - 1.6) continue // nicht in Kreuzungen
      stripes.push([k * P, s + 0.8, 0.14, 1.5, C.mark], [s + 0.8, k * P, 1.5, 0.14, C.mark])
    }
    // Fuenf Streifen mittig auf der Fahrbahn, 0,25 m Abstand zum Bordstein. Vorher reichte der aeussere
    // Streifen 0,13 m unter die Gehwegplatte und endete dort zackig.
    for (let k = 0; k < 5; k++) {
      const o = (k - 2) * (RH - 0.45) / 2
      stripes.push([o, -RH - 0.95, 0.4, 1.3, C.zebra], [o, RH + 0.95, 0.4, 1.3, C.zebra], [-RH - 0.95, o, 1.3, 0.4, C.zebra], [RH + 0.95, o, 1.3, 0.4, C.zebra])
    }
    const stripeMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.02, 1), map.worldMapped(lam('#FFFFFF', { emissive: '#FFFFFF', emissiveMap: glowTex })), stripes.length)
    stripes.forEach(([x, z, w, d, c], k) => { m4.compose(v3.set(x, 0.011, z), q.identity(), s3.set(w, 1, d)); stripeMesh.setMatrixAt(k, m4); stripeMesh.setColorAt(k, col(c)) })
    stripeMesh.receiveShadow = true; scene.add(stripeMesh)

    // ---------------------------------------------------------------- Stadt bauen (Baukasten: instanziert)
    kit.houses(houses, { y0: CURB })
    kit.roofs(roofBits)
    kit.windows(windows)
    kit.trees(trees, { y0: CURB })
    // Nur die Laternen nahe der Kreuzung und auf dem Platz bekommen einen Schein (die anderen liegen im Dunst)
    kit.lamps(lamps, { y0: CURB, glowIf: k => k < (nah ? 4 : 5) || k >= lamps.length - plazaLamps.length })
    // Baenke auf dem Platz und drei geparkte Autos: Kleinkram, an dem man die Groesse abliest
    const props = new THREE.Group(); scene.add(props)
    for (const [x, z, r] of [[-9.2, 8.6, 0], [-14.8, 9.6, 0], [-8.6, 12.6, Math.PI / 2]]) kit.bench(props, x, z, r, { y0: CURB })
    kit.car(props, -17, 1.15, Math.PI / 2, C.cars[0]); kit.car(props, 1.15, -15.5, 0, C.cars[1]); kit.car(props, 15.5, -1.15, Math.PI / 2, C.cars[2])
    {
      // Brunnen: Becken mit hellem Rand, leuchtendes Wasser (Lila), schmale Saeule mit Schale und Wasserstrahl.
      // In der ersten Probe (breite Schale auf dicker Saeule, dunkles Wasser) las er sich wie ein Pilz auf
      // einer Scheibe; der Strahl und das helle Wasser sagen "Brunnen".
      const [fx, fz] = FOUNT
      const rim = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.35, 0.55, 28), lam('#5A5490')); rim.position.set(fx, CURB + 0.27, fz); props.add(rim)
      const lip = new THREE.Mesh(new THREE.TorusGeometry(2.06, 0.15, 6, 36), lam('#7A73B4')); lip.rotation.x = -Math.PI / 2; lip.position.set(fx, CURB + 0.55, fz); props.add(lip)
      // Wasser knapp ueber dem Rand: der Deckel des Zylinders laege sonst darueber
      const water = new THREE.Mesh(new THREE.CylinderGeometry(1.92, 1.92, 0.04, 28), new THREE.MeshBasicMaterial({ color: '#7A6FDC' })); water.position.set(fx, CURB + 0.57, fz); props.add(water)
      const col1 = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.22, 1.2, 10), lam('#6A64A0')); col1.position.set(fx, CURB + 1.15, fz); props.add(col1)
      const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.3, 0.26, 18), lam('#6A64A0')); bowl.position.set(fx, CURB + 1.8, fz); props.add(bowl)
      const bowlWater = new THREE.Mesh(new THREE.CylinderGeometry(0.54, 0.54, 0.03, 18), new THREE.MeshBasicMaterial({ color: '#A79EFF' })); bowlWater.position.set(fx, CURB + 1.94, fz); props.add(bowlWater)
      const jet = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.09, 0.95, 8), new THREE.MeshBasicMaterial({ color: '#D9D3FF' })); jet.position.set(fx, CURB + 2.4, fz); props.add(jet)
      glow('#B3AAFF', 3.2, new THREE.Vector3(fx, CURB + 2.3, fz), 0.3)
      glow('#9C92FF', 5, new THREE.Vector3(fx, CURB + 0.8, fz), 0.13)
    }
    props.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true } })

    // ---------------------------------------------------------------- Laeden (die beiden Helden, kit.shop)
    await kit.fonts(p.shop + p.rival)
    const signs = []
    const S = {}
    S[oursSide] = await kit.shop({ name: p.shop, icon: p.icon, accent: p.accent, ours: true, ...lots[oursSide], size: SHOP, light: LIGHT, signs })
    S[rivalSide] = await kit.shop({ name: p.rival, icon: p.rivalIcon, accent: p.rivalAccent, ours: false, ...lots[rivalSide], size: SHOP, light: LIGHT, signs })
    const our = S[oursSide], riv = S[rivalSide]
    // Ein zu langer Name wird auf dem Schild so klein, dass ihn auf dem Handy niemand liest
    for (const s of signs) if (!s.fits || s.size < 0.42) ctx.warn(`der Name "${s.name}" steht auf dem Schild sehr klein. Namen kürzen (höchstens etwa 14 Zeichen).`)

    // ---------------------------------------------------------------- Herz ueber dem eigenen Laden
    // Herz ueber dem Dach, zur Ecke hin geschoben (our.top): weiter aussen flogen die Haelften beim Bruch bis
    // 19 px an den Bildrand (gemessen mit den Pruefkaesten, tools/test_3d.mjs)
    let heart = null
    if (p.heart && !nah) {
      heart = kit.heart({ pos: our.top, tc: p.back ? null : ctx.at('crack') })
      if (heart.tc != null && p.tones) ctx.cue(heart.tc, 'thud', 0.7)
    }

    // ---------------------------------------------------------------- Ladenglocke ueber der Tuer, in die er geht
    // In "nah" geht der Kunde (wenn ueberhaupt) in den eigenen Laden: die Glocke haengt dort
    const goal = nah || p.back ? our : riv, origin = p.back ? riv : our
    const bell = kit.bell({ pos: goal.bellPos, rot: goal.rot })

    // ---------------------------------------------------------------- Rauch aus dem Schornstein gegenueber
    const smoke = p.smoke ? kit.smoke({ pos: riv.chimney, n: 5 }) : null

    // ---------------------------------------------------------------- Der Stammkunde
    // Zwei Leute am Brunnen, im Gespraech: die Stadt lebt, ohne dass sie vom Stammkunden ablenken
    const chat = [kit.person({ coat: '#8C6BC8', scale: 1.2, y0: CURB }), kit.person({ coat: '#C9786A', hair: '#5A3A2A', scale: 1.15, y0: CURB })]
    chat[0].at(FOUNT[0] + 1.4, FOUNT[1] - 2.9, -2.2); chat[1].at(FOUNT[0] + 0.1, FOUNT[1] - 3.2, 1.2)
    // Ab hier geht mode "nah" eigene Wege (Ring, Kunde, Blase, Kamera; siehe buildNah unten). Alles davor, die
    // ganze Stadt, ist in beiden Modi dieselbe.
    if (nah) { await buildNah({ ctx, p, K, kit, our, riv, oursSide, signs, bell, msg, smoke, chat }); return }
    // Der Stammkunde: hell gekleidet (Papierfarbe), damit er auf dem dunklen Platz sofort zu sehen ist
    let walker = null
    if (p.walker) {
      const fig = kit.person({ coat: C.coat, scale: 1.35, y0: CURB })
      // Weg: aus der Tuer gerade heraus, vom Bordstein auf die Fahrbahn, quer ueber die Kreuzung, und drueben
      // wieder gerade auf die Tuer zu. Die geraden Stuecke vor den Tueren sind Absicht: das offene Blatt steht
      // auf der Seite zur Ecke quer zur Front, und wer schraeg von der Kreuzung kaeme, liefe hinein (so war es
      // in der ersten Probe, mit der Angel auf der anderen Seite: das Blatt schwang in ihn hinein).
      const path = new THREE.CatmullRomCurve3([origin.at(-0.9), origin.at(0.6), origin.at(2.3), goal.at(2.3), goal.at(0.6), goal.at(-0.9)], false, 'centripetal')
      const len = path.getLength()
      const tW = ctx.at('walk'), tE = ctx.at('enter'), tC = ctx.at('cross')
      if (!(tE > tW + 0.6)) ctx.fail('Anker "enter" muss mindestens 0,6 s nach "walk" liegen')
      // Wo auf dem Weg die Fahrbahn beginnt (fuer "cross"): erster Punkt, der nicht mehr auf einem Gehweg liegt
      let uRoad = 0.15
      for (let i = 0; i <= 400; i++) { const pt = path.getPointAt(i / 400); if (Math.min(Math.abs(pt.x), Math.abs(pt.z)) < RH - 0.05) { uRoad = i / 400; break } }
      walker = { ...fig, path, len, tW, tE, tC, uRoad }
      if (p.tones) ctx.cue(tE, 'ding', 0.6)
    }
    // Wo er zur Zeit t auf dem Weg ist (0 = drinnen hinter der eigenen Tuer, 1 = drinnen drueben). Zu "enter"
    // steht er auf der Schwelle; ist "cross" gesetzt, steht er dann an der Bordsteinkante. Dazwischen
    // gleichmaessig, nur das Anlaufen ist weich (sonst ruckt er los).
    const walkU = t => {
      const w = walker, uDoor = 1 - 0.8 / w.len
      const keys = [[w.tW, p.from]]
      if (w.tC > w.tW + 0.3 && w.tC < w.tE - 0.3 && w.uRoad > p.from) keys.push([w.tC, w.uRoad])
      keys.push([w.tE, uDoor], [w.tE + 0.4, 1])
      if (t <= w.tW) return p.from
      for (let k = 1; k < keys.length; k++) {
        const [t0, a] = keys[k - 1], [t1, b] = keys[k]
        if (t > t1) continue
        let x = (t - t0) / (t1 - t0)
        if (k === 1) { const r = Math.min(0.5, 0.35 / (t1 - t0)); x = x < r ? x * x / (2 * r) : (x - r / 2) ; x /= 1 - r / 2 }
        return lerp(a, b, clamp01(x))
      }
      return 1
    }
    // Ab wann er drueben verschwunden ist (dann faellt die Tuer hinter ihm zu)
    const HIDE_U = walker ? 1 - 0.6 / walker.len : 1
    if (walker) {
      const uHide = HIDE_U
      let lo = walker.tE - 0.5, hi = walker.tE + 0.4
      for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; if (walkU(mid) < uHide) lo = mid; else hi = mid }
      walker.tHide = hi
    }

    // ---------------------------------------------------------------- Kamera
    // FRAME ist der vermessene Endausschnitt (tools/test_3d.mjs prueft ihn an den Grenzen von push und orbit):
    // beide Fronten mit Schild und das Herz bleiben mindestens 60 px vom Bildrand, und rechts endet das
    // Schild vor x = 940, also vor der Knopfspalte von TikTok und Reels (ab x = 950). dist: Abstand der Kamera
    // am Ende der Fahrt; dx: Bild um so viele Pixel nach links (weg von der Knopfspalte); dy: nach unten (oben
    // stehen die Woerter, das Herz soll mit Luft darunter bleiben).
    // (FRAME steht auf Modulebene: mode "nah" nimmt im Ausschnitt "laden" genau diese Kamera)
    const cam = kit.isoCamera({ fov: 22, near: 20, far: 600, frame: FRAME })
    // Ziel: die Mitte zwischen den beiden Fronten, quer zur Blickrichtung gemessen (Mittel der beiden aeusseren
    // Ladenecken, siehe kit.aimAcross). Bei 45 Grad liegt sie auf der Kreuzung; dreht die Kamera, wandert sie
    // mit, sonst laeuft ein Laden zum Bildrand hinaus. Von Hand statt aimAcross, damit das Bild Pixel fuer
    // Pixel bleibt, wie es vermessen ist.
    const aim = aimDuell
    const camOpts = { push: p.push, orbit: p.orbit, az: 45, el: 34, elDrop: 1.5, aim, fog: [24, 118] }

    // ---------------------------------------------------------------- Pruefkaesten (siehe Kopf der Datei)
    // Schilder und Herz bilden eine data-apart-Gruppe: sie duerfen sich im Bild nicht ueberdecken.
    kit.safeBox('ourSign', 'Schild ' + our.name, true); kit.safeBox('rivSign', 'Schild ' + riv.name, true)
    if (p.heart) kit.safeBox('heart', 'Herz', true)
    if (p.walker) kit.safeBox('walker', 'Stammkunde', false)

    // Tuerblatt: wie weit die Figur von seiner Angel weg ist
    const fromHinge = (shop, pos) => Math.hypot(pos.x - shop.hingeWorld.x, pos.z - shop.hingeWorld.z)
    const opening = (t, t0, t1) => smooth((t - t0) / 0.35) * (1 - smooth((t - t1) / 0.5))

    // ---------------------------------------------------------------- Zustand zum Zeitpunkt t (ohne Zeichnen)
    // kit.run: Ruhelage, Sichtbarkeit, Abblenden beim Szenenwechsel und das Aufheben der 2D-Kamerafahrt
    // erledigt der Baukasten; hier steht nur, was sich in dieser Szene bewegt.
    kit.run(t => {
      const az = cam.set(t, camOpts)
      const heartMeshes = heart ? heart.update(t, az) : []
      if (walker) {
        const w = walker, u = walkU(t), pos = w.path.getPointAt(clamp01(u)), tan = w.path.getTangentAt(Math.min(0.999, Math.max(0.001, u)))
        // Drinnen ist er nicht mehr zu sehen: ab der Schwelle steckt er in der Wand, also ausblenden. Drueben
        // schon 0,3 m hinter der Front: blieb er bis 0,6 m sichtbar, stach der vordere Fuss beim Schritt als
        // dunkler Tropfen unten aus dem Tuerlicht.
        const inside = u <= 0.6 / w.len || u >= HIDE_U
        w.fig.visible = w.blob.visible = !inside
        w.fig.position.set(pos.x, CURB, pos.z); w.fig.rotation.y = Math.atan2(tan.x, tan.z)
        // Schrittfolge aus der zurueckgelegten Strecke (walkCycle): so rutschen die Fuesse nicht
        w.pose(walkCycle(u * w.len, t > w.tW && u < 1))
        w.blob.position.set(pos.x, CURB + 0.02, pos.z)
        // Tueren. Eigene: geht auf, kurz bevor er herauskommt, und erst zu, wenn er 2 m von der Angel weg ist
        // (das Blatt ist 1,12 m lang, die Figur 0,55 m breit von der Mitte: so streift es ihn nie). Drueben:
        // geht auf, wenn er noch 3 m weg ist, und faellt zu, sobald er verschwunden ist.
        const oOpen = p.from < 0.05 ? smooth((t - (w.tW - 0.4)) / 0.35) * (1 - smooth((fromHinge(origin, pos) - 2.0) / 0.6)) : 0
        const gOpen = (1 - smooth((fromHinge(goal, pos) - 2.6) / 0.6)) * (1 - smooth((t - w.tHide - 0.05) / 0.5))
        origin.door(oOpen)
        goal.door(gOpen)
        // Ladenglocke: gedaempfte Schwingung ab "enter", dazu zwei Schallringe
        bell.ring(t - w.tE)
        // Licht in der Tuer drueben leuchtet auf, wenn er hineingeht; danach (Schlussbild, "after") wird
        // der verlassene Laden dunkler und der andere bleibt heller. Vorher stand das Bild nach "enter" still.
        const fin = p.after ? smooth((t - w.tE - 0.3) / 1.5) : 0
        origin.shine(-fin); goal.shine(fin, opening(t, w.tE - 0.25, w.tE + 0.35))
      }
      // Die zwei am Brunnen wiegen sich leicht und gestikulieren abwechselnd
      chat.forEach((c, i) => { const ph = t * 2.2 + i * 2; c.body.rotation.z = 0.04 * Math.sin(ph); c.armR.rotation.x = -0.5 * Math.max(0, Math.sin(ph * 0.9 + i * 3)); c.armR.rotation.z = 0.2 * Math.max(0, Math.sin(ph * 0.9 + i * 3)) })
      if (smoke) smoke.update(t)
      // Pruefkaesten: wo die Kamera Schilder, Herz und Figur in diesem Bild hinwirft
      kit.sync()
      kit.setSafe('ourSign', kit.project(our.signCorners)); kit.setSafe('rivSign', kit.project(riv.signCorners))
      kit.setSafe('heart', heartMeshes.length ? kit.meshBox(heartMeshes) : null)
      kit.setSafe('walker', walker && walker.fig.visible ? kit.meshBox([walker.fig]) : null)
    })

    // Nur fuer tools/test_3d.mjs. doorGap: kleinster Abstand zwischen Stammkunde und den Tuerblaettern in diesem
    // Bild (in Metern; negativ = er steckt im Blatt), so prueft der Test die Tuer in 0,05-s-Schritten ohne
    // Bilder. drawnBox: rechnet das Bild einmal mit und einmal ohne Figur bzw. Herz und gibt zurueck, wo sich
    // Pixel aendern; der Test vergleicht das mit dem Pruefkasten (liegt der Kasten wirklich auf dem Ding?).
    kit.canvas.isoDebug = {
      // Wie die Namen auf den Schildern stehen (Zeilen, Groesse relativ zur Schildhoehe)
      signs: signs.map(x => ({ ...x })),
      drawnBox(what) { return kit.drawnBox(what === 'walker' ? walker && walker.fig : what === 'heart' ? heart && heart.grp : null) },
      doorGap() {
        if (!walker || !walker.fig.visible) return null
        scene.updateMatrixWorld()
        const w = walker, s = w.fig.scale.x
        let best = Infinity
        const inv = new THREE.Matrix4(), q1 = new THREE.Vector3()
        for (const shop of [our, riv]) {
          if (Math.abs(shop.hinge.rotation.y) < 1e-3) continue // zu: dann liegt es in der Front, nicht im Weg
          inv.copy(shop.leaf.matrixWorld).invert()
          for (const [mesh, r, l] of w.capsules()) for (let i = 0; i <= 8; i++) {
            q1.set(0, -l / 2 + l * i / 8, 0).applyMatrix4(mesh.matrixWorld).applyMatrix4(inv)
            const d = Math.hypot(Math.max(0, Math.abs(q1.x) - 0.56), Math.max(0, Math.abs(q1.y) - 1.16), Math.max(0, Math.abs(q1.z) - 0.04)) - r * s
            best = Math.min(best, d)
          }
        }
        return best === Infinity ? null : +best.toFixed(3)
      }
    }
  }
}

// ================================================================================================ mode "nah"
// Ring, Kunde, Blase und Kamera fuer C1 (warum so: Kopf der Datei). Die Stadt, beide Laeden, die Glocke und die
// zwei am Brunnen hat build() schon gebaut, genau wie im Duell.
async function buildNah({ ctx, p, K, kit, our, riv, oursSide, signs, bell, msg, smoke, chat }) {
  const { THREE, scene, canvasTex, std, glow, col } = kit
  const { PAL: C, W, H, clamp01, smooth, lerp, walkCycle } = K
  const FD = ctx.B.display, FB = ctx.B.body
  const { R, XL, KZ, WALK, BW, BH, BR, TOP } = NAH
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x))
  // Weich hinaus mit Ueberschwingen (die Blase springt auf), weich hinaus ohne
  const backOut = (x, s = 1.5) => { x = clamp01(x); const u = x - 1; return 1 + (s + 1) * u * u * u + s * u * u }
  const outCubic = x => 1 - Math.pow(1 - clamp01(x), 3)

  // ---------------------------------------------------------------- Lage
  // Alles in den Massen des eigenen Ladens LINKS; steht er rechts, wird an der Diagonale x = -z gespiegelt. So baut
  // build() den rechten Laden (Spiegelbild des linken), also stimmt jeder Weg, der links stimmt, auch rechts.
  const mir = oursSide === 'left' ? (x, z) => [x, z] : (x, z) => [-z, -x]
  const P = (x, z, y = CURB) => { const [a, b] = mir(x, z); return new THREE.Vector3(a, y, b) }
  const door0 = our.at(0)
  const [cx, cz] = mir(door0.x, door0.z)              // Mitte des Rings: die Tuerschwelle
  const RC = P(cx, cz)
  const zE = cz + Math.sqrt(R * R - (XL - cx) ** 2)    // hier betritt der Kunde den Ring (Gehweg x = XL)
  const ang = (x, z) => { const [a, b] = mir(x, z); return Math.atan2(a, b) }   // Drehung der Figur fuer Blickrichtung (x, z)
  const NORTH = ang(0, -1)

  // ---------------------------------------------------------------- Anker
  const tW = ctx.at('walk'), tN = ctx.at('near')
  const turns = p.then !== 'weiter', goesIn = p.then === 'rein'
  const tT = turns ? ctx.at('turn') : null, tE = goesIn ? ctx.at('enter') : null
  if (!(tN >= tW + 0.3)) ctx.fail(`Anker "near" muss mindestens 0,3 s nach "walk" liegen (jetzt ${(tN - tW).toFixed(2)} s): sonst springt der Kunde an den Ring, statt hineinzugehen`)
  if (turns && !(tT >= tN + 0.4)) ctx.fail(`Anker "turn" muss mindestens 0,4 s nach "near" liegen (jetzt ${(tT - tN).toFixed(2)} s): erst die Benachrichtigung, dann dreht er sich`)

  // ---------------------------------------------------------------- Weg des Kunden
  // 1. von S bis zum Ring (E): Laenge aus der Zeit bis "near" bei Gehtempo, aber hoechstens 3,4 m (weiter unten
  //    stuende er im Bild zu nah an der Knopfspalte) und mindestens 0,8 m; weich anlaufen wie im Duell.
  const T1 = tN - tW, d1 = clamp(WALK * T1, 0.8, 3.4), zS = zE + d1
  const r1 = Math.min(0.5, 0.35 / T1), ease1 = x => (x < r1 ? x * x / (2 * r1) : x - r1 / 2) / (1 - r1 / 2)
  const vE = d1 / T1 / (1 - r1 / 2)                    // sein Tempo, wenn er den Ring betritt
  // 2. im Ring weiter nach Norden und weich anhalten: "weiter" nach hoechstens 2,6 m, sonst so, dass er zu "turn"
  //    steht, hoechstens an der Ecke des Platzes. Er haelt an, weil er auf sein Handy schaut.
  const D2max = zE - KZ
  let D2 = Math.min(D2max, 2.6)
  if (turns) { const reach = vE * (tT - tN); D2 = Math.min(D2max, reach >= 1.8 ? reach - 0.9 : reach / 2) }
  const dl2 = Math.min(D2, 0.9), tc2 = (D2 - dl2) / vE, td2 = 2 * dl2 / vE
  const leg2 = tau => tau <= 0 ? 0 : tau < tc2 ? vE * tau : tau < tc2 + td2 ? (D2 - dl2) + dl2 * (1 - (1 - (tau - tc2) / td2) ** 2) : D2
  // 3. ("dreht", "rein") von dort zur Tuer: schraeg ueber die Kreuzung, dann gerade auf die Tuer zu (wie im Duell:
  //    von der Ecke her laeuft er so nicht ins Tuerblatt)
  let curve = null, len3 = 0, uDoor = 1, uHide = 1, tHide = Infinity, walk3 = null
  if (turns) {
    curve = new THREE.CatmullRomCurve3([P(XL, zE - D2), P(cx, cz + 2.3), P(cx, cz + 0.6), P(cx, cz - 0.9)], false, 'centripetal')
    len3 = curve.getLength(); uDoor = 1 - 0.9 / len3; uHide = 1 - 0.6 / len3
  }
  // "rein": zu "enter" auf der Schwelle, 0,4 s spaeter drinnen; dazwischen gleichmaessig, weich anlaufend
  const walkInU = t => {
    const keys = [[tT, 0], [tE, uDoor], [tE + 0.4, 1]]
    if (t <= tT) return 0
    for (let k = 1; k < keys.length; k++) {
      const [t0, a] = keys[k - 1], [t1, b] = keys[k]
      if (t > t1) continue
      let x = (t - t0) / (t1 - t0)
      if (k === 1) { const r = Math.min(0.5, 0.35 / (t1 - t0)); x = (x < r ? x * x / (2 * r) : x - r / 2) / (1 - r / 2) }
      return lerp(a, b, clamp01(x))
    }
    return 1
  }
  if (goesIn) {
    if (!(tE > tT + 0.5)) ctx.fail('Anker "enter" muss mindestens 0,5 s nach "turn" liegen')
    const r = Math.min(0.5, 0.35 / (tE - tT)), v = uDoor * len3 / (tE - tT) / (1 - r / 2)
    // Spielzeugtempo: der Stammkunde im Doener-Video geht gut 4 m/s, und es sieht nach Gehen aus. Ab 5 m/s
    // rennt er, ab 6,5 m/s fliegt er.
    if (v > 6.5) ctx.fail(`Anker "enter" liegt zu kurz nach "turn": er müsste ${v.toFixed(1)} m/s laufen (höchstens 6,5). "turn" früher oder "enter" später setzen`)
    if (v > 5) ctx.warn(`der Kunde rennt zwischen "turn" und "enter" (${v.toFixed(1)} m/s). "turn" früher oder "enter" später setzen`)
    let lo = tE - 0.5, hi = tE + 0.4
    for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; if (walkInU(mid) < uHide) lo = mid; else hi = mid }
    tHide = hi
    if (p.tones) ctx.cue(tE, 'chime', 0.5)
  } else if (turns) {
    // "dreht": geht mit Gehtempo los und bleibt vor der Tuer stehen (1,1 m davor), geht nicht hinein
    const D3 = Math.max(0.5, len3 - 2.0), ra = 0.35, dA = WALK * ra / 2, dl = Math.min(0.9, Math.max(0, D3 - dA)), dc = Math.max(0, D3 - dA - dl)
    const tc = dc / WALK, td = 2 * dl / WALK
    walk3 = tau => tau <= 0 ? 0 : tau < ra ? WALK * tau * tau / (2 * ra) : tau < ra + tc ? dA + WALK * (tau - ra) : tau < ra + tc + td ? dA + dc + dl * (1 - (1 - (tau - ra - tc) / td) ** 2) : Math.min(D3, dA + dc + dl)
  }
  // Wo er zur Zeit t ist: Punkt, Drehung, zurueckgelegte Strecke (fuer die Schritte), Anteil des letzten Wegs
  const state = t => {
    if (t <= tW) return { pos: P(XL, zS), ry: NORTH, dist: 0, u: -1 }
    if (t <= tN) { const s = d1 * ease1((t - tW) / T1); return { pos: P(XL, zS - s), ry: NORTH, dist: s, u: -1 } }
    const s2 = leg2(t - tN)
    if (!turns || t <= tT) return { pos: P(XL, zE - s2), ry: NORTH, dist: d1 + s2, u: -1 }
    const u = goesIn ? walkInU(t) : walk3(t - tT) / len3
    const pos = curve.getPointAt(clamp01(u)), tan = curve.getTangentAt(clamp(u, 0.001, 0.999))
    // Drehen in 0,4 s vom Blick nach Norden zur Richtung des Wegs, auf dem kuerzeren Weg herum
    const target = Math.atan2(tan.x, tan.z), dA = ((target - NORTH + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI
    return { pos, ry: NORTH + dA * smooth((t - tT) / 0.4), dist: d1 + D2 + u * len3, u }
  }
  // Wann die Blase wieder in das Handy zurueckgeht: "weiter" nie, sonst kurz nach dem Drehen (und bevor er drin ist)
  const tClose = !turns ? Infinity : goesIn ? Math.min(tT + 0.9, tE - 0.55) : tT + 0.9
  if (p.tones) { ctx.cue(tN, 'ding', 0.5); ctx.cue(tN + 0.05, 'pop', 0.35, 1.15) }

  // ---------------------------------------------------------------- Der Ring
  // Auf den Boden gelegt (additiv, schreibt keine Tiefe): Haeuser verdecken ihn, wo er unter ihnen liegt, wie ein
  // Gebiet auf dem Stadtplan. Innen ein Hauch Lila (das Gebiet, nicht nur seine Grenze), am Rand ein weicher
  // Lichtsaum und eine schmale helle Linie. Eine Zahl steht nie dabei (PRODUKT.md N3).
  const M = R + 2.2, RT = 2048, pxm = RT / (2 * M)
  const ringTex = canvasTex(RT, RT, (g, w) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, w, w); g.globalCompositeOperation = 'lighter'
    const c = w / 2, r = R * pxm
    const fill = g.createRadialGradient(c, c, 0, c, c, r)
    fill.addColorStop(0, 'rgba(120,108,255,0.035)'); fill.addColorStop(0.7, 'rgba(130,118,255,0.06)'); fill.addColorStop(1, 'rgba(150,138,255,0.13)')
    g.fillStyle = fill; g.beginPath(); g.arc(c, c, r, 0, Math.PI * 2); g.fill()
    g.filter = `blur(${Math.round(0.42 * pxm)}px)`; g.strokeStyle = 'rgba(150,138,255,0.8)'; g.lineWidth = 0.95 * pxm
    g.beginPath(); g.arc(c, c, r, 0, Math.PI * 2); g.stroke()
    g.filter = `blur(${Math.max(1, Math.round(0.04 * pxm))}px)`; g.strokeStyle = 'rgba(236,232,255,0.95)'; g.lineWidth = 0.17 * pxm
    g.beginPath(); g.arc(c, c, r, 0, Math.PI * 2); g.stroke()
    g.filter = 'none'
  })
  const ringMat = new THREE.MeshBasicMaterial({ map: ringTex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })
  const ring = new THREE.Mesh(new THREE.PlaneGeometry(2 * M, 2 * M), ringMat)
  ring.rotation.x = -Math.PI / 2; ring.position.set(RC.x, CURB + 0.03, RC.z); ring.renderOrder = 4; scene.add(ring)
  // Niedrige Lichtwand ueber dem Rand (unten hell, nach oben weg): macht den Ring auch dort sichtbar, wo er
  // ueber Fahrbahn und Bordstein laeuft, und gibt ihm Hoehe (3D statt Strich auf dem Boden)
  const wallTex = canvasTex(8, 256, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#000000'); gr.addColorStop(0.55, '#1C1840'); gr.addColorStop(0.9, '#8A80F0'); gr.addColorStop(1, '#B4ABFF')
    g.fillStyle = gr; g.fillRect(0, 0, w, h)
  })
  const wallMat = new THREE.MeshBasicMaterial({ map: wallTex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, side: THREE.DoubleSide })
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 1.4, 180, 1, true), wallMat)
  wall.position.set(RC.x, CURB + 0.7, RC.z); wall.renderOrder = 4; scene.add(wall)

  // ---------------------------------------------------------------- Der Kunde und sein Handy
  // Hell gekleidet wie der Stammkunde im Duell. Das Handy haelt er in der Hand auf der Seite zur Kamera (die Figur
  // schaut nach Norden, die Kamera steht im Suedwesten): in der anderen verdeckte es sein eigener Koerper.
  const fig = kit.person({ coat: C.coat, scale: 1.35, y0: CURB })
  // Spielzeuggroesse wie in iso-shop: ein echtes Handy (15 cm) waere aus dieser Hoehe nur ein Strich. In der ersten
  // Probe (16 x 28 cm, Arm gerade nach vorn) stach es wie ein weisser Stab aus der Figur.
  const phone = new THREE.Group(); phone.position.set(0, -0.6, 0.07); fig.armR.add(phone)
  phone.add(new THREE.Mesh(new kit.RoundedBoxGeometry(0.25, 0.42, 0.05, 2, 0.03), std('#1A1440', { roughness: 0.4 })))
  const scrOff = col('#1B1446'), scrOn = col('#D9D3FF')
  const scrMat = new THREE.MeshBasicMaterial({ color: scrOff.clone(), toneMapped: false })
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.36), scrMat); scr.position.z = 0.026; phone.add(scr)
  // Der Schein sitzt auf dem Handy, nicht auf dem Laden: das Handy macht es von selbst
  // Ohne Tiefentest: er steht mit dem Ruecken zur Kamera, sonst schluckte sein Koerper den halben Schein
  const phoneGlow = glow('#B9B0FF', 1.5, new THREE.Vector3(), 0); phoneGlow.material.depthTest = false; phoneGlow.renderOrder = 6

  // ---------------------------------------------------------------- Die Blase: Sperrbildschirm mit der Benachrichtigung
  // Gestaltet wie phone-3d (helle Milchglas-Karte, Kachel in der Ladenfarbe, Absender fett, Text in zwei Zeilen),
  // damit eine 3D-Szene in die naechste passt. Oben Schloss und Uhr: so liest sie sich als Sperrbildschirm.
  const allText = [p.shop, msg, p.clock, 'jetzt'].join(' ')
  await Promise.all([kit.fonts(p.clock + '0123456789:', 700), ...[500, 700].map(w => document.fonts.load(`${w} 100px ${FB}`, allText))])
  const icoW = await kit.icon(p.icon, '#FFFFFF')
  const mc = document.createElement('canvas').getContext('2d')
  const fitSize = (text, font, start, maxW, min) => { let s = start; mc.font = font(s); while (mc.measureText(text).width > maxW && s > min) { s = Math.max(min, Math.floor(s * 0.97)); mc.font = font(s) } return s }
  const CX = 18, CY = 102, CWd = BW - 36, CHt = BH - CY - 16          // Karte der Benachrichtigung
  const TILE = 108, TX = CX + 20, TY = CY + (CHt - TILE) / 2           // Kachel mit Symbol
  const X0 = TX + TILE + 22, XR = CX + CWd - 24, TXW = XR - X0          // Textspalte
  mc.font = `500 30px ${FB}`; const whenW = mc.measureText('jetzt').width
  const titleSize = fitSize(p.shop, s => `700 ${s}px ${FB}`, 40, TXW - whenW - 18, 26)
  const clockSize = fitSize(p.clock, s => `700 ${s}px ${FD}`, 54, 320, 36)
  // Hoechstens zwei Zeilen, bevorzugt nach dem Doppelpunkt geteilt (dort macht der Satz seine Pause); wie phone-3d
  const words = msg.split(' ')
  const wrap2 = size => {
    mc.font = `500 ${size}px ${FB}`
    if (mc.measureText(msg).width <= TXW) return [msg]
    let best = null
    for (let i = 1; i < words.length; i++) {
      const a = words.slice(0, i).join(' '), b = words.slice(i).join(' '), wa = mc.measureText(a).width, wb = mc.measureText(b).width
      if (wa > TXW || wb > TXW) continue
      const score = Math.max(wa, wb) - (a.endsWith(':') ? TXW * 0.25 : 0)
      if (!best || score < best.score) best = { score, lines: [a, b] }
    }
    return best && best.lines
  }
  let bodySize = 44, bodyLines = wrap2(bodySize)
  while (!bodyLines && bodySize > 30) { bodySize -= 2; bodyLines = wrap2(bodySize) }
  if (!bodyLines) ctx.fail(`"${msg}" passt nicht in zwei Zeilen der Benachrichtigung. Belohnung kürzen (höchstens etwa 16 Zeichen)`)
  if (bodySize < 38) ctx.warn(`der Text der Benachrichtigung "${msg}" steht nur noch in ${bodySize} px (Vorgabe 44). Belohnung kürzen.`)
  if (titleSize < 32) ctx.warn(`der Absender "${p.shop}" steht in der Benachrichtigung nur noch in ${titleSize} px (Vorgabe 40). Namen kürzen.`)
  const acc = col(p.accent), accHi = '#' + acc.clone().lerp(col('#FFFFFF'), 0.14).getHexString(), accLo = '#' + acc.clone().multiplyScalar(0.62).getHexString()
  const rr = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r) }
  const TS = 2 // doppelt aufgeloest: die Blase steht in Bildpunkten 1:1 im Bild, so bleibt die Schrift scharf
  const bubTex = canvasTex(BW * TS, BH * TS, g => {
    g.scale(TS, TS)
    const gr = g.createLinearGradient(0, 0, BW * 0.45, BH); gr.addColorStop(0, '#5446C2'); gr.addColorStop(0.55, '#2B2177'); gr.addColorStop(1, '#161041')
    g.fillStyle = gr; g.fillRect(0, 0, BW, BH)
    g.filter = 'blur(30px)'
    for (const [x, y, r, c] of [[70, 300, 130, 'rgba(255,120,170,.30)'], [590, 30, 150, 'rgba(150,130,255,.5)'], [430, 330, 120, 'rgba(255,180,106,.2)']]) { g.fillStyle = c; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill() }
    g.filter = 'none'
    g.strokeStyle = g.fillStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 3.4
    g.beginPath(); g.arc(BW / 2, 21, 6.5, Math.PI, 0); g.stroke(); rr(g, BW / 2 - 10, 20, 20, 14, 3); g.fill()
    g.fillStyle = '#FFFFFF'; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.font = `700 ${clockSize}px ${FD}`; g.fillText(p.clock, BW / 2, 88)
    g.save(); g.filter = 'blur(10px)'; g.fillStyle = 'rgba(8,5,25,.45)'; rr(g, CX + 6, CY + 10, CWd - 12, CHt, 30); g.fill(); g.restore()
    g.fillStyle = 'rgba(248,245,255,.96)'; rr(g, CX, CY, CWd, CHt, 30); g.fill()
    const tg = g.createLinearGradient(TX, TY, TX, TY + TILE); tg.addColorStop(0, accHi); tg.addColorStop(1, accLo)
    g.fillStyle = tg; rr(g, TX, TY, TILE, TILE, 26); g.fill()
    g.drawImage(icoW, TX + 22, TY + 22, TILE - 44, TILE - 44)
    g.textAlign = 'right'; g.fillStyle = '#6B6585'; g.font = `500 30px ${FB}`; g.fillText('jetzt', XR, CY + 50)
    g.textAlign = 'left'; g.fillStyle = '#16122E'; g.font = `700 ${titleSize}px ${FB}`; g.fillText(p.shop, X0, CY + 52)
    g.fillStyle = '#2A2445'; g.font = `500 ${bodySize}px ${FB}`
    const y1 = bodyLines.length === 1 ? CY + 52 + 22 + bodySize : CY + 52 + 14 + bodySize
    bodyLines.forEach((l, i) => g.fillText(l, X0, y1 + i * bodySize * 1.16))
  }, { sharp: true })
  // Platte mit runder Kante (Masse in Bildpunkten; die Gruppe wird je Bild auf Bildpunkt-Groesse skaliert). Der
  // Deckel traegt die Textur, die Kante ist dunkles Lila mit etwas Eigenlicht: ein Rahmen wie bei einem Handy.
  const rrShape = (w, h, r) => {
    const s = new THREE.Shape(), x = -w / 2, y = -h / 2
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0)
    s.lineTo(x + w, y + h - r); s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2)
    s.lineTo(x + r, y + h); s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI)
    s.lineTo(x, y + r); s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5)
    return s
  }
  const bev = 6, dep = 22, iw = BW - 2 * bev, ih = BH - 2 * bev
  const slabGeo = new THREE.ExtrudeGeometry(rrShape(iw, ih, BR - bev), { depth: dep, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 3, curveSegments: 14 })
  slabGeo.translate(0, 0, -dep / 2)
  { const g0 = slabGeo.groups[0], pos = slabGeo.attributes.position, uv = slabGeo.attributes.uv; for (let i = g0.start; i < g0.start + g0.count; i++) uv.setXY(i, (pos.getX(i) + iw / 2) / iw, (pos.getY(i) + ih / 2) / ih); uv.needsUpdate = true }
  const slab = new THREE.Mesh(slabGeo, [new THREE.MeshBasicMaterial({ map: bubTex, toneMapped: false, fog: false }), std('#2A2166', { emissive: '#4A3FB0', emissiveIntensity: 0.6, roughness: 0.45, fog: false })])
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(BW * 1.5, BH * 1.9), new THREE.MeshBasicMaterial({ map: kit.blobTex, color: '#9F95FF', transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false }))
  halo.position.z = -30
  const bub = new THREE.Group(); bub.add(halo, slab); bub.visible = false; scene.add(bub)
  const slabCorners = [], bc = []
  for (const x of [-BW / 2, BW / 2]) for (const y of [-BH / 2, BH / 2]) for (const z of [-dep / 2 - bev, dep / 2 + bev]) { slabCorners.push(new THREE.Vector3(x, y, z)); bc.push(new THREE.Vector3()) }
  // Lichtkegel vom Handy hinauf zur Blase: sagt "das zeigt sein Handy". Vier Ecken, je Bild neu gesetzt.
  const coneTex = canvasTex(64, 256, (g, w, h) => {
    const vg = g.createLinearGradient(0, h, 0, 0); vg.addColorStop(0, 'rgba(255,255,255,.95)'); vg.addColorStop(0.3, 'rgba(255,255,255,.3)'); vg.addColorStop(1, 'rgba(255,255,255,.5)')
    g.fillStyle = vg; g.fillRect(0, 0, w, h)
    g.globalCompositeOperation = 'destination-in'
    const hg = g.createLinearGradient(0, 0, w, 0); hg.addColorStop(0, 'rgba(0,0,0,0)'); hg.addColorStop(0.32, 'rgba(0,0,0,1)'); hg.addColorStop(0.68, 'rgba(0,0,0,1)'); hg.addColorStop(1, 'rgba(0,0,0,0)')
    g.fillStyle = hg; g.fillRect(0, 0, w, h)
  })
  const coneGeo = new THREE.BufferGeometry()
  coneGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(12), 3))
  coneGeo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), 2))
  coneGeo.setIndex([0, 1, 2, 2, 1, 3])
  const coneMat = new THREE.MeshBasicMaterial({ map: coneTex, color: '#A99FFF', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, side: THREE.DoubleSide, fog: false })
  const cone = new THREE.Mesh(coneGeo, coneMat); cone.frustumCulled = false; cone.visible = false; scene.add(cone)

  // ---------------------------------------------------------------- Kamera
  // "laden": genau die Kamera des Duells (ein Video kann vom Duell hierher schneiden, die Stadt bleibt stehen).
  // "stadt": hoeher und weiter weg, der ganze Ring und beide Laeden im unteren Teil des Bildes; oben bleibt der
  // Streifen fuer die Blase frei.
  let frame = FRAME, camOpts = { push: p.push, orbit: p.orbit, az: 45, el: 34, elDrop: 1.5, aim: aimDuell, fog: [24, 118] }
  if (p.frame === 'stadt') {
    const pts = []
    for (let i = 0; i < 32; i++) { const a = i / 32 * Math.PI * 2; pts.push(new THREE.Vector3(RC.x + R * Math.cos(a), CURB, RC.z + R * Math.sin(a))) }
    for (const s of [our, riv]) pts.push(...kit.corners(new THREE.Box3().setFromObject(s.g)))
    // 46 Grad von oben statt 34: naeher an der "Karte von oben", die der Betreiber fuer "in der Naehe" will
    // (START.md), und der Ring liest sich runder; Schilder bleiben noch lesbar (bei 55 Grad zu flach)
    camOpts = { push: p.push, orbit: p.orbit, az: 45, el: 46, elDrop: 1.5, aim: kit.aimAcross(pts, 1.6), fog: [24, 118] }
    frame = kit.fitFrame(pts, { ...camOpts, fov: 22, rect: { left: 60, right: 940, top: 960, bottom: 1536 } })
  }
  const cam = kit.isoCamera({ fov: 22, near: 20, far: 700, frame })

  // ---------------------------------------------------------------- Pruefkaesten
  // Schilder und Blase in einer data-apart-Gruppe: die Blase darf kein Schild verdecken
  kit.safeBox('ourSign', 'Schild ' + our.name, true); kit.safeBox('rivSign', 'Schild ' + riv.name, true)
  kit.safeBox('bubble', 'Benachrichtigung', true)
  kit.safeBox('walker', 'Kunde', false)

  // ---------------------------------------------------------------- Bildpunkt <-> Welt
  // Die Blase hat eine feste Groesse im Bild: Ort aus einem Bildpunkt und einer Tiefe (Abstand entlang der
  // Blickrichtung), Massstab aus der Tiefe (Meter je Bildpunkt bei 22 Grad senkrechtem Blickwinkel)
  const ndc = new THREE.Vector3(), dir = new THREE.Vector3(), fwd = new THREE.Vector3(), hp = new THREE.Vector3(), tv = new THREE.Vector3()
  const toWorld = (sx, sy, depth, out) => {
    const cm = kit.camera
    ndc.set(sx / W * 2 - 1, 1 - sy / H * 2, 0.5).unproject(cm)
    dir.copy(ndc).sub(cm.position).normalize(); cm.getWorldDirection(fwd)
    return out.copy(cm.position).addScaledVector(dir, depth / dir.dot(fwd))
  }
  const toScreen = v => { tv.copy(v).project(kit.camera); return [(tv.x + 1) / 2 * W, (1 - tv.y) / 2 * H] }
  const wpp = depth => 2 * depth * Math.tan(THREE.MathUtils.degToRad(kit.camera.fov / 2)) / H
  const tilt = new THREE.Quaternion(), eul = new THREE.Euler(), cv = [0, 1, 2, 3].map(() => new THREE.Vector3())
  const fromHinge = pos => Math.hypot(pos.x - our.hingeWorld.x, pos.z - our.hingeWorld.z)
  const opening = (t, t0, t1) => smooth((t - t0) / 0.35) * (1 - smooth((t - t1) / 0.5))

  // ---------------------------------------------------------------- Zustand zum Zeitpunkt t (ohne Zeichnen)
  kit.run(t => {
    cam.set(t, camOpts)
    // Ring: blendet am Szenenanfang ein und steht dann still (er reagiert nicht auf den Kunden)
    const rk = smooth((t - ctx.s - 0.05) / 0.6)
    ringMat.opacity = 0.95 * rk; wallMat.opacity = 0.34 * rk
    // Kunde
    const st = state(t), st0 = state(t - 0.03)
    const inside = goesIn && st.u >= uHide
    fig.fig.visible = fig.blob.visible = !inside
    fig.at(st.pos.x, st.pos.z, st.ry)
    // Schritte aus der Strecke; Ausschlag nach Tempo, damit er beim Anhalten nicht mitten im Schritt einfriert
    const amp = clamp01(Math.abs(st.dist - st0.dist) / 0.03 / 1.1)
    const cyc = walkCycle(st.dist, true); for (const k of ['legL', 'legR', 'armL', 'armR', 'bob']) cyc[k] *= amp
    fig.pose(cyc)
    // Handy hoch, sobald es sich meldet; wieder runter, wenn die Blase zurueckgeht
    const up = t < tN ? 0 : smooth((t - tN) / 0.3) * (1 - smooth((t - tClose) / 0.35))
    // Arm schraeg nach vorn und etwas nach aussen, Bildschirm nach oben (er liest). Nicht vor die Brust: die Kamera
    // steht hinter ihm, und vor der Brust verdeckte sein Ruecken Handy und Schein (zweite Probe 18.11.2026)
    fig.armR.rotation.x = lerp(cyc.armR, -0.75, up); fig.armR.rotation.z = lerp(0, 0.4, up)
    // Bildschirm zu seinem Gesicht (nach oben und hinten): so sieht ihn auch die Kamera ueber seine Schulter. Zur
    // Hand hin gedreht stand das Handy als duenner Strich in der Luft.
    phone.rotation.x = lerp(0, -1.6, up)
    const lit = t < tN ? 0 : smooth((t - tN + 0.02) / 0.12) * (1 - smooth((t - tClose - 0.1) / 0.4))
    scrMat.color.copy(scrOff).lerp(scrOn, lit)
    // Tuer, Glocke, Licht im Laden ("rein")
    if (goesIn) {
      our.door((1 - smooth((fromHinge(st.pos) - 2.6) / 0.6)) * (1 - smooth((t - tHide - 0.05) / 0.5)))
      bell.ring(t - tE)
      our.shine(p.after ? smooth((t - tE - 0.3) / 1.5) : 0, opening(t, tE - 0.25, tE + 0.35))
    } else { our.door(0); bell.ring(-1); our.shine(0) }
    chat.forEach((c, i) => { const ph = t * 2.2 + i * 2; c.body.rotation.z = 0.04 * Math.sin(ph); c.armR.rotation.x = -0.5 * Math.max(0, Math.sin(ph * 0.9 + i * 3)); c.armR.rotation.z = 0.2 * Math.max(0, Math.sin(ph * 0.9 + i * 3)) })
    if (smoke) smoke.update(t)
    kit.sync()
    // Schein am Handy
    phone.getWorldPosition(hp)
    phoneGlow.position.copy(hp); phoneGlow.material.opacity = fig.fig.visible ? lit * (0.6 + 0.4 * Math.max(0, 1 - (t - tN) / 0.5)) : 0
    // Blase. Platz: immer im Streifen unter den Textzeilen (Oberkante TOP), waagerecht ueber dem Handy, aber
    // zwischen x = 66 und 934 (rechts liegen die Knoepfe von TikTok; 6 px Luft fuer Kante und Neigung). In der ersten
    // Probe sass sie so tief wie moeglich ueber dem Kunden; in der weiten Ansicht rutschte sie mitten ins Bild.
    // Ablauf: zu "near" leuchtet das Handy, der Lichtkegel schiesst in 0,12 s hinauf in den Streifen, dann springt
    // dort die Blase auf (von ihrer Unterkante aus, wo der Kegel ankommt). Sie fliegt nicht vom Handy hinauf: auf
    // dem Weg strich sie in der zweiten Probe fuer 0,1 s ueber das Schild gegenueber. Sie wird auch nie groesser als
    // 1 (kein Ueberschwingen der Groesse): ein paar Bildpunkte mehr, und ihr Kasten lag auf dem Schild. Das
    // "Springen" kommt aus der schnellen Kurve und dem Aufleuchten des Scheins dahinter.
    // Zurueck geht sie an ihrem Platz (kleiner werden), nicht ins Handy: dort ist er dann fast an der Tuer.
    const [hx, hy] = toScreen(hp)
    const kr = clamp01((t - tN) / 0.12), kb = clamp01((t - tN - 0.1) / 0.4), kc = clamp01((t - tClose) / 0.3)
    const grow = t < tN + 0.1 ? 0 : lerp(0.15, 1, Math.min(1, backOut(kb, 1.7))) * (1 - smooth(kc))
    const bottom = TOP + BH, cxT = clamp(hx - 0.06 * BW, 66 + BW / 2, 934 - BW / 2)
    let bx = cxT, by = bottom - grow * BH / 2
    bub.visible = grow > 0.03 && fig.fig.visible
    cone.visible = t >= tN && kc < 1 && fig.fig.visible
    kit.camera.getWorldDirection(fwd)
    const D = 0.7 * tv.copy(st.pos).sub(kit.camera.position).dot(fwd)
    if (bub.visible) {
      toWorld(bx, by, D, bub.position)
      // Leicht zur Seite gedreht (die Kante zeigt: ein Koerper, kein Aufkleber), kaum gekippt: jede Kippung hebt die
      // Ecken ueber den Streifen hinaus (bei 0,08 um 11 px, dann lag der Kasten ueber y 600)
      bub.quaternion.copy(kit.camera.quaternion).multiply(tilt.setFromEuler(eul.set(-0.02 + 0.01 * Math.sin(t * 1.1), 0.22 + 0.04 * Math.sin(t * 1.3 + 1), 0)))
      bub.scale.setScalar(wpp(D) * grow)
      halo.material.opacity = 0.32 + 0.45 * Math.max(0, 1 - (t - tN - 0.1) / 0.6)
      bub.updateMatrixWorld(true)
      // Nachmessen und schieben: Dicke, Drehung und der Blick schraeg von unten (der Streifen liegt weit ueber der
      // Bildmitte) heben die Ecken um 9 bis 15 px ueber TOP hinaus, je nach Ausschnitt. Statt das vorauszurechnen,
      // wird der echte Umriss gemessen und die Blase so verschoben, dass er in x 64 bis 936 und ab y 602 liegt.
      const [x0, y0, x1] = kit.project(slabCorners.map((c, i) => bc[i].copy(c).applyMatrix4(slab.matrixWorld)))
      const ddx = Math.max(0, 64 - x0) + Math.min(0, 936 - x1), ddy = Math.max(0, 602 - y0)
      if (ddx || ddy) { bx += ddx; by += ddy; toWorld(bx, by, D, bub.position); bub.updateMatrixWorld(true) }
    }
    if (cone.visible) {
      // Kegel etwas hinter der Blase (ihre Unterkante verdeckt sein oberes Ende); er waechst vom Handy hinauf
      const top = lerp(hy, by + grow * BH / 2 - 0.12 * BH * Math.max(grow, 0.3), outCubic(kr)), half = lerp(7, 0.3 * BW, outCubic(kb)) * (1 - 0.5 * smooth(kc))
      const Dc = D + 3
      toWorld(hx - 7, hy, Dc, cv[0]); toWorld(hx + 7, hy, Dc, cv[1]); toWorld(bx - half, top, Dc, cv[2]); toWorld(bx + half, top, Dc, cv[3])
      const pa = coneGeo.attributes.position; cv.forEach((v, i) => pa.setXYZ(i, v.x, v.y, v.z)); pa.needsUpdate = true
      coneMat.opacity = 0.55 * Math.min(1, kr * 2) * (1 - smooth(kc))
    }
    // Pruefkaesten: wo die Kamera Schilder, Blase und Kunde in diesem Bild hinwirft
    kit.setSafe('ourSign', kit.project(our.signCorners)); kit.setSafe('rivSign', kit.project(riv.signCorners))
    // Kasten der Blase aus ihren acht echten Ecken: kit.meshBox nimmt die achsparallele Huelle in der Welt, und die
    // ist bei einer schraeg zur Welt stehenden Platte viel groesser (erste Probe: y 404 bis 1215 statt 606 bis 936)
    kit.setSafe('bubble', bub.visible && grow > 0.5 ? kit.project(slabCorners.map((c, i) => bc[i].copy(c).applyMatrix4(slab.matrixWorld))) : null)
    kit.setSafe('walker', fig.fig.visible ? kit.meshBox([fig.fig]) : null)
  })

  // Nur fuer tools/test_3d_iso_street_naehe.mjs: Lage ohne Bilder (walkerAt ist eine reine Funktion von t), was
  // in der Blase steht und wie gross, wo Kunde und Blase wirklich Pixel aendern (drawnBox, nur die Platte: der
  // weiche Schein dahinter reicht absichtlich ueber den Kasten hinaus), Abstand zum Tuerblatt (wie im Duell).
  kit.canvas.isoDebug = {
    signs: signs.map(x => ({ ...x })),
    nah: { R, center: [RC.x, RC.z], door: [door0.x, door0.z], entry: P(XL, zE).toArray(), start: P(XL, zS).toArray(), msg, bodyLines, bodySize, titleSize, clockSize, then: p.then, frame: p.frame, tClose: Number.isFinite(tClose) ? tClose : null, tHide: Number.isFinite(tHide) ? tHide : null },
    walkerAt(t) {
      const st = state(t)
      return { x: +st.pos.x.toFixed(3), z: +st.pos.z.toFixed(3), ring: +Math.hypot(st.pos.x - RC.x, st.pos.z - RC.z).toFixed(3), visible: !(goesIn && st.u >= uHide) }
    },
    ringScreen() { kit.sync(); const out = []; for (let i = 0; i < 48; i++) { const a = i / 48 * Math.PI * 2; out.push(kit.project([new THREE.Vector3(RC.x + R * Math.cos(a), CURB, RC.z + R * Math.sin(a))]).slice(0, 2).map(v => Math.round(v))) } return out },
    drawnBox(what) { return kit.drawnBox(what === 'walker' ? fig.fig : what === 'bubble' ? (bub.visible ? slab : null) : null) },
    doorGap() {
      if (!fig.fig.visible || Math.abs(our.hinge.rotation.y) < 1e-3) return null
      scene.updateMatrixWorld()
      const sc = fig.fig.scale.x, inv = new THREE.Matrix4().copy(our.leaf.matrixWorld).invert(), q1 = new THREE.Vector3()
      let best = Infinity
      for (const [mesh, r, l] of fig.capsules()) for (let i = 0; i <= 8; i++) {
        q1.set(0, -l / 2 + l * i / 8, 0).applyMatrix4(mesh.matrixWorld).applyMatrix4(inv)
        best = Math.min(best, Math.hypot(Math.max(0, Math.abs(q1.x) - 0.56), Math.max(0, Math.abs(q1.y) - 1.16), Math.max(0, Math.abs(q1.z) - 0.04)) - r * sc)
      }
      return +best.toFixed(3)
    }
  }
}
