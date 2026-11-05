import { z } from "zod";

export const generatedQuestionSchema = z.object({
  text: z.string().min(1),
  type: z.string(),
  difficulty: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
  topic: z.string(),
  subtopic: z.string().default(""),
  skills: z.array(z.string()).default([]),
  estimatedMinutes: z.number().int().min(1).max(60).default(5),
  hints: z.array(z.string()).default([]),
  answerOutline: z.string().default(""),
  explanation: z.string().default(""),
  exampleAnswer: z.string().default(""),
  codeSolution: z.string().default(""),
  codeLanguage: z.string().default(""),
  testCases: z.array(z.unknown()).default([]),
  rubric: z.array(z.string()).default([]),
  sourceReferences: z.array(z.string()).default([]),
});

export const evaluationSchema = z.object({
  score: z.number().int().min(0).max(100),
  band: z.string(),
  criteria: z.array(z.object({ name: z.string(), score: z.number().min(0).max(100), comment: z.string() })).default([]),
  strengths: z.array(z.string()).default([]),
  missing: z.array(z.string()).default([]),
  incorrect: z.array(z.string()).default([]),
  improvements: z.array(z.string()).default([]),
  modelAnswer: z.string().default(""),
  nextSteps: z.array(z.string()).default([]),
  confidence: z.number().min(0).max(1).optional(),
});

export const planSchema = z.object({
  goal: z.string(),
  recommendedTopics: z.array(z.string()).default([]),
  steps: z.array(z.object({ title: z.string(), description: z.string().default(""), estimatedMinutes: z.number().int().min(1).default(15) })).default([]),
  milestones: z.array(z.string()).default([]),
  completionCriteria: z.array(z.string()).default([]),
  rationale: z.string().default(""),
});

// ============================================================================
// Phase 6: Mock Interview Schemas
// ============================================================================

export const mockInterviewModeSchema = z.enum([
  "HR_BEHAVIORAL",
  "TECHNICAL",
  "CODING",
  "SYSTEM_DESIGN",
  "COMPANY_SPECIFIC",
  "RESUME_BASED",
  "JOB_DESCRIPTION_BASED",
  "MIXED",
  "CUSTOM",
]);

export const mockInterviewDifficultySchema = z.enum(["EASY", "MEDIUM", "HARD", "ADAPTIVE"]);
export const mockInterviewFeedbackModeSchema = z.enum(["AFTER_EACH", "AT_END"]);
export const mockInterviewStyleSchema = z.enum(["SUPPORTIVE", "STANDARD", "CHALLENGING"]);

export const mockInterviewConfigSchema = z.object({
  mode: mockInterviewModeSchema,
  targetRole: z.string().min(1).max(100).optional(),
  careerLevel: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).optional(),
  companyId: z.string().optional(),
  resumeVersionId: z.string().optional(),
  jobDescription: z.string().max(10000).optional(),
  durationMinutes: z.number().int().min(15).max(90).default(30),
  questionCount: z.number().int().min(3).max(20).default(10),
  topics: z.array(z.string()).max(10).default([]),
  skills: z.array(z.string()).max(15).default([]),
  codingLanguage: z.string().optional(),
  feedbackMode: z.enum(["AFTER_EACH", "AT_END"]).default("AT_END"),
  interviewStyle: z.enum(["SUPPORTIVE", "STANDARD", "CHALLENGING"]).default("STANDARD"),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD", "ADAPTIVE"]).default("MEDIUM"),
});

export type MockInterviewConfig = z.infer<typeof mockInterviewConfigSchema>;

export const mockInterviewQuestionSchema = z.object({
  sequenceNumber: z.number().int().positive(),
  turnType: z.enum(["QUESTION", "FOLLOW_UP", "HINT", "CLARIFICATION", "END"]).default("QUESTION"),
  questionType: z.string(),
  questionText: z.string(),
  topicTags: z.array(z.string()).default([]),
  difficulty: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
  sourceType: z.enum(["OFFICIAL", "CANDIDATE_REPORTED", "COMMUNITY_REPORTED", "ADMIN_CURATED", "PLATFORM_ORIGINAL", "AI_GENERATED"]),
  sourceReference: z.string().optional(),
  evaluationRubric: z.array(z.object({
    name: z.string(),
    description: z.string(),
    weight: z.number().min(0).max(1),
  })).min(1).max(10),
  expectedAnswerMetadata: z.record(z.unknown()).optional(),
});

export type MockInterviewQuestion = z.infer<typeof mockInterviewQuestionSchema>;

export const mockInterviewEvaluationSchema = z.object({
  rubricVersion: z.string(),
  dimensionScores: z.array(z.object({
    name: z.string(),
    score: z.number().int().min(0).max(100),
    weight: z.number().min(0).max(1),
    evidence: z.string().optional(),
  })).min(1).max(15),
  overallScore: z.number().int().min(0).max(100).optional(),
  strengths: z.array(z.string()).default([]),
  improvements: z.array(z.string()).default([]),
  missingConcepts: z.array(z.string()).default([]),
  evidence: z.array(z.string()).default([]),
  confidenceStatus: z.enum(["HIGH", "MEDIUM", "LOW"]).optional(),
  evaluationStatus: z.enum(["COMPLETED", "PENDING_REVIEW", "FAILED"]).default("COMPLETED"),
});

export type MockInterviewEvaluation = z.infer<typeof mockInterviewEvaluationSchema>;

export const mockInterviewReportSchema = z.object({
  reportVersion: z.number().int().positive().default(1),
  overallScore: z.number().int().min(0).max(100).optional(),
  skillBreakdown: z.array(z.object({
    skill: z.string(),
    category: z.string(),
    score: z.number().int().min(0).max(100),
    evidence: z.array(z.string()).default([]),
  })).default([]),
  summary: z.string(),
  recommendations: z.array(z.object({
    title: z.string(),
    description: z.string(),
    priority: z.number().int().min(1).max(5),
    category: z.string(),
    relatedSkills: z.array(z.string()).default([]),
  })).default([]),
  evaluationCoverage: z.object({
    questionsEvaluated: z.number().int().min(0),
    questionsTotal: z.number().int().min(0),
    dimensionsEvaluated: z.number().int().min(0),
  }),
  limitations: z.string().optional(),
});

export type MockInterviewReport = z.infer<typeof mockInterviewReportSchema>;

export const mockInterviewPlanSchema = z.object({
  mode: z.string(),
  targetRole: z.string().optional(),
  difficulty: z.string(),
  questionCount: z.number().int().positive(),
  estimatedDurationMinutes: z.number().int().positive(),
  topics: z.array(z.object({
    topic: z.string(),
    sequence: z.number().int().positive(),
    estimatedMinutes: z.number().int().positive(),
    questionTypes: z.array(z.string()),
    skills: z.array(z.string()),
    initialQuestions: z.array(z.object({
      questionText: z.string(),
      type: z.string(),
      difficulty: z.string(),
      topicTags: z.array(z.string()),
      expectedFocus: z.string(),
    })).min(1),
    followUpStrategy: z.string(),
  })).default([]),
  followUpRules: z.object({
    maxFollowUpsPerQuestion: z.number().int().min(0).max(3).default(2),
    triggerConditions: z.array(z.string()).default(["vague", "incomplete", "incorrect", "needs_clarification"]),
    maxTotalFollowUps: z.number().int().min(0).max(10).default(5),
  }),
  evaluationCriteria: z.array(z.object({
    questionType: z.string(),
    criteria: z.array(z.object({
      name: z.string(),
      description: z.string(),
      weight: z.number().min(0).max(1),
    })),
  })).default([]),
});

export type MockInterviewPlan = z.infer<typeof mockInterviewPlanSchema>;

// ============================================================================
// Phase 11: Job Description Analysis Schema
// ============================================================================

export const jobDescriptionAnalysisSchema = z.object({
  requiredSkills: z.array(z.string()).default([]),
  preferredSkills: z.array(z.string()).default([]),
  experienceRequirements: z.string().optional(),
  educationRequirements: z.string().optional(),
  responsibilities: z.array(z.string()).default([]),
  technicalKeywords: z.array(z.string()).default([]),
  roleExpectations: z.array(z.string()).default([]),
  interviewTopics: z.array(z.string()).default([]),
  overallMatch: z.number().int().min(0).max(100).optional(),
  matchingSkills: z.array(z.string()).default([]),
  missingEvidence: z.array(z.string()).default([]),
  unverifiedSkills: z.array(z.string()).default([]),
  experienceAlignment: z.string().optional(),
  resumeImprovements: z.string().optional(),
  preparationRecommendations: z.string().optional(),
});

export type JobDescriptionAnalysis = z.infer<typeof jobDescriptionAnalysisSchema>;
