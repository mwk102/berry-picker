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
      <button
        aria-pressed={isSelected}
        className="farm-card-button"
        onClick={() => onSelect(farm)}
        type="button"
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

        <span className="berry-chip-list" aria-label={`${farm.name} crop types`}>
          {farm.berryTypes.map((berryType) => (
            <BerryChip key={berryType}>{berryType}</BerryChip>
          ))}
        </span>

        <span className="farm-meta-grid">
          <span>
            <strong>Price</strong>
            {farm.priceLabel}
          </span>
          <span>
            <strong>Season</strong>
            {farm.season}
          </span>
        </span>
      </button>
    </article>
  )
}
