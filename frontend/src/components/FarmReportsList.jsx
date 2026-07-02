import { formatDateTime, reportFreshnessDays } from './FarmDetailUtils'

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
            return (
              <article className="farm-report" key={report.id}>
                <div>
                  <strong>{report.crop?.name || report.condition}</strong>
                  <span>
                    {report.condition} - {report.crowdLevel}
                  </span>
                </div>
                {report.comment ? <p>{report.comment}</p> : null}
                <span>
                  {report.source} - {formatDateTime(report.createdAt)}
                  {freshness === null ? '' : ` - ${freshness}d old`}
                </span>
                {report.sourceUrl ? (
                  <a href={report.sourceUrl} rel="noreferrer" target="_blank">
                    Source reviewed by {report.verificationMethod || 'manual review'}
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
