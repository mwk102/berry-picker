function dateKeyInPacific(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${value.year}-${value.month}-${value.day}`
}

function dateOnly(date = new Date()) {
  return new Date(`${dateKeyInPacific(date)}T00:00:00.000Z`)
}

function startOfPacificDay(date = new Date()) {
  return new Date(`${dateKeyInPacific(date)}T00:00:00.000-07:00`)
}

function endOfPacificDay(date = new Date()) {
  const start = startOfPacificDay(date)
  return new Date(start.getTime() + 24 * 60 * 60 * 1000)
}

function cropName(crop) {
  return crop?.name || 'Crop'
}

function farmName(farm) {
  return farm?.name || 'Farm'
}

const PUBLIC_EVENT_TYPES = new Set([
  'CROP_ENTERED_PEAK',
  'CROP_ENDING_SOON',
  'CROP_SEASON_OVER',
  'FARM_REOPENED',
  'FARM_CLOSED',
  'PRICE_CHANGED',
  'FRESH_REPORT_RECEIVED',
  'RECOMMENDATION_CHANGED',
  'WEATHER_NOTE',
  'GENERAL',
])

function formatEventType(value) {
  return value.replace(/_/g, ' ').toLowerCase().replace(/^./, (letter) => letter.toUpperCase())
}

function formatConditionLabel(value) {
  const labels = {
    EXCELLENT: 'excellent availability update',
    GOOD: 'good availability update',
    LIMITED: 'limited availability update',
    COMING_SOON: 'coming-soon update',
    CLOSED: 'closed update',
    PICKED_OVER: 'picked-over update',
    SEASON_OVER: 'season-over update',
    UNKNOWN: 'status update',
  }
  return labels[value] || 'status update'
}

function humanizeFieldName(value) {
  if (!value) return 'Source data'
  return value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function isPublicEvent(event) {
  return PUBLIC_EVENT_TYPES.has(event.eventType)
}

function serializeSummary(summary) {
  if (!summary) return null
  return {
    id: summary.id,
    summaryDate: summary.summaryDate,
    region: summary.region,
    headline: summary.headline,
    body: summary.body,
    highlights: summary.highlightsJson || [],
    recommendedFarm: summary.recommendedFarm
      ? {
          id: summary.recommendedFarm.id,
          slug: summary.recommendedFarm.slug,
          name: summary.recommendedFarm.name,
          city: summary.recommendedFarm.city,
        }
      : null,
    recommendedCrop: summary.recommendedCrop
      ? {
          id: summary.recommendedCrop.id,
          slug: summary.recommendedCrop.slug,
          name: summary.recommendedCrop.name,
        }
      : null,
    confidenceScore: summary.confidenceScore,
    freshnessScore: summary.freshnessScore,
    generatedAt: summary.generatedAt,
  }
}

function serializeEvent(event) {
  return {
    id: event.id,
    eventDate: event.eventDate,
    eventType: event.eventType,
    title: event.title,
    description: event.description,
    confidenceScore: event.confidenceScore,
    farm: event.farm
      ? {
          id: event.farm.id,
          slug: event.farm.slug,
          name: event.farm.name,
          city: event.farm.city,
        }
      : null,
    crop: event.crop
      ? {
          id: event.crop.id,
          slug: event.crop.slug,
          name: event.crop.name,
        }
      : null,
    sourceEvidenceId: event.sourceEvidenceId,
    createdAt: event.createdAt,
  }
}

function recommendationScore(report) {
  const conditionScore = {
    EXCELLENT: 45,
    GOOD: 38,
    LIMITED: 26,
    COMING_SOON: 8,
    UNKNOWN: 4,
    CLOSED: -20,
    PICKED_OVER: -25,
    SEASON_OVER: -30,
  }[report.condition] || 0

  return (
    conditionScore +
    (report.isVerified ? 18 : 6) +
    Math.min(20, report.rating ? report.rating * 4 : 8) +
    (report.farm?.isVerified ? 10 : 0)
  )
}

function createDailyHarvestService(prisma, harvestRadarService) {
  async function upsertEvent(input) {
    const existing = await prisma.harvestEvent.findFirst({
      where: {
        eventDate: input.eventDate,
        eventType: input.eventType,
        farmId: input.farmId || null,
        cropId: input.cropId || null,
        title: input.title,
      },
    })

    const data = {
      eventDate: input.eventDate,
      eventType: input.eventType,
      farmId: input.farmId || null,
      cropId: input.cropId || null,
      title: input.title,
      description: input.description,
      sourceEvidenceId: input.sourceEvidenceId || null,
      confidenceScore: input.confidenceScore,
    }

    return existing
      ? prisma.harvestEvent.update({ where: { id: existing.id }, data })
      : prisma.harvestEvent.create({ data })
  }

  async function generateEvents({ asOfDate = new Date() } = {}) {
    const eventDate = dateOnly(asOfDate)
    const dayStart = startOfPacificDay(asOfDate)
    const dayEnd = endOfPacificDay(asOfDate)
    const summaries = await harvestRadarService.recalculateAll(asOfDate)
    const todayReports = await prisma.pickingReport.findMany({
      where: {
        isApproved: true,
        createdAt: { gte: dayStart, lt: dayEnd },
      },
      include: { farm: true, crop: true },
      orderBy: [{ createdAt: 'desc' }],
    })
    const expiredEvidence = await prisma.evidence.findMany({
      where: {
        expiresAt: { lt: asOfDate },
        evidenceType: { in: ['CROP_AVAILABILITY', 'HARVEST_STATUS', 'PRICE', 'HOURS'] },
        farm: { isActive: true, reviewStatus: 'APPROVED' },
      },
      include: { farm: true, crop: true },
      orderBy: [{ expiresAt: 'desc' }],
      take: 20,
    })

    const eventInputs = []

    for (const summary of summaries.filter((item) => item.activeFarmCount > 0)) {
      if (summary.seasonStage === 'PEAK') {
        eventInputs.push({
          eventDate,
          cropId: summary.crop.id,
          eventType: 'CROP_ENTERED_PEAK',
          title: `${summary.crop.name} is showing peak-season signals`,
          description: `${summary.crop.name} has ${summary.activeFarmCount} active farm signal${summary.activeFarmCount === 1 ? '' : 's'} and ${summary.confidence}% confidence.`,
          confidenceScore: summary.confidence,
        })
      } else if (summary.seasonStage === 'LATE') {
        eventInputs.push({
          eventDate,
          cropId: summary.crop.id,
          eventType: 'CROP_ENDING_SOON',
          title: `${summary.crop.name} may be winding down`,
          description: `${summary.crop.name} is late in the season based on current farm crop windows.`,
          confidenceScore: summary.confidence,
        })
      }
    }

    for (const report of todayReports) {
      const base = {
        eventDate,
        farmId: report.farmId,
        cropId: report.cropId,
        confidenceScore: report.isVerified ? 90 : 70,
      }

      if (['GOOD', 'EXCELLENT', 'LIMITED'].includes(report.condition)) {
        eventInputs.push({
          ...base,
          eventType: 'FARM_REOPENED',
          title: `${cropName(report.crop)} update at ${farmName(report.farm)}`,
          description: report.comment || `${cropName(report.crop)} has a fresh picking report.`,
        })
      } else if (['CLOSED', 'PICKED_OVER'].includes(report.condition)) {
        eventInputs.push({
          ...base,
          eventType: 'FARM_CLOSED',
          title: `${cropName(report.crop)} closed at ${farmName(report.farm)}`,
          description: report.comment || `${cropName(report.crop)} is not currently available.`,
        })
      } else if (report.condition === 'SEASON_OVER') {
        eventInputs.push({
          ...base,
          eventType: 'CROP_SEASON_OVER',
          title: `${cropName(report.crop)} season over at ${farmName(report.farm)}`,
          description: report.comment || `${cropName(report.crop)} is over for the season at this farm.`,
        })
      }

      eventInputs.push({
        ...base,
        eventType: 'FRESH_REPORT_RECEIVED',
        title: `New ${cropName(report.crop)} status report`,
        description: `${farmName(report.farm)} has a new ${formatConditionLabel(report.condition)}.`,
      })
    }

    for (const evidence of expiredEvidence.slice(0, 8)) {
      const fieldName = humanizeFieldName(evidence.fieldName)
      const evidenceLabel = formatEventType(evidence.evidenceType)
      eventInputs.push({
        eventDate,
        farmId: evidence.farmId,
        cropId: evidence.cropId,
        eventType: 'EVIDENCE_EXPIRED',
        title: `${farmName(evidence.farm)} needs a ${fieldName} refresh`,
        description: `${evidenceLabel} evidence for ${farmName(evidence.farm)} is stale and should be reviewed before relying on it.`,
        sourceEvidenceId: evidence.id,
        confidenceScore: 80,
      })
    }

    const events = []
    for (const input of eventInputs) {
      events.push(await upsertEvent(input))
    }

    return events
  }

  async function recommendation(asOfDate = new Date()) {
    const recentCutoff = new Date(asOfDate.getTime() - 7 * 24 * 60 * 60 * 1000)
    const reports = await prisma.pickingReport.findMany({
      where: {
        isApproved: true,
        condition: { in: ['EXCELLENT', 'GOOD', 'LIMITED'] },
        createdAt: { gte: recentCutoff },
        OR: [{ expiresAt: null }, { expiresAt: { gte: asOfDate } }],
        farm: { isActive: true, reviewStatus: 'APPROVED' },
      },
      include: { farm: true, crop: true },
      orderBy: [{ createdAt: 'desc' }],
      take: 25,
    })

    return reports
      .map((report) => ({ report, score: recommendationScore(report) }))
      .sort((first, second) => second.score - first.score || new Date(second.report.createdAt) - new Date(first.report.createdAt))[0]
  }

  async function generateDailySummary({ asOfDate = new Date(), region = null } = {}) {
    const summaryDate = dateOnly(asOfDate)
    const events = await generateEvents({ asOfDate })
    const latestEvents = await prisma.harvestEvent.findMany({
      where: { eventDate: summaryDate },
      include: { farm: true, crop: true },
      orderBy: [{ createdAt: 'desc' }],
      take: 60,
    })
    const publicEvents = latestEvents.filter(isPublicEvent)
    const freshReportCount = publicEvents.filter((event) => event.eventType === 'FRESH_REPORT_RECEIVED').length
    const expiredCount = latestEvents.filter((event) => event.eventType === 'EVIDENCE_EXPIRED').length
    const peakEvent = publicEvents.find((event) => event.eventType === 'CROP_ENTERED_PEAK')
    const farmOpenEvent = publicEvents.find((event) => event.eventType === 'FARM_REOPENED')
    const rec = await recommendation(asOfDate)
    const publicRecommendation = farmOpenEvent
      ? {
          report: {
            farmId: farmOpenEvent.farmId,
            cropId: farmOpenEvent.cropId,
            farm: farmOpenEvent.farm,
            crop: farmOpenEvent.crop,
          },
          score: farmOpenEvent.confidenceScore || 75,
        }
      : rec
    const refreshDueCount = await prisma.evidence.count({
      where: {
        expiresAt: { lt: new Date(asOfDate.getTime() + 48 * 60 * 60 * 1000) },
        farm: { isActive: true, reviewStatus: 'APPROVED' },
      },
    })

    const headline = farmOpenEvent
      ? `${cropName(farmOpenEvent.crop)} has a fresh farm update today`
      : peakEvent
        ? `${cropName(peakEvent.crop)} is showing strong harvest signals`
        : freshReportCount > 0
          ? `${freshReportCount} fresh harvest report${freshReportCount === 1 ? '' : 's'} came in today`
          : 'Harvest Radar is ready for today'
    let body = rec
      ? `${cropName(rec.report.crop)} at ${farmName(rec.report.farm)} is today’s strongest signal, but check the farm source before driving. ${expiredCount > 0 ? `${expiredCount} evidence item${expiredCount === 1 ? '' : 's'} need refresh.` : 'Current data is source-backed where available.'}`
      : `No strong trip recommendation yet. ${refreshDueCount > 0 ? `${refreshDueCount} source check${refreshDueCount === 1 ? '' : 's'} are due soon.` : 'Refresh queue is quiet.'}`
    body = publicRecommendation
      ? `${cropName(publicRecommendation.report.crop)} at ${farmName(publicRecommendation.report.farm)} is today's strongest current signal. Confirm with the farm before driving because field conditions can change quickly.`
      : `No strong trip recommendation yet. ${refreshDueCount > 0 ? 'Several source checks are due soon, so recommendations are cautious.' : 'Refresh queue is quiet.'}`
    const highlights = publicEvents.slice(0, 4).map((event) => ({
      type: event.eventType,
      title: event.title,
      farmName: event.farm?.name || null,
      farmSlug: event.farm?.slug || null,
      cropName: event.crop?.name || null,
      cropSlug: event.crop?.slug || null,
    }))
    if (expiredCount > 0 && highlights.length < 5) {
      highlights.push({
        type: 'SOURCE_REFRESH_DUE',
        title: `${expiredCount} source check${expiredCount === 1 ? '' : 's'} need refresh`,
        farmName: null,
        farmSlug: null,
        cropName: null,
        cropSlug: null,
      })
    }
    const confidenceScore = Math.min(100, Math.round((publicRecommendation?.score || 35) + Math.min(20, freshReportCount * 4) - Math.min(15, expiredCount * 2)))
    const freshnessScore = Math.max(0, Math.min(100, 45 + Math.min(35, freshReportCount * 8) - Math.min(20, expiredCount * 3)))

    const existingSummary = await prisma.dailyHarvestSummary.findFirst({
      where: { summaryDate, region },
    })
    const summaryData = {
      headline,
      body,
      highlightsJson: highlights,
      recommendedFarmId: publicRecommendation?.report.farmId || null,
      recommendedCropId: publicRecommendation?.report.cropId || null,
      confidenceScore,
      freshnessScore,
      generatedAt: asOfDate,
    }
    const summary = existingSummary
      ? await prisma.dailyHarvestSummary.update({
          where: { id: existingSummary.id },
          data: summaryData,
          include: { recommendedFarm: true, recommendedCrop: true },
        })
      : await prisma.dailyHarvestSummary.create({
          data: {
            ...summaryData,
            summaryDate,
            region,
          },
          include: { recommendedFarm: true, recommendedCrop: true },
        })

    return {
      data: serializeSummary(summary),
      events: publicEvents.map(serializeEvent),
      meta: {
        createdEventCount: events.length,
        staleEvidenceCount: expiredCount,
        refreshDueCount,
      },
    }
  }

  async function getLatestDailySummary() {
    const summary = await prisma.dailyHarvestSummary.findFirst({
      include: { recommendedFarm: true, recommendedCrop: true },
      orderBy: [{ summaryDate: 'desc' }, { generatedAt: 'desc' }],
    })
    return { data: serializeSummary(summary) }
  }

  async function listEvents({ limit = 20, publicOnly = false } = {}) {
    const events = await prisma.harvestEvent.findMany({
      where: publicOnly
        ? {
            eventType: { in: Array.from(PUBLIC_EVENT_TYPES) },
            NOT: [{ title: { startsWith: 'Fresh ' } }],
          }
        : undefined,
      include: { farm: true, crop: true },
      orderBy: [{ eventDate: 'desc' }, { createdAt: 'desc' }],
      take: limit,
    })
    return { data: events.map(serializeEvent) }
  }

  async function getAdminCycle() {
    const today = dateOnly(new Date())
    const [summary, events, staleEvidenceCount, refreshDueCount] = await Promise.all([
      prisma.dailyHarvestSummary.findFirst({
        include: { recommendedFarm: true, recommendedCrop: true },
        orderBy: [{ summaryDate: 'desc' }, { generatedAt: 'desc' }],
      }),
      prisma.harvestEvent.findMany({
        where: { eventDate: today },
        include: { farm: true, crop: true },
        orderBy: [{ createdAt: 'desc' }],
        take: 20,
      }),
      prisma.evidence.count({ where: { expiresAt: { lt: new Date() }, farm: { isActive: true, reviewStatus: 'APPROVED' } } }),
      prisma.evidence.count({ where: { expiresAt: { lt: new Date(Date.now() + 48 * 60 * 60 * 1000) }, farm: { isActive: true, reviewStatus: 'APPROVED' } } }),
    ])
    return {
      data: {
        summary: serializeSummary(summary),
        events: events.map(serializeEvent),
        staleEvidenceCount,
        refreshDueCount,
      },
    }
  }

  return {
    generateDailySummary,
    getLatestDailySummary,
    listEvents,
    getAdminCycle,
  }
}

module.exports = { createDailyHarvestService }
