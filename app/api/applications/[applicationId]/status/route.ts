import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrent } from "@/lib/auth/session";
import { db } from "@/lib/db/client";

const statusSchema = z.object({
  status: z.enum([
    "INTERESTED", "PREPARING", "APPLIED", "ASSESSMENT", "INTERVIEW_SCHEDULED",
    "INTERVIEW_COMPLETED", "OFFER_RECEIVED", "REJECTED", "WITHDRAWN", "NO_RESPONSE"
  ]),
  note: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  const { session } = await getCurrent();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { applicationId } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
  }

  const { status, note } = parsed.data;

  const existing = await db.jobApplication.findFirst({
    where: { id: applicationId, userId: session.id },
    select: { id: true, status: true },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (existing.status === status) {
    return NextResponse.json({ error: "Status unchanged" }, { status: 400 });
  }

  const application = await db.jobApplication.update({
    where: { id: applicationId },
    data: { status },
  });

  await db.applicationStatusHistory.create({
    data: {
      applicationId,
      fromStatus: existing.status,
      toStatus: status,
      changedBy: session.id,
      note: note || `Status changed from ${existing.status} to ${status}`,
    },
  });

  return NextResponse.json({ application });
}