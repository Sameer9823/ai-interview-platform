"use client";
import { useState, useEffect } from "react";
import { Button, Card, ProgressBar } from "@/components/ui";

interface GamificationDashboardProps {
  userId: string;
}

interface DashboardData {
  profile: {
    totalXP: number;
    currentLevel: number;
    currentStreak: number;
    longestStreak: number;
    levelProgress: number;
  };
  recentXP: Array<{
    activityType: string;
    xpAmount: number;
    createdAt: string;
  }>;
  recentEvents: Array<{
    eventType: string;
    description: string;
    createdAt: string;
  }>;
  unlockedAchievements: Array<{
    id: string;
    name: string;
    description: string;
    category: string;
    unlockedAt: string;
  }>;
  inProgressAchievements: Array<{
    id: string;
    name: string;
    description: string;
    progress: number;
    target: number;
  }>;
}

const ACTIVITY_LABELS: Record<string, string> = {
  PRACTICE_SESSION_COMPLETED: "Practice Session",
  ASSESSMENT_COMPLETED: "Assessment",
  MOCK_INTERVIEW_COMPLETED: "Mock Interview",
  ROADMAP_TASK_COMPLETED: "Roadmap Task",
  ROADMAP_MILESTONE_COMPLETED: "Roadmap Milestone",
  WEEKLY_CHALLENGE_COMPLETED: "Challenge",
  WEAK_TOPIC_REVIEWED: "Topic Review",
  RESUME_ANALYSIS_COMPLETED: "Resume Analysis",
  JOB_MATCH_COMPLETED: "Job Match",
  WEEKLY_GOAL_ACHIEVED: "Weekly Goal",
  STREAK_MILESTONE_REACHED: "Streak Milestone",
  PERSONAL_BEST_SET: "Personal Best",
};

const EVENT_LABELS: Record<string, string> = {
  LEVEL_UP: "Level Up",
  ACHIEVEMENT_UNLOCKED: "Achievement Unlocked",
  CHALLENGE_COMPLETED: "Challenge Completed",
  WEEKLY_GOAL_ACHIEVED: "Goal Achieved",
  ROADMAP_MILESTONE_COMPLETED: "Milestone",
  PERSONAL_BEST_SET: "Personal Best",
  STREAK_MILESTONE_REACHED: "Streak Milestone",
};

export function GamificationDashboard({ userId }: GamificationDashboardProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, [userId]);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/gamification/dashboard");
      if (!res.ok) throw new Error("Failed to fetch dashboard");
      const result = await res.json();
      setData(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return <div style={{ padding: "48px", textAlign: "center" }}>Loading gamification data...</div>;
  }

  const { profile, recentXP, recentEvents, unlockedAchievements, inProgressAchievements } = data;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>Your Progress</h1>
          <p className="mut" style={{ margin: 0 }}>Level {profile.currentLevel} • {profile.totalXP} XP</p>
        </div>
      </div>

      <Card style={{ marginBottom: 24, padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flexEnd", gap: 16, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span className="mut">Level {profile.currentLevel}</span>
              <span className="mut">Level {profile.currentLevel + 1}</span>
            </div>
            <ProgressBar percent={profile.levelProgress} />
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "1.25rem", fontWeight: 700 }}>{profile.totalXP}</div>
            <span className="mut">Total XP</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 24, marginTop: 16 }}>
          <div>
            <span className="mut" style={{ fontSize: "0.85rem" }}>Current Streak</span>
            <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{profile.currentStreak} 🔥</div>
          </div>
          <div>
            <span className="mut" style={{ fontSize: "0.85rem" }}>Longest Streak</span>
            <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{profile.longestStreak} days</div>
          </div>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
        <Card style={{ padding: 24 }}>
          <h3 style={{ marginBottom: 16 }}>Recent Activity</h3>
          {recentXP.length === 0 ? (
            <p className="mut">No recent activity yet. Start practicing to earn XP!</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {recentXP.map((tx, i) => (
                <li key={i} style={{ padding: "8px 0", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between" }}>
                  <span>{ACTIVITY_LABELS[tx.activityType] || tx.activityType}</span>
                  <span style={{ fontWeight: 600, color: "var(--color-success)" }}>+{tx.xpAmount} XP</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card style={{ padding: 24 }}>
          <h3 style={{ marginBottom: 16 }}>Recent Events</h3>
          {recentEvents.length === 0 ? (
            <p className="mut">No recent events. Keep going to trigger level-ups and achievements!</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {recentEvents.map((e, i) => (
                <li key={i} style={{ padding: "8px 0", borderBottom: "1px solid var(--color-border)" }}>
                  <span style={{ fontWeight: 600 }}>{EVENT_LABELS[e.eventType] || e.eventType}</span>
                  <p className="mut" style={{ margin: 0 }}>{e.description}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <Card style={{ padding: 24 }}>
          <h3 style={{ marginBottom: 16 }}>Recent Achievements</h3>
          {unlockedAchievements.length === 0 ? (
            <p className="mut">No achievements unlocked yet. Complete activities to earn your first achievement!</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {unlockedAchievements.map((a) => (
                <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: 8, background: "var(--color-brand-bg)", borderRadius: "6px" }}>
                  <span style={{ fontSize: "1.5rem" }}>🏆</span>
                  <div>
                    <div style={{ fontWeight: 600 }}>{a.name}</div>
                    <p className="mut" style={{ margin: 0, fontSize: "0.85rem" }}>{a.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card style={{ padding: 24 }}>
          <h3 style={{ marginBottom: 16 }}>In Progress</h3>
          {inProgressAchievements.length === 0 ? (
            <p className="mut">No achievements in progress. Check back after completing more activities!</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {inProgressAchievements.map((a) => (
                <div key={a.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontWeight: 600 }}>{a.name}</span>
                    <span className="mut">{a.progress}/{a.target}</span>
                  </div>
                  <ProgressBar percent={a.target > 0 ? (a.progress / a.target) * 100 : 0} />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
