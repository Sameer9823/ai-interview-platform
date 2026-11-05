import "server-only";
import { db } from "@/lib/db/client";
import { getGroupMembership, requireRole, GroupRole } from "./study-groups";

export async function createDiscussion(
  groupId: string,
  authorId: string,
  data: {
    title: string;
    content: string;
    questionId?: string;
  }
) {
  const groupRole = await getGroupMembership(groupId, authorId);
  if (!groupRole) throw new Error("Not a member of this group");

  const discussion = await db.groupDiscussion.create({
    data: {
      groupId,
      authorId,
      title: data.title,
      content: data.content,
      questionId: data.questionId || null,
    },
  });

  return discussion;
}

export async function getGroupDiscussions(
  groupId: string,
  userId: string,
  cursor?: string,
  limit: number = 20
) {
  const groupRole = await getGroupMembership(groupId, userId);
  if (!groupRole) throw new Error("Not a member of this group");

  const where: any = { groupId };
  if (cursor) {
    const cursorDiscussion = await db.groupDiscussion.findUnique({
      where: { id: cursor },
      select: { createdAt: true },
    });
    if (cursorDiscussion) {
      where.createdAt = { lt: cursorDiscussion.createdAt };
    }
  }

  const discussions = await db.groupDiscussion.findMany({
    where,
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    take: limit + 1,
    include: {
      author: { select: { id: true, name: true } },
      question: { select: { id: true, slug: true, text: true } },
      _count: {
        select: { replies: true },
      },
    },
  });

  let hasNextPage = false;
  if (discussions.length > limit) {
    hasNextPage = true;
    discussions.pop();
  }

  return {
    discussions: discussions.map((d) => ({
      id: d.id,
      title: d.title,
      content: d.content,
      author: d.author,
      question: d.question,
      isPinned: d.isPinned,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
      replyCount: d._count.replies,
    })),
    hasNextPage,
    nextCursor: discussions.length > 0 ? (discussions[discussions.length - 1]?.id ?? null) : null,
  };
}

export async function getDiscussion(discussionId: string, userId: string) {
  const discussion = await db.groupDiscussion.findUnique({
    where: { id: discussionId },
    include: {
      group: { select: { id: true, name: true } },
      author: { select: { id: true, name: true } },
      question: { select: { id: true, slug: true, text: true, type: true } },
      replies: {
        where: { parentId: null },
        orderBy: { createdAt: "asc" },
        include: {
          author: { select: { id: true, name: true } },
          replies: {
            orderBy: { createdAt: "asc" },
            include: { author: { select: { id: true, name: true } } },
          },
        },
      },
      _count: { select: { replies: true } },
    },
  });

  if (!discussion) throw new Error("Discussion not found");

  const groupRole = await getGroupMembership(discussion.groupId, userId);
  if (!groupRole) throw new Error("Not a member of this group");

  return discussion;
}

export async function addReply(
  groupId: string,
  discussionId: string,
  authorId: string,
  content: string,
  parentId?: string
) {
  const groupRole = await getGroupMembership(groupId, authorId);
  if (!groupRole) throw new Error("Not a member of this group");

  const discussion = await db.groupDiscussion.findUnique({
    where: { id: discussionId },
    select: { groupId: true },
  });
  if (!discussion) throw new Error("Discussion not found");
  if (discussion.groupId !== groupId) throw new Error("Discussion not in this group");

  const reply = await db.groupDiscussionReply.create({
    data: {
      discussionId,
      authorId,
      content,
      parentId: parentId || null,
    },
    include: {
      author: { select: { id: true, name: true } },
    },
  });

  return reply;
}

export async function pinDiscussion(groupId: string, discussionId: string, moderatorId: string) {
  const groupRole = await getGroupMembership(groupId, moderatorId);
  requireRole("MODERATOR", groupRole as GroupRole);

  await db.groupDiscussion.updateMany({
    where: { id: discussionId, groupId },
    data: { isPinned: true },
  });

  return { pinned: true };
}
