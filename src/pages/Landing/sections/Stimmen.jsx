import { useEffect, useState } from 'react'
import { useLang } from '../../../LangContext'
import Reveal from '../components/Reveal'
import { STIMMEN } from '../stimmen'
import './Stimmen.css'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080'
const MAX = 6

/**
 * Stimmen von Laeden. Zwei Quellen: die vom Admin freigegebenen Zitate aus
 * der App (GET /api/public/stimmen) und die statische Liste in ../stimmen.js
 * fuer Zitate, die nicht ueber die App kommen. Beides bleibt im Original
 * (meist Deutsch), egal welche Sprache die Seite zeigt - nur Ueberschrift
 * und Hinweis sind uebersetzt. Ohne Eintraege kein Abschnitt. Schlaegt der
 * Server fehl, bleibt die statische Liste.
 */
export default function Stimmen() {
  const { t } = useLang()
  const [vomServer, setVomServer] = useState([])

  useEffect(() => {
    const ctrl = new AbortController()
    fetch(`${API}/api/public/stimmen`, { signal: ctrl.signal })
        .then(r => (r.ok ? r.json() : []))
        .then(d => setVomServer(Array.isArray(d) ? d : []))
        .catch(() => {})
    return () => ctrl.abort()
  }, [])

  const alle = [...vomServer, ...STIMMEN].slice(0, MAX)
  if (alle.length === 0) return null
  return (
    <section id="stimmen" className="lp-stimmen">
      <div className="lp-wrap">
        <Reveal>
          <div className="lp-sec-head">
            <h2>{t('lp_stimmen_title')}</h2>
            <p className="lp-lede">{t('lp_stimmen_body')}</p>
          </div>
        </Reveal>
        <div className="lp-stimmen-grid">
          {alle.map((s, i) => (
            <Reveal key={`${s.laden}-${i}`} delay={i * 50}>
              <figure className="lp-stimme">
                <blockquote lang={s.sprache || 'de'}>
                  <p>{s.zitat}</p>
                </blockquote>
                <figcaption>
                  {s.person && <span className="lp-stimme-person">{s.person}</span>}
                  <span className="lp-stimme-laden">{s.laden}</span>
                  <span className="lp-stimme-ort">{s.ort}</span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
