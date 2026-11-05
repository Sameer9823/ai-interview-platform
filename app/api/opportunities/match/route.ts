import { NextRequest, NextResponse } from "next/server";
import { getCurrent } from "@/lib/auth/session";
import { generateOpportunityMatches } from "@/lib/opportunities";

export async function POST(req: NextRequest) {
  const { session } = await getCurrent();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const limit = body?.limit ?? 50;

  try {
    const result = await generateOpportunityMatches(session.id, limit);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Generate matches error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}