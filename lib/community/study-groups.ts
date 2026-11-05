import "server-only";
import { db } from "@/lib/db/client";
import type { Prisma } from "@prisma/client";

export type ModeratorPermission = "MODERATE_DISCUSSIONS" | "MANAGE_RESOURCES" | "PIN_ITEMS";
export type GroupRole = "OWNER" | "ADMIN" | "MODERATOR" | "MEMBER";

export function roleLevel(role: GroupRole): number {
  const levels: Record<GroupRole, number> = { OWNER: 4, ADMIN: 3, MODERATOR: 2, MEMBER: 1 };
  return levels[role];
}

export async function getGroupMembership(groupId: string, userId: string): Promise<GroupRole | null> {
  const membership = await db.studyGroupMembership.findUnique({
    where: { groupId_userId: { groupId, userId } },
    select: { role: true },
  });
  return membership ? (membership.role as GroupRole) : null;
}

export function requireRole(minRole: GroupRole, actualRole: GroupRole | null): void {
  if (!actualRole) throw new Error("Not a member of this group");
  if (roleLevel(actualRole) < roleLevel(minRole)) {
    throw new Error(`Requires ${minRole} role or higher`);
  }
}

export interface GroupFilters {
  search?: string;
  category?: string;
  targetRole?: string;
  careerStage?: string;
  skill?: string;
  limit?: number;
  cursor?: string;
}

export async function searchStudyGroups(userId: string, filters: GroupFilters) {
  const { search, category, targetRole, careerStage, skill, cursor, limit = 20 } = filters;

  const where: any = { visibility: "PUBLIC" };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { skill: { contains: search, mode: "insensitive" } },
    ];
  }

  if (category) where.category = category;
  if (targetRole) where.targetRole = targetRole;
  if (careerStage) where.careerStage = careerStage;
  if (skill) where.skill = { equals: skill, mode: "insensitive" };

  const cursorCondition: any = {};
  if (cursor) {
    const cursorGroup = await db.studyGroup.findUnique({
      where: { id: cursor },
      select: { createdAt: true },
    });
    if (cursorGroup) {
      cursorCondition.createdAt = { lt: cursorGroup.createdAt };
    }
  }

  const groups = await db.studyGroup.findMany({
    where: { ...where, ...cursorCondition },
    orderBy: { memberCount: "desc", createdAt: cursor ? undefined : "desc" },
    take: limit + 1,
    include: {
      memberships: {
        where: { userId },
        select: { role: true },
      },
    },
  });

  let hasNextPage = false;
  if (groups.length > limit) {
    hasNextPage = true;
    groups.pop();
  }

  return {
    groups: groups.map((g) => ({
      id: g.id,
      name: g.name,
      slug: g.slug,
      description: g.description,
      about: g.about,
      category: g.category,
      targetRole: g.targetRole,
      targetCompany: g.targetCompany,
      skill: g.skill,
      careerStage: g.careerStage,
      maxMembers: g.maxMembers,
      visibility: g.visibility,
      imageUrl: g.imageUrl,
      memberCount: g.memberCount,
      createdAt: g.createdAt,
      updatedAt: g.updatedAt,
      userRole: g.memberships.length > 0 ? (g.memberships[0]?.role ?? null) : null,
    })),
    hasNextPage,
    nextCursor: groups.length > 0 ? (groups[groups.length - 1]?.id ?? null) : null,
  };
}

export async function createStudyGroup(userId: string, data: {
  name: string;
  description: string;
  about?: string;
  category: string;
  targetRole?: string;
  targetCompany?: string;
  skill?: string;
  careerStage?: string;
  maxMembers: number;
  visibility: "PUBLIC" | "PRIVATE";
  rules?: string[];
  imageUrl?: string;
}) {
  const slug = `${data.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")}-${Math.random().toString(36).substring(2, 8)}`;

  const group = await db.studyGroup.create({
    data: {
      name: data.name,
      slug,
      description: data.description,
      about: data.about,
      category: data.category,
      targetRole: data.targetRole,
      targetCompany: data.targetCompany,
      skill: data.skill,
      careerStage: data.careerStage as any,
      maxMembers: data.maxMembers,
      visibility: data.visibility,
      rules: data.rules as any,
      imageUrl: data.imageUrl,
    },
  });

  await db.studyGroupMembership.create({
    data: {
      groupId: group.id,
      userId,
      role: "OWNER",
    },
  });

  await db.studyGroup.update({
    where: { id: group.id },
    data: { memberCount: { increment: 1 } },
  });

  return group;
}

export async function getGroupById(groupId: string, userId: string) {
  const group = await db.studyGroup.findUnique({
    where: { id: groupId },
    include: {
      memberships: {
        include: { user: { select: { id: true, name: true, email: true, careerStage: true } } },
      },
      invitations: {
        where: { inviteeId: userId },
        select: { id: true, token: true, expiresAt: true },
      },
      discussions: {
        where: { isPinned: true },
        orderBy: { createdAt: "desc" },
        include: { author: { select: { id: true, name: true } } },
      },
      _count: {
        select: {
          discussions: true,
          resources: true,
          sessions: true,
          challenges: true,
        },
      },
    },
  });

  if (!group) throw new Error("Group not found");

  const userRole = group.memberships.find((m) => m.userId === userId)?.role || null;

  return {
    group: {
      id: group.id,
      name: group.name,
      slug: group.slug,
      description: group.description,
      about: group.about,
      category: group.category,
      targetRole: group.targetRole,
      targetCompany: group.targetCompany,
      skill: group.skill,
      careerStage: group.careerStage,
      maxMembers: group.maxMembers,
      visibility: group.visibility,
      rules: group.rules,
      imageUrl: group.imageUrl,
      memberCount: group.memberCount,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
    },
    members: group.memberships.map((m) => ({
      id: m.id,
      userId: m.userId,
      name: m.user.name,
      role: m.role,
      joinedAt: m.joinedAt,
    })),
    pendingInvitations: group.invitations,
    pinnedDiscussions: group.discussions,
    counts: group._count,
    userRole,
  };
}

export async function joinGroup(userId: string, groupId: string, message?: string) {
  const group = await db.studyGroup.findUnique({
    where: { id: groupId },
    select: { visibility: true },
  });
  if (!group) throw new Error("Group not found");

  if (group.visibility === "PUBLIC") {
    const existing = await db.studyGroupMembership.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (existing) throw new Error("Already a member");

    await db.studyGroupMembership.create({
      data: { groupId, userId, role: "MEMBER" },
    });

    await db.studyGroup.update({
      where: { id: groupId },
      data: { memberCount: { increment: 1 } },
    });

    return { joined: true };
  } else {
    const existing = await db.studyGroupMembership.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (existing) throw new Error("Already a member");

    const existingRequest = await db.studyGroupJoinRequest.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (existingRequest && existingRequest.status === "PENDING") {
      throw new Error("Join request already submitted");
    }

    await db.studyGroupJoinRequest.upsert({
      where: { groupId_userId: { groupId, userId } },
      create: { groupId, userId, message, status: "PENDING" },
      update: { status: "PENDING", message, respondedById: null, respondedAt: null },
    });

    return { requested: true };
  }
}

export async function handleJoinRequest(groupId: string, userId: string, requestId: string, action: "APPROVE" | "REJECT") {
  const groupRole = await getGroupMembership(groupId, userId);
  requireRole("ADMIN", groupRole as GroupRole);

  const request = await db.studyGroupJoinRequest.findUnique({
    where: { id: requestId },
    include: { user: true },
  });
  if (!request) throw new Error("Request not found");
  if (request.groupId !== groupId) throw new Error("Invalid request");

  if (action === "APPROVE") {
    await db.studyGroupMembership.create({
      data: { groupId, userId: request.userId, role: "MEMBER" },
    });
    await db.studyGroup.update({
      where: { id: groupId },
      data: { memberCount: { increment: 1 } },
    });
  }

  await db.studyGroupJoinRequest.update({
    where: { id: requestId },
    data: {
      status: action === "APPROVE" ? "APPROVED" : "REJECTED",
      respondedById: userId,
      respondedAt: new Date(),
    },
  });

  await createGroupNotification(
    request.userId,
    action === "APPROVE" ? "GROUP_JOIN_APPROVED" : "GROUP_JOIN_REJECTED",
    `Your request to join ${request.user.name}'s target group was ${action === "APPROVE" ? "approved" : "rejected"}.`
  );

  return { success: true };
}

export async function leaveGroup(groupId: string, userId: string) {
  const membership = await db.studyGroupMembership.findUnique({
    where: { groupId_userId: { groupId, userId } },
    select: { role: true },
  });
  if (!membership) throw new Error("Not a member");

  if (membership.role === "OWNER") {
    const memberCount = await db.studyGroupMembership.count({ where: { groupId } });
    if (memberCount > 1) throw new Error("Transfer ownership before leaving");
  }

  await db.studyGroupMembership.delete({
    where: { groupId_userId: { groupId, userId } },
  });

  await db.studyGroup.update({
    where: { id: groupId },
    data: { memberCount: { decrement: 1 } },
  });

  return { success: true };
}

export async function createInvitation(groupId: string, inviterId: string, inviteeEmail: string) {
  const groupRole = await getGroupMembership(groupId, inviterId);
  requireRole("ADMIN", groupRole as GroupRole);

  const invitee = await db.user.findUnique({
    where: { email: inviteeEmail },
    select: { id: true, name: true, email: true },
  });
  if (!invitee) throw new Error("User not found");

  const existing = await db.studyGroupMembership.findUnique({
    where: { groupId_userId: { groupId, userId: invitee.id } },
  });
  if (existing) throw new Error("User already a member");

  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const invitation = await db.studyGroupInvitation.create({
    data: {
      groupId,
      inviterId,
      inviteeId: invitee.id,
      token,
      expiresAt,
    },
  });

  await createGroupNotification(
    invitee.id,
    "GROUP_INVITATION",
    `${invitee.name} was invited to join a study group.`
  );

  return invitation;
}

export async function getInvitations(userId: string) {
  return db.studyGroupInvitation.findMany({
    where: { inviteeId: userId },
    include: {
      group: { select: { id: true, name: true, description: true } },
      inviter: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function acceptInvitation(userId: string, token: string) {
  const invitation = await db.studyGroupInvitation.findUnique({
    where: { token },
    include: { group: true },
  });
  if (!invitation) throw new Error("Invalid invitation");
  if (invitation.inviteeId !== userId) throw new Error("Forbidden");
  if (invitation.expiresAt < new Date()) throw new Error("Invitation expired");

  await db.studyGroupMembership.create({
    data: { groupId: invitation.groupId, userId, role: "MEMBER" },
  });

  await db.studyGroup.update({
    where: { id: invitation.groupId },
    data: { memberCount: { increment: 1 } },
  });

  await db.studyGroupInvitation.delete({ where: { id: invitation.id } });

  return { joined: true, groupId: invitation.groupId };
}

export async function updateMemberRole(groupId: string, requesterId: string, targetUserId: string, newRole: GroupRole) {
  const groupRole = await getGroupMembership(groupId, requesterId);
  requireRole("OWNER", groupRole as GroupRole);

  if (targetUserId === requesterId) throw new Error("Cannot change your own role as owner");

  const targetMembership = await db.studyGroupMembership.findUnique({
    where: { groupId_userId: { groupId, userId: targetUserId } },
    select: { role: true },
  });
  if (!targetMembership) throw new Error("User not a member");

  await db.studyGroupMembership.update({
    where: { groupId_userId: { groupId, userId: targetUserId } },
    data: { role: newRole },
  });

  return { updated: true };
}

async function createGroupNotification(userId: string, type: string, message: string) {
  await db.inAppNotification.create({
    data: {
      userId,
      type,
      title: "Study Group Update",
      body: message,
    },
  });
}

export async function getGroupMembers(groupId: string, userId: string) {
  const groupRole = await getGroupMembership(groupId, userId);
  if (!groupRole) throw new Error("Not a member of this group");

  const members = await db.studyGroupMembership.findMany({
    where: { groupId },
    include: {
      user: { select: { id: true, name: true, careerStage: true } },
    },
    orderBy: [{ role: "asc" }, { joinedAt: "desc" }],
  });

  return members.map((m) => ({
    id: m.id,
    userId: m.userId,
    name: m.user.name,
    careerStage: m.user.careerStage,
    role: m.role,
    joinedAt: m.joinedAt,
  }));
}

export async function updateGroup(
  groupId: string,
  userId: string,
  data: Partial<{
    name: string;
    description: string;
    about: string;
    category: string;
    targetRole: string;
    targetCompany: string;
    skill: string;
    careerStage: string;
    maxMembers: number;
    rules: string[];
    imageUrl: string;
  }>
) {
  const groupRole = await getGroupMembership(groupId, userId);
  requireRole("ADMIN", groupRole as GroupRole);

  const updated = await db.studyGroup.update({
    where: { id: groupId },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.description && { description: data.description }),
      ...(data.about !== undefined && { about: data.about }),
      ...(data.category && { category: data.category }),
      ...(data.targetRole !== undefined && { targetRole: data.targetRole }),
      ...(data.targetCompany !== undefined && { targetCompany: data.targetCompany }),
      ...(data.skill !== undefined && { skill: data.skill }),
      ...(data.careerStage !== undefined && { careerStage: data.careerStage as any }),
      ...(data.maxMembers && { maxMembers: data.maxMembers }),
      ...(data.rules !== undefined && { rules: data.rules as any }),
      ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
    },
  });

  return updated;
}

type CareerStage = "STUDENT" | "FRESHER" | "PROFESSIONAL";
