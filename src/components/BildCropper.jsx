import { useEffect, useRef, useState } from 'react'
import { useLang } from '../LangContext'

/**
 * Bild-Zuschnitt im WhatsApp-Stil: Bild ziehen + zoomen, der sichtbare
 * Ausschnitt (Kreis / Quadrat / breites Rechteck) wird uebernommen.
 *
 * Props:
 *  datei       File aus <input type="file">
 *  form        'kreis' | 'quadrat' | 'breit'   (Standard 'kreis')
 *  ratio       Seitenverhaeltnis B/H bei form='breit'  (Standard 3)
 *  ausgabe     Ausgabe-Breite in px             (Standard 600)
 *  onFertig    (blob) => void   PNG-Blob des Ausschnitts
 *  onAbbrechen () => void
 */
export default function BildCropper({ datei, form = 'kreis', ratio = 3, ausgabe = 600, onFertig, onAbbrechen }) {
  const { t } = useLang()
  const buehneRef = useRef(null)
  const canvasRef = useRef(null)
  const bildRef = useRef(null)
  const zustand = useRef({ skala: 1, minSkala: 1, maxSkala: 4, x: 0, y: 0 })
  const zeiger = useRef(new Map())
  const letzterPinch = useRef(0)
  const [bereit, setBereit] = useState(false)
  const [zoom, setZoom] = useState(1)

  const rechteck = form === 'breit'
  const seitenVerh = rechteck ? ratio : 1
  const rund = form === 'kreis'
  const maskAnteil = rechteck ? 0.92 : 0.88

  // Bild laden
  useEffect(() => {
    if (!datei) return
    const url = URL.createObjectURL(datei)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      bildRef.current = img
      setBereit(true)
      passeAn()
      start()
    }
    img.onerror = () => { URL.revokeObjectURL(url); onAbbrechen && onAbbrechen() }
    img.src = url
    return () => URL.revokeObjectURL(url)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datei])

  useEffect(() => {
    const ro = new ResizeObserver(() => { passeAn(); begrenze(); zeichne() })
    if (buehneRef.current) ro.observe(buehneRef.current)
    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function maskCss() {
    const r = buehneRef.current.getBoundingClientRect()
    const w = Math.min(r.width, r.height) * maskAnteil
    return { w, h: w / seitenVerh }
  }

  function passeAn() {
    const cv = canvasRef.current
    const b = buehneRef.current
    if (!cv || !b) return
    const dpr = Math.min(window.devicePixelRatio || 1, 3)
    const r = b.getBoundingClientRect()
    cv.width = Math.round(r.width * dpr)
    cv.height = Math.round(r.height * dpr)
  }

  function start() {
    const img = bildRef.current
    const { w: mw, h: mh } = maskCss()
    const z = zustand.current
    z.minSkala = Math.max(mw / img.width, mh / img.height)
    z.maxSkala = z.minSkala * 4
    z.skala = z.minSkala
    z.x = 0; z.y = 0
    setZoom(z.skala)
    begrenze()
    zeichne()
  }

  function begrenze() {
    const img = bildRef.current
    if (!img) return
    const { w: mw, h: mh } = maskCss()
    const z = zustand.current
    const maxX = Math.max(0, (img.width * z.skala) / 2 - mw / 2)
    const maxY = Math.max(0, (img.height * z.skala) / 2 - mh / 2)
    z.x = Math.min(maxX, Math.max(-maxX, z.x))
    z.y = Math.min(maxY, Math.max(-maxY, z.y))
  }

  function zeichne() {
    const cv = canvasRef.current
    const img = bildRef.current
    if (!cv || !img) return
    const ctx = cv.getContext('2d')
    const dpr = Math.min(window.devicePixelRatio || 1, 3)
    const z = zustand.current
    ctx.clearRect(0, 0, cv.width, cv.height)
    const cx = cv.width / 2, cy = cv.height / 2
    const w = img.width * z.skala * dpr
    const h = img.height * z.skala * dpr
    ctx.drawImage(img, cx + z.x * dpr - w / 2, cy + z.y * dpr - h / 2, w, h)
  }

  function setzeZoom(neu) {
    const z = zustand.current
    z.skala = Math.min(z.maxSkala, Math.max(z.minSkala, neu))
    setZoom(z.skala)
    begrenze()
    zeichne()
  }

  // Pointer (Maus + Touch), Pinch
  function onDown(e) {
    e.currentTarget.setPointerCapture(e.pointerId)
    zeiger.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
  }
  function onMove(e) {
    const map = zeiger.current
    if (!map.has(e.pointerId) || !bildRef.current) return
    const alt = map.get(e.pointerId)
    map.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (map.size === 1) {
      const z = zustand.current
      z.x += e.clientX - alt.x
      z.y += e.clientY - alt.y
      begrenze(); zeichne()
    } else if (map.size === 2) {
      const p = [...map.values()]
      const d = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y)
      if (letzterPinch.current) setzeZoom(zustand.current.skala * (d / letzterPinch.current))
      letzterPinch.current = d
    }
  }
  function onUp(e) {
    zeiger.current.delete(e.pointerId)
    if (zeiger.current.size < 2) letzterPinch.current = 0
  }
  function onWheel(e) {
    if (!bildRef.current) return
    e.preventDefault()
    setzeZoom(zustand.current.skala * (e.deltaY < 0 ? 1.08 : 0.92))
  }

  function uebernehmen() {
    const img = bildRef.current
    if (!img) return
    const z = zustand.current
    const { w: mwCss } = maskCss()
    const faktor = ausgabe / mwCss
    const outW = ausgabe
    const outH = Math.round(ausgabe / seitenVerh)

    const cv = document.createElement('canvas')
    cv.width = outW; cv.height = outH
    const ctx = cv.getContext('2d')
    if (rund) {
      ctx.save()
      ctx.beginPath()
      ctx.arc(outW / 2, outH / 2, Math.min(outW, outH) / 2, 0, Math.PI * 2)
      ctx.clip()
    }
    const bw = img.width * z.skala * faktor
    const bh = img.height * z.skala * faktor
    ctx.drawImage(img, outW / 2 + z.x * faktor - bw / 2, outH / 2 + z.y * faktor - bh / 2, bw, bh)
    if (rund) ctx.restore()

    cv.toBlob((blob) => { onFertig && onFertig(blob) }, 'image/png')
  }

  const { w: mw, h: mh } = bereit && buehneRef.current ? maskCss() : { w: 0, h: 0 }

  return (
    <div style={s.overlay} role="dialog" aria-modal="true">
      <div style={s.karte}>
        <div style={s.titel}>{t('crop_title')}</div>

        <div
          ref={buehneRef}
          style={s.buehne}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          onWheel={onWheel}
        >
          <canvas ref={canvasRef} style={s.canvas} />
          <div style={{
            ...s.maske,
            width: mw, height: mh,
            left: `calc(50% - ${mw / 2}px)`, top: `calc(50% - ${mh / 2}px)`,
            borderRadius: rund ? '50%' : '10px',
          }} />
          {bereit && mw > 0 && (
            <div style={{
              position: 'absolute', pointerEvents: 'none',
              width: mw, height: mh,
              left: `calc(50% - ${mw / 2}px)`, top: `calc(50% - ${mh / 2}px)`,
              borderRadius: rund ? '50%' : '10px', overflow: 'hidden',
            }}>
              <div style={s.gridV} /><div style={{ ...s.gridV, left: '66.666%' }} />
              <div style={s.gridH} /><div style={{ ...s.gridH, top: '66.666%' }} />
            </div>
          )}
        </div>

        <div style={s.reglerReihe}>
          <button type="button" style={s.zoomBtn} onClick={() => setzeZoom(zustand.current.skala / 1.15)} aria-label="-">–</button>
          <input
            type="range"
            min={zustand.current.minSkala}
            max={zustand.current.maxSkala}
            step={(zustand.current.maxSkala - zustand.current.minSkala) / 200 || 0.01}
            value={zoom}
            onChange={(e) => setzeZoom(parseFloat(e.target.value))}
            style={s.range}
            aria-label="Zoom"
          />
          <button type="button" style={s.zoomBtn} onClick={() => setzeZoom(zustand.current.skala * 1.15)} aria-label="+">+</button>
        </div>

        <div style={s.hinweis}>{t('crop_hint')}</div>

        <div style={s.btnReihe}>
          <button type="button" style={s.btnGeist} onClick={onAbbrechen}>{t('crop_cancel')}</button>
          <button type="button" style={s.btnHaupt} onClick={uebernehmen} disabled={!bereit}>{t('crop_apply')}</button>
        </div>
      </div>
    </div>
  )
}

const s = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 4000,
    background: 'rgba(10,12,14,0.72)', backdropFilter: 'blur(2px)',
    display: 'grid', placeItems: 'center', padding: 16,
  },
  karte: {
    background: '#1b1f21', color: '#e7e9ea', borderRadius: 18,
    padding: 18, width: 360, maxWidth: '94vw',
    boxShadow: '0 24px 70px rgba(0,0,0,0.5)',
  },
  titel: { fontSize: 15, fontWeight: 700, marginBottom: 12 },
  buehne: {
    position: 'relative', width: '100%', aspectRatio: '1',
    borderRadius: 14, overflow: 'hidden', background: '#000',
    cursor: 'grab', touchAction: 'none', userSelect: 'none',
  },
  canvas: { position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' },
  maske: {
    position: 'absolute', pointerEvents: 'none',
    boxShadow: '0 0 0 2000px rgba(0,0,0,0.55)',
    outline: '2px solid rgba(255,255,255,0.9)',
  },
  gridV: {
    position: 'absolute', top: 0, bottom: 0, left: '33.333%',
    width: 1, background: 'rgba(255,255,255,0.4)',
  },
  gridH: {
    position: 'absolute', left: 0, right: 0, top: '33.333%',
    height: 1, background: 'rgba(255,255,255,0.4)',
  },
  reglerReihe: { display: 'flex', alignItems: 'center', gap: 12, marginTop: 14 },
  zoomBtn: {
    background: '#2a2e31', color: '#e7e9ea', border: 'none',
    width: 34, height: 34, borderRadius: 9, fontSize: 18, cursor: 'pointer', flexShrink: 0,
  },
  range: { flex: 1, accentColor: '#fff' },
  hinweis: { fontSize: 12, color: '#9aa0a6', marginTop: 10, textAlign: 'center' },
  btnReihe: { display: 'flex', gap: 10, marginTop: 14 },
  btnGeist: {
    background: '#2a2e31', color: '#e7e9ea', border: 'none', borderRadius: 11,
    padding: '11px 16px', font: 'inherit', fontWeight: 700, cursor: 'pointer',
  },
  btnHaupt: {
    background: '#1f3d34', color: '#fff', border: 'none', borderRadius: 11,
    padding: '11px 16px', font: 'inherit', fontWeight: 700, cursor: 'pointer', flex: 1,
  },
}
