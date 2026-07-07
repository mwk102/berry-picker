# Harvold Berry Farm

## Verification Status

- Status: Gold Standard reference farm
- Last checked: 2026-07-02
- Next review target: 2026-07-09
- Verification confidence: 95/100
- Completeness score: 89/100
- Official website: https://harvoldberryfarm.com/
- Source page: https://harvoldberryfarm.com/location-%26-price
- Contact page: https://harvoldberryfarm.com/contact-us

## Gold Standard Workflow

Future verified farms should follow this sequence:

1. Confirm official name, location, phone, and website from official farm-owned sources.
2. Capture field-specific addresses when crops are picked at different sites.
3. Store crop, price, hour, report, and announcement attribution with source, source URL, last verified date, and verification method.
4. Calculate completeness from address, GPS, website, phone, hours, prices, amenities, photos, and reports.
5. Mark low-confidence fields for later review instead of presenting them as verified.
6. Set a next review date for time-sensitive fields during harvest season.

## Official Name

Harvold Berry Farm and Veggies

## Contact

- Phone: 425-298-5125
- Email listed by source: Harvoldberryfarm@gmail.com
- Website: https://harvoldberryfarm.com/

## Field Addresses

- Main / raspberry / sunflower / veggie field: 5207 Carnation-Duvall Rd NE, Carnation, WA 98014
- Strawberry field: 7701 Carnation Duvall Rd NE, Carnation, WA 98014

## Crops Captured

- Strawberry
- Raspberry
- Sunflower

## Crop-Specific Locations

- Strawberry: official location page lists 7701 Carnation Duvall Rd NE and says to look for big yellow signs.
- Raspberry: official location page lists 5207 Carnation-Duvall Rd NE.
- Sunflower: official location page lists sunflower fields at 5207 Carnation-Duvall Rd NE.

## Prices

- Strawberry: $4.00/lb
- Raspberry: $4.75/lb, with a five-pound minimum noted
- Sunflower: not verified from official pricing page yet

## Normal Hours

- Monday-Saturday: 8:00 AM-6:00 PM, or until picked out
- Sunday: closed

## Current Status Notes

- Homepage update lists strawberry field activity at 7701 Carnation Duvall Rd NE.
- Homepage update lists raspberry picking at 5207 Carnation Duvall Rd NE and a next-picking update around July 1.
- Farm website warns field status can change when picked out.

## Source Attribution

| Data | Source | Source URL | Last verified | Method |
| --- | --- | --- | --- | --- |
| Official name | Official Website | https://harvoldberryfarm.com/ | 2026-07-02 | Manual official website review |
| Contact phone | Contact page | https://harvoldberryfarm.com/contact-us | 2026-07-02 | Manual official website review |
| Main field address | Contact page | https://harvoldberryfarm.com/contact-us | 2026-07-02 | Manual official website review |
| Strawberry field address | Location & Price page | https://harvoldberryfarm.com/location-%26-price | 2026-07-02 | Manual official website review |
| Strawberry price | Location & Price page | https://harvoldberryfarm.com/location-%26-price | 2026-07-02 | Manual official website review |
| Raspberry price | Location & Price page | https://harvoldberryfarm.com/location-%26-price | 2026-07-02 | Manual official website review |
| Normal hours | Homepage update | https://harvoldberryfarm.com/ | 2026-07-02 | Manual official website review |
| Current berry status | Homepage update | https://harvoldberryfarm.com/ | 2026-07-02 | Manual official website review |

## Completeness

| Field | Status |
| --- | --- |
| Address | Complete |
| GPS | Complete |
| Website | Complete |
| Phone | Complete |
| Hours | Complete |
| Prices | Complete |
| Amenities | Complete, but needs deeper source-level verification |
| Photos | Missing |
| Reports | Complete |

## Farm Personality

- Best for: Family Friendly, Quick Berry Trip, Photography
- Known for: Fresh Strawberries, Raspberries, Sunflowers

## Implementation Notes

- Replaced `bear-creek-u-pick` development listing with `harvold-berry-farm`.
- Marked farm, official hours, strawberry price, raspberry price, and current picking reports as verified from `FARM_WEBSITE`.
- Stored crop-specific field locations in `FarmCrop.notes` until a dedicated field-location model exists.
- Created a `FarmVerificationProfile` seed record with Gold Standard status, completeness, source URLs, manual notes, personality, missing fields, and review warnings.
- Deactivated old OSM candidate fragments:
  - `harvold-s-strawberry-u-pick`
  - `harvold-s-raspberry-u-pick`
  - `harvolds-farm`
  - `harvold-farms`

## TODO

- Automatic website scanner
- Owner portal
- Community reports
- Photo uploads
