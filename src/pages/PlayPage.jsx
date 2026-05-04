import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { PAD_RATIO, createPieces, formatTime, generateEdgeMap, shuffle } from '../utils/puzzleUtils'
import PuzzlePieceCanvas from '../components/PuzzlePieceCanvas'

export default function PlayPage({ config, onBack, t }) {
  const {
    edgeSeed,
    id,
    imageDataUrl,
    imageEl,
    title,
    rows,
    cols,
    connectorType = 'classic',
    playDifficulty = 'easy',
  } = config

  const MAX_BOARD = 480
  const pieceAspect = imageEl ? (imageEl.naturalHeight / imageEl.naturalWidth) * (cols / rows) : 1
  const cellSize = Math.floor(MAX_BOARD / Math.max(rows, cols))
  const cellW = cellSize
  const cellH = Math.round(cellSize * pieceAspect)
  const pad = Math.round(Math.min(cellW, cellH) * PAD_RATIO)

  const trayCell = Math.max(56, Math.round(cellSize * 0.62))
  const trayCellH = Math.round(trayCell * pieceAspect)
  const trayPad = Math.round(Math.min(trayCell, trayCellH) * PAD_RATIO)

  const allPieces = useMemo(() => createPieces(rows, cols), [rows, cols])
  const pieceById = useMemo(() => Object.fromEntries(allPieces.map((piece) => [piece.id, piece])), [allPieces])
  const resolvedEdgeSeed = edgeSeed ?? `${id ?? title}-${rows}x${cols}`
  const edgeMap = useMemo(() => generateEdgeMap(rows, cols, resolvedEdgeSeed), [rows, cols, resolvedEdgeSeed])

  const [board, setBoard] = useState(() => Array.from({ length: rows }, () => Array(cols).fill(null)))
  const [tray, setTray] = useState(() => shuffle(allPieces))
  const [dragState, setDragState] = useState(null)
  const [moves, setMoves] = useState(0)
  const [time, setTime] = useState(0)
  const [solved, setSolved] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const hintTimer = useRef(null)

  useEffect(() => {
    if (solved) return
    const intervalId = setInterval(() => setTime((currentTime) => currentTime + 1), 1000)
    return () => clearInterval(intervalId)
  }, [solved])

  useEffect(() => () => clearTimeout(hintTimer.current), [])

  const checkSolved = useCallback(
    (nextBoard) => {
      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
          const piece = pieceById[nextBoard[row][col]]
          if (!piece || piece.row !== row || piece.col !== col) {
            return false
          }
        }
      }

      setSolved(true)
      return true
    },
    [cols, pieceById, rows]
  )

  const moveDraggedPieceToBoard = useCallback(
    (targetRow, targetCol) => {
      if (!dragState) return

      const currentPieceId = board[targetRow][targetCol]
      const nextBoard = board.map((boardRow) => [...boardRow])
      let nextTray = [...tray]

      if (dragState.from === 'tray') {
        nextTray = nextTray.filter((piece) => piece.id !== dragState.pieceId)
        if (currentPieceId !== null) {
          nextTray = [...nextTray, pieceById[currentPieceId]]
        }
      } else {
        if (dragState.fromRow === targetRow && dragState.fromCol === targetCol) {
          setDragState(null)
          return
        }

        nextBoard[dragState.fromRow][dragState.fromCol] = currentPieceId ?? null
      }

      nextBoard[targetRow][targetCol] = dragState.pieceId
      setBoard(nextBoard)
      setTray(nextTray)
      setDragState(null)
      setMoves((currentMoves) => currentMoves + 1)
      checkSolved(nextBoard)
    },
    [board, checkSolved, dragState, pieceById, tray]
  )

  const moveDraggedPieceToTray = useCallback(() => {
    if (!dragState || dragState.from !== 'board') {
      setDragState(null)
      return
    }

    const nextBoard = board.map((boardRow) => [...boardRow])
    const nextTray = [...tray, pieceById[dragState.pieceId]]
    nextBoard[dragState.fromRow][dragState.fromCol] = null

    setBoard(nextBoard)
    setTray(nextTray)
    setDragState(null)
    setMoves((currentMoves) => currentMoves + 1)
    setSolved(false)
  }, [board, dragState, pieceById, tray])

  const handleDragStart = (event, nextDragState) => {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', String(nextDragState.pieceId))
    setDragState(nextDragState)
  }

  const handleDragEnd = () => {
    setDragState(null)
  }

  const handleHint = () => {
    clearTimeout(hintTimer.current)
    setShowHint(true)
    hintTimer.current = setTimeout(() => setShowHint(false), 3000)
  }

  const handleReset = () => {
    setBoard(Array.from({ length: rows }, () => Array(cols).fill(null)))
    setTray(shuffle(allPieces))
    setDragState(null)
    setMoves(0)
    setTime(0)
    setSolved(false)
  }

  const correctCount = allPieces.filter((piece) => board[piece.row]?.[piece.col] === piece.id).length
  const occupiedCount = board.flat().filter((pieceId) => pieceId !== null).length

  return (
    <div className="play-layout">
      <div className="play-toolbar no-print">
        <button className="btn btn-ghost btn-sm" onClick={onBack}>
          ← {t('back')}
        </button>
        <span className="title">{title}</span>
        <span className="stat-badge">⏱ {formatTime(time)}</span>
        <span className="stat-badge">👆 {moves}</span>
        <span className="stat-badge">
          {playDifficulty === 'easy' ? '✅' : '🧩'} {playDifficulty === 'easy' ? correctCount : occupiedCount}/{rows * cols}
        </span>
        <span className="play-mode-pill">{t(playDifficulty === 'easy' ? 'easyMode' : 'hardMode')}</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button className="btn btn-outline btn-sm" onClick={handleHint}>
            💡 {t('hint')}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={handleReset}>
            🔄 {t('reset')}
          </button>
        </div>
      </div>

      <div className="play-main">
        <div
          className={`tray-panel no-print${dragState ? ' tray-panel-drop' : ''}`}
          onDragOver={(event) => {
            if (dragState?.from === 'board') {
              event.preventDefault()
              event.dataTransfer.dropEffect = 'move'
            }
          }}
          onDrop={(event) => {
            event.preventDefault()
            moveDraggedPieceToTray()
          }}
        >
          <div className="tray-header">{t('availablePieces', { count: tray.length })}</div>
          <div className="tray-pieces">
            {tray.map((piece) => {
              const isDragging = dragState?.pieceId === piece.id

              return (
                <div
                  key={piece.id}
                  draggable
                  onDragStart={(event) => handleDragStart(event, { pieceId: piece.id, from: 'tray' })}
                  onDragEnd={handleDragEnd}
                  style={{
                    position: 'relative',
                    width: trayCell + trayPad * 2,
                    height: trayCellH + trayPad * 2,
                    cursor: 'grab',
                    borderRadius: 4,
                    opacity: isDragging ? 0.35 : 1,
                    transform: isDragging ? 'scale(1.04)' : 'scale(1)',
                    transition: 'transform 0.12s, opacity 0.12s',
                    zIndex: isDragging ? 10 : 1,
                  }}
                >
                  <PuzzlePieceCanvas
                    image={imageEl}
                    piece={piece}
                    rows={rows}
                    cols={cols}
                    cellW={trayCell}
                    cellH={trayCellH}
                    edgeMap={edgeMap}
                    connectorType={connectorType}
                    selected={false}
                    correct={false}
                  />
                </div>
              )
            })}
            {tray.length === 0 && (
              <p style={{ color: 'var(--text-muted)', fontSize: 13, padding: '8px 4px' }}>{t('allPlaced')}</p>
            )}
          </div>
        </div>

        <div className="board-area">
          <div
            className={`puzzle-board${dragState ? ' has-selection' : ''}`}
            style={{
              gridTemplateColumns: `repeat(${cols}, ${cellW}px)`,
              gridTemplateRows: `repeat(${rows}, ${cellH}px)`,
              width: cellW * cols,
              height: cellH * rows,
            }}
          >
            {Array.from({ length: rows }, (_, row) =>
              Array.from({ length: cols }, (_, col) => {
                const pieceId = board[row][col]
                const piece = pieceId !== null ? pieceById[pieceId] : null
                const isCorrect = Boolean(piece && piece.row === row && piece.col === col)
                const showCorrectFeedback = playDifficulty === 'easy' && isCorrect
                const isDragging = dragState?.from === 'board' && dragState.fromRow === row && dragState.fromCol === col

                return (
                  <div
                    key={`${row}-${col}`}
                    className={`board-slot${isDragging ? ' slot-selected-src' : ''}`}
                    onDragOver={(event) => {
                      if (!dragState) return
                      event.preventDefault()
                      event.dataTransfer.dropEffect = 'move'
                    }}
                    onDrop={(event) => {
                      event.preventDefault()
                      moveDraggedPieceToBoard(row, col)
                    }}
                    style={{
                      width: cellW,
                      height: cellH,
                      cursor: dragState ? 'grabbing' : piece ? 'grab' : 'default',
                    }}
                  >
                    {piece && (
                      <div
                        draggable
                        onDragStart={(event) =>
                          handleDragStart(event, {
                            pieceId: piece.id,
                            from: 'board',
                            fromRow: row,
                            fromCol: col,
                          })
                        }
                        onDragEnd={handleDragEnd}
                        style={{
                          position: 'absolute',
                          left: -pad,
                          top: -pad,
                          zIndex: isDragging ? 10 : 2,
                          cursor: 'grab',
                          opacity: isDragging ? 0.3 : 1,
                          filter: showCorrectFeedback ? 'drop-shadow(0 0 4px #10b981)' : 'none',
                        }}
                      >
                        <PuzzlePieceCanvas
                          image={imageEl}
                          piece={piece}
                          rows={rows}
                          cols={cols}
                          cellW={cellW}
                          cellH={cellH}
                          edgeMap={edgeMap}
                          connectorType={connectorType}
                          selected={false}
                          correct={false}
                        />
                      </div>
                    )}

                    {showCorrectFeedback && (
                      <div
                        style={{
                          position: 'absolute',
                          bottom: 3,
                          right: 3,
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: '#10b981',
                          zIndex: 20,
                          pointerEvents: 'none',
                        }}
                      />
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {showHint && (
        <div className="hint-overlay" onClick={() => setShowHint(false)}>
          <img src={imageDataUrl} alt={t('solutionAlt')} />
          <p>{t('solutionOverlay')}</p>
        </div>
      )}

      {solved && (
        <div className="victory-overlay">
          <div className="victory-card pop-in">
            <div style={{ fontSize: 56, marginBottom: 8 }}>🎉</div>
            <h2 style={{ color: 'var(--primary)' }}>{t('completed')}</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{title}</p>
            <div className="stats">
              <div className="stat">
                <span className="stat-val">{formatTime(time)}</span>
                <span className="stat-lbl">{t('time')}</span>
              </div>
              <div className="stat">
                <span className="stat-val">{moves}</span>
                <span className="stat-lbl">{t('moves')}</span>
              </div>
              <div className="stat">
                <span className="stat-val">{rows * cols}</span>
                <span className="stat-lbl">{t('pieces')}</span>
              </div>
            </div>
            <div className="victory-actions">
              <button className="btn btn-primary" onClick={handleReset}>
                🔄 {t('playAgain')}
              </button>
              <button className="btn btn-ghost" onClick={onBack}>
                ← {t('back')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
