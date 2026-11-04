import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { BarcodeDetector, prepareZXingModule } from 'barcode-detector/ponyfill'
import zxingWasmUrl from 'zxing-wasm/reader/zxing_reader.wasm?url'
import QrScanner from 'qr-scanner'
import { useLang } from '../LangContext'
import { LogoZeichen } from '../components/Logo'

// Testseite: mehrere Scanner nebeneinander, zum Ausprobieren bei echtem
// Licht. Liest nur den Code und misst die Zeit - stempelt NICHTS, schickt
// nichts an den Server. Deshalb ohne Anmeldung erreichbar.
//
// alt    = html5-qrcode (wie der Scanner heute)
// neu    = ZXing-C++ als WebAssembly (barcode-detector), auf jedem Handy gleich
// nimiq  = qr-scanner von Nimiq, rechnet in einem eigenen Worker
// handy  = eingebauter Leser des Browsers (Chrome auf Android), falls vorhanden

// Die .wasm-Datei liefern wir selbst aus statt vom fremden CDN (DSGVO, offline).
prepareZXingModule({
  overrides: {
    locateFile: (path, prefix) => (path.endsWith('.wasm') ? zxingWasmUrl : prefix + path),
  },
})
// qr-scanner wuerde auf Android sonst still den eingebauten Leser nehmen -
// dann waere es dasselbe wie "handy". So testet es immer seinen eigenen.
QrScanner._disableBarcodeDetector = true

const KAMERA = {
  facingMode: 'environment',
  width: { ideal: 1280 },
  height: { ideal: 720 },
  advanced: [{ focusMode: 'continuous' }, { exposureMode: 'continuous' }, { whiteBalanceMode: 'continuous' }],
}
const PAUSE_MS = 1500
// Uhr fuer die Messung, ausserhalb der Komponente (laeuft nur in Handlern).
const jetzt = () => performance.now()

const hatHandyLeser = typeof window !== 'undefined' && 'BarcodeDetector' in window

export default function ScannerTest() {
  const { t } = useLang()
  const [art, setArt] = useState('neu')
  const [laeuft, setLaeuft] = useState(false)
  const [fehler, setFehler] = useState('')
  const [treffer, setTreffer] = useState(null) // { ms, laenge }
  const [zeiten, setZeiten] = useState({ alt: [], neu: [], nimiq: [], handy: [] })

  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const html5Ref = useRef(null)
  const workerRef = useRef(null) // Worker von qr-scanner
  const laufRef = useRef(0) // Zaehler: alte Schleifen erkennen und beenden
  const startRef = useRef(0)

  async function stoppen() {
    laufRef.current += 1
    if (html5Ref.current) {
      try { await html5Ref.current.stop() } catch { /* war schon aus */ }
      try { html5Ref.current.clear() } catch { /* leer */ }
      html5Ref.current = null
    }
    if (workerRef.current) {
      workerRef.current.terminate()
      workerRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setLaeuft(false)
  }

  // Ein Treffer: Zeit merken, kurz anzeigen, dann neu messen.
  function erkannt(welche, text) {
    const ms = Math.round(jetzt() - startRef.current)
    setTreffer({ ms, laenge: text.length })
    setZeiten(z => ({ ...z, [welche]: [...z[welche], ms].slice(-20) }))
    return new Promise(resolve => setTimeout(() => {
      setTreffer(null)
      startRef.current = jetzt()
      resolve()
    }, PAUSE_MS))
  }

  async function starten(welche) {
    await stoppen()
    setFehler('')
    setTreffer(null)
    setArt(welche)
    setLaeuft(true)
    const lauf = laufRef.current
    // Erst rendern lassen, damit Video bzw. Container im DOM sind.
    await new Promise(resolve => setTimeout(resolve, 50))

    try {
      if (welche === 'alt') {
        let pausiert = false
        html5Ref.current = new Html5Qrcode('scanner-test-alt')
        await html5Ref.current.start(
            { facingMode: 'environment' },
            { fps: 20, videoConstraints: KAMERA },
            async text => {
              if (pausiert || lauf !== laufRef.current) return
              pausiert = true
              await erkannt('alt', text)
              pausiert = false
            },
            () => {},
        )
        startRef.current = jetzt()
        return
      }

      const stream = await navigator.mediaDevices.getUserMedia({ video: KAMERA, audio: false })
      if (lauf !== laufRef.current) { stream.getTracks().forEach(track => track.stop()); return }
      streamRef.current = stream
      const video = videoRef.current
      video.srcObject = stream
      await video.play()

      // lesen(): ein Kamerabild auswerten, Text oder null zurueck.
      let lesen
      if (welche === 'nimiq') {
        const worker = await QrScanner.createQrEngine()
        if (lauf !== laufRef.current) { worker.terminate(); return }
        workerRef.current = worker
        const leinwand = document.createElement('canvas')
        lesen = async () => {
          // Wie qr-scanner selbst: mittleres Quadrat (2/3), auf 400 px verkleinert.
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
      } else {
        const Leser = welche === 'handy' ? window.BarcodeDetector : BarcodeDetector
        const leser = new Leser({ formats: ['qr_code'] })
        lesen = async () => {
          const codes = await leser.detect(video)
          return codes.length > 0 ? codes[0].rawValue : null
        }
      }
      startRef.current = jetzt()

      // Ein Bild nach dem anderen: erst wenn das letzte ausgewertet ist,
      // kommt das naechste. So staut sich auf langsamen Handys nichts.
      while (lauf === laufRef.current) {
        if (video.readyState >= 2) {
          const text = await lesen()
          if (lauf !== laufRef.current) break
          if (text) await erkannt(welche, text)
        }
        await new Promise(resolve => requestAnimationFrame(resolve))
      }
    } catch (e) {
      if (lauf !== laufRef.current) return
      setFehler(e?.name === 'NotAllowedError' ? t('stest_err_perm') : t('stest_err_cam'))
      await stoppen()
    }
  }

  useEffect(() => () => { stoppen() }, [])

  const schnitt = liste => liste.length ? Math.round(liste.reduce((a, b) => a + b, 0) / liste.length) : null
  const arten = ['alt', 'neu', 'nimiq', ...(hatHandyLeser ? ['handy'] : [])]

  return (
      <div style={s.seite}>
        <div style={s.kopf}>
          <LogoZeichen size={32} />
          <div>
            <h1 style={s.titel}>{t('stest_title')}</h1>
            <p style={s.text}>{t('stest_intro')}</p>
          </div>
        </div>

        <div style={s.wahl} role="group" aria-label={t('stest_title')}>
          {arten.map(a => (
              <button key={a} type="button" onClick={() => starten(a)} aria-pressed={laeuft && art === a}
                      style={{ ...s.wahlKnopf, ...(laeuft && art === a ? s.wahlAktiv : {}) }}>
                {t(`stest_${a}`)}
              </button>
          ))}
        </div>

        <div style={s.bild}>
          {/* Beide Flaechen bleiben im DOM; nur die aktive ist sichtbar. */}
          <div id="scanner-test-alt" style={{ width: '100%', display: laeuft && art === 'alt' ? 'block' : 'none' }} />
          <video ref={videoRef} playsInline muted
                 style={{ ...s.video, display: laeuft && art !== 'alt' ? 'block' : 'none' }} />
          {!laeuft && <p style={s.leer}>{t('stest_pick')}</p>}
          {treffer && (
              <div style={s.treffer} role="status">
                <strong style={s.trefferZahl}>{treffer.ms} ms</strong>
                <span>{t('stest_hit', { n: treffer.laenge })}</span>
              </div>
          )}
        </div>

        {laeuft && <button type="button" style={s.stopp} onClick={stoppen}>{t('stest_stop')}</button>}
        {fehler && <p style={s.fehler} role="alert">{fehler}</p>}

        <div style={s.tabelle}>
          {arten.map(a => (
              <div key={a} style={s.zeile}>
                <span>{t(`stest_${a}`)}</span>
                <span style={s.wert}>
                  {zeiten[a].length
                      ? t('stest_avg', { ms: schnitt(zeiten[a]), n: zeiten[a].length })
                      : '–'}
                </span>
              </div>
          ))}
        </div>
        <p style={s.hinweis}>{t('stest_tip')}</p>
      </div>
  )
}

const s = {
  seite: { maxWidth: 520, margin: '0 auto', padding: '24px 16px 48px', minHeight: '100vh', background: 'var(--sk-surface-2)', boxSizing: 'border-box' },
  kopf: { display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 18 },
  titel: { fontSize: 22, margin: '2px 0 4px', color: 'var(--sk-ink)' },
  text: { fontSize: 14, color: 'var(--sk-muted)', margin: 0, lineHeight: 1.5 },
  wahl: { display: 'flex', gap: 6, padding: 4, background: 'white', border: '1px solid var(--sk-line)', borderRadius: 12, marginBottom: 12 },
  wahlKnopf: { flex: '1 1 0', minWidth: 0, padding: '10px 4px', border: 0, borderRadius: 9, background: 'transparent', color: 'var(--sk-muted)', fontWeight: 600, fontSize: 14, cursor: 'pointer' },
  wahlAktiv: { background: 'var(--sk-brand)', color: 'white' },
  bild: { position: 'relative', background: '#111', borderRadius: 14, overflow: 'hidden', minHeight: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  video: { width: '100%', height: 'auto' },
  leer: { color: 'rgba(255,255,255,.75)', fontSize: 14, padding: 24, textAlign: 'center', margin: 0 },
  treffer: { position: 'absolute', inset: 'auto 12px 12px 12px', background: 'rgba(28,140,70,.95)', color: 'white', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'baseline', gap: 10, fontSize: 14 },
  trefferZahl: { fontSize: 22 },
  stopp: { marginTop: 10, width: '100%', padding: 12, borderRadius: 10, border: '1.5px solid var(--sk-line)', background: 'white', fontWeight: 600, fontSize: 14, cursor: 'pointer' },
  fehler: { marginTop: 10, background: '#fff0f0', color: '#b00', padding: '10px 14px', borderRadius: 8, fontSize: 14 },
  tabelle: { marginTop: 16, background: 'white', borderRadius: 12, border: '1px solid var(--sk-line)' },
  zeile: { display: 'flex', justifyContent: 'space-between', gap: 12, padding: '12px 14px', borderTop: '1px solid var(--sk-line)', fontSize: 14, color: 'var(--sk-ink)' },
  wert: { fontWeight: 600 },
  hinweis: { marginTop: 14, fontSize: 13, color: 'var(--sk-muted)', lineHeight: 1.5 },
}
