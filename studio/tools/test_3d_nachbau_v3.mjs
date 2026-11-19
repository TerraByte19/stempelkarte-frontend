#!/usr/bin/env node
// test_3d_nachbau_v3.mjs - prueft die Schalter, die der Nachbau "zwei Cafés" in Fassung 3 brauchte (20.11.2026). Das Review
// von Fassung 2 (6 von 10) fand sechs Ueberblendungen statt drei, Kamerawechsel bis 0,5 s neben dem Vorbild, ein Dach, das
// per Blende in einen nackten Kasten im Schwarzen wechselte, einen Brunnenplatz ("unsere Welt"), einen Namen, der vier
// Sekunden stehen blieb, Tafeln, die an die Woerter oben stiessen, ein Handy, das durch das Fenster schien, und mehr als
// zwanzig Effekte. Alle Schalter sind aus, solange ein Skript sie nicht setzt.
//
//   node studio/tools/test_3d_nachbau_v3.mjs
//
// Was festgenagelt wird und warum:
//  1. "captionStyle.boxSize": Schrift der Tafeln (Vorgabe 84 wie bisher, ohne eigenen Zeilenabstand); 92 gibt 92 px und
//     rund 101 px Zeilenabstand wie im Vorbild. Nur mit "box", nur 50 bis 140 (sonst Abbruch).
//  2. iso-street "camera": "reise": EIN Teil von Anfang bis Kran. Sinkflug steil (ueber 60 Grad), vor "roof" nah und flach
//     an der eigenen Front (unter 40 Grad, hoechstens 60 m, Schild mittig), ueber dem Raum 40 bis 48 Grad, beim
//     Sperrbildschirm der eigene Laden links, hinter dem Fenster fast senkrecht, nach "travel" ueber dem Raum gegenueber,
//     nach dem Kran fast senkrecht. Anker in falscher Reihenfolge, "phoneUi" oder Stammkunde dazu brechen ab.
//  3. Deckel (kit.shop hollow): bis "roof" zu, danach abgehoben und unsichtbar, nach "back" wieder drauf; gegenueber mit
//     "roof2" und "kran". Im vollen Raum mindestens 15 Leute, im leeren nur der Inhaber; Tische in beiden.
//  4. Kein Brunnenplatz mit "reise", aber weiter ohne (Vorgabe unveraendert); Verkehr ist eine reine Funktion von t, und nie
//     stehen zwei Fahrzeuge naeher als 3 m beieinander.
//  5. Drei Handybilder in einem Teil (phone-ui host): Wallet nur zwischen "wallet" und "back"; das Handy mit dem
//     Sperrbildschirm ist weg, wenn das Fenster kommt (kein Doppelbild); die Mitteilungen ueber der Strasse gehen mit
//     "travel"; mit "tones": false keine eigenen Toene. Der Kunde fuer die Linie steht 9,5 bis 14 m von der Tuer (C1).
//  6. Korb gegenueber: erst ab "trash", Karte und E-Mail ab ihren Ankern, nach "trashDrop" im Korb verschwunden.
//  7. Name in "neon": nach rund einer Sekunde aus (wie im Vorbild), ohne "neon" an wie vorher; Tafeln mit "boards" in
//     "neon" nie ueber y 470.
//  8. Gleiche Pixel nach Spruengen (jedes Bild haengt nur an t).
//  9. cta-comment "tones": false laesst den eigenen "pop" weg (im Vorbild klingt beim Schlussbild nur ein dumpfer Stoss).
// 10. Runde 1 nach dem Review von Fassung 3 (21.11.2026): die untere Bildhaelfte war schwarz (elf Laternen, fuenf mit Schein,
//     jedes zehnte Fenster an), die Kamera 1,4-mal zu nah, der Kran startete langsam, der Korb stand silbern mitten im Raum,
//     der Name war halb so gross wie im Vorbild, die Strasse hinter dem Fenster fast schwarz und die Blende ins Schlussbild
//     0,3 s spaet. Festgenagelt: mit "reise" ueber 100 Laternen und geparkte Autos nie auf einer Fahrspur des Verkehrs und
//     nie vor dem eigenen Laden, rund ein Viertel der Fenster hell, Kran schnell los (nach einem Viertel der Zeit mehr als
//     die Haelfte der Hoehe), Korb auf dem Gehweg vor dem Laden gegenueber und mit dessen Deckel wieder weg, Name ohne Logo
//     und groesser, Fenster ueber der Strasse mit "veil" 0,42; im Skript "lead" an einem Teil (Vorgabe wie vorher 0,3).
// 11. Runde 2 (22.11.2026): die Strassen lagen als schraeges X im Bild, die Fronten im V, und satt nachtblaue Dachflaechen fuellten das
//     untere Drittel; im Vorbild stehen beide Cafés nebeneinander an derselben Strasse, beide Fronten zur Kamera, die Nord-Sued-Strasse
//     laeuft gerade durch das Bild, die Daecher sind die dunkelsten Flaechen. Dazu: Wallet 0,35 s zu frueh weg, Deckel 0,45 s zu frueh zu,
//     eine Luecke zwischen Sperrbildschirm und Fenster, ein Deckel, der als Geist ueber dem Raum ausblendete, Schildchen zu klein und ueber
//     dem Namen, Korb klein und durchsichtig. Festgenagelt: beide Laeden im Norden mit Front nach Sueden, links und rechts der Nord-Sued-
//     Strasse; am Anfang und nach dem Kran die Strasse hoechstens 15 Grad schraeg und beide Schilder in der Bildmitte (y 0,35 bis 0,6);
//     im vollen Raum die Theke links im Bild; eine Dachplatte je Haus und ein fast neutrales Himmelslicht; Wallet bis "back" ganz da,
//     Deckel danach noch offen und fest (nicht halb durchsichtig), Ueberblendung vom Sperrbildschirm ins Fenster, Schildchen 1,25-fach und
//     weg, solange der Name leuchtet; Korb 1,5 m mit dunklem Mantel; Name 0,9 s.
// 12. Runde 3: die Stadt war ein dichter Teppich kleiner Haeuser mit rund 156 Laternen auf jeder Strasse, zwischen den Cafés
//     nur eine schmale Gasse; im Vorbild wenige grosse, fast schwarze Bloecke und EINE breite, beleuchtete Allee zwischen den Cafés mit
//     Laternen paarweise und geparkten Autos, die Nebenstrassen dunkel. Dazu zwei Kamerafahrten mit falschem Verlauf (zurueck auf die
//     Strasse in 0,45 s statt rund 1 s; Fahrt zum Café gegenueber vorn schnell, dann Halt, dann ein zweiter Schub) und ein Kran, der
//     schnell los fuhr. Festgenagelt: Allee 4 m je Seite breiter, Laternen nur an Allee und Strasse vor den Cafés (20 bis 40, paarweise),
//     geparkte Autos an den Bordsteinen der Allee, Haeuser im Median ueber 60 m2; "zurueck" bei "back" + 0,7 s noch in Fahrt; Fahrt
//     hinein ohne Halt (Abstand faellt in jedem 0,1-s-Schritt) und rund drei Viertel des Wegs nach 1,4 s; Kran nicht schnell los;
//     von oben flacher (Fassaden sichtbar wie im Vorbild); Bruestung nur am vollen Café; Korb ohne dunklen Mantel; Mitteilungen bis
//     0,4 s nach "travel"; Schlussbild mit weissen Kernen.
// 13. Runde 4: rund doppelt so viele Laternen wie im Vorbild, als Streichhoelzer mit runder Kugel und rundem Fleck am Bordstein (die
//     Strasse las sich gepunktet), eine Laterne mit beigem See im vollen Raum, durchsichtige Buchstaben im Namen, die letzte Frage 0,5 s
//     ueber den Partikeln, Partikel wie Laternen mit weissem Kern, Bloecke als Platten mit Fugenkreuz, schwarze Cafés mit schwarzer
//     Markise, schwarze Figuren auf Schattenscheiben, der Sperrbildschirm zu nah und schraeg, Schwenk mit Drehung, der Raum gegenueber
//     bei der Fahrt oben links am Rand. Festgenagelt: 11 Laternen (4 Paare auf der Allee, mindestens 24 m auseinander, 3 an der Strasse
//     vor den Cafés), jede mit Scheibe, kein Kopf im Bild, solange der Raum offen ist; Ampel an der Ecke; braune Fassade an beiden
//     Cafés, Glaswand nur am vollen; Schild gegenueber verblasst mit dem Deckel; Fuellung des Namens normal gemischt; "outWithBar"
//     (Textzeile geht mit der Leiste); Symbole im Schlussbild satt blau ohne weissen Kern, hinter dem Stichwort duenner; 14 Leute
//     im vollen Raum; Kamera: Sinkflug naeher und zurueckgedreht, Schwenk ohne Drehung, Drehung erst beim Heranfahren, Sperrbildschirm
//     110 bis 130 m und fast von Sueden, bei der Fahrt der Raum gegenueber nach 0,9 s unter den Woertern, nach dem Fallen ohne Halt in
//     den Kran.
// Kein Netz, keine Kosten, etwa drei bis fuenf Minuten.
import { normalize, estimateTimes, timeline } from '../engine/script.mjs'
import { openStudio, seek } from '../engine/render.mjs'

let failed = 0
const check = (label, ok, info = '') => { console.log(`${ok ? 'ok    ' : 'FEHLER'} ${label}${info ? ' - ' + info : ''}`); if (!ok) failed++ }
const throws = (label, s, re) => { let msg = ''; try { normalize(s) } catch (e) { msg = e.message } check(label, re.test(msg), msg.slice(0, 160) || 'kein Fehler') }
const at = (pg, t) => pg.evaluate(t => { window.seek(t, { paint: false }) }, t)
const canvasHash = (pg, sel) => pg.evaluate(sel => {
  const c = document.querySelector(sel), g = document.createElement('canvas'); g.width = c.width; g.height = c.height
  const x = g.getContext('2d', { willReadFrequently: true }); x.drawImage(c, 0, 0)
  const d = x.getImageData(0, 0, c.width, c.height).data
  let h = 0x811c9dc5; for (let i = 0; i < d.length; i += 4) { h ^= d[i] ^ (d[i + 1] << 8) ^ (d[i + 2] << 16); h = Math.imul(h, 0x01000193) >>> 0 }
  return h.toString(16)
}, sel)
const dbg = (pg, fn, ...a) => pg.evaluate(({ fn, a }) => { const d = document.querySelector('canvas.is-canvas').isoDebug; const parts = fn.split('.'); let o = d; for (const k of parts.slice(0, -1)) o = o[k]; return o[parts[parts.length - 1]](...a) }, { fn, a })
const tail = { component: 'big-number', params: { value: '1', label: 'Probe' }, captions: [{ lines: ['Fertig.'] }] }
const street = { shop: 'Café 1', icon: 'cup', accent: '#2F5BFF', rival: 'Café 2', rivalIcon: 'cup', rivalAccent: '#E58A45', ours: 'right', heart: false, walker: false, smoke: false, crowd: 12, dark: 0.5, tones: false }
// Zeitplan der Probe (absolute Sekunden, im Skript als Zahl erlaubt): das Vorbild verdichtet auf rund 18 s
const A = { tags: 0.8, boards: 1.0, lines: 1.3, boardsOut: 1.9, pan: 2.0, roof: 4.0, wallet: 5.0, walletAdd: 5.4, walletCard: 5.8, walletNoApp: 6.2, back: 6.8, lock: 7.4, lockNotify: 7.8,
  msg: 8.4, msgType: 8.6, msgSend: 9.4, msgOut: 9.7, travel: 10.6, roof2: 11.6, trash: 12.2, trashCard: 12.5, trashMail: 12.8, trashDrop: 13.3, kran: 14.0, name: 16.8 }
const words = n => Array.from({ length: n }, (_, i) => ['Wort', 'und', 'noch', 'eins'][i % 4] + (i === n - 1 ? '.' : '')).join(' ')
const reiseScript = (over = {}, anchors = A) => ({
  meta: { title: 'test v3', slug: 'test-v3' }, look: 'neon', timing: { lead: 0.3, hold: 0.8 }, captionStyle: { mode: 'wort', box: true, boxSize: 92 },
  scenes: [{ parts: [{ component: 'iso-street', params: { ...street, camera: 'reise', tags: 'CAFÉ 1,CAFÉ 2', boards: 'cup', reward: 'Gratis-Kaffee', left: 2, clock: '19:12', message: 'Frischer Kuchen ist da!', ...over },
    anchors: anchors,
    captions: [{ lines: ['Zwei *Cafés. / In einer Straße.'], instant: true }, { lines: [words(10)] }, { lines: [words(10)] }, { lines: [words(10)] }, { lines: [words(8)] }, { role: 'name', lines: ['Stampit.'] }, { lines: [words(8)] }] }, tail] }]
})
const fails = async (label, s, re) => {
  const studio = await openStudio({ script: s, times: estimateTimes(normalize(s)) })
  try { const pg = await studio.page(), st = await studio.state(pg); const msg = [...st.errors, ...studio.problems].join(' | '); check(label, re.test(msg), msg.slice(0, 200) || 'kein Fehler') } finally { await studio.close() }
}

// ---------------------------------------------------------------- 1. boxSize (Skript)
{
  const base = { meta: { title: 't', slug: 't' }, scenes: [{ component: 'big-number', params: { value: '1', label: 'x' }, captions: [{ lines: ['Gleiche Straße. / Zwei *Cafés.'] }] }] }
  check('"boxSize": Vorgabe 84', normalize({ ...base, captionStyle: { mode: 'wort', box: true } }).captionStyle.boxSize === 84)
  throws('"boxSize" ohne "box" bricht ab', { ...base, captionStyle: { mode: 'wort', boxSize: 92 } }, /boxSize" gilt nur zusammen mit "box"/)
  throws('"boxSize" 200 bricht ab', { ...base, captionStyle: { mode: 'wort', box: true, boxSize: 200 } }, /boxSize" muss eine Zahl zwischen 50 und 140/)
  for (const [size, lh] of [[84, null], [92, 101 / 92]]) {
    const s = { ...base, captionStyle: { mode: 'wort', box: true, boxSize: size } }
    const studio = await openStudio({ script: s, times: estimateTimes(normalize(s)) })
    try {
      const pg = await studio.page(); await studio.state(pg)
      const m = await pg.evaluate(() => { const sp = document.querySelector('.capb .w'), row = document.querySelector('.capb .row'); return { fs: parseFloat(sp.style.fontSize), lh: row.style.lineHeight } })
      check(`"boxSize" ${size}: Schrift ${size} px, Zeilenabstand ${lh ? 'rund 101 px' : 'wie vorher (CSS 1,2)'}`, m.fs === size && (lh ? Math.abs(parseFloat(m.lh) * size - 101) < 1 : m.lh === ''), JSON.stringify(m))
    } finally { await studio.close() }
  }
}

// ---------------------------------------------------------------- 10. "lead" an einem Teil (Skript)
{
  const parts = lead => ({ meta: { title: 't', slug: 't' }, scenes: [{ parts: [{ component: 'big-number', params: { value: '1', label: 'x' }, captions: [{ lines: ['Eins zwei drei.'] }] },
    { component: 'big-number', params: { value: '2', label: 'y' }, ...(lead != null ? { lead } : {}), captions: [{ lines: ['Vier fünf.'] }] }] }] })
  for (const [lead, want] of [[null, 0.3], [0.55, 0.55]]) {
    const n = normalize(parts(lead)), tl = timeline(n, estimateTimes(n)), p2 = tl.scenes[0].parts[1]
    check(`"lead" ${lead == null ? 'fehlt: Teil beginnt 0,3 s vor seinem ersten Wort (wie vorher)' : '0,55: Teil beginnt 0,55 s davor'}`, Math.abs(tl.caps[1].t[0] - p2.s - want) < 1e-9 && (lead == null) === !('lead' in n.scenes[0].parts[1]), `${(tl.caps[1].t[0] - p2.s).toFixed(3)} s`)
  }
  const first = parts(null); first.scenes[0].parts[0].lead = 0.5
  throws('"lead" am ersten Teil bricht ab', first, /"lead" gilt nur für Teile nach dem ersten/)
  throws('"lead" 2 bricht ab', parts(2), /"lead" muss eine Zahl zwischen 0.1 und 1.2/)
}

// ---------------------------------------------------------------- 13. Runde 4: "outWithBar" (Skript)
{
  const ow = (flag, endCh = { n: -1, word: 0, offset: -0.3 }) => ({ meta: { title: 't', slug: 't' }, progress: { words: ['EINS', 'ZWEI'] },
    scenes: [{ parts: [{ component: 'big-number', params: { value: '1', label: 'x' }, captions: [{ lines: ['Eins zwei drei.'], chapter: 1 }, { lines: ['Vier fünf sechs.'], ...(flag != null ? { outWithBar: flag } : {}) }] },
      { component: 'big-number', params: { value: '2', label: 'y' }, captions: [{ lines: ['Sieben acht.'], ...(endCh ? { chapter: endCh } : {}) }] }] }] })
  const tl0 = (() => { const n = normalize(ow(null)); return timeline(n, estimateTimes(n)) })()
  const n1 = normalize(ow(true)), tl1 = timeline(n1, estimateTimes(n1)), c3 = tl1.caps[2], want = c3.t[0] - 0.3 - 0.12
  check('"outWithBar": Textzeile endet mit der Leiste (Kapitel -1, 0,12 s vor Wort + offset) und blendet in 0,15 s aus; ohne wie vorher', Math.abs(tl1.caps[1].e - want) < 1e-9 && tl1.caps[1].fadeOut === 0.15 && Math.abs(tl0.caps[1].e - (tl0.caps[2].t[0] - 0.12)) < 1e-9 && tl0.caps[1].fadeOut == null, `${tl1.caps[1].e.toFixed(3)} gegen ${want.toFixed(3)}`)
  throws('"outWithBar" ohne spätere Leiste weg (Kapitel -1) bricht ab', ow(true, null), /"outWithBar" braucht eine spätere Textzeile mit "chapter": -1/)
  throws('"outWithBar": "ja" bricht ab', ow('ja'), /"outWithBar" ist entweder true oder fehlt/)
}

// ---------------------------------------------------------------- 2. bis 8. "reise"
{
  const s = reiseScript()
  const studio = await openStudio({ script: s, times: estimateTimes(normalize(s)) })
  try {
    const pg = await studio.page(), st = await studio.state(pg)
    check('"reise": Seite baut ohne Fehler', !st.errors.length && !studio.problems.length, [...st.errors, ...studio.problems].join(' | ').slice(0, 300))
    const part = st.scenes[0].parts[0]
    check('"reise": ein einziger 3D-Teil trägt die Geschichte (bis nach dem Kran)', st.scenes[0].parts.length === 2 && part.e > A.kran + 2.5, JSON.stringify(st.scenes[0].parts))
    // 2. Kamera
    const cam = async t => { await at(pg, t); return dbg(pg, 'camera') }
    // Runde 2: beide Laeden im Norden, Front nach Sueden bei z = -3,15. Mitte der eigenen Front (rechts, Mitte der 9,6 m breiten Front),
    // Mitten der Raeume (Masse SHOP_REISE). Hoehenwinkel jetzt zum jeweiligen Ziel gemessen (die Raeume liegen nicht mehr an der Kreuzung)
    const dist = (c, x, z, y = 2) => Math.hypot(c.x - x, c.z - z, c.y - y)
    const elTo = (c, x, z, y = 1) => Math.atan2(c.y - y, Math.hypot(c.x - x, c.z - z)) * 180 / Math.PI
    // Runde 3: mit der Allee (4 m je Seite) liegen die Mitten 4 m weiter aussen
    const FRONT = [11.95, -3.15], ROOM_R = [-11.95, -7.35], ROOM_O = [11.95, -7.35]
    const c0 = await cam(part.s + 0.05), c1 = await cam(A.roof - 0.05), c2 = await cam(A.roof + 0.8), c3 = await cam(A.lockNotify), c4 = await cam(A.msg + 1.9), c5 = await cam(A.travel + 2.5), c6 = await cam(A.kran + 2.5)
    // Runde 3: flacher (58 Grad statt 64), wie im Vorbild mit sichtbaren Fassaden
    check('Sinkflug: von hoch oben (über 50 Grad), beide Schilder im Bild', c0.el > 50 && [c0.our, c0.riv].every(([x, y]) => x > 0 && x < 1080 && y > 300 && y < 1700), `${c0.el.toFixed(1)} ${JSON.stringify([c0.our, c0.riv].map(v => v.map(Math.round)))}`)
    // Runde 1: 72 m und 42 Grad statt 52 m und 35 Grad (die Front lief ueber den Bildrand; im Vorbild 60 bis 75 % der Breite)
    check('Vor "roof": heran und flach an der eigenen Front (unter 45 Grad, 60 bis 85 m, Schild mittig)', elTo(c1, ...FRONT, 2) < 45 && dist(c1, ...FRONT) > 60 && dist(c1, ...FRONT) < 85 && Math.abs(c1.our[0] - 540) < 300, `${elTo(c1, ...FRONT, 2).toFixed(1)} Grad, ${dist(c1, ...FRONT).toFixed(1)} m, Schild x ${Math.round(c1.our[0])}`)
    check('Über dem Raum 40 bis 48 Grad', elTo(c2, ...ROOM_O) > 40 && elTo(c2, ...ROOM_O) < 48, elTo(c2, ...ROOM_O).toFixed(1))
    check('Sperrbildschirm: eigener Laden links (rechts steht das Handy)', c3.our[0] < 540 && c3.our[0] > 60, c3.our.map(Math.round).join())
    // Runde 3: hinter dem Fenster hoch ueber beiden, aber nicht senkrecht (im Vorbild Fassaden sichtbar), die Cafés im oberen Teil
    check('Hinter dem Fenster hoch über beiden (48 bis 62 Grad), die Schilder über der Bildmitte', c4.el > 48 && c4.el < 62 && [c4.our, c4.riv].every(([, y]) => y < 960), `${c4.el.toFixed(1)} ${JSON.stringify([c4.our, c4.riv].map(v => v.map(Math.round)))}`)
    // Runde 1: Fahrt in zwei Stuecken (schnell bis auf mittlere Entfernung, dann langsam heran bis 2,4 s nach "travel")
    // Abstand zur Kamera taugt bei Blick von Sued-Suedwest nicht (beide Raeume liegen fast gleich weit weg); deshalb im Bild: der
    // Raum gegenueber nahe der Mitte, der eigene weiter weg davon
    const [pr, po] = await dbg(pg, 'project', A.travel + 2.5, [[ROOM_R[0], 1, ROOM_R[1]], [ROOM_O[0], 1, ROOM_O[1]]])
    const off = ([x, y]) => Math.hypot(x - 540, y - 960)
    check('Nach "travel" über dem Raum gegenüber (er steht im Bild nahe der Mitte, der eigene weiter weg)', pr[0] > 100 && pr[0] < 980 && pr[1] > 500 && pr[1] < 1500 && off(pr) < off(po) && elTo(c5, ...ROOM_R) < 48, `gegenüber ${pr}, eigener ${po}, ${elTo(c5, ...ROOM_R).toFixed(1)} Grad`)
    check('Nach dem Kran hoch über beiden (48 bis 62 Grad; Runde 3: flacher, vorher über 72)', c6.el > 48 && c6.el < 62, c6.el.toFixed(1))
    // 3. Deckel und Raeume
    const lid = t => dbg(pg, 'reise.lid', t)
    // gegenueber senkt sich der Deckel erst 0,35 s nach "kran" (KRAN_LID), in 0,45 s
    // Runde 2: der eigene Deckel senkt sich erst 0,5 s nach "back" (OUR_LID_DOWN), in 0,45 s
    const l0 = await lid(A.roof - 0.05), l1 = await lid(A.roof + 0.7), l2 = await lid(A.back + 1.0), l3 = await lid(A.roof2 + 0.7), l4 = await lid(A.kran + 1.0), l5 = await lid(A.kran + 0.3)
    check('Eigener Deckel: zu bis "roof", danach abgehoben und unsichtbar, nach "back" wieder drauf', l0.ours.lift === 0 && l0.ours.k === 1 && l1.ours.lift > 20 && l1.ours.k === 0 && l2.ours.lift === 0 && l2.ours.k === 1, JSON.stringify([l0.ours, l1.ours, l2.ours]))
    check('Deckel gegenüber: zu bis "roof2", danach weg, kurz nach "kran" noch offen, dann wieder drauf; der eigene bleibt dabei zu', l1.rival.lift === 0 && l3.rival.lift > 20 && l3.rival.k === 0 && l5.rival.k === 0 && l4.rival.lift === 0 && l3.ours.lift === 0, JSON.stringify([l3, l5, l4]))
    const rooms = await dbg(pg, 'reise.rooms')
    // Runde 4: 14 statt 18 (im Vorbild rund 22 Leute im ganzen Bild, bei uns waren es mit der Menge davor rund 40)
    check('Voller Raum voll (12 bis 16 Leute, Runde 4: vorher 18), leerer nur mit dem Inhaber, Tische in beiden', rooms[0].people >= 12 && rooms[0].people <= 16 && rooms[1].people === 1 && rooms[0].tables >= 5 && rooms[1].tables >= 4, JSON.stringify(rooms))
    // 4. Platz und Verkehr
    check('"reise": kein Brunnenplatz', (await dbg(pg, 'plaza')) === false)
    const tr = await pg.evaluate(() => { const d = document.querySelector('canvas.is-canvas').isoDebug.reise; const out = []; for (let t = 0; t <= 34; t += 0.1) out.push(d.traffic(t)); return { out, again: JSON.stringify(d.traffic(3.3)) === JSON.stringify(d.traffic(3.3)) } })
    let close = Infinity, busNearRival = false
    tr.out.forEach((list, i) => {
      const vis = list.filter(v => v.visible)
      // Abstand der Mitten minus halbe Laengen (Bus 4,8 m, Auto 1,95 m); auf derselben Strasse in Gegenrichtung (andere
      // Spur) aneinander vorbei ist erlaubt
      const half = v => v.kind === 'bus' ? 4.8 : 1.95
      for (let a = 0; a < vis.length; a++) for (let b = a + 1; b < vis.length; b++) {
        if (vis[a].axis === vis[b].axis && vis[a].lane !== vis[b].lane) continue
        close = Math.min(close, Math.hypot(vis[a].x - vis[b].x, vis[a].z - vis[b].z) - half(vis[a]) - half(vis[b]))
      }
      const bus = list.find(v => v.kind === 'bus'); if (i / 10 > 2 && i / 10 < 4.5 && bus.visible && bus.x < 0 && bus.x > -20) busNearRival = true
    })
    check('Verkehr: reine Funktion von t, nie zwei Fahrzeuge aufeinander, der Bus fährt am Anfang vor dem Café gegenüber', tr.again && close > 1 && busNearRival, `kleinster Abstand ${close.toFixed(2)} m`)
    // 5. Handybilder
    const ui = t => at(pg, t).then(() => pg.evaluate(() => [...document.querySelectorAll('.is-pui')].map(h => {
      const o = sel => { const e = h.querySelector(sel); return e ? +getComputedStyle(e).opacity : null }
      return { pui: o('.pui'), win: o('.pui-win'), pops: [...h.querySelectorAll('.pui-pop')].map(p => +p.style.opacity || 0) }
    })))
    // Runde 2: die Wallet steht bis "back" ganz und ist 0,35 s danach weg (WALLET_OUT)
    // Runde 3: die Mitteilungen bleiben bis 0,4 s nach "travel" (im Vorbild bei 23,0 s noch da) und sind 0,3 s spaeter weg
    const u0 = await ui(A.walletCard + 0.3), u1 = await ui(A.back + 0.4), u2 = await ui(A.msg + 0.3), u3 = await ui(A.msgOut + 0.8), u4 = await ui(A.travel + 0.8), u5 = await ui(A.travel + 0.3)
    check('Drei Handybilder in eigenen Hüllen; Wallet zwischen "wallet" und "back", danach weg', u0.length === 3 && u0[0].pui === 1 && u1[0].pui === 0, JSON.stringify([u0[0], u1[0]]))
    check('Kein Doppelbild: das Handy mit dem Sperrbildschirm ist weg, wenn das Fenster kommt', u2[1].pui === 0 && u2[2].win > 0.5, JSON.stringify([u2[1], u2[2].win]))
    check('Mitteilungen über der Straße nach "msgOut" da, 0,3 s nach "travel" noch da, 0,8 s danach weg', u3[2].pops.filter(o => o > 0.9).length >= 3 && u5[2].pops.filter(o => o > 0.9).length >= 3 && u4[2].pops.every(o => o === 0), JSON.stringify([u3[2].pops, u5[2].pops, u4[2].pops]))
    const own = st.cues.filter(c => c.by === 'iso-street')
    check('"tones": false: keine eigenen Töne von Handy, Fenster oder Name', own.length === 0, JSON.stringify(own.slice(0, 4)))
    const ld = await dbg(pg, 'lockDot')
    check('Sperrbildschirm: der Kunde steht 9,5 bis 14 m von der eigenen Tür (nie "vor der Tür")', ld && ld.dist >= 9.5 && ld.dist <= 14, JSON.stringify(ld))
    const dotX = await at(pg, A.lockNotify + 0.6).then(() => pg.evaluate(() => { const m = /translate\(([\d.-]+)px/.exec(document.querySelectorAll('.is-pui')[1].querySelector('.pui-dot').style.transform); return m ? +m[1] : null }))
    check('Sperrbildschirm: der leuchtende Punkt steht im Bild links (die Linie kommt nicht vom Rand)', dotX != null && dotX >= 80 && dotX <= 520, String(dotX))
    // 6. Korb
    const trash = t => at(pg, t).then(() => dbg(pg, 'reise.trash'))
    const k0 = await trash(A.trash - 0.05), k1 = await trash(A.trashMail + 0.4), k2 = await trash(A.trashDrop + 0.6)
    check('Korb: erst ab "trash", Karte und E-Mail schweben, nach "trashDrop" im Korb verschwunden', k0.bin === 0 && !k0.card && k1.bin === 1 && k1.card && k1.mail && !k2.card && !k2.mail && k2.bin === 1, JSON.stringify([k0, k1, k2]))
    // 10. Runde 1: Stadt, Korb, Kran, Fenster
    const city = await dbg(pg, 'reise.city')
    // Runde 2: Spur des Verkehrs auf der Nord-Sued-Strasse x < 0, die Ost-West-Strasse ganz; vor dem eigenen Laden (jetzt im Nordosten,
    // Front bei z = -3,15) steht die Menge bis auf die Fahrbahn
    // Runde 3: das fahrende Auto der Allee nimmt die Spur x = -2,2 (1,8 m breit), Bus und Autos der Ost-West-Strasse fahren bei z = 1,05;
    // die Menge steht vor dem eigenen Café (x 7,15 bis 16,75)
    const onLane = ([x, z, r]) => (r === 0 ? Math.abs(x + 2.2) < 1.85 : Math.abs(z) < 2) || (x > 6 && x < 18 && z > -4 && z < 1)
    check('Runde 1 und 3: mindestens 12 geparkte Autos, keins auf einer Fahrspur des Verkehrs oder vor dem eigenen Laden', city.parked.length >= 12 && !city.parked.some(onLane), `${city.parked.length} Autos, auf Spur: ${JSON.stringify(city.parked.filter(onLane))}`)
    check('Runde 1: rund ein Viertel der Fenster hell (in "neon" sonst jedes zehnte)', city.lit > 0.2 && city.lit < 0.35, String(city.lit))
    const tz = await dbg(pg, 'reise.trashAt')
    check('Runde 1: Korb auf dem Gehweg vor dem Laden gegenüber (Front bei z = -3,15, nicht im Raum)', tz[1] > -3.15 && tz[1] < 0 && tz[0] < -3.15, JSON.stringify(tz))
    const kg = await trash(A.kran + 0.35 + 0.4)
    check('Runde 1: Korb geht mit dem Deckel gegenüber', kg.bin === 0 && !kg.card && !kg.mail, JSON.stringify(kg))
    // Runde 3: der Kran fuhr seit Runde 1 schnell los (Spitze 0,2 s nach "kran"); im Vorbild ist die Spitze rund 0,5 s danach, der halbe
    // Weg nach rund 0,75 s. Gemessen am Abstand (geometrisch, wie der sichtbare Zoom)
    const kd = async dt => (await cam(A.kran + dt)).pose.d, kd0 = await kd(0), kd1 = await kd(2.4), kf = async dt => Math.log((await kd(dt)) / kd0) / Math.log(kd1 / kd0)
    const kq = [await kf(0.25), await kf(0.75), await kf(1.5)]
    check('Runde 3: Kran nicht schnell los (nach 0,25 s unter 20 %), halber Weg nach 0,75 s (40 bis 65 %), nach 1,5 s über 85 %', kq[0] < 0.2 && kq[1] > 0.4 && kq[1] < 0.65 && kq[2] > 0.85, kq.map(v => v.toFixed(2)).join(' / '))
    const veil = await at(pg, A.msg + 0.6).then(() => pg.evaluate(() => +getComputedStyle(document.querySelectorAll('.is-pui')[2].querySelector('.pui-veil')).opacity))
    check('Runde 1: Straße hinter dem Fenster nur gedimmt ("veil" 0,42 statt 0,55)', Math.abs(veil - 0.42) < 0.01, String(veil))
    // 7. Name und Tafeln
    const nm = await pg.evaluate(() => document.querySelector('canvas.is-canvas').isoDebug.name)
    check('Runde 1: Name in "reise" ohne Logo und groß (Schrift über 200 px, vorher 168 mit Logo)', nm && nm.size > 200, JSON.stringify(nm))
    // Runde 2: in "reise" 0,9 s voll (NAME_ON_REISE), dann 0,3 s aus; im Vorbild an bis 31,2 s, aus bis 31,4 s
    const n1 = await dbg(pg, 'nameOn', A.name + 0.4), n2 = await dbg(pg, 'nameOn', A.name + 1.25), n15 = await dbg(pg, 'nameOn', A.name + 0.88)
    check('Runde 2: Name in "reise" 0,9 s voll an', n15 > 0.9, String(n15))
    check('"neon": Name an, nach rund einer Sekunde aus (wie im Vorbild)', n1 > 0.9 && n2 === 0, `${n1} / ${n2}`)
    await at(pg, A.lines + 0.3)
    const bt = await pg.evaluate(() => [...document.querySelectorAll('.is-board')].map(e => Math.round(e.getBoundingClientRect().top)))
    check('"neon": Tafeln über den Läden beginnen nicht über y 470 (unter den Wörtern; die leichte Drehung hebt eine Ecke um wenige px)', bt.length === 2 && bt.every(y => y >= 455), JSON.stringify(bt))
    await at(pg, A.kran + 1.6)
    const tags = await pg.evaluate(() => [...document.querySelectorAll('.is-tag')].map(e => +getComputedStyle(e).opacity))
    check('"reise": Schildchen kommen mit dem Kran wieder', tags.length === 2 && tags.every(o => o > 0.9), JSON.stringify(tags))
    // 11. Runde 2: Lage, Kamera von Sueden, Theke, Daecher, Zeiten, Schildchen, Korb
    const lay = await dbg(pg, 'reise.layout')
    check('Runde 2: beide Läden im Norden, Front nach Süden (z = -3,15), der eigene rechts (Osten), gegenüber links (Westen) der Nord-Süd-Straße', lay.ours[0] > 0 && lay.rival[1] < 0 && Math.abs(lay.ours[3] + 3.15) < 1e-6 && Math.abs(lay.rival[3] + 3.15) < 1e-6 && lay.rot.every(r => r === 0), JSON.stringify(lay))
    check('Runde 2: auf jedem Haus eine dunkle Dachplatte, Himmelslicht fast neutral (#2E3038)', lay.roofPlates === lay.houses && lay.houses > 100 && lay.sky === '#2e3038', `${lay.roofPlates} / ${lay.houses}, ${lay.sky}`)
    // 12. Runde 3: Allee, Laternen, grosse Bloecke, Bruestung
    check('Runde 3: Allee zwischen den Cafés (je Seite 4 m breiter, Fronten mindestens 14 m auseinander)', lay.av === 4 && lay.ours[0] - lay.rival[1] >= 14, `AV ${lay.av}, Abstand ${(lay.ours[0] - lay.rival[1]).toFixed(2)} m`)
    // Runde 4: Masten am Bordstein (Allee x = +-6,15, Strasse vor den Cafés z = +-2,15), statt 30 nur noch 11
    const XA = 1.9 + 4 + 0.25, ZA = 1.9 + 0.25, onAve = ([x]) => Math.abs(Math.abs(x) - XA) < 0.01, onCafe = ([, z]) => Math.abs(Math.abs(z) - ZA) < 0.01
    const paired = city.lampAt.filter(onAve).every(([x, z]) => city.lampAt.some(([x2, z2]) => Math.abs(x2 + x) < 0.01 && Math.abs(z2 - z) < 0.01))
    const aveZ = [...new Set(city.lampAt.filter(onAve).map(([, z]) => z))].sort((a, b) => a - b), gaps = aveZ.slice(1).map((z, i) => z - aveZ[i])
    check('Runde 3 und 4: Laternen nur an der Allee (paarweise gegenüber, Paare mindestens 24 m auseinander) und an der Straße vor den Cafés (höchstens 3)', city.lampAt.every(l => onAve(l) || onCafe(l)) && paired && gaps.every(g => g >= 24) && city.lampAt.filter(onCafe).length <= 3, `${city.lamps} Laternen, Allee bei z ${aveZ.join(', ')}, abseits: ${JSON.stringify(city.lampAt.filter(l => !onAve(l) && !onCafe(l)))}`)
    check('Runde 4: 8 bis 12 Laternen (vorher rund 30), jede mit heller Scheibe am Kopf', city.lamps >= 8 && city.lamps <= 12 && city.halos === city.lamps, `${city.lamps} Laternen, ${city.halos} Scheiben`)
    check('Runde 3: geparkte Autos an beiden Bordsteinen der Allee', city.parked.every(([x, , r]) => r === 0 && Math.abs(Math.abs(x) - 4.8) < 0.01) && city.parked.some(([x]) => x < 0) && city.parked.some(([x]) => x > 0), JSON.stringify(city.parked.slice(0, 4)))
    check('Runde 3: große Blöcke statt kleiner Häuser (Grundfläche im Median über 60 m², vorher rund 25)', lay.houseArea > 60, String(lay.houseArea))
    check('Runde 3: niedrige Brüstung nur am vollen Café (zwei Teile: Front und Seite)', lay.parapet === 2, String(lay.parapet))
    // "zurueck auf die Strasse": weich von 0,3 s vor "back" bis 1,1 s danach; bei "back" + 0,7 s noch in Fahrt (im Vorbild um 16,2 s)
    const bp = async dt => (await cam(A.back + dt)).pose.d
    const [b0, b1, b2, b3] = [await bp(-0.3), await bp(0.65), await bp(0.75), await bp(1.1)]
    check('Runde 3: zurück auf die Straße von 0,3 s vor "back" (noch über dem Raum) bis 1,1 s danach, bei "back" + 0,7 s noch in Fahrt (vorher nach 0,45 s fertig)', b0 < 75 && b2 - b1 > 0.5 && b3 > 90, [b0, b1, b2, b3].map(v => v.toFixed(2)).join(' / '))
    // Fahrt hinein: EINE Bewegung, der Abstand faellt ab 0,1 s vor "travel" in jedem 0,1-s-Schritt bis 2,2 s danach; nach 1,4 s rund drei
    // Viertel des Wegs (geometrisch), nach 0,3 s erst ein Viertel
    const tp = []; for (let dt = -0.1; dt <= 2.21; dt += 0.1) tp.push((await cam(A.travel + dt)).pose.d)
    const steps = tp.slice(1).map((d, i) => tp[i] - d), tq = async dt => Math.log((await cam(A.travel + dt)).pose.d / 165) / Math.log(64 / 165)
    const tq1 = await tq(0.3), tq2 = await tq(1.4)
    check('Runde 3: Fahrt hinein ohne Halt (Abstand fällt in jedem 0,1-s-Schritt), nach 0,3 s unter 25 %, nach 1,4 s 65 bis 85 % des Wegs', steps.every(x => x > 0.2) && tq1 < 0.25 && tq2 > 0.65 && tq2 < 0.85, `kleinster Schritt ${Math.min(...steps).toFixed(2)} m, ${tq1.toFixed(2)} / ${tq2.toFixed(2)}`)
    for (const [lab, t] of [['Anfang', part.s + 0.5], ['nach dem Kran', A.kran + 2.5]]) {
      const c = await cam(t), [n, sd] = await dbg(pg, 'project', t, [[0, 0, -12], [0, 0, 12]])
      const tilt = Math.atan2(Math.abs(sd[0] - n[0]), Math.abs(sd[1] - n[1])) * 180 / Math.PI
      check(`Runde 2, ${lab}: Nord-Süd-Straße höchstens 15 Grad schräg, beide Schilder in der Bildmitte (y 0,35 bis 0,6), der eigene rechts`, tilt <= 15 && [c.our, c.riv].every(([x, y]) => y > 0.35 * 1920 && y < 0.6 * 1920 && x > 0 && x < 1080) && c.our[0] > c.riv[0], `${tilt.toFixed(1)} Grad, eigener ${c.our.map(Math.round)}, gegenüber ${c.riv.map(Math.round)}`)
    }
    const rm = await dbg(pg, 'reise.rooms'), [cp, mp] = await dbg(pg, 'project', A.roof + 1.5, [rm[0].counter, [ROOM_O[0], 1, ROOM_O[1]]])
    check('Runde 2: im vollen Raum steht die Theke links im Bild (wie im Vorbild bei 10,5 s)', cp[0] < mp[0] - 60, `Theke ${cp}, Raum ${mp}`)
    const uw = await ui(A.back), ux = await ui(A.msg + 0.05)
    check('Runde 2: Wallet bis "back" ganz da; Sperrbildschirm und Fenster überblenden (kein Bild ohne beide)', uw[0].pui === 1 && ux[1].pui > 0 && ux[2].win > 0, JSON.stringify([uw[0].pui, ux[1].pui, ux[2].win]))
    // Runde 4: der Deckel hebt in 0,4 s ab (LID_UP, vorher 0,6 s); 75 % des Wegs also nach 0,3 s
    const la = await lid(A.roof + 0.3), lb = await lid(A.back + 0.3)
    check('Runde 2: Deckel hebt fest ab (bei 75 % des Wegs noch ganz deckend, über 20 m) und ist 0,3 s nach "back" noch oben', la.ours.k === 1 && la.ours.lift > 20 && lb.ours.lift > 20, JSON.stringify([la.ours, lb.ours]))
    const tagW = async t => { await at(pg, t); return pg.evaluate(() => [...document.querySelectorAll('.is-tag')].map(e => ({ r: e.getBoundingClientRect().width / e.offsetWidth, o: getComputedStyle(e).display === 'none' ? 0 : +getComputedStyle(e).opacity }))) }
    const tg1 = await tagW(A.tags + 0.6), tg2 = await tagW(A.name + 0.4)
    check('Runde 2: Schildchen 1,25-fach, und weg, solange der Name leuchtet', tg1.every(x => Math.abs(x.r - 1.25) < 0.03 && x.o > 0.9) && tg2.every(x => x.o === 0), JSON.stringify([tg1, tg2]))
    const tb = await trash(A.trashMail + 0.4)
    // Runde 3: der dunkle Mantel las sich als schwarzer Eimer; jetzt heller Draht ohne Mantel (im Vorbild sieht man die Kacheln durch)
    check('Runde 2 und 3: Korb 1,5 m Radius, 3,4 m hoch, heller Draht ohne dunklen Mantel', tb.r === 1.5 && tb.h === 3.4 && !tb.inner && tb.wire === '#b8bcc4', JSON.stringify(tb))
    // 13. Runde 4
    const heads = city.heads
    const inRoom = []
    for (const t of [A.roof + 0.8, A.roof + 2.0, A.back - 0.5]) { const pr = await dbg(pg, 'project', t, heads); pr.forEach(([x, y], k) => { if (x > -50 && x < 1130 && y > -50 && y < 1970) inRoom.push([t, k, x, y]) }) }
    check('Runde 4: kein Laternenkopf im Bild, solange der volle Raum offen ist (vorher hell am linken Ende der Theke)', inRoom.length === 0, JSON.stringify(inRoom))
    check('Runde 4: Ampel an der Ecke, braune Fassade an beiden Cafés, Glaswand nur am vollen', lay.ampel && lay.fassade.every(n => n === 1) && lay.glas[0] === 1 && lay.glas[1] === 0, JSON.stringify([lay.ampel, lay.fassade, lay.glas]))
    const sg0 = (await at(pg, A.roof2 - 0.1), await dbg(pg, 'reise.signs')), sg1 = (await at(pg, A.roof2 + 0.3), await dbg(pg, 'reise.signs'))
    check('Runde 4: Schild gegenüber verblasst, sobald sein Deckel abhebt (vorher stand "Café 2" in der Textzeile)', sg0[1] > 0.99 && sg1[1] < 0.3, JSON.stringify([sg0, sg1]))
    check('Runde 4: Füllung des Namens normal gemischt (vorher additiv und durchsichtig)', nm.fill === true, JSON.stringify(nm))
    const az = async t => (await cam(t)).pose.az, slideEnd = A.pan + Math.min(2.0, 0.55 * (A.roof - 0.02 - A.pan))
    const [az0, azP, azS, az40, azR] = [await az(part.s + 0.05), await az(A.pan), await az(slideEnd - 0.02), await az(slideEnd + 0.4 * (A.roof - 0.02 - slideEnd)), await az(A.roof - 0.03)]
    check('Runde 4: Sinkflug dreht zurück (Allee wird senkrecht), Schwenk ohne Drehung, die Drehung kommt beim Heranfahren und fast ganz in dessen zweiter Hälfte', az0 - azP > 8 && Math.abs(azS - azP) < 0.5 && azR - azS > 20 && az40 - azS < 0.25 * (azR - azS), [az0, azP, azS, az40, azR].map(v => v.toFixed(1)).join(' / '))
    const dP = (await cam(A.pan)).pose.d, d0 = (await cam(part.s + 0.05)).pose.d
    check('Runde 4: Sinkflug nähert sich um mindestens 15 % (vorher 5 %)', d0 / dP > 1.15, (d0 / dP).toFixed(3))
    const cl = await cam(A.lockNotify)
    check('Runde 4: Sperrbildschirm 110 bis 130 m weit und fast von Süden (höchstens 12 Grad; vorher 92 m und 22 bis 26 Grad)', cl.pose.d > 110 && cl.pose.d < 130 && Math.abs(cl.pose.az) <= 12, `${cl.pose.d.toFixed(1)} m, ${cl.pose.az.toFixed(1)} Grad`)
    const [rr] = await dbg(pg, 'project', A.travel + 0.9, [[ROOM_R[0], 1, ROOM_R[1]]])
    check('Runde 4: bei der Fahrt steht der Raum gegenüber nach 0,9 s schon unter den Wörtern und nicht am Rand (vorher oben links)', rr[0] > 150 && rr[0] < 930 && rr[1] > 0.3 * 1920 && rr[1] < 0.75 * 1920, String(rr))
    const kp = async dt => (await cam(A.kran + dt)).pose.d
    const [p0, p1, p2] = [await kp(-0.6), await kp(-0.25), await kp(0)]
    check('Runde 4: nach dem Fallen ohne Halt in den Kran (zwischen 0,25 s vor "kran" und "kran" noch mindestens 0,5 m zurück)', p1 > p0 && p2 - p1 > 0.5, [p0, p1, p2].map(v => v.toFixed(2)).join(' / '))
    // 8. gleiche Pixel
    const T = A.roof + 1.5
    await seek(pg, T); const h1 = await canvasHash(pg, 'canvas.is-canvas')
    await seek(pg, A.kran + 1); await seek(pg, 0.3); await seek(pg, T); const h2 = await canvasHash(pg, 'canvas.is-canvas')
    await seek(pg, A.roof2 + 1.5); const h3 = await canvasHash(pg, 'canvas.is-canvas')
    check('Gleiche Pixel nach Sprüngen, anderes Bild drüben', h1 === h2 && h3 !== h1, `${h1} / ${h2} / ${h3}`)
  } finally { await studio.close() }
}

// ---------------------------------------------------------------- Vorgaben unveraendert, Abbrueche
{
  const s = { meta: { title: 't', slug: 't' }, look: 'neon', timing: { lead: 0.3, hold: 0.8 }, scenes: [{ parts: [{ component: 'iso-street', params: { ...street, camera: 'descent', tags: 'CAFÉ 1,CAFÉ 2' }, captions: [{ lines: ['Zwei Cafés.'] }, { lines: ['Gleicher Kaffee, gleiche Preise.'] }, { lines: ['Aber eins ist immer voll und gut besucht.'] }, { role: 'name', lines: ['Stampit.'] }, { lines: ['Und du?'] }] }, tail] }] }
  const studio = await openStudio({ script: s, times: estimateTimes(normalize(s)) })
  try {
    const pg = await studio.page(), st = await studio.state(pg)
    const d = await pg.evaluate(() => ({ reise: document.querySelector('canvas.is-canvas').isoDebug.reise, hulls: document.querySelectorAll('.is-pui').length }))
    const plaza = await dbg(pg, 'plaza')
    check('Ohne "reise": kein Deckel, keine Handyhüllen, Brunnenplatz wie vorher', !st.errors.length && d.reise === null && d.hulls === 0 && plaza === true, st.errors.join(' | ').slice(0, 200))
    const nameT = st.anchors.find(a => a.name === 'name').t
    check('Ohne "reise", aber "neon": Name nach rund einer Sekunde aus', (await dbg(pg, 'nameOn', nameT + 0.4)) > 0.9 && (await dbg(pg, 'nameOn', nameT + 1.2)) === 0)
  } finally { await studio.close() }
  const s2 = JSON.parse(JSON.stringify(s)); delete s2.look
  const studio2 = await openStudio({ script: s2, times: estimateTimes(normalize(s2)) })
  try {
    const pg = await studio2.page(), st = await studio2.state(pg)
    const nameT = st.anchors.find(a => a.name === 'name').t
    check('Ohne "neon": Name bleibt an (wie vorher)', (await dbg(pg, 'nameOn', nameT + 1.5)) > 0.9 && (await dbg(pg, 'nameOn', nameT + 3)) > 0.9)
  } finally { await studio2.close() }
}
// cta-comment "tones": false laesst pop und chime weg (Vorgabe true wie bisher)
for (const tones of [true, false]) {
  const s = { meta: { title: 't', slug: 't' }, scenes: [{ component: 'cta-comment', params: { look: 'partikel', logo: false, ...(tones ? {} : { tones: false }) }, captions: [{ role: 'cta', lines: ['Kommentiere KARTE,', 'und wir melden uns.'] }] }] }
  const studio = await openStudio({ script: s, times: estimateTimes(normalize(s)) })
  try { const pg = await studio.page(), st = await studio.state(pg); const own = st.cues.filter(c => c.by === 'cta-comment').length; check(`cta-comment "tones": ${tones}: ${tones ? 'pop auf dem Stichwort wie bisher' : 'keine eigenen Töne'}`, tones ? own === 1 : own === 0, String(own)) } finally { await studio.close() }
}
// Runde 2: Partikelfeld im Schlussbild ("partikel") in der Mitte mindestens halb so dicht wie darunter (vorher dort deutlich dunkler, Review), unten nicht heller als in der Mitte, oben
// (bis 12 % der Hoehe) schwarz, und nach 0,4 s schon voll da (vorher erst nach rund 1,2 s). Gemessen am Alpha der Partikel-Leinwand.
{
  const s = { meta: { title: 't', slug: 't' }, scenes: [{ component: 'cta-comment', params: { look: 'partikel', logo: false, tones: false }, captions: [{ role: 'cta', lines: ['Kommentiere KARTE,', 'und wir melden uns.'] }] }] }
  const studio = await openStudio({ script: s, times: estimateTimes(normalize(s)) })
  try {
    const pg = await studio.page(), st = await studio.state(pg)
    const bands = t => seek(pg, t).then(() => pg.evaluate(() => {
      const c = document.querySelector('.pk-cv'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data, out = []
      for (const [a, b] of [[0, 0.12], [0.25, 0.62], [0.62, 0.75], [0.85, 1]]) {
        let sum = 0, n = 0
        for (let y = Math.floor(a * c.height); y < Math.floor(b * c.height); y += 2) for (let x = 0; x < c.width; x += 2) { sum += d[(y * c.width + x) * 4 + 3]; n++ }
        out.push(sum / n)
      }
      return out
    }))
    const s0 = st.scenes[0].s, b1 = await bands(s0 + 0.4), b2 = await bands(s0 + 1.5)
    const tot = b => b.reduce((a, x) => a + x, 0)
    check('Runde 2: Partikelfeld oben schwarz, Mitte mindestens halb so hell wie darunter, unten nicht heller als die Mitte, nach 0,4 s voll da', b2[0] < 0.5 && b2[1] > 0.5 * b2[2] && b2[3] < 1.15 * b2[1] && Math.abs(tot(b1) - tot(b2)) < 0.12 * tot(b2), JSON.stringify([b1, b2].map(b => b.map(x => +x.toFixed(1)))))
    // Runde 3: Grund am Rand fast schwarz. Runde 4: die weissen Kerne lasen sich wie Laternen; im Vorbild sind die Symbole satt blau
    // (#2A4BE8) mit einem kleinen hellen Quadrat an der Seite (#A8BCFF), und hinter dem Stichwort ist das Feld duenner
    const px = await pg.evaluate(() => { const c = document.querySelector('.pk-cv'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let white = 0, hi = 0, blue = 0; for (let i = 0; i < d.length; i += 4) { if (d[i + 3] < 200) continue; if (d[i] > 235 && d[i + 1] > 235 && d[i + 2] > 235) white++; else if (d[i] > 150 && d[i + 2] > 230) hi++; else if (d[i + 2] > 200 && d[i] < 90) blue++ } return { white, hi, blue } })
    const bg = await pg.evaluate(() => getComputedStyle(document.querySelector('.pk-bg')).backgroundImage)
    check('Runde 4: Symbole satt blau ohne weißen Kern, mit hellem Quadrat; Grund am Rand fast schwarz (#010104)', px.white < 300 && px.hi > 1500 && px.blue > 20 * px.hi / 4 && /rgb\(1, 1, 4\)/.test(bg), `${JSON.stringify(px)}, ${bg.slice(0, 100)}`)
    const mid = await pg.evaluate(() => { const c = document.querySelector('.pk-cv'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data, band = (a, b) => { let n = 0, s = 0; for (let y = a; y < b; y += 2) for (let x = 0; x < c.width; x += 2) { s += d[(y * c.width + x) * 4 + 3]; n++ } return s / n }; return [band(880, 1030), band(1300, 1450)] })
    check('Runde 4: hinter dem Stichwort (y 880 bis 1030) höchstens 75 % so dicht wie weiter unten', mid[0] < 0.75 * mid[1], mid.map(x => x.toFixed(1)).join(' / '))
  } finally { await studio.close() }
}
await fails('"reise" mit "phoneUi" bricht ab', reiseScript({ phoneUi: 'lock' }), /"phoneUi" leer lassen/)
await fails('"reise" mit Stammkunde bricht ab', reiseScript({ walker: true }), /ohne Stammkunden und Herz/)
await fails('"reise": Anker in falscher Reihenfolge brechen ab', reiseScript({}, { ...A, back: 3.0 }), /Reihenfolge/)

console.log(failed ? `\n${failed} Prüfung(en) gescheitert` : '\nAlle Prüfungen bestanden')
process.exit(failed ? 1 : 0)
