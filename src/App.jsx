import { useState } from 'react'
import CreatePage from './pages/CreatePage'
import PlayPage from './pages/PlayPage'
import PrintPage from './pages/PrintPage'

export default function App() {
  const [page, setPage] = useState('create')
  const [puzzleConfig, setPuzzleConfig] = useState(null)

  const handlePlay = (config) => {
    setPuzzleConfig(config)
    setPage('play')
  }

  const handlePrint = (config) => {
    setPuzzleConfig(config)
    setPage('print')
  }

  const handleBack = () => setPage('create')

  return (
    <>
      {page === 'create' && (
        <CreatePage
          initialConfig={puzzleConfig}
          onPlay={handlePlay}
          onPrint={handlePrint}
        />
      )}
      {page === 'play' && puzzleConfig && <PlayPage config={puzzleConfig} onBack={handleBack} />}
      {page === 'print' && puzzleConfig && <PrintPage config={puzzleConfig} onBack={handleBack} />}
    </>
  )
}
