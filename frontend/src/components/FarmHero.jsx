import { FarmActions } from './FarmActions'

export function FarmHero({ farm }) {
  return (
    <section className="farm-detail-hero">
      <div className="farm-hero-copy">
        <span className="eyebrow">Farm Intelligence</span>
        <h1>{farm.name}</h1>
        <p className="farm-location">
          {farm.city}, {farm.state}
          <span className={farm.isVerified ? 'verified-badge' : 'unverified-badge'}>
            {farm.isVerified ? 'Verified' : 'Unverified data'}
          </span>
        </p>
        <p>{farm.description || 'Farm details are being gathered for this listing.'}</p>
        <FarmActions farm={farm} />
      </div>
      <div className="farm-hero-image" role="img" aria-label={`${farm.name} placeholder`}>
        {/* TODO(real-photos): replace this generated placeholder treatment with real farm photos. */}
        <span>{farm.name.slice(0, 1)}</span>
      </div>
    </section>
  )
}
