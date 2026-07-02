import { StatusBadge } from './StatusBadge'

function freshnessText(confidence) {
  if (confidence.freshness === null) return 'No recent reports yet'
  if (confidence.freshness === 0) return 'Updated today'
  return `Latest report ${confidence.freshness}d old`
}

function worthLabel(score) {
  if (score >= 80) return 'Strong trip signal'
  if (score >= 60) return 'Worth considering'
  if (score >= 35) return 'Check before driving'
  return 'Needs more data'
}

export function FarmStatusPanel({ confidence, cropStatuses, farm, worthTheDrive }) {
  return (
    <section className="farm-panel status-panel">
      <div className="panel-heading">
        <h2>Today at a glance</h2>
        <StatusBadge status={farm.status === 'ACTIVE' ? 'Open' : 'Unknown'} />
      </div>

      <div className="status-answer-grid">
        <span>
          <strong>Is it open?</strong>
          {farm.status === 'ACTIVE' ? 'Likely open, confirm before visiting' : 'Unknown'}
        </span>
        <span>
          <strong>What can I pick?</strong>
          {cropStatuses.length > 0
            ? cropStatuses.map((crop) => crop.name).join(', ')
            : 'No crop data yet'}
        </span>
        <span>
          <strong>How fresh is this?</strong>
          {freshnessText(confidence)}
        </span>
        <span>
          <strong>Worth the drive?</strong>
          {worthLabel(worthTheDrive.score)} - {worthTheDrive.score}/100
        </span>
      </div>

      <div className="worth-drive-reasons">
        <strong>Reasons</strong>
        <ul>
          {worthTheDrive.reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      </div>
    </section>
  )
}
