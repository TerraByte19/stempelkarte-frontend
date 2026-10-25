import { useEffect, useState } from 'react'
import api from '../api'
import { useLang } from '../LangContext'
import Icon from '../components/Icon'

export default function Profil() {
  const { t } = useLang()
  const [shop, setShop] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [name, setName] = useState('')

  useEffect(() => {
    api.get('/api/shop/me')
        .then(res => {
          setShop(res.data)
          setName(res.data.name)
        })
        .catch(() => {})
  }, [])

  async function saveName(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await api.put('/api/shop/me', { name })
      const shopLocal = JSON.parse(localStorage.getItem('shop') || '{}')
      localStorage.setItem('shop', JSON.stringify({ ...shopLocal, name }))
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      alert(t('profil_save_error'))
    } finally {
      setLoading(false)
    }
  }

  if (!shop) return <div style={s.loading}>{t('common_loading')}</div>

  return (
      <div style={s.page}>
        <h1 style={s.title}>{t('profil_title')}</h1>
        <p style={s.subtitle}>{shop.name}</p>

        <div style={s.card}>
          <h2 style={s.cardTitle}>{t('profil_shop_name')}</h2>
          {saved && <div style={{...s.success, display:'inline-flex', alignItems:'center', gap:6}}><Icon name="check" size={15} strokeWidth={2.4}/>{t('profil_saved')}</div>}
          <form onSubmit={saveName}>
            <input style={s.input} value={name} onChange={e => setName(e.target.value)} required />
            <button style={s.btnPrimary} type="submit" disabled={loading}>
              {loading ? t('profil_saving') : t('profil_save')}
            </button>
          </form>
          <p style={s.hint}>{t('profil_design_moved_hint')}</p>
        </div>

        <Sperrbildschirm t={t} shop={shop} />
        <StaffTokens t={t} />
      </div>
  )
}

/**
 * Sperrbildschirm-Erinnerung: ist die Karte voll, bietet iOS sie in Ladennaehe
 * von selbst auf dem Sperrbildschirm an.
 *
 * Der Standort kommt ueber einen Knopf aus dem Browser (navigator.geolocation)
 * - der Ladenbesitzer steht beim Einrichten ohnehin in seinem Laden. Keine
 * Adresse, keine Koordinaten zum Abtippen, kein Karten-Dienst, kein
 * API-Schluessel.
 *
 * Da die Koordinaten nirgends sichtbar sind, muss die Oberflaeche sagen, DASS
 * ein Standort hinterlegt ist - sonst weiss niemand, ob der Knopf etwas getan
 * hat.
 */
function Sperrbildschirm({ t, shop }) {
  const [enabled, setEnabled] = useState(!!shop.lockScreenEnabled)
  // Koordinaten werden bewusst nicht angezeigt, nur gehalten.
  const [koordinaten, setKoordinaten] = useState(
      shop.latitude != null && shop.longitude != null
          ? { latitude: shop.latitude, longitude: shop.longitude }
          : null)
  const [locating, setLocating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  // Eigener Text statt Standardtext. Leer lassen = Standard.
  const [textFull, setTextFull] = useState(shop.lockScreenTextFull || '')
  const [textProgress, setTextProgress] = useState(shop.lockScreenTextProgress || '')

  function standortHolen() {
    if (!navigator.geolocation) {
      setError(t('profil_lock_geo_unsupported'))
      return
    }
    setError('')
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
        pos => {
          setKoordinaten({
            latitude: Number(pos.coords.latitude.toFixed(6)),
            longitude: Number(pos.coords.longitude.toFixed(6)),
          })
          setLocating(false)
        },
        () => {
          setError(t('profil_lock_geo_denied'))
          setLocating(false)
        },
        { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  async function speichern(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await api.put('/api/shop/me/lockscreen', {
        enabled, ...(koordinaten || {}),
        textFull: textFull.trim(),
        textProgress: textProgress.trim(),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err.response?.data?.error || t('profil_save_error'))
    } finally {
      setSaving(false)
    }
  }

  return (
      <div style={s.card}>
        <h2 style={s.cardTitle}>{t('profil_lock_title')}</h2>
        <p style={{ ...s.hint, margin: '0 0 16px' }}>{t('profil_lock_hint')}</p>

        {saved && (
            <div style={{ ...s.success, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Icon name="check" size={15} strokeWidth={2.4} />{t('profil_saved')}
            </div>
        )}
        {error && <div style={s.errorBox}>{error}</div>}

        <form onSubmit={speichern}>
          <label style={s.switchRow}>
            <input type="checkbox" checked={enabled}
                   onChange={e => setEnabled(e.target.checked)}
                   disabled={!koordinaten} />
            <span style={s.switchLabel}>{t('profil_lock_switch')}</span>
          </label>

          {!koordinaten && <p style={s.hint}>{t('profil_lock_needs_location')}</p>}

          <button type="button" style={{ ...s.btnSecondary, width: '100%', margin: '14px 0 0' }}
                  onClick={standortHolen} disabled={locating}>
            {locating ? t('profil_lock_locating')
                : koordinaten ? t('profil_lock_refresh') : t('profil_lock_use_location')}
          </button>

          {koordinaten && (
              <p style={{ ...s.hint, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon name="check" size={14} strokeWidth={2.4} />{t('profil_lock_captured')}
              </p>
          )}

          <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>
              {t('profil_lock_text_title')}
            </div>
            <p style={{ ...s.hint, margin: '0 0 12px' }}>{t('profil_lock_text_hint')}</p>

            <label style={s.label}>{t('profil_lock_text_progress')}</label>
            <input style={s.input} maxLength={120} value={textProgress}
                   onChange={e => setTextProgress(e.target.value)}
                   placeholder={t('profil_lock_text_progress_ph')} />

            <label style={{ ...s.label, marginTop: 12 }}>{t('profil_lock_text_full')}</label>
            <input style={s.input} maxLength={120} value={textFull}
                   onChange={e => setTextFull(e.target.value)}
                   placeholder={t('profil_lock_text_full_ph')} />
          </div>

          <button style={{ ...s.btnPrimary, marginTop: 14 }} type="submit" disabled={saving}>
            {saving ? t('profil_saving') : t('profil_save')}
          </button>
        </form>

        <p style={s.hint}>{t('profil_lock_delay_hint')}</p>
      </div>
  )
}

function StaffTokens({ t }) {
  const [tokens, setTokens] = useState([])
  const [label, setLabel] = useState('')
  const [newToken, setNewToken] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/api/shop/staff-tokens')
        .then(res => setTokens(Array.isArray(res.data) ? res.data : []))
        .catch(() => setTokens([]))
  }, [])

  async function createToken(e) {
    e.preventDefault()
    setError('')
    try {
      const res = await api.post('/api/shop/staff-token', { label })
      setNewToken(res.data.token)
      setLabel('')
      api.get('/api/shop/staff-tokens')
          .then(res => setTokens(Array.isArray(res.data) ? res.data : []))
          .catch(() => {})
    } catch (err) {
      setError(err.response?.data?.error || t('profil_staff_error'))
    }
  }

  return (
      <div style={s.card}>
        <h2 style={s.cardTitle}>{t('profil_staff_title')}</h2>
        <p style={s.hint}>{t('profil_staff_hint')}</p>

        {newToken && (
            <div style={s.tokenBox}>
              <div style={s.tokenLabel}>{t('profil_staff_new_token')}</div>
              <div style={s.tokenValue}>{newToken}</div>
              <button style={s.btnSecondary} onClick={() => {
                navigator.clipboard.writeText(newToken)
                alert(t('profil_staff_copied'))
              }}>{t('profil_staff_copy')}</button>
            </div>
        )}

        {error && <div style={s.errorBox}>{error}</div>}

        <div style={s.tokenList}>
          {tokens.map((tok, i) => (
              <div key={i} style={s.tokenItem}>
                <span style={s.tokenItemLabel}>{tok.label}</span>
                <span style={s.tokenFull}>{tok.token}</span>
              </div>
          ))}
        </div>

        <form onSubmit={createToken}>
          <input style={{ ...s.input, marginBottom: 10 }} value={label}
                 onChange={e => setLabel(e.target.value)} placeholder={t('profil_staff_placeholder')} required />
          <button style={s.btnPrimary} type="submit">{t('profil_staff_create')}</button>
        </form>
      </div>
  )
}

const s = {
  page: { maxWidth: 700, margin: '0 auto' },
  loading: { color: '#888', padding: 40 },
  title: { fontSize: 24, fontWeight: 700, margin: '0 0 4px', color: '#1a1a1a' },
  subtitle: { fontSize: 14, color: '#888', margin: '0 0 24px' },
  card: { background: 'white', borderRadius: 12, padding: 20, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  cardTitle: { fontSize: 16, fontWeight: 600, margin: '0 0 16px', color: '#1a1a1a' },
  success: { background: '#f0fff4', color: '#2C5F2E', padding: '10px 14px', borderRadius: 8, fontSize: 14, marginBottom: 14 },
  errorBox: { background: '#fff0f0', color: '#c00', padding: 10, borderRadius: 8, fontSize: 14, marginBottom: 12 },
  input: { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 12 },
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 6 },
  btnPrimary: { background: '#3C3489', color: 'white', border: 'none', borderRadius: 10, padding: '12px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', width: '100%' },
  btnSecondary: { background: '#f0eeff', color: '#3C3489', border: 'none', borderRadius: 10, padding: '10px 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  hint: { fontSize: 13, color: '#888', margin: '12px 0 0' },
  switchRow: { display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' },
  switchLabel: { fontSize: 14, color: '#1a1a1a', fontWeight: 500 },
  tokenBox: { background: '#f0fff4', borderRadius: 10, padding: 16, marginBottom: 16 },
  tokenLabel: { fontSize: 13, fontWeight: 600, color: '#2C5F2E', marginBottom: 8 },
  tokenValue: { fontFamily: 'monospace', fontSize: 12, color: '#1a1a1a', marginBottom: 10, wordBreak: 'break-all' },
  tokenList: { marginBottom: 16 },
  tokenItem: { padding: '10px 0', borderBottom: '1px solid #f0f0f0', fontSize: 14 },
  tokenItemLabel: { fontWeight: 500, color: '#1a1a1a', display: 'block', marginBottom: 4 },
  tokenFull: { fontFamily: 'monospace', color: '#666', fontSize: 11, wordBreak: 'break-all' },
}