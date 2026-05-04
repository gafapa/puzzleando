import { useRef, useState } from 'react'
import { CONNECTOR_TYPES, createEdgeSeed } from '../utils/puzzleUtils'

const PRESETS = [
  { label: '2x2', rows: 2, cols: 2, noteKey: 'difficultyVeryEasy' },
  { label: '3x3', rows: 3, cols: 3, noteKey: 'difficultyEasy' },
  { label: '4x4', rows: 4, cols: 4, noteKey: 'difficultyMedium' },
  { label: '5x5', rows: 5, cols: 5, noteKey: 'difficultyHard' },
  { label: '6x6', rows: 6, cols: 6, noteKey: 'difficultyExpert' },
  { label: '4x6', rows: 4, cols: 6, noteKey: 'horizontal' },
  { label: '6x4', rows: 6, cols: 4, noteKey: 'vertical' },
  { labelKey: 'free', rows: null, cols: null, noteKey: 'custom' },
]

const PLAY_DIFFICULTY_OPTIONS = [
  { value: 'easy', labelKey: 'easyMode', noteKey: 'easyModeHelp' },
  { value: 'hard', labelKey: 'hardMode', noteKey: 'hardModeHelp' },
]

function getInitialPresetIndex(config) {
  if (!config) return 3

  const presetIndex = PRESETS.findIndex(
    (preset) => preset.rows === config.rows && preset.cols === config.cols
  )

  return presetIndex === -1 ? PRESETS.length - 1 : presetIndex
}

function getConnectorLabelKey(connectorType) {
  return `connector${connectorType.charAt(0).toUpperCase()}${connectorType.slice(1)}`
}

export default function CreatePage({ initialConfig, t, onBack, onSave, onPlay, onPrint }) {
  const [imageDataUrl, setImageDataUrl] = useState(() => initialConfig?.imageDataUrl ?? null)
  const [imageEl, setImageEl] = useState(() => initialConfig?.imageEl ?? null)
  const [title, setTitle] = useState(() => initialConfig?.title ?? '')
  const [selectedPreset, setSelectedPreset] = useState(() => getInitialPresetIndex(initialConfig))
  const [customRows, setCustomRows] = useState(() => initialConfig?.rows ?? 4)
  const [customCols, setCustomCols] = useState(() => initialConfig?.cols ?? 4)
  const [connectorType, setConnectorType] = useState(
    () => initialConfig?.connectorType ?? 'classic'
  )
  const [playDifficulty, setPlayDifficulty] = useState(
    () => initialConfig?.playDifficulty ?? 'easy'
  )
  const [isDragging, setIsDragging] = useState(false)
  const fileRef = useRef(null)

  const preset = PRESETS[selectedPreset]
  const rows = preset.rows ?? customRows
  const cols = preset.cols ?? customCols
  const totalPieces = rows * cols

  function loadFile(file) {
    if (!file || !file.type.startsWith('image/')) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const url = event.target.result
      setImageDataUrl(url)

      const image = new Image()
      image.onload = () => setImageEl(image)
      image.src = url
    }

    reader.readAsDataURL(file)
  }

  function buildConfig() {
    const reusesSavedEdges =
      initialConfig?.edgeSeed &&
      initialConfig.rows === rows &&
      initialConfig.cols === cols

    return {
      ...initialConfig,
      imageDataUrl,
      imageEl,
      title: title.trim() || t('defaultTitle'),
      rows,
      cols,
      edgeSeed: reusesSavedEdges ? initialConfig.edgeSeed : createEdgeSeed(),
      connectorType,
      playDifficulty,
    }
  }

  function handleSave() {
    if (!imageEl) return
    onSave(buildConfig())
  }

  function handlePlay() {
    if (!imageEl) return
    onPlay(buildConfig())
  }

  function handlePrint() {
    if (!imageEl) return
    onPrint(buildConfig())
  }

  return (
    <main className="editor-page">
      <div className="editor-shell">
        <div className="editor-toolbar">
          <button className="btn btn-ghost btn-sm" onClick={onBack}>
            {t('backToLibrary')}
          </button>
          <button className="btn btn-success btn-sm" onClick={handleSave} disabled={!imageEl}>
            {t('savePuzzle')}
          </button>
        </div>

        <div className={`editor-layout${imageEl ? ' has-preview' : ''}`}>
          <div className="editor-column">
            <section className="card card-section">
              <div className="section-heading">
                <span className="section-kicker">{t('puzzleTitle')}</span>
                <h2>{t('defaultTitle')}</h2>
              </div>
              <input
                type="text"
                placeholder={t('titlePlaceholder')}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={60}
              />
              <p className="section-help">{t('titleHelp')}</p>
            </section>

            <section className="card card-section">
              <div className="section-heading">
                <span className="section-kicker">{t('uploadImage')}</span>
                <h2>{t('preview')}</h2>
              </div>

              {!imageEl ? (
                <div
                  className={`upload-zone${isDragging ? ' drag-over' : ''}`}
                  onDragOver={(event) => {
                    event.preventDefault()
                    setIsDragging(true)
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(event) => {
                    event.preventDefault()
                    setIsDragging(false)
                    loadFile(event.dataTransfer.files[0])
                  }}
                  onClick={() => fileRef.current?.click()}
                >
                  <svg
                    width="48"
                    height="48"
                    fill="none"
                    viewBox="0 0 48 48"
                    style={{ display: 'block', margin: '0 auto 12px' }}
                  >
                    <circle cx="24" cy="24" r="22" fill="currentColor" opacity="0.1" />
                    <path
                      d="M24 14v14M17 21l7-7 7 7M14 36h20"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <p>{t('dropImage')}</p>
                  <small>{t('browseImage')}</small>
                </div>
              ) : (
                <div className="editor-image-preview">
                  <img
                    src={imageDataUrl}
                    alt="preview"
                    className="editor-upload-preview-image"
                  />
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      setImageEl(null)
                      setImageDataUrl(null)
                    }}
                    style={{ position: 'absolute', top: 12, right: 12, padding: '4px 10px' }}
                  >
                    {t('changeImage')}
                  </button>
                </div>
              )}

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(event) => loadFile(event.target.files[0])}
              />
            </section>

            <section className="card card-section">
              <div className="section-heading">
                <span className="section-kicker">{t('pieceCount')}</span>
                <h2>{rows} × {cols}</h2>
              </div>
              <p className="section-help">{t('pieceCountHelp')}</p>

              <div className="grid-chips">
                {PRESETS.map((item, index) => (
                  <button
                    key={`${item.rows ?? 'free'}-${item.cols ?? 'free'}`}
                    className={`grid-chip${selectedPreset === index ? ' active' : ''}`}
                    onClick={() => setSelectedPreset(index)}
                    title={t(item.noteKey)}
                  >
                    {item.labelKey ? t(item.labelKey) : item.label}
                    <br />
                    <span style={{ fontSize: 10, fontWeight: 400, opacity: 0.75 }}>
                      {t(item.noteKey)}
                    </span>
                  </button>
                ))}
              </div>

              {preset.rows === null && (
                <div className="editor-grid-inputs">
                  <div>
                    <label>{t('rows')}</label>
                    <input
                      type="number"
                      min={2}
                      max={12}
                      value={customRows}
                      onChange={(event) =>
                        setCustomRows(Math.max(2, Math.min(12, Number(event.target.value) || 2)))
                      }
                    />
                  </div>
                  <div>
                    <label>{t('columns')}</label>
                    <input
                      type="number"
                      min={2}
                      max={12}
                      value={customCols}
                      onChange={(event) =>
                        setCustomCols(Math.max(2, Math.min(12, Number(event.target.value) || 2)))
                      }
                    />
                  </div>
                </div>
              )}

              <div className="editor-summary-badge">
                {rows} × {cols} = <strong>{totalPieces} {t('pieces')}</strong>
              </div>
            </section>

            <section className="card card-section">
              <div className="section-heading">
                <span className="section-kicker">{t('connectorType')}</span>
                <h2>{t('connectorType')}</h2>
              </div>
              <p className="section-help">{t('connectorTypeHelp')}</p>
              <div
                className="grid-chips"
                style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}
              >
                {CONNECTOR_TYPES.map((type) => (
                  <button
                    key={type}
                    className={`grid-chip${connectorType === type ? ' active' : ''}`}
                    onClick={() => setConnectorType(type)}
                  >
                    {t(getConnectorLabelKey(type))}
                  </button>
                ))}
              </div>
            </section>

            <section className="card card-section">
              <div className="section-heading">
                <span className="section-kicker">{t('difficultyMode')}</span>
                <h2>{t('playDifficultyTitle')}</h2>
              </div>
              <p className="section-help">{t('playDifficultyHelp')}</p>
              <div
                className="grid-chips"
                style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}
              >
                {PLAY_DIFFICULTY_OPTIONS.map((item) => (
                  <button
                    key={item.value}
                    className={`grid-chip${playDifficulty === item.value ? ' active' : ''}`}
                    onClick={() => setPlayDifficulty(item.value)}
                    title={t(item.noteKey)}
                  >
                    {t(item.labelKey)}
                    <br />
                    <span style={{ fontSize: 10, fontWeight: 400, opacity: 0.75 }}>
                      {t(item.noteKey)}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          </div>

          <div className="editor-column">
            {imageEl && (
              <>
                <section className="card card-section editor-preview-card">
                  <div className="section-heading">
                    <span className="section-kicker">{t('preview')}</span>
                    <h2>{title.trim() || t('defaultTitle')}</h2>
                  </div>

                  <div className="editor-board-preview">
                    <img
                      src={imageDataUrl}
                      alt="preview"
                      className="editor-board-preview-image"
                    />
                    <svg
                      className="editor-board-preview-grid"
                      viewBox={`0 0 ${cols} ${rows}`}
                      preserveAspectRatio="xMidYMid meet"
                    >
                      {Array.from({ length: cols - 1 }, (_, index) => (
                        <line
                          key={`v${index}`}
                          x1={index + 1}
                          y1={0}
                          x2={index + 1}
                          y2={rows}
                          stroke="rgba(255,255,255,0.7)"
                          strokeWidth="0.06"
                        />
                      ))}
                      {Array.from({ length: rows - 1 }, (_, index) => (
                        <line
                          key={`h${index}`}
                          x1={0}
                          y1={index + 1}
                          x2={cols}
                          y2={index + 1}
                          stroke="rgba(255,255,255,0.7)"
                          strokeWidth="0.06"
                        />
                      ))}
                    </svg>
                  </div>

                  <p className="section-help" style={{ marginTop: 14 }}>
                    {t('previewHelp', { count: totalPieces })}
                  </p>
                </section>

                <section className="card card-section editor-actions-card">
                  <div className="section-heading">
                    <span className="section-kicker">{t('actionsTitle')}</span>
                    <h2>{t(playDifficulty === 'easy' ? 'easyMode' : 'hardMode')}</h2>
                  </div>
                  <p className="section-help">
                    {t(playDifficulty === 'easy' ? 'easyModeHelp' : 'hardModeHelp')}
                  </p>
                  <div className="editor-actions-stack">
                    <button
                      className="btn btn-primary btn-lg"
                      onClick={handlePlay}
                      style={{ width: '100%', justifyContent: 'center' }}
                    >
                      {t('playOnScreen')}
                    </button>
                    <button
                      className="btn btn-secondary btn-lg"
                      onClick={handlePrint}
                      style={{ width: '100%', justifyContent: 'center' }}
                    >
                      {t('preparePrint')}
                    </button>
                  </div>
                </section>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
