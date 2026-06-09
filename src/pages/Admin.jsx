import { useState, useEffect } from 'react'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

export default function Admin() {
  const [secret, setSecret] = useState('')
  const [loggedIn, setLoggedIn] = useState(false)
  const [shops, setShops] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [changingPasswordFor, setChangingPasswordFor] = useState(null)

  useEffect(() => {
    const token = sessionStorage.getItem('adminToken')
    if (token) {
      setLoggedIn(true)
      loadShops(token)
    }
  }, [])

  async function login() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${BASE_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: secret })
      })
      const data = await res.json()
      if (res.ok) {
        sessionStorage.setItem('adminToken', data.token)
        setLoggedIn(true)
        loadShops(data.token)
      } else {
        setError(data.error || 'Fehler beim Login')
      }
    } catch (e) {
      setError('Server nicht erreichbar')
    } finally {
      setLoading(false)
    }
  }

  async function loadShops(token) {
    const t = token || sessionStorage.getItem('adminToken')
    setLoading(true)
    try {
      const res = await fetch(`${BASE_URL}/api/admin/shops`, {
        headers: { 'Authorization': `Bearer ${t}` }
      })
      if (res.status === 401) { logout(); return }
      const data = await res.json()
      setShops(Array.isArray(data) ? data : [])
    } catch (e) {
      setError('Fehler beim Laden')
    } finally {
      setLoading(false)
    }
  }

  async function toggleShop(shopId) {
    const t = sessionStorage.getItem('adminToken')
    try {
      await fetch(`${BASE_URL}/api/admin/shops/${shopId}/toggle`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${t}` }
      })
      loadShops()
    } catch (e) {
      alert('Fehler beim Sperren/Entsperren')
    }
  }

  async function deleteShop(shopId, shopName) {
    if (!confirm(`⚠️ Shop "${shopName}" wirklich KOMPLETT löschen?\n\nDas löscht:\n- Den Shop-Account\n- Alle Stempelkarten\n- Alle Kundendaten\n- Alle Staff-Tokens\n\nDas kann NICHT rückgängig gemacht werden!`)) return
    if (!confirm(`Letzter Check: "${shopName}" endgültig löschen?`)) return

    const t = sessionStorage.getItem('adminToken')
    try {
      const res = await fetch(`${BASE_URL}/api/admin/shops/${shopId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${t}` }
      })
      if (res.ok) {
        loadShops()
      } else {
        const data = await res.json()
        alert('Fehler: ' + (data.error || 'Unbekannter Fehler'))
      }
    } catch (e) {
      alert('Fehler beim Löschen')
    }
  }

  function logout() {
    sessionStorage.removeItem('adminToken')
    setLoggedIn(false)
    setSecret('')
    setShops([])
  }

  if (!loggedIn) {
    return (
        <div style={styles.loginContainer}>
          <div style={styles.loginCard}>
            <div style={styles.loginLogo}>SK</div>
            <h1 style={styles.loginTitle}>Admin-Panel</h1>
            <p style={styles.loginSubtitle}>Nur fur Betreiber</p>
            {error && <div style={styles.loginError}>{error}</div>}
            <div style={styles.field}>
              <label style={styles.label}>Admin-Passwort</label>
              <input
                  style={styles.input}
                  type="password"
                  value={secret}
                  onChange={e => setSecret(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && login()}
                  placeholder="••••••••"
              />
            </div>
            <button style={styles.btnLogin} onClick={login} disabled={loading}>
              {loading ? 'Einloggen...' : 'Einloggen'}
            </button>
          </div>
        </div>
    )
  }

  return (
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Admin-Panel</h1>
            <p style={styles.subtitle}>{shops.length} Laden registriert</p>
          </div>
          <button style={styles.btnLogout} onClick={logout}>Ausloggen</button>
        </div>

        <div style={styles.stats}>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>{shops.length}</div>
            <div style={styles.statLabel}>Gesamt Laden</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>{shops.filter(s => s.active).length}</div>
            <div style={styles.statLabel}>Aktive Laden</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>{shops.reduce((sum, s) => sum + s.customerCount, 0)}</div>
            <div style={styles.statLabel}>Gesamt Kunden</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>{shops.reduce((sum, s) => sum + s.cardCount, 0)}</div>
            <div style={styles.statLabel}>Gesamt Karten</div>
          </div>
        </div>

        <CreateShop onCreated={loadShops} />

        {changingPasswordFor && (
            <ChangePassword
                shop={changingPasswordFor}
                onDone={() => setChangingPasswordFor(null)}
            />
        )}

        <div style={styles.table}>
          <div style={styles.tableHeader}>
            <span>Laden</span>
            <span>E-Mail</span>
            <span>Karten</span>
            <span>Kunden</span>
            <span>Max Tokens</span>
            <span>Status</span>
            <span>Aktionen</span>
          </div>
          {shops.map(shop => (
              <div key={shop.id} style={{ ...styles.tableRow, opacity: shop.active ? 1 : 0.5 }}>
                <span style={styles.shopName}>{shop.name}</span>
                <span style={styles.shopEmail}>{shop.email}</span>
                <span style={styles.cell}>{shop.cardCount}</span>
                <span style={styles.cell}>{shop.customerCount}</span>
                <span style={styles.cell}>{shop.maxTokens}</span>
                <span style={{
                  ...styles.status,
                  background: shop.active ? '#e6f4ea' : '#fce8e6',
                  color: shop.active ? '#2C5F2E' : '#c00',
                }}>
              {shop.active ? 'Aktiv' : 'Gesperrt'}
            </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                      style={{
                        ...styles.btnToggle,
                        background: shop.active ? '#fce8e6' : '#e6f4ea',
                        color: shop.active ? '#c00' : '#2C5F2E',
                      }}
                      onClick={() => toggleShop(shop.id)}
                  >
                    {shop.active ? 'Sperren' : 'Entsperren'}
                  </button>
                  <button
                      style={{ ...styles.btnToggle, background: '#f0eeff', color: '#3C3489' }}
                      onClick={() => setChangingPasswordFor(shop)}
                  >
                    PW
                  </button>
                  <button
                      style={{ ...styles.btnToggle, background: '#1a1a1a', color: 'white' }}
                      onClick={() => deleteShop(shop.id, shop.name)}
                  >
                    🗑 Löschen
                  </button>
                </div>
              </div>
          ))}
        </div>
      </div>
  )
}

function CreateShop({ onCreated }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', maxTokens: 3 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleCreate(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    const t = sessionStorage.getItem('adminToken')
    try {
      const res = await fetch(`${BASE_URL}/api/admin/shops/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t}` },
        body: JSON.stringify({ ...form, maxTokens: parseInt(form.maxTokens) })
      })
      const data = await res.json()
      if (res.ok) {
        setSuccess(`Laden "${data.name}" erstellt! Max Tokens: ${data.maxTokens}`)
        setForm({ name: '', email: '', password: '', maxTokens: 3 })
        onCreated()
      } else {
        setError(data.error || 'Fehler beim Erstellen')
      }
    } catch (e) {
      setError('Server nicht erreichbar')
    } finally {
      setLoading(false)
    }
  }

  return (
      <div style={createStyles.card}>
        <h2 style={createStyles.title}>Neuen Laden erstellen</h2>
        {error && <div style={createStyles.error}>{error}</div>}
        {success && <div style={createStyles.success}>{success}</div>}
        <form onSubmit={handleCreate} style={createStyles.form}>
          <input style={createStyles.input} placeholder="Laden-Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          <input style={createStyles.input} type="email" placeholder="E-Mail" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          <input style={createStyles.input} type="password" placeholder="Passwort (min. 8 Zeichen)" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ fontSize: '13px', color: '#444', marginBottom: '6px' }}>Max. Staff-Tokens</label>
            <input style={createStyles.input} type="number" min="1" max="20" value={form.maxTokens} onChange={e => setForm({ ...form, maxTokens: e.target.value })} required />
          </div>
          <button style={createStyles.btn} type="submit" disabled={loading}>
            {loading ? 'Erstelle...' : 'Laden erstellen'}
          </button>
        </form>
      </div>
  )
}

function ChangePassword({ shop, onDone }) {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleChange(e) {
    e.preventDefault()
    if (password.length < 8) { setError('Passwort muss mindestens 8 Zeichen haben'); return }
    setLoading(true)
    setError('')
    const t = sessionStorage.getItem('adminToken')
    try {
      const res = await fetch(`${BASE_URL}/api/admin/shops/password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t}` },
        body: JSON.stringify({ shopId: shop.id, newPassword: password })
      })
      const data = await res.json()
      if (res.ok) {
        setSuccess('Passwort erfolgreich geandert!')
        setPassword('')
        setTimeout(onDone, 2000)
      } else {
        setError(data.error || 'Fehler')
      }
    } catch (e) {
      setError('Server nicht erreichbar')
    } finally {
      setLoading(false)
    }
  }

  return (
      <div style={createStyles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ ...createStyles.title, margin: 0 }}>Passwort andern: {shop.name}</h2>
          <button onClick={onDone} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#888' }}>x</button>
        </div>
        {error && <div style={createStyles.error}>{error}</div>}
        {success && <div style={createStyles.success}>{success}</div>}
        <form onSubmit={handleChange} style={createStyles.form}>
          <input style={createStyles.input} type="password" placeholder="Neues Passwort (min. 8 Zeichen)" value={password} onChange={e => setPassword(e.target.value)} required />
          <button style={createStyles.btn} type="submit" disabled={loading}>
            {loading ? 'Andert...' : 'Passwort andern'}
          </button>
        </form>
      </div>
  )
}

const createStyles = {
  card: { background: 'white', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  title: { fontSize: '18px', fontWeight: '600', margin: '0 0 16px', color: '#1a1a1a' },
  error: { background: '#fff0f0', color: '#c00', padding: '10px', borderRadius: '8px', fontSize: '14px', marginBottom: '12px' },
  success: { background: '#f0fff4', color: '#2C5F2E', padding: '10px', borderRadius: '8px', fontSize: '14px', marginBottom: '12px' },
  form: { display: 'flex', flexDirection: 'column', gap: '10px' },
  input: { padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #e0e0e0', fontSize: '14px', outline: 'none' },
  btn: { padding: '12px', background: '#3C3489', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
}

const styles = {
  loginContainer: { minHeight: '100vh', background: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  loginCard: { background: 'white', borderRadius: '20px', padding: '40px', width: '100%', maxWidth: '380px', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
  loginLogo: { width: '56px', height: '56px', borderRadius: '14px', background: '#3C3489', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '700', margin: '0 auto 16px' },
  loginTitle: { fontSize: '24px', fontWeight: '700', margin: '0 0 4px', color: '#1a1a1a' },
  loginSubtitle: { fontSize: '14px', color: '#888', margin: '0 0 28px' },
  loginError: { background: '#fff0f0', color: '#c00', padding: '10px', borderRadius: '8px', fontSize: '14px', marginBottom: '16px' },
  field: { marginBottom: '16px', textAlign: 'left' },
  label: { display: 'block', fontSize: '13px', fontWeight: '500', color: '#444', marginBottom: '6px' },
  input: { width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #e0e0e0', fontSize: '15px', outline: 'none', boxSizing: 'border-box' },
  btnLogin: { width: '100%', padding: '12px', background: '#3C3489', color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
  container: { padding: '24px', maxWidth: '1200px', margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  title: { fontSize: '24px', fontWeight: '700', margin: '0 0 4px', color: '#1a1a1a' },
  subtitle: { fontSize: '14px', color: '#888', margin: 0 },
  btnLogout: { background: '#f0f0f0', border: 'none', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontSize: '14px' },
  stats: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px', marginBottom: '24px' },
  statCard: { background: 'white', borderRadius: '12px', padding: '16px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  statNumber: { fontSize: '28px', fontWeight: '700', color: '#3C3489' },
  statLabel: { fontSize: '12px', color: '#888', marginTop: '4px' },
  table: { background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'auto' },
  tableHeader: { display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr 1fr 1.5fr', padding: '12px 16px', background: '#f8f8f8', fontSize: '11px', fontWeight: '600', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', minWidth: '800px' },
  tableRow: { display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr 1fr 1.5fr', padding: '14px 16px', borderTop: '1px solid #f0f0f0', alignItems: 'center', minWidth: '800px' },
  shopName: { fontSize: '14px', fontWeight: '600', color: '#1a1a1a' },
  shopEmail: { fontSize: '12px', color: '#666' },
  cell: { fontSize: '13px', color: '#666' },
  status: { fontSize: '12px', fontWeight: '600', padding: '3px 8px', borderRadius: '20px', display: 'inline-block' },
  btnToggle: { border: 'none', borderRadius: '8px', padding: '5px 10px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' },
}