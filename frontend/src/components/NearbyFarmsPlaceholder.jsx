export function NearbyFarmsPlaceholder() {
  return (
    <section className="farm-panel nearby-placeholder">
      <div className="panel-heading">
        <h2>Nearby farms</h2>
      </div>
      {/* TODO(nearby-farm-recommendations): recommend nearby alternatives using distance, crop overlap, and freshness. */}
      <p className="panel-muted">
        Nearby recommendations will compare distance, crop availability, and
        recent harvest signals.
      </p>
    </section>
  )
}
