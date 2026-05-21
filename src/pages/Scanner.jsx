import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Html5Qrcode } from 'html5-qrcode'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

export default function Scanner() {
  const [qrInput, setQrInput] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)
  const inputRef = useRef()
  const html5QrRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    inputRef.current?.focus()
    return () => stopCamera()
  }, [])

  useEffect(() => {
    if (!qrInput.trim()) return
    const timer = setTimeout(() => {
      sendScan(qrInput.trim())
    }, 100)
    return () => clearTimeout(timer)
  }, [qrInput])

  async function startCamera() {
    try {
      setCameraActive(true)
      await new Promise(resolve => setTimeout(resolve, 100))
      html5QrRef.current = new Html5Qrcode('qr-reader')
      await html5QrRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => { sendScan(decodedText) },
        () => {}
      )
    } catch (e) {
      console.error(e)
      setCameraActive(false)
      alert('Kamera konnte nicht gestartet werden: ' + e.message)
    }
  }

  async function stopCamera() {
    if (html5QrRef.current) {
      try {
        await html5QrRef.current.stop()
        html5QrRef.current = null
      } catch (e) {}
    }
    setCameraActive(false)
  }

  async function sendScan(payload) {
    if (loading) return
    setLoading(true)
    setResult(null)

    try {
      const token = localStorage.getItem('staffToken')
      const res = await fetch(`${API_URL}/api/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Staff-Token': token,
        },
        body: JSON.stringify({ qrPayload: payload }),
      })

      const data = await res.json()

      if (res.ok) {
        setResult({ success: true, data })
        if (cameraActive) await stopCamera()
      } else {
        setResult({ success: false, message: 'Ungültiger QR-Code' })
      }
    } catch (e) {
      setResult({ success: false, message: 'Server nicht erreichbar' })
    } finally {
      setLoading(false)
      setQrInput('')
      setTimeout(() => inputRef.current?.focus(), 200)
    }
  }

  return (
    <div>
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate('/')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <h1 style={styles.title}>Scanner</h1>
      </div>

      <p style={styles.subtitle}>Halte den Scanner an den QR-Code des Kunden</p>

      {result && (
        <div style={{
          ...styles.resultBox,
          background: result.success
            ? result.data.action === 'redeemed' ? '#FFF8E1' : '#F0FFF4'
            : '#FFF0F0',
          borderColor: result.success
            ? result.data.action === 'redeemed' ? '#FFB300' : '#2C5F2E'
            : '#D00',
        }}>
          <div style={styles.resultIcon}>
            {result.success
              ? result.data.action === 'redeemed' ? '🎉'
                : result.data.action === 'full' ? '🎊' : '✓'
              : '✗'}
          </div>
          <div style={styles.resultMessage}>
            {result.success ? result.data.message : result.message}
          </div>
          {result.success && (
            <div style={styles.resultStamps}>
              {result.data.stamps}/{result.data.rewardThreshold} Stempel
            </div>
          )}
          <button style={styles.btnNext} onClick={() => {
            setResult(null)
            inputRef.current?.focus()
          }}>
            Nachster Kunde
          </button>
        </div>
      )}

      <input
        ref={inputRef}
        style={styles.hiddenInput}
        type="text"
        value={qrInput}
        onChange={e => setQrInput(e.target.value)}
        disabled={loading}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
      />

      {cameraActive ? (
        <div style={styles.cameraContainer}>
          <div id="qr-reader" style={{ width: '100%' }} />
          <button style={styles.btnStop} onClick={stopCamera}>Kamera stoppen</button>
        </div>
      ) : (
        <div
          style={{
            ...styles.scanArea,
            borderColor: loading ? '#3C3489' : '#e0e0e0',
            background: loading ? '#f0eeff' : '#f8f8f8',
          }}
          onClick={() => inputRef.current?.focus()}
        >
          <div style={styles.scanIcon}>
            {loading ? '...' : (
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#3C3489" strokeWidth="1.5">
                <rect x="3" y="3" width="5" height="5"/><rect x="16" y="3" width="5" height="5"/>
                <rect x="3" y="16" width="5" height="5"/><path d="M16 16h2v2h-2z"/>
                <path d="M18 16h2v2h-2z"/><path d="M16 18h2v2h-2z"/><path d="M18 18h2v2h-2z"/>
              </svg>
            )}
          </div>
          <div style={styles.scanText}>{loading ? 'Verarbeite...' : 'Bereit zum Scannen'}</div>
          <div style={styles.scanHint}>USB/Bluetooth Scanner einfach verwenden</div>
        </div>
      )}

      {!cameraActive && !loading && (
        <button style={styles.btnCamera} onClick={startCamera}>Kamera verwenden</button>
      )}
    </div>
  )
}

const styles = {
  header: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' },
  backBtn: {
    background: 'white', border: '1.5px solid #e0e0e0', borderRadius: '8px',
    padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: '24px', fontWeight: '700', color: '#1a1a1a' },
  subtitle: { fontSize: '14px', color: '#888', margin: '0 0 24px' },
  resultBox: { borderRadius: '12px', padding: '24px', marginBottom: '20px', textAlign: 'center', border: '2px solid' },
  resultIcon: { fontSize: '36px', marginBottom: '8px' },
  resultMessage: { fontSize: '18px', fontWeight: '600', color: '#1a1a1a', marginBottom: '4px' },
  resultStamps: { fontSize: '14px', color: '#666', marginBottom: '16px' },
  btnNext: {
    background: '#3C3489', color: 'white', border: 'none',
    borderRadius: '10px', padding: '10px 24px', fontSize: '14px', fontWeight: '600', cursor: 'pointer',
  },
  hiddenInput: { position: 'fixed', top: '-1000px', left: '-1000px', opacity: 0, width: '1px', height: '1px' },
  scanArea: {
    borderRadius: '16px', padding: '60px 24px', textAlign: 'center',
    cursor: 'pointer', border: '2px dashed', transition: 'all 0.2s', marginBottom: '16px',
  },
  scanIcon: { marginBottom: '16px', display: 'flex', justifyContent: 'center' },
  scanText: { fontSize: '18px', fontWeight: '600', color: '#1a1a1a', marginBottom: '8px' },
  scanHint: { fontSize: '13px', color: '#aaa' },
  cameraContainer: { borderRadius: '16px', overflow: 'hidden', marginBottom: '16px', background: '#000' },
  btnStop: { width: '100%', padding: '12px', background: '#ff4444', color: 'white', border: 'none', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  btnCamera: { width: '100%', padding: '14px', background: '#f0eeff', color: '#3C3489', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
}