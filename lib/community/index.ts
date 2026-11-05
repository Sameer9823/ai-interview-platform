import "server-only";
import { db } from "@/lib/db/client";
import { getOrCreateGamificationProfile } from "@/lib/gamification";

export interface FeedFilters {
  topicId?: string;
  authorId?: string;
  sortBy?: "latest" | "popular" | "following";
  cursor?: string;
  limit?: number;
}

export async function getCommunityFeed(userId: string, filters: FeedFilters) {
  const { topicId, authorId, sortBy = "latest", cursor, limit = 20 } = filters;

  const followerTopicIds = await db.userFollowedTopic.findMany({
    where: { userId },
    select: { topicId: true },
  });
  const followedTopicIds = followerTopicIds.map((f) => f.topicId);
  const followedTopicIdSet = new Set(followedTopicIds);

  let orderBy: any = { createdAt: "desc" };
  let viewCountOrder = false;

  if (sortBy === "popular") {
    orderBy = { viewCount: "desc" };
    viewCountOrder = true;
  }

  if (sortBy === "following" && (topicId || authorId)) {
    orderBy = { createdAt: "desc" };
  }

  const where: any = {
    visibility: "PUBLIC",
  };

  if (topicId) {
    where.topicId = topicId;
  }

  if (authorId) {
    where.authorId = authorId;
  }

  if (sortBy === "following" && !topicId && !authorId) {
    const following = await db.userFollow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });
    const followingIds = following.map((f) => f.followingId);

    if (followingIds.length === 0) {
      where.OR = [{ id: "no-results-" + Math.random() }];
    } else {
      where.OR = [
        { authorId: { in: followingIds } },
        { topicId: { in: [...followedTopicIdSet] } },
      ];
    }
  }

  if (cursor) {
    if (viewCountOrder) {
      const cursorPost = await db.communityPost.findUnique({
        where: { id: cursor },
        select: { viewCount: true, id: true },
      });
      if (cursorPost) {
        where.AND = [
          ...(where.AND || []),
          {
            OR: [
              { viewCount: { lt: cursorPost.viewCount } },
              { viewCount: cursorPost.viewCount, id: { lt: cursor } },
            ],
          },
        ];
      }
    } else {
      const cursorPost = await db.communityPost.findUnique({
        where: { id: cursor },
        select: { createdAt: true },
      });
      if (cursorPost) {
        where.AND = [
          ...(where.AND || []),
          { createdAt: { lt: cursorPost.createdAt } },
        ];
      }
    }
  }

  const posts = await db.communityPost.findMany({
    where,
    orderBy,
    take: limit + 1,
    include: {
      topic: { select: { id: true, name: true, slug: true, color: true, icon: true } },
      author: { select: { id: true, name: true } },
      question: { select: { id: true, slug: true, text: true, difficulty: true, type: true } },
      _count: {
        select: {
          comments: true,
          reactions: true,
        },
      },
    },
  });

  let hasNextPage = false;
  if (posts.length > limit) {
    hasNextPage = true;
    posts.pop();
  }

  const userReaction = await db.postReaction.findMany({
    where: { userId, postId: { in: posts.map((p) => p.id) } },
    select: { postId: true, reaction: true },
  });
  const reactionMap = new Map(userReaction.map((r) => [r.postId, r.reaction]));

  const savedPosts = await db.savedCommunityPost.findMany({
    where: { userId, postId: { in: posts.map((p) => p.id) } },
    select: { postId: true },
  });
  const savedSet = new Set(savedPosts.map((s) => s.postId));

  return {
    posts: posts.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      topic: p.topic,
      author: p.author,
      question: p.question,
      visibility: p.visibility,
      imageUrl: p.imageUrl,
      resourceUrl: p.resourceUrl,
      viewCount: p.viewCount,
      isPinned: p.isPinned,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      commentCount: p._count.comments,
      reactionCount: p._count.reactions,
      userReaction: reactionMap.get(p.id),
      isSaved: savedSet.has(p.id),
    })),
    hasNextPage,
    nextCursor: posts.length > 0 ? (posts[posts.length - 1]?.id ?? null) : null,
  };
}

export async function getPost(postId: string, userId?: string) {
  const post = await db.communityPost.findUnique({
    where: { id: postId },
    include: {
      topic: true,
      author: { select: { id: true, name: true } },
      question: { select: { id: true, slug: true, text: true, difficulty: true, type: true, category: { select: { name: true } } } },
      comments: {
        where: { parentId: null },
        include: {
          author: { select: { id: true, name: true } },
          replies: {
            include: { author: { select: { id: true, name: true } } },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      reactions: {
        where: userId ? { userId } : undefined,
        select: { userId: true, reaction: true },
      },
      _count: {
        select: { comments: true, reactions: true },
      },
    },
  });

  if (!post) return null;

  const isSaved = userId
    ? await db.savedCommunityPost.findUnique({
        where: { userId_postId: { userId, postId: post.id } },
      })
    : null;

  return {
    post: {
      id: post.id,
      title: post.title,
      description: post.description,
      topic: post.topic,
      authorId: post.authorId,
      author: post.author,
      question: post.question,
      visibility: post.visibility,
      imageUrl: post.imageUrl,
      resourceUrl: post.resourceUrl,
      viewCount: post.viewCount,
      isPinned: post.isPinned,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
      reactionCount: post._count.reactions,
      commentCount: post._count.comments,
      isSaved: !!isSaved,
      userReactions: userId
        ? post.reactions.map((r) => r.reaction)
        : [],
      comments: post.comments.map((c) => ({
        id: c.id,
        content: c.content,
        author: c.author,
        createdAt: c.createdAt.toISOString(),
        replies: c.replies.map((r) => ({
          id: r.id,
          content: r.content,
          author: r.author,
          createdAt: r.createdAt.toISOString(),
        })),
      })),
    },
  };
}

export async function createPost(
  userId: string,
  data: {
    title: string;
    description: string;
    topicId: string;
    visibility?: "PUBLIC" | "PRIVATE";
    imageUrl?: string;
    resourceUrl?: string;
    questionId?: string;
  }
) {
  const topic = await db.communityTopic.findUnique({
    where: { id: data.topicId },
  });
  if (!topic) throw new Error("Invalid topic");

  const post = await db.communityPost.create({
    data: {
      title: data.title,
      description: data.description,
      topicId: data.topicId,
      authorId: userId,
      visibility: data.visibility || "PUBLIC",
      imageUrl: data.imageUrl,
      resourceUrl: data.resourceUrl,
      questionId: data.questionId,
    },
  });

  await awardXPForActivity(userId, "PRACTICE_SESSION_COMPLETED", `post-${post.id}`, "community_post");

  return post;
}

export async function updatePost(userId: string, postId: string, data: Partial<{
  title: string;
  description: string;
  topicId: string;
  visibility: "PUBLIC" | "PRIVATE";
  imageUrl: string;
  resourceUrl: string;
  questionId: string;
}>) {
  const post = await db.communityPost.findUnique({
    where: { id: postId },
    select: { authorId: true },
  });

  if (!post) throw new Error("Post not found");
  if (post.authorId !== userId) throw new Error("Forbidden");

  const updated = await db.communityPost.update({
    where: { id: postId },
    data: {
      ...(data.title && { title: data.title }),
      ...(data.description && { description: data.description }),
      ...(data.topicId && { topicId: data.topicId }),
      ...(data.visibility && { visibility: data.visibility }),
      ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
      ...(data.resourceUrl !== undefined && { resourceUrl: data.resourceUrl }),
      ...(data.questionId !== undefined && { questionId: data.questionId || null }),
    },
  });

  return updated;
}

export async function deletePost(userId: string, postId: string) {
  const post = await db.communityPost.findUnique({
    where: { id: postId },
    select: { authorId: true },
  });

  if (!post) throw new Error("Post not found");
  if (post.authorId !== userId) throw new Error("Forbidden");

  await db.communityPost.delete({ where: { id: postId } });
  return { success: true };
}

export async function reactToPost(userId: string, postId: string, reaction: string) {
  const post = await db.communityPost.findUnique({
    where: { id: postId },
    select: { id: true },
  });
  if (!post) throw new Error("Post not found");

  const existing = await db.postReaction.findUnique({
    where: { postId_userId_reaction: { postId, userId, reaction } },
  });

  if (existing) {
    await db.postReaction.delete({
      where: { postId_userId_reaction: { postId, userId, reaction } },
    });
    return { reacted: false };
  } else {
    const allReactions = await db.postReaction.findMany({
      where: { postId, userId },
    });
    if (allReactions.length > 0) {
      await db.postReaction.deleteMany({ where: { postId, userId } });
    }
    await db.postReaction.create({
      data: { postId, userId, reaction },
    });
    return { reacted: true };
  }
}

export async function savePost(userId: string, postId: string) {
  const post = await db.communityPost.findUnique({
    where: { id: postId },
    select: { visibility: true },
  });
  if (!post) throw new Error("Post not found");
  if (post.visibility !== "PUBLIC") throw new Error("Cannot save private posts");

  const existing = await db.savedCommunityPost.findUnique({
    where: { userId_postId: { userId, postId } },
  });

  if (existing) {
    await db.savedCommunityPost.delete({
      where: { userId_postId: { userId, postId } },
    });
    return { saved: false };
  } else {
    await db.savedCommunityPost.create({
      data: { userId, postId },
    });
    return { saved: true };
  }
}

export async function getSavedPosts(userId: string, cursor?: string, limit: number = 20) {
  const where: any = { userId };
  if (cursor) {
    const cursorPost = await db.savedCommunityPost.findUnique({
      where: { id: cursor },
      select: { createdAt: true },
    });
    if (cursorPost) {
      where.createdAt = { lt: cursorPost.createdAt };
    }
  }

  const saved = await db.savedCommunityPost.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    include: {
      post: {
        include: {
          topic: true,
          author: { select: { id: true, name: true } },
        },
      },
    },
  });

  let hasNextPage = false;
  if (saved.length > limit) {
    hasNextPage = true;
    saved.pop();
  }

  return {
    posts: saved.map((s) => s.post),
    hasNextPage,
    nextCursor: saved.length > 0 ? (saved[saved.length - 1]?.id ?? null) : null,
  };
}

export async function addComment(userId: string, postId: string, content: string, parentId?: string) {
  const post = await db.communityPost.findUnique({
    where: { id: postId },
    select: { id: true },
  });
  if (!post) throw new Error("Post not found");

  const comment = await db.communityComment.create({
    data: {
      postId,
      authorId: userId,
      parentId: parentId || null,
      content,
    },
    include: {
      author: { select: { id: true, name: true } },
    },
  });

  return comment;
}

export async function getTopics(showAll: boolean = false) {
  const topics = await db.communityTopic.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: {
          posts: {
            where: { visibility: "PUBLIC" },
          },
          followers: true,
        },
      },
    },
  });

  return topics.map((t) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    description: t.description,
    category: t.category,
    color: t.color,
    icon: t.icon,
    isSystem: t.isSystem,
    postCount: t._count.posts,
    followerCount: t._count.followers,
  }));
}

export async function followTopic(userId: string, topicId: string) {
  const topic = await db.communityTopic.findUnique({
    where: { id: topicId },
    select: { id: true },
  });
  if (!topic) throw new Error("Topic not found");

  await db.userFollowedTopic.upsert({
    where: { userId_topicId: { userId, topicId } },
    create: { userId, topicId },
    update: {},
  });

  return { following: true };
}

export async function unfollowTopic(userId: string, topicId: string) {
  await db.userFollowedTopic.deleteMany({
    where: { userId, topicId },
  });
  return { following: false };
}

async function awardXPForActivity(userId: string, activityType: string, sourceRecordId: string, sourceRecordType: string) {
  try {
    const { awardXP } = await import("@/lib/gamification");
    const { checkAchievements } = await import("@/lib/gamification");
    await awardXP(userId, activityType, sourceRecordId, sourceRecordType);
    await checkAchievements(userId);
  } catch (e) {
    console.error("XP award failed:", e);
  }
}
