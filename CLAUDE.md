# StampIT Frontend

React 18 + Vite, kein TypeScript, kein CSS-Framework. Styles sind
Inline-Objekte in einem `styles`/`s`-Objekt am Dateiende. Backend liegt im
Repo `stempelkarte-backend` und wird oft zusammen geaendert.

## Befehle

```bash
npm run build   # vor jedem Push, faengt die meisten Fehler
npm run dev     # lokal, braucht VITE_API_URL auf ein laufendes Backend
npm run lint
```

## Deploy

Push auf `main` startet Vercel, meist unter zwei Minuten - also deutlich
schneller als das Backend auf Render (dort 10-20 Minuten).

**Daraus folgt: das Frontend ist regelmaessig neuer als das Backend.**
Neue Felder in einer Antwort duerfen deshalb nie vorausgesetzt werden:

```js
const ok = res.data.ok !== false   // fehlt bei aelterem Server
```

Und wenn ein Aufruf 404 liefert, ist das meistens kein Fehler im Panel,
sondern ein Backend-Deploy, das noch laeuft. Dem Nutzer auch so sagen.

## Sprachen

Eigene, kleine i18n in `src/i18n.js`: `t('key', { vars })` ersetzt
`{name}`-Platzhalter nur, wenn `vars` uebergeben wird.

**Jeder sichtbare Text braucht alle drei Sprachen: de, en, ar.** Ein
fehlender Schluessel faellt beim Build nicht auf, er steht dann roh in
der Oberflaeche.

Arabisch laeuft RTL (`dir`), Layouts also nicht auf links/rechts
festnageln.

## Regeln fuer Texte

- **Keine Geviertstriche (—)**, normale Bindestriche.
- Nichts behaupten, was die App nicht kann. Auf der Landing Page standen
  einmal "Bestseller" und "30-Tage-Verlauf", beides gab es nicht.
- Sagen, was wirklich passiert: steht der Versand noch aus, heisst es
  "wird verschickt", nicht "versendet".

## Fehler sichtbar machen

`Admin.jsx` hat ein `error`, das **nur** auf dem Login-Bildschirm
gerendert wird. Wer im eingeloggten Panel darauf schreibt, produziert eine
unsichtbare Meldung. Fuer solche Faelle einen eigenen Zustand plus Banner
anlegen (siehe `sortError`).

## Stil

- Kommentare auf Deutsch, sie erklaeren das **Warum**. Umlaute darin
  umschreiben (ae, oe, ue), in Nutzertexten nicht.
- Geteilte Ansichten liegen in `src/components/` (z.B. `StatsView`, das
  Laden und Admin gemeinsam nutzen). Nicht kopieren.

## Umgang

Nicht pushen, ohne dass danach gefragt wurde. Vorher `npm run build`.
