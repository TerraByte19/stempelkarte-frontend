import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import { useLang } from '../LangContext'
import { GRUPPEN, GRUPPEN_FARBEN } from '../kundengruppen'

/**
 * Kundengruppen fuers Dashboard: fuenf Zahlen, jede ein Link in die
 * gefilterte Kundenliste. Ein aelteres Backend kennt den Endpunkt nicht
 * (404), ein leerer Laden hat nur Nullen - beides bleibt unsichtbar.
 */
export default function KundengruppenSection() {
  const { t } = useLang()
  const [zahlen, setZahlen] = useState(null)

  useEffect(() => {
    api.get('/api/shop/kunden/gruppen')
        .then(r => setZahlen(r.data?.zahlen && typeof r.data.zahlen === 'object' ? r.data.zahlen : null))
        .catch(() => setZahlen(null))
  }, [])

  if (!zahlen) return null
  const gesamt = GRUPPEN.reduce((sum, g) => sum + (Number(zahlen[g]) || 0), 0)
  if (gesamt === 0) return null

  return (
      <div style={s.card}>
        <h2 style={s.title}>{t('dash_gruppen_title')}</h2>
        <div style={s.reihe}>
          {GRUPPEN.map(g => (
              <Link key={g} to={`/kunden?gruppe=${g}`} style={{ ...s.kachel, ...GRUPPEN_FARBEN[g] }}>
                <span style={s.zahl}>{Number(zahlen[g]) || 0}</span>
                <span style={s.name}>{t(`kunden_gruppe_${g}`)}</span>
              </Link>
          ))}
        </div>
        <p style={s.hint}>{t('dash_gruppen_hint')}</p>
      </div>
  )
}

const s = {
  card: { background: 'white', borderRadius: 12, padding: 24, marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  title: { fontSize: 16, fontWeight: 600, margin: '0 0 12px', color: '#1a1a1a' },
  reihe: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10 },
  kachel: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '12px 8px', borderRadius: 10, textDecoration: 'none' },
  zahl: { fontSize: 22, fontWeight: 700, lineHeight: 1.1 },
  name: { fontSize: 12, fontWeight: 600 },
  hint: { fontSize: 12, color: '#999', margin: '10px 0 0' },
}
