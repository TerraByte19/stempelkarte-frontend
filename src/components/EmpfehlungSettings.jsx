import { useEffect, useState } from 'react'
import api from '../api'

/**
 * Kunde wirbt Kunde fuer eine Karte: Schalter, Bonus, Zahlen und die
 * besten Werber. Nur Stempel- und Punktekarten (sonst 400 vom Backend, der
 * Aufrufer zeigt den Block dann gar nicht). 404 = aelteres Backend.
 */
export default function EmpfehlungSettings({ cardId, cardType, t }) {
  const [stand, setStand] = useState(null)
  const [aktiv, setAktiv] = useState(false)
  const [bonus, setBonus] = useState(1)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState(null)

  useEffect(() => {
    setStand(null); setStatus(null)
    api.get(`/api/shop/cards/${cardId}/empfehlung`)
        .then(r => {
          if (!r.data || typeof r.data.aktiv !== 'boolean') { setStand(false); return }
          setStand(r.data); setAktiv(r.data.aktiv); setBonus(r.data.bonus ?? 1)
        })
        .catch(() => setStand(false))
  }, [cardId])

  if (!stand) return null

  async function speichern() {
    setBusy(true); setStatus(null)
    try {
      const r = await api.put(`/api/shop/cards/${cardId}/empfehlung`, { aktiv, bonus: Number(bonus) })
      setStand(r.data)
      setStatus('ok')
      setTimeout(() => setStatus(null), 2000)
    } catch (e) {
      setStatus(e.response?.data?.message || e.response?.data?.error || t('emp_err'))
    } finally { setBusy(false) }
  }

  const einheit = cardType === 'POINTS' ? t('emp_bonus_unit_points') : t('emp_bonus_unit_stamp')

  return (
      <div style={s.card}>
        <div style={s.titel}>👥 {t('emp_title')}</div>
        <p style={s.hint}>{t('emp_hint')}</p>
        <label style={s.schalterZeile}>
          <input type="checkbox" checked={aktiv} onChange={e => setAktiv(e.target.checked)} />
          <span>{t('emp_on')}</span>
        </label>
        <label style={s.bonusZeile}>
          <span>{t('emp_bonus')}</span>
          <input type="number" min={1} max={10} value={bonus} onChange={e => setBonus(e.target.value)} style={s.input} />
          <span style={{ color: '#888' }}>{einheit}</span>
        </label>
        <div style={s.fuss}>
          <button type="button" style={s.btn} onClick={speichern} disabled={busy}>{t('emp_save')}</button>
          {status === 'ok' && <span style={s.ok}>{t('emp_saved')}</span>}
          {status && status !== 'ok' && <span style={s.err}>{status}</span>}
        </div>
        <div style={s.zahlen}>{t('emp_stats', { geworben: stand.geworben ?? 0, belohnt: stand.belohnt ?? 0 })}</div>
        {Array.isArray(stand.top) && stand.top.length > 0 && (
            <div style={s.top}>
              <div style={s.topTitel}>{t('emp_top')}</div>
              {stand.top.map((w, i) => (
                  <div key={i} style={s.topZeile}><span>{w.name}</span><b>{w.anzahl}</b></div>
              ))}
            </div>
        )}
      </div>
  )
}

const s = {
  card: { background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  titel: { fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 },
  hint: { fontSize: 12, color: '#888', margin: '0 0 12px', lineHeight: 1.5 },
  schalterZeile: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: '#1a1a1a', marginBottom: 10, cursor: 'pointer' },
  bonusZeile: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#1a1a1a' },
  input: { width: 70, padding: '8px 10px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: 13 },
  fuss: { display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 },
  btn: { background: '#3C3489', color: 'white', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  ok: { fontSize: 12, color: '#2d7a3e' },
  err: { fontSize: 12, color: '#b23b3b' },
  zahlen: { fontSize: 12, color: '#666', marginTop: 12 },
  top: { marginTop: 8, borderTop: '1px solid #f0f0f0', paddingTop: 8 },
  topTitel: { fontSize: 11, color: '#999', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 },
  topZeile: { display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '3px 0' },
}
