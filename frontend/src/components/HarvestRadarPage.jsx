import { EmptyState } from './EmptyState'
import { HarvestHero } from './HarvestHero'
import { HarvestSummaryGrid } from './HarvestSummaryGrid'
import { WeekendOutlookPlaceholder } from './WeekendOutlookPlaceholder'
import { useHarvestRadar } from '../hooks/useHarvestRadar'
import { usePageTitle } from '../hooks/usePageTitle'
import './HarvestRadarPage.css'

function HarvestSkeleton() {
  return (
    <section className="harvest-summary-grid" aria-label="Loading Harvest Radar">
      {Array.from({ length: 6 }).map((_, index) => (
        <div className="harvest-card-skeleton" key={index}>
          <span />
          <strong />
          <p />
          <div />
        </div>
      ))}
    </section>
  )
}

export function HarvestRadarPage() {
  usePageTitle('Harvest Radar')

  const harvestQuery = useHarvestRadar()
  const summaries = harvestQuery.data?.data || []

  if (harvestQuery.error) {
    return (
      <div className="harvest-radar-page">
        <HarvestHero />
        <EmptyState title="Harvest Radar is offline">
          {harvestQuery.error.message ||
            'The harvest API could not be reached. Make sure the backend server is running.'}
        </EmptyState>
      </div>
    )
  }

  return (
    <div className="harvest-radar-page">
      <HarvestHero harvestCount={summaries.length} />

      {harvestQuery.isLoading ? (
        <HarvestSkeleton />
      ) : summaries.length > 0 ? (
        <HarvestSummaryGrid summaries={summaries} />
      ) : (
        <EmptyState title="No harvest signals yet">
          Harvest summaries will appear here after the backend seed or
          recalculation job runs.
        </EmptyState>
      )}

      <WeekendOutlookPlaceholder />
    </div>
  )
}
