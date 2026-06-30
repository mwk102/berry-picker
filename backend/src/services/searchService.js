const { serializeCrop } = require('../utils/serializers')

function createSearchService(farmService, cropRepository) {
  return {
    async search(filters) {
      const farmResults = await farmService.listFarms(filters)
      const crops = await cropRepository.searchCrops(filters.search)

      return {
        query: filters.search || null,
        farms: farmResults.data,
        crops: crops.map(serializeCrop),
        pagination: farmResults.pagination,
      }
    },
  }
}

module.exports = { createSearchService }
