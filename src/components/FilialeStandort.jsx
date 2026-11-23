import { useEffect, useState } from 'react'
import api from '../api'

/**
 * Unterkonto: Standort der eigenen Filiale per Knopf uebernehmen - wer im
 * Laden steht, speichert den genauen Punkt. Genauer als der Punkt aus der
 * Adresse, den das Hauptkonto eingetragen hat.
 *
 * Am Hauptstandort gibt es den Block nicht (das macht das Hauptkonto im
 * Profil); dann antwortet der Server mit einem Fehler und der Block bleibt
 * unsichtbar.
 */
export default function FilialeStandort({ t }) {
  const [stand, setStand] = useState(null)
  const [laeuft, setLaeuft] = useState(false)
  const [fehler, setFehler] = useState('')
  const [ok, setOk] = useState(false)

  useEffect(() => {
    let aktuell = true
    api.get('/api/filiale/standort')
        .then(r => { if (aktuell) setStand(r.data) })
        .catch(() => {})
    return () => { aktuell = false }
  }, [])

  if (!stand) return null

  function uebernehmen() {
    setFehler(''); setOk(false)
    if (!navigator.geolocation) {
      setFehler(t('kette_ort_kein_gps'))
      return
    }
    if (!confirm(t('kette_ort_frage'))) return
    setLaeuft(true)
    navigator.geolocation.getCurrentPosition(
        async pos => {
          try {
            const r = await api.put('/api/filiale/standort', {
              latitude: Number(pos.coords.latitude.toFixed(6)),
              longitude: Number(pos.coords.longitude.toFixed(6)),
            })
            setStand(r.data)
            setOk(true)
          } catch (e) {
            setFehler(e?.response?.data?.error || t('kette_fehler'))
          } finally {
            setLaeuft(false)
          }
        },
        () => {
          setFehler(t('kette_ort_verweigert'))
          setLaeuft(false)
        },
        { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  return (
      <div style={s.card}>
        <div style={s.titel}>{t('kette_ort_title')}</div>
        <p style={s.hint}>{t('kette_ort_hint')}</p>
        {stand.adresse && <p style={{ ...s.hint, color: '#1a1a1a' }}>{stand.adresse}</p>}
        {stand.gesetzt === false && <p style={s.warn}>{t('kette_ort_fehlt')}</p>}
        <button type="button" style={{ ...s.btn, opacity: laeuft ? 0.6 : 1 }} onClick={uebernehmen} disabled={laeuft}>
          {laeuft ? t('common_loading') : t('kette_ort_knopf')}
        </button>
        {ok && <p style={{ ...s.hint, color: '#2C5F2E', margin: '10px 0 0' }}>{t('kette_ort_ok')}</p>}
        {fehler && <p style={{ ...s.hint, color: '#b3261e', margin: '10px 0 0' }}>{fehler}</p>}
      </div>
  )
}

const s = {
  card: { background: 'white', borderRadius: 12, padding: 20, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  titel: { fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 },
  hint: { fontSize: 13, color: '#888', margin: '0 0 12px', lineHeight: 1.5 },
  warn: { fontSize: 13, color: '#7A5200', background: '#FBF3E2', padding: '10px 12px', borderRadius: 8, margin: '0 0 12px', lineHeight: 1.5 },
  btn: { background: '#3C3489', color: 'white', border: 'none', borderRadius: 8, padding: '9px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
}
