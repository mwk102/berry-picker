import L from 'leaflet'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import { mockFarms } from '../services/mockFarms'
import './FarmMap.css'

const REDMOND_CENTER = [47.674, -122.1215]

const farmIcon = L.divIcon({
  className: 'farm-marker',
  html: '<span aria-hidden="true"></span>',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
})

export function FarmMap({ farms = mockFarms }) {
  return (
    <section className="farm-map" aria-label="Farm map">
      <MapContainer
        center={REDMOND_CENTER}
        className="farm-map-canvas"
        scrollWheelZoom
        zoom={13}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {farms.map((farm) => (
          <Marker icon={farmIcon} key={farm.id} position={farm.position}>
            <Popup>
              <div className="farm-popup">
                <strong>{farm.name}</strong>
                <span>{farm.crop}</span>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </section>
  )
}
