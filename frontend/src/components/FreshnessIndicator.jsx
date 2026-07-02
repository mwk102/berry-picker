function formatUpdatedAt(value) {
  if (!value) return 'Not calculated yet'

  const updatedAt = new Date(value)
  const relativeFormatter = new Intl.RelativeTimeFormat('en-US', {
    numeric: 'auto',
  })
  const elapsedMs = updatedAt.getTime() - Date.now()
  const elapsedMinutes = Math.round(elapsedMs / 60000)
  const elapsedHours = Math.round(elapsedMs / 3600000)

  if (Math.abs(elapsedMinutes) < 60) {
    return relativeFormatter.format(elapsedMinutes, 'minute')
  }

  if (Math.abs(elapsedHours) < 48) {
    return relativeFormatter.format(elapsedHours, 'hour')
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(updatedAt)
}

export function FreshnessIndicator({ calculatedAt, reportFreshness }) {
  const reportText =
    typeof reportFreshness === 'number'
      ? `Latest report ${reportFreshness}d old`
      : 'No recent reports'

  return (
    <span className="freshness-indicator">
      Updated {formatUpdatedAt(calculatedAt)} · {reportText}
    </span>
  )
}
