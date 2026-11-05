"use client";
import React, { useState, useEffect } from "react";
import { Button, Card, Badge, EmptyState, ProgressBar, Input, Textarea, Select } from "@/components/ui";

const MODES = [
  { value: "HR_BEHAVIORAL", label: "HR & Behavioral", description: "Behavioral and situational questions" },
  { value: "TECHNICAL", label: "Technical", description: "Technical concepts and knowledge" },
  { value: "CODING", label: "Coding", description: "Algorithm and coding challenges" },
  { value: "SYSTEM_DESIGN", label: "System Design", description: "Architecture and scalability" },
  { value: "COMPANY_SPECIFIC", label: "Company-Specific", description: "Tailored to a target company" },
  { value: "RESUME_BASED", label: "Resume-Based", description: "Questions from your resume" },
  { value: "JOB_DESCRIPTION_BASED", label: "JD-Based", description: "From a job description" },
  { value: "MIXED", label: "Mixed", description: "Balanced mix of types" },
  { value: "CUSTOM", label: "Custom", description: "Fully customizable" },
];

const DIFFICULTIES = ["EASY", "MEDIUM", "HARD", "ADAPTIVE"] as const;
const FEEDBACK_MODES = ["AFTER_EACH", "AT_END"] as const;
const STYLES = ["SUPPORTIVE", "STANDARD", "CHALLENGING"] as const;
const CAREER_LEVELS = ["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const;

interface MockInterviewConfigClientProps {
  companies: { id: string; name: string }[];
  resumes: { id: string; versionNumber: number; targetRole: string | null; fileName: string }[];
  careerStage?: string | null;
}

export function MockInterviewConfigClient({ companies, resumes, careerStage }: MockInterviewConfigClientProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    mode: "MIXED",
    targetRole: "",
    careerLevel: "",
    companyId: "",
    resumeVersionId: "",
    jobDescription: "",
    durationMinutes: 30,
    questionCount: 10,
    topics: [] as string[],
    skills: [] as string[],
    codingLanguage: "",
    feedbackMode: "AT_END" as "AFTER_EACH" | "AT_END",
    interviewStyle: "STANDARD" as "SUPPORTIVE" | "STANDARD" | "CHALLENGING",
    difficulty: "MEDIUM" as "EASY" | "MEDIUM" | "HARD" | "ADAPTIVE",
    voiceMode: "TEXT_ONLY" as "TEXT_ONLY" | "VOICE_ONLY" | "HYBRID",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checkbox = e.target as HTMLInputElement;
       setForm(f => ({
         ...f,
         [name]: checkbox.checked ? [...(f[name as keyof typeof f] as string[]), value] : (f[name as keyof typeof f] as string[]).filter(v => v !== value)
       }));
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  };

  const handleNumberChange = (name: string, value: string) => {
    setForm(f => ({ ...f, [name]: parseInt(value) || 0 }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/mock-interviews/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to create" }));
        throw new Error(err.error || "Failed to create interview");
      }
      const { mockInterview } = await res.json();
      window.location.href = `/mock-interviews/${mockInterview.id}`;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create interview");
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(s => Math.min(s + 1, 3));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  if (step === 1) {
    return (
      <div style={{ maxWidth: "640px", margin: "0 auto" }}>
        <div style={{ marginBottom: 24 }}>
          <ProgressBar percent={33} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
            <span>1. Mode & Role</span>
            <span>2. Settings</span>
            <span>3. Review</span>
          </div>
        </div>
        <Card style={{ padding: 24 }}>
          <h2 style={{ marginBottom: 8 }}>Choose Interview Mode</h2>
          <p className="mut" style={{ marginBottom: 24 }}>Select the type of interview you want to practice. Each mode focuses on different skills.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
            {MODES.map(mode => (
              <label key={mode.value} style={{ display: "flex", flexDirection: "column", padding: "16px", border: `2px solid ${form.mode === mode.value ? "var(--brand)" : "var(--color-border)"}`, borderRadius: "8px", cursor: "pointer", background: form.mode === mode.value ? "var(--color-brand-bg)" : "transparent", transition: "all 0.15s" }}>
                <input type="radio" name="mode" value={mode.value} checked={form.mode === mode.value} onChange={e => setForm(f => ({ ...f, mode: e.target.value }))} style={{ display: "none" }} />
                <strong style={{ marginBottom: 4 }}>{mode.label}</strong>
                <span className="mut" style={{ fontSize: "0.85rem" }}>{mode.description}</span>
              </label>
            ))}
          </div>
          <div style={{ marginTop: 24 }}>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Target Role *</label>
            <Input value={form.targetRole} onChange={handleChange} name="targetRole" placeholder="e.g., Senior Software Engineer" required />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
            <div>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Career Level</label>
              <Select options={[{ value: "", label: "Select level" }, { value: "BEGINNER", label: "Beginner (0-2 yrs)" }, { value: "INTERMEDIATE", label: "Intermediate (2-5 yrs)" }, { value: "ADVANCED", label: "Advanced (5+ yrs)" }]} value={form.careerLevel} onChange={e => setForm(f => ({ ...f, careerLevel: e.target.value }))} />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Target Company (optional)</label>
              <Select options={[{ value: "", label: "Any/General" }, ...companies.map(c => ({ value: c.id, label: c.name }))]} value={form.companyId} onChange={e => setForm(f => ({ ...f, companyId: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 24 }}>
            <Button variant="solid" onClick={() => setStep(2)} disabled={!form.targetRole}>Continue</Button>
          </div>
        </Card>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div style={{ maxWidth: "640px", margin: "0 auto" }}>
        <div style={{ marginBottom: 24 }}>
          <ProgressBar percent={66} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
            <span>1. Mode & Role</span>
            <span>2. Settings</span>
            <span>3. Review</span>
          </div>
        </div>
        <Card style={{ padding: 24 }}>
          <h2 style={{ marginBottom: 8 }}>Interview Settings</h2>
          <p className="mut" style={{ marginBottom: 24 }}>Configure the details of your interview session.</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Duration (minutes) *</label>
              <Input type="number" value={form.durationMinutes} onChange={e => handleNumberChange("durationMinutes", e.target.value)} min={15} max={90} />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Question Count *</label>
              <Input type="number" value={form.questionCount} onChange={e => handleNumberChange("questionCount", e.target.value)} min={3} max={20} />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Difficulty *</label>
              <Select options={[{ value: "EASY", label: "Easy" }, { value: "MEDIUM", label: "Medium" }, { value: "HARD", label: "Hard" }, { value: "ADAPTIVE", label: "Adaptive" }]} value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value as "EASY" | "MEDIUM" | "HARD" | "ADAPTIVE" }))} />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Interview Style *</label>
              <Select options={[{ value: "SUPPORTIVE", label: "Supportive" }, { value: "STANDARD", label: "Standard" }, { value: "CHALLENGING", label: "Challenging" }]} value={form.interviewStyle} onChange={e => setForm(f => ({ ...f, interviewStyle: e.target.value as "SUPPORTIVE" | "STANDARD" | "CHALLENGING" }))} />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Feedback Timing *</label>
              <Select options={[{ value: "AFTER_EACH", label: "After Each Answer" }, { value: "AT_END", label: "At the End" }]} value={form.feedbackMode} onChange={e => setForm(f => ({ ...f, feedbackMode: e.target.value as "AFTER_EACH" | "AT_END" }))} />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Voice Mode *</label>
              <Select options={[{ value: "TEXT_ONLY", label: "Text Only" }, { value: "VOICE_ONLY", label: "Voice Only" }, { value: "HYBRID", label: "Hybrid (Text + Voice)" }]} value={form.voiceMode} onChange={e => setForm(f => ({ ...f, voiceMode: e.target.value as "TEXT_ONLY" | "VOICE_ONLY" | "HYBRID" }))} />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Coding Language (for coding interviews)</label>
              <Select options={[{ value: "", label: "Auto-detect" }, { value: "javascript", label: "JavaScript" }, { value: "typescript", label: "TypeScript" }, { value: "python", label: "Python" }, { value: "java", label: "Java" }, { value: "cpp", label: "C++" }, { value: "go", label: "Go" }, { value: "rust", label: "Rust" }]} value={form.codingLanguage} onChange={e => setForm(f => ({ ...f, codingLanguage: e.target.value }))} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Resume Version (optional)</label>
              <Select options={[{ value: "", label: "None" }, ...resumes.map(r => ({ value: r.id, label: `v${r.versionNumber} - ${r.targetRole || r.fileName}` }))]} value={form.resumeVersionId} onChange={e => setForm(f => ({ ...f, resumeVersionId: e.target.value }))} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Focus Topics</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {["Data Structures", "Algorithms", "System Design", "Databases", "API Design", "Testing", "Security", "Performance", "Frontend", "Backend", "DevOps", "ML/AI"].map(t => (
                  <label key={t} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", border: "1px solid var(--color-border)", borderRadius: "6px", cursor: "pointer", background: form.topics.includes(t) ? "var(--color-brand-bg)" : "transparent" }}>
                    <input type="checkbox" checked={form.topics.includes(t)} onChange={e => setForm(f => ({ ...f, topics: e.target.checked ? [...f.topics, t] : f.topics.filter(v => v !== t) }))} />
                    {t}
                  </label>
                ))}
              </div>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Focus Skills</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {["JavaScript", "TypeScript", "React", "Node.js", "Python", "SQL", "AWS", "Docker", "Kubernetes", "GraphQL", "REST API", "Microservices"].map(s => (
                  <label key={s} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", border: "1px solid var(--color-border)", borderRadius: "4px", cursor: "pointer", background: form.skills.includes(s) ? "var(--color-brand-bg)" : "transparent", fontSize: "0.85rem" }}>
                    <input type="checkbox" checked={form.skills.includes(s)} onChange={e => setForm(f => ({ ...f, skills: e.target.checked ? [...f.skills, s] : f.skills.filter(v => v !== s) }))} />
                    {s}
                  </label>
                ))}
              </div>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Job Description (for JD-based interviews)</label>
              <Textarea value={form.jobDescription} onChange={e => setForm(f => ({ ...f, jobDescription: e.target.value }))} name="jobDescription" placeholder="Paste the job description here..." rows={4} />
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button variant="solid" onClick={() => setStep(3)}>Continue</Button>
            </div>
          </div>
        </Card>
        </div>
      );
    }

  return (
    <div style={{ maxWidth: "640px", margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <ProgressBar percent={100} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
          <span>1. Mode & Role</span>
          <span>2. Settings</span>
          <span>3. Review</span>
        </div>
      </div>
      <Card style={{ padding: 24 }}>
        <h2 style={{ marginBottom: 8 }}>Review Configuration</h2>
        <p className="mut" style={{ marginBottom: 24 }}>Please review your interview settings before starting.</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
          <div>
            <div className="mut" style={{ marginBottom: 4 }}>Mode</div>
            <strong>{MODES.find(m => m.value === form.mode)?.label}</strong>
          </div>
          <div>
            <div className="mut" style={{ marginBottom: 4 }}>Target Role</div>
            <strong>{form.targetRole || "Not specified"}</strong>
          </div>
          <div>
            <div className="mut" style={{ marginBottom: 4 }}>Duration</div>
            <strong>{form.durationMinutes} minutes</strong>
          </div>
          <div>
            <div className="mut" style={{ marginBottom: 4 }}>Questions</div>
            <strong>{form.questionCount}</strong>
          </div>
          <div>
            <div className="mut" style={{ marginBottom: 4 }}>Difficulty</div>
            <strong>{form.difficulty}</strong>
          </div>
          <div>
            <div className="mut" style={{ marginBottom: 4 }}>Style</div>
            <strong>{form.interviewStyle}</strong>
          </div>
          <div>
            <div className="mut" style={{ marginBottom: 4 }}>Feedback</div>
            <strong>{form.feedbackMode === "AFTER_EACH" ? "After Each" : "At End"}</strong>
          </div>
          <div>
            <div className="mut" style={{ marginBottom: 4 }}>Voice Mode</div>
            <strong>{form.voiceMode === "TEXT_ONLY" ? "Text Only" : form.voiceMode === "VOICE_ONLY" ? "Voice Only" : "Hybrid"}</strong>
          </div>
          <div>
            <div className="mut" style={{ marginBottom: 4 }}>Coding Language</div>
            <strong>{form.codingLanguage || "Auto-detect"}</strong>
          </div>
          <div>
            <div className="mut" style={{ marginBottom: 4 }}>Topics</div>
            <strong>{form.topics.length > 0 ? form.topics.join(", ") : "Auto-selected"}</strong>
          </div>
          <div>
            <div className="mut" style={{ marginBottom: 4 }}>Skills</div>
            <strong>{form.skills.length > 0 ? form.skills.join(", ") : "Auto-selected"}</strong>
          </div>
          <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
          <Button variant="solid" onClick={handleSubmit} disabled={loading}>{loading ? "Creating..." : "Start Interview"}</Button>
        </div>
        {error && <div className="err" style={{ marginTop: 16 }}>{error}</div>}
      </Card>
    </div>
  );
}