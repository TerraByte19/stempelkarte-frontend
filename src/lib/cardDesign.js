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
}
