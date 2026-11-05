import "server-only";
import { PrismaClient } from "@prisma/client";
import { getAiClient, generateStructured } from "../samai-service";
import { mockInterviewPlanSchema, type MockInterviewPlan } from "../schemas";
import { AiServiceError } from "@/lib/ai/errors";
import { checkUsageLimit, recordUsage } from "./usage-manager";

const prisma = new PrismaClient();

export interface MockInterviewContextInput {
  userId: string;
  mode: string;
  targetRole?: string;
  careerLevel?: string;
  companyId?: string;
  resumeVersionId?: string;
  jobDescription?: string;
  durationMinutes: number;
  questionCount: number;
  topics: string[];
  skills: string[];
  codingLanguage?: string;
  difficulty: string;
  interviewStyle: string;
  feedbackMode: string;
}

export interface MockInterviewContext {
  userProfile: {
    careerStage?: string;
    targetRole?: string;
    experienceLevel?: string;
    currentRole?: string;
    yearsOfExperience?: number;
    skills: string[];
    skillsToImprove: string[];
    educationLevel?: string;
    degree?: string;
    graduationYear?: number;
    primaryProgrammingLanguage?: string;
  };
  preparationGoals: string[];
  targetRole: string;
  company: {
    id: string;
    name: string;
    industry: string;
    hiringInfo: string;
    roleCategories: string[];
    prepCategories: string[];
  } | null;
  resume: {
    extractedProfile: any;
    targetRole?: string;
  } | null;
  jobDescription: any | null;
  previousPractice: {
    weakTopics: string[];
    strongTopics: string[];
    recentSessions: number;
  };
  preparationPlan: {
    goal: string;
    recommendedTopics: string[];
    weakAreas: string[];
  } | null;
  assessmentHistory: {
    averageScore: number;
    weakCategories: string[];
    strongCategories: string[];
  };
  mode: string;
  targetRoleFinal: string;
  difficulty: string;
  interviewStyle: string;
  feedbackMode: string;
  questionCount: number;
  durationMinutes: number;
  topics: string[];
  skills: string[];
  codingLanguage?: string;
}

export async function buildMockInterviewContext(input: MockInterviewContextInput): Promise<MockInterviewContext> {
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    include: {
      profile: true,
      goals: true,
    practiceSessions: {
         where: { status: "COMPLETED" },
         orderBy: { createdAt: "desc" },
         take: 20,
        include: { questions: true, answers: { include: { evaluation: true } } },
      },
       assessmentAttempts: {
         where: { status: "COMPLETED" },
         orderBy: { submittedAt: "desc" },
         take: 20,
        include: { result: true },
      },
      preparationPlans: {
        where: { status: "ACTIVE" },
        take: 1,
        orderBy: { createdAt: "desc" },
        include: { tasks: true },
      },
      resumes: {
        where: { status: "COMPLETED" },
        take: 1,
        orderBy: { createdAt: "desc" },
        include: { versions: { take: 1, orderBy: { versionNumber: "desc" }, include: { extractedProfile: true } } },
      },
    },
  });

  if (!user) throw new Error("User not found");

  // Build user profile context
  const userProfile = {
    careerStage: user.careerStage ?? undefined,
    targetRole: user.profile?.targetRole ?? undefined,
    experienceLevel: user.profile?.experienceLevel ?? undefined,
    currentRole: user.profile?.currentRole ?? undefined,
    yearsOfExperience: user.profile?.yearsOfExperience ?? undefined,
    skills: user.profile?.skillsToImprove ?? [],
    skillsToImprove: user.profile?.skillsToImprove ?? [],
    educationLevel: user.profile?.educationLevel ?? undefined,
    degree: user.profile?.degree ?? undefined,
    graduationYear: user.profile?.graduationYear ?? undefined,
    primaryProgrammingLanguage: user.profile?.primaryProgrammingLanguage ?? undefined,
  };

  // Preparation goals
  const preparationGoals = user.goals.map(g => g.category);

  // Company context
  let company = null;
  if (input.companyId) {
    const c = await prisma.company.findUnique({
      where: { id: input.companyId, publication: "PUBLISHED" },
      select: { id: true, name: true, industry: true, hiringInfo: true, roleCategories: true, prepCategories: true },
    });
    company = c;
  }

  // Resume context
  let resume = null;
  if (input.resumeVersionId) {
    const rv = await prisma.resumeVersion.findUnique({
      where: { id: input.resumeVersionId },
      include: { extractedProfile: true },
    });
    if (rv) {
      resume = {
        extractedProfile: rv.extractedProfile?.profileJson ?? null,
        targetRole: rv.targetRole ?? undefined,
      };
    }
  }

  // Job description context
  let jobDescription = null;
  if (input.jobDescription) {
    jobDescription = input.jobDescription;
  }

  // Previous practice analysis
  const weakTopics = new Map<string, number>();
  const strongTopics = new Map<string, number>();

  for (const session of user.practiceSessions) {
    for (const answer of session.answers) {
      if (answer.evaluation) {
        const evalData = answer.evaluation as any;
        if (evalData.criteria) {
          for (const criterion of evalData.criteria) {
            const topic = session.topic || "general";
            if (criterion.score < 70) {
              weakTopics.set(topic, (weakTopics.get(topic) || 0) + 1);
            } else {
              strongTopics.set(topic, (strongTopics.get(topic) || 0) + 1);
            }
          }
        }
      }
    }
  }

  const previousPractice = {
    weakTopics: Array.from(weakTopics.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([topic]) => topic),
    strongTopics: Array.from(strongTopics.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([topic]) => topic),
    recentSessions: user.practiceSessions.length,
  };

  // Preparation plan context
  let preparationPlan = null;
  if (user.preparationPlans.length > 0) {
    const plan = user.preparationPlans[0];
    if (plan) {
      const weakAreas = plan.tasks
        .filter((t) => t.status === "TODO")
        .map((t) => t.topic)
        .filter(Boolean)
        .slice(0, 10);
      preparationPlan = {
        goal: plan.goal,
        recommendedTopics: plan.tasks.map((t) => t.topic).filter(Boolean),
        weakAreas,
      };
    }
  }

  // Assessment history
  let averageScore = 0;
  const weakCategories = new Map<string, number>();
  const strongCategories = new Map<string, number>();

  for (const attempt of user.assessmentAttempts) {
    if (attempt.result && attempt.percentage !== null) {
      averageScore += attempt.percentage;
      for (const breakdown of (attempt.result as any).breakdown || []) {
        if (breakdown.isCorrect === true) {
          strongCategories.set(breakdown.category || "general", (strongCategories.get(breakdown.category || "general") || 0) + 1);
        } else if (breakdown.isCorrect === false) {
          weakCategories.set(breakdown.category || "general", (weakCategories.get(breakdown.category || "general") || 0) + 1);
        }
      }
    }
  }

  if (user.assessmentAttempts.length > 0) {
    averageScore = averageScore / user.assessmentAttempts.length;
  }

  const assessmentHistory = {
    averageScore,
    weakCategories: Array.from(weakCategories.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([cat]) => cat),
    strongCategories: Array.from(strongCategories.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([cat]) => cat),
  };

  // Determine target role
  const targetRoleFinal = input.targetRole || user.profile?.targetRole || "Software Engineer";

  return {
    userProfile,
    preparationGoals,
    targetRole: targetRoleFinal,
    company,
    resume,
    jobDescription,
    previousPractice,
    preparationPlan,
    assessmentHistory,
    mode: input.mode,
    targetRoleFinal,
    difficulty: input.difficulty,
    interviewStyle: input.interviewStyle,
    feedbackMode: input.feedbackMode,
    questionCount: input.questionCount,
    durationMinutes: input.durationMinutes,
    topics: input.topics,
    skills: input.skills,
    codingLanguage: input.codingLanguage,
  };
}

const PLAN_GENERATION_SYSTEM = `You are an expert interview coach creating a detailed mock interview plan. Create a structured plan with topics, questions, and evaluation criteria tailored to the candidate's profile and the interview mode.`;

const PLAN_GENERATION_PROMPT = `Create a detailed mock interview plan for a \${mode} interview.

Candidate Profile:
- Target Role: \${targetRole}
- Career Level: \${careerLevel}
- Mode: \${mode}
- Difficulty: \${difficulty}
- Interview Style: \${interviewStyle}
- Duration: \${durationMinutes} minutes
- Question Count: \${questionCount}
- Feedback Mode: \${feedbackMode}
- Coding Language: \${codingLanguage || "N/A"}

Candidate Context:
- User Profile: \${JSON.stringify(userProfile, null, 2)}
- Preparation Goals: \${preparationGoals.join(", ")}
- Target Role: \${targetRole}
- Company: \${company ? JSON.stringify(company, null, 2) : "Not specified"}
- Resume: \${resume ? JSON.stringify(resume, null, 2) : "Not provided"}
- Job Description: \${jobDescription || "Not provided"}
- Previous Practice Weak Topics: \${previousPractice.weakTopics.join(", ") || "None identified"}
- Previous Practice Strong Topics: \${previousPractice.strongTopics.join(", ") || "None identified"}
- Preparation Plan: \${preparationPlan ? JSON.stringify(preparationPlan, null, 2) : "None"}
- Assessment History: Average \${assessmentHistory.averageScore.toFixed(1)}%, Weak: \${assessmentHistory.weakCategories.join(", ") || "None"}, Strong: \${assessmentHistory.strongCategories.join(", ") || "None"}
- Selected Topics: \${topics.join(", ") || "Auto-select based on role and mode"}
- Selected Skills: \${skills.join(", ") || "Auto-select based on role and mode"}
- Coding Language: \${codingLanguage || "Auto-detect"}

Requirements:
1. Create \${questionCount} primary questions distributed across \${durationMinutes} minutes
2. Include follow-up strategy with max 2 follow-ups per question
3. Define evaluation criteria per question type
4. Balance topics based on mode, role, and candidate's weak/strong areas
5. For coding questions, specify language and constraints
6. For system design, define scope and expectations
7. For behavioral, use STAR framework expectations
8. Consider company-specific questions if company provided
9. Consider resume-based questions if resume provided
10. Consider job description matching if JD provided

Return a structured plan with topics, questions, follow-up rules, and evaluation criteria.`;

export async function generateMockInterviewPlan(input: MockInterviewContextInput): Promise<MockInterviewPlan> {
  await checkUsageLimit("mock_interview_plan");

  const context = await buildMockInterviewContext(input);

  const prompt = PLAN_GENERATION_PROMPT
    .replace("${mode}", input.mode)
    .replace("${targetRole}", context.targetRole)
    .replace("${careerLevel}", input.careerLevel || "Not specified")
    .replace("${difficulty}", input.difficulty)
    .replace("${interviewStyle}", input.interviewStyle)
    .replace("${durationMinutes}", String(input.durationMinutes))
    .replace("${questionCount}", String(input.questionCount))
    .replace("${feedbackMode}", input.feedbackMode)
    .replace("${codingLanguage}", input.codingLanguage || "Not specified")
    .replace("${userProfile}", JSON.stringify(context.userProfile, null, 2))
    .replace("${preparationGoals}", context.preparationGoals.join(", "))
    .replace("${targetRole}", context.targetRole)
    .replace("${company}", context.company ? JSON.stringify(context.company, null, 2) : "Not specified")
    .replace("${resume}", context.resume ? JSON.stringify(context.resume, null, 2) : "Not provided")
    .replace("${jobDescription}", context.jobDescription || "Not provided")
    .replace("${previousPractice.weakTopics}", context.previousPractice.weakTopics.join(", ") || "None identified")
    .replace("${previousPractice.strongTopics}", context.previousPractice.strongTopics.join(", ") || "None identified")
    .replace("${preparationPlan}", context.preparationPlan ? JSON.stringify(context.preparationPlan, null, 2) : "None")
    .replace("${assessmentHistory.averageScore}", context.assessmentHistory.averageScore.toFixed(1))
    .replace("${assessmentHistory.weakCategories}", context.assessmentHistory.weakCategories.join(", ") || "None")
    .replace("${assessmentHistory.strongCategories}", context.assessmentHistory.strongCategories.join(", ") || "None")
    .replace("${topics}", context.topics.join(", ") || "Auto-select")
    .replace("${skills}", context.skills.join(", ") || "Auto-select")
    .replace("${codingLanguage}", context.codingLanguage || "Auto-detect");

  try {
    const result = await generateStructured(mockInterviewPlanSchema, {
      system: PLAN_GENERATION_SYSTEM,
      prompt,
      temperature: 0.3,
      maxTokens: 6000,
    });

    await recordUsage({
      operation: "mock_interview_plan",
      model: "unknown",
      inputTokens: result.usage?.inputTokens ?? 0,
      outputTokens: result.usage?.outputTokens ?? 0,
    });

    return result.object as MockInterviewPlan;
  } catch (e) {
    throw new AiServiceError("PROVIDER_ERROR", "Failed to generate interview plan");
  }
}