import "server-only";
import { generateStructured } from "@/lib/ai/samai-service";
import { ExtractedProfileSchema, type ExtractedProfile } from "./schemas";
import { AiServiceError } from "@/lib/ai/errors";

const EXTRACTION_PROMPT = `You are an expert resume parser. Extract structured information from the resume text below.

Return a JSON object matching the provided schema. Follow these rules:
1. Only include information explicitly stated in the resume. Do not infer or invent.
2. If a field is not present, omit it or set to null.
3. Preserve dates exactly as written (e.g., "Jan 2020 - Present", "2018-2022").
4. For skills, extract both technical and soft skills mentioned.
5. For experience, capture company, title, dates, location, and description/achievements.
6. For education, capture institution, degree, field, dates, honors.
7. Identify section ordering as they appear in the resume.
8. Note any extraction issues (scanned PDF, missing sections, unclear dates).

Resume text:
{resumeText}`;

const EXTRACTION_SYSTEM_PROMPT = `You are a precise resume parser. Extract only factual information present in the document. Never hallucinate degrees, companies, dates, or skills.`;

export async function parseResumeWithAI(text: string): Promise<ExtractedProfile> {
  const maxInputLength = 30000;
  const truncatedText = text.length > maxInputLength
    ? text.substring(0, maxInputLength) + "\n\n[TRUNCATED - resume too long for full processing]"
    : text;

  try {
    const result = await generateStructured(ExtractedProfileSchema, {
      system: EXTRACTION_SYSTEM_PROMPT,
      prompt: EXTRACTION_PROMPT.replace("{resumeText}", truncatedText),
      temperature: 0.1,
      maxTokens: 8000,
    });

    return result.object;
  } catch (e) {
    if (e instanceof AiServiceError && e.code === "NOT_CONFIGURED") {
      throw new Error("AI provider not configured. Cannot parse resume without AI.");
    }
    throw new Error(`Resume parsing failed: ${e instanceof Error ? e.message : "Unknown error"}`);
  }
}

export function mergeExtractedData(
  aiResult: ExtractedProfile,
  deterministicData: {
    contact: { emails: string[]; phones: string[]; urls: string[] };
    sections: Record<string, string>;
  }
): ExtractedProfile {
  return {
    ...aiResult,
    contact: {
      ...aiResult.contact,
      email: aiResult.contact?.email ?? deterministicData.contact.emails[0],
      phone: aiResult.contact?.phone ?? deterministicData.contact.phones[0],
      linkedin: aiResult.contact?.linkedin ?? deterministicData.contact.urls.find(u => u.includes("linkedin")),
      github: aiResult.contact?.github ?? deterministicData.contact.urls.find(u => u.includes("github")),
      portfolio: aiResult.contact?.portfolio ?? deterministicData.contact.urls.find(u => !u.includes("linkedin") && !u.includes("github")),
    },
    sectionOrder: aiResult.sectionOrder ?? Object.keys(deterministicData.sections),
  };
}