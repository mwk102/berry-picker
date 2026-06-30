const express = require('express')
const { validateSearchQuery } = require('../middleware/validateRequest')

function createSearchRouter(searchService) {
  const router = express.Router()

  router.get('/', validateSearchQuery, async (req, res, next) => {
    try {
      const result = await searchService.search(req.validatedQuery)
      res.json(result)
    } catch (error) {
      next(error)
    }
  })

  return router
}

module.exports = { createSearchRouter }
