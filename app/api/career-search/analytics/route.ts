import { NextRequest, NextResponse } from "next/server";
import { getCurrent } from "@/lib/auth/session";
import { db } from "@/lib/db/client";

export async function GET(req: NextRequest) {
  const { session } = await getCurrent();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const period = url.searchParams.get("period") || "30d";

  const now = new Date();
  let startDate: Date;
  switch (period) {
    case "7d": startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
    case "30d": startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); break;
    case "90d": startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); break;
    case "1y": startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000); break;
    default: startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  const [
    totalApplications,
    applicationsByStatus,
    applicationsOverTime,
    interviewsScheduled,
    assessmentsCompleted,
    offersReceived,
    followUpsDue,
    savedOpportunities,
    preparationActivities,
  ] = await Promise.all([
    db.jobApplication.count({ where: { userId: session.id, createdAt: { gte: startDate } } }),
    db.jobApplication.groupBy({
      by: ["status"],
      where: { userId: session.id, createdAt: { gte: startDate } },
      _count: { status: true },
    }),
    db.$queryRaw`
      SELECT DATE_TRUNC('day', "createdAt") as date, COUNT(*) as count
      FROM "JobApplication"
      WHERE "userId" = ${session.id} AND "createdAt" >= ${startDate}
      GROUP BY DATE_TRUNC('day', "createdAt")
      ORDER BY date ASC
    `,
    db.jobApplication.count({
      where: { userId: session.id, status: "INTERVIEW_SCHEDULED", createdAt: { gte: startDate } },
    }),
    db.jobApplication.count({
      where: { userId: session.id, status: "ASSESSMENT", createdAt: { gte: startDate } },
    }),
    db.jobApplication.count({
      where: { userId: session.id, status: "OFFER_RECEIVED", createdAt: { gte: startDate } },
    }),
    db.applicationReminder.count({
      where: { application: { userId: session.id }, dueDate: { gte: now, lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) }, isCompleted: false },
    }),
    db.savedOpportunity.count({ where: { userId: session.id, createdAt: { gte: startDate } } }),
    db.mockInterviewSession.count({ where: { userId: session.id, createdAt: { gte: startDate } } }),
  ]);

  const statusCounts = applicationsByStatus.reduce((acc, item) => {
    acc[item.status] = Number(item._count.status);
    return acc;
  }, {} as Record<string, number>);

  const applicationToInterview = statusCounts.APPLIED
    ? (statusCounts.INTERVIEW_SCHEDULED ?? 0) / statusCounts.APPLIED
    : 0;
  const interviewToOffer = statusCounts.INTERVIEW_SCHEDULED
    ? (statusCounts.OFFER_RECEIVED ?? 0) / statusCounts.INTERVIEW_SCHEDULED
    : 0;

  return NextResponse.json({
    period,
    totals: {
      applications: totalApplications,
      interviews: statusCounts.INTERVIEW_SCHEDULED ?? 0,
      assessments: statusCounts.ASSESSMENT ?? 0,
      offers: statusCounts.OFFER_RECEIVED ?? 0,
      rejections: statusCounts.REJECTED ?? 0,
      followUpsDue,
      savedOpportunities,
      preparationActivities,
    },
    byStatus: statusCounts,
    overTime: applicationsOverTime,
    ratios: {
      applicationToInterview: Math.round(applicationToInterview * 100) / 100,
      interviewToOffer: Math.round(interviewToOffer * 100) / 100,
    },
    sampleSize: totalApplications,
    note: totalApplications < 10 ? "Insufficient data for reliable ratios" : "Data based on your application history",
  });
}