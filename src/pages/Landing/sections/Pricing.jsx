import { useLang } from '../../../LangContext'
import Reveal from '../components/Reveal'

const TIERS = [
  { id: 1, features: ['f1', 'f2', 'f3'], unit: 'lp_price_permonth', popular: false },
  { id: 2, features: ['f1', 'f2', 'f3', 'f4'], unit: 'lp_price_permonth', popular: true },
  { id: 3, features: ['f1', 'f2', 'f3', 'f4'], unit: 'lp_price_persite', popular: false },
]

export default function Pricing() {
  const { t } = useLang()
  return (
    <section id="pricing" className="lp-pricing">
      <div className="lp-wrap">
        <Reveal>
          <div className="lp-sec-head">
            <span className="lp-eyebrow">{t('lp_price_eyebrow')}</span>
            <h2>{t('lp_price_title')}</h2>
            <p className="lp-price-note">{t('lp_price_note')}</p>
          </div>
        </Reveal>
        <div className="lp-price-grid">
          {TIERS.map(tier => (
            <Reveal key={tier.id}>
              <article className={tier.popular ? 'lp-tier is-popular' : 'lp-tier'}>
                {tier.popular && <span className="lp-tier-flag">{t('lp_price_popular')}</span>}
                <h3>{t(`lp_price_${tier.id}_t`)}</h3>
                <p className="lp-tier-sub">{t(`lp_price_${tier.id}_b`)}</p>
                <p className="lp-tier-amount">
                  <span>{t('lp_price_amount')}</span>
                  <small>{t(tier.unit)}</small>
                </p>
                <a className="lp-btn lp-btn--primary" href="#contact">{t('lp_price_cta')}</a>
                <ul className="lp-tier-list">
                  {tier.features.map(f => (
                    <li key={f}>{t(`lp_price_${tier.id}_${f}`)}</li>
                  ))}
                </ul>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
