import { useEffect, useState } from 'react'
import api from '../api'
import { useLang, localeTag } from '../LangContext'
import { useTarif } from '../tarif'

/**
 * Hauptkonto einer Kette (Tarif Kette): Filialen ein-/ausschalten und
 * umbenennen, Liste einfuegen (mit Vorschau), Logins der Filialen,
 * Protokoll der Korrekturen. Fuer jeden anderen Tarif bleibt der Block weg.
 * onGeaendert: die Standort-Liste darunter neu laden.
 */
export default function KettenSection({ onGeaendert }) {
  const tarif = useTarif()
  if (tarif?.tarif !== 'KETTE') return null
  return <Kette onGeaendert={onGeaendert} />
}

function Kette({ onGeaendert }) {
  const { t, lang } = useLang()
  const [stand, setStand] = useState(null)
  const [logins, setLogins] = useState([])
  const [protokoll, setProtokoll] = useState([])
  const [fehler, setFehler] = useState('')
  const [meldung, setMeldung] = useState('')

  function ladeLogins() {
    api.get('/api/shop/filial-zugaenge').then(r => setLogins(Array.isArray(r.data) ? r.data : [])).catch(() => {})
  }

  useEffect(() => {
    api.get('/api/shop/me/orte').then(r => setStand(r.data)).catch(() => setFehler(t('kette_ladefehler')))
    ladeLogins()
    api.get('/api/shop/filialen/korrekturen').then(r => setProtokoll(Array.isArray(r.data) ? r.data : [])).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const text = err => err?.response?.data?.error || t('kette_fehler')

  async function tun(aufruf, ok) {
    setFehler('')
    setMeldung('')
    try {
      const r = await aufruf()
      if (ok) setMeldung(ok)
      return r
    } catch (err) {
      setFehler(text(err))
      return null
    }
  }

  async function orte(aufruf, ok) {
    const r = await tun(aufruf, ok)
    if (r) { setStand(r.data); ladeLogins(); onGeaendert?.() }
    return r
  }

  function umbenennen(o) {
    const neu = window.prompt(t('kette_fil_rename_prompt'), o.label)
    if (neu && neu.trim() && neu.trim() !== o.label) orte(() => api.put(`/api/shop/me/orte/${o.id}`, { label: neu.trim() }))
  }

  function datum(iso) {
    try { return new Date(iso).toLocaleDateString(localeTag(lang), { day: '2-digit', month: '2-digit', year: 'numeric' }) }
    catch { return '' }
  }

  if (!stand) return fehler ? <div style={s.fehler}>{fehler}</div> : null
  const liste = Array.isArray(stand.orte) ? stand.orte : []
  const aktiv = liste.filter(o => o.aktiv).length + (stand.hauptIstFiliale ? 1 : 0)

  return (
      <>
        {fehler && <div style={s.fehler}>{fehler}</div>}
        {meldung && <div style={s.ok}>{meldung}</div>}

        <div style={s.card}>
          <h2 style={s.title}>{t('kette_fil_title')}</h2>
          <p style={s.hint}>{t('kette_fil_hint')}</p>
          <div style={s.usage}>{t('kette_fil_aktiv_n', { aktiv, alle: liste.length + 1 })}</div>

          <label style={s.zeile}>
            <span style={s.name}>
              <span style={{ fontWeight: 600 }}>{t('kette_haupt_label')}</span>
              <span style={s.meta}>{t('kette_haupt_hint')}</span>
            </span>
            <Schalter an={stand.hauptIstFiliale} t={t}
                      onClick={() => orte(() => api.put('/api/shop/me/orte/haupt', { filiale: !stand.hauptIstFiliale }))} />
          </label>

          {liste.length === 0 && <p style={s.hint}>{t('kette_fil_leer')}</p>}
          {liste.map(o => (
              <div key={o.id} style={{ ...s.zeile, opacity: o.aktiv ? 1 : 0.65 }}>
                <span style={s.name}>
                  <span style={{ fontWeight: 600 }}>{o.label}</span>
                  {o.adresse && <span style={s.meta}>{o.adresse}</span>}
                </span>
                <button type="button" style={s.btn} onClick={() => umbenennen(o)}>{t('kette_fil_rename')}</button>
                <Schalter an={o.aktiv} t={t}
                          onClick={() => orte(() => api.put(`/api/shop/me/orte/${o.id}`, { aktiv: !o.aktiv }))} />
              </div>
          ))}
        </div>

        <ListeEinfuegen t={t} text={text}
                        onGespeichert={r => { setStand(r.data); setMeldung(t('kette_liste_gespeichert')); onGeaendert?.() }} />

        <Logins t={t} liste={liste} logins={logins} hauptIstFiliale={stand.hauptIstFiliale} datum={datum}
                tun={tun} neuLaden={ladeLogins} />

        <div style={s.card}>
          <h2 style={s.title}>{t('kette_prot_title')}</h2>
          {protokoll.length === 0 ? <p style={s.hint}>{t('kette_prot_leer')}</p> : protokoll.slice(0, 30).map((k, i) => (
              <div key={i} style={s.zeile}>
                <span style={s.name}>
                  <span style={{ fontWeight: 600 }}>{k.ortLabel}</span>
                  <span style={s.meta}>{datum(k.wann)} · {k.wer}</span>
                </span>
                <span style={{ fontSize: 13, color: '#444' }}>{t('kette_prot_zeile', { von: k.vorher, nach: k.nachher })}</span>
              </div>
          ))}
        </div>
      </>
  )
}

function Schalter({ an, onClick, t }) {
  return (
      <button type="button" onClick={onClick} aria-pressed={an}
              style={{ ...s.schalter, background: an ? '#ddf2e6' : '#f0f0f0', color: an ? '#1e7a4c' : '#777' }}>
        {an ? t('kette_fil_an') : t('kette_fil_aus')}
      </button>
  )
}

/** Liste einfuegen: erst pruefen (Orte suchen), dann speichern - alles oder nichts. */
function ListeEinfuegen({ t, text, onGespeichert }) {
  const [roh, setRoh] = useState('')
  const [zeilen, setZeilen] = useState(null)
  const [laeuft, setLaeuft] = useState(false)
  const [fehler, setFehler] = useState('')

  async function pruefen() {
    setLaeuft(true)
    setFehler('')
    setZeilen(null)
    try {
      const r = await api.post('/api/shop/me/orte/vorschau', { text: roh }, { timeout: 120000 })
      setZeilen(Array.isArray(r.data) ? r.data : [])
    } catch (err) { setFehler(text(err)) } finally { setLaeuft(false) }
  }

  async function speichern() {
    setLaeuft(true)
    setFehler('')
    try {
      const r = await api.post('/api/shop/me/orte/sammel', {
        zeilen: zeilen.map(z => ({ label: z.label, adresse: z.adresse, latitude: z.latitude, longitude: z.longitude })),
      })
      setRoh('')
      setZeilen(null)
      onGespeichert(r)
    } catch (err) { setFehler(text(err)) } finally { setLaeuft(false) }
  }

  const kaputt = zeilen ? zeilen.filter(z => z.fehler).length : 0

  return (
      <div style={s.card}>
        <h2 style={s.title}>{t('kette_liste_title')}</h2>
        <p style={s.hint}>{t('kette_liste_hint')}</p>
        {fehler && <div style={s.fehler}>{fehler}</div>}
        <textarea style={s.textarea} rows={5} value={roh} placeholder={t('kette_liste_placeholder')}
                  onChange={e => { setRoh(e.target.value); setZeilen(null) }} />
        <button type="button" style={s.sekundaer} onClick={pruefen} disabled={laeuft || !roh.trim()}>
          {laeuft && !zeilen ? t('kette_liste_prueft') : t('kette_liste_pruefen')}
        </button>
        {zeilen && (
            <div style={{ marginTop: 12 }}>
              {zeilen.map(z => (
                  <div key={z.nr} style={s.zeile}>
                    <span style={s.name}>
                      <span style={{ fontWeight: 600 }}>{z.label || `#${z.nr}`}</span>
                      <span style={{ ...s.meta, color: z.fehler ? '#c0392b' : '#999' }}>{z.fehler || z.gefunden || t('kette_liste_ok')}</span>
                    </span>
                  </div>
              ))}
              {kaputt > 0
                  ? <div style={s.fehler}>{t('kette_liste_fehler_n', { n: kaputt })}</div>
                  : zeilen.length > 0 && (
                      <button type="button" style={s.primaer} onClick={speichern} disabled={laeuft}>
                        {t('kette_liste_speichern', { n: zeilen.length })}
                      </button>
                  )}
            </div>
        )}
      </div>
  )
}

function Logins({ t, liste, logins, hauptIstFiliale, datum, tun, neuLaden }) {
  const [name, setName] = useState('')
  const [pw, setPw] = useState('')
  const [ortId, setOrtId] = useState('')
  const ziele = [...(hauptIstFiliale ? [{ id: 'HAUPT', label: t('team_filiale_haupt') }] : []), ...liste]
  const ziel = ortId || ziele[0]?.id || ''

  async function anlegen(e) {
    e.preventDefault()
    const r = await tun(() => api.post('/api/shop/filial-zugaenge', { benutzername: name, passwort: pw, ortId: ziel }))
    if (r) { setName(''); setPw(''); neuLaden() }
  }

  async function passwort(l) {
    const neu = window.prompt(t('kette_login_pw_prompt', { name: l.benutzername }))
    if (!neu) return
    if (await tun(() => api.put(`/api/shop/filial-zugaenge/${l.id}/passwort`, { passwort: neu }), t('kette_login_pw_ok'))) neuLaden()
  }

  async function sperre(l) {
    if (await tun(() => api.put(`/api/shop/filial-zugaenge/${l.id}/sperre`, { gesperrt: !l.gesperrt }))) neuLaden()
  }

  async function loeschen(l) {
    if (!window.confirm(t('kette_login_delete_confirm', { name: l.benutzername }))) return
    if (await tun(() => api.delete(`/api/shop/filial-zugaenge/${l.id}`))) neuLaden()
  }

  return (
      <div style={s.card}>
        <h2 style={s.title}>{t('kette_login_title')}</h2>
        <p style={s.hint}>{t('kette_login_hint')}</p>
        {logins.length === 0 && <p style={s.hint}>{t('kette_login_leer')}</p>}
        {logins.map(l => (
            <div key={l.id} style={{ ...s.zeile, flexWrap: 'wrap' }}>
              <span style={s.name}>
                <span style={{ fontWeight: 600 }}>
                  {l.benutzername}
                  {l.gesperrt && <span style={s.gesperrt}> · {t('kette_login_gesperrt')}</span>}
                </span>
                <span style={s.meta}>
                  {l.ortId === 'HAUPT' ? t('team_filiale_haupt') : l.ortLabel} · {l.zuletztEingeloggt ? t('kette_login_zuletzt', { datum: datum(l.zuletztEingeloggt) }) : t('kette_login_nie')}
                </span>
              </span>
              <button type="button" style={s.btn} onClick={() => passwort(l)}>{t('kette_login_pw_neu')}</button>
              <button type="button" style={s.btn} onClick={() => sperre(l)}>{l.gesperrt ? t('kette_login_freigeben') : t('kette_login_sperren')}</button>
              <button type="button" style={{ ...s.btn, color: '#c0392b' }} onClick={() => loeschen(l)}>{t('kette_login_delete')}</button>
            </div>
        ))}

        {ziele.length > 0 && (
            <form onSubmit={anlegen} style={s.form}>
              <input style={s.input} value={name} placeholder={t('kette_login_name')} maxLength={40}
                     autoCapitalize="none" autoCorrect="off" autoComplete="off" onChange={e => setName(e.target.value)} />
              <input style={s.input} value={pw} placeholder={t('kette_login_pw')} autoComplete="off"
                     onChange={e => setPw(e.target.value)} />
              <select style={s.input} value={ziel} onChange={e => setOrtId(e.target.value)} aria-label={t('kette_login_filiale')}>
                {ziele.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
              <button type="submit" style={s.primaer} disabled={!name.trim() || pw.length < 8}>{t('kette_login_add')}</button>
            </form>
        )}
      </div>
  )
}

const s = {
  card: { background: 'white', borderRadius: 12, padding: 20, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  title: { fontSize: 16, fontWeight: 600, margin: '0 0 6px', color: '#1a1a1a' },
  hint: { fontSize: 13, color: '#888', margin: '0 0 10px', lineHeight: 1.5 },
  usage: { fontSize: 12, color: '#3C3489', fontWeight: 600, marginBottom: 6 },
  zeile: { display: 'flex', alignItems: 'center', gap: 8, padding: '9px 0', borderTop: '1px solid #f0f0f0' },
  name: { display: 'flex', flexDirection: 'column', flex: 1, minWidth: 140, fontSize: 14, color: '#1a1a1a' },
  meta: { fontSize: 11, color: '#999', fontWeight: 400 },
  gesperrt: { color: '#c0392b', fontWeight: 600, fontSize: 12 },
  btn: { padding: '6px 10px', borderRadius: 8, border: '1.5px solid #e0e0e0', background: 'white', color: '#3C3489', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  schalter: { padding: '6px 14px', borderRadius: 999, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', minWidth: 52 },
  textarea: { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' },
  input: { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit', background: 'white' },
  form: { display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12, padding: 12, background: '#f7f7fb', borderRadius: 10 },
  primaer: { background: '#3C3489', color: 'white', border: 'none', borderRadius: 10, padding: '12px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', marginTop: 8 },
  sekundaer: { background: '#f0eeff', color: '#3C3489', border: 'none', borderRadius: 10, padding: '10px 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', marginTop: 8 },
  fehler: { background: '#fff0f0', color: '#c00', padding: 10, borderRadius: 8, fontSize: 14, marginBottom: 12 },
  ok: { background: '#ddf2e6', color: '#1e7a4c', padding: 10, borderRadius: 8, fontSize: 14, marginBottom: 12 },
}
