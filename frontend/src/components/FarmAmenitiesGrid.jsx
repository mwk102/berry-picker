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

export function FarmAmenitiesGrid({ amenities }) {
  const availableAmenities = new Set(amenities.map((amenity) => amenity.slug))

  return (
    <section className="farm-panel">
      <div className="panel-heading">
        <h2>Amenities</h2>
      </div>
      <div className="amenities-grid">
        {expectedAmenities.map((amenity) => {
          const isAvailable = availableAmenities.has(amenity.slug)
          return (
            <span className={isAvailable ? 'amenity available' : 'amenity'} key={amenity.slug}>
              <strong>{isAvailable ? 'Yes' : 'Unknown'}</strong>
              {amenity.label}
            </span>
          )
        })}
      </div>
    </section>
  )
}
