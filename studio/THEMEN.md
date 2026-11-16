# Stampit Studio: eigene Themen

Vorrat für Tage, an denen von den beobachteten Konten und aus dem Eingang
nichts Brauchbares kommt. Jede Zeile ist ein fertiger Ansatz für ein Video:
ein Laden, ein Blickwinkel, ein erster Satz. Wie die Liste benutzt wird, steht
in `AUTOMATIK.md` (Modus "ideen", Schritt 6, und Modus "produktion", Schritt
4). Stand: 15.11.2026.

## Regeln für diese Liste

- **Reihenfolge ist Absicht.** Die Nummern sind so gelegt, dass von Tag zu Tag
  der Laden wechselt und derselbe Blickwinkel frühestens nach 14 Tagen
  wiederkommt. Die Automatik nimmt die kleinste Nummer, die noch nicht
  verwendet ist und die Regeln erfüllt.
- **Der Hook ist ein Vorschlag.** Er darf beim Schreiben des Skripts besser
  werden, aber nie zu einer Aussage, die `PRODUKT.md` nicht deckt.
- **Nichts wiederholt das erste Video** ("Der sechste Kaffee geht aufs Haus.
  Warum eigentlich?": Café, Gratis-Kaffee als Rechnung, 6.500 Euro, Stichwort
  KARTE mit Becherreihe). Kein Thema hier beginnt mit "geht aufs Haus", keines
  rechnet vor, was der Gratis-Artikel kostet, und keines spielt im Café.
- **Jedes Thema ist mit den acht vorhandenen Bausteinen baubar.** Was einen
  neuen Baustein bräuchte, steht unten auf der Warteliste und wird von einem
  unbeaufsichtigten Lauf nicht gebaut.
- **Beleg** nennt die Zeile in `PRODUKT.md`. Ohne Beleg kein Satz über die App.
- **Verwendet** ist eine Nummer, sobald daraus eine Idee auf dem Board
  angelegt wurde. Das steht auf dem Board in `gedaechtnis/themen`, nicht in
  dieser Datei. So schlägt die Automatik dieselbe Nummer nicht zweimal vor,
  auch wenn der Betreiber die Idee gesperrt hat.
- Sind alle Nummern verwendet, beginnt die Liste von vorn: eine Nummer darf
  wiederkommen, wenn sie vor mindestens 21 Tagen verwendet wurde und nicht
  gesperrt ist, mit neuem Hook. Passt auch dann keine, nimmt der Lauf die
  Nummer mit der längsten Pause. Sind weniger als fünf Nummern unverbraucht, schreibt die Ideensuche
  das in ihre Meldung, damit die Liste in einem Chat aufgefüllt wird.

## Läden

Die vier Branchen der Landing Page (`src/pages/Landing/branchen.json`). Je
Laden ein fester Name, ein Symbol und ein Stichwort, damit Bild, Text und
Schlusszeile zusammenpassen.

| Schlüssel `branche` | Laden im Video | Name im Bild | Symbol (`icon`) | Kulisse | Stichwort |
|---|---|---|---|---|---|
| `friseur` | Friseur, Barbershop | Salon Haarscharf | `scissors` | `"mug": false` | SALON |
| `doener` | Döner, Imbiss, Pizza | Döner Palast | `star` | `"mug": false` | IMBISS |
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
An ihm hängt die Regel "nicht dasselbe Thema innerhalb von 14 Tagen".

| Schlüssel `thema` | Worum es geht | Angeregt durch |
|---|---|---|
| `sperrbildschirm` | Die volle Karte meldet sich von selbst, in der Nähe des Ladens | stärkstes Thema der Mitbewerber: die Nachricht auf dem Sperrbildschirm im Vorbeigehen |
| `verlorener-stammkunde` | Der Kunde, der fast Stammkunde war, und niemand hat es gemerkt | zweitstärkstes Thema: der Kunde, den du schon verloren hast |
| `papierkarte` | Papier wird nass, zerknickt, vergessen | eigene Beobachtung, Landing Page |
| `rechnung` | Beispielrechnung: wenige Stammkunden kommen öfter | Geschmack des Betreibers |
| `kein-download` | Einmal scannen, keine App | Landing Page |
| `stempelzahl` | Zu viele Stempel bis zur Belohnung | Thema der Mitbewerber: zehn Stempel schafft kaum jemand |
| `nachricht` | Der Laden schickt selbst eine Nachricht oder ein Tagesangebot | Landing Page |
| `rueckhol` | Wer länger nicht da war, wird erinnert | Landing Page |
| `geburtstag` | Automatische Nachricht zum Geburtstag | Landing Page |
| `team` | Stempeln mit jedem Handy, auch die Aushilfe | Landing Page |
| `willkommen` | Geschenk beim ersten Besuch | Thema der Mitbewerber: der erste Gratis-Kaffee |
| `kunde-wirbt-kunde` | Kunde wirbt Kunde, Bonus für beide | Landing Page |
| `karte-bleibt` | Die Karte bleibt auf dem Handy, auch über die Winterpause | Landing Page |
| `studie` | Eine Zahl aus einer Studie, mit Quelle | Landing Page |

## Die Themen

| Nr. | Laden | Blickwinkel | Hook (erster Satz, steht ab Bild 0) | Was das Video sagt | Beleg | Bausteine der Reihe nach |
|---|---|---|---|---|---|---|
| T01 | `friseur` | `verlorener-stammkunde` | Neun Haarschnitte bei dir. Den zehnten macht ein anderer. | Papier verrät nicht, wer kurz vor der vollen Karte stand. Die Karte im Handy meldet sich, wenn ein Kunde länger nicht da war. | C2, A1 | `paper-card` (10 Felder, 9 gestempelt), `guest-ghost` ("9 von 10 Stempeln"), `wallet-pass`, `lock-notification` (ohne Ortsnadel), `cta-comment` |
| T02 | `doener` | `sperrbildschirm` | Mittagspause. Dein Kunde geht an deinem Laden vorbei. Und sein Handy meldet sich. | Ist die Karte voll, erscheint sie von selbst auf dem Sperrbildschirm, in der Nähe des Ladens. | C1, A2 | `lock-notification` (12:07 Uhr, "10 von 10, dein Döner wartet"), `wallet-pass`, `paper-card`, `cta-comment` |
| T03 | `eiscafe` | `papierkarte` | Die Stempelkarte war in der Badetasche. Jetzt ist sie Matsch. | Papier geht kaputt oder verloren. Die Karte in der Wallet nicht. | A4, A1, A3 | `paper-card`, `wallet-vanish`, `wallet-pass`, `cta-comment` |
| T04 | `cafe` | `kein-download` | Für Brötchen lädt niemand eine App herunter. Muss auch keiner. | Der Kunde scannt einmal einen QR-Code, danach liegt die Karte in der Wallet. Kein Store, kein Download. | A2, A3, A1 | `paper-card`, `wallet-pass` (Scan und Haken), `lock-notification`, `cta-comment` |
| T05 | `friseur` | `rechnung` | 40 Stammkunden kommen zweimal mehr im Jahr. Was heißt das in Euro? | Beispielrechnung: 25 € bleiben pro Haarschnitt, mal 40 Stammkunden, mal 2 Besuche mehr im Jahr, sind 2.000 € mehr im Jahr. Die Karte ist der Grund wiederzukommen. | Beispielrechnung, C1 | `calc-panel` (25 € × 40 × 2 = 2.000 €), `wallet-pass`, `lock-notification`, `cta-comment` |
| T06 | `doener` | `stempelzahl` | Zehn Stempel bis zum Gratis-Döner. Wie viele deiner Kunden halten so lange durch? | Du legst selbst fest, wie viele Stempel es bis zur Belohnung braucht. | D2, A1 | `paper-card` (10 Felder, 3 gestempelt), `guest-ghost` ("3 von 10 Stempeln"), `wallet-pass` (6 Felder), `cta-comment`. Die Stempelzahl wechselt hier mit Absicht: die Warnung `hinweise` dazu ist gewollt |
| T07 | `eiscafe` | `nachricht` | Neue Sorte seit heute. Deine Stammkunden wissen es schon. | Du schickst deinen Kunden selbst eine Nachricht aufs Handy, oder stellst ein Tagesangebot auf die Karte. | C3, C5 | `lock-notification` ("Neu: Mango-Maracuja. Nur diese Woche.", ohne Ortsnadel), `wallet-pass`, `cta-comment` |
| T08 | `friseur` | `rueckhol` | Dein Kunde war lange nicht da. Sein Handy erinnert ihn an dich. | Wenn Kunden länger nicht da waren, meldet sich die Karte. Du musst nichts tun. | C2 | `guest-ghost` (ohne Schildchen), `lock-notification` ("Lange nicht gesehen. Zeit für einen Schnitt?", ohne Ortsnadel), `wallet-pass`, `cta-comment` |
| T09 | `cafe` | `geburtstag` | Deine Stammkundin hat heute Geburtstag. Dein Laden gratuliert von selbst. | Automatische Nachrichten, zum Beispiel zum Geburtstag. | C4 | `lock-notification` ("Alles Gute! Dein Stück Kuchen wartet.", ohne Ortsnadel), `wallet-pass`, `cta-comment` |
| T10 | `doener` | `team` | Die Schlange reicht bis zur Tür. Stempeln geht trotzdem mit einem Scan. | Das Personal scannt mit der Handy-Kamera, der Stempel ist sofort auf dem Kundenhandy. Kein eigenes Gerät nötig. | B1, B2, B3 | `wallet-pass` (Scan, drei Stempel), `paper-card`, `cta-comment` |
| T11 | `eiscafe` | `willkommen` | Ein Geschenk beim ersten Besuch. Und ein Grund für den zweiten. | Neue Kunden bekommen ein Willkommensgeschenk, sobald sie die Karte haben. | D3, A3 | `wallet-pass` (Karte fällt in die Wallet, erster Stempel), `lock-notification`, `cta-comment`. Das Geschenk im Bild ist ein Beispiel dieses Ladens |
| T12 | `friseur` | `kunde-wirbt-kunde` | Dein bester Werbekanal sitzt gerade auf deinem Stuhl. | Kunde wirbt Kunde, mit Bonus für beide. | D5 | `wallet-pass` (Stempel landet als Bonus), `guest-ghost` (der Freund, der noch fehlt, ohne Schildchen), `cta-comment` |
| T13 | `eiscafe` | `karte-bleibt` | Im Winter ist deine Eisdiele zu. Die Stempelkarte deiner Kunden bleibt. | Einmal gescannt, bleibt die Karte auf dem Handy. Im Frühling geht es weiter. | A3, A1 | `paper-card`, `wallet-vanish`, `wallet-pass`, `cta-comment` |
| T14 | `cafe` | `studie` | Ein neuer Kunde kostet dich 5- bis 25-mal so viel wie einer, der wiederkommt. | Die Zahl mit Quelle im gesprochenen Satz (Harvard Business Review). Die Karte ist der Grund wiederzukommen. | S3, C1 | `guest-ghost`, `wallet-pass`, `lock-notification`, `cta-comment` |
| T15 | `doener` | `verlorener-stammkunde` | Er kam jede Woche. Dann nicht mehr. Hast du es gemerkt? | Mit Papier merkt es niemand. Die Karte im Handy erinnert, wenn ein Kunde länger nicht da war. | C2 | `guest-ghost` ("8 von 10 Stempeln"), `wallet-vanish`, `lock-notification` (ohne Ortsnadel), `cta-comment` |
| T16 | `cafe` | `sperrbildschirm` | 07:48 Uhr, auf dem Weg zur Bahn. Dein Handy sagt: Dein Brötchen ist gratis. | Die volle Karte meldet sich von selbst, in der Nähe des Ladens. | C1 | `lock-notification` (07:48 Uhr, "8 von 8, dein Brötchen ist gratis"), `wallet-pass` (8 Felder), `cta-comment` |
| T17 | `doener` | `papierkarte` | Die Stempelkarte klebt an der Serviette. Die Serviette liegt im Müll. | Papier geht verloren. Die Karte in der Wallet bleibt. | A4, A1 | `paper-card`, `wallet-vanish`, `wallet-pass`, `cta-comment` |
| T18 | `friseur` | `kein-download` | Dein Kunde sitzt im Stuhl. Bis du fertig bist, hat er die Karte im Handy. | Einmal den QR-Code scannen, kein Store, kein Download. | A2, A3 | `wallet-pass` (Scan und Haken), `lock-notification`, `cta-comment` |
| T19 | `eiscafe` | `rechnung` | 30 Stammkunden kommen im Sommer einmal mehr pro Woche. Rechne mit. | Beispielrechnung: 4 € bleiben pro Besuch, mal 30 Stammkunden, mal 16 Wochen Saison, sind 1.920 € mehr im Sommer. | Beispielrechnung, C1 | `calc-panel` (4 € × 30 × 16 = 1.920 €), `wallet-pass`, `cta-comment` |
| T20 | `friseur` | `stempelzahl` | Ein Haarschnitt im Monat. Bis zehn Stempel voll sind, dauert das fast ein Jahr. | Die Zahl der Stempel bis zur Belohnung bestimmst du selbst. Kürzere Karten werden eher voll (als Überlegung, nicht als Zusage). | D2 | `paper-card` (10 Felder, 2 gestempelt), `wallet-pass` (5 Felder), `cta-comment`. Stempelzahl wechselt mit Absicht |
| T21 | `doener` | `nachricht` | Heute ist Lahmacun im Angebot. Wer erfährt das, bevor er Hunger hat? | Das Tagesangebot steht auf der Karte deiner Kunden. | C5, C3 | `lock-notification` ("Heute im Angebot: Lahmacun.", kein Preis im Bild, ohne Ortsnadel), `wallet-pass`, `cta-comment` |
| T22 | `cafe` | `rueckhol` | Früher kam sie jeden Morgen. Jetzt nicht mehr. Dein Laden meldet sich bei ihr. | Wenn Kunden länger nicht da waren, erinnert die Karte von selbst. | C2 | `guest-ghost` (ohne Schildchen), `lock-notification` (ohne Ortsnadel), `wallet-pass`, `cta-comment` |
| T23 | `friseur` | `geburtstag` | Dein Kunde hat heute Geburtstag. Dein Salon gratuliert, ohne dass du daran denkst. | Automatische Nachrichten, zum Beispiel zum Geburtstag. | C4 | `lock-notification` (ohne Ortsnadel), `wallet-pass`, `cta-comment` |
| T24 | `cafe` | `team` | Samstags steht die Aushilfe an der Theke. Stempeln kann sie trotzdem. | Der Scanner läuft auf jedem Handy mit Kamera, Aushilfen bekommen einen eigenen Zugang. | B3, B4, B2 | `wallet-pass` (Scan, Stempel), `paper-card`, `cta-comment` |
| T25 | `eiscafe` | `sperrbildschirm` | Die Karte ist voll. Dein Kunde erfährt es, wenn er an deiner Eisdiele vorbeikommt. | Die volle Karte meldet sich auf dem Sperrbildschirm, in der Nähe des Ladens. | C1 | `wallet-pass` (letzter Stempel), `lock-notification` ("10 von 10, deine Kugel wartet"), `cta-comment` |
| T26 | `cafe` | `papierkarte` | Fünf Stempelkarten im Portemonnaie. Wann war zuletzt eine voll? | Papierkarten werden vergessen. Die Karte in der Wallet meldet sich, wenn sie voll ist. | A4, C1 | `wallet-vanish`, `guest-ghost`, `wallet-pass`, `lock-notification`, `cta-comment` |
| T27 | `eiscafe` | `kein-download` | Eine Kugel Eis und dafür eine App laden? Macht keiner. | Keine App, kein Download: einmal scannen genügt. Wer mag, nennt dazu die Studienzahl S5 mit ihrer Einschränkung. | A2, A3, wahlweise S5 | `wallet-pass` (Scan und Haken), `paper-card`, `cta-comment` |

## Was beim Ausarbeiten gilt

- Der Hook steht in der ersten Textzeile mit `"instant": true`. Er ist in den
  meisten Fällen länger als eine Textzeile fasst (höchstens drei Zeilen zu
  etwa 20 Zeichen): dann auf zwei Textzeilen verteilen oder kürzen.
- Uhrzeit, Datum und Text der Benachrichtigung müssen zusammenpassen: ein
  Döner um 12 Uhr, ein Brötchen am Morgen. Das Datum ohne Jahr, der Wochentag
  muss zum Tag passen (Befehl dafür in `AUTOMATIK.md`).
- Die Ortsnadel (`"pin": true`) nur, wenn der Satz von der Nähe des Ladens
  handelt (C1 und der Auslöser "In der Nähe des Ladens" aus C2). Bei
  Geburtstag, Tagesangebot und Erinnerung nach langer Pause: `"pin": false`.
- Zahlen, die die App nicht nennt, bleiben draußen: keine Meter, keine Wochen
  bis zur Erinnerung, keine Preise im Bild (`PRODUKT.md`, N3 und N6).
- Schluss immer nach dem Muster des Betreibers: kurze Frage, dann "Dann
  kommentiere jetzt STICHWORT, und wir melden uns bei dir."

## Was die Mitbewerber stark macht und was daraus hier wird

Stand 15.11.2026, Zahlen aus Metricool, nach Likes geordnet (Kommentare zählen
nicht: sie sind durch "kommentiere CARD" aufgebläht).

| Thema beim stärksten Konto | Likes | Eigener Ansatz |
|---|---|---|
| Nachricht auf dem Sperrbildschirm, wenn man am Laden vorbeigeht | 4.635 | T02, T16, T25 |
| Der Kunde, den du schon verloren hast, ohne es zu merken | 2.869 | T01, T15, T22 |
| "Niemand verfolgt dich" | 1.608 | Warteliste: die Landing Page sagt dazu nichts (`PRODUKT.md`, N2) |
| Der erste Gratis-Kaffee | 878 | T11 |
| Zehn Stempel sind der Grund, warum niemand die Karte vollmacht | 750 | T06, T20 |

Übernommen wird das Thema, nie der Text, die Bildfolge oder der Ton eines
fremden Reels.

## Warteliste: noch nicht baubar

Diese Themen sind belegt, aber es fehlt ein Bild dafür, oder der Betreiber
muss erst etwas klären. Ein unbeaufsichtigter Lauf baut sie nicht und legt
dafür auch keine Idee an.

| Thema | Beleg | Was fehlt |
|---|---|---|
| Statistik: Stoßzeiten, Neukunden, 2-Wochen-Verlauf | E1 | Baustein für eine Statistik-Ansicht |
| Newsletter mit Einwilligung | E2 | Baustein für eine Mail |
| Karte selbst gestalten (Farben, Logo, Symbol) | D1 | Baustein für den Design-Editor |
| Datenschutz: Double-Opt-In, Lösch-Link, Werbung nur mit Einwilligung | F1 bis F4 | Baustein (zum Beispiel ein Einwilligungs-Haken) und die Entscheidung des Betreibers, was zu "Tracking" gesagt wird |
| Punkte-, Mitglieds- und 10er-Karte | A5 | Die Landing Page nennt nur die Namen; erst klären, was gezeigt werden darf |
| Google-Bewertungen | E3 | Baustein, und was die Funktion genau tut |
| Stufen für Stammkunden | D4 | Baustein |
| Eine Zahl groß im Bild (Studien S1, S2, S4) | S1, S2, S4 | Tafel für eine einzelne Zahl; `calc-panel` rechnet nach und passt nur für Produkte |
| Testen und Tarife | G1 bis G8 | Nach Textregel 6 nicht im Bild; kein Thema für die täglichen Videos |
