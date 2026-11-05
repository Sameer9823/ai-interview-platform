import { getCurrent } from "@/lib/auth/session";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db/client";
import { ApplicationDetailClient } from "@/components/applications/application-detail-client";

export default async function ApplicationPage({ params }: { params: Promise<{ applicationId: string }> }) {
  const { session } = await getCurrent();
  if (!session) redirect("/sign-in?next=/applications");

  const { applicationId } = await params;

  const application = await db.jobApplication.findFirst({
    where: { id: applicationId, userId: session.id },
    include: {
      opportunity: {
        select: {
          id: true,
          title: true,
          company: { select: { id: true, name: true, logoUrl: true, industry: true } },
          location: true,
          workArrangement: true,
          employmentType: true,
          salaryMin: true,
          salaryMax: true,
          salaryCurrency: true,
          applicationUrl: true,
          applicationDeadline: true,
        },
      },
      company: { select: { id: true, name: true, logoUrl: true, website: true } },
      resumeVersion: { select: { id: true, versionNumber: true, targetRole: true } },
      mockInterviewSession: { select: { id: true, mode: true, status: true } },
      statusHistory: { orderBy: { changedAt: "desc" } },
      notes_list: { orderBy: { createdAt: "desc" } },
      reminders: { orderBy: { dueDate: "asc" } },
      events: { orderBy: { eventDate: "asc" } },
      attachments: { orderBy: { uploadedAt: "desc" } },
    },
  });

  if (!application) notFound();

  const clientApplication = {
    ...application,
    applicationDate: application.applicationDate?.toISOString() ?? null,
    nextFollowUpDate: application.nextFollowUpDate?.toISOString() ?? null,
    createdAt: application.createdAt.toISOString(),
    updatedAt: application.updatedAt.toISOString(),
    statusHistory: application.statusHistory.map((h) => ({
      ...h,
      changedAt: h.changedAt.toISOString(),
    })),
    notes_list: application.notes_list.map((n) => ({
      ...n,
      createdAt: n.createdAt.toISOString(),
      updatedAt: n.updatedAt.toISOString(),
    })),
    reminders: application.reminders.map((r) => ({
      ...r,
      dueDate: r.dueDate.toISOString(),
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      completedAt: r.completedAt?.toISOString() ?? null,
    })),
    events: application.events.map((e) => ({
      ...e,
      eventDate: e.eventDate.toISOString(),
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
    })),
    attachments: application.attachments.map((a) => ({
      ...a,
      uploadedAt: a.uploadedAt.toISOString(),
    })),
    opportunity: application.opportunity ? {
      ...application.opportunity,
      applicationDeadline: application.opportunity.applicationDeadline?.toISOString() ?? null,
    } : null,
  };

  return (
    <ApplicationDetailClient
      application={clientApplication}
      userId={session.id}
    />
  );
}