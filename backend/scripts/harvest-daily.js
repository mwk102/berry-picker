require('dotenv').config()

const { prisma } = require('../src/db/prisma')
const { createHarvestRepository } = require('../src/repositories/harvestRepository')
const { createHarvestRadarService } = require('../src/services/harvestRadarService')
const { createDailyHarvestService } = require('../src/services/dailyHarvestService')

async function main() {
  const harvestRadarService = createHarvestRadarService(createHarvestRepository(prisma))
  const dailyHarvestService = createDailyHarvestService(prisma, harvestRadarService)
  const result = await dailyHarvestService.generateDailySummary()

  console.log(JSON.stringify({
    summary: result.data,
    eventsCreatedOrUpdated: result.meta.createdEventCount,
    staleEvidenceCount: result.meta.staleEvidenceCount,
    refreshDueCount: result.meta.refreshDueCount,
    events: result.events.map((event) => ({
      eventType: event.eventType,
      title: event.title,
      farm: event.farm?.name || null,
      crop: event.crop?.name || null,
    })),
  }, null, 2))
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
