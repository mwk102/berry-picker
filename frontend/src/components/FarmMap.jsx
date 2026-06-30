import L from 'leaflet'
import { useEffect, useMemo, useRef } from 'react'
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from 'react-leaflet'
import { farms as defaultFarms, redmondCenter } from '../data/farms'
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

export function FarmMap({
  farms = defaultFarms,
  onSelectFarm,
  selectedFarm,
}) {
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
            icon={selectedFarm?.id === farm.id ? selectedFarmIcon : defaultFarmIcon}
            key={farm.id}
            position={[farm.latitude, farm.longitude]}
            ref={(marker) => {
              if (marker) {
                markerRefs.current[farm.id] = marker
              }
            }}
          >
            <Popup>
              <div className="farm-popup">
                <strong>{farm.name}</strong>
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
                <span>${farm.pricePerPound.toFixed(2)}/lb</span>
                <span>{farm.city}</span>
                <a href={farm.website} rel="noreferrer" target="_blank">
                  Website
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </section>
  )
}
