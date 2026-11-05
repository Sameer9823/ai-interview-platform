import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrent } from "@/lib/auth/session";
import { submitMockInterviewAnswer, requestHint, skipQuestion } from "@/lib/ai/services/mock-interview-orchestrator";

const answerSchema = z.object({
  sessionId: z.string().min(1),
  questionId: z.string().min(1),
  answerText: z.string().default(""),
  answerCode: z.string().optional(),
  programmingLanguage: z.string().optional(),
  idempotencyKey: z.string().optional(),
});

export async function POST(req: Request) {
  const { session } = await getCurrent();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = answerSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });

  const { sessionId, questionId, answerText, answerCode, programmingLanguage, idempotencyKey } = parsed.data;

  try {
    const answer = await submitMockInterviewAnswer(
      sessionId,
      session.id,
      questionId,
      answerText,
      answerCode,
      programmingLanguage,
      idempotencyKey
    );

    return NextResponse.json({ answer });
  } catch (e) {
    const error = e instanceof Error ? e.message : "Failed to submit answer";
    let status = 500;
    if (error === "Session not found") status = 404;
    else if (error.includes("not in progress") || error.includes("sequence")) status = 409;
    else if (error.includes("Unauthorized") || error.includes("Forbidden")) status = 403;
    return NextResponse.json({ error }, { status });
  }
}