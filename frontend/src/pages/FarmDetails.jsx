import { useParams } from 'react-router-dom'

export function FarmDetails() {
  const { farmId } = useParams()

  return (
    <section className="page">
      <div className="eyebrow">Farm details</div>
      <h1>Farm Details</h1>
      <p>
        Route ready for farm profile, availability, and location information.
      </p>
      <div className="route-note">Current route id: {farmId}</div>
    </section>
  )
}
