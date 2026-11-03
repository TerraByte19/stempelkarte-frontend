import { useState } from 'react'
import api from '../api'

/**
 * 10er-Karte im Editor: Paketgroesse und Einheit (PUT /paket). Wirkt nur auf
 * kuenftige Aufladungen, bestehende Guthaben bleiben.
 */
export default function PaketSettings({ card, onSaved, t }) {
  const [groesse, setGroesse] = useState(card.rewardThreshold || 10)
  const [einheit, setEinheit] = useState(card.paketEinheit || '')
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState(null)

  async function speichern() {
    setBusy(true); setStatus(null)
    try {
      const r = await api.put(`/api/shop/cards/${card.id}/paket`, { groesse: Number(groesse), einheit })
      onSaved?.(r.data)
      setStatus('ok')
      setTimeout(() => setStatus(null), 2000)
    } catch (e) {
      setStatus(e.response?.data?.message || e.response?.data?.error || t('profil_save_error'))
    } finally { setBusy(false) }
  }

  return (
      <div style={{ marginBottom: 16 }}>
        <label style={s.label}>{t('cards_paket_groesse')}</label>
        <input style={s.input} type="number" min={1} max={100} value={groesse} onChange={e => setGroesse(e.target.value)} />
        <label style={{ ...s.label, marginTop: 12 }}>{t('cards_paket_einheit')}</label>
        <input style={s.input} value={einheit} maxLength={20} placeholder={t('cards_paket_einheit_ph')} onChange={e => setEinheit(e.target.value)} />
        <div style={s.fuss}>
          <button type="button" style={s.btn} onClick={speichern} disabled={busy}>{t('profil_save')}</button>
          {status === 'ok' && <span style={s.ok}>{t('cards_paket_saved')}</span>}
          {status && status !== 'ok' && <span style={s.err}>{status}</span>}
        </div>
        <div style={s.note}>{t('cards_paket_note')}</div>
      </div>
  )
}

const s = {
  label: { fontSize: 11, fontWeight: 800, color: '#888', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8, display: 'block' },
  input: { width: '100%', padding: '8px 12px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: 13, outline: 'none', boxSizing: 'border-box' },
  fuss: { display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 },
  btn: { background: '#f0eeff', color: '#3C3489', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  ok: { fontSize: 12, color: '#2d7a3e' },
  err: { fontSize: 12, color: '#b23b3b' },
  note: { fontSize: 11, color: '#999', marginTop: 6, lineHeight: 1.45 },
}
