const express = require('express')
const { validateFarmListQuery, validateSlugParam } = require('../middleware/validateRequest')

function createCropRouter(cropService) {
  const router = express.Router()

  router.get('/', async (_req, res, next) => {
    try {
      const result = await cropService.listCrops()
      res.json(result)
    } catch (error) {
      next(error)
    }
  })

  router.get('/:slug/farms', validateSlugParam, validateFarmListQuery, async (req, res, next) => {
    try {
      const result = await cropService.listFarmsByCrop(req.slug, req.validatedQuery)
      res.json(result)
    } catch (error) {
      next(error)
    }
  })

  return router
}

module.exports = { createCropRouter }
