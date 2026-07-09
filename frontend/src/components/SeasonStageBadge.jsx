const stageLabels = {
  COMING_SOON: 'Coming soon',
  STARTING: 'Starting',
  PEAK: 'Peak',
  ENDING_SOON: 'Ending soon',
  ENDED: 'Ended',
  LIMITED: 'Limited',
  UNAVAILABLE: 'Unavailable',
  UNKNOWN: 'Unknown',
}

export function normalizeSeasonStage(stage) {
  const stageMap = {
    UPCOMING: 'COMING_SOON',
    EARLY: 'STARTING',
    PEAK: 'PEAK',
    LATE: 'ENDING_SOON',
    ENDED: 'ENDED',
    UNKNOWN: 'UNKNOWN',
  }

  return stageMap[stage] || stage || 'UNKNOWN'
}

export function SeasonStageBadge({ stage }) {
  const normalizedStage = normalizeSeasonStage(stage)

  return (
    <span className={`season-stage-badge ${normalizedStage.toLowerCase()}`}>
      {stageLabels[normalizedStage] || normalizedStage}
    </span>
  )
}
