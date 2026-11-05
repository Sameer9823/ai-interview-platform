import { NextRequest, NextResponse } from "next/server";
import { getCurrent } from "@/lib/auth/session";
import { reactToPost, savePost, addComment } from "@/lib/community";

export async function POST(req: NextRequest) {
  const { session } = await getCurrent();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { action, postId, ...rest } = body;

  try {
    if (action === "react" && postId) {
      const result = await reactToPost(session.id, postId, rest.reaction || "LIKE");
      return NextResponse.json(result);
    }

    if (action === "save" && postId) {
      const result = await savePost(session.id, postId);
      return NextResponse.json(result);
    }

    if (action === "comment" && postId) {
      const { content, parentId } = rest;
      const comment = await addComment(session.id, postId, content, parentId);
      return NextResponse.json({ comment }, { status: 201 });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
