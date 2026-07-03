# Evidence Engine

## Why Evidence Exists

Evidence records preserve the source trail behind important farm facts. Farm, price, hour, report, announcement, and amenity tables remain the product-facing data model, while Evidence explains why Northwest U-Pick trusts a field.

This lets reviewers answer:

- Where did this value come from?
- When was it observed?
- Who or what verified it?
- When does it need review again?
- Is it official, community-submitted, imported, or manually researched?

## Trust Model

Evidence supports trust by making source attribution consistent across different data types:

- pricing
- hours
- crop availability
- harvest status
- amenities
- announcements
- contact details
- locations
- photos

Each record has a type, field name, raw value, optional normalized JSON, source URL, source type, confidence score, observed date, optional verified date, optional expiration date, and verification method.

## FarmVerificationProfile

`FarmVerificationProfile` summarizes evidence for a farm. The EvidenceService calculates:

- source count
- verified field count
- missing field count
- expired evidence count
- low confidence field count
- completeness score

For MVP, completeness is based on coverage for address, coordinates, website, phone, hours, price, amenity, photo, and crop availability. This keeps the score transparent and reviewable.

## Harvest Radar

Evidence should eventually feed Harvest Radar by providing:

- freshness signals for crop availability and harvest status
- confidence weighting by source type
- expiration windows for time-sensitive harvest updates
- price provenance for trend calculations
- region-level summaries backed by source trails

For now, Harvest Radar continues using the existing summary tables and deterministic services. Evidence is available for future scoring and auditing.

## Manual For Now

The current workflow is still admin/manual:

- admins create or seed evidence
- source URLs are reviewed by people
- official website updates are not scanned automatically
- owner-submitted evidence is not implemented
- community evidence moderation is not implemented
- photos are placeholders until upload/review exists

Future work should add the website scanner, owner portal, community report moderation, and automated evidence expiration queues.
