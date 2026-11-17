# Hooks und Memes: Regelwerk für den ersten Satz

**Eingebunden am 16.11.2026.** Der unbeaufsichtigte Lauf liest diese Datei
ganz, bevor er in Schritt 15 (`AUTOMATIK.md`) die erste Textzeile schreibt
und entscheidet, ob das Video ein Meme trägt. Sie ersetzt keine Regel aus
`AUTOMATIK.md`, `PRODUKT.md`, `THEMEN.md` oder `PLAYBOOK.md`; wo sie
abweicht, gelten die. Was die Daten dahinter sind: `docs/hooks-daten.md` und
`docs/memes-recherche.md`.

Grundlage: 114 Reels von vier Mitbewerbern aus Metricool (17.09. bis
16.11.2026), 12 Videos von taggt_, unser eines Reel mit Zahlen, und eine
Prüfung von 40 Meme-Formaten (Recherche `docs/hooks-daten.md` und `docs/memes-recherche.md`,
16.11.2026). **Vorbehalte:** Der "Hook" der Mitbewerber ist die erste Zeile
ihrer Caption, nicht sicher der erste gesprochene Satz. Je Muster 2 bis 17
Reels: Richtwerte, keine Statistik. Ob deutsche Meme-Zeilen bei uns tragen,
ist **ungemessen** (das Koscher-Video hat noch keine Zahlen).

Wörter: **Treffer** = Reel mit mindestens dem 5-fachen Median seines Kontos.
**×** = Likes geteilt durch den Median des Kontos. **Tafel** = die Textzeile
oben im Bild (Stil C). **Lauf** = der unbeaufsichtigte tägliche Lauf.

---

## 0. Ablauf für den Lauf

1. Idee, Laden, Blickwinkel und **Format** stehen (`AUTOMATIK.md`, Abschnitt 5;
   `FORMATE.md` 3).
2. **Meme-Tag?** Nach 4.1 entscheiden. Wenn ja: Meme nach 4.2 wählen.
3. **Hook-Muster** wählen: zuerst das Muster des Formats (`FORMATE.md` 4,
   Zeile "Hook"), sonst Tabelle 1.3 (passt zum Blickwinkel); Muster in
   Abschnitt 2. Fertige Zeilen für `THEMEN.md` stehen in Abschnitt 5 und in
   der Spalte "Hook" von `THEMEN.md`.
4. Erste Textzeile schreiben nach 1.2 und 1.4, gegen 1.5 halten.
5. Prüfliste 1.6 abhaken, mit ihren Ausnahmen. Ein Punkt nicht erfüllt: Satz
   neu schreiben.
6. In `meta` notieren: `hook_muster` (z. B. `"H02"`), `meme` (z. B. `"M23"`
   oder `""`), dazu wie immer `beleg`.
7. Beim Entwurf `--stills 0,1,3` bauen und Bild 0 ansehen (1.6, letzter
   Punkt).

---

## 1. Die ersten drei Sekunden

### 1.1 Ausgangslage

- Unser Reel "Zwei Läden, dieselbe Straße ..." (15.11.): 169 Aufrufe,
  139 erreicht, 3 Likes, Ø Wiedergabe 9,0 s, **Skip-Rate 59,7 %** (Anteil,
  der in den ersten 3 s wegwischt). Das ist der Wert, der sinken soll.
- TikTok nennt: über 63 % der Videos mit der höchsten Klickrate zeigen ihre
  Kernbotschaft in den ersten 3 s (Methode nicht veröffentlicht).
- Instagram-Chef Mosseri (Januar 2025, zweite Hand): wichtigste Signale sind
  Wiedergabezeit, Likes je Reichweite und **Sends je Reichweite**.
- In 3 s sagt Liam (Tempo 1,05, rund 170 Wörter je Minute, Einsatz nach
  0,35 s) etwa **7 bis 8 Wörter**.

### 1.2 Pflicht ab Bild 0

| Was | So im Skript | Warum |
|---|---|---|
| Hook steht als Tafel ab Bild 0 | erste Textzeile mit `"instant": true`; höchstens 3 Zeilen zu rund 20 Zeichen, `"scale": 1.2` nur bei höchstens 2 Zeilen | Stil C; das Titelbild (`poster.png`) ist dann genau diese Tafel |
| Hook wird sofort gesprochen | die erste Textzeile **ist** der erste Satz; kein "Hallo", kein "In diesem Video", kein Logo, kein Vorspann | Einsatz nach 0,35 s, Kernbotschaft in den 3 s |
| Das Bild sagt das Thema sofort | erstes Bild nach Tabelle 1.3; es steht ab Bild 0 (beim Handy `"rise": false`) | wer ohne Ton schaut, muss am Bild sehen, worum es geht |
| Bruch im ersten halben Satz | Bewegung mit Ton in den ersten 0,5 s. **Erprobt:** Meldung auf dem Sperrbildschirm (`lock-notification`, Anker `notify` `{ "at": "start", "offset": 0.15 }`, `"buzzes": 2`, `"waves": true`, Werte aus `AUTOMATIK.md` 6.4) und Stempelschlag (`paper-card`, `hit` `{ "at": "start", "offset": 0.4 }`, so im Entwurf zu T01). **Nicht erprobt als Einstieg:** Knick (`wallet-vanish`, `crumple`), Schildchen (`guest-ghost`, `chip`) und `wallet-pass`. Dann Standbild bei 0 s und 1 s ansehen (0, Schritt 7); steht dort etwas halb, mit `paper-card` beginnen | ein stehendes Bild mit Text wirkt wie eine Anzeige |
| Erster Bildwechsel früh | Kamera oder Schnitt auf das **erste Wort der zweiten Textzeile** (Koscher-Video: Kamera bei 1,95 s, Schnitt bei 2,93 s). Kamera nur mit Werten aus `AUTOMATIK.md`, 6.3; gibt es für den Baustein keine, ein Schnitt | danach gilt `pace` wie immer |
| Reibung zwischen Tafel und Bild, wo es passt | die Tafel sagt das Gegenteil dessen, was das Bild zeigt ("ohne Stempelkissen" über einem Stempel, der auf Papier knallt) | Neugier ohne Behauptung |

### 1.3 Erstes Bild und Muster je Blickwinkel

**Das Format geht vor** (seit 17.11.2026): Bild 0 ist der Einstieg des Formats
(`FORMATE.md` 4) und nicht der Einstieg eines der letzten zwei Videos
(`FORMATE.md`, V4). Die Spalte "Bild ab Bild 0" gilt, wo das Format die Wahl
lässt (F07, F08, F10). Bilder der Nähe (`lock-notification`, `shop-map`) und
die zerknickte Papierkarte (`wallet-vanish`) nur, wenn die Regeln V2 und V3
sie erlauben.

| Blickwinkel | Bild ab Bild 0 | Muster zuerst | Memes, die passen (4.2) |
|---|---|---|---|
| `sperrbildschirm` | `lock-notification`, `"rise": false`, `"buzzes": 2`, `"waves": true`, `"pin": false` (Werte aus `AUTOMATIK.md` 6.4; das Brummen im Bild ist laut `PRODUKT.md` C1 ein Stilmittel auf Wunsch des Betreibers). Text wie im Backend: "Noch <n> Stempel bis: <Belohnung>", bei voller Karte "<Belohnung> wartet auf dich" | H01, H05, H04 | M27, M05, M02, M10, M13 |
| `verlorener-stammkunde` | `guest-ghost` mit Schildchen ("9 von 10 Stempeln") oder `paper-card` fast voll | H02, H09, H05 | M23, M18 |
| `papierkarte` | `paper-card`, Schnitt auf `wallet-vanish` | H09, H10 | M23, M08, M24, M26, M29, M03, M21 |
| `kein-download` | `wallet-pass` mit Scan, oder `paper-card` als Gegenbild | H06, H07, H11 | M04, M06, M24, M28, M11 |
| `stempelzahl` | `paper-card`, 10 Felder, wenige gestempelt | H03, H08 | M09 |
| `team` | `paper-card` (Stempelschlag), Schnitt auf `wallet-pass` mit Scan | H07, H11 | M23, M02 |
| `karte-bleibt` | `paper-card` (Eis), Schnitt auf `wallet-vanish` | H05, H04 | M05, M23 |
| `rechnung` | Format F04: `big-number` mit der Alltagszahl; `calc-panel` nur als Zusammenfassung nach `AUTOMATIK.md` 6.4 (wie im Döner-Video) | H03 | keins: Zahl und Meme zusammen ist zu viel |
| `stammkunden-tipps` | Format F01: `tip-cards`, Anker `card` auf das erste Wort von Tipp 1 (bis dahin nur Überschrift und Zettel-Leiste) | H05, H08 | keins |
| `theke-saetze` | Format F02: `tip-cards` mit `"rise": false` und dem ersten schlechten Satz | H11 | keins |
| `einwand` | Format F03: `comment-thread`, die Frage wird getippt; F09: Behauptung als Kommentar | H06 | M04 |
| `ladentag` | Format F05: `day-clock` mit der ersten Uhrzeit | wie H01, ohne Sperrbildschirm | keins |
| `duell` | Format F06: `versus-split` mit `"scene": "start"` | H11 | M24 (Seiten "Red Flag" und "Green Flag"; links steht immer Papier, rechts das Handy) |
| `studie` | `guest-ghost` | H02, H05; die Studienzahl erst in der Mitte | keins |

### 1.4 Länge

- **Erste Textzeile (die Tafel ab Bild 0) höchstens 8 Wörter** und höchstens
  3 Zeilen zu rund 20 Zeichen. Grund: 3 s Sprechzeit (1.1). Ein längerer Satz
  wird an einer natürlichen Stelle auf zwei Textzeilen verteilt ("Wenn ich
  einen Salon hätte, | wäre ..."). Bild 0 zeigt dann einen ganzen Satz, nie
  einen halben.
- **Ganzer Hook höchstens 14 Wörter**, meist zwei Textzeilen, gesprochen bis
  zum ersten Bildwechsel (rund 5 s, `maxStill`).
- Kürze allein hilft nicht: Hooks mit höchstens 12 Wörtern liegen bei 0,81×,
  längere bei 1,14×. Die Grenze kommt von Tafel und Sprechzeit, nicht aus den
  Daten. Was trägt, ist der Inhalt (1.5).
- Jeder Punkt ist eine Pause (höchstens 0,45 s nach `maxGap`). Zwei kurze
  Sätze sind gut, drei sind die Grenze.

### 1.5 Bevorzugen und meiden

| Bevorzugen | Beleg |
|---|---|
| **Ein Moment in einem Laden**, aus Sicht der Kundin (H01) | Kundenmoment: 3 von 9 Treffer (33 %), Median 1,61×, alle drei von trytappi. Übertragbar ist davon nur einer: 4.634 Likes = 110× (Handy meldet sich beim Vorbeigehen). 1.608 = 38× lebt von "niemand verfolgt dich" (bei uns N2), 880 = 21× von Café und Gratis-Kaffee (bei uns beides tabu) |
| **Der Stammkunde, der unbemerkt weg ist**, mit Person, Rhythmus und Nicht-Bemerken (H02) | Verlorener Kunde: 2 von 11 Treffer, 2.942 = 163× und 2.869 = 68×; beide haben alle drei Teile |
| **Laden oder Gegenstand beim Namen** (Döner, Haarschnitt, Brötchen, Kugel Eis, Serviette) | mit: 1,70× und 21 % Treffer; ohne: 0,72× und 7 % (34 gegen 75 Hooks) |
| **Eine Alltagszahl, die kippt** (H03) | schwacher Beleg. Zahl/Rechnung: 1 von 6 Treffer, Median 1,83×. Der Treffer 367 Likes = 20,4× ("A €15 cut is rarely just €15") kam mit derselben Caption im zweiten Upload auf 48 = 2,7×. Dazu 750 = 17,9× ("Ten stamps ... is why nobody finishes your card"), in `docs/hooks-daten.md` als "Kühne Behauptung" gezählt |
| **Meme-Rahmen mit echtem Inhalt** (H08, H10) | Meme/Trend: 2 von 8 Treffer (25 %), bis 15,0×; beide Treffer sind dasselbe Video in zwei Uploads |
| **"Stell dir vor"** mit einem Bild aus dem Laden (H04) | 1 von 4 Treffer, Median 2,48× (n = 4, zwei davon derselbe Text) |

| Meiden als erster Satz | Beleg |
|---|---|
| Slogan, Produkt erklären, Markenname ("Stampit", "digitale Stempelkarte") | 27 Hooks, 0 Treffer, Median 0,8×; mit Marke 17, 34 und 41 Likes. **Gegenbeispiel:** reine Aufrufe mit Markenname ("nur CTA") hatten 5 Treffer in 12 Reels, die höchste Quote überhaupt, etwa "Hol dir mehr Stammkunden mit Evecoo!" 843 = 38×. Woran es lag (Video oder bezahlte Werbung), ist aus den Daten nicht zu sehen (**unbestätigt**). "Stampit" frühestens ab der Pointe |
| "Zwei Läden, dieselbe Straße" | 0 von 5 Treffer, bestes 4,2×; unser Reel 59,7 % Skip-Rate. Vergleich nur in der Mitte |
| Branche anreden ("Liebe Friseure", "Du hast einen Salon?") | Branche angesprochen: 16 und 3 Likes, Median 0,51× |
| Echte Ja-Fragen an den Zuschauer ("Kunden kommen einmal und nie wieder?"); Ausnahmen in 1.6 | 4, 21 und 23 Likes. Fragezeichen allein: 0,79× gegen 0,97× ohne |
| Abstrakte Zahl, Studie als Einstieg | "5 to 25 times more" 26 Likes, "5 QUESTIONS ..." 42. Studien (S1 bis S5) erst in der Mitte |
| Papier-Problem als allgemeine Feststellung ("Papierkarten gehen verloren") | Problem (Alltag): 0 von 8 Treffer, Median 0,61×. Stattdessen eine bestimmte Karte in einem bestimmten Moment (H09) oder ein Meme |
| Große Marken, Analogien (Airline, Tankstelle, Videospiel) | 1 von 11 Treffer, Median 0,67× |
| Leere Mitmach-Memes ("Sei ehrlich, wer warst du?") | 0 bis 2 Likes |
| Kopie oder Übersetzung eines fremden Treffers, auch eines eigenen | in × Median des jeweiligen Kontos: 21,0× → 0,3×, 38,3× → 1,9×, 110× → 1,2×, 50,8× → 2,4×, 163× → 1,7× (Likes 880 → 6, 1.608 → 35, 4.634 → 54, 2.339 → 112, 2.942 → 31). Gleiche Caption, gleiches Konto: 4,0× und 68× |
| Erfolgsversprechen, Umsatz ("macht 30.000 Euro") | `PRODUKT.md`, N5 |

Kommentare sind kein Maß für einen Hook: das Stichwort im Schluss bringt 14-
bis 22-mal so viele Kommentare je Like, aber nicht mehr Likes (loyaltify.io:
Stichwort in allen 38 Reels, Median 18 Likes).

### 1.6 Prüfliste

- [ ] Erste Textzeile höchstens 8 Wörter, Hook höchstens 14, Tafel passt,
      Bild 0 zeigt einen ganzen Satz (1.4).
- [ ] Der Satz stand in den letzten 60 Tagen nicht schon als `hook` an einem
      Video auf dem Board.
- [ ] H02 (der stille Verlust) höchstens einmal je Durchlauf von
      `THEMEN.md`: kein H02, wenn ein Video der letzten 30 Tage schon
      `hook_muster` H02 hat (Feld am Video auf dem Board, sonst
      `meta.hook_muster` im Ordner des Videos).
- [ ] Ein Laden aus `THEMEN.md` oder ein Gegenstand aus ihm ist genannt oder
      zu sehen; keine Branche angeredet.
- [ ] Kein Markenname, kein Fachwort ("Kundenbindung", "Loyalty", "NFC").
- [ ] Keine echte Ja-Frage an den Zuschauer. **Erlaubt sind:** (a) eine
      W-Frage, deren Antwort das Video gibt (H05); (b) eine rhetorische Frage
      oder ein Einwand, den der **nächste Satz** sofort selbst beantwortet
      ("Eine App für zwei Brötchen? Lädt keiner.", "Stempelkarte zu Hause
      vergessen? Schere.", M04, M12, M28).
- [ ] Kein Satz, kein Bild und kein Laden eines Mitbewerbers, auch nicht
      übersetzt oder leicht abgewandelt (`AUTOMATIK.md`, Regel 7). Nicht
      "Wusstest du, dass ...", nicht "Dieses Café hat einen Weg/Trick
      gefunden ...", nicht "Zwei Läden, dieselbe Straße", nicht "Wo ist die
      Stempelkarte deines Kunden?", nicht Friseur plus "kam alle paar Wochen"
      plus "wann hast du ihn zuletzt gesehen".
- [ ] Was im Video über die App gesagt wird, hat seine Zeile in `PRODUKT.md`,
      Klasse 1 (in `meta.beleg`). Kein Café, kein "geht aufs Haus", keine
      Preise der App (N6), keine Entfernung, keine Häufigkeit von
      Nachrichten. Euro nur in einer Beispielrechnung im Format F04 (1.3,
      `rechnung`).
- [ ] Was zu C1 gesagt wird, bleibt bei `PRODUKT.md` C1 (Stand 16.11.2026,
      vom Betreiber richtiggestellt): in der Nähe des Ladens zeigt sich die
      Karte von selbst auf dem Sperrbildschirm, mit dem Stand; ist sie voll,
      wartet die Belohnung. "Ist sie voll, meldet sie sich" bleibt richtig.
      Ein Satz im Video sagt "in der Nähe" und das Video zeigt die Nähe mit
      `shop-map`. Ein Hook davor, der nur den Moment zeigt ("Mittagspause.
      Sein Sperrbildschirm sagt: Noch zwei Stempel."), muss das nicht selbst
      sagen. Nie eine Entfernung, nie wie oft, nie eine Erinnerung ohne die
      Nähe des Ladens (nach langer Pause, vor dem nächsten Besuch: C2, N14).
- [ ] Zu C1 in Text und Stimme kein Wort für Ton oder Vibration ("brummt",
      "vibriert", "klingelt", "piept"); sagen: "meldet sich", "zeigt sich auf
      dem Sperrbildschirm". Das Bild darf brummen (Stilmittel, `PRODUKT.md`
      C1); ob das Wort auch gesprochen werden darf, hat der Betreiber nicht
      gesagt (7).
- [ ] Höchstens ein Meme (Abschnitt 4).
- [ ] Standbild bei 0 s: Tafel vollständig, Bild steht schon, nichts halb
      eingeblendet. Bei 1 s: die Bewegung mit Ton hat begonnen.

---

## 2. Hook-Muster

Die Beispiele sind Vorschläge. In Klammern die Zeile aus `PRODUKT.md`, die
das deckt, was das Video danach sagt. Derselbe Satz kommt höchstens einmal in
60 Tagen vor (Kopien fallen durch, 1.5; geprüft am Feld `hook` der Videos
auf dem Board). Läden: Salon Haarscharf, Döner Palast, Eis am Markt,
Bäckerei Morgenrot.

| Nr. | Muster und Bauart | Beleg | Drei Beispiele | Läden |
|---|---|---|---|---|
| H01 | **Kundenmoment.** [Tageszeit, Weg oder Lage] + [was gerade mit dem Kunden und seiner Karte passiert], meist: in der Nähe des Ladens zeigt sich seine Karte auf dem Sperrbildschirm, mit dem Stand. Der Zuschauer sieht den Moment, bevor er versteht, warum. In Text und Stimme nie "brummt" oder "vibriert" (1.6): C1 sagt "meldet sich"; ob Apple Wallet dabei überhaupt vibriert, ist **unbestätigt** (Anbieter-Doku: eher nicht). Im Bild darf es brummen (Stilmittel) | 3 von 9 Treffer, übertragbar davon einer: 4.634 = 110× (Handy meldet sich beim Vorbeigehen). Dessen Wortlaut ("phone buzz") nicht übernehmen | "Mittagspause. Sein Sperrbildschirm sagt: Noch zwei Stempel." (C1) · "Er denkt gerade nicht an Eis. Dann meldet sich seine Stempelkarte." (C1) · "Kurz vor acht, auf dem Weg zur Bahn. Und ihre Stempelkarte meldet sich." (C1) | alle; Uhrzeit auf dem Sperrbildschirm passend zum Laden |
| H02 | **Der stille Verlust.** [eine Person] + [ihr Rhythmus] + [Bruch], dann das Nicht-Bemerken. Alle drei Teile, sonst floppt es. **Höchstens einmal je Durchlauf von `THEMEN.md` (1.6).** Nie Friseur mit "alle paar Wochen" (Treffer eines Mitbewerbers) | 2 von 11 Treffer (163× und 68×); ohne Person und Rhythmus 4 bis 23 Likes; dieselbe Bauart im Café nur 31 | "Jeden Freitag ein Döner. Acht Stempel. Dann nichts mehr." (A4, C1) · "Neun Haarschnitte bei dir. Den zehnten macht ein anderer." (Hook aus `THEMEN.md`, T01; A4, A3, C1) · "Jeden Samstag zwei Brötchen. Seit drei Wochen nicht mehr." (A4, C1) | Salon, Döner, Bäckerei (es braucht einen Rhythmus); Eis nur mit Saison |
| H03 | **Die Alltagszahl, die kippt.** [eine Zahl, die jeder kennt] + [kurz umgedreht]. Rechnung stimmt und ist als Beispiel erkennbar | schwach: 1 von 6 Treffer (20,4×, im zweiten Upload derselben Caption 2,7×), dazu 17,9× aus einer kühnen Behauptung mit Zahl; abstrakte Zahlen 26 und 42 Likes | "Ein Döner pro Woche, zehn Stempel. Das sind zehn Wochen Warten." (D2) · "Ein Haarschnitt im Monat, zehn Stempel. Das ist fast ein Jahr." (D2) · "Zwei Haarschnitte mehr im Jahr. Klingt nach wenig." (Beispielrechnung, nur begleitet) | alle; `stempelzahl`; `rechnung` nur begleitet (1.3) |
| H04 | **Stell dir vor.** "Stell dir vor, ..." + ein Bild aus dem eigenen Laden, das heute nicht passiert. Nie "jeder Kunde geht mit deiner Karte im Handy raus" (Wortlaut eines Mitbewerbers) | Median 2,48×, aber n = 4 | "Stell dir vor, die Stempelkarte sagt Bescheid, wenn sie voll ist." (C1) · "Stell dir vor, die Eisdiele ist zu, und die Karten bleiben." (A3, A1) · "Stell dir vor, keine Stempelkarte klebt mehr an einer Serviette." (A4) | alle |
| H05 | **Die Frage, deren Antwort keiner kennt.** W-Frage (wer, was, wie lange) über den Laden des Zuschauers; die Antwort ist das Video. Nie eine Frage, deren Antwort eine Funktion aus Klasse 2 wäre: eine Erinnerung ohne die Nähe des Ladens (nach jedem Stempel, nach langer Pause: C2, N14), was der Laden über seine Kunden sieht (B5; E1 nennt das nicht) | "So what's the café really after?" 880 = 21×; Ja-Fragen 4 bis 23 | "Wer sagt deinem Kunden, dass seine Karte voll ist?" (C1) · "Was machen die Stempelkarten deiner Eisdiele im Winter?" (A3, A1) · "Wie lange braucht dein Kunde für zehn Stempel?" (D2) | alle |
| H06 | **Der Einwand zuerst.** [Einwand, den der Ladenbesitzer denkt] + [kurze Wendung]. Nur mit Gegenstand im Satz. Die Frage beantwortet der nächste Satz (1.6, Ausnahme b) | schwach, als Muster ungemessen; ähnlicher Einstieg eines Mitbewerbers 4,0× und 1,0× | "Eine App für zwei Brötchen? Lädt keiner. Muss auch keiner." (A2, A3) · "Für einen Döner lädt keiner eine App. Braucht er auch nicht." (A2) · "Dein Kunde will keine App. Er bekommt auch keine." (A2, A3) | alle; `kein-download` |
| H07 | **Dieser Laden ...** "Diese/r [Laden]" + was er anders macht, nur Klasse 1, kein Erfolgsversprechen. Nie "hat einen Weg/Trick gefunden" | 1 von 5 Treffer (50,8×), Median 1,07×; derselbe Inhalt zehn Tage später 112. Getragen hat dort ein Versprechen, das bei uns Klasse 2 ist (D5) | "Dieser Dönerladen stempelt ohne Stempelkissen." (B1, B2) · "Bei diesem Friseur ist die Karte im Handy, bevor die Haare trocken sind." (A3, A2) · "Diese Bäckerei hat keine Papierkarte mehr an der Theke." (A4, A1) | alle |
| H08 | **Wenn ich ... hätte.** "Wenn ich eine/n [Laden] hätte, ..." + eine klare Entscheidung, die die App deckt. Keine Mitmachfrage am Ende | "If I opened a nail salon, ..." 15,0× und 6,7× (Uploads desselben Videos); dessen Inhalt ("Rabatte und Papierkarten weglassen") nicht übernehmen | "Wenn ich einen Salon hätte, wäre meine Karte nach fünf Schnitten voll." (D2) · "Wenn ich einen Dönerladen hätte, gäbe es Stempel nur per Scan." (B1, B2) · "Wenn ich eine Eisdiele hätte, würde meine Karte im Handy überwintern." (A3, A1) | alle |
| H09 | **Eine Karte, ein Unglück.** [eine bestimmte Papierkarte, meist mit Stempelzahl] + [was ihr gerade passiert]. Komisch, nie belehrend; der Witz liegt auf dem Papier, nicht auf dem Kunden | als Muster ungemessen; die allgemeine Klage floppt (0,61×), der genannte Gegenstand hebt (1,70×) | "Sieben Stempel. Dann kam die Knoblauchsoße." (A4) · "Die Stempelkarte war in der Badetasche. Jetzt ist sie Matsch." (Hook aus `THEMEN.md`, T03; A4, A1) · "Acht Stempel. Die Karte ist weg. Er auch." (A4, A3, C1) | alle; `papierkarte`, `verlorener-stammkunde` |
| H10 | **Meme-Bogen** (Dramaturgie des Koscher-Videos). Hook = erste Hälfte eines bekannten Satzbaus, ab Bild 0. Pointe nach 10 bis 14 s = zweite Hälfte, als `stamp-check` mit Klasse-1-Aussage, danach `"gapBefore": 0.55` | Koscher-Video: Pointe bei 10,8 s, Zahlen fehlen noch. Meme mit echtem Inhalt bis 15×, leer 0 bis 2 Likes | siehe Bibliothek: M23, M18, M24, M08 | alle; nur an Meme-Tagen (4.1) |
| H11 | **Der Widerspruch im Satz.** Zwei Wörter, die nicht zusammenpassen; das Bild zeigt das eine | ungemessen; Neugierlücke ohne Gegenstand 0,65× (n = 2). Nur mit Laden oder Gegenstand | "Stempelkarte ohne Papier. Und ohne App." (A4, A2) · "Gestempelt, ohne Stempel." (B1, B2) · "Diese Stempelkarte kann man nicht im Portemonnaie vergessen." (A4, A1) | alle; `team`, `kein-download` |

---

## 3. Meme-Bibliothek

Nur Formate, die `docs/memes-recherche.md` als NUTZBAR oder EINGESCHRÄNKT führt und die hier
in Tabelle 3.2 stehen. **Was dort nicht steht, ist kein erlaubtes Meme.**
Neue Einträge macht nur eine begleitete Sitzung, mit Quelle und Datum. Nie
benutzt werden (NICHT NUTZBAR): M14, M22 und M32 bis M40, dazu jeder
Trend-Sound und jedes Lied. **Gesperrt: M01** (Koscher), Grund unter 3.2.

**Spalte "Lauf":** `ja` = darf in den Lauf. `Probe` = erst, wenn die
Aussprache gehört ist (3.1). `begleitet` = nur in einer begleiteten Sitzung.
`ruht` = nicht benutzen, bis eine begleitete Sitzung es neu belegt.
**Platz:** Hook = ab Bild 0. Pointe = als `stamp-check` (mit der
Klasse-1-Aussage). Bogen = Hook und Pointe gehören zusammen (H10).

**Stimme, für alle:** Liam mit den Einstellungen der Vorlage, normal deutsch.
Kein Akzent, keine gedehnten Vokale, kein Rachen-ch, keine nachgemachte
Sprechweise; Satzzeichen geben die Betonung. Zahlen als Ziffern mit
gesprochener Form (`1000{tausend}`). **Bilder, für alle:** nur vorhandene
Bausteine, nie eine Figur oder Person aus der Vorlage des Memes.

### 3.1 Aussprache englischer Wörter

Ob Liam diese Wörter richtig spricht, ist ungeprüft. Eine begleitete Sitzung
nimmt sie einmal auf (`--allow-voice-spend --check`, rund 80 Zeichen), hört
sie an und trägt hier Datum und, falls nötig, einen `say`-Eintrag ein. Erst
dann wird `Probe` zu `ja`. Jedes gezeigte Wort wird auch gesprochen (ein
Wort auf dem Bild = ein gesprochenes Wort, `engine/script.mjs`); ein Wort nur
auf die Tafel zu schreiben, geht nicht. Klingt ein Wort gesprochen fremd
(etwa "POV" als "Pi-Oh-Wie"), geht das Meme auf `ruht`.

| Wort | Meme | geprüft | `say` (Vorschlag zum Testen, ungeprüft) |
|---|---|---|---|
| POV | M02 | nein | `"POV": "Pi-Oh-Wie"` |
| Red Flag, Green Flag | M24 | nein | keiner |
| Peak, Crashout | M18 | nein | `"Peak": "Piek"`, `"Crashout": "Kräschaut"` |
| Ragebait, Six seven | M17, M19 | nein | (ohnehin begleitet) |

### 3.2 Die Liste

Reihenfolge = Rang für 4.2 (die ersten zehn wie in `docs/memes-recherche.md`). "Prüfen bis":
siehe 4.4. Zuletzt benutzt: nur M01 (16.11.2026).

Jedes Skript, das C1 sagt, zeigt vor diesem Satz die Nähe mit `shop-map`
(1.6); in den Skripten unten steht das dabei. Diese Fassungen nur, wenn die
Regel V2 in `FORMATE.md` das Motiv Nähe erlaubt; sonst die Fassung des Memes
ohne C1 (Format F07).

| Nr. | Meme, Satzbau, Platz | Bild | Cool-down · Risiko · Lauf · prüfen bis | Skript: Hook → Wendung (Laden, Thema, Beleg) |
|---|---|---|---|---|
| M23 | **Erwartung vs. Realität.** "Erwartung: <Wunsch>. Realität: <Missgeschick mit Papier>." Doppelpunkt = Pause. Hook | `paper-card` (Stempel fällt auf "Erwartung"), Schnitt auf `wallet-vanish` (Knick auf das letzte Wort), Tafeln `*Erwartung:`, `*Realität:` | 14 Tage · niedrig · ja · 16.11.2027 (zeitlos, seit 2010) | 1) "Erwartung: zehn Stempel. Realität: Karte zerknickt im Portemonnaie." → "In der Wallet zerknickt nichts." → `shop-map` → Pointe "Und ist sie voll, meldet sie sich von selbst!" (Salon, T01; A4, A1, C1) · 2) "Erwartung: Gratis-Döner. Realität: Karte klebt an der Serviette." → "Im Handy klebt nichts. Ein Scan mit der Handy-Kamera, und der Stempel ist drauf." (Döner, T17; A4, B1, B2) |
| M18 | **Crashout und Peak.** "<Papier-Moment>. Crashout." ... Pointe "<Wallet-Moment>. Peak!" Bogen. Einziges Jugendwort im Video | Hook `guest-ghost` oder `wallet-vanish`, Pointe `stamp-check` | 21 Tage · niedrig · Probe · 31.03.2027 (Jugendwort 2026, Platz 2 und 3, 10.10.2026) | "Acht Stempel, Karte weg. Crashout." → `wallet-pass`: "Im Handy geht sie nicht verloren." → `shop-map` (er kommt in die Nähe) → Pointe "Ist sie voll, meldet sie sich von selbst. Peak!" (Döner, T15; A4, A3, C1) |
| M24 | **Red Flag / Green Flag.** "Red Flag: <Papier-Gewohnheit>." ... "Green Flag: <Wallet>." Bogen | `paper-card` zu "Red Flag", Pointe `stamp-check` zu "Green Flag". Farbige Fahnen gibt es nicht: die Wörter tragen es | 14 Tage · niedrig · Probe · 16.11.2027 (zeitlos; "Beige Flag" 2023 laut TIME, ein Beginn "seit 2021" ist **unbelegt**) | 1) "Red Flag: fünf Stempelkarten im Portemonnaie." → `wallet-vanish` → `shop-map` → Pointe "Green Flag: eine Karte in der Wallet, die sich meldet, wenn sie voll ist." (Bäckerei, T26; A1, A4, C1) · 2) "Red Flag: für eine Stempelkarte eine App laden." → Pointe "Green Flag: einmal scannen, Karte in der Wallet." (Salon, T18; A2, A3) |
| M26 | **Früher war mehr Papier.** Nur der abgewandelte Satz; nie Name, Figur, Bild, Sketch oder Sprechweise der Vorlage. Hook | `paper-card` (Bäckerei, `"mug": true`), Schnitt auf `wallet-pass`, `shop-map` vor dem Satz zu C1 | nur 29.11. bis 26.12.2026, höchstens zweimal, 10 Tage Abstand · niedrig bis mittel · ja · 26.12.2026 (OLG München 14.08.2019: Satz nicht geschützt) | "Früher war mehr Papier." → "Fünf Stempelkarten im Portemonnaie, keine voll." → "Heute liegt die Karte in der Wallet." → `shop-map` → "Und ist sie voll, meldet sie sich von selbst." (Bäckerei, T26; A4, A1, C1) |
| M02 | **POV.** "POV: <Rolle oder Lage>, und <Moment>." Hook. "POV" wird mitgesprochen (3.1) | Szene aus Sicht des Ladens oder der Kundin; Tafel `*POV:` | 14 Tage · niedrig · Probe · 16.11.2027 (zeitlos, seit 2019) | 1) "POV: Mittagsschlange, und alle suchen ihre Stempelkarte." → "Bei dir: ein Scan mit der Handy-Kamera, der Stempel ist sofort auf dem Kundenhandy." (Döner, T10; B1, B2) · 2) "POV: Deine Karte ist voll, und du kommst in die Nähe der Eisdiele." → `shop-map` → "Die volle Karte zeigt sich von selbst auf deinem Sperrbildschirm." (Eis, T25; C1) |
| M08 | **Wir müssen reden.** Die Papierkarte wird verabschiedet, die Wallet-Karte bleibt. Hook | `paper-card`, Schnitt `wallet-vanish`, dann `wallet-pass`; bei C1 `shop-map` davor | 21 Tage · niedrig · ja · 16.11.2027 (Alltagsphrase, als Meme unbelegt) | 1) "Liebe Papierkarte, wir müssen reden." → "Du zerknickst. Du verschwindest im Portemonnaie." → `shop-map` → Pointe "Die Karte in der Wallet bleibt, und ist sie voll, meldet sie sich." (Bäckerei, T26; A4, A1, C1) · 2) "Wir müssen reden. Über die Stempelkarte an deiner Serviette." → "Die Karte im Handy landet nicht im Müll." (Döner, T17; A4, A1) |
| M27 | **Klingt komisch, ist aber so.** Nach einer überraschenden, wahren Aussage. Pointe, als zweite Textzeile im `stamp-check`. Nie Maus, Elefant oder Name der Sendung | `shop-map` davor, `stamp-check` | 21 Tage · niedrig · ja · 16.11.2027 (zeitlos; Herkunft unklar, die Macher der Sendung bestreiten sie; ob der Satz als Marke eingetragen ist, **nicht geprüft**, DPMA nicht abgefragt) | Hook (H01) "Er denkt gerade nicht an Eis. Dann meldet sich seine Stempelkarte." → `shop-map` → Pointe "Die Karte ist voll und meldet sich von selbst." + "Klingt komisch, ist aber so!" (Eis, T25; C1) |
| M05 | **Rate mal.** "Rate mal, wo/wer/was ..." Hook, Lösung als Pointe. Erst den Laden, dann die Ratefrage, damit Bild 0 einen ganzen Satz zeigt | `paper-card`, Lösung `wallet-pass` | 14 Tage · niedrig · ja · 16.11.2027 | "Deine Eisdiele macht Winterpause. \| Rate mal, was mit den Stempelkarten passiert." → "Nichts. Sie bleiben im Handy, in der Wallet. Im Frühling geht es weiter." (Eis, T13; A3, A1) |
| M04 | **Erklär's mir, als wär ich fünf.** Hook, drei kurze Sätze als Antwort. Nie herablassend: die Frage stellt der Zuschauer | `wallet-pass` mit Scan | 21 Tage · niedrig · ja · 16.11.2027 | "Erklär's mir, als wär ich fünf: Stempelkarte ohne App?" → "QR-Code scannen. Karte in der Wallet. Fertig." (Eis, T27; A2, A3, A1) |
| M06 | **Das ist kein X. Das ist Y.** Hook. Sparsam: gilt auch als typisch für KI-Texte | `wallet-pass` | 30 Tage · niedrig · ja · 16.11.2027 | "Das ist keine App. Das ist deine Stempelkarte." → "Sie liegt in Apple Wallet oder Google Wallet, ohne Download." (Bäckerei, T04; A1, A2) |
| M09 | **Unpopuläre Meinung.** Als Überlegung, nie als Versprechen. Hook | `paper-card` 10 Felder, 3 gestempelt; `wallet-pass` 6 Felder | 21 Tage · niedrig bis mittel · ja · 16.11.2027 | "Unpopuläre Meinung: Zehn Stempel bis zum Döner sind zu viele." → "Wie viele es braucht, legst du selbst fest." (Döner, T06; D2) |
| M29 | **Gesamtsituation.** "Die Papierkarte ist mit der Gesamtsituation unzufrieden." Hook. Keine Filmfigur | `paper-card`, `wallet-vanish` | 30 Tage · niedrig · ja · 16.11.2027 (Herkunft nur aus einer Quelle, GIGA: **unbelegt**; der Satz trägt auch ohne Vorlage) | → "Verständlich: Sie klebt an der Serviette. In der Wallet passiert ihr das nicht." (Döner, T17; A4) |
| M13 | **Ehrenkarte.** Pointe nach C1 | `shop-map`, dann `stamp-check` | 30 Tage · niedrig · ja · 16.11.2027 | `shop-map` → "Diese Stempelkarte sagt selbst Bescheid, wenn sie voll ist." + "Ehrenkarte!" (Bäckerei, T16; C1) |
| M10 | **Gönn dir.** Pointe nach C1; abgenutzt | `shop-map`, dann `stamp-check` | 30 Tage · niedrig · ja · 16.11.2027 | `shop-map` → "Karte voll, die Kugel wartet." + "Gönn dir!" (Eis, T25; C1) |
| M11 | **Läuft bei dir.** Pointe; wirkt alt (2014) | `stamp-check` | 30 Tage · niedrig · ja · 16.11.2027 | "Einmal scannen, Karte im Handy." + "Läuft bei dir!" (Salon, T18; A3, A2) |
| M21 | **Schere** (= mein Fehler). Pointe nach einem Missgeschick; Zielgruppe eher Gamer | `paper-card`, `wallet-pass` | 30 Tage · niedrig · ja · 31.03.2027 (Top 10 Jugendwort 2026) | "Stempelkarte zu Hause vergessen? Schere." → "Einmal gescannt, liegt die Karte im Handy." (Döner, T17; A4, A3) |
| M03 | **Niemand: / Die Papierkarte:** Hook als Tafel; die Stille dazwischen kürzt `maxGap`, gesprochen also schwächer | `wallet-vanish`, `wallet-pass` | 30 Tage · niedrig · ja · 16.11.2027 | "Niemand: \| Die Papierkarte im Portemonnaie: zerfällt." → "Die Karte in der Wallet zerfällt nicht." (Bäckerei, T26; A4, A1) |
| M28 | **Nein! Doch! Oh!** Drei Sätze aus je einem Wort, jeder eine Tafel. Hook. Der Witz lebt von der Betonung der deutschen Synchronfassung (Sprecher laut einem Artikel Gerd Martienzen, **unbestätigt**); das Urteil des LG Berlin II betraf einen Synchronsprecher. Deshalb nie dessen Betonung nachahmen, nie Gesicht, Gesten oder Name des Schauspielers | `wallet-pass`, je Wort ein Bildwechsel | 30 Tage · niedrig bis mittel · begleitet (wird `ja`, wenn eine begleitete Sitzung eine Fassung ohne `tools/clip-in.py` und ohne Nachahmung gut fand) · 16.11.2027 | "Die Karte ist schon im Handy? Nein! Doch! Oh!" → "Einmal den QR-Code scannen, kein Store, kein Download." (Salon, T18; A2, A3) |
| M12 | **Was kostet die Welt.** Lädt zu Preisgesprächen ein (N6, N7) | `paper-card` 10, `wallet-pass` 6 | 30 Tage · mittel · begleitet · 16.11.2027 | "Sechs Stempel statt zehn? Was kostet die Welt." → "Die Zahl der Stempel legst du selbst fest." (Döner, T06; D2) |
| M17 | **Ragebait.** Nur selbstironisch, nie echte Wut | `wallet-pass` | 30 Tage · mittel · begleitet · 31.03.2027 | "Kein Ragebait: Für eine Kugel Eis lädt niemand eine App." → "Muss auch keiner: einmal scannen, Karte in der Wallet." (Eis, T27; A2, A3) |
| M19 | **Sechs, sieben.** Kinder-Meme, nie das Lied | `wallet-pass` 7 Felder, 6 gestempelt | 30 Tage · mittel · begleitet · 31.03.2027 | "Sechs von sieben Stempeln. Six seven." → "Wie viele Stempel es braucht, legst du selbst fest." (Döner, T06; D2) |
| M20 | **Gute Käse.** Falsches Deutsch kann wie Spott über Lernende wirken | `wallet-pass` Stempel | 30 Tage · mittel · begleitet · 31.03.2027 | "Das achte Käsebrötchen. Der Stempel ist schon im Handy. Gute Käse!" (Bäckerei, T16; B1, B2) |

**Ruht** (nicht benutzen, bis eine begleitete Sitzung es neu belegt):

- **M15** "Minus 1000 Aura": Jugendwort 2024 (Bekanntgabe 19.10.2024), nach
  4.4 seit 31.03.2025 abgelaufen, für 2026 kein Beleg.
- **M16** "Das crazy": Jugendwort 2025, nach 4.4 seit 31.03.2026 abgelaufen.
- **M07** "Sag mir, dass du ... hast, ohne es zu sagen": das Format erwartet
  ein Erkennungszeichen des Ladens, der Entwurf lieferte ein Missgeschick des
  Kunden; 11 Wörter, über der Grenze von 8 (1.4); Höhepunkt 2021.
- **M25** "Bro dachte": der Witz geht auf Kosten eines Kunden (4.3, Punkt 4),
  Verbreitung unbelegt, "Bro" kann Ältere befremden.
- **M30** "2026 ist das neue 2016" (belegt nur Januar bis März 2026) und
  **M31** "Pudding mit Gabel" (Herbst 2025).

**Gesperrt: M01** "Ist das koscher? Natürlich ist das koscher!". Die
Herkunft (ein Berliner Rabbiner) stammt nur aus Suchtreffern; die Seiten
waren nicht erreichbar, und eine zweite Suche in der Prüfung fand **keine**
Quelle für das Meme oder den Bezug: **unbelegt**. Das Datum 04.11.2026 ist
aus der Nummer eines einzelnen Nutzervideos errechnet, kein Beleg für
"viral". Ob das Koscher-Video gewirkt hat, ist ungemessen. Vorlage ist eine
echte Person, das Thema Religion. M01 kommt erst zurück, wenn eine
begleitete Sitzung die Herkunft mit Quelle belegt **und** der Betreiber es
ausdrücklich wieder will. Für den Takt in 4.1 zählt das Koscher-Video weiter
als Meme-Video.

---

## 4. Regeln für Memes

### 4.1 Meme-Tag ja oder nein

Gezählt werden die Videos auf dem Board (`videos`), verworfene mit, wie bei
der Themenpause. Ein Video ohne Feld `meme` gilt als ohne Meme; Ausnahme:
`2026-11-16-ist-das-koscher` ist M01.

Ein Meme kommt ins Video, wenn **alles** zutrifft:

1. **Unter den letzten drei Videos (Vortag eingeschlossen) hatte keins ein
   Meme.** Das ergibt höchstens ein Meme in vier Videos: M - - - M - - - ...
   Das Koscher-Video vom 16.11. zählt mit: vom 17. bis 19.11. kein Meme, ab
   20.11. wieder möglich. Grund für den vorsichtigen Takt: in der Nische gibt
   es ein einziges Meme-Video mit Treffer (Uploads desselben Videos), das
   Koscher-Video hat noch keine Zahlen. Der Takt gilt, bis fünf Meme-Videos
   gemessen sind (6); der Lauf ändert ihn nie selbst.
2. Der Blickwinkel hat in Tabelle 1.3 passende Memes (nicht `rechnung`,
   nicht `studie`).
3. Mindestens eines davon ist frei nach 4.2.
4. Kein Wunsch des Betreibers sagt etwas anderes (`gedaechtnis/wuensche`).
   Wünsche gehen vor ("weniger Memes", "nie mehr M24").

Sonst kein Meme. **Im Zweifel kein Meme** (Regel 1 der Automatik: die
vorsichtigere Möglichkeit).

### 4.2 Welches Meme

Frei ist ein Meme, wenn: es in Tabelle 3.2 steht; Lauf `ja` (oder `Probe`
und in 3.1 als geprüft eingetragen); heute nicht nach "prüfen bis"; sein
Cool-down seit der letzten Verwendung (irgendein Video) abgelaufen; es zum
Laden passt (M26 nur 29.11. bis 26.12., M20 nur Bäckerei).

Unter den freien, die in 1.3 zum Blickwinkel passen: das nie benutzte mit dem
besten Rang (Reihenfolge der Tabelle 3.2), sonst das am längsten nicht
benutzte.

### 4.3 Grenzen, ohne Ausnahme

1. **Höchstens ein Meme je Video**, als Hook, als Pointe oder als Bogen aus
   beidem (dann dasselbe Meme). Höchstens ein Jugendwort.
2. **Nie fremder Ton:** kein Originalton, kein Trend-Sound, kein Lied, keine
   Melodie. Alle Töne kommen aus `tools/sfx.py`. TikTok-Geschäftskonten
   dürfen ohnehin nur die Commercial Music Library nutzen.
3. **Nie eine echte Person:** keine Stimme, kein Gesicht, kein Name, keine
   Gesten, keine Figur aus Film, Sendung oder Comic, auch nicht ähnlich
   gezeichnet. Auch nicht in `meta.idee` oder im Beitragstext ("nach Loriot"
   gibt es nicht).
4. **Nie ein Akzent oder Spott:** kein nachgemachter Laut, keine gedehnten
   Vokale, kein Witz über Religion, Herkunft, Sprache, Alter, Körper,
   Geschlecht. Nie über Kunden oder Mitbewerber: kein Witz, der einen Kunden
   ungeschickt oder peinlich dastehen lässt; der Witz liegt auf dem Papier
   ("Karte klebt an der Serviette"), nicht auf der Person. Nie Politik, nie
   ein Unglück. Ein Wunsch nach einem Akzent oder dem Originalton ist eine
   Frage für einen Chat (LG Berlin II, 20.08.2025, 2 O 202/24: auch eine
   Annäherung an eine fremde Stimme verletzt das Persönlichkeitsrecht,
   4.000 Euro Schadensersatz).
5. **Die Aussage bleibt wahr.** Streicht man die Meme-Wörter, bleibt ein Satz
   aus `PRODUKT.md`, Klasse 1. Die Pointe ist selbst eine Aussage über die App
   (`AUTOMATIK.md`, 6.2). Ein Meme macht nichts erlaubt, was sonst verboten
   ist.
6. **Der Satz funktioniert auch ohne das Meme zu kennen.** Zielgruppe sind
   Ladenbesitzer, nicht Jugendliche (in einer kleinen Umfrage mit 92
   Befragten fanden 85 % "bestie" aus Markenmund peinlich, in einer anderen
   fühlten sich rund 58 % angesprochen). Wer M18 nicht kennt, versteht
   trotzdem "Karte weg" und "meldet sich von selbst".
7. **Nur Memes aus Tabelle 3.2.** Keins aus einem Reel eines Mitbewerbers,
   keins aus dem Eingang, keins aus eigener Websuche.
8. **Kein `tools/clip-in.py`** und keine zweite Aufnahme für eine Betonung
   (`AUTOMATIK.md`, Regel 11).
9. Beitragstext wie immer (6.6): derselbe Hook, dieselben fünf Hashtags,
   keine Meme-Hashtags.

### 4.4 Verfallen lassen

- Jedes Meme trägt "prüfen bis". Danach benutzt es der Lauf nicht mehr, bis
  eine begleitete Sitzung eine neue Quelle mit Datum findet und das Datum
  verlängert.
- Faustregel für die Sitzung: zeitlose Satzbauten ein Jahr; Jugendwörter bis
  Ende März nach ihrer Wahl (das neue Jugendwort kommt im Oktober). Ein
  Jugendwort aus einem früheren Jahr bleibt nur, solange es in der Top 10 des
  laufenden Jahres steht (wie M21 "Schere"). Ereignis-Memes drei Monate nach
  dem letzten Beleg; saisonale nur in ihrer Zeit.
- Verwirft oder kritisiert der Betreiber ein Meme: als Wunsch mit
  `art: "text"` notieren ("nie mehr M24"); es gilt ab dann.
- Bekommt ein Wort einen neuen, heiklen Sinn (wie bei M40), streicht es die
  begleitete Sitzung sofort.

### 4.5 Festhalten

- In `script.json`: `meta.hook_muster` (H-Nummer) und `meta.meme` (M-Nummer
  oder `""`). In `meta.idee` nur "Meme-Rahmen M23 (Erwartung und
  Realität), eigene Worte, Bilder und Stimme", ohne Namen.
- Am Video auf dem Board: Felder `hook_muster` und `meme` (Vorschlag,
  Abschnitt 7). Das vorhandene Feld `hook` bleibt die erste Textzeile.

---

## 5. Fertige Hooks für `THEMEN.md`

Erste Textzeile mit `"instant": true`; der Strich | trennt hier erste und
zweite Textzeile. Spalte "Lauf": `ja` = das Thema steht in `THEMEN.md` auf
"ja". Nr. 6 und 16 (T05 und T19) gehen seit dem 17.11.2026 im Format F04
(`FORMATE.md`; `calc-panel` nur als Zusammenfassung, `AUTOMATIK.md` 6.4).
Nr. 1 ist gestrichen (zu nah am Treffer eines
Mitbewerbers); die übrigen Nummern bleiben, damit Verweise stimmen. H02 steht
nur einmal (Nr. 11).

Zeilen mit M-Muster nur an einem Meme-Tag mit freiem Meme (4.1, 4.2); sonst
die Zeile ohne Meme zum selben Thema (T-Nummer), oder, wo es keine gibt, der
Hook aus `THEMEN.md`. Beleg ist der aus `THEMEN.md`.

| Nr. | Thema | Hook | Muster | Lauf |
|---|---|---|---|---|
| 2 | T01 Salon, `verlorener-stammkunde` | Erwartung: zehn Stempel. \| Realität: Karte zerknickt im Portemonnaie. | M23 | ja |
| 3 | T02 Döner, `sperrbildschirm` | Mittagspause. \| Sein Sperrbildschirm sagt: Noch zwei Stempel. | H01 | ja |
| 4 | T03 Eis, `papierkarte` | Die Stempelkarte war in der Badetasche. \| Jetzt ist sie Matsch. | H09 (Hook aus `THEMEN.md`) | ja |
| 5 | T04 Bäckerei, `kein-download` | Eine App für zwei Brötchen? \| Lädt keiner. Muss auch keiner. | H06 | ja |
| 6 | T05 Salon, `rechnung` | Zwei Haarschnitte mehr im Jahr. \| Klingt nach wenig. Rechne mit 40 Stammkunden. | H03 | ja (F04) |
| 7 | T06 Döner, `stempelzahl` | Ein Döner pro Woche, zehn Stempel. \| Das sind zehn Wochen Warten. | H03 | ja |
| 8 | T06 Döner, `stempelzahl` | Unpopuläre Meinung: \| Zehn Stempel bis zum Döner sind zu viele. | M09 | ja |
| 9 | T10 Döner, `team` | Dieser Dönerladen stempelt ohne Stempelkissen. | H07 | ja |
| 10 | T13 Eis, `karte-bleibt` | Deine Eisdiele macht Winterpause. \| Rate mal, was mit den Stempelkarten passiert. | M05 | ja |
| 11 | T14 Bäckerei, `studie` | Jeden Samstag zwei Brötchen. \| Seit drei Wochen nicht mehr. | H02 (Studie S3 erst danach) | ja |
| 12 | T15 Döner, `verlorener-stammkunde` | Acht Stempel. Die Karte ist weg. \| Er auch. | H09 | ja |
| 13 | T16 Bäckerei, `sperrbildschirm` | Kurz vor acht, auf dem Weg zur Bahn. \| Und ihre Stempelkarte meldet sich. | H01 | ja |
| 14 | T17 Döner, `papierkarte` | Sieben Stempel. \| Dann kam die Knoblauchsoße. | H09 | ja |
| 15 | T18 Salon, `kein-download` | Bei diesem Friseur ist die Karte im Handy, \| bevor die Haare trocken sind. | H07 | ja |
| 16 | T19 Eis, `rechnung` | 30 Stammkunden, ein Eis mehr pro Woche. \| Rechne mal den Sommer durch. | H03 | ja (F04) |
| 17 | T20 Salon, `stempelzahl` | Wenn ich einen Salon hätte, \| wäre meine Karte nach fünf Schnitten voll. | H08 | ja |
| 18 | T25 Eis, `sperrbildschirm` | Er denkt gerade nicht an Eis. \| Dann meldet sich seine Stempelkarte. | H01, Pointe M27 | ja |
| 19 | T26 Bäckerei, `papierkarte` | Liebe Papierkarte, wir müssen reden. | M08 | ja |
| 20 | T27 Eis, `kein-download` | Erklär's mir, als wär ich fünf: \| Stempelkarte ohne App? | M04 | ja |

Hinweise: Nr. 3, 13 und 18 zeigen nur den Moment; der Satz mit "in der
Nähe" folgt im Video, mit `shop-map` (1.6). Nr. 3 passt zum Bild der Aussage von T02
(Sperrbildschirm "Noch 2 Stempel bis: Gratis-Döner"). In Nr. 6 und 16 müssen
die Zahlen im Hook zu `calc-panel` passen (T05: 40 × 2; T19: 30 × 16 Wochen). Nr. 12 beginnt mit `paper-card`
(8 von 10, `hit` nach 1.2), nicht mit dem unerprobten `guest-ghost`. Nr. 17
braucht `wallet-pass` mit 5 Feldern wie T20. Nr. 18 an Tagen ohne Meme ohne
die Pointe M27. Uhrzeit und Text auf dem Sperrbildschirm passend: Nr. 3 um
12 Uhr, Nr. 13 um 07:52.

---

## 6. Messen und nachsteuern (begleitete Sitzung)

- Maß für einen Hook: **Skip-Rate** (Ausgangswert 59,7 %), Ø Wiedergabezeit
  (9,0 s), Sends und Likes je Reichweite. Nicht Kommentare (Stichwort).
- Zahlen frühestens 72 Stunden nach dem Posten lesen (Metricool, eigene
  Reels, nur lesen).
- Erster Halt: das Koscher-Video (16.11.2026), Zahlen ab 19.11.2026.
- **Bis fünf Meme-Videos gemessen sind** (je mindestens 72 Stunden alt, das
  Koscher-Video zählt als erstes), gilt 4.1 wie geschrieben: höchstens ein
  Meme in vier Videos.
- Dann vergleicht eine begleitete Sitzung den Median der Skip-Rate dieser
  fünf mit dem der letzten fünf Videos ohne Meme:
  - mit Meme um 5 Punkte oder mehr **niedriger** (besser): der Betreiber
    kann 4.1, Punkt 1 auf "unter den letzten zwei Videos keins" setzen
    (höchstens eins in drei);
  - um 5 Punkte oder mehr **höher** (schlechter): Memes nur noch auf Wunsch
    des Betreibers;
  - dazwischen: bleibt, wie es ist.
  Das entscheidet der Betreiber, nicht der Lauf.
- Kopien eigener Treffer bringen nichts (1.5). Wer testen will: zwei Hooks
  für dasselbe Video als Trial Reels posten (Instagram, laut Berichten seit
  Dezember 2024) und nach Skip-Rate wählen. Das braucht eine zweite Aufnahme
  des ersten Satzes und ist eine Sache für einen Chat.

---

## 7. Was noch offen ist

Eingebunden am 16.11.2026: Leseliste und Schritt 15 in `AUTOMATIK.md`, die
Richtigstellung von C1 in `AUTOMATIK.md` 6.4 und `THEMEN.md`. Offen:

1. Felder `hook_muster` und `meme` am Video auf dem Board: der Lauf schreibt
   sie in `meta` des Skripts; aufs Board erst, wenn die Seite sie zeigt.
2. Erste begleitete Sitzung: Aussprache-Probe (3.1, rund 80 Zeichen).
3. Nach 72 Stunden: Zahlen des Koscher-Videos eintragen (6).
4. Den Betreiber fragen, ob ihm zum Start ein Meme in vier Videos recht ist
   (4.1), und ob "brummt" auch gesprochen werden darf (bis dahin nicht, 1.6;
   im Bild bleibt das Brummen, laut `PRODUKT.md` C1 auf seinen Wunsch).
5. M01 (Koscher) setzt der Lauf nie von selbst ein: der Spruch gehört zu
   einer echten Person, und ein zweites Mal wirkt er nicht mehr neu.

---

## Quellen

Zahlen aus `docs/hooks-daten.md` (Metricool, Marke 7969131, Reels 17.09. bis 16.11.2026,
abgerufen 16.11.2026; taggt_ aus `info.json` vom 15.11.2026). Meme-Urteile,
Herkunft und Daten aus `docs/memes-recherche.md` (46 Quellen) und der Prüfung
(Prüfung vom 16.11.2026). Die wichtigsten:

- Jugendwort 2026: https://www.langenscheidt.com/presse/ragebait-ist-das-jugendwort-des-jahres-2026-von-langenscheidt
- Aura, Jugendwort 2024 (Bekanntgabe 19.10.2024): https://www.zdfheute.de/wissen/aura-jugendwort-des-jahres-2024-100.html ; https://knowyourmeme.com/memes/aura-points
- Erwartung und Realität: https://knowyourmeme.com/memes/expectation-vs-reality
- Red, Green und Beige Flags: https://time.com/6286130/tiktok-beige-flags
- POV: https://knowyourmeme.com/memes/pov-memes
- "Früher war mehr Lametta" nicht geschützt: https://www.justiz.bayern.de/gerichte-und-behoerden/oberlandesgerichte/muenchen/presse/2019/55.php
- "Nein! Doch! Oh!": https://www.filmstarts.de/nachrichten/1000080999.html
- Stimme nachahmen, LG Berlin II, 2 O 202/24: https://www.lto.de/recht/nachrichten/n/2o20224-lg-berlin-ii-manfred-lehmann-synchronsprecher-bruce-willis-recht-an-eigener-stimme ; https://www.lto.de/recht/hintergruende/h/ki-stimme-nachahmen-rechtlicher-schutz-missbrauch-datenschutz-allgemeines-persoenlichkeitsrecht
- Meldung von Apple Wallet in der Nähe ohne Ton (Anbieter-Doku, nur Suchtreffer, Seite in dieser Sitzung nicht erreichbar, **unbestätigt**): https://help.passkit.com/en/articles/12441270-gps-location-notifications-google-wallet-vs-apple-wallet ; Gegenstimme: https://helpcenter.splio.com/kb/guide/en/geofenced-messages-5y55KPdMRZ/Steps/3381904
- TikTok-Musik für Geschäftskonten: https://www.soundstripe.com/blogs/tiktok-music-library-explained
- 63 % in den ersten 3 Sekunden (Sekundärquelle): https://billo.app/blog/hook-rate-to-hold-rate
- Signale Mosseri 2025: https://www.socialmediatoday.com/news/instagram-shares-algorithm-insights-2025/738034/
- Skip-Rate: https://metricool.com/instagram-reel-analytics/
- Trial Reels: https://www.socialmediatoday.com/news/instagram-launches-trial-reels-for-audience-sampling/735136/
- Jugendsprache in Markenwerbung: https://www.bakeryandsnacks.com/Article/2026/08/21/why-internet-slang-can-damage-food-and-drink-brands/ ; https://www.horizont.net/marketing/nachrichten/gen-z-marketing-vier-tipps-wie-marketer-junge-menschen-begeistern-204652
