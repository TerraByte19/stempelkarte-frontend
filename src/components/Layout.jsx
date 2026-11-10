import { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useLang } from '../LangContext'
import { languages } from '../i18n'
import './Layout.css'
import Logo from './Logo'
import { supportAusToken, supportBeenden, uhrzeit } from '../lib/supportZugang'

// Strich-Symbole fuer Seitenleiste, untere Leiste und Mehr-Blatt - einmal
// definiert, damit alle drei gleich aussehen.
const SYMBOLE = {
  scanner: <><rect x="3" y="3" width="5" height="5"/><rect x="16" y="3" width="5" height="5"/><rect x="3" y="16" width="5" height="5"/><path d="M16 16h2v2h-2z"/><path d="M18 16h2v2h-2z"/><path d="M16 18h2v2h-2z"/><path d="M18 18h2v2h-2z"/></>,
  dashboard: <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></>,
  karten: <><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></>,
  kunden: <><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.5c3 0 5.5 2 5.5 5"/></>,
  nachrichten: <path d="M4 5h16v11H8l-4 4z"/>,
  statistik: <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>,
  team: <><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.5c3 0 5.5 2 5.5 5"/></>,
  profil: <><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></>,
  mehr: <><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></>,
  logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
}

function NavSymbol({ name, size = 20 }) {
  return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
           strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
        {SYMBOLE[name]}
      </svg>
  )
}

// Seitenleiste: Reihenfolge und Ziel jedes Eintrags.
const SEITEN = [
  { to: '/scanner', key: 'nav_scanner', symbol: 'scanner' },
  { to: '/', key: 'nav_dashboard', symbol: 'dashboard', end: true },
  { to: '/karten', key: 'nav_cards', symbol: 'karten' },
  { to: '/kunden', key: 'nav_customers', symbol: 'kunden' },
  { to: '/nachrichten', key: 'nav_messages', symbol: 'nachrichten' },
  { to: '/statistik', key: 'nav_stats', symbol: 'statistik' },
  { to: '/team', key: 'nav_team', symbol: 'team' },
  { to: '/profil', key: 'nav_profile', symbol: 'profil' },
]

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { lang, setLang, t } = useLang()
  const shop = JSON.parse(localStorage.getItem('shop') || '{}')
  // Handy: der untere Balken hat fuenf Felder; der Rest liegt hinter "Mehr".
  // Das Blatt schliesst beim Tippen auf einen Eintrag (zu, nicht per Effekt).
  const [mehrOffen, setMehrOffen] = useState(false)
  const mehrSeiten = ['/nachrichten', '/statistik', '/team', '/profil']
  const mehrAktiv = mehrSeiten.includes(location.pathname)
  const mehrEintrag = ({ isActive }) => 'mehr-eintrag' + (isActive ? ' aktiv' : '')
  const zu = () => setMehrOffen(false)

  // Support-Zugang aus dem Admin-Panel: der Balken sagt dem Betreiber, in
  // welchem Laden er gerade ist. Haengt am Token selbst, nicht an einem Merker.
  const support = supportAusToken(localStorage.getItem('token'))

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('shop')
    localStorage.removeItem('staffToken')
    navigate('/login')
  }

  // Der Zugang wurde in einem eigenen Tab geoeffnet: zumachen. Laesst der
  // Browser das nicht zu, geht es zurueck ins Admin-Panel.
  function supportEnde() {
    supportBeenden(localStorage)
    window.close()
    window.location.href = '/admin'
  }

  const navStyle = ({ isActive }) => ({
    color: 'white', textDecoration: 'none', padding: '10px 12px',
    borderRadius: '8px', fontSize: '14px', fontWeight: '500',
    display: 'flex', alignItems: 'center', gap: '10px',
    opacity: isActive ? 1 : 0.75,
    background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
  })

  const bottomNavStyle = ({ isActive }) => ({
    color: isActive ? '#3C3489' : '#888', textDecoration: 'none',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    fontSize: '11px', fontWeight: isActive ? '600' : '400',
    gap: '3px', flex: 1, padding: '8px 0',
  })

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--sk-surface-2)' }}>

      <aside className="sidebar">
        <div style={styles.marke}><Logo size={26} hell schrift={18} /></div>
        <div style={styles.shopName}>{shop.name || 'Mein Laden'}</div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
          {SEITEN.map(p => (
            <NavLink key={p.to} to={p.to} end={p.end} style={navStyle}>
              <NavSymbol name={p.symbol} size={18} />
              {t(p.key)}
            </NavLink>
          ))}
        </nav>
        <select value={lang} onChange={e => setLang(e.target.value)} style={styles.langSelect}>
          {languages.map(l => (
            <option key={l.code} value={l.code}>{l.label}</option>
          ))}
        </select>
        <button onClick={logout} style={styles.logout}>{t('nav_logout')}</button>
      </aside>

      <main className="main-content">
        {support && (
          <div style={styles.support} role="status">
            <span>
              <strong>Support-Zugang.</strong> Du bist im Laden „{shop.name || shop.id}“. Änderungen gelten für den echten Laden. Endet um {uhrzeit(support.bis)}.
            </span>
            <button type="button" onClick={supportEnde} style={styles.supportBtn}>Beenden</button>
          </div>
        )}
        <Outlet />
      </main>

      <nav className="bottom-nav">
        <NavLink to="/scanner" style={bottomNavStyle}>
          <NavSymbol name="scanner" />
          {t('nav_scanner')}
        </NavLink>
        <NavLink to="/" end style={bottomNavStyle}>
          <NavSymbol name="dashboard" />
          {t('nav_dashboard')}
        </NavLink>
        <NavLink to="/karten" style={bottomNavStyle}>
          <NavSymbol name="karten" />
          {t('nav_cards')}
        </NavLink>
        <NavLink to="/kunden" style={bottomNavStyle}>
          <NavSymbol name="kunden" />
          {t('nav_customers')}
        </NavLink>
        <button type="button" onClick={() => setMehrOffen(o => !o)} aria-expanded={mehrOffen}
                style={{ ...styles.mobileBottomBtn, color: mehrAktiv || mehrOffen ? '#3C3489' : '#888', fontWeight: mehrAktiv ? '600' : '400' }}>
          <NavSymbol name="mehr" />
          <span style={{ fontSize: '11px' }}>{t('nav_more')}</span>
        </button>
      </nav>

      {mehrOffen && (
        <>
          <div className="mehr-hintergrund" onClick={() => setMehrOffen(false)} />
          <div className="mehr-blatt" role="dialog" aria-label={t('nav_more')}>
            <div className="mehr-griff" />
            <NavLink to="/nachrichten" className={mehrEintrag} onClick={zu}>
              <NavSymbol name="nachrichten" size={22} />
              {t('nav_messages')}
            </NavLink>
            <NavLink to="/statistik" className={mehrEintrag} onClick={zu}>
              <NavSymbol name="statistik" size={22} />
              {t('nav_stats')}
            </NavLink>
            <NavLink to="/team" className={mehrEintrag} onClick={zu}>
              <NavSymbol name="team" size={22} />
              {t('nav_team')}
            </NavLink>
            <NavLink to="/profil" className={mehrEintrag} onClick={zu}>
              <NavSymbol name="profil" size={22} />
              {t('nav_profile')}
            </NavLink>
            <label className="mehr-eintrag" style={{ justifyContent: 'space-between' }}>
              <span>{t('nav_language')}</span>
              <select value={lang} onChange={e => setLang(e.target.value)} style={styles.mehrLangSelect}>
                {languages.map(l => (
                  <option key={l.code} value={l.code}>{l.label}</option>
                ))}
              </select>
            </label>
            <button type="button" className="mehr-eintrag" onClick={logout} style={{ color: '#c0392b' }}>
              <NavSymbol name="logout" size={22} />
              {t('nav_logout')}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

const styles = {
  support: { position: 'sticky', top: 0, zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', background: '#fff4e5', color: '#7a3f00', border: '1.5px solid #f0b060', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px', fontSize: '14px', lineHeight: 1.4 },
  supportBtn: { background: '#b35c00', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', fontFamily: 'inherit', flexShrink: 0 },
  marke: { display: 'flex', justifyContent: 'center', marginBottom: '14px' },
  shopName: { fontSize: '14px', fontWeight: '600', textAlign: 'center', marginBottom: '32px', opacity: 0.9, color: 'white' },
  langSelect: { background: 'rgba(255,255,255,0.15)', color: 'white', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', fontSize: '13px', width: '100%', marginBottom: '8px' },
  logout: { background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: '8px', padding: '10px', cursor: 'pointer', fontSize: '14px', width: '100%' },
  mobileBottomBtn: { color: '#888', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', flex: 1, padding: '8px 0', fontFamily: 'inherit' },
  mehrLangSelect: { fontSize: '15px', padding: '6px 8px', borderRadius: '8px', border: '1.5px solid #e0e0e0', background: 'white', color: '#1a1a1a' },
}