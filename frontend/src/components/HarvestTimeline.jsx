import { formatDate, seasonProgressPercent } from './FarmDetailUtils'

export function HarvestTimeline({ cropStatuses }) {
  return (
    <section className="farm-panel harvest-timeline-panel">
      <div className="panel-heading">
        <h2>Harvest timeline</h2>
      </div>

      <div className="harvest-timeline-list">
        {cropStatuses.map((farmCrop) => (
          <article className="harvest-timeline-row" key={farmCrop.id}>
            <div>
              <strong>{farmCrop.name}</strong>
              <span>
                {formatDate(farmCrop.seasonStartDate)} - {formatDate(farmCrop.seasonEndDate)}
              </span>
            </div>
            <div className="timeline-track" aria-label={`${farmCrop.name} seasonal progress`}>
              <span className="timeline-label start">Beginning</span>
              <span className="timeline-label peak">Peak</span>
              <span className="timeline-label end">Ending</span>
              <i style={{ left: `${seasonProgressPercent(farmCrop)}%` }}>Today</i>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
