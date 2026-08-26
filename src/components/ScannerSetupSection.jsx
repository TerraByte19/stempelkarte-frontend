import { useEffect, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import api from '../api'
import { useLang } from '../LangContext'

// Basis-URL des Frontends (für den Setup-Link im QR)
const FRONTEND_URL = window.location.origin

export default function ScannerSetupSection() {
  const { t } = useLang()
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
      alert(`${t('scanner_setup_link_prefix')} ${url}`)
    }
  }

  if (loading) return null

  return (
    <div style={s.card}>
      <h2 style={s.title}>{t('scanner_setup_title')}</h2>
      <p style={s.hint}>
        {t('scanner_setup_hint')}
      </p>

      {tokens.length === 0 ? (
        <div style={s.empty}>
          {t('scanner_setup_empty')}
        </div>
      ) : (
        <div style={s.tokenGrid}>
          {tokens.map((tok, i) => {
            const url = setupUrl(tok.token, tok.label)
            const isOpen = openToken === tok.token
            return (
              <div key={i} style={s.tokenCard}>
                <div style={s.tokenHeader}>
                  <span style={s.tokenLabel}>{tok.label || t('scanner_setup_default_label', { n: i + 1 })}</span>
                  <button
                    style={s.toggleBtn}
                    onClick={() => setOpenToken(isOpen ? null : tok.token)}
                  >
                    {isOpen ? t('common_close') : t('scanner_setup_show_qr')}
                  </button>
                </div>

                {isOpen && (
                  <div style={s.qrArea}>
                    <div style={s.qrBox}>
                      <QRCodeCanvas value={url} size={200} level="M" includeMargin={true} />
                    </div>
                    <p style={s.scanHint}>{t('scanner_setup_scan_hint')}</p>
                    <button
                      style={s.copyBtn}
                      onClick={() => copyLink(url, tok.token)}
                    >
                      {copied === tok.token ? t('scanner_setup_copied') : t('scanner_setup_copy_link')}
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