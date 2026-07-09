require('dotenv').config()

const { prisma } = require('../src/db/prisma')
const { createHarvestRepository } = require('../src/repositories/harvestRepository')
const { createHarvestRadarService } = require('../src/services/harvestRadarService')

const REVIEWED_AT = new Date('2026-07-07T09:00:00.000-07:00')
const TODAY_EOD = new Date('2026-07-08T08:00:00.000-07:00')
const REMLINGER_RASPBERRY_RECHECK = new Date('2026-07-10T08:00:00.000-07:00')
const BAILEY_UPDATE_EXPIRES = new Date('2026-07-09T08:00:00.000-07:00')
const HENNA_UPDATE_EXPIRES = new Date('2026-07-15T08:00:00.000-07:00')
const BELL_REVIEW_EXPIRES = new Date('2026-08-01T08:00:00.000-07:00')

function date(value) {
  return new Date(`${value}T00:00:00.000Z`)
}

function time(value) {
  return new Date(`1970-01-01T${value}:00.000Z`)
}

async function getFarm(slug) {
  const farm = await prisma.farm.findUnique({
    where: { slug },
    include: { farmCrops: { include: { crop: true } } },
  })

  if (!farm) throw new Error(`Farm not found: ${slug}`)
  return farm
}

function cropRow(farm, cropSlug) {
  const farmCrop = farm.farmCrops.find((candidate) => candidate.crop.slug === cropSlug)
  if (!farmCrop) throw new Error(`Farm crop not found: ${farm.slug}/${cropSlug}`)
  return farmCrop
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
    normalizedValue: input.normalizedValue || undefined,
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
    crowdLevel: input.crowdLevel || 'UNKNOWN',
    verificationMethod: input.verificationMethod || 'manual_official_website_review',
    isVerified: true,
    isApproved: true,
    verifiedAt: REVIEWED_AT,
  }

  return existing
    ? prisma.pickingReport.update({ where: { id: existing.id }, data })
    : prisma.pickingReport.create({ data })
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
    type: input.type || 'HARVEST',
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
    verificationMethod: 'manual_official_website_review',
    isVerified: true,
    verifiedAt: REVIEWED_AT,
  }

  return existing
    ? prisma.specialHour.update({ where: { id: existing.id }, data })
    : prisma.specialHour.create({ data })
}

async function upsertPrice(input) {
  const existing = await prisma.cropPrice.findFirst({
    where: {
      farmCropId: input.farmCropId,
      sourceUrl: input.sourceUrl,
      effectiveStartDate: input.effectiveStartDate,
      effectiveEndDate: input.effectiveEndDate,
    },
  })

  const data = {
    ...input,
    currency: 'USD',
    source: 'FARM_WEBSITE',
    verificationMethod: 'manual_official_website_review',
    isVerified: true,
    verifiedAt: REVIEWED_AT,
  }

  return existing
    ? prisma.cropPrice.update({ where: { id: existing.id }, data })
    : prisma.cropPrice.create({ data })
}

async function updateVerificationProfile(farm, input) {
  return prisma.farmVerificationProfile.upsert({
    where: { farmId: farm.id },
    create: {
      farmId: farm.id,
      status: input.status || 'GOLD_STANDARD',
      lastResearchedAt: REVIEWED_AT,
      nextReviewAt: input.nextReviewAt,
      confidence: input.confidence,
      sourceCount: input.sourceUrls.length,
      sourceUrls: input.sourceUrls,
      manualNotes: input.manualNotes,
      completenessScore: input.completenessScore,
      completenessJson: input.completenessJson,
      missingFieldsJson: input.missingFieldsJson,
      lowConfidenceJson: input.lowConfidenceJson || [],
      personalityJson: input.personalityJson,
      galleryImagesJson: [],
      photoAttribution: 'Photo placeholder until real farm photos are licensed or owner-provided.',
    },
    update: {
      status: input.status || 'GOLD_STANDARD',
      lastResearchedAt: REVIEWED_AT,
      nextReviewAt: input.nextReviewAt,
      confidence: input.confidence,
      sourceCount: input.sourceUrls.length,
      sourceUrls: input.sourceUrls,
      manualNotes: input.manualNotes,
      completenessScore: input.completenessScore,
      completenessJson: input.completenessJson,
      missingFieldsJson: input.missingFieldsJson,
      lowConfidenceJson: input.lowConfidenceJson || [],
      personalityJson: input.personalityJson,
      photoAttribution: 'Photo placeholder until real farm photos are licensed or owner-provided.',
    },
  })
}

async function markFarmReviewed(farm, data = {}) {
  return prisma.farm.update({
    where: { id: farm.id },
    data: {
      isVerified: true,
      reviewStatus: 'APPROVED',
      lastVerifiedAt: REVIEWED_AT,
      status: 'ACTIVE',
      ...data,
    },
  })
}

async function hideStaleDevelopmentAnnouncement(farmId) {
  return prisma.announcement.updateMany({
    where: {
      farmId,
      title: 'Development listing note',
    },
    data: {
      isPublished: false,
      endsAt: REVIEWED_AT,
    },
  })
}

async function retireOlderApprovedReports(farmId) {
  return prisma.pickingReport.updateMany({
    where: {
      farmId,
      createdAt: { lt: REVIEWED_AT },
      isApproved: true,
    },
    data: {
      isApproved: false,
      expiresAt: REVIEWED_AT,
    },
  })
}

async function retireOtherApprovedReports(farmCropId, keepReportId) {
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

async function retireStaleRemlingerRows(farmId) {
  await prisma.announcement.updateMany({
    where: {
      farmId,
      title: 'Raspberry U-pick last-day update',
    },
    data: {
      isPublished: false,
      endsAt: REVIEWED_AT,
    },
  })

  await prisma.specialHour.deleteMany({
    where: {
      farmId,
      OR: [
        { reason: 'Raspberry U-pick official last-day update' },
        { reason: 'Superseded by raspberry U-pick closure update' },
      ],
    },
  })
}

async function refreshRemlinger() {
  const farm = await getFarm('remlinger-farms')
  const raspberry = cropRow(farm, 'raspberry')
  const strawberry = cropRow(farm, 'strawberry')
  const pumpkin = cropRow(farm, 'pumpkin')
  const sourceUrl = 'https://remlingerfarms.com/upick-pumpkin-patch/'

  await markFarmReviewed(farm, {
    description: 'Reference farm in Carnation, WA with officially sourced U-pick raspberry, strawberry, and pumpkin information. Current crop status changes quickly, so time-sensitive details need frequent review.',
  })
  await hideStaleDevelopmentAnnouncement(farm.id)
  await retireOlderApprovedReports(farm.id)
  await retireStaleRemlingerRows(farm.id)
  await upsertSpecialHour({
    farmId: farm.id,
    date: date('2026-07-07'),
    openTime: null,
    closeTime: null,
    isClosed: true,
    reason: 'Raspberry U-pick closed for field rest and ripening',
    sourceUrl,
  })

  const closedRaspberryReport = await upsertReport({
    farmId: farm.id,
    farmCropId: raspberry.id,
    cropId: raspberry.cropId,
    condition: 'CLOSED',
    rating: 1,
    sourceUrl,
    comment: 'Official U-pick page and official Facebook update indicate raspberry U-pick is closed for the next few days while fields rest and ripen. Check for the next berry update before heading out.',
    expiresAt: REMLINGER_RASPBERRY_RECHECK,
    createdAt: REVIEWED_AT,
  })
  await retireOtherApprovedReports(raspberry.id, closedRaspberryReport.id)
  await upsertReport({
    farmId: farm.id,
    farmCropId: strawberry.id,
    cropId: strawberry.cropId,
    condition: 'SEASON_OVER',
    rating: 1,
    sourceUrl,
    comment: 'Official U-pick page listed strawberry U-pick as closed for the season.',
    expiresAt: new Date('2026-12-31T08:00:00.000-08:00'),
    createdAt: REVIEWED_AT,
  })
  await upsertReport({
    farmId: farm.id,
    farmCropId: pumpkin.id,
    cropId: pumpkin.cropId,
    condition: 'COMING_SOON',
    rating: 2,
    sourceUrl,
    comment: 'Official U-pick page listed pumpkin U-pick as closed for the season and expected back in September 2026.',
    expiresAt: new Date('2026-09-01T08:00:00.000-07:00'),
    createdAt: REVIEWED_AT,
  })

  await upsertEvidence({
    farmId: farm.id,
    farmCropId: raspberry.id,
    cropId: raspberry.cropId,
    evidenceType: 'CROP_AVAILABILITY',
    fieldName: 'raspberry_current_status',
    value: 'Raspberry U-pick is closed for the next few days while fields rest and ripen.',
    normalizedValue: { condition: 'CLOSED', reason: 'field_rest_and_ripening', recheckBy: '2026-07-10' },
    sourceName: 'Remlinger Farms official U-pick page',
    sourceUrl,
    sourceType: 'OFFICIAL_WEBSITE',
    confidenceScore: 94,
    observedAt: REVIEWED_AT,
    verifiedAt: REVIEWED_AT,
    expiresAt: REMLINGER_RASPBERRY_RECHECK,
    verificationMethod: 'manual_official_website_review',
    notes: 'Official Facebook post supplied by product review also says raspberry U-pick is closed for the next few days; use this as the current public status.',
  })
  await upsertEvidence({
    farmId: farm.id,
    farmCropId: raspberry.id,
    cropId: raspberry.cropId,
    evidenceType: 'CROP_AVAILABILITY',
    fieldName: 'raspberry_facebook_closure_update',
    value: 'Official Facebook update says raspberry U-pick is closed for the next few days while fields rest and ripen.',
    normalizedValue: { condition: 'CLOSED', reason: 'field_rest_and_ripening', sourceObservedDate: '2026-07-05' },
    sourceName: 'Remlinger Farms official Facebook page',
    sourceUrl: 'https://www.facebook.com/RemlingerFarms',
    sourceType: 'SOCIAL_MEDIA',
    confidenceScore: 92,
    observedAt: REVIEWED_AT,
    verifiedAt: REVIEWED_AT,
    expiresAt: REMLINGER_RASPBERRY_RECHECK,
    verificationMethod: 'manual_official_social_review',
    notes: 'Source text was provided by product review screenshot because Facebook content is not reliably fetchable in this environment.',
  })
  await upsertEvidence({
    farmId: farm.id,
    farmCropId: strawberry.id,
    cropId: strawberry.cropId,
    evidenceType: 'HARVEST_STATUS',
    fieldName: 'strawberry_current_status',
    value: 'Strawberry U-pick listed as closed for the season.',
    normalizedValue: { condition: 'SEASON_OVER' },
    sourceName: 'Remlinger Farms official U-pick page',
    sourceUrl,
    sourceType: 'OFFICIAL_WEBSITE',
    confidenceScore: 94,
    observedAt: REVIEWED_AT,
    verifiedAt: REVIEWED_AT,
    expiresAt: new Date('2026-12-31T08:00:00.000-08:00'),
    verificationMethod: 'manual_official_website_review',
  })
  await upsertEvidence({
    farmId: farm.id,
    farmCropId: pumpkin.id,
    cropId: pumpkin.cropId,
    evidenceType: 'HARVEST_STATUS',
    fieldName: 'pumpkin_current_status',
    value: 'Pumpkin U-pick listed as closed until September 2026.',
    normalizedValue: { condition: 'COMING_SOON', expectedMonth: '2026-09' },
    sourceName: 'Remlinger Farms official U-pick page',
    sourceUrl,
    sourceType: 'OFFICIAL_WEBSITE',
    confidenceScore: 90,
    observedAt: REVIEWED_AT,
    verifiedAt: REVIEWED_AT,
    expiresAt: new Date('2026-09-01T08:00:00.000-07:00'),
    verificationMethod: 'manual_official_website_review',
  })
  await upsertAnnouncement({
    farmId: farm.id,
    title: 'Raspberry U-pick temporarily closed',
    body: 'Official updates indicate raspberry U-pick is closed for the next few days while fields rest and ripen. Strawberry U-pick is closed for the season; pumpkin U-pick is expected back in September.',
    sourceUrl,
    startsAt: REVIEWED_AT,
    endsAt: REMLINGER_RASPBERRY_RECHECK,
  })
  await updateVerificationProfile(farm, {
    confidence: 91,
    completenessScore: 86,
    nextReviewAt: new Date('2026-07-10T08:00:00.000-07:00'),
    sourceUrls: ['https://remlingerfarms.com/', sourceUrl, 'https://www.openstreetmap.org/way/796849039'],
    manualNotes: 'Official U-pick page reviewed July 7, 2026. Product-provided official Facebook screenshot from July 5 says raspberry U-pick is closed for the next few days while fields rest and ripen. Recheck before recommending a raspberry trip.',
    completenessJson: { address: true, gps: true, website: true, phone: true, hours: true, prices: false, amenities: true, photos: false, reports: true, cropAvailability: true },
    missingFieldsJson: ['current raspberry price', 'licensed photos'],
    personalityJson: { bestFor: ['Family Friendly', 'Large Groups', 'Weekend Farm Trip'], knownFor: ['Raspberries', 'Pumpkin Patch', 'Family Fun Park'] },
  })
}

async function refreshHenna() {
  const farm = await getFarm('henna-blueberry-farm')
  const blueberry = cropRow(farm, 'blueberry')
  const sourceUrl = 'https://hennablueberryfarm.com/u-pick-hours-new/'

  await markFarmReviewed(farm, {
    description: 'Reference blueberry farm in the Snoqualmie River Valley near Carnation, WA. Official website confirms U-pick blueberries, address, U-pick hours, U-pick price, and growing-practice notes.',
  })
  await hideStaleDevelopmentAnnouncement(farm.id)
  await retireOlderApprovedReports(farm.id)
  await upsertPrice({
    farmId: farm.id,
    farmCropId: blueberry.id,
    cropId: blueberry.cropId,
    priceType: 'PER_POUND',
    amount: '3.90',
    unitLabel: 'lb',
    notes: 'Official U-pick hours page lists U-pick blueberries at $3.90/lb.',
    effectiveStartDate: date('2026-07-01'),
    effectiveEndDate: date('2026-09-05'),
    sourceUrl,
  })
  await upsertReport({
    farmId: farm.id,
    farmCropId: blueberry.id,
    cropId: blueberry.cropId,
    condition: 'GOOD',
    rating: 4,
    sourceUrl,
    comment: 'Official U-pick page lists current blueberry U-pick hours and $3.90/lb pricing; call ahead because fields may close early when picked out.',
    expiresAt: HENNA_UPDATE_EXPIRES,
    createdAt: REVIEWED_AT,
  })
  await upsertEvidence({
    farmId: farm.id,
    farmCropId: blueberry.id,
    cropId: blueberry.cropId,
    evidenceType: 'PRICE',
    fieldName: 'blueberry_u_pick_price',
    value: 'Blueberry U-pick price listed at $3.90/lb.',
    normalizedValue: { amount: 3.9, unitLabel: 'lb', currency: 'USD' },
    sourceName: 'Henna Blueberry Farm official U-pick hours page',
    sourceUrl,
    sourceType: 'OFFICIAL_WEBSITE',
    confidenceScore: 96,
    observedAt: REVIEWED_AT,
    verifiedAt: REVIEWED_AT,
    expiresAt: HENNA_UPDATE_EXPIRES,
    verificationMethod: 'manual_official_website_review',
  })
  await upsertEvidence({
    farmId: farm.id,
    farmCropId: blueberry.id,
    cropId: blueberry.cropId,
    evidenceType: 'HOURS',
    fieldName: 'blueberry_u_pick_hours',
    value: 'Monday closed; Tuesday through Thursday morning and evening windows; Friday through Sunday morning windows.',
    normalizedValue: {
      monday: 'closed',
      tuesday: ['08:00-13:00', '18:00-21:00'],
      wednesday: ['08:00-13:00', '18:00-21:00'],
      thursday: ['08:00-13:00', '18:00-21:00'],
      friday: ['08:00-13:00'],
      saturday: ['08:00-13:00'],
      sunday: ['08:00-13:00'],
    },
    sourceName: 'Henna Blueberry Farm official U-pick hours page',
    sourceUrl,
    sourceType: 'OFFICIAL_WEBSITE',
    confidenceScore: 95,
    observedAt: REVIEWED_AT,
    verifiedAt: REVIEWED_AT,
    expiresAt: HENNA_UPDATE_EXPIRES,
    verificationMethod: 'manual_official_website_review',
    notes: 'Page recommends calling ahead on weekends and says fields may close early when picked out.',
  })
  await upsertEvidence({
    farmId: farm.id,
    farmCropId: blueberry.id,
    cropId: blueberry.cropId,
    evidenceType: 'CROP_AVAILABILITY',
    fieldName: 'blueberry_current_status',
    value: 'Official U-pick page lists blueberry picking hours and warns fields may close early when picked out.',
    normalizedValue: { condition: 'GOOD', caution: 'call_ahead' },
    sourceName: 'Henna Blueberry Farm official U-pick hours page',
    sourceUrl,
    sourceType: 'OFFICIAL_WEBSITE',
    confidenceScore: 88,
    observedAt: REVIEWED_AT,
    verifiedAt: REVIEWED_AT,
    expiresAt: HENNA_UPDATE_EXPIRES,
    verificationMethod: 'manual_official_website_review',
  })
  await upsertAnnouncement({
    farmId: farm.id,
    title: 'Blueberry U-pick hours posted',
    body: 'Official U-pick page lists blueberry picking windows and $3.90/lb pricing. The farm says fields may close early when picked out, so call ahead before driving.',
    sourceUrl,
    startsAt: REVIEWED_AT,
    endsAt: HENNA_UPDATE_EXPIRES,
  })
  await updateVerificationProfile(farm, {
    confidence: 90,
    completenessScore: 84,
    nextReviewAt: new Date('2026-07-14T08:00:00.000-07:00'),
    sourceUrls: ['https://hennablueberryfarm.com/', sourceUrl, 'https://www.openstreetmap.org/way/663084049'],
    manualNotes: 'Official U-pick hours page reviewed July 7, 2026. Price and weekly picking windows are source-backed; live field condition should remain call-ahead.',
    completenessJson: { address: true, gps: true, website: true, phone: false, hours: true, prices: true, amenities: false, photos: false, reports: true, cropAvailability: true },
    missingFieldsJson: ['phone', 'structured amenities', 'licensed photos'],
    personalityJson: { bestFor: ['Quick Berry Trip', 'Blueberry Picking'], knownFor: ['Blueberries', 'Duke Blueberries', 'Reka Blueberries', 'Draper Blueberries'] },
  })
}

async function refreshBailey() {
  const farm = await getFarm('bailey-farm')
  const raspberry = cropRow(farm, 'raspberry')
  const strawberry = cropRow(farm, 'strawberry')
  const vegetables = cropRow(farm, 'vegetables')
  const sourceUrl = 'https://www.baileyveg.com/'

  await markFarmReviewed(farm, {
    description: 'Reference Pick-Your-Own produce farm in Snohomish, WA with berries, vegetables, and seasonal produce updates from the official farm website.',
  })
  await hideStaleDevelopmentAnnouncement(farm.id)
  await retireOlderApprovedReports(farm.id)
  for (const specialDate of ['2026-07-07', '2026-07-08']) {
    await upsertSpecialHour({
      farmId: farm.id,
      date: date(specialDate),
      openTime: time('08:00'),
      closeTime: time('17:30'),
      isClosed: false,
      reason: 'Official current hours update',
      sourceUrl,
    })
  }
  await upsertReport({
    farmId: farm.id,
    farmCropId: raspberry.id,
    cropId: raspberry.cropId,
    condition: 'GOOD',
    rating: 5,
    sourceUrl,
    comment: 'Official homepage says raspberries opened again July 7 with good picking in all varieties, and likely closure Thursday for ripening.',
    expiresAt: BAILEY_UPDATE_EXPIRES,
    createdAt: REVIEWED_AT,
  })
  await upsertReport({
    farmId: farm.id,
    farmCropId: strawberry.id,
    cropId: strawberry.cropId,
    condition: 'LIMITED',
    rating: 2,
    sourceUrl,
    comment: 'Official homepage says July 7 is last call for strawberries and some can still be found.',
    expiresAt: BAILEY_UPDATE_EXPIRES,
    createdAt: REVIEWED_AT,
  })
  await upsertReport({
    farmId: farm.id,
    farmCropId: vegetables.id,
    cropId: vegetables.cropId,
    condition: 'LIMITED',
    rating: 3,
    sourceUrl,
    comment: 'Official homepage lists Walla Walla onions, red onions, and spinach available for U-pick, while the main vegetable garden is not open yet.',
    expiresAt: BAILEY_UPDATE_EXPIRES,
    createdAt: REVIEWED_AT,
  })
  await upsertEvidence({
    farmId: farm.id,
    evidenceType: 'HOURS',
    fieldName: 'current_hours',
    value: 'Official homepage lists open Tuesday and Wednesday, July 7 and 8, from 8:00 AM to 5:30 PM.',
    normalizedValue: { dates: ['2026-07-07', '2026-07-08'], openTime: '08:00', closeTime: '17:30' },
    sourceName: 'Bailey Farm official website',
    sourceUrl,
    sourceType: 'OFFICIAL_WEBSITE',
    confidenceScore: 96,
    observedAt: REVIEWED_AT,
    verifiedAt: REVIEWED_AT,
    expiresAt: BAILEY_UPDATE_EXPIRES,
    verificationMethod: 'manual_official_website_review',
  })
  await upsertEvidence({
    farmId: farm.id,
    farmCropId: raspberry.id,
    cropId: raspberry.cropId,
    evidenceType: 'CROP_AVAILABILITY',
    fieldName: 'raspberry_current_status',
    value: 'Raspberries opened again with good picking in all varieties; likely to close Thursday for ripening.',
    normalizedValue: { condition: 'GOOD', likelyClosure: '2026-07-09' },
    sourceName: 'Bailey Farm official website',
    sourceUrl,
    sourceType: 'OFFICIAL_WEBSITE',
    confidenceScore: 96,
    observedAt: REVIEWED_AT,
    verifiedAt: REVIEWED_AT,
    expiresAt: BAILEY_UPDATE_EXPIRES,
    verificationMethod: 'manual_official_website_review',
  })
  await upsertEvidence({
    farmId: farm.id,
    farmCropId: strawberry.id,
    cropId: strawberry.cropId,
    evidenceType: 'CROP_AVAILABILITY',
    fieldName: 'strawberry_current_status',
    value: 'Last call for strawberries; some can still be found.',
    normalizedValue: { condition: 'LIMITED' },
    sourceName: 'Bailey Farm official website',
    sourceUrl,
    sourceType: 'OFFICIAL_WEBSITE',
    confidenceScore: 94,
    observedAt: REVIEWED_AT,
    verifiedAt: REVIEWED_AT,
    expiresAt: BAILEY_UPDATE_EXPIRES,
    verificationMethod: 'manual_official_website_review',
  })
  await upsertEvidence({
    farmId: farm.id,
    farmCropId: vegetables.id,
    cropId: vegetables.cropId,
    evidenceType: 'CROP_AVAILABILITY',
    fieldName: 'vegetables_current_status',
    value: 'Onions and spinach are available for U-pick; main vegetable garden is coming soon.',
    normalizedValue: { condition: 'LIMITED', available: ['Walla Walla onions', 'red onions', 'spinach'] },
    sourceName: 'Bailey Farm official website',
    sourceUrl,
    sourceType: 'OFFICIAL_WEBSITE',
    confidenceScore: 93,
    observedAt: REVIEWED_AT,
    verifiedAt: REVIEWED_AT,
    expiresAt: BAILEY_UPDATE_EXPIRES,
    verificationMethod: 'manual_official_website_review',
  })
  await upsertEvidence({
    farmId: farm.id,
    evidenceType: 'AMENITY',
    fieldName: 'petPolicy',
    value: 'No Pets Please',
    normalizedValue: { petFriendly: false, label: 'No pets' },
    sourceName: 'Bailey Farm official website',
    sourceUrl,
    sourceType: 'OFFICIAL_WEBSITE',
    confidenceScore: 96,
    observedAt: REVIEWED_AT,
    verifiedAt: REVIEWED_AT,
    expiresAt: new Date('2026-10-31T08:00:00.000-07:00'),
    verificationMethod: 'manual_official_website_review',
    notes: 'Official homepage lists No Pets Please.',
  })
  await upsertAnnouncement({
    farmId: farm.id,
    title: 'Raspberries reopened; strawberries last call',
    body: 'Official homepage lists Bailey Farm open July 7 and 8 from 8:00 AM to 5:30 PM. Raspberries have good picking, strawberries are last call, and onions/spinach are available while the main vegetable garden is still coming soon.',
    sourceUrl,
    startsAt: REVIEWED_AT,
    endsAt: BAILEY_UPDATE_EXPIRES,
  })
  await updateVerificationProfile(farm, {
    confidence: 94,
    completenessScore: 88,
    nextReviewAt: new Date('2026-07-09T08:00:00.000-07:00'),
    sourceUrls: [sourceUrl, 'https://www.openstreetmap.org/way/700682104'],
    manualNotes: 'Official homepage reviewed July 7, 2026. Current availability is date-specific and should expire after the July 7-8 window.',
    completenessJson: { address: true, gps: true, website: true, phone: true, hours: true, prices: true, amenities: false, photos: false, reports: true, cropAvailability: true },
    missingFieldsJson: ['structured amenities', 'licensed photos', 'normal weekly hours'],
    personalityJson: { bestFor: ['Quick Berry Trip', 'Vegetable Picking', 'Family Friendly'], knownFor: ['Strawberries', 'Raspberries', 'Pick-Your-Own Produce'] },
  })
}

async function refreshBells() {
  const farm = await getFarm('bells-farm')
  const strawberry = cropRow(farm, 'strawberry')
  const vegetables = cropRow(farm, 'vegetables')
  const officialUrl = 'https://www.bells-farm.com/'
  const profileUrl = 'https://www.whidbeyislandgrown.com/bells-farm'

  await markFarmReviewed(farm, {
    description: 'Reference farm on Whidbey Island near Coupeville, WA. Official and cooperative sources confirm the farm stand, strawberries, vegetables, flowers, regenerative growing practices, address, and phone. U-pick berry status, current hours, and prices still need direct confirmation.',
  })
  await hideStaleDevelopmentAnnouncement(farm.id)
  await retireOlderApprovedReports(farm.id)
  await prisma.farmCrop.updateMany({
    where: { farmId: farm.id, cropId: { in: [strawberry.cropId, vegetables.cropId] } },
    data: { isUPick: false },
  })
  await upsertEvidence({
    farmId: farm.id,
    evidenceType: 'LOCATION',
    fieldName: 'farm_address_contact',
    value: 'Bell’s Farm lists 892 West Beach Rd, Coupeville, WA 98239 and 360-678-4808.',
    normalizedValue: { address: '892 West Beach Rd, Coupeville, WA 98239', phone: '360-678-4808' },
    sourceName: "Bell's Farm official website",
    sourceUrl: officialUrl,
    sourceType: 'OFFICIAL_WEBSITE',
    confidenceScore: 94,
    observedAt: REVIEWED_AT,
    verifiedAt: REVIEWED_AT,
    expiresAt: BELL_REVIEW_EXPIRES,
    verificationMethod: 'manual_official_website_review',
  })
  await upsertEvidence({
    farmId: farm.id,
    farmCropId: strawberry.id,
    cropId: strawberry.cropId,
    evidenceType: 'CROP_AVAILABILITY',
    fieldName: 'strawberry_u_pick_status',
    value: 'Whidbey Island Grown confirms strawberries are grown, but current U-pick strawberry availability is not confirmed.',
    normalizedValue: { uPickConfirmed: false, cropGrown: true },
    sourceName: 'Whidbey Island Grown Bell’s Farm profile',
    sourceUrl: profileUrl,
    sourceType: 'ADMIN_RESEARCH',
    confidenceScore: 78,
    observedAt: REVIEWED_AT,
    verifiedAt: REVIEWED_AT,
    expiresAt: BELL_REVIEW_EXPIRES,
    verificationMethod: 'manual_primary_source_review',
    notes: 'Do not present as U-pick berries until official/current U-pick availability is confirmed.',
  })
  await upsertEvidence({
    farmId: farm.id,
    farmCropId: vegetables.id,
    cropId: vegetables.cropId,
    evidenceType: 'CROP_AVAILABILITY',
    fieldName: 'vegetables_u_pick_status',
    value: 'Whidbey Island Grown confirms vegetables are grown, but current U-pick vegetable availability is not confirmed.',
    normalizedValue: { uPickConfirmed: false, cropGrown: true },
    sourceName: 'Whidbey Island Grown Bell’s Farm profile',
    sourceUrl: profileUrl,
    sourceType: 'ADMIN_RESEARCH',
    confidenceScore: 78,
    observedAt: REVIEWED_AT,
    verifiedAt: REVIEWED_AT,
    expiresAt: BELL_REVIEW_EXPIRES,
    verificationMethod: 'manual_primary_source_review',
    notes: 'Products may be farm-stand/food-hub rather than U-pick.',
  })
  await upsertEvidence({
    farmId: farm.id,
    evidenceType: 'GENERAL',
    fieldName: 'u_pick_uncertainty',
    value: 'Official website references watching for U-pick flower season, but current berry U-pick availability is not confirmed.',
    normalizedValue: { needsReview: ['current hours', 'current prices', 'u-pick berry status'] },
    sourceName: "Bell's Farm official website",
    sourceUrl: officialUrl,
    sourceType: 'OFFICIAL_WEBSITE',
    confidenceScore: 84,
    observedAt: REVIEWED_AT,
    verifiedAt: REVIEWED_AT,
    expiresAt: BELL_REVIEW_EXPIRES,
    verificationMethod: 'manual_official_website_review',
  })
  await upsertAnnouncement({
    farmId: farm.id,
    title: 'U-pick availability needs confirmation',
    body: 'Bell’s Farm is source-backed as a real farm with strawberries, vegetables, flowers, farm stand, address, and phone. Current U-pick berry availability, hours, and prices are not confirmed yet.',
    sourceUrl: officialUrl,
    startsAt: REVIEWED_AT,
    endsAt: BELL_REVIEW_EXPIRES,
    type: 'GENERAL',
  })
  await updateVerificationProfile(farm, {
    status: 'NEEDS_REVIEW',
    confidence: 84,
    completenessScore: 72,
    nextReviewAt: new Date('2026-07-14T08:00:00.000-07:00'),
    sourceUrls: [officialUrl, profileUrl, 'https://www.facebook.com/bellsfarmwhidbey/'],
    manualNotes: 'Official and cooperative sources reviewed July 7, 2026. Farm identity/contact/crops are source-backed, but current U-pick availability remains unconfirmed.',
    completenessJson: { address: true, gps: true, website: true, phone: true, hours: false, prices: false, amenities: true, photos: false, reports: false, cropAvailability: false },
    missingFieldsJson: ['current U-pick berry status', 'current hours', 'current prices', 'licensed photos'],
    lowConfidenceJson: ['crop availability', 'GPS precision'],
    personalityJson: { bestFor: ['Farm Stand Visit', 'Local Produce', 'Whidbey Island Trip'], knownFor: ['Strawberries', 'Vegetables', 'Flowers', 'Regenerative Farming'] },
  })
}

async function main() {
  await refreshRemlinger()
  await refreshHenna()
  await refreshBailey()
  await refreshBells()

  const harvestRadarService = createHarvestRadarService(createHarvestRepository(prisma))
  const summaries = await harvestRadarService.recalculateAll(REVIEWED_AT)

  console.log(JSON.stringify({
    reviewedAt: REVIEWED_AT.toISOString(),
    farmsUpdated: ['remlinger-farms', 'henna-blueberry-farm', 'bailey-farm', 'bells-farm'],
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
