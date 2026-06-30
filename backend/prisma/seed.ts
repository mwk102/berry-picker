import { readFileSync } from "node:fs";
import { join } from "node:path";
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to run the seed script.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

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
  "corn-maze": { priceType: "PER_PERSON", amount: "10.00", unitLabel: "person" },
  "christmas-tree": { priceType: "UNKNOWN", amount: null as unknown as string, unitLabel: "tree" },
};

type FarmImport = {
  slug: string;
  name: string;
  description: string;
  city: string;
  state: string;
  postalCode: string;
  county: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
  phone: string;
  websiteUrl: string;
  cropSlugs: string[];
  amenitySlugs: string[];
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
};

function date(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function time(value: string) {
  return new Date(`1970-01-01T${value}:00.000Z`);
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
  for (const farm of washingtonFarms) {
    await prisma.farm.upsert({
      where: { slug: farm.slug },
      create: {
        slug: farm.slug,
        name: farm.name,
        description: farm.description,
        city: farm.city,
        state: farm.state,
        postalCode: farm.postalCode,
        county: farm.county,
        country: farm.country,
        latitude: farm.latitude,
        longitude: farm.longitude,
        timezone: farm.timezone,
        phone: farm.phone,
        websiteUrl: farm.websiteUrl,
        status: "ACTIVE",
        dataSource: "MANUAL_RESEARCH",
        isVerified: false,
        isClaimed: false,
        isActive: true,
      },
      update: {
        name: farm.name,
        description: farm.description,
        city: farm.city,
        state: farm.state,
        postalCode: farm.postalCode,
        county: farm.county,
        country: farm.country,
        latitude: farm.latitude,
        longitude: farm.longitude,
        timezone: farm.timezone,
        phone: farm.phone,
        websiteUrl: farm.websiteUrl,
        status: "ACTIVE",
        dataSource: "MANUAL_RESEARCH",
        isVerified: false,
        isClaimed: false,
        isActive: true,
      },
    });
    summary.farms += 1;
  }
}

async function seedFarmHours() {
  const farms = await prisma.farm.findMany({ where: { slug: { in: washingtonFarms.map((farm) => farm.slug) } } });

  for (const farm of farms) {
    await prisma.farmHour.deleteMany({ where: { farmId: farm.id } });
    for (const dayOfWeek of dayNames) {
      const isClosed = dayOfWeek === "MONDAY";
      await prisma.farmHour.create({
        data: {
          farmId: farm.id,
          dayOfWeek,
          openTime: isClosed ? null : time("09:00"),
          closeTime: isClosed ? null : time("17:00"),
          isClosed,
          notes: isClosed ? "Closed for field recovery and maintenance." : "Development hours; confirm with farm before visiting.",
          effectiveStartDate: date("2026-06-01"),
          effectiveEndDate: date("2026-10-31"),
          source: "MANUAL_RESEARCH",
          isVerified: false,
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
          notes: "Development seasonal window. Not verified against live farm conditions.",
          isUPick: true,
          isPrePicked: cropSlug === "pumpkin" || cropSlug === "christmas-tree",
          isActive: true,
        },
        update: {
          seasonStartDate: date(season.start),
          seasonEndDate: date(season.end),
          peakStartDate: date(season.peakStart),
          peakEndDate: date(season.peakEnd),
          notes: "Development seasonal window. Not verified against live farm conditions.",
          isUPick: true,
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
    include: { crop: true },
  });

  await prisma.cropPrice.deleteMany({ where: { farmCropId: { in: farmCrops.map((farmCrop) => farmCrop.id) } } });

  for (const farmCrop of farmCrops) {
    const price = priceByCrop[farmCrop.crop.slug];
    await prisma.cropPrice.create({
      data: {
        farmId: farmCrop.farmId,
        cropId: farmCrop.cropId,
        farmCropId: farmCrop.id,
        priceType: price.priceType,
        amount: price.amount,
        currency: "USD",
        unitLabel: price.unitLabel,
        notes: "Development price data. Confirm with farm before visiting.",
        effectiveStartDate: farmCrop.seasonStartDate,
        effectiveEndDate: farmCrop.seasonEndDate,
        source: "MANUAL_RESEARCH",
        isVerified: false,
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
    const farmCrop = farm.farmCrops[0];
    if (!farmCrop) continue;

    await prisma.pickingReport.create({
      data: {
        farmId: farm.id,
        farmCropId: farmCrop.id,
        cropId: farmCrop.cropId,
        condition: "GOOD",
        crowdLevel: "MODERATE",
        rating: 4,
        comment: `${farmCrop.crop.name} looks promising in this development seed record. Confirm before visiting.`,
        source: "ADMIN",
        isVerified: false,
        isApproved: true,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 72),
      },
    });
    summary.reports += 1;
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
      },
    });
    summary.announcements += 1;
  }
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

  console.log("Northwest U-Pick seed summary");
  console.table({
    "crops created/updated": summary.crops,
    "amenities created/updated": summary.amenities,
    "farms created/updated": summary.farms,
    "farm crops created/updated": summary.farmCrops,
    "prices created/updated": summary.prices,
    "reports created/updated": summary.reports,
    "announcements created/updated": summary.announcements,
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
