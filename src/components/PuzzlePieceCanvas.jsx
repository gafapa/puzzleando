import { useRef, useEffect } from 'react'
import { renderPiece, PAD_RATIO } from '../utils/puzzleUtils'

export default function PuzzlePieceCanvas({
  image, piece, rows, cols, cellW, cellH, edgeMap,
  selected, correct, onClick, style = {},
}) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!canvasRef.current || !image || !edgeMap) return
    renderPiece(canvasRef.current, image, piece, rows, cols, cellW, cellH, edgeMap)
  }, [image, piece, rows, cols, cellW, cellH, edgeMap])

  const pad = Math.round(Math.min(cellW, cellH) * PAD_RATIO)

  return (
    <div
      className={`piece-wrapper${selected ? ' selected' : ''}${correct ? ' correct' : ''}`}
      onClick={onClick}
      style={{
        position: 'relative',
        width: cellW + pad * 2,
        height: cellH + pad * 2,
        ...style,
      }}
    >
      <canvas
        ref={canvasRef}
        className="piece-canvas"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  )
}
