const { notFound } = require('../utils/errors')
const { serializeFarm } = require('../utils/serializers')

function haversineDistanceMiles(origin, destination) {
  const earthRadiusMiles = 3958.8
  const toRadians = (degrees) => (degrees * Math.PI) / 180
  const deltaLatitude = toRadians(destination.latitude - origin.latitude)
  const deltaLongitude = toRadians(destination.longitude - origin.longitude)
  const originLatitude = toRadians(origin.latitude)
  const destinationLatitude = toRadians(destination.latitude)
  const a =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(originLatitude) * Math.cos(destinationLatitude) * Math.sin(deltaLongitude / 2) ** 2
  return earthRadiusMiles * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function cropOverlapScore(sourceFarm, candidateFarm) {
  const sourceCropSlugs = new Set(
    (sourceFarm.farmCrops || []).map((farmCrop) => farmCrop.crop?.slug).filter(Boolean),
  )
  return (candidateFarm.farmCrops || []).filter((farmCrop) => sourceCropSlugs.has(farmCrop.crop?.slug)).length
}

function latestQualityScore(farm) {
  const report = [...(farm.reports || [])].sort(
    (first, second) => new Date(second.createdAt) - new Date(first.createdAt),
  )[0]
  const scores = {
    EXCELLENT: 5,
    GOOD: 4,
    LIMITED: 3,
    COMING_SOON: 2,
    PICKED_OVER: 1,
    CLOSED: 0,
    SEASON_OVER: 0,
    UNKNOWN: 1,
  }
  return scores[report?.condition] ?? 1
}

function paginationMeta(total, limit, offset) {
  return {
    total,
    limit,
    offset,
    hasMore: offset + limit < total,
  }
}

function createFarmService(farmRepository) {
  return {
    async listFarms(filters) {
      const { farms, total } = await farmRepository.findFarms(filters)
      return {
        data: farms.map(serializeFarm),
        pagination: paginationMeta(total, filters.limit, filters.offset),
      }
    },

    async getFarmBySlug(slug) {
      const farm = await farmRepository.findFarmBySlug(slug)
      if (!farm) {
        throw notFound(`Farm not found: ${slug}`)
      }

      const nearby = await farmRepository.findNearbyFarms(farm, 4)
      const origin = {
        latitude: Number(farm.latitude),
        longitude: Number(farm.longitude),
      }
      const rankedNearby = nearby
        .map((candidate) => {
          const distanceMiles = haversineDistanceMiles(origin, {
            latitude: Number(candidate.latitude),
            longitude: Number(candidate.longitude),
          })
          const sharedCropCount = cropOverlapScore(farm, candidate)
          const harvestQualityScore = latestQualityScore(candidate)
          return { farm: candidate, distanceMiles, sharedCropCount, harvestQualityScore }
        })
        .sort(
          (first, second) =>
            first.distanceMiles - second.distanceMiles ||
            second.sharedCropCount - first.sharedCropCount ||
            second.harvestQualityScore - first.harvestQualityScore,
        )
        .slice(0, 4)
        .map((entry) => ({
          ...serializeFarm(entry.farm),
          distanceMiles: Number(entry.distanceMiles.toFixed(1)),
          sharedCropCount: entry.sharedCropCount,
          harvestQualityScore: entry.harvestQualityScore,
        }))

      return { data: { ...serializeFarm(farm), nearbyFarms: rankedNearby } }
    },

    async listFarmsByCrop(slug, filters) {
      const { farms, total } = await farmRepository.findFarmsByCropSlug(slug, filters)
      return {
        data: farms.map(serializeFarm),
        pagination: paginationMeta(total, filters.limit, filters.offset),
      }
    },
  }
}

module.exports = { createFarmService }
