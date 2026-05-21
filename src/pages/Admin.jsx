import { useState, useEffect } from 'react'

const BASE_URL = 'https://stempelkarte-backend.onrender.com'

export default function Admin() {
  const [secret, setSecret] = useState(sessionStorage.getItem('adminSecret') || '')
  const [loggedIn, setLoggedIn] = useState(!!sessionStorage.getItem('adminSecret'))
  const [shops, setShops] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
    if (res.status === 401) {
      logout()
      return
    }
    const data = await res.json()
    setShops(data)
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

function logout() {
  sessionStorage.removeItem('adminToken')
  setLoggedIn(false)
  setSecret('')
  setShops([])
}

  async function toggleShop(shopId) {
    try {
      await fetch(`${BASE_URL}/api/admin/shops/${shopId}/toggle`, {
        method: 'POST',
        headers: { 'X-Admin-Secret': sessionStorage.getItem('adminSecret') }
      })
      loadShops()
    } catch (e) {
      alert('Fehler beim Sperren/Entsperren')
    }
  }

  function logout() {
    sessionStorage.removeItem('adminSecret')
    setLoggedIn(false)
    setSecret('')
    setShops([])
  }

  // Login Screen
  if (!loggedIn) {
    return (
      <div style={styles.loginContainer}>
        <div style={styles.loginCard}>
          <div style={styles.loginLogo}>🔧</div>
          <h1 style={styles.loginTitle}>Admin-Panel</h1>
          <p style={styles.loginSubtitle}>Nur für Betreiber</p>
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

  // Admin Dashboard
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>🔧 Admin-Panel</h1>
          <p style={styles.subtitle}>{shops.length} Läden registriert</p>
        </div>
        <button style={styles.btnLogout} onClick={logout}>Ausloggen</button>
      </div>

      <div style={styles.stats}>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{shops.length}</div>
          <div style={styles.statLabel}>Gesamt Läden</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{shops.filter(s => s.active).length}</div>
          <div style={styles.statLabel}>Aktive Läden</div>
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

      <div style={styles.table}>
        <div style={styles.tableHeader}>
          <span>Laden</span>
          <span>E-Mail</span>
          <span>Karten</span>
          <span>Kunden</span>
          <span>Status</span>
          <span>Aktion</span>
        </div>
        {shops.map(shop => (
          <div key={shop.id} style={{
            ...styles.tableRow,
            opacity: shop.active ? 1 : 0.5,
          }}>
            <span style={styles.shopName}>{shop.name}</span>
            <span style={styles.shopEmail}>{shop.email}</span>
            <span style={styles.cell}>{shop.cardCount} Karten</span>
            <span style={styles.cell}>{shop.customerCount} Kunden</span>
            <span style={{
              ...styles.status,
              background: shop.active ? '#e6f4ea' : '#fce8e6',
              color: shop.active ? '#2C5F2E' : '#c00',
            }}>
              {shop.active ? '✅ Aktiv' : '🚫 Gesperrt'}
            </span>
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
          </div>
        ))}
      </div>
    </div>
  )
}

const styles = {
  loginContainer: {
    minHeight: '100vh', background: '#1a1a2e',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  loginCard: {
    background: 'white', borderRadius: '20px', padding: '40px',
    width: '100%', maxWidth: '380px', textAlign: 'center',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  loginLogo: { fontSize: '48px', marginBottom: '16px' },
  loginTitle: { fontSize: '24px', fontWeight: '700', margin: '0 0 4px', color: '#1a1a1a' },
  loginSubtitle: { fontSize: '14px', color: '#888', margin: '0 0 28px' },
  loginError: {
    background: '#fff0f0', color: '#c00', padding: '10px',
    borderRadius: '8px', fontSize: '14px', marginBottom: '16px',
  },
  field: { marginBottom: '16px', textAlign: 'left' },
  label: { display: 'block', fontSize: '13px', fontWeight: '500', color: '#444', marginBottom: '6px' },
  input: {
    width: '100%', padding: '10px 14px', borderRadius: '8px',
    border: '1.5px solid #e0e0e0', fontSize: '15px',
    outline: 'none', boxSizing: 'border-box',
  },
  btnLogin: {
    width: '100%', padding: '12px', background: '#3C3489',
    color: 'white', border: 'none', borderRadius: '10px',
    fontSize: '15px', fontWeight: '600', cursor: 'pointer',
  },
  container: { padding: '32px', maxWidth: '1200px', margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' },
  title: { fontSize: '28px', fontWeight: '700', margin: '0 0 4px', color: '#1a1a1a' },
  subtitle: { fontSize: '14px', color: '#888', margin: 0 },
  btnLogout: {
    background: '#f0f0f0', border: 'none', borderRadius: '8px',
    padding: '8px 16px', cursor: 'pointer', fontSize: '14px',
  },
  stats: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' },
  statCard: {
    background: 'white', borderRadius: '12px', padding: '20px',
    textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  statNumber: { fontSize: '36px', fontWeight: '700', color: '#3C3489' },
  statLabel: { fontSize: '13px', color: '#888', marginTop: '4px' },
  table: {
    background: 'white', borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden',
  },
  tableHeader: {
    display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr 1fr',
    padding: '14px 20px', background: '#f8f8f8',
    fontSize: '12px', fontWeight: '600', color: '#888',
    textTransform: 'uppercase', letterSpacing: '0.5px',
  },
  tableRow: {
    display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr 1fr',
    padding: '16px 20px', borderTop: '1px solid #f0f0f0',
    alignItems: 'center',
  },
  shopName: { fontSize: '14px', fontWeight: '600', color: '#1a1a1a' },
  shopEmail: { fontSize: '13px', color: '#666' },
  cell: { fontSize: '13px', color: '#666' },
  status: {
    fontSize: '12px', fontWeight: '600', padding: '4px 10px',
    borderRadius: '20px', display: 'inline-block',
  },
  btnToggle: {
    border: 'none', borderRadius: '8px', padding: '6px 12px',
    fontSize: '12px', fontWeight: '600', cursor: 'pointer',
  },
}