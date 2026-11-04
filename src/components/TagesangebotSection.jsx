import { useEffect, useState } from 'react'
import api from '../api'
import { useLang, localeTag } from '../LangContext'

const TEXT_MAX = 80

/**
 * Tagesangebot: ein Satz, der heute auf allen Karten steht (Apple-Rueckseite,
 * Google-Baustein) und beim Setzen als Kampagne rausgeht. Ein aelteres
 * Backend kennt den Endpunkt nicht - dann bleibt der Block unsichtbar.
 */
export default function TagesangebotSection() {
  const { t, lang } = useLang()
  const [stand, setStand] = useState(null)      // null = laedt, false = kein Endpunkt
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [meldung, setMeldung] = useState(null)

  function laden() {
    api.get('/api/shop/tagesangebot')
        .then(r => setStand(r.data && typeof r.data === 'object' ? r.data : false))
        .catch(() => setStand(false))
  }
  useEffect(laden, [])

  if (stand === null || stand === false) return null

  async function setzen() {
    const roh = text.trim()
    if (!roh) return
    if (roh.length > TEXT_MAX) return setMeldung({ fehler: true, text: t('tag_max') })
    setBusy(true); setMeldung(null)
    try {
      const r = await api.put('/api/shop/tagesangebot', { text: roh })
      setStand(r.data)
      setText('')
      setMeldung({ text: t('tag_sent', { n: r.data?.empfaenger ?? 0 }) })
    } catch (e) {
      setMeldung({ fehler: true, text: e.response?.data?.message || e.response?.data?.error || t('tag_err') })
    } finally { setBusy(false) }
  }

  async function entfernen() {
    setBusy(true); setMeldung(null)
    try {
      await api.delete('/api/shop/tagesangebot')
      laden()
    } catch {
      setMeldung({ fehler: true, text: t('tag_err') })
    } finally { setBusy(false) }
  }

  function bisText(iso) {
    try {
      return new Date(iso).toLocaleTimeString(localeTag(lang),
          { hour: '2-digit', minute: '2-digit' })
    } catch { return '' }
  }

  return (
      <div style={s.card}>
        <h2 style={s.title}>🕒 {t('tag_title')}</h2>
        <p style={s.hint}>{t('tag_hint')}</p>
        {stand.aktiv ? (
            <div style={s.aktiv}>
              <div style={s.aktivText}>„{stand.text}“</div>
              <div style={s.aktivMeta}>{t('tag_active', { bis: bisText(stand.bis) })}</div>
              <button type="button" style={s.btnSekundaer} onClick={entfernen} disabled={busy}>{t('tag_remove')}</button>
            </div>
        ) : (
            <div style={s.leer}>{t('tag_none')}</div>
        )}
        <div style={s.reihe}>
          <input value={text} onChange={e => setText(e.target.value)} maxLength={TEXT_MAX}
                 placeholder={t('tag_ph')} style={s.input} />
          <button type="button" style={s.btn} onClick={setzen} disabled={busy || !text.trim()}>{t('tag_set')}</button>
        </div>
        <div style={s.zaehler}>{text.length}/{TEXT_MAX}</div>
        {meldung && <div style={{ ...s.meldung, color: meldung.fehler ? '#b23b3b' : '#2d7a3e' }}>{meldung.text}</div>}
      </div>
  )
}

const s = {
  card: { background: 'white', borderRadius: 12, padding: 24, marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  title: { fontSize: 16, fontWeight: 600, margin: '0 0 6px', color: '#1a1a1a' },
  hint: { fontSize: 13, color: '#888', margin: '0 0 14px', lineHeight: 1.5 },
  aktiv: { background: '#f0eeff', borderRadius: 10, padding: '12px 14px', marginBottom: 14 },
  aktivText: { fontSize: 15, fontWeight: 600, color: '#1a1a1a' },
  aktivMeta: { fontSize: 12, color: '#666', margin: '4px 0 10px' },
  leer: { fontSize: 13, color: '#999', marginBottom: 12 },
  reihe: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  input: { flex: 1, minWidth: 220, padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e0e0e0', fontSize: 14 },
  btn: { background: '#3C3489', color: 'white', border: 'none', borderRadius: 10, padding: '10px 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  btnSekundaer: { background: 'white', color: '#3C3489', border: '1.5px solid #c9c4ee', borderRadius: 8, padding: '7px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  zaehler: { fontSize: 11, color: '#aaa', marginTop: 4, textAlign: 'right' },
  meldung: { fontSize: 13, marginTop: 8 },
}
