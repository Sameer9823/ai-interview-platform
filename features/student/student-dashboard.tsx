import type { DevUser } from "@/lib/data/dev-store";
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
import { EDUCATION_LABELS, EXPERIENCE_LEVEL_LABELS } from "@/lib/utils/labels";
import { Card, EmptyState, Badge } from "@/components/ui/misc";
import Link from "next/link";

const TOOLS: [string, string][] = [
  ["Aptitude and reasoning practice", "Timed sets with explained answers."],
  ["Technical and coding practice", "Fundamentals and DSA problems for your target role."],
  ["Resume analysis", "See how a screening system reads your resume."],
  ["AI mock interviews", "Practice answers and get structured guidance."],
  ["Communication practice", "Notes on clarity, pace and structure."],
];

export function StudentDashboard({ user }: { user: DevUser }) {
  const p = user.profile;
  const hasActivity = user.activity.length > 0;
  const hasGoals = user.goals.length > 0;
  const targetRole = p.targetRole;

  return (
    <>
      <Welcome user={user} />
      <div className="grid g2">
        <CompletionCard user={user} />
        <GoalsCard user={user} />
        <SummaryCard
          title="Profile"
          rows={[
            ["Education", p.educationLevel ? EDUCATION_LABELS[p.educationLevel] : undefined],
            ["Degree", p.degree],
            ["Graduation year", p.graduationYear?.toString()],
            ["Programming language", p.primaryProgrammingLanguage],
            ["Experience level", p.experienceLevel ? EXPERIENCE_LEVEL_LABELS[p.experienceLevel] : undefined],
          ]}
        />
        <ActivitySummary user={user} />
        <NextSteps user={user} firstTool="Aptitude and technical practice" />
        <RecentlyAccessed />
      </div>
      <RecentActivity user={user} />

      {/* AI-Powered Recommendations Section */}
      <section style={{ marginTop: 48 }}>
        <h2>AI-Powered Recommendations</h2>
        <div className="grid g2" style={{ marginTop: 16 }}>
          {/* Recommended Practice Questions */}
          <Card>
            <h3>Recommended Practice Questions</h3>
            {targetRole && hasGoals ? (
              <div style={{ marginTop: 12 }}>
                <p className="sm mut">Based on your target role ({targetRole}) and goals.</p>
                <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Link href="/practice" className="btn s">Start Practice Session</Link>
                  <Link href="/questions" className="btn o s">Browse Question Bank</Link>
                </div>
              </div>
            ) : (
              <div style={{ marginTop: 12 }}>
                <EmptyState>
                  Complete your profile and select goals to get personalized recommendations.
                </EmptyState>
              </div>
            )}
          </Card>

          {/* Suggested Next Topic */}
          <Card>
            <h3>Suggested Next Topic</h3>
            {p.skillsToImprove.length > 0 ? (
              <div style={{ marginTop: 12 }}>
                <p className="sm mut">Focus on your improvement areas:</p>
                <ul className="l" style={{ marginTop: 8 }}>
                  {p.skillsToImprove.slice(0, 3).map((skill) => (
                    <li key={skill}>
                      <Badge>{skill}</Badge>
                    </li>
                  ))}
                </ul>
                <Link href="/practice" className="btn s" style={{ marginTop: 12 }}>
                  Practice {p.skillsToImprove[0]}
                </Link>
              </div>
            ) : (
              <div style={{ marginTop: 12 }}>
                <EmptyState>
                  Add skills to improve in your profile to get topic suggestions.
                </EmptyState>
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

          {/* Weak Topic Recommendations */}
          <Card>
            <h3>Weak Topics (from practice)</h3>
            <div style={{ marginTop: 12 }}>
              <EmptyState>
                Complete practice sessions to identify weak areas.
              </EmptyState>
            </div>
          </Card>

          {/* Recent AI Feedback */}
          <Card>
            <h3>Recent AI Feedback</h3>
            <div style={{ marginTop: 12 }}>
              <EmptyState>
                Submit answers in practice sessions to get AI feedback.
              </EmptyState>
            </div>
          </Card>

          {/* Practice Activity */}
          <Card>
            <h3>Practice Activity</h3>
            <div style={{ marginTop: 12 }}>
              <EmptyState>
                No practice sessions yet.
                <Link href="/practice" className="lk" style={{ marginLeft: 8 }}>Start one</Link>
                .
              </EmptyState>
            </div>
          </Card>
        </div>
      </section>

      <ToolGrid tools={TOOLS} />
    </>
  );
}
