import { useEffect, useRef, useState } from 'react'
import api from '../api'

/**
 * Newsletter-Bereich fürs Dashboard.
 * Besitzer gibt Betreff + Text ein und kann optional MEHRERE Bilder
 * hinzufügen (z.B. Menü, Aktionsfotos) → wird an alle Kunden gesendet,
 * die der Werbung zugestimmt UND ihre E-Mail bestätigt haben.
 * Logo + Hero-Bild des Ladens werden automatisch im Header jeder Mail
 * angezeigt (kein extra Schritt nötig).
 */
export default function NewsletterSection() {
    const [recipients, setRecipients] = useState({ total: 0, confirmed: 0 })
    const [subject, setSubject] = useState('')
    const [body, setBody] = useState('')
    const [imageUrls, setImageUrls] = useState([])      // Liste hochgeladener Bild-URLs
    const [uploading, setUploading] = useState(false)
    const [sending, setSending] = useState(false)
    const [feedback, setFeedback] = useState(null)      // {ok, text}
    const [open, setOpen] = useState(false)
    const fileInputRef = useRef(null)

    useEffect(() => {
        api.get('/api/shop/newsletter/recipients')
            .then(r => setRecipients(r.data || { total: 0, confirmed: 0 }))
            .catch(() => {})
    }, [])

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
            setFeedback({ ok: false, text: 'Mindestens ein Bild-Upload ist fehlgeschlagen. Bitte erneut versuchen.' })
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
            setFeedback({ ok: false, text: 'Betreff und Text dürfen nicht leer sein.' })
            return
        }
        if (!confirm(`Newsletter an ${recipients.confirmed} Kunden senden?`)) return

        setSending(true)
        setFeedback(null)
        try {
            const res = await api.post('/api/shop/newsletter', { subject, body, imageUrls })
            setFeedback({
                ok: true,
                text: `Versendet: ${res.data.sent} · Übersprungen (noch nicht bestätigt): ${res.data.skippedUnconfirmed}`,
            })
            setSubject('')
            setBody('')
            setImageUrls([])
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

                    <p style={s.brandingHint}>
                        ℹ️ Logo und Banner-Bild deines Shops werden automatisch oben in
                        jeder Mail angezeigt — basierend auf deinen Einstellungen unter „Karten“.
                    </p>

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

                    <label style={s.label}>Bilder (optional, z.B. Menü oder Aktionsfotos)</label>
                    {imageUrls.length > 0 && (
                        <div style={s.imageGrid}>
                            {imageUrls.map((url, i) => (
                                <div key={i} style={s.imageThumbWrap}>
                                    <img src={url} alt={`Bild ${i + 1}`} style={s.imageThumb} />
                                    <button style={s.removeImageBtn} onClick={() => removeImage(i)}>✕</button>
                                </div>
                            ))}
                        </div>
                    )}
                    <button style={s.uploadBtn} onClick={pickImages} disabled={uploading}>
                        {uploading ? 'Lädt…' : imageUrls.length > 0 ? '🖼️ Weitere Bilder hinzufügen' : '🖼️ Bilder hinzufügen'}
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
}