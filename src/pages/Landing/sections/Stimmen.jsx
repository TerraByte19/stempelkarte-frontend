import { useLang } from '../../../LangContext'
import Reveal from '../components/Reveal'
import { STIMMEN } from '../stimmen'
import './Stimmen.css'

/**
 * Stimmen von Laeden. Die Zitate liegen in ../stimmen.js und bleiben im
 * Original (meist Deutsch), egal welche Sprache die Seite zeigt - nur
 * Ueberschrift und Hinweis sind uebersetzt. Ohne Eintraege kein Abschnitt.
 */
export default function Stimmen() {
  const { t } = useLang()
  if (STIMMEN.length === 0) return null
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
          {STIMMEN.map((s, i) => (
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
