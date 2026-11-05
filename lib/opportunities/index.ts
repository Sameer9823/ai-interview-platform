import "server-only";
import { db } from "@/lib/db/client";
import type { Prisma, WorkArrangement, OpportunityType, JobSearchNotificationType, RecommendationCategory } from "@prisma/client";
import { calculateMatchScore } from "./matching";
import type { MatchScoreInput } from "./matching";
import { generateStructured } from "@/lib/ai/samai-service";
import { jobDescriptionAnalysisSchema, type JobDescriptionAnalysis } from "@/lib/ai/schemas";
import { awardXP } from "@/lib/gamification";

export interface OpportunityFilters {
  search?: string;
  type?: string;
  workArrangement?: string;
  location?: string;
  experienceMin?: number;
  experienceMax?: number;
  salaryMin?: number;
  salaryMax?: number;
  skills?: string[];
  companyId?: string;
  isRemote?: boolean;
  isEntryLevel?: boolean;
  status?: string;
  cursor?: string;
  limit?: number;
  sortBy?: "latest" | "deadline" | "salary" | "match";
}

export interface OpportunityWithRelations {
  id: string;
  title: string;
  slug: string;
  companyId: string;
  company: {
    id: string;
    name: string;
    logoUrl: string;
    industry: string;
  };
  type: string;
  employmentType: string;
  workArrangement: string;
  location: string;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  salaryPeriod: string;
  experienceMin: number | null;
  experienceMax: number | null;
  educationRequirement: string | null;
  description: string;
  responsibilities: string | null;
  requiredSkills: string[];
  preferredSkills: string[];
  benefits: string | null;
  applicationUrl: string;
  applicationDeadline: Date | null;
  postedDate: Date;
  lastVerifiedDate: Date | null;
  status: string;
  sourceId: string | null;
  sourceReference: string | null;
  isRemote: boolean;
  isEntryLevel: boolean;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    savedBy: number;
    applications: number;
  };
  userMatch?: {
    overallScore: number;
    matchingSkills: string[];
    missingSkills: string[];
    category: string;
  } | null;
  isSaved?: boolean;
}

export async function getOpportunities(userId: string, filters: OpportunityFilters) {
  const {
    search,
    type,
    workArrangement,
    location,
    experienceMin,
    experienceMax,
    salaryMin,
    salaryMax,
    skills,
    companyId,
    isRemote,
    isEntryLevel,
    status = "ACTIVE",
    cursor,
    limit = 20,
    sortBy = "latest",
  } = filters;

  const where: Prisma.CareerOpportunityWhereInput = {
    status: status as any,
  };

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { company: { name: { contains: search, mode: "insensitive" } } },
      { requiredSkills: { hasSome: [search] } },
    ];
  }

  if (type) where.type = type as any;
  if (workArrangement) where.workArrangement = workArrangement as any;
  if (location) where.location = { contains: location, mode: "insensitive" };
  if (experienceMin !== undefined) where.experienceMin = { gte: experienceMin };
  if (experienceMax !== undefined) where.experienceMax = { lte: experienceMax };
  if (salaryMin !== undefined) where.salaryMin = { gte: salaryMin };
  if (salaryMax !== undefined) where.salaryMax = { lte: salaryMax };
  if (companyId) where.companyId = companyId;
  if (isRemote !== undefined) where.isRemote = isRemote;
  if (isEntryLevel !== undefined) where.isEntryLevel = isEntryLevel;
  if (skills?.length) where.requiredSkills = { hasEvery: skills };

  const cursorCondition: Prisma.CareerOpportunityWhereInput = {};
  if (cursor) {
    const cursorOpp = await db.careerOpportunity.findUnique({
      where: { id: cursor },
      select: { createdAt: true, postedDate: true },
    });
    if (cursorOpp) {
      if (sortBy === "latest") {
        cursorCondition.createdAt = { lt: cursorOpp.createdAt };
      } else if (sortBy === "deadline") {
        cursorCondition.postedDate = { lt: cursorOpp.postedDate };
      }
    }
  }

  let orderBy: Prisma.CareerOpportunityOrderByWithRelationInput = { postedDate: "desc" };
  if (sortBy === "deadline") orderBy = { applicationDeadline: "asc" };
  else if (sortBy === "salary") orderBy = { salaryMax: "desc" };

  const [opportunities, totalCount] = await Promise.all([
    db.careerOpportunity.findMany({
      where: { ...where, ...cursorCondition },
      orderBy,
      take: limit + 1,
      include: {
        company: { select: { id: true, name: true, logoUrl: true, industry: true } },
        _count: { select: { savedBy: true, applications: true } },
      },
    }),
    db.careerOpportunity.count({ where }),
  ]);

  let hasNextPage = false;
  if (opportunities.length > limit) {
    hasNextPage = true;
    opportunities.pop();
  }

  const opportunityIds = opportunities.map((o) => o.id);

  const [savedOpps, userMatches] = await Promise.all([
    db.savedOpportunity.findMany({
      where: { userId, opportunityId: { in: opportunityIds } },
      select: { opportunityId: true },
    }),
    db.opportunityMatch.findMany({
      where: { userId, opportunityId: { in: opportunityIds } },
      select: {
        opportunityId: true,
        overallScore: true,
        matchingSkills: true,
        missingSkills: true,
        category: true,
      },
    }),
  ]);

  const savedSet = new Set(savedOpps.map((s) => s.opportunityId));
  const matchMap = new Map(userMatches.map((m) => [m.opportunityId, m]));

  const enrichedOpportunities: OpportunityWithRelations[] = opportunities.map((opp) => ({
    ...opp,
    isSaved: savedSet.has(opp.id),
    userMatch: matchMap.get(opp.id)
      ? {
          overallScore: matchMap.get(opp.id)!.overallScore,
          matchingSkills: matchMap.get(opp.id)!.matchingSkills,
          missingSkills: matchMap.get(opp.id)!.missingSkills,
          category: matchMap.get(opp.id)!.category,
        }
      : null,
  }));

  return {
    opportunities: enrichedOpportunities,
    hasNextPage,
    nextCursor: opportunities.length > 0 ? opportunities[opportunities.length - 1]!.id : null,
    totalCount,
  };
}

export async function getOpportunityById(opportunityId: string, userId?: string) {
  const opportunity = await db.careerOpportunity.findUnique({
    where: { id: opportunityId },
    include: {
      company: {
        select: {
          id: true,
          name: true,
          logoUrl: true,
          industry: true,
          description: true,
          headquarters: true,
          careersUrl: true,
          website: true,
        },
      },
      source: { select: { id: true, name: true, url: true, type: true } },
      _count: { select: { savedBy: true, applications: true } },
    },
  });

  if (!opportunity) return null;

  let isSaved = false;
  let userMatch = null;

  if (userId) {
    const [saved, match] = await Promise.all([
      db.savedOpportunity.findUnique({
        where: { userId_opportunityId: { userId, opportunityId } },
        select: { createdAt: true },
      }),
      db.opportunityMatch.findUnique({
        where: { userId_opportunityId: { userId, opportunityId } },
      }),
    ]);

    isSaved = !!saved;
    if (match) {
      userMatch = {
        overallScore: match.overallScore,
        requiredSkillsScore: match.requiredSkillsScore,
        preferredSkillsScore: match.preferredSkillsScore,
        experienceScore: match.experienceScore,
        roleRelevanceScore: match.roleRelevanceScore,
        locationScore: match.locationScore,
        educationScore: match.educationScore,
        matchingSkills: match.matchingSkills,
        missingSkills: match.missingSkills,
        unverifiedSkills: match.unverifiedSkills,
        experienceMatch: match.experienceMatch,
        locationMatch: match.locationMatch,
        category: match.category,
        explanation: match.explanation,
      };
    }
  }

  return {
    ...opportunity,
    isSaved,
    userMatch,
  };
}

export async function incrementViewCount(opportunityId: string) {
  await db.careerOpportunity.update({
    where: { id: opportunityId },
    data: { viewCount: { increment: 1 } },
  });
}

export async function saveOpportunity(userId: string, opportunityId: string) {
  const opportunity = await db.careerOpportunity.findUnique({
    where: { id: opportunityId },
    select: { id: true },
  });
  if (!opportunity) throw new Error("Opportunity not found");

  const saved = await db.savedOpportunity.upsert({
    where: { userId_opportunityId: { userId, opportunityId } },
    create: { userId, opportunityId },
    update: {},
  });

  return { saved: true, savedAt: saved.createdAt };
}

export async function unsaveOpportunity(userId: string, opportunityId: string) {
  await db.savedOpportunity.deleteMany({
    where: { userId, opportunityId },
  });
  return { saved: false };
}

export async function dismissOpportunity(userId: string, opportunityId: string, reason?: string) {
  const opportunity = await db.careerOpportunity.findUnique({
    where: { id: opportunityId },
    select: { id: true },
  });
  if (!opportunity) throw new Error("Opportunity not found");

  await db.dismissedOpportunity.upsert({
    where: { userId_opportunityId: { userId, opportunityId } },
    create: { userId, opportunityId, reason },
    update: { reason },
  });

  await db.opportunityMatch.updateMany({
    where: { userId, opportunityId },
    data: { dismissedAt: new Date() },
  });

  return { dismissed: true };
}

export async function getSavedOpportunities(userId: string, cursor?: string, limit: number = 20) {
  const where: Prisma.SavedOpportunityWhereInput = { userId };
  if (cursor) {
    const cursorSaved = await db.savedOpportunity.findUnique({
      where: { userId_opportunityId: { userId, opportunityId: cursor } },
      select: { createdAt: true },
    });
    if (cursorSaved) where.createdAt = { lt: cursorSaved.createdAt };
  }

  const saved = await db.savedOpportunity.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    include: {
      opportunity: {
        include: {
          company: { select: { id: true, name: true, logoUrl: true, industry: true } },
        },
      },
    },
  });

  let hasNextPage = false;
  if (saved.length > limit) {
    hasNextPage = true;
    saved.pop();
  }

  return {
    opportunities: saved.map((s) => ({ ...s.opportunity, isSaved: true })),
    hasNextPage,
    nextCursor: saved.length > 0 ? saved[saved.length - 1]!.opportunityId : null,
  };
}

export async function getJobSearchPreferences(userId: string) {
  return db.jobSearchPreference.findUnique({
    where: { userId },
  });
}

export async function upsertJobSearchPreferences(userId: string, data: Partial<{
  targetRoles: string[];
  preferredIndustries: string[];
  preferredCompanies: string[];
  preferredLocations: string[];
  workArrangements: WorkArrangement[];
  employmentTypes: string[];
  experienceLevel: string;
  salaryMin: number;
  salaryMax: number;
  salaryCurrency: string;
  preferredSkills: string[];
  opportunityTypes: OpportunityType[];
  notificationTypes: JobSearchNotificationType[];
  isPaused: boolean;
}>) {
  const defaults = {
    targetRoles: [] as string[],
    preferredIndustries: [] as string[],
    preferredCompanies: [] as string[],
    preferredLocations: [] as string[],
    workArrangements: [] as WorkArrangement[],
    employmentTypes: [] as string[],
    experienceLevel: "",
    salaryMin: 0,
    salaryMax: 0,
    salaryCurrency: "USD",
    preferredSkills: [] as string[],
    opportunityTypes: [] as OpportunityType[],
    notificationTypes: [] as JobSearchNotificationType[],
    isPaused: false,
  };

  return db.jobSearchPreference.upsert({
    where: { userId },
    create: { userId, ...defaults, ...data },
    update: data,
  });
}

export async function generateOpportunityMatches(userId: string, limit: number = 50) {
  const preferences = await getJobSearchPreferences(userId);
  if (!preferences || preferences.isPaused) return { matches: 0 };

  const profile = await db.userProfile.findUnique({ where: { userId } });
  const resumeVersions = await db.resumeVersion.findMany({
    where: { resume: { userId }, isActive: true },
    take: 1,
    include: { extractedProfile: true },
  });

  const activeResume = resumeVersions[0]?.extractedProfile?.profileJson as any;

  const where: Prisma.CareerOpportunityWhereInput = {
    status: "ACTIVE",
  };

  if (preferences.opportunityTypes?.length) {
    where.type = { in: preferences.opportunityTypes as any };
  }
  if (preferences.workArrangements?.length) {
    where.workArrangement = { in: preferences.workArrangements as any };
  }
  if (preferences.preferredLocations?.length) {
    where.OR = preferences.preferredLocations.map((loc) => ({ location: { contains: loc, mode: "insensitive" } }));
  }
  if (preferences.experienceLevel) {
    const expMap: Record<string, { min: number; max: number }> = {
      BEGINNER: { min: 0, max: 2 },
      INTERMEDIATE: { min: 2, max: 5 },
      ADVANCED: { min: 5, max: 99 },
    };
    const range = expMap[preferences.experienceLevel];
    if (range) {
      where.experienceMin = { lte: range.max };
      where.experienceMax = { gte: range.min };
    }
  }

  const opportunities = await db.careerOpportunity.findMany({
    where,
    take: limit,
    include: { company: { select: { id: true, name: true, industry: true } } },
  });

  if (opportunities.length === 0) return { matches: 0 };

  const existingMatches = await db.opportunityMatch.findMany({
    where: { userId, opportunityId: { in: opportunities.map((o) => o.id) } },
    select: { opportunityId: true },
  });
  const existingSet = new Set(existingMatches.map((m) => m.opportunityId));

  const newOpportunities = opportunities.filter((o) => !existingSet.has(o.id));
  if (newOpportunities.length === 0) return { matches: 0 };

  let matchesCreated = 0;
  for (const opp of newOpportunities) {
    const matchInput: MatchScoreInput = {
      userSkills: [
        ...(profile?.skillsToImprove ?? []),
        ...(profile?.primaryProgrammingLanguage ? [profile.primaryProgrammingLanguage] : []),
      ],
      userExperience: profile?.yearsOfExperience ?? 0,
      userEducation: profile?.educationLevel ?? null,
      userLocation: "unknown",
      opportunityRequiredSkills: opp.requiredSkills,
      opportunityPreferredSkills: opp.preferredSkills,
      opportunityExperienceMin: opp.experienceMin ?? 0,
      opportunityExperienceMax: opp.experienceMax ?? 99,
      opportunityLocation: opp.location,
      opportunityWorkArrangement: opp.workArrangement,
      opportunityType: opp.type,
      targetRoles: preferences.targetRoles,
      preferredIndustries: preferences.preferredIndustries,
    };

    const matchResult = calculateMatchScore(matchInput);

    await db.opportunityMatch.create({
      data: {
        userId,
        opportunityId: opp.id,
        overallScore: matchResult.overallScore,
        requiredSkillsScore: matchResult.requiredSkillsScore,
        preferredSkillsScore: matchResult.preferredSkillsScore,
        experienceScore: matchResult.experienceScore,
        roleRelevanceScore: matchResult.roleRelevanceScore,
        locationScore: matchResult.locationScore,
        educationScore: matchResult.educationScore,
        matchingSkills: matchResult.matchingSkills,
        missingSkills: matchResult.missingSkills,
        unverifiedSkills: matchResult.unverifiedSkills,
        experienceMatch: matchResult.experienceMatch,
        locationMatch: matchResult.locationMatch,
        category: matchResult.category as RecommendationCategory,
        explanation: matchResult.explanation,
      },
    });
    matchesCreated++;
  }

  return { matches: matchesCreated };
}

export async function getRecommendedOpportunities(userId: string, limit: number = 10) {
  const matches = await db.opportunityMatch.findMany({
    where: { userId, dismissedAt: null },
    orderBy: { overallScore: "desc" },
    take: limit,
    include: {
      opportunity: {
        include: {
          company: { select: { id: true, name: true, logoUrl: true, industry: true } },
        },
      },
    },
  });

  return matches.map((m) => ({
    ...m.opportunity,
    matchScore: m.overallScore,
    matchingSkills: m.matchingSkills,
    missingSkills: m.missingSkills,
    category: m.category,
    explanation: m.explanation,
  }));
}

interface JobDescriptionAnalysisInput {
  requiredSkills: string[];
  preferredSkills: string[];
  experienceRequirements: string | null;
  educationRequirements: string | null;
  responsibilities: string[];
  technicalKeywords: string[];
  roleExpectations: string[];
  interviewTopics: string[];
  overallMatch: number | null;
  matchingSkills: string[];
  missingEvidence: string[];
  unverifiedSkills: string[];
  experienceAlignment: string | null;
  resumeImprovements: string | null;
  preparationRecommendations: string | null;
}

export async function analyzeJobDescription(
  userId: string,
  rawText: string,
  resumeVersionId?: string,
  jobDescriptionId?: string
) {
  const resumeVersion = resumeVersionId
    ? await db.resumeVersion.findUnique({
        where: { id: resumeVersionId },
        include: { extractedProfile: true },
      })
    : null;

  const prompt = `Analyze this job description and extract structured information:

Job Description:
${rawText}

${resumeVersion?.extractedProfile?.profileJson
  ? `User's Resume Profile:
${JSON.stringify(resumeVersion.extractedProfile.profileJson, null, 2)}`
  : ""
}

Extract and return a JSON object with the following structure. Be precise and only extract information explicitly mentioned in the job description.`;

  try {
    const result = await generateStructured(jobDescriptionAnalysisSchema, {
      system: "You are an expert job description analyzer. Extract structured data from job postings.",
      prompt,
      temperature: 0.1,
      maxTokens: 4000,
    });

    const analysis = result.object as JobDescriptionAnalysis;
    const dbInput: JobDescriptionAnalysisInput = {
      requiredSkills: analysis.requiredSkills ?? [],
      preferredSkills: analysis.preferredSkills ?? [],
      experienceRequirements: analysis.experienceRequirements ?? null,
      educationRequirements: analysis.educationRequirements ?? null,
      responsibilities: analysis.responsibilities ?? [],
      technicalKeywords: analysis.technicalKeywords ?? [],
      roleExpectations: analysis.roleExpectations ?? [],
      interviewTopics: analysis.interviewTopics ?? [],
      overallMatch: analysis.overallMatch ?? null,
      matchingSkills: analysis.matchingSkills ?? [],
      missingEvidence: analysis.missingEvidence ?? [],
      unverifiedSkills: analysis.unverifiedSkills ?? [],
      experienceAlignment: analysis.experienceAlignment ?? null,
      resumeImprovements: analysis.resumeImprovements ?? null,
      preparationRecommendations: analysis.preparationRecommendations ?? null,
    };

    const dbAnalysis = await db.jobDescriptionAnalysis.create({
      data: {
        userId,
        resumeVersionId,
        jobDescriptionId,
        rawText,
        extractedJson: analysis,
        ...dbInput,
      },
    });

    if (dbInput.requiredSkills.length) {
      await db.jobSkillRequirement.createMany({
        data: dbInput.requiredSkills.map((skill: string) => ({
          analysisId: dbAnalysis.id,
          skill,
          category: "REQUIRED",
          isRequired: true,
        })),
      });
    }
    if (dbInput.preferredSkills.length) {
      await db.jobSkillRequirement.createMany({
        data: dbInput.preferredSkills.map((skill: string) => ({
          analysisId: dbAnalysis.id,
          skill,
          category: "PREFERRED",
          isRequired: false,
        })),
      });
    }

    await awardXP(userId, "JOB_MATCH_COMPLETED", dbAnalysis.id, "job_description_analysis");

    return dbAnalysis;
  } catch (error) {
    console.error("Job description analysis failed:", error);
    throw new Error("Failed to analyze job description");
  }
}

export async function getJobDescriptionAnalyses(userId: string, limit: number = 20) {
  return db.jobDescriptionAnalysis.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      resumeVersion: { select: { id: true, versionNumber: true, targetRole: true } },
      jobDescription: { select: { id: true, title: true, company: true } },
    },
  });
}

export async function getJobDescriptionAnalysisById(analysisId: string, userId: string) {
  return db.jobDescriptionAnalysis.findFirst({
    where: { id: analysisId, userId },
    include: {
      skillRequirements: true,
      resumeVersion: { select: { id: true, versionNumber: true, targetRole: true } },
      jobDescription: { select: { id: true, title: true, company: true } },
    },
  });
}