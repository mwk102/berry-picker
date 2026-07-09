import { Link } from 'react-router-dom'
import { formatDistance } from '../utils/distance'
import { BerryChip } from './BerryChip'
import { StatusBadge } from './StatusBadge'

export function FarmCard({ farm, isSelected, onSelect }) {
  const cardClassName = [
    'farm-card',
    isSelected ? 'selected' : '',
    farm.isUnverifiedCandidate ? 'unverified' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <article className={cardClassName}>
      <Link
        aria-current={isSelected ? 'true' : undefined}
        className="farm-card-link"
        onFocus={() => onSelect(farm)}
        onMouseEnter={() => onSelect(farm)}
        to={`/farms/${farm.slug}`}
      >
        <span className="farm-card-topline">
          <span className="farm-city">{farm.city}</span>
          <span className="farm-distance">
            {formatDistance(farm.distanceMiles)}
          </span>
          <StatusBadge status={farm.status} />
        </span>

        {/* TODO(admin-review): add approve/reject/edit/mark-verified controls here. */}
        {farm.isUnverifiedCandidate ? (
          <span className="candidate-review-block">
            <span className="candidate-badge">Unverified candidate</span>
            <span className="candidate-source">Source: {farm.sourceLabel}</span>
            <span className="candidate-warning">
              Needs review before public launch.
            </span>
          </span>
        ) : null}

        <span className="farm-card-name">{farm.name}</span>
        <span className="farm-card-description">{farm.description}</span>

        <span className={`picking-summary-chip ${farm.pickingSummary?.status || 'unknown'}`}>
          <strong>{farm.pickingSummary?.label || 'Current picking status'}</strong>
          <span>{farm.pickingSummary?.detail || 'Needs a current check'}</span>
        </span>

        <span className="berry-chip-list" aria-label={`${farm.name} crop types`}>
          {farm.cropPriceRows.map((cropRow) => (
            <span
              className={`finder-crop-status ${cropRow.availability?.status || 'unknown'}`}
              key={cropRow.cropSlug || cropRow.cropName}
            >
              <BerryChip crop={cropRow.crop}>{cropRow.cropName}</BerryChip>
              {cropRow.availability?.label ? <em>{cropRow.availability.label}</em> : null}
              {cropRow.availabilityDetails?.label ? (
                <small>{cropRow.availabilityDetails.label}</small>
              ) : null}
            </span>
          ))}
        </span>

        <span className="farm-meta-grid">
          <span>
            <strong>Prices</strong>
            <span className="farm-price-summary">{farm.priceSummaryLabel}</span>
          </span>
          <span>
            <strong>Season</strong>
            {farm.season}
          </span>
        </span>
        <span className="finder-price-list" aria-label={`${farm.name} crop prices`}>
          {farm.cropPriceRows.slice(0, 3).map((priceRow) => (
            <span
              className={priceRow.hasPrice ? 'finder-price-chip' : 'finder-price-chip unavailable'}
              key={priceRow.cropSlug || priceRow.cropName}
            >
              <span>
                {priceRow.cropName}
                {priceRow.availability?.status === 'unavailable' ? (
                  <em>{priceRow.availability.label}</em>
                ) : null}
              </span>
              <strong>{priceRow.label}</strong>
            </span>
          ))}
        </span>
      </Link>
    </article>
  )
}
