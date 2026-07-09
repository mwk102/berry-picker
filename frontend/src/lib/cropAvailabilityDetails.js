export function cropAvailabilityDetails(farm, farmCrop) {
  const farmCropId = farmCrop?.id
  if (!farmCropId) return null

  const evidence = [...(farm?.evidence || [])]
    .filter((record) => {
      const available = record.normalizedValue?.available
      return (
        record.farmCropId === farmCropId &&
        record.evidenceType === 'CROP_AVAILABILITY' &&
        Array.isArray(available) &&
        available.length > 0 &&
        record.status !== 'expired'
      )
    })
    .sort((first, second) => new Date(second.observedAt) - new Date(first.observedAt))[0]

  if (!evidence) return null

  return {
    items: evidence.normalizedValue.available,
    label: evidence.normalizedValue.available.join(', '),
    sourceUrl: evidence.sourceUrl,
    observedAt: evidence.observedAt,
  }
}
