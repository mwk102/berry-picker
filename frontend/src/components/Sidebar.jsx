import { FarmList } from './FarmList'

export function Sidebar({ farms, selectedFarm, onSelectFarm }) {
  return (
    <aside className="map-sidebar">
      <div className="sidebar-header">
        <span className="sidebar-kicker">Berry Picker</span>
        <h1>U-pick farms near Redmond</h1>
        <p>{farms.length} local farms with seasonal berries and map details.</p>
      </div>

      <FarmList
        farms={farms}
        onSelectFarm={onSelectFarm}
        selectedFarm={selectedFarm}
      />
    </aside>
  )
}
