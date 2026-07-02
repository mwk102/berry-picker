const { badRequest } = require('../utils/errors')

const MAX_LIMIT = 300
const DEFAULT_LIMIT = 20

function parseBoolean(value, fieldName) {
  if (value === undefined) return undefined
  if (value === 'true') return true
  if (value === 'false') return false
  throw badRequest(`${fieldName} must be either true or false`)
}

function parseNonNegativeInteger(value, fieldName, defaultValue) {
  if (value === undefined) return defaultValue
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw badRequest(`${fieldName} must be a non-negative integer`)
  }
  return parsed
}

function parseLimit(value) {
  const parsed = parseNonNegativeInteger(value, 'limit', DEFAULT_LIMIT)
  if (parsed < 1 || parsed > MAX_LIMIT) {
    throw badRequest(`limit must be between 1 and ${MAX_LIMIT}`)
  }
  return parsed
}

function optionalText(value, fieldName) {
  if (value === undefined) return undefined
  if (typeof value !== 'string') {
    throw badRequest(`${fieldName} must be a string`)
  }
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function validateFarmListQuery(req, _res, next) {
  try {
    req.validatedQuery = {
      city: optionalText(req.query.city, 'city'),
      crop: optionalText(req.query.crop, 'crop'),
      verified: parseBoolean(req.query.verified, 'verified'),
      includeUnverified: parseBoolean(req.query.includeUnverified, 'includeUnverified'),
      search: optionalText(req.query.search, 'search'),
      limit: parseLimit(req.query.limit),
      offset: parseNonNegativeInteger(req.query.offset, 'offset', 0),
    }
    next()
  } catch (error) {
    next(error)
  }
}

function validateSearchQuery(req, _res, next) {
  try {
    req.validatedQuery = {
      search: optionalText(req.query.search ?? req.query.q, 'search'),
      city: optionalText(req.query.city, 'city'),
      crop: optionalText(req.query.crop, 'crop'),
      verified: parseBoolean(req.query.verified, 'verified'),
      includeUnverified: parseBoolean(req.query.includeUnverified, 'includeUnverified'),
      limit: parseLimit(req.query.limit),
      offset: parseNonNegativeInteger(req.query.offset, 'offset', 0),
    }
    next()
  } catch (error) {
    next(error)
  }
}

function validateSlugParam(req, _res, next) {
  try {
    const slug = optionalText(req.params.slug, 'slug')
    if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      throw badRequest('slug must be a valid URL slug')
    }
    req.slug = slug
    next()
  } catch (error) {
    next(error)
  }
}

module.exports = {
  validateFarmListQuery,
  validateSearchQuery,
  validateSlugParam,
}
