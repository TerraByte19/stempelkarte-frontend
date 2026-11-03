import { useEffect, useState } from 'react'
import api from '../api'

/**
 * Stufen (Bronze, Silber, Gold nach Besuchen) einer Karte. Laedt den Stand
 * selbst (GET /stufen), speichert mit PUT. Ein aelteres Backend kennt die
 * Route nicht (404) - dann bleibt der Block weg. Punktekarten: nicht moeglich.
 */
export default function StufenSettings({ cardId, t }) {
  const [stand, setStand] = useState(null)
  const [form, setForm] = useState(null)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState(null)   // 'ok' | Fehlertext

  useEffect(() => {
    setStand(null); setForm(null); setStatus(null)
    api.get(`/api/shop/cards/${cardId}/stufen`)
        .then(r => {
          const d = r.data
          if (!d || !Array.isArray(d.stufen)) { setStand(false); return }
          setStand(d)
          const [s1, s2, s3] = d.stufen
          setForm({ aktiv: !!d.aktiv, stufe1Name: s1?.name || '', stufe2Name: s2?.name || '', stufe2Ab: s2?.ab ?? 10,
                    stufe3Name: s3?.name || '', stufe3Ab: s3?.ab ?? 25 })
        })
        .catch(() => setStand(false))
  }, [cardId])

  if (!stand || !form) return null

  async function speichern() {
    setBusy(true); setStatus(null)
    try {
      const r = await api.put(`/api/shop/cards/${cardId}/stufen`, {
        ...form, stufe2Ab: Number(form.stufe2Ab), stufe3Ab: Number(form.stufe3Ab),
      })
      setStand(r.data)
      setStatus('ok')
      setTimeout(() => setStatus(null), 2000)
    } catch (e) {
      setStatus(e.response?.data?.message || e.response?.data?.error || t('stufen_err'))
    } finally { setBusy(false) }
  }

  const zahl = i => stand.stufen?.[i]?.anzahl ?? 0

  return (
      <div style={s.card}>
        <div style={s.titel}>🏅 {t('stufen_title')}</div>
        <p style={s.hint}>{t('stufen_hint')}</p>
        {!stand.moeglich ? (
            <p style={s.hint}>{t('stufen_not_possible')}</p>
        ) : (
            <>
              <label style={s.schalterZeile}>
                <input type="checkbox" checked={form.aktiv} onChange={e => setForm({ ...form, aktiv: e.target.checked })} />
                <span>{t('stufen_on')}</span>
              </label>
              <div style={s.tabelle}>
                <div style={s.kopf}><span>{t('stufen_name')}</span><span>{t('stufen_ab')}</span><span></span></div>
                <div style={s.zeile}>
                  <input style={s.input} value={form.stufe1Name} maxLength={20} placeholder="Bronze"
                         onChange={e => setForm({ ...form, stufe1Name: e.target.value })} />
                  <span style={s.fest}>0</span>
                  <span style={s.zahl}>{t('stufen_count', { n: zahl(0) })}</span>
                </div>
                <div style={s.zeile}>
                  <input style={s.input} value={form.stufe2Name} maxLength={20} placeholder="Silber"
                         onChange={e => setForm({ ...form, stufe2Name: e.target.value })} />
                  <input style={s.input} type="number" min={1} max={1000} value={form.stufe2Ab}
                         onChange={e => setForm({ ...form, stufe2Ab: e.target.value })} />
                  <span style={s.zahl}>{t('stufen_count', { n: zahl(1) })}</span>
                </div>
                <div style={s.zeile}>
                  <input style={s.input} value={form.stufe3Name} maxLength={20} placeholder="Gold"
                         onChange={e => setForm({ ...form, stufe3Name: e.target.value })} />
                  <input style={s.input} type="number" min={2} max={1000} value={form.stufe3Ab}
                         onChange={e => setForm({ ...form, stufe3Ab: e.target.value })} />
                  <span style={s.zahl}>{t('stufen_count', { n: zahl(2) })}</span>
                </div>
              </div>
              <div style={s.fuss}>
                <button type="button" style={s.btn} onClick={speichern} disabled={busy}>{t('stufen_save')}</button>
                {status === 'ok' && <span style={s.ok}>{t('stufen_saved')}</span>}
                {status && status !== 'ok' && <span style={s.err}>{status}</span>}
              </div>
            </>
        )}
      </div>
  )
}

const s = {
  card: { background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  titel: { fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 },
  hint: { fontSize: 12, color: '#888', margin: '0 0 12px', lineHeight: 1.5 },
  schalterZeile: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: '#1a1a1a', marginBottom: 12, cursor: 'pointer' },
  tabelle: { display: 'flex', flexDirection: 'column', gap: 8 },
  kopf: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 8, fontSize: 11, color: '#999', textTransform: 'uppercase', letterSpacing: 0.4 },
  zeile: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 8, alignItems: 'center' },
  input: { width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: 13 },
  fest: { fontSize: 13, color: '#888', paddingInlineStart: 10 },
  zahl: { fontSize: 12, color: '#3C3489', fontWeight: 600 },
  fuss: { display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 },
  btn: { background: '#3C3489', color: 'white', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  ok: { fontSize: 12, color: '#2d7a3e' },
  err: { fontSize: 12, color: '#b23b3b' },
}
