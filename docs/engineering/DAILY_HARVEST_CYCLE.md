# Daily Harvest Cycle

## Why It Exists

Northwest U-Pick answers perishable questions: what is ready, what changed, and whether a farm is worth visiting today. Farm websites and social updates change quickly, so the app needs a daily operating rhythm instead of static directory data.

The Daily Harvest Cycle turns evidence, picking reports, Harvest Radar summaries, and freshness signals into a morning digest.

## How Summaries Are Generated

The backend service `DailyHarvestService` runs deterministic rules. It does not use AI-generated text.

The cycle:

1. Recalculates Harvest Radar summaries.
2. Reads approved picking reports created today.
3. Reads expired or stale evidence for active approved farms.
4. Generates `HarvestEvent` rows for meaningful changes.
5. Chooses a conservative top recommendation from recent approved reports.
6. Upserts one `DailyHarvestSummary` for the date.

The summary includes a headline, body, highlights, recommendation, confidence score, freshness score, and generation timestamp.

## Event Generation

Events are created for:

- crops showing peak or late-season signals
- farms with fresh open/limited/good reports
- farms or crops reported closed, picked over, or season over
- fresh reports received
- evidence that has expired and needs review

Events are idempotent by date, type, farm, crop, and title so the daily script can be rerun safely.

## Data Sources

The cycle uses local PostgreSQL data:

- `Evidence`
- `PickingReport`
- `HarvestSummary`
- `Farm`
- `Crop`
- `FarmVerificationProfile`

It does not fetch external websites directly yet. External source checks still happen through admin review or import scripts.

## How This Makes The App Feel Alive

Harvest Radar now has a daily section that says what matters today, not just static crop cards. The app can surface changes such as:

- “Raspberry has a fresh farm update today.”
- “Strawberries appear to be winding down based on recent reports.”
- “Several farms need updated source checks.”

The copy is intentionally conservative and points users back to farm sources before driving.

## Running The Cycle

From `backend/`:

```bash
npm run harvest:daily
```

The script prints the generated summary, event count, stale evidence count, refresh due count, and events created or updated.

## API

- `GET /api/harvest/daily`
- `GET /api/harvest/events`
- `GET /api/admin/daily-cycle`

Admin routes are currently unprotected for local MVP development. TODO: require admin authentication before launch.

## Future Ideas

- Weather-aware morning notes
- Email digest for subscribers
- Push notifications for favorite crops/farms
- Website-change monitoring
- Social-source review queue
- “Changed since yesterday” comparisons using stored daily summaries
