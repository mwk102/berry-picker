function createEvidenceRepository(prisma) {
  return {
    createEvidence(data) {
      return prisma.evidence.create({ data })
    },

    findFarmCrop(farmId, farmCropId) {
      return prisma.farmCrop.findFirst({
        where: { id: farmCropId, farmId },
        include: { crop: true, farm: true },
      })
    },

    createFieldObservation({ evidence, report }) {
      return prisma.$transaction(async (tx) => {
        const createdEvidence = await tx.evidence.create({ data: evidence })
        const createdReport = await tx.pickingReport.create({ data: report })
        return { evidence: createdEvidence, report: createdReport }
      })
    },

    listEvidenceForFarm(farmId) {
      return prisma.evidence.findMany({
        where: { farmId },
        orderBy: [{ evidenceType: 'asc' }, { observedAt: 'desc' }],
      })
    },

    listEvidenceByType(evidenceType, filters = {}) {
      return prisma.evidence.findMany({
        where: {
          evidenceType,
          farmId: filters.farmId,
        },
        orderBy: [{ observedAt: 'desc' }],
      })
    },

    findExpiredEvidence(now = new Date()) {
      return prisma.evidence.findMany({
        where: { expiresAt: { lt: now } },
        orderBy: [{ expiresAt: 'asc' }],
      })
    },

    findLowConfidenceEvidence(threshold = 70) {
      return prisma.evidence.findMany({
        where: { confidenceScore: { lt: threshold } },
        orderBy: [{ confidenceScore: 'asc' }, { observedAt: 'desc' }],
      })
    },

    listRefreshDueEvidence(now = new Date()) {
      return prisma.evidence.findMany({
        where: {
          farm: { isActive: true, reviewStatus: 'APPROVED' },
          OR: [
            { expiresAt: { lt: now } },
            {
              evidenceType: { in: ['HARVEST_STATUS', 'CROP_AVAILABILITY', 'HOURS', 'PRICE', 'ANNOUNCEMENT'] },
              expiresAt: { lte: new Date(now.getTime() + 1000 * 60 * 60 * 24) },
            },
            { confidenceScore: { lt: 70 } },
          ],
        },
        include: { farm: true, crop: true },
        orderBy: [{ expiresAt: 'asc' }, { confidenceScore: 'asc' }],
      })
    },
  }
}

module.exports = { createEvidenceRepository }
