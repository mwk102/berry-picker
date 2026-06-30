# Candidate Farm Imports

These importers discover possible Northwest U-Pick farm listings from third-party sources.

Important rules:

- Imported candidates are not verified.
- Imported candidates are not claimed.
- Imported candidates are inserted with `reviewStatus: PENDING_REVIEW`.
- Imported candidates are inserted with `isActive: false` so they do not appear in the public API until approved.
- Crops, prices, and hours are not marked verified by candidate importers.
- Verified farms are never overwritten by candidate imports.

Scripts:

```bash
npm run import:google-candidates
npm run import:osm-candidates
```

Google Places requires `GOOGLE_PLACES_API_KEY` in the backend environment.
