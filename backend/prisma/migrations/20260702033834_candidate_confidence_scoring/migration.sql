-- CreateEnum
CREATE TYPE "CandidateVerificationStatus" AS ENUM ('PENDING_REVIEW', 'AUTO_APPROVED', 'NEEDS_REVIEW', 'REJECTED');

-- CreateTable
CREATE TABLE "CandidateFarm" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "websiteUrl" TEXT,
    "phone" TEXT,
    "source" "DataSource" NOT NULL,
    "externalId" TEXT,
    "confidenceScore" INTEGER NOT NULL DEFAULT 0,
    "verificationStatus" "CandidateVerificationStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "evidenceJson" JSONB,
    "matchedFarmId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidateFarm_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CandidateFarm_confidenceScore_idx" ON "CandidateFarm"("confidenceScore");

-- CreateIndex
CREATE INDEX "CandidateFarm_verificationStatus_idx" ON "CandidateFarm"("verificationStatus");

-- CreateIndex
CREATE INDEX "CandidateFarm_matchedFarmId_idx" ON "CandidateFarm"("matchedFarmId");

-- CreateIndex
CREATE INDEX "CandidateFarm_source_idx" ON "CandidateFarm"("source");

-- CreateIndex
CREATE INDEX "CandidateFarm_city_state_idx" ON "CandidateFarm"("city", "state");

-- CreateIndex
CREATE UNIQUE INDEX "CandidateFarm_source_externalId_key" ON "CandidateFarm"("source", "externalId");

-- AddForeignKey
ALTER TABLE "CandidateFarm" ADD CONSTRAINT "CandidateFarm_matchedFarmId_fkey" FOREIGN KEY ("matchedFarmId") REFERENCES "Farm"("id") ON DELETE SET NULL ON UPDATE CASCADE;
