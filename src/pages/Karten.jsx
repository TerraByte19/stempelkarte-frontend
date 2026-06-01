import { useEffect, useState } from 'react'
import api from '../api'

export default function Karten() {
  const [cards, setCards] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [shop, setShop] = useState(null)
  const [form, setForm] = useState({
    name: '',
    description: '',
    rewardThreshold: 10,
    rewardText: '',
  })

  useEffect(() => {
    loadCards()
    api.get('/api/shop/me').then(res => setShop(res.data))
  }, [])

  async function loadCards() {
    const res = await api.get('/api/shop/cards')
    setCards(res.data)
  }

  async function createCard(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/api/shop/cards', {
        ...form,
        rewardThreshold: parseInt(form.rewardThreshold),
      })
      setShowForm(false)
      setForm({ name: '', description: '', rewardThreshold: 10, rewardText: '' })
      loadCards()
    } catch (err) {
      alert('Fehler beim Erstellen der Karte')
    } finally {
      setLoading(false)
    }
  }

  async function deleteCard(cardId, cardName) {
    if (!confirm(`Karte "${cardName}" wirklich deaktivieren?`)) return
    try {
      await api.delete(`/api/shop/cards/${cardId}`)
      loadCards()
    } catch (err) {
      alert('Fehler beim Deaktivieren')
    }
  }

  const bg = shop?.colorBackground || '#3C3489'
  const fg = shop?.colorForeground || '#FFFFFF'
  const label = shop?.colorLabel || '#FAC875'
  const logoUrl = shop?.logoUrl || null
  const heroUrl = shop?.heroImageUrl || null
  const threshold = parseInt(form.rewardThreshold) || 10

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Karten verwalten</h1>
          <p style={styles.subtitle}>Erstelle und verwalte deine Stempelkarten</p>
        </div>
        <button style={styles.btnPrimary} onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Abbrechen' : '+ Neue Karte'}
        </button>
      </div>

      {showForm && (
        <div style={styles.formCard}>
          <h2 style={styles.formTitle}>Neue Stempelkarte</h2>

          <div style={styles.formLayout}>
            {/* Formular */}
            <div style={styles.formFields}>
              <div style={styles.field}>
                <label style={styles.label}>Kartenname</label>
                <input
                  style={styles.input}
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="z.B. Kaffee-Karte"
                  required
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Beschreibung</label>
                <input
                  style={styles.input}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="z.B. 10 Stempel = 1 Gratis-Kaffee"
                  required
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Stempel bis Belohnung</label>
                <input
                  style={styles.input}
                  type="number"
                  min="1"
                  max="100"
                  value={form.rewardThreshold}
                  onChange={e => setForm({ ...form, rewardThreshold: e.target.value })}
                  required
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Belohnung</label>
                <input
                  style={styles.input}
                  value={form.rewardText}
                  onChange={e => setForm({ ...form, rewardText: e.target.value })}
                  placeholder="z.B. Gratis-Kaffee"
                  required
                />
              </div>
              <button style={styles.btnCreate} type="button" onClick={createCard} disabled={loading}>
                {loading ? 'Erstelle...' : 'Karte erstellen'}
              </button>
            </div>

            {/* Live Google Wallet Vorschau */}
            <div style={styles.previewCol}>
              <div style={styles.previewLabel}>Vorschau Google Wallet</div>
              <div style={{ ...styles.walletCard, background: bg, color: fg }}>
                {/* Header */}
                <div style={styles.walletHeader}>
                  <div style={styles.walletLogo}>
                    {logoUrl
                      ? <img src={logoUrl} alt="Logo" style={styles.walletLogoImg} />
                      : <span style={{ color: '#3C3489', fontWeight: 700, fontSize: 13 }}>SK</span>}
                  </div>
                  <div style={styles.walletShopName}>{shop?.name || 'Dein Laden'}</div>
                </div>

                {/* Datenfelder */}
                <div style={styles.walletFields}>
                  <div>
                    <div style={{ ...styles.walletFieldLabel, color: label }}>STEMPEL</div>
                    <div style={styles.walletFieldValue}>0/{threshold}</div>
                  </div>
                  <div>
                    <div style={{ ...styles.walletFieldLabel, color: label }}>BELOHNUNG</div>
                    <div style={styles.walletFieldValue}>{form.rewardText || '—'}</div>
                  </div>
                  <div>
                    <div style={{ ...styles.walletFieldLabel, color: label }}>KARTE</div>
                    <div style={styles.walletFieldValue}>{form.name || '—'}</div>
                  </div>
                </div>

                {/* Hero */}
                {heroUrl && (
                  <img src={heroUrl} alt="Banner" style={styles.walletHero} />
                )}

                {/* QR */}
                <div style={styles.walletQrWrap}>
                  <div style={styles.walletQr}>
                    <svg width="72" height="72" viewBox="0 0 80 80">
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
              <p style={styles.previewHint}>Farben & Logo aus Profil-Einstellungen</p>
            </div>
          </div>
        </div>
      )}

      {cards.length === 0 ? (
        <div style={styles.empty}>
          Noch keine Karten vorhanden — klick auf "Neue Karte" um anzufangen!
        </div>
      ) : (
        <div style={styles.cardGrid}>
          {cards.map(card => (
            <div key={card.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.cardName}>{card.name}</div>
                <div style={styles.badge}>{card.rewardThreshold} Stempel</div>
              </div>
              <div style={styles.cardDesc}>{card.description}</div>
              <div style={styles.cardReward}>Belohnung: {card.rewardText}</div>
              <div style={styles.cardId}>ID: {card.id}</div>
              <button
                style={styles.btnDelete}
                onClick={() => deleteCard(card.id, card.name)}
              >
                Deaktivieren
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const styles = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' },
  title: { fontSize: '24px', fontWeight: '700', margin: '0 0 4px', color: '#1a1a1a' },
  subtitle: { fontSize: '14px', color: '#888', margin: 0 },
  btnPrimary: {
    background: '#3C3489', color: 'white', border: 'none',
    borderRadius: '10px', padding: '10px 20px', fontSize: '14px',
    fontWeight: '600', cursor: 'pointer',
  },
  formCard: {
    background: 'white', borderRadius: '12px', padding: '24px',
    marginBottom: '28px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  formTitle: { fontSize: '18px', fontWeight: '600', margin: '0 0 20px', color: '#1a1a1a' },
  formLayout: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', alignItems: 'start' },
  formFields: {},
  field: { display: 'flex', flexDirection: 'column', marginBottom: '14px' },
  label: { fontSize: '13px', fontWeight: '500', color: '#444', marginBottom: '6px' },
  input: {
    padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #e0e0e0',
    fontSize: '14px', outline: 'none', boxSizing: 'border-box',
  },
  btnCreate: {
    background: '#3C3489', color: 'white', border: 'none',
    borderRadius: '10px', padding: '12px 20px', fontSize: '14px',
    fontWeight: '600', cursor: 'pointer', width: '100%', marginTop: '4px',
  },
  previewCol: {},
  previewLabel: { fontSize: '13px', fontWeight: '600', color: '#444', marginBottom: '10px' },
  walletCard: { borderRadius: '16px', overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.18)' },
  walletHeader: { display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 14px 8px' },
  walletLogo: { width: '36px', height: '36px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 },
  walletLogoImg: { width: '100%', height: '100%', objectFit: 'cover' },
  walletShopName: { fontSize: '14px', fontWeight: '600' },
  walletFields: { display: 'flex', gap: '16px', padding: '0 14px 12px' },
  walletFieldLabel: { fontSize: '10px', fontWeight: '700', letterSpacing: '0.5px', marginBottom: '2px' },
  walletFieldValue: { fontSize: '13px', fontWeight: '600' },
  walletHero: { width: '100%', height: '90px', objectFit: 'cover', display: 'block' },
  walletQrWrap: { display: 'flex', justifyContent: 'center', padding: '12px', background: 'rgba(255,255,255,0.08)' },
  walletQr: { background: 'white', padding: '6px', borderRadius: '8px' },
  previewHint: { fontSize: '11px', color: '#aaa', margin: '8px 0 0', textAlign: 'center' },
  empty: {
    background: 'white', borderRadius: '12px', padding: '40px',
    textAlign: 'center', color: '#888', fontSize: '14px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  cardGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' },
  card: { background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  cardName: { fontSize: '16px', fontWeight: '600', color: '#1a1a1a' },
  badge: { background: '#f0eeff', color: '#3C3489', borderRadius: '20px', padding: '3px 10px', fontSize: '12px', fontWeight: '600' },
  cardDesc: { fontSize: '13px', color: '#666', marginBottom: '8px' },
  cardReward: { fontSize: '13px', color: '#2C5F2E', fontWeight: '500', marginBottom: '8px' },
  cardId: { fontSize: '11px', color: '#bbb', fontFamily: 'monospace', marginBottom: '12px' },
  btnDelete: { background: '#fce8e6', color: '#c00', border: 'none', borderRadius: '8px', padding: '7px 14px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', width: '100%' },
}