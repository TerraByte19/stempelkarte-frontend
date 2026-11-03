import { useEffect, useState } from 'react'
import api from '../api'
import { useLang } from '../LangContext'

const TEXT_MAX = 160

/**
 * Feste Automaten (Backend AutoNachrichtTyp): eine Zeile je Typ mit
 * Schalter und eigenem Text. Die Liste kommt vom Server, auch die Reihenfolge
 * und neue Typen; Name und Erklaerung kommen aus den Texten hier (unbekannter
 * Typ = roher Name).
 */
export default function AutoNachrichtenSection() {
  const { t } = useLang()
  const [zeilen, setZeilen] = useState(null)
  const [entwurf, setEntwurf] = useState({})      // typ -> Text im Feld
  const [status, setStatus] = useState({})        // typ -> 'busy' | 'ok' | 'err'

  useEffect(() => {
    api.get('/api/shop/auto-nachrichten')
        .then(r => {
          const l = Array.isArray(r.data) ? r.data : []
          setZeilen(l)
          const e = {}
          for (const z of l) e[z.typ] = z.text || ''
          setEntwurf(e)
        })
        .catch(() => setZeilen(false))
  }, [])

  if (!zeilen || zeilen.length === 0) return null

  function name(typ) {
    const k = `auto_typ_${typ}`
    const n = t(k)
    return n === k ? typ : n
  }
  function erklaerung(typ) {
    const k = `auto_typ_${typ}_d`
    const n = t(k)
    return n === k ? '' : n
  }

  async function speichern(z, aktiv) {
    const text = (entwurf[z.typ] ?? '').trim()
    if (text.length > TEXT_MAX) return
    setStatus(s => ({ ...s, [z.typ]: 'busy' }))
    try {
      const r = await api.put(`/api/shop/auto-nachrichten/${z.typ}`, { aktiv, text })
      setZeilen(l => l.map(x => x.typ === z.typ ? r.data : x))
      setEntwurf(e => ({ ...e, [z.typ]: r.data?.text || '' }))
      setStatus(s => ({ ...s, [z.typ]: 'ok' }))
      setTimeout(() => setStatus(s => ({ ...s, [z.typ]: undefined })), 1500)
    } catch {
      setStatus(s => ({ ...s, [z.typ]: 'err' }))
    }
  }

  return (
      <div style={s.card}>
        <h2 style={s.title}>⚙️ {t('auto_title')}</h2>
        <p style={s.hint}>{t('auto_hint')}</p>
        <div style={s.liste}>
          {zeilen.map(z => {
            const geaendert = (entwurf[z.typ] ?? '') !== (z.text || '')
            const st = status[z.typ]
            return (
                <div key={z.typ} style={{ ...s.zeile, opacity: z.aktiv ? 1 : 0.8 }}>
                  <div style={s.kopf}>
                    <div>
                      <div style={s.name}>{name(z.typ)}</div>
                      <div style={s.erkl}>{erklaerung(z.typ)}</div>
                    </div>
                    <button type="button" onClick={() => speichern(z, !z.aktiv)} disabled={st === 'busy'}
                            style={{ ...s.schalter, ...(z.aktiv ? s.schalterAn : {}) }}
                            aria-pressed={z.aktiv}>
                      {z.aktiv ? t('auto_on') : t('auto_off')}
                    </button>
                  </div>
                  <textarea value={entwurf[z.typ] ?? ''} maxLength={TEXT_MAX} rows={2}
                            placeholder={z.standard || t('auto_text_ph')}
                            onChange={e => setEntwurf(x => ({ ...x, [z.typ]: e.target.value }))}
                            style={s.text} />
                  <div style={s.fuss}>
                    <span style={s.zaehler}>{(entwurf[z.typ] ?? '').length}/{TEXT_MAX}</span>
                    {st === 'ok' && <span style={s.ok}>{t('auto_saved')}</span>}
                    {st === 'err' && <span style={s.err}>{t('auto_err')}</span>}
                    {geaendert && (
                        <button type="button" style={s.btnKlein} onClick={() => speichern(z, z.aktiv)} disabled={st === 'busy'}>
                          {t('auto_save')}
                        </button>
                    )}
                  </div>
                </div>
            )
          })}
        </div>
        <p style={s.platzhalter}>{t('auto_placeholders')}</p>
      </div>
  )
}

const s = {
  card: { background: 'white', borderRadius: 12, padding: 24, marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  title: { fontSize: 16, fontWeight: 600, margin: '0 0 6px', color: '#1a1a1a' },
  hint: { fontSize: 13, color: '#888', margin: '0 0 14px', lineHeight: 1.5 },
  liste: { display: 'flex', flexDirection: 'column', gap: 10 },
  zeile: { border: '1.5px solid #ececec', borderRadius: 10, padding: '12px 14px' },
  kopf: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 8 },
  name: { fontSize: 14, fontWeight: 600, color: '#1a1a1a' },
  erkl: { fontSize: 12, color: '#888', marginTop: 2 },
  schalter: { minWidth: 56, border: '1.5px solid #ddd', background: '#f5f5f7', color: '#666', borderRadius: 999, padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' },
  schalterAn: { background: '#3C3489', color: 'white', border: '1.5px solid #3C3489' },
  text: { width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: 13, resize: 'vertical', fontFamily: 'inherit' },
  fuss: { display: 'flex', alignItems: 'center', gap: 10, marginTop: 6, minHeight: 24 },
  zaehler: { fontSize: 11, color: '#aaa', flex: 1 },
  ok: { fontSize: 12, color: '#2d7a3e' },
  err: { fontSize: 12, color: '#b23b3b' },
  btnKlein: { background: '#3C3489', color: 'white', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' },
  platzhalter: { fontSize: 12, color: '#999', margin: '12px 0 0', lineHeight: 1.5 },
}
