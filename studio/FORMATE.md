# Stampit Studio: zehn Formate und die Regeln der Abwechslung

Stand 17.11.2026, abends (nach der Gegenprüfung; Zeilen "Hook" nach der
Jury-Runde zu den Anfängen ergänzt). Der unbeaufsichtigte Lauf
liest diese Datei **ganz**, bevor er eine Idee wählt (`AUTOMATIK.md`,
Abschnitt 5) und bevor er das Skript schreibt (Schritt 15). Sie legt fest,
**wie** ein Video gebaut ist und was sich von Video zu Video wiederholen darf.
Was es sagen darf, bleibt bei `PRODUKT.md` (nur Klasse 1), der erste Satz bei
`HOOKS.md`, Laden und Thema bei `THEMEN.md`, Stil C (Tempo, Tafeln, Mischung)
bei `AUTOMATIK.md` 6. Wo diese Datei einer davon widerspricht, gelten die.
Hat eine Idee einen eigenen Plan (`docs/plaene/`), gilt in den Punkten, die
`AUTOMATIK.md` 5 unter "Was ein Plan ersetzt" aufzählt, der Plan, auch vor
den Zeilen "Takte", "Nie", "Produkt" und "Schluss" eines Formats und vor
"Handy spät". Die Regeln prüft `tools/abwechslung.mjs` (Abschnitt 2,
"Prüfen"); der Lauf trägt keine Felder mehr aus dem Kopf ein.

## 1. Warum es diese Datei gibt

Der Betreiber am 17.11.2026: "Merkst du eigentlich, dass du fast die gleichen
Videos die ganze Zeit machst?" Er hatte recht. Alle vier Videos bis dahin
liefen denselben Bogen, nur Laden und erster Satz wechselten:

| Video | Takt 1 | Takt 2 | Takt 3 | Takt 4 | Takt 5 | Schluss |
|---|---|---|---|---|---|---|
| 15.11. Kaffee aufs Haus | Papierkarte, Becherreihe | Papier: zerknickt, vergessen | Karte in der Wallet, Stempel | Sperrbildschirm "in Ladennähe" | Rechnung | Klingt interessant? KARTE |
| 16.11. Ist das koscher? | Sperrbildschirm, Straße | Karte von oben, Pointe | Karte in der Wallet, Scan | Straße, Karte voll, Karte von oben | Sperrbildschirm des Ladens | Klingt interessant? KARTE |
| 17.11. Döner gegenüber | zwei Läden | Wochenleiste, Tür | Rechnung, Papier im Altpapier | Karte im Handy, Stempel | Karte von oben, Sperrbildschirm | Stammkunden behalten? KARTE |
| 18.11. Salon | Handy mit Scan | Papier: zerknickt, vergessen, verloren | Pointe, Wallet, Scan, Stempel | Karte von oben, Sperrbildschirm | | Klingt interessant? SALON |

Den Bogen erzwangen die Vorlage, `THEMEN.md` ("läuft in einer Linie ..."),
`AUTOMATIK.md` 6 (Pointe mit `stamp-check` in jedem Video, Schluss fest) und
6.4 (`shop-map` "immer").

Die erste Fassung dieser Datei (17.11.2026, mittags) gab jedem Video einen
anderen Rahmen: Tipps, Kommentar, Uhr, Duell. Eine unabhängige Gegenprüfung
spielte danach die nächsten zehn Videos durch und fand: **der Rahmen wechselte,
der Inhalt nicht.** In allen zehn kam die Karte in der Wallet mit Scan und
Stempel vor, in sechs Papier; die drei Entwürfe sagten wieder "Der Stempel ist
sofort auf seinem Handy", "einmal den QR-Code", "Wallet, ohne App" (mit dem
Video vom 18.11. teilten sie 7 und 8 Gruppen aus vier gesprochenen Wörtern, die
alten Videos untereinander 0 bis 5); F07 ließ mit den Meme-Skripten den ganzen
alten Bogen zu; dasselbe Format kam alle vier Tage wieder, mit demselben
Einstieg und derselben Schlussfrage; und weil die Ideen der Reihe nach
drankamen, wären die neuen Formate erst nach Wochen gelaufen. Diese Fassung
regelt deshalb auch, **was** ein Video sagt (Kernaussage, Sätze), wie oft
Papier, Scan und Nähe vorkommen, und wählt **zuerst das Format**, dann das
Thema.

## 2. Abwechslung: Felder und Regeln

Jedes Video trägt in `meta` des Skripts und am Video auf dem Board diese
Felder (Schritt 15 und 19). Die mit "abgelesen" schreibt der Lauf nicht selbst,
er übernimmt sie aus `node studio/tools/abwechslung.mjs felder <ordner>`:

| Feld | Inhalt |
|---|---|
| `format` | `F01` bis `F10` (Abschnitt 4) |
| `kern_bild` | abgelesen aus dem Format (Zeile "Kern-Bild"): `zettel`, `kommentar`, `zahl`, `tag`, `duell`, `meme`, `naehe` |
| `einstieg` | abgelesen: Baustein des ersten Teils der ersten Szene |
| `motive` | abgelesen aus den Bausteinen: `naehe`, wenn `shop-map`, `shop-street` oder `lock-notification` vorkommt; `papier`, wenn `paper-card`, `guest-ghost`, `wallet-vanish`, `card-bin` oder `versus-split` vorkommt; `scan`, wenn ein `wallet-pass` den Scan zeigt (`"scan"` nicht `false`) oder einen neuen Stempel (`after` größer als `before`; Vorgaben 2 und 5), oder `versus-split` die Runde `vergessen` hat. **3D** (seit 18.11.2026): `naehe` auch bei `iso-street` mit `"mode": "nah"` und `phone-3d` mit `"mode": "lock"`; `scan` bei `phone-3d` (`"mode": "wallet"`, die Vorgabe) mit Scan oder neuem Stempel (Vorgaben `before` 6, `after` 8) und bei `iso-shop` mit Handy (Vorgabe `"phone": true`); `papier` bei `iso-shop` mit `"paper": true`. `iso-street` als Duell und `phone-3d` "design" zählen nicht. Sonst `[]` |
| `beleg_kern` | die **Kernaussage**: die Gruppe der einen Aussage, um die es geht. `ohne-app` (A2, A3), `stempeln` (B1, B2), `papier` (A4), `naehe` (C1), `gestalten` (D1, D2), `studie` (S1 bis S5), `rechnung` (Beispielrechnung), `tipps` (Rat ohne Produktaussage, F01 und F02). Welche ein Format erlaubt, steht in seiner Zeile "Kernaussage" |
| `studie` | nur F10: die Studie, `S1` bis `S5` |
| `schluss` | abgelesen: die Schlussfrage, wie sie im Video steht |
| `branche`, `thema` | wie bisher (`THEMEN.md`) |
| `meme`, `hook_muster` | `HOOKS.md` 4.5; seit dem 17.11.2026 auch am Video auf dem Board |

**Die letzten Videos** sind die Videos auf dem Board mit dem höchsten `datum`
vor dem Tag des neuen Videos (`ZIEL`), je Datum die höchste Fassung, verworfene
mitgezählt, `ersetzt` nicht, neuestes zuerst. Fehlt ein Feld, gilt die Tabelle
"Altbestand" unten; fehlt das Video dort, liest das Werkzeug es aus
`videos/<ordner>/script.json` (Format dann `A0`). Ein Video im Format `F07`
ohne Feld `meme` gilt als Meme-Video.

Ein neues Video muss **alle** Regeln erfüllen:

| Nr. | Regel |
|---|---|
| V1 | `format` ist keins der **letzten fünf** Videos (`A0`, der alte Bogen, zählt als `F08`). Dasselbe Format oder dasselbe Kern-Bild **mit demselben Laden** nicht unter den letzten zehn |
| V2 | Motiv `naehe` (Karte von oben, Straße, Sperrbildschirm) nur, wenn keins der letzten zwei Videos es hat: höchstens eins in drei |
| V3 | Motiv `papier` (jedes Bild einer Papierkarte) genauso: höchstens eins in drei |
| V4 | `einstieg` ist nicht der Einstieg eines der letzten zwei Videos, und er ist der Einstieg des Formats (Zeile "Einstieg") |
| V5 | `branche` ist nicht die des letzten Videos |
| V6 | `kern_bild` ist nicht das der **letzten drei** Videos |
| V7 | `schluss` hat höchstens zwei Wörter, ist die Frage des Formats und teilt **kein Wort** mit der Schlussfrage eines der letzten zwei Videos |
| V8 | Motiv `scan` (Karte in der Wallet mit Scan oder neuem Stempel) wie V2: höchstens eins in drei |
| V9 | `beleg_kern` ist eine Kernaussage des Formats und nicht die eines der letzten zwei Videos. Eine Studie (F10) nicht, wenn sie in den letzten 30 Tagen schon in einem Video war |
| V10 | Die Sätze sind neu: mit dem gesprochenen Text jedes der letzten drei Videos höchstens **zwei** gleiche Gruppen aus vier Wörtern (ohne Schlussfrage, Aufforderung und Ladenname); der Hook stand in den letzten 60 Tagen an keinem Video |
| V11 | Nie alle drei Motive `naehe`, `papier`, `scan` in einem Video (das war der alte Bogen). F07 hat höchstens `papier`, F08 nie `papier` |
| V12 | **Überwiegend neue Bilder** (seit 23.11.2026): mehr als die Hälfte der Teile des Videos (ohne den Schluss) zeigt ein Bild, das in keinem der **letzten fünf** Videos vorkam. Ein Bild ist sein Schlüssel aus Baustein und Ansicht (`abwechslung.mjs felder`, Feld `bilder`: zum Beispiel `phone-3d mode=wallet`, `iso-shop branch=doener start=door`); ein anderer Ladenname, eine andere Stempelzahl oder ein anderer Text machen kein neues Bild. Wiederverwenden ist die Ausnahme |

Zu V12: Der Betreiber am 23.11.2026, als er das Eis-Video vom selben Tag
verwarf: "Du nimmst einfach die Frames von anderen Videos und machst neue
Geschichten dazu." Nachgemessen: dort waren 5 von 9 Bildern schon in den
fünf Videos davor (Fallblatt, Pinnwand, Karte im Handy); im Döner-Video vom
24.11., dessen Bilder ihm gefielen, 9 von 12 neu. V12 fällt nie weg. Erfüllt
sie kein Format mehr, fehlen neue Bausteine oder Ansichten: dann baut der
Lauf das Video mit dem höchsten Anteil neuer Bilder, vermerkt es in
`pruefung`, und `meldung` sagt: "Mir gehen die neuen Bilder aus. Im Chat
können wir neue bauen." Neue Bausteine entstehen nur in einer begleiteten
Sitzung (`AUTOMATIK.md`, Regel 11).

Dazu gelten: Themenpause (7 Tage je `thema`) und **dasselbe Thema mit demselben
Laden frühestens nach 21 Tagen** (`AUTOMATIK.md` 5), Meme nur in F07 (`HOOKS.md`
4.1), H02 höchstens einmal je Durchlauf (`HOOKS.md` 1.6).

Warum diese Zahlen: mit drei Videos im Blick kam in der Gegenprüfung jedes
Format alle vier Tage wieder, F07 sogar mit demselben Laden und demselben
ersten Bild. Mit fünf hat jedes Format mindestens fünf Tage Pause, und die
zehn Formate laufen reihum. Papier, Scan und Nähe waren die drei Bilder des
alten Bogens; je höchstens eins in drei heißt: kein Video sieht mehr aus wie
das vom Vortag. V10 misst, was die Gegenprüfung gemessen hat: die alten Videos
teilten untereinander 0 bis 5 Gruppen, die Entwürfe mit dem 18.11. 7 und 8.

**Prüfen.** Vor dem Skript (Schritt 14) hält der Lauf die geplanten Felder
gegen die Regeln; nach dem Entwurf (Schritt 16) prüft das Werkzeug das
wirkliche Skript:

```bash
node "$R/studio/tools/abwechslung.mjs" pruefen "$R/studio/videos/<ordner>" --verlauf /tmp/stampit-lauf/verlauf.json --ziel <ZIEL>; echo "Ende-Code $?"
```

`verlauf.json` ist die Antwort der Abfrage der Videos ab `VOR60` aus Schritt 6,
als JSON-Liste (je Eintrag `{ "id": ..., "data": { ... } }`). Ende-Code 0: alle
Regeln erfüllt. 1: die Ausgabe nennt unter `verletzt` jede Regel mit Grund,
unter `abweichung` jedes Feld in `meta`, das nicht zum Skript passt. 2: Aufruf
oder Datei kaputt.

**Altbestand** (ohne Felder auf dem Board; maßgeblich, bis ein Video Felder
hat; das Werkzeug liest diese Tabelle):

| Ordner | Format | Kern_bild | Einstieg | Motive | Beleg_kern | Branche | Schluss |
|---|---|---|---|---|---|---|---|
| `2026-11-15-kaffee-aufs-haus` | A0 | `naehe` | `paper-card` | `naehe`, `papier`, `scan` | `rechnung` | `cafe` | Klingt interessant? |
| `2026-11-16-ist-das-koscher` | A0 | `naehe` | `lock-notification` | `naehe`, `scan` | `naehe` | `cafe` | Klingt interessant? |
| `2026-11-17-doener-gegenueber` | A0 | `naehe` | `shop-duel` | `naehe`, `papier`, `scan` | `naehe` | `doener` | Willst du deine Stammkunden behalten? |
| `2026-11-18-salon-karte-im-handy` | A0 | `naehe` | `wallet-pass` | `naehe`, `papier`, `scan` | `ohne-app` | `friseur` | Klingt interessant? |

Folge für den 19.11.2026: kein F08 (V1, frühestens am 24.11.), kein Bild der
Nähe, kein Papier, kein Scan (V2, V3, V8), kein Einstieg mit `wallet-pass` oder
`shop-duel`, kein Friseur, Kernaussage weder `ohne-app` noch `naehe`, keine
Schlussfrage mit einem Wort aus "Klingt interessant?" oder "Willst du deine
Stammkunden behalten?". Die Idee
"Eisdiele, Sperrbildschirm" bleibt gesperrt, auch als Nummer T25
(`AUTOMATIK.md` 5).

## 3. Erst das Format, dann die Idee (Schritt 14, vor jedem Skript)

1. **Erlaubte Formate heute:** keins der letzten fünf Videos (V1); F07 nur an
   einem Meme-Tag (`HOOKS.md` 4.1); F08 nur, wenn V2 die Nähe erlaubt und das
   letzte Video kein `A0` ist; F05 nur, wenn V8 den Scan erlaubt; F06 nur,
   wenn V3 Papier erlaubt. Bei den anderen Formaten fallen verbotene Motive
   einfach weg (ein F03 ohne Scan fragt nach etwas anderem als dem Scannen).
2. **Rangfolge der Wahl** (`AUTOMATIK.md` 5):
   1. eine Idee aus dem Eingang (Wunsch des Betreibers): mit dem ersten
      erlaubten Format, das zu ihr passt;
   2. die Idee auf `geplant`, wenn ihr Format noch erlaubt ist;
   3. eine Idee aus einem Reel (die mit den meisten Likes zuerst): mit dem
      ersten erlaubten Format ihrer Liste `formate`;
   4. sonst **das Format zuerst:** an einem Meme-Tag F07, wenn erlaubt; sonst
      das erlaubte Format, das am längsten kein Video hatte (nie benutzt
      zuerst; bei Gleichstand in dieser Reihenfolge: F09, F01, F04, F10, F02,
      F05, F03, F06, F08, F07, die dem alten Bogen fernsten zuerst). Für
      dieses Format die erste passende Idee: offene Ideen mit
      `herkunft: "themen"`, deren Nummer das Format in der Spalte "Formate"
      hat (älteste zuerst), dann eine Nummer aus `THEMEN.md` mit diesem Format
      (`AUTOMATIK.md` 5, "Eine Nummer"). Passt keine: das nächste Format.
3. **Passt nichts:** es fallen weg, in dieser Reihenfolge, bis etwas passt:
   V7, V6, V4, dann die Themenpause von 7 Tagen (dann kommt das Thema mit der
   längsten Pause, nur nicht das vom Vortag), dann gilt V9 nur noch gegen das
   letzte Video, zuletzt fallen V1 und V9 ganz weg. V2, V3, V5, V8, V10, V11, V12
   und "Thema mit Laden" fallen nie weg: Papier, Scan und Nähe kommen nie
   öfter als in einem von drei Videos, und der Laden wechselt immer. Was
   weggefallen ist, steht in `pruefung` am Video. In 30 durchgespielten Tagen
   (Abschnitt 6) reichte zweimal erst die letzte Stufe; ohne sie wäre ein Tag
   leer geblieben.
4. Das Format kommt an die Idee (`format`), bevor das Skript entsteht; die
   Felder in `meta` (Abschnitt 2) mit der geplanten Kernaussage.
5. Nach dem Entwurf (Schritt 16) prüft `abwechslung.mjs pruefen` das wirkliche
   Skript. Was es meldet, wird im Skript behoben, nicht in `meta`.

## 4. Die zehn Formate

Für alle gilt Stil C (`AUTOMATIK.md` 6): 105 bis 115 Wörter, fertig rund 40
bis 45 s (Zeiten unten sind fertige Sekunden, der Entwurf schätzt ein Drittel
mehr), mindestens 12 Bildwechsel, kein Bild über 5 s, Hook ab Bild 0 (gewählt
aus mindestens fünf Kandidaten, mit einem Ton ab Bild 0 und einer Bewegung bis
0,5 s: `HOOKS.md` 0 und 1.7; die Zeile "Hook" nennt die Muster), ein
Laden aus `THEMEN.md`, Schluss = Frage des Formats, dann
`Dann kommentiere jetzt STICHWORT,` / `und wir melden uns bei dir.` Die
Schlussfrage hat **höchstens zwei Wörter**: mit drei und mehr stand das
Schlussbild in jedem Entwurf über 5 s (Proben vom 17.11.2026; "Lohnt sich
das?" 5,1 s, "Noch Fragen?" 4,8 s). Keine zwei Formate teilen ein Wort ihrer
Schlussfrage. Sie sind ein Vorschlag vom 17.11.2026 nach dem Muster des
Betreibers ("Klingt interessant?", das F08 behält); ob sie ihm recht sind,
ist gefragt (`START.md`, "Was der Betreiber noch entscheiden muss").

**"Handy spät"** heißt: kein Bild der Karte im Handy (`wallet-pass`,
`lock-notification`, `versus-split`; in 3D `phone-3d`, `iso-street` mit
`"mode": "nah"` und `iso-shop` mit Handy) vor den letzten 10 s vor dem letzten
gesprochenen Wort. Im Skript steht das Handy erst in der letzten Szene vor
`cta-comment`, mit höchstens 12 Wörtern. Prüfen: Anfang dieses Teils in
`out/check.json` (`scenes`) gegen das letzte Wort; im Entwurf höchstens 13 s
davor.

**Kernaussage und eine daneben.** Jedes Video hat genau eine Kernaussage (Zeile
"Kernaussage") und höchstens **eine** weitere Aussage aus einer anderen Gruppe,
in einem Satz. "In Apple oder Google Wallet" (A1) als Ort zählt nicht mit,
ebenso F1, das nur gesprochen wird. Jede Aussage in eigenen Worten (V10):
"Der Stempel ist sofort auf seinem Handy", "einmal den QR-Code scannen" und
"in der Wallet, ohne App" stehen schon in den alten Videos.

Kamerawerte der Bausteine stehen in `AUTOMATIK.md` 6.3.

**3D zuerst (seit 18.11.2026).** Der Betreiber: "Ich will so wenig 2D wie
möglich." In den Zeilen "Einstieg" und "Bausteine" unten steht deshalb der
3D-Baustein zuerst, wo es einen gibt (Zuordnung und Werte in `AUTOMATIK.md`
6.4, Tabelle "3D zuerst"); der 2D-Baustein dahinter ist der Rückfall, wenn
das 3D-Standbild nicht stimmt. 2D bleiben die Bilder, die wie eine
Oberfläche aussehen und das Format tragen (`tip-cards`, `comment-thread`,
`big-number`, `calc-panel`, `versus-split`, `day-clock`, `week-strip`): sie
kommen nur dort vor, wo die Zeilen eines Formats sie nennen, nie als
Füllung. Fehlt ein Bildwechsel, kommt ein weiterer 3D-Teil mit einem anderen
Blick dazu (`AUTOMATIK.md` 6.4, "Regeln für 3D-Teile"). Die Motive liest
`abwechslung.mjs` auch aus 3D ab (Abschnitt 2, Feld `motive`): ein Format
ohne Scan nimmt `iso-shop` mit `"phone": false` und `phone-3d` mit
`"scan": false` und `before` gleich `after`.

### F01 Drei Tipps (Wert)

Drei echte Tipps für Stammkunden, nummeriert; das Produkt ist erst der letzte Satz. **Handy spät.**

| | |
|---|---|
| Takte | Hook über der Pinnwand, Tipp 1 hängt schon (0 bis 4 s) · Tipp 1 gesprochen, Schnitt auf ein Bild dazu (4 bis 13 s) · Tipp 2: Karte, dann Bild (13 bis 22 s) · Tipp 3 (22 bis 30 s) · das Produkt als Folge von Tipp 3 (30 bis 34 s) · Schluss (34 bis 42 s) |
| Hook | H05 (W-Frage, deren Antwort das Video ist), H08 (Ich-Form) oder H14 (Insider mit Gegenstand, die Folge ist ein Rat). Kandidaten und Wahl nach `HOOKS.md` 0 und 1.7.3 |
| Einstieg | `tip-cards` mit `"show": 1`, `"rise": false` und Anker `card` auf `{ "at": "start", "offset": 0.15 }`: Tipp 1 hängt ab Bild 0, sein Zettel in der Leiste leuchtet nach einer Viertelsekunde mit Ton auf (`HOOKS.md` 1.2) |
| Bausteine | `tip-cards` für Tipp 2 und 3 (`show` 2, 3; Anker `card` auf das erste Wort des Tipps), dazwischen mit Schnitt je ein Bild zum Tipp: `iso-shop` (3D, `"phone": false`: der Gast an der Theke, seine Bestellung in der Blase, für "seine Sorte merken"; statt `shop-counter`), `week-strip` (`"rivalWeek": 0`), `big-number` ("2" für "noch zwei Stempel"), `day-clock`; am Ende `phone-3d` (3D, `"scan": false`, `before` gleich `after`; Rückfall `wallet-pass` ebenso) |
| Kern-Bild | `zettel` |
| Kernaussage | `tipps` |
| Nie | erfundene Zahlen ("80 % kommen wieder"), "Studien zeigen", Versprechen ("so verdoppelst du"), das Produkt in Tipp 1 oder 2, Nähe, Papier, Scan |
| Produkt | nur der letzte Satz vor dem Schluss, eine Aussage: A3, B2 oder D2 |
| Schluss | "Gleich probieren?" |

Tipps, die wahr und allgemein sind: den Rhythmus eines Stammkunden kennen; seine
Bestellung oder Sorte merken; ihm sagen, wie weit er ist ("noch zwei"); den
nächsten Besuch beim Namen nennen ("bis Freitag"); die Belohnung erreichbar
machen (die Zahl der Stempel legt der Laden fest, D2).

Beispiel (Eis am Markt, EIS, 106 Wörter):
> [tip-cards 1, Einstieg] Was macht aus einem Gast einen Stammgast? Drei Dinge, ab morgen.
> [week-strip] Eins: Kenn seinen Rhythmus. Kommt er jeden Dienstag und jeden Freitag, merkst du sofort, wenn er einmal fehlt. Dann frag nach, ob alles gut ist.
> [tip-cards 2] Zwei: Merk dir seine Sorte. [Kamera auf die Karte] Wie immer, Pistazie? Mit diesem einen Satz weiß er, dass du ihn wirklich kennst.
> [tip-cards 3] Drei: Sag ihm, wie weit er ist. [big-number "2"] Noch zwei Stempel, dann ist die Kugel gratis. So hat er ein Ziel, und dafür reicht ein Satz.
> [wallet-pass, ohne Scan] Bei Eis am Markt zählt seine Karte in der Wallet mit, Stempel für Stempel.
> [cta-comment] Gleich probieren? Dann kommentiere jetzt EIS, und wir melden uns bei dir.

### F02 Sag nicht, sag lieber (Wert)

Drei Sätze an der Theke, jeder wird durchgestrichen und durch einen besseren ersetzt. **Handy spät.**

| | |
|---|---|
| Takte | Hook = der erste schlechte Satz (0 bis 4 s) · Paar 1: streichen, besserer Satz, ein Bild dazu (4 bis 13 s) · Paar 2 (13 bis 22 s) · Paar 3 (22 bis 31 s) · Produkt als Grund für den besten Satz (31 bis 35 s) · Schluss (35 bis 42 s) |
| Hook | H11 (Widerspruch im Satz: eine Höflichkeit als falscher Satz), H13 (Provokation mit Entwarnung: "Streich ...") oder H08. Wahl nach `HOOKS.md` 0 und 1.7.3 |
| Einstieg | `tip-cards` mit `label` "Sag nicht:", `"rise": false`, Anker `card` auf `{ "at": "start", "offset": 0.15 }` |
| Bausteine | `tip-cards` mit `label` "Sag nicht:" und `better`, Anker `strike` und `swap`, Kamera nach dem Tausch; dazwischen `week-strip` (der Tag, den der bessere Satz nennt), `big-number` (die Zahl im Satz), `day-clock`, `iso-shop` (3D, `"phone": false`, der Satz an der Theke); am Ende `phone-3d` (3D, `"scan": false`, `before` gleich `after`; Rückfall `wallet-pass` ebenso) |
| Kern-Bild | `zettel` |
| Kernaussage | `tipps` |
| Nie | Kunden lächerlich machen (`HOOKS.md` 4.3, Punkt 4), Sätze, die eine Funktion aus Klasse 2 voraussetzen ("Ich schick dir eine Nachricht"), Nähe, Papier, Scan |
| Produkt | nur im letzten Satz vor dem Schluss: der Kunde hat seinen Stand selbst auf dem Handy (B2, D2) |
| Schluss | "Welcher zuerst?" |

Beispiel (Bäckerei Morgenrot, BROT, 109 Wörter):
> [tip-cards 1, Einstieg] Schönen Tag noch. Der falsche Satz für Stammkunden. Hier drei Sätze, die besser sind.
> [streichen, tauschen] Sag lieber: Bis Freitag! [week-strip] Damit sagst du: Ich weiß, wann du kommst, und ich freu mich schon drauf.
> [tip-cards 2] Sag nicht: Haben Sie eine Stempelkarte? [tauschen] Sag lieber: Noch drei, dann ist dein Brötchen gratis. [big-number "3"] Ein Ziel in Sicht ist mehr wert als jede Frage nach der Karte.
> [tip-cards 3] Sag nicht: Kommen Sie mal wieder. [tauschen] Sag lieber: Samstag gibt es wieder Mohnschnecken. [day-clock 07:00] Ein echter Grund zum Wiederkommen schlägt jede höfliche Floskel.
> [wallet-pass, ohne Scan] Wie weit er ist, trägt er selbst bei sich: auf seiner Karte in der Wallet.
> [cta-comment] Welcher zuerst? Dann kommentiere jetzt BROT, und wir melden uns bei dir.

### F03 Ein Kommentar, eine Antwort (Einwand)

Eine Frage wird als Kommentar getippt, das Video beantwortet sie; danach höchstens eine Nachfrage zu einer anderen Aussage.

| | |
|---|---|
| Takte | Frage getippt (0 bis 3 s) · kurze Antwort, groß (3 bis 6 s) · Beweis in Bildern (6 bis 18 s) · Nachfrage als zweiter Kommentar, Antwort in einem Satz, Bild (18 bis 28 s) · Pointe (28 bis 32 s) · Schluss (32 bis 42 s) |
| Hook | H06 (der Einwand in seinen Worten, der nächste Satz antwortet ehrlich: `HOOKS.md` 2 und 1.6, Ausnahme b), H05 oder H11; bei der Frage nach der Stempelzahl auch H03, bei der verlorenen Karte H09. Wahl nach `HOOKS.md` 0 und 1.7.3 |
| Einstieg | `comment-thread` mit `"typed": true` |
| Bausteine | `comment-thread` (`send` auf das letzte Wort der Frage, `reply` mit der Antwort in höchstens 60 Zeichen), das Bild der Kernaussage in 3D: `phone-3d` (Wallet; mit Scan nur bei der Frage nach Scannen, sonst ohne; `"mode": "design"` bei "Sieht die Karte überall gleich aus?"), `iso-shop` mit Handy und `"close": "phone"` (Scan und Stempel an der Theke, nur bei der Frage, wie der Stempel aufs Handy kommt), `iso-shop` mit `"paper": true` (nur bei der Frage nach der verlorenen Karte, das eine Papier-Bild); Rückfall `wallet-pass`, `paper-card`; `big-number` (Stempelzahl); zweiter `comment-thread` mit `"typed": false`; `stamp-check` |
| Kern-Bild | `kommentar` |
| Kernaussage | `ohne-app`, `stempeln`, `gestalten` oder `papier`, je nach Frage |
| Fragen mit Antwort in Klasse 1 | "Brauchen meine Kunden dafür eine App?" (A2, A3: `ohne-app`, Motiv `scan`) · "Wie kommt der Stempel aufs Handy?" (B1, B2: `stempeln`, Motiv `scan`) · "Wie viele Stempel braucht die Karte?" und "Sieht die Karte überall gleich aus?" (D2, D1: `gestalten`) · "Was, wenn die Karte verloren geht?" (A4: `papier`, Motiv `papier`). Als Nachfrage außerdem "Geht das nur mit Apple?" (A1) und "Und der Datenschutz?" (F1) |
| Nie | "Was kostet das?", "Gibt es einen Test?", "Brauche ich ein Gerät?", "Muss sich der Kunde anmelden?" (N1, N6, N7, N13: keine Antwort in Klasse 1); ein erfundener Name als Absender (`author` bleibt "Du"); zwei Fragen aus derselben Gruppe; mehr als eine Nachfrage |
| Produkt | von Anfang an, es ist die Antwort. F1 ist "nur gesprochen": kein Bild dafür, also kein `reply`, kein Stempel, und auf der Tafel ohne `*` |
| Schluss | "Noch Fragen?" |

Beispiel (Bäckerei Morgenrot, BROT, 105 Wörter):
> [comment-thread, getippt] Und wenn meine Kundin die Stempelkarte verliert?
> [Antwort erscheint] Im Handy geht sie nicht verloren. Pass auf.
> [paper-card] Auf Papier sieht das so aus: acht Stempel, dann steckt die Karte in der Jacke, und die Jacke in der Waschmaschine. Weg.
> [wallet-pass, ohne Scan] In der Wallet bleibt sie auf dem Handy, mit allen acht Stempeln. Kein Papier, das zerfällt, und deine Kundin fängt nicht wieder bei null an.
> [comment-thread, Nachfrage] Geht das nur mit dem iPhone? [Antwort] Nein. Die Karte liegt in Apple Wallet oder in Google Wallet, je nachdem, welches Handy sie hat.
> [stamp-check] Eine Karte, die nicht in der Wäsche landet!
> [cta-comment] Noch Fragen? Dann kommentiere jetzt BROT, und wir melden uns bei dir.

### F04 Rechnen wir mal (Rechnung)

Eine Beispielrechnung Schritt für Schritt, jede Zahl ein eigenes Bild; das Produkt erst am Ende. **Handy spät.**

| | |
|---|---|
| Takte | Alltagszahl (0 bis 4 s) · Faktor 1 (4 bis 9 s) · Faktor 2 (9 bis 14 s) · Faktor 3 (14 bis 19 s) · Ergebnis und "ein Beispiel, kein Versprechen" (19 bis 26 s) · was einen Kunden öfter zurückbringt (26 bis 31 s) · Produkt (31 bis 35 s) · Schluss (35 bis 42 s) |
| Hook | H03 (die Alltagszahl, die kippt), H06 (Einwand, die Antwort ist die Rechnung) oder H05, immer mit der Alltagszahl im Satz. Wahl nach `HOOKS.md` 0 und 1.7.3 |
| Einstieg | `big-number` mit der Alltagszahl, `sub` "Beispiel", Anker `show` auf `{ "at": "start", "offset": 0.1 }`: die Blätter klappern in der ersten halben Sekunde (Bewegung mit Ton, `HOOKS.md` 1.2), und `"poster": 0.6`, damit das Titelbild die Zahl zeigt (auf ein späteres Wort gelegt, stand im Entwurf vom 21.11. die erste Sekunde eine leere Tafel) |
| Bausteine | `big-number` je Faktor (mit `from` = Zwischenstand davor, `sub` "Beispiel"), `week-strip` für "wie oft", dann `calc-panel` als Zusammenfassung: alle Zeilen auf den Wörtern **einer** Textzeile, `result` auf die Ergebniszahl, Kamera 1,2 wie im Döner-Video; `tip-cards` mit einem Zettel (`"numbered": false`) für "was ihn öfter zurückbringt"; am Ende `phone-3d` (3D, `"scan": false`, `before` gleich `after`; Rückfall `wallet-pass` ebenso) |
| Kern-Bild | `zahl` |
| Kernaussage | `rechnung` |
| Nie | Zahlen über die App, "garantiert", Umsatz als Zusage, mehr als drei Faktoren, viele Stammkunden (Geschmack des Betreibers: wenige, die öfter kommen), Preise der App, Papier, Scan, Nähe |
| Produkt | letzter Satz vor dem Schluss (A4, A3 oder D2) |
| Schluss | "Lohnt sich's?" |

Die Rechnung muss aufgehen: `calc-panel` rechnet das Produkt nach, und
`big-number` zeigt nur Zahlen, die in `calc-panel` wieder vorkommen.

Beispiel (Salon Haarscharf, SALON, 105 Wörter, T05):
> [big-number "2", Einstieg] Zwei Haarschnitte mehr im Jahr. Klingt nach wenig, oder? Rechnen wir mal.
> [big-number "40"] Nimm vierzig Stammkunden, nicht mehr, nicht weniger. [week-strip] Jeder kommt nur zweimal mehr im Jahr, mehr nicht.
> [big-number "25 €"] Bei jedem Schnitt bleiben dir, sagen wir, fünfundzwanzig Euro.
> [calc-panel] Vierzig mal zwei mal fünfundzwanzig. Das sind zweitausend Euro mehr im Jahr. [Kamera] Ein Beispiel, kein Versprechen. Aber eine klare Richtung.
> [tip-cards, ein Zettel] Was holt sie öfter zurück? Ein Grund, an dich zu denken. Zum Beispiel eine Karte, die fast voll ist und die sie immer dabeihat.
> [wallet-pass, ohne Scan] Bei Salon Haarscharf trägt jede Kundin sie im Handy. Da zerknickt nichts.
> [cta-comment] Lohnt sich's? Dann kommentiere jetzt SALON, und wir melden uns bei dir.

### F05 Ein Tag im Laden (Geschichte)

Ein Tag in Uhrzeiten, vom Aufschließen bis zum Feierabend; das Produkt taucht an zwei Stellen des Tages auf.

| | |
|---|---|
| Takte | Uhrzeit 1, der Laden öffnet (0 bis 4 s) · Uhrzeit 2, der erste Stammkunde, Stempel (4 bis 12 s) · Uhrzeit 3, jemand Neues, einmal scannen (12 bis 20 s) · Uhrzeit 4, viel los (20 bis 27 s) · Uhrzeit 5, Feierabend, Pointe (27 bis 33 s) · Schluss (33 bis 42 s) |
| Hook | Uhrzeit plus Moment (Bauart wie H01, ohne Sperrbildschirm), H15 (Mitten drin mit Witz) oder H05. Wahl nach `HOOKS.md` 0 und 1.7.3 |
| Einstieg | `day-clock` mit der ersten Uhrzeit und `from` eine halbe Stunde davor: der Anker `move` (von selbst bei 0,05 s) lässt die Zeiger laufen, die Bewegung bis 0,5 s (`HOOKS.md` 1.7.4) |
| Bausteine | `day-clock` je Uhrzeit (`from` = Uhrzeit davor, `events` = die früheren), dazwischen mit Schnitt in 3D: `iso-shop` mit `"start": "door"` (der Stammkunde kommt, Anker `enter`), `iso-shop` mit Handy, `"close": "phone"` und `zoom` (Scan, Stempel, B1, B2), `phone-3d` (eine Neue: die Karte gleitet in die Wallet, A3); danach `stamp-check`. Rückfall: `shop-door` mit `"accent": "#5A4FCF"`, `wallet-pass`. Nur, wenn V8 den Scan erlaubt. **Die 3D-Welt ist Abend:** ein 3D-Bild nur neben einer Uhrzeit vor etwa 8 oder ab etwa 17 Uhr (im Sommer ab etwa 20 Uhr), etwa der erste Stammkunde der Bäckerei um 07:10 oder der Feierabend; neben einer Uhrzeit am Tag (09:30, 12:15, Eis am Nachmittag) der Rückfall in 2D, Grund in `pruefung` (`AUTOMATIK.md` 6.4, "Tageszeit") |
| Kern-Bild | `tag` |
| Kernaussage | `stempeln` |
| Nie | Sperrbildschirm, Karte von oben, Papier, Zahlen zum Umsatz, echte Namen |
| Produkt | in der Mitte, als Teil des Tages (B1, B2; daneben A3), nie als Erklärung |
| Schluss | "Kennst du's?" |

Beispiel (Bäckerei Morgenrot, BROT, 108 Wörter):
> [day-clock 06:00, Einstieg] Sechs Uhr. Der Ofen läuft, die Bäckerei Morgenrot macht auf.
> [day-clock 07:10] Sieben Uhr zehn. [iso-shop, `"start": "door"`, 3D: vor 8 Uhr, im Winter noch dunkel] Der erste Stammkunde, wie jeden Morgen: zwei Brötchen, ein Kaffee. [iso-shop mit Handy, `"close": "phone"`, 3D] Du hältst die Handy-Kamera auf seine Karte, und schon hat er Stempel Nummer fünf.
> [day-clock 09:30] Halb zehn. Eine Neue fragt nach der Stempelkarte, zum ersten Mal hier. [wallet-pass, Scan, 2D: um halb zehn ist es hell, die 3D-Welt nicht] Ein Code an der Theke, ein Blick mit ihrem Handy, und die Karte ist ihre.
> [day-clock 12:15] Viertel nach zwölf. Die Schlange reicht bis zur Tür. Keiner kramt im Portemonnaie, jeder Stempel ist ein Scan.
> [day-clock 19:00] Sieben Uhr abends. Feierabend. [stamp-check] Kein Stempelkissen, keine Karte vergessen! Und morgen geht es weiter.
> [cta-comment] Kennst du's? Dann kommentiere jetzt BROT, und wir melden uns bei dir.

### F06 Papier gegen Handy (Duell)

Beide Karten nebeneinander, Runde für Runde, mit Spielstand; eine Runde endet ehrlich unentschieden.

| | |
|---|---|
| Takte | Ansage mit beiden Karten (0 bis 4 s) · Runde 1 (4 bis 11 s) · Runde 2 (11 bis 19 s) · Runde 3, Unentschieden (19 bis 26 s) · Endstand, Pokal (26 bis 32 s) · Schluss (32 bis 42 s) |
| Hook | H11 (zwei Dinge gegeneinander), Laden im Satz; H05 oder H16 (Selbstironie mit Papierkram, höchstens eins in zehn Videos). Wahl nach `HOOKS.md` 0 und 1.7.3 |
| Einstieg | `versus-split` mit `"scene": "start"`; der Anker `vs` (von selbst bei 0,15 s, seit 17.11.2026) lässt das VS mit Ton einschlagen, die Bewegung bis 0,5 s (`HOOKS.md` 1.7.4) |
| Bausteine | `versus-split` je Runde **zwei oder drei Teile**: zuerst beide Seiten (`"view": "split"`, Anker `action`), dann mit `"enter": "cut"` dieselbe Runde aus der Nähe (`"view": "left"` für die Papierkarte, `"right"` für das Handy; Anker `action` auf `{ "at": "start", "offset": 0.05 }`, `point` mit Haken oder Kreuz). Runden `regen` (A4), `knick` (A4), `app` (A2, `"winner": "both"`), `vergessen` (A4, B1, B2) nur, wenn V8 den Scan erlaubt; `ende`. `score` = Stand vor der Runde. Das Banner jeder Runde kommt von selbst (Anker `action` frühestens auf das zweite Wort). So wechselt das Bild je Runde zweimal, ohne Kamera |
| Kern-Bild | `duell` |
| Kernaussage | `papier` |
| Nie | eine Runde, die das Handy nur durch Klasse 2 gewinnt (Erinnerung, Nachricht, Geburtstag), eine Runde zur Nähe, Spott über Kunden, Sommerbilder im Winter (`THEMEN.md`, "Läden") |
| Produkt | durchgehend, als rechte Seite |
| Schluss | "Dein Favorit?" |

Beispiel (Döner Palast, IMBISS, 105 Wörter):
> [versus-split start, Einstieg] Papierkarte gegen Handy. Drei Runden, im Döner Palast. Wer gewinnt am Ende?
> [regen] Runde eins: Regen auf dem Heimweg. [aus der Nähe, links] Die Papierkarte wird Matsch. [rechts] Die Karte im Handy bleibt trocken, und alle Stempel sind noch da. Punkt fürs Handy.
> [knick] Runde zwei: ab in die Hosentasche. [links] Papier knickt, die Stempel sind kaum noch zu lesen. [rechts] Im Handy knickt nichts. Zwei zu null.
> [app] Runde drei: eine App laden? Braucht keiner von beiden. [rechts] Einmal gescannt, und die Karte steckt in der Wallet. Unentschieden! Fair ist fair.
> [ende] Endstand: drei zu eins fürs Handy. Glückwunsch, liebes Handy, das war knapp.
> [cta-comment] Dein Favorit? Dann kommentiere jetzt IMBISS, und wir melden uns bei dir.

### F07 Meme-Bogen (Meme)

Ein Meme aus `HOOKS.md` 3.2 als Rahmen: erste Hälfte im Hook, zweite Hälfte als Pointe. Nur an einem Meme-Tag, und das einzige Format mit Meme.

| | |
|---|---|
| Takte | Meme-Hook (0 bis 4 s) · das Bild, das die Erwartung baut (4 bis 12 s) · Wendung (12 bis 15 s, Pointe nach 10 bis 14 s, `HOOKS.md` H10) · zwei oder drei kurze Belege (15 bis 32 s) · Schluss (32 bis 42 s) |
| Hook | H10 mit dem Meme nach `HOOKS.md` 4.1 und 4.2: Kandidaten aus bis zu drei freien Memes, gebaut wird das mit dem besten Hook (`HOOKS.md` 0) |
| Einstieg | der des Memes (`HOOKS.md` 3.2, Spalte "Einstieg"); je Meme ein anderer, nur bei M26, M29 und M21 die Papierkarte |
| Bausteine | höchstens **ein** Papier-Bild (in 3D `iso-shop` mit `"paper": true` und `"phone": false`; sonst `paper-card`, `guest-ghost`, `wallet-vanish` oder `card-bin`), die Karte im Handy nur ohne Scan und ohne neuen Stempel (`phone-3d` mit `"scan": false`, `before` gleich `after`; Rückfall `wallet-pass` ebenso); der Laden von innen `iso-shop` mit `"phone": false`; sonst `big-number`, `week-strip`, `shop-door`, `comment-thread`, `tip-cards` (ein Zettel), `stamp-check` für die Pointe; für "Red Flag / Green Flag" (M24) `versus-split` mit `leftLabel` "Red Flag" und `rightLabel` "Green Flag" |
| Kern-Bild | `meme` |
| Kernaussage | `papier`, `ohne-app`, `stempeln` oder `gestalten`, je nach Meme |
| Nie | ein zweites Meme, fremder Ton, eine Figur oder Sprechweise der Vorlage (`HOOKS.md` 4.3); **Nähe** (`shop-map`, `lock-notification`, ein Satz zu C1: das ist F08); ein Scan-Bild; zwei Papier-Bilder hintereinander. Mit Papier, Wallet, Stempel und Nähe wäre es der alte Bogen (V11) |
| Produkt | in der Pointe (sie ist eine Aussage aus Klasse 1) und in den Belegen |
| Schluss | eine Frage zum Meme aus zwei Wörtern, z. B. "Und du?" |

Beispiel (Eis am Markt, EIS, M05, 105 Wörter):
> [shop-door, eigener Laden, Einstieg, die Tür fällt zu] Deine Eisdiele macht Winterpause. Rate mal, was mit all den Stempelkarten passiert.
> [paper-card] Auf Papier: Sie liegen bis März in Schubladen, unter Kassenbons, oder gleich im Altpapier.
> [big-number "8? 3?"] Und keiner weiß mehr, wie weit er war. Acht Stempel? Oder doch nur drei?
> [stamp-check] Im Handy: nichts! Gar nichts, wirklich nichts.
> [wallet-pass, ohne Scan] Die Karte bleibt einfach in Apple oder Google Wallet, den ganzen Winter, mit jedem Stempel. Kein Zettel, der verschwindet, kein Stempel, der fehlt.
> [week-strip] Im März kommt die erste Kundin wieder, mit der ersten Sonne, und es geht genau da weiter, wo sie im Herbst aufgehört hat.
> [cta-comment] Und du? Dann kommentiere jetzt EIS, und wir melden uns bei dir.

### F08 Der Moment in der Nähe (C1 als Kern)

Das einzige Format mit Karte von oben und Sperrbildschirm: der Moment zuerst, dann wie es dazu kam, dann die Sicht des Ladens. Kein Papier, kein Scan-Bild.

| | |
|---|---|
| Takte | Moment auf dem Sperrbildschirm (0 bis 5 s) · Karte von oben: nur in der Nähe (5 bis 13 s) · Rückblick: ihr Rhythmus, die Karte füllt sich (13 bis 24 s) · Sicht des Ladens (24 bis 32 s) · Schluss (32 bis 42 s) |
| Hook | H01 (auch als "volle Karte zuerst", `HOOKS.md` 2), H05, H04 oder H14 mit C1. Wahl nach `HOOKS.md` 0 und 1.7.3 |
| Einstieg | `phone-3d` mit `"mode": "lock"` (3D, Werte aus `AUTOMATIK.md` 6.4, Text mit dem Stand); Rückfall `lock-notification` |
| Bausteine | in 3D: `phone-3d` "lock" (der Moment), `iso-street` mit `"mode": "nah"` (statt `shop-map`: der Ring um den Laden, `"frame": "stadt"` für "nur in der Nähe", `"laden"` mit `"then": "dreht"` oder `"rein"`), `iso-shop` mit `"phone": false` (ihr Rhythmus: sie kommt herein und bestellt; statt `week-strip`), `phone-3d` mit `"scan": false` und `before` gleich `after` (der Stand), `phone-3d` "lock" mit `"device": "android"` als Sicht des Ladens (ein anderer Kunde), zum Schluss gern `iso-shop` mit `"start": "door"` und einem anderen `customer` (er kommt von selbst). Jede Ansicht höchstens zweimal, außer als Fortsetzung (`AUTOMATIK.md` 6.4): nicht dreimal "stadt" oder dreimal dasselbe Handy. Rückfall: `lock-notification`, `shop-map`, `week-strip` (`"rivalWeek": 0`), `wallet-pass`. Beispiel, so gebaut: `videos/_beispiel-3d-f08` |
| Kern-Bild | `naehe` |
| Kernaussage | `naehe` |
| Nie | Papier (`paper-card`, `wallet-vanish`, `guest-ghost`, `card-bin`, `iso-shop` mit `"paper": true`), ein Scan-Bild (auch `iso-shop` mit Handy, `phone-3d` mit Scan oder neuem Stempel), Entfernung, Häufigkeit, "vibriert" (N3, `HOOKS.md` 1.6) |
| Produkt | durchgehend C1; daneben höchstens A3 oder A2 in einem Satz |
| Schluss | "Klingt interessant?" (der Satz des Betreibers, seit dem 17.11.2026 nur noch hier) |
| Takt | höchstens eins in drei Videos (V2), nie direkt nach einem `A0`, nach V1 frühestens am 24.11.2026 |

Beispiel (Bäckerei Morgenrot, BROT, 108 Wörter, T16):
> [lock-notification, Einstieg] Kurz vor acht, auf dem Weg zur Bahn, Kopfhörer im Ohr. Und ihre Stempelkarte meldet sich.
> [Kamera] Noch ein Stempel bis: Gratis-Brötchen.
> [shop-map] Sie ist gar nicht in der Bäckerei, nur in der Nähe. Und ihr Handy zeigt die Karte von selbst, auf dem Sperrbildschirm, mit dem Stand.
> [week-strip] Seit drei Wochen holt sie jeden Morgen ihre Brötchen bei dir, und jedes Mal kommt ein Stempel dazu.
> [wallet-pass, ohne Scan] Neun von zehn. Gespeichert hat sie die Karte an der Theke, ganz ohne App.
> [lock-notification, Sicht des Ladens] Und für deine Bäckerei heißt das: Du stehst auf dem Sperrbildschirm deiner Stammkunden. Ohne dass du etwas tust.
> [cta-comment] Klingt interessant? Dann kommentiere jetzt BROT, und wir melden uns bei dir.

### F09 Stimmt oder stimmt nicht? (Quiz)

Drei Behauptungen als Kommentare, jede bekommt ihren Stempel; die Erklärung ist kurz.

| | |
|---|---|
| Takte | Behauptung 1, getippt (0 bis 3 s) · Urteil und Erklärung (3 bis 12 s) · Behauptung 2 mit Urteil und Erklärung (12 bis 22 s) · Behauptung 3 (22 bis 32 s) · Schluss (32 bis 42 s) |
| Hook | H06 (die Behauptung, die der nächste Satz beantwortet), H13 (Provokation mit Entwarnung als Behauptung: "Zehn Stempel bis zum Gratis-Döner? Steht in keinem Gesetz."), H11 oder H03 (nur zur Stempelzahl). Wahl nach `HOOKS.md` 0 und 1.7.3 |
| Einstieg | `comment-thread` mit `"typed": true` (die erste Behauptung wird getippt), `verdict` und Anker `verdict` auf "Stimmt" |
| Bausteine | `comment-thread` je Behauptung (danach `"typed": false`, `verdict` "falsch" oder "stimmt"), nach jedem Urteil mit Schnitt ein Bild der Erklärung: `big-number`, `phone-3d` (3D; ohne Scan, außer die Behauptung handelt vom Scannen; `"mode": "design"` für Farben, Logo, Symbol; Rückfall `wallet-pass`), `iso-shop` mit Handy (nur, wenn die Behauptung vom Stempeln an der Theke handelt), `day-clock` |
| Kern-Bild | `kommentar` |
| Kernaussage | `ohne-app`, `stempeln` oder `gestalten`: die der ersten Behauptung. Die Behauptungen kommen aus höchstens zwei Gruppen, dazu darf A1 |
| Nie | Behauptungen, deren Antwort Klasse 2, "kein Bild" oder "nur gesprochen" ist (Statistik, Newsletter, Preise, Datenschutz F1 bis F4): der Stempel am Kommentar wäre ihr Bild; erfundene Einzelheiten ("noch an der Theke, bevor er zahlt") |
| Produkt | durchgehend, jede Erklärung ist eine Zeile aus Klasse 1 |
| Schluss | "Alles gewusst?" |

Beispiel (Döner Palast, IMBISS, 105 Wörter, T06):
> [comment-thread, getippt, Einstieg] Zehn Stempel bis zum Gratis-Döner sind Pflicht?
> [Stempel "Stimmt nicht"] Stimmt nicht. [big-number "6"] Wie viele Stempel es braucht, legst du selbst fest. Auch nur sechs, wenn dir das lieber ist. Dann ist der Gratis-Döner für deine Stammkunden schneller in Sicht.
> [comment-thread] Die Karte sieht bei jedem Laden gleich aus? [Stempel] Stimmt nicht. [wallet-pass, ohne Scan] Farben, Logo und das Stempel-Symbol bestimmst du selbst, zum Beispiel einen kleinen Döner. So sieht die Karte aus wie dein Laden.
> [comment-thread] Das geht nur mit dem iPhone? [Stempel] Stimmt nicht. [wallet-pass, Kamera] Die Karte liegt in Apple Wallet oder in Google Wallet, je nachdem, welches Handy dein Kunde gerade hat.
> [cta-comment] Alles gewusst? Dann kommentiere jetzt IMBISS, und wir melden uns bei dir.

### F10 Eine Zahl erklärt (Studie)

Eine Studienzahl aus `PRODUKT.md` (S1 bis S5) groß im Bild, mit Quelle im gesprochenen Satz; was sie für den Laden heißt; das Produkt erst am Ende. **Handy spät.**

| | |
|---|---|
| Takte | Frage oder Moment (0 bis 4 s) · Auflösung als Zahl, Quelle gesprochen (4 bis 12 s) · was die Zahl heißt (12 bis 20 s) · was der Laden daraus macht (20 bis 29 s) · Produkt (29 bis 33 s) · Schluss (33 bis 42 s) |
| Hook | H05, H02 (höchstens einmal je Durchlauf, `HOOKS.md` 1.6), H12 (Drama im Laden, mit `week-strip` und `rivalWeek`) oder H15 (Mitten drin mit Witz, mit `shop-counter` und Steppenläufer); die Zahl nie im ersten Satz (`HOOKS.md` 1.5). Wahl nach `HOOKS.md` 0 und 1.7.3 |
| Einstieg | `iso-shop` (3D, `"phone": false`, `"start": "counter"`, Anker `order` auf `{ "at": "start", "offset": 0.3 }`: die Blase springt auf, der Inhaber nickt; als Einstieg nur in einer Probe mit Standbildern erprobt, 18.11.2026: Standbilder 0 und 0,5 s ansehen), `shop-counter` (nur mit Steppenläufer, H15, oder als Rückfall) oder `week-strip` (nie `guest-ghost`: als Einstieg nicht erprobt, `HOOKS.md` 1.2), mit dem Anker aus `HOOKS.md` 1.7.3 bis 0,5 s |
| Bausteine | `big-number` (Zahl genau wie in `PRODUKT.md`, Spanne als Spanne, Bindestrich), `iso-shop` (3D, `"phone": false`) oder `week-strip` für das Bild dazu, `tip-cards` mit einem Zettel für den Rat, am Ende `phone-3d` (3D, `"scan": false`, `before` gleich `after`; Rückfall `wallet-pass` ebenso) |
| Kern-Bild | `zahl` |
| Kernaussage | `studie` |
| Nie | die Quelle im Bild, eine zweite Studie, die Studie eines Videos der letzten 30 Tage (`meta.studie`, V9), die Zahl als Zusage für den eigenen Laden, die Einschränkung weglassen (S4: nicht Deutschland; S5: eine Supermarkt-App), Papier, Scan |
| Produkt | letzter Satz vor dem Schluss (A4, A3) |
| Schluss | "Überrascht?" |

Beispiel (Eis am Markt, EIS, 105 Wörter, S3):
> [shop-counter, Einstieg] Wer ist teurer: der Neue oder der Stammkunde? Rate mal.
> [big-number "5-25×"] Laut Harvard Business Review ist ein neuer Kunde fünf- bis fünfundzwanzigmal so teuer wie einer, der bleibt.
> [Kamera auf die Zahl] Flyer, Rabatte, Werbung: das alles nur für den ersten Besuch.
> [week-strip] Wer schon zweimal da war, kennt deine Eisdiele längst. Den musst du nur noch halten, nicht neu gewinnen.
> [tip-cards, ein Zettel] Heißt: Kümmer dich um die, die schon da waren. Merk dir ihre Sorte, und sag ihnen, wie weit sie sind.
> [wallet-pass, ohne Scan] Bei Eis am Markt bekommt jeder Stammgast eine Karte, die auf seinem Handy bleibt und nicht im Portemonnaie zerfällt.
> [cta-comment] Überrascht? Dann kommentiere jetzt EIS, und wir melden uns bei dir.

## 5. Was für alle Formate gilt

- **Kein Takt aus dem alten Bogen als Füllung.** Fehlen Bildwechsel, kommt
  eine Kamerafahrt (Werte in `AUTOMATIK.md` 6.3), ein weiterer Teil
  desselben Kern-Bilds oder (3D) ein weiterer Teil mit einem anderen Blick
  derselben Szene dazu, nicht Papier, Wallet oder Karte von oben, auch nicht
  in 3D.
- **Pointe nur, wo das Format eine hat** (F03, F05, F07). `stamp-check` ist
  kein Pflichtbild mehr.
- **Die Beispiele sind Belege, kein Wortlaut zum Abschreiben.** Ein Satz aus
  einem Beispiel oben kommt höchstens einmal in 60 Tagen in ein Video; V10
  zählt mit, was die letzten drei Videos gesagt haben.
- **Erst das Format, dann der Text.** Wer beim Schreiben merkt, dass der Text
  in den alten Bogen kippt (Problem mit Papier, Karte im Handy, Stempel,
  Nähe, Sperrbildschirm), hat das Format verlassen: neu anfangen. V11 fängt
  das an den Motiven, nicht an den Sätzen.
- **"Nur gesprochen"** (F1, E4 in `PRODUKT.md`) heißt: kein Bild und kein
  Baustein dafür. Stil C zeigt jedes gesprochene Wort als Tafel; dieses Wort
  bekommt kein `*`.

## 6. Proben vom 17.11.2026

**Was der Lauf bauen würde.** Durchgespielt mit `tools/abwechslung.mjs` (alle
Regeln dieser Datei, Rangfolge aus Abschnitt 3, Meme-Tag nach `HOOKS.md` 4.1,
Altbestand oben, offene Idee T06 vom 17.11., gesperrt "Eisdiele,
Sperrbildschirm"; Ideen aus Reels und dem Eingang nicht mitgerechnet, sie
hätten Vorrang):

| Tag | Nummer, Laden | Format | Einstieg | Motive | Kernaussage | Schluss |
|---|---|---|---|---|---|---|
| 19.11. | T06, Döner Palast | F09 Quiz | `comment-thread` | keins | `gestalten` | Alles gewusst? |
| 20.11. | T28, Eis am Markt | F01 Tipps | `tip-cards` | keins | `tipps` | Gleich probieren? |
| 21.11. | T01, Salon Haarscharf | F07, M23 | `big-number` | `papier` | `papier` | Und du? |
| 22.11. | T14, Bäckerei Morgenrot | F10 Studie (S3) | `shop-counter` | keins | `studie` | Überrascht? |
| 23.11. | T10, Döner Palast | F05 Tag | `day-clock` | `scan` | `stempeln` | Kennst du's? |
| 24.11. | T29, Bäckerei Morgenrot | F02 Sätze | `tip-cards` | keins | `tipps` | Welcher zuerst? |
| 25.11. | T03, Eis am Markt | F06 Duell | `versus-split` | `papier` | `papier` | Dein Favorit? |
| 26.11. | T05, Salon Haarscharf | F04 Rechnung | `big-number` | keins | `rechnung` | Lohnt sich's? |
| 27.11. | T13, Eis am Markt | F07, M05 | `shop-door` | keins | `ohne-app` | Und du? |
| 28.11. | T02, Döner Palast | F08 Nähe | `lock-notification` | `naehe` | `naehe` | Klingt interessant? |

Zehn Videos, neun Formate (F07 zweimal, sechs Tage auseinander, anderes Meme,
anderer Laden, anderes erstes Bild), F03 erst am 04.12. Nähe 1-mal, Papier
2-mal, Scan 1-mal (in der ersten Fassung: Scan 10-mal, Papier rund 6-mal);
keine Kernaussage zweimal hintereinander, jeder Laden zwei- bis dreimal. Am
20.11. ist Meme-Tag, aber F07 hätte Papier (V3, der Salon vom 18.11.) oder
die Kernaussage `ohne-app` (V9) gebraucht: also kein Meme, F01. Über 30 Tage
gespielt: kein leerer Tag, jedes Format 2- bis 4-mal, jeder Laden 7- bis
8-mal, Nähe 2-mal, Papier 5-mal, Scan 6-mal; zweimal griff erst die letzte
Stufe aus Abschnitt 3, Punkt 3; ab dem 11.12. kommen Nummern mit neuem ersten
Satz wieder.

**Entwürfe.** Die ersten drei Tage dieser Folge, ohne Stimme gebaut und
angesehen; `abwechslung.mjs pruefen` gegen den Altbestand und die Entwürfe
davor endet bei allen dreien mit 0:

| Entwurf | Format, Laden | Wörter | geschätzte Länge | Bildwechsel | längstes Bild | gleiche Vierergruppen mit den drei Videos davor |
|---|---|---|---|---|---|---|
| 19.11. "Zehn Stempel bis zum Gratis-Döner sind Pflicht?" | F09, Döner Palast | 108 | 51,7 s | 14 | 4,8 s | 0, 0, 0 |
| 20.11. "Was macht aus einem Gast einen Stammgast?" | F01, Eis am Markt | 107 | 51,0 s | 12 | 4,8 s | 0, 0, 0 |
| 21.11. "Erwartung: zehn Stempel." | F07 (M23), Salon Haarscharf | 106 | 50,1 s | 12 | 4,8 s | 0, 0, 0 |

Die drei Entwürfe der ersten Fassung (Döner F03, Bäckerei F05, Eisdiele F06)
waren nicht die Folge, die der Lauf gebaut hätte, und liefen in der Mitte alle
denselben Takt (Scan, Stempel "sofort auf seinem Handy", "einmal den
QR-Code", "Wallet, ohne App"). `abwechslung.mjs` lehnt alle drei für den
19.11. ab (V3 oder V7, V8, V9, V10 mit 7, 8 und 3 gleichen Gruppen; in `meta`
standen dort Motive, die nicht zu den Bausteinen passten). Sie bleiben als
Proben der Bausteine.

**Nachtrag 17.11.2026, abends.** Die Folge oben rechnet ohne Ideen aus dem
Eingang. Die Idee des Betreibers `20261117-deutschland-technik` hat einen
eigenen Plan (`docs/plaene/deutschland-technik.md`, `AUTOMATIK.md` 5) und
geht vor, sobald die Regeln einen Tag erlauben (nie am 22.11.; ein festes
Datum gibt es nicht, mit dem Salon-Video vom 18.11. sperrt allein die
Themenpause bis einschließlich 25.11.). Solange sie wartet und in den drei
Tagen nach dem geplanten dran sein könnte, nimmt der Lauf kein F01 und kein
F02 (gleicher Einstieg `tip-cards`; Probe in `AUTOMATIK.md` 5). Die Folge
oben kann sich dadurch verschieben (nicht neu durchgespielt). Wo der Plan
vor diesem Dokument gilt (Takte, "Nie", "Produkt", "Handy spät", Länge,
Schluss), zählt `AUTOMATIK.md` 5 auf, "Was ein Plan ersetzt". Die
Hooks der Folge sind seit der Jury-Runde Kandidaten (`HOOKS.md` 0): welcher
Satz am Ende im Video steht, entscheidet der Bewertungsbogen.

**Nachtrag 18.11.2026, "3D zuerst".** F08 ist als ganzes Video ohne Stimme
gebaut, so wie der Lauf es am 28.11. nach der Folge oben bauen könnte (T02,
Döner Palast): `videos/_beispiel-3d-f08`, 109 Wörter, 51,7 s im Entwurf, 12
Bildwechsel, längstes Bild 4,8 s, elf von zwölf Bildern vor dem Schluss in 3D
(85 % der Bilder), alle Prüfungen ohne Warnung, `einstieg.mjs` 0,
`abwechslung.mjs pruefen` gegen die Folge oben 0 (die Texte der Folge gibt es
nicht, V10 zählte also nur gegen leere Texte; gegen die echten Videos teilt es
mit dem Salon vom 18.11. drei Vierergruppen um "auf dem Sperrbildschirm, mit
dem Stand", das wäre in den drei Tagen danach V10). Bau 23 min 35 s. Nach
der Gegenprüfung am selben Abend neu gebaut (22 min 18 s, wieder ohne
Warnung): der letzte 3D-Teil zeigt einen anderen Stammkunden, der von selbst
in den Laden kommt (`iso-shop`), statt ein zweites Mal die Kreuzung "stadt"
(fast dasselbe Bild wie bei 7 s; seither höchstens zweimal dieselbe Ansicht,
`AUTOMATIK.md` 6.4), und er kommt "jeden Samstag" statt "jeden Freitag",
weil der Sperrbildschirm den Samstag zeigt, an dem das Video läuft.

Offen: F02, F03, F04, F05, F06 und F10 sind seit dieser Fassung nicht als
ganzes Video gebaut (F08 nur ohne Stimme, oben) (F06 nur mit den neuen Ansichten `"view"` als Probe); keins
der Formate lief mit Stimme. Ob die Schlussfragen
der Formate dem Betreiber recht sind, ist gefragt.
