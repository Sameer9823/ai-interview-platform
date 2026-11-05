import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrent } from "@/lib/auth/session";
import { generateQuestions, storeGeneratedQuestions, type GenerateQuestionsInput } from "@/lib/ai/services/question-generator";
import { AiServiceError } from "@/lib/ai/errors";
import { Difficulty, QuestionType } from "@/lib/content/types";
import type { CareerStage } from "@/lib/permissions";

const bodySchema = z.object({
  topic: z.string().min(1).max(100),
  difficulty: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
  type: z.string().min(1).max(50),
  count: z.number().int().min(1).max(10),
  careerStage: z.enum(["STUDENT", "FRESHER", "PROFESSIONAL"]).optional(),
  targetRole: z.string().max(100).optional(),
  companyId: z.string().optional(),
  skills: z.array(z.string().max(40)).max(10).optional(),
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

  const input: GenerateQuestionsInput = {
    topic: parsed.data.topic,
    difficulty: parsed.data.difficulty as Difficulty,
    questionType: parsed.data.type as QuestionType,
    count: parsed.data.count,
    careerStage: parsed.data.careerStage as CareerStage | undefined,
    targetRole: parsed.data.targetRole,
    companyId: parsed.data.companyId,
    skills: parsed.data.skills,
  };

  try {
    const result = await generateQuestions(input);
    
    // Store generated questions as private practice items
    await storeGeneratedQuestions(result.questions);
    
    return NextResponse.json({
      questions: result.questions,
      duplicatesFiltered: result.duplicatesFiltered,
      contextUsed: result.contextUsed,
    });
  } catch (e) {
    if (e instanceof AiServiceError) {
      const status = e.code === "NOT_CONFIGURED" ? 503 : e.code === "RATE_LIMITED" ? 429 : 502;
      return NextResponse.json({ error: e.message, code: e.code }, { status });
    }
    console.error("Question generation failed:", e);
    return NextResponse.json({ error: "AI request failed" }, { status: 502 });
  }
}
