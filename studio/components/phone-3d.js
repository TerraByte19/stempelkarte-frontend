// Das Handy in 3D: ein Smartphone schwebt leicht gedreht in einem weich beleuchteten lila Raum (dahinter
// eine Abendstrasse in Unschaerfe und Lichtpunkte wie aus einem Objektiv, nie eine leere Flaeche). Auf dem
// Bildschirm eine von drei Ansichten:
//   wallet  die Wallet mit der Karte des Ladens: die Karte gleitet hinein, Stempel springen auf, ein
//           Scan-Rahmen faehrt ueber den QR-Code und setzt einen Haken (A1, A3, B1, B2)
//   lock    der Sperrbildschirm: die Karte meldet sich von selbst, genau mit dem Wortlaut aus C1
//           ("Noch 2 Stempel bis: Gratis-Döner" oder "Gratis-Döner wartet auf dich"), mit einem
//           sanften Lichtpuls. Nie "vibriert" o. ae. im Bild (PRODUKT.md, C1)
//   design  die Karte entsteht: erst grau, auf "paint" die Farben, auf "logo" das Logo, auf "symbol"
//           die Symbole in den Stempelfeldern (D1), wie die Option "design" von wallet-pass
// Warum ein eigener Baustein statt wallet-pass/lock-notification: der Betreiber will "so wenig 2D wie
// moeglich" (17.11.2026). Gleiche Geschichte, aber als 3D-Bild in derselben Welt wie iso-street
// (engine/kit3d.js: Palette, Nachtlicht, geteilter Renderer, Pruefkaesten).
//
// Wie das Bild entsteht: was sich NICHT bewegt (Wallet-Oberflaeche, Sperrbildschirm, Karte, Hintergrund),
// ist einmal beim Bauen in eine 2D-Leinwand gemalt und liegt als Textur auf flachen Koerpern. Was sich
// bewegt (Karte, Stempel, Haken, Scan-Linie, Benachrichtigung, Logo), ist ein eigener kleiner 3D-Koerper
// davor. So wird in keinem Bild eine Textur neu gemalt oder hochgeladen (kostet in SwiftShader je Bild ein
// Vielfaches), und jedes Bild ist eine reine Funktion von t: Stellung, Groesse und Deckkraft kommen nur aus
// t und den Ankern. Kein Math.random, keine Uhr (tools/test_3d_phone_3d.mjs prueft gleiche Pixel nach
// Spruengen und auf einer zweiten Seite).
//
// Lesbarkeit: die Kamera endet in einem vermessenen Rahmen (RECT unten, mit kit.fitFrame ueber die ganze
// Fahrt gerechnet), in dem das Handy rund 1250 px hoch ist. Die Schrift auf der Karte ist relativ zur Karte
// groesser gesetzt als in wallet-pass (Name 76, Belohnung 62 von 1000), damit sie auf dem Handy des
// Zuschauers groesser steht als in 2D (gemessen im Test, 18.11.2026: Name 38 px, Belohnung 31 px, Text der
// Benachrichtigung 33 px; wallet-pass hat 30 und 23 px, lock-notification 25 px).
//
// Pruefungen: die Leinwand ist fuer die Pruefungen des Studios nur eine Flaeche. Deshalb liegen unsichtbare
// Kaesten (kit.safeBox) auf Karte, Ladenname, Belohnung, QR-Code bzw. Uhr, Datum und Benachrichtigung,
// genau dort, wo die Kamera sie hinwirft. Das Handy selbst bekommt keinen Kasten: sein unteres Ende darf
// unter 1536 px reichen (dort liegt nur der Rand des Geraets, nichts zu lesen).
import { QR } from '../engine/qr.js'

// Tonhoehe der Stempel-Pops wie in wallet-pass: jeder zwei Halbtoene hoeher
const PITCH = i => +(2 ** (i * 2 / 12)).toFixed(2)

// Geraete in Zentimetern (eine Einheit = 1 cm). Seitenverhaeltnis wie echte Geraete; das iPhone mit runden
// Ecken und Insel, das Android-Handy mit flacheren Ecken, Kamera als Loch und Gestenleiste. Warum zwei: im
// Salon-Video (17.11.2026) beantwortete ein iPhone mit Insel die Frage "Und Kundinnen ohne iPhone?".
const DEV = {
  iphone: { W: 7.2, H: 14.8, T: 0.84, R: 1.16, bezel: 0.26, title: 'Wallet' },
  android: { W: 7.2, H: 15.1, T: 0.86, R: 0.78, bezel: 0.24, title: 'Google Wallet' }
}
// Endausschnitt je Ansicht (fitFrame legt die Ecken des Handys ueber die ganze Fahrt hinein). Oben bleibt
// Platz fuer die Textzeilen (Stil C: ein Wort, bis etwa 440 px), rechts endet alles Wichtige vor x = 940
// (Knopfspalte von TikTok ab 950). Unten darf der Rand des Geraets bis 1760 reichen: so fuellt das Handy
// das Bild, und die Karte liegt trotzdem ganz zwischen 600 und 1536.
const RECT = {
  wallet: { left: 140, right: 910, top: 452, bottom: 1760 },
  design: { left: 140, right: 910, top: 452, bottom: 1760 },
  // Sperrbildschirm: naeher heran, die Benachrichtigung ist das, was gelesen werden muss. Unten reicht das
  // Handy bis knapp an den Rand (darunter liegt nur Hintergrund und Taschenlampe/Kamera).
  lock: { left: 96, right: 936, top: 470, bottom: 1905 }
}
// Kamera: Blick fast gerade von vorn, etwas von oben (el), langes Objektiv wie im Baukasten
const CAM = { az: 0, el: 6, elDrop: 2, fov: 22 }

// Gedankenstriche (Geviert und Halbgeviert) sind in Texten fuer Nutzer nicht erlaubt (Hausregel, wie checks.mjs)
const DASH = /[\u2012-\u2015]/

export default {
  title: 'Handy in 3D: Wallet-Karte, Sperrbildschirm oder Kartendesign',
  use: 'Ein Smartphone schwebt leicht gedreht in einem lila Raum mit Lichtpunkten, die Kamera dreht sich langsam und fährt heran. Ansicht "wallet": die Karte gleitet in die Wallet, Stempel springen auf, Scan über dem QR-Code. "lock": der Sperrbildschirm, die Karte meldet sich von selbst mit dem Wortlaut aus C1 ("Noch 2 Stempel bis: Gratis-Döner"), mit sanftem Lichtpuls. "design": die Karte entsteht (grau, Farben, Logo, Symbole). 3D-Gegenstück zu wallet-pass und lock-notification; rechnet etwa 1 s je Bild (ohne Grafikkarte).',
  params: {
    mode: { default: 'wallet', doc: '"wallet" (Karte in der Wallet, Stempel, Scan), "lock" (Sperrbildschirm mit Benachrichtigung, C1) oder "design" (die Karte entsteht, D1)' },
    device: { default: 'iphone', doc: '"iphone" (Insel oben, Überschrift "Wallet") oder "android" (Kamera als Loch, Gestenleiste, Überschrift "Google Wallet")' },
    shop: { default: 'Döner Palast', doc: 'Name des Ladens auf der Karte und als Absender der Benachrichtigung (höchstens etwa 18 Zeichen, sonst wird er kleiner gesetzt und der Bau warnt)', same: 'Ladenname' },
    location: { default: '', doc: 'Kürzel rechts oben auf der Karte (Stadt-Viertel, Großbuchstaben, höchstens etwa 12 Zeichen). Leer = keins, dann steht der Name größer' },
    icon: { default: 'kebab', doc: 'Symbol in Logo und Stempeln: cup, bread, scissors, star, heart, check, kebab', same: 'Symbol' },
    colors: { default: '', doc: 'Eigene Farben der Karte, zwei Farben für den Verlauf: "#B8507A,#6E2449" (PRODUKT.md D1). Leer = Stampit-Lila' },
    stamps: { default: 10, doc: 'Felder auf der Karte, 4 bis 10', same: 'Stempelzahl' },
    before: { default: 6, doc: 'Stempel, die schon da sind. In "design" die Stempel der fertigen Karte' },
    after: { default: 8, doc: 'Stempel am Ende der Szene (nur "wallet"). Jeder neue braucht einen Anker (stamp1, stamp2, ...)' },
    reward: { default: 'Gratis-Döner', doc: 'Die Belohnung, kurz (höchstens etwa 16 Zeichen). Steht auf der Karte ("10 Stempel = 1 Gratis-Döner") und in der Benachrichtigung ("Noch 2 Stempel bis: Gratis-Döner")' },
    line: { default: '', doc: 'Eigene Belohnungszeile auf der Karte (höchstens etwa 30 Zeichen). Leer = "{stamps} Stempel = 1 {reward}"' },
    left: { default: 2, doc: 'Nur "lock": wie viele Stempel noch fehlen. 0 = die Karte ist voll, dann steht "{reward} wartet auf dich" da (C1)' },
    clock: { default: '18:42', doc: 'Nur "lock": Uhrzeit auf dem Sperrbildschirm' },
    date: { default: 'Dienstag, 17. November', doc: 'Nur "lock": Datumszeile über der Uhr, ohne Jahr (höchstens etwa 24 Zeichen)' },
    when: { default: 'jetzt', doc: 'Nur "lock": Zeitangabe rechts oben in der Benachrichtigung' },
    wake: { default: true, doc: 'Nur "lock": der Bildschirm ist vorher gedimmt und leuchtet mit der Benachrichtigung auf' },
    walletTitle: { default: '', doc: 'Überschrift der Wallet. Leer = "Wallet" (iphone) bzw. "Google Wallet" (android)' },
    rise: { default: true, doc: 'Das Handy steigt am Anfang von unten ins Bild und dreht sich dabei ein (Anker "rise"). false: es schwebt vom ersten Bild an da' },
    drop: { default: true, doc: 'Nur "wallet": die Karte gleitet auf "card" von links in die Wallet. false: sie liegt schon drin' },
    scan: { default: true, doc: 'Nur "wallet": Scan-Rahmen, Scan-Linie und Haken über dem QR-Code auf "scan"' },
    angle: { default: 14, doc: 'Wie weit das Handy zur Seite gedreht ist, in Grad (-24 bis 24; negativ = andersherum)' },
    push: { default: 0.12, doc: 'Wie weit die Kamera während der Szene heranfährt (0 bis 0,25). Sie endet immer im selben Ausschnitt' },
    orbit: { default: 10, doc: 'Um wie viele Grad sich die Kamera während der Szene dreht (0 bis 14)' },
    deko: { default: true, doc: 'Drei schwebende Stempel-Münzen neben dem Handy (Spielzeug-Look). false: nur Handy und Lichtpunkte' },
    tones: { default: true, doc: 'Eigene Töne (pop, scan, ok, ding, sparkle). false, wenn das Skript Klänge aus der Bibliothek setzt' }
  },
  captions: { min: 1 },
  anchors: p => {
    const a = {}
    if (p.rise) a.rise = { at: 'start', offset: 0, doc: 'Das Handy steigt von unten ins Bild (0,9 s, dreht sich dabei ein)' }
    if (p.mode === 'wallet') {
      if (p.drop) a.card = { cap: 0, word: 1, doc: 'Die Karte gleitet von links in einem flachen Bogen in die Wallet und legt sich auf das Glas (Ton: pop, wenn sie liegt). Auf "Karte" o. ä.' }
      if (p.scan) a.scan = { cap: -1, word: 0, doc: 'Scan-Rahmen und Scan-Linie über dem QR-Code (Ton: scan), 0,95 s später der Haken (Ton: ok). Auf "scannen"' }
      for (let i = 0; i < Math.max(0, p.after - p.before); i++) a['stamp' + (i + 1)] = { cap: -1, word: 1 + i, doc: `Stempel ${i + 1} springt auf die Karte (Ton: pop, jeder etwas höher)` }
    }
    if (p.mode === 'lock') a.notify = { cap: 0, word: 2, doc: 'Die Benachrichtigung gleitet herein, der Bildschirm leuchtet auf, ein sanfter Lichtpuls (Ton: ding). Auf "meldet" o. ä.' }
    if (p.mode === 'design') Object.assign(a, {
      paint: { cap: 0, word: 1, doc: 'Die graue Karte färbt sich von links nach rechts in den Farben des Ladens (Ton: sparkle). Auf "Farben"' },
      logo: { cap: 0, word: 3, doc: 'Das Logo springt in die Karte (Ton: pop). Auf "Logo"' },
      symbol: { cap: -1, word: 1, doc: 'Die Stempelfelder bekommen ihr Symbol, eins nach dem anderen (Ton: pop). Auf das Wort, das das Symbol nennt' }
    })
    return a
  },
  demo: {
    params: { mode: 'wallet', shop: 'Döner Palast', icon: 'kebab', stamps: 10, before: 6, after: 8 },
    captions: [{ lines: ['Die Karte liegt', 'in der Wallet.'], accent: 3 }, { lines: ['Jeder Besuch', 'ein Stempel.'], accent: 2 }],
    at: { cap: 1, word: -1, offset: 0.9 }
  },
  async build(ctx) {
    const { p } = ctx
    // ---------------------------------------------------------------- Angaben pruefen (klar benennen statt still falsch zeichnen)
    if (!['wallet', 'lock', 'design'].includes(p.mode)) ctx.fail('"mode" ist "wallet", "lock" oder "design"')
    if (!DEV[p.device]) ctx.fail('"device" ist "iphone" oder "android"')
    if (!Number.isInteger(p.stamps) || p.stamps < 4 || p.stamps > 10) ctx.fail('"stamps" muss zwischen 4 und 10 liegen')
    if (!(Number.isInteger(p.before) && p.before >= 0 && p.before <= p.stamps)) ctx.fail('"before" muss zwischen 0 und "stamps" liegen')
    if (p.mode === 'wallet' && !(Number.isInteger(p.after) && p.after >= p.before && p.after <= p.stamps)) ctx.fail('es muss gelten: before <= after <= stamps')
    if (p.mode === 'lock' && !(Number.isInteger(p.left) && p.left >= 0 && p.left <= 20)) ctx.fail('"left" ist die Zahl der fehlenden Stempel, 0 bis 20')
    if (!(p.angle >= -24 && p.angle <= 24)) ctx.fail('"angle" muss zwischen -24 und 24 Grad liegen (mehr, und die Schrift auf dem Bildschirm wird schräg unlesbar)')
    if (!(p.push >= 0 && p.push <= 0.25)) ctx.fail('"push" muss zwischen 0 und 0,25 liegen')
    if (!(p.orbit >= 0 && p.orbit <= 14)) ctx.fail('"orbit" muss zwischen 0 und 14 Grad liegen')
    let colors = [ctx.B.cardFrom, ctx.B.cardTo]
    if (p.colors) {
      colors = String(p.colors).split(',').map(x => x.trim())
      if (colors.length !== 2 || !colors.every(c => /^#[0-9a-fA-F]{6}$/.test(c))) ctx.fail('"colors" sind zwei Farben wie "#B8507A,#6E2449"')
    }
    const D = DEV[p.device], android = p.device === 'android'
    const line = p.line || `${p.stamps} Stempel = 1 ${p.reward}`
    // Wortlaut aus C1 (Backend: ApplePassService, sperrbildschirmOrte), Stempel ist Einzahl wie Mehrzahl
    const msg = p.left > 0 ? `Noch ${p.left} Stempel bis: ${p.reward}` : `${p.reward} wartet auf dich`
    const title = p.walletTitle || D.title
    for (const [k, v] of [['shop', p.shop], ['reward', p.reward], ['line', line], ['date', p.date], ['walletTitle', title]]) if (DASH.test(v)) ctx.fail(`"${k}" enthält einen Gedankenstrich. Normalen Bindestrich nehmen.`)
    if (/vibrier|brumm|summ/i.test(msg + line)) ctx.fail('Die Benachrichtigung sagt nie, dass das Handy vibriert (PRODUKT.md, C1)')

    const K = await import('../engine/kit3d.js')
    const { PAL, rng, clamp01, smooth, lerp } = K
    // Kein Dunst: die Szene ist nah (Kamera rund 60 cm vor dem Handy), Tiefe kommt aus dem gemalten Hintergrund
    const kit = await K.createKit(ctx, { name: 'phone-3d', prefix: 'ph', fog: false })
    const { THREE, scene, canvasTex, col } = kit
    const v3 = (x, y, z) => new THREE.Vector3(x, y, z)
    // Weich hinaus mit leichtem Ueberschwingen (wie EASE.BACK in 2D, aber als Formel: Zeit ist hier t)
    const backOut = (x, s = 1.25) => { x = clamp01(x); const u = x - 1; return 1 + (s + 1) * u * u * u + s * u * u }
    const outCubic = x => { x = clamp01(x); return 1 - Math.pow(1 - x, 3) }

    // ---------------------------------------------------------------- Schrift
    const FD = ctx.B.display, FB = ctx.B.body
    const allText = [p.shop, p.location, line, msg, p.reward, p.clock, p.date, p.when, title, '0123456789:'].join(' ')
    await Promise.all([kit.fonts(allText, 700), kit.fonts(allText, 500), ...[500, 600, 700].map(w => document.fonts.load(`${w} 100px ${FB}`, allText))])
    // Groesste Schrift, die in die Breite passt (in 3-%-Schritten kleiner), gibt die Groesse zurueck
    const fitFont = (g, text, font, start, maxW, min) => { let s = start; g.font = font(s); while (g.measureText(text).width > maxW && s > min) { s = Math.max(min, Math.floor(s * 0.97)); g.font = font(s) } return s }
    const rr = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r) }

    // ---------------------------------------------------------------- Formen
    // Abgerundetes Rechteck um die Mitte (echte Kreisboegen; RoundedBoxGeometry rundet alle Kanten gleich und
    // haette bei 0,8 cm Dicke hoechstens 0,4 cm Eckradius erlaubt: das sah nach Ziegelstein aus, nicht nach Handy)
    const rrShape = (w, h, r) => {
      const s = new THREE.Shape(), x = -w / 2, y = -h / 2
      s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0)
      s.lineTo(x + w, y + h - r); s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2)
      s.lineTo(x + r, y + h); s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI)
      s.lineTo(x, y + r); s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5)
      return s
    }
    // UV so, dass eine Textur genau das Rechteck w x h fuellt (three.js gibt Formen ihre x/y als UV)
    const fitUV = (geo, w, h, from = 0, count = Infinity) => {
      const pos = geo.attributes.position, uv = geo.attributes.uv
      for (let i = from; i < Math.min(pos.count, from + count); i++) uv.setXY(i, (pos.getX(i) + w / 2) / w, (pos.getY(i) + h / 2) / h)
      uv.needsUpdate = true; return geo
    }
    const flat = (w, h, r, seg = 24) => fitUV(new THREE.ShapeGeometry(rrShape(w, h, r), seg), w, h)
    // Duenne Platte mit runden Ecken und weicher Kante; Deckel (Gruppe 0) traegt die Textur
    const slab = (w, h, r, depth, bev, seg = 20) => {
      const geo = new THREE.ExtrudeGeometry(rrShape(w - 2 * bev, h - 2 * bev, Math.max(0.01, r - bev)), { depth, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 3, curveSegments: seg })
      geo.translate(0, 0, -depth / 2)
      const g0 = geo.groups[0]; fitUV(geo, w - 2 * bev, h - 2 * bev, g0.start, g0.count)
      return geo
    }

    // ---------------------------------------------------------------- Umgebung fuer Spiegelungen am Rahmen
    // Metall ohne Umgebung sieht schwarz aus (es spiegelt nur, was da ist). Eine kleine gemalte Umgebung:
    // oben weiches lila Himmelslicht, links ein warmer Streifen (Ladenlicht), rechts ein kuehles Lichtfeld.
    // three.js rechnet sie selbst in eine vorgefilterte Umgebung um (einmal je Seite).
    const envTex = canvasTex(512, 256, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#6F66C8'); gr.addColorStop(0.45, '#2A2160'); gr.addColorStop(1, '#0B0820')
      g.fillStyle = gr; g.fillRect(0, 0, w, h)
      g.filter = 'blur(10px)'
      g.fillStyle = '#FFC98A'; g.fillRect(w * 0.18, h * 0.28, w * 0.07, h * 0.36)
      g.fillStyle = '#D9D3FF'; g.fillRect(w * 0.62, h * 0.2, w * 0.12, h * 0.3)
      g.fillStyle = '#FFFFFF'; g.fillRect(w * 0.42, h * 0.04, w * 0.16, h * 0.08)
      g.filter = 'none'
    })
    envTex.mapping = THREE.EquirectangularReflectionMapping

    // ---------------------------------------------------------------- Licht
    // Mond von hinten oben rechts: Kante am Rahmen. Warmes Licht von links unten (wie aus einem Laden),
    // kuehles Lila von rechts: der Rahmen faengt beide, wie die Laeden in iso-street warm und lila leuchten.
    // Kein Schatten: das Handy schwebt, unter ihm ist nichts, worauf einer fallen koennte.
    kit.nightLights({ hemi: 1.1, moon: { shadow: false, pos: [16, 30, -24], intensity: 2.4 }, fill: { pos: [-14, 10, 30], intensity: 0.75 } })
    const warm = new THREE.DirectionalLight('#FFB46A', 1.5); warm.position.set(-30, -8, 14); scene.add(warm)
    const cool = new THREE.DirectionalLight('#B9B0FF', 1.3); cool.position.set(30, 6, -6); scene.add(cool)

    // Weicher Schein hinter dem Handy: trennt es vom Hintergrund (Leuchtkasten-Prinzip wie die Schilder)
    const halo = kit.glow('#7C6CFF', 30, v3(0, 0, -6), 0.26)
    // Weicher Fleck als alphaMap fuer Schatten: alphaMap liest den Gruenkanal, also der Verlauf in der FARBE
    // (weiss bis schwarz, deckend). kit.blobTex hat ihn nur im Alphakanal und gaebe eine harte Scheibe.
    const softTex = canvasTex(128, 128, (g, w) => { const r = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); r.addColorStop(0, '#FFFFFF'); r.addColorStop(0.45, '#9A9A9A'); r.addColorStop(1, '#000000'); g.fillStyle = r; g.fillRect(0, 0, w, w) }, { srgb: false })

    // ---------------------------------------------------------------- Das Handy
    const { W, H, T, R: CR } = D
    const phone = new THREE.Group(); scene.add(phone)
    const frameMat = kit.std('#5A4FB8', { metalness: 0.82, roughness: 0.3, envMap: envTex, envMapIntensity: 1.15 })
    const glassMat = kit.std('#07060F', { metalness: 0, roughness: 0.12, envMap: envTex, envMapIntensity: 0.8 })
    const bev = 0.16
    const body = new THREE.Mesh(slab(W, H, CR, T - 2 * bev, bev, 32), [glassMat, frameMat]); phone.add(body)
    // Tasten: Lautstaerke links, Seitentaste rechts (machen aus der Platte ein Telefon)
    const btn = (x, y, len) => { const b = new THREE.Mesh(new kit.RoundedBoxGeometry(0.14, len, 0.34, 2, 0.06), frameMat); b.position.set(x, y, 0); phone.add(b) }
    btn(-W / 2 - 0.02, 3.4, 1.1); btn(-W / 2 - 0.02, 2.0, 1.1); if (!android) btn(-W / 2 - 0.02, 4.75, 0.6)
    btn(W / 2 + 0.02, android ? 2.2 : 2.9, android ? 1.0 : 1.7); if (android) btn(W / 2 + 0.02, 4.0, 1.6)
    const FRONT = T / 2 // Vorderseite des Glases

    // ---------------------------------------------------------------- Bildschirm (eine gemalte Textur)
    const SW = W - 2 * D.bezel, SH = H - 2 * D.bezel, SR = CR - D.bezel * 0.9
    const DW = 1000, DH = Math.round(DW * SH / SW)          // Entwurfsraum des Bildschirms (Bildpunkte)
    const TW = 1024, TH = Math.round(TW * SH / SW), TS = TW / DW
    const ux = xd => -SW / 2 + xd / DW * SW, uy = yd => SH / 2 - yd / DH * SH   // Entwurf -> cm im Handy
    // Statusleiste: Uhrzeit links (auf dem Sperrbildschirm steht sie gross, dort links nichts)
    const statusBar = (g, time = true) => {
      g.fillStyle = '#FFFFFF'
      g.font = `600 44px ${FB}`; g.textBaseline = 'middle'; g.textAlign = 'left'
      if (time) g.fillText(p.clock, android ? 70 : 96, android ? 64 : 76)
      // Empfang, WLAN-Boegen, Akku: als Formen gezeichnet (keine Schrift, keine fremden Symbole)
      const bx = android ? 790 : 742, by = android ? 64 : 76
      for (let i = 0; i < 4; i++) { rr(g, bx + i * 15, by + 12 - (i + 1) * 7, 10, (i + 1) * 7, 2); g.fill() }
      g.lineWidth = 6; g.strokeStyle = g.fillStyle; g.lineCap = 'round'
      for (let i = 0; i < 2; i++) { g.beginPath(); g.arc(bx + 92, by + 14, 12 + i * 11, -Math.PI * 0.75, -Math.PI * 0.25); g.stroke() }
      g.beginPath(); g.arc(bx + 92, by + 12, 3, 0, Math.PI * 2); g.fill()
      g.lineWidth = 3.5; rr(g, bx + 126, by - 14, 62, 30, 9); g.stroke(); rr(g, bx + 131, by - 9, 46, 20, 5); g.fill(); rr(g, bx + 191, by - 5, 5, 12, 2); g.fill()
    }
    const cameraHole = g => {
      if (android) { g.fillStyle = '#000'; g.beginPath(); g.arc(DW / 2, 66, 26, 0, Math.PI * 2); g.fill(); g.fillStyle = '#16133A'; g.beginPath(); g.arc(DW / 2, 66, 11, 0, Math.PI * 2); g.fill() }
      else { g.fillStyle = '#000'; rr(g, DW / 2 - 150, 30, 300, 92, 46); g.fill() }
    }
    const homeBar = (g, c = 'rgba(255,255,255,.75)') => { g.fillStyle = c; rr(g, DW / 2 - (android ? 110 : 165), DH - (android ? 44 : 40), android ? 220 : 330, android ? 11 : 13, 7); g.fill() }

    // Kartenmasse (Entwurfsraum der Karte: 1000 breit) und Lage auf dem Bildschirm
    const CARD_X = 46, CARD_W = 908, CARD_TOP = 340
    const cols = Math.ceil(p.stamps / 2), PAD = 58
    const cell = Math.min(196, Math.floor((1000 - 2 * PAD - (cols - 1) * 34) / cols))
    const slotGap = cols > 1 ? (1000 - 2 * PAD - cols * cell) / (cols - 1) : 0
    const HEAD = 140, GRID_Y = PAD + HEAD + 58, GRID_H = 2 * cell + 40
    const LINE_Y = GRID_Y + GRID_H + 58, LINE_FS = 62, QR_S = 380, QR_Y = LINE_Y + LINE_FS + 58
    const CARD_H = QR_Y + QR_S + 70
    const slots = []
    for (let i = 0; i < p.stamps; i++) { const r = Math.floor(i / cols), c = i % cols; slots.push({ x: PAD + c * (cell + slotGap) + cell / 2, y: GRID_Y + r * (cell + 40) + cell / 2, r: cell / 2 }) }
    const CW = SW * CARD_W / DW, CH = CW * CARD_H / 1000
    const cardCenter = v3(ux(CARD_X + CARD_W / 2), uy(CARD_TOP + CARD_H * CARD_W / 1000 / 2), 0)
    const cx = x => -CW / 2 + x / 1000 * CW, cy = y => CH / 2 - y / CARD_H * CH   // Karte (Entwurf) -> cm in der Karte

    // ---------------------------------------------------------------- Wallet: Oberflaeche ohne die Karte
    const drawWallet = (g, w, h) => {
      g.scale(TS, TS)
      const gr = g.createLinearGradient(0, 0, 0, DH); gr.addColorStop(0, '#0C0A1C'); gr.addColorStop(1, '#130F2C')
      g.fillStyle = gr; g.fillRect(0, 0, DW, DH)
      statusBar(g); cameraHole(g)
      // Ueberschrift (passt sich an: "Google Wallet" ist laenger)
      g.fillStyle = '#FFFFFF'; g.textAlign = 'left'; g.textBaseline = 'alphabetic'
      fitFont(g, title, s => `700 ${s}px ${FD}`, 86, 640, 54); g.fillText(title, 64, 262)
      // Knopf "+" rechts (wie in jeder Wallet: hier kommen Karten dazu)
      g.strokeStyle = 'rgba(185,176,255,.9)'; g.lineWidth = 7; g.beginPath(); g.arc(DW - 112, 232, 42, 0, Math.PI * 2); g.stroke()
      g.beginPath(); g.moveTo(DW - 112, 210); g.lineTo(DW - 112, 254); g.moveTo(DW - 134, 232); g.lineTo(DW - 90, 232); g.stroke()
      // Unten der Stapel der anderen Karten (so legt die Wallet sie ab, wenn eine Karte offen ist): nur ihre
      // Oberkanten, gedeckt, damit die eigene Karte das Hellste bleibt; nach unten ins Dunkel auslaufend
      const stackTop = CARD_TOP + CARD_H * CARD_W / 1000 + 64
      const stack = ['#2B2A55', '#3A2B5C', '#24364F', '#3B3374']
      stack.forEach((c, i) => {
        const y = stackTop + i * 46
        g.fillStyle = c; rr(g, CARD_X + 34 - i * 11, y, CARD_W - 68 + i * 22, 300, 34); g.fill()
        g.fillStyle = 'rgba(255,255,255,.16)'; rr(g, CARD_X + 74 - i * 11, y + 16, 150 - i * 12, 12, 6); g.fill()
      })
      const fade = g.createLinearGradient(0, stackTop + 150, 0, stackTop + 420); fade.addColorStop(0, 'rgba(19,15,44,0)'); fade.addColorStop(1, 'rgba(19,15,44,1)')
      g.fillStyle = fade; g.fillRect(0, stackTop + 150, DW, DH - stackTop)
      homeBar(g)
    }
    // ---------------------------------------------------------------- Sperrbildschirm (ohne Benachrichtigung)
    const clockBox = { y0: 300, y1: 548 }, dateBox = { y0: 214, y1: 270 }
    let dateSize = 46
    const drawLock = (g, w, h) => {
      g.scale(TS, TS)
      const gr = g.createLinearGradient(0, 0, DW * 0.4, DH); gr.addColorStop(0, '#4A3DB0'); gr.addColorStop(0.5, '#241A62'); gr.addColorStop(1, '#0D0A26')
      g.fillStyle = gr; g.fillRect(0, 0, DW, DH)
      // Weiche Formen im Hintergrundbild (Lila, etwas Rosa, etwas Warm): ein Bild, kein Farbverlauf allein
      g.filter = 'blur(60px)'
      for (const [x, y, r, c] of [[180, 1500, 420, 'rgba(255,120,170,.38)'], [820, 1100, 380, 'rgba(120,100,255,.55)'], [640, 1900, 360, 'rgba(255,180,106,.32)'], [300, 700, 300, 'rgba(160,140,255,.35)']]) { g.fillStyle = c; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill() }
      g.filter = 'none'
      statusBar(g, false); cameraHole(g)
      g.fillStyle = 'rgba(255,255,255,.92)'; g.textAlign = 'center'; g.textBaseline = 'alphabetic'
      dateSize = fitFont(g, p.date, s => `500 ${s}px ${FB}`, 46, 760, 34); g.fillText(p.date, DW / 2, 262)
      g.fillStyle = '#FFFFFF'; fitFont(g, p.clock, s => `700 ${s}px ${FD}`, 250, 820, 160); g.fillText(p.clock, DW / 2, 532)
      // Unten Taschenlampe und Kamera (runde Knoepfe), wie auf jedem Sperrbildschirm
      for (const x of [150, DW - 150]) { g.fillStyle = 'rgba(20,14,50,.45)'; g.beginPath(); g.arc(x, DH - 210, 70, 0, Math.PI * 2); g.fill() }
      g.strokeStyle = '#FFFFFF'; g.lineWidth = 6; g.lineJoin = 'round'
      rr(g, 132, DH - 246, 36, 70, 8); g.stroke(); g.beginPath(); g.moveTo(132, DH - 222); g.lineTo(168, DH - 222); g.stroke()
      rr(g, DW - 186, DH - 232, 72, 50, 10); g.stroke(); g.beginPath(); g.arc(DW - 150, DH - 207, 14, 0, Math.PI * 2); g.stroke()
      homeBar(g, 'rgba(255,255,255,.85)')
    }
    const screenTex = canvasTex(TW, TH, p.mode === 'lock' ? drawLock : drawWallet, { sharp: true })
    const screenMat = new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false })
    const screen = new THREE.Mesh(flat(SW, SH, SR, 32), screenMat); screen.position.z = FRONT + 0.006; phone.add(screen)
    if (dateSize < 38) ctx.warn(`die Datumszeile "${p.date}" steht sehr klein (${dateSize} von 46). Kürzen.`)

    // ---------------------------------------------------------------- Die Karte (eigener Koerper)
    const icoCard = await kit.icon(p.icon, colors[1])
    const icoWhite = await kit.icon(p.icon, '#FFFFFF')
    let nameSize = 66, lineSize = LINE_FS
    // grey: die graue Karte fuer "design" (ohne Farben, ohne Logo, ohne Symbole)
    const drawCard = grey => (g, w, h) => {
      g.scale(w / 1000, w / 1000)
      const gr = g.createLinearGradient(0, 0, 360, CARD_H)
      if (grey) { gr.addColorStop(0, '#6A6680'); gr.addColorStop(1, '#3B384E') } else { gr.addColorStop(0, colors[0]); gr.addColorStop(1, colors[1]) }
      g.fillStyle = gr; g.fillRect(0, 0, 1000, CARD_H)
      // Licht von oben (wie eine glaenzende Karte), heller Rand innen
      const hl = g.createLinearGradient(0, 0, 0, CARD_H * 0.5); hl.addColorStop(0, 'rgba(255,255,255,.14)'); hl.addColorStop(1, 'rgba(255,255,255,0)')
      g.fillStyle = hl; g.fillRect(0, 0, 1000, CARD_H * 0.5)
      // Kopf: Platz fuer das Logo (eigener Koerper davor), Name, Kuerzel
      if (p.mode === 'design') { g.setLineDash([16, 12]); g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 5; rr(g, PAD + 3, PAD + 3, HEAD - 6, HEAD - 6, 30); g.stroke(); g.setLineDash([]) }
      g.fillStyle = '#FFFFFF'; g.textBaseline = 'middle'
      let locW = 0
      if (p.location) { g.font = `600 30px ${FB}`; g.letterSpacing = '4px'; locW = g.measureText(p.location).width; g.globalAlpha = 0.75; g.textAlign = 'right'; g.fillText(p.location, 1000 - PAD, PAD + HEAD / 2); g.globalAlpha = 1; g.letterSpacing = '0px' }
      const nx = PAD + HEAD + 34, room = 1000 - PAD - nx - (locW ? locW + 26 : 0)
      nameSize = fitFont(g, p.shop, s => `700 ${s}px ${FD}`, p.location ? 64 : 76, room, 30)
      g.textAlign = 'left'; g.fillText(p.shop, nx, PAD + HEAD / 2 + 3)
      // Stempelfelder: gestrichelte Kreise (gefuellte Stempel sind eigene Scheiben davor)
      g.setLineDash([14, 10]); g.lineWidth = 5; g.strokeStyle = 'rgba(255,255,255,.42)'
      for (const s of slots) { g.beginPath(); g.arc(s.x, s.y, s.r - 4, 0, Math.PI * 2); g.stroke() }
      g.setLineDash([])
      // Belohnungszeile
      g.textAlign = 'center'; g.fillStyle = '#FFFFFF'
      lineSize = fitFont(g, line, s => `600 ${s}px ${FB}`, LINE_FS, 1000 - 2 * PAD, 34)
      g.fillText(line, 500, LINE_Y + LINE_FS / 2)
      // QR-Code wie auf der Landing Page (derselbe gezeichnete Code wie in wallet-pass, kein echter)
      g.fillStyle = '#FFFFFF'; rr(g, 500 - QR_S / 2, QR_Y, QR_S, QR_S, 30); g.fill()
      const { m, size, quiet } = QR, side = size + quiet * 2, q = (QR_S - 36) / side
      g.fillStyle = grey ? '#3B384E' : ctx.B.ink
      for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (m[y][x]) g.fillRect(500 - QR_S / 2 + 18 + (x + quiet) * q, QR_Y + 18 + (y + quiet) * q, q + 0.6, q + 0.6)
    }
    const CTW = 1024, CTH = Math.round(CTW * CARD_H / 1000)
    const cardTex = canvasTex(CTW, CTH, drawCard(false), { sharp: true })
    if (nameSize < 50) ctx.warn(`der Ladenname "${p.shop}" steht auf der Karte nur noch in ${nameSize} von 76. Namen oder Kürzel kürzen.`)
    if (lineSize < 48) ctx.warn(`die Belohnungszeile "${line}" steht nur noch in ${lineSize} von 62. Kürzen.`)
    const cardG = new THREE.Group(); cardG.position.copy(cardCenter); phone.add(cardG)
    const CARD_T = 0.05, CB = 0.016, CARD_R = CW * 0.045
    const edgeMat = kit.std(col(colors[1]).multiplyScalar(0.75), { roughness: 0.45, metalness: 0.1, envMap: envTex, envMapIntensity: 0.6 })
    const cardFaceMat = new THREE.MeshBasicMaterial({ map: cardTex, toneMapped: false })
    const cardMesh = new THREE.Mesh(slab(CW, CH, CARD_R, CARD_T - 2 * CB, CB, 16), [cardFaceMat, edgeMat]); cardG.add(cardMesh)
    const CF = CARD_T / 2 + 0.002 // Vorderseite der Karte im Kartenkoordinatensystem
    const CARD_Z = FRONT + 0.006 + CARD_T / 2 + 0.03
    // Weicher Schatten der Karte auf dem Glas (sagt "die Karte liegt AUF dem Bildschirm"), waechst beim Landen
    const shadowMat = new THREE.MeshBasicMaterial({ color: '#04030C', alphaMap: softTex, transparent: true, opacity: 0, depthWrite: false })
    const cardShadow = new THREE.Mesh(new THREE.PlaneGeometry(CW * 1.25, CH * 1.18), shadowMat); cardShadow.position.set(cardCenter.x, cardCenter.y - 0.12, FRONT + 0.012); phone.add(cardShadow)

    // Logo: weisse Kachel mit dem Symbol in der Kartenfarbe, als kleine Platte (springt in "design")
    const logoTex = canvasTex(256, 256, (g, w) => { g.fillStyle = '#FFFFFF'; g.fillRect(0, 0, w, w); g.drawImage(icoCard, w * 0.16, w * 0.16, w * 0.68, w * 0.68) }, { sharp: true })
    const LS = HEAD / 1000 * CW
    const logo = new THREE.Mesh(slab(LS, LS, LS * 0.22, 0.02, 0.012, 10), [new THREE.MeshBasicMaterial({ map: logoTex, toneMapped: false }), kit.std('#E9E4FF', { roughness: 0.5 })])
    logo.position.set(cx(PAD + HEAD / 2), cy(PAD + HEAD / 2), CF + 0.02); cardG.add(logo)

    // Stempel: gefuellt = weisse Scheibe mit dem Symbol in der Kartenfarbe; leer = blasses Symbol im Kreis
    const faceTex = canvasTex(256, 256, (g, w) => {
      const r = g.createRadialGradient(w * 0.45, w * 0.4, 0, w / 2, w / 2, w / 2); r.addColorStop(0, '#FFFFFF'); r.addColorStop(0.85, '#F3F0FF'); r.addColorStop(1, '#E4DEFF')
      g.fillStyle = r; g.beginPath(); g.arc(w / 2, w / 2, w / 2, 0, Math.PI * 2); g.fill()
    }, { sharp: true })
    const iconTex = canvasTex(256, 256, (g, w) => g.drawImage(icoCard, 0, 0, w, w), { sharp: true })
    const faintTex = canvasTex(256, 256, (g, w) => g.drawImage(icoWhite, 0, 0, w, w), { sharp: true })
    const rimMat = kit.std('#DCD5FF', { roughness: 0.35, metalness: 0.15, envMap: envTex, envMapIntensity: 0.7 })
    const faceMat = new THREE.MeshBasicMaterial({ map: faceTex, toneMapped: false })
    const ringTex = canvasTex(128, 128, (g, w) => { g.strokeStyle = '#FFFFFF'; g.lineWidth = 9; g.beginPath(); g.arc(w / 2, w / 2, w / 2 - 8, 0, Math.PI * 2); g.stroke() })
    const filled = p.mode === 'wallet' ? p.after : p.before
    const stampObjs = slots.map((s, i) => {
      const r = s.r / 1000 * CW, x = cx(s.x), y = cy(s.y)
      const faint = new THREE.Mesh(new THREE.PlaneGeometry(r * 0.95, r * 0.95), new THREE.MeshBasicMaterial({ map: faintTex, transparent: true, opacity: 0.36, toneMapped: false, depthWrite: false }))
      faint.position.set(x, y, CF + 0.004); cardG.add(faint)
      if (i >= filled) return { faint }
      const disc = new THREE.Group(); disc.position.set(x, y, CF); cardG.add(disc)
      const rim = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.05, 48), rimMat); rim.rotation.x = Math.PI / 2; rim.position.z = 0.025; disc.add(rim)
      const face = new THREE.Mesh(new THREE.CircleGeometry(r * 0.99, 48), faceMat); face.position.z = 0.054; disc.add(face)
      const ico = new THREE.Mesh(new THREE.PlaneGeometry(r * 1.02, r * 1.02), new THREE.MeshBasicMaterial({ map: iconTex, transparent: true, toneMapped: false, depthWrite: false })); ico.position.z = 0.058; disc.add(ico)
      const ring = new THREE.Mesh(new THREE.PlaneGeometry(r * 2.2, r * 2.2), new THREE.MeshBasicMaterial({ map: ringTex, transparent: true, opacity: 0, toneMapped: false, depthWrite: false, blending: THREE.AdditiveBlending }))
      ring.position.set(x, y, CF + 0.07); ring.visible = false; cardG.add(ring)
      return { faint, disc, ico, ring, r }
    })

    // Scan: Rahmen aus vier Ecken, Linie mit Schein, Haken in einer lila Muenze
    const QR_C = v3(cx(500), cy(QR_Y + QR_S / 2), 0), QS = QR_S / 1000 * CW
    const brkTex = canvasTex(512, 512, (g, w) => {
      g.strokeStyle = ctx.B.lilac; g.lineWidth = 22; g.lineCap = 'round'; g.lineJoin = 'round'
      const a = 24, b = 130, e = w - a
      for (const [x, y, dx, dy] of [[a, a, 1, 1], [e, a, -1, 1], [a, e, 1, -1], [e, e, -1, -1]]) { g.beginPath(); g.moveTo(x, y + dy * b); g.lineTo(x, y); g.lineTo(x + dx * b, y); g.stroke() }
    }, { sharp: true })
    const brk = new THREE.Mesh(new THREE.PlaneGeometry(QS * 1.3, QS * 1.3), new THREE.MeshBasicMaterial({ map: brkTex, transparent: true, opacity: 0, toneMapped: false, depthWrite: false }))
    brk.position.set(QR_C.x, QR_C.y, CF + 0.03); brk.visible = false; cardG.add(brk)
    const lineTex = canvasTex(256, 64, (g, w, h) => { const lg = g.createLinearGradient(0, 0, 0, h); lg.addColorStop(0, 'rgba(185,176,255,0)'); lg.addColorStop(0.5, 'rgba(225,220,255,1)'); lg.addColorStop(1, 'rgba(185,176,255,0)'); g.fillStyle = lg; g.fillRect(0, 0, w, h) })
    const scanLine = new THREE.Mesh(new THREE.PlaneGeometry(QS * 1.18, QS * 0.12), new THREE.MeshBasicMaterial({ map: lineTex, color: '#C9C2FF', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, toneMapped: false, depthWrite: false }))
    scanLine.visible = false; cardG.add(scanLine)
    const checkTex = canvasTex(256, 256, (g, w) => {
      g.fillStyle = ctx.B.lilac; g.beginPath(); g.arc(w / 2, w / 2, w / 2, 0, Math.PI * 2); g.fill()
      g.strokeStyle = ctx.B.night; g.lineWidth = 26; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(w * 0.28, w * 0.52); g.lineTo(w * 0.44, w * 0.68); g.lineTo(w * 0.73, w * 0.36); g.stroke()
    }, { sharp: true })
    const okG = new THREE.Group(); okG.position.set(QR_C.x + QS * 0.5, QR_C.y - QS * 0.5, CF + 0.05); okG.visible = false; cardG.add(okG)
    const OKR = QS * 0.2
    { const rim = new THREE.Mesh(new THREE.CylinderGeometry(OKR, OKR, 0.08, 40), kit.std('#8E84F0', { roughness: 0.35, envMap: envTex, envMapIntensity: 0.6 })); rim.rotation.x = Math.PI / 2; okG.add(rim)
      const f = new THREE.Mesh(new THREE.CircleGeometry(OKR * 0.995, 40), new THREE.MeshBasicMaterial({ map: checkTex, toneMapped: false })); f.position.z = 0.042; okG.add(f) }

    // "design": graue Karte darueber, die von links nach rechts weggewischt wird (Pixel links von wipe.value
    // werden verworfen). Eigener Schluessel fuers Programm, sonst teilten sich alle Grundmaterialien die Zeile.
    let grey = null, wipeEdge = null
    const wipe = { value: 0 }
    if (p.mode === 'design') {
      const greyTex = canvasTex(CTW, CTH, drawCard(true), { sharp: true })
      const gm = new THREE.MeshBasicMaterial({ map: greyTex, toneMapped: false })
      gm.onBeforeCompile = sh => { sh.uniforms.wipeU = wipe; sh.fragmentShader = 'uniform float wipeU;\n' + sh.fragmentShader.replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\n\tif ( vMapUv.x < wipeU ) discard;') }
      gm.customProgramCacheKey = () => 'phone-3d-wipe'
      grey = new THREE.Mesh(flat(CW - 2 * CB, CH - 2 * CB, CARD_R - CB, 16), gm); grey.position.z = CF + 0.0015; cardG.add(grey)
      // Leuchtende Kante, wo gerade gefaerbt wird
      wipeEdge = new THREE.Mesh(new THREE.PlaneGeometry(CW * 0.06, CH * 1.02), new THREE.MeshBasicMaterial({ map: kit.blobTex, color: '#D9D3FF', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, toneMapped: false, depthWrite: false }))
      wipeEdge.position.z = CF + 0.01; wipeEdge.visible = false; cardG.add(wipeEdge)
    }
    if (p.mode === 'lock') { cardG.visible = false }

    // ---------------------------------------------------------------- Benachrichtigung (Sperrbildschirm)
    // Hell und fast deckend, dunkle Schrift: auf dem lila Hintergrundbild am besten zu lesen. Der Grund unter
    // ihr ist das weichgezeichnete Hintergrundbild selbst (einmal gemalt), wie Milchglas.
    const NX = 36, NW = DW - 72, NY = 640
    let NH = 300, bodyLines = [], bodySize = 56, titleSize = 58
    let notif = null, notifGlow = null
    if (p.mode === 'lock') {
      // Zeilen des Textes vorher messen: hoechstens zwei, sonst kleiner (und warnen)
      const mc = document.createElement('canvas').getContext('2d')
      const textX = 214, textW = NW - textX - 40
      const wrap = size => { mc.font = `500 ${size}px ${FB}`; const words = msg.split(' '), out = []; let cur = ''; for (const w of words) { const nx = cur ? cur + ' ' + w : w; if (mc.measureText(nx).width > textW && cur) { out.push(cur); cur = w } else cur = nx } out.push(cur); return out }
      for (bodySize = 56; bodySize > 34; bodySize -= 2) { bodyLines = wrap(bodySize); if (bodyLines.length <= 2 && bodyLines.every(l => { mc.font = `500 ${bodySize}px ${FB}`; return mc.measureText(l).width <= textW })) break }
      // Zwei Zeilen ausgleichen: "Gratis-Schnitt wartet auf" / "dich" liess ein einzelnes Wort haengen (Probe
      // 18.11.2026). Gewaehlt wird die Teilung mit der kuerzesten laengeren Zeile; nach dem Doppelpunkt von
      // "Noch 2 Stempel bis:" wird bevorzugt geteilt, dort macht der Satz seine Pause.
      if (bodyLines.length === 2) {
        const words = msg.split(' '); mc.font = `500 ${bodySize}px ${FB}`
        let best = null
        for (let i = 1; i < words.length; i++) {
          const a = words.slice(0, i).join(' '), b = words.slice(i).join(' '), wa = mc.measureText(a).width, wb = mc.measureText(b).width
          if (wa > textW || wb > textW) continue
          const score = Math.max(wa, wb) - (a.endsWith(':') ? textW * 0.25 : 0)
          if (!best || score < best.score) best = { score, lines: [a, b] }
        }
        if (best) bodyLines = best.lines
      }
      if (bodySize < 46) ctx.warn(`der Text der Benachrichtigung "${msg}" steht nur noch in ${bodySize} von 56. Belohnung kürzen.`)
      NH = 84 + bodyLines.length * bodySize * 1.22 + 62
      const NTW = 1024, NTH = Math.round(NTW * NH / NW)
      const notifTex = canvasTex(NTW, NTH, (g, w, h) => {
        g.scale(w / NW, w / NW)
        // Milchglas: das Hintergrundbild an dieser Stelle, weichgezeichnet, mit hellem Schleier
        g.save(); g.filter = 'blur(26px)'; g.drawImage(screenTex.image, NX * TS, NY * TS, NW * TS, NH * TS, -30, -30, NW + 60, NH + 60); g.restore()
        g.fillStyle = 'rgba(247,243,255,.84)'; g.fillRect(0, 0, NW, NH)
        // Absender: Kachel in den Kartenfarben mit weissem Symbol
        const tg = g.createLinearGradient(30, 30, 30, 170); tg.addColorStop(0, colors[0]); tg.addColorStop(1, colors[1])
        g.fillStyle = tg; rr(g, 34, (NH - 150) / 2, 150, 150, 36); g.fill()
        g.drawImage(icoWhite, 34 + 33, (NH - 150) / 2 + 33, 84, 84)
        g.textAlign = 'left'; g.textBaseline = 'alphabetic'
        g.fillStyle = '#6B6585'; g.font = `500 40px ${FB}`; const whenW = g.measureText(p.when).width
        g.textAlign = 'right'; g.fillText(p.when, NW - 40, 74); g.textAlign = 'left'
        g.fillStyle = '#16122E'; titleSize = fitFont(g, p.shop, s => `700 ${s}px ${FB}`, 58, NW - textX - 40 - whenW - 24, 34)
        g.fillText(p.shop, textX, 76)
        g.fillStyle = '#2A2445'; g.font = `500 ${bodySize}px ${FB}`
        bodyLines.forEach((l, i) => g.fillText(l, textX, 76 + 20 + (i + 1) * bodySize * 1.18))
      }, { sharp: true })
      if (titleSize < 44) ctx.warn(`der Absender "${p.shop}" steht in der Benachrichtigung nur noch in ${titleSize} von 58. Namen kürzen.`)
      const PW = SW * NW / DW, PH = PW * NH / NW
      notif = new THREE.Group(); phone.add(notif)
      const plate = new THREE.Mesh(flat(PW, PH, PW * 0.075, 16), new THREE.MeshBasicMaterial({ map: notifTex, toneMapped: false, transparent: true }))
      notif.add(plate)
      const nsh = new THREE.Mesh(new THREE.PlaneGeometry(PW * 1.18, PH * 1.6), new THREE.MeshBasicMaterial({ color: '#05030F', alphaMap: softTex, transparent: true, opacity: 0.55, depthWrite: false }))
      nsh.position.set(0, -PH * 0.12, -0.02); notif.add(nsh); nsh.renderOrder = 1; plate.renderOrder = 2
      notif.userData = { PW, PH, home: v3(ux(NX + NW / 2), uy(NY + NH / 2), FRONT + 0.04), plate }
      // Lichtpuls: eine Flaeche HINTER der Benachrichtigung, parallel zum Glas (Schein um ihre Raender). Erst war
      // es ein Sprite, das immer zur Kamera schaut: es schnitt das schraege Glas, und mitten auf dem
      // Sperrbildschirm stand eine senkrechte Lichtkante.
      notifGlow = new THREE.Mesh(new THREE.PlaneGeometry(PW * 1.7, PH * 3.2), new THREE.MeshBasicMaterial({ map: kit.blobTex, color: '#B9B0FF', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, toneMapped: false, depthWrite: false }))
      notifGlow.position.z = -0.012; notifGlow.renderOrder = 1; notif.add(notifGlow)
    }

    // ---------------------------------------------------------------- Glas: ein weicher Lichtstreifen
    // Ein Bildschirm ohne Spiegelung sieht aus wie ein Aufkleber. Der Streifen ist schwach (6 %) und liegt
    // schraeg oben, damit er keine Schrift ueberstrahlt; er wandert mit der Drehung.
    const streakTex = canvasTex(512, 1024, (g, w, h) => {
      // Glockenkurve quer zum Streifen (viele Stufen, keine Kante), nach unten ausblendend
      g.save(); g.translate(w * 0.3, h * 0.28); g.rotate(-0.62)
      const lg = g.createLinearGradient(-w * 0.5, 0, w * 0.5, 0)
      for (let i = 0; i <= 20; i++) { const x = i / 20, a = Math.exp(-Math.pow((x - 0.5) / 0.16, 2)); lg.addColorStop(x, `rgba(255,255,255,${a.toFixed(3)})`) }
      g.fillStyle = lg; g.fillRect(-w * 2, -h * 2, w * 4, h * 4); g.restore()
      g.globalCompositeOperation = 'destination-in'
      const fade = g.createLinearGradient(0, 0, 0, h); fade.addColorStop(0, 'rgba(0,0,0,1)'); fade.addColorStop(0.55, 'rgba(0,0,0,.35)'); fade.addColorStop(1, 'rgba(0,0,0,0)')
      g.fillStyle = fade; g.fillRect(0, 0, w, h)
    })
    streakTex.wrapS = THREE.ClampToEdgeWrapping
    const streak = new THREE.Mesh(flat(SW, SH, SR, 32), new THREE.MeshBasicMaterial({ map: streakTex, transparent: true, opacity: 0.07, blending: THREE.AdditiveBlending, toneMapped: false, depthWrite: false }))
    streak.position.z = FRONT + 0.16; streak.renderOrder = 5; phone.add(streak)

    // ---------------------------------------------------------------- Grundhaltung und Kamera
    const yaw0 = THREE.MathUtils.degToRad(p.angle), pitch0 = -0.07, roll0 = 0.035 * Math.sign(p.angle || 1)
    phone.rotation.set(pitch0, yaw0, roll0); phone.updateMatrixWorld(true)
    // Ecken des Handys in der Grundhaltung, mit Luft fuers Schweben (0,2 cm auf und ab, ein Grad Drehung)
    const pts = []
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) for (const dy of [-0.22, 0.22]) pts.push(v3(sx * W / 2 * 1.015, sy * H / 2 * 1.01 + dy, sz * T / 2).applyMatrix4(phone.matrixWorld))
    const camOpts = { push: p.push, orbit: p.orbit, az: CAM.az, el: CAM.el, elDrop: CAM.elDrop, aim: (a, tg) => tg.set(0, 0, 0), fog: false }
    const frame = kit.fitFrame(pts, { ...camOpts, fov: CAM.fov, rect: RECT[p.mode] })
    const cam = kit.isoCamera({ fov: CAM.fov, near: 4, far: 400, frame })

    // ---------------------------------------------------------------- Hintergrund: Abendstrasse in Unschaerfe
    // Eine gemalte Flaeche weit hinter dem Handy: Haeuserreihe mit warmen und kuehlen Fenstern, Laternen,
    // alles weichgezeichnet (wie mit offener Blende fotografiert). Davor Lichtpunkte in mehreren Tiefen, die
    // beim Drehen der Kamera gegeneinander wandern: so hat der Raum Tiefe, ohne dass eine Stadt gerechnet wird.
    // Lage und Groesse werden aus dem Bild gerechnet (Pixel -> Welt mit der Kamera am Ende der Fahrt), nicht
    // geschaetzt: in der ersten Probe war die Flaeche dreimal so gross wie der Ausschnitt, man sah nur ihre
    // lila Mitte, die Strasse lag ausserhalb, und die Lichtpunkte waren riesige flache Scheiben.
    const SW0 = K.W, SH0 = K.H
    const camAt = t => { cam.set(t, camOpts); cam.camera.updateMatrixWorld() }
    // Weltpunkt, den die Kamera (in ihrer gerade gestellten Lage) an Pixel (px, py) zeigt, in der Ebene z
    const atPixel = (px, py, z) => {
      const c = cam.camera, o = c.position.clone(), d = v3(px / SW0 * 2 - 1, 1 - py / SH0 * 2, 0.5).unproject(c).sub(o).normalize()
      return o.add(d.multiplyScalar((z - o.z) / d.z))
    }
    const R0 = rng(20261118)
    const BGZ = -60
    // Ausschnitt der Flaeche: was die Kamera am Anfang, in der Mitte und am Ende der Fahrt sieht, mit Rand
    let bx0 = Infinity, bx1 = -Infinity, by0 = Infinity, by1 = -Infinity
    for (const t of [ctx.s, (ctx.s + ctx.e) / 2, ctx.e]) { camAt(t); for (const [px, py] of [[-60, -60], [SW0 + 60, -60], [-60, SH0 + 60], [SW0 + 60, SH0 + 60]]) { const q = atPixel(px, py, BGZ); bx0 = Math.min(bx0, q.x); bx1 = Math.max(bx1, q.x); by0 = Math.min(by0, q.y); by1 = Math.max(by1, q.y) } }
    camAt(ctx.e)
    const vTop = atPixel(SW0 / 2, 0, BGZ).y, vBot = atPixel(SW0 / 2, SH0, BGZ).y   // Bildober- und -unterkante am Ende
    const BGW = 1024, BGH = Math.round(BGW * (by1 - by0) / (bx1 - bx0))
    const fy = y => (by1 - y) / (by1 - by0) * BGH   // Welt-y -> Zeile der Textur
    const bgTex = canvasTex(BGW, BGH, (g, w, h) => {
      const yTop = fy(vTop), yBot = fy(vBot), at = f => yTop + (yBot - yTop) * f   // f: Anteil der Bildhoehe
      const gr = g.createLinearGradient(0, at(0), 0, at(1))
      gr.addColorStop(0, '#0B0820'); gr.addColorStop(0.4, '#140F36'); gr.addColorStop(0.75, '#1C1548'); gr.addColorStop(1, '#130E30')
      g.fillStyle = gr; g.fillRect(0, 0, w, h)
      // Weiches Licht hinter dem Handy (Raum, nicht Leere)
      const rad = g.createRadialGradient(w * 0.5, at(0.56), 0, w * 0.5, at(0.56), w * 0.55)
      rad.addColorStop(0, 'rgba(118,100,245,.34)'); rad.addColorStop(0.55, 'rgba(90,70,200,.12)'); rad.addColorStop(1, 'rgba(60,40,140,0)')
      g.fillStyle = rad; g.fillRect(0, 0, w, h)
      // Haeuserreihe: erst scharf auf eine eigene Leinwand, dann weichgezeichnet herueber
      const st = document.createElement('canvas'); st.width = w; st.height = h; const s = st.getContext('2d')
      const street = at(0.9)
      let x = -30
      while (x < w + 30) {
        const bw = 70 + R0() * 110, bh = (0.16 + R0() * 0.26) * (at(1) - at(0)), by = street - bh
        s.fillStyle = PAL.city[Math.floor(R0() * PAL.city.length)]; s.globalAlpha = 0.7; s.fillRect(x, by, bw, bh + h)
        s.globalAlpha = 1
        for (let wy = by + 22; wy < street - 30; wy += 44) for (let wx = x + 12; wx < x + bw - 20; wx += 32) {
          const on = R0()
          if (on < 0.3) { s.fillStyle = PAL.winWarm[Math.floor(on * 10) % 3]; s.fillRect(wx, wy, 15, 21) } else if (on < 0.37) { s.fillStyle = PAL.winCool; s.fillRect(wx, wy, 15, 21) }
        }
        x += bw + 4 + R0() * 14
      }
      s.fillStyle = '#1E1846'; s.fillRect(0, street, w, h)
      // Laternen und Schaufenster: warme Flecken auf Hoehe der Strasse
      for (let lx = 40 + R0() * 60; lx < w; lx += 150 + R0() * 120) { const ly = street - 40 - R0() * 60, lg = s.createRadialGradient(lx, ly, 0, lx, ly, 56); lg.addColorStop(0, 'rgba(255,201,138,.95)'); lg.addColorStop(1, 'rgba(255,201,138,0)'); s.fillStyle = lg; s.fillRect(lx - 56, ly - 56, 112, 112) }
      g.filter = 'blur(7px)'; g.drawImage(st, 0, 0); g.filter = 'none'
      // Oben dunkel: dort stehen die Textzeilen
      const top = g.createLinearGradient(0, at(0), 0, at(0.42)); top.addColorStop(0, 'rgba(11,8,32,1)'); top.addColorStop(1, 'rgba(11,8,32,0)')
      g.fillStyle = top; g.fillRect(0, 0, w, at(0.42))
      g.fillStyle = '#0B0820'; g.fillRect(0, 0, w, Math.max(0, at(0)))
    })
    const bg = new THREE.Mesh(new THREE.PlaneGeometry(bx1 - bx0, by1 - by0), new THREE.MeshBasicMaterial({ map: bgTex, toneMapped: false, depthWrite: false }))
    bg.position.set((bx0 + bx1) / 2, (by0 + by1) / 2, BGZ); bg.renderOrder = -10; scene.add(bg)
    // Lichtpunkte (Bokeh): Scheibe mit weichem Rand und etwas hellerem Ring, wie ein Licht ausser Fokus.
    // Gesetzt nach Pixeln im Endbild (Groesse 30 bis 150 px), vor allem an die Seiten und nach unten: hinter
    // dem Handy saehe sie niemand, und oben stehen die Textzeilen.
    const bokehTex = canvasTex(128, 128, (g, w) => {
      const r = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2)
      r.addColorStop(0, 'rgba(255,255,255,.42)'); r.addColorStop(0.68, 'rgba(255,255,255,.5)'); r.addColorStop(0.84, 'rgba(255,255,255,.82)'); r.addColorStop(0.93, 'rgba(255,255,255,.3)'); r.addColorStop(1, 'rgba(255,255,255,0)')
      g.fillStyle = r; g.fillRect(0, 0, w, w)
    })
    const bokeh = []
    const addBokeh = (px, py, z, sizePx, color, opacity) => {
      const q = atPixel(px, py, z), size = atPixel(px + sizePx, py, z).distanceTo(q)
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: bokehTex, color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }))
      sp.scale.set(size, size, 1); sp.position.copy(q); scene.add(sp)
      bokeh.push({ sp, x: q.x, y: q.y, z, ph: R0() * 6.28, sp0: 0.15 + R0() * 0.25, amp: size * 0.12 })
    }
    for (let i = 0; i < 24; i++) {
      // rechts weniger und kleiner: dort liegen auf TikTok die Knoepfe, und dicht gedraengte Scheiben neben
      // dem Handy wirkten in der zweiten Probe unruhig
      const side = R0() < 0.58, px = side ? R0() * 290 : 800 + R0() * 280, py = 560 + R0() * 1360
      const low = py > 1350, warmish = low ? R0() < 0.65 : R0() < 0.2
      const color = warmish ? (R0() < 0.5 ? '#FFB46A' : '#FFC98A') : ['#B9B0FF', '#9F95FF', '#C9A8FF', '#FF8FB0'][Math.floor(R0() * 4)]
      addBokeh(px, py, -16 - R0() * 30, (side ? 30 : 24) + R0() * (side ? 120 : 80), color, 0.12 + R0() * 0.22)
    }
    // Zwei grosse, sehr schwache Lichtpunkte VOR dem Handy, unten links und oben rechts: Vordergrund gibt Tiefe
    addBokeh(70, 1820, 14, 260, '#FFB46A', 0.09); addBokeh(1010, 700, 12, 200, '#9F95FF', 0.08)

    // ---------------------------------------------------------------- Deko: schwebende Stempel-Muenzen
    // Wie Spielzeug neben dem Handy, nach Pixeln im Endbild gesetzt (immer ganz im Bild, nie vor der Karte,
    // nie unter den Textzeilen). In der ersten Probe standen sie halb aus dem Bild heraus.
    const coins = []
    if (p.deko) {
      const coinFace = canvasTex(256, 256, (g, w) => {
        const r = g.createRadialGradient(w * 0.42, w * 0.38, 0, w / 2, w / 2, w / 2); r.addColorStop(0, '#FFFFFF'); r.addColorStop(1, '#E6E0FF')
        g.fillStyle = r; g.beginPath(); g.arc(w / 2, w / 2, w / 2, 0, Math.PI * 2); g.fill(); g.drawImage(icoCard, w * 0.2, w * 0.2, w * 0.6, w * 0.6)
      }, { sharp: true })
      const coinRim = kit.std(col(colors[0]).lerp(col('#FFFFFF'), 0.15), { roughness: 0.35, metalness: 0.4, envMap: envTex, envMapIntensity: 1 })
      const coinFaceMat = new THREE.MeshBasicMaterial({ map: coinFace, toneMapped: false })
      const rc = RECT[p.mode]
      // [x, y in Pixeln, z in der Welt, Radius in Pixeln, Phase]
      for (const [px, py, z, rpx, ph] of [[Math.max(70, rc.left * 0.55), 1130, -2.5, 46, 0], [Math.max(96, rc.left * 0.8), 1700, 2.5, 56, 2.1], [Math.min(965, rc.right + 40), 640, -3.5, 40, 4.2]]) {
        const q = atPixel(px, py, z), s = atPixel(px + rpx, py, z).distanceTo(q)
        const g = new THREE.Group(); g.position.copy(q); scene.add(g)
        const rim = new THREE.Mesh(new THREE.CylinderGeometry(s, s, s * 0.24, 48), coinRim); rim.rotation.x = Math.PI / 2; g.add(rim)
        for (const sd of [1, -1]) { const f = new THREE.Mesh(new THREE.CircleGeometry(s * 0.9, 48), coinFaceMat); f.position.z = sd * (s * 0.12 + 0.004); if (sd < 0) f.rotation.y = Math.PI; g.add(f) }
        coins.push({ g, x: q.x, y: q.y, z, ph, amp: s * 0.25 })
      }
    }

    // ---------------------------------------------------------------- Zeiten (Anker) und Toene
    const A = n => ctx.at(n)
    const tRise = p.rise ? A('rise') : -1e9
    const tCard = p.mode === 'wallet' && p.drop ? A('card') - 0.1 : -1e9
    const tScan = p.mode === 'wallet' && p.scan ? A('scan') : null
    const tStamps = stampObjs.map((_, i) => p.mode === 'wallet' && i >= p.before && i < p.after ? A('stamp' + (i - p.before + 1)) : null)
    const tNotify = p.mode === 'lock' ? A('notify') - 0.1 : null
    const tPaint = p.mode === 'design' ? A('paint') : null, tLogo = p.mode === 'design' ? A('logo') : null, tSym = p.mode === 'design' ? A('symbol') : null
    if (p.tones) {
      if (p.mode === 'wallet' && p.drop) ctx.cue(A('card') - 0.05 + 0.3, 'pop', 0.9, 0.7)
      if (tScan != null) { ctx.cue(tScan + 0.2, 'scan', 0.7); ctx.cue(tScan + 0.95, 'ok', 0.8) }
      tStamps.forEach((ts, i) => { if (ts != null) ctx.cue(ts, 'pop', 0.9, PITCH(i - p.before)) })
      if (tNotify != null) ctx.cue(tNotify + 0.05, 'ding')
      if (tPaint != null) { ctx.cue(tPaint, 'sparkle', 0.5); ctx.cue(tLogo, 'pop', 0.8, 1.1); for (let i = 0; i < p.before; i++) ctx.cue(tSym + i * 0.09, 'pop', 0.6, PITCH(i)) }
    }

    // ---------------------------------------------------------------- Pruefkaesten
    if (p.mode === 'lock') { kit.safeBox('date', 'Datum'); kit.safeBox('clock', 'Uhr'); kit.safeBox('notif', 'Benachrichtigung') }
    else { kit.safeBox('card', 'Wallet-Karte'); kit.safeBox('name', 'Ladenname auf der Karte'); kit.safeBox('line', 'Belohnungszeile'); kit.safeBox('qr', 'QR-Code') }
    // Rechteck auf dem Bildschirm (Entwurf) bzw. auf der Karte -> Weltpunkte
    const scrRect = (x0, y0, x1, y1, z = FRONT) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]].map(([x, y]) => v3(ux(x), uy(y), z).applyMatrix4(phone.matrixWorld))
    const cardRect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]].map(([x, y]) => v3(cx(x), cy(y), CF).applyMatrix4(cardG.matrixWorld))

    // ---------------------------------------------------------------- Zustand zum Zeitpunkt t
    const rest = ctx.rest
    let cur = {}
    kit.run(t => {
      const az = cam.set(t, camOpts)
      // Aufsteigen: von unten, eingedreht, mit leichtem Ueberschwingen. In der Ruhelage (Pruefungen) steht
      // es schon da, sonst laegen die Kaesten unter dem Bild.
      const kR = rest ? 1 : clamp01((t - tRise) / 0.9), eR = backOut(kR, 0.9)
      const bob = 0.14 * Math.sin(t * 1.15), sway = 0.012 * Math.sin(t * 0.7 + 1)
      // Startet so tief, dass im ersten Bild schon gut die Haelfte zu sehen ist: das erste Bild eines Videos
      // ist der Einstieg, und in der zweiten Probe stand dort nur eine Ecke des Handys im Dunkel
      phone.position.set(0, lerp(-7.5, 0, eR) + bob, lerp(-3, 0, eR))
      phone.rotation.set(pitch0 + 0.25 * (1 - eR) + 0.008 * Math.sin(t * 0.9), yaw0 + 0.55 * (1 - smooth(kR)) + sway, roll0 - 0.12 * (1 - eR))
      // Hintergrund und Deko leben leise mit
      for (const b of bokeh) b.sp.position.set(b.x + b.amp * Math.sin(t * b.sp0 + b.ph), b.y + b.amp * 1.4 * Math.sin(t * b.sp0 * 0.8 + b.ph * 1.7), b.z)
      for (const c of coins) { c.g.position.set(c.x, c.y + c.amp * Math.sin(t * 1.1 + c.ph), c.z); c.g.rotation.set(0.35 * Math.sin(t * 0.6 + c.ph), t * 0.9 + c.ph, 0.25 * Math.sin(t * 0.5 + c.ph)) }
      halo.material.opacity = 0.26
      // Glas: der Lichtstreifen wandert mit dem Blickwinkel
      streakTex.offset.x = 0.12 * Math.sin(az * 3 + 0.4) + 0.04 * Math.sin(t * 0.5)

      if (p.mode !== 'lock') {
        // Karte gleitet herein: von links ausserhalb des Bildes, in einem flachen Bogen vor dem Glas, gedreht,
        // und legt sich mit kleinem Ueberschwingen auf den Bildschirm. Nicht von oben: so flog sie in der dritten
        // Probe quer durch die Textzeile ("Wallet." stand halb unter der Karte).
        const kC = rest ? 1 : clamp01((t - tCard) / 0.6), eC = backOut(kC, 1.1), oC = outCubic(kC)
        cardG.visible = rest || t >= tCard
        cardG.position.set(lerp(cardCenter.x - 12, cardCenter.x, eC), cardCenter.y + 1.0 * (1 - oC) + 0.8 * Math.sin(Math.PI * oC), lerp(CARD_Z + 2.6, CARD_Z, oC))
        cardG.rotation.set(-0.12 * (1 - oC), 0.75 * (1 - oC), 0.2 * (1 - oC))
        shadowMat.opacity = cardG.visible ? 0.55 * smooth((kC - 0.45) / 0.55) : 0
        // Stempel: gefuellte stehen da; neue springen auf ihr Wort herein (von oben, mit Ring)
        stampObjs.forEach((s, i) => {
          if (!s.disc) return
          const ts = tStamps[i]
          if (ts == null || rest) { s.disc.visible = true; s.disc.scale.setScalar(1); s.disc.position.z = CF; s.ring.visible = false; if (s.ico && p.mode !== 'design') s.ico.scale.setScalar(1); return }
          const k = (t - ts + 0.08) / 0.45
          s.disc.visible = k > 0
          s.disc.scale.setScalar(k > 0 ? lerp(0.35, 1, backOut(k, 2.2)) : 0.35)
          s.disc.position.z = CF + 0.9 * (1 - outCubic(k))
          const kr = (t - ts) / 0.7
          s.ring.visible = kr > 0 && kr < 1
          if (s.ring.visible) { s.ring.scale.setScalar(0.9 + 0.9 * outCubic(kr)); s.ring.material.opacity = 0.85 * (1 - kr) }
        })
        // Scan
        if (tScan != null && !rest) {
          const k = t - tScan
          brk.visible = k > 0 && k < 1.7
          if (brk.visible) { const a = k < 0.3 ? outCubic(k / 0.3) : k < 1.35 ? 1 : 1 - smooth((k - 1.35) / 0.3); brk.material.opacity = a; brk.scale.setScalar(lerp(1.25, 1, outCubic(k / 0.3))) }
          // Linie: hinunter (0,2 bis 0,58 s) und wieder hinauf (bis 0,94 s), wie in wallet-pass
          scanLine.visible = k > 0.1 && k < 1.0
          if (scanLine.visible) {
            const u = k < 0.58 ? smooth((k - 0.2) / 0.38) : 1 - smooth((k - 0.58) / 0.36)
            scanLine.position.set(QR_C.x, QR_C.y + QS * 0.5 - u * QS, CF + 0.04); scanLine.material.opacity = Math.min(1, (k - 0.1) / 0.1, (1.0 - k) / 0.08)
          }
          const kk = k - 0.95
          okG.visible = kk > 0 && kk < 2.5
          if (okG.visible) { okG.scale.setScalar(lerp(0.3, 1, backOut(kk / 0.35, 2.2)) * (kk > 2.2 ? 1 - smooth((kk - 2.2) / 0.3) : 1)); okG.position.z = CF + 0.05 + 0.5 * (1 - outCubic(kk / 0.35)) }
        } else { brk.visible = scanLine.visible = false; okG.visible = false }
        // Design: graue Karte wischt weg, Logo springt hinein, Symbole kommen nacheinander
        if (p.mode === 'design') {
          const w = rest ? 1 : clamp01((t - tPaint) / 0.55), ww = smooth(w)
          wipe.value = ww; grey.visible = ww < 0.999
          wipeEdge.visible = !rest && w > 0 && w < 1
          if (wipeEdge.visible) { wipeEdge.position.x = -CW / 2 + ww * CW; wipeEdge.material.opacity = 0.9 * Math.sin(Math.PI * w) }
          const kl = rest ? 1 : (t - tLogo) / 0.4
          logo.visible = kl > 0; logo.scale.setScalar(kl > 0 ? lerp(0.45, 1, backOut(kl, 2.4)) : 0.45); logo.position.z = CF + 0.02 + 0.6 * (1 - outCubic(kl))
          stampObjs.forEach((s, i) => {
            const ks = rest ? 1 : (t - (tSym + i * 0.09)) / 0.35
            const sc = ks > 0 ? lerp(0.3, 1, backOut(ks, 2.2)) : 0
            s.faint.visible = ks > 0; s.faint.scale.setScalar(Math.max(0.001, sc))
            if (s.ico) { s.ico.visible = ks > 0; s.ico.scale.setScalar(Math.max(0.001, sc)) }
          })
        }
      } else {
        // Sperrbildschirm: gedimmt, bis die Karte sich meldet; dann leuchtet er auf, die Benachrichtigung
        // gleitet von unten herein (ueber dem Glas schwebend, dann aufliegend), ein sanfter Lichtpuls
        const k = rest ? 1 : (t - tNotify) / 0.6
        const lit = p.wake ? (rest ? 1 : lerp(0.42, 1, smooth((t - tNotify) / 0.35))) : 1
        screenMat.color.setScalar(lit)
        const u = notif.userData, e = backOut(k, 1.0)
        notif.visible = k > 0
        // Von unten herauf (wie auf dem Sperrbildschirm ueblich): von oben kommend lag sie in der dritten Probe
        // halb durchsichtig ueber der Uhr, und "18:42" schien durch den Text
        notif.position.set(u.home.x, lerp(u.home.y - 2.2, u.home.y, e), lerp(u.home.z + 0.9, u.home.z, outCubic(k)))
        notif.scale.setScalar(lerp(0.9, 1, outCubic(k)))
        u.plate.material.opacity = clamp01(k / 0.35)
        const kp = rest ? 9 : t - tNotify - 0.15
        notifGlow.visible = kp > 0 && kp < 1.4
        if (notifGlow.visible) { notifGlow.scale.setScalar(lerp(0.7, 1.15, outCubic(kp / 1.4))); notifGlow.material.opacity = 0.75 * Math.sin(Math.PI * clamp01(kp / 1.4)) }
        halo.material.opacity = 0.26 + (notifGlow.visible ? 0.14 * Math.sin(Math.PI * clamp01(kp / 1.4)) : 0)
      }

      // Pruefkaesten (in Buehnenpunkten, dort wo die Kamera die Dinge hinwirft)
      kit.sync()
      if (p.mode === 'lock') {
        kit.setSafe('date', kit.project(scrRect(140, dateBox.y0, DW - 140, dateBox.y1)))
        kit.setSafe('clock', kit.project(scrRect(110, clockBox.y0, DW - 110, clockBox.y1)))
        kit.setSafe('notif', notif.visible && notif.userData.plate.material.opacity >= 0.5 ? kit.meshBox([notif.userData.plate]) : null)
      } else {
        const on = cardG.visible
        kit.setSafe('card', on ? kit.project(cardRect(0, 0, 1000, CARD_H)) : null)
        kit.setSafe('name', on ? kit.project(cardRect(PAD, PAD, 1000 - PAD, PAD + HEAD)) : null)
        kit.setSafe('line', on ? kit.project(cardRect(PAD, LINE_Y - 6, 1000 - PAD, LINE_Y + LINE_FS + 10)) : null)
        kit.setSafe('qr', on ? kit.project(cardRect(500 - QR_S / 2, QR_Y, 500 + QR_S / 2, QR_Y + QR_S)) : null)
      }
      cur = { t, az }
    })

    // Nur fuer tools/test_3d_phone_3d.mjs: Schriftgroessen auf dem Bild (Bildpunkte), Rechenhilfe "drawnBox"
    // (wo aendert ein Ding wirklich Pixel), Stand der Bewegungen (welche Anker gerade wirken).
    kit.canvas.phoneDebug = {
      mode: p.mode, frame, msg, nameSize, lineSize, bodySize, titleSize, dateSize, bodyLines,
      // Hoehe von 1000 Entwurfspunkten auf dem Bild -> Schriftgroesse in Bildpunkten
      textPx() {
        kit.sync()
        if (p.mode === 'lock') {
          const [a, , c] = kit.project(scrRect(0, NY, DW, NY))
          const k = (c - a) / DW
          return { body: +(bodySize * k).toFixed(1), title: +(titleSize * k).toFixed(1), clock: +(250 * k).toFixed(1) }
        }
        const [a, , c] = kit.project(cardRect(0, LINE_Y, 1000, LINE_Y)), k = (c - a) / 1000
        return { name: +(nameSize * k).toFixed(1), line: +(lineSize * k).toFixed(1) }
      },
      // Benachrichtigung: nur die Platte (ihr weicher Schatten darunter ist Beiwerk und reicht 40 px tiefer)
      drawnBox(what) { return kit.drawnBox(what === 'card' ? cardG : what === 'notif' ? notif && notif.userData.plate : what === 'phone' ? phone : null) },
      state() { return { t: cur.t, cardVisible: cardG.visible, cardY: +cardG.position.y.toFixed(3), stamps: stampObjs.map(s => s.disc ? +(s.disc.visible ? s.disc.scale.x : 0).toFixed(3) : null), scan: brk.visible, ok: okG.visible, notif: notif ? +(notif.visible ? notif.userData.plate.material.opacity : 0).toFixed(3) : null, lit: +screenMat.color.r.toFixed(3), wipe: +wipe.value.toFixed(3), logo: +(logo.visible ? logo.scale.x : 0).toFixed(3), phoneY: +phone.position.y.toFixed(3) } }
    }
  }
}
