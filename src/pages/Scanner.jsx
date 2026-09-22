import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Html5Qrcode } from 'html5-qrcode'
import { useLang, localeTag } from '../LangContext'
import Icon from '../components/Icon'
import { punkteFuer, formatierePunkte, centsAusEingabe } from '../lib/pointsOf'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

// Ueber 500 Euro wird nachgefragt. Billigste Abwehr gegen den Vertipper,
// wegen dem es die Korrektur ueberhaupt gibt: 1450 statt 145 ist schneller
// getippt, als man denkt.
const NACHFRAGE_AB_CENTS = 50_000

export default function Scanner() {
  const { t, lang } = useLang()
  const [qrInput, setQrInput] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)
  const [pendingScan, setPendingScan] = useState(null)
  const [selectedCount, setSelectedCount] = useState(1)

  // Punktekarten: was der Server nach dem Scan ueber die Karte sagt.
  const [scanState, setScanState] = useState(null)
  const [betrag, setBetrag] = useState('')
  const [pointsError, setPointsError] = useState(null)
  const [korrekturOffen, setKorrekturOffen] = useState(false)
  const [korrekturBetrag, setKorrekturBetrag] = useState('')
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
    punkteZustandZuruecksetzen()

    // Welcher Kartentyp? Steht nicht im QR, sondern hinter der cardId.
    try {
      const token = localStorage.getItem('staffToken')
      const res = await fetch(`${API_URL}/api/scan/state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Staff-Token': token },
        body: JSON.stringify({ qrPayload: payload }),
      })
      if (res.ok) setScanState(await res.json())
      // Kein ok: entweder kennt der Server die Route noch nicht (Deploy
      // laeuft) oder die Karte ist unbekannt. Beides faellt auf die
      // Stempelmaske zurueck; der eigentliche Fehler kommt dann beim Buchen
      // mit einer brauchbaren Meldung.
    } catch {
      // Netzfehler: ebenfalls Stempelmaske. Kein Abbruch, das Personal
      // steht am Kunden.
    }
  }

  function punkteZustandZuruecksetzen() {
    setScanState(null)
    setBetrag('')
    setPointsError(null)
    setKorrekturOffen(false)
    setKorrekturBetrag('')
  }

  /**
   * Gemeinsamer Weg fuer buchen, einloesen, korrigieren und zuruecknehmen.
   * Alle vier schicken denselben QR mit, bekommen dieselbe Antwort und enden
   * im selben Ergebnisfenster.
   */
  async function punkteAufruf(pfad, rumpf) {
    setLoading(true)
    setPointsError(null)
    try {
      const token = localStorage.getItem('staffToken')
      const res = await fetch(`${API_URL}${pfad}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Staff-Token': token },
        body: JSON.stringify({ qrPayload: pendingScan, ...rumpf }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setResult({ success: true, points: true, data })
        setPendingScan(null)
      } else if (res.status === 404) {
        // Meistens kein Fehler im Panel, sondern ein laufender Deploy.
        setPointsError(t('scan_points_backend_old'))
      } else {
        setPointsError(data.error || t('scan_server_error'))
      }
    } catch {
      setPointsError(t('scan_server_error'))
    } finally {
      setLoading(false)
    }
  }

  async function buchen(cents) {
    if (cents === null) return
    if (cents >= NACHFRAGE_AB_CENTS) {
      const text = t('scan_points_confirm_big', { betrag: euroText(cents) })
      if (!confirm(text)) return
    }
    await punkteAufruf('/api/points/earn', { amountCents: cents })
  }

  async function korrigieren() {
    // Vorzeichen selbst lesen: centsAusEingabe weist negative Eingaben ab,
    // weil beim normalen Buchen nichts Negatives gemeint sein kann.
    const text = korrekturBetrag.trim()
    const negativ = text.startsWith('-')
    const cents = centsAusEingabe(negativ ? text.slice(1) : text)
    if (cents === null) return
    await punkteAufruf('/api/points/correct', { amountCents: negativ ? -cents : cents })
  }

  function euroText(cents) {
    return (cents / 100).toFixed(2).replace('.', ',')
  }

  /** Eine Buchung in einer Zeile, wie sie ueber dem Zuruecknehmen steht. */
  function buchungText(b) {
    const uhr = new Date(b.createdAt)
      .toLocaleTimeString(localeTag(lang), { hour: '2-digit', minute: '2-digit' })
    const praemie = b.rewardName ? ` (${b.rewardName})` : ''
    return `${b.deltaText} ${t('cards_catalog_cost')}${praemie} - ${uhr}`
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
      // Antwort darf auch kein JSON sein (Proxy-Fehlerseite) - dann leeres Objekt.
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setResult({ success: true, data })
      } else {
        // Meldung vom Server zeigen. Vorher stand hier immer "Ungueltiger
        // QR-Code" - abgelaufenes Token, unbekannte Karte und Serverfehler
        // sahen damit alle gleich aus und waren im Laden nicht zu unterscheiden.
        setResult({ success: false, message: data.error || t('scan_invalid_qr') })
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
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setResult({ success: true, data })
      } else {
        setResult({ success: false, message: data.error || t('scan_invalid_qr') })
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
    punkteZustandZuruecksetzen()
    scanningRef.current = false
    startCamera()
  }

  function cancelScan() {
    setPendingScan(null)
    punkteZustandZuruecksetzen()
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
          if (result.points) {
            const d = result.data
            return (
              <div style={{ ...styles.resultBox, background: '#F0FFF4', borderColor: '#2C5F2E' }}>
                <div style={{ ...styles.resultIcon, display: 'flex', justifyContent: 'center', color: '#2C5F2E' }}>
                  <Icon name="check" size={34} strokeWidth={2.4} />
                </div>
                <div style={styles.resultMessage}>
                  {t('scan_points_balance')}: {d.pointsText}
                </div>
                <div style={styles.resultStamps}>
                  {d.zielName
                    ? `${t('scan_points_next_goal')}: ${d.zielName} - ${t('scan_points_missing', { n: d.fehlendText })}`
                    : t('scan_points_no_goal')}
                </div>
                <button style={{ ...styles.btnNext, background: '#3C3489', color: '#fff' }}
                        onClick={nextCustomer}>{t('scan_next')}</button>
              </div>
            )
          }
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

        {pendingScan && !result && (() => {
          // Die Weiche. Ohne Antwort vom Server (alter Stand, Netzfehler)
          // bleibt es bei der Stempelmaske - die ist der Weg, der in echten
          // Laeden laeuft.
          const istPunkte = (scanState?.type ?? 'STAMP') === 'POINTS'
          const cents = centsAusEingabe(betrag)

          if (!istPunkte) return (
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
          )

          return (
            <div style={styles.popup}>
              <h2 style={styles.popupTitle}>{t('scan_points_title')}</h2>
              <p style={styles.popupSubtitle}>{scanState.customerName}</p>

              <div style={styles.standBox}>
                <div style={styles.standLabel}>{t('scan_points_balance')}</div>
                <div style={styles.standWert}>{scanState.pointsText}</div>
                <div style={styles.zielZeile}>
                  {scanState.ziel
                    ? `${t('scan_points_next_goal')}: ${scanState.ziel.name} - ${t('scan_points_missing', { n: scanState.fehlendText })}`
                    : t('scan_points_no_goal')}
                </div>
              </div>

              <label style={styles.feldLabel}>{t('scan_points_amount')}</label>
              <input style={styles.betragFeld} type="text" inputMode="decimal"
                     placeholder={t('scan_points_amount_ph')} value={betrag}
                     onChange={e => setBetrag(e.target.value)} autoFocus/>

              {/* Live, was die Buchung ergibt. Der Grund, warum die Rechnung
                  auch im Frontend liegt: das Personal soll das Ergebnis
                  sehen, BEVOR es bestaetigt - nicht danach. */}
              {cents !== null && (
                <div style={styles.vorschau}>
                  {t('scan_points_preview', {
                    betrag: euroText(cents),
                    punkte: formatierePunkte(punkteFuer(
                      cents, scanState.pointsPerEuroX100, scanState.pointsRounding)),
                  })}
                </div>
              )}

              {pointsError && <div style={styles.fehlerBanner}>{pointsError}</div>}

              <button style={{ ...styles.confirmBtn, opacity: cents === null ? 0.5 : 1 }}
                      onClick={() => buchen(cents)} disabled={loading || cents === null}>
                {loading ? t('scan_processing') : t('scan_points_book')}
              </button>

              {scanState.katalog?.length > 0 && (
                <div style={styles.katalog}>
                  <div style={styles.katalogTitel}>{t('scan_points_redeem')}</div>
                  {scanState.katalog.map(r => (
                    <button key={r.id}
                            style={{ ...styles.praemie,
                              opacity: r.bezahlbar ? 1 : 0.45,
                              cursor: r.bezahlbar ? 'pointer' : 'default' }}
                            disabled={!r.bezahlbar || loading}
                            onClick={() => punkteAufruf('/api/points/redeem', { rewardId: r.id })}>
                      <span style={styles.praemieName}>{r.name}</span>
                      <span style={styles.praemieKosten}>
                        {r.bezahlbar
                          ? r.costText
                          : t('scan_points_missing', { n: formatierePunkte(r.fehlendX100) })}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {!korrekturOffen ? (
                <button style={styles.nebenKnopf} onClick={() => setKorrekturOffen(true)}>
                  {t('scan_points_correct')}
                </button>
              ) : (
                <div style={styles.korrekturBox}>
                  <div style={styles.hinweis}>{t('scan_points_correct_hint')}</div>
                  {/* inputMode text statt decimal: die Dezimaltastatur
                      mancher Geraete hat kein Minus. */}
                  <input style={styles.betragFeld} type="text" inputMode="text"
                         value={korrekturBetrag}
                         onChange={e => setKorrekturBetrag(e.target.value)} autoFocus/>
                  <button style={styles.confirmBtn} onClick={korrigieren} disabled={loading}>
                    {t('scan_points_correct')}
                  </button>
                </div>
              )}

              {/* Der Server liefert hier nur eine Buchung, die noch nicht
                  zurueckgenommen ist und selbst keine Gegenbuchung ist -
                  deshalb genuegt die Pruefung auf Vorhandensein. */}
              {scanState.letzteBuchung && (
                <div style={styles.letzteBox}>
                  <div style={styles.hinweis}>
                    {t('scan_points_last', { text: buchungText(scanState.letzteBuchung) })}
                  </div>
                  <button style={styles.nebenKnopf} disabled={loading}
                          onClick={() => punkteAufruf('/api/points/undo',
                            { bookingId: scanState.letzteBuchung.id })}>
                    {t('scan_points_undo')}
                  </button>
                </div>
              )}

              <button style={styles.cancelBtn} onClick={cancelScan}>{t('scan_cancel')}</button>
            </div>
          )
        })()}

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
  standBox: { background: '#f8f8ff', borderRadius: '14px', padding: '16px', marginBottom: '16px' },
  standLabel: { fontSize: '12px', fontWeight: '600', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' },
  standWert: { fontSize: '36px', fontWeight: '900', color: '#3C3489', lineHeight: 1.1, margin: '4px 0' },
  zielZeile: { fontSize: '13px', color: '#666' },
  // textAlign 'start' statt 'left': auf Arabisch laeuft die Oberflaeche
  // von rechts nach links.
  feldLabel: { display: 'block', fontSize: '13px', fontWeight: '600', color: '#555', marginBottom: '6px', textAlign: 'start' },
  betragFeld: { width: '100%', padding: '16px', fontSize: '22px', fontWeight: '700', textAlign: 'center', border: '1.5px solid #e0e0e0', borderRadius: '12px', marginBottom: '8px', boxSizing: 'border-box' },
  vorschau: { fontSize: '14px', fontWeight: '600', color: '#2C5F2E', background: '#F0FFF4', borderRadius: '10px', padding: '10px', marginBottom: '14px' },
  fehlerBanner: { fontSize: '13px', fontWeight: '600', color: '#c0392b', background: '#fff0f0', border: '1.5px solid #f5c6cb', borderRadius: '10px', padding: '10px', marginBottom: '12px' },
  katalog: { marginTop: '8px', marginBottom: '12px' },
  katalogTitel: { fontSize: '12px', fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', textAlign: 'start' },
  praemie: { width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', padding: '14px', background: '#f8f8f8', border: '1.5px solid #e8e8e8', borderRadius: '12px', marginBottom: '6px', fontSize: '15px' },
  praemieName: { fontWeight: '700', color: '#1a1a1a' },
  praemieKosten: { fontSize: '13px', color: '#666' },
  nebenKnopf: { width: '100%', padding: '12px', background: 'transparent', color: '#3C3489', border: '1.5px solid #ddd', borderRadius: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', marginBottom: '10px' },
  korrekturBox: { background: '#fffdf5', border: '1.5px solid #f0e0b0', borderRadius: '12px', padding: '12px', marginBottom: '10px' },
  letzteBox: { borderTop: '1px solid #eee', paddingTop: '12px', marginTop: '4px' },
  hinweis: { fontSize: '12px', color: '#888', marginBottom: '8px', textAlign: 'start' },
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