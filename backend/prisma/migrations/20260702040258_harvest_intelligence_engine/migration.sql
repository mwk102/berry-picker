-- CreateEnum
CREATE TYPE "HarvestSeasonStage" AS ENUM ('UNKNOWN', 'UPCOMING', 'EARLY', 'PEAK', 'LATE', 'ENDED');

-- CreateTable
CREATE TABLE "HarvestSummary" (
    "id" UUID NOT NULL,
    "cropId" UUID NOT NULL,
    "activeFarmCount" INTEGER NOT NULL DEFAULT 0,
    "averagePrice" DECIMAL(10,2),
    "seasonStage" "HarvestSeasonStage" NOT NULL DEFAULT 'UNKNOWN',
    "confidence" INTEGER NOT NULL DEFAULT 0,
    "reportFreshness" INTEGER,
    "bestRegion" TEXT,
    "evidenceJson" JSONB,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HarvestSummary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HarvestSummary_cropId_key" ON "HarvestSummary"("cropId");

-- CreateIndex
CREATE INDEX "HarvestSummary_seasonStage_idx" ON "HarvestSummary"("seasonStage");

-- CreateIndex
CREATE INDEX "HarvestSummary_confidence_idx" ON "HarvestSummary"("confidence");

-- CreateIndex
CREATE INDEX "HarvestSummary_bestRegion_idx" ON "HarvestSummary"("bestRegion");

-- CreateIndex
CREATE INDEX "HarvestSummary_calculatedAt_idx" ON "HarvestSummary"("calculatedAt");

-- AddForeignKey
ALTER TABLE "HarvestSummary" ADD CONSTRAINT "HarvestSummary_cropId_fkey" FOREIGN KEY ("cropId") REFERENCES "Crop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
