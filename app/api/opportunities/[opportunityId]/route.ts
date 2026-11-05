import { NextRequest, NextResponse } from "next/server";
import { getCurrent } from "@/lib/auth/session";
import {
  getOpportunityById,
  incrementViewCount,
  saveOpportunity,
  unsaveOpportunity,
  dismissOpportunity,
} from "@/lib/opportunities";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ opportunityId: string }> }
) {
  const { session } = await getCurrent();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { opportunityId } = await params;

  try {
    const opportunity = await getOpportunityById(opportunityId, session.id);
    if (!opportunity) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await incrementViewCount(opportunityId);

    return NextResponse.json({ opportunity });
  } catch (error) {
    console.error("Get opportunity error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

const actionSchema = z.object({
  action: z.enum(["save", "unsave", "dismiss"]),
  reason: z.string().optional(),
});

import { z } from "zod";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ opportunityId: string }> }
) {
  const { session } = await getCurrent();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { opportunityId } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
  }

  try {
    let result;
    switch (parsed.data.action) {
      case "save":
        result = await saveOpportunity(session.id, opportunityId);
        break;
      case "unsave":
        result = await unsaveOpportunity(session.id, opportunityId);
        break;
      case "dismiss":
        result = await dismissOpportunity(session.id, opportunityId, parsed.data.reason);
        break;
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error("Opportunity action error:", error);
    const msg = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}