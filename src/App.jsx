import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Karten from './pages/Karten'
import Profil from './pages/Profil'
import Layout from './components/Layout'
import Scanner from './pages/Scanner'
import Admin from './pages/Admin'

// In den Routes:
<Route path="/scanner" element={<Scanner />} />

function App() {
  const token = localStorage.getItem('token')

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/scanner" element={<Scanner />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/" element={token ? <Layout /> : <Navigate to="/login" />}>
  <Route index element={<Dashboard />} />
  <Route path="karten" element={<Karten />} />
  <Route path="profil" element={<Profil />} />
  <Route path="scanner" element={<Scanner />} />
</Route>
    </Routes>
  )
}

export default App