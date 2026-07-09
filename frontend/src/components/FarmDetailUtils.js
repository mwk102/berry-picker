export function formatDate(value) {
  if (!value) return 'Not listed'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
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

export function farmFreshnessSummary(farm) {
  const evidence = [...(farm.evidence || [])]
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

  if (latestHarvestEvidence) {
    const condition = latestHarvestEvidence.normalizedValue?.condition
      ?.replace(/_/g, ' ')
      .toLowerCase()
    const labelPrefix =
      latestHarvestEvidence.sourceType === 'FIELD_OBSERVATION' ? 'Field checked' : 'Official update'
    return {
      status: latestHarvestEvidence.status === 'expired' ? 'expired' : latestHarvestEvidence.sourceType === 'FIELD_OBSERVATION' ? 'field' : 'fresh',
      label: `${labelPrefix} ${formatDate(latestHarvestEvidence.observedAt)}`,
      detail: condition ? condition.replace(/^./, (letter) => letter.toUpperCase()) : latestHarvestEvidence.value,
    }
  }

  if (expired) {
    return {
      status: 'expired',
      label: 'Needs refresh',
      detail: `${expired.fieldName} expired ${formatDate(expired.expiresAt)}`,
    }
  }

  if (stale) {
    return {
      status: 'stale',
      label: 'Refresh soon',
      detail: `${stale.fieldName} expires ${formatDate(stale.expiresAt)}`,
    }
  }

  if (lowConfidence) {
    return {
      status: 'low',
      label: 'Low confidence',
      detail: `${lowConfidence.fieldName} needs review`,
    }
  }

  return {
    status: 'unknown',
    label: 'Evidence freshness unknown',
    detail: 'Needs a current source or field check',
  }
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
  const availableCrops = cropStatuses.filter((crop) => isCurrentlyPickable(crop))
  const limitedCrops = availableCrops.filter((crop) => crop.latestReport?.condition === 'LIMITED')
  const cropBoost = Math.min(24, availableCrops.length * 8)
  const peakBoost = availableCrops.some((crop) => crop.stage === 'PEAK')
    ? limitedCrops.length > 0
      ? 8
      : 18
    : 0
  const reportBoost = confidence.recentReportCount > 0 ? 15 : 0
  const unavailablePenalty = cropStatuses.some((crop) =>
    ['SEASON_OVER', 'PICKED_OVER', 'CLOSED'].includes(crop.latestReport?.condition),
  )
    ? 12
    : 0
  return Math.max(
    0,
    Math.min(100, openBoost + cropBoost + peakBoost + reportBoost + Math.round(confidence.score * 0.12) - unavailablePenalty),
  )
}

export function worthTheDriveDetails(farm, cropStatuses) {
  const confidence = confidenceForFarm(farm)
  const reasons = []
  const availableCrops = cropStatuses.filter((crop) => isCurrentlyPickable(crop))

  if (confidence.freshness !== null && confidence.freshness <= 3) {
    reasons.push('Fresh official update')
  }
  if (availableCrops.some((crop) => crop.stage === 'PEAK' && crop.latestReport?.condition !== 'LIMITED')) {
    reasons.push(`Peak ${availableCrops.find((crop) => crop.stage === 'PEAK')?.name} season`)
  } else if (availableCrops.some((crop) => crop.latestReport?.condition === 'LIMITED')) {
    reasons.push(`${availableCrops.find((crop) => crop.latestReport?.condition === 'LIMITED')?.name} is limited today`)
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

export function isCurrentlyPickable(crop) {
  if (['SEASON_OVER', 'PICKED_OVER', 'CLOSED'].includes(crop.latestReport?.condition)) {
    return false
  }
  if (['EXCELLENT', 'GOOD', 'LIMITED'].includes(crop.latestReport?.condition)) {
    return true
  }

  return ['STARTING', 'PEAK', 'ENDING_SOON'].includes(crop.stage)
}

function cropLabel(name, plural = false) {
  const label = String(name || 'crop').toLowerCase()
  if (!plural) return label
  if (label.endsWith('berry')) return `${label.slice(0, -1)}ies`
  if (label.endsWith('s')) return label
  return `${label}s`
}

function listNames(names) {
  if (names.length <= 1) return names[0] || ''
  if (names.length === 2) return `${names[0]} and ${names[1]}`
  return `${names.slice(0, -1).join(', ')}, and ${names.at(-1)}`
}

export function whyVisitToday(farm, cropStatuses) {
  const unavailableConditions = ['SEASON_OVER', 'PICKED_OVER', 'CLOSED']
  const availableConditions = ['EXCELLENT', 'GOOD']
  const unavailable = cropStatuses.filter((crop) =>
    unavailableConditions.includes(crop.latestReport?.condition) || crop.stage === 'ENDED',
  )
  const seasonOver = unavailable.filter((crop) => crop.latestReport?.condition === 'SEASON_OVER')
  const temporarilyUnavailable = unavailable.filter((crop) => crop.latestReport?.condition !== 'SEASON_OVER')
  const limited = cropStatuses.filter((crop) => !unavailable.includes(crop) && crop.latestReport?.condition === 'LIMITED')
  const available = cropStatuses.filter((crop) =>
    !unavailable.includes(crop) &&
    !limited.includes(crop) &&
    (availableConditions.includes(crop.latestReport?.condition) ||
      ['STARTING', 'PEAK', 'ENDING_SOON'].includes(crop.stage)),
  )
  const parts = []

  if (seasonOver.length > 0) {
    const names = seasonOver.map((crop) => cropLabel(crop.name, true))
    parts.push(`${listNames(names)} are over for the season`)
  }

  if (temporarilyUnavailable.length > 0) {
    const names = temporarilyUnavailable.map((crop) => cropLabel(crop.name, true))
    parts.push(`${listNames(names)} are unavailable right now`)
  }

  if (available.length > 0) {
    const names = available.map((crop) => cropLabel(crop.name, true))
    parts.push(`${listNames(names)} ${available.length === 1 ? 'are' : 'are'} now in season`)
  }

  if (limited.length > 0) {
    const names = limited.map((crop) => cropLabel(crop.name, true))
    parts.push(`${listNames(names)} are limited today`)
  }

  if (
    cropStatuses.some(
      (crop) =>
        crop.name === 'Raspberry' &&
        crop.stage === 'PEAK' &&
        crop.latestReport?.condition !== 'LIMITED' &&
        !unavailableConditions.includes(crop.latestReport?.condition),
    )
  ) {
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
