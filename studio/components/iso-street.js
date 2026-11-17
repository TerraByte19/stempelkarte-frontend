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
import { BRAND } from '../engine/brand.js'
import { ICONS } from '../engine/icons.js'

const W = 1080, H = 1920
const SS = 1 // Bildpunkte je Buehnenpunkt; 2 waere glatter, kostet aber das Dreifache

// Stadtplan in Metern. Strassen liegen im Raster P, die Kreuzung im Ursprung.
const RH = 2.1          // halbe Fahrbahn
const B = RH + 1.4      // Hauskante, von der Strassenmitte aus (Fahrbahn + Gehweg)
const P = 24            // Abstand der Strassen
const CURB = 0.15       // Hoehe der Gehwege
const SHOP = { w: 6, d: 6, h: 9, door: 1.3 }   // Laden: Breite der Front, Tiefe, Hoehe, Tuermitte ab Ecke
// Bodentextur: deckt x und z von GO bis GO + GS ab (weiter hinten liegt Dunst)
const GO = -72, GS = 144, GN = 4096

// Farben. Die Stadt bleibt bewusst grau-lila und dunkel: nur die beiden Laeden duerfen leuchten,
// sonst sucht das Auge auf dem Handy, worum es geht.
const C = {
  fog: BRAND.night, road: '#1A1442', walk: '#2E2768', curb: '#4A41A0', mark: '#5A51B8', zebra: '#9B93E0',
  city: ['#2C2656', '#322B5E', '#28224F', '#362F66', '#2E2859'],
  winWarm: ['#FFD58A', '#FFC56E', '#FFB55A'], winCool: '#B9B0FF', winOff: '#1C1640',
  tree: ['#3E5C8C', '#456696', '#3A527E', '#4F5FA0'], trunk: '#2A1F45', lamp: '#FFD9A0', pole: '#221B4A',
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
  use: 'Isometrische Nachtszene in 3D: der eigene Laden und der Laden gegenüber an einer Kreuzung, beide Fronten zueinander. Über dem eigenen Laden zerbricht ein Herz, der Stammkunde geht über die Kreuzung und verschwindet gegenüber durch die Tür, die Ladenglocke schwingt. Die Kamera fährt langsam heran und dreht sich ein paar Grad. Für "Dein Stammkunde ... gegenüber", wenn es nach den großen Mitbewerbern aussehen soll. Rechnet etwa eine Sekunde je Bild, also deutlich länger als die 2D-Bausteine.',
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
    push: { default: 0.16, doc: 'Wie weit die Kamera während der Szene heranfährt (0 = steht, 0,16 = 16 % näher, höchstens 0,4)' },
    orbit: { default: 7, doc: 'Um wie viele Grad sich die Kamera während der Szene dreht (0 bis 12)' },
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
    captions: [{ lines: ['Dein Stammkunde', 'hat dich betrogen.'], accent: 2 }],
    at: { cap: 0, word: -1, offset: 0.25 }
  },
  css: `
  .is-canvas { position: absolute; left: 0; top: 0; width: ${W}px; height: ${H}px; }
  /* Oben laufen die Textzeilen: die Stadt dort im Dunst ausblenden, damit die Woerter auf ruhigem Grund stehen */
  .is-calm { position: absolute; left: 0; right: 0; top: 0; height: 760px; pointer-events: none;
    background: linear-gradient(180deg, ${BRAND.night} 0%, rgba(14,10,36,.94) 20%, rgba(14,10,36,.7) 40%, rgba(14,10,36,.25) 68%, rgba(14,10,36,0) 100%); }
  /* Ecken leicht abdunkeln: haelt den Blick in der Mitte, wie bei einer Linse */
  .is-vig { position: absolute; inset: 0; pointer-events: none; background: radial-gradient(ellipse 80% 62% at 50% 56%, rgba(14,10,36,0) 60%, rgba(14,10,36,.55) 100%); }
  `,
  async build(ctx) {
    const { p } = ctx
    if (!['left', 'right'].includes(p.ours)) ctx.fail('"ours" muss "left" oder "right" sein')
    if (!ICONS[p.rivalIcon]) ctx.fail(`Symbol "${p.rivalIcon}" gibt es nicht. Erlaubt: ${Object.keys(ICONS).join(', ')}`)
    if (typeof p.from !== 'number' || p.from < 0 || p.from > 0.9) ctx.fail('"from" muss zwischen 0 und 0,9 liegen')
    if (!(p.push >= 0 && p.push <= 0.4)) ctx.fail('"push" muss zwischen 0 und 0,4 liegen (weiter heran zeigt nur noch eine Wand)')
    if (!(p.orbit >= 0 && p.orbit <= 12)) ctx.fail('"orbit" muss zwischen 0 und 12 Grad liegen (mehr zeigt den Rand der Stadt)')

    // three.js erst hier laden: so bleibt der Baustein in Node (Katalog, Selbsttest) ohne die 700 KB importierbar
    const THREE = await import('../engine/vendor/three.module.min.js')
    const { RoundedBoxGeometry } = await import('../engine/vendor/RoundedBoxGeometry.js')

    const canvas = ctx.el('canvas', 'is-canvas'); canvas.width = W * SS; canvas.height = H * SS
    ctx.root.append(canvas, ctx.el('div', 'is-vig'), ctx.el('div', 'is-calm'))
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
    scene.fog = new THREE.Fog(C.fog, 66, 140)

    // ---------------------------------------------------------------- Hilfen
    const col = c => new THREE.Color(c)
    const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0, ...o })
    const lam = (color, o = {}) => new THREE.MeshLambertMaterial({ color, ...o })
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v3 = new THREE.Vector3(), s3 = new THREE.Vector3(), eul = new THREE.Euler()
    const canvasTex = (w, h, draw, { srgb = true } = {}) => {
      const c = document.createElement('canvas'); c.width = w; c.height = h
      draw(c.getContext('2d'), w, h)
      const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace
      t.anisotropy = aniso; t.minFilter = THREE.LinearMipmapLinearFilter
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
    scene.add(new THREE.HemisphereLight('#7468E6', '#150F38', 1.25))
    const moon = new THREE.DirectionalLight('#D2CBFF', 2.4)
    moon.position.set(30, 46, -40); moon.target.position.set(0, 0, 0)
    moon.castShadow = true
    moon.shadow.mapSize.set(2048, 2048)
    Object.assign(moon.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40, near: 10, far: 150 })
    moon.shadow.bias = -0.0005; moon.shadow.normalBias = 0.04; moon.shadow.radius = 2.5
    scene.add(moon, moon.target)
    // Aufhellung von der Kamera her, schwach und ohne Schatten: sonst saufen die Fronten ganz ab
    const fill = new THREE.DirectionalLight('#9189FF', 0.6); fill.position.set(-30, 25, 30); scene.add(fill)

    // ---------------------------------------------------------------- Laeden: Lage
    // Links: Block nordwestlich der Kreuzung, Front nach Sueden (+z). Rechts: Block suedoestlich, Front nach
    // Westen (-x). Ein Laden wird im eigenen Koordinatensystem gebaut (Front zeigt nach +z, Ecke zur Kreuzung
    // bei x = 0, der Laden reicht nach -x und -z) und dann an seinen Platz gedreht.
    const lots = { left: { pos: new THREE.Vector3(-B, CURB, -B), rot: 0 }, right: { pos: new THREE.Vector3(B, CURB, B), rot: -Math.PI / 2 } }
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
    const plaza = [[-6.2, 6.6], [-9.6, 6.2], [-13.6, 6.8], [-17.4, 6.3], [-6.4, 10.4], [-6.8, 14.6], [-7.2, 18.6], [-11.6, 11.4], [-15.2, 13.2], [-11, 16.8], [-18.4, 17.6], [-15, 19.4]]
    plaza.forEach(([x, z], k) => trees.push([x, z, 0.62 + ((k * 37) % 10) / 40, k % 4]))
    const lamps = [[-B + 0.45, B - 0.45], [B - 0.45, -B + 0.45], [-B + 0.45, -B - 12], [-B - 12.5, B - 0.45], [B + 12, -B + 0.45], [B - 0.45, B + 12.5], [-B + 0.45, -B - 34], [-B - 34, -B + 0.45], [B + 34, B - 0.45], [-B - 24, B - 0.45], [B - 0.45, B + 34], [B + 24, -B + 0.45]]

    // ---------------------------------------------------------------- Boden malen
    // Grundfarben, Bordsteinkanten und Kontaktschatten in die Farbtextur, Lichtkegel in die Leuchttextur.
    const shopGlow = { [oursSide]: '185,176,255', [rivalSide]: '255,180,106' }
    const groundTex = canvasTex(GN, GN, g => {
      g.fillStyle = C.road; g.fillRect(0, 0, GN, GN)
      for (const b of blocks) {
        g.fillStyle = C.walk; g.beginPath(); g.roundRect(gx(b.x0), gx(b.z0), gx(b.x1) - gx(b.x0), gx(b.z1) - gx(b.z0), 0.9 * GN / GS); g.fill()
        g.strokeStyle = C.curb; g.lineWidth = 0.2 * GN / GS; g.beginPath(); g.roundRect(gx(b.x0 + 0.12), gx(b.z0 + 0.12), gx(b.x1) - gx(b.x0) - 0.24 * GN / GS, gx(b.z1) - gx(b.z0) - 0.24 * GN / GS, 0.8 * GN / GS); g.stroke()
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
      // Licht aus Schaufenster und Tuer faellt vor dem Laden auf den Gehweg
      for (const side of ['left', 'right']) {
        const along = side === 'left' ? [[-B - 1.3, -B + 1.2], [-B - 3.8, -B + 1.3]] : [[B - 1.2, B + 1.3], [B - 1.3, B + 3.8]]
        for (const [x, z] of along) spot(x, z, 3.4, shopGlow[side], 0.42)
      }
    })
    const groundMat = worldMapped(lam('#FFFFFF', { map: groundTex, emissive: '#FFFFFF', emissiveMap: glowTex }))
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(GS * 3, GS * 3), groundMat); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground)
    // Gehwege als flache Platten mit abgeschraegter Kante: die Kante faengt Licht wie ein Bordstein
    const slabs = new THREE.InstancedMesh(new RoundedBoxGeometry(1, 1, 1, 1, 0.06), groundMat, blocks.length)
    blocks.forEach((b, k) => { m4.compose(v3.set((b.x0 + b.x1) / 2, CURB / 2, (b.z0 + b.z1) / 2), q.identity(), s3.set(b.x1 - b.x0, CURB, b.z1 - b.z0)); slabs.setMatrixAt(k, m4) })
    slabs.receiveShadow = true; scene.add(slabs)
    // Mittelstreifen und Zebrastreifen als echte Koerper (gemalt waeren sie unscharf); sie lesen dieselbe
    // Leuchttextur, sonst laegen sie im Lichtkegel einer Laterne als dunkle Striche
    const stripes = []
    for (let k = -N; k <= N; k++) for (let s = -N * P; s < N * P; s += 3) {
      const m = ((s % P) + P) % P
      if (m < RH + 1.6 || m > P - RH - 1.6) continue // nicht in Kreuzungen
      stripes.push([k * P, s + 0.8, 0.14, 1.5, C.mark], [s + 0.8, k * P, 1.5, 0.14, C.mark])
    }
    for (let k = 0; k < 5; k++) {
      const o = -RH + 0.45 + k * 0.82
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
      if (k < 6) glow('#FFC98A', 2.6, new THREE.Vector3(x, CURB + 4.5, z), 0.55)
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
      const { w, d, h } = SHOP, dx = -SHOP.door
      // Haus: abgerundeter Block; Erdgeschoss ist der Laden, darueber zwei Etagen Wohnungen
      put(new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, 0.16), std(wallC)), -w / 2, h / 2, -d / 2)
      // Gesims oben, Band ueber dem Laden, Sockel: liest sich wie ein gebautes Haus, nicht wie eine Kiste
      put(new THREE.Mesh(new RoundedBoxGeometry(w + 0.3, 0.36, d + 0.3, 2, 0.12), std(wallC.clone().lerp(col('#FFFFFF'), 0.14))), -w / 2, h + 0.08, -d / 2)
      put(new THREE.Mesh(new RoundedBoxGeometry(w + 0.12, 0.24, 0.3, 2, 0.08), std(wallC.clone().lerp(col('#FFFFFF'), 0.1))), -w / 2, 4.85, 0.05, false)
      put(new THREE.Mesh(new RoundedBoxGeometry(w + 0.1, 0.42, d + 0.1, 2, 0.1), std(wallC.clone().multiplyScalar(0.62))), -w / 2, 0.21, -d / 2, false)
      // Wohnungsfenster, warm erleuchtet (nicht alle: bewohnt, aber nicht festlich)
      for (const [x, y, on] of [[-w + 1.1, 6.05, 1], [-w / 2, 6.05, 0], [-1.1, 6.05, 1], [-w + 1.1, 7.85, 0], [-w / 2, 7.85, 1], [-1.1, 7.85, 1]]) {
        put(new THREE.Mesh(new RoundedBoxGeometry(1.1, 1.25, 0.14, 2, 0.04), std('#191340')), x, y, 0.02, false)
        put(new THREE.Mesh(new THREE.PlaneGeometry(0.84, 0.98), new THREE.MeshBasicMaterial({ color: on ? col(C.winWarm[1]).multiplyScalar(1.15) : col(C.winOff) })), x, y, 0.1, false)
      }
      // Schaufenster: leuchtet von innen, mit Theke und Spiess als Schattenriss
      const winW = w - SHOP.door - 1.55, winX = dx - 0.85 - winW / 2
      put(new THREE.Mesh(new RoundedBoxGeometry(winW + 0.3, 2.2, 0.22, 2, 0.06), std('#140F33')), winX, 1.55, 0.02, false)
      const lightC = ours ? '#E9E2FF' : '#FFD7A0'
      const winTex = canvasTex(512, 256, (c2, cw, chh) => {
        const gr = c2.createLinearGradient(0, 0, 0, chh); gr.addColorStop(0, '#FFF7EA'); gr.addColorStop(1, ours ? '#CFC6FF' : '#FFB872')
        c2.fillStyle = gr; c2.fillRect(0, 0, cw, chh)
        c2.fillStyle = ours ? 'rgba(48,36,110,.55)' : 'rgba(90,40,30,.5)'
        c2.fillRect(0, chh * 0.72, cw, chh * 0.28)                                               // Theke
        c2.beginPath(); c2.moveTo(cw * 0.2, chh * 0.16); c2.lineTo(cw * 0.33, chh * 0.16); c2.lineTo(cw * 0.3, chh * 0.68); c2.lineTo(cw * 0.23, chh * 0.68); c2.closePath(); c2.fill() // Spiess
        c2.fillRect(cw * 0.62, chh * 0.44, cw * 0.16, chh * 0.28)                                // Kasse
        c2.fillStyle = 'rgba(255,255,255,.35)'; c2.beginPath(); c2.moveTo(cw * 0.5, 0); c2.lineTo(cw * 0.62, 0); c2.lineTo(cw * 0.42, chh); c2.lineTo(cw * 0.3, chh); c2.fill() // Spiegelung im Glas
      })
      put(new THREE.Mesh(new THREE.PlaneGeometry(winW, 1.9), new THREE.MeshBasicMaterial({ map: winTex })), winX, 1.55, 0.14, false)
      // Tuer: Rahmen, dahinter das Licht des Ladens, davor das Tuerblatt (dreht auf, wenn jemand kommt)
      put(new THREE.Mesh(new RoundedBoxGeometry(1.42, 2.6, 0.22, 2, 0.06), std('#140F33')), dx, 1.3, 0.02, false)
      put(new THREE.Mesh(new THREE.PlaneGeometry(1.14, 2.36), new THREE.MeshBasicMaterial({ color: col(lightC).multiplyScalar(1.1) })), dx, 1.2, 0.135, false)
      const hinge = new THREE.Group(); hinge.position.set(dx - 0.57, 0, 0.17); g.add(hinge)
      const leaf = new THREE.Mesh(new RoundedBoxGeometry(1.12, 2.32, 0.08, 2, 0.03), std(wallC.clone().multiplyScalar(0.55))); leaf.position.set(0.56, 1.2, 0); hinge.add(leaf)
      const pane = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 1.2), new THREE.MeshBasicMaterial({ color: col(lightC).multiplyScalar(0.92) })); pane.position.set(0.56, 1.45, 0.05); hinge.add(pane)
      // Markise in Streifen, nur ueber dem Schaufenster (ueber der Tuer haengt die Glocke)
      const awTex = canvasTex(512, 64, (c2, cw, chh) => { for (let i = 0; i < 8; i++) { c2.fillStyle = '#' + (i % 2 ? acc.clone().multiplyScalar(0.6) : acc).getHexString(); c2.fillRect(i * cw / 8, 0, cw / 8 + 1, chh) } })
      const aw = put(new THREE.Mesh(new RoundedBoxGeometry(winW + 0.5, 0.12, 1.35, 2, 0.05), std('#FFFFFF', { map: awTex, roughness: 0.7 })), winX, 2.86, 0.62)
      aw.rotation.x = 0.36
      // Schild ueber dem Laden: Papierfarbe, Symbolfeld in der Ladenfarbe, Name in Tinte. Unbeleuchtetes
      // Material (leuchtet von innen): nachts ist das Schild das Hellste an der Front und bleibt lesbar.
      const ico = await iconImage(icon, '#FFFFFF')
      const signW = w - 0.4, signH = 1.4, TW = 2048, TH = Math.round(TW * signH / signW)
      const signTex = canvasTex(TW, TH, (c2, cw, chh) => {
        c2.fillStyle = BRAND.paper; c2.beginPath(); c2.roundRect(0, 0, cw, chh, chh * 0.18); c2.fill()
        const pad = chh * 0.13, tile = chh - 2 * pad
        c2.fillStyle = '#' + acc.getHexString(); c2.beginPath(); c2.roundRect(pad, pad, tile, tile, tile * 0.22); c2.fill()
        c2.drawImage(ico, pad + tile * 0.13, pad + tile * 0.13, tile * 0.74, tile * 0.74)
        // Name so gross wie moeglich, in der Breite neben dem Symbolfeld
        const room = cw - tile - pad * 3.4
        let size = chh * 0.62
        c2.font = `700 ${size}px ${BRAND.display}`
        while (c2.measureText(name).width > room && size > chh * 0.3) { size *= 0.97; c2.font = `700 ${size}px ${BRAND.display}` }
        c2.fillStyle = BRAND.ink; c2.textBaseline = 'middle'; c2.textAlign = 'center'
        c2.fillText(name, pad * 2 + tile + room / 2, chh * 0.54)
        // Groesse relativ zur Schildhoehe: unter 0,4 wird der Name auf dem Handy zu klein
        signs.push({ name, size: +(size / chh).toFixed(2), fits: c2.measureText(name).width <= room })
      })
      put(new THREE.Mesh(new RoundedBoxGeometry(signW + 0.18, signH + 0.18, 0.24, 2, 0.07), std('#1A1440')), -w / 2, 3.95, 0.12, false)
      put(new THREE.Mesh(new THREE.PlaneGeometry(signW, signH), new THREE.MeshBasicMaterial({ map: signTex, toneMapped: false })), -w / 2, 3.95, 0.25, false)
      // Schornstein (beim Grill gegenueber steigt dort Rauch auf)
      put(new THREE.Mesh(new RoundedBoxGeometry(0.7, 1.3, 0.7, 2, 0.08), std(wallC.clone().multiplyScalar(0.8))), -w + 1.1, h + 0.75, -d + 1.2)
      // Licht vor dem Laden: eine echte Punktlichtquelle (faerbt Markise, Figur, Glocke)
      const pl = new THREE.PointLight(lightC, 18, 8, 1.6); pl.position.set(-w / 2, 2.1, 1.7); g.add(pl)
      g.updateMatrixWorld(true)
      const world = (x, y, z) => g.localToWorld(new THREE.Vector3(x, y, z))
      glow(ours ? '#B9B0FF' : '#FFB46A', 5.5, world(-w / 2, 1.6, 1.0), 0.28)
      return {
        g, hinge, light: pl, rot: lots[side].rot,
        inWorld: world(dx, 0, -0.9), outWorld: world(dx, 0, 1.15),
        top: world(-w / 2 + 0.5, h + 2.5, -1.2), chimney: world(-w + 1.1, h + 1.5, -d + 1.2), bellPos: world(dx + 0.95, 2.95, 0.2)
      }
    }
    const S = {}
    S[oursSide] = await buildShop(oursSide, { name: p.shop, icon: p.icon, accent: p.accent, ours: true })
    S[rivalSide] = await buildShop(rivalSide, { name: p.rival, icon: p.rivalIcon, accent: p.rivalAccent, ours: false })
    const our = S[oursSide], riv = S[rivalSide]
    // Ein zu langer Name wird auf dem Schild so klein, dass ihn auf dem Handy niemand liest
    for (const s of signs) if (!s.fits || s.size < 0.4) ctx.warn(`der Name "${s.name}" steht auf dem Schild sehr klein. Namen kürzen (höchstens etwa 14 Zeichen).`)

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
    let walker = null
    if (p.walker) {
      const fig = new THREE.Group(); fig.scale.setScalar(1.3); scene.add(fig)
      const body = new THREE.Group(); fig.add(body)
      const coat = std(C.coat, { roughness: 0.6 }), legM = std(C.legs), skin = std(C.skin, { roughness: 0.55 })
      const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.27, 0.42, 6, 14), coat); torso.position.y = 1.12; body.add(torso)
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 18, 14), skin); head.position.y = 1.72; body.add(head)
      const hair = new THREE.Mesh(new THREE.SphereGeometry(0.235, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), std(C.hair, { roughness: 0.7 })); hair.position.y = 1.74; hair.rotation.x = -0.25; body.add(hair)
      const limb = (r, len, m, x, y) => { const pv = new THREE.Group(); pv.position.set(x, y, 0); const l = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 4, 8), m); l.position.y = -len / 2 - r * 0.4; pv.add(l); return pv }
      const legL = limb(0.1, 0.5, legM, -0.12, 0.76), legR = limb(0.1, 0.5, legM, 0.12, 0.76)
      const armL = limb(0.075, 0.42, coat, -0.33, 1.38), armR = limb(0.075, 0.42, coat, 0.33, 1.38)
      fig.add(legL, legR); body.add(armL, armR)
      // Weicher Fleck unter der Figur statt Mondschatten (der wird nur einmal geworfen, siehe oben)
      const blob = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5), new THREE.MeshBasicMaterial({ color: '#05030F', alphaMap: blobTex, transparent: true, opacity: 0.7, depthWrite: false }))
      blob.rotation.x = -Math.PI / 2; blob.renderOrder = 3; scene.add(blob)
      // Weg: aus der Tuer auf den Gehweg, quer ueber die Kreuzung, auf den Gehweg drueben, durch die Tuer
      const a = origin.inWorld, a1 = origin.outWorld, b1 = goal.outWorld, b = goal.inWorld
      const path = new THREE.CatmullRomCurve3([a, a1, a1.clone().lerp(b1, 0.33), a1.clone().lerp(b1, 0.66), b1, b], false, 'centripetal')
      const len = path.getLength()
      const tW = ctx.at('walk'), tE = ctx.at('enter'), tC = ctx.at('cross')
      if (!(tE > tW + 0.6)) ctx.fail('Anker "enter" muss mindestens 0,6 s nach "walk" liegen')
      // Wo auf dem Weg die Fahrbahn beginnt (fuer "cross")
      let uRoad = 0.3
      for (let i = 0; i <= 400; i++) { const pt = path.getPointAt(i / 400); if (Math.abs(pt.x) < B - 0.05 && Math.abs(pt.z) < B - 0.05) { uRoad = i / 400; break } }
      walker = { fig, body, legL, legR, armL, armR, blob, path, len, tW, tE, tC, uRoad }
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

    // ---------------------------------------------------------------- Kamera
    const camera = new THREE.PerspectiveCamera(30, W / H, 5, 400)
    // Die Mitte der Szene liegt etwas unter der Bildmitte (oben stehen die Woerter): Bild nach unten verschieben
    camera.setViewOffset(W, H, 0, -H * 0.05, W, H)
    const target = new THREE.Vector3(0, 1.6, 0)
    const placeCamera = t => {
      const u = smooth((t - ctx.s) / Math.max(0.1, ctx.e - ctx.s))
      const dist = 74 * (1 - p.push * u), az = THREE.MathUtils.degToRad(45 + p.orbit / 2 - p.orbit * u), el = THREE.MathUtils.degToRad(37 - 1.5 * u)
      camera.position.set(target.x - dist * Math.cos(el) * Math.sin(az), target.y + dist * Math.sin(el), target.z + dist * Math.cos(el) * Math.cos(az))
      camera.lookAt(target)
      return az
    }

    // ---------------------------------------------------------------- Ein Bild zum Zeitpunkt t
    // Gezeichnet wird nur, solange die Szene zu sehen sein kann (mit Luft fuer Ein- und Ausblenden)
    const visibleFrom = ctx.sceneStart - 0.8, visibleTo = ctx.sceneEnd + 0.8
    const opening = (t, t0, t1) => smooth((t - t0) / 0.35) * (1 - smooth((t - t1) / 0.5))
    function draw(t) {
      if (t < visibleFrom || t > visibleTo) return
      const az = placeCamera(t)
      if (heart) {
        const h = heart, tc = h.tc
        h.grp.rotation.y = -az // immer zur Kamera
        // Schweben und Pochen; kurz vor dem Bruch schneller (wie ein Herz unter Stress)
        const beat = x => Math.pow(Math.max(0, Math.sin(x)), 8)
        const stress = tc != null && t > tc - 0.75 && t < tc
        h.grp.position.copy(our.top).add(v3.set(0, 0.16 * Math.sin(t * 1.8), 0))
        const broken = tc != null && t >= tc
        h.wholeM.visible = !broken; h.pivL.visible = h.pivR.visible = broken
        if (!broken) { h.grp.scale.setScalar(1 + (stress ? 0.1 * beat((t - tc) * 16) : 0.05 * beat(t * 5.5))); h.halo.material.opacity = 0.3 }
        else {
          const k = t - tc, e = 1 - Math.pow(1 - clamp01(k / 0.55), 3), fall = Math.max(0, k - 0.22)
          h.grp.scale.setScalar(1 + 0.12 * Math.max(0, 1 - k / 0.15))
          h.pivL.rotation.z = 0.55 * e; h.pivR.rotation.z = -0.55 * e
          h.pivL.position.x = X0L - 0.45 * e; h.pivR.position.x = X0R + 0.45 * e
          h.pivL.position.y = h.pivR.position.y = Y0 - 2.4 * fall * fall
          const fade = 1 - clamp01((k - 0.45) / 0.6)
          h.hl.material.opacity = h.hr.material.opacity = fade; h.pivL.visible = h.pivR.visible = fade > 0.01
          h.halo.material.opacity = 0.3 * fade
          h.shards.forEach(m => { const d = m.userData; m.visible = k < 0.9; m.position.set(d.v.x * k, d.v.y * k - 6 * k * k, d.v.z * k); m.rotation.set(d.spin.x * k, d.spin.y * k, d.spin.z * k); m.material.opacity = 1 - clamp01(k / 0.9) })
        }
      }
      if (walker) {
        const w = walker, u = walkU(t), pos = w.path.getPointAt(clamp01(u)), tan = w.path.getTangentAt(Math.min(0.999, Math.max(0.001, u)))
        // Drinnen ist er nicht mehr zu sehen: ab der Schwelle steckt er in der Wand, also ausblenden
        const inside = u <= 0.6 / w.len || u >= 1 - 0.3 / w.len
        w.fig.visible = w.blob.visible = !inside
        w.fig.position.set(pos.x, CURB, pos.z); w.fig.rotation.y = Math.atan2(tan.x, tan.z)
        // Schrittfolge aus der zurueckgelegten Strecke: so rutschen die Fuesse nicht, egal wie schnell er geht
        const ph = u * w.len / 1.1 * Math.PI, moving = t > w.tW && u < 1
        const sw = moving ? Math.sin(ph) * 0.55 : 0
        w.legL.rotation.x = sw; w.legR.rotation.x = -sw; w.armL.rotation.x = -sw * 0.8; w.armR.rotation.x = sw * 0.8
        w.body.position.y = moving ? Math.abs(Math.cos(ph)) * 0.05 : 0
        w.blob.position.set(pos.x, CURB + 0.02, pos.z)
        // Tueren: drueben geht sie auf, kurz bevor er ankommt, und faellt hinter ihm zu; die eigene, als er herauskommt
        goal.hinge.rotation.y = -1.25 * opening(t, w.tE - 0.6, w.tE + 0.25)
        origin.hinge.rotation.y = p.from < 0.05 ? -1.25 * opening(t, w.tW - 0.35, w.tW + 0.45) : 0
        // Ladenglocke: gedaempfte Schwingung ab "enter", dazu zwei Schallringe
        const k = t - w.tE
        bellSwing.rotation.x = k > 0 ? 0.6 * Math.exp(-k * 3) * Math.sin(k * 19) : 0
        rings.forEach((r, i) => { const kk = k - i * 0.16, on = kk > 0 && kk < 0.6; r.visible = on; if (on) { r.scale.setScalar(0.6 + kk * 2.2); r.material.opacity = 0.75 * (1 - kk / 0.6) } })
        // Licht in der Tuer drueben leuchtet auf, wenn er hineingeht
        goal.light.intensity = 18 + 26 * opening(t, w.tE - 0.25, w.tE + 0.35)
      }
      for (const pf of puffs) {
        const ph = ((t * 0.42 + pf.i / puffs.length) % 1 + 1) % 1
        pf.s.position.copy(riv.chimney).add(v3.set(Math.sin(pf.i * 2.1 + t * 0.8) * 0.35, ph * 4.2, 0))
        const sz = 0.9 + ph * 2.4; pf.s.scale.set(sz, sz, 1)
        pf.s.material.opacity = 0.4 * Math.sin(ph * Math.PI)
      }
      renderer.render(scene, camera)
    }
    // Ruhelage der Herzhaelften (fuer das Auseinanderfallen)
    const X0L = heart ? heart.pivL.position.x : 0, X0R = heart ? heart.pivR.position.x : 0, Y0 = heart ? heart.pivL.position.y : 0
    ctx.frame(draw)
    window.__iso = { renderer, scene, camera, draw, THREE }
  }
}
