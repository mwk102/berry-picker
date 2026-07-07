import { StatusBadge } from './StatusBadge'
import { farmFreshnessSummary, isCurrentlyPickable } from './FarmDetailUtils'

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

function pickableText(cropStatuses) {
  const pickable = cropStatuses.filter((crop) => isCurrentlyPickable(crop))
  const upcoming = cropStatuses.filter((crop) => crop.stage === 'COMING_SOON')
  const ended = cropStatuses.filter((crop) => crop.latestReport?.condition === 'SEASON_OVER')

  if (pickable.length > 0) {
    const names = pickable.map((crop) => crop.name).join(', ')
    const suffix = upcoming.length > 0 ? `; ${upcoming.map((crop) => crop.name).join(', ')} coming soon` : ''
    return `${names}${suffix}`
  }

  if (upcoming.length > 0) {
    return `${upcoming.map((crop) => crop.name).join(', ')} coming soon`
  }

  if (ended.length > 0) {
    return `${ended.map((crop) => crop.name).join(', ')} over for the season`
  }

  return 'No current crop data yet'
}

export function FarmStatusPanel({ confidence, cropStatuses, farm, worthTheDrive }) {
  const freshness = farmFreshnessSummary(farm)

  return (
    <section className="farm-panel status-panel">
      <div className="panel-heading">
        <h2>Today at a glance</h2>
        <StatusBadge status={farm.status === 'ACTIVE' ? 'Open' : 'Unknown'} />
      </div>

      <div className="status-answer-grid">
        <span>
          <strong>Is it open?</strong>
          {farm.status === 'ACTIVE'
            ? 'Listed open, but crop availability can change quickly'
            : 'Unknown'}
        </span>
        <span>
          <strong>What can I pick?</strong>
          {pickableText(cropStatuses)}
        </span>
        <span>
          <strong>How fresh is this?</strong>
          {freshness.label} - {freshness.detail || freshnessText(confidence)}
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
