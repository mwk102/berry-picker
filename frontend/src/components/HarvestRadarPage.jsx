import { EmptyState } from './EmptyState'
import { DailyHarvestSummary } from './DailyHarvestSummary'
import { HarvestEventsList } from './HarvestEventsList'
import { HarvestHero } from './HarvestHero'
import { HarvestSummaryGrid } from './HarvestSummaryGrid'
import { WeekendOutlookPlaceholder } from './WeekendOutlookPlaceholder'
import { useDailyHarvest, useHarvestEvents, useHarvestRadar } from '../hooks/useHarvestRadar'
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
  const dailyQuery = useDailyHarvest()
  const eventsQuery = useHarvestEvents({ limit: 12 })
  const summaries = harvestQuery.data?.data || []
  const visibleSummaries = summaries.filter((summary) => summary.activeFarmCount > 0)

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
      <HarvestHero harvestCount={visibleSummaries.length} />

      <DailyHarvestSummary
        isLoading={dailyQuery.isLoading}
        summary={dailyQuery.data?.data}
      />

      <HarvestEventsList
        events={eventsQuery.data?.data || []}
        isLoading={eventsQuery.isLoading}
      />

      {harvestQuery.isLoading ? (
        <HarvestSkeleton />
      ) : visibleSummaries.length > 0 ? (
        <HarvestSummaryGrid summaries={visibleSummaries} />
      ) : (
        <EmptyState title="No harvest signals yet">
          Active crop signals will appear here once farms have current harvest data.
        </EmptyState>
      )}

      <WeekendOutlookPlaceholder />
    </div>
  )
}
