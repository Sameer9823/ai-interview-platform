import "server-only";
import { db } from "@/lib/db/client";
import type { Prisma } from "@prisma/client";

export const XP_RULES: Record<string, number> = {
  PRACTICE_SESSION_COMPLETED: 10,
  ASSESSMENT_COMPLETED: 20,
  MOCK_INTERVIEW_COMPLETED: 30,
  ROADMAP_TASK_COMPLETED: 5,
  ROADMAP_MILESTONE_COMPLETED: 50,
  WEEKLY_CHALLENGE_COMPLETED: 40,
  WEAK_TOPIC_REVIEWED: 5,
  RESUME_ANALYSIS_COMPLETED: 15,
  JOB_MATCH_COMPLETED: 10,
  WEEKLY_GOAL_ACHIEVED: 100,
  STREAK_MILESTONE_REACHED: 75,
  PERSONAL_BEST_SET: 50,
};

export const LEVEL_THRESHOLDS: number[] = Array.from({ length: 100 }, (_, i) => Math.floor(100 * Math.pow(1.15, i)));

export function calculateLevel(totalXP: number): number {
  let level = 1;
  for (const threshold of LEVEL_THRESHOLDS) {
    if (totalXP >= threshold) {
      level++;
    } else {
      break;
    }
  }
  return level;
}

export function calculateProgressToNextLevel(totalXP: number): { current: number; next: number; progress: number } {
  const currentLevel = calculateLevel(totalXP);
  const currentThreshold = currentLevel === 1 ? 0 : (LEVEL_THRESHOLDS[currentLevel - 2] ?? 0);
  const nextThreshold = (LEVEL_THRESHOLDS[currentLevel - 1] ?? (currentThreshold + 1000));
  const progress = ((totalXP - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
  return { current: currentThreshold ?? 0, next: nextThreshold, progress: Math.max(0, Math.min(100, progress)) };
}

export async function getOrCreateGamificationProfile(userId: string) {
  const existing = await db.gamificationProfile.findUnique({
    where: { userId },
  });
  if (existing) return existing;

  return db.gamificationProfile.create({
    data: {
      userId,
      totalXP: 0,
      currentLevel: 1,
      currentStreak: 0,
      longestStreak: 0,
      timezone: "UTC",
    },
  });
}

export async function awardXP(
  userId: string,
  activityType: string,
  sourceRecordId: string,
  sourceRecordType: string,
  xpAmount?: number
): Promise<{ newTotalXP: number; newLevel: number; leveledUp: boolean; xp: number }> {
  const xp = xpAmount ?? XP_RULES[activityType] ?? 10;

  const profile = await getOrCreateGamificationProfile(userId);
  const oldLevel = profile.currentLevel;

  const transaction = await db.xPTransaction.create({
    data: {
      userId,
      activityType: activityType as any,
      sourceRecordId,
      sourceRecordType,
      xpAmount: xp,
      transactionType: "EARNED",
    },
  });

  const newTotalXP = profile.totalXP + xp;
  const newLevel = calculateLevel(newTotalXP);

  await db.gamificationProfile.update({
    where: { userId },
    data: {
      totalXP: newTotalXP,
      currentLevel: newLevel,
    },
  });

  if (newLevel > oldLevel) {
    await db.gamificationEvent.create({
      data: {
        userId,
        eventType: "LEVEL_UP",
        xpAmount: xp,
        description: `Level ${oldLevel} → ${newLevel}`,
        metadata: { oldLevel, newLevel, activityType },
      },
    });
  }

  await updateStreak(userId, newTotalXP);

  return { newTotalXP, newLevel, leveledUp: newLevel > oldLevel, xp };
}

export async function updateStreak(userId: string, totalXP: number): Promise<{ currentStreak: number; longestStreak: number; milestone: boolean }> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existing = await db.learningStreakHistory.findUnique({
    where: {
      userId_date: {
        userId,
        date: today,
      },
    },
  });

  if (existing) {
    return { currentStreak: 0, longestStreak: 0, milestone: false };
  }

  await db.learningStreakHistory.create({
    data: {
      userId,
      date: today,
      activityCount: 1,
      xpEarned: 0,
    },
  });

  const profile = await db.gamificationProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    return { currentStreak: 0, longestStreak: 0, milestone: false };
  }

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const yesterdayRecord = await db.learningStreakHistory.findUnique({
    where: {
      userId_date: {
        userId,
        date: yesterday,
      },
    },
  });

  let currentStreak: number;
  let milestone = false;

  if (yesterdayRecord) {
    currentStreak = profile.currentStreak + 1;
  } else {
    currentStreak = 1;
  }

  if (profile.lastActivityAt) {
    const lastActivity = new Date(profile.lastActivityAt);
    lastActivity.setHours(0, 0, 0, 0);
    const diffDays = Math.round((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays > 1 && diffDays <= 7) {
      currentStreak = 1;
    } else if (diffDays > 7) {
      currentStreak = 1;
    }
  }

  let longestStreak = Math.max(profile.longestStreak, currentStreak);

  if (currentStreak > 0 && currentStreak % 7 === 0) {
    milestone = true;
    await db.gamificationEvent.create({
      data: {
        userId,
        eventType: "STREAK_MILESTONE_REACHED",
        xpAmount: 0,
        description: `${currentStreak} day streak!`,
        metadata: { streak: currentStreak },
      },
    });
    await awardXP(userId, "STREAK_MILESTONE_REACHED", `streak-${currentStreak}`, "streak");
  }

  await db.gamificationProfile.update({
    where: { userId },
    data: {
      currentStreak,
      longestStreak,
      lastActivityAt: new Date(),
    },
  });

  return { currentStreak, longestStreak: longestStreak, milestone };
}

export interface AchievementCheckResult {
  unlocked: boolean;
  achievement?: {
    id: string;
    identifier: string;
    name: string;
    description: string;
    xpReward: number;
  };
}

export async function checkAchievements(userId: string): Promise<AchievementCheckResult[]> {
  const definitions = await db.achievementDefinition.findMany({
    where: { isPublished: true },
  });

  const results: AchievementCheckResult[] = [];

  for (const def of definitions) {
    const criteria = def.criteriaJson as any;
    let achieved = false;

    switch (criteria.type) {
      case "count": {
        const total = await db.xPTransaction.count({
          where: {
            userId,
            activityType: criteria.activityType,
          },
        });
        achieved = total >= (criteria.minCount || def.progressTarget || 1);
        break;
      }
      case "level": {
        const profile = await db.gamificationProfile.findUnique({
          where: { userId },
        });
        achieved = (profile?.currentLevel || 0) >= (criteria.minLevel || 1);
        break;
      }
      case "streak": {
        const profile = await db.gamificationProfile.findUnique({
          where: { userId },
        });
        achieved = (profile?.longestStreak || 0) >= (criteria.minStreak || 1);
        break;
      }
      case "total_xp": {
        const profile = await db.gamificationProfile.findUnique({
          where: { userId },
        });
        achieved = (profile?.totalXP || 0) >= (criteria.minXP || 1);
        break;
      }
      case "assessment_passed": {
        const passed = await db.assessmentAttempt.count({
          where: { userId, passed: true },
        });
        achieved = passed >= (criteria.minCount || 1);
        break;
      }
    }

    if (!achieved) continue;

    const existing = await db.userAchievement.findUnique({
      where: {
        userId_achievementDefinitionId: {
          userId,
          achievementDefinitionId: def.id,
        },
      },
    });

    if (existing?.status === "CLAIMED" || existing?.status === "UNLOCKED") continue;

    const userAchievement = await db.userAchievement.upsert({
      where: {
        userId_achievementDefinitionId: {
          userId,
          achievementDefinitionId: def.id,
        },
      },
      create: {
        userId,
        achievementDefinitionId: def.id,
        status: "UNLOCKED",
        progressValue: 0,
        progressTarget: def.progressTarget ?? 0,
        unlockedAt: new Date(),
      },
      update: {
        status: "UNLOCKED",
        unlockedAt: new Date(),
      },
    });

    if (def.xpReward > 0) {
      await awardXP(userId, "ACHIEVEMENT_UNLOCKED", def.id, "achievement", def.xpReward);
    }

    results.push({
      unlocked: true,
      achievement: {
        id: def.id,
        identifier: def.identifier,
        name: def.name,
        description: def.description,
        xpReward: def.xpReward,
      },
    });
  }

  return results;
}

export async function getDashboardData(userId: string) {
  const profile = await getOrCreateGamificationProfile(userId);
  const levelProgress = calculateProgressToNextLevel(profile.totalXP);

  const recentXP = await db.xPTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const recentEvents = await db.gamificationEvent.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const unlockedAchievements = await db.userAchievement.findMany({
    where: { userId, status: { in: ["UNLOCKED", "CLAIMED"] } },
    include: { achievementDefinition: true },
    orderBy: { updatedAt: "desc" },
  });

  const inProgressAchievements = await db.userAchievement.findMany({
    where: { userId, status: "IN_PROGRESS" },
    include: { achievementDefinition: true },
    orderBy: { updatedAt: "desc" },
  });

  return {
    profile: {
      totalXP: profile.totalXP,
      currentLevel: profile.currentLevel,
      currentStreak: profile.currentStreak,
      longestStreak: profile.longestStreak,
      levelProgress: levelProgress.progress,
    },
    recentXP,
    recentEvents,
    unlockedAchievements: unlockedAchievements.map((ua) => ({
      id: ua.id,
      name: ua.achievementDefinition.name,
      description: ua.achievementDefinition.description,
      icon: ua.achievementDefinition.icon,
      category: ua.achievementDefinition.category,
      unlockedAt: ua.unlockedAt,
    })),
    inProgressAchievements: inProgressAchievements.map((ua) => ({
      id: ua.id,
      name: ua.achievementDefinition.name,
      description: ua.achievementDefinition.description,
      icon: ua.achievementDefinition.icon,
      progress: ua.progressValue,
      target: ua.progressTarget ?? ua.achievementDefinition.progressTarget ?? 0,
    })),
  };
}

export async function getLeaderboard(scope: string = "WEEKLY_ACTIVITY", limit: number = 20) {
  const now = new Date();
  const periodStart = new Date(now);
  periodStart.setDate(periodStart.getDate() - 7);

  return db.leaderboardEntry.findMany({
    where: {
      scope: scope as any,
      periodStart: { gte: periodStart },
    },
    orderBy: { rank: "asc" },
    take: limit,
    include: { user: { select: { name: true, email: true } } },
  });
}
