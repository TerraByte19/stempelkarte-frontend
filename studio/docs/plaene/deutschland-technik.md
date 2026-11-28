# Plan: "So digital ist Deutschland" (Bäckerei Morgenrot)

Stand 17.11.2026, abends. Idee auf dem Board: `20261117-deutschland-technik`
(Wunsch des Betreibers). Diesen Plan nimmt der Lauf, sobald er diese Idee
baut (`AUTOMATIK.md` Abschnitt 5, "Ideen mit eigenem Plan"; Schritte 14 bis
16). In den Punkten, die Abschnitt 3 unter "Was der Plan ersetzt" aufzählt,
gilt er vor `AUTOMATIK.md` (auch vor Abschnitt 6 und Schritt 16), vor
`FORMATE.md` und vor `HOOKS.md`; so steht es auch in `AUTOMATIK.md` 5. In
allem anderen gelten sie, und `PRODUKT.md` gilt immer.

Herkunft: Entwurf der Hook-Recherche vom 17.11.2026 (Jury-Runde, `HOOKS.md`
1.7), vom Betreiber freigegeben mit drei Entscheidungen (Abschnitt 1). Nicht
gebaut, nicht gerendert, keine Stimme bezahlt.

**18.11.2026, "3D zuerst":** der Betreiber will so wenig 2D wie möglich
(`AUTOMATIK.md` 6.4). Seitdem zeigt dieser Plan die Papierkarte im Laden
(`iso-shop`), die Karte im Handy (`phone-3d`) und den Laden am Schluss
(`iso-shop`) in 3D. 2D bleiben Pinnwand und Fallblatt (`tip-cards`,
`big-number`): sie sehen aus wie eine Oberfläche, die Jury hat den Anfang
genau so bewertet, und F01 als Etikett hängt am Einstieg `tip-cards`.
**Kein gesprochener Satz hat sich geändert**, auch keine Tafel; Motive
(Papier, Scan), Einstieg, Kern-Bild und Zahl der Bildwechsel bleiben gleich,
also auch alle Regeln in Abschnitt 3.

## 1. Was der Betreiber freigegeben hat

1. **Erster Satz:** "Ausdrucken, unterschreiben, einscannen. So digital ist
   Deutschland." Er ersetzt den früheren ersten Satz "Deutschland und
   Technik sind Erzfeinde." (Jury-Runde: 6,58 gegen 5,83 mit Bild und Ton,
   4,50 als stilles Bild). Alles danach bleibt wortgleich.
2. **Dazu** die Zeile "Entwickelt übrigens in Deutschland." direkt nach
   "Einmal scannen, kein Download." (`PRODUKT.md` F1: nur gesprochen, kein
   Bild, auf der Tafel ohne Hervorhebung).
3. **Keine Schlussfrage** ("Erwischt?" kommt nicht), und **kein Satz zum
   Bargeld**, auch nicht als Ton (`kasse`, `muenzen`) oder Bild.

Der Wortlaut in Abschnitt 2 ändert kein Lauf, auch nicht, um Richtwerte zu
erreichen. Ein Änderungswunsch des Betreibers an diesem Video läuft wie jeder
andere über Schritt 9.

## 2. Der Text

| Satz | Text | Beleg |
|---|---|---|
| 1 | Ausdrucken, unterschreiben, einscannen. So digital ist Deutschland. | kein Satz über die App |
| 2 | Wir faxen noch. | |
| 3 | Und Stempel sammeln wir auf Pappe. | |
| 4 | Dabei hat fast jeder deiner Kunden ein Handy in der Tasche. | |
| 5 | Mit Stampit liegt deine Stempelkarte in Apple und Google Wallet. | A1 |
| 6 | Einmal scannen, kein Download. | A3, A2 |
| 7 | Entwickelt übrigens in Deutschland. | F1, nur gesprochen |
| 8 | Sei der Laden, der nicht zwanzig Jahre hinterher ist. | |
| 9 | Kommentiere KARTE, und wir melden uns. | Aufforderung |

60 Wörter, gesprochen rund 24 s, mit Schlussbild rund 27 s (Schätzung).
Die Prüfung `laenge` verlangt 20 bis 60 s: passt. Länge, Wörter, Schlussfrage
und die Form der Aufforderung des Laufs gelten hier nicht (Abschnitt 3, "Was
der Plan ersetzt", Punkte 5 und 6): der Text ist freigegeben. "Stampit"
spricht die Stimme von selbst als "Stämp-it" (`engine/script.mjs`,
`SAY_DEFAULT`).

## 3. Format, Thema und Regeln

Keins der zehn Formate passt zu diesem Text: er hat einen eigenen Bogen,
keine Schlussfrage und rund halb so viele Wörter. Damit die Regeln trotzdem
zählen, was das Video zeigt, trägt es:

| Feld in `meta` | Wert | Warum |
|---|---|---|
| `format` | `F01` | gleicher Einstieg (`tip-cards`, die Pinnwand) und gleiches Kern-Bild (`zettel`) wie F01. Ohne `format` läse `tools/abwechslung.mjs` das Video als `A0`, also als F08 mit Kern-Bild `naehe`, und sperrte F08 fünf Tage lang zu Unrecht |
| `beleg_kern` | `ohne-app` | Satz 5 und 6 (A1, A2, A3) |
| `branche` | `cafe` | die Bäckerei läuft als `cafe` (`THEMEN.md`, "Läden") |
| `thema` | `kein-download` | Satz 6 und die Kernaussage `ohne-app` sind genau dieser Blickwinkel (`THEMEN.md`). Fest, auch wenn an der Idee auf dem Board ein anderes oder keins steht: Schritt 14 schreibt es mit an die Idee. Themenpause und "Thema mit Laden" hängen daran |
| `hook_muster` | `H16` | Selbstironie mit Papierkram (`HOOKS.md` 2) |
| `hook_punkte` | `10` | Bewertungsbogen `HOOKS.md` 1.8, wie dort in der Tabelle "Gegen die Jury gehalten" |
| `hook_kandidaten` | siehe Abschnitt 4 | |
| `meme` | `""` | kein Meme: nur F07 trägt eins |
| `beleg` | `["A1", "A2", "A3", "F1"]` | |
| `idee_id` | `20261117-deutschland-technik` | |

Abgelesen (`abwechslung.mjs felder`, Schritt 16): Einstieg `tip-cards`,
Motive `papier` (`iso-shop` mit `"paper": true`) und `scan` (`phone-3d` mit
Scan), keine Schlussfrage. Dieselben Felder wie in der 2D-Fassung vom
17.11.2026 (`paper-card`, `wallet-pass`).

### Was der Plan ersetzt

In genau diesen Punkten gilt der Plan, auch vor `AUTOMATIK.md` 6, 6.2 und
Schritt 16 (dort Abschnitt 5, "Was ein Plan ersetzt"):

1. **Takte, Hook, Bausteine und Kernaussage von F01** (`FORMATE.md` 4) und
   `AUTOMATIK.md` 6, Zeile "Format": es gelten die Bilder aus Abschnitt 4,
   in dieser Reihenfolge, mit diesen Werten. F01 ist hier ein Etikett für
   die Regeln.
2. **"Nie" und "Produkt" von F01** (kein Papier, kein Scan, das Produkt nur
   im letzten Satz, A3, B2 oder D2): hier die Papierkarte (`iso-shop` mit
   `"paper": true`) in Szene 1, die Karte im Handy mit Scan (`phone-3d`) in
   Szene 3 und das Produkt ab Satz 5 (A1, A2, A3, F1).
3. **"Handy spät"** (`FORMATE.md` 4): das Handy kommt bei rund 11,9 von 24,8
   gesprochenen Sekunden, im Entwurf geschätzt rund 16 s vor dem letzten
   Wort. Die Prüfung dazu in Schritt 16 entfällt.
4. **`HOOKS.md` 0** (Kandidaten, Bogen, Wahl) und die Muster je Format
   (`HOOKS.md` 1.7.3, dort hat F01 kein H16): der erste Satz ist
   freigegeben; `hook_muster`, `hook_punkte` und `hook_kandidaten` stehen
   oben und in Abschnitt 4. Der Takt von H16 (`HOOKS.md` 1.7.2) gilt.
5. **Länge:** 60 Wörter, 11 Textzeilen (die zwei des Schlusses
   mitgezählt), 4 Szenen vor dem Schluss statt 105 bis 115 Wörtern, 15 bis
   21 Textzeilen und 5 bis 7 Szenen (`AUTOMATIK.md` A1 und 6, Zeile
   "Länge"; Kennzahl `woerter` in Schritt 16). Es bleiben:
   die Prüfung `laenge` (20 bis 60 s), höchstens 800 Zeichen, über 56 s
   geschätzt keine Aufnahme.
6. **Schluss:** keine Schlussfrage, und statt "Dann kommentiere jetzt
   KARTE," / "und wir melden uns bei dir." die eine Zeile aus Satz 9
   (`AUTOMATIK.md` 6, Zeile "Schluss", und 6.2; F01, Zeile "Schluss"; V7).
7. **Erster Bildwechsel:** die Kamera auf "einscannen", dem letzten Wort
   der ersten Textzeile, bei rund 1,9 s, statt auf dem ersten Wort der
   zweiten (`AUTOMATIK.md` 6, Zeile "Einstieg"; `HOOKS.md` 1.2 und 1.7.4).
   Die Grenzen von `tools/einstieg.mjs` gelten.
8. **Einlösung bis 10 s** (`HOOKS.md` 1.7.4): die Papierkarte bei rund 6 s,
   wie H16 es verlangt (`HOOKS.md` 1.6); das Produkt folgt bei rund 12 s.
9. **Abwechslung:** V1 (das Format ist nur ein Etikett), V7 (es gibt keine
   Schlussfrage) und von V9 nur der Teil "Kernaussage im Format erlaubt"
   (`ohne-app` ist keine Kernaussage von F01). Genau diese drei dürfen in
   `verletzt` von `abwechslung.mjs pruefen` stehen; sie kommen in
   `pruefung`.

**Was gilt, ohne Ausnahme:** `PRODUKT.md`, Abschnitt 1 von `AUTOMATIK.md`,
V2, V3 (Papier höchstens in einem von drei Videos), V4 (`tip-cards` nicht als
Einstieg eines der zwei Videos davor), V5 (nicht direkt nach einem Video der
Bäckerei), V6 (Kern-Bild `zettel` nicht in den drei Videos davor), V8 (Scan
höchstens in einem von drei), V9 gegen die zwei Videos davor (nicht
`ohne-app` direkt hintereinander), V10, V11, Themenpause und "Thema mit
Laden". Dazu `HOOKS.md` 1.7.2: H16 höchstens eins in zehn Videos, nie zwei
Deutschland-Witze in derselben Woche. Stil C, Töne, Kopf des Skripts und
Beitragstext wie in `AUTOMATIK.md` 6.

**Nichts wird angepasst.** Wortlaut und Bilder bleiben, wie sie hier
stehen. Meldet Schritt 16 eine Regel, die oben nicht ausgenommen ist (zum
Beispiel V10, gleiche Sätze), ist die Idee an diesem Tag nicht erlaubt: sie
geht zurück auf `offen` und wartet (`AUTOMATIK.md` Schritt 16). Eine Fassung
ohne Papier- oder Scan-Bild gibt es nicht: der Plan ist so freigegeben
(Abschnitt 1), und H16 verlangt die Papierkarte bis rund 6 s.

### Wann

**Nie am 22.11.2026** (Totensonntag: kein Witz-Video an einem stillen Tag;
Termin aus Suchtreffern, nicht in einem Kalender nachgesehen). Sonst an dem
Tag, für den die Regeln es erlauben: Schritt 14 (für `ZIEL`) und Schritt 22
(für `UEBERMORGEN`) prüfen das jeden Tag nach `AUTOMATIK.md` 5, "Darf sie an
einem Tag D laufen?" (Themenpause, Thema mit Laden, H16, V3, V4, V5, V6, V8,
V9; V10 erst in Schritt 16). Ein festes Datum steht hier mit Absicht
nicht: es hängt an den Videos davor, und die können sich ändern.

Zum Beispiel, Stand 17.11.2026 abends, keine Regel: das Salon-Video vom
18.11.2026 auf dem Board hat `thema` `kein-download`, Papier, Scan und die
Kernaussage `ohne-app`. Allein die Themenpause sperrt damit jeden Tag bis
einschließlich 25.11.2026. Wird dieses Video durch eine andere Fassung
ersetzt, gilt deren Thema, und der Tag kann früher kommen (die Fassung
`videos/2026-11-18-salon-zu-selten` im Repo hat `thema` `stempelzahl`, keine
Motive und `gestalten`; dann sperrt das Döner-Video vom 17.11. über V3 und
V8 noch den 19.11., danach zählen die Videos ab dem 19.11.).

Solange die Idee wartet, nimmt der Lauf für andere Videos kein F01 und kein
F02 (gleicher Einstieg `tip-cards`, gleiches Kern-Bild `zettel`), wenn sie
in den drei Tagen danach laufen könnte: in Schritt 14 und in Schritt 22, mit
der Probe aus `AUTOMATIK.md` 5 ("Sperre für F01 und F02").

## 4. Das Skript, Bild für Bild

`*Wort` = Schlüsselwort, `|` = neue Tafel; in der ersten Textzeile mit
`"instant": true` heißt `|` neue Reihe. Zeiten sind Schätzungen aus dem
Entwurf der Recherche. Kopf des Skripts wie immer aus der Vorlage
(`AUTOMATIK.md` 6.1). Ordner `<ZIEL>-deutschland-technik`.

| ca. Zeit | Gesprochen | Tafel | Bild (Baustein, Werte) | Ton |
|---|---|---|---|---|
| 0,00 | (Stimme ab 0,35 s) | ab Bild 0, `"instant": true`, drei Reihen, ohne `scale`: `Ausdrucken,` / `unterschreiben,` / `*einscannen.` | **Szene 1, Teil 1:** `tip-cards`, `"rise": false`, `"numbered": false`, `"show": 1`, `head` "Digital auf Deutsch", `items` `[ { "title": "Bitte per Fax zurück." } ]`, Anker `card` auf `{ "at": "start", "offset": 0.15 }` (der Zettel leuchtet mit Ton auf). Bild 0 in fünf Wörtern: "Pinnwand: Bitte per Fax zurück" | **`papier-knuellen`** bei 0,00 s: `"sounds": [ { "sound": "papier-knuellen", "at": "start", "offset": 0, "vol": 1.5 } ]` (leise Datei, -22,5 LUFS) |
| 0,15 | | | der Zettel leuchtet auf | `pop` des Bausteins |
| 0,35 bis 2,4 | Ausdrucken, unterschreiben, einscannen. | (steht) | Kamera auf "einscannen" (`AUTOMATIK.md` 6.3, `tip-cards`): `"zoom": 1.2, "focus": [500, 1040], "to": [540, 1080], "dur": 0.3`; das ist der erste Bildwechsel, rund 1,9 s | |
| 2,7 bis 4,0 | So digital ist Deutschland. | `So *digital \| ist *Deutschland.` | **Teil 2**, `"enter": "cut"`: `big-number`, `"from": "2026"`, `"value": "FAX"`, `label` "Deutschlands Lieblingsgerät", Anker `show` auf "faxen" (nächste Textzeile). Bis dahin steht "2026" auf dem Fallblatt | **`vine-boom`** auf "Deutschland" (`vol` 1,5): der eine Akzent in den ersten zwei Textzeilen (`AUTOMATIK.md` 6, Zeile "Stimme, Töne, Farben"; Klang und `vol` aus `HOOKS.md` 1.7.5). Er liegt bei rund 3,6 s, nach den 3 s, die `HOOKS.md` 1.7.5 nennt: es gilt `AUTOMATIK.md`, er bleibt |
| 4,3 bis 5,3 | Wir faxen noch. | `Wir *faxen \| noch.` | (Teil 2) das Fallblatt klappert von 2026 auf FAX; Kamera nach dem Klappern auf "noch" (6.3, `big-number`: `"zoom": 1.15, "focus": [540, 820], "to": [540, 860], "dur": 0.3`) | `tick`, `pop` des Bausteins |
| 5,6 bis 7,6 | Und Stempel sammeln wir auf Pappe. | `Und *Stempel sammeln \| wir auf *Pappe.` | **Teil 3**, `"enter": "cut"`: **`iso-shop`** (3D), `branch` "baeckerei", `shop` "Bäckerei Morgenrot", `icon` bread, `stamps` 10, `have` 7, `"start": "counter"`, `"phone": false`, `"bubble": false`, `"paper": true`, `"close": "counter"`, Anker `zoom` auf `{ "at": "start", "offset": 0 }` (von Anfang an die Theke von oben, die Papierkarte groß), `crumple` auf "Pappe" mit `"offset": 0.2` (sie knüllt sich und fliegt in den Papierkorb; das einzige Papier-Bild, zugleich der Gegenstand seines Ladens, den `HOOKS.md` 1.6 für H16 bis rund 6 s verlangt). Rückfall, wenn das Standbild die Karte nicht klar zeigt: `paper-card` wie in der Fassung vom 17.11.2026 (`"mug": true`, `filled` 7, Anker `hit` auf "Pappe", Ton `thud`) | `crumple` und `drop` des Bausteins |
| 7,9 bis 11,6 | Dabei hat fast jeder deiner Kunden ein Handy in der Tasche. | `Dabei hat fast jeder \| deiner *Kunden \| ein *Handy \| in der Tasche.` | **Szene 2:** `big-number`, `"from": "PAPPE"`, `"value": "HANDY"`, `label` "hat fast jeder in der Tasche", Anker `show` auf "Handy"; Kamera auf "Tasche" (Werte wie oben) | Töne des Bausteins |
| 11,9 bis 15,3 | Mit Stampit liegt deine Stempelkarte in Apple und Google Wallet. | `Mit *Stampit \| liegt deine *Stempelkarte \| in *Apple und *Google Wallet.` | **Szene 3:** **`phone-3d`** (3D), `"mode": "wallet"`, `shop` "Bäckerei Morgenrot", `icon` bread, `stamps` 10, `before` 3, `after` 3, `reward` "Gratis-Brötchen" (die Karte zeigt "10 Stempel = 1 Gratis-Brötchen"), `"scan": false`, `"rise": true` (das Handy kommt aus der Tasche), Anker `card` auf "Stempelkarte". Keine Kamera (3D) | `pop` des Bausteins |
| 15,6 bis 17,0 | Einmal scannen, kein Download. | `Einmal *scannen, \| kein *Download.` | **Teil 2 von Szene 3**, `"enter": "cut"` auf "Einmal": `phone-3d` wie Teil 1, aber `"scan": true`, `"rise": false`, `"drop": false`, `"angle": -14`, `"push": 0.2` (das Handy von der anderen Seite und näher; ersetzt die 2D-Kamera auf den QR-Code, damit die Zahl der Bildwechsel bleibt). Anker `scan` auf "scannen": Scan-Rahmen und Linie, 0,95 s später der Haken (auf "Download") | `scan`, `ok` des Bausteins |
| 17,3 bis 18,7 | Entwickelt übrigens in Deutschland. | `Entwickelt übrigens \| in Deutschland.` (ohne `*`) | **Teil 3 von Szene 3**, `"enter": "cut"`: `phone-3d` wie Teil 1, `"scan": false`, `"rise": false`, `"drop": false`, `"angle": 8`, `"deko": false` (das Handy ruhig, ohne Münzen). Kein Stempel, kein Schild: F1 hat kein Bild | keiner |
| 19,0 bis 22,2 | Sei der Laden, der nicht zwanzig Jahre hinterher ist. | `Sei der *Laden, \| der nicht \| *zwanzig Jahre \| hinterher ist.` | **Szene 4:** **`iso-shop`** (3D), `branch` "baeckerei", `shop` "Bäckerei Morgenrot", `icon` bread, `stamps` 10, `have` 3, `"start": "door"`, `"phone": false`, `"bubble": false`, `"tones": false`, Anker `enter` auf "hinterher" (mindestens 1,1 s nach dem Anfang der Szene, sonst steht die Glastür in Bild 0 offen): ein Kunde kommt durch die Glastür in die Bäckerei am Abend. Keine Kamera. Rückfall: `shop-door` wie in der Fassung vom 17.11.2026 (`"accent": "#5A4FCF"`, `"spit": false`, `"guest": true`, Anker `close` auf "hinterher") | `ladenglocke` am Anker `enter`: `"sounds": [ { "sound": "ladenglocke", "anchor": "enter", "vol": 0.8 } ]` |
| 22,5 bis 24,8 | Kommentiere KARTE, und wir melden uns. | `{ "role": "cta", "lines": ["Kommentiere KARTE,{Karte,}", "und wir melden uns."], "gapBefore": 0.65 }`, keine Schlussfrage davor | **Szene 5:** `cta-comment`, `bubble` "KARTE", Anker `logo` auf `{ "cap": -1, "word": -1 }` | `chime` des Logos |

**Sekunde 0 bis 3** (`HOOKS.md` 1.7.4): Ton bei 0,00 s (Papier knüllt),
Bewegung bei 0,15 s (der Zettel leuchtet), Stimme ab 0,35 s, erster
Bildwechsel (Kamera) auf "einscannen" bei rund 1,9 s, Schnitt auf das
Fallblatt bei rund 2,6 s. `tools/einstieg.mjs` muss mit 0 enden.

**Töne:** genau die Bibliotheksklänge, die `AUTOMATIK.md` 6 erlaubt: der
Ortsklang bei 0,00 s, ein Akzent in den ersten zwei Textzeilen und
`ladenglocke` an `shop-door`. Der Entwurf der Recherche hatte dazu
`erfolg-pling` auf "Handy"; das fällt weg, weil es keiner dieser drei ist.

**Bildwechsel** (Schätzung): 11, die Prüfung `bildwechsel` warnt unter 12.
In 3D gleich viele: der Schnitt auf das zweite Handy in Szene 3 ersetzt die
2D-Kamera auf den QR-Code. 3D-Bilder sind Teil 3 von Szene 1, die drei Teile
von Szene 3 und Szene 4, rund 13 von 27 s; der Bau dauert deshalb länger
(`AUTOMATIK.md` Schritt 16, "Der Bau dauert": im Hintergrund bauen).
Bei rund 27 s sind das im Mittel rund 2,5 s je Bild, kein Bild über 4 s.
Warnung verstehen und in `pruefung` vermerken, nicht mit Papier, Wallet oder
Karte von oben auffüllen (`FORMATE.md` 5).

**`hook_kandidaten`** (die Wahl hat der Betreiber getroffen, `HOOKS.md` 0
entfällt):

```json
[
  { "satz": "Ausdrucken, unterschreiben, einscannen. So digital ist Deutschland.", "muster": "H16", "punkte": 10,
    "gruende": "S1 Knüllen und Zettel, S2 Papierkram, S3 Selbstironie, K1 nein, K2 ja, K3 drei Wörter, W1 kennt er, W2 nein, W3 Papierkarte bei 6 s", "raus": "" },
  { "satz": "Deutschland und Technik sind Erzfeinde.", "muster": "H16", "punkte": 0, "gruende": "",
    "raus": "vom Betreiber durch den Satz oben ersetzt (Jury-Runde 5,83 gegen 6,58)" }
]
```

## 5. Beitragstext

Mit `node studio/tools/beitrag.mjs pruefen --branche cafe --stichwort KARTE
--hook "Ausdrucken, unterschreiben, einscannen."` geprüft: Ende-Code 0, 227
Zeichen, 2 Emojis (17.11.2026). Kommt Zeichen für Zeichen in `caption`
(`AUTOMATIK.md` 6.6):

```
Ausdrucken, unterschreiben, einscannen. So digital ist Deutschland. 📠
Deine Stempelkarte muss nicht auf Pappe bleiben: Sie liegt in Apple und Google Wallet. Einmal scannen, kein Download.
👉 Kommentiere KARTE und wir melden uns.

#bäckerei #cafe #berlincity #kleinunternehmen #stammkunden
```

## 6. Beim Bau prüfen

- Schritt 16 wie immer, mit `--stills 0,0.5,1,2,3` und `tools/einstieg.mjs`
  (`AUTOMATIK.md`, Zeile "Die ersten 3 Sekunden").
- Prüfungen `textbreite` und `wortgroesse` an der ersten Tafel
  ("unterschreiben," hat 15 Zeichen), `schreibweise`, `effekte`;
  `bildwechsel` warnt erwartungsgemäß.
- `big-number` mit "FAX", "HANDY", "PAPPE" und den beiden `label`: Buchstaben
  sind in einer Probe geprüft ("FAX"), diese Werte nicht.
- `cta-comment` nur mit der Aufforderung, ohne Schlussfrage: so noch nie
  gebaut (der Baustein verlangt nur eine Textzeile mit `role` "cta").
  Standbild des Schlusses ansehen.
- **3D-Bilder** (seit 18.11.2026): Standbild kurz nach "Pappe" (die Karte
  liegt groß auf der Theke, dann die Kugel im Flug), nach "Stempelkarte"
  (die Karte in der Wallet, "Bäckerei Morgenrot" lesbar), nach "Download"
  (Haken über dem QR-Code) und nach "hinterher" (Glastür, Kunde in der Tür,
  Schild "Bäckerei Morgenrot" lesbar). Stimmt eins nicht, nur dieses Bild auf
  seinen Rückfall in Abschnitt 4 stellen und in `pruefung` vermerken; Text
  und Reihenfolge bleiben.
- **Kein Amt im Bild:** keine Behörde, kein Schild, keine Uniform, kein
  anderes Land, kein Bargeld; der Beitragstext nennt keins.
- Lautstärke von `papier-knuellen` und `vine-boom` ist nicht angehört
  (`HOOKS.md` 1.7.5).
- `abwechslung.mjs pruefen`: in `verletzt` dürfen nur V1, V7 und V9
  "im Format erlaubt" stehen (Abschnitt 3). Steht dort etwas anderes,
  ändert sich nichts am Skript: die Idee wartet (Abschnitt 3, "Nichts wird
  angepasst").

## 7. Nicht geprüft

Alle Zeiten (Schätzung), das Aussehen von `tip-cards` als Büro-Pinnwand in
Bild 0, die Klänge, die Wirkung auf die Skip-Rate. Die 3D-Fassung vom
18.11.2026 ist mit `--check` und Standbildern geprüft (Abschnitt 6), als
ganzes Video nie gebaut; ob der Schnitt von der 2D-Pinnwand und dem
Fallblatt in den 3D-Laden und zurück ruhig wirkt, zeigt erst das Video. Die Jury-Punkte stammen
von simulierten Zuschauern (n = 3) und gelten für den Anfang mit Pinnwand,
Papierknüllen und Fallblatt wie oben; eine andere Inszenierung ist nicht
bewertet.
