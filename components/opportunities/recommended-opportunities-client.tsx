"use client";
import { useState, useCallback, useEffect } from "react";
import { Button, Card, Badge, EmptyState } from "@/components/ui";
import Link from "next/link";

interface Opportunity {
  id: string;
  title: string;
  slug: string;
  company: { id: string; name: string; logoUrl: string; industry: string };
  type: string;
  employmentType: string;
  workArrangement: string;
  location: string;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  salaryPeriod: string;
  experienceMin: number | null;
  experienceMax: number | null;
  description: string;
  applicationDeadline: string | null;
  postedDate: string;
  isRemote: boolean;
  isEntryLevel: boolean;
  viewCount: number;
  matchScore?: number;
  matchingSkills?: string[];
  missingSkills?: string[];
  category?: string;
  explanation?: string;
  isSaved?: boolean;
}

interface RecommendedOpportunitiesClientProps {
  userId: string;
}

export function RecommendedOpportunitiesClient({ userId }: RecommendedOpportunitiesClientProps) {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRecommendations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/opportunities/recommended?limit=20");
      if (!res.ok) throw new Error("Failed to load recommendations");
      const data = await res.json();
      setOpportunities(data.opportunities || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSave = async (opportunityId: string, currentlySaved: boolean) => {
    try {
      await fetch("/api/opportunities/" + opportunityId, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: currentlySaved ? "unsave" : "save" }),
      });
      setOpportunities((prev) =>
        prev.map((o) =>
          o.id === opportunityId ? { ...o, isSaved: !currentlySaved } : o
        )
      );
    } catch (e) {
      console.error(e);
    }
  };

  const handleDismiss = async (opportunityId: string) => {
    try {
      await fetch("/api/opportunities/" + opportunityId, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "dismiss" }),
      });
      setOpportunities((prev) => prev.filter((o) => o.id !== opportunityId));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  return (
    <div style={{ padding: "24px", maxWidth: "1000px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 600 }}>Recommended for You</h1>
          <p style={{ margin: "4px 0 0", color: "var(--color-text-muted)" }}>
            Based on your profile, skills, and preferences
          </p>
        </div>
        <Button variant="outline" onClick={loadRecommendations} disabled={loading}>
          Refresh
        </Button>
      </div>

      {error && (
        <div style={{ padding: "12px", background: "var(--color-danger-bg)", color: "var(--color-danger)", borderRadius: "8px", marginBottom: "16px" }}>
          {error}
        </div>
      )}

      {opportunities.length === 0 && !loading && (
        <EmptyState>
          <h3>No recommendations yet</h3>
          <p>Complete your profile and set your career preferences to get personalized job recommendations.</p>
          <Link href="/career-search/settings">
            <Button variant="solid">Update Preferences</Button>
          </Link>
        </EmptyState>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "16px" }}>
        {opportunities.map((opp) => (
          <RecommendedOpportunityCard
            key={opp.id}
            opportunity={opp}
            onSave={handleSave}
            onDismiss={handleDismiss}
          />
        ))}
      </div>
    </div>
  );
}

function RecommendedOpportunityCard({ opportunity, onSave, onDismiss }: { opportunity: Opportunity; onSave: (id: string, saved: boolean) => void; onDismiss: (id: string) => void }) {
  const salaryDisplay = opportunity.salaryMin && opportunity.salaryMax
    ? `$${(opportunity.salaryMin / 1000).toFixed(0)}k - $${(opportunity.salaryMax / 1000).toFixed(0)}k`
    : opportunity.salaryMin
      ? `$${(opportunity.salaryMin / 1000).toFixed(0)}k+`
      : opportunity.salaryMax
        ? `Up to $${(opportunity.salaryMax / 1000).toFixed(0)}k`
        : "Not disclosed";

  const matchColor = opportunity.matchScore !== undefined
    ? opportunity.matchScore! >= 80 ? "var(--color-success)" :
      opportunity.matchScore! >= 60 ? "var(--color-warning)" : "var(--color-text-muted)"
    : "transparent";

  return (
    <Card style={{ padding: "20px", display: "flex", flexDirection: "column", height: "100%", position: "relative" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          {opportunity.company.logoUrl && (
            <img src={opportunity.company.logoUrl} alt={opportunity.company.name} style={{ width: "40px", height: "40px", borderRadius: "8px", objectFit: "cover" }} />
          )}
          <div>
            <Link href={`/opportunities/${opportunity.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
              <h3 style={{ margin: "0 0 4px", fontWeight: 600, fontSize: "1.1rem" }}>{opportunity.title}</h3>
            </Link>
            <p style={{ margin: 0, color: "var(--color-text-muted)", fontSize: "0.9rem" }}>{opportunity.company.name}</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginBottom: "8px" }}>
          <Badge style={{ background: "var(--color-primary-bg)", color: "var(--color-primary)" }}>{opportunity.type}</Badge>
          <Badge>{opportunity.workArrangement}</Badge>
          {opportunity.isRemote && <Badge style={{ background: "var(--color-success-bg)", color: "var(--color-success)" }}>Remote</Badge>}
          {opportunity.isEntryLevel && <Badge style={{ background: "var(--color-info-bg)", color: "var(--color-info)" }}>Entry Level</Badge>}
        </div>

        {opportunity.matchScore !== undefined && (
          <div style={{ marginBottom: "12px", padding: "8px", background: "var(--color-surface)", borderRadius: "6px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
              <span style={{ fontWeight: 500, fontSize: "0.85rem" }}>Match Score</span>
              <span style={{ fontWeight: 700, fontSize: "1.2rem", color: matchColor }}>{opportunity.matchScore}%</span>
            </div>
            <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{opportunity.explanation || "Good match based on your profile"}</p>
            {opportunity.matchingSkills && opportunity.matchingSkills.length > 0 && (
              <div style={{ marginTop: "8px", display: "flex", gap: "4px", flexWrap: "wrap" }}>
                {opportunity.matchingSkills.slice(0, 5).map((skill) => (
                  <Badge key={skill} style={{ background: "var(--color-success-bg)", color: "var(--color-success)", fontSize: "0.7rem" }}>{skill}</Badge>
                ))}
                {opportunity.matchingSkills.length > 5 && <Badge style={{ fontSize: "0.7rem" }}>+{opportunity.matchingSkills.length - 5} more</Badge>}
              </div>
            )}
          </div>
        )}

        <div style={{ marginBottom: "12px", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
            <span>📍 {opportunity.location}</span>
            <span>💰 {salaryDisplay}</span>
            {opportunity.experienceMin !== null || opportunity.experienceMax !== null && (
              <span>📈 {opportunity.experienceMin ?? 0}-{opportunity.experienceMax ?? "10+"} yrs</span>
            )}
          </div>
          <div style={{ marginTop: "4px" }}>
            <span>📅 Posted {formatDate(new Date(opportunity.postedDate))}</span>
            {opportunity.applicationDeadline && (
              <span style={{ marginLeft: "12px", color: new Date(opportunity.applicationDeadline) < new Date() ? "var(--color-danger)" : "var(--color-warning)" }}>
                Deadline: {formatDate(new Date(opportunity.applicationDeadline))}
              </span>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px", marginTop: "auto", paddingTop: "12px", borderTop: "1px solid var(--color-border)" }}>
          <Link href={`/opportunities/${opportunity.slug}`}>
            <Button variant="outline" size="small" style={{ flex: 1 }}>View Details</Button>
          </Link>
          <Button
            variant={opportunity.isSaved ? "solid" : "outline"}
            size="small"
            onClick={() => onSave(opportunity.id, opportunity.isSaved ?? false)}
            style={{ flex: 1 }}
          >
            {opportunity.isSaved ? "★ Saved" : "☆ Save"}
          </Button>
          <Button variant="outline" size="small" onClick={() => onDismiss(opportunity.id)} style={{ flex: 1 }}>Dismiss</Button>
        </div>
      </div>
    </Card>
    );
  }

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString();
}