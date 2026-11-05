import { NextResponse } from "next/server";
import { getCurrent } from "@/lib/auth/session";
import { db } from "@/lib/db/client";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session } = await getCurrent();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const jd = await db.jobDescription.findFirst({
    where: { id, userId: session.id },
    include: {
      matches: {
        include: { resumeVersion: { select: { id: true, versionNumber: true, resume: { select: { fileName: true } } } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!jd) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ jobDescription: jd });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session } = await getCurrent();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const jd = await db.jobDescription.findFirst({
    where: { id, userId: session.id },
  });
  if (!jd) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.jobDescription.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}