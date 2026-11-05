import { NextRequest, NextResponse } from "next/server";
import { getCurrent } from "@/lib/auth/session";
import { db } from "@/lib/db/client";

export async function GET(req: NextRequest) {
  try {
    const { session } = await getCurrent();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const achievements = await db.userAchievement.findMany({
      where: { userId: session.id },
      include: { achievementDefinition: true },
      orderBy: { unlockedAt: "desc" },
    });

    const unlocked = achievements.filter((a) => a.status !== "LOCKED");
    const locked = achievements.filter((a) => a.status === "LOCKED");

    return NextResponse.json({
      unlocked: unlocked.map((a) => ({
        id: a.id,
        identifier: a.achievementDefinition.identifier,
        name: a.achievementDefinition.name,
        description: a.achievementDefinition.description,
        icon: a.achievementDefinition.icon,
        category: a.achievementDefinition.category,
        xpReward: a.achievementDefinition.xpReward,
        unlockedAt: a.unlockedAt,
        progress: a.progressValue,
      })),
      locked: locked.map((a) => ({
        id: a.id,
        identifier: a.achievementDefinition.identifier,
        name: a.achievementDefinition.name,
        description: a.achievementDefinition.description,
        icon: a.achievementDefinition.icon,
        category: a.achievementDefinition.category,
        xpReward: a.achievementDefinition.xpReward,
        progress: a.progressValue,
        target: a.progressTarget ?? a.achievementDefinition.progressTarget ?? 0,
      })),
    });
  } catch (error) {
    console.error("Achievements fetch failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
