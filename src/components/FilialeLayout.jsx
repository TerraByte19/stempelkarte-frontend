import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useLang } from '../LangContext'
import { languages } from '../i18n'
import './Layout.css'
import Logo from './Logo'
import { FILIALE_SEITEN } from '../lib/rolle'

/**
 * Rahmen fuer das Unterkonto einer Filiale (Tarif Kette): eigenes, kurzes
 * Menue - Scanner, Statistik, Geraete, Korrektur. Bewusst eine eigene
 * Komponente statt eines Filters im Layout des Inhabers: hier kann kein
 * Punkt des Hauptkontos auftauchen. Die Seiten rufen nur /api/filiale auf.
 */
const SYMBOLE = {
  scanner: <><rect x="3" y="3" width="5" height="5"/><rect x="16" y="3" width="5" height="5"/><rect x="3" y="16" width="5" height="5"/><path d="M16 16h2v2h-2z"/><path d="M18 16h2v2h-2z"/><path d="M16 18h2v2h-2z"/><path d="M18 18h2v2h-2z"/></>,
  statistik: <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>,
  team: <><rect x="7" y="2" width="10" height="20" rx="2"/><line x1="11" y1="18" x2="13" y2="18"/></>,
  karten: <><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></>,
  logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
}

function Symbol({ name, size = 20 }) {
  return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
           strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
        {SYMBOLE[name]}
      </svg>
  )
}

export default function FilialeLayout() {
  const navigate = useNavigate()
  const { lang, setLang, t } = useLang()
  const shop = JSON.parse(localStorage.getItem('shop') || '{}')

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('shop')
    localStorage.removeItem('staffToken')
    localStorage.removeItem('staffTokenLabel')
    navigate('/login')
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
          <div style={styles.shopName}>{shop.name || ''}</div>
          {shop.ortLabel && <div style={styles.filiale}>{t('kette_filiale_von', { name: shop.ortLabel })}</div>}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
            {FILIALE_SEITEN.map(p => (
                <NavLink key={p.to} to={p.to} end={p.end} style={navStyle}>
                  <Symbol name={p.symbol} size={18} />
                  {t(p.key)}
                </NavLink>
            ))}
          </nav>
          <select value={lang} onChange={e => setLang(e.target.value)} style={styles.langSelect}>
            {languages.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
          </select>
          <button onClick={logout} style={styles.logout}>{t('nav_logout')}</button>
        </aside>

        <main className="main-content">
          {/* Handy: Kette, Filiale, Sprache und Ausloggen oben, weil die untere Leiste voll ist. */}
          <div className="filiale-kopf" style={styles.kopf}>
            <div style={{ minWidth: 0 }}>
              <div style={styles.kopfName}>{shop.name || ''}</div>
              {shop.ortLabel && <div style={styles.kopfFiliale}>{t('kette_filiale_von', { name: shop.ortLabel })}</div>}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <select value={lang} onChange={e => setLang(e.target.value)} style={styles.kopfLang} aria-label={t('nav_language')}>
                {languages.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
              </select>
              <button type="button" onClick={logout} style={styles.kopfLogout} aria-label={t('nav_logout')}>
                <Symbol name="logout" size={18} />
              </button>
            </div>
          </div>
          <Outlet />
        </main>

        <nav className="bottom-nav">
          {FILIALE_SEITEN.map(p => (
              <NavLink key={p.to} to={p.to} end={p.end} style={bottomNavStyle}>
                <Symbol name={p.symbol} />
                {t(p.key)}
              </NavLink>
          ))}
        </nav>
      </div>
  )
}

const styles = {
  marke: { display: 'flex', justifyContent: 'center', marginBottom: '14px' },
  shopName: { fontSize: '14px', fontWeight: '600', textAlign: 'center', opacity: 0.9, color: 'white' },
  filiale: { fontSize: '12px', textAlign: 'center', opacity: 0.75, color: 'white', marginTop: 4, marginBottom: 28 },
  langSelect: { background: 'rgba(255,255,255,0.15)', color: 'white', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', fontSize: '13px', width: '100%', marginBottom: '8px' },
  logout: { background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: '8px', padding: '10px', cursor: 'pointer', fontSize: '14px', width: '100%' },
  kopf: { alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 },
  kopfName: { fontSize: 15, fontWeight: 700, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  kopfFiliale: { fontSize: 12, color: '#888' },
  kopfLang: { fontSize: 13, padding: '6px 8px', borderRadius: 8, border: '1.5px solid #e0e0e0', background: 'white', color: '#1a1a1a' },
  kopfLogout: { background: 'white', border: '1.5px solid #e0e0e0', borderRadius: 8, padding: 7, cursor: 'pointer', color: '#c0392b', display: 'flex' },
}
