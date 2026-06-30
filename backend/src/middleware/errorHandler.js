const { ApiError } = require('../utils/errors')

function notFoundHandler(req, _res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`))
}

function errorHandler(error, _req, res, _next) {
  const statusCode = error.statusCode || 500
  const payload = {
    error: {
      message: statusCode === 500 ? 'Internal server error' : error.message,
      statusCode,
    },
  }

  if (error.details) {
    payload.error.details = error.details
  }

  if (process.env.NODE_ENV !== 'production' && statusCode === 500) {
    payload.error.debug = error.message
  }

  res.status(statusCode).json(payload)
}

module.exports = { errorHandler, notFoundHandler }
