import { NextRequest, NextResponse } from "next/server";
import { getCurrent } from "@/lib/auth/session";
import { getSavedOpportunities } from "@/lib/opportunities";

export async function GET(req: NextRequest) {
  const { session } = await getCurrent();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const cursor = url.searchParams.get("cursor") || undefined;
  const limit = parseInt(url.searchParams.get("limit") || "20", 10);

  try {
    const result = await getSavedOpportunities(session.id, cursor, limit);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Get saved opportunities error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}