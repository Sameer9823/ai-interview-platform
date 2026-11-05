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

  const resume = await db.resume.findFirst({
    where: { id, userId: session.id },
    include: {
      versions: {
        orderBy: { versionNumber: "desc" },
        include: {
          extractedProfile: true,
          analyses: {
            orderBy: { createdAt: "desc" },
            take: 5,
            include: { categories: true },
          },
          _count: { select: { analyses: true, jobMatches: true } },
        },
      },
      _count: { select: { versions: true, processingJobs: true } },
    },
  });

  if (!resume) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ resume });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session } = await getCurrent();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const resume = await db.resume.findFirst({
    where: { id, userId: session.id },
    include: { versions: true },
  });
  if (!resume) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Soft delete - mark as DELETED
  await db.resume.update({
    where: { id },
    data: { status: "DELETED" },
  });

  // Delete associated files from storage (in production)
  // await deleteFile(resume.storageKey);
  // for (const v of resume.versions) await deleteFile(v.storageKey);

  return NextResponse.json({ ok: true });
}