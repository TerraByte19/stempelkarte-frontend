import { useEffect, useState } from 'react'
import api from '../api'
import { useLang, localeTag } from '../LangContext'

/**
 * Schnittstelle fuer Kassen, CRM, Zapier: API-Schluessel (einmal sichtbar)
 * und Webhook (Adresse, Geheimnis einmal sichtbar, Test, Zustell-Stand).
 * Vom Admin je Tarif freigeschaltet - sonst nur ein Hinweis. 404 = aelteres
 * Backend, dann bleibt der Block weg.
 */
export default function SchnittstellenSection() {
  const { t, lang } = useLang()
  const [keys, setKeys] = useState(null)       // null = laedt, false = weg, 'gesperrt' = nicht frei
  const [webhook, setWebhook] = useState(null)
  const [label, setLabel] = useState('')
  const [neu, setNeu] = useState(null)          // {label, key} - nur einmal
  const [copied, setCopied] = useState(false)
  const [url, setUrl] = useState('')
  const [secret, setSecret] = useState(null)    // frisch erzeugtes Geheimnis, nur einmal
  const [busy, setBusy] = useState(false)
  const [meldung, setMeldung] = useState(null)

  function laden() {
    api.get('/api/shop/api-keys')
        .then(r => setKeys(Array.isArray(r.data) ? r.data : []))
        .catch(e => setKeys(e.response?.status === 404 ? false : 'gesperrt'))
    api.get('/api/shop/webhook')
        .then(r => { setWebhook(r.data || null); setUrl(r.data?.url || '') })
        .catch(() => setWebhook(null))
  }
  useEffect(laden, [])

  if (keys === null || keys === false) return null

  function datum(iso) {
    try { return new Date(iso).toLocaleDateString(localeTag(lang), { day: '2-digit', month: '2-digit', year: 'numeric' }) }
    catch { return '' }
  }
  function fehler(e) {
    setMeldung({ fehler: true, text: e.response?.data?.message || e.response?.data?.error || t('api_err') })
  }

  async function anlegen(e) {
    e.preventDefault()
    setBusy(true); setMeldung(null)
    try {
      const r = await api.post('/api/shop/api-keys', { label: label.trim() })
      setNeu(r.data); setLabel(''); setCopied(false)
      laden()
    } catch (err) { fehler(err) } finally { setBusy(false) }
  }

  async function widerrufen(k) {
    if (!confirm(t('api_key_revoke_confirm', { label: k.label }))) return
    setMeldung(null)
    try { await api.delete(`/api/shop/api-keys/${k.id}`); laden() } catch (err) { fehler(err) }
  }

  async function kopieren(text) {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }
    catch { alert(text) }
  }

  async function webhookSpeichern(neuesGeheimnis) {
    setBusy(true); setMeldung(null)
    try {
      const r = await api.put('/api/shop/webhook', { url: url.trim(), neuesGeheimnis })
      setWebhook(r.data)
      if (r.data?.secret) setSecret(r.data.secret)
    } catch (err) { fehler(err) } finally { setBusy(false) }
  }

  async function webhookEntfernen() {
    setBusy(true); setMeldung(null)
    try { await api.delete('/api/shop/webhook'); setSecret(null); setUrl(''); laden() }
    catch (err) { fehler(err) } finally { setBusy(false) }
  }

  async function webhookTesten() {
    setBusy(true); setMeldung(null)
    try { await api.post('/api/shop/webhook/test'); setMeldung({ text: t('api_webhook_tested') }); laden() }
    catch (err) { fehler(err) } finally { setBusy(false) }
  }

  return (
      <div style={s.card}>
        <h2 style={s.cardTitle}>🔌 {t('api_title')}</h2>
        <p style={s.hint}>{t('api_hint')}</p>

        {keys === 'gesperrt' ? (
            <div style={s.gesperrt}>{t('api_locked')}</div>
        ) : (
            <>
              <div style={s.abschnitt}>{t('api_keys')}</div>
              {neu && (
                  <div style={s.neuBox}>
                    <div style={s.neuText}>{t('api_key_new')}</div>
                    <code style={s.code}>{neu.key}</code>
                    <button type="button" style={s.btnKlein} onClick={() => kopieren(neu.key)}>
                      {copied ? t('api_key_copied') : t('api_key_copy')}
                    </button>
                  </div>
              )}
              {keys.length === 0 && <p style={s.hint}>{t('api_keys_empty')}</p>}
              {keys.map(k => (
                  <div key={k.id} style={{ ...s.zeile, opacity: k.aktiv ? 1 : 0.5 }}>
                    <span style={s.zeileName}>{k.label} <code style={s.prefix}>{k.prefix}…</code></span>
                    <span style={s.zeileMeta}>{k.aktiv ? (k.zuletzt ? t('api_key_used', { datum: datum(k.zuletzt) }) : t('api_key_never')) : t('api_key_revoked')}</span>
                    {k.aktiv && <button type="button" style={s.btnRot} onClick={() => widerrufen(k)}>{t('api_key_revoke')}</button>}
                  </div>
              ))}
              <form onSubmit={anlegen} style={s.form}>
                <input style={s.input} value={label} maxLength={40} placeholder={t('api_key_label_ph')}
                       onChange={e => setLabel(e.target.value)} required />
                <button type="submit" style={s.btn} disabled={busy}>{t('api_key_create')}</button>
              </form>

              <div style={{ ...s.abschnitt, marginTop: 20 }}>{t('api_webhook')}</div>
              <p style={s.hint}>{t('api_webhook_hint')}</p>
              {secret && (
                  <div style={s.neuBox}>
                    <div style={s.neuText}>{t('api_webhook_secret')}</div>
                    <code style={s.code}>{secret}</code>
                    <button type="button" style={s.btnKlein} onClick={() => kopieren(secret)}>
                      {copied ? t('api_key_copied') : t('api_key_copy')}
                    </button>
                  </div>
              )}
              <div style={s.form}>
                <input style={s.input} value={url} placeholder={t('api_webhook_url_ph')} inputMode="url"
                       onChange={e => setUrl(e.target.value)} />
                <button type="button" style={s.btn} onClick={() => webhookSpeichern(!webhook?.aktiv)} disabled={busy || !url.trim()}>
                  {t('api_webhook_save')}
                </button>
              </div>
              {webhook?.aktiv && (
                  <div style={s.webhookZeile}>
                    <span style={s.zeileMeta}>
                      {t('api_webhook_state', { offen: webhook.offen ?? 0, fehler: webhook.fehler ?? 0 })}
                      {webhook.letzte?.[0]?.am && <> · {t('api_webhook_last', { datum: datum(webhook.letzte[0].am) })}</>}
                    </span>
                    <button type="button" style={s.btnKlein} onClick={webhookTesten} disabled={busy}>{t('api_webhook_test')}</button>
                    <button type="button" style={s.btnKlein} onClick={() => webhookSpeichern(true)} disabled={busy}>{t('api_webhook_new_secret')}</button>
                    <button type="button" style={s.btnRot} onClick={webhookEntfernen} disabled={busy}>{t('api_webhook_remove')}</button>
                  </div>
              )}
            </>
        )}
        {meldung && <div style={{ ...s.meldung, color: meldung.fehler ? '#b23b3b' : '#2d7a3e' }}>{meldung.text}</div>}
      </div>
  )
}

const s = {
  card: { background: 'white', borderRadius: 12, padding: 20, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  cardTitle: { fontSize: 16, fontWeight: 600, margin: '0 0 8px', color: '#1a1a1a' },
  hint: { fontSize: 13, color: '#888', margin: '0 0 12px', lineHeight: 1.5 },
  gesperrt: { background: '#f7f7fb', borderRadius: 10, padding: 14, fontSize: 13, color: '#555' },
  abschnitt: { fontSize: 13, fontWeight: 700, color: '#1a1a1a', marginBottom: 6 },
  neuBox: { background: '#f0fff4', borderRadius: 10, padding: 12, marginBottom: 12 },
  neuText: { fontSize: 12, color: '#2C5F2E', fontWeight: 600, marginBottom: 6 },
  code: { display: 'block', fontFamily: 'monospace', fontSize: 12, wordBreak: 'break-all', marginBottom: 8, color: '#1a1a1a' },
  zeile: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', padding: '8px 0', borderTop: '1px solid #f3f3f3' },
  zeileName: { flex: 1, minWidth: 140, fontSize: 14, fontWeight: 600, color: '#1a1a1a' },
  prefix: { fontFamily: 'monospace', fontSize: 11, color: '#888', fontWeight: 400, marginInlineStart: 6 },
  zeileMeta: { fontSize: 12, color: '#888' },
  form: { display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 },
  input: { flex: 1, minWidth: 180, padding: '10px 12px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: 14, boxSizing: 'border-box' },
  btn: { background: '#3C3489', color: 'white', border: 'none', borderRadius: 10, padding: '10px 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  btnKlein: { background: '#f0eeff', color: '#3C3489', border: 'none', borderRadius: 8, padding: '6px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer' },
  btnRot: { background: '#fff0f0', color: '#c0392b', border: 'none', borderRadius: 8, padding: '6px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer' },
  webhookZeile: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 10 },
  meldung: { fontSize: 13, marginTop: 10 },
}
