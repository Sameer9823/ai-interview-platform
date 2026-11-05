"use client";
import { useState } from "react";
import { Button, Input, Textarea, Select, Card } from "@/components/ui";
import { useRouter } from "next/navigation";

interface Opportunity {
  id: string;
  title: string;
  company: { name: string };
}

interface ResumeVersion {
  id: string;
  versionNumber: number;
  targetRole: string | null;
}

interface Company {
  id: string;
  name: string;
}

interface NewApplicationClientProps {
  userId: string;
  opportunities: Opportunity[];
  resumeVersions: ResumeVersion[];
  companies: Company[];
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

export function NewApplicationClient({ userId, opportunities, resumeVersions, companies }: NewApplicationClientProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    opportunityId: "",
    companyId: "",
    jobTitle: "",
    applicationUrl: "",
    applicationDate: "",
    status: "INTERESTED" as const,
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    salaryExpectationMin: "",
    salaryExpectationMax: "",
    salaryCurrency: "USD",
    notes: "",
    resumeVersionId: "",
    mockInterviewSessionId: "",
    nextFollowUpDate: "",
    customTags: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          opportunityId: formData.opportunityId || undefined,
          companyId: formData.companyId || undefined,
          applicationDate: formData.applicationDate || undefined,
          salaryExpectationMin: formData.salaryExpectationMin ? parseInt(formData.salaryExpectationMin) : undefined,
          salaryExpectationMax: formData.salaryExpectationMax ? parseInt(formData.salaryExpectationMax) : undefined,
          nextFollowUpDate: formData.nextFollowUpDate || undefined,
          customTags: formData.customTags.split(",").map((t) => t.trim()).filter(Boolean),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create application");
      }

      const data = await res.json();
      router.push(`/applications/${data.application.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create application");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpportunitySelect = (opportunity: Opportunity) => {
    setFormData((prev) => ({
      ...prev,
      opportunityId: opportunity.id,
      companyId: "", // Will be filled from opportunity
      jobTitle: opportunity.title,
      applicationUrl: "",
    }));
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "24px" }}>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ margin: 0, fontSize: "1.5rem" }}>Track New Application</h1>
        <p style={{ margin: "8px 0 0", color: "var(--color-text-muted)" }}>
          Create a new application record to track your job search progress.
        </p>
      </div>

      {error && <div style={{ padding: "12px", background: "var(--color-danger-bg)", color: "var(--color-danger)", borderRadius: "8px", marginBottom: "16px" }}>{error}</div>}

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "24px" }}>
        <Card style={{ padding: "24px" }}>
          <h2 style={{ margin: "0 0 16px" }}>Basic Information</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: 500 }}>Opportunity</label>
              <Select
                name="opportunityId"
                value={formData.opportunityId}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, opportunityId: e.target.value }));
                  const opp = opportunities.find((o) => o.id === e.target.value);
                  if (opp) handleOpportunitySelect(opp);
                }}
                options={[{ value: "", label: "Select an opportunity (optional)" }, ...opportunities.map((o) => ({ value: o.id, label: `${o.title} at ${o.company.name}` }))]}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: 500 }}>Company</label>
              <Select
                name="companyId"
                value={formData.companyId}
                onChange={handleChange}
                options={[{ value: "", label: "Select a company" }, ...companies.map((c) => ({ value: c.id, label: c.name }))]}
              />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: 500 }}>Job Title *</label>
              <Input name="jobTitle" value={formData.jobTitle} onChange={handleChange} required placeholder="e.g., Senior Software Engineer" />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: 500 }}>Application URL</label>
              <Input name="applicationUrl" value={formData.applicationUrl} onChange={handleChange} type="url" placeholder="https://..." />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: 500 }}>Application Date</label>
              <Input name="applicationDate" value={formData.applicationDate} onChange={handleChange} type="date" />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: 500 }}>Status</label>
              <Select name="status" value={formData.status} onChange={handleChange} options={STATUS_OPTIONS} />
            </div>
          </div>
        </Card>

        <Card style={{ padding: "24px" }}>
          <h2 style={{ margin: "0 0 16px" }}>Contact Information (Optional)</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: 500 }}>Contact Name</label>
              <Input name="contactName" value={formData.contactName} onChange={handleChange} placeholder="Hiring manager name" />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: 500 }}>Contact Email</label>
              <Input name="contactEmail" value={formData.contactEmail} onChange={handleChange} type="email" placeholder="hiring@company.com" />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: 500 }}>Contact Phone</label>
              <Input name="contactPhone" value={formData.contactPhone} onChange={handleChange} placeholder="+1 (555) 123-4567" />
            </div>
          </div>
        </Card>

        <Card style={{ padding: "24px" }}>
          <h2 style={{ margin: "0 0 16px" }}>Salary Expectations (Optional)</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: 500 }}>Min Salary</label>
              <Input name="salaryExpectationMin" value={formData.salaryExpectationMin} onChange={handleChange} type="number" placeholder="80000" />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: 500 }}>Max Salary</label>
              <Input name="salaryExpectationMax" value={formData.salaryExpectationMax} onChange={handleChange} type="number" placeholder="120000" />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: 500 }}>Currency</label>
              <Input name="salaryCurrency" value={formData.salaryCurrency} onChange={handleChange} placeholder="USD" />
            </div>
          </div>
        </Card>

        <Card style={{ padding: "24px" }}>
          <h2 style={{ margin: "0 0 16px" }}>Notes & Tracking</h2>
          <div style={{ display: "grid", gap: "16px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: 500 }}>Notes</label>
              <Textarea name="notes" value={formData.notes} onChange={handleChange} rows={4} placeholder="Key details, interview notes, etc." />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "4px", fontWeight: 500 }}>Resume Version</label>
                <Select name="resumeVersionId" value={formData.resumeVersionId} onChange={handleChange} options={[{ value: "", label: "Select resume" }, ...resumeVersions.map((r) => ({ value: r.id, label: `v${r.versionNumber}${r.targetRole ? ` - ${r.targetRole}` : ""}` }))]} />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "4px", fontWeight: 500 }}>Next Follow-up Date</label>
                <Input name="nextFollowUpDate" value={formData.nextFollowUpDate} onChange={handleChange} type="date" />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "4px", fontWeight: 500 }}>Custom Tags (comma-separated)</label>
                <Input name="customTags" value={formData.customTags} onChange={handleChange} placeholder="priority, remote, referral" />
              </div>
            </div>
          </div>
        </Card>

        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" variant="solid" disabled={submitting}>
            {submitting ? "Creating..." : "Create Application"}
          </Button>
        </div>
      </form>
    </div>
  );
}