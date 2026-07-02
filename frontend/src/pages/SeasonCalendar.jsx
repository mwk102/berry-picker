import { Link } from 'react-router-dom'
import { usePageTitle } from '../hooks/usePageTitle'

export function SeasonCalendar() {
  usePageTitle('Season Calendar')

  return (
    <section className="page compact-page">
      <span className="eyebrow">Season Calendar</span>
      <h1>Crop timing, soon.</h1>
      <p>
        A calendar view will turn Harvest Radar signals into month-by-month
        picking expectations.
      </p>
      <Link className="button-link" to="/">
        Back to Harvest Radar
      </Link>
    </section>
  )
}
