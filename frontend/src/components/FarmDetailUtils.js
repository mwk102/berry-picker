export function formatDate(value) {
  if (!value) return 'Not listed'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(value))
}

export function formatDateTime(value) {
  if (!value) return 'Not listed'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

export function formatTime(value) {
  if (!value) return null
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC',
  }).format(new Date(value))
}

export function formatPrice(price) {
  if (!price || typeof price.amount !== 'number') return 'Price unavailable'
  const unit = price.unitLabel ? `/${price.unitLabel}` : ''
  return `$${price.amount.toFixed(2)}${unit}`
}

export function getLatestReport(reports = []) {
  return [...reports].sort(
    (first, second) => new Date(second.createdAt) - new Date(first.createdAt),
  )[0]
}

export function getLatestPrice(prices = []) {
  return prices.find((price) => typeof price.amount === 'number') || prices[0]
}

export function reportFreshnessDays(report) {
  if (!report?.createdAt) return null
  const elapsed = Date.now() - new Date(report.createdAt).getTime()
  return Math.max(0, Math.floor(elapsed / 86400000))
}

export function seasonStageForCrop(farmCrop, asOfDate = new Date()) {
  const start = farmCrop.seasonStartDate ? new Date(farmCrop.seasonStartDate) : null
  const end = farmCrop.seasonEndDate ? new Date(farmCrop.seasonEndDate) : null
  const peakStart = farmCrop.peakStartDate ? new Date(farmCrop.peakStartDate) : null
  const peakEnd = farmCrop.peakEndDate ? new Date(farmCrop.peakEndDate) : null

  if (!start || !end) return 'UNKNOWN'
  if (asOfDate < start) return 'COMING_SOON'
  if (asOfDate > end) return 'ENDED'
  if (peakStart && peakEnd && asOfDate >= peakStart && asOfDate <= peakEnd) {
    return 'PEAK'
  }

  const progress = (asOfDate - start) / Math.max(end - start, 1)
  return progress < 0.5 ? 'STARTING' : 'ENDING_SOON'
}

export function confidenceForFarm(farm) {
  const sourceCount = farm.sources?.length || (farm.dataSource ? 1 : 0)
  const prices = farm.prices || []
  const reports = farm.pickingReports || []
  const verifiedDataCount = [
    farm.isVerified,
    ...prices.map((price) => price.isVerified),
    ...reports.map((report) => report.isVerified),
  ].filter(Boolean).length
  const recentReportCount = reports.filter((report) => {
    const freshness = reportFreshnessDays(report)
    return freshness !== null && freshness <= 7
  }).length
  const freshness = reports.length > 0 ? Math.min(...reports.map(reportFreshnessDays)) : null
  const score = Math.min(
    100,
    (farm.isVerified ? 25 : 0) +
      Math.min(20, sourceCount * 8) +
      Math.min(25, verifiedDataCount * 8) +
      Math.min(20, recentReportCount * 10) +
      (freshness !== null && freshness <= 3 ? 10 : 0),
  )

  return {
    score,
    sourceCount,
    verifiedDataCount,
    recentReportCount,
    freshness,
  }
}

export function worthTheDriveForFarm(farm, cropStatuses) {
  const confidence = confidenceForFarm(farm)
  const openBoost = farm.status === 'ACTIVE' ? 20 : 0
  const cropBoost = Math.min(30, cropStatuses.length * 8)
  const peakBoost = cropStatuses.some((crop) => crop.stage === 'PEAK') ? 20 : 0
  const reportBoost = confidence.recentReportCount > 0 ? 15 : 0
  return Math.min(100, openBoost + cropBoost + peakBoost + reportBoost + Math.round(confidence.score * 0.15))
}
