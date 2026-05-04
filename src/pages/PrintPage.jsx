import { useMemo } from 'react'
import {
  PAD_RATIO,
  createPieces,
  generateEdgeMap,
  renderPiece,
  shuffle,
} from '../utils/puzzleUtils'

function choosePrintLayout(pieceCount, pageRatio = 1.35) {
  let best = { columns: 3, rows: Math.ceil(pieceCount / 3), score: -Infinity }

  for (let columns = 2; columns <= Math.min(6, pieceCount); columns += 1) {
    const rows = Math.ceil(pieceCount / columns)
    const ratio = rows / columns
    const compactness = -Math.abs(ratio - pageRatio)
    const fill = pieceCount / (columns * rows)
    const score = compactness * 2 + fill
    if (score > best.score) {
      best = { columns, rows, score }
    }
  }

  return best
}

function usePrintData(imageEl, rows, cols, connectorType, edgeSeed) {
  const allPieces = useMemo(() => createPieces(rows, cols), [rows, cols])
  const shuffledPieces = useMemo(() => shuffle(allPieces), [allPieces])
  const edgeMap = useMemo(() => generateEdgeMap(rows, cols, edgeSeed), [rows, cols, edgeSeed])

  const pieceNumbers = useMemo(() => {
    const map = {}
    shuffledPieces.forEach((piece, index) => {
      map[piece.id] = index + 1
    })
    return map
  }, [shuffledPieces])

  const pieceMetrics = useMemo(() => {
    if (!imageEl) return null
    const cellWidth = 220
    const pieceAspect = (imageEl.naturalHeight / imageEl.naturalWidth) * (cols / rows)
    const cellHeight = Math.round(cellWidth * pieceAspect)
    const pad = Math.round(Math.min(cellWidth, cellHeight) * PAD_RATIO)

    return {
      cellWidth,
      cellHeight,
      pad,
      renderWidth: cellWidth + pad * 2,
      renderHeight: cellHeight + pad * 2,
    }
  }, [imageEl, rows, cols])

  const pieceImages = useMemo(() => {
    if (!imageEl || !pieceMetrics) return []
    return shuffledPieces.map((piece) => {
      const canvas = document.createElement('canvas')
      renderPiece(
        canvas,
        imageEl,
        piece,
        rows,
        cols,
        pieceMetrics.cellWidth,
        pieceMetrics.cellHeight,
        edgeMap,
        connectorType
      )
      return {
        piece,
        url: canvas.toDataURL(),
        num: pieceNumbers[piece.id],
      }
    })
  }, [imageEl, pieceMetrics, shuffledPieces, pieceNumbers, rows, cols, edgeMap, connectorType])

  const positionGrid = useMemo(() => {
    return Array.from({ length: rows }, (_, rowIndex) =>
      Array.from({ length: cols }, (_, columnIndex) => pieceNumbers[rowIndex * cols + columnIndex])
    )
  }, [rows, cols, pieceNumbers])

  return { pieceMetrics, pieceImages, positionGrid }
}

export default function PrintPage({ config, onBack, t }) {
  const {
    edgeSeed,
    id,
    imageDataUrl,
    imageEl,
    title,
    rows,
    cols,
    connectorType = 'classic',
  } = config

  const resolvedEdgeSeed = edgeSeed ?? `${id ?? title}-${rows}x${cols}`
  const { pieceMetrics, pieceImages, positionGrid } = usePrintData(
    imageEl,
    rows,
    cols,
    connectorType,
    resolvedEdgeSeed
  )

  if (!imageEl || !pieceMetrics || pieceImages.length === 0) return null

  const puzzleSizeText = `${rows} x ${cols} - ${rows * cols} ${t('pieces')}`
  const printLayout = choosePrintLayout(pieceImages.length)

  async function handleDownloadPdf() {
    const { jsPDF } = await import('jspdf')
    const pdf = new jsPDF({ format: 'a4', unit: 'mm', orientation: 'portrait' })
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 10
    const headerHeight = 20
    const numberBandHeight = 6
    const gapX = 3
    const gapY = 3

    const pieceAspect = pieceMetrics.renderHeight / pieceMetrics.renderWidth
    const columnsPerPage = printLayout.columns
    const cellWidth = (pageWidth - margin * 2 - gapX * (columnsPerPage - 1)) / columnsPerPage
    const imageHeight = cellWidth * pieceAspect
    const rowBlockHeight = imageHeight + numberBandHeight
    const availableHeight = pageHeight - margin - headerHeight - margin
    const rowsPerPage = Math.max(1, Math.floor((availableHeight + gapY) / (rowBlockHeight + gapY)))
    const itemsPerPage = rowsPerPage * columnsPerPage
    const startY = margin + headerHeight

    function drawHeader() {
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(18)
      pdf.text(title, margin, 16)
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(11)
      pdf.text(puzzleSizeText, margin, 22)
    }

    for (let start = 0; start < pieceImages.length; start += itemsPerPage) {
      if (start > 0) pdf.addPage()
      drawHeader()

      pieceImages.slice(start, start + itemsPerPage).forEach((item, index) => {
        const columnIndex = index % columnsPerPage
        const rowIndex = Math.floor(index / columnsPerPage)
        const x = margin + columnIndex * (cellWidth + gapX)
        const y = startY + rowIndex * (rowBlockHeight + gapY)

        pdf.addImage(item.url, 'PNG', x, y, cellWidth, imageHeight)
        pdf.setDrawColor(200, 200, 200)
        pdf.setLineDashPattern([0.8, 0.8], 0)
        pdf.line(x, y + imageHeight + 0.7, x + cellWidth, y + imageHeight + 0.7)
        pdf.setLineDashPattern([], 0)
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(9)
        pdf.text(String(item.num), x + cellWidth / 2, y + imageHeight + 4.6, { align: 'center' })
      })
    }

    pdf.addPage()
    drawHeader()
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(11)
    pdf.text(t('fullImage'), margin, 34)

    const solutionWidth = 82
    const solutionHeight = solutionWidth * (imageEl.naturalHeight / imageEl.naturalWidth)
    pdf.addImage(imageDataUrl, 'PNG', margin, 38, solutionWidth, solutionHeight)

    const gridX = margin + solutionWidth + 16
    const gridY = 38
    const gridCellWidth = Math.min(12, (pageWidth - gridX - margin) / cols)
    const gridCellHeight = 9

    pdf.text(t('positionQuestion'), gridX, 34)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)

    positionGrid.forEach((gridRow, rowIndex) => {
      gridRow.forEach((num, columnIndex) => {
        const cellX = gridX + columnIndex * gridCellWidth
        const cellY = gridY + rowIndex * gridCellHeight
        pdf.setDrawColor(187, 187, 187)
        pdf.rect(cellX, cellY, gridCellWidth, gridCellHeight)
        pdf.text(String(num), cellX + gridCellWidth / 2, cellY + 5.8, { align: 'center' })
      })
    })

    const fileName = `${title || 'puzzle'}-${rows}x${cols}.pdf`
      .toLowerCase()
      .replace(/[^a-z0-9-_]+/g, '-')
      .replace(/-+/g, '-')

    pdf.save(fileName)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div className="print-controls no-print">
        <button className="btn btn-ghost btn-sm" onClick={onBack}>{t('back')}</button>
        <span className="title">{title}</span>
        <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
          <button className="btn btn-ghost btn-sm" onClick={onBack}>{t('backToEdit')}</button>
          <button className="btn btn-secondary" onClick={handleDownloadPdf}>PDF</button>
          <button className="btn btn-primary" onClick={() => window.print()}>{t('print')}</button>
        </div>
      </div>

      <div id="print-root" style={{ padding: '20px 28px', maxWidth: 880, margin: '0 auto' }}>
        <div className="print-page-block">
          <div style={{ marginBottom: 14 }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>{title}</h1>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{puzzleSizeText}</p>
            <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>{t('cutInstructions')}</p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${printLayout.columns}, minmax(0, 1fr))`,
              gap: '4px 4px',
              alignItems: 'start',
            }}
          >
            {pieceImages.map(({ piece, url, num }) => (
              <div
                key={piece.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '4px 3px 3px',
                  minHeight: pieceMetrics.renderHeight + 20,
                  background: 'white',
                }}
              >
                <img
                  src={url}
                  alt={`${t('pieces')} ${num}`}
                  style={{
                    width: '100%',
                    maxWidth: pieceMetrics.renderWidth,
                    display: 'block',
                    marginBottom: 2,
                    filter: 'drop-shadow(0 0 0.9px rgba(0,0,0,0.9))',
                  }}
                />
                <div style={{ width: '100%', paddingTop: 1, textAlign: 'center' }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: 'rgba(0,0,0,0.75)',
                      background: '#f8fafc',
                      borderRadius: 4,
                      padding: '1px 8px',
                      lineHeight: 1.3,
                      display: 'inline-block',
                    }}
                  >
                    {num}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <p style={{ fontSize: 11, color: '#999', marginTop: 8, fontStyle: 'italic' }}>
            {rows} x {cols} = {rows * cols} {t('pieces')} - {title}
          </p>
        </div>

        <div
          className="print-page-block"
          style={{ marginTop: 38, paddingTop: 24, borderTop: '3px dashed #e2e8f0' }}
        >
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>
            {t('solutionKey', { title })}
          </h2>

          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'flex-start' }}>
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
                {positionGrid.flat().map((num, index) => (
                  <div
                    key={index}
                    style={{
                      width: 36,
                      height: 28,
                      borderRight: '1.5px solid #bbb',
                      borderBottom: '1.5px solid #bbb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 13,
                      fontWeight: 800,
                      color: 'var(--text)',
                      background: index % 2 === 0 ? '#fafafa' : 'white',
                    }}
                  >
                    {num}
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 11, color: '#999', marginTop: 8, lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                {t('positionHelp')}
              </p>

              <div style={{ marginTop: 20, padding: '12px 14px', background: '#f0fdf4', borderRadius: 10, fontSize: 13, color: '#166534', lineHeight: 1.7 }}>
                <strong>{t('studentInstructions')}</strong><br />
                {t('step1', { count: rows * cols })}<br />
                {t('step2')}<br />
                {t('step3')}<br />
                {t('step4')}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="no-print" style={{ padding: '16px 32px', maxWidth: 880, margin: '0 auto' }}>
        <div style={{ padding: '12px 16px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, fontSize: 13, color: '#92400e' }}>
          <strong>{t('printAdvice')}</strong> {t('printAdviceText')}
        </div>
      </div>
    </div>
  )
}
