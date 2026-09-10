import { useLang } from '../../../LangContext'
import Reveal from '../components/Reveal'

const POINTS = [1, 2, 3]

export default function Trust() {
  const { t } = useLang()
  return (
    <section id="trust" className="lp-trust">
      <div className="lp-wrap lp-trust-in">
        <Reveal>
          <div className="lp-sec-head">
            <span className="lp-eyebrow">{t('lp_trust_eyebrow')}</span>
            <h2>{t('lp_trust_title')}</h2>
            <p className="lp-lede">{t('lp_trust_body')}</p>
          </div>
        </Reveal>
        <div className="lp-trust-list">
          {POINTS.map((id, i) => (
            <Reveal key={id} delay={i * 60}>
              <div className="lp-trust-point">
                <h3>{t(`lp_trust_${id}_t`)}</h3>
                <p>{t(`lp_trust_${id}_b`)}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
