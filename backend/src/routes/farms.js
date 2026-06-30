const express = require('express')
const { validateFarmListQuery, validateSlugParam } = require('../middleware/validateRequest')

function createFarmRouter(farmService) {
  const router = express.Router()

  router.get('/', validateFarmListQuery, async (req, res, next) => {
    try {
      const result = await farmService.listFarms(req.validatedQuery)
      res.json(result)
    } catch (error) {
      next(error)
    }
  })

  router.get('/:slug', validateSlugParam, async (req, res, next) => {
    try {
      const result = await farmService.getFarmBySlug(req.slug)
      res.json(result)
    } catch (error) {
      next(error)
    }
  })

  return router
}

module.exports = { createFarmRouter }
