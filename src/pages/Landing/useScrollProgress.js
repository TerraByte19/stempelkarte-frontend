import { useEffect, useState } from 'react'
import { progressOf } from './progressOf.js'

/**
 * Liefert den Scroll-Fortschritt eines Elements als ganze Zahl 0…100.
 *
 * Ganzzahlig, damit React hoechstens 100 mal neu rendert statt bei jedem Frame.
 * Fuer weiche Uebergaenge setzt der Hook zusaetzlich die CSS-Variable --lp-p
 * (0…1, ungerundet) direkt auf dem Element — das laeuft ohne Render.
 *
 * Bei prefers-reduced-motion steht der Wert fest auf 100 (Endzustand).
 */
export function useScrollProgress(ref) {
  const [pct, setPct] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.style.setProperty('--lp-p', '1')
      setPct(100)
      return
    }

    let queued = false

    const read = () => {
      queued = false
      const rect = el.getBoundingClientRect()
      const p = progressOf(rect.top, rect.height, window.innerHeight)
      el.style.setProperty('--lp-p', String(p))
      setPct(Math.round(p * 100))
    }

    const onScroll = () => {
      if (queued) return
      queued = true
      requestAnimationFrame(read)
    }

    read()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [ref])

  return pct
}
