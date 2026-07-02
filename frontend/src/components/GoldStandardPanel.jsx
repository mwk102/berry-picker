import { formatDate } from './FarmDetailUtils'

function completenessSymbol(isComplete) {
  return isComplete ? 'Yes' : 'Missing'
}

export function GoldStandardPanel({ profile }) {
  if (!profile) return null

  return (
    <section className="farm-panel gold-standard-panel">
      <div className="panel-heading">
        <h2>Gold Standard review</h2>
        <span className="confidence-score">{profile.completenessScore}% complete</span>
      </div>

      <div className="gold-standard-meta">
        <span>
          <strong>Status</strong>
          {profile.status}
        </span>
        <span>
          <strong>Last website review</strong>
          {formatDate(profile.lastResearchedAt)}
        </span>
        <span>
          <strong>Next review</strong>
          {formatDate(profile.nextReviewAt)}
        </span>
        <span>
          <strong>Sources</strong>
          {profile.sourceCount}
        </span>
      </div>

      <div className="completeness-grid">
        {(profile.completeness || []).map((item) => (
          <span className={item.complete ? 'complete' : 'missing'} key={item.key}>
            <strong>{item.label}</strong>
            {completenessSymbol(item.complete)}
          </span>
        ))}
      </div>

      {profile.lowConfidenceFields?.length ? (
        <div className="review-warning">
          <strong>Fields needing verification</strong>
          <p>{profile.lowConfidenceFields.join(', ')}</p>
        </div>
      ) : null}

      {profile.missingFields?.length ? (
        <div className="review-warning">
          <strong>Missing information</strong>
          <p>{profile.missingFields.join(', ')}</p>
        </div>
      ) : null}

      {/* TODO(automatic-website-scanner): detect farm website changes and queue this panel for review. */}
      {/* TODO(owner-portal): let verified farm owners maintain profile, hours, prices, and field status. */}
      {/* TODO(photo-uploads): support owner/community photo uploads with attribution and moderation. */}
    </section>
  )
}
