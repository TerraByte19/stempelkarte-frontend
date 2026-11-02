import { useEffect, useRef, useState } from 'react'
import api from '../api'
import { useLang, localeTag } from '../LangContext'

/**
 * Kundenliste: wer hat eine Karte, wie steht sie, wann war er zuletzt da.
 * Eine Zeile pro Kundenkarte - hat jemand zwei Karten, steht er zweimal.
 *
 * Stempel-Korrektur nur bei Stempelkarten und nur, wenn das Geschenk nicht
 * mehr offen ist; alles andere sagt der Server mit seiner Meldung. Punkte
 * korrigiert der Scanner (dort gibt es den Weg schon).
 */
export default function Kunden() {
  const { t, lang } = useLang()
  const [q, setQ] = useState('')
  const [seite, setSeite] = useState(null)     // {items, page, totalPages, totalItems}
  const [loading, setLoading] = useState(true)
  const [fehler, setFehler] = useState('')     // '' | 'alt' | 'allgemein'
  const timer = useRef(null)

  // Der eigentliche Abruf setzt Zustand nur in den Promise-Rueckrufen: beim
  // ersten Laden im Effekt darf vor der Antwort nichts gesetzt werden
  // (react-hooks/set-state-in-effect), und loading startet ohnehin auf true.
  function abrufen(suche, page) {
    return api.get('/api/shop/kunden', { params: { q: suche, page, size: 25 } })
        .then(r => { setSeite(r.data); setFehler('') })
        .catch(e => setFehler(e.response?.status === 404 ? 'alt' : 'allgemein'))
        .finally(() => setLoading(false))
  }

  function laden(suche, page = 0) {
    setLoading(true)
    abrufen(suche, page)
  }

  useEffect(() => { abrufen('', 0) }, [])

  // Suche erst nach kurzer Pause abschicken, nicht bei jedem Buchstaben.
  function suchen(wert) {
    setQ(wert)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => laden(wert, 0), 300)
  }
  useEffect(() => () => clearTimeout(timer.current), [])

  function aktualisiere(kunde) {
    setSeite(s => s && { ...s, items: s.items.map(k => k.customerCardId === kunde.customerCardId ? kunde : k) })
  }

  function datum(iso) {
    if (!iso) return t('kunden_never')
    try {
      return new Date(iso).toLocaleDateString(localeTag(lang), { day: '2-digit', month: '2-digit', year: 'numeric' })
    } catch { return iso }
  }

  return (
      <div>
        <h1 style={s.title}>{t('kunden_title')}</h1>
        <p style={s.subtitle}>{t('kunden_subtitle')}</p>

        <div style={s.card}>
          <div style={s.kopf}>
            <input style={s.suche} value={q} onChange={e => suchen(e.target.value)}
                   placeholder={t('kunden_search_ph')} inputMode="search" />
            {seite && <span style={s.anzahl}>{t('kunden_count', { n: seite.totalItems })}</span>}
          </div>

          {fehler === 'alt' && <p style={s.hinweis}>{t('kunden_backend_old')}</p>}
          {fehler === 'allgemein' && <p style={s.hinweis}>{t('kunden_load_error')}</p>}
          {loading && !seite && <p style={s.hinweis}>{t('common_loading')}</p>}

          {seite && seite.items.length === 0 && !loading && (
              <p style={s.hinweis}>{q.trim() ? t('kunden_empty_search') : t('kunden_empty')}</p>
          )}

          {seite && seite.items.length > 0 && (
              <div style={{ opacity: loading ? 0.6 : 1 }}>
                {seite.items.map(k => (
                    <KundenZeile key={k.customerCardId} kunde={k} t={t} datum={datum} onChange={aktualisiere} />
                ))}
              </div>
          )}

          {seite && seite.totalPages > 1 && (
              <div style={s.seiten}>
                <button style={{ ...s.seitenBtn, opacity: seite.page <= 0 ? 0.4 : 1 }}
                        disabled={seite.page <= 0} onClick={() => laden(q, seite.page - 1)}>
                  {t('common_back')}
                </button>
                <span style={s.seitenInfo}>
                  {t('newsletter_page_info', { page: seite.page + 1, totalPages: seite.totalPages })}
                </span>
                <button style={{ ...s.seitenBtn, opacity: seite.page >= seite.totalPages - 1 ? 0.4 : 1 }}
                        disabled={seite.page >= seite.totalPages - 1} onClick={() => laden(q, seite.page + 1)}>
                  {t('newsletter_next')}
                </button>
              </div>
          )}
        </div>
      </div>
  )
}

function KundenZeile({ kunde, t, datum, onChange }) {
  const [offen, setOffen] = useState(false)
  const [wert, setWert] = useState(kunde.stamps)
  const [saving, setSaving] = useState(false)
  const [meldung, setMeldung] = useState(null)   // {ok, text}

  const punkte = kunde.type === 'POINTS'
  const max = kunde.rewardThreshold
  const darfKorrigieren = !punkte && !kunde.welcomePending
  const voll = !punkte && kunde.stamps >= max

  function oeffnen() {
    setWert(kunde.stamps)
    setMeldung(null)
    setOffen(o => !o)
  }

  async function speichern() {
    const n = Number(wert)
    if (!Number.isInteger(n) || n < 0 || n > max) {
      setMeldung({ ok: false, text: t('kunden_fix_range', { max }) })
      return
    }
    setSaving(true)
    setMeldung(null)
    try {
      const res = await api.put(`/api/shop/kunden/${kunde.customerCardId}/stempel`, { stamps: n })
      onChange(res.data)
      setMeldung({ ok: true, text: t('kunden_fix_ok') })
      setTimeout(() => { setOffen(false); setMeldung(null) }, 1500)
    } catch (e) {
      setMeldung({ ok: false, text: e.response?.data?.error || t('kunden_fix_error') })
    } finally {
      setSaving(false)
    }
  }

  return (
      <div style={s.zeile}>
        <div style={s.zeileKopf}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={s.name}>{kunde.name}</div>
            <div style={s.email}>{kunde.email}</div>
          </div>
          <div style={s.stand}>
            <div style={{ ...s.standWert, color: voll ? '#1e7a4c' : '#3C3489' }}>
              {punkte ? t('kunden_points', { n: kunde.pointsText }) : t('kunden_stand', { n: Math.min(kunde.stamps, max), total: max })}
            </div>
            <div style={s.standKarte}>{kunde.cardName}</div>
          </div>
        </div>

        <div style={s.meta}>
          <span>{t('kunden_last_visit')}: <b>{datum(kunde.lastVisitAt)}</b></span>
          <span>{t('kunden_since')}: {datum(kunde.createdAt)}</span>
          <span>{t('kunden_rewards', { n: kunde.totalRewards })}</span>
          {/* Nur wenn der Laden die Felder abfragt und der Kunde sie ausgefuellt hat. */}
          {kunde.birthday && <span>{t('kunden_birthday')}: {datum(kunde.birthday + 'T12:00:00')}</span>}
          {kunde.phone && <span>{t('kunden_phone')}: <a href={`tel:${kunde.phone}`} style={{ color: '#3C3489' }}>{kunde.phone}</a></span>}
        </div>

        <div style={s.badges}>
          {kunde.welcomePending && <span style={{ ...s.badge, background: '#fbecd2', color: '#9a5d00' }}>{t('kunden_badge_locked')}</span>}
          {voll && <span style={{ ...s.badge, background: '#ddf2e6', color: '#1e7a4c' }}>{t('kunden_badge_full')}</span>}
          {kunde.apple && <span style={s.badge}>{t('kunden_badge_apple')}</span>}
          {kunde.marketingConsent && <span style={s.badge}>{t('kunden_badge_consent')}</span>}
          {!kunde.emailConfirmed && <span style={{ ...s.badge, background: '#f4e1e1', color: '#8a3b3b' }}>{t('kunden_badge_unconfirmed')}</span>}
        </div>

        {darfKorrigieren && (
            <button type="button" style={s.fixBtn} onClick={oeffnen}>
              {offen ? t('kunden_fix_cancel') : t('kunden_fix')}
            </button>
        )}
        {punkte && <p style={s.hint}>{t('kunden_fix_points_hint')}</p>}

        {offen && (
            <div style={s.fixBox}>
              <p style={{ ...s.hint, margin: '0 0 10px' }}>{t('kunden_fix_hint', { max })}</p>
              <div style={s.fixRow}>
                <button type="button" style={s.stepBtn} onClick={() => setWert(w => Math.max(0, Number(w) - 1))} disabled={saving}>−</button>
                <input style={s.fixInput} type="number" min={0} max={max} value={wert}
                       onChange={e => setWert(e.target.value)} />
                <button type="button" style={s.stepBtn} onClick={() => setWert(w => Math.min(max, Number(w) + 1))} disabled={saving}>+</button>
                <span style={s.fixMax}>/ {max}</span>
                <button type="button" style={s.saveBtn} onClick={speichern} disabled={saving || Number(wert) === kunde.stamps}>
                  {saving ? t('profil_saving') : t('kunden_fix_save')}
                </button>
              </div>
              {meldung && (
                  <div style={{ ...s.meldung, background: meldung.ok ? '#f0fff4' : '#fff0f0', color: meldung.ok ? '#2C5F2E' : '#c00' }}>
                    {meldung.text}
                  </div>
              )}
            </div>
        )}
      </div>
  )
}

const s = {
  title: { fontSize: 24, fontWeight: 700, color: '#1a1a1a', margin: '0 0 4px' },
  subtitle: { fontSize: 14, color: '#888', margin: '0 0 20px' },
  card: { background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  kopf: { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 14 },
  suche: { flex: '1 1 220px', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: 14, outline: 'none', boxSizing: 'border-box' },
  anzahl: { fontSize: 13, color: '#888', whiteSpace: 'nowrap' },
  hinweis: { fontSize: 13, color: '#888', margin: '8px 0' },
  zeile: { borderTop: '1px solid #f0f0f0', padding: '14px 0' },
  zeileKopf: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  name: { fontSize: 15, fontWeight: 600, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis' },
  email: { fontSize: 13, color: '#888', overflow: 'hidden', textOverflow: 'ellipsis' },
  stand: { textAlign: 'end', flexShrink: 0 },
  standWert: { fontSize: 15, fontWeight: 700 },
  standKarte: { fontSize: 12, color: '#888' },
  meta: { display: 'flex', flexWrap: 'wrap', gap: '4px 16px', fontSize: 12, color: '#666', marginTop: 8 },
  badges: { display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  badge: { fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6, background: '#f0eeff', color: '#3C3489' },
  hint: { fontSize: 12, color: '#888', margin: '8px 0 0' },
  fixBtn: { display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10, background: '#f0eeff', color: '#3C3489', border: 'none', borderRadius: 8, padding: '8px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  fixBox: { marginTop: 10, padding: 12, background: '#f7f7fb', borderRadius: 10 },
  fixRow: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  stepBtn: { width: 36, height: 36, borderRadius: 8, border: '1.5px solid #e0e0e0', background: 'white', fontSize: 18, cursor: 'pointer' },
  fixInput: { width: 64, height: 36, padding: '0 10px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: 15, textAlign: 'center', boxSizing: 'border-box' },
  fixMax: { fontSize: 14, color: '#888' },
  saveBtn: { marginInlineStart: 'auto', background: '#3C3489', color: 'white', border: 'none', borderRadius: 8, padding: '9px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  meldung: { marginTop: 10, padding: '8px 12px', borderRadius: 8, fontSize: 13 },
  seiten: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 },
  seitenBtn: { background: '#f0eeff', color: '#3C3489', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  seitenInfo: { fontSize: 13, color: '#888' },
}
