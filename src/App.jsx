import { useEffect, useMemo, useState } from 'react'
import CreatePage from './pages/CreatePage'
import LibraryPage from './pages/LibraryPage'
import PlayPage from './pages/PlayPage'
import PrintPage from './pages/PrintPage'
import { LANGUAGES, getBrowserLanguage, translate } from './i18n'
import {
  hydratePuzzle,
  loadStoredPuzzles,
  serializePuzzle,
  storePuzzles,
} from './utils/puzzleStorage'

const APP_NAME = 'Puzzleando Studio'

function BrandIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <rect width="64" height="64" rx="20" fill="url(#brandGradient)" />
      <path
        d="M18 17h10.5a3.5 3.5 0 0 1 3.5 3.5V23a4 4 0 1 0 8 0v-2.5a3.5 3.5 0 0 1 3.5-3.5H46a3.5 3.5 0 0 1 3.5 3.5v9.7a3.5 3.5 0 0 1-3.5 3.5H42a4 4 0 1 0 0 8h4a3.5 3.5 0 0 1 3.5 3.5V46A3.5 3.5 0 0 1 46 49.5H35.3A3.5 3.5 0 0 1 31.8 46V42a4 4 0 1 0-8 0v4a3.5 3.5 0 0 1-3.5 3.5H18A3.5 3.5 0 0 1 14.5 46V35.2a3.5 3.5 0 0 1 3.5-3.5H22a4 4 0 1 0 0-8h-4a3.5 3.5 0 0 1-3.5-3.5V20.5A3.5 3.5 0 0 1 18 17Z"
        fill="white"
        fillOpacity="0.96"
      />
      <defs>
        <linearGradient id="brandGradient" x1="8" y1="6" x2="56" y2="58" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7c3aed" />
          <stop offset="1" stopColor="#2563eb" />
        </linearGradient>
      </defs>
    </svg>
  )
}

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
      <div className="app-brand">
        <BrandIcon />
        <h1>{APP_NAME}</h1>
      </div>
      <div className="app-header-actions">
        {installPrompt && (
          <button className="btn btn-header btn-sm" onClick={onInstall}>
            {t('installApp')}
          </button>
        )}
        <LanguageSelector locale={locale} onChange={onLocaleChange} />
      </div>
    </header>
  )
}

function AppFooter() {
  return (
    <footer className="app-footer">
      <a href="https://gallego.top" target="_blank" rel="noreferrer">
        gallego.top
      </a>
      <span>·</span>
      <a href="https://github.com/gafapa/puzzleando" target="_blank" rel="noreferrer">
        GitHub
      </a>
    </footer>
  )
}

export default function App() {
  const [page, setPage] = useState('library')
  const [puzzles, setPuzzles] = useState(() => loadStoredPuzzles())
  const [puzzleConfig, setPuzzleConfig] = useState(null)
  const [locale, setLocale] = useState(
    () => localStorage.getItem('puzzleando-language') || getBrowserLanguage()
  )
  const [installPrompt, setInstallPrompt] = useState(null)
  const t = useMemo(() => (key, values) => translate(locale, key, values), [locale])

  useEffect(() => {
    localStorage.setItem('puzzleando-language', locale)
    document.documentElement.lang = locale
    document.title = `${APP_NAME} - Classroom puzzle maker`
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

  const savePuzzle = (config) => {
    const storedPuzzle = serializePuzzle(config)
    setPuzzles((currentPuzzles) => {
      const nextPuzzles = [
        storedPuzzle,
        ...currentPuzzles.filter((puzzle) => puzzle.id !== storedPuzzle.id),
      ]
      storePuzzles(nextPuzzles)
      return nextPuzzles
    })
    return { ...storedPuzzle, imageEl: config.imageEl }
  }

  const openStoredPuzzle = async (puzzle, nextPage) => {
    const hydratedPuzzle = await hydratePuzzle(puzzle)
    setPuzzleConfig(hydratedPuzzle)
    setPage(nextPage)
  }

  const handleCreate = () => {
    setPuzzleConfig(null)
    setPage('create')
  }

  const handleEdit = async (puzzle) => {
    await openStoredPuzzle(puzzle, 'create')
  }

  const handleSave = (config) => {
    const savedPuzzle = savePuzzle(config)
    setPuzzleConfig(savedPuzzle)
    setPage('library')
  }

  const handlePlay = (config) => {
    const savedPuzzle = savePuzzle(config)
    setPuzzleConfig(savedPuzzle)
    setPage('play')
  }

  const handlePrint = (config) => {
    const savedPuzzle = savePuzzle(config)
    setPuzzleConfig(savedPuzzle)
    setPage('print')
  }

  const handlePlayStored = async (puzzle) => {
    await openStoredPuzzle(puzzle, 'play')
  }

  const handlePrintStored = async (puzzle) => {
    await openStoredPuzzle(puzzle, 'print')
  }

  const handleDelete = (id) => {
    if (!window.confirm(t('deleteConfirm'))) return
    setPuzzles((currentPuzzles) => {
      const nextPuzzles = currentPuzzles.filter((puzzle) => puzzle.id !== id)
      storePuzzles(nextPuzzles)
      return nextPuzzles
    })
  }

  const handleBackToLibrary = () => {
    setPage('library')
  }

  const handleInstall = async () => {
    if (!installPrompt) return
    await installPrompt.prompt()
    setInstallPrompt(null)
  }

  return (
    <>
      {(page === 'library' || page === 'create') && (
        <AppHeader
          locale={locale}
          onLocaleChange={setLocale}
          installPrompt={installPrompt}
          onInstall={handleInstall}
          t={t}
        />
      )}
      {page === 'library' && (
        <LibraryPage
          puzzles={puzzles}
          t={t}
          onCreate={handleCreate}
          onEdit={handleEdit}
          onPlay={handlePlayStored}
          onPrint={handlePrintStored}
          onDelete={handleDelete}
        />
      )}
      {page === 'create' && (
        <CreatePage
          initialConfig={puzzleConfig}
          t={t}
          onBack={handleBackToLibrary}
          onSave={handleSave}
          onPlay={handlePlay}
          onPrint={handlePrint}
        />
      )}
      {page === 'play' && puzzleConfig && (
        <PlayPage config={puzzleConfig} onBack={handleBackToLibrary} t={t} />
      )}
      {page === 'print' && puzzleConfig && (
        <PrintPage config={puzzleConfig} onBack={handleBackToLibrary} t={t} />
      )}
      {(page === 'library' || page === 'create') && <AppFooter />}
    </>
  )
}
