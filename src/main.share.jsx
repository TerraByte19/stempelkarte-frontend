// Einstiegspunkt fuer die verschickbare Einzeldatei-Fassung.
// Rendert nur die Landing-Page, ohne Routen, ohne Service-Worker, ohne App.
// MemoryRouter, weil Header und Footer <Link> benutzen — die brauchen einen
// Router-Kontext, sollen aber keine echte Adresse aendern.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { LangProvider } from './LangContext'
import Landing from './pages/Landing/Landing'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MemoryRouter>
      <LangProvider>
        <Landing />
      </LangProvider>
    </MemoryRouter>
  </StrictMode>,
)
