import { formatDate, getLatestReport, seasonProgressPercent } from './FarmDetailUtils'

const unavailableConditions = new Set(['CLOSED', 'PICKED_OVER', 'SEASON_OVER'])

function getTimelineState(farmCrop) {
  const latestReport = getLatestReport(farmCrop.reports)
  const latestCondition = latestReport?.condition

  if (unavailableConditions.has(latestCondition)) {
    return {
      className: 'unavailable',
      label: latestCondition === 'PICKED_OVER' ? 'Picked over' : 'Unavailable',
      showToday: false,
    }
  }

  if (farmCrop.stage === 'COMING_SOON') {
    return {
      className: 'upcoming',
      label: `Starts ${formatDate(farmCrop.seasonStartDate)}`,
      showToday: false,
    }
  }

  if (farmCrop.stage === 'ENDED') {
    return {
      className: 'unavailable',
      label: 'Season ended',
      showToday: false,
    }
  }

  if (farmCrop.stage === 'UNKNOWN') {
    return {
      className: 'unknown',
      label: 'No season window',
      showToday: false,
    }
  }

  return {
    className: 'active',
    label: 'In season window',
    showToday: true,
  }
}

export function HarvestTimeline({ cropStatuses }) {
  return (
    <section className="farm-panel harvest-timeline-panel">
      <div className="panel-heading">
        <h2>Harvest timeline</h2>
      </div>

      <div className="harvest-timeline-list">
        {cropStatuses.map((farmCrop) => {
          const timelineState = getTimelineState(farmCrop)

          return (
            <article
              className={`harvest-timeline-row ${timelineState.className}`}
              key={farmCrop.id}
            >
              <div className="timeline-row-header">
                <span>
                  <strong>{farmCrop.name}</strong>
                  <span>
                    {formatDate(farmCrop.seasonStartDate)} - {formatDate(farmCrop.seasonEndDate)}
                  </span>
                </span>
                <em>{timelineState.label}</em>
              </div>
              <div className="timeline-track" aria-label={`${farmCrop.name} seasonal progress`}>
                <span className="timeline-label start">Beginning</span>
                <span className="timeline-label peak">Peak</span>
                <span className="timeline-label end">Ending</span>
                {timelineState.showToday ? (
                  <i style={{ left: `${seasonProgressPercent(farmCrop)}%` }}>Today</i>
                ) : null}
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
