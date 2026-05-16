import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

 async function handleRegister(e) {
  e.preventDefault()
  setError('')

  if (form.password !== form.confirm) {
    setError('Passwörter stimmen nicht überein')
    return
  }
  if (form.password.length < 8) {
    setError('Passwort muss mindestens 8 Zeichen lang sein')
    return
  }

  setLoading(true)
  try {
    const res = await api.post('/api/auth/register', {
      name: form.name,
      email: form.email,
      password: form.password,
    })
    localStorage.setItem('token', res.data.token)
    localStorage.setItem('shop', JSON.stringify({ id: res.data.shopId, name: res.data.name }))

    // Staff-Token automatisch holen
    const tokensRes = await api.get('/api/shop/staff-tokens', {
      headers: { Authorization: `Bearer ${res.data.token}` }
    })
    if (tokensRes.data.length > 0) {
      localStorage.setItem('staffToken', tokensRes.data[0].token)
    }

    navigate('/')
  } catch (err) {
    if (err.response?.status === 400) {
      setError('E-Mail wird bereits verwendet')
    } else {
      setError('Fehler bei der Registrierung')
    }
  } finally {
    setLoading(false)
  }


    setLoading(true)
    try {
      const res = await api.post('/api/auth/register', {
        name: form.name,
        email: form.email,
        password: form.password,
      })
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('shop', JSON.stringify({ id: res.data.shopId, name: res.data.name }))
      navigate('/')
    } catch (err) {
      if (err.response?.status === 400) {
        setError('E-Mail wird bereits verwendet')
      } else {
        setError('Fehler bei der Registrierung')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>☕</div>
        <h1 style={styles.title}>Stempelkarte</h1>
        <p style={styles.subtitle}>Neuen Laden-Account erstellen</p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleRegister}>
          <div style={styles.field}>
            <label style={styles.label}>Laden-Name</label>
            <input
              style={styles.input}
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="z.B. Cafe Espresso"
              required
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>E-Mail</label>
            <input
              style={styles.input}
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="laden@beispiel.de"
              required
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Passwort</label>
            <input
              style={styles.input}
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder="Mindestens 8 Zeichen"
              required
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Passwort bestätigen</label>
            <input
              style={styles.input}
              type="password"
              value={form.confirm}
              onChange={e => setForm({ ...form, confirm: e.target.value })}
              placeholder="••••••••"
              required
            />
          </div>
          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? 'Registrieren...' : 'Kostenlos starten'}
          </button>
        </form>

        <p style={styles.login}>
          Bereits ein Account?{' '}
          <a href="/login" style={styles.link}>Einloggen</a>
        </p>
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
  logo: { fontSize: '48px', marginBottom: '16px' },
  title: { fontSize: '24px', fontWeight: '700', margin: '0 0 4px', color: '#1a1a1a' },
  subtitle: { fontSize: '14px', color: '#888', margin: '0 0 28px' },
  error: {
    background: '#fff0f0',
    color: '#d00',
    padding: '10px 14px',
    borderRadius: '8px',
    fontSize: '14px',
    marginBottom: '16px',
  },
  field: { marginBottom: '16px', textAlign: 'left' },
  label: { display: 'block', fontSize: '13px', fontWeight: '500', color: '#444', marginBottom: '6px' },
  input: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1.5px solid #e0e0e0',
    fontSize: '15px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  button: {
    width: '100%',
    padding: '12px',
    background: '#3C3489',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '8px',
  },
  login: { fontSize: '13px', color: '#888', marginTop: '20px' },
  link: { color: '#3C3489', textDecoration: 'none', fontWeight: '500' },
}