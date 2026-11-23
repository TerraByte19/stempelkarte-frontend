import { useEffect, useState } from 'react'
import api from '../api'
import { useTarif } from '../tarif'
import NfcSettings from './NfcSettings'

/**
 * NFC im Karten-Editor. Tarif Kette: NFC-Karten je Filiale, jede mit eigenem
 * Link und Namen - so steht jeder NFC-Stempel in der richtigen Filiale.
 * Alle anderen Laeden: der eine Link je Stempelkarte wie bisher (NfcSettings).
 */
export default function NfcFilialen({ cardId, t }) {
  const tarif = useTarif()
  if (tarif?.tarif !== 'KETTE') return <NfcSettings cardId={cardId} t={t} />
  return <Liste cardId={cardId} t={t} />
}

function Liste({ cardId, t }) {
  const [tags, setTags] = useState(null)
  const [orte, setOrte] = useState(null)
  const [name, setName] = useState('')
  const [ort, setOrt] = useState('')
  const [fehler, setFehler] = useState('')
  const [laeuft, setLaeuft] = useState(false)
  const [kopiert, setKopiert] = useState(null)

  useEffect(() => {
    let aktuell = true
    api.get(`/api/shop/cards/${cardId}/nfc-tags`)
        .then(r => { if (aktuell) setTags(Array.isArray(r.data) ? r.data : []) })
        .catch(() => { if (aktuell) { setTags([]); setFehler(t('kette_nfc_ladefehler')) } })
    api.get('/api/shop/me/orte')
        .then(r => { if (aktuell) setOrte(r.data) })
        .catch(() => {})
    return () => { aktuell = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardId])

  const waehlbar = orte ? [
    ...(orte.hauptIstFiliale ? [{ id: 'HAUPT', label: t('kette_karte_haupt') }] : []),
    ...(Array.isArray(orte.orte) ? orte.orte : []).map(o => ({ id: o.id, label: o.label })),
  ] : []
  const gewaehlt = ort || waehlbar[0]?.id || ''

  const meldung = e => e?.response?.data?.error || t('kette_fehler')

  async function anlegen(e) {
    e.preventDefault()
    if (!name.trim() || !gewaehlt || laeuft) return
    setLaeuft(true); setFehler('')
    try {
      const r = await api.post(`/api/shop/cards/${cardId}/nfc-tags`, { label: name.trim(), ortId: gewaehlt })
      setTags(liste => [...(liste || []), r.data])
      setName('')
    } catch (err) {
      setFehler(meldung(err))
    } finally {
      setLaeuft(false)
    }
  }

  async function sperre(tag) {
    setFehler('')
    try {
      const r = await api.put(`/api/shop/cards/${cardId}/nfc-tags/${tag.id}/sperre`, { gesperrt: !tag.gesperrt })
      setTags(liste => liste.map(x => x.id === tag.id ? r.data : x))
    } catch (err) {
      setFehler(meldung(err))
    }
  }

  async function entfernen(tag) {
    if (!confirm(t('kette_nfc_loeschen_frage', { name: tag.label }))) return
    setFehler('')
    try {
      await api.delete(`/api/shop/cards/${cardId}/nfc-tags/${tag.id}`)
      setTags(liste => liste.filter(x => x.id !== tag.id))
    } catch (err) {
      setFehler(meldung(err))
    }
  }

  async function kopieren(tag) {
    try {
      await navigator.clipboard.writeText(tag.url)
      setKopiert(tag.id)
      setTimeout(() => setKopiert(null), 2500)
    } catch {
      // Zwischenablage gesperrt: der Link steht im Feld und laesst sich markieren.
    }
  }

  return (
      <div style={s.card}>
        <div style={s.titel}>📶 {t('kette_nfc_title')}</div>
        <p style={s.hint}>{t('kette_nfc_hint')}</p>

        {tags === null ? <p style={s.hint}>{t('common_loading')}</p>
            : tags.length === 0 ? <p style={s.hint}>{t('kette_nfc_leer')}</p>
            : tags.map(tag => (
                <div key={tag.id} style={{ ...s.zeile, opacity: tag.gesperrt ? 0.6 : 1 }}>
                  <div style={s.kopf}>
                    <span>
                      <span style={s.name}>{tag.label}</span>
                      <span style={s.ort}>{tag.ortLabel}{tag.gesperrt ? ` · ${t('kette_nfc_gesperrt')}` : ''}</span>
                    </span>
                    <span style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button type="button" style={s.klein} onClick={() => kopieren(tag)}>
                        {kopiert === tag.id ? t('nfc_copied') : t('nfc_copy')}
                      </button>
                      <button type="button" style={s.klein} onClick={() => sperre(tag)}>
                        {tag.gesperrt ? t('kette_nfc_freigeben') : t('kette_nfc_sperren')}
                      </button>
                      <button type="button" style={{ ...s.klein, color: '#b3261e' }} onClick={() => entfernen(tag)}>
                        {t('common_delete')}
                      </button>
                    </span>
                  </div>
                  <input style={s.input} value={tag.url} readOnly dir="ltr" onFocus={e => e.target.select()} />
                </div>
            ))}

        <form onSubmit={anlegen} style={s.form}>
          <input style={{ ...s.input, flex: '2 1 160px' }} value={name} maxLength={40}
                 placeholder={t('kette_nfc_name')} onChange={e => setName(e.target.value)} />
          <select style={{ ...s.input, flex: '1 1 140px' }} value={gewaehlt} onChange={e => setOrt(e.target.value)}>
            {waehlbar.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
          <button type="submit" style={{ ...s.btn, opacity: !name.trim() || !gewaehlt || laeuft ? 0.5 : 1 }}
                  disabled={!name.trim() || !gewaehlt || laeuft}>
            {t('kette_nfc_anlegen')}
          </button>
        </form>
        {fehler && <p style={{ ...s.hint, color: '#b3261e', margin: '8px 0 0' }}>{fehler}</p>}
        <p style={{ ...s.hint, margin: '12px 0 0' }}>{t('nfc_steps')}</p>
      </div>
  )
}

const s = {
  card: { background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  titel: { fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 },
  hint: { fontSize: 12, color: '#888', margin: '0 0 12px', lineHeight: 1.5 },
  zeile: { padding: '10px 0', borderTop: '1px solid #f0f0f0' },
  kopf: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 6, flexWrap: 'wrap' },
  name: { fontSize: 14, fontWeight: 600, color: '#1a1a1a' },
  ort: { fontSize: 12, color: '#888', marginInlineStart: 8 },
  input: { width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: 13, fontWeight: 400, background: 'white' },
  form: { display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12, paddingTop: 12, borderTop: '1px solid #f0f0f0' },
  btn: { background: '#3C3489', color: 'white', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  klein: { background: '#f3f1fa', color: '#3C3489', border: 'none', borderRadius: 6, padding: '4px 9px', fontSize: 12, fontWeight: 600, cursor: 'pointer' },
}
