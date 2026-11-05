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
          <a href="/impressum">{t('lp_foot_imprint')}</a>
          <a href="/datenschutz">{t('lp_foot_privacy')}</a>
          <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">Instagram</a>
        </span>
        <span>{t('lp_foot_made')}</span>
      </div>
    </footer>
  )
}
