import "server-only";
import { db } from "@/lib/db/client";
import { getCurrent } from "@/lib/auth/session";
import type { CareerStage } from "@/lib/permissions";
import type { Difficulty, Level, QuestionType } from "@/lib/content/types";

// Type for user profile from Prisma
interface UserProfileData {
  id: string;
  userId: string;
  targetRole: string | null;
  experienceLevel: string | null;
  educationLevel: string | null;
  degree: string | null;
  graduationYear: number | null;
  primaryProgrammingLanguage: string | null;
  currentRole: string | null;
  yearsOfExperience: number | null;
  skills: string[];
  skillsToImprove: string[];
}

interface UserPreferenceData {
  id: string;
  userId: string;
  preferredLanguage: string | null;
}

interface PreparationGoalData {
  id: string;
  userId: string;
  category: string;
}

export interface UserContext {
  userId: string;
  careerStage: CareerStage | null;
  targetRole: string | null;
  experienceLevel: Level | null;
  educationLevel: string | null;
  degree: string | null;
  graduationYear: number | null;
  primaryProgrammingLanguage: string | null;
  currentRole: string | null;
  yearsOfExperience: number | null;
  skills: string[];
  skillsToImprove: string[];
  goals: string[];
  preferredLanguage: string;
}

export interface PracticeContext {
  recentSessions: Array<{
    id: string;
    topic: string;
    difficulty: Difficulty | null;
    questionType: QuestionType | null;
    status: string;
    createdAt: Date;
  }>;
  recentAnswers: Array<{
    questionText: string;
    answerText: string;
    score: number | null;
    evaluatedAt: Date | null;
  }>;
  weakTopics: string[];
  strongTopics: string[];
}

export interface ContentContext {
  publishedQuestions: Array<{
    id: string;
    text: string;
    type: QuestionType;
    difficulty: Difficulty;
    topic: string;
    subtopic: string;
    skills: string[];
    answerOutline: string;
    explanation: string;
    exampleAnswer: string;
    codeSolution: string;
    codeLanguage: string;
    testCases: unknown[];
    hints: string[];
    estimatedMinutes: number;
    companyIds: string[];
    roles: string[];
    careerStages: CareerStage[];
    experienceLevels: Level[];
  }>;
  companies: Array<{
    id: string;
    name: string;
    industry: string;
    description: string | null;
    hiringInfo: string | null;
    roleCategories: string[];
    prepCategories: string[];
  }>;
  processes: Array<{
    id: string;
    companyId: string;
    title: string;
    roleFamily: string;
    kind: string;
    skillsEvaluated: string[];
    prepRecommendations: string;
  }>;
}

export interface FullContext {
  user: UserContext;
  practice: PracticeContext;
  content: ContentContext;
  generatedAt: Date;
}

/** Build a bounded, authorized context for the current user. */
export async function buildContext(opts: {
  topic?: string;
  difficulty?: Difficulty;
  questionType?: QuestionType;
  companyId?: string;
  limitQuestions?: number;
  limitSessions?: number;
  limitAnswers?: number;
}): Promise<FullContext> {
  const { session, record } = await getCurrent();
  if (!session || !record) {
    throw new Error("Unauthorized: no active session");
  }

  const userId = record.id;

  // Fetch user profile and preferences
  const profile = await db.userProfile.findUnique({ where: { userId } }) as UserProfileData | null;
  const preferences = await db.userPreference.findUnique({ where: { userId } }) as UserPreferenceData | null;
  const goals = await db.preparationGoal.findMany({ where: { userId } }) as PreparationGoalData[];

  const userContext: UserContext = {
    userId,
    careerStage: record.careerStage,
    targetRole: profile?.targetRole ?? null,
    experienceLevel: profile?.experienceLevel as Level | null,
    educationLevel: profile?.educationLevel ?? null,
    degree: profile?.degree ?? null,
    graduationYear: profile?.graduationYear ?? null,
    primaryProgrammingLanguage: profile?.primaryProgrammingLanguage ?? null,
    currentRole: profile?.currentRole ?? null,
    yearsOfExperience: profile?.yearsOfExperience ?? null,
    skills: profile?.skills ?? [],
    skillsToImprove: profile?.skillsToImprove ?? [],
    goals: goals.map((g) => g.category),
    preferredLanguage: preferences?.preferredLanguage ?? "en",
  };

  // Fetch recent practice sessions
  const sessions = await db.practiceSession.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: opts.limitSessions ?? 5,
    select: {
      id: true,
      topic: true,
      difficulty: true,
      questionType: true,
      status: true,
      createdAt: true,
    },
  });

  // Fetch recent answers with evaluations
  const answers = await db.userPracticeAnswer.findMany({
    where: { session: { userId } },
    orderBy: { submittedAt: "desc" },
    take: opts.limitAnswers ?? 10,
    select: {
      answerText: true,
      submittedAt: true,
      evaluation: {
        select: { score: true, createdAt: true },
      },
      session: {
        select: { topic: true },
      },
    },
  });

  const recentAnswers = answers.map((a) => ({
    questionText: a.session.topic,
    answerText: a.answerText,
    score: a.evaluation?.score ?? null,
    evaluatedAt: a.evaluation?.createdAt ?? null,
  }));

  // Analyze weak/strong topics from evaluations
  const topicScores: Record<string, { total: number; count: number }> = {};
  for (const a of answers) {
    if (a.evaluation?.score != null) {
      const topic = a.session.topic;
      if (!topicScores[topic]) topicScores[topic] = { total: 0, count: 0 };
      topicScores[topic].total += a.evaluation.score;
      topicScores[topic].count += 1;
    }
  }

  const weakTopics: string[] = [];
  const strongTopics: string[] = [];
  for (const [topic, data] of Object.entries(topicScores)) {
    const avg = data.total / data.count;
    if (avg < 60) weakTopics.push(topic);
    else if (avg >= 80) strongTopics.push(topic);
  }

  const practiceContext: PracticeContext = {
    recentSessions: sessions.map((s) => ({
      id: s.id,
      topic: s.topic,
      difficulty: s.difficulty as Difficulty | null,
      questionType: s.questionType as QuestionType | null,
      status: s.status,
      createdAt: s.createdAt,
    })),
    recentAnswers,
    weakTopics,
    strongTopics,
  };

  // Fetch published questions for context
  const questions = await db.question.findMany({
    where: { publication: "PUBLISHED" },
    take: opts.limitQuestions ?? 20,
    orderBy: { publishedAt: "desc" },
    select: {
      id: true,
      text: true,
      type: true,
      difficulty: true,
      categoryId: true,
      skills: true,
      answerOutline: true,
      explanation: true,
      exampleAnswer: true,
      codeSolution: true,
      codeLanguage: true,
      testCases: true,
      hints: true,
      estimatedMinutes: true,
      roles: true,
      careerStages: true,
      experienceLevels: true,
    },
  });

  const categoryIds = [...new Set(questions.map((q) => q.categoryId))];
  const categories = await db.category.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true, name: true },
  });
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  const publishedQuestions = questions.map((q) => ({
    ...q,
    topic: categoryMap.get(q.categoryId) ?? q.categoryId,
    subtopic: "",
    companyIds: [],
    testCases: (q.testCases as unknown[]) ?? [],
  }));

  // Fetch companies and processes
  const companies = await db.company.findMany({
    where: { publication: "PUBLISHED" },
    take: 10,
    select: { id: true, name: true, industry: true, description: true, hiringInfo: true, roleCategories: true, prepCategories: true },
  });

  const processes = await db.interviewProcess.findMany({
    where: { publication: "PUBLISHED" },
    take: 10,
    select: {
      id: true,
      companyId: true,
      title: true,
      roleFamily: true,
      kind: true,
      skillsEvaluated: true,
      prepRecommendations: true,
    },
  });

  return {
    user: userContext,
    practice: practiceContext,
    content: {
      publishedQuestions,
      companies,
      processes,
    },
    generatedAt: new Date(),
  };
}

/** Build context specifically for question generation. */
export async function buildGenerationContext(input: {
  topic: string;
  difficulty: Difficulty;
  questionType: QuestionType;
  count: number;
  careerStage?: CareerStage;
  targetRole?: string;
  companyId?: string;
  skills?: string[];
}): Promise<{
  user: UserContext;
  relevantQuestions: Array<{
    id: string;
    text: string;
    type: QuestionType;
    difficulty: Difficulty;
    topic: string;
    subtopic: string;
    skills: string[];
    answerOutline: string;
    explanation: string;
    exampleAnswer: string;
    codeSolution: string;
    codeLanguage: string;
    testCases: unknown[];
    hints: string[];
    estimatedMinutes: number;
    companyIds: string[];
    roles: string[];
    careerStages: CareerStage[];
    experienceLevels: Level[];
  }>;
  company: FullContext["content"]["companies"][0] | undefined;
  processes: FullContext["content"]["processes"] | undefined;
}> {
  const { session, record } = await getCurrent();
  if (!session || !record) throw new Error("Unauthorized");

  const profile = await db.userProfile.findUnique({ where: { userId: record.id } }) as UserProfileData | null;
  const goals = await db.preparationGoal.findMany({ where: { userId: record.id } }) as PreparationGoalData[];

  const userContext: UserContext = {
    userId: record.id,
    careerStage: record.careerStage,
    targetRole: profile?.targetRole ?? null,
    experienceLevel: profile?.experienceLevel as Level | null,
    educationLevel: profile?.educationLevel ?? null,
    degree: profile?.degree ?? null,
    graduationYear: profile?.graduationYear ?? null,
    primaryProgrammingLanguage: profile?.primaryProgrammingLanguage ?? null,
    currentRole: profile?.currentRole ?? null,
    yearsOfExperience: profile?.yearsOfExperience ?? null,
    skills: profile?.skills ?? [],
    skillsToImprove: profile?.skillsToImprove ?? [],
    goals: goals.map((g) => g.category),
    preferredLanguage: "en",
  };

  const questionWhere: Record<string, unknown> = {
    publication: "PUBLISHED",
    topic: { contains: input.topic, mode: "insensitive" },
  };
  if (input.difficulty) questionWhere.difficulty = input.difficulty;
  if (input.questionType) questionWhere.type = input.questionType;
  if (input.companyId) questionWhere.companies = { some: { companyId: input.companyId } };
  if (input.careerStage) questionWhere.careerStages = { has: input.careerStage };
  else if (record.careerStage) questionWhere.careerStages = { has: record.careerStage };

  const relevantQuestions = await db.question.findMany({
    where: questionWhere,
    take: 10,
    orderBy: { publishedAt: "desc" },
    select: {
      id: true,
      text: true,
      type: true,
      difficulty: true,
      categoryId: true,
      skills: true,
      answerOutline: true,
      explanation: true,
      exampleAnswer: true,
      codeSolution: true,
      codeLanguage: true,
      testCases: true,
      hints: true,
      estimatedMinutes: true,
      roles: true,
      careerStages: true,
      experienceLevels: true,
    },
  });

  const categoryIds = [...new Set(relevantQuestions.map((q) => q.categoryId))];
  const categories = await db.category.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true, name: true },
  });
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  let company: FullContext["content"]["companies"][0] | undefined;
  let processes: FullContext["content"]["processes"] | undefined;

  if (input.companyId) {
    company = (await db.company.findUnique({
      where: { id: input.companyId, publication: "PUBLISHED" },
      select: { id: true, name: true, industry: true, description: true, hiringInfo: true, roleCategories: true, prepCategories: true },
    })) ?? undefined;
    processes = await db.interviewProcess.findMany({
      where: { companyId: input.companyId, publication: "PUBLISHED" },
      select: {
        id: true,
        companyId: true,
        title: true,
        roleFamily: true,
        kind: true,
        skillsEvaluated: true,
        prepRecommendations: true,
      },
    });
  }

  return {
    user: userContext,
    relevantQuestions: relevantQuestions.map((q) => ({
      ...q,
      topic: categoryMap.get(q.categoryId) ?? q.categoryId,
      subtopic: "",
      companyIds: [],
      testCases: (q.testCases as unknown[]) ?? [],
    })),
    company: company ?? undefined,
    processes,
  };
}
