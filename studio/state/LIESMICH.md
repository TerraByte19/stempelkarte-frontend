# Stampit Studio: der Ordner `state`

Hier liegt, was die Automatik braucht, um jeden Tag dort weiterzumachen, wo
der letzte Lauf aufgehört hat. Wie der Lauf arbeitet, steht in
`../AUTOMATIK.md`; diese Seite erklärt nur die Dateien.

**Das Gedächtnis ist das Board, nicht dieser Ordner.** Jeder Lauf startet in
einer leeren Maschine und liest seinen Stand vom Board. Was hier liegt, sind
die Einstellungen (fest), die Startfassungen (einmalig) und ein kleiner Abzug
des Boards (zweite Kopie, darf veraltet sein, weil ein Push abgelehnt werden
kann).

| Datei | Was sie ist | Wer schreibt | Was auf dem Board dazu gehört |
|---|---|---|---|
| `konfig.json` | Einstellungen: Adresse des Boards, Branch, Uhrzeiten, Marke und Kennzahlen bei Metricool, wer postet, Regeln für den Beitragstext mit Hashtags, Regeln für Ideen, alle Grenzen der Stimme, Kopf jedes Skripts in Stil C, Richtwerte für Videos, Mischung, Speicher, eyes, Abzug, Push | nur eine begleitete Sitzung mit dem Betreiber. Der unbeaufsichtigte Lauf liest sie und ändert sie nie | `stand/aktuell.stimme_limit_monat` trägt denselben Wert wie `stimme.limit_monat` |
| `LIESMICH.md` | diese Seite | begleitete Sitzung | |
| `start/stimme.json` | leeres Kassenbuch der Stimme | begleitete Sitzung | Startfassung von `gedaechtnis/stimme` |
| `start/themen.json` | leere Liste der verwendeten Nummern aus `THEMEN.md` | begleitete Sitzung | Startfassung von `gedaechtnis/themen` |
| `start/wuensche.json` | leere Liste der Wünsche des Betreibers | begleitete Sitzung | Startfassung von `gedaechtnis/wuensche` |
| `board/<sammlung>/<id>.json` | Abzug vom Board: nur `laeufe`, `gedaechtnis/stimme` und `gedaechtnis/themen`, nie `vorschau` oder `diagnose`. Entsteht beim ersten Lauf; bis dahin gibt es den Ordner nicht | der Lauf, Schritt 24, mit `ArtifactData` und `out_dir` | genau diese Dokumente, im Zustand am Ende des Laufs |

## Die Startfassungen

Gibt es ein Dokument der Sammlung `gedaechtnis` beim ersten Lauf noch nicht,
gilt der Inhalt der gleichnamigen Datei aus `start/`, und der Lauf legt das
Dokument damit an. Danach werden die Dateien nicht mehr gelesen. Sie bleiben
leer: der Zustand gehört aufs Board.

## Der Abzug

- Er enthält **nur** das Protokoll der Läufe, das Kassenbuch der Stimme und
  die Liste der verwendeten Themen. Nie die Sammlungen `vorschau` (jedes
  Video als base64, rund 5 MB) und `diagnose` (Messungen der Seite am
  iPhone): sie wären groß oder für das Repo ohne Nutzen. `tools/selftest.mjs`
  prüft, dass `abzug.sammlungen` in `konfig.json` sie nicht nennt. Wünsche des Betreibers, Texte aus dem
  Eingang, Ideen, Videos und alles über Mitbewerber bleiben allein auf dem
  Board: das Repo kann öffentlich sein (`../AUTOMATIK.md`, Regel 12).
- Er wird überschrieben, nie zusammengeführt, und nie aufs Board
  zurückgespielt. Er ist für den Tag da, an dem jemand im Repo nachsehen
  will, was gelaufen ist und was die Stimme gekostet hat.
- Er kann Lücken haben: ein abgelehnter Push, ein Lauf, der vorher endete.
  Dann zeigt er einen älteren Tag. Das ist kein Fehler.
- Die Form der Dateien bestimmt das Werkzeug `ArtifactData`. Ob es das
  Dokument allein ablegt oder mit einer Hülle aus `id`, `data` und `version`,
  ist an der echten Plattform noch nicht nachgesehen (ungeprüft).

## Was nicht hier liegt

- Skript und Aufnahme eines Videos: `studio/videos/<datum>-<slug>/` (und als
  Paket auf dem Board, `../AUTOMATIK.md`, Abschnitt 7).
- Fertige Videos: nur auf dem Board. `out/` ist von Git ausgenommen.
- Schlüssel und Passwörter: nirgends im Repo. Den Schlüssel für die Stimme
  hängt der Proxy der Umgebung an.

## Die Werte in `konfig.json`, die am häufigsten gefragt sind

| Wert | Bedeutung |
|---|---|
| `repo.branch` | der einzige Branch, auf dem die Automatik arbeitet und auf den sie pushen darf, wenn der Auftragstext es erlaubt |
| `board.adresse` | Adresse des Boards. Für den Lauf gilt allein die Adresse aus dem Auftragstext der Aufgabe; dieser Wert und `studio/board/ADRESSE.txt` müssen dieselbe nennen, sonst meldet der Lauf das und endet |
| `zeit.lauf_um`, `zeit.posten_um` | der Lauf startet um 06:47 Uhr, gepostet wird um 10:00 Uhr deutscher Zeit, vom Betreiber selbst |
| `metricool.brand_id` | die Marke bei Metricool. Die Automatik liest dort nur. Beobachtet werden seit dem 16.11.2026 vier Mitbewerber (trytappi, gobonki, evecoo.digital, loyaltify.io); welche, legt der Betreiber in Metricool fest |
| `posten.*` | wer postet (der Betreiber, mit Metricool, auf Instagram, Facebook und TikTok zugleich) und sein Tarif (gratis, 20 Beiträge im Monat). Die Automatik postet und plant nie |
| `beitrag.*` | Regeln für den Beitragstext je Video (Feld `caption` auf dem Board): höchstens 250 Zeichen und höchstens 3 Emojis (`max_emojis`) vor den Hashtags, genau 5 Hashtags, die Liste der erlaubten Hashtags (zuerst die fünf des Betreibers), die zwei je Branche und die drei festen, dazu sein Beispiel. `tools/beitrag.mjs` liest genau diesen Abschnitt |
| `ideen.*` | ab wann ein Reel zur Idee wird, wie viele Ideen je Lauf entstehen und gleichzeitig offen sein dürfen, wie lange ein Blickwinkel ruht, wie oft ein Dauerwunsch drankommt |
| `stimme.*` | alle Grenzen für Aufnahmen. `tools/budget.mjs` liest genau diesen Abschnitt und rechnet danach. Dieselben Obergrenzen stehen im Auftragstext; wer hier eine Zahl ändert, ändert sie auch dort |
| `stimme.unbeaufsichtigt_erlaubt` | der Not-Aus: `false` schaltet die Stimme für die Automatik ab |
| `stimme.vortrag` | geschätzter Verbrauch im November 2026 vor dem ersten Lauf. Der Betreiber kann die wahre Zahl bei ElevenLabs ablesen und hier eintragen lassen |
| `skript.*` | der Kopf jedes neuen Skripts in Stil C: `captionStyle`, `timing` (mit `maxGap`), `pace`. Die Vorlage `videos/_vorlage/script.json` trägt genau diese Werte, `tools/selftest.mjs` prüft das |
| `video.*` | Richtwerte für Länge (40 bis 55 s mit Stimme, 105 bis 115 Wörter), Bildwechsel (mindestens 12, keines länger als 5 s), Pausen und Lautheit, alle aus dem zweiten Video. `aufnahme_bis_s` ist die Sperre vor der Aufnahme (geschätzte Länge des Entwurfs) |
| `mix` | `{ "lufs": -14, "truePeak": -1 }`: so laut wird jedes neue Video gemischt, vom Betreiber mit dem zweiten Video gewählt. Jedes neue Skript trägt genau dieses Objekt. Bis zum 16.11.2026 stand hier `null` (Vorgaben des Studios, -18,6 LUFS wie das erste Video) |
| `eyes.lautheit_lufs` | was die zweite Prüfung bei einem Video in Stil C ungefähr messen soll; nur vermerken, nie nachmischen |
| `speicher.loeschen_erlaubt` | `false`: die Automatik löscht nie Dateien vom Board |
| `abzug.sammlungen` | was am Ende eines Laufs ins Repo kopiert wird |
