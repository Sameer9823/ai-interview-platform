import { NextResponse } from "next/server";
import { getCurrent } from "@/lib/auth/session";
import { getMockInterviewSession } from "@/lib/ai/services/mock-interview-orchestrator";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session } = await getCurrent();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const mockInterview = await getMockInterviewSession(id, session.id);
    if (!mockInterview) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ mockInterview });
  } catch (e) {
    console.error("Get mock interview error:", e);
    return NextResponse.json({ error: "Failed to load interview" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session } = await getCurrent();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    // Soft delete by marking as cancelled
    const { db } = await import("@/lib/db/client");
    await db.mockInterviewSession.update({
      where: { id, userId: session.id },
      data: { status: "CANCELLED" },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Delete mock interview error:", e);
    return NextResponse.json({ error: "Failed to delete interview" }, { status: 500 });
  }
}