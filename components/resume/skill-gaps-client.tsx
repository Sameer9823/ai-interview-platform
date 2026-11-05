"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Button, Card, Badge, EmptyState, ProgressBar } from "@/components/ui";

interface SkillGapsClientProps {
  resumeId: string;
  userId: string;
}

interface SkillGap {
  id: string;
  skill: string;
  category: string;
  targetRole: string | null;
  classification: string;
  confidence: number | null;
  resumeEvidence: string[];
  assessmentEvidence: string[];
  practiceEvidence: string[];
  suggestedAction: string | null;
}

interface SkillGapsClientProps {
  resumeId: string;
  userId: string;
}

export function SkillGapsClient({ resumeId, userId }: SkillGapsClientProps) {
  const [gaps, setGaps] = useState<SkillGap[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    const fetchGaps = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/resume/${resumeId}/skill-gaps`);
        if (!res.ok) throw new Error("Failed to load skill gaps");
        const data = await res.json();
        setGaps(data.skillGaps || []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    };
    fetchGaps();
  }, [resumeId]);

  const filteredGaps = filter === "all" ? gaps : gaps.filter(g => g.classification === filter);

  const getClassificationBadge = (classification: string) => {
    const colors: Record<string, string> = {
      DEMONSTRATED: "var(--color-success)",
      SELF_REPORTED: "var(--color-info)",
      MENTIONED_NOT_DEMONSTRATED: "var(--color-warning)",
      NOT_FOUND: "var(--color-error)",
      NEEDS_ASSESSMENT: "var(--color-primary)",
    };
    return <Badge style={{ background: colors[classification] || "var(--color-primary)" }}>{classification.replace("_", " ")}</Badge>;
  };

  if (loading) {
    return <div style={{ display: "flex", justifyContent: "center", padding: "48px" }}><ProgressBar percent={50} /></div>;
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <Link href={`/resume/${resumeId}`} style={{ textDecoration: "none", color: "var(--color-primary)", marginBottom: 8, display: "inline-block" }}>
            ← Back to Resume
          </Link>
          <h1>Skill Gap Analysis</h1>
          <p className="mut" style={{ marginTop: 8 }}>Identify skills missing from your resume for your target roles.</p>
        </div>
      </div>

      {error && (
        <Card style={{ marginBottom: 16, padding: 16, background: "var(--color-error-bg)", borderColor: "var(--color-error)" }}>
          <div className="err">{error}</div>
        </Card>
      )}

      <Card style={{ marginBottom: 24, padding: 16 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span className="mut">Filter by classification:</span>
          {["all", "DEMONSTRATED", "MENTIONED_NOT_DEMONSTRATED", "NOT_FOUND", "NEEDS_ASSESSMENT", "SELF_REPORTED"].map((f) => (
            <Button
              key={f}
              variant={filter === f ? "solid" : "outline"}
              size="small"
              onClick={() => setFilter(f)}
              style={{ textTransform: "capitalize" }}
            >
              {f === "all" ? "All" : f.replace("_", " ")}
            </Button>
          ))}
        </div>
      </Card>

      {filteredGaps.length === 0 ? (
        <EmptyState>
          <h3>{gaps.length === 0 ? "No skill gaps analyzed" : "No gaps match this filter"}</h3>
          <p>{gaps.length === 0 ? "Run an analysis to detect skill gaps against your target roles." : "Try a different filter."}</p>
        </EmptyState>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filteredGaps.map((gap) => (
            <Card key={gap.id} style={{ padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                <div>
                  <h3 style={{ marginBottom: 4 }}>{gap.skill}</h3>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <Badge>{gap.category}</Badge>
                    {gap.targetRole && <Badge style={{ background: "var(--color-info)" }}>{gap.targetRole}</Badge>}
                    <Badge style={{ background: gap.classification === "DEMONSTRATED" ? "var(--color-success)" : gap.classification === "MENTIONED_NOT_DEMONSTRATED" ? "var(--color-warning)" : gap.classification === "NOT_FOUND" ? "var(--color-error)" : gap.classification === "NEEDS_ASSESSMENT" ? "var(--color-primary)" : "var(--color-info)" }}>
                      {gap.classification.replace("_", " ")}
                    </Badge>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ fontWeight: 600, color: gap.confidence !== null ? (gap.confidence > 0.7 ? "var(--color-success)" : "var(--color-warning)") : "var(--color-text-muted)" }}>
                    {gap.confidence !== null ? `${Math.round(gap.confidence * 100)}% confidence` : "—"}
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginTop: 12 }}>
                {gap.resumeEvidence.length > 0 && (
                  <div style={{ padding: 12, background: "var(--color-surface)", borderRadius: "8px" }}>
                    <strong>Resume Evidence:</strong>
                    <ul style={{ marginTop: 4, paddingLeft: 20, fontSize: "0.85rem" }}>
                      {gap.resumeEvidence.slice(0, 3).map((e, i) => <li key={i}>{e}</li>)}
                    </ul>
                  </div>
                )}
                {gap.assessmentEvidence.length > 0 && (
                  <div style={{ padding: 12, background: "var(--color-surface)", borderRadius: "8px" }}>
                    <strong>Assessment Evidence:</strong>
                    <ul style={{ marginTop: 4, paddingLeft: 20, fontSize: "0.85rem" }}>
                      {gap.assessmentEvidence.slice(0, 3).map((e, i) => <li key={i}>{e}</li>)}
                    </ul>
                  </div>
                )}
                {gap.practiceEvidence.length > 0 && (
                  <div style={{ padding: 12, background: "var(--color-surface)", borderRadius: "8px" }}>
                    <strong>Practice Evidence:</strong>
                    <ul style={{ marginTop: 4, paddingLeft: 20, fontSize: "0.85rem" }}>
                      {gap.practiceEvidence.slice(0, 3).map((e, i) => <li key={i}>{e}</li>)}
                    </ul>
                  </div>
                )}
              </div>

              {gap.suggestedAction && (
                <div style={{ marginTop: 12, padding: 12, background: "var(--color-info-bg)", borderRadius: "8px", border: "1px solid var(--color-info)" }}>
                  <strong>Suggested Action:</strong> {gap.suggestedAction}
                </div>
              )}

              <div style={{ marginTop: 12, display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <Link href={`/resume/${resumeId}/analysis?skill=${gap.skill}`}>
                  <Button variant="outline" size="small">View in Analysis</Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}