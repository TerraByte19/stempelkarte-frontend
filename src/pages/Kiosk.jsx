import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode'
import { useLang } from '../LangContext'
import { holeStandort } from '../lib/standort'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

// Wie lange das Ergebnis steht, bevor die Kamera wieder scannt.
const ERGEBNIS_MS = 4000
const FEHLER_MS = 6000
// Dieselbe Karte wird so lange nicht noch einmal angenommen: der Kunde haelt
// sie meist noch vor die Kamera, wenn die Kamera wieder anspringt.
const GLEICHE_KARTE_MS = 10_000

/**
 * Selbst-Stempeln am Tablet: ein Zugang mit Rolle KIOSK sieht statt dem
 * Scanner nur diese Seite. Kamera laeuft dauernd, der Kunde haelt seine
 * Karte davor, der Stempel geht ohne Rueckfrage raus (immer genau einer).
 * Alles andere (Praemie, Punkte, Aufladen) lehnt der Server ab; die
 * Meldungen dazu kommen in der Sprache des Kunden und werden gross gezeigt.
 *
 * ortPflicht: der Laden verlangt den Standort, dann wird er mitgeschickt.
 * Die Freigabe dafuer holt Scanner.jsx vorher ein, wie beim Personal.
 *
 * Kamera-Regeln: nur EINE Html5Qrcode-Instanz, start/stop warten aufeinander
 * (startLauf), und nach jedem await wird geprueft, ob die Seite noch da ist
 * (lebt). Sonst laeuft die Kamera nach dem Abmelden weiter oder haengt
 * nach einem doppelten Start (StrictMode, schneller Doppeltipp).
 */
export default function Kiosk({ shopName, ortPflicht }) {
  const { t } = useLang()
  const navigate = useNavigate()
  // 'kamera' | 'sende' | 'ok' | 'fehler' | 'aus'
  const [zustand, setZustand] = useState('aus')
  const [meldung, setMeldung] = useState(null)   // { titel, text }
  const qrRef = useRef(null)
  const startLauf = useRef(Promise.resolve())
  const lebt = useRef(false)
  const scanningRef = useRef(false)
  const timerRef = useRef(null)
  const letzte = useRef({ payload: null, bis: 0 })

  useEffect(() => {
    lebt.current = true
    starteKamera()
    return () => {
      lebt.current = false
      clearTimeout(timerRef.current)
      stoppeKamera()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function kameraZustand() {
    try { return qrRef.current ? qrRef.current.getState() : null } catch { return null }
  }

  async function starteKamera() {
    setZustand('kamera')
    scanningRef.current = false
    // Nacheinander, nie parallel: ein zweiter Start waehrend der erste
    // laeuft, wirft in html5-qrcode und laesst die Kamera verwaist laufen.
    startLauf.current = startLauf.current.then(async () => {
      if (!lebt.current) return
      const st = kameraZustand()
      if (st === Html5QrcodeScannerState.SCANNING) return
      if (st === Html5QrcodeScannerState.PAUSED) { qrRef.current.resume(); return }
      try {
        if (!qrRef.current) qrRef.current = new Html5Qrcode('kiosk-reader')
        await qrRef.current.start(
            { facingMode: 'environment' },
            { fps: 15, videoConstraints: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } },
            text => { if (!scanningRef.current) { scanningRef.current = true; stempeln(text) } },
            () => {}
        )
        // Waehrend des Starts abgemeldet: sofort wieder aus.
        if (!lebt.current) await stoppeKamera()
      } catch (e) {
        console.error(e)
        if (lebt.current) setZustand('aus')
      }
    }).catch(() => {})
    await startLauf.current
  }

  function pausieren() {
    try {
      if (kameraZustand() === Html5QrcodeScannerState.SCANNING) qrRef.current.pause(true)
    } catch { /* lief nicht */ }
  }

  function weiter() {
    clearTimeout(timerRef.current)
    if (!lebt.current) return
    setMeldung(null)
    starteKamera()
  }

  async function stoppeKamera() {
    await startLauf.current.catch(() => {})
    const q = qrRef.current
    qrRef.current = null
    if (!q) return
    try {
      if (q.getState() !== Html5QrcodeScannerState.NOT_STARTED) await q.stop()
      q.clear()
    } catch { /* schon aus */ }
  }

  function zeige(zustandNeu, titel, text, ms) {
    if (!lebt.current) return
    setMeldung({ titel, text })
    setZustand(zustandNeu)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(weiter, ms)
  }

  async function stempeln(payload) {
    pausieren()
    // Dieselbe Karte kurz nach dem letzten Ergebnis: nicht noch einmal
    // schicken, der Server wuerde nur mit der Sperrzeit antworten.
    const jetzt = Date.now()
    if (payload === letzte.current.payload && jetzt < letzte.current.bis) {
      weiter()
      return
    }
    setZustand('sende')
    try {
      const ort = ortPflicht ? await holeStandort(10_000) : null
      if (!lebt.current) return
      if (ortPflicht && !ort) {
        zeige('fehler', t('kiosk_error'), t('scan_geo_none'), FEHLER_MS)
        return
      }
      const res = await fetch(`${API_URL}/api/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Staff-Token': localStorage.getItem('staffToken') },
        body: JSON.stringify({ qrPayload: payload, count: 1, ...(ort || {}) }),
      })
      const data = await res.json().catch(() => ({}))
      if (!lebt.current) return
      letzte.current = { payload, bis: Date.now() + GLEICHE_KARTE_MS }
      if (!res.ok) {
        // 400 vom KioskService (voll, Sperrzeit, falsche Karte) und 403 vom
        // Server sind Antworten in der Sprache des Kunden, keine Panne.
        zeige('fehler', data.error ? '' : t('kiosk_error'), data.error || data.message || t('kiosk_error'), FEHLER_MS)
        return
      }
      const voll = data.rewardEarned || (data.rewardThreshold && data.stamps >= data.rewardThreshold)
      zeige('ok',
          voll ? t('kiosk_full') : t('kiosk_stamped', { n: data.stamps, m: data.rewardThreshold }),
          voll ? t('kiosk_full_sub') : t('kiosk_thanks'),
          ERGEBNIS_MS)
    } catch {
      if (lebt.current) zeige('fehler', t('kiosk_error'), t('kiosk_offline'), FEHLER_MS)
    }
  }

  // Beenden nur mit langem Druecken (2,5 s) plus Rueckfrage: ein Kunde, der
  // den kleinen Knopf antippt, soll das Tablet nicht abmelden koennen.
  const drueckRef = useRef(null)
  function drueckStart() {
    clearTimeout(drueckRef.current)
    drueckRef.current = setTimeout(beenden, 2500)
  }
  function drueckEnde() { clearTimeout(drueckRef.current) }

  async function beenden() {
    if (!window.confirm(t('kiosk_exit_confirm'))) return
    lebt.current = false
    clearTimeout(timerRef.current)
    await stoppeKamera()
    localStorage.removeItem('staffToken')
    localStorage.removeItem('staffTokenLabel')
    navigate('/login')
  }

  return (
      <div style={s.seite}>
        <div style={s.kopf}>{shopName}</div>

        <div id="kiosk-reader" style={{ ...s.kamera, display: zustand === 'kamera' ? 'block' : 'none' }} />

        {zustand === 'kamera' && <h1 style={s.prompt}>{t('kiosk_prompt')}</h1>}
        {zustand === 'aus' && (
            <div style={s.box}>
              <h1 style={{ ...s.prompt, color: 'white' }}>{t('kiosk_prompt')}</h1>
              <button style={s.btn} onClick={() => stoppeKamera().then(starteKamera)}>{t('kiosk_camera_start')}</button>
            </div>
        )}
        {zustand === 'sende' && <div style={s.box}><h1 style={{ ...s.prompt, color: 'white' }}>{t('kiosk_wait')}</h1></div>}
        {(zustand === 'ok' || zustand === 'fehler') && meldung && (
            <div style={{ ...s.box, background: zustand === 'ok' ? '#e8f5ec' : '#fff4e5', color: '#1A1A2E' }} role="status" aria-live="polite">
              <div style={s.symbol} aria-hidden="true">{zustand === 'ok' ? '✓' : '!'}</div>
              {meldung.titel && <h1 style={s.titel}>{meldung.titel}</h1>}
              <p style={s.text}>{meldung.text}</p>
              <button style={s.btnLeise} onClick={weiter}>{t('kiosk_next')}</button>
            </div>
        )}

        <button style={s.beenden} onPointerDown={drueckStart} onPointerUp={drueckEnde} onPointerLeave={drueckEnde}
                onPointerCancel={drueckEnde} onContextMenu={e => e.preventDefault()} title={t('kiosk_exit_hint')}>
          {t('kiosk_exit')}
        </button>
      </div>
  )
}

const s = {
  seite: { minHeight: '100vh', background: '#1A1A2E', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 16px 72px', position: 'relative' },
  kopf: { fontSize: 22, fontWeight: 700, opacity: .9, marginBottom: 16 },
  kamera: { width: '100%', maxWidth: 720, height: '55vh', borderRadius: 20, overflow: 'hidden', background: '#000' },
  prompt: { fontSize: 32, fontWeight: 800, textAlign: 'center', margin: '24px 0 0', lineHeight: 1.2 },
  box: { width: '100%', maxWidth: 720, minHeight: '55vh', borderRadius: 20, background: '#2A2A44', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12, textAlign: 'center' },
  symbol: { fontSize: 72, fontWeight: 800, lineHeight: 1 },
  titel: { fontSize: 34, fontWeight: 800, margin: 0 },
  text: { fontSize: 22, margin: 0, lineHeight: 1.35 },
  btn: { marginTop: 16, background: '#3C3489', color: 'white', border: 0, borderRadius: 14, padding: '16px 28px', fontSize: 20, fontWeight: 700, cursor: 'pointer' },
  btnLeise: { marginTop: 12, background: 'transparent', color: 'inherit', border: '1px solid currentColor', borderRadius: 12, padding: '10px 18px', fontSize: 16, cursor: 'pointer', opacity: .7 },
  beenden: { position: 'absolute', bottom: 16, right: 16, background: 'transparent', color: 'rgba(255,255,255,.35)', border: 0, fontSize: 12, cursor: 'pointer' },
}
