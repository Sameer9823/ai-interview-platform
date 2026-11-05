import { NextRequest, NextResponse } from "next/server";
import { getCurrent } from "@/lib/auth/session";
import {
  createGroupChallenge,
  activateChallenge,
  joinChallenge,
  getChallengeProgress,
  getGroupChallenges,
  recordChallengeActivity,
} from "@/lib/community/challenges";
import { z } from "zod";

const challengeSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().max(1000).optional(),
  challengeType: z.string().min(1),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  targetValue: z.number().min(1),
  xpReward: z.number().optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  const { session } = await getCurrent();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { groupId } = await params;
  const url = new URL(req.url);
  const challengeId = url.searchParams.get("challengeId");

  try {
    if (challengeId) {
      const result = await getChallengeProgress(session.id, challengeId);
      return NextResponse.json(result);
    }

    const challenges = await getGroupChallenges(groupId, session.id);
    return NextResponse.json({ challenges });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  const { session } = await getCurrent();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { groupId } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  try {
    if (body.action === "create") {
      const parsed = challengeSchema.safeParse(body.data);
      if (!parsed.success) {
        return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
      }
      const challenge = await createGroupChallenge(groupId, session.id, parsed.data);
      return NextResponse.json({ challenge }, { status: 201 });
    }

    if (body.action === "activate") {
      const result = await activateChallenge(body.challengeId, session.id);
      return NextResponse.json(result);
    }

    if (body.action === "join") {
      const result = await joinChallenge(session.id, body.challengeId);
      return NextResponse.json(result);
    }

    if (body.action === "record-activity") {
      const result = await recordChallengeActivity(
        body.challengeId,
        session.id,
        body.activityType,
        body.sourceRecordId
      );
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
