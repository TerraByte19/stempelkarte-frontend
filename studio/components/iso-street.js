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
// Wie das Bild entsteht: three.js (engine/vendor, ohne Netz) zeichnet in ein <canvas>. Der
// Baustein meldet mit ctx.frame(fn) eine Zeichenfunktion an, die engine.js bei jedem seek(t)
// mit genau diesem t aufruft. Alles, was sich bewegt (Kamera, Figur, Herz, Glocke, Rauch),
// ist eine reine Funktion von t; die Stadt entsteht aus einem festen Startwert. Kein
// Math.random, keine Uhr: Bild N sieht in jedem Lauf gleich aus (tools/test_3d.mjs prueft das).
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
import { BRAND } from '../engine/brand.js'
import { ICONS } from '../engine/icons.js'

const W = 1080, H = 1920
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

// Farben. Die Stadt bleibt bewusst grau-lila und dunkel: nur die beiden Laeden duerfen leuchten,
// sonst sucht das Auge auf dem Handy, worum es geht.
const C = {
  // Stadt eine Stufe heller als in der ersten Probe: dort verschwammen die Hauswaende mit dem Nachthimmel,
  // und die Fenster schwebten als lose Rechtecke im Dunkel (Review 17.11.2026)
  fog: BRAND.night, road: '#221D4A', walk: '#37326A', curb: '#4F4988', mark: '#4F4987', zebra: '#9590C4',
  pave: '#423C76', lawn: '#2C4066',
  city: ['#3B375F', '#433E69', '#37335A', '#4A4572', '#3F3A63'],
  winWarm: ['#FFD58A', '#FFC56E', '#FFB55A'], winCool: '#B9B0FF', winOff: '#221B4A',
  tree: ['#6077AA', '#706CB2', '#4F8094', '#8471A8'], trunk: '#2A1F45', lamp: '#FFD9A0', pole: '#2A2258',
  skin: '#F2C29B', hair: '#2A1A2E', coat: BRAND.paper, legs: '#2B2457', heart: '#FF6B8B', bell: '#F4C56A',
  cars: ['#5B4E9A', '#8C3F5E', '#3E6A7A']
}

// Fester Zufall (mulberry32): dieselbe Stadt in jedem Lauf, auf jeder Seite
function rng(seed) {
  let a = seed >>> 0
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}
const clamp01 = x => Math.max(0, Math.min(1, x))
const smooth = x => { x = clamp01(x); return x * x * x * (x * (x * 6 - 15) + 10) }   // weich an beiden Enden
const lerp = (a, b, t) => a + (b - a) * t

export default {
  title: 'Zwei Läden gegenüber in 3D: Kreuzung bei Nacht, Stammkunde geht rüber',
  use: 'Isometrische Nachtszene in 3D: der eigene Laden und der Laden gegenüber an einer Kreuzung, beide Fronten zueinander. Über dem eigenen Laden zerbricht ein Herz, der Stammkunde geht über die Kreuzung und verschwindet gegenüber durch die Tür, die Ladenglocke schwingt. Die Kamera fährt langsam heran und dreht sich ein paar Grad. Für "Dein Stammkunde ... gegenüber", wenn es nach den großen Mitbewerbern aussehen soll. Rechnet etwa 1,3 s je Bild (ohne Grafikkarte), also deutlich länger als die 2D-Bausteine.',
  params: {
    shop: { default: 'Döner Palast', doc: 'Name des eigenen Ladens auf seinem Schild (höchstens etwa 14 Zeichen, längere werden kleiner gesetzt)', same: 'Ladenname' },
    icon: { default: 'kebab', doc: 'Symbol des eigenen Ladens: cup, bread, scissors, star, heart, check, kebab', same: 'Symbol' },
    accent: { default: '#7366E8', doc: 'Farbe des eigenen Ladens (Markise, Symbolfeld)' },
    rival: { default: 'Imbiss Sonne', doc: 'Name des Ladens gegenüber (höchstens etwa 14 Zeichen)' },
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
    tones: { default: true, doc: 'Eigene Töne (thud beim Zerbrechen, ding an der Tür). false, wenn das Skript Klänge aus der Bibliothek setzt' }
  },
  captions: { min: 1 },
  anchors: p => ({
    ...(p.heart && !p.back ? { crack: { cap: 0, word: -1, doc: 'Das Herz über dem eigenen Laden zerbricht (Ton: thud). Auf "betrogen" o. ä.' } } : {}),
    ...(p.walker ? {
      walk: { at: 'start', offset: 0, doc: 'Der Stammkunde geht los (von "from" aus); die Tür, aus der er kommt, geht kurz vorher auf' },
      cross: { at: 'start', offset: 0, doc: 'Er tritt an die Bordsteinkante und geht auf die Fahrbahn. Vorgabe: gleich mit "walk", dann geht er gleichmäßig durch. Auf ein Wort gesetzt, ist er genau dann an der Kante' },
      enter: { cap: -1, word: -1, doc: 'Er ist an der Tür drüben und verschwindet hinein, die Ladenglocke schwingt (Ton: ding)' }
    } : {})
  }),
  demo: {
    params: { shop: 'Döner Palast', icon: 'kebab', rival: 'Imbiss Sonne', rivalIcon: 'kebab' },
    captions: [{ lines: ['Dein Stammkunde', 'hat dich betrogen.'], accent: 2 }, { lines: ['Mit dem Dönerladen gegenüber.'] }],
    at: { cap: 0, word: -1, offset: 0.3 }
  },
  css: `
  /* .is-wrap hebt die langsame 2D-Kamerafahrt der Szene (.ill, 1,05 auf 1) wieder auf: die 3D-Kamera faehrt
     selbst. Beide zusammen hoben sich vorher fast auf (die 3D-Fahrt heran, .ill heraus), und am Szenenanfang
     ragte das Bild um 5 % ueber den vermessenen Ausschnitt hinaus. */
  .is-wrap { position: absolute; inset: 0; transform-origin: 50% 62%; }
  .is-canvas { position: absolute; left: 0; top: 0; width: ${W}px; height: ${H}px; }
  /* Unsichtbare Kaesten ueber Schildern, Herz und Figur, nur fuer die Pruefungen (siehe oben) */
  .is-box { position: absolute; visibility: hidden; pointer-events: none; }
  /* Oben laufen die Textzeilen: die Stadt dort im Dunst ausblenden, damit die Woerter auf ruhigem Grund stehen */
  .is-calm { position: absolute; left: 0; right: 0; top: 0; height: 760px; pointer-events: none;
    background: linear-gradient(180deg, ${BRAND.night} 0%, rgba(14,10,36,.94) 20%, rgba(14,10,36,.7) 40%, rgba(14,10,36,.25) 68%, rgba(14,10,36,0) 100%); }
  /* Ecken leicht abdunkeln: haelt den Blick in der Mitte, wie bei einer Linse */
  /* Schwaecher als in der ersten Probe: dort lag der Platz unten bei Helligkeit 10 bis 19 von 255 */
  .is-vig { position: absolute; inset: 0; pointer-events: none; background: radial-gradient(ellipse 90% 64% at 50% 52%, rgba(14,10,36,0) 62%, rgba(14,10,36,.42) 100%), linear-gradient(180deg, rgba(14,10,36,0) 80%, rgba(14,10,36,.3) 100%); }
  `,
  async build(ctx) {
    const { p } = ctx
    if (!['left', 'right'].includes(p.ours)) ctx.fail('"ours" muss "left" oder "right" sein')
    if (!ICONS[p.rivalIcon]) ctx.fail(`Symbol "${p.rivalIcon}" gibt es nicht. Erlaubt: ${Object.keys(ICONS).join(', ')}`)
    if (typeof p.from !== 'number' || p.from < 0 || p.from > 0.9) ctx.fail('"from" muss zwischen 0 und 0,9 liegen')
    // Die Fahrt endet immer im vermessenen Ausschnitt; mehr als 0,25 hiesse nur, dass die Laeden am Anfang winzig sind
    if (!(p.push >= 0 && p.push <= 0.25)) ctx.fail('"push" muss zwischen 0 und 0,25 liegen (mehr lässt die Kamera so weit weg anfangen, dass die Läden am Anfang winzig sind)')
    if (!(p.orbit >= 0 && p.orbit <= 12)) ctx.fail('"orbit" muss zwischen 0 und 12 Grad liegen (mehr zeigt den Rand der Stadt)')

    // three.js erst hier laden: so bleibt der Baustein in Node (Katalog, Selbsttest) ohne die 700 KB importierbar
    const THREE = await import('../engine/vendor/three.module.min.js')
    const { RoundedBoxGeometry } = await import('../engine/vendor/RoundedBoxGeometry.js')

    const wrap = ctx.el('div', 'is-wrap'), canvas = ctx.el('canvas', 'is-canvas'); canvas.width = W * SS; canvas.height = H * SS
    wrap.append(canvas)
    ctx.root.append(wrap, ctx.el('div', 'is-vig'), ctx.el('div', 'is-calm'))
    const illEl = ctx.root.closest('.ill')
    let renderer
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' })
    } catch (e) { ctx.fail('WebGL steht in diesem Browser nicht zur Verfügung (' + e.message + '). Der 3D-Baustein braucht Chromium mit WebGL (SwiftShader reicht).') }
    renderer.setPixelRatio(1); renderer.setSize(W * SS, H * SS, false)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    // Neutral statt ACES: ACES zieht Lila ins Blaue, die Markenfarben sollen bleiben, wie sie sind
    renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.05
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap
    // Der Schatten steht still (siehe oben): einmal werfen, dann nur noch lesen
    renderer.shadowMap.autoUpdate = false; renderer.shadowMap.needsUpdate = true
    const aniso = renderer.capabilities.getMaxAnisotropy()

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(C.fog)
    scene.fog = new THREE.Fog(C.fog, 98, 172)

    // ---------------------------------------------------------------- Hilfen
    const col = c => new THREE.Color(c)
    const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0, ...o })
    const lam = (color, o = {}) => new THREE.MeshLambertMaterial({ color, ...o })
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v3 = new THREE.Vector3(), s3 = new THREE.Vector3(), eul = new THREE.Euler()
    // Anisotrope Filterung nur fuer Schrift (Schilder): am Boden kostete sie eine halbe Sekunde je Bild,
    // und dort liegt ohnehin nur Weiches (Lichtkegel, Kontaktschatten)
    const canvasTex = (w, h, draw, { srgb = true, sharp = false } = {}) => {
      const c = document.createElement('canvas'); c.width = w; c.height = h
      draw(c.getContext('2d'), w, h)
      const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace
      t.anisotropy = sharp ? Math.min(8, aniso) : 1; t.minFilter = THREE.LinearMipmapLinearFilter
      return t
    }
    const blobTex = canvasTex(128, 128, (g, w) => {
      const r = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2)
      r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.4, 'rgba(255,255,255,.5)'); r.addColorStop(1, 'rgba(255,255,255,0)')
      g.fillStyle = r; g.fillRect(0, 0, w, w)
    })
    const glow = (color, size, pos, opacity = 1) => {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: blobTex, color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }))
      s.scale.set(size, size, 1); s.position.copy(pos); scene.add(s); return s
    }
    // Material, das seine Textur nach der Lage in der Welt liest (x und z), nicht nach eigenen Koordinaten:
    // so liegen Boden, Gehwegplatten und Streifen auf EINER gemalten Karte mit Lichtkegeln und Schatten.
    const worldMapped = mat => {
      mat.onBeforeCompile = sh => {
        sh.vertexShader = sh.vertexShader.replace('#include <uv_vertex>', `#include <uv_vertex>
          vec4 wuvP = vec4( position, 1.0 );
          #ifdef USE_INSTANCING
            wuvP = instanceMatrix * wuvP;
          #endif
          wuvP = modelMatrix * wuvP;
          vec2 wuv = vec2( ( wuvP.x - (${GO.toFixed(1)}) ) / ${GS.toFixed(1)}, 1.0 - ( wuvP.z - (${GO.toFixed(1)}) ) / ${GS.toFixed(1)} );
          #ifdef USE_MAP
            vMapUv = wuv;
          #endif
          #ifdef USE_EMISSIVEMAP
            vEmissiveMapUv = wuv;
          #endif`)
      }
      mat.customProgramCacheKey = () => 'iso-world-uv'
      return mat
    }
    const gx = v => (v - GO) / GS * GN // Meter -> Bildpunkt der Bodentextur

    // ---------------------------------------------------------------- Licht
    // Mond von hinten (Nordost): er kantet Daecher und Koepfe an und wirft die Schatten zur Kamera hin,
    // dadurch bekommt die Stadt Tiefe. Die sichtbaren Fronten liegen im Schatten und leben von den
    // Fenstern und den Ladenlichtern, wie nachts eben.
    // Himmelslicht bewusst wenig gesaettigt: die Stadt soll grau-lila bleiben, damit die zwei Laeden leuchten
    scene.add(new THREE.HemisphereLight('#7A74B8', '#171230', 1.3))
    const moon = new THREE.DirectionalLight('#D2CBFF', 2.4)
    moon.position.set(30, 46, -40); moon.target.position.set(0, 0, 0)
    moon.castShadow = true
    moon.shadow.mapSize.set(2048, 2048)
    Object.assign(moon.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40, near: 10, far: 150 })
    moon.shadow.bias = -0.0005; moon.shadow.normalBias = 0.04; moon.shadow.radius = 2.5
    scene.add(moon, moon.target)
    // Aufhellung von der Kamera her, schwach und ohne Schatten: sonst saufen die Fronten ganz ab
    const fill = new THREE.DirectionalLight('#9A94D8', 0.6); fill.position.set(-30, 25, 30); scene.add(fill)

    // ---------------------------------------------------------------- Laeden: Lage
    // Links: Block nordwestlich der Kreuzung, Front nach Sueden (+z). Rechts: Block suedoestlich, Front nach
    // Westen (-x). Ein Laden wird im eigenen Koordinatensystem gebaut (Front zeigt nach +z, Ecke zur Kreuzung
    // bei x = 0, der Laden reicht nach -x und -z) und dann an seinen Platz gedreht.
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
    // Laternen auf dem Platz, an den Wegen zum Brunnen: ihre warmen Lichtkreise geben dem unteren Bilddrittel
    // etwas zu sehen. In der ersten Probe war es dort fast schwarz, der Brunnen las sich wie ein Pilz.
    // Am Rand des Pflasterrings, nicht naeher zur Kreuzung: naeher lag der Schein im Bild auf den Fuessen des
    // Stammkunden, wenn er ueber die Kreuzung geht
    const plazaLamps = [[FOUNT[0] + 1.0, FOUNT[1] - 4.4], [FOUNT[0] - 1.0, FOUNT[1] + 4.4], [FOUNT[0] + 4.4, FOUNT[1] + 1.0], [FOUNT[0] - 4.4, FOUNT[1] - 1.0]]
    lamps.push(...plazaLamps)

    // ---------------------------------------------------------------- Boden malen
    // Grundfarben, Bordsteinkanten und Kontaktschatten in die Farbtextur, Lichtkegel in die Leuchttextur.
    const shopGlow = { [oursSide]: '185,176,255', [rivalSide]: '255,180,106' }
    const groundTex = canvasTex(GN, GN, g => {
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
    const glowTex = canvasTex(GN, GN, g => {
      g.fillStyle = '#000'; g.fillRect(0, 0, GN, GN); g.globalCompositeOperation = 'lighter'
      const spot = (x, z, r, rgb, a) => { const gr = g.createRadialGradient(gx(x), gx(z), 0, gx(x), gx(z), r * GN / GS); gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(0.45, `rgba(${rgb},${a * 0.45})`); gr.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = gr; g.fillRect(gx(x - r), gx(z - r), 2 * r * GN / GS, 2 * r * GN / GS) }
      for (const [x, z] of lamps) spot(x, z, 3.6, '255,190,120', 0.4)
      for (const [x, z] of plazaLamps) spot(x, z, 3.2, '255,196,130', 0.22)
      // Schein des Brunnens auf dem Pflaster (Lila wie das Wasser)
      spot(FOUNT[0], FOUNT[1], 4.6, '150,138,255', 0.24)
      // Licht aus Schaufenster und Tuer faellt vor dem Laden auf den Gehweg
      for (const side of ['left', 'right']) {
        const along = side === 'left' ? [[-B - 1.3, -B + 1.2], [-B - 3.8, -B + 1.3]] : [[B - 1.2, B + 1.3], [B - 1.3, B + 3.8]]
        for (const [x, z] of along) spot(x, z, 3.4, shopGlow[side], 0.42)
      }
    })
    const groundMat = worldMapped(lam('#FFFFFF', { map: groundTex, emissive: '#FFFFFF', emissiveMap: glowTex }))
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
    const stripeMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.02, 1), worldMapped(lam('#FFFFFF', { emissive: '#FFFFFF', emissiveMap: glowTex })), stripes.length)
    stripes.forEach(([x, z, w, d, c], k) => { m4.compose(v3.set(x, 0.011, z), q.identity(), s3.set(w, 1, d)); stripeMesh.setMatrixAt(k, m4); stripeMesh.setColorAt(k, col(c)) })
    stripeMesh.receiveShadow = true; scene.add(stripeMesh)

    // ---------------------------------------------------------------- Stadt bauen
    const boxGeo = new RoundedBoxGeometry(1, 1, 1, 1, 0.03)
    // Unten dunkler als oben: wirkt wie Licht, das am Boden verschluckt wird (gebackene Verdeckung)
    {
      const pos = boxGeo.attributes.position, cols = new Float32Array(pos.count * 3)
      for (let k = 0; k < pos.count; k++) { const y = pos.getY(k) + 0.5, f = 0.45 + 0.55 * Math.pow(y, 0.6); cols.set([f, f, f * 1.04], k * 3) }
      boxGeo.setAttribute('color', new THREE.BufferAttribute(cols, 3))
    }
    const houseMesh = new THREE.InstancedMesh(boxGeo, lam('#FFFFFF', { vertexColors: true }), houses.length)
    houses.forEach((hs, k) => { m4.compose(v3.set(hs.x, CURB + hs.h / 2, hs.z), q.identity(), s3.set(hs.w, hs.h, hs.d)); houseMesh.setMatrixAt(k, m4); houseMesh.setColorAt(k, col(hs.c)) })
    houseMesh.castShadow = houseMesh.receiveShadow = true; scene.add(houseMesh)
    const roofMesh = new THREE.InstancedMesh(new RoundedBoxGeometry(1, 1, 1, 1, 0.08), lam('#3B3470'), roofBits.length)
    roofBits.forEach(([x, y, z, w, h, d], k) => { m4.compose(v3.set(x, y + h / 2, z), q.identity(), s3.set(w, h, d)); roofMesh.setMatrixAt(k, m4) })
    roofMesh.castShadow = roofMesh.receiveShadow = true; scene.add(roofMesh)
    // Fenster: ein Instanz-Netz fuer alle. Etwa ein Drittel leuchtet warm, ein paar kuehl (Fernseher), der Rest ist dunkel.
    const winMesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.8, 1.05), new THREE.MeshBasicMaterial({ color: '#FFFFFF' }), windows.length)
    windows.forEach((wd, k) => {
      m4.compose(v3.set(wd.x, wd.y, wd.z), q.setFromEuler(eul.set(0, wd.ry, 0)), s3.set(1, 1, 1)); winMesh.setMatrixAt(k, m4)
      winMesh.setColorAt(k, wd.on < 0.34 ? col(C.winWarm[Math.floor(wd.on * 100) % 3]).multiplyScalar(1.1) : wd.on < 0.4 ? col(C.winCool).multiplyScalar(0.75) : col(C.winOff))
    })
    scene.add(winMesh)
    // Baeume: runde, facettierte Kronen (wie Spielzeug), vier Gruentoene ins Lila gezogen
    const treeMesh = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), lam('#FFFFFF', { flatShading: true }), trees.length)
    const trunkMesh = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.1, 0.14, 1, 6), lam(C.trunk), trees.length)
    trees.forEach(([x, z, s, c], k) => {
      m4.compose(v3.set(x, CURB + 0.8 * s, z), q.identity(), s3.set(s, 1.6 * s, s)); trunkMesh.setMatrixAt(k, m4)
      m4.compose(v3.set(x, CURB + 2.3 * s, z), q.identity(), s3.set(1.15 * s, 1.3 * s, 1.15 * s)); treeMesh.setMatrixAt(k, m4)
      treeMesh.setColorAt(k, col(C.tree[c]))
    })
    treeMesh.castShadow = trunkMesh.castShadow = true; treeMesh.receiveShadow = true; scene.add(treeMesh, trunkMesh)
    // Laternen: Mast, leuchtender Kopf, kleiner Schein (der Lichtkegel liegt in der Bodentextur)
    const poleMesh = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.07, 0.1, 4.4, 6), lam(C.pole), lamps.length)
    const headMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.26, 12, 8), new THREE.MeshBasicMaterial({ color: col(C.lamp).multiplyScalar(1.5) }), lamps.length)
    lamps.forEach(([x, z], k) => {
      m4.compose(v3.set(x, CURB + 2.2, z), q.identity(), s3.set(1, 1, 1)); poleMesh.setMatrixAt(k, m4)
      m4.compose(v3.set(x, CURB + 4.5, z), q.identity(), s3.set(1, 1, 1)); headMesh.setMatrixAt(k, m4)
      if (k < 5 || k >= lamps.length - plazaLamps.length) glow('#FFC98A', 2.6, new THREE.Vector3(x, CURB + 4.5, z), 0.55)
    })
    poleMesh.castShadow = true; scene.add(poleMesh, headMesh)
    // Baenke auf dem Platz und drei geparkte Autos: Kleinkram, an dem man die Groesse abliest
    const kit = new THREE.Group(); scene.add(kit)
    for (const [x, z, r] of [[-9.2, 8.6, 0], [-14.8, 9.6, 0], [-8.6, 12.6, Math.PI / 2]]) {
      const bench = new THREE.Mesh(new RoundedBoxGeometry(1.8, 0.16, 0.6, 1, 0.05), lam('#6B5A8E')); bench.position.set(x, CURB + 0.5, z); bench.rotation.y = r; kit.add(bench)
      const back = new THREE.Mesh(new RoundedBoxGeometry(1.8, 0.5, 0.12, 1, 0.05), lam('#6B5A8E')); back.position.set(x - (r ? 0.28 : 0), CURB + 0.8, z - (r ? 0 : 0.28)); back.rotation.y = r; kit.add(back)
    }
    const car = (x, z, ry, color) => {
      const c = new THREE.Group(); c.position.set(x, 0, z); c.rotation.y = ry; kit.add(c)
      const body = new THREE.Mesh(new RoundedBoxGeometry(1.8, 0.75, 3.9, 2, 0.28), std(color, { roughness: 0.45 })); body.position.y = 0.62; c.add(body)
      const cab = new THREE.Mesh(new RoundedBoxGeometry(1.55, 0.62, 2.0, 2, 0.24), std('#1C1640', { roughness: 0.25, metalness: 0.2 })); cab.position.set(0, 1.18, -0.15); c.add(cab)
      for (const [wx, wz] of [[-0.82, 1.25], [0.82, 1.25], [-0.82, -1.25], [0.82, -1.25]]) { const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.26, 12), lam('#0C0920')); wh.rotation.z = Math.PI / 2; wh.position.set(wx, 0.34, wz); c.add(wh) }
      const tl = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.12, 0.05), new THREE.MeshBasicMaterial({ color: '#FF4D6D' })); tl.position.set(0, 0.78, 1.96); c.add(tl)
    }
    car(-17, 1.15, Math.PI / 2, C.cars[0]); car(1.15, -15.5, 0, C.cars[1]); car(15.5, -1.15, Math.PI / 2, C.cars[2])
    {
      // Brunnen: Becken mit hellem Rand, leuchtendes Wasser (Lila), schmale Saeule mit Schale und Wasserstrahl.
      // In der ersten Probe (breite Schale auf dicker Saeule, dunkles Wasser) las er sich wie ein Pilz auf
      // einer Scheibe; der Strahl und das helle Wasser sagen "Brunnen".
      const [fx, fz] = FOUNT
      const rim = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.35, 0.55, 28), lam('#5A5490')); rim.position.set(fx, CURB + 0.27, fz); kit.add(rim)
      const lip = new THREE.Mesh(new THREE.TorusGeometry(2.06, 0.15, 6, 36), lam('#7A73B4')); lip.rotation.x = -Math.PI / 2; lip.position.set(fx, CURB + 0.55, fz); kit.add(lip)
      // Wasser knapp ueber dem Rand: der Deckel des Zylinders laege sonst darueber
      const water = new THREE.Mesh(new THREE.CylinderGeometry(1.92, 1.92, 0.04, 28), new THREE.MeshBasicMaterial({ color: '#7A6FDC' })); water.position.set(fx, CURB + 0.57, fz); kit.add(water)
      const col1 = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.22, 1.2, 10), lam('#6A64A0')); col1.position.set(fx, CURB + 1.15, fz); kit.add(col1)
      const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.3, 0.26, 18), lam('#6A64A0')); bowl.position.set(fx, CURB + 1.8, fz); kit.add(bowl)
      const bowlWater = new THREE.Mesh(new THREE.CylinderGeometry(0.54, 0.54, 0.03, 18), new THREE.MeshBasicMaterial({ color: '#A79EFF' })); bowlWater.position.set(fx, CURB + 1.94, fz); kit.add(bowlWater)
      const jet = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.09, 0.95, 8), new THREE.MeshBasicMaterial({ color: '#D9D3FF' })); jet.position.set(fx, CURB + 2.4, fz); kit.add(jet)
      glow('#B3AAFF', 3.2, new THREE.Vector3(fx, CURB + 2.3, fz), 0.3)
      glow('#9C92FF', 5, new THREE.Vector3(fx, CURB + 0.8, fz), 0.13)
    }
    kit.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true } })

    // ---------------------------------------------------------------- Laeden (die beiden Helden)
    const iconImage = async (name, color) => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`
      const img = new Image(); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); await img.decode(); return img
    }
    await document.fonts.load(`700 200px ${BRAND.display}`, p.shop + p.rival)
    const signs = []
    async function buildShop(side, { name, icon, accent, ours }) {
      const g = new THREE.Group(); g.position.copy(lots[side].pos); g.rotation.y = lots[side].rot; scene.add(g)
      const acc = col(accent), wallC = ours ? col(BRAND.brand).lerp(col('#2A2166'), 0.2) : col('#46325F')
      const put = (mesh, x, y, z, cast = true) => { mesh.position.set(x, y, z); mesh.castShadow = cast; mesh.receiveShadow = true; g.add(mesh); return mesh }
      const { w, d, h } = SHOP, flip = lots[side].flip
      // a = Abstand von der Ecke zur Kreuzung, entlang der Front -> x im Laden
      // open: Drehrichtung des Tuerblatts nach aussen (das Blatt reicht von der Angel weg von der Ecke)
      const ax = a => flip ? -w + a : -a, dx = ax(SHOP.door), open = flip ? -1 : 1
      // Haus: abgerundeter Block; Erdgeschoss ist der Laden, darueber zwei Etagen Wohnungen
      put(new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, 0.16), std(wallC)), -w / 2, h / 2, -d / 2)
      // Gesims oben, Band ueber dem Laden, Sockel: liest sich wie ein gebautes Haus, nicht wie eine Kiste
      put(new THREE.Mesh(new RoundedBoxGeometry(w + 0.3, 0.36, d + 0.3, 2, 0.12), std(wallC.clone().lerp(col('#FFFFFF'), 0.14))), -w / 2, h + 0.08, -d / 2)
      put(new THREE.Mesh(new RoundedBoxGeometry(w + 0.12, 0.24, 0.3, 2, 0.08), std(wallC.clone().lerp(col('#FFFFFF'), 0.1))), -w / 2, 4.85, 0.05, false)
      put(new THREE.Mesh(new RoundedBoxGeometry(w + 0.1, 0.42, d + 0.1, 2, 0.1), std(wallC.clone().multiplyScalar(0.62))), -w / 2, 0.21, -d / 2, false)
      // Wohnungsfenster, warm erleuchtet (nicht alle: bewohnt, aber nicht festlich)
      for (const [x, y, on] of [[ax(w - 1.1), 6.05, 1], [-w / 2, 6.05, 0], [ax(1.1), 6.05, 1], [ax(w - 1.1), 7.85, 0], [-w / 2, 7.85, 1], [ax(1.1), 7.85, 1]]) {
        put(new THREE.Mesh(new RoundedBoxGeometry(1.1, 1.25, 0.14, 2, 0.04), std('#191340')), x, y, 0.02, false)
        put(new THREE.Mesh(new THREE.PlaneGeometry(0.84, 0.98), new THREE.MeshBasicMaterial({ color: on ? col(C.winWarm[1]).multiplyScalar(1.15) : col(C.winOff) })), x, y, 0.1, false)
      }
      // Schaufenster: leuchtet von innen, mit Theke und Spiess als Schattenriss
      const winW = w - SHOP.door - 1.55, winX = ax(SHOP.door + 0.85 + winW / 2)
      put(new THREE.Mesh(new RoundedBoxGeometry(winW + 0.3, 2.2, 0.22, 2, 0.06), std('#140F33')), winX, 1.55, 0.02, false)
      const lightC = ours ? '#E9E2FF' : '#FFD7A0'
      const winTex = canvasTex(512, 256, (c2, cw, chh) => {
        const gr = c2.createLinearGradient(0, 0, 0, chh); gr.addColorStop(0, '#FFF7EA'); gr.addColorStop(1, ours ? '#CFC6FF' : '#FFB872')
        c2.fillStyle = gr; c2.fillRect(0, 0, cw, chh)
        c2.fillStyle = ours ? 'rgba(48,36,110,.55)' : 'rgba(90,40,30,.5)'
        c2.fillRect(0, chh * 0.72, cw, chh * 0.28)                                               // Theke
        c2.fillRect(cw * 0.62, chh * 0.44, cw * 0.16, chh * 0.28)                                // Kasse
        c2.fillStyle = 'rgba(255,255,255,.35)'; c2.beginPath(); c2.moveTo(cw * 0.5, 0); c2.lineTo(cw * 0.62, 0); c2.lineTo(cw * 0.42, chh); c2.lineTo(cw * 0.3, chh); c2.fill() // Spiegelung im Glas
      })
      const winMat = new THREE.MeshBasicMaterial({ map: winTex })
      put(new THREE.Mesh(new THREE.PlaneGeometry(winW, 1.9), winMat), winX, 1.55, 0.14, false)
      // Das Symbol des Ladens gross auf der Scheibe, in der Ladenfarbe (wie ein Aufkleber)
      const ico = await iconImage(icon, '#' + acc.clone().multiplyScalar(ours ? 0.75 : 0.85).getHexString())
      const icoTex = canvasTex(256, 256, (c2, cw) => { c2.drawImage(ico, 0, 0, cw, cw) }, { sharp: true })
      put(new THREE.Mesh(new THREE.PlaneGeometry(1.15, 1.15), new THREE.MeshBasicMaterial({ map: icoTex, transparent: true, toneMapped: false })), winX + (flip ? 0.55 : -0.55), 1.62, 0.16, false)
      // Tuer: Rahmen, dahinter das Licht des Ladens, davor das Tuerblatt (dreht auf, wenn jemand kommt)
      put(new THREE.Mesh(new RoundedBoxGeometry(1.42, 2.6, 0.22, 2, 0.06), std('#140F33')), dx, 1.3, 0.02, false)
      put(new THREE.Mesh(new THREE.PlaneGeometry(1.14, 2.36), new THREE.MeshBasicMaterial({ color: col(lightC).multiplyScalar(1.1) })), dx, 1.2, 0.135, false)
      // Angel an der Seite ZUR Ecke, das Blatt reicht von der Ecke weg und schwingt nach aussen auf, bis es quer
      // zur Front steht. Warum: der Stammkunde kommt immer von der Kreuzung, also von der Ecke her, und geht
      // ueber die Fahrbahn gerade auf die Tuer zu. In der ersten Probe sass die Angel auf der anderen Seite: das
      // Blatt schwang in seinen Weg, sein Arm steckte bei "enter" im Glas, und von der Kamera aus verdeckte das
      // offene Blatt genau den Moment, in dem er hineingeht. Jetzt steht es im Bild neben der Tuer, nicht davor.
      const hingeA = SHOP.door - 0.57
      const hinge = new THREE.Group(); hinge.position.set(ax(hingeA), 0, 0.17); g.add(hinge)
      const lx = flip ? 0.56 : -0.56
      const leaf = new THREE.Mesh(new RoundedBoxGeometry(1.12, 2.32, 0.08, 2, 0.03), std(wallC.clone().multiplyScalar(0.55))); leaf.position.set(lx, 1.2, 0); hinge.add(leaf)
      const pane = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 1.2), new THREE.MeshBasicMaterial({ color: col(lightC).multiplyScalar(0.92) })); pane.position.set(lx, 1.45, 0.05); hinge.add(pane)
      // Markise in Streifen, nur ueber dem Schaufenster (ueber der Tuer haengt die Glocke)
      // Markise: Ladenfarbe im Wechsel mit Lila (eigener Laden) oder Papier (gegenueber), wie auf einer Stempelkarte
      const awTex = canvasTex(512, 64, (c2, cw, chh) => { for (let i = 0; i < 8; i++) { c2.fillStyle = i % 2 ? (ours ? BRAND.lilac : BRAND.paper) : '#' + acc.getHexString(); c2.fillRect(i * cw / 8, 0, cw / 8 + 1, chh) } })
      const aw = put(new THREE.Mesh(new RoundedBoxGeometry(winW + 0.5, 0.12, 1.35, 2, 0.05), std('#FFFFFF', { map: awTex, roughness: 0.7 })), winX, 2.86, 0.62)
      aw.rotation.x = 0.36
      // Schild ueber dem Laden: Papierfarbe, Name in Tinte ueber die ganze Breite. Das Symbol steht nicht
      // auf dem Schild, sondern gross im Schaufenster: neben einem Symbolfeld blieb fuer "Imbiss Sonne" nur
      // eine Schrift, die auf dem Handy niemand las. Unbeleuchtetes Material (leuchtet von innen): nachts
      // ist das Schild das Hellste an der Front.
      const signW = w - 0.3, signH = 1.5, TW = 2048, TH = Math.round(TW * signH / signW)
      const signTex = canvasTex(TW, TH, (c2, cw, chh) => {
        c2.fillStyle = BRAND.paper; c2.beginPath(); c2.roundRect(0, 0, cw, chh, chh * 0.18); c2.fill()
        // Streifen in der Ladenfarbe unten: verbindet Schild und Markise
        c2.fillStyle = '#' + acc.getHexString(); c2.fillRect(chh * 0.18, chh * 0.86, cw - chh * 0.36, chh * 0.06)
        const room = cw - chh * 0.5
        let size = chh * 0.66
        c2.font = `700 ${size}px ${BRAND.display}`
        while (c2.measureText(name).width > room && size > chh * 0.25) { size *= 0.97; c2.font = `700 ${size}px ${BRAND.display}` }
        c2.fillStyle = BRAND.ink; c2.textBaseline = 'middle'; c2.textAlign = 'center'
        c2.fillText(name, cw / 2, chh * 0.47)
        // Groesse relativ zur Schildhoehe: unter 0,4 wird der Name auf dem Handy zu klein
        signs.push({ name, size: +(size / chh).toFixed(2), fits: c2.measureText(name).width <= room })
      }, { sharp: true })
      put(new THREE.Mesh(new RoundedBoxGeometry(signW + 0.18, signH + 0.18, 0.24, 2, 0.07), std('#1A1440')), -w / 2, 3.95, 0.12, false)
      const signMat = new THREE.MeshBasicMaterial({ map: signTex, toneMapped: false })
      put(new THREE.Mesh(new THREE.PlaneGeometry(signW, signH), signMat), -w / 2, 3.95, 0.25, false)
      // Schein um das Schild (wie ein Leuchtkasten): weiche Flaeche hinter dem Schild, additiv
      const halo = put(new THREE.Mesh(new THREE.PlaneGeometry(signW + 2.2, signH + 1.6), new THREE.MeshBasicMaterial({ map: blobTex, color: ours ? '#9F95FF' : '#FFB46A', transparent: true, opacity: 0.32, blending: THREE.AdditiveBlending, depthWrite: false })), -w / 2, 3.95, 0.2, false)
      halo.receiveShadow = false
      // Schornstein (beim Grill gegenueber steigt dort Rauch auf)
      put(new THREE.Mesh(new RoundedBoxGeometry(0.7, 1.3, 0.7, 2, 0.08), std(wallC.clone().multiplyScalar(0.8))), ax(w - 1.1), h + 0.75, -d + 1.2)
      // Licht vor dem Laden: eine echte Punktlichtquelle (faerbt Markise, Figur, Glocke)
      const pl = new THREE.PointLight(lightC, LIGHT, 8, 1.6); pl.position.set(-w / 2, 2.1, 1.7); g.add(pl)
      g.updateMatrixWorld(true)
      const world = (x, y, z) => g.localToWorld(new THREE.Vector3(x, y, z))
      const front = glow(ours ? '#B9B0FF' : '#FFB46A', 5.5, world(-w / 2, 1.6, 1.0), 0.28)
      // Weg durch diese Tuer: etwas von der Angel weg versetzt, damit Schulter und Arm am offenen Blatt
      // vorbeigehen (die Figur ist fast so breit wie die Tuer)
      const walkA = SHOP.door + 0.14
      return {
        g, hinge, leaf, open, light: pl, rot: lots[side].rot, name,
        // fuer das Schlussbild (Licht geht aus bzw. an)
        signMat, winMat, halo, front,
        // Ecken des Schildes in der Welt (fuer den Pruefkasten)
        signCorners: [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) => world(-w / 2 + sx * (signW + 0.18) / 2, 3.95 + sy * (signH + 0.18) / 2, 0.25)),
        hingeWorld: world(ax(hingeA), 0, 0.17),
        // Punkte vor der Tuer, gerade heraus: innen, Schwelle, auf der Fahrbahn (2,3 m vor der Front)
        at: out => world(ax(walkA), 0, out),
        // Herz ueber dem Dach, zur Ecke hin geschoben: weiter aussen flogen die Haelften beim Bruch bis
        // 19 px an den Bildrand (gemessen mit den Pruefkaesten, tools/test_3d.mjs)
        top: world(ax(0.7), h + 1.75, -0.5), chimney: world(ax(w - 1.1), h + 1.5, -d + 1.2), bellPos: world(ax(0.35), 2.95, 0.2)
      }
    }
    const S = {}
    S[oursSide] = await buildShop(oursSide, { name: p.shop, icon: p.icon, accent: p.accent, ours: true })
    S[rivalSide] = await buildShop(rivalSide, { name: p.rival, icon: p.rivalIcon, accent: p.rivalAccent, ours: false })
    const our = S[oursSide], riv = S[rivalSide]
    // Ein zu langer Name wird auf dem Schild so klein, dass ihn auf dem Handy niemand liest
    for (const s of signs) if (!s.fits || s.size < 0.42) ctx.warn(`der Name "${s.name}" steht auf dem Schild sehr klein. Namen kürzen (höchstens etwa 14 Zeichen).`)

    // ---------------------------------------------------------------- Herz ueber dem eigenen Laden
    let heart = null
    if (p.heart) {
      // Umriss wie im 2D-Baustein (shop-duel), Riss im Zickzack von der Kerbe zur Spitze
      const k = 1 / 100, X = x => (x - 125) * k, Y = y => (125 - y) * k
      const crack = [[125, 46], [108, 82], [136, 112], [112, 150], [130, 182], [125, 214]]
      const L = [[125, 214], [74, 176, 12, 132, 12, 72], [12, 38, 38, 12, 72, 12], [96, 12, 114, 26, 125, 46]]
      const Rr = [[125, 214], [176, 176, 238, 132, 238, 72], [238, 38, 212, 12, 178, 12], [154, 12, 136, 26, 125, 46]]
      const shape = (side, close) => {
        const sh = new THREE.Shape(); sh.moveTo(X(side[0][0]), Y(side[0][1]))
        for (const c of side.slice(1)) sh.bezierCurveTo(X(c[0]), Y(c[1]), X(c[2]), Y(c[3]), X(c[4]), Y(c[5]))
        close(sh); return sh
      }
      const ext = { depth: 0.36, bevelEnabled: true, bevelThickness: 0.16, bevelSize: 0.13, bevelSegments: 4, curveSegments: 20 }
      const geo = sh => { const ge = new THREE.ExtrudeGeometry(sh, ext); ge.translate(0, 0, -0.18); return ge }
      const crackDown = sh => { for (const [x, y] of crack.slice(1)) sh.lineTo(X(x), Y(y)) }
      // Das ganze Herz: linke Seite hinauf, rechte Seite (rueckwaerts) hinunter
      const whole = shape(L, sh => { sh.bezierCurveTo(X(136), Y(26), X(154), Y(12), X(178), Y(12)); sh.bezierCurveTo(X(212), Y(12), X(238), Y(38), X(238), Y(72)); sh.bezierCurveTo(X(238), Y(132), X(176), Y(176), X(125), Y(214)) })
      const hm = std(C.heart, { emissive: '#FF2E63', emissiveIntensity: 0.5, roughness: 0.35 })
      const grp = new THREE.Group(); grp.position.copy(our.top); scene.add(grp)
      const wholeM = new THREE.Mesh(geo(whole), hm); grp.add(wholeM)
      // Haelften drehen sich um ihre untere Ecke nach aussen weg und fallen
      const pivL = new THREE.Group(), pivR = new THREE.Group(); pivL.position.set(X(112), Y(214), 0); pivR.position.set(X(138), Y(214), 0)
      const hl = new THREE.Mesh(geo(shape(L, crackDown)), hm.clone()), hr = new THREE.Mesh(geo(shape(Rr, crackDown)), hm.clone())
      hl.position.set(-X(112), -Y(214), 0); hr.position.set(-X(138), -Y(214), 0)
      hl.material.transparent = hr.material.transparent = true
      pivL.add(hl); pivR.add(hr); grp.add(pivL, pivR)
      // Splitter: kleine Tetraeder, deren Flugbahn fest ausgewuerfelt ist
      const SR = rng(77), shards = []
      for (let i = 0; i < 8; i++) {
        const m = new THREE.Mesh(new THREE.TetrahedronGeometry(0.14 + SR() * 0.1), std(C.heart, { emissive: '#FF2E63', emissiveIntensity: 0.6, transparent: true }))
        m.userData = { v: new THREE.Vector3((SR() - 0.5) * 5, 1.5 + SR() * 3, (SR() - 0.5) * 2), spin: new THREE.Vector3(SR() * 9, SR() * 9, SR() * 9) }
        m.visible = false; grp.add(m); shards.push(m)
      }
      const halo = glow('#FF6B8B', 5, our.top, 0.3)
      heart = { grp, wholeM, pivL, pivR, hl, hr, shards, halo, tc: p.back ? null : ctx.at('crack') }
      if (heart.tc != null && p.tones) ctx.cue(heart.tc, 'thud', 0.7)
    }

    // ---------------------------------------------------------------- Ladenglocke ueber der Tuer, in die er geht
    const goal = p.back ? our : riv, origin = p.back ? riv : our
    const bell = new THREE.Group(); bell.position.copy(goal.bellPos); bell.rotation.y = goal.rot; scene.add(bell)
    const bellSwing = new THREE.Group(); bell.add(bellSwing)
    const rings = []
    {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.5), std('#2A2260')); arm.position.set(0, 0.04, -0.12); bell.add(arm)
      const prof = [[0, -0.4], [0.07, -0.39], [0.17, -0.33], [0.2, -0.12], [0.22, -0.04], [0.24, 0]].map(([x, y]) => new THREE.Vector2(x, y))
      const cup = new THREE.Mesh(new THREE.LatheGeometry(prof, 20), std(C.bell, { metalness: 0.55, roughness: 0.3, emissive: '#6A4600', emissiveIntensity: 0.45, side: THREE.DoubleSide }))
      cup.rotation.x = Math.PI; cup.position.y = -0.42; bellSwing.add(cup)
      const ball = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), std(C.bell, { metalness: 0.6, roughness: 0.3 })); ball.position.y = -0.46; bellSwing.add(ball)
      // Schallringe beim Klingeln
      for (let i = 0; i < 2; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.035, 6, 32), new THREE.MeshBasicMaterial({ color: '#FFE2A8', transparent: true, opacity: 0, depthWrite: false })); r.position.y = -0.22; r.visible = false; bell.add(r); rings.push(r) }
    }

    // ---------------------------------------------------------------- Rauch aus dem Schornstein gegenueber
    const puffs = []
    if (p.smoke) for (let i = 0; i < 5; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: blobTex, color: '#D9D3F2', transparent: true, opacity: 0, depthWrite: false }))
      s.position.copy(riv.chimney); scene.add(s); puffs.push({ s, i })
    }

    // ---------------------------------------------------------------- Der Stammkunde
    // Spielzeugfigur: Kapsel als Rumpf, Kugel als Kopf, Kappe als Haar, Beine und Arme als kleine Kapseln.
    // 1,3-fach so gross wie ein echter Mensch, sonst ist er aus dieser Hoehe nur ein Punkt.
    // Eine Figur bauen (auch fuer die zwei Leute am Brunnen). Weicher Fleck darunter statt Mondschatten,
    // denn der Schatten wird nur einmal geworfen (siehe oben).
    const person = ({ coat, legs = C.legs, hair = C.hair, skin = C.skin, scale = 1.3 }) => {
      const fig = new THREE.Group(); fig.scale.setScalar(scale); scene.add(fig)
      const body = new THREE.Group(); fig.add(body)
      const coatM = std(coat, { roughness: 0.6 }), legM = std(legs), skinM = std(skin, { roughness: 0.55 })
      const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.27, 0.42, 6, 14), coatM); torso.position.y = 1.12; body.add(torso)
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 18, 14), skinM); head.position.y = 1.72; body.add(head)
      const hairM = new THREE.Mesh(new THREE.SphereGeometry(0.235, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), std(hair, { roughness: 0.7 })); hairM.position.y = 1.74; hairM.rotation.x = -0.25; body.add(hairM)
      const limb = (r, len, m, x, y) => { const pv = new THREE.Group(); pv.position.set(x, y, 0); const l = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 4, 8), m); l.position.y = -len / 2 - r * 0.4; pv.add(l); return pv }
      const legL = limb(0.1, 0.5, legM, -0.12, 0.76), legR = limb(0.1, 0.5, legM, 0.12, 0.76)
      const armL = limb(0.075, 0.42, coatM, -0.33, 1.38), armR = limb(0.075, 0.42, coatM, 0.33, 1.38)
      fig.add(legL, legR); body.add(armL, armR)
      const blob = new THREE.Mesh(new THREE.PlaneGeometry(1.15 * scale, 1.15 * scale), new THREE.MeshBasicMaterial({ color: '#05030F', alphaMap: blobTex, transparent: true, opacity: 0.7, depthWrite: false }))
      blob.rotation.x = -Math.PI / 2; blob.renderOrder = 3; scene.add(blob)
      const at = (x, z, ry) => { fig.position.set(x, CURB, z); fig.rotation.y = ry; blob.position.set(x, CURB + 0.02, z) }
      return { fig, body, torso, head, legL, legR, armL, armR, blob, at }
    }
    // Zwei Leute am Brunnen, im Gespraech: die Stadt lebt, ohne dass sie vom Stammkunden ablenken
    const chat = [person({ coat: '#8C6BC8', scale: 1.2 }), person({ coat: '#C9786A', hair: '#5A3A2A', scale: 1.15 })]
    chat[0].at(FOUNT[0] + 1.4, FOUNT[1] - 2.9, -2.2); chat[1].at(FOUNT[0] + 0.1, FOUNT[1] - 3.2, 1.2)
    // Der Stammkunde: hell gekleidet (Papierfarbe), damit er auf dem dunklen Platz sofort zu sehen ist
    let walker = null
    if (p.walker) {
      const fig = person({ coat: C.coat, scale: 1.35 })
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
    // Langes Objektiv aus grosser Entfernung: Hauskanten bleiben fast senkrecht, das wirkt wie die
    // isometrischen Spielzeugstaedte der Vorbilder. Mit 30 Grad kippten die Haeuser am Rand nach aussen.
    // FRAME ist der vermessene Endausschnitt (tools/test_3d.mjs prueft ihn an den Grenzen von push und orbit):
    // beide Fronten mit Schild und das Herz bleiben mindestens 60 px vom Bildrand, und rechts endet das
    // Schild vor x = 940, also vor der Knopfspalte von TikTok und Reels (ab x = 950). dist: Abstand der Kamera
    // am Ende der Fahrt; dx: Bild um so viele Pixel nach links (weg von der Knopfspalte); dy: nach unten (oben
    // stehen die Woerter, das Herz soll mit Luft darunter bleiben).
    const FRAME = { dist: 100, dx: 46, dy: 108 }
    const camera = new THREE.PerspectiveCamera(22, W / H, 20, 600)
    camera.setViewOffset(W, H, FRAME.dx, -FRAME.dy, W, H)
    const target = new THREE.Vector3()
    const placeCamera = t => {
      const u = smooth((t - ctx.s) / Math.max(0.1, ctx.e - ctx.s))
      // Die Kamera faehrt von (1 + push) * dist auf dist heran, endet also immer im vermessenen Ausschnitt
      const dist = FRAME.dist * (1 + p.push * (1 - u)), az = THREE.MathUtils.degToRad(45 + p.orbit / 2 - p.orbit * u), el = THREE.MathUtils.degToRad(34 - 1.5 * u)
      // Ziel: die Mitte zwischen den beiden Fronten, quer zur Blickrichtung gemessen. Bei 45 Grad liegt sie auf
      // der Kreuzung; dreht die Kamera, wandert sie mit, sonst laeuft ein Laden zum Bildrand hinaus.
      const c = SHOP.w * (Math.sin(az) - Math.cos(az)) / 2
      target.set(c * Math.cos(az), 1.6, c * Math.sin(az))
      camera.position.set(target.x - dist * Math.cos(el) * Math.sin(az), target.y + dist * Math.sin(el), target.z + dist * Math.cos(el) * Math.cos(az))
      camera.lookAt(target)
      // Dunst beginnt hinter der Szene, so dass die Haeuser dahinter noch als Formen zu lesen sind
      scene.fog.near = dist + 24; scene.fog.far = dist + 118
      return az
    }

    // ---------------------------------------------------------------- Pruefkaesten (siehe Kopf der Datei)
    // Ein unsichtbarer Kasten je wichtigem Ding. Ist das Ding nicht zu sehen, verliert der Kasten data-safe,
    // dann zaehlt er fuer keine Pruefung. Schilder und Herz bilden eine data-apart-Gruppe: sie duerfen sich
    // im Bild nicht ueberdecken.
    const boxes = {}
    const mkBox = (key, label, apart) => { const e = ctx.el('div', 'is-box'); wrap.append(e); boxes[key] = { e, label, apart } }
    mkBox('ourSign', 'Schild ' + our.name, true); mkBox('rivSign', 'Schild ' + riv.name, true)
    if (p.heart) mkBox('heart', 'Herz', true)
    if (p.walker) mkBox('walker', 'Stammkunde', false)
    const pv = new THREE.Vector3(), bb = new THREE.Box3()
    const project = pts => {
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
      for (const q0 of pts) {
        pv.copy(q0).project(camera)
        const x = (pv.x + 1) / 2 * W, y = (1 - pv.y) / 2 * H
        x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y)
      }
      return [x0, y0, x1, y1]
    }
    const corners = box => { const a = box.min, b = box.max, out = []; for (const x of [a.x, b.x]) for (const y of [a.y, b.y]) for (const z of [a.z, b.z]) out.push(new THREE.Vector3(x, y, z)); return out }
    const meshBox = meshes => { bb.makeEmpty(); for (const m of meshes) bb.expandByObject(m); return bb.isEmpty() ? null : project(corners(bb)) }
    const setBox = (key, r) => {
      const b = boxes[key]; if (!b) return
      if (!r) { b.e.removeAttribute('data-safe'); b.e.removeAttribute('data-apart'); b.e.style.display = 'none'; return }
      b.e.dataset.safe = b.label
      if (b.apart) { b.e.dataset.apart = 'iso-street'; b.e.dataset.label = b.label }
      const [x0, y0, x1, y1] = r.map(v => Math.round(v * 10) / 10)
      b.e.style.cssText = `display:block;left:${x0}px;top:${y0}px;width:${Math.max(1, x1 - x0)}px;height:${Math.max(1, y1 - y0)}px`
    }

    // Tuerblatt: wie weit offen (0 bis 1) und wie weit die Figur von seiner Angel weg ist
    const SWING = Math.PI / 2 + 0.06 // etwas ueber quer: das Blatt neigt sich von der Tuer weg
    const fromHinge = (shop, pos) => Math.hypot(pos.x - shop.hingeWorld.x, pos.z - shop.hingeWorld.z)
    // Schlussbild: Licht des Ladens, den er verlassen hat, geht zurueck; der andere leuchtet auf
    const shine = (shop, k, flash = 0) => {
      shop.signMat.color.setScalar(1 - 0.42 * Math.max(0, -k))
      shop.winMat.color.setScalar(1 - 0.45 * Math.max(0, -k))
      shop.halo.material.opacity = 0.32 * (1 + (k < 0 ? 0.7 * k : 0.7 * k))
      shop.front.material.opacity = 0.28 * (1 + (k < 0 ? 0.7 * k : 0.6 * k))
      shop.light.intensity = LIGHT * (1 + (k < 0 ? 0.6 * k : 0.5 * k)) + 26 * flash
    }

    // ---------------------------------------------------------------- Zustand zum Zeitpunkt t (ohne Zeichnen)
    // Gezeichnet wird nur, solange die Szene zu sehen sein kann (mit Luft fuer Ein- und Ausblenden).
    // In der Ruhelage (?rest=1, fuer die Pruefungen) steht die Szene auf ihrem Anfang.
    const visibleFrom = ctx.sceneStart - 0.8, visibleTo = ctx.sceneEnd + 0.8
    const opening = (t, t0, t1) => smooth((t - t0) / 0.35) * (1 - smooth((t - t1) / 0.5))
    let shown = false
    function place(t0) {
      const t = ctx.rest ? ctx.s : t0
      shown = t >= visibleFrom && t <= visibleTo
      if (!shown) { for (const k of Object.keys(boxes)) setBox(k, null); return }
      // 2D-Kamerafahrt der Szene aufheben (siehe .is-wrap)
      const illScale = illEl ? parseFloat(getComputedStyle(illEl).scale) : 1
      wrap.style.scale = illScale > 0 ? String(1 / illScale) : ''
      const az = placeCamera(t)
      let heartMeshes = []
      if (heart) {
        const h = heart, tc = h.tc
        h.grp.rotation.y = -az // immer zur Kamera
        // Schweben und Pochen; kurz vor dem Bruch schneller (wie ein Herz unter Stress)
        const beat = x => Math.pow(Math.max(0, Math.sin(x)), 8)
        const stress = tc != null && t > tc - 0.75 && t < tc
        h.grp.position.copy(our.top).add(v3.set(0, 0.16 * Math.sin(t * 1.8), 0))
        const broken = tc != null && t >= tc
        h.wholeM.visible = !broken; h.pivL.visible = h.pivR.visible = broken
        h.shards.forEach(m => { m.visible = false })
        if (!broken) { h.grp.scale.setScalar(1 + (stress ? 0.1 * beat((t - tc) * 16) : 0.05 * beat(t * 5.5))); h.halo.material.opacity = 0.3; heartMeshes = [h.wholeM] }
        else {
          const k = t - tc, e = 1 - Math.pow(1 - clamp01(k / 0.55), 3), fall = Math.max(0, k - 0.22)
          h.grp.scale.setScalar(1 + 0.12 * Math.max(0, 1 - k / 0.15))
          h.pivL.rotation.z = 0.38 * e; h.pivR.rotation.z = -0.38 * e
          h.pivL.position.x = X0L - 0.3 * e; h.pivR.position.x = X0R + 0.3 * e
          h.pivL.position.y = h.pivR.position.y = Y0 - 2.4 * fall * fall
          const fade = 1 - clamp01((k - 0.45) / 0.6)
          h.hl.material.opacity = h.hr.material.opacity = fade; h.pivL.visible = h.pivR.visible = fade > 0.01
          h.halo.material.opacity = 0.3 * fade
          h.shards.forEach(m => { const d = m.userData; m.visible = k < 0.9; m.position.set(d.v.x * k, d.v.y * k - 6 * k * k, d.v.z * k); m.rotation.set(d.spin.x * k, d.spin.y * k, d.spin.z * k); m.material.opacity = 1 - clamp01(k / 0.9) })
          // Fuer die Pruefung zaehlen die Haelften, solange sie mindestens halb zu sehen sind (wie im DOM)
          if (fade >= 0.5) heartMeshes = [h.hl, h.hr]
        }
      }
      if (walker) {
        const w = walker, u = walkU(t), pos = w.path.getPointAt(clamp01(u)), tan = w.path.getTangentAt(Math.min(0.999, Math.max(0.001, u)))
        // Drinnen ist er nicht mehr zu sehen: ab der Schwelle steckt er in der Wand, also ausblenden. Drueben
        // schon 0,3 m hinter der Front: blieb er bis 0,6 m sichtbar, stach der vordere Fuss beim Schritt als
        // dunkler Tropfen unten aus dem Tuerlicht.
        const inside = u <= 0.6 / w.len || u >= HIDE_U
        w.fig.visible = w.blob.visible = !inside
        w.fig.position.set(pos.x, CURB, pos.z); w.fig.rotation.y = Math.atan2(tan.x, tan.z)
        // Schrittfolge aus der zurueckgelegten Strecke: so rutschen die Fuesse nicht, egal wie schnell er geht
        const ph = u * w.len / 1.1 * Math.PI, moving = t > w.tW && u < 1
        const sw = moving ? Math.sin(ph) * 0.55 : 0
        w.legL.rotation.x = sw; w.legR.rotation.x = -sw; w.armL.rotation.x = -sw * 0.8; w.armR.rotation.x = sw * 0.8
        w.body.position.y = moving ? Math.abs(Math.cos(ph)) * 0.05 : 0
        w.blob.position.set(pos.x, CURB + 0.02, pos.z)
        // Tueren. Eigene: geht auf, kurz bevor er herauskommt, und erst zu, wenn er 2 m von der Angel weg ist
        // (das Blatt ist 1,12 m lang, die Figur 0,55 m breit von der Mitte: so streift es ihn nie). Drueben:
        // geht auf, wenn er noch 3 m weg ist, und faellt zu, sobald er verschwunden ist.
        const oOpen = p.from < 0.05 ? smooth((t - (w.tW - 0.4)) / 0.35) * (1 - smooth((fromHinge(origin, pos) - 2.0) / 0.6)) : 0
        const gOpen = (1 - smooth((fromHinge(goal, pos) - 2.6) / 0.6)) * (1 - smooth((t - w.tHide - 0.05) / 0.5))
        origin.hinge.rotation.y = origin.open * SWING * oOpen
        goal.hinge.rotation.y = goal.open * SWING * gOpen
        // Ladenglocke: gedaempfte Schwingung ab "enter", dazu zwei Schallringe
        const k = t - w.tE
        bellSwing.rotation.x = k > 0 ? 0.6 * Math.exp(-k * 3) * Math.sin(k * 19) : 0
        rings.forEach((r, i) => { const kk = k - i * 0.16, on = kk > 0 && kk < 0.6; r.visible = on; if (on) { r.scale.setScalar(0.6 + kk * 2.2); r.material.opacity = 0.75 * (1 - kk / 0.6) } })
        // Licht in der Tuer drueben leuchtet auf, wenn er hineingeht; danach (Schlussbild, "after") wird
        // der verlassene Laden dunkler und der andere bleibt heller. Vorher stand das Bild nach "enter" still.
        const fin = p.after ? smooth((t - w.tE - 0.3) / 1.5) : 0
        shine(origin, -fin); shine(goal, fin, opening(t, w.tE - 0.25, w.tE + 0.35))
      }
      // Die zwei am Brunnen wiegen sich leicht und gestikulieren abwechselnd
      chat.forEach((c, i) => { const ph = t * 2.2 + i * 2; c.body.rotation.z = 0.04 * Math.sin(ph); c.armR.rotation.x = -0.5 * Math.max(0, Math.sin(ph * 0.9 + i * 3)); c.armR.rotation.z = 0.2 * Math.max(0, Math.sin(ph * 0.9 + i * 3)) })
      for (const pf of puffs) {
        const ph = ((t * 0.42 + pf.i / puffs.length) % 1 + 1) % 1
        pf.s.position.copy(riv.chimney).add(v3.set(Math.sin(pf.i * 2.1 + t * 0.8) * 0.35, ph * 4.2, 0))
        const sz = 0.9 + ph * 2.4; pf.s.scale.set(sz, sz, 1)
        pf.s.material.opacity = 0.4 * Math.sin(ph * Math.PI)
      }
      // Pruefkaesten: wo die Kamera Schilder, Herz und Figur in diesem Bild hinwirft
      scene.updateMatrixWorld(); camera.updateMatrixWorld()
      setBox('ourSign', project(our.signCorners)); setBox('rivSign', project(riv.signCorners))
      setBox('heart', heartMeshes.length ? meshBox(heartMeshes) : null)
      setBox('walker', walker && walker.fig.visible ? meshBox([walker.fig]) : null)
    }
    // Ruhelage der Herzhaelften (fuer das Auseinanderfallen)
    const X0L = heart ? heart.pivL.position.x : 0, X0R = heart ? heart.pivR.position.x : 0, Y0 = heart ? heart.pivL.position.y : 0
    ctx.place(place)
    ctx.frame(() => { if (shown) renderer.render(scene, camera) })

    // Nur fuer tools/test_3d.mjs. doorGap: kleinster Abstand zwischen Stammkunde und den Tuerblaettern in diesem
    // Bild (in Metern; negativ = er steckt im Blatt), so prueft der Test die Tuer in 0,05-s-Schritten ohne
    // Bilder. drawnBox: rechnet das Bild einmal mit und einmal ohne Figur bzw. Herz und gibt zurueck, wo sich
    // Pixel aendern; der Test vergleicht das mit dem Pruefkasten (liegt der Kasten wirklich auf dem Ding?).
    canvas.isoDebug = {
      drawnBox(what) {
        const obj = what === 'walker' ? walker && walker.fig : what === 'heart' ? heart && heart.grp : null
        if (!obj || !obj.visible) return null
        const gl = renderer.getContext(), cw = canvas.width, chh = canvas.height
        const grab = () => { renderer.render(scene, camera); const px = new Uint8Array(cw * chh * 4); gl.readPixels(0, 0, cw, chh, gl.RGBA, gl.UNSIGNED_BYTE, px); return px }
        const with1 = grab(); obj.visible = false; const without = grab(); obj.visible = true; renderer.render(scene, camera)
        let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity, n = 0
        for (let row = 0; row < chh; row++) for (let x = 0; x < cw; x++) {
          const i = (row * cw + x) * 4
          if (Math.abs(with1[i] - without[i]) + Math.abs(with1[i + 1] - without[i + 1]) + Math.abs(with1[i + 2] - without[i + 2]) < 30) continue
          const y = chh - 1 - row // readPixels liest von unten nach oben
          n++; x0 = Math.min(x0, x); x1 = Math.max(x1, x + 1); y0 = Math.min(y0, y); y1 = Math.max(y1, y + 1)
        }
        return n ? { left: x0 / SS, top: y0 / SS, right: x1 / SS, bottom: y1 / SS, pixels: n } : null
      },
      doorGap() {
        if (!walker || !walker.fig.visible) return null
        scene.updateMatrixWorld()
        const w = walker, s = w.fig.scale.x
        // Kapseln der Figur: Mesh, Radius, Laenge der Achse (wie in person() gebaut)
        const parts = [[w.torso, 0.27, 0.42], [w.armL.children[0], 0.075, 0.42], [w.armR.children[0], 0.075, 0.42], [w.legL.children[0], 0.1, 0.5], [w.legR.children[0], 0.1, 0.5], [w.head, 0.22, 0]]
        let best = Infinity
        const inv = new THREE.Matrix4(), q1 = new THREE.Vector3()
        for (const shop of [our, riv]) {
          if (Math.abs(shop.hinge.rotation.y) < 1e-3) continue // zu: dann liegt es in der Front, nicht im Weg
          inv.copy(shop.leaf.matrixWorld).invert()
          for (const [mesh, r, l] of parts) for (let i = 0; i <= 8; i++) {
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
