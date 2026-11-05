import { Link } from 'react-router-dom'
import { useLang } from '../../../LangContext'
import BranchenMenu from './BranchenMenu'

export default function Header() {
  const { t } = useLang()
  return (
    <header className="lp-header">
      <div className="lp-wrap lp-header-in">
        <Link className="lp-logo" to="/">Stampit</Link>
        <nav className="lp-nav">
          {/* Absolute Ziele: auf den Branchenseiten fuehren sie zur Startseite. */}
          <a href="/#how">{t('lp_nav_how')}</a>
          <a href="/#features">{t('lp_nav_features')}</a>
          <BranchenMenu />
          <a href="/#contact">{t('lp_nav_contact')}</a>
        </nav>
        <Link className="lp-btn lp-btn--ghost" to="/login">{t('lp_nav_login')}</Link>
      </div>
    </header>
  )
}
