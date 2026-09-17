# Landing-Page mit Scroll-Motion — Umsetzungsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eine öffentliche Marketing-Startseite auf `/`, deren Stempelkarte beim Scrollen durch die Seite führt, sich füllt und im Sperrbildschirm landet.

**Architecture:** Ein neuer, in sich geschlossener Ordner `src/pages/Landing/`. Nichts Bestehendes wird umgebaut außer vier Zeilen in `App.jsx` und neuen Keys in `i18n.js`. Bewegung entsteht aus `position: sticky` plus einem Hook, der den Scroll-Fortschritt eines Elements als Zahl 0…100 liefert — keine Animations-Bibliothek.

**Tech Stack:** React 19, Vite 8, react-router-dom 7, reines CSS. Tests mit `node --test` (in Node 24 eingebaut, keine neue Abhängigkeit). Schriften über `@fontsource` (self-hosted woff2).

Spec: `docs/specs/2026-09-10-landing-page-motion-design.md`
Branch: `landing-page` (nicht nach `main` pushen — `main` deployt automatisch auf Vercel)

## Global Constraints

- **Keine Animations-Bibliothek.** Kein framer-motion, kein GSAP, kein AOS.
- **Kein Test-Framework.** Nur `node --test`, eingebaut. Keine neue devDependency außer den drei `@fontsource`-Paketen.
- **Keine fremden Server zur Laufzeit.** Keine Anfrage an `fonts.googleapis.com`, `fonts.gstatic.com`, CDNs oder Tracker. Schriften liegen im eigenen Bundle.
- **CSS-Namensraum `lp-`.** Jede neue Klasse beginnt mit `lp-`. `App.css`, `index.css`, `Layout.css` werden nicht angefasst.
- **Alles ohne Scrollen lesbar.** Kein Element startet bei `opacity: 0`. Reveals beginnen bei voller Deckkraft und bewegen nur `translateY`.
- **`prefers-reduced-motion` wird respektiert.** Bühne verliert `sticky`, alle Übergänge auf 0,001 ms, Karte steht voll.
- **Richtungsneutrale Abstände.** `padding-inline` / `margin-inline` / `inset-inline`, nie `left` / `right`.
- **6 Stempel** pro Karte, 3×2-Raster.
- **Gold `#B8801F` nur im Belohnungs-Moment.** Nirgends sonst.
- **Preise bleiben `[Preis]`.**
- **Commit nach jeder Aufgabe.** Kein Push.

## Farb-Token (verbindlich)

| Variable | Wert |
|---|---|
| `--lp-brand` | `#3C3489` |
| `--lp-card-from` | `#463DA0` |
| `--lp-card-to` | `#2C2570` |
| `--lp-ink` | `#1A1A2E` |
| `--lp-muted` | `#5B5B73` |
| `--lp-surface` | `#FFFFFF` |
| `--lp-surface-2` | `#F6F5FB` |
| `--lp-line` | `#ECEBF5` |
| `--lp-gold` | `#B8801F` |

---

### Task 1: Scroll-Fortschritt

Die einzige echte Logik der ganzen Seite. Deshalb als reine Funktion, getestet, getrennt vom Hook.

**Files:**
- Create: `src/pages/Landing/progressOf.js`
- Create: `src/pages/Landing/progressOf.test.js`
- Create: `src/pages/Landing/useScrollProgress.js`
- Modify: `package.json` (Skript `test`)

**Interfaces:**
- Produces: `progressOf(top, height, viewportHeight) -> number` (0…1)
- Produces: `useScrollProgress(ref) -> number` (0…100, ganzzahlig). Setzt zusätzlich die CSS-Variable `--lp-p` (0…1, ungerundet) auf dem Element.

- [ ] **Step 1: Test schreiben**

`src/pages/Landing/progressOf.test.js`:

```js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { progressOf } from './progressOf.js'

test('0 solange das Element noch unter dem Viewport steht', () => {
  assert.equal(progressOf(800, 2400, 800), 0)
})

test('0 genau wenn die Oberkante den oberen Rand erreicht', () => {
  assert.equal(progressOf(0, 2400, 800), 0)
})

test('0,5 in der Mitte des Scrollwegs', () => {
  assert.equal(progressOf(-800, 2400, 800), 0.5)
})

test('1 am Ende des Scrollwegs', () => {
  assert.equal(progressOf(-1600, 2400, 800), 1)
})

test('bleibt bei 1, auch weit darueber hinaus', () => {
  assert.equal(progressOf(-9999, 2400, 800), 1)
})

test('0 wenn das Element kuerzer als der Viewport ist', () => {
  assert.equal(progressOf(-100, 400, 800), 0)
})

test('0 wenn Element und Viewport exakt gleich hoch sind', () => {
  assert.equal(progressOf(-100, 800, 800), 0)
})
```

- [ ] **Step 2: Test laufen lassen, Fehlschlag bestätigen**

```bash
cd "C:/Project SK/stempelkarte-frontend"
node --test src/pages/Landing/
```

Erwartet: FAIL, `Cannot find module './progressOf.js'`

- [ ] **Step 3: Funktion schreiben**

`src/pages/Landing/progressOf.js`:

```js
/**
 * Wie weit ist ein Element durch den Viewport gescrollt?
 *
 * @param {number} top    getBoundingClientRect().top
 * @param {number} height getBoundingClientRect().height
 * @param {number} viewportHeight window.innerHeight
 * @returns {number} 0 = Oberkante gerade am oberen Rand, 1 = Unterkante am unteren Rand.
 *                   Ist das Element nicht hoeher als der Viewport, gibt es keinen
 *                   Scrollweg — dann immer 0.
 */
export function progressOf(top, height, viewportHeight) {
  const span = height - viewportHeight
  if (span <= 0) return 0
  const p = -top / span
  if (p < 0) return 0
  if (p > 1) return 1
  return p
}
```

- [ ] **Step 4: Test laufen lassen, Erfolg bestätigen**

```bash
node --test src/pages/Landing/
```

Erwartet: `# pass 7`, `# fail 0`

- [ ] **Step 5: Hook schreiben**

`src/pages/Landing/useScrollProgress.js`:

```js
import { useEffect, useState } from 'react'
import { progressOf } from './progressOf.js'

/**
 * Liefert den Scroll-Fortschritt eines Elements als ganze Zahl 0…100.
 *
 * Ganzzahlig, damit React hoechstens 100 mal neu rendert statt bei jedem Frame.
 * Fuer weiche Uebergaenge setzt der Hook zusaetzlich die CSS-Variable --lp-p
 * (0…1, ungerundet) direkt auf dem Element — das laeuft ohne Render.
 *
 * Bei prefers-reduced-motion steht der Wert fest auf 100 (Endzustand).
 */
export function useScrollProgress(ref) {
  const [pct, setPct] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.style.setProperty('--lp-p', '1')
      setPct(100)
      return
    }

    let queued = false

    const read = () => {
      queued = false
      const rect = el.getBoundingClientRect()
      const p = progressOf(rect.top, rect.height, window.innerHeight)
      el.style.setProperty('--lp-p', String(p))
      setPct(Math.round(p * 100))
    }

    const onScroll = () => {
      if (queued) return
      queued = true
      requestAnimationFrame(read)
    }

    read()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [ref])

  return pct
}
```

- [ ] **Step 6: Test-Skript eintragen**

In `package.json`, im Block `"scripts"`, nach `"lint"` einfügen:

```json
    "test": "node --test src/**/*.test.js",
```

- [ ] **Step 7: Prüfen**

```bash
npm test
```

Erwartet: `# pass 7`, `# fail 0`

- [ ] **Step 8: Commit**

```bash
git add src/pages/Landing/progressOf.js src/pages/Landing/progressOf.test.js src/pages/Landing/useScrollProgress.js package.json
git commit -m "feat: Scroll-Fortschritt-Hook fuer die Landing-Page"
```

---

### Task 2: Schriften selbst hosten

**Files:**
- Modify: `package.json`
- Create: `src/pages/Landing/Landing.css`

**Interfaces:**
- Produces: `Landing.css` mit allen `--lp-*`-Farb-Token und den Schrift-Familien. Jede spätere Aufgabe schreibt in diese Datei.

Warum `@fontsource` statt Dateien von Hand nach `public/fonts/`: gleiches Ergebnis (woff2 im eigenen Bundle, keine Anfrage an Google), aber versioniert und von Vite mit Hash ausgeliefert.

- [ ] **Step 1: Pakete installieren**

```bash
cd "C:/Project SK/stempelkarte-frontend"
npm install @fontsource/space-grotesk @fontsource/hanken-grotesk @fontsource/ibm-plex-sans-arabic
```

- [ ] **Step 2: Installation prüfen**

```bash
ls node_modules/@fontsource/space-grotesk/files | head -3
ls node_modules/@fontsource/hanken-grotesk/files | head -3
ls node_modules/@fontsource/ibm-plex-sans-arabic/files | head -3
```

Erwartet: jeweils `.woff2`-Dateien. Kommt bei einem Paket ein Fehler, prüfe den genauen Paketnamen mit `npm view <name> versions` und passe ihn hier und in Step 3 an.

- [ ] **Step 3: Landing.css anlegen**

`src/pages/Landing/Landing.css`:

```css
/* Schriften — selbst gehostet. Keine Anfrage an fonts.googleapis.com:
   die Seite wirbt mit DSGVO-Konformitaet, ein Google-Font-Link waere ein
   Widerspruch mitten auf der eigenen Vertrauens-Sektion. */
@import '@fontsource/space-grotesk/500.css';
@import '@fontsource/space-grotesk/600.css';
@import '@fontsource/space-grotesk/700.css';
@import '@fontsource/hanken-grotesk/400.css';
@import '@fontsource/hanken-grotesk/500.css';
@import '@fontsource/hanken-grotesk/600.css';
@import '@fontsource/ibm-plex-sans-arabic/400.css';
@import '@fontsource/ibm-plex-sans-arabic/600.css';

.lp {
  --lp-brand: #3C3489;
  --lp-card-from: #463DA0;
  --lp-card-to: #2C2570;
  --lp-ink: #1A1A2E;
  --lp-muted: #5B5B73;
  --lp-surface: #FFFFFF;
  --lp-surface-2: #F6F5FB;
  --lp-line: #ECEBF5;
  --lp-gold: #B8801F;

  --lp-display: 'Space Grotesk', system-ui, 'Segoe UI', sans-serif;
  --lp-body: 'Hanken Grotesk', system-ui, 'Segoe UI', sans-serif;

  --lp-gutter: 20px;
  --lp-max: 1120px;

  background: var(--lp-surface);
  color: var(--lp-ink);
  font-family: var(--lp-body);
  font-size: 16px;
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
}

/* Arabisch bekommt eine eigene Familie — Space Grotesk und Hanken Grotesk
   haben keine arabischen Schnitte, sonst faellt die Seite auf eine
   Systemschrift zurueck und sieht in ar kaputt aus. */
[dir='rtl'] .lp,
.lp[dir='rtl'] {
  --lp-display: 'IBM Plex Sans Arabic', system-ui, sans-serif;
  --lp-body: 'IBM Plex Sans Arabic', system-ui, sans-serif;
}

.lp h1, .lp h2, .lp h3 {
  font-family: var(--lp-display);
  line-height: 1.08;
  margin: 0;
  text-wrap: balance;
}
.lp p { margin: 0; }

.lp-wrap {
  max-width: var(--lp-max);
  margin-inline: auto;
  padding-inline: var(--lp-gutter);
}

.lp-eyebrow {
  font-family: var(--lp-display);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: var(--lp-brand);
}

.lp :focus-visible {
  outline: 2px solid var(--lp-brand);
  outline-offset: 3px;
  border-radius: 4px;
}

@media (prefers-reduced-motion: reduce) {
  .lp *,
  .lp *::before,
  .lp *::after {
    animation-duration: .001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .001ms !important;
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json src/pages/Landing/Landing.css
git commit -m "feat: selbst gehostete Schriften und Farb-Token fuer die Landing-Page"
```

---

### Task 3: Die Stempelkarte

**Files:**
- Create: `src/pages/Landing/components/qrArt.js`
- Create: `src/pages/Landing/components/qrArt.test.js`
- Create: `src/pages/Landing/components/StampCard.jsx`
- Modify: `src/pages/Landing/Landing.css` (anhängen)

**Interfaces:**
- Consumes: nichts
- Produces: `<StampCard stamps={0..6} compact={boolean} shop={string} reward={string} chip={string} serial={string} />`
- Produces: `qrModules() -> boolean[21][21]`

- [ ] **Step 1: Test für die QR-Geometrie schreiben**

`src/pages/Landing/components/qrArt.test.js`:

```js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { qrModules } from './qrArt.js'

const m = qrModules()

test('21x21 Module', () => {
  assert.equal(m.length, 21)
  assert.ok(m.every(row => row.length === 21))
})

test('Finder-Ecke oben links: Rahmen an, Ring aus, Kern an', () => {
  assert.equal(m[0][0], 1)
  assert.equal(m[1][1], 0)
  assert.equal(m[3][3], 1)
})

test('Finder-Ecken auch oben rechts und unten links', () => {
  assert.equal(m[0][14], 1)
  assert.equal(m[14][0], 1)
})

test('unten rechts ist keine Finder-Ecke', () => {
  assert.equal(m[14][14], 0)
})

test('Timing-Spur wechselt sich ab', () => {
  assert.equal(m[6][8], 1)
  assert.equal(m[6][9], 0)
  assert.equal(m[6][10], 1)
})

test('reproduzierbar — zwei Aufrufe geben dasselbe Muster', () => {
  assert.deepEqual(qrModules(), m)
})
```

- [ ] **Step 2: Test laufen lassen, Fehlschlag bestätigen**

```bash
node --test src/pages/Landing/components/
```

Erwartet: FAIL, Modul nicht gefunden

- [ ] **Step 3: qrArt.js schreiben**

`src/pages/Landing/components/qrArt.js`:

```js
/**
 * Zeichnerische QR-Geometrie, Version 1 (21 Module).
 *
 * Kein echter Code — reine Illustration fuer die Landing-Page. Die echten
 * QR-Codes in der App erzeugt weiterhin qrcode.react.
 *
 * Das Datenfeld kommt aus einem festen Startwert, damit das Muster auf jedem
 * Geraet und bei jedem Aufruf gleich aussieht.
 */
const N = 21

export function qrModules() {
  const m = Array.from({ length: N }, () => new Array(N).fill(0))

  const finder = (ox, oy) => {
    for (let y = 0; y < 7; y++) {
      for (let x = 0; x < 7; x++) {
        const ring = x === 0 || x === 6 || y === 0 || y === 6
        const core = x >= 2 && x <= 4 && y >= 2 && y <= 4
        m[oy + y][ox + x] = ring || core ? 1 : 0
      }
    }
  }
  finder(0, 0)
  finder(14, 0)
  finder(0, 14)

  for (let t = 8; t < 13; t++) {
    m[6][t] = t % 2 ? 0 : 1
    m[t][6] = t % 2 ? 0 : 1
  }

  const reserved = (x, y) =>
    (x < 9 && y < 9) || (x > 13 && y < 9) || (x < 9 && y > 13) || x === 6 || y === 6

  let seed = 20260910
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    return seed / 0x7fffffff
  }

  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      if (!reserved(x, y)) m[y][x] = rnd() < 0.47 ? 1 : 0
    }
  }

  return m
}

export const QR_SIZE = N
export const QR_QUIET = 2
```

- [ ] **Step 4: Test laufen lassen, Erfolg bestätigen**

```bash
node --test src/pages/Landing/components/
```

Erwartet: `# pass 6`, `# fail 0`

- [ ] **Step 5: StampCard schreiben**

`src/pages/Landing/components/StampCard.jsx`:

```jsx
import { useMemo } from 'react'
import { qrModules, QR_SIZE, QR_QUIET } from './qrArt.js'

function QrPlate() {
  const rects = useMemo(() => {
    const m = qrModules()
    const out = []
    for (let y = 0; y < QR_SIZE; y++) {
      for (let x = 0; x < QR_SIZE; x++) {
        if (m[y][x]) out.push(<rect key={`${x}-${y}`} x={x + QR_QUIET} y={y + QR_QUIET} width="1" height="1" />)
      }
    }
    return out
  }, [])

  const side = QR_SIZE + QR_QUIET * 2
  return (
    <span className="lp-qr">
      <svg viewBox={`0 0 ${side} ${side}`} shapeRendering="crispEdges" aria-hidden="true">
        <rect width={side} height={side} fill="#FFFFFF" />
        <g fill="#1A1A2E">{rects}</g>
      </svg>
    </span>
  )
}

function Cup() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 8h12v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8Z" />
      <path d="M16 9.5h2a2.5 2.5 0 0 1 0 5h-2" />
    </svg>
  )
}

const TOTAL = 6

/**
 * Die Stempelkarte. Erscheint dreimal auf der Seite (Hero, Buehne, Finale) —
 * immer diese Komponente, nie eine Kopie.
 */
export default function StampCard({
  stamps = 0,
  compact = false,
  shop,
  reward,
  chip,
  serial = 'STMP-4471-NW',
  location = 'HH-OTTENSEN',
}) {
  const done = stamps >= TOTAL
  const cls = ['lp-card', compact && 'lp-card--compact', done && 'is-done'].filter(Boolean).join(' ')

  return (
    <div className={cls}>
      <div className="lp-card-head">
        <span className="lp-card-mark"><Cup /></span>
        <span className="lp-card-shop">{shop}</span>
        <span className="lp-card-loc">{location}</span>
      </div>

      <div className="lp-card-grid">
        {Array.from({ length: TOTAL }, (_, i) => (
          <span key={i} className={i < stamps ? 'lp-slot is-on' : 'lp-slot'}><Cup /></span>
        ))}
      </div>

      <div className="lp-card-foot">
        <div className="lp-card-reward">
          <span>{reward}</span>
          <span className="lp-card-chip">{chip}</span>
        </div>
        <div className="lp-card-pass">
          <QrPlate />
          <span className="lp-card-serial">{serial}</span>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: CSS anhängen**

An `src/pages/Landing/Landing.css` anhängen:

```css
/* ---------- Stempelkarte ---------- */
.lp-card {
  width: min(304px, 80vw);
  aspect-ratio: 1 / 1.42;
  background: linear-gradient(163deg, var(--lp-card-from), var(--lp-card-to));
  border-radius: 20px;
  color: #fff;
  padding: 20px 20px 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 24px 60px -20px rgba(44, 37, 112, .55);
}
.lp-card::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 20px;
  border: 2px solid var(--lp-gold);
  opacity: 0;
  transition: opacity .45s ease;
  pointer-events: none;
}
.lp-card.is-done::after { opacity: 1; }

.lp-card-head { display: flex; align-items: center; gap: 9px; }
.lp-card-mark {
  width: 22px; height: 22px; border-radius: 6px; flex: none;
  background: rgba(255, 255, 255, .92);
  display: grid; place-items: center;
}
.lp-card-mark svg {
  width: 13px; height: 13px;
  stroke: var(--lp-card-to); fill: none; stroke-width: 1.9;
  stroke-linecap: round; stroke-linejoin: round;
}
.lp-card-shop { font-family: var(--lp-display); font-weight: 600; font-size: 15.5px; }
.lp-card-loc {
  margin-inline-start: auto;
  font-size: 9.5px; letter-spacing: .06em;
  color: #B7B0E8;
}

.lp-card-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 11px;
  flex: 1;
  align-content: center;
}
.lp-slot {
  aspect-ratio: 1;
  border-radius: 50%;
  border: 1.5px dashed rgba(255, 255, 255, .22);
  display: grid;
  place-items: center;
  transition: background .32s cubic-bezier(.2, .9, .3, 1.4),
              border-color .32s ease,
              transform .32s cubic-bezier(.2, .9, .3, 1.4);
}
.lp-slot svg {
  width: 52%; height: 52%;
  stroke: var(--lp-card-to); fill: none; stroke-width: 2;
  stroke-linecap: round; stroke-linejoin: round;
  opacity: 0; transition: opacity .25s ease;
}
.lp-slot.is-on { background: #fff; border-color: #fff; border-style: solid; transform: scale(1.06); }
.lp-slot.is-on svg { opacity: 1; }
.lp-card.is-done .lp-slot.is-on { background: var(--lp-gold); border-color: var(--lp-gold); }
.lp-card.is-done .lp-slot.is-on svg { stroke: #2A1B02; }

.lp-card-foot { display: flex; flex-direction: column; gap: 9px; }
.lp-card-reward {
  display: flex; justify-content: space-between; align-items: center; gap: 8px;
  font-size: 13px; color: #B7B0E8;
}
.lp-card-chip {
  font-size: 9.5px; letter-spacing: .08em; text-transform: uppercase;
  background: var(--lp-gold); color: #2A1B02;
  padding: 3px 7px; border-radius: 5px;
  opacity: 0; transform: translateY(4px);
  transition: opacity .35s ease, transform .35s ease;
}
.lp-card.is-done .lp-card-chip { opacity: 1; transform: none; }

.lp-card-pass { display: flex; flex-direction: column; align-items: center; gap: 5px; }
.lp-qr {
  width: 74px; aspect-ratio: 1; flex: none;
  background: #fff; border-radius: 7px; padding: 4px;
}
.lp-qr svg { width: 100%; height: 100%; display: block; }
.lp-card-serial { font-size: 8.5px; letter-spacing: .14em; color: #B7B0E8; }

.lp-card--compact { width: 132px; border-radius: 12px; padding: 10px 10px 8px; gap: 7px; }
.lp-card--compact::after { border-radius: 12px; border-width: 1.5px; }
.lp-card--compact .lp-card-grid { gap: 6px; }
.lp-card--compact .lp-card-shop { font-size: 9.5px; }
.lp-card--compact .lp-card-loc,
.lp-card--compact .lp-card-chip,
.lp-card--compact .lp-card-serial { display: none; }
.lp-card--compact .lp-card-reward { font-size: 7.5px; }
.lp-card--compact .lp-qr { width: 34px; border-radius: 4px; padding: 2px; }
```

- [ ] **Step 7: Tests laufen lassen**

```bash
npm test
```

Erwartet: `# pass 13`, `# fail 0`

- [ ] **Step 8: Commit**

```bash
git add src/pages/Landing/components/ src/pages/Landing/Landing.css
git commit -m "feat: Stempelkarte mit QR-Feld und Belohnungs-Zustand"
```

---

### Task 4: Reveal und Sperrbildschirm

**Files:**
- Create: `src/pages/Landing/components/Reveal.jsx`
- Create: `src/pages/Landing/components/LockScreen.jsx`
- Modify: `src/pages/Landing/Landing.css` (anhängen)

**Interfaces:**
- Produces: `<Reveal delay={number}>{children}</Reveal>`
- Produces: `<LockScreen clock={string} date={string} title={string} body={string} />`

- [ ] **Step 1: Reveal schreiben**

`src/pages/Landing/components/Reveal.jsx`:

```jsx
import { useEffect, useRef, useState } from 'react'

/**
 * Sanftes Hochschieben, sobald der Abschnitt ins Bild kommt.
 *
 * Startet bewusst bei voller Deckkraft und bewegt nur translateY: wer ohne
 * JavaScript, mit Reader-Modus oder ueber eine Vorschau kommt, sieht trotzdem
 * den ganzen Text. Nichts wartet unsichtbar auf einen Observer.
 */
export default function Reveal({ children, delay = 0 }) {
  const ref = useRef(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!('IntersectionObserver' in window)) { setShown(true); return }

    const io = new IntersectionObserver(
      entries => {
        if (entries.some(e => e.isIntersecting)) {
          setShown(true)
          io.disconnect()
        }
      },
      { threshold: 0.18 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={shown ? 'lp-reveal is-in' : 'lp-reveal'}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  )
}
```

- [ ] **Step 2: LockScreen schreiben**

`src/pages/Landing/components/LockScreen.jsx`:

```jsx
/**
 * iPhone-Sperrbildschirm mit Wallet-Meldung. Zeigt, was der Kunde spaeter
 * wirklich sieht: die volle Karte meldet sich von selbst, in Ladennaehe.
 */
export default function LockScreen({ clock, date, title, body }) {
  return (
    <div className="lp-phone">
      <div className="lp-phone-screen">
        <div className="lp-phone-notch" />
        <div className="lp-phone-clock">{clock}</div>
        <div className="lp-phone-date">{date}</div>
        <div className="lp-notif">
          <span className="lp-notif-swatch">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 8h12v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8Z" />
              <path d="M16 9.5h2a2.5 2.5 0 0 1 0 5h-2" />
            </svg>
          </span>
          <span className="lp-notif-text">
            <span className="lp-notif-title">{title}</span>
            <span className="lp-notif-body">{body}</span>
          </span>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: CSS anhängen**

An `src/pages/Landing/Landing.css` anhängen:

```css
/* ---------- Reveal ---------- */
.lp-reveal {
  transform: translateY(10px);
  transition: transform .7s cubic-bezier(.22, .8, .3, 1);
}
.lp-reveal.is-in { transform: none; }

/* ---------- Sperrbildschirm ---------- */
.lp-phone {
  width: min(258px, 68vw);
  aspect-ratio: 1 / 2.05;
  background: #0E0D1E;
  border: 1px solid rgba(255, 255, 255, .10);
  border-radius: 34px;
  padding: 14px 12px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 24px 60px -20px rgba(44, 37, 112, .55);
}
.lp-phone::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(120% 70% at 50% 0%, #3B3475 0%, #16142E 55%, #0B0A1B 100%);
}
.lp-phone-screen { position: relative; z-index: 2; display: flex; flex-direction: column; height: 100%; }
.lp-phone-notch { width: 74px; height: 19px; border-radius: 11px; background: #000; margin: 0 auto 20px; }
.lp-phone-clock {
  font-family: var(--lp-display); font-weight: 600; font-size: 46px;
  color: #fff; text-align: center; line-height: 1;
  font-variant-numeric: tabular-nums;
}
.lp-phone-date { font-size: 11.5px; color: rgba(255, 255, 255, .62); text-align: center; margin-top: 5px; }
.lp-notif {
  margin-top: auto;
  background: rgba(255, 255, 255, .14);
  -webkit-backdrop-filter: blur(14px);
  backdrop-filter: blur(14px);
  border: 1px solid rgba(255, 255, 255, .18);
  border-radius: 14px;
  padding: 10px 11px;
  display: flex; gap: 9px; align-items: center;
}
.lp-notif-swatch {
  width: 34px; height: 34px; border-radius: 8px; flex: none;
  background: linear-gradient(160deg, var(--lp-card-from), var(--lp-card-to));
  display: grid; place-items: center;
}
.lp-notif-swatch svg {
  width: 17px; height: 17px;
  stroke: #fff; fill: none; stroke-width: 2;
  stroke-linecap: round; stroke-linejoin: round;
}
.lp-notif-text { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.lp-notif-title { font-size: 12.5px; font-weight: 700; color: #fff; }
.lp-notif-body {
  font-size: 11px; color: rgba(255, 255, 255, .72);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/Landing/components/Reveal.jsx src/pages/Landing/components/LockScreen.jsx src/pages/Landing/Landing.css
git commit -m "feat: Reveal-Baustein und Sperrbildschirm"
```

---

### Task 5: Route, Gerüst, Kopf und Fuß

Nach dieser Aufgabe ist die Seite zum ersten Mal im Browser zu sehen.

**Files:**
- Create: `src/pages/Landing/Landing.jsx`
- Create: `src/pages/Landing/sections/Header.jsx`
- Create: `src/pages/Landing/sections/Footer.jsx`
- Modify: `src/App.jsx`
- Modify: `src/i18n.js`
- Modify: `src/pages/Landing/Landing.css` (anhängen)

**Interfaces:**
- Consumes: `useLang()` aus `src/LangContext.jsx`
- Produces: `<Landing />` als Default-Export von `Landing.jsx`

- [ ] **Step 1: LangContext-Schnittstelle nachsehen**

```bash
cat src/LangContext.jsx
```

Notiere, wie andere Seiten übersetzen (Name des Hooks, Name der Übersetzungsfunktion). In den folgenden Schritten steht `const { t } = useLang()` — passe das an die tatsächliche Schnittstelle an, falls sie anders heißt, und zwar in **allen** Abschnitts-Dateien einheitlich.

- [ ] **Step 2: i18n-Keys für Kopf und Fuß**

In `src/i18n.js` je einmal in den Block `de`, `en` und `ar` einfügen, am Ende des jeweiligen Blocks:

```js
    // Landing — Kopf und Fuss
    lp_nav_how: 'So funktioniert\'s', lp_nav_features: 'Funktionen',
    lp_nav_pricing: 'Preise', lp_nav_contact: 'Kontakt', lp_nav_login: 'Anmelden',
    lp_foot_imprint: 'Impressum', lp_foot_privacy: 'Datenschutz',
    lp_foot_made: 'In Deutschland entwickelt', lp_foot_copy: '© 2026 Stampit',
```

`en`:

```js
    lp_nav_how: 'How it works', lp_nav_features: 'Features',
    lp_nav_pricing: 'Pricing', lp_nav_contact: 'Contact', lp_nav_login: 'Sign in',
    lp_foot_imprint: 'Imprint', lp_foot_privacy: 'Privacy',
    lp_foot_made: 'Made in Germany', lp_foot_copy: '© 2026 Stampit',
```

`ar`:

```js
    lp_nav_how: 'كيف يعمل', lp_nav_features: 'المزايا',
    lp_nav_pricing: 'الأسعار', lp_nav_contact: 'تواصل', lp_nav_login: 'تسجيل الدخول',
    lp_foot_imprint: 'بيانات الناشر', lp_foot_privacy: 'الخصوصية',
    lp_foot_made: 'طُوِّر في ألمانيا', lp_foot_copy: '© 2026 Stampit',
```

- [ ] **Step 3: Header schreiben**

`src/pages/Landing/sections/Header.jsx`:

```jsx
import { Link } from 'react-router-dom'
import { useLang } from '../../../LangContext.jsx'

export default function Header() {
  const { t } = useLang()
  return (
    <header className="lp-header">
      <div className="lp-wrap lp-header-in">
        <span className="lp-logo">Stampit</span>
        <nav className="lp-nav">
          <a href="#how">{t('lp_nav_how')}</a>
          <a href="#features">{t('lp_nav_features')}</a>
          <a href="#pricing">{t('lp_nav_pricing')}</a>
          <a href="#contact">{t('lp_nav_contact')}</a>
        </nav>
        <Link className="lp-btn lp-btn--ghost" to="/login">{t('lp_nav_login')}</Link>
      </div>
    </header>
  )
}
```

- [ ] **Step 4: Footer schreiben**

`src/pages/Landing/sections/Footer.jsx`:

```jsx
import { useLang } from '../../../LangContext.jsx'

export default function Footer() {
  const { t } = useLang()
  return (
    <footer className="lp-footer">
      <div className="lp-wrap lp-footer-in">
        <span>{t('lp_foot_copy')}</span>
        <span className="lp-footer-links">
          <a href="/impressum">{t('lp_foot_imprint')}</a>
          <a href="/datenschutz">{t('lp_foot_privacy')}</a>
        </span>
        <span>{t('lp_foot_made')}</span>
      </div>
    </footer>
  )
}
```

- [ ] **Step 5: Landing-Gerüst schreiben**

`src/pages/Landing/Landing.jsx` — die Abschnitte kommen in den folgenden Aufgaben dazu, hier stehen sie schon als Anker:

```jsx
import './Landing.css'
import Header from './sections/Header.jsx'
import Footer from './sections/Footer.jsx'

export default function Landing() {
  return (
    <div className="lp">
      <Header />
      <main>
        <section id="hero" />
        <section id="value" />
        <section id="how" />
        <section id="features" />
        <section id="pricing" />
        <section id="trust" />
        <section id="wallet" />
        <section id="contact" />
      </main>
      <Footer />
    </div>
  )
}
```

- [ ] **Step 6: Route umstellen**

In `src/App.jsx`, Import ergänzen:

```jsx
import Landing from './pages/Landing/Landing'
```

Und `rootElement()` ersetzen:

```jsx
  // Installierte PWA: wer ausgeloggt die App oeffnet, will sich anmelden —
  // nicht die Werbeseite sehen.
  function isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone === true
  }

  // Root-Route abhängig vom Gerätetyp bestimmen
  function rootElement() {
    if (isScannerDevice) return <Navigate to="/scanner" replace />   // Scanner-Gerät
    if (token) return <Layout />                                      // Besitzer eingeloggt
    if (isStandalone()) return <Navigate to="/login" replace />       // installierte PWA
    return <Landing />                                                // Besucher
  }
```

- [ ] **Step 7: CSS anhängen**

An `src/pages/Landing/Landing.css` anhängen:

```css
/* ---------- Kopf ---------- */
.lp-header {
  position: sticky; top: 0; z-index: 40;
  background: rgba(255, 255, 255, .88);
  -webkit-backdrop-filter: blur(12px);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--lp-line);
}
.lp-header-in { display: flex; align-items: center; gap: 20px; height: 62px; }
.lp-logo { font-family: var(--lp-display); font-weight: 700; font-size: 20px; color: var(--lp-brand); }
.lp-nav { display: flex; gap: 22px; margin-inline-start: auto; }
.lp-nav a { color: var(--lp-muted); text-decoration: none; font-size: 15px; }
.lp-nav a:hover { color: var(--lp-ink); }
@media (max-width: 760px) {
  .lp-nav { display: none; }
  .lp-header-in > .lp-btn { margin-inline-start: auto; }
}

.lp-btn {
  display: inline-flex; align-items: center; justify-content: center;
  font-family: var(--lp-display); font-weight: 600; font-size: 15px;
  padding: 10px 18px; border-radius: 10px; text-decoration: none;
  border: 1px solid transparent; cursor: pointer;
  transition: background .2s ease, border-color .2s ease, color .2s ease;
}
.lp-btn--primary { background: var(--lp-brand); color: #fff; }
.lp-btn--primary:hover { background: #322A75; }
.lp-btn--ghost { border-color: var(--lp-line); color: var(--lp-ink); background: var(--lp-surface); }
.lp-btn--ghost:hover { border-color: var(--lp-brand); color: var(--lp-brand); }

/* ---------- Fuss ---------- */
.lp-footer { border-top: 1px solid var(--lp-line); background: var(--lp-surface-2); }
.lp-footer-in {
  display: flex; flex-wrap: wrap; gap: 12px 24px;
  align-items: center; justify-content: space-between;
  padding-block: 26px; font-size: 14px; color: var(--lp-muted);
}
.lp-footer-links { display: flex; gap: 18px; }
.lp-footer a { color: var(--lp-muted); text-decoration: none; }
.lp-footer a:hover { color: var(--lp-brand); }
```

- [ ] **Step 8: Prüfen**

```bash
npm run dev
```

Im Browser `http://localhost:5173/` öffnen. Erwartet:
- Kopfzeile mit Logo, Navigation und „Anmelden“
- Fußzeile
- Dazwischen leer (die Abschnitte kommen noch)

Dann in DevTools → Application → Local Storage `token` setzen und die Seite neu laden. Erwartet: das Dashboard, nicht die Landing-Page. `token` wieder löschen.

- [ ] **Step 9: Commit**

```bash
git add src/pages/Landing/ src/App.jsx src/i18n.js
git commit -m "feat: Landing-Route mit Kopf- und Fusszeile"
```

---

### Task 6: Hero und Value-Band

**Files:**
- Create: `src/pages/Landing/sections/Hero.jsx`
- Create: `src/pages/Landing/sections/ValueBand.jsx`
- Modify: `src/pages/Landing/Landing.jsx`
- Modify: `src/i18n.js`
- Modify: `src/pages/Landing/Landing.css` (anhängen)

**Interfaces:**
- Consumes: `<StampCard />` aus Task 3, `<Reveal />` aus Task 4

- [ ] **Step 1: i18n-Keys**

`de`:

```js
    // Landing — Hero und Value
    lp_hero_title: 'Aus Laufkundschaft werden Stammkunden.',
    lp_hero_body: 'Die digitale Stempelkarte liegt in Apple und Google Wallet. Kein App-Store, kein Plastik, kein Papier, das im Portemonnaie zerfällt.',
    lp_hero_cta: 'Kostenlos anfragen', lp_hero_cta2: 'So funktioniert\'s',
    lp_hero_note: 'DSGVO-konform · In Deutschland entwickelt',
    lp_card_shop: 'Café Nordwind',
    lp_card_reward: '6 Stempel = 1 Kaffee gratis',
    lp_card_chip: 'frei',
    lp_value_title: 'Keine App im Store. Kein Plastik. Kein Papier, das verloren geht.',
    lp_value_body: 'Der Kunde scannt einmal und hat die Karte für immer auf dem Handy.',
```

`en`:

```js
    lp_hero_title: 'Turn passers-by into regulars.',
    lp_hero_body: 'The digital stamp card lives in Apple and Google Wallet. No app store, no plastic, no paper falling apart in a wallet.',
    lp_hero_cta: 'Request a demo', lp_hero_cta2: 'How it works',
    lp_hero_note: 'GDPR-compliant · Made in Germany',
    lp_card_shop: 'Café Nordwind',
    lp_card_reward: '6 stamps = 1 free coffee',
    lp_card_chip: 'ready',
    lp_value_title: 'No app store. No plastic. No paper to lose.',
    lp_value_body: 'Your customer scans once and keeps the card on their phone.',
```

`ar`:

```js
    lp_hero_title: 'حوّل الزبائن العابرين إلى زبائن دائمين.',
    lp_hero_body: 'بطاقة الختم الرقمية داخل Apple و Google Wallet. بلا متجر تطبيقات، بلا بلاستيك، بلا ورق يتمزّق في المحفظة.',
    lp_hero_cta: 'اطلب عرضاً', lp_hero_cta2: 'كيف يعمل',
    lp_hero_note: 'متوافق مع حماية البيانات · طُوِّر في ألمانيا',
    lp_card_shop: 'مقهى نوردفind',
    lp_card_reward: '٦ أختام = قهوة مجاناً',
    lp_card_chip: 'جاهز',
    lp_value_title: 'لا تطبيق في المتجر. لا بلاستيك. لا ورق يضيع.',
    lp_value_body: 'يمسح الزبون مرة واحدة وتبقى البطاقة على هاتفه.',
```

Hinweis: `lp_card_shop` im arabischen Block auf `مقهى نوردفيند` korrigieren, falls beim Kopieren lateinische Zeichen hängen bleiben.

- [ ] **Step 2: Hero schreiben**

`src/pages/Landing/sections/Hero.jsx`:

```jsx
import { useLang } from '../../../LangContext.jsx'
import StampCard from '../components/StampCard.jsx'

export default function Hero() {
  const { t } = useLang()
  return (
    <section id="hero" className="lp-hero">
      <div className="lp-wrap lp-hero-in">
        <div className="lp-hero-copy">
          <h1>{t('lp_hero_title')}</h1>
          <p className="lp-lede">{t('lp_hero_body')}</p>
          <div className="lp-hero-actions">
            <a className="lp-btn lp-btn--primary" href="#contact">{t('lp_hero_cta')}</a>
            <a className="lp-btn lp-btn--ghost" href="#how">{t('lp_hero_cta2')}</a>
          </div>
          <p className="lp-hero-note">{t('lp_hero_note')}</p>
        </div>
        <div className="lp-hero-card">
          <div className="lp-bob">
            <StampCard
              stamps={1}
              shop={t('lp_card_shop')}
              reward={t('lp_card_reward')}
              chip={t('lp_card_chip')}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 3: ValueBand schreiben**

`src/pages/Landing/sections/ValueBand.jsx`:

```jsx
import { useLang } from '../../../LangContext.jsx'
import Reveal from '../components/Reveal.jsx'

export default function ValueBand() {
  const { t } = useLang()
  return (
    <section id="value" className="lp-value">
      <div className="lp-wrap">
        <Reveal>
          <div className="lp-value-in">
            <h2>{t('lp_value_title')}</h2>
            <p>{t('lp_value_body')}</p>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
```

- [ ] **Step 4: In Landing.jsx einhängen**

In `src/pages/Landing/Landing.jsx` die Zeilen `<section id="hero" />` und `<section id="value" />` ersetzen durch:

```jsx
        <Hero />
        <ValueBand />
```

Und oben importieren:

```jsx
import Hero from './sections/Hero.jsx'
import ValueBand from './sections/ValueBand.jsx'
```

- [ ] **Step 5: CSS anhängen**

```css
/* ---------- Hero ---------- */
.lp-hero { padding-block: 72px 84px; }
.lp-hero-in {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 56px;
  align-items: center;
}
.lp-hero-copy { display: flex; flex-direction: column; gap: 20px; }
.lp-hero h1 { font-size: clamp(34px, 6vw, 54px); font-weight: 700; letter-spacing: -.025em; }
.lp-lede { font-size: 18px; color: var(--lp-muted); max-width: 30em; }
.lp-hero-actions { display: flex; flex-wrap: wrap; gap: 12px; }
.lp-hero-note { font-size: 13.5px; color: var(--lp-muted); }
.lp-hero-card { display: grid; place-items: center; }
.lp-bob { animation: lp-bob 5.5s ease-in-out infinite; }
@keyframes lp-bob {
  0%, 100% { transform: translateY(0) rotate(-1.2deg); }
  50%      { transform: translateY(-11px) rotate(1.2deg); }
}
@media (max-width: 860px) {
  .lp-hero-in { grid-template-columns: 1fr; gap: 40px; }
  .lp-hero-card { order: -1; }
}

/* ---------- Value-Band ---------- */
.lp-value { background: var(--lp-brand); color: #fff; }
.lp-value-in {
  display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between;
  gap: 20px 40px; padding-block: 54px;
}
.lp-value h2 { color: #fff; font-size: clamp(22px, 3.4vw, 30px); font-weight: 600; max-width: 18em; }
.lp-value p { color: #CFCAF2; font-size: 16px; max-width: 22em; }
```

- [ ] **Step 6: Prüfen**

`npm run dev`, `http://localhost:5173/`. Erwartet: Hero mit Karte (ein Stempel gesetzt, Karte wiegt sich leicht), darunter das violette Band. Fenster auf 390 px verschmälern — die Karte rutscht über den Text.

- [ ] **Step 7: Commit**

```bash
git add src/pages/Landing/ src/i18n.js
git commit -m "feat: Hero und Value-Band"
```

---

### Task 7: Bühne — „So funktioniert's"

Das Kernstück. Die Karte klebt fest und füllt sich beim Scrollen.

**Files:**
- Create: `src/pages/Landing/sections/HowItWorks.jsx`
- Modify: `src/pages/Landing/Landing.jsx`
- Modify: `src/i18n.js`
- Modify: `src/pages/Landing/Landing.css` (anhängen)

**Interfaces:**
- Consumes: `useScrollProgress(ref)` aus Task 1, `<StampCard />` aus Task 3, `<LockScreen />` aus Task 4

Scroll-Schwellen (aus der Spec, verbindlich):

| Fortschritt | Wirkung |
|---|---|
| 0,06 → 0,80 | Stempel 0 → 6 |
| 0,28 / 0,55 / 0,80 | Textwechsel Schritt 1 → 2 → 3 → Belohnung |
| 0,84 → 1,00 | Karte fährt hoch und blendet aus, Sperrbildschirm blendet ein |

- [ ] **Step 1: i18n-Keys**

`de`:

```js
    // Landing — So funktioniert's
    lp_how_eyebrow: 'So funktioniert\'s',
    lp_how_title: 'In drei Schritten zur digitalen Stempelkarte',
    lp_how_step: 'Schritt',
    lp_how_1_t: 'Karte gestalten',
    lp_how_1_b: 'Farben, Logo, Stempel-Symbol und wie viele Stempel bis zur Belohnung.',
    lp_how_2_t: 'Kunde scannt den QR-Code',
    lp_how_2_b: 'Kein Store, kein Download. Danach liegt die Karte in der Wallet.',
    lp_how_3_t: 'Personal stempelt jeden Besuch',
    lp_how_3_b: 'Kamera, USB-Scanner oder ein altes Tablet. Sofort auf dem Kundenhandy.',
    lp_how_4_t: 'Sechs von sechs',
    lp_how_4_b: 'Die Karte meldet sich von selbst — auf dem Sperrbildschirm, in Ladennähe.',
    lp_how_scroll: 'weiter scrollen',
    lp_lock_clock: '08:14',
    lp_lock_date: 'Donnerstag, 10. September',
    lp_lock_title: 'Café Nordwind',
    lp_lock_body: '6 von 6 — dein Kaffee wartet',
```

`en`:

```js
    lp_how_eyebrow: 'How it works',
    lp_how_title: 'Three steps to a digital stamp card',
    lp_how_step: 'Step',
    lp_how_1_t: 'Design the card',
    lp_how_1_b: 'Colours, logo, stamp icon, and how many stamps until the reward.',
    lp_how_2_t: 'Customer scans the QR code',
    lp_how_2_b: 'No store, no download. The card lands straight in their wallet.',
    lp_how_3_t: 'Staff stamps every visit',
    lp_how_3_b: 'Camera, USB scanner or an old tablet. Instantly on the phone.',
    lp_how_4_t: 'Six of six',
    lp_how_4_b: 'The card speaks up on its own — on the lock screen, near your shop.',
    lp_how_scroll: 'keep scrolling',
    lp_lock_clock: '08:14',
    lp_lock_date: 'Thursday, 10 September',
    lp_lock_title: 'Café Nordwind',
    lp_lock_body: '6 of 6 — your coffee is waiting',
```

`ar`:

```js
    lp_how_eyebrow: 'كيف يعمل',
    lp_how_title: 'ثلاث خطوات نحو بطاقة الختم الرقمية',
    lp_how_step: 'خطوة',
    lp_how_1_t: 'صمّم البطاقة',
    lp_how_1_b: 'الألوان والشعار ورمز الختم وعدد الأختام حتى المكافأة.',
    lp_how_2_t: 'الزبون يمسح رمز QR',
    lp_how_2_b: 'بلا متجر وبلا تنزيل. تصل البطاقة مباشرة إلى المحفظة.',
    lp_how_3_t: 'الموظّف يختم كل زيارة',
    lp_how_3_b: 'كاميرا أو ماسح USB أو جهاز لوحي قديم. تظهر فوراً على هاتف الزبون.',
    lp_how_4_t: 'ستة من ستة',
    lp_how_4_b: 'تُنبّه البطاقة بنفسها — على شاشة القفل، بالقرب من المتجر.',
    lp_how_scroll: 'تابع التمرير',
    lp_lock_clock: '٠٨:١٤',
    lp_lock_date: 'الخميس، ١٠ سبتمبر',
    lp_lock_title: 'مقهى نوردفيند',
    lp_lock_body: '٦ من ٦ — قهوتك بانتظارك',
```

- [ ] **Step 2: HowItWorks schreiben**

`src/pages/Landing/sections/HowItWorks.jsx`:

```jsx
import { useRef } from 'react'
import { useLang } from '../../../LangContext.jsx'
import { useScrollProgress } from '../useScrollProgress.js'
import StampCard from '../components/StampCard.jsx'
import LockScreen from '../components/LockScreen.jsx'

const TOTAL = 6

/** Anteil von p zwischen a und b, auf 0…1 begrenzt. */
function segment(p, a, b) {
  const v = (p - a) / (b - a)
  return v < 0 ? 0 : v > 1 ? 1 : v
}

export default function HowItWorks() {
  const { t } = useLang()
  const ref = useRef(null)
  const p = useScrollProgress(ref) / 100

  const stamps = Math.round(segment(p, 0.06, 0.80) * TOTAL)
  const step = p < 0.28 ? 1 : p < 0.55 ? 2 : p < 0.80 ? 3 : 4
  const out = segment(p, 0.84, 1)

  return (
    <section id="how" className="lp-stage" ref={ref}>
      <div className="lp-pin">
        <span className="lp-stage-label">{t('lp_how_eyebrow')}</span>

        <div className="lp-pin-in">
          <div className="lp-step" key={step}>
            <span className="lp-step-n">
              {step < 4 ? `${t('lp_how_step')} ${step} / 3` : t('lp_how_eyebrow')}
            </span>
            <h3>{t(`lp_how_${step}_t`)}</h3>
            <p>{t(`lp_how_${step}_b`)}</p>
          </div>

          <div className="lp-scene">
            <div
              className="lp-scene-layer"
              style={{ opacity: 1 - out, transform: `translateY(${-26 * out}px) scale(${1 - 0.12 * out})` }}
            >
              <StampCard
                stamps={stamps}
                shop={t('lp_card_shop')}
                reward={t('lp_card_reward')}
                chip={t('lp_card_chip')}
              />
            </div>
            <div
              className="lp-scene-layer"
              style={{ opacity: out, transform: `translateY(${30 * (1 - out)}px) scale(${0.94 + 0.06 * out})` }}
            >
              <LockScreen
                clock={t('lp_lock_clock')}
                date={t('lp_lock_date')}
                title={t('lp_lock_title')}
                body={t('lp_lock_body')}
              />
            </div>
          </div>
        </div>

        <span className="lp-stage-hint">{t('lp_how_scroll')}</span>
      </div>
    </section>
  )
}
```

Das `key={step}` am Text sorgt dafür, dass React den Block bei jedem Schritt neu einhängt — dadurch läuft die Einblend-Animation aus dem CSS erneut.

- [ ] **Step 3: In Landing.jsx einhängen**

`<section id="how" />` ersetzen durch `<HowItWorks />`, Import ergänzen:

```jsx
import HowItWorks from './sections/HowItWorks.jsx'
```

- [ ] **Step 4: CSS anhängen**

```css
/* ---------- Buehne ---------- */
.lp-stage { position: relative; height: 240svh; background: var(--lp-surface); }
.lp-pin {
  position: sticky; top: 0;
  height: 100vh; height: 100svh;
  display: grid; place-items: center;
  overflow: hidden;
}
.lp-pin-in {
  display: flex; flex-direction: column; align-items: center; gap: 22px;
  width: 100%; padding-inline: var(--lp-gutter);
}
.lp-stage-label {
  position: absolute; top: 18px; inset-inline-start: var(--lp-gutter);
  font-family: var(--lp-display); font-size: 12px; font-weight: 600;
  letter-spacing: .12em; text-transform: uppercase; color: var(--lp-muted);
}
.lp-stage-hint {
  position: absolute; bottom: 18px; inset-inline: 0; text-align: center;
  font-size: 12px; letter-spacing: .1em; text-transform: uppercase; color: var(--lp-muted);
}
.lp-step {
  text-align: center; max-width: 22em; min-height: 96px;
  display: flex; flex-direction: column; gap: 6px;
  animation: lp-step-in .3s ease both;
}
@keyframes lp-step-in {
  from { opacity: 0; transform: translateY(7px); }
  to   { opacity: 1; transform: none; }
}
.lp-step-n { font-family: var(--lp-display); font-size: 12px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; color: var(--lp-brand); }
.lp-step h3 { font-size: clamp(20px, 4.4vw, 26px); font-weight: 700; }
.lp-step p { font-size: 15px; color: var(--lp-muted); }

.lp-scene { position: relative; display: grid; place-items: center; }
.lp-scene-layer { grid-area: 1 / 1; }

/* Bei reduzierter Bewegung klebt nichts fest: alle drei Schritte stehen
   untereinander, die Karte ist voll. */
@media (prefers-reduced-motion: reduce) {
  .lp-stage { height: auto; }
  .lp-pin { position: static; height: auto; padding-block: 56px; }
  .lp-step { animation: none; }
  .lp-stage-hint { display: none; }
}
```

- [ ] **Step 5: Prüfen**

`npm run dev`. Langsam durch den Abschnitt scrollen. Erwartet:
- Karte bleibt mittig stehen, während der Text durchläuft
- Stempel füllen sich bis 6, dann Goldrahmen und Chip
- Zum Schluss löst sich die Karte auf, der Sperrbildschirm erscheint
- Danach scrollt die Seite normal weiter

In DevTools → Rendering → „Emulate CSS prefers-reduced-motion: reduce" einschalten und neu laden. Erwartet: kein Festkleben, Karte voll, alles lesbar.

- [ ] **Step 6: Commit**

```bash
git add src/pages/Landing/ src/i18n.js
git commit -m "feat: Buehne mit scroll-gesteuerter Stempelkarte"
```

---

### Task 8: Funktionen

**Files:**
- Create: `src/pages/Landing/sections/Features.jsx`
- Modify: `src/pages/Landing/Landing.jsx`, `src/i18n.js`, `src/pages/Landing/Landing.css`

- [ ] **Step 1: i18n-Keys**

`de`:

```js
    // Landing — Funktionen
    lp_feat_eyebrow: 'Funktionen',
    lp_feat_title: 'Alles für den kleinen Laden — nichts, was ihn erschlägt',
    lp_feat_1_t: 'Apple & Google Wallet', lp_feat_1_b: 'Die Karte liegt dort, wo das Handy sie ohnehin sucht.',
    lp_feat_2_t: 'Design-Editor', lp_feat_2_b: 'Farben, Banner, eigenes Stempel-Symbol, Zuschnitt mit Live-Vorschau.',
    lp_feat_3_t: 'Tiefe Statistik', lp_feat_3_b: 'Stoßzeiten, Bestseller, 30-Tage-Verlauf, Tagesdetail per Klick.',
    lp_feat_4_t: 'Newsletter', lp_feat_4_b: 'Mit Bildern, Versand-Verlauf, nur an Kunden mit Einwilligung.',
    lp_feat_5_t: 'Mehrere Standorte', lp_feat_5_b: 'Eine Kette, ein Panel, pro Laden eigene Karten.',
    lp_feat_6_t: 'Mehrsprachig', lp_feat_6_b: 'Deutsch, Englisch, Arabisch — inklusive Schreibrichtung.',
    lp_feat_7_t: 'Drei Scan-Wege', lp_feat_7_b: 'Handy-Kamera, USB- oder Bluetooth-Scanner, Tablet als Scan-Gerät.',
    lp_feat_8_t: 'Installierbare PWA', lp_feat_8_b: 'Auf dem Startbildschirm wie eine App — ohne App-Store.',
```

`en`:

```js
    lp_feat_eyebrow: 'Features',
    lp_feat_title: 'Everything a small shop needs — nothing that buries it',
    lp_feat_1_t: 'Apple & Google Wallet', lp_feat_1_b: 'The card sits where the phone already looks for it.',
    lp_feat_2_t: 'Design editor', lp_feat_2_b: 'Colours, banner, your own stamp icon, cropping with live preview.',
    lp_feat_3_t: 'Deep statistics', lp_feat_3_b: 'Peak hours, best sellers, 30-day trend, daily detail on click.',
    lp_feat_4_t: 'Newsletter', lp_feat_4_b: 'With images, send history, only to customers who opted in.',
    lp_feat_5_t: 'Multiple locations', lp_feat_5_b: 'One chain, one panel, separate cards per shop.',
    lp_feat_6_t: 'Multilingual', lp_feat_6_b: 'German, English, Arabic — writing direction included.',
    lp_feat_7_t: 'Three ways to scan', lp_feat_7_b: 'Phone camera, USB or Bluetooth scanner, tablet as a scan station.',
    lp_feat_8_t: 'Installable PWA', lp_feat_8_b: 'On the home screen like an app — without an app store.',
```

`ar`:

```js
    lp_feat_eyebrow: 'المزايا',
    lp_feat_title: 'كل ما يحتاجه متجرك الصغير — دون تعقيد',
    lp_feat_1_t: 'Apple و Google Wallet', lp_feat_1_b: 'البطاقة حيث يبحث عنها الهاتف أصلاً.',
    lp_feat_2_t: 'محرّر التصميم', lp_feat_2_b: 'ألوان ولافتة ورمز ختم خاص وقصّ مع معاينة حيّة.',
    lp_feat_3_t: 'إحصاءات معمّقة', lp_feat_3_b: 'ساعات الذروة والأكثر مبيعاً ومنحنى ٣٠ يوماً وتفاصيل اليوم بنقرة.',
    lp_feat_4_t: 'النشرة البريدية', lp_feat_4_b: 'بالصور وسجلّ الإرسال، وفقط لمن وافق.',
    lp_feat_5_t: 'عدّة فروع', lp_feat_5_b: 'سلسلة واحدة، لوحة واحدة، بطاقات خاصة لكل فرع.',
    lp_feat_6_t: 'متعدّد اللغات', lp_feat_6_b: 'الألمانية والإنجليزية والعربية — مع اتجاه الكتابة.',
    lp_feat_7_t: 'ثلاث طرق للمسح', lp_feat_7_b: 'كاميرا الهاتف، ماسح USB أو بلوتوث، جهاز لوحي كمحطة مسح.',
    lp_feat_8_t: 'تطبيق ويب قابل للتثبيت', lp_feat_8_b: 'على الشاشة الرئيسية كتطبيق — بلا متجر.',
```

- [ ] **Step 2: Features schreiben**

`src/pages/Landing/sections/Features.jsx`:

```jsx
import { useLang } from '../../../LangContext.jsx'
import Reveal from '../components/Reveal.jsx'

const IDS = [1, 2, 3, 4, 5, 6, 7, 8]

export default function Features() {
  const { t } = useLang()
  return (
    <section id="features" className="lp-features">
      <div className="lp-wrap">
        <Reveal>
          <div className="lp-sec-head">
            <span className="lp-eyebrow">{t('lp_feat_eyebrow')}</span>
            <h2>{t('lp_feat_title')}</h2>
          </div>
        </Reveal>
        <div className="lp-feat-grid">
          {IDS.map((id, i) => (
            <Reveal key={id} delay={i * 40}>
              <article className="lp-feat">
                <h3>{t(`lp_feat_${id}_t`)}</h3>
                <p>{t(`lp_feat_${id}_b`)}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 3: In Landing.jsx einhängen**

`<section id="features" />` ersetzen durch `<Features />`, Import ergänzen.

- [ ] **Step 4: CSS anhängen**

```css
/* ---------- gemeinsamer Abschnitts-Kopf ---------- */
.lp-sec-head { display: flex; flex-direction: column; gap: 10px; max-width: 24em; margin-bottom: 40px; }
.lp-sec-head h2 { font-size: clamp(26px, 4.4vw, 38px); font-weight: 700; letter-spacing: -.02em; }

/* ---------- Funktionen ---------- */
.lp-features { background: var(--lp-surface-2); padding-block: 90px; }
.lp-feat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; }
.lp-feat {
  background: var(--lp-surface);
  border: 1px solid var(--lp-line);
  border-radius: 12px;
  padding: 20px;
  height: 100%;
  display: flex; flex-direction: column; gap: 6px;
}
.lp-feat h3 { font-size: 17px; font-weight: 600; }
.lp-feat p { font-size: 14.5px; color: var(--lp-muted); }
.lp-feat-grid > .lp-reveal { display: flex; }
```

- [ ] **Step 5: Prüfen**

`npm run dev`. Erwartet: acht Kacheln, gleich hoch in jeder Reihe, bei 390 px eine Spalte. Beim Hereinscrollen schieben sie sich leicht hoch — der Text ist dabei durchgehend lesbar, nie unsichtbar.

- [ ] **Step 6: Commit**

```bash
git add src/pages/Landing/ src/i18n.js
git commit -m "feat: Funktionen-Abschnitt"
```

---

### Task 9: Preise

**Files:**
- Create: `src/pages/Landing/sections/Pricing.jsx`
- Modify: `src/pages/Landing/Landing.jsx`, `src/i18n.js`, `src/pages/Landing/Landing.css`

Beträge bleiben `[Preis]` — mit sichtbarem Hinweis über dem Raster, damit niemand denkt, das sei ein Anzeigefehler.

- [ ] **Step 1: i18n-Keys**

`de`:

```js
    // Landing — Preise
    lp_price_eyebrow: 'Preise',
    lp_price_title: 'Ein Preis pro Laden, keine Provision pro Stempel',
    lp_price_note: 'Tarife stehen noch nicht endgültig fest. Schreib uns, wir nennen dir den Preis für deinen Laden.',
    lp_price_amount: '[Preis]', lp_price_permonth: '/ Monat', lp_price_persite: '/ Standort',
    lp_price_popular: 'Beliebt', lp_price_cta: 'Anfragen',
    lp_price_1_t: 'Start', lp_price_1_b: 'Ein Standort, eine Karte, zum Ausprobieren.',
    lp_price_1_f1: '1 Standort, 1 Stempelkarte', lp_price_1_f2: 'Scan per Handy-Kamera', lp_price_1_f3: 'E-Mail-Support',
    lp_price_2_t: 'Laden', lp_price_2_b: 'Für den einen Laden, der es ernst meint.',
    lp_price_2_f1: '1 Standort, unbegrenzt Karten', lp_price_2_f2: 'Alle Scan-Wege inkl. USB-Scanner',
    lp_price_2_f3: 'Statistik & Newsletter', lp_price_2_f4: 'Support am selben Werktag',
    lp_price_3_t: 'Kette', lp_price_3_b: 'Mehrere Standorte unter einem Dach.',
    lp_price_3_f1: 'Alles aus „Laden", pro Standort', lp_price_3_f2: 'Zentrales Admin-Panel',
    lp_price_3_f3: 'Sprache pro Laden', lp_price_3_f4: 'Fester Ansprechpartner',
```

`en`:

```js
    lp_price_eyebrow: 'Pricing',
    lp_price_title: 'One price per shop, no cut per stamp',
    lp_price_note: 'Plans are not final yet. Write to us and we will quote a price for your shop.',
    lp_price_amount: '[Price]', lp_price_permonth: '/ month', lp_price_persite: '/ location',
    lp_price_popular: 'Popular', lp_price_cta: 'Get in touch',
    lp_price_1_t: 'Start', lp_price_1_b: 'One location, one card, to try it out.',
    lp_price_1_f1: '1 location, 1 stamp card', lp_price_1_f2: 'Scanning by phone camera', lp_price_1_f3: 'Email support',
    lp_price_2_t: 'Shop', lp_price_2_b: 'For the one shop that means it.',
    lp_price_2_f1: '1 location, unlimited cards', lp_price_2_f2: 'All scan methods incl. USB scanner',
    lp_price_2_f3: 'Statistics & newsletter', lp_price_2_f4: 'Same business day support',
    lp_price_3_t: 'Chain', lp_price_3_b: 'Several locations under one roof.',
    lp_price_3_f1: 'Everything in "Shop", per location', lp_price_3_f2: 'Central admin panel',
    lp_price_3_f3: 'Language per shop', lp_price_3_f4: 'A named contact',
```

`ar`:

```js
    lp_price_eyebrow: 'الأسعار',
    lp_price_title: 'سعر واحد للمتجر، بلا عمولة على كل ختم',
    lp_price_note: 'الباقات لم تُحدَّد نهائياً بعد. راسلنا ونعطيك سعر متجرك.',
    lp_price_amount: '[السعر]', lp_price_permonth: '/ شهرياً', lp_price_persite: '/ لكل فرع',
    lp_price_popular: 'الأكثر طلباً', lp_price_cta: 'تواصل معنا',
    lp_price_1_t: 'البداية', lp_price_1_b: 'فرع واحد وبطاقة واحدة للتجربة.',
    lp_price_1_f1: 'فرع واحد، بطاقة واحدة', lp_price_1_f2: 'المسح بكاميرا الهاتف', lp_price_1_f3: 'دعم بالبريد',
    lp_price_2_t: 'المتجر', lp_price_2_b: 'للمتجر الذي يريدها بجدّية.',
    lp_price_2_f1: 'فرع واحد، بطاقات بلا حدّ', lp_price_2_f2: 'كل طرق المسح مع ماسح USB',
    lp_price_2_f3: 'إحصاءات ونشرة بريدية', lp_price_2_f4: 'دعم في نفس يوم العمل',
    lp_price_3_t: 'السلسلة', lp_price_3_b: 'عدّة فروع تحت مظلّة واحدة.',
    lp_price_3_f1: 'كل ما في «المتجر»، لكل فرع', lp_price_3_f2: 'لوحة إدارة مركزية',
    lp_price_3_f3: 'لغة خاصة لكل فرع', lp_price_3_f4: 'مسؤول تواصل ثابت',
```

- [ ] **Step 2: Pricing schreiben**

`src/pages/Landing/sections/Pricing.jsx`:

```jsx
import { useLang } from '../../../LangContext.jsx'
import Reveal from '../components/Reveal.jsx'

const TIERS = [
  { id: 1, features: ['f1', 'f2', 'f3'], unit: 'lp_price_permonth', popular: false },
  { id: 2, features: ['f1', 'f2', 'f3', 'f4'], unit: 'lp_price_permonth', popular: true },
  { id: 3, features: ['f1', 'f2', 'f3', 'f4'], unit: 'lp_price_persite', popular: false },
]

export default function Pricing() {
  const { t } = useLang()
  return (
    <section id="pricing" className="lp-pricing">
      <div className="lp-wrap">
        <Reveal>
          <div className="lp-sec-head">
            <span className="lp-eyebrow">{t('lp_price_eyebrow')}</span>
            <h2>{t('lp_price_title')}</h2>
            <p className="lp-price-note">{t('lp_price_note')}</p>
          </div>
        </Reveal>
        <div className="lp-price-grid">
          {TIERS.map(tier => (
            <Reveal key={tier.id}>
              <article className={tier.popular ? 'lp-tier is-popular' : 'lp-tier'}>
                {tier.popular && <span className="lp-tier-flag">{t('lp_price_popular')}</span>}
                <h3>{t(`lp_price_${tier.id}_t`)}</h3>
                <p className="lp-tier-sub">{t(`lp_price_${tier.id}_b`)}</p>
                <p className="lp-tier-amount">
                  <span>{t('lp_price_amount')}</span>
                  <small>{t(tier.unit)}</small>
                </p>
                <a className="lp-btn lp-btn--primary" href="#contact">{t('lp_price_cta')}</a>
                <ul className="lp-tier-list">
                  {tier.features.map(f => (
                    <li key={f}>{t(`lp_price_${tier.id}_${f}`)}</li>
                  ))}
                </ul>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 3: In Landing.jsx einhängen**

`<section id="pricing" />` ersetzen durch `<Pricing />`, Import ergänzen.

- [ ] **Step 4: CSS anhängen**

```css
/* ---------- Preise ---------- */
.lp-pricing { padding-block: 90px; }
.lp-price-note { font-size: 14.5px; color: var(--lp-muted); }
.lp-price-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 20px; align-items: stretch; }
.lp-price-grid > .lp-reveal { display: flex; }
.lp-tier {
  position: relative;
  background: var(--lp-surface);
  border: 1px solid var(--lp-line);
  border-radius: 14px;
  padding: 26px 22px;
  width: 100%;
  display: flex; flex-direction: column; gap: 12px;
}
.lp-tier.is-popular { border-color: var(--lp-brand); box-shadow: 0 18px 44px -22px rgba(60, 52, 137, .45); }
.lp-tier-flag {
  position: absolute; top: -11px; inset-inline-start: 22px;
  background: var(--lp-brand); color: #fff;
  font-family: var(--lp-display); font-size: 11px; font-weight: 600;
  letter-spacing: .08em; text-transform: uppercase;
  padding: 4px 10px; border-radius: 6px;
}
.lp-tier h3 { font-size: 22px; font-weight: 600; }
.lp-tier-sub { font-size: 14.5px; color: var(--lp-muted); }
.lp-tier-amount { display: flex; align-items: baseline; gap: 7px; }
.lp-tier-amount span { font-family: var(--lp-display); font-size: 30px; font-weight: 700; }
.lp-tier-amount small { font-size: 14px; color: var(--lp-muted); }
.lp-tier-list { list-style: none; padding: 0; margin: 4px 0 0; display: flex; flex-direction: column; gap: 8px; }
.lp-tier-list li { font-size: 14.5px; color: var(--lp-muted); padding-inline-start: 20px; position: relative; }
.lp-tier-list li::before {
  content: '';
  position: absolute; inset-inline-start: 0; top: .55em;
  width: 7px; height: 7px; border-radius: 50%;
  background: var(--lp-brand);
}
```

- [ ] **Step 5: Prüfen**

`npm run dev`. Erwartet: drei Tarife gleich hoch, „Beliebt"-Fähnchen am mittleren, Platzhalter-Hinweis darüber sichtbar. Sprache auf Arabisch stellen: das Fähnchen muss auf der rechten Seite sitzen, die Aufzählungspunkte rechts vom Text.

- [ ] **Step 6: Commit**

```bash
git add src/pages/Landing/ src/i18n.js
git commit -m "feat: Preis-Abschnitt mit Platzhalter-Tarifen"
```

---

### Task 10: DSGVO

**Files:**
- Create: `src/pages/Landing/sections/Trust.jsx`
- Modify: `src/pages/Landing/Landing.jsx`, `src/i18n.js`, `src/pages/Landing/Landing.css`

- [ ] **Step 1: i18n-Keys**

`de`:

```js
    // Landing — DSGVO
    lp_trust_eyebrow: 'Datenschutz',
    lp_trust_title: 'DSGVO-konform von Anfang an',
    lp_trust_body: 'Kundendaten gehören dem Kunden. Deshalb ist das kein Nachrüst-Thema, sondern von Beginn an eingebaut.',
    lp_trust_1_t: 'Double-Opt-In', lp_trust_1_b: 'Jeder Kunde bestätigt seine E-Mail-Adresse, bevor eine Karte aktiv wird.',
    lp_trust_2_t: 'Löschen mit einem Klick', lp_trust_2_b: 'Jede Mail trägt einen Lösch-Link. Nach Bestätigung sind alle Daten weg — unwiderruflich.',
    lp_trust_3_t: 'Newsletter nur mit Einwilligung', lp_trust_3_b: 'Werbung geht ausschließlich an Kunden, die ausdrücklich zugestimmt haben.',
```

`en`:

```js
    lp_trust_eyebrow: 'Privacy',
    lp_trust_title: 'GDPR-compliant from day one',
    lp_trust_body: 'Customer data belongs to the customer. So this was built in from the start, not bolted on later.',
    lp_trust_1_t: 'Double opt-in', lp_trust_1_b: 'Every customer confirms their email address before a card goes live.',
    lp_trust_2_t: 'Delete in one click', lp_trust_2_b: 'Every email carries a deletion link. Once confirmed, all data is gone — for good.',
    lp_trust_3_t: 'Newsletter only with consent', lp_trust_3_b: 'Marketing reaches only customers who explicitly agreed.',
```

`ar`:

```js
    lp_trust_eyebrow: 'حماية البيانات',
    lp_trust_title: 'متوافق مع حماية البيانات منذ البداية',
    lp_trust_body: 'بيانات الزبون ملك للزبون. لذلك بُني هذا من البداية، لا كإضافة لاحقة.',
    lp_trust_1_t: 'تأكيد مزدوج', lp_trust_1_b: 'يؤكّد كل زبون بريده قبل تفعيل البطاقة.',
    lp_trust_2_t: 'حذف بنقرة واحدة', lp_trust_2_b: 'كل رسالة تحمل رابط حذف. بعد التأكيد تختفي كل البيانات — نهائياً.',
    lp_trust_3_t: 'نشرة بموافقة فقط', lp_trust_3_b: 'لا تصل الإعلانات إلا لمن وافق صراحةً.',
```

- [ ] **Step 2: Trust schreiben**

`src/pages/Landing/sections/Trust.jsx`:

```jsx
import { useLang } from '../../../LangContext.jsx'
import Reveal from '../components/Reveal.jsx'

const POINTS = [1, 2, 3]

export default function Trust() {
  const { t } = useLang()
  return (
    <section id="trust" className="lp-trust">
      <div className="lp-wrap lp-trust-in">
        <Reveal>
          <div className="lp-sec-head">
            <span className="lp-eyebrow">{t('lp_trust_eyebrow')}</span>
            <h2>{t('lp_trust_title')}</h2>
            <p className="lp-lede">{t('lp_trust_body')}</p>
          </div>
        </Reveal>
        <div className="lp-trust-list">
          {POINTS.map((id, i) => (
            <Reveal key={id} delay={i * 60}>
              <div className="lp-trust-point">
                <h3>{t(`lp_trust_${id}_t`)}</h3>
                <p>{t(`lp_trust_${id}_b`)}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 3: In Landing.jsx einhängen**

`<section id="trust" />` ersetzen durch `<Trust />`, Import ergänzen.

- [ ] **Step 4: CSS anhängen**

```css
/* ---------- DSGVO ---------- */
.lp-trust { background: var(--lp-surface-2); padding-block: 90px; }
.lp-trust-in { display: grid; grid-template-columns: 1fr 1.15fr; gap: 48px; align-items: start; }
.lp-trust-in .lp-sec-head { margin-bottom: 0; }
.lp-trust-list { display: flex; flex-direction: column; gap: 22px; }
.lp-trust-point { display: flex; flex-direction: column; gap: 4px; }
.lp-trust-point h3 { font-size: 17px; font-weight: 600; }
.lp-trust-point p { font-size: 14.5px; color: var(--lp-muted); }
@media (max-width: 860px) { .lp-trust-in { grid-template-columns: 1fr; gap: 32px; } }
```

- [ ] **Step 5: Prüfen**

`npm run dev`. Zweispaltig am Desktop, einspaltig unter 860 px.

- [ ] **Step 6: Commit**

```bash
git add src/pages/Landing/ src/i18n.js
git commit -m "feat: DSGVO-Abschnitt"
```

---

### Task 11: Wallet-Finale

Der zweite Motion-Moment: ein einmaliger Auftritt, nicht scroll-gesteuert.

**Files:**
- Create: `src/pages/Landing/sections/WalletFinale.jsx`
- Modify: `src/pages/Landing/Landing.jsx`, `src/i18n.js`, `src/pages/Landing/Landing.css`

**Interfaces:**
- Consumes: `<LockScreen />` aus Task 4, `<Reveal />` aus Task 4. Uhrzeit- und Meldungstexte kommen aus den `lp_lock_*`-Keys aus Task 7 — nicht doppelt anlegen.

- [ ] **Step 1: i18n-Keys**

`de`:

```js
    // Landing — Wallet-Finale
    lp_wallet_title: 'Die Karte erinnert sich von selbst',
    lp_wallet_body: 'Ist die Karte voll, meldet sie sich auf dem Sperrbildschirm — in der Nähe deines Ladens, ohne dass du etwas tust.',
```

`en`:

```js
    lp_wallet_title: 'The card reminds them on its own',
    lp_wallet_body: 'Once the card is full it shows up on the lock screen — near your shop, with nothing to do on your side.',
```

`ar`:

```js
    lp_wallet_title: 'البطاقة تُذكّر بنفسها',
    lp_wallet_body: 'حين تمتلئ البطاقة تظهر على شاشة القفل — بالقرب من متجرك، دون أي جهد منك.',
```

- [ ] **Step 2: WalletFinale schreiben**

`src/pages/Landing/sections/WalletFinale.jsx`:

```jsx
import { useLang } from '../../../LangContext.jsx'
import Reveal from '../components/Reveal.jsx'
import LockScreen from '../components/LockScreen.jsx'

export default function WalletFinale() {
  const { t } = useLang()
  return (
    <section id="wallet" className="lp-wallet">
      <div className="lp-wrap lp-wallet-in">
        <Reveal>
          <div className="lp-wallet-copy">
            <h2>{t('lp_wallet_title')}</h2>
            <p className="lp-lede">{t('lp_wallet_body')}</p>
          </div>
        </Reveal>
        <Reveal delay={120}>
          <LockScreen
            clock={t('lp_lock_clock')}
            date={t('lp_lock_date')}
            title={t('lp_lock_title')}
            body={t('lp_lock_body')}
          />
        </Reveal>
      </div>
    </section>
  )
}
```

- [ ] **Step 3: In Landing.jsx einhängen**

`<section id="wallet" />` ersetzen durch `<WalletFinale />`, Import ergänzen.

- [ ] **Step 4: CSS anhängen**

```css
/* ---------- Wallet-Finale ---------- */
.lp-wallet { padding-block: 90px; background: var(--lp-surface); }
.lp-wallet-in {
  display: grid; grid-template-columns: 1fr auto;
  gap: 56px; align-items: center;
}
.lp-wallet-copy { display: flex; flex-direction: column; gap: 12px; }
.lp-wallet h2 { font-size: clamp(26px, 4.4vw, 38px); font-weight: 700; letter-spacing: -.02em; }
@media (max-width: 860px) {
  .lp-wallet-in { grid-template-columns: 1fr; gap: 36px; justify-items: center; text-align: center; }
  .lp-wallet-copy { align-items: center; }
}
```

- [ ] **Step 5: Prüfen**

`npm run dev`. Beim Hereinscrollen schieben sich Text und Telefon nacheinander leicht hoch. Beide sind vorher schon lesbar.

- [ ] **Step 6: Commit**

```bash
git add src/pages/Landing/ src/i18n.js
git commit -m "feat: Wallet-Finale vor dem Kontaktformular"
```

---

### Task 12: Kontaktformular (Frontend)

Der Endpunkt existiert noch nicht — der kommt in Task 13. Bis dahin schlägt das Absenden fehl, und genau das prüfen wir hier: die Fehlermeldung muss brauchbar sein.

**Files:**
- Create: `src/pages/Landing/sections/Contact.jsx`
- Modify: `src/pages/Landing/Landing.jsx`, `src/i18n.js`, `src/pages/Landing/Landing.css`

**Interfaces:**
- Consumes: `api` aus `src/api.js`. Vor dem Schreiben nachsehen, wie andere Seiten Anfragen stellen:

```bash
cat src/api.js
head -40 src/pages/Login.jsx
```

Der Code unten geht von einem Axios-Client mit `baseURL` aus (`api.post('/api/public/contact', body)`). Weicht `src/api.js` davon ab, passe den Aufruf an — nicht den Client.

- [ ] **Step 1: i18n-Keys**

`de`:

```js
    // Landing — Kontakt
    lp_contact_title: 'Bereit für digitale Stempelkarten?',
    lp_contact_body: 'Schreib uns kurz, was für einen Laden du hast. Wir melden uns am selben Werktag.',
    lp_contact_name: 'Name', lp_contact_shop: 'Laden', lp_contact_email: 'E-Mail', lp_contact_msg: 'Nachricht',
    lp_contact_send: 'Anfrage senden', lp_contact_sending: 'Wird gesendet…',
    lp_contact_ok: 'Angekommen. Wir melden uns am selben Werktag.',
    lp_contact_err: 'Die Anfrage kam nicht durch. Versuch es gleich noch einmal oder schreib direkt an hallo@stampit.de.',
```

`en`:

```js
    lp_contact_title: 'Ready for digital stamp cards?',
    lp_contact_body: 'Tell us briefly what kind of shop you run. We reply the same business day.',
    lp_contact_name: 'Name', lp_contact_shop: 'Shop', lp_contact_email: 'Email', lp_contact_msg: 'Message',
    lp_contact_send: 'Send request', lp_contact_sending: 'Sending…',
    lp_contact_ok: 'Received. We will reply the same business day.',
    lp_contact_err: 'The request did not go through. Try again in a moment or write to hallo@stampit.de.',
```

`ar`:

```js
    lp_contact_title: 'جاهز لبطاقات الختم الرقمية؟',
    lp_contact_body: 'اكتب لنا باختصار عن نوع متجرك. نردّ في نفس يوم العمل.',
    lp_contact_name: 'الاسم', lp_contact_shop: 'المتجر', lp_contact_email: 'البريد الإلكتروني', lp_contact_msg: 'الرسالة',
    lp_contact_send: 'أرسل الطلب', lp_contact_sending: 'جارٍ الإرسال…',
    lp_contact_ok: 'وصلت رسالتك. نردّ في نفس يوم العمل.',
    lp_contact_err: 'لم يصل الطلب. أعد المحاولة بعد قليل أو راسلنا على hallo@stampit.de.',
```

- [ ] **Step 2: Contact schreiben**

`src/pages/Landing/sections/Contact.jsx`:

```jsx
import { useState } from 'react'
import { useLang } from '../../../LangContext.jsx'
import api from '../../../api.js'

const EMPTY = { name: '', shop: '', email: '', message: '', website: '' }

export default function Contact() {
  const { t } = useLang()
  const [form, setForm] = useState(EMPTY)
  const [state, setState] = useState('idle') // idle | sending | ok | error

  const set = field => event => setForm(f => ({ ...f, [field]: event.target.value }))

  async function submit(event) {
    event.preventDefault()
    if (state === 'sending') return
    setState('sending')
    try {
      await api.post('/api/public/contact', form)
      setState('ok')
      setForm(EMPTY)
    } catch {
      setState('error')
    }
  }

  return (
    <section id="contact" className="lp-contact">
      <div className="lp-wrap lp-contact-in">
        <div className="lp-contact-copy">
          <h2>{t('lp_contact_title')}</h2>
          <p className="lp-lede">{t('lp_contact_body')}</p>
        </div>

        <form className="lp-form" onSubmit={submit} noValidate>
          <label className="lp-field">
            <span>{t('lp_contact_name')}</span>
            <input id="lp-name" name="name" value={form.name} onChange={set('name')} required autoComplete="name" />
          </label>
          <label className="lp-field">
            <span>{t('lp_contact_shop')}</span>
            <input id="lp-shop" name="shop" value={form.shop} onChange={set('shop')} required autoComplete="organization" />
          </label>
          <label className="lp-field">
            <span>{t('lp_contact_email')}</span>
            <input id="lp-email" name="email" type="email" value={form.email} onChange={set('email')} required autoComplete="email" />
          </label>
          <label className="lp-field lp-field--wide">
            <span>{t('lp_contact_msg')}</span>
            <textarea id="lp-message" name="message" rows="4" value={form.message} onChange={set('message')} required />
          </label>

          {/* Honigtopf gegen Bots — fuer Menschen unsichtbar, aber nicht
              display:none, sonst fuellen manche Bots ihn trotzdem nicht aus. */}
          <label className="lp-honeypot" aria-hidden="true">
            Website
            <input id="lp-website" name="website" tabIndex="-1" autoComplete="off" value={form.website} onChange={set('website')} />
          </label>

          <button className="lp-btn lp-btn--primary" type="submit" disabled={state === 'sending'}>
            {state === 'sending' ? t('lp_contact_sending') : t('lp_contact_send')}
          </button>

          {state === 'ok' && <p className="lp-form-msg is-ok" role="status">{t('lp_contact_ok')}</p>}
          {state === 'error' && <p className="lp-form-msg is-err" role="alert">{t('lp_contact_err')}</p>}
        </form>
      </div>
    </section>
  )
}
```

- [ ] **Step 3: In Landing.jsx einhängen**

`<section id="contact" />` ersetzen durch `<Contact />`, Import ergänzen.

- [ ] **Step 4: CSS anhängen**

```css
/* ---------- Kontakt ---------- */
.lp-contact { padding-block: 90px; background: var(--lp-surface-2); }
.lp-contact-in { display: grid; grid-template-columns: 1fr 1.1fr; gap: 48px; align-items: start; }
.lp-contact-copy { display: flex; flex-direction: column; gap: 12px; }
.lp-contact h2 { font-size: clamp(26px, 4.4vw, 38px); font-weight: 700; letter-spacing: -.02em; }
.lp-form {
  display: grid; grid-template-columns: 1fr 1fr; gap: 14px;
  background: var(--lp-surface); border: 1px solid var(--lp-line);
  border-radius: 14px; padding: 22px;
}
.lp-field { display: flex; flex-direction: column; gap: 5px; }
.lp-field--wide { grid-column: 1 / -1; }
.lp-field span { font-size: 13px; font-weight: 600; color: var(--lp-muted); }
.lp-field input, .lp-field textarea {
  font: inherit; font-size: 15px; color: var(--lp-ink);
  background: var(--lp-surface);
  border: 1px solid var(--lp-line); border-radius: 9px;
  padding: 10px 12px; width: 100%; resize: vertical;
}
.lp-field input:focus, .lp-field textarea:focus { border-color: var(--lp-brand); outline: none; }
.lp-form > .lp-btn { grid-column: 1 / -1; }
.lp-form-msg { grid-column: 1 / -1; font-size: 14.5px; }
.lp-form-msg.is-ok { color: #2C5F2E; }
.lp-form-msg.is-err { color: #A32015; }
.lp-honeypot {
  position: absolute; width: 1px; height: 1px;
  overflow: hidden; clip-path: inset(50%); white-space: nowrap;
}
@media (max-width: 860px) {
  .lp-contact-in { grid-template-columns: 1fr; gap: 32px; }
  .lp-form { grid-template-columns: 1fr; }
}
```

- [ ] **Step 5: Prüfen**

`npm run dev`. Formular ausfüllen und absenden. Erwartet: Knopf zeigt „Wird gesendet…", dann die rote Fehlermeldung mit der Ausweich-Adresse — der Endpunkt fehlt ja noch. Genau das ist hier richtig.

Tastatur prüfen: mit Tab durch alle Felder. Der Honigtopf darf **nicht** angesprungen werden.

- [ ] **Step 6: Commit**

```bash
git add src/pages/Landing/ src/i18n.js
git commit -m "feat: Kontaktformular auf der Landing-Page"
```

---

### Task 13: Kontakt-Endpunkt im Backend

**Anderes Repo.** `C:\Project SK\Stemplekarte`, Spring Boot, Deploy auf Render.

**Files:**
- Modify: `src/main/java/com/example/stemplekarte/service/EmailService.java`
- Create: `src/main/java/com/example/stemplekarte/controller/PublicContactController.java`
- Modify: `SecurityConfig` und `CorsConfig` (genaue Pfade mit `grep` suchen)

- [ ] **Step 1: Branch anlegen und Muster lesen**

```bash
cd "C:/Project SK/Stemplekarte"
git checkout -b landing-kontakt
grep -rn "api/public" src/main/java --include=*.java | head -20
sed -n '1,60p' src/main/java/com/example/stemplekarte/controller/PublicEmailController.java
grep -rn "public" src/main/java/com/example/stemplekarte/service/EmailService.java | head -20
```

Übernimm aus `PublicEmailController` die Annotationen, die Fehlerbehandlung und den Rückgabe-Typ. Übernimm aus `EmailService` die vorhandene Sende-Methode als Vorlage (sie kennt bereits Brevo-SMTP, `MAIL_ENABLED` und den Tageslimit-Schutz).

- [ ] **Step 2: Sende-Methode ergänzen**

In `EmailService`, neben den bestehenden Sende-Methoden. Absender, Limit-Prüfung und `MAIL_ENABLED` genauso behandeln wie in der Vorlage-Methode:

```java
    /**
     * Kontaktanfrage von der Landing-Page an den Betreiber.
     * Reply-To ist der Absender, damit eine Antwort direkt beim Interessenten landet.
     */
    public void sendContactRequestMail(String name, String shop, String fromEmail, String message) {
        String subject = "Kontaktanfrage: " + shop;
        String body = "Name:   " + name + "\n"
                    + "Laden:  " + shop + "\n"
                    + "E-Mail: " + fromEmail + "\n\n"
                    + message;
        // Versand wie in der Vorlage-Methode, zusaetzlich:
        //   helper.setReplyTo(fromEmail);
        //   Empfaenger = Betreiber-Adresse aus der Konfiguration
    }
```

- [ ] **Step 3: Controller schreiben**

`src/main/java/com/example/stemplekarte/controller/PublicContactController.java`:

```java
package com.example.stemplekarte.controller;

import com.example.stemplekarte.service.EmailService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/public")
public class PublicContactController {

    private final EmailService emailService;
    private final Map<String, Instant> lastRequest = new ConcurrentHashMap<>();
    private static final Duration COOLDOWN = Duration.ofMinutes(2);

    public PublicContactController(EmailService emailService) {
        this.emailService = emailService;
    }

    public record ContactRequest(String name, String shop, String email, String message, String website) {}

    @PostMapping("/contact")
    public ResponseEntity<Void> contact(@RequestBody ContactRequest req,
                                        @RequestHeader(value = "X-Forwarded-For", required = false) String forwarded) {
        // Honigtopf: nur Bots fuellen dieses Feld. Wir antworten mit 200,
        // damit der Bot nicht merkt, dass er erkannt wurde.
        if (req.website() != null && !req.website().isBlank()) {
            return ResponseEntity.ok().build();
        }

        if (isBlank(req.name()) || isBlank(req.shop()) || isBlank(req.email()) || isBlank(req.message())) {
            return ResponseEntity.badRequest().build();
        }
        if (!req.email().contains("@") || req.message().length() > 4000) {
            return ResponseEntity.badRequest().build();
        }

        String key = forwarded == null ? "unknown" : forwarded.split(",")[0].trim();
        Instant previous = lastRequest.get(key);
        if (previous != null && Duration.between(previous, Instant.now()).compareTo(COOLDOWN) < 0) {
            return ResponseEntity.status(429).build();
        }
        lastRequest.put(key, Instant.now());

        emailService.sendContactRequestMail(req.name(), req.shop(), req.email(), req.message());
        return ResponseEntity.ok().build();
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }
}
```

- [ ] **Step 4: Route freigeben**

`/api/public/contact` in `SecurityConfig` als `permitAll()` eintragen — dort, wo die übrigen `/api/public/**`-Routen stehen. Prüfen, ob `CorsConfig` die Vercel-Domain bereits erlaubt; falls die Landing-Page unter derselben Domain läuft wie die App, ist nichts zu ändern.

- [ ] **Step 5: Lokal prüfen**

Backend starten, dann:

```bash
curl -i -X POST http://localhost:8080/api/public/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","shop":"Café Nordwind","email":"test@example.com","message":"Hallo","website":""}'
```

Erwartet: `HTTP/1.1 200`. Sofort noch einmal absetzen → `429`. Mit `"website":"x"` → `200`, aber **keine** Mail. Mit leerem `name` → `400`.

- [ ] **Step 6: Commit**

```bash
git add src/main/java
git commit -m "feat: Endpunkt fuer Kontaktanfragen von der Landing-Page"
```

- [ ] **Step 7: Frontend gegen das laufende Backend prüfen**

Backend lokal laufen lassen, im Frontend `npm run dev`, Formular abschicken. Erwartet: grüne Bestätigung, Mail kommt an, `Reply-To` ist die eingegebene Adresse.

---

### Task 14: Abnahme

Kein neuer Code — die Prüfliste aus der Spec, abgearbeitet und dokumentiert.

**Files:**
- Modify: `docs/specs/2026-09-10-landing-page-motion-design.md` (Haken setzen)

- [ ] **Step 1: Produktions-Build prüfen**

```bash
cd "C:/Project SK/stempelkarte-frontend"
npm run build && npm run preview
```

Erwartet: Build ohne Fehler. Vorschau öffnen.

- [ ] **Step 2: Keine fremden Anfragen**

DevTools → Network → Filter `Font`, dann Seite neu laden. Erwartet: alle Schriften kommen von `localhost`. **Keine** Anfrage an `fonts.googleapis.com` oder `fonts.gstatic.com`. Zusätzlich Filter leeren und nach `google`, `gstatic`, `cdn` suchen — nichts darf auftauchen.

- [ ] **Step 3: Handy-Geräte**

DevTools → Geräte-Emulation → iPhone SE (375 px) und Pixel 7. Ganze Seite durchscrollen. Erwartet: keine waagerechte Scrollleiste, Bühne klebt sauber, Karte passt.

Wenn ein echtes Gerät verfügbar ist: `npm run dev -- --host`, Adresse am Handy öffnen. Auf iOS besonders prüfen, ob die Bühne beim Ein- und Ausblenden der Adressleiste springt.

- [ ] **Step 4: Arabisch**

Sprache auf Arabisch stellen. Erwartet:
- `dir="rtl"` am `<html>`
- Hero: Karte und Text spiegeln sich
- Preise: „Beliebt"-Fähnchen rechts, Aufzählungspunkte rechts
- Text in IBM Plex Sans Arabic, nicht in einer Systemschrift (in DevTools → Elements → Computed → `font-family` prüfen)

- [ ] **Step 5: Reduzierte Bewegung**

DevTools → Rendering → „Emulate CSS prefers-reduced-motion: reduce", neu laden. Erwartet: keine Bewegung, Bühne klebt nicht, alle drei Schritte lesbar, Karte voll.

- [ ] **Step 6: Ohne JavaScript**

DevTools → Settings → Debugger → „Disable JavaScript", neu laden. Die React-Seite bleibt leer — das ist bei einer SPA erwartbar. Stattdessen prüfen: JavaScript wieder an, Reveals per DevTools deaktivieren (`.lp-reveal { transform: none }`) und sicherstellen, dass kein Text fehlt.

- [ ] **Step 7: Route-Verhalten**

- Ausgeloggt auf `/` → Landing-Page
- `localStorage.token` setzen, neu laden → Dashboard
- Token löschen, DevTools → Application → Manifest → „App installieren", installierte App ausgeloggt öffnen → `/login`, nicht die Landing-Page

- [ ] **Step 8: Lighthouse**

DevTools → Lighthouse → Mobile → Performance + Accessibility. Erwartet: Performance ≥ 90, Accessibility ≥ 95. Bleibt Performance darunter, zuerst die Schrift-Schnitte prüfen — jeder importierte Schnitt kostet.

- [ ] **Step 9: Haken setzen und committen**

Prüfliste in der Spec abhaken, Abweichungen darunter notieren.

```bash
git add docs/specs/2026-09-10-landing-page-motion-design.md
git commit -m "docs: Abnahme der Landing-Page dokumentiert"
```

---

## Selbstprüfung des Plans

**Spec-Abdeckung:** Architektur → Tasks 1–5. Routing → Task 5. Motion (Bühne, Finale, Reveal, reduzierte Bewegung) → Tasks 4, 7, 11. Karte → Task 3. Gestaltung (Farben, Schriften) → Task 2. Abschnitte → Tasks 5–12. i18n/RTL → in jeder Abschnitts-Aufgabe, Abnahme in Task 14. Kontaktformular → Tasks 12 und 13. Prüfliste → Task 14. Keine Lücke.

**Namen, die aufgabenübergreifend gelten:** `progressOf`, `useScrollProgress`, `qrModules`, `QR_SIZE`, `QR_QUIET`, `StampCard`, `Reveal`, `LockScreen`, `isStandalone`, CSS-Präfix `lp-`, Karten-Zustandsklasse `is-done`, Slot-Klasse `is-on`, Reveal-Klasse `is-in`.

**Zwei Stellen, die beim Umsetzen scheitern können:**
1. `useLang()` und `t()` heißen im Repo möglicherweise anders. Task 5 Step 1 klärt das einmal für alle folgenden Aufgaben.
2. `api.post(...)` setzt einen Axios-Client mit `baseURL` voraus. Task 12 prüft das vor dem Schreiben.
