import { useLang } from '../../../LangContext'
import StampCard from '../components/StampCard'

export default function Hero() {
  const { t } = useLang()
  return (
    <section id="hero" className="lp-hero">
      <div className="lp-wrap lp-hero-in">
        <div className="lp-hero-copy">
          <h1>{t('lp_hero_title')}</h1>
          <p className="lp-lede">{t('lp_hero_body')}</p>
          <div className="lp-hero-actions">
            <a className="lp-btn lp-btn--primary" href="#contact">{t('lp_hero_cta')}</a>
            <a className="lp-btn lp-btn--ghost" href="#how">{t('lp_hero_cta2')}</a>
          </div>
          <p className="lp-hero-note">{t('lp_hero_note')}</p>
        </div>
        <div className="lp-hero-card">
          <div className="lp-bob">
            <StampCard
              stamps={1}
              shop={t('lp_card_shop')}
              reward={t('lp_card_reward')}
              chip={t('lp_card_chip')}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
