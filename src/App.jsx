import { Routes, Route, Navigate } from 'react-router-dom'
import { LangProvider } from './LangContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Karten from './pages/Karten'
import Statistik from './pages/Statistik'
import Profil from './pages/Profil'
import Layout from './components/Layout'
import Scanner from './pages/Scanner'
import Admin from './pages/Admin'
import InstallBanner from './components/InstallBanner'

function App() {
  const token = localStorage.getItem('token')
  const staffToken = localStorage.getItem('staffToken')

  // Scanner-Gerät = hat staffToken, aber KEIN Besitzer-Login (token)
  // → solche Geräte sollen direkt den Scanner sehen
  const isScannerDevice = !token && staffToken && staffToken !== 'undefined' && staffToken !== 'null'

  // Root-Route abhängig vom Gerätetyp bestimmen
  function rootElement() {
    if (isScannerDevice) return <Navigate to="/scanner" replace />   // Scanner-Gerät
    if (token) return <Layout />                                      // Besitzer eingeloggt
    return <Navigate to="/login" replace />                          // sonst Login
  }

  return (
    <LangProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        {/* /register deaktiviert — Läden werden nur über Admin-Panel angelegt */}
        <Route path="/register" element={<Navigate to="/login" />} />
        {/* /scanner-login entfällt — Mitarbeiter melden sich auf /login an */}
        <Route path="/scanner-login" element={<Navigate to="/login" replace />} />
        <Route path="/scanner" element={<Scanner />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/" element={rootElement()}>
          <Route index element={<Dashboard />} />
          <Route path="karten" element={<Karten />} />
          <Route path="statistik" element={<Statistik />} />
          <Route path="profil" element={<Profil />} />
        </Route>
      </Routes>

      <InstallBanner />
    </LangProvider>
  )
}

export default App