-- CreateEnum
CREATE TYPE "FarmVerificationStatus" AS ENUM ('UNVERIFIED', 'PENDING_REVIEW', 'VERIFIED', 'GOLD_STANDARD', 'NEEDS_REVIEW');

-- AlterTable
ALTER TABLE "FarmHour" ADD COLUMN "sourceUrl" TEXT,
ADD COLUMN "verificationMethod" TEXT;

-- AlterTable
ALTER TABLE "SpecialHour" ADD COLUMN "sourceUrl" TEXT,
ADD COLUMN "verificationMethod" TEXT;

-- AlterTable
ALTER TABLE "CropPrice" ADD COLUMN "sourceUrl" TEXT,
ADD COLUMN "verificationMethod" TEXT;

-- AlterTable
ALTER TABLE "PickingReport" ADD COLUMN "sourceUrl" TEXT,
ADD COLUMN "verificationMethod" TEXT;

-- AlterTable
ALTER TABLE "Announcement" ADD COLUMN "source" "DataSource" NOT NULL DEFAULT 'MANUAL_RESEARCH',
ADD COLUMN "sourceUrl" TEXT,
ADD COLUMN "verificationMethod" TEXT,
ADD COLUMN "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "verifiedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "FarmVerificationProfile" (
    "id" UUID NOT NULL,
    "farmId" UUID NOT NULL,
    "status" "FarmVerificationStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "lastResearchedAt" TIMESTAMP(3),
    "nextReviewAt" TIMESTAMP(3),
    "confidence" INTEGER NOT NULL DEFAULT 0,
    "sourceCount" INTEGER NOT NULL DEFAULT 0,
    "sourceUrls" JSONB NOT NULL,
    "manualNotes" TEXT,
    "completenessScore" INTEGER NOT NULL DEFAULT 0,
    "completenessJson" JSONB,
    "lowConfidenceJson" JSONB,
    "missingFieldsJson" JSONB,
    "personalityJson" JSONB,
    "heroImageUrl" TEXT,
    "galleryImagesJson" JSONB,
    "photoAttribution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FarmVerificationProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FarmVerificationProfile_farmId_key" ON "FarmVerificationProfile"("farmId");

-- CreateIndex
CREATE INDEX "FarmVerificationProfile_status_idx" ON "FarmVerificationProfile"("status");

-- CreateIndex
CREATE INDEX "FarmVerificationProfile_lastResearchedAt_idx" ON "FarmVerificationProfile"("lastResearchedAt");

-- CreateIndex
CREATE INDEX "FarmVerificationProfile_nextReviewAt_idx" ON "FarmVerificationProfile"("nextReviewAt");

-- CreateIndex
CREATE INDEX "FarmVerificationProfile_completenessScore_idx" ON "FarmVerificationProfile"("completenessScore");

-- AddForeignKey
ALTER TABLE "FarmVerificationProfile" ADD CONSTRAINT "FarmVerificationProfile_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
