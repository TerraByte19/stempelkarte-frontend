import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { LangProvider } from './LangContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Karten from './pages/Karten'
import Profil from './pages/Profil'
import Layout from './components/Layout'
import InstallBanner from './components/InstallBanner'
import Landing from './pages/Landing/Landing'

// Nachgeladen statt mitgebundelt. Scanner zieht html5-qrcode (~3 MB) nach
// sich, Statistik und Admin sind gross und werden selten als erstes geoeffnet.
// Ohne das laedt ein Besucher der Landing-Page den kompletten App-Code mit.
const Scanner = lazy(() => import('./pages/Scanner'))
const Statistik = lazy(() => import('./pages/Statistik'))
const Admin = lazy(() => import('./pages/Admin'))

function App() {
  const token = localStorage.getItem('token')
  const staffToken = localStorage.getItem('staffToken')

  // Scanner-Gerät = hat staffToken, aber KEIN Besitzer-Login (token)
  // → solche Geräte sollen direkt den Scanner sehen
  const isScannerDevice = !token && staffToken && staffToken !== 'undefined' && staffToken !== 'null'

  // Installierte PWA: wer ausgeloggt die App oeffnet, will sich anmelden —
  // nicht die Werbeseite sehen.
  function isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone === true
  }

  // Root-Route abhängig vom Gerätetyp bestimmen
  function rootElement() {
    if (isScannerDevice) return <Navigate to="/scanner" replace />   // Scanner-Gerät
    if (token) return <Layout />                                      // Besitzer eingeloggt
    if (isStandalone()) return <Navigate to="/login" replace />       // installierte PWA
    return <Landing />                                                // Besucher
  }

  return (
    <LangProvider>
      <Suspense fallback={<div className="route-loading">Lädt…</div>}>
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
      </Suspense>

      {/* Nur fuer Besitzer und Scanner-Geraete. Ein Besucher auf der
          Landing-Page kennt die Firma noch nicht — "App installieren" waere
          dort sinnlos, und das Banner legt sich ueber den Inhalt. */}
      {(token || staffToken) && <InstallBanner />}
    </LangProvider>
  )
}

export default App