import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrent } from "@/lib/auth/session";
import { startMockInterview } from "@/lib/ai/services/mock-interview-orchestrator";

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
    const started = await startMockInterview(sessionId, session.id);
    return NextResponse.json({ session: started });
  } catch (e) {
    const error = e instanceof Error ? e.message : "Failed to start interview";
    const status = error === "Session not found" ? 404 : error.includes("status") ? 409 : 500;
    return NextResponse.json({ error }, { status });
  }
}