import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrent } from "@/lib/auth/session";
import { db as prisma } from "@/lib/db/client";
import { checkAttemptAccess, finalizeAttempt, getAssessmentConfig, getAssessmentQuestions } from "@/lib/ai/services/assessment-engine";
import { awardXP, checkAchievements } from "@/lib/gamification";

const bodySchema = z.object({
  attemptId: z.string().min(1),
});

export async function POST(req: Request) {
  const { session } = await getCurrent();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { attemptId } = parsed.data;

  const hasAccess = await checkAttemptAccess(attemptId, session.id);
  if (!hasAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const attempt = await prisma.assessmentAttempt.findUnique({
    where: { id: attemptId },
    select: { status: true, deadlineAt: true, assessmentId: true },
  });
  if (!attempt) return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
  if (attempt.status !== "IN_PROGRESS") return NextResponse.json({ error: "Attempt already submitted" }, { status: 409 });

  const config = await getAssessmentConfig(attempt.assessmentId);
  if (!config) return NextResponse.json({ error: "Assessment config not found" }, { status: 404 });

  const questions = await getAssessmentQuestions(attempt.assessmentId);

  try {
    const result = await finalizeAttempt(attemptId, config, questions);

    if (result.pendingAiCount === 0) {
      await awardXP(session.id, "ASSESSMENT_COMPLETED", attemptId, "assessment_attempt");
      await checkAchievements(session.id);
    }

    return NextResponse.json({ result, status: result.pendingAiCount > 0 ? "evaluating" : "completed" });
  } catch (e) {
    console.error("Assessment finalization error:", e);
    return NextResponse.json({ error: "Failed to finalize attempt" }, { status: 500 });
  }
}