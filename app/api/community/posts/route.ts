import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrent } from "@/lib/auth/session";
import {
  getCommunityFeed,
  getPost,
  createPost,
  updatePost,
  deletePost,
  reactToPost,
  savePost,
  addComment,
} from "@/lib/community";

const postSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(10000),
  topicId: z.string().min(1),
  visibility: z.enum(["PUBLIC", "PRIVATE"]).optional(),
  imageUrl: z.string().url().optional(),
  resourceUrl: z.string().url().optional(),
  questionId: z.string().uuid().optional(),
});

export async function GET(req: NextRequest) {
  const { session } = await getCurrent();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const action = url.searchParams.get("action");
  const cursor = url.searchParams.get("cursor") || undefined;
  const limit = parseInt(url.searchParams.get("limit") || "20", 10);

  try {
    if (action === "saved") {
      const result = await getSavedPosts(session.id, cursor, limit);
      return NextResponse.json(result);
    }

    const filters = {
      topicId: url.searchParams.get("topicId") || undefined,
      authorId: url.searchParams.get("authorId") || undefined,
      sortBy: (url.searchParams.get("sortBy") as any) || "latest",
      cursor,
      limit,
    };
    const result = await getCommunityFeed(session.id, filters);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Feed error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { getSavedPosts } from "@/lib/community";

export async function POST(req: NextRequest) {
  const { session } = await getCurrent();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
  }

  try {
    const post = await createPost(session.id, parsed.data);
    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error("Create post error:", error);
    const msg = error instanceof Error ? error.message : "Failed to create post";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
