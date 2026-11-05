"use client";
import React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Button, Card, Badge, ProgressBar, EmptyState, Input, Textarea, Select } from "@/components/ui";

interface ResumeDetailProps {
  resumeId: string;
  userId: string;
}

interface Resume {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  versions: ResumeVersion[];
}

interface ResumeVersion {
  id: string;
  versionNumber: number;
  targetRole: string | null;
  isActive: boolean;
  extractedProfile: { profileJson: any } | null;
  analyses: ResumeAnalysis[];
  skillGaps: SkillGap[];
  jobMatches: JobMatch[];
  _count?: { jobMatches: number; analyses: number };
}

interface ResumeAnalysis {
  id: string;
  targetRole: string | null;
  status: string;
  overallScore: number | null;
  createdAt: string;
  analysisJson?: any;
  categories: Array<{ category: string; score: number; maxScore: number; weight: number; findings: any[] }>;
  recommendations: ResumeRecommendation[];
  rewrites: ResumeRewrite[];
}

interface ResumeRecommendation {
  id: string;
  title: string;
  description: string;
  priority: number;
  category: string;
  evidence: string[];
  expectedEffort: string;
  relatedSkills: string[];
  suggestedTasks: string[];
}

interface ResumeRewrite {
  id: string;
  section: string;
  originalText: string;
  suggestedText: string;
  rationale: string;
  assumptions: string[];
  isAccepted: boolean;
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

interface JobMatch {
  id: string;
  overallMatch: number | null;
  createdAt: string;
  jobDescription: { title: string | null; company: string | null };
  matchJson: any;
}

const getStatusBadge = (status: string) => {
  const colors: Record<string, string> = {
    UPLOADED: "var(--color-info)",
    QUEUED: "var(--color-warning)",
    EXTRACTING: "var(--color-warning)",
    READY_FOR_ANALYSIS: "var(--color-primary)",
    ANALYZING: "var(--color-info)",
    COMPLETED: "var(--color-success)",
    FAILED: "var(--color-error)",
    DELETED: "var(--color-text-muted)",
  };
  return React.createElement(Badge, { style: { background: colors[status] || "var(--color-primary)" } }, status);
};

const getClassificationBadge = (classification: string) => {
  const colors: Record<string, string> = {
    DEMONSTRATED: "var(--color-success)",
    SELF_REPORTED: "var(--color-info)",
    MENTIONED_NOT_DEMONSTRATED: "var(--color-warning)",
    NOT_FOUND: "var(--color-error)",
    NEEDS_ASSESSMENT: "var(--color-primary)",
  };
  return React.createElement(Badge, { style: { background: colors[classification] || "var(--color-primary)" } }, classification.replace("_", " "));
};

export function ResumeDetailClient({ resumeId, userId }: ResumeDetailProps) {
  const [resume, setResume] = useState<Resume | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "analysis" | "job-match" | "skill-gaps" | "rewrites">("overview");
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    const fetchResume = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/resume/${resumeId}`);
        if (!res.ok) {
          if (res.status === 404) throw new Error("Resume not found");
          throw new Error("Failed to load resume");
        }
        const data = await res.json();
        setResume(data.resume);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    };
    fetchResume();
  }, [resumeId]);

  const handleAnalyze = async (versionId: string) => {
    setAnalyzing(true);
    try {
      const res = await fetch(`/api/resume/${resumeId}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed" }));
        throw new Error(err.error || "Analysis failed");
      }
      const data = await res.json();
      setResume(prev => prev ? { ...prev, versions: prev.versions.map(v => v.id === versionId ? { ...v, analyses: data.analysis ? [data.analysis, ...v.analyses] : v.analyses } : v) } : null);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString();
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  if (loading) {
    return React.createElement("div", { style: { display: "flex", justifyContent: "center", padding: "48px" } },
      React.createElement(ProgressBar, { percent: 50 })
    );
  }

  if (error) {
    return React.createElement(Card, { style: { padding: 24, textAlign: "center", background: "var(--color-error-bg)", borderColor: "var(--color-error)" } },
      React.createElement("h2", null, "Unable to Load Resume"),
      React.createElement("p", { className: "err" }, error),
      React.createElement(Link, { href: "/resume", style: { marginTop: 16, display: "inlineBlock" } },
        React.createElement(Button, { variant: "outline" }, "Back to Resumes")
      )
    );
  }

  if (!resume) return null;

  const latestVersion = resume.versions[0];

  return React.createElement("div", null,
    React.createElement("div", { style: { display: "flex", justifyContent: "spaceBetween", alignItems: "flexStart", marginBottom: 24, flexWrap: "wrap", gap: 16 } },
      React.createElement("div", null,
        React.createElement(Link, { href: "/resume", style: { textDecoration: "none", color: "var(--color-primary)", marginBottom: 8, display: "inlineBlock" } }, "← Back to Resumes"),
        React.createElement("h1", null, resume.fileName),
        React.createElement("p", { className: "mut", style: { marginTop: 8 } }, `${formatFileSize(resume.fileSize)} · ${resume.mimeType} · ${new Date(resume.createdAt).toLocaleDateString()}`)
      ),
      React.createElement("div", { style: { display: "flex", gap: 8 } }, getStatusBadge(resume.status))
    ),

    React.createElement("div", { style: { display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" } },
      ["overview", "analysis", "job-match", "skill-gaps", "rewrites"].map((tab) => React.createElement(Button,
        { key: tab, variant: activeTab === tab ? "solid" : "outline", onClick: () => setActiveTab(tab as any), style: { textTransform: "capitalize" } },
        tab.replace("-", " ")
      ))
    ),

    activeTab === "overview" && React.createElement("div", null,
      React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24, marginBottom: 24 } },
        React.createElement(Card, { style: { padding: 24 } },
          React.createElement("h3", { style: { marginBottom: 16 } }, "File Info"),
          React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 12 } },
            React.createElement("div", null, React.createElement("span", { className: "mut" }, "File Name"), React.createElement("strong", null, resume.fileName)),
            React.createElement("div", null, React.createElement("span", { className: "mut" }, "Size"), React.createElement("strong", null, formatFileSize(resume.fileSize))),
            React.createElement("div", null, React.createElement("span", { className: "mut" }, "Type"), React.createElement("strong", null, resume.mimeType)),
            React.createElement("div", null, React.createElement("span", { className: "mut" }, "Status"), getStatusBadge(resume.status)),
            React.createElement("div", null, React.createElement("span", { className: "mut" }, "Uploaded"), React.createElement("strong", null, new Date(resume.createdAt).toLocaleString())),
            React.createElement("div", null, React.createElement("span", { className: "mut" }, "Versions"), React.createElement("strong", null, resume.versions.length))
          )
        ),
        React.createElement(Card, { style: { padding: 24 } },
          React.createElement("h3", { style: { marginBottom: 16 } }, "Versions"),
          resume.versions.length === 0 ? React.createElement(EmptyState, null, React.createElement("h3", null, "No versions yet")) : React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8 } },
            resume.versions.map((v) => React.createElement("div", { key: v.id, style: { display: "flex", justifyContent: "spaceBetween", padding: "12px", background: "var(--color-surface)", borderRadius: "8px" } },
              React.createElement("div", null,
                React.createElement("div", { style: { fontWeight: 600 } }, `Version ${v.versionNumber}`),
                React.createElement("div", { className: "mut", style: { fontSize: "0.85rem" } },
                  v.targetRole ? `Target: ${v.targetRole}` : "No target role",
                  v.isActive && React.createElement(Badge, { style: { marginLeft: 8, background: "var(--color-success)" } }, "Active")
                )
              ),
              React.createElement("div", { style: { display: "flex", gap: 8 } },
                React.createElement("span", { className: "mut", style: { fontSize: "0.85rem" } }, `${v.analyses.length} analysis${v.analyses.length !== 1 ? "es" : ""}`),
                React.createElement("span", { className: "mut", style: { fontSize: "0.85rem" } }, `${v._count?.jobMatches || 0} job match${(v._count?.jobMatches || 0) !== 1 ? "es" : ""}`)
              )
            ))
          )
        )
      ),

      React.createElement("div", { style: { display: "flex", gap: 12, justifyContent: "center" } },
        React.createElement(Button, { variant: "solid", onClick: () => latestVersion && handleAnalyze(latestVersion.id), disabled: analyzing || !latestVersion }, analyzing ? "Analyzing..." : "Analyze Latest Version"),
        React.createElement(Link, { href: `/resume/${resumeId}/job-match` }, React.createElement(Button, { variant: "outline" }, "Match to Job Description")),
        React.createElement(Link, { href: `/resume/${resumeId}/skill-gaps` }, React.createElement(Button, { variant: "outline" }, "View Skill Gaps"))
      )
    ),

    activeTab === "analysis" && latestVersion && React.createElement("div", null,
      latestVersion.analyses.length === 0 ? React.createElement(EmptyState, null,
        React.createElement("h3", null, "No analysis yet"),
        React.createElement("p", null, "Run an analysis to get resume quality scores and recommendations.")
      ) : React.createElement(React.Fragment, null,
        latestVersion.analyses.map((analysis) => React.createElement(Card, { key: analysis.id, style: { marginBottom: 24, padding: 24 } },
          React.createElement("div", { style: { display: "flex", justifyContent: "spaceBetween", alignItems: "flexStart", marginBottom: 16, flexWrap: "wrap", gap: 12 } },
            React.createElement("div", null,
              React.createElement("h3", { style: { marginBottom: 4 } }, "Resume Quality Analysis"),
              React.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" } },
                analysis.targetRole && React.createElement(Badge, null, analysis.targetRole),
                React.createElement(Badge, { style: { background: analysis.overallScore !== null && analysis.overallScore >= 70 ? "var(--color-success)" : "var(--color-warning)" } }, `Score: ${analysis.overallScore !== null ? `${analysis.overallScore}/100` : "N/A"}`),
                React.createElement(Badge, { style: { background: analysis.status === "COMPLETED" ? "var(--color-success)" : "var(--color-info)" } }, analysis.status)
              )
            ),
            React.createElement("div", { style: { fontSize: "0.85rem", color: "var(--color-text-muted)" } }, `Analyzed ${formatDate(analysis.createdAt)} · Rubric v${analysis.analysisJson?.rubricVersion || "1.0"}`)
          ),

          analysis.categories.length > 0 && React.createElement("div", { style: { marginBottom: 24 } },
            React.createElement("h4", { style: { marginBottom: 12 } }, "Category Scores"),
            React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 } },
              analysis.categories.map((cat) => React.createElement(Card, { key: cat.category, style: { padding: 16 } },
                React.createElement("div", { style: { fontWeight: 600, marginBottom: 8 } }, cat.category),
                React.createElement("div", { style: { fontSize: "1.5rem", fontWeight: 700, color: cat.score >= cat.maxScore * 0.7 ? "var(--color-success)" : "var(--color-error)" } }, `${cat.score} / ${cat.maxScore}`),
                React.createElement(ProgressBar, { percent: (cat.score / cat.maxScore) * 100, style: { marginTop: 8 } }),
                React.createElement("div", { className: "mut", style: { marginTop: 4 } }, `Weight: ${Math.round(cat.weight * 100)}%`)
              ))
            )
          ),

          analysis.recommendations.length > 0 && React.createElement("div", { style: { marginBottom: 24 } },
            React.createElement("h4", { style: { marginBottom: 12 } }, "Recommendations"),
            React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 12 } },
              analysis.recommendations.slice(0, 5).map((rec) => React.createElement(Card, { key: rec.id, style: { padding: 16 } },
                React.createElement("div", { style: { display: "flex", justifyContent: "spaceBetween", marginBottom: 8 } },
                  React.createElement("h4", null, rec.title),
                  React.createElement(Badge, { style: { background: rec.priority === 1 ? "var(--color-error)" : rec.priority === 2 ? "var(--color-warning)" : "var(--color-info)" } }, `Priority ${rec.priority}`)
                ),
                React.createElement("p", { className: "mut", style: { marginBottom: 8 } }, rec.description),
                React.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" } },
                  React.createElement(Badge, null, rec.category),
                  React.createElement(Badge, null, rec.expectedEffort)
                ),
                rec.suggestedTasks.length > 0 && React.createElement("ul", { style: { marginTop: 8, paddingLeft: 20, fontSize: "0.85rem" } },
                  rec.suggestedTasks.map((t, i) => React.createElement("li", { key: i }, t))
                )
              ))
            )
          )
        ))
      )),

    activeTab === "job-match" && latestVersion && React.createElement("div", null,
      React.createElement("div", { style: { display: "flex", justifyContent: "spaceBetween", alignItems: "center", marginBottom: 24 } },
        React.createElement("h3", null, "Job Description Matches"),
        React.createElement(Link, { href: `/resume/${resumeId}/job-match` }, React.createElement(Button, { variant: "solid" }, "New Job Match"))
      ),
      latestVersion.jobMatches.length === 0 ? React.createElement(EmptyState, null,
        React.createElement("h3", null, "No job matches yet"),
        React.createElement("p", null, "Paste a job description to see how well your resume matches.")
      ) : React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 12 } },
        latestVersion.jobMatches.map((match) => React.createElement(Card, { key: match.id, style: { padding: 16 } },
          React.createElement("div", { style: { display: "flex", justifyContent: "spaceBetween", alignItems: "flexStart", marginBottom: 12, flexWrap: "wrap", gap: 12 } },
            React.createElement("div", { style: { flex: 1 } },
              React.createElement(Link, { href: `/resume/${resumeId}/job-match/${match.id}`, style: { textDecoration: "none", color: "var(--color-primary)" } },
                React.createElement("h3", { style: { marginBottom: 4 } }, match.jobDescription.title || "Untitled Position")
              ),
              React.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginTop: 4 } },
                match.jobDescription.company && React.createElement(Badge, null, match.jobDescription.company),
                React.createElement(Badge, { style: { background: (match.overallMatch || 0) >= 70 ? "var(--color-success)" : (match.overallMatch || 0) >= 50 ? "var(--color-warning)" : "var(--color-error)" } }, `${match.overallMatch !== null ? `${match.overallMatch}% Match` : "N/A"}`),
                React.createElement("span", { className: "mut" }, formatDate(match.createdAt))
              )
            ),
            React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 16, paddingTop: 16, borderTop: "1px solid var(--color-border)" } },
              React.createElement("div", null, React.createElement("div", { className: "mut", style: { marginBottom: 4 } }, "Matching Skills"), React.createElement("div", { style: { fontWeight: 600 } }, match.matchJson.matchingSkills?.length || 0)),
              React.createElement("div", null, React.createElement("div", { className: "mut", style: { marginBottom: 4 } }, "Missing Skills"), React.createElement("div", { style: { fontWeight: 600, color: "var(--color-error)" } }, match.matchJson.missingSkills?.length || 0)),
              React.createElement("div", null, React.createElement("div", { className: "mut", style: { marginBottom: 4 } }, "Partial Matches"), React.createElement("div", { style: { fontWeight: 600, color: "var(--color-warning)" } }, match.matchJson.partialMatches?.length || 0))
            ),
            React.createElement("div", { style: { marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--color-border)" } },
              React.createElement(Link, { href: `/resume/${resumeId}/job-match/${match.id}` }, React.createElement(Button, { variant: "outline", size: "small" }, "View Details"))
            )
        ))
      )),

    ((activeTab as string) === "skill-gaps") && latestVersion && React.createElement("div", null,
      latestVersion.skillGaps.length === 0 ? React.createElement(EmptyState, null,
        React.createElement("h3", null, "No skill gaps analyzed"),
        React.createElement("p", null, "Run an analysis to detect skill gaps against your target roles.")
      ) : React.createElement("div", null,
        React.createElement("div", { style: { display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" } },
          ["DEMONSTRATED", "MENTIONED_NOT_DEMONSTRATED", "NOT_FOUND", "NEEDS_ASSESSMENT", "SELF_REPORTED"].map((cls) => React.createElement(Badge,
            { key: cls, style: { background: cls === "DEMONSTRATED" ? "var(--color-success)" : cls === "MENTIONED_NOT_DEMONSTRATED" ? "var(--color-warning)" : cls === "NOT_FOUND" ? "var(--color-error)" : cls === "NEEDS_ASSESSMENT" ? "var(--color-primary)" : "var(--color-info)" } },
            `${cls.replace("_", " ")} (${latestVersion.skillGaps.filter(g => g.classification === cls).length})`
          ))
        ),
        React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 12 } },
          latestVersion.skillGaps.map((gap) => React.createElement(Card, { key: gap.id, style: { padding: 16 } },
            React.createElement("div", { style: { display: "flex", justifyContent: "spaceBetween", alignItems: "flexStart", marginBottom: 12, flexWrap: "wrap", gap: 8 } },
              React.createElement("div", null,
                React.createElement("h3", { style: { marginBottom: 4 } }, gap.skill),
                React.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" } },
                  React.createElement(Badge, null, gap.category),
                  gap.targetRole && React.createElement(Badge, { style: { background: "var(--color-info)" } }, gap.targetRole),
                  React.createElement(Badge, { style: { background: gap.classification === "DEMONSTRATED" ? "var(--color-success)" : gap.classification === "MENTIONED_NOT_DEMONSTRATED" ? "var(--color-warning)" : gap.classification === "NOT_FOUND" ? "var(--color-error)" : gap.classification === "NEEDS_ASSESSMENT" ? "var(--color-primary)" : "var(--color-info)" } }, gap.classification.replace("_", " "))
                )
              ),
              React.createElement("div", { style: { fontWeight: 600, color: gap.confidence !== null ? (gap.confidence > 0.7 ? "var(--color-success)" : "var(--color-warning)") : "var(--color-text-muted)" } }, gap.confidence !== null ? `${Math.round(gap.confidence * 100)}% confidence` : "—")
            ),
            React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginTop: 12 } },
              gap.resumeEvidence.length > 0 && React.createElement("div", { style: { padding: 12, background: "var(--color-surface)", borderRadius: "8px" } }, React.createElement("strong", null, "Resume Evidence:"), React.createElement("ul", { style: { marginTop: 4, paddingLeft: 20, fontSize: "0.85rem" } }, gap.resumeEvidence.slice(0, 3).map((e, i) => React.createElement("li", { key: i }, e)))),
              gap.assessmentEvidence.length > 0 && React.createElement("div", { style: { padding: 12, background: "var(--color-surface)", borderRadius: "8px" } }, React.createElement("strong", null, "Assessment Evidence:"), React.createElement("ul", { style: { marginTop: 4, paddingLeft: 20, fontSize: "0.85rem" } }, gap.assessmentEvidence.slice(0, 3).map((e, i) => React.createElement("li", { key: i }, e)))),
              gap.practiceEvidence.length > 0 && React.createElement("div", { style: { padding: 12, background: "var(--color-surface)", borderRadius: "8px" } }, React.createElement("strong", null, "Practice Evidence:"), React.createElement("ul", { style: { marginTop: 4, paddingLeft: 20, fontSize: "0.85rem" } }, gap.practiceEvidence.slice(0, 3).map((e, i) => React.createElement("li", { key: i }, e))))
            ),
            gap.suggestedAction && React.createElement("div", { style: { marginTop: 12, padding: 12, background: "var(--color-info-bg)", borderRadius: "8px", border: "1px solid var(--color-info)" } }, React.createElement("strong", null, "Suggested Action: "), gap.suggestedAction),
            React.createElement("div", { style: { marginTop: 12, display: "flex", gap: 8, justifyContent: "flexEnd" } },
              React.createElement(Link, { href: `/resume/${resumeId}/analysis?skill=${gap.skill}` }, React.createElement(Button, { variant: "outline", size: "small" }, "View in Analysis"))
            )
          ))
        )
      )),

    ((activeTab as string) === "rewrites") && latestVersion && React.createElement("div", null,
      latestVersion.analyses.length === 0 ? React.createElement(EmptyState, null,
        React.createElement("h3", null, "No rewrites available"),
        React.createElement("p", null, "Run an analysis first to generate rewrite suggestions.")
      ) : React.createElement(React.Fragment, null,
        latestVersion.analyses.flatMap(a => a.rewrites).length === 0 ? React.createElement(EmptyState, null,
          React.createElement("h3", null, "No rewrite suggestions yet"),
          React.createElement("p", null, "Rewrite suggestions appear after analysis when improvements are identified.")
        ) : React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 12 } },
          latestVersion.analyses.flatMap(a => a.rewrites).map((rewrite) => React.createElement(Card, { key: rewrite.id, style: { padding: 16 } },
            React.createElement("div", { style: { display: "flex", justifyContent: "spaceBetween", marginBottom: 12 } },
              React.createElement("h4", null, rewrite.section),
              React.createElement(Badge, { style: { background: rewrite.isAccepted ? "var(--color-success)" : "var(--color-warning)" } }, rewrite.isAccepted ? "Accepted" : "Pending")
            ),
            React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 } },
              React.createElement("div", null, React.createElement("strong", null, "Original:"), React.createElement("pre", { style: { marginTop: 8, padding: 12, background: "var(--color-surface)", borderRadius: "8px", whiteSpace: "preWrap", fontFamily: "inherit", fontSize: "0.85rem" } }, rewrite.originalText)),
              React.createElement("div", null, React.createElement("strong", null, "Suggested:"), React.createElement("pre", { style: { marginTop: 8, padding: 12, background: "var(--color-success-bg)", borderRadius: "8px", whiteSpace: "preWrap", fontFamily: "inherit", fontSize: "0.85rem" } }, rewrite.suggestedText))
            ),
            rewrite.rationale && React.createElement("div", { style: { marginTop: 12, padding: 12, background: "var(--color-surface)", borderRadius: "8px" } }, React.createElement("strong", null, "Rationale: "), rewrite.rationale),
            rewrite.assumptions.length > 0 && React.createElement("div", { style: { marginTop: 12 } }, React.createElement("strong", null, "Assumptions:"), React.createElement("ul", { style: { marginTop: 4, paddingLeft: 20, fontSize: "0.85rem" } }, rewrite.assumptions.map((a, i) => React.createElement("li", { key: i }, a)))),
            React.createElement("div", { style: { display: "flex", gap: 8, marginTop: 16, justifyContent: "flexEnd" } },
              !rewrite.isAccepted && React.createElement(Button, { variant: "solid", size: "small", onClick: () => { /* accept */ } }, "Accept"),
              React.createElement(Button, { variant: "outline", size: "small", onClick: () => { /* reject */ } }, "Reject")
            )
          ))
        ))
      )
    )
  );
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString();
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}