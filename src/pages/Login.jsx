import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Html5Qrcode } from 'html5-qrcode'
import { useLang } from '../LangContext'
import api from '../api'

export default function Login() {
  const { t } = useLang()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // --- Mitarbeiter (Staff) ---
  const [staffTokenInput, setStaffTokenInput] = useState('')
  const [cameraActive, setCameraActive] = useState(false)
  const html5QrRef = useRef(null)

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/api/auth/login', { email, password })

      if (!res.data?.token) {
        setError(t('login_error'))
        return
      }

      localStorage.setItem('token', res.data.token)
      localStorage.setItem('shop', JSON.stringify({ id: res.data.shopId, name: res.data.name }))

      try {
        const tokensRes = await api.get('/api/shop/staff-tokens', {
          headers: { Authorization: `Bearer ${res.data.token}` }
        })
        if (Array.isArray(tokensRes.data) && tokensRes.data.length > 0) {
          localStorage.setItem('staffToken', tokensRes.data[0].token)
        }
      } catch (e) {
        // Staff-Token optional — kein Fehler
      }

      window.location.href = '/'
    } catch (err) {
      setError(t('login_error'))
    } finally {
      setLoading(false)
    }
  }

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

  function staffLogin(rawToken) {
    const tk = extractToken(rawToken)
    if (tk.length < 8) { setError(t('scan_login_error')); return }
    localStorage.setItem('staffToken', tk)
    navigate('/scanner')
  }

  function handleStaffSubmit(e) {
    e.preventDefault()
    staffLogin(staffTokenInput)
  }

  async function startQrSetup() {
    setError('')
    setCameraActive(true)
    await new Promise(r => setTimeout(r, 300))
    try {
      html5QrRef.current = new Html5Qrcode('qr-login-reader')
      await html5QrRef.current.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          async (decodedText) => {
            await stopQr()
            staffLogin(decodedText)
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
          <h1 style={styles.title}>Stempelkarte</h1>
          <p style={styles.subtitle}>{t('login_subtitle')}</p>
          {error && <div style={styles.error}>{error}</div>}

          {/* --- Besitzer-Login --- */}
          <form onSubmit={handleLogin}>
            <div style={styles.field}>
              <label style={styles.label}>{t('login_email')}</label>
              <input style={styles.input} type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>{t('login_password')}</label>
              <input style={styles.input} type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <button style={styles.button} type="submit" disabled={loading}>
              {loading ? t('login_loading') : t('login_btn')}
            </button>
          </form>

          {/* --- Mitarbeiter-Login --- */}
          <div style={styles.divider}>Mitarbeiter</div>

          {cameraActive ? (
              <>
                <div id="qr-login-reader" style={styles.qrReader} />
                <button style={styles.btnStop} onClick={stopQr}>Kamera stoppen</button>
              </>
          ) : (
              <>
                <button style={styles.btnQr} onClick={startQrSetup}>📷 Per QR-Code anmelden</button>
                <form onSubmit={handleStaffSubmit}>
                  <input
                      style={{ ...styles.input, textAlign: 'center', fontFamily: 'monospace', marginTop: '10px' }}
                      type="text"
                      placeholder="Token eingeben"
                      value={staffTokenInput}
                      onChange={e => setStaffTokenInput(e.target.value)}
                      autoComplete="off" autoCorrect="off" autoCapitalize="off"
                  />
                  <button style={styles.btnStaff} type="submit">Als Mitarbeiter anmelden</button>
                </form>
              </>
          )}
        </div>
      </div>
  )
}

const styles = {
  container: { minHeight: '100vh', background: '#f5f5f7', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
  card: { background: 'white', borderRadius: '16px', padding: '40px', width: '100%', maxWidth: '400px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', textAlign: 'center' },
  logo: { width: '56px', height: '56px', borderRadius: '14px', background: '#3C3489', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '700', margin: '0 auto 16px' },
  title: { fontSize: '24px', fontWeight: '700', margin: '0 0 4px', color: '#1a1a1a' },
  subtitle: { fontSize: '14px', color: '#888', margin: '0 0 28px' },
  error: { background: '#fff0f0', color: '#d00', padding: '10px 14px', borderRadius: '8px', fontSize: '14px', marginBottom: '16px' },
  field: { marginBottom: '16px', textAlign: 'left' },
  label: { display: 'block', fontSize: '13px', fontWeight: '500', color: '#444', marginBottom: '6px' },
  input: { width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #e0e0e0', fontSize: '15px', outline: 'none', boxSizing: 'border-box' },
  button: { width: '100%', padding: '12px', background: '#3C3489', color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', marginTop: '8px' },
  divider: { fontSize: '12px', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '28px 0 16px', borderTop: '1px solid #eee', paddingTop: '20px' },
  btnQr: { width: '100%', padding: '12px', background: '#3C3489', color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' },
  btnStaff: { width: '100%', padding: '12px', background: '#f0eeff', color: '#3C3489', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', marginTop: '10px' },
  btnStop: { width: '100%', padding: '12px', background: '#ff4444', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  qrReader: { width: '100%', borderRadius: '12px', overflow: 'hidden', marginBottom: '12px' },
}