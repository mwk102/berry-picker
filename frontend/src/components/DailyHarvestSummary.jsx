import { Link } from 'react-router-dom'

function formatGeneratedAt(value) {
  if (!value) return 'Not generated yet'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

export function DailyHarvestSummary({ summary, isLoading }) {
  if (isLoading) {
    return (
      <section className="daily-harvest-section">
        <div className="daily-harvest-skeleton" />
      </section>
    )
  }

  if (!summary) {
    return (
      <section className="daily-harvest-section">
        <span className="daily-eyebrow">Today's Harvest</span>
        <h2>Daily harvest summary has not run yet</h2>
        <p>Run <code>npm run harvest:daily</code> in the backend to generate the morning digest.</p>
      </section>
    )
  }

  return (
    <section className="daily-harvest-section">
      <div className="daily-harvest-main">
        <span className="daily-eyebrow">Today's Harvest</span>
        <h2>{summary.headline}</h2>
        <p>{summary.body}</p>
        <span className="daily-generated">Generated {formatGeneratedAt(summary.generatedAt)}</span>
      </div>

      <div className="daily-harvest-side">
        <strong>Highlights</strong>
        <ul>
          {(summary.highlights || []).slice(0, 5).map((highlight) => (
            <li key={`${highlight.type}-${highlight.title}`}>
              {highlight.farmSlug ? (
                <Link to={`/farms/${highlight.farmSlug}`}>{highlight.title}</Link>
              ) : (
                highlight.title
              )}
            </li>
          ))}
        </ul>
        {summary.recommendedFarm ? (
          <Link className="daily-recommendation" to={`/farms/${summary.recommendedFarm.slug}`}>
            <span>Recommended signal</span>
            <strong>
              {summary.recommendedCrop?.name || 'Harvest'} at {summary.recommendedFarm.name}
            </strong>
          </Link>
        ) : null}
      </div>
    </section>
  )
}
