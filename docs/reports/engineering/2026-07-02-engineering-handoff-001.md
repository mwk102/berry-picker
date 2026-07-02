# Engineering → Product Handoff #001

**Date:** July 2, 2026

**Engineering Lead:** ChatGPT

---

# Executive Summary

Northwest U-Pick has successfully transitioned from an MVP prototype into a scalable product platform.

The application now has a strong technical foundation, and future development should prioritize **data quality and user trust** over adding large numbers of new features.

Engineering believes the project's competitive advantage will come from Harvest Intelligence rather than simply being a map of farms.

---

# Completed Since Last Handoff

## Backend

- PostgreSQL database
- Prisma ORM
- Express API
- Seed pipeline
- Harvest Intelligence Engine
- Harvest Signals
- Farm Intelligence endpoints

## Frontend

- Harvest Radar homepage
- Farm Finder
- Farm Intelligence pages
- Responsive layouts
- Navigation updates
- Loading and error states

## Architecture

- Normalized relational schema
- Service-layer architecture
- TypeScript throughout
- Docker development environment

---

# Engineering Assessment

Overall Architecture Health

🟢 Excellent

Current technical debt is low.

The project remains maintainable and scalable.

No major architectural concerns at this time.

---

# Major Technical Achievement

Harvest Intelligence has become the core backend service.

Rather than displaying static farm information, the application now computes:

- Harvest summaries
- Confidence scores
- Worth The Drive scores
- Harvest signals
- Freshness indicators

Engineering believes this is becoming the product's primary differentiator.

---

# Current Risks

## Highest Risk

Data acquisition.

The software architecture is now ahead of the available real-world farm data.

Future engineering effort should focus on improving data collection and verification rather than adding unrelated features.

---

# Engineering Recommendation

Prioritize a **Gold Standard Farm Pipeline**.

Rather than importing hundreds of farms, perfect one real farm profile and use it as the reference implementation.

Suggested first farm:

**Harvold Berry Farm**

Future reference farms:

- Remlinger Farms
- Bailey Family Farm
- Henna Blueberry Farm
- Swan's Trail Farms

---

# Engineering Philosophy

The following principles guided recent decisions.

- Trust is more valuable than quantity.
- Every important fact should have a source.
- Every important fact should have a freshness date.
- Confidence should be calculated, not guessed.
- Business logic belongs in backend services.
- Database remains the source of truth.

---

# Product Questions

Engineering requests guidance on the following topics.

## 1

What defines a "Gold Standard" farm from a user perspective?

Which information is absolutely essential?

---

## 2

Would Product rather launch with:

- 35 extremely complete farms

or

- 200 partially complete farms?

Engineering recommends quality over quantity.

---

## 3

Which trust indicators matter most?

Current options:

- Confidence Score
- Worth The Drive
- Freshness
- Last Updated
- Source Attribution

Which of these should become the primary product message?

---

## 4

What user journey should Version 1 optimize?

Current engineering assumption:

Family opens app on Saturday morning and decides where to go in under 60 seconds.

Please confirm or refine.

---

# Suggested Next Product Discussion

Engineering recommends discussing:

- Gold Standard Farm definition
- Reference Farm Program
- Data acquisition strategy
- Farm owner participation
- Community reports

before expanding into new feature areas.

---

# Looking Ahead

Engineering believes Northwest U-Pick has evolved beyond a farm directory.

Current internal product understanding:

> Build the most trusted source of U-pick harvest information in Washington.

Engineering will continue optimizing the platform around this mission.

---

Prepared by

Engineering Lead
Northwest U-Pick