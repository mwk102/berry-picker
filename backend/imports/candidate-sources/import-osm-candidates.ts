import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  CandidateFarm,
  emptyResult,
  importCandidateFarm,
  prisma,
  writeReviewReport,
} from "./lib/candidateImport";

const overpassUrls = (
  process.env.OVERPASS_API_URLS ||
  process.env.OVERPASS_API_URL ||
  "https://overpass-api.de/api/interpreter,https://overpass.kumi.systems/api/interpreter,https://overpass.openstreetmap.ru/api/interpreter"
)
  .split(",")
  .map((url) => url.trim())
  .filter(Boolean);
const query = readFileSync(join(__dirname, "osm-overpass-query.txt"), "utf8");
const requestTimeoutMs = Number(process.env.OVERPASS_TIMEOUT_MS || 20000);

function tag(element: any, key: string) {
  return element.tags?.[key] || null;
}

function elementCoordinates(element: any) {
  if (typeof element.lat === "number" && typeof element.lon === "number") {
    return { latitude: element.lat, longitude: element.lon };
  }

  if (element.center && typeof element.center.lat === "number" && typeof element.center.lon === "number") {
    return { latitude: element.center.lat, longitude: element.center.lon };
  }

  return null;
}

function toCandidate(element: any): CandidateFarm | null {
  const coordinates = elementCoordinates(element);
  const name = tag(element, "name");

  if (!coordinates || !name) {
    return null;
  }

  return {
    name,
    city: tag(element, "addr:city"),
    state: tag(element, "addr:state") || "WA",
    postalCode: tag(element, "addr:postcode"),
    county: null,
    country: tag(element, "addr:country") || "US",
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
    phone: tag(element, "phone") || tag(element, "contact:phone"),
    websiteUrl: tag(element, "website") || tag(element, "contact:website"),
    addressLine1: [tag(element, "addr:housenumber"), tag(element, "addr:street")].filter(Boolean).join(" ") || null,
    sourceUrl: `https://www.openstreetmap.org/${element.type}/${element.id}`,
    externalId: `${element.type}/${element.id}`,
    rawMetadata: element,
  };
}

async function fetchOverpassCandidates() {
  const errors: string[] = [];
  const body = new URLSearchParams({ data: query });

  for (const overpassUrl of overpassUrls) {
    const attempts = [
      {
        label: "POST",
        url: overpassUrl,
        init: {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": "Northwest U-Pick candidate importer",
          },
          body,
        },
      },
      {
        label: "GET",
        url: `${overpassUrl}?${body.toString()}`,
        init: {
          method: "GET",
          headers: {
            "User-Agent": "Northwest U-Pick candidate importer",
          },
        },
      },
    ];

    for (const attempt of attempts) {
      try {
        const response = await fetch(attempt.url, {
          ...attempt.init,
          signal: AbortSignal.timeout(requestTimeoutMs),
        });

        if (!response.ok) {
          const responseBody = await response.text();
          throw new Error(`${response.status} ${responseBody}`);
        }

        const payload = await response.json();
        return payload.elements || [];
      } catch (error) {
        errors.push(
          `${overpassUrl} ${attempt.label}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  }

  throw new Error(`Overpass request failed for all configured endpoints. ${errors.join(" | ")}`);
}

async function main() {
  const result = emptyResult();

  try {
    const elements = await fetchOverpassCandidates();
    for (const element of elements) {
      const candidate = toCandidate(element);
      if (!candidate) continue;

      await importCandidateFarm(candidate, "OPENSTREETMAP", result);
    }
  } catch (error) {
    result.errors.push({
      message: error instanceof Error ? error.message : String(error),
    });
  }

  writeReviewReport("osm-candidates", result);

  if (result.errors.length > 0) {
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error("OpenStreetMap candidate import failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
