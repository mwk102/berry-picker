import { Filters } from './Filters'
import { FarmList } from './FarmList'

export function Sidebar({
  berryTypes,
  farms,
  filters,
  maxAvailablePrice,
  onFiltersChange,
  onResetFilters,
  onSelectFarm,
  resultCount,
  selectedFarm,
}) {
  return (
    <aside className="map-sidebar">
      <div className="sidebar-header">
        <span className="sidebar-kicker">Berry Picker</span>
        <h1>U-pick farms near Redmond</h1>
        <p>Search seasonal berry farms, compare prices, and stay close to Redmond.</p>
      </div>

      <Filters
        berryTypes={berryTypes}
        filters={filters}
        maxAvailablePrice={maxAvailablePrice}
        onChange={onFiltersChange}
        onReset={onResetFilters}
        resultCount={resultCount}
      />

      <FarmList
        farms={farms}
        onResetFilters={onResetFilters}
        onSelectFarm={onSelectFarm}
        selectedFarm={selectedFarm}
      />
    </aside>
  )
}
