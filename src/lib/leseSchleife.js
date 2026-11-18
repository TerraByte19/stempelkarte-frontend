/**
 * Leseschleife eines Herausforderer-Lesers (lib/scannerLeser), ohne
 * Browser - deshalb mit node:test pruefbar.
 *
 * bereit()   Darf gerade gelesen werden? Der Aufrufer prueft das Video UND
 *            ob html5-qrcode selbst wieder scannt. Grund: nach resume() ist
 *            video.paused sofort false, im Video steht aber noch das
 *            eingefrorene Bild mit dem QR-Code des Kunden davor. Wer da
 *            liest, stempelt den vorigen Kunden noch einmal.
 * onTreffer  Gibt false zurueck, wenn der Treffer verworfen wurde (Code des
 *            Kunden davor, lib/scanSperre) - dann wird weitergelesen.
 * lebt()     false nach stop(). Ein Treffer, waehrend dessen Berechnung
 *            gestoppt wurde, wird nicht mehr gemeldet.
 * warte()    Pause zwischen zwei Bildern (schont das Handy).
 */
export async function leseSchleife({ lesen, bereit, onTreffer, lebt, warte }) {
  while (lebt()) {
    if (bereit()) {
      const text = await lesen()
      if (!lebt()) return
      if (text && onTreffer(text) !== false) return
    }
    await warte()
  }
}
