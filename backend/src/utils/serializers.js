function decimalToNumber(value) {
  if (value === null || value === undefined) return value
  return Number(value)
}

function serializePrice(price) {
  return {
    id: price.id,
    priceType: price.priceType,
    amount: decimalToNumber(price.amount),
    currency: price.currency,
    unitLabel: price.unitLabel,
    notes: price.notes,
    effectiveStartDate: price.effectiveStartDate,
    effectiveEndDate: price.effectiveEndDate,
    source: price.source,
    isVerified: price.isVerified,
    verifiedAt: price.verifiedAt,
    createdAt: price.createdAt,
    updatedAt: price.updatedAt,
  }
}

function serializeFarmCrop(farmCrop) {
  return {
    id: farmCrop.id,
    seasonStartDate: farmCrop.seasonStartDate,
    seasonEndDate: farmCrop.seasonEndDate,
    peakStartDate: farmCrop.peakStartDate,
    peakEndDate: farmCrop.peakEndDate,
    notes: farmCrop.notes,
    isUPick: farmCrop.isUPick,
    isPrePicked: farmCrop.isPrePicked,
    isActive: farmCrop.isActive,
    crop: farmCrop.crop
      ? {
          id: farmCrop.crop.id,
          slug: farmCrop.crop.slug,
          name: farmCrop.crop.name,
          category: farmCrop.crop.category,
          icon: farmCrop.crop.icon,
          color: farmCrop.crop.color,
        }
      : undefined,
    prices: farmCrop.prices ? farmCrop.prices.map(serializePrice) : [],
    reports: farmCrop.reports ? farmCrop.reports.map(serializePickingReport) : [],
  }
}

function serializePickingReport(report) {
  return {
    id: report.id,
    condition: report.condition,
    crowdLevel: report.crowdLevel,
    rating: report.rating,
    comment: report.comment,
    source: report.source,
    isVerified: report.isVerified,
    isApproved: report.isApproved,
    verifiedAt: report.verifiedAt,
    expiresAt: report.expiresAt,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
    crop: report.crop
      ? {
          id: report.crop.id,
          slug: report.crop.slug,
          name: report.crop.name,
          category: report.crop.category,
        }
      : undefined,
  }
}

function serializeFarm(farm) {
  return {
    id: farm.id,
    slug: farm.slug,
    name: farm.name,
    description: farm.description,
    addressLine1: farm.addressLine1,
    addressLine2: farm.addressLine2,
    city: farm.city,
    state: farm.state,
    postalCode: farm.postalCode,
    county: farm.county,
    country: farm.country,
    latitude: decimalToNumber(farm.latitude),
    longitude: decimalToNumber(farm.longitude),
    timezone: farm.timezone,
    phone: farm.phone,
    email: farm.email,
    websiteUrl: farm.websiteUrl,
    facebookUrl: farm.facebookUrl,
    instagramUrl: farm.instagramUrl,
    status: farm.status,
    reviewStatus: farm.reviewStatus,
    isVerified: farm.isVerified,
    isClaimed: farm.isClaimed,
    isActive: farm.isActive,
    dataSource: farm.dataSource,
    lastVerifiedAt: farm.lastVerifiedAt,
    createdAt: farm.createdAt,
    updatedAt: farm.updatedAt,
    hours: farm.hours || [],
    specialHours: farm.specialHours || [],
    amenities: farm.amenities
      ? farm.amenities.map((farmAmenity) => ({
          id: farmAmenity.amenity.id,
          slug: farmAmenity.amenity.slug,
          name: farmAmenity.amenity.name,
          icon: farmAmenity.amenity.icon,
          category: farmAmenity.amenity.category,
          notes: farmAmenity.notes,
        }))
      : [],
    crops: farm.farmCrops ? farm.farmCrops.map(serializeFarmCrop) : [],
    prices: farm.cropPrices ? farm.cropPrices.map(serializePrice) : [],
    pickingReports: farm.reports ? farm.reports.map(serializePickingReport) : [],
    announcements: farm.announcements || [],
    sources: farm.sources
      ? farm.sources.map((source) => ({
          id: source.id,
          dataSource: source.dataSource,
          externalId: source.externalId,
          sourceUrl: source.sourceUrl,
          importedAt: source.importedAt,
          lastSeenAt: source.lastSeenAt,
        }))
      : [],
    candidateReview: farm.candidates?.[0]
      ? {
          id: farm.candidates[0].id,
          confidenceScore: farm.candidates[0].confidenceScore,
          verificationStatus: farm.candidates[0].verificationStatus,
          evidenceJson: farm.candidates[0].evidenceJson,
          updatedAt: farm.candidates[0].updatedAt,
        }
      : null,
  }
}

function serializeCrop(crop) {
  return {
    id: crop.id,
    slug: crop.slug,
    name: crop.name,
    category: crop.category,
    icon: crop.icon,
    color: crop.color,
    defaultSeasonStartMonth: crop.defaultSeasonStartMonth,
    defaultSeasonEndMonth: crop.defaultSeasonEndMonth,
    isActive: crop.isActive,
    createdAt: crop.createdAt,
    updatedAt: crop.updatedAt,
  }
}

module.exports = { serializeCrop, serializeFarm }
