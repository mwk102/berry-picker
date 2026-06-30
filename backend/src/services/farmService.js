const { notFound } = require('../utils/errors')
const { serializeFarm } = require('../utils/serializers')

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
      return { data: serializeFarm(farm) }
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
