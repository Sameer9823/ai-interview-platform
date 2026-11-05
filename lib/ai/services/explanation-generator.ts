import "server-only";
import { z } from "zod";
import { generateStructured } from "@/lib/ai/samai-service";
import { wrapUntrusted } from "@/lib/ai/prompts-base";

const explanationSchema = z.object({
  explanation: z.string().min(1),
  keyConcepts: z.array(z.string()).default([]),
  commonMistakes: z.array(z.string()).default([]),
  analogies: z.array(z.string()).default([]),
  followUpQuestions: z.array(z.string()).default([]),
  relatedTopics: z.array(z.string()).default([]),
});

export type ExplanationLevel = "beginner" | "step-by-step" | "advanced" | "analogy";

export interface ExplanationInput {
  questionText: string;
  questionType: string;
  difficulty: string;
  answerOutline?: string;
  explanation?: string;
  exampleAnswer?: string;
  codeSolution?: string;
  codeLanguage?: string;
  userAnswer?: string;
  evaluation?: {
    score: number;
    strengths: string[];
    missing: string[];
    incorrect: string[];
  };
  level: ExplanationLevel;
  sourceReferences?: string[];
}

function buildPrompt(input: ExplanationInput): string {
  const { questionText, questionType, difficulty, level, userAnswer, evaluation, sourceReferences } = input;
  
  let prompt = `Generate a ${level} explanation for this practice question.

Question: ${questionText}
Type: ${questionType}
Difficulty: ${difficulty}
`;

  if (input.answerOutline) {
    prompt += `\nAnswer outline: ${input.answerOutline}`;
  }
  if (input.explanation) {
    prompt += `\nExisting explanation: ${input.explanation}`;
  }
  if (input.exampleAnswer) {
    prompt += `\nExample answer: ${input.exampleAnswer}`;
  }
  if (input.codeSolution) {
    prompt += `\nCode solution (${input.codeLanguage || "unknown"}): ${input.codeSolution}`;
  }
  if (userAnswer) {
    prompt += `\nUser's answer: ${wrapUntrusted("user-answer", userAnswer)}`;
  }
  if (evaluation) {
    prompt += `\nEvaluation: Score ${evaluation.score}/100. Strengths: ${evaluation.strengths.join(", ")}. Missing: ${evaluation.missing.join(", ")}. Incorrect: ${evaluation.incorrect.join(", ")}.`;
  }
  if (sourceReferences && sourceReferences.length > 0) {
    prompt += `\nSource references: ${sourceReferences.join(", ")}`;
  }

  switch (level) {
    case "beginner":
      prompt += `\n\nProvide a beginner-friendly explanation. Use simple language, define technical terms, and assume minimal prior knowledge.`;
      break;
    case "step-by-step":
      prompt += `\n\nProvide a step-by-step walkthrough. Break down the solution into clear, numbered steps.`;
      break;
    case "advanced":
      prompt += `\n\nProvide an advanced explanation. Cover edge cases, alternative approaches, time/space complexity, and deeper insights.`;
      break;
    case "analogy":
      prompt += `\n\nProvide an explanation using analogies and real-world examples to make the concept intuitive.`;
      break;
  }

  prompt += `\n\nReturn structured output with: explanation, keyConcepts, commonMistakes, analogies, followUpQuestions, relatedTopics.`;
  return prompt;
}

export async function generateExplanation(input: ExplanationInput) {
  const { object } = await generateStructured(explanationSchema, {
    system: "You are an interview preparation tutor. Provide clear, accurate explanations. Never invent facts or citations. Label AI-generated content appropriately.",
    prompt: buildPrompt(input),
    maxTokens: 3000,
    temperature: 0.3,
  });
  return object;
}

// Additional practice questions on weak concept
const additionalQuestionsSchema = z.object({
  questions: z.array(z.object({
    text: z.string(),
    type: z.string(),
    difficulty: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
    topic: z.string(),
    rationale: z.string(),
  })).min(1).max(5),
});

export async function generateAdditionalPractice(input: {
  weakConcept: string;
  questionType: string;
  difficulty: string;
  careerStage?: string;
  targetRole?: string;
  count?: number;
}) {
  const { object } = await generateStructured(additionalQuestionsSchema, {
    system: "Generate additional practice questions targeting a specific weak concept. Label them AI-generated practice.",
    prompt: JSON.stringify(input),
    maxTokens: 3000,
    temperature: 0.5,
  });
  return object.questions;
}
