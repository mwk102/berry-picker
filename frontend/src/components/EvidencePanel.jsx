import { formatDate } from './FarmDetailUtils'

function statusClassName(status) {
  return `evidence-status ${String(status || 'fresh').replace(/\s+/g, '-')}`
}

function isExternalUrl(value) {
  return /^https?:\/\//i.test(value || '')
}

export function EvidencePanel({ evidence = [] }) {
  return (
    <details className="farm-panel evidence-panel">
      <summary className="panel-heading evidence-summary">
        <h2>Evidence</h2>
        <span className="evidence-summary-actions">
          <span className="confidence-score">{evidence.length} records</span>
          <span className="evidence-disclosure-label" aria-hidden="true">
            Show
          </span>
        </span>
      </summary>

      {evidence.length === 0 ? (
        <p className="panel-muted">No evidence records yet.</p>
      ) : (
        <div className="evidence-list">
          {evidence.map((record) => (
            <article className="evidence-row" key={record.id}>
              <div className="evidence-row-header">
                <span>
                  <strong>{record.evidenceType}</strong>
                  {record.fieldName}
                </span>
                <span className={statusClassName(record.status)}>{record.status}</span>
              </div>

              <p>{record.value}</p>

              <div className="evidence-meta-grid">
                <span>
                  <strong>Source</strong>
                  {isExternalUrl(record.sourceUrl) ? (
                    <a href={record.sourceUrl} rel="noreferrer" target="_blank">
                      {record.sourceName}
                    </a>
                  ) : (
                    record.sourceName
                  )}
                </span>
                <span>
                  <strong>Confidence</strong>
                  {record.confidenceScore}/100
                </span>
                <span>
                  <strong>Observed</strong>
                  {formatDate(record.observedAt)}
                </span>
                <span>
                  <strong>Expires</strong>
                  {formatDate(record.expiresAt)}
                </span>
                <span>
                  <strong>Verified</strong>
                  {formatDate(record.verifiedAt)}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* TODO(auth-required): move this into a protected admin review surface. */}
    </details>
  )
}
