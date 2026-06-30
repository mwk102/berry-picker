import { useEffect, useMemo, useState } from 'react'
import { useCrops } from '../hooks/useCrops'
import { useFarms } from '../hooks/useFarms'
import { normalizeFarm, redmondOrigin } from '../lib/farmAdapter'
import { usePageTitle } from '../hooks/usePageTitle'
import { haversineDistanceMiles } from '../utils/distance'
import { FarmMap } from './FarmMap'
import { Sidebar } from './Sidebar'
import { EmptyState } from './EmptyState'
import './MapPage.css'

const defaultFilters = {
  search: '',
  berryType: 'all',
  openNow: false,
  radiusMiles: 50,
  maxPricePerPound: 10,
  sortBy: 'nearest',
  showUnverifiedCandidates: false,
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

  const [filters, setFilters] = useState(defaultFilters)
  const [selectedFarm, setSelectedFarm] = useState(null)

  const farmQueryParams = useMemo(
    () => ({
      search: filters.search || undefined,
      crop: filters.berryType === 'all' ? undefined : filters.berryType,
      includeUnverified: filters.showUnverifiedCandidates || undefined,
      limit: 100,
      offset: 0,
    }),
    [filters.search, filters.berryType, filters.showUnverifiedCandidates],
  )

  const farmsQuery = useFarms(farmQueryParams)
  const cropsQuery = useCrops()

  const farmsWithDistance = useMemo(
    () =>
      (farmsQuery.data?.data || []).map((farm) => {
        const normalizedFarm = normalizeFarm(farm)
        return {
          ...normalizedFarm,
          distanceMiles: haversineDistanceMiles(redmondOrigin, normalizedFarm),
        }
      }),
    [farmsQuery.data],
  )

  const cropOptions = useMemo(
    () =>
      (cropsQuery.data?.data || []).map((crop) => ({
        label: crop.name,
        value: crop.slug,
      })),
    [cropsQuery.data],
  )

  const maxAvailablePrice = useMemo(() => {
    const finitePrices = farmsWithDistance
      .map((farm) => farm.pricePerPound)
      .filter(Number.isFinite)

    return Math.max(10, Math.ceil(Math.max(...finitePrices, 0)))
  }, [farmsWithDistance])

  const filteredFarms = useMemo(() => {
    const visibleFarms = farmsWithDistance.filter((farm) => {
      const matchesOpenNow = !filters.openNow || farm.status === 'Open'
      const matchesRadius = farm.distanceMiles <= filters.radiusMiles
      const matchesPrice = farm.pricePerPound <= filters.maxPricePerPound

      return matchesOpenNow && matchesRadius && matchesPrice
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

  const resetFilters = () => setFilters(defaultFilters)
  const isLoading = farmsQuery.isLoading || cropsQuery.isLoading
  const error = farmsQuery.error || cropsQuery.error

  if (error) {
    return (
      <div className="map-page-state">
        <EmptyState title="Unable to load farms">
          {error.message || 'The API could not be reached. Make sure the backend server is running.'}
        </EmptyState>
      </div>
    )
  }

  return (
    <div className="map-page">
      <Sidebar
        berryTypes={cropOptions}
        farms={filteredFarms}
        filters={filters}
        isLoading={isLoading}
        maxAvailablePrice={maxAvailablePrice}
        onFiltersChange={setFilters}
        onResetFilters={resetFilters}
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
