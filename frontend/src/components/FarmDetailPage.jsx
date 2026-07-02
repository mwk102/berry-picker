import { Link, useParams } from 'react-router-dom'
import { EmptyState } from './EmptyState'
import { FarmAmenitiesGrid } from './FarmAmenitiesGrid'
import { FarmAnnouncements } from './FarmAnnouncements'
import { FarmConfidencePanel } from './FarmConfidencePanel'
import { FarmCropStatusList } from './FarmCropStatusList'
import { FarmHero } from './FarmHero'
import { FarmHoursPanel } from './FarmHoursPanel'
import { FarmPersonalityPanel } from './FarmPersonalityPanel'
import { FarmPricePanel } from './FarmPricePanel'
import { FarmReportsList } from './FarmReportsList'
import { FarmStatusPanel } from './FarmStatusPanel'
import { GoldStandardPanel } from './GoldStandardPanel'
import { HarvestTimeline } from './HarvestTimeline'
import { NearbyFarms } from './NearbyFarms'
import { WhyVisitToday } from './WhyVisitToday'
import {
  confidenceForFarm,
  getLatestReport,
  reportFreshnessDays,
  seasonStageForCrop,
  whyVisitToday,
  worthTheDriveDetails,
} from './FarmDetailUtils'
import { useFarm } from '../hooks/useFarms'
import { usePageTitle } from '../hooks/usePageTitle'
import './FarmDetailPage.css'

function FarmDetailSkeleton() {
  return (
    <div className="farm-detail-page">
      <div className="farm-detail-skeleton hero" />
      <div className="farm-detail-grid">
        <div className="farm-detail-skeleton" />
        <div className="farm-detail-skeleton" />
        <div className="farm-detail-skeleton wide" />
      </div>
    </div>
  )
}

function buildCropStatuses(farm) {
  return (farm.crops || []).map((farmCrop) => {
    const latestReport = getLatestReport(farmCrop.reports)
    const freshness = reportFreshnessDays(latestReport)
    const verifiedPriceCount = (farmCrop.prices || []).filter((price) => price.isVerified).length
    const confidenceScore = Math.min(
      100,
      30 +
        Math.min(25, (farmCrop.prices?.length || 0) * 8) +
        Math.min(25, (farmCrop.reports?.length || 0) * 10) +
        (freshness !== null && freshness <= 3 ? 10 : 0) +
        Math.min(10, verifiedPriceCount * 5),
    )

    return {
      ...farmCrop,
      name: farmCrop.crop?.name || 'Crop',
      stage: seasonStageForCrop(farmCrop),
      confidenceScore,
    }
  })
}

function buildPriceRows(farm) {
  const cropNameById = new Map(
    (farm.crops || []).map((farmCrop) => [farmCrop.crop?.id, farmCrop.crop?.name]),
  )

  return (farm.prices || []).map((price) => ({
    ...price,
    cropName: cropNameById.get(price.cropId) || 'Crop',
  }))
}

export function FarmDetailPage() {
  const { slug } = useParams()
  const farmQuery = useFarm(slug)
  const farm = farmQuery.data?.data

  usePageTitle(farm?.name || 'Farm Details')

  if (farmQuery.isLoading) {
    return <FarmDetailSkeleton />
  }

  if (farmQuery.error) {
    const isNotFound = farmQuery.error.status === 404
    return (
      <div className="farm-detail-page">
        <EmptyState title={isNotFound ? 'Farm not found' : 'Unable to load farm'}>
          {isNotFound
            ? 'This farm listing may no longer be available.'
            : farmQuery.error.message || 'The API could not be reached.'}
        </EmptyState>
        <Link className="farm-detail-back-link" to="/farms">
          Back to Farm Finder
        </Link>
      </div>
    )
  }

  if (!farm) {
    return (
      <div className="farm-detail-page">
        <EmptyState title="Farm not found">
          This farm listing may no longer be available.
        </EmptyState>
      </div>
    )
  }

  const cropStatuses = buildCropStatuses(farm)
  const confidence = confidenceForFarm(farm)
  const priceRows = buildPriceRows(farm)
  const worthTheDrive = worthTheDriveDetails(farm, cropStatuses)
  const whyVisit = whyVisitToday(farm, cropStatuses)

  return (
    <div className="farm-detail-page">
      {/* TODO(owner-verified-updates): allow farm owners to update hours, prices, crops, and announcements. */}
      {/* TODO(community-report-submission): add visitor report submission after auth/community trust is ready. */}
      <FarmHero farm={farm} />

      <FarmStatusPanel
        confidence={confidence}
        cropStatuses={cropStatuses}
        farm={farm}
        worthTheDrive={worthTheDrive}
      />

      <div className="farm-detail-grid">
        <WhyVisitToday reason={whyVisit} />
        <FarmCropStatusList cropStatuses={cropStatuses} />
        <HarvestTimeline cropStatuses={cropStatuses} />
        <FarmPersonalityPanel personality={farm.verificationProfile?.personality} />
        <FarmConfidencePanel confidence={confidence} />
        <GoldStandardPanel profile={farm.verificationProfile} />
        <FarmPricePanel prices={priceRows} />
        <FarmHoursPanel hours={farm.hours || []} specialHours={farm.specialHours || []} />
        <FarmAmenitiesGrid amenities={farm.amenities || []} />
        <FarmReportsList reports={farm.pickingReports || []} />
        <FarmAnnouncements announcements={farm.announcements || []} />
        <NearbyFarms farms={farm.nearbyFarms || []} />
      </div>
    </div>
  )
}
