import { useLang } from '../../../LangContext'

export default function Footer() {
  const { t } = useLang()
  return (
    <footer className="lp-footer">
      <div className="lp-wrap lp-footer-in">
        <span>{t('lp_foot_copy')}</span>
        <span className="lp-footer-links">
          <a href="/impressum">{t('lp_foot_imprint')}</a>
          <a href="/datenschutz">{t('lp_foot_privacy')}</a>
        </span>
        <span>{t('lp_foot_made')}</span>
      </div>
    </footer>
  )
}
