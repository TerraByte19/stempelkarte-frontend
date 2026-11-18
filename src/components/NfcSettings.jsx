import { useState } from 'react'
import api from '../api'

/**
 * NFC-Karte fuer die Theke: zeigt den Link, der auf den NFC-Chip geschrieben
 * wird. Der Link entsteht erst auf Knopfdruck (der Server legt dann den
 * Schluessel der Karte an) - wer NFC nicht nutzt, bekommt keinen.
 *
 * Kennt der Server den Weg noch nicht (aelterer Stand), sagt der Block das,
 * statt still nichts zu tun.
 */
export default function NfcSettings({ cardId, t }) {
  const [url, setUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [fehler, setFehler] = useState('')
  const [kopiert, setKopiert] = useState(false)

  async function holen() {
    setBusy(true); setFehler('')
    try {
      const r = await api.get(`/api/shop/cards/${cardId}/nfc`)
      if (!r.data?.url) throw new Error('leer')
      setUrl(r.data.url)
    } catch {
      setFehler(t('nfc_err'))
    } finally { setBusy(false) }
  }

  async function kopieren() {
    try {
      await navigator.clipboard.writeText(url)
      setKopiert(true)
      setTimeout(() => setKopiert(false), 2500)
    } catch {
      // Zwischenablage gesperrt: der Link steht im Feld und laesst sich markieren.
    }
  }

  return (
      <div style={s.card}>
        <div style={s.titel}>📶 {t('nfc_title')}</div>
        <p style={s.hint}>{t('nfc_hint')}</p>
        {!url && (
            <button type="button" style={s.btn} onClick={holen} disabled={busy}>
              {busy ? t('common_loading') : t('nfc_show')}
            </button>
        )}
        {url && (
            <>
              <input style={s.input} value={url} readOnly dir="ltr" onFocus={e => e.target.select()} />
              <div style={{ marginTop: 8 }}>
                <button type="button" style={s.btn} onClick={kopieren}>
                  {kopiert ? t('nfc_copied') : t('nfc_copy')}
                </button>
              </div>
              <p style={{ ...s.hint, margin: '12px 0 0' }}>{t('nfc_steps')}</p>
            </>
        )}
        {fehler && <p style={{ ...s.hint, color: '#b3261e', margin: '8px 0 0' }}>{fehler}</p>}
      </div>
  )
}

const s = {
  card: { background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  titel: { fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 },
  hint: { fontSize: 12, color: '#888', margin: '0 0 12px', lineHeight: 1.5 },
  input: { width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: 13, fontWeight: 400, background: 'white' },
  btn: { background: '#3C3489', color: 'white', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
}
