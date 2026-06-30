-- CreateEnum
CREATE TYPE "CandidateReviewStatus" AS ENUM ('PENDING_REVIEW', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Farm" ADD COLUMN     "reviewStatus" "CandidateReviewStatus" NOT NULL DEFAULT 'APPROVED';

-- CreateTable
CREATE TABLE "FarmSource" (
    "id" UUID NOT NULL,
    "farmId" UUID NOT NULL,
    "dataSource" "DataSource" NOT NULL,
    "externalId" TEXT,
    "sourceUrl" TEXT,
    "rawMetadata" JSONB,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FarmSource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FarmSource_farmId_idx" ON "FarmSource"("farmId");

-- CreateIndex
CREATE INDEX "FarmSource_dataSource_idx" ON "FarmSource"("dataSource");

-- CreateIndex
CREATE UNIQUE INDEX "FarmSource_dataSource_externalId_key" ON "FarmSource"("dataSource", "externalId");

-- CreateIndex
CREATE INDEX "Farm_reviewStatus_idx" ON "Farm"("reviewStatus");

-- AddForeignKey
ALTER TABLE "FarmSource" ADD CONSTRAINT "FarmSource_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE CASCADE ON UPDATE CASCADE;
