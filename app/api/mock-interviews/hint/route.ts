import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrent } from "@/lib/auth/session";
import { requestHint, skipQuestion } from "@/lib/ai/services/mock-interview-orchestrator";

const bodySchema = z.object({
  sessionId: z.string().min(1),
  questionId: z.string().min(1),
  action: z.enum(["hint", "skip"]),
});

export async function POST(req: Request) {
  const { session } = await getCurrent();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { sessionId, questionId, action } = parsed.data;

  try {
    if (action === "hint") {
      const result = await requestHint(sessionId, session.id, questionId);
      return NextResponse.json({ hint: result.hint });
    } else if (action === "skip") {
      const answer = await skipQuestion(sessionId, session.id, questionId);
      return NextResponse.json({ answer });
    }
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (e) {
    const error = e instanceof Error ? e.message : "Failed to process action";
    let status = 500;
    if (error === "Session not found") status = 404;
    else if (error.includes("not in progress") || error.includes("current question")) status = 409;
    else if (error.includes("Unauthorized") || error.includes("Forbidden")) status = 403;
    return NextResponse.json({ error }, { status });
  }
}