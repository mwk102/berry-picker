# Northwest U-Pick Database Design

## Purpose

The Northwest U-Pick database is designed to answer the four questions that determine whether someone chooses to visit a farm today:

1. **Where are the farms?**
2. **What can I pick today?**
3. **Are they open?**
4. **What does it cost?**

Every table, relationship, index, and data source should support one or more of those questions.

Northwest U-Pick is not a generic business directory. It is a decision-making platform for seasonal farm visits. The database must support accurate farm locations, seasonal crop availability, current picking conditions, opening hours, pricing, and trust/freshness metadata.

---

## Product Context

Planning a U-pick trip often requires searching across farm websites, Google Maps, Facebook pages, Instagram posts, and outdated directories.

Northwest U-Pick solves this by bringing key decision information into one trusted place.

The database should prioritize:

- **Accuracy** — data should be correct and verifiable.
- **Freshness** — users should know when information was last updated.
- **Transparency** — users should know where information came from.
- **Scalability** — the app should support more than berries over time.
- **Simplicity** — MVP data should stay focused on the core user questions.

---

## Design Philosophy

Stable information should be separated from frequently changing information.

### Stable Farm Information

Examples:

- Farm name
- Address
- Coordinates
- Website
- Phone number
- Amenities
- General description

This information belongs primarily in the `Farm` domain.

### Frequently Changing Information

Examples:

- Current crop availability
- Current picking condition
- Current price
- Today's hours
- Temporary closures
- Crowd levels
- Announcements

This information should live in separate tables with timestamps, sources, and verification fields.

Do **not** store current availability, current price, or today's open/closed status directly on the `Farm` table.

---

## Core User Questions and Data Ownership

| User Question | Primary Tables |
|---|---|
| Where are the farms? | `Farm`, `FarmHours`, `Amenity`, `FarmAmenity` |
| What can I pick today? | `Crop`, `FarmCrop`, `PickingReport` |
| Are they open? | `FarmHours`, `SpecialHours`, `Announcement` |
| What does it cost? | `CropPrice` |
| Is it worth the drive? | `PickingReport`, `FarmPhoto`, future weather/crowd data |
| Is it good for my family? | `Amenity`, `FarmAmenity`, future reviews/photos |

---

## Domain Overview

The database is organized into domains.

### Farm Domain

Stores permanent or slow-changing farm information.

Tables:

- `Farm`
- `FarmHours`
- `SpecialHours`
- `Amenity`
- `FarmAmenity`
- `FarmPhoto` *(future MVP+)*

### Crop Domain

Stores crops, seasonal availability, and crop-specific pricing.

Tables:

- `Crop`
- `FarmCrop`
- `CropPrice`

### Conditions Domain

Stores current and historical picking conditions.

Tables:

- `PickingReport`
- future `WeatherSnapshot`
- future `CrowdReport`

### User Domain

Stores users and user-generated actions.

Tables:

- `User`
- `Favorite` *(future MVP+)*
- `Review` *(future MVP+)*
- future `Notification`

### Farm Owner Domain

Supports claimed listings and farm-managed content.

Tables:

- future `FarmClaim`
- `Announcement`
- future `Event`

### Administration Domain

Supports verification, moderation, import history, and auditability.

Tables:

- future `Verification`
- future `ImportLog`
- future `AuditLog`

---

# MVP Tables

The first backend version should include:

1. `User`
2. `Farm`
3. `Crop`
4. `FarmCrop`
5. `FarmHours`
6. `SpecialHours`
7. `Amenity`
8. `FarmAmenity`
9. `CropPrice`
10. `PickingReport`
11. `Announcement`

Defer until later:

- `Review`
- `Favorite`
- `FarmPhoto`
- `FarmClaim`
- `Event`
- `Notification`
- `WeatherSnapshot`
- `ImportLog`
- `AuditLog`

---

# Table Specifications

---

## User

### Purpose

Represents people who use or manage Northwest U-Pick.

### Answers

Supports authentication, ownership, reporting, moderation, and administration.

### Responsibilities

- Store account identity.
- Store user role.
- Associate users with submitted reports.
- Support future reviews, favorites, and farm ownership.

### Fields

- `id`
- `name`
- `email`
- `passwordHash`
- `role`
- `avatarUrl`
- `createdAt`
- `updatedAt`

### Suggested Enum: `UserRole`

- `MEMBER`
- `FARM_OWNER`
- `MODERATOR`
- `ADMIN`

### Relationships

A user can:

- submit many `PickingReport` records
- author many `Announcement` records
- own or manage farms in future versions
- write reviews in future versions
- favorite farms in future versions

### Indexes / Constraints

- Unique index on `email`

### Future Considerations

- OAuth login
- Email verification
- Password reset tokens
- User reputation score
- Moderation history

---

## Farm

### Purpose

Stores permanent and slow-changing information about farms, orchards, flower fields, pumpkin patches, and other seasonal agricultural destinations.

### Answers

📍 **Where are the farms?**

### Responsibilities

- Store farm identity.
- Store public contact details.
- Store physical location.
- Store public web/social links.
- Track verification and claim status.
- Track data source and freshness.

### Fields

- `id`
- `slug`
- `name`
- `description`
- `addressLine1`
- `addressLine2`
- `city`
- `state`
- `postalCode`
- `county`
- `country`
- `latitude`
- `longitude`
- `phone`
- `email`
- `websiteUrl`
- `facebookUrl`
- `instagramUrl`
- `status`
- `isVerified`
- `isClaimed`
- `isActive`
- `dataSource`
- `lastVerifiedAt`
- `createdAt`
- `updatedAt`

### Suggested Enum: `FarmStatus`

- `ACTIVE`
- `TEMPORARILY_CLOSED`
- `SEASONAL`
- `PERMANENTLY_CLOSED`
- `UNKNOWN`

### Relationships

A farm has many:

- `FarmCrop`
- `FarmHours`
- `SpecialHours`
- `FarmAmenity`
- `CropPrice`
- `PickingReport`
- `Announcement`

Future:

- `FarmPhoto`
- `Review`
- `Favorite`
- `FarmClaim`
- `Event`

### Indexes / Constraints

- Unique index on `slug`
- Index on `city`
- Index on `state`
- Index on `county`
- Index on `latitude`, `longitude`
- Optional composite index on `state`, `city`

### Notes

The `Farm` table should not store current price, current crop condition, or today's open/closed result. Those are dynamic and belong in separate tables.

---

## Crop

### Purpose

Represents a crop, attraction, or seasonal product that users may search for.

### Answers

🍓 **What can I pick?**

### Examples

- Blueberry
- Strawberry
- Raspberry
- Blackberry
- Apple
- Cherry
- Pumpkin
- Sunflower
- Lavender
- Tulip
- Corn Maze
- Christmas Tree

### Fields

- `id`
- `slug`
- `name`
- `category`
- `icon`
- `color`
- `defaultSeasonStartMonth`
- `defaultSeasonEndMonth`
- `isActive`
- `createdAt`
- `updatedAt`

### Suggested Enum: `CropCategory`

- `BERRY`
- `ORCHARD`
- `FLOWER`
- `VEGETABLE`
- `PUMPKIN`
- `CHRISTMAS_TREE`
- `ATTRACTION`
- `OTHER`

### Relationships

A crop has many:

- `FarmCrop`
- `CropPrice`
- `PickingReport`

### Indexes / Constraints

- Unique index on `slug`
- Index on `category`
- Index on `isActive`

### Notes

This table allows the platform to launch with berries while supporting future seasonal experiences.

---

## FarmCrop

### Purpose

Join table between `Farm` and `Crop`.

Stores seasonal availability for a specific crop at a specific farm.

### Answers

🍓 **What can I pick at this farm, and when?**

### Responsibilities

- Connect a farm to a crop.
- Store expected season dates.
- Store peak picking windows.
- Track whether the crop is U-pick, pre-picked, or both.
- Store farm-specific crop notes.

### Fields

- `id`
- `farmId`
- `cropId`
- `seasonStartDate`
- `seasonEndDate`
- `peakStartDate`
- `peakEndDate`
- `notes`
- `isUPick`
- `isPrePicked`
- `isActive`
- `createdAt`
- `updatedAt`

### Relationships

Belongs to:

- `Farm`
- `Crop`

Has many:

- `CropPrice`
- `PickingReport`

### Indexes / Constraints

- Composite unique constraint on `farmId`, `cropId`
- Index on `farmId`
- Index on `cropId`
- Index on `seasonStartDate`, `seasonEndDate`

### Notes

`FarmCrop` represents expected seasonal availability. Actual current conditions belong in `PickingReport`.

---

## FarmHours

### Purpose

Stores normal weekly hours for a farm.

### Answers

🕒 **Are they normally open today?**

### Responsibilities

- Store structured opening hours.
- Support open-now calculation.
- Support seasonal effective dates.

### Fields

- `id`
- `farmId`
- `dayOfWeek`
- `openTime`
- `closeTime`
- `isClosed`
- `notes`
- `effectiveStartDate`
- `effectiveEndDate`
- `createdAt`
- `updatedAt`

### Suggested Enum: `DayOfWeek`

- `MONDAY`
- `TUESDAY`
- `WEDNESDAY`
- `THURSDAY`
- `FRIDAY`
- `SATURDAY`
- `SUNDAY`

### Relationships

Belongs to:

- `Farm`

### Indexes / Constraints

- Index on `farmId`
- Composite index on `farmId`, `dayOfWeek`

### Notes

Use `SpecialHours` for holidays, weather closures, one-off changes, or sold-out days.

---

## SpecialHours

### Purpose

Stores one-off or temporary schedule changes.

### Answers

🕒 **Are they actually open today?**

### Examples

- Closed due to rain
- Open late for festival
- Sold out early
- Holiday hours
- Private event closure
- Season opening day

### Fields

- `id`
- `farmId`
- `date`
- `openTime`
- `closeTime`
- `isClosed`
- `reason`
- `source`
- `isVerified`
- `createdAt`
- `updatedAt`

### Relationships

Belongs to:

- `Farm`

### Indexes / Constraints

- Index on `farmId`
- Index on `date`
- Composite index on `farmId`, `date`

### Notes

When determining open status, `SpecialHours` should override normal `FarmHours`.

---

## Amenity

### Purpose

Stores reusable farm amenities and attributes.

### Answers

👨‍👩‍👧 **Is this good for my family?**

### Examples

- Restrooms
- Parking
- Picnic Area
- Wheelchair Accessible
- Pet Friendly
- Kid Friendly
- Stroller Friendly
- Farm Store
- Food Available
- Wagon Rides
- Animals
- Organic

### Fields

- `id`
- `slug`
- `name`
- `icon`
- `category`
- `createdAt`
- `updatedAt`

### Suggested Enum: `AmenityCategory`

- `FAMILY`
- `ACCESSIBILITY`
- `FACILITY`
- `FOOD`
- `ACTIVITY`
- `POLICY`
- `OTHER`

### Relationships

Has many:

- `FarmAmenity`

### Indexes / Constraints

- Unique index on `slug`
- Index on `category`

---

## FarmAmenity

### Purpose

Join table between `Farm` and `Amenity`.

### Answers

👨‍👩‍👧 **What amenities does this farm offer?**

### Fields

- `id`
- `farmId`
- `amenityId`
- `notes`
- `createdAt`
- `updatedAt`

### Relationships

Belongs to:

- `Farm`
- `Amenity`

### Indexes / Constraints

- Composite unique constraint on `farmId`, `amenityId`
- Index on `farmId`
- Index on `amenityId`

---

## CropPrice

### Purpose

Stores crop-specific pricing.

### Answers

💲 **What does it cost?**

### Responsibilities

- Store current and historical pricing.
- Support multiple pricing models.
- Support price freshness and source tracking.
- Avoid storing price directly on `Farm` or `FarmCrop`.

### Fields

- `id`
- `farmId`
- `farmCropId`
- `cropId`
- `priceType`
- `amount`
- `currency`
- `unitLabel`
- `notes`
- `effectiveStartDate`
- `effectiveEndDate`
- `source`
- `isVerified`
- `verifiedAt`
- `createdAt`
- `updatedAt`

### Suggested Enum: `PriceType`

- `PER_POUND`
- `PER_BUCKET`
- `PER_BOX`
- `PER_PERSON`
- `FLAT_ENTRY`
- `FREE`
- `UNKNOWN`

### Relationships

Belongs to:

- `Farm`
- `FarmCrop`
- `Crop`

### Indexes / Constraints

- Index on `farmId`
- Index on `farmCropId`
- Index on `cropId`
- Index on `effectiveStartDate`, `effectiveEndDate`

### Notes

`amount` should be nullable for unknown prices.

Example:

- `$5.00/lb`
- `$20/bucket`
- `Free entry`
- `Price not published`

---

## PickingReport

### Purpose

Stores current or historical picking condition reports.

### Answers

🍓 **What can I pick today?**  
🚗 **Is it worth the drive?**

### Responsibilities

- Store crop condition.
- Store crowd level.
- Store user/farm/admin comments.
- Store source and verification.
- Support freshness indicators in the UI.

### Fields

- `id`
- `farmId`
- `farmCropId`
- `cropId`
- `userId`
- `condition`
- `crowdLevel`
- `rating`
- `comment`
- `source`
- `isVerified`
- `isApproved`
- `verifiedAt`
- `expiresAt`
- `createdAt`
- `updatedAt`

### Suggested Enum: `PickingCondition`

- `EXCELLENT`
- `GOOD`
- `LIMITED`
- `PICKED_OVER`
- `CLOSED`
- `COMING_SOON`
- `SEASON_OVER`
- `UNKNOWN`

### Suggested Enum: `CrowdLevel`

- `QUIET`
- `MODERATE`
- `BUSY`
- `VERY_BUSY`
- `UNKNOWN`

### Suggested Enum: `ReportSource`

- `COMMUNITY`
- `FARM_OWNER`
- `ADMIN`
- `IMPORT`

### Relationships

Belongs to:

- `Farm`
- `FarmCrop`
- `Crop`
- `User`

Future:

- has many `FarmPhoto`

### Indexes / Constraints

- Index on `farmId`
- Index on `cropId`
- Index on `farmCropId`
- Index on `createdAt`
- Index on `expiresAt`
- Composite index on `farmId`, `cropId`, `createdAt`

### Notes

Reports should probably expire automatically after 24–72 hours depending on report type and source.

Farm owner/admin reports may have longer trust windows than community reports.

---

## Announcement

### Purpose

Stores farm-level announcements such as closures, parking warnings, harvest updates, or event notices.

### Answers

🕒 **Are there important notices before I go?**

### Examples

- Closed today due to rain
- Blueberries sold out for the day
- Parking lot full
- Strawberry festival Saturday
- Opening for the season this weekend

### Fields

- `id`
- `farmId`
- `authorUserId`
- `title`
- `body`
- `type`
- `startsAt`
- `endsAt`
- `isPublished`
- `createdAt`
- `updatedAt`

### Suggested Enum: `AnnouncementType`

- `GENERAL`
- `CLOSURE`
- `PARKING`
- `WEATHER`
- `HARVEST`
- `EVENT`
- `WARNING`

### Relationships

Belongs to:

- `Farm`
- `User`

### Indexes / Constraints

- Index on `farmId`
- Index on `startsAt`
- Index on `endsAt`
- Index on `isPublished`

---

# Freshness and Trust

Freshness is a core product feature.

For any dynamic information, the UI should be able to answer:

- When was this updated?
- Who updated it?
- Where did the data come from?
- Has it been verified?
- Is it stale?

Dynamic tables should generally include:

- `createdAt`
- `updatedAt`
- `source`
- `isVerified`
- `verifiedAt`
- `expiresAt` where appropriate

Freshness examples:

- `Price updated yesterday • Verified by farm owner`
- `Picking report submitted 2 hours ago • Community report`
- `Hours imported from farm website • Not yet verified`

---

# Data Source Strategy

Data may come from multiple sources.

### Suggested Enum: `DataSource`

- `ADMIN`
- `FARM_OWNER`
- `COMMUNITY`
- `GOOGLE_PLACES`
- `OPENSTREETMAP`
- `FARM_WEBSITE`
- `MANUAL_RESEARCH`
- `IMPORT`

### Source Philosophy

Imported data is useful, but verified data is better.

Trust ranking should generally be:

1. Admin verified
2. Farm owner verified
3. Recent community report
4. Farm website
5. Public data import
6. Old/unverified data

---

# Suggested Prisma Enums

```prisma
enum UserRole {
  MEMBER
  FARM_OWNER
  MODERATOR
  ADMIN
}

enum CropCategory {
  BERRY
  ORCHARD
  FLOWER
  VEGETABLE
  PUMPKIN
  CHRISTMAS_TREE
  ATTRACTION
  OTHER
}

enum FarmStatus {
  ACTIVE
  TEMPORARILY_CLOSED
  SEASONAL
  PERMANENTLY_CLOSED
  UNKNOWN
}

enum DayOfWeek {
  MONDAY
  TUESDAY
  WEDNESDAY
  THURSDAY
  FRIDAY
  SATURDAY
  SUNDAY
}

enum PickingCondition {
  EXCELLENT
  GOOD
  LIMITED
  PICKED_OVER
  CLOSED
  COMING_SOON
  SEASON_OVER
  UNKNOWN
}

enum CrowdLevel {
  QUIET
  MODERATE
  BUSY
  VERY_BUSY
  UNKNOWN
}

enum ReportSource {
  COMMUNITY
  FARM_OWNER
  ADMIN
  IMPORT
}

enum DataSource {
  ADMIN
  FARM_OWNER
  COMMUNITY
  GOOGLE_PLACES
  OPENSTREETMAP
  FARM_WEBSITE
  MANUAL_RESEARCH
  IMPORT
}

enum PriceType {
  PER_POUND
  PER_BUCKET
  PER_BOX
  PER_PERSON
  FLAT_ENTRY
  FREE
  UNKNOWN
}

enum AnnouncementType {
  GENERAL
  CLOSURE
  PARKING
  WEATHER
  HARVEST
  EVENT
  WARNING
}

enum AmenityCategory {
  FAMILY
  ACCESSIBILITY
  FACILITY
  FOOD
  ACTIVITY
  POLICY
  OTHER
}
```

---

# Relationship Diagram

```text
User
 ├── PickingReport
 └── Announcement

Farm
 ├── FarmHours
 ├── SpecialHours
 ├── FarmAmenity
 │    └── Amenity
 ├── FarmCrop
 │    ├── Crop
 │    ├── CropPrice
 │    └── PickingReport
 ├── CropPrice
 ├── PickingReport
 └── Announcement
```

---

# Indexing Strategy

Recommended indexes:

### Farm

- `slug`
- `city`
- `state`
- `county`
- `latitude`, `longitude`
- `state`, `city`

### Crop

- `slug`
- `category`
- `isActive`

### FarmCrop

- `farmId`
- `cropId`
- `farmId`, `cropId`
- `seasonStartDate`, `seasonEndDate`

### FarmHours

- `farmId`
- `farmId`, `dayOfWeek`

### SpecialHours

- `farmId`
- `date`
- `farmId`, `date`

### CropPrice

- `farmId`
- `farmCropId`
- `cropId`
- `effectiveStartDate`, `effectiveEndDate`

### PickingReport

- `farmId`
- `cropId`
- `farmCropId`
- `createdAt`
- `expiresAt`
- `farmId`, `cropId`, `createdAt`

### Announcement

- `farmId`
- `startsAt`
- `endsAt`
- `isPublished`

---

# Cascade and Delete Strategy

Be conservative with hard deletes.

Recommended approach:

- Use `isActive` or status fields for most user-facing records.
- Avoid deleting farms once public.
- Deleting a farm should probably be restricted if related reports/prices exist.
- User deletion should anonymize reports rather than destroy useful community data.
- Farm owner content should be auditable.

Suggested rules:

- `Farm` deletion: restrict or soft-delete
- `Crop` deletion: restrict or soft-delete
- `User` deletion: set nullable user references to null where appropriate
- `PickingReport` deletion: soft-delete/moderate rather than hard-delete in later versions

---

# MVP Implementation Scope

For the first backend implementation, include:

- PostgreSQL
- Prisma
- `User`
- `Farm`
- `Crop`
- `FarmCrop`
- `FarmHours`
- `SpecialHours`
- `Amenity`
- `FarmAmenity`
- `CropPrice`
- `PickingReport`
- `Announcement`

Do not implement yet:

- Reviews
- Favorites
- Photos
- Farm owner claims
- Events
- Notifications
- Weather
- Import logs
- Audit logs

---

# Future Tables

## Review

For overall farm experiences, separate from current picking conditions.

## Favorite

Allows users to save farms.

## FarmPhoto

Supports farm pages, reports, and events.

## FarmClaim

Allows farm owners to claim listings.

## Event

Supports festivals, pumpkin patches, sunflower days, and other farm events.

## Notification

Supports alerts such as crop openings, favorite farm updates, and report changes.

## WeatherSnapshot

Caches farm-level weather data.

## ImportLog

Tracks Google Places, OpenStreetMap, or manual imports.

## AuditLog

Tracks admin and farm owner changes.

---

# Open Questions

1. Should reports require login, or can anonymous users submit reports?
2. Should community reports expire after 24, 48, or 72 hours?
3. Should farm owner reports expire differently than community reports?
4. Should prices expire automatically?
5. Should price history be visible to users?
6. Can a farm have multiple owners/managers?
7. Should farm owner edits require admin approval?
8. Should imported Google Places data be stored directly or only used during research?
9. Should the app launch with only Washington or the broader Pacific Northwest?
10. Should farms with only pre-picked produce be included?
11. Should farms with no U-pick but seasonal events be included?
12. Should special hours override announcements or should announcements only explain changes?
13. Should exact opening times be required, or can a farm have “check website” hours?
14. Should we use PostGIS immediately or start with latitude/longitude indexes?
15. Should moderation and audit logs be MVP or Phase 2.5?

---

# Codex Review Prompt

Use this prompt after this document is committed:

```text
Review docs/DATABASE.md as if you were a senior backend engineer designing a production PostgreSQL database for Northwest U-Pick.

Please identify:

- normalization issues
- missing indexes
- missing relationships
- future scalability concerns
- naming inconsistencies
- places where the schema can be simplified
- PostgreSQL best practices
- Prisma best practices
- enum usage recommendations
- cascade/delete behavior recommendations
- fields that should be nullable vs required

Do not rewrite the product vision. Assume the four core user questions are intentional:

1. Where are the farms?
2. What can I pick today?
3. Are they open?
4. What does it cost?

After the review, generate a proposed prisma/schema.prisma that faithfully implements this specification for the MVP tables only.
```

---

## Document Status

Version: 0.1  
Status: Draft  
Last Updated: June 2026  
Owner: Northwest U-Pick Project
