import { NextRequest, NextResponse } from "next/server";
import { getCurrent } from "@/lib/auth/session";
import { getTopics, followTopic, unfollowTopic } from "@/lib/community";

export async function GET(req: NextRequest) {
  const { session } = await getCurrent();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const topics = await getTopics();
    const followed = await db.userFollowedTopic.findMany({
      where: { userId: session.id },
      select: { topicId: true },
    });
    const followedSet = new Set(followed.map((f) => f.topicId));

    return NextResponse.json({
      topics: topics.map((t) => ({ ...t, isFollowed: followedSet.has(t.id) })),
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { db } from "@/lib/db/client";

export async function POST(req: NextRequest) {
  const { session } = await getCurrent();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  try {
    if (body.action === "follow" && body.topicId) {
      await followTopic(session.id, body.topicId);
      return NextResponse.json({ following: true });
    }

    if (body.action === "unfollow" && body.topicId) {
      await unfollowTopic(session.id, body.topicId);
      return NextResponse.json({ following: false });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
