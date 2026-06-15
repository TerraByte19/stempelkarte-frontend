import { useEffect, useState } from 'react'
import api from '../api'

export default function Profil() {
  const [shop, setShop] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [name, setName] = useState('')

  useEffect(() => {
    api.get('/api/shop/me')
        .then(res => {
          setShop(res.data)
          setName(res.data.name)
        })
        .catch(() => {})
  }, [])

  async function saveName(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await api.put('/api/shop/me', { name })
      const shopLocal = JSON.parse(localStorage.getItem('shop') || '{}')
      localStorage.setItem('shop', JSON.stringify({ ...shopLocal, name }))
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      alert('Fehler beim Speichern')
    } finally {
      setLoading(false)
    }
  }

  if (!shop) return <div style={s.loading}>Lädt…</div>

  return (
      <div style={s.page}>
        <h1 style={s.title}>Profil</h1>
        <p style={s.subtitle}>{shop.name}</p>

        <div style={s.card}>
          <h2 style={s.cardTitle}>Laden-Name</h2>
          {saved && <div style={s.success}>✓ Gespeichert!</div>}
          <form onSubmit={saveName}>
            <input style={s.input} value={name} onChange={e => setName(e.target.value)} required />
            <button style={s.btnPrimary} type="submit" disabled={loading}>
              {loading ? 'Speichert…' : 'Speichern'}
            </button>
          </form>
          <p style={s.hint}>💡 Logo, Farben & Banner stellst du jetzt direkt bei jeder Karte ein.</p>
        </div>

        <StaffTokens />
      </div>
  )
}

function StaffTokens() {
  const [tokens, setTokens] = useState([])
  const [label, setLabel] = useState('')
  const [newToken, setNewToken] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/api/shop/staff-tokens')
        .then(res => setTokens(Array.isArray(res.data) ? res.data : []))
        .catch(() => setTokens([]))
  }, [])

  async function createToken(e) {
    e.preventDefault()
    setError('')
    try {
      const res = await api.post('/api/shop/staff-token', { label })
      setNewToken(res.data.token)
      setLabel('')
      api.get('/api/shop/staff-tokens')
          .then(res => setTokens(Array.isArray(res.data) ? res.data : []))
          .catch(() => {})
    } catch (err) {
      setError(err.response?.data?.error || 'Fehler beim Erstellen')
    }
  }

  return (
      <div style={s.card}>
        <h2 style={s.cardTitle}>Staff-Tokens</h2>
        <p style={s.hint}>Mitarbeiter brauchen einen Token um Stempel zu vergeben.</p>

        {newToken && (
            <div style={s.tokenBox}>
              <div style={s.tokenLabel}>Neuer Token (kopiere ihn jetzt!):</div>
              <div style={s.tokenValue}>{newToken}</div>
              <button style={s.btnSecondary} onClick={() => {
                navigator.clipboard.writeText(newToken)
                alert('Kopiert!')
              }}>Kopieren</button>
            </div>
        )}

        {error && <div style={s.errorBox}>{error}</div>}

        <div style={s.tokenList}>
          {tokens.map((t, i) => (
              <div key={i} style={s.tokenItem}>
                <span style={s.tokenItemLabel}>{t.label}</span>
                <span style={s.tokenFull}>{t.token}</span>
              </div>
          ))}
        </div>

        <form onSubmit={createToken}>
          <input style={{ ...s.input, marginBottom: 10 }} value={label}
                 onChange={e => setLabel(e.target.value)} placeholder="z.B. Kasse 1" required />
          <button style={s.btnPrimary} type="submit">Erstellen</button>
        </form>
      </div>
  )
}

const s = {
  page: { maxWidth: 700, margin: '0 auto' },
  loading: { color: '#888', padding: 40 },
  title: { fontSize: 24, fontWeight: 700, margin: '0 0 4px', color: '#1a1a1a' },
  subtitle: { fontSize: 14, color: '#888', margin: '0 0 24px' },
  card: { background: 'white', borderRadius: 12, padding: 20, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  cardTitle: { fontSize: 16, fontWeight: 600, margin: '0 0 16px', color: '#1a1a1a' },
  success: { background: '#f0fff4', color: '#2C5F2E', padding: '10px 14px', borderRadius: 8, fontSize: 14, marginBottom: 14 },
  errorBox: { background: '#fff0f0', color: '#c00', padding: 10, borderRadius: 8, fontSize: 14, marginBottom: 12 },
  input: { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 12 },
  btnPrimary: { background: '#3C3489', color: 'white', border: 'none', borderRadius: 10, padding: '12px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', width: '100%' },
  btnSecondary: { background: '#f0eeff', color: '#3C3489', border: 'none', borderRadius: 10, padding: '10px 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  hint: { fontSize: 13, color: '#888', margin: '12px 0 0' },
  tokenBox: { background: '#f0fff4', borderRadius: 10, padding: 16, marginBottom: 16 },
  tokenLabel: { fontSize: 13, fontWeight: 600, color: '#2C5F2E', marginBottom: 8 },
  tokenValue: { fontFamily: 'monospace', fontSize: 12, color: '#1a1a1a', marginBottom: 10, wordBreak: 'break-all' },
  tokenList: { marginBottom: 16 },
  tokenItem: { padding: '10px 0', borderBottom: '1px solid #f0f0f0', fontSize: 14 },
  tokenItemLabel: { fontWeight: 500, color: '#1a1a1a', display: 'block', marginBottom: 4 },
  tokenFull: { fontFamily: 'monospace', color: '#666', fontSize: 11, wordBreak: 'break-all' },
}