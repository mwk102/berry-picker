import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { prisma } from "./lib/candidateImport";
import { scoreCandidate } from "./lib/candidateScoring";

type PendingFarm = Awaited<ReturnType<typeof loadPendingCandidateFarms>>[number];

const reportDirectory = join(__dirname, "..", "reports");
const reportPath = join(reportDirectory, "candidate-review.json");

function primarySourceFor(farm: PendingFarm) {
  return farm.sources[0] || {
    dataSource: farm.dataSource,
    externalId: `farm:${farm.id}`,
    sourceUrl: null,
    rawMetadata: null,
  };
}

async function loadPendingCandidateFarms() {
  return prisma.farm.findMany({
    where: {
      reviewStatus: "PENDING_REVIEW",
      isVerified: false,
    },
    include: {
      sources: {
        orderBy: { importedAt: "desc" },
      },
      candidates: true,
    },
    orderBy: [{ name: "asc" }],
  });
}

async function upsertCandidateReview(farm: PendingFarm) {
  const source = primarySourceFor(farm);
  const score = scoreCandidate({
    name: farm.name,
    address: farm.addressLine1,
    city: farm.city,
    latitude: Number(farm.latitude),
    longitude: Number(farm.longitude),
    websiteUrl: farm.websiteUrl,
    phone: farm.phone,
    sources: farm.sources.map((farmSource) => ({
      dataSource: farmSource.dataSource,
      externalId: farmSource.externalId,
      sourceUrl: farmSource.sourceUrl,
      rawMetadata: farmSource.rawMetadata,
    })),
  });

  const existingRejectedReview = farm.candidates.find(
    (candidate) => candidate.verificationStatus === "REJECTED",
  );
  const verificationStatus = existingRejectedReview
    ? "REJECTED"
    : score.verificationStatus;
  const externalId = source.externalId || `farm:${farm.id}`;
  const data = {
    name: farm.name,
    address: farm.addressLine1,
    city: farm.city,
    state: farm.state,
    latitude: farm.latitude,
    longitude: farm.longitude,
    websiteUrl: farm.websiteUrl,
    phone: farm.phone,
    source: source.dataSource,
    externalId,
    confidenceScore: score.score,
    verificationStatus,
    evidenceJson: {
      ...score.evidence,
      matchedFarmSlug: farm.slug,
      matchedFarmId: farm.id,
      sourceUrls: farm.sources.map((farmSource) => farmSource.sourceUrl).filter(Boolean),
    },
    matchedFarmId: farm.id,
  };

  const candidateReview = await prisma.candidateFarm.upsert({
    where: {
      source_externalId: {
        source: source.dataSource,
        externalId,
      },
    },
    create: data,
    update: data,
  });

  await prisma.farm.update({
    where: { id: farm.id },
    data: {
      isActive: verificationStatus === "AUTO_APPROVED",
    },
  });

  return {
    id: candidateReview.id,
    matchedFarmId: farm.id,
    slug: farm.slug,
    name: farm.name,
    city: farm.city,
    source: source.dataSource,
    externalId,
    confidenceScore: score.score,
    verificationStatus,
    isMapVisible: verificationStatus === "AUTO_APPROVED",
    evidence: data.evidenceJson,
  };
}

async function main() {
  const pendingFarms = await loadPendingCandidateFarms();
  const candidates = [];

  for (const farm of pendingFarms) {
    candidates.push(await upsertCandidateReview(farm));
  }

  const summary = candidates.reduce(
    (counts, candidate) => {
      counts.total += 1;
      counts[candidate.verificationStatus] += 1;
      if (candidate.isMapVisible) counts.mapVisible += 1;
      return counts;
    },
    {
      total: 0,
      AUTO_APPROVED: 0,
      NEEDS_REVIEW: 0,
      PENDING_REVIEW: 0,
      REJECTED: 0,
      mapVisible: 0,
    },
  );

  const report = {
    generatedAt: new Date().toISOString(),
    thresholds: {
      autoApproved: ">= 70",
      needsReview: "35-69",
      pendingReview: "< 35",
    },
    summary,
    candidates: candidates.sort((first, second) => second.confidenceScore - first.confidenceScore),
  };

  mkdirSync(reportDirectory, { recursive: true });
  writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log(`Candidate review report written to ${reportPath}`);
  console.table(summary);
}

main()
  .catch((error) => {
    console.error("Candidate confidence scoring failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
