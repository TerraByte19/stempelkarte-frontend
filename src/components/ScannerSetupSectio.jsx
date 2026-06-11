import { useEffect, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import api from '../api'

// Basis-URL des Frontends (für den Setup-Link im QR)
const FRONTEND_URL = window.location.origin

export default function ScannerSetupSection() {
  const [tokens, setTokens] = useState([])
  const [loading, setLoading] = useState(true)
  const [openToken, setOpenToken] = useState(null)
  const [copied, setCopied] = useState('')

  useEffect(() => {
    api.get('/api/shop/staff-tokens')
      .then(res => setTokens(Array.isArray(res.data) ? res.data : []))
      .catch(() => setTokens([]))
      .finally(() => setLoading(false))
  }, [])

  function setupUrl(token, label) {
    const params = new URLSearchParams({ token, label: label || 'Scanner' })
    return `${FRONTEND_URL}/scanner-setup?${params.toString()}`
  }

  async function copyLink(url, tokenId) {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(tokenId)
      setTimeout(() => setCopied(''), 2000)
    } catch {
      alert('Link: ' + url)
    }
  }

  if (loading) return null

  return (
    <div style={s.card}>
      <h2 style={s.title}>📱 Scanner einrichten</h2>
      <p style={s.hint}>
        Lass deine Mitarbeiter den QR-Code mit der Tablet-/Handy-Kamera scannen.
        Danach ist der Scanner dauerhaft eingerichtet — kein Token-Tippen mehr.
      </p>

      {tokens.length === 0 ? (
        <div style={s.empty}>
          Noch keine Staff-Tokens vorhanden. Erstelle einen im Profil-Bereich.
        </div>
      ) : (
        <div style={s.tokenGrid}>
          {tokens.map((t, i) => {
            const url = setupUrl(t.token, t.label)
            const isOpen = openToken === t.token
            return (
              <div key={i} style={s.tokenCard}>
                <div style={s.tokenHeader}>
                  <span style={s.tokenLabel}>{t.label || `Scanner ${i + 1}`}</span>
                  <button
                    style={s.toggleBtn}
                    onClick={() => setOpenToken(isOpen ? null : t.token)}
                  >
                    {isOpen ? 'Schließen' : 'QR anzeigen'}
                  </button>
                </div>

                {isOpen && (
                  <div style={s.qrArea}>
                    <div style={s.qrBox}>
                      <QRCodeCanvas value={url} size={200} level="M" includeMargin={true} />
                    </div>
                    <p style={s.scanHint}>Mit der Kamera scannen</p>
                    <button
                      style={s.copyBtn}
                      onClick={() => copyLink(url, t.token)}
                    >
                      {copied === t.token ? '✓ Link kopiert!' : 'Link kopieren'}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const s = {
  card: { background: 'white', borderRadius: 12, padding: 24, marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  title: { fontSize: 16, fontWeight: 600, margin: '0 0 8px', color: '#1a1a1a' },
  hint: { fontSize: 13, color: '#888', margin: '0 0 20px', lineHeight: 1.5 },
  empty: { background: '#f8f8f8', borderRadius: 8, padding: 20, textAlign: 'center', color: '#888', fontSize: 14 },
  tokenGrid: { display: 'flex', flexDirection: 'column', gap: 12 },
  tokenCard: { border: '1.5px solid #e8e8e8', borderRadius: 10, padding: 16 },
  tokenHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  tokenLabel: { fontSize: 15, fontWeight: 600, color: '#1a1a1a' },
  toggleBtn: { background: '#f0eeff', color: '#3C3489', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  qrArea: { display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 16, paddingTop: 16, borderTop: '1px solid #f0f0f0' },
  qrBox: { background: 'white', padding: 12, borderRadius: 12, border: '1px solid #eee' },
  scanHint: { fontSize: 13, color: '#888', margin: '12px 0' },
  copyBtn: { background: '#3C3489', color: 'white', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
}