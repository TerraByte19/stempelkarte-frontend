# Landing-Page mit Scroll-Motion — Design

Datum: 2026-09-10
Repo: `stempelkarte-frontend` (v1, Produktion, Vercel)
Betrifft zusätzlich: `Stemplekarte` (Backend, Render) — ein neuer Endpunkt
Vorgänger: `Stemplekarte/docs/specs/2026-08-30-arabisch-rtl-sprache-design.md`

## Ziel

Stampit hat keine öffentliche Seite. `/` leitet Besucher direkt auf `/login` — wer
den Namen hört und die Seite aufruft, sieht ein Anmeldeformular und sonst nichts.

Diese Spec beschreibt eine Marketing-Startseite, deren zentrales Gestaltungsmittel
Bewegung ist: die Stempelkarte selbst führt durch die Seite, füllt sich beim Scrollen
und landet am Ende im Sperrbildschirm. Das Produkt wird vorgeführt, nicht beschrieben.

Zielgruppe: Inhaber kleiner Cafés und Läden, überwiegend am Handy, überwiegend ohne
Vorwissen über Wallet-Pässe.

## Entscheidungen

| Frage | Entscheidung | Grund |
|---|---|---|
| Motion-Charakter | Erzählerisch, Karte als Hauptdarsteller | „Viel Motion“ soll das Produkt erklären, nicht dekorieren |
| Wo lebt die Seite | Im App-Repo, Route `/` für Ausgeloggte | Minimaler Eingriff, kein Risiko für die laufende PWA |
| Animations-Bibliothek | Keine | `position: sticky` + ~40 Zeilen Scroll-Mathe reichen; framer-motion wären ~50 KB in einem Bundle, das Läden täglich laden |
| Stempel pro Karte | 6 (3×2-Raster) | Liest sich am Handy klarer als 8, Bühne wird kürzer |
| Preise | Platzhalter `[Preis]` | Echte Tarife stehen noch nicht fest |
| Haupt-CTA | Kontaktformular | `/register` ist deaktiviert, Läden werden über das Admin-Panel angelegt |

### Verworfen: die mitwandernde Karte

Eine dritte Variante wurde gebaut und geprüft: eine kleine Karte, die durchgehend
über die Seite mitwandert, kippt und dabei Stempel sammelt. **Fällt raus.** Auf dem
Handy nimmt sie dauerhaft Fläche weg und kämpft mit dem Text um Aufmerksamkeit. Der
Prototyp liegt unter `design/` und ist nicht Teil der Umsetzung.

## Architektur

Ein neuer Ordner, sonst wird nichts Bestehendes umgebaut:

```
src/pages/Landing/
  Landing.jsx              Seiten-Gerüst, Reihenfolge der Abschnitte
  Landing.css              Landing-Styles, Klassen mit Präfix .lp-
  useScrollProgress.js     Hook: Fortschritt 0…1 eines Elements im Viewport
  components/
    StampCard.jsx          die Karte
    LockScreen.jsx         Sperrbildschirm mit Wallet-Meldung
    Reveal.jsx             Einblenden für ruhige Abschnitte
  sections/
    Hero.jsx  ValueBand.jsx  HowItWorks.jsx  Features.jsx
    Pricing.jsx  Trust.jsx  WalletFinale.jsx  Contact.jsx  Footer.jsx
```

Jede Datei hat eine Aufgabe. Abschnitte kennen einander nicht, sie bekommen alles
über Props und `useLang()`. `Landing.jsx` setzt nur die Reihenfolge.

`Landing.css` benutzt durchgehend das Präfix `.lp-`, damit nichts mit `App.css`,
`index.css` oder `Layout.css` kollidiert. Die App-Styles werden nicht angefasst.

### Wiederverwendung

`StampCard` erscheint dreimal (Hero, Bühne, Finale) und ist **eine** Komponente mit
einem Zustand:

```jsx
<StampCard stamps={0..6} size="full" | "compact" />
```

Ab `stamps === 6` schaltet sie in den Belohnungs-Zustand: Goldrahmen, goldene
Stempel, Chip „frei“. Kein zweites Kartenbauteil, keine Kopie.

### Der Hook

`useScrollProgress(ref)` liefert eine Zahl 0…1: wie weit ist ein Element durch den
Viewport gescrollt. Ein `requestAnimationFrame`-Durchlauf pro Scroll-Ereignis,
passive Listener, ein gemeinsamer Listener für alle Nutzer des Hooks.

```
progress = clamp(-rect.top / (rect.height - viewportHeight), 0, 1)
```

Bei `prefers-reduced-motion` gibt der Hook konstant `1` zurück — die Endzustände
stehen dann sofort da.

## Routing

`App.jsx`, Funktion `rootElement()`:

```jsx
function rootElement() {
  if (isScannerDevice) return <Navigate to="/scanner" replace />
  if (token)           return <Layout />
  if (isStandalone())  return <Navigate to="/login" replace />
  return <Landing />
}
```

`isStandalone()` prüft `window.matchMedia('(display-mode: standalone)').matches`
oder `navigator.standalone` (iOS). Begründung: Wer Stampit installiert hat und
ausgeloggt ist, will sich anmelden — keine Werbung. `start_url` im Manifest bleibt
`/`, die PWA muss nicht neu installiert werden.

`/login` bleibt unverändert. Alle übrigen Routen bleiben unverändert.

`Landing` liegt innerhalb von `LangProvider` und außerhalb von `Layout` — keine
Sidebar, keine Bottom-Nav.

## Motion

| Abschnitt | Bewegung |
|---|---|
| Hero | Karte schwebt herein und bekommt Stempel 1. Danach dauerhaftes leichtes Wiegen (`bob`, 5,5 s). |
| Value-Band | `Reveal` |
| **So funktioniert’s** | **Bühne** — siehe unten |
| Funktionen, Preise, DSGVO | `Reveal` |
| **Wallet-Finale** | **Auftritt** — siehe unten |
| Kontakt, Footer | `Reveal` |

### Bühne (Abschnitt „So funktioniert’s“)

Der Abschnitt ist 240 svh hoch. Darin klebt eine 100 svh hohe Fläche
(`position: sticky; top: 0`) fest. Über den Scroll-Fortschritt `p`:

| `p` | Was passiert |
|---|---|
| 0,06 → 0,80 | Stempel laufen von 0 auf 6 |
| 0,28 / 0,55 / 0,80 | Text wechselt: Schritt 1 → 2 → 3 → Belohnung |
| 0,80 | Karte schaltet in den Belohnungs-Zustand (Gold) |
| 0,84 → 1,00 | Karte fährt hoch und blendet aus, Sperrbildschirm blendet ein |

Textwechsel als Kreuzblende: 170 ms aus, Inhalt tauschen, 300 ms ein.

### Auftritt (Wallet-Finale, direkt über dem Kontaktformular)

Kein Festkleben. Ein `IntersectionObserver` (Schwelle 0,35) startet die Szene, wenn
der Abschnitt ins Bild kommt: der Sperrbildschirm schiebt sich 12 px hoch und die
Wallet-Meldung erscheint. Läuft einmal, nicht scroll-gesteuert.

### Ruhezustand

Jeder Abschnitt ist **ohne Scrollen lesbar**. `Reveal` startet bei `opacity: 1` und
`translateY(10px)` — nie bei `opacity: 0`. Nichts wartet unsichtbar auf einen
Observer. Grund: Wer mit deaktiviertem JavaScript, langsamer Verbindung oder
Reader-Modus kommt, sieht trotzdem die ganze Seite.

### prefers-reduced-motion

- Bühne verliert `position: sticky`, wird zu einem normalen Abschnitt mit allen drei
  Schritten untereinander und voller Karte
- Kein Wiegen, keine Kreuzblenden, keine Reveals
- Alle Übergänge auf 0,001 ms

## Die Karte

Inhalt, an einem echten Wallet-Pass orientiert:

- Kopf: Logo-Feld, Ladenname, Standort-Kürzel
- Mitte: 6 Stempelplätze im 3×2-Raster. Leer = gestrichelter Kreis, voll = weiße
  Fläche mit Becher-Symbol, bei voller Karte gold
- Fuß: „6 Stempel = 1 Kaffee gratis“, Belohnungs-Chip, QR-Feld, Seriennummer

Der QR ist eine gezeichnete Version-1-Geometrie (21 Module, drei Finder-Ecken,
Timing-Spuren) — kein echter Code, keine Bibliothek. Auf der Landing-Page ist er
Illustration; die echten QR-Codes erzeugt weiterhin `qrcode.react` in der App.

Beispieldaten auf der Seite: „Café Nordwind“, `HH-OTTENSEN`, `STMP-4471-NW`.
Erkennbar ein Beispiel, kein echter Laden.

## Gestaltung

### Farben

Aus dem abgestimmten Mockup, als CSS-Variablen in `Landing.css`:

| Rolle | Wert |
|---|---|
| Marke | `#3C3489` |
| Karte (Verlauf) | `#463DA0` → `#2C2570` |
| Text | `#1A1A2E` |
| Text gedämpft | `#5B5B73` |
| Fläche hell | `#F6F5FB` |
| Linien | `#ECEBF5` |
| Belohnung (Gold) | `#B8801F` |

Gold kommt **nur** im Belohnungs-Moment vor — volle Karte, Goldrahmen, Chip. Sonst
nirgends. Es ist der eine Akzent der Seite und verliert seine Wirkung, sobald es
auch für Buttons oder Überschriften benutzt wird.

### Schriften

- Überschriften: **Space Grotesk** (600/700)
- Fließtext: **Hanken Grotesk** (400/500/600)
- Arabisch: **IBM Plex Sans Arabic** — die beiden Grotesk-Familien haben keine
  arabischen Schnitte. Ohne eigene Schrift fällt Arabisch auf eine
  Systemschrift zurück und die Seite sieht in `ar` kaputt aus.

**Selbst gehostet, nicht von Google geladen.** Die Seite wirbt mit „DSGVO-konform
von Anfang an“. Ein `<link>` auf `fonts.googleapis.com` überträgt bei jedem Aufruf
die IP des Besuchers an Google — in Deutschland abgemahnt (LG München I, 3 O
17493/20). Das wäre ein Widerspruch mitten auf der eigenen Vertrauens-Sektion.

Umsetzung: `woff2`-Dateien nach `public/fonts/`, `@font-face` in `Landing.css`,
`font-display: swap`, Subsets `latin` und `arabic`. Jede Familie mit echter
Fallback-Kette.

## Abschnitte und Inhalt

Reihenfolge (aus dem abgestimmten Aufbau):

1. **Header** — Logo, Anker auf Funktionen / Preise / Kontakt, Sprachwahl, „Anmelden“
2. **Hero** — „Aus Laufkundschaft werden Stammkunden.“ + Karte
3. **Value-Band** — „Keine App im Store. Kein Plastik. Kein Papier, das verloren geht.“
4. **So funktioniert’s** — 3 Schritte: Karte gestalten · Kunde scannt QR · Personal stempelt
5. **Funktionen** — 8 Kacheln: Apple & Google Wallet, Design-Editor, Statistik,
   Newsletter, mehrere Standorte, mehrsprachig, drei Scan-Wege, installierbare PWA
6. **Preise** — 3 Tarife (Start / Laden / Kette), Beträge als `[Preis]`
7. **DSGVO** — Double-Opt-In, Löschen mit einem Klick, Newsletter nur mit Einwilligung
8. **Wallet-Finale** — Sperrbildschirm-Auftritt
9. **Kontakt** — Formular
10. **Footer** — Impressum, Datenschutz, „In Deutschland entwickelt“

## Sprachen und RTL

Alle Texte als `landing_*`-Keys in die bestehenden Blöcke `de` / `en` / `ar` in
`src/i18n.js`. Rund 60 Keys pro Sprache. Kein neues Sprach-Setup — `LangContext`
setzt `document.dir` bereits.

Was bei RTL geprüft werden muss:
- Hero (zweispaltig) — Reihenfolge muss sich spiegeln
- Preis-Raster — „Beliebt“-Markierung sitzt am richtigen Rand
- Bühne und Karte sind symmetrisch, spiegeln sich unkritisch
- Abstände durchgehend `padding-inline` / `margin-inline`, nie `left` / `right`

## Kontaktformular

**Backend, anderes Repo (`Stemplekarte`):**

- Neuer Endpunkt `POST /api/public/contact`, Muster nach `PublicEmailController`
- Neue Methode `sendContactRequestMail(...)` im bestehenden `EmailService`
  (Brevo SMTP, Tageslimit-Schutz, `MAIL_ENABLED` gelten weiter)
- Mail geht an die Betreiber-Adresse, `Reply-To` = Absender
- Freigabe in `SecurityConfig` und `CorsConfig` wie bei den übrigen
  `/api/public/**`-Routen
- Einfache Missbrauchsbremse: Honeypot-Feld plus Zeitsperre pro IP

**Frontend:** Felder Name, Laden, E-Mail, Nachricht. Zustände: leer, wird gesendet,
gesendet, Fehler. Fehlermeldung sagt, was zu tun ist — kein „Ein Fehler ist
aufgetreten“.

Zwei Repos, zwei Deploys. Backend zuerst, sonst läuft das Formular ins Leere.

## Nicht im Umfang

- Kein Test-Framework. Im Repo existiert keines; eines für eine Marketing-Seite
  einzuführen wäre Aufwand ohne Gegenwert.
- Kein Umbau bestehender App-Seiten, kein Umbau von `App.css` / `Layout.css`
- Keine echten Preise
- Kein Blog, keine Referenzen, keine Cookie-Einwilligung — die Seite setzt keine
  Cookies, lädt keine Tracker und bindet nichts von fremden Servern ein
  (Schriften liegen selbst gehostet in `public/fonts/`)

## Prüfliste vor dem Merge

- [ ] iPhone Safari — Bühne klebt sauber, keine Sprünge durch die Adressleiste
- [ ] Android Chrome — dasselbe
- [x] Desktop — Bühne wirkt nicht zu lang
- [x] Arabisch — Spiegelung stimmt in Hero und Preisen
- [x] `prefers-reduced-motion` aktiv — keine Bewegung, alles lesbar
- [ ] JavaScript aus — alle Texte sichtbar
- [x] Eingeloggt auf `/` — weiterhin sofort das Dashboard
- [ ] Installierte PWA, ausgeloggt — landet auf `/login`, nicht auf der Landing-Page
- [ ] Kontaktformular — Mail kommt an, `Reply-To` stimmt
- [ ] Lighthouse Performance ≥ 90 am Handy
- [x] Netzwerk-Tab — keine Anfrage an eine fremde Domain

## Abnahme-Ergebnis (2026-09-10)

Geprüft im Produktions-Build (`npm run build` + `preview`), Chrome:

- **Keine fremde Anfrage.** Alle Ressourcen kommen vom eigenen Host, Schriften
  eingeschlossen. Die DSGVO-Aussage der Seite hält.
- **Bühne.** Bei 60 % Fortschritt: Schritt 3, vier von sechs Stempeln, Karte
  klebt (`top: 0`). Am Ende: sechs Stempel, Goldzustand, Übergabe an den
  Sperrbildschirm.
- **Reduzierte Bewegung.** Fortschritt steht ohne Scrollen auf 1, Karte sofort
  voll, kein Element bei `opacity: 0`, alle Abschnitte sichtbar.
- **Handy 390 px.** Kein waagerechter Überlauf, kein Element ragt über den Rand.
- **Arabisch.** `dir="rtl"`, IBM Plex Sans Arabic greift für Überschrift und
  Fließtext, „Beliebt“-Fähnchen rechts, Aufzählungspunkte rechts.
- **Route.** Eingeloggt auf `/` erscheint weiter das Dashboard, nicht die
  Landing-Page.
- **Bundle.** 812 kB → 423 kB (gzip 244 → 131 kB), siehe unten.

### Zwei Abweichungen von der Spec

1. **Code-Splitting kam dazu.** Ein Besucher lud den kompletten App-Code
   inklusive `html5-qrcode` (~3 MB Quelltext). `Scanner`, `Statistik` und
   `Admin` werden jetzt per `lazy()` nachgeladen, und `Login` holt
   `html5-qrcode` erst beim Klick auf die Kamera. Betrifft Produktionscode,
   den echte Läden täglich nutzen — mit `Suspense`-Platzhalter abgesichert.
2. **PWA-Banner eingeschränkt.** Es erschien auch auf der Landing-Page und
   legte sich über das Value-Band. Zeigt sich jetzt nur noch für eingeloggte
   Besitzer und Scanner-Geräte.

### Noch nicht geprüft

- **Echte Geräte** (iPhone Safari, Android Chrome). Nur Emulation gelaufen. Am
  wichtigsten: ob die Bühne auf iOS beim Ein- und Ausblenden der Adressleiste
  springt — dafür ist `100svh` gesetzt, bestätigt ist es nicht.
- **Lighthouse.** Nicht ausgeführt. Stattdessen die Ursache behoben, die den
  Wert gedrückt hätte (siehe Bundle oben).
- **Kontaktformular gegen das laufende Backend.** Der Endpunkt ist gebaut und
  kompiliert, aber Frontend und Backend liefen nicht gemeinsam.
- **Installierte PWA ausgeloggt.** Der `display-mode: standalone`-Zweig ist im
  Code, aber nicht auf einem installierten Gerät nachgestellt.

## Offene Punkte

- **Preise.** Bleiben `[Preis]`, bis echte Tarife feststehen. Ein Platzhalter-Hinweis
  steht sichtbar über dem Raster.
- **Betreiber-Adresse** für das Kontaktformular ist noch nicht festgelegt.
