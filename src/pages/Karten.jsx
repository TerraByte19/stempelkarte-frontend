import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useLang } from '../LangContext'
import './Layout.css'

export default function Layout() {
  const navigate = useNavigate()
  const { lang, toggleLang, t } = useLang()
  const shop = JSON.parse(localStorage.getItem('shop') || '{}')

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('shop')
    localStorage.removeItem('staffToken')
    navigate('/login')
  }

  const navStyle = ({ isActive }) => ({
    color: 'white', textDecoration: 'none', padding: '10px 14px',
    borderRadius: '8px', fontSize: '14px', fontWeight: '500', display: 'block',
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
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f5f7' }}>

      <aside className="sidebar">
        <div style={styles.sidebarLogo}>SK</div>
        <div style={styles.shopName}>{shop.name || 'Mein Laden'}</div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
          <NavLink to="/scanner" style={navStyle}>{t('nav_scanner')}</NavLink>
          <NavLink to="/" end style={navStyle}>{t('nav_dashboard')}</NavLink>
          <NavLink to="/karten" style={navStyle}>{t('nav_cards')}</NavLink>
          <NavLink to="/profil" style={navStyle}>{t('nav_profile')}</NavLink>
        </nav>
        <button onClick={toggleLang} style={styles.langBtn}>
          {lang === 'de' ? '🇬🇧 EN' : '🇩🇪 DE'}
        </button>
        <button onClick={logout} style={styles.logout}>{t('nav_logout')}</button>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>

      <nav className="bottom-nav">
        <NavLink to="/scanner" style={bottomNavStyle}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="5" height="5"/><rect x="16" y="3" width="5" height="5"/>
            <rect x="3" y="16" width="5" height="5"/><path d="M16 16h2v2h-2z"/>
            <path d="M18 16h2v2h-2z"/><path d="M16 18h2v2h-2z"/><path d="M18 18h2v2h-2z"/>
          </svg>
          {t('nav_scanner')}
        </NavLink>
        <NavLink to="/" end style={bottomNavStyle}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
          </svg>
          {t('nav_dashboard')}
        </NavLink>
        <NavLink to="/karten" style={bottomNavStyle}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="5" width="20" height="14" rx="2"/>
            <line x1="2" y1="10" x2="22" y2="10"/>
          </svg>
          {t('nav_cards')}
        </NavLink>
        <NavLink to="/profil" style={bottomNavStyle}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="8" r="4"/>
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
          </svg>
          {t('nav_profile')}
        </NavLink>
        <button onClick={toggleLang} style={styles.mobileBottomBtn}>
          <span style={{ fontSize: '16px' }}>{lang === 'de' ? '🇬🇧' : '🇩🇪'}</span>
          <span style={{ fontSize: '11px', color: '#888' }}>{lang === 'de' ? 'EN' : 'DE'}</span>
        </button>
        <button onClick={logout} style={styles.mobileBottomBtn}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          <span style={{ fontSize: '11px', color: '#888' }}>{t('nav_logout')}</span>
        </button>
      </nav>
    </div>
  )
}

const styles = {
  sidebarLogo: { width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700', margin: '0 auto 8px', color: 'white' },
  shopName: { fontSize: '14px', fontWeight: '600', textAlign: 'center', marginBottom: '32px', opacity: 0.9, color: 'white' },
  langBtn: { background: 'rgba(255,255,255,0.15)', color: 'white', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', fontSize: '13px', width: '100%', marginBottom: '8px' },
  logout: { background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: '8px', padding: '10px', cursor: 'pointer', fontSize: '14px', width: '100%' },
  mobileBottomBtn: { color: '#888', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', flex: 1, padding: '8px 0' },
}