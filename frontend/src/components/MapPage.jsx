import { useEffect, useMemo, useState } from 'react'
import { farms, redmondOrigin } from '../data/farms'
import { usePageTitle } from '../hooks/usePageTitle'
import { haversineDistanceMiles } from '../utils/distance'
import { FarmMap } from './FarmMap'
import { Sidebar } from './Sidebar'
import './MapPage.css'

const maxFarmPrice = Math.ceil(
  Math.max(...farms.map((farm) => farm.pricePerPound)),
)

const defaultFilters = {
  search: '',
  berryType: 'all',
  openNow: false,
  radiusMiles: 50,
  maxPricePerPound: maxFarmPrice,
  sortBy: 'nearest',
}

function farmMatchesSearch(farm, searchTerm) {
  if (!searchTerm) {
    return true
  }

  const searchableText = [
    farm.name,
    farm.city,
    farm.description,
    farm.berryTypes.join(' '),
  ]
    .join(' ')
    .toLowerCase()

  return searchableText.includes(searchTerm.toLowerCase().trim())
}

function sortFarms(farmsToSort, sortBy) {
  return [...farmsToSort].sort((firstFarm, secondFarm) => {
    if (sortBy === 'price') {
      return firstFarm.pricePerPound - secondFarm.pricePerPound
    }

    if (sortBy === 'name') {
      return firstFarm.name.localeCompare(secondFarm.name)
    }

    return firstFarm.distanceMiles - secondFarm.distanceMiles
  })
}

export function MapPage() {
  usePageTitle('Map')

  const farmsWithDistance = useMemo(
    () =>
      farms.map((farm) => ({
        ...farm,
        distanceMiles: haversineDistanceMiles(redmondOrigin, farm),
      })),
    [],
  )
  const [filters, setFilters] = useState(defaultFilters)
  const [selectedFarm, setSelectedFarm] = useState(null)

  const berryTypes = useMemo(
    () =>
      [...new Set(farms.flatMap((farm) => farm.berryTypes))].sort((a, b) =>
        a.localeCompare(b),
      ),
    [],
  )

  const filteredFarms = useMemo(() => {
    const visibleFarms = farmsWithDistance.filter((farm) => {
      const matchesSearch = farmMatchesSearch(farm, filters.search)
      const matchesBerry =
        filters.berryType === 'all' ||
        farm.berryTypes.includes(filters.berryType)
      const matchesOpenNow = !filters.openNow || farm.status === 'Open'
      const matchesRadius = farm.distanceMiles <= filters.radiusMiles
      const matchesPrice = farm.pricePerPound <= filters.maxPricePerPound

      return (
        matchesSearch &&
        matchesBerry &&
        matchesOpenNow &&
        matchesRadius &&
        matchesPrice
      )
    })

    return sortFarms(visibleFarms, filters.sortBy)
  }, [farmsWithDistance, filters])

  useEffect(() => {
    if (filteredFarms.length === 0) {
      setSelectedFarm(null)
      return
    }

    const selectedFarmIsVisible = filteredFarms.some(
      (farm) => farm.id === selectedFarm?.id,
    )

    if (!selectedFarmIsVisible) {
      setSelectedFarm(filteredFarms[0])
    }
  }, [filteredFarms, selectedFarm])

  return (
    <div className="map-page">
      <Sidebar
        berryTypes={berryTypes}
        farms={filteredFarms}
        filters={filters}
        maxAvailablePrice={maxFarmPrice}
        onFiltersChange={setFilters}
        onSelectFarm={setSelectedFarm}
        resultCount={filteredFarms.length}
        selectedFarm={selectedFarm}
      />
      <FarmMap
        farms={filteredFarms}
        onSelectFarm={setSelectedFarm}
        selectedFarm={selectedFarm}
      />
    </div>
  )
}
