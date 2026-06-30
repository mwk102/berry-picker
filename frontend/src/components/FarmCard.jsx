export function FarmCard({ farm, isSelected, onSelect }) {
  const berrySummary = farm.berryTypes.join(', ')
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
          <span className={`farm-status ${farm.status.toLowerCase()}`}>
            {farm.status}
          </span>
        </span>

        <span className="farm-card-name">{farm.name}</span>
        <span className="farm-card-description">{farm.description}</span>

        <span className="farm-meta-grid">
          <span>
            <strong>Berries</strong>
            {berrySummary}
          </span>
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
