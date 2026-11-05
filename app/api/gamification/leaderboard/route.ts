import { NextRequest, NextResponse } from "next/server";
import { getCurrent } from "@/lib/auth/session";
import { db } from "@/lib/db/client";

export async function GET(req: NextRequest) {
  try {
    const { session } = await getCurrent();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const scope = searchParams.get("scope") || "WEEKLY_ACTIVITY";
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const entries = await db.leaderboardEntry.findMany({
      where: {
        scope: scope as any,
      },
      orderBy: { score: "desc" },
      take: limit,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(entries);
  } catch (error) {
    console.error("Leaderboard fetch failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
