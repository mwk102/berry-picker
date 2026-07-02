const express = require('express')
const { validateSlugParam } = require('../middleware/validateRequest')
const { badRequest } = require('../utils/errors')

function parseRefresh(value) {
  if (value === undefined) return false
  if (value === 'true') return true
  if (value === 'false') return false
  throw badRequest('refresh must be either true or false')
}

function createHarvestRouter(harvestRadarService) {
  const router = express.Router()

  router.get('/', async (req, res, next) => {
    try {
      const result = await harvestRadarService.listHarvestSummaries({
        refresh: parseRefresh(req.query.refresh),
      })
      res.json(result)
    } catch (error) {
      next(error)
    }
  })

  router.get('/:slug', validateSlugParam, async (req, res, next) => {
    try {
      const result = await harvestRadarService.getHarvestByCrop(req.slug, {
        refresh: parseRefresh(req.query.refresh),
      })
      res.json(result)
    } catch (error) {
      next(error)
    }
  })

  return router
}

module.exports = { createHarvestRouter }
