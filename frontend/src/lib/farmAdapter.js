export const redmondOrigin = {
  latitude: 47.674,
  longitude: -122.1215,
}

export const redmondCenter = [redmondOrigin.latitude, redmondOrigin.longitude]

const sourceLabels = {
  GOOGLE_PLACES: 'Google Places',
  OPENSTREETMAP: 'OpenStreetMap',
  MANUAL_RESEARCH: 'Manual Research',
}

export function formatDataSource(dataSource) {
  return sourceLabels[dataSource] || 'Unknown source'
}

function formatDateRange(startDate, endDate) {
  if (!startDate || !endDate) {
    return 'Season varies'
  }

  const formatter = new Intl.DateTimeFormat('en-US', { month: 'short' })
  const start = formatter.format(new Date(startDate))
  const end = formatter.format(new Date(endDate))

  return start === end ? start : `${start} - ${end}`
}

function getCurrentDayOfWeek() {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    timeZone: 'America/Los_Angeles',
  })
    .format(new Date())
    .toUpperCase()
}

function deriveOpenStatus(farm) {
  if (farm.status === 'UNKNOWN') {
    return 'Unknown'
  }

  if (farm.status === 'TEMPORARILY_CLOSED' || farm.status === 'PERMANENTLY_CLOSED') {
    return 'Closed'
  }

  const today = getCurrentDayOfWeek()
  const todayHours = farm.hours?.find((hours) => hours.dayOfWeek === today)

  if (todayHours?.isClosed) {
    return 'Closed'
  }

  return 'Open'
}

function getPrimaryPrice(farm) {
  const prices = farm.prices || farm.crops?.flatMap((farmCrop) => farmCrop.prices || []) || []
  const usablePrices = prices.filter((price) => typeof price.amount === 'number')

  if (usablePrices.length === 0) {
    return {
      pricePerPound: Number.POSITIVE_INFINITY,
      priceLabel: 'Price unavailable',
    }
  }

  const lowestPrice = usablePrices.reduce((lowest, price) =>
    price.amount < lowest.amount ? price : lowest,
  )
  const unit = lowestPrice.unitLabel ? `/${lowestPrice.unitLabel}` : ''

  return {
    pricePerPound: lowestPrice.amount,
    priceLabel: `$${lowestPrice.amount.toFixed(2)}${unit}`,
  }
}

export function normalizeFarm(apiFarm) {
  const berryTypes = apiFarm.crops?.map((farmCrop) => farmCrop.crop?.name).filter(Boolean) || []
  const cropSlugs = apiFarm.crops?.map((farmCrop) => farmCrop.crop?.slug).filter(Boolean) || []
  const seasonStart = apiFarm.crops
    ?.map((farmCrop) => farmCrop.seasonStartDate)
    .filter(Boolean)
    .sort()[0]
  const seasonEnd = apiFarm.crops
    ?.map((farmCrop) => farmCrop.seasonEndDate)
    .filter(Boolean)
    .sort()
    .at(-1)
  const price = getPrimaryPrice(apiFarm)
  const isUnverifiedCandidate =
    apiFarm.reviewStatus === 'PENDING_REVIEW' ||
    (apiFarm.isVerified === false && apiFarm.dataSource !== 'MANUAL_RESEARCH')

  return {
    ...apiFarm,
    latitude: Number(apiFarm.latitude),
    longitude: Number(apiFarm.longitude),
    berryTypes,
    cropSlugs,
    status: deriveOpenStatus(apiFarm),
    season: formatDateRange(seasonStart, seasonEnd),
    website: apiFarm.websiteUrl,
    isUnverifiedCandidate,
    sourceLabel: formatDataSource(apiFarm.dataSource),
    ...price,
  }
}
