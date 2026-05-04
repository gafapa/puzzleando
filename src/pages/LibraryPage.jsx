function LibraryEmptyIcon() {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true">
      <rect x="4" y="4" width="48" height="48" rx="16" fill="url(#libraryEmptyGradient)" />
      <path
        d="M19 17h9.5c1.7 0 3 1.3 3 3v2.1a2.6 2.6 0 1 0 5.2 0V20c0-1.7 1.3-3 3-3H37c1.7 0 3 1.3 3 3v16c0 1.7-1.3 3-3 3h-4.2a2.6 2.6 0 1 0 0 5.2H37c1.7 0 3-1.3 3-3"
        stroke="white"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19 17c-1.7 0-3 1.3-3 3v4.2a2.6 2.6 0 1 0 5.2 0V20c0-1.7-1.3-3-3-3Z"
        fill="white"
        fillOpacity="0.18"
      />
      <defs>
        <linearGradient id="libraryEmptyGradient" x1="6" y1="8" x2="48" y2="50" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7c3aed" />
          <stop offset="1" stopColor="#2563eb" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export default function LibraryPage({
  puzzles,
  t,
  onCreate,
  onEdit,
  onPlay,
  onPrint,
  onDelete,
}) {
  return (
    <main className="library-page">
      <section className="library-hero">
        <div>
          <h2>{t('libraryTitle')}</h2>
          <p>{t('librarySubtitle')}</p>
        </div>
        <button className="btn btn-primary btn-lg" onClick={onCreate}>
          + {t('newPuzzle')}
        </button>
      </section>

      {puzzles.length === 0 ? (
        <section className="library-empty">
          <div className="library-empty-icon">
            <LibraryEmptyIcon />
          </div>
          <h3>{t('emptyLibraryTitle')}</h3>
          <p>{t('emptyLibraryText')}</p>
          <button className="btn btn-primary" onClick={onCreate}>
            {t('createFirstPuzzle')}
          </button>
        </section>
      ) : (
        <section className="puzzle-library-grid" aria-label={t('libraryTitle')}>
          {puzzles.map((puzzle) => (
            <article className="puzzle-card" key={puzzle.id}>
              <button className="puzzle-card-preview" onClick={() => onEdit(puzzle)}>
                <img src={puzzle.imageDataUrl} alt={puzzle.title} />
              </button>
              <div className="puzzle-card-body">
                <div>
                  <h3>{puzzle.title}</h3>
                  <p>
                    {puzzle.rows} × {puzzle.cols} · {puzzle.rows * puzzle.cols} {t('pieces')}
                  </p>
                </div>
                <small>{t('updatedAt', { date: new Date(puzzle.updatedAt).toLocaleDateString() })}</small>
                <div className="puzzle-card-actions">
                  <button className="btn btn-primary btn-sm" onClick={() => onEdit(puzzle)}>
                    {t('edit')}
                  </button>
                  <button className="btn btn-outline btn-sm" onClick={() => onPlay(puzzle)}>
                    {t('playOnScreen')}
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => onPrint(puzzle)}>
                    {t('print')}
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => onDelete(puzzle.id)}>
                    {t('delete')}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  )
}
