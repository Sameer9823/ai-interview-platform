import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrent } from "@/lib/auth/session";
import { db as prisma } from "@/lib/db/client";
import { checkAttemptAccess } from "@/lib/ai/services/assessment-engine";

const bodySchema = z.object({
  attemptId: z.string().min(1),
  questionId: z.string().min(1),
  answerText: z.string().default(""),
  selectedOptionIds: z.array(z.string()).default([]),
  isMarkedForReview: z.boolean().optional(),
});

export async function POST(req: Request) {
  const { session } = await getCurrent();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { attemptId, questionId, answerText, selectedOptionIds, isMarkedForReview } = parsed.data;

  const hasAccess = await checkAttemptAccess(attemptId, session.id);
  if (!hasAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const attempt = await prisma.assessmentAttempt.findUnique({
    where: { id: attemptId },
    select: { status: true, deadlineAt: true, assessmentId: true },
  });
  if (!attempt) return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
  if (attempt.status !== "IN_PROGRESS") return NextResponse.json({ error: "Attempt not in progress" }, { status: 409 });
  if (new Date() > attempt.deadlineAt) return NextResponse.json({ error: "Attempt expired" }, { status: 410 });

  const answer = await prisma.attemptAnswer.upsert({
    where: { attemptId_questionId: { attemptId, questionId } },
    create: { attemptId, questionId, answerText, selectedOptionIds, isMarkedForReview: isMarkedForReview ?? false },
    update: { answerText, selectedOptionIds, isMarkedForReview: isMarkedForReview ?? false, savedAt: new Date() },
  });

  return NextResponse.json({ answer, savedAt: answer.savedAt });
}

export async function PATCH(req: Request) {
  const { session } = await getCurrent();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.partial().safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { attemptId, questionId, ...data } = parsed.data;
  if (!attemptId || !questionId) return NextResponse.json({ error: "Missing attemptId or questionId" }, { status: 400 });

  const hasAccess = await checkAttemptAccess(attemptId, session.id);
  if (!hasAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const attempt = await prisma.assessmentAttempt.findUnique({
    where: { id: attemptId },
    select: { status: true, deadlineAt: true },
  });
  if (!attempt) return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
  if (attempt.status !== "IN_PROGRESS") return NextResponse.json({ error: "Attempt not in progress" }, { status: 409 });

  const answer = await prisma.attemptAnswer.update({
    where: { attemptId_questionId: { attemptId, questionId } },
    data: { ...data, savedAt: new Date() },
  });

  return NextResponse.json({ answer, savedAt: answer.savedAt });
}