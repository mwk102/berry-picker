const { notFound } = require('../utils/errors')

const STALE_AFTER_MS = 1000 * 60 * 60

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

function average(numbers) {
  if (numbers.length === 0) return null
  return numbers.reduce((sum, value) => sum + value, 0) / numbers.length
}

function roundCurrency(value) {
  if (value === null) return null
  return Math.round(value * 100) / 100
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

  const daysIntoSeason = daysBetween(asOf, start)
  const totalSeasonDays = Math.max(daysBetween(end, start), 1)
  const progress = daysIntoSeason / totalSeasonDays

  return progress < 0.5 ? 'EARLY' : 'LATE'
}

function aggregateSeasonStage(stages) {
  if (stages.length === 0) return 'UNKNOWN'

  const counts = stages.reduce((memo, stage) => {
    memo[stage] = (memo[stage] || 0) + 1
    return memo
  }, {})
  const priority = ['PEAK', 'EARLY', 'LATE', 'UPCOMING', 'ENDED', 'UNKNOWN']

  return priority
    .map((stage) => ({ stage, count: counts[stage] || 0 }))
    .sort((first, second) => second.count - first.count || priority.indexOf(first.stage) - priority.indexOf(second.stage))[0]
    .stage
}

function bestRegionForFarmCrops(farmCrops) {
  const regionCounts = farmCrops.reduce((memo, farmCrop) => {
    const city = farmCrop.farm?.city || 'Unknown'
    memo[city] = (memo[city] || 0) + 1
    return memo
  }, {})

  return Object.entries(regionCounts)
    .sort(([firstCity, firstCount], [secondCity, secondCount]) =>
      secondCount - firstCount || firstCity.localeCompare(secondCity),
    )[0]?.[0] || null
}

function newestReportAgeDays(reports, asOfDate) {
  if (reports.length === 0) return null

  const newestReport = [...reports].sort(
    (first, second) => new Date(second.createdAt) - new Date(first.createdAt),
  )[0]

  return Math.max(0, daysBetween(asOfDate, newestReport.createdAt))
}

function confidenceFor({ activeFarmCount, priceCount, reportFreshness, seasonStage }) {
  let confidence = 0

  if (activeFarmCount > 0) confidence += Math.min(35, activeFarmCount * 8)
  if (priceCount > 0) confidence += Math.min(25, priceCount * 7)
  if (reportFreshness !== null) {
    if (reportFreshness <= 3) confidence += 25
    else if (reportFreshness <= 7) confidence += 18
    else if (reportFreshness <= 14) confidence += 10
    else confidence += 4
  }
  if (seasonStage === 'PEAK') confidence += 15
  else if (seasonStage === 'EARLY' || seasonStage === 'LATE') confidence += 10
  else if (seasonStage === 'UPCOMING') confidence += 5

  return Math.max(0, Math.min(100, confidence))
}

function calculateHarvestSummary(crop, asOfDate = new Date()) {
  const farmCrops = crop.farmCrops || []
  const activeFarmCount = farmCrops.length
  const currentPrices = (crop.cropPrices || []).filter((price) => isEffective(price, asOfDate))
  const priceAmounts = currentPrices.map((price) => decimalToNumber(price.amount)).filter((amount) => amount !== null)
  const seasonStages = farmCrops.map((farmCrop) => seasonStageForFarmCrop(farmCrop, asOfDate))
  const seasonStage = aggregateSeasonStage(seasonStages)
  const reportFreshness = newestReportAgeDays(crop.reports || [], asOfDate)
  const averagePrice = roundCurrency(average(priceAmounts))
  const confidence = confidenceFor({
    activeFarmCount,
    priceCount: priceAmounts.length,
    reportFreshness,
    seasonStage,
  })

  return {
    activeFarmCount,
    averagePrice,
    seasonStage,
    confidence,
    reportFreshness,
    bestRegion: bestRegionForFarmCrops(farmCrops),
    evidenceJson: {
      asOfDate: asOfDate.toISOString(),
      activeFarmSlugs: farmCrops.map((farmCrop) => farmCrop.farm?.slug).filter(Boolean).sort(),
      priceSampleCount: priceAmounts.length,
      reportCount: crop.reports?.length || 0,
      seasonStageCounts: seasonStages.reduce((memo, stage) => {
        memo[stage] = (memo[stage] || 0) + 1
        return memo
      }, {}),
    },
    calculatedAt: asOfDate,
  }
}

function serializeSummary(crop, summary) {
  return {
    crop: {
      id: crop.id,
      slug: crop.slug,
      name: crop.name,
      category: crop.category,
      icon: crop.icon,
      color: crop.color,
    },
    activeFarmCount: summary.activeFarmCount,
    averagePrice: decimalToNumber(summary.averagePrice),
    seasonStage: summary.seasonStage,
    confidence: summary.confidence,
    reportFreshness: summary.reportFreshness,
    bestRegion: summary.bestRegion,
    calculatedAt: summary.calculatedAt,
    evidence: summary.evidenceJson || null,
  }
}

function serializeDetailedHarvest(crop, summary) {
  return {
    ...serializeSummary(crop, summary),
    regions: Object.entries(
      (crop.farmCrops || []).reduce((memo, farmCrop) => {
        const city = farmCrop.farm?.city || 'Unknown'
        memo[city] = (memo[city] || 0) + 1
        return memo
      }, {}),
    )
      .map(([city, farmCount]) => ({ city, farmCount }))
      .sort((first, second) => second.farmCount - first.farmCount || first.city.localeCompare(second.city)),
    farms: (crop.farmCrops || []).map((farmCrop) => ({
      id: farmCrop.farm.id,
      slug: farmCrop.farm.slug,
      name: farmCrop.farm.name,
      city: farmCrop.farm.city,
      seasonStage: seasonStageForFarmCrop(farmCrop, summary.calculatedAt),
      seasonStartDate: farmCrop.seasonStartDate,
      seasonEndDate: farmCrop.seasonEndDate,
      peakStartDate: farmCrop.peakStartDate,
      peakEndDate: farmCrop.peakEndDate,
    })),
    recentReports: (crop.reports || []).slice(0, 5).map((report) => ({
      id: report.id,
      condition: report.condition,
      crowdLevel: report.crowdLevel,
      rating: report.rating,
      comment: report.comment,
      createdAt: report.createdAt,
      expiresAt: report.expiresAt,
    })),
  }
}

function summaryIsStale(summary, now) {
  if (!summary) return true
  return now - new Date(summary.calculatedAt) > STALE_AFTER_MS
}

function createHarvestRadarService(harvestRepository) {
  async function recalculateCrop(crop, asOfDate = new Date()) {
    const calculated = calculateHarvestSummary(crop, asOfDate)
    return harvestRepository.upsertSummary(crop.id, calculated)
  }

  return {
    calculateHarvestSummary,

    async recalculateAll(asOfDate = new Date()) {
      const crops = await harvestRepository.findHarvestCrops()
      const summaries = []

      for (const crop of crops) {
        const summary = await recalculateCrop(crop, asOfDate)
        summaries.push(serializeSummary(crop, summary))
      }

      return summaries
    },

    async listHarvestSummaries({ refresh = false, asOfDate = new Date() } = {}) {
      const crops = await harvestRepository.findHarvestCrops()
      const summaries = []

      for (const crop of crops) {
        const summary =
          refresh || summaryIsStale(crop.harvestSummary, asOfDate)
            ? await recalculateCrop(crop, asOfDate)
            : crop.harvestSummary
        summaries.push(serializeSummary(crop, summary))
      }

      return { data: summaries }
    },

    async getHarvestByCrop(slug, { refresh = false, asOfDate = new Date() } = {}) {
      const crop = await harvestRepository.findHarvestCropBySlug(slug)
      if (!crop) {
        throw notFound(`Harvest crop not found: ${slug}`)
      }

      const summary =
        refresh || summaryIsStale(crop.harvestSummary, asOfDate)
          ? await recalculateCrop(crop, asOfDate)
          : crop.harvestSummary

      return { data: serializeDetailedHarvest(crop, summary) }
    },
  }
}

module.exports = {
  createHarvestRadarService,
  calculateHarvestSummary,
}
