const EARTH_RADIUS_MILES = 3958.8

function toRadians(degrees) {
  return degrees * (Math.PI / 180)
}

export function haversineDistanceMiles(origin, destination) {
  const originLatitude = toRadians(origin.latitude)
  const destinationLatitude = toRadians(destination.latitude)
  const latitudeDelta = toRadians(destination.latitude - origin.latitude)
  const longitudeDelta = toRadians(destination.longitude - origin.longitude)

  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(originLatitude) *
      Math.cos(destinationLatitude) *
      Math.sin(longitudeDelta / 2) ** 2

  return (
    EARTH_RADIUS_MILES *
    2 *
    Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
  )
}

export function formatDistance(miles) {
  if (miles < 0.1) {
    return 'Less than 0.1 mi'
  }

  if (miles < 10) {
    return `${miles.toFixed(1)} mi`
  }

  return `${Math.round(miles)} mi`
}
