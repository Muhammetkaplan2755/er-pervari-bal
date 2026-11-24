import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { S } from './strings.js'

export const LANGS = {
  tr: { label: 'TR', name: 'Türkçe', dir: 'ltr' },
  en: { label: 'EN', name: 'English', dir: 'ltr' },
  ar: { label: 'ع', name: 'العربية', dir: 'rtl' },
}

const STORAGE_KEY = 'erpervari-dil'
let arabicFont = null
const loadArabicFont = () => {
  arabicFont ??= Promise.all([
    import('@fontsource/ibm-plex-sans-arabic/arabic-400.css'),
    import('@fontsource/ibm-plex-sans-arabic/arabic-500.css'),
    import('@fontsource/ibm-plex-sans-arabic/arabic-600.css'),
    import('@fontsource/ibm-plex-sans-arabic/arabic-700.css'),
  ]).catch(() => { arabicFont = null })
  return arabicFont
}
const I18nContext = createContext(null)

function initialLang() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && LANGS[saved]) return saved
  } catch { /* storage blocked */ }
  return 'tr'
}

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(initialLang)

  const setLang = useCallback((next) => {
    if (!LANGS[next]) return
    setLangState(next)
    try { localStorage.setItem(STORAGE_KEY, next) } catch { /* storage blocked */ }
  }, [])

  useEffect(() => {
    const root = document.documentElement
    root.lang = lang
    root.dir = LANGS[lang].dir
    // The Arabic face is only fetched for Arabic readers.
    // Kendi sunucumuzdan (@fontsource): ziyaretçinin IP'si Google'a gitmez (KVKK yurt dışı aktarım).
    if (lang === 'ar') loadArabicFont()
  }, [lang])

  const value = useMemo(() => {
    /* t('key') → string in the current language, falling back to Turkish. Function values take args. */
    const t = (key, ...args) => {
      const entry = S[key]
      if (!entry) return key
      const v = entry[lang] ?? entry.tr
      return typeof v === 'function' ? v(...args) : v
    }
    /* pick({ tr, en, ar }) for content that lives in data files. Plain strings pass through. */
    const pick = (obj) => (obj && typeof obj === 'object' && !Array.isArray(obj) ? obj[lang] ?? obj.tr : obj)
    return { lang, setLang, t, pick, dir: LANGS[lang].dir }
  }, [lang, setLang])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>')
  return ctx
}
