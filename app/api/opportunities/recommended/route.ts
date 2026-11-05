import { NextRequest, NextResponse } from "next/server";
import { getCurrent } from "@/lib/auth/session";
import { getRecommendedOpportunities } from "@/lib/opportunities";

export async function GET(req: NextRequest) {
  const { session } = await getCurrent();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const limit = parseInt(url.searchParams.get("limit") || "10", 10);

  try {
    const opportunities = await getRecommendedOpportunities(session.id, limit);
    return NextResponse.json({ opportunities });
  } catch (error) {
    console.error("Get recommended opportunities error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}