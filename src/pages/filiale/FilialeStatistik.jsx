import { useEffect, useState } from 'react'
import api from '../../api'
import { useLang } from '../../LangContext'
import { zeitraum } from '../../lib/rolle'

/**
 * Unterkonto: die vier Zahlen der EIGENEN Filiale im gewaehlten Zeitraum.
 * Das Backend liefert nur die eigene Filiale, keine Kundendaten.
 */
const SCHNELL = [
  { tage: 1, key: 'kette_zeit_heute' },
  { tage: 7, key: 'kette_zeit_7' },
  { tage: 30, key: 'kette_zeit_30' },
]

export default function FilialeStatistik() {
  const { t } = useLang()
  const [raum, setRaum] = useState(() => zeitraum(7))
  const [zeile, setZeile] = useState(null)
  const [fehler, setFehler] = useState(false)

  useEffect(() => {
    let aktiv = true
    api.get('/api/filiale/statistik', { params: raum })
        .then(r => { if (aktiv) { setZeile(r.data); setFehler(false) } })
        .catch(() => { if (aktiv) { setZeile(null); setFehler(true) } })
    return () => { aktiv = false }
  }, [raum])

  const gewaehlt = tage => {
    const z = zeitraum(tage)
    return z.von === raum.von && z.bis === raum.bis
  }

  return (
      <div style={s.page}>
        <h1 style={s.title}>{t('kette_stat_title')}</h1>

        <div style={s.leiste}>
          {SCHNELL.map(x => (
              <button key={x.tage} type="button" onClick={() => setRaum(zeitraum(x.tage))}
                      style={{ ...s.chip, ...(gewaehlt(x.tage) ? s.chipAn : null) }}>
                {t(x.key)}
              </button>
          ))}
          <label style={s.datum}>
            {t('kette_von')}
            <input type="date" value={raum.von} max={raum.bis} style={s.input}
                   onChange={e => e.target.value && setRaum({ ...raum, von: e.target.value })} />
          </label>
          <label style={s.datum}>
            {t('kette_bis')}
            <input type="date" value={raum.bis} min={raum.von} style={s.input}
                   onChange={e => e.target.value && setRaum({ ...raum, bis: e.target.value })} />
          </label>
        </div>

        {fehler && <div style={s.fehler}>{t('kette_ladefehler')}</div>}

        <div style={s.raster}>
          <Kachel wert={zeile?.stempel} titel={t('kette_k_stempel')} />
          <Kachel wert={zeile?.neueKunden} titel={t('kette_k_neu')} />
          <Kachel wert={zeile?.praemien} titel={t('kette_k_praemien')} />
          <Kachel wert={zeile?.aktiveKunden} titel={t('kette_k_aktiv')} />
        </div>
        <p style={s.hinweis}>{t('kette_praemien_hinweis')}</p>
      </div>
  )
}

function Kachel({ wert, titel }) {
  return (
      <div style={s.kachel}>
        <div style={s.wert}>{wert ?? '·'}</div>
        <div style={s.label}>{titel}</div>
      </div>
  )
}

const s = {
  page: { maxWidth: 760, margin: '0 auto' },
  title: { fontSize: 24, fontWeight: 700, margin: '0 0 16px', color: '#1a1a1a' },
  leiste: { display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'flex-end', marginBottom: 16 },
  chip: { padding: '8px 14px', borderRadius: 999, border: '1.5px solid #e0e0e0', background: 'white', color: '#444', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' },
  chipAn: { background: '#3C3489', color: 'white', borderColor: '#3C3489', fontWeight: 600 },
  datum: { display: 'flex', flexDirection: 'column', gap: 3, fontSize: 11, color: '#888' },
  input: { padding: '7px 8px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: 14, fontFamily: 'inherit' },
  fehler: { background: '#fff0f0', color: '#d00', padding: '10px 14px', borderRadius: 8, fontSize: 14, marginBottom: 12 },
  raster: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 },
  kachel: { background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', textAlign: 'center' },
  wert: { fontSize: 32, fontWeight: 700, color: '#3C3489', lineHeight: 1.1 },
  label: { fontSize: 13, color: '#666', marginTop: 6 },
  hinweis: { fontSize: 12, color: '#999', lineHeight: 1.5, marginTop: 14 },
}
