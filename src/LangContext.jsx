import { createContext, useContext, useState } from 'react'
import { translations } from './i18n'

const LangContext = createContext()

export function LangProvider({ children }) {
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'de')

  function toggleLang() {
    const next = lang === 'de' ? 'en' : 'de'
    setLang(next)
    localStorage.setItem('lang', next)
  }

  function t(key) {
    return translations[lang]?.[key] || translations.de[key] || key
  }

  return (
    <LangContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  return useContext(LangContext)
}