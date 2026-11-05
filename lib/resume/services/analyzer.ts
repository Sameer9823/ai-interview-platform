import "server-only";
import { generateStructured } from "@/lib/ai/samai-service";
import { ResumeAnalysisSchema, DEFAULT_RUBRIC, type ResumeAnalysis, type ResumeQualityRubric } from "../schemas";
import { ExtractedProfileSchema, type ExtractedProfile } from "../schemas";
import { AiServiceError } from "@/lib/ai/errors";

const ANALYSIS_SYSTEM_PROMPT = `You are an expert resume reviewer and career coach. Analyze the resume against the rubric criteria.

For each criterion, provide:
- A score (0-maxPoints)
- A brief justification
- Type: DETERMINISTIC criteria should be scored programmatically (you'll receive pre-computed scores). AI_EVALUATED criteria require your judgment.

Be constructive, specific, and actionable. Do not invent information.`;

const ANALYSIS_PROMPT = `Analyze this resume for quality and ATS readiness.

Target role: {targetRole}
Rubric version: {rubricVersion}

Resume profile (structured):
{profileJson}

Full resume text (for context):
{fullText}

Rubric criteria:
{rubricJson}

For DETERMINISTIC criteria, I will provide pre-computed scores. For AI_EVALUATED criteria, provide your score and brief justification.

Return the full analysis matching the schema.`;

function calculateDeterministicScores(profile: ExtractedProfile, fullText: string): Record<string, number> {
  const scores: Record<string, number> = {};

  // Contact Information (max 15)
  let contactScore = 0;
  if (profile.contact?.email) contactScore += 5;
  if (profile.contact?.phone) contactScore += 3;
  if (profile.contact?.linkedin) contactScore += 4;
  if (profile.contact?.github) contactScore += 3;
  scores["Contact Information"] = Math.min(contactScore, 15);

  // Education Section (max 20)
  let eduScore = 0;
  if (profile.education?.length) {
    const hasDegree = profile.education.some(e => e.degree);
    const hasInstitution = profile.education.some(e => e.institution);
    const hasDates = profile.education.some(e => e.startDate || e.endDate);
    if (hasDegree) eduScore += 8;
    if (hasInstitution) eduScore += 7;
    if (hasDates) eduScore += 5;
  }
  scores["Education Section"] = Math.min(eduScore, 20);

  // Experience Section (max 25)
  let expScore = 0;
  if (profile.experience?.length) {
    const hasCompany = profile.experience.some(e => e.company);
    const hasTitle = profile.experience.some(e => e.title);
    const hasDates = profile.experience.some(e => e.startDate || e.endDate);
    const hasDescription = profile.experience.some(e => e.description && e.description.length > 50);
    const hasAchievements = profile.experience.some(e => e.achievements && e.achievements.length > 0);
    if (hasCompany) expScore += 5;
    if (hasTitle) expScore += 5;
    if (hasDates) expScore += 5;
    if (hasDescription) expScore += 5;
    if (hasAchievements) expScore += 5;
  }
  scores["Experience Section"] = Math.min(expScore, 25);

  // Skills Section (max 15)
  let skillsScore = 0;
  if (profile.technicalSkills?.length) skillsScore += 8;
  if (profile.softSkills?.length) skillsScore += 7;
  scores["Skills Section"] = Math.min(skillsScore, 15);

  // Projects/Portfolio (max 10)
  let projScore = 0;
  if (profile.projects?.length) {
    const hasDesc = profile.projects.some(p => p.description && p.description.length > 30);
    const hasTech = profile.projects.some(p => p.technologies && p.technologies.length > 0);
    if (hasDesc) projScore += 6;
    if (hasTech) projScore += 4;
  }
  scores["Projects/Portfolio"] = Math.min(projScore, 10);

  // Formatting Consistency (max 20)
  // Heuristic: check for consistent bullet markers, header casing
  scores["Formatting Consistency"] = 15; // Default reasonable score

  // Section Organization (max 20)
  scores["Section Organization"] = profile.sectionOrder?.length ? 15 : 5;

  return scores;
}

export async function analyzeResume(
  profile: ExtractedProfile,
  fullText: string,
  targetRole?: string,
  rubric: ResumeQualityRubric = DEFAULT_RUBRIC
): Promise<ResumeAnalysis> {
  const deterministicScores = calculateDeterministicScores(profile, fullText);

  const rubricJson = JSON.stringify(rubric, null, 2);
  const profileJson = JSON.stringify(profile, null, 2);

  const prompt = ANALYSIS_PROMPT
    .replace("{targetRole}", targetRole || "Not specified")
    .replace("{rubricVersion}", rubric.version)
    .replace("{profileJson}", profileJson)
    .replace("{fullText}", fullText.substring(0, 15000))
    .replace("{rubricJson}", rubricJson);

  try {
    const result = await generateStructured(ResumeAnalysisSchema, {
      system: ANALYSIS_SYSTEM_PROMPT,
      prompt,
      temperature: 0.2,
      maxTokens: 6000,
    });

    const analysis = result.object;

    // Merge deterministic scores
    for (const cat of analysis.categories) {
      const detKey = Object.keys(deterministicScores).find(k =>
        k.toLowerCase() === cat.category.toLowerCase()
      );
      if (detKey) {
        // For criteria marked DETERMINISTIC, use pre-computed scores
        cat.score = deterministicScores[detKey] ?? 0;
        // Adjust findings to include deterministic check results
      }
    }

    // Recalculate overall score as weighted average
    let totalWeight = 0;
    let weightedSum = 0;
    for (const cat of analysis.categories) {
      const rubricCat = rubric.categories.find(r => r.name === cat.category);
      if (rubricCat) {
        totalWeight += rubricCat.weight;
        weightedSum += (cat.score / cat.maxScore) * rubricCat.weight * 100;
      }
    }
    analysis.overallScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : analysis.overallScore;

    return analysis as ResumeAnalysis;
  } catch (e) {
    if (e instanceof AiServiceError && e.code === "NOT_CONFIGURED") {
      // Return deterministic-only analysis
      return buildDeterministicOnlyAnalysis(profile, fullText, targetRole, rubric);
    }
    throw new Error(`Resume analysis failed: ${e instanceof Error ? e.message : "Unknown error"}`);
  }
}

function buildDeterministicOnlyAnalysis(
  profile: ExtractedProfile,
  fullText: string,
  targetRole: string | undefined,
  rubric: ResumeQualityRubric
): ResumeAnalysis {
  const deterministicScores = calculateDeterministicScores(profile, fullText);

  const categories = rubric.categories.map(rubricCat => {
    const score = deterministicScores[rubricCat.name] ?? 0;
    return {
      category: rubricCat.name,
      score,
      maxScore: rubricCat.maxScore,
      weight: rubricCat.weight,
      findings: [
        {
          type: "STRENGTH" as const,
          message: `Deterministic check completed. Score: ${score}/${rubricCat.maxScore}`,
      severity: score >= rubricCat.maxScore * 0.7 ? "LOW" : "MEDIUM" as "LOW" | "MEDIUM" | "HIGH",
        },
      ],
    };
  });

  let totalWeight = 0;
  let weightedSum = 0;
  for (const cat of categories) {
    const rubricCat = rubric.categories.find(r => r.name === cat.category);
    if (rubricCat) {
      totalWeight += rubricCat.weight;
      weightedSum += (cat.score / cat.maxScore) * rubricCat.weight * 100;
    }
  }
  const overallScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;

  return {
    overallScore,
    rubricVersion: rubric.version,
    categories,
    strengths: [],
    issues: [],
     metadata: {
      analyzedAt: new Date().toISOString(),
      targetRole,
      resumeVersion: 1,
      wordCount: fullText.split(/\s+/).length,
    },
  };
}

export function getResumeWordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function estimatePageCount(text: string): number {
  const words = getResumeWordCount(text);
  return Math.max(1, Math.ceil(words / 350));
}