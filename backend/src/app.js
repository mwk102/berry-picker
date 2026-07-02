const express = require('express')
const cors = require('cors')
const { prisma } = require('./db/prisma')
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler')
const { createCropRepository } = require('./repositories/cropRepository')
const { createFarmRepository } = require('./repositories/farmRepository')
const { createHarvestRepository } = require('./repositories/harvestRepository')
const { createCropService } = require('./services/cropService')
const { createFarmService } = require('./services/farmService')
const { createHarvestRadarService } = require('./services/harvestRadarService')
const { createHarvestSignalsService } = require('./services/harvestSignalsService')
const { createSearchService } = require('./services/searchService')
const { createCropRouter } = require('./routes/crops')
const { createFarmRouter } = require('./routes/farms')
const { createHarvestRouter } = require('./routes/harvest')
const { createSearchRouter } = require('./routes/search')

function createApp() {
  const app = express()

  app.use(cors())
  app.use(express.json())

  const farmRepository = createFarmRepository(prisma)
  const cropRepository = createCropRepository(prisma)
  const harvestRepository = createHarvestRepository(prisma)
  const farmService = createFarmService(farmRepository)
  const cropService = createCropService(cropRepository, farmService)
  const harvestRadarService = createHarvestRadarService(harvestRepository)
  const harvestSignalsService = createHarvestSignalsService(harvestRepository)
  const searchService = createSearchService(farmService, cropRepository)

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' })
  })

  app.use('/api/farms', createFarmRouter(farmService))
  app.use('/api/crops', createCropRouter(cropService))
  app.use('/api/harvest', createHarvestRouter(harvestRadarService, harvestSignalsService))
  app.use('/api/search', createSearchRouter(searchService))

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}

module.exports = { createApp }
