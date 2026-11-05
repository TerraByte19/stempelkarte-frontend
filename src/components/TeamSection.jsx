import { useEffect, useState } from 'react'
import api from '../api'
import { useLang } from '../LangContext'

/**
 * Mitarbeiter-Zugaenge (Staff-Tokens) mit Name, Rolle, Filiale, zuletzt
 * benutzt und Scans der letzten 7 Tage. Vorher im Profil; die Filiale ist
 * neu (Backend TeamService: ortId, HAUPT = Hauptstandort). Ein aelteres
 * Backend kennt /api/shop/team nicht (404) - dann bleibt der Block weg.
 */
export default function TeamSection() {
  const { t } = useLang()
  // null = laedt, false = nicht verfuegbar
  const [zugaenge, setZugaenge] = useState(null)
  const [orte, setOrte] = useState([])
  const [label, setLabel] = useState('')
  const [rolle, setRolle] = useState('MITARBEITER')
  const [ortId, setOrtId] = useState('HAUPT')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState('')
  // Selbst-Stempeln am Tablet: Sperre nach einem Stempel, in Stunden.
  const [kioskSperre, setKioskSperre] = useState(null)

  function laden() {
    return api.get('/api/shop/team')
        .then(res => setZugaenge(Array.isArray(res.data) ? res.data : []))
        .catch(() => setZugaenge(false))
  }

  useEffect(() => {
    laden()
    api.get('/api/shop/me')
        .then(r => setKioskSperre(typeof r.data?.kioskSperreStunden === 'number' ? r.data.kioskSperreStunden : 2))
        .catch(() => setKioskSperre(2))
    api.get('/api/shop/me/orte')
        .then(r => setOrte(Array.isArray(r.data?.orte) ? r.data.orte : []))
        .catch(() => setOrte([]))
  }, [])

  if (!zugaenge) return null

  function fehler(err) {
    setError(err.response?.data?.error || err.response?.data?.message || t('profil_staff_error'))
  }

  async function anlegen(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await api.post('/api/shop/team', { label: label.trim(), rolle, ortId })
      setLabel('')
      await laden()
    } catch (err) { fehler(err) }
    setBusy(false)
  }

  async function kioskSperreSetzen(stunden) {
    setError('')
    const vorher = kioskSperre
    setKioskSperre(stunden)
    try {
      await api.put('/api/shop/me/kiosk', { stunden })
    } catch (err) { setKioskSperre(vorher); fehler(err) }
  }

  async function aendern(z, felder) {
    setError('')
    try {
      await api.put(`/api/shop/team/${z.token}`, felder)
      await laden()
    } catch (err) { fehler(err) }
  }

  async function umbenennen(z, neu) {
    const n = neu.trim()
    if (!n || n === z.label) return
    await aendern(z, { label: n })
  }

  async function entfernen(z) {
    if (!confirm(t('profil_team_delete_confirm', { label: z.label }))) return
    setError('')
    try {
      await api.delete(`/api/shop/team/${z.token}`)
      await laden()
    } catch (err) { fehler(err) }
  }

  function setupUrl(z) {
    const params = new URLSearchParams({ token: z.token, label: z.label || 'Scanner' })
    return `${window.location.origin}/scanner-setup?${params.toString()}`
  }

  async function linkKopieren(z) {
    try {
      await navigator.clipboard.writeText(setupUrl(z))
      setCopied(z.token)
      setTimeout(() => setCopied(''), 2000)
    } catch {
      alert(setupUrl(z))
    }
  }

  function zuletzt(iso) {
    if (!iso) return t('profil_team_never')
    try {
      const d = new Date(iso)
      return d.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' }) + ' '
          + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    } catch { return iso }
  }

  const rollen = (
      <>
        <option value="MITARBEITER">{t('profil_team_role_staff')}</option>
        <option value="AUSHILFE">{t('profil_team_role_helper')}</option>
        <option value="KIOSK">{t('profil_team_role_kiosk')}</option>
      </>
  )
  // Filiale nur anbieten, wenn es ueberhaupt weitere Standorte gibt.
  const filialen = orte.length > 0 ? (
      <>
        <option value="HAUPT">{t('team_filiale_haupt')}</option>
        {orte.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
      </>
  ) : null

  return (
      <div style={s.card}>
        <h2 style={s.cardTitle}>👥 {t('profil_team_title')}</h2>
        <p style={s.hint}>{t('profil_team_hint')}</p>

        {error && <div style={s.errorBox}>{error}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          {zugaenge.map(z => (
              <div key={z.token} style={{ border: '1.5px solid #e8e8e8', borderRadius: 10, padding: 12 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <input key={z.label} style={{ ...s.input, marginBottom: 0, flex: 1, minWidth: 140 }}
                         defaultValue={z.label} maxLength={40} aria-label={t('profil_team_name')}
                         onBlur={e => umbenennen(z, e.target.value)} />
                  <select style={{ ...s.input, marginBottom: 0, width: 'auto' }} value={z.rolle}
                          onChange={e => aendern(z, { rolle: e.target.value })}>
                    {rollen}
                  </select>
                  {filialen && (
                      <select style={{ ...s.input, marginBottom: 0, width: 'auto' }} value={z.ortId || 'HAUPT'}
                              aria-label={t('team_filiale')} onChange={e => aendern(z, { ortId: e.target.value })}>
                        {filialen}
                      </select>
                  )}
                </div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 8 }}>
                  {t('profil_team_last_used')}: {zuletzt(z.zuletzt)} · {t('profil_team_stamps7', { n: z.stempel7d })}
                  {z.ortLabel && orte.length > 0 && <> · {t('team_filiale')}: {z.ortId === 'HAUPT' ? t('team_filiale_haupt') : z.ortLabel}</>}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button type="button" style={{ ...s.btnSecondary, flex: 1 }} onClick={() => linkKopieren(z)}>
                    {copied === z.token ? t('scanner_setup_copied') : t('profil_team_copy_link')}
                  </button>
                  <button type="button" style={{ ...s.btnSecondary, color: '#c00', background: '#fff0f0' }}
                          onClick={() => entfernen(z)}>
                    {t('profil_team_delete')}
                  </button>
                </div>
              </div>
          ))}
        </div>

        <form onSubmit={anlegen} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input style={{ ...s.input, marginBottom: 0, flex: 1, minWidth: 140 }} value={label} maxLength={40}
                 onChange={e => setLabel(e.target.value)} placeholder={t('profil_staff_placeholder')} required />
          <select style={{ ...s.input, marginBottom: 0, width: 'auto' }} value={rolle}
                  onChange={e => setRolle(e.target.value)}>
            {rollen}
          </select>
          {filialen && (
              <select style={{ ...s.input, marginBottom: 0, width: 'auto' }} value={ortId}
                      aria-label={t('team_filiale')} onChange={e => setOrtId(e.target.value)}>
                {filialen}
              </select>
          )}
          <button style={s.btnPrimary} type="submit" disabled={busy}>{t('profil_team_create')}</button>
        </form>
        <p style={{ ...s.hint, margin: '12px 0 0' }}>{t('profil_team_roles_hint')}</p>
        {kioskSperre != null && (
            <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid #eee' }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{t('team_kiosk_title')}</div>
              <p style={{ ...s.hint, margin: '0 0 10px' }}>{t('team_kiosk_hint')}</p>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}>
                {t('team_kiosk_sperre')}
                <select style={{ ...s.input, marginBottom: 0, width: 'auto' }} value={kioskSperre}
                        onChange={e => kioskSperreSetzen(Number(e.target.value))}>
                  {[1, 2, 3, 4, 6, 12, 24].map(h => (
                      <option key={h} value={h}>{h === 1 ? t('team_kiosk_stunde') : t('team_kiosk_stunden', { n: h })}</option>
                  ))}
                </select>
              </label>
            </div>
        )}
      </div>
  )
}

const s = {
  card: { background: 'white', borderRadius: 12, padding: 20, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  cardTitle: { fontSize: 16, fontWeight: 600, margin: '0 0 16px', color: '#1a1a1a' },
  errorBox: { background: '#fff0f0', color: '#c00', padding: 10, borderRadius: 8, fontSize: 14, marginBottom: 12 },
  input: { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 12 },
  btnPrimary: { background: '#3C3489', color: 'white', border: 'none', borderRadius: 10, padding: '12px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  btnSecondary: { background: '#f0eeff', color: '#3C3489', border: 'none', borderRadius: 10, padding: '10px 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  hint: { fontSize: 13, color: '#888', margin: '12px 0 0' },
}
