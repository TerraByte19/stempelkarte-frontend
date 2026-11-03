import { useEffect, useRef, useState } from 'react'
import api from '../api'

/**
 * Aufkleber fuer Liefertueten: Vorschau (einzelner Aufkleber) und Bogen als
 * A4-PNG. Das Bild liegt hinter dem Shop-Login, deshalb per Abruf mit Token
 * und Blob-URL statt <img src>.
 */
export default function AufkleberSettings({ cardId, t }) {
  const [titel, setTitel] = useState('')
  const [zeile, setZeile] = useState('')
  const [groesse, setGroesse] = useState('KLEIN')
  const [vorschau, setVorschau] = useState(null)
  const [busy, setBusy] = useState(false)
  const [fehler, setFehler] = useState('')
  const timer = useRef(null)

  async function holen(params) {
    const r = await api.get(`/api/shop/cards/${cardId}/aufkleber`, { params, responseType: 'blob' })
    return URL.createObjectURL(r.data)
  }

  // Vorschau mit kurzer Pause nach dem Tippen neu laden.
  useEffect(() => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      holen({ titel, zeile, einzeln: true })
          .then(url => { setVorschau(alt => { if (alt) URL.revokeObjectURL(alt); return url }); setFehler('') })
          .catch(() => setVorschau(false))
    }, 400)
    return () => clearTimeout(timer.current)
  }, [cardId, titel, zeile])  // eslint-disable-line react-hooks/exhaustive-deps

  if (vorschau === false) return null

  async function laden(einzeln) {
    setBusy(true); setFehler('')
    try {
      const url = await holen({ titel, zeile, groesse, einzeln })
      const a = document.createElement('a')
      a.href = url
      a.download = einzeln ? `aufkleber-${cardId}.png` : `aufkleber-bogen-${groesse.toLowerCase()}-${cardId}.png`
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 10000)
    } catch {
      setFehler(t('aufk_err'))
    } finally { setBusy(false) }
  }

  return (
      <div style={s.card}>
        <div style={s.titel}>🏷️ {t('aufk_title')}</div>
        <p style={s.hint}>{t('aufk_hint')}</p>
        <div style={s.reihe}>
          <div style={s.felder}>
            <label style={s.label}>{t('aufk_titel')}
              <input style={s.input} value={titel} maxLength={30} placeholder="Stempel sammeln!" onChange={e => setTitel(e.target.value)} />
            </label>
            <label style={s.label}>{t('aufk_zeile')}
              <input style={s.input} value={zeile} maxLength={70} placeholder="QR-Code scannen und die Karte aufs Handy holen" onChange={e => setZeile(e.target.value)} />
            </label>
            <label style={s.label}>{t('aufk_groesse')}
              <select style={s.input} value={groesse} onChange={e => setGroesse(e.target.value)}>
                <option value="KLEIN">{t('aufk_klein')}</option>
                <option value="GROSS">{t('aufk_gross')}</option>
              </select>
            </label>
            <div style={s.btnReihe}>
              <button type="button" style={s.btn} onClick={() => laden(false)} disabled={busy}>{t('aufk_download')}</button>
              <button type="button" style={s.btnSekundaer} onClick={() => laden(true)} disabled={busy}>{t('aufk_single')}</button>
            </div>
            {fehler && <div style={s.err}>{fehler}</div>}
          </div>
          <div style={s.vorschau}>
            <div style={s.vorschauLabel}>{t('aufk_preview')}</div>
            {vorschau ? <img src={vorschau} alt="" style={s.bild} /> : <div style={s.platzhalter} />}
          </div>
        </div>
      </div>
  )
}

const s = {
  card: { background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  titel: { fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 },
  hint: { fontSize: 12, color: '#888', margin: '0 0 12px', lineHeight: 1.5 },
  reihe: { display: 'flex', gap: 16, flexWrap: 'wrap' },
  felder: { flex: '1 1 220px', display: 'flex', flexDirection: 'column', gap: 10 },
  label: { display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, fontWeight: 600, color: '#555' },
  input: { width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: 13, fontWeight: 400, background: 'white' },
  btnReihe: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  btn: { background: '#3C3489', color: 'white', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  btnSekundaer: { background: '#f0eeff', color: '#3C3489', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  err: { fontSize: 12, color: '#b23b3b' },
  vorschau: { flex: '0 0 180px', textAlign: 'center' },
  vorschauLabel: { fontSize: 11, color: '#999', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 },
  bild: { width: 180, height: 180, borderRadius: 10, border: '1px solid #eee' },
  platzhalter: { width: 180, height: 180, borderRadius: 10, background: '#f5f5f7' },
}
