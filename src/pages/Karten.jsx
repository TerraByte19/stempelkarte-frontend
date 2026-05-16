import { useEffect, useState } from 'react'
import api from '../api'

export default function Karten() {
  const [cards, setCards] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    rewardThreshold: 10,
    rewardText: '',
  })

  useEffect(() => {
    loadCards()
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

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Karten verwalten</h1>
          <p style={styles.subtitle}>Erstelle und verwalte deine Stempelkarten</p>
        </div>
        <button style={styles.btnPrimary} onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Abbrechen' : '+ Neue Karte'}
        </button>
      </div>

      {showForm && (
        <div style={styles.formCard}>
          <h2 style={styles.formTitle}>Neue Stempelkarte</h2>
          <form onSubmit={createCard}>
            <div style={styles.formGrid}>
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
            </div>
            <button style={styles.btnPrimary} type="submit" disabled={loading}>
              {loading ? 'Erstelle...' : 'Karte erstellen'}
            </button>
          </form>
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
              <div style={styles.cardReward}>🎁 {card.rewardText}</div>
              <div style={styles.cardId}>ID: {card.id}</div>
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
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' },
  field: { display: 'flex', flexDirection: 'column' },
  label: { fontSize: '13px', fontWeight: '500', color: '#444', marginBottom: '6px' },
  input: {
    padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #e0e0e0',
    fontSize: '14px', outline: 'none', boxSizing: 'border-box',
  },
  empty: {
    background: 'white', borderRadius: '12px', padding: '40px',
    textAlign: 'center', color: '#888', fontSize: '14px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  cardGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' },
  card: { background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  cardName: { fontSize: '16px', fontWeight: '600', color: '#1a1a1a' },
  badge: {
    background: '#f0eeff', color: '#3C3489', borderRadius: '20px',
    padding: '3px 10px', fontSize: '12px', fontWeight: '600',
  },
  cardDesc: { fontSize: '13px', color: '#666', marginBottom: '10px' },
  cardReward: { fontSize: '13px', color: '#2C5F2E', fontWeight: '500', marginBottom: '10px' },
  cardId: { fontSize: '11px', color: '#bbb', fontFamily: 'monospace' },
}