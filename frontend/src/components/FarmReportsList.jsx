import { formatDateTime, reportFreshnessDays } from './FarmDetailUtils'

function isUnknown(value) {
  return !value || value === 'UNKNOWN'
}

function formatEnumLabel(value) {
  if (!value) return 'Unknown'
  return value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function reportConditionLabel(report) {
  const parts = []

  if (!isUnknown(report.condition)) {
    parts.push(formatEnumLabel(report.condition))
  }
  if (!isUnknown(report.crowdLevel)) {
    parts.push(`Crowd ${formatEnumLabel(report.crowdLevel)}`)
  }

  return parts.join(' - ')
}

export function FarmReportsList({ reports }) {
  return (
    <section className="farm-panel">
      <div className="panel-heading">
        <h2>Recent picking reports</h2>
      </div>

      {reports.length === 0 ? (
        <p className="panel-muted">No recent picking reports yet.</p>
      ) : (
        <div className="farm-reports-list">
          {reports.map((report) => {
            const freshness = reportFreshnessDays(report)
            const conditionLabel = reportConditionLabel(report)

            return (
              <article className="farm-report" key={report.id}>
                <div className="farm-report-header">
                  <strong>{report.crop?.name || formatEnumLabel(report.condition)}</strong>
                  {conditionLabel ? (
                    <span className="report-condition">{conditionLabel}</span>
                  ) : null}
                </div>
                {report.comment ? <p>{report.comment}</p> : null}
                <span className="report-meta">
                  {formatEnumLabel(report.source)} - {formatDateTime(report.createdAt)}
                  {freshness === null ? '' : ` - ${freshness}d old`}
                </span>
                {report.sourceUrl ? (
                  <a className="report-source-link" href={report.sourceUrl} rel="noreferrer" target="_blank">
                    Source reviewed by {formatEnumLabel(report.verificationMethod || 'manual review')}
                  </a>
                ) : null}
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
