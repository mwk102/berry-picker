const { badRequest } = require('../utils/errors')

const REQUIRED_PROFILE_FIELDS = [
  'address',
  'coordinates',
  'websiteUrl',
  'phone',
  'hours',
  'price',
  'amenity',
  'photo',
  'cropAvailability',
]

function serializeEvidence(evidence, now = new Date()) {
  const isExpired = evidence.expiresAt ? new Date(evidence.expiresAt) < now : false
  const isStale =
    !isExpired &&
    evidence.expiresAt &&
    new Date(evidence.expiresAt).getTime() - now.getTime() < 1000 * 60 * 60 * 24 * 7
  const isLowConfidence = evidence.confidenceScore < 70

  return {
    id: evidence.id,
    farmId: evidence.farmId,
    farmCropId: evidence.farmCropId,
    cropId: evidence.cropId,
    evidenceType: evidence.evidenceType,
    fieldName: evidence.fieldName,
    value: evidence.value,
    normalizedValue: evidence.normalizedValue,
    sourceName: evidence.sourceName,
    sourceUrl: evidence.sourceUrl,
    sourceType: evidence.sourceType,
    confidenceScore: evidence.confidenceScore,
    observedAt: evidence.observedAt,
    verifiedAt: evidence.verifiedAt,
    expiresAt: evidence.expiresAt,
    verificationMethod: evidence.verificationMethod,
    notes: evidence.notes,
    status: isExpired ? 'expired' : isLowConfidence ? 'low confidence' : isStale ? 'stale' : 'fresh',
    createdAt: evidence.createdAt,
    updatedAt: evidence.updatedAt,
  }
}

function createCompletenessChecks(evidenceRecords) {
  const fieldNames = new Set(evidenceRecords.map((evidence) => evidence.fieldName))
  return REQUIRED_PROFILE_FIELDS.map((fieldName) => ({
    key: fieldName,
    label: fieldName
      .replace(/Url$/, ' URL')
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (letter) => letter.toUpperCase()),
    complete: fieldNames.has(fieldName),
  }))
}

function createEvidenceService(evidenceRepository) {
  return {
    async createEvidence(input) {
      if (!input.farmId) throw badRequest('farmId is required')
      if (!input.evidenceType) throw badRequest('evidenceType is required')
      if (!input.fieldName) throw badRequest('fieldName is required')
      if (!input.value) throw badRequest('value is required')
      if (!input.sourceName) throw badRequest('sourceName is required')
      if (!input.sourceUrl) throw badRequest('sourceUrl is required')
      if (!input.sourceType) throw badRequest('sourceType is required')
      if (!input.verificationMethod) throw badRequest('verificationMethod is required')

      const evidence = await evidenceRepository.createEvidence({
        farmId: input.farmId,
        farmCropId: input.farmCropId || null,
        cropId: input.cropId || null,
        evidenceType: input.evidenceType,
        fieldName: input.fieldName,
        value: String(input.value),
        normalizedValue: input.normalizedValue || undefined,
        sourceName: input.sourceName,
        sourceUrl: input.sourceUrl,
        sourceType: input.sourceType,
        confidenceScore: Number(input.confidenceScore ?? 0),
        observedAt: input.observedAt ? new Date(input.observedAt) : new Date(),
        verifiedAt: input.verifiedAt ? new Date(input.verifiedAt) : null,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        verificationMethod: input.verificationMethod,
        notes: input.notes || null,
      })

      return { data: serializeEvidence(evidence) }
    },

    async listEvidenceForFarm(farmId) {
      const evidence = await evidenceRepository.listEvidenceForFarm(farmId)
      return { data: evidence.map((record) => serializeEvidence(record)) }
    },

    async listEvidenceByType(evidenceType, filters) {
      const evidence = await evidenceRepository.listEvidenceByType(evidenceType, filters)
      return { data: evidence.map((record) => serializeEvidence(record)) }
    },

    async findExpiredEvidence() {
      const evidence = await evidenceRepository.findExpiredEvidence()
      return { data: evidence.map((record) => serializeEvidence(record)) }
    },

    async findLowConfidenceEvidence(threshold = 70) {
      const evidence = await evidenceRepository.findLowConfidenceEvidence(Number(threshold))
      return { data: evidence.map((record) => serializeEvidence(record)) }
    },

    summarizeEvidenceForFarm(evidenceRecords, now = new Date()) {
      const checks = createCompletenessChecks(evidenceRecords)
      const sourceCount = new Set(evidenceRecords.map((evidence) => evidence.sourceUrl)).size
      const verifiedFieldCount = new Set(
        evidenceRecords.filter((evidence) => evidence.verifiedAt).map((evidence) => evidence.fieldName),
      ).size
      const missingFields = checks.filter((check) => !check.complete).map((check) => check.label)
      const expiredEvidenceCount = evidenceRecords.filter(
        (evidence) => evidence.expiresAt && new Date(evidence.expiresAt) < now,
      ).length
      const lowConfidenceFields = [
        ...new Set(
          evidenceRecords
            .filter((evidence) => evidence.confidenceScore < 70)
            .map((evidence) => evidence.fieldName),
        ),
      ]

      const coverageScore = Math.round((checks.filter((check) => check.complete).length / checks.length) * 100)
      const freshnessPenalty = Math.min(20, expiredEvidenceCount * 5)
      const confidencePenalty = Math.min(20, lowConfidenceFields.length * 4)

      return {
        sourceCount,
        verifiedFieldCount,
        missingFieldCount: missingFields.length,
        expiredEvidenceCount,
        lowConfidenceFieldCount: lowConfidenceFields.length,
        completenessScore: Math.max(0, Math.min(100, coverageScore - freshnessPenalty - confidencePenalty)),
        completeness: checks,
        missingFields,
        lowConfidenceFields,
      }
    },
  }
}

module.exports = { createEvidenceService, serializeEvidence }
