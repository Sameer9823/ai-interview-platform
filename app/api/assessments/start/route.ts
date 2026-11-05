import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrent } from "@/lib/auth/session";
import { db as prisma } from "@/lib/db/client";

const body = z.object({ assessmentId: z.string().min(1) });

export async function POST(req: Request) {
  const { session } = await getCurrent();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const a = await prisma.assessment.findFirst({ where: { id: parsed.data.assessmentId, status: "PUBLISHED" } });
  if (!a) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const deadline = new Date(Date.now() + a.timeLimitMinutes * 60_000);
  const attempt = await prisma.assessmentAttempt.create({
    data: { assessmentId: a.id, userId: session.id, deadlineAt: deadline, maxScore: 0 },
  });
  return NextResponse.json({ attemptId: attempt.id, deadlineAt: attempt.deadlineAt });
}
