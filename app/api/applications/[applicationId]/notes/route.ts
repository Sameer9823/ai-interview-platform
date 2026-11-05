import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrent } from "@/lib/auth/session";
import { db } from "@/lib/db/client";

const noteSchema = z.object({
  content: z.string().min(1).max(10000),
  isPrivate: z.boolean().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  const { session } = await getCurrent();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { applicationId } = await params;

  const application = await db.jobApplication.findFirst({
    where: { id: applicationId, userId: session.id },
    select: { id: true },
  });
  if (!application) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const notes = await db.applicationNote.findMany({
    where: { applicationId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ notes });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  const { session } = await getCurrent();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { applicationId } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const parsed = noteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
  }

  const application = await db.jobApplication.findFirst({
    where: { id: applicationId, userId: session.id },
    select: { id: true },
  });
  if (!application) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const note = await db.applicationNote.create({
    data: {
      applicationId,
      content: parsed.data.content,
      isPrivate: parsed.data.isPrivate ?? true,
    },
  });

  return NextResponse.json({ note }, { status: 201 });
}