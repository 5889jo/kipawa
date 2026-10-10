import { useEffect, useState, type ReactNode } from 'react'
import { LanguageContext, type Language } from './language'

const LANGUAGE_STORAGE_KEY = 'kipawa-language'

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() =>
    window.localStorage.getItem(LANGUAGE_STORAGE_KEY) === 'sw' ? 'sw' : 'en'
  )

  useEffect(() => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
    document.documentElement.lang = language
  }, [language])

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  )
}
