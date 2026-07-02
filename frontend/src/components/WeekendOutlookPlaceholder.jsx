export function WeekendOutlookPlaceholder() {
  return (
    <section className="weekend-outlook-placeholder">
      <div>
        <span className="eyebrow">Weekend Picks</span>
        <h2>Trip planning is warming up.</h2>
        <p>
          Weekend recommendations will combine crop readiness, freshness, farm
          density, and drive-worthiness.
        </p>
      </div>
      <div className="outlook-panel">
        {/* TODO(real-weekend-outlook): generate weekend picks from harvest summaries, reports, and farm availability. */}
        {/* TODO(weather-integration): incorporate rain, heat, and smoke conditions before recommending trips. */}
        {/* TODO(region-specific-harvest): calculate region-specific summaries instead of statewide crop rollups. */}
        <strong>Next up</strong>
        <span>Weather-aware picks</span>
        <span>Region confidence</span>
        <span>Best-value harvest routes</span>
      </div>
    </section>
  )
}
