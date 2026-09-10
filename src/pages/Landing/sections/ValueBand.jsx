import { useLang } from '../../../LangContext'
import Reveal from '../components/Reveal'

export default function ValueBand() {
  const { t } = useLang()
  return (
    <section id="value" className="lp-value">
      <div className="lp-wrap">
        <Reveal>
          <div className="lp-value-in">
            <h2>{t('lp_value_title')}</h2>
            <p>{t('lp_value_body')}</p>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
