const STORAGE_KEY = 'puzzleando-puzzles'

export function loadStoredPuzzles() {
  try {
    const rawPuzzles = localStorage.getItem(STORAGE_KEY)
    return rawPuzzles ? JSON.parse(rawPuzzles) : []
  } catch {
    return []
  }
}

export function storePuzzles(puzzles) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(puzzles))
}

export function serializePuzzle(config) {
  const now = new Date().toISOString()
  return {
    id: config.id ?? crypto.randomUUID?.() ?? `${Date.now()}`,
    title: config.title,
    imageDataUrl: config.imageDataUrl,
    rows: config.rows,
    cols: config.cols,
    edgeSeed: config.edgeSeed,
    connectorType: config.connectorType ?? 'classic',
    playDifficulty: config.playDifficulty ?? 'easy',
    createdAt: config.createdAt ?? now,
    updatedAt: now,
  }
}

export function hydratePuzzle(puzzle) {
  return new Promise((resolve, reject) => {
    const imageEl = new Image()
    imageEl.onload = () => resolve({ ...puzzle, imageEl })
    imageEl.onerror = reject
    imageEl.src = puzzle.imageDataUrl
  })
}
