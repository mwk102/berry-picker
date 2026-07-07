const { mkdirSync, writeFileSync } = require('node:fs')
const { join } = require('node:path')
require('dotenv/config')
const { PrismaPg } = require('@prisma/adapter-pg')
const { PrismaClient } = require('@prisma/client')

const HOT_EVIDENCE_TYPES = ['HARVEST_STATUS', 'CROP_AVAILABILITY', 'HOURS', 'PRICE', 'ANNOUNCEMENT']
const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL is required to run refresh:due.')
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) })

function statusForEvidence(evidence, now) {
  const expiresAt = evidence.expiresAt ? new Date(evidence.expiresAt) : null
  if (expiresAt && expiresAt < now) return 'expired'
  if (evidence.confidenceScore < 70) return 'low_confidence'
  if (
    HOT_EVIDENCE_TYPES.includes(evidence.evidenceType) &&
    expiresAt &&
    expiresAt.getTime() - now.getTime() <= 1000 * 60 * 60 * 24
  ) {
    return 'expires_soon'
  }
  return 'review'
}

async function main() {
  const now = new Date()
  const dueEvidence = await prisma.evidence.findMany({
    where: {
      farm: { isActive: true, reviewStatus: 'APPROVED' },
      OR: [
        { expiresAt: { lt: now } },
        {
          evidenceType: { in: HOT_EVIDENCE_TYPES },
          expiresAt: { lte: new Date(now.getTime() + 1000 * 60 * 60 * 24) },
        },
        { confidenceScore: { lt: 70 } },
      ],
    },
    include: { farm: true, crop: true },
    orderBy: [{ expiresAt: 'asc' }, { confidenceScore: 'asc' }],
  })

  const items = dueEvidence.map((evidence) => ({
    farmSlug: evidence.farm.slug,
    farmName: evidence.farm.name,
    cropSlug: evidence.crop?.slug || null,
    cropName: evidence.crop?.name || null,
    evidenceType: evidence.evidenceType,
    fieldName: evidence.fieldName,
    sourceType: evidence.sourceType,
    sourceName: evidence.sourceName,
    sourceUrl: evidence.sourceUrl,
    observedAt: evidence.observedAt,
    expiresAt: evidence.expiresAt,
    confidenceScore: evidence.confidenceScore,
    status: statusForEvidence(evidence, now),
    value: evidence.value,
  }))

  const byFarm = items.reduce((accumulator, item) => {
    accumulator[item.farmSlug] ||= {
      farmSlug: item.farmSlug,
      farmName: item.farmName,
      dueCount: 0,
      statuses: {},
    }
    accumulator[item.farmSlug].dueCount += 1
    accumulator[item.farmSlug].statuses[item.status] =
      (accumulator[item.farmSlug].statuses[item.status] || 0) + 1
    return accumulator
  }, {})

  const report = {
    generatedAt: now.toISOString(),
    summary: {
      dueEvidenceCount: items.length,
      dueFarmCount: Object.keys(byFarm).length,
      byFarm: Object.values(byFarm),
    },
    items,
  }

  const reportDir = join(__dirname, '..', 'imports', 'reports')
  mkdirSync(reportDir, { recursive: true })
  const reportPath = join(reportDir, 'data-refresh-due.json')
  writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`)

  console.log(`Data refresh due report written to ${reportPath}`)
  console.table(
    report.summary.byFarm.map((farm) => ({
      farm: farm.farmName,
      due: farm.dueCount,
      expired: farm.statuses.expired || 0,
      low_confidence: farm.statuses.low_confidence || 0,
      expires_soon: farm.statuses.expires_soon || 0,
    })),
  )
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
