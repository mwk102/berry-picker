-- CreateEnum
CREATE TYPE "EvidenceType" AS ENUM ('PRICE', 'HOURS', 'CROP_AVAILABILITY', 'HARVEST_STATUS', 'AMENITY', 'ANNOUNCEMENT', 'CONTACT', 'LOCATION', 'PHOTO', 'GENERAL');

-- CreateEnum
CREATE TYPE "EvidenceSourceType" AS ENUM ('OFFICIAL_WEBSITE', 'FARM_OWNER', 'ADMIN_RESEARCH', 'COMMUNITY_REPORT', 'GOOGLE_PLACES', 'OPENSTREETMAP', 'SOCIAL_MEDIA', 'IMPORT');

-- CreateTable
CREATE TABLE "Evidence" (
    "id" UUID NOT NULL,
    "farmId" UUID NOT NULL,
    "farmCropId" UUID,
    "cropId" UUID,
    "evidenceType" "EvidenceType" NOT NULL,
    "fieldName" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "normalizedValue" JSONB,
    "sourceName" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "sourceType" "EvidenceSourceType" NOT NULL,
    "confidenceScore" INTEGER NOT NULL DEFAULT 0,
    "observedAt" TIMESTAMP(3) NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "verificationMethod" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Evidence_farmId_idx" ON "Evidence"("farmId");

-- CreateIndex
CREATE INDEX "Evidence_farmCropId_idx" ON "Evidence"("farmCropId");

-- CreateIndex
CREATE INDEX "Evidence_cropId_idx" ON "Evidence"("cropId");

-- CreateIndex
CREATE INDEX "Evidence_evidenceType_idx" ON "Evidence"("evidenceType");

-- CreateIndex
CREATE INDEX "Evidence_fieldName_idx" ON "Evidence"("fieldName");

-- CreateIndex
CREATE INDEX "Evidence_sourceType_idx" ON "Evidence"("sourceType");

-- CreateIndex
CREATE INDEX "Evidence_confidenceScore_idx" ON "Evidence"("confidenceScore");

-- CreateIndex
CREATE INDEX "Evidence_expiresAt_idx" ON "Evidence"("expiresAt");

-- CreateIndex
CREATE INDEX "Evidence_verifiedAt_idx" ON "Evidence"("verifiedAt");

-- CreateIndex
CREATE INDEX "Evidence_farmId_evidenceType_idx" ON "Evidence"("farmId", "evidenceType");

-- CreateIndex
CREATE INDEX "Evidence_farmId_fieldName_idx" ON "Evidence"("farmId", "fieldName");

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_farmCropId_fkey" FOREIGN KEY ("farmCropId") REFERENCES "FarmCrop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_cropId_fkey" FOREIGN KEY ("cropId") REFERENCES "Crop"("id") ON DELETE SET NULL ON UPDATE CASCADE;
