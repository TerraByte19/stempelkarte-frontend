// Die Marke an EINER Stelle. engine.js schreibt diese Werte als CSS-Variablen
// auf :root (--night, --brand, ...), Bausteine nutzen sie in CSS als var(--x)
// und in erzeugtem SVG als B.x. Zwischentoene (Thekenverlauf, Schatten) stehen
// bewusst bei den Bausteinen: sie gehoeren zum einzelnen Bild, nicht zur Marke.
export const BRAND = {
  night: '#0E0A24',     // Hintergrund oben
  night2: '#1B1446',    // Hintergrund unten
  wall: '#2A2166',
  brand: '#3C3489',     // Stampit-Lila
  cardFrom: '#463DA0',  // Wallet-Karte, Verlauf
  cardTo: '#2C2570',
  lilac: '#B9B0FF',     // Akzent, hervorgehobene Woerter
  paper: '#F4EEE2',     // Papierkarte
  ink: '#1A1A2E',       // Schrift auf Papier
  display: "'Space Grotesk', sans-serif", // Titel, Zahlen, Textzeilen
  body: "'Hanken Grotesk', sans-serif"    // alles Kleinere
}

export const CSS_VARS = {
  '--night': BRAND.night, '--night2': BRAND.night2, '--wall': BRAND.wall, '--brand': BRAND.brand,
  '--card-from': BRAND.cardFrom, '--card-to': BRAND.cardTo, '--lilac': BRAND.lilac, '--paper': BRAND.paper,
  '--ink': BRAND.ink, '--display': BRAND.display, '--body': BRAND.body
}

// Das Logo aus src/components/Logo.jsx: Stempel im abgerundeten Quadrat.
export const logoSvg = (size, tile = '#FFFFFF', mark = BRAND.brand) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="${tile}"/><circle cx="12" cy="8" r="3.2" fill="${mark}"/><rect x="10.7" y="10.4" width="2.6" height="3.4" fill="${mark}"/><rect x="6.6" y="13.4" width="10.8" height="2.8" rx="1" fill="${mark}"/><rect x="7.6" y="18" width="8.8" height="1.3" rx="0.65" fill="${mark}" opacity="0.8"/></svg>`
