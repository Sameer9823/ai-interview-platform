import { z } from "zod";

export const ExtractedContactSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  linkedin: z.string().url().optional(),
  github: z.string().url().optional(),
  portfolio: z.string().url().optional(),
  location: z.string().optional(),
}).partial();

export const ExtractedEducationSchema = z.object({
  institution: z.string(),
  degree: z.string().optional(),
  fieldOfStudy: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  gpa: z.string().optional(),
  honors: z.array(z.string()).optional(),
  isCurrent: z.boolean().optional(),
}).partial();

export const ExtractedExperienceSchema = z.object({
  company: z.string(),
  title: z.string(),
  location: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isCurrent: z.boolean().optional(),
  description: z.string().optional(),
  achievements: z.array(z.string()).optional(),
  technologies: z.array(z.string()).optional(),
}).partial();

export const ExtractedProjectSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  technologies: z.array(z.string()).optional(),
  url: z.string().url().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  role: z.string().optional(),
}).partial();

export const ExtractedCertificationSchema = z.object({
  name: z.string(),
  issuer: z.string().optional(),
  date: z.string().optional(),
  expiryDate: z.string().optional(),
  credentialId: z.string().optional(),
  url: z.string().url().optional(),
}).partial();

export const ExtractedLanguageSchema = z.object({
  language: z.string(),
  proficiency: z.enum(["NATIVE", "FLUENT", "PROFESSIONAL", "CONVERSATIONAL", "BEGINNER"]).optional(),
}).partial();

export const ExtractedPublicationSchema = z.object({
  title: z.string(),
  venue: z.string().optional(),
  date: z.string().optional(),
  url: z.string().url().optional(),
}).partial();

export const ExtractedProfileSchema = z.object({
  name: z.string().optional(),
  contact: ExtractedContactSchema.optional(),
  summary: z.string().optional(),
  education: z.array(ExtractedEducationSchema).optional(),
  experience: z.array(ExtractedExperienceSchema).optional(),
  projects: z.array(ExtractedProjectSchema).optional(),
  technicalSkills: z.array(z.string()).optional(),
  softSkills: z.array(z.string()).optional(),
  certifications: z.array(ExtractedCertificationSchema).optional(),
  languages: z.array(ExtractedLanguageSchema).optional(),
  publications: z.array(ExtractedPublicationSchema).optional(),
  awards: z.array(z.string()).optional(),
  volunteering: z.array(z.string()).optional(),
  // Section ordering as they appear in the resume
  sectionOrder: z.array(z.string()).optional(),
  // Potential issues detected during extraction
  extractionIssues: z.array(z.string()).optional(),
});

export type ExtractedProfile = z.infer<typeof ExtractedProfileSchema>;

export const ResumeAnalysisCategorySchema = z.object({
  category: z.string(),
  score: z.number().int().min(0).max(100),
  maxScore: z.number().int().positive(),
  weight: z.number().min(0).max(1),
  findings: z.array(z.object({
    type: z.enum(["STRENGTH", "ISSUE", "SUGGESTION", "MISSING"]),
    message: z.string(),
    severity: z.enum(["HIGH", "MEDIUM", "LOW"]).optional(),
    evidence: z.string().optional(),
  })).default([]),
});

export const ResumeAnalysisSchema = z.object({
  overallScore: z.number().int().min(0).max(100),
  rubricVersion: z.string(),
  categories: z.array(ResumeAnalysisCategorySchema),
  strengths: z.array(z.string()).default([]),
  issues: z.array(z.object({
    category: z.string(),
    message: z.string(),
    severity: z.enum(["HIGH", "MEDIUM", "LOW"]),
    suggestion: z.string().optional(),
  })).default([]),
  metadata: z.object({
    analyzedAt: z.string().datetime(),
    targetRole: z.string().optional(),
    resumeVersion: z.number().int().positive(),
    wordCount: z.number().int().nonnegative(),
    pageCount: z.number().int().nonnegative().optional(),
  }).optional(),
});

export type ResumeAnalysis = z.infer<typeof ResumeAnalysisSchema>;

export const ResumeRecommendationSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  priority: z.number().int().min(1).max(5),
  category: z.string(),
  evidence: z.array(z.string()).default([]),
  expectedEffort: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  relatedSkills: z.array(z.string()).default([]),
  suggestedTasks: z.array(z.string()).default([]),
});

export type ResumeRecommendation = z.infer<typeof ResumeRecommendationSchema>;

export const ResumeRewriteSuggestionSchema = z.object({
  id: z.string(),
  section: z.string(),
  originalText: z.string(),
  suggestedText: z.string(),
  rationale: z.string(),
  assumptions: z.array(z.string()).default([]),
  isAccepted: z.boolean().default(false),
});

export type ResumeRewriteSuggestion = z.infer<typeof ResumeRewriteSuggestionSchema>;

export const JobMatchSchema = z.object({
  overallMatch: z.number().int().min(0).max(100),
  matchingSkills: z.array(z.object({
    skill: z.string(),
    resumeEvidence: z.string(),
    jdRequirement: z.string(),
    confidence: z.number().min(0).max(1),
  })).default([]),
  missingSkills: z.array(z.object({
    skill: z.string(),
    jdRequirement: z.string(),
    importance: z.enum(["REQUIRED", "PREFERRED", "NICE_TO_HAVE"]),
    suggestion: z.string().optional(),
  })).default([]),
  partialMatches: z.array(z.object({
    skill: z.string(),
    resumeEvidence: z.string(),
    jdRequirement: z.string(),
    gap: z.string(),
    confidence: z.number().min(0).max(1),
  })).default([]),
  experienceAlignment: z.object({
    score: z.number().int().min(0).max(100),
    relevantRoles: z.array(z.string()).default([]),
    gaps: z.array(z.string()).default([]),
  }).optional(),
  educationAlignment: z.object({
    score: z.number().int().min(0).max(100),
    meetsRequirements: z.boolean(),
    gaps: z.array(z.string()).default([]),
  }).optional(),
  recommendations: z.array(z.string()).default([]),
});

export type JobMatch = z.infer<typeof JobMatchSchema>;

export const SkillGapSchema = z.object({
  resumeVersionId: z.string().optional(),
  skill: z.string(),
  category: z.string(),
  targetRole: z.string().optional(),
  classification: z.enum([
    "DEMONSTRATED",
    "SELF_REPORTED",
    "MENTIONED_NOT_DEMONSTRATED",
    "NOT_FOUND",
    "NEEDS_ASSESSMENT",
  ]),
  confidence: z.number().min(0).max(1).optional(),
  resumeEvidence: z.array(z.string()).default([]),
  assessmentEvidence: z.array(z.string()).default([]),
  practiceEvidence: z.array(z.string()).default([]),
  suggestedAction: z.string().optional(),
  recommendedResources: z.array(z.object({
    title: z.string(),
    type: z.enum(["QUESTION", "TOPIC", "COURSE", "CERTIFICATION"]),
    link: z.string().optional(),
  })).default([]),
});

export type SkillGap = z.infer<typeof SkillGapSchema>;

export const JobDescriptionParsedSchema = z.object({
  title: z.string().optional(),
  company: z.string().optional(),
  location: z.string().optional(),
  employmentType: z.string().optional(),
  seniority: z.string().optional(),
  requiredSkills: z.array(z.object({
    skill: z.string(),
    category: z.string().optional(),
    importance: z.enum(["REQUIRED", "PREFERRED", "NICE_TO_HAVE"]),
    yearsExperience: z.number().optional(),
  })).default([]),
  preferredSkills: z.array(z.object({
    skill: z.string(),
    category: z.string().optional(),
  })).default([]),
  responsibilities: z.array(z.string()).default([]),
  requirements: z.array(z.string()).default([]),
  niceToHave: z.array(z.string()).default([]),
  benefits: z.array(z.string()).default([]),
  keywords: z.array(z.string()).default([]),
});

export type JobDescriptionParsed = z.infer<typeof JobDescriptionParsedSchema>;

export const ResumeQualityRubricSchema = z.object({
  version: z.string(),
  categories: z.array(z.object({
    name: z.string(),
    weight: z.number().min(0).max(1),
    maxScore: z.number().int().positive(),
    criteria: z.array(z.object({
      name: z.string(),
      description: z.string(),
      maxPoints: z.number().int().positive(),
      type: z.enum(["DETERMINISTIC", "AI_EVALUATED"]),
    })),
  })),
});

export type ResumeQualityRubric = z.infer<typeof ResumeQualityRubricSchema>;

export const DEFAULT_RUBRIC: ResumeQualityRubric = {
  version: "1.0",
  categories: [
    {
      name: "Content Completeness",
      weight: 0.25,
      maxScore: 100,
      criteria: [
        { name: "Contact Information", description: "Email, phone, LinkedIn present", maxPoints: 15, type: "DETERMINISTIC" },
        { name: "Professional Summary", description: "Clear, concise summary present", maxPoints: 15, type: "AI_EVALUATED" },
        { name: "Education Section", description: "Complete with dates, degree, institution", maxPoints: 20, type: "DETERMINISTIC" },
        { name: "Experience Section", description: "Roles with dates, company, descriptions", maxPoints: 25, type: "DETERMINISTIC" },
        { name: "Skills Section", description: "Technical and soft skills listed", maxPoints: 15, type: "DETERMINISTIC" },
        { name: "Projects/Portfolio", description: "Relevant projects with descriptions", maxPoints: 10, type: "DETERMINISTIC" },
      ],
    },
    {
      name: "Clarity & Readability",
      weight: 0.20,
      maxScore: 100,
      criteria: [
        { name: "Grammar & Spelling", description: "No obvious errors", maxPoints: 20, type: "AI_EVALUATED" },
        { name: "Sentence Structure", description: "Clear, concise sentences", maxPoints: 20, type: "AI_EVALUATED" },
        { name: "Formatting Consistency", description: "Uniform headers, bullets, spacing", maxPoints: 20, type: "DETERMINISTIC" },
        { name: "Bullet Quality", description: "Action-oriented, quantified bullets", maxPoints: 20, type: "AI_EVALUATED" },
        { name: "Section Organization", description: "Logical flow, clear hierarchy", maxPoints: 20, type: "DETERMINISTIC" },
      ],
    },
    {
      name: "Achievement Evidence",
      weight: 0.20,
      maxScore: 100,
      criteria: [
        { name: "Quantified Results", description: "Metrics, percentages, dollar amounts", maxPoints: 30, type: "AI_EVALUATED" },
        { name: "Action Verbs", description: "Strong leading verbs in bullets", maxPoints: 20, type: "AI_EVALUATED" },
        { name: "Scope & Scale", description: "Team size, budget, users, regions", maxPoints: 20, type: "AI_EVALUATED" },
        { name: "Problem-Action-Result", description: "Clear PAR structure in achievements", maxPoints: 30, type: "AI_EVALUATED" },
      ],
    },
    {
      name: "Skills Presentation",
      weight: 0.15,
      maxScore: 100,
      criteria: [
        { name: "Technical Skills Grouping", description: "Organized by category (languages, frameworks, tools)", maxPoints: 25, type: "DETERMINISTIC" },
        { name: "Proficiency Indicators", description: "Years, proficiency levels, certifications", maxPoints: 25, type: "AI_EVALUATED" },
        { name: "Relevance to Target", description: "Skills match target role requirements", maxPoints: 25, type: "AI_EVALUATED" },
        { name: "Soft Skills Integration", description: "Soft skills woven into experience", maxPoints: 25, type: "AI_EVALUATED" },
      ],
    },
    {
      name: "Target Role Relevance",
      weight: 0.20,
      maxScore: 100,
      criteria: [
        { name: "Keyword Alignment", description: "Keywords from job description present", maxPoints: 30, type: "AI_EVALUATED" },
        { name: "Experience Relevance", description: "Past roles align with target", maxPoints: 30, type: "AI_EVALUATED" },
        { name: "Project Relevance", description: "Projects demonstrate target skills", maxPoints: 20, type: "AI_EVALUATED" },
        { name: "Terminology Match", description: "Industry-specific terminology used", maxPoints: 20, type: "AI_EVALUATED" },
      ],
    },
  ],
};