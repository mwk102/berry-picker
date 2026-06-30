import { useMemo, useState } from 'react'
import { farms } from '../data/farms'
import { usePageTitle } from '../hooks/usePageTitle'
import { FarmMap } from './FarmMap'
import { Sidebar } from './Sidebar'
import './MapPage.css'

export function MapPage() {
  usePageTitle('Map')

  const sortedFarms = useMemo(
    () => [...farms].sort((a, b) => a.name.localeCompare(b.name)),
    [],
  )
  const [selectedFarm, setSelectedFarm] = useState(sortedFarms[0])

  return (
    <div className="map-page">
      <Sidebar
        farms={sortedFarms}
        onSelectFarm={setSelectedFarm}
        selectedFarm={selectedFarm}
      />
      <FarmMap
        farms={sortedFarms}
        onSelectFarm={setSelectedFarm}
        selectedFarm={selectedFarm}
      />
    </div>
  )
}
