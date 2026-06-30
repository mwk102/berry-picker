import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  CandidateFarm,
  emptyResult,
  importCandidateFarm,
  prisma,
  writeReviewReport,
} from "./lib/candidateImport";

type GooglePlacesConfig = {
  queries: string[];
  locationBias: {
    latitude: number;
    longitude: number;
    radiusMeters: number;
  };
};

const config = JSON.parse(
  readFileSync(join(__dirname, "google-places-queries.json"), "utf8"),
) as GooglePlacesConfig;

function findAddressComponent(place: any, type: string) {
  return place.addressComponents?.find((component: any) => component.types?.includes(type))?.longText || null;
}

function toCandidate(place: any): CandidateFarm | null {
  const location = place.location;
  if (!place.id || !place.displayName?.text || !location?.latitude || !location?.longitude) {
    return null;
  }

  return {
    name: place.displayName.text,
    city: findAddressComponent(place, "locality") || findAddressComponent(place, "postal_town"),
    state: findAddressComponent(place, "administrative_area_level_1") || "WA",
    postalCode: findAddressComponent(place, "postal_code"),
    county: findAddressComponent(place, "administrative_area_level_2"),
    country: findAddressComponent(place, "country") || "US",
    latitude: location.latitude,
    longitude: location.longitude,
    phone: place.nationalPhoneNumber || null,
    websiteUrl: place.websiteUri || null,
    addressLine1: place.formattedAddress || null,
    sourceUrl: place.googleMapsUri || null,
    externalId: place.id,
    rawMetadata: place,
  };
}

async function searchPlaces(query: string) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    throw new Error("GOOGLE_PLACES_API_KEY is required for Google candidate imports.");
  }

  const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": [
        "places.id",
        "places.displayName",
        "places.formattedAddress",
        "places.addressComponents",
        "places.location",
        "places.websiteUri",
        "places.googleMapsUri",
        "places.nationalPhoneNumber",
        "places.types",
        "places.businessStatus",
      ].join(","),
    },
    body: JSON.stringify({
      textQuery: query,
      locationBias: {
        circle: {
          center: {
            latitude: config.locationBias.latitude,
            longitude: config.locationBias.longitude,
          },
          radius: config.locationBias.radiusMeters,
        },
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Google Places request failed for "${query}": ${response.status} ${body}`);
  }

  const payload = await response.json();
  return payload.places || [];
}

async function main() {
  const result = emptyResult();
  const seenPlaceIds = new Set<string>();

  for (const query of config.queries) {
    try {
      const places = await searchPlaces(query);
      for (const place of places) {
        if (seenPlaceIds.has(place.id)) continue;
        seenPlaceIds.add(place.id);

        const candidate = toCandidate(place);
        if (!candidate) continue;

        await importCandidateFarm(candidate, "GOOGLE_PLACES", result);
      }
    } catch (error) {
      result.errors.push({
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  writeReviewReport("google-candidates", result);

  if (result.errors.length > 0) {
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error("Google candidate import failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
