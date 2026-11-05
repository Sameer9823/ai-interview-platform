import { NextResponse } from "next/server";
import { getCurrent } from "@/lib/auth/session";
import { db } from "@/lib/db/client";

const validStatuses = ["IN_PROGRESS", "COMPLETED", "ABANDONED"] as const;
type PracticeStatus = typeof validStatuses[number];

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, record } = await getCurrent();
  if (!session || !record) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const practiceSession = await db.practiceSession.findUnique({
    where: { id, userId: record.id },
    include: {
      questions: { orderBy: { position: "asc" }, include: { generatedQuestion: true } },
      answers: { include: { evaluation: true } },
    },
  });

  if (!practiceSession) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ session: practiceSession });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, record } = await getCurrent();
  if (!session || !record) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const body = await req.json().catch(() => ({}));
  const status = body?.status as PracticeStatus | undefined;

  if (status && !validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const practiceSession = await db.practiceSession.findUnique({
    where: { id },
    select: { userId: true },
  });
  if (!practiceSession || practiceSession.userId !== record.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await db.practiceSession.update({
    where: { id },
    data: {
      ...(status ? { status } : {}),
      completedAt: status === "COMPLETED" ? new Date() : undefined,
    },
  });

  return NextResponse.json({ session: updated });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, record } = await getCurrent();
  if (!session || !record) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const practiceSession = await db.practiceSession.findUnique({
    where: { id },
    select: { userId: true },
  });
  if (!practiceSession || practiceSession.userId !== record.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.practiceSession.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
