import { FarmCard } from './FarmCard'
import { EmptyState } from './EmptyState'

export function FarmList({ farms, onResetFilters, selectedFarm, onSelectFarm }) {
  if (farms.length === 0) {
    return (
      <EmptyState
        actionLabel="Reset filters"
        onAction={onResetFilters}
        title="No farms found"
      >
        Try widening the radius, raising the max price, or clearing search.
      </EmptyState>
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
