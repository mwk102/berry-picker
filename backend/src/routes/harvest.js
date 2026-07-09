const express = require('express')
const { validateSlugParam } = require('../middleware/validateRequest')
const { badRequest } = require('../utils/errors')

function parseRefresh(value) {
  if (value === undefined) return false
  if (value === 'true') return true
  if (value === 'false') return false
  throw badRequest('refresh must be either true or false')
}

function createHarvestRouter(harvestRadarService, harvestSignalsService, dailyHarvestService) {
  const router = express.Router()

  router.get('/daily', async (_req, res, next) => {
    try {
      const result = await dailyHarvestService.getLatestDailySummary()
      res.json(result)
    } catch (error) {
      next(error)
    }
  })

  router.get('/events', async (req, res, next) => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 20
      if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
        throw badRequest('limit must be an integer between 1 and 100')
      }
      const includeInternal = req.query.includeInternal === 'true'
      const result = await dailyHarvestService.listEvents({ limit, publicOnly: !includeInternal })
      res.json(result)
    } catch (error) {
      next(error)
    }
  })

  router.get('/signals', async (_req, res, next) => {
    try {
      const result = await harvestSignalsService.getSignals()
      res.json(result)
    } catch (error) {
      next(error)
    }
  })

  router.get('/trends', async (_req, res, next) => {
    try {
      const result = await harvestSignalsService.getTrends()
      res.json(result)
    } catch (error) {
      next(error)
    }
  })

  router.get('/timeline', async (_req, res, next) => {
    try {
      const result = await harvestSignalsService.getTimeline()
      res.json(result)
    } catch (error) {
      next(error)
    }
  })

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
