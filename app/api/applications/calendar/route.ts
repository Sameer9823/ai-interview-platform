import { NextRequest, NextResponse } from "next/server";
import { getCurrent } from "@/lib/auth/session";
import { db } from "@/lib/db/client";

export async function GET(req: NextRequest) {
  const { session } = await getCurrent();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const start = url.searchParams.get("start");
  const end = url.searchParams.get("end");

  if (!start || !end) {
    return NextResponse.json({ error: "start and end parameters required" }, { status: 400 });
  }

  const startDate = new Date(start);
  const endDate = new Date(end);

  const [events, reminders, applications] = await Promise.all([
    db.applicationEvent.findMany({
      where: {
        application: { userId: session.id },
        eventDate: { gte: startDate, lte: endDate },
      },
      include: {
        application: { select: { id: true, jobTitle: true, company: { select: { name: true } } } },
      },
      orderBy: { eventDate: "asc" },
    }),
    db.applicationReminder.findMany({
      where: {
        application: { userId: session.id },
        dueDate: { gte: startDate, lte: endDate },
      },
      include: {
        application: { select: { id: true, jobTitle: true, company: { select: { name: true } } } },
      },
      orderBy: { dueDate: "asc" },
    }),
    db.jobApplication.findMany({
      where: {
        userId: session.id,
        applicationDate: { gte: startDate, lte: endDate },
      },
      select: { id: true, jobTitle: true, company: { select: { name: true } }, applicationDate: true, status: true },
    }),
  ]);

  const calendarEvents = [
    ...events.map((e) => ({
      id: e.id,
      type: "event",
      title: e.title,
      description: e.description,
      start: e.eventDate,
      end: e.durationMinutes ? new Date(e.eventDate.getTime() + e.durationMinutes * 60000) : null,
      allDay: e.isAllDay,
      application: e.application,
      location: e.location,
      meetingLink: e.meetingLink,
    })),
    ...reminders.map((r) => ({
      id: r.id,
      type: "reminder",
      title: r.title,
      description: r.description,
      start: r.dueDate,
      allDay: false,
      application: r.application,
      isCompleted: r.isCompleted,
    })),
    ...applications.map((a) => ({
      id: a.id,
      type: "application",
      title: `Applied: ${a.jobTitle}`,
      start: a.applicationDate!,
      allDay: true,
      application: { id: a.id, jobTitle: a.jobTitle, company: a.company },
      status: a.status,
    })),
  ];

  return NextResponse.json({ events: calendarEvents });
}