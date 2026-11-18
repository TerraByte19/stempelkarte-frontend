// Ein Laden von innen, in 3D: isometrisch aufgeschnitten (Rueckwand, rechte Wand und Boden, keine Decke),
// warmes Abendlicht faellt durch Fenster und Glastuer, hinter der Theke steht der Inhaber, davor der Kunde.
// Je Branche eigene Einrichtung (Cafe, Doener, Friseur, Baeckerei, Eisdiele). Das Bild fuer alles, was IM
// Laden passiert: der Kunde kommt herein und bestellt, haelt sein Handy hin, der Inhaber scannt es mit seinem
// Handy (B1), ein Stempel springt ueber dem Handy auf und ist sofort auf der Karte (B2); fuer Papier-Themen
// liegt eine Papierkarte auf der Theke und knuellt sich zusammen.
//
// Warum ein eigener Baustein und nicht shop-counter in 3D: der Betreiber will "so wenig 2D wie moeglich"
// (17.11.2026). Die Mitbewerber zeigen solche Szenen als Spielzeug-Diorama schraeg von oben; gelernt ist nur
// der Stil (isometrisch, warmes Licht, weiche Kamera), die Szene ist eigen: unsere Farben, unsere Karte, unser
// Scan.
//
// Aufbau: mit dem 3D-Baukasten engine/kit3d.js (Renderer, Licht, Figur, Glocke, Kamera, Pruefkaesten), damit
// der Laden in derselben Welt steht wie iso-street. Hier steht nur, was der Innenraum braucht.
//
// Was man wissen muss (Fallen, die beim Bauen auftraten):
// - Kamera von Suedwesten (wie iso-street): sichtbar sind nur Waende, deren Vorderseite zur Kamera zeigt,
//   also die Rueckwand (z = 0, schaut nach +z) und die rechte Wand (x = 0, schaut nach -x). Die Ecke im
//   Ursprung ist der hinterste Punkt und steht oben in der Mitte des Bildes. Vordere Waende gibt es nicht.
// - Ueber den Mauerkronen steht die Stadt von iso-street (Haeuser, Fenster, Laternen, Dunst). In der ersten
//   Probe war dort Nachthimmel, und das obere Drittel des Bildes war schwarz. Durch das Fenster sieht man bei
//   34 Grad von oben nicht den Himmel, sondern den Gehweg draussen: der Blick faellt hinunter.
// - Das Abendlicht ist der "Mond" des Baukastens (warm statt kuehl, von hinten rechts wie in der Stadt): er
//   wirft EINMAL Schatten (Waende, Theke, Regale), und durch Fenster und Glastuer fallen echte Lichtflecken
//   nach vorn links auf den Boden. Ein Dach, das nur Schatten wirft (die Kamera sieht seine Rueckseite nie),
//   haelt das Licht ueber den Mauerkronen ab. Was sich bewegt (Figuren, Tuerblatt, Handys), wirft keinen
//   Schatten.
// - Nahaufnahme ("close") ueber den Anker "zoom" im SELBEN Teil, nicht als zweiter Teil: der Baukasten zeichnet
//   jede 3D-Szene, solange ihre Szene zu sehen ist, zwei Teile in einer Szene kosteten also doppelt.
// - Die Handys liegen flach in der Hand, Bildschirm nach oben: nur so sieht die Kamera von oben beide
//   Bildschirme (Karte des Kunden, Scanner des Inhabers). Senkrecht gehalten zeigte immer einer weg.
// - Der Kunde haelt sein Handy am UNTEREN Rand (GRIP). In der ersten Fassung sass die Hand 20 cm unter der
//   Mitte, also genau auf dem QR-Code: der Unterarm lag in der Nahaufnahme ueber einem Drittel des Codes,
//   die Scan-Linie lief darunter (Abnahme 18.11.2026). Der Test misst das (Bild mit und ohne Arm).
// - Was in der ganzen Ansicht nur ein Punkt waere, ist dort groesser (wie STAMP.size): Sprechblase 2,2-fach,
//   Papierkarte 1,3-fach. Die Blase mass vorher 84 x 71 px, am Handy rund 30 px, also ein weisser Fleck.
// - Der Weg des Kunden fuehrt vorn um die Theke herum, nicht an ihr entlang: an der Theke entlang stand
//   sein Kopf genau dann vor der Papierkarte, wenn sie sich knuellte. Die Kugel fliegt danach in den
//   Papierkorb links neben der Theke ("Weg damit" als Bild); sie lag vorher als 12-px-Punkt auf der Theke.
// - Text im Bild nur, wo er gross genug wird: das Ladenschild im ganzen Laden; die Tafel ist Schmuck (ihre
//   Woerter sind am Handy rund 8 px hoch, also nicht lesbar). Auf der Karte im Handy zaehlt man in der
//   Nahaufnahme die Stempel; der Name steht gross oben, ist am Handy aber nur knapp lesbar. Der Stempel
//   ueber dem Handy ist gross genug fuer das ganze Bild.
// - Jedes Bild ist eine reine Funktion von t (Kamera, Wege, Arme, Knuellen, Stempel); Zufall nur aus festem
//   Startwert beim Bauen. tools/test_3d_iso_shop.mjs prueft gleiche Pixel nach Spruengen und auf zwei Seiten.
// - Rechenzeit (18.11.2026, SwiftShader ohne Grafikkarte): rund 0,8 bis 1 s je Bild auf einer Seite; die
//   Probe videos/_probe-iso-shop (6 s, 179 Bilder) baute mit drei Seiten in 2 min 25 s.
import { ICONS } from '../engine/icons.js'
import { QR } from '../engine/qr.js'

// ---------------------------------------------------------------- Masse (Meter)
// Spielzeugmassstab: die Figur des Baukastens ist 1,3-fach so gross wie ein Mensch (rund 2,5 m), also sind
// Theke, Tuer und Handys es auch. Echte Handys (15 cm) waeren aus der Hoehe der Kamera nur ein Punkt.
const HW = 4.6            // Hoehe der Waende
const WT = 0.35           // Dicke der Waende (die Schnittkante oben ist hell, wie bei einem Puppenhaus)
const ROOM = 13           // so weit reichen Waende und Boden (weiter als der Ausschnitt: das Bild bleibt voll)
const DOOR = { x: -6.75, w: 1.4, h: 3.0 }                  // Glastuer in der Rueckwand (Mitte, Breite, Hoehe)
const WIN = { x0: -5.55, x1: -4.15, y0: 1.25, y1: 3.2 }    // Fenster in der Rueckwand
const CNT0 = { x0: -3.9, x1: -0.9, z0: 2.18, z1: 3.02, h: 1.3 } // Theke (beim Friseur kuerzer, siehe build)
const BENCH = { x0: -3.95, x1: -0.4, z1: 0.68, h: 1.1 }     // Arbeitsplatte an der Rueckwand
const OWNER = { x: -2.4, z: 1.7 }
const SPOT = { x: -2.25, z: 3.5 }                           // hier steht der Kunde an der Theke
const SIGN = { x: -2.2, y: 3.98, w: 3.2, h: 0.84 }          // Ladenschild an der Rueckwand
const MENU = { z: 1.85, y: 3.5, w: 1.9, h: 1.5 }            // Tafel an der rechten Wand (hoch: in der Nahaufnahme
                                                            // laege sie sonst angeschnitten hinter den Textzeilen)
const WALK = 2.3          // Gehtempo (m/s), wie der Stammkunde in iso-street
const PH = { w: 0.44, h: 0.82, d: 0.06 }                    // Handy des Kunden
// Haltepunkt: Abstand von der Hand zur Mitte des Handys (m). Halbe Laenge plus etwas mehr als der Radius
// der Hand (0,1 m): so haelt die Hand die Unterkante, und der Arm liegt hinter dem Handy statt auf dem Code
const GRIP = 0.43
const SC = { w: 0.25, h: 0.44, d: 0.05 }                    // Handy des Inhabers (Scanner)
// Rechter Arm des Inhabers mit dem Scanner: Drehung um x (ueber die Waagerechte) und um z (nach innen) beim
// Scan, danach noch hoeher und weiter nach innen, bevor er sinkt (gemessen mit isoShop.spots)
const ARM_S = -2.38, ARM_Z = -0.44, ARM_S2 = -2.75, ARM_Z2 = -0.55
const BIN = { x: -4.5, z: 2.45, r: 0.3, h: 0.72 }           // Papierkorb links neben der Theke (nur mit "paper")
const PSIZE = [1.3, 1]    // Papierkarte: ganze Ansicht / Nahaufnahme (vorher rund 100 px breit, die Kugel 32 px)
const BUB = [2.2, 1]      // Sprechblase: ganze Ansicht / Nahaufnahme

// Farben des Innenraums: Waende im Stampit-Lila, eine Stufe heller als die Stadt (drinnen ist Licht an),
// Holz warm, damit der Raum gemuetlich wirkt und das Lila nicht kalt wird
const IN = {
  wall: '#4C4196', wallLow: '#30296F', trim: '#8F84E8', cap: '#D9D2FF', floor: '#7A5A6C',
  wood: '#8E5E4E', woodDark: '#5A3A35', top: '#F2EADB', counterTop: '#6F5552', dark: '#1B1542', metal: '#CFCBEA'
}

// Branchen: Symbol (Vorschlag), Name (Vorschlag), Tafel, was in der Sprechblase steht
const BRANCH = {
  cafe: { icon: 'cup', shop: 'Café Mond', menu: ['Espresso', 'Cappuccino', 'Kuchen'], order: 'cup' },
  doener: { icon: 'kebab', shop: 'Döner Palast', menu: ['Döner', 'Dürüm', 'Lahmacun'], order: 'kebab' },
  friseur: { icon: 'scissors', shop: 'Salon Schnitt', menu: ['Schnitt', 'Bart', 'Föhnen'], order: 'scissors' },
  baeckerei: { icon: 'bread', shop: 'Bäckerei Korn', menu: ['Brot', 'Brötchen', 'Brezel'], order: 'bread' },
  eis: { icon: 'star', shop: 'Eis Wolke', menu: ['Vanille', 'Schoko', 'Erdbeere'], order: 'cone' }
}
// Eistuete fuer die Sprechblase: engine/icons.js hat (noch) kein Eis-Symbol, und die Sprechblase ist nur
// Bild, kein Stempel-Symbol. Gleiches Raster wie dort (24 x 24, nur Linien).
const CONE = '<path d="M7.6 11.2h8.8L12 21.2Z"/><path d="M9.4 14.6l4.4 3.2"/><path d="M7 11.2a5 5 0 0 1 10 0"/><path d="M9.2 7.3a2.9 2.9 0 0 1 5.6 0"/>'

// Aussehen des Kunden (customer = Zahl). 0 ist der helle Mantel des Stammkunden aus iso-street.
const LOOK = {
  coat: ['#F4EEE2', '#8C6BC8', '#C9786A', '#5FA39B', '#E2AE4D', '#5B86D6', '#D9839F'],
  hair: ['#2A1A2E', '#5A3A2A', '#B9783A', '#18142A', '#8E5A3A', '#D9BE78'],
  skin: ['#F2C29B', '#E3A87C', '#C68A62', '#9A6444', '#F5D2B5'],
  legs: ['#2B2457', '#3A3550', '#243150', '#4A2F4F'],
  style: ['kurz', 'dutt', 'muetze', 'zopf', 'locken']
}

export default {
  title: 'Laden von innen in 3D: Theke, Inhaber, Kunde, Scan und Stempel',
  use: 'Isometrischer Blick in einen Laden am Abend (Wände aufgeschnitten wie ein Puppenhaus), warmes Licht fällt durch Fenster und Glastür. Hinter der Theke der Inhaber, davor der Kunde; Einrichtung je Branche (Café, Döner, Friseur, Bäckerei, Eisdiele). Der Kunde kommt herein und bestellt, hält sein Handy hin, der Inhaber scannt es mit seinem Handy, ein Stempel springt mit dem Symbol des Ladens über dem Handy auf (B1, B2). Mit "paper" liegt eine Papierkarte auf der Theke, die sich zusammenknüllt. "close" fährt für Details an Theke oder Handys heran. Rechnet etwa 1 s je Bild (ohne Grafikkarte), also deutlich länger als die 2D-Bausteine.',
  params: {
    branch: { default: 'cafe', doc: 'Art des Ladens, bestimmt die Einrichtung: "cafe" (Siebträger, Tassen, Kuchenvitrine), "doener" (Drehspieß, Grill), "friseur" (Stuhl, Spiegel, Föhn, Schere im Regal), "baeckerei" (Brotregal, Brötchen in Körben), "eis" (Eistheke mit bunten Wannen)' },
    shop: { default: 'Café Mond', doc: 'Name auf dem Ladenschild, auf der Karte im Handy und auf der Papierkarte (höchstens etwa 14 Zeichen; lange Namen in zwei Zeilen: vorn klein, das letzte Wort groß)', same: 'Ladenname' },
    icon: { default: 'cup', doc: 'Stempel-Symbol: cup, bread, scissors, star, heart, check, kebab. Passt es nicht zur Branche, gibt es eine Warnung', same: 'Symbol' },
    accent: { default: '#7366E8', doc: 'Farbe des Ladens (Theke, Streifen am Schild, Stempel)' },
    menu: { default: [], doc: 'Drei Wörter auf der Tafel an der rechten Wand (je höchstens etwa 10 Zeichen). Leer = passend zur Branche. Die Tafel ist Schmuck: am Handy sind die Wörter zu klein zum Lesen, also nichts Wichtiges darauf schreiben' },
    customer: { default: 0, doc: 'Aussehen des Kunden als Zahl: 0 = heller Mantel (wie der Stammkunde in iso-street), jede andere Zahl ein anderes, festes Aussehen (Mantel, Haar, Haut, Frisur)' },
    start: { default: 'counter', doc: '"counter": der Kunde steht schon an der Theke. "door": er kommt auf "enter" durch die Glastür herein und geht zur Theke' },
    bubble: { default: true, doc: 'Sprechblase mit dem Bestellten über dem Kunden (Anker "order")' },
    phone: { default: true, doc: 'Der Kunde hält sein Handy mit der Karte, der Inhaber scannt es (Anker "scan", "stamp")' },
    paper: { default: false, doc: 'Eine Papier-Stempelkarte liegt auf der Theke, links daneben steht ein Papierkorb (Anker "crumple": sie knüllt sich zusammen und fliegt in den Korb)' },
    stamps: { default: 6, doc: 'Felder auf der Karte (Papier und Handy), 4 bis 10. Das letzte ist das Gratis-Feld', same: 'Stempelzahl' },
    have: { default: 3, doc: 'Stempel, die schon auf der Karte sind (0 bis stamps - 1). Auf "stamp" kommt im Handy einer dazu' },
    leaves: { default: false, doc: 'Der Kunde geht am Ende wieder durch die Tür hinaus (Anker "leave")' },
    close: { default: '', doc: 'Nahaufnahme ab Anker "zoom": "" (ganzer Laden), "counter" (Theke mit Karte und Handys) oder "phone" (die beiden Handys und der Stempel; auf der Karte im Handy sind die Stempel zu zählen)' },
    push: { default: 0.06, doc: 'Wie weit die Kamera während der Szene heranfährt (0 bis 0,25). Sie endet immer im berechneten Ausschnitt; mehr heißt nur, dass sie weiter weg anfängt' },
    orbit: { default: 6, doc: 'Um wie viele Grad sich die Kamera während der Szene dreht (0 bis 10)' },
    tones: { default: true, doc: 'Eigene Töne (ding an der Tür, pop für Blase und Stempel, scan und ok, crumple). false, wenn das Skript Klänge aus der Bibliothek setzt' }
  },
  captions: { min: 1 },
  anchors: p => ({
    ...(p.start === 'door' ? { enter: { at: 'start', offset: 1.2, doc: 'Der Kunde tritt durch die Glastür herein (Ton: ding) und geht vorn um die Theke herum zu ihr (rund 3,5 s; liegt "scan" früher, geht er schneller). Die Tür geht rund 1 s vorher auf; liegt "enter" näher als das am Szenenanfang, steht sie schon im ersten Bild offen (Warnung)' } } : {}),
    ...(p.bubble ? { order: { cap: 0, word: -1, doc: 'Über dem Kunden springt eine Sprechblase mit dem Bestellten auf (Ton: pop), auch im Gehen; der Inhaber nickt und verbeugt sich leicht. Sie steht 1,4 s; mit "close" geht sie spätestens mit "zoom" (liegt "zoom" weniger als 1 s danach: Warnung)' } } : {}),
    ...(p.paper ? { crumple: { cap: 0, word: -1, offset: 0.2, doc: 'Die Papierkarte auf der Theke knüllt sich zu einer Kugel (Ton: crumple), die nach 0,55 s in den Papierkorb fliegt (Ton: drop, rund 1,1 s nach dem Anker). Steht der Kunde dabei vor der Karte, gibt es eine Warnung' } } : {}),
    ...(p.phone ? {
      scan: { cap: -1, word: 0, doc: 'Der Kunde hält sein Handy über die Theke, der Inhaber hält seins darüber: Scan-Strahl und Scan-Linie (Ton: scan), dann ein Haken (Ton: ok). Handys heben sich 0,7 s vorher' },
      stamp: { cap: -1, word: -1, doc: 'Der Stempel springt mit dem Symbol des Ladens über dem Handy auf (Ton: pop), auf der Karte im Handy ist ein Stempel mehr. Mindestens 0,7 s nach "scan" (sonst wird er mit Warnung auf 0,7 s danach gelegt)' }
    } : {}),
    ...(p.close ? { zoom: { at: 'start', offset: 0, doc: 'Die Kamera fährt in 0,9 s an "close" heran. Am Anfang des Teils: von Anfang an nah' } } : {}),
    ...(p.leaves ? { leave: { at: 'end', offset: -3.6, doc: 'Der Kunde dreht sich um und geht durch die Glastür hinaus (rund 3,3 s bis zur Tür, Ton: ding an der Tür)' } } : {})
  }),
  demo: {
    params: { branch: 'cafe', shop: 'Café Mond', icon: 'cup', bubble: false, close: '' },
    captions: [{ lines: ['Einmal scannen,'] }, { lines: ['schon ist der Stempel drauf.'] }],
    at: { cap: 1, word: -1, offset: 0.7 }
  },
  async build(ctx) {
    const { p } = ctx
    const BR = BRANCH[p.branch]
    if (!BR) ctx.fail(`"branch" gibt es nicht: "${p.branch}". Erlaubt: ${Object.keys(BRANCH).join(', ')}`)
    if (!['counter', 'door'].includes(p.start)) ctx.fail('"start" muss "counter" oder "door" sein')
    if (!['', 'counter', 'phone'].includes(p.close)) ctx.fail('"close" muss "", "counter" oder "phone" sein')
    if (!Number.isInteger(p.stamps) || p.stamps < 4 || p.stamps > 10) ctx.fail('"stamps" muss eine ganze Zahl von 4 bis 10 sein')
    if (!Number.isInteger(p.have) || p.have < 0 || p.have > p.stamps - 1) ctx.fail('"have" muss zwischen 0 und stamps - 1 liegen (auf "stamp" kommt einer dazu)')
    if (!Number.isInteger(p.customer) || p.customer < 0) ctx.fail('"customer" muss eine ganze Zahl ab 0 sein')
    if (!(p.push >= 0 && p.push <= 0.25)) ctx.fail('"push" muss zwischen 0 und 0,25 liegen')
    if (!(p.orbit >= 0 && p.orbit <= 10)) ctx.fail('"orbit" muss zwischen 0 und 10 Grad liegen (mehr zeigt die offenen Seiten des Ladens)')
    if (p.close === 'phone' && !p.phone) ctx.fail('"close": "phone" braucht "phone": true')
    if (p.close === 'counter' && !p.phone && !p.paper) ctx.fail('"close": "counter" braucht "phone" oder "paper", sonst liegt auf der Theke nichts')
    // Kein stilles Zurueckfallen: ein Doener-Video mit Kaffeetasse auf dem Stempel faellt sonst erst im Bild auf
    if (p.icon !== BR.icon && !(p.branch === 'eis' && ['star', 'heart'].includes(p.icon))) ctx.warn(`Symbol "${p.icon}" passt nicht zur Branche "${p.branch}" (gemeint ist wohl "${BR.icon}")`)
    const menu = p.menu.length ? p.menu.map(String) : BR.menu
    // Beim Friseur ist die Theke ein kurzer Empfang: rechts daneben stehen Spiegel und Stuhl (sonst nur am
    // Bildrand, halb ausserhalb)
    const CNT = { ...CNT0, x1: p.branch === 'friseur' ? -1.85 : CNT0.x1 }
    if (menu.length !== 3) ctx.fail('"menu" braucht genau drei Wörter (oder leer für die Vorgabe der Branche)')

    const K = await import('../engine/kit3d.js')
    const { PAL, rng, clamp01, smooth, lerp, walkCycle } = K
    // Dunst legt der Baustein selbst an (bei der Stadt draussen), mit eigenem Abstand: der Dunst des Baukastens
    // ist fuer die Kreuzung bemessen und haette die Rueckwand des Ladens schon eingetruebt
    const kit = await K.createKit(ctx, { name: 'iso-shop', prefix: 'ish', exposure: 1.05, fog: false, calm: 760 })
    const { THREE, RoundedBoxGeometry, scene, col, std, lam, glow } = kit
    const V = (x, y, z) => new THREE.Vector3(x, y, z)

    // ---------------------------------------------------------------- kleine Helfer
    const mats = new Map()
    const S = (c, o = {}) => { const k = 's' + c + JSON.stringify(o); if (!mats.has(k)) mats.set(k, std(c, o)); return mats.get(k) }
    const L = c => { const k = 'l' + c; if (!mats.has(k)) mats.set(k, lam(c)); return mats.get(k) }
    const B = c => { const k = 'b' + c; if (!mats.has(k)) mats.set(k, new THREE.MeshBasicMaterial({ color: c })); return mats.get(k) }
    // Mesh an seinen Platz; cast = wirft den (einmal gerechneten) Schatten. Nur, was stillsteht.
    const put = (geo, mat, x, y, z, { parent = scene, cast = true, recv = true, ry = 0 } = {}) => {
      const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.y = ry; m.castShadow = cast; m.receiveShadow = recv; parent.add(m); return m
    }
    const rbox = (w, h, d, r = 0.05, seg = 2) => new RoundedBoxGeometry(w, h, d, seg, Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001))
    const cyl = (rt, rb, h, n = 20) => new THREE.CylinderGeometry(rt, rb, h, n)
    // Block, unten dunkler als oben (gebackene Verdeckung wie bei den Haeusern des Baukastens), gemessen an
    // der Hoehe in der Welt: so passen Wandstuecke verschiedener Hoehe ohne Kante zueinander
    const shadedBox = (w, h, d, y0, r = 0.04) => {
      const geo = rbox(w, h, d, r), pos = geo.attributes.position, cols = new Float32Array(pos.count * 3)
      for (let k = 0; k < pos.count; k++) { const y = clamp01((pos.getY(k) + h / 2 + y0) / HW), f = 0.6 + 0.4 * Math.pow(y, 0.55); cols.set([f, f, f * 1.03], k * 3) }
      geo.setAttribute('color', new THREE.BufferAttribute(cols, 3)); return geo
    }
    const svgImg = async (body, color, sw = 2) => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`
      const img = new Image(); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); await img.decode(); return img
    }
    const icoImg = (name, color, sw) => svgImg(name === 'cone' ? CONE : ICONS[name], color, sw)
    const hex = c => '#' + col(c).getHexString()
    const acc = col(p.accent), accHex = hex(p.accent), accDark = hex(acc.clone().multiplyScalar(0.62)), inkStamp = hex(acc.clone().lerp(col(PAL.brand), 0.55).multiplyScalar(0.85))
    const font = (g, s, w = 700, fam = "'Space Grotesk', sans-serif") => { g.font = `${w} ${s}px ${fam}`; return s }
    // Groesste Schrift (ab start), mit der txt in room passt
    const fitFont = (g, txt, start, room, w = 700, fam) => { let s = font(g, start, w, fam); while (g.measureText(txt).width > room && s > 8) s = font(g, s * 0.96, w, fam); return s }
    await kit.fonts(p.shop + menu.join('') + 'STEMPELKARTE GRATIS')
    await document.fonts.load("500 60px 'Hanken Grotesk'")

    // Feste Bilder (Symbole) in den Farben, die die Texturen brauchen
    const icon = {
      brand: await icoImg(p.icon, PAL.brand), white: await icoImg(p.icon, '#FFFFFF', 2.2),
      faint: await icoImg(p.icon, 'rgba(185,176,255,.45)'), paperOn: await icoImg(p.icon, PAL.paper, 2.4),
      order: await icoImg(BR.order, PAL.brand, 2.1), check: await svgImg(ICONS.check, '#FFFFFF', 3), checkBrand: await svgImg(ICONS.check, PAL.brand, 3)
    }

    // ---------------------------------------------------------------- Licht
    // Abendlicht von hinten rechts (der "Mond" des Baukastens, hier warm, aus derselben Richtung wie in der
    // Stadt): faellt durch Fenster und Glastuer als zwei Lichtflecken nach vorn links auf den freien Boden,
    // ueber den der Kunde hereinkommt. Von hinten links (erster Versuch) fiel das Fensterlicht auf die Theke
    // und den Inhaber und war am Boden nicht zu sehen. Der Raum selbst lebt vom Himmelslicht (Umgebung, lila),
    // einem warmen Licht ueber der Theke und der schwachen Aufhellung von vorn.
    const RC = V(-3.5, 0, 3.5) // Mitte des Raums im Bild: dorthin zielt das Abendlicht
    const lights = kit.nightLights({
      hemi: 1.25,
      moon: { color: '#FFB06A', intensity: 3.4, pos: [RC.x + 10, 13.5, RC.z - 17], box: 13, near: 4, far: 60, size: 2048 },
      fill: { color: PAL.fill, intensity: 0.7, pos: [-30, 22, 32] }
    })
    lights.moon.target.position.copy(RC); lights.moon.shadow.bias = -0.0004; lights.moon.shadow.normalBias = 0.03
    // Warmes Licht ueber der Theke (das einzige echte Punktlicht: es faerbt Figuren, Theke und Handys)
    const lamp = kit.pointLight(scene, [-2.3, 3.4, 2.5], '#FFD9A8', 26, 9, 1.5)

    // ---------------------------------------------------------------- Dach, das nur Schatten wirft
    // Ohne Dach fiel das Abendlicht ueber die Mauerkronen auf den halben Boden (eine helle Flaeche vorn, die
    // nicht durchs Fenster kam). Die Flaeche zeigt nach unten: die Kamera ist immer darueber und sieht nur
    // ihre Rueckseite, die wird weggelassen (kostet nichts); der Schatten rechnet beide Seiten.
    {
      const roof = new THREE.Mesh(new THREE.PlaneGeometry(ROOM + 2 * WT, ROOM + 2 * WT), new THREE.MeshBasicMaterial({ color: '#000000', side: THREE.FrontSide, shadowSide: THREE.DoubleSide }))
      roof.rotation.x = Math.PI / 2; roof.position.set((-ROOM + WT) / 2, HW + 0.12, (ROOM - WT) / 2); roof.castShadow = true; roof.receiveShadow = false
      scene.add(roof)
    }

    // ---------------------------------------------------------------- Draussen: Strassen und Haeuser der Stadt
    // Ueber den Mauerkronen sieht man in die Stadt von iso-street (dieselben Haeuser, Fenster, Laternen): so
    // ist das Bild bis oben gefuellt und der Laden steht in derselben Welt. In der ersten Probe war das obere
    // Drittel ueber dem Laden schwarz. Durch Fenster und Tuer sieht man (von oben) nur den Gehweg.
    {
      const R0 = rng(20261118), GO = -40, GS = 80, GN = 1024
      const map = kit.groundMap({ origin: GO, size: GS, px: GN }), gx = map.gx
      // Gehwege: hinter der Rueckwand (z -3,4 bis 0) und rechts neben der rechten Wand (x 0 bis 3,4); gegenueber
      const walks = [[-40, 3.4, -3.4, 0], [0, 3.4, -3.4, 40], [-40, 40, -40, -8.4], [8.4, 40, -40, 40]]
      // Keine Laterne hinter der Ecke: ihr Kopf sass im Bild genau auf der Mauerecke, wie aufgesteckt
      const lampsAt = [[-10.5, -3.0], [-2.5, -3.0], [3.0, 7.5], [-18.5, -3.0], [3.0, 16]]
      const gtex = kit.canvasTex(GN, GN, g => {
        g.fillStyle = PAL.road; g.fillRect(0, 0, GN, GN)
        for (const [x0, x1, z0, z1] of walks) { g.fillStyle = PAL.walk; g.fillRect(gx(x0), gx(z0), gx(x1) - gx(x0), gx(z1) - gx(z0)); g.strokeStyle = PAL.curb; g.lineWidth = 2; g.strokeRect(gx(x0), gx(z0), gx(x1) - gx(x0), gx(z1) - gx(z0)) }
        g.fillStyle = PAL.mark; for (let x = -40; x < 40; x += 3) g.fillRect(gx(x), gx(-5.95), 1.5 * map.m, 0.14 * map.m)
        for (let z = -40; z < 40; z += 3) g.fillRect(gx(5.85), gx(z), 0.14 * map.m, 1.5 * map.m)
      })
      const glowT = kit.canvasTex(GN, GN, g => {
        g.fillStyle = '#000'; g.fillRect(0, 0, GN, GN); g.globalCompositeOperation = 'lighter'
        for (const [x, z] of lampsAt) map.spot(g, x, z, 3.6, PAL.poolLamp, 0.42)
        map.spot(g, DOOR.x, -1.0, 2.4, '255,190,130', 0.3); map.spot(g, (WIN.x0 + WIN.x1) / 2, -1.0, 2.2, '255,190,130', 0.26)
      })
      const og = new THREE.Mesh(new THREE.PlaneGeometry(GS, GS), map.worldMapped(lam('#FFFFFF', { map: gtex, emissive: '#FFFFFF', emissiveMap: glowT })))
      og.rotation.x = -Math.PI / 2; og.position.y = -0.03; og.receiveShadow = true; scene.add(og)
      // Haeuser gegenueber (hinter der Rueckwand, Fronten nach +z) und rechts (Fronten nach -x)
      const houses = [], wins = []
      const row = (axis) => {
        for (let k = 0; k < 9; k++) {
          const w = 5.6 + R0() * 1.6, d = 7, h = 3 * (3 + Math.floor(R0() * 3)) + 0.6
          if (axis === 'back') { const x = -28 + k * 6.6, z = -8.6 - d / 2; if (x > 9) continue; houses.push({ x, z, w, d, h, c: PAL.city[Math.floor(R0() * 5)] }); for (let f = 0; f * 3 + 1.8 < h - 0.6; f++) for (let i = 0; i < 3; i++) wins.push({ x: x - w / 2 + (i + 0.5) * w / 3, y: 1.8 + f * 3, z: z + d / 2 + 0.03, ry: 0, on: R0() }) }
          else { const z = -15 + k * 6.6, x = 8.6 + d / 2; houses.push({ x, z, w: d, d: w, h, c: PAL.city[Math.floor(R0() * 5)] }); for (let f = 0; f * 3 + 1.8 < h - 0.6; f++) for (let i = 0; i < 3; i++) wins.push({ x: x - d / 2 - 0.03, y: 1.8 + f * 3, z: z - w / 2 + (i + 0.5) * w / 3, ry: -Math.PI / 2, on: R0() }) }
        }
      }
      row('back'); row('side')
      // Kein Schatten von draussen: die Haeuser gegenueber stuenden sonst im tiefen Abendlicht und nahmen dem
      // Fenster sein Licht
      kit.houses(houses, { y0: 0 }).castShadow = false; kit.windows(wins)
      kit.lamps(lampsAt, { y0: 0, glowIf: k => k < 4 }).pole.castShadow = false
      // Niedriger Kleinkram vor dem Fenster (durch das Fenster zu sehen)
      put(rbox(1.6, 0.7, 0.6, 0.12), L('#4F4590'), -4.8, 0.35, -2.3, { cast: false })
      for (let i = 0; i < 4; i++) put(new THREE.IcosahedronGeometry(0.32, 0), lam(PAL.tree[i % 4], { flatShading: true }), -5.4 + i * 0.4, 0.82, -2.3, { cast: false })
      // Dunst: die Stadt verschwimmt nach hinten, der Laden bleibt klar (Abstand wird je Bild nachgefuehrt)
      scene.fog = new THREE.Fog(PAL.fog, 60, 110)
    }

    // ---------------------------------------------------------------- Boden (eine gemalte Karte: Dielen, Teppich, Verdeckung)
    const FX0 = -ROOM, FZ0 = -WT, FS = ROOM + WT, FN = 2048
    const fx = x => (x - FX0) / FS * FN, fz = z => (z - FZ0) / FS * FN, fm = FN / FS
    const floorTex = kit.canvasTex(FN, FN, g => {
      const R = rng(4711)
      g.fillStyle = IN.floor; g.fillRect(0, 0, FN, FN)
      // Dielen quer zur Rueckwand, versetzte Stoesse, jede eine Spur heller oder dunkler
      const PW = 0.46
      for (let z = FZ0, row = 0; z < FZ0 + FS; z += PW, row++) {
        let x = FX0 - (row % 3) * 0.9
        while (x < FX0 + FS) {
          const len = 2.2 + R() * 1.4, k = 0.9 + R() * 0.18
          g.fillStyle = '#' + col(IN.floor).multiplyScalar(k).getHexString(); g.fillRect(fx(x), fz(z), len * fm, PW * fm)
          g.fillStyle = 'rgba(40,20,40,.55)'; g.fillRect(fx(x + len) - 2, fz(z), 3, PW * fm)
          x += len
        }
        g.fillStyle = 'rgba(40,20,40,.5)'; g.fillRect(0, fz(z), FN, 3)
      }
      // Teppich vor der Theke: dort steht der Kunde, und der Platz liest sich als "hier wird bedient"
      g.fillStyle = '#5A4BB0'; g.beginPath(); g.roundRect(fx(-4.1), fz(3.2), 3.9 * fm, 1.9 * fm, 0.3 * fm); g.fill()
      g.strokeStyle = IN.trim; g.lineWidth = 0.07 * fm; g.beginPath(); g.roundRect(fx(-3.95), fz(3.35), 3.6 * fm, 1.6 * fm, 0.22 * fm); g.stroke()
      // Fussmatte innen vor der Tuer
      g.fillStyle = '#6A4E8C'; g.beginPath(); g.roundRect(fx(DOOR.x - 0.9), fz(0.15), 1.8 * fm, 1.05 * fm, 0.12 * fm); g.fill()
      g.strokeStyle = '#8C74B8'; g.lineWidth = 0.05 * fm; g.beginPath(); g.roundRect(fx(DOOR.x - 0.8), fz(0.25), 1.6 * fm, 0.85 * fm, 0.08 * fm); g.stroke()
      // Verdeckung: weich dunkel entlang der Waende und unter Theke und Arbeitsplatte
      g.filter = `blur(${Math.round(0.35 * fm)}px)`; g.fillStyle = 'rgba(14,6,26,.55)'
      g.fillRect(0, 0, FN, fz(0.32)); g.fillRect(fx(-0.32), 0, FN, FN)
      g.fillRect(fx(CNT.x0 - 0.12), fz(CNT.z0 - 0.1), (CNT.x1 - CNT.x0 + 0.24) * fm, (CNT.z1 - CNT.z0 + 0.22) * fm)
      g.fillRect(fx(BENCH.x0 - 0.1), 0, (BENCH.x1 - BENCH.x0 + 0.2) * fm, fz(BENCH.z1 + 0.12))
      g.filter = 'none'
    })
    const floor = put(new THREE.PlaneGeometry(FS, FS), lam('#FFFFFF', { map: floorTex }), FX0 + FS / 2, 0, FZ0 + FS / 2, { cast: false })
    floor.rotation.x = -Math.PI / 2; floor.renderOrder = 2

    // ---------------------------------------------------------------- Waende (aufgeschnitten, mit Oeffnungen)
    const wallM = std('#FFFFFF', { vertexColors: true, color: IN.wall, roughness: 0.9 }), lowM = S(IN.wallLow, { roughness: 0.85 }), trimM = S(IN.trim, { roughness: 0.6 }), capM = S(IN.cap, { roughness: 0.7, emissive: '#3A3180', emissiveIntensity: 0.25 })
    // Rueckwand: Stuecke um Tuer und Fenster, jedes [x0, x1, y0, y1]
    const dx0 = DOOR.x - DOOR.w / 2, dx1 = DOOR.x + DOOR.w / 2
    const backParts = [[-ROOM, dx0, 0, HW], [dx0, dx1, DOOR.h, HW], [dx1, WIN.x0, 0, HW], [WIN.x0, WIN.x1, 0, WIN.y0], [WIN.x0, WIN.x1, WIN.y1, HW], [WIN.x1, WT, 0, HW]]
    for (const [x0, x1, y0, y1] of backParts) put(shadedBox(x1 - x0, y1 - y0, WT, y0, 0.03), wallM, (x0 + x1) / 2, (y0 + y1) / 2, -WT / 2)
    put(shadedBox(WT, HW, ROOM + WT, 0, 0.03), wallM, WT / 2, HW / 2, (ROOM - WT) / 2)
    // Helle Schnittkante oben (Puppenhaus): sagt sofort "aufgeschnitten", nicht "dunkler Raum ohne Decke". Ohne
    // Schatten: das Schattendach liegt knapp darueber und malte feine Streifen auf die Kante (shadow acne)
    put(rbox(ROOM + WT + 0.04, 0.07, WT + 0.04, 0.03), capM, (-ROOM + WT) / 2, HW + 0.035, -WT / 2, { cast: false, recv: false })
    // rechte Kante beginnt erst hinter der hinteren: zwei gleich hohe Flaechen uebereinander flackern (z-fighting)
    put(rbox(WT + 0.04, 0.07, ROOM - 0.02, 0.03), capM, WT / 2, HW + 0.039, ROOM / 2 + 0.01, { cast: false, recv: false })
    // Sockel (unten dunkler) und Zierleiste: liest sich als Wand mit Holzverkleidung, nicht als Kiste
    const WAIN = 1.15
    for (const [x0, x1] of [[-ROOM, dx0], [dx1, WIN.x0], [WIN.x0, WIN.x1], [WIN.x1, 0]]) {
      put(rbox(x1 - x0, WAIN, 0.06, 0.02), lowM, (x0 + x1) / 2, WAIN / 2, 0.03, { cast: false })
      put(rbox(x1 - x0, 0.07, 0.1, 0.03), trimM, (x0 + x1) / 2, WAIN + 0.03, 0.05, { cast: false })
    }
    put(rbox(0.06, WAIN, ROOM, 0.02), lowM, -0.03, WAIN / 2, ROOM / 2, { cast: false })
    put(rbox(0.1, 0.07, ROOM, 0.03), trimM, -0.05, WAIN + 0.03, ROOM / 2, { cast: false })

    // ---------------------------------------------------------------- Glastuer mit Glocke
    const frameM = S(IN.dark, { roughness: 0.5 })
    put(rbox(0.14, DOOR.h + 0.1, WT + 0.08, 0.03), frameM, dx0 - 0.02, (DOOR.h + 0.1) / 2, -WT / 2)
    put(rbox(0.14, DOOR.h + 0.1, WT + 0.08, 0.03), frameM, dx1 + 0.02, (DOOR.h + 0.1) / 2, -WT / 2)
    put(rbox(DOOR.w + 0.3, 0.16, WT + 0.08, 0.03), frameM, DOOR.x, DOOR.h + 0.06, -WT / 2)
    // Tuerblatt: Angel rechts (zum Fenster hin), schwingt nach innen auf. Wer gerade durch die Mitte geht,
    // laeuft am offenen Blatt vorbei (es steht dann quer zur Wand, 0,7 m neben seinem Weg).
    const hinge = new THREE.Group(); hinge.position.set(dx1 - 0.05, 0, 0.02); scene.add(hinge)
    const leafW = DOOR.w - 0.1, leafM = S(accDark, { roughness: 0.45 })
    for (const [w, h, x, y] of [[0.1, DOOR.h - 0.05, -0.05, (DOOR.h - 0.05) / 2], [0.1, DOOR.h - 0.05, -leafW + 0.05, (DOOR.h - 0.05) / 2], [leafW, 0.12, -leafW / 2, 0.06], [leafW, 0.1, -leafW / 2, DOOR.h - 0.1], [leafW, 0.1, -leafW / 2, 1.2]]) {
      put(rbox(w, h, 0.07, 0.025), leafM, x, y, 0, { parent: hinge, cast: false })
    }
    // Glas: kaum sichtbar, ein heller Schimmer (draussen ist dunkler als drinnen)
    const glassM = new THREE.MeshBasicMaterial({ color: '#BFB6FF', transparent: true, opacity: 0.1, depthWrite: false })
    put(new THREE.PlaneGeometry(leafW - 0.16, DOOR.h - 0.3), glassM, -leafW / 2, DOOR.h / 2, 0, { parent: hinge, cast: false, recv: false })
    const handle = put(rbox(0.05, 0.42, 0.05, 0.02), S('#E8E2FF', { metalness: 0.5, roughness: 0.3 }), -leafW + 0.2, 1.5, 0.08, { parent: hinge, cast: false })
    const bell = kit.bell({ pos: V(DOOR.x - 0.35, DOOR.h + 0.42, 0.24), rot: 0 })
    // Ein Schild "offen" waere Text; stattdessen das Symbol des Ladens als Aufkleber auf dem Glas
    const stickerTex = kit.canvasTex(256, 256, (g, w) => { g.fillStyle = accHex; g.beginPath(); g.arc(w / 2, w / 2, w * 0.46, 0, Math.PI * 2); g.fill(); g.drawImage(icon.white, w * 0.2, w * 0.2, w * 0.6, w * 0.6) }, { sharp: true })
    put(new THREE.PlaneGeometry(0.42, 0.42), new THREE.MeshBasicMaterial({ map: stickerTex, transparent: true, toneMapped: false }), -leafW / 2, 1.85, 0.045, { parent: hinge, cast: false, recv: false })

    // ---------------------------------------------------------------- Fenster
    put(rbox(WIN.x1 - WIN.x0 + 0.3, 0.14, WT + 0.24, 0.04), S(IN.top), (WIN.x0 + WIN.x1) / 2, WIN.y0 - 0.02, -WT / 2 + 0.1)                 // Fensterbank
    for (const [x, y, w, h] of [[WIN.x0 - 0.04, (WIN.y0 + WIN.y1) / 2, 0.1, WIN.y1 - WIN.y0], [WIN.x1 + 0.04, (WIN.y0 + WIN.y1) / 2, 0.1, WIN.y1 - WIN.y0], [(WIN.x0 + WIN.x1) / 2, WIN.y1 + 0.04, WIN.x1 - WIN.x0 + 0.18, 0.1],
      [(WIN.x0 + WIN.x1) / 2, (WIN.y0 + WIN.y1) / 2, 0.07, WIN.y1 - WIN.y0], [(WIN.x0 + WIN.x1) / 2, (WIN.y0 + WIN.y1) / 2 + 0.15, WIN.x1 - WIN.x0, 0.07]]) {
      put(rbox(w, h, 0.14, 0.025), frameM, x, y, -0.04) // steht 3 cm vor der Wand: buendig flackerte es
    }
    put(new THREE.PlaneGeometry(WIN.x1 - WIN.x0, WIN.y1 - WIN.y0), glassM, (WIN.x0 + WIN.x1) / 2, (WIN.y0 + WIN.y1) / 2, -0.1, { cast: false, recv: false })
    // Pflanze auf der Fensterbank
    put(cyl(0.16, 0.12, 0.26, 14), S('#C9786A'), WIN.x0 + 0.35, WIN.y0 + 0.18, 0.05)
    put(new THREE.IcosahedronGeometry(0.24, 0), lam(PAL.tree[2], { flatShading: true }), WIN.x0 + 0.35, WIN.y0 + 0.48, 0.05)
    // Schein im Fenster: von innen gesehen leuchtet das Abendlicht im Glas
    glow('#FFB27A', 2.6, V((WIN.x0 + WIN.x1) / 2, (WIN.y0 + WIN.y1) / 2, 0.05), 0.22)
    glow('#FFB27A', 2.2, V(DOOR.x, 1.9, 0.05), 0.14)

    // ---------------------------------------------------------------- Theke
    const counter = new THREE.Group(); scene.add(counter)
    const cw = CNT.x1 - CNT.x0, cd = CNT.z1 - CNT.z0, cx = (CNT.x0 + CNT.x1) / 2, cz = (CNT.z0 + CNT.z1) / 2
    // Front in der Ladenfarbe mit senkrechten Latten (Holzverkleidung, wie Spielzeug)
    const slatTex = kit.canvasTex(512, 256, (g, w, h) => {
      g.fillStyle = accHex; g.fillRect(0, 0, w, h)
      for (let i = 0; i < 16; i++) { g.fillStyle = i % 2 ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.08)'; g.fillRect(i * w / 16, 0, w / 16, h); g.fillStyle = 'rgba(20,10,40,.28)'; g.fillRect(i * w / 16, 0, 3, h) }
      const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(255,255,255,.12)'); gr.addColorStop(0.7, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(10,5,30,.35)'); g.fillStyle = gr; g.fillRect(0, 0, w, h)
    })
    put(rbox(cw - 0.1, CNT.h - 0.12, cd - 0.1, 0.05), S(accDark), cx, (CNT.h - 0.12) / 2, cz, { parent: counter })
    put(new THREE.PlaneGeometry(cw - 0.14, CNT.h - 0.2), std('#FFFFFF', { map: slatTex, roughness: 0.75 }), cx, (CNT.h - 0.12) / 2, CNT.z1 - 0.04, { parent: counter })
    put(new THREE.PlaneGeometry(cd - 0.14, CNT.h - 0.2), std('#FFFFFF', { map: slatTex, roughness: 0.75 }), CNT.x0 + 0.04, (CNT.h - 0.12) / 2, cz, { parent: counter, ry: -Math.PI / 2 })
    // Platte aus warmem Holz: eine helle Platte war so hell wie die Papierkarte, und die verschwand darauf
    put(rbox(cw + 0.16, 0.12, cd + 0.14, 0.05), S(IN.counterTop, { roughness: 0.6 }), cx, CNT.h - 0.06, cz, { parent: counter })
    // Kasse rechts auf der Theke (kleiner Bildschirm zum Inhaber hin)
    put(rbox(0.5, 0.2, 0.42, 0.05), S(IN.dark), CNT.x1 - 0.4, CNT.h + 0.1, cz - 0.05, { parent: counter })
    const reg = put(rbox(0.46, 0.32, 0.06, 0.03), S('#2C2466'), CNT.x1 - 0.4, CNT.h + 0.38, cz - 0.15, { parent: counter }); reg.rotation.x = -0.35
    put(new THREE.PlaneGeometry(0.38, 0.24), B('#9F95FF'), CNT.x1 - 0.4, CNT.h + 0.385, cz - 0.185, { parent: counter, cast: false, recv: false }).rotation.x = Math.PI - 0.35

    // ---------------------------------------------------------------- Arbeitsplatte, Regale, Schild, Tafel
    const bw = BENCH.x1 - BENCH.x0, bx = (BENCH.x0 + BENCH.x1) / 2
    put(rbox(bw, BENCH.h - 0.1, BENCH.z1 - 0.05, 0.05), S(IN.woodDark), bx, (BENCH.h - 0.1) / 2, (BENCH.z1 + 0.05) / 2)
    put(rbox(bw + 0.08, 0.1, BENCH.z1 + 0.04, 0.04), S(IN.top, { roughness: 0.55 }), bx, BENCH.h - 0.05, BENCH.z1 / 2)
    for (let i = 0; i < 5; i++) put(rbox(0.04, 0.6, 0.02, 0.01), S('#3E2731'), BENCH.x0 + (i + 0.5) * bw / 5, 0.55, BENCH.z1 + 0.02, { cast: false })
    const SH = [2.05, 2.8] // Hoehen der beiden Wandregale hinter der Theke
    for (const y of SH) put(rbox(bw - 0.3, 0.07, 0.42, 0.03), S(IN.wood), bx, y, 0.21)
    // Licht unter dem oberen Regal: warmer Streifen, der die Rueckwand hinter dem Inhaber hebt
    put(rbox(bw - 0.5, 0.025, 0.03, 0.01), B('#FFE2B8'), bx, SH[1] - 0.05, 0.4, { cast: false, recv: false })
    glow('#FFC890', 3.4, V(bx, SH[1] - 0.25, 0.25), 0.18)
    // Ladenschild als Leuchtkasten (Name mit der Zwei-Zeilen-Regel des Baukastens)
    const { tex: signTex, info: signInfo } = kit.signTexture(p.shop, { w: SIGN.w, h: SIGN.h, px: 2048, accent: p.accent })
    if (!signInfo.fits || signInfo.size < 0.42) ctx.warn(`der Name "${p.shop}" steht auf dem Schild sehr klein. Namen kürzen (höchstens etwa 14 Zeichen).`)
    put(rbox(SIGN.w + 0.18, SIGN.h + 0.18, 0.2, 0.06), frameM, SIGN.x, SIGN.y, 0.1)
    const signMat = new THREE.MeshBasicMaterial({ map: signTex, toneMapped: false })
    put(new THREE.PlaneGeometry(SIGN.w, SIGN.h), signMat, SIGN.x, SIGN.y, 0.205, { cast: false, recv: false })
    const signHalo = put(new THREE.PlaneGeometry(SIGN.w + 2.2, SIGN.h + 1.5), new THREE.MeshBasicMaterial({ map: kit.blobTex, color: '#B3A8FF', transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false }), SIGN.x, SIGN.y, 0.03, { cast: false, recv: false })
    const signCorners = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) => V(SIGN.x + sx * (SIGN.w + 0.18) / 2, SIGN.y + sy * (SIGN.h + 0.18) / 2, 0.2))
    // Wandleuchten links und rechts vom Schild
    for (const sx of [-1, 1]) {
      const x = SIGN.x + sx * (SIGN.w / 2 + 0.42)
      put(rbox(0.12, 0.3, 0.12, 0.04), frameM, x, SIGN.y - 0.05, 0.08)
      put(new THREE.SphereGeometry(0.13, 16, 10), B('#FFE4BC'), x, SIGN.y + 0.14, 0.18, { cast: false, recv: false })
      glow('#FFC890', 1.6, V(x, SIGN.y + 0.05, 0.25), 0.4)
    }
    // Tafel an der rechten Wand: drei Woerter, gross genug fuers Handy
    const menuTex = kit.canvasTex(1024, Math.round(1024 * MENU.h / MENU.w), (g, w, h) => {
      g.fillStyle = '#251C52'; g.beginPath(); g.roundRect(0, 0, w, h, 34); g.fill()
      g.strokeStyle = IN.trim; g.lineWidth = 14; g.beginPath(); g.roundRect(18, 18, w - 36, h - 36, 24); g.stroke()
      const rowH = (h - 90) / 3, room = w - 230
      let smallest = 1
      menu.forEach((m, i) => {
        const y = 45 + rowH * (i + 0.5), s = fitFont(g, m, rowH * 0.6, room)
        smallest = Math.min(smallest, s / rowH)
        g.fillStyle = accHex; g.beginPath(); g.arc(110, y, rowH * 0.12, 0, Math.PI * 2); g.fill()
        g.fillStyle = PAL.paper; g.textBaseline = 'middle'; g.textAlign = 'left'; g.fillText(m, 175, y + 4)
      })
      if (smallest < 0.38) ctx.warn(`ein Wort auf der Tafel ("${menu.join('", "')}") steht sehr klein. Kürzer schreiben (höchstens etwa 10 Zeichen).`)
    }, { sharp: true })
    put(rbox(0.12, MENU.h + 0.14, MENU.w + 0.14, 0.04), S(IN.woodDark), -0.06, MENU.y, MENU.z)
    const menuCol = col('#E6E1F5'), menuMat = new THREE.MeshBasicMaterial({ map: menuTex, toneMapped: false, color: menuCol.clone() })
    put(new THREE.PlaneGeometry(MENU.w, MENU.h), menuMat, -0.125, MENU.y, MENU.z, { cast: false, recv: false, ry: -Math.PI / 2 })
    const menuCorners = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sz, sy]) => V(-0.13, MENU.y + sy * (MENU.h + 0.14) / 2, MENU.z + sz * (MENU.w + 0.14) / 2))

    // ---------------------------------------------------------------- Einrichtung je Branche
    const top = BENCH.h, ctop = CNT.h
    const shelfY = SH.map(y => y + 0.035)
    const R = rng(1709)
    const mug = (x, y, z, c, s = 1) => { put(cyl(0.11 * s, 0.09 * s, 0.2 * s, 14), S(c, { roughness: 0.45 }), x, y + 0.1 * s, z); put(new THREE.TorusGeometry(0.06 * s, 0.022 * s, 6, 12), S(c), x + 0.11 * s, y + 0.1 * s, z) }
    const jar = (x, y, z, c, h = 0.34) => { put(cyl(0.11, 0.11, h, 14), S('#EAE4FF', { roughness: 0.2, transparent: true, opacity: 0.55 }), x, y + h / 2, z, { cast: false }); put(cyl(0.09, 0.09, h * 0.7, 12), S(c), x, y + h * 0.36, z, { cast: false }); put(cyl(0.12, 0.12, 0.05, 14), S(IN.dark), x, y + h + 0.02, z) }
    const bottle = (x, y, z, c, h = 0.42) => { put(cyl(0.08, 0.09, h * 0.7, 12), S(c, { roughness: 0.35 }), x, y + h * 0.35, z); put(cyl(0.035, 0.06, h * 0.32, 10), S(c, { roughness: 0.35 }), x, y + h * 0.86, z) }
    if (p.branch === 'cafe') {
      // Siebtraeger auf der Arbeitsplatte, rechts
      const ex = -1.35
      put(rbox(1.0, 0.75, 0.55, 0.08), S(IN.metal, { metalness: 0.45, roughness: 0.32 }), ex, top + 0.38, 0.32)
      put(rbox(0.9, 0.2, 0.08, 0.04), S(IN.dark), ex, top + 0.55, 0.62, { cast: false })
      for (const sx of [-0.22, 0.22]) { put(cyl(0.08, 0.06, 0.12, 12), S('#2A2350', { metalness: 0.6, roughness: 0.3 }), ex + sx, top + 0.4, 0.62); mug(ex + sx, top + 0.02, 0.66, '#FFFFFF', 0.75) }
      for (let i = 0; i < 3; i++) mug(ex - 0.3 + i * 0.3, top + 0.76, 0.3, '#FFFFFF', 0.7)
      put(cyl(0.03, 0.03, 0.3, 8), S(IN.metal, { metalness: 0.6 }), ex + 0.42, top + 0.42, 0.6)
      // Tassenturm links, Glaeser mit Bohnen und Tassen im Regal
      for (let i = 0; i < 3; i++) mug(-3.55, top + i * 0.2, 0.35, '#F4EEE2', 0.9)
      for (let i = 0; i < 5; i++) jar(-3.4 + i * 0.32, shelfY[0], 0.2, ['#6B3E2E', '#8A5A3A', '#5A3424'][i % 3])
      for (let i = 0; i < 6; i++) mug(-3.35 + i * 0.5, shelfY[1], 0.22, [accHex, '#F4EEE2', PAL.lilac][i % 3], 0.9)
      // Kuchenvitrine auf der Theke: Teller, Kuchen mit Stueck heraus, Glashaube
      const kx = CNT.x1 - 0.95
      put(cyl(0.34, 0.3, 0.05, 24), S('#FFFFFF'), kx, ctop + 0.04, cz)
      put(new THREE.CylinderGeometry(0.27, 0.27, 0.12, 24, 1, false, 0.6, 5.4), S('#F2D6A8'), kx, ctop + 0.12, cz)
      put(new THREE.CylinderGeometry(0.27, 0.27, 0.06, 24, 1, false, 0.6, 5.4), S('#E58AA8'), kx, ctop + 0.21, cz)
      put(new THREE.CylinderGeometry(0.27, 0.27, 0.06, 24, 1, false, 0.6, 5.4), S('#FFF4E8'), kx, ctop + 0.27, cz)
      put(new THREE.SphereGeometry(0.36, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#E6E0FF', transparent: true, opacity: 0.22, roughness: 0.1, depthWrite: false }), kx, ctop + 0.06, cz, { cast: false, recv: false })
      put(new THREE.SphereGeometry(0.04, 10, 8), S(IN.metal), kx, ctop + 0.43, cz)
    } else if (p.branch === 'doener') {
      // Drehspiess links auf der Arbeitsplatte, dahinter das gluehende Heizfeld
      const sx = -3.2
      put(rbox(0.85, 1.25, 0.16, 0.05), S('#3A2230'), sx, top + 0.7, 0.14)
      const heat = kit.canvasTex(128, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#FF9A3D'); gr.addColorStop(0.5, '#FF6A2A'); gr.addColorStop(1, '#C93A1A'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(255,230,160,.7)'; g.lineWidth = 6; for (let y = 20; y < h; y += 34) { g.beginPath(); g.moveTo(10, y); g.lineTo(w - 10, y); g.stroke() } })
      put(new THREE.PlaneGeometry(0.66, 1.05), new THREE.MeshBasicMaterial({ map: heat }), sx, top + 0.72, 0.225, { cast: false })
      glow('#FF8A3A', 2.4, V(sx, top + 0.7, 0.4), 0.45)
      put(cyl(0.025, 0.025, 1.6, 8), S(IN.metal, { metalness: 0.7 }), sx, top + 0.8, 0.5)
      const meatTex = kit.canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#A0582E'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 14) { g.fillStyle = y % 28 ? 'rgba(255,190,120,.35)' : 'rgba(80,30,10,.35)'; g.fillRect(0, y, w, 7) } })
      put(new THREE.CylinderGeometry(0.34, 0.22, 1.0, 18), std('#FFFFFF', { map: meatTex, roughness: 0.6 }), sx, top + 0.75, 0.5)
      put(cyl(0.36, 0.36, 0.05, 18), S(IN.metal, { metalness: 0.6 }), sx, top + 0.22, 0.5)
      // Grillplatte rechts mit Brot und Paprika
      put(rbox(1.0, 0.16, 0.5, 0.04), S('#2A2440', { metalness: 0.4, roughness: 0.4 }), -1.4, top + 0.08, 0.36)
      for (let i = 0; i < 3; i++) { const b = put(new THREE.SphereGeometry(0.16, 14, 10), S('#E3B067'), -1.75 + i * 0.35, top + 0.2, 0.36); b.scale.set(1.3, 0.35, 0.8) }
      for (let i = 0; i < 6; i++) bottle(-3.3 + i * 0.48, shelfY[0], 0.2, ['#D94A3A', '#E8C24A', '#5FA35A'][i % 3], 0.36)
      for (let i = 0; i < 4; i++) { const b = put(new THREE.SphereGeometry(0.22, 14, 10), S('#E9C27F'), -3.2 + i * 0.6, shelfY[1] + 0.07, 0.2); b.scale.set(1.5, 0.4, 0.9) }
      // Auf der Theke: Schale mit Salat
      put(cyl(0.3, 0.2, 0.14, 18), S('#F4EEE2'), CNT.x1 - 0.95, ctop + 0.07, cz)
      for (let i = 0; i < 5; i++) put(new THREE.IcosahedronGeometry(0.09, 0), lam(['#6FBF5A', '#D94A3A', '#E8E0C8'][i % 3], { flatShading: true }), CNT.x1 - 0.95 + Math.cos(i * 1.3) * 0.12, ctop + 0.16, cz + Math.sin(i * 1.3) * 0.12)
    } else if (p.branch === 'friseur') {
      // Spiegel an der rechten Wand unter der Tafel, davor der Friseurstuhl (rechts neben dem kurzen Empfang)
      const mz = MENU.z
      put(rbox(0.1, 1.55, 1.45, 0.08), S(IN.trim, { metalness: 0.3, roughness: 0.35 }), -0.06, 1.85, mz)
      const mirTex = kit.canvasTex(256, 384, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#9C92E6'); gr.addColorStop(0.45, '#5D52A8'); gr.addColorStop(1, '#3A3280'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.moveTo(w * 0.15, 0); g.lineTo(w * 0.42, 0); g.lineTo(w * 0.05, h * 0.55); g.lineTo(0, h * 0.55); g.lineTo(0, h * 0.25); g.fill() })
      put(new THREE.PlaneGeometry(1.25, 1.35), new THREE.MeshBasicMaterial({ map: mirTex }), -0.115, 1.85, mz, { cast: false, recv: false, ry: -Math.PI / 2 })
      const ch = new THREE.Group(); ch.position.set(-1.0, 0, mz + 0.1); ch.rotation.y = Math.PI / 2; scene.add(ch)
      put(cyl(0.38, 0.45, 0.08, 20), S(IN.metal, { metalness: 0.6, roughness: 0.3 }), 0, 0.04, 0, { parent: ch })
      put(cyl(0.08, 0.08, 0.6, 12), S(IN.metal, { metalness: 0.6, roughness: 0.3 }), 0, 0.38, 0, { parent: ch })
      put(rbox(0.85, 0.24, 0.8, 0.1), S(accHex, { roughness: 0.5 }), 0, 0.78, 0, { parent: ch })
      put(rbox(0.8, 0.95, 0.2, 0.1), S(accHex, { roughness: 0.5 }), 0, 1.32, -0.34, { parent: ch })
      for (const sx of [-0.45, 0.45]) put(rbox(0.12, 0.12, 0.7, 0.05), S(IN.dark), sx, 1.02, 0, { parent: ch })
      put(rbox(0.5, 0.06, 0.25, 0.03), S(IN.metal, { metalness: 0.6 }), 0, 0.3, 0.45, { parent: ch })
      // Regal: Flaschen unten, oben Foehn und Schere
      for (let i = 0; i < 6; i++) bottle(-3.3 + i * 0.5, shelfY[0], 0.2, [accHex, '#5FA39B', '#E2AE4D', '#F4EEE2'][i % 4], 0.4)
      const dry = new THREE.Group(); dry.position.set(-2.95, shelfY[1] + 0.2, 0.22); dry.rotation.y = 0.5; scene.add(dry)
      put(cyl(0.13, 0.13, 0.42, 16), S('#F4EEE2', { roughness: 0.4 }), 0, 0.0, 0, { parent: dry }).rotation.z = Math.PI / 2
      put(cyl(0.09, 0.12, 0.14, 14), S(IN.dark), -0.27, 0, 0, { parent: dry }).rotation.z = Math.PI / 2
      put(rbox(0.1, 0.32, 0.1, 0.04), S('#F4EEE2', { roughness: 0.4 }), 0.1, -0.2, 0, { parent: dry })
      const sci = new THREE.Group(); sci.position.set(-1.6, shelfY[1] + 0.03, 0.22); sci.rotation.y = -0.4; scene.add(sci)
      for (const s of [-1, 1]) {
        const blade = put(rbox(0.5, 0.025, 0.06, 0.012), S(IN.metal, { metalness: 0.75, roughness: 0.25 }), 0.12, 0.015, s * 0.03, { parent: sci }); blade.rotation.y = s * 0.22
        put(new THREE.TorusGeometry(0.07, 0.022, 8, 18), S(accHex), -0.22, 0.02, s * 0.11, { parent: sci }).rotation.x = Math.PI / 2
      }
      for (let i = 0; i < 3; i++) put(rbox(0.5, 0.12, 0.4, 0.05), S(['#F4EEE2', PAL.lilac, accHex][i]), -3.4, top + 0.06 + i * 0.13, 0.35)
      put(cyl(0.15, 0.15, 0.36, 16), S('#5FA39B'), -1.2, top + 0.18, 0.35)
    } else if (p.branch === 'baeckerei') {
      // Brotregal: zwei Regale voller Laibe, unten auf der Platte Koerbe
      const loaf = (x, y, z, s, c) => { const m = put(new THREE.SphereGeometry(0.2, 16, 12), S(c, { roughness: 0.7 }), x, y + 0.11 * s, z); m.scale.set(1.5 * s, 0.75 * s, 0.95 * s); return m }
      for (let i = 0; i < 6; i++) loaf(-3.35 + i * 0.5, shelfY[0], 0.21, 0.95, ['#C98A48', '#A86A34', '#D9A35E'][i % 3])
      for (let i = 0; i < 4; i++) { const b = put(cyl(0.07, 0.07, 0.75, 12), S('#D9A35E', { roughness: 0.7 }), -3.2 + i * 0.75, shelfY[1] + 0.08, 0.22); b.rotation.z = Math.PI / 2 + 0.1 }
      for (let i = 0; i < 3; i++) loaf(-3.2 + i * 0.9, top, 0.4, 1.05, ['#A86A34', '#C98A48', '#8E5A2C'][i])
      // Koerbe mit Broetchen auf der Theke
      const basket = (x, z) => {
        put(cyl(0.34, 0.26, 0.2, 20, 1), S('#B98A55', { roughness: 0.8 }), x, ctop + 0.1, z)
        for (let i = 0; i < 6; i++) { const a = i * 1.05 + 0.3, r = i < 5 ? 0.17 : 0; const m = put(new THREE.SphereGeometry(0.11, 12, 10), S(['#E2B06A', '#D9A35E'][i % 2], { roughness: 0.7 }), x + Math.cos(a) * r, ctop + 0.24, z + Math.sin(a) * r); m.scale.set(1, 0.75, 1) }
      }
      basket(CNT.x1 - 0.95, cz); basket(CNT.x1 - 1.6, cz - 0.05)
    } else if (p.branch === 'eis') {
      // Eistheke auf der Arbeitsplatte hinter dem Inhaber: zwei Reihen bunter Wannen, links und rechts von ihm.
      // Auf der Theke vorn stand sie hinter dem Kunden und war nicht zu sehen.
      const tubs = ['#FFE9B0', '#5A3424', '#FF9FB5', '#9FE0C2', '#FFF27A', '#B9A6FF', '#F4EEE2', '#E65A6A', '#FFB46A', '#7FD0E8', '#C9786A', '#E8E0C8']
      const slots = []
      for (const x0 of [-3.8, -1.95]) for (let r = 0; r < 2; r++) for (let i = 0; i < 3; i++) slots.push([x0 + 0.2 + i * 0.5, 0.2 + r * 0.32])
      put(rbox(1.62, 0.1, 0.72, 0.03), S('#E6E0FF', { metalness: 0.4, roughness: 0.3 }), -3.15, top + 0.05, 0.36); put(rbox(1.62, 0.1, 0.72, 0.03), S('#E6E0FF', { metalness: 0.4, roughness: 0.3 }), -1.3, top + 0.05, 0.36)
      slots.forEach(([x, z], i) => {
        put(rbox(0.42, 0.1, 0.28, 0.03), S(IN.metal, { metalness: 0.5, roughness: 0.3 }), x, top + 0.14, z)
        const sc = put(new THREE.SphereGeometry(0.17, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), S(tubs[i % tubs.length], { roughness: 0.6 }), x, top + 0.18, z); sc.scale.set(1.15, 0.6, 0.8)
      })
      // Waffeltueten stecken mit der Spitze in einem Holzblock mit Loechern (Ring um jedes Loch). Ohne Halter
      // standen sie auf der Spitze auf der blanken Theke, das sah nach Zaubertrick aus (Abnahme 18.11.2026)
      put(rbox(1.0, 0.16, 0.3, 0.04), S(IN.woodDark, { roughness: 0.7 }), -3.07, ctop + 0.08, cz + 0.05)
      for (let i = 0; i < 4; i++) {
        const x = -3.4 + i * 0.22
        put(new THREE.TorusGeometry(0.085, 0.018, 6, 16), S(IN.wood), x, ctop + 0.165, cz + 0.05).rotation.x = Math.PI / 2
        const c = put(new THREE.ConeGeometry(0.09, 0.32, 12), S('#D9A35E'), x, ctop + 0.25, cz + 0.05); c.rotation.x = Math.PI
      }
      for (let i = 0; i < 7; i++) mug(-3.35 + i * 0.42, shelfY[0], 0.2, tubs[i], 0.85)
      for (let i = 0; i < 5; i++) jar(-3.3 + i * 0.6, shelfY[1], 0.2, tubs[(i + 3) % 8], 0.3)
    }

    // ---------------------------------------------------------------- Pflanzen und Kleinkram im Raum
    const plant = (x, z, s = 1) => {
      put(cyl(0.3 * s, 0.24 * s, 0.55 * s, 16), S('#C9786A', { roughness: 0.7 }), x, 0.275 * s, z)
      for (let i = 0; i < 4; i++) put(new THREE.IcosahedronGeometry(0.42 * s, 0), lam(PAL.tree[(i + 1) % 4], { flatShading: true }), x + Math.cos(i * 1.7) * 0.18 * s, (0.85 + i * 0.22) * s, z + Math.sin(i * 1.7) * 0.18 * s)
    }
    plant(-0.55, 3.85, 1.0)
    plant(-8.3, 0.8, 1.0)
    if (p.branch !== 'friseur') {
      // Kleiner Tisch mit zwei Hockern vorn: fuellt den Boden unten, ohne vom Tresen abzulenken (rechts vorn
      // war er vom Bildrand angeschnitten)
      const tx = -4.7, tz = 6.6
      put(cyl(0.6, 0.6, 0.08, 24), S(IN.top), tx, 1.05, tz); put(cyl(0.06, 0.06, 1.0, 10), S(IN.dark), tx, 0.52, tz); put(cyl(0.35, 0.35, 0.05, 16), S(IN.dark), tx, 0.03, tz)
      for (const a of [2.2, 4.0]) { const sx = tx + Math.cos(a) * 1.0, sz = tz + Math.sin(a) * 1.0; put(cyl(0.3, 0.3, 0.12, 18), S(accHex), sx, 0.72, sz); put(cyl(0.05, 0.05, 0.68, 8), S(IN.dark), sx, 0.34, sz) }
      if (p.branch === 'cafe' || p.branch === 'eis') mug(tx + 0.15, 1.09, tz - 0.1, '#FFFFFF', 0.9)
    }

    // ---------------------------------------------------------------- Figuren
    // Inhaber: dunkles Hemd, Schuerze in der Ladenfarbe (sofort als "der hinter der Theke" zu lesen)
    const owner = kit.person({ coat: '#5B4FC0', legs: '#2B2457', hair: '#2A1A2E', skin: '#E3A87C', scale: 1.3 })
    owner.at(OWNER.x, OWNER.z, 0)
    put(rbox(0.5, 0.62, 0.08, 0.04), S(accHex, { roughness: 0.6 }), 0, 1.0, 0.25, { parent: owner.body, cast: false })
    put(rbox(0.26, 0.24, 0.07, 0.03), S(accHex, { roughness: 0.6 }), 0, 1.38, 0.24, { parent: owner.body, cast: false })
    // Zwei Punktaugen: der Inhaber schaut zur Kamera hin, in der Nahaufnahme war sein Kopf sonst eine Kugel
    // ohne Richtung (der Kunde steht mit dem Ruecken zur Kamera und braucht keine)
    for (const sx of [-1, 1]) put(new THREE.SphereGeometry(0.03, 10, 8), S('#1A1440', { roughness: 0.3 }), sx * 0.08, 0.02, 0.205, { parent: owner.head, cast: false })
    // Nicken am Hals: Kopf, Haar (und Muetze) haengen an einem Gelenk auf Halshoehe. Vorher drehte sich nur
    // die Kopfkugel um ihre eigene Mitte, und eine Kugel, die sich dreht, sieht man nicht (nur die Augen
    // rutschten ein Stueck): das Nicken bei der Bestellung war im Bild nicht da.
    const neck = new THREE.Group(); neck.position.y = 1.5; owner.body.add(neck)
    // Das Haar legt kit.person gleich nach dem Kopf an (die Schuerze haengt auch am Koerper, bleibt aber unten)
    const hairCap = owner.body.children[owner.body.children.indexOf(owner.head) + 1]
    neck.attach(owner.head); neck.attach(hairCap)
    if (p.branch === 'doener' || p.branch === 'baeckerei') {
      put(cyl(0.2, 0.21, 0.2, 16), S('#F4EEE2'), 0, 1.98 - 1.5, 0, { parent: neck, cast: false })
    }
    // Kunde: Aussehen aus der Zahl "customer" (fester Zufall, in jedem Lauf gleich)
    const RL = rng(9001 + p.customer * 7919), pick = a => a[Math.floor(RL() * a.length)]
    const look = { coat: p.customer === 0 ? PAL.coat : pick(LOOK.coat.slice(1)), hair: p.customer === 0 ? PAL.hair : pick(LOOK.hair), skin: p.customer === 0 ? PAL.skin : pick(LOOK.skin), legs: pick(LOOK.legs), style: p.customer === 0 ? 'kurz' : pick(LOOK.style) }
    const guest = kit.person({ coat: look.coat, legs: look.legs, hair: look.hair, skin: look.skin, scale: 1.3 })
    const hairM = S(look.hair, { roughness: 0.7 })
    if (look.style === 'dutt') put(new THREE.SphereGeometry(0.11, 14, 10), hairM, 0, 1.93, -0.1, { parent: guest.body, cast: false })
    if (look.style === 'zopf') { const z = put(new THREE.CapsuleGeometry(0.06, 0.26, 4, 8), hairM, 0, 1.6, -0.24, { parent: guest.body, cast: false }); z.rotation.x = 0.35 }
    if (look.style === 'locken') for (let i = 0; i < 7; i++) put(new THREE.SphereGeometry(0.075, 10, 8), hairM, Math.cos(i * 0.9) * 0.2, 1.8 + Math.sin(i * 2.1) * 0.05, Math.sin(i * 0.9) * 0.2 - 0.03, { parent: guest.body, cast: false })
    if (look.style === 'muetze') {
      const capC = hex(col(look.coat).clone().lerp(col('#2A2160'), 0.5))
      put(new THREE.SphereGeometry(0.245, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), S(capC), 0, 1.76, 0, { parent: guest.body, cast: false })
      put(new THREE.TorusGeometry(0.235, 0.04, 8, 24), S(capC), 0, 1.77, 0, { parent: guest.body, cast: false }).rotation.x = Math.PI / 2
      put(new THREE.SphereGeometry(0.07, 10, 8), S('#F4EEE2'), 0, 2.02, 0, { parent: guest.body, cast: false })
    }
    for (const f of [owner, guest]) f.fig.traverse(o => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = true } })

    // ---------------------------------------------------------------- Handys
    // Karte im Handy des Kunden: wie wallet-pass (Kopf mit Symbol und Name, Stempelfelder, QR-Code). Zwei
    // Fassungen (vorher, nachher), umgeschaltet ueber Sichtbarkeit: so haengt das Bild nur an t.
    const qrImg = await (async () => {
      const n = QR.size, q = QR.quiet, side = n + 2 * q, cell = 8, c = document.createElement('canvas'); c.width = c.height = side * cell
      const g = c.getContext('2d'); g.fillStyle = '#FFFFFF'; g.fillRect(0, 0, c.width, c.height); g.fillStyle = PAL.ink
      QR.m.forEach((row, y) => row.forEach((v, x) => { if (v) g.fillRect((x + q) * cell, (y + q) * cell, cell, cell) }))
      return c
    })()
    const cols = Math.ceil(p.stamps / 2)
    const cardTex = filled => kit.canvasTex(600, 1120, (g, w, h) => {
      g.fillStyle = '#0E0A24'; g.fillRect(0, 0, w, h)
      const x0 = 26, y0 = 64, cw2 = w - 52, ch2 = h - 120
      const gr = g.createLinearGradient(0, y0, 0, y0 + ch2); gr.addColorStop(0, '#4D43B0'); gr.addColorStop(1, '#2C2570')
      g.fillStyle = gr; g.beginPath(); g.roundRect(x0, y0, cw2, ch2, 40); g.fill()
      g.strokeStyle = 'rgba(185,176,255,.35)'; g.lineWidth = 3; g.stroke()
      // Kopf: nur der Name, so gross es geht, ueber die ganze Breite. Neben einem Symbolfeld war er rund
      // 14 px hoch im Bild (am Handy 5 px); das Symbol steht ohnehin in jedem Stempelfeld
      g.fillStyle = '#FFFFFF'; g.textAlign = 'center'; g.textBaseline = 'middle'
      fitFont(g, p.shop, 92, cw2 - 64); g.fillText(p.shop, x0 + cw2 / 2, y0 + 92)
      g.fillStyle = 'rgba(185,176,255,.3)'; g.fillRect(x0 + 34, y0 + 172, cw2 - 68, 3)
      // Stempelfelder in zwei Reihen (wie parts.stampCols)
      const gap = 22, cell = Math.min(124, (cw2 - 68 - (cols - 1) * gap) / cols), gw = cols * cell + (cols - 1) * gap
      for (let i = 0; i < p.stamps; i++) {
        const cx2 = x0 + (cw2 - gw) / 2 + (i % cols) * (cell + gap) + cell / 2, cy2 = y0 + 215 + Math.floor(i / cols) * (cell + gap) + cell / 2
        if (i < filled) {
          if (i === filled - 1 && filled > p.have) { g.fillStyle = 'rgba(185,176,255,.45)'; g.beginPath(); g.arc(cx2, cy2, cell * 0.62, 0, Math.PI * 2); g.fill() }
          g.fillStyle = '#FFFFFF'; g.beginPath(); g.arc(cx2, cy2, cell / 2, 0, Math.PI * 2); g.fill()
          g.drawImage(icon.brand, cx2 - cell * 0.29, cy2 - cell * 0.29, cell * 0.58, cell * 0.58)
        } else {
          g.setLineDash([10, 9]); g.strokeStyle = 'rgba(185,176,255,.6)'; g.lineWidth = 4; g.beginPath(); g.arc(cx2, cy2, cell / 2 - 2, 0, Math.PI * 2); g.stroke(); g.setLineDash([])
          g.drawImage(icon.faint, cx2 - cell * 0.26, cy2 - cell * 0.26, cell * 0.52, cell * 0.52)
        }
      }
      // QR-Code unten (wird gescannt)
      const qs = 330, qx = x0 + (cw2 - qs) / 2, qy = y0 + ch2 - qs - 46
      g.fillStyle = '#FFFFFF'; g.beginPath(); g.roundRect(qx - 16, qy - 16, qs + 32, qs + 32, 26); g.fill()
      g.imageSmoothingEnabled = false; g.drawImage(qrImg, qx, qy, qs, qs); g.imageSmoothingEnabled = true
    }, { sharp: true })
    const phoneBodyM = S('#17122E', { roughness: 0.35, metalness: 0.3 }), phoneRimM = S('#8F84E8', { roughness: 0.35, metalness: 0.5 })
    // Handy: aussen die Gruppe in der Hand (Kind des Arms, gedreht in place), innen das Geraet, um "grip"
    // entlang seiner Laenge verschoben: die Hand haelt es am unteren Ende, nicht in der Mitte. Lokal zeigt
    // der Bildschirm nach +z, die Oberkante nach +y.
    const makePhone = (dim, screens, grip) => {
      const g = new THREE.Group(), inner = new THREE.Group(); inner.position.y = grip; g.add(inner)
      put(rbox(dim.w + 0.02, dim.h + 0.02, dim.d, 0.06, 3), phoneRimM, 0, 0, -0.005, { parent: inner, cast: false })
      put(rbox(dim.w, dim.h, dim.d + 0.004, 0.055, 3), phoneBodyM, 0, 0, 0, { parent: inner, cast: false })
      const sm = screens.map(tex => put(new THREE.PlaneGeometry(dim.w - 0.04, dim.h - 0.05), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }), 0, 0, dim.d / 2 + 0.004, { parent: inner, cast: false, recv: false }))
      return { g, inner, screens: sm }
    }
    // Wo der QR-Code auf dem Bildschirm liegt (lokal, aus cardTex: Zeile 688 bis 1018 von 1120, Spalte 135
    // bis 465 von 600)
    const QRY = [(0.5 - 1018 / 1120) * (PH.h - 0.05), (0.5 - 688 / 1120) * (PH.h - 0.05)], QRX = 165 / 600 * (PH.w - 0.04)
    let gPhone = null, scanLine = null, scanGlow = null
    if (p.phone) {
      gPhone = makePhone(PH, [cardTex(p.have), cardTex(p.have + 1)], GRIP)
      // Scan-Linie ueber dem QR-Code: leuchtender Strich, der auf und ab faehrt
      scanLine = put(new THREE.PlaneGeometry(PH.w - 0.06, 0.018), new THREE.MeshBasicMaterial({ color: '#E9E4FF', transparent: true, opacity: 0, toneMapped: false, blending: THREE.AdditiveBlending, depthWrite: false }), 0, 0, PH.d / 2 + 0.01, { parent: gPhone.inner, cast: false, recv: false })
      scanGlow = put(new THREE.PlaneGeometry(PH.w + 0.1, 0.14), new THREE.MeshBasicMaterial({ map: kit.blobTex, color: '#9F95FF', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }), 0, 0, PH.d / 2 + 0.012, { parent: gPhone.inner, cast: false, recv: false })
      // Haltepunkt: in der Hand des Kunden (Arm rechts, zur Kamera hin). Gedreht wird in place().
      guest.armR.add(gPhone.g)
    }
    // Handy des Inhabers: Sucher mit Ecken, nach dem Scan ein Haken. Gezeichnet fuer den Blick der Kamera
    // (die Oberkante zeigt zum Inhaber, also steht das Bild fuer ihn kopf; das sieht niemand)
    const scanTex = ok => kit.canvasTex(300, 540, (g, w, h) => {
      if (!ok) {
        g.fillStyle = '#1D1640'; g.fillRect(0, 0, w, h)
        g.strokeStyle = PAL.lilac; g.lineWidth = 12; g.lineCap = 'round'
        const s = 180, x = (w - s) / 2, y = (h - s) / 2, k = 50
        for (const [ax, ay, bx2, by] of [[x, y + k, x, y], [x, y, x + k, y], [x + s - k, y, x + s, y], [x + s, y, x + s, y + k], [x + s, y + s - k, x + s, y + s], [x + s, y + s, x + s - k, y + s], [x + k, y + s, x, y + s], [x, y + s, x, y + s - k]]) { g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx2, by); g.stroke() }
      } else {
        const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#9F95FF'); gr.addColorStop(1, '#6E62E0'); g.fillStyle = gr; g.fillRect(0, 0, w, h)
        g.fillStyle = '#FFFFFF'; g.beginPath(); g.arc(w / 2, h / 2, 104, 0, Math.PI * 2); g.fill()
        g.drawImage(icon.checkBrand, w / 2 - 70, h / 2 - 70, 140, 140)
      }
    }, { sharp: true })
    let sPhone = null
    if (p.phone) { sPhone = makePhone(SC, [scanTex(false), scanTex(true)], -0.16); owner.armR.add(sPhone.g) }
    const SCAN_Q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2 + 0.3, -0.35, 0, 'YXZ')), qa = new THREE.Quaternion()
    // Strahl vom Handy des Inhabers hinunter auf den QR-Code: ein schmales Band, das sich zur Kamera dreht
    // (um seine eigene Achse), in der Mitte lila, zu den Raendern durchsichtig, mit Tiefe (der Scanner und
    // der Arm des Inhabers liegen davor). Vorher ein additiver Kegel ohne Tiefe: ueber dem warmen Holz
    // wurde Lila plus Orange zu lachsrosa Dreiecken links und rechts vom Handy, kein Strahl.
    let beam = null
    if (p.phone) {
      const geo = new THREE.BufferGeometry(), wT = 0.12, wB = 2 * QRX // oben (Scanner) schmal, unten so breit wie der Code
      geo.setAttribute('position', new THREE.Float32BufferAttribute([-wT / 2, 0, 0, wT / 2, 0, 0, -wB / 2, -1, 0, wB / 2, -1, 0], 3))
      geo.setAttribute('uv', new THREE.Float32BufferAttribute([0, 1, 1, 1, 0, 0, 1, 0], 2)); geo.setIndex([0, 2, 1, 1, 2, 3])
      const tex = kit.canvasTex(128, 256, (g, w, h) => {
        // heller Kern, lila Saum: ueber dem lila Inhaber und dem hellen Code bleibt so der Kern zu sehen
        const gx = g.createLinearGradient(0, 0, w, 0); gx.addColorStop(0, 'rgba(160,150,255,0)'); gx.addColorStop(0.25, 'rgba(170,160,255,.5)'); gx.addColorStop(0.44, 'rgba(250,248,255,1)'); gx.addColorStop(0.56, 'rgba(250,248,255,1)'); gx.addColorStop(0.75, 'rgba(170,160,255,.5)'); gx.addColorStop(1, 'rgba(160,150,255,0)')
        g.fillStyle = gx; g.fillRect(0, 0, w, h)
        // oben (am Scanner) weich ausblenden, unten voll: der Strahl "kommt an"
        g.globalCompositeOperation = 'destination-in'; const gy = g.createLinearGradient(0, 0, 0, h); gy.addColorStop(0, 'rgba(0,0,0,.35)'); gy.addColorStop(0.3, 'rgba(0,0,0,.9)'); gy.addColorStop(1, 'rgba(0,0,0,1)'); g.fillStyle = gy; g.fillRect(0, 0, w, h)
      })
      beam = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, color: '#FFFFFF', transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }))
      beam.renderOrder = 5; scene.add(beam)
    }

    // ---------------------------------------------------------------- Papierkarte auf der Theke
    // Flaeche mit vielen Punkten: beim Knuellen wandert jeder Punkt aus der Ebene ueber eine Welle auf eine
    // zerknitterte Kugel; die Textur bleibt, also knuellt sich wirklich DIESE Karte. Danach fliegt die Kugel
    // in den Papierkorb.
    let paper = null
    // Gross wie Spielzeug (fast einen Meter breit, in der ganzen Ansicht 1,3-fach: PSIZE) und mit kraeftigen
    // Stempeln: feine Ringe waren dort nicht mehr zu sehen
    const PC = { x: -3.28, z: 2.6, w: 0.94, h: 0.6, ry: 0.1 }
    if (p.paper) {
      const tex = kit.canvasTex(1024, Math.round(1024 * PC.h / PC.w), (g, w, h) => {
        g.fillStyle = PAL.paper; g.beginPath(); g.roundRect(0, 0, w, h, 34); g.fill()
        g.strokeStyle = 'rgba(60,52,137,.25)'; g.lineWidth = 8; g.beginPath(); g.roundRect(14, 14, w - 28, h - 28, 26); g.stroke()
        g.fillStyle = PAL.ink; g.textBaseline = 'alphabetic'; g.textAlign = 'left'
        font(g, 44, 700); if ('letterSpacing' in g) g.letterSpacing = '5px'; g.fillText('STEMPELKARTE', 52, 92); if ('letterSpacing' in g) g.letterSpacing = '0px'
        g.textAlign = 'right'; g.fillStyle = 'rgba(26,26,46,.65)'; fitFont(g, p.shop, 42, 400, 500, "'Hanken Grotesk', sans-serif"); g.fillText(p.shop, w - 52, 92)
        g.fillStyle = 'rgba(26,26,46,.18)'; g.fillRect(52, 118, w - 104, 4)
        const gap = 30, cell = Math.min(170, (w - 104 - (cols - 1) * gap) / cols), gw = cols * cell + (cols - 1) * gap
        for (let i = 0; i < p.stamps; i++) {
          const x = (w - gw) / 2 + (i % cols) * (cell + gap) + cell / 2, y = 150 + Math.floor(i / cols) * (cell + 26) + cell / 2
          if (i < p.have) {
            // Tintenstempel: volle Scheibe, Symbol ausgespart, leicht verdreht wie von Hand gestempelt
            g.save(); g.translate(x, y); g.rotate((i % 3 - 1) * 0.2); g.globalAlpha = 0.9
            g.fillStyle = inkStamp; g.beginPath(); g.arc(0, 0, cell / 2 - 4, 0, Math.PI * 2); g.fill()
            g.drawImage(icon.paperOn, -cell * 0.3, -cell * 0.3, cell * 0.6, cell * 0.6); g.restore()
          } else {
            g.strokeStyle = 'rgba(60,52,137,.8)'; g.lineWidth = 10; g.beginPath(); g.arc(x, y, cell / 2 - 7, 0, Math.PI * 2); g.stroke()
            if (i === p.stamps - 1) { g.fillStyle = PAL.brand; g.textAlign = 'center'; g.textBaseline = 'middle'; fitFont(g, 'GRATIS', 34, cell * 0.74); g.fillText('GRATIS', x, y + 2) }
          }
        }
      }, { sharp: true })
      const NX = 28, NY = 18, RB = 0.16 // Kugel aus 0,56 m2 Papier: Radius rund 0,2 (gerechnet), etwas kleiner sieht fester aus
      const geo = new THREE.PlaneGeometry(PC.w, PC.h, NX, NY); geo.rotateX(-Math.PI / 2)
      const pos = geo.attributes.position, base = pos.array.slice(), n = pos.count, uv = geo.attributes.uv
      // Zwei Ziele je Punkt, beide glatt ueber die Flaeche verteilt (Nachbarn bleiben Nachbarn): "cup" = das
      // Blatt zieht sich zusammen und hebt die Raender (Mitte des Knuellens), "ball" = zerknitterte Kugel.
      // Vorher lief jeder Punkt mit eigenem Zufall direkt auf die Kugel; dazwischen klappten die Dreiecke
      // durcheinander, und das Bild sah nach Scherben aus, nicht nach einem Blatt, das man zusammendrueckt.
      // Zufall je Punkt nur noch fuer feine Knicke (8 % des Radius).
      const RP = rng(31337), cup = new Float32Array(n * 3), ball = new Float32Array(n * 3)
      for (let k = 0; k < n; k++) {
        const bx = base[k * 3], bz = base[k * 3 + 2], nx = bx / (PC.w / 2), nz = bz / (PC.h / 2), u = uv.getX(k), v = uv.getY(k)
        const fold = Math.sin(nx * 4.2 + nz * 1.7) * Math.cos(nz * 3.6 - nx * 1.1)
        cup.set([bx * 0.6, 0.04 + 0.2 * (nx * nx + nz * nz) + 0.07 * fold, bz * 0.6], k * 3)
        const th = u * Math.PI * 2 + 0.3 * Math.sin(v * 9), ph = 0.12 + v * (Math.PI - 0.24) + 0.1 * Math.sin(u * 17)
        const r = RB * (1 + 0.15 * Math.sin(u * 23 + v * 7) * Math.cos(v * 19 - u * 5) + 0.08 * (RP() - 0.5))
        ball.set([Math.sin(ph) * Math.cos(th) * r, RB + Math.cos(ph) * r, Math.sin(ph) * Math.sin(th) * r], k * 3)
      }
      const mesh = put(geo, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85, side: THREE.DoubleSide }), PC.x, ctop + 0.012, PC.z, { cast: false, ry: PC.ry })
      let last = -1
      // k: 0 flach, 1 Kugel. Nur neu rechnen, wenn sich k aendert (place laeuft bei jedem seek)
      const crumple = k => {
        if (k === last) return; last = k
        const e1 = smooth(clamp01(k / 0.5)), e2 = smooth(clamp01((k - 0.3) / 0.7))
        for (let i = 0; i < n * 3; i++) pos.array[i] = lerp(lerp(base[i], cup[i], e1), ball[i], e2)
        pos.needsUpdate = true; geo.computeVertexNormals(); geo.computeBoundingSphere(); geo.computeBoundingBox()
      }
      crumple(0)
      // Papierkorb links neben der Theke, schon halb voll mit alten Papierkarten: die neue Kugel landet obenauf
      // und schaut ueber den Rand (in einem leeren Korb verschwand sie bei 34 Grad von oben ganz)
      const binM = S('#3A2F7A', { roughness: 0.6, side: THREE.DoubleSide })
      put(new THREE.CylinderGeometry(BIN.r, BIN.r * 0.82, BIN.h, 28, 1, true), binM, BIN.x, BIN.h / 2, BIN.z)
      put(new THREE.CircleGeometry(BIN.r * 0.82, 24), binM, BIN.x, 0.02, BIN.z).rotation.x = -Math.PI / 2
      put(new THREE.TorusGeometry(BIN.r, 0.035, 8, 32), S(IN.trim, { roughness: 0.5 }), BIN.x, BIN.h, BIN.z).rotation.x = Math.PI / 2
      const oldM = lam(PAL.paper, { flatShading: true })
      for (const [dx, dz, r] of [[-0.1, 0.06, 0.15], [0.11, -0.04, 0.14], [0.0, -0.12, 0.13]]) put(new THREE.IcosahedronGeometry(r, 1), oldM, BIN.x + dx, BIN.h - 0.2, BIN.z + dz, { cast: false })
      paper = { mesh, crumple, land: [BIN.x, BIN.h - 0.26, BIN.z] }
    }

    // ---------------------------------------------------------------- Sprechblase, Haken, Stempel (schauen zur Kamera)
    const billboard = () => { const g = new THREE.Group(); g.rotation.order = 'YXZ'; scene.add(g); return g }
    const bubble = p.bubble ? (() => {
      const tex = kit.canvasTex(512, 440, (g, w, h) => {
        g.fillStyle = '#FFFFFF'; g.beginPath(); g.roundRect(14, 14, w - 28, h - 110, 90); g.fill()
        g.beginPath(); g.moveTo(w * 0.3, h - 100); g.lineTo(w * 0.22, h - 16); g.lineTo(w * 0.48, h - 100); g.fill()
        g.drawImage(icon.order, w / 2 - 120, (h - 96) / 2 - 112, 240, 240)
      }, { sharp: true })
      const g = billboard()
      // Unterkante (Spitze) am Ursprung der Gruppe, knapp ueber dem Kopf: so waechst die Blase mit BUB nach
      // oben, nicht in den Kopf hinein
      const m = put(new THREE.PlaneGeometry(0.78, 0.67), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false }), 0.1, 0.335, 0, { parent: g, cast: false, recv: false })
      return { g, m }
    })() : null
    let check = null, stamp = null
    if (p.phone) {
      const g = billboard()
      const tex = kit.canvasTex(256, 256, (c, w) => { c.fillStyle = '#7A6EF0'; c.beginPath(); c.arc(w / 2, w / 2, w * 0.48, 0, Math.PI * 2); c.fill(); c.drawImage(icon.check, w * 0.2, w * 0.2, w * 0.6, w * 0.6) }, { sharp: true })
      const m = put(new THREE.PlaneGeometry(0.42, 0.42), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false }), 0, 0, 0, { parent: g, cast: false, recv: false })
      check = { g, m }
      // Der Stempel: dicke Muenze in der Ladenfarbe, vorn das Symbol, dazu ein Ring und Funken
      const sg = billboard(), R2 = 0.33
      const face = kit.canvasTex(512, 512, (c, w) => {
        c.fillStyle = accHex; c.beginPath(); c.arc(w / 2, w / 2, w / 2, 0, Math.PI * 2); c.fill()
        c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 16; c.beginPath(); c.arc(w / 2, w / 2, w / 2 - 34, 0, Math.PI * 2); c.stroke()
        c.drawImage(icon.white, w * 0.22, w * 0.22, w * 0.56, w * 0.56)
      }, { sharp: true })
      // Muenze als Zylinder (Rand), die Vorderseite als eigene Scheibe: die Deckel des Zylinders haben
      // gedrehte Texturkoordinaten, das Symbol stand darauf quer
      const coinGeo = new THREE.CylinderGeometry(R2, R2, 0.1, 48); coinGeo.rotateX(Math.PI / 2)
      const faceM = new THREE.MeshBasicMaterial({ map: face, toneMapped: false, transparent: true }), sideM = std(accDark, { roughness: 0.4, transparent: true, emissive: accHex, emissiveIntensity: 0.35 })
      const coin = put(coinGeo, sideM, 0, 0, 0, { parent: sg, cast: false, recv: false })
      put(new THREE.CircleGeometry(R2 * 0.995, 48), faceM, 0, 0, 0.052, { parent: sg, cast: false, recv: false })
      const ring = put(new THREE.TorusGeometry(R2 * 1.05, 0.025, 8, 48), new THREE.MeshBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }), 0, 0, 0, { parent: sg, cast: false, recv: false })
      const RS = rng(424242), sparks = []
      for (let i = 0; i < 9; i++) {
        const a = i / 9 * Math.PI * 2 + RS() * 0.4, m2 = put(new THREE.OctahedronGeometry(0.035 + RS() * 0.03, 0), new THREE.MeshBasicMaterial({ color: i % 2 ? '#FFFFFF' : PAL.lilac, transparent: true, toneMapped: false }), 0, 0, 0.05, { parent: sg, cast: false, recv: false })
        m2.userData = { a, d: 0.45 + RS() * 0.25 }; sparks.push(m2)
      }
      const halo = glow(accHex, 1.6, V(0, -10, 0), 0)
      // Der Stempel liegt immer obenauf (wie ein Aufkleber auf dem Bild): beim Aufspringen steht er noch im
      // Handy des Inhabers, und Koepfe oder Scanner schnitten ihm sonst Stuecke heraus
      sg.traverse(o => { if (o.isMesh) { o.material.depthTest = false; o.renderOrder = 20 } })
      coin.renderOrder = 20; sg.children.forEach((o, i) => { if (o.isMesh && o !== coin) o.renderOrder = 21 + i })
      stamp = { g: sg, coin, faceM, sideM, ring, sparks, halo }
    }

    // ---------------------------------------------------------------- Zeiten (Anker)
    const T = {
      enter: p.start === 'door' ? ctx.at('enter') : null, order: p.bubble ? ctx.at('order') : null, crumple: p.paper ? ctx.at('crumple') : null,
      scan: p.phone ? ctx.at('scan') : null, stamp: p.phone ? ctx.at('stamp') : null, zoom: p.close ? ctx.at('zoom') : null, leave: p.leaves ? ctx.at('leave') : null
    }
    if (p.phone && T.stamp < T.scan + 0.7) { ctx.warn(`"stamp" liegt nur ${(T.stamp - T.scan).toFixed(2)} s nach "scan" (nötig 0,7 s für Scan und Haken). Der Stempel kommt deshalb erst bei ${(T.scan + 0.7).toFixed(2)} s.`); T.stamp = T.scan + 0.7 }
    T.check = p.phone ? Math.min(T.scan + 0.62, T.stamp - 0.08) : null
    // Sprechblase: steht 1,4 s, mit "close" hoechstens bis "zoom". In der ersten Probe lag "zoom" 0,4 s nach
    // "order", die Blase stand 0,3 s in voller Groesse und war im Video nicht zu sehen.
    const bubbleOff = p.bubble ? Math.min(1.4, p.close && T.zoom > T.order ? T.zoom - T.order : 1.4) : 0
    if (p.bubble && p.close && T.zoom > T.order && T.zoom - T.order < 1.0) ctx.warn(`"zoom" liegt nur ${(T.zoom - T.order).toFixed(2)} s nach "order": die Sprechblase steht keine Sekunde. "order" früher oder "zoom" später legen (mindestens 1 s dazwischen).`)
    if (p.bubble && p.close && T.order >= T.zoom) ctx.warn('"order" liegt nach "zoom": in der Nahaufnahme ist der Kopf des Kunden nicht im Bild, die Sprechblase also auch nicht. "order" mindestens 1 s vor "zoom" legen.')
    // Dunkler Verlauf oben, nur waehrend der Fahrt in die Nahaufnahme (unter den Textzeilen, z-index 20)
    const zoomShade = p.close ? ctx.el('div', 'ish-zoomshade') : null
    if (zoomShade) {
      zoomShade.style.cssText = 'position:absolute;left:0;right:0;top:0;height:1000px;pointer-events:none;opacity:0;background:linear-gradient(180deg,rgba(14,10,36,.92) 0%,rgba(14,10,36,.78) 45%,rgba(14,10,36,.35) 75%,rgba(14,10,36,0) 100%)'
      ctx.root.append(zoomShade)
    }

    // Weg des Kunden: von draussen durch die Tuer, im Bogen ueber den Lichtfleck und vorn um die Theke herum
    // zum Platz davor. Draussen beginnt und endet er 4,6 m vor der Tuer, hinter der Wand und ausserhalb des
    // Bildes: so ist er schon im Gehen, wenn die Tuer aufgeht (sie geht auf, sobald er naeher als 2,5 m ist).
    // Vorher begann er 2,6 m davor aus dem Stand, und mit "enter" 0,1 s nach Szenenbeginn stand er im ersten
    // Bild schon in der offenen Tuer, die Glocke wie ein Hut auf dem Kopf (Abnahme 18.11.2026).
    // Gerade durch die Tuer, bis er am offenen Blatt (1,3 m lang) vorbei ist, erst dann der Bogen. Der Bogen
    // laeuft vorn (z bis 4,2) statt an der Theke entlang: dort stand sein Kopf zwischen Kamera und
    // Papierkarte, genau wenn sie sich knuellte.
    const PX = DOOR.x - 0.08, OUTZ = -2.7 // hinter z = -2,7 sieht ihn die Kamera nicht (Wand, Bildrand)
    const path = new THREE.CatmullRomCurve3([V(PX, 0, -4.6), V(PX, 0, -0.4), V(PX, 0, 1.0), V(PX + 0.15, 0, 1.75), V(-5.75, 0, 3.25), V(-4.35, 0, 4.2), V(-3.1, 0, 4.05), V(SPOT.x, 0, SPOT.z)], false, 'centripetal')
    const PL = path.getLength()
    // Wo auf dem Weg die Schwelle liegt (z = 0), als Strecke
    let sDoor = 0; for (let i = 0; i <= 400; i++) { if (path.getPointAt(i / 400).z >= 0) { sDoor = PL * i / 400; break } }
    // Bewegung mit weichem Anfang und Ende: g(x) beschleunigt auf dem ersten Stueck r, bremst auf dem letzten
    const RAMP = 0.16
    const TOSS = { t0: 0.55, t1: 1.1, apex: 0.85 } // Papierkugel: fliegt ab 0,55 s nach "crumple", landet nach 1,1 s
    const g = x => { x = clamp01(x); const r = RAMP; return (x < r ? x * x / (2 * r) : x < 1 - r ? x - r / 2 : (1 - r) - (1 - x) * (1 - x) / (2 * r)) / (1 - r) }
    const gInv = y => { let lo = 0, hi = 1; for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (g(m) < y) lo = m; else hi = m } return (lo + hi) / 2 }
    let walkIn = null, walkOut = null
    if (T.enter != null) {
      // Dauer so, dass er mit WALK geht und auf "enter" genau auf der Schwelle steht
      let D = PL / (WALK * (1 - RAMP)), xs = gInv(sDoor / PL), t0 = T.enter - xs * D
      // Liegt das Heben des Handys vor "scan" frueher, als er bei diesem Tempo ankaeme, geht er schneller;
      // braucht er dafuer mehr als das doppelte Tempo, gibt es eine Warnung (er rennt dann sichtbar).
      // "order" darf im Gehen kommen (die Blase haengt an seinem Kopf): sonst passten Tuer, Bestellung von
      // mindestens 1 s und Scan nicht in eine kurze Szene.
      const latest = (T.scan ?? Infinity) - 0.75 - 0.12
      if (t0 + D > latest) {
        const D2 = (latest - T.enter) / (1 - xs)
        if (D2 < D * 0.5) ctx.warn(`Der Kunde hat von "enter" bis zur Theke nur ${(latest - T.enter).toFixed(2)} s (er braucht rund ${(D * (1 - xs)).toFixed(1)} s). Er rennt; "enter" früher oder die Anker danach später legen.`)
        D = Math.max(D2, D * 0.35); t0 = T.enter - xs * D
      }
      walkIn = { t0, t1: t0 + D }
    }
    if (T.leave != null) {
      const t0 = T.leave + 0.3, D = PL / (WALK * (1 - RAMP))
      // Wann er drinnen die Schwelle erreicht (fuer Glocke und Ton)
      walkOut = { t0, t1: t0 + D, tDoor: t0 + gInv((PL - sDoor) / PL) * D }
    }
    if (p.tones) {
      if (T.enter != null) ctx.cue(T.enter - 0.05, 'ding', 0.5)
      if (T.order != null) ctx.cue(T.order, 'pop', 0.55, 1.2)
      if (T.crumple != null) { ctx.cue(T.crumple, 'crumple', 0.85); ctx.cue(T.crumple + TOSS.t1, 'drop', 0.5) }
      if (T.scan != null) { ctx.cue(T.scan + 0.02, 'scan', 0.6); ctx.cue(T.check, 'ok', 0.65) }
      if (T.stamp != null) ctx.cue(T.stamp, 'pop', 0.75, 1.05)
      if (walkOut) ctx.cue(walkOut.tDoor - 0.05, 'ding', 0.45)
    }
    // Wo der Kunde zur Zeit t ist: Strecke auf dem Weg (vorwaerts beim Kommen, rueckwaerts beim Gehen)
    const where = t => {
      if (walkOut && t >= T.leave) {
        if (t < walkOut.t0) return { s: PL, moving: false, dir: -1, turn: smooth((t - T.leave) / 0.3) }
        const x = (t - walkOut.t0) / (walkOut.t1 - walkOut.t0)
        return { s: PL * (1 - g(x)), moving: x < 1, dir: -1, turn: 1, gone: x >= 1 }
      }
      if (walkIn) {
        if (t < walkIn.t0) return { s: 0, moving: false, dir: 1 }
        const x = (t - walkIn.t0) / (walkIn.t1 - walkIn.t0)
        return { s: PL * g(x), moving: x < 1, dir: 1, arrived: x >= 1 ? t - walkIn.t1 : -1 }
      }
      return { s: PL, moving: false, dir: 1, arrived: 99 }
    }
    // Erstes Bild: steht die Tuer schon offen, fehlt der Moment, in dem sie aufgeht, und der Kunde steht im
    // ersten Bild (oft dem Anfang des Videos) halb in der Tuer
    if (walkIn) {
      const q = path.getPointAt(clamp01(where(ctx.s).s / PL))
      if (Math.hypot(q.x - PX, q.z) < 2.5) {
        const need = T.enter - (walkIn.t0 + gInv((sDoor - 2.5) / PL) * (walkIn.t1 - walkIn.t0))
        ctx.warn(`"enter" liegt nur ${(T.enter - ctx.s).toFixed(2)} s nach dem Anfang der Szene: die Glastür steht im ersten Bild schon offen und der Kunde halb darin. "enter" mindestens ${need.toFixed(1)} s nach dem Anfang legen.`)
      }
    }
    const angleTo = (a, b, k) => { let d = ((b - a + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI; return a + d * k }
    const endDir = (() => { const tn = path.getTangentAt(0.999); return Math.atan2(tn.x, tn.z) })()
    const backDir = (() => { const tn = path.getTangentAt(0.999); return Math.atan2(-tn.x, -tn.z) })()

    // ---------------------------------------------------------------- Kamera
    // Ausschnitt gerechnet (kit.fitFrame): Schild, Tafel, Tuer, Weg, Inhaber, Kunde und Stempel bleiben ueber
    // die ganze Fahrt in K.FIT. Waende und Boden reichen weiter als jeder Ausschnitt, das Bild bleibt voll.
    // Nahaufnahme der Theke steiler von oben (50 Grad): die Waende mit Schild und Tafel gehen aus dem Bild, statt
    // oben angeschnitten hinter den Textzeilen zu stehen. Die Handys nur wenig steiler (36 Grad): bei 50 Grad
    // rueckte die Kamera so nah heran, dass der Stempel das ganze Handy zudeckte.
    const AZ = 45, EL = 34, ELDROP = 1.5, EL_C = p.close === 'counter' ? 50 : 36
    // Oben und rechts im Bild, in Weltrichtungen, fuer einen Blickwinkel (Grad): Stempel und Haken steigen
    // entlang "oben im Bild" auf, nicht senkrecht. Senkrecht lagen sie in der steilen Nahaufnahme auf dem Handy.
    const camUp = (el, out = V(0, 0, 0)) => { const e = THREE.MathUtils.degToRad(el), a = THREE.MathUtils.degToRad(AZ); return out.set(Math.sin(e) * Math.sin(a), Math.cos(e), -Math.sin(e) * Math.cos(a)) }
    const camRight = V(Math.cos(THREE.MathUtils.degToRad(AZ)), 0, Math.sin(THREE.MathUtils.degToRad(AZ)))
    const STAMP = { rise: [1.0, 0.82], size: [1.4, 1] } // ganze Ansicht / Nahaufnahme: im ganzen Laden groesser, sonst nur ein Punkt
    const camBase = { push: p.push, orbit: p.orbit, az: AZ, el: EL, elDrop: ELDROP }
    const wide = [...signCorners, ...menuCorners, V(dx0 - 0.1, DOOR.h + 0.15, 0), V(dx0 - 0.1, 0, 0), V(DOOR.x, 2.6, 1.2), V(DOOR.x, 0, 1.2),
      V(SPOT.x - 0.5, 0, SPOT.z + 0.4), V(SPOT.x + 0.4, 0, SPOT.z + 0.4), V(SPOT.x, 3.35, SPOT.z), V(OWNER.x, 2.65, OWNER.z), V(CNT.x0, 0, CNT.z1), V(CNT.x1, 0, CNT.z1)]
    // Mitte des gehobenen Handys (gemessen: isoShop.spots) und seine Ecken: Oberkante zum Inhaber, um 28 Grad
    // gekippt. Die erste Schaetzung lag 20 cm daneben, und in der Nahaufnahme ragte das Handy 4 px unter die Sperrzone.
    // Seit dem Griff am unteren Rand (GRIP) liegt die Mitte 22 cm weiter beim Inhaber; neu gemessen.
    const phoneAt = V(SPOT.x - 0.567, ctop + 0.485, CNT.z1 - 0.545)
    // Mitte des Scanners in der rechten Hand des Inhabers beim Scan (gemessen), fuer den Ausschnitt der Nahaufnahme
    const scanAt = V(-2.35, ctop + 0.86, 2.62)
    const phoneCorners = [-1, 1].flatMap(sl => [-1, 1].map(sw => phoneAt.clone().add(V(sw * 0.3, sl * 0.47 * 0.52, -sl * 0.88 * 0.52))))
    // Oberkante und Seiten des Stempels ueber dem Handy (fuer den Ausschnitt), je Blickwinkel
    const overPhone = (el, k) => { const up = camUp(el), r = 0.33 * 1.05 * STAMP.size[k], c = phoneAt.clone().addScaledVector(up, STAMP.rise[k] + 0.08); return [c.clone().addScaledVector(up, r).addScaledVector(camRight, -r), c.clone().addScaledVector(up, r).addScaledVector(camRight, r)] }
    if (p.phone) wide.push(...overPhone(EL, 0))
    // Sprechblase in voller Groesse ueber dem Kunden an der Theke (Kopf 2,24 m, Blase BUB-fach)
    if (p.bubble) for (const sx of [-0.3, 0.5]) wide.push(V(SPOT.x, 2.6 + 0.67 * BUB[0], SPOT.z).addScaledVector(camRight, sx * BUB[0]))
    const FW = kit.fitFrame(wide, { ...camBase, aim: kit.aimAcross(wide, 1.6) })
    const aimW = kit.aimAcross(wide, 1.6)
    let FC = null, aimC = null
    if (p.close) {
      const pts = p.close === 'phone'
        ? [...phoneCorners, V(phoneAt.x - 0.4, phoneAt.y + 0.45, phoneAt.z - 0.7), ...overPhone(EL_C, 1), scanAt.clone().addScaledVector(camRight, 0.28).add(V(0, 0.15, 0)), scanAt.clone().addScaledVector(camRight, 0.28).add(V(0, -0.15, 0))]
        : [V(CNT.x0 - 0.05, ctop, CNT.z1 + 0.05), V(CNT.x1 + 0.05, ctop, CNT.z1 + 0.05), V(CNT.x0, ctop, CNT.z0), V(CNT.x1, ctop, CNT.z0), V(SPOT.x, 2.5, SPOT.z), V(OWNER.x, 2.5, OWNER.z), ...(p.phone ? overPhone(EL_C, 1) : [V(PC.x, ctop + 0.9, PC.z)])]
      aimC = kit.aimAcross(pts, ctop + 0.3)
      FC = kit.fitFrame(pts, { ...camBase, el: EL_C, push: p.push * 0.5, aim: aimC })
    }
    const cam = kit.isoCamera({ fov: 22, near: 1.5, far: 260, frame: FW })
    const camera = cam.camera, tgt = V(0, 0, 0), tW = V(0, 0, 0), tC = V(0, 0, 0)
    // Stellt die Kamera auf t: Fahrt und Drehung wie isoCamera.set, dazu (mit "close") die Fahrt vom ganzen
    // Laden in die Nahaufnahme. Abstand geometrisch gemischt, damit das Heranfahren gleichmaessig wirkt.
    const zoomK = t => FC ? (T.zoom <= ctx.s + 0.05 ? 1 : smooth((t - T.zoom) / 0.9)) : 0
    const setCam = t => {
      const u = K.travel(t, ctx.s, ctx.e), z = zoomK(t)
      const a = THREE.MathUtils.degToRad(AZ + p.orbit / 2 - p.orbit * u), e = THREE.MathUtils.degToRad(lerp(EL, EL_C, z) - ELDROP * u)
      aimW(a, tW); let dist = FW.dist * (1 + p.push * (1 - u)), dxo = FW.dx, dyo = FW.dy
      if (FC) { aimC(a, tC); tW.lerp(tC, z); dist = Math.pow(dist, 1 - z) * Math.pow(FC.dist * (1 + p.push * 0.5 * (1 - u)), z); dxo = lerp(FW.dx, FC.dx, z); dyo = lerp(FW.dy, FC.dy, z) }
      tgt.copy(tW)
      camera.position.set(tgt.x - dist * Math.cos(e) * Math.sin(a), tgt.y + dist * Math.sin(e), tgt.z + dist * Math.cos(e) * Math.cos(a))
      camera.lookAt(tgt); camera.setViewOffset(K.W, K.H, dxo, -dyo, K.W, K.H)
      // Dunst erst hinter dem Laden (die hintere Ecke liegt rund 6 m hinter dem Ziel)
      scene.fog.near = dist + 9; scene.fog.far = dist + 62
      return { a, e }
    }

    // ---------------------------------------------------------------- Pruefkaesten
    kit.safeBox('sign', 'Schild ' + p.shop, true); kit.safeBox('menu', 'Tafel', true)
    kit.safeBox('owner', 'Inhaber'); kit.safeBox('guest', 'Kunde')
    if (p.bubble) kit.safeBox('bubble', 'Bestellung', true)
    if (p.phone) { kit.safeBox('phone', 'Handy'); kit.safeBox('scanner', 'Handy Inhaber'); kit.safeBox('check', 'Haken'); kit.safeBox('stamp', 'Stempel', true) }
    if (p.paper) kit.safeBox('paper', 'Papierkarte')

    // ---------------------------------------------------------------- Zustand zur Zeit t (ohne Zeichnen)
    const wp = V(0, 0, 0), wq = V(0, 0, 0)
    const pop = x => x <= 0 ? 0 : x >= 1 ? 1 : 1 + 2.2 * Math.pow(x - 1, 3) + 1.2 * Math.pow(x - 1, 2) // Ueberschwingen wie EASE.BACK
    const bump = x => x <= 0 || x >= 1 ? 0 : Math.sin(Math.PI * x)
    const live = {} // fuer Tests: was gerade zu sehen ist
    kit.run(t => {
      const { a, e } = setCam(t), zk = zoomK(t)
      const upNow = V(Math.sin(e) * Math.sin(a), Math.cos(e), -Math.sin(e) * Math.cos(a)), rightNow = V(Math.cos(a), 0, Math.sin(a))
      // ---- Kunde
      const w = where(t)
      const pos = path.getPointAt(clamp01(w.s / PL)), tan = path.getTangentAt(Math.min(0.999, Math.max(0.001, w.s / PL)))
      let ry = Math.atan2(tan.x * w.dir, tan.z * w.dir)
      if (w.arrived != null && w.arrived >= 0) ry = angleTo(endDir, Math.PI, smooth((w.arrived + 0.12) / 0.45))
      if (w.dir < 0 && w.turn < 1) ry = angleTo(Math.PI, backDir, w.turn)
      if (!walkIn && w.dir > 0) ry = Math.PI
      guest.at(pos.x, pos.z, ry)
      const shown = !w.gone && pos.z > OUTZ
      guest.fig.visible = guest.blob.visible = shown
      const wc = walkCycle(w.s, w.moving)
      guest.pose(wc)
      // Arm mit Handy: haengt beim Gehen locker (leicht vor), hebt sich zum Scan flach ueber die Theke
      // In der Nahaufnahme bleibt das Handy oben (die Karte mit dem neuen Stempel ist das Schlussbild); gesenkt
      // rutschte es dort unten aus dem Bild in die Sperrzone
      const up = p.phone ? smooth((t - (T.scan - 0.72)) / 0.45) * (FC ? 1 : 1 - smooth((t - (T.stamp + 1.35)) / 0.5)) : 0
      const hold = p.phone ? -0.42 : 0
      // Gehoben -1,15 (nicht -1,3): mit dem Griff am unteren Rand laege das Handy sonst 25 cm weiter beim
      // Inhaber; so bleibt es ueber der Theke, und der Inhaber hat Platz fuer seinen Arm
      guest.armR.rotation.x = lerp(w.moving ? wc.armR * 0.4 + hold : hold, -1.15, up); guest.armR.rotation.z = lerp(0, 0.18, up)
      guest.body.rotation.x = 0.02 * Math.sin(t * 1.7)
      if (gPhone) {
        // Telefon in der Hand: Hand am Ende des Arms (lokal 0,52 unter der Schulter). Im Ruhen steht es fast
        // senkrecht in der Hand, gehoben liegt es flach (Bildschirm oben, Oberkante von der Kamera weg) und
        // kippt 28 Grad zur Kamera, damit die Karte lesbar ist.
        // Drehung um z (pi): die Oberkante zeigt zum Inhaber, also steht die Karte fuer die Kamera aufrecht.
        // Gesamtwinkel um x (Arm + Handy): -0,2 haengend, -pi/2 - 0,49 flach und zur Kamera gekippt.
        const armX = guest.armR.rotation.x
        gPhone.g.position.set(-0.02, -0.5, 0.06)
        gPhone.g.rotation.set(lerp(-0.2, -Math.PI / 2 - 0.49, up) - armX, 0, Math.PI, 'XYZ')
        // Haengend 0,6-fach, gehoben ganz: in voller Groesse war es beim Gehen ein Drittel so gross wie er,
        // ein Tablett mit der Karte zur Kamera
        gPhone.g.scale.setScalar(lerp(0.6, 1, up) / 1.3)
        const after = t >= T.stamp
        gPhone.screens[0].visible = !after; gPhone.screens[1].visible = after
        // Scan-Linie: einmal ueber den QR-Code hinunter und zurueck
        const ks = (t - T.scan) / 0.62, on = ks > 0 && ks < 1
        const yq = lerp(QRY[1], QRY[0], 1 - Math.abs(1 - 2 * clamp01(ks)))
        scanLine.position.y = yq; scanGlow.position.y = yq
        scanLine.material.opacity = on ? 0.95 * Math.min(1, ks * 8, (1 - ks) * 8) : 0; scanGlow.material.opacity = scanLine.material.opacity * 0.6
        live.after = after; live.scanning = on; live.up = +up.toFixed(3)
      }
      // ---- Inhaber: wiegt sich, nickt bei der Bestellung, hebt sein Handy ueber das des Kunden
      // kin hebt den Scanner, kout zieht ihn, sobald der Stempel aufspringt, nach oben und aussen weg (er
      // verschwindet dabei), kdown senkt den leeren Arm seitlich. Vorher schwang der Arm mit dem Scanner gerade
      // nach unten durch das Handy des Kunden (Abnahme 18.11.2026).
      const kin = p.phone ? smooth((t - (T.scan - 0.6)) / 0.42) : 0
      const kout = p.phone ? smooth((t - (T.stamp - 0.08)) / 0.4) : 0, kdown = p.phone ? smooth((t - (T.stamp + 0.32)) / 0.55) : 0
      const ko = kin * (1 - kout)
      owner.body.rotation.z = 0.025 * Math.sin(t * 1.3 + 1)
      // Nicken am Hals und eine kleine Verbeugung: so ist "verstanden" auch in der ganzen Ansicht zu sehen
      const nod = T.order != null ? 0.5 * bump((t - T.order - 0.1) / 0.45) + 0.3 * bump((t - T.order - 0.55) / 0.4) : 0
      const bow = T.order != null ? 0.12 * bump((t - T.order - 0.05) / 0.95) : 0
      owner.body.rotation.x = 0.2 * kin * (1 - kdown) + bow
      neck.rotation.x = nod
      // Scanner in der RECHTEN Hand, rechts neben der Karte und hoeher als sie: der Strahl faellt schraeg von
      // rechts oben auf den QR-Code, Name und Stempelfelder bleiben frei. In der ersten Fassung hielt die linke
      // Hand ihn genau zwischen Kamera und Karte, er deckte zwei Drittel davon zu (Abnahme 18.11.2026).
      // Danach (kout) geht er nach oben weg und verschwindet; der leere Arm sinkt nach innen, links an der
      // Kuchenhaube vorbei (kdown). Vorher schwang der Arm mit dem Scanner gerade durch das Kundenhandy.
      owner.armL.rotation.x = 0.05 * Math.sin(t * 1.3)
      owner.armR.rotation.x = lerp(lerp(0.05 * Math.sin(t * 1.3 + 2), ARM_S, kin) + (ARM_S2 - ARM_S) * kout, 0, kdown)
      owner.armR.rotation.z = lerp(ARM_Z * kin + (ARM_Z2 - ARM_Z) * kout, 0.02, smooth((kdown - 0.6) / 0.4))
      if (sPhone) {
        sPhone.g.visible = kin > 0.02 && kout < 0.7
        sPhone.g.position.set(-0.02, -0.52, 0.1)
        // Lage in der Welt (SCAN_Q: flach, Bildschirm oben und zur Kamera gekippt, Oberkante zum Inhaber),
        // umgerechnet in die Hand: so kippt der Scanner nicht mit Arm, Verbeugung und Wiegen des Inhabers
        owner.fig.updateMatrixWorld(true)
        sPhone.g.quaternion.copy(owner.armR.getWorldQuaternion(qa).invert().multiply(SCAN_Q))
        sPhone.g.scale.setScalar(lerp(0.45, 1, kin) * (1 - 0.5 * kout) / 1.3)
        const ok = t >= T.check
        sPhone.screens[0].visible = !ok; sPhone.screens[1].visible = ok
        live.ok = ok; live.scannerUp = +ko.toFixed(3)
      }
      // ---- Tuer: geht auf, wenn der Kunde nah ist (aus seiner Lage, also nur aus t)
      const dDoor = Math.hypot(pos.x - PX, pos.z)
      const open = shown ? 1 - smooth((dDoor - 1.6) / 0.9) : 0
      // etwas ueber quer (wie die Ladentuer des Baukastens): das freie Ende neigt sich vom Weg weg. Bei 83 Grad
      // ragte es 0,5 m an den Weg heran, und die Schulter des Kunden streifte es.
      hinge.rotation.y = (Math.PI / 2 + 0.08) * open
      // Glocke: schwingt ab dem letzten Durchgang durch die Tuer (herein oder hinaus)
      const rang = [T.enter, walkOut && walkOut.tDoor].filter(x => x != null && t >= x - 0.05)
      bell.ring(rang.length ? t - Math.max(...rang) : -1)
      live.door = +open.toFixed(3)
      // ---- Papierkarte: knuellen (0,5 s), dann im Bogen in den Papierkorb
      let tossK = 0
      if (paper) {
        const kc = clamp01((t - T.crumple) / 0.5)
        paper.crumple(+kc.toFixed(3))
        tossK = clamp01((t - T.crumple - TOSS.t0) / (TOSS.t1 - TOSS.t0))
        const e2 = smooth(tossK), [lx, ly, lz] = paper.land
        paper.mesh.position.set(lerp(PC.x, lx, e2), lerp(ctop + 0.012, ly, tossK) + 4 * TOSS.apex * tossK * (1 - tossK), lerp(PC.z, lz, e2))
        paper.mesh.rotation.y = PC.ry + 0.9 * smooth((t - T.crumple) / 0.8) + 5 * tossK
        paper.mesh.scale.setScalar(lerp(PSIZE[0], PSIZE[1], zk))
        live.crumple = +kc.toFixed(3); live.binned = tossK >= 1
      }
      kit.sync()
      // ---- Strahl, Haken, Stempel, Blase (brauchen die Lage der Handys in der Welt)
      if (beam) {
        const kb = (t - T.scan + 0.08) / 0.75, on = kb > 0 && kb < 1 && sPhone.g.visible
        beam.visible = on
        if (on) {
          // Vom Scanner auf die Mitte des QR-Codes; das Band dreht sich um seine Achse zur Kamera
          sPhone.inner.localToWorld(wp.set(0, 0, 0)); gPhone.inner.localToWorld(wq.set(0, (QRY[0] + QRY[1]) / 2, PH.d / 2))
          const len = Math.max(0.05, wp.distanceTo(wq)), ax = wq.clone().sub(wp).normalize()
          const toCam = camera.position.clone().sub(wp).normalize(), nz = toCam.addScaledVector(ax, -toCam.dot(ax)).normalize()
          const ny = ax.clone().negate(), nx = ny.clone().cross(nz)
          beam.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(nx, ny, nz)); beam.position.copy(wp); beam.scale.set(1, len, 1)
          beam.material.opacity = 0.8 * Math.min(1, kb * 6, (1 - kb) * 5)
        }
      }
      if (check) {
        const kk = t - T.check, sc = pop(kk / 0.3) * (1 - smooth((t - T.stamp + 0.02) / 0.14))
        check.g.visible = kk > 0 && sc > 0.01
        if (check.g.visible) { sPhone.inner.getWorldPosition(wp); check.g.position.copy(wp).addScaledVector(upNow, 0.45).addScaledVector(rightNow, 0.05); check.g.rotation.set(-e, -a, 0); check.g.scale.setScalar(sc * lerp(1.25, 1, zk)) }
        live.check = check.g.visible
      }
      if (stamp) {
        const ks = t - T.stamp, inK = pop(ks / 0.36), outK = smooth((ks - 1.25) / 0.32)
        stamp.g.visible = ks > 0 && outK < 0.999
        if (stamp.g.visible) {
          gPhone.inner.getWorldPosition(wp) // Mitte des Handys (die Hand haelt jetzt den unteren Rand)
          stamp.g.position.copy(wp).addScaledVector(upNow, lerp(STAMP.rise[0], STAMP.rise[1], zk) * (0.25 + 0.75 * smooth(ks / 0.36)) + 0.06 * Math.sin(ks * 3.2) + 0.25 * outK)
          stamp.g.rotation.set(-e, -a + 0.35 * (1 - smooth(ks / 0.5)), 0); stamp.g.scale.setScalar(Math.max(0.001, inK * (1 - 0.4 * outK) * lerp(STAMP.size[0], STAMP.size[1], zk)))
          const fade = 1 - outK; stamp.faceM.opacity = fade; stamp.sideM.opacity = fade
          stamp.ring.scale.setScalar(1 + 0.8 * clamp01(ks / 0.5)); stamp.ring.material.opacity = 0.9 * (1 - clamp01(ks / 0.5))
          for (const s of stamp.sparks) { const k2 = clamp01(ks / 0.6), d = s.userData.d * smooth(k2) + 0.3; s.position.set(Math.cos(s.userData.a) * d, Math.sin(s.userData.a) * d, 0.06); s.rotation.set(ks * 6, ks * 4, 0); s.material.opacity = 1 - k2; s.visible = k2 < 1 }
          stamp.halo.position.copy(stamp.g.position); stamp.halo.material.opacity = 0.55 * fade * Math.min(1, ks * 5)
        } else stamp.halo.material.opacity = 0
        live.stamp = stamp.g.visible
      }
      if (bubble) {
        // Steht 1,4 s, faehrt die Kamera vorher heran, geht sie mit dem Heranfahren (sonst ragt sie aus dem
        // Bild; in build gibt es eine Warnung, wenn sie so keine 1 s steht). In der ganzen Ansicht BUB-fach.
        const kb = t - T.order, sc = pop(kb / 0.32) * (1 - smooth((kb - bubbleOff) / 0.25))
        bubble.g.visible = kb > 0 && sc > 0.01 && shown
        if (bubble.g.visible) { guest.head.getWorldPosition(wp); bubble.g.position.set(wp.x, wp.y + 0.36, wp.z); bubble.g.rotation.set(-e, -a, 0); bubble.g.scale.setScalar(sc * lerp(BUB[0], BUB[1], zk)) }
        live.bubble = bubble.g.visible; live.bubbleScale = bubble.g.visible ? +sc.toFixed(3) : 0
      }
      // Licht ueber der Theke atmet ein wenig mit dem Stempel (sonst steht das Bild zwischen den Ankern still)
      lamp.intensity = 26 + (p.phone ? 10 * bump((t - T.stamp) / 0.6) : 0)
      // Waehrend der Fahrt in die Nahaufnahme gleiten Schild und Tafel unter den Textzeilen durch: dort
      // dunkeln sie ab, dazu ein dunkler Verlauf oben (Abnahme 18.11.2026: "Handy" stand auf dem hellen
      // Schild, daneben angeschnittene Woerter der Tafel)
      signMat.color.setScalar(lerp(1, 0.42, zk)); menuMat.color.copy(menuCol).multiplyScalar(lerp(1, 0.45, zk))
      signHalo.material.opacity = 0.3 * (1 - zk)
      if (zoomShade) zoomShade.style.opacity = (0.85 * Math.sin(Math.PI * zk)).toFixed(3)
      kit.sync()
      // ---- Pruefkaesten. In der Nahaufnahme zaehlen nur Handys, Haken, Stempel (und mit "counter" die Karte):
      // Schild, Tafel und Figuren sind dann angeschnitten, wie in jeder Nahaufnahme, und keine Aussage mehr.
      const wideOn = zoomK(t) < 0.2
      kit.setSafe('sign', wideOn ? kit.project(signCorners) : null); kit.setSafe('menu', wideOn ? kit.project(menuCorners) : null)
      kit.setSafe('owner', wideOn ? kit.meshBox([owner.fig]) : null)
      kit.setSafe('guest', wideOn && shown && pos.z > -0.1 ? kit.meshBox([guest.fig]) : null)
      if (p.phone) {
        kit.setSafe('phone', shown && pos.z > -0.1 ? kit.meshBox([gPhone.g]) : null)
        kit.setSafe('scanner', sPhone.g.visible && ko > 0.5 ? kit.meshBox([sPhone.g]) : null)
        kit.setSafe('check', check.g.visible && check.g.scale.x > 0.5 ? kit.meshBox([check.m]) : null)
        kit.setSafe('stamp', stamp.g.visible && stamp.g.scale.x > 0.5 ? kit.meshBox([stamp.coin]) : null)
      }
      if (p.bubble) kit.setSafe('bubble', wideOn && bubble.g.visible && bubble.g.scale.x > 0.5 ? kit.meshBox([bubble.m]) : null)
      if (p.paper) kit.setSafe('paper', (wideOn || p.close === 'counter') && tossK < 1 ? kit.meshBox([paper.mesh]) : null)
      live.t = t; live.guest = shown ? [+pos.x.toFixed(3), +pos.z.toFixed(3)] : null; live.zoom = +zoomK(t).toFixed(3)
    })

    // Nur fuer tools/test_3d_iso_shop.mjs: was gerade zu sehen ist, die Zeiten, das Schild, und wo ein Ding
    // wirklich Pixel aendert (Bild mit und ohne; prueft, ob der Pruefkasten darauf liegt)
    const things = { guest: () => guest.fig, owner: () => owner.fig, stamp: () => stamp && stamp.g, bubble: () => bubble && bubble.g, paper: () => paper && paper.mesh, phone: () => gPhone && gPhone.g }
    kit.canvas.isoShop = {
      sign: { ...signInfo }, times: { ...T, walkIn, walkOut }, frames: { wide: FW, close: FC },
      live: () => ({ ...live }),
      // Kleinster Abstand (Meter) zwischen Kunde und Tuerblatt in diesem Bild; negativ = er steckt darin.
      // Wie doorGap in iso-street: der Test prueft damit die Tuer in 0,05-s-Schritten, ohne Bilder zu rechnen.
      doorGap: () => {
        if (!guest.fig.visible || Math.abs(hinge.rotation.y) < 1e-3) return null
        scene.updateMatrixWorld()
        const inv = new THREE.Matrix4().copy(hinge.matrixWorld).invert(), q1 = V(0, 0, 0), sc = guest.fig.scale.x
        let best = Infinity
        for (const [mesh, r, l] of guest.capsules()) for (let i = 0; i <= 8; i++) {
          q1.set(0, -l / 2 + l * i / 8, 0).applyMatrix4(mesh.matrixWorld).applyMatrix4(inv)
          // Blatt im eigenen System: x von -leafW bis 0, y von 0 bis DOOR.h, z +-0,04
          const dx = Math.max(-leafW - q1.x, 0, q1.x), dy = Math.max(-q1.y, 0, q1.y - DOOR.h), dz = Math.max(0, Math.abs(q1.z) - 0.04)
          best = Math.min(best, Math.hypot(dx, dy, dz) - r * sc)
        }
        return +best.toFixed(3)
      },
      // Lage der Handys in der Welt (Meter): Mitte des QR-Codes und Mitte des Scanners
      spots: () => {
        kit.sync(); const r = v => v.toArray().map(x => +x.toFixed(3)), o = {}
        if (gPhone) o.qr = r(gPhone.inner.localToWorld(V(0, (QRY[0] + QRY[1]) / 2, 0))), o.phone = r(gPhone.inner.localToWorld(V(0, 0, 0)))
        if (sPhone) o.scanner = r(sPhone.inner.localToWorld(V(0, 0, 0)))
        return o
      },
      drawnBox: what => kit.drawnBox(things[what] ? things[what]() : null)
    }
  }
}
