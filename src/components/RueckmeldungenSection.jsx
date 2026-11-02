import { useEffect, useState } from 'react'
import api from '../api'
import { useLang, localeTag } from '../LangContext'

/**
 * Private Rueckmeldungen der Kunden (Sterne + Satz). Der Laden schaltet
 * das hier selbst ein; aus = kein Link irgendwo. Ein aelteres Backend
 * kennt den Endpunkt nicht (404) - dann bleibt der Block unsichtbar.
 */
export default function RueckmeldungenSection() {
  const { t, lang } = useLang()
  // null = laedt, false = nicht verfuegbar
  const [stand, setStand] = useState(null)
  const [busy, setBusy] = useState(false)

  function laden() {
    return api.get('/api/shop/rueckmeldungen')
        .then(r => setStand({
          aktiv: !!r.data?.aktiv,
          ungelesen: r.data?.ungelesen || 0,
          schnitt: r.data?.schnitt || 0,
          anzahl30: r.data?.anzahl30 || 0,
          items: Array.isArray(r.data?.items) ? r.data.items : [],
        }))
        .catch(() => setStand(false))
  }

  useEffect(() => { laden() }, [])

  if (!stand) return null

  async function schalten(aktiv) {
    setBusy(true)
    try {
      await api.put('/api/shop/rueckmeldungen/aktiv', { aktiv })
      await laden()
    } catch { /* Block bleibt wie er ist */ }
    setBusy(false)
  }

  async function gelesen(item) {
    if (item.gelesen) return
    try {
      await api.put(`/api/shop/rueckmeldungen/${item.id}/gelesen`)
      setStand(s => ({
        ...s,
        ungelesen: Math.max(0, s.ungelesen - 1),
        items: s.items.map(i => i.id === item.id ? { ...i, gelesen: true } : i),
      }))
    } catch { /* bleibt ungelesen */ }
  }

  function zeit(iso) {
    if (!iso) return ''
    try {
      const d = new Date(iso)
      const tag = localeTag(lang)
      return d.toLocaleDateString(tag, { day: '2-digit', month: '2-digit' }) + ' '
          + d.toLocaleTimeString(tag, { hour: '2-digit', minute: '2-digit' })
    } catch { return iso }
  }

  function sterne(n) {
    return (
        <span style={s.sterne} aria-label={`${n}/5`}>
          {[1, 2, 3, 4, 5].map(i => (
              <span key={i} style={{ color: i <= n ? '#f5b301' : '#ddd' }}>★</span>
          ))}
        </span>
    )
  }

  if (!stand.aktiv) {
    return (
        <div style={s.card}>
          <h2 style={s.title}>{t('rm_title')}</h2>
          <p style={s.text}>{t('rm_intro')}</p>
          <p style={s.muted}>{t('rm_google_note')}</p>
          <button type="button" style={s.btn} disabled={busy} onClick={() => schalten(true)}>
            {t('rm_on')}
          </button>
        </div>
    )
  }

  return (
      <div style={s.card}>
        <div style={s.kopf}>
          <div>
            <h2 style={s.title}>
              {t('rm_title')}
              {stand.ungelesen > 0 && <span style={s.badge}>{t('rm_unread', { n: stand.ungelesen })}</span>}
            </h2>
            <p style={s.muted}>
              {stand.anzahl30 > 0
                  ? `${t('rm_avg', { n: stand.schnitt.toLocaleString(localeTag(lang)) })} · ${t('rm_count', { n: stand.anzahl30 })}`
                  : t('rm_where')}
            </p>
          </div>
          <button type="button" style={s.link} disabled={busy} onClick={() => schalten(false)}>
            {t('rm_off')}
          </button>
        </div>
        {stand.items.length === 0
            ? <p style={s.muted}>{t('rm_empty')}</p>
            : stand.items.map(item => (
                <div key={item.id} style={{ ...s.zeile, opacity: item.gelesen ? 0.75 : 1 }}
                     onClick={() => gelesen(item)} role={item.gelesen ? undefined : 'button'}
                     title={item.gelesen ? undefined : t('rm_mark_read')}>
                  <div style={s.zeileKopf}>
                    {sterne(item.sterne)}
                    <span style={s.wer}>
                      <strong style={{ fontWeight: item.gelesen ? 500 : 700 }}>{item.kunde || t('rm_anon')}</strong>
                      {item.karte ? ` · ${item.karte}` : ''} · {zeit(item.am)}
                    </span>
                    {!item.gelesen && <span style={s.neu}>{t('rm_new')}</span>}
                  </div>
                  {item.text && <p style={s.satz}>{item.text}</p>}
                </div>
            ))}
      </div>
  )
}

const s = {
  card: { background: 'white', borderRadius: 12, padding: 24, marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  kopf: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8 },
  title: { fontSize: 16, fontWeight: 600, margin: '0 0 6px', color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: 8 },
  badge: { fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6, background: '#f0eeff', color: '#3C3489' },
  text: { fontSize: 14, color: '#444', margin: '0 0 8px', lineHeight: 1.5 },
  muted: { fontSize: 13, color: '#888', margin: 0 },
  btn: { marginTop: 14, padding: '10px 16px', borderRadius: 8, border: 'none', background: '#3C3489', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: 14 },
  link: { background: 'none', border: 'none', color: '#888', fontSize: 12, cursor: 'pointer', textDecoration: 'underline', padding: 0, flexShrink: 0 },
  zeile: { padding: '10px 0', borderTop: '1px solid #f3f3f3', cursor: 'default' },
  zeileKopf: { display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, flexWrap: 'wrap' },
  sterne: { letterSpacing: 1, fontSize: 15, flexShrink: 0 },
  wer: { color: '#555', minWidth: 0 },
  neu: { fontSize: 11, fontWeight: 600, padding: '1px 6px', borderRadius: 6, background: '#ddf2e6', color: '#1e7a4c' },
  satz: { margin: '6px 0 0', fontSize: 14, color: '#1a1a1a', lineHeight: 1.5, whiteSpace: 'pre-wrap' },
}
