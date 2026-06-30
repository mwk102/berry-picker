-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('MEMBER', 'FARM_OWNER', 'MODERATOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "FarmStatus" AS ENUM ('ACTIVE', 'TEMPORARILY_CLOSED', 'SEASONAL', 'PERMANENTLY_CLOSED', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "CropCategory" AS ENUM ('BERRY', 'ORCHARD', 'FLOWER', 'VEGETABLE', 'PUMPKIN', 'CHRISTMAS_TREE', 'ATTRACTION', 'OTHER');

-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateEnum
CREATE TYPE "DataSource" AS ENUM ('ADMIN', 'FARM_OWNER', 'COMMUNITY', 'GOOGLE_PLACES', 'OPENSTREETMAP', 'FARM_WEBSITE', 'MANUAL_RESEARCH', 'IMPORT');

-- CreateEnum
CREATE TYPE "PriceType" AS ENUM ('PER_POUND', 'PER_BUCKET', 'PER_BOX', 'PER_PERSON', 'FLAT_ENTRY', 'DONATION', 'FREE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "PickingCondition" AS ENUM ('EXCELLENT', 'GOOD', 'LIMITED', 'PICKED_OVER', 'CLOSED', 'COMING_SOON', 'SEASON_OVER', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "CrowdLevel" AS ENUM ('QUIET', 'MODERATE', 'BUSY', 'VERY_BUSY', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "ReportSource" AS ENUM ('COMMUNITY', 'FARM_OWNER', 'ADMIN', 'IMPORT');

-- CreateEnum
CREATE TYPE "AnnouncementType" AS ENUM ('GENERAL', 'CLOSURE', 'PARKING', 'WEATHER', 'HARVEST', 'EVENT', 'WARNING');

-- CreateEnum
CREATE TYPE "AmenityCategory" AS ENUM ('FAMILY', 'ACCESSIBILITY', 'FACILITY', 'FOOD', 'ACTIVITY', 'POLICY', 'OTHER');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'MEMBER',
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Farm" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "postalCode" TEXT,
    "county" TEXT,
    "country" TEXT NOT NULL DEFAULT 'US',
    "latitude" DECIMAL(9,6) NOT NULL,
    "longitude" DECIMAL(9,6) NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'America/Los_Angeles',
    "phone" TEXT,
    "email" TEXT,
    "websiteUrl" TEXT,
    "facebookUrl" TEXT,
    "instagramUrl" TEXT,
    "status" "FarmStatus" NOT NULL DEFAULT 'UNKNOWN',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isClaimed" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "dataSource" "DataSource" NOT NULL DEFAULT 'MANUAL_RESEARCH',
    "lastVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Farm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Crop" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "CropCategory" NOT NULL,
    "icon" TEXT,
    "color" TEXT,
    "defaultSeasonStartMonth" INTEGER,
    "defaultSeasonEndMonth" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Crop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FarmCrop" (
    "id" UUID NOT NULL,
    "farmId" UUID NOT NULL,
    "cropId" UUID NOT NULL,
    "seasonStartDate" DATE,
    "seasonEndDate" DATE,
    "peakStartDate" DATE,
    "peakEndDate" DATE,
    "notes" TEXT,
    "isUPick" BOOLEAN NOT NULL DEFAULT true,
    "isPrePicked" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FarmCrop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FarmHour" (
    "id" UUID NOT NULL,
    "farmId" UUID NOT NULL,
    "dayOfWeek" "DayOfWeek" NOT NULL,
    "openTime" TIME,
    "closeTime" TIME,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "effectiveStartDate" DATE,
    "effectiveEndDate" DATE,
    "source" "DataSource" NOT NULL DEFAULT 'MANUAL_RESEARCH',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FarmHour_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpecialHour" (
    "id" UUID NOT NULL,
    "farmId" UUID NOT NULL,
    "date" DATE NOT NULL,
    "openTime" TIME,
    "closeTime" TIME,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "reason" TEXT,
    "source" "DataSource" NOT NULL DEFAULT 'MANUAL_RESEARCH',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpecialHour_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Amenity" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "category" "AmenityCategory" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Amenity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FarmAmenity" (
    "id" UUID NOT NULL,
    "farmId" UUID NOT NULL,
    "amenityId" UUID NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FarmAmenity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CropPrice" (
    "id" UUID NOT NULL,
    "farmId" UUID NOT NULL,
    "farmCropId" UUID NOT NULL,
    "cropId" UUID NOT NULL,
    "priceType" "PriceType" NOT NULL,
    "amount" DECIMAL(10,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "unitLabel" TEXT,
    "notes" TEXT,
    "effectiveStartDate" DATE,
    "effectiveEndDate" DATE,
    "source" "DataSource" NOT NULL DEFAULT 'MANUAL_RESEARCH',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CropPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PickingReport" (
    "id" UUID NOT NULL,
    "farmId" UUID NOT NULL,
    "farmCropId" UUID NOT NULL,
    "cropId" UUID NOT NULL,
    "userId" UUID,
    "condition" "PickingCondition" NOT NULL,
    "crowdLevel" "CrowdLevel" NOT NULL DEFAULT 'UNKNOWN',
    "rating" INTEGER,
    "comment" TEXT,
    "source" "ReportSource" NOT NULL DEFAULT 'COMMUNITY',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PickingReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" UUID NOT NULL,
    "farmId" UUID NOT NULL,
    "authorUserId" UUID,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "type" "AnnouncementType" NOT NULL DEFAULT 'GENERAL',
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Farm_slug_key" ON "Farm"("slug");

-- CreateIndex
CREATE INDEX "Farm_city_idx" ON "Farm"("city");

-- CreateIndex
CREATE INDEX "Farm_state_idx" ON "Farm"("state");

-- CreateIndex
CREATE INDEX "Farm_county_idx" ON "Farm"("county");

-- CreateIndex
CREATE INDEX "Farm_latitude_longitude_idx" ON "Farm"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "Farm_state_city_idx" ON "Farm"("state", "city");

-- CreateIndex
CREATE INDEX "Farm_isActive_status_idx" ON "Farm"("isActive", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Crop_slug_key" ON "Crop"("slug");

-- CreateIndex
CREATE INDEX "Crop_category_idx" ON "Crop"("category");

-- CreateIndex
CREATE INDEX "Crop_isActive_idx" ON "Crop"("isActive");

-- CreateIndex
CREATE INDEX "FarmCrop_farmId_isActive_idx" ON "FarmCrop"("farmId", "isActive");

-- CreateIndex
CREATE INDEX "FarmCrop_cropId_isActive_idx" ON "FarmCrop"("cropId", "isActive");

-- CreateIndex
CREATE INDEX "FarmCrop_seasonStartDate_seasonEndDate_idx" ON "FarmCrop"("seasonStartDate", "seasonEndDate");

-- CreateIndex
CREATE UNIQUE INDEX "FarmCrop_farmId_cropId_key" ON "FarmCrop"("farmId", "cropId");

-- CreateIndex
CREATE INDEX "FarmHour_farmId_idx" ON "FarmHour"("farmId");

-- CreateIndex
CREATE INDEX "FarmHour_farmId_dayOfWeek_idx" ON "FarmHour"("farmId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "FarmHour_effectiveStartDate_effectiveEndDate_idx" ON "FarmHour"("effectiveStartDate", "effectiveEndDate");

-- CreateIndex
CREATE INDEX "SpecialHour_farmId_idx" ON "SpecialHour"("farmId");

-- CreateIndex
CREATE INDEX "SpecialHour_date_idx" ON "SpecialHour"("date");

-- CreateIndex
CREATE INDEX "SpecialHour_farmId_date_idx" ON "SpecialHour"("farmId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Amenity_slug_key" ON "Amenity"("slug");

-- CreateIndex
CREATE INDEX "Amenity_category_idx" ON "Amenity"("category");

-- CreateIndex
CREATE INDEX "FarmAmenity_farmId_idx" ON "FarmAmenity"("farmId");

-- CreateIndex
CREATE INDEX "FarmAmenity_amenityId_idx" ON "FarmAmenity"("amenityId");

-- CreateIndex
CREATE UNIQUE INDEX "FarmAmenity_farmId_amenityId_key" ON "FarmAmenity"("farmId", "amenityId");

-- CreateIndex
CREATE INDEX "CropPrice_farmId_idx" ON "CropPrice"("farmId");

-- CreateIndex
CREATE INDEX "CropPrice_farmCropId_idx" ON "CropPrice"("farmCropId");

-- CreateIndex
CREATE INDEX "CropPrice_cropId_idx" ON "CropPrice"("cropId");

-- CreateIndex
CREATE INDEX "CropPrice_effectiveStartDate_effectiveEndDate_idx" ON "CropPrice"("effectiveStartDate", "effectiveEndDate");

-- CreateIndex
CREATE INDEX "CropPrice_farmCropId_effectiveStartDate_effectiveEndDate_idx" ON "CropPrice"("farmCropId", "effectiveStartDate", "effectiveEndDate");

-- CreateIndex
CREATE INDEX "PickingReport_farmId_idx" ON "PickingReport"("farmId");

-- CreateIndex
CREATE INDEX "PickingReport_cropId_idx" ON "PickingReport"("cropId");

-- CreateIndex
CREATE INDEX "PickingReport_farmCropId_idx" ON "PickingReport"("farmCropId");

-- CreateIndex
CREATE INDEX "PickingReport_createdAt_idx" ON "PickingReport"("createdAt");

-- CreateIndex
CREATE INDEX "PickingReport_expiresAt_idx" ON "PickingReport"("expiresAt");

-- CreateIndex
CREATE INDEX "PickingReport_isApproved_idx" ON "PickingReport"("isApproved");

-- CreateIndex
CREATE INDEX "PickingReport_farmId_cropId_createdAt_idx" ON "PickingReport"("farmId", "cropId", "createdAt");

-- CreateIndex
CREATE INDEX "PickingReport_farmCropId_createdAt_idx" ON "PickingReport"("farmCropId", "createdAt");

-- CreateIndex
CREATE INDEX "PickingReport_expiresAt_isApproved_idx" ON "PickingReport"("expiresAt", "isApproved");

-- CreateIndex
CREATE INDEX "Announcement_farmId_idx" ON "Announcement"("farmId");

-- CreateIndex
CREATE INDEX "Announcement_startsAt_idx" ON "Announcement"("startsAt");

-- CreateIndex
CREATE INDEX "Announcement_endsAt_idx" ON "Announcement"("endsAt");

-- CreateIndex
CREATE INDEX "Announcement_isPublished_idx" ON "Announcement"("isPublished");

-- CreateIndex
CREATE INDEX "Announcement_farmId_isPublished_startsAt_endsAt_idx" ON "Announcement"("farmId", "isPublished", "startsAt", "endsAt");

-- AddForeignKey
ALTER TABLE "FarmCrop" ADD CONSTRAINT "FarmCrop_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FarmCrop" ADD CONSTRAINT "FarmCrop_cropId_fkey" FOREIGN KEY ("cropId") REFERENCES "Crop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FarmHour" ADD CONSTRAINT "FarmHour_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecialHour" ADD CONSTRAINT "SpecialHour_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FarmAmenity" ADD CONSTRAINT "FarmAmenity_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FarmAmenity" ADD CONSTRAINT "FarmAmenity_amenityId_fkey" FOREIGN KEY ("amenityId") REFERENCES "Amenity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CropPrice" ADD CONSTRAINT "CropPrice_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CropPrice" ADD CONSTRAINT "CropPrice_farmCropId_fkey" FOREIGN KEY ("farmCropId") REFERENCES "FarmCrop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CropPrice" ADD CONSTRAINT "CropPrice_cropId_fkey" FOREIGN KEY ("cropId") REFERENCES "Crop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickingReport" ADD CONSTRAINT "PickingReport_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickingReport" ADD CONSTRAINT "PickingReport_farmCropId_fkey" FOREIGN KEY ("farmCropId") REFERENCES "FarmCrop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickingReport" ADD CONSTRAINT "PickingReport_cropId_fkey" FOREIGN KEY ("cropId") REFERENCES "Crop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickingReport" ADD CONSTRAINT "PickingReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
