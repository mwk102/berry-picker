const { notFound } = require('../utils/errors')
const { serializeCrop } = require('../utils/serializers')

function createCropService(cropRepository, farmService) {
  return {
    async listCrops() {
      const crops = await cropRepository.findCrops()
      return { data: crops.map(serializeCrop) }
    },

    async listFarmsByCrop(slug, filters) {
      const crop = await cropRepository.findCropBySlug(slug)
      if (!crop) {
        throw notFound(`Crop not found: ${slug}`)
      }

      const farms = await farmService.listFarmsByCrop(slug, filters)
      return {
        crop: serializeCrop(crop),
        ...farms,
      }
    },
  }
}

module.exports = { createCropService }
