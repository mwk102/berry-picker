import { Link } from 'react-router-dom'
import { ConfidenceBadge } from './ConfidenceBadge'
import { FreshnessIndicator } from './FreshnessIndicator'
import { HarvestMetric } from './HarvestMetric'
import { SeasonStageBadge } from './SeasonStageBadge'

const cropIcons = {
  blueberry: 'B',
  strawberry: 'S',
  raspberry: 'R',
  blackberry: 'B',
  apple: 'A',
  cherry: 'C',
  pumpkin: 'P',
  sunflower: 'S',
  lavender: 'L',
  'corn-maze': 'C',
  'christmas-tree': 'T',
}

function formatPrice(price) {
  if (typeof price !== 'number') return 'Unknown'
  return `$${price.toFixed(2)} avg`
}

export function HarvestCropCard({ summary }) {
  const crop = summary.crop
  const iconLabel = cropIcons[crop.slug] || crop.name.slice(0, 1)

  return (
    <article className="harvest-crop-card">
      <div className="crop-card-header">
        <span className="crop-icon" aria-hidden="true">
          {iconLabel}
        </span>
        <div>
          <h2>{crop.name}</h2>
          <SeasonStageBadge stage={summary.seasonStage} />
        </div>
      </div>

      <div className="harvest-metrics">
        <HarvestMetric label="Active farms" value={summary.activeFarmCount} />
        <HarvestMetric label="Average price" value={formatPrice(summary.averagePrice)} />
        <HarvestMetric label="Best region" value={summary.bestRegion || 'Unknown'} />
      </div>

      <div className="crop-card-footer">
        <ConfidenceBadge score={summary.confidence} />
        <FreshnessIndicator
          calculatedAt={summary.calculatedAt}
          reportFreshness={summary.reportFreshness}
        />
      </div>

      {/* TODO(crop-detail-pages): replace this with a crop detail route once Harvest Radar crop pages exist. */}
      <Link className="view-farms-link" to={`/farms?crop=${crop.slug}`}>
        View farms
      </Link>
    </article>
  )
}
