import { useState, useRef } from 'react'

const PRESETS = [
  { label: '2×2', rows: 2, cols: 2, note: 'Muy fácil' },
  { label: '3×3', rows: 3, cols: 3, note: 'Fácil' },
  { label: '4×4', rows: 4, cols: 4, note: 'Medio' },
  { label: '5×5', rows: 5, cols: 5, note: 'Difícil' },
  { label: '6×6', rows: 6, cols: 6, note: 'Experto' },
  { label: '4×6', rows: 4, cols: 6, note: 'Horizontal' },
  { label: '6×4', rows: 6, cols: 4, note: 'Vertical' },
  { label: 'Libre', rows: null, cols: null, note: 'Personalizado' },
]

function getInitialPresetIndex(config) {
  if (!config) return 3
  const presetIndex = PRESETS.findIndex(
    (preset) => preset.rows === config.rows && preset.cols === config.cols
  )
  return presetIndex === -1 ? PRESETS.length - 1 : presetIndex
}

export default function CreatePage({ initialConfig, onPlay, onPrint }) {
  const [imageDataUrl, setImageDataUrl] = useState(() => initialConfig?.imageDataUrl ?? null)
  const [imageEl, setImageEl] = useState(() => initialConfig?.imageEl ?? null)
  const [title, setTitle] = useState(() => initialConfig?.title ?? '')
  const [selectedPreset, setSelectedPreset] = useState(() => getInitialPresetIndex(initialConfig))
  const [customRows, setCustomRows] = useState(() => initialConfig?.rows ?? 4)
  const [customCols, setCustomCols] = useState(() => initialConfig?.cols ?? 4)
  const [isDragging, setIsDragging] = useState(false)
  const fileRef = useRef(null)

  const preset = PRESETS[selectedPreset]
  const rows = preset.rows ?? customRows
  const cols = preset.cols ?? customCols
  const totalPieces = rows * cols

  function loadFile(file) {
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const url = e.target.result
      setImageDataUrl(url)
      const img = new Image()
      img.onload = () => setImageEl(img)
      img.src = url
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    loadFile(e.dataTransfer.files[0])
  }

  const handlePlay = () => {
    if (!imageEl) return
    onPlay({ imageDataUrl, imageEl, title: title || 'Mi Puzzle', rows, cols })
  }

  const handlePrint = () => {
    if (!imageEl) return
    onPrint({ imageDataUrl, imageEl, title: title || 'Mi Puzzle', rows, cols })
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header className="app-header">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <rect x="2" y="2" width="12" height="12" rx="3" fill="white" opacity="0.9"/>
          <rect x="18" y="2" width="12" height="12" rx="3" fill="white" opacity="0.7"/>
          <rect x="2" y="18" width="12" height="12" rx="3" fill="white" opacity="0.7"/>
          <rect x="18" y="18" width="12" height="12" rx="3" fill="white" opacity="0.9"/>
          <circle cx="16" cy="16" r="4" fill="white"/>
        </svg>
        <h1>Puzzleando</h1>
        <span className="subtitle">Crea puzzles para tu clase · Sin backend · Gratis</span>
      </header>

      <div style={{ flex: 1, padding: '32px 24px', maxWidth: 900, margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'grid', gridTemplateColumns: imageEl ? '1fr 1fr' : '1fr', gap: 24 }}>

          {/* Left column: upload + config */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Upload */}
            <div className="card">
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
                📸 Subir imagen
              </h2>

              {!imageEl ? (
                <div
                  className={`upload-zone${isDragging ? ' drag-over' : ''}`}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileRef.current.click()}
                >
                  <svg width="48" height="48" fill="none" viewBox="0 0 48 48" style={{ display: 'block', margin: '0 auto 12px' }}>
                    <circle cx="24" cy="24" r="22" fill="currentColor" opacity="0.1"/>
                    <path d="M24 14v14M17 21l7-7 7 7M14 36h20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <p>Arrastra una imagen aquí</p>
                  <small>o haz clic para buscar · JPG, PNG, WebP, GIF</small>
                </div>
              ) : (
                <div style={{ position: 'relative' }}>
                  <img
                    src={imageDataUrl}
                    alt="preview"
                    style={{ width: '100%', borderRadius: 10, display: 'block', maxHeight: 200, objectFit: 'cover' }}
                  />
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => { setImageEl(null); setImageDataUrl(null) }}
                    style={{ position: 'absolute', top: 8, right: 8, padding: '4px 10px' }}
                  >
                    ✕ Cambiar
                  </button>
                </div>
              )}

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => loadFile(e.target.files[0])}
              />
            </div>

            {/* Title */}
            <div className="card">
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
                ✏️ Título del puzzle
              </h2>
              <input
                type="text"
                placeholder="Ej: Los animales del bosque"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={60}
              />
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                Aparecerá en la versión imprimible y en la pantalla de juego.
              </p>
            </div>

            {/* Grid size */}
            <div className="card">
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>
                🧩 Número de piezas
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>
                Selecciona la dificultad o crea una cuadrícula personalizada.
              </p>
              <div className="grid-chips">
                {PRESETS.map((p, i) => (
                  <button
                    key={i}
                    className={`grid-chip${selectedPreset === i ? ' active' : ''}`}
                    onClick={() => setSelectedPreset(i)}
                    title={p.note}
                  >
                    {p.label}
                    <br />
                    <span style={{ fontSize: 10, fontWeight: 400, opacity: 0.75 }}>{p.note}</span>
                  </button>
                ))}
              </div>

              {preset.rows === null && (
                <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                  <div style={{ flex: 1 }}>
                    <label>Filas</label>
                    <input
                      type="number" min={2} max={12}
                      value={customRows}
                      onChange={(e) => setCustomRows(Math.max(2, Math.min(12, +e.target.value)))}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label>Columnas</label>
                    <input
                      type="number" min={2} max={12}
                      value={customCols}
                      onChange={(e) => setCustomCols(Math.max(2, Math.min(12, +e.target.value)))}
                    />
                  </div>
                </div>
              )}

              <div style={{
                marginTop: 14,
                padding: '10px 14px',
                background: 'var(--primary-light)',
                borderRadius: 8,
                fontSize: 14,
                color: 'var(--primary-dark)',
                fontWeight: 600,
              }}>
                🧩 {rows} × {cols} = <strong>{totalPieces} piezas</strong>
              </div>
            </div>
          </div>

          {/* Right column: preview + actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {imageEl && (
              <>
                {/* Preview grid */}
                <div className="card">
                  <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
                    👁️ Vista previa
                  </h2>
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <img
                      src={imageDataUrl}
                      alt="preview"
                      style={{
                        width: '100%',
                        maxWidth: 360,
                        display: 'block',
                        borderRadius: 8,
                      }}
                    />
                    {/* Grid overlay */}
                    <svg
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
                      viewBox={`0 0 ${cols} ${rows}`}
                      preserveAspectRatio="none"
                    >
                      {Array.from({ length: cols - 1 }, (_, i) => (
                        <line key={`v${i}`} x1={i + 1} y1={0} x2={i + 1} y2={rows}
                          stroke="rgba(255,255,255,0.7)" strokeWidth="0.06" />
                      ))}
                      {Array.from({ length: rows - 1 }, (_, i) => (
                        <line key={`h${i}`} x1={0} y1={i + 1} x2={cols} y2={i + 1}
                          stroke="rgba(255,255,255,0.7)" strokeWidth="0.06" />
                      ))}
                    </svg>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 10 }}>
                    La imagen se dividirá en {totalPieces} piezas de jigsaw.
                  </p>
                </div>

                {/* Actions */}
                <div className="card">
                  <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
                    🚀 ¿Qué quieres hacer?
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <button className="btn btn-primary btn-lg" onClick={handlePlay} style={{ width: '100%', justifyContent: 'center' }}>
                      🎮 Jugar en pantalla
                    </button>
                    <button className="btn btn-secondary btn-lg" onClick={handlePrint} style={{ width: '100%', justifyContent: 'center' }}>
                      🖨️ Preparar para imprimir
                    </button>
                  </div>
                  <div style={{
                    marginTop: 16,
                    padding: '12px 14px',
                    background: '#f0fdf4',
                    borderRadius: 10,
                    fontSize: 13,
                    color: '#166534',
                    lineHeight: 1.6,
                  }}>
                    <strong>💡 Tips para profes:</strong><br/>
                    · <strong>Jugar en pantalla</strong> → ideal para pizarra digital o tablet.<br/>
                    · <strong>Imprimir</strong> → piezas para recortar + clave de solución.
                  </div>
                </div>
              </>
            )}

            {!imageEl && (
              <div className="card" style={{ textAlign: 'center', padding: '40px 24px', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>🧩</div>
                <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Empieza subiendo una imagen</p>
                <p style={{ fontSize: 14 }}>Cualquier foto, dibujo o imagen educativa.<br/>Funciona sin internet después de cargar.</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
