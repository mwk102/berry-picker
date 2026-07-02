import { BerryChip } from './BerryChip'
import { SeasonStageBadge } from './SeasonStageBadge'
import { formatDate, formatPrice, getLatestPrice, getLatestReport, reportFreshnessDays } from './FarmDetailUtils'

function reportText(report) {
  if (!report) return 'No recent report'
  const freshness = reportFreshnessDays(report)
  return `${report.condition}${freshness === null ? '' : ` · ${freshness}d old`}`
}

export function FarmCropStatusList({ cropStatuses }) {
  return (
    <section className="farm-panel">
      <div className="panel-heading">
        <h2>Crop status</h2>
      </div>

      <div className="farm-crop-status-list">
        {cropStatuses.map((farmCrop) => {
          const latestPrice = getLatestPrice(farmCrop.prices)
          const latestReport = getLatestReport(farmCrop.reports)

          return (
            <article className="farm-crop-status" key={farmCrop.id}>
              <div>
                <BerryChip>{farmCrop.name}</BerryChip>
                <strong>{farmCrop.name}</strong>
                <span>
                  {formatDate(farmCrop.seasonStartDate)} - {formatDate(farmCrop.seasonEndDate)}
                </span>
              </div>
              <SeasonStageBadge stage={farmCrop.stage} />
              <span>{reportText(latestReport)}</span>
              <span>{formatPrice(latestPrice)}</span>
              <span>Confidence {farmCrop.confidenceScore}/100</span>
            </article>
          )
        })}
      </div>
    </section>
  )
}
