import { Link } from 'react-router-dom'

export function NearbyFarms({ farms = [] }) {
  return (
    <section className="farm-panel nearby-farms-panel">
      <div className="panel-heading">
        <h2>Nearby alternatives</h2>
      </div>

      {farms.length === 0 ? (
        <p className="panel-muted">
          Nearby alternatives will appear after more verified farms are available.
        </p>
      ) : (
        <div className="nearby-farm-list">
          {farms.map((farm) => (
            <Link className="nearby-farm-row" key={farm.id} to={`/farms/${farm.slug}`}>
              <strong>{farm.name}</strong>
              <span>
                {farm.distanceMiles} mi away
                {farm.sharedCropCount > 0 ? ` - ${farm.sharedCropCount} shared crops` : ''}
                {` - harvest signal ${farm.harvestQualityScore}/5`}
              </span>
            </Link>
          ))}
        </div>
      )}

      {/* TODO(community-reports): fold trusted visitor reports into nearby farm ranking. */}
    </section>
  )
}
