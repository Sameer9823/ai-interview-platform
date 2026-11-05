import "server-only";
import { db } from "@/lib/db/client";
import { isMutedByUser } from "./moderation";

export interface SearchFilters {
  query: string;
  types: ("posts" | "groups" | "topics" | "members" | "resources")[];
  topicId?: string;
  careerStage?: string;
  limit?: number;
  cursor?: string;
}

export async function communitySearch(userId: string, filters: SearchFilters) {
  const blocked = await db.userBlock.findMany({
    where: { blockerId: userId },
    select: { blockedId: true },
  });
  const blockedIds = blocked.map((b) => b.blockedId);

  const results: {
    posts?: any[];
    groups?: any[];
    topics?: any[];
    members?: any[];
    resources?: any[];
  } = {};

  const limit = filters.limit || 10;

  if (filters.types.includes("posts") && filters.query.length > 0) {
    const posts = await db.communityPost.findMany({
      where: {
        visibility: "PUBLIC",
        authorId: { notIn: [...blockedIds, userId] },
        OR: [
          { title: { contains: filters.query, mode: "insensitive" } },
        ],
      },
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        topic: true,
        author: { select: { id: true, name: true } },
        _count: { select: { comments: true, reactions: true } },
      },
    });
    results.posts = posts;
  }

  if (filters.types.includes("groups") && filters.query.length > 0) {
    const groups = await db.studyGroup.findMany({
      where: {
        visibility: "PUBLIC",
        OR: [
          { name: { contains: filters.query, mode: "insensitive" } },
          { description: { contains: filters.query, mode: "insensitive" } },
          { skill: filters.query },
        ],
      },
      take: limit,
      orderBy: { memberCount: "desc" },
      include: {
        memberships: {
          where: { userId },
          select: { role: true },
        },
      },
    });
    results.groups = groups.map((g) => ({
      ...g,
      userRole: g.memberships.length > 0 ? (g.memberships[0]?.role ?? null) : null,
    }));
  }

  if (filters.types.includes("topics")) {
    const topics = await db.communityTopic.findMany({
      where: filters.query.length > 0
        ? {
            OR: [
              { name: { contains: filters.query, mode: "insensitive" } },
              { description: { contains: filters.query, mode: "insensitive" } },
              { category: { contains: filters.query, mode: "insensitive" } },
            ],
          }
        : {},
      take: limit,
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            posts: { where: { visibility: "PUBLIC" } },
            followers: true,
          },
        },
      },
    });
    results.topics = topics;
  }

  if (filters.types.includes("members") && filters.query.length > 0) {
    const members = await db.user.findMany({
      where: {
        id: { notIn: [...blockedIds, userId] },
        name: { contains: filters.query, mode: "insensitive" },
      },
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        careerStage: true,
        profile: { select: { targetRole: true, skillsToImprove: true } },
        _count: {
          select: {
            groupMemberships: true,
            achievements: { where: { status: { in: ["UNLOCKED", "CLAIMED"] } } },
          },
        },
      },
    });
    results.members = members;
  }

  if (filters.types.includes("resources")) {
    const resources = await db.groupResource.findMany({
      where: {},
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        addedBy: { select: { id: true, name: true } },
      },
    });
    results.resources = resources;
  }

  return results;
}
