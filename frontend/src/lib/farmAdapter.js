import { cropAvailabilityDetails } from './cropAvailabilityDetails'

export const redmondOrigin = {
  latitude: 47.674,
  longitude: -122.1215,
}

export const redmondCenter = [redmondOrigin.latitude, redmondOrigin.longitude]

const sourceLabels = {
  GOOGLE_PLACES: 'Google Places',
  OPENSTREETMAP: 'OpenStreetMap',
  MANUAL_RESEARCH: 'Manual Research',
  FARM_WEBSITE: 'Official Website',
  FIELD_OBSERVATION: 'Field Observation',
  ADMIN: 'Admin Review',
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

function formatPrice(price) {
  if (!price || typeof price.amount !== 'number') {
    return 'Price unavailable'
  }

  const unit = price.unitLabel ? `/${price.unitLabel}` : ''
  return `$${price.amount.toFixed(2)}${unit}`
}

function formatCondition(condition) {
  if (!condition || condition === 'UNKNOWN') return null
  return condition
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function getLatestReport(reports = []) {
  return [...reports].sort(
    (first, second) => new Date(second.createdAt) - new Date(first.createdAt),
  )[0]
}

function seasonStageForFarmCrop(farmCrop, asOfDate = new Date()) {
  const start = farmCrop.seasonStartDate ? new Date(farmCrop.seasonStartDate) : null
  const end = farmCrop.seasonEndDate ? new Date(farmCrop.seasonEndDate) : null
  const peakStart = farmCrop.peakStartDate ? new Date(farmCrop.peakStartDate) : null
  const peakEnd = farmCrop.peakEndDate ? new Date(farmCrop.peakEndDate) : null

  if (!start || !end) return 'UNKNOWN'
  if (asOfDate < start) return 'COMING_SOON'
  if (asOfDate > end) return 'ENDED'
  if (peakStart && peakEnd && asOfDate >= peakStart && asOfDate <= peakEnd) return 'PEAK'
  return 'IN_SEASON'
}

function getCropAvailability(farmCrop) {
  const latestReport = getLatestReport(farmCrop.reports)
  const condition = latestReport?.condition

  if (condition === 'SEASON_OVER') {
    return { status: 'unavailable', label: 'Season over' }
  }
  if (condition === 'PICKED_OVER') {
    return { status: 'unavailable', label: 'Picked over' }
  }
  if (condition === 'CLOSED') {
    return { status: 'unavailable', label: 'Closed' }
  }
  if (condition === 'COMING_SOON') {
    return { status: 'upcoming', label: 'Coming soon' }
  }
  if (condition === 'LIMITED') {
    return { status: 'limited', label: 'Limited' }
  }
  if (condition === 'GOOD' || condition === 'EXCELLENT') {
    return { status: 'available', label: formatCondition(condition) }
  }

  const seasonStage = seasonStageForFarmCrop(farmCrop)
  if (seasonStage === 'COMING_SOON') return { status: 'upcoming', label: 'Coming soon' }
  if (seasonStage === 'ENDED') return { status: 'unavailable', label: 'Season ended' }
  if (seasonStage === 'PEAK') return { status: 'available', label: 'Peak window' }
  if (seasonStage === 'IN_SEASON') return { status: 'available', label: 'In season' }

  return { status: 'unknown', label: null }
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

function getCropPriceRows(farm) {
  return (farm.crops || []).map((farmCrop) => {
    const latestReport = getLatestReport(farmCrop.reports)
    const details = cropAvailabilityDetails(farm, farmCrop)
    const prices = [...(farmCrop.prices || [])].filter(
      (price) => typeof price.amount === 'number',
    )
    const lowestPrice = prices.reduce(
      (lowest, price) => (!lowest || price.amount < lowest.amount ? price : lowest),
      null,
    )

    return {
      cropSlug: farmCrop.crop?.slug,
      crop: farmCrop.crop,
      cropName: farmCrop.crop?.name || 'Crop',
      availability: getCropAvailability(farmCrop),
      availabilityDetails: details,
      latestReport,
      hasPrice: Boolean(lowestPrice),
      label: formatPrice(lowestPrice),
      price: lowestPrice,
    }
  })
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

function getPriceSummary(cropPriceRows) {
  const pricedRows = cropPriceRows.filter((row) => row.hasPrice)
  const unavailableCount = cropPriceRows.length - pricedRows.length

  if (pricedRows.length === 0) {
    return 'Price unavailable'
  }

  if (pricedRows.length === 1 && unavailableCount === 0) {
    return `${pricedRows[0].cropName}: ${pricedRows[0].label}`
  }

  if (unavailableCount > 0) {
    return `${pricedRows.length} price${pricedRows.length === 1 ? '' : 's'} listed, ${unavailableCount} unavailable`
  }

  return `${pricedRows.length} prices listed`
}

function formatShortDate(value) {
  if (!value) return 'date unknown'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(value))
}

function getFreshnessSummary(farm) {
  const evidence = [...(farm.evidence || [])]
  const reports = [...(farm.pickingReports || [])]
  const evidenceTypePriority = {
    HARVEST_STATUS: 0,
    CROP_AVAILABILITY: 1,
  }
  const latestHarvestEvidence = evidence
    .filter((record) =>
      ['FIELD_OBSERVATION', 'OFFICIAL_WEBSITE', 'FARM_OWNER', 'ADMIN_RESEARCH'].includes(record.sourceType) &&
      ['HARVEST_STATUS', 'CROP_AVAILABILITY'].includes(record.evidenceType),
    )
    .sort(
      (first, second) =>
        new Date(second.observedAt) - new Date(first.observedAt) ||
        (evidenceTypePriority[first.evidenceType] ?? 9) - (evidenceTypePriority[second.evidenceType] ?? 9),
    )[0]
  const expired = evidence.find((record) => record.status === 'expired')
  const stale = evidence.find((record) => record.status === 'stale')
  const lowConfidence = evidence.find((record) => record.status === 'low confidence')
  const latestReport = reports.sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt))[0]

  if (latestHarvestEvidence) {
    const condition = latestHarvestEvidence.normalizedValue?.condition
      ?.replace(/_/g, ' ')
      .toLowerCase()
    const labelPrefix =
      latestHarvestEvidence.sourceType === 'FIELD_OBSERVATION' ? 'Field check' : 'Official update'
    return {
      status: latestHarvestEvidence.status === 'expired' ? 'expired' : latestHarvestEvidence.sourceType === 'FIELD_OBSERVATION' ? 'field' : 'fresh',
      label: `${labelPrefix} ${formatShortDate(latestHarvestEvidence.observedAt)}`,
      detail: condition ? condition.replace(/^./, (letter) => letter.toUpperCase()) : latestHarvestEvidence.value,
    }
  }

  if (expired) {
    return {
      status: 'expired',
      label: 'Needs refresh',
      detail: `${expired.fieldName} expired ${formatShortDate(expired.expiresAt)}`,
    }
  }

  if (stale) {
    return {
      status: 'stale',
      label: 'Refresh soon',
      detail: `${stale.fieldName} expires ${formatShortDate(stale.expiresAt)}`,
    }
  }

  if (lowConfidence) {
    return {
      status: 'low',
      label: 'Low confidence',
      detail: `${lowConfidence.fieldName} needs review`,
    }
  }

  if (latestReport) {
    return {
      status: 'fresh',
      label: `Latest report ${formatShortDate(latestReport.createdAt)}`,
      detail: latestReport.condition?.replace(/_/g, ' ').toLowerCase() || 'Report available',
    }
  }

  return {
    status: 'unknown',
    label: 'Freshness unknown',
    detail: 'Needs a current check',
  }
}

function getPickingSummary(cropPriceRows, farm) {
  if (cropPriceRows.length === 0) {
    return {
      status: 'unknown',
      label: 'Picking status unknown',
      detail: 'Needs current crop information',
    }
  }

  const rowPriority = {
    unavailable: 0,
    limited: 1,
    available: 2,
    upcoming: 3,
    unknown: 4,
  }
  const sortedRows = [...cropPriceRows].sort(
    (first, second) =>
      (rowPriority[first.availability?.status] ?? 9) - (rowPriority[second.availability?.status] ?? 9) ||
      first.cropName.localeCompare(second.cropName),
  )
  const details = sortedRows.slice(0, 4).map((row) => {
    const label = row.availability?.label || 'needs review'
    const detail = row.availabilityDetails?.label ? `: ${row.availabilityDetails.label}` : ''
    return `${row.cropName} ${label.toLowerCase()}${detail}`
  })
  const unavailableCount = cropPriceRows.filter((row) => row.availability?.status === 'unavailable').length
  const limitedCount = cropPriceRows.filter((row) => row.availability?.status === 'limited').length
  const availableCount = cropPriceRows.filter((row) => row.availability?.status === 'available').length
  const latestReport = cropPriceRows
    .map((row) => row.latestReport)
    .filter(Boolean)
    .sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt))[0]

  let status = 'unknown'
  if (availableCount > 0) status = 'fresh'
  if (limitedCount > 0) status = 'limited'
  if (unavailableCount === cropPriceRows.length) status = 'unavailable'
  if (farm.isUnverifiedCandidate) status = 'low'

  return {
    status,
    label: latestReport ? `Current picking status - updated ${formatShortDate(latestReport.createdAt)}` : 'Current picking status',
    detail: details.join('; '),
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
  const cropPriceRows = getCropPriceRows(apiFarm)
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
    cropPriceRows,
    priceSummaryLabel: getPriceSummary(cropPriceRows),
    freshnessSummary: getFreshnessSummary(apiFarm),
    pickingSummary: getPickingSummary(cropPriceRows, apiFarm),
    ...price,
  }
}
