function createEvidenceRepository(prisma) {
  return {
    createEvidence(data) {
      return prisma.evidence.create({ data })
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
  }
}

module.exports = { createEvidenceRepository }
