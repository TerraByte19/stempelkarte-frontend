# Stampit Studio: zehn Formate und die Regeln der Abwechslung

Stand 17.11.2026. Der unbeaufsichtigte Lauf liest diese Datei **ganz**, bevor
er eine Idee wählt (`AUTOMATIK.md`, Abschnitt 5) und bevor er das Skript
schreibt (Schritt 15). Sie legt fest, **wie** ein Video gebaut ist. Was es
sagen darf, bleibt bei `PRODUKT.md` (nur Klasse 1), der erste Satz bei
`HOOKS.md`, Laden und Thema bei `THEMEN.md`, Stil C (Tempo, Tafeln, Mischung)
bei `AUTOMATIK.md` 6. Wo diese Datei einer davon widerspricht, gelten die.

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

Den Bogen erzwangen: die Vorlage (`videos/_vorlage`, genau diese Reihenfolge
als "fertiges Beispiel"), `THEMEN.md` ("läuft in einer Linie: der Moment, was
mit Papier schiefgeht, die Pointe, die Karte im Handy, was sie von selbst tut",
dazu die Reihenfolge zum Auffüllen "1. Die Nähe zeigen ... das stärkste Bild",
und eine Spalte "Kern", die fast überall Papier, Wallet und Sperrbildschirm
nennt), `AUTOMATIK.md` 6 ("Eine kleine Geschichte über einen Laden", Pointe
mit `stamp-check` in jedem Video, Schluss fest auf "Klingt interessant?"),
6.3 (Papier immer als Dreierschlag) und 6.4 (`shop-map` "immer", danach "oft
ein Schnitt auf `lock-notification`"). Abschnitt 2 und 3 lösen das auf.

## 2. Abwechslung: die Regeln

Jedes Video trägt in `meta` des Skripts und am Video auf dem Board diese
Felder (Schritt 15 und 19):

| Feld | Inhalt |
|---|---|
| `format` | `F01` bis `F10` (Abschnitt 4) |
| `kern_bild` | Bild, das das Video trägt: `tipps`, `kommentar`, `rechnung`, `tag`, `duell`, `zahl`, `naehe`, `papier`, `wallet`, `laden` |
| `einstieg` | Baustein des ersten Teils der ersten Szene, z. B. `comment-thread` |
| `motive` | Liste, aus den Bausteinen abgelesen: `naehe`, wenn `shop-map`, `shop-street` oder `lock-notification` vorkommt; `papier-knick`, wenn `wallet-vanish`, `card-bin` oder `versus-split` mit `"scene": "knick"` vorkommt. Sonst `[]` |
| `schluss` | die Schlussfrage, wie sie im Video steht, z. B. `"Klingt interessant?"` |
| `branche` | wie bisher |

**Die letzten drei Videos** sind die drei Videos auf dem Board mit dem
höchsten `datum` vor dem Tag des neuen Videos (`ZIEL`), je Datum die höchste
Fassung, verworfene mitgezählt, `ersetzt` nicht. Fehlt ein Feld, gilt die
Tabelle "Altbestand" unten; fehlt das Video dort, wird es aus `meta` von
`videos/<ordner>/script.json` gelesen, und was dort fehlt, aus den Bausteinen
derselben Datei abgeleitet (Format dann `A0`).

Ein neues Video muss **alle** Regeln erfüllen:

| Nr. | Regel |
|---|---|
| V1 | `format` ist keins der letzten drei Videos. `A0` (der alte Bogen) zählt dabei als `F08` |
| V2 | Motiv `naehe` (Karte von oben, Straße, Sperrbildschirm) höchstens in einem von je drei Videos hintereinander: erlaubt nur, wenn keins der **letzten zwei** Videos es hat |
| V3 | Motiv `papier-knick` (zerknickte, zerknüllte Papierkarte) genauso: nur, wenn keins der letzten zwei es hat |
| V4 | `einstieg` ist nicht der Einstieg eines der letzten zwei Videos |
| V5 | `branche` ist nicht die des letzten Videos |
| V6 | `kern_bild` ist nicht das des letzten Videos |
| V7 | `schluss` ist nicht die Schlussfrage eines der letzten zwei Videos ("Klingt interessant?" also höchstens einmal in drei) |

Dazu gelten wie bisher: Themenpause (`AUTOMATIK.md` 5), Meme-Takt
(`HOOKS.md` 4.1), H02 höchstens einmal je Durchlauf (`HOOKS.md` 1.6).

**Altbestand** (ohne Felder auf dem Board; maßgeblich, bis ein Video Felder hat):

| Ordner | `format` | `kern_bild` | `einstieg` | `motive` | `branche` | `schluss` |
|---|---|---|---|---|---|---|
| `2026-11-15-kaffee-aufs-haus` | A0 | `naehe` | `paper-card` | `naehe`, `papier-knick` | `cafe` | Klingt interessant? |
| `2026-11-16-ist-das-koscher` | A0 | `naehe` | `lock-notification` | `naehe` | `cafe` | Klingt interessant? |
| `2026-11-17-doener-gegenueber` | A0 | `naehe` | `shop-duel` | `naehe`, `papier-knick` | `doener` | Willst du deine Stammkunden behalten? |
| `2026-11-18-salon-karte-im-handy` | A0 | `naehe` | `wallet-pass` | `naehe`, `papier-knick` | `friseur` | Klingt interessant? |

Folge für den 19.11.2026: kein F08, kein Bild der Nähe, keine zerknickte
Papierkarte, kein Einstieg mit `wallet-pass` oder `shop-duel`, kein Friseur,
nicht "Klingt interessant?". Die Idee "Eisdiele, Sperrbildschirm" bleibt
gesperrt.

## 3. Ein Format wählen (Schritt 14, vor jedem Skript)

1. **Erlaubte Formate** nach V1 bis V3: ohne die Formate der letzten drei
   Videos; F07 nur an einem Meme-Tag (`HOOKS.md` 4.1); F08 nur, wenn V2
   `naehe` erlaubt. Verbietet V3 `papier-knick`, bleibt ein Format erlaubt,
   aber ohne die Bilder dieses Motivs.
2. **Format der Idee:** Hat die Idee schon `format` und ist es erlaubt, bleibt
   es. Sonst das erste erlaubte aus der Spalte "Formate" des Themas in
   `THEMEN.md` (für eine Idee aus einem Reel: das Format, dessen Aufbau dem
   Kniff des Reels am nächsten ist, nie dessen Bildfolge). Unter mehreren
   gleich passenden: das Format, das am längsten kein Video hatte, ein nie
   benutztes zuerst.
3. Passt kein erlaubtes Format zur Idee, erfüllt sie die Bedingungen nicht:
   die nächste Idee nach `AUTOMATIK.md` 5. Findet sich bis zum Ende der
   Rangfolge keine, fallen V7, dann V6, dann V4 weg, in dieser Reihenfolge.
   V1, V2, V3 und V5 fallen nie weg.
4. Das Format kommt an die Idee (`format`), bevor das Skript entsteht, und
   in `meta` des Skripts mit `kern_bild`, `einstieg`, `motive`, `schluss`.
5. Nach dem Entwurf (Schritt 16) noch einmal gegen V1 bis V7 halten: die
   Felder aus dem wirklichen Skript ablesen, nicht aus dem Plan.

## 4. Die zehn Formate

Für alle gilt Stil C (`AUTOMATIK.md` 6): 105 bis 115 Wörter, fertig rund 40
bis 45 s (Zeiten unten sind fertige Sekunden, der Entwurf schätzt ein Drittel
mehr), mindestens 12 Bildwechsel, kein Bild über 5 s, Hook ab Bild 0, ein
Laden aus `THEMEN.md`, Schluss = Frage des Formats, dann
`Dann kommentiere jetzt STICHWORT,` / `und wir melden uns bei dir.` Die
Schlussfrage hat **höchstens zwei Wörter** (wie "Klingt interessant?"): mit drei
und mehr stand das Schlussbild in jedem Entwurf über 5 s, und lange Fragen
passen in `"mode": "zeile"` nicht in eine Zeile (Proben vom 17.11.2026).

**"Handy spät"** heißt: kein Bild der Karte im Handy (`wallet-pass`,
`lock-notification`, `versus-split`) vor den letzten 10 s vor dem letzten
gesprochenen Wort. Im Skript steht das Handy erst in der letzten Szene vor
`cta-comment`, mit höchstens 12 Wörtern. Prüfen: Anfang dieses Teils in
`out/check.json` (`scenes`) gegen das letzte Wort (`caps`, letzter `last`);
im Entwurf höchstens 13 s davor.

Kamerawerte der neuen Bausteine stehen in `AUTOMATIK.md` 6.3.

### F01 Drei Tipps (Wert)

Drei echte Tipps für Stammkunden, nummeriert; das Produkt ist erst der letzte Satz. **Handy spät.**

| | |
|---|---|
| Takte | Hook mit Pinnwand, Zettel noch leer (0 bis 4 s) · Tipp 1, Karte und ein Bild dazu (4 bis 13 s) · Tipp 2 genauso (13 bis 22 s) · Tipp 3 (22 bis 30 s) · das Produkt als Folge von Tipp 3 (30 bis 34 s) · Schluss (34 bis 42 s) |
| Hook | H05 (W-Frage, deren Antwort das Video ist) oder H08 (Ich-Form) |
| Bausteine | `tip-cards` je Tipp ein Teil (`show` 1, 2, 3; im Einstieg Anker `card` auf das erste Wort von Tipp 1: bis dahin hängen nur Überschrift und Zettel-Leiste, Bild 0 ist trotzdem fertig), dazwischen mit Schnitt ein Bild zum Tipp: `week-strip` (Rhythmus, `"rivalWeek": 0`), `big-number` ("2" für "noch zwei Stempel"), `day-clock`; am Ende `wallet-pass` mit `"scan": false` |
| Nie | erfundene Zahlen ("80 % kommen wieder"), "Studien zeigen", Versprechen ("so verdoppelst du"), das Produkt in Tipp 1 oder 2, Nähe, Papier-Knick |
| Produkt | nur der letzte Satz vor dem Schluss, eine Aussage (A1, A2 oder B2) |
| Schluss | "Gleich probieren?" |

Tipps, die wahr und allgemein sind: den Rhythmus eines Stammkunden kennen; seine
Bestellung oder Sorte merken; ihm sagen, wie weit er ist ("noch zwei"); den
nächsten Besuch beim Namen nennen ("bis Freitag"); die Belohnung erreichbar
machen (die Zahl der Stempel legt der Laden fest, D2).

Beispiel (Eis am Markt, EIS, 105 Wörter):
> [tip-cards, Einstieg] Was macht aus einem Gast einen Stammgast? Drei Dinge, ab morgen.
> [tip-cards 1] Eins: Kenn seinen Rhythmus. [week-strip] Kommt er jeden Dienstag und jeden Freitag, merkst du sofort, wenn er einmal fehlt. Dann frag nach, ob alles gut ist.
> [tip-cards 2] Zwei: Merk dir seine Sorte. [Kamera auf die Karte] Wie immer, Pistazie? Mit diesem einen Satz weiß er, dass du ihn wirklich kennst.
> [tip-cards 3] Drei: Sag ihm, wie weit er ist. [big-number "2"] Noch zwei Stempel, dann ist die Kugel gratis. So hat er ein Ziel, und das kostet dich keinen Cent.
> [wallet-pass] Bei Eis am Markt steht das auf seinem Handy, in der Wallet.
> [cta-comment] Gleich probieren? Dann kommentiere jetzt EIS, und wir melden uns bei dir.

### F02 Sag nicht, sag lieber (Wert)

Drei Sätze an der Theke, jeder wird durchgestrichen und durch einen besseren ersetzt. **Handy spät.**

| | |
|---|---|
| Takte | Hook = der erste schlechte Satz (0 bis 4 s) · Paar 1: streichen, besserer Satz, ein Bild dazu (4 bis 13 s) · Paar 2 (13 bis 22 s) · Paar 3 (22 bis 31 s) · Produkt als Grund für den besten Satz (31 bis 35 s) · Schluss (35 bis 42 s) |
| Hook | H11 (Widerspruch im Satz: eine Höflichkeit als falscher Satz) |
| Bausteine | `tip-cards` mit `label` "Sag nicht:" und `better`, Anker `strike` und `swap`, Kamera nach dem Tausch; dazwischen `week-strip` (der Tag, den der bessere Satz nennt), `big-number` (die Zahl im Satz), `day-clock`; am Ende `wallet-pass` |
| Nie | Kunden lächerlich machen (`HOOKS.md` 4.3, Punkt 4), Sätze, die eine Funktion aus Klasse 2 voraussetzen ("Ich schick dir eine Nachricht"), Nähe |
| Produkt | nur im letzten Satz vor dem Schluss: der Stand steht auf dem Handy (A1, B2) |
| Schluss | "Welcher zuerst?" |

Beispiel (Bäckerei Morgenrot, BROT, 105 Wörter):
> [tip-cards 1, Einstieg] Schönen Tag noch. Der falsche Satz für Stammkunden. Hier drei Sätze, die besser sind.
> [streichen, tauschen] Sag lieber: Bis Freitag! [week-strip] Damit sagst du: Ich weiß, wann du kommst, und ich freu mich schon drauf.
> [tip-cards 2] Sag nicht: Haben Sie eine Stempelkarte? [tauschen] Sag lieber: Noch drei, dann ist dein Brötchen gratis. [big-number "3"] Ein Ziel in Sicht ist mehr wert als jede Frage nach der Karte.
> [tip-cards 3] Sag nicht: Kommen Sie mal wieder. [tauschen] Sag lieber: Samstag gibt es wieder Mohnschnecken. [day-clock 07:00] Ein echter Grund zum Wiederkommen schlägt jede höfliche Floskel.
> [wallet-pass] Den Stand sieht er bei dir im Handy, in der Wallet.
> [cta-comment] Welcher zuerst? Dann kommentiere jetzt BROT, und wir melden uns bei dir.

### F03 Ein Kommentar, eine Antwort (Einwand)

Eine Frage wird als Kommentar getippt, das Video beantwortet sie; danach höchstens zwei kurze Nachfragen.

| | |
|---|---|
| Takte | Frage getippt (0 bis 3 s) · kurze Antwort, groß (3 bis 6 s) · Beweis in Bildern (6 bis 18 s) · Nachfrage als zweiter Kommentar, Antwort, Bild (18 bis 28 s) · Pointe (28 bis 32 s) · Schluss (32 bis 42 s) |
| Hook | H06 (der Einwand zuerst, der nächste Satz antwortet: `HOOKS.md` 1.6, Ausnahme b) |
| Bausteine | `comment-thread` (Einstieg mit `"typed": true`, `send` auf das letzte Wort der Frage, `reply` mit der Antwort in höchstens 60 Zeichen), `wallet-pass` (Scan, dann Stempel), zweiter `comment-thread` mit `"typed": false`, `stamp-check` |
| Fragen mit Antwort in Klasse 1 | "Brauchen meine Kunden dafür eine App?" (A2, A3, A1) · "Wie kommt der Stempel aufs Handy?" (B1, B2) · "Wie viele Stempel braucht die Karte?" (D2) · "Geht das nur mit Apple?" (A1) · "Und der Datenschutz?" (F1: nur gesprochen, also ohne `reply` und ohne Stempel) · "Was, wenn die Papierkarte verloren geht?" (A4) |
| Nie | "Was kostet das?", "Gibt es einen Test?", "Brauche ich ein Gerät?", "Muss sich der Kunde anmelden?" (N1, N6, N7, N13: keine Antwort in Klasse 1); ein erfundener Name als Absender (`author` bleibt "Du") |
| Produkt | von Anfang an, es ist die Antwort |
| Schluss | "Noch Fragen?" |

Beispiel (Salon Haarscharf, SALON, 106 Wörter):
> [comment-thread, getippt] Brauchen meine Kunden dafür eine App?
> [Antwort erscheint] Nein. Einmal scannen, fertig. Und das geht so, Schritt für Schritt.
> [wallet-pass, Scan] Deine Kundin scannt einmal einen QR-Code, gleich hier im Salon, noch mit nassen Haaren. Danach liegt die Karte in Apple oder Google Wallet. Kein Store, kein Download.
> [comment-thread, zweite Frage] Und wie kommt der Stempel drauf?
> [wallet-pass, Stempel] Du scannst ihre Karte mit der Handy-Kamera, ganz ohne Stempelkissen. Der Stempel ist sofort auf ihrem Handy. Bei jedem Haarschnitt wieder, ganz einfach.
> [comment-thread, dritte Frage, ohne `reply`: F1 ist nur gesprochen] Und der Datenschutz? DSGVO-konform und in Deutschland entwickelt.
> [stamp-check] Eine Karte im Handy, ganz ohne App! Und ohne Papier, das verloren geht.
> [cta-comment] Noch Fragen? Dann kommentiere jetzt SALON, und wir melden uns bei dir.

### F04 Rechnen wir mal (Rechnung)

Eine Beispielrechnung Schritt für Schritt, jede Zahl ein eigenes Bild; das Produkt erst am Ende. **Handy spät.**

| | |
|---|---|
| Takte | Alltagszahl (0 bis 4 s) · Faktor 1 (4 bis 9 s) · Faktor 2 (9 bis 14 s) · Faktor 3 (14 bis 19 s) · Ergebnis und "ein Beispiel, kein Versprechen" (19 bis 26 s) · was einen Kunden öfter zurückbringt (26 bis 31 s) · Produkt (31 bis 35 s) · Schluss (35 bis 42 s) |
| Hook | H03 (die Alltagszahl, die kippt) |
| Bausteine | `big-number` je Faktor (mit `from` = Zwischenstand davor, `sub` "Beispiel"), `week-strip` für "wie oft", dann `calc-panel` als Zusammenfassung: alle Zeilen auf den Wörtern **einer** Textzeile, `result` auf die Ergebniszahl, Kamera 1,2 wie im Döner-Video; am Ende `wallet-pass` |
| Nie | Zahlen über die App, "garantiert", Umsatz als Zusage, mehr als drei Faktoren, viele Stammkunden (Geschmack des Betreibers: wenige, die öfter kommen), Preise der App |
| Produkt | letzter Satz vor dem Schluss (A1, A4 oder B2) |
| Schluss | "Lohnt sich das?" |

Die Rechnung muss aufgehen: `calc-panel` rechnet das Produkt nach, und
`big-number` zeigt nur Zahlen, die in `calc-panel` wieder vorkommen.

Beispiel (Salon Haarscharf, SALON, 106 Wörter, T05):
> [big-number "2", Einstieg] Zwei Haarschnitte mehr im Jahr. Klingt nach wenig, oder? Rechnen wir mal.
> [big-number "40"] Nimm vierzig Stammkunden, nicht mehr, nicht weniger. [week-strip] Jeder kommt nur zweimal mehr im Jahr, mehr nicht.
> [big-number "25 €"] Bei jedem Schnitt bleiben dir, sagen wir, fünfundzwanzig Euro.
> [calc-panel] Vierzig mal zwei mal fünfundzwanzig. Das sind zweitausend Euro mehr im Jahr. [Kamera] Ein Beispiel, kein Versprechen. Aber eine klare Richtung.
> [tip-cards, ein Zettel] Was holt sie öfter zurück? Ein Grund, an dich zu denken. Zum Beispiel eine Karte, die fast voll ist und nicht im Portemonnaie zerfällt.
> [wallet-pass] Bei Salon Haarscharf liegt sie im Handy, in der Wallet, ohne App.
> [cta-comment] Lohnt sich das? Dann kommentiere jetzt SALON, und wir melden uns bei dir.

### F05 Ein Tag im Laden (Geschichte)

Ein Tag in Uhrzeiten, vom Aufschließen bis zum Feierabend; das Produkt taucht an zwei Stellen des Tages auf.

| | |
|---|---|
| Takte | Uhrzeit 1, der Laden öffnet (0 bis 4 s) · Uhrzeit 2, der erste Stammkunde, Stempel (4 bis 12 s) · Uhrzeit 3, jemand Neues, einmal scannen (12 bis 20 s) · Uhrzeit 4, viel los (20 bis 27 s) · Uhrzeit 5, Feierabend, Pointe (27 bis 33 s) · Schluss (33 bis 42 s) |
| Hook | Uhrzeit plus Moment (Bauart wie H01, ohne Sperrbildschirm) |
| Bausteine | `day-clock` je Uhrzeit (`from` = Uhrzeit davor, `events` = die früheren), dazwischen mit Schnitt `shop-door` mit `"accent": "#5A4FCF"` (der Stammkunde kommt), `wallet-pass` (Scan, Stempel), `stamp-check` |
| Nie | Sperrbildschirm, Karte von oben (kein Bild der Nähe), Papier-Knick, Zahlen zum Umsatz, echte Namen |
| Produkt | in der Mitte, als Teil des Tages (B1, B2, A3, A2), nie als Erklärung |
| Schluss | "Dein Tag?" |

Beispiel (Bäckerei Morgenrot, BROT, 105 Wörter):
> [day-clock 06:00, Einstieg] Sechs Uhr. Der Ofen läuft, die Bäckerei Morgenrot macht auf.
> [day-clock 07:10] Sieben Uhr zehn. [shop-door] Der erste Stammkunde, wie jeden Morgen: zwei Brötchen, ein Kaffee. [wallet-pass, Stempel] Ein Scan mit der Handy-Kamera, und der Stempel ist sofort auf seinem Handy.
> [day-clock 09:30] Halb zehn. Eine Neue fragt nach der Stempelkarte, zum ersten Mal hier. [wallet-pass, Scan] Sie scannt einmal den QR-Code. Die Karte liegt in ihrer Wallet, ohne App.
> [day-clock 12:15] Viertel nach zwölf. Die Schlange reicht bis zur Tür. Keiner sucht eine Papierkarte, jeder Stempel ist ein Scan.
> [day-clock 19:00] Sieben Uhr abends. Feierabend. [stamp-check] Kein Stempelkissen, keine Karte vergessen! Und morgen geht es weiter.
> [cta-comment] Dein Tag? Dann kommentiere jetzt BROT, und wir melden uns bei dir.

### F06 Papier gegen Handy (Duell)

Beide Karten nebeneinander, Runde für Runde, mit Spielstand; eine Runde endet ehrlich unentschieden.

| | |
|---|---|
| Takte | Ansage mit beiden Karten (0 bis 4 s) · Runde 1 (4 bis 11 s) · Runde 2 (11 bis 19 s) · Runde 3, Unentschieden (19 bis 26 s) · Runde 4 (26 bis 31 s) · Endstand, Pokal (31 bis 34 s) · Schluss (34 bis 42 s) |
| Hook | H11 (zwei Dinge gegeneinander), Laden im Satz |
| Bausteine | `versus-split` je Runde ein Teil: `"scene"` `start`, `regen` (A4), `vergessen` (A4, B1, B2), `app` (A2, `"winner": "both"`), `knick` (A4, nur wenn V3 es erlaubt), `ende`; `score` = Stand vor der Runde. Jede Runde beginnt von selbst mit einem Banner quer durchs Bild ("Runde 2 / Vergessen"; Anker `action` frühestens auf das zweite Wort, sonst ist es nach 0,5 s weg). Je Runde eine Kamera hinein und zurück (`AUTOMATIK.md` 6.3): so kommen fünf Runden-Szenen auf zwölf Bildwechsel |
| Nie | eine Runde, die das Handy nur durch Klasse 2 gewinnt (Erinnerung, Nachricht, Geburtstag), eine Runde zur Nähe (C1 hat hier kein Bild), Spott über Kunden |
| Produkt | durchgehend, als rechte Seite |
| Schluss | "Dein Favorit?" |

Beispiel (Döner Palast, IMBISS, 105 Wörter):
> [versus-split start, Einstieg] Papierkarte gegen Handy. Drei Runden, im Döner Palast. Wer gewinnt am Ende?
> [regen] Runde eins: Regen auf dem Heimweg. Die Papierkarte wird Matsch. Die Karte im Handy bleibt, wie sie ist. Punkt fürs Handy.
> [vergessen] Runde zwei: Karte zu Hause vergessen. Papier heißt: heute kein Stempel. Handy heißt: ein Scan mit der Kamera, und der Stempel ist sofort drauf. Zwei zu null.
> [app] Runde drei: eine App laden? Braucht keiner von beiden. Einmal den QR-Code scannen, und die Karte liegt in der Wallet. Unentschieden! Fair ist fair.
> [ende] Endstand: drei zu eins fürs Handy. Glückwunsch, liebes Handy.
> [cta-comment] Dein Favorit? Dann kommentiere jetzt IMBISS, und wir melden uns bei dir.

### F07 Meme-Bogen (Meme)

Ein Meme aus `HOOKS.md` 3.2 als Rahmen: erste Hälfte im Hook, zweite Hälfte als Pointe. Nur an einem Meme-Tag.

| | |
|---|---|
| Takte | Meme-Hook (0 bis 4 s) · das Bild, das die Erwartung baut (4 bis 12 s) · Wendung (12 bis 15 s, Pointe nach 10 bis 14 s, `HOOKS.md` H10) · zwei oder drei kurze Belege (15 bis 32 s) · Schluss (32 bis 42 s) |
| Hook | H10 mit dem Meme nach `HOOKS.md` 4.1 und 4.2 |
| Bausteine | die Spalte "Bild" des Memes in `HOOKS.md` 3.2; für "Red Flag / Green Flag" (M24) auch `versus-split` mit `leftLabel` "Red Flag" und `rightLabel` "Green Flag" (links steht immer Papier, rechts das Handy: für "Erwartung / Realität" passt es deshalb nicht) |
| Nie | ein zweites Meme, fremder Ton, eine Figur oder Sprechweise der Vorlage (`HOOKS.md` 4.3). Die Skripte in 3.2 mit `shop-map` nur, wenn V2 die Nähe erlaubt; sonst die Fassung des Memes ohne C1 |
| Produkt | in der Pointe (sie ist eine Aussage aus Klasse 1) und in den Belegen |
| Schluss | eine Frage zum Meme aus zwei Wörtern, z. B. "Und du?" |

Beispiel (Eis am Markt, EIS, M05, 105 Wörter):
> [paper-card, Einstieg] Deine Eisdiele macht Winterpause. Rate mal, was mit den Stempelkarten passiert.
> [paper-card, Kamera] Auf Papier: Sie liegen bis März in Schubladen, unter Kassenbons, im Altpapier. [guest-ghost] Und keiner weiß mehr, wie weit er war. Acht Stempel? Oder drei?
> [stamp-check] Im Handy: nichts! Gar nichts, wirklich.
> [wallet-pass] Sie bleiben einfach in Apple oder Google Wallet, den ganzen Winter, mit jedem Stempel. Die Karte zerknickt nicht und geht nicht verloren.
> [shop-door, eigener Laden] Im März kommt die erste Kundin wieder, und die Sonne auch. [wallet-pass, Stempel] Ein Scan mit der Handy-Kamera, und der Stempel ist sofort drauf. Genau da, wo sie im Herbst aufgehört hat.
> [cta-comment] Und du? Dann kommentiere jetzt EIS, und wir melden uns bei dir.

### F08 Der Moment in der Nähe (C1 als Kern)

Das einzige Format mit Karte von oben und Sperrbildschirm im Mittelpunkt: der Moment zuerst, dann wie es dazu kam, dann die Sicht des Ladens. Kein Papier.

| | |
|---|---|
| Takte | Moment auf dem Sperrbildschirm (0 bis 5 s) · Karte von oben: nur in der Nähe (5 bis 13 s) · Rückblick: einmal gescannt, Stempel (13 bis 24 s) · Sicht des Ladens (24 bis 32 s) · Schluss (32 bis 42 s) |
| Hook | H01 |
| Bausteine | `lock-notification` (Werte aus 6.4, Text mit dem Stand), `shop-map`, `wallet-pass` (Scan, Stempel), `lock-notification` als Sicht des Ladens |
| Nie | Papier (`paper-card`, `wallet-vanish`, `guest-ghost`, `card-bin`): das war der alte Bogen. Entfernung, Häufigkeit, "vibriert" (N3, `HOOKS.md` 1.6) |
| Produkt | durchgehend (C1, A2, A3, B2) |
| Schluss | "Du auch?" |
| Takt | höchstens eins in drei Videos (V2), nie direkt nach einem `A0` |

Beispiel (Bäckerei Morgenrot, BROT, 105 Wörter, T16):
> [lock-notification, Einstieg] Kurz vor acht, auf dem Weg zur Bahn, Kopfhörer im Ohr. Und ihre Stempelkarte meldet sich.
> [Kamera] Noch ein Stempel bis: Gratis-Brötchen.
> [shop-map] Sie ist gar nicht in der Bäckerei, nur in der Nähe. Und ihr Handy zeigt die Karte von selbst, auf dem Sperrbildschirm, mit dem Stand.
> [wallet-pass, Scan] Gespeichert hat sie die Karte vor drei Wochen, an der Theke. Einmal den QR-Code gescannt, ohne App.
> [wallet-pass, Stempel] Seitdem landet jeder Stempel sofort auf ihrem Handy, jeden Morgen genau einer.
> [lock-notification, Sicht des Ladens] Und für deine Bäckerei heißt das: Du stehst auf dem Sperrbildschirm deiner Stammkunden. Ohne dass du etwas tust.
> [cta-comment] Du auch? Dann kommentiere jetzt BROT, und wir melden uns bei dir.

### F09 Stimmt oder stimmt nicht? (Quiz)

Drei oder vier Behauptungen als Kommentare, jede bekommt ihren Stempel; die Erklärung ist kurz.

| | |
|---|---|
| Takte | Behauptung 1 (0 bis 3 s) · Urteil und Erklärung (3 bis 10 s) · Behauptung 2 mit Urteil und Erklärung (10 bis 19 s) · Behauptung 3 (19 bis 27 s) · Behauptung 4, kurz (27 bis 32 s) · Schluss (32 bis 42 s) |
| Hook | H06 (die Behauptung, die der nächste Satz beantwortet) |
| Bausteine | `comment-thread` je Behauptung (`"typed": false`, `verdict` "falsch" oder "stimmt", Anker `verdict` auf "Stimmt"), nach jedem Urteil mit Schnitt ein Bild der Erklärung (`wallet-pass`, `big-number`) |
| Nie | Behauptungen, deren Antwort Klasse 2, "kein Bild" oder "nur gesprochen" ist (Statistik, Newsletter, Preise, Datenschutz F1 bis F4): der Stempel am Kommentar wäre ihr Bild |
| Produkt | durchgehend, jede Erklärung ist eine Zeile aus Klasse 1 |
| Schluss | "Alles gewusst?" |

Beispiel (Döner Palast, IMBISS, 108 Wörter):
> [comment-thread, Einstieg] Für die Stempelkarte im Handy braucht dein Kunde eine App?
> [Stempel "Stimmt nicht"] Stimmt nicht. [wallet-pass, Scan] Er scannt einmal den QR-Code, und die Karte liegt in seiner Wallet. Kein Download, kein Store.
> [comment-thread] Der Stempel kommt erst am nächsten Tag an? [Stempel] Stimmt nicht. [wallet-pass, Stempel] Du scannst mit der Handy-Kamera, und er ist sofort auf seinem Handy. Noch an der Theke, bevor er zahlt.
> [comment-thread] Zehn Stempel sind Pflicht? [Stempel] Stimmt nicht. [big-number "6"] Wie viele Stempel es bis zum Gratis-Döner braucht, legst du selbst fest. Auch sechs, wenn du magst.
> [comment-thread] Das geht nur mit Apple? [Stempel] Stimmt nicht. [wallet-pass] Die Karte liegt in Apple Wallet oder Google Wallet.
> [cta-comment] Alles gewusst? Dann kommentiere jetzt IMBISS, und wir melden uns bei dir.

### F10 Eine Zahl erklärt (Studie)

Eine Studienzahl aus `PRODUKT.md` (S1 bis S5) groß im Bild, mit Quelle im gesprochenen Satz; was sie für den Laden heißt; das Produkt erst am Ende. **Handy spät.**

| | |
|---|---|
| Takte | Frage oder Moment (0 bis 4 s) · Auflösung als Zahl, Quelle gesprochen (4 bis 12 s) · was die Zahl heißt (12 bis 20 s) · was der Laden daraus macht (20 bis 29 s) · Produkt (29 bis 33 s) · Schluss (33 bis 42 s) |
| Hook | H05; die Zahl nie im ersten Satz (`HOOKS.md` 1.5) |
| Bausteine | `big-number` (Zahl genau wie in `PRODUKT.md`, Spanne als Spanne, Bindestrich), `shop-counter` oder `week-strip` für das Bild dazu, `tip-cards` mit einem Zettel für den Rat, am Ende `wallet-pass` |
| Nie | die Quelle im Bild, eine zweite Studie, die Zahl als Zusage für den eigenen Laden, die Einschränkung weglassen (S4: nicht Deutschland; S5: eine Supermarkt-App) |
| Produkt | letzter Satz vor dem Schluss (A1, A4) |
| Schluss | "Schon gewusst?" |

Beispiel (Eis am Markt, EIS, 106 Wörter, S3):
> [shop-counter, Einstieg] Wer ist teurer: der Neue oder der Stammkunde? Rate mal.
> [big-number "5-25×"] Laut Harvard Business Review ist ein neuer Kunde fünf- bis fünfundzwanzigmal so teuer wie einer, der bleibt.
> [Kamera auf die Zahl] Flyer, Rabatte, Werbung: das alles nur für den ersten Besuch.
> [week-strip] Wer schon zweimal da war, kennt deine Eisdiele längst. Den musst du nur noch halten.
> [tip-cards, ein Zettel] Heißt: Kümmer dich um die, die schon da waren. Merk dir ihre Sorte, sag ihnen, wie weit sie sind. Und gib ihnen eine Karte, die nicht im Portemonnaie zerfällt.
> [wallet-pass] Bei Eis am Markt liegt sie im Handy, in der Wallet, ohne App.
> [cta-comment] Schon gewusst? Dann kommentiere jetzt EIS, und wir melden uns bei dir.

## 5. Was für alle Formate gilt

- **Kein Takt aus dem alten Bogen als Füllung.** Fehlen Bildwechsel, kommt
  eine Kamerafahrt (Werte in `AUTOMATIK.md` 6.3) oder ein weiterer Teil
  desselben Kern-Bilds dazu, nicht Papier, Wallet oder Karte von oben.
- **Pointe nur, wo das Format eine hat** (F03, F05, F07). `stamp-check` ist
  kein Pflichtbild mehr.
- **Die Belege im Beispiel sind Belege, kein Wortlaut zum Abschreiben.** Ein
  Satz aus einem Beispiel oben kommt höchstens einmal in 60 Tagen in ein
  Video (wie Hooks, `HOOKS.md` 2).
- **Erst das Format, dann der Text.** Wer beim Schreiben merkt, dass der Text
  in den alten Bogen kippt (Problem mit Papier, Karte im Handy, Stempel,
  Nähe, Sperrbildschirm), hat das Format verlassen: neu anfangen.

## 6. Proben vom 17.11.2026

Drei Entwürfe ohne Stimme, genau nach diesen Dokumenten, als Folge für den
19., 20. und 21.11.2026 (jeder hält V1 bis V7 gegen die Videos davor ein):

| Entwurf | Format, Laden | Wörter | geschätzte Länge | Bildwechsel | längstes Bild | Warnungen |
|---|---|---|---|---|---|---|
| Döner, "Wer soll bei der Mittagsschlange noch stempeln?" | F03, Döner Palast | 106 | 50,1 s | 15 | 4,8 s | keine |
| Bäckerei, "Sechs Uhr. Der Ofen läuft." | F05, Bäckerei Morgenrot | 106 | 50,6 s | 17 | 4,8 s | keine |
| Eisdiele, "Papierkarte gegen Handy." | F06, Eis am Markt | 106 | 51,1 s | 14 | 4,8 s | keine |

Was dabei auffiel und schon eingearbeitet ist: Schlussfragen mit drei und mehr
Wörtern ließen das Schlussbild über 5 s stehen (jetzt höchstens zwei Wörter);
eine lange Frage mit Antwort deckte das Eingabefeld zu (`comment-thread`
verkleinert jetzt erst die Schrift); im Duell stand 43 s lang dasselbe Bild
(`versus-split` hat jetzt das Banner je Runde, größere Karten, tiefere
Theken); auf der Tagesuhr stand "Feierabend" kurz unter "12:15" (die Zeile
kommt jetzt mit der neuen Uhrzeit); eine zweite Frage mit elf Wörtern ohne
Kamera stand 5,2 s (Faustregel aus `AUTOMATIK.md` 6.3 gilt auch hier).
Offen: F01, F02, F04 und F07 bis F10 sind nur als Bausteine erprobt, nicht
als ganzes Video; keins der Formate lief mit Stimme.
