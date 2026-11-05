import "server-only";
import { generateStructured } from "@/lib/ai/samai-service";
import { JobMatchSchema, JobDescriptionParsedSchema, type JobMatch, type JobDescriptionParsed } from "../schemas";
import { ExtractedProfileSchema, type ExtractedProfile } from "../schemas";
import { AiServiceError } from "@/lib/ai/errors";

const JD_PARSING_SYSTEM = `You are an expert job description parser. Extract structured requirements from the job description text.`;

const JD_PARSING_PROMPT = `Parse this job description and extract structured requirements.

Job description text:
{jdText}

Extract:
- Title, company, location, employment type, seniority level
- Required skills with category and importance (REQUIRED/PREFERRED/NICE_TO_HAVE)
- Preferred skills
- Key responsibilities
- Requirements (years of experience, education, certifications)
- Nice-to-have qualifications
- Benefits mentioned
- Keywords for ATS matching

Return JSON matching the schema.`;

const MATCHING_SYSTEM = `You are an expert career coach and ATS analyst. Compare the resume against the job description requirements.

Be honest and specific. Do not exaggerate matches. Clearly identify gaps.
A missing skill in the resume does NOT mean the candidate lacks it - it means it's not documented.`;

const MATCHING_PROMPT = `Compare this resume against the job description.

RESUME PROFILE:
{profileJson}

JOB DESCRIPTION:
{jdParsedJson}

Target role context: {targetRole}

Analyze the match and return:
1. Overall match percentage (0-100)
2. Matching skills with evidence from resume
3. Missing skills (required/preferred from JD not in resume)
4. Partial matches (skill mentioned but weak evidence)
5. Experience alignment
6. Education alignment
7. Actionable recommendations for the candidate

Be specific. Cite exact resume text as evidence for matches.`;

export async function parseJobDescription(jdText: string): Promise<JobDescriptionParsed> {
  if (jdText.length > 20000) {
    throw new Error("Job description too long (max 20,000 characters)");
  }

  try {
    const result = await generateStructured(JobDescriptionParsedSchema, {
      system: JD_PARSING_SYSTEM,
      prompt: JD_PARSING_PROMPT.replace("{jdText}", jdText),
      temperature: 0.1,
      maxTokens: 4000,
    });
    return result.object as JobDescriptionParsed;
  } catch (e) {
    if (e instanceof AiServiceError && e.code === "NOT_CONFIGURED") {
      throw new Error("AI provider not configured. Cannot parse job description without AI.");
    }
    throw new Error(`Job description parsing failed: ${e instanceof Error ? e.message : "Unknown error"}`);
  }
}

export async function matchResumeToJob(
  profile: ExtractedProfile,
  jdParsed: JobDescriptionParsed,
  targetRole?: string
): Promise<JobMatch> {
  const profileJson = JSON.stringify(profile, null, 2);
  const jdParsedJson = JSON.stringify(jdParsed, null, 2);

  try {
    const result = await generateStructured(JobMatchSchema, {
      system: MATCHING_SYSTEM,
      prompt: MATCHING_PROMPT
        .replace("{profileJson}", JSON.stringify(profile, null, 2))
        .replace("{jdParsedJson}", JSON.stringify(jdParsed, null, 2))
        .replace("{targetRole}", targetRole || "Not specified"),
      temperature: 0.2,
      maxTokens: 6000,
    });
    return result.object as JobMatch;
  } catch (e) {
    if (e instanceof AiServiceError && e.code === "NOT_CONFIGURED") {
      throw new Error("AI provider not configured. Cannot match resume without AI.");
    }
    throw new Error(`Job matching failed: ${e instanceof Error ? e.message : "Unknown error"}`);
  }
}

export function buildSkillGapAnalysis(
  profile: ExtractedProfile,
  jdParsed: JobDescriptionParsed,
  match: JobMatch
): Array<{
  skill: string;
  category: string;
  classification: "DEMONSTRATED" | "SELF_REPORTED" | "MENTIONED_NOT_DEMONSTRATED" | "NOT_FOUND" | "NEEDS_ASSESSMENT";
  resumeEvidence: string[];
  confidence: number;
  suggestedAction: string;
}> {
  const gaps: Array<{
    skill: string;
    category: string;
    classification: "DEMONSTRATED" | "SELF_REPORTED" | "MENTIONED_NOT_DEMONSTRATED" | "NOT_FOUND" | "NEEDS_ASSESSMENT";
    resumeEvidence: string[];
    confidence: number;
    suggestedAction: string;
  }> = [];

  const resumeSkills = new Set([
    ...(profile.technicalSkills || []),
    ...(profile.softSkills || []),
  ].map(s => s.toLowerCase()));

  // Check required skills
  for (const req of jdParsed.requiredSkills) {
    const skillLower = req.skill.toLowerCase();
    const inResume = resumeSkills.has(skillLower);
    const matchEvidence = match.matchingSkills.find(m => m.skill.toLowerCase() === skillLower);

    if (inResume && matchEvidence) {
      gaps.push({
        skill: req.skill,
        category: req.category || "Technical",
        classification: "DEMONSTRATED",
        resumeEvidence: [matchEvidence.resumeEvidence],
        confidence: matchEvidence.confidence,
        suggestedAction: "Highlight this skill prominently in your resume summary and experience bullets.",
      });
    } else if (inResume) {
      gaps.push({
        skill: req.skill,
        category: req.category || "Technical",
        classification: "MENTIONED_NOT_DEMONSTRATED",
        resumeEvidence: [`Mentioned in skills section`],
        confidence: 0.5,
        suggestedAction: "Add concrete examples of using this skill in your experience bullets with quantified results.",
      });
    } else {
      gaps.push({
        skill: req.skill,
        category: req.category || "Technical",
        classification: "NOT_FOUND",
        resumeEvidence: [],
        confidence: 0.9,
        suggestedAction: `This is a REQUIRED skill for the role. If you have experience, add it to your skills section and experience bullets. If not, consider upskilling.`,
      });
    }
  }

  // Check preferred skills
  for (const pref of jdParsed.preferredSkills) {
    const skillLower = pref.skill.toLowerCase();
    const inResume = resumeSkills.has(skillLower);
    const matchEvidence = match.matchingSkills.find(m => m.skill.toLowerCase() === skillLower);

    if (inResume && matchEvidence) {
      gaps.push({
        skill: pref.skill,
        category: pref.category || "Technical",
        classification: "DEMONSTRATED",
        resumeEvidence: [matchEvidence.resumeEvidence],
        confidence: matchEvidence.confidence,
        suggestedAction: "Good - this preferred skill is demonstrated. Ensure it's visible in your top skills.",
      });
    } else if (inResume) {
      gaps.push({
        skill: pref.skill,
        category: pref.category || "Technical",
        classification: "MENTIONED_NOT_DEMONSTRATED",
        resumeEvidence: [`Mentioned in skills section`],
        confidence: 0.5,
        suggestedAction: "Add project or experience examples demonstrating this preferred skill.",
      });
    }
    // Don't flag missing preferred skills as gaps - they're optional
  }

  // Check partial matches from matching result
  for (const partial of match.partialMatches) {
    if (!gaps.some(g => g.skill.toLowerCase() === partial.skill.toLowerCase())) {
      gaps.push({
        skill: partial.skill,
        category: "Technical",
        classification: "MENTIONED_NOT_DEMONSTRATED",
        resumeEvidence: [partial.resumeEvidence],
        confidence: partial.confidence,
        suggestedAction: partial.gap,
      });
    }
  }

  return gaps;
}