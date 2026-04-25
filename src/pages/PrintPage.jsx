import { useMemo } from 'react'
import { shuffle, createPieces, drawRectPiece } from '../utils/puzzleUtils'

// Returns an array of { piece, url, num } in shuffled (cut-out) order
function usePrintData(imageEl, rows, cols) {
  const allPieces = useMemo(() => createPieces(rows, cols), [rows, cols])
  const shuffled  = useMemo(() => shuffle(allPieces), [allPieces])

  // pieceNum[pieceId] = number shown on the cut-out piece (1-based, shuffle order)
  const pieceNum = useMemo(() => {
    const map = {}
    shuffled.forEach((p, i) => { map[p.id] = i + 1 })
    return map
  }, [shuffled])

  // Render each piece at 300px wide for quality
  const pieceUrls = useMemo(() => {
    if (!imageEl) return []
    const tmp = document.createElement('canvas')
    const W   = 300
    const H   = Math.round(W * (imageEl.naturalHeight / imageEl.naturalWidth) * cols / rows)
    return shuffled.map((piece) => {
      drawRectPiece(tmp, imageEl, piece, rows, cols, W, H)
      return { piece, url: tmp.toDataURL(), num: pieceNum[piece.id] }
    })
  }, [imageEl, rows, cols, shuffled, pieceNum])

  // positionGrid[r][c] = num of the piece that belongs there
  const positionGrid = useMemo(() => {
    return Array.from({ length: rows }, (_, r) =>
      Array.from({ length: cols }, (_, c) => pieceNum[r * cols + c])
    )
  }, [rows, cols, pieceNum])

  return { pieceUrls, positionGrid }
}

export default function PrintPage({ config, onBack, t }) {
  const { imageDataUrl, imageEl, title, rows, cols } = config
  const { pieceUrls, positionGrid } = usePrintData(imageEl, rows, cols)

  if (!imageEl || pieceUrls.length === 0) return null

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* ── Controls (hidden on print) ─────────────────────────────────── */}
      <div className="print-controls no-print">
        <button className="btn btn-ghost btn-sm" onClick={onBack}>← {t('back')}</button>
        <span className="title">🖨️ {title}</span>
        <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
          <button className="btn btn-ghost btn-sm" onClick={onBack}>← {t('backToEdit')}</button>
          <button className="btn btn-primary" onClick={() => window.print()}>
            🖨️ {t('print')}
          </button>
        </div>
      </div>

      {/* ── Print preview wrapper ──────────────────────────────────────── */}
      <div id="print-root" style={{ padding: '24px 32px', maxWidth: 880, margin: '0 auto' }}>

        {/* ════════════════════════════════════════
            PAGE 1 — Pieces to cut out
            ════════════════════════════════════════ */}
        <div className="print-page-block">

          {/* Header */}
          <div style={{ marginBottom: 18 }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>{title}</h1>
            <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
              ✂ {t('cutInstructions')}
            </p>
          </div>

          {/* Pieces grid — each piece is its own island with cut borders */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${cols}, 1fr)`,
              gap: 0,
              border: '1.5px solid #bbb',
              borderRight: 'none',
              borderBottom: 'none',
            }}
          >
            {pieceUrls.map(({ piece, url, num }) => (
              <div
                key={piece.id}
                style={{
                  position: 'relative',
                  borderRight:  '1.5px dashed #bbb',
                  borderBottom: '1.5px dashed #bbb',
                  lineHeight: 0,         // remove img baseline gap
                }}
              >
                <img
                  src={url}
                  alt={`${t('pieces')} ${num}`}
                  style={{ width: '100%', display: 'block' }}
                />
                {/* Piece number badge */}
                <span style={{
                  position: 'absolute',
                  bottom: 5,
                  right: 6,
                  fontSize: 12,
                  fontWeight: 800,
                  color: 'rgba(0,0,0,0.55)',
                  background: 'rgba(255,255,255,0.75)',
                  borderRadius: 4,
                  padding: '1px 5px',
                  lineHeight: 1.4,
                  pointerEvents: 'none',
                }}>
                  {num}
                </span>
              </div>
            ))}
          </div>

          <p style={{ fontSize: 11, color: '#999', marginTop: 10, fontStyle: 'italic' }}>
            {rows} × {cols} = {rows * cols} {t('pieces')} · {title}
          </p>
        </div>

        {/* ════════════════════════════════════════
            PAGE 2 — Solution key
            ════════════════════════════════════════ */}
        <div
          className="print-page-block"
          style={{ marginTop: 48, paddingTop: 32, borderTop: '3px dashed #e2e8f0' }}
        >
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>
            {t('solutionKey', { title })}
          </h2>

          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'flex-start' }}>

            {/* Solution image */}
            <div style={{ flex: '0 0 auto', maxWidth: 320 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {t('fullImage')}
              </p>
              <img
                src={imageDataUrl}
                alt={t('solutionAlt')}
                style={{ width: '100%', display: 'block', borderRadius: 8, border: '1.5px solid #e2e8f0' }}
              />
            </div>

            {/* Position map */}
            <div style={{ flex: '1 1 200px' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {t('positionQuestion')}
              </p>
              <div
                style={{
                  display: 'inline-grid',
                  gridTemplateColumns: `repeat(${cols}, 36px)`,
                  border: '1.5px solid #bbb',
                  borderRight: 'none',
                  borderBottom: 'none',
                }}
              >
                {positionGrid.flat().map((num, i) => (
                  <div
                    key={i}
                    style={{
                      width: 36,
                      height: 28,
                      borderRight:  '1.5px solid #bbb',
                      borderBottom: '1.5px solid #bbb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 13,
                      fontWeight: 800,
                      color: 'var(--text)',
                      background: i % 2 === 0 ? '#fafafa' : 'white',
                    }}
                  >
                    {num}
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 11, color: '#999', marginTop: 8, lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                {t('positionHelp')}
              </p>

              {/* Instructions */}
              <div style={{ marginTop: 20, padding: '12px 14px', background: '#f0fdf4', borderRadius: 10, fontSize: 13, color: '#166534', lineHeight: 1.7 }}>
                <strong>{t('studentInstructions')}</strong><br/>
                {t('step1', { count: rows * cols })}<br/>
                {t('step2')}<br/>
                {t('step3')}<br/>
                {t('step4')}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ── Screen-only tip ───────────────────────────────────────────── */}
      <div className="no-print" style={{ padding: '16px 32px', maxWidth: 880, margin: '0 auto' }}>
        <div style={{ padding: '12px 16px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, fontSize: 13, color: '#92400e' }}>
          💡 <strong>{t('printAdvice')}</strong> {t('printAdviceText')}
        </div>
      </div>

    </div>
  )
}
