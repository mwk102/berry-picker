function freshnessText(freshness) {
  if (freshness === null) return 'No report freshness yet'
  if (freshness === 0) return 'Fresh today'
  return `${freshness} days since latest report`
}

export function FarmConfidencePanel({ confidence }) {
  return (
    <section className="farm-panel confidence-panel">
      <div className="panel-heading">
        <h2>Confidence</h2>
        <span className="confidence-score">{confidence.score}/100</span>
      </div>

      <div className="confidence-breakdown">
        <span>
          <strong>{confidence.sourceCount}</strong>
          Sources
        </span>
        <span>
          <strong>{confidence.verifiedDataCount}</strong>
          Verified data points
        </span>
        <span>
          <strong>{confidence.recentReportCount}</strong>
          Recent reports
        </span>
        <span>
          <strong>{freshnessText(confidence.freshness)}</strong>
          Freshness
        </span>
      </div>
    </section>
  )
}
