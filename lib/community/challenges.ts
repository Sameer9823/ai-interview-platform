import "server-only";
import { db } from "@/lib/db/client";
import { awardXP, checkAchievements } from "@/lib/gamification";
import { getGroupMembership, requireRole, GroupRole } from "./study-groups";

export interface ChallengeConfig {
  title: string;
  description?: string;
  challengeType: string;
  startDate: Date;
  endDate: Date;
  targetValue: number;
  xpReward?: number;
}

export async function createGroupChallenge(
  groupId: string,
  creatorId: string,
  config: ChallengeConfig
) {
  const groupRole = await getGroupMembership(groupId, creatorId);
  requireRole("ADMIN", groupRole);

  const challenge = await db.groupChallenge.create({
    data: {
      groupId,
      title: config.title,
      description: config.description,
      challengeType: config.challengeType,
      startDate: config.startDate,
      endDate: config.endDate,
      targetValue: config.targetValue,
      xpReward: config.xpReward,
      createdBy: creatorId,
      status: "DRAFT",
    },
  });

  return challenge;
}

export async function activateChallenge(challengeId: string, adminId: string) {
  let challenge = await db.groupChallenge.findUnique({
    where: { id: challengeId },
    select: { groupId: true, targetValue: true },
  });
  if (!challenge) throw new Error("Challenge not found");

  const groupRole = await getGroupMembership(challenge.groupId, adminId);
  requireRole("ADMIN", groupRole);

  await db.groupChallenge.update({
    where: { id: challengeId },
    data: { status: "ACTIVE" },
  });

  const members = await db.studyGroupMembership.findMany({
    where: { groupId: challenge.groupId },
    select: { userId: true },
  });

  for (const member of members) {
    await db.groupChallengeParticipation.create({
      data: {
        challengeId,
        userId: member.userId,
        targetValue: challenge.targetValue,
      },
    });
  }

  return { activated: true };
}

export async function joinChallenge(userId: string, challengeId: string) {
  const challenge = await db.groupChallenge.findUnique({
    where: { id: challengeId },
    select: { groupId: true, status: true, endDate: true, targetValue: true },
  });
  if (!challenge) throw new Error("Challenge not found");
  if (challenge.status !== "ACTIVE") throw new Error("Challenge not active");

  const groupRole = await getGroupMembership(challenge.groupId, userId);
  if (!groupRole) throw new Error("Must be a group member to join challenge");

  const existing = await db.groupChallengeParticipation.findUnique({
    where: { challengeId_userId: { challengeId, userId } },
  });
  if (existing) throw new Error("Already participating");

  await db.groupChallengeParticipation.create({
    data: {
      challengeId,
      userId,
      targetValue: challenge.targetValue,
    },
  });

  return { joined: true };
}

export async function getChallengeProgress(userId: string, challengeId: string) {
  const challenge = await db.groupChallenge.findUnique({
    where: { id: challengeId },
    include: {
      participations: {
        where: { userId },
        select: { progress: true, targetValue: true, status: true },
      },
    },
  });
  if (!challenge) throw new Error("Challenge not found");

  const userParticipation = challenge.participations[0];

  return {
    challenge: {
      id: challenge.id,
      groupId: challenge.groupId,
      title: challenge.title,
      description: challenge.description,
      challengeType: challenge.challengeType,
      startDate: challenge.startDate,
      endDate: challenge.endDate,
      targetValue: challenge.targetValue,
      xpReward: challenge.xpReward,
      status: challenge.status,
    },
    progress: userParticipation
      ? {
          current: userParticipation.progress,
          target: userParticipation.targetValue,
          percentage: (userParticipation.progress / userParticipation.targetValue) * 100,
          status: userParticipation.status,
        }
      : null,
  };
}

export async function recordChallengeActivity(
  challengeId: string,
  userId: string,
  activityType: string,
  sourceRecordId: string
): Promise<{ completed: boolean; xpAwarded: number }> {
  const challenge = await db.groupChallenge.findUnique({
    where: { id: challengeId },
    select: { groupId: true, challengeType: true, endDate: true, status: true, xpReward: true, targetValue: true },
  });
  if (!challenge) throw new Error("Challenge not found");
  if (challenge.status !== "ACTIVE") throw new Error("Challenge not active");
  if (new Date() > challenge.endDate) throw new Error("Challenge has ended");

  const participation = await db.groupChallengeParticipation.findUnique({
    where: { challengeId_userId: { challengeId, userId } },
  });
  if (!participation) throw new Error("Not participating in this challenge");
  if (participation.status === "COMPLETED") return { completed: true, xpAwarded: 0 };

  const expectedActivity = getChallengeActivityType(challenge.challengeType);
  if (activityType !== expectedActivity) return { completed: false, xpAwarded: 0 };

  const existingTx = await db.xPTransaction.findFirst({
    where: {
      userId,
      sourceRecordId,
      sourceRecordType: `challenge:${challengeId}`,
      activityType: activityType as any,
    },
  });

  if (existingTx) {
    return { completed: participation.progress >= participation.targetValue, xpAwarded: 0 };
  }

  await db.xPTransaction.create({
    data: {
      userId,
      activityType: activityType as any,
      sourceRecordId,
      sourceRecordType: `challenge:${challengeId}`,
      xpAmount: 1,
      transactionType: "EARNED",
    },
  });

  let newProgress = participation.progress + 1;
  let xpAwarded = 0;
  let completed = false;

  if (newProgress >= participation.targetValue) {
    newProgress = participation.targetValue;
    completed = true;
    await db.groupChallengeParticipation.update({
      where: { challengeId_userId: { challengeId, userId } },
      data: { progress: newProgress, status: "COMPLETED" },
    });

    if (challenge.xpReward && challenge.xpReward > 0) {
      await awardXP(userId, "WEEKLY_CHALLENGE_COMPLETED", challengeId, "group_challenge", challenge.xpReward);
      xpAwarded = challenge.xpReward;
    }
  } else {
    await db.groupChallengeParticipation.update({
      where: { challengeId_userId: { challengeId, userId } },
      data: { progress: newProgress },
    });
  }

  await checkAchievements(userId);

  return { completed, xpAwarded };
}

function getChallengeActivityType(challengeType: string): string {
  const mapping: Record<string, string> = {
    PRACTICE_QUESTIONS: "PRACTICE_SESSION_COMPLETED",
    ASSESSMENTS: "ASSESSMENT_COMPLETED",
    MOCK_INTERVIEWS: "MOCK_INTERVIEW_COMPLETED",
    ROADMAP_TASKS: "ROADMAP_TASK_COMPLETED",
    TOPIC_REVIEWS: "WEAK_TOPIC_REVIEWED",
    RESUME_ANALYSIS: "RESUME_ANALYSIS_COMPLETED",
    JOB_MATCHING: "JOB_MATCH_COMPLETED",
  };
  return mapping[challengeType] || "PRACTICE_SESSION_COMPLETED";
}

export async function getGroupChallenges(groupId: string, userId: string) {
  const challenges = await db.groupChallenge.findMany({
    where: { groupId },
    orderBy: { createdAt: "desc" },
    include: {
      participations: {
        where: { userId },
        select: { progress: true, targetValue: true, status: true },
      },
      _count: {
        select: { participations: true },
      },
    },
  });

  return challenges.map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    challengeType: c.challengeType,
    startDate: c.startDate,
    endDate: c.endDate,
    targetValue: c.targetValue,
    xpReward: c.xpReward,
    status: c.status,
    participantCount: c._count.participations,
    userProgress: c.participations[0]
      ? {
          current: c.participations[0].progress,
          target: c.participations[0].targetValue,
          status: c.participations[0].status,
        }
      : null,
  }));
}

export async function getGroupLeaderboard(groupId: string, challengeId: string | null = null) {
  const where: any = { groupId };
  if (challengeId) {
    where.challengeId = challengeId;
  } else {
    where.createdAt = {
      gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    };
  }

  const leaderboard = await db.xPTransaction.groupBy({
    by: ["userId"],
    where: {
      userId: { in: [] },
    },
    _sum: { xpAmount: true },
  });

  return leaderboard;
}
