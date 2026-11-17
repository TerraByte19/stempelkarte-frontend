# Notizen zum Video "Dein Stammkunde hat dich betrogen" (Döner, 17.11.2026)

Diese Datei hält fest, was beim Bau des dritten Videos neu entstanden ist und
was davon später ins Playbook gehört. `PLAYBOOK.md`, `AUTOMATIK.md`,
`THEMEN.md`, `START.md`, `state/`, `board/`, `videos/_vorlage/`,
`tools/catalog.mjs`, `tools/selftest.mjs` und `docs/` wurden **nicht**
angefasst (dort arbeitete gleichzeitig eine andere Sitzung).

## Stand

- **Entwurf ohne Stimme.** `out/video.mp4` (47,63 s geschätzt, 1429 Bilder),
  `out/sheet.png`, `out/poster.png`, `out/report.json`: alle Prüfungen ok,
  keine Warnung.
- **Die Aufnahme wurde nicht gemacht.** Der eine Aufruf
  `node studio/make.mjs studio/videos/2026-11-17-doener-gegenueber --allow-voice-spend --check`
  wurde von der Rechteverwaltung der Sitzung abgelehnt, bevor er lief. Es
  wurde nichts gesendet, 0 Zeichen ausgegeben, im Ordner `voice/` liegt
  nichts. Nicht wiederholt (Auftrag: genau ein Versuch).
- Eine Aufnahme würde **577 Zeichen** kosten (94 Wörter). Zum Vergleich mit
  `state/konfig.json`: am 16.11.2026 liegen dort schon 658 + 686 Zeichen,
  mit dieser Aufnahme am selben Tag wären es 1921, über der Tagesgrenze der
  Automatik von 1600. Am 17.11.2026 passt sie.
- Text: Wort für Wort der freigegebene. Geprüft mit
  `node studio/tools/times.mjs studio/videos/2026-11-17-doener-gegenueber --text`.
- **Nichts ist committet.** Neu und nötig fürs Repo: dieser Ordner,
  `sounds/` (1,8 MB), `components/shop-duel.js`, `week-strip.js`,
  `shop-counter.js`, `card-bin.js`, `tools/soundlib.py`,
  `tools/test_sounds.mjs`; geändert: `engine/script.mjs`, `engine/engine.js`,
  `engine/render.mjs`, `engine/checks.mjs`, `engine/icons.js`, `make.mjs`,
  `tools/sfx.py`, `components/calc-panel.js`, `components/shop-map.js`,
  `components/lock-notification.js`.

So wird das Video fertig, wenn der Betreiber die Aufnahme freigibt:

```bash
# 1. einmal aufnehmen und mit echten Zeiten prüfen (kostet 577 Zeichen)
node studio/make.mjs studio/videos/2026-11-17-doener-gegenueber --allow-voice-spend --check
# 2. fertiges Video aus dem Cache (kostet nichts)
STUDIO_VOICE_OFFLINE=1 node studio/make.mjs studio/videos/2026-11-17-doener-gegenueber
```

Alle Bilder und alle Klänge hängen an Wörtern (Anker, `cap`/`word`) und
wandern mit der Aufnahme von selbst auf die echten Wort-Zeiten. Danach
`out/sheet.png` ansehen und in `out/report.json` unter `soundLib` den Abstand
der Stimme zu jedem Klang lesen (`marginDb`, Prüfung `effekt-abstand`).
Erwartung nach dem zweiten Video: rund 38 s statt der geschätzten 47,6 s
(der Entwurf schätzt in Stil C etwa ein Viertel zu lang).

## Änderung vom 17.11.2026: kein Zoom ins Leere

Einwand des Betreibers: "wenn du zoomst bei dem Klinge-Soundeffekt sieht man,
dass du nur einen Teil animiert hast und der Rest ist leer". Zweimal fuhr die
Kamera in `shop-duel` auf die Tür gegenüber (1,5 in Satz 1, 1,6 von Anfang an
auf "Und tschüss"); vergrößert blieben dunkle Straße, leere Wand und das Ende
der Straße. Geändert (Text, Aufnahme und alle Klangzeiten unverändert,
`cues.json` bytegleich mit der Fassung davor):

| Stelle | vorher | jetzt |
|---|---|---|
| Satz 1, `shop-duel` | `zoom` 1,5, `focus` [860, 980] nach [600, 1300] | sanftes Heranfahren `zoom` 1,08, `focus` = `to` = [540, 600], `dur` 1,4 (an der Schildlinie verankert, beide Schilder bleiben ganz, nichts Leeres kommt dazu) |
| Satz 2, `week-strip` | `zoom` 1,15, `focus` [580, 1270] nach [540, 1240]: Kopfzeile halb im Ausblenden, unten 600 px leer | `zoom` 1,15, `focus` [580, 600] nach [540, 610]: die Leiste wächst von der Kopfzeile nach unten |
| "Und tschüss", 8,88 bis 9,66 s | `shop-duel` mit `zoom` 1,6 auf die Tür | neuer Baustein `shop-door` (Schnitt, ohne Kamera): Tür offen, er geht hinein, auf "tschüss" fällt sie zu (9,09 s), Glocke klingelt, Licht flackert, Schild wackelt; `ladenglocke` und `wischer` wie vorher |

Die übrigen Kamerafahrten sind geprüft und bleiben: `calc-panel` 1,2,
`wallet-pass` 1,35, `lock-notification` 1,3, `shop-map` 1,15. Sie zeigen
vergrößert nichts, was in der Totale nicht schon da ist (Tafel, Handy,
Karte bis zum Rand). Die Regel steht jetzt im Playbook (Stil C, Kamera) und
in `AUTOMATIK.md` 6.3 und 6.4.

Bau mit der Aufnahme aus dem Cache (0 Zeichen): 38,415 s, 1152 Bilder,
16 Bildwechsel, -14 LUFS, wahre Spitze -1,2 dBTP, alle Prüfungen ok. Drei
Warnungen `effekt-abstand` (vine-boom 4,1 dB bei 4,46 s, ladenglocke 6,1 dB
bei 9,09 s, handy-vibriert 5,4 dB bei 27,14 s, Richtwert 8 dB) gehören zur
unveränderten Tonspur, nicht zu dieser Änderung.

## Idee und Aufbau

Anregung: ein Mitbewerber-Reel mit dem Aufbau "ein Laden gegenüber, ein
einzelner Kunde, eine Jahressumme". Eigen sind Wortlaut ("Dein Stammkunde hat
dich betrogen"), Läden (Döner Nordwind, gegenüber Döner Südwind, beide
erfunden), Bilder, Rechnung und Töne. Belege aus `PRODUKT.md`, Klasse 1:
A1 (Karte in der Wallet), B2 (Stempel sofort sichtbar), C1 (volle Karte
meldet sich in der Nähe des Ladens). Satz 3 ist eine erkennbare
Beispielrechnung, die `calc-panel` nachrechnet: 2 x 8 € x 52 = 832 €,
gesprochen "über 800 Euro".

| Satz | Bild |
|---|---|
| 1 Dein Stammkunde hat dich betrogen. Mit dem Dönerladen gegenüber. | `shop-duel`: beide Läden, Fronten zueinander. Satz steht ab Bild 0, Herz über dem eigenen Laden zerbricht auf "betrogen", der Stammkunde geht über die Straße und verschwindet durch die Tür gegenüber, die Glocke schwingt. Kamera nur sanft heran (1,08) |
| 2 Zweimal die Woche war er bei dir. Dann hat er einmal gegenüber probiert. Und tschüss. | `week-strip`: drei Wochen mit je zwei Stempeln, Kamera vergrößert die Leiste von der Kopfzeile aus, Woche 4 mit dem orangen Stempel von gegenüber. Schnitt: `shop-door`, die Tür gegenüber in Nahaufnahme fällt zu, Ladenglocke auf "tschüss" |
| 3 Das sind über 800 Euro Umsatz im Jahr. Weg. | `calc-panel` mit `"gone": true`: Rechnung, auf "Weg." Strich durch 832 €, Münzen fliegen, Kamera näher |
| 4 Und das Schlimmste: Du hast es nicht mal gemerkt. Seine Papierkarte mit sechs Stempeln liegt im Altpapier. | `shop-counter`: Betreiber wischt die Theke, Denkblase mit drei Punkten, Steppenläufer. Schnitt: `card-bin`, sechs Stempel springen auf, die Karte wird zerknüllt und landet in der Papiertonne |
| 5 Mit StampIt hat er deine Karte im Handy. Jeder Besuch ein Stempel, sofort sichtbar. | `wallet-pass` (8 Felder, Döner-Symbol), drei Stempel landen, Kamera auf die Stempel |
| 6 Und ist sie voll, meldet sie sich von selbst, wenn er an deinem Laden vorbeikommt. Nicht an dem gegenüber. | Schnitt: der achte Stempel ("voll"). Szene: Sperrbildschirm "8 von 8, dein Döner wartet". Schnitt: `shop-map` mit beiden Läden, er geht eine Straße hinter dem eigenen Laden, kommt zuerst am Laden gegenüber vorbei (nichts passiert), dann meldet sich der eigene. Auf "Nicht an dem gegenüber" Kamera zum anderen Laden, durchgestrichene Glocke |
| 7 Willst du deine Stammkunden behalten? Kommentiere KARTE, und wir melden uns. | Frage als Tafeln (als stehende Zeile im Modus "zeile" ist sie zu breit), dann `cta-comment` |

Kein Bild zeigt jemanden, der vor der Tür stehen muss, damit sich die Karte
meldet: auf der Karte von oben geht er eine Straße hinter dem Laden.

## Neu: Klangbibliothek (`studio/sounds/`)

21 Klänge, alle vom 16.11.2026, kommerzielle Nutzung mit dem bezahlten Tarif
des Betreibers:

- 18 aus **ElevenLabs Sound Effects** (`prompt_influence` 0,6, mp3 44,1 kHz):
  vine-boom, plattenkratzer, publikum-keucht, publikum-ooh, drama-stoss,
  grillen-stille, kasse, muenzen, ladenglocke, grill-brutzeln,
  papier-knuellen, muelleimer, trauriger-trompeter, erfolg-pling, wischer,
  handy-vibriert, herzschlag, applaus.
- 3 aus **ElevenLabs TTS eleven_v3, Stimme Liam**: keuchen-1 (Ausschnitt aus
  "[sharp shocked gasp] Oh!"), keuchen-2 (aus "[dramatic gasp] Nein!"), beide
  per Abgleich der Abtastwerte bestätigt; keuchen-3: Herkunft **nicht
  belegt** (vermutlich "[gasps loudly in shock]", die Ausgangsdatei liegt
  nicht mehr vor).

| Datei | Inhalt |
|---|---|
| `sounds/original/<name>.mp3` | Byte für Byte wie geliefert (nur umbenannt), 520 KB |
| `sounds/<name>.flac` | bearbeitet: Stille an beiden Enden weg (leiser als 40 dB unter der Spitze oder -50 dBFS; 5 ms davor, 20 ms danach bleiben, mit Blende), Spitze **-1 dBFS**, 48 kHz mono, 16 bit |
| `sounds/sounds.json` | je Klang: Name, Datei, Original, Beschreibung, Quelle, Anweisung (`prompt`), Anfrage, Datum, Lizenz, Länge vorher und nachher, Schnitt, Anhebung, Spitze, RMS, Lautheit (LUFS), wahre Spitze, sha256 von Original und Datei, sha256 der Abtastwerte |
| `tools/soundlib.py` | `rebuild` (alles aus `original/` neu), `verify` (Fingerabdrücke), `list`; dazu das Mischen für `sfx.py` |

FLAC statt mp3, weil verlustfrei und auf jedem Rechner bitgleich dekodiert;
`.wav` ist von Git ausgenommen. `rebuild` zweimal hintereinander ergibt
dieselben Dateien.

Gemessen (bearbeitete Fassung, Länge in s, integrierte Lautheit in LUFS):
vine-boom 0,907 / -22,5; plattenkratzer 0,457 / -12,0; publikum-keucht
1,072 / -11,7; publikum-ooh 1,648 / -10,3; drama-stoss 1,707 / -13,0;
grillen-stille 2,414 / -15,4; kasse 0,508 / -24,7; muenzen 1,233 / -21,9;
ladenglocke 1,480 / -12,5; grill-brutzeln 2,000 / -14,3; papier-knuellen
1,144 / -22,5; muelleimer 0,269 / -21,8; trauriger-trompeter 2,006 / -13,3;
erfolg-pling 0,427 / -17,1; wischer 0,600 / -23,9; handy-vibriert 0,965 /
-7,5; herzschlag 0,614 / -21,5; applaus 1,913 / -10,3; keuchen-1 0,545 /
-17,2; keuchen-2 0,540 / -16,3; keuchen-3 0,322 / -19,4. Gleiche Spitze
heißt also nicht gleich laut: vine-boom und kasse klingen bei gleichem
`vol` deutlich leiser als handy-vibriert oder applaus.

### So benutzt ein Skript die Bibliothek

An jeder Szene oder jedem Teil, neben `camera`:

```json
"sounds": [
  { "sound": "vine-boom", "cap": 1, "word": 3, "offset": 0.45, "vol": 1.0 },
  { "sound": "ladenglocke", "anchor": "enter", "vol": 0.8 },
  { "sound": "wischer", "at": "start", "offset": 0.2, "vol": 0.8, "duck": false }
]
```

- Zeitpunkt genau einmal: `cap`/`word` (wie ein Anker), `at` (`start`/`end`
  des Teils) oder `anchor` (ein Anker des Bausteins, dann sitzt der Klang auf
  der Bewegung), dazu `offset` in Sekunden.
- `vol`: 1 = so laut (Spitze) wie der lauteste berechnete Ton des Videos
  (`sfx.py` normiert die berechneten Töne auf Spitze 0,7, ein Bibliotheksklang
  mit `vol` 1 kommt ebenfalls auf 0,7). 0 bis 3.
- `duck` (Vorgabe `true`): solange gesprochen wird, ist der Klang um
  `sound.duck` dB leiser (Vorgabe -10). Die Absenkung beginnt 50 ms vor dem
  Wort und lässt 80 ms danach los (12 ms runter, 70 ms wieder hoch).
- Oben im Skript, alles freiwillig:
  `"sound": { "duck": -10, "maxOverlap": 0.3, "minMargin": 8 }`.
- Ein unbekannter Name bricht den Bau ab und nennt die erlaubten.

Was beim Bau passiert:

1. Die Seite setzt die Klänge als Ereignisse mit `"lib": true` in
   `cues.json`. Alle anderen Ereignisse sehen aus wie immer.
2. Prüfung **`effekte`** (Warnung, nur wenn ein Skript `sounds` hat): ein
   Klang mit `"duck": false`, der länger als `maxOverlap` über gesprochenen
   Wörtern liegt.
3. `sfx.py` mischt die berechneten Töne wie immer (dieselbe Schleife,
   derselbe Zufall, dieselbe Normierung) und legt die Bibliotheksklänge danach
   dazu, abgesenkt unter den Wörtern (`--speech`: mit Stimme Anfang und Ende
   jedes Wortes aus den Zeichen-Zeiten, im Entwurf 0,3 s ab jedem geschätzten
   Wort). Die Spur wird dann als 32-bit-Float geschrieben, damit an einer
   lauten Stelle nichts abgeschnitten wird; der Begrenzer der Mischung macht
   den Rest. Dieselbe Mischung, derselbe Weg zu -14 LUFS wie bisher.
4. Mit Stimme misst `sfx.py` je Klang, wie weit die Stimme darüber liegt
   (Fenster zu 0,1 s, nur wo gesprochen wird, mit den Lautstärken der
   Vormischung). Prüfung **`effekt-abstand`** warnt unter `minMargin` dB.
   Ergebnis in `report.json` unter `soundLib`.

**Alte Skripte:** ohne `sounds` läuft genau der alte Weg. `sfx.py` ergibt für
Fassung 7, Fassung 10 und das zweite Video bytegleich dieselbe Datei wie vor
der Bibliothek (`tools/test_sounds.mjs`, Vergleich mit `git HEAD`), kein Teil
bekommt ein neues Feld, `sound` im Bericht bleibt `{"sceneWhoosh": 0.35}`, und
die Prüfung `effekte` gibt es dort gar nicht. Der Server der Seite gibt aus
`sounds/` nur `sounds.json` heraus.

## Neue Bausteine

Alle mit `demo`, alle nur auf Wunsch im Skript. `tools/catalog.mjs` ist
**nicht** gelaufen (es schreibt ins Playbook); Katalog und Standbilder
nachholen, sobald das Playbook frei ist.

### `shop-duel`: zwei Läden gegenüber

Straße in Fluchtpunkt-Perspektive, links der eigene Laden, rechts der
gegenüber (orange Markise, Rauch über dem Grill, Ladenglocke über der Tür).
Die Schilder hängen als Ausleger quer zur Wand und stehen deshalb flach zum
Zuschauer: Namen auf einer schrägen Wand wären auf dem Handy nicht lesbar.

| Parameter | Vorgabe | Bedeutung |
|---|---|---|
| `shop`, `icon` | Café Nordwind, cup | eigener Laden (linkes Schild) |
| `rival`, `rivalIcon` | Café Südwind, cup | Laden gegenüber (rechtes Schild) |
| `heart` | true | Herz über dem eigenen Laden, zerbricht auf `crack` |
| `walker` | true | der Stammkunde geht hinüber und verschwindet auf `enter` durch die Tür gegenüber |
| `from` | 0 | wo er auf `walk` steht (0 vor dem eigenen Laden, 1 an der Tür gegenüber) |
| `smoke` | true | Rauch über dem Laden gegenüber |
| `tones` | true | eigene Töne (thud, ding); false, wenn das Skript Bibliotheksklänge setzt |

Anker: `crack`, `walk`, `enter`. Die Hauswände laufen vorn über den Bildrand
hinaus weiter, damit eine Kamerafahrt zur Seite nicht ins Leere zeigt.
Falle: bis zum Bruch liegt ein ganzes Herz über den beiden Hälften, sonst
bleibt an ihrer gemeinsamen Kante eine feine Naht stehen und das Herz sieht
schon vorher gebrochen aus (so im ersten Standbild).

### `week-strip`: Wochenleiste

Kleiner Kalender (Mo bis So), Woche für Woche zwei Stempel an seinen Tagen,
eine Woche mit einem orangen Stempel von gegenüber. Parameter `shop`, `icon`,
`rivalIcon`, `weeks` (3 bis 5), `days` (1 bis 3 Tage), `filled`,
`rivalWeek`, `rivalDay`, `tones`. Anker `week1` bis `weekN`, `rival`.
Die Leiste ist 760 px breit: mit 840 px lief sie bei Kamerafaktor 1,2 in die
Knopfspalte von TikTok.

### `shop-counter`: Betreiber an der Theke, ahnungslos

Rückwand mit Schild, Dönerspieß (`spit`, abschaltbar), Uhr, der Betreiber
wischt die Theke, Denkblase mit drei Punkten (Anker `bubble`), Steppenläufer
vor der Theke (`tumbleweed`, Anker `roll`). Kein Kunde im Bild, mit Absicht.

### `card-bin`: Papierkarte im Altpapier

Papierkarte (Raster aus `engine/parts.js`), die Stempel springen auf `stamps`
nacheinander auf, auf `crumple` knüllt sie sich zur Kugel, die im Bogen in die
blaue Papiertonne fliegt (`land`). Parameter `shop`, `header`, `stamps`,
`filled`, `freeLabel`, `icon`, `bin` (Aufschrift, Vorgabe "Altpapier"),
`tones`. Falle: das Schild der Tonne hat eine feste Höhe; daran gemessen sah
die Prüfung `einzeiler` zwei Zeilen. Die Schrift sitzt deshalb in einem
eigenen Feld.

### Erweitert, Vorgaben unverändert

- `calc-panel`: `"gone": true` und Anker `gone`: Strich durch das Ergebnis,
  es fliegt mit sechs Münzen nach oben weg (Ton drop). Ohne `gone` kein
  neuer Anker, keine neue Bewegung.
- `shop-map`: `rival`, `rivalIcon`, `rivalAt` ([Spalte, Reihe] mitten in
  einem Block, Vorgabe [2.5, 0.8]) und `quiet` mit Anker `quiet`: zweite,
  orange Ortsnadel mit Schild darüber, auf `quiet` eine durchgestrichene
  Glocke daneben. Nadel und Schild zählen zu dem, was die Benachrichtigung
  nie verdecken darf. Falle: mit `"circle": false` und eigenem `via` darf der
  Weg zuerst am zweiten Laden vorbei; die Benachrichtigung wandert danach mit
  der Figur, deshalb nach dem Brummen nur noch ein kurzes Stück gehen lassen
  (hier `path` [[3.7, 1], [1.5, 1]], `via` 0,915).
- `lock-notification`: `"tones": false` lässt ding und buzz weg (hier ersetzt
  durch `handy-vibriert`).
- `engine/icons.js`: neues Symbol `kebab` (Dönerspieß).

## Messwerte des Entwurfs (ohne Stimme, alle Zeiten geschätzt)

| | |
|---|---|
| Länge | 47,63 s (1429 Bilder), geschätzt; mit Stimme erwartet rund 38 s |
| Zeichen | 577 (nicht ausgegeben) |
| Wörter | 94; Tempo der Schätzung 0,36 s je Wort, echte Wörter je Minute erst mit Stimme |
| Lautheit | Entwurf: feste Mischung ohne Stimme, -26,4 LUFS, wahre Spitze -5,4 dBTP, Bereich 14,8 LU. Das Ziel -14 LUFS / -1 dBTP gilt erst mit Stimme (`loudMix`) |
| Stille ab 0,5 s | im Entwurf ist nur Effektspur zu hören, also fast überall Stille (21 Stellen, von 0 bis 1,90 s, 5,21 bis 5,72 s, ..., 45,53 s bis Ende). Pausen der Stimme gibt es erst mit Aufnahme (`maxGap` 0,45, sieben `gapBefore` zwischen 0,5 und 0,65 s) |
| Prüfungen | 17 von 17 ok, keine Warnung (`effekte` ok, `knopfspalte` ok) |
| Bildwechsel | 16, im Mittel alle 2,61 s, längstes Bild 4,44 s (Richtwert 5) |

Bildwechsel (geschätzte Zeiten): 2,65 Kamera (Laden gegenüber), 4,64 Szene
(Wochenleiste), 7,96 Kamera (Woche 4), 10,52 Schnitt (Tür gegenüber), 11,89
Szene (Rechnung), 15,57 Kamera ("Weg."), 16,48 Szene (Theke), 20,92 Schnitt
(Papierkarte), 24,45 Szene (Wallet), 28,13 Kamera (Stempel), 30,69 Schnitt
(voll), 32,78 Szene (Sperrbildschirm), 34,16 Kamera, 35,28 Schnitt (Karte von
oben), 38,04 Kamera (Laden gegenüber), 40,03 Szene (Schluss).

Klänge aus der Bibliothek (Zeit geschätzt, "über Wörtern" gegen geschätzte
Wortzeiten; alle mit Absenkung -10 dB):

| Zeit | Klang | vol | über Wörtern | worauf |
|---|---|---|---|---|
| 1,89 | drama-stoss | 0,6 | 1,03 s | Herz zerbricht ("betrogen") |
| 2,21 | publikum-keucht | 0,75 | 0,57 s | nach "betrogen." |
| 2,65 | grill-brutzeln | 0,35 | 1,20 s | Kamera auf den Laden gegenüber |
| 4,18 | vine-boom | 1,0 | 0,15 s | nach "gegenüber." (Pause 0,6 s) |
| 8,99 | plattenkratzer | 0,55 | 0,35 s | oranger Stempel ("gegenüber") |
| 10,93 | ladenglocke | 0,8 | 0,52 s | Tür gegenüber ("tschüss") |
| 11,23 | wischer | 0,8 | 0,05 s | nach "tschüss." |
| 15,67 | muenzen | 0,7 | 0,32 s | "Weg." |
| 15,97 | trauriger-trompeter | 0,8 | 0,90 s | nach "Weg." (Pause 0,65 s) |
| 19,44 | grillen-stille | 0,7 | 1,61 s | "nicht mal gemerkt" |
| 22,82 | papier-knuellen | 0,8 | 0,90 s | Karte wird zerknüllt |
| 23,84 | muelleimer | 0,9 | 0 s | Kugel in der Tonne |
| 29,98 | erfolg-pling | 0,55 | 0,25 s | dritter Stempel ("sichtbar") |
| 31,92 | erfolg-pling | 0,7 | 0,25 s | achter Stempel ("voll") |
| 33,08 | handy-vibriert | 0,7 | 0,85 s | Sperrbildschirm |
| 39,42 | applaus | 0,45 | 0,88 s | nach "gegenüber." (Pause 0,65 s vor der Frage) |

Ob die Stimme über jedem Klang klar oben liegt, ist **nicht gemessen**: das
geht nur mit Aufnahme (`soundLib[].marginDb`, Richtwert 8 dB). Abgehört hat
niemand.

Mitschrift (`eyes`, lokal mit whisper.cpp large-v3-turbo, ohne Glossar): am
Entwurf ohne Stimme sinnlos. Sie liefert zweimal "Untertitelung des ZDF,
2020", eine bekannte Erfindung von Whisper bei Stille, kein Wort des Textes.
`eyes` zählt 12 Schnitte (das Studio 16 Bildwechsel; Kamerafahrten sieht das
Werkzeug nicht als Schnitt). Vergleich mit dem freigegebenen Text erst mit
Aufnahme.

## Selbstprüfung (17.11.2026, nach allen Änderungen)

- `node studio/tools/selftest.mjs`: 97 von 97 Prüfungen bestanden.
- `node studio/tools/regress.mjs`: BESTANDEN: v7 gut, v10 gut (je 130 von 130
  Standbildern bildgleich, Effektspur bytegleich, Mischung gleich).
- `node studio/tools/test_sounds.mjs`: 26 von 26 Prüfungen bestanden.

## Beitragstext (Instagram, Facebook, TikTok)

```
Dein Stammkunde hat dich betrogen. Mit dem Dönerladen gegenüber. 💔
Mit Stampit liegt deine Stempelkarte in seiner Apple oder Google Wallet. Ist sie voll, meldet sie sich in der Nähe deines Ladens von selbst.
👉 Kommentiere KARTE und wir melden uns.

#kleinunternehmen #stammkunden #döner #imbiss #gastronomie
```

247 Zeichen vor den Hashtags, 5 Hashtags, 2 Emojis, kein Gedankenstrich.
Aussagen: A1 und C1 aus `PRODUKT.md`. Die Hashtags folgen dem Auftrag
(#kleinunternehmen #stammkunden und drei für Imbiss und Döner).
`tools/beitrag.mjs pruefen` lehnt sie ab, weil #stammkunden und #gastronomie
nicht in `state/konfig.json` stehen; die Zeile nach der Liste dort wäre
`#döner #imbiss #berlincity #kleinunternehmen #stempelkarte`. Welche gilt,
entscheidet der Betreiber.

## `tools/test_sounds.mjs` in `tools/selftest.mjs` einhängen

Nicht gemacht, weil `selftest.mjs` gerade woanders bearbeitet wird. Später
vor der Schlusszeile von `selftest.mjs` ergänzen (`run` und `STUDIO_ROOT`
sind dort schon importiert):

```js
// ---- Klangbibliothek (studio/sounds): eigene Datei, laeuft auch allein
{
  const ts = await run('node', [path.join(STUDIO_ROOT, 'tools', 'test_sounds.mjs')])
  check('Klangbibliothek: tools/test_sounds.mjs', ts.code === 0, ts.out.trim().split('\n').pop())
}
```

Achtung: der Vergleich "alte Töne bytegleich" liest `sfx.py` aus `git HEAD`.
Sobald die Bibliothek committet ist, steht dort die neue Fassung; der Test
merkt das und überspringt den Vergleich mit einem Hinweis. Danach hält
`tools/regress.mjs` (Effektspur bytegleich mit den Originalen) dasselbe fest.

## Was das Playbook daraus lernen kann

- **Echte Klänge gehen jetzt, aber nur über die Bibliothek.** Neue Klänge
  nach `sounds/original/`, Eintrag in `sounds.json` (Quelle, Anweisung,
  Datum, Lizenz), dann `python3 studio/tools/soundlib.py rebuild`. Abschnitt
  "Töne" im Playbook sagt noch "es gibt keine fremden Aufnahmen".
- **Gleiche Spitze ist nicht gleiche Lautheit.** Basslastige Klänge
  (vine-boom -22,5 LUFS) brauchen mehr `vol` als breite (applaus -10,3).
- **Meme-Klänge in die Pausen.** `gapBefore` 0,6 bis 0,65 s nach der Pointe
  gibt einem Klang Platz, ohne dass das Video stockt; was über Wörtern
  liegt, wird abgesenkt.
- **"Gegenüber" braucht eine Perspektive, in der sich zwei Fronten
  ansehen.** Von der Seite lesen sich zwei Läden als Nachbarn.

## Offen

- Aufnahme (577 Zeichen) und fertiger Bau mit Stimme, danach `soundLib`
  (Abstand der Stimme zu jedem Klang), Lautheit (-14 LUFS), Pausen und Tempo
  nachtragen, und eine Mitschrift mit dem freigegebenen Text vergleichen.
- **Nicht abgehört**, weder Klänge noch Mischung.
- `tools/catalog.mjs` für die vier neuen Bausteine.
- Beitragstext: Hashtags klären (siehe oben).
