require('dotenv').config()

const { prisma } = require('../src/db/prisma')
const { createHarvestRepository } = require('../src/repositories/harvestRepository')
const { createHarvestRadarService } = require('../src/services/harvestRadarService')

const REVIEWED_AT = new Date('2026-07-08T09:00:00.000-07:00')
const NEXT_PICKING_START = new Date('2026-07-11T08:00:00.000-07:00')
const NEXT_PICKING_END = new Date('2026-07-11T13:00:00.000-07:00')
const STRAWBERRY_SEASON_END = new Date('2026-12-31T08:00:00.000-08:00')
const SOURCE_URL = 'https://harvoldberryfarm.com/'

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
    verificationMethod: input.verificationMethod || 'manual_official_website_review',
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
    verificationMethod: 'manual_official_update_review',
    isVerified: true,
    verifiedAt: REVIEWED_AT,
  }

  return existing
    ? prisma.specialHour.update({ where: { id: existing.id }, data })
    : prisma.specialHour.create({ data })
}

async function main() {
  const farm = await prisma.farm.findUnique({
    where: { slug: 'harvold-berry-farm' },
    include: { farmCrops: { include: { crop: true } } },
  })
  if (!farm) throw new Error('Harvold farm not found')

  const strawberry = cropRow(farm, 'strawberry')
  const raspberry = cropRow(farm, 'raspberry')

  await prisma.farm.update({
    where: { id: farm.id },
    data: {
      lastVerifiedAt: REVIEWED_AT,
      status: 'ACTIVE',
      reviewStatus: 'APPROVED',
      isVerified: true,
    },
  })

  const strawberryReport = await upsertReport({
    farmId: farm.id,
    farmCropId: strawberry.id,
    cropId: strawberry.cropId,
    condition: 'SEASON_OVER',
    rating: 1,
    sourceUrl: SOURCE_URL,
    comment: 'Official homepage update says strawberry season is closed for 2026.',
    expiresAt: STRAWBERRY_SEASON_END,
    createdAt: REVIEWED_AT,
  })
  await retireOtherReports(strawberry.id, strawberryReport.id)

  const raspberryReport = await upsertReport({
    farmId: farm.id,
    farmCropId: raspberry.id,
    cropId: raspberry.cropId,
    condition: 'CLOSED',
    rating: 2,
    sourceUrl: SOURCE_URL,
    comment: 'Official homepage update says raspberry is closed, with next picking Saturday July 11 at 5207 Carnation-Duvall Rd NE. Official update graphic says 8 AM to 1 PM or picked out, whichever comes first.',
    expiresAt: NEXT_PICKING_START,
    createdAt: REVIEWED_AT,
  })
  await retireOtherReports(raspberry.id, raspberryReport.id)

  await upsertSpecialHour({
    farmId: farm.id,
    date: date('2026-07-11'),
    openTime: time('08:00'),
    closeTime: time('13:00'),
    isClosed: false,
    reason: 'Next raspberry picking window',
  })

  await upsertEvidence({
    farmId: farm.id,
    farmCropId: strawberry.id,
    cropId: strawberry.cropId,
    evidenceType: 'HARVEST_STATUS',
    fieldName: 'strawberry_current_status',
    value: 'Strawberry season is closed for 2026.',
    normalizedValue: { condition: 'SEASON_OVER' },
    sourceName: 'Harvold Berry Farm official homepage',
    sourceUrl: SOURCE_URL,
    sourceType: 'OFFICIAL_WEBSITE',
    confidenceScore: 96,
    observedAt: REVIEWED_AT,
    verifiedAt: REVIEWED_AT,
    expiresAt: STRAWBERRY_SEASON_END,
    verificationMethod: 'manual_official_website_review',
  })

  await upsertEvidence({
    farmId: farm.id,
    farmCropId: raspberry.id,
    cropId: raspberry.cropId,
    evidenceType: 'CROP_AVAILABILITY',
    fieldName: 'raspberry_current_status',
    value: 'Raspberry is closed; next picking is Saturday July 11 at 5207 Carnation-Duvall Rd NE.',
    normalizedValue: {
      condition: 'CLOSED',
      nextPickingDate: '2026-07-11',
      nextPickingStartTime: '08:00',
      nextPickingEndTime: '13:00',
      fieldAddress: '5207 Carnation-Duvall Rd NE, Carnation, WA 98014',
      closesWhenPickedOut: true,
    },
    sourceName: 'Harvold Berry Farm official homepage',
    sourceUrl: SOURCE_URL,
    sourceType: 'OFFICIAL_WEBSITE',
    confidenceScore: 96,
    observedAt: REVIEWED_AT,
    verifiedAt: REVIEWED_AT,
    expiresAt: NEXT_PICKING_START,
    verificationMethod: 'manual_official_website_review',
    notes: 'Homepage confirms next picking date/location; product-provided official update graphic confirms 8 AM to 1 PM or picked out, whichever comes first.',
  })

  await upsertEvidence({
    farmId: farm.id,
    farmCropId: raspberry.id,
    cropId: raspberry.cropId,
    evidenceType: 'HOURS',
    fieldName: 'raspberry_next_picking_hours',
    value: 'Next raspberry picking Saturday July 11, 8 AM to 1 PM or picked out, whichever comes first.',
    normalizedValue: {
      date: '2026-07-11',
      openTime: '08:00',
      closeTime: '13:00',
      closesWhenPickedOut: true,
    },
    sourceName: 'Harvold Berry Farm official update graphic',
    sourceUrl: SOURCE_URL,
    sourceType: 'ADMIN_RESEARCH',
    confidenceScore: 92,
    observedAt: REVIEWED_AT,
    verifiedAt: REVIEWED_AT,
    expiresAt: NEXT_PICKING_END,
    verificationMethod: 'manual_official_update_graphic_review',
  })

  await upsertAnnouncement({
    farmId: farm.id,
    title: 'Next raspberry picking Saturday July 11',
    body: 'Official update: raspberry is closed now. Next raspberry picking is Saturday July 11 from 8 AM to 1 PM at 5207 Carnation-Duvall Rd NE, or until picked out. Strawberry season is closed for 2026.',
    sourceUrl: SOURCE_URL,
    startsAt: REVIEWED_AT,
    endsAt: NEXT_PICKING_END,
  })

  await prisma.announcement.updateMany({
    where: {
      farmId: farm.id,
      title: { not: 'Next raspberry picking Saturday July 11' },
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
      nextReviewAt: NEXT_PICKING_START,
      confidence: 96,
      sourceCount: 3,
      sourceUrls: ['https://harvoldberryfarm.com/', 'https://harvoldberryfarm.com/location-%26-price', 'https://harvoldberryfarm.com/contact-us'],
      manualNotes: 'Official homepage reviewed July 8, 2026. Strawberry season is closed for 2026. Raspberry is closed now with next picking Saturday July 11, 8 AM-1 PM or picked out.',
      completenessScore: 89,
      completenessJson: { address: true, gps: true, website: true, phone: true, hours: true, prices: true, amenities: true, photos: false, reports: true, cropAvailability: true },
      missingFieldsJson: ['licensed photos'],
      lowConfidenceJson: ['amenity'],
      personalityJson: { bestFor: ['Family Friendly', 'Quick Berry Trip', 'Photography'], knownFor: ['Fresh Strawberries', 'Raspberries', 'Sunflowers'] },
      galleryImagesJson: [],
      photoAttribution: 'Photo placeholder until real farm photos are licensed or owner-provided.',
    },
    update: {
      lastResearchedAt: REVIEWED_AT,
      nextReviewAt: NEXT_PICKING_START,
      confidence: 96,
      manualNotes: 'Official homepage reviewed July 8, 2026. Strawberry season is closed for 2026. Raspberry is closed now with next picking Saturday July 11, 8 AM-1 PM or picked out.',
      sourceCount: 3,
      sourceUrls: ['https://harvoldberryfarm.com/', 'https://harvoldberryfarm.com/location-%26-price', 'https://harvoldberryfarm.com/contact-us'],
      completenessJson: { address: true, gps: true, website: true, phone: true, hours: true, prices: true, amenities: true, photos: false, reports: true, cropAvailability: true },
      missingFieldsJson: ['licensed photos'],
      lowConfidenceJson: ['amenity'],
    },
  })

  const harvestRadarService = createHarvestRadarService(createHarvestRepository(prisma))
  const summaries = await harvestRadarService.recalculateAll(REVIEWED_AT)

  console.log(JSON.stringify({
    reviewedAt: REVIEWED_AT.toISOString(),
    farmUpdated: 'harvold-berry-farm',
    currentReports: ['strawberry: SEASON_OVER', 'raspberry: CLOSED'],
    nextRaspberryPicking: '2026-07-11 08:00-13:00 America/Los_Angeles',
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
