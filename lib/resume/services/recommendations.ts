import "server-only";
import { ResumeRecommendationSchema, type ResumeRecommendation } from "../schemas";
import { ExtractedProfileSchema, type ExtractedProfile } from "../schemas";
import { SkillGap } from "../schemas";

export interface RecommendationContext {
  profile: ExtractedProfile;
  analysis?: {
    categories: Array<{ category: string; score: number; maxScore: number }>;
    issues: Array<{ category: string; message: string; severity: string }>;
  };
  skillGaps: SkillGap[];
  targetRole?: string;
  jobMatch?: {
    overallMatch: number;
    missingSkills: Array<{ skill: string; importance: string }>;
  };
}

export function generateRecommendations(ctx: RecommendationContext): ResumeRecommendation[] {
  const recommendations: ResumeRecommendation[] = [];
  let id = 1;

  // From analysis issues
  if (ctx.analysis?.issues) {
    for (const issue of ctx.analysis.issues) {
      if (issue.severity === "HIGH") {
        recommendations.push({
          id: `rec-${id++}`,
          title: `Fix: ${issue.message}`,
          description: issue.message,
          priority: 1,
          category: issue.category,
          evidence: [issue.message],
          expectedEffort: "MEDIUM",
          relatedSkills: [],
          suggestedTasks: [
            `Review the ${issue.category.toLowerCase()} section of your resume`,
            `Apply the suggested improvements`,
            `Re-run analysis to verify`,
          ],
        });
      }
    }
  }

  // From skill gaps
  const criticalGaps = ctx.skillGaps.filter(g =>
    g.classification === "NOT_FOUND" && g.targetRole
  ).slice(0, 5);

  for (const gap of criticalGaps) {
    recommendations.push({
      id: `rec-${id++}`,
      title: `Add missing skill: ${gap.skill}`,
      description: `Your target role "${gap.targetRole}" requires ${gap.skill} but it's not found in your resume.`,
      priority: 2,
      category: "Skill Gaps",
      evidence: [`Required for ${gap.targetRole}`, `Classification: ${gap.classification}`],
      expectedEffort: "HIGH",
      relatedSkills: [gap.skill],
      suggestedTasks: [
        `If you have ${gap.skill} experience, add it to your skills section`,
        `Add a project or work bullet demonstrating ${gap.skill}`,
        `Consider taking an assessment on ${gap.skill} to validate proficiency`,
      ],
    });
  }

  const weakGaps = ctx.skillGaps.filter(g =>
    g.classification === "MENTIONED_NOT_DEMONSTRATED"
  ).slice(0, 3);

  for (const gap of weakGaps) {
    recommendations.push({
      id: `rec-${id++}`,
      title: `Strengthen evidence for ${gap.skill}`,
      description: `${gap.skill} is mentioned but lacks demonstrated evidence in your resume.`,
      priority: 3,
      category: "Skill Gaps",
      evidence: [`Listed in skills but no project/work evidence`],
      expectedEffort: "MEDIUM",
      relatedSkills: [gap.skill],
      suggestedTasks: [
        `Add a bullet point in experience showing ${gap.skill} usage with metrics`,
        `Add a project that prominently uses ${gap.skill}`,
        `Take a practice assessment on ${gap.skill} to build evidence`,
      ],
    });
  }

  // From resume structure issues
  const profile = ctx.profile;
  if (!profile.summary) {
    recommendations.push({
      id: `rec-${id++}`,
      title: "Add a professional summary",
      description: "Your resume lacks a professional summary. This is the first thing recruiters read.",
      priority: 2,
      category: "Content Completeness",
      evidence: ["No summary section detected"],
      expectedEffort: "LOW",
      relatedSkills: [],
      suggestedTasks: [
        "Write a 2-3 sentence summary highlighting your target role fit",
        "Include years of experience, key skills, and top achievement",
        "Tailor to your target role if specified",
      ],
    });
  }

  if (!profile.contact?.linkedin) {
    recommendations.push({
      id: `rec-${id++}`,
      title: "Add LinkedIn profile",
      description: "LinkedIn profile is expected by most recruiters and ATS systems.",
      priority: 3,
      category: "Contact Information",
      evidence: ["No LinkedIn URL detected"],
      expectedEffort: "LOW",
      relatedSkills: [],
      suggestedTasks: [
        "Add your LinkedIn URL to the contact section",
        "Ensure LinkedIn profile is updated and consistent with resume",
      ],
    });
  }

  // Check for quantified achievements
  const hasQuantified = (profile.experience || []).some(exp =>
    exp.achievements?.some(a => /\d+%|\$\d+|\d+x|\d+ users?|\d+ team/i.test(a))
  );
  if (!hasQuantified && (profile.experience || []).length > 0) {
    recommendations.push({
      id: `rec-${id++}`,
      title: "Add quantified achievements",
      description: "Your experience bullets lack quantified results. Numbers make achievements credible.",
      priority: 2,
      category: "Achievement Evidence",
      evidence: ["No quantified metrics found in experience bullets"],
      expectedEffort: "MEDIUM",
      relatedSkills: [],
      suggestedTasks: [
        "Review each experience bullet and add metrics where possible",
        "Use percentages, dollar amounts, team sizes, user counts, performance improvements",
        "Follow the format: Action verb + task + quantified result",
      ],
    });
  }

  // From job match
  if (ctx.jobMatch && ctx.jobMatch.overallMatch !== undefined && ctx.jobMatch.overallMatch < 70) {
    const topMissing = ctx.jobMatch.missingSkills
      .filter(m => m.importance === "REQUIRED")
      .slice(0, 3);

    for (const missing of topMissing) {
      recommendations.push({
        id: `rec-${id++}`,
        title: `Address job requirement: ${missing.skill}`,
        description: `The job description lists ${missing.skill} as a ${missing.importance} requirement but it's not demonstrated in your resume.`,
        priority: 1,
        category: "Job Match",
        evidence: [`Job requirement: ${missing.skill} (${missing.importance})`],
        expectedEffort: "HIGH",
        relatedSkills: [missing.skill],
        suggestedTasks: [
          `If you have ${missing.skill} experience, add it immediately`,
          `Consider a quick certification or project to demonstrate ${missing.skill}`,
          `Prepare to discuss ${missing.skill} in interviews`,
        ],
      });
    }
  }

  // Sort by priority
  return recommendations.sort((a, b) => a.priority - b.priority);
}

export function getRecommendationStats(recommendations: ResumeRecommendation[]) {
  return {
    total: recommendations.length,
    byPriority: {
      critical: recommendations.filter(r => r.priority === 1).length,
      high: recommendations.filter(r => r.priority === 2).length,
      medium: recommendations.filter(r => r.priority === 3).length,
      low: recommendations.filter(r => r.priority >= 4).length,
    },
    byCategory: Object.entries(
      recommendations.reduce((acc, r) => {
        acc[r.category] = (acc[r.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).map(([category, count]) => ({ category, count })),
    byEffort: {
      LOW: recommendations.filter(r => r.expectedEffort === "LOW").length,
      MEDIUM: recommendations.filter(r => r.expectedEffort === "MEDIUM").length,
      HIGH: recommendations.filter(r => r.expectedEffort === "HIGH").length,
    },
  };
}