import L from 'leaflet'
import { useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from 'react-leaflet'
import { redmondCenter } from '../lib/farmAdapter'
import { formatDistance } from '../utils/distance'
import { BerryChip } from './BerryChip'
import { StatusBadge } from './StatusBadge'
import './FarmMap.css'

const selectedFarmIcon = L.divIcon({
  className: 'farm-marker selected',
  html: '<span aria-hidden="true"></span>',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30],
})

const unverifiedFarmIcon = L.divIcon({
  className: 'farm-marker unverified',
  html: '<span aria-hidden="true"></span>',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30],
})

const selectedUnverifiedFarmIcon = L.divIcon({
  className: 'farm-marker unverified selected',
  html: '<span aria-hidden="true"></span>',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30],
})

const defaultFarmIcon = L.divIcon({
  className: 'farm-marker',
  html: '<span aria-hidden="true"></span>',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30],
})

function FarmMapController({ markerRefs, selectedFarm, selectedPosition }) {
  const map = useMap()

  useEffect(() => {
    if (!selectedFarm) {
      return
    }

    map.flyTo(selectedPosition, 14, {
      duration: 0.75,
    })

    markerRefs.current[selectedFarm.id]?.openPopup()
  }, [map, markerRefs, selectedFarm, selectedPosition])

  return null
}

function getFarmIcon(farm, selectedFarm) {
  const isSelected = selectedFarm?.id === farm.id

  if (farm.isUnverifiedCandidate) {
    return isSelected ? selectedUnverifiedFarmIcon : unverifiedFarmIcon
  }

  return isSelected ? selectedFarmIcon : defaultFarmIcon
}

export function FarmMap({ farms = [], onSelectFarm, selectedFarm }) {
  const markerRefs = useRef({})

  const selectedPosition = useMemo(() => {
    if (!selectedFarm) {
      return redmondCenter
    }

    return [selectedFarm.latitude, selectedFarm.longitude]
  }, [selectedFarm])

  return (
    <section className="farm-map" aria-label="Farm map">
      <MapContainer
        center={redmondCenter}
        className="farm-map-canvas"
        scrollWheelZoom
        zoom={12}
      >
        <FarmMapController
          markerRefs={markerRefs}
          selectedFarm={selectedFarm}
          selectedPosition={selectedPosition}
        />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {farms.map((farm) => (
          <Marker
            eventHandlers={{
              click: () => onSelectFarm?.(farm),
            }}
            icon={getFarmIcon(farm, selectedFarm)}
            key={farm.id}
            position={[farm.latitude, farm.longitude]}
            ref={(marker) => {
              if (marker) {
                markerRefs.current[farm.id] = marker
              }
            }}
          >
            <Popup>
              <div
                className={
                  farm.isUnverifiedCandidate
                    ? 'farm-popup unverified'
                    : 'farm-popup'
                }
              >
                <strong>{farm.name}</strong>
                {farm.isUnverifiedCandidate ? (
                  <>
                    <span>{farm.city}</span>
                    <span className="candidate-badge">Unverified candidate</span>
                    <span className="candidate-source">
                      Source: {farm.sourceLabel}
                    </span>
                    <span className="candidate-warning">
                      Review needed before public launch.
                    </span>
                  </>
                ) : (
                  <>
                <div className="popup-badges">
                  <StatusBadge status={farm.status} />
                  <span className="popup-distance">
                    {formatDistance(farm.distanceMiles)}
                  </span>
                </div>
                <div className="berry-chip-list popup-chip-list">
                  {farm.berryTypes.map((berryType) => (
                    <BerryChip key={berryType}>{berryType}</BerryChip>
                  ))}
                </div>
                <div className="popup-price-list" aria-label={`${farm.name} crop prices`}>
                  {farm.cropPriceRows.slice(0, 4).map((priceRow) => (
                    <span
                      className={priceRow.hasPrice ? 'popup-price-row' : 'popup-price-row unavailable'}
                      key={priceRow.cropSlug || priceRow.cropName}
                    >
                      <span>{priceRow.cropName}</span>
                      <strong>{priceRow.label}</strong>
                    </span>
                  ))}
                </div>
                <span>{farm.city}</span>
                {farm.website ? (
                  <a href={farm.website} rel="noreferrer" target="_blank">
                    Website
                  </a>
                ) : null}
                <Link to={`/farms/${farm.slug}`}>View details</Link>
                  </>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </section>
  )
}
