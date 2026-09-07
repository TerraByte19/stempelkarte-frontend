import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Html5Qrcode } from 'html5-qrcode'
import { useLang } from '../LangContext'
import Icon from '../components/Icon'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

export default function Scanner() {
  const { t } = useLang()
  const [qrInput, setQrInput] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)
  const [pendingScan, setPendingScan] = useState(null)
  const [selectedCount, setSelectedCount] = useState(1)
  const inputRef = useRef()
  const html5QrRef = useRef(null)
  const scanningRef = useRef(false)
  const navigate = useNavigate()

  // Besitzer (mit token) → Zurück-Pfeil zum Dashboard.
  // Mitarbeiter (nur staffToken) → Abmelden-Button zurück zum Login.
  const isScannerDevice = !localStorage.getItem('token')

  function logout() {
    localStorage.removeItem('staffToken')
    localStorage.removeItem('staffTokenLabel')
    navigate('/login')
  }

  useEffect(() => {
    inputRef.current?.focus()
    return () => stopCamera()
  }, [])

  useEffect(() => {
    if (!qrInput.trim()) return
    if (scanningRef.current) return
    const timer = setTimeout(() => {
      scanningRef.current = true
      handleQrScanned(qrInput.trim())
    }, 300)
    return () => clearTimeout(timer)
  }, [qrInput])

  async function handleQrScanned(payload) {
    setQrInput('')
    await stopCamera()
    setPendingScan(payload)
    setSelectedCount(1)
  }

  async function confirmScan() {
    if (!pendingScan) return
    setLoading(true)
    setResult(null)
    try {
      const token = localStorage.getItem('staffToken')
      const res = await fetch(`${API_URL}/api/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Staff-Token': token },
        body: JSON.stringify({ qrPayload: pendingScan, count: selectedCount }),
      })
      const data = await res.json()
      if (res.ok) {
        setResult({ success: true, data })
      } else {
        setResult({ success: false, message: t('scan_invalid_qr') })
      }
    } catch {
      setResult({ success: false, message: t('scan_server_error') })
    } finally {
      setLoading(false)
      setPendingScan(null)
    }
  }

  async function resetCard() {
    if (!pendingScan) return
    setLoading(true)
    setResult(null)
    try {
      const token = localStorage.getItem('staffToken')
      const res = await fetch(`${API_URL}/api/scan/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Staff-Token': token },
        body: JSON.stringify({ qrPayload: pendingScan }),
      })
      const data = await res.json()
      if (res.ok) {
        setResult({ success: true, data })
      } else {
        setResult({ success: false, message: t('scan_invalid_qr') })
      }
    } catch {
      setResult({ success: false, message: t('scan_server_error') })
    } finally {
      setLoading(false)
      setPendingScan(null)
    }
  }

  // Dauer-Autofokus/-Belichtung/-Weissabgleich: hilft vor allem iPhone-Safari,
  // das die Kamera im Web-Scanner sonst auf einem Wert "einfriert" -> heller
  // QR (z.B. auf einem Kunden-Display) wird ueberbelichtet und verschwindet.
  // Nicht unterstuetzte Felder ignoriert der Browser still - kein Risiko.
  const KAMERA_FEINSCHLIFF = [
    { focusMode: 'continuous' },
    { exposureMode: 'continuous' },
    { whiteBalanceMode: 'continuous' },
  ]

  async function startCamera() {
    setCameraActive(true)
    await new Promise(resolve => setTimeout(resolve, 300))
    try {
      html5QrRef.current = new Html5Qrcode('qr-reader')
      await html5QrRef.current.start(
          { facingMode: 'environment' },
          {
            fps: 20,
            // Kein qrbox mehr: das GANZE Kamerabild wird gescannt (wie die
            // iPhone-Kamera-App) - kein enger Rahmen, in den man treffen muss.
            videoConstraints: {
              facingMode: 'environment',
              width: { ideal: 1280 },
              height: { ideal: 720 },
              advanced: KAMERA_FEINSCHLIFF,
            },
          },
          (decodedText) => {
            if (!scanningRef.current) {
              scanningRef.current = true
              handleQrScanned(decodedText)
            }
          },
          () => {}
      )
    } catch (e) {
      console.error(e)
      setCameraActive(false)
    }
  }

  // Aufs Kamerabild tippen -> Fokus/Belichtung neu einpendeln lassen.
  // Rettungsanker, wenn die iPhone-Kamera bei starker Helligkeit haengt.
  async function fokusAntippen() {
    try {
      await html5QrRef.current?.applyVideoConstraints({ advanced: KAMERA_FEINSCHLIFF })
    } catch { /* Geraet unterstuetzt das nicht - egal */ }
  }

  async function stopCamera() {
    if (html5QrRef.current) {
      try {
        await html5QrRef.current.stop()
        html5QrRef.current.clear()
        html5QrRef.current = null
      } catch {
        html5QrRef.current = null
      }
    }
    setCameraActive(false)
  }

  function nextCustomer() {
    setResult(null)
    scanningRef.current = false
    startCamera()
  }

  function cancelScan() {
    setPendingScan(null)
    scanningRef.current = false
    startCamera()
  }

  return (
      <div>
        <div style={styles.header}>
          {/* Besitzer: Pfeil zum Dashboard. Mitarbeiter: Abmelden zurück zum Login. */}
          {isScannerDevice ? (
              <button style={styles.backBtn} onClick={logout}>{t('nav_logout')}</button>
          ) : (
              <button style={styles.backBtn} onClick={() => navigate('/')}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 5l-7 7 7 7"/>
                </svg>
              </button>
          )}
          <h1 style={styles.title}>{t('scan_title')}</h1>
        </div>

        {/* Volle Breite wie am Anfang, nur die Hoehe etwas gekuerzt -> das Video
            wird oben/unten leicht beschnitten (object-fit:cover, siehe index.css).
            Gescannt wird trotzdem das volle Kamerabild, nicht nur der Ausschnitt. */}
        <div id="qr-reader" onClick={fokusAntippen} title="Zum Scharfstellen tippen" style={{ display: cameraActive ? 'block' : 'none', width: '100%', height: '520px', maxHeight: '70vh', marginBottom: '8px', borderRadius: '16px', overflow: 'hidden', cursor: 'pointer' }} />

        {cameraActive && (
            <>
              <p style={styles.camHint}>Auf den QR-Code halten &middot; bei Unschaerfe aufs Bild tippen</p>
              <button style={styles.btnStop} onClick={stopCamera}>{t('scan_stop_camera')}</button>
            </>
        )}

        {result && (() => {
          const d = result.success ? result.data : null
          const isRedeemed = !!d && d.action === 'redeemed'
          const isFull = !!d && !isRedeemed && (
              d.action === 'full' || d.rewardEarned ||
              (d.rewardThreshold > 0 && d.stamps >= d.rewardThreshold)
          )
          const left = d ? (d.rewardThreshold - d.stamps) : 0
          const isAlmost = !!d && !isFull && !isRedeemed && d.rewardThreshold > 0 && left > 0 && left <= 2

          const box = !result.success
              ? { bg: '#FFF0F0', border: '#D00' }
              : isRedeemed ? { bg: '#0B7A34', border: '#0B7A34' }
              : isFull ? { bg: '#F4B400', border: '#F4B400' }
              : { bg: '#F0FFF4', border: '#2C5F2E' }

          return (
            <div style={{ ...styles.resultBox, background: box.bg, borderColor: box.border }}>
              {isRedeemed && (
                  <div style={styles.hero}>
                    <div style={{ ...styles.heroIcon, color: '#fff', display: 'flex', justifyContent: 'center' }}><Icon name="gift" size={56} strokeWidth={1.5} /></div>
                    <div style={{ ...styles.heroTitle, color: '#fff' }}>{t('scan_redeemed_title')}</div>
                    <div style={{ ...styles.heroSub, color: 'rgba(255,255,255,0.92)' }}>
                      {t('scan_redeemed_sub', { reward: d.rewardText || '' })}
                    </div>
                  </div>
              )}

              {isFull && (
                  <div style={styles.hero}>
                    <div style={{ ...styles.heroIcon, color: '#1a1a1a', display: 'flex', justifyContent: 'center' }}><Icon name="award" size={56} strokeWidth={1.5} /></div>
                    <div style={{ ...styles.heroTitle, color: '#1a1a1a' }}>{t('scan_full_title')}</div>
                    <div style={{ ...styles.heroSub, color: '#5a4600' }}>
                      {t('scan_full_sub', { reward: d.rewardText || '' })}
                    </div>
                  </div>
              )}

              {!isRedeemed && !isFull && (
                  <>
                    <div style={{ ...styles.resultIcon, display: 'flex', justifyContent: 'center', color: result.success ? '#2C5F2E' : '#D00' }}>
                      <Icon name={result.success ? 'check' : 'x'} size={34} strokeWidth={2.4} />
                    </div>
                    <div style={styles.resultMessage}>
                      {result.success ? result.data.message : result.message}
                    </div>
                  </>
              )}

              {result.success && (
                  <div style={{
                    ...styles.resultStamps,
                    color: isRedeemed ? 'rgba(255,255,255,0.92)' : isFull ? '#5a4600' : '#666',
                  }}>
                    Neuer Stand: {d.stamps}/{d.rewardThreshold}
                    {d.stampsAdded > 1 && <span style={styles.badge}>+{d.stampsAdded}</span>}
                  </div>
              )}

              {isAlmost && (
                  <div style={{ ...styles.almostHint, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Icon name="bolt" size={15} strokeWidth={2} />
                    {t('scan_almost', { left, reward: d.rewardText || '' })}
                  </div>
              )}

              <button style={{
                ...styles.btnNext,
                background: isFull ? '#1a1a1a' : isRedeemed ? '#fff' : '#3C3489',
                color: isRedeemed ? '#0B7A34' : '#fff',
              }} onClick={nextCustomer}>{t('scan_next')}</button>
            </div>
          )
        })()}

        {pendingScan && !result && (
            <div style={styles.popup}>
              <div style={{ ...styles.popupIcon, display: 'flex', justifyContent: 'center', color: '#3C3489' }}><Icon name="check-circle" size={44} strokeWidth={1.8} /></div>
              <h2 style={styles.popupTitle}>{t('scan_detected')}</h2>
              <p style={styles.popupSubtitle}>{t('scan_how_many')}</p>
              <div style={styles.countButtons}>
                {[1,2,3,4,5,6,7,8,9,10].map(n => (
                    <button key={n} style={{ ...styles.countBtn, background: selectedCount === n ? '#3C3489' : '#f0f0f0', color: selectedCount === n ? 'white' : '#333' }} onClick={() => setSelectedCount(n)}>{n}</button>
                ))}
              </div>
              <button style={styles.confirmBtn} onClick={confirmScan} disabled={loading}>
                {loading ? t('scan_processing') : `${selectedCount} ${t('scan_confirm')}`}
              </button>
              <button style={styles.resetBtn} onClick={resetCard} disabled={loading}>
                {t('scan_reset')}
              </button>
              <button style={styles.cancelBtn} onClick={cancelScan}>{t('scan_cancel')}</button>
            </div>
        )}

        {!pendingScan && !result && !cameraActive && (
            <>
              <p style={styles.subtitle}>{t('scan_ready')}</p>
              <input ref={inputRef} style={styles.hiddenInput} type="text" value={qrInput} onChange={e => setQrInput(e.target.value)} disabled={loading} autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck="false" />
              <div style={styles.scanArea} onClick={() => inputRef.current?.focus()}>
                <div style={styles.scanIcon}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#3C3489" strokeWidth="1.5">
                    <rect x="3" y="3" width="5" height="5"/><rect x="16" y="3" width="5" height="5"/>
                    <rect x="3" y="16" width="5" height="5"/><path d="M16 16h2v2h-2z"/>
                    <path d="M18 16h2v2h-2z"/><path d="M16 18h2v2h-2z"/><path d="M18 18h2v2h-2z"/>
                  </svg>
                </div>
                <div style={styles.scanText}>{t('scan_ready')}</div>
                <div style={styles.scanHint}>{t('scan_hint')}</div>
              </div>
              <button style={styles.btnCamera} onClick={startCamera}>{t('scan_camera')}</button>
            </>
        )}
      </div>
  )
}

const styles = {
  header: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' },
  backBtn: { background: 'white', border: '1.5px solid #e0e0e0', borderRadius: '8px', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: '24px', fontWeight: '700', color: '#1a1a1a' },
  subtitle: { fontSize: '14px', color: '#888', margin: '0 0 20px' },
  popup: { background: 'white', borderRadius: '20px', padding: '32px 24px', textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', border: '2px solid #e0e0e0', marginBottom: '20px' },
  popupIcon: { fontSize: '48px', marginBottom: '12px' },
  popupTitle: { fontSize: '22px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 6px' },
  popupSubtitle: { fontSize: '14px', color: '#666', margin: '0 0 20px' },
  countButtons: { display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginBottom: '20px' },
  countBtn: { width: '52px', height: '52px', borderRadius: '12px', border: 'none', fontSize: '18px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.15s' },
  confirmBtn: { width: '100%', padding: '14px', background: '#3C3489', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', marginBottom: '10px' },
  resetBtn: { width: '100%', padding: '12px', background: '#fff0f0', color: '#c0392b', border: '1.5px solid #f5c6cb', borderRadius: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', marginBottom: '10px' },
  cancelBtn: { width: '100%', padding: '12px', background: 'transparent', color: '#999', border: 'none', borderRadius: '12px', fontSize: '14px', cursor: 'pointer' },
  badge: { background: '#3C3489', color: 'white', borderRadius: '20px', padding: '2px 10px', fontSize: '12px', marginLeft: '8px' },
  resultBox: { borderRadius: '16px', padding: '24px', marginBottom: '20px', textAlign: 'center', border: '3px solid' },
  resultIcon: { fontSize: '36px', marginBottom: '8px' },
  resultMessage: { fontSize: '18px', fontWeight: '600', color: '#1a1a1a', marginBottom: '4px' },
  resultStamps: { fontSize: '15px', fontWeight: '600', color: '#666', marginBottom: '16px' },
  // Grosser, unuebersehbarer Hinweis bei "Karte voll" / "Belohnung eingeloest"
  hero: { padding: '8px 0 14px' },
  heroIcon: { fontSize: '64px', lineHeight: 1, marginBottom: '10px' },
  heroTitle: { fontSize: '30px', fontWeight: '900', letterSpacing: '0.5px', lineHeight: 1.1, marginBottom: '8px' },
  heroSub: { fontSize: '16px', fontWeight: '600', marginBottom: '14px' },
  almostHint: { fontSize: '14px', fontWeight: '700', color: '#B8860B', background: '#FFF8E1', borderRadius: '10px', padding: '8px 12px', marginBottom: '14px' },
  btnNext: { border: 'none', borderRadius: '12px', padding: '14px 24px', fontSize: '16px', fontWeight: '800', cursor: 'pointer', width: '100%' },
  hiddenInput: { position: 'fixed', top: '-1000px', left: '-1000px', opacity: 0, width: '1px', height: '1px' },
  scanArea: { borderRadius: '16px', padding: '60px 24px', textAlign: 'center', cursor: 'pointer', border: '2px dashed #e0e0e0', background: '#f8f8f8', transition: 'all 0.2s', marginBottom: '16px' },
  scanIcon: { marginBottom: '16px', display: 'flex', justifyContent: 'center' },
  scanText: { fontSize: '18px', fontWeight: '600', color: '#1a1a1a', marginBottom: '8px' },
  scanHint: { fontSize: '13px', color: '#aaa' },
  camHint: { fontSize: '12px', color: '#999', textAlign: 'center', margin: '0 0 12px' },
  btnStop: { width: '100%', padding: '12px', background: '#ff4444', color: 'white', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', marginBottom: '16px' },
  btnCamera: { width: '100%', padding: '14px', background: '#f0eeff', color: '#3C3489', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
}