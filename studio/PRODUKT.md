# Stampit: was die App kann und was ein Video sagen darf

Diese Liste ist der Maßstab für jeden Satz in einem Video. Eine Aussage über
die App kommt nur ins Skript, wenn sie hier steht. Quelle ist die Landing
Page: `src/i18n.js`, deutscher Block, Schlüssel mit `lp_` (Stand 16.11.2026,
Zeilen 501 bis 683). Was dort nicht steht, wird nicht behauptet, auch wenn es
plausibel klingt, ein Mitbewerber es sagt oder es in
`src/pages/Landing/branchen.json` steht.

## Zwei Klassen

Nicht jeder `lp_`-Text ist auf der Seite auch zu sehen. Deshalb gibt es zwei
Klassen:

- **Klasse 1, gesichert:** der Text wird auf der Landing Page dieses Branches
  angezeigt. Nachgesehen am 16.11.2026 in `src/pages/Landing/sections/`: die
  Abschnitte Hero, ValueBand, Proof, HowItWorks, Features, Trust,
  WalletFinale und Footer benutzen die Schlüssel `lp_hero_*`, `lp_value_*`,
  `lp_proof_*`, `lp_how_*`, `lp_feat_*`, `lp_trust_*`, `lp_wallet_*` und
  `lp_foot_*`.
- **Klasse 2, nur im Tarifvergleich genannt, vom Betreiber noch nicht
  bestätigt:** der Text steht nur unter einem Schlüssel `lp_price_*`. Diese
  Schlüssel benutzt auf diesem Branch keine Seite (in `src/` kommen sie nur
  in `src/i18n.js` vor). Ob es die Funktion so gibt, hat niemand bestätigt.

**Version 1 der Automatik benutzt nur Klasse 1.** Eine Zeile wandert erst von
Klasse 2 nach Klasse 1, wenn der Betreiber die Funktion bestätigt hat; das
trägt eine begleitete Sitzung hier ein, nie ein unbeaufsichtigter Lauf.

So wird die Liste benutzt:

1. Vor jedem Skript jede Aussage über die App einer Zeile in Klasse 1
   zuordnen und die Nummer im Skript unter `meta.beleg` notieren (freies
   Feld, wird nicht ausgewertet).
2. Die Spalte "Im Video" beachten. "Kein Bild" heißt: es gibt dafür noch
   keinen Baustein, die Aussage bleibt draußen (Textregel 2 im Playbook).
3. Ändert sich die Landing Page, gilt die Landing Page. Nachsehen mit
   `grep -n "lp_" src/i18n.js | sed -n '1,190p'` und diese Datei in einer
   begleiteten Sitzung nachziehen.

Sinngemäß sagen ist erlaubt, mehr sagen nicht. "Kein Download" darf "ohne App"
heißen, aber nicht "ohne Anmeldung".

## Klasse 1: gesichert

### Die Karte

| Nr. | Aussage | Wortlaut der Landing Page | Schlüssel | Im Video |
|---|---|---|---|---|
| A1 | Die Stempelkarte liegt in Apple Wallet und Google Wallet. | "Die digitale Stempelkarte liegt in Apple und Google Wallet." | `lp_hero_body`, `lp_feat_1_t` | ja (`wallet-pass`) |
| A2 | Kein Download, keine App für die Kunden. | "Kein Store, kein Download. Danach liegt die Karte in der Wallet." | `lp_how_2_b`, `lp_value_title` | ja (`wallet-pass`) |
| A3 | Der Kunde scannt einmal einen QR-Code und hat die Karte auf dem Handy. | "Der Kunde scannt einmal und hat die Karte für immer auf dem Handy." | `lp_value_body`, `lp_how_2_t` | ja (`wallet-pass`) |
| A4 | Kein Plastik, kein Papier, das verloren geht oder im Portemonnaie zerfällt. | "Kein Download, kein Plastik, kein Papier, das im Portemonnaie zerfällt." | `lp_hero_body`, `lp_value_title` | ja (`paper-card`, `wallet-vanish`) |
| A6 | Aus Laufkundschaft werden Stammkunden (als Ziel, nicht als Zusage). | "Aus Laufkundschaft werden Stammkunden." | `lp_hero_title` | ja, als Satz |

### Stempeln im Laden

| Nr. | Aussage | Wortlaut der Landing Page | Schlüssel | Im Video |
|---|---|---|---|---|
| B1 | Das Personal stempelt mit der Handy-Kamera. | "Mit der Handy-Kamera scannen." | `lp_how_3_t`, `lp_how_3_b` | ja (`wallet-pass`, Scan) |
| B2 | Der Stempel ist sofort auf dem Handy des Kunden. | "Der Stempel ist sofort auf dem Kundenhandy." | `lp_how_3_b` | ja (`wallet-pass`, Stempel) |

### Die Karte meldet sich

| Nr. | Aussage | Wortlaut der Landing Page | Schlüssel | Im Video |
|---|---|---|---|---|
| C1 | Kommt der Kunde in die Nähe des Ladens, zeigt sein Handy die Karte von selbst auf dem Sperrbildschirm, mit dem Stand als Text (zum Beispiel "Noch 2 Stempel bis: Gratis-Kaffee"). Ist sie voll, steht dort "Gratis-Kaffee wartet auf dich". | "Ist die Karte voll, meldet sie sich auf dem Sperrbildschirm, in der Nähe deines Ladens, ohne dass du etwas tust." (sagt nur "voll", siehe unten) | `lp_wallet_body`, `lp_wallet_title`, `lp_how_4_b`, `lp_proof_app_b` | ja (`lock-notification`, `shop-map`) |

Zu C1: Die Karte meldet sich in Ladennähe **immer**, nicht erst, wenn sie
voll ist. Das hat der Betreiber am 16.11.2026 richtiggestellt, und so steht
es im Backend (`stempelkarte-backend`, `wallet/ApplePassService.java`,
`sperrbildschirmOrte`: Text "Noch {n} {Einheit} bis: {Belohnung}", voll
"{Belohnung} wartet auf dich", offenes Willkommensgeschenk "{Geschenk} -
wartet auf dich"). Die Landing Page und ein alter Kommentar in `Shop.java`
sagen nur "voll"; das ist zu wenig, nicht falsch. Ein Video sagt "in der
Nähe" ohne Entfernung und ohne, wie oft. Der Laden kann die Funktion
abschalten, sie braucht seine Adresse. Dass das Handy dabei vibriert, zeigen
die Videos auf Wunsch des Betreibers als Stilmittel. Automatische Nachrichten
(nach langer Pause, zum Geburtstag, ein Angebot) sind Klasse 2; was der Laden
selbst an seine Kunden schickt, ist C3.

| Nr. | Aussage | Wortlaut der Landing Page | Schlüssel | Im Video |
|---|---|---|---|---|
| C3 | Der Laden kann seinen Kunden Push-Nachrichten schicken (Push-Kampagnen an Kundengruppen, planbar, mit Vorlagen). Sie erscheinen als Mitteilung der Karte auf dem Handy. Text höchstens 160 Zeichen; nur in Tarifen mit Kampagnen. | "Push-Kampagnen an Kundengruppen", "Push-Kampagnen, planbar, mit Vorlagen" | `lp_price_c_kampagnen`, `lp_price_f_kampagnen`, `lp_price_f_gruppen` | kein Bild (eine Mitteilung des Ladens auf dem Sperrbildschirm bekommt `phone-3d` gerade; bis dahin nur in begleiteten Sitzungen) |

Zu C3: Am 19.11.2026 vom Betreiber bestätigt ("Wir können auch Nachrichten
schreiben"). Im Backend `controller/KampagnenController.java` und
`model/Kampagne.java` ("ein Text vom Laden an eine Zielgruppe seiner
Kunden", höchstens 160 Zeichen), im Panel `src/components/KampagnenSection.jsx`,
freigeschaltet über den Tarif (`TarifPruefung`, Funktion KAMPAGNEN). Ein Video
sagt "Nachrichten" oder "Mitteilung aufs Handy", nicht "SMS" oder "WhatsApp"
(N9), und verspricht keine Wirkung. Automatische Nachrichten (Geburtstag,
lange Pause) bleiben Klasse 2 (C4, C2).

### Gestalten

| Nr. | Aussage | Wortlaut der Landing Page | Schlüssel | Im Video |
|---|---|---|---|---|
| D1 | Der Laden gestaltet die Karte selbst: Farben, Logo, Stempel-Symbol. | "Farben, Logo, Stempel-Symbol und wie viele Stempel bis zur Belohnung." | `lp_how_1_t`, `lp_how_1_b`, `lp_feat_2_b` | kein Bild für den Editor; die fertige Karte zeigen (`wallet-pass`) |
| D2 | Der Laden legt selbst fest, wie viele Stempel es bis zur Belohnung braucht. | "wie viele Stempel bis zur Belohnung" | `lp_how_1_b` | ja (`paper-card`, `wallet-pass` mit anderer Stempelzahl) |

### Auswerten und schreiben

| Nr. | Aussage | Wortlaut der Landing Page | Schlüssel | Im Video |
|---|---|---|---|---|
| E1 | Statistik: Stoßzeiten, Neukunden, 2-Wochen-Verlauf, Tagesdetail. | "Stoßzeiten, Neukunden, 2-Wochen-Verlauf, Tagesdetail per Klick." | `lp_feat_3_t`, `lp_feat_3_b` | kein Bild |
| E2 | Newsletter per E-Mail, mit Bildern, nur an Kunden mit Einwilligung. | "Mit Bildern, Versand-Verlauf, nur an Kunden mit Einwilligung." | `lp_feat_4_b`, `lp_trust_3_b` | kein Bild |
| E4 | Mehrsprachig: Deutsch, Englisch und Arabisch. | "Mehrsprachig", "Deutsch, Englisch und Arabisch." | `lp_feat_5_t`, `lp_feat_5_b` | nur gesprochen. Nicht ausführen, was genau übersetzt ist: das sagt die Landing Page nicht |

### Datenschutz

| Nr. | Aussage | Wortlaut der Landing Page | Schlüssel | Im Video |
|---|---|---|---|---|
| F1 | DSGVO-konform und in Deutschland entwickelt. | "DSGVO-konform und in Deutschland entwickelt" | `lp_hero_note`, `lp_foot_made`, `lp_trust_title` | nur gesprochen |
| F2 | Double-Opt-In: jeder Kunde bestätigt seine E-Mail-Adresse, bevor eine Karte aktiv wird. | "Jeder Kunde bestätigt seine E-Mail-Adresse, bevor eine Karte aktiv wird." | `lp_trust_1_b` | kein Bild |
| F3 | Jede Mail trägt einen Lösch-Link; nach Bestätigung sind alle Daten weg. | "Jede Mail trägt einen Lösch-Link. Nach Bestätigung sind alle Daten weg, unwiderruflich." | `lp_trust_2_b` | kein Bild |
| F4 | Werbung geht nur an Kunden, die ausdrücklich zugestimmt haben. | "Werbung geht ausschließlich an Kunden, die ausdrücklich zugestimmt haben." | `lp_trust_3_b` | kein Bild |

### Zahlen aus Studien

Die Landing Page zeigt fünf Zahlen mit Quelle (Abschnitt Proof). Sie sind
keine Aussagen über die App. Ein Video darf höchstens eine davon verwenden,
genau so wie sie dasteht, und nennt die Quelle im gesprochenen Satz ("laut
Harvard Business Review"). Keine Fußnote im Bild.

| Nr. | Zahl | Was sie sagt | Quelle laut Landing Page | Schlüssel | Vorsicht |
|---|---|---|---|---|---|
| S1 | 90 % | der Deutschen sammeln bereits Punkte | GfK im Auftrag von Mastercard, 2023 | `lp_proof_1_n`, `lp_proof_1_t`, `lp_proof_1_src` | sagt nichts über Stempelkarten kleiner Läden |
| S2 | +25 bis +95 % | Gewinn bei 5 % mehr Kundenbindung | Frederick Reichheld, Bain & Company, in: Harvard Business Review 2014 | `lp_proof_2_n`, `lp_proof_2_t`, `lp_proof_2_src` | nie als Zusage für den eigenen Laden |
| S3 | 5- bis 25-mal | teurer ist ein neuer Kunde als einer, der bleibt | Harvard Business Review, 2014 | `lp_proof_3_n`, `lp_proof_3_t`, `lp_proof_3_src` | Spanne nennen, nicht nur die 25 |
| S4 | 82 % | der Gastronomen sehen mehr Wiederbesuche | Square Future of Commerce 2025 | `lp_proof_4_n`, `lp_proof_4_t`, `lp_proof_4_b`, `lp_proof_4_src` | befragt wurden Betriebe in den USA, Kanada, Großbritannien und Australien, nicht in Deutschland |
| S5 | 42 % | öffnen ihre Bonus-App nur einmal im Monat oder seltener | workinghead mit YouGov, April 2025 | `lp_proof_app_n`, `lp_proof_app_t`, `lp_proof_app_src` | der Wert gilt für die App eines Supermarkts (Kaufland), nicht für Apps allgemein |

### Beispielrechnungen

Eine Rechnung im Video ist keine Aussage über die App, sondern ein Beispiel.
Sie ist erlaubt, wenn sie als Beispiel erkennbar ist ("Kommen 40 Stammkunden
..."), aufgeht (der Baustein `calc-panel` rechnet das Produkt nach) und nichts
verspricht. Der Betreiber mag sie mit wenigen Stammkunden, die öfter kommen,
und ohne Kleingedrucktes darunter.

## Klasse 2: nur im Tarifvergleich genannt, vom Betreiber noch nicht bestätigt

**Nichts davon kommt in Version 1 in ein Video**, weder gesprochen noch im
Bild, auch nicht als Nebensatz. Die Nummern bleiben, damit eine bestätigte
Zeile ohne Umbenennen nach oben wandern kann.

| Nr. | Was der Text sagt | Wortlaut | Schlüssel (alle nur `lp_price_*`) |
|---|---|---|---|
| A5 | Es gibt Stempel-, Punkte-, Mitglieds- und 10er-Karten. | "Stempel-, Punkte-, Mitglieds- und 10er-Karte" | `lp_price_c_typen`, `lp_price_f_typen` |
| B3 | Der Laden braucht kein eigenes Gerät: der Scanner läuft auf jedem Handy mit Kamera. | "Der Scanner läuft auf jedem Handy mit Kamera." | `lp_price_faq_3_a`, `lp_price_c_team`, `lp_price_f_scanner` |
| B4 | Zugänge für Mitarbeiter und Aushilfen. | "Zugänge für Mitarbeiter und Aushilfen" | `lp_price_c_team`, `lp_price_f_team` |
| B5 | Kundenliste, in der sich Stempel korrigieren lassen. | "Kundenliste mit Stempel-Korrektur" | `lp_price_f_liste` |
| B6 | QR-Aufkleber zum Ausdrucken. | "QR-Aufkleber zum Ausdrucken" | `lp_price_f_aufkleber` |
| C2 | Einfache Push-Benachrichtigungen: in der Nähe des Ladens, nach jedem Stempel, und wenn Kunden länger nicht da waren. | "Einfache Push-Benachrichtigungen", "In der Nähe des Ladens", "Nach jedem Stempel", "Wenn Kunden länger nicht da waren" | `lp_price_c_auto`, `lp_price_g_auto`, `lp_price_f_nah`, `lp_price_f_stempel`, `lp_price_f_rueckhol` |
| C4 | Automatische Nachrichten, zum Beispiel zum Geburtstag oder nach dem zweiten Besuch. | "Automatische Nachrichten, z. B. zum Geburtstag", "Automatische Nachrichten (Geburtstag, zweiter Besuch …)" | `lp_price_c_autonachr`, `lp_price_f_autonachr` |
| C5 | Ein Tagesangebot kann auf der Karte stehen. | "Tagesangebot auf der Karte", "Tagesangebot und Newsletter" | `lp_price_f_tagesangebot`, `lp_price_c_angebot` |
| C6 | Eigene Automationen im Baukasten. | "Eigene Automationen im Baukasten" | `lp_price_f_baukasten` |
| D3 | Willkommensgeschenk für neue Kunden. | "Willkommensgeschenk für neue Kunden" | `lp_price_f_willkommen`, `lp_price_c_design` |
| D4 | Stufen für Stammkunden. | "Stufen für Stammkunden" | `lp_price_f_stufen` |
| D5 | Kunde wirbt Kunde, mit Bonus für beide. | "Kunde wirbt Kunde, mit Bonus für beide" | `lp_price_c_empfehlung`, `lp_price_f_empfehlung` |
| E3 | Google-Bewertungen und Rückmeldungen. | "Google-Bewertungen und Rückmeldungen" | `lp_price_f_bewertung` |
| E5 | Für Ketten: Schnittstelle (API und Webhooks), persönliche Einrichtung, ein Ansprechpartner für alle Filialen. | "Schnittstelle (API und Webhooks)", "Persönliche Einrichtung", "Ein Ansprechpartner für alle Filialen" | `lp_price_c_api`, `lp_price_c_setup`, `lp_price_c_kontakt` |
| G1 | 14 Tage gratis testen, keine Kreditkarte nötig, monatlich kündbar. | "14 Tage gratis", "Keine Kreditkarte nötig", "Monatlich kündbar" | `lp_price_trust_1`, `lp_price_trust_2`, `lp_price_trust_3` |
| G2 | Nach den 14 Tagen endet der Test ohne Kosten, wenn der Laden nicht zusagt. | "Ohne deine Zusage endet der Test, es entstehen keine Kosten." | `lp_price_faq_1_a` |
| G3 | Drei Tarife: Basic, Pro, Kette. | "Basic für den einzelnen Laden. Pro, wenn du deinen Kunden selbst Nachrichten schicken willst. Kette für viele Filialen." | `lp_price_body`, `lp_price_basic_sub`, `lp_price_pro_sub`, `lp_price_kette_sub` |
| G4 | Basic: ein Standort, bis 100 Kunden; wer mehr hat, wird nicht abgewiesen. | "1 Standort", "Bis 100 Kunden", "Deine Kunden können sich weiter anmelden, niemand wird abgewiesen." | `lp_price_loc_basic`, `lp_price_kunden_basic`, `lp_price_faq_5_a` |
| G5 | Pro: bis 4 Filialen, unbegrenzt viele Kunden. Kette: ab 5 Filialen, Preis auf Anfrage. | "Bis 4 Filialen", "Unbegrenzt viele Kunden", "Ab 5 Filialen", "Auf Anfrage" | `lp_price_loc_pro`, `lp_price_unlimited`, `lp_price_loc_kette`, `lp_price_ask` |
| G6 | Jährlich zahlen heißt: 11 Monate bezahlen, 12 bekommen. | "Du bezahlst 11 Monate und bekommst 12." | `lp_price_faq_4_a`, `lp_price_save` |
| G7 | Der Tarif lässt sich später wechseln, Karten und Kunden bleiben. | "Ja. Deine Karten und Kunden bleiben beim Wechsel erhalten." | `lp_price_faq_2_a` |
| G8 | Laden wirbt Laden: beide bekommen einen Monat gratis. | "Wenn er bei uns startet, bekommt ihr beide einen Monat gratis." | `lp_price_ref_body` |

Auch nach einer Bestätigung gilt für G1 bis G8 die Textregel 6 des Playbooks:
Preise und "14 Tage gratis" stehen nie im Bild, das Schlussbild bleibt bei
Frage, Stichwort und Logo. Und welche Funktion in welchem Tarif steckt, sagt
ein Video nie.

Die Frage an den Betreiber dazu steht in `START.md` ("Was der Betreiber noch
entscheiden muss").

## Was ein Video nie sagt

| Nr. | Nicht sagen | Warum |
|---|---|---|
| N1 | "ohne Anmeldung", "ohne E-Mail", "anonym", "ohne Daten" | Jeder Kunde bestätigt seine E-Mail-Adresse, bevor die Karte aktiv wird (`lp_trust_1_b`). "Kein Download" stimmt, "keine Anmeldung" nicht. |
| N2 | "Niemand verfolgt dich", "kein Tracking", "wir wissen nicht, wo du bist" | Die Landing Page sagt dazu nichts. Erlaubt sind nur F1 bis F4. Ebenso wenig: "wir sehen, wo deine Kunden gerade sind". |
| N3 | Entfernungen, Tage, Wochen oder Häufigkeiten bei Benachrichtigungen ("im Umkreis von 100 Metern", "nach vier Wochen", "jedes Mal, wenn jemand vorbeigeht") | Steht nirgends in den `lp_`-Texten. |
| N4 | "Bestseller", "30-Tage-Verlauf", Umsatz- oder Gewinnzahlen in der Statistik | "Bestseller" und "30-Tage-Verlauf" standen einmal auf der Landing Page und gab es nicht. Die Statistik ist E1, nicht mehr. |
| N5 | Erfolgsversprechen: "garantiert", "verdoppelt", "mehr Umsatz", "nie wieder einen Kunden verlieren" | Die App verspricht kein Ergebnis. Zahlen nur als Beispielrechnung oder als Studie mit Quelle. |
| N6 | Preise in Euro | In den `lp_`-Texten steht kein Betrag. Und nach Textregel 6 kommen Preise ohnehin nicht ins Bild. |
| N7 | "kostenlos" oder "gratis" für die App selbst, "14 Tage gratis testen" | Der Test steht nur im Tarifvergleich (G1, Klasse 2). |
| N8 | "Lade die Stampit-App", "im App Store" | Es gibt keine App für Kunden. Genau das ist die Aussage A2. |
| N9 | SMS, WhatsApp, Anrufe | Belegt sind die Karte auf dem Sperrbildschirm in Ladennähe (C1) und Newsletter per E-Mail (E2). |
| N10 | Anbindung an eine Kasse, an Lieferdienste, an Buchungs- oder Terminsysteme, Bezahlen mit der Karte | Steht nirgends. |
| N11 | Weitere Sprachen, zum Beispiel Türkisch | `lp_feat_5_b` nennt Deutsch, Englisch und Arabisch. `branchen.json` nennt zusätzlich Türkisch; solange das nicht unter einem `lp_`-Schlüssel steht, bleibt es draußen. |
| N12 | Zahl der Läden oder Kunden, die Stampit nutzen, Kundenstimmen, "Marktführer", "Nummer 1", Vergleiche mit Mitbewerbern beim Namen | Nichts davon ist belegt. |
| N13 | "Funktioniert ohne Internet", "auf jedem Handy", "kein eigenes Gerät nötig" | Belegt sind Apple Wallet und Google Wallet (A1) und das Scannen mit der Handy-Kamera (B1). Mehr zum Gerät steht nur in Klasse 2 (B3). |
| N14 | Dass die Karte sich meldet, wenn ein Kunde lange nicht da war, Geburtstag hat oder ein Angebot läuft | Klasse 2 (C2, C4, C5). Dass der Laden selbst Nachrichten schickt, ist seit 19.11.2026 Klasse 1 (C3). Gesichert ist allein, dass die Karte in der Nähe des Ladens auf dem Sperrbildschirm erscheint (C1). |
| N15 | Willkommensgeschenk, Kunde wirbt Kunde, Stufen, Punkte-, Mitglieds- oder 10er-Karte, Zugänge für Aushilfen | Klasse 2 (A5, B4, D3 bis D5). |

Ist ein Satz weder in Klasse 1 erlaubt noch hier verboten: er ist nicht
belegt und bleibt draußen. Ein unbeaufsichtigter Lauf klärt so etwas nicht
selbst, sondern schreibt es als Frage in die Antwort oder in die Meldung des
Laufs.
