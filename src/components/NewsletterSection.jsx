import { useEffect, useState } from 'react'
import api from '../api'

/**
 * Newsletter-Bereich fürs Dashboard.
 * Besitzer gibt Betreff + Text ein → wird an alle Kunden gesendet,
 * die der Werbung zugestimmt UND ihre E-Mail bestätigt haben.
 */
export default function NewsletterSection() {
    const [recipients, setRecipients] = useState({ total: 0, confirmed: 0 })
    const [subject, setSubject] = useState('')
    const [body, setBody] = useState('')
    const [sending, setSending] = useState(false)
    const [feedback, setFeedback] = useState(null) // {ok, text}
    const [open, setOpen] = useState(false)

    useEffect(() => {
        api.get('/api/shop/newsletter/recipients')
            .then(r => setRecipients(r.data || { total: 0, confirmed: 0 }))
            .catch(() => {})
    }, [])

    async function send() {
        if (!subject.trim() || !body.trim()) {
            setFeedback({ ok: false, text: 'Betreff und Text dürfen nicht leer sein.' })
            return
        }
        if (!confirm(`Newsletter an ${recipients.confirmed} Kunden senden?`)) return

        setSending(true)
        setFeedback(null)
        try {
            const res = await api.post('/api/shop/newsletter', { subject, body })
            setFeedback({
                ok: true,
                text: `Versendet: ${res.data.sent} · Übersprungen (noch nicht bestätigt): ${res.data.skippedUnconfirmed}`,
            })
            setSubject('')
            setBody('')
        } catch (e) {
            setFeedback({ ok: false, text: 'Fehler beim Versand. Bitte später erneut versuchen.' })
        } finally {
            setSending(false)
        }
    }

    return (
        <div style={s.card}>
            <div style={s.header}>
                <div>
                    <h2 style={s.title}>📣 Newsletter</h2>
                    <p style={s.hint}>
                        {recipients.confirmed} Kunde(n) erhalten Mails ·
                        {recipients.total - recipients.confirmed > 0
                            ? ` ${recipients.total - recipients.confirmed} noch unbestätigt`
                            : ' alle bestätigt'}
                    </p>
                </div>
                <button style={s.toggle} onClick={() => setOpen(o => !o)}>
                    {open ? 'Schließen' : 'Newsletter schreiben'}
                </button>
            </div>

            {open && (
                <div style={s.body}>
                    {feedback && (
                        <div style={{ ...s.feedback, background: feedback.ok ? '#f0fff4' : '#fff0f0', color: feedback.ok ? '#2C5F2E' : '#c00' }}>
                            {feedback.text}
                        </div>
                    )}

                    <label style={s.label}>Betreff</label>
                    <input
                        style={s.input}
                        value={subject}
                        onChange={e => setSubject(e.target.value)}
                        placeholder="z.B. Diese Woche: 20% auf alle Kuchen"
                        maxLength={120}
                    />

                    <label style={s.label}>Nachricht</label>
                    <textarea
                        style={s.textarea}
                        value={body}
                        onChange={e => setBody(e.target.value)}
                        placeholder={'Hallo!\n\nDiese Woche haben wir...'}
                        rows={8}
                    />

                    <p style={s.legal}>
                        Jede Mail enthält automatisch einen Abmelde-Link (Pflicht) und einen Link zur Datenlöschung.
                        Es werden nur Kunden angeschrieben, die ausdrücklich zugestimmt und ihre E-Mail bestätigt haben.
                    </p>

                    <button
                        style={{ ...s.send, opacity: sending ? 0.6 : 1 }}
                        onClick={send}
                        disabled={sending || recipients.confirmed === 0}
                    >
                        {sending ? 'Wird versendet…' : `An ${recipients.confirmed} Kunden senden`}
                    </button>
                </div>
            )}
        </div>
    )
}

const s = {
    card: { background: 'white', borderRadius: 12, padding: 24, marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
    title: { fontSize: 16, fontWeight: 600, margin: '0 0 4px', color: '#1a1a1a' },
    hint: { fontSize: 13, color: '#888', margin: 0 },
    toggle: { background: '#f0eeff', color: '#3C3489', border: 'none', borderRadius: 8, padding: '10px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', flexShrink: 0 },
    body: { marginTop: 20, paddingTop: 20, borderTop: '1px solid #f0f0f0' },
    label: { display: 'block', fontSize: 13, fontWeight: 500, color: '#444', marginBottom: 6, marginTop: 12 },
    input: { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: 14, outline: 'none', boxSizing: 'border-box' },
    textarea: { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: 14, outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 },
    legal: { fontSize: 12, color: '#888', margin: '14px 0 16px', lineHeight: 1.5 },
    send: { width: '100%', padding: 14, background: '#3C3489', color: 'white', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer' },
    feedback: { padding: '10px 14px', borderRadius: 8, fontSize: 14, marginBottom: 12 },
}