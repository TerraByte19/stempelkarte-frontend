import { useEffect, useState } from 'react'
import api from '../api'
import { useLang, localeTag } from '../LangContext'

/**
 * "Zuletzt passiert" fuers Dashboard: die juengsten Scans mit Namen und die
 * neuesten Kunden. Ein aelteres Backend kennt den Endpunkt nicht (404) -
 * dann bleibt der Block unsichtbar statt leer.
 */
export default function AktivitaetSection() {
  const { t, lang } = useLang()
  // null = laedt, false = nicht verfuegbar
  const [daten, setDaten] = useState(null)

  useEffect(() => {
    api.get('/api/shop/stats/aktivitaet')
        .then(r => setDaten({
          scans: Array.isArray(r.data?.scans) ? r.data.scans : [],
          neueKunden: Array.isArray(r.data?.neueKunden) ? r.data.neueKunden : [],
        }))
        .catch(() => setDaten(false))
  }, [])

  if (!daten) return null

  function zeit(iso) {
    if (!iso) return ''
    try {
      const d = new Date(iso)
      const tag = localeTag(lang)
      const uhr = d.toLocaleTimeString(tag, { hour: '2-digit', minute: '2-digit' })
      const heute = new Date()
      const gestern = new Date(); gestern.setDate(heute.getDate() - 1)
      const gleicherTag = (a, b) => a.toDateString() === b.toDateString()
      if (gleicherTag(d, heute)) return `${t('dash_act_today')} ${uhr}`
      if (gleicherTag(d, gestern)) return `${t('dash_act_yesterday')} ${uhr}`
      return d.toLocaleDateString(tag, { day: '2-digit', month: '2-digit' }) + ' ' + uhr
    } catch { return iso }
  }

  function datum(iso) {
    if (!iso) return ''
    try { return new Date(iso).toLocaleDateString(localeTag(lang), { day: '2-digit', month: '2-digit' }) }
    catch { return iso }
  }

  function was(scan) {
    if (scan.praemien > 0) return { text: t('dash_act_reward'), farbe: '#1e7a4c', bg: '#ddf2e6' }
    if (scan.stempel > 0) return { text: t('dash_act_stamps', { n: scan.stempel }), farbe: '#3C3489', bg: '#f0eeff' }
    return { text: t('dash_act_visit'), farbe: '#666', bg: '#f0f0f0' }
  }

  const leer = daten.scans.length === 0 && daten.neueKunden.length === 0

  return (
      <div style={s.card}>
        <style>{`
          .sk-akt-grid { display: grid; grid-template-columns: 3fr 2fr; gap: 24px; }
          @media (max-width: 700px) { .sk-akt-grid { grid-template-columns: 1fr; } }
        `}</style>
        {leer ? (
            <>
              <h2 style={s.title}>{t('dash_act_title')}</h2>
              <p style={s.muted}>{t('dash_act_empty')}</p>
            </>
        ) : (
            <div className="sk-akt-grid">
              <div>
                <h2 style={s.title}>{t('dash_act_title')}</h2>
                {daten.scans.length === 0 && <p style={s.muted}>{t('dash_act_empty')}</p>}
                {daten.scans.map((scan, i) => {
                  const w = was(scan)
                  return (
                      <div key={i} style={s.zeile}>
                        <span style={s.zeit}>{zeit(scan.zeit)}</span>
                        <span style={s.wer}>
                          <span style={s.name}>{scan.kunde || t('dash_act_unknown')}</span>
                          <span style={s.karte}>
                            {scan.karte}{scan.von ? ` · ${t('dash_act_by', { name: scan.von })}` : ''}
                          </span>
                        </span>
                        <span style={{ ...s.pill, color: w.farbe, background: w.bg }}>{w.text}</span>
                      </div>
                  )
                })}
              </div>
              <div>
                <h2 style={s.title}>{t('dash_act_new_title')}</h2>
                {daten.neueKunden.length === 0 && <p style={s.muted}>{t('dash_act_new_empty')}</p>}
                {daten.neueKunden.map((k, i) => (
                    <div key={i} style={s.zeile}>
                      <span style={s.zeit}>{datum(k.seit)}</span>
                      <span style={s.wer}>
                        <span style={s.name}>{k.name || t('dash_act_unknown')}</span>
                        <span style={s.karte}>{k.karte}</span>
                      </span>
                      {k.gesperrt && <span style={{ ...s.pill, color: '#9a5d00', background: '#fbecd2' }}>{t('dash_act_locked')}</span>}
                    </div>
                ))}
              </div>
            </div>
        )}
      </div>
  )
}

const s = {
  card: { background: 'white', borderRadius: 12, padding: 24, marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  title: { fontSize: 16, fontWeight: 600, margin: '0 0 10px', color: '#1a1a1a' },
  muted: { fontSize: 13, color: '#888', margin: 0 },
  zeile: { display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderTop: '1px solid #f3f3f3', fontSize: 13 },
  zeit: { color: '#999', fontSize: 12, flexShrink: 0, minWidth: 86 },
  wer: { display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 },
  name: { fontWeight: 600, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  karte: { fontSize: 11, color: '#999', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  pill: { fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6, flexShrink: 0, whiteSpace: 'nowrap' },
}
