import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { BarcodeDetector, prepareZXingModule } from 'barcode-detector/ponyfill'
import zxingWasmUrl from 'zxing-wasm/reader/zxing_reader.wasm?url'
import QrScanner from 'qr-scanner'
import { useLang, localeTag } from '../LangContext'
import { LogoZeichen } from '../components/Logo'

// Testseite: mehrere Scanner im Vergleich, zum Ausprobieren bei echtem
// Licht. Liest nur den Code und misst die Zeit - stempelt NICHTS, schickt
// nichts an den Server. Deshalb ohne Anmeldung erreichbar.
//
// Einfacher Test (fuer Laeden): jeder Scanner genau ein Scan, danach das
// Ergebnis per Teilen an uns schicken.
// Ausfuehrlicher Test: Scanner frei waehlen, beliebig oft messen.
//
// alt    = html5-qrcode (wie der Scanner heute)
// neu    = ZXing-C++ als WebAssembly (barcode-detector), auf jedem Handy gleich
// nimiq  = qr-scanner von Nimiq, rechnet in einem eigenen Worker
// handy  = eingebauter Leser des Browsers (Chrome auf Android), falls vorhanden

// Die .wasm-Datei liefern wir selbst aus statt vom fremden CDN (DSGVO, offline).
// Sofort laden (fireImmediately): sonst zaehlt der erste Scan die Ladezeit
// der Datei (~400 kB) mit und ZXing wirkt langsamer, als es ist.
const zxingBereit = prepareZXingModule({
  overrides: {
    locateFile: (path, prefix) => (path.endsWith('.wasm') ? zxingWasmUrl : prefix + path),
  },
  fireImmediately: true,
})
zxingBereit.catch(() => { /* Fehler zeigt starten() beim Warten */ })
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
const WEITER_MS = 1200 // einfacher Test: Treffer kurz zeigen, dann naechster Scanner
const ZEITLIMIT_MS = 20000 // einfacher Test: so lange darf ein Scanner suchen
// Uhr fuer die Messung, ausserhalb der Komponente (laeuft nur in Handlern).
const jetzt = () => performance.now()

const hatHandyLeser = typeof window !== 'undefined' && 'BarcodeDetector' in window
const ARTEN = ['alt', 'neu', 'nimiq', ...(hatHandyLeser ? ['handy'] : [])]
// Fuer Laeden neutrale Namen, damit niemand "Alt" oder "Neu" bevorzugt.
const BUCHSTABE = { alt: 'A', neu: 'B', nimiq: 'C', handy: 'D' }

function gemischt(liste) {
  const kopie = [...liste]
  for (let i = kopie.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[kopie[i], kopie[j]] = [kopie[j], kopie[i]]
  }
  return kopie
}

// Kurze Geraeteangabe fuer das Ergebnis, z. B. "iPhone, iOS 17.5".
function geraet() {
  const ua = navigator.userAgent
  const ios = ua.match(/(iPhone|iPad)[^)]*OS (\d+)_(\d+)/)
  if (ios) return `${ios[1]}, iOS ${ios[2]}.${ios[3]}`
  const android = ua.match(/Android (\d+(?:\.\d+)?)/)
  if (android) return `Android ${android[1]}`
  return navigator.platform || 'unbekannt'
}

export default function ScannerTest() {
  const { t, lang } = useLang()
  const [ansicht, setAnsicht] = useState('einfach') // einfach | profi
  const [art, setArt] = useState('neu')
  const [laeuft, setLaeuft] = useState(false)
  const [fehler, setFehler] = useState('')
  const [treffer, setTreffer] = useState(null) // { ms, laenge }
  const [zeiten, setZeiten] = useState({ alt: [], neu: [], nimiq: [], handy: [] })
  // Einfacher Test: null = Start, Zahl = aktueller Schritt, 'fertig'
  const [schritt, setSchritt] = useState(null)
  const [reihenfolge, setReihenfolge] = useState(ARTEN)
  const [ergebnisse, setErgebnisse] = useState({}) // art -> ms oder null (nicht erkannt)
  const [kopiert, setKopiert] = useState(false)

  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const html5Ref = useRef(null)
  const workerRef = useRef(null) // Worker von qr-scanner
  const laufRef = useRef(0) // Zaehler: alte Schleifen erkennen und beenden
  const startRef = useRef(0)
  const einfachRef = useRef(null) // { reihenfolge, index } waehrend des einfachen Tests
  const uhrRef = useRef(null) // Zeitlimit und Weiter-Pause im einfachen Test

  const sekunden = ms => new Intl.NumberFormat(localeTag(lang), {
    minimumFractionDigits: 1, maximumFractionDigits: 1,
  }).format(ms / 1000)
  const scannerName = a => t('stest_easy_name', { name: BUCHSTABE[a] })

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

  function uhrAus() {
    clearTimeout(uhrRef.current)
    uhrRef.current = null
  }

  // --- Einfacher Test ---------------------------------------------------

  function schrittStarten(index) {
    const lauf = einfachRef.current
    if (!lauf) return
    uhrAus()
    setTreffer(null)
    if (index >= lauf.reihenfolge.length) {
      einfachRef.current = null
      setSchritt('fertig')
      stoppen()
      return
    }
    lauf.index = index
    setSchritt(index)
    const welche = lauf.reihenfolge[index]
    starten(welche)
    // Findet ein Scanner nichts, zaehlt das als "nicht erkannt".
    uhrRef.current = setTimeout(() => schrittAbschliessen(welche, null), ZEITLIMIT_MS)
  }

  function schrittAbschliessen(welche, ms) {
    const lauf = einfachRef.current
    if (!lauf || lauf.reihenfolge[lauf.index] !== welche) return
    uhrAus()
    setErgebnisse(e => ({ ...e, [welche]: ms }))
    stoppen()
    if (ms === null) { schrittStarten(lauf.index + 1); return }
    uhrRef.current = setTimeout(() => schrittStarten(lauf.index + 1), WEITER_MS)
  }

  function testStarten() {
    const folge = gemischt(ARTEN)
    einfachRef.current = { reihenfolge: folge, index: 0 }
    setReihenfolge(folge)
    setErgebnisse({})
    setKopiert(false)
    setFehler('')
    schrittStarten(0)
  }

  function ergebnisText() {
    const zeilen = reihenfolge.map(a => {
      const ms = ergebnisse[a]
      const wert = ms == null ? t('stest_share_none') : `${sekunden(ms)} s (${ms} ms)`
      return `${scannerName(a)} (${a}): ${wert}`
    })
    return [t('stest_share_title'), `${t('stest_share_device')}: ${geraet()}`, ...zeilen].join('\n')
  }

  async function ergebnisSenden() {
    const text = ergebnisText()
    if (navigator.share) {
      try { await navigator.share({ text }); return } catch (e) {
        if (e?.name === 'AbortError') return
      }
    }
    try {
      await navigator.clipboard.writeText(text)
      setKopiert(true)
    } catch {
      window.prompt(t('stest_easy_copy_hint'), text)
    }
  }

  // --- Scannen (beide Ansichten) ----------------------------------------

  // Ein Treffer: im einfachen Test weiter zum naechsten Scanner, sonst
  // Zeit merken, kurz anzeigen und neu messen.
  function erkannt(welche, text) {
    const ms = Math.round(jetzt() - startRef.current)
    setTreffer({ ms, laenge: text.length })
    if (einfachRef.current) {
      schrittAbschliessen(welche, ms)
      return Promise.resolve()
    }
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
        if (welche === 'neu') {
          await zxingBereit
          if (lauf !== laufRef.current) return
        }
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
      // Kamera geht nicht: einfachen Test abbrechen, sonst laeuft er ins Leere.
      einfachRef.current = null
      uhrAus()
      setSchritt(null)
      await stoppen()
    }
  }

  function ansichtWechseln(neu) {
    einfachRef.current = null
    uhrAus()
    stoppen()
    setSchritt(null)
    setTreffer(null)
    setFehler('')
    setAnsicht(neu)
  }

  useEffect(() => () => {
    einfachRef.current = null
    clearTimeout(uhrRef.current)
    stoppen()
  }, [])

  const schnitt = liste => liste.length ? Math.round(liste.reduce((a, b) => a + b, 0) / liste.length) : null
  const einfach = ansicht === 'einfach'
  const imTest = einfach && typeof schritt === 'number'

  // Kamerabild: in beiden Ansichten dasselbe, beide Flaechen bleiben im DOM.
  const bild = (
      <div style={{ ...s.bild, display: einfach && !imTest ? 'none' : 'flex' }}>
        <div id="scanner-test-alt" style={{ width: '100%', display: laeuft && art === 'alt' ? 'block' : 'none' }} />
        <video ref={videoRef} playsInline muted
               style={{ ...s.video, display: laeuft && art !== 'alt' ? 'block' : 'none' }} />
        {!laeuft && !treffer && <p style={s.leer}>{t(einfach ? 'stest_easy_hold' : 'stest_pick')}</p>}
        {treffer && (
            <div style={s.treffer} role="status">
              <strong style={s.trefferZahl}>
                {einfach ? t('stest_easy_hit', { s: sekunden(treffer.ms) }) : `${treffer.ms} ms`}
              </strong>
              {!einfach && <span>{t('stest_hit', { n: treffer.laenge })}</span>}
            </div>
        )}
      </div>
  )

  const fertigeListe = [...reihenfolge].sort((a, b) => {
    const x = ergebnisse[a], y = ergebnisse[b]
    if (x == null && y == null) return 0
    if (x == null) return 1
    if (y == null) return -1
    return x - y
  })
  const schnellster = fertigeListe.find(a => ergebnisse[a] != null)

  return (
      <div style={s.seite}>
        <div style={s.kopf}>
          <LogoZeichen size={32} />
          <div>
            <h1 style={s.titel}>{t('stest_title')}</h1>
            <p style={s.text}>{einfach ? t('stest_easy_intro', { n: ARTEN.length }) : t('stest_intro')}</p>
          </div>
        </div>

        {einfach && schritt === null && (
            <>
              <div style={s.karte}>
                <h2 style={s.anleitungTitel}>{t('stest_easy_how')}</h2>
                <ol style={s.liste}>
                  {[1, 2, 3, 4].map(n => <li key={n} style={s.punkt}>{t(`stest_easy_how_${n}`)}</li>)}
                </ol>
              </div>
              <button type="button" style={s.haupt} onClick={testStarten}>{t('stest_easy_start')}</button>
            </>
        )}

        {imTest && (
            <p style={s.schritt}>
              <strong>{scannerName(reihenfolge[schritt])}</strong>
              <span>{t('stest_easy_step', { i: schritt + 1, n: reihenfolge.length })}</span>
            </p>
        )}

        {!einfach && (
            <div style={s.wahl} role="group" aria-label={t('stest_title')}>
              {ARTEN.map(a => (
                  <button key={a} type="button" onClick={() => starten(a)} aria-pressed={laeuft && art === a}
                          style={{ ...s.wahlKnopf, ...(laeuft && art === a ? s.wahlAktiv : {}) }}>
                    {t(`stest_${a}`)}
                  </button>
              ))}
            </div>
        )}

        {bild}

        {imTest && !treffer && (
            <button type="button" style={s.stopp}
                    onClick={() => schrittAbschliessen(reihenfolge[schritt], null)}>
              {t('stest_easy_skip')}
            </button>
        )}
        {!einfach && laeuft && <button type="button" style={s.stopp} onClick={stoppen}>{t('stest_stop')}</button>}
        {fehler && <p style={s.fehler} role="alert">{fehler}</p>}

        {einfach && schritt === 'fertig' && (
            <div>
              <h2 style={s.fertigTitel}>{t('stest_easy_done')}</h2>
              <div style={s.tabelle}>
                {fertigeListe.map(a => (
                    <div key={a} style={s.zeile}>
                      <span>
                        {scannerName(a)}
                        {a === schnellster && <span style={s.abzeichen}>{t('stest_easy_best')}</span>}
                      </span>
                      <span style={s.wert}>
                        {ergebnisse[a] == null ? t('stest_easy_miss') : `${sekunden(ergebnisse[a])} s`}
                      </span>
                    </div>
                ))}
              </div>
              <p style={s.hinweis}>{t('stest_easy_done_body')}</p>
              <button type="button" style={s.haupt} onClick={ergebnisSenden}>{t('stest_easy_send')}</button>
              {kopiert && <p style={s.kopiert} role="status">{t('stest_easy_copied')}</p>}
              <button type="button" style={s.stopp} onClick={testStarten}>{t('stest_easy_again')}</button>
            </div>
        )}

        {!einfach && (
            <>
              <div style={s.tabelle}>
                {ARTEN.map(a => (
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
            </>
        )}

        <button type="button" style={s.wechsel} onClick={() => ansichtWechseln(einfach ? 'profi' : 'einfach')}>
          {t(einfach ? 'stest_easy_more' : 'stest_easy_simple')}
        </button>
      </div>
  )
}

const s = {
  seite: { maxWidth: 520, margin: '0 auto', padding: '24px 16px 48px', minHeight: '100vh', background: 'var(--sk-surface-2)', boxSizing: 'border-box' },
  kopf: { display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 18 },
  titel: { fontSize: 22, margin: '2px 0 4px', color: 'var(--sk-ink)' },
  text: { fontSize: 14, color: 'var(--sk-muted)', margin: 0, lineHeight: 1.5 },
  karte: { fontSize: 15, color: 'var(--sk-ink)', background: 'white', border: '1px solid var(--sk-line)', borderRadius: 12, padding: '14px 16px', margin: '0 0 14px', lineHeight: 1.5 },
  anleitungTitel: { fontSize: 16, margin: '0 0 8px', color: 'var(--sk-ink)' },
  liste: { margin: 0, paddingInlineStart: 22, display: 'flex', flexDirection: 'column', gap: 8 },
  punkt: { paddingInlineStart: 2 },
  haupt: { width: '100%', padding: 15, borderRadius: 12, border: 0, background: 'var(--sk-brand)', color: 'white', fontWeight: 700, fontSize: 16, cursor: 'pointer', marginTop: 4 },
  schritt: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, margin: '0 0 10px', fontSize: 15, color: 'var(--sk-muted)' },
  wahl: { display: 'flex', gap: 6, padding: 4, background: 'white', border: '1px solid var(--sk-line)', borderRadius: 12, marginBottom: 12 },
  wahlKnopf: { flex: '1 1 0', minWidth: 0, padding: '10px 4px', border: 0, borderRadius: 9, background: 'transparent', color: 'var(--sk-muted)', fontWeight: 600, fontSize: 14, cursor: 'pointer' },
  wahlAktiv: { background: 'var(--sk-brand)', color: 'white' },
  bild: { position: 'relative', background: '#111', borderRadius: 14, overflow: 'hidden', minHeight: 260, alignItems: 'center', justifyContent: 'center' },
  video: { width: '100%', height: 'auto' },
  leer: { color: 'rgba(255,255,255,.75)', fontSize: 14, padding: 24, textAlign: 'center', margin: 0 },
  treffer: { position: 'absolute', inset: 'auto 12px 12px 12px', background: 'rgba(28,140,70,.95)', color: 'white', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'baseline', gap: 10, fontSize: 14 },
  trefferZahl: { fontSize: 22 },
  stopp: { marginTop: 10, width: '100%', padding: 12, borderRadius: 10, border: '1.5px solid var(--sk-line)', background: 'white', fontWeight: 600, fontSize: 14, cursor: 'pointer' },
  fehler: { marginTop: 10, background: '#fff0f0', color: '#b00', padding: '10px 14px', borderRadius: 8, fontSize: 14 },
  fertigTitel: { fontSize: 19, margin: '4px 0 0', color: 'var(--sk-ink)' },
  tabelle: { marginTop: 16, background: 'white', borderRadius: 12, border: '1px solid var(--sk-line)' },
  zeile: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '12px 14px', borderTop: '1px solid var(--sk-line)', fontSize: 14, color: 'var(--sk-ink)' },
  wert: { fontWeight: 600 },
  abzeichen: { marginInlineStart: 8, fontSize: 12, fontWeight: 600, background: '#e3f4e9', color: '#1c7a45', padding: '2px 8px', borderRadius: 999 },
  hinweis: { marginTop: 14, fontSize: 13, color: 'var(--sk-muted)', lineHeight: 1.5 },
  kopiert: { marginTop: 10, fontSize: 13, color: '#1c7a45' },
  wechsel: { marginTop: 22, background: 'none', border: 0, padding: 4, color: 'var(--sk-brand)', fontWeight: 600, fontSize: 13.5, cursor: 'pointer', textDecoration: 'underline' },
}
