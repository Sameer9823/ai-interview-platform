import "server-only";
import { generateStructured } from "@/lib/ai/samai-service";
import { ResumeRewriteSuggestionSchema, type ResumeRewriteSuggestion } from "../schemas";
import { ExtractedProfileSchema, type ExtractedProfile } from "../schemas";
import { AiServiceError } from "@/lib/ai/errors";

const REWRITE_SYSTEM = `You are an expert resume writer and career coach. Rewrite resume sections to be clearer, more impactful, and tailored to target roles.

Rules:
1. PRESERVE FACTUAL MEANING - never invent experience, skills, metrics, or responsibilities
2. Use placeholders [LIKE THIS] for missing details the user must fill in
3. Flag any assumptions made
4. Keep the original version intact - this is a suggestion only
4. Focus on: action verbs, quantified results, clarity, role-specific keywords`;

const REWRITE_PROMPT = `Rewrite this resume section for a {targetRole} position.

SECTION: {section}
ORIGINAL TEXT:
{originalText}

CONTEXT:
- Target role: {targetRole}
- Resume profile: {profileSummary}

Requirements:
1. More concise and impactful
2. Strong action verbs
3. Quantified results (use [PLACEHOLDERS] for missing numbers)
4. Relevant keywords for {targetRole}
5. ATS-friendly formatting

Return:
- suggestedText: the rewritten version
- rationale: why these changes improve the section
- assumptions: any assumptions made about missing information`;

const BULLET_REWRITE_PROMPT = `Rewrite this resume bullet point to be more impactful.

ORIGINAL BULLET: {originalBullet}
CONTEXT: {context}
TARGET ROLE: {targetRole}

Rules:
- Start with strong action verb
- Include quantified result with [PLACEHOLDER] if missing
- Mention relevant technologies/tools
- Keep factual - do not invent scope or results
- Flag assumptions

Return JSON with: suggestedText, rationale, assumptions`;

export async function rewriteSection(
  section: string,
  originalText: string,
  profile: ExtractedProfile,
  targetRole?: string
): Promise<ResumeRewriteSuggestion> {
  const profileSummary = buildProfileSummary(profile);

  try {
    const result = await generateStructured(ResumeRewriteSuggestionSchema, {
      system: REWRITE_SYSTEM,
      prompt: REWRITE_PROMPT
        .replace("{section}", section)
        .replace("{originalText}", originalText)
        .replace("{targetRole}", targetRole || "Not specified")
        .replace("{profileSummary}", profileSummary),
      temperature: 0.3,
      maxTokens: 2000,
    });
    return result.object as ResumeRewriteSuggestion;
  } catch (e) {
    if (e instanceof AiServiceError && e.code === "NOT_CONFIGURED") {
      throw new Error("AI provider not configured. Cannot rewrite without AI.");
    }
    throw new Error(`Rewrite failed: ${e instanceof Error ? e.message : "Unknown error"}`);
  }
}

export async function rewriteBullet(
  originalBullet: string,
  context: string,
  targetRole?: string
): Promise<ResumeRewriteSuggestion> {
  try {
    const result = await generateStructured(ResumeRewriteSuggestionSchema, {
      system: REWRITE_SYSTEM,
      prompt: BULLET_REWRITE_PROMPT
        .replace("{originalBullet}", originalBullet)
        .replace("{context}", context)
        .replace("{targetRole}", targetRole || "Not specified"),
      temperature: 0.3,
      maxTokens: 1500,
    });
    return result.object as ResumeRewriteSuggestion;
  } catch (e) {
    if (e instanceof AiServiceError && e.code === "NOT_CONFIGURED") {
      throw new Error("AI provider not configured. Cannot rewrite without AI.");
    }
    throw new Error(`Bullet rewrite failed: ${e instanceof Error ? e.message : "Unknown error"}`);
  }
}

function buildProfileSummary(profile: ExtractedProfile): string {
  const parts: string[] = [];

  if (profile.summary) parts.push(`Summary: ${profile.summary}`);
  if ((profile as any).targetRole) parts.push(`Target: ${(profile as any).targetRole}`);
  if (profile.experience?.length) {
    parts.push(`Experience: ${profile.experience.length} roles`);
    const latest = profile.experience[0];
    if (latest) parts.push(`Current: ${latest.title} at ${latest.company}`);
  }
  if (profile.technicalSkills?.length) {
    parts.push(`Tech skills: ${profile.technicalSkills.slice(0, 10).join(", ")}`);
  }

  return parts.join(" | ");
}

export function compareVersions(original: string, suggested: string): {
  additions: string[];
  deletions: string[];
  similarity: number;
} {
  const origWords = original.toLowerCase().split(/\s+/).filter(Boolean);
  const suggWords = suggested.toLowerCase().split(/\s+/).filter(Boolean);

  const origSet = new Set(origWords);
  const suggSet = new Set(suggWords);

  const additions = suggWords.filter(w => !origSet.has(w));
  const deletions = origWords.filter(w => !suggSet.has(w));

  const intersection = origWords.filter(w => suggSet.has(w)).length;
  const union = new Set([...origWords, ...suggWords]).size;
  const similarity = union > 0 ? intersection / union : 1;

  return {
    additions: [...new Set(additions)],
    deletions: [...new Set(deletions)],
    similarity,
  };
}

export function validateRewrite(original: string, suggested: string): {
  valid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  // Check for potential hallucinations
  const origNumbers = (original.match(/\d+/g) || []) as string[];
  const suggNumbers = (suggested.match(/\d+/g) || []) as string[];

  for (const num of suggNumbers) {
    if (!origNumbers.includes(num)) {
      warnings.push(`New number detected: ${num} - verify this is accurate or a placeholder`);
    }
  }

  // Check for new proper nouns (company names, technologies)
  const origProper = (original.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || []) as string[];
  const suggProper = (suggested.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || []) as string[];

  for (const word of suggProper) {
    if (!origProper.includes(word) && !["I", "The", "This", "That", "And", "But", "Or", "For", "With", "From", "To", "In", "On", "At", "By", "As", "Is", "Was", "Has", "Had", "Will", "Would", "Could", "Should", "Can", "May", "Must", "Shall", "We", "You", "They", "He", "She", "It", "My", "Your", "Our", "Their", "His", "Her", "Its"].includes(word)) {
      warnings.push(`New proper noun: ${word} - verify this is not invented`);
    }
  }

  return {
    valid: warnings.length === 0,
    warnings,
  };
}