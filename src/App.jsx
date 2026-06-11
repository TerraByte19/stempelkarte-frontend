import { Routes, Route, Navigate } from 'react-router-dom'
import { LangProvider } from './LangContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Karten from './pages/Karten'
import Profil from './pages/Profil'
import Layout from './components/Layout'
import Scanner from './pages/Scanner'
import ScannerLogin from './pages/ScannerLogin'
import ScannerSetup from './pages/ScannerSetup'
import Admin from './pages/Admin'
import InstallBanner from './components/InstallBanner'

function App() {
  const token = localStorage.getItem('token')
  return (
    <LangProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        {/* /register deaktiviert — Läden werden nur über Admin-Panel angelegt */}
        <Route path="/register" element={<Navigate to="/login" />} />
        <Route path="/scanner-login" element={<ScannerLogin />} />
        <Route path="/scanner-setup" element={<ScannerSetup />} />
        <Route path="/scanner" element={<Scanner />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/" element={token ? <Layout /> : <Navigate to="/login" />}>
          <Route index element={<Dashboard />} />
          <Route path="karten" element={<Karten />} />
          <Route path="profil" element={<Profil />} />
        </Route>
      </Routes>

      <InstallBanner />
    </LangProvider>
  )
}

export default App