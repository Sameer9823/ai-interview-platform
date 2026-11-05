import { NextRequest, NextResponse } from "next/server";
import { getCurrent } from "@/lib/auth/session";
import { db } from "@/lib/db/client";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  const { session } = await getCurrent();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { applicationId } = await params;

  const application = await db.jobApplication.findFirst({
    where: { id: applicationId, userId: session.id },
    include: {
      opportunity: {
        select: {
          id: true,
          title: true,
          company: { select: { id: true, name: true, logoUrl: true, industry: true } },
          location: true,
          workArrangement: true,
          employmentType: true,
          salaryMin: true,
          salaryMax: true,
          salaryCurrency: true,
          applicationUrl: true,
          applicationDeadline: true,
        },
      },
      company: { select: { id: true, name: true, logoUrl: true, website: true } },
      resumeVersion: { select: { id: true, versionNumber: true, targetRole: true } },
      mockInterviewSession: { select: { id: true, mode: true, status: true } },
      statusHistory: { orderBy: { changedAt: "desc" } },
      notes_list: { orderBy: { createdAt: "desc" } },
      reminders: { orderBy: { dueDate: "asc" } },
      events: { orderBy: { eventDate: "asc" } },
      attachments: { orderBy: { uploadedAt: "desc" } },
    },
  });

  if (!application) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ application });
}

const updateSchema = z.object({
  jobTitle: z.string().min(1).max(200).optional(),
  applicationUrl: z.string().url().optional(),
  applicationDate: z.string().datetime().optional(),
  status: z.enum([
    "INTERESTED", "PREPARING", "APPLIED", "ASSESSMENT", "INTERVIEW_SCHEDULED",
    "INTERVIEW_COMPLETED", "OFFER_RECEIVED", "REJECTED", "WITHDRAWN", "NO_RESPONSE"
  ]).optional(),
  contactName: z.string().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  salaryExpectationMin: z.coerce.number().optional(),
  salaryExpectationMax: z.coerce.number().optional(),
  salaryCurrency: z.string().optional(),
  notes: z.string().optional(),
  resumeVersionId: z.string().optional(),
  mockInterviewSessionId: z.string().optional(),
  nextFollowUpDate: z.string().datetime().optional(),
  customTags: z.array(z.string()).optional(),
});

import { z } from "zod";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  const { session } = await getCurrent();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { applicationId } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
  }

  const data = parsed.data;

  const existing = await db.jobApplication.findFirst({
    where: { id: applicationId, userId: session.id },
    select: { id: true, status: true },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updateData: any = { ...data };
  if (data.applicationDate) updateData.applicationDate = new Date(data.applicationDate);
  if (data.nextFollowUpDate) updateData.nextFollowUpDate = new Date(data.nextFollowUpDate);

  const application = await db.jobApplication.update({
    where: { id: applicationId },
    data: updateData,
  });

  if (data.status && data.status !== existing.status) {
    await db.applicationStatusHistory.create({
      data: {
        applicationId,
        fromStatus: existing.status,
        toStatus: data.status,
        changedBy: session.id,
        note: `Status changed from ${existing.status} to ${data.status}`,
      },
    });
  }

  return NextResponse.json({ application });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  const { session } = await getCurrent();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { applicationId } = await params;

  const existing = await db.jobApplication.findFirst({
    where: { id: applicationId, userId: session.id },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.jobApplication.delete({ where: { id: applicationId } });

  return NextResponse.json({ success: true });
}