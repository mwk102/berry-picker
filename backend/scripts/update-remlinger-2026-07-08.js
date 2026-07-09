require('dotenv').config()

const { prisma } = require('../src/db/prisma')
const { createHarvestRepository } = require('../src/repositories/harvestRepository')
const { createHarvestRadarService } = require('../src/services/harvestRadarService')

const REVIEWED_AT = new Date('2026-07-08T09:00:00.000-07:00')
const PICKING_ENDS_AT = new Date('2026-07-08T17:00:00.000-07:00')
const REVIEW_EXPIRES_AT = new Date('2026-07-09T08:00:00.000-07:00')
const SOURCE_URL = 'https://remlingerfarms.com/upick-pumpkin-patch/'

function date(value) {
  return new Date(`${value}T00:00:00.000Z`)
}

function time(value) {
  return new Date(`1970-01-01T${value}:00.000Z`)
}

function cropRow(farm, cropSlug) {
  const farmCrop = farm.farmCrops.find((candidate) => candidate.crop.slug === cropSlug)
  if (!farmCrop) throw new Error(`Farm crop not found: ${farm.slug}/${cropSlug}`)
  return farmCrop
}

async function upsertReport(input) {
  const existing = await prisma.pickingReport.findFirst({
    where: {
      farmId: input.farmId,
      farmCropId: input.farmCropId,
      cropId: input.cropId,
      sourceUrl: input.sourceUrl,
      comment: input.comment,
    },
  })

  const data = {
    ...input,
    userId: null,
    source: 'ADMIN',
    crowdLevel: 'UNKNOWN',
    verificationMethod: 'manual_official_website_review',
    isVerified: true,
    isApproved: true,
    verifiedAt: REVIEWED_AT,
  }

  return existing
    ? prisma.pickingReport.update({ where: { id: existing.id }, data })
    : prisma.pickingReport.create({ data })
}

async function retireOtherReports(farmCropId, keepReportId) {
  return prisma.pickingReport.updateMany({
    where: {
      farmCropId,
      isApproved: true,
      id: { not: keepReportId },
    },
    data: {
      isApproved: false,
      expiresAt: REVIEWED_AT,
    },
  })
}

async function upsertEvidence(input) {
  const existing = await prisma.evidence.findFirst({
    where: {
      farmId: input.farmId,
      farmCropId: input.farmCropId || null,
      evidenceType: input.evidenceType,
      fieldName: input.fieldName,
      sourceUrl: input.sourceUrl,
      observedAt: input.observedAt,
    },
  })

  const data = {
    ...input,
    farmCropId: input.farmCropId || null,
    cropId: input.cropId || null,
    verifiedAt: input.verifiedAt || null,
    expiresAt: input.expiresAt || null,
    notes: input.notes || null,
  }

  return existing
    ? prisma.evidence.update({ where: { id: existing.id }, data })
    : prisma.evidence.create({ data })
}

async function upsertSpecialHour(input) {
  const existing = await prisma.specialHour.findFirst({
    where: {
      farmId: input.farmId,
      date: input.date,
      reason: input.reason,
    },
  })

  const data = {
    ...input,
    source: 'FARM_WEBSITE',
    sourceUrl: SOURCE_URL,
    verificationMethod: 'manual_official_website_review',
    isVerified: true,
    verifiedAt: REVIEWED_AT,
  }

  return existing
    ? prisma.specialHour.update({ where: { id: existing.id }, data })
    : prisma.specialHour.create({ data })
}

async function upsertAnnouncement(input) {
  const existing = await prisma.announcement.findFirst({
    where: {
      farmId: input.farmId,
      title: input.title,
      sourceUrl: input.sourceUrl,
    },
  })

  const data = {
    ...input,
    type: 'HARVEST',
    source: 'FARM_WEBSITE',
    verificationMethod: 'manual_official_website_review',
    isVerified: true,
    isPublished: true,
    verifiedAt: REVIEWED_AT,
  }

  return existing
    ? prisma.announcement.update({ where: { id: existing.id }, data })
    : prisma.announcement.create({ data })
}

async function main() {
  const farm = await prisma.farm.findUnique({
    where: { slug: 'remlinger-farms' },
    include: { farmCrops: { include: { crop: true } } },
  })
  if (!farm) throw new Error('Remlinger farm not found')

  const raspberry = cropRow(farm, 'raspberry')
  const strawberry = cropRow(farm, 'strawberry')
  const pumpkin = cropRow(farm, 'pumpkin')

  await prisma.farm.update({
    where: { id: farm.id },
    data: {
      lastVerifiedAt: REVIEWED_AT,
      status: 'ACTIVE',
      isVerified: true,
      reviewStatus: 'APPROVED',
    },
  })

  const raspberryReport = await upsertReport({
    farmId: farm.id,
    farmCropId: raspberry.id,
    cropId: raspberry.cropId,
    condition: 'GOOD',
    rating: 4,
    sourceUrl: SOURCE_URL,
    comment: 'Official U-pick page and official update graphic list raspberry U-pick open Wednesday July 8 from 9:00 AM to 5:00 PM.',
    expiresAt: PICKING_ENDS_AT,
    createdAt: REVIEWED_AT,
  })
  await retireOtherReports(raspberry.id, raspberryReport.id)

  const strawberryReport = await upsertReport({
    farmId: farm.id,
    farmCropId: strawberry.id,
    cropId: strawberry.cropId,
    condition: 'SEASON_OVER',
    rating: 1,
    sourceUrl: SOURCE_URL,
    comment: 'Official U-pick page lists strawberry U-pick as closed for the season.',
    expiresAt: new Date('2026-12-31T08:00:00.000-08:00'),
    createdAt: REVIEWED_AT,
  })
  await retireOtherReports(strawberry.id, strawberryReport.id)

  const pumpkinReport = await upsertReport({
    farmId: farm.id,
    farmCropId: pumpkin.id,
    cropId: pumpkin.cropId,
    condition: 'COMING_SOON',
    rating: 2,
    sourceUrl: SOURCE_URL,
    comment: 'Official U-pick page lists pumpkin U-pick as closed for the season and expected back in September 2026.',
    expiresAt: new Date('2026-09-01T08:00:00.000-07:00'),
    createdAt: REVIEWED_AT,
  })
  await retireOtherReports(pumpkin.id, pumpkinReport.id)

  await upsertSpecialHour({
    farmId: farm.id,
    date: date('2026-07-08'),
    openTime: time('09:00'),
    closeTime: time('17:00'),
    isClosed: false,
    reason: 'Raspberry U-pick open July 8',
  })

  await upsertEvidence({
    farmId: farm.id,
    farmCropId: raspberry.id,
    cropId: raspberry.cropId,
    evidenceType: 'CROP_AVAILABILITY',
    fieldName: 'raspberry_current_status',
    value: 'Raspberry U-pick open Wednesday July 8 from 9:00 AM to 5:00 PM.',
    normalizedValue: {
      condition: 'GOOD',
      openDate: '2026-07-08',
      openTime: '09:00',
      closeTime: '17:00',
    },
    sourceName: 'Remlinger Farms official U-pick page',
    sourceUrl: SOURCE_URL,
    sourceType: 'OFFICIAL_WEBSITE',
    confidenceScore: 96,
    observedAt: REVIEWED_AT,
    verifiedAt: REVIEWED_AT,
    expiresAt: PICKING_ENDS_AT,
    verificationMethod: 'manual_official_website_review',
    notes: 'Product-provided official update graphic also lists raspberry U-pick open Wednesday July 8, 9:00 AM to 5:00 PM.',
  })

  await upsertEvidence({
    farmId: farm.id,
    farmCropId: raspberry.id,
    cropId: raspberry.cropId,
    evidenceType: 'HOURS',
    fieldName: 'raspberry_july_8_hours',
    value: 'Raspberry U-pick open Wednesday July 8, 9:00 AM to 5:00 PM.',
    normalizedValue: {
      date: '2026-07-08',
      openTime: '09:00',
      closeTime: '17:00',
    },
    sourceName: 'Remlinger Farms official update graphic',
    sourceUrl: SOURCE_URL,
    sourceType: 'ADMIN_RESEARCH',
    confidenceScore: 94,
    observedAt: REVIEWED_AT,
    verifiedAt: REVIEWED_AT,
    expiresAt: PICKING_ENDS_AT,
    verificationMethod: 'manual_official_update_graphic_review',
  })

  await upsertEvidence({
    farmId: farm.id,
    farmCropId: strawberry.id,
    cropId: strawberry.cropId,
    evidenceType: 'HARVEST_STATUS',
    fieldName: 'strawberry_current_status',
    value: 'Strawberry U-pick is closed for the season.',
    normalizedValue: { condition: 'SEASON_OVER' },
    sourceName: 'Remlinger Farms official U-pick page',
    sourceUrl: SOURCE_URL,
    sourceType: 'OFFICIAL_WEBSITE',
    confidenceScore: 96,
    observedAt: REVIEWED_AT,
    verifiedAt: REVIEWED_AT,
    expiresAt: new Date('2026-12-31T08:00:00.000-08:00'),
    verificationMethod: 'manual_official_website_review',
  })

  await upsertAnnouncement({
    farmId: farm.id,
    title: 'Raspberry U-pick open Wednesday July 8',
    body: 'Official update listed raspberry U-pick for Wednesday July 8 from 9:00 AM to 5:00 PM. Recheck for the next picking window after this same-day update. Strawberry U-pick is closed for the season; pumpkin U-pick is expected back in September.',
    sourceUrl: SOURCE_URL,
    startsAt: REVIEWED_AT,
    endsAt: REVIEW_EXPIRES_AT,
  })

  await prisma.announcement.updateMany({
    where: {
      farmId: farm.id,
      title: { not: 'Raspberry U-pick open Wednesday July 8' },
      isPublished: true,
    },
    data: {
      isPublished: false,
      endsAt: REVIEWED_AT,
    },
  })

  await prisma.farmVerificationProfile.upsert({
    where: { farmId: farm.id },
    create: {
      farmId: farm.id,
      status: 'GOLD_STANDARD',
      lastResearchedAt: REVIEWED_AT,
      nextReviewAt: REVIEW_EXPIRES_AT,
      confidence: 92,
      sourceCount: 3,
      sourceUrls: ['https://remlingerfarms.com/', SOURCE_URL, 'https://www.openstreetmap.org/way/796849039'],
      manualNotes: 'Official U-pick page reviewed July 8, 2026. Raspberry U-pick open Wednesday July 8 from 9 AM to 5 PM. Recheck after the same-day picking window.',
      completenessScore: 86,
      completenessJson: { address: true, gps: true, website: true, phone: true, hours: true, prices: false, amenities: true, photos: false, reports: true, cropAvailability: true },
      missingFieldsJson: ['current raspberry price', 'licensed photos'],
      lowConfidenceJson: ['price'],
      personalityJson: { bestFor: ['Family Friendly', 'Large Groups', 'Weekend Farm Trip'], knownFor: ['Raspberries', 'Pumpkin Patch', 'Family Fun Park'] },
      galleryImagesJson: [],
      photoAttribution: 'Photo placeholder until real farm photos are licensed or owner-provided.',
    },
    update: {
      lastResearchedAt: REVIEWED_AT,
      nextReviewAt: REVIEW_EXPIRES_AT,
      confidence: 92,
      manualNotes: 'Official U-pick page reviewed July 8, 2026. Raspberry U-pick open Wednesday July 8 from 9 AM to 5 PM. Recheck after the same-day picking window.',
      sourceCount: 3,
      sourceUrls: ['https://remlingerfarms.com/', SOURCE_URL, 'https://www.openstreetmap.org/way/796849039'],
      completenessJson: { address: true, gps: true, website: true, phone: true, hours: true, prices: false, amenities: true, photos: false, reports: true, cropAvailability: true },
      missingFieldsJson: ['current raspberry price', 'licensed photos'],
      lowConfidenceJson: ['price'],
    },
  })

  const harvestRadarService = createHarvestRadarService(createHarvestRepository(prisma))
  const summaries = await harvestRadarService.recalculateAll(REVIEWED_AT)

  console.log(JSON.stringify({
    reviewedAt: REVIEWED_AT.toISOString(),
    farmUpdated: 'remlinger-farms',
    currentReports: ['raspberry: GOOD', 'strawberry: SEASON_OVER', 'pumpkin: COMING_SOON'],
    raspberryWindow: '2026-07-08 09:00-17:00 America/Los_Angeles',
    harvestSummariesRecalculated: summaries.length,
  }, null, 2))
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
