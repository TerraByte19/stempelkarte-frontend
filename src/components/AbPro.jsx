import { useLang } from '../LangContext'
import { useTarif } from '../tarif'

/**
 * Zeigt die Sektion nur, wenn der Tarif die Funktion hat. Sonst eine
 * schlichte Karte "Ab Pro". Solange der Tarif laedt (oder nicht geladen
 * werden kann), steht die Sektion normal da: gesperrt wird im Backend.
 * Gespeicherte Einstellungen gehen dabei nicht verloren und laufen nach
 * dem Wechsel auf Pro weiter.
 */
export default function AbPro({ funktion, titel, children }) {
  const { t } = useLang()
  const stand = useTarif()
  if (!stand || stand.funktionen?.[funktion] !== false) return children
  return (
      <div style={s.card}>
        <div style={s.kopf}>
          <h2 style={s.title}>{titel}</h2>
          <span style={s.badge}>{t('tarif_ab_pro')}</span>
        </div>
        <p style={s.text}>{t('tarif_lock_body')}</p>
      </div>
  )
}

const s = {
  card: { background: 'white', borderRadius: 12, padding: 20, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  kopf: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  title: { fontSize: 16, fontWeight: 600, margin: 0, color: '#1a1a1a' },
  badge: { fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 999, background: '#eef2ff', color: '#3C3489', whiteSpace: 'nowrap' },
  text: { fontSize: 14, color: '#666', margin: '8px 0 0', lineHeight: 1.5 },
}
