import { NextRequest, NextResponse } from "next/server";
import { getCurrent } from "@/lib/auth/session";
import {
  getGroupDiscussions,
  getDiscussion,
  createDiscussion,
  addReply,
  pinDiscussion,
} from "@/lib/community/discussions";

export async function GET(req: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  const { session } = await getCurrent();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { groupId } = await params;
  const url = new URL(req.url);
  const discussionId = url.searchParams.get("discussionId");
  const cursor = url.searchParams.get("cursor") || undefined;
  const limit = parseInt(url.searchParams.get("limit") || "20", 10);

  try {
    if (discussionId) {
      const discussion = await getDiscussion(discussionId, session.id);
      return NextResponse.json({ discussion });
    }

    const result = await getGroupDiscussions(groupId, session.id, cursor, limit);
    return NextResponse.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  const { session } = await getCurrent();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { groupId } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  try {
    if (body.action === "create") {
      const discussion = await createDiscussion(groupId, session.id, {
        title: body.title,
        content: body.content,
        questionId: body.questionId,
      });
      return NextResponse.json({ discussion }, { status: 201 });
    }

    if (body.action === "reply") {
      const reply = await addReply(
        groupId,
        body.discussionId,
        session.id,
        body.content,
        body.parentId
      );
      return NextResponse.json({ reply }, { status: 201 });
    }

    if (body.action === "pin") {
      await pinDiscussion(groupId, body.discussionId, session.id);
      return NextResponse.json({ pinned: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
