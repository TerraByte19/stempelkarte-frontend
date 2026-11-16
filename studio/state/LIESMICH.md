# Stampit Studio: der Ordner `state`

Hier liegt, was die Automatik braucht, um jeden Tag dort weiterzumachen, wo
der letzte Lauf aufgehört hat. Wie die Läufe arbeiten, steht in
`../AUTOMATIK.md`; diese Seite erklärt nur die Dateien.

**Das Gedächtnis ist das Board, nicht dieser Ordner.** Jeder Lauf startet in
einer leeren Maschine und liest seinen Stand vom Board. Was hier liegt, sind
die Einstellungen (fest), die Startfassungen (einmalig) und ein Abzug des
Boards (zweite Kopie, darf veraltet sein, weil ein Push abgelehnt werden
kann).

| Datei | Was sie ist | Wer schreibt | Was auf dem Board dazu gehört |
|---|---|---|---|
| `konfig.json` | Einstellungen: Adresse des Boards, Branch, Zeitzone und Uhrzeit des Postens, Marke und Kennzahlen bei Metricool, die beobachteten Konten (Stand 15.11.2026), Regeln der Ideensuche, alle Grenzen der Stimme, Richtwerte für Videos, Speicher, eyes, Push | nur eine begleitete Sitzung mit dem Betreiber. Ein unbeaufsichtigter Lauf liest sie und ändert sie nie | `stand/aktuell.stimme_limit_monat` trägt denselben Wert wie `stimme.limit_monat` |
| `LIESMICH.md` | diese Seite | begleitete Sitzung | |
| `start/stimme.json` | leeres Kassenbuch der Stimme | begleitete Sitzung | Startfassung von `gedaechtnis/stimme` |
| `start/themen.json` | leere Liste der verwendeten Nummern aus `THEMEN.md` | begleitete Sitzung | Startfassung von `gedaechtnis/themen` |
| `start/wuensche.json` | leere Liste der Wünsche des Betreibers | begleitete Sitzung | Startfassung von `gedaechtnis/wuensche` |
| `start/konten.json` | leerer Stand der beobachteten Konten | begleitete Sitzung | Startfassung von `gedaechtnis/konten` |
| `start/reels.json` | nicht benutzt, darf gelöscht werden (bewertete Reels liegen einzeln in der Sammlung `reels`) | | |
| `board/<sammlung>/<id>.json` | Abzug vom Board: `gedaechtnis`, `stand`, `ideen`, `reels`, `laeufe`. Entsteht beim ersten Produktionslauf; bis dahin gibt es den Ordner nicht | Modus `produktion`, Schritt 13, mit `ArtifactData` und `out_dir` | genau diese Dokumente, im Zustand am Ende des Laufs |

## Die Startfassungen

Gibt es ein Dokument der Sammlung `gedaechtnis` beim ersten Lauf noch nicht,
gilt der Inhalt der gleichnamigen Datei aus `start/`, und der Lauf legt das
Dokument damit an. Danach werden die Dateien nicht mehr gelesen. Sie bleiben
leer: der Zustand gehört aufs Board.

## Der Abzug

- Er wird überschrieben, nie zusammengeführt: der Stand des Boards am Ende
  des Laufs ersetzt, was da lag.
- Er wird nie aufs Board zurückgespielt. Er ist für den Tag da, an dem das
  Board verloren geht, und für jeden, der im Repo nachsehen will, was die
  Automatik weiß.
- Er kann Lücken haben: ein abgelehnter Push, ein Lauf, der vorher endete.
  Dann zeigt er einen älteren Tag. Das ist kein Fehler.
- `eingang` und `videos` sind nicht dabei: dort stehen die Notizen und
  Änderungswünsche des Betreibers. In `gedaechtnis/wuensche` stehen kurze
  Auszüge davon (höchstens 300 Zeichen je Eintrag), die kommen mit.
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
| `board.adresse` | Adresse des Boards. Maßgeblich ist `studio/board/ADRESSE.txt`; beide müssen gleich sein |
| `zeit.posten_um` | 10:00 Uhr deutscher Zeit, gepostet wird von Hand |
| `metricool.brand_id` | die Marke bei Metricool. Die Automatik liest dort nur |
| `konten` | die beobachteten Konten, wie sie am 15.11.2026 gesehen wurden. Der laufende Stand steht auf dem Board in `gedaechtnis/konten` |
| `ideen.*` | ab wann ein Reel zur Idee wird und wie viele Ideen gleichzeitig offen sein dürfen |
| `stimme.*` | alle Grenzen für Aufnahmen. `tools/budget.mjs` liest genau diesen Abschnitt und rechnet danach |
| `stimme.vortrag` | geschätzter Verbrauch im November 2026 vor dem ersten Lauf. Der Betreiber kann die wahre Zahl bei ElevenLabs ablesen und hier eintragen lassen |
| `mix` | `null`: Vorgaben des Studios. Hier steht erst etwas, wenn der Betreiber eine lautere Mischung gehört und gewählt hat |
| `speicher.loeschen_erlaubt` | `false`: die Automatik löscht nie Dateien vom Board |
