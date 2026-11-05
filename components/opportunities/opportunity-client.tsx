"use client";
import { useState, useCallback, useEffect } from "react";
import { Button, Card, Input, Select, Badge, EmptyState } from "@/components/ui";
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
  experienceMin: number | null;
  experienceMax: number | null;
  description: string;
  applicationDeadline: string | null;
  postedDate: string;
  isRemote: boolean;
  isEntryLevel: boolean;
  viewCount: number;
  isSaved?: boolean;
userMatch?: {
    overallScore: number;
    matchingSkills: string[];
    missingSkills: string[];
    category: string;
    explanation: string;
  } | null;
}

interface OpportunityClientProps {
  userId: string;
}

const TYPE_OPTIONS = [
  { value: "", label: "All Types" },
  { value: "FULL_TIME", label: "Full-time" },
  { value: "PART_TIME", label: "Part-time" },
  { value: "INTERNSHIP", label: "Internship" },
  { value: "GRADUATE_TRAINEE", label: "Graduate Trainee" },
  { value: "APPRENTICESHIP", label: "Apprenticeship" },
  { value: "CONTRACT", label: "Contract" },
  { value: "REMOTE", label: "Remote" },
  { value: "ENTRY_LEVEL", label: "Entry Level" },
];

const WORK_ARRANGEMENT_OPTIONS = [
  { value: "", label: "All" },
  { value: "ONSITE", label: "On-site" },
  { value: "HYBRID", label: "Hybrid" },
  { value: "REMOTE", label: "Remote" },
  { value: "FLEXIBLE", label: "Flexible" },
];

const SORT_OPTIONS = [
  { value: "latest", label: "Latest" },
  { value: "deadline", label: "Deadline Soonest" },
  { value: "salary", label: "Highest Salary" },
  { value: "match", label: "Best Match" },
];

export function OpportunityClient({ userId }: OpportunityClientProps) {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState({
    search: "",
    type: "",
    workArrangement: "",
    location: "",
    isRemote: false,
    isEntryLevel: false,
    sortBy: "latest" as const,
  });
  const [showFilters, setShowFilters] = useState(false);

const loadOpportunities = useCallback(async (reset = false) => {
    if (loading) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== "" && value !== false) {
          params.append(key, String(value));
        }
      });
      params.append("limit", "20");
      if (cursor && !reset) {
        params.append("cursor", cursor);
      }
      const res = await fetch(`/api/opportunities?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load opportunities");
      const data = await res.json();
      if (reset) {
        setOpportunities(data.opportunities);
      } else {
        setOpportunities((prev) => [...prev, ...data.opportunities]);
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
    loadOpportunities(false);
  };

  const refresh = () => {
    setCursor(null);
    loadOpportunities(true);
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCursor(null);
    loadOpportunities(true);
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      type: "",
      workArrangement: "",
      location: "",
      isRemote: false,
      isEntryLevel: false,
      sortBy: "latest",
    });
    setCursor(null);
    loadOpportunities(true);
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleSave = async (opportunityId: string, currentlySaved: boolean) => {
    try {
      if (currentlySaved) {
        await fetch("/api/opportunities/" + opportunityId, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "unsave" }),
        });
      } else {
        await fetch("/api/opportunities/" + opportunityId, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "save" }),
        });
      }
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

  return (
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 600 }}>Career Opportunities</h1>
          <p style={{ margin: "4px 0 0", color: "var(--color-text-muted)" }}>
            Discover jobs and internships tailored to your profile
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <Button variant="outline" onClick={refresh} disabled={loading}>
            Refresh
          </Button>
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
            {showFilters ? "Hide Filters" : "Filters"}
          </Button>
          <Link href="/opportunities/saved">
            <Button variant="outline">Saved ({totalCount})</Button>
          </Link>
          <Link href="/opportunities/recommended">
            <Button variant="solid">Recommended</Button>
          </Link>
        </div>
      </div>

      {showFilters && (
        <Card style={{ padding: "20px", marginBottom: "24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: 500 }}>Search</label>
              <Input
                placeholder="Job title, company, skills..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: 500 }}>Type</label>
              <Select
                value={filters.type}
                onChange={(e) => handleFilterChange("type", e.target.value)}
                options={TYPE_OPTIONS}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: 500 }}>Work Arrangement</label>
              <Select
                value={filters.workArrangement}
                onChange={(e) => handleFilterChange("workArrangement", e.target.value)}
                options={WORK_ARRANGEMENT_OPTIONS}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: 500 }}>Location</label>
              <Input
                placeholder="City, state, or remote"
                value={filters.location}
                onChange={(e) => handleFilterChange("location", e.target.value)}
              />
            </div>
            <div style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={filters.isRemote}
                  onChange={(e) => handleFilterChange("isRemote", e.target.checked)}
                />
                Remote only
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={filters.isEntryLevel}
                  onChange={(e) => handleFilterChange("isEntryLevel", e.target.checked)}
                />
                Entry level
              </label>
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: 500 }}>Sort By</label>
              <Select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                options={SORT_OPTIONS}
              />
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
              <Button variant="outline" onClick={clearFilters}>Clear</Button>
            </div>
          </div>
        </Card>
      )}

      {opportunities.length === 0 && !loading && (
        <EmptyState>
          <h3>No opportunities found</h3>
          <p>Try adjusting your filters or check back later.</p>
        </EmptyState>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "16px" }}>
        {opportunities.map((opp) => (
          <OpportunityCard
            key={opp.id}
            opportunity={opp}
            onSave={handleSave}
            onDismiss={handleDismiss}
          />
        ))}
      </div>

      {hasMore && (
        <div style={{ textAlign: "center", marginTop: "24px" }}>
          <Button variant="outline" onClick={loadMore} disabled={loading}>
            {loading ? "Loading..." : "Load More"}
          </Button>
        </div>
      )}
    </div>
  );
}

function OpportunityCard({ opportunity, onSave, onDismiss }: { opportunity: Opportunity; onSave: (id: string, saved: boolean) => void; onDismiss: (id: string) => void }) {
  const salaryDisplay = opportunity.salaryMin && opportunity.salaryMax
    ? `$${(opportunity.salaryMin / 1000).toFixed(0)}k - $${(opportunity.salaryMax / 1000).toFixed(0)}k`
    : opportunity.salaryMin
      ? `$${(opportunity.salaryMin / 1000).toFixed(0)}k+`
      : opportunity.salaryMax
        ? `Up to $${(opportunity.salaryMax / 1000).toFixed(0)}k`
        : "Not disclosed";

  const matchColor = opportunity.userMatch?.overallScore !== undefined
    ? opportunity.userMatch!.overallScore >= 80 ? "var(--color-success)" :
      opportunity.userMatch!.overallScore >= 60 ? "var(--color-warning)" : "var(--color-text-muted)"
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

        {opportunity.userMatch && (
          <div style={{ marginBottom: "12px", padding: "8px", background: "var(--color-surface)", borderRadius: "6px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
              <span style={{ fontWeight: 500, fontSize: "0.85rem" }}>Match Score</span>
              <span style={{ fontWeight: 700, fontSize: "1.2rem", color: matchColor }}>{opportunity.userMatch.overallScore}%</span>
            </div>
            <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{opportunity.userMatch.explanation}</p>
            {opportunity.userMatch.matchingSkills.length > 0 && (
              <div style={{ marginTop: "8px", display: "flex", gap: "4px", flexWrap: "wrap" }}>
                {opportunity.userMatch.matchingSkills.slice(0, 5).map((skill) => (
                  <Badge key={skill} style={{ background: "var(--color-success-bg)", color: "var(--color-success)", fontSize: "0.7rem" }}>{skill}</Badge>
                ))}
                {opportunity.userMatch.matchingSkills.length > 5 && <Badge style={{ fontSize: "0.7rem" }}>+{opportunity.userMatch.matchingSkills.length - 5} more</Badge>}
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
          <Button variant="outline" size="small" onClick={() => onDismiss(opportunity.id)} title="Not interested">
            ✕
          </Button>
        </div>
      </div>
    </Card>
    );
  }

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString();
}



