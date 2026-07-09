const expectedAmenities = [
  { slug: 'parking', label: 'Parking' },
  { slug: 'restrooms', label: 'Restrooms' },
  { slug: 'kid-friendly', label: 'Kid Friendly' },
  { slug: 'wheelchair-accessible', label: 'Wheelchair Accessible' },
  { slug: 'farm-store', label: 'Farm Store' },
  { slug: 'picnic-area', label: 'Picnic Area' },
  { slug: 'pet-friendly', label: 'Pet Friendly' },
  { slug: 'food-available', label: 'Food Available' },
  { slug: 'organic', label: 'Organic' },
  { slug: 'wagon-rides', label: 'Wagon Rides' },
]

function petPolicyFromEvidence(evidence = []) {
  return evidence.find(
    (record) =>
      record.evidenceType === 'AMENITY' &&
      record.fieldName === 'petPolicy' &&
      record.normalizedValue?.petFriendly === false &&
      record.status !== 'expired',
  )
}

export function FarmAmenitiesGrid({ amenities, evidence = [] }) {
  const noPetsPolicy = petPolicyFromEvidence(evidence)
  const availableAmenities = new Set(amenities.map((amenity) => amenity.slug))
  const confirmedAmenities = expectedAmenities.filter(
    (amenity) => availableAmenities.has(amenity.slug) && !(noPetsPolicy && amenity.slug === 'pet-friendly'),
  )
  const unconfirmedAmenities = expectedAmenities.filter(
    (amenity) => !availableAmenities.has(amenity.slug) && !(noPetsPolicy && amenity.slug === 'pet-friendly'),
  )

  return (
    <section className="farm-panel">
      <div className="panel-heading">
        <h2>Amenities</h2>
      </div>
      {confirmedAmenities.length > 0 ? (
        <div className="amenities-grid">
          {confirmedAmenities.map((amenity) => (
            <span className="amenity available" key={amenity.slug}>
              <strong>Confirmed</strong>
              {amenity.label}
            </span>
          ))}
          {noPetsPolicy ? (
            <span className="amenity unavailable">
              <strong>Policy</strong>
              {noPetsPolicy.normalizedValue?.label || 'No pets'}
            </span>
          ) : null}
        </div>
      ) : (
        noPetsPolicy ? (
          <div className="amenities-grid">
            <span className="amenity unavailable">
              <strong>Policy</strong>
              {noPetsPolicy.normalizedValue?.label || 'No pets'}
            </span>
          </div>
        ) : (
          <p className="panel-muted">No amenities have been confirmed yet.</p>
        )
      )}
      {unconfirmedAmenities.length > 0 ? (
        <p className="amenities-unconfirmed">
          Needs confirmation: {unconfirmedAmenities.map((amenity) => amenity.label).join(', ')}
        </p>
      ) : null}
    </section>
  )
}
