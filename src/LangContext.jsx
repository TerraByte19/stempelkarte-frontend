import { createContext, useContext, useEffect, useState } from 'react'
import { translations, languages } from './i18n'

const LangContext = createContext()

const LOCALE_TAGS = { de: 'de-DE', en: 'en-US', ar: 'ar-u-nu-latn' }

export function localeTag(lang) {
  return LOCALE_TAGS[lang] || LOCALE_TAGS.de
}

export function dirArrow(dir, direction = 'back') {
  const back = dir === 'rtl' ? '→' : '←'
  const forward = dir === 'rtl' ? '←' : '→'
  return direction === 'back' ? back : forward
}

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    const saved = localStorage.getItem('lang')
    return languages.some(l => l.code === saved) ? saved : 'de'
  })

  const dir = (languages.find(l => l.code === lang) || languages[0]).dir

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = dir
  }, [lang, dir])

  function setLang(next) {
    setLangState(next)
    localStorage.setItem('lang', next)
  }

  function t(key, vars) {
    let str = translations[lang]?.[key] ?? translations.de[key] ?? key
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        str = str.replaceAll(`{${k}}`, v)
      }
    }
    return str
  }

  return (
    <LangContext.Provider value={{ lang, setLang, t, dir }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  return useContext(LangContext)
}
