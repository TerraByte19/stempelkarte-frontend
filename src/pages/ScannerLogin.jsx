import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Html5Qrcode } from 'html5-qrcode'
import { useLang } from '../LangContext'
export default function ScannerLogin() {
  const { t } = useLang()
  const [token, setToken] = useState('')
  const [error, setError] = useState('')
  const [cameraActive, setCameraActive] = useState(false)
  const html5QrRef = useRef(null)
  const navigate = useNavigate()
  // Token aus Setup-Link (?token=...) oder rohem Token extrahieren
  function extractToken(raw) {
    const text = raw.trim()
    try {
      if (text.includes('token=')) {
        const tk = new URL(text).searchParams.get('token')
        if (tk) return tk.trim()
      }
    } catch { /* kein Link, weiter mit Rohtext */ }
    return text
  }
  function handleLogin(e) {
    e.preventDefault()
    if (token.trim().length < 8) { setError(t('scan_login_error')); return }
    localStorage.setItem('staffToken', token.trim())
    navigate('/scanner')
  }
  async function startQrSetup() {
    setError('')
    setCameraActive(true)
    await new Promise(r => setTimeout(r, 300))
    try {
      html5QrRef.current = new Html5Qrcode('qr-setup-reader')
      await html5QrRef.current.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          async (decodedText) => {
            await stopQr()
            const tk = extractToken(decodedText)
            if (tk.length < 8) { setError(t('scan_login_error')); return }
            localStorage.setItem('staffToken', tk)
            navigate('/scanner')
          },
          () => {}
      )
    } catch (e) {
      console.error(e)
      setError('Kamera konnte nicht gestartet werden')
      setCameraActive(false)
    }
  }
  async function stopQr() {
    if (html5QrRef.current) {
      try { await html5QrRef.current.stop(); html5QrRef.current.clear() } catch { /* ignore */ }
      html5QrRef.current = null
    }
    setCameraActive(false)
  }
  return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.logo}>SK</div>
          <h1 style={styles.title}>{t('scan_login_title')}</h1>
          <p style={styles.subtitle}>{t('scan_login_subtitle')}</p>
          {error && <div style={styles.error}>{error}</div>}
          {cameraActive ? (
              <>
                <div id="qr-setup-reader" style={styles.qrReader} />
                <button style={styles.btnStop} onClick={stopQr}>Kamera stoppen</button>
              </>
          ) : (
              <>
                <button style={styles.btnQr} onClick={startQrSetup}>📷 Per QR-Code einrichten</button>
                <div style={styles.divider}>oder Token manuell</div>
                <form onSubmit={handleLogin}>
                  <input style={styles.input} type="text" placeholder={t('scan_login_placeholder')} value={token} onChange={e => setToken(e.target.value)} autoComplete="off" autoCorrect="off" autoCapitalize="off" required />
                  <button style={styles.btn} type="submit">{t('scan_login_btn')}</button>
                </form>
              </>
          )}
        </div>
      </div>
  )
}
const styles = {
  container: { minHeight: '100vh', background: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' },
  card: { background: 'white', borderRadius: '20px', padding: '40px', width: '100%', maxWidth: '380px', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
  logo: { width: '56px', height: '56px', borderRadius: '14px', background: '#3C3489', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '700', margin: '0 auto 16px' },
  title: { fontSize: '24px', fontWeight: '700', margin: '0 0 4px', color: '#1a1a1a' },
  subtitle: { fontSize: '14px', color: '#888', margin: '0 0 28px' },
  error: { background: '#fff0f0', color: '#c00', padding: '10px', borderRadius: '8px', fontSize: '14px', marginBottom: '16px' },
  input: { width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1.5px solid #e0e0e0', fontSize: '15px', outline: 'none', boxSizing: 'border-box', marginBottom: '12px', textAlign: 'center', fontFamily: 'monospace' },
  btn: { width: '100%', padding: '12px', background: '#3C3489', color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
  btnQr: { width: '100%', padding: '14px', background: '#3C3489', color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', marginBottom: '16px' },
  btnStop: { width: '100%', padding: '12px', background: '#ff4444', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  qrReader: { width: '100%', borderRadius: '16px', overflow: 'hidden', marginBottom: '16px' },
  divider: { fontSize: '12px', color: '#aaa', margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.5px' },
}