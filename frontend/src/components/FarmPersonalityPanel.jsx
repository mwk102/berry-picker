export function FarmPersonalityPanel({ personality }) {
  if (!personality?.bestFor?.length && !personality?.knownFor?.length) {
    return null
  }

  return (
    <section className="farm-panel farm-personality-panel">
      <div className="panel-heading">
        <h2>Farm personality</h2>
      </div>

      <div className="personality-groups">
        {personality.bestFor?.length ? (
          <div>
            <strong>Best for</strong>
            <div className="personality-chip-list">
              {personality.bestFor.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </div>
        ) : null}
        {personality.knownFor?.length ? (
          <div>
            <strong>Known for</strong>
            <div className="personality-chip-list">
              {personality.knownFor.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}
