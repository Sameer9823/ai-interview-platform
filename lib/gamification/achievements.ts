import "server-only";
import { db } from "@/lib/db/client";

export const ACHIEVEMENT_DEFINITIONS = [
  {
    identifier: "first_assessment",
    name: "First Assessment",
    description: "Complete your first assessment",
    category: "GETTING_STARTED",
    icon: "clipboard-check",
    criteriaJson: { type: "count", activityType: "ASSESSMENT_COMPLETED", minCount: 1 },
    xpReward: 50,
    displayOrder: 1,
  },
  {
    identifier: "first_mock_interview",
    name: "First Interview",
    description: "Complete your first mock interview",
    category: "GETTING_STARTED",
    icon: "microphone",
    criteriaJson: { type: "count", activityType: "MOCK_INTERVIEW_COMPLETED", minCount: 1 },
    xpReward: 100,
    displayOrder: 2,
  },
  {
    identifier: "week_warrior",
    name: "Week Warrior",
    description: "Maintain a 7-day learning streak",
    category: "CONSISTENCY",
    icon: "calendar-days",
    criteriaJson: { type: "streak", minStreak: 7 },
    xpReward: 200,
    displayOrder: 10,
  },
  {
    identifier: "month_master",
    name: "Month Master",
    description: "Maintain a 30-day learning streak",
    category: "CONSISTENCY",
    icon: "calendar-month",
    criteriaJson: { type: "streak", minStreak: 30 },
    xpReward: 500,
    displayOrder: 11,
  },
  {
    identifier: "assessment_master_10",
    name: "Assessment Master",
    description: "Complete 10 assessments",
    category: "PRACTICE",
    icon: "clipboard-list",
    criteriaJson: { type: "count", activityType: "ASSESSMENT_COMPLETED", minCount: 10 },
    xpReward: 200,
    displayOrder: 20,
  },
  {
    identifier: "interview_master_10",
    name: "Interview Master",
    description: "Complete 10 mock interviews",
    category: "MOCK_INTERVIEWS",
    icon: "microphones",
    criteriaJson: { type: "count", activityType: "MOCK_INTERVIEW_COMPLETED", minCount: 10 },
    xpReward: 300,
    displayOrder: 21,
  },
  {
    identifier: "level_5",
    name: "Rising Star",
    description: "Reach level 5",
    category: "PERSONAL_MILESTONES",
    icon: "star",
    criteriaJson: { type: "level", minLevel: 5 },
    xpReward: 150,
    displayOrder: 30,
  },
  {
    identifier: "level_10",
    name: "Expert Path",
    description: "Reach level 10",
    category: "PERSONAL_MILESTONES",
    icon: "trophy",
    criteriaJson: { type: "level", minLevel: 10 },
    xpReward: 300,
    displayOrder: 31,
  },
  {
    identifier: "xp_1000",
    name: "Dedicated Learner",
    description: "Earn 1,000 XP",
    category: "PRACTICE",
    icon: "lightning-bolt",
    criteriaJson: { type: "total_xp", minXP: 1000 },
    xpReward: 100,
    displayOrder: 40,
  },
  {
    identifier: "passed_5",
    name: "Test Passer",
    description: "Pass 5 assessments",
    category: "ASSESSMENTS",
    icon: "academic-cap",
    criteriaJson: { type: "assessment_passed", minCount: 5 },
    xpReward: 150,
    displayOrder: 50,
  },
];

export async function seedAchievementDefinitions() {
  const results = [];
  for (const def of ACHIEVEMENT_DEFINITIONS) {
    const existing = await db.achievementDefinition.findUnique({
      where: { identifier: def.identifier },
    });
    if (!existing) {
      await db.achievementDefinition.create({
        data: {
          identifier: def.identifier,
          name: def.name,
          description: def.description,
          category: def.category as any,
          icon: def.icon,
          criteriaJson: def.criteriaJson as any,
          xpReward: def.xpReward,
          displayOrder: def.displayOrder,
        },
      });
      results.push(`Created: ${def.identifier}`);
    } else {
      results.push(`Skipped: ${def.identifier}`);
    }
  }
  return results;
}
