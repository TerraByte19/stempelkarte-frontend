import { BarcodeDetector, prepareZXingModule } from 'barcode-detector/ponyfill'
import zxingWasmUrl from 'zxing-wasm/reader/zxing_reader.wasm?url'
import QrScanner from 'qr-scanner'
import { leseSchleife } from './leseSchleife'

/**
 * Die Herausforderer-Leser fuer die stille Messung im Scanner (scannerWahl):
 * sie lesen das Videobild, das html5-qrcode ("alt") schon zeigt, und melden
 * ihren Treffer. Sie oeffnen keine eigene Kamera.
 *
 * neu   = ZXing-C++ als WebAssembly, auf jedem Handy gleich
 * nimiq = qr-scanner von Nimiq, rechnet in einem eigenen Worker
 * handy = eingebauter Leser des Browsers (Chrome auf Android)
 *
 * Die .wasm-Datei kommt vom eigenen Server (DSGVO, offline). Sie wird
 * erst geladen, wenn der erste Leser startet - nicht beim Oeffnen der App.
 */

let zxingBereit = null
function zxingVorbereiten() {
  if (!zxingBereit) {
    zxingBereit = prepareZXingModule({
      overrides: { locateFile: (path, prefix) => (path.endsWith('.wasm') ? zxingWasmUrl : prefix + path) },
      fireImmediately: true,
    })
    zxingBereit.catch(() => { zxingBereit = null })
  }
  return zxingBereit
}

// qr-scanner wuerde auf Android sonst still den eingebauten Leser nehmen -
// dann waere es dasselbe wie "handy".
QrScanner._disableBarcodeDetector = true

export function verfuegbareLeser() {
  const handy = typeof window !== 'undefined' && 'BarcodeDetector' in window
  return handy ? ['neu', 'nimiq', 'handy'] : ['neu', 'nimiq']
}

/**
 * Startet einen Leser auf dem Video-Element. Liest hoechstens alle
 * abstandMs ein Bild (schont das Handy), hoert nach dem ersten
 * angenommenen Treffer oder bei stop() auf. Gibt onTreffer(text) false
 * zurueck (Treffer verworfen), liest er weiter.
 *
 * bereit(): gelesen wird nur, solange das ja sagt - der Scanner gibt hier
 * "html5-qrcode scannt wieder" mit (Grund in lib/leseSchleife).
 */
export function starteLeser(art, video, onTreffer, { abstandMs = 120, bereit = () => true } = {}) {
  let lebt = true
  let worker = null
  let leinwand = null

  async function lesenBauen() {
    if (art === 'nimiq') {
      worker = await QrScanner.createQrEngine()
      leinwand = document.createElement('canvas')
      return async () => {
        const seite = Math.round(Math.min(video.videoWidth, video.videoHeight) * 2 / 3)
        const bereich = {
          x: Math.round((video.videoWidth - seite) / 2), y: Math.round((video.videoHeight - seite) / 2),
          width: seite, height: seite, downScaledWidth: 400, downScaledHeight: 400,
        }
        try {
          const ergebnis = await QrScanner.scanImage(video, {
            scanRegion: bereich, qrEngine: worker, canvas: leinwand, returnDetailedScanResult: true,
          })
          return ergebnis.data
        } catch (e) {
          if (e === QrScanner.NO_QR_CODE_FOUND) return null
          throw e
        }
      }
    }
    if (art === 'neu') await zxingVorbereiten()
    const Leser = art === 'handy' ? window.BarcodeDetector : BarcodeDetector
    const leser = new Leser({ formats: ['qr_code'] })
    return async () => {
      const codes = await leser.detect(video)
      return codes.length > 0 ? codes[0].rawValue : null
    }
  }

  ;(async () => {
    try {
      const lesen = await lesenBauen()
      await leseSchleife({
        lesen,
        bereit: () => bereit() && video.readyState >= 2 && !video.paused,
        onTreffer,
        lebt: () => lebt,
        warte: () => new Promise(resolve => setTimeout(resolve, abstandMs)),
      })
    } catch {
      // Leser kaputt (kein WASM, kein Worker): still aufgeben, der alte
      // Scanner stempelt weiter.
    } finally {
      try { worker?.terminate() } catch { /* egal */ }
    }
  })()

  return { stop() { lebt = false } }
}
