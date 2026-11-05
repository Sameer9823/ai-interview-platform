import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrent } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { awardXP } from "@/lib/gamification";

const applicationSchema = z.object({
  opportunityId: z.string().optional(),
  companyId: z.string().optional(),
  jobTitle: z.string().min(1).max(200),
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

export async function GET(req: NextRequest) {
  const { session } = await getCurrent();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const cursor = url.searchParams.get("cursor");
  const limit = parseInt(url.searchParams.get("limit") || "20", 10);
  const search = url.searchParams.get("search");

  const where: any = { userId: session.id };
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { jobTitle: { contains: search, mode: "insensitive" } },
      { company: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  const cursorCondition: any = {};
  if (cursor) {
    const cursorApp = await db.jobApplication.findUnique({
      where: { id: cursor },
      select: { createdAt: true },
    });
    if (cursorApp) cursorCondition.createdAt = { lt: cursorApp.createdAt };
  }

  const [applications, totalCount] = await Promise.all([
    db.jobApplication.findMany({
      where: { ...where, ...cursorCondition },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      include: {
        opportunity: { select: { id: true, title: true, company: { select: { name: true, logoUrl: true } } } },
        company: { select: { id: true, name: true, logoUrl: true } },
        resumeVersion: { select: { id: true, versionNumber: true } },
        mockInterviewSession: { select: { id: true, mode: true } },
        _count: { select: { notes_list: true, reminders: true, events: true } },
      },
    }),
    db.jobApplication.count({ where }),
  ]);

  let hasNextPage = false;
  if (applications.length > limit) {
    hasNextPage = true;
    applications.pop();
  }

  return NextResponse.json({
    applications,
    hasNextPage,
    nextCursor: applications.length > 0 ? applications[applications.length - 1]!.id : null,
    totalCount,
  });
}

export async function POST(req: NextRequest) {
  const { session } = await getCurrent();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const parsed = applicationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
  }

  const data = parsed.data;

  if (data.opportunityId) {
    const opportunity = await db.careerOpportunity.findUnique({
      where: { id: data.opportunityId },
      select: { id: true, companyId: true },
    });
    if (!opportunity) return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
    if (!data.companyId) data.companyId = opportunity.companyId;
  }

  const application = await db.jobApplication.create({
    data: {
      userId: session.id,
      ...data,
      applicationDate: data.applicationDate ? new Date(data.applicationDate) : null,
      nextFollowUpDate: data.nextFollowUpDate ? new Date(data.nextFollowUpDate) : null,
    },
    include: {
      opportunity: { select: { id: true, title: true, company: { select: { name: true } } } },
      company: { select: { id: true, name: true } },
    },
  });

  await db.applicationStatusHistory.create({
    data: {
      applicationId: application.id,
      fromStatus: null,
      toStatus: application.status,
      changedBy: session.id,
      note: "Application created",
    },
  });

  await awardXP(session.id, "JOB_MATCH_COMPLETED", application.id, "job_application");

  return NextResponse.json({ application }, { status: 201 });
}