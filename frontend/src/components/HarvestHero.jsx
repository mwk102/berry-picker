import { Link } from 'react-router-dom'

export function HarvestHero({ harvestCount = 0 }) {
  return (
    <section className="harvest-hero">
      <div>
        <span className="eyebrow">Harvest Radar</span>
        <h1>Know what is ready before you make the drive.</h1>
        <p>
          Track what is picking now, where the strongest harvest signals are,
          what it costs, and whether the trip looks worthwhile.
        </p>
        <div className="hero-actions">
          <Link className="hero-primary-action" to="/farms">
            Find Farms Near Me
          </Link>
          <span>{harvestCount} crop signals online</span>
        </div>
      </div>
    </section>
  )
}
