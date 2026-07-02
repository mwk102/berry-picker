function confidenceLabel(score) {
  if (score >= 80) return 'High confidence'
  if (score >= 55) return 'Medium confidence'
  if (score > 0) return 'Low confidence'
  return 'No confidence'
}

function confidenceTone(score) {
  if (score >= 80) return 'high'
  if (score >= 55) return 'medium'
  if (score > 0) return 'low'
  return 'none'
}

export function ConfidenceBadge({ score = 0 }) {
  return (
    <span className={`confidence-badge ${confidenceTone(score)}`}>
      {confidenceLabel(score)} · {score}%
    </span>
  )
}
