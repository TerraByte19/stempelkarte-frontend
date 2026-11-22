import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import api from '../../api'
import { useLang, localeTag } from '../../LangContext'

/**
 * Unterkonto: die Scanner-Geraete der EIGENEN Filiale. Das Backend kennt
 * die Filiale aus dem Login und gibt nur deren Geraete heraus. In der
 * Adresse steht die Kennung des Geraets, nie sein Token.
 */
const ROLLEN = ['MITARBEITER', 'AUSHILFE', 'KIOSK']

export default function FilialeGeraete() {
  const { t, lang } = useLang()
  const [geraete, setGeraete] = useState(null)
  const [name, setName] = useState('')
  const [rolle, setRolle] = useState('MITARBEITER')
  const [fehler, setFehler] = useState('')
  const [qrOffen, setQrOffen] = useState(null)
  const [laeuft, setLaeuft] = useState(false)

  function laden() {
    api.get('/api/filiale/geraete')
        .then(r => setGeraete(Array.isArray(r.data) ? r.data : []))
        .catch(() => { setGeraete([]); setFehler(t('kette_ladefehler')) })
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { laden() }, [])

  function meldung(err) {
    return err?.response?.data?.error || t('kette_fehler')
  }

  async function anlegen(e) {
    e.preventDefault()
    if (!name.trim() || laeuft) return
    setLaeuft(true)
    setFehler('')
    try {
      const r = await api.post('/api/filiale/geraete', { label: name, rolle })
      setName('')
      setQrOffen(r.data?.kennung || null)
      laden()
    } catch (err) {
      setFehler(meldung(err))
    } finally {
      setLaeuft(false)
    }
  }

  async function rolleAendern(g, neu) {
    setFehler('')
    try {
      await api.put(`/api/filiale/geraete/${g.kennung}`, { rolle: neu })
      laden()
    } catch (err) { setFehler(meldung(err)) }
  }

  async function entfernen(g) {
    if (!window.confirm(t('kette_ger_remove_confirm', { name: g.label }))) return
    setFehler('')
    try {
      await api.delete(`/api/filiale/geraete/${g.kennung}`)
      laden()
    } catch (err) { setFehler(meldung(err)) }
  }

  function datum(iso) {
    try { return new Date(iso).toLocaleDateString(localeTag(lang), { day: '2-digit', month: '2-digit', year: 'numeric' }) }
    catch { return '' }
  }

  // Derselbe Aufbau wie beim Inhaber: die Anmeldeseite liest "token=" aus dem gescannten Code.
  const link = g => `${window.location.origin}/scanner-setup?token=${encodeURIComponent(g.token)}&label=${encodeURIComponent(g.label)}`

  return (
      <div style={s.page}>
        <h1 style={s.title}>{t('kette_ger_title')}</h1>
        <p style={s.subtitle}>{t('kette_ger_hint')}</p>
        {fehler && <div style={s.fehler}>{fehler}</div>}

        <div style={s.card}>
          {geraete === null ? <p style={s.leer}>{t('common_loading')}</p>
              : geraete.length === 0 ? <p style={s.leer}>{t('kette_ger_leer')}</p>
              : geraete.map(g => (
                  <div key={g.kennung} style={s.zeile}>
                    <div style={s.kopf}>
                      <div style={{ minWidth: 0 }}>
                        <div style={s.name}>{g.label}</div>
                        <div style={s.meta}>{g.zuletzt ? t('kette_ger_zuletzt', { datum: datum(g.zuletzt) }) : t('kette_ger_nie')}</div>
                      </div>
                      <select value={g.rolle} onChange={e => rolleAendern(g, e.target.value)} style={s.select}>
                        {ROLLEN.map(r => <option key={r} value={r}>{t(`kette_rolle_${r}`)}</option>)}
                      </select>
                    </div>
                    <div style={s.knoepfe}>
                      <button type="button" style={s.btn} onClick={() => setQrOffen(qrOffen === g.kennung ? null : g.kennung)}>
                        {qrOffen === g.kennung ? t('kette_ger_qr_zu') : t('kette_ger_qr')}
                      </button>
                      <button type="button" style={{ ...s.btn, color: '#c0392b' }} onClick={() => entfernen(g)}>
                        {t('kette_ger_remove')}
                      </button>
                    </div>
                    {qrOffen === g.kennung && (
                        <div style={s.qr}>
                          <QRCodeSVG value={link(g)} size={180} />
                          <p style={s.qrHinweis}>{t('kette_ger_qr_hint')}</p>
                        </div>
                    )}
                  </div>
              ))}
        </div>

        <form onSubmit={anlegen} style={s.card}>
          <input style={s.input} value={name} maxLength={40} placeholder={t('kette_ger_name')}
                 onChange={e => setName(e.target.value)} />
          <select value={rolle} onChange={e => setRolle(e.target.value)} style={{ ...s.select, width: '100%', marginTop: 8 }}>
            {ROLLEN.map(r => <option key={r} value={r}>{t(`kette_rolle_${r}`)}</option>)}
          </select>
          <button type="submit" style={s.primaer} disabled={laeuft || !name.trim()}>{t('kette_ger_add')}</button>
        </form>
      </div>
  )
}

const s = {
  page: { maxWidth: 620, margin: '0 auto' },
  title: { fontSize: 24, fontWeight: 700, margin: '0 0 4px', color: '#1a1a1a' },
  subtitle: { fontSize: 14, color: '#888', margin: '0 0 20px', lineHeight: 1.5 },
  fehler: { background: '#fff0f0', color: '#d00', padding: '10px 14px', borderRadius: 8, fontSize: 14, marginBottom: 12 },
  card: { background: 'white', borderRadius: 12, padding: 20, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  leer: { fontSize: 14, color: '#888', margin: 0 },
  zeile: { padding: '12px 0', borderTop: '1px solid #f0f0f0' },
  kopf: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  name: { fontSize: 15, fontWeight: 600, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis' },
  meta: { fontSize: 12, color: '#999' },
  select: { padding: '7px 8px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: 13, background: 'white', fontFamily: 'inherit', maxWidth: 190 },
  knoepfe: { display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' },
  btn: { padding: '7px 12px', borderRadius: 8, border: '1.5px solid #e0e0e0', background: 'white', color: '#3C3489', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  qr: { marginTop: 12, textAlign: 'center' },
  qrHinweis: { fontSize: 13, color: '#666', lineHeight: 1.5, margin: '10px 0 0' },
  input: { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: 15, boxSizing: 'border-box', fontFamily: 'inherit' },
  primaer: { width: '100%', padding: 12, background: '#3C3489', color: 'white', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 10, fontFamily: 'inherit' },
}
