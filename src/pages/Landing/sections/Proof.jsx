import { useLang } from '../../../LangContext'
import Reveal from '../components/Reveal'

// Vier belegte Zahlen. Jede traegt ihre Quelle sichtbar mit — das ist
// ehrlicher, ueberzeugt mehr, und unbelegte Werbeaussagen sind in
// Deutschland abmahnfaehig (UWG).
const FACTS = [1, 2, 3, 4]

export default function Proof() {
  const { t } = useLang()
  return (
    <section id="proof" className="lp-proof">
      <div className="lp-wrap">
        <Reveal>
          <div className="lp-sec-head">
            <span className="lp-eyebrow">{t('lp_proof_eyebrow')}</span>
            <h2>{t('lp_proof_title')}</h2>
            <p className="lp-lede">{t('lp_proof_body')}</p>
          </div>
        </Reveal>

        <div className="lp-proof-grid">
          {FACTS.map((id, i) => (
            <Reveal key={id} delay={i * 50}>
              <figure className="lp-fact">
                <strong className="lp-fact-n">{t(`lp_proof_${id}_n`)}</strong>
                <h3>{t(`lp_proof_${id}_t`)}</h3>
                <p>{t(`lp_proof_${id}_b`)}</p>
                <figcaption>{t(`lp_proof_${id}_src`)}</figcaption>
              </figure>
            </Reveal>
          ))}
        </div>

        <Reveal delay={80}>
          <aside className="lp-appnote">
            <span className="lp-appnote-label">{t('lp_proof_app_label')}</span>
            <div className="lp-appnote-body">
              <strong className="lp-fact-n">{t('lp_proof_app_n')}</strong>
              <div>
                <h3>{t('lp_proof_app_t')}</h3>
                <p>{t('lp_proof_app_b')}</p>
                <span className="lp-fact-src">{t('lp_proof_app_src')}</span>
              </div>
            </div>
          </aside>
        </Reveal>
      </div>
    </section>
  )
}
