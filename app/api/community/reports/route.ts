import { NextRequest, NextResponse } from "next/server";
import { getCurrent } from "@/lib/auth/session";
import { submitReport, getReportQueue, reviewReport, blockUser, unblockUser } from "@/lib/community/moderation";
import { z } from "zod";

const reportSchema = z.object({
  targetType: z.string().min(1),
  targetId: z.string().min(1),
  reason: z.enum(["SPAM", "HARASSMENT", "HATE_OR_ABUSE", "MISINFORMATION", "COPYRIGHT", "SCAM", "INAPPROPRIATE", "OTHER"]),
  details: z.string().max(1000).optional(),
});

export async function GET(req: NextRequest) {
  const { session } = await getCurrent();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  try {
    if (action === "queue") {
      const cursor = url.searchParams.get("cursor") || undefined;
      const limit = parseInt(url.searchParams.get("limit") || "20", 10);
      const result = await getReportQueue(session.id, limit, cursor);
      return NextResponse.json(result);
    }

    if (action === "blocked") {
      const blocked = await db.userBlock.findMany({
        where: { blockerId: session.id },
        include: { blocked: { select: { id: true, name: true } } },
      });
      return NextResponse.json({ blocked });
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
    if (body.action === "report") {
      const parsed = reportSchema.safeParse(body.data);
      if (!parsed.success) {
        return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
      }
      const report = await submitReport(
        session.id,
        parsed.data.targetType,
        parsed.data.targetId,
        parsed.data.reason,
        parsed.data.details
      );
      return NextResponse.json({ report }, { status: 201 });
    }

    if (body.action === "block") {
      await blockUser(session.id, body.targetUserId);
      return NextResponse.json({ blocked: true });
    }

    if (body.action === "unblock") {
      await unblockUser(session.id, body.targetUserId);
      return NextResponse.json({ blocked: false });
    }

    if (body.action === "review") {
      const result = await reviewReport(session.id, body.reportId, body.action_value, body.actionDetails);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
