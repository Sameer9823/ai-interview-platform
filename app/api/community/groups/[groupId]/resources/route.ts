import { NextRequest, NextResponse } from "next/server";
import { getCurrent } from "@/lib/auth/session";
import { getGroupResources, addGroupResource, deleteGroupResource } from "@/lib/community/resources";
import { z } from "zod";

const resourceSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(2000).optional(),
  url: z.string().url().optional(),
  fileKey: z.string().optional(),
  fileSize: z.number().optional(),
  mimeType: z.string().optional(),
  resourceType: z.string().min(1),
  topic: z.string().optional(),
  learningResourceId: z.string().optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  const { session } = await getCurrent();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { groupId } = await params;

  try {
    const resources = await getGroupResources(groupId, session.id);
    return NextResponse.json({ resources });
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

  const parsed = resourceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
  }

  try {
    const resource = await addGroupResource(groupId, session.id, parsed.data);
    return NextResponse.json({ resource }, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  const { session } = await getCurrent();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { groupId } = await params;
  const body = await req.json().catch(() => ({}));
  const { resourceId } = body;

  if (!resourceId) return NextResponse.json({ error: "resourceId required" }, { status: 400 });

  try {
    await deleteGroupResource(groupId, resourceId, session.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
