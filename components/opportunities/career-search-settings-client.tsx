"use client";
import { useState, useEffect } from "react";
import { Button, Input, Select, Card } from "@/components/ui";

interface JobSearchPreferences {
  targetRoles: string[];
  preferredIndustries: string[];
  preferredCompanies: string[];
  preferredLocations: string[];
  workArrangements: string[];
  employmentTypes: string[];
  experienceLevel: string;
  salaryMin: number;
  salaryMax: number;
  salaryCurrency: string;
  preferredSkills: string[];
  opportunityTypes: string[];
  notificationTypes: string[];
  isPaused: boolean;
}

const WORK_ARRANGEMENT_OPTIONS = [
  { value: "ONSITE", label: "On-site" },
  { value: "HYBRID", label: "Hybrid" },
  { value: "REMOTE", label: "Remote" },
  { value: "FLEXIBLE", label: "Flexible" },
];

const EMPLOYMENT_TYPE_OPTIONS = [
  { value: "FULL_TIME", label: "Full-time" },
  { value: "PART_TIME", label: "Part-time" },
  { value: "CONTRACT", label: "Contract" },
  { value: "INTERNSHIP", label: "Internship" },
  { value: "GRADUATE_TRAINEE", label: "Graduate Trainee" },
  { value: "APPRENTICESHIP", label: "Apprenticeship" },
  { value: "ENTRY_LEVEL", label: "Entry Level" },
];

const EXPERIENCE_LEVEL_OPTIONS = [
  { value: "", label: "Any" },
  { value: "STUDENT", label: "Student" },
  { value: "FRESHER", label: "Fresher (0-1 year)" },
  { value: "JUNIOR", label: "Junior (1-3 years)" },
  { value: "MID", label: "Mid-level (3-5 years)" },
  { value: "SENIOR", label: "Senior (5-8 years)" },
  { value: "LEAD", label: "Lead/Principal (8+ years)" },
];

const NOTIFICATION_TYPES = [
  { value: "NEW_MATCH", label: "New job matches" },
  { value: "APPLICATION_DEADLINE", label: "Application deadlines" },
  { value: "FOLLOW_UP_REMINDER", label: "Follow-up reminders" },
  { value: "STATUS_CHANGE", label: "Application status changes" },
  { value: "INTERVIEW_SCHEDULED", label: "Interview scheduled" },
  { value: "ASSESSMENT_DEADLINE", label: "Assessment deadlines" },
  { value: "RECOMMENDATION_READY", label: "New recommendations available" },
];

interface CareerSearchSettingsClientProps {
  userId: string;
}

export function CareerSearchSettingsClient({ userId }: CareerSearchSettingsClientProps) {
  const [preferences, setPreferences] = useState<JobSearchPreferences>({
    targetRoles: [],
    preferredIndustries: [],
    preferredCompanies: [],
    preferredLocations: [],
    workArrangements: [],
    employmentTypes: [],
    experienceLevel: "",
    salaryMin: 0,
    salaryMax: 0,
    salaryCurrency: "USD",
    preferredSkills: [],
    opportunityTypes: [],
    notificationTypes: [],
    isPaused: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadPreferences = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/career-search/preferences");
      if (!res.ok) throw new Error("Failed to load preferences");
      const data = await res.json();
      if (data.preferences) {
        setPreferences(data.preferences);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: string, value: any) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  };

  const handleArrayChange = (key: string, value: string, checked: boolean) => {
    setPreferences((prev) => {
      const current = prev[key as keyof JobSearchPreferences] as string[];
      if (checked) {
        return { ...prev, [key]: [...current, value] };
      } else {
        return { ...prev, [key]: current.filter((v) => v !== value) };
      }
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/career-search/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save");
      }
      setSuccess("Preferences saved successfully");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handlePause = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/career-search/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...preferences, isPaused: !preferences.isPaused }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setPreferences((prev) => ({ ...prev, isPaused: !prev.isPaused }));
      setSuccess(preferences.isPaused ? "Recommendations resumed" : "Recommendations paused");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    loadPreferences();
  }, []);

  if (loading) {
    return <div style={{ padding: "24px" }}>Loading...</div>;
  }

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "24px" }}>
      <h1 style={{ margin: "0 0 8px", fontSize: "1.75rem" }}>Career Search Settings</h1>
      <p style={{ margin: "0 0 24px", color: "var(--color-text-muted)" }}>
        Configure your job search preferences to get personalized recommendations.
      </p>

      {error && <div style={{ padding: "12px", background: "var(--color-danger-bg)", color: "var(--color-danger)", borderRadius: "8px", marginBottom: "16px" }}>{error}</div>}
      {success && <div style={{ padding: "12px", background: "var(--color-success-bg)", color: "var(--color-success)", borderRadius: "8px", marginBottom: "16px" }}>{success}</div>}

      <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
        <Card style={{ padding: "24px", marginBottom: "24px" }}>
          <h2 style={{ margin: "0 0 16px" }}>Target Roles & Industries</h2>
          <div style={{ display: "grid", gap: "16px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: 500 }}>Target Roles (comma-separated)</label>
              <Input
                value={preferences.targetRoles.join(", ")}
                onChange={(e) => handleChange("targetRoles", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
                placeholder="e.g., Frontend Developer, Full Stack Engineer"
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: 500 }}>Preferred Industries (comma-separated)</label>
              <Input
                value={preferences.preferredIndustries.join(", ")}
                onChange={(e) => handleChange("preferredIndustries", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
                placeholder="e.g., Technology, Finance, Healthcare"
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: 500 }}>Preferred Companies (comma-separated)</label>
              <Input
                value={preferences.preferredCompanies.join(", ")}
                onChange={(e) => handleChange("preferredCompanies", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
                placeholder="e.g., Google, Microsoft, Startup"
              />
            </div>
          </div>
        </Card>

        <Card style={{ padding: "24px", marginBottom: "24px" }}>
          <h2 style={{ margin: "0 0 16px" }}>Location & Work Arrangement</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: 500 }}>Preferred Locations (comma-separated)</label>
              <Input
                value={preferences.preferredLocations.join(", ")}
                onChange={(e) => handleChange("preferredLocations", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
                placeholder="e.g., San Francisco, New York, Remote"
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: 500 }}>Work Arrangements</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {WORK_ARRANGEMENT_OPTIONS.map((opt) => (
                  <label key={opt.value} style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={preferences.workArrangements.includes(opt.value)}
                      onChange={(e) => handleArrayChange("workArrangements", opt.value, e.target.checked)}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: 500 }}>Employment Types</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {EMPLOYMENT_TYPE_OPTIONS.map((opt) => (
                  <label key={opt.value} style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={preferences.employmentTypes.includes(opt.value)}
                      onChange={(e) => handleArrayChange("employmentTypes", opt.value, e.target.checked)}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: 500 }}>Experience Level</label>
              <Select
                value={preferences.experienceLevel}
                onChange={(e) => handleChange("experienceLevel", e.target.value)}
                options={EXPERIENCE_LEVEL_OPTIONS}
              />
            </div>
          </div>
        </Card>

        <Card style={{ padding: "24px", marginBottom: "24px" }}>
          <h2 style={{ margin: "0 0 16px" }}>Salary Expectations</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: 500 }}>Minimum Salary</label>
              <Input
                type="number"
                value={preferences.salaryMin || ""}
                onChange={(e) => handleChange("salaryMin", parseInt(e.target.value) || 0)}
                placeholder="80000"
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: 500 }}>Maximum Salary</label>
              <Input
                type="number"
                value={preferences.salaryMax || ""}
                onChange={(e) => handleChange("salaryMax", parseInt(e.target.value) || 0)}
                placeholder="150000"
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: 500 }}>Currency</label>
              <Input value={preferences.salaryCurrency} onChange={(e) => handleChange("salaryCurrency", e.target.value)} placeholder="USD" />
            </div>
          </div>
        </Card>

        <Card style={{ padding: "24px", marginBottom: "24px" }}>
          <h2 style={{ margin: "0 0 16px" }}>Skills & Opportunity Types</h2>
          <div style={{ display: "grid", gap: "16px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: 500 }}>Preferred Skills (comma-separated)</label>
              <Input
                value={preferences.preferredSkills.join(", ")}
                onChange={(e) => handleChange("preferredSkills", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
                placeholder="e.g., React, TypeScript, AWS, SQL"
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: 500 }}>Opportunity Types</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {EMPLOYMENT_TYPE_OPTIONS.map((opt) => (
                  <label key={opt.value} style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={preferences.opportunityTypes.includes(opt.value)}
                      onChange={(e) => handleArrayChange("opportunityTypes", opt.value, e.target.checked)}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card style={{ padding: "24px", marginBottom: "24px" }}>
          <h2 style={{ margin: "0 0 16px" }}>Notifications</h2>
          <p style={{ margin: "0 0 16px", color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
            Choose which notifications you want to receive about your job search.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "12px" }}>
            {NOTIFICATION_TYPES.map((opt) => (
              <label key={opt.value} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={preferences.notificationTypes.includes(opt.value)}
                  onChange={(e) => handleArrayChange("notificationTypes", opt.value, e.target.checked)}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </Card>

        <Card style={{ padding: "24px", marginBottom: "24px" }}>
          <h2 style={{ margin: "0 0 16px" }}>Recommendation Status</h2>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ flex: 1 }}>
              <p style={{ margin: "0 0 4px", fontWeight: 500 }}>
                {preferences.isPaused ? "Recommendations are paused" : "Recommendations are active"}
              </p>
              <p style={{ margin: 0, color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
                {preferences.isPaused
                  ? "You won't receive new job recommendations until you resume them."
                  : "You'll receive personalized job recommendations based on your preferences."}
              </p>
            </div>
            <Button
              type="button"
              variant={preferences.isPaused ? "solid" : "outline"}
              onClick={handlePause}
              disabled={saving}
            >
              {preferences.isPaused ? "Resume Recommendations" : "Pause Recommendations"}
            </Button>
          </div>
        </Card>

        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
          <Button type="button" variant="outline" onClick={loadPreferences} disabled={loading || saving}>Reset</Button>
          <Button type="submit" variant="solid" disabled={saving || loading}>
            {saving ? "Saving..." : "Save Preferences"}
          </Button>
        </div>
      </form>
    </div>
  );
}