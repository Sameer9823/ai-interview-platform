import { NextRequest, NextResponse } from "next/server";
import { getCurrent } from "@/lib/auth/session";
import {
  createStudySession,
  getGroupSessions,
  rsvpToSession,
  cancelRsvp,
  getSessionById,
} from "@/lib/community/sessions";
import { z } from "zod";

const sessionSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().max(1000).optional(),
  subject: z.string().min(1).max(100),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  timezone: z.string().default("UTC"),
  meetingLink: z.string().url().optional(),
  maxParticipants: z.number().min(1).optional(),
  visibility: z.string().optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  const { session } = await getCurrent();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { groupId } = await params;
  const url = new URL(req.url);
  const sessionId = url.searchParams.get("sessionId");

  try {
    if (sessionId) {
      const s = await getSessionById(sessionId, session.id);
      return NextResponse.json({ session: s });
    }

    const sessions = await getGroupSessions(groupId, session.id);
    return NextResponse.json({ sessions });
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
      const parsed = sessionSchema.safeParse(body.data);
      if (!parsed.success) {
        return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
      }
      const s = await createStudySession(groupId, session.id, parsed.data);
      return NextResponse.json({ session: s }, { status: 201 });
    }

    if (body.action === "rsvp") {
      await rsvpToSession(session.id, body.sessionId, body.rsvp);
      return NextResponse.json({ success: true });
    }

    if (body.action === "cancel-rsvp") {
      await cancelRsvp(session.id, body.sessionId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
