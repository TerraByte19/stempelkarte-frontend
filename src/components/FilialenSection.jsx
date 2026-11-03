import { useEffect, useState } from 'react'
import api from '../api'
import { useLang, localeTag } from '../LangContext'

/**
 * Filialen-Uebersicht: eine Zeile je Standort (Hauptstandort zuerst) mit
 * Scans, Stempeln, Kunden der letzten 30 Tage und Zugaengen. Ein aelteres
 * Backend kennt den Endpunkt nicht - dann bleibt der Block weg. Mit nur
 * einem Standort gibt es statt der Tabelle einen Satz.
 */
export default function FilialenSection() {
  const { t, lang } = useLang()
  const [stand, setStand] = useState(null)

  useEffect(() => {
    api.get('/api/shop/filialen')
        .then(r => setStand(r.data && Array.isArray(r.data.filialen) ? r.data : false))
        .catch(() => setStand(false))
  }, [])

  if (!stand) return null

  function datum(iso) {
    try { return new Date(iso).toLocaleDateString(localeTag(lang), { day: '2-digit', month: '2-digit' }) }
    catch { return '' }
  }

  const mehrere = stand.max > 1 || stand.filialen.length > 1

  return (
      <div style={s.card}>
        <h2 style={s.title}>🏬 {t('fil_title')}</h2>
        {!mehrere ? (
            <p style={s.hint}>{t('fil_single')}</p>
        ) : (
            <>
              <p style={s.hint}>{t('fil_hint')}</p>
              <div style={s.usage}>{t('fil_usage', { genutzt: stand.genutzt, max: stand.max })}</div>
              <div style={s.tabelle}>
                <div style={{ ...s.zeile, ...s.kopf }}>
                  <span style={s.name}></span>
                  <span style={s.zahl}>{t('fil_col_scans')}</span>
                  <span style={s.zahl}>{t('fil_col_stempel')}</span>
                  <span style={s.zahl}>{t('fil_col_kunden')}</span>
                  <span style={s.zahl}>{t('fil_col_zugaenge')}</span>
                </div>
                {stand.filialen.map(f => (
                    <div key={f.id} style={{ ...s.zeile, opacity: f.geloescht ? 0.6 : 1 }}>
                      <span style={s.name}>
                        <span style={{ fontWeight: 600 }}>{f.haupt ? t('team_filiale_haupt') : (f.geloescht ? t('fil_deleted') : f.label)}</span>
                        <span style={s.meta}>{f.letzterScan ? t('fil_last', { datum: datum(f.letzterScan) }) : t('fil_never')}</span>
                      </span>
                      <span style={s.zahl}>{f.scans30d}</span>
                      <span style={s.zahl}>{f.stempel30d}</span>
                      <span style={s.zahl}>{f.kunden30d}</span>
                      <span style={s.zahl}>{f.zugaenge}</span>
                    </div>
                ))}
              </div>
            </>
        )}
      </div>
  )
}

const s = {
  card: { background: 'white', borderRadius: 12, padding: 20, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  title: { fontSize: 16, fontWeight: 600, margin: '0 0 6px', color: '#1a1a1a' },
  hint: { fontSize: 13, color: '#888', margin: '0 0 10px', lineHeight: 1.5 },
  usage: { fontSize: 12, color: '#3C3489', fontWeight: 600, marginBottom: 10 },
  tabelle: { display: 'flex', flexDirection: 'column' },
  zeile: { display: 'grid', gridTemplateColumns: 'minmax(120px, 2fr) repeat(4, minmax(48px, 1fr))', gap: 8, alignItems: 'center', padding: '8px 0', borderTop: '1px solid #f0f0f0' },
  kopf: { borderTop: 'none', fontSize: 11, color: '#999', textTransform: 'uppercase', letterSpacing: 0.4 },
  name: { display: 'flex', flexDirection: 'column', fontSize: 14, color: '#1a1a1a', minWidth: 0 },
  meta: { fontSize: 11, color: '#999' },
  zahl: { fontSize: 14, fontWeight: 600, color: '#3C3489', textAlign: 'center' },
}
