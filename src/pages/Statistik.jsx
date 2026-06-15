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
  const history = Array.isArray(data.history) ? data.history : []
  const hasData = data.totalCustomers > 0

  const kpis = [
    { label: 'Kunden gesamt', value: data.totalCustomers, icon: '👥', color: '#3C3489' },
    { label: 'Stempel vergeben', value: data.totalStamps, icon: '⭐', color: '#FAC875' },
    { label: 'Belohnungen eingelöst', value: data.totalRewards, icon: '🎁', color: '#2C5F2E' },
    { label: 'Aktiv (30 Tage)', value: data.activeCustomers30d, icon: '🔥', color: '#E07A3C' },
  ]

  const maxCustomers = perCard.reduce((m, c) => Math.max(m, c.customerCount || 0), 0) || 1

  return (
    <div>
      <div style={s.header}>
        <h1 style={s.title}>Statistik</h1>
        <p style={s.subtitle}>Überblick für {data.shopName}</p>
      </div>

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

      <div style={s.derivedGrid}>
        <div style={s.derivedCard}>
          <div style={s.derivedValue}>{data.redemptionRate}%</div>
          <div style={s.derivedLabel}>Einlöse-Quote</div>
          <div style={s.derivedHint}>Kunden mit mind. 1 Belohnung</div>
        </div>
        <div style={s.derivedCard}>
          <div style={s.derivedValue}>{data.customersNearReward}</div>
          <div style={s.derivedLabel}>Kurz vor Belohnung</div>
          <div style={s.derivedHint}>≥ 80% der Stempel — gezielt zurückholen!</div>
        </div>
        <div style={s.derivedCard}>
          <div style={s.derivedValue}>{data.avgFillPercent}%</div>
          <div style={s.derivedLabel}>Ø Füllgrad</div>
          <div style={s.derivedHint}>Wie voll Karten im Schnitt sind</div>
        </div>
        <div style={s.derivedCard}>
          <div style={s.derivedValue}>{data.customersWithConsent}</div>
          <div style={s.derivedLabel}>Newsletter-Reichweite</div>
          <div style={s.derivedHint}>Kunden mit Marketing-Einwilligung</div>
        </div>
      </div>

      <div style={s.panel}>
        <div style={s.panelTitle}>Verlauf — letzte 30 Tage</div>
        <HistoryChart history={history} />
      </div>

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
    </div>
  )
}

function HistoryChart({ history }) {
  if (!history || history.length === 0) {
    return (
      <div style={s.empty}>
        Noch keine Verlaufsdaten. Ab jetzt wird jeder Scan erfasst — in den
        nächsten Tagen füllt sich diese Kurve.
      </div>
    )
  }

  const W = 640, H = 180, padX = 30, padY = 20
  const maxStamps = Math.max(...history.map(d => d.stamps), 1)
  const stepX = history.length > 1 ? (W - padX * 2) / (history.length - 1) : 0

  const points = history.map((d, i) => {
    const x = padX + i * stepX
    const y = H - padY - (d.stamps / maxStamps) * (H - padY * 2)
    return { x, y, ...d }
  })
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${H - padY} L ${points[0].x} ${H - padY} Z`

  const totalStamps = history.reduce((sum, d) => sum + d.stamps, 0)
  const totalRewards = history.reduce((sum, d) => sum + d.rewards, 0)

  return (
    <div>
      <div style={s.chartSummary}>
        <span><b>{totalStamps}</b> Stempel</span>
        <span><b>{totalRewards}</b> Belohnungen</span>
        <span style={{ color: '#aaa' }}>in {history.length} aktiven Tagen</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
        <defs>
          <linearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3C3489" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#3C3489" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#fillGrad)" />
        <path d={linePath} fill="none" stroke="#3C3489" strokeWidth="2.5"
          strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill="#3C3489" />
        ))}
        <text x={points[0].x} y={H - 4} fontSize="10" fill="#aaa" textAnchor="start">
          {fmtDate(history[0].date)}
        </text>
        <text x={points[points.length - 1].x} y={H - 4} fontSize="10" fill="#aaa" textAnchor="end">
          {fmtDate(history[history.length - 1].date)}
        </text>
      </svg>
    </div>
  )
}

function fmtDate(iso) {
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.`
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

  derivedGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 16 },
  derivedCard: { background: 'white', borderRadius: 12, padding: 18, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', textAlign: 'center' },
  derivedValue: { fontSize: 24, fontWeight: 800, color: '#3C3489' },
  derivedLabel: { fontSize: 13, fontWeight: 600, color: '#444', marginTop: 4 },
  derivedHint: { fontSize: 11, color: '#aaa', marginTop: 3 },

  panel: { background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 16 },
  panelTitle: { fontSize: 14, fontWeight: 700, color: '#1a1a1a', marginBottom: 16 },
  empty: { color: '#999', fontSize: 14, textAlign: 'center', padding: '20px 0' },

  chartSummary: { display: 'flex', gap: 20, fontSize: 13, color: '#555', marginBottom: 12 },

  cardRow: { padding: '12px 0', borderBottom: '1px solid #f0f0f0' },
  cardRowTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardName: { fontSize: 14, fontWeight: 600, color: '#1a1a1a' },
  cardCustomers: { fontSize: 13, fontWeight: 600, color: '#3C3489' },
  barTrack: { width: '100%', height: 8, background: '#f0eeff', borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  barFill: { height: '100%', background: '#3C3489', borderRadius: 4, transition: 'width 0.3s' },
  cardStats: { display: 'flex', gap: 16, fontSize: 12, color: '#666', flexWrap: 'wrap' },
}