import "server-only";
import { z } from "zod";
import { generateStructured } from "@/lib/ai/samai-service";
import { evaluationSchema } from "@/lib/ai/schemas";
import { checkUsageLimit, recordUsage, validateLengths } from "@/lib/ai/services/usage-manager";
import { AiServiceError } from "@/lib/ai/errors";
import { wrapUntrusted } from "@/lib/ai/prompts-base";
import type { QuestionType, Difficulty } from "@/lib/content/types";
import { getCurrent } from "@/lib/auth/session";

// Question-type-specific rubric criteria
const RUBRICS: Record<QuestionType, string[]> = {
  MULTIPLE_CHOICE: ["Correctness", "Reasoning"],
  SINGLE_ANSWER: ["Accuracy", "Completeness"],
  SHORT_ANSWER: ["Accuracy", "Completeness", "Clarity"],
  LONG_ANSWER: ["Accuracy", "Depth", "Structure", "Clarity"],
  CODING: ["Correctness", "Efficiency", "Code Quality", "Edge Cases"],
  SQL: ["Correctness", "Efficiency", "Syntax"],
  SCENARIO: ["Problem Understanding", "Solution Quality", "Trade-offs", "Communication"],
  BEHAVIORAL: ["STAR Structure", "Relevance", "Self-awareness", "Impact"],
  SYSTEM_DESIGN: ["Requirements Clarification", "Architecture", "Scalability", "Trade-offs", "Communication"],
  COMMUNICATION: ["Clarity", "Structure", "Tone", "Conciseness"],
};

// Deterministic answer checking for objective question types
export function checkObjectiveAnswer(question: string, userAnswer: string, correctAnswer: string, type: QuestionType): { score: number; feedback: string } | null {
  if (type !== "MULTIPLE_CHOICE" && type !== "SINGLE_ANSWER" && type !== "SQL") {
    return null;
  }

  const normalizedUser = userAnswer.trim().toLowerCase();
  const normalizedCorrect = correctAnswer.trim().toLowerCase();

  if (type === "MULTIPLE_CHOICE" || type === "SINGLE_ANSWER") {
    // For MCQ, check if the user's answer contains the correct option
    const isCorrect = normalizedUser.includes(normalizedCorrect) || normalizedCorrect.includes(normalizedUser);
    return {
      score: isCorrect ? 100 : 0,
      feedback: isCorrect ? "Correct answer." : `Incorrect. The correct answer is: ${correctAnswer}`,
    };
  }

  if (type === "SQL") {
    // Simple SQL comparison - normalize whitespace
    const userSql = normalizedUser.replace(/\s+/g, " ");
    const correctSql = normalizedCorrect.replace(/\s+/g, " ");
    const isCorrect = userSql === correctSql;
    return {
      score: isCorrect ? 100 : 0,
      feedback: isCorrect ? "Query matches expected result." : `Query differs from expected. Expected: ${correctAnswer}`,
    };
  }

  return null;
}

export function scoreToBand(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Good";
  if (score >= 60) return "Satisfactory";
  if (score >= 40) return "Needs Improvement";
  return "Insufficient";
}

function buildEvaluationPrompt(input: {
  question: string;
  questionType: QuestionType;
  difficulty: Difficulty;
  answer: string;
  answerOutline?: string;
  exampleAnswer?: string;
  rubric?: string[];
  userContext?: {
    careerStage?: string;
    targetRole?: string;
    experienceLevel?: string;
  };
}): string {
  const { question, questionType, difficulty, answer, answerOutline, exampleAnswer, rubric, userContext } = input;
  
  const criteria = rubric || RUBRICS[questionType] || ["Accuracy", "Completeness", "Clarity"];

  let prompt = `Evaluate this practice answer with explicit criteria.

Question: ${question}
Question Type: ${questionType}
Difficulty: ${difficulty}

User's Answer: ${wrapUntrusted("user-answer", answer)}

`;

  if (answerOutline) {
    prompt += `Answer Outline / Key Points: ${answerOutline}

`;
  }
  if (exampleAnswer) {
    prompt += `Example Answer: ${exampleAnswer}

`;
  }

  prompt += `Evaluation Criteria:
${criteria.map((c, i) => `${i + 1}. ${c}`).join("\n")}

`;

  if (userContext) {
    prompt += `User Context:
`;
    if (userContext.careerStage) prompt += `- Career Stage: ${userContext.careerStage}\n`;
    if (userContext.targetRole) prompt += `- Target Role: ${userContext.targetRole}\n`;
    if (userContext.experienceLevel) prompt += `- Experience Level: ${userContext.experienceLevel}\n`;
    prompt += `\n`;
  }

  prompt += `Output a structured evaluation with:
- score: integer 0-100
- band: one of ["Excellent", "Good", "Satisfactory", "Needs Improvement", "Insufficient"]
- criteria: array of {name, score (0-100), comment}
- strengths: string[]
- missing: string[]
- incorrect: string[]
- improvements: string[]
- modelAnswer: string (the ideal answer)
- nextSteps: string[]
- confidence: number 0-1 (optional)
`;

  return prompt;
}

/** Evaluate a practice answer. Returns structured evaluation with deterministic check for objective types. */
export interface EvaluateAnswerInput {
  questionId?: string;
  question: string;
  questionType: QuestionType;
  difficulty: Difficulty;
  answer: string;
  answerOutline?: string;
  exampleAnswer?: string;
  rubric?: string[];
  userContext?: {
    careerStage?: string;
    targetRole?: string;
    experienceLevel?: string;
  };
}

export async function evaluateAnswer(input: EvaluateAnswerInput): Promise<{
  evaluation: z.infer<typeof evaluationSchema>;
  deterministicCheck: { score: number; feedback: string } | null;
  usedDeterministic: boolean;
}> {
  const { session, record } = await getCurrent();
  if (!session || !record) throw new Error("Unauthorized");

  // Check usage limit
  const usageCheck = await checkUsageLimit("answer_evaluation");
  if (!usageCheck.allowed) {
    throw new AiServiceError("RATE_LIMITED", usageCheck.reason || "Daily evaluation limit reached");
  }

  // Validate lengths
  const prompt = buildEvaluationPrompt(input);
  const lengthCheck = validateLengths(prompt, 8000);
  if (!lengthCheck.valid) {
    throw new AiServiceError("INVALID_INPUT", lengthCheck.error || "Prompt too long");
  }

  // Try deterministic check first for objective types
  const deterministic = checkObjectiveAnswer(input.question, input.answer, input.answerOutline || "", input.questionType);
  let evaluation: z.infer<typeof evaluationSchema>;
  let usedDeterministic = false;

  if (deterministic) {
    usedDeterministic = true;
    evaluation = {
      score: deterministic.score,
      band: scoreToBand(deterministic.score),
      criteria: [{ name: "Correctness", score: deterministic.score, comment: deterministic.feedback }],
      strengths: deterministic.score === 100 ? ["Correct answer"] : [],
      missing: deterministic.score === 0 ? ["Correct answer"] : [],
      incorrect: deterministic.score === 0 ? ["Answer was incorrect"] : [],
      improvements: deterministic.score === 0 ? ["Review the correct answer"] : [],
      modelAnswer: input.answerOutline ?? "",
      nextSteps: deterministic.score === 100 ? ["Move to next question"] : ["Review the topic and try again"],
      confidence: 1.0,
    };
  } else {
    // Full LLM evaluation
    const { object, usage } = await generateStructured(evaluationSchema, {
      system: "Evaluate the practice answer with explicit criteria. Be constructive. Do not claim hiring outcomes.",
      prompt: buildEvaluationPrompt(input),
      maxTokens: 2500,
      temperature: 0.3,
    });
    evaluation = object as z.infer<typeof evaluationSchema>;
    if (usage) {
      await recordUsage({
        operation: "answer_evaluation",
        model: "unknown",
        inputTokens: usage.inputTokens ?? 0,
        outputTokens: usage.outputTokens ?? 0,
      });
    }
  }

  // Validate score range
  evaluation.score = Math.max(0, Math.min(100, evaluation.score));
  evaluation.band = scoreToBand(evaluation.score);

  return { evaluation, deterministicCheck: deterministic, usedDeterministic };
}

/** Evaluate a coding answer with static analysis hints (no code execution). */
export async function evaluateCodeAnswer(input: {
  question: string;
  userCode: string;
  language: string;
  expectedApproach?: string;
  testCases?: { input: string; expected: string }[];
  difficulty: Difficulty;
  userContext?: { careerStage?: string; targetRole?: string; experienceLevel?: string };
}) {
  const usageCheck = await checkUsageLimit("answer_evaluation");
  if (!usageCheck.allowed) {
    throw new AiServiceError("RATE_LIMITED", usageCheck.reason || "Daily evaluation limit reached");
  }

  const prompt = `Evaluate this code solution. Do NOT execute the code. Perform static analysis only.

Question: ${input.question}
Language: ${input.language}
Difficulty: ${input.difficulty}

User's Code:
${wrapUntrusted("user-code", input.userCode)}

${input.expectedApproach ? `Expected Approach: ${input.expectedApproach}\n` : ""}
${input.testCases?.length ? `Test Cases (for reference):\n${input.testCases.map((t, i) => `${i + 1}. Input: ${t.input} -> Expected: ${t.expected}`).join("\n")}\n` : ""}

Evaluate on: Correctness (logic), Efficiency (time/space), Code Quality (readability, style), Edge Cases.
Provide structured evaluation with score (0-100), per-criterion scores, strengths, issues, improvements, and a model solution outline.
Note: This is static analysis only. Do not claim the code was executed or tests passed.`;

  const { object, usage } = await generateStructured(evaluationSchema, {
    system: "Evaluate code through static analysis only. Never claim code execution or test results.",
    prompt,
    maxTokens: 3000,
    temperature: 0.3,
  });

  if (usage) {
    await recordUsage({
      operation: "answer_evaluation",
      model: "unknown",
      inputTokens: usage.inputTokens ?? 0,
      outputTokens: usage.outputTokens ?? 0,
    });
  }

  return { evaluation: object, usedDeterministic: false };
}
