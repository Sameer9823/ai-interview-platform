import type { DevUser } from "@/lib/data/dev-store";
import { Card, EmptyState, Badge } from "@/components/ui/misc";
import {
  ActivitySummary,
  CompletionCard,
  GoalsCard,
  NextSteps,
  RecentActivity,
  RecentlyAccessed,
  SummaryCard,
  ToolGrid,
  Welcome,
} from "@/components/dashboard/sections";
import { EXPERIENCE_LEVEL_LABELS } from "@/lib/utils/labels";
import Link from "next/link";

const TOOLS: [string, string][] = [
  ["Advanced technical practice", "Depth questions for your domain."],
  ["System design preparation", "Walk through design prompts."],
  ["Behavioral and managerial practice", "Rehearse judgment and leadership questions."],
  ["AI mock interviews", "Practice answers and get structured guidance."],
  ["Skill gap analysis", "Compare your skills with your target role."],
  ["Resume analysis", "Sharpen your resume for experienced roles."],
];

export function ProfessionalDashboard({ user }: { user: DevUser }) {
  const p = user.profile;
  const targetRole = p.targetRole;
  const hasGoals = user.goals.length > 0;

  return (
    <>
      <Welcome user={user} />
      <div className="grid g2">
        <CompletionCard user={user} />
        <GoalsCard user={user} />
        <SummaryCard
          title="Professional profile"
          rows={[
            ["Current role", p.currentRole],
            [
              "Experience",
              p.yearsOfExperience !== undefined ? `${p.yearsOfExperience} ${p.yearsOfExperience === 1 ? "year" : "years"}` : undefined,
            ],
            ["Target role", p.targetRole],
            ["Experience level", p.experienceLevel ? EXPERIENCE_LEVEL_LABELS[p.experienceLevel] : undefined],
          ]}
        />
        <Card>
          <h3>Skills to improve</h3>
          <div style={{ marginTop: 12 }}>
            {p.skillsToImprove.length ? (
              <ul className="l">
                {p.skillsToImprove.map((s) => (
                  <li key={s}><Badge>{s}</Badge></li>
                ))}
              </ul>
            ) : (
              <EmptyState>No skills listed yet. Add them in your profile.</EmptyState>
            )}
          </div>
        </Card>
        <ActivitySummary user={user} />
        <NextSteps user={user} firstTool="System design and technical practice" />
        <RecentlyAccessed />
      </div>
      <RecentActivity user={user} />

      {/* AI-Powered Recommendations Section */}
      <section style={{ marginTop: 48 }}>
        <h2>AI-Powered Recommendations</h2>
        <div className="grid g2" style={{ marginTop: 16 }}>
          {/* Target Role Preparation */}
          <Card>
            <h3>Target Role Preparation</h3>
            {targetRole && hasGoals ? (
              <div style={{ marginTop: 12 }}>
                <p className="sm mut">Recommendations for {targetRole} preparation.</p>
                <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Link href="/practice" className="btn s">Start Practice Session</Link>
                  <Link href="/questions" className="btn o s">Browse Question Bank</Link>
                </div>
              </div>
            ) : (
              <div style={{ marginTop: 12 }}>
                <EmptyState>
                  Set a target role and goals to get personalized recommendations.
                </EmptyState>
              </div>
            )}
          </Card>

          {/* Advanced Technical / Behavioral Practice */}
          <Card>
            <h3>Advanced Practice Areas</h3>
            <div style={{ marginTop: 12 }}>
              <p className="sm mut">Based on your experience level and target role:</p>
              <ul className="l" style={{ marginTop: 8 }}>
                <li><Badge>System Design</Badge></li>
                <li><Badge>Behavioral/Leadership</Badge></li>
                <li><Badge>Advanced {p.primaryProgrammingLanguage || "Technical"}</Badge></li>
              </ul>
              <Link href="/practice" className="btn s" style={{ marginTop: 12 }}>Start Advanced Practice</Link>
            </div>
          </Card>

          {/* System Design Practice */}
          <Card>
            <h3>System Design Practice</h3>
            <div style={{ marginTop: 12 }}>
              <p className="sm mut">Practice system design scenarios for your target role.</p>
              <Link href="/practice" className="btn s" style={{ marginTop: 8 }}>Practice System Design</Link>
            </div>
          </Card>

          {/* Skills Needing Improvement */}
          <Card>
            <h3>Skills Needing Improvement</h3>
            {p.skillsToImprove.length > 0 ? (
              <div style={{ marginTop: 12 }}>
                <ul className="l">
                  {p.skillsToImprove.map((s) => (
                    <li key={s}><Badge>{s}</Badge></li>
                  ))}
                </ul>
                <Link href="/practice" className="btn s" style={{ marginTop: 12 }}>Practice These Skills</Link>
              </div>
            ) : (
              <div style={{ marginTop: 12 }}>
                <EmptyState>Add skills to improve in your profile.</EmptyState>
              </div>
            )}
          </Card>

          {/* Current Preparation Plan */}
          <Card>
            <h3>Current Preparation Plan</h3>
            <div style={{ marginTop: 12 }}>
              <EmptyState>
                No active plan yet.
                <Link href="/plan" className="lk" style={{ marginLeft: 8 }}>Create one</Link>
                .
              </EmptyState>
            </div>
          </Card>

          {/* Recent Evaluations */}
          <Card>
            <h3>Recent Evaluations</h3>
            <div style={{ marginTop: 12 }}>
              <EmptyState>
                Complete practice sessions to see AI evaluations.
              </EmptyState>
            </div>
          </Card>
        </div>
      </section>

      <ToolGrid tools={TOOLS} />
    </>
  );
}
