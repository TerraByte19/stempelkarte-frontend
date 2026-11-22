import { useEffect, useRef, useState } from 'react'
import api from '../../api'
import { useLang } from '../../LangContext'

/**
 * Unterkonto: Stempel korrigieren. Die Karte wird gescannt - es gibt keine
 * Suche und keinen Kundennamen. Das Backend schreibt jede Korrektur mit
 * Filiale und Login ins Protokoll.
 */
export default function FilialeKorrektur() {
  const { t } = useLang()
  const [kamera, setKamera] = useState(false)
  const [karte, setKarte] = useState(null)
  const [neu, setNeu] = useState(0)
  const [fehler, setFehler] = useState('')
  const [gespeichert, setGespeichert] = useState(false)
  const [laeuft, setLaeuft] = useState(false)
  const leser = useRef(null)

  async function stop() {
    if (leser.current) {
      try { await leser.current.stop(); leser.current.clear() } catch { /* schon zu */ }
      leser.current = null
    }
    setKamera(false)
  }

  // Seite verlassen: Kamera loslassen.
  useEffect(() => () => {
    if (leser.current) { try { leser.current.stop().catch(() => {}) } catch { /* schon zu */ } }
  }, [])

  async function nachschlagen(qrPayload) {
    setFehler('')
    setGespeichert(false)
    try {
      const r = await api.post('/api/filiale/korrektur/karte', { qrPayload })
      setKarte(r.data)
      setNeu(r.data.stempel)
    } catch (err) {
      setKarte(null)
      setFehler(err?.response?.data?.error || t('kette_kor_error'))
    }
  }

  async function scannen() {
    setFehler('')
    setKarte(null)
    setGespeichert(false)
    setKamera(true)
    await new Promise(r => setTimeout(r, 300))
    try {
      // html5-qrcode ist gross und wird nur hier gebraucht: erst jetzt laden.
      const { Html5Qrcode } = await import('html5-qrcode')
      leser.current = new Html5Qrcode('filiale-korrektur-leser')
      await leser.current.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          async text => { await stop(); nachschlagen(text) },
          () => {}
      )
    } catch {
      setFehler(t('common_camera_error'))
      setKamera(false)
    }
  }

  async function speichern() {
    if (!karte || laeuft) return
    setLaeuft(true)
    setFehler('')
    try {
      const r = await api.put(`/api/filiale/korrektur/${karte.customerCardId}`, { stamps: neu })
      setKarte(r.data)
      setNeu(r.data.stempel)
      setGespeichert(true)
    } catch (err) {
      setFehler(err?.response?.data?.error || t('kette_fehler'))
    } finally {
      setLaeuft(false)
    }
  }

  return (
      <div style={s.page}>
        <h1 style={s.title}>{t('kette_kor_title')}</h1>
        <p style={s.subtitle}>{t('kette_kor_hint')}</p>
        {fehler && <div style={s.fehler}>{fehler}</div>}

        {kamera && (
            <div style={s.card}>
              <div id="filiale-korrektur-leser" style={s.leser} />
              <button type="button" style={s.stop} onClick={stop}>{t('kette_kor_stop')}</button>
            </div>
        )}

        {!kamera && !karte && (
            <button type="button" style={s.primaer} onClick={scannen}>{t('kette_kor_scan')}</button>
        )}

        {!kamera && karte && (
            <div style={s.card}>
              <div style={s.kartenName}>{karte.karte}</div>
              <div style={s.stand}>{t('kette_kor_stand', { stempel: karte.stempel, schwelle: karte.schwelle })}</div>
              {karte.korrigierbar ? (
                  <>
                    <div style={s.label}>{t('kette_kor_neu')}</div>
                    <div style={s.zaehler}>
                      <button type="button" style={s.rund} onClick={() => setNeu(n => Math.max(0, n - 1))} aria-label="-">−</button>
                      <span style={s.zahl}>{neu}</span>
                      <button type="button" style={s.rund} onClick={() => setNeu(n => Math.min(karte.schwelle, n + 1))} aria-label="+">+</button>
                    </div>
                    <button type="button" style={s.primaer} onClick={speichern} disabled={laeuft || neu === karte.stempel}>
                      {t('kette_kor_save')}
                    </button>
                    {gespeichert && <div style={s.ok}>{t('kette_kor_saved')}</div>}
                  </>
              ) : (
                  <div style={s.hinweis}>{karte.hinweis}</div>
              )}
              <button type="button" style={s.leise} onClick={scannen}>{t('kette_kor_other')}</button>
            </div>
        )}
      </div>
  )
}

const s = {
  page: { maxWidth: 480, margin: '0 auto' },
  title: { fontSize: 24, fontWeight: 700, margin: '0 0 4px', color: '#1a1a1a' },
  subtitle: { fontSize: 14, color: '#888', margin: '0 0 20px', lineHeight: 1.5 },
  fehler: { background: '#fff0f0', color: '#d00', padding: '10px 14px', borderRadius: 8, fontSize: 14, marginBottom: 12 },
  card: { background: 'white', borderRadius: 12, padding: 20, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', textAlign: 'center' },
  leser: { width: '100%', borderRadius: 12, overflow: 'hidden', marginBottom: 12 },
  stop: { width: '100%', padding: 12, background: '#ff4444', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  primaer: { width: '100%', padding: 14, background: '#3C3489', color: 'white', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  kartenName: { fontSize: 17, fontWeight: 700, color: '#1a1a1a' },
  stand: { fontSize: 14, color: '#666', margin: '4px 0 16px' },
  label: { fontSize: 12, color: '#999', textTransform: 'uppercase', letterSpacing: 0.4 },
  zaehler: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, margin: '8px 0 16px' },
  rund: { width: 52, height: 52, borderRadius: '50%', border: '1.5px solid #e0e0e0', background: 'white', fontSize: 26, color: '#3C3489', cursor: 'pointer', fontFamily: 'inherit', lineHeight: 1 },
  zahl: { fontSize: 40, fontWeight: 700, color: '#3C3489', minWidth: 60 },
  ok: { color: '#1e7a4c', fontSize: 14, fontWeight: 600, marginTop: 10 },
  hinweis: { background: '#fbecd2', color: '#9a5d00', padding: '10px 14px', borderRadius: 8, fontSize: 14 },
  leise: { background: 'none', border: 'none', color: '#888', fontSize: 14, cursor: 'pointer', marginTop: 14, fontFamily: 'inherit' },
}
