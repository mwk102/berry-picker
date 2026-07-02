const nameEvidencePattern = /\b(u-?pick|upick|berry|berries|orchard|farm)\b/i;
const upickPattern = /\b(u-?pick|upick|pick your own|pyo)\b/i;
const cropPattern =
  /\b(blueberr(?:y|ies)|strawberr(?:y|ies)|raspberr(?:y|ies)|blackberr(?:y|ies)|apple|cherr(?:y|ies)|pumpkin|sunflower|lavender|corn maze|christmas tree)\b/i;
const closedPattern = /\b(permanently closed|closed permanently|business_status.?closed_permanently|closed: yes|disused)\b/i;

type CandidateSourceEvidence = {
  dataSource: string;
  externalId?: string | null;
  sourceUrl?: string | null;
  rawMetadata?: unknown;
};

export type ScoringCandidate = {
  name: string;
  address?: string | null;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  websiteUrl?: string | null;
  phone?: string | null;
  sources?: CandidateSourceEvidence[];
};

export type CandidateScore = {
  score: number;
  verificationStatus: "PENDING_REVIEW" | "AUTO_APPROVED" | "NEEDS_REVIEW";
  evidence: {
    rules: Array<{ rule: string; points: number; matched: boolean; note?: string }>;
    sourceCount: number;
    matchedSources: string[];
  };
};

function stringifyEvidence(value: unknown) {
  if (!value) return "";

  try {
    return JSON.stringify(value).toLowerCase();
  } catch {
    return String(value).toLowerCase();
  }
}

function hasOpeningHours(sources: CandidateSourceEvidence[] = []) {
  return sources.some((source) => {
    const metadata = source.rawMetadata as Record<string, unknown> | undefined;
    return Boolean(
      metadata?.opening_hours ||
        metadata?.regularOpeningHours ||
        metadata?.currentOpeningHours ||
        metadata?.openingHours,
    );
  });
}

function distinctSourceCount(sources: CandidateSourceEvidence[] = []) {
  return new Set(sources.map((source) => source.dataSource)).size;
}

export function scoreCandidate(candidate: ScoringCandidate): CandidateScore {
  const sourceText = stringifyEvidence(candidate.sources);
  const websiteText = [candidate.websiteUrl, sourceText].filter(Boolean).join(" ");
  const allText = [candidate.name, candidate.address, candidate.city, websiteText].filter(Boolean).join(" ");
  const sourceCount = distinctSourceCount(candidate.sources);
  const rules: CandidateScore["evidence"]["rules"] = [];
  let score = 0;

  function apply(rule: string, points: number, matched: boolean, note?: string) {
    if (matched) {
      score += points;
    }

    rules.push({ rule, points: matched ? points : 0, matched, note });
  }

  const nameHasFarmEvidence = nameEvidencePattern.test(candidate.name);
  const websiteHasUpickEvidence = upickPattern.test(websiteText);
  const websiteHasCropEvidence = cropPattern.test(websiteText);
  const hasLocation =
    Boolean(candidate.latitude && candidate.longitude) &&
    Boolean(candidate.address || candidate.city);
  const hasMultipleSources = sourceCount > 1;
  const hasHours = hasOpeningHours(candidate.sources);
  const isClosed = closedPattern.test(allText);
  const hasNoContact = !candidate.websiteUrl && !candidate.phone;
  const isGenericFarmListing =
    /\bfarm\b/i.test(candidate.name) &&
    !websiteHasUpickEvidence &&
    !websiteHasCropEvidence &&
    !cropPattern.test(candidate.name);

  apply("Name contains U-pick, crop, orchard, or farm language", 30, nameHasFarmEvidence);
  apply("Website/source text contains U-pick language", 25, websiteHasUpickEvidence);
  apply("Website/source text mentions crop names", 20, websiteHasCropEvidence);
  apply("Address or city plus coordinates are present", 15, hasLocation);
  apply("Multiple sources match the same candidate", 15, hasMultipleSources, `${sourceCount} distinct source(s)`);
  apply("Opening hours exist in source metadata", 10, hasHours);
  apply("Source indicates permanently closed", -25, isClosed);
  apply("No website and no phone", -20, hasNoContact);
  apply("Generic farm listing with no U-pick evidence", -20, isGenericFarmListing);

  const boundedScore = Math.max(0, Math.min(100, score));
  const verificationStatus =
    boundedScore >= 70 ? "AUTO_APPROVED" : boundedScore >= 35 ? "NEEDS_REVIEW" : "PENDING_REVIEW";

  return {
    score: boundedScore,
    verificationStatus,
    evidence: {
      rules,
      sourceCount,
      matchedSources: [...new Set((candidate.sources || []).map((source) => source.dataSource))],
    },
  };
}
