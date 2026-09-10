import { useLang } from '../../../LangContext'
import Reveal from '../components/Reveal'

const IDS = [1, 2, 3, 4, 5, 6, 7, 8]

export default function Features() {
  const { t } = useLang()
  return (
    <section id="features" className="lp-features">
      <div className="lp-wrap">
        <Reveal>
          <div className="lp-sec-head">
            <span className="lp-eyebrow">{t('lp_feat_eyebrow')}</span>
            <h2>{t('lp_feat_title')}</h2>
          </div>
        </Reveal>
        <div className="lp-feat-grid">
          {IDS.map((id, i) => (
            <Reveal key={id} delay={i * 40}>
              <article className="lp-feat">
                <h3>{t(`lp_feat_${id}_t`)}</h3>
                <p>{t(`lp_feat_${id}_b`)}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
