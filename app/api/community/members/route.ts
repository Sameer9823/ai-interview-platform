import { NextRequest, NextResponse } from "next/server";
import { getCurrent } from "@/lib/auth/session";
import { discoverMembers, getPublicProfile, followUser, unfollowUser } from "@/lib/community/members";
import { communitySearch } from "@/lib/community/search";

export async function GET(req: NextRequest) {
  const { session } = await getCurrent();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  try {
    if (action === "discover") {
      const result = await discoverMembers(session.id, {
        search: url.searchParams.get("search") || undefined,
        careerStage: url.searchParams.get("careerStage") || undefined,
        skill: url.searchParams.get("skill") || undefined,
        targetRole: url.searchParams.get("targetRole") || undefined,
        limit: parseInt(url.searchParams.get("limit") || "20", 10),
        cursor: url.searchParams.get("cursor") || undefined,
      });
      return NextResponse.json(result);
    }

    if (action === "profile") {
      const targetId = url.searchParams.get("userId");
      if (!targetId) return NextResponse.json({ error: "userId required" }, { status: 400 });
      const profile = await getPublicProfile(targetId, session.id);
      return NextResponse.json({ profile });
    }

    if (action === "search") {
      const query = url.searchParams.get("q") || "";
      const typesParam = url.searchParams.get("types") || "posts,groups,topics";
      const result = await communitySearch(session.id, {
        query,
        types: typesParam.split(",") as any,
        topicId: url.searchParams.get("topicId") || undefined,
        limit: parseInt(url.searchParams.get("limit") || "10", 10),
      });
      return NextResponse.json(result);
    }

    if (action === "following") {
      const following = await db.userFollow.findMany({
        where: { followerId: session.id },
        include: { following: { select: { id: true, name: true, careerStage: true } } },
        orderBy: { createdAt: "desc" },
        take: parseInt(url.searchParams.get("limit") || "20", 10),
      });
      return NextResponse.json({ following: following.map((f) => f.following) });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

import { db } from "@/lib/db/client";

export async function POST(req: NextRequest) {
  const { session } = await getCurrent();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  try {
    if (body.action === "follow") {
      await followUser(session.id, body.targetUserId);
      return NextResponse.json({ following: true });
    }

    if (body.action === "unfollow") {
      await unfollowUser(session.id, body.targetUserId);
      return NextResponse.json({ following: false });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
