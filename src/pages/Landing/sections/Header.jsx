import { Link } from 'react-router-dom'
import { useLang } from '../../../LangContext'

export default function Header() {
  const { t } = useLang()
  return (
    <header className="lp-header">
      <div className="lp-wrap lp-header-in">
        <span className="lp-logo">Stampit</span>
        <nav className="lp-nav">
          <a href="#how">{t('lp_nav_how')}</a>
          <a href="#features">{t('lp_nav_features')}</a>
          <a href="#contact">{t('lp_nav_contact')}</a>
        </nav>
        <Link className="lp-btn lp-btn--ghost" to="/login">{t('lp_nav_login')}</Link>
      </div>
    </header>
  )
}
