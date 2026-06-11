import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

export default function ScannerSetup() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('checking') // checking | ok | error
  const [label, setLabel] = useState('')

  useEffect(() => {
    const token = params.get('token')
    const tokenLabel = params.get('label') || 'Scanner'

    if (token && token.trim().length >= 8) {
      localStorage.setItem('staffToken', token.trim())
      localStorage.setItem('staffTokenLabel', tokenLabel)
      setLabel(tokenLabel)
      setStatus('ok')
      // Nach kurzer Bestätigung direkt zum Scanner
      const timer = setTimeout(() => navigate('/scanner'), 1500)
      return () => clearTimeout(timer)
    } else {
      setStatus('error')
    }
  }, [params, navigate])

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {status === 'checking' && (
          <>
            <div style={styles.spinner}>⏳</div>
            <h1 style={styles.title}>Wird eingerichtet…</h1>
          </>
        )}
        {status === 'ok' && (
          <>
            <div style={styles.icon}>✅</div>
            <h1 style={styles.title}>Scanner bereit!</h1>
            <p style={styles.subtitle}>{label} ist jetzt eingerichtet.</p>
            <p style={styles.hint}>Du wirst zum Scanner weitergeleitet…</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div style={styles.icon}>⚠️</div>
            <h1 style={styles.title}>Ungültiger Link</h1>
            <p style={styles.subtitle}>Dieser Einrichtungs-Link ist nicht gültig.</p>
            <button style={styles.btn} onClick={() => navigate('/scanner-login')}>
              Manuell einloggen
            </button>
          </>
        )}
      </div>
    </div>
  )
}

const styles = {
  container: { minHeight: '100vh', background: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
  card: { background: 'white', borderRadius: '20px', padding: '40px', width: '100%', maxWidth: '380px', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
  spinner: { fontSize: '48px', marginBottom: '16px' },
  icon: { fontSize: '56px', marginBottom: '16px' },
  title: { fontSize: '24px', fontWeight: '700', margin: '0 0 8px', color: '#1a1a1a' },
  subtitle: { fontSize: '15px', color: '#444', margin: '0 0 8px' },
  hint: { fontSize: '13px', color: '#888', margin: '8px 0 0' },
  btn: { marginTop: '20px', width: '100%', padding: '12px', background: '#3C3489', color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
}