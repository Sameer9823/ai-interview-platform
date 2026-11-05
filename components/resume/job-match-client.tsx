"use client";
import React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Button, Card, Badge, EmptyState, ProgressBar, Textarea, Input } from "@/components/ui";

interface JobMatchClientProps {
  resumeId: string;
  userId: string;
}

interface JobMatch {
  id: string;
  overallMatch: number | null;
  createdAt: string;
  jobDescription: { title: string | null; company: string | null };
  matchJson: {
    overallMatch: number;
    matchingSkills: Array<{ skill: string; resumeEvidence: string; jdRequirement: string; confidence: number }>;
    missingSkills: Array<{ skill: string; jdRequirement: string; importance: string; suggestion: string }>;
    partialMatches: Array<{ skill: string; resumeEvidence: string; jdRequirement: string; gap: string; confidence: number }>;
    experienceAlignment?: { score: number; relevantRoles: string[]; gaps: string[] };
    educationAlignment?: { score: number; meetsRequirements: boolean; gaps: string[] };
    recommendations: string[];
  };
}

export function JobMatchClient({ resumeId, userId }: JobMatchClientProps) {
  const [matches, setMatches] = useState<JobMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ jobDescription: "", title: "", company: "" });

  useEffect(() => {
    const fetchMatches = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/resume/${resumeId}/job-match`);
        if (!res.ok) throw new Error("Failed to load matches");
        const data = await res.json();
        setMatches(data.jobMatches || []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, [resumeId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const res = await fetch(`/api/resume/${resumeId}/job-match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to create" }));
        throw new Error(err.error || "Failed to create match");
      }
      const data = await res.json();
      setShowCreate(false);
      setForm({ jobDescription: "", title: "", company: "" });
      setMatches(prev => [data.jobMatch, ...prev]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create");
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString();

  if (loading) {
    return React.createElement("div", { style: { display: "flex", justifyContent: "center", padding: "48px" } },
      React.createElement(ProgressBar, { percent: 50 })
    );
  }

  const renderMatch = (match: JobMatch) => React.createElement(Card, { key: match.id, style: { display: "flex", flexDirection: "column" } },
    React.createElement("div", { style: { display: "flex", justifyContent: "spaceBetween", alignItems: "flexStart", marginBottom: 16, flexWrap: "wrap", gap: 12 } },
      React.createElement("div", { style: { flex: 1 } },
        React.createElement(Link, { href: `/resume/${resumeId}/job-match/${match.id}`, style: { textDecoration: "none", color: "var(--color-primary)" } },
          React.createElement("h3", { style: { marginBottom: 4 } }, match.jobDescription.title || "Untitled Position")
        ),
        React.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginTop: 4 } },
          match.jobDescription.company && React.createElement(Badge, null, match.jobDescription.company),
          React.createElement(Badge, { style: { background: (match.overallMatch || 0) >= 70 ? "var(--color-success)" : (match.overallMatch || 0) >= 50 ? "var(--color-warning)" : "var(--color-error)" } },
            match.overallMatch !== null ? `${match.overallMatch}% Match` : "N/A"
          ),
          React.createElement("span", { className: "mut" }, formatDate(match.createdAt))
        )
      ),
      React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 16, paddingTop: 16, borderTop: "1px solid var(--color-border)" } },
        React.createElement("div", null,
          React.createElement("div", { className: "mut", style: { marginBottom: 4 } }, "Matching Skills"),
          React.createElement("div", { style: { fontWeight: 600 } }, match.matchJson.matchingSkills?.length || 0)
        ),
        React.createElement("div", null,
          React.createElement("div", { className: "mut", style: { marginBottom: 4 } }, "Missing Skills"),
          React.createElement("div", { style: { fontWeight: 600, color: "var(--color-error)" } }, match.matchJson.missingSkills?.length || 0)
        ),
        React.createElement("div", null,
          React.createElement("div", { className: "mut", style: { marginBottom: 4 } }, "Partial Matches"),
          React.createElement("div", { style: { fontWeight: 600, color: "var(--color-warning)" } }, match.matchJson.partialMatches?.length || 0)
        )
      ),
      React.createElement("div", { style: { marginTop: 12, paddingTop: 16, borderTop: "1px solid var(--color-border)" } },
        React.createElement(Link, { href: `/resume/${resumeId}/job-match/${match.id}` },
          React.createElement(Button, { variant: "outline", size: "small" }, "View Details")
        )
      )
    )
    );

  const matchListContent = matches.length > 0
    ? React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 16 } },
        matches.map(renderMatch)
      )
    : null;

  const emptyState = React.createElement(EmptyState, null,
    React.createElement("h3", null, "No job matches yet"),
    React.createElement("p", null, 'Click "New Job Match" to paste a job description and see how your resume compares.')
  );

  const createForm = React.createElement("form", { onSubmit: handleCreate, style: { display: "flex", flexDirection: "column", gap: 16 } },
    React.createElement("div", null,
      React.createElement("label", { style: { display: "block", marginBottom: 8, fontWeight: 500 } }, "Job Description *"),
      React.createElement(Textarea, {
        value: form.jobDescription,
        onChange: (e) => setForm(f => ({ ...f, jobDescription: e.target.value })),
        placeholder: "Paste the full job description here...",
        rows: 8,
        required: true,
      })
    ),
    React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 } },
      React.createElement("div", null,
        React.createElement(Input, {
          label: "Job Title",
          value: form.title,
          onChange: (e) => setForm(f => ({ ...f, title: e.target.value })),
          placeholder: "e.g., Senior Software Engineer"
        })
      ),
      React.createElement("div", null,
        React.createElement(Input, {
          label: "Company",
          value: form.company,
          onChange: (e) => setForm(f => ({ ...f, company: e.target.value })),
          placeholder: "e.g., Google"
        })
      )
    ),
    React.createElement("div", { style: { display: "flex", gap: 8, justifyContent: "flexEnd" } },
      React.createElement(Button, { type: "button", variant: "outline", onClick: () => { setShowCreate(false); setForm({ jobDescription: "", title: "", company: "" }); } }, "Cancel"),
      React.createElement(Button, { type: "submit", variant: "solid", disabled: creating || !form.jobDescription }, creating ? "Matching..." : "Create Match")
    )
  );

  if (loading) {
    return React.createElement("div", { style: { display: "flex", justifyContent: "center", padding: "48px" } },
      React.createElement(ProgressBar, { percent: 50 })
    );
  }

  return React.createElement("div", null,
    React.createElement("div", { style: { display: "flex", justifyContent: "spaceBetween", alignItems: "center", marginBottom: 24 } },
      React.createElement("div", null,
        React.createElement(Link, { href: `/resume/${resumeId}`, style: { textDecoration: "none", color: "var(--color-primary)", marginBottom: 8, display: "inlineBlock" } },
          "← Back to Resume"
        ),
        React.createElement("h1", null, "Job Description Matches"),
        React.createElement("p", { className: "mut", style: { marginTop: 8 } }, "Compare your resume against job descriptions to identify gaps.")
      ),
      React.createElement(Button, { variant: "solid", onClick: () => setShowCreate(true) }, "New Job Match")
    ),
    showCreate && React.createElement(Card, { style: { marginBottom: 24, padding: 24 } },
      React.createElement("h3", { style: { marginBottom: 16 } }, "Create Job Match"),
      error && React.createElement("div", { className: "err", style: { marginBottom: 16 } }, error),
      React.createElement("form", { onSubmit: handleCreate, style: { display: "flex", flexDirection: "column", gap: 16 } },
        React.createElement("div", null,
          React.createElement("label", { style: { display: "block", marginBottom: 8, fontWeight: 500 } }, "Job Description *"),
          React.createElement(Textarea, {
            value: form.jobDescription,
            onChange: (e) => setForm(f => ({ ...f, jobDescription: e.target.value })),
            placeholder: "Paste the full job description here...",
            rows: 8,
            required: true,
          })
        ),
        React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 } },
          React.createElement("div", null,
            React.createElement(Input, {
              label: "Job Title",
              value: form.title,
              onChange: (e) => setForm(f => ({ ...f, title: e.target.value })),
              placeholder: "e.g., Senior Software Engineer"
            })
          ),
          React.createElement("div", null,
            React.createElement(Input, {
              label: "Company",
              value: form.company,
              onChange: (e) => setForm(f => ({ ...f, company: e.target.value })),
              placeholder: "e.g., Google"
            })
          )
        ),
        React.createElement("div", { style: { display: "flex", gap: 8, justifyContent: "flexEnd" } },
          React.createElement(Button, { type: "button", variant: "outline", onClick: () => { setShowCreate(false); setForm({ jobDescription: "", title: "", company: "" }); } }, "Cancel"),
          React.createElement(Button, { type: "submit", variant: "solid", disabled: creating || !form.jobDescription }, creating ? "Matching..." : "Create Match")
        )
      )
    ),
    error && !showCreate && React.createElement(Card, { style: { marginBottom: 16, padding: 16, background: "var(--color-error-bg)", borderColor: "var(--color-error)" } },
      React.createElement("div", { className: "err" }, error)
    ),
    showCreate ? null : (matches.length === 0 ? React.createElement(EmptyState, null,
      React.createElement("h3", null, "No job matches yet"),
      React.createElement("p", null, 'Click "New Job Match" to paste a job description and see how your resume compares.')
    ) : React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 16 } },
      matches.map(renderMatch)
    ))
  );
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString();
}