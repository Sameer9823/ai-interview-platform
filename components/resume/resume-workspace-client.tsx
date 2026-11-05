"use client";
import React from "react";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button, Card, Badge, EmptyState, ProgressBar, Input, Textarea, Select } from "@/components/ui";

interface Resume {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  versions: ResumeVersion[];
  _count?: { versions: number; processingJobs: number };
}

interface ResumeVersion {
  id: string;
  versionNumber: number;
  isActive: boolean;
  targetRole: string | null;
  extractedProfile: { profileJson: any } | null;
  analyses: ResumeAnalysis[];
  _count?: { analyses: number; jobMatches: number };
}

interface ResumeAnalysis {
  id: string;
  targetRole: string | null;
  status: string;
  overallScore: number | null;
  createdAt: string;
  categories: Array<{ category: string; score: number; maxScore: number }>;
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

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

export function ResumeWorkspaceClient() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0, totalPages: 0 });
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "detail">("list");

  const fetchResumes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/resume?page=${pagination.page}&pageSize=${pagination.pageSize}`);
      if (!res.ok) throw new Error("Failed to load resumes");
      const data = await res.json();
      setResumes(data.resumes);
      setPagination(p => ({ ...p, total: data.pagination.total, totalPages: data.pagination.totalPages }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize]);

  useEffect(() => { fetchResumes(); }, [fetchResumes]);

  const handleFileUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const file = formData.get("file") as File;
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const createRes = await fetch("/api/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, mimeType: file.type, fileSize: file.size }),
      });
      if (!createRes.ok) throw new Error("Failed to create resume record");
      const { resume, uploadUrl } = await createRes.json();

      const uploadFormData = new FormData();
      uploadFormData.append("file", file);
      const uploadRes = await fetch(uploadUrl, { method: "POST", body: uploadFormData });
      if (!uploadRes.ok) throw new Error("File upload failed");

      setShowUpload(false);
      (e.target as HTMLFormElement).reset();
      fetchResumes();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleViewResume = (resume: Resume) => {
    setSelectedResume(resume);
    setViewMode("detail");
  };

  const handleBackToList = () => {
    setSelectedResume(null);
    setViewMode("list");
  };

  const handleAnalyze = async (versionId: string) => {
    try {
      const res = await fetch(`/api/resume/${selectedResume?.id}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Analysis failed");
      fetchResumes();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Analysis failed");
    }
  };

  if (loading && resumes.length === 0) {
    return React.createElement("div", { style: { display: "flex", justifyContent: "center", padding: "48px" } },
      React.createElement(ProgressBar, { percent: 50 })
    );
  }

  if (viewMode === "list") {
    return React.createElement("div", { style: { maxWidth: "72rem", margin: "0 auto", padding: "24px 16px" } },
      React.createElement("div", { style: { display: "flex", justifyContent: "spaceBetween", alignItems: "center", marginBottom: 24 } },
        React.createElement("div", null,
          React.createElement("h1", null, "Resume Workspace"),
          React.createElement("p", { className: "mut", style: { marginTop: 8 } }, "Upload, analyze, and optimize your resumes for target roles.")
        ),
        React.createElement(Button, { variant: "solid", onClick: () => setShowUpload(true) }, "Upload Resume")
      ),
      showUpload && React.createElement(Card, { style: { marginBottom: 24, padding: 24 } },
        React.createElement("h3", { style: { marginBottom: 16 } }, "Upload Resume"),
        React.createElement("form", { onSubmit: handleFileUpload, style: { display: "flex", flexDirection: "column", gap: 12 } },
          React.createElement("div", null,
            React.createElement("label", { className: "mut", style: { display: "block", marginBottom: 4 } }, "PDF or DOCX (max 10MB)"),
            React.createElement("input", { type: "file", name: "file", accept: ".pdf,.docx", required: true, disabled: uploading })
          ),
          uploading && React.createElement(ProgressBar, { percent: uploadProgress }),
          React.createElement("div", { style: { display: "flex", gap: 8, justifyContent: "flexEnd" } },
            React.createElement(Button, { type: "button", variant: "outline", onClick: () => { setShowUpload(false); } }, "Cancel"),
            React.createElement(Button, { type: "submit", variant: "solid", disabled: uploading }, uploading ? "Uploading..." : "Upload")
          )
        )
      ),
      error && React.createElement(Card, { style: { marginBottom: 16, padding: 16, background: "var(--color-error-bg)", borderColor: "var(--color-error)" } },
        React.createElement("div", { className: "err" }, error)
      ),
      resumes.length === 0 ? React.createElement(EmptyState, null,
        React.createElement("h3", null, "No resumes yet"),
        React.createElement("p", null, "Upload your first resume to get started with analysis and job matching.")
      ) : React.createElement(React.Fragment, null,
        React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 12 } },
          resumes.map((r) => React.createElement(Card, { key: r.id, style: { display: "flex", flexDirection: "column" }, onClick: () => handleViewResume(r) },
            React.createElement("div", { style: { display: "flex", justifyContent: "spaceBetween", alignItems: "flexStart", marginBottom: 12 } },
              React.createElement("div", { style: { flex: 1 } },
                React.createElement("h3", { style: { fontSize: "1.1rem", fontWeight: 600 } }, r.fileName),
                React.createElement("div", { style: { display: "flex", gap: 8, marginTop: 4, fontSize: "0.85rem", color: "var(--color-text-muted)" } },
                  React.createElement("span", null, formatFileSize(r.fileSize)),
                  React.createElement("span", null, "·"),
                  React.createElement("span", null, new Date(r.createdAt).toLocaleDateString())
                )
              ),
              React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 4, alignItems: "flexEnd" } },
                getStatusBadge(r.status),
                React.createElement("span", { className: "mut", style: { fontSize: "0.75rem" } }, `${r.versions.length} version${r.versions.length !== 1 ? "s" : ""}`)
              )
            ),
            React.createElement("div", { style: { display: "flex", gap: 8, marginTop: "auto", paddingTop: 12, borderTop: "1px solid var(--color-border)" } },
              React.createElement("span", { className: "mut", style: { fontSize: "0.85rem" } }, `${r._count?.versions ?? 0} version${(r._count?.versions ?? 0) !== 1 ? "s" : ""} · ${(r._count?.processingJobs ?? 0)} processing job${(r._count?.processingJobs ?? 0) !== 1 ? "s" : ""}`),
              React.createElement("span", { style: { flex: 1 } }),
              React.createElement(Button, { variant: "outline", size: "small", onClick: (e) => { e.stopPropagation(); handleViewResume(r); } }, "View")
            )
          ))
        ),
        pagination.totalPages > 1 && React.createElement("div", { style: { display: "flex", justifyContent: "center", gap: 8, marginTop: 24 } },
          React.createElement(Button, { variant: "outline", disabled: pagination.page === 1, onClick: () => setPagination(p => ({ ...p, page: p.page - 1 })) }, "Previous"),
          React.createElement("span", { style: { display: "flex", alignItems: "center", padding: "0 16px" } }, `Page ${pagination.page} of ${pagination.totalPages}`),
          React.createElement(Button, { variant: "outline", disabled: pagination.page === pagination.totalPages, onClick: () => setPagination(p => ({ ...p, page: p.page + 1 })) }, "Next")
        )
      )
    );
  }

  if (!selectedResume) return null;

  return React.createElement("div", { style: { maxWidth: "72rem", margin: "0 auto", padding: "24px 16px" } },
    React.createElement("div", { style: { display: "flex", justifyContent: "spaceBetween", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 } },
      React.createElement(Button, { variant: "outline", onClick: handleBackToList }, "← Back"),
      React.createElement("div", null,
        React.createElement("h1", null, selectedResume.fileName),
        React.createElement("p", { className: "mut", style: { marginTop: 4 } }, `${formatFileSize(selectedResume.fileSize)} · ${new Date(selectedResume.createdAt).toLocaleDateString()}`)
      )
    ),
    React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 } },
      React.createElement(Card, { style: { padding: 24 } },
        React.createElement("h3", { style: { marginBottom: 16 } }, "Versions"),
        selectedResume.versions.length === 0 ? React.createElement(EmptyState, null, React.createElement("h3", null, "No versions yet")) : React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8 } },
          selectedResume.versions.map((v) => React.createElement("div", { key: v.id, style: { display: "flex", justifyContent: "spaceBetween", padding: "12px", background: "var(--color-surface)", borderRadius: "8px" } },
            React.createElement("div", null,
              React.createElement("div", { style: { fontWeight: 600 } }, `Version ${v.versionNumber}`),
              React.createElement("div", { className: "mut", style: { fontSize: "0.85rem" } },
                v.targetRole ? `Target: ${v.targetRole}` : "No target role",
                v.isActive && React.createElement(Badge, { style: { marginLeft: 8, background: "var(--color-success)" } }, "Active")
              )
            ),
            React.createElement("div", { style: { display: "flex", gap: 8 } },
              React.createElement("span", { className: "mut", style: { fontSize: "0.85rem" } }, `${v.analyses.length} analysis${v.analyses.length !== 1 ? "es" : ""}`),
              React.createElement("span", { className: "mut", style: { fontSize: "0.85rem" } }, `${v._count?.jobMatches ?? 0} job match${(v._count?.jobMatches ?? 0) !== 1 ? "es" : ""}`)
            )
          ))
        )
      ),
      React.createElement(Card, { style: { padding: 24 } },
        React.createElement("h3", { style: { marginBottom: 16 } }, "Actions"),
        React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 12 } },
           React.createElement(Button, { variant: "solid", disabled: !selectedResume.versions.length, onClick: () => { if (selectedResume.versions.length > 0) { handleAnalyze(selectedResume.versions[0]!.id); } } }, "Analyze Latest Version"),
          React.createElement(Link, { href: `/resume/${selectedResume.id}/job-match` }, React.createElement(Button, { variant: "outline", disabled: selectedResume.versions.length === 0 }, "Match to Job Description")),
          React.createElement(Link, { href: `/resume/${selectedResume.id}/skill-gaps` }, React.createElement(Button, { variant: "outline", disabled: selectedResume.versions.length === 0 }, "View Skill Gaps")),
          React.createElement(Button, { variant: "outline", style: { background: "var(--color-error-bg)", borderColor: "var(--color-error)", color: "var(--color-error)" }, onClick: () => { if (confirm("Delete this resume and all its data?")) { /* delete */ } } }, "Delete Resume")
        )
      )
    )
  );
}