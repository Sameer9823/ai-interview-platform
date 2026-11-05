import "server-only";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { generateStructured } from "@/lib/ai/samai-service";
import { generatedQuestionSchema } from "@/lib/ai/schemas";
import { buildGenerationContext } from "@/lib/ai/services/context-builder";
import { checkUsageLimit, recordUsage, validateLengths } from "@/lib/ai/services/usage-manager";
import { AiServiceError } from "@/lib/ai/errors";
import { db } from "@/lib/db/client";
import { getCurrent } from "@/lib/auth/session";
import type { Difficulty, QuestionType } from "@/lib/content/types";
import type { CareerStage } from "@/lib/permissions";

export interface GenerateQuestionsInput {
  topic: string;
  difficulty: Difficulty;
  questionType: QuestionType;
  count: number;
  careerStage?: CareerStage;
  targetRole?: string;
  companyId?: string;
  skills?: string[];
}

const GENERATION_SCHEMA = z.object({
  questions: z.array(generatedQuestionSchema).min(1).max(10),
});

const MAX_QUESTIONS_PER_REQUEST = 10;
const SIMILARITY_THRESHOLD = 0.85;

/** Normalize text for comparison: lowercase, remove punctuation, collapse whitespace. */
export function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

/** Jaccard similarity on word sets (words > 2 chars). */
export function jaccardSimilarity(a: string, b: string): number {
  const setA = new Set(a.split(" ").filter((w) => w.length > 2));
  const setB = new Set(b.split(" ").filter((w) => w.length > 2));
  if (setA.size === 0 && setB.size === 0) return 1;
  if (setA.size === 0 || setB.size === 0) return 0;
  const intersection = [...setA].filter((x) => setB.has(x)).length;
  const union = new Set([...setA, ...setB]).size;
  return intersection / union;
}

/** Filter out new questions that are too similar to existing ones. */
export async function findDuplicates(
  newQuestions: z.infer<typeof generatedQuestionSchema>[],
  existingQuestions: { text: string }[]
): Promise<z.infer<typeof generatedQuestionSchema>[]> {
  const existingNormalized = existingQuestions.map((q) => normalizeText(q.text));
  return newQuestions.filter((newQ) => {
    const newNorm = normalizeText(newQ.text);
    return !existingNormalized.some((ex) => jaccardSimilarity(newNorm, ex) > SIMILARITY_THRESHOLD);
  });
}

function buildGenerationPrompt(context: Awaited<ReturnType<typeof buildGenerationContext>>, input: {
  topic: string;
  difficulty: Difficulty;
  questionType: QuestionType;
  count: number;
  careerStage?: string;
  targetRole?: string;
  companyId?: string;
  skills?: string[];
}): string {
  const { user, relevantQuestions, company, processes } = context;
  
  let prompt = `Generate ${input.count} original practice questions.

User Context:
- Career stage: ${user.careerStage || "not specified"}
- Target role: ${user.targetRole || "not specified"}
- Experience level: ${user.experienceLevel || "not specified"}
- Skills: ${user.skills.join(", ") || "none listed"}
- Skills to improve: ${user.skillsToImprove.join(", ") || "none listed"}
- Goals: ${user.goals.join(", ") || "none"}

Request:
- Topic: ${input.topic}
- Difficulty: ${input.difficulty}
- Question type: ${input.questionType}
- Count: ${input.count}
`;

  if (input.careerStage) prompt += `- Career stage filter: ${input.careerStage}\n`;
  if (input.targetRole) prompt += `- Target role: ${input.targetRole}\n`;
  if (input.skills?.length) prompt += `- Focus skills: ${input.skills.join(", ")}\n`;

  if (company) {
    prompt += `\nCompany context (${company.name}):
- Industry: ${company.industry}
- Role categories: ${company.roleCategories.join(", ")}
- Prep categories: ${company.prepCategories.join(", ")}\n`;
    prompt += `IMPORTANT: These questions are for ${company.name} preparation practice. Label them "AI-generated practice for ${company.name} preparation". Do NOT claim they were actually asked by ${company.name} unless a verified source is provided.\n`;
  }

  if (processes && processes.length > 0) {
    prompt += `\nKnown interview process stages for this company:\n`;
    for (const p of processes) {
      prompt += `- ${p.title}: ${p.prepRecommendations}\n`;
    }
  }

  if (relevantQuestions.length > 0) {
    prompt += `\nRelevant published questions (for context, do not duplicate):\n`;
    for (const q of relevantQuestions.slice(0, 5)) {
      prompt += `- ${q.text.substring(0, 200)}\n`;
    }
  }

  prompt += `\nRequirements:
- Each question must be original and not a copy of published questions.
- Include clear answer outline and explanation.
- For coding questions: provide code solution, language, and test cases.
- For SQL: provide expected query and explanation.
- Label all questions as AI-generated practice.
- Do NOT claim any question was actually asked by a real company.
`;

  return prompt;
}

/** Generate practice questions with context awareness and duplicate filtering. */
export async function generateQuestions(input: GenerateQuestionsInput): Promise<{
  questions: z.infer<typeof generatedQuestionSchema>[];
  duplicatesFiltered: number;
  contextUsed: boolean;
}> {
  const { session, record } = await getCurrent();
  if (!session || !record) throw new Error("Unauthorized");

  // Check usage limit
  await checkUsageLimit("question_generation");

  // Validate count
  const count = Math.min(Math.max(1, input.count), MAX_QUESTIONS_PER_REQUEST);

  // Build context
  const context = await buildGenerationContext({ ...input, count, careerStage: input.careerStage as CareerStage | undefined });

  // Build prompt
  const prompt = buildGenerationPrompt(context, input);

  // Validate lengths
  const lengthCheck = validateLengths(prompt, 4000);
  if (!lengthCheck.valid) {
    throw new AiServiceError("INVALID_INPUT", lengthCheck.error || "Prompt too long");
  }

  // Generate questions
  const { object, usage } = await generateStructured(GENERATION_SCHEMA, {
    system: "Generate original practice questions. Label them AI-generated practice. Never claim they were asked by a real company.",
    prompt,
    maxTokens: 4000,
    temperature: 0.5,
  });

  // Filter duplicates against existing published questions
  const existingQuestions = await db.question.findMany({
    where: { publication: "PUBLISHED" },
    select: { text: true },
  });
  const filtered = await findDuplicates(object.questions as z.infer<typeof generatedQuestionSchema>[], existingQuestions);
  const duplicatesFiltered = object.questions.length - filtered.length;

  // Record usage
  if (usage) {
    await recordUsage({
      operation: "question_generation",
      model: "unknown",
      inputTokens: usage.inputTokens ?? 0,
      outputTokens: usage.outputTokens ?? 0,
      estimatedCostUsd: usage.totalTokens ? estimateCost("unknown", usage.totalTokens) : undefined,
    });
  }

  // Ensure required fields have defaults
  const questionsWithDefaults = filtered.map((q) => ({
    ...q,
    skills: q.skills ?? [],
    answerOutline: q.answerOutline ?? "",
    explanation: q.explanation ?? "",
    exampleAnswer: q.exampleAnswer ?? "",
    codeSolution: q.codeSolution ?? "",
    codeLanguage: q.codeLanguage ?? "",
    testCases: q.testCases ?? [],
    hints: q.hints ?? [],
    rubric: q.rubric ?? [],
    subtopic: q.subtopic ?? "",
    sourceReferences: q.sourceReferences ?? [],
  }));

  return {
    questions: questionsWithDefaults.slice(0, count),
    duplicatesFiltered,
    contextUsed: context.relevantQuestions.length > 0,
  };
}

function estimateCost(model: string, totalTokens: number): number {
  // Rough estimates per 1M tokens
  const pricing: Record<string, { input: number; output: number }> = {
    "gpt-4o": { input: 5, output: 15 },
    "gpt-4o-mini": { input: 0.15, output: 0.6 },
    "claude-3-5-sonnet": { input: 3, output: 15 },
    "claude-3-haiku": { input: 0.25, output: 1.25 },
    "gemini-1.5-pro": { input: 3.5, output: 10.5 },
    "gemini-1.5-flash": { input: 0.075, output: 0.3 },
  };
  const p = pricing[model] || { input: 1, output: 3 };
  // Assume 50/50 split
  return (totalTokens / 1_000_000) * ((p.input + p.output) / 2);
}

/** Store generated questions as private practice items for the user. */
export async function storeGeneratedQuestions(
  questions: z.infer<typeof generatedQuestionSchema>[],
  sessionId?: string
): Promise<string[]> {
  const { session, record } = await getCurrent();
  if (!session || !record) throw new Error("Unauthorized");

  const stored = await db.generatedPracticeQuestion.createMany({
    data: questions.map((q) => ({
      userId: record.id,
      text: q.text,
      type: q.type as QuestionType,
      difficulty: q.difficulty,
      topic: q.topic,
      subtopic: q.subtopic,
      skills: q.skills,
      estimatedMinutes: q.estimatedMinutes,
      hints: q.hints,
      answerOutline: q.answerOutline,
      explanation: q.explanation,
      exampleAnswer: q.exampleAnswer,
      codeSolution: q.codeSolution,
      codeLanguage: q.codeLanguage,
      testCases: q.testCases as Prisma.JsonArray,
      rubric: q.rubric as Prisma.JsonArray,
      origin: "AI_GENERATED",
      contentOrigin: "AI_GENERATED",
    })),
  });

  // Note: createMany doesn't return IDs in Prisma, so we'd need to fetch them
  // For now, return empty array - the caller should fetch if needed
  return [];
}
