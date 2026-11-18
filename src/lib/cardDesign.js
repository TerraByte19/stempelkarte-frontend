/**
 * Vorgabe-Design einer neuen Karte.
 *
 * Eigene Datei, keine Konstante in CardPreview.jsx: eine Datei, die
 * Komponenten UND Konstanten exportiert, bricht Fast Refresh im Dev-Server -
 * dann laedt bei jeder Aenderung die ganze Seite neu statt nur der Komponente.
 */
export const DEFAULT_DESIGN = {
  colorBackground: '#3C3489',
  colorForeground: '#FFFFFF',
  colorLabel: '#FAC875',
  logoUrl: '',
  logoRing: false,
  heroImageUrl: '',
  walletStyle: 'number',
  stampIconType: 'preset',
  stampPreset: 'coffee',
  stampColor: '#6F4E37',
  emptyStampStyle: 'number',
  stampIconUrl: '',
  stampIconUrls: [],
  stripImageUrl: '',
  stripOriginalUrl: '',
}

// Gleiche Grenze wie im Backend (Card.MAX_STEMPEL_BILDER).
export const MAX_STEMPEL_BILDER = 10

/**
 * Alle eigenen Stempel-Bilder in Reihenfolge. Ein aelterer Server und eine
 * Karte beim Anlegen kennen nur das eine Bild (stampIconUrl) - dann ist das
 * die ganze Liste.
 */
export function stempelBilder(design) {
  const liste = Array.isArray(design?.stampIconUrls) ? design.stampIconUrls.filter(Boolean) : []
  if (liste.length) return liste
  return design?.stampIconUrl ? [design.stampIconUrl] : []
}
