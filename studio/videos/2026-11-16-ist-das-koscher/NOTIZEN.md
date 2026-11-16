# Notizen zum Video "Ist das koscher?" (16.11.2026)

Diese Datei hält fest, was beim Bau des zweiten Videos neu entstanden ist und
was davon später ins Playbook gehört. Das Playbook selbst wurde hier nicht
angefasst.

## Stand

- Fertiges Video: `out/video.mp4`, 40,7 s, 1080x1920, 30 Bilder/s, mit Stimme.
- Text: Wort für Wort der freigegebene (109 Wörter, 658 Zeichen). Geprüft mit
  `node studio/tools/times.mjs studio/videos/2026-11-16-ist-das-koscher --text`.
- Aufnahme: **eine** volle Aufnahme am 16.11.2026, 658 Zeichen, Schlüssel
  `593a18385cf458fa`, Liam, Tempo 1,05, ohne seed. Sie liegt im Ordner
  `voice/` (drei Dateien, rund 0,65 MB).
- **Noch nicht committet.** Der Ordner `voice/` muss ins Repo, sonst ist die
  bezahlte Aufnahme mit der Sitzung weg.
- **Nicht im Kassenbuch gebucht.** `tools/budget.mjs` und `state/` wurden hier
  nicht angefasst. Nachzutragen: 16.11.2026, Art voll, 658 Zeichen, Video
  `2026-11-16-ist-das-koscher`, Zweck neu.
- Die Zeichenzahl ist 658, nicht rund 520 wie vorab geschätzt.
- **Nicht abgehört.** Lautheit, Pausen und Text sind gemessen und mit einer
  Mitschrift verglichen. Wie die Stimme klingt (Betonung der beiden
  koscher-Sätze, Aussprache) und wie die lautere Mischung klingt, hat noch
  niemand gehört.

## Was neu ist, alles nur auf Wunsch im Skript

Ein Skript ohne diese Angaben wird gelesen und gebaut wie vorher
(`tools/regress.mjs` und `tools/selftest.mjs` halten das fest).

### Textzeilen im Modus "wort"

```json
"captionStyle": { "mode": "wort" }
```

Oben steht immer nur eine Tafel: ein Wort, oder zwei, wenn beide sehr kurz
sind. Jede löst die vorige im Takt der Stimme ab. Normale Wörter klein und
hell, Schlüsselwörter groß und lila.

- `*Wort` markiert ein Schlüsselwort. Bis zu drei in Folge bleiben zusammen
  ("*vor *deiner *Tür.").
- `|` ist eine Grenze zwischen zwei Tafeln. Steht in einer Zeile ein `|`,
  gelten dort nur die Grenzen aus dem Skript. Ohne `|` teilt sich die Zeile
  von selbst auf: zwei normale Wörter teilen sich eine Tafel, wenn sie
  zusammen höchstens 10 Zeichen haben (`pair`), nie über ein Satzzeichen
  hinweg.
- Eine Tafel darf gemischt sein: `Dein *Handy` zeigt "Dein" klein und "Handy"
  groß nebeneinander. Gut gegen Wörter, die sonst nur aufblitzen.
- `"instant": true` zeigt alle Zeilen der Textzeile als eine Tafel
  untereinander. Bei der ersten Textzeile steht sie ab Bild 0 da (der
  Einstieg).
- `"scale": 1.2` an einer Textzeile macht ihre Tafeln größer.
- `"mode": "zeile"` an einer einzelnen Textzeile holt die alte Darstellung
  zurück. Nötig für die Schlussfrage mit `"keep": true`.
- `accent` und `keep` gibt es im Modus "wort" nicht (der Bau bricht ab).
- Jede Tafel wird von selbst verkleinert, bis sie in 940 px passt.
  "Lieblingscafé" und "Sperrbildschirm" passen so in voller Lesbarkeit.
  Würde ein Schlüsselwort dabei kleiner als 72 px (normale Wörter 44 px),
  bricht der Bau ab (Prüfung `wortgroesse`).
- Eine Tafel, die kürzer als 0,16 s stünde, wird mit der folgenden
  zusammengelegt (`minShow`). Im Bericht steht das je Tafel (`merged`). Bei
  diesem Video traf es "Karte voll" und "sie von selbst".
- Die Prüfung `lesezeit` (0,3 s je Wort) gilt im Modus "wort" nicht. Dafür
  warnt `tafelzeit`, wenn eine Tafel unter 0,14 s bleibt.
- Weitere Angaben in `captionStyle`: `size` (70), `keySize` (136), `pair`
  (10), `minShow` (0.16).

### Schnelle Bildwechsel in einer Szene

- `"enter": "cut"` an einem Teil (nicht am ersten): harter Schnitt statt
  Überblendung. Der Teil beginnt dann 0,1 s vor seinem ersten Wort statt
  0,3 s.
- `"camera": [ ... ]` an einem Teil oder einer Szene: Kamerabewegungen.

  ```json
  "camera": [ { "cap": 1, "word": 0, "zoom": 1.32, "focus": [540, 1030] } ]
  ```

  Zeitpunkt wie bei einem Anker (`cap`, `word`, `offset` oder `at`). `focus`
  ist der Punkt im unvergrößerten Bild, um den es geht; er bleibt stehen
  oder wandert nach `to`. `dur` ist die Dauer (Vorgabe 0,18 s, 0 = Sprung),
  `whoosh` ein leiser Wisch-Ton dazu (Vorgabe 0 = keiner). Eine Kamera mit
  `"at": "start", "dur": 0` zeigt den Teil von Anfang an vergrößert.
- Ein Teil mit Kamera blendet zum Textbereich hin aus (ab y = 580 voll
  sichtbar): ein vergrößertes Handy rutscht nie unter die Wörter oben.
- Die Prüfungen messen weiter die Ruhelage ohne Kamera. Ob im vergrößerten
  Bild etwas am Rand abgeschnitten ist, sieht nur das Auge. `knopfspalte`
  verfolgt die Kamera mit.
- Behoben nebenbei: bei drei Teilen in einer Szene war der mittlere von
  Anfang an sichtbar (Ein- und Ausblenden überschrieben sich). Bei zwei
  Teilen fiel das nie auf, die Referenzvideos bleiben bildgleich.
- `report.json` nennt unter `pictures` jeden Bildwechsel mit Zeit (Szene,
  Teil, Kamera).
- `"pace": { "maxStill": 5, "minChanges": 12 }` macht daraus Richtwerte:
  die Prüfung `bildwechsel` warnt, bricht aber nicht ab. Das Schlussbild
  (die Haltezeit nach dem letzten Wort) zählt nicht mit.

### Pausen der Stimme

```json
"timing": { "maxGap": 0.45 }
```

`tools/tighten.py` kürzt jede stille Stelle der Aufnahme, die länger ist, auf
diese Länge. Stille heißt wie in `engine/mix.mjs`: jeder Abtastwert unter
-40 dB. Ein Atemholen bleibt stehen. Die Aufnahme im Ordner `voice/` bleibt
unverändert, gekürzt wird bei jedem Bau eine Kopie im Arbeitsordner.

`"gapBefore": 0.55` an einer Textzeile stellt die Pause vor ihrem ersten Wort
genau ein: kürzer oder länger. Verlängert wird mit eingefügter Stille (die
Pausen dieser Stimme liegen bei -88 dB). Gibt es vor dem Wort gar keine
Stille, bleibt die Stelle und der Bau sagt es.

Bei diesem Video: 12 Lücken gekürzt (zusammen 3,59 s), die Pause nach
"Natürlich ist das koscher!" von 0,18 auf 0,55 s verlängert, die Pause vor
"Dann kommentiere jetzt" bei 0,65 s gelassen. Aus 40,87 s Aufnahme wurden
37,65 s. Die Stimme hatte von sich aus 15 Pausen ab 0,3 s, die längsten
1,07 und 1,03 s.

### Lautere Mischung

```json
"mix": { "lufs": -14, "truePeak": -1 }
```

`engine/mix.mjs`, `loudMix`: dieselbe Vormischung wie immer (Stimme 1,5,
Effekte 0,45), dann ein Kompressor (2,5:1, setzt 5 dB über dem Mittel an),
Anhebung, Begrenzer bei vierfacher Abtastrate. Gemessen wird am kodierten
Ton mit `ffmpeg ebur128`, und nachgestellt, bis Ziel und Spitze stimmen
(hier 3 Durchgänge). Das Ergebnis steht in `report.json` unter
`audio.loudness`. Ohne Stimme (Entwurf) läuft die feste Mischung.

Bei diesem Video: -14,0 LUFS, wahre Spitze -1,2 dBTP, Lautheitsbereich
2,3 LU. Die Vormischung lag bei -19,3 LUFS, angehoben wurde um 8,3 dB.
Das ist eine dichte Mischung; ob sie dem Betreiber gefällt, muss er hören.

## Neue Bausteine

Beide haben ein `demo` für den Katalog. `tools/catalog.mjs` ist **nicht**
gelaufen, weil es ins Playbook schreibt. Nachholen, sobald das Playbook frei
ist; dabei entstehen auch die Standbilder in `docs/components/`.

### `shop-street`: Straße mit Laden, Passant und Kreis "in der Nähe"

Ladenfront mit Schild, Passant mit Handy, weicher Kreis um den Laden, kleine
Karten-Benachrichtigung über dem Handy. Nirgends eine Entfernung in Zahlen,
und das soll so bleiben: die App kennt mehrere Radien.

| Parameter | Vorgabe | Bedeutung |
|---|---|---|
| `shop`, `icon` | Café Nordwind, cup | Schild, Schaufenster, Benachrichtigung |
| `view` | walker | `owner`: Blick des Betreibers, er steht in der Tür |
| `direction` | right | Laufrichtung des Passanten |
| `walker` | true | Passanten zeigen |
| `from`, `via`, `to` | -0.1, -1, 0.56 | Wegpunkte als Anteil der Bildbreite in Laufrichtung. `via` ist der Ort beim Brummen; -1 = am Rand des Kreises |
| `circle` | true | Kreis "in der Nähe" |
| `notify`, `note` | true, leer | Handy brummt, kleine Karte springt auf; `note` ist ihre zweite Zeile |
| `track` | false | Auge über dem Laden mit Blicklinie, reißt auf den Anker `no` ab |
| `card` | false | Wallet-Karte vorn, Ortsnadel auf der Karte und auf dem Laden |
| `privacy` | false | zwei durchgestrichene Zeichen: Senden und Sehen |
| `phones` | 3 | nur `owner`: Kunden mit Handy vor der Tür, 0 bis 3 |
| `whoosh` | 0.16 | Wisch-Ton, wenn der Kreis aufgeht |

Anker je nach Parametern: `walk`, `buzz`, `arrive`, `circle`, `eye`, `no`,
`card`, `pin`, `nosend`, `nosee`, `shine`, `phone1` bis `phone3`.

Fallen:

- Die Anker `phone1` bis `phone3` haben in der Vorgabe einen Versatz. Wer sie
  im Skript auf ein Wort legt, schreibt `"offset": 0` dazu, sonst bleibt der
  Versatz stehen (die Engine übernimmt ihn aus der Vorgabe).
- Ein Anker, der vor dem Teil liegt, spielt seinen Ton im Teil davor. Deshalb
  gibt es für "ist schon da" eigene Parameter statt früher Anker.
- Alle Klassen beginnen mit `ss-`. Eine Szene aus mehreren Teilen trägt die
  Klassen aller ihrer Bausteine; `.pin` oder `.chip` gibt es dort schon.

### `stamp-check`: Pointe als Stempel mit Haken

Leeres Stempelfeld und wartender Stempel ab dem ersten Bild, auf den Anker
`hit` der Schlag (Töne thud und ok) und der Abdruck mit Haken. Bewusst kein
Wort im Abdruck: ein Siegel mit Schrift sähe aus wie ein echtes Prüfzeichen.
Parameter `icon` (check) und `tilt` (-9).

### Erweitert, Vorgaben unverändert

- `lock-notification`: `rise` (false = Handy steht ab dem ersten Bild),
  `buzzes` (1 bis 3), `waves` (Bögen neben dem Handy).
- `wallet-pass`: `rise`, `drop` (false = Karte liegt schon in der Wallet,
  ohne Ton und ohne Anker `card`).

## Was das Playbook daraus lernen kann

- **Der Entwurf lügt über die Zeit.** Geschätzt waren 54,5 s, mit Stimme und
  gekürzten Pausen sind es 40,7 s. Ein Teil, der im Entwurf 1,9 s stand,
  dauerte echt 0,87 s. Nach der Aufnahme jeden kurzen Teil noch einmal
  ansehen und die Anker nachziehen.
- **Die Pointe braucht Luft.** Die Stimme sprach nach "koscher!" nach 0,18 s
  weiter. Der Stempel trifft deshalb schon auf "Natürlich", und die Pause
  danach ist auf 0,55 s verlängert.
- **Aufnahme zuerst mit `--check`.** `--allow-voice-spend --check` nimmt auf
  und prüft mit echten Zeiten, rendert aber nicht. Der eine bezahlte Aufruf
  dauert so Sekunden statt Minuten, und alles Weitere läuft aus dem Cache.
- **Kurze Wörter paaren.** Einzelne Tafeln unter etwa 0,23 s blitzen nur
  auf. Kürzeste in diesem Video: "nicht," 0,22 s, "Dann" 0,23 s.
- **Sechs Szenen vor dem Schluss** ergeben sechs Punkte in der Stempelreihe,
  passend zu "6 von 6".
- Die Pausen dieser Stimme sind digital still. Schneiden und Einfügen in der
  Stille ist deshalb unhörbar; bei einer anderen Stimme erst messen.

## Messwerte des fertigen Videos

| | |
|---|---|
| Länge | 40,700 s (1221 Bilder) |
| Lautheit | -14,0 LUFS integriert, Bereich 2,3 LU |
| wahre Spitze | -1,2 dBTP |
| Stimme | 109 Wörter in 37,65 s = 173,7 Wörter je Minute (ungekürzt 160,0) |
| Pausen der Stimme ab 0,5 s | zwei: 0,55 s nach der Pointe, 0,65 s vor "Dann kommentiere jetzt" |
| stille Stellen im fertigen Ton ab 0,5 s | 34,64 bis 35,27 s (0,64 s) und 38,71 s bis Ende (2,0 s, stehendes Schlussbild) |
| Bildwechsel | 19 (6 Szenen, 6 Schnitte, 7 Kamera), im Mittel alle 1,8 s, längstes Bild 2,8 s |

## Offen

- **Ein Bau war nicht bitgleich.** Drei Bauten desselben Skripts hintereinander
  ergaben dieselbe Datei (auch aus einer Kopie des Studios in einem anderen
  Ordner), einer davor eine andere. Die Ursache ist nicht geklärt. Verdacht:
  die Kamera-Ebene mit Maske wird nach einem Sprung gelegentlich ein Bild zu
  spät neu gezeichnet, so wie es `engine/render.mjs` für skalierte Ebenen
  beschreibt. Für die Referenzvideos gilt das nicht (sie benutzen keine
  Kamera, `regress.mjs` bleibt bildgleich). Wer "bitgleich" für ein Video mit
  `camera` braucht, sollte das erst mit mehreren Bauten prüfen.
- Anhören und entscheiden, ob Stimme und Mischung so bleiben.
- `voice/` committen, Aufnahme im Kassenbuch nachtragen.
- Katalog und Standbilder der beiden neuen Bausteine erzeugen.
- Die letzten 2 s sind still (Haltezeit 3,2 s wie im ersten Video). Wer das
  kürzer will: `"timing": { "hold": 2.4 }`, das Video ist dann unter 40 s.
- Der dritte Kunde im Bild des Betreibers steht mit dem Rücken in der
  Knopfspalte von TikTok. Sein Handy und das Zeichen darüber liegen davor.

---

# Fassung 2 (16.11.2026): Karte von oben, niemand steht mehr vor der Tür

Alles oberhalb dieser Linie beschreibt Fassung 1 und bleibt als Verlauf
stehen. `out/video.mp4` ist jetzt Fassung 2 (der Ordner `out/` liegt nicht im
Repo). Das Skript von Fassung 1 steht im Commit `620739d`.

**Nichts davon ist committet**: `script.json`, `components/shop-map.js`
(neu), `components/shop-street.js`, `engine/parts.js`, `tools/selftest.mjs`
und diese Datei.

## Warum

Der Betreiber nach dem Ansehen von Fassung 1: das Video solle eine Karte
zeigen, auf der ein Kunde in die Nähe kommt, und es müsse klar sein, dass man
nicht vor dem Laden stehen muss. In Fassung 1 ging die Figur in jedem Bild mit
Benachrichtigung direkt an der Ladenfront entlang.

Was stimmt (nachgesehen in `stempelkarte-backend`: `model/Shop.java`,
Abschnitt "Sperrbildschirm-Erinnerung", und `wallet/ApplePassService.java`,
`ERLAUBTE_RADIEN`): die volle Karte zeigt sich auf dem Sperrbildschirm,
sobald das Handy in einen Umkreis um den Laden kommt. Den Umkreis wählt der
Laden aus drei Stufen. Das Handy erledigt das selbst, der Laden schickt
keine Benachrichtigung. Im Video steht deshalb weiterhin nirgends eine
Entfernung in Zahlen.

## Was sich im Video geändert hat

Text, Stimme, Töne der übrigen Bilder, Länge und Mischung sind dieselben. Es
wurde nichts neu aufgenommen (0 Zeichen, Aufnahme `593a18385cf458fa` aus dem
Ordner `voice/`). Vier Bilder sind neu:

| Zeit | Satz | Fassung 1 | Fassung 2 |
|---|---|---|---|
| 2,6 bis 5,1 s | "genau wenn du an deinem Lieblingscafé vorbeigehst." | Figur geht an der Ladenfront entlang | `shop-street` mit `"across": true`: die Figur geht auf der anderen Straßenseite, der Laden steht klein im Hintergrund, die Fahrbahn liegt dazwischen. Nach dem Brummen bleibt sie stehen |
| 5,1 bis 10,4 s | "Verfolgt dich das Café? Nein. Dein Handy sendet die Benachrichtigung selbst." | Auge über dem Laden, Figur vor der Ladenfront | `shop-map` mit `"track": true`: Auge an der Ortsnadel, Blicklinie zur Kundin, die eine Straße weiter von rechts kommt. Kamera fährt auf "Dein" heran, Nadel und Kundin bleiben im Bild |
| 21,7 bis 24,7 s | "und du kommst in die Nähe, zeigt dein Handy sie von selbst an." | Kreis um die Ladenfront, Figur tritt an der Front hinein | `shop-map` mit Kreis: die Kundin geht eine Straße weiter, tritt in den Kreis, dort brummt das Handy. Die Kamera fährt jetzt schon auf "zeigt" heran (vorher auf "von") |
| 32,3 bis 33,5 s | "Genau vor deiner Tür." | drei Kunden direkt vor der Tür | `shop-map` mit `"view": "owner"`: vier Kunden rund um den Laden, alle im Kreis, keiner vor der Tür |

Unverändert und Bild für Bild gleich mit Fassung 1: Einstieg mit Sperrbildschirm,
Pointe mit Stempel, Wallet-Karte, "In der Karte steht, wo der Laden ist",
volle Karte, die zwei durchgestrichenen Zeichen, der Betreiber in der Tür,
der Sperrbildschirm des Stammkunden, Schluss. Verglichen wurden 83
Standbilder zu denselben Zeiten: 56 sind bildgleich, die 27 anderen liegen
alle in den vier neuen Bildern (oder in den 0,3 s, in denen eines davon
ausblendet).

Bewusst geblieben: im Bild zu Satz 7 ("Der Laden schickt nichts. Und sieht
nicht, wo du bist.") geht die Figur weiter an der Ladenfront vorbei. Dort
gibt es keine Benachrichtigung, und nach zwei Karten von oben in Folge wäre
eine dritte eintönig. Wer es anders will: dieselbe Szene lässt sich mit
`shop-map` bauen, die beiden Zeichen fehlen dort aber noch.

## Neuer Baustein `shop-map`: Karte von oben

Stadtplan in den Markenfarben (helle Straßen, dunkle Blöcke, ein Platz, ein
Park), der Laden als Ortsnadel mit Symbol und Namensschild, darum der weiche
Kreis "in der Nähe", die Kundin als Figur mit Handy auf einem hellen
Standpunkt. Keine Straßennamen, keine echte Stadt, keine Zeichen oder Farben
eines Kartendienstes, keine Zahl.

Eigener Baustein und kein weiterer `view` von `shop-street`: dort ist alles
eine Straße von der Seite mit Wegpunkten als Anteil der Bildbreite, hier ein
Straßennetz von oben mit Wegen über Kreuzungen. Beide teilen kein Maß und
keine Kulisse. Was sie teilen (Figur, Benachrichtigung, Nadel, Auge, Kreis),
liegt jetzt in `engine/parts.js`, damit die Kundin in beiden Bildern dieselbe
bleibt.

| Parameter | Vorgabe | Bedeutung |
|---|---|---|
| `shop`, `icon` | Café Nordwind, cup | Schild unter der Nadel, Symbol in der Nadel, Benachrichtigung |
| `view` | walker | `owner`: Blick des Betreibers, mehrere Kunden rund um den Laden |
| `path` | `[[-0.75, 1], [0.55, 1]]` | Weg der Kundin als Punkte `[Spalte, Reihe]` im Straßennetz (Spalten 0 bis 3 von links, Reihen 0 bis 3 von oben, Zwischenwerte zwischen zwei Kreuzungen, Werte außerhalb liegen außerhalb des Bildes). Der Laden liegt zwischen Spalte 1 und 2, seine Tür zeigt zur Reihe 2 |
| `via` | -1 | wo die Kundin beim Brummen ist, als Anteil des Weges. -1 = dort, wo ihr Weg in den Kreis tritt (auch ohne sichtbaren Kreis) |
| `walker` | true | Kundin zeigen |
| `circle` | true | Kreis "in der Nähe" |
| `notify`, `note` | true, leer | Handy brummt, kleine Karte springt auf; `note` ist ihre zweite Zeile |
| `track` | false | Auge an der Nadel mit Blicklinie, reißt auf den Anker `no` ab |
| `phones` | 4 | nur `owner`: Kunden rund um den Laden, 0 bis 4 |
| `whoosh` | 0.16 | Wisch-Ton, wenn der Kreis aufgeht |

Anker wie bei `shop-street`: `walk`, `buzz`, `arrive`, `circle`, `eye`, `no`,
`shine`, `phone1` bis `phone4`. Der Moment der Benachrichtigung hängt über
`buzz` an einem Wort.

Was der Baustein selbst ablehnt (jeweils mit einem Fall in
`tools/selftest.mjs`):

- ein Weg, der an der Ladentür vorbeiführt (genau das soll das Bild nicht
  zeigen),
- ein Weg quer durch einen Häuserblock oder mit einem Punkt mitten im Block,
- ein Weg, der nie in den Kreis kommt oder schon im Kreis beginnt,
- eine Benachrichtigung, die Ortsnadel oder Namensschild verdecken würde
  oder oben im Textbereich hinge,
- mehr als vier Kunden im Blick des Betreibers.

Fallen:

- Den Weg kurz hinter dem Rand des Kreises enden lassen. Wer nach dem Brummen
  weitergeht, steht am Ende doch wieder nah am Laden (im ersten Entwurf: nur
  noch 258 px von der Nadel).
- Die Benachrichtigung braucht über dem Kopf der Kundin Platz. Praktisch
  bleibt dafür Reihe 1: in Reihe 3 hinge sie über Nadel und Schild, weiter
  oben im Textbereich (beides wird abgelehnt).
- Die Karte ist links und rechts 400 px breiter als das Bild. Eine Kamera darf
  also zur Seite rücken (`"at": "start", "dur": 0`), nach oben oder unten
  nicht.
- Anker, die im Skript auf ein Wort gelegt werden, behalten den Versatz der
  Vorgabe (`arrive` hat -0,2 s): `"offset"` dazuschreiben.
- Ein Ladenname über etwa 22 Zeichen macht das Schild so breit, dass es im
  Blick des Betreibers an die Karten über den unteren Kunden stößt (Prüfung
  `ueberdeckung` bricht dann ab).
- Die Figur selbst ist nicht als wichtig markiert (`data-safe`), nur
  Benachrichtigung, Nadel, Schild und Auge. Kommt sie von rechts ins Bild,
  läuft sie kurz durch die Knopfspalte von TikTok, ohne dass der Bau warnt.

## `shop-street`: die andere Straßenseite

`"across": true` rückt Laden und Häuserzeile als Ganzes nach hinten (60 %
der Größe, höher im Bild), davor der hintere Gehweg, die Fahrbahn mit
Mittelstrich und vorn der Gehweg mit der Figur. `"shopAt"` (0,3 bis 0,7,
Vorgabe 0,68) legt fest, wo der Laden hinten steht. Geht nur mit Passant;
`circle`, `track`, `card`, `privacy` und `view: owner` werden zusammen damit
abgelehnt (`"circle": false` dazuschreiben).

Falle: die Benachrichtigung wandert mit der Figur. Zwischen Bildrand und
Laden ist wenig Platz, deshalb nach dem Brummen nur noch ein kurzes Stück
gehen lassen (bei diesem Ladennamen `to` höchstens etwa 0,09 hinter `via`), sonst warnt der Bau
("verdeckt ihn"). Im Video bleibt die Figur 1,0 s nach dem Brummen stehen.

Alle anderen Bilder von `shop-street` sind unverändert: 83 von 83
Standbildern von Fassung 1 waren nach dem Umbau auf `engine/parts.js`
bildgleich.

Nebenbei behoben, in beiden Bausteinen: das Fragezeichen am Auge stand schon
da, bevor das Auge aufging (zwei getrennte Bewegungen auf denselben
Eigenschaften überschrieben sich). In Fassung 1 fiel das nicht auf, weil die
Szene in dem Moment gerade hereinschob.

## Messwerte von Fassung 2

| | |
|---|---|
| Länge | 40,700 s (1221 Bilder), wie Fassung 1 |
| Stimme | aus dem Cache, 0 Zeichen ausgegeben |
| Lautheit | -14,0 LUFS integriert, Bereich 2,3 LU (`ffmpeg ebur128` am fertigen Video) |
| wahre Spitze | -1,2 dBTP |
| Bildwechsel | 19 (6 Szenen, 6 Schnitte, 7 Kamera), im Mittel alle 1,8 s, längstes Bild vor dem Schluss 2,8 s |
| Töne | 44 (einer mehr: das vierte Handy im Blick des Betreibers) |
| Prüfungen | 17 von 17, keine Warnung |

Bildwechsel: 1,62 Kamera, 2,60 Schnitt (Straße, andere Seite), 5,13 Szene
(Karte mit Auge), 7,93 Kamera, 10,44 Schnitt (Stempel), 12,29 Szene (Wallet),
15,02 Kamera, 16,82 Kamera, 18,27 Szene (Karte und Nadel), 20,81 Schnitt
(volle Karte), 21,68 Schnitt (Karte mit Kreis), 23,02 Kamera, 24,68 Szene
(Zeichen), 26,46 Kamera, 27,74 Szene (Betreiber), 29,40 Schnitt
(Sperrbildschirm), 31,16 Kamera, 32,27 Schnitt (Karte, Betreiber), 33,53
Szene (Schluss).

Abstand der Kundin im Moment der Benachrichtigung, gemessen im Bild, wie der
Zuschauer es sieht (Bühne 1080 px breit):

| Bild | Zeit | gemessen | Abstand | Anteil der Bildbreite |
|---|---|---|---|---|
| Straße, andere Seite (Satz 2) | 3,60 s | Füße bis Türschwelle | 800 px (630 px seitlich, 493 px quer über die Fahrbahn) | 74 % |
| Karte mit Auge (Satz 3) | 8,50 s | Standpunkt bis Spitze der Nadel | 493 px (Kamera steht schon heran) | 46 % |
| Karte mit Kreis (Satz 6) | 22,92 s | Standpunkt bis Spitze der Nadel | 358 px, nach der Kamerafahrt 461 px | 33 %, danach 43 % |
| Karte, Betreiber (Satz 8) | 32,47 bis 33,09 s | je Kunde, Standpunkt bis Spitze der Nadel | 349, 337, 384 und 376 px | 31 bis 36 % |

## Selbstprüfung und Vergleich

- `node studio/tools/selftest.mjs`: 88 von 88 Prüfungen bestanden (vorher
  72). Neu sind 16: die Karte baut, der Abstand beim Brummen ist im Bild
  gemessen, keine Zahl im Bild, sechs Fälle, die abgelehnt werden müssen,
  ein Weg über eine Ecke, der Blick des Betreibers, die andere Straßenseite
  mit ihrer Warnung, und die Straße von der Seite wie in Fassung 1, die sonst
  kein Video mehr benutzt.
- `node studio/tools/regress.mjs`: BESTANDEN: v7 gut, v10 gut. Je 130 von 130
  Standbildern bildgleich, Effektspur bytegleich, Mischung gleich.
  `engine/` wurde nur in `parts.js` erweitert (neue Funktionen, nichts
  Bestehendes geändert).

## Was das Playbook daraus lernen kann

- **"In der Nähe" lässt sich von der Seite nicht zeigen.** Eine Figur vor
  einer Ladenfront liest jeder als "vor dem Laden", auch mit Kreis. Von oben
  reicht ein Block Abstand.
- **Ein Bild, das eine Aussage trägt, bekommt eine Prüfung für die Aussage.**
  `selftest.mjs` misst jetzt im Bild, dass die Kundin beim Brummen mindestens
  ein Viertel der Bildbreite von der Nadel entfernt steht und kein Weg an der
  Tür vorbeiführt.
- **Nach der Benachrichtigung bleibt die Figur stehen.** Das ist natürlicher
  (wer aufs Handy sieht, bleibt stehen), und die Karte über ihrem Kopf wandert
  nicht mehr über das, worum es geht.

## Offen

- **Nicht abgehört und nicht als laufendes Video angesehen.** Geprüft sind
  Standbilder, die Übersicht und Einzelbilder aus der fertigen Datei.
- `tools/catalog.mjs` ist weiterhin nicht gelaufen (es schreibt ins Playbook
  und erneuert alle Standbilder). `shop-map` hat ein `demo`; ein Standbild
  damit baut ohne Fehler.
- **Zwei Bauten von Fassung 2 sind nicht bitgleich.** Der Ton ist gleich,
  im Bild weichen 71 von 1221 Einzelbildern ab, alle zwischen 16,43 und
  18,77 s (Wallet-Karte mit Kamera, aus Fassung 1 unverändert), mindestens
  50,8 dB PSNR, mit dem Auge nicht zu sehen. Die drei Karten von oben und die
  andere Straßenseite waren in beiden Bauten gleich. Die Ursache ist
  weiterhin nicht geklärt (siehe oben, "Ein Bau war nicht bitgleich").
- `videos/GEPLANT-benachrichtigung.md` nennt noch Fassung 1.
- Auf der Karte gibt es die zwei durchgestrichenen Zeichen (`privacy`) noch
  nicht.
