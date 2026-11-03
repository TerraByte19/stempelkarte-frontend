import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import { useLang } from '../LangContext'

/**
 * Standorte des Ladens: der Hauptstandort (aus dem Profil) und die weiteren
 * Standorte = Filialen (ShopOrt). Wie viele ein Laden anlegen darf, setzt
 * der Admin (max). Vorher als "Weitere Orte" im Profil; hier immer sichtbar,
 * auch mit nur einem Standort.
 */
export default function StandorteSection() {
  const { t } = useLang()
  const [haupt, setHaupt] = useState(null)
  // null = laedt, false = nicht verfuegbar
  const [orte, setOrte] = useState(null)
  const [max, setMax] = useState(0)
  const [label, setLabel] = useState('')
  const [lat, setLat] = useState('')
  const [lon, setLon] = useState('')
  const [locating, setLocating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function uebernehmen(data) {
    const liste = Array.isArray(data) ? data : (Array.isArray(data?.orte) ? data.orte : [])
    setOrte(liste)
    setMax(Array.isArray(data) ? 9 : Number(data?.max) || 0)
  }

  useEffect(() => {
    api.get('/api/shop/me/orte').then(r => uebernehmen(r.data)).catch(() => setOrte(false))
    api.get('/api/shop/me').then(r => setHaupt(r.data || null)).catch(() => setHaupt(null))
  }, [])

  function standortHolen() {
    if (!navigator.geolocation) { setError(t('profil_lock_geo_unsupported')); return }
    setError('')
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
        pos => {
          setLat(String(Number(pos.coords.latitude.toFixed(6))))
          setLon(String(Number(pos.coords.longitude.toFixed(6))))
          setLocating(false)
        },
        () => { setError(t('profil_lock_geo_denied')); setLocating(false) },
        { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  async function hinzufuegen() {
    setError('')
    const latitude = Number(String(lat).replace(',', '.'))
    const longitude = Number(String(lon).replace(',', '.'))
    if (!label.trim() || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      setError(t('profil_orte_incomplete'))
      return
    }
    setSaving(true)
    try {
      const res = await api.post('/api/shop/me/orte', { label: label.trim(), latitude, longitude })
      uebernehmen(res.data)
      setLabel(''); setLat(''); setLon('')
    } catch (err) {
      setError(err.response?.data?.error || t('profil_save_error'))
    } finally {
      setSaving(false)
    }
  }

  async function loeschen(ort) {
    if (!confirm(t('profil_orte_delete_confirm', { label: ort.label }))) return
    setError('')
    try {
      const res = await api.delete(`/api/shop/me/orte/${ort.id}`)
      uebernehmen(res.data)
    } catch (err) {
      setError(err.response?.data?.error || t('profil_save_error'))
    }
  }

  if (orte === null || orte === false) return null
  const voll = orte.length >= max
  const hauptGesetzt = haupt && haupt.latitude != null && haupt.longitude != null

  return (
      <div style={s.card}>
        <h2 style={s.cardTitle}>📍 {t('orte_title')}</h2>

        <div style={s.hauptZeile}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>{t('orte_haupt')}</div>
            <div style={{ fontSize: 12, color: hauptGesetzt ? '#999' : '#c0392b', marginTop: 2 }}>
              {hauptGesetzt
                  ? <span style={{ fontFamily: 'monospace' }}>{haupt.latitude}, {haupt.longitude}</span>
                  : t('orte_haupt_missing')}
            </div>
          </div>
          <Link to="/profil" style={s.link}>{t('orte_profil_link')}</Link>
        </div>
        <p style={{ ...s.hint, margin: '4px 0 14px' }}>{t('orte_haupt_hint')}</p>

        <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>{t('orte_weitere')}</div>
        <p style={{ ...s.hint, margin: '0 0 12px' }}>{max > 0 ? t('profil_orte_hint', { max }) : t('fil_single')}</p>

        {error && <div style={s.errorBox}>{error}</div>}

        {orte.length === 0 && max > 0 && <p style={s.hint}>{t('profil_orte_empty')}</p>}
        {orte.map(o => (
            <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: '1px solid #f3f3f3' }}>
              <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 600, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis' }}>{o.label}</span>
              <span style={{ fontSize: 12, color: '#999', fontFamily: 'monospace' }}>{o.latitude}, {o.longitude}</span>
              <button type="button" onClick={() => loeschen(o)}
                      style={{ background: '#fff0f0', color: '#c0392b', border: 'none', borderRadius: 8, padding: '6px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                {t('profil_orte_delete')}
              </button>
            </div>
        ))}

        {max > 0 && !voll && (
            <div style={{ marginTop: 12, padding: 12, background: '#f7f7fb', borderRadius: 10 }}>
              <input style={s.input} maxLength={40} value={label} onChange={e => setLabel(e.target.value)}
                     placeholder={t('profil_orte_label_ph')} />
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <input style={{ ...s.input, flex: 1 }} inputMode="decimal" value={lat}
                       onChange={e => setLat(e.target.value)} placeholder={t('profil_orte_lat')} />
                <input style={{ ...s.input, flex: 1 }} inputMode="decimal" value={lon}
                       onChange={e => setLon(e.target.value)} placeholder={t('profil_orte_lon')} />
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                <button type="button" style={{ ...s.btnSecondary, flex: 1 }} onClick={standortHolen} disabled={locating}>
                  {locating ? t('profil_lock_locating') : t('profil_orte_use_location')}
                </button>
                <button type="button" style={{ ...s.btnPrimary, flex: 1 }} onClick={hinzufuegen} disabled={saving}>
                  {saving ? t('profil_saving') : t('profil_orte_add')}
                </button>
              </div>
              <p style={s.hint}>{t('profil_orte_coords_hint')}</p>
            </div>
        )}
        {max > 0 && voll && <p style={s.hint}>{t('profil_orte_max', { max })}</p>}
      </div>
  )
}

const s = {
  card: { background: 'white', borderRadius: 12, padding: 20, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  cardTitle: { fontSize: 16, fontWeight: 600, margin: '0 0 12px', color: '#1a1a1a' },
  hauptZeile: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' },
  link: { fontSize: 13, color: '#3C3489', fontWeight: 600, textDecoration: 'none', background: '#f0eeff', borderRadius: 8, padding: '6px 10px' },
  errorBox: { background: '#fff0f0', color: '#c00', padding: 10, borderRadius: 8, fontSize: 14, marginBottom: 12 },
  input: { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: 14, outline: 'none', boxSizing: 'border-box' },
  btnPrimary: { background: '#3C3489', color: 'white', border: 'none', borderRadius: 10, padding: '12px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  btnSecondary: { background: '#f0eeff', color: '#3C3489', border: 'none', borderRadius: 10, padding: '10px 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  hint: { fontSize: 13, color: '#888', margin: '12px 0 0' },
}
