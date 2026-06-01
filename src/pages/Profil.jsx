import { useEffect, useState, useRef } from 'react'
import api from '../api'

export default function Profil() {
  const [shop, setShop] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [heroUrl, setHeroUrl] = useState(null)
  const [form, setForm] = useState({
    name: '',
    colorBackground: '',
    colorForeground: '',
    colorLabel: '',
  })
  const fileRef = useRef()
  const heroRef = useRef()

  useEffect(() => {
    api.get('/api/shop/me').then(res => {
      setShop(res.data)
      setHeroUrl(res.data.heroImageUrl || null)
      setForm({
        name: res.data.name,
        colorBackground: res.data.colorBackground,
        colorForeground: res.data.colorForeground,
        colorLabel: res.data.colorLabel,
      })
    })
  }, [])

  async function saveProfile(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await api.put('/api/shop/me', form)
      const shopLocal = JSON.parse(localStorage.getItem('shop') || '{}')
      localStorage.setItem('shop', JSON.stringify({ ...shopLocal, name: form.name }))
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      alert('Fehler beim Speichern')
    } finally {
      setLoading(false)
    }
  }

  async function uploadLogo(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async () => {
      const base64 = reader.result.split(',')[1]
      const extension = file.name.split('.').pop().toLowerCase()
      try {
        const res = await api.post('/api/shop/logo', { base64, extension })
        setShop(prev => ({ ...prev, logoUrl: res.data.logoUrl }))
        alert('Logo erfolgreich hochgeladen!')
      } catch (err) {
        alert('Fehler beim Logo-Upload')
      }
    }
    reader.readAsDataURL(file)
  }

  async function uploadHero(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async () => {
      const base64 = reader.result.split(',')[1]
      const extension = file.name.split('.').pop().toLowerCase()
      try {
        const res = await api.post('/api/shop/hero', { base64, extension })
        setHeroUrl(res.data.heroImageUrl)
        alert('Banner erfolgreich hochgeladen!')
      } catch (err) {
        alert('Fehler beim Banner-Upload')
      }
    }
    reader.readAsDataURL(file)
  }

  if (!shop) return <div style={styles.loading}>Ladt...</div>

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Profil</h1>
      <p style={styles.subtitle}>Passe dein Laden-Profil an</p>

      {/* Google Wallet Vorschau */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Google Wallet Vorschau</h2>
        <div style={{ ...styles.walletCard, background: form.colorBackground, color: form.colorForeground }}>
          {/* Header */}
          <div style={styles.walletHeader}>
            <div style={styles.walletLogo}>
              {shop.logoUrl
                ? <img src={shop.logoUrl} alt="Logo" style={styles.walletLogoImg} />
                : <span style={{ color: '#3C3489', fontWeight: 700 }}>SK</span>}
            </div>
            <div style={styles.walletShopName}>{form.name || 'Mein Laden'}</div>
          </div>

          {/* Datenfelder */}
          <div style={styles.walletFields}>
            <div style={styles.walletField}>
              <div style={{ ...styles.walletFieldLabel, color: form.colorLabel }}>STEMPEL</div>
              <div style={styles.walletFieldValue}>3/10</div>
            </div>
            <div style={styles.walletField}>
              <div style={{ ...styles.walletFieldLabel, color: form.colorLabel }}>BELOHNUNG</div>
              <div style={styles.walletFieldValue}>Gratis ☕</div>
            </div>
          </div>

          {/* Hero / Banner */}
          {heroUrl && (
            <img src={heroUrl} alt="Banner" style={styles.walletHero} />
          )}

          {/* QR */}
          <div style={styles.walletQrWrap}>
            <div style={styles.walletQr}>
              <svg width="80" height="80" viewBox="0 0 80 80">
                <rect width="80" height="80" fill="white"/>
                <rect x="8" y="8" width="20" height="20" fill="black"/>
                <rect x="14" y="14" width="8" height="8" fill="white"/>
                <rect x="52" y="8" width="20" height="20" fill="black"/>
                <rect x="58" y="14" width="8" height="8" fill="white"/>
                <rect x="8" y="52" width="20" height="20" fill="black"/>
                <rect x="14" y="58" width="8" height="8" fill="white"/>
                <rect x="36" y="8" width="6" height="6" fill="black"/>
                <rect x="36" y="20" width="6" height="6" fill="black"/>
                <rect x="36" y="36" width="6" height="6" fill="black"/>
                <rect x="48" y="48" width="6" height="6" fill="black"/>
                <rect x="60" y="60" width="6" height="6" fill="black"/>
                <rect x="48" y="60" width="6" height="6" fill="black"/>
                <rect x="60" y="48" width="6" height="6" fill="black"/>
              </svg>
            </div>
          </div>
        </div>
        <p style={styles.previewHint}>So sieht die Karte ungefähr in Google Wallet aus.</p>
      </div>

      {/* Logo */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Logo</h2>
        <div style={styles.logoRow}>
          <div style={styles.logoPreview}>
            {shop.logoUrl
              ? <img src={shop.logoUrl} alt="Logo" style={styles.logoImg} />
              : <div style={styles.logoPlaceholder}>SK</div>
            }
          </div>
          <div style={styles.logoInfo}>
          <p style={styles.logoHint}>PNG mit transparentem Hintergrund, empfohlen 480x150px oder schmaler</p>
            <input type="file" accept="image/*" ref={fileRef} onChange={uploadLogo} style={{ display: 'none' }} />
            <button style={styles.btnSecondary} onClick={() => fileRef.current.click()}>Logo hochladen</button>
          </div>
        </div>
      </div>

      {/* Banner / Hero */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Banner (Hero-Image)</h2>
        <div style={styles.heroBox}>
          {heroUrl
            ? <img src={heroUrl} alt="Banner" style={styles.heroImg} />
            : <div style={styles.heroPlaceholder}>Kein Banner</div>}
        </div>
        <p style={styles.logoHint}>PNG oder JPG, empfohlen 1125x369px (3:1 Format) – kein Text im Bild</p>
        <input type="file" accept="image/*" ref={heroRef} onChange={uploadHero} style={{ display: 'none' }} />
        <button style={styles.btnSecondary} onClick={() => heroRef.current.click()}>Banner hochladen</button>
      </div>

      {/* Profil bearbeiten */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Farben & Name</h2>
        {saved && <div style={styles.success}>Gespeichert!</div>}
        <form onSubmit={saveProfile}>
          <div style={styles.field}>
            <label style={styles.label}>Laden-Name</label>
            <input style={styles.input} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Hintergrundfarbe</label>
            <div style={styles.colorRow}>
              <input type="color" value={form.colorBackground} onChange={e => setForm({ ...form, colorBackground: e.target.value })} style={styles.colorPicker} />
              <input style={{ ...styles.input, flex: 1 }} value={form.colorBackground} onChange={e => setForm({ ...form, colorBackground: e.target.value })} placeholder="#3C3489" />
            </div>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Textfarbe</label>
            <div style={styles.colorRow}>
              <input type="color" value={form.colorForeground} onChange={e => setForm({ ...form, colorForeground: e.target.value })} style={styles.colorPicker} />
              <input style={{ ...styles.input, flex: 1 }} value={form.colorForeground} onChange={e => setForm({ ...form, colorForeground: e.target.value })} placeholder="#FFFFFF" />
            </div>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Label-Farbe</label>
            <div style={styles.colorRow}>
              <input type="color" value={form.colorLabel} onChange={e => setForm({ ...form, colorLabel: e.target.value })} style={styles.colorPicker} />
              <input style={{ ...styles.input, flex: 1 }} value={form.colorLabel} onChange={e => setForm({ ...form, colorLabel: e.target.value })} placeholder="#FAC875" />
            </div>
          </div>
          <button style={styles.btnPrimary} type="submit" disabled={loading}>
            {loading ? 'Speichert...' : 'Speichern'}
          </button>
        </form>
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
    api.get('/api/shop/staff-tokens').then(res => setTokens(res.data))
  }, [])

  async function createToken(e) {
    e.preventDefault()
    setError('')
    try {
      const res = await api.post('/api/shop/staff-token', { label })
      setNewToken(res.data.token)
      setLabel('')
      api.get('/api/shop/staff-tokens').then(res => setTokens(res.data))
    } catch (err) {
      setError(err.response?.data?.error || 'Fehler beim Erstellen')
    }
  }

  return (
    <div style={styles.card}>
      <h2 style={styles.cardTitle}>Staff-Tokens</h2>
      <p style={styles.hint}>Mitarbeiter brauchen einen Token um Stempel zu vergeben.</p>

      {newToken && (
        <div style={styles.tokenBox}>
          <div style={styles.tokenLabel}>Neuer Token (kopiere ihn jetzt!):</div>
          <div style={styles.tokenValue}>{newToken}</div>
          <button style={styles.btnSecondary} onClick={() => {
            navigator.clipboard.writeText(newToken)
            alert('Kopiert!')
          }}>
            Kopieren
          </button>
        </div>
      )}

      {error && <div style={{ background: '#fff0f0', color: '#c00', padding: '10px', borderRadius: '8px', fontSize: '14px', marginBottom: '12px' }}>{error}</div>}

      <div style={styles.tokenList}>
        {tokens.map((t, i) => (
          <div key={i} style={styles.tokenItem}>
            <span style={styles.tokenItemLabel}>{t.label}</span>
            <span style={styles.tokenFull}>{t.token}</span>
          </div>
        ))}
      </div>

      <form onSubmit={createToken}>
        <input
          style={{ ...styles.input, marginBottom: '10px' }}
          value={label}
          onChange={e => setLabel(e.target.value)}
          placeholder="z.B. Kasse 1"
          required
        />
        <button style={styles.btnPrimary} type="submit">Erstellen</button>
      </form>
    </div>
  )
}

const styles = {
  page: { maxWidth: '600px', margin: '0 auto' },
  loading: { color: '#888', padding: '40px' },
  title: { fontSize: '24px', fontWeight: '700', margin: '0 0 4px', color: '#1a1a1a' },
  subtitle: { fontSize: '14px', color: '#888', margin: '0 0 20px' },
  card: { background: 'white', borderRadius: '12px', padding: '20px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  cardTitle: { fontSize: '16px', fontWeight: '600', margin: '0 0 16px', color: '#1a1a1a' },

  // Google Wallet Vorschau
  walletCard: { borderRadius: '16px', overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.18)' },
  walletHeader: { display: 'flex', alignItems: 'center', gap: '12px', padding: '16px' },
  walletLogo: { width: '40px', height: '40px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 },
  walletLogoImg: { width: '100%', height: '100%', objectFit: 'cover' },
  walletShopName: { fontSize: '16px', fontWeight: '600' },
  walletFields: { display: 'flex', gap: '32px', padding: '0 16px 16px' },
  walletField: {},
  walletFieldLabel: { fontSize: '11px', fontWeight: '600', letterSpacing: '0.5px', marginBottom: '2px' },
  walletFieldValue: { fontSize: '16px', fontWeight: '600' },
  walletHero: { width: '100%', height: '120px', objectFit: 'cover', display: 'block' },
  walletQrWrap: { display: 'flex', justifyContent: 'center', padding: '16px', background: 'rgba(255,255,255,0.08)' },
  walletQr: { background: 'white', padding: '8px', borderRadius: '8px', display: 'flex' },
  previewHint: { fontSize: '12px', color: '#aaa', margin: '10px 0 0', textAlign: 'center' },

  logoRow: { display: 'flex', alignItems: 'center', gap: '16px' },
  logoPreview: { flexShrink: 0 },
  logoImg: { width: '80px', height: '80px', borderRadius: '12px', objectFit: 'cover' },
  logoPlaceholder: { width: '80px', height: '80px', borderRadius: '12px', background: '#f0eeff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '700', color: '#3C3489' },
  logoInfo: { flex: 1 },
  logoHint: { fontSize: '12px', color: '#888', marginBottom: '10px' },

  heroBox: { width: '100%', height: '120px', borderRadius: '10px', overflow: 'hidden', background: '#f5f5f7', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  heroImg: { width: '100%', height: '100%', objectFit: 'cover' },
  heroPlaceholder: { color: '#bbb', fontSize: '14px' },

  success: { background: '#f0fff4', color: '#2C5F2E', padding: '10px 14px', borderRadius: '8px', fontSize: '14px', marginBottom: '16px' },
  field: { marginBottom: '14px' },
  label: { display: 'block', fontSize: '13px', fontWeight: '500', color: '#444', marginBottom: '6px' },
  input: { width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #e0e0e0', fontSize: '14px', outline: 'none', boxSizing: 'border-box' },
  colorRow: { display: 'flex', gap: '8px', alignItems: 'center' },
  colorPicker: { width: '44px', height: '44px', border: 'none', borderRadius: '8px', cursor: 'pointer', padding: '2px', flexShrink: 0 },
  btnPrimary: { background: '#3C3489', color: 'white', border: 'none', borderRadius: '10px', padding: '12px 20px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', width: '100%', marginTop: '4px' },
  btnSecondary: { background: '#f0eeff', color: '#3C3489', border: 'none', borderRadius: '10px', padding: '10px 16px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  hint: { fontSize: '13px', color: '#888', margin: '0 0 16px' },
  tokenBox: { background: '#f0fff4', borderRadius: '10px', padding: '16px', marginBottom: '16px' },
  tokenLabel: { fontSize: '13px', fontWeight: '600', color: '#2C5F2E', marginBottom: '8px' },
  tokenValue: { fontFamily: 'monospace', fontSize: '12px', color: '#1a1a1a', marginBottom: '10px', wordBreak: 'break-all' },
  tokenList: { marginBottom: '16px' },
  tokenItem: { padding: '10px 0', borderBottom: '1px solid #f0f0f0', fontSize: '14px' },
  tokenItemLabel: { fontWeight: '500', color: '#1a1a1a', display: 'block', marginBottom: '4px' },
  tokenFull: { fontFamily: 'monospace', color: '#666', fontSize: '11px', wordBreak: 'break-all' },
  tokenForm: { display: 'flex', gap: '10px' },
}