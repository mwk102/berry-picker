import { HarvestCropCard } from './HarvestCropCard'

export function HarvestSummaryGrid({ summaries }) {
  return (
    <section className="harvest-summary-grid" aria-label="Crop harvest summaries">
      {summaries.map((summary) => (
        <HarvestCropCard key={summary.crop.slug} summary={summary} />
      ))}
    </section>
  )
}
