// kit3d.js - der gemeinsame 3D-Baukasten. Alles, was iso-street (der erste 3D-Baustein) gut kann und jeder
// weitere 3D-Baustein braucht, an EINER Stelle: damit alle 3D-Bilder wie eine Welt aussehen (dieselbe Nacht,
// dasselbe Lila, dasselbe warme Licht, dieselbe Spielzeugfigur) und ein neuer Baustein in einer Stunde steht
// statt an einem Tag. Wer hier etwas aendert, aendert jedes 3D-Bild: danach `node studio/tools/test_3d.mjs`
// und die Standbilder von videos/_probe-3d ansehen.
//
// ================================================================================================ API
// Laden wie three.js in iso-street: ERST in build(), mit await import. Die Datei selbst laedt three.js auch
// erst in createKit(); ohne Aufruf bleibt sie in Node importierbar (Katalog, Selbsttest, Tests der reinen
// Funktionen weiter unten).
//
//   const K = await import('../engine/kit3d.js')
//   const kit = await K.createKit(ctx, { name: 'mein-baustein' })
//   const { THREE, scene } = kit
//
// Reine Funktionen (ohne three.js, ohne Seite; in Node pruefbar):
//   W, H                      Buehne 1080 x 1920
//   PAL                       Palette der 3D-Welt (Nacht, Lila, warmes Fensterlicht, Papier, Stadt, Figur)
//   FIT                       Rahmen, in den fitFrame die wichtigen Dinge legt (unter den Textzeilen, 60 px
//                             Rand, rechts vor der Knopfspalte)
//   rng(seed)                 fester Zufall (mulberry32): () => Zahl in [0, 1). NIE Math.random
//   clamp01, smooth, lerp     smooth ist weich an beiden Enden (smootherstep)
//   travel(t, s, e)           Fortschritt einer Kamerafahrt 0..1 zwischen s und e, weich
//   walkCycle(dist, moving)   Schritt der Figur aus der zurueckgelegten Strecke (Beine, Arme, Wippen)
//   heartBeat(x)              Pochen (spitz, wie ein Puls)
//   splitName(name)           Regel fuer lange Namen: [vorn, letztes Wort] oder null
//
// createKit(ctx, opts) -> kit. opts (alle frei):
//   name      Gruppe fuer data-apart der Pruefkaesten (Standard 'kit3d'; iso-street: 'iso-street')
//   prefix    zusaetzliche Klassen an Leinwand, Kaesten, Abblende ('is' gibt 'is-canvas', 'is-dim', ...)
//   ss        Bildpunkte je Buehnenpunkt (1; 2 waere glatter, kostet das Dreifache)
//   exposure  Belichtung (1.05)
//   fog       [near, far] des Dunstes, oder false (Standard [98, 172]; isoCamera schiebt ihn mit)
//   calm      Hoehe des ruhigen Verlaufs oben hinter den Textzeilen in px (760), false = keiner
//   vignette  Ecken leicht abdunkeln (true)
//   dim       beim Wechsel in die naechste Szene abblenden (true)
//
// Was kit hat:
//   THREE, RoundedBoxGeometry, scene, renderer (geteilt, siehe unten), canvas (Anzeige), wrap, ss
//   col(c), std(c, o), lam(c, o), basic(c, o)      Farben und Materialien (Standard rau, ohne Metall)
//   canvasTex(w, h, draw, { srgb, sharp })          Textur aus einer 2D-Leinwand; sharp nur fuer Schrift
//   blobTex, glow(color, size, pos, opacity)        weicher Fleck; Schein als additive Sprite
//   nightLights(o)                                  Himmel (Umgebung), Mond von hinten (Kante + Schatten),
//                                                   schwache Aufhellung von vorn -> { hemi, moon, fill }
//   pointLight(parent, pos, color, intensity, dist, decay)   warmes Licht vor einem Laden
//   groundMap({ origin, size, px })                 Boden als EINE gemalte Karte: gx(m), m, worldMapped(mat),
//                                                   spot(g, x, z, r, rgb, a) = gemalter Lichtkegel
//   bakedBoxGeo(r), houses(list), roofs(list), windows(list), windowTint(on), trees(list), lamps(list, o),
//   bench(parent, x, z, r), car(parent, x, z, ry, color)     Stadt und Kleinkram, instanziert und billig
//   fonts(text), icon(name, color)                  Schrift laden; Symbol aus engine/icons.js als Bild
//   signTexture(name, o) -> { tex, info }           Schild mit Namen, scharf, mit der Zwei-Zeilen-Regel
//   label(text, o) -> Mesh                          Schild als fertige Flaeche (fuer Preise, Namen, Zahlen)
//   shop(o)                                         der Spielzeugladen (Schild, Markise, Schaufenster, Tuer
//                                                   mit Blatt, Licht davor) -> Teile, Punkte, shine(), door()
//   person(o)                                       Spielzeugfigur -> Teile, at(x, z, ry), pose(walkCycle(..))
//   heart(o)                                        Herz, das pocht und zerbricht -> update(t, az) -> Meshes
//   bell(o), smoke(o)                               Ladenglocke (ring(k)), Rauch (update(t))
//   isoCamera({ fov, near, far, frame })            langes Objektiv von weit oben; set(t, o) faehrt heran
//                                                   und dreht, endet IMMER in frame -> Winkel
//   fitFrame(points, o) -> { dist, dx, dy, box }    rechnet frame so, dass points ueber die ganze Fahrt in
//                                                   FIT liegen und ihn fuellen
//   aimAcross(points, y)                            Ziel fuer isoCamera.set: haelt points beim Drehen mittig
//   safeBox(key, label, apart), setSafe(key, rect|null), clearSafe(), project(points), corners(box3),
//   meshBox(meshes)                                 unsichtbare Pruefkaesten (data-safe, data-apart)
//   run(fn)                                         meldet ctx.place und ctx.frame an: fn(t) stellt die
//                                                   Szene, gezeichnet wird nur, solange sie zu sehen ist
//   sync(), render(), drawnBox(obj)                 Matrizen; Bild rechnen; Pruefhilfe fuer Tests
//
// Vorbild fuer einen ganzen Baustein: components/iso-street.js (Stadt, zwei Laeden, Herz, Figur, Glocke, Kamera,
// Pruefkaesten). Reihenfolge in build(): createKit -> Licht, Boden, Dinge -> isoCamera -> safeBox -> run.
//
// ================================================================================================ Regeln
// - Jedes Bild ist eine reine Funktion von t. Kein Math.random, kein Date.now, kein Zustand, der sich von
//   Bild zu Bild ansammelt: renderVideo rechnet die Bilder auf mehreren Seiten und nicht der Reihe nach.
//   Zufall nur aus rng(seed) beim Bauen, Bewegung nur aus t.
// - Was die Pruefungen sehen sollen (Schilder, Figuren, Herz), bekommt einen safeBox: die Leinwand ist fuer
//   Sperrzonen, Knopfspalte und Textabstand sonst nur eine Flaeche.
// - Schatten wird EINMAL geworfen (Dinge, die stillstehen); was sich bewegt, hat einen weichen Fleck. Jedes
//   Bild neu zu werfen kostete eine Sekunde je Bild (17.11.2026, SwiftShader ohne Grafikkarte).
// - Lichtkegel und Kontaktschatten am Boden werden gemalt (groundMap), nicht als durchsichtige Flaechen
//   gezeichnet: die kosteten noch einmal so viel.
//
// ================================================================================================ Warum ein geteilter Renderer
// Chromium haelt je Seite hoechstens 16 WebGL-Kontexte; beim 17. verliert der aelteste sein Bild (gemessen
// am 17.11.2026 hier: von 24 Kontexten waren die ersten 8 verloren, nur eine Warnung in der Konsole). Mit
// einem Renderer je Szene haette ein Video, das fast nur aus 3D besteht, seine ersten Szenen schwarz
// gezeigt. Deshalb rechnet EIN Renderer je Seite alle 3D-Szenen in eine unsichtbare Leinwand (OffscreenCanvas),
// und jede Szene uebernimmt ihr fertiges Bild danach in ihre eigene Leinwand (transferToImageBitmap ->
// bitmaprenderer: ohne Kopie, ohne Umrechnung). Nebenbei teilen sich die Szenen die uebersetzten Shader
// (schnellerer Aufbau) und den Speicher fuers Multisampling.
// Was sich dadurch aendert (gemessen am 17.11.2026 an iso-street): das gerechnete Bild ist Bit fuer Bit
// dasselbe wie mit eigenem Renderer. Im fertigen Standbild weichen Kanten um hoechstens 15 von 255 ab (im
// Mittel 1,4, auf 7 % der Pixel): Chromium rechnet eine Leinwand, die nicht selbst WebGL ist, anders auf die
// Szene um, und umgerechnet wird immer, weil .ill (1,0376) mal der Ausgleich in run (0,9638) nicht genau 1
// ergibt. Mit einer 2D-Leinwand und drawImage sah es genauso aus wie mit bitmaprenderer.
import { BRAND } from './brand.js'
import { ICONS } from './icons.js'

export const W = 1080, H = 1920

// Palette der 3D-Welt. Die Stadt bleibt bewusst grau-lila und dunkel: nur die Helden (Laeden, Herz, Figur)
// duerfen leuchten, sonst sucht das Auge auf dem Handy, worum es geht. Werte aus iso-street (17.11.2026);
// die Stadt ist dort eine Stufe heller als in der ersten Probe, weil Hauswaende und Nachthimmel
// verschwammen und die Fenster als lose Rechtecke im Dunkel schwebten.
export const PAL = {
  night: BRAND.night, night2: BRAND.night2, brand: BRAND.brand, lilac: BRAND.lilac, paper: BRAND.paper, ink: BRAND.ink,
  fog: BRAND.night, road: '#221D4A', walk: '#37326A', curb: '#4F4988', mark: '#4F4987', zebra: '#9590C4',
  pave: '#423C76', lawn: '#2C4066',
  city: ['#3B375F', '#433E69', '#37335A', '#4A4572', '#3F3A63'], roof: '#3B3470',
  winWarm: ['#FFD58A', '#FFC56E', '#FFB55A'], winCool: '#B9B0FF', winOff: '#221B4A',
  tree: ['#6077AA', '#706CB2', '#4F8094', '#8471A8'], trunk: '#2A1F45', lamp: '#FFD9A0', pole: '#2A2258', lampGlow: '#FFC98A',
  skin: '#F2C29B', hair: '#2A1A2E', coat: BRAND.paper, legs: '#2B2457', heart: '#FF6B8B', bell: '#F4C56A',
  bench: '#6B5A8E', cars: ['#5B4E9A', '#8C3F5E', '#3E6A7A'],
  // Licht: Himmel und Boden der Umgebung, Mond, Aufhellung; Lichtkegel als 'r,g,b' fuer die Bodenkarte
  sky: '#7A74B8', ground: '#171230', moon: '#D2CBFF', fill: '#9A94D8',
  poolLamp: '255,190,120', poolOurs: '185,176,255', poolRival: '255,180,106',
  // Laeden: Licht im eigenen (kuehles Lila) und im fremden Laden (warm), Schein ums Schild und vor der Tuer
  shopOurs: { light: '#E9E2FF', halo: '#9F95FF', front: '#B9B0FF' }, shopRival: { light: '#FFD7A0', halo: '#FFB46A', front: '#FFB46A' }
}

// Rahmen fuer die wichtigen Dinge (fitFrame): oben unter den Textzeilen (Stil C, ein Wort oben, plus 40 px
// Textabstand), unten ueber der Sperrzone, links 60 px Rand, rechts vor der Knopfspalte von TikTok und Reels
// (ab x = 950; iso-street haelt 940). Ein Baustein darf einen eigenen Rahmen nehmen.
export const FIT = { left: 60, right: 940, top: 600, bottom: 1536 }

// Fester Zufall (mulberry32): dieselbe Stadt in jedem Lauf, auf jeder Seite
export function rng(seed) {
  let a = seed >>> 0
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}
export const clamp01 = x => Math.max(0, Math.min(1, x))
export const smooth = x => { x = clamp01(x); return x * x * x * (x * (x * 6 - 15) + 10) }   // weich an beiden Enden
export const lerp = (a, b, t) => a + (b - a) * t
// Fortschritt einer Fahrt ueber die Szene (mindestens 0,1 s lang, sonst teilt man durch fast nichts)
export const travel = (t, s, e) => smooth((t - s) / Math.max(0.1, e - s))
// Pochen: nur die Spitzen eines Sinus, hoch acht. Sieht aus wie ein Puls, nicht wie ein Atmen.
export const heartBeat = x => Math.pow(Math.max(0, Math.sin(x)), 8)

// Schritt der Spielzeugfigur aus der zurueckgelegten Strecke in Metern, nicht aus der Zeit: so rutschen die
// Fuesse nicht, egal wie schnell sie geht. stride = Meter je halbem Schritt. Steht sie (moving false), haengen
// Arme und Beine gerade.
export function walkCycle(dist, moving, { stride = 1.1, swing = 0.55, arms = 0.8, bob = 0.05 } = {}) {
  const ph = dist / stride * Math.PI
  const sw = moving ? Math.sin(ph) * swing : 0
  return { legL: sw, legR: -sw, armL: -sw * arms, armR: sw * arms, bob: moving ? Math.abs(Math.cos(ph)) * bob : 0 }
}

// Regel fuer lange Namen auf Schildern: vorn klein (meist die Art des Ladens), das letzte Wort gross. Warum:
// im Doener-Video heissen die Laeden "Döner Nordwind" und "Döner Südwind"; in einer Zeile kamen sie nur auf
// 0,38 und 0,41 der Schildhoehe, auf dem Handy kaum lesbar. In zwei Zeilen steht "Nordwind" auf 0,56, und
// genau das Wort unterscheidet die beiden Laeden. Ob zwei Zeilen noetig sind, entscheidet signTexture an der
// echten Schriftbreite (unter 0,42 der Hoehe in einer Zeile); hier steht nur, WIE geteilt wird.
export function splitName(name) {
  const words = String(name).trim().split(/\s+/)
  return words.length > 1 ? [words.slice(0, -1).join(' '), words[words.length - 1]] : null
}

// Ein Renderer je Seite und Feinheit (siehe Kopf: hoechstens 16 WebGL-Kontexte je Seite)
const SHARED = new Map()

// Gemeinsame Regeln fuer Leinwand, Verlaeufe und Kaesten; einmal je Seite in den Kopf gelegt. Bis zum
// 17.11.2026 standen sie in iso-street (.is-wrap usw.), jetzt gelten sie fuer jeden 3D-Baustein gleich.
const CSS = `
/* .k3-wrap hebt die langsame 2D-Kamerafahrt der Szene (.ill, 1,05 auf 1) wieder auf (siehe run): die
   3D-Kamera faehrt selbst. Beide zusammen hoben sich vorher fast auf, und am Szenenanfang ragte das Bild
   um 5 % ueber den vermessenen Ausschnitt hinaus. */
.k3-wrap { position: absolute; inset: 0; transform-origin: 50% 62%; }
.k3-canvas { position: absolute; left: 0; top: 0; width: ${W}px; height: ${H}px; }
/* Unsichtbare Kaesten ueber Schildern, Herz und Figur, nur fuer die Pruefungen */
.k3-box { position: absolute; visibility: hidden; pointer-events: none; }
/* Oben laufen die Textzeilen: die Stadt dort im Dunst ausblenden, damit die Woerter auf ruhigem Grund stehen */
.k3-calm { position: absolute; left: 0; right: 0; top: 0; height: 760px; pointer-events: none;
  background: linear-gradient(180deg, ${BRAND.night} 0%, rgba(14,10,36,.94) 20%, rgba(14,10,36,.7) 40%, rgba(14,10,36,.25) 68%, rgba(14,10,36,0) 100%); }
/* Ecken leicht abdunkeln: haelt den Blick in der Mitte, wie bei einer Linse. Schwaecher als in der ersten
   Probe von iso-street: dort lag der Platz unten bei Helligkeit 10 bis 19 von 255 */
.k3-vig { position: absolute; inset: 0; pointer-events: none; background: radial-gradient(ellipse 90% 64% at 50% 52%, rgba(14,10,36,0) 62%, rgba(14,10,36,.42) 100%), linear-gradient(180deg, rgba(14,10,36,0) 80%, rgba(14,10,36,.3) 100%); }
/* Abblenden beim Szenenwechsel (siehe run): liegt ueber Bild, Verlaeufen und Pruefkaesten */
.k3-dim { position: absolute; inset: 0; pointer-events: none; background: ${BRAND.night}; opacity: 0; }
`

export async function createKit(ctx, opts = {}) {
  const { name = 'kit3d', prefix = null, ss = 1, exposure = 1.05, fog = [98, 172], calm = 760, vignette = true, dim = true } = opts
  const cls = base => base + (prefix ? ` ${prefix}-${base.slice(3)}` : '')
  // three.js erst hier laden: so bleibt kit3d.js (und jeder Baustein) in Node ohne die 700 KB importierbar
  const THREE = await import('./vendor/three.module.min.js')
  const { RoundedBoxGeometry } = await import('./vendor/RoundedBoxGeometry.js')

  if (!document.getElementById('kit3d-css')) { const st = document.createElement('style'); st.id = 'kit3d-css'; st.textContent = CSS; document.head.append(st) }
  const wrap = ctx.el('div', cls('k3-wrap')), canvas = ctx.el('canvas', cls('k3-canvas')); canvas.width = W * ss; canvas.height = H * ss
  wrap.append(canvas)
  const over = []
  if (vignette) over.push(ctx.el('div', cls('k3-vig')))
  if (calm) { const c = ctx.el('div', cls('k3-calm')); if (calm !== 760) c.style.height = calm + 'px'; over.push(c) }
  const dimEl = dim ? ctx.el('div', cls('k3-dim')) : null
  ctx.root.append(wrap, ...over, ...(dimEl ? [dimEl] : []))
  const illEl = ctx.root.closest('.ill')

  // ---------------------------------------------------------------- geteilter Renderer (siehe Kopf)
  let sh = SHARED.get(ss)
  if (!sh) {
    const glc = new OffscreenCanvas(W * ss, H * ss)
    let renderer
    try {
      renderer = new THREE.WebGLRenderer({ canvas: glc, antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' })
    } catch (e) { ctx.fail('WebGL steht in diesem Browser nicht zur Verfügung (' + e.message + '). Der 3D-Baustein braucht Chromium mit WebGL (SwiftShader reicht).') }
    // Ein verlorener Kontext zeichnet still Schwarz; als Konsolenfehler landet er in den Problemen des Baus
    glc.addEventListener('webglcontextlost', () => console.error('kit3d: WebGL-Kontext verloren, die 3D-Bilder dieser Seite sind leer'))
    renderer.setPixelRatio(1); renderer.setSize(W * ss, H * ss, false)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    // Neutral statt ACES: ACES zieht Lila ins Blaue, die Markenfarben sollen bleiben, wie sie sind
    renderer.toneMapping = THREE.NeutralToneMapping
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap
    // Der Schatten steht still (siehe Kopf): je Szene einmal werfen (render), dann nur noch lesen
    renderer.shadowMap.autoUpdate = false
    sh = { renderer, glc, aniso: renderer.capabilities.getMaxAnisotropy() }
    SHARED.set(ss, sh)
  }
  const { renderer, glc, aniso } = sh
  // Anzeige dieser Szene: nimmt fertige Bilder des geteilten Renderers entgegen (siehe Kopf)
  const g2 = canvas.getContext('bitmaprenderer')

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(PAL.fog)
  if (fog) scene.fog = new THREE.Fog(PAL.fog, fog[0], fog[1])

  const kit = { THREE, RoundedBoxGeometry, scene, renderer, canvas, wrap, ss, camera: null, shown: false }
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v3 = new THREE.Vector3(), s3 = new THREE.Vector3(), eul = new THREE.Euler()

  // ---------------------------------------------------------------- Farben, Materialien, Texturen
  const col = kit.col = c => new THREE.Color(c)
  const std = kit.std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0, ...o })
  const lam = kit.lam = (color, o = {}) => new THREE.MeshLambertMaterial({ color, ...o })
  kit.basic = (color, o = {}) => new THREE.MeshBasicMaterial({ color, ...o })
  // Anisotrope Filterung nur fuer Schrift (Schilder): am Boden kostete sie eine halbe Sekunde je Bild,
  // und dort liegt ohnehin nur Weiches (Lichtkegel, Kontaktschatten)
  const canvasTex = kit.canvasTex = (w, h, draw, { srgb = true, sharp = false } = {}) => {
    const c = document.createElement('canvas'); c.width = w; c.height = h
    draw(c.getContext('2d'), w, h)
    const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = sharp ? Math.min(8, aniso) : 1; t.minFilter = THREE.LinearMipmapLinearFilter
    return t
  }
  const blobTex = kit.blobTex = canvasTex(128, 128, (g, w) => {
    const r = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2)
    r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.4, 'rgba(255,255,255,.5)'); r.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = r; g.fillRect(0, 0, w, w)
  })
  const glow = kit.glow = (color, size, pos, opacity = 1) => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: blobTex, color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }))
    s.scale.set(size, size, 1); s.position.copy(pos); scene.add(s); return s
  }

  // ---------------------------------------------------------------- Licht
  // Mond von hinten (vom Betrachter aus, Kamera im Suedwesten): er kantet Daecher und Koepfe an (Kantenlicht)
  // und wirft die Schatten zur Kamera hin, dadurch bekommt die Szene Tiefe. Die sichtbaren Fronten liegen im
  // Schatten und leben von Fenstern und Ladenlichtern, wie nachts eben. Himmelslicht bewusst wenig
  // gesaettigt: die Stadt soll grau-lila bleiben, damit die Helden leuchten. Die Aufhellung von der Kamera
  // her ist schwach und ohne Schatten: sonst saufen die Fronten ganz ab.
  // Schaut die Kamera aus einer anderen Richtung, moon.pos und fill.pos mitdrehen (Mond bleibt hinten).
  kit.nightLights = ({ hemi = 1.3, moon = {}, fill = {} } = {}) => {
    const h = new THREE.HemisphereLight(PAL.sky, PAL.ground, hemi); scene.add(h)
    const mo = { color: PAL.moon, intensity: 2.4, pos: [30, 46, -40], shadow: true, size: 2048, box: 40, near: 10, far: 150, ...moon }
    const m = new THREE.DirectionalLight(mo.color, mo.intensity)
    m.position.set(...mo.pos); m.target.position.set(0, 0, 0)
    if (mo.shadow) {
      m.castShadow = true
      m.shadow.mapSize.set(mo.size, mo.size)
      Object.assign(m.shadow.camera, { left: -mo.box, right: mo.box, top: mo.box, bottom: -mo.box, near: mo.near, far: mo.far })
      m.shadow.bias = -0.0005; m.shadow.normalBias = 0.04; m.shadow.radius = 2.5
    }
    scene.add(m, m.target)
    const fo = { color: PAL.fill, intensity: 0.6, pos: [-30, 25, 30], ...fill }
    const f = new THREE.DirectionalLight(fo.color, fo.intensity); f.position.set(...fo.pos); scene.add(f)
    return { hemi: h, moon: m, fill: f }
  }
  // Warmes Licht vor einem Laden: eine echte Punktlichtquelle (faerbt Markise, Figur, Glocke). Teuer: jede
  // weitere kostet in jedem Bild, also nur bei den Helden, nicht an jeder Laterne (die sind gemalt).
  kit.pointLight = (parent, pos, color, intensity, dist = 8, decay = 1.6) => {
    const pl = new THREE.PointLight(color, intensity, dist, decay); pl.position.set(...pos); parent.add(pl); return pl
  }

  // ---------------------------------------------------------------- Boden als eine gemalte Karte
  // Material, das seine Textur nach der Lage in der Welt liest (x und z), nicht nach eigenen Koordinaten:
  // so liegen Boden, Gehwegplatten und Streifen auf EINER gemalten Karte mit Lichtkegeln und Schatten.
  // origin/size: die Karte deckt x und z von origin bis origin + size ab (weiter hinten liegt Dunst);
  // px: Kantenlaenge der Textur.
  kit.groundMap = ({ origin, size, px }) => {
    const gx = v => (v - origin) / size * px // Meter -> Bildpunkt der Bodentextur
    const worldMapped = mat => {
      mat.onBeforeCompile = sh => {
        sh.vertexShader = sh.vertexShader.replace('#include <uv_vertex>', `#include <uv_vertex>
          vec4 wuvP = vec4( position, 1.0 );
          #ifdef USE_INSTANCING
            wuvP = instanceMatrix * wuvP;
          #endif
          wuvP = modelMatrix * wuvP;
          vec2 wuv = vec2( ( wuvP.x - (${origin.toFixed(1)}) ) / ${size.toFixed(1)}, 1.0 - ( wuvP.z - (${origin.toFixed(1)}) ) / ${size.toFixed(1)} );
          #ifdef USE_MAP
            vMapUv = wuv;
          #endif
          #ifdef USE_EMISSIVEMAP
            vEmissiveMapUv = wuv;
          #endif`)
      }
      // Schluessel mit Lage und Groesse: zwei Karten mit gleichem Schluessel teilten sich sonst ein Programm
      mat.customProgramCacheKey = () => `kit3d-world-uv:${origin.toFixed(1)}:${size.toFixed(1)}`
      return mat
    }
    // Gemalter Lichtkegel (in die Leuchttextur, mit globalCompositeOperation 'lighter'): kostet beim Malen
    // einmal, im Bild nichts. Durchsichtige Flaechen am Boden kosteten eine Sekunde je Bild.
    const spot = (g, x, z, r, rgb, a) => { const gr = g.createRadialGradient(gx(x), gx(z), 0, gx(x), gx(z), r * px / size); gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(0.45, `rgba(${rgb},${a * 0.45})`); gr.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = gr; g.fillRect(gx(x - r), gx(z - r), 2 * r * px / size, 2 * r * px / size) }
    return { gx, m: px / size, origin, size, px, worldMapped, spot }
  }

  // ---------------------------------------------------------------- Stadt und Kleinkram
  // Block mit abgerundeten Kanten, unten dunkler als oben: wirkt wie Licht, das am Boden verschluckt wird
  // (gebackene Verdeckung, kostet nichts im Bild)
  kit.bakedBoxGeo = (radius = 0.03) => {
    const geo = new RoundedBoxGeometry(1, 1, 1, 1, radius)
    const pos = geo.attributes.position, cols = new Float32Array(pos.count * 3)
    for (let k = 0; k < pos.count; k++) { const y = pos.getY(k) + 0.5, f = 0.45 + 0.55 * Math.pow(y, 0.6); cols.set([f, f, f * 1.04], k * 3) }
    geo.setAttribute('color', new THREE.BufferAttribute(cols, 3))
    return geo
  }
  // Haeuser: { x, z, w, d, h, c } (Mitte, Breite in x, Tiefe in z, Hoehe, Farbe), alle in EINEM Netz
  kit.houses = (list, { y0 = 0, geo = null } = {}) => {
    const g = geo || kit.bakedBoxGeo()
    const mesh = new THREE.InstancedMesh(g, lam('#FFFFFF', { vertexColors: true }), list.length)
    list.forEach((hs, k) => { m4.compose(v3.set(hs.x, y0 + hs.h / 2, hs.z), q.identity(), s3.set(hs.w, hs.h, hs.d)); mesh.setMatrixAt(k, m4); mesh.setColorAt(k, col(hs.c)) })
    mesh.castShadow = mesh.receiveShadow = true; scene.add(mesh); return mesh
  }
  // Aufbauten auf Daechern: [x, y, z, w, h, d] (y = Dachhoehe)
  kit.roofs = (list, color = PAL.roof) => {
    const mesh = new THREE.InstancedMesh(new RoundedBoxGeometry(1, 1, 1, 1, 0.08), lam(color), list.length)
    list.forEach(([x, y, z, w, h, d], k) => { m4.compose(v3.set(x, y + h / 2, z), q.identity(), s3.set(w, h, d)); mesh.setMatrixAt(k, m4) })
    mesh.castShadow = mesh.receiveShadow = true; scene.add(mesh); return mesh
  }
  // Fensterfarbe aus einer Zufallszahl: etwa ein Drittel warm, ein paar kuehl (Fernseher), der Rest dunkel
  const windowTint = kit.windowTint = on => on < 0.34 ? col(PAL.winWarm[Math.floor(on * 100) % 3]).multiplyScalar(1.1) : on < 0.4 ? col(PAL.winCool).multiplyScalar(0.75) : col(PAL.winOff)
  // Fenster: { x, y, z, ry, on } in einem Netz. Nur an Seiten setzen, die zur Kamera zeigen.
  kit.windows = list => {
    const mesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.8, 1.05), new THREE.MeshBasicMaterial({ color: '#FFFFFF' }), list.length)
    list.forEach((wd, k) => {
      m4.compose(v3.set(wd.x, wd.y, wd.z), q.setFromEuler(eul.set(0, wd.ry, 0)), s3.set(1, 1, 1)); mesh.setMatrixAt(k, m4)
      mesh.setColorAt(k, windowTint(wd.on))
    })
    scene.add(mesh); return mesh
  }
  // Baeume: [x, z, Groesse, Farbe 0..3]. Runde, facettierte Kronen (wie Spielzeug), Gruen ins Lila gezogen.
  kit.trees = (list, { y0 = 0 } = {}) => {
    const crown = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), lam('#FFFFFF', { flatShading: true }), list.length)
    const trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.1, 0.14, 1, 6), lam(PAL.trunk), list.length)
    list.forEach(([x, z, s, c], k) => {
      m4.compose(v3.set(x, y0 + 0.8 * s, z), q.identity(), s3.set(s, 1.6 * s, s)); trunk.setMatrixAt(k, m4)
      m4.compose(v3.set(x, y0 + 2.3 * s, z), q.identity(), s3.set(1.15 * s, 1.3 * s, 1.15 * s)); crown.setMatrixAt(k, m4)
      crown.setColorAt(k, col(PAL.tree[c]))
    })
    crown.castShadow = trunk.castShadow = true; crown.receiveShadow = true; scene.add(crown, trunk)
    return { crown, trunk }
  }
  // Laternen: [x, z]. Mast und leuchtender Kopf; der Lichtkegel gehoert gemalt in die Bodenkarte (spot).
  // glowIf(k): welche einen Schein bekommen (jede Sprite kostet ein wenig, also nur die im Bild).
  kit.lamps = (list, { y0 = 0, glowIf = () => true } = {}) => {
    const pole = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.07, 0.1, 4.4, 6), lam(PAL.pole), list.length)
    const head = new THREE.InstancedMesh(new THREE.SphereGeometry(0.26, 12, 8), new THREE.MeshBasicMaterial({ color: col(PAL.lamp).multiplyScalar(1.5) }), list.length)
    list.forEach(([x, z], k) => {
      m4.compose(v3.set(x, y0 + 2.2, z), q.identity(), s3.set(1, 1, 1)); pole.setMatrixAt(k, m4)
      m4.compose(v3.set(x, y0 + 4.5, z), q.identity(), s3.set(1, 1, 1)); head.setMatrixAt(k, m4)
      if (glowIf(k)) glow(PAL.lampGlow, 2.6, new THREE.Vector3(x, y0 + 4.5, z), 0.55)
    })
    pole.castShadow = true; scene.add(pole, head)
    return { pole, head }
  }
  // Bank (r = 0 oder Math.PI / 2) und geparktes Auto: Kleinkram, an dem man die Groesse abliest
  kit.bench = (parent, x, z, r, { y0 = 0 } = {}) => {
    const bench = new THREE.Mesh(new RoundedBoxGeometry(1.8, 0.16, 0.6, 1, 0.05), lam(PAL.bench)); bench.position.set(x, y0 + 0.5, z); bench.rotation.y = r; parent.add(bench)
    const back = new THREE.Mesh(new RoundedBoxGeometry(1.8, 0.5, 0.12, 1, 0.05), lam(PAL.bench)); back.position.set(x - (r ? 0.28 : 0), y0 + 0.8, z - (r ? 0 : 0.28)); back.rotation.y = r; parent.add(back)
    return { bench, back }
  }
  kit.car = (parent, x, z, ry, color) => {
    const c = new THREE.Group(); c.position.set(x, 0, z); c.rotation.y = ry; parent.add(c)
    const body = new THREE.Mesh(new RoundedBoxGeometry(1.8, 0.75, 3.9, 2, 0.28), std(color, { roughness: 0.45 })); body.position.y = 0.62; c.add(body)
    const cab = new THREE.Mesh(new RoundedBoxGeometry(1.55, 0.62, 2.0, 2, 0.24), std('#1C1640', { roughness: 0.25, metalness: 0.2 })); cab.position.set(0, 1.18, -0.15); c.add(cab)
    for (const [wx, wz] of [[-0.82, 1.25], [0.82, 1.25], [-0.82, -1.25], [0.82, -1.25]]) { const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.26, 12), lam('#0C0920')); wh.rotation.z = Math.PI / 2; wh.position.set(wx, 0.34, wz); c.add(wh) }
    const tl = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.12, 0.05), new THREE.MeshBasicMaterial({ color: '#FF4D6D' })); tl.position.set(0, 0.78, 1.96); c.add(tl)
    return c
  }

  // ---------------------------------------------------------------- Schrift und Symbole
  // Vor dem ersten Schild laden, sonst malt die 2D-Leinwand in der Ersatzschrift (und misst falsch)
  kit.fonts = (text, weight = 700) => document.fonts.load(`${weight} 200px ${BRAND.display}`, text)
  kit.icon = async (iconName, color) => {
    if (!ICONS[iconName]) ctx.fail(`Symbol "${iconName}" gibt es nicht. Erlaubt: ${Object.keys(ICONS).join(', ')}`)
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[iconName]}</svg>`
    const img = new Image(); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); await img.decode(); return img
  }
  // Schild: Papierfarbe, Name in Tinte ueber die ganze Breite, unten ein Streifen in der Ladenfarbe (verbindet
  // Schild und Markise). w, h in Metern (nur fuers Seitenverhaeltnis), px = Breite der Textur. Unbeleuchtet
  // gezeichnet (toneMapped false), denn nachts ist das Schild das Hellste an der Front.
  // info: { name, size (Schrift relativ zur Schildhoehe; unter 0,42 auf dem Handy zu klein), lines, fits }
  kit.signTexture = (text, { w, h, px = 2048, accent = null, bg = PAL.paper, fg = PAL.ink } = {}) => {
    const TW = px, TH = Math.round(TW * h / w)
    let info = null
    const tex = canvasTex(TW, TH, (c2, cw, chh) => {
      c2.fillStyle = bg; c2.beginPath(); c2.roundRect(0, 0, cw, chh, chh * 0.18); c2.fill()
      if (accent) { c2.fillStyle = '#' + col(accent).getHexString(); c2.fillRect(chh * 0.18, chh * 0.86, cw - chh * 0.36, chh * 0.06) }
      const room = cw - chh * 0.5
      const font = s => { c2.font = `700 ${s}px ${BRAND.display}`; return s }
      // Groesste Schrift, mit der txt in die Breite passt (ab start, in 3-%-Schritten kleiner)
      const fitW = (txt, start) => { let s = font(start); while (c2.measureText(txt).width > room && s > chh * 0.2) s = font(s * 0.97); return s }
      let size = fitW(text, chh * 0.66)
      c2.fillStyle = fg; c2.textAlign = 'center'
      const parts = splitName(text)
      if (size / chh < 0.42 && parts) {
        // Zwei Zeilen (splitName): vorn klein, das letzte Wort gross
        const [top, main] = parts
        let big = fitW(main, chh * 0.56), small = fitW(top, big * 0.62)
        // Senkrecht zwischen 0,08 und 0,81 der Hoehe (darunter liegt der Streifen); gemessen an den echten
        // Glyphen, sonst stossen die Punkte des Ö oben an den Rand
        const box = (t, s) => { font(s); const m = c2.measureText(t); return [m.actualBoundingBoxAscent, m.actualBoundingBoxDescent] }
        const y0 = chh * 0.08, y1 = chh * 0.81, gap = chh * 0.05
        let [a1, d1] = box(top, small), [a2, d2] = box(main, big)
        const k = Math.min(1, (y1 - y0 - gap) / (a1 + d1 + a2 + d2))
        big *= k; small *= k; [a1, d1] = box(top, small); [a2, d2] = box(main, big)
        const y = y0 + (y1 - y0 - (a1 + d1 + gap + a2 + d2)) / 2
        c2.textBaseline = 'alphabetic'
        font(small); c2.fillText(top, cw / 2, y + a1)
        font(big); c2.fillText(main, cw / 2, y + a1 + d1 + gap + a2)
        // Fuer die Warnung zaehlt das grosse Wort; das kleine ist immer 0,62 davon
        const fitsMain = c2.measureText(main).width <= room
        font(small)
        info = { name: text, size: +(big / chh).toFixed(2), lines: 2, fits: fitsMain && c2.measureText(top).width <= room }
      } else {
        font(size); c2.textBaseline = 'middle'
        c2.fillText(text, cw / 2, chh * 0.47)
        info = { name: text, size: +(size / chh).toFixed(2), lines: 1, fits: c2.measureText(text).width <= room }
      }
    }, { sharp: true })
    return { tex, info }
  }
  // Fertiges Schild als Flaeche (w x h Meter), z. B. Preis, Name, Zahl ueber einem Ding. Warnt, wenn die
  // Schrift auf dem Handy zu klein wird. Zur Kamera drehen: mesh.rotation.y = -az (Winkel aus isoCamera.set).
  kit.label = (text, { w = 3, h = 1, px = 1024, accent = null, bg = PAL.paper, fg = PAL.ink } = {}) => {
    const { tex, info } = kit.signTexture(text, { w, h, px, accent, bg, fg })
    if (!info.fits || info.size < 0.42) ctx.warn(`"${text}" steht auf dem Schild sehr klein. Text kürzen.`)
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false }))
    mesh.userData.info = info
    return mesh
  }

  // ---------------------------------------------------------------- Der Spielzeugladen
  // Gebaut im eigenen Koordinatensystem: Front zeigt nach +z, die Ecke (zur Kreuzung) liegt bei x = 0, der
  // Laden reicht nach -x und -z; pos/rot stellen ihn an seinen Platz. flip legt Tuer und Glocke an das andere
  // Ende der Front (fuer einen gespiegelten Laden, der sonst in die Strasse hineinragte).
  // ours: eigener Laden (Wand im Stampit-Lila, kuehles Licht, Markise Lila im Wechsel) oder fremder (warm).
  // signs: Liste, in die die Schildmasse (info) kommen, fuer die Warnung "sehr klein".
  kit.shop = async ({ name: shopName, icon, accent, ours = true, pos = new THREE.Vector3(), rot = 0, flip = false, size = { w: 5.6, d: 6, h: 9, door: 1.25 }, light = 18, signs = null }) => {
    const g = new THREE.Group(); g.position.copy(pos); g.rotation.y = rot; scene.add(g)
    const acc = col(accent), wallC = ours ? col(BRAND.brand).lerp(col('#2A2166'), 0.2) : col('#46325F')
    const put = (mesh, x, y, z, cast = true) => { mesh.position.set(x, y, z); mesh.castShadow = cast; mesh.receiveShadow = true; g.add(mesh); return mesh }
    const { w, d, h } = size
    // a = Abstand von der Ecke, entlang der Front -> x im Laden
    // open: Drehrichtung des Tuerblatts nach aussen (das Blatt reicht von der Angel weg von der Ecke)
    const ax = a => flip ? -w + a : -a, dx = ax(size.door), open = flip ? -1 : 1
    // Haus: abgerundeter Block; Erdgeschoss ist der Laden, darueber zwei Etagen Wohnungen
    put(new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, 0.16), std(wallC)), -w / 2, h / 2, -d / 2)
    // Gesims oben, Band ueber dem Laden, Sockel: liest sich wie ein gebautes Haus, nicht wie eine Kiste
    put(new THREE.Mesh(new RoundedBoxGeometry(w + 0.3, 0.36, d + 0.3, 2, 0.12), std(wallC.clone().lerp(col('#FFFFFF'), 0.14))), -w / 2, h + 0.08, -d / 2)
    put(new THREE.Mesh(new RoundedBoxGeometry(w + 0.12, 0.24, 0.3, 2, 0.08), std(wallC.clone().lerp(col('#FFFFFF'), 0.1))), -w / 2, 4.85, 0.05, false)
    put(new THREE.Mesh(new RoundedBoxGeometry(w + 0.1, 0.42, d + 0.1, 2, 0.1), std(wallC.clone().multiplyScalar(0.62))), -w / 2, 0.21, -d / 2, false)
    // Wohnungsfenster, warm erleuchtet (nicht alle: bewohnt, aber nicht festlich)
    for (const [x, y, on] of [[ax(w - 1.1), 6.05, 1], [-w / 2, 6.05, 0], [ax(1.1), 6.05, 1], [ax(w - 1.1), 7.85, 0], [-w / 2, 7.85, 1], [ax(1.1), 7.85, 1]]) {
      put(new THREE.Mesh(new RoundedBoxGeometry(1.1, 1.25, 0.14, 2, 0.04), std('#191340')), x, y, 0.02, false)
      put(new THREE.Mesh(new THREE.PlaneGeometry(0.84, 0.98), new THREE.MeshBasicMaterial({ color: on ? col(PAL.winWarm[1]).multiplyScalar(1.15) : col(PAL.winOff) })), x, y, 0.1, false)
    }
    // Schaufenster: leuchtet von innen, mit Theke und Kasse als Schattenriss
    const winW = w - size.door - 1.55, winX = ax(size.door + 0.85 + winW / 2)
    put(new THREE.Mesh(new RoundedBoxGeometry(winW + 0.3, 2.2, 0.22, 2, 0.06), std('#140F33')), winX, 1.55, 0.02, false)
    const lit = ours ? PAL.shopOurs : PAL.shopRival, lightC = lit.light
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
    // Das Symbol des Ladens gross auf der Scheibe, in der Ladenfarbe (wie ein Aufkleber). Nicht auf dem
    // Schild: neben einem Symbolfeld blieb fuer "Imbiss Sonne" nur eine Schrift, die auf dem Handy niemand las.
    const ico = await kit.icon(icon, '#' + acc.clone().multiplyScalar(ours ? 0.75 : 0.85).getHexString())
    const icoTex = canvasTex(256, 256, (c2, cw) => { c2.drawImage(ico, 0, 0, cw, cw) }, { sharp: true })
    put(new THREE.Mesh(new THREE.PlaneGeometry(1.15, 1.15), new THREE.MeshBasicMaterial({ map: icoTex, transparent: true, toneMapped: false })), winX + (flip ? 0.55 : -0.55), 1.62, 0.16, false)
    // Tuer: Rahmen, dahinter das Licht des Ladens, davor das Tuerblatt (dreht auf, wenn jemand kommt)
    put(new THREE.Mesh(new RoundedBoxGeometry(1.42, 2.6, 0.22, 2, 0.06), std('#140F33')), dx, 1.3, 0.02, false)
    put(new THREE.Mesh(new THREE.PlaneGeometry(1.14, 2.36), new THREE.MeshBasicMaterial({ color: col(lightC).multiplyScalar(1.1) })), dx, 1.2, 0.135, false)
    // Angel an der Seite ZUR Ecke, das Blatt reicht von der Ecke weg und schwingt nach aussen auf, bis es quer
    // zur Front steht. Warum: wer von der Ecke her kommt und gerade auf die Tuer zugeht, laeuft so nicht in
    // das Blatt. In der ersten Probe von iso-street sass die Angel auf der anderen Seite: das Blatt schwang in
    // seinen Weg, sein Arm steckte bei "enter" im Glas, und das offene Blatt verdeckte genau den Moment, in dem
    // er hineinging. Jetzt steht es im Bild neben der Tuer, nicht davor.
    const hingeA = size.door - 0.57
    const hinge = new THREE.Group(); hinge.position.set(ax(hingeA), 0, 0.17); g.add(hinge)
    const lx = flip ? 0.56 : -0.56
    const leaf = new THREE.Mesh(new RoundedBoxGeometry(1.12, 2.32, 0.08, 2, 0.03), std(wallC.clone().multiplyScalar(0.55))); leaf.position.set(lx, 1.2, 0); hinge.add(leaf)
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 1.2), new THREE.MeshBasicMaterial({ color: col(lightC).multiplyScalar(0.92) })); pane.position.set(lx, 1.45, 0.05); hinge.add(pane)
    // Markise nur ueber dem Schaufenster (ueber der Tuer haengt die Glocke): Ladenfarbe im Wechsel mit Lila
    // (eigener Laden) oder Papier (gegenueber), wie auf einer Stempelkarte
    const awTex = canvasTex(512, 64, (c2, cw, chh) => { for (let i = 0; i < 8; i++) { c2.fillStyle = i % 2 ? (ours ? BRAND.lilac : BRAND.paper) : '#' + acc.getHexString(); c2.fillRect(i * cw / 8, 0, cw / 8 + 1, chh) } })
    const aw = put(new THREE.Mesh(new RoundedBoxGeometry(winW + 0.5, 0.12, 1.35, 2, 0.05), std('#FFFFFF', { map: awTex, roughness: 0.7 })), winX, 2.86, 0.62)
    aw.rotation.x = 0.36
    // Schild ueber dem Laden (signTexture, mit der Zwei-Zeilen-Regel fuer lange Namen)
    const signW = w - 0.3, signH = 1.5
    const { tex: signTex, info: signInfo } = kit.signTexture(shopName, { w: signW, h: signH, px: 2048, accent: acc })
    if (signs) signs.push(signInfo)
    put(new THREE.Mesh(new RoundedBoxGeometry(signW + 0.18, signH + 0.18, 0.24, 2, 0.07), std('#1A1440')), -w / 2, 3.95, 0.12, false)
    const signMat = new THREE.MeshBasicMaterial({ map: signTex, toneMapped: false })
    put(new THREE.Mesh(new THREE.PlaneGeometry(signW, signH), signMat), -w / 2, 3.95, 0.25, false)
    // Schein um das Schild (wie ein Leuchtkasten): weiche Flaeche hinter dem Schild, additiv
    const halo = put(new THREE.Mesh(new THREE.PlaneGeometry(signW + 2.2, signH + 1.6), new THREE.MeshBasicMaterial({ map: blobTex, color: lit.halo, transparent: true, opacity: 0.32, blending: THREE.AdditiveBlending, depthWrite: false })), -w / 2, 3.95, 0.2, false)
    halo.receiveShadow = false
    // Schornstein (beim Grill steigt dort Rauch auf, siehe smoke)
    put(new THREE.Mesh(new RoundedBoxGeometry(0.7, 1.3, 0.7, 2, 0.08), std(wallC.clone().multiplyScalar(0.8))), ax(w - 1.1), h + 0.75, -d + 1.2)
    const pl = kit.pointLight(g, [-w / 2, 2.1, 1.7], lightC, light, 8, 1.6)
    g.updateMatrixWorld(true)
    const world = (x, y, z) => g.localToWorld(new THREE.Vector3(x, y, z))
    const front = glow(lit.front, 5.5, world(-w / 2, 1.6, 1.0), 0.28)
    // Weg durch diese Tuer: etwas von der Angel weg versetzt, damit Schulter und Arm am offenen Blatt
    // vorbeigehen (die Figur ist fast so breit wie die Tuer)
    const walkA = size.door + 0.14
    const SWING = Math.PI / 2 + 0.06 // etwas ueber quer: das Blatt neigt sich von der Tuer weg
    return {
      g, hinge, leaf, open, light: pl, rot, name: shopName, sign: signInfo,
      // fuer Lichtwechsel (shine)
      signMat, winMat, halo, front,
      // Ecken des Schildes in der Welt (fuer den Pruefkasten: kit.project(shop.signCorners))
      signCorners: [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) => world(-w / 2 + sx * (signW + 0.18) / 2, 3.95 + sy * (signH + 0.18) / 2, 0.25)),
      hingeWorld: world(ax(hingeA), 0, 0.17),
      // Punkt vor der Tuer, gerade heraus: out < 0 drinnen, 0 Schwelle, > 0 draussen (Meter vor der Front)
      at: out => world(ax(walkA), 0, out),
      // Ueber dem Dach, zur Ecke hin (Herz), Schornstein (Rauch), ueber der Tuer (Glocke)
      top: world(ax(0.7), h + 1.75, -0.5), chimney: world(ax(w - 1.1), h + 1.5, -d + 1.2), bellPos: world(ax(0.35), 2.95, 0.2),
      // Tuerblatt: 0 zu, 1 ganz offen
      door: x => { hinge.rotation.y = open * SWING * x },
      // Licht: k < 0 dunkler (bis -1), k > 0 heller (bis 1); flash: kurzes Aufleuchten der Tuer
      shine: (k, flash = 0) => {
        signMat.color.setScalar(1 - 0.42 * Math.max(0, -k))
        winMat.color.setScalar(1 - 0.45 * Math.max(0, -k))
        halo.material.opacity = 0.32 * (1 + (k < 0 ? 0.7 * k : 0.7 * k))
        front.material.opacity = 0.28 * (1 + (k < 0 ? 0.7 * k : 0.6 * k))
        pl.intensity = light * (1 + (k < 0 ? 0.6 * k : 0.5 * k)) + 26 * flash
      }
    }
  }

  // ---------------------------------------------------------------- Die Spielzeugfigur
  // Kapsel als Rumpf, Kugel als Kopf, Kappe als Haar, Beine und Arme als kleine Kapseln. 1,3-fach so gross
  // wie ein echter Mensch, sonst ist sie aus der Hoehe der Kamera nur ein Punkt. Weicher Fleck darunter statt
  // Mondschatten, denn der Schatten wird nur einmal geworfen. Hell gekleidet (Papier) liest sie sich auf
  // dunklem Grund sofort; Nebenfiguren in gedeckten Farben, damit sie nicht ablenken.
  kit.person = ({ coat = PAL.coat, legs = PAL.legs, hair = PAL.hair, skin = PAL.skin, scale = 1.3, y0 = 0 } = {}) => {
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
    const at = (x, z, ry) => { fig.position.set(x, y0, z); fig.rotation.y = ry; blob.position.set(x, y0 + 0.02, z) }
    // Haltung aus walkCycle(...)
    const pose = c => { legL.rotation.x = c.legL; legR.rotation.x = c.legR; armL.rotation.x = c.armL; armR.rotation.x = c.armR; body.position.y = c.bob }
    // Kapseln (Mesh, Radius, Achslaenge) fuer Abstandspruefungen wie doorGap in iso-street
    const capsules = () => [[torso, 0.27, 0.42], [armL.children[0], 0.075, 0.42], [armR.children[0], 0.075, 0.42], [legL.children[0], 0.1, 0.5], [legR.children[0], 0.1, 0.5], [head, 0.22, 0]]
    return { fig, body, torso, head, legL, legR, armL, armR, blob, at, pose, capsules }
  }

  // ---------------------------------------------------------------- Das Herz
  // Umriss wie im 2D-Baustein shop-duel, Riss im Zickzack von der Kerbe zur Spitze. Es schwebt, pocht, pocht
  // kurz vor dem Bruch schneller (wie ein Herz unter Stress), zerbricht zu tc in zwei Haelften, die nach
  // aussen wegdrehen und fallen, und streut Splitter (Flugbahnen fest ausgewuerfelt, seed). tc = null: es
  // zerbricht nie (pocht nur). update(t, az) dreht es zur Kamera und gibt die Meshes zurueck, die fuer den
  // Pruefkasten zaehlen (die Haelften, solange sie mindestens halb zu sehen sind, wie im DOM).
  kit.heart = ({ pos, tc = null, color = PAL.heart, emissive = '#FF2E63', seed = 77 }) => {
    const k0 = 1 / 100, X = x => (x - 125) * k0, Y = y => (125 - y) * k0
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
    const hm = std(color, { emissive, emissiveIntensity: 0.5, roughness: 0.35 })
    const grp = new THREE.Group(); grp.position.copy(pos); scene.add(grp)
    const wholeM = new THREE.Mesh(geo(whole), hm); grp.add(wholeM)
    // Haelften drehen sich um ihre untere Ecke nach aussen weg und fallen
    const pivL = new THREE.Group(), pivR = new THREE.Group(); pivL.position.set(X(112), Y(214), 0); pivR.position.set(X(138), Y(214), 0)
    const hl = new THREE.Mesh(geo(shape(L, crackDown)), hm.clone()), hr = new THREE.Mesh(geo(shape(Rr, crackDown)), hm.clone())
    hl.position.set(-X(112), -Y(214), 0); hr.position.set(-X(138), -Y(214), 0)
    hl.material.transparent = hr.material.transparent = true
    pivL.add(hl); pivR.add(hr); grp.add(pivL, pivR)
    const SR = rng(seed), shards = []
    for (let i = 0; i < 8; i++) {
      const m = new THREE.Mesh(new THREE.TetrahedronGeometry(0.14 + SR() * 0.1), std(color, { emissive, emissiveIntensity: 0.6, transparent: true }))
      m.userData = { v: new THREE.Vector3((SR() - 0.5) * 5, 1.5 + SR() * 3, (SR() - 0.5) * 2), spin: new THREE.Vector3(SR() * 9, SR() * 9, SR() * 9) }
      m.visible = false; grp.add(m); shards.push(m)
    }
    const halo = glow(color, 5, pos, 0.3)
    // Ruhelage der Haelften (fuer das Auseinanderfallen)
    const X0L = pivL.position.x, X0R = pivR.position.x, Y0 = pivL.position.y
    const hv = new THREE.Vector3()
    const update = (t, az) => {
      grp.rotation.y = -az // immer zur Kamera
      const stress = tc != null && t > tc - 0.75 && t < tc
      grp.position.copy(pos).add(hv.set(0, 0.16 * Math.sin(t * 1.8), 0))
      const broken = tc != null && t >= tc
      wholeM.visible = !broken; pivL.visible = pivR.visible = broken
      shards.forEach(m => { m.visible = false })
      if (!broken) { grp.scale.setScalar(1 + (stress ? 0.1 * heartBeat((t - tc) * 16) : 0.05 * heartBeat(t * 5.5))); halo.material.opacity = 0.3; return [wholeM] }
      const k = t - tc, e = 1 - Math.pow(1 - clamp01(k / 0.55), 3), fall = Math.max(0, k - 0.22)
      grp.scale.setScalar(1 + 0.12 * Math.max(0, 1 - k / 0.15))
      pivL.rotation.z = 0.38 * e; pivR.rotation.z = -0.38 * e
      pivL.position.x = X0L - 0.3 * e; pivR.position.x = X0R + 0.3 * e
      pivL.position.y = pivR.position.y = Y0 - 2.4 * fall * fall
      const fade = 1 - clamp01((k - 0.45) / 0.6)
      hl.material.opacity = hr.material.opacity = fade; pivL.visible = pivR.visible = fade > 0.01
      halo.material.opacity = 0.3 * fade
      shards.forEach(m => { const d = m.userData; m.visible = k < 0.9; m.position.set(d.v.x * k, d.v.y * k - 6 * k * k, d.v.z * k); m.rotation.set(d.spin.x * k, d.spin.y * k, d.spin.z * k); m.material.opacity = 1 - clamp01(k / 0.9) })
      return fade >= 0.5 ? [hl, hr] : []
    }
    return { grp, wholeM, pivL, pivR, hl, hr, shards, halo, tc, update }
  }

  // ---------------------------------------------------------------- Ladenglocke und Rauch
  // Glocke ueber einer Tuer: ring(k) mit k = Sekunden seit dem Klingeln (gedaempfte Schwingung, zwei Schallringe)
  kit.bell = ({ pos, rot = 0 }) => {
    const bell = new THREE.Group(); bell.position.copy(pos); bell.rotation.y = rot; scene.add(bell)
    const swing = new THREE.Group(); bell.add(swing)
    const rings = []
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.5), std('#2A2260')); arm.position.set(0, 0.04, -0.12); bell.add(arm)
    const prof = [[0, -0.4], [0.07, -0.39], [0.17, -0.33], [0.2, -0.12], [0.22, -0.04], [0.24, 0]].map(([x, y]) => new THREE.Vector2(x, y))
    const cup = new THREE.Mesh(new THREE.LatheGeometry(prof, 20), std(PAL.bell, { metalness: 0.55, roughness: 0.3, emissive: '#6A4600', emissiveIntensity: 0.45, side: THREE.DoubleSide }))
    cup.rotation.x = Math.PI; cup.position.y = -0.42; swing.add(cup)
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), std(PAL.bell, { metalness: 0.6, roughness: 0.3 })); ball.position.y = -0.46; swing.add(ball)
    for (let i = 0; i < 2; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.035, 6, 32), new THREE.MeshBasicMaterial({ color: '#FFE2A8', transparent: true, opacity: 0, depthWrite: false })); r.position.y = -0.22; r.visible = false; bell.add(r); rings.push(r) }
    const ring = k => {
      swing.rotation.x = k > 0 ? 0.6 * Math.exp(-k * 3) * Math.sin(k * 19) : 0
      rings.forEach((r, i) => { const kk = k - i * 0.16, on = kk > 0 && kk < 0.6; r.visible = on; if (on) { r.scale.setScalar(0.6 + kk * 2.2); r.material.opacity = 0.75 * (1 - kk / 0.6) } })
    }
    return { group: bell, swing, rings, ring }
  }
  // Rauch aus einem Schornstein (Grill): n Wolken, die in einer festen Schleife aufsteigen (nur aus t)
  kit.smoke = ({ pos, n = 5, color = '#D9D3F2' }) => {
    const puffs = [], sv = new THREE.Vector3()
    for (let i = 0; i < n; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: blobTex, color, transparent: true, opacity: 0, depthWrite: false }))
      s.position.copy(pos); scene.add(s); puffs.push({ s, i })
    }
    const update = t => {
      for (const pf of puffs) {
        const ph = ((t * 0.42 + pf.i / puffs.length) % 1 + 1) % 1
        pf.s.position.copy(pos).add(sv.set(Math.sin(pf.i * 2.1 + t * 0.8) * 0.35, ph * 4.2, 0))
        const sz = 0.9 + ph * 2.4; pf.s.scale.set(sz, sz, 1)
        pf.s.material.opacity = 0.4 * Math.sin(ph * Math.PI)
      }
    }
    return { puffs, update }
  }

  // ---------------------------------------------------------------- Kamera
  // Langes Objektiv aus grosser Entfernung: Hauskanten bleiben fast senkrecht, das wirkt wie die isometrischen
  // Spielzeugstaedte der Vorbilder. Mit 30 Grad kippten die Haeuser am Rand nach aussen.
  // frame = { dist, dx, dy }: der Endausschnitt (von Hand vermessen wie in iso-street, oder aus fitFrame).
  // dx schiebt das Bild um so viele Pixel nach links (weg von der Knopfspalte), dy nach unten (oben stehen
  // die Woerter). set(t, o) faehrt von (1 + push) * dist auf dist heran, endet also IMMER im Ausschnitt;
  // push sagt nur, wie weit sie vorher weg war, und kann nichts abschneiden. Frueher fuhr iso-street ueber
  // den Ausschnitt hinaus, und bei push 0,25 waren "...sse Sonne" und "Café M..." angeschnitten.
  // o: push (0..0,25), orbit (Grad, die sie sich dreht), az/el (Blickwinkel in Grad am Anfang der Drehung
  // gemessen von der Mitte), elDrop (Grad, um die sie sich senkt), aim(az, target) (stellt das Ziel; ohne:
  // Ursprung), fog ([vorn, hinten] hinter dem Ziel; der Dunst wandert mit der Entfernung).
  kit.isoCamera = ({ fov = 22, near = 20, far = 600, frame }) => {
    const camera = new THREE.PerspectiveCamera(fov, W / H, near, far)
    camera.setViewOffset(W, H, frame.dx, -frame.dy, W, H)
    kit.camera = camera
    const target = new THREE.Vector3()
    const set = (t, { push = 0, orbit = 0, az = 45, el = 34, elDrop = 1.5, aim = null, fog: fg = [24, 118] } = {}) => {
      const u = travel(t, ctx.s, ctx.e)
      const dist = frame.dist * (1 + push * (1 - u)), a = THREE.MathUtils.degToRad(az + orbit / 2 - orbit * u), e = THREE.MathUtils.degToRad(el - elDrop * u)
      if (aim) aim(a, target); else target.set(0, 0, 0)
      camera.position.set(target.x - dist * Math.cos(e) * Math.sin(a), target.y + dist * Math.sin(e), target.z + dist * Math.cos(e) * Math.cos(a))
      camera.lookAt(target)
      // Dunst beginnt hinter der Szene, so dass die Haeuser dahinter noch als Formen zu lesen sind
      if (scene.fog && fg) { scene.fog.near = dist + fg[0]; scene.fog.far = dist + fg[1] }
      return a
    }
    return { camera, target, set }
  }
  // Ziel, das beim Drehen mittig haelt: der Mittelwert der Punkte quer zur Blickrichtung (die Tiefe zaehlt
  // nicht). Ohne das laeuft beim orbit eins der Dinge zum Bildrand hinaus. iso-street hat die Formel fuer
  // genau zwei Fronten von Hand (Mittel der beiden aeusseren Ladenecken) und behaelt sie, damit sein Bild
  // Pixel fuer Pixel gleich bleibt.
  kit.aimAcross = (points, y = 0) => (a, target) => {
    const rx = Math.cos(a), rz = Math.sin(a); let c = 0
    for (const p of points) c += p.x * rx + p.z * rz
    c /= points.length
    target.set(c * rx, y, c * rz)
  }
  // Rechnet den Endausschnitt { dist, dx, dy } so, dass die Punkte (Ecken von Schildern, Herz, Figurwegen)
  // ueber die GANZE Fahrt (alle push-, orbit- und elDrop-Stellungen) in rect liegen und ihn so gut wie
  // moeglich fuellen: das 9:16-Bild ist dann von den wichtigen Dingen gefuellt, nicht von Leere. Die Welt
  // drumherum (Boden, Haeuser, Dunst) muss weiter reichen als der Ausschnitt.
  // box: wo der Umriss aller Stellungen im Bild landet. Danach mit test_3d-artigem Durchlauf nachpruefen.
  kit.fitFrame = (points, { fov = 22, rect = FIT, push = 0, orbit = 0, az = 45, el = 34, elDrop = 1.5, aim = null, samples = 9 } = {}) => {
    const cam = new THREE.PerspectiveCamera(fov, W / H, 0.1, 1e5), tgt = new THREE.Vector3(), pv = new THREE.Vector3()
    const union = D => {
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity, behind = false
      for (let i = 0; i < samples; i++) {
        const u = samples > 1 ? i / (samples - 1) : 1
        const dist = D * (1 + push * (1 - u)), a = THREE.MathUtils.degToRad(az + orbit / 2 - orbit * u), e = THREE.MathUtils.degToRad(el - elDrop * u)
        if (aim) aim(a, tgt); else tgt.set(0, 0, 0)
        cam.position.set(tgt.x - dist * Math.cos(e) * Math.sin(a), tgt.y + dist * Math.sin(e), tgt.z + dist * Math.cos(e) * Math.cos(a))
        cam.lookAt(tgt); cam.updateMatrixWorld()
        for (const p of points) {
          pv.copy(p).project(cam); if (pv.z >= 1 || pv.z <= -1) behind = true
          const x = (pv.x + 1) / 2 * W, y = (1 - pv.y) / 2 * H
          x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y)
        }
      }
      return { x0, y0, x1, y1, behind }
    }
    const fits = D => { const b = union(D); return !b.behind && b.x1 - b.x0 <= rect.right - rect.left && b.y1 - b.y0 <= rect.bottom - rect.top }
    // Kamera ausserhalb der Kugel um alle Punkte anfangen, sonst stehen Punkte hinter ihr
    if (aim) aim(THREE.MathUtils.degToRad(az), tgt); else tgt.set(0, 0, 0)
    let lo = 1; for (const p of points) lo = Math.max(lo, p.distanceTo(tgt) * 1.2)
    let hi = lo * 2; while (!fits(hi) && hi < 1e4) hi *= 2
    if (fits(lo)) hi = lo
    else for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; if (fits(mid)) hi = mid; else lo = mid }
    const b = union(hi)
    const dx = (b.x0 + b.x1) / 2 - (rect.left + rect.right) / 2, dy = (rect.top + rect.bottom) / 2 - (b.y0 + b.y1) / 2
    const r1 = v => Math.round(v * 10) / 10
    return { dist: r1(hi * 1.002), dx: r1(dx), dy: r1(dy), box: [b.x0 - dx, b.y0 + dy, b.x1 - dx, b.y1 + dy].map(r1) }
  }

  // ---------------------------------------------------------------- Pruefkaesten
  // Ein unsichtbarer Kasten je wichtigem Ding, genau dort, wo die Kamera es hinwirft. Ist das Ding nicht zu
  // sehen (setSafe(key, null)), verliert der Kasten data-safe und zaehlt fuer keine Pruefung. apart: Dinge
  // derselben Gruppe (name) duerfen sich im Bild nicht ueberdecken (Schilder, Herz).
  const boxes = {}
  kit.safeBox = (key, label, apart = false) => { const e = ctx.el('div', cls('k3-box')); wrap.append(e); boxes[key] = { e, label, apart } }
  const setSafe = kit.setSafe = (key, r) => {
    const b = boxes[key]; if (!b) return
    if (!r) { b.e.removeAttribute('data-safe'); b.e.removeAttribute('data-apart'); b.e.style.display = 'none'; return }
    b.e.dataset.safe = b.label
    if (b.apart) { b.e.dataset.apart = name; b.e.dataset.label = b.label }
    const [x0, y0, x1, y1] = r.map(v => Math.round(v * 10) / 10)
    b.e.style.cssText = `display:block;left:${x0}px;top:${y0}px;width:${Math.max(1, x1 - x0)}px;height:${Math.max(1, y1 - y0)}px`
  }
  kit.clearSafe = () => { for (const k of Object.keys(boxes)) setSafe(k, null) }
  const pv = new THREE.Vector3(), bb = new THREE.Box3()
  // Weltpunkte -> Umriss im Bild [x0, y0, x1, y1] in Buehnenpunkten (mit der Kamera von isoCamera)
  const project = kit.project = pts => {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
    for (const q0 of pts) {
      pv.copy(q0).project(kit.camera)
      const x = (pv.x + 1) / 2 * W, y = (1 - pv.y) / 2 * H
      x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y)
    }
    return [x0, y0, x1, y1]
  }
  const corners = kit.corners = box => { const a = box.min, b = box.max, out = []; for (const x of [a.x, b.x]) for (const y of [a.y, b.y]) for (const z of [a.z, b.z]) out.push(new THREE.Vector3(x, y, z)); return out }
  kit.meshBox = meshes => { bb.makeEmpty(); for (const m of meshes) bb.expandByObject(m); return bb.isEmpty() ? null : project(corners(bb)) }

  // ---------------------------------------------------------------- Zeit, Zeichnen
  kit.sync = () => { scene.updateMatrixWorld(); if (kit.camera) kit.camera.updateMatrixWorld() }
  let shadowDone = false
  kit.render = () => {
    // Ohne Kamera warf three.js nur "Cannot read properties of null"; so steht da, was fehlt
    if (!kit.camera) ctx.fail('3D-Baukasten: erst kit.isoCamera(...) anlegen, dann zeichnen (kit.run)')
    renderer.toneMappingExposure = exposure
    // Schatten je Szene einmal: der Renderer ist geteilt, das Flag gilt fuer die naechste Szene, die er rechnet
    if (!shadowDone) { renderer.shadowMap.needsUpdate = true; shadowDone = true }
    renderer.render(scene, kit.camera)
    // Bild abgeben statt kopieren; die Leinwand zeigt es, bis diese Szene das naechste rechnet (paint: false
    // laesst es also stehen, wie es die Bewegungsprobe braucht)
    g2.transferFromImageBitmap(glc.transferToImageBitmap())
  }
  // fn(t) stellt die Szene auf t (Kamera, Figuren, Kaesten), ohne zu zeichnen; gezeichnet wird danach nur,
  // solange die Szene zu sehen sein kann (mit pad Sekunden Luft fuer Ein- und Ausblenden). In der Ruhelage
  // (?rest=1, fuer die Pruefungen) steht die Szene auf ihrem Anfang.
  kit.run = (fn, { pad = 0.8 } = {}) => {
    const visibleFrom = ctx.sceneStart - pad, visibleTo = ctx.sceneEnd + pad
    ctx.place(t0 => {
      const t = ctx.rest ? ctx.s : t0
      kit.shown = t >= visibleFrom && t <= visibleTo
      if (!kit.shown) { kit.clearSafe(); return }
      // Beim Wechsel in die naechste Szene dunkelt das Bild ab (ab 0,06 s vor dem Wechsel, 0,2 s lang). Warum:
      // die alte Szene blendet 0,28 s aus, waehrend die neue schon einblendet. In 2D liegt dabei Dunkel auf
      // Dunkel; im Doener-Video (17.11.2026) stand die halb durchsichtige Wochenleiste dagegen rund 0,25 s
      // lang ueber der hellen 3D-Stadt, und "Woche 1" bis "Woche 4" waren davor kaum zu lesen. Nicht am Ende
      // des Videos: dort folgt nichts, und das Schlussbild soll stehen bleiben.
      if (dimEl) {
        const leaves = !(ctx.isLast && ctx.e >= ctx.sceneEnd - 1e-6)
        dimEl.style.opacity = leaves && t > ctx.e - 0.06 ? (0.8 * smooth((t - ctx.e + 0.06) / 0.2)).toFixed(3) : '0'
      }
      // 2D-Kamerafahrt der Szene aufheben (siehe .k3-wrap)
      const illScale = illEl ? parseFloat(getComputedStyle(illEl).scale) : 1
      wrap.style.scale = illScale > 0 ? String(1 / illScale) : ''
      fn(t)
    })
    ctx.frame(() => { if (kit.shown) kit.render() })
  }
  // Nur fuer Tests: rechnet das Bild einmal mit und einmal ohne obj und gibt zurueck, wo sich Pixel aendern
  // (in Buehnenpunkten). So prueft ein Test, ob der Pruefkasten wirklich auf dem Ding liegt.
  kit.drawnBox = obj => {
    if (!obj || !obj.visible) return null
    const gl = renderer.getContext(), cw = glc.width, chh = glc.height
    const grab = () => { renderer.render(scene, kit.camera); const px = new Uint8Array(cw * chh * 4); gl.readPixels(0, 0, cw, chh, gl.RGBA, gl.UNSIGNED_BYTE, px); return px }
    renderer.toneMappingExposure = exposure
    const with1 = grab(); obj.visible = false; const without = grab(); obj.visible = true; kit.render()
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity, n = 0
    for (let row = 0; row < chh; row++) for (let x = 0; x < cw; x++) {
      const i = (row * cw + x) * 4
      if (Math.abs(with1[i] - without[i]) + Math.abs(with1[i + 1] - without[i + 1]) + Math.abs(with1[i + 2] - without[i + 2]) < 30) continue
      const y = chh - 1 - row // readPixels liest von unten nach oben
      n++; x0 = Math.min(x0, x); x1 = Math.max(x1, x + 1); y0 = Math.min(y0, y); y1 = Math.max(y1, y + 1)
    }
    return n ? { left: x0 / ss, top: y0 / ss, right: x1 / ss, bottom: y1 / ss, pixels: n } : null
  }
  return kit
}
