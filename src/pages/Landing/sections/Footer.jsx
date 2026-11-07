import { Link } from 'react-router-dom'
import { useLang } from '../../../LangContext'
import { INSTAGRAM_URL } from './Contact'
import { brancheNamen } from '../branchen'

export default function Footer() {
  const { t, lang } = useLang()
  return (
    <footer className="lp-footer">
      <div className="lp-wrap lp-footer-in">
        <span className="lp-footer-links">
          {brancheNamen(lang).map(b => <Link key={b.slug} to={`/branchen/${b.slug}`}>{b.name}</Link>)}
        </span>
        <span>{t('lp_foot_copy')}</span>
        <span className="lp-footer-links">
          <Link to="/datenschutz">{t('lp_foot_privacy')}</Link>
          <Link to="/vertrauen">{t('lp_foot_trust')}</Link>
          <Link to="/tools/bewertungslink">{t('lp_foot_tool')}</Link>
          <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">Instagram</a>
        </span>
        <span>{t('lp_foot_made')}</span>
      </div>
    </footer>
  )
}
