import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrent } from "@/lib/auth/session";
import { evaluateAnswer } from "@/lib/ai/services/answer-evaluator";
import { AiServiceError } from "@/lib/ai/errors";
import type { QuestionType, Difficulty } from "@/lib/content/types";

const bodySchema = z.object({
  question: z.string().min(1).max(10000),
  questionType: z.string().min(1).max(50),
  difficulty: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
  answer: z.string().min(1).max(20000),
  answerOutline: z.string().max(10000).optional(),
  exampleAnswer: z.string().max(10000).optional(),
  correctAnswer: z.string().max(5000).optional(),
  rubric: z.array(z.string().max(100)).max(10).optional(),
  userContext: z.object({
    careerStage: z.string().optional(),
    targetRole: z.string().optional(),
    experienceLevel: z.string().optional(),
  }).optional(),
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

  try {
    const result = await evaluateAnswer({
      question: parsed.data.question,
      questionType: parsed.data.questionType as QuestionType,
      difficulty: parsed.data.difficulty as Difficulty,
      answer: parsed.data.answer,
      answerOutline: parsed.data.answerOutline,
      exampleAnswer: parsed.data.exampleAnswer,
      rubric: parsed.data.rubric,
      userContext: parsed.data.userContext,
    });
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof AiServiceError) {
      const status = e.code === "NOT_CONFIGURED" ? 503 : e.code === "RATE_LIMITED" ? 429 : 502;
      return NextResponse.json({ error: e.message, code: e.code }, { status });
    }
    console.error("Answer evaluation failed:", e);
    return NextResponse.json({ error: "AI request failed" }, { status: 502 });
  }
}
