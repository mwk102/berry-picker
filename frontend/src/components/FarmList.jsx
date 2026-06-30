import { FarmCard } from './FarmCard'

export function FarmList({ farms, selectedFarm, onSelectFarm }) {
  if (farms.length === 0) {
    return (
      <div className="empty-state">
        <strong>No farms found</strong>
        <p>Try widening the radius, raising the max price, or clearing search.</p>
      </div>
    )
  }

  return (
    <div className="farm-list" aria-label="U-pick farms near Redmond">
      {farms.map((farm) => (
        <FarmCard
          farm={farm}
          isSelected={selectedFarm?.id === farm.id}
          key={farm.id}
          onSelect={onSelectFarm}
        />
      ))}
    </div>
  )
}
