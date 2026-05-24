import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/api/auth/login', { email, password })
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('shop', JSON.stringify({ id: res.data.shopId, name: res.data.name }))

      const tokensRes = await api.get('/api/shop/staff-tokens', {
        headers: { Authorization: `Bearer ${res.data.token}` }
      })
      if (tokensRes.data.length > 0) {
        localStorage.setItem('staffToken', tokensRes.data[0].token)
      }

      navigate('/')
    } catch (err) {
      setError('E-Mail oder Passwort falsch')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>SK</div>
        <h1 style={styles.title}>Stempelkarte</h1>
        <p style={styles.subtitle}>Laden-Login</p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleLogin}>
          <div style={styles.field}>
            <label style={styles.label}>E-Mail</label>
            <input
              style={styles.input}
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="laden@beispiel.de"
              required
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Passwort</label>
            <input
              style={styles.input}
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? 'Einloggen...' : 'Einloggen'}
          </button>
        </form>
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    background: '#f5f5f7',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  card: {
    background: 'white',
    borderRadius: '16px',
    padding: '40px',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    textAlign: 'center',
  },
  logo: {
    width: '56px', height: '56px', borderRadius: '14px', background: '#3C3489',
    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '18px', fontWeight: '700', margin: '0 auto 16px',
  },
  title: { fontSize: '24px', fontWeight: '700', margin: '0 0 4px', color: '#1a1a1a' },
  subtitle: { fontSize: '14px', color: '#888', margin: '0 0 28px' },
  error: {
    background: '#fff0f0', color: '#d00', padding: '10px 14px',
    borderRadius: '8px', fontSize: '14px', marginBottom: '16px',
  },
  field: { marginBottom: '16px', textAlign: 'left' },
  label: { display: 'block', fontSize: '13px', fontWeight: '500', color: '#444', marginBottom: '6px' },
  input: {
    width: '100%', padding: '10px 14px', borderRadius: '8px',
    border: '1.5px solid #e0e0e0', fontSize: '15px', outline: 'none', boxSizing: 'border-box',
  },
  button: {
    width: '100%', padding: '12px', background: '#3C3489', color: 'white',
    border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '600',
    cursor: 'pointer', marginTop: '8px',
  },
}