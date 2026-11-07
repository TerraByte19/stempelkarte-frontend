import { useEffect, useState } from 'react'
import api from '../api'
import { useLang } from '../LangContext'
import Icon from './Icon'

const ZITAT_MAX = 320

/**
 * "Deine Stimme fuer die Stampit-Website": der Laden schreibt ein bis drei
 * Saetze, bestaetigt, dass sie mit Ladenname und Ort auf stampit-app.de
 * stehen duerfen, und reicht ein. Der Admin gibt frei. Jede Aenderung
 * wartet wieder auf Freigabe - der Status steht immer dabei.
 */
export default function StimmeSection() {
  const { t } = useLang()
  const [stand, setStand] = useState(null)        // null = laedt
  const [zitat, setZitat] = useState('')
  const [person, setPerson] = useState('')
  const [ort, setOrt] = useState('')
  const [einverstanden, setEinverstanden] = useState(false)
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/api/shop/stimme')
        .then(r => uebernehmen(r.data))
        .catch(() => setStand({}))
  }, [])

  function uebernehmen(d) {
    setStand(d || {})
    setZitat(d?.zitat || '')
    setPerson(d?.person || '')
    setOrt(d?.ort || '')
    // Eingereicht heisst: der Haken war gesetzt. Beim Aendern muss er trotzdem
    // bewusst neu gesetzt werden - der Text ist ja ein anderer.
    setEinverstanden(false)
  }

  async function einreichen(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const r = await api.put('/api/shop/stimme', { zitat, person, ort, einverstanden })
      uebernehmen(r.data)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err.response?.data?.error || t('profil_save_error'))
    } finally {
      setBusy(false)
    }
  }

  async function zurueckziehen() {
    if (!confirm(t('stimme_withdraw_confirm'))) return
    setError('')
    setBusy(true)
    try {
      await api.delete('/api/shop/stimme')
      uebernehmen({})
    } catch (err) {
      setError(err.response?.data?.error || t('profil_save_error'))
    } finally {
      setBusy(false)
    }
  }

  if (stand === null) return null

  const status = stand.status || null
  const geaendert = zitat !== (stand.zitat || '') || person !== (stand.person || '') || ort !== (stand.ort || '')
  const statusText = status === 'FREIGEGEBEN' ? t('stimme_status_frei')
      : status === 'ABGELEHNT' ? t('stimme_status_abgelehnt')
      : status === 'OFFEN' ? t('stimme_status_offen') : null
  const statusStyle = status === 'FREIGEGEBEN' ? s.statusFrei
      : status === 'ABGELEHNT' ? s.statusAbgelehnt : s.statusOffen

  return (
      <div style={s.card}>
        <h2 style={s.cardTitle}>{t('stimme_title')}</h2>
        <p style={{ ...s.hint, margin: '0 0 16px' }}>{t('stimme_hint')}</p>

        {statusText && <div style={{ ...s.status, ...statusStyle }}>{statusText}</div>}
        {saved && (
            <div style={{ ...s.success, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Icon name="check" size={15} strokeWidth={2.4} />{t('stimme_saved')}
            </div>
        )}
        {error && <div style={s.errorBox}>{error}</div>}

        <form onSubmit={einreichen}>
          <label style={s.label} htmlFor="stimme-zitat">{t('stimme_zitat')}</label>
          <textarea id="stimme-zitat" style={s.textarea} rows={4} maxLength={ZITAT_MAX} value={zitat}
                    onChange={e => setZitat(e.target.value)} placeholder={t('stimme_zitat_ph')} required />
          <div style={s.counter}>{t('stimme_chars', { n: zitat.length })}</div>

          <div style={s.row}>
            <div style={{ flex: 1, minWidth: 180 }}>
              <label style={s.label} htmlFor="stimme-person">{t('stimme_person')}</label>
              <input id="stimme-person" style={s.input} maxLength={100} value={person}
                     onChange={e => setPerson(e.target.value)} placeholder={t('stimme_person_ph')} />
            </div>
            <div style={{ flex: 1, minWidth: 180 }}>
              <label style={s.label} htmlFor="stimme-ort">{t('stimme_ort')}</label>
              <input id="stimme-ort" style={s.input} maxLength={80} value={ort}
                     onChange={e => setOrt(e.target.value)} placeholder={t('stimme_ort_ph')} required />
            </div>
          </div>

          <label style={s.consentRow}>
            <input type="checkbox" checked={einverstanden} onChange={e => setEinverstanden(e.target.checked)} required />
            <span style={s.consentText}>{t('stimme_consent')}</span>
          </label>

          <div style={s.buttons}>
            <button style={s.btnPrimary} type="submit" disabled={busy || !einverstanden || (status && !geaendert)}>
              {busy ? t('profil_saving') : status ? t('stimme_update') : t('stimme_submit')}
            </button>
            {status && (
                <button style={s.btnDanger} type="button" onClick={zurueckziehen} disabled={busy}>
                  {t('stimme_withdraw')}
                </button>
            )}
          </div>
        </form>
      </div>
  )
}

const s = {
  card: { background: 'white', borderRadius: 12, padding: 20, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  cardTitle: { fontSize: 16, fontWeight: 600, margin: '0 0 16px', color: '#1a1a1a' },
  hint: { fontSize: 13, color: '#888', margin: '12px 0 0' },
  success: { background: '#f0fff4', color: '#2C5F2E', padding: '10px 14px', borderRadius: 8, fontSize: 14, marginBottom: 14 },
  errorBox: { background: '#fff0f0', color: '#c00', padding: 10, borderRadius: 8, fontSize: 14, marginBottom: 12 },
  status: { padding: '10px 14px', borderRadius: 8, fontSize: 14, marginBottom: 14, fontWeight: 500 },
  statusOffen: { background: '#FBF3E2', color: '#7A5200' },
  statusFrei: { background: '#f0fff4', color: '#2C5F2E' },
  statusAbgelehnt: { background: '#fff0f0', color: '#A32015' },
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 6 },
  input: { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 12 },
  textarea: { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: 14, outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.45 },
  counter: { fontSize: 12, color: '#888', textAlign: 'end', margin: '4px 0 12px' },
  row: { display: 'flex', gap: 12, flexWrap: 'wrap' },
  consentRow: { display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', marginTop: 4 },
  consentText: { fontSize: 14, color: '#1a1a1a', lineHeight: 1.4 },
  buttons: { display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' },
  btnPrimary: { background: '#3C3489', color: 'white', border: 'none', borderRadius: 10, padding: '12px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', flex: 1, minWidth: 160 },
  btnDanger: { background: '#FBEDEB', color: '#A32015', border: 'none', borderRadius: 10, padding: '12px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
}
