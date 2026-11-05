import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode'
import { useLang } from '../LangContext'
import { holeStandort } from '../lib/standort'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

// Wie lange das Ergebnis steht, bevor die Kamera wieder scannt.
const ERGEBNIS_MS = 4000
const FEHLER_MS = 6000

/**
 * Selbst-Stempeln am Tablet: ein Zugang mit Rolle KIOSK sieht statt dem
 * Scanner nur diese Seite. Kamera laeuft dauernd, der Kunde haelt seine
 * Karte davor, der Stempel geht ohne Rueckfrage raus (immer genau einer).
 * Alles andere (Praemie, Punkte, Aufladen) lehnt der Server ab; die
 * Meldungen dazu kommen in der Sprache des Kunden und werden gross gezeigt.
 *
 * ortPflicht: der Laden verlangt den Standort, dann wird er mitgeschickt.
 */
export default function Kiosk({ shopName, ortPflicht }) {
  const { t } = useLang()
  const navigate = useNavigate()
  // 'kamera' | 'sende' | 'ok' | 'fehler' | 'aus'
  const [zustand, setZustand] = useState('aus')
  const [meldung, setMeldung] = useState(null)   // { titel, text }
  const qrRef = useRef(null)
  const scanningRef = useRef(false)
  const timerRef = useRef(null)

  useEffect(() => {
    starteKamera()
    return () => {
      clearTimeout(timerRef.current)
      stoppeKamera()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function starteKamera() {
    setZustand('kamera')
    await new Promise(r => setTimeout(r, 300))
    try {
      if (!qrRef.current) qrRef.current = new Html5Qrcode('kiosk-reader')
      await qrRef.current.start(
          { facingMode: 'environment' },
          { fps: 15, videoConstraints: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } },
          text => { if (!scanningRef.current) { scanningRef.current = true; stempeln(text) } },
          () => {}
      )
    } catch (e) {
      console.error(e)
      setZustand('aus')
    }
  }

  function pausieren() {
    try {
      if (qrRef.current?.getState() === Html5QrcodeScannerState.SCANNING) qrRef.current.pause(true)
    } catch { /* lief nicht */ }
  }

  function weiter() {
    setMeldung(null)
    scanningRef.current = false
    try {
      if (qrRef.current?.getState() === Html5QrcodeScannerState.PAUSED) {
        qrRef.current.resume()
        setZustand('kamera')
        return
      }
    } catch { /* unten neu starten */ }
    starteKamera()
  }

  async function stoppeKamera() {
    try { await qrRef.current?.stop(); qrRef.current?.clear() } catch { /* egal */ }
    qrRef.current = null
  }

  function zeige(zustandNeu, titel, text, ms) {
    setMeldung({ titel, text })
    setZustand(zustandNeu)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(weiter, ms)
  }

  async function stempeln(payload) {
    pausieren()
    setZustand('sende')
    try {
      const ort = ortPflicht ? await holeStandort(10_000) : null
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
      if (!res.ok) {
        // Der Server sagt in der Sprache des Kunden, warum nicht (voll,
        // Sperrzeit, falsche Karte). Das ist keine Panne, sondern die Antwort.
        zeige('fehler', data.error ? '' : t('kiosk_error'), data.error || data.message || t('kiosk_error'), FEHLER_MS)
        return
      }
      const voll = data.rewardEarned || (data.rewardThreshold && data.stamps >= data.rewardThreshold)
      zeige('ok',
          voll ? t('kiosk_full') : t('kiosk_stamped', { n: data.stamps, m: data.rewardThreshold }),
          voll ? t('kiosk_full_sub') : t('kiosk_thanks'),
          ERGEBNIS_MS)
    } catch {
      zeige('fehler', t('kiosk_error'), t('kiosk_offline'), FEHLER_MS)
    }
  }

  function beenden() {
    if (!window.confirm(t('kiosk_exit_confirm'))) return
    stoppeKamera()
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
              <h1 style={s.prompt}>{t('kiosk_prompt')}</h1>
              <button style={s.btn} onClick={starteKamera}>{t('kiosk_camera_start')}</button>
            </div>
        )}
        {zustand === 'sende' && <div style={s.box}><h1 style={s.prompt}>{t('kiosk_wait')}</h1></div>}
        {(zustand === 'ok' || zustand === 'fehler') && meldung && (
            <div style={{ ...s.box, background: zustand === 'ok' ? '#e8f5ec' : '#fff4e5' }}>
              <div style={s.symbol}>{zustand === 'ok' ? '✓' : '!'}</div>
              {meldung.titel && <h1 style={s.titel}>{meldung.titel}</h1>}
              <p style={s.text}>{meldung.text}</p>
              <button style={s.btnLeise} onClick={weiter}>{t('kiosk_next')}</button>
            </div>
        )}

        <button style={s.beenden} onClick={beenden}>{t('kiosk_exit')}</button>
      </div>
  )
}

const s = {
  seite: { minHeight: '100vh', background: '#1A1A2E', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 16px 72px', position: 'relative' },
  kopf: { fontSize: 22, fontWeight: 700, opacity: .9, marginBottom: 16 },
  kamera: { width: '100%', maxWidth: 720, height: '55vh', borderRadius: 20, overflow: 'hidden', background: '#000' },
  prompt: { fontSize: 32, fontWeight: 800, textAlign: 'center', margin: '24px 0 0', lineHeight: 1.2 },
  box: { width: '100%', maxWidth: 720, minHeight: '55vh', borderRadius: 20, background: '#2A2A44', color: '#1A1A2E', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12, textAlign: 'center' },
  symbol: { fontSize: 72, fontWeight: 800, lineHeight: 1 },
  titel: { fontSize: 34, fontWeight: 800, margin: 0 },
  text: { fontSize: 22, margin: 0, lineHeight: 1.35 },
  btn: { marginTop: 16, background: '#3C3489', color: 'white', border: 0, borderRadius: 14, padding: '16px 28px', fontSize: 20, fontWeight: 700, cursor: 'pointer' },
  btnLeise: { marginTop: 12, background: 'transparent', color: 'inherit', border: '1px solid currentColor', borderRadius: 12, padding: '10px 18px', fontSize: 16, cursor: 'pointer', opacity: .7 },
  beenden: { position: 'absolute', bottom: 16, right: 16, background: 'transparent', color: 'rgba(255,255,255,.35)', border: 0, fontSize: 12, cursor: 'pointer' },
}
