export function FarmPersonalityPanel({ personality }) {
  const bestFor = (personality?.bestFor || []).filter((item) => item !== 'Young Children')
  const knownFor = personality?.knownFor || []

  if (!bestFor.length && !knownFor.length) {
    return null
  }

  return (
    <section className="farm-panel farm-personality-panel">
      <div className="panel-heading">
        <h2>Farm personality</h2>
      </div>

      <div className="personality-groups">
        {bestFor.length ? (
          <div>
            <strong>Best for</strong>
            <div className="personality-chip-list">
              {bestFor.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </div>
        ) : null}
        {knownFor.length ? (
          <div>
            <strong>Known for</strong>
            <div className="personality-chip-list">
              {knownFor.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}
