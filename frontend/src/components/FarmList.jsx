import { FarmCard } from './FarmCard'

export function FarmList({ farms, selectedFarm, onSelectFarm }) {
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
