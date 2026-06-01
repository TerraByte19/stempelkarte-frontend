import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../LangContext'

export default function ScannerLogin() {
  const { t } = useLang()
  const [token, setToken] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  function handleLogin(e) {
    e.preventDefault()
    if (token.trim().length < 8) { setError(t('scan_login_error')); return }
    localStorage.setItem('staffToken', token.trim())
    navigate('/scanner')
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>SK</div>
        <h1 style={styles.title}>{t('scan_login_title')}</h1>
        <p style={styles.subtitle}>{t('scan_login_subtitle')}</p>
        {error && <div style={styles.error}>{error}</div>}
        <form onSubmit={handleLogin}>
          <input style={styles.input} type="text" placeholder={t('scan_login_placeholder')} value={token} onChange={e => setToken(e.target.value)} autoComplete="off" autoCorrect="off" autoCapitalize="off" required />
          <button style={styles.btn} type="submit">{t('scan_login_btn')}</button>
        </form>
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
}