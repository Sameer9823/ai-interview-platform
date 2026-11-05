import "server-only";
import { db } from "@/lib/db/client";
import { isMutedByUser } from "./moderation";

export async function discoverMembers(
  viewerId: string,
  filters: {
    search?: string;
    careerStage?: string;
    skill?: string;
    targetRole?: string;
    withGroups?: boolean;
    limit?: number;
    cursor?: string;
  }
) {
  const blocked = await db.userBlock.findMany({
    where: { blockerId: viewerId },
    select: { blockedId: true },
  });
  const blockedIds = blocked.map((b) => b.blockedId);

  const where: any = {
    id: { notIn: [...blockedIds, viewerId] },
  };

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  if (filters.skill) {
    where.profile = {
      skillsToImprove: { has: filters.skill },
    };
  }

  if (filters.careerStage) {
    where.careerStage = filters.careerStage as any;
  }

  const cursorCondition: any = {};
  if (filters.cursor) {
    const cursorUser = await db.user.findUnique({
      where: { id: filters.cursor },
      select: { createdAt: true },
    });
    if (cursorUser) {
      cursorCondition.createdAt = { lt: cursorUser.createdAt };
    }
  }

  const users = await db.user.findMany({
    where: { ...where, ...cursorCondition },
    orderBy: { createdAt: "desc" },
    take: (filters.limit || 20) + 1,
    select: {
      id: true,
      name: true,
      careerStage: true,
      careerGoals: {
        where: { status: "ACTIVE" },
        select: { targetRole: true },
      },
      profile: {
        select: {
          targetRole: true,
          experienceLevel: true,
          educationLevel: true,
          primaryProgrammingLanguage: true,
          skillsToImprove: true,
        },
      },
      _count: {
        select: {
          groupMemberships: true,
          achievements: { where: { status: { in: ["UNLOCKED", "CLAIMED"] } } },
        },
      },
    },
  });

  let hasNextPage = false;
  if (users.length > (filters.limit || 20)) {
    hasNextPage = true;
    users.pop();
  }

  return {
    members: users.map((u) => ({
      id: u.id,
      name: u.name,
      careerStage: u.careerStage,
      targetRole: u.careerGoals[0]?.targetRole || u.profile?.targetRole || null,
      experienceLevel: u.profile?.experienceLevel || null,
      educationLevel: u.profile?.educationLevel || null,
      primaryProgrammingLanguage: u.profile?.primaryProgrammingLanguage || null,
      skills: u.profile?.skillsToImprove || [],
      groupCount: u._count.groupMemberships,
      achievementCount: u._count.achievements,
    })),
    hasNextPage,
    nextCursor: users.length > 0 ? (users[users.length - 1]?.id ?? null) : null,
  };
}

export async function getPublicProfile(userId: string, viewerId?: string) {
  if (viewerId && (await isMutedByUser(viewerId, userId))) {
    throw new Error("User is blocked");
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      careerStage: true,
      profile: {
        select: {
          targetRole: true,
          experienceLevel: true,
          educationLevel: true,
          primaryProgrammingLanguage: true,
          skillsToImprove: true,
          currentRole: true,
          yearsOfExperience: true,
        },
      },
      _count: {
        select: {
          groupMemberships: true,
          achievements: { where: { status: { in: ["UNLOCKED", "CLAIMED"] } } },
        },
      },
    },
  });

  if (!user) return null;

  let isFollowing = false;
  if (viewerId) {
    const follow = await db.userFollow.findUnique({
      where: { followerId_followingId: { followerId: viewerId, followingId: userId } },
    });
    isFollowing = !!follow;
  }

  return {
    id: user.id,
    name: user.name,
    careerStage: user.careerStage,
    targetRole: user.profile?.targetRole,
    experienceLevel: user.profile?.experienceLevel,
    educationLevel: user.profile?.educationLevel,
    primaryProgrammingLanguage: user.profile?.primaryProgrammingLanguage,
    skills: user.profile?.skillsToImprove || [],
    currentRole: user.profile?.currentRole,
    yearsOfExperience: user.profile?.yearsOfExperience,
    groupCount: user._count.groupMemberships,
    achievementCount: user._count.achievements,
    isFollowing: viewerId ? isFollowing : null,
  };
}

export async function followUser(followerId: string, followingId: string) {
  if (followerId === followingId) throw new Error("Cannot follow yourself");

  const isMuted = await isMutedByUser(followerId, followingId);
  if (isMuted) throw new Error("Cannot follow a blocked user");

  await db.userFollow.upsert({
    where: { followerId_followingId: { followerId, followingId } },
    create: { followerId, followingId },
    update: {},
  });

  return { following: true };
}

export async function unfollowUser(followerId: string, followingId: string) {
  await db.userFollow.deleteMany({
    where: { followerId, followingId },
  });
  return { following: false };
}
