# Stampit Studio: eigene Themen

Vorrat für Tage, an denen von den beobachteten Konten und aus dem Eingang
nichts Brauchbares kommt. Jede Zeile ist ein Ansatz für ein Video: ein Laden,
ein Blickwinkel, ein erster Satz. Wie die Liste benutzt wird, steht in
`AUTOMATIK.md`, Abschnitt 5 ("Eine Nummer aus `THEMEN.md`"). Stand:
16.11.2026 (Abschnitt "Vom Kern zum Video" auf Stil C umgestellt; T05 und T19
warten auf eine Probe von `calc-panel` in Stil C).

## Regeln für diese Liste

- **Spalte "Version 1".** "ja" heißt: jede Aussage des Themas steht in
  `PRODUKT.md` in Klasse 1 (gesichert). "wartet" heißt: das Thema braucht eine
  Aussage aus Klasse 2 (nur im Tarifvergleich genannt, vom Betreiber noch
  nicht bestätigt). Ein unbeaufsichtigter Lauf baut wartende Themen nicht und
  legt dafür keine Idee an. Bestätigt der Betreiber die Funktion, setzt eine
  begleitete Sitzung die Zeile auf "ja". "wartet (Stil C)" heißt: das Thema
  braucht `calc-panel`, und eine Rechnung ist in Stil C noch nicht gebaut
  (`AUTOMATIK.md`, 6.4). Hat eine begleitete Sitzung das erprobt, gehen T05
  und T19 wieder auf "ja". Heute sind **16 von 27** Themen benutzbar.
- **Reihenfolge ist Absicht.** Die Nummern sind so gelegt, dass von Tag zu Tag
  meist der Laden wechselt und derselbe Blickwinkel in der Regel frühestens
  nach sieben Tagen wiederkommt. Gegen Ende der Liste (T25 bis T27) können es
  fünf Tage sein. Die genaue Regel der Auswahl steht in `AUTOMATIK.md`,
  Abschnitt 5; sie findet immer ein Thema, solange eines benutzbar und nicht
  gesperrt ist.
- **Der Hook ist ein Vorschlag.** Er darf beim Schreiben des Skripts besser
  werden, aber nie zu einer Aussage, die `PRODUKT.md` in Klasse 1 nicht
  deckt.
- **Nichts wiederholt das erste Video** ("Der sechste Kaffee geht aufs Haus.
  Warum eigentlich?": Café, Gratis-Kaffee als Rechnung, 6.500 Euro, Stichwort
  KARTE mit Becherreihe). Kein Thema hier beginnt mit "geht aufs Haus", keines
  rechnet vor, was der Gratis-Artikel kostet, und keines spielt im Café.
- **Nichts kopiert ein Vorbild.** Aufbau und Handwerk dürfen gelernt werden
  (Playbook, "Erkenntnisse"). Wortlaut, Bilder und erfundene Läden fremder
  Videos nie, auch nicht deren erste Sätze.
- **Jedes Thema ist mit den vorhandenen Bausteinen baubar** (acht aus dem
  ersten Video, dazu `shop-street`, `shop-map` und `stamp-check` aus dem
  zweiten). Was einen neuen Baustein bräuchte, steht unten auf der Warteliste.
- **Beleg** nennt die Zeile in `PRODUKT.md`. Ohne Beleg kein Satz über die App.
- **Verwendet** ist eine Nummer, sobald daraus eine Idee auf dem Board
  angelegt wurde. Das steht auf dem Board in `gedaechtnis/themen`, nicht in
  dieser Datei. Sind alle benutzbaren Nummern verwendet, beginnt die Liste
  von vorn, mit neuen ersten Sätzen.

## Läden

Die vier Branchen der Landing Page (`src/pages/Landing/branchen.json`). Je
Laden ein fester Name, ein Symbol und ein Stichwort, damit Bild, Text und
Schlusszeile zusammenpassen. Jedes Video erzählt von **einem** dieser Läden.

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
An ihm hängt die Regel "nicht dasselbe Thema innerhalb von sieben Tagen".

| Schlüssel `thema` | Worum es geht | Version 1 | Angeregt durch |
|---|---|---|---|
| `sperrbildschirm` | In der Nähe des Ladens erscheint die Karte von selbst auf dem Sperrbildschirm, mit dem Stand (voll: die Belohnung wartet) | ja | stärkstes Thema der Mitbewerber |
| `verlorener-stammkunde` | Der Kunde, der fast Stammkunde war: mit Papier merkt es niemand | ja | zweitstärkstes Thema der Mitbewerber |
| `papierkarte` | Papier wird nass, zerknickt, vergessen | ja | eigene Beobachtung, Landing Page |
| `rechnung` | Beispielrechnung: wenige Stammkunden kommen öfter | wartet (Stil C) | Geschmack des Betreibers |
| `kein-download` | Einmal scannen, keine App | ja | Landing Page |
| `stempelzahl` | Zu viele Stempel bis zur Belohnung | ja | Thema der Mitbewerber |
| `team` | Stempeln geht mit einem Scan der Handy-Kamera | ja (nur so; "auch die Aushilfe" wartet) | Landing Page |
| `karte-bleibt` | Die Karte bleibt auf dem Handy, auch über die Winterpause | ja | Landing Page |
| `studie` | Eine Zahl aus einer Studie, mit Quelle | ja | Landing Page |
| `nachricht` | Der Laden schickt selbst eine Nachricht oder ein Tagesangebot | wartet (C3, C5) | Tarifvergleich |
| `rueckhol` | Wer länger nicht da war, wird erinnert | wartet (C2) | Tarifvergleich |
| `geburtstag` | Automatische Nachricht zum Geburtstag | wartet (C4) | Tarifvergleich |
| `willkommen` | Willkommensgeschenk für neue Kunden | wartet (D3) | Thema der Mitbewerber |
| `kunde-wirbt-kunde` | Kunde wirbt Kunde, Bonus für beide | wartet (D5) | Tarifvergleich |

## Die Themen

Die Spalte "Kern" nennt die Bilder, ohne die das Thema nicht auskommt, der
Reihe nach. Das ist das Mindeste, nicht das ganze Video: wie daraus
mindestens zwölf Bildwechsel im Stil C werden, steht im nächsten Abschnitt.

| Nr. | Version 1 | Laden | Blickwinkel | Hook (erster Satz, steht ab Bild 0) | Was das Video sagt | Beleg | Kern |
|---|---|---|---|---|---|---|---|
| T01 | ja | `friseur` | `verlorener-stammkunde` | Neun Haarschnitte bei dir. Den zehnten macht ein anderer. | Die Papierkarte lag zerknickt im Portemonnaie, und niemand hat gemerkt, wie nah er dran war. In der Wallet geht die Karte nicht verloren, und ist sie voll, meldet sie sich von selbst. | A4, A3, C1 | `paper-card` (10 Felder, 9 gestempelt), `guest-ghost` ("9 von 10 Stempeln"), `wallet-vanish`, `wallet-pass`, `lock-notification`, `cta-comment` |
| T02 | ja | `doener` | `sperrbildschirm` | Mittagspause. Dein Kunde geht an deinem Laden vorbei. Und sein Handy meldet sich. | In der Nähe des Ladens erscheint die Karte von selbst auf dem Sperrbildschirm, mit dem Stand. | C1, A2 | `lock-notification` (12:07 Uhr, "Noch 2 Stempel bis: Gratis-Döner"), `wallet-pass`, `paper-card`, `cta-comment` |
| T03 | ja | `eiscafe` | `papierkarte` | Die Stempelkarte war in der Badetasche. Jetzt ist sie Matsch. | Papier geht kaputt oder verloren. Die Karte in der Wallet nicht. | A4, A1, A3 | `paper-card`, `wallet-vanish`, `wallet-pass`, `cta-comment` |
| T04 | ja | `cafe` | `kein-download` | Für Brötchen lädt niemand eine App herunter. Muss auch keiner. | Der Kunde scannt einmal einen QR-Code, danach liegt die Karte in der Wallet. Kein Store, kein Download. | A2, A3, A1, C1 | `paper-card`, `wallet-pass` (Scan und Haken), `lock-notification`, `cta-comment` |
| T05 | wartet (Stil C) | `friseur` | `rechnung` | 40 Stammkunden kommen zweimal mehr im Jahr. Was heißt das in Euro? | Beispielrechnung: 25 € bleiben pro Haarschnitt, mal 40 Stammkunden, mal 2 Besuche mehr im Jahr, sind 2.000 € mehr im Jahr. Die volle Karte meldet sich von selbst, in der Nähe deines Ladens: ein Anlass mehr hereinzukommen. | Beispielrechnung, C1 | `calc-panel` (25 € × 40 × 2 = 2.000 €), `wallet-pass`, `lock-notification`, `cta-comment` |
| T06 | ja | `doener` | `stempelzahl` | Zehn Stempel bis zum Gratis-Döner. Wie viele deiner Kunden halten so lange durch? | Du legst selbst fest, wie viele Stempel es bis zur Belohnung braucht. | D2, A1 | `paper-card` (10 Felder, 3 gestempelt), `guest-ghost` ("3 von 10 Stempeln"), `wallet-pass` (6 Felder), `cta-comment`. Die Stempelzahl wechselt hier mit Absicht: die Warnung `hinweise` dazu ist gewollt |
| T07 | wartet (C3, C5) | `eiscafe` | `nachricht` | Neue Sorte seit heute. Deine Stammkunden wissen es schon. | Du schickst deinen Kunden selbst eine Nachricht aufs Handy, oder stellst ein Tagesangebot auf die Karte. | C3, C5 | `lock-notification` (ohne Ortsnadel), `wallet-pass`, `cta-comment` |
| T08 | wartet (C2) | `friseur` | `rueckhol` | Dein Kunde war lange nicht da. Sein Handy erinnert ihn an dich. | Wenn Kunden länger nicht da waren, meldet sich die Karte. | C2 | `guest-ghost`, `lock-notification` (ohne Ortsnadel), `wallet-pass`, `cta-comment` |
| T09 | wartet (C4) | `cafe` | `geburtstag` | Deine Stammkundin hat heute Geburtstag. Dein Laden gratuliert von selbst. | Automatische Nachrichten, zum Beispiel zum Geburtstag. | C4 | `lock-notification` (ohne Ortsnadel), `wallet-pass`, `cta-comment` |
| T10 | ja | `doener` | `team` | Die Schlange reicht bis zur Tür. Stempeln geht trotzdem mit einem Scan. | Das Personal scannt mit der Handy-Kamera, der Stempel ist sofort auf dem Kundenhandy. Kein Stempelkissen, kein Suchen nach der Karte. | B1, B2, A4 | `paper-card`, `wallet-pass` (Scan, drei Stempel), `cta-comment` |
| T11 | wartet (D3) | `eiscafe` | `willkommen` | Ein Geschenk für neue Kunden. Und ein Grund für den zweiten Besuch. | Neue Kunden bekommen ein Willkommensgeschenk. | D3, A3 | `wallet-pass`, `lock-notification`, `cta-comment` |
| T12 | wartet (D5) | `friseur` | `kunde-wirbt-kunde` | Dein bester Werbekanal sitzt gerade auf deinem Stuhl. | Kunde wirbt Kunde, mit Bonus für beide. | D5 | `wallet-pass`, `guest-ghost`, `cta-comment` |
| T13 | ja | `eiscafe` | `karte-bleibt` | Im Winter ist deine Eisdiele zu. Die Stempelkarte deiner Kunden bleibt. | Einmal gescannt, bleibt die Karte auf dem Handy. Im Frühling geht es weiter. | A3, A1 | `paper-card`, `wallet-vanish`, `wallet-pass`, `cta-comment` |
| T14 | ja | `cafe` | `studie` | Ein neuer Kunde kostet dich 5- bis 25-mal so viel wie einer, der wiederkommt. | Die Zahl mit Quelle im gesprochenen Satz (Harvard Business Review). Die volle Karte meldet sich von selbst und gibt einen Grund wiederzukommen. | S3, C1 | `guest-ghost`, `wallet-pass`, `lock-notification`, `cta-comment` |
| T15 | ja | `doener` | `verlorener-stammkunde` | Er kam jede Woche. Dann nicht mehr. Hast du es gemerkt? | Mit Papier merkt es niemand: die Karte ist weg, und mit ihr der Anlass zu kommen. In der Wallet bleibt sie, und ist sie voll, meldet sie sich in der Nähe deines Ladens. | A4, A3, C1 | `guest-ghost` ("8 von 10 Stempeln"), `wallet-vanish`, `wallet-pass`, `lock-notification`, `cta-comment` |
| T16 | ja | `cafe` | `sperrbildschirm` | 07:48 Uhr, auf dem Weg zur Bahn. Dein Handy sagt: Dein Brötchen ist gratis. | Die volle Karte meldet sich von selbst, in der Nähe des Ladens. | C1 | `lock-notification` (07:48 Uhr, "8 von 8, dein Brötchen ist gratis"), `wallet-pass` (8 Felder), `cta-comment` |
| T17 | ja | `doener` | `papierkarte` | Die Stempelkarte klebt an der Serviette. Die Serviette liegt im Müll. | Papier geht verloren. Die Karte in der Wallet bleibt. | A4, A1 | `paper-card`, `wallet-vanish`, `wallet-pass`, `cta-comment` |
| T18 | ja | `friseur` | `kein-download` | Dein Kunde sitzt im Stuhl. Bis du fertig bist, hat er die Karte im Handy. | Einmal den QR-Code scannen, kein Store, kein Download. | A2, A3, C1 | `wallet-pass` (Scan und Haken), `lock-notification`, `cta-comment` |
| T19 | wartet (Stil C) | `eiscafe` | `rechnung` | 30 Stammkunden kommen im Sommer einmal mehr pro Woche. Rechne mit. | Beispielrechnung: 4 € bleiben pro Besuch, mal 30 Stammkunden, mal 16 Wochen Saison, sind 1.920 € mehr im Sommer. | Beispielrechnung, C1 | `calc-panel` (4 € × 30 × 16 = 1.920 €), `wallet-pass`, `lock-notification`, `cta-comment` |
| T20 | ja | `friseur` | `stempelzahl` | Ein Haarschnitt im Monat. Bis zehn Stempel voll sind, dauert das fast ein Jahr. | Die Zahl der Stempel bis zur Belohnung bestimmst du selbst. Kürzere Karten werden eher voll (als Überlegung, nicht als Zusage). | D2 | `paper-card` (10 Felder, 2 gestempelt), `wallet-pass` (5 Felder), `cta-comment`. Stempelzahl wechselt mit Absicht |
| T21 | wartet (C5, C3) | `doener` | `nachricht` | Heute ist Lahmacun im Angebot. Wer erfährt das, bevor er Hunger hat? | Das Tagesangebot steht auf der Karte deiner Kunden. | C5, C3 | `lock-notification` (ohne Ortsnadel), `wallet-pass`, `cta-comment` |
| T22 | wartet (C2) | `cafe` | `rueckhol` | Früher kam sie jeden Morgen. Jetzt nicht mehr. Dein Laden meldet sich bei ihr. | Wenn Kunden länger nicht da waren, erinnert die Karte von selbst. | C2 | `guest-ghost`, `lock-notification` (ohne Ortsnadel), `wallet-pass`, `cta-comment` |
| T23 | wartet (C4) | `friseur` | `geburtstag` | Dein Kunde hat heute Geburtstag. Dein Salon gratuliert, ohne dass du daran denkst. | Automatische Nachrichten, zum Beispiel zum Geburtstag. | C4 | `lock-notification` (ohne Ortsnadel), `wallet-pass`, `cta-comment` |
| T24 | wartet (B3, B4) | `cafe` | `team` | Samstags steht die Aushilfe an der Theke. Stempeln kann sie trotzdem. | Der Scanner läuft auf jedem Handy mit Kamera, es gibt Zugänge für Mitarbeiter und Aushilfen. | B3, B4, B2 | `wallet-pass` (Scan, Stempel), `paper-card`, `cta-comment` |
| T25 | ja | `eiscafe` | `sperrbildschirm` | Die Karte ist voll. Dein Kunde erfährt es, wenn er an deiner Eisdiele vorbeikommt. | Die volle Karte meldet sich auf dem Sperrbildschirm, in der Nähe des Ladens. | C1 | `wallet-pass` (letzter Stempel), `lock-notification` ("10 von 10, deine Kugel wartet"), `cta-comment` |
| T26 | ja | `cafe` | `papierkarte` | Fünf Stempelkarten im Portemonnaie. Wann war zuletzt eine voll? | Papierkarten werden vergessen. Die Karte in der Wallet meldet sich, wenn sie voll ist. | A4, C1 | `wallet-vanish`, `guest-ghost`, `wallet-pass`, `lock-notification`, `cta-comment` |
| T27 | ja | `eiscafe` | `kein-download` | Eine Kugel Eis und dafür eine App laden? Macht keiner. | Keine App, kein Download: einmal scannen genügt. Wer mag, nennt dazu die Studienzahl S5 mit ihrer Einschränkung. | A2, A3, wahlweise S5 | `wallet-pass` (Scan und Haken), `paper-card`, `cta-comment` |

## Vom Kern zum Video

Jedes neue Video entsteht im **Stil C** (`AUTOMATIK.md`, Abschnitt 6; Vorbild
`videos/2026-11-16-ist-das-koscher`): 105 bis 115 Wörter, fertig rund 40 bis
45 Sekunden, **mindestens 12 Bildwechsel, kein Bild länger als 5 Sekunden**.
Ein Bildwechsel ist jede Szene, jeder Teil (`parts`, meist mit hartem
Schnitt) und jede Kamerafahrt. Der Kern eines Themas hat drei bis sechs
Bilder; daraus werden 5 bis 7 Szenen mit je 1 bis 3 Teilen. Jedes Bild
bekommt eine eigene kurze Textzeile, und jede ist durch den genannten Beleg
gedeckt.

Die Spalte "Kern" nennt Bausteine des ersten Videos. In Stil C gilt dazu:

| Im Kern steht | So wird es in Stil C gebaut |
|---|---|
| `lock-notification` (Karte in Ladennähe, C1; Text mit dem Stand, nur bei voller Karte "wartet auf dich") | als Schnitt direkt nach dem Bild für "in der Nähe" (nächste Zeile). Als Einstieg (`"rise": false`, `"buzzes": 2`, `"waves": true`) nur, wenn der Hook vom Handy, vom Sperrbildschirm oder von der vollen Karte spricht (T02, T16, T25). Spricht er vom Papier oder von einem fast verlorenen Kunden (T01, T03, T15 und ähnliche), ist das Bild dazu der Einstieg: unter "Den zehnten macht ein anderer" steht kein Sperrbildschirm mit "10 von 10". `"pin": false`: die Nähe zeigt die Karte von oben |
| jeder Satz über "in der Nähe", "vorbeigehen", "an deinem Laden" (C1) | **`shop-map`**, die Karte von oben: die Kundin geht eine Straße hinter dem Laden, tritt in den Kreis, ihr Handy meldet sich weit weg von der Ortsnadel. Für "unterwegs" davor `shop-street` mit `"across": true` (andere Straßenseite). Nie eine Figur an der Ladentür: man muss nicht vor dem Laden stehen. Der Blick des Ladens ("Du stehst auf dem Sperrbildschirm deiner Stammkunden"): `lock-notification`, nie `shop-map` mit `"view": "owner"` (das zeigte, wo die Kunden sind, `PRODUKT.md` N2) |
| `paper-card`, `wallet-vanish`, `guest-ghost` (A4) | eine Szene aus zwei oder drei Teilen, Schlag auf Schlag mit `"enter": "cut"`. Keiner hat einen erprobten Kamerawert: je Bild höchstens zehn Wörter (mit zwei Textzeilen neun), mehr Text kommt auf den nächsten dieser drei (`AUTOMATIK.md`, 6.3) |
| `wallet-pass` (A1 bis A3, B1, B2) | eine Szene aus zwei Teilen: Karte und Scan mit Kamera auf den QR-Code, dann Schnitt auf denselben Pass, auf dem ein Stempel landet |
| die Aussage, um die es geht | als Pointe in einem eigenen Satz mit `stamp-check`, als eigene Szene oder als Teil mit Schnitt |
| `calc-panel` (Beispielrechnung) | in Stil C noch nicht gebaut: die Tafel stünde rund 10 s ohne Bildwechsel. Deshalb warten T05 und T19, bis eine begleitete Sitzung es erprobt hat |
| `cta-comment` | unverändert, Schlussfrage mit `"mode": "zeile"` |

Aufgefüllt wird in dieser Reihenfolge, bis 12 Bildwechsel erreicht sind:

1. **Die Nähe zeigen** (`shop-street` mit `across`, `shop-map`), sobald das
   Thema C1 berührt. Das ist das stärkste Bild der Reihe.
2. **Die Seite mit dem Papier ausspielen.** `paper-card`, `wallet-vanish`
   und `guest-ghost` sind drei Bilder für dieselbe Aussage: Papier geht
   verloren, und niemand merkt es (A4).
3. **`wallet-pass` in zwei Teilen** (Scan, dann Stempel).
4. **Kamerafahrten** in Teilen, deren Textzeile länger als etwa drei
   Sekunden spricht (Werte in `AUTOMATIK.md`, Abschnitt 6.3).
5. **Reicht es dann noch nicht:** lieber eine Textzeile mehr in einem
   vorhandenen Bild als ein Bild ohne Aussage.

Die Geschichte bleibt bei **einem** Laden und läuft in einer Linie: der
Moment (Hook), was mit Papier schiefgeht, die Pointe, die Karte im Handy, was
sie von selbst tut, die Frage am Schluss. Im Mittelpunkt steht die eine
Aussage des Themas; die anderen sind kurze Stationen auf dem Weg dorthin,
keine Aufzählung. `calc-panel` kommt nur in Themen mit Beispielrechnung vor.
Ein Muster ist die Vorlage (`videos/_vorlage/script.json`, Bäckerei); am
16.11.2026 wurde T02 nach diesem Abschnitt probehalber als Entwurf gebaut
(15 Bildwechsel, längstes Bild 4,8 s geschätzt).

Außerdem gilt:

- Der Hook steht in der ersten Textzeile mit `"instant": true`, als eine
  Tafel mit höchstens drei Zeilen zu etwa 20 Zeichen. Ist er länger: auf zwei
  Textzeilen verteilen oder kürzen.
- Uhrzeit, Datum und Text der Benachrichtigung müssen zusammenpassen: ein
  Döner um 12 Uhr, ein Brötchen am Morgen. Das Datum ohne Jahr, der Wochentag
  muss zum Tag passen (Befehl dafür in `AUTOMATIK.md`, Schritt 2).
- Die Benachrichtigung zeigt in Version 1 immer die **volle** Karte (C1).
  Jede andere Nachricht wartet (Klasse 2).
- Zahlen, die die App nicht nennt, bleiben draußen: keine Meter, keine Wochen
  bis zur Erinnerung, keine Preise im Bild (`PRODUKT.md`, N3 und N6). Auch
  der Kreis auf der Karte steht nie mit einer Zahl im Bild.
- Schluss immer nach dem Muster des Betreibers: kurze Frage, dann "Dann
  kommentiere jetzt STICHWORT, und wir melden uns bei dir."
- Zu jedem Video gehört ein Beitragstext mit demselben Stichwort
  (`AUTOMATIK.md`, Abschnitt 6.6).

## Was die Mitbewerber stark macht und was daraus hier wird

Stand 15.11.2026, Zahlen aus Metricool, nach Likes geordnet (Kommentare zählen
nicht: sie sind durch "kommentiere CARD" aufgebläht).

| Thema beim stärksten Konto | Likes | Eigener Ansatz |
|---|---|---|
| Nachricht auf dem Sperrbildschirm, wenn man am Laden vorbeigeht | 4.635 | T02, T16, T25 |
| Der Kunde, den du schon verloren hast, ohne es zu merken | 2.869 | T01, T15 (T22 wartet) |
| "Niemand verfolgt dich" | 1.608 | Warteliste: die Landing Page sagt dazu nichts (`PRODUKT.md`, N2) |
| Der erste Gratis-Kaffee | 878 | T11 wartet |
| Zehn Stempel sind der Grund, warum niemand die Karte vollmacht | 750 | T06, T20 |

Übernommen wird das Thema, nie der Text, die Bildfolge oder der Ton eines
fremden Reels.

## Warteliste: noch nicht baubar

Diese Themen sind belegt, aber es fehlt ein Bild dafür, oder der Betreiber
muss erst etwas klären. Ein unbeaufsichtigter Lauf baut sie nicht und legt
dafür auch keine Idee an.

| Thema | Beleg | Was fehlt |
|---|---|---|
| Beispielrechnung in Stil C (T05, T19) | Beispielrechnung, C1 | eine Probe von `calc-panel` in Stil C (Kamera auf die Zeilen oder Schnitte), in einer begleiteten Sitzung |
| Statistik: Stoßzeiten, Neukunden, 2-Wochen-Verlauf | E1 | Baustein für eine Statistik-Ansicht |
| Newsletter mit Einwilligung | E2 | Baustein für eine Mail |
| Karte selbst gestalten (Farben, Logo, Symbol) | D1 | Baustein für den Design-Editor |
| Datenschutz: Double-Opt-In, Lösch-Link, Werbung nur mit Einwilligung | F1 bis F4 | Baustein (zum Beispiel ein Einwilligungs-Haken) und die Entscheidung des Betreibers, was zu "Tracking" gesagt wird |
| Eine Zahl groß im Bild (Studien S1, S2, S4) | S1, S2, S4 | Tafel für eine einzelne Zahl; `calc-panel` rechnet nach und passt nur für Produkte |
| Alles aus Klasse 2 (T07 bis T09, T11, T12, T21 bis T24; dazu Punkte- und 10er-Karte, Stufen, Bewertungen, Tarife) | `PRODUKT.md`, Klasse 2 | die Bestätigung des Betreibers |
