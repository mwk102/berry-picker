const express = require('express')
const { badRequest } = require('../utils/errors')

const EVIDENCE_TYPES = new Set([
  'PRICE',
  'HOURS',
  'CROP_AVAILABILITY',
  'HARVEST_STATUS',
  'AMENITY',
  'ANNOUNCEMENT',
  'CONTACT',
  'LOCATION',
  'PHOTO',
  'GENERAL',
])

const SOURCE_TYPES = new Set([
  'OFFICIAL_WEBSITE',
  'FARM_OWNER',
  'FIELD_OBSERVATION',
  'ADMIN_RESEARCH',
  'COMMUNITY_REPORT',
  'GOOGLE_PLACES',
  'OPENSTREETMAP',
  'SOCIAL_MEDIA',
  'IMPORT',
])

const PICKING_CONDITIONS = new Set([
  'EXCELLENT',
  'GOOD',
  'LIMITED',
  'PICKED_OVER',
  'CLOSED',
  'COMING_SOON',
  'SEASON_OVER',
  'UNKNOWN',
])

const CROWD_LEVELS = new Set(['QUIET', 'MODERATE', 'BUSY', 'VERY_BUSY', 'UNKNOWN'])

function validateUuid(value, fieldName) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value || '')) {
    throw badRequest(`${fieldName} must be a UUID`)
  }
}

function validateEvidenceBody(farmId, body) {
  validateUuid(farmId, 'farmId')

  if (!EVIDENCE_TYPES.has(body.evidenceType)) {
    throw badRequest('evidenceType is invalid')
  }
  if (!SOURCE_TYPES.has(body.sourceType)) {
    throw badRequest('sourceType is invalid')
  }
  if (body.confidenceScore !== undefined) {
    const score = Number(body.confidenceScore)
    if (!Number.isInteger(score) || score < 0 || score > 100) {
      throw badRequest('confidenceScore must be an integer between 0 and 100')
    }
  }
  if (body.farmCropId) validateUuid(body.farmCropId, 'farmCropId')
  if (body.cropId) validateUuid(body.cropId, 'cropId')

  return {
    ...body,
    farmId,
  }
}

function validateFieldObservationBody(farmId, body) {
  validateUuid(farmId, 'farmId')
  validateUuid(body.farmCropId, 'farmCropId')

  if (!PICKING_CONDITIONS.has(body.condition)) {
    throw badRequest('condition is invalid')
  }
  if (body.crowdLevel && !CROWD_LEVELS.has(body.crowdLevel)) {
    throw badRequest('crowdLevel is invalid')
  }
  if (body.confidenceScore !== undefined) {
    const score = Number(body.confidenceScore)
    if (!Number.isInteger(score) || score < 0 || score > 100) {
      throw badRequest('confidenceScore must be an integer between 0 and 100')
    }
  }

  return {
    ...body,
    farmId,
  }
}

function createAdminEvidenceRouter(evidenceService, dailyHarvestService) {
  const router = express.Router()

  router.get('/daily-cycle', async (_req, res, next) => {
    try {
      res.json(await dailyHarvestService.getAdminCycle())
    } catch (error) {
      next(error)
    }
  })

  // TODO(auth-required): protect all admin evidence routes before production.
  router.get('/farms/:farmId/evidence', async (req, res, next) => {
    try {
      validateUuid(req.params.farmId, 'farmId')
      res.json(await evidenceService.listEvidenceForFarm(req.params.farmId))
    } catch (error) {
      next(error)
    }
  })

  // TODO(auth-required): restrict evidence creation to trusted admins/reviewers.
  router.post('/farms/:farmId/evidence', async (req, res, next) => {
    try {
      const input = validateEvidenceBody(req.params.farmId, req.body)
      const result = await evidenceService.createEvidence(input)
      res.status(201).json(result)
    } catch (error) {
      next(error)
    }
  })

  // TODO(auth-required): restrict quick field observations to admins/trusted reviewers.
  router.post('/farms/:farmId/field-observations', async (req, res, next) => {
    try {
      const input = validateFieldObservationBody(req.params.farmId, req.body)
      const result = await evidenceService.createFieldObservation(input)
      res.status(201).json(result)
    } catch (error) {
      next(error)
    }
  })

  router.get('/evidence/expired', async (_req, res, next) => {
    try {
      res.json(await evidenceService.findExpiredEvidence())
    } catch (error) {
      next(error)
    }
  })

  router.get('/evidence/refresh-due', async (_req, res, next) => {
    try {
      res.json(await evidenceService.listRefreshDueEvidence())
    } catch (error) {
      next(error)
    }
  })

  router.get('/evidence/low-confidence', async (req, res, next) => {
    try {
      res.json(await evidenceService.findLowConfidenceEvidence(req.query.threshold || 70))
    } catch (error) {
      next(error)
    }
  })

  return router
}

module.exports = { createAdminEvidenceRouter }
