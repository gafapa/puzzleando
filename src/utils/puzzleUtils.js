export const PAD_RATIO = 0.38
export const CONNECTOR_TYPES = ['classic', 'compact', 'bold']

function hashSeed(seed) {
  let hash = 2166136261
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function createSeededRandom(seed) {
  let state = hashSeed(seed) || 1
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 4294967296
  }
}

export function createEdgeSeed() {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function shuffle(array) {
  const items = [...array]
  for (let index = items.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    ;[items[index], items[randomIndex]] = [items[randomIndex], items[index]]
  }
  return items
}

export function createPieces(rows, cols) {
  const pieces = []
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      pieces.push({ id: row * cols + col, row, col })
    }
  }
  return pieces
}

export function getConnectorProfile(connectorType = 'classic') {
  switch (connectorType) {
    case 'compact':
      return { nubHeightRatio: 0.2, nubWidthRatio: 0.18, curveStrength: 0.7 }
    case 'bold':
      return { nubHeightRatio: 0.34, nubWidthRatio: 0.26, curveStrength: 0.95 }
    case 'classic':
    default:
      return { nubHeightRatio: 0.28, nubWidthRatio: 0.22, curveStrength: 0.8 }
  }
}

export function generateEdgeMap(rows, cols, seed = createEdgeSeed()) {
  const random = createSeededRandom(String(seed))
  const horizontalEdges = Array.from({ length: rows - 1 }, () =>
    Array.from({ length: cols }, () => (random() > 0.5 ? 1 : -1))
  )
  const verticalEdges = Array.from({ length: rows }, () =>
    Array.from({ length: cols - 1 }, () => (random() > 0.5 ? 1 : -1))
  )

  return { horizontalEdges, verticalEdges }
}

export function getPieceEdges(edgeMap, row, col, rows, cols) {
  const { horizontalEdges, verticalEdges } = edgeMap

  return {
    top: row === 0 ? 0 : -horizontalEdges[row - 1][col],
    bottom: row === rows - 1 ? 0 : horizontalEdges[row][col],
    left: col === 0 ? 0 : -verticalEdges[row][col - 1],
    right: col === cols - 1 ? 0 : verticalEdges[row][col],
  }
}

function addEdgePath(ctx, x1, y1, x2, y2, perpX, perpY, edgeType, nubSize, profile) {
  if (edgeType === 0) {
    ctx.lineTo(x2, y2)
    return
  }

  const length = Math.hypot(x2 - x1, y2 - y1)
  const edgeX = (x2 - x1) / length
  const edgeY = (y2 - y1) / length
  const midX = (x1 + x2) / 2
  const midY = (y1 + y2) / 2
  const nubWidth = length * profile.nubWidthRatio
  const nubHeight = nubSize * edgeType

  const startX = midX - edgeX * nubWidth
  const startY = midY - edgeY * nubWidth
  const endX = midX + edgeX * nubWidth
  const endY = midY + edgeY * nubWidth
  const peakX = midX + perpX * nubHeight
  const peakY = midY + perpY * nubHeight

  ctx.lineTo(startX, startY)
  ctx.bezierCurveTo(
    startX + perpX * nubHeight * profile.curveStrength,
    startY + perpY * nubHeight * profile.curveStrength,
    peakX - edgeX * nubWidth * 0.5,
    peakY - edgeY * nubWidth * 0.5,
    peakX,
    peakY
  )
  ctx.bezierCurveTo(
    peakX + edgeX * nubWidth * 0.5,
    peakY + edgeY * nubWidth * 0.5,
    endX + perpX * nubHeight * profile.curveStrength,
    endY + perpY * nubHeight * profile.curveStrength,
    endX,
    endY
  )
  ctx.lineTo(x2, y2)
}

function drawPiecePath(ctx, width, height, edges, nubSize, profile) {
  ctx.beginPath()
  ctx.moveTo(0, 0)
  addEdgePath(ctx, 0, 0, width, 0, 0, -1, edges.top, nubSize, profile)
  addEdgePath(ctx, width, 0, width, height, 1, 0, edges.right, nubSize, profile)
  addEdgePath(ctx, width, height, 0, height, 0, 1, edges.bottom, nubSize, profile)
  addEdgePath(ctx, 0, height, 0, 0, -1, 0, edges.left, nubSize, profile)
  ctx.closePath()
}

export function renderPiece(
  canvas,
  image,
  piece,
  rows,
  cols,
  cellWidth,
  cellHeight,
  edgeMap,
  connectorType = 'classic'
) {
  const pad = Math.round(Math.min(cellWidth, cellHeight) * PAD_RATIO)
  const profile = getConnectorProfile(connectorType)
  const nubSize = Math.min(cellWidth, cellHeight) * profile.nubHeightRatio
  const edges = getPieceEdges(edgeMap, piece.row, piece.col, rows, cols)

  const canvasWidth = Math.round(cellWidth + pad * 2)
  const canvasHeight = Math.round(cellHeight + pad * 2)
  canvas.width = canvasWidth
  canvas.height = canvasHeight

  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, canvasWidth, canvasHeight)

  ctx.save()
  ctx.translate(pad, pad)

  drawPiecePath(ctx, cellWidth, cellHeight, edges, nubSize, profile)
  ctx.save()
  ctx.clip()

  const sourceWidth = image.naturalWidth / cols
  const sourceHeight = image.naturalHeight / rows
  const sourceX = piece.col * sourceWidth
  const sourceY = piece.row * sourceHeight
  const scaleX = cellWidth / sourceWidth
  const scaleY = cellHeight / sourceHeight
  const sourcePadX = pad / scaleX
  const sourcePadY = pad / scaleY

  ctx.drawImage(
    image,
    sourceX - sourcePadX,
    sourceY - sourcePadY,
    sourceWidth + sourcePadX * 2,
    sourceHeight + sourcePadY * 2,
    -pad,
    -pad,
    canvasWidth,
    canvasHeight
  )

  ctx.restore()

  drawPiecePath(ctx, cellWidth, cellHeight, edges, nubSize, profile)
  ctx.strokeStyle = 'rgba(0,0,0,0.3)'
  ctx.lineWidth = 1.5
  ctx.stroke()

  ctx.restore()
}

export function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0')
  const remainingSeconds = (seconds % 60).toString().padStart(2, '0')
  return `${minutes}:${remainingSeconds}`
}
