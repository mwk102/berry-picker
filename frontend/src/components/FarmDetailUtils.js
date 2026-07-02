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

export function worthTheDriveDetails(farm, cropStatuses) {
  const confidence = confidenceForFarm(farm)
  const reasons = []

  if (confidence.freshness !== null && confidence.freshness <= 3) {
    reasons.push('Fresh official update')
  }
  if (cropStatuses.some((crop) => crop.stage === 'PEAK')) {
    reasons.push(`Peak ${cropStatuses.find((crop) => crop.stage === 'PEAK')?.name} season`)
  }
  if (confidence.score >= 85 || farm.verificationProfile?.confidence >= 90) {
    reasons.push('Excellent confidence')
  }
  if ((farm.amenities || []).some((amenity) => amenity.slug === 'kid-friendly')) {
    reasons.push('Family friendly')
  }
  if ((farm.prices || []).some((price) => price.isVerified && typeof price.amount === 'number')) {
    reasons.push('Verified pricing')
  }

  return {
    score: worthTheDriveForFarm(farm, cropStatuses),
    reasons: reasons.length > 0 ? reasons : ['More verification needed before recommending a long drive'],
  }
}

export function whyVisitToday(farm, cropStatuses) {
  const available = cropStatuses.filter((crop) => ['STARTING', 'PEAK', 'ENDING_SOON'].includes(crop.stage))
  const parts = []

  if (available.length > 0) {
    parts.push(`${available.map((crop) => crop.name).join(', ')} ${available.length === 1 ? 'is' : 'are'} in season`)
  }
  if (cropStatuses.some((crop) => crop.name === 'Raspberry' && crop.stage === 'PEAK')) {
    parts.push('raspberry season is in its peak window')
  }
  if (farm.verificationProfile?.lastResearchedAt) {
    parts.push(`official updates were reviewed ${formatDate(farm.verificationProfile.lastResearchedAt)}`)
  }

  return parts.length > 0
    ? `${parts.join(', ')}.`
    : 'We need fresher crop information before making a strong trip recommendation.'
}

export function seasonProgressPercent(farmCrop, asOfDate = new Date()) {
  const start = farmCrop.seasonStartDate ? new Date(farmCrop.seasonStartDate).getTime() : null
  const end = farmCrop.seasonEndDate ? new Date(farmCrop.seasonEndDate).getTime() : null
  if (!start || !end || end <= start) return 50
  const progress = ((asOfDate.getTime() - start) / (end - start)) * 100
  return Math.max(0, Math.min(100, Math.round(progress)))
}
