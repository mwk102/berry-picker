const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

class ApiError extends Error {
  constructor(message, status, details) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

function buildUrl(path, params = {}) {
  const url = new URL(path, API_URL)

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value))
    }
  })

  return url.toString()
}

async function request(path, params) {
  const response = await fetch(buildUrl(path, params))
  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    throw new ApiError(
      payload?.error?.message || 'Unable to reach Northwest U-Pick API',
      response.status,
      payload?.error?.details,
    )
  }

  return payload
}

export function getFarms(params = {}) {
  return request('/api/farms', params)
}

export function getFarm(slug) {
  return request(`/api/farms/${slug}`)
}

export function getCrops() {
  return request('/api/crops')
}

export { ApiError }
