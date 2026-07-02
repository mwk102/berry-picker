import { Link } from 'react-router-dom'
import { usePageTitle } from '../hooks/usePageTitle'

export function WeekendPicks() {
  usePageTitle('Weekend Picks')

  return (
    <section className="page compact-page">
      <span className="eyebrow">Weekend Picks</span>
      <h1>Better trip picks are coming.</h1>
      <p>
        Weekend Picks will rank promising farms using harvest readiness,
        distance, confidence, and weather-aware trip quality.
      </p>
      <Link className="button-link" to="/">
        Back to Harvest Radar
      </Link>
    </section>
  )
}
