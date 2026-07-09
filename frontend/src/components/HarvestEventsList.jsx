import { Link } from 'react-router-dom'

function formatEventType(value) {
  return value.replace(/_/g, ' ').toLowerCase().replace(/^./, (letter) => letter.toUpperCase())
}

function EventDescription({ event }) {
  const farmName = event.farm?.name
  const farmSlug = event.farm?.slug

  if (!farmName || !farmSlug || !event.description?.includes(farmName)) {
    return <p>{event.description}</p>
  }

  const [beforeFarm, ...afterFarmParts] = event.description.split(farmName)
  const afterFarm = afterFarmParts.join(farmName)

  return (
    <p>
      {beforeFarm}
      <Link className="harvest-inline-link" to={`/farms/${farmSlug}`}>
        {farmName}
      </Link>
      {afterFarm}
    </p>
  )
}

export function HarvestEventsList({ events = [], isLoading }) {
  if (isLoading) {
    return (
      <section className="harvest-events-section">
        <h2>What changed today</h2>
        <p>Checking today's harvest changes...</p>
      </section>
    )
  }

  return (
    <section className="harvest-events-section">
      <div className="section-heading-row">
        <h2>What changed today</h2>
        <span>{events.length} events</span>
      </div>
      {events.length > 0 ? (
        <div className="harvest-events-list">
          {events.slice(0, 6).map((event) => (
            <article className="harvest-event-card" key={event.id}>
              <span>{formatEventType(event.eventType)}</span>
              <strong>{event.title}</strong>
              <EventDescription event={event} />
            </article>
          ))}
        </div>
      ) : (
        <p className="panel-muted">No daily harvest events yet. Run the morning cycle to generate today's changes.</p>
      )}
    </section>
  )
}
