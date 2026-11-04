import { tarifVergessen } from '../tarif'
import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../LangContext'
import api from '../api'
import { LogoZeichen, MARKE } from '../components/Logo'

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
  const [tokenOffen, setTokenOffen] = useState(false)
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
      tarifVergessen()
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
      // html5-qrcode ist ~3 MB und wird nur hier gebraucht. Als statischer
      // Import laege es im Erst-Bundle jeder Seite — auch der Landing-Page.
      const { Html5Qrcode } = await import('html5-qrcode')
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
      setError(t('common_camera_error'))
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
          <div style={styles.logo}><LogoZeichen size={52} /></div>
          <h1 style={styles.title}>{MARKE}</h1>
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

          {/* --- Mitarbeiter-Login: nur ein Link, die Kamera oder das
              Eintippen kommt erst auf Wunsch. --- */}
          <div style={styles.staff}>
            {cameraActive ? (
                <>
                  <div id="qr-login-reader" style={styles.qrReader} />
                  <button style={styles.btnStop} onClick={stopQr}>{t('scan_stop_camera')}</button>
                </>
            ) : tokenOffen ? (
                <form onSubmit={handleStaffSubmit} style={{ width: '100%' }}>
                  <input
                      style={{ ...styles.input, textAlign: 'center' }}
                      type="text"
                      placeholder={t('login_token_placeholder')}
                      value={staffTokenInput}
                      onChange={e => setStaffTokenInput(e.target.value)}
                      autoComplete="off" autoCorrect="off" autoCapitalize="off" autoFocus
                  />
                  <button style={styles.btnStaff} type="submit">{t('login_staff_submit')}</button>
                  <button type="button" style={styles.linkLeise} onClick={startQrSetup}>{t('login_staff_link')}</button>
                </form>
            ) : (
                <>
                  <button type="button" style={styles.link} onClick={startQrSetup}>{t('login_staff_link')}</button>
                  <button type="button" style={styles.linkLeise} onClick={() => setTokenOffen(true)}>{t('login_staff_type')}</button>
                </>
            )}
          </div>
        </div>
      </div>
  )
}

const styles = {
  container: { minHeight: '100vh', background: 'var(--sk-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
  card: { background: 'white', borderRadius: '16px', padding: '40px', width: '100%', maxWidth: '400px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', textAlign: 'center' },
  logo: { display: 'flex', justifyContent: 'center', marginBottom: '14px' },
  title: { fontSize: '26px', fontWeight: '700', margin: '0 0 4px', color: 'var(--sk-ink)' },
  subtitle: { fontSize: '14px', color: 'var(--sk-muted)', margin: '0 0 28px' },
  error: { background: '#fff0f0', color: '#d00', padding: '10px 14px', borderRadius: '8px', fontSize: '14px', marginBottom: '16px' },
  field: { marginBottom: '16px', textAlign: 'start' },
  label: { display: 'block', fontSize: '13px', fontWeight: '500', color: '#444', marginBottom: '6px' },
  input: { width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #e0e0e0', fontSize: '15px', outline: 'none', boxSizing: 'border-box' },
  button: { width: '100%', padding: '12px', background: '#3C3489', color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', marginTop: '8px' },
  staff: { marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--sk-line)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' },
  link: { background: 'none', border: 'none', color: '#3C3489', fontSize: '14px', fontWeight: '600', cursor: 'pointer', padding: '6px 8px' },
  linkLeise: { background: 'none', border: 'none', color: 'var(--sk-muted)', fontSize: '13px', cursor: 'pointer', padding: '6px 8px', marginTop: '4px' },
  btnStaff: { width: '100%', padding: '12px', background: '#f0eeff', color: '#3C3489', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', marginTop: '10px' },
  btnStop: { width: '100%', padding: '12px', background: '#ff4444', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  qrReader: { width: '100%', borderRadius: '12px', overflow: 'hidden', marginBottom: '12px' },
}
