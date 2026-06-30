import { formatDistance } from '../utils/distance'
import { BerryChip } from './BerryChip'
import { StatusBadge } from './StatusBadge'

export function FarmCard({ farm, isSelected, onSelect }) {
  const price = `$${farm.pricePerPound.toFixed(2)}/lb`

  return (
    <article className={isSelected ? 'farm-card selected' : 'farm-card'}>
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

        <span className="farm-card-name">{farm.name}</span>
        <span className="farm-card-description">{farm.description}</span>

        <span className="berry-chip-list" aria-label={`${farm.name} berry types`}>
          {farm.berryTypes.map((berryType) => (
            <BerryChip key={berryType}>{berryType}</BerryChip>
          ))}
        </span>

        <span className="farm-meta-grid">
          <span>
            <strong>Price</strong>
            {price}
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
