"use client";
import { useState, useCallback } from "react";
import { Button, Card, Badge } from "@/components/ui";
import Link from "next/link";


interface Opportunity {
  id: string;
  title: string;
  slug: string;
  company: {
    id: string;
    name: string;
    logoUrl: string;
    industry: string;
    description: string;
    headquarters: string;
    careersUrl: string;
    website: string;
  };
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
  educationRequirement: string | null;
  description: string;
  responsibilities: string | null;
  requiredSkills: string[];
  preferredSkills: string[];
  benefits: string | null;
  applicationUrl: string;
  applicationDeadline: string | null;
  postedDate: string;
  lastVerifiedDate: string | null;
  status: string;
  sourceId: string | null;
  source: { id: string; name: string; url: string; type: string } | null;
  sourceReference: string | null;
  isRemote: boolean;
  isEntryLevel: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  isSaved?: boolean;
  userMatch?: {
    overallScore: number;
    requiredSkillsScore: number;
    preferredSkillsScore: number;
    experienceScore: number;
    roleRelevanceScore: number;
    locationScore: number;
    educationScore: number;
    matchingSkills: string[];
    missingSkills: string[];
    unverifiedSkills: string[];
    experienceMatch: string;
    locationMatch: string;
category: string;
    explanation: string;
  } | null;
  _count?: {
    savedBy: number;
    applications: number;
  };
}

interface OpportunityDetailClientProps {
  opportunity: Opportunity;
  userId: string;
}

export function OpportunityDetailClient({ opportunity, userId }: OpportunityDetailClientProps) {
  const [isSaved, setIsSaved] = useState(opportunity.isSaved ?? false);
  const [activeTab, setActiveTab] = useState<"overview" | "skills" | "company" | "apply">("overview");

  const salaryDisplay = opportunity.salaryMin && opportunity.salaryMax
    ? `$${(opportunity.salaryMin / 1000).toFixed(0)}k - $${(opportunity.salaryMax / 1000).toFixed(0)}k ${opportunity.salaryPeriod.toLowerCase()}`
    : opportunity.salaryMin
      ? `$${(opportunity.salaryMin / 1000).toFixed(0)}k+ ${opportunity.salaryPeriod.toLowerCase()}`
      : opportunity.salaryMax
        ? `Up to $${(opportunity.salaryMax / 1000).toFixed(0)}k ${opportunity.salaryPeriod.toLowerCase()}`
        : "Not disclosed";

  const handleSave = async () => {
    try {
      if (isSaved) {
        await fetch("/api/opportunities/" + opportunity.id, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "unsave" }),
        });
      } else {
        await fetch("/api/opportunities/" + opportunity.id, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "save" }),
        });
      }
      setIsSaved(!isSaved);
    } catch (e) {
      console.error(e);
    }
  };

  const handleApply = () => {
    window.open(opportunity.applicationUrl, "_blank", "noopener,noreferrer");
  };

  const matchColor = opportunity.userMatch?.overallScore !== undefined
    ? opportunity.userMatch!.overallScore >= 80 ? "var(--color-success)" :
      opportunity.userMatch!.overallScore >= 60 ? "var(--color-warning)" : "var(--color-text-muted)"
    : "transparent";

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "24px" }}>
      <Link href="/opportunities" style={{ display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "24px", color: "var(--color-primary)", textDecoration: "none" }}>
        ← Back to Opportunities
      </Link>

      <div style={{ display: "flex", gap: "24px", marginBottom: "24px" }}>
        <div style={{ flex: 1 }}>
          {opportunity.company.logoUrl && (
            <img src={opportunity.company.logoUrl} alt={opportunity.company.name} style={{ width: "80px", height: "80px", borderRadius: "8px", objectFit: "cover", marginBottom: "16px" }} />
          )}
          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", marginBottom: "12px" }}>
            <h1 style={{ margin: 0, fontSize: "2rem", fontWeight: 700 }}>{opportunity.title}</h1>
            <Badge style={{ background: "var(--color-primary-bg)", color: "var(--color-primary)" }}>{opportunity.type}</Badge>
            <Badge>{opportunity.workArrangement}</Badge>
            {opportunity.isRemote && <Badge style={{ background: "var(--color-success-bg)", color: "var(--color-success)" }}>Remote</Badge>}
            {opportunity.isEntryLevel && <Badge style={{ background: "var(--color-info-bg)", color: "var(--color-info)" }}>Entry Level</Badge>}
          </div>
          <p style={{ margin: 0, color: "var(--color-text-muted)", fontSize: "1.1rem" }}>{opportunity.company.name}</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", flexShrink: 0, minWidth: "200px" }}>
          {opportunity.userMatch && (
            <Card style={{ padding: "16px", textAlign: "center", borderColor: matchColor }}>
              <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", marginBottom: "4px" }}>Match Score</div>
              <div style={{ fontSize: "2.5rem", fontWeight: 700, color: matchColor }}>{opportunity.userMatch!.overallScore}%</div>
              <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginTop: "4px" }}>{opportunity.userMatch!.explanation}</div>
            </Card>
          )}
          <div style={{ display: "flex", gap: "8px" }}>
            <Button variant={isSaved ? "solid" : "outline"} onClick={handleSave} style={{ flex: 1 }}>
              {isSaved ? "★ Saved" : "☆ Save"}
            </Button>
            <Button variant="solid" onClick={handleApply} style={{ flex: 1 }}>
              Apply Now
            </Button>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "8px", marginBottom: "24px", borderBottom: "1px solid var(--color-border)", paddingBottom: "8px" }}>
        {["overview", "skills", "company", "apply"].map((tab) => (
          <Button
            key={tab}
            variant={activeTab === tab ? "solid" : "outline"}
            size="small"
            onClick={() => setActiveTab(tab as typeof activeTab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "24px" }}>
          <div>
            <Card style={{ padding: "24px", marginBottom: "24px" }}>
              <h2 style={{ margin: "0 0 16px", fontSize: "1.25rem" }}>About this Role</h2>
              <div style={{ lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{opportunity.description}</div>
            </Card>

            {opportunity.responsibilities && (
              <Card style={{ padding: "24px", marginBottom: "24px" }}>
                <h2 style={{ margin: "0 0 16px", fontSize: "1.25rem" }}>Responsibilities</h2>
                <div style={{ lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{opportunity.responsibilities}</div>
              </Card>
            )}

            <Card style={{ padding: "24px", marginBottom: "24px" }}>
              <h2 style={{ margin: "0 0 16px", fontSize: "1.25rem" }}>Requirements</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                <div>
                  <h3 style={{ margin: "0 0 8px", fontSize: "0.9rem", color: "var(--color-text-muted)" }}>Experience</h3>
                  <p style={{ margin: 0, fontWeight: 500 }}>
                    {opportunity.experienceMin !== null || opportunity.experienceMax !== null
                      ? `${opportunity.experienceMin ?? 0}-${opportunity.experienceMax ?? "10+"} years`
                      : "Not specified"}
                  </p>
                </div>
                <div>
                  <h3 style={{ margin: "0 0 8px", fontSize: "0.9rem", color: "var(--color-text-muted)" }}>Education</h3>
                  <p style={{ margin: 0, fontWeight: 500 }}>{opportunity.educationRequirement ?? "Not specified"}</p>
                </div>
                <div>
                  <h3 style={{ margin: "0 0 8px", fontSize: "0.9rem", color: "var(--color-text-muted)" }}>Salary</h3>
                  <p style={{ margin: 0, fontWeight: 500 }}>
                    {opportunity.salaryMin && opportunity.salaryMax
                      ? `$${(opportunity.salaryMin / 1000).toFixed(0)}k - $${(opportunity.salaryMax / 1000).toFixed(0)}k`
                      : opportunity.salaryMin
                        ? `$${(opportunity.salaryMin / 1000).toFixed(0)}k+`
                        : opportunity.salaryMax
                          ? `Up to $${(opportunity.salaryMax / 1000).toFixed(0)}k`
                          : "Not disclosed"}
                  </p>
                </div>
                <div>
                  <h3 style={{ margin: "0 0 8px", fontSize: "0.9rem", color: "var(--color-text-muted)" }}>Work Arrangement</h3>
                  <p style={{ margin: 0, fontWeight: 500 }}>{opportunity.workArrangement}</p>
                </div>
              </div>
            </Card>

            {opportunity.benefits && (
              <Card style={{ padding: "24px" }}>
                <h2 style={{ margin: "0 0 16px", fontSize: "1.25rem" }}>Benefits</h2>
                <div style={{ lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{opportunity.benefits}</div>
              </Card>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <Card style={{ padding: "20px" }}>
              <h3 style={{ margin: "0 0 16px", fontSize: "1rem" }}>Quick Details</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "0.9rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--color-text-muted)" }}>Location</span>
                  <span style={{ fontWeight: 500 }}>{opportunity.location}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--color-text-muted)" }}>Type</span>
                  <span style={{ fontWeight: 500 }}>{opportunity.type}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--color-text-muted)" }}>Employment</span>
                  <span style={{ fontWeight: 500 }}>{opportunity.employmentType}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--color-text-muted)" }}>Work Arrangement</span>
                  <span style={{ fontWeight: 500 }}>{opportunity.workArrangement}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--color-text-muted)" }}>Salary</span>
                  <span style={{ fontWeight: 500 }}>{opportunity.salaryMin && opportunity.salaryMax ? `$${(opportunity.salaryMin / 1000).toFixed(0)}k - $${(opportunity.salaryMax / 1000).toFixed(0)}k` : "Not disclosed"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--color-text-muted)" }}>Posted</span>
                  <span style={{ fontWeight: 500 }}>{formatDate(new Date(opportunity.postedDate))}</span>
                </div>
                {opportunity.applicationDeadline && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--color-text-muted)" }}>Deadline</span>
                    <span style={{ fontWeight: 500, color: new Date(opportunity.applicationDeadline!) < new Date() ? "var(--color-danger)" : "var(--color-warning)" }}>
                      {formatDate(new Date(opportunity.applicationDeadline!))}
                    </span>
                  </div>
                )}
              </div>
            </Card>

            <Card style={{ padding: "20px" }}>
              <h3 style={{ margin: "0 0 16px", fontSize: "1rem" }}>Source</h3>
              <div style={{ fontSize: "0.9rem", color: "var(--color-text-muted)" }}>
                <p style={{ margin: "0 0 8px" }}>
                  <strong>{opportunity.source?.name ?? "Unknown"}</strong>
                </p>
                {opportunity.source?.url && (
                  <a href={opportunity.source.url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-primary)" }}>
                    View original posting →
                  </a>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab === "skills" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          <Card style={{ padding: "24px" }}>
            <h2 style={{ margin: "0 0 16px", fontSize: "1.25rem" }}>Required Skills</h2>
            {opportunity.requiredSkills.length === 0 ? (
              <p style={{ margin: 0, color: "var(--color-text-muted)" }}>No required skills listed</p>
            ) : (
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {opportunity.requiredSkills.map((skill) => (
                  <Badge key={skill} style={{ background: "var(--color-primary-bg)", color: "var(--color-primary)" }}>{skill}</Badge>
                ))}
              </div>
            )}
          </Card>

          <Card style={{ padding: "24px" }}>
            <h2 style={{ margin: "0 0 16px", fontSize: "1.25rem" }}>Preferred Skills</h2>
            {opportunity.preferredSkills.length === 0 ? (
              <p style={{ margin: 0, color: "var(--color-text-muted)" }}>No preferred skills listed</p>
            ) : (
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {opportunity.preferredSkills.map((skill) => (
                  <Badge key={skill} style={{ background: "var(--color-info-bg)", color: "var(--color-info)" }}>{skill}</Badge>
                ))}
              </div>
            )}
          </Card>

          {opportunity.userMatch && (
            <>
              <Card style={{ padding: "24px", gridColumn: "1 / -1" }}>
                <h2 style={{ margin: "0 0 16px", fontSize: "1.25rem" }}>Your Match Analysis</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "16px" }}>
                  <div style={{ textAlign: "center", padding: "16px", background: "var(--color-surface)", borderRadius: "8px" }}>
                    <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-success)" }}>{opportunity.userMatch!.requiredSkillsScore}%</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Required Skills</div>
                  </div>
                  <div style={{ textAlign: "center", padding: "16px", background: "var(--color-surface)", borderRadius: "8px" }}>
                    <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-info)" }}>{opportunity.userMatch!.preferredSkillsScore}%</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Preferred Skills</div>
                  </div>
                  <div style={{ textAlign: "center", padding: "16px", background: "var(--color-surface)", borderRadius: "8px" }}>
                    <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-warning)" }}>{opportunity.userMatch!.experienceScore}%</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Experience</div>
                  </div>
                  <div style={{ textAlign: "center", padding: "16px", background: "var(--color-surface)", borderRadius: "8px" }}>
                    <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-primary)" }}>{opportunity.userMatch!.locationScore}%</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Location</div>
                  </div>
                </div>

                {opportunity.userMatch!.matchingSkills.length > 0 && (
                  <div style={{ marginTop: "24px" }}>
                    <h3 style={{ margin: "0 0 12px", fontSize: "1rem" }}>Your Matching Skills</h3>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {opportunity.userMatch!.matchingSkills.map((skill) => (
                        <Badge key={skill} style={{ background: "var(--color-success-bg)", color: "var(--color-success)" }}>{skill}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {opportunity.userMatch!.missingSkills.length > 0 && (
                  <div style={{ marginTop: "24px" }}>
                    <h3 style={{ margin: "0 0 12px", fontSize: "1rem" }}>Skills to Develop</h3>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {opportunity.userMatch!.missingSkills.map((skill) => (
                        <Badge key={skill} style={{ background: "var(--color-warning-bg)", color: "var(--color-warning)" }}>{skill}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {opportunity.userMatch!.unverifiedSkills.length > 0 && (
                  <div style={{ marginTop: "24px" }}>
                    <h3 style={{ margin: "0 0 12px", fontSize: "1rem" }}>Skills to Verify</h3>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {opportunity.userMatch!.unverifiedSkills.map((skill) => (
                        <Badge key={skill} style={{ background: "var(--color-info-bg)", color: "var(--color-info)" }}>{skill}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            </>
          )}
        </div>
      )}

      {activeTab === "company" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "24px" }}>
          <div>
            <Card style={{ padding: "24px", marginBottom: "24px" }}>
              <h2 style={{ margin: "0 0 16px", fontSize: "1.25rem" }}>About {opportunity.company.name}</h2>
              <div style={{ lineHeight: 1.7, whiteSpace: "pre-wrap", color: "var(--color-text-muted)" }}>
                {opportunity.company.description || "No description available."}
              </div>
            </Card>

            <Card style={{ padding: "24px", marginBottom: "24px" }}>
              <h2 style={{ margin: "0 0 16px", fontSize: "1.25rem" }}>Company Details</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                <div>
                  <h3 style={{ margin: "0 0 8px", fontSize: "0.9rem", color: "var(--color-text-muted)" }}>Industry</h3>
                  <p style={{ margin: 0, fontWeight: 500 }}>{opportunity.company.industry}</p>
                </div>
                <div>
                  <h3 style={{ margin: "0 0 8px", fontSize: "0.9rem", color: "var(--color-text-muted)" }}>Headquarters</h3>
                  <p style={{ margin: 0, fontWeight: 500 }}>{opportunity.company.headquarters || "Not specified"}</p>
                </div>
                <div>
                  <h3 style={{ margin: "0 0 8px", fontSize: "0.9rem", color: "var(--color-text-muted)" }}>Website</h3>
                  <p style={{ margin: 0 }}>
                    <a href={opportunity.company.website} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-primary)" }}>
                      {opportunity.company.website}
                    </a>
                  </p>
                </div>
              </div>
            </Card>

            <Card style={{ padding: "24px" }}>
              <h2 style={{ margin: "0 0 16px", fontSize: "1.25rem" }}>Careers Page</h2>
              <a href={opportunity.company.careersUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "var(--color-primary)", textDecoration: "none" }}>
                Visit Careers Page →
              </a>
            </Card>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
<Card style={{ padding: "20px" }}>
              <h3 style={{ margin: "0 0 16px", fontSize: "1rem" }}>Company Stats</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--color-text-muted)" }}>Opportunities</span>
                  <span style={{ fontWeight: 500 }}>{opportunity._count?.applications ?? 0}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--color-text-muted)" }}>Saved by</span>
                  <span style={{ fontWeight: 500 }}>{opportunity._count?.savedBy ?? 0} users</span>
                </div>
              </div>
            </Card>

            <Card style={{ padding: "20px" }}>
              <h3 style={{ margin: "0 0 16px", fontSize: "1rem" }}>Related Links</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <a href={opportunity.company.website} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-primary)", textDecoration: "none" }}>Website</a>
                <a href={opportunity.company.careersUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-primary)", textDecoration: "none" }}>Careers Page</a>
                {opportunity.source?.url && (
                  <a href={opportunity.source.url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-primary)", textDecoration: "none" }}>Original Posting</a>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab === "apply" && (
        <div style={{ maxWidth: "600px" }}>
          <Card style={{ padding: "24px" }}>
            <h2 style={{ margin: "0 0 8px", fontSize: "1.5rem" }}>Apply for {opportunity.title}</h2>
            <p style={{ margin: "0 0 24px", color: "var(--color-text-muted)" }}>
              You will be redirected to the company's application portal.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ padding: "16px", background: "var(--color-surface)", borderRadius: "8px" }}>
                <h3 style={{ margin: "0 0 8px", fontSize: "1rem" }}>Application Details</h3>
                <div style={{ fontSize: "0.9rem", display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span><strong>Company:</strong> {opportunity.company.name}</span>
                  <span><strong>Role:</strong> {opportunity.title}</span>
                  <span><strong>Location:</strong> {opportunity.location}</span>
                  <span><strong>Type:</strong> {opportunity.type} · {opportunity.workArrangement}</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <Button variant="outline" onClick={() => setActiveTab("overview")} style={{ flex: 1 }}>Back</Button>
                <Button variant="solid" onClick={handleApply} style={{ flex: 1 }}>
                  Apply on Company Website
                </Button>
              </div>
            </div>
          </Card>

          <Card style={{ padding: "24px", marginTop: "24px" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: "1rem" }}>Prepare for this Application</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
              <Link href={`/applications/new?opportunityId=${opportunity.id}`}>
                <Button variant="outline" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", padding: "16px" }}>
                  <span style={{ fontSize: "1.5rem" }}>📝</span>
                  <span>Track Application</span>
                </Button>
              </Link>
              <Link href={`/mock-interviews/new?opportunityId=${opportunity.id}`}>
                <Button variant="outline" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", padding: "16px" }}>
                  <span style={{ fontSize: "1.5rem" }}>🎤</span>
                  <span>Mock Interview</span>
                </Button>
              </Link>
              <Link href={`/resume/${opportunity.id}/job-match`}>
                <Button variant="outline" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", padding: "16px" }}>
                  <span style={{ fontSize: "1.5rem" }}>📄</span>
                  <span>Resume Match</span>
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString();
}


