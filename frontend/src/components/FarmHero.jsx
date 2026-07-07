import { FarmActions } from './FarmActions'
import { formatDate } from './FarmDetailUtils'

function formatTrustStatus(status) {
  if (status === 'GOLD_STANDARD') return 'Gold Standard Farm'
  if (status === 'VERIFIED') return 'Verified Farm'
  if (status === 'PENDING_REVIEW') return 'Verification pending'
  return 'Trust review in progress'
}

export function FarmHero({ farm }) {
  const profile = farm.verificationProfile
  const heroImageUrl = profile?.heroImageUrl

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
        {profile ? (
          <div className="farm-trust-summary">
            <strong>{formatTrustStatus(profile.status)}</strong>
            <span>Official website reviewed {formatDate(profile.lastResearchedAt)}</span>
          </div>
        ) : null}
        <FarmActions farm={farm} />
      </div>
      <div
        className="farm-hero-image"
        role="img"
        aria-label={`${farm.name} ${heroImageUrl ? 'photo' : 'placeholder'}`}
        style={
          heroImageUrl
            ? {
                backgroundImage: `linear-gradient(rgba(16, 37, 26, 0.12), rgba(16, 37, 26, 0.22)), url(${heroImageUrl})`,
              }
            : undefined
        }
      >
        {/* TODO(real-photos): replace this generated placeholder treatment with real farm photos. */}
        {!heroImageUrl ? <span>{farm.name.slice(0, 1)}</span> : null}
        {profile?.photoAttribution ? (
          <small className="photo-attribution">{profile.photoAttribution}</small>
        ) : null}
      </div>
    </section>
  )
}
