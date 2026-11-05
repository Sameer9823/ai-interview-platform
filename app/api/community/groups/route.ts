import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrent } from "@/lib/auth/session";
import {
  searchStudyGroups,
  createStudyGroup,
  getGroupById,
  joinGroup,
  handleJoinRequest,
  leaveGroup,
  createInvitation,
  getInvitations,
  acceptInvitation,
  updateMemberRole,
} from "@/lib/community/study-groups";

const groupSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().min(10).max(500),
  about: z.string().max(2000).optional(),
  category: z.string().min(1).max(100),
  targetRole: z.string().optional(),
  targetCompany: z.string().optional(),
  skill: z.string().optional(),
  careerStage: z.string().optional(),
  maxMembers: z.number().min(2).max(1000).default(50),
  visibility: z.enum(["PUBLIC", "PRIVATE"]),
  rules: z.array(z.string()).optional(),
  imageUrl: z.string().url().optional(),
});

export async function GET(req: NextRequest) {
  const { session } = await getCurrent();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  try {
    if (action === "invitations") {
      const invitations = await getInvitations(session.id);
      return NextResponse.json({ invitations });
    }

    const filters = {
      search: url.searchParams.get("search") || undefined,
      category: url.searchParams.get("category") || undefined,
      targetRole: url.searchParams.get("targetRole") || undefined,
      careerStage: url.searchParams.get("careerStage") || undefined,
      skill: url.searchParams.get("skill") || undefined,
      limit: parseInt(url.searchParams.get("limit") || "20", 10),
      cursor: url.searchParams.get("cursor") || undefined,
    };

    const result = await searchStudyGroups(session.id, filters);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Study groups fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { session } = await getCurrent();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const action = body.action;

  try {
    if (action === "create") {
      const parsed = groupSchema.safeParse(body.data);
      if (!parsed.success) {
        return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
      }
      const group = await createStudyGroup(session.id, parsed.data);
      return NextResponse.json({ group }, { status: 201 });
    }

    if (action === "join") {
      const { groupId, message } = body;
      if (!groupId) return NextResponse.json({ error: "groupId required" }, { status: 400 });
      const result = await joinGroup(session.id, groupId, message);
      return NextResponse.json(result);
    }

    if (action === "handle-request") {
      const { groupId, requestId, approve } = body;
      const result = await handleJoinRequest(groupId, session.id, requestId, approve ? "APPROVE" : "REJECT");
      return NextResponse.json(result);
    }

    if (action === "leave") {
      const { groupId } = body;
      await leaveGroup(groupId, session.id);
      return NextResponse.json({ success: true });
    }

    if (action === "invite") {
      const { groupId, inviteeEmail } = body;
      const invitation = await createInvitation(groupId, session.id, inviteeEmail);
      return NextResponse.json({ invitation });
    }

    if (action === "accept-invitation") {
      const { token } = body;
      const result = await acceptInvitation(session.id, token);
      return NextResponse.json(result);
    }

    if (action === "change-role") {
      const { groupId, targetUserId, newRole } = body;
      const result = await updateMemberRole(groupId, session.id, targetUserId, newRole);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Group action error:", error);
    const msg = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
