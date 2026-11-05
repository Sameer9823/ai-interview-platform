import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrent } from "@/lib/auth/session";
import { generateExplanation, ExplanationInput, ExplanationLevel } from "@/lib/ai/services/explanation-generator";
import { AiServiceError } from "@/lib/ai/errors";
import { checkUsageLimit, recordUsage } from "@/lib/ai/services/usage-manager";

const bodySchema = z.object({
  questionText: z.string().min(1).max(10000),
  questionType: z.string().min(1).max(50),
  difficulty: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
  answerOutline: z.string().max(10000).optional(),
  explanation: z.string().max(10000).optional(),
  exampleAnswer: z.string().max(10000).optional(),
  codeSolution: z.string().max(10000).optional(),
  codeLanguage: z.string().max(50).optional(),
  userAnswer: z.string().max(20000).optional(),
  evaluation: z.object({
    score: z.number().min(0).max(100),
    strengths: z.array(z.string()).default([]),
    missing: z.array(z.string()).default([]),
    incorrect: z.array(z.string()).default([]),
  }).optional(),
  level: z.enum(["beginner", "step-by-step", "advanced", "analogy"]),
  sourceReferences: z.array(z.string()).optional(),
});

export async function POST(req: Request) {
  const { session, record } = await getCurrent();
  if (!session || !record) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  // Check usage limit
  const usageCheck = await checkUsageLimit("explanation");
  if (!usageCheck.allowed) {
    return NextResponse.json({ error: usageCheck.reason || "Daily explanation limit reached" }, { status: 429 });
  }

  const input: ExplanationInput = {
    questionText: parsed.data.questionText,
    questionType: parsed.data.questionType,
    difficulty: parsed.data.difficulty,
    answerOutline: parsed.data.answerOutline,
    explanation: parsed.data.explanation,
    exampleAnswer: parsed.data.exampleAnswer,
    codeSolution: parsed.data.codeSolution,
    codeLanguage: parsed.data.codeLanguage,
    userAnswer: parsed.data.userAnswer,
    evaluation: parsed.data.evaluation,
    level: parsed.data.level as ExplanationLevel,
    sourceReferences: parsed.data.sourceReferences,
  };

  try {
    const result = await generateExplanation(input);
    
    // Record usage (we don't have usage info from generateExplanation, so we'll skip for now)
    // In a real implementation, generateExplanation would return usage info
    
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof AiServiceError) {
      const status = e.code === "NOT_CONFIGURED" ? 503 : e.code === "RATE_LIMITED" ? 429 : 502;
      return NextResponse.json({ error: e.message, code: e.code }, { status });
    }
    console.error("Explanation generation failed:", e);
    return NextResponse.json({ error: "AI request failed" }, { status: 502 });
  }
}
