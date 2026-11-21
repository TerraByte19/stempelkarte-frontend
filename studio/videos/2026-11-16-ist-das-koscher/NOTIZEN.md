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

---

# Fassung 3 in Vorbereitung (16.11.2026): Bilder nachgezogen, Werkzeug für Sätze von außerhalb

Alles oberhalb dieser Linie beschreibt die Fassungen 1 und 2 und bleibt als
Verlauf stehen.

**Stand:** `out/video.mp4` zeigt die neuen Bilder mit der **unveränderten**
Stimme (Aufnahme `593a18385cf458fa`, 40,7 s, 0 Zeichen ausgegeben). Die beiden
koscher-Sätze sind noch **nicht** ersetzt: der Betreiber wählt gerade zwischen
Proben. Im Ordner `voice/` liegen weiter nur die drei Dateien der Aufnahme.
**Nichts davon ist committet**: `script.json`, `components/shop-street.js`,
`components/shop-map.js`, `make.mjs`, `tools/voice.py`, `tools/tighten.py`,
`tools/times.mjs`, `tools/selftest.mjs`, neu `tools/clip-in.py` und
`tools/test_clip_in.py`, und diese Datei.

## Warum

1. Die unabhängige Prüfung von Fassung 2 fand drei Bilder, die den Wunsch des
   Betreibers ("man muss nur in der NÄHE sein, nicht vor dem Laden") noch nicht
   ganz trugen.
2. Der Betreiber will die beiden Sätze des Spruchs anders gesprochen. In
   seinen Worten: die Frage "Ist das koscher?" soll wirklich wie eine Frage
   klingen, verwundert; danach kommt "Natürlich ist das koscher!", und das
   nicht als Frage; das ch soll mehr kratzen. Solche Aufnahmen entstehen
   außerhalb des Studios mit einem anderen Modell des Anbieters, ein Satz je
   Datei. Der Text bleibt Wort für Wort derselbe. Welche Probe das trifft,
   entscheidet das Ohr des Betreibers; das Werkzeug unten misst nur.

## Was sich im Bild geändert hat

Gemessen im Bild, wie der Zuschauer es sieht (Bühne 1080 px breit).

| Zeit | Satz | bis Fassung 2 | jetzt |
|---|---|---|---|
| 2,60 bis 5,13 s | "genau wenn du an deinem Lieblingscafé vorbeigehst." | die Benachrichtigung endete 22 px vor der Markise und 40 px vor der Hauswand | die Figur bleibt früher stehen (`via` 0.13, `to` 0.15, `from` -0.08), der Laden steht ganz rechts (`shopAt` 0.7). Luft zur Markise 71 px, zur Hauswand 89 px |
| 21,68 bis 24,68 s | "und du kommst in die Nähe, zeigt dein Handy sie von selbst an." | nach der Kamerafahrt (Faktor 1,34) reichte der Kreis von x = 142 bis 1218, rechts lief er aus dem Bild | Kamera nur noch Faktor 1,2 (`focus` [560, 1166], `to` [540, 1211]). Der Kreis reicht von x = 58 bis 1022 und liegt damit ganz in der Bildbreite, mit Nadel, Schild, Kundin und Benachrichtigung (ab y = 602). Sein unterer Rand (bis y = 1693) liegt wie vorher im Bereich, den Instagram und TikTok unten überdecken |
| 24,68 bis 27,74 s | "Der Laden schickt nichts. Und sieht nicht, wo du bist." | die Figur ging direkt an der Ladentür vorbei | `shop-street` mit `"across": true` und `"privacy": true`: der Laden steht klein im Hintergrund, die zwei durchgestrichenen Zeichen links und rechts daneben, die Figur geht vorn auf der anderen Straßenseite (Füße rund 490 px unter der Türschwelle, nach der Kamerafahrt 595 px). Auf "Und sieht" fährt die Kamera auf Laden und Zeichen (Faktor 1,22) |
| 32,27 bis 33,53 s | "Genau vor deiner Tür." | die beiden unteren Kunden standen 200 und 193 px neben der Nadel, ihre Karten 33 und 26 px neben dem Namensschild | `"spread": true`: 223 und 222 px neben der Nadel, 386 und 385 px von ihr entfernt (Halbmesser des Kreises 400). Zwischen ihren Karten und dem Schild bleiben 56 und 55 px |

Warum bei Satz 7 die Straße und nicht die Karte: davor steht 3 s lang die
Karte von oben. Eine zweite Karte direkt danach wäre eintönig, und das Bild
von der anderen Straßenseite kennt der Zuschauer schon aus Satz 2.

Alles andere ist Bild für Bild wie in Fassung 2. Länge, Töne (44) und Mischung
(-14,0 LUFS, wahre Spitze -1,2 dBTP) sind unverändert, 19 Bildwechsel, 17 von
17 Prüfungen, keine Warnung.

### Neu in den Bausteinen, beides nur auf Wunsch

- `shop-street`: `"across"` geht jetzt zusammen mit `"privacy"`. Die Zeichen
  stehen dann neben dem Laden (108 px, dünnerer Strich, damit das Auge unter
  dem Strich ein Auge bleibt), nicht über dem Dach: dort beginnt bei dem
  kleinen Laden gleich der Textbereich. `shopAt` muss dafür zwischen 0.38 und
  0.62 liegen, sonst ragt ein Zeichen aus dem Bild (der Bau bricht ab).
- `shop-map`: `"spread": true` stellt im Blick des Betreibers die beiden
  unteren Kunden weiter außen. Sie gehen dafür nur 16 statt 34 px auf ihren
  Platz zu: in Reihe 3 ist der Kreis schmal, und im Kreis müssen sie von
  Anfang an stehen.

## Werkzeug `tools/clip-in.py`: ein Satz von außerhalb des Studios

```bash
# aus dem Ordner stempelkarte-frontend. Sendet nichts, kostet 0 Zeichen.
python3 studio/tools/clip-in.py studio/videos/2026-11-16-ist-das-koscher "Ist das koscher?" <frage.mp3>
python3 studio/tools/clip-in.py studio/videos/2026-11-16-ist-das-koscher "Natürlich ist das koscher!" <antwort.mp3>
STUDIO_VOICE_OFFLINE=1 node studio/make.mjs studio/videos/2026-11-16-ist-das-koscher
```

Die Reihenfolge der beiden ersten Befehle ist gleich. Weitere Schalter:
`--check` (nur messen, nichts ablegen), `--list` (Sätze mit Nummern, und
welche Fassung gilt), `--original` (zurück zur Aufnahme ohne fremde Sätze),
`--prune` (abgelegte Fassungen löschen, die nicht mehr gebraucht werden),
`--words 0.38,0.68` (Wortanfänge von Hand, Sekunden der Clip-Datei, ab dem
zweiten Wort), `--alignment <json>` (Zeiten des Anbieters, wenn sie nicht als
`<clip>.alignment.json` neben dem Clip liegen).

**Achtung, Zählung:** der Satz wird am sichersten als Text angegeben. Als
Nummer zählt das Werkzeug wie `voice.py`, an jedem `. ! ? : ;`. "Natürlich ist
das koscher!" ist so Satz **6** (nicht 4): "Verfolgt dich das Café?", "Nein."
und "Dein Handy sendet die Benachrichtigung selbst." sind drei Sätze.

Was es tut:

1. **Zuschnitt.** Stille am Anfang und Ende des Clips fällt weg, 40 ms vor dem
   ersten Laut bleiben (wie beim Satz-Austausch von `voice.py`).
2. **Wortanfänge aus dem Ton.** Der Clip wird mit demselben Satz der
   vorhandenen Aufnahme verglichen, Laut für Laut (Klangfarbe je 10 ms,
   dehnbare Zuordnung), auch wenn ein Wort gedehnt ist. Jeder Wortanfang rückt
   dann auf den nächsten deutlichen Einsatz im Pegel (höchstens 0,1 s weit);
   fällt er in eine Pause, gilt deren Ende. Die Zeiten des Anbieters sind nur
   Notlösung, danach eine gleichmäßige Verteilung. Die Regieanweisung in
   eckigen Klammern und Schreibweisen wie "Natüüürlich" oder "koscher??"
   stören nicht: in die Zeiten kommen die freigegebenen Wörter.
3. **Lautstärke.** Gleiche mittlere Lautstärke der gesprochenen Stellen wie in
   den 4 s Aufnahme davor und danach, höchstens 6 dB in jede Richtung, nie bis
   zur Übersteuerung. Der Wert steht in der Ausgabe und in der meta.
4. **Pause danach.** Die Stille nach dem Satz bleibt so lang, wie sie in der
   Aufnahme war (gemessen am Ton; was fehlt, folgt dem Clip als Stille).
   `timing.maxGap` und `gapBefore` stellen sie beim Bau ein wie immer.
5. **Ablage** im Ordner `voice/`, wie beim Satz-Austausch: `<neu>.clip.mp3`
   (der Clip, Byte für Byte wie geliefert), `<neu>.clip.alignment.json`,
   `<neu>.alignment.json`, `<neu>.meta.json` mit `"source": "extern"`,
   Dateiname und sha256 des Clips, `"spent": 0`. Die Aufnahme selbst bleibt
   unverändert.
6. **Verweis** `voice/593a18385cf458fa.use.json`. Der Text ändert sich nicht,
   also auch nicht sein Schlüssel. Erst der Verweis sagt dem Bau, welche
   Fassung gilt. Zeigt er ins Leere, bricht der Bau ab, statt still die alte
   Betonung zu nehmen.

Beim Bau: `make.mjs` meldet "Fassung der Aufnahme ... mit Sätzen von außerhalb"
und kürzt Pausen **in** einem solchen Satz nicht (`tighten.py --keep`): eine
Kunstpause wie in "Ist das ... koscher?" gehört zu dem Vortrag, den der
Betreiber ausgesucht hat. `report.json` nennt die Sätze unter `voice.extern`
(Zeiten der ungekürzten Fassung) und die Aufnahme unter `elevenLabs.takeOf`.

Ein Satz lässt sich noch einmal ersetzen (der Betreiber wählt doch eine andere
Probe): derselbe Befehl mit dem anderen Clip. Die Kette entsteht dann neu, die
alte Fassung bleibt liegen, bis `--prune` sie löscht.

### Wie die Tafeln der Pointe zu ihren Zeiten kommen

Die Tafeln "Natürlich", "ist das", "koscher!" stehen jeweils 0,03 s vor dem
Anfang ihres ersten Wortes. Die Wortanfänge stehen in den Zeichen-Zeiten der
Fassung, und dorthin schreibt das Werkzeug, was es im Ton gemessen hat. Der
Stempel hängt am Anfang von "Natürlich" plus 0,22 s (Anker `hit`), er bleibt
also am ersten Laut des Satzes, wie lang das Wort auch gedehnt ist.

Die Ausgabe des Werkzeugs zeigt zu jedem Wort den Pegel in den 0,1 s davor und
danach. Dort einmal nachsehen: ein Wortanfang soll am Fuß eines Anstiegs
sitzen. Steht bei einem Wort nicht "+einsatz", ist es nur geschätzt (das
Werkzeug warnt), dann mit `--words` von Hand setzen.

**Offene Entscheidung, Stempel:** bei einem gedehnten "Natüüürlich" trifft der
Stempel 0,22 s nach dem ersten Laut noch auf "Na". Soll er auf "tür" treffen,
den Versatz im Skript anpassen (`"hit": { "cap": 0, "word": 0, "offset": ... }`):
das t von "tür" beginnt bei G-a und A3 nach 0,30 s, bei A1 nach 0,39 s, bei A2
nach 0,49 s. Die Ausgabe nennt den Wert als "weitere Einsätze im Wort".

### Die sieben Proben, gemessen (nichts abgelegt, `--check`)

Wortanfänge in Sekunden der Clip-Datei. Alle sitzen auf einem Einsatz im
Pegel und stimmen mit dem überein, was der Pegelverlauf von Hand zeigt.

| Probe | Satz | Länge, zugeschnitten | Wortanfänge | Lautstärke |
|---|---|---|---|---|
| Q1 | Frage | 1,21 s (bisher 0,99 s) | Ist 0,115, das 0,38, koscher? 0,68 | -1,8 dB |
| Q2 | Frage | 1,15 s | 0,11, 0,37, 0,65 | -2,9 dB |
| Q3 | Frage | 2,68 s | 0,14, 0,665, 2,065 (0,78 s Kunstpause vor "koscher?", bleibt beim Bau stehen) | +1,0 dB |
| G-a | Antwort | 2,31 s (bisher 1,49 s) | Natürlich 0,05, ist 1,18, das 1,425, koscher! 1,755 | -3,5 dB |
| A1 | Antwort | 2,83 s | 0,095, 1,625, 1,87, 2,16 | -2,6 dB |
| A2 | Antwort | 2,66 s | 0,105, 1,62, 1,865, 2,14 | -0,3 dB |
| A3 | Antwort | 2,33 s | 0,05, 1,21, 1,445, 1,77 (ohne Zeiten des Anbieters, das Werkzeug weist darauf hin) | -2,9 dB |

Die Zeiten des Anbieters lagen bei diesen Proben bis zu 0,16 s daneben (erstes
Wort von Q1) und sonst bis zu 0,11 s zu früh.

### Probe in einer Kopie (Q1 für die Frage, G-a für die Antwort)

Gebaut in einer Kopie des Ordners außerhalb des Repos, mit
`STUDIO_VOICE_OFFLINE=1`. Der echte Ordner wurde dafür nicht angefasst.

| | |
|---|---|
| Zeichen ausgegeben | 0 (`elevenLabs.spent` 0, aus dem Cache, Fassung `712d6f4207808f7f` der Aufnahme `593a18385cf458fa`) |
| Länge | 41,833 s (1255 Bilder), 1,13 s mehr als mit der Aufnahme |
| Lautheit | -14,1 LUFS, wahre Spitze -1,2 dBTP, Bereich 2,2 LU |
| Frage | erster Laut im Video bei 0,40 s (Vorlauf 0,35 s), Stille danach 0,45 s (`maxGap`) |
| Antwort | Stille davor 0,45 s, danach 0,55 s (`gapBefore`) |
| Tafeln | "Natürlich" 10,84 bis 11,97 s, "ist das" 11,97 bis 12,545 s, "koscher!" 12,545 bis 13,589 s; Stempel bei 11,09 s |
| Mitschrift | 109 von 109 Wörtern wie freigegeben. Einzige Abweichung in der Schreibweise: "Kaffee" statt "Café" in "Verfolgt dich das Café?" (unveränderter Teil der Aufnahme, beide Wörter klingen bei dieser Stimme gleich) |
| Prüfungen | 17 von 17, keine Warnung |

## Selbstprüfung und Vergleich

- `node studio/tools/selftest.mjs`: 96 von 96 Prüfungen bestanden (vorher 88).
  Neu: Fassung 3 des zweiten Videos (keine Figur mehr an der Ladenfront, der
  ganze Kreis in der Bildbreite), `spread`, `across` mit `privacy` und sein
  Fehlerfall, `tools/test_clip_in.py` (31 Prüfungen mit einem künstlichen
  Clip, ohne Netz), und der ganze Weg an echter Sprache in einer Kopie des
  ersten Videos (Satz einsetzen, `make.mjs` nimmt die Fassung, `--original`).
- `node studio/tools/regress.mjs`: BESTANDEN: v7 gut, v10 gut. Je 130 von 130
  Standbildern bildgleich, Effektspur bytegleich, Aufnahme und Mischung gleich
  (0 Abtastwerte verschieden). In `tools/voice.py`, `tools/tighten.py` und
  `make.mjs` ist alles Neue nur wirksam, wenn eine Fassung von `clip-in.py` im
  Ordner `voice/` liegt.

## Fallen

- **Reihenfolge beim Abgeben:** der Ordner `voice/` gehört nach dem Einsetzen
  ganz ins Repo, mit `.clip.mp3`, den Zeiten, der meta und der `.use.json`.
  Fehlt die `.use.json`, baut ein frischer Checkout wieder mit der alten
  Betonung, ohne Fehlermeldung.
- **Kassenbuch:** `"spent": 0` heißt nur, dass dieses Werkzeug nichts sendet.
  Was die Proben beim Anbieter gekostet haben, steht nicht hier.
- **Die Mischung gleicht mit.** Der Angleich im Werkzeug bringt den Clip auf
  die Lautstärke der Nachbarsätze, danach arbeitet der Kompressor der lauten
  Mischung über alles. Ob ein Satz mit anderem Modell im Klang heraussticht,
  zeigt nur das Anhören.
- **Q1 endet ohne Ausklang** (die Datei hört mitten im letzten Laut auf, bei
  rund -25 dB). Die 12 ms Blende am Schnitt fängt das ab; hören muss man es.
- **Ändert sich später der Text,** gilt der Verweis nicht mehr (neuer
  Schlüssel), und die Sätze von außerhalb müssen neu eingesetzt werden.
- Der Clip muss eine `.mp3` sein (so liegt er unverändert im Repo).

## Offen

- **Nicht abgehört.** Weder die neuen Bilder als laufendes Video noch die
  Probe mit Q1 und G-a hat jemand gehört. Gemessen sind Länge, Lautheit,
  Pausen, Wortanfänge und die Mitschrift.
- Der Betreiber wählt Frage und Antwort, dann die drei Befehle oben, ansehen,
  anhören, und über den Versatz des Stempels entscheiden.
- `PLAYBOOK.md` nennt das Werkzeug noch nicht, und `tools/catalog.mjs` ist
  weiter nicht gelaufen (`shop-map`, `stamp-check` und die neuen Parameter
  fehlen im Katalog).
- `videos/GEPLANT-benachrichtigung.md` nennt noch Fassung 1.

## Fassung 4: welche Aufnahmen gelten (16.11.2026)

Der Betreiber hat Probe J gewählt und wollte das ch in "Natürlich" wie "khh".

- Satz "Ist das koscher?": `koscher-frage-verwundert.mp3` (Liam, Modell
  eleven_v3, Text "[astonished] Ist das koscher?").
- Satz "Natürlich ist das koscher!": `koscher-antwort-G-rachen-ch.mp3`. Das ist
  die Antwort aus Probe G (eleven_v3, "[joyful, sing-song, drawn out]
  Natüüürlich ist das koscher!"), in der das weiche ch von Hand durch das
  Rachen-ch ersetzt wurde, das dieselbe Stimme in "Ach!" gesprochen hat
  (eigene kurze Aufnahme, 47 Zeichen). Gemessen: der Laut dauert jetzt 0,17 s
  statt 0,085 s, liegt 15 dB höher und hat seinen Schwerpunkt bei 2,4 kHz
  statt 3,7 kHz. Über die Schreibweise ließ sich das nicht erreichen, das
  Modell spricht nach einem i immer das weiche ch.
- Der Stempel fällt 0,3 s nach dem Wortanfang, auf die betonte Silbe.
- Bewusst nicht gemacht: ein nachgeahmter Akzent und die Originalaufnahme des
  Spruchs. Beides hat der Betreiber angefragt; es bleibt bei eigener Stimme
  und eigener Betonung.
- Angehört hat das Ergebnis nur der Betreiber. Gemessen sind Text
  (Mitschrift), Länge 41,9 s, Lautheit -14,1 LUFS, Spitze -1,2 dBTP.
