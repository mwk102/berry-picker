export function WhyVisitToday({ reason }) {
  return (
    <section className="farm-panel why-visit-panel">
      <div className="panel-heading">
        <h2>Why visit today</h2>
      </div>
      <p>{reason}</p>
    </section>
  )
}
