import { useEffect, useMemo, useState } from 'react'
import CreatePage from './pages/CreatePage'
import PlayPage from './pages/PlayPage'
import PrintPage from './pages/PrintPage'
import { LANGUAGES, getBrowserLanguage, translate } from './i18n'

function LanguageSelector({ locale, onChange }) {
  return (
    <label className="language-selector">
      <span className="sr-only">Language</span>
      <select value={locale} onChange={(event) => onChange(event.target.value)}>
        {LANGUAGES.map((language) => (
          <option key={language.code} value={language.code}>
            {language.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function AppHeader({ locale, onLocaleChange, installPrompt, onInstall, t }) {
  return (
    <header className="app-header">
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <rect x="2" y="2" width="12" height="12" rx="3" fill="white" opacity="0.9"/>
        <rect x="18" y="2" width="12" height="12" rx="3" fill="white" opacity="0.7"/>
        <rect x="2" y="18" width="12" height="12" rx="3" fill="white" opacity="0.7"/>
        <rect x="18" y="18" width="12" height="12" rx="3" fill="white" opacity="0.9"/>
        <circle cx="16" cy="16" r="4" fill="white"/>
      </svg>
      <h1>Puzzleando</h1>
      <span className="subtitle">{t('appSubtitle')}</span>
      {installPrompt && (
        <button className="btn btn-header btn-sm" onClick={onInstall}>
          {t('installApp')}
        </button>
      )}
      <LanguageSelector locale={locale} onChange={onLocaleChange} />
    </header>
  )
}

export default function App() {
  const [page, setPage] = useState('create')
  const [puzzleConfig, setPuzzleConfig] = useState(null)
  const [locale, setLocale] = useState(() => localStorage.getItem('puzzleando-language') || getBrowserLanguage())
  const [installPrompt, setInstallPrompt] = useState(null)
  const t = useMemo(() => (key, values) => translate(locale, key, values), [locale])

  useEffect(() => {
    localStorage.setItem('puzzleando-language', locale)
    document.documentElement.lang = locale
  }, [locale])

  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault()
      setInstallPrompt(event)
    }
    const handleInstalled = () => setInstallPrompt(null)

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleInstalled)
    }
  }, [])

  const handlePlay = (config) => {
    setPuzzleConfig(config)
    setPage('play')
  }

  const handlePrint = (config) => {
    setPuzzleConfig(config)
    setPage('print')
  }

  const handleBack = () => setPage('create')

  const handleInstall = async () => {
    if (!installPrompt) return
    await installPrompt.prompt()
    setInstallPrompt(null)
  }

  return (
    <>
      {page === 'create' && (
        <AppHeader
          locale={locale}
          onLocaleChange={setLocale}
          installPrompt={installPrompt}
          onInstall={handleInstall}
          t={t}
        />
      )}
      {page === 'create' && (
        <CreatePage
          initialConfig={puzzleConfig}
          t={t}
          onPlay={handlePlay}
          onPrint={handlePrint}
        />
      )}
      {page === 'play' && puzzleConfig && <PlayPage config={puzzleConfig} onBack={handleBack} t={t} />}
      {page === 'print' && puzzleConfig && <PrintPage config={puzzleConfig} onBack={handleBack} t={t} />}
    </>
  )
}
