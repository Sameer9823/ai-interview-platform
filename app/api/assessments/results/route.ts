import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrent } from "@/lib/auth/session";
import { db as prisma } from "@/lib/db/client";
import { checkAttemptAccess, getAttemptWithDetails } from "@/lib/ai/services/assessment-engine";

const querySchema = z.object({
  attemptId: z.string().min(1),
});

export async function GET(req: Request) {
  const { session } = await getCurrent();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const parsed = querySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Invalid query" }, { status: 400 });

  const { attemptId } = parsed.data;

  const hasAccess = await checkAttemptAccess(attemptId, session.id);
  if (!hasAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const attempt = await getAttemptWithDetails(attemptId, session.id);
  if (!attempt) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!attempt.result) {
    return NextResponse.json({
      status: attempt.status,
      attemptId: attempt.id,
      assessment: attempt.assessment,
      pending: true,
      message: attempt.status === "EVALUATING" ? "AI evaluation in progress" : "Results not yet available",
    });
  }

  const breakdown = attempt.result.breakdown as Array<{
    questionId: string;
    marks: number;
    score: number;
    isCorrect: boolean | null;
    status: string;
    feedback?: string;
    criteria?: { name: string; score: number; comment: string }[];
    timeSpentMs?: number;
  }>;

  const questionDetails = await prisma.assessmentQuestion.findMany({
    where: { assessmentId: attempt.assessmentId },
    include: {
      question: {
        select: {
          id: true,
          text: true,
          type: true,
          difficulty: true,
          explanation: true,
          exampleAnswer: true,
          options: { select: { id: true, text: true, correct: true } },
        },
      },
    },
  });

  const questionMap = new Map(questionDetails.map((q) => [q.question?.id, q]));

  const detailedBreakdown = breakdown.map((b) => {
    const aq = questionMap.get(b.questionId);
    const q = aq?.question;
    return {
      ...b,
      question: q ? {
        id: q.id,
        text: q.text,
        type: q.type,
        difficulty: q.difficulty,
        explanation: attempt.assessment.showExplanationsAfter ? q.explanation : undefined,
        exampleAnswer: attempt.assessment.showExplanationsAfter ? q.exampleAnswer : undefined,
        options: q.options,
      } : null,
    };
  });

  return NextResponse.json({
    attemptId: attempt.id,
    assessment: attempt.assessment,
    status: attempt.status,
    startedAt: attempt.startedAt,
    submittedAt: attempt.submittedAt,
    timeSpentMs: attempt.submittedAt ? new Date(attempt.submittedAt).getTime() - new Date(attempt.startedAt).getTime() : null,
    score: attempt.score,
    maxScore: attempt.maxScore,
    percentage: attempt.percentage,
    passed: attempt.passed,
    breakdown: detailedBreakdown,
    result: attempt.result,
  });
}