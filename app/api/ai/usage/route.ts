import { NextResponse } from "next/server";
import { getCurrent } from "@/lib/auth/session";
import { getUserUsageStats, getSystemUsageStats, getLimitsConfig } from "@/lib/ai/services/usage-manager";

// GET /api/ai/usage - Get current user's usage stats
export async function GET(req: Request) {
  const { session, record } = await getCurrent();
  if (!session || !record) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const days = parseInt(url.searchParams.get("days") || "30", 10);
  const system = url.searchParams.get("system") === "true";

  if (system && record.platformRole === "ADMIN") {
    const stats = await getSystemUsageStats(days);
    return NextResponse.json({ stats, limits: getLimitsConfig() });
  }

  const stats = await getUserUsageStats(days);
  return NextResponse.json({ stats, limits: getLimitsConfig() });
}
