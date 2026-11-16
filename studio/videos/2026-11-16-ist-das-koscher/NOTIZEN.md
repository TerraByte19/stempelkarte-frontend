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
