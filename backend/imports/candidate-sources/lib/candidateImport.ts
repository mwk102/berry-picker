import { writeFileSync } from "node:fs";
import { join } from "node:path";
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

export type CandidateFarm = {
  name: string;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  county?: string | null;
  country?: string | null;
  latitude: number;
  longitude: number;
  phone?: string | null;
  websiteUrl?: string | null;
  addressLine1?: string | null;
  sourceUrl?: string | null;
  externalId?: string | null;
  rawMetadata?: unknown;
};

export type CandidateImportResult = {
  imported: Array<{ slug: string; name: string; city: string | null; source: string }>;
  updated: Array<{ slug: string; name: string; source: string }>;
  skippedDuplicates: Array<{ name: string; reason: string; matchedFarmSlug?: string | null }>;
  skippedVerified: Array<{ name: string; matchedFarmSlug: string }>;
  errors: Array<{ name?: string; message: string }>;
};

export const prisma = createPrismaClient();

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is required to run candidate importers.");
  }

  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

export function emptyResult(): CandidateImportResult {
  return {
    imported: [],
    updated: [],
    skippedDuplicates: [],
    skippedVerified: [],
    errors: [],
  };
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function normalizeName(value: string) {
  return value
    .toLowerCase()
    .replace(/\b(farm|farms|orchard|orchards|u-pick|upick|berries|berry)\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizeWebsite(value?: string | null) {
  if (!value) return null;

  try {
    const url = new URL(value);
    return `${url.hostname.replace(/^www\./, "")}${url.pathname.replace(/\/$/, "")}`.toLowerCase();
  } catch {
    return value.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");
  }
}

function milesBetween(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
  const radiusMiles = 3958.8;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const deltaLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const deltaLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const haversine =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;

  return radiusMiles * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

async function uniqueSlug(baseSlug: string) {
  let slug = baseSlug || "candidate-farm";
  let suffix = 2;

  while (await prisma.farm.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

async function findDuplicate(candidate: CandidateFarm, dataSource: "GOOGLE_PLACES" | "OPENSTREETMAP") {
  if (candidate.externalId) {
    const sourceMatch = await prisma.farmSource.findUnique({
      where: {
        dataSource_externalId: {
          dataSource,
          externalId: candidate.externalId,
        },
      },
      include: { farm: true },
    });

    if (sourceMatch) {
      return { farm: sourceMatch.farm, reason: "external_id" };
    }
  }

  const nearbyFarms = await prisma.farm.findMany({
    where: {
      OR: [
        { name: { equals: candidate.name, mode: "insensitive" } },
        candidate.city
          ? {
              city: { equals: candidate.city, mode: "insensitive" },
              name: { contains: candidate.name.split(" ")[0], mode: "insensitive" },
            }
          : undefined,
        candidate.websiteUrl ? { websiteUrl: { equals: candidate.websiteUrl, mode: "insensitive" } } : undefined,
      ].filter(Boolean),
    },
  });

  const candidateName = normalizeName(candidate.name);
  const candidateWebsite = normalizeWebsite(candidate.websiteUrl);

  for (const farm of nearbyFarms) {
    const nameMatches = normalizeName(farm.name) === candidateName;
    const cityMatches = candidate.city && farm.city.toLowerCase() === candidate.city.toLowerCase();
    const websiteMatches = candidateWebsite && normalizeWebsite(farm.websiteUrl) === candidateWebsite;
    const coordinateDistance = milesBetween(candidate, {
      latitude: Number(farm.latitude),
      longitude: Number(farm.longitude),
    });
    const coordinatesMatch = coordinateDistance <= 0.25;

    if (websiteMatches || (nameMatches && cityMatches) || (nameMatches && coordinatesMatch) || coordinatesMatch) {
      return {
        farm,
        reason: websiteMatches ? "website" : coordinatesMatch ? "coordinates_proximity" : "name_city",
      };
    }
  }

  return null;
}

export async function importCandidateFarm(
  candidate: CandidateFarm,
  dataSource: "GOOGLE_PLACES" | "OPENSTREETMAP",
  result: CandidateImportResult,
) {
  const duplicate = await findDuplicate(candidate, dataSource);

  if (duplicate?.farm?.isVerified) {
    result.skippedVerified.push({
      name: candidate.name,
      matchedFarmSlug: duplicate.farm.slug,
    });
    return;
  }

  if (duplicate?.farm) {
    await prisma.farmSource.upsert({
      where: candidate.externalId
        ? {
            dataSource_externalId: {
              dataSource,
              externalId: candidate.externalId,
            },
          }
        : {
            dataSource_externalId: {
              dataSource,
              externalId: `${duplicate.farm.id}:${dataSource}`,
            },
          },
      create: {
        farmId: duplicate.farm.id,
        dataSource,
        externalId: candidate.externalId || `${duplicate.farm.id}:${dataSource}`,
        sourceUrl: candidate.sourceUrl,
        rawMetadata: candidate.rawMetadata as object,
      },
      update: {
        sourceUrl: candidate.sourceUrl,
        rawMetadata: candidate.rawMetadata as object,
        importedAt: new Date(),
      },
    });

    result.skippedDuplicates.push({
      name: candidate.name,
      reason: duplicate.reason,
      matchedFarmSlug: duplicate.farm.slug,
    });
    return;
  }

  const slug = await uniqueSlug(slugify(candidate.name));
  const farm = await prisma.farm.create({
    data: {
      slug,
      name: candidate.name,
      description: "Candidate farm imported from a third-party source. Needs manual verification before public display.",
      addressLine1: candidate.addressLine1,
      city: candidate.city || "Unknown",
      state: candidate.state || "WA",
      postalCode: candidate.postalCode,
      county: candidate.county,
      country: candidate.country || "US",
      latitude: candidate.latitude,
      longitude: candidate.longitude,
      timezone: "America/Los_Angeles",
      phone: candidate.phone,
      websiteUrl: candidate.websiteUrl,
      status: "UNKNOWN",
      isVerified: false,
      isClaimed: false,
      // TODO(admin-review): add approve, reject, edit, and mark-verified actions
      // that move candidates out of PENDING_REVIEW before public launch.
      isActive: false,
      dataSource,
      reviewStatus: "PENDING_REVIEW",
      sources: {
        create: {
          dataSource,
          externalId: candidate.externalId,
          sourceUrl: candidate.sourceUrl,
          rawMetadata: candidate.rawMetadata as object,
        },
      },
    },
  });

  result.imported.push({
    slug: farm.slug,
    name: farm.name,
    city: farm.city,
    source: dataSource,
  });
}

export function writeReviewReport(sourceName: string, result: CandidateImportResult) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const reportPath = join(__dirname, "..", "reports", `${sourceName}-${timestamp}.json`);
  const report = {
    source: sourceName,
    generatedAt: new Date().toISOString(),
    summary: {
      imported: result.imported.length,
      updated: result.updated.length,
      skippedDuplicates: result.skippedDuplicates.length,
      skippedVerified: result.skippedVerified.length,
      errors: result.errors.length,
      pendingManualReview: result.imported.length,
    },
    ...result,
  };

  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`Candidate review report written to ${reportPath}`);
  console.table(report.summary);
}
