import { Outlet, NavLink, useNavigate } from 'react-router-dom'

export default function Layout() {
  const navigate = useNavigate()
  const shop = JSON.parse(localStorage.getItem('shop') || '{}')

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('shop')
    localStorage.removeItem('staffToken')
    navigate('/login')
  }

  const navStyle = ({ isActive }) => ({
    color: 'white',
    textDecoration: 'none',
    padding: '10px 14px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    display: 'block',
    opacity: isActive ? 1 : 0.75,
    background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
  })

  return (
    <div style={styles.container}>
      <aside style={styles.sidebar}>
        <div style={styles.sidebarLogo}>☕</div>
        <div style={styles.shopName}>{shop.name || 'Mein Laden'}</div>

        <nav style={styles.nav}>
          <NavLink to="/scanner" style={navStyle}>📷 Scanner</NavLink>
          <NavLink to="/" end style={navStyle}>📊 Dashboard</NavLink>
          <NavLink to="/karten" style={navStyle}>🎴 Karten</NavLink>
          <NavLink to="/profil" style={navStyle}>⚙️ Profil</NavLink>
        </nav>

        <button onClick={logout} style={styles.logout}>Ausloggen</button>
      </aside>

      <main style={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}

const styles = {
  container: { display: 'flex', minHeight: '100vh', background: '#f5f5f7' },
  sidebar: {
    width: '220px',
    background: '#3C3489',
    color: 'white',
    padding: '24px 16px',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    top: 0, left: 0, bottom: 0,
  },
  sidebarLogo: { fontSize: '36px', textAlign: 'center', marginBottom: '8px' },
  shopName: {
    fontSize: '14px', fontWeight: '600', textAlign: 'center',
    marginBottom: '32px', opacity: 0.9, color: 'white',
  },
  nav: { display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 },
  logout: {
    background: 'rgba(255,255,255,0.1)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '10px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  main: { marginLeft: '220px', flex: 1, padding: '32px' },
}