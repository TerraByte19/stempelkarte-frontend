import { useEffect, useRef, useState } from 'react'
import api from '../api'
import { useLang, localeTag, dirArrow } from '../LangContext'

/**
 * Newsletter-Bereich fürs Dashboard.
 * - Newsletter schreiben (Betreff + Text + mehrere Bilder), an alle Kunden
 *   mit Einwilligung + bestätigter E-Mail senden.
 * - Verlauf der zuletzt gesendeten Newsletter (5 pro Seite, blätterbar).
 * Logo + Hero-Bild des Ladens werden automatisch im Mail-Header angezeigt.
 */
export default function NewsletterSection() {
    const { t, lang, dir } = useLang()
    const [recipients, setRecipients] = useState({ total: 0, confirmed: 0 })
    const [subject, setSubject] = useState('')
    const [body, setBody] = useState('')
    const [imageUrls, setImageUrls] = useState([])      // Liste hochgeladener Bild-URLs
    const [uploading, setUploading] = useState(false)
    const [sending, setSending] = useState(false)
    const [feedback, setFeedback] = useState(null)      // {ok, text}
    const [open, setOpen] = useState(false)
    const fileInputRef = useRef(null)

    // Verlauf
    const [historyOpen, setHistoryOpen] = useState(false)
    const [history, setHistory] = useState({ items: [], page: 0, totalPages: 0, totalItems: 0 })
    const [historyLoading, setHistoryLoading] = useState(false)

    useEffect(() => {
        api.get('/api/shop/newsletter/recipients')
            .then(r => setRecipients(r.data || { total: 0, confirmed: 0 }))
            .catch(() => {})
    }, [])

    function loadHistory(page = 0) {
        setHistoryLoading(true)
        api.get(`/api/shop/newsletter/history?page=${page}&size=5`)
            .then(r => setHistory(r.data || { items: [], page: 0, totalPages: 0, totalItems: 0 }))
            .catch(() => {})
            .finally(() => setHistoryLoading(false))
    }

    function toggleHistory() {
        const next = !historyOpen
        setHistoryOpen(next)
        if (next) loadHistory(0)
    }

    function pickImages() {
        fileInputRef.current?.click()
    }

    async function onImagesSelected(e) {
        const files = Array.from(e.target.files || [])
        if (files.length === 0) return
        setUploading(true)
        setFeedback(null)
        try {
            for (const file of files) {
                const base64 = await new Promise((resolve, reject) => {
                    const reader = new FileReader()
                    reader.onload = () => resolve(reader.result.split(',')[1])
                    reader.onerror = reject
                    reader.readAsDataURL(file)
                })
                const extension = file.name.split('.').pop()
                const res = await api.post('/api/shop/newsletter/image', { base64, extension })
                setImageUrls(prev => [...prev, res.data.url])
            }
        } catch (e) {
            setFeedback({ ok: false, text: t('newsletter_err_upload') })
        } finally {
            setUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    function removeImage(index) {
        setImageUrls(prev => prev.filter((_, i) => i !== index))
    }

    async function send() {
        if (!subject.trim() || !body.trim()) {
            setFeedback({ ok: false, text: t('newsletter_err_empty') })
            return
        }
        if (!confirm(t('newsletter_confirm_send', { n: recipients.confirmed }))) return

        setSending(true)
        setFeedback(null)
        try {
            const res = await api.post('/api/shop/newsletter', { subject, body, imageUrls })
            setFeedback({
                ok: true,
                text: t('newsletter_sent_result', { sent: res.data.sent, skipped: res.data.skippedUnconfirmed }),
            })
            setSubject('')
            setBody('')
            setImageUrls([])
            // Verlauf aktualisieren, falls geöffnet
            if (historyOpen) loadHistory(0)
        } catch (e) {
            setFeedback({ ok: false, text: t('newsletter_err_send') })
        } finally {
            setSending(false)
        }
    }

    function formatDate(iso) {
        try {
            const d = new Date(iso)
            const tag = localeTag(lang)
            return d.toLocaleDateString(tag, { day: '2-digit', month: '2-digit', year: 'numeric' })
                + ' ' + d.toLocaleTimeString(tag, { hour: '2-digit', minute: '2-digit' })
        } catch { return iso }
    }

    return (
        <div style={s.card}>
            <style>{`
                .sk-nl-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 12px;
                }
                .sk-nl-buttons {
                    display: flex;
                    gap: 8px;
                    flex-shrink: 0;
                }
                @media (max-width: 600px) {
                    .sk-nl-header { flex-direction: column; align-items: stretch; }
                    .sk-nl-buttons { width: 100%; }
                    .sk-nl-buttons > button { flex: 1; }
                }
            `}</style>
            <div className="sk-nl-header">
                <div>
                    <h2 style={s.title}>{t('newsletter_title')}</h2>
                    <p style={s.hint}>
                        {t('newsletter_recipients_confirmed', { n: recipients.confirmed })} ·
                        {recipients.total - recipients.confirmed > 0
                            ? ` ${t('newsletter_recipients_unconfirmed', { n: recipients.total - recipients.confirmed })}`
                            : ` ${t('newsletter_recipients_all_confirmed')}`}
                    </p>
                </div>
                <div className="sk-nl-buttons">
                    <button style={s.toggleSecondary} onClick={toggleHistory}>
                        {historyOpen ? t('newsletter_history_close') : t('newsletter_history_open')}
                    </button>
                    <button style={s.toggle} onClick={() => setOpen(o => !o)}>
                        {open ? t('common_close') : t('newsletter_compose')}
                    </button>
                </div>
            </div>

            {open && (
                <div style={s.body}>
                    {feedback && (
                        <div style={{ ...s.feedback, background: feedback.ok ? '#f0fff4' : '#fff0f0', color: feedback.ok ? '#2C5F2E' : '#c00' }}>
                            {feedback.text}
                        </div>
                    )}

                    <p style={s.brandingHint}>
                        {t('newsletter_branding_hint')}
                    </p>

                    <label style={s.label}>{t('newsletter_subject_label')}</label>
                    <input
                        style={s.input}
                        value={subject}
                        onChange={e => setSubject(e.target.value)}
                        placeholder={t('newsletter_subject_ph')}
                        maxLength={120}
                    />

                    <label style={s.label}>{t('newsletter_body_label')}</label>
                    <textarea
                        style={s.textarea}
                        value={body}
                        onChange={e => setBody(e.target.value)}
                        placeholder={t('newsletter_body_ph')}
                        rows={8}
                    />

                    <label style={s.label}>{t('newsletter_images_label')}</label>
                    {imageUrls.length > 0 && (
                        <div style={s.imageGrid}>
                            {imageUrls.map((url, i) => (
                                <div key={i} style={s.imageThumbWrap}>
                                    <img src={url} alt={t('newsletter_image_alt', { n: i + 1 })} style={s.imageThumb} />
                                    <button style={s.removeImageBtn} onClick={() => removeImage(i)}>✕</button>
                                </div>
                            ))}
                        </div>
                    )}
                    <button style={s.uploadBtn} onClick={pickImages} disabled={uploading}>
                        {uploading ? t('common_loading') : imageUrls.length > 0 ? t('newsletter_add_more_images') : t('newsletter_add_images')}
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        style={{ display: 'none' }}
                        onChange={onImagesSelected}
                    />

                    <p style={s.legal}>
                        {t('newsletter_legal')}
                    </p>

                    <button
                        style={{ ...s.send, opacity: sending ? 0.6 : 1 }}
                        onClick={send}
                        disabled={sending || recipients.confirmed === 0}
                    >
                        {sending ? t('newsletter_sending') : t('newsletter_send_btn', { n: recipients.confirmed })}
                    </button>
                </div>
            )}

            {historyOpen && (
                <div style={s.body}>
                    <h3 style={s.historyTitle}>{t('newsletter_history_title')}</h3>
                    {historyLoading ? (
                        <p style={s.muted}>{t('common_loading')}</p>
                    ) : history.items.length === 0 ? (
                        <p style={s.muted}>{t('newsletter_history_empty')}</p>
                    ) : (
                        <>
                            {history.items.map(item => (
                                <div key={item.id} style={s.historyItem}>
                                    <div style={s.historyHead}>
                                        <span style={s.historySubject}>{item.subject}</span>
                                        <span style={s.historyMeta}>{formatDate(item.sentAt)}</span>
                                    </div>
                                    <div style={s.historyRecipients}>{t('newsletter_history_recipients', { n: item.recipientCount })}</div>
                                    <div style={s.historyBody}>{item.body}</div>
                                    {item.imageUrls && item.imageUrls.length > 0 && (
                                        <div style={s.historyImages}>
                                            {item.imageUrls.map((url, i) => (
                                                <img key={i} src={url} alt={t('newsletter_image_alt', { n: i + 1 })} style={s.historyImg} />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}

                            {history.totalPages > 1 && (
                                <div style={s.pagination}>
                                    <button
                                        style={{ ...s.pageBtn, opacity: history.page <= 0 ? 0.4 : 1 }}
                                        onClick={() => loadHistory(history.page - 1)}
                                        disabled={history.page <= 0}
                                    >
                                        {dirArrow(dir)} {t('common_back')}
                                    </button>
                                    <span style={s.pageInfo}>
                    {t('newsletter_page_info', { page: history.page + 1, totalPages: history.totalPages })}
                  </span>
                                    <button
                                        style={{ ...s.pageBtn, opacity: history.page >= history.totalPages - 1 ? 0.4 : 1 }}
                                        onClick={() => loadHistory(history.page + 1)}
                                        disabled={history.page >= history.totalPages - 1}
                                    >
                                        {t('newsletter_next')} {dirArrow(dir, 'forward')}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
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
    input: { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: 14, outline: 'none', boxSizing: 'border-box' },
    textarea: { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: 14, outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 },
    uploadBtn: { width: '100%', padding: 12, background: '#f0eeff', color: '#3C3489', border: '1.5px dashed #c9c4ee', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
    imageGrid: { display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
    imageThumbWrap: { position: 'relative', width: 90, height: 90 },
    imageThumb: { width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8, display: 'block' },
    removeImageBtn: { position: 'absolute', top: -6, right: -6, background: '#c00', color: 'white', border: '2px solid white', borderRadius: '50%', width: 22, height: 22, fontSize: 11, cursor: 'pointer', lineHeight: 1, padding: 0 },
    legal: { fontSize: 12, color: '#888', margin: '14px 0 16px', lineHeight: 1.5 },
    send: { width: '100%', padding: 14, background: '#3C3489', color: 'white', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer' },
    feedback: { padding: '10px 14px', borderRadius: 8, fontSize: 14, marginBottom: 12 },
    // Verlauf
    historyTitle: { fontSize: 14, fontWeight: 600, color: '#1a1a1a', margin: '0 0 12px' },
    muted: { fontSize: 13, color: '#888', margin: 0 },
    historyItem: { border: '1px solid #eee', borderRadius: 10, padding: 14, marginBottom: 12 },
    historyHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' },
    historySubject: { fontSize: 14, fontWeight: 600, color: '#1a1a1a' },
    historyMeta: { fontSize: 12, color: '#999', flexShrink: 0 },
    historyRecipients: { fontSize: 12, color: '#3C3489', marginTop: 2, marginBottom: 8 },
    historyBody: { fontSize: 13, color: '#444', whiteSpace: 'pre-line', lineHeight: 1.5 },
    historyImages: { display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 },
    historyImg: { width: 80, height: 80, objectFit: 'cover', borderRadius: 6 },
    pagination: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
    pageBtn: { background: '#f0eeff', color: '#3C3489', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
    pageInfo: { fontSize: 13, color: '#888' },
}