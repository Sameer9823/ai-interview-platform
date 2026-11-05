import "server-only";
import { db } from "@/lib/db/client";

export async function submitReport(
  userId: string,
  targetType: string,
  targetId: string,
  reason: string,
  details?: string
) {
  const validReasons = [
    "SPAM",
    "HARASSMENT",
    "HATE_OR_ABUSE",
    "MISINFORMATION",
    "COPYRIGHT",
    "SCAM",
    "INAPPROPRIATE",
    "OTHER",
  ];
  if (!validReasons.includes(reason)) throw new Error("Invalid report reason");

  const report = await db.communityReport.create({
    data: {
      reporterId: userId,
      targetType,
      targetId,
      reason: reason as any,
      details,
    },
  });

  return report;
}

export async function getReportQueue(moderatorId: string, limit: number = 20, cursor?: string) {
  const isModerator = await isModeratorOrAdmin(moderatorId);
  if (!isModerator) throw new Error("Unauthorized");

  const where: any = { status: "PENDING" };
  if (cursor) {
    const cursorReport = await db.communityReport.findUnique({
      where: { id: cursor },
      select: { createdAt: true },
    });
    if (cursorReport) {
      where.createdAt = { lt: cursorReport.createdAt };
    }
  }

  const reports = await db.communityReport.findMany({
    where,
    orderBy: { createdAt: "asc" },
    take: limit + 1,
    include: {
      reporter: { select: { id: true, name: true } },
      reviewer: { select: { id: true, name: true } },
    },
  });

  let hasNextPage = false;
  if (reports.length > limit) {
    hasNextPage = true;
    reports.pop();
  }

  return {
    reports: reports.map((r) => ({
      id: r.id,
      targetType: r.targetType,
      targetId: r.targetId,
      reason: r.reason,
      details: r.details,
      status: r.status,
      actionTaken: r.actionTaken,
      createdAt: r.createdAt,
      reporter: r.reporter,
      reviewer: r.reviewer,
    })),
    hasNextPage,
    nextCursor: reports.length > 0 ? (reports[reports.length - 1]?.id ?? null) : null,
  };
}

export async function reviewReport(
  moderatorId: string,
  reportId: string,
  action: "RESOLVE" | "DISMISS",
  actionDetails?: string
) {
  const isMod = await isModeratorOrAdmin(moderatorId);
  if (!isMod) throw new Error("Unauthorized");

  const report = await db.communityReport.findUnique({
    where: { id: reportId },
  });
  if (!report) throw new Error("Report not found");
  if (report.status !== "PENDING") throw new Error("Report already processed");

  await db.communityReport.update({
    where: { id: reportId },
    data: {
      status: action === "RESOLVE" ? "RESOLVED" : "DISMISSED",
      reviewerId: moderatorId,
      actionTaken: actionDetails,
    },
  });

  await db.inAppNotification.create({
    data: {
      userId: report.reporterId,
      type: "REPORT_RESOLVED",
      title: "Report reviewed",
      body: `Your report (${report.reason}) has been ${action === "RESOLVE" ? "resolved" : "dismissed"}. Action: ${actionDetails || "None"}.`,
    },
  });

  return { success: true };
}

export async function blockUser(blockerId: string, blockedId: string) {
  if (blockerId === blockedId) throw new Error("Cannot block yourself");

  await db.userBlock.upsert({
    where: { blockerId_blockedId: { blockerId, blockedId } },
    create: { blockerId, blockedId },
    update: {},
  });

  return { blocked: true };
}

export async function unblockUser(blockerId: string, blockedId: string) {
  await db.userBlock.deleteMany({
    where: { blockerId, blockedId },
  });
  return { blocked: false };
}

export async function getBlockedUsers(userId: string) {
  return db.userBlock.findMany({
    where: { blockerId: userId },
    include: { blocked: { select: { id: true, name: true } } },
  });
}

export async function isMutedByUser(userId: string, authorId: string): Promise<boolean> {
  if (userId === authorId) return false;

  const block = await db.userBlock.findUnique({
    where: { blockerId_blockedId: { blockerId: userId, blockedId: authorId } },
  });
  return !!block;
}

async function isModeratorOrAdmin(userId: string): Promise<boolean> {
  const adminRoleModels = await db.studyGroupMembership.findFirst({
    where: { userId, role: { in: ["OWNER", "ADMIN", "MODERATOR"] } },
  });
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { platformRole: true },
  });
  return !!(adminRoleModels || user?.platformRole === "ADMIN");
}
