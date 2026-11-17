# Stampit Studio: eigene Themen

Vorrat für Tage, an denen von den beobachteten Konten und aus dem Eingang
nichts Brauchbares kommt. Jede Zeile ist ein Ansatz für ein Video: ein Laden,
ein Blickwinkel, ein erster Satz, und die **Formate**, in denen es erzählt
werden kann. Wie die Liste benutzt wird, steht in `AUTOMATIK.md`, Abschnitt 5
("Eine Nummer aus `THEMEN.md`"), wie das Format gewählt wird, in
`FORMATE.md` 3. Stand: 17.11.2026 (Formate je Thema, zwölf neue Themen
T28 bis T39, T05 und T19 im Format F04 benutzbar).

## Regeln für diese Liste

- **Spalte "V1".** "ja" heißt: jede Aussage des Themas steht in `PRODUKT.md`
  in Klasse 1 (gesichert). "wartet" heißt: das Thema braucht eine Aussage
  aus Klasse 2 (nur im Tarifvergleich genannt, vom Betreiber noch nicht
  bestätigt). Ein unbeaufsichtigter Lauf baut wartende Themen nicht und legt
  dafür keine Idee an. Bestätigt der Betreiber die Funktion, setzt eine
  begleitete Sitzung die Zeile auf "ja". Heute sind **30 von 39** Themen
  benutzbar.
- **Spalte "Formate".** Die Formate aus `FORMATE.md`, in denen das Thema
  erzählt werden kann, das passendste zuerst. Der Lauf nimmt das erste, das
  die Regeln der Abwechslung erlauben (`FORMATE.md` 3). Ist keins erlaubt,
  kommt das Thema an diesem Tag nicht dran. Ein Thema hat nie nur den alten
  Bogen (Papier, Handy, Stempel, Karte von oben, Sperrbildschirm): der ist
  kein Format mehr (`FORMATE.md` 1).
- **Reihenfolge ist Absicht.** Die Nummern sind so gelegt, dass von Tag zu Tag
  meist der Laden wechselt und derselbe Blickwinkel in der Regel frühestens
  nach sieben Tagen wiederkommt. Die genaue Regel der Auswahl steht in
  `AUTOMATIK.md`, Abschnitt 5.
- **Der Hook ist ein Vorschlag.** Er darf beim Schreiben des Skripts besser
  werden und muss zum Format passen (Muster in `FORMATE.md` 4), aber nie zu
  einer Aussage, die `PRODUKT.md` in Klasse 1 nicht deckt.
- **Nichts wiederholt das erste Video** ("Der sechste Kaffee geht aufs Haus.
  Warum eigentlich?": Café, Gratis-Kaffee als Rechnung, 6.500 Euro, Stichwort
  KARTE mit Becherreihe). Kein Thema hier beginnt mit "geht aufs Haus", keines
  rechnet vor, was der Gratis-Artikel kostet, und keines spielt im Café.
- **Nichts kopiert ein Vorbild.** Aufbau und Handwerk dürfen gelernt werden
  (Playbook, "Erkenntnisse"). Wortlaut, Bilder und erfundene Läden fremder
  Videos nie, auch nicht deren erste Sätze.
- **Jedes benutzbare Thema ist mit den vorhandenen Bausteinen baubar**,
  seit dem 17.11.2026 auch mit `tip-cards`, `comment-thread`,
  `versus-split`, `day-clock` und `big-number` (Katalog im Playbook).
- **Beleg** nennt die Zeile in `PRODUKT.md`. Ohne Beleg kein Satz über die App.
- **Verwendet** ist eine Nummer, sobald daraus eine Idee auf dem Board
  angelegt wurde. Das steht auf dem Board in `gedaechtnis/themen`, nicht in
  dieser Datei. Sind alle benutzbaren Nummern verwendet, beginnt die Liste
  von vorn, mit neuen ersten Sätzen, und wenn möglich in einem anderen Format
  als beim letzten Mal.

## Läden

Die vier Branchen der Landing Page (`src/pages/Landing/branchen.json`). Je
Laden ein fester Name, ein Symbol und ein Stichwort, damit Bild, Text und
Schlusszeile zusammenpassen. Jedes Video erzählt von **einem** dieser Läden,
nie von demselben wie das Video davor (`FORMATE.md`, V5).

| Schlüssel `branche` | Laden im Video | Name im Bild | Symbol (`icon`) | Kulisse | Stichwort |
|---|---|---|---|---|---|
| `friseur` | Friseur, Barbershop | Salon Haarscharf | `scissors` | `"mug": false` | SALON |
| `doener` | Döner, Imbiss, Pizza | Döner Palast | `kebab` (früher `star`) | `"mug": false` | IMBISS |
| `eiscafe` | Eiscafé, Bubble Tea | Eis am Markt | `heart` | `"mug": false` | EIS |
| `cafe` | hier immer als Bäckerei | Bäckerei Morgenrot | `bread` | `"mug": true` erlaubt | BROT |

Die Becherreihe (`cup-row`) passt nur zu Bechern und war das Bild des ersten
Videos: in diesen Themen kommt sie nicht vor. Das Stichwort darf auch KARTE
oder STEMPEL sein, wenn es besser zum Video passt. Es bleibt ein kurzes Wort,
möglichst ohne Umlaut, damit es sich leicht tippen lässt. Richtwert: höchstens
sieben Buchstaben; ob die Schlusszeile in eine Zeile passt, meldet die Prüfung
`einzeiler`.

## Blickwinkel

Der Schlüssel `thema` steht später am Video und an der Idee auf dem Board.
An ihm hängt die Regel "nicht dasselbe Thema innerhalb von sieben Tagen".

| Schlüssel `thema` | Worum es geht | V1 | Formate |
|---|---|---|---|
| `sperrbildschirm` | In der Nähe des Ladens erscheint die Karte von selbst auf dem Sperrbildschirm, mit dem Stand (voll: die Belohnung wartet) | ja | F08, F07 |
| `verlorener-stammkunde` | Der Kunde, der fast Stammkunde war: mit Papier merkt es niemand | ja | F10, F06, F07 |
| `papierkarte` | Papier wird nass, zerknickt, vergessen | ja | F06, F07 |
| `rechnung` | Beispielrechnung: wenige Stammkunden kommen öfter | ja | F04 |
| `kein-download` | Einmal scannen, keine App | ja | F03, F09, F06 |
| `stempelzahl` | Zu viele Stempel bis zur Belohnung | ja | F04, F01, F09 |
| `team` | Stempeln geht mit einem Scan der Handy-Kamera ("auch die Aushilfe" wartet) | ja | F05, F03, F06 |
| `karte-bleibt` | Die Karte bleibt auf dem Handy, auch über die Winterpause | ja | F07, F03 |
| `studie` | Eine Zahl aus einer Studie, mit Quelle | ja | F10 |
| `stammkunden-tipps` | Echte Tipps, wie aus Gästen Stammkunden werden; das Produkt erst als letzter Tipp | ja | F01 |
| `theke-saetze` | Sätze an der Theke, die besser sind als die üblichen | ja | F02 |
| `einwand` | Eine Frage oder ein Einwand des Ladenbesitzers, beantwortet | ja | F03, F09 |
| `ladentag` | Ein Tag im Laden in Uhrzeiten | ja | F05 |
| `duell` | Papierkarte gegen Handy, Runde für Runde | ja | F06 |
| `nachricht` | Der Laden schickt selbst eine Nachricht oder ein Tagesangebot | wartet (C3, C5) | |
| `rueckhol` | Wer länger nicht da war, wird erinnert | wartet (C2) | |
| `geburtstag` | Automatische Nachricht zum Geburtstag | wartet (C4) | |
| `willkommen` | Willkommensgeschenk für neue Kunden | wartet (D3) | |
| `kunde-wirbt-kunde` | Kunde wirbt Kunde, Bonus für beide | wartet (D5) | |

## Die Themen

"Bild der Aussage" ist das eine Bild, das die zentrale Aussage braucht. Alles
andere, Reihenfolge und Einstieg eingeschlossen, kommt aus dem Format.

| Nr. | V1 | Laden | Blickwinkel | Formate | Hook (erster Satz, steht ab Bild 0) | Was das Video sagt | Beleg | Bild der Aussage |
|---|---|---|---|---|---|---|---|---|
| T01 | ja | `friseur` | `verlorener-stammkunde` | F06, F07, F10 | Neun Haarschnitte bei dir. Den zehnten macht ein anderer. | Die Papierkarte lag zerknickt im Portemonnaie, und niemand hat gemerkt, wie nah er dran war. In der Wallet geht die Karte nicht verloren. | A4, A3 | `paper-card` (10 Felder, 9 gestempelt) |
| T02 | ja | `doener` | `sperrbildschirm` | F08 | Mittagspause. Dein Kunde geht an deinem Laden vorbei. Und sein Handy meldet sich. | In der Nähe des Ladens erscheint die Karte von selbst auf dem Sperrbildschirm, mit dem Stand. | C1, A2 | `lock-notification` (12:07 Uhr, "Noch 2 Stempel bis: Gratis-Döner"), `shop-map` |
| T03 | ja | `eiscafe` | `papierkarte` | F06, F07 | Die Stempelkarte war in der Badetasche. Jetzt ist sie Matsch. | Papier geht kaputt oder verloren. Die Karte in der Wallet nicht. | A4, A1, A3 | `versus-split` Runde "regen" |
| T04 | ja | `cafe` | `kein-download` | F03, F09, F06 | Für Brötchen lädt niemand eine App herunter. Muss auch keiner. | Der Kunde scannt einmal einen QR-Code, danach liegt die Karte in der Wallet. Kein Store, kein Download. | A2, A3, A1 | `wallet-pass` (Scan und Haken) |
| T05 | ja | `friseur` | `rechnung` | F04 | Zwei Haarschnitte mehr im Jahr. Klingt nach wenig. | Beispielrechnung: 25 € bleiben pro Haarschnitt, mal 40 Stammkunden, mal 2 Besuche mehr im Jahr, sind 2.000 € mehr im Jahr. Ein Beispiel, kein Versprechen. | Beispielrechnung, A1, A4 | `big-number` je Faktor, `calc-panel` (40 × 2 × 25 = 2.000 €) |
| T06 | ja | `doener` | `stempelzahl` | F04, F09, F01 | Zehn Stempel bis zum Gratis-Döner. Wie viele deiner Kunden halten so lange durch? | Du legst selbst fest, wie viele Stempel es bis zur Belohnung braucht. | D2, A1 | `big-number` ("10 Wochen"), `wallet-pass` (6 Felder). Die Stempelzahl wechselt mit Absicht: die Warnung `hinweise` dazu ist gewollt |
| T07 | wartet (C3, C5) | `eiscafe` | `nachricht` | | Neue Sorte seit heute. Deine Stammkunden wissen es schon. | Du schickst deinen Kunden selbst eine Nachricht aufs Handy, oder stellst ein Tagesangebot auf die Karte. | C3, C5 | `lock-notification` (ohne Ortsnadel) |
| T08 | wartet (C2) | `friseur` | `rueckhol` | | Dein Kunde war lange nicht da. Sein Handy erinnert ihn an dich. | Wenn Kunden länger nicht da waren, meldet sich die Karte. | C2 | `lock-notification` (ohne Ortsnadel) |
| T09 | wartet (C4) | `cafe` | `geburtstag` | | Deine Stammkundin hat heute Geburtstag. Dein Laden gratuliert von selbst. | Automatische Nachrichten, zum Beispiel zum Geburtstag. | C4 | `lock-notification` (ohne Ortsnadel) |
| T10 | ja | `doener` | `team` | F05, F03, F06 | Die Schlange reicht bis zur Tür. Stempeln geht trotzdem mit einem Scan. | Das Personal scannt mit der Handy-Kamera, der Stempel ist sofort auf dem Kundenhandy. Kein Stempelkissen, kein Suchen nach der Karte. | B1, B2, A4 | `wallet-pass` (Scan, drei Stempel) |
| T11 | wartet (D3) | `eiscafe` | `willkommen` | | Ein Geschenk für neue Kunden. Und ein Grund für den zweiten Besuch. | Neue Kunden bekommen ein Willkommensgeschenk. | D3, A3 | `wallet-pass` |
| T12 | wartet (D5) | `friseur` | `kunde-wirbt-kunde` | | Dein bester Werbekanal sitzt gerade auf deinem Stuhl. | Kunde wirbt Kunde, mit Bonus für beide. | D5 | `wallet-pass` |
| T13 | ja | `eiscafe` | `karte-bleibt` | F07, F03 | Im Winter ist deine Eisdiele zu. Die Stempelkarte deiner Kunden bleibt. | Einmal gescannt, bleibt die Karte auf dem Handy. Im Frühling geht es weiter. | A3, A1 | `wallet-pass` (Stempel im Frühling) |
| T14 | ja | `cafe` | `studie` | F10 | Jeden Samstag zwei Brötchen. Seit drei Wochen nicht mehr. (H02; die Zahl erst danach, `HOOKS.md` 1.5) | Die Zahl mit Quelle im gesprochenen Satz (Harvard Business Review). Was sie für die Bäckerei heißt. | S3, A1, A4 | `big-number` ("5-25×") |
| T15 | ja | `doener` | `verlorener-stammkunde` | F10, F07 | Er kam jede Woche. Dann nicht mehr. Hast du es gemerkt? | Mit Papier merkt es niemand: die Karte ist weg, und mit ihr der Anlass zu kommen. In der Wallet bleibt sie. | A4, A3 | `week-strip` (Wochen ohne Stempel) |
| T16 | ja | `cafe` | `sperrbildschirm` | F08 | 07:48 Uhr, auf dem Weg zur Bahn. Dein Handy sagt: Dein Brötchen ist gratis. | Die Karte meldet sich von selbst, in der Nähe des Ladens, mit dem Stand; voll: das Brötchen wartet. | C1 | `lock-notification` (07:48 Uhr), `shop-map` |
| T17 | ja | `doener` | `papierkarte` | F06, F07 | Die Stempelkarte klebt an der Serviette. Die Serviette liegt im Müll. | Papier geht verloren. Die Karte in der Wallet bleibt. | A4, A1 | `versus-split` Runde "knick" oder `card-bin` (Motiv `papier-knick`, V3) |
| T18 | ja | `friseur` | `kein-download` | F03, F09 | Dein Kunde sitzt im Stuhl. Bis du fertig bist, hat er die Karte im Handy. | Einmal den QR-Code scannen, kein Store, kein Download. | A2, A3 | `wallet-pass` (Scan und Haken) |
| T19 | ja | `eiscafe` | `rechnung` | F04 | 30 Stammkunden kommen im Sommer einmal mehr pro Woche. Rechne mit. | Beispielrechnung: 4 € bleiben pro Besuch, mal 30 Stammkunden, mal 16 Wochen Saison, sind 1.920 € mehr im Sommer. | Beispielrechnung, A1 | `big-number` je Faktor, `calc-panel` (4 × 30 × 16 = 1.920 €) |
| T20 | ja | `friseur` | `stempelzahl` | F01, F04, F09 | Ein Haarschnitt im Monat. Bis zehn Stempel voll sind, dauert das fast ein Jahr. | Die Zahl der Stempel bis zur Belohnung bestimmst du selbst. Kürzere Karten werden eher voll (als Überlegung, nicht als Zusage). | D2 | `big-number` ("10 Monate"), `wallet-pass` (5 Felder) |
| T21 | wartet (C5, C3) | `doener` | `nachricht` | | Heute ist Lahmacun im Angebot. Wer erfährt das, bevor er Hunger hat? | Das Tagesangebot steht auf der Karte deiner Kunden. | C5, C3 | `lock-notification` (ohne Ortsnadel) |
| T22 | wartet (C2) | `cafe` | `rueckhol` | | Früher kam sie jeden Morgen. Jetzt nicht mehr. Dein Laden meldet sich bei ihr. | Wenn Kunden länger nicht da waren, erinnert die Karte von selbst. | C2 | `lock-notification` (ohne Ortsnadel) |
| T23 | wartet (C4) | `friseur` | `geburtstag` | | Dein Kunde hat heute Geburtstag. Dein Salon gratuliert, ohne dass du daran denkst. | Automatische Nachrichten, zum Beispiel zum Geburtstag. | C4 | `lock-notification` (ohne Ortsnadel) |
| T24 | wartet (B3, B4) | `cafe` | `team` | | Samstags steht die Aushilfe an der Theke. Stempeln kann sie trotzdem. | Der Scanner läuft auf jedem Handy mit Kamera, es gibt Zugänge für Mitarbeiter und Aushilfen. | B3, B4, B2 | `wallet-pass` (Scan, Stempel) |
| T25 | ja | `eiscafe` | `sperrbildschirm` | F08 | Die Karte ist voll. Dein Kunde erfährt es, wenn er an deiner Eisdiele vorbeikommt. | Die volle Karte meldet sich auf dem Sperrbildschirm, in der Nähe des Ladens. | C1 | `lock-notification` ("Gratis-Kugel wartet auf dich"), `shop-map` |
| T26 | ja | `cafe` | `papierkarte` | F07, F06 | Fünf Stempelkarten im Portemonnaie. Wann war zuletzt eine voll? | Papierkarten werden vergessen. Die Karte in der Wallet bleibt. | A4, A1 | `paper-card` oder `versus-split` |
| T27 | ja | `eiscafe` | `kein-download` | F03, F09, F10 | Eine Kugel Eis und dafür eine App laden? Macht keiner. | Keine App, kein Download: einmal scannen genügt. Wer mag, nennt dazu die Studienzahl S5 mit ihrer Einschränkung (F10). | A2, A3, wahlweise S5 | `wallet-pass` (Scan und Haken) |
| T28 | ja | `eiscafe` | `stammkunden-tipps` | F01 | Was macht aus einem Gast einen Stammgast? Drei Dinge. | Rhythmus kennen, Sorte merken, sagen, wie weit er ist. Der Stand steht auf seinem Handy, in der Wallet. | A1, B2 | `tip-cards` (drei Tipps) |
| T29 | ja | `cafe` | `theke-saetze` | F02 | Schönen Tag noch. Der falsche Satz für Stammkunden. | "Bis Freitag!", "Noch drei, dann ist dein Brötchen gratis", ein Grund zum Wiederkommen. Den Stand sieht der Kunde im Handy. | A1, B2 | `tip-cards` mit `better` |
| T30 | ja | `friseur` | `einwand` | F03 | Brauchen meine Kunden dafür eine App? | Nein: einmal scannen, Karte in Apple oder Google Wallet, Stempel mit der Handy-Kamera, sofort drauf. DSGVO-konform, in Deutschland entwickelt (nur gesprochen). | A2, A3, A1, B1, B2, F1 | `comment-thread` (getippt, Antwort) |
| T31 | ja | `doener` | `einwand` | F03 | Und wer soll bei der Mittagsschlange noch stempeln? | Du, mit der Handy-Kamera: ein Scan, der Stempel ist sofort auf seinem Handy. Keine Papierkarte, die erst gesucht werden muss. | B1, B2, A4 | `comment-thread`, `wallet-pass` (Stempel) |
| T32 | ja | `cafe` | `ladentag` | F05 | Sechs Uhr. Der Ofen läuft. | Ein Tag in der Bäckerei: Stammkunde mit Scan und Stempel, eine Neue scannt einmal, Mittagsschlange ohne Papierkarte. | B1, B2, A3, A2, A4 | `day-clock` (06:00 bis 19:00) |
| T33 | ja | `doener` | `duell` | F06 | Papierkarte gegen Handy. Drei Runden. | Regen, vergessen, App: das Handy gewinnt zwei Runden, eine ist unentschieden. | A4, B1, B2, A2 | `versus-split` |
| T34 | ja | `eiscafe` | `ladentag` | F05 | Elf Uhr. Die erste Kugel des Tages. | Ein Tag in der Eisdiele: ein Scan je Besuch, der Stempel ist sofort drauf, eine Neue speichert die Karte einmal. | B1, B2, A3, A2 | `day-clock` (11:00 bis 21:00) |
| T35 | ja | `doener` | `einwand` | F09 | Für die Stempelkarte im Handy braucht dein Kunde eine App? | Stimmt nicht (A2, A3). Der Stempel kommt nicht erst morgen (B2). Zehn Stempel sind keine Pflicht (D2). Nicht nur mit Apple (A1). | A2, A3, B1, B2, D2, A1 | `comment-thread` mit `verdict` |
| T36 | ja | `friseur` | `theke-saetze` | F02 | Tschüss, bis bald. Der schwächste Satz im Salon. | "Gleiche Zeit in vier Wochen?", "Noch zwei Schnitte, dann ist einer gratis", der Name des Kunden. Den Stand sieht er im Handy. | A1, B2 | `tip-cards` mit `better` |
| T37 | ja | `eiscafe` | `studie` | F10 | Wer ist teurer: der Neue oder der Stammkunde? | Laut Harvard Business Review ist ein neuer Kunde 5- bis 25-mal so teuer wie einer, der bleibt. Kümmer dich um die, die schon da waren. | S3, A1, A4 | `big-number` ("5-25×") |
| T38 | ja | `friseur` | `duell` | F06 | Papierkarte gegen Handy, im Salon. Wer gewinnt? | Regen, vergessen, App: zwei Punkte fürs Handy, einer unentschieden. | A4, B1, B2, A2 | `versus-split` |
| T39 | ja | `cafe` | `stammkunden-tipps` | F01 | Was hält deine Stammkundin bei der Stange? Drei Dinge. | Ihren Namen kennen, ihr sagen, wie weit sie ist, den nächsten Besuch nennen. Der Stand steht auf ihrem Handy. | A1, B2 | `tip-cards` (drei Tipps) |

## Vom Thema zum Video

1. **Format wählen** (`FORMATE.md` 3): das erste erlaubte aus der Spalte
   "Formate". Kein Format, das die letzten drei Videos hatten; Nähe und
   zerknickte Papierkarte nur, wenn die letzten zwei sie nicht hatten.
2. **Takte des Formats schreiben** (`FORMATE.md` 4): Reihenfolge, Bausteine,
   Hook-Muster, Schlussfrage kommen von dort. Das "Bild der Aussage" kommt in
   den Takt, in dem das Format die Aussage hat.
3. **Stil C einhalten** (`AUTOMATIK.md` 6): 105 bis 115 Wörter, mindestens 12
   Bildwechsel, kein Bild über 5 s. Fehlt ein Bildwechsel: Kamerafahrt nach
   `AUTOMATIK.md` 6.3 oder ein weiterer Teil desselben Bilds, nie ein Takt
   aus dem alten Bogen als Füllung.

Außerdem gilt:

- Der Hook steht in der ersten Textzeile mit `"instant": true`, als eine
  Tafel mit höchstens drei Zeilen zu etwa 20 Zeichen. Ist er länger: auf zwei
  Textzeilen verteilen oder kürzen.
- Uhrzeit, Datum und Text auf Sperrbildschirm und Tagesuhr müssen
  zusammenpassen: ein Döner um 12 Uhr, ein Brötchen am Morgen, Eis am
  Nachmittag. Das Datum ohne Jahr, der Wochentag passt zum Tag (Befehl in
  `AUTOMATIK.md`, Schritt 2).
- Die Benachrichtigung zeigt die Karte mit dem **Stand** ("Noch 2 Stempel
  bis: ..."); nur bei voller Karte "... wartet auf dich" (C1). Jede andere
  Nachricht wartet (Klasse 2).
- Zahlen, die die App nicht nennt, bleiben draußen: keine Meter, keine Wochen
  bis zur Erinnerung, keine Preise im Bild (`PRODUKT.md`, N3 und N6). Auch
  der Kreis auf der Karte steht nie mit einer Zahl im Bild. Euro nur in einer
  Beispielrechnung (F04).
- Schluss: die Frage des Formats, dann "Dann kommentiere jetzt STICHWORT, und
  wir melden uns bei dir."
- Zu jedem Video gehört ein Beitragstext mit demselben Stichwort
  (`AUTOMATIK.md`, Abschnitt 6.6).

## Was die Mitbewerber stark macht und was daraus hier wird

Stand 15.11.2026, Zahlen aus Metricool, nach Likes geordnet (Kommentare zählen
nicht: sie sind durch "kommentiere CARD" aufgebläht).

| Thema beim stärksten Konto | Likes | Eigener Ansatz |
|---|---|---|
| Nachricht auf dem Sperrbildschirm, wenn man am Laden vorbeigeht | 4.635 | T02, T16, T25, nur im Format F08 und höchstens eins in drei Videos |
| Der Kunde, den du schon verloren hast, ohne es zu merken | 2.869 | T01, T15 (T22 wartet) |
| "Niemand verfolgt dich" | 1.608 | Warteliste: die Landing Page sagt dazu nichts (`PRODUKT.md`, N2) |
| Der erste Gratis-Kaffee | 878 | T11 wartet |
| Zehn Stempel sind der Grund, warum niemand die Karte vollmacht | 750 | T06, T20 |
| Zwei Läden, gleiche Leistung; Ablauf eines Tages; Einwand zuerst (Auswertung vom 16.11.2026) | bis 2.869 | Aufbau gelernt, eigene Formate: F06 (Duell), F05 (Tag), F03 (Einwand) |

Übernommen wird das Thema oder der Aufbau, nie der Text, die Bildfolge oder
der Ton eines fremden Reels.

## Warteliste: noch nicht baubar

Diese Themen sind belegt, aber es fehlt ein Bild dafür, oder der Betreiber
muss erst etwas klären. Ein unbeaufsichtigter Lauf baut sie nicht und legt
dafür auch keine Idee an.

| Thema | Beleg | Was fehlt |
|---|---|---|
| Statistik: Stoßzeiten, Neukunden, 2-Wochen-Verlauf | E1 | Baustein für eine Statistik-Ansicht (nach `src/components/StatsView.jsx`, nur was E1 nennt) |
| Newsletter mit Einwilligung | E2 | Baustein für eine Mail |
| Karte selbst gestalten (Farben, Logo, Symbol) | D1 | Baustein für den Design-Editor oder eine Karte, die die Farbe wechselt |
| Datenschutz: Double-Opt-In, Lösch-Link, Werbung nur mit Einwilligung | F1 bis F4 | Baustein (zum Beispiel ein Einwilligungs-Haken) und die Entscheidung des Betreibers, was zu "Tracking" gesagt wird. F1 geht heute nur gesprochen (F03) |
| Alles aus Klasse 2 (T07 bis T09, T11, T12, T21 bis T24; dazu Punkte- und 10er-Karte, Stufen, Bewertungen, Tarife) | `PRODUKT.md`, Klasse 2 | die Bestätigung des Betreibers |
