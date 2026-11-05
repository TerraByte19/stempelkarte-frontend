import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../../../LangContext'
import { branchenLabels, brancheNamen } from '../branchen'
import '../Branchen.css'

/**
 * Menuepunkt "Branchen" mit Liste der Branchenseiten. Klick oeffnet,
 * Klick daneben oder Escape schliesst. Auf dem Handy ist die ganze
 * Kopfzeilen-Navigation ausgeblendet (Landing.css), dort fuehrt der Fuss hin.
 */
export default function BranchenMenu() {
  const { lang } = useLang()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const labels = branchenLabels(lang)

  useEffect(() => {
    if (!open) return
    function zu(e) {
      if (e.type === 'keydown' ? e.key === 'Escape' : !ref.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', zu)
    document.addEventListener('keydown', zu)
    return () => {
      document.removeEventListener('mousedown', zu)
      document.removeEventListener('keydown', zu)
    }
  }, [open])

  return (
    <div className="lp-branchen" data-open={open ? '1' : '0'} ref={ref}>
      <button type="button" aria-haspopup="true" aria-expanded={open} onClick={() => setOpen(o => !o)}>
        {labels.menu} <span aria-hidden="true">▾</span>
      </button>
      <div className="lp-branchen-list" role="menu">
        {brancheNamen(lang).map(b => (
          <Link key={b.slug} role="menuitem" to={`/branchen/${b.slug}`} onClick={() => setOpen(false)}>{b.name}</Link>
        ))}
      </div>
    </div>
  )
}
