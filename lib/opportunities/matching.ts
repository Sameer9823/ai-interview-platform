export interface MatchScoreInput {
  userSkills?: string[];
  userExperience?: number;
  userEducation?: string | null;
  userLocation?: string;
  opportunityRequiredSkills?: string[];
  opportunityPreferredSkills?: string[];
  opportunityExperienceMin?: number;
  opportunityExperienceMax?: number;
  opportunityLocation?: string;
  opportunityWorkArrangement?: string;
  opportunityType?: string;
  targetRoles?: string[];
  preferredIndustries?: string[];
}

export interface MatchScoreResult {
  overallScore: number;
  requiredSkillsScore: number;
  preferredSkillsScore: number;
  experienceScore: number;
  roleRelevanceScore: number;
  locationScore: number;
  educationScore: number;
  matchingSkills: string[];
  missingSkills: string[];
  unverifiedSkills: string[];
  experienceMatch: string;
  locationMatch: string;
  category: string;
  explanation: string;
}

const WEIGHTS = {
  requiredSkills: 0.35,
  preferredSkills: 0.15,
  experience: 0.2,
  roleRelevance: 0.15,
  location: 0.1,
  education: 0.05,
};

export function calculateMatchScore(input: MatchScoreInput): MatchScoreResult {
  const {
    userSkills = [],
    userExperience = 0,
    userEducation = null,
    userLocation = "",
    opportunityRequiredSkills = [],
    opportunityPreferredSkills = [],
    opportunityExperienceMin = 0,
    opportunityExperienceMax = 99,
    opportunityLocation = "",
    opportunityWorkArrangement = "ONSITE",
    opportunityType = "FULL_TIME",
    targetRoles = [],
    preferredIndustries = [],
  } = input;

  const normalizedUserSkills = userSkills.map((s: string) => s.toLowerCase().trim());
  const normalizedRequiredSkills = opportunityRequiredSkills.map((s: string) => s.toLowerCase().trim());
  const normalizedPreferredSkills = opportunityPreferredSkills.map((s: string) => s.toLowerCase().trim());

  const matchingRequired = normalizedRequiredSkills.filter((s: string) => normalizedUserSkills.includes(s));
  const missingRequired = normalizedRequiredSkills.filter((s: string) => !normalizedUserSkills.includes(s));

  const matchingPreferred = normalizedPreferredSkills.filter((s: string) => normalizedUserSkills.includes(s));
  const missingPreferred = normalizedPreferredSkills.filter((s: string) => !normalizedUserSkills.includes(s));

  const requiredSkillsScore = normalizedRequiredSkills.length > 0
    ? Math.round((matchingRequired.length / normalizedRequiredSkills.length) * 100)
    : 100;

  const preferredSkillsScore = normalizedPreferredSkills.length > 0
    ? Math.round((matchingPreferred.length / normalizedPreferredSkills.length) * 100)
    : 100;

  let experienceScore = 50;
  if (userExperience >= opportunityExperienceMin && userExperience <= opportunityExperienceMax) {
    experienceScore = 100;
  } else if (userExperience < opportunityExperienceMin) {
    const gap = opportunityExperienceMin - userExperience;
    experienceScore = Math.max(0, 100 - gap * 15);
  } else {
    const over = userExperience - opportunityExperienceMax;
    experienceScore = Math.max(60, 100 - over * 5);
  }

  const roleRelevanceScore = targetRoles.some((role: string) =>
    opportunityRequiredSkills.some((skill: string) => skill.toLowerCase().includes(role.toLowerCase()))
  ) ? 80 : 50;

  const locationMatch = calculateLocationMatch(userLocation, opportunityLocation, opportunityWorkArrangement);
  let locationScore = 50;
  if (opportunityWorkArrangement === "REMOTE") locationScore = 100;
  else if (locationMatch === "EXACT") locationScore = 100;
  else if (locationMatch === "SAME_CITY") locationScore = 90;
  else if (locationMatch === "SAME_STATE") locationScore = 70;
  else if (locationMatch === "NEARBY") locationScore = 50;
  else locationScore = 30;

  const educationScore = userEducation ? 80 : 60;

  const overallScore = Math.round(
    requiredSkillsScore * WEIGHTS.requiredSkills +
    preferredSkillsScore * WEIGHTS.preferredSkills +
    experienceScore * WEIGHTS.experience +
    roleRelevanceScore * WEIGHTS.roleRelevance +
    locationScore * WEIGHTS.location +
    educationScore * WEIGHTS.education
  );

  const category = categorizeMatch(overallScore, matchingRequired.length, missingRequired.length, userExperience, opportunityExperienceMin);

  return {
    overallScore,
    requiredSkillsScore,
    preferredSkillsScore,
    experienceScore,
    roleRelevanceScore,
    locationScore,
    educationScore,
    matchingSkills: matchingRequired,
    missingSkills: missingRequired,
    unverifiedSkills: missingPreferred,
    experienceMatch: userExperience >= opportunityExperienceMin && userExperience <= opportunityExperienceMax
      ? "MEETS_REQUIREMENTS"
      : userExperience < opportunityExperienceMin
        ? "BELOW_MINIMUM"
        : "EXCEEDS_REQUIREMENTS",
    locationMatch,
    category,
    explanation: generateExplanation(
      overallScore,
      matchingRequired.length,
      missingRequired.length,
      experienceScore,
      locationMatch
    ),
  };
}

function calculateLocationMatch(userLoc: string, oppLoc: string, workArr: string): "EXACT" | "SAME_CITY" | "SAME_STATE" | "NEARBY" | "DIFFERENT" | "REMOTE" | "UNKNOWN" {
  if (workArr === "REMOTE") return "REMOTE";
  if (!userLoc || !oppLoc) return "UNKNOWN";

  const u = userLoc.toLowerCase();
  const o = oppLoc.toLowerCase();

  if (u === o) return "EXACT";

  const userParts = u.split(/[\s,]+/).filter(Boolean);
  const oppParts = o.split(/[\s,]+/).filter(Boolean);

  const commonCity = userParts.find((p: string) => oppParts.includes(p));
  if (commonCity) return "SAME_CITY";

  const userState = userParts[userParts.length - 1];
  const oppState = oppParts[oppParts.length - 1];
  if (userState && oppState && userState === oppState) return "SAME_STATE";

  // Check for nearby cities (same region/metro area)
  const nearbyCities: Record<string, string[]> = {
    "san francisco": ["oakland", "san jose", "berkeley", "palo alto", "mountain view"],
    "new york": ["brooklyn", "queens", "jersey city", "newark", "hoboken"],
    "los angeles": ["santa monica", "pasadena", "glendale", "burbank", "long beach"],
    "seattle": ["bellevue", "redmond", "kirkland", "renton"],
    "boston": ["cambridge", "somerville", "brookline", "newton"],
    "chicago": ["evanston", "oak park", "cicero", "berwyn"],
    "austin": ["round rock", "cedar park", "pflugerville"],
    "denver": ["aurora", "lakewood", "centennial", "boulder"],
  };

  for (const [city, neighbors] of Object.entries(nearbyCities)) {
    if (userParts.includes(city) && neighbors.some((n) => oppParts.includes(n))) return "NEARBY";
    if (oppParts.includes(city) && neighbors.some((n) => userParts.includes(n))) return "NEARBY";
  }

  return "DIFFERENT";
}

function categorizeMatch(
  score: number,
  matchingRequired: number,
  missingRequired: number,
  userExp: number,
  oppExpMin: number
): "STRONG_SKILL_MATCH" | "ENTRY_LEVEL_RELEVANT" | "INTERNSHIP_OPPORTUNITY" | "SKILLS_DEVELOPMENT" | "CAREER_TRANSITION" | "LOCATION_BASED" {
  if (score >= 85 && missingRequired === 0) return "STRONG_SKILL_MATCH";
  if (score >= 70 && userExp < oppExpMin && oppExpMin <= 2) return "ENTRY_LEVEL_RELEVANT";
  if (score >= 60 && oppExpMin <= 1) return "INTERNSHIP_OPPORTUNITY";
  if (score >= 50 && missingRequired > 0) return "SKILLS_DEVELOPMENT";
  if (score >= 50 && userExp >= 5) return "CAREER_TRANSITION";
  return "LOCATION_BASED";
}

function generateExplanation(
  score: number,
  matchingCount: number,
  missingCount: number,
  expScore: number,
  locMatch: string
): string {
  const parts: string[] = [];

  if (matchingCount > 0) parts.push(`${matchingCount} required skill${matchingCount > 1 ? "s" : ""} matched`);
  if (missingCount > 0) parts.push(`${missingCount} required skill${missingCount > 1 ? "s" : ""} missing`);
  if (expScore >= 90) parts.push("experience level matches well");
  else if (expScore >= 60) parts.push("experience is close to requirements");
  else parts.push("experience gap exists");

  if (locMatch === "REMOTE") parts.push("remote work available");
  else if (locMatch === "EXACT") parts.push("perfect location match");
  else if (locMatch === "SAME_CITY") parts.push("same city");
  else if (locMatch === "SAME_STATE") parts.push("same state");
  else parts.push("location may require relocation");

  const strength = score >= 80 ? "Strong" : score >= 60 ? "Good" : score >= 40 ? "Moderate" : "Weak";
  return `${strength} match (${score}%): ${parts.join(", ")}.`;
}

export const matchScoreVersion = "1.0";