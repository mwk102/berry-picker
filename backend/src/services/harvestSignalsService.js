const { calculateHarvestSummary } = require('./harvestRadarService')

function decimalToNumber(value) {
  if (value === null || value === undefined) return null
  return Number(value)
}

function dateOnly(value) {
  if (!value) return null
  return new Date(`${value.toISOString().slice(0, 10)}T00:00:00.000Z`)
}

function daysBetween(first, second) {
  const millisPerDay = 1000 * 60 * 60 * 24
  return Math.floor((dateOnly(first) - dateOnly(second)) / millisPerDay)
}

function isEffective(price, asOfDate) {
  const start = price.effectiveStartDate ? dateOnly(price.effectiveStartDate) : null
  const end = price.effectiveEndDate ? dateOnly(price.effectiveEndDate) : null
  const asOf = dateOnly(asOfDate)

  return (!start || start <= asOf) && (!end || end >= asOf)
}

function average(values) {
  if (values.length === 0) return null
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function round(value) {
  if (value === null || value === undefined) return null
  return Math.round(value * 100) / 100
}

function compareTrend(current, previous, tolerance = 0) {
  if (current === null || previous === null) return 'INSUFFICIENT_DATA'
  const delta = current - previous
  if (Math.abs(delta) <= tolerance) return 'STABLE'
  return delta > 0 ? 'UP' : 'DOWN'
}

function seasonStageForFarmCrop(farmCrop, asOfDate) {
  const asOf = dateOnly(asOfDate)
  const start = farmCrop.seasonStartDate ? dateOnly(farmCrop.seasonStartDate) : null
  const end = farmCrop.seasonEndDate ? dateOnly(farmCrop.seasonEndDate) : null
  const peakStart = farmCrop.peakStartDate ? dateOnly(farmCrop.peakStartDate) : null
  const peakEnd = farmCrop.peakEndDate ? dateOnly(farmCrop.peakEndDate) : null

  if (!start || !end) return 'UNKNOWN'
  if (asOf < start) return 'UPCOMING'
  if (asOf > end) return 'ENDED'
  if (peakStart && peakEnd && asOf >= peakStart && asOf <= peakEnd) return 'PEAK'

  const progress = daysBetween(asOf, start) / Math.max(daysBetween(end, start), 1)
  return progress < 0.5 ? 'EARLY' : 'LATE'
}

function priceHistoryFor(crop) {
  return (crop.cropPrices || [])
    .map((price) => ({
      id: price.id,
      amount: decimalToNumber(price.amount),
      priceType: price.priceType,
      unitLabel: price.unitLabel,
      effectiveStartDate: price.effectiveStartDate,
      effectiveEndDate: price.effectiveEndDate,
      createdAt: price.createdAt,
      farm: price.farm
        ? {
            id: price.farm.id,
            slug: price.farm.slug,
            name: price.farm.name,
            city: price.farm.city,
          }
        : null,
    }))
    .filter((price) => price.amount !== null)
    .sort((first, second) => new Date(first.effectiveStartDate || first.createdAt) - new Date(second.effectiveStartDate || second.createdAt))
}

function reportHistoryFor(crop) {
  return (crop.reports || [])
    .map((report) => ({
      id: report.id,
      condition: report.condition,
      crowdLevel: report.crowdLevel,
      rating: report.rating,
      source: report.source,
      createdAt: report.createdAt,
      expiresAt: report.expiresAt,
      farm: report.farm
        ? {
            id: report.farm.id,
            slug: report.farm.slug,
            name: report.farm.name,
            city: report.farm.city,
          }
        : null,
    }))
    .sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt))
}

function priceTrendFor(crop, asOfDate) {
  const prices = priceHistoryFor(crop)
  const currentPrices = prices.filter((price) => isEffective(price, asOfDate))
  const currentAverage = round(average(currentPrices.map((price) => price.amount)))
  const previousPrices = prices.filter((price) => !isEffective(price, asOfDate))
  const previousAverage = round(average(previousPrices.map((price) => price.amount)))
  const delta = currentAverage !== null && previousAverage !== null ? round(currentAverage - previousAverage) : null

  return {
    direction: compareTrend(currentAverage, previousAverage, 0.1),
    currentAverage,
    previousAverage,
    delta,
    sampleSize: currentPrices.length,
    history: prices,
  }
}

function supplyTrendFor(crop, asOfDate) {
  const stages = (crop.farmCrops || []).map((farmCrop) => seasonStageForFarmCrop(farmCrop, asOfDate))
  const activeStages = ['EARLY', 'PEAK', 'LATE']
  const currentSupply = stages.filter((stage) => activeStages.includes(stage)).length
  const upcomingSupply = stages.filter((stage) => stage === 'UPCOMING').length
  const endedSupply = stages.filter((stage) => stage === 'ENDED').length
  const direction =
    currentSupply === 0 && upcomingSupply > 0
      ? 'COMING_SOON'
      : currentSupply > endedSupply
        ? 'UP'
        : endedSupply > currentSupply
          ? 'DOWN'
          : 'STABLE'

  return {
    direction,
    currentSupply,
    upcomingSupply,
    endedSupply,
    stageCounts: stages.reduce((memo, stage) => {
      memo[stage] = (memo[stage] || 0) + 1
      return memo
    }, {}),
  }
}

function harvestTimelineFor(crop) {
  const windows = (crop.farmCrops || [])
    .map((farmCrop) => ({
      farmSlug: farmCrop.farm?.slug,
      farmName: farmCrop.farm?.name,
      city: farmCrop.farm?.city,
      seasonStartDate: farmCrop.seasonStartDate,
      seasonEndDate: farmCrop.seasonEndDate,
      peakStartDate: farmCrop.peakStartDate,
      peakEndDate: farmCrop.peakEndDate,
    }))
    .filter((window) => window.seasonStartDate && window.seasonEndDate)

  const sortedStarts = windows.map((window) => window.seasonStartDate).sort((a, b) => a - b)
  const sortedEnds = windows.map((window) => window.seasonEndDate).sort((a, b) => a - b)
  const sortedPeakStarts = windows.map((window) => window.peakStartDate).filter(Boolean).sort((a, b) => a - b)
  const sortedPeakEnds = windows.map((window) => window.peakEndDate).filter(Boolean).sort((a, b) => a - b)

  return {
    seasonStartDate: sortedStarts[0] || null,
    seasonEndDate: sortedEnds.at(-1) || null,
    peakStartDate: sortedPeakStarts[0] || null,
    peakEndDate: sortedPeakEnds.at(-1) || null,
    windows,
  }
}

function worthTheDriveScoreFor({ summary, priceTrend, supplyTrend }) {
  let score = 0

  score += Math.min(30, summary.activeFarmCount * 3)
  score += Math.min(30, summary.confidence * 0.3)
  if (summary.seasonStage === 'PEAK') score += 25
  else if (summary.seasonStage === 'EARLY') score += 18
  else if (summary.seasonStage === 'LATE') score += 12
  else if (summary.seasonStage === 'UPCOMING') score += 5
  if (priceTrend.direction === 'DOWN') score += 10
  else if (priceTrend.direction === 'STABLE') score += 6
  else if (priceTrend.direction === 'UP') score += 2
  if (supplyTrend.direction === 'UP') score += 5
  else if (supplyTrend.direction === 'DOWN') score -= 5

  return Math.max(0, Math.min(100, Math.round(score)))
}

function headlineFor(crop, summary, priceTrend, supplyTrend, worthTheDriveScore) {
  if (summary.activeFarmCount === 0) {
    return `${crop.name} is not showing active U-pick supply yet.`
  }

  if (summary.seasonStage === 'PEAK') {
    return `${crop.name} is at peak with ${summary.activeFarmCount} active farms near ${summary.bestRegion || 'the region'}.`
  }

  if (summary.seasonStage === 'EARLY') {
    return `${crop.name} is starting, with ${summary.activeFarmCount} farms reporting availability.`
  }

  if (summary.seasonStage === 'LATE') {
    return `${crop.name} is winding down, so check freshness before driving.`
  }

  if (supplyTrend.direction === 'COMING_SOON') {
    return `${crop.name} is coming soon; nearby farms have season windows ahead.`
  }

  if (worthTheDriveScore >= 75) {
    return `${crop.name} looks worth the trip based on supply, price, and freshness signals.`
  }

  if (priceTrend.direction === 'UP') {
    return `${crop.name} prices are trending higher, so compare farms before choosing a route.`
  }

  return `${crop.name} has ${summary.activeFarmCount} active farm signal${summary.activeFarmCount === 1 ? '' : 's'} right now.`
}

function recommendationFor(signal) {
  if (signal.worthTheDriveScore >= 80) return 'GO_NOW'
  if (signal.worthTheDriveScore >= 60) return 'GOOD_OPTION'
  if (signal.supplyTrend.direction === 'COMING_SOON') return 'WAIT'
  if (signal.seasonStage === 'ENDED') return 'SKIP'
  return 'CHECK_DETAILS'
}

function buildSignal(crop, asOfDate = new Date()) {
  const summary = calculateHarvestSummary(crop, asOfDate)
  const priceTrend = priceTrendFor(crop, asOfDate)
  const supplyTrend = supplyTrendFor(crop, asOfDate)
  const timeline = harvestTimelineFor(crop)
  const reportHistory = reportHistoryFor(crop)
  const worthTheDriveScore = worthTheDriveScoreFor({ summary, priceTrend, supplyTrend })
  const headline = headlineFor(crop, summary, priceTrend, supplyTrend, worthTheDriveScore)
  const signal = {
    crop: {
      id: crop.id,
      slug: crop.slug,
      name: crop.name,
      category: crop.category,
      icon: crop.icon,
      color: crop.color,
    },
    headline,
    seasonStage: summary.seasonStage,
    activeFarmCount: summary.activeFarmCount,
    averagePrice: summary.averagePrice,
    bestRegion: summary.bestRegion,
    confidence: summary.confidence,
    reportFreshness: summary.reportFreshness,
    worthTheDriveScore,
    priceTrend,
    supplyTrend,
    timeline,
    reportHistory,
  }

  return {
    ...signal,
    recommendation: recommendationFor(signal),
  }
}

function createHarvestSignalsService(harvestRepository) {
  async function loadSignals(asOfDate = new Date()) {
    const crops = await harvestRepository.findHarvestCrops()
    return crops.map((crop) => buildSignal(crop, asOfDate))
  }

  return {
    buildSignal,

    async getSignals({ asOfDate = new Date() } = {}) {
      const signals = await loadSignals(asOfDate)
      return {
        data: signals
          .map((signal) => ({
            crop: signal.crop,
            headline: signal.headline,
            seasonStage: signal.seasonStage,
            activeFarmCount: signal.activeFarmCount,
            averagePrice: signal.averagePrice,
            bestRegion: signal.bestRegion,
            confidence: signal.confidence,
            worthTheDriveScore: signal.worthTheDriveScore,
            recommendation: signal.recommendation,
          }))
          .sort((first, second) => second.worthTheDriveScore - first.worthTheDriveScore || first.crop.name.localeCompare(second.crop.name)),
      }
    },

    async getTrends({ asOfDate = new Date() } = {}) {
      const signals = await loadSignals(asOfDate)
      return {
        data: signals.map((signal) => ({
          crop: signal.crop,
          headline: signal.headline,
          priceTrend: signal.priceTrend,
          supplyTrend: signal.supplyTrend,
          reportHistory: signal.reportHistory,
        })),
      }
    },

    async getTimeline({ asOfDate = new Date() } = {}) {
      const signals = await loadSignals(asOfDate)
      return {
        data: signals.map((signal) => ({
          crop: signal.crop,
          seasonStage: signal.seasonStage,
          timeline: signal.timeline,
          supplyTrend: signal.supplyTrend,
        })),
      }
    },
  }
}

module.exports = {
  createHarvestSignalsService,
  buildSignal,
}
