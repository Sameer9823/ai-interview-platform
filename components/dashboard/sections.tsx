import Link from "next/link";
import { Badge, Card, EmptyState, ProgressBar } from "@/components/ui/misc";
import { LocalTime } from "@/components/layout/local-time";
import type { DevUser } from "@/lib/data/dev-store";
import { profileCompletion } from "@/lib/utils/profile-completion";
import { CAREER_STAGE_LABELS, GOAL_LABELS } from "@/lib/utils/labels";

export function Welcome({ user }: { user: DevUser }) {
  return (
    <>
      <h1>Welcome, {user.name.split(" ")[0]}</h1>
      <p className="mut" style={{ marginTop: 8 }}>
        {CAREER_STAGE_LABELS[user.careerStage!]} dashboard. Everything here comes from what you have entered or done.
      </p>
    </>
  );
}

export function CompletionCard({ user }: { user: DevUser }) {
  const { percent, missing } = profileCompletion(user);
  return (
    <Card>
      <h3>Profile completion</h3>
      <ProgressBar percent={percent} />
      <p className="sm mut">
        {percent}% complete. {missing.length > 0 ? <>Next: {missing[0]}. </> : null}
        <Link className="lk" href="/profile">
          Edit profile
        </Link>
      </p>
    </Card>
  );
}

export function GoalsCard({ user }: { user: DevUser }) {
  const { targetRole, careerDomain } = user.profile;
  return (
    <Card>
      <h3>Target and preparation goals</h3>
      <div style={{ marginTop: 12 }}>
        {targetRole && (
          <p>
            <span className="hl">{targetRole}</span>
            {careerDomain && <span className="sm mut"> in {careerDomain}</span>}
          </p>
        )}
        {user.goals.length ? (
          <ul className="l" style={{ marginTop: 12 }}>
            {user.goals.map((g) => (
              <li key={g}>{GOAL_LABELS[g]}</li>
            ))}
          </ul>
        ) : (
          <div style={{ marginTop: targetRole ? 12 : 0 }}>
            <EmptyState>
              No preparation goals yet.{" "}
              <Link className="lk" href="/goals">
                Choose your goals
              </Link>
              .
            </EmptyState>
          </div>
        )}
      </div>
    </Card>
  );
}

export function SummaryCard({ title, rows }: { title: string; rows: [string, string | undefined][] }) {
  return (
    <Card>
      <h3>{title}</h3>
      <ul className="l" style={{ marginTop: 12 }}>
        {rows.map(([k, v]) => (
          <li key={k}>
            <span className="mut">{k}</span>
            <span>{v || <span className="mut">Not added</span>}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/** Real counts only. Practice sessions stay at zero until the practice tools exist. */
export function ActivitySummary({ user }: { user: DevUser }) {
  const count = (t: string) => user.activity.filter((a) => a.title === t).length;
  return (
    <Card>
      <h3>Preparation activity</h3>
      <ul className="l" style={{ marginTop: 12 }}>
        <li>
          <span className="mut">Practice sessions completed</span>
          <span>0</span>
        </li>
        <li>
          <span className="mut">Preparation goals selected</span>
          <span>{user.goals.length}</span>
        </li>
        <li>
          <span className="mut">Profile updates</span>
          <span>{count("Profile updated")}</span>
        </li>
      </ul>
      <p className="sm mut" style={{ marginTop: 12 }}>
        Practice sessions will count here once assessments and mock interviews are available.
      </p>
    </Card>
  );
}

export function NextSteps({ user, firstTool }: { user: DevUser; firstTool: string }) {
  const { missing } = profileCompletion(user);
  const steps = [...missing.slice(0, 3), `${firstTool} is planned first. It will show here when it is available.`];
  return (
    <Card>
      <h3>Recommended next steps</h3>
      <ul className="l" style={{ marginTop: 12 }}>
        {steps.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>
    </Card>
  );
}

export function RecentlyAccessed() {
  return (
    <Card>
      <h3>Recently accessed</h3>
      <div style={{ marginTop: 12 }}>
        <EmptyState>Items you open in the Preparation Library will appear here. The library arrives in the next phase.</EmptyState>
      </div>
    </Card>
  );
}

export function ToolGrid({ tools }: { tools: [string, string][] }) {
  return (
    <>
      <h2 style={{ marginTop: 48 }}>Coming soon</h2>
      <div className="grid g3">
        {tools.map(([name, text]) => (
          <div className="card h" key={name}>
            <Badge>Coming soon</Badge>
            <h3 style={{ marginTop: 12 }}>{name}</h3>
            <p className="sm mut" style={{ marginTop: 4 }}>
              {text}
            </p>
          </div>
        ))}
      </div>
    </>
  );
}

export function RecentActivity({ user }: { user: DevUser }) {
  return (
    <Card style={{ marginTop: 16 }}>
      <h3>Recent activity</h3>
      <div style={{ marginTop: 12 }}>
        {user.activity.length ? (
          <ul className="l">
            {user.activity.slice(0, 6).map((a) => (
              <li key={a.id}>
                <span>{a.title}</span>
                <LocalTime iso={a.at} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState>No activity yet.</EmptyState>
        )}
      </div>
    </Card>
  );
}
