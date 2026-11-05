import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrent } from "@/lib/auth/session";
import { completeMockInterview } from "@/lib/ai/services/mock-interview-orchestrator";
import { awardXP, checkAchievements } from "@/lib/gamification";

const bodySchema = z.object({
  sessionId: z.string().min(1),
});

export async function POST(req: Request) {
  const { session } = await getCurrent();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { sessionId } = parsed.data;

  try {
    const result = await completeMockInterview(sessionId, session.id);
    try {
      await awardXP(session.id, "MOCK_INTERVIEW_COMPLETED", sessionId, "interview_session");
      await checkAchievements(session.id);
    } catch (gamificationError) {
      console.error("Gamification update failed:", gamificationError);
    }
    return NextResponse.json({ session: result.session, report: result.report });
  } catch (e) {
    const error = e instanceof Error ? e.message : "Failed to complete interview";
    let status = 500;
    if (error === "Session not found") status = 404;
    else if (error.includes("not in progress")) status = 409;
    return NextResponse.json({ error }, { status });
  }
}