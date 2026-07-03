import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const require = createRequire(import.meta.url);
const { createHarvestRepository } = require("../src/repositories/harvestRepository");
const { createEvidenceRepository } = require("../src/repositories/evidenceRepository");
const { createHarvestRadarService } = require("../src/services/harvestRadarService");
const { createEvidenceService } = require("../src/services/evidenceService");

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to run the seed script.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });
const evidenceRepository = createEvidenceRepository(prisma);
const evidenceService = createEvidenceService(evidenceRepository);

const crops = [
  { slug: "blueberry", name: "Blueberry", category: "BERRY", defaultSeasonStartMonth: 7, defaultSeasonEndMonth: 9, icon: "blueberry", color: "#3f5fb8" },
  { slug: "strawberry", name: "Strawberry", category: "BERRY", defaultSeasonStartMonth: 6, defaultSeasonEndMonth: 7, icon: "strawberry", color: "#d93f57" },
  { slug: "raspberry", name: "Raspberry", category: "BERRY", defaultSeasonStartMonth: 6, defaultSeasonEndMonth: 8, icon: "raspberry", color: "#b9365f" },
  { slug: "blackberry", name: "Blackberry", category: "BERRY", defaultSeasonStartMonth: 7, defaultSeasonEndMonth: 9, icon: "blackberry", color: "#36213e" },
  { slug: "apple", name: "Apple", category: "ORCHARD", defaultSeasonStartMonth: 8, defaultSeasonEndMonth: 10, icon: "apple", color: "#7ea33b" },
  { slug: "cherry", name: "Cherry", category: "ORCHARD", defaultSeasonStartMonth: 6, defaultSeasonEndMonth: 7, icon: "cherry", color: "#b51d3a" },
  { slug: "pumpkin", name: "Pumpkin", category: "PUMPKIN", defaultSeasonStartMonth: 9, defaultSeasonEndMonth: 10, icon: "pumpkin", color: "#d8742f" },
  { slug: "sunflower", name: "Sunflower", category: "FLOWER", defaultSeasonStartMonth: 7, defaultSeasonEndMonth: 9, icon: "sunflower", color: "#d5a51f" },
  { slug: "lavender", name: "Lavender", category: "FLOWER", defaultSeasonStartMonth: 6, defaultSeasonEndMonth: 8, icon: "lavender", color: "#7d63a8" },
  { slug: "vegetables", name: "Vegetables", category: "VEGETABLE", defaultSeasonStartMonth: 6, defaultSeasonEndMonth: 10, icon: "leaf", color: "#4f8f48" },
  { slug: "corn-maze", name: "Corn Maze", category: "ATTRACTION", defaultSeasonStartMonth: 9, defaultSeasonEndMonth: 10, icon: "corn", color: "#b38a2e" },
  { slug: "christmas-tree", name: "Christmas Tree", category: "CHRISTMAS_TREE", defaultSeasonStartMonth: 11, defaultSeasonEndMonth: 12, icon: "tree", color: "#1f6b46" },
] as const;

const amenities = [
  { slug: "parking", name: "Parking", category: "FACILITY", icon: "parking" },
  { slug: "restrooms", name: "Restrooms", category: "FACILITY", icon: "restroom" },
  { slug: "kid-friendly", name: "Kid Friendly", category: "FAMILY", icon: "smile" },
  { slug: "wheelchair-accessible", name: "Wheelchair Accessible", category: "ACCESSIBILITY", icon: "accessibility" },
  { slug: "farm-store", name: "Farm Store", category: "FACILITY", icon: "store" },
  { slug: "picnic-area", name: "Picnic Area", category: "FAMILY", icon: "picnic" },
  { slug: "pet-friendly", name: "Pet Friendly", category: "POLICY", icon: "paw" },
  { slug: "food-available", name: "Food Available", category: "FOOD", icon: "utensils" },
  { slug: "organic", name: "Organic", category: "POLICY", icon: "leaf" },
  { slug: "wagon-rides", name: "Wagon Rides", category: "ACTIVITY", icon: "wagon" },
] as const;

const dayNames = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"] as const;

const seasonByCrop: Record<string, { start: string; end: string; peakStart: string; peakEnd: string }> = {
  blueberry: { start: "2026-07-01", end: "2026-09-05", peakStart: "2026-07-20", peakEnd: "2026-08-20" },
  strawberry: { start: "2026-06-01", end: "2026-07-10", peakStart: "2026-06-10", peakEnd: "2026-06-28" },
  raspberry: { start: "2026-06-20", end: "2026-08-15", peakStart: "2026-07-01", peakEnd: "2026-07-30" },
  blackberry: { start: "2026-07-15", end: "2026-09-15", peakStart: "2026-08-01", peakEnd: "2026-08-28" },
  apple: { start: "2026-08-20", end: "2026-10-31", peakStart: "2026-09-10", peakEnd: "2026-10-10" },
  cherry: { start: "2026-06-15", end: "2026-07-20", peakStart: "2026-06-25", peakEnd: "2026-07-10" },
  pumpkin: { start: "2026-09-20", end: "2026-10-31", peakStart: "2026-10-01", peakEnd: "2026-10-25" },
  sunflower: { start: "2026-07-20", end: "2026-09-15", peakStart: "2026-08-05", peakEnd: "2026-08-30" },
  lavender: { start: "2026-06-20", end: "2026-08-15", peakStart: "2026-07-01", peakEnd: "2026-07-25" },
  vegetables: { start: "2026-06-01", end: "2026-10-31", peakStart: "2026-07-01", peakEnd: "2026-09-15" },
  "corn-maze": { start: "2026-09-15", end: "2026-10-31", peakStart: "2026-10-01", peakEnd: "2026-10-25" },
  "christmas-tree": { start: "2026-11-20", end: "2026-12-20", peakStart: "2026-11-28", peakEnd: "2026-12-12" },
};

const priceByCrop: Record<string, { priceType: string; amount: string; unitLabel: string }> = {
  blueberry: { priceType: "PER_POUND", amount: "5.50", unitLabel: "lb" },
  strawberry: { priceType: "PER_POUND", amount: "4.50", unitLabel: "lb" },
  raspberry: { priceType: "PER_POUND", amount: "6.25", unitLabel: "lb" },
  blackberry: { priceType: "PER_POUND", amount: "5.25", unitLabel: "lb" },
  apple: { priceType: "PER_POUND", amount: "3.25", unitLabel: "lb" },
  cherry: { priceType: "PER_POUND", amount: "6.50", unitLabel: "lb" },
  pumpkin: { priceType: "PER_BUCKET", amount: "8.00", unitLabel: "item" },
  sunflower: { priceType: "PER_PERSON", amount: "7.00", unitLabel: "person" },
  lavender: { priceType: "FLAT_ENTRY", amount: "6.00", unitLabel: "entry" },
  vegetables: { priceType: "UNKNOWN", amount: null as unknown as string, unitLabel: "item" },
  "corn-maze": { priceType: "PER_PERSON", amount: "10.00", unitLabel: "person" },
  "christmas-tree": { priceType: "UNKNOWN", amount: null as unknown as string, unitLabel: "tree" },
};

type FarmImport = {
  slug: string;
  name: string;
  description: string;
  addressLine1?: string;
  city: string;
  state: string;
  postalCode: string;
  county: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
  phone?: string;
  websiteUrl: string;
  sourceUrl?: string;
  sourceUrls?: string[];
  sourceName?: string;
  contactSourceUrl?: string;
  addressSourceUrl?: string;
  coordinateSourceUrl?: string;
  coordinatesConfidence?: number;
  referenceStatus?: "PENDING_REVIEW" | "VERIFIED" | "GOLD_STANDARD" | "NEEDS_REVIEW";
  lastVerifiedAt?: string;
  nextReviewAt?: string;
  verificationConfidence?: number;
  manualNotes?: string;
  heroImageUrl?: string;
  galleryImages?: string[];
  photoAttribution?: string;
  personality?: {
    bestFor: string[];
    knownFor: string[];
  };
  isVerified?: boolean;
  cropSlugs: string[];
  uPickCropSlugs?: Record<string, boolean>;
  amenitySlugs: string[];
  fieldLocations?: Record<string, string>;
  cropNotes?: Record<string, string>;
  priceOverrides?: Record<string, { priceType: string; amount: string; unitLabel: string; notes?: string }>;
  hours?: {
    openDays: string[];
    openTime: string;
    closeTime: string;
    closedDays: string[];
    sourceUrl?: string;
    notes: string;
  };
  hourWindows?: Array<{
    dayOfWeek: string;
    openTime: string;
    closeTime: string;
    sourceUrl?: string;
    notes: string;
  }>;
  currentReports?: Array<{
    cropSlug: string;
    condition: string;
    crowdLevel: string;
    rating: number;
    sourceUrl?: string;
    comment: string;
  }>;
  announcementSourceUrl?: string;
  announcement?: string;
};

const washingtonFarms = JSON.parse(
  readFileSync(join(__dirname, "..", "imports", "washington-farms.json"), "utf8"),
) as FarmImport[];

const summary = {
  crops: 0,
  amenities: 0,
  farms: 0,
  farmCrops: 0,
  prices: 0,
  reports: 0,
  announcements: 0,
  harvestSummaries: 0,
  verificationProfiles: 0,
  evidence: 0,
};

function date(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function time(value: string) {
  return new Date(`1970-01-01T${value}:00.000Z`);
}

function buildCompleteness(farmImport: FarmImport) {
  const checks = [
    { key: "address", label: "Address", complete: Boolean(farmImport.addressLine1 && farmImport.city && farmImport.state) },
    { key: "gps", label: "GPS", complete: Boolean(farmImport.latitude && farmImport.longitude) },
    { key: "website", label: "Website", complete: Boolean(farmImport.websiteUrl) },
    { key: "phone", label: "Phone", complete: Boolean(farmImport.phone) },
    { key: "hours", label: "Hours", complete: Boolean(farmImport.hours) },
    { key: "prices", label: "Prices", complete: Object.keys(farmImport.priceOverrides || {}).length > 0 },
    { key: "amenities", label: "Amenities", complete: farmImport.amenitySlugs.length > 0 },
    { key: "photos", label: "Photos", complete: Boolean(farmImport.heroImageUrl || farmImport.galleryImages?.length) },
    { key: "reports", label: "Reports", complete: Boolean(farmImport.currentReports?.length) },
  ];
  const completeCount = checks.filter((check) => check.complete).length;

  return {
    score: Math.round((completeCount / checks.length) * 100),
    checks,
    missingFields: checks.filter((check) => !check.complete).map((check) => check.label),
  };
}

function buildLowConfidenceFields(farmImport: FarmImport) {
  const lowConfidenceFields = [];
  if (!farmImport.heroImageUrl && !farmImport.galleryImages?.length) {
    lowConfidenceFields.push("Photos");
  }
  if (farmImport.amenitySlugs.length > 0) {
    lowConfidenceFields.push("Amenities need source-level verification");
  }
  if (farmImport.cropSlugs.includes("sunflower") && !farmImport.priceOverrides?.sunflower) {
    lowConfidenceFields.push("Sunflower price");
  }
  return lowConfidenceFields;
}

async function seedCrops() {
  for (const crop of crops) {
    await prisma.crop.upsert({
      where: { slug: crop.slug },
      create: crop,
      update: crop,
    });
    summary.crops += 1;
  }
}

async function seedAmenities() {
  for (const amenity of amenities) {
    await prisma.amenity.upsert({
      where: { slug: amenity.slug },
      create: amenity,
      update: amenity,
    });
    summary.amenities += 1;
  }
}

async function seedFarms() {
  await prisma.farm.updateMany({
    where: {
      slug: {
        in: [
          "bear-creek-u-pick",
          "harvold-s-strawberry-u-pick",
          "harvold-s-raspberry-u-pick",
          "harvolds-farm",
          "harvold-farms",
          "remlinger-farms-2",
          "bailey-farm-apartments",
        ],
      },
    },
    data: { isActive: false },
  });

  for (const farm of washingtonFarms) {
    await prisma.farm.upsert({
      where: { slug: farm.slug },
      create: {
        slug: farm.slug,
        name: farm.name,
        description: farm.description,
        addressLine1: farm.addressLine1,
        city: farm.city,
        state: farm.state,
        postalCode: farm.postalCode,
        county: farm.county,
        country: farm.country,
        latitude: farm.latitude,
        longitude: farm.longitude,
        timezone: farm.timezone,
        phone: farm.phone || null,
        websiteUrl: farm.websiteUrl,
        status: "ACTIVE",
        reviewStatus: "APPROVED",
        dataSource: farm.isVerified ? "FARM_WEBSITE" : "MANUAL_RESEARCH",
        isVerified: farm.isVerified ?? false,
        isClaimed: false,
        isActive: true,
        lastVerifiedAt: farm.lastVerifiedAt ? new Date(farm.lastVerifiedAt) : null,
      },
      update: {
        name: farm.name,
        description: farm.description,
        addressLine1: farm.addressLine1,
        city: farm.city,
        state: farm.state,
        postalCode: farm.postalCode,
        county: farm.county,
        country: farm.country,
        latitude: farm.latitude,
        longitude: farm.longitude,
        timezone: farm.timezone,
        phone: farm.phone || null,
        websiteUrl: farm.websiteUrl,
        status: "ACTIVE",
        reviewStatus: "APPROVED",
        dataSource: farm.isVerified ? "FARM_WEBSITE" : "MANUAL_RESEARCH",
        isVerified: farm.isVerified ?? false,
        isClaimed: false,
        isActive: true,
        lastVerifiedAt: farm.lastVerifiedAt ? new Date(farm.lastVerifiedAt) : null,
      },
    });

    const sourceUrls = farm.sourceUrls || (farm.sourceUrl ? [farm.sourceUrl] : []);
    if (sourceUrls.length > 0) {
      const seededFarm = await prisma.farm.findUniqueOrThrow({ where: { slug: farm.slug } });
      for (const sourceUrl of sourceUrls) {
        await prisma.farmSource.upsert({
          where: {
            dataSource_externalId: {
              dataSource: "FARM_WEBSITE",
              externalId: sourceUrl,
            },
          },
          create: {
            farmId: seededFarm.id,
            dataSource: "FARM_WEBSITE",
            externalId: sourceUrl,
            sourceUrl,
            rawMetadata: {
              verificationConfidence: farm.verificationConfidence,
              lastCheckedAt: farm.lastVerifiedAt,
            },
          },
          update: {
            farmId: seededFarm.id,
            sourceUrl,
            rawMetadata: {
              verificationConfidence: farm.verificationConfidence,
              lastCheckedAt: farm.lastVerifiedAt,
            },
            importedAt: new Date(),
          },
        });
      }
    }
    summary.farms += 1;
  }
}

async function seedFarmHours() {
  const farms = await prisma.farm.findMany({ where: { slug: { in: washingtonFarms.map((farm) => farm.slug) } } });

  for (const farm of farms) {
    const farmImport = washingtonFarms.find((candidate) => candidate.slug === farm.slug);
    const hourOverride = farmImport?.hours;
    const hourWindows = farmImport?.hourWindows || [];
    await prisma.farmHour.deleteMany({ where: { farmId: farm.id } });
    if (hourWindows.length > 0) {
      const openDays = new Set(hourWindows.map((window) => window.dayOfWeek));
      for (const window of hourWindows) {
        await prisma.farmHour.create({
          data: {
            farmId: farm.id,
            dayOfWeek: window.dayOfWeek,
            openTime: time(window.openTime),
            closeTime: time(window.closeTime),
            isClosed: false,
            notes: window.notes,
            effectiveStartDate: date("2026-06-01"),
            effectiveEndDate: date("2026-10-31"),
            source: farmImport?.isVerified ? "FARM_WEBSITE" : "MANUAL_RESEARCH",
            sourceUrl: window.sourceUrl || farmImport?.sourceUrl,
            verificationMethod: farmImport?.isVerified ? "manual_official_website_review" : "development_seed",
            isVerified: farmImport?.isVerified ?? false,
            verifiedAt: farmImport?.lastVerifiedAt ? new Date(farmImport.lastVerifiedAt) : null,
          },
        });
      }

      for (const dayOfWeek of dayNames.filter((day) => !openDays.has(day))) {
        await prisma.farmHour.create({
          data: {
            farmId: farm.id,
            dayOfWeek,
            openTime: null,
            closeTime: null,
            isClosed: true,
            notes: "Official U-pick page lists this day as closed or no U-pick window was found.",
            effectiveStartDate: date("2026-06-01"),
            effectiveEndDate: date("2026-10-31"),
            source: farmImport?.isVerified ? "FARM_WEBSITE" : "MANUAL_RESEARCH",
            sourceUrl: farmImport?.sourceUrl,
            verificationMethod: farmImport?.isVerified ? "manual_official_website_review" : "development_seed",
            isVerified: farmImport?.isVerified ?? false,
            verifiedAt: farmImport?.lastVerifiedAt ? new Date(farmImport.lastVerifiedAt) : null,
          },
        });
      }
      continue;
    }

    if (farmImport?.isVerified && !hourOverride) {
      continue;
    }
    for (const dayOfWeek of dayNames) {
      const isClosed = hourOverride ? hourOverride.closedDays.includes(dayOfWeek) : dayOfWeek === "MONDAY";
      await prisma.farmHour.create({
        data: {
          farmId: farm.id,
          dayOfWeek,
          openTime: isClosed ? null : time(hourOverride?.openTime || "09:00"),
          closeTime: isClosed ? null : time(hourOverride?.closeTime || "17:00"),
          isClosed,
          notes: hourOverride
            ? hourOverride.notes
            : isClosed
              ? "Closed for field recovery and maintenance."
              : "Development hours; confirm with farm before visiting.",
          effectiveStartDate: date("2026-06-01"),
          effectiveEndDate: date("2026-10-31"),
          source: farmImport?.isVerified ? "FARM_WEBSITE" : "MANUAL_RESEARCH",
          sourceUrl: hourOverride?.sourceUrl || farmImport?.sourceUrl,
          verificationMethod: farmImport?.isVerified ? "manual_official_website_review" : "development_seed",
          isVerified: farmImport?.isVerified ?? false,
          verifiedAt: farmImport?.lastVerifiedAt ? new Date(farmImport.lastVerifiedAt) : null,
        },
      });
    }
  }
}

async function seedFarmCrops() {
  for (const farmImport of washingtonFarms) {
    const farm = await prisma.farm.findUniqueOrThrow({ where: { slug: farmImport.slug } });

    for (const cropSlug of farmImport.cropSlugs) {
      const crop = await prisma.crop.findUniqueOrThrow({ where: { slug: cropSlug } });
      const season = seasonByCrop[cropSlug];

      await prisma.farmCrop.upsert({
        where: { farmId_cropId: { farmId: farm.id, cropId: crop.id } },
        create: {
          farmId: farm.id,
          cropId: crop.id,
          seasonStartDate: date(season.start),
          seasonEndDate: date(season.end),
          peakStartDate: date(season.peakStart),
          peakEndDate: date(season.peakEnd),
          notes: farmImport.cropNotes?.[cropSlug] || "Development seasonal window. Not verified against live farm conditions.",
          isUPick: farmImport.uPickCropSlugs?.[cropSlug] ?? true,
          isPrePicked: cropSlug === "pumpkin" || cropSlug === "christmas-tree",
          isActive: true,
        },
        update: {
          seasonStartDate: date(season.start),
          seasonEndDate: date(season.end),
          peakStartDate: date(season.peakStart),
          peakEndDate: date(season.peakEnd),
          notes: farmImport.cropNotes?.[cropSlug] || "Development seasonal window. Not verified against live farm conditions.",
          isUPick: farmImport.uPickCropSlugs?.[cropSlug] ?? true,
          isPrePicked: cropSlug === "pumpkin" || cropSlug === "christmas-tree",
          isActive: true,
        },
      });
      summary.farmCrops += 1;
    }

    for (const amenitySlug of farmImport.amenitySlugs) {
      const amenity = await prisma.amenity.findUniqueOrThrow({ where: { slug: amenitySlug } });
      await prisma.farmAmenity.upsert({
        where: { farmId_amenityId: { farmId: farm.id, amenityId: amenity.id } },
        create: { farmId: farm.id, amenityId: amenity.id, notes: "Development amenity data; not verified." },
        update: { notes: "Development amenity data; not verified." },
      });
    }
  }
}

async function seedCropPrices() {
  const farmCrops = await prisma.farmCrop.findMany({
    where: { farm: { slug: { in: washingtonFarms.map((farm) => farm.slug) } } },
    include: { crop: true, farm: true },
  });

  await prisma.cropPrice.deleteMany({ where: { farmCropId: { in: farmCrops.map((farmCrop) => farmCrop.id) } } });

  for (const farmCrop of farmCrops) {
    const farmImport = washingtonFarms.find((candidate) => candidate.slug === farmCrop.farm.slug);
    const priceOverride = farmImport?.priceOverrides?.[farmCrop.crop.slug];
    if (farmImport?.isVerified && !priceOverride) {
      continue;
    }
    const price = priceOverride || priceByCrop[farmCrop.crop.slug];
    await prisma.cropPrice.create({
      data: {
        farmId: farmCrop.farmId,
        cropId: farmCrop.cropId,
        farmCropId: farmCrop.id,
        priceType: price.priceType,
        amount: price.amount,
        currency: "USD",
        unitLabel: price.unitLabel,
        notes: price.notes || "Development price data. Confirm with farm before visiting.",
        effectiveStartDate: farmCrop.seasonStartDate,
        effectiveEndDate: farmCrop.seasonEndDate,
        source: priceOverride ? "FARM_WEBSITE" : "MANUAL_RESEARCH",
        sourceUrl: priceOverride ? farmImport?.sourceUrl : undefined,
        verificationMethod: priceOverride ? "manual_official_website_review" : "development_seed",
        isVerified: Boolean(priceOverride),
        verifiedAt: farmImport?.lastVerifiedAt ? new Date(farmImport.lastVerifiedAt) : null,
      },
    });
    summary.prices += 1;
  }
}

async function seedPickingReports() {
  const farms = await prisma.farm.findMany({
    where: { slug: { in: washingtonFarms.map((farm) => farm.slug) } },
    include: { farmCrops: { include: { crop: true } } },
  });

  await prisma.pickingReport.deleteMany({ where: { farmId: { in: farms.map((farm) => farm.id) }, source: "ADMIN" } });

  for (const farm of farms) {
    const farmImport = washingtonFarms.find((candidate) => candidate.slug === farm.slug);
    const reportInputs =
      farmImport?.currentReports ||
      (farmImport?.isVerified
        ? []
        : farm.farmCrops[0]
        ? [
            {
              cropSlug: farm.farmCrops[0].crop.slug,
              condition: "GOOD",
              crowdLevel: "MODERATE",
              rating: 4,
              comment: `${farm.farmCrops[0].crop.name} looks promising in this development seed record. Confirm before visiting.`,
            },
          ]
        : []);

    for (const reportInput of reportInputs) {
      const farmCrop = farm.farmCrops.find((candidate) => candidate.crop.slug === reportInput.cropSlug);
      if (!farmCrop) continue;

      await prisma.pickingReport.create({
        data: {
          farmId: farm.id,
          farmCropId: farmCrop.id,
          cropId: farmCrop.cropId,
          condition: reportInput.condition,
          crowdLevel: reportInput.crowdLevel,
          rating: reportInput.rating,
          comment: reportInput.comment,
          source: "ADMIN",
          sourceUrl: reportInput.sourceUrl || farmImport?.sourceUrl,
          verificationMethod: farmImport?.isVerified ? "manual_official_website_review" : "development_seed",
          isVerified: farmImport?.isVerified ?? false,
          isApproved: true,
          verifiedAt: farmImport?.lastVerifiedAt ? new Date(farmImport.lastVerifiedAt) : null,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 72),
        },
      });
      summary.reports += 1;
    }
  }
}

async function seedAnnouncements() {
  const importsWithAnnouncements = washingtonFarms.filter((farm) => farm.announcement);
  const farms = await prisma.farm.findMany({ where: { slug: { in: importsWithAnnouncements.map((farm) => farm.slug) } } });

  await prisma.announcement.deleteMany({ where: { farmId: { in: farms.map((farm) => farm.id) }, type: "GENERAL" } });

  for (const farmImport of importsWithAnnouncements) {
    const farm = farms.find((candidate) => candidate.slug === farmImport.slug);
    if (!farm || !farmImport.announcement) continue;

    await prisma.announcement.create({
      data: {
        farmId: farm.id,
        title: "Development listing note",
        body: farmImport.announcement,
        type: "GENERAL",
        startsAt: new Date(),
        endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
        isPublished: true,
        source: farmImport.isVerified ? "FARM_WEBSITE" : "MANUAL_RESEARCH",
        sourceUrl: farmImport.announcementSourceUrl || farmImport.sourceUrl,
        verificationMethod: farmImport.isVerified ? "manual_official_website_review" : "development_seed",
        isVerified: farmImport.isVerified ?? false,
        verifiedAt: farmImport.lastVerifiedAt ? new Date(farmImport.lastVerifiedAt) : null,
      },
    });
    summary.announcements += 1;
  }
}

function evidenceExpiry(daysFromObserved: number, observedAt: string) {
  const expiresAt = new Date(observedAt);
  expiresAt.setUTCDate(expiresAt.getUTCDate() + daysFromObserved);
  return expiresAt.toISOString();
}

async function seedEvidence() {
  for (const farmImport of washingtonFarms.filter((farm) => farm.isVerified)) {
    const farm = await prisma.farm.findUniqueOrThrow({
      where: { slug: farmImport.slug },
      include: { farmCrops: { include: { crop: true } } },
    });
    const observedAt = farmImport.lastVerifiedAt || new Date().toISOString();
    const verifiedAt = farmImport.lastVerifiedAt || observedAt;
    const officialWebsite = farmImport.sourceUrls?.[0] || farmImport.websiteUrl;
    const locationSource = farmImport.sourceUrl || officialWebsite;
    const homepageSource = farmImport.announcementSourceUrl || officialWebsite;

    await prisma.evidence.deleteMany({ where: { farmId: farm.id } });

    const sourceName = farmImport.sourceName || `${farmImport.name} official website`;
    const contactSource = farmImport.contactSourceUrl || officialWebsite;
    const addressSource = farmImport.addressSourceUrl || contactSource;
    const coordinateSource = farmImport.coordinateSourceUrl || addressSource;

    const baseEvidence = {
      farmId: farm.id,
      sourceName,
      sourceType: "OFFICIAL_WEBSITE",
      confidenceScore: farmImport.verificationConfidence || 90,
      observedAt,
      verifiedAt,
      verificationMethod: "manual_official_website_review",
    };

    const evidenceInputs = [
      {
        ...baseEvidence,
        evidenceType: "GENERAL",
        fieldName: "officialWebsite",
        value: farmImport.websiteUrl,
        normalizedValue: { websiteUrl: farmImport.websiteUrl },
        sourceUrl: officialWebsite,
        expiresAt: evidenceExpiry(30, observedAt),
        notes: "Official farm website used as a primary source for this reference profile.",
      },
      {
        ...baseEvidence,
        evidenceType: "CONTACT",
        fieldName: "websiteUrl",
        value: farmImport.websiteUrl,
        normalizedValue: { websiteUrl: farmImport.websiteUrl },
        sourceUrl: officialWebsite,
        expiresAt: evidenceExpiry(90, observedAt),
      },
      {
        ...baseEvidence,
        evidenceType: "CONTACT",
        fieldName: "phone",
        value: farmImport.phone,
        normalizedValue: { phone: farmImport.phone },
        sourceUrl: contactSource,
        expiresAt: evidenceExpiry(90, observedAt),
      },
      {
        ...baseEvidence,
        evidenceType: "LOCATION",
        fieldName: "address",
        value: farmImport.addressLine1 || `${farmImport.city}, ${farmImport.state}`,
        normalizedValue: {
          addressLine1: farmImport.addressLine1,
          city: farmImport.city,
          state: farmImport.state,
          postalCode: farmImport.postalCode,
        },
        sourceUrl: addressSource,
        expiresAt: evidenceExpiry(180, observedAt),
      },
      {
        ...baseEvidence,
        evidenceType: "LOCATION",
        fieldName: "coordinates",
        value: `${farmImport.latitude}, ${farmImport.longitude}`,
        normalizedValue: { latitude: farmImport.latitude, longitude: farmImport.longitude },
        sourceUrl: coordinateSource,
        expiresAt: evidenceExpiry(180, observedAt),
        confidenceScore: farmImport.coordinatesConfidence || 88,
      },
    ];

    if (!farmImport.phone) {
      const phoneIndex = evidenceInputs.findIndex((input) => input.evidenceType === "CONTACT" && input.fieldName === "phone");
      if (phoneIndex >= 0) {
        evidenceInputs.splice(phoneIndex, 1);
      }
    }

    if (farmImport.hours) {
      evidenceInputs.push({
        ...baseEvidence,
        evidenceType: "HOURS",
        fieldName: "hours",
        value: farmImport.hours.notes,
        normalizedValue: {
          openDays: farmImport.hours.openDays,
          openTime: farmImport.hours.openTime,
          closeTime: farmImport.hours.closeTime,
          closedDays: farmImport.hours.closedDays,
        },
        sourceUrl: farmImport.hours.sourceUrl || homepageSource,
        expiresAt: evidenceExpiry(7, observedAt),
      });
    }

    for (const [cropSlug, fieldLocation] of Object.entries(farmImport.fieldLocations || {})) {
      const farmCrop = farm.farmCrops.find((candidate) => candidate.crop.slug === cropSlug);
      if (!farmCrop) continue;

      evidenceInputs.push({
        ...baseEvidence,
        farmCropId: farmCrop.id,
        cropId: farmCrop.cropId,
        evidenceType: "CROP_AVAILABILITY",
        fieldName: "cropAvailability",
        value: `${farmCrop.crop.name} listed at ${fieldLocation}`,
        normalizedValue: {
          cropSlug,
          cropName: farmCrop.crop.name,
          fieldLocation,
        },
        sourceUrl: locationSource,
        expiresAt: evidenceExpiry(14, observedAt),
      });
    }

    for (const [cropSlug, price] of Object.entries(farmImport.priceOverrides || {})) {
      const farmCrop = farm.farmCrops.find((candidate) => candidate.crop.slug === cropSlug);
      if (!farmCrop) continue;

      evidenceInputs.push({
        ...baseEvidence,
        farmCropId: farmCrop.id,
        cropId: farmCrop.cropId,
        evidenceType: "PRICE",
        fieldName: "price",
        value: `${farmCrop.crop.name}: $${price.amount}/${price.unitLabel}`,
        normalizedValue: {
          cropSlug,
          amount: price.amount,
          unitLabel: price.unitLabel,
          priceType: price.priceType,
        },
        sourceUrl: locationSource,
        expiresAt: evidenceExpiry(14, observedAt),
        notes: price.notes,
      });
    }

    for (const report of farmImport.currentReports || []) {
      const farmCrop = farm.farmCrops.find((candidate) => candidate.crop.slug === report.cropSlug);
      if (!farmCrop) continue;

      evidenceInputs.push({
        ...baseEvidence,
        farmCropId: farmCrop.id,
        cropId: farmCrop.cropId,
        evidenceType: "HARVEST_STATUS",
        fieldName: "harvestStatus",
        value: report.comment,
        normalizedValue: {
          cropSlug: report.cropSlug,
          condition: report.condition,
          crowdLevel: report.crowdLevel,
          rating: report.rating,
        },
        sourceUrl: report.sourceUrl || homepageSource,
        expiresAt: evidenceExpiry(3, observedAt),
      });
    }

    if (farmImport.announcement) {
      evidenceInputs.push({
        ...baseEvidence,
        evidenceType: "ANNOUNCEMENT",
        fieldName: "announcement",
        value: farmImport.announcement,
        normalizedValue: { announcement: farmImport.announcement },
        sourceUrl: farmImport.announcementSourceUrl || homepageSource,
        expiresAt: evidenceExpiry(7, observedAt),
      });
    }

    if (farmImport.amenitySlugs.length > 0) {
      evidenceInputs.push({
        ...baseEvidence,
        evidenceType: "AMENITY",
        fieldName: "amenity",
        value: farmImport.amenitySlugs.join(", "),
        normalizedValue: { amenitySlugs: farmImport.amenitySlugs },
        sourceUrl: officialWebsite,
        expiresAt: evidenceExpiry(90, observedAt),
        confidenceScore: 62,
        notes: "Amenities remain lower-confidence until each amenity is confirmed from official source text or owner review.",
      });
    }

    for (const evidenceInput of evidenceInputs) {
      await evidenceService.createEvidence(evidenceInput);
      summary.evidence += 1;
    }
  }
}

async function seedVerificationProfiles() {
  for (const farmImport of washingtonFarms) {
    if (!farmImport.isVerified && !farmImport.verificationConfidence) continue;

    const farm = await prisma.farm.findUniqueOrThrow({ where: { slug: farmImport.slug } });
    const evidence = await prisma.evidence.findMany({ where: { farmId: farm.id } });
    const evidenceSummary = evidenceService.summarizeEvidenceForFarm(evidence);
    const fallbackCompleteness = buildCompleteness(farmImport);
    const fallbackLowConfidenceFields = buildLowConfidenceFields(farmImport);
    const completeness = evidence.length > 0 ? evidenceSummary : fallbackCompleteness;
    const lowConfidenceFields =
      evidence.length > 0 ? evidenceSummary.lowConfidenceFields : fallbackLowConfidenceFields;
    const sourceUrls = farmImport.sourceUrls || (farmImport.sourceUrl ? [farmImport.sourceUrl] : []);

    await prisma.farmVerificationProfile.upsert({
      where: { farmId: farm.id },
      create: {
        farmId: farm.id,
        status: farmImport.referenceStatus || (farmImport.isVerified ? "GOLD_STANDARD" : "PENDING_REVIEW"),
        lastResearchedAt: farmImport.lastVerifiedAt ? new Date(farmImport.lastVerifiedAt) : null,
        nextReviewAt: farmImport.nextReviewAt ? new Date(farmImport.nextReviewAt) : null,
        confidence: farmImport.verificationConfidence || 0,
        sourceCount: evidence.length > 0 ? evidenceSummary.sourceCount : sourceUrls.length,
        sourceUrls,
        manualNotes: farmImport.manualNotes,
        completenessScore: evidence.length > 0 ? evidenceSummary.completenessScore : completeness.score,
        completenessJson: evidence.length > 0 ? evidenceSummary.completeness : completeness.checks,
        missingFieldsJson: evidence.length > 0 ? evidenceSummary.missingFields : completeness.missingFields,
        lowConfidenceJson: lowConfidenceFields,
        personalityJson: farmImport.personality || null,
        heroImageUrl: farmImport.heroImageUrl || null,
        galleryImagesJson: farmImport.galleryImages || [],
        photoAttribution: farmImport.photoAttribution,
      },
      update: {
        status: farmImport.referenceStatus || (farmImport.isVerified ? "GOLD_STANDARD" : "PENDING_REVIEW"),
        lastResearchedAt: farmImport.lastVerifiedAt ? new Date(farmImport.lastVerifiedAt) : null,
        nextReviewAt: farmImport.nextReviewAt ? new Date(farmImport.nextReviewAt) : null,
        confidence: farmImport.verificationConfidence || 0,
        sourceCount: evidence.length > 0 ? evidenceSummary.sourceCount : sourceUrls.length,
        sourceUrls,
        manualNotes: farmImport.manualNotes,
        completenessScore: evidence.length > 0 ? evidenceSummary.completenessScore : completeness.score,
        completenessJson: evidence.length > 0 ? evidenceSummary.completeness : completeness.checks,
        missingFieldsJson: evidence.length > 0 ? evidenceSummary.missingFields : completeness.missingFields,
        lowConfidenceJson: lowConfidenceFields,
        personalityJson: farmImport.personality || null,
        heroImageUrl: farmImport.heroImageUrl || null,
        galleryImagesJson: farmImport.galleryImages || [],
        photoAttribution: farmImport.photoAttribution,
      },
    });
    summary.verificationProfiles += 1;
  }
}

async function seedHarvestSummaries() {
  const harvestRepository = createHarvestRepository(prisma);
  const harvestRadarService = createHarvestRadarService(harvestRepository);
  const summaries = await harvestRadarService.recalculateAll(new Date());
  summary.harvestSummaries = summaries.length;
}

async function main() {
  await seedCrops();
  await seedAmenities();
  await seedFarms();
  await seedFarmHours();
  await seedFarmCrops();
  await seedCropPrices();
  await seedPickingReports();
  await seedAnnouncements();
  await seedEvidence();
  await seedVerificationProfiles();
  await seedHarvestSummaries();

  console.log("Northwest U-Pick seed summary");
  console.table({
    "crops created/updated": summary.crops,
    "amenities created/updated": summary.amenities,
    "farms created/updated": summary.farms,
    "farm crops created/updated": summary.farmCrops,
    "prices created/updated": summary.prices,
    "reports created/updated": summary.reports,
    "announcements created/updated": summary.announcements,
    "evidence created/updated": summary.evidence,
    "verification profiles created/updated": summary.verificationProfiles,
    "harvest summaries recalculated": summary.harvestSummaries,
  });
}

main()
  .catch((error) => {
    console.error("Seed failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
