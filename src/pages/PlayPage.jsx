import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import {
  shuffle, createPieces, generateEdgeMap,
  renderPiece, PAD_RATIO, formatTime,
} from '../utils/puzzleUtils'
import PuzzlePieceCanvas from '../components/PuzzlePieceCanvas'

export default function PlayPage({ config, onBack, t }) {
  const { imageDataUrl, imageEl, title, rows, cols } = config

  // ── Sizes ────────────────────────────────────────────────────────────────
  const MAX_BOARD = 480
  const pieceAspect = imageEl ? (imageEl.naturalHeight / imageEl.naturalWidth) * (cols / rows) : 1
  const cellSize  = Math.floor(MAX_BOARD / Math.max(rows, cols))
  const cellW     = cellSize
  const cellH     = Math.round(cellSize * pieceAspect)
  const pad       = Math.round(Math.min(cellW, cellH) * PAD_RATIO)

  // Tray pieces slightly smaller
  const trayCell  = Math.max(56, Math.round(cellSize * 0.62))
  const trayCellH = Math.round(trayCell * pieceAspect)
  const trayPad   = Math.round(Math.min(trayCell, trayCellH) * PAD_RATIO)

  // ── Puzzle data ───────────────────────────────────────────────────────────
  const allPieces  = useMemo(() => createPieces(rows, cols), [rows, cols])
  const pieceById  = useMemo(
    () => Object.fromEntries(allPieces.map((p) => [p.id, p])),
    [allPieces]
  )
  const edgeMap = useMemo(() => generateEdgeMap(rows, cols), [rows, cols])

  // ── State ─────────────────────────────────────────────────────────────────
  // board[r][c] = pieceId | null
  const [board,    setBoard]    = useState(() => Array.from({ length: rows }, () => Array(cols).fill(null)))
  const [tray,     setTray]     = useState(() => shuffle(allPieces))
  // selected: { pieceId, from:'tray'|'board', fromRow?, fromCol? } | null
  const [selected, setSelected] = useState(null)
  const [moves,    setMoves]    = useState(0)
  const [time,     setTime]     = useState(0)
  const [solved,   setSolved]   = useState(false)
  const [showHint, setShowHint] = useState(false)
  const hintTimer = useRef(null)

  // ── Timer ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (solved) return
    const id = setInterval(() => setTime((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [solved])

  // ── Escape to deselect ────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setSelected(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    return () => clearTimeout(hintTimer.current)
  }, [])

  // ── Check solved ──────────────────────────────────────────────────────────
  const checkSolved = useCallback(
    (b) => {
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++) {
          const p = pieceById[b[r][c]]
          if (!p || p.row !== r || p.col !== c) return false
        }
      setSolved(true)
      return true
    },
    [rows, cols, pieceById]
  )

  // ── Tray click ────────────────────────────────────────────────────────────
  const handleTrayClick = (piece) => {
    setSelected((prev) =>
      prev?.pieceId === piece.id ? null : { pieceId: piece.id, from: 'tray' }
    )
  }

  // ── Board slot click ──────────────────────────────────────────────────────
  const handleSlotClick = (r, c) => {
    const currentPieceId = board[r][c]

    // Deselect if clicking the already-selected board piece
    if (selected?.from === 'board' && selected.fromRow === r && selected.fromCol === c) {
      setSelected(null)
      return
    }

    if (!selected) {
      // Select the piece that is in this slot
      if (currentPieceId !== null) {
        setSelected({ pieceId: currentPieceId, from: 'board', fromRow: r, fromCol: c })
      }
      return
    }

    // Place selected piece into this slot
    const newBoard = board.map((row) => [...row])
    let newTray = [...tray]

    if (selected.from === 'tray') {
      newTray = newTray.filter((p) => p.id !== selected.pieceId)
      if (currentPieceId !== null) {
        // Send displaced piece back to tray
        newTray = [...newTray, pieceById[currentPieceId]]
      }
    } else {
      // Moving between board slots
      newBoard[selected.fromRow][selected.fromCol] = currentPieceId ?? null
    }

    newBoard[r][c] = selected.pieceId
    setBoard(newBoard)
    setTray(newTray)
    setSelected(null)
    setMoves((m) => m + 1)
    checkSolved(newBoard)
  }

  // ── Hint ──────────────────────────────────────────────────────────────────
  const handleHint = () => {
    clearTimeout(hintTimer.current)
    setShowHint(true)
    hintTimer.current = setTimeout(() => setShowHint(false), 3000)
  }

  // ── Reset ─────────────────────────────────────────────────────────────────
  const handleReset = () => {
    setBoard(Array.from({ length: rows }, () => Array(cols).fill(null)))
    setTray(shuffle(allPieces))
    setSelected(null)
    setMoves(0)
    setTime(0)
    setSolved(false)
  }

  const placedCount = allPieces.filter((p) => board[p.row]?.[p.col] === p.id).length

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="play-layout">
      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div className="play-toolbar no-print">
        <button className="btn btn-ghost btn-sm" onClick={onBack}>← {t('back')}</button>
        <span className="title">{title}</span>
        <span className="stat-badge">⏱ {formatTime(time)}</span>
        <span className="stat-badge">👆 {moves}</span>
        <span className="stat-badge">✅ {placedCount}/{rows * cols}</span>
        {selected && (
          <span style={{ fontSize: 13, color: 'var(--warning)', fontWeight: 700 }}>
            {t('selectedPieceHelp')}
          </span>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button className="btn btn-outline btn-sm" onClick={handleHint}>💡 {t('hint')}</button>
          <button className="btn btn-ghost btn-sm" onClick={handleReset}>🔄 {t('reset')}</button>
        </div>
      </div>

      {/* ── Main ─────────────────────────────────────────────────────────── */}
      <div className="play-main">

        {/* Tray */}
        <div className="tray-panel no-print">
          <div className="tray-header">
            {t('availablePieces', { count: tray.length })}
          </div>
          <div className="tray-pieces">
            {tray.map((piece) => {
              const isSelected = selected?.pieceId === piece.id
              return (
                <div
                  key={piece.id}
                  onClick={() => handleTrayClick(piece)}
                  style={{
                    position: 'relative',
                    width:  trayCell + trayPad * 2,
                    height: trayCellH + trayPad * 2,
                    cursor: 'pointer',
                    borderRadius: 4,
                    outline: isSelected ? '3px solid #f59e0b' : 'none',
                    outlineOffset: 2,
                    filter: isSelected
                      ? 'drop-shadow(0 0 6px #f59e0b) drop-shadow(0 0 3px #f59e0b)'
                      : 'none',
                    transform: isSelected ? 'scale(1.06)' : 'scale(1)',
                    transition: 'transform 0.12s, filter 0.12s',
                    zIndex: isSelected ? 10 : 1,
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
                    selected={false}
                    correct={false}
                  />
                </div>
              )
            })}
            {tray.length === 0 && (
              <p style={{ color: 'var(--text-muted)', fontSize: 13, padding: '8px 4px' }}>
                {t('allPlaced')}
              </p>
            )}
          </div>
        </div>

        {/* Board */}
        <div className="board-area">
          {/* Instruction banner */}
          {selected && (
            <div style={{
              position: 'absolute',
              top: 8,
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#f59e0b',
              color: 'white',
              borderRadius: 20,
              padding: '4px 16px',
              fontSize: 13,
              fontWeight: 700,
              zIndex: 30,
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
            }}>
              {t('clickBoardSlot')}
            </div>
          )}

          <div
            className={`puzzle-board${selected ? ' has-selection' : ''}`}
            style={{
              gridTemplateColumns: `repeat(${cols}, ${cellW}px)`,
              gridTemplateRows:    `repeat(${rows}, ${cellH}px)`,
              width:  cellW * cols,
              height: cellH * rows,
            }}
          >
            {Array.from({ length: rows }, (_, r) =>
              Array.from({ length: cols }, (_, c) => {
                const pieceId   = board[r][c]
                const piece     = pieceId !== null ? pieceById[pieceId] : null
                const isCorrect = piece && piece.row === r && piece.col === c
                const isSelectedOnBoard = selected?.from === 'board'
                  && selected.fromRow === r && selected.fromCol === c

                return (
                  <div
                    key={`${r}-${c}`}
                    className={`board-slot${isSelectedOnBoard ? ' slot-selected-src' : ''}`}
                    onClick={() => handleSlotClick(r, c)}
                    style={{
                      width:  cellW,
                      height: cellH,
                      cursor: selected ? 'crosshair' : (piece ? 'pointer' : 'default'),
                    }}
                  >
                    {/* ── Piece canvas — pointer-events NONE so clicks reach the slot ── */}
                    {piece && (
                      <div
                        style={{
                          position: 'absolute',
                          left: -pad,
                          top:  -pad,
                          zIndex: isSelectedOnBoard ? 10 : 2,
                          pointerEvents: 'none', // ← critical: let clicks fall through to slot
                          filter: isSelectedOnBoard
                            ? 'drop-shadow(0 0 8px #f59e0b) drop-shadow(0 0 4px #f59e0b)'
                            : isCorrect
                            ? 'drop-shadow(0 0 4px #10b981)'
                            : 'none',
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
                          selected={false}
                          correct={false}
                        />
                      </div>
                    )}

                    {/* Correct indicator dot */}
                    {isCorrect && (
                      <div style={{
                        position: 'absolute',
                        bottom: 3, right: 3,
                        width: 8, height: 8,
                        borderRadius: '50%',
                        background: '#10b981',
                        zIndex: 20,
                        pointerEvents: 'none',
                      }} />
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* ── Hint overlay ───────────────────────────────────────────────────── */}
      {showHint && (
        <div className="hint-overlay" onClick={() => setShowHint(false)}>
          <img src={imageDataUrl} alt={t('solutionAlt')} />
          <p>{t('solutionOverlay')}</p>
        </div>
      )}

      {/* ── Victory ────────────────────────────────────────────────────────── */}
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
              <button className="btn btn-primary" onClick={handleReset}>🔄 {t('playAgain')}</button>
              <button className="btn btn-ghost"    onClick={onBack}>← {t('back')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
