import { useEffect, useState } from 'react'
import api from '../api'
import { useLang } from '../LangContext'
import { useTarif } from '../tarif'
import { zeitraum } from '../lib/rolle'

/**
 * Hauptkonto einer Kette: eine Zeile je Filiale im gewaehlten Zeitraum,
 * darunter die Summe. Fuer jeden anderen Tarif bleibt der Block weg.
 */
const SCHNELL = [
  { tage: 1, key: 'kette_zeit_heute' },
  { tage: 7, key: 'kette_zeit_7' },
  { tage: 30, key: 'kette_zeit_30' },
]

export default function KettenStatistik() {
  const tarif = useTarif()
  if (tarif?.tarif !== 'KETTE') return null
  return <Tabelle />
}

function Tabelle() {
  const { t } = useLang()
  const [raum, setRaum] = useState(() => zeitraum(30))
  const [daten, setDaten] = useState(null)

  useEffect(() => {
    let aktiv = true
    api.get('/api/shop/filialen/statistik', { params: raum })
        .then(r => { if (aktiv) setDaten(r.data) })
        .catch(() => { if (aktiv) setDaten(false) })
    return () => { aktiv = false }
  }, [raum])

  const gewaehlt = tage => {
    const z = zeitraum(tage)
    return z.von === raum.von && z.bis === raum.bis
  }
  const zeilen = daten && Array.isArray(daten.filialen) ? daten.filialen : []

  return (
      <div style={s.card}>
        <h2 style={s.title}>{t('kette_tab_title')}</h2>
        <div style={s.leiste}>
          {SCHNELL.map(x => (
              <button key={x.tage} type="button" onClick={() => setRaum(zeitraum(x.tage))}
                      style={{ ...s.chip, ...(gewaehlt(x.tage) ? s.chipAn : null) }}>{t(x.key)}</button>
          ))}
          <label style={s.datum}>{t('kette_von')}
            <input type="date" value={raum.von} max={raum.bis} style={s.input}
                   onChange={e => e.target.value && setRaum({ ...raum, von: e.target.value })} />
          </label>
          <label style={s.datum}>{t('kette_bis')}
            <input type="date" value={raum.bis} min={raum.von} style={s.input}
                   onChange={e => e.target.value && setRaum({ ...raum, bis: e.target.value })} />
          </label>
        </div>
        {daten === false && <p style={s.hint}>{t('kette_ladefehler')}</p>}
        <div style={{ overflowX: 'auto' }}>
          <table style={s.tabelle}>
            <thead>
              <tr>
                <th style={{ ...s.th, textAlign: 'start' }}>{t('kette_tab_filiale')}</th>
                <th style={s.th}>{t('kette_k_stempel')}</th>
                <th style={s.th}>{t('kette_k_neu')}</th>
                <th style={s.th}>{t('kette_k_praemien')}</th>
                <th style={s.th}>{t('kette_k_aktiv')}</th>
              </tr>
            </thead>
            <tbody>
              {zeilen.map(f => (
                  <tr key={f.id} style={{ opacity: f.aktiv && !f.geloescht ? 1 : 0.55 }}>
                    <td style={s.td}>{f.haupt ? t('team_filiale_haupt') : f.geloescht ? t('fil_deleted') : f.label}</td>
                    <td style={s.zahl}>{f.stempel}</td>
                    <td style={s.zahl}>{f.neueKunden}</td>
                    <td style={s.zahl}>{f.praemien}</td>
                    <td style={s.zahl}>{f.aktiveKunden}</td>
                  </tr>
              ))}
              {daten && daten.gesamt && (
                  <tr>
                    <td style={{ ...s.td, fontWeight: 700 }}>{t('kette_tab_gesamt')}</td>
                    <td style={s.summe}>{daten.gesamt.stempel}</td>
                    <td style={s.summe}>{daten.gesamt.neueKunden}</td>
                    <td style={s.summe}>{daten.gesamt.praemien}</td>
                    <td style={s.summe}>{daten.gesamt.aktiveKunden}</td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
        <p style={{ ...s.hint, marginTop: 10 }}>{t('kette_praemien_hinweis')}</p>
      </div>
  )
}

const s = {
  card: { background: 'white', borderRadius: 14, padding: 20, marginBottom: 20, boxShadow: '0 1px 2px rgba(16,24,40,0.04), 0 6px 20px rgba(16,24,40,0.06)' },
  title: { fontSize: 16, fontWeight: 600, margin: '0 0 12px', color: '#1a1a1a' },
  hint: { fontSize: 12, color: '#999', margin: 0, lineHeight: 1.5 },
  leiste: { display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'flex-end', marginBottom: 12 },
  chip: { padding: '7px 13px', borderRadius: 999, border: '1.5px solid #e0e0e0', background: 'white', color: '#444', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' },
  chipAn: { background: '#3C3489', color: 'white', borderColor: '#3C3489', fontWeight: 600 },
  datum: { display: 'flex', flexDirection: 'column', gap: 3, fontSize: 11, color: '#888' },
  input: { padding: '6px 8px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: 13, fontFamily: 'inherit' },
  tabelle: { width: '100%', borderCollapse: 'collapse', minWidth: 460 },
  th: { fontSize: 11, color: '#999', textTransform: 'uppercase', letterSpacing: 0.4, fontWeight: 600, padding: '6px 8px', textAlign: 'center' },
  td: { fontSize: 14, color: '#1a1a1a', padding: '9px 8px', borderTop: '1px solid #f0f0f0' },
  zahl: { fontSize: 14, fontWeight: 600, color: '#3C3489', padding: '9px 8px', borderTop: '1px solid #f0f0f0', textAlign: 'center' },
  summe: { fontSize: 15, fontWeight: 700, color: '#1a1a1a', padding: '10px 8px', borderTop: '2px solid #e0e0e0', textAlign: 'center' },
}
