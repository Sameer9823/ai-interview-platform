import "server-only";
import { db } from "@/lib/db/client";
import { getGroupMembership, requireRole, GroupRole } from "./study-groups";

export async function createStudySession(
  groupId: string,
  creatorId: string,
  data: {
    title: string;
    description?: string;
    subject: string;
    startTime: Date;
    endTime: Date;
    timezone: string;
    meetingLink?: string;
    maxParticipants?: number;
    visibility?: string;
  }
) {
  const groupRole = await getGroupMembership(groupId, creatorId);
  requireRole("MEMBER", groupRole);

  const session = await db.studySession.create({
    data: {
      groupId,
      title: data.title,
      description: data.description,
      subject: data.subject,
      startTime: data.startTime,
      endTime: data.endTime,
      timezone: data.timezone,
      meetingLink: data.meetingLink,
      maxParticipants: data.maxParticipants,
      createdBy: creatorId,
      status: "SCHEDULED",
    },
  });

  return session;
}

export async function getGroupSessions(groupId: string, userId: string) {
  const groupRole = await getGroupMembership(groupId, userId);
  if (!groupRole) throw new Error("Must be a member to view sessions");

  const now = new Date();

  const sessions = await db.studySession.findMany({
    where: { groupId },
    orderBy: { startTime: "asc" },
    include: {
      attendees: {
        where: { userId },
        select: { rsvp: true },
      },
      _count: {
        select: {
          attendees: true,
        },
      },
    },
  });

  return sessions.map((s) => ({
    id: s.id,
    title: s.title,
    description: s.description,
    subject: s.subject,
    startTime: s.startTime,
    endTime: s.endTime,
    timezone: s.timezone,
    meetingLink: s.meetingLink,
    maxParticipants: s.maxParticipants,
    status: s.status,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
    attendeeCount: s._count.attendees,
    userRsvp: s.attendees[0]?.rsvp || null,
    isUpcoming: s.startTime > now,
    isOngoing: s.startTime <= now && s.endTime > now,
    isPast: s.endTime <= now,
  }));
}

export async function rsvpToSession(userId: string, sessionId: string, rsvp: "GOING" | "INTERESTED" | "NOT_GOING") {
  const session = await db.studySession.findUnique({
    where: { id: sessionId },
    select: { groupId: true, maxParticipants: true },
  });
  if (!session) throw new Error("Session not found");

  const groupRole = await getGroupMembership(session.groupId, userId);
  if (!groupRole) throw new Error("Must be a member to RSVP");

  if (rsvp === "GOING" && session.maxParticipants) {
    const count = await db.studySessionAttendance.count({
      where: { sessionId, rsvp: "GOING" },
    });
    if (count >= session.maxParticipants) throw new Error("Session is full");
  }

  await db.studySessionAttendance.upsert({
    where: { sessionId_userId: { sessionId, userId } },
    create: { sessionId, userId, rsvp },
    update: { rsvp },
  });

  return { success: true };
}

export async function cancelRsvp(userId: string, sessionId: string) {
  const session = await db.studySession.findUnique({
    where: { id: sessionId },
    select: { groupId: true },
  });
  if (!session) throw new Error("Session not found");

  const groupRole = await getGroupMembership(session.groupId, userId);
  if (!groupRole) throw new Error("Not a member");

  await db.studySessionAttendance.deleteMany({
    where: { sessionId, userId },
  });

  return { success: true };
}

export async function getSessionById(sessionId: string, userId: string) {
  const session = await db.studySession.findUnique({
    where: { id: sessionId },
    include: {
      group: { select: { id: true, name: true } },
      creator: { select: { id: true, name: true } },
      attendees: {
        include: { user: { select: { id: true, name: true } } },
      },
    },
  });
  if (!session) throw new Error("Session not found");

  const groupRole = await getGroupMembership(session.groupId, userId);
  if (!groupRole) throw new Error("Not a member");

  return session;
}
