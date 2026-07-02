export function FarmActions({ farm }) {
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${farm.latitude},${farm.longitude}`
  const phoneHref = farm.phone ? `tel:${farm.phone.replace(/[^\d+]/g, '')}` : null

  return (
    <div className="farm-actions">
      <a href={directionsUrl} rel="noreferrer" target="_blank">
        Get Directions
      </a>
      {farm.websiteUrl ? (
        <a href={farm.websiteUrl} rel="noreferrer" target="_blank">
          Visit Website
        </a>
      ) : null}
      {phoneHref ? <a href={phoneHref}>Call Farm</a> : null}
      {/* TODO(favorites): replace this placeholder with save/share/favorite actions. */}
      <button type="button">Share</button>
    </div>
  )
}
