import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../api'
import { useLang, localeTag } from '../LangContext'
import { GRUPPEN, GRUPPEN_FARBEN, istGruppe } from '../kundengruppen'

/**
 * Kundenliste: wer hat eine Karte, wie steht sie, wann war er zuletzt da,
 * in welcher Gruppe steht er. Eine Zeile pro Kundenkarte - hat jemand zwei
 * Karten, steht er zweimal.
 *
 * Gruppen-Chips ueber der Liste filtern; ?gruppe= in der URL, damit das
 * Dashboard herverlinken kann. Ein aelteres Backend kennt die Gruppen
 * nicht (404 auf /gruppen) - dann bleiben die Chips weg.
 *
 * Stempel-Korrektur nur bei Stempelkarten und nur, wenn das Geschenk nicht
 * mehr offen ist; alles andere sagt der Server mit seiner Meldung. Punkte
 * korrigiert der Scanner (dort gibt es den Weg schon).
 */
export default function Kunden() {
  const { t, lang } = useLang()
  const [params, setParams] = useSearchParams()
  const gruppe = istGruppe(params.get('gruppe')) ? params.get('gruppe') : ''
  const [q, setQ] = useState('')
  const [seite, setSeite] = useState(null)     // {items, page, totalPages, totalItems}
  const [zahlen, setZahlen] = useState(null)   // {NEU: n, ...} oder null = unbekannt
  const [loading, setLoading] = useState(true)
  const [fehler, setFehler] = useState('')     // '' | 'alt' | 'allgemein'
  const timer = useRef(null)

  // Der eigentliche Abruf setzt Zustand nur in den Promise-Rueckrufen: beim
  // ersten Laden im Effekt darf vor der Antwort nichts gesetzt werden
  // (react-hooks/set-state-in-effect), und loading startet ohnehin auf true.
  function abrufen(suche, page, g) {
    return api.get('/api/shop/kunden', { params: { q: suche, page, size: 25, gruppe: g || '' } })
        .then(r => { setSeite(r.data); setFehler('') })
        .catch(e => setFehler(e.response?.status === 404 ? 'alt' : 'allgemein'))
        .finally(() => setLoading(false))
  }

  function zahlenLaden() {
    return api.get('/api/shop/kunden/gruppen')
        .then(r => setZahlen(r.data?.zahlen && typeof r.data.zahlen === 'object' ? r.data.zahlen : null))
        .catch(() => setZahlen(null))
  }

  function laden(suche, page = 0, g = gruppe) {
    setLoading(true)
    abrufen(suche, page, g)
  }

  // Beim ersten Aufruf gilt die Gruppe aus der URL (Link vom Dashboard).
  useEffect(() => { abrufen('', 0, gruppe); zahlenLaden() }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  // Suche erst nach kurzer Pause abschicken, nicht bei jedem Buchstaben.
  function suchen(wert) {
    setQ(wert)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => laden(wert, 0), 300)
  }
  useEffect(() => () => clearTimeout(timer.current), [])

  function gruppeWaehlen(g) {
    setParams(g ? { gruppe: g } : {}, { replace: true })
    laden(q, 0, g)
  }

  // Bewusst kein CSV-Export: die Datei laege dann auf dem Laptop des Ladens
  // und umginge die Regel, dass Werbung nur an Kunden mit Einwilligung geht.

  function aktualisiere(kunde) {
    setSeite(s => s && { ...s, items: s.items.map(k => k.customerCardId === kunde.customerCardId ? kunde : k) })
    // Eine Korrektur kann die Gruppe aendern (Stammgast ab n Besuchen).
    zahlenLaden()
  }

  const gesamtZahl = zahlen ? GRUPPEN.reduce((sum, g) => sum + (Number(zahlen[g]) || 0), 0) : 0

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

          {zahlen && (
              <div style={s.chips}>
                <button type="button" onClick={() => gruppeWaehlen('')}
                        style={{ ...s.chip, ...(gruppe ? {} : s.chipAktiv) }}>
                  {t('kunden_gruppe_all')} <span style={s.chipZahl}>{gesamtZahl}</span>
                </button>
                {GRUPPEN.map(g => (
                    <button key={g} type="button" onClick={() => gruppeWaehlen(g)}
                            style={{ ...s.chip, ...GRUPPEN_FARBEN[g], ...(gruppe === g ? s.chipAktiv : {}) }}>
                      {t(`kunden_gruppe_${g}`)} <span style={s.chipZahl}>{Number(zahlen[g]) || 0}</span>
                    </button>
                ))}
                <Link to="/profil" style={s.regeln}>{t('kunden_gruppe_rules')}</Link>
              </div>
          )}

          {fehler === 'alt' && <p style={s.hinweis}>{t('kunden_backend_old')}</p>}
          {fehler === 'allgemein' && <p style={s.hinweis}>{t('kunden_load_error')}</p>}
          {loading && !seite && <p style={s.hinweis}>{t('common_loading')}</p>}

          {seite && seite.items.length === 0 && !loading && (
              <p style={s.hinweis}>
                {q.trim() ? t('kunden_empty_search') : gruppe ? t('kunden_empty_group') : t('kunden_empty')}
              </p>
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

const PAKET_REST_MAX = 500

function KundenZeile({ kunde, t, datum, onChange }) {
  const [offen, setOffen] = useState(false)
  const [wert, setWert] = useState(kunde.stamps)
  const [saving, setSaving] = useState(false)
  const [meldung, setMeldung] = useState(null)   // {ok, text}

  // Vier Kartentypen: Stempel (Stand von Hand setzbar), Punkte (korrigiert
  // der Scanner), Mitglied (zaehlt Besuche, nichts zu korrigieren), 10er
  // (Guthaben setzen und Paket aufladen).
  const punkte = kunde.type === 'POINTS'
  const mitglied = kunde.type === 'MEMBER'
  const paket = kunde.type === 'PACKAGE'
  const stempel = !punkte && !mitglied && !paket
  const max = paket ? PAKET_REST_MAX : kunde.rewardThreshold
  const aktuell = paket ? (kunde.paketRest ?? 0) : kunde.stamps
  const darfKorrigieren = (stempel && !kunde.welcomePending) || paket
  const voll = stempel && kunde.stamps >= max

  function oeffnen() {
    setWert(aktuell)
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
      const res = paket
          ? await api.put(`/api/shop/kunden/${kunde.customerCardId}/paket`, { rest: n })
          : await api.put(`/api/shop/kunden/${kunde.customerCardId}/stempel`, { stamps: n })
      onChange(res.data)
      setMeldung({ ok: true, text: t('kunden_fix_ok') })
      setTimeout(() => { setOffen(false); setMeldung(null) }, 1500)
    } catch (e) {
      setMeldung({ ok: false, text: e.response?.data?.error || e.response?.data?.message || t('kunden_fix_error') })
    } finally {
      setSaving(false)
    }
  }

  async function aufladen() {
    if (!confirm(t('kunden_paket_topup_confirm', { n: kunde.rewardThreshold }))) return
    setSaving(true)
    setMeldung(null)
    try {
      const res = await api.post(`/api/shop/kunden/${kunde.customerCardId}/aufladen`)
      onChange(res.data)
      setMeldung({ ok: true, text: t('kunden_paket_topup_ok', { n: res.data?.paketRest ?? 0 }) })
      setTimeout(() => setMeldung(null), 2500)
    } catch (e) {
      setMeldung({ ok: false, text: e.response?.data?.error || e.response?.data?.message || t('kunden_fix_error') })
    } finally {
      setSaving(false)
    }
  }

  function standText() {
    if (punkte) return t('kunden_points', { n: kunde.pointsText })
    if (mitglied) return t('kunden_besuche', { n: kunde.stamps })
    if (paket) return t('kunden_paket_rest', { n: kunde.paketRest ?? 0 })
    return t('kunden_stand', { n: Math.min(kunde.stamps, max), total: max })
  }

  return (
      <div style={s.zeile}>
        <div style={s.zeileKopf}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={s.name}>{kunde.name}</div>
            <div style={s.email}>{kunde.email}</div>
          </div>
          <div style={s.stand}>
            <div style={{ ...s.standWert, color: voll ? '#1e7a4c' : (paket && !(kunde.paketRest > 0)) ? '#b23b3b' : '#3C3489' }}>
              {standText()}
            </div>
            <div style={s.standKarte}>{kunde.cardName}</div>
          </div>
        </div>

        <div style={s.meta}>
          <span>{t('kunden_last_visit')}: <b>{datum(kunde.lastVisitAt)}</b></span>
          <span>{t('kunden_since')}: {datum(kunde.createdAt)}</span>
          {!mitglied && !paket && <span>{t('kunden_rewards', { n: kunde.totalRewards })}</span>}
          {paket && <span>{t('kunden_paket_gekauft', { n: kunde.paketeGekauft ?? 0 })} · {t('kunden_besuche', { n: kunde.stamps })}</span>}
          {/* Nur wenn der Laden die Felder abfragt und der Kunde sie ausgefuellt hat. */}
          {kunde.birthday && <span>{t('kunden_birthday')}: {datum(kunde.birthday + 'T12:00:00')}</span>}
          {kunde.phone && <span>{t('kunden_phone')}: <a href={`tel:${kunde.phone}`} style={{ color: '#3C3489' }}>{kunde.phone}</a></span>}
        </div>

        <div style={s.badges}>
          {/* Gruppe zuerst; aelteres Backend liefert keine. */}
          {istGruppe(kunde.gruppe) && <span style={{ ...s.badge, ...GRUPPEN_FARBEN[kunde.gruppe] }}>{t(`kunden_gruppe_${kunde.gruppe}`)}</span>}
          {/* Stufe (Bronze, Silber, Gold), nur bei Karten mit Stufen. */}
          {kunde.stufe && <span style={{ ...s.badge, background: '#fff3d6', color: '#8a5a00' }}>🏅 {kunde.stufe}</span>}
          {mitglied && <span style={s.badge}>{t('kunden_badge_member')}</span>}
          {kunde.welcomePending && <span style={{ ...s.badge, background: '#fbecd2', color: '#9a5d00' }}>{t('kunden_badge_locked')}</span>}
          {voll && <span style={{ ...s.badge, background: '#ddf2e6', color: '#1e7a4c' }}>{t('kunden_badge_full')}</span>}
          {kunde.apple && <span style={s.badge}>{t('kunden_badge_apple')}</span>}
          {kunde.marketingConsent && <span style={s.badge}>{t('kunden_badge_consent')}</span>}
          {!kunde.emailConfirmed && <span style={{ ...s.badge, background: '#f4e1e1', color: '#8a3b3b' }}>{t('kunden_badge_unconfirmed')}</span>}
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {paket && (
              <button type="button" style={{ ...s.fixBtn, background: '#3C3489', color: 'white' }} onClick={aufladen} disabled={saving}>
                {t('kunden_paket_topup')}
              </button>
          )}
          {darfKorrigieren && (
              <button type="button" style={s.fixBtn} onClick={oeffnen}>
                {offen ? t('kunden_fix_cancel') : (paket ? t('kunden_paket_fix') : t('kunden_fix'))}
              </button>
          )}
        </div>
        {punkte && <p style={s.hint}>{t('kunden_fix_points_hint')}</p>}
        {mitglied && <p style={s.hint}>{t('kunden_member_hint')}</p>}
        {!offen && meldung && (
            <div style={{ ...s.meldung, background: meldung.ok ? '#f0fff4' : '#fff0f0', color: meldung.ok ? '#2C5F2E' : '#c00' }}>
              {meldung.text}
            </div>
        )}

        {offen && (
            <div style={s.fixBox}>
              <p style={{ ...s.hint, margin: '0 0 10px' }}>{paket ? t('kunden_paket_fix_hint', { max }) : t('kunden_fix_hint', { max })}</p>
              <div style={s.fixRow}>
                <button type="button" style={s.stepBtn} onClick={() => setWert(w => Math.max(0, Number(w) - 1))} disabled={saving}>−</button>
                <input style={s.fixInput} type="number" min={0} max={max} value={wert}
                       onChange={e => setWert(e.target.value)} />
                <button type="button" style={s.stepBtn} onClick={() => setWert(w => Math.min(max, Number(w) + 1))} disabled={saving}>+</button>
                {!paket && <span style={s.fixMax}>/ {max}</span>}
                <button type="button" style={s.saveBtn} onClick={speichern} disabled={saving || Number(wert) === aktuell}>
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
  chips: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 14 },
  chip: { border: '2px solid transparent', borderRadius: 999, padding: '5px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: '#f0eeff', color: '#3C3489' },
  chipAktiv: { borderColor: 'currentColor' },
  chipZahl: { opacity: 0.75, fontWeight: 500, marginInlineStart: 2 },
  regeln: { fontSize: 12, color: '#3C3489', marginInlineStart: 'auto', whiteSpace: 'nowrap' },
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
