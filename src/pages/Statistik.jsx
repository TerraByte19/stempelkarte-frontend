import { useEffect, useState } from 'react'
import api from '../api'

export default function Statistik() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    api.get('/api/shop/stats/summary')
      .then(res => setData(res.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div style={s.info}>Lade Statistik…</div>
  if (error || !data) return <div style={s.info}>Statistik konnte nicht geladen werden.</div>

  const perCard = Array.isArray(data.perCard) ? data.perCard : []
  const hasData = data.totalCustomers > 0

  // Kennzahl-Kacheln
  const kpis = [
    { label: 'Kunden gesamt', value: data.totalCustomers, icon: '👥', color: '#3C3489' },
    { label: 'Stempel vergeben', value: data.totalStamps, icon: '⭐', color: '#FAC875' },
    { label: 'Belohnungen eingelöst', value: data.totalRewards, icon: '🎁', color: '#2C5F2E' },
    { label: 'Aktive Karten', value: `${data.activeCards}/${data.totalCards}`, icon: '🎫', color: '#888' },
  ]

  // Höchster Kundenwert für die Balken-Skalierung
  const maxCustomers = perCard.reduce((m, c) => Math.max(m, c.customerCount || 0), 0) || 1

  return (
    <div>
      <div style={s.header}>
        <h1 style={s.title}>Statistik</h1>
        <p style={s.subtitle}>Überblick für {data.shopName}</p>
      </div>

      {/* KPI-Kacheln */}
      <div style={s.kpiGrid}>
        {kpis.map(k => (
          <div key={k.label} style={s.kpiCard}>
            <div style={{ ...s.kpiIcon, background: k.color + '22' }}>{k.icon}</div>
            <div>
              <div style={s.kpiValue}>{k.value}</div>
              <div style={s.kpiLabel}>{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Abgeleitete Kennzahlen */}
      <div style={s.derivedRow}>
        <div style={s.derivedCard}>
          <div style={s.derivedValue}>{data.avgStampsPerCustomer}</div>
          <div style={s.derivedLabel}>Ø Stempel pro Kunde</div>
        </div>
        <div style={s.derivedCard}>
          <div style={s.derivedValue}>{data.rewardsPerCustomer}</div>
          <div style={s.derivedLabel}>Ø Belohnungen pro Kunde</div>
        </div>
      </div>

      {/* Aufschlüsselung pro Karte */}
      <div style={s.panel}>
        <div style={s.panelTitle}>Pro Karte</div>
        {!hasData ? (
          <div style={s.empty}>
            Noch keine Kundendaten. Sobald Kunden Karten nutzen und gestempelt werden,
            erscheinen hier die Zahlen.
          </div>
        ) : (
          <div>
            {perCard.map(card => (
              <div key={card.cardId} style={s.cardRow}>
                <div style={s.cardRowTop}>
                  <span style={s.cardName}>{card.cardName}</span>
                  <span style={s.cardCustomers}>{card.customerCount} Kunden</span>
                </div>
                {/* Balken: relativer Kundenanteil */}
                <div style={s.barTrack}>
                  <div style={{ ...s.barFill, width: `${(card.customerCount / maxCustomers) * 100}%` }} />
                </div>
                <div style={s.cardStats}>
                  <span>⭐ {card.totalStamps} Stempel</span>
                  <span>🎁 {card.totalRewards} eingelöst</span>
                  <span>Ziel: {card.rewardThreshold}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={s.note}>
        Die Zahlen aktualisieren sich automatisch mit jedem Scan. Ein Verlauf über
        die Zeit (z.B. pro Woche) lässt sich später ergänzen.
      </div>
    </div>
  )
}

const s = {
  header: { marginBottom: 24 },
  title: { fontSize: 24, fontWeight: 700, margin: '0 0 4px', color: '#1a1a1a' },
  subtitle: { fontSize: 14, color: '#888', margin: 0 },
  info: { background: 'white', borderRadius: 12, padding: 40, textAlign: 'center', color: '#888', fontSize: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },

  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 16 },
  kpiCard: { background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 14 },
  kpiIcon: { width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 },
  kpiValue: { fontSize: 26, fontWeight: 800, color: '#1a1a1a', lineHeight: 1 },
  kpiLabel: { fontSize: 13, color: '#888', marginTop: 4 },

  derivedRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 },
  derivedCard: { background: 'white', borderRadius: 12, padding: 18, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', textAlign: 'center' },
  derivedValue: { fontSize: 22, fontWeight: 800, color: '#3C3489' },
  derivedLabel: { fontSize: 12, color: '#888', marginTop: 4 },

  panel: { background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 16 },
  panelTitle: { fontSize: 14, fontWeight: 700, color: '#1a1a1a', marginBottom: 16 },
  empty: { color: '#999', fontSize: 14, textAlign: 'center', padding: '20px 0' },

  cardRow: { padding: '12px 0', borderBottom: '1px solid #f0f0f0' },
  cardRowTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardName: { fontSize: 14, fontWeight: 600, color: '#1a1a1a' },
  cardCustomers: { fontSize: 13, fontWeight: 600, color: '#3C3489' },
  barTrack: { width: '100%', height: 8, background: '#f0eeff', borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  barFill: { height: '100%', background: '#3C3489', borderRadius: 4, transition: 'width 0.3s' },
  cardStats: { display: 'flex', gap: 16, fontSize: 12, color: '#666' },

  note: { fontSize: 12, color: '#aaa', textAlign: 'center', marginTop: 8 },
}