import { useEffect, useRef, useState } from 'react'
import api from '../api'
import { useLang, localeTag } from '../LangContext'

/**
 * Push-Kampagne fuers Dashboard: ein kurzer Text, der als Mitteilung auf
 * den Wallet-Karten einer Zielgruppe landet (iPhone und Android).
 *
 * Die Gruppen und ihre Zahlen kommen vom Backend (service.Zielgruppe), hier
 * stehen nur Namen und Beschreibungen. Jede Karte bekommt hoechstens eine
 * Nachricht am Tag - wer heute schon eine hatte, zaehlt in "heuteSchon" und
 * wird uebersprungen. Der Versand laeuft im Hintergrund in Paketen; solange
 * ein Eintrag auf RUNNING steht, wird der Verlauf leise nachgeladen.
 *
 * Planen: Datum und Uhrzeit, die Kampagne wartet als SCHEDULED. Die
 * Empfaenger bestimmt der Server erst zum Zeitpunkt. Der Entwurf bleibt im
 * Browser, bis er gesendet wurde.
 */

// Reihenfolge wie im Backend-Enum; unbekannte Gruppen eines neueren
// Backends werden trotzdem angezeigt (mit rohem Namen).
const GRUPPEN = ['ALLE', 'NEU', 'INAKTIV_30', 'INAKTIV_60', 'INAKTIV_90', 'EINMAL', 'STAMM_RUHIG', 'PRAEMIE_WARTET', 'FAST_VOLL']
const VORLAGEN = ['happy', 'neu', 'event', 'angebot']

/** datetime-local will "JJJJ-MM-TTTHH:MM" in Ortszeit, ohne Sekunden. */
function lokal(d) {
  const p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

export default function KampagnenSection() {
    const { t, lang } = useLang()
    const shop = JSON.parse(localStorage.getItem('shop') || '{}')
    const entwurfKey = `kamp_entwurf_${shop.id || ''}`
    // null = noch nicht geladen, false = Backend kennt den Endpunkt nicht (alter Server)
    const [stand, setStand] = useState(null)
    const [gruppe, setGruppe] = useState('ALLE')
    const [text, setText] = useState(() => { try { return localStorage.getItem(entwurfKey) || '' } catch { return '' } })
    const [spaeter, setSpaeter] = useState(false)
    const [wann, setWann] = useState('')
    const [sending, setSending] = useState(false)
    const [feedback, setFeedback] = useState(null)      // {ok, text}
    const [open, setOpen] = useState(false)
    const [historyOpen, setHistoryOpen] = useState(false)

    const pollRef = useRef(null)
    useEffect(() => () => clearTimeout(pollRef.current), [])

    // Entwurf im Browser halten: wer unterbrochen wird, findet den Text wieder.
    useEffect(() => {
        try { if (text) localStorage.setItem(entwurfKey, text); else localStorage.removeItem(entwurfKey) } catch { /* privat/gesperrt */ }
    }, [text, entwurfKey])

    const textMax = stand?.textMax || 160

    function load(versuch = 0) {
        api.get('/api/shop/kampagnen')
            .then(r => {
                const daten = r.data || {}
                setStand({
                    textMax: daten.textMax || 160,
                    gruppen: Array.isArray(daten.gruppen) ? daten.gruppen : [],
                    items: Array.isArray(daten.items) ? daten.items : [],
                })
                clearTimeout(pollRef.current)
                const laeuft = (daten.items || []).some(i => i.status === 'RUNNING')
                // Deckel bei 40 Versuchen (2 Minuten), damit ein haengender
                // Versand den Browser nicht endlos pollen laesst.
                if (laeuft && versuch < 40) {
                    pollRef.current = setTimeout(() => load(versuch + 1), 3000)
                }
            })
            .catch(e => {
                // 404 = das Backend ist noch nicht so weit (Render braucht
                // laenger als Vercel). Dann den Block gar nicht anbieten.
                if (e.response?.status === 404) setStand(false)
            })
    }

    useEffect(() => { load(0) }, [])   // eslint-disable-line react-hooks/exhaustive-deps

    function zahl(key) {
        return (stand?.gruppen || []).find(g => g.gruppe === key) || { empfaenger: 0, heuteSchon: 0 }
    }

    /** Name einer Gruppe; ein neueres Backend kann Gruppen kennen, die hier fehlen. */
    function gruppenName(key) {
        const k = `kamp_g_${String(key || 'ALLE').toLowerCase()}`
        const name = t(k)
        return name === k ? key : name
    }

    function formatDate(iso) {
        try {
            const d = new Date(iso)
            const tag = localeTag(lang)
            return d.toLocaleDateString(tag, { day: '2-digit', month: '2-digit', year: 'numeric' })
                + ' ' + d.toLocaleTimeString(tag, { hour: '2-digit', minute: '2-digit' })
        } catch { return iso }
    }

    async function send() {
        const entwurf = text.replace(/\s+/g, ' ').trim()
        if (!entwurf) {
            setFeedback({ ok: false, text: t('kamp_err_empty') })
            return
        }
        let geplantAm = null
        if (spaeter) {
            const d = wann ? new Date(wann) : null
            if (!d || Number.isNaN(d.getTime())) {
                setFeedback({ ok: false, text: t('kamp_err_when') })
                return
            }
            geplantAm = d.toISOString()
        }
        const n = zahl(gruppe).empfaenger
        const frage = spaeter
            ? t('kamp_confirm_plan', { gruppe: gruppenName(gruppe), wann: formatDate(geplantAm) })
            : t('kamp_confirm_send', { n, gruppe: gruppenName(gruppe) })
        if (!confirm(frage)) return

        setSending(true)
        setFeedback(null)
        try {
            await api.post('/api/shop/kampagnen', { text: entwurf, gruppe, geplantAm })
            setFeedback({ ok: true, text: spaeter ? t('kamp_planned') : t('kamp_queued') })
            setText('')
            setSpaeter(false)
            setWann('')
            setOpen(false)
            setHistoryOpen(true)
            load(0)
        } catch (e) {
            // Das Backend sagt genau, was nicht passt (leer, zu lang, niemand
            // in der Gruppe). Nur ohne Text faellt es auf die allgemeine Meldung.
            setFeedback({ ok: false, text: e.response?.data?.error || t('kamp_err_send') })
            load(0)
        } finally {
            setSending(false)
        }
    }

    async function abbrechen(item) {
        if (!confirm(t('kamp_cancel_confirm'))) return
        try {
            await api.delete(`/api/shop/kampagnen/${item.id}`)
            setFeedback({ ok: true, text: t('kamp_cancelled') })
        } catch (e) {
            setFeedback({ ok: false, text: e.response?.data?.error || t('kamp_err_send') })
        }
        load(0)
    }

    if (stand === false) return null

    const geladen = stand !== null
    const gewaehlt = zahl(gruppe)
    // Geplant darf auch bei 0 raus: zum Zeitpunkt kann die Gruppe voll sein.
    const darfSenden = geladen && (spaeter || gewaehlt.empfaenger > 0)
    const vorschau = text.trim() || t('kamp_preview_ph')
    // Backend-Gruppen zuerst in bekannter Reihenfolge, dann unbekannte hinten dran.
    const gruppenKeys = geladen
        ? [...GRUPPEN.filter(k => stand.gruppen.some(g => g.gruppe === k)),
           ...stand.gruppen.map(g => g.gruppe).filter(k => !GRUPPEN.includes(k))]
        : GRUPPEN
    const minWann = lokal(new Date(Date.now() + 5 * 60 * 1000))

    return (
        <div style={s.card}>
            <style>{`
                .sk-kp-header { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
                .sk-kp-buttons { display: flex; gap: 8px; flex-shrink: 0; }
                .sk-kp-gruppe:hover { border-color: #c9c4ee; }
                .sk-kp-vorlage:hover { background: #e4e0fa; }
                @media (max-width: 600px) {
                    .sk-kp-header { flex-direction: column; align-items: stretch; }
                    .sk-kp-buttons { width: 100%; }
                    .sk-kp-buttons > button { flex: 1; }
                }
            `}</style>
            <div className="sk-kp-header">
                <div>
                    <h2 style={s.title}>{t('kamp_title')}</h2>
                    <p style={s.hint}>
                        {geladen ? t('kamp_reach', { n: zahl('ALLE').empfaenger + zahl('ALLE').heuteSchon }) : t('common_loading')}
                    </p>
                </div>
                <div className="sk-kp-buttons">
                    <button style={s.toggleSecondary} onClick={() => { const n = !historyOpen; setHistoryOpen(n); if (n) load(0) }}>
                        {historyOpen ? t('newsletter_history_close') : t('newsletter_history_open')}
                    </button>
                    <button style={s.toggle} onClick={() => setOpen(o => !o)}>
                        {open ? t('common_close') : t('kamp_compose')}
                    </button>
                </div>
            </div>

            {feedback && !open && (
                <div style={{ ...s.feedback, marginTop: 14, background: feedback.ok ? '#f0fff4' : '#fff0f0', color: feedback.ok ? '#2C5F2E' : '#c00' }}>
                    {feedback.text}
                </div>
            )}

            {open && (
                <div style={s.body}>
                    {feedback && (
                        <div style={{ ...s.feedback, background: feedback.ok ? '#f0fff4' : '#fff0f0', color: feedback.ok ? '#2C5F2E' : '#c00' }}>
                            {feedback.text}
                        </div>
                    )}

                    <p style={s.brandingHint}>{t('kamp_intro')}</p>

                    <label style={s.label}>{t('kamp_group_label')}</label>
                    <div style={s.gruppen} role="radiogroup" aria-label={t('kamp_group_label')}>
                        {gruppenKeys.map(key => {
                            const z = zahl(key)
                            const aktiv = gruppe === key
                            const leer = geladen && z.empfaenger === 0
                            const beschr = t(`kamp_g_${key.toLowerCase()}_d`)
                            return (
                                <label key={key} className="sk-kp-gruppe"
                                       style={{ ...s.gruppe, ...(aktiv ? s.gruppeAktiv : {}), opacity: leer ? 0.55 : 1 }}>
                                    <input type="radio" name="kamp-gruppe" value={key} checked={aktiv}
                                           onChange={() => setGruppe(key)} style={s.radio} />
                                    <span style={s.gruppeText}>
                                        <span style={s.gruppeName}>{gruppenName(key)}</span>
                                        {beschr !== `kamp_g_${key.toLowerCase()}_d` && (
                                            <span style={s.gruppeBeschr}>{beschr}</span>
                                        )}
                                    </span>
                                    <span style={s.gruppeZahl}>
                                        <b style={{ color: leer ? '#999' : '#3C3489' }}>{geladen ? z.empfaenger : '…'}</b>
                                        {z.heuteSchon > 0 && (
                                            <span style={s.gruppeHeute}>{t('kamp_group_today', { n: z.heuteSchon })}</span>
                                        )}
                                    </span>
                                </label>
                            )
                        })}
                    </div>

                    <label style={s.label}>{t('kamp_tpl_label')}</label>
                    <div style={s.vorlagen}>
                        {VORLAGEN.map(v => (
                            <button key={v} type="button" className="sk-kp-vorlage" style={s.vorlage}
                                    onClick={() => setText(t(`kamp_tpl_${v}`).slice(0, textMax))}>
                                {t(`kamp_tpl_${v}_l`)}
                            </button>
                        ))}
                    </div>

                    <label style={s.label}>{t('kamp_text_label')}</label>
                    <textarea
                        style={s.textarea}
                        value={text}
                        onChange={e => setText(e.target.value)}
                        placeholder={t('kamp_text_ph')}
                        maxLength={textMax}
                        rows={3}
                    />
                    <div style={s.unterText}>
                        <span style={s.hint}>{t('kamp_draft_hint')}</span>
                        <span style={{ ...s.counter, color: text.length >= textMax ? '#c0392b' : '#999' }}>
                            {text.length} / {textMax}
                        </span>
                    </div>

                    {/* Vorschau: so sieht die Mitteilung auf dem Sperrbildschirm aus. */}
                    <label style={s.label}>{t('kamp_preview_label')}</label>
                    <div style={s.phone} dir="ltr">
                        <div style={s.notif}>
                            <span style={s.notifIcon} aria-hidden="true">
                                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="6" width="18" height="13" rx="2.5" />
                                    <path d="M3 10h18" />
                                </svg>
                            </span>
                            <span style={s.notifText}>
                                <span style={s.notifRow}>
                                    <span style={s.notifTitle}>{shop.name || t('kamp_preview_shop')}</span>
                                    <span style={s.notifTime}>{t('kamp_preview_now')}</span>
                                </span>
                                <span style={s.notifBody}>{vorschau}</span>
                            </span>
                        </div>
                    </div>
                    <p style={s.hint}>{t('kamp_preview_hint')}</p>

                    <label style={s.switchRow}>
                        <input type="checkbox" checked={spaeter} onChange={e => setSpaeter(e.target.checked)} />
                        <span style={s.switchLabel}>{t('kamp_later')}</span>
                    </label>
                    {spaeter && (
                        <div style={{ marginTop: 8 }}>
                            <input type="datetime-local" style={s.input} value={wann} min={minWann}
                                   onChange={e => setWann(e.target.value)} />
                            <p style={s.hint}>{t('kamp_later_hint')}</p>
                        </div>
                    )}

                    <p style={s.legal}>{t('kamp_legal')}</p>

                    <button
                        style={{ ...s.send, opacity: (sending || !darfSenden) ? 0.6 : 1 }}
                        onClick={send}
                        disabled={sending || !darfSenden}
                    >
                        {sending
                            ? t('kamp_sending')
                            : spaeter
                                ? t('kamp_plan_btn')
                                : t('kamp_send_btn', { n: geladen ? gewaehlt.empfaenger : 0 })}
                    </button>
                </div>
            )}

            {historyOpen && (
                <div style={s.body}>
                    <h3 style={s.historyTitle}>{t('kamp_history_title')}</h3>
                    {!geladen ? (
                        <p style={s.muted}>{t('common_loading')}</p>
                    ) : stand.items.length === 0 ? (
                        <p style={s.muted}>{t('kamp_history_empty')}</p>
                    ) : stand.items.map(item => (
                        <div key={item.id} style={s.historyItem}>
                            <div style={s.historyHead}>
                                <span style={s.historyText}>{item.text}</span>
                                <span style={s.historyMeta}>{formatDate(item.erstelltAm)}</span>
                            </div>
                            <div style={s.historyRecipients}>
                                {t('kamp_history_to', { gruppe: gruppenName(item.gruppe) })}
                                {' · '}
                                {item.status === 'SCHEDULED'
                                    ? t('kamp_history_scheduled', { wann: formatDate(item.geplantAm) })
                                    : item.status === 'RUNNING'
                                        ? t('kamp_history_running', { n: item.gesendet, total: item.empfaenger })
                                        : t('kamp_history_done', { n: item.gesendet })}
                            </div>
                            {item.status === 'SCHEDULED' && (
                                <button type="button" style={s.cancelBtn} onClick={() => abbrechen(item)}>
                                    {t('kamp_cancel')}
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

const s = {
    card: { background: 'white', borderRadius: 12, padding: 24, marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
    title: { fontSize: 16, fontWeight: 600, margin: '0 0 4px', color: '#1a1a1a' },
    hint: { fontSize: 13, color: '#888', margin: 0 },
    toggle: { background: '#3C3489', color: 'white', border: 'none', borderRadius: 8, padding: '10px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
    toggleSecondary: { background: '#f0eeff', color: '#3C3489', border: 'none', borderRadius: 8, padding: '10px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
    body: { marginTop: 20, paddingTop: 20, borderTop: '1px solid #f0f0f0' },
    brandingHint: { fontSize: 12, color: '#888', background: '#f7f7fb', borderRadius: 8, padding: '8px 12px', margin: '0 0 12px', lineHeight: 1.5 },
    label: { display: 'block', fontSize: 13, fontWeight: 500, color: '#444', marginBottom: 6, marginTop: 12 },
    // Zielgruppen als Liste mit Zahl rechts, wie eine Kontaktauswahl.
    gruppen: { display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 4 },
    gruppe: { display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', border: '1.5px solid #e8e8ee', borderRadius: 10, cursor: 'pointer', background: 'white' },
    gruppeAktiv: { borderColor: '#3C3489', background: '#f7f6ff' },
    radio: { margin: 0, accentColor: '#3C3489', flexShrink: 0 },
    gruppeText: { display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 },
    gruppeName: { fontSize: 14, fontWeight: 600, color: '#1a1a1a' },
    gruppeBeschr: { fontSize: 12, color: '#888', lineHeight: 1.35 },
    gruppeZahl: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0, fontSize: 14 },
    gruppeHeute: { fontSize: 11, color: '#999', whiteSpace: 'nowrap' },
    // Vorlagen als Chips: ein Tipp fuellt das Textfeld, danach frei aenderbar.
    vorlagen: { display: 'flex', flexWrap: 'wrap', gap: 6 },
    vorlage: { background: '#f0eeff', color: '#3C3489', border: 'none', borderRadius: 999, padding: '6px 12px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' },
    textarea: { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: 14, outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 },
    unterText: { display: 'flex', justifyContent: 'space-between', gap: 8, margin: '4px 0 0' },
    counter: { fontSize: 12 },
    input: { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' },
    switchRow: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, cursor: 'pointer' },
    switchLabel: { fontSize: 14, fontWeight: 600, color: '#1a1a1a' },
    // Sperrbildschirm-Ausschnitt: dunkler Verlauf wie ein iPhone-Hintergrund,
    // darauf die Mitteilung in Glas-Optik.
    phone: { background: 'linear-gradient(160deg, #2b2a5c 0%, #0f0e2a 100%)', borderRadius: 16, padding: '26px 14px', margin: '0 0 8px' },
    notif: { display: 'flex', gap: 10, alignItems: 'flex-start', background: 'rgba(255,255,255,0.92)', borderRadius: 18, padding: '10px 12px', maxWidth: 360, margin: '0 auto', boxShadow: '0 6px 18px rgba(0,0,0,0.25)' },
    notifIcon: { width: 38, height: 38, borderRadius: 9, background: '#3C3489', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    notifText: { display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 },
    notifRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 },
    notifTitle: { fontSize: 14, fontWeight: 700, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    notifTime: { fontSize: 11, color: '#777', flexShrink: 0 },
    notifBody: { fontSize: 13.5, color: '#222', lineHeight: 1.35, marginTop: 2, wordBreak: 'break-word' },
    legal: { fontSize: 12, color: '#888', margin: '14px 0 16px', lineHeight: 1.5 },
    send: { width: '100%', padding: 14, background: '#3C3489', color: 'white', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer' },
    feedback: { padding: '10px 14px', borderRadius: 8, fontSize: 14, marginBottom: 12 },
    historyTitle: { fontSize: 14, fontWeight: 600, color: '#1a1a1a', margin: '0 0 12px' },
    muted: { fontSize: 13, color: '#888', margin: 0 },
    historyItem: { border: '1px solid #eee', borderRadius: 10, padding: 14, marginBottom: 12 },
    historyHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' },
    historyText: { fontSize: 14, fontWeight: 600, color: '#1a1a1a' },
    historyMeta: { fontSize: 12, color: '#999', flexShrink: 0 },
    historyRecipients: { fontSize: 12, color: '#3C3489', marginTop: 4 },
    cancelBtn: { marginTop: 10, background: '#fff0f0', color: '#c0392b', border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' },
}
