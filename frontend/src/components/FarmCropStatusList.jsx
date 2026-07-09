import { BerryChip } from './BerryChip'
import { SeasonStageBadge } from './SeasonStageBadge'
import { formatDate, formatPrice, getLatestPrice, getLatestReport, reportFreshnessDays } from './FarmDetailUtils'

function formatReportCondition(value) {
  return value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function reportText(report) {
  if (!report) return 'No recent report'
  if (!report.condition || report.condition === 'UNKNOWN') return 'No confirmed condition'
  const freshness = reportFreshnessDays(report)
  return `${formatReportCondition(report.condition)}${freshness === null ? '' : ` - ${freshness}d old`}`
}

function currentBadgeStage(farmCrop, latestReport) {
  if (!latestReport?.condition || latestReport.condition === 'UNKNOWN') return farmCrop.stage

  const reportStageMap = {
    EXCELLENT: farmCrop.stage,
    GOOD: farmCrop.stage,
    LIMITED: 'LIMITED',
    PICKED_OVER: 'UNAVAILABLE',
    CLOSED: 'UNAVAILABLE',
    SEASON_OVER: 'ENDED',
    COMING_SOON: 'COMING_SOON',
  }

  return reportStageMap[latestReport.condition] || farmCrop.stage
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
              <div className="farm-crop-status-main">
                <BerryChip crop={farmCrop.crop}>{farmCrop.name}</BerryChip>
                <strong>{farmCrop.name}</strong>
                <span>
                  {formatDate(farmCrop.seasonStartDate)} - {formatDate(farmCrop.seasonEndDate)}
                </span>
                {farmCrop.availabilityDetails?.label ? (
                  <span className="crop-availability-details">
                    Available now: {farmCrop.availabilityDetails.label}
                  </span>
                ) : null}
              </div>
              <SeasonStageBadge stage={currentBadgeStage(farmCrop, latestReport)} />
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
