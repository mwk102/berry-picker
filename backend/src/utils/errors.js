class ApiError extends Error {
  constructor(statusCode, message, details) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.details = details
  }
}

function notFound(message = 'Resource not found') {
  return new ApiError(404, message)
}

function badRequest(message = 'Invalid request', details) {
  return new ApiError(400, message, details)
}

module.exports = { ApiError, badRequest, notFound }
