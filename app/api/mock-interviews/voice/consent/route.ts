import { NextResponse } from "next/server";
import { getCurrent } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { createVoiceConsentLog, hasValidConsent, recordVoiceUsage } from "@/lib/voice/consent-service";

export async function POST(req: Request) {
  const { session, record } = await getCurrent();
  if (!session || !record) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { sessionId, version, accepted, ipHash, userAgent } = await req.json();

    if (!sessionId) return NextResponse.json({ error: "Session ID required" }, { status: 400 });
    if (accepted === undefined) return NextResponse.json({ error: "Accepted flag required" }, { status: 400 });

    // Verify session ownership
    const mockSession = await db.mockInterviewSession.findFirst({
      where: { id: sessionId, userId: session.id },
    });

    if (!mockSession) return NextResponse.json({ error: "Session not found" }, { status: 404 });

    // Check if user already has valid consent
    const hasConsent = await hasValidConsent(mockSession.userId, version || "1.0");
    if (hasConsent && accepted) {
      return NextResponse.json({ message: "Consent already given", alreadyGiven: true });
    }

    const consent = await db.voiceConsentLog.create({
      data: {
        userId: mockSession.userId,
        sessionId,
        version: version || "1.0",
        accepted,
        ipHash,
        userAgent: req.headers.get("user-agent") || undefined,
      },
    });

    return NextResponse.json({ consent }, { status: 201 });
  } catch (error) {
    console.error("Consent creation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { session, record } = await getCurrent();
  if (!session || !record) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    const userId = session.id;
    const version = "1.0";

    // Check if user has valid consent
    const hasConsent = await hasValidConsent(userId, version);

    // Get consent history
    const consentHistory = await db.voiceConsentLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    // Get usage stats
    const usageStatsRaw = await db.voiceUsageRecord.findMany({ where: { userId }, select: { operation: true } });
    const counts: Record<string, number> = {};
    for (const r of usageStatsRaw) {
      counts[r.operation] = (counts[r.operation] || 0) + 1;
    }
    const usageStats = Object.entries(counts).map(([operation, count]) => ({ operation, _count: count }));

    return NextResponse.json({ hasConsent, consentHistory, usageStats });
  } catch (error) {
    console.error("Consent check error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
