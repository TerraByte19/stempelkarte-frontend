import { useEffect, useRef, useState } from 'react'

/**
 * Sanftes Hochschieben, sobald der Abschnitt ins Bild kommt.
 *
 * Startet bewusst bei voller Deckkraft und bewegt nur translateY: wer ohne
 * JavaScript, mit Reader-Modus oder ueber eine Vorschau kommt, sieht trotzdem
 * den ganzen Text. Nichts wartet unsichtbar auf einen Observer.
 */
export default function Reveal({ children, delay = 0 }) {
  const ref = useRef(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!('IntersectionObserver' in window)) { setShown(true); return }

    const io = new IntersectionObserver(
      entries => {
        if (entries.some(e => e.isIntersecting)) {
          setShown(true)
          io.disconnect()
        }
      },
      { threshold: 0.18 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={shown ? 'lp-reveal is-in' : 'lp-reveal'}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  )
}
