import { useEffect, useState } from 'react'
import api from '../api'
import { useLang, localeTag } from '../LangContext'
import { GRUPPEN } from '../kundengruppen'

const TEXT_MAX = 160
const NAME_MAX = 40
const LEER = { name: '', ausloeser: 'KEIN_BESUCH_SEIT', wert: 21, cardId: '', gruppe: '', text: '', aktiv: true }

/**
 * Baukasten fuer eigene Automationen (Backend AutomationService): Liste mit
 * Pause-Schalter und "trifft gerade n", dazu ein Formular zum Anlegen und
 * Bearbeiten. Die Ausloeser kommen vom Server (Schluessel plus Bereich),
 * ihre Namen aus den Texten hier.
 */
export default function AutomationenSection() {
  const { t, lang } = useLang()
  const [liste, setListe] = useState(null)       // null = laedt, false = kein Endpunkt
  const [ausloeser, setAusloeser] = useState([])
  const [karten, setKarten] = useState([])
  const [form, setForm] = useState(null)         // null = zu; { id?, ...Felder }
  const [busy, setBusy] = useState(false)
  const [fehler, setFehler] = useState(null)

  function laden() {
    api.get('/api/shop/automationen')
        .then(r => setListe(Array.isArray(r.data) ? r.data : []))
        .catch(() => setListe(false))
  }

  useEffect(() => {
    laden()
    api.get('/api/shop/automationen/ausloeser')
        .then(r => setAusloeser(Array.isArray(r.data) ? r.data : []))
        .catch(() => setAusloeser([]))
    api.get('/api/shop/cards')
        .then(r => setKarten(Array.isArray(r.data) ? r.data : []))
        .catch(() => setKarten([]))
  }, [])

  if (liste === null || liste === false) return null

  function trigName(key, fallback) {
    const k = `autom_trig_${key}`
    const n = t(k)
    return n === k ? (fallback || key) : n
  }
  function trigEinheit(key, fallback) {
    const k = `autom_unit_${key}`
    const n = t(k)
    return n === k ? (fallback || '') : n
  }
  const trig = key => ausloeser.find(a => a.key === key)

  function datum(iso) {
    try { return new Date(iso).toLocaleDateString(localeTag(lang), { day: '2-digit', month: '2-digit', year: 'numeric' }) }
    catch { return '' }
  }

  function oeffnen(a) {
    setFehler(null)
    setForm(a ? { id: a.id, name: a.name, ausloeser: a.ausloeser, wert: a.wert, cardId: a.cardId || '',
                  gruppe: a.gruppe || '', text: a.text, aktiv: a.aktiv }
              : { ...LEER })
  }

  async function speichern() {
    if (!form) return
    const body = { name: form.name, ausloeser: form.ausloeser, wert: Number(form.wert),
                   cardId: form.cardId, gruppe: form.gruppe, text: form.text, aktiv: form.aktiv }
    setBusy(true); setFehler(null)
    try {
      if (form.id) await api.put(`/api/shop/automationen/${form.id}`, body)
      else await api.post('/api/shop/automationen', body)
      setForm(null)
      laden()
    } catch (e) {
      setFehler(e.response?.data?.message || e.response?.data?.error || t('autom_err'))
    } finally { setBusy(false) }
  }

  async function pausieren(a) {
    try {
      await api.put(`/api/shop/automationen/${a.id}`, { aktiv: !a.aktiv })
      laden()
    } catch { /* Liste bleibt, naechster Versuch */ }
  }

  async function loeschen(a) {
    if (!window.confirm(t('autom_delete_confirm', { name: a.name }))) return
    try {
      await api.delete(`/api/shop/automationen/${a.id}`)
      laden()
    } catch { /* bleibt stehen */ }
  }

  const gewaehlt = form ? trig(form.ausloeser) : null

  return (
      <div style={s.card}>
        <div style={s.kopfzeile}>
          <div>
            <h2 style={s.title}>🧩 {t('autom_title')}</h2>
            <p style={s.hint}>{t('autom_hint')}</p>
          </div>
          {!form && <button type="button" style={s.btn} onClick={() => oeffnen(null)}>{t('autom_new')}</button>}
        </div>

        {form && (
            <div style={s.form}>
              <label style={s.label}>{t('autom_name')}
                <input value={form.name} maxLength={NAME_MAX} placeholder={t('autom_name_ph')}
                       onChange={e => setForm({ ...form, name: e.target.value })} style={s.input} />
              </label>
              <div style={s.zweiSpalten}>
                <label style={s.label}>{t('autom_trigger')}
                  <select value={form.ausloeser} style={s.input}
                          onChange={e => { const a = trig(e.target.value); setForm({ ...form, ausloeser: e.target.value, wert: a ? Math.min(Math.max(form.wert, a.min), a.max) : form.wert }) }}>
                    {ausloeser.map(a => <option key={a.key} value={a.key}>{trigName(a.key, a.titel)}</option>)}
                  </select>
                </label>
                <label style={s.label}>{t('autom_value')} {gewaehlt && <span style={s.einheit}>({trigEinheit(gewaehlt.key, gewaehlt.einheit)})</span>}
                  <input type="number" value={form.wert} min={gewaehlt?.min ?? 0} max={gewaehlt?.max ?? 365}
                         onChange={e => setForm({ ...form, wert: e.target.value })} style={s.input} />
                  {gewaehlt && <span style={s.bereich}>{t('autom_range', { min: gewaehlt.min, max: gewaehlt.max })}</span>}
                </label>
              </div>
              <div style={s.zweiSpalten}>
                <label style={s.label}>{t('autom_card')}
                  <select value={form.cardId} onChange={e => setForm({ ...form, cardId: e.target.value })} style={s.input}>
                    <option value="">{t('autom_card_all')}</option>
                    {karten.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
                  </select>
                </label>
                <label style={s.label}>{t('autom_group')}
                  <select value={form.gruppe} onChange={e => setForm({ ...form, gruppe: e.target.value })} style={s.input}>
                    <option value="">{t('autom_group_all')}</option>
                    {GRUPPEN.map(g => <option key={g} value={g}>{t(`kunden_gruppe_${g}`)}</option>)}
                  </select>
                </label>
              </div>
              <label style={s.label}>{t('autom_text')}
                <textarea value={form.text} maxLength={TEXT_MAX} rows={2} placeholder={t('autom_text_ph')}
                          onChange={e => setForm({ ...form, text: e.target.value })} style={{ ...s.input, resize: 'vertical', fontFamily: 'inherit' }} />
                <span style={s.bereich}>{form.text.length}/{TEXT_MAX} · {t('auto_placeholders')}</span>
              </label>
              {fehler && <div style={s.fehler}>{fehler}</div>}
              <div style={s.reihe}>
                <button type="button" style={s.btn} onClick={speichern}
                        disabled={busy || !form.name.trim() || !form.text.trim()}>{t('autom_save')}</button>
                <button type="button" style={s.btnSekundaer} onClick={() => setForm(null)} disabled={busy}>{t('autom_cancel')}</button>
              </div>
            </div>
        )}

        {liste.length === 0 && !form && <div style={s.leer}>{t('autom_empty')}</div>}

        <div style={s.liste}>
          {liste.map(a => (
              <div key={a.id} style={{ ...s.zeile, opacity: a.aktiv ? 1 : 0.65 }}>
                <div style={s.zeileKopf}>
                  <div style={s.name}>{a.name}</div>
                  <span style={{ ...s.badge, ...(a.aktiv ? s.badgeAn : {}) }}>{a.aktiv ? t('autom_active') : t('autom_paused')}</span>
                </div>
                <div style={s.regel}>
                  {trigName(a.ausloeser, a.ausloeserTitel)}: <b>{a.wert}</b> {trigEinheit(a.ausloeser, '')}
                  {a.cardId && <> · {karten.find(k => k.id === a.cardId)?.name || a.cardId}</>}
                  {a.gruppe && <> · {t(`kunden_gruppe_${a.gruppe}`)}</>}
                </div>
                <div style={s.text}>„{a.text}“</div>
                <div style={s.meta}>
                  {t('autom_hits', { n: a.trifftJetzt ?? 0 })} · {t('autom_sent', { n: a.gesendet ?? 0 })} · {a.zuletzt ? t('autom_last', { datum: datum(a.zuletzt) }) : t('autom_never')}
                </div>
                <div style={s.reihe}>
                  <button type="button" style={s.btnKlein} onClick={() => pausieren(a)}>{a.aktiv ? t('autom_pause') : t('autom_resume')}</button>
                  <button type="button" style={s.btnKlein} onClick={() => oeffnen(a)}>{t('autom_edit')}</button>
                  <button type="button" style={{ ...s.btnKlein, color: '#b23b3b' }} onClick={() => loeschen(a)}>{t('autom_delete')}</button>
                </div>
              </div>
          ))}
        </div>
      </div>
  )
}

const s = {
  card: { background: 'white', borderRadius: 12, padding: 24, marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  kopfzeile: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' },
  title: { fontSize: 16, fontWeight: 600, margin: '0 0 6px', color: '#1a1a1a' },
  hint: { fontSize: 13, color: '#888', margin: '0 0 14px', lineHeight: 1.5 },
  form: { background: '#faf9ff', border: '1.5px solid #e4e0f7', borderRadius: 10, padding: 14, marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 10 },
  zweiSpalten: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 },
  label: { display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, fontWeight: 600, color: '#555' },
  input: { width: '100%', boxSizing: 'border-box', padding: '9px 10px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: 14, fontWeight: 400, color: '#1a1a1a', background: 'white' },
  einheit: { fontWeight: 400, color: '#888' },
  bereich: { fontSize: 11, color: '#999', fontWeight: 400 },
  fehler: { fontSize: 13, color: '#b23b3b' },
  reihe: { display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 },
  btn: { background: '#3C3489', color: 'white', border: 'none', borderRadius: 10, padding: '10px 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  btnSekundaer: { background: 'white', color: '#3C3489', border: '1.5px solid #c9c4ee', borderRadius: 10, padding: '10px 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  btnKlein: { background: '#f5f5f7', color: '#3C3489', border: 'none', borderRadius: 8, padding: '6px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer' },
  leer: { fontSize: 13, color: '#999', lineHeight: 1.5 },
  liste: { display: 'flex', flexDirection: 'column', gap: 10 },
  zeile: { border: '1.5px solid #ececec', borderRadius: 10, padding: '12px 14px' },
  zeileKopf: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  name: { fontSize: 14, fontWeight: 600, color: '#1a1a1a' },
  badge: { fontSize: 11, fontWeight: 700, borderRadius: 999, padding: '3px 9px', background: '#f0f0f0', color: '#777' },
  badgeAn: { background: '#e6f4ea', color: '#2d7a3e' },
  regel: { fontSize: 13, color: '#444', marginTop: 4 },
  text: { fontSize: 13, color: '#1a1a1a', marginTop: 4 },
  meta: { fontSize: 12, color: '#888', marginTop: 6 },
}
