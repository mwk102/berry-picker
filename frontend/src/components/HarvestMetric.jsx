export function HarvestMetric({ label, value }) {
  return (
    <span className="harvest-metric">
      <strong>{value}</strong>
      <span>{label}</span>
    </span>
  )
}
