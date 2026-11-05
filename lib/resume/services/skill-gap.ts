import "server-only";
import { db } from "@/lib/db/client";
import { SkillGapSchema, type SkillGap } from "../schemas";
import { ExtractedProfileSchema, type ExtractedProfile } from "../schemas";

export async function detectSkillGaps(
  resumeVersionId: string,
  profile: ExtractedProfile,
  targetRole: string | undefined,
  userId: string
): Promise<SkillGap[]> {
  // Get user's assessment history
  const attempts = await db.assessmentAttempt.findMany({
    where: { userId, status: "COMPLETED" },
    include: {
      assessment: true,
      result: true,
    },
    orderBy: { submittedAt: "desc" },
    take: 20,
  });

  // Get user's practice history
  const practiceSessions = await db.practiceSession.findMany({
    where: { userId, status: "COMPLETED" },
    include: {
      answers: { include: { evaluation: true } },
    },
    orderBy: { completedAt: "desc" },
    take: 20,
  });

  // Get user's preparation goals
  const goals = await db.preparationGoal.findMany({
    where: { userId },
  });

  // Extract resume skills
  const resumeSkills = new Map<string, { source: "resume"; evidence: string[] }>();
  for (const skill of profile.technicalSkills || []) {
    resumeSkills.set(skill.toLowerCase(), { source: "resume", evidence: [`Technical skills: ${skill}`] });
  }
  for (const skill of profile.softSkills || []) {
    resumeSkills.set(skill.toLowerCase(), { source: "resume", evidence: [`Soft skills: ${skill}`] });
  }

  // Extract skills from experience
  for (const exp of profile.experience || []) {
    for (const tech of exp.technologies || []) {
      const existing = resumeSkills.get(tech.toLowerCase());
      resumeSkills.set(tech.toLowerCase(), {
        source: "resume",
        evidence: [...(existing?.evidence || []), `Experience at ${exp.company}: ${exp.description?.substring(0, 100)}`],
      });
    }
  }

  // Extract skills from projects
  for (const proj of profile.projects || []) {
    for (const tech of proj.technologies || []) {
      const existing = resumeSkills.get(tech.toLowerCase());
      resumeSkills.set(tech.toLowerCase(), {
        source: "resume",
        evidence: [...(existing?.evidence || []), `Project ${proj.name}: ${proj.description?.substring(0, 100)}`],
      });
    }
  }

  // Get target role skills from question bank
  let targetRoleSkills: string[] = [];
  if (targetRole) {
    const questions = await db.question.findMany({
      where: {
        publication: "PUBLISHED",
        roles: { has: targetRole },
      },
      select: { skills: true },
      take: 100,
    });
    const skillCounts = new Map<string, number>();
    for (const q of questions) {
      for (const skill of q.skills) {
        skillCounts.set(skill.toLowerCase(), (skillCounts.get(skill.toLowerCase()) || 0) + 1);
      }
    }
    targetRoleSkills = Array.from(skillCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30)
      .map(([skill]) => skill);
  }

  // Build skill gaps
  const gaps: SkillGap[] = [];

  // Check target role skills against resume
  for (const skill of targetRoleSkills) {
    const resumeEntry = resumeSkills.get(skill.toLowerCase());
    const assessmentEvidence = findAssessmentEvidence(attempts, skill);
    const practiceEvidence = findPracticeEvidence(practiceSessions, skill);

    let classification: SkillGap["classification"] = "NOT_FOUND";
    let confidence = 0.8;
    const resumeEvidence = resumeEntry?.evidence || [];

    if (resumeEntry) {
      if (assessmentEvidence.length > 0 || practiceEvidence.length > 0) {
        classification = "DEMONSTRATED";
        confidence = 0.9;
      } else {
        classification = "MENTIONED_NOT_DEMONSTRATED";
        confidence = 0.6;
      }
    } else if (assessmentEvidence.length > 0) {
      classification = "DEMONSTRATED";
      confidence = 0.85;
    } else if (practiceEvidence.length > 0) {
      classification = "SELF_REPORTED";
      confidence = 0.6;
    } else {
      classification = "NEEDS_ASSESSMENT";
      confidence = 0.7;
    }

    gaps.push({
      resumeVersionId,
      skill,
      category: categorizeSkill(skill),
      targetRole,
      resumeEvidence,
      assessmentEvidence,
      practiceEvidence,
      classification,
      confidence,
      suggestedAction: getSuggestedAction(classification, skill),
    } as SkillGap);
  }

  // Also check resume skills not in target role (potential transferable skills)
  for (const [skill, entry] of resumeSkills) {
    if (!targetRoleSkills.includes(skill)) {
      const assessmentEvidence = findAssessmentEvidence(attempts, skill);
      const practiceEvidence = findPracticeEvidence(practiceSessions, skill);

      if (assessmentEvidence.length > 0 || practiceEvidence.length > 0) {
        gaps.push({
          resumeVersionId,
          skill,
          category: categorizeSkill(skill),
          targetRole,
          resumeEvidence: entry.evidence,
          assessmentEvidence,
          practiceEvidence,
          classification: "DEMONSTRATED",
          confidence: 0.8,
          suggestedAction: "This skill is demonstrated but not explicitly required for your target role. Consider highlighting it as a transferable skill.",
        } as SkillGap);
      }
    }
  }

  return gaps;
}

function findAssessmentEvidence(attempts: any[], skill: string): string[] {
  const evidence: string[] = [];
  const skillLower = skill.toLowerCase();

  for (const attempt of attempts) {
    if (!attempt.result?.breakdown) continue;
    for (const item of attempt.result.breakdown) {
      const question = attempt.assessment.questions.find((q: any) => q.id === item.questionId);
      if (question && question.skills.some((s: string) => s.toLowerCase().includes(skill.toLowerCase()))) {
        if (item.isCorrect) {
          evidence.push(`Assessment "${attempt.assessment.title}": Correctly answered ${question.type} question on ${skill}`);
        }
      }
    }
  }
  return evidence;
}

function findPracticeEvidence(sessions: any[], skill: string): string[] {
  const evidence: string[] = [];
  const skillLower = skill.toLowerCase();

  for (const session of sessions) {
    for (const answer of session.answers) {
      if (answer.evaluation && answer.evaluation.score >= 75) {
        const q = session.questions.find((sq: any) => sq.id === answer.questionRef);
        if (q && (q.question?.skills || q.generatedQuestion?.skills).some((s: string) => s.toLowerCase().includes(skill.toLowerCase()))) {
          evidence.push(`Practice session "${session.topic}": Scored ${answer.evaluation.score}% on ${skill} question`);
        }
      }
    }
  }
  return evidence;
}

function categorizeSkill(skill: string): string {
  const lower = skill.toLowerCase();

  const categories: Record<string, string[]> = {
    "Programming Languages": ["javascript", "typescript", "python", "java", "c++", "c#", "go", "rust", "ruby", "php", "swift", "kotlin"],
    "Frontend": ["react", "vue", "angular", "svelte", "next.js", "redux", "webpack", "vite", "css", "html", "tailwind", "sass"],
    "Backend": ["node.js", "express", "nest.js", "django", "flask", "spring", "rails", "laravel", "graphql", "rest api", "grpc"],
    "Databases": ["postgresql", "mysql", "mongodb", "redis", "elasticsearch", "dynamodb", "sql", "nosql", "prisma", "typeorm"],
    "Cloud & DevOps": ["aws", "azure", "gcp", "docker", "kubernetes", "terraform", "ci/cd", "github actions", "gitlab ci", "jenkins"],
    "Data Science & ML": ["pandas", "numpy", "scikit-learn", "tensorflow", "pytorch", "keras", "ml", "ai", "deep learning", "nlp", "computer vision"],
    "Testing": ["jest", "cypress", "playwright", "selenium", "unit testing", "integration testing", "e2e testing", "tdd"],
    "Architecture": ["microservices", "monolith", "system design", "design patterns", "clean architecture", "ddd", "event driven"],
    "Soft Skills": ["communication", "leadership", "teamwork", "problem solving", "critical thinking", "adaptability", "time management"],
  };

  for (const [category, skills] of Object.entries(categories)) {
    if (skills.some(s => skill.toLowerCase().includes(s))) {
      return category;
    }
  }
  return "Other";
}

function getSuggestedAction(classification: string, skill: string): string {
  switch (classification) {
    case "DEMONSTRATED":
      return `This skill is well-demonstrated. Ensure it's prominently featured in your resume summary and top skills.`;
    case "SELF_REPORTED":
      return `You've practiced this skill. Add concrete project or work examples to your resume to demonstrate it.`;
    case "MENTIONED_NOT_DEMONSTRATED":
      return `This skill is listed but lacks evidence. Add specific achievements or projects using ${skill} with quantified results.`;
    case "NOT_FOUND":
      return `This skill is required for your target role but not found in your resume. If you have experience, add it. If not, consider upskilling.`;
    case "NEEDS_ASSESSMENT":
      return `Take an assessment or practice questions on ${skill} to validate and demonstrate your proficiency.`;
    default:
      return `Review this skill's presence in your resume and add supporting evidence.`;
  }
}

export async function saveSkillGaps(gaps: typeof SkillGapSchema._type[]): Promise<void> {
  // This would be called from the API route to persist gaps
  // Implementation depends on whether we want to batch upsert
}