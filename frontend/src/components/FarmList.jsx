import { FarmCard } from './FarmCard'
import { EmptyState } from './EmptyState'

function FarmListSkeleton() {
  return (
    <div className="farm-list" aria-label="Loading farms">
      {Array.from({ length: 5 }).map((_, index) => (
        <div className="farm-card-skeleton" key={index}>
          <span />
          <strong />
          <p />
          <div />
        </div>
      ))}
    </div>
  )
}

export function FarmList({
  farms,
  isLoading,
  onResetFilters,
  selectedFarm,
  onSelectFarm,
}) {
  if (isLoading) {
    return <FarmListSkeleton />
  }

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
