import { useMemo } from 'react'
import { qrModules, QR_SIZE, QR_QUIET } from './qrArt.js'

function QrPlate() {
  const rects = useMemo(() => {
    const m = qrModules()
    const out = []
    for (let y = 0; y < QR_SIZE; y++) {
      for (let x = 0; x < QR_SIZE; x++) {
        if (m[y][x]) out.push(<rect key={`${x}-${y}`} x={x + QR_QUIET} y={y + QR_QUIET} width="1" height="1" />)
      }
    }
    return out
  }, [])

  const side = QR_SIZE + QR_QUIET * 2
  return (
    <span className="lp-qr">
      <svg viewBox={`0 0 ${side} ${side}`} shapeRendering="crispEdges" aria-hidden="true">
        <rect width={side} height={side} fill="#FFFFFF" />
        <g fill="#1A1A2E">{rects}</g>
      </svg>
    </span>
  )
}

function Cup() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 8h12v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8Z" />
      <path d="M16 9.5h2a2.5 2.5 0 0 1 0 5h-2" />
    </svg>
  )
}

const TOTAL = 6

/**
 * Die Stempelkarte. Erscheint dreimal auf der Seite (Hero, Buehne, Finale) —
 * immer diese Komponente, nie eine Kopie.
 */
export default function StampCard({
  stamps = 0,
  compact = false,
  shop,
  reward,
  chip,
  location = 'HH-OTTENSEN',
}) {
  const done = stamps >= TOTAL
  const cls = ['lp-card', compact && 'lp-card--compact', done && 'is-done'].filter(Boolean).join(' ')

  return (
    <div className={cls}>
      <div className="lp-card-head">
        <span className="lp-card-mark"><Cup /></span>
        <span className="lp-card-shop">{shop}</span>
        <span className="lp-card-loc">{location}</span>
      </div>

      <div className="lp-card-grid">
        {Array.from({ length: TOTAL }, (_, i) => (
          <span key={i} className={i < stamps ? 'lp-slot is-on' : 'lp-slot'}><Cup /></span>
        ))}
      </div>

      <div className="lp-card-foot">
        <div className="lp-card-reward">
          <span>{reward}</span>
          <span className="lp-card-chip">{chip}</span>
        </div>
        <div className="lp-card-pass">
          <QrPlate />
        </div>
      </div>
    </div>
  )
}
