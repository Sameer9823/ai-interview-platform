"use client";
import { useState, useCallback, useEffect } from "react";
import { Button, Card, Input, Select, Badge, EmptyState } from "@/components/ui";
import Link from "next/link";

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
  applicationDate: string | null;
  nextFollowUpDate: string | null;
  company: { id: string; name: string; logoUrl: string } | null;
  opportunity: { id: string; title: string; company: { name: string } } | null;
  resumeVersion: { id: string; versionNumber: number } | null;
  mockInterviewSession: { id: string; mode: string } | null;
  _count: { notes: number; reminders: number; events: number };
}

interface ApplicationsClientProps {
  userId: string;
}

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
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

const VIEW_MODES = [
  { value: "kanban", label: "Kanban" },
  { value: "list", label: "List" },
  { value: "calendar", label: "Calendar" },
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

const KANBAN_COLUMNS: ApplicationStatus[] = [
  "INTERESTED",
  "PREPARING",
  "APPLIED",
  "ASSESSMENT",
  "INTERVIEW_SCHEDULED",
  "INTERVIEW_COMPLETED",
  "OFFER_RECEIVED",
  "REJECTED",
  "WITHDRAWN",
  "NO_RESPONSE",
];

export function ApplicationsClient({ userId }: ApplicationsClientProps) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState({
    status: "",
    search: "",
  });
  const [viewMode, setViewMode] = useState<"kanban" | "list" | "calendar">("kanban");

  const loadApplications = useCallback(async (reset = false) => {
    if (loading) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        ...filters,
        limit: "50",
        ...(cursor && !reset && { cursor }),
      });
      const res = await fetch(`/api/applications?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load applications");
      const data = await res.json();
      if (reset) {
        setApplications(data.applications);
      } else {
        setApplications((prev) => [...prev, ...data.applications]);
      }
      setHasMore(data.hasNextPage);
      setCursor(data.nextCursor);
      setTotalCount(data.totalCount);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filters, cursor, loading]);

  const loadMore = () => {
    if (!hasMore || loading) return;
    loadApplications(false);
  };

  const refresh = () => {
    setCursor(null);
    loadApplications(true);
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCursor(null);
    loadApplications(true);
  };

  const updateStatus = async (applicationId: string, newStatus: ApplicationStatus) => {
    try {
      const res = await fetch(`/api/applications/${applicationId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      setApplications((prev) =>
        prev.map((a) => (a.id === applicationId ? { ...a, status: newStatus } : a))
      );
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (applicationId: string) => {
    if (!confirm("Are you sure you want to delete this application?")) return;
    try {
      const res = await fetch(`/api/applications/${applicationId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setApplications((prev) => prev.filter((a) => a.id !== applicationId));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const groupedApplications = KANBAN_COLUMNS.map((status) => ({
    status,
    apps: applications.filter((a) => a.status === status),
  }));

  return (
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 600 }}>Application Tracker</h1>
          <p style={{ margin: "4px 0 0", color: "var(--color-text-muted)" }}>
            Manage and track your job applications
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <Link href="/applications/new">
            <Button variant="solid">New Application</Button>
          </Link>
          <Button variant="outline" onClick={refresh} disabled={loading}>
            Refresh
          </Button>
        </div>
      </div>

      <div style={{ display: "flex", gap: "16px", marginBottom: "24px", flexWrap: "wrap" }}>
        <Select
          value={filters.status}
          onChange={(e) => handleFilterChange("status", e.target.value)}
          options={STATUS_OPTIONS}
          style={{ minWidth: "200px" }}
        />
        <Input
          placeholder="Search applications..."
          value={filters.search}
          onChange={(e) => handleFilterChange("search", e.target.value)}
          style={{ flex: 1, minWidth: "200px" }}
        />
        <div style={{ display: "flex", gap: "8px" }}>
          {VIEW_MODES.map((mode) => (
            <Button
              key={mode.value}
              variant={viewMode === mode.value ? "solid" : "outline"}
              size="small"
              onClick={() => setViewMode(mode.value as typeof viewMode)}
            >
              {mode.label}
            </Button>
          ))}
        </div>
      </div>

      {viewMode === "kanban" && (
        <div style={{ display: "flex", gap: "16px", overflowX: "auto", paddingBottom: "16px", minHeight: "500px" }}>
          {groupedApplications.map(({ status, apps }) => (
            <KanbanColumn key={status} status={status} apps={apps} onUpdateStatus={updateStatus} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {viewMode === "list" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {applications.length === 0 && !loading && (
            <EmptyState>
              <h3>No applications found</h3>
              <p>Create your first application or adjust your filters.</p>
              <Link href="/applications/new"><Button variant="solid">New Application</Button></Link>
            </EmptyState>
          )}
          {applications.map((app) => (
            <ApplicationListItem key={app.id} app={app} onUpdateStatus={updateStatus} onDelete={handleDelete} />
          ))}
          {hasMore && (
            <div style={{ textAlign: "center", marginTop: "24px" }}>
              <Button variant="outline" onClick={loadMore} disabled={loading}>
                {loading ? "Loading..." : "Load More"}
              </Button>
            </div>
          )}
        </div>
      )}

      {viewMode === "calendar" && (
        <ApplicationCalendar applications={applications} onUpdateStatus={updateStatus} />
      )}
    </div>
  );
}

function KanbanColumn({ status, apps, onUpdateStatus, onDelete }: { status: ApplicationStatus; apps: Application[]; onUpdateStatus: (id: string, status: ApplicationStatus) => void; onDelete: (id: string) => void }) {
  const color = STATUS_COLORS[status];
  return (
    <div style={{ minWidth: "300px", maxWidth: "300px", flexShrink: 0, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: color + "20", borderRadius: "8px 8px 0 0", borderBottom: `2px solid ${color}` }}>
        <h3 style={{ margin: 0, fontSize: "0.85rem", fontWeight: 600, color }}>{status.replace(/_/g, " ")}</h3>
        <Badge style={{ background: color, color: "white" }}>{apps.length}</Badge>
      </div>
      <div style={{ flex: 1, padding: "8px", minHeight: "400px", background: "var(--color-surface)", borderRadius: "0 0 8px 8px", overflowY: "auto" }}>
        {apps.length === 0 ? (
          <div style={{ padding: "24px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
            Drop applications here
          </div>
        ) : (
          apps.map((app) => (
            <KanbanCard key={app.id} app={app} onUpdateStatus={onUpdateStatus} onDelete={onDelete} />
          ))
        )}
      </div>
    </div>
  );
}

function KanbanCard({ app, onUpdateStatus, onDelete }: { app: Application; onUpdateStatus: (id: string, status: ApplicationStatus) => void; onDelete: (id: string) => void }) {
  return (
    <div style={{ background: "white", border: "1px solid var(--color-border)", borderRadius: "8px", padding: "12px", marginBottom: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
        <Link href={`/applications/${app.id}`} style={{ textDecoration: "none", color: "inherit", flex: 1 }}>
          <h4 style={{ margin: "0 0 4px", fontWeight: 600, fontSize: "0.9rem" }}>{app.jobTitle}</h4>
          <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
            {app.company?.name || app.opportunity?.company?.name}
          </p>
        </Link>
        <div style={{ display: "flex", gap: "4px" }}>
          <Button variant="outline" size="small" onClick={() => onDelete(app.id)} title="Delete" style={{ padding: "4px" }}>✕</Button>
        </div>
      </div>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "8px", fontSize: "0.75rem" }}>
        {app.company && <Badge style={{ background: "var(--color-info-bg)", color: "var(--color-info)" }}>{app.company.name}</Badge>}
        {app.opportunity && <Badge>{app.opportunity.title}</Badge>}
        {app.resumeVersion && <Badge style={{ background: "var(--color-primary-bg)", color: "var(--color-primary)" }}>Resume v{app.resumeVersion.versionNumber}</Badge>}
        {app.mockInterviewSession && <Badge style={{ background: "var(--color-warning-bg)", color: "var(--color-warning)" }}>Mock Interview</Badge>}
      </div>
      {app.nextFollowUpDate && (
        <div style={{ fontSize: "0.75rem", color: new Date(app.nextFollowUpDate) < new Date() ? "var(--color-danger)" : "var(--color-warning)", marginBottom: "8px" }}>
          📅 Follow up by {formatDate(new Date(app.nextFollowUpDate))}
        </div>
      )}
      <Select
        value={app.status}
        onChange={(e) => onUpdateStatus(app.id, e.target.value as ApplicationStatus)}
        options={STATUS_OPTIONS.filter((o) => o.value)}
        style={{ fontSize: "0.8rem" }}
      />
    </div>
  );
}

function ApplicationListItem({ app, onUpdateStatus, onDelete }: { app: Application; onUpdateStatus: (id: string, status: ApplicationStatus) => void; onDelete: (id: string) => void }) {
  return (
    <Card style={{ padding: "16px", display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
      <div style={{ flex: 1, minWidth: "250px" }}>
        <Link href={`/applications/${app.id}`} style={{ textDecoration: "none", color: "inherit" }}>
          <h4 style={{ margin: "0 0 4px", fontWeight: 600 }}>{app.jobTitle}</h4>
        </Link>
        <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--color-text-muted)" }}>
          {app.company?.name || app.opportunity?.company?.name}
        </p>
      </div>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
        <Badge style={{ background: STATUS_COLORS[app.status] + "20", color: STATUS_COLORS[app.status] }}>{app.status.replace(/_/g, " ")}</Badge>
        {app.company && <Badge>{app.company.name}</Badge>}
        {app.opportunity && <Badge>{app.opportunity.title}</Badge>}
        {app.nextFollowUpDate && (
          <Badge style={{ background: new Date(app.nextFollowUpDate!) < new Date() ? "var(--color-danger-bg)" : "var(--color-warning-bg)", color: new Date(app.nextFollowUpDate!) < new Date() ? "var(--color-danger)" : "var(--color-warning)" }}>
            📅 {formatDate(new Date(app.nextFollowUpDate!))}
          </Badge>
        )}
        {app.applicationDate && <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Applied {formatDate(new Date(app.applicationDate!))}</span>}
      </div>
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <Select
          value={app.status}
          onChange={(e) => onUpdateStatus(app.id, e.target.value as ApplicationStatus)}
          options={STATUS_OPTIONS.filter((o) => o.value)}
          style={{ minWidth: "150px" }}
        />
        <Button variant="outline" size="small" onClick={() => onDelete(app.id)} title="Delete">✕</Button>
      </div>
    </Card>
  );
}

function ApplicationCalendar({ applications, onUpdateStatus }: { applications: Application[]; onUpdateStatus: (id: string, status: ApplicationStatus) => void }) {
  return (
    <Card style={{ padding: "24px" }}>
      <h3 style={{ margin: "0 0 16px" }}>Calendar View</h3>
      <p style={{ margin: "0 0 24px", color: "var(--color-text-muted)" }}>
        Calendar view shows application deadlines, interview dates, and follow-ups.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
        {applications
          .filter((a) => a.nextFollowUpDate || a.applicationDate)
          .sort((a, b) => new Date(a.nextFollowUpDate || a.applicationDate || 0).getTime() - new Date(b.nextFollowUpDate || b.applicationDate || 0).getTime())
          .slice(0, 20)
          .map((app) => (
            <div key={app.id} style={{ padding: "16px", border: "1px solid var(--color-border)", borderRadius: "8px" }}>
              <h4 style={{ margin: "0 0 8px" }}>{app.jobTitle}</h4>
              <p style={{ margin: "0 0 4px", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>{app.company?.name || app.opportunity?.company?.name}</p>
              {app.nextFollowUpDate && (
                <p style={{ margin: "0 0 4px", fontSize: "0.85rem", color: "var(--color-warning)" }}>📅 Follow up: {formatDate(new Date(app.nextFollowUpDate))}</p>
              )}
              {app.applicationDate && (
                <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-text-muted)" }}>Applied: {formatDate(new Date(app.applicationDate))}</p>
              )}
            </div>
          ))}
      </div>
    </Card>
  );
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString();
}