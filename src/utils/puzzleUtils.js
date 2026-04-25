// ── Shuffle ──────────────────────────────────────────────────────────────────
export function shuffle(array) {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// ── Piece descriptors ────────────────────────────────────────────────────────
export function createPieces(rows, cols) {
  const pieces = []
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      pieces.push({ id: r * cols + c, row: r, col: c })
  return pieces
}

// ── Edge map (jigsaw tabs/notches) ───────────────────────────────────────────
export function generateEdgeMap(rows, cols) {
  // hEdges[r][c] = edge below row r, above row r+1  (+1 = tab points DOWN, -1 = tab points UP)
  const hEdges = Array.from({ length: rows - 1 }, () =>
    Array.from({ length: cols }, () => (Math.random() > 0.5 ? 1 : -1))
  )
  // vEdges[r][c] = edge right of col c, left of col c+1  (+1 = tab points RIGHT)
  const vEdges = Array.from({ length: rows }, () =>
    Array.from({ length: cols - 1 }, () => (Math.random() > 0.5 ? 1 : -1))
  )
  return { hEdges, vEdges }
}

export function getPieceEdges(edgeMap, row, col, rows, cols) {
  const { hEdges, vEdges } = edgeMap
  return {
    top:    row === 0        ? 0 : -hEdges[row - 1][col],
    bottom: row === rows - 1 ? 0 :  hEdges[row][col],
    left:   col === 0        ? 0 : -vEdges[row][col - 1],
    right:  col === cols - 1 ? 0 :  vEdges[row][col],
  }
}

// ── Jigsaw path drawing ───────────────────────────────────────────────────────
// Draws a tab or notch along the edge from (x1,y1) to (x2,y2).
// perpX/perpY = outward normal unit vector.
// edgeType: +1 = tab goes outward, -1 = notch goes inward, 0 = straight.
function addEdgePath(ctx, x1, y1, x2, y2, perpX, perpY, edgeType, nubSize) {
  if (edgeType === 0) {
    ctx.lineTo(x2, y2)
    return
  }

  const len = Math.hypot(x2 - x1, y2 - y1)
  const ex = (x2 - x1) / len
  const ey = (y2 - y1) / len
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2
  const nubW = len * 0.22
  const nubH = nubSize * edgeType

  const n1x = mx - ex * nubW,  n1y = my - ey * nubW
  const n2x = mx + ex * nubW,  n2y = my + ey * nubW
  const px  = mx + perpX * nubH
  const py  = my + perpY * nubH

  ctx.lineTo(n1x, n1y)
  ctx.bezierCurveTo(
    n1x + perpX * nubH * 0.8, n1y + perpY * nubH * 0.8,
    px  - ex * nubW * 0.5,    py  - ey * nubW * 0.5,
    px, py
  )
  ctx.bezierCurveTo(
    px  + ex * nubW * 0.5,    py  + ey * nubW * 0.5,
    n2x + perpX * nubH * 0.8, n2y + perpY * nubH * 0.8,
    n2x, n2y
  )
  ctx.lineTo(x2, y2)
}

function drawPiecePath(ctx, W, H, edges, nub) {
  ctx.beginPath()
  ctx.moveTo(0, 0)
  addEdgePath(ctx, 0, 0, W, 0,  0, -1, edges.top,    nub) // top
  addEdgePath(ctx, W, 0, W, H,  1,  0, edges.right,  nub) // right
  addEdgePath(ctx, W, H, 0, H,  0,  1, edges.bottom, nub) // bottom
  addEdgePath(ctx, 0, H, 0, 0, -1,  0, edges.left,   nub) // left
  ctx.closePath()
}

// ── Render a jigsaw piece onto a canvas ──────────────────────────────────────
export const PAD_RATIO = 0.38  // padding around cell to accommodate tabs

export function renderPiece(canvas, image, piece, rows, cols, cellW, cellH, edgeMap) {
  const pad = Math.round(Math.min(cellW, cellH) * PAD_RATIO)
  const nub = Math.min(cellW, cellH) * 0.28
  const edges = getPieceEdges(edgeMap, piece.row, piece.col, rows, cols)

  const cw = Math.round(cellW + pad * 2)
  const ch = Math.round(cellH + pad * 2)
  canvas.width  = cw
  canvas.height = ch

  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, cw, ch)

  ctx.save()
  ctx.translate(pad, pad)

  // Clipping path
  drawPiecePath(ctx, cellW, cellH, edges, nub)
  ctx.save()
  ctx.clip()

  // Image source region (including extended pad area)
  const srcW  = image.naturalWidth  / cols
  const srcH  = image.naturalHeight / rows
  const srcX  = piece.col * srcW
  const srcY  = piece.row * srcH
  const scaleX = cellW / srcW
  const scaleY = cellH / srcH
  const padSrcX = pad / scaleX
  const padSrcY = pad / scaleY

  ctx.drawImage(
    image,
    srcX - padSrcX, srcY - padSrcY,
    srcW + padSrcX * 2, srcH + padSrcY * 2,
    -pad, -pad,
    cw, ch
  )

  ctx.restore()

  // Border stroke
  drawPiecePath(ctx, cellW, cellH, edges, nub)
  ctx.strokeStyle = 'rgba(0,0,0,0.3)'
  ctx.lineWidth = 1.5
  ctx.stroke()

  ctx.restore()
}

// ── Render a rectangular piece (for print) ───────────────────────────────────
export function drawRectPiece(canvas, image, piece, rows, cols, w, h) {
  canvas.width  = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  const srcW = image.naturalWidth  / cols
  const srcH = image.naturalHeight / rows
  ctx.drawImage(image, piece.col * srcW, piece.row * srcH, srcW, srcH, 0, 0, w, h)
}

// ── Format time mm:ss ────────────────────────────────────────────────────────
export function formatTime(secs) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0')
  const s = (secs % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}
