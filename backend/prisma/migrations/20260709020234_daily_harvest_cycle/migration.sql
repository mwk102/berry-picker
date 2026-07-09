-- CreateEnum
CREATE TYPE "HarvestEventType" AS ENUM ('CROP_ENTERED_PEAK', 'CROP_ENDING_SOON', 'CROP_SEASON_OVER', 'FARM_REOPENED', 'FARM_CLOSED', 'PRICE_CHANGED', 'FRESH_REPORT_RECEIVED', 'EVIDENCE_EXPIRED', 'RECOMMENDATION_CHANGED', 'WEATHER_NOTE', 'GENERAL');

-- CreateTable
CREATE TABLE "DailyHarvestSummary" (
    "id" UUID NOT NULL,
    "summaryDate" DATE NOT NULL,
    "region" TEXT,
    "headline" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "highlightsJson" JSONB NOT NULL,
    "recommendedFarmId" UUID,
    "recommendedCropId" UUID,
    "confidenceScore" INTEGER NOT NULL DEFAULT 0,
    "freshnessScore" INTEGER NOT NULL DEFAULT 0,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyHarvestSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HarvestEvent" (
    "id" UUID NOT NULL,
    "eventDate" DATE NOT NULL,
    "farmId" UUID,
    "cropId" UUID,
    "eventType" "HarvestEventType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sourceEvidenceId" UUID,
    "confidenceScore" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HarvestEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DailyHarvestSummary_summaryDate_idx" ON "DailyHarvestSummary"("summaryDate");

-- CreateIndex
CREATE INDEX "DailyHarvestSummary_region_idx" ON "DailyHarvestSummary"("region");

-- CreateIndex
CREATE INDEX "DailyHarvestSummary_recommendedFarmId_idx" ON "DailyHarvestSummary"("recommendedFarmId");

-- CreateIndex
CREATE INDEX "DailyHarvestSummary_recommendedCropId_idx" ON "DailyHarvestSummary"("recommendedCropId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyHarvestSummary_summaryDate_region_key" ON "DailyHarvestSummary"("summaryDate", "region");

-- CreateIndex
CREATE INDEX "HarvestEvent_eventDate_idx" ON "HarvestEvent"("eventDate");

-- CreateIndex
CREATE INDEX "HarvestEvent_eventType_idx" ON "HarvestEvent"("eventType");

-- CreateIndex
CREATE INDEX "HarvestEvent_farmId_idx" ON "HarvestEvent"("farmId");

-- CreateIndex
CREATE INDEX "HarvestEvent_cropId_idx" ON "HarvestEvent"("cropId");

-- CreateIndex
CREATE INDEX "HarvestEvent_sourceEvidenceId_idx" ON "HarvestEvent"("sourceEvidenceId");

-- CreateIndex
CREATE UNIQUE INDEX "HarvestEvent_eventDate_eventType_farmId_cropId_title_key" ON "HarvestEvent"("eventDate", "eventType", "farmId", "cropId", "title");

-- AddForeignKey
ALTER TABLE "DailyHarvestSummary" ADD CONSTRAINT "DailyHarvestSummary_recommendedFarmId_fkey" FOREIGN KEY ("recommendedFarmId") REFERENCES "Farm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyHarvestSummary" ADD CONSTRAINT "DailyHarvestSummary_recommendedCropId_fkey" FOREIGN KEY ("recommendedCropId") REFERENCES "Crop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HarvestEvent" ADD CONSTRAINT "HarvestEvent_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HarvestEvent" ADD CONSTRAINT "HarvestEvent_cropId_fkey" FOREIGN KEY ("cropId") REFERENCES "Crop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HarvestEvent" ADD CONSTRAINT "HarvestEvent_sourceEvidenceId_fkey" FOREIGN KEY ("sourceEvidenceId") REFERENCES "Evidence"("id") ON DELETE SET NULL ON UPDATE CASCADE;
