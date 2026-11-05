import { NextRequest, NextResponse } from "next/server";
import { getCurrent } from "@/lib/auth/session";
import { getDashboardData, getLeaderboard } from "@/lib/gamification";
import { seedAchievementDefinitions } from "@/lib/gamification/achievements";

export async function GET(req: NextRequest) {
  try {
    const { session } = await getCurrent();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await getDashboardData(session.id);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Dashboard fetch failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
