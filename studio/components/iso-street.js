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
//
// ================================================================================================ Schriftzug
// Seit dem 19.11.2026 (Nachbau "zwei Cafés, eine Straße", auf Wunsch des Betreibers) kann das Duell den Namen
// der Marke ueber der Kreuzung aufleuchten lassen: eine Textzeile mit "role": "name" (meist "Stampit.") steht
// dann nicht oben als Tafel, sondern leuchtet auf ihr erstes Wort (Anker "name") als lila Leuchtschrift mit
// dem Stempel-Logo im Streifen zwischen Textzeilen und Schildern auf, und die Kreuzung darunter bekommt einen
// lila Schein. Warum so und nicht als Tafel oben: im Vorbild steht der Name gross ueber der Strasse und oben
// gerade nichts; eine Tafel "Stampit." oben hiesse, der Name stuende im Textbereich wie jedes andere Wort.
// Wie die Blase in "nah" hat der Schriftzug eine feste Groesse im BILD (sonst waere er bei "push" am Anfang
// winzig) und steht physisch vor der Stadt (60 % des Wegs zur Kreuzung), damit kein Haus ihn verdeckt. Er
// zuendet wie eine Neonroehre (zweimal Flackern, dann an) und bleibt bis zum Ende des Teils an. Ohne Textzeile
// mit "role": "name" bleibt das Duell Pixel fuer Pixel, wie es war (tools/test_3d_iso_street_name.mjs).
//
// ================================================================================================ Fassung 2 des Nachbaus
// Seit dem 19.11.2026 (abends) hat das Duell vier Schalter, die das Vorbild "zwei Cafés" genauer treffen; alle sind
// aus, solange das Skript sie nicht setzt, und das Bild bleibt dann Pixel fuer Pixel, wie es war:
// - "camera": "descent" sinkt von hoch ueber beiden Laeden, schwenkt auf den Anker "pan" auf den eigenen Laden und
//   faehrt nah und tiefer an seine Front (im Vorbild 0 bis 9 s, eine einzige Fahrt ohne Schnitt); "front" steht
//   schraeg hoch ueber dem eigenen Laden, der links im Bild bleibt (rechts ist Platz fuer das flache Handy, Vorbild
//   15,5 bis 19,6 s); "top" steht fast senkrecht ueber beiden Laeden und treibt kaum; "kran" faehrt von der Front
//   des Ladens gegenueber in 2,4 s nach oben, bis fast senkrecht ueber beide (Vorbild 27,6 bis 30 s), und treibt
//   dann wie "top".
// - "phoneUi": "lock" (Sperrbildschirm mit der Mitteilung der Karte, C1) oder "message" (der Laden schreibt eine
//   Nachricht, sie kommt als Mitteilung der Karte bei Leuten auf der Strasse an, C3), beide aus engine/phone-ui.js.
// - "tags": kleine dunkle Schildchen ("CAFÉ 1", "CAFÉ 2") mit einem Punkt in der Ladenfarbe ueber den Laeden.
// - "boards": zwei gleiche Kreidetafeln mit einem Symbol springen ueber beiden Laeden auf, Zeilen mit Preisen
//   zeichnen sich darauf ("gleicher Kaffee, gleiche Preise").
// - "crowd" bis 12: die Menge vor dem vollen Laden (im Vorbild ein Dutzend Figuren im blauen Licht).
// Schildchen und Tafeln sind HTML ueber der Leinwand, an die Stelle gesetzt, die die Kamera fuer den Punkt ueber dem
// Laden ausrechnet (wie die Pruefkaesten): scharf, billig, und jedes Bild haengt nur an t. Sie sind Schmuck und
// tragen keinen Pruefkasten (die Schilder der Laeden tragen weiter ihre).
//
// ================================================================================================ Fassung 3: "camera": "reise"
// Seit dem 20.11.2026. Das Review von Fassung 2 (6 von 10) fand: sechs Ueberblendungen statt drei, Kamerawechsel bis 0,5 s
// neben den Sekunden des Vorbilds, ein Dach, das per Blende in einen nackten Kasten im Schwarzen wechselte, und einen
// Brunnenplatz, der das Bild als "unsere Welt" verriet. "reise" erzaehlt deshalb das ganze Vorbild in EINER Einstellung,
// ohne Schnitt, wie dort: Sinkflug, Schwenk aufs volle Café, heran an die Front, Dach und Front heben ab (der Laden ist
// hohl, kit.shop hollow), Drift ueber dem vollen Raum mit flachem Handy (Wallet), zurueck auf die Strasse (Deckel wieder
// drauf, Sperrbildschirm), Fenster mit der Nachricht (die einzige Blende im Teil, phone-ui "message"), schnelle Fahrt zum
// leeren Café, dessen Dach abhebt (Korb mit Papierkarte und E-Mail), Kran hinauf bis fast senkrecht, der Name. Jede
// Bewegung haengt an einem Anker (Vorgabe: die Sekunde im Vorbild ab Anfang des Teils; im Skript an Woertern), damit sie
// mit der Aufnahme mitwandert. Dazu, nur mit "reise": groessere Laeden (SHOP_REISE), kein Brunnenplatz (dort stehen
// Haeuser), Verkehr (roter Bus, Autos mit Scheinwerfern, reine Funktion von t), kleine graue Figuren statt bunter.
// Die anderen Kamerawege und die Vorgaben bleiben Pixel fuer Pixel, wie sie waren (tools/test_3d_nachbau_v3.mjs).
//
// Runde 2 nach dem Review (22.11.2026), alles nur mit "reise": die Strassen lagen als schraeges X im Bild und die Fronten im V,
// weil der eigene Laden suedoestlich mit der Front nach Westen stand. Im Vorbild stehen beide Cafés nebeneinander an derselben
// Ost-West-Strasse, beide Fronten nach Sueden zur Kamera, die Nord-Sued-Strasse laeuft gerade durch das Bild. Deshalb stehen mit
// "reise" beide Laeden im Norden (lots), der hohle Laden ist jeweils zur Kreuzung hin offen (in den eigenen Raum schaut die Kamera
// von Suedwesten, in den gegenueber von Suedosten wie im Vorbild), die Kamera ist in den Ansichten von oben rund doppelt so weit weg
// (die Cafés waren doppelt so gross wie im Vorbild), Daecher fast schwarz (eine unbeleuchtete Platte je Dach) bei fast neutralem
// Himmelslicht (kit.nightLights "sky"), und mehrere Zeiten am Vorbild nachgestellt (Wallet, Deckel, Sperrbildschirm, Name, Kran).
// Ein Skript mit "ours": "left" bekommt das Spiegelbild (sg in PATH.reise).
//
// Runde 3 nach dem Review, alles nur mit "reise": die Stadt war ein dichter Teppich kleiner Haeuser mit rund 156 Laternen auf jeder Strasse
// und zwischen den Cafés nur eine Gasse; im Vorbild wenige grosse, fast schwarze Bloecke und EINE breite, beleuchtete Allee zwischen den
// Cafés. Jetzt: Allee (AVE_REISE je Seite), 2 x 2 Massen je Block, rund 30 Laternen nur an Allee und Strasse vor den Cafés, geparkte Autos
// an den Bordsteinen der Allee. Kamera am Fluss des Vorbilds nachgestellt (Wege 'soft', 'reise', 'kran' in camSet), Sicht von oben flacher
// und fast gerade von Sueden, niedrige Bruestung am vollen Café (kit.shop hollow.parapet), Korb ohne dunklen Mantel, leerer Raum gedeckter.
import { ICONS } from '../engine/icons.js'

// Kamerawege im Duell (Fassung 2 und 3, siehe Kopf); "standard" ist der vermessene Ausschnitt von vorher
const CAMERAS = ['standard', 'descent', 'front', 'top', 'kran', 'reise']
// "reise": Laden groesser (im Vorbild ist der Raum etwa zehn Figuren breit; in 5,6 m stand ein Gast so breit wie der
// halbe Raum) und niedriger (zwei Geschosse statt drei, wie die Stadt in "neon")
const SHOP_REISE = { w: 9.6, d: 8.4, h: 8.2, door: 1.25 }
// "reise" (Review Fassung 3, Runde 3): so viel (m) ist die Nord-Sued-Strasse zwischen den beiden Cafés auf jeder Seite breiter
// (Allee). Im Vorbild liegen zwischen den Fronten rund 1,4 Café-Breiten (32 % der Bildbreite) mit Zebrastreifen, geparkten Autos
// und Laternen paarweise; bei uns waren es 6,3 m gegen ein 9,6 m breites Café (13 %), die Strasse las sich als Gasse.
const AVE_REISE = 4
// Anker von "reise" mit ihrer Vorgabe: die Sekunde im Vorbild, gerechnet ab Anfang des Teils (taktkarte.md, look.md)
const REISE = [
  ['pan', 5.2, 'Schneller Schwenk von beiden Läden auf den eigenen (0,5 s), danach heran und tiefer an seine Front'],
  ['roof', 9.1, 'Front, Seitenwand und Obergeschoss des eigenen Ladens heben als ein Stück ab (0,6 s), die Kamera fährt weiter über den vollen Raum'],
  ['wallet', 11.3, 'Flaches Handy schiebt sich rechts herein, im Scanner der QR-Code'],
  ['walletAdd', 11.6, 'Blatt mit der Karte und "Zu Apple Wallet hinzufügen"'],
  ['walletCard', 12.5, 'Die Karte liegt in der Wallet'],
  ['walletNoApp', 14.5, 'Links springt das durchgestrichene Download-Zeichen auf'],
  ['back', 15.5, 'Zurück nach oben auf die Straße (weich von 0,3 s davor bis 1,1 s danach, wie im Vorbild), der Deckel senkt sich wieder, das Handy mit der Wallet blendet aus'],
  ['lock', 16.2, 'Schwarzes Handy schiebt sich rechts herein, der Kunde auf der Straße leuchtet auf'],
  ['lockNotify', 16.8, 'Sperrbildschirm mit der Mitteilung der Karte (C1), Linie vom Kunden zum Handy'],
  ['msg', 19.7, 'Weiche Blende: Straße dunkelt ab, das Fenster des Ladens kommt (das Handy ist dann schon weg); dahinter steigt die Kamera fast senkrecht'],
  ['msgType', 20.0, 'Die Nachricht tippt sich'],
  ['msgSend', 21.45, '"Senden" wird "Gesendet"'],
  ['msgOut', 21.7, 'Das Fenster geht, über Leuten auf der Straße springen die Mitteilungen auf'],
  ['travel', 22.6, 'Fahrt zum Laden gegenüber und ohne Halt hinein in seinen Raum (weich ab 0,25 s davor, am schnellsten rund 0,8 s danach, steht nach 2,6 s); die Mitteilungen über der Straße gehen 0,4 s danach'],
  ['roof2', 23.5, 'Dessen Deckel hebt ab: der leere, warme Raum'],
  ['trash', 24.5, 'Der Drahtkorb steigt vorn im leeren Raum auf'],
  ['trashCard', 25.0, 'Die Papier-Stempelkarte erscheint über dem Korb'],
  ['trashMail', 25.5, 'Die E-Mail erscheint daneben'],
  ['trashDrop', 26.7, 'Karte und E-Mail fallen in den Korb (0,5 s)'],
  ['kran', 27.6, 'Kran hinauf bis fast senkrecht über beide Läden (2,4 s), der Deckel gegenüber senkt sich, die Schildchen kommen wieder']
]

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
// Schriftzug (Kopf der Datei): welche Textzeile ihn traegt, und wo er im Bild steht. NAME_BOX in Bildpunkten:
// Oberkante 612 (die Textzeilen enden mit Luft bei 600, wie bei der Blase in "nah"), Unterkante 842 (das
// oberste Schild beginnt im Duell bei rund 925), links und rechts 150 und 850 (Knopfspalte ab 950, und das Bild
// ist um FRAME.dx nach links geschoben, daher die Mitte bei 500 statt 540)
const nameIndex = caps => (caps || []).findIndex(c => c && c.role === 'name')
const NAME_BOX = { cx: 500, top: 612, w: 700, h: 230 }
// "look": "neon": groesser wie im Vorbild (dort rund 3/4 der Bildbreite); mit "camera": "top" oder "kran" stehen die
// Laeden tiefer im Bild (ab rund y 950), der Schriftzug darueber ueberdeckt ihre Schilder also nicht
const NAME_BOX_NEON = { cx: 520, top: 590, w: 860, h: 290 }
// "neon": so lange (s) steht der Name voll, danach blendet er in 0,3 s aus (Vorbild: an bei 30,2, aus bis 31,2 s)
const NAME_ON_NEON = 0.7
// "reise" (Review Fassung 3, Runde 1): der Name stand halb so gross wie im Vorbild, weiss, mit Logo-Kachel und zu hoch (Mitte
// y 740). Im Vorbild steht "Tappi" ohne Zeichen davor, blau #8AA2FC mit Schein #1230A8, rund drei Viertel der Bildbreite
// breit, Mitte bei y 900 ueber beiden Cafés. Rechts endet die Flaeche bei x 950 (Knopfspalte von TikTok).
// "reise": der Deckel gegenueber senkt sich erst so lange nach "kran" (s). Vorher klappte er sofort zu, und das erste Bild
// des Krans war die geschlossene Fassade aus der Naehe; im Vorbild steigt die Kamera und der Raum ist dabei noch offen.
const KRAN_LID = 0.35
// "reise": Tafeln mit Tasse 25 % groesser (rund 290 x 330 px statt 230 x 262; im Vorbild rund 270 x 340), Oberkante weiter nie
// ueber y 470 (Review Fassung 3, Runde 1)
const BOARD_REISE = 1.25
const NAME_BOX_REISE = { cx: 515, top: 710, w: 870, h: 380 }
// "reise" (Review Fassung 3, Runde 2): der Name stand 0,2 s zu kurz (aus ab 31,1 s, im Vorbild 31,2 bis 31,4 s). Eigener Wert, damit
// "neon" ohne "reise" bei NAME_ON_NEON bleibt
const NAME_ON_REISE = 0.9
// "reise", Runde 2: im Vorbild bleibt das Handy mit der Wallet bis 15,5 s ganz da und blendet bis 15,85 s aus; die Kamera faehrt ab 15,5 s
// zurueck, der Raum ist dabei noch offen, und das Obergeschoss senkt sich erst bei 16,05 bis 16,3 s. Bei uns blendete die Wallet schon
// ab 15,2 s aus und der Deckel war um 15,8 s zu. Versatz (s) nach "back" fuer das Ende der Wallet und das Senken des eigenen Deckels.
const WALLET_OUT = 0.35, OUR_LID_DOWN = 0.5
// "reise", Runde 2: so hoch (m) hebt der Deckel ab. Mit 26 m stand er beim Ausblenden noch halb durchsichtig ueber Raum und Textzeile
// (9,4 bis 9,5 s); im Vorbild steigt das Obergeschoss als fester Block aus dem oberen Bildrand
const LID_LIFT = 48, LID_UP = 0.4
// "reise", Runde 2: Schildchen 25 % groesser (im Vorbild rund 142 px breit bei 2,5 s, unsere 115 px)
const TAG_REISE = 1.25
// "reise", Runde 4: Bildverschiebung beim Sperrbildschirm (px nach links), so steht das Café links neben dem Handy
const LOCK_OX = 80

export default {
  title: 'Zwei Läden gegenüber in 3D: Kreuzung bei Nacht, Stammkunde geht rüber',
  use: 'Isometrische Nachtszene in 3D: der eigene Laden und der Laden gegenüber an einer Kreuzung, beide Fronten zueinander. Über dem eigenen Laden zerbricht ein Herz, der Stammkunde geht über die Kreuzung und verschwindet gegenüber durch die Tür, die Ladenglocke schwingt. Die Kamera fährt langsam heran und dreht sich ein paar Grad. Für "Dein Stammkunde ... gegenüber", wenn es nach den großen Mitbewerbern aussehen soll. Mit "mode": "nah" dieselbe Kreuzung für C1: ein Lichtring um den eigenen Laden, ein Kunde betritt ihn auf der anderen Seite der Kreuzung, und über ihm springt aus seinem Handy der Sperrbildschirm mit "Noch 2 Stempel bis: Gratis-Döner"; der 3D-Ersatz für shop-map und shop-street. Im Duell kann eine Textzeile mit "role": "name" (etwa "Stampit.") statt oben als Tafel als lila Leuchtschrift über der Kreuzung aufleuchten (Anker "name"). Rechnet etwa 1,3 s je Bild (ohne Grafikkarte), also deutlich länger als die 2D-Bausteine.',
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
    after: { default: true, doc: 'Schlussbild nach "enter": der Laden, den er verlassen hat, wird dunkler, der andere leuchtet auf ("nah": nur der eigene leuchtet auf). false, wenn die Szene gleich danach endet' },
    crowd: { default: 0, doc: 'Nur Duell: so viele Gäste (0 bis 12) stehen vor dem eigenen Laden, drei in einer Schlange zur Tür, die übrigen in einer Gruppe daneben, ab 7 auch auf dem Gehweg und an der Bordsteinkante davor, und unterhalten sich. Für "bei uns ist Betrieb"' },
    camera: { default: 'standard', doc: 'Nur Duell: der Kameraweg. "standard" (langsam heran, ein paar Grad gedreht; "push" und "orbit" gelten). "descent": hoch über beiden Läden sinkt sie langsam, auf den Anker "pan" schwenkt sie auf den eigenen Laden und fährt nah und tiefer an seine Front. "front": schräg hoch über dem eigenen Laden, der links im Bild steht (rechts Platz für "phoneUi": "lock"). "top": fast senkrecht über beiden Läden, treibt kaum. "kran": von der Front des Ladens gegenüber in 2,4 s hinauf bis fast senkrecht über beide, dann wie "top". "reise" (Fassung 3): die ganze Geschichte des Vorbilds "zwei Cafés" in einer Einstellung ohne Schnitt: Sinkflug, Schwenk, heran, Dach des eigenen Ladens hebt ab (voller Raum, flaches Handy mit Wallet), zurück auf die Straße (Sperrbildschirm), Fenster mit "message", Fahrt zum Laden gegenüber, dessen Dach abhebt (leerer Raum, Korb mit Papierkarte und E-Mail), Kran hinauf, Name. Größere hohle Läden, Verkehr, kein Brunnenplatz, graue Figuren; Anker siehe Liste. "phoneUi" bleibt dabei leer (die drei Handybilder gehören zu "reise")' },
    tags: { default: '', doc: 'Nur Duell: kleine Schildchen über den Läden, "eigener,gegenüber", z. B. "CAFÉ 2,CAFÉ 1" (je höchstens 12 Zeichen), mit einem Punkt in der Ladenfarbe. Springen auf den Anker "tags" auf; mit "camera": "descent" verschwinden sie beim Schwenk. Leer = keine' },
    phoneUi: { default: '', doc: 'Nur Duell: "lock" (C1): rechts schiebt sich ein flaches Handy herein (Anker "ui"), auf "uiNotify" wacht der Sperrbildschirm mit der Mitteilung der Karte auf ("Noch {left} Stempel bis: {reward}"), eine gestrichelte Linie führt von einem leuchtenden Punkt auf der Straße (dem Kunden, gut 10 m von der Tür) zum Handy. "message" (C3): ein Fenster des eigenen Ladens über der abgedunkelten Straße (Anker "ui"), die Nachricht aus "message" tippt sich ("uiType"), "Senden" wird "Gesendet" ("uiSend"), das Fenster geht ("uiOut"), und über Leuten auf der Straße springen Mitteilungen der Karte mit dieser Nachricht auf. Leer = keins' },
    message: { default: 'Frischer Kuchen ist da!', doc: 'Nur "phoneUi": "message": die Nachricht des Ladens (1 bis 60 Zeichen; nie "SMS" oder "WhatsApp", PRODUKT.md N9)' },
    boards: { default: '', doc: 'Nur Duell: über beiden Läden springt je eine gleiche dunkle Tafel mit diesem Symbol auf (cup, bread, scissors, star, heart, check, kebab), Anker "boards"; auf "lines" zeichnen sich drei Zeilen mit Preisen darauf, auf "boardsOut" verschwinden beide. Für "gleicher Kaffee, gleiche Preise". Leer = keine' },
    dark: { default: 0, doc: 'Nur Duell: wie viel dunkler der gedimmte Laden wird (0 bis 1, zusätzlich zu "after"). 1 = Schaufenster, Tür und Schild fast aus, kein Licht davor: der leere Laden. Mit Stammkunde gilt das für den Laden, den er verlassen hat, ab "enter"; ohne ("walker": false) für den Laden gegenüber, von Anfang an (der eigene leuchtet dann)' },
    tones: { default: true, doc: 'Eigene Töne (Duell: thud beim Zerbrechen, ding an der Tür; "nah": ding und pop, wenn sich die Karte meldet, chime an der Tür). false, wenn das Skript Klänge aus der Bibliothek setzt' },
    mode: { default: 'duell', doc: '"duell": zwei Läden, Herz, Stammkunde geht rüber (wie bisher). "nah": C1, Lichtring um den eigenen Laden, ein Kunde betritt ihn auf der anderen Seite der Kreuzung, über ihm springt aus seinem Handy der Sperrbildschirm mit "Noch {left} Stempel bis: {reward}" (Anker "walk", "near", "turn", "enter"). In "nah" gibt es kein Herz; "heart", "walker", "back", "from" gelten nur in "duell"' },
    frame: { default: 'laden', doc: 'Nur "nah": "laden" = derselbe Ausschnitt wie im Duell (beide Läden, Kreuzung, der Ring links angeschnitten). "stadt" = weiter weg und höher: der ganze Ring, beide Läden und mehr Stadt, für "das Handy macht das von selbst" (PRODUKT.md C1: "ohne dass du etwas tust"). Nie dazu sagen, der Laden sehe nicht, wo jemand ist: das ist nicht belegt (N2)' },
    then: { default: 'weiter', doc: 'Nur "nah": was der Kunde nach der Benachrichtigung tut. "weiter": geht noch ein paar Schritte und bleibt mit dem Handy stehen. "dreht": bleibt stehen, dreht sich zur Tür und geht auf sie zu (Anker "turn"). "rein": dazu geht er hinein, die Glocke klingelt, der Laden leuchtet auf (Anker "turn" und "enter")' },
    reward: { default: 'Gratis-Döner', doc: 'Nur "nah" und "phoneUi": "lock": die Belohnung, kurz (höchstens etwa 16 Zeichen), steht in der Benachrichtigung: "Noch 2 Stempel bis: Gratis-Döner"' },
    left: { default: 2, doc: 'Nur "nah" und "phoneUi": "lock": wie viele Stempel noch fehlen (1 bis 20). 0 = die Karte ist voll, dann steht dort "{reward} wartet auf dich" (C1)' },
    clock: { default: '18:42', doc: 'Nur "nah" und "phoneUi": "lock": Uhrzeit oben auf dem Sperrbildschirm' },
    date: { default: '', doc: 'Nur "phoneUi": "lock": Datumszeile über der Uhr (höchstens etwa 24 Zeichen), leer = keine' }
  },
  captions: { min: 1 },
  anchors: (p, caps) => p.mode === 'nah' ? {
    walk: { at: 'start', offset: 0, doc: 'Der Kunde geht los, auf dem Gehweg am Platz auf der anderen Seite der Kreuzung (im Bild unten rechts, mit "ours": "right" unten links), noch außerhalb des Rings' },
    near: { cap: 0, word: -1, doc: 'Er betritt den Ring: sein Handy leuchtet, die Blase mit dem Sperrbildschirm springt heraus (Töne: ding, pop). Genau jetzt steht er auf dem Rand des Rings, gut 10 m von der Tür. Auf "Nähe" o. ä.' },
    ...(p.then === 'dreht' || p.then === 'rein' ? { turn: { at: 'end', offset: -1.7, doc: 'Er dreht sich zur Tür des eigenen Ladens und geht los (vorher bleibt er stehen, wenn er die Ecke schon erreicht hat). Mindestens 0,4 s nach "near"' } } : {}),
    ...(p.then === 'rein' ? { enter: { at: 'end', offset: -0.25, doc: 'Er steht auf der Schwelle und geht hinein, die Glocke schwingt (Ton: chime), der Laden leuchtet auf. Braucht Zeit nach "turn" (rund 9 m Weg, ab 5 m/s warnt der Bau): etwa 2 s' } } : {})
  } : {
    ...(p.heart && !p.back ? { crack: { cap: 0, word: -1, doc: 'Das Herz über dem eigenen Laden zerbricht (Ton: thud). Auf "betrogen" o. ä.' } } : {}),
    // Vorgaben ohne "offset": ein Anker im Skript erbt sonst den Versatz der Vorgabe (engine.js mischt beide)
    ...(p.camera === 'descent' ? { pan: { cap: 2, word: 0, doc: 'Nur "camera": "descent": hier beginnt der Schwenk vom Blick auf beide Läden zur Front des eigenen Ladens (bis zum Ende des Teils). Vorher sinkt die Kamera langsam. Vorgabe: erstes Wort der dritten Textzeile' } } : {}),
    // "reise": Vorgabe ist die Sekunde im Vorbild ab Anfang des Teils; im Skript an Woerter haengen
    ...(p.camera === 'reise' ? Object.fromEntries(REISE.map(([k, sec, doc]) => [k, { at: 'start', offset: sec, doc: 'Nur "camera": "reise": ' + doc + ' (Vorgabe: ' + String(sec).replace('.', ',') + ' s nach Anfang des Teils, wie im Vorbild; an ein Wort gehängt immer mit "offset", auch 0, sonst erbt er diesen Versatz)' }])) : {}),
    ...(p.phoneUi === 'lock' ? {
      ui: { cap: 0, word: 0, doc: 'Das flache Handy schiebt sich rechts ins Bild (Bildschirm noch schwarz), der Punkt auf der Straße leuchtet auf' },
      uiNotify: { cap: 0, word: -1, doc: 'Der Sperrbildschirm wacht mit der Mitteilung der Karte auf (Ton: ding), die Linie wächst vom Punkt zum Handy' }
    } : {}),
    ...(p.phoneUi === 'message' ? {
      ui: { cap: 0, word: 0, doc: 'Die Straße dunkelt ab, das Fenster des Ladens blendet ein' },
      uiType: { cap: 0, word: 1, doc: 'Die Nachricht beginnt sich zu tippen (bis kurz vor "uiSend")' },
      uiSend: { cap: 0, word: -3, doc: '"Senden" wird "Gesendet" (Ton: ok)' },
      uiOut: { cap: 0, word: -2, doc: 'Das Fenster geht, über Leuten auf der Straße springen die Mitteilungen auf (Ton: pop)' }
    } : {}),
    ...(p.tags ? { tags: { cap: 0, word: -1, doc: 'Die Schildchen über den Läden springen auf' } } : {}),
    ...(p.boards ? {
      boards: { cap: 1, word: 0, doc: 'Die beiden Tafeln mit dem Symbol springen über den Läden auf' },
      lines: { cap: 1, word: -1, doc: 'Auf beiden Tafeln zeichnen sich die Zeilen mit den Preisen, gleich schnell (rund 0,5 s)' },
      boardsOut: { cap: 2, word: 0, doc: 'Beide Tafeln verschwinden' }
    } : {}),
    // Nur mit einer Textzeile "role": "name" (Schriftzug, siehe Kopf der Datei)
    ...(nameIndex(caps) >= 0 ? { name: { cap: nameIndex(caps), word: 0, offset: -0.04, doc: 'Nur mit einer Textzeile "role": "name": der Schriftzug (ihr Text, z. B. "Stampit.") leuchtet über der Kreuzung auf wie eine Neonröhre, die Kreuzung bekommt einen lila Schein (Ton: thud). Vorgabe: ihr erstes Wort' } } : {}),
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
    if (!(Number.isInteger(p.crowd) && p.crowd >= 0 && p.crowd <= 12)) ctx.fail('"crowd" muss eine ganze Zahl von 0 bis 12 sein')
    if (!CAMERAS.includes(p.camera)) ctx.fail(`"camera" muss ${CAMERAS.map(x => `"${x}"`).join(', ')} sein`)
    if (nah && (p.camera !== 'standard' || p.tags || p.boards)) ctx.fail('"camera", "tags" und "boards" gibt es nur im Duell, nicht mit "mode": "nah"')
    const tagNames = p.tags ? String(p.tags).split(',').map(x => x.trim()) : null
    if (tagNames && (tagNames.length !== 2 || tagNames.some(x => !x || x.length > 12))) ctx.fail('"tags" braucht genau zwei Namen mit je 1 bis 12 Zeichen, durch Komma getrennt: "CAFÉ 2,CAFÉ 1" (erst der eigene Laden)')
    if (tagNames && tagNames.some(x => DASH.test(x))) ctx.fail('"tags" enthält einen Gedankenstrich. Normalen Bindestrich nehmen.')
    if (!['', 'lock', 'message'].includes(p.phoneUi)) ctx.fail('"phoneUi" muss "", "lock" oder "message" sein')
    const reise = p.camera === 'reise'
    if (reise && p.phoneUi) ctx.fail('"camera": "reise" bringt Wallet, Sperrbildschirm und Fenster selbst mit; "phoneUi" leer lassen')
    if (reise && (p.walker || p.heart)) ctx.fail('"camera": "reise" erzählt ohne Stammkunden und Herz: "walker": false und "heart": false setzen')
    if (nah && p.phoneUi) ctx.fail('"phoneUi" gibt es nur im Duell, nicht mit "mode": "nah"')
    if (p.boards && !ICONS[p.boards]) ctx.fail(`"boards": Symbol "${p.boards}" gibt es nicht. Erlaubt: ${Object.keys(ICONS).join(', ')}`)
    if (!(p.dark >= 0 && p.dark <= 1)) ctx.fail('"dark" muss zwischen 0 und 1 liegen')
    if (nah && (p.crowd || p.dark)) ctx.fail('"crowd" und "dark" gibt es nur im Duell, nicht mit "mode": "nah"')
    const nameCap = ctx.cap('name')
    if (nameCap && nah) ctx.fail('Eine Textzeile mit "role": "name" (Schriftzug über der Kreuzung) gibt es nur im Duell, nicht mit "mode": "nah": dort steht im selben Streifen die Blase mit dem Sperrbildschirm')
    // Das Herz schwebt im selben Streifen ueber dem eigenen Laden. Die Pruefung "ueberdeckung" saehe das nicht: sie
    // misst in der Ruhelage (Anfang des Teils), und dort ist der Schriftzug noch aus. Deshalb hier gleich ablehnen.
    if (nameCap && p.heart) ctx.fail('Schriftzug ("role": "name") und Herz stehen im selben Streifen über den Läden. "heart": false setzen')
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
    const { rng, clamp01, smooth, lerp, walkCycle } = K
    const kit = await K.createKit(ctx, { name: 'iso-street', prefix: 'is', ss: SS, exposure: 1.05, fog: [98, 172], calm: 760 })
    const { THREE, RoundedBoxGeometry, scene, col, lam, glow } = kit
    // Palette der Welt ("look" im Skript): PAL oder PAL_NEON. NE = die fast schwarze Nacht des Vorbilds
    const C = kit.PAL, NE = !!C.neon
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v3 = new THREE.Vector3(), s3 = new THREE.Vector3()

    // ---------------------------------------------------------------- Licht
    // Mond von hinten (Nordost), Himmel, schwache Aufhellung von der Kamera her (kit.nightLights)
    // "reise": doppelt so viel Himmelslicht wie "neon" (0,55): Daecher und Gehwege lagen gerendert bei Helligkeit 2 bis 8, im
    // Vorbild ist die Stadt dunkel, aber lesbar (Review Fassung 3, Runde 1). Ohne "reise" wie vorher.
    // Runde 2: Himmel und Mond fast neutral statt blau (sky #2C3354 und Mond #8FA0D8 aus PAL_NEON faerbten bei doppelter Staerke alle
    // flachen Daecher satt nachtblau: im unteren Drittel 26 bis 52 % "Navy"-Pixel gegen 0 bis 3 % im Vorbild), und etwas schwaecher
    const lights = kit.nightLights(reise ? { hemi: 0.75, sky: '#2E3038', moon: { intensity: 2.2, color: '#A9AFC4' }, fill: { intensity: 0.6 } } : undefined)

    // ---------------------------------------------------------------- Laeden: Lage
    // Links: Block nordwestlich der Kreuzung, Front nach Sueden (+z). Rechts: Block suedoestlich, Front nach
    // Westen (-x). Ein Laden wird im eigenen Koordinatensystem gebaut (Front zeigt nach +z, Ecke zur Kreuzung
    // bei x = 0, der Laden reicht nach -x und -z) und dann an seinen Platz gedreht (kit.shop).
    // Rechts ist der Laden gespiegelt: gedreht reichte er sonst in die Kreuzung hinein statt von ihr weg
    // (so stand er im ersten Versuch). "flip" legt Tuer und Glocke dort an das andere Ende der Front.
    // SH: Masse der Laeden. Mit "reise" groesser (SHOP_REISE, Kopf der Datei), sonst wie immer
    const SH = reise ? SHOP_REISE : SHOP
    const lots = { left: { pos: new THREE.Vector3(-B, CURB, -B), rot: 0, flip: false }, right: { pos: new THREE.Vector3(B, CURB, B + SH.w), rot: -Math.PI / 2, flip: true } }
    // "reise" (Review Fassung 3, Runde 2): im Vorbild stehen beide Cafés nebeneinander an DERSELBEN Ost-West-Strasse, beide Fronten
    // nach Sueden zur Kamera, getrennt nur von der Nord-Sued-Strasse mit dem Zebrastreifen; die Nord-Sued-Strasse laeuft mit
    // Laternen und geparkten Autos gerade durch die untere Bildhaelfte. Bei uns stand der eigene Laden suedoestlich mit der Front nach
    // Westen: die Strassen lagen als X schraeg im Bild, die Fronten im V, und vor den Laeden fuellten Daecher das untere Drittel.
    // Deshalb links (Nordwesten) und rechts (Nordosten), beide Front nach Sueden. Die stehenden Waende des hohlen Ladens (Rueckwand
    // und "Wand zur Ecke", kit.shop) liegen dabei aussen, die offene Seite zeigt zur Kreuzung wie im Vorbild: der rechte Laden ohne
    // flip mit seiner Ecke im Osten (man schaut von Suedwesten hinein, Theke an der Rueckwand links im Bild), der linke mit flip
    // und seiner Ecke im Westen (man schaut von Suedosten hinein, wie im Vorbild bei 23,5 bis 28 s).
    // Runde 3: beide um AV nach aussen, die Nord-Sued-Strasse dazwischen ist eine breite Allee (AVE_REISE, Kopf der Datei)
    const AV = reise ? AVE_REISE : 0
    if (reise) { lots.left = { pos: new THREE.Vector3(-B - AV, CURB, -B), rot: 0, flip: true }; lots.right = { pos: new THREE.Vector3(B + AV + SH.w, CURB, -B), rot: 0, flip: false } }
    const oursSide = p.ours, rivalSide = p.ours === 'left' ? 'right' : 'left'
    // Grundflaeche eines Ladens in Weltkoordinaten (fuer Bodentextur und Freihalten)
    const shopRect = side => reise ? (side === 'left' ? [-B - AV - SH.w, -B - AV, -B - SH.d, -B] : [B + AV, B + AV + SH.w, -B - SH.d, -B]) : side === 'left' ? [-B - SH.w, -B, -B - SH.d, -B] : [B, B + SH.d, B, B + SH.w]

    // ---------------------------------------------------------------- Stadt planen (vor dem Malen des Bodens)
    const R = rng(20261117)
    const N = 4 // Bloecke je Richtung um die Kreuzung
    const blocks = []
    for (let i = -N; i < N; i++) for (let j = -N; j < N; j++) {
      const b = { i, j, x0: i * P + RH, x1: (i + 1) * P - RH, z0: j * P + RH, z1: (j + 1) * P - RH }
      // "reise": die Bloecke beidseits der Allee (x = 0) um AV schmaler, ueber die ganze Laenge; der Streifen wird Fahrbahn
      if (reise && i === -1) b.x1 -= AV
      if (reise && i === 0) b.x0 += AV
      blocks.push(b)
    }
    const overlaps = (a, b) => a[1] > b[0] && a[0] < b[1] && a[3] > b[2] && a[2] < b[3]
    const keepFree = [shopRect('left'), shopRect('right')].map(([x0, x1, z0, z1]) => [x0 - 0.6, x1 + 0.6, z0 - 0.6, z1 + 0.6])
    // "reise": die Haeuser sueds der Ost-West-Strasse gegenueber beiden Laeden niedrig (siehe Stadt unten), damit die Kamera auf die
    // Fronten und in die Raeume sieht; frei bleibt nichts weiter
    const houses = [], windows = [], trees = [], roofBits = []
    // "reise": Haeuser rund 1,7-mal heller als PAL_NEON.city (gleich viele Farben, der Zufall bleibt derselbe). Gerendert lagen
    // Daecher und Waende bei #02020A bis #080810, im Vorbild bei #10131E bis #1A1D2B (Review Fassung 3, Runde 1)
    const CITY = reise ? CITY_REISE : C.city
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
      // "reise" (Runde 3): nur jedes fuenfte Dach mit Aufbau; die Kaesten machten aus den Bloecken einen kleinteiligen Teppich
      if (R() < (reise ? 0.2 : 0.65)) { const bw = 0.8 + R() * 1.4; roofBits.push([x + (R() - 0.5) * (w - bw - 0.6), CURB + h, z + (R() - 0.5) * (d - bw - 0.6), bw, 0.5 + R() * 0.9, bw * (0.6 + R() * 0.6)]) }
    }
    // "reise": Nachbarhaeuser direkt neben den Cafés (siehe unten), schon hier, damit die Massen der Bloecke um sie herum geschnitten werden
    // Runde 2 (beide Laeden im Norden, Front nach Sueden): je ein niedriges Haus aussen neben dem Laden und ein hoeheres dahinter
    // Runde 3: mit der Allee um AV nach aussen
    const nbReise = [[-B - AV - SH.w - 3.9, -B - 3.1, 7.2, 6.2, 6.6], [-B - AV - 3.1 - SH.w / 2, -B - SH.d - 3.9, 6.2, 7.2, 9.0], [B + AV + SH.w + 3.9, -B - 3.1, 7.2, 6.2, 6.6], [B + AV + 3.1 + SH.w / 2, -B - SH.d - 3.9, 6.2, 7.2, 9.0]]
    const freeReise = reise ? [...keepFree, ...nbReise.map(([x, z, w, d]) => [x - w / 2 - 0.3, x + w / 2 + 0.3, z - d / 2 - 0.3, z + d / 2 + 0.3])] : []
    for (const b of blocks) {
      // Platz vorn: dort stuende ein Haus vor der Kreuzung. Mit "reise" stehen dort niedrige Haeuser (ein Geschoss): der
      // Brunnenplatz war im Review das Merkmal "unsere Welt", und das Vorbild zeigt dort dichte dunkle Bloecke
      const plazaBlock = b.i === -1 && b.j === 0
      if (plazaBlock && !reise) continue
      // "reise": die beiden Bloecke suedlich der Ost-West-Strasse, gegenueber den Laeden, nur ein Geschoss (wie der Platz): mit zwei
      // bis drei Geschossen standen sie zwischen Kamera und Front bzw. Raum (Blick von Sueden, rund 42 Grad)
      const lowBlock = plazaBlock || (reise && b.i === 0 && b.j === 0)
      const bx0 = b.x0 + 1.4, bx1 = b.x1 - 1.4, bz0 = b.z0 + 1.4, bz1 = b.z1 - 1.4
      // Naehe zur Kamera (Suedwesten): dort niedrig bauen, damit nichts die Mitte verdeckt
      const nearCam = (-(b.x0 + b.x1) / 2 + (b.z0 + b.z1) / 2) / Math.SQRT2
      // "neon": die Stadt so niedrig wie die Laeden (hoechstens drei Geschosse), wie im Vorbild, wo die zwei Cafés
      // zwischen gleich hohen dunklen Bloecken stehen; sonst ragten im Sinkflug Tuerme ueber die Laeden
      const maxFloors = Math.min(NE ? 3 : 6, nearCam > 20 ? 2 : nearCam > 4 ? 3 : 6)
      // "reise" (Review Fassung 3, Runde 3): im Vorbild ist jeder Block eine grosse, fast schwarze Masse (zwei bis drei Café-Breiten),
      // bei uns standen 3 x 3 Haeuschen von rund 5 m je Block (halbe Café-Breite), ein kleinteiliger Teppich. Deshalb 2 x 2 Massen ohne
      // Hof, knapp aneinander (Fugen 0,2 bis 0,5 m) und verschieden hoch: der Block liest sich als ein Koerper mit Hoehenstufen. Wo ein
      // Café oder ein Nachbarhaus (nbReise) steht, wird die Masse auf das groesste freie Stueck zugeschnitten statt zu entfallen.
      // Runde 4 (Review: die 2 x 2 gleichen Massen lasen sich als flache schwarze Platten mit einem Fugenkreuz in der Mitte; im Vorbild ist
      // jeder Block EINE schieferblaue Masse): zwei Teile ohne Fuge, quer oder laengs geteilt, der zweite ein Geschoss hoeher oder
      // niedriger. So hat der Block eine einzige Stufe an einer Seite und kein Kreuz.
      if (reise) {
        const alongX = R() < 0.5, f = 0.35 + R() * 0.3, floors = 2 + Math.floor(R() * (maxFloors - 1)), cc = CITY[Math.floor(R() * CITY.length)]
        const xm = bx0 + (bx1 - bx0) * f, zm = bz0 + (bz1 - bz0) * f
        const parts = alongX ? [[bx0, xm, bz0, bz1], [xm, bx1, bz0, bz1]] : [[bx0, bx1, bz0, zm], [bx0, bx1, zm, bz1]]
        parts.forEach((r0, pi) => {
          const r = clipFree(r0, freeReise)
          const fl = pi === 0 ? floors : floors < maxFloors ? floors + 1 : floors - 1, h = lowBlock ? 3.6 : fl * 3 + 0.6
          if (r) addHouse((r[0] + r[1]) / 2, (r[2] + r[3]) / 2, r[1] - r[0], r[3] - r[2], h, cc)
        })
      }
      const nx = 3, nz = 3, cw = (bx1 - bx0) / nx, cd = (bz1 - bz0) / nz
      for (let a = 0; a < nx && !reise; a++) for (let c = 0; c < nz; c++) {
        if (a === 1 && c === 1) continue // Hof
        const w = cw - 0.2 - R() * 0.7, d = cd - 0.2 - R() * 0.7
        const x = bx0 + a * cw + cw / 2, z = bz0 + c * cd + cd / 2
        if (keepFree.some(k => overlaps([x - w / 2, x + w / 2, z - d / 2, z + d / 2], k))) continue
        const floors = 2 + Math.floor(R() * (maxFloors - 1)), h = lowBlock ? 3.6 : floors * 3 + 0.6
        addHouse(x, z, w, d, h, CITY[Math.floor(R() * CITY.length)])
      }
      // Baeume am Gehweg zur Kamera hin, locker
      for (let k = 0; k < 3; k++) if (R() < 0.55) {
        const tx = lerp(b.x0 + 1, b.x1 - 1, R()), tz = b.z1 - 0.7
        if (!keepFree.some(f => overlaps([tx - 1, tx + 1, tz - 1, tz + 1], f)) && !(Math.abs(tx) < B + 1 && Math.abs(tz) < B + 1)) trees.push([tx, tz, 0.55 + R() * 0.25, Math.floor(R() * 4)])
      }
    }
    // Nachbarhaeuser direkt neben den Laeden: hoeher, damit die Laeden in einer Strasse stehen und nicht frei
    // "reise": so niedrig wie die Stadt in "neon" (hoechstens drei Geschosse); 15,6 m ragten im Sinkflug ueber die Laeden
    // Das Haus suedlich des eigenen Ladens nur ein Geschoss: hoeher stand es beim Blick in den Raum vor dessen rechter Haelfte
    // Und das Haus westlich des Ladens gegenueber ebenfalls nur ein Geschoss: es stand beim Blick in den leeren Raum als schwarzer
    // Block vor dessen linker Wand (Review Fassung 3, Runde 1)
    const nbH = reise ? [3.6, 9.0, 3.6] : [12.6, 15.6, 12.6]
    const nb = [[-B - SH.w - 3.9, -B - 3.1, 7.2, 6.2, nbH[0]], [-B - 3.1, -B - SH.d - 3.9, 6.2, 7.2, nbH[1]], [B + 3.1, B + SH.w + 3.9, 6.2, 7.2, nbH[2]], [B + SH.d + 3.9, B + 3.1, 7.2, 6.2, nbH[1]]]
    // "reise": das Nachbarhaus neben dem eigenen Laden auf der Seite zur Kamera entfaellt (rechts nb[2], links das Spiegelbild
    // nb[0]), dazu die Haeuser des Blocks dahinter (keepFree oben): beim Blick in den vollen Raum standen sie als schwarzer Block
    // vor dessen vorderer Ecke (Review Fassung 3, Runde 1). Dort liegt jetzt ein leerer, beleuchteter Platz.
    // (nbReise steht oben vor den Bloecken)
    for (const [x, z, w, d, h] of reise ? nbReise : nb) addHouse(x, z, w, d, h, CITY[3])
    // Platz vorn (suedwestlicher Block): kleine Baeume, Baenke, Laternen
    // Mitte des Platzes: ein runder Brunnen; Baeume locker drumherum, nicht als Wand
    const FOUNT = [-12.4, 12.4]
    // Baeume auf den vier Rasenstuecken zwischen den Wegen (die Wege laufen ueber Kreuz zum Brunnen)
    const plaza = [[-6.2, 6.4], [-9.6, 5.9], [-17.3, 6.4], [-5.9, 9.8], [-6.4, 18.0], [-18.6, 11.4], [-17.6, 18.3], [-10.6, 19.4]]
    if (!reise) plaza.forEach(([x, z], k) => trees.push([x, z, 0.5 + ((k * 37) % 10) / 45, k % 4]))
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
    const plazaLamps = reise ? [] : [[FOUNT[0] + 1.0, FOUNT[1] - 4.4], [FOUNT[0] - 1.0, FOUNT[1] + 4.4], [FOUNT[0] + 4.4, FOUNT[1] + 1.0], [FOUNT[0] - 4.4, FOUNT[1] - 1.0]]
    lamps.push(...plazaLamps)
    // "reise" (Review Fassung 3, Runde 1): die untere Bildhaelfte war schwarz (Helligkeit 3 bis 14 gegen 16 bis 27 im Vorbild),
    // weil dort nur flache dunkle Daecher lagen und von elf Laternen fuenf leuchteten. Runde 1 setzte deshalb an jede Strasse bis
    // 48 m zwei Laternen je Block, alle mit Schein, und in jeden zweiten Kegel ein geparktes Auto.
    // Runde 3 (Review: so waren es rund 156 Laternen auf jeder Strasse; im Vorbild stehen 10 bis 12 Laternenkoepfe im Bild, jeder mit
    // grossem beigen Kegel, und nur die Allee zwischen den Cafés und die Strasse vor ihnen sind beleuchtet, die Nebenstrassen dunkel):
    // Laternen nur noch an der Allee (x = 0) und an der Ost-West-Strasse vor den Cafés (z = 0), paarweise gegenueber alle 12 m bis
    // rund 44 m, geparkte Autos an beiden Bordsteinen der Allee. Frei bleiben die Fronten der Laeden (Menge, Tuer) und die Kreuzungen.
    const parked = []
    // "reise", Runde 4: Laternen als { x, z (Mast), ax, az (Richtung des Arms zur Fahrbahn) }, siehe buildLampsReise
    const lampsR = []
    if (reise) {
      lamps.length = 0
      // Runde 4 (Review: 16 bis 18 Laternenkoepfe bei 33 s, im Vorbild 8; Paare auf der Allee 12 m auseinander, im Vorbild rund 0,30 der
      // Bildhoehe, also rund 30 m; dazu sieben Paare an der Strasse vor den Cafés). Gemessen am Vorbild (Standbilder 2,5 / 22 / 33 s, mit
      // unserer Kamera in Weltpunkte umgerechnet): auf der Allee ein Paar hinter den Cafés und eins rund 28 m suedlich, an der Strasse vor
      // den Cafés nur je eine Laterne aussen neben jedem Café (x = +-21) und eine gegenueber dem vollen. Das Paar steht bei z = -13, nicht
      // auf halber Tiefe der Cafés (-7,5 wie im Vorbild): dort stand die Laterne beim Blick in den vollen Raum (9,8 bis 15,5 s) mit
      // hellem Kopf und beigem See am linken Ende der Theke; im Vorbild ist der Raum nur blau und die Laterne ausserhalb des Bildes.
      const xp = RH + AV + 0.25, zp = RH + 0.25, sgO = oursSide === 'right' ? 1 : -1
      for (const s of LAMP_AVE_REISE) for (const sd of [-1, 1]) lampsR.push({ x: sd * xp, z: s, ax: -sd, az: 0 })
      for (const [x, sd] of [[-21, -1], [21, -1], [sgO * 17.5, 1]]) lampsR.push({ x, z: sd * zp, ax: 0, az: -sd })
      for (const l of lampsR) lamps.push([l.x, l.z])
      // geparkte Autos an beiden Bordsteinen der Allee (x = +-4,3), alle 7 m mit Luecken; das fahrende Auto nimmt die Spur x = -2,2
      // (buildTraffic), Bus und Autos der Ost-West-Strasse fahren quer durch die Kreuzung
      const xc = RH + AV - 1.1
      for (const seg of [-2, -1, 0, 1]) for (const k of [0, 1, 2]) for (const sd of [-1, 1]) {
        if ((k + (sd > 0 ? 1 : 0) + seg + 4) % 3 === 2) continue
        parked.push([sd * xc, seg * P + (seg < 0 ? P - RH - 3.6 - k * 7 : RH + 3.6 + k * 7), 0])
      }
    }

    // ---------------------------------------------------------------- Boden malen
    // Grundfarben, Bordsteinkanten und Kontaktschatten in die Farbtextur, Lichtkegel in die Leuchttextur.
    const map = kit.groundMap({ origin: GO, size: GS, px: GN }), gx = map.gx
    const shopGlow = { [oursSide]: C.poolOurs, [rivalSide]: C.poolRival }
    const groundTex = kit.canvasTex(GN, GN, g => {
      // Runde 4: Fahrbahn und Gehwege mit "reise" etwas blauer (siehe CITY_REISE)
      g.fillStyle = reise ? '#121726' : C.road; g.fillRect(0, 0, GN, GN)
      // Gehwege mit eckigen Ecken: die Platten darauf (slabs) sind eckig. Gemalt waren sie gerundet, und an
      // jeder Ecke stand die eckige Platte ueber den runden Rand hinaus.
      for (const b of blocks) {
        g.fillStyle = reise ? '#1C2134' : C.walk; g.fillRect(gx(b.x0), gx(b.z0), gx(b.x1) - gx(b.x0), gx(b.z1) - gx(b.z0))
        g.strokeStyle = C.curb; g.lineWidth = 0.2 * GN / GS; g.strokeRect(gx(b.x0 + 0.12), gx(b.z0 + 0.12), gx(b.x1) - gx(b.x0) - 0.24 * GN / GS, gx(b.z1) - gx(b.z0) - 0.24 * GN / GS)
      }
      // Platz: vier Rasenstuecke, dazwischen helle Wege ueber Kreuz und ein gepflasterter Ring um den Brunnen
      if (!reise) {
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
      // "neon": groessere, hellere Lichtkegel der Laternen (im Vorbild die hellsten Flaechen der Stadt nach den Laeden)
      // "reise": noch etwas groesser und heller (die Kegel tragen dort die untere Bildhaelfte, Review Fassung 3, Runde 1)
      // Runde 2: etwas schwaecher (0,62 statt 0,74); seit die Kamera die Nord-Sued-Strasse durch die untere Haelfte zeigt, war das Bild
      // oben ueber der Stadt heller als das Vorbild (untere Haelfte bei 29,5 s 21 gegen 14)
      // Runde 3: nur noch rund 30 Laternen (Allee und Strasse vor den Cafés), dafuer grosse, kraeftige Kegel wie im Vorbild
      // Runde 4: der See liegt unter dem Kopf (ueber der Fahrbahn) und ist quer zur Strasse 1,5-mal so breit wie laengs; die Seen
      // eines Paars fliessen in der Mitte zu EINEM beigen Band ueber die Allee wie im Vorbild (dort #54463A in der Mitte des Bands).
      // Vorher lag unter jedem Mast ein runder Fleck auf dem Bordstein, die Strasse las sich wie gepunktet.
      if (reise) for (const l of lampsR) bandSpot(g, map, l.x + l.ax * LAMP_ARM, l.z + l.az * LAMP_ARM, l.ax !== 0, C.poolLamp, 0.6)
      else for (const [x, z] of lamps) spot(x, z, NE ? 4.4 : 3.6, C.poolLamp, NE ? 0.62 : 0.4)
      for (const [x, z] of plazaLamps) spot(x, z, 3.2, '255,196,130', 0.22)
      // Schein des Brunnens auf dem Pflaster (Lila wie das Wasser; "neon": schwach blau)
      if (!reise) spot(FOUNT[0], FOUNT[1], 4.6, NE ? '40,70,190' : '150,138,255', NE ? 0.12 : 0.24)
      // Licht aus Schaufenster und Tuer faellt vor dem Laden auf den Gehweg. "neon": wie im Vorbild ein grosser,
      // satter Lichtsee vor dem vollen Laden (bis auf die Fahbahn), vor dem anderen ein kleinerer warmer
      for (const side of ['left', 'right']) {
        const big = NE && side === oursSide
        if (reise) {
          // Runde 2: beide Fronten bei z = -B nach Sueden; Lichtsee ueber die ganze (breite) Front verteilt, vor dem vollen Café bis
          // ueber die Fahrbahn wie im Vorbild
          const [x0, x1] = shopRect(side), xm = (x0 + x1) / 2
          for (const [x, z] of [[lerp(x0, x1, 0.28), -B + 1.2], [lerp(x0, x1, 0.72), -B + 1.3]]) spot(x, z, big ? 5.6 : 4.4, shopGlow[side], big ? 0.95 : 0.55)
          spot(xm, -B + (big ? 3.6 : 2.4), big ? 6.5 : 5.0, shopGlow[side], big ? 0.5 : 0.3)
          continue
        }
        const along = side === 'left' ? [[-B - 1.3, -B + 1.2], [-B - 3.8, -B + 1.3]] : [[B - 1.2, B + 1.3], [B - 1.3, B + 3.8]]
        for (const [x, z] of along) spot(x, z, NE ? (big ? 5.6 : 3.8) : 3.4, shopGlow[side], NE ? (big ? 0.95 : 0.55) : 0.42)
        if (big) { const [x, z] = side === 'left' ? [-B - 2.6, -B + 3.6] : [B - 3.6, B + 2.6]; spot(x, z, 6.5, shopGlow[side], 0.5) }
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
      stripes.push([k * P, s + 0.8, 0.14, 1.5, C.mark])
      // "reise": die Kreuzungen mit der Allee (x = 0) sind breiter; dort keine Mittelstriche der Ost-West-Strassen
      if (!(reise && Math.abs(s + 0.8) < RH + AV + 1.6)) stripes.push([s + 0.8, k * P, 1.5, 0.14, C.mark])
    }
    // "reise" (Runde 3): ueber die breite Allee 15 Streifen statt 5, die Zebras ueber die Ost-West-Strasse an ihren Rand gerueckt
    if (reise) {
      for (let k = -7; k <= 7; k++) { const o = k * (RH + AV - 0.45) / 7; stripes.push([o, -RH - 0.95, 0.4, 1.3, C.zebra], [o, RH + 0.95, 0.4, 1.3, C.zebra]) }
      for (let k = 0; k < 5; k++) { const o = (k - 2) * (RH - 0.45) / 2; stripes.push([-RH - AV - 0.95, o, 1.3, 0.4, C.zebra], [RH + AV + 0.95, o, 1.3, 0.4, C.zebra]) }
    }
    // Fuenf Streifen mittig auf der Fahrbahn, 0,25 m Abstand zum Bordstein. Vorher reichte der aeussere
    // Streifen 0,13 m unter die Gehwegplatte und endete dort zackig.
    for (let k = 0; k < 5 && !reise; k++) {
      const o = (k - 2) * (RH - 0.45) / 2
      stripes.push([o, -RH - 0.95, 0.4, 1.3, C.zebra], [o, RH + 0.95, 0.4, 1.3, C.zebra], [-RH - 0.95, o, 1.3, 0.4, C.zebra], [RH + 0.95, o, 1.3, 0.4, C.zebra])
    }
    const stripeMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.02, 1), map.worldMapped(lam('#FFFFFF', { emissive: '#FFFFFF', emissiveMap: glowTex })), stripes.length)
    stripes.forEach(([x, z, w, d, c], k) => { m4.compose(v3.set(x, 0.011, z), q.identity(), s3.set(w, 1, d)); stripeMesh.setMatrixAt(k, m4); stripeMesh.setColorAt(k, col(c)) })
    stripeMesh.receiveShadow = true; scene.add(stripeMesh)

    // ---------------------------------------------------------------- Stadt bauen (Baukasten: instanziert)
    // "reise": jedes vierte Fenster an (rund 22 % warm, 5 % kuehl) statt jedes zehnten: im Vorbild sind die Fassaden zur Kamera
    // hin deutlich belebt, bei uns lag die Stadt als schwarze Flaeche da. Nur die gezogene Zahl wird umgelegt (die Folge des
    // Zufalls bleibt, alle anderen Wege bauen genau wie vorher); windowTint: unter 0,1 warm, bis 0,13 kuehl, sonst aus.
    if (reise) for (const w of windows) w.on = w.on < 0.22 ? w.on * 0.45 : w.on < 0.27 ? 0.1 + (w.on - 0.22) * 0.5 : w.on
    kit.houses(houses, { y0: CURB })
    // "reise" (Runde 2): die flachen Daecher sind im Vorbild die dunkelsten Flaechen (#050913, #0B0609), bei uns waren sie nach den
    // Lichtkegeln die hellsten (#000828 bis #00072A, satt nachtblau vom Himmelslicht). Eine unbeleuchtete, fast schwarze Platte knapp
    // ueber jedem Dach dunkelt nur die Dachflaeche ab; die Waende behalten ihre Farbe und ihr Licht.
    if (reise) {
      // ohne Tonwertkurve: sonst wurde aus #0A0B10 ein fast schwarzes #000108 (gemessen); so steht die Farbe des Vorbilds im Bild
      // Runde 4: #070B18 statt #08090F (im Vorbild blauer, siehe CITY_REISE)
      const tops = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: '#070B18', toneMapped: false }), houses.length)
      q.setFromAxisAngle(v3.set(1, 0, 0), -Math.PI / 2)
      houses.forEach((h, k) => { m4.compose(v3.set(h.x, CURB + h.h + 0.02, h.z), q, s3.set(h.w - 0.2, h.d - 0.2, 1)); tops.setMatrixAt(k, m4) })
      tops.name = 'dachplatten'; scene.add(tops)
    }
    kit.roofs(roofBits, reise ? '#16171D' : undefined)
    // Runde 4: mit "reise" groessere Fenster, und die dunklen als schwaches Graublau sichtbar: im Vorbild stehen auf den Fassaden zur
    // Kamera ganze Fensterraster, bei uns lagen nur einzelne helle Quadrate auf schwarzen Waenden
    if (reise) buildWindowsReise(kit, windows)
    else kit.windows(windows)
    kit.trees(trees, { y0: CURB })
    // Nur die Laternen nahe der Kreuzung und auf dem Platz bekommen einen Schein (die anderen liegen im Dunst)
    // "reise": alle Laternen mit Schein (siehe oben, das Raster ersetzt die elf Laternen)
    if (reise) {
      buildLampsReise(kit, lampsR, CURB)
      // Runde 4: Ampel an der Ecke des vollen Cafés zur Allee, gelb an; im Vorbild steht sie dort beim Blick in den vollen Raum
      // (9,8 bis 15,5 s), an derselben Stelle stand bei uns eine Laterne mit beigem See
      const sgO = oursSide === 'right' ? 1 : -1
      buildTrafficLight(kit, sgO * (RH + AV + 0.45), -(RH + 0.45), CURB)
    }
    else kit.lamps(lamps, { y0: CURB, glowIf: k => k < (nah ? 4 : 5) || k >= lamps.length - plazaLamps.length })
    // Baenke auf dem Platz und drei geparkte Autos: Kleinkram, an dem man die Groesse abliest
    const props = new THREE.Group(); scene.add(props)
    if (!reise) for (const [x, z, r] of [[-9.2, 8.6, 0], [-14.8, 9.6, 0], [-8.6, 12.6, Math.PI / 2]]) kit.bench(props, x, z, r, { y0: CURB })
    // "reise": statt der drei Autos die geparkten aus dem Raster, in Farben, die im Laternenlicht als Auto lesbar sind (die
    // dunklen Wagen der Palette verschwanden, uebrig blieb der rote Leuchtstreifen als schwebender roter Strich, Review)
    if (reise) parked.forEach(([x, z, r], k) => dimTail(kit, kit.car(props, x, z, r, PARKED[k % PARKED.length])))
    else { kit.car(props, -17, 1.15, Math.PI / 2, C.cars[0]); kit.car(props, 1.15, -15.5, 0, C.cars[1]); kit.car(props, 15.5, -1.15, Math.PI / 2, C.cars[2]) }
    if (!reise) {
      // Brunnen: Becken mit hellem Rand, leuchtendes Wasser (Lila), schmale Saeule mit Schale und Wasserstrahl.
      // In der ersten Probe (breite Schale auf dicker Saeule, dunkles Wasser) las er sich wie ein Pilz auf
      // einer Scheibe; der Strahl und das helle Wasser sagen "Brunnen".
      const [fx, fz] = FOUNT
      // "neon": derselbe Brunnen in den gedeckten Farben der Nacht, sonst leuchtete er wie ein dritter Laden
      const FC = NE ? ['#2A2D3D', '#3A3E52', '#1A2A66', '#2E3142', '#2C48B0', '#8FA4FF', '#3C5CFF', '#2A44D0'] : ['#5A5490', '#7A73B4', '#7A6FDC', '#6A64A0', '#A79EFF', '#D9D3FF', '#B3AAFF', '#9C92FF']
      const rim = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.35, 0.55, 28), lam(FC[0])); rim.position.set(fx, CURB + 0.27, fz); rim.name = 'brunnen'; props.add(rim)
      const lip = new THREE.Mesh(new THREE.TorusGeometry(2.06, 0.15, 6, 36), lam(FC[1])); lip.rotation.x = -Math.PI / 2; lip.position.set(fx, CURB + 0.55, fz); props.add(lip)
      // Wasser knapp ueber dem Rand: der Deckel des Zylinders laege sonst darueber
      const water = new THREE.Mesh(new THREE.CylinderGeometry(1.92, 1.92, 0.04, 28), new THREE.MeshBasicMaterial({ color: FC[2] })); water.position.set(fx, CURB + 0.57, fz); props.add(water)
      const col1 = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.22, 1.2, 10), lam(FC[3])); col1.position.set(fx, CURB + 1.15, fz); props.add(col1)
      const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.3, 0.26, 18), lam(FC[3])); bowl.position.set(fx, CURB + 1.8, fz); props.add(bowl)
      const bowlWater = new THREE.Mesh(new THREE.CylinderGeometry(0.54, 0.54, 0.03, 18), new THREE.MeshBasicMaterial({ color: FC[4] })); bowlWater.position.set(fx, CURB + 1.94, fz); props.add(bowlWater)
      const jet = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.09, 0.95, 8), new THREE.MeshBasicMaterial({ color: FC[5] })); jet.position.set(fx, CURB + 2.4, fz); props.add(jet)
      glow(FC[6], 3.2, new THREE.Vector3(fx, CURB + 2.3, fz), NE ? 0.15 : 0.3)
      glow(FC[7], 5, new THREE.Vector3(fx, CURB + 0.8, fz), NE ? 0.07 : 0.13)
    }
    props.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true } })

    // ---------------------------------------------------------------- Laeden (die beiden Helden, kit.shop)
    await kit.fonts(p.shop + p.rival)
    const signs = []
    const S = {}
    // "reise": hohl (kit.shop hollow), innen in den Farben des Raums aus iso-shop ("kalt" das volle, "warm" das leere Café)
    // Runde 3: das volle Café behaelt beim Abheben eine niedrige dunkle Bruestung an Front und Seite (wie im Vorbild bei 9,8 bis 15 s)
    const holl = ours => reise ? { gf: 5, wt: 0.3, inner: ROOM_TONE[ours ? 'kalt' : 'warm'].wall, cap: ROOM_TONE[ours ? 'kalt' : 'warm'].cap, ...(ours ? { parapet: { h: 0.9, color: '#141A33', glow: '#1C2A70', k: 0.35 } } : {}) } : false
    S[oursSide] = await kit.shop({ name: p.shop, icon: p.icon, accent: p.accent, ours: true, ...lots[oursSide], size: SH, light: LIGHT, signs, hollow: holl(true) })
    S[rivalSide] = await kit.shop({ name: p.rival, icon: p.rivalIcon, accent: p.rivalAccent, ours: false, ...lots[rivalSide], size: SH, light: LIGHT, signs, hollow: holl(false) })
    const our = S[oursSide], riv = S[rivalSide]
    if (reise) { dressShopReise(kit, K, our, { full: true, accent: '#6F8BFF', SH }); dressShopReise(kit, K, riv, { full: false, accent: '#E8A060', SH, fadeSign: true }) }
    // "reise" (Runde 2): auch die Daecher der beiden Cafés fast schwarz wie im Vorbild (das helle Gesims lag sonst als hellste Flaeche
    // im Bild). Die Platte sitzt am Deckel und hebt mit ihm ab.
    if (reise) for (const s of [our, riv]) { const top = new THREE.Mesh(new THREE.PlaneGeometry(SH.w + 0.3, SH.d + 0.3), new THREE.MeshBasicMaterial({ color: '#0A0B11', toneMapped: false })); top.rotation.x = -Math.PI / 2; top.position.set(-SH.w / 2, SH.h + 0.27, -SH.d / 2); s.lid.add(top) }
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
    const chat = reise ? [] : [kit.person({ coat: '#8C6BC8', scale: 1.2, y0: CURB }), kit.person({ coat: '#C9786A', hair: '#5A3A2A', scale: 1.15, y0: CURB })]
    if (!reise) { chat[0].at(FOUNT[0] + 1.4, FOUNT[1] - 2.9, -2.2); chat[1].at(FOUNT[0] + 0.1, FOUNT[1] - 3.2, 1.2) }
    // Ab hier geht mode "nah" eigene Wege (Ring, Kunde, Blase, Kamera; siehe buildNah unten). Alles davor, die
    // ganze Stadt, ist in beiden Modi dieselbe.
    if (nah) { await buildNah({ ctx, p, K, kit, our, riv, oursSide, signs, bell, msg, smoke, chat }); return }
    // Gaeste vor dem eigenen Laden ("crowd"). Warum: im Nachbau "zwei Cafés" (19.11.2026) stand der Satz "nur bei
    // Mond ist Betrieb" ueber einer Strasse, auf der man den Betrieb nicht sah (eine 30 px kleine Figur und eine
    // hellere Front). Drei stehen in einer Schlange vor dem Schaufenster zur Tuer hin, die uebrigen als Gruppe
    // weiter aussen. Gemessen im Laden (a = Abstand von der Ecke entlang der Front, z = vor der Front): die
    // Schlange beginnt 1,2 m neben dem Weg des Stammkunden (a = 1,39), der Gehweg ist nur 1,25 m tief.
    const crowd = []
    if (p.crowd > 0) {
      // Ab dem siebten (seit 19.11.2026, Fassung 2): auf dem Gehweg vor der Ecke und an der Bordsteinkante, wie die
      // Menge im Vorbild; der Weg des Stammkunden (a = 1,39) bleibt frei, deshalb dort nur ab z = 1,9 (Fahrbahn)
      const SPOTS = [[2.6, 0.62, 'door'], [3.4, 0.6, 'door'], [4.2, 0.66, 'door'], [5.1, 0.42, 0.9], [5.4, 1.02, 2.6], [5.95, 0.62, -1.9],
        [0.45, 0.7, 2.4], [2.9, 1.9, 3.0], [4.5, 2.1, -0.5], [6.7, 1.2, 1.7], [7.3, 2.0, -2.4], [0.6, 2.3, -2.8]]
      const COATS = ['#5FA39B', '#C9786A', '#5B86D6', '#D9839F', '#E2AE4D', '#8C6BC8', '#7FA0C8', '#B86A5A', '#4E8A7E', '#C9A0D0', '#6A7FB0', '#D8B070'], HAIRS = ['#2A1A2E', '#5A3A2A', '#B9783A', '#18142A']
      const toDoor = our.flip ? -Math.PI / 2 : Math.PI / 2
      // "reise": kleinere Figuren in gedeckten Farben wie im Vorbild; die bunten Maentel lasen sich im Review als Spielfiguren unserer
      // alten Welt (Runde 1 machte sie grau, Runde 4 gedeckt bunt, siehe unten). Auf der breiten Front mit mehr Abstand.
      SPOTS.slice(0, p.crowd).forEach(([a, z, face], k) => {
        // Runde 4: gedeckt bunt mit Hautfarbe wie die Gaeste im Raum (ROOM_TONE.kalt.muted), so gross wie sie, Schattenscheibe schwach
        const RT = ROOM_TONE.kalt
        const f = kit.person(reise ? { coat: RT.muted[(k + 3) % RT.muted.length], legs: '#22242C', hair: RT.hair[k % RT.hair.length], skin: RT.skin[(k * 3 + 1) % RT.skin.length], scale: 0.85, y0: CURB } : { coat: COATS[k], hair: HAIRS[k % 4], scale: 1.15 + 0.05 * (k % 3), y0: CURB })
        if (reise) f.blob.material.opacity = 0.3
        const w = our.g.localToWorld(new THREE.Vector3(our.flip ? -SH.w + a * (reise ? 1.3 : 1) : -a * (reise ? 1.3 : 1), 0, z))
        f.at(w.x, w.z, our.rot + (face === 'door' ? toDoor : (our.flip ? -face : face)))
        crowd.push({ f, ph: k * 1.7, queue: face === 'door' })
      })
    }
    // "dark": zusaetzlich abdunkeln (k 0 bis 1), nach shine. Schaufenster und Tuerlicht fast aus, Schild matt,
    // kein Licht davor. Warum: im Nachbau war der verlassene Laden mit "after" nur gedimmt und im Schlussbild
    // noch warm erleuchtet; der Satz zum leeren Laden hatte kein Bild.
    // Tuerlicht immer neu setzen (auch bei k = 0): shine laesst es aus, und jedes Bild muss nur von t abhaengen,
    // auch wenn rueckwaerts gesprungen wird
    const darken = (s, k) => {
      s.doorMat.color.copy(s.doorBase).multiplyScalar(1 - 0.8 * k); s.paneMat.color.copy(s.paneBase).multiplyScalar(1 - 0.8 * k)
      if (!(k > 0)) return
      s.signMat.color.multiplyScalar(1 - 0.55 * k); s.winMat.color.multiplyScalar(1 - 0.88 * k)
      s.halo.material.opacity *= 1 - k; s.front.material.opacity *= 1 - k; s.light.intensity *= 1 - 0.85 * k
    }
    for (const s of [our, riv]) { s.doorBase = s.doorMat.color.clone(); s.paneBase = s.paneMat.color.clone() }
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
    // "camera": "descent", "front", "top", "kran" (Fassung 2, siehe Kopf). Eigene Kamera mit kuerzerer Nahgrenze
    // (am Ende von "descent" steht sie rund 60 m vor der Front). Jeder Weg ist eine Folge von Stellungen
    // { t, d (Abstand), az, el (Grad), at (Ziel 0 = Mitte zwischen den Laeden, 1 = vor dem eigenen Laden, -1 = vor dem
    // Laden gegenueber) }, zwischen denen die Kamera weich faehrt (an jeder Stellung kurz langsam, wie im Vorbild, wo
    // Schwenk und Heranfahren zwei Bewegungen sind). Zeiten und Winkel sind am Vorbild gemessen (look.md, Abschnitt 2).
    // Punkt vor einem Laden: 1,6 m vor der Mitte des Schildes, auf 2 m Hoehe (dort stehen die Gaeste im Licht)
    const before = shop => { const m = shop.signCorners.reduce((a, v) => a.add(v), new THREE.Vector3()).multiplyScalar(0.25); return m.addScaledVector(shop.at(1).sub(shop.at(0)).setY(0).normalize(), 1.6).setY(2.0) }
    let camSet = t => cam.set(t, camOpts)
    // Stellung der Kamera im zuletzt gestellten Bild (Abstand, Drehung, Hoehenwinkel zum Ziel; nur fuer Tests, null bei "standard")
    let camPose = () => null
    if (p.camera !== 'standard') {
      const cm = new THREE.PerspectiveCamera(22, K.W / K.H, 4, 900)
      kit.camera = cam.camera = cm
      const deg = THREE.MathUtils.degToRad, T0 = new THREE.Vector3(0, 1.6, 0), tg = new THREE.Vector3()
      const T1 = before(our), TR = before(riv)
      // Blickrichtung schraeg von vorn auf einen Laden: Front nach Westen (rechts) heisst Kamera im Westen (az 90),
      // Front nach Sueden (links) Kamera im Sueden (az 0); je 22 Grad zur Kreuzung hin, damit man die Ecke sieht
      const azOf = side => side === 'right' ? 68 : 22
      let pose = null
      camPose = () => pose
      const place = (dist, az, el, target) => {
        pose = { d: dist, az, el }
        const a = deg(az), e = deg(el)
        cm.position.set(target.x - dist * Math.cos(e) * Math.sin(a), target.y + dist * Math.sin(e), target.z + dist * Math.cos(e) * Math.cos(a))
        cm.lookAt(target)
        if (scene.fog) { scene.fog.near = dist + 30; scene.fog.far = dist + 160 }
        return a
      }
      const tPan = (p.camera === 'descent' || reise) ? ctx.at('pan') : null
      if (tPan != null && !(tPan > ctx.s + 0.5 && tPan < ctx.e - 1.2)) ctx.fail(`Anker "pan" muss mindestens 0,5 s nach dem Anfang und 1,2 s vor dem Ende des Teils liegen (jetzt ${(tPan - ctx.s).toFixed(2)} s nach dem Anfang, ${(ctx.e - tPan).toFixed(2)} s vor dem Ende)`)
      const S0 = ctx.s, E0 = ctx.e, aF = azOf(oursSide), aR = azOf(rivalSide)
      // Bildverschiebung je Weg [dx, dy] in Bildpunkten (positiv dx: Bild nach links; positiv dy: Bild nach unten)
      const OFF = { descent: [0, -220], front: [70, -240], top: [0, 120], kran: [0, 120], reise: [80, -140] }
      const TOPV = [{ d: 112, az: 42, el: 75, at: 0 }, { d: 106, az: 48, el: 73, at: 0 }]
      const PATH = {
        // Sinkflug (0 bis "pan"), schneller Schwenk zum eigenen Laden (0,55 s), dann heran und tiefer bis zum Ende
        descent: () => [{ t: S0, d: 98, az: 36, el: 64, at: 0 }, { t: tPan, d: 88, az: 43, el: 60, at: 0 },
          { t: tPan + 0.55, d: 90, az: (43 + aF) / 2, el: 57, at: 0.75 }, { t: E0, d: 92, az: aF - 16, el: 50, at: 1 }],
        front: () => [{ t: S0, d: 122, az: aF - 28, el: 55, at: 1 }, { t: E0, d: 114, az: aF - 20, el: 53, at: 1 }],
        top: () => [{ t: S0, ...TOPV[0] }, { t: E0, ...TOPV[1] }],
        // Kran: von der Front gegenueber (wie am Ende des Innenraums) in 2,4 s hinauf ueber beide, dann treiben
        kran: () => [{ t: S0, d: 62, az: aR + (rivalSide === 'left' ? 14 : -14), el: 40, at: -1 }, { t: Math.min(E0 - 0.5, S0 + 2.4), ...TOPV[0] }, { t: E0, ...TOPV[1] }],
        // "reise" (Fassung 3, Kopf der Datei): Stellungen an den Ankern, Ziele mit Namen (TG unten), dazu je Stellung die
        // Bildverschiebung ox/oy (wie OFF, aber mitfahrend). Werte am Vorbild gemessen (look.md, taktkarte.md): Sinkflug von
        // rund 64 auf 60 Grad, am Ende der Annaeherung rund 35 Grad und gut 50 m vor der Front (Review: "45 bis 55 m, rund 35
        // Grad, Front mittig"), ueber dem Raum rund 44 Grad, Strasse fuer den Sperrbildschirm 50 Grad mit dem Laden links,
        // hinter dem Fenster fast senkrecht, zum Laden gegenueber wieder 44 Grad, Kran bis 75 Grad.
        reise: () => {
          const A = n => ctx.at(n), tR = A('roof'), tB = A('back'), tM = A('msg'), tT = A('travel'), tK = A('kran'), tD = A('trashDrop')
          // Runde 2 (beide Laeden im Norden, Fronten nach Sueden, siehe lots): Blick von Sueden mit leichter Drehung wie im Vorbild.
          // az > 0 heisst Kamera westlich von Sueden; in den eigenen Raum (offen nach Westen) schaut sie von Suedwesten, in den Raum
          // gegenueber (offen nach Osten) von Suedosten. Steht der eigene Laden links, ist alles gespiegelt (sg).
          const sg = oursSide === 'right' ? 1 : -1
          // Werte am Vorbild gemessen (Standbilder alle 0,5 s): Sinkflug von Sueden, Schwenk auf das volle Café und langsam heran
          // (bei 6 s ist die Front erst ein Drittel der Bildbreite), vor dem Dach rund 40 Grad, ueber dem Raum von Suedwesten, beim
          // Sperrbildschirm hoch ueber der Strasse mit dem Laden links, hinter dem Fenster fast senkrecht, der leere Raum von Suedosten,
          // nach "trashDrop" ganz nah (der Korb vorn, unten Gehweg und Zebrastreifen), Kran bis fast senkrecht.
          return [
            // Runde 3: flacher und fast gerade von Sueden wie im Vorbild (Fassaden der Cafés sichtbar, Allee senkrecht im Bild); der Sinkflug
            // naehert sich um rund 14 % und dreht 4 Grad (Vorbild: Zoom 16 % mit sichtbarer Drehung, bei uns waren es 5 % ohne Drehung)
            // Runde 4 (Review, Fluss gemessen): im Vorbild beginnt der Sinkflug sofort (Zoom 10/50/90 % bei 0,40/1,63/4,47 s, bei uns
            // 1,37/2,70/3,97), naehert sich um 20 % (bei uns 5 %) und dreht das Bild um 10 Grad zurueck, bis die Allee senkrecht steht (am
            // Anfang liegt sie rund 20 Grad schraeg). Deshalb 'out' (schnell los, langer Auslauf), 176 auf 138 m und 16 auf 5 Grad.
            { t: S0, d: 176, az: sg * 16, el: 58, at: 'mid', ox: 0, oy: 40, ease: 'out' },
            // (die Art des Verlaufs steht an der Stellung, an der ein Wegstueck beginnt)
            { t: tPan, d: 138, az: sg * 5, el: 55, at: 'mid', ox: 0, oy: 40, ease: 'drift' },
            // Runde 4 (Review, Fluss gemessen): der Schwenk auf das volle Café ist im Vorbild ein gerades Gleiten nach rechts ueber rund 2 s
            // (10/50/90 % bei 5,30/6,23/7,23 s), ohne Drehung; die Drehung (rund 26 Grad) kommt erst beim Heranfahren, fast ganz zwischen 8,0
            // und 9,4 s, und das Heranfahren selbst kommt spaet (50 % bei 8,9 s, bei 9,4 s noch in voller Fahrt). Bei uns: Schwenk in 0,5 s
            // mit 9 Grad Drehung (Spitze 5,47 s), Heranfahren weich ab 5,7 s (50 % bei 8,1 s), danach 16 Grad Drehung ueber dem Raum.
            // Jetzt: Schwenk 2 s fast gleichmaessig ('drift') ohne Drehung, Heranfahren mit Drehung spaet ('late', x hoch 2).
            // (2 s, bei kurzem Abstand zwischen "pan" und "roof" hoechstens gut die Haelfte davon)
            { t: tPan + Math.min(2.0, 0.55 * (tR - 0.02 - tPan)), d: 128, az: sg * 5, el: 56, at: 'front', ox: 0, oy: 0, ease: 'late' },
            // Ziel beim Abheben halb zwischen Front und Raum: die Bewegung danach war doppelt so gross wie im Vorbild (Fluss 9,4 bis 10,4 s)
            // Danach 'out': schnell weiter (das Heranfahren endet in voller Fahrt), dann weich in die Drift ueber dem Raum
            { t: tR - 0.02, d: 73, az: sg * 35, el: 41, at: 'frontIn', ox: 30, oy: 35, ease: 'out' },
            // Runde 3: ueber dem Raum und beim Sperrbildschirm eine langsame Drift (Vorbild 0,17 bis 0,22 px je Bild, bei uns stand die
            // Kamera mit 0,03 fast still): rund 10 % naeher und 8 Grad gedreht ueber 5 s
            // Runde 4: die Drift fast gleichmaessig ('drift'; K.travel stand am Anfang fast still: 0,8 % Zoom in 10,0 bis 11,3 s gegen 4,1 %)
            // und etwas staerker (78 auf 68 m)
            // Runde 4: die Bewegung nach dem Abheben kuerzer (Vorbild: am schnellsten bei 9,57 s, steht um 10,0 s; bei uns Spitze 9,78 s)
            { t: tR + 0.45, d: 78, az: sg * 38, el: 44, at: 'in', ox: 60, oy: 50, ease: 'drift' },
            // Runde 3 (Review, Fluss gemessen): "zurueck auf die Strasse" dauerte 0,45 s (15,5 bis 15,95 s), im Vorbild rund 1,05 s
            // (sichtbar 15,40 bis 16,45 s, 10/50/90 % bei 15,40/15,90/16,30 s, um 16,2 s noch in Fahrt, waehrend das Handy schon da ist).
            // Deshalb weich ('soft') von 0,3 s vor "back" bis 1,1 s danach; Wallet und Deckel bleiben an "back" (WALLET_OUT, OUR_LID_DOWN).
            { t: tB - 0.3, d: 68, az: sg * 46, el: 46, at: 'in', ox: 60, oy: 50, ease: 'soft' },
            // Runde 3: der Sperrbildschirm stand rund 1,6-mal zu weit weg (Front 25 % der Bildbreite, fast von Sueden; im Vorbild 42 %, von
            // Suedwesten mit der Glaswand an der Seite)
            // Runde 4: das war zu viel: 1,4-mal zu nah (Dach 0,58 der Bildbreite, im Vorbild 0,41; Figuren 85 px gegen 43 px) und die Front
            // 15 Grad schraeg. Im Vorbild liegt die Markise waagrecht, links die Glaswand. Also weiter weg und fast von Sueden (11 Grad),
            // mit derselben gleichmaessigen Drift wie ueber dem Raum (Vorbild 0,16 px je Bild, bei uns 0,04).
            { t: tB + 1.1, d: 125, az: sg * 7, el: 58, at: 'front', ox: LOCK_OX, oy: 60, ease: 'drift' },
            { t: tM, d: 106, az: sg * 9, el: 60, at: 'front', ox: LOCK_OX - 30, oy: 60 },
            // Runde 3: von oben die Cafés hoeher im Bild (y rund 0,40, im Vorbild 0,38 bis 0,45) und darunter die Allee bis zum unteren Rand
            // Runde 4: 100 px tiefer (Markisen bei 22 s auf y 0,40, im Vorbild 0,47)
            { t: tM + 1.8, d: 170, az: sg * 4, el: 54, at: 'mid', ox: 0, oy: -60 },
            // Runde 3: Fahrt zum Café gegenueber und hinein in den Raum als EINE Bewegung wie im Vorbild (Fluss: los bei rund 22,45 s, am
            // schnellsten 23,2 bis 23,6 s, 75 % bei 24,0 s, steht bei 25 s). Vorher zwei Fahrten: schnell vorne (Spitze 23,0 s), Halt bei
            // 23,4 bis 23,8 s, dann ein zweiter Schub mit Spitze 24,25 s. 'reise' = spaeter Anlauf, langer Auslauf; 'geo': Abstand
            // geometrisch, damit der sichtbare Zoom dem Fortschritt folgt (linear kam die Naeherung erst am Ende)
            // Runde 4: Ziel und Bildverschiebung schneller als der Abstand ('aim': nach 45 % des Wegs, also rund 0,9 s nach "travel", am
            // Raum gegenueber), die Drehung frueher (x hoch 0,6). Vorher stand der Raum bei 23,3 bis 23,6 s oben links am Rand unter den
            // Woertern und kam erst bei 24 s in die Mitte, und die Drehung lag 0,47 s hinter dem Vorbild (10/50/90 % bei 22,63/23,30/24,00 s).
            { t: tT - 0.25, d: 165, az: sg * 4, el: 53, at: 'mid', ox: 0, oy: -60, ease: 'reise', geo: true, aim: 0.45 },
            { t: tT + 2.6, d: 64, az: -sg * 36, el: 43, at: 'rin', ox: 0, oy: 100 },
            // Runde 4: im Vorbild faehrt die Kamera schon ab 26,2 bis 26,4 s zurueck und ohne Halt in den Kran (bei uns ab 26,85 s, Halt 27,35
            // bis 27,6 s): der naechste Punkt 0,4 s vor "trashDrop", danach fast gleichmaessig ('drift') bis "kran"
            { t: Math.max(tT + 2.7, tD - 0.4), d: 53, az: -sg * 38, el: 42, at: 'rin', ox: -60, oy: 60, ease: 'drift' },
            // Runde 3: im Vorbild faehrt die Kamera nach dem Fallen schon ein Stueck zurueck (26,8 bis 27,6 s, Zoom -17 %), bevor der Kran steigt
            { t: tK, d: 66, az: -sg * 38, el: 43, at: 'rin', ox: -60, oy: 60, ease: 'kran', geo: true },
            // Runde 3: Kran-Ende fast gerade von Sueden und flacher (Allee im Vorbild fast senkrecht im Bild, Fassaden der Cafés sichtbar; mit
            // 10 Grad und 75 Grad lag sie schraeg und man sah nur Daecher). Am Ende des Krans das Bild 80 px hoeher und 40 px weiter links,
            // danach sinkt es langsam auf -30 px: so laeuft das eigene Schild beim Hereinkommen von rechts (28,8 s) ueber der Knopfspalte
            // Runde 4: danach eine deutliche Drift heran (Vorbild: Abstand der Cafés im Bild von 31,6 bis 33,6 s 1,28-fach, bei uns 1,05), fast gleichmaessig
            { t: Math.min(E0 - 0.5, tK + 2.4), d: 215, az: sg * 4, el: 52, at: 'mid', ox: 40, oy: -80, ease: 'drift' },
            // und mit ihr sinkt das Bild wie im Vorbild (Cafés bei 30,8 s auf y 0,38, bei 33 s auf 0,47)
            { t: E0, d: 162, az: sg * 6, el: 50, at: 'mid', ox: 40, oy: 120 }
          ]
        }
      }
      const keys = PATH[p.camera]()
      // "reise": jede Stellung muss nach der vorigen kommen, sonst springt die Kamera zurueck (Anker in falscher Reihenfolge)
      if (reise) for (let i = 1; i < keys.length; i++) if (!(keys[i].t > keys[i - 1].t + 0.05)) ctx.fail(`"camera": "reise": Anker in falscher Reihenfolge oder zu dicht (Stellung ${i + 1} bei ${keys[i].t.toFixed(2)} s, die vorige bei ${keys[i - 1].t.toFixed(2)} s). Reihenfolge: pan, roof, back, msg, travel, trashDrop, kran; dazwischen mindestens 0,45 s nach roof bis 0,3 s vor back, 1,1 s nach back bis msg, 1,8 s nach msg bis 0,25 s vor travel, 2,6 s nach travel bis trashDrop`)
      cm.setViewOffset(K.W, K.H, OFF[p.camera][0], -OFF[p.camera][1], K.W, K.H)
      // Ziele: Zahl (0 Mitte, 1 eigener Laden, -1 gegenueber, wie bisher) oder Name ("reise")
      const roomMid = shop => shop.room ? shop.g.localToWorld(new THREE.Vector3((shop.room.x0 + shop.room.x1) / 2, 1.0, (shop.room.z0 + shop.room.z1) / 2 - 0.4)) : before(shop)
      const TG = { mid: T0, front: T1, rfront: TR, midFront: T0.clone().lerp(T1, 0.6), in: roomMid(our), rin: roomMid(riv), frontIn: T1.clone().lerp(roomMid(our), 0.5) }
      const goal = (m, out) => typeof m === 'string' ? out.copy(TG[m]) : m >= 0 ? out.copy(T0).lerp(T1, m) : out.copy(T0).lerp(TR, -m)
      const g0 = new THREE.Vector3(), g1 = new THREE.Vector3()
      camSet = t => {
        let i = 0
        while (i < keys.length - 2 && t > keys[i + 1].t) i++
        // Weg durch eine Stellung: ohne "ease" weich an beiden Enden (K.travel), sonst nur "reise" (Review Fassung 3, Runde 3, am Fluss
        // des Vorbilds gemessen):
        // 'soft' (zurueck auf die Strasse): kubisch, breiter in der Mitte als K.travel (Vorbild fast gleich schnell von 15,6 bis 16,25 s)
        // 'reise' (Fahrt zum Café gegenueber und hinein): K.travel ueber x hoch 0,8, Spitze im ersten Drittel, langer Auslauf
        // 'kran': K.travel ueber x hoch 0,6: Spitze rund 0,5 s nach "kran", halber Weg nach 0,75 s, 90 % nach 1,5 s (Fluss: im Vorbild und
        // bei uns 50 % bei 28,0 s, 80 % bei 28,6 s). Runde 1 und 2 fuhren schnell los und weich an (Spitze 27,8 s, bei 28,0 s war der Raum
        // schon auf 70 % geschrumpft); ein schnelleres Ziel (x hoch 0,4) gab bei 27,7 s einen Ruck
        // "geo": Abstand geometrisch, so folgt der sichtbare Zoom dem Fortschritt (linear kam die Naeherung erst am Ende)
        const a = keys[i], b = keys[i + 1], x = clamp01((t - a.t) / Math.max(0.1, b.t - a.t))
        // Runde 4: 'drift' fast gleichmaessig (70 % linear, 30 % weich; Schwenk und Driften ueber Raum, Sperrbildschirm und nach dem Kran),
        // 'late' spaet und am Ende in voller Fahrt (x hoch 2; Heranfahren an die Front bis "roof"), 'out' schnell los mit langem Auslauf (Sinkflug,
        // nach dem Abheben)
        const u = a.ease === 'soft' ? x * x * (3 - 2 * x) : a.ease === 'reise' ? smooth(Math.pow(x, 0.8)) : a.ease === 'kran' ? smooth(Math.pow(x, 0.6))
          : a.ease === 'drift' ? 0.7 * x + 0.3 * smooth(x) : a.ease === 'late' ? Math.pow(x, 2) : a.ease === 'out' ? 1 - Math.pow(1 - x, 2.2) : K.travel(t, a.t, b.t)
        // 'reise': Winkel weich an beiden Enden (smooth(x)), Abstand und Ziel frueher (x hoch 0,8). So folgt der Zoom im Fluss dem Vorbild
        // (50 % bei 23,65 s, 75 % bei 24,15 s; Vorbild 23,63 und 24,15). Mit demselben Verlauf fuer alles kam bei 24,0 s ein zweiter Schub
        // Runde 4: mit "aim" die Winkel frueher (smooth(x hoch 0,6)), Ziel und Bildverschiebung nach dem Anteil "aim" des Wegs schon da
        const ua = a.ease === 'reise' ? (a.aim ? smooth(Math.pow(x, 0.6)) : smooth(x)) : u
        const uo = a.aim ? smooth(x / a.aim) : u
        goal(a.at, g0); goal(b.at, g1); tg.copy(g0).lerp(g1, uo)
        if (a.ox != null) cm.setViewOffset(K.W, K.H, lerp(a.ox, b.ox, uo), -lerp(a.oy, b.oy, uo), K.W, K.H)
        return place(a.geo ? a.d * Math.pow(b.d / a.d, u) : lerp(a.d, b.d, u), lerp(a.az, b.az, ua), lerp(a.el, b.el, ua), tg)
      }
    }
    // "neon" (Fassung 3): der Name ist nach rund einer Sekunde wieder aus wie im Vorbild (30,2 bis 31,2 s); in Fassung 2 stand
    // er vier Sekunden ueber "Und du?" und der Schlussfrage. Fester Abstand zum Anker "name" statt eines eigenen Ankers: so
    // bleibt der Bericht alter Videos (Liste der Anker) unveraendert. Ohne "neon" bleibt er an wie vorher.
    const nameSign = nameCap ? await buildName({ ctx, K, kit, cap: nameCap, t0: ctx.at('name'), tOut: NE ? ctx.at('name') + (reise ? NAME_ON_REISE : NAME_ON_NEON) : null, tones: p.tones, reise }) : null
    // Flaches Handy (Sperrbildschirm, C1) oder Fenster des Ladens (Nachricht, C3) ueber der Strasse (engine/phone-ui.js).
    // Der Punkt fuer "lock" ist der Kunde auf dem Gehweg gegenueber der Kreuzung, gut 10 m von der eigenen Tuer
    // (Naehe ist nie "vor der Tuer"); die Mitteilungen bei "message" springen ueber Leuten vor beiden Laeden und auf
    // der Kreuzung auf (es bekommt sie, wer die Karte hat, egal wo).
    let ui = null, lockDot = null
    if (p.phoneUi && !reise) {
      const { buildPhoneUi } = await import('../engine/phone-ui.js')
      const Pt = (x, z, y = 2.2) => new THREE.Vector3(x, y, z)
      // Der Kunde fuer "lock": ein Punkt auf einer der beiden Strassen, 9,5 bis 14 m von der eigenen Tuer, der beim
      // Aufwachen des Sperrbildschirms links im Bild steht (x 80 bis 480, y 700 bis 1450; rechts steht das Handy).
      // Erste Fassung nahm einen festen Punkt, und der lag in der Ansicht "front" links ausserhalb des Bildes: die
      // Linie kam dann aus dem Nichts (tools/test_3d_nachbau_v2.mjs).
      const door = our.at(0), cands = []
      for (let k = -24; k <= 24; k += 0.5) for (const q of [Pt(0, k, 1.2), Pt(k, 0, 1.2)]) { const d = Math.hypot(q.x - door.x, q.z - door.z); if (d >= 9.5 && d <= 14) cands.push({ q, d }) }
      let pick = cands[0]
      if (p.phoneUi === 'lock') {
        camSet(ctx.at('uiNotify')); kit.sync()
        const ok = cands.filter(c => { const [x, y] = kit.project([c.q]); return x >= 80 && x <= 480 && y >= 700 && y <= 1450 })
        if (ok.length) pick = ok.reduce((a, b) => (a.d <= b.d ? a : b))
        else ctx.warn('"phoneUi": "lock": kein Punkt 9,5 bis 14 m von der Tür steht links im Bild; die Linie beginnt am Bildrand')
        lockDot = { x: +pick.q.x.toFixed(2), z: +pick.q.z.toFixed(2), dist: +pick.d.toFixed(2) }
      }
      const away = pick.q.clone()
      const spots = [before(our).setY(3.2), before(riv).setY(3.2), Pt(-1.2, 1.4, 2.6), Pt(0, -B - 9, 2.6)]
      ui = await buildPhoneUi(ctx, { mode: p.phoneUi, shop: p.shop, icon: p.icon, accent: p.accent, reward: p.reward, left: p.left, clock: p.clock, date: p.date, message: p.message,
        dot: away, spots,
        t: p.phoneUi === 'lock' ? { in: ctx.at('ui'), notify: ctx.at('uiNotify') } : { in: ctx.at('ui'), type: ctx.at('uiType'), send: ctx.at('uiSend'), out: ctx.at('uiOut') } })
    }
    // ---------------------------------------------------------------- "reise": Raeume, Deckel, Korb, Verkehr, drei Handybilder
    let R3 = null
    if (reise) {
      const A = n => ctx.at(n)
      const T3 = Object.fromEntries(REISE.map(([k]) => [k, A(k)]))
      if (!(T3.roof2 >= T3.travel + 0.5)) ctx.fail(`"camera": "reise": "roof2" mindestens 0,5 s nach "travel" (die Kamera muss erst drüben sein; jetzt ${(T3.roof2 - T3.travel).toFixed(2)} s)`)
      if (!(T3.wallet > T3.roof && T3.walletNoApp < T3.back - 0.3)) ctx.fail('"camera": "reise": die Wallet gehört zwischen "roof" und "back" ("walletNoApp" mindestens 0,3 s vor "back")')
      if (!(T3.lock > T3.back && T3.lockNotify < T3.msg - 0.3)) ctx.fail('"camera": "reise": der Sperrbildschirm gehört zwischen "back" und "msg" ("lockNotify" mindestens 0,3 s vor "msg")')
      if (!(T3.msgOut < T3.travel && T3.trash > T3.roof2 && T3.trashDrop < T3.kran)) ctx.fail('"camera": "reise": Reihenfolge msg ... msgOut vor "travel", Korb zwischen "roof2" und "kran"')
      const rooms = [await buildRoom({ kit, K, shop: our, tone: 'kalt', full: true, SH, CURB, mirror: true }), await buildRoom({ kit, K, shop: riv, tone: 'warm', full: false, SH, CURB })]
      const trash = await buildTrash({ ctx, kit, K, shop: riv, SH, CURB, T: { up: T3.trash, card: T3.trashCard, mail: T3.trashMail, drop: T3.trashDrop, gone: T3.kran + KRAN_LID }, icon: p.rivalIcon })
      const traffic = buildTraffic({ kit, K, C, nsLane: -2.2 })
      // Deckel: hebt auf "roof" ab (LID_UP, beschleunigt) und senkt sich auf "back" + OUR_LID_DOWN wieder (0,45 s); gegenueber auf
      // "roof2" und "kran". Reine Funktion von t. Runde 2: er bleibt fest (k = 1), bis er 85 % seines Wegs hinter sich hat und damit
      // ueber dem oberen Bildrand steht, erst dann blendet er aus; vorher blendete er ab 0,25 s und hing als Geist ueber dem Raum.
      // Runde 4: in 0,4 s statt 0,6 s (Vorbild: das Obergeschoss hebt ab 9,44 s ab und ist um 9,8 s aus dem Bild; gegenueber 23,20 bis
      // 23,33 s), bei uns hing es bei 9,8 s noch am oberen Rand
      const lidAt = (t, up, down) => {
        if (t < up) return { lift: 0, k: 1 }
        if (t < down) { const u = clamp01((t - up) / LID_UP); return { lift: LID_LIFT * u * u, k: 1 - smooth((u - 0.85) / 0.15) } }
        const u = clamp01((t - down) / 0.45); return { lift: LID_LIFT * (1 - u) * (1 - u), k: smooth((t - down) / 0.3) }
      }
      const { buildPhoneUi } = await import('../engine/phone-ui.js')
      const host = () => { const e = ctx.el('div', 'is-pui'); e.style.cssText = 'position:absolute;inset:0;pointer-events:none'; ctx.root.append(e); return e }
      const Pt = (x, z, y = 2.2) => new THREE.Vector3(x, y, z)
      const ui1 = await buildPhoneUi(ctx, { mode: 'wallet', host: host(), tones: p.tones, shop: p.shop, icon: p.icon, accent: p.accent, stamps: 10, have: 3, reward: p.reward,
        t: { in: T3.wallet, add: T3.walletAdd, card: T3.walletCard, noApp: T3.walletNoApp, out: T3.back + WALLET_OUT } })
      // Kunde fuer den Sperrbildschirm: wie bei "phoneUi": "lock" ein Punkt auf der Strasse 9,5 bis 14 m von der Tuer, der beim
      // Aufwachen links im Bild steht (nie "vor der Tuer", C1)
      // Mehr Kandidaten als bei "phoneUi" (Fahrbahn und Gehwege beider Strassen): in der Ansicht von "reise" liegt die Mitte der
      // Strassen beim Sperrbildschirm rechts unter dem Handy, und der Punkt sass sonst am Bildrand (erster Entwurf)
      const door = our.at(0), cands = []
      for (let k = -30; k <= 30; k += 0.5) for (const o of [0, -1.2, 1.2, -2.5, 2.5]) for (const q of [Pt(o, k, 1.2), Pt(k, o, 1.2)]) { const d = Math.hypot(q.x - door.x, q.z - door.z); if (d >= 9.5 && d <= 14) cands.push({ q, d }) }
      camSet(T3.lockNotify); kit.sync()
      const okC = cands.filter(c => { const [x, y] = kit.project([c.q]); return x >= 80 && x <= 480 && y >= 700 && y <= 1450 })
      // Runde 2: unter den passenden der, der im Bild am naechsten an der Stelle des Punkts im Vorbild liegt (rund x 320, y 1200: links
      // unten vor dem Laden auf der Strasse); vorher der naechste zur Tuer, und der sass am linken Bildrand
      const want = c => { const [x, y] = kit.project([c.q]); return Math.hypot(x - 320, y - 1200) }
      const pick = okC.length ? okC.reduce((a, b) => (want(a) <= want(b) ? a : b)) : cands[0]
      if (!okC.length) ctx.warn('"camera": "reise": kein Punkt 9,5 bis 14 m von der Tür steht beim Sperrbildschirm links im Bild; die Linie beginnt am Bildrand')
      lockDot = { x: +pick.q.x.toFixed(2), z: +pick.q.z.toFixed(2), dist: +pick.d.toFixed(2) }
      const ui2 = await buildPhoneUi(ctx, { mode: 'lock', host: host(), tones: p.tones, shop: p.shop, icon: p.icon, accent: p.accent, reward: p.reward, left: p.left, clock: p.clock, date: p.date,
        dot: pick.q.clone(), t: { in: T3.lock, notify: T3.lockNotify, out: T3.msg + 0.15 } })
      const ui3 = await buildPhoneUi(ctx, { mode: 'message', host: host(), tones: p.tones, veil: 0.42, shop: p.shop, icon: p.icon, accent: p.accent, message: p.message,
        // Runde 3: Mitteilungen bis 0,4 s nach "travel" (im Vorbild bei 23,0 s noch da, bei 23,4 s weg; sie fahren mit der Strasse mit)
        spots: [before(our).setY(3.2), before(riv).setY(3.2), Pt(-1.2, 1.4, 2.6), Pt(0, -B - 9, 2.6)], t: { in: T3.msg, type: T3.msgType, send: T3.msgSend, out: T3.msgOut, popOut: T3.travel + 0.4 } })
      R3 = { T3, rooms, trash, traffic, lidAt, uis: [ui1, ui2, ui3], base: [our, riv].map(s => [s, s.front.material.opacity, s.light.intensity]) }
    }
    const deco = (tagNames || p.boards) ? await buildDeco({ ctx, K, kit, p, our, riv, tagNames, hideOn: reise && nameSign ? nameSign.on : null, tPan: (p.camera === 'descent' || reise) ? ctx.at('pan') : null, tBack: reise ? ctx.at('kran') + 0.9 : null, top: reise ? SH.h : null, boardScale: reise ? BOARD_REISE : 1, tagScale: reise ? TAG_REISE : 1, edge: reise ? 40 : null }) : null

    // ---------------------------------------------------------------- Pruefkaesten (siehe Kopf der Datei)
    // Schilder und Herz bilden eine data-apart-Gruppe: sie duerfen sich im Bild nicht ueberdecken.
    kit.safeBox('ourSign', 'Schild ' + our.name, true); kit.safeBox('rivSign', 'Schild ' + riv.name, true)
    if (p.heart) kit.safeBox('heart', 'Herz', true)
    if (p.walker) kit.safeBox('walker', 'Stammkunde', false)
    if (nameSign) kit.safeBox('name', 'Schriftzug ' + nameSign.text, true)
    if (R3) kit.safeBox('trash', 'Korb')

    // Tuerblatt: wie weit die Figur von seiner Angel weg ist
    const fromHinge = (shop, pos) => Math.hypot(pos.x - shop.hingeWorld.x, pos.z - shop.hingeWorld.z)
    const opening = (t, t0, t1) => smooth((t - t0) / 0.35) * (1 - smooth((t - t1) / 0.5))

    // ---------------------------------------------------------------- Zustand zum Zeitpunkt t (ohne Zeichnen)
    // kit.run: Ruhelage, Sichtbarkeit, Abblenden beim Szenenwechsel und das Aufheben der 2D-Kamerafahrt
    // erledigt der Baukasten; hier steht nur, was sich in dieser Szene bewegt.
    kit.run(t => {
      const az = camSet(t)
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
        darken(origin, p.dark * fin)
      } else if (p.dark > 0) {
        // Ohne Stammkunden: von Anfang an das Schlussbild (gegenueber dunkel, der eigene leuchtet)
        riv.shine(-1); our.shine(1); darken(riv, p.dark)
      }
      // Gaeste vor dem Laden: wiegen sich, die in der Schlange ruecken kaum merklich, die Gruppe gestikuliert
      for (const c of crowd) {
        const ph = t * 1.9 + c.ph
        c.f.body.rotation.z = 0.04 * Math.sin(ph)
        c.f.armR.rotation.x = c.queue ? -0.15 * Math.max(0, Math.sin(ph * 0.5)) : -0.55 * Math.max(0, Math.sin(ph * 0.9))
        c.f.armR.rotation.z = c.queue ? 0 : 0.2 * Math.max(0, Math.sin(ph * 0.9))
        c.f.armL.rotation.x = c.queue ? 0 : -0.25 * Math.max(0, Math.sin(ph * 0.7 + 2))
      }
      // Die zwei am Brunnen wiegen sich leicht und gestikulieren abwechselnd
      chat.forEach((c, i) => { const ph = t * 2.2 + i * 2; c.body.rotation.z = 0.04 * Math.sin(ph); c.armR.rotation.x = -0.5 * Math.max(0, Math.sin(ph * 0.9 + i * 3)); c.armR.rotation.z = 0.2 * Math.max(0, Math.sin(ph * 0.9 + i * 3)) })
      if (smoke) smoke.update(t)
      // "reise": Deckel, Raeume (nur zu sehen, solange ihr Deckel nicht ganz zu ist), Korb, Verkehr
      let lidO = null, lidR = null
      if (R3) {
        lidO = R3.lidAt(t, R3.T3.roof, R3.T3.back + OUR_LID_DOWN); lidR = R3.lidAt(t, R3.T3.roof2, R3.T3.kran + KRAN_LID)
        our.lidSet(lidO.lift, lidO.k); riv.lidSet(lidR.lift, lidR.k)
        // Schein und Licht vor der Front gehen mit dem Deckel: sonst lag der blaue Schein (additiv, 5,5 m) ueber dem offenen Raum,
        // und der Boden war satt blau statt graulila wie im Vorbild (Review Fassung 3, Runde 1). Ohne "dark" setzt shine nichts
        // neu, dann von den Werten des Aufbaus aus (jedes Bild haengt nur an t).
        if (!(p.dark > 0)) R3.base.forEach(([s, fo, li]) => { s.front.material.opacity = fo; s.light.intensity = li })
        our.front.material.opacity *= lidO.k; riv.front.material.opacity *= lidR.k
        our.light.intensity *= 0.35 + 0.65 * lidO.k; riv.light.intensity *= 0.35 + 0.65 * lidR.k
        R3.rooms[0].update(t, lidO.lift > 0.01); R3.rooms[1].update(t, lidR.lift > 0.01)
        R3.trash.update(t); R3.traffic.update(t)
      }
      // Pruefkaesten: wo die Kamera Schilder, Herz und Figur in diesem Bild hinwirft
      kit.sync()
      if (R3) {
        // Schild nur, solange sein Deckel steht und es im Bild liegt: bei der Fahrt nah an die Front laeuft der Laden
        // gegenueber ueber den Bildrand (Fassung 2 meldete deshalb ein Schild bei x = 1610, also ausserhalb des Bildes)
        // Runde 2: nur ein Schild, das ganz im Bild steht. Beim Blick in den Raum gegenueber (von Suedosten) steht das eigene Schild
        // angeschnitten am rechten Rand (bis x 1158): Hintergrund, nicht lesbar, und kein Grund fuer die Warnung zur Knopfspalte
        const inFrame = r => r[0] >= 0 && r[2] <= K.W && r[1] < K.H && r[3] > 0
        const so = kit.project(our.signCorners), sr = kit.project(riv.signCorners)
        // Waehrend die Kamera beim Laden gegenueber ist (Fahrt bis Kran), ist das eigene Schild Hintergrund am Bildrand
        const atRival = t > R3.T3.travel + 0.3 && t < R3.T3.kran + 0.9
        kit.setSafe('ourSign', lidO.lift < 0.01 && !atRival && inFrame(so) ? so : null); kit.setSafe('rivSign', lidR.lift < 0.01 && inFrame(sr) ? sr : null)
        kit.setSafe('trash', R3.trash.box())
      } else { kit.setSafe('ourSign', kit.project(our.signCorners)); kit.setSafe('rivSign', kit.project(riv.signCorners)) }
      kit.setSafe('heart', heartMeshes.length ? kit.meshBox(heartMeshes) : null)
      kit.setSafe('walker', walker && walker.fig.visible ? kit.meshBox([walker.fig]) : null)
      if (nameSign) kit.setSafe('name', nameSign.update(t))
      if (deco) deco.update(t)
      if (ui) ui.update(t, q => { const r = kit.project([q]); return [r[0], r[1]] })
      if (R3) for (const u of R3.uis) u.update(t, q => { const r = kit.project([q]); return [r[0], r[1]] })
    })

    // Nur fuer tools/test_3d.mjs. doorGap: kleinster Abstand zwischen Stammkunde und den Tuerblaettern in diesem
    // Bild (in Metern; negativ = er steckt im Blatt), so prueft der Test die Tuer in 0,05-s-Schritten ohne
    // Bilder. drawnBox: rechnet das Bild einmal mit und einmal ohne Figur bzw. Herz und gibt zurueck, wo sich
    // Pixel aendern; der Test vergleicht das mit dem Pruefkasten (liegt der Kasten wirklich auf dem Ding?).
    kit.canvas.isoDebug = {
      // Wie die Namen auf den Schildern stehen (Zeilen, Groesse relativ zur Schildhoehe)
      signs: signs.map(x => ({ ...x })),
      name: nameSign ? { text: nameSign.text, t0: nameSign.t0, size: nameSign.size, fill: nameSign.fill ? nameSign.fill.material.blending === THREE.NormalBlending : false } : null,
      nameOn(t) { return nameSign ? nameSign.on(t) : null },
      // Fassung 2 (tools/test_3d_nachbau_v2.mjs): Kamera im zuletzt gestellten Bild (Stellung, Hoehenwinkel ueber der
      // Kreuzung) und wo die Mitten beider Schilder im Bild liegen
      lockDot: () => lockDot,
      // Brunnenplatz gebaut? (mit "reise" nie, sonst wie immer)
      plaza: () => !!scene.getObjectByName('brunnen'),
      // Weltpunkte [x, y, z] -> Bildpunkte mit der Kamera zur Zeit t (Pruefhilfe, zeichnet nichts)
      project(t, pts) { camSet(t); kit.sync(); return pts.map(([x, y, z]) => kit.project([new THREE.Vector3(x, y, z)]).slice(0, 2).map(v => Math.round(v))) },
      // Fassung 3 (tools/test_3d_nachbau_v3.mjs): Deckel beider Laeden, Gaeste in den Raeumen, Verkehr und Korb zum Zeitpunkt t
      reise: R3 ? {
        lid: t => ({ ours: R3.lidAt(t, R3.T3.roof, R3.T3.back + OUR_LID_DOWN), rival: R3.lidAt(t, R3.T3.roof2, R3.T3.kran + KRAN_LID) }),
        rooms: () => R3.rooms.map(r => ({ people: r.people, tables: r.tables, counter: r.counterAt() })),
        // Runde 2: Grundflaechen beider Laeden [x0, x1, z0, z1], Drehung, Dachplatten und Farbe des Himmelslichts
        layout: () => ({ ours: shopRect(oursSide), rival: shopRect(rivalSide), rot: [our.rot, riv.rot], roofPlates: (scene.getObjectByName('dachplatten') || { count: 0 }).count, houses: houses.length, sky: '#' + lights.hemi.color.getHexString(),
          // Runde 3: Allee (AV), Grundflaeche der Haeuser (Median, m2) und die Bruestung des vollen Cafés
          av: AV, houseArea: +houses.map(h => h.w * h.d).sort((x, y) => x - y)[Math.floor(houses.length / 2)].toFixed(1), parapet: our.g.children.filter(o => o.name === 'bruestung').length + riv.g.children.filter(o => o.name === 'bruestung').length,
          // Runde 4: Ampel, braune Fassade an beiden Cafés, Glaswand nur am vollen
          ampel: !!scene.getObjectByName('ampel'), fassade: [our, riv].map(s => s.lid.children.filter(o => o.name === 'fassade').length), glas: [our, riv].map(s => s.lid.children.filter(o => o.name === 'glaswand').length) }),
        traffic: t => R3.traffic.at(t),
        trash: () => R3.trash.state(),
        // Runde 1 nach dem Review: Laternen (alle mit Schein), geparkte Autos [x, z, Drehung], Anteil heller Fenster
        city: () => ({ lamps: lamps.length, lampAt: lamps.map(a => a.map(v => +v.toFixed(2))), parked: parked.map(a => a.map(v => +v.toFixed(2))), lit: +(windows.filter(w => w.on < 0.13).length / windows.length).toFixed(3),
          // Runde 4: Koepfe der Laternen [x, y, z] (ueber der Fahrbahn) und die Zahl der Scheiben dahinter
          heads: lampsR.map(l => [+(l.x + l.ax * LAMP_ARM).toFixed(2), +(CURB + LAMP_H).toFixed(2), +(l.z + l.az * LAMP_ARM).toFixed(2)]), halos: scene.children.filter(o => o.name === 'laterne').length }),
        // Runde 4: Deckkraft der Schilder (eigenes, gegenueber) im zuletzt gestellten Bild
        signs: () => [our.signMat.opacity, riv.signMat.opacity],
        trashAt: () => { const g = R3.trash.group; return [+g.position.x.toFixed(2), +g.position.z.toFixed(2)] },
        anchors: R3.T3
      } : null,
      camera() {
        const c = kit.camera.position, sMid = shop => { const r = kit.project(shop.signCorners); return [(r[0] + r[2]) / 2, (r[1] + r[3]) / 2] }
        return { x: c.x, y: c.y, z: c.z, el: Math.atan2(c.y, Math.hypot(c.x, c.z)) * 180 / Math.PI, our: sMid(our), riv: sMid(riv), mode: p.camera, pose: camPose() }
      },
      drawnBox(what) { return kit.drawnBox(what === 'walker' ? walker && walker.fig : what === 'heart' ? heart && heart.grp : what === 'name' ? nameSign && nameSign.plate : null) },
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

// ================================================================================================ Schriftzug
// Leuchtschrift mit Logo ueber der Kreuzung (warum so: Kopf der Datei). update(t) stellt sie fuer Bild t und gibt
// ihren Umriss im Bild zurueck (fuer den Pruefkasten), oder null, solange sie aus ist.
async function buildName({ ctx, K, kit, cap, t0, tOut = null, tones, reise = false }) {
  const { THREE, scene, canvasTex } = kit
  const NE = !!kit.PAL.neon
  const { W, H, clamp01, smooth } = K
  const FD = ctx.B.display, { cx: CX, top: TOP, w: NW, h: NH } = reise ? NAME_BOX_REISE : NE ? NAME_BOX_NEON : NAME_BOX
  const text = cap.words.join(' ').replace(/[.,!?:;]+$/, '')
  if (!text || text.length > 12) ctx.fail(`Der Schriftzug "${text}" muss 1 bis 12 Zeichen haben (eine Zeile über der Kreuzung)`)
  if (/[\u2012-\u2015]/.test(text)) ctx.fail('Der Schriftzug enthält einen Gedankenstrich. Normalen Bindestrich nehmen.')
  await kit.fonts(text)
  // Schriftgroesse: so gross, dass Logo und Wort mit Rand in die Flaeche passen
  // "reise": ohne Logo (LOGO 0), Schrift bis 40 px an den Rand der Flaeche
  const mc = document.createElement('canvas').getContext('2d'), LOGO = reise ? 0 : 0.8, GAP = reise ? 0 : 0.22
  // "reise", Runde 2: der Name stand mit 8,2 % der Bildhoehe Versalhoehe kleiner und duenner als im Vorbild (11,3 %). Breiter darf er
  // nicht (rechts die Knopfspalte), also enger gesetzt (-0,03 em) und mit einer Kontur in der Schriftfarbe kraeftiger als die 700 der Schrift
  // (schwerere Schnitte gibt es nicht); dadurch wird er rund 10 % groesser. Die Kontur ist in der Breite mitgemessen.
  const LS = reise ? -0.03 : 0, BOLD = reise ? 0.035 : 0
  const span = s => { mc.font = `700 ${s}px ${FD}`; mc.letterSpacing = LS ? `${(LS * s).toFixed(2)}px` : '0px'; return mc.measureText(text).width - LS * s + BOLD * s + s * (LOGO + GAP) }
  let size = reise ? 320 : 168
  while (span(size) > NW - (reise ? 14 : 90) && size > 60) size -= 4
  // Logo aus brand.js: helle Kachel, der Stempel darin dunkel. Additiv gemischt wird Dunkel durchsichtig, der
  // Stempel steht also als Aussparung in der leuchtenden Kachel, wie eine Neonroehre um ein Zeichen
  const img = new Image()
  // ohne xmlns laesst sich ein SVG nicht als Bild laden ("cannot be decoded"); logoSvg ist fuer HTML gebaut
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(ctx.logoSvg(256, '#EEEAFF', '#120E30').replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" '))
  await img.decode()
  const TS = 2
  const tex = canvasTex(NW * TS, NH * TS, g => {
    g.scale(TS, TS); g.fillStyle = '#000'; g.fillRect(0, 0, NW, NH)
    const x0 = (NW - span(size)) / 2, cy = NH / 2, ls = size * LOGO, tx = x0 + ls + size * GAP
    g.font = `700 ${size}px ${FD}`; g.textBaseline = 'middle'
    if (LS) g.letterSpacing = `${(LS * size).toFixed(2)}px`
    const draw = () => {
      g.fillText(text, tx + BOLD * size / 2, cy + size * 0.03)
      if (BOLD) { g.lineWidth = BOLD * size; g.lineJoin = 'round'; g.strokeStyle = g.fillStyle; g.strokeText(text, tx + BOLD * size / 2, cy + size * 0.03) }
      if (!reise) g.drawImage(img, x0, cy - ls / 2, ls, ls)
    }
    // Schein in drei Stufen (weit und lila, mittel, eng und hell), dann der helle Kern der Roehre. "neon": blau wie
    // im Vorbild (#8AA2FC mit Schein #1230A8, gemessen)
    const glowC = reise ? [[60, 'rgba(18,48,168,1)'], [30, 'rgba(30,70,220,.95)'], [10, 'rgba(90,120,250,.9)']] : NE ? [[44, 'rgba(40,80,255,.95)'], [22, 'rgba(110,140,255,.95)'], [8, 'rgba(180,198,255,1)']] : [[44, 'rgba(140,124,255,.95)'], [22, 'rgba(185,176,255,.95)'], [8, 'rgba(225,220,255,1)']]
    for (const [blur, c] of glowC) {
      g.save(); g.shadowColor = c; g.shadowBlur = blur; g.fillStyle = c; draw(); g.restore()
    }
    // "reise": die Fuellung steht auf einer eigenen Flaeche (fillTex unten)
    if (!reise) { g.fillStyle = NE ? '#DCE5FF' : '#F7F5FF'; draw() }
  }, { sharp: true })
  // "reise", Runde 4: die Buchstaben waren durchsichtig. Die Platte wird additiv gemischt (der Schein soll leuchten), und so schienen
  // Zebrastreifen, Markise und Laternen durch die Fuellung: Buchstaben im Mittel (153,180,245), Streuung 69/61 je Kanal, im Vorbild eine
  // satte Fuellung #8CA5FC (Streuung 0 im Stamm des T). Jetzt die Fuellung auf einer eigenen Flaeche mit normaler Mischung und
  // durchsichtigem Grund, ueber dem Schein; der Schein bleibt additiv darunter.
  const fillTex = reise ? canvasTex(NW * TS, NH * TS, g => {
    g.scale(TS, TS)
    const x0 = (NW - span(size)) / 2, cy = NH / 2, tx = x0
    g.font = `700 ${size}px ${FD}`; g.textBaseline = 'middle'
    if (LS) g.letterSpacing = `${(LS * size).toFixed(2)}px`
    g.fillStyle = '#8AA2FC'; g.fillText(text, tx + BOLD * size / 2, cy + size * 0.03)
    if (BOLD) { g.lineWidth = BOLD * size; g.lineJoin = 'round'; g.strokeStyle = '#8AA2FC'; g.strokeText(text, tx + BOLD * size / 2, cy + size * 0.03) }
  }, { sharp: true }) : null
  const add = (map, color, w, h, order) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map, color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, toneMapped: false, fog: false }))
    m.renderOrder = order; m.frustumCulled = false; m.visible = false; scene.add(m); return m
  }
  // "reise", Runde 2: groesserer Schein wie im Vorbild
  const halo = add(kit.blobTex, reise ? '#1230A8' : NE ? '#2E52FF' : '#8F82FF', NW * (reise ? 1.7 : 1.45), NH * (reise ? 2.8 : 2.3), 7)
  const plate = add(tex, '#FFFFFF', NW, NH, 8)
  const fill = fillTex ? add(fillTex, '#FFFFFF', NW, NH, 9) : null
  if (fill) { fill.material.blending = THREE.NormalBlending; fill.name = 'name-fuellung' }
  // Schein auf der Kreuzung (auf der Fahrbahn; die Gehwege liegen hoeher und decken ihn dort ab)
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(26, 26), new THREE.MeshBasicMaterial({ map: kit.blobTex, color: NE ? '#2A4BFF' : '#8C7EFF', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }))
  pool.rotation.x = -Math.PI / 2; pool.position.set(0, 0.05, 0); pool.renderOrder = 4; pool.visible = false; scene.add(pool)
  if (tones) ctx.cue(t0 + 0.02, 'thud', 0.8)
  // Zuenden: zweimal Flackern, dann an; danach atmet er kaum merklich (eine Roehre steht nie ganz still)
  const FLICK = [[0, 0], [0.04, 0.9], [0.08, 0.15], [0.12, 1], [0.17, 0.4], [0.25, 1]]
  // tOut ("look": "neon", NAME_ON_NEON nach "name"): danach in 0,3 s aus, wie im Vorbild nach rund einer Sekunde. Ohne tOut an
  // bis zum Ende des Teils.
  const fade = t => tOut == null ? 1 : 1 - smooth((t - tOut) / 0.3)
  const on = t => {
    const d = t - t0
    if (d < 0) return 0
    if (tOut != null && t >= tOut + 0.3) return 0
    if (d >= FLICK[FLICK.length - 1][0]) return (0.95 + 0.05 * Math.sin(d * 2.4)) * fade(t)
    for (let i = 1; i < FLICK.length; i++) if (d <= FLICK[i][0]) { const [a, va] = FLICK[i - 1], [b, vb] = FLICK[i]; return va + (vb - va) * (d - a) / (b - a) }
    return 1
  }
  const ndc = new THREE.Vector3(), dir = new THREE.Vector3(), fwd = new THREE.Vector3(), tilt = new THREE.Quaternion(), eul = new THREE.Euler()
  const toWorld = (sx, sy, depth, out) => {
    const cm = kit.camera
    ndc.set(sx / W * 2 - 1, 1 - sy / H * 2, 0.5).unproject(cm)
    dir.copy(ndc).sub(cm.position).normalize(); cm.getWorldDirection(fwd)
    return out.copy(cm.position).addScaledVector(dir, depth / dir.dot(fwd))
  }
  const corners = [[-NW / 2, -NH / 2], [NW / 2, -NH / 2], [-NW / 2, NH / 2], [NW / 2, NH / 2]].map(([x, y]) => new THREE.Vector3(x, y, 0)), cw = corners.map(() => new THREE.Vector3())
  const origin = new THREE.Vector3(0, 0, 0)
  const update = t => {
    const k = on(t), show = k > 0.001
    plate.visible = halo.visible = pool.visible = show
    if (fill) fill.visible = show
    if (!show) return null
    const cm = kit.camera; cm.getWorldDirection(fwd)
    const D = 0.6 * origin.clone().sub(cm.position).dot(fwd)
    const grow = 0.94 + 0.06 * smooth((t - t0) / 0.3)
    const wpp = 2 * D * Math.tan(THREE.MathUtils.degToRad(cm.fov / 2)) / H
    for (const m of fill ? [plate, halo, fill] : [plate, halo]) {
      toWorld(CX, TOP + NH / 2, D + (m === halo ? 2 : 0), m.position)
      // kaum gedreht: eine Spur Koerper, aber lesbar wie ein Schild von vorn
      m.quaternion.copy(cm.quaternion).multiply(tilt.setFromEuler(eul.set(0, 0.1 + 0.02 * Math.sin(t * 0.9), 0)))
      m.scale.setScalar(wpp * grow)
      m.updateMatrixWorld(true)
    }
    plate.material.opacity = k; halo.material.opacity = 0.42 * k; if (fill) fill.material.opacity = k; pool.material.opacity = 0.5 * smooth((t - t0) / 0.5) * Math.min(1, k + 0.2)
    // Umriss im Bild aus den vier Ecken der Flaeche (der weiche Schein dahinter zaehlt nicht)
    return k > 0.5 ? kit.project(corners.map((c, i) => cw[i].copy(c).applyMatrix4(plate.matrixWorld))) : null
  }
  return { text, t0, size, plate, fill, on, update }
}

// ================================================================================================ mode "nah"
// Ring, Kunde, Blase und Kamera fuer C1 (warum so: Kopf der Datei). Die Stadt, beide Laeden, die Glocke und die
// zwei am Brunnen hat build() schon gebaut, genau wie im Duell.
async function buildNah({ ctx, p, K, kit, our, riv, oursSide, signs, bell, msg, smoke, chat }) {
  const { THREE, scene, canvasTex, std, glow, col } = kit
  const { W, H, clamp01, smooth, lerp, walkCycle } = K
  // Palette der Welt ("look"): mit "neon" Ring, Kegel und Blase in Blau statt Lila (Fassung 2 des Nachbaus)
  const C = kit.PAL, NE = !!C.neon
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
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#000000'); gr.addColorStop(0.55, NE ? '#0C1640' : '#1C1840'); gr.addColorStop(0.9, NE ? '#3D63FF' : '#8A80F0'); gr.addColorStop(1, NE ? '#8AA2FC' : '#B4ABFF')
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
  const phoneGlow = glow(NE ? '#8AA2FC' : '#B9B0FF', 1.5, new THREE.Vector3(), 0); phoneGlow.material.depthTest = false; phoneGlow.renderOrder = 6

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
    const gr = g.createLinearGradient(0, 0, BW * 0.45, BH); gr.addColorStop(0, NE ? '#2A3A78' : '#5446C2'); gr.addColorStop(0.55, NE ? '#141C3E' : '#2B2177'); gr.addColorStop(1, NE ? '#070A16' : '#161041')
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
  const slab = new THREE.Mesh(slabGeo, [new THREE.MeshBasicMaterial({ map: bubTex, toneMapped: false, fog: false }), std(NE ? '#141A30' : '#2A2166', { emissive: NE ? '#2A44B0' : '#4A3FB0', emissiveIntensity: 0.6, roughness: 0.45, fog: false })])
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(BW * 1.5, BH * 1.9), new THREE.MeshBasicMaterial({ map: kit.blobTex, color: NE ? '#3B5BFF' : '#9F95FF', transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false }))
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
  const coneMat = new THREE.MeshBasicMaterial({ map: coneTex, color: NE ? '#6F8BFF' : '#A99FFF', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, side: THREE.DoubleSide, fog: false })
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

// ================================================================================================ Schildchen und Tafeln
// "tags" und "boards" (Fassung 2 des Nachbaus, siehe Kopf der Datei): HTML ueber der Leinwand. update(t) setzt sie
// an den Punkt, den die Kamera fuer die Stelle ueber dem jeweiligen Laden ausrechnet; Groesse und Deckkraft haengen
// nur an t (Aufspringen, Zeilen zeichnen, Verschwinden).
const DECO_CSS = `
.is-tag { position: absolute; left: 0; top: 0; display: flex; align-items: center; gap: 12px; padding: 9px 18px 9px 15px; border-radius: 999px;
  background: rgba(12,14,24,.86); border: 1.5px solid rgba(255,255,255,.14); color: #FFFFFF; font: 700 23px/1 'Hanken Grotesk', sans-serif;
  letter-spacing: .14em; white-space: nowrap; transform-origin: 50% 100%; opacity: 0; pointer-events: none; }
.is-tag i { width: 11px; height: 11px; border-radius: 50%; flex: none; }
.is-board { position: absolute; left: 0; top: 0; width: 230px; height: 262px; border-radius: 14px; background: #15171F;
  border: 7px solid #8E6E4C; box-shadow: 0 18px 40px rgba(0,0,0,.6), inset 0 0 0 2px rgba(0,0,0,.4); transform-origin: 50% 100%; opacity: 0; pointer-events: none; }
.is-board svg.ic { position: absolute; left: 50%; top: 22px; width: 88px; height: 88px; margin-left: -44px; }
.is-board svg.ln { position: absolute; left: 22px; top: 128px; width: 172px; height: 106px; }
`
// hideOn ("reise", Runde 2): Funktion von t (0 bis 1); solange sie an ist, sind die Schildchen weg. Im Vorbild verschwinden sie, solange der
// Name leuchtet (30,2 bis 31,4 s), und kommen danach wieder; bei uns lagen sie als HTML ueber dem Namen.
// edge ("reise", Runde 3): Tafeln bleiben mindestens so viele Bildpunkte vom linken und rechten Rand. Seit die Allee die Cafés weiter
// auseinander stellt, hing die linke Tafel bei 4 s ueber den Bildrand hinaus; sie rueckt dann zur Mitte. Ohne edge wie vorher.
async function buildDeco({ ctx, K, kit, p, our, riv, tagNames, tPan, tBack = null, top = null, boardScale = 1, tagScale = 1, hideOn = null, edge = null }) {
  const { THREE } = kit, { clamp01, smooth } = K
  if (!document.getElementById('iso-street-deco-css')) { const st = document.createElement('style'); st.id = 'iso-street-deco-css'; st.textContent = DECO_CSS; document.head.append(st) }
  const pop = x => { x = clamp01(x); const u = x - 1; return 1 + 2.7 * u * u * u + 1.7 * u * u } // aufspringen mit Ueberschwingen
  const shops = [our, riv], accents = [p.accent, p.rivalAccent]
  const items = []
  // Punkt ueber dem Laden: Mitte der Front, knapp ueber dem Dach (9 m). Die Tafeln stehen unten an diesem Punkt und
  // ueberdecken wie im Vorbild das obere Geschoss; hoeher standen sie in der ersten Probe neben den Textzeilen
  const above = (shop, h) => { const c = shop.signCorners.reduce((a, v) => a.add(v), new THREE.Vector3()).multiplyScalar(0.25); return c.setY(h) }
  if (tagNames) {
    const tT = ctx.at('tags')
    shops.forEach((shop, i) => {
      const e = ctx.el('div', 'is-tag'), dot = ctx.el('i'); dot.style.background = accents[i]; e.append(dot, document.createTextNode(tagNames[i])); kit.wrap.append(e)
      // tBack ("reise"): die Schildchen kommen mit dem Kran wieder (im Vorbild ab rund 28,5 s, bis zum Schluss)
      items.push({ e, at: above(shop, top != null ? top + 1.4 : 10.4), w: 0, kind: 'tag', sc: tagScale, show: t => (pop((t - tT) / 0.32) * (tPan != null ? 1 - smooth((t - tPan) / 0.35) : 1) + (tBack != null ? pop((t - tBack) / 0.32) : 0)) * (hideOn ? 1 - Math.min(1, 1.5 * hideOn(t)) : 1) })
    })
  }
  if (p.boards) {
    const tB = ctx.at('boards'), tL = ctx.at('lines'), tO = ctx.at('boardsOut')
    if (!(tL >= tB && tO > tL)) ctx.fail(`Anker der Tafeln in der Reihenfolge "boards", "lines", "boardsOut" setzen (jetzt ${tB.toFixed(2)}, ${tL.toFixed(2)}, ${tO.toFixed(2)} s)`)
    // Zeilen wie auf einer Preistafel: Wellenlinie (Name), Punkte, Preis mit Euro-Zeichen. Gezeichnet ueber
    // stroke-dashoffset (pathLength 1), jede Zeile 0,12 s nach der vorigen
    const rows = [0, 1, 2].map(r => {
      const y = 12 + r * 26
      return `<path pathLength="1" d="M4 ${y} q6 -7 12 0 t12 0 t12 0" /><path pathLength="1" d="M52 ${y + 2} h34" stroke-dasharray="0.04 0.12" /><path pathLength="1" d="M100 ${y - 6} v12 M95 ${y - 2} h9 M95 ${y + 2} h9" />`
    })
    shops.forEach((shop, i) => {
      const e = ctx.el('div', 'is-board')
      e.innerHTML = `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="#F4F1EA" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${ICONS[p.boards]}</svg>` +
        `<svg class="ln" viewBox="0 0 126 78" fill="none" stroke="#E9E4DA" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">${rows.map((r, k) => `<g data-row="${k}">${r}</g>`).join('')}</svg>`
      kit.wrap.append(e)
      const paths = [...e.querySelectorAll('g')].map(g => [...g.querySelectorAll('path')])
      items.push({ e, at: above(shop, top != null ? top + 0.4 : 9.4), kind: 'board', sc: boardScale, show: t => pop((t - tB) / 0.36) * (1 - smooth((t - tO) / 0.3)),
        draw: t => paths.forEach((ps, k) => { const u = clamp01((t - tL - k * 0.12) / 0.3); for (const pa of ps) { if (pa.getAttribute('stroke-dasharray')) pa.style.opacity = u > 0 ? Math.min(1, u * 2) : 0; else pa.style.strokeDasharray = `${u} 1` } }) })
    })
  }
  const v = new THREE.Vector3()
  // "neon": Oberkante der Tafeln nie ueber y 470. In Fassung 2 standen sie ab y 300 und stiessen an die Woerter oben
  // ("Gleicher", "gleiche Preise."); im Vorbild haengen sie darunter. Die Pruefungen sahen das nicht, weil die Tafeln
  // keinen Pruefkasten haben. Ohne "neon" wie vorher.
  const BOARD_TOP = kit.PAL.neon ? 470 : -Infinity, BOARD_H = 262, BOARD_W = 230
  return {
    items,
    update(t) {
      for (const it of items) {
        const k = it.show(t)
        if (!(k > 0.01)) { it.e.style.opacity = '0'; it.e.style.display = 'none'; continue }
        v.copy(it.at).project(kit.camera)
        let x = (v.x + 1) / 2 * K.W
        let y = (1 - v.y) / 2 * K.H
        const sc = Math.max(0, Math.min(1.2, k)) * (it.sc || 1)
        if (it.kind === 'board') y = Math.max(y, BOARD_TOP + BOARD_H * sc)
        if (it.kind === 'board' && edge != null) { const hw = BOARD_W / 2 * (it.sc || 1); x = Math.min(K.W - edge - hw, Math.max(edge + hw, x)) }
        it.e.style.display = 'block'
        if (it.kind === 'tag') it.e.style.display = 'flex'
        // Mitte unten des Elements auf dem Punkt; Tafeln leicht gedreht wie schraeg gehaengt
        const tilt = it.kind === 'board' ? ' perspective(700px) rotateY(-12deg)' : ''
        it.e.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -100%) scale(${sc.toFixed(3)})${tilt}`
        it.e.style.opacity = String(Math.min(1, Math.max(0, k)).toFixed(3))
        if (it.draw) it.draw(t)
      }
    }
  }
}

// ================================================================================================ "reise": Raeume, Korb, Verkehr
// Farben der Raeume wie iso-shop "neon" (IN_NEON): "kalt" das volle Café (Blaugrau, Kacheln), "warm" das leere (Altrosa-Braun,
// gedimmt). Gemessen im Vorbild: kalt #4E5484 bis #546096, warm #6C4230 und #725454 (look.md). Review Fassung 3, Runde 1: die
// Raeume waren zu bunt und zu hart (blau-weisses Schachbrett, satt oranger Kasten; Boden bei 10,5 s im Median #1F3B7D, im
// Vorbild #333652; bei 24,5 s #5E2401 gegen #493135). Deshalb Kacheln nah beieinander, Waende graulila bzw. altrosa, Lichtsee
// halb so stark (poolK) und Kacheln halb so gross wie vorher (TILE 0,3 m; das Vorbild hat feine Kacheln). Das Licht im Raum fast
// neutral (vorher kraeftig blau bzw. orange, es faerbte Boden und Waende), der Boden leuchtet staerker selbst (floorE), der leere
// Raum ist heller (lampI 20 statt 16): im Vorbild ist er gedimmt, aber deutlich zu sehen (Helligkeit unten 46 bis 51).
// Runde 2: der Kachelboden las sich noch zu hart (p20/p80 bei 10,5 s #0C1338 / #7079A4 gegen #2A262A / #444864 im Vorbild): Kacheln
// naeher beieinander, im kalten Raum weniger Eigenleuchten
const ROOM_TONE = {
  kalt: { wall: '#6A6E8E', cap: '#D9E1FF', tileHi: '#50546A', tileLo: '#464A5E', wood: '#4A4C62', top: '#E9ECF4', counter: '#3A3F56', metal: '#CFD6EA', lamp: '#DCE0F2', lampI: 40, floorE: 0.6, glass: '#101A40', frame: '#9FB0E8', pool: '140,165,255', poolK: 0.5, coats: ['#2E3446', '#3E4560', '#4C5472', '#262A3A', '#5A6282', '#363C52', '#454C68', '#2A3044'],
    // Runde 4: Kleidung gedeckt bunt (grau, beige, braun, marine) mit Hautfarbe am Kopf wie im Vorbild bei 10,5 s; vorher alle schwarz
    // oder marine und dazu auf dunklen Schattenscheiben, der Raum las sich wie voller Spielfiguren
    muted: ['#6B6F78', '#8A7A66', '#4A4F5C', '#7D6A5A', '#5E6672', '#9A8B76', '#3F4553', '#6E5D50'], hair: ['#15161C', '#4A3226', '#2A2220', '#6A5040'], skin: ['#C9A28A', '#B88E74', '#D8B49C', '#9E7660'] },
  // Runde 3: gedeckt altrosa statt ziegelrot (gerendert bei 25,5 s Rueckwand #75392B, Saettigung 0,63; im Vorbild #5F4B4D bis #705652,
  // 0,21 bis 0,27; Boden #3F2D2F bis #473D41): Wand, Kacheln und Lichtsee grauer, Licht im Raum fast weiss
  warm: { wall: '#6A5A58', cap: '#E8D6CA', tileHi: '#564A4C', tileLo: '#443C40', wood: '#6E4A3C', top: '#E6D8C6', counter: '#4A3430', metal: '#D8CCC0', lamp: '#E8D8D0', lampI: 26, floorE: 0.32, glass: '#24140E', frame: '#B89080', pool: '235,200,180', poolK: 0.5, coats: ['#3A2A26'] }
}
const TILE = 0.3
// "reise", Runde 4: Laternenpaare auf der Allee (z in m; Nebenstrassen bei +-24 und +-48 bleiben frei) und Laenge des Arms (m)
const LAMP_AVE_REISE = [-40, -13, 15.5, 44]
const LAMP_ARM = 1.1, LAMP_H = 4.6
// Lichtsee einer Laterne in die Leuchttextur (globalCompositeOperation 'lighter'): Ellipse, quer zur Strasse (across: x bei der Allee)
// 7,5 m, laengs 5 m, innen fast flach. Zwei Seen eines Paars (Koepfe rund 10 m auseinander) ergeben in der Mitte zusammen rund 0,8 des
// Spitzenwerts: ein durchgehendes Band ueber die Fahrbahn wie im Vorbild, keine zwei runden Flecken.
function bandSpot(g, map, x, z, acrossX, rgb, a) {
  const rx = acrossX ? 6.8 : 5, rz = acrossX ? 5 : 6.8, m = map.m
  g.save(); g.translate(map.gx(x), map.gx(z)); g.scale(rx * m, rz * m)
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, 1)
  gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(0.5, `rgba(${rgb},${a * 0.62})`); gr.addColorStop(1, `rgba(${rgb},0)`)
  g.fillStyle = gr; g.fillRect(-1, -1, 2, 2); g.restore()
}
// "reise", Runde 4: Laternen wie im Vorbild. Dort liest sich eine Laterne von oben als heller, beiger Scheibenschein (Kern rund 25 px,
// Schein rund 45 px bei 33 s, Farbe #C6B49D) mit schwarzem Kopf und schwarzem Arm zur Fahrbahn; der Mast ist nicht zu sehen. Unsere
// (kit.lamps) waren ein beleuchteter Mast, der von oben wie ein Streichholz von 70 px aussah, mit 10 px kleiner Kugel und rundem
// Schein. Hier: dunkler, duenner Mast, Arm und Kopf schwarz (MeshBasic, unbeleuchtet), dahinter eine zur Kamera gedrehte Scheibe
// ohne Tonwertkurve (sonst kam die Farbe des Vorbilds verschoben an). Die Scheibe sitzt 0,6 m unter dem Kopf: so liegt sie im
// Tiefentest hinter Kopf und Arm, und beide stehen schwarz auf ihr. kit.lamps bleibt fuer alle anderen Wege unveraendert.
function buildLampsReise(kit, list, y0) {
  const { THREE, scene } = kit
  const n = list.length, m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), s = new THREE.Vector3(1, 1, 1)
  const pole = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.035, 0.045, LAMP_H, 6), new THREE.MeshBasicMaterial({ color: '#0A0B10' }), n)
  const arm = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.14, 0.14), new THREE.MeshBasicMaterial({ color: '#07080B' }), n)
  const head = new THREE.InstancedMesh(new THREE.BoxGeometry(0.46, 0.2, 0.46), new THREE.MeshBasicMaterial({ color: '#050608' }), n)
  const halo = kit.canvasTex(128, 128, (g, w) => {
    const r = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2)
    r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.38, 'rgba(255,255,255,.95)'); r.addColorStop(0.52, 'rgba(255,255,255,.55)'); r.addColorStop(0.78, 'rgba(255,255,255,.12)'); r.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = r; g.fillRect(0, 0, w, w)
  })
  const haloMat = new THREE.SpriteMaterial({ map: halo, color: '#CDBBA2', transparent: true, opacity: 0.95, depthWrite: false, toneMapped: false })
  list.forEach(({ x, z, ax, az }, k) => {
    const hx = x + ax * LAMP_ARM, hz = z + az * LAMP_ARM
    m4.compose(v.set(x, y0 + LAMP_H / 2, z), q.identity(), s.set(1, 1, 1)); pole.setMatrixAt(k, m4)
    q.setFromAxisAngle(v.set(0, 1, 0), az !== 0 ? Math.PI / 2 : 0)
    m4.compose(v.set(x + ax * LAMP_ARM / 2, y0 + LAMP_H, z + az * LAMP_ARM / 2), q, s.set(LAMP_ARM + 0.1, 1, 1)); arm.setMatrixAt(k, m4)
    m4.compose(v.set(hx, y0 + LAMP_H - 0.05, hz), q.identity(), s.set(1, 1, 1)); head.setMatrixAt(k, m4)
    const sp = new THREE.Sprite(haloMat); sp.scale.set(3.0, 3.0, 1); sp.position.set(hx, y0 + LAMP_H - 0.6, hz); sp.name = 'laterne'; scene.add(sp)
  })
  scene.add(pole, arm, head)
  return { pole, arm, head }
}
// "reise", Runde 4: Aussenseite der Cafés wie im Vorbild. Dort ist das Obergeschoss braun mit drei gerahmten Fenstern (eins hell), die
// Markise weiss und in der Ladenfarbe gestreift und leuchtet von unten, und das volle Café hat ein Erdgeschoss aus hellblauem Glas, an
// der Front und an der Seite zur Allee (bei 9,0 bis 9,6 s leuchtet diese Ecke). Bei uns: schwarzes Obergeschoss mit vier kleinen
// Quadraten, Markise schwarz und weiss, keine Glaswand. kit.shop bleibt unveraendert (alte Videos); hier wird der fertige Laden
// umgebaut. Alles haengt am Deckel und hebt mit ihm ab; lidSet wird so erweitert, dass die neuen Teile mit ausblenden.
// fadeSign: der Name auf dem Schild verblasst, sobald der Deckel abhebt (gegenueber: im Vorbild ist bei 23,3 bis 23,5 s nur der Raum
// zu sehen, bei uns stand das steigende "Café 2" in der zweiten Textzeile).
function dressShopReise(kit, K, shop, { full, accent, SH, fadeSign = false }) {
  const { THREE, std, canvasTex, RoundedBoxGeometry } = kit
  const { w, h } = SH, GF = shop.room.gf, extra = []
  const add = (mesh, x, y, z, ry = 0) => { mesh.position.set(x, y, z); mesh.rotation.y = ry; mesh.castShadow = false; mesh.receiveShadow = false; shop.lid.add(mesh); const ms = Array.isArray(mesh.material) ? mesh.material : [mesh.material]; for (const m of ms) { m.transparent = true; extra.push(m) } return mesh }
  const ax = a => shop.flip ? -w + a : -a
  // Markise: weiss und Ladenfarbe, leuchtet (Material des Ladens an Ort und Stelle umgestellt, damit lidSet es weiter ausblendet)
  const aw = shop.lid.children.find(o => o.isMesh && Math.abs(o.rotation.x - 0.36) < 1e-6)
  if (aw) {
    const tex = canvasTex(512, 64, (g, cw, chh) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#F4EFE6' : accent; g.fillRect(i * cw / 8, 0, cw / 8 + 1, chh) } })
    aw.material.map = tex; aw.material.emissive = new THREE.Color('#FFFFFF'); aw.material.emissiveMap = tex; aw.material.emissiveIntensity = 0.5; aw.material.needsUpdate = true
  }
  // Obergeschoss: braune Fassade vor den alten kleinen Fenstern, drei gerahmte Fenster, das mittlere hell
  const yU = GF + (h - GF) / 2 + 0.05
  add(new THREE.Mesh(new THREE.PlaneGeometry(w - 0.2, h - GF - 0.45), std('#4A3432', { roughness: 0.9, emissive: '#3A2A2C', emissiveIntensity: 0.45 })), -w / 2, yU, 0.115).name = 'fassade'
  const frameM = std('#B9B2AA', { roughness: 0.6, emissive: '#B9B2AA', emissiveIntensity: 0.25 })
  for (const [i, a] of [w * 0.2, w * 0.5, w * 0.8].entries()) {
    add(new THREE.Mesh(new RoundedBoxGeometry(1.45, 1.7, 0.08, 2, 0.03), frameM), ax(a), yU, 0.16)
    add(new THREE.Mesh(new THREE.PlaneGeometry(1.15, 1.4), new THREE.MeshBasicMaterial({ color: i === 1 ? '#EEC48A' : '#1B2234', toneMapped: false })), ax(a), yU, 0.205)
  }
  // Volles Café: Glas an der Seite zur Allee (Seitenwand zur Kamera, farX) und ueber die ganze Front, von innen hellblau
  if (full) {
    const glassTex = canvasTex(256, 128, (g, cw, chh) => {
      const gr = g.createLinearGradient(0, 0, 0, chh); gr.addColorStop(0, '#A9BCFF'); gr.addColorStop(0.55, '#5878F0'); gr.addColorStop(1, '#2F4BD0')
      g.fillStyle = gr; g.fillRect(0, 0, cw, chh); g.fillStyle = 'rgba(20,28,70,.75)'
      for (let i = 1; i < 6; i++) g.fillRect(i * cw / 6 - 2, 0, 4, chh)
    })
    const side = shop.flip ? 0.012 : -w - 0.012, D = SH.d, gh = GF - 1.5
    add(new THREE.Mesh(new THREE.PlaneGeometry(D - 0.7, gh), new THREE.MeshBasicMaterial({ map: glassTex, toneMapped: false })), side, 0.42 + 0.25 + gh / 2, -D / 2, shop.flip ? Math.PI / 2 : -Math.PI / 2).name = 'glaswand'
  }
  const sign = shop.signMat, base = shop.lidSet
  shop.lidSet = (lift, k) => {
    base(lift, k)
    for (const m of extra) m.opacity = k
    if (fadeSign) sign.opacity *= 1 - K.smooth(lift / 5)
  }
  return shop
}
// "reise", Runde 4: Ampel (Mast, Kasten, drei Lichter nach Sueden, das gelbe an, mit kleinem Schein)
function buildTrafficLight(kit, x, z, y0) {
  const { THREE, scene, RoundedBoxGeometry } = kit
  const g = new THREE.Group(); g.position.set(x, y0, z); g.name = 'ampel'; scene.add(g)
  const dark = new THREE.MeshLambertMaterial({ color: '#16171D' })
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 3.0, 8), dark); pole.position.y = 1.5; g.add(pole)
  const box = new THREE.Mesh(new RoundedBoxGeometry(0.34, 0.95, 0.28, 2, 0.05), dark); box.position.y = 3.35; g.add(box)
  for (const [k, c] of [[1, '#3A1012'], [0, '#FFB43A'], [-1, '#0E2A18']]) {
    const l = new THREE.Mesh(new THREE.CircleGeometry(0.1, 14), new THREE.MeshBasicMaterial({ color: c, toneMapped: false })); l.position.set(0, 3.35 + k * 0.29, 0.145); g.add(l)
  }
  kit.glow('#FFB43A', 1.0, new THREE.Vector3(x, y0 + 3.35, z + 0.3), 0.45)
  g.traverse(o => { if (o.isMesh) o.castShadow = false })
  return g
}
// "reise", Runde 4: Fenster wie kit.windows, aber 1,0 x 1,25 m und die dunklen in #1A2132 statt fast schwarz (on wie kit.windowTint)
function buildWindowsReise(kit, list) {
  const { THREE, scene } = kit
  const mesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(1.0, 1.25), new THREE.MeshBasicMaterial({ color: '#FFFFFF' }), list.length)
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), s = new THREE.Vector3(1, 1, 1), off = new THREE.Color('#1A2132')
  list.forEach((wd, k) => {
    m4.compose(v.set(wd.x, wd.y, wd.z), q.setFromEuler(e.set(0, wd.ry, 0)), s); mesh.setMatrixAt(k, m4)
    mesh.setColorAt(k, wd.on < 0.13 ? kit.windowTint(wd.on) : off)
  })
  scene.add(mesh); return mesh
}
// "reise": Farben der Stadt (siehe build, CITY)
// Runde 4: blauer (Review: Daecher und Fassaden im Median #07070F gegen #050A15 im Vorbild, unten links (5,6,12) gegen (7,8,17))
const CITY_REISE = ['#2A3148', '#323950', '#272E44', '#363D55', '#2E354C']
const PARKED = ['#3A4250', '#4A3E44', '#34444A', '#46464F', '#3E3A4C']
// "reise" (Runde 3): Rechteck [x0, x1, z0, z1] ohne die Flaechen in free. Das groesste freie Stueck (beide Seiten mindestens 3 m),
// oder null. So bleibt hinter und neben einem Café eine Masse stehen, statt dass der ganze Viertelblock entfaellt.
function clipFree(r, free) {
  const ov = (a, b) => a[1] > b[0] && a[0] < b[1] && a[3] > b[2] && a[2] < b[3]
  const hit = free.filter(k => ov(r, k))
  if (!hit.length) return r
  let best = null
  for (const k of hit) for (const c of [[r[0], Math.min(r[1], k[0]), r[2], r[3]], [Math.max(r[0], k[1]), r[1], r[2], r[3]], [r[0], r[1], r[2], Math.min(r[3], k[2])], [r[0], r[1], Math.max(r[2], k[3]), r[3]]]) {
    if (c[1] - c[0] < 3 || c[3] - c[2] < 3 || free.some(f => ov(c, f))) continue
    if (!best || (c[1] - c[0]) * (c[3] - c[2]) > (best[1] - best[0]) * (best[3] - best[2])) best = c
  }
  return best
}
// Ruecklicht von kit.car in "reise": statt des 1,4 m breiten leuchtenden Streifens zwei kleine, matte Punkte. Der Streifen war
// im Bild das Einzige, was man vom Auto sah, und stand neben den Woertern wie ein roter Strich (Review Fassung 3, Runde 1).
// kit.car selbst bleibt unveraendert (alte Videos), hier wird das fertige Auto umgebaut.
function dimTail(kit, car) {
  const tl = car.children.find(o => o.isMesh && o.material.isMeshBasicMaterial && o.material.color.getHexString() === 'ff4d6d')
  if (!tl) return car
  tl.material = new kit.THREE.MeshBasicMaterial({ color: '#5A1A22' })
  tl.scale.set(0.16, 1, 1); tl.position.x = -0.6
  const tr = tl.clone(); tr.position.x = 0.6; car.add(tr)
  return car
}
// Tische im Raum als (u, v): u = Abstand von der Wand zur Ecke, v = von der Front nach innen (Meter). Theke hinten an der
// Rueckwand von der Ecke aus, davor die Schlange. Im leeren Café fehlt der Tisch vorn in der Mitte: dort steigt der Korb auf.
const TABLES = [[2.0, 1.5], [4.7, 1.4], [7.5, 1.6], [3.1, 3.6], [5.9, 3.5], [8.3, 3.8]]

// Raum im hohlen Laden (kit.shop hollow): Kachelboden mit Lichtflecken, Theke mit Maschine, Regale, Fenster an den zwei
// stehenden Waenden, runde Tische mit Stuehlen; "full": an jedem Tisch zwei Gaeste, drei in der Schlange, zwei stehen, der
// Inhaber hinter der Theke (im Vorbild gedraengt voll); sonst nur der Inhaber. update(t, open): sichtbar nur, solange der
// Deckel nicht ganz zu ist (spart Zeichnen), Gaeste wiegen sich (reine Funktion von t).
// mirror (Runde 2, nur das volle Café): Theke, Regale, Tafeln, Fenster der Rueckwand und die Leute davor vom anderen Ende der Rueckwand
// aus, also an der offenen Seite. Im Vorbild steht die Theke dort (bei 10,5 s links vorn im Bild); bei uns stand sie hinten an der Ecke.
async function buildRoom({ kit, K, shop, tone, full, SH, CURB, mirror = false }) {
  const { THREE, RoundedBoxGeometry, std, lam, canvasTex } = kit
  const T = ROOM_TONE[tone], r = shop.room, g = shop.g, flip = shop.flip
  const grp = new THREE.Group(); g.add(grp)
  const LX = u => flip ? -SH.w + u : -u, LZ = v => -v, UB = u => mirror ? SH.w - u : u
  const Y = r.y, D = SH.d, WT = r.wt
  const mats = new Map(), M = (c, o = {}) => { const k = c + JSON.stringify(o); if (!mats.has(k)) mats.set(k, std(c, { roughness: 0.75, ...o })); return mats.get(k) }
  const add = (geo, mat, u, y, v, ry = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(LX(u), y, LZ(v)); m.rotation.y = ry; m.castShadow = true; m.receiveShadow = true; grp.add(m); return m }
  const box = (w, h, d, rad = 0.04) => new RoundedBoxGeometry(w, h, d, 2, Math.min(rad, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001))
  const tables = full ? TABLES : TABLES.filter((_, i) => i !== 1)
  // ---- Boden: Kacheln, Lichtflecken unter den Tischen und vor der Theke, dunkler an den Waenden. Leuchtet schwach selbst
  // (emissive), damit der Raum in der fast schwarzen Nacht das Hellste nach den Laeden ist wie im Vorbild
  const FW = r.x1 - r.x0, FD = r.z1 - r.z0, PX = 96
  const fx = x => (x - r.x0) * PX, fz = z => (z - r.z0) * PX
  const floorTex = canvasTex(Math.round(FW * PX), Math.round(FD * PX), (c, cw, ch) => {
    const TL = TILE
    for (let z = r.z0, i = 0; z < r.z1; z += TL, i++) for (let x = r.x0, j = 0; x < r.x1; x += TL, j++) { c.fillStyle = (i + j) % 2 ? T.tileHi : T.tileLo; c.fillRect(fx(x), fz(z), TL * PX + 1, TL * PX + 1) }
    c.globalCompositeOperation = 'lighter'
    const pool = (x, z, rad, a) => { const gr = c.createRadialGradient(fx(x), fz(z), 0, fx(x), fz(z), rad * PX); gr.addColorStop(0, `rgba(${T.pool},${a})`); gr.addColorStop(1, `rgba(${T.pool},0)`); c.fillStyle = gr; c.fillRect(0, 0, cw, ch) }
    for (const [u, v] of tables) pool(LX(u), LZ(v), 1.7, (full ? 0.22 : 0.12) * T.poolK)
    pool(LX(UB(3)), LZ(D - 2.9), 2.4, (full ? 0.25 : 0.14) * T.poolK)
    c.globalCompositeOperation = 'source-over'
    c.filter = `blur(${Math.round(0.35 * PX)}px)`; c.fillStyle = 'rgba(4,6,14,.55)'
    c.fillRect(0, 0, cw, 0.5 * PX)
    c.fillRect(flip ? 0 : cw - 0.5 * PX, 0, 0.5 * PX, ch)
    c.filter = 'none'
  })
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(FW, FD), lam('#FFFFFF', { map: floorTex, emissive: '#FFFFFF', emissiveMap: floorTex, emissiveIntensity: T.floorE }))
  floor.rotation.x = -Math.PI / 2; floor.position.set((r.x0 + r.x1) / 2, Y + 0.012, (r.z0 + r.z1) / 2); floor.receiveShadow = true; grp.add(floor)
  // ---- Theke an der Rueckwand, von der Ecke aus; dahinter Arbeitsplatte mit Maschine, darueber Regale
  const C0 = 0.7, C1 = 5.6, CV = D - 2.3
  add(box(C1 - C0, 1.05, 0.75), M(T.wood), UB((C0 + C1) / 2), Y + 0.525, CV)
  add(box(C1 - C0 + 0.12, 0.08, 0.86), M(T.top, { roughness: 0.4 }), UB((C0 + C1) / 2), Y + 1.09, CV)
  // Vitrine auf der Theke (leuchtet kuehl bzw. warm): liest sich von oben als "Café"
  add(box(1.3, 0.5, 0.6), new THREE.MeshBasicMaterial({ color: new THREE.Color(T.lamp).multiplyScalar(0.8), transparent: true, opacity: 0.85 }), UB(C1 - 1.0), Y + 1.38, CV)
  const BV = D - WT - 0.35
  add(box(C1 - C0, 0.95, 0.6), M(T.counter), UB((C0 + C1) / 2), Y + 0.475, BV)
  add(box(0.95, 0.75, 0.55, 0.08), M(T.metal, { roughness: 0.3, metalness: 0.5 }), UB(1.9), Y + 1.33, BV)
  add(box(0.4, 0.6, 0.4, 0.06), M('#2A2C36'), UB(3.0), Y + 1.25, BV)
  for (let k = 0; k < 5; k++) add(new THREE.CylinderGeometry(0.09, 0.07, 0.16, 10), M('#F2F2F4', { roughness: 0.4 }), UB(3.6 + k * 0.32), Y + 1.03, BV)
  for (const yy of [2.5, 3.3]) {
    add(box(C1 - C0 - 0.6, 0.07, 0.34), M(T.wood), UB((C0 + C1) / 2), Y + yy, D - WT - 0.18)
    for (let k = 0; k < 9; k++) add(box(0.2, 0.32, 0.2, 0.05), M(['#C9A060', '#8A9AC8', '#E2DCCF', '#7A5A4A'][k % 4]), UB(C0 + 0.6 + k * 0.5), Y + yy + 0.2, D - WT - 0.2)
  }
  // ---- Fenster an Rueckwand (hinter den Tischen) und an der Wand zur Ecke: Rahmen hell, Glas nachtdunkel
  const glass = new THREE.MeshBasicMaterial({ color: T.glass }), frame = M(T.frame, { roughness: 0.5, emissive: T.frame, emissiveIntensity: 0.12 })
  for (const u of [6.8, 8.5].map(UB)) { add(box(1.25, 1.75, 0.08), frame, u, Y + 2.35, D - WT - 0.03); add(new THREE.PlaneGeometry(1.05, 1.55), glass, u, Y + 2.35, D - WT - 0.08) }
  for (const v of [2.0, 4.3]) {
    const ry = flip ? Math.PI / 2 : -Math.PI / 2
    add(box(1.25, 1.75, 0.08), frame, WT + 0.03, Y + 2.35, v, ry)
    add(new THREE.PlaneGeometry(1.05, 1.55), glass, WT + 0.08, Y + 2.35, v, ry)
  }
  // ---- Menuetafeln ueber den Regalen und eine Uhr an der Wand zur Ecke, wie im Vorbild (dort lesen sich die Raeume an diesen
  // Dingen als Café; Review Fassung 3, Runde 1)
  const boardM = M('#16171E', { roughness: 0.9 }), lineM = new THREE.MeshBasicMaterial({ color: '#B8B2A6' })
  for (const u of [1.7, 3.15, 4.6].map(UB)) {
    add(box(1.2, 0.85, 0.06, 0.03), boardM, u, Y + 4.15, D - WT - 0.05)
    for (let k = 0; k < 3; k++) add(new THREE.PlaneGeometry(0.8, 0.05), lineM, u, Y + 4.38 - k * 0.22, D - WT - 0.09)
  }
  const clockRy = flip ? Math.PI / 2 : -Math.PI / 2
  add(new THREE.CylinderGeometry(0.38, 0.38, 0.06, 24), M('#ECE8E0', { roughness: 0.5 }), WT + 0.04, Y + 3.95, 3.15, 0).rotation.set(0, 0, Math.PI / 2)
  add(box(0.04, 0.26, 0.02, 0.01), M('#1A1A20'), WT + 0.08, Y + 4.03, 3.15, clockRy)
  // ---- Tische (rund, helle Platte) mit zwei Stuehlen
  const topM = M(T.top, { roughness: 0.45 }), legM = M('#1C1E26'), chairM = M(T.wood)
  for (const [u, v] of tables) {
    add(new THREE.CylinderGeometry(0.46, 0.46, 0.06, 20), topM, u, Y + 0.8, v)
    add(new THREE.CylinderGeometry(0.06, 0.06, 0.76, 8), legM, u, Y + 0.4, v)
    add(new THREE.CylinderGeometry(0.26, 0.28, 0.04, 14), legM, u, Y + 0.03, v)
    for (const s of [-1, 1]) {
      add(box(0.42, 0.06, 0.42), chairM, u + s * 0.78, Y + 0.48, v)
      add(box(0.06, 0.5, 0.42), chairM, u + s * 0.99, Y + 0.76, v)
    }
  }
  // ---- Licht im Raum: kuehl bzw. warm von oben (es faellt nur, wenn der Deckel ab ist, auf das, was die Kamera sieht)
  const lampPos = new THREE.Vector3(LX(SH.w / 2), Y + 4.2, LZ(D / 2))
  const light = kit.pointLight(grp, lampPos.toArray(), T.lamp, T.lampI, 13, 1.2)
  // ---- Leute (in der Welt, wie alle Figuren des Baukastens)
  const people = [], wp = new THREE.Vector3()
  const place = (u, v, ry, sit, k) => {
    const f = T.muted ? kit.person({ coat: T.muted[k % T.muted.length], legs: '#22242C', hair: T.hair[k % T.hair.length], skin: T.skin[(k * 3) % T.skin.length], scale: 0.8, y0: CURB + Y })
      : kit.person({ coat: T.coats[k % T.coats.length], legs: '#181A22', hair: k % 3 ? '#15161C' : '#4A3226', skin: '#B89A86', scale: 0.8, y0: CURB + Y })
    // Runde 4: Schattenscheibe nur noch angedeutet (0,3 statt 0,7)
    f.blob.material.opacity = 0.3
    g.localToWorld(wp.set(LX(u), 0, LZ(v)))
    f.at(wp.x, wp.z, shop.rot + ry)
    if (sit) { f.fig.position.y = CURB + Y - 0.12; f.legL.rotation.x = f.legR.rotation.x = -1.45 }
    people.push({ f, ph: k * 1.37, sit })
  }
  const face = (u, v, tu, tv) => Math.atan2(LX(tu) - LX(u), LZ(tv) - LZ(v))
  // Inhaber hinter der Theke, schaut nach vorn
  place(UB(2.8), D - 1.3, 0, false, 0)
  if (full) {
    // Runde 4: 14 Leute im Raum statt 18 (Review: im Vorbild rund 22 Leute im ganzen Bild, bei uns rund 40 mit der Menge davor): an
    // jedem zweiten Tisch nur einer, eine Person steht statt zwei
    let k = 1
    tables.forEach(([u, v], ti) => { for (const s of ti % 2 ? [1] : [-1, 1]) place(u + s * 0.78, v, face(u + s * 0.78, v, u, v), true, k++) })
    for (const u of [1.6, 2.7, 3.8]) place(UB(u), CV - 1.15, Math.atan2(0, LZ(CV) - LZ(CV - 1.15)), false, k++)
    place(UB(5.0), 5.1, face(UB(5.0), 5.1, UB(4.2), 5.2), false, k++)
  }
  return {
    people: people.length, tables: tables.length,
    // Mitte der Theke in der Welt (Runde 2: im vollen Café an der offenen Seite, tools/test_3d_nachbau_v3.mjs)
    counterAt: () => g.localToWorld(new THREE.Vector3(LX(UB((C0 + C1) / 2)), Y + 1, LZ(CV))).toArray(),
    update(t, open) {
      grp.visible = open; light.visible = open
      for (const x of people) {
        x.f.fig.visible = x.f.blob.visible = open
        if (!open) continue
        const ph = t * 1.8 + x.ph
        x.f.body.rotation.z = 0.035 * Math.sin(ph)
        x.f.armR.rotation.x = -0.45 * Math.max(0, Math.sin(ph * 0.8))
      }
    }
  }
}

// Drahtkorb vor dem leeren Café ("reise"): steigt auf dem Gehweg vor der offenen Front auf (unten in der Bildmitte), links
// darueber eine Papier-Stempelkarte und eine E-Mail, die hineinfallen (wie iso-shop "trash"). In der ersten Fassung 3 stand er
// silbern mitten im Raum (Review Runde 1), in Runde 2 als dunkler Eimer; seit Runde 3 wie im Vorbild ein heller, durchsichtiger
// Drahtkorb mit duennem goldenem Rand vorn an der Kante. Er geht mit dem Deckel
// (T.gone): im Vorbild ist er weg, sobald das Dach wieder drauf ist. Karte und Umschlag sind flache Tafeln, die zur Kamera
// schauen. state()/box() fuer Tests und Pruefkasten.
async function buildTrash({ ctx, kit, K, shop, SH, CURB, T: T0, icon }) {
  const { THREE, std, lam, canvasTex } = kit
  const { clamp01, lerp, smooth } = K
  if (!(T0.card >= T0.up && T0.mail >= T0.card && T0.drop > T0.mail + 0.3)) ctx.fail(`"camera": "reise": Anker "trash", "trashCard", "trashMail", "trashDrop" in dieser Reihenfolge, fallen mindestens 0,3 s nach der E-Mail (jetzt ${[T0.up, T0.card, T0.mail, T0.drop].map(x => x.toFixed(2)).join(', ')} s)`)
  const flip = shop.flip, LX = u => flip ? -SH.w + u : -u
  // Runde 2: groesser (im Vorbild rund 22 % der Bildbreite, unser Korb 17 %) und vorn an der Kante ueber dem Gehweg statt auf dem
  // Boden des Raums
  const at0 = shop.g.localToWorld(new THREE.Vector3(LX(SH.w * 0.75), 0, 1.4))
  const BR = 1.5, BH = 3.4
  const g = new THREE.Group(); g.position.copy(at0); g.visible = false; kit.scene.add(g)
  const wire = canvasTex(512, 256, (c, w, h) => {
    c.strokeStyle = '#F2F4FA'; c.lineWidth = 8
    for (let i = -16; i <= 32; i++) { c.beginPath(); c.moveTo(i * 60, 0); c.lineTo(i * 60 + h, h); c.stroke(); c.beginPath(); c.moveTo(i * 60, h); c.lineTo(i * 60 + h, 0); c.stroke() }
  }, { sharp: true })
  // Runde 2: im Vorbild ein dunkler, undurchsichtiger Koerper (#1C1F20) mit klarem hellgrauem Rautendraht (Helligkeit p90 rund 95); unser
  // Gitter war dicht, dunkel und liess den Boden durchscheinen (Median #0D0B1A, p90 51): bei 27,4 s nur ein dunkler Fleck. Deshalb
  // groebere Rauten, hellerer Draht und innen ein dunkler Mantel (nur Innenseite), der den Boden verdeckt.
  wire.wrapS = THREE.RepeatWrapping; wire.repeat.set(1, 1)
  // Runde 3: ohne den dunklen Mantel innen und mit hellerem Draht. Der Mantel las sich als schwarzer Eimer mit grosser schwarzer
  // Oeffnung (bei 540 x 960 ein Fleck von 150 x 110 px); im Vorbild ist es ein heller Drahtkorb, durch den die Kacheln scheinen, mit
  // duennem goldenem Rand
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(BR, BR * 0.82, BH, 40, 1, true), std('#FFFFFF', { map: wire, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.6, metalness: 0.2, color: '#B8BCC4', emissive: '#6A6E78', emissiveMap: wire, emissiveIntensity: 0.8 }))
  mesh.position.y = BH / 2; g.add(mesh)
  const rimM = std('#B08A48', { roughness: 0.4, metalness: 0.3, emissive: '#4A3410', emissiveIntensity: 0.6 })
  const rim = new THREE.Mesh(new THREE.TorusGeometry(BR, 0.07, 8, 48), rimM); rim.rotation.x = Math.PI / 2; rim.position.y = BH; g.add(rim)
  const foot = new THREE.Mesh(new THREE.TorusGeometry(BR * 0.82, 0.05, 8, 40), rimM); foot.rotation.x = Math.PI / 2; foot.position.y = 0.04; g.add(foot)
  // Boden in der Farbe der Kacheln des leeren Raums, nicht als dunkle Scheibe
  const bottom = new THREE.Mesh(new THREE.CircleGeometry(BR * 0.82, 32), lam(ROOM_TONE.warm.tileLo)); bottom.rotation.x = -Math.PI / 2; bottom.position.y = 0.03; g.add(bottom)
  g.traverse(o => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false } })
  const img = new Image()
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 24 24" fill="none" stroke="#6A4A2A" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${ICONS[icon]}</svg>`)
  await img.decode()
  const cardTex = canvasTex(640, 400, (c, w, h) => {
    c.fillStyle = '#EFE3C4'; c.beginPath(); c.roundRect(0, 0, w, h, 28); c.fill()
    c.strokeStyle = 'rgba(120,90,50,.35)'; c.lineWidth = 4; c.beginPath(); c.roundRect(14, 14, w - 28, h - 28, 20); c.stroke()
    c.fillStyle = '#5A4630'; c.font = `700 34px ${ctx.B.body}`; c.textBaseline = 'middle'; c.fillText('STEMPELKARTE', 46, 66)
    for (let i = 0; i < 10; i++) {
      const x = 92 + (i % 5) * 114, y = 180 + Math.floor(i / 5) * 116
      c.strokeStyle = '#7A6448'; c.lineWidth = 4; c.setLineDash([9, 8]); c.beginPath(); c.arc(x, y, 40, 0, Math.PI * 2); c.stroke(); c.setLineDash([])
      if (i < 3) c.drawImage(img, x - 30, y - 30, 60, 60)
    }
  }, { sharp: true })
  const mailTex = canvasTex(560, 400, (c, w, h) => {
    c.fillStyle = '#F4F5F8'; c.beginPath(); c.roundRect(0, 0, w, h, 22); c.fill()
    c.strokeStyle = '#B9BCC8'; c.lineWidth = 7; c.lineJoin = 'round'
    c.beginPath(); c.moveTo(18, 22); c.lineTo(w / 2, h * 0.56); c.lineTo(w - 18, 22); c.stroke()
    c.beginPath(); c.moveTo(18, h - 22); c.lineTo(w * 0.4, h * 0.48); c.moveTo(w - 18, h - 22); c.lineTo(w * 0.6, h * 0.48); c.stroke()
    c.fillStyle = '#8A8EA0'; c.font = `700 58px ${ctx.B.body}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('@', w * 0.82, h * 0.8)
  }, { sharp: true })
  const flat = (tex, w, h) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, depthWrite: false, fog: false })); m.renderOrder = 9; m.visible = false; kit.scene.add(m); return m }
  const card = flat(cardTex, 2.6 * 1.3, 1.63 * 1.3), mail = flat(mailTex, 2.15 * 1.3, 1.54 * 1.3)
  const pop = x => { x = clamp01(x); const u = x - 1; return 1 + 2.7 * u * u * u + 1.7 * u * u }
  const right = new THREE.Vector3()
  return {
    update(t) {
      const up = pop((t - T0.up) / 0.45) * (T0.gone != null ? 1 - smooth((t - T0.gone) / 0.25) : 1)
      g.visible = t >= T0.up && up > 0.01; const sc = Math.max(0.01, up); g.scale.set(sc, sc, sc)
      const fall = clamp01((t - T0.drop) / 0.5), fallE = fall * fall
      const cam = kit.camera; right.set(1, 0, 0).applyQuaternion(cam.quaternion); right.y = 0; right.normalize()
      const put = (m, t0, dx, y0, tilt, ph) => {
        const k = pop((t - t0) / 0.35)
        m.visible = t >= t0 && fall < 1
        if (!m.visible) return
        const bob = 0.07 * Math.sin((t - t0) * 2.2 + ph)
        m.position.set(at0.x, at0.y + lerp(BH + y0 + bob, BH * 0.55, fallE), at0.z).addScaledVector(right, lerp(dx, 0, fallE))
        m.quaternion.copy(cam.quaternion); m.rotateZ(tilt * (1 - fallE))
        m.scale.setScalar(Math.max(0.01, k * lerp(1, 0.6, fallE)))
      }
      // wie im Vorbild die Karte links ueber dem Korb, die E-Mail rechts daneben etwas hoeher
      put(card, T0.card, -2.6, 1.4, 0.1, 0); put(mail, T0.mail, 1.6, 2.0, -0.12, 1.3)
    },
    group: g,
    box: () => g.visible ? kit.meshBox([g]) : null,
    state: () => ({ bin: g.visible ? +g.scale.y.toFixed(3) : 0, card: card.visible, mail: mail.visible, r: BR, h: BH, inner: false, wire: '#' + mesh.material.color.getHexString() })
  }
}

// Verkehr ("reise"): ein roter Bus und drei Autos mit Scheinwerfern, wie im Vorbild (dort faehrt ein roter Bus vor dem
// leeren Café durch, spaeter ein Auto mit hellen Lichtern). Jede Lage ist eine reine Funktion von t (Fahrplan unten), kein
// Zustand. Fahrplan so gelegt, dass sich nie zwei auf der Kreuzung treffen und keiner durch die Menge vor dem vollen Café
// faehrt (die steht bis 2,3 m vor der Front, also bis an die Fahrspur x = +1,05).
// nsLane: Spur des Autos auf der Nord-Sued-Strasse (Runde 3: auf der breiten Allee x = -2,2 statt -1,05, die geparkten stehen bei -4,3)
function buildTraffic({ kit, K, C, nsLane = -1.05 }) {
  const { THREE, RoundedBoxGeometry, std, lam, blobTex } = kit
  // axis 'x': faehrt auf der Ost-West-Strasse (z = lane), 'z': auf der Nord-Sued-Strasse (x = lane); s(t) = s0 + dir * v * (t - t0)
  const PLAN = [
    // Bus: zwischen 1,5 und 3,5 s vor dem Café gegenueber und auf die Kreuzung, mitten im Bild (Review Fassung 3, Runde 1: vorher
    // fuhr er erst bei 3 bis 5,5 s am linken Bildrand und las sich als dunkler Kasten)
    // Runde 2: wie im Vorbild bei 2,5 s vor dem Café gegenueber, bei 4 s auf der Kreuzung, bei 5 s vor dem vollen Café und bei 6 s vorbei
    { kind: 'bus', color: '#B3262E', axis: 'x', lane: 1.05, dir: 1, v: 7, s0: -24, t0: 0 },
    { kind: 'car', color: C.cars[0], axis: 'z', lane: nsLane, dir: 1, v: 7.2, s0: -62, t0: 0 },
    { kind: 'car', color: '#5A1F26', axis: 'x', lane: 1.05, dir: 1, v: 7, s0: -70, t0: 14 },
    // Runde 2: auf der suedlichen Spur nach Osten (vorher nach Westen auf der noerdlichen): seit beide Cafés an der Ost-West-Strasse
    // stehen, reicht die Menge vor dem vollen Café bis auf die noerdliche Spur. So faehrt er bei 25 bis 27 s vor dem leeren Café
    // vorbei wie das Auto mit hellen Scheinwerfern im Vorbild.
    { kind: 'car', color: '#2A3A44', axis: 'x', lane: 1.05, dir: 1, v: 7, s0: -91, t0: 14 }
  ]
  const lightM = new THREE.MeshBasicMaterial({ color: '#FFF4DC' })
  const head = (grp, len) => {
    for (const x of [-0.62, 0.62]) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.2, 0.06), lightM); m.position.set(x, 0.72, -len / 2 - 0.02); grp.add(m) }
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 6), new THREE.MeshBasicMaterial({ map: blobTex, color: '#FFE8C0', transparent: true, opacity: 0.38, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }))
    pool.rotation.x = -Math.PI / 2; pool.position.set(0, 0.04, -len / 2 - 3.2); pool.renderOrder = 4; grp.add(pool)
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: blobTex, color: '#FFF0D0', transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }))
    sp.scale.set(2.6, 2.6, 1); sp.position.set(0, 0.8, -len / 2 - 0.4); grp.add(sp)
  }
  const list = PLAN.map(pl => {
    let grp
    if (pl.kind === 'bus') {
      grp = new THREE.Group(); kit.scene.add(grp)
      // leicht selbstleuchtend: im Laternenlicht sonst ein dunkler Kasten, im Vorbild ist der Bus klar rot
      const body = new THREE.Mesh(new RoundedBoxGeometry(2.4, 2.6, 9.6, 2, 0.25), std(pl.color, { roughness: 0.5, emissive: '#5A1016', emissiveIntensity: 0.7 })); body.position.y = 1.55; grp.add(body)
      const roof = new THREE.Mesh(new RoundedBoxGeometry(2.2, 0.12, 9.0, 2, 0.05), std('#D8D0C8')); roof.position.y = 2.9; grp.add(roof)
      const winM = new THREE.MeshBasicMaterial({ color: '#F2E2B8' })
      // sieben einzelne Fenster je Seite statt eines Streifens (der Streifen las sich als heller Strich)
      for (const sx of [-1, 1]) for (let k = 0; k < 7; k++) { const w = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.85), winM); w.rotation.y = sx * Math.PI / 2; w.position.set(sx * 1.215, 2.05, 0.2 - 3.6 + k * 1.2); grp.add(w) }
      const front = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.0), winM); front.rotation.y = Math.PI; front.position.set(0, 2.05, -4.81); grp.add(front)
      for (const [wx, wz] of [[-1.15, 3.2], [1.15, 3.2], [-1.15, -3.2], [1.15, -3.2]]) { const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.3, 12), lam('#0C0D12')); wh.rotation.z = Math.PI / 2; wh.position.set(wx, 0.45, wz); grp.add(wh) }
      head(grp, 9.6)
    } else { grp = dimTail(kit, kit.car(kit.scene, 0, 0, 0, pl.color)); head(grp, 3.9) }
    grp.traverse(o => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false } })
    // Front zeigt im Modell nach -z; Drehung so, dass sie in Fahrtrichtung zeigt
    grp.rotation.y = pl.axis === 'x' ? (pl.dir > 0 ? -Math.PI / 2 : Math.PI / 2) : (pl.dir > 0 ? Math.PI : 0)
    return { pl, grp }
  })
  const pos = (pl, t) => pl.s0 + pl.dir * pl.v * Math.max(0, t - pl.t0)
  return {
    update(t) {
      for (const { pl, grp } of list) {
        const sv = pos(pl, t)
        grp.visible = Math.abs(sv) < 72
        if (pl.axis === 'x') grp.position.set(sv, 0, pl.lane); else grp.position.set(pl.lane, 0, sv)
      }
    },
    at: t => list.map(({ pl }) => { const sv = pos(pl, t); return { kind: pl.kind, axis: pl.axis, lane: pl.lane, x: +(pl.axis === 'x' ? sv : pl.lane).toFixed(3), z: +(pl.axis === 'x' ? pl.lane : sv).toFixed(3), visible: Math.abs(sv) < 72 } })
  }
}
