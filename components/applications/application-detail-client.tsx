"use client";
import { useState } from "react";
import { Button, Card, Input, Textarea, Select, Badge } from "@/components/ui";
import Link from "next/link";
import { formatDate } from "./applications-client";

type ApplicationStatus = 
  | "INTERESTED"
  | "PREPARING"
  | "APPLIED"
  | "ASSESSMENT"
  | "INTERVIEW_SCHEDULED"
  | "INTERVIEW_COMPLETED"
  | "OFFER_RECEIVED"
  | "REJECTED"
  | "WITHDRAWN"
  | "NO_RESPONSE";

interface Application {
  id: string;
  jobTitle: string;
  status: ApplicationStatus;
  applicationUrl: string | null;
  applicationDate: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  salaryExpectationMin: number | null;
  salaryExpectationMax: number | null;
  salaryCurrency: string;
  notes: string | null;
  nextFollowUpDate: string | null;
  customTags: string[];
  company: { id: string; name: string; logoUrl: string; website: string } | null;
  opportunity: { 
    id: string; 
    title: string; 
    company: { name: string; logoUrl: string; industry: string };
    location: string;
    workArrangement: string;
    employmentType: string;
    salaryMin: number | null;
    salaryMax: number | null;
    salaryCurrency: string;
    applicationUrl: string;
    applicationDeadline: string | null;
  } | null;
  resumeVersion: { id: string; versionNumber: number; targetRole: string | null } | null;
  mockInterviewSession: { id: string; mode: string; status: string } | null;
  statusHistory: Array<{
    id: string;
    fromStatus: ApplicationStatus | null;
    toStatus: ApplicationStatus;
    changedAt: string;
    changedBy: string;
    note: string | null;
  }>;
  notes_list: Array<{
    id: string;
    content: string;
    isPrivate: boolean;
    createdAt: string;
    updatedAt: string;
  }> | null;
  reminders: Array<{
    id: string;
    type: string;
    title: string;
    description: string | null;
    dueDate: string;
    isCompleted: boolean;
  }> | null;
  events: Array<{
    id: string;
    type: string;
    title: string;
    description: string | null;
    eventDate: string;
    durationMinutes: number | null;
    location: string | null;
    meetingLink: string | null;
    isAllDay: boolean;
  }>;
  attachments: Array<{
    id: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    type: string;
    uploadedAt: string;
  }>;
}

interface ApplicationDetailClientProps {
  application: Application;
  userId: string;
}

const STATUS_OPTIONS = [
  { value: "INTERESTED", label: "Interested" },
  { value: "PREPARING", label: "Preparing" },
  { value: "APPLIED", label: "Applied" },
  { value: "ASSESSMENT", label: "Assessment" },
  { value: "INTERVIEW_SCHEDULED", label: "Interview Scheduled" },
  { value: "INTERVIEW_COMPLETED", label: "Interview Completed" },
  { value: "OFFER_RECEIVED", label: "Offer Received" },
  { value: "REJECTED", label: "Rejected" },
  { value: "WITHDRAWN", label: "Withdrawn" },
  { value: "NO_RESPONSE", label: "No Response" },
];

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  INTERESTED: "var(--color-info)",
  PREPARING: "var(--color-primary)",
  APPLIED: "var(--color-warning)",
  ASSESSMENT: "var(--color-info)",
  INTERVIEW_SCHEDULED: "var(--color-primary)",
  INTERVIEW_COMPLETED: "var(--color-success)",
  OFFER_RECEIVED: "var(--color-success)",
  REJECTED: "var(--color-danger)",
  WITHDRAWN: "var(--color-text-muted)",
  NO_RESPONSE: "var(--color-text-muted)",
};

export function ApplicationDetailClient({ application, userId }: ApplicationDetailClientProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "notes" | "reminders" | "events" | "history" | "attachments">("overview");
  const [newNote, setNewNote] = useState("");

  const handleStatusChange = async (newStatus: ApplicationStatus) => {
    try {
      const res = await fetch(`/api/applications/${application.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      // Note: In a real app, you'd update the local state or refetch
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    try {
      const res = await fetch(`/api/applications/${application.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newNote.trim() }),
      });
      if (!res.ok) throw new Error("Failed to add note");
      setNewNote("");
    } catch (e) {
      console.error(e);
    }
  };

  const salaryDisplay = application.salaryExpectationMin && application.salaryExpectationMax
    ? `${application.salaryExpectationMin.toLocaleString()} - ${application.salaryExpectationMax.toLocaleString()} ${application.salaryCurrency}`
    : application.salaryExpectationMin
      ? `${application.salaryExpectationMin.toLocaleString()}+ ${application.salaryCurrency}`
      : application.salaryExpectationMax
        ? `Up to ${application.salaryExpectationMax.toLocaleString()} ${application.salaryCurrency}`
        : "Not specified";

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "24px" }}>
      <Link href="/applications" style={{ display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "24px", color: "var(--color-primary)", textDecoration: "none" }}>
        ← Back to Applications
      </Link>

      <div style={{ display: "flex", gap: "24px", marginBottom: "24px" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", marginBottom: "12px" }}>
            <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 600 }}>{application.jobTitle}</h1>
            <Badge style={{ background: STATUS_COLORS[application.status] + "20", color: STATUS_COLORS[application.status] }}>
              {application.status.replace(/_/g, " ")}
            </Badge>
          </div>
          <p style={{ margin: 0, color: "var(--color-text-muted)", fontSize: "1.1rem" }}>
            {application.company?.name || application.opportunity?.company?.name}
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", flexShrink: 0 }}>
          <Select
            value={application.status}
            onChange={(e) => handleStatusChange(e.target.value as ApplicationStatus)}
            options={STATUS_OPTIONS}
            style={{ minWidth: "200px" }}
          />
          {application.opportunity && (
            <Button variant="outline" onClick={() => window.open(application.opportunity!.applicationUrl, "_blank")}>
              View Job Posting
            </Button>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: "8px", marginBottom: "24px", borderBottom: "1px solid var(--color-border)", paddingBottom: "8px" }}>
        {["overview", "notes", "reminders", "events", "history", "attachments"].map((tab) => (
          <Button
            key={tab}
            variant={activeTab === tab ? "solid" : "outline"}
            size="small"
            onClick={() => setActiveTab(tab as typeof activeTab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "24px" }}>
          <div>
            <Card style={{ padding: "24px", marginBottom: "24px" }}>
              <h2 style={{ margin: "0 0 16px", fontSize: "1.25rem" }}>Application Details</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                <div>
                  <h3 style={{ margin: "0 0 8px", fontSize: "0.9rem", color: "var(--color-text-muted)" }}>Status</h3>
                  <p style={{ margin: 0, fontWeight: 500 }}>{application.status.replace(/_/g, " ")}</p>
                </div>
                <div>
                  <h3 style={{ margin: "0 0 8px", fontSize: "0.9rem", color: "var(--color-text-muted)" }}>Applied Date</h3>
                  <p style={{ margin: 0, fontWeight: 500 }}>{application.applicationDate ? formatDate(new Date(application.applicationDate)) : "Not set"}</p>
                </div>
                <div>
                  <h3 style={{ margin: "0 0 8px", fontSize: "0.9rem", color: "var(--color-text-muted)" }}>Next Follow-up</h3>
                  <p style={{ margin: 0, fontWeight: 500, color: application.nextFollowUpDate && new Date(application.nextFollowUpDate) < new Date() ? "var(--color-danger)" : "var(--color-text)" }}>
                    {application.nextFollowUpDate ? formatDate(new Date(application.nextFollowUpDate)) : "Not set"}
                  </p>
                </div>
                <div>
                  <h3 style={{ margin: "0 0 8px", fontSize: "0.9rem", color: "var(--color-text-muted)" }}>Salary Expectation</h3>
                  <p style={{ margin: 0, fontWeight: 500 }}>{salaryDisplay}</p>
                </div>
                <div>
                  <h3 style={{ margin: "0 0 8px", fontSize: "0.9rem", color: "var(--color-text-muted)" }}>Resume Version</h3>
                  <p style={{ margin: 0, fontWeight: 500 }}>{application.resumeVersion ? `v${application.resumeVersion.versionNumber}${application.resumeVersion.targetRole ? ` - ${application.resumeVersion.targetRole}` : ""}` : "Not linked"}</p>
                </div>
                <div>
                  <h3 style={{ margin: "0 0 8px", fontSize: "0.9rem", color: "var(--color-text-muted)" }}>Mock Interview</h3>
                  <p style={{ margin: 0, fontWeight: 500 }}>{application.mockInterviewSession ? `${application.mockInterviewSession.mode} (${application.mockInterviewSession.status})` : "Not linked"}</p>
                </div>
              </div>
            </Card>

{application.notes_list && application.notes_list.length > 0 && (
                <Card style={{ padding: "24px", marginBottom: "24px" }}>
                  <h2 style={{ margin: "0 0 16px", fontSize: "1.25rem" }}>Notes</h2>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {application.notes_list.slice(0, 3).map((note) => (
                      <div key={note.id} style={{ padding: "12px", background: "var(--color-surface)", borderRadius: "8px" }}>
                        <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", marginBottom: "4px" }}>
                          {formatDate(new Date(note.createdAt))} {note.isPrivate ? "🔒 Private" : ""}
                        </div>
                        <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{note.content}</p>
                      </div>
                    ))}
                    {application.notes_list.length > 3 && (
                      <Link href={`/applications/${application.id}?tab=notes`} style={{ color: "var(--color-primary)", textDecoration: "none" }}>
                        View all {application.notes_list.length} notes →
                      </Link>
                    )}
                  </div>
                </Card>
              )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <Card style={{ padding: "20px" }}>
              <h3 style={{ margin: "0 0 16px", fontSize: "1rem" }}>Quick Actions</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {application.opportunity && (
                  <Button variant="outline" onClick={() => window.open(application.opportunity!.applicationUrl, "_blank")} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span>🔗</span> View Job Posting
                  </Button>
                )}
                <Link href={`/mock-interviews/new?applicationId=${application.id}`}>
                  <Button variant="outline" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span>🎤</span> Start Mock Interview
                  </Button>
                </Link>
                <Link href={`/resume/match?applicationId=${application.id}`}>
                  <Button variant="outline" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span>📄</span> Resume Match Analysis
                  </Button>
                </Link>
              </div>
            </Card>

            <Card style={{ padding: "20px" }}>
              <h3 style={{ margin: "0 0 16px", fontSize: "1rem" }}>Contact</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.9rem" }}>
                {application.contactName && <span><strong>Name:</strong> {application.contactName}</span>}
                {application.contactEmail && <span><strong>Email:</strong> {application.contactEmail}</span>}
                {application.contactPhone && <span><strong>Phone:</strong> {application.contactPhone}</span>}
                {!application.contactName && !application.contactEmail && !application.contactPhone && (
                  <span style={{ color: "var(--color-text-muted)" }}>No contact info saved</span>
                )}
              </div>
            </Card>

            {application.customTags.length > 0 && (
              <Card style={{ padding: "20px" }}>
                <h3 style={{ margin: "0 0 12px", fontSize: "1rem" }}>Tags</h3>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {application.customTags.map((tag) => (
                    <Badge key={tag} style={{ background: "var(--color-primary-bg)", color: "var(--color-primary)" }}>{tag}</Badge>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {activeTab === "notes" && (
        <div>
          <Card style={{ padding: "24px", marginBottom: "24px" }}>
            <h2 style={{ margin: "0 0 16px", fontSize: "1.25rem" }}>All Notes</h2>
            <div style={{ marginBottom: "16px" }}>
              <Textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a new note..."
                rows={3}
              />
              <Button variant="solid" onClick={handleAddNote} style={{ marginTop: "8px" }}>
                Add Note
              </Button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {(application.notes_list?.length ?? 0) === 0 ? (
                <p style={{ margin: 0, color: "var(--color-text-muted)", textAlign: "center", padding: "24px" }}>No notes yet</p>
              ) : (
                application.notes_list!.map((note) => (
                  <div key={note.id} style={{ padding: "16px", background: "var(--color-surface)", borderRadius: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                      <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                        {formatDate(new Date(note.createdAt))} {note.isPrivate ? "🔒 Private" : ""}
                      </span>
                    </div>
                    <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{note.content}</p>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}

      {activeTab === "reminders" && (
        <Card style={{ padding: "24px" }}>
          <h2 style={{ margin: "0 0 16px", fontSize: "1.25rem" }}>Reminders & Follow-ups</h2>
          {(application.reminders?.length ?? 0) === 0 ? (
            <p style={{ margin: 0, color: "var(--color-text-muted)", textAlign: "center", padding: "24px" }}>No reminders set</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {application.reminders!.map((reminder) => (
                <div key={reminder.id} style={{ padding: "16px", background: "var(--color-surface)", borderRadius: "8px", borderLeft: `4px solid ${reminder.isCompleted ? "var(--color-success)" : "var(--color-warning)"}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                    <h4 style={{ margin: 0 }}>{reminder.title}</h4>
                    <Badge style={{ background: reminder.isCompleted ? "var(--color-success-bg)" : "var(--color-warning-bg)", color: reminder.isCompleted ? "var(--color-success)" : "var(--color-warning)" }}>
                      {reminder.isCompleted ? "Completed" : "Pending"}
                    </Badge>
                  </div>
                  <p style={{ margin: "0 0 8px", color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
                    Due: {formatDate(new Date(reminder.dueDate))} | Type: {reminder.type}
                  </p>
                  {reminder.description && <p style={{ margin: 0, fontSize: "0.9rem" }}>{reminder.description}</p>}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {activeTab === "events" && (
        <Card style={{ padding: "24px" }}>
          <h2 style={{ margin: "0 0 16px", fontSize: "1.25rem" }}>Events & Interviews</h2>
          {application.events.length === 0 ? (
            <p style={{ margin: 0, color: "var(--color-text-muted)", textAlign: "center", padding: "24px" }}>No events scheduled</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {application.events.map((event) => (
                <div key={event.id} style={{ padding: "16px", background: "var(--color-surface)", borderRadius: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                    <h4 style={{ margin: 0 }}>{event.title}</h4>
                    <Badge>{event.type}</Badge>
                  </div>
                  <p style={{ margin: "0 0 8px", color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
                    {formatDate(new Date(event.eventDate))} {event.durationMinutes ? `· ${event.durationMinutes} min` : ""}
                  </p>
                  {event.location && <p style={{ margin: "0 0 4px", fontSize: "0.9rem" }}>📍 {event.location}</p>}
                  {event.meetingLink && (
                    <a href={event.meetingLink} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-primary)", fontSize: "0.9rem" }}>
                      Join Meeting →
                    </a>
                  )}
                  {event.description && <p style={{ margin: "8px 0 0", fontSize: "0.9rem" }}>{event.description}</p>}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {activeTab === "history" && (
        <Card style={{ padding: "24px" }}>
          <h2 style={{ margin: "0 0 16px", fontSize: "1.25rem" }}>Status History</h2>
          {application.statusHistory.length === 0 ? (
            <p style={{ margin: 0, color: "var(--color-text-muted)", textAlign: "center", padding: "24px" }}>No history yet</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {application.statusHistory.map((entry) => (
                <div key={entry.id} style={{ padding: "16px", background: "var(--color-surface)", borderRadius: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <div>
                      {entry.fromStatus && (
                        <>
                          <Badge style={{ background: STATUS_COLORS[entry.fromStatus] + "20", color: STATUS_COLORS[entry.fromStatus] }}>
                            {entry.fromStatus.replace(/_/g, " ")}
                          </Badge>
                          <span style={{ margin: "0 8px" }}>→</span>
                        </>
                      )}
                      <Badge style={{ background: STATUS_COLORS[entry.toStatus] + "20", color: STATUS_COLORS[entry.toStatus] }}>
                        {entry.toStatus.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                      {formatDate(new Date(entry.changedAt))} by {entry.changedBy}
                    </p>
                    {entry.note && <p style={{ margin: "8px 0 0", fontSize: "0.9rem" }}>{entry.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {activeTab === "attachments" && (
        <Card style={{ padding: "24px" }}>
          <h2 style={{ margin: "0 0 16px", fontSize: "1.25rem" }}>Attachments</h2>
          {application.attachments.length === 0 ? (
            <p style={{ margin: 0, color: "var(--color-text-muted)", textAlign: "center", padding: "24px" }}>No attachments</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {application.attachments.map((attachment) => (
                <div key={attachment.id} style={{ padding: "16px", background: "var(--color-surface)", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "1.5rem" }}>📄</span>
                    <div>
                      <p style={{ margin: "0 0 4px", fontWeight: 500 }}>{attachment.fileName}</p>
                      <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                        {attachment.type} · {(attachment.fileSize / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                    Uploaded {formatDate(new Date(attachment.uploadedAt))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}