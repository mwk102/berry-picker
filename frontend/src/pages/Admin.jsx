import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFieldObservation, getAdminDailyCycle, getFarms, getRefreshDueEvidence } from '../lib/api'
import { EvidencePanel } from '../components/EvidencePanel'
import { confidenceForFarm } from '../components/FarmDetailUtils'
import { FarmConfidencePanel } from '../components/FarmConfidencePanel'
import { GoldStandardPanel } from '../components/GoldStandardPanel'
import './Admin.css'

const conditions = [
  'EXCELLENT',
  'GOOD',
  'LIMITED',
  'PICKED_OVER',
  'CLOSED',
  'COMING_SOON',
  'SEASON_OVER',
  'UNKNOWN',
]

const crowdLevels = ['QUIET', 'MODERATE', 'BUSY', 'VERY_BUSY', 'UNKNOWN']

function formatLabel(value) {
  return value.replace(/_/g, ' ').toLowerCase().replace(/^./, (letter) => letter.toUpperCase())
}

function localDateTimeValue(date = new Date()) {
  const offsetMs = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16)
}

function toIsoFromLocalDateTime(value) {
  return value ? new Date(value).toISOString() : new Date().toISOString()
}

function addHoursIso(dateTimeValue, hours) {
  const date = dateTimeValue ? new Date(dateTimeValue) : new Date()
  date.setHours(date.getHours() + Number(hours || 24))
  return date.toISOString()
}

export function Admin() {
  const queryClient = useQueryClient()
  const farmsQuery = useQuery({
    queryKey: ['admin-farms'],
    queryFn: () => getFarms({ limit: 100, includeUnverified: true }),
  })
  const refreshDueQuery = useQuery({
    queryKey: ['admin-refresh-due'],
    queryFn: getRefreshDueEvidence,
  })
  const dailyCycleQuery = useQuery({
    queryKey: ['admin-daily-cycle'],
    queryFn: getAdminDailyCycle,
  })
  const farms = farmsQuery.data?.data || []
  const [farmId, setFarmId] = useState('')
  const [farmCropId, setFarmCropId] = useState('')
  const [condition, setCondition] = useState('PICKED_OVER')
  const [crowdLevel, setCrowdLevel] = useState('UNKNOWN')
  const [observedAt, setObservedAt] = useState(localDateTimeValue())
  const [expiresInHours, setExpiresInHours] = useState(24)
  const [confidenceScore, setConfidenceScore] = useState(90)
  const [observation, setObservation] = useState('')

  const selectedFarm = useMemo(
    () => farms.find((farm) => farm.id === farmId),
    [farmId, farms],
  )
  const selectedFarmConfidence = selectedFarm ? confidenceForFarm(selectedFarm) : null
  const farmCrops = selectedFarm?.crops || []

  const mutation = useMutation({
    mutationFn: () =>
      createFieldObservation(farmId, {
        farmCropId,
        condition,
        crowdLevel,
        observedAt: toIsoFromLocalDateTime(observedAt),
        expiresAt: addHoursIso(observedAt, expiresInHours),
        confidenceScore: Number(confidenceScore),
        observation,
      }),
    onSuccess: () => {
      setObservation('')
      queryClient.invalidateQueries({ queryKey: ['admin-refresh-due'] })
      queryClient.invalidateQueries({ queryKey: ['farms'] })
      if (selectedFarm?.slug) {
        queryClient.invalidateQueries({ queryKey: ['farm', selectedFarm.slug] })
      }
    },
  })

  function handleFarmChange(event) {
    const nextFarmId = event.target.value
    const nextFarm = farms.find((farm) => farm.id === nextFarmId)
    setFarmId(nextFarmId)
    setFarmCropId(nextFarm?.crops?.[0]?.id || '')
  }

  function handleSubmit(event) {
    event.preventDefault()
    mutation.mutate()
  }

  return (
    <section className="page admin-page">
      <div className="eyebrow">Operations</div>
      <h1>Field checks</h1>
      <p>
        Log fast observations from a drive-by, farm visit, phone call, or owner update.
        This creates evidence and a current picking report.
      </p>

      <div className="admin-grid">
        <form className="admin-panel field-observation-form" onSubmit={handleSubmit}>
          {/* TODO(auth-required): hide this form behind admin auth before launch. */}
          <div className="admin-panel-heading">
            <h2>Quick field observation</h2>
            <span>Evidence + report</span>
          </div>

          <label>
            <span>Farm</span>
            <select value={farmId} onChange={handleFarmChange} required>
              <option value="">Choose a farm</option>
              {farms.map((farm) => (
                <option key={farm.id} value={farm.id}>
                  {farm.name} - {farm.city}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Crop</span>
            <select
              value={farmCropId}
              onChange={(event) => setFarmCropId(event.target.value)}
              required
            >
              <option value="">Choose a crop</option>
              {farmCrops.map((farmCrop) => (
                <option key={farmCrop.id} value={farmCrop.id}>
                  {farmCrop.crop?.name || 'Crop'}
                </option>
              ))}
            </select>
          </label>

          <div className="admin-form-row">
            <label>
              <span>Condition</span>
              <select value={condition} onChange={(event) => setCondition(event.target.value)}>
                {conditions.map((item) => (
                  <option key={item} value={item}>
                    {formatLabel(item)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Crowd</span>
              <select value={crowdLevel} onChange={(event) => setCrowdLevel(event.target.value)}>
                {crowdLevels.map((item) => (
                  <option key={item} value={item}>
                    {formatLabel(item)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="admin-form-row">
            <label>
              <span>Observed</span>
              <input
                type="datetime-local"
                value={observedAt}
                onChange={(event) => setObservedAt(event.target.value)}
              />
            </label>
            <label>
              <span>Expires in hours</span>
              <input
                min="1"
                max="168"
                type="number"
                value={expiresInHours}
                onChange={(event) => setExpiresInHours(event.target.value)}
              />
            </label>
          </div>

          <label>
            <span>Confidence</span>
            <input
              min="0"
              max="100"
              type="number"
              value={confidenceScore}
              onChange={(event) => setConfidenceScore(event.target.value)}
            />
          </label>

          <label>
            <span>Observation</span>
            <textarea
              rows="4"
              value={observation}
              onChange={(event) => setObservation(event.target.value)}
              placeholder="Example: Roadside sign said closed, field picked out."
              required
            />
          </label>

          <button className="button button-primary" disabled={mutation.isPending} type="submit">
            {mutation.isPending ? 'Saving...' : 'Save observation'}
          </button>
          {mutation.isSuccess ? <p className="admin-success">Observation saved.</p> : null}
          {mutation.error ? <p className="admin-error">{mutation.error.message}</p> : null}
        </form>

        <aside className="admin-panel refresh-due-panel">
          <div className="admin-panel-heading">
            <h2>Refresh queue</h2>
            <span>{refreshDueQuery.data?.data?.length || 0} due</span>
          </div>

          {refreshDueQuery.isLoading ? <p>Checking freshness...</p> : null}
          {refreshDueQuery.error ? <p className="admin-error">{refreshDueQuery.error.message}</p> : null}
          {(refreshDueQuery.data?.data || []).slice(0, 12).map((record) => (
            <article className="refresh-due-item" key={record.id}>
              <strong>{record.farm?.name || 'Farm'}</strong>
              <span>{record.crop?.name || record.fieldName}</span>
              <span>{formatLabel(record.reason || record.status)}</span>
            </article>
          ))}
          {refreshDueQuery.data?.data?.length === 0 ? (
            <p>No urgent refresh work right now.</p>
          ) : null}
        </aside>
      </div>

      <section className="admin-panel daily-cycle-panel">
        <div className="admin-panel-heading">
          <h2>Daily Cycle</h2>
          <span>{dailyCycleQuery.data?.data?.events?.length || 0} events today</span>
        </div>
        {dailyCycleQuery.isLoading ? <p>Loading daily cycle...</p> : null}
        {dailyCycleQuery.error ? <p className="admin-error">{dailyCycleQuery.error.message}</p> : null}
        {dailyCycleQuery.data?.data ? (
          <div className="daily-cycle-grid">
            <span>
              <strong>Last summary</strong>
              {dailyCycleQuery.data.data.summary?.headline || 'No summary generated yet'}
            </span>
            <span>
              <strong>Stale evidence</strong>
              {dailyCycleQuery.data.data.staleEvidenceCount}
            </span>
            <span>
              <strong>Refresh due</strong>
              {dailyCycleQuery.data.data.refreshDueCount}
            </span>
            <span>
              <strong>Generated</strong>
              {dailyCycleQuery.data.data.summary?.generatedAt
                ? new Date(dailyCycleQuery.data.data.summary.generatedAt).toLocaleString()
                : 'Not generated'}
            </span>
          </div>
        ) : null}
        <div className="daily-cycle-events">
          {(dailyCycleQuery.data?.data?.events || []).slice(0, 5).map((event) => (
            <article key={event.id}>
              <strong>{event.title}</strong>
              <span>{event.farm?.name || event.crop?.name || event.eventType}</span>
            </article>
          ))}
        </div>
      </section>

      <div className="admin-review-grid">
        {selectedFarm ? (
          <>
            <GoldStandardPanel profile={selectedFarm.verificationProfile} />
            <FarmConfidencePanel confidence={selectedFarmConfidence} />
            <EvidencePanel evidence={selectedFarm.evidence || []} />
          </>
        ) : (
          <section className="admin-panel">
            <div className="admin-panel-heading">
              <h2>Gold Standard review</h2>
              <span>Select a farm</span>
            </div>
            <p>Choose a farm in the field observation form to inspect its completeness, missing fields, and verification needs.</p>
          </section>
        )}
      </div>
    </section>
  )
}
