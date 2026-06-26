import { createContext, useContext, useState } from 'react'
import { fr } from '../locales/fr'
import { en } from '../locales/en'

const LanguageContext = createContext()

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'fr')

  const setLanguage = (l) => {
    localStorage.setItem('lang', l)
    setLang(l)
  }

  const t = lang === 'en' ? en : fr

  return (
    <LanguageContext.Provider value={{ lang, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
