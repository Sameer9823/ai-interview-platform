-- CreateEnum
CREATE TYPE "CareerStage" AS ENUM ('STUDENT', 'FRESHER', 'PROFESSIONAL');

-- CreateEnum
CREATE TYPE "PlatformRole" AS ENUM ('NONE', 'ADMIN');

-- CreateEnum
CREATE TYPE "ExperienceLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "EducationLevel" AS ENUM ('HIGH_SCHOOL', 'DIPLOMA', 'BACHELORS', 'MASTERS', 'DOCTORATE', 'OTHER');

-- CreateEnum
CREATE TYPE "GoalCategory" AS ENUM ('TECHNICAL_INTERVIEWS', 'APTITUDE_REASONING', 'CODING_DSA', 'BEHAVIORAL_HR', 'SYSTEM_DESIGN', 'COMMUNICATION', 'CAREER_TRANSITION');

-- CreateEnum
CREATE TYPE "ThemePreference" AS ENUM ('SYSTEM', 'LIGHT', 'DARK');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('ACCOUNT_CREATED', 'SIGNED_IN', 'ONBOARDING_COMPLETED', 'PROFILE_UPDATED', 'GOALS_UPDATED', 'PREFERENCES_UPDATED', 'SECURITY_SETTINGS_CHANGED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('SYSTEM', 'ACCOUNT', 'PROFILE', 'SECURITY');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('SIGN_UP', 'SIGN_IN', 'SIGN_IN_FAILED', 'SIGN_OUT', 'EMAIL_VERIFICATION_SENT', 'PASSWORD_RESET_REQUESTED', 'PASSWORD_RESET_COMPLETED', 'PASSWORD_CHANGED', 'ACCOUNT_DELETION_REQUESTED', 'ACCOUNT_DELETION_CONFIRMED', 'PERMISSION_DENIED', 'ROLE_CHANGED');

-- CreateEnum
CREATE TYPE "Publication" AS ENUM ('DRAFT', 'IN_REVIEW', 'PUBLISHED', 'UNPUBLISHED', 'ARCHIVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "Verification" AS ENUM ('NOT_VERIFIED', 'VERIFIED', 'OUTDATED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ContentOrigin" AS ENUM ('OFFICIAL', 'CANDIDATE_REPORTED', 'COMMUNITY_REPORTED', 'ADMIN_CURATED', 'PLATFORM_ORIGINAL', 'AI_GENERATED');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('OFFICIAL_CAREERS', 'OFFICIAL_DOCS', 'PUBLIC_EXPERIENCE', 'EDUCATIONAL', 'OPEN_DATASET', 'GITHUB_REPO', 'MANUAL_CURATION', 'PLATFORM_ORIGINAL', 'USER_SUBMITTED');

-- CreateEnum
CREATE TYPE "UsePermission" AS ENUM ('APPROVED', 'ATTRIBUTION_REQUIRED', 'LINK_ONLY', 'MANUAL_REVIEW_REQUIRED', 'NOT_APPROVED', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "Reliability" AS ENUM ('HIGH', 'MEDIUM', 'LOW', 'UNRATED');

-- CreateEnum
CREATE TYPE "SourceReview" AS ENUM ('UNREVIEWED', 'REVIEWED', 'REJECTED');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('MULTIPLE_CHOICE', 'SINGLE_ANSWER', 'SHORT_ANSWER', 'LONG_ANSWER', 'CODING', 'SQL', 'SCENARIO', 'BEHAVIORAL', 'SYSTEM_DESIGN', 'COMMUNICATION');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "RoundKind" AS ENUM ('ONLINE_ASSESSMENT', 'APTITUDE', 'CODING', 'TECHNICAL', 'SYSTEM_DESIGN', 'MANAGERIAL', 'HR_BEHAVIORAL', 'CASE_STUDY', 'OTHER');

-- CreateEnum
CREATE TYPE "ImportKind" AS ENUM ('QUESTIONS', 'COMPANIES');

-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('PREVIEWED', 'COMMITTED', 'FAILED', 'BLOCKED', 'ALREADY_IMPORTED');

-- CreateEnum
CREATE TYPE "StagedStatus" AS ENUM ('VALID', 'INVALID', 'DUPLICATE', 'SKIPPED');

-- CreateEnum
CREATE TYPE "PracticeStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "PlanStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PlanTaskStatus" AS ENUM ('TODO', 'DONE');

-- CreateEnum
CREATE TYPE "AssessmentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AssessmentType" AS ENUM ('APTITUDE', 'TECHNICAL', 'CODING', 'READINESS', 'CUSTOM');

-- CreateEnum
CREATE TYPE "AttemptStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'EXPIRED', 'EVALUATING', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ResumeStatus" AS ENUM ('UPLOADED', 'QUEUED', 'EXTRACTING', 'READY_FOR_ANALYSIS', 'ANALYZING', 'COMPLETED', 'FAILED', 'DELETED');

-- CreateEnum
CREATE TYPE "ResumeAnalysisStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "JobDescriptionSource" AS ENUM ('PASTED', 'URL');

-- CreateEnum
CREATE TYPE "RecommendationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'IMPLEMENTED');

-- CreateEnum
CREATE TYPE "MockInterviewMode" AS ENUM ('HR_BEHAVIORAL', 'TECHNICAL', 'CODING', 'SYSTEM_DESIGN', 'COMPANY_SPECIFIC', 'RESUME_BASED', 'JOB_DESCRIPTION_BASED', 'MIXED', 'CUSTOM');

-- CreateEnum
CREATE TYPE "MockInterviewStatus" AS ENUM ('DRAFT', 'READY', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "MockInterviewDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD', 'ADAPTIVE');

-- CreateEnum
CREATE TYPE "MockInterviewFeedbackMode" AS ENUM ('AFTER_EACH', 'AT_END');

-- CreateEnum
CREATE TYPE "MockInterviewStyle" AS ENUM ('SUPPORTIVE', 'STANDARD', 'CHALLENGING');

-- CreateEnum
CREATE TYPE "MockInterviewTurnType" AS ENUM ('QUESTION', 'FOLLOW_UP', 'HINT', 'CLARIFICATION', 'END');

-- CreateEnum
CREATE TYPE "VoiceProvider" AS ENUM ('OPENAI', 'ELEVENLABS', 'DEEPGRAM', 'ASSEMBLYAI', 'BROWSER_NATIVE', 'AZURE', 'GOOGLE_CLOUD');

-- CreateEnum
CREATE TYPE "TranscriptionProvider" AS ENUM ('OPENAI_WHISPER', 'DEEPGRAM', 'ASSEMBLYAI', 'BROWSER_NATIVE', 'GOOGLE_CLOUD', 'AZURE');

-- CreateEnum
CREATE TYPE "VoiceMode" AS ENUM ('TEXT_ONLY', 'VOICE_ONLY', 'HYBRID');

-- CreateEnum
CREATE TYPE "VoiceSessionStatus" AS ENUM ('IDLE', 'PERMISSION_PENDING', 'READY', 'LISTENING', 'TRANSCRIBING', 'REVIEWING', 'SUBMITTING', 'WAITING_FOR_INTERVIEWER', 'PLAYING_INTERVIEWER_AUDIO', 'PAUSED', 'ERROR', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "VoiceCaptureStatus" AS ENUM ('PENDING', 'RECORDING', 'UPLOADING', 'PROCESSING', 'TRANSCRIBING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PostVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "ReportReason" AS ENUM ('SPAM', 'HARASSMENT', 'HATE_OR_ABUSE', 'MISINFORMATION', 'COPYRIGHT', 'SCAM', 'INAPPROPRIATE', 'OTHER');

-- CreateEnum
CREATE TYPE "GroupVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "GroupRole" AS ENUM ('OWNER', 'ADMIN', 'MODERATOR', 'MEMBER');

-- CreateEnum
CREATE TYPE "JoinRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "GroupChallengeStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CareerGoalStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "RoadmapStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "RoadmapTaskStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'SKIPPED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RoadmapTaskType" AS ENUM ('READ_RESOURCE', 'WATCH_VIDEO', 'STUDY_CONCEPT', 'COMPLETE_PRACTICE_QUESTIONS', 'COMPLETE_CODING_EXERCISE', 'COMPLETE_ASSESSMENT', 'PRACTICE_BEHAVIORAL_ANSWERS', 'COMPLETE_MOCK_INTERVIEW', 'REVIEW_RESUME_RECOMMENDATION', 'REVISE_WEAK_TOPICS', 'COMPLETE_MILESTONE_REVIEW');

-- CreateEnum
CREATE TYPE "SkillEvidenceType" AS ENUM ('RESUME_ANALYSIS', 'USER_CONFIRMED', 'PRACTICE_EVALUATION', 'ASSESSMENT_RESULT', 'CODING_EVALUATION', 'MOCK_INTERVIEW', 'BEHAVIORAL_INTERVIEW', 'SELF_REPORTED', 'MENTIONED_NOT_DEMONSTRATED', 'NOT_FOUND', 'NEEDS_ASSESSMENT');

-- CreateEnum
CREATE TYPE "SkillEvidenceClassification" AS ENUM ('DEMONSTRATED', 'SELF_REPORTED', 'MENTIONED_NOT_DEMONSTRATED', 'NOT_FOUND', 'NEEDS_ASSESSMENT');

-- CreateEnum
CREATE TYPE "RoadmapRecommendationType" AS ENUM ('PRACTICE_SKILL', 'REVISE_TOPIC', 'COMPLETE_TASK', 'TAKE_ASSESSMENT', 'TAKE_MOCK_INTERVIEW', 'REVISE_RESUME', 'UPDATE_GOALS', 'CHANGE_PRIORITIES');

-- CreateEnum
CREATE TYPE "LearningResourceType" AS ENUM ('QUESTION_BANK', 'COMPANY_PREP', 'ASSESSMENT', 'CODING_EXERCISE', 'MOCK_INTERVIEW', 'RESUME_RECOMMENDATION', 'OFFICIAL_DOCUMENTATION', 'EDUCATIONAL_ARTICLE', 'TUTORIAL', 'VIDEO_RESOURCE', 'PRACTICE_DATASET', 'LEARNING_GUIDE');

-- CreateEnum
CREATE TYPE "ResourceAccessType" AS ENUM ('FREE', 'PAID', 'SUBSCRIPTION', 'PARTIAL', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "ResourceVerificationStatus" AS ENUM ('VERIFIED', 'PENDING', 'UNVERIFIED', 'UNVERIFIABLE');

-- CreateEnum
CREATE TYPE "RoadmapRecommendationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DISMISSED', 'IMPLEMENTED');

-- CreateEnum
CREATE TYPE "SkillGapPriority" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'OPTIONAL');

-- CreateEnum
CREATE TYPE "XPActivityType" AS ENUM ('PRACTICE_SESSION_COMPLETED', 'ASSESSMENT_COMPLETED', 'MOCK_INTERVIEW_COMPLETED', 'ROADMAP_TASK_COMPLETED', 'ROADMAP_MILESTONE_COMPLETED', 'WEEKLY_CHALLENGE_COMPLETED', 'WEAK_TOPIC_REVIEWED', 'RESUME_ANALYSIS_COMPLETED', 'JOB_MATCH_COMPLETED', 'WEEKLY_GOAL_ACHIEVED', 'STREAK_MILESTONE_REACHED', 'PERSONAL_BEST_SET');

-- CreateEnum
CREATE TYPE "AchievementCategory" AS ENUM ('GETTING_STARTED', 'CONSISTENCY', 'PRACTICE', 'TECHNICAL_SKILLS', 'ASSESSMENTS', 'MOCK_INTERVIEWS', 'ROADMAP_COMPLETION', 'IMPROVEMENT', 'TOPIC_MASTERY', 'PERSONAL_MILESTONES');

-- CreateEnum
CREATE TYPE "AchievementStatus" AS ENUM ('LOCKED', 'IN_PROGRESS', 'UNLOCKED', 'CLAIMED');

-- CreateEnum
CREATE TYPE "ChallengeType" AS ENUM ('DAILY', 'WEEKLY', 'PERSONAL', 'COMMUNITY');

-- CreateEnum
CREATE TYPE "ChallengeStatus" AS ENUM ('AVAILABLE', 'ACTIVE', 'COMPLETED', 'DISMISSED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "XPTransactionType" AS ENUM ('EARNED', 'SPENT', 'ADJUSTED', 'REVERSED');

-- CreateEnum
CREATE TYPE "LeaderboardScope" AS ENUM ('FRIENDS', 'WEEKLY_ACTIVITY', 'CHALLENGE_COMPLETION', 'COMMUNITY_PRACTICE');

-- CreateEnum
CREATE TYPE "GamificationEventType" AS ENUM ('LEVEL_UP', 'ACHIEVEMENT_UNLOCKED', 'CHALLENGE_COMPLETED', 'WEEKLY_GOAL_ACHIEVED', 'ROADMAP_MILESTONE_COMPLETED', 'PERSONAL_BEST_SET', 'STREAK_MILESTONE_REACHED');

-- CreateEnum
CREATE TYPE "OpportunityType" AS ENUM ('FULL_TIME', 'PART_TIME', 'INTERNSHIP', 'GRADUATE_TRAINEE', 'APPRENTICESHIP', 'CONTRACT', 'REMOTE', 'ENTRY_LEVEL');

-- CreateEnum
CREATE TYPE "OpportunityStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'FILLED', 'ARCHIVED', 'DRAFT');

-- CreateEnum
CREATE TYPE "WorkArrangement" AS ENUM ('ONSITE', 'HYBRID', 'REMOTE', 'FLEXIBLE');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('INTERESTED', 'PREPARING', 'APPLIED', 'ASSESSMENT', 'INTERVIEW_SCHEDULED', 'INTERVIEW_COMPLETED', 'OFFER_RECEIVED', 'REJECTED', 'WITHDRAWN', 'NO_RESPONSE');

-- CreateEnum
CREATE TYPE "MatchScoreDimension" AS ENUM ('REQUIRED_SKILLS', 'PREFERRED_SKILLS', 'EXPERIENCE', 'ROLE_RELEVANCE', 'LOCATION', 'EDUCATION');

-- CreateEnum
CREATE TYPE "RecommendationCategory" AS ENUM ('STRONG_SKILL_MATCH', 'ENTRY_LEVEL_RELEVANT', 'INTERNSHIP_OPPORTUNITY', 'SKILLS_DEVELOPMENT', 'CAREER_TRANSITION', 'LOCATION_BASED');

-- CreateEnum
CREATE TYPE "JobSearchNotificationType" AS ENUM ('NEW_MATCH', 'APPLICATION_DEADLINE', 'FOLLOW_UP_REMINDER', 'STATUS_CHANGE', 'INTERVIEW_SCHEDULED', 'ASSESSMENT_DEADLINE', 'RECOMMENDATION_READY');

-- CreateEnum
CREATE TYPE "OpportunitySourceType" AS ENUM ('COMPANY_CAREERS', 'OFFICIAL_JOB_BOARD', 'AUTHORIZED_API', 'LICENSED_PROVIDER', 'PUBLIC_FEED', 'MANUAL_CURATION');

-- CreateEnum
CREATE TYPE "OpportunitySourcePermission" AS ENUM ('APPROVED', 'ATTRIBUTION_REQUIRED', 'LINK_ONLY', 'MANUAL_REVIEW', 'NOT_APPROVED', 'UNKNOWN');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "passwordHash" TEXT,
    "name" TEXT NOT NULL,
    "careerStage" "CareerStage",
    "platformRole" "PlatformRole" NOT NULL DEFAULT 'NONE',
    "onboardingCompletedAt" TIMESTAMP(3),
    "tokenVersion" INTEGER NOT NULL DEFAULT 0,
    "deletionRequestedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "careerDomain" TEXT,
    "targetRole" TEXT,
    "preferredLanguage" TEXT NOT NULL DEFAULT 'en',
    "experienceLevel" "ExperienceLevel",
    "educationLevel" "EducationLevel",
    "degree" TEXT,
    "graduationYear" INTEGER,
    "primaryProgrammingLanguage" TEXT,
    "currentRole" TEXT,
    "yearsOfExperience" INTEGER,
    "skillsToImprove" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreparationGoal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" "GoalCategory" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PreparationGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "theme" "ThemePreference" NOT NULL DEFAULT 'SYSTEM',
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "productUpdates" BOOLEAN NOT NULL DEFAULT false,
    "timezone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailVerificationToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailVerificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" "AuditAction" NOT NULL,
    "ipHash" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Source" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "type" "SourceType" NOT NULL,
    "publisher" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "licenseNotes" TEXT NOT NULL DEFAULT '',
    "attribution" TEXT NOT NULL DEFAULT '',
    "permission" "UsePermission" NOT NULL DEFAULT 'UNKNOWN',
    "commercialUse" "UsePermission" NOT NULL DEFAULT 'UNKNOWN',
    "redistribution" "UsePermission" NOT NULL DEFAULT 'UNKNOWN',
    "accessMethod" TEXT NOT NULL DEFAULT '',
    "lastCheckedAt" TIMESTAMP(3),
    "lastImportAt" TIMESTAMP(3),
    "reliability" "Reliability" NOT NULL DEFAULT 'UNRATED',
    "reviewStatus" "SourceReview" NOT NULL DEFAULT 'UNREVIEWED',
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentSource" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "companyId" TEXT,
    "processId" TEXT,
    "questionId" TEXT,
    "experienceId" TEXT,

    CONSTRAINT "ContentSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" TEXT,
    "description" TEXT NOT NULL DEFAULT '',
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT NOT NULL,
    "careersUrl" TEXT NOT NULL,
    "logoUrl" TEXT NOT NULL DEFAULT '',
    "industry" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "headquarters" TEXT NOT NULL DEFAULT '',
    "hiringInfo" TEXT NOT NULL DEFAULT '',
    "roleCategories" TEXT[],
    "prepCategories" TEXT[],
    "origin" "ContentOrigin" NOT NULL,
    "verification" "Verification" NOT NULL DEFAULT 'NOT_VERIFIED',
    "publication" "Publication" NOT NULL DEFAULT 'DRAFT',
    "lastVerifiedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "moderatorNotes" TEXT NOT NULL DEFAULT '',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewProcess" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "roleFamily" TEXT NOT NULL DEFAULT '',
    "experienceLevels" "ExperienceLevel"[],
    "careerStages" "CareerStage"[],
    "sequence" INTEGER,
    "kind" "RoundKind" NOT NULL,
    "description" TEXT NOT NULL,
    "skillsEvaluated" TEXT[],
    "prepRecommendations" TEXT NOT NULL DEFAULT '',
    "origin" "ContentOrigin" NOT NULL,
    "verification" "Verification" NOT NULL DEFAULT 'NOT_VERIFIED',
    "publication" "Publication" NOT NULL DEFAULT 'DRAFT',
    "lastReviewedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "moderatorNotes" TEXT NOT NULL DEFAULT '',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InterviewProcess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "type" "QuestionType" NOT NULL,
    "difficulty" "Difficulty" NOT NULL,
    "roles" TEXT[],
    "careerStages" "CareerStage"[],
    "experienceLevels" "ExperienceLevel"[],
    "skills" TEXT[],
    "answerOutline" TEXT NOT NULL,
    "explanation" TEXT NOT NULL DEFAULT '',
    "exampleAnswer" TEXT NOT NULL DEFAULT '',
    "codeSolution" TEXT NOT NULL DEFAULT '',
    "codeLanguage" TEXT NOT NULL DEFAULT '',
    "testCases" JSONB NOT NULL DEFAULT '[]',
    "hints" TEXT[],
    "estimatedMinutes" INTEGER NOT NULL DEFAULT 5,
    "origin" "ContentOrigin" NOT NULL,
    "verification" "Verification" NOT NULL DEFAULT 'NOT_VERIFIED',
    "publication" "Publication" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "moderatorNotes" TEXT NOT NULL DEFAULT '',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionOption" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "correct" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL,

    CONSTRAINT "QuestionOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionTag" (
    "questionId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "QuestionTag_pkey" PRIMARY KEY ("questionId","tagId")
);

-- CreateTable
CREATE TABLE "QuestionCompany" (
    "questionId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,

    CONSTRAINT "QuestionCompany_pkey" PRIMARY KEY ("questionId","companyId")
);

-- CreateTable
CREATE TABLE "Experience" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "careerStage" "CareerStage",
    "experienceLevel" "ExperienceLevel",
    "reportedYear" INTEGER,
    "summary" TEXT NOT NULL,
    "rounds" JSONB NOT NULL DEFAULT '[]',
    "topics" TEXT[],
    "reportedQuestions" TEXT[],
    "advice" TEXT NOT NULL DEFAULT '',
    "sourceUrl" TEXT NOT NULL DEFAULT '',
    "sourceRef" TEXT NOT NULL DEFAULT '',
    "origin" "ContentOrigin" NOT NULL,
    "verification" "Verification" NOT NULL DEFAULT 'NOT_VERIFIED',
    "publication" "Publication" NOT NULL DEFAULT 'DRAFT',
    "lastReviewedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "moderatorNotes" TEXT NOT NULL DEFAULT '',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Experience_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedQuestion" (
    "userId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedQuestion_pkey" PRIMARY KEY ("userId","questionId")
);

-- CreateTable
CREATE TABLE "ContentRevision" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "actorId" TEXT,
    "changed" TEXT[],
    "snapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentAudit" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportJob" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "kind" "ImportKind" NOT NULL,
    "filename" TEXT NOT NULL,
    "fileHash" TEXT NOT NULL,
    "status" "ImportStatus" NOT NULL,
    "message" TEXT NOT NULL DEFAULT '',
    "total" INTEGER NOT NULL DEFAULT 0,
    "valid" INTEGER NOT NULL DEFAULT 0,
    "invalid" INTEGER NOT NULL DEFAULT 0,
    "duplicate" INTEGER NOT NULL DEFAULT 0,
    "skipped" INTEGER NOT NULL DEFAULT 0,
    "created" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "committedAt" TIMESTAMP(3),

    CONSTRAINT "ImportJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportRecord" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "row" INTEGER NOT NULL,
    "status" "StagedStatus" NOT NULL,
    "data" JSONB,
    "errors" TEXT[],
    "duplicateOf" TEXT,
    "preview" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "ImportRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PracticeSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "topic" TEXT NOT NULL DEFAULT '',
    "difficulty" "Difficulty",
    "questionType" "QuestionType",
    "status" "PracticeStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PracticeSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PracticeSessionQuestion" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "questionId" TEXT,
    "generatedQuestionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PracticeSessionQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPracticeAnswer" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "questionRef" TEXT NOT NULL,
    "answerText" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserPracticeAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnswerEvaluation" (
    "id" TEXT NOT NULL,
    "answerId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "band" TEXT NOT NULL,
    "criteria" JSONB NOT NULL DEFAULT '[]',
    "strengths" TEXT[],
    "missing" TEXT[],
    "incorrect" TEXT[],
    "improvements" TEXT[],
    "modelAnswer" TEXT NOT NULL DEFAULT '',
    "nextSteps" TEXT[],
    "confidence" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnswerEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneratedPracticeQuestion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "type" "QuestionType" NOT NULL,
    "difficulty" "Difficulty" NOT NULL,
    "topic" TEXT NOT NULL,
    "subtopic" TEXT NOT NULL DEFAULT '',
    "skills" TEXT[],
    "estimatedMinutes" INTEGER NOT NULL DEFAULT 5,
    "hints" TEXT[],
    "answerOutline" TEXT NOT NULL DEFAULT '',
    "explanation" TEXT NOT NULL DEFAULT '',
    "exampleAnswer" TEXT NOT NULL DEFAULT '',
    "codeSolution" TEXT NOT NULL DEFAULT '',
    "codeLanguage" TEXT NOT NULL DEFAULT '',
    "testCases" JSONB NOT NULL DEFAULT '[]',
    "rubric" JSONB NOT NULL DEFAULT '[]',
    "origin" "ContentOrigin" NOT NULL DEFAULT 'AI_GENERATED',
    "contentOrigin" TEXT NOT NULL DEFAULT 'AI_GENERATED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GeneratedPracticeQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreparationPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "PlanStatus" NOT NULL DEFAULT 'ACTIVE',
    "version" INTEGER NOT NULL DEFAULT 1,
    "goal" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PreparationPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreparationPlanVersion" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PreparationPlanVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreparationPlanTask" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "topic" TEXT NOT NULL DEFAULT '',
    "estimatedMinutes" INTEGER NOT NULL DEFAULT 15,
    "status" "PlanTaskStatus" NOT NULL DEFAULT 'TODO',
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PreparationPlanTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIUsageRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "model" TEXT NOT NULL DEFAULT '',
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "estimatedCostUsd" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIUsageRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIRequestLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "operation" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "errorCode" TEXT,
    "durationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIRequestLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assessment" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "type" "AssessmentType" NOT NULL,
    "difficulty" "Difficulty" NOT NULL DEFAULT 'BEGINNER',
    "careerStages" "CareerStage"[],
    "status" "AssessmentStatus" NOT NULL DEFAULT 'DRAFT',
    "timeLimitMinutes" INTEGER NOT NULL DEFAULT 30,
    "passingScore" INTEGER NOT NULL DEFAULT 60,
    "negativeMarking" BOOLEAN NOT NULL DEFAULT false,
    "allowBackNavigation" BOOLEAN NOT NULL DEFAULT true,
    "showExplanationsAfter" BOOLEAN NOT NULL DEFAULT true,
    "maxAttempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentSection" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "questionCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AssessmentSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentQuestion" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "questionId" TEXT,
    "position" INTEGER NOT NULL,
    "marks" INTEGER NOT NULL DEFAULT 1,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "AssessmentQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentAttempt" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "AttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deadlineAt" TIMESTAMP(3) NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "score" INTEGER,
    "maxScore" INTEGER,
    "percentage" DOUBLE PRECISION,
    "passed" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttemptAnswer" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "answerText" TEXT NOT NULL DEFAULT '',
    "selectedOptionIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isMarkedForReview" BOOLEAN NOT NULL DEFAULT false,
    "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttemptAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentResult" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "totalScore" INTEGER NOT NULL,
    "maxScore" INTEGER NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "breakdown" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssessmentResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CodeExecutionJob" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT,
    "language" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "output" TEXT NOT NULL DEFAULT '',
    "error" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "CodeExecutionJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resume" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "status" "ResumeStatus" NOT NULL DEFAULT 'UPLOADED',
    "extractedText" TEXT,
    "extractedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Resume_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResumeVersion" (
    "id" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "extractedText" TEXT,
    "targetRole" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResumeVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResumeExtractedProfile" (
    "id" TEXT NOT NULL,
    "resumeVersionId" TEXT NOT NULL,
    "profileJson" JSONB NOT NULL,
    "rawText" TEXT,
    "extractionModel" TEXT,
    "extractionAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confidence" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResumeExtractedProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResumeAnalysis" (
    "id" TEXT NOT NULL,
    "resumeVersionId" TEXT NOT NULL,
    "targetRole" TEXT,
    "status" "ResumeAnalysisStatus" NOT NULL DEFAULT 'PENDING',
    "analysisJson" JSONB,
    "rubricVersion" TEXT NOT NULL DEFAULT '1.0',
    "overallScore" INTEGER,
    "completedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResumeAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResumeAnalysisCategory" (
    "id" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "maxScore" INTEGER NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "findings" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResumeAnalysisCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResumeRecommendation" (
    "id" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "category" TEXT NOT NULL,
    "evidence" JSONB NOT NULL DEFAULT '[]',
    "expectedEffort" TEXT,
    "status" "RecommendationStatus" NOT NULL DEFAULT 'PENDING',
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResumeRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResumeRewriteSuggestion" (
    "id" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "originalText" TEXT NOT NULL,
    "suggestedText" TEXT NOT NULL,
    "rationale" TEXT NOT NULL,
    "assumptions" JSONB NOT NULL DEFAULT '[]',
    "isAccepted" BOOLEAN NOT NULL DEFAULT false,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResumeRewriteSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobDescription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "source" "JobDescriptionSource" NOT NULL,
    "rawText" TEXT NOT NULL,
    "url" TEXT,
    "title" TEXT,
    "company" TEXT,
    "parsedJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobDescription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobMatch" (
    "id" TEXT NOT NULL,
    "resumeVersionId" TEXT NOT NULL,
    "jobDescriptionId" TEXT NOT NULL,
    "matchJson" JSONB NOT NULL,
    "overallMatch" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillGap" (
    "id" TEXT NOT NULL,
    "resumeVersionId" TEXT NOT NULL,
    "skill" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "targetRole" TEXT,
    "resumeEvidence" JSONB NOT NULL DEFAULT '[]',
    "assessmentEvidence" JSONB NOT NULL DEFAULT '[]',
    "practiceEvidence" JSONB NOT NULL DEFAULT '[]',
    "classification" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION,
    "suggestedAction" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SkillGap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResumeProcessingJob" (
    "id" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "resumeVersionId" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "inputJson" JSONB,
    "outputJson" JSONB,
    "errorMessage" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResumeProcessingJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MockInterviewSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mode" "MockInterviewMode" NOT NULL,
    "targetRole" TEXT,
    "careerLevel" "ExperienceLevel",
    "companyId" TEXT,
    "resumeVersionId" TEXT,
    "jobDescriptionSnapshot" JSONB,
    "contextSnapshot" JSONB,
    "configuration" JSONB NOT NULL,
    "interviewPlan" JSONB,
    "status" "MockInterviewStatus" NOT NULL DEFAULT 'DRAFT',
    "difficulty" "MockInterviewDifficulty" NOT NULL DEFAULT 'MEDIUM',
    "questionCount" INTEGER NOT NULL DEFAULT 10,
    "durationMinutes" INTEGER NOT NULL DEFAULT 30,
    "topics" TEXT[],
    "skills" TEXT[],
    "codingLanguage" TEXT,
    "feedbackMode" "MockInterviewFeedbackMode" NOT NULL DEFAULT 'AT_END',
    "interviewStyle" "MockInterviewStyle" NOT NULL DEFAULT 'STANDARD',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MockInterviewSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MockInterviewQuestion" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "sequenceNumber" INTEGER NOT NULL,
    "turnType" "MockInterviewTurnType" NOT NULL DEFAULT 'QUESTION',
    "questionType" "QuestionType" NOT NULL,
    "questionText" TEXT NOT NULL,
    "topicTags" TEXT[],
    "difficulty" "Difficulty" NOT NULL,
    "sourceType" "ContentOrigin" NOT NULL,
    "sourceReference" TEXT,
    "evaluationRubric" JSONB NOT NULL,
    "expectedAnswerMetadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MockInterviewQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MockInterviewAnswer" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "answerText" TEXT,
    "answerCode" TEXT,
    "programmingLanguage" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "idempotencyKey" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MockInterviewAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MockInterviewEvaluation" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "answerId" TEXT NOT NULL,
    "rubricVersion" TEXT NOT NULL,
    "dimensionScores" JSONB NOT NULL,
    "overallScore" INTEGER,
    "strengths" TEXT[],
    "improvements" TEXT[],
    "missingConcepts" TEXT[],
    "evidence" JSONB NOT NULL,
    "confidenceStatus" TEXT,
    "evaluationStatus" TEXT NOT NULL DEFAULT 'COMPLETED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MockInterviewEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MockInterviewReport" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reportVersion" INTEGER NOT NULL DEFAULT 1,
    "overallScore" INTEGER,
    "skillBreakdown" JSONB NOT NULL,
    "summary" TEXT NOT NULL,
    "recommendations" JSONB NOT NULL,
    "evaluationCoverage" JSONB NOT NULL,
    "limitations" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MockInterviewReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MockInterviewGenerationJob" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "inputJson" JSONB,
    "outputJson" JSONB,
    "errorMessage" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MockInterviewGenerationJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoiceSession" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "voiceMode" "VoiceMode" NOT NULL DEFAULT 'TEXT_ONLY',
    "voiceProvider" "VoiceProvider" DEFAULT 'BROWSER_NATIVE',
    "transcriptionProvider" "TranscriptionProvider" DEFAULT 'BROWSER_NATIVE',
    "language" TEXT NOT NULL DEFAULT 'en-US',
    "voiceId" TEXT,
    "consentVersion" TEXT,
    "consentAt" TIMESTAMP(3),
    "deliveryAnalyticsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "processingStatus" TEXT NOT NULL DEFAULT 'IDLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VoiceSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoiceCapture" (
    "id" TEXT NOT NULL,
    "voiceSessionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "attemptId" TEXT,
    "captureStatus" "VoiceCaptureStatus" NOT NULL DEFAULT 'PENDING',
    "audioDuration" INTEGER,
    "mimeType" TEXT,
    "storageKey" TEXT,
    "deletionAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VoiceCapture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoiceTranscript" (
    "id" TEXT NOT NULL,
    "captureId" TEXT NOT NULL,
    "fullText" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en-US',
    "confidence" DOUBLE PRECISION,
    "isFinal" BOOLEAN NOT NULL DEFAULT false,
    "provider" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VoiceTranscript_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TranscriptSegment" (
    "id" TEXT NOT NULL,
    "transcriptId" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "startMs" INTEGER,
    "endMs" INTEGER,
    "confidence" DOUBLE PRECISION,
    "isFinal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TranscriptSegment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoiceAnalysis" (
    "id" TEXT NOT NULL,
    "captureId" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "speakingDurationMs" INTEGER,
    "wordsPerMinute" DOUBLE PRECISION,
    "pauseCount" INTEGER,
    "avgPauseDurationMs" DOUBLE PRECISION,
    "fillerWordCount" INTEGER,
    "fillerWords" JSONB,
    "transcriptClarityScore" DOUBLE PRECISION,
    "metricsJson" JSONB,
    "reliability" TEXT NOT NULL DEFAULT 'MEDIUM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VoiceAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoiceProcessingJob" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "captureId" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "provider" TEXT,
    "inputJson" JSONB,
    "outputJson" JSONB,
    "errorMessage" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VoiceProcessingJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoiceConsentLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT,
    "version" TEXT NOT NULL,
    "accepted" BOOLEAN NOT NULL,
    "ipHash" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VoiceConsentLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoiceUsageRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT,
    "operation" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT,
    "audioDurationMs" INTEGER,
    "characters" INTEGER,
    "estimatedCostUsd" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VoiceUsageRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityTopic" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "color" TEXT,
    "icon" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityTopic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserFollowedTopic" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserFollowedTopic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityPost" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "questionId" TEXT,
    "visibility" "PostVisibility" NOT NULL DEFAULT 'PUBLIC',
    "imageUrl" TEXT,
    "resourceUrl" TEXT,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityComment" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "parentId" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostReaction" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reaction" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostReaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedCommunityPost" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedCommunityPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityReport" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "reason" "ReportReason" NOT NULL,
    "details" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "reviewerId" TEXT,
    "actionTaken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserFollow" (
    "id" TEXT NOT NULL,
    "followerId" TEXT NOT NULL,
    "followingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserFollow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBlock" (
    "id" TEXT NOT NULL,
    "blockerId" TEXT NOT NULL,
    "blockedId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudyGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "about" TEXT,
    "category" TEXT NOT NULL,
    "targetRole" TEXT,
    "targetCompany" TEXT,
    "skill" TEXT,
    "careerStage" "CareerStage",
    "maxMembers" INTEGER NOT NULL DEFAULT 50,
    "visibility" "GroupVisibility" NOT NULL DEFAULT 'PUBLIC',
    "rules" JSONB,
    "imageUrl" TEXT,
    "memberCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudyGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudyGroupMembership" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "GroupRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudyGroupMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudyGroupInvitation" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "inviteeId" TEXT NOT NULL,
    "inviterId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudyGroupInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudyGroupJoinRequest" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "message" TEXT,
    "status" "JoinRequestStatus" NOT NULL DEFAULT 'PENDING',
    "respondedById" TEXT,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudyGroupJoinRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupDiscussion" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "questionId" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroupDiscussion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupDiscussionReply" (
    "id" TEXT NOT NULL,
    "discussionId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "parentId" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroupDiscussionReply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupMessage" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "editedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "GroupMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupPinnedItem" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "pinnedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupPinnedItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupResource" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "resourceId" TEXT,
    "addedById" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT,
    "fileKey" TEXT,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "resourceType" TEXT NOT NULL,
    "topic" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroupResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudySession" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "subject" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "meetingLink" TEXT,
    "maxParticipants" INTEGER,
    "createdBy" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudySession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudySessionAttendance" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rsvp" TEXT NOT NULL DEFAULT 'GOING',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudySessionAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupChallenge" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "challengeType" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "targetValue" INTEGER NOT NULL,
    "xpReward" INTEGER,
    "createdBy" TEXT NOT NULL,
    "status" "GroupChallengeStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroupChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupChallengeParticipation" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "targetValue" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "lastRecordedActivityAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroupChallengeParticipation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "notifyFollows" BOOLEAN NOT NULL DEFAULT true,
    "notifyComments" BOOLEAN NOT NULL DEFAULT true,
    "notifyMentions" BOOLEAN NOT NULL DEFAULT true,
    "notifyGroupInvites" BOOLEAN NOT NULL DEFAULT true,
    "notifyGroupDiscussions" BOOLEAN NOT NULL DEFAULT true,
    "notifyChallengeUpdates" BOOLEAN NOT NULL DEFAULT true,
    "notifySessionReminders" BOOLEAN NOT NULL DEFAULT true,
    "profileVisibility" TEXT NOT NULL DEFAULT 'PUBLIC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareerGoal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetRole" TEXT NOT NULL,
    "careerStage" "CareerStage",
    "targetCompany" TEXT,
    "targetIndustry" TEXT,
    "targetDate" TIMESTAMP(3),
    "weeklyHours" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "experienceLevel" "ExperienceLevel",
    "currentRole" TEXT,
    "currentIndustry" TEXT,
    "preferences" JSONB NOT NULL,
    "status" "CareerGoalStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareerGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareerRoadmap" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "goalId" TEXT,
    "status" "RoadmapStatus" NOT NULL DEFAULT 'DRAFT',
    "currentVersion" INTEGER NOT NULL DEFAULT 1,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "targetDate" TIMESTAMP(3),
    "weeklyHourBudget" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "summary" TEXT NOT NULL,
    "methodologyVersion" TEXT NOT NULL DEFAULT '1.0',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareerRoadmap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoadmapVersion" (
    "id" TEXT NOT NULL,
    "roadmapId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "changeReason" TEXT NOT NULL,
    "summary" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoadmapVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoadmapMilestone" (
    "id" TEXT NOT NULL,
    "roadmapId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "targetDate" TIMESTAMP(3),
    "completionCriteria" JSONB NOT NULL,
    "status" "RoadmapTaskStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoadmapMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoadmapTask" (
    "id" TEXT NOT NULL,
    "roadmapId" TEXT NOT NULL,
    "milestoneId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "taskType" "RoadmapTaskType" NOT NULL,
    "skillTags" TEXT[],
    "skillIds" TEXT[],
    "estimatedMinutes" INTEGER NOT NULL DEFAULT 60,
    "priority" INTEGER NOT NULL DEFAULT 2,
    "prerequisites" TEXT[],
    "dueDate" TIMESTAMP(3),
    "status" "RoadmapTaskStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "completionSource" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoadmapTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoadmapTaskPrerequisite" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "prerequisiteId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoadmapTaskPrerequisite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillEvidenceRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "skillName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "evidenceType" "SkillEvidenceType" NOT NULL,
    "sourceRecordId" TEXT,
    "sourceRecordType" TEXT,
    "evidenceText" TEXT,
    "classification" "SkillEvidenceClassification" NOT NULL,
    "proficiencyScore" DOUBLE PRECISION,
    "rubricVersion" TEXT,
    "confidence" DOUBLE PRECISION,
    "evidenceDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SkillEvidenceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningResource" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "resourceType" "LearningResourceType" NOT NULL,
    "canonicalUrl" TEXT,
    "internalRef" TEXT,
    "skillTags" TEXT[],
    "difficulty" "Difficulty" NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "estimatedMinutes" INTEGER,
    "sourceOrg" TEXT,
    "accessType" "ResourceAccessType" NOT NULL,
    "attribution" TEXT,
    "license" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "verificationStatus" "ResourceVerificationStatus" NOT NULL,
    "isOfficial" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserResourceInteraction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "interactionType" TEXT NOT NULL,
    "completionStatus" TEXT,
    "rating" INTEGER,
    "feedback" TEXT,
    "timeSpentMinutes" INTEGER,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserResourceInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoadmapRecommendation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roadmapId" TEXT,
    "type" "RoadmapRecommendationType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "skillId" TEXT,
    "skillName" TEXT,
    "supportingEvidence" JSONB NOT NULL DEFAULT '[]',
    "explanation" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 2,
    "status" "RoadmapRecommendationStatus" NOT NULL DEFAULT 'PENDING',
    "relatedSkills" TEXT[],
    "suggestedActions" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoadmapRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillGapRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roadmapId" TEXT,
    "skillId" TEXT NOT NULL,
    "skillName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "targetRole" TEXT,
    "resumeEvidence" JSONB NOT NULL DEFAULT '[]',
    "assessmentEvidence" JSONB NOT NULL DEFAULT '[]',
    "practiceEvidence" JSONB NOT NULL DEFAULT '[]',
    "interviewEvidence" JSONB NOT NULL DEFAULT '[]',
    "classification" TEXT NOT NULL,
    "currentProficiency" DOUBLE PRECISION,
    "targetProficiency" DOUBLE PRECISION,
    "priority" "SkillGapPriority" NOT NULL DEFAULT 'MEDIUM',
    "confidence" DOUBLE PRECISION,
    "suggestedAction" TEXT,
    "recommendedResources" JSONB NOT NULL DEFAULT '[]',
    "lastEvaluated" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SkillGapRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoadmapRecommendationEngine" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roadmapId" TEXT,
    "contextSnapshot" JSONB NOT NULL,
    "recommendations" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modelVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoadmapRecommendationEngine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReadinessIndicator" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetRole" TEXT NOT NULL,
    "careerStage" "CareerStage",
    "overallScore" DOUBLE PRECISION,
    "skillBreakdown" JSONB NOT NULL,
    "evidenceCoverage" JSONB NOT NULL,
    "limitations" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rubricVersion" TEXT NOT NULL DEFAULT '1.0',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReadinessIndicator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoadmapAdaptationLog" (
    "id" TEXT NOT NULL,
    "roadmapId" TEXT NOT NULL,
    "triggerType" TEXT NOT NULL,
    "triggerData" JSONB NOT NULL,
    "changesJson" JSONB NOT NULL,
    "previousVersion" INTEGER NOT NULL,
    "newVersion" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoadmapAdaptationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningStreak" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastActivityAt" TIMESTAMP(3),
    "streakStartAt" TIMESTAMP(3),
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningStreak_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "frequency" TEXT,
    "quietHoursStart" TEXT,
    "quietHoursEnd" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InAppNotification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InAppNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GamificationProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalXP" INTEGER NOT NULL DEFAULT 0,
    "currentLevel" INTEGER NOT NULL DEFAULT 1,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastActivityAt" TIMESTAMP(3),
    "streakStartAt" TIMESTAMP(3),
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "weeklyGoal" JSONB,
    "preferences" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GamificationProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "XPTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "activityType" "XPActivityType" NOT NULL,
    "sourceRecordId" TEXT NOT NULL,
    "sourceRecordType" TEXT NOT NULL,
    "xpAmount" INTEGER NOT NULL,
    "ruleVersion" TEXT NOT NULL DEFAULT '1.0',
    "transactionType" "XPTransactionType" NOT NULL DEFAULT 'EARNED',
    "reversalRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "XPTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AchievementDefinition" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "AchievementCategory" NOT NULL,
    "icon" TEXT NOT NULL,
    "criteriaJson" JSONB NOT NULL,
    "progressTarget" INTEGER,
    "xpReward" INTEGER NOT NULL DEFAULT 0,
    "ruleVersion" TEXT NOT NULL DEFAULT '1.0',
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AchievementDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAchievement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "achievementDefinitionId" TEXT NOT NULL,
    "status" "AchievementStatus" NOT NULL DEFAULT 'LOCKED',
    "progressValue" INTEGER NOT NULL DEFAULT 0,
    "progressTarget" INTEGER,
    "unlockedAt" TIMESTAMP(3),
    "claimedAt" TIMESTAMP(3),
    "rewardTransactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserAchievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChallengeDefinition" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "ChallengeType" NOT NULL,
    "criteriaJson" JSONB NOT NULL,
    "targetValue" INTEGER NOT NULL,
    "rewardXP" INTEGER NOT NULL DEFAULT 0,
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "ruleVersion" TEXT NOT NULL DEFAULT '1.0',
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChallengeDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserChallenge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "challengeDefinitionId" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "status" "ChallengeStatus" NOT NULL DEFAULT 'AVAILABLE',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "rewardTransactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningStreakHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "activityCount" INTEGER NOT NULL DEFAULT 0,
    "xpEarned" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearningStreakHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyGoal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "target" INTEGER NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "progressCalcVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeeklyGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonalBest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "metricType" TEXT NOT NULL,
    "metricName" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "previousValue" DOUBLE PRECISION,
    "unit" TEXT NOT NULL,
    "evidenceJson" JSONB NOT NULL,
    "achievedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonalBest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaderboardEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scope" "LeaderboardScope" NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "rank" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "displayName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaderboardEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GamificationEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventType" "GamificationEventType" NOT NULL,
    "xpAmount" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GamificationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareerOpportunity" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "type" "OpportunityType" NOT NULL,
    "employmentType" TEXT NOT NULL,
    "workArrangement" "WorkArrangement" NOT NULL,
    "location" TEXT NOT NULL,
    "salaryMin" INTEGER,
    "salaryMax" INTEGER,
    "salaryCurrency" TEXT NOT NULL DEFAULT 'USD',
    "salaryPeriod" TEXT NOT NULL DEFAULT 'YEARLY',
    "experienceMin" INTEGER,
    "experienceMax" INTEGER,
    "educationRequirement" TEXT,
    "description" TEXT NOT NULL,
    "responsibilities" TEXT,
    "requiredSkills" TEXT[],
    "preferredSkills" TEXT[],
    "benefits" TEXT,
    "applicationUrl" TEXT NOT NULL,
    "applicationDeadline" TIMESTAMP(3),
    "postedDate" TIMESTAMP(3) NOT NULL,
    "lastVerifiedDate" TIMESTAMP(3),
    "status" "OpportunityStatus" NOT NULL DEFAULT 'ACTIVE',
    "sourceId" TEXT,
    "sourceReference" TEXT,
    "isRemote" BOOLEAN NOT NULL DEFAULT false,
    "isEntryLevel" BOOLEAN NOT NULL DEFAULT false,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareerOpportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpportunitySource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" "OpportunitySourceType" NOT NULL,
    "apiConfig" JSONB,
    "permission" "OpportunitySourcePermission" NOT NULL DEFAULT 'UNKNOWN',
    "termsOfUseUrl" TEXT,
    "attributionRequirements" TEXT,
    "lastSyncAt" TIMESTAMP(3),
    "syncStatus" TEXT NOT NULL DEFAULT 'IDLE',
    "rateLimitPerHour" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OpportunitySource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpportunitySourceSync" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "opportunitiesNew" INTEGER NOT NULL DEFAULT 0,
    "opportunitiesUpdated" INTEGER NOT NULL DEFAULT 0,
    "opportunitiesExpired" INTEGER NOT NULL DEFAULT 0,
    "errors" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OpportunitySourceSync_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpportunityChangeHistory" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "fieldChanged" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OpportunityChangeHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedOpportunity" (
    "userId" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedOpportunity_pkey" PRIMARY KEY ("userId","opportunityId")
);

-- CreateTable
CREATE TABLE "DismissedOpportunity" (
    "userId" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DismissedOpportunity_pkey" PRIMARY KEY ("userId","opportunityId")
);

-- CreateTable
CREATE TABLE "OpportunityMatch" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "overallScore" INTEGER NOT NULL,
    "requiredSkillsScore" INTEGER NOT NULL,
    "preferredSkillsScore" INTEGER NOT NULL,
    "experienceScore" INTEGER NOT NULL,
    "roleRelevanceScore" INTEGER NOT NULL,
    "locationScore" INTEGER NOT NULL,
    "educationScore" INTEGER NOT NULL,
    "matchingSkills" TEXT[],
    "missingSkills" TEXT[],
    "unverifiedSkills" TEXT[],
    "experienceMatch" TEXT NOT NULL,
    "locationMatch" TEXT NOT NULL,
    "category" "RecommendationCategory" NOT NULL,
    "explanation" TEXT NOT NULL,
    "dismissedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OpportunityMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobSearchPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetRoles" TEXT[],
    "preferredIndustries" TEXT[],
    "preferredCompanies" TEXT[],
    "preferredLocations" TEXT[],
    "workArrangements" "WorkArrangement"[],
    "employmentTypes" TEXT[],
    "experienceLevel" TEXT,
    "salaryMin" INTEGER,
    "salaryMax" INTEGER,
    "salaryCurrency" TEXT NOT NULL DEFAULT 'USD',
    "preferredSkills" TEXT[],
    "opportunityTypes" "OpportunityType"[],
    "notificationTypes" "JobSearchNotificationType"[],
    "isPaused" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobSearchPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedJobSearch" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "filters" JSONB NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedJobSearch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobDescriptionAnalysis" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "resumeVersionId" TEXT,
    "jobDescriptionId" TEXT,
    "rawText" TEXT NOT NULL,
    "extractedJson" JSONB NOT NULL,
    "requiredSkills" TEXT[],
    "preferredSkills" TEXT[],
    "experienceRequirements" TEXT,
    "educationRequirements" TEXT,
    "responsibilities" TEXT[],
    "technicalKeywords" TEXT[],
    "roleExpectations" TEXT[],
    "interviewTopics" TEXT[],
    "overallMatch" INTEGER,
    "matchingSkills" TEXT[],
    "missingEvidence" TEXT[],
    "unverifiedSkills" TEXT[],
    "experienceAlignment" TEXT,
    "resumeImprovements" TEXT,
    "preparationRecommendations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobDescriptionAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobSkillRequirement" (
    "id" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "skill" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "isRequired" BOOLEAN NOT NULL,
    "confidence" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobSkillRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobApplication" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "opportunityId" TEXT,
    "companyId" TEXT,
    "jobTitle" TEXT NOT NULL,
    "applicationUrl" TEXT,
    "applicationDate" TIMESTAMP(3),
    "status" "ApplicationStatus" NOT NULL DEFAULT 'INTERESTED',
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "salaryExpectationMin" INTEGER,
    "salaryExpectationMax" INTEGER,
    "salaryCurrency" TEXT NOT NULL DEFAULT 'USD',
    "notes" TEXT,
    "resumeVersionId" TEXT,
    "mockInterviewSessionId" TEXT,
    "nextFollowUpDate" TIMESTAMP(3),
    "customTags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationStatusHistory" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "fromStatus" "ApplicationStatus",
    "toStatus" "ApplicationStatus" NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changedBy" TEXT NOT NULL,
    "note" TEXT,

    CONSTRAINT "ApplicationStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationNote" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isPrivate" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApplicationNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationReminder" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "notificationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApplicationReminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationEvent" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER,
    "location" TEXT,
    "meetingLink" TEXT,
    "isAllDay" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApplicationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationAttachment" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_careerStage_idx" ON "User"("careerStage");

-- CreateIndex
CREATE INDEX "User_deletionRequestedAt_idx" ON "User"("deletionRequestedAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");

-- CreateIndex
CREATE INDEX "PreparationGoal_userId_idx" ON "PreparationGoal"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PreparationGoal_userId_category_key" ON "PreparationGoal"("userId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "UserPreference_userId_key" ON "UserPreference"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailVerificationToken_tokenHash_key" ON "EmailVerificationToken"("tokenHash");

-- CreateIndex
CREATE INDEX "EmailVerificationToken_userId_idx" ON "EmailVerificationToken"("userId");

-- CreateIndex
CREATE INDEX "EmailVerificationToken_expiresAt_idx" ON "EmailVerificationToken"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");

-- CreateIndex
CREATE INDEX "PasswordResetToken_expiresAt_idx" ON "PasswordResetToken"("expiresAt");

-- CreateIndex
CREATE INDEX "ActivityLog_userId_createdAt_idx" ON "ActivityLog"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_createdAt_idx" ON "Notification"("userId", "readAt", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "Source_slug_key" ON "Source"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Source_url_key" ON "Source"("url");

-- CreateIndex
CREATE INDEX "Source_type_idx" ON "Source"("type");

-- CreateIndex
CREATE INDEX "Source_permission_idx" ON "Source"("permission");

-- CreateIndex
CREATE INDEX "ContentSource_companyId_idx" ON "ContentSource"("companyId");

-- CreateIndex
CREATE INDEX "ContentSource_questionId_idx" ON "ContentSource"("questionId");

-- CreateIndex
CREATE INDEX "ContentSource_experienceId_idx" ON "ContentSource"("experienceId");

-- CreateIndex
CREATE INDEX "ContentSource_processId_idx" ON "ContentSource"("processId");

-- CreateIndex
CREATE UNIQUE INDEX "ContentSource_sourceId_companyId_key" ON "ContentSource"("sourceId", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "ContentSource_sourceId_processId_key" ON "ContentSource"("sourceId", "processId");

-- CreateIndex
CREATE UNIQUE INDEX "ContentSource_sourceId_questionId_key" ON "ContentSource"("sourceId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "ContentSource_sourceId_experienceId_key" ON "ContentSource"("sourceId", "experienceId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE INDEX "Category_parentId_idx" ON "Category"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_slug_key" ON "Tag"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Company_slug_key" ON "Company"("slug");

-- CreateIndex
CREATE INDEX "Company_publication_name_idx" ON "Company"("publication", "name");

-- CreateIndex
CREATE INDEX "Company_industry_idx" ON "Company"("industry");

-- CreateIndex
CREATE INDEX "InterviewProcess_companyId_publication_sequence_idx" ON "InterviewProcess"("companyId", "publication", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "Question_slug_key" ON "Question"("slug");

-- CreateIndex
CREATE INDEX "Question_publication_publishedAt_idx" ON "Question"("publication", "publishedAt" DESC);

-- CreateIndex
CREATE INDEX "Question_categoryId_publication_idx" ON "Question"("categoryId", "publication");

-- CreateIndex
CREATE INDEX "Question_difficulty_publication_idx" ON "Question"("difficulty", "publication");

-- CreateIndex
CREATE INDEX "Question_type_publication_idx" ON "Question"("type", "publication");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionOption_questionId_position_key" ON "QuestionOption"("questionId", "position");

-- CreateIndex
CREATE INDEX "QuestionTag_tagId_idx" ON "QuestionTag"("tagId");

-- CreateIndex
CREATE INDEX "QuestionCompany_companyId_idx" ON "QuestionCompany"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Experience_slug_key" ON "Experience"("slug");

-- CreateIndex
CREATE INDEX "Experience_companyId_publication_idx" ON "Experience"("companyId", "publication");

-- CreateIndex
CREATE INDEX "Experience_publication_publishedAt_idx" ON "Experience"("publication", "publishedAt" DESC);

-- CreateIndex
CREATE INDEX "SavedQuestion_questionId_idx" ON "SavedQuestion"("questionId");

-- CreateIndex
CREATE INDEX "ContentRevision_kind_entityId_idx" ON "ContentRevision"("kind", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "ContentRevision_kind_entityId_version_key" ON "ContentRevision"("kind", "entityId", "version");

-- CreateIndex
CREATE INDEX "ContentAudit_createdAt_idx" ON "ContentAudit"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "ContentAudit_entityType_entityId_idx" ON "ContentAudit"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "ImportJob_sourceId_kind_fileHash_idx" ON "ImportJob"("sourceId", "kind", "fileHash");

-- CreateIndex
CREATE INDEX "ImportJob_status_idx" ON "ImportJob"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ImportRecord_jobId_row_key" ON "ImportRecord"("jobId", "row");

-- CreateIndex
CREATE INDEX "PracticeSession_userId_status_createdAt_idx" ON "PracticeSession"("userId", "status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "PracticeSessionQuestion_sessionId_idx" ON "PracticeSessionQuestion"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "PracticeSessionQuestion_sessionId_position_key" ON "PracticeSessionQuestion"("sessionId", "position");

-- CreateIndex
CREATE INDEX "UserPracticeAnswer_sessionId_idx" ON "UserPracticeAnswer"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPracticeAnswer_sessionId_questionRef_key" ON "UserPracticeAnswer"("sessionId", "questionRef");

-- CreateIndex
CREATE UNIQUE INDEX "AnswerEvaluation_answerId_key" ON "AnswerEvaluation"("answerId");

-- CreateIndex
CREATE INDEX "AnswerEvaluation_createdAt_idx" ON "AnswerEvaluation"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "GeneratedPracticeQuestion_userId_createdAt_idx" ON "GeneratedPracticeQuestion"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "PreparationPlan_userId_status_idx" ON "PreparationPlan"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "PreparationPlanVersion_planId_version_key" ON "PreparationPlanVersion"("planId", "version");

-- CreateIndex
CREATE INDEX "PreparationPlanTask_planId_status_idx" ON "PreparationPlanTask"("planId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "PreparationPlanTask_planId_position_key" ON "PreparationPlanTask"("planId", "position");

-- CreateIndex
CREATE INDEX "AIUsageRecord_userId_createdAt_idx" ON "AIUsageRecord"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "AIRequestLog_operation_createdAt_idx" ON "AIRequestLog"("operation", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "Assessment_slug_key" ON "Assessment"("slug");

-- CreateIndex
CREATE INDEX "Assessment_status_type_idx" ON "Assessment"("status", "type");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentSection_assessmentId_position_key" ON "AssessmentSection"("assessmentId", "position");

-- CreateIndex
CREATE INDEX "AssessmentQuestion_assessmentId_idx" ON "AssessmentQuestion"("assessmentId");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentQuestion_assessmentId_position_key" ON "AssessmentQuestion"("assessmentId", "position");

-- CreateIndex
CREATE INDEX "AssessmentAttempt_userId_status_idx" ON "AssessmentAttempt"("userId", "status");

-- CreateIndex
CREATE INDEX "AssessmentAttempt_assessmentId_status_idx" ON "AssessmentAttempt"("assessmentId", "status");

-- CreateIndex
CREATE INDEX "AttemptAnswer_attemptId_idx" ON "AttemptAnswer"("attemptId");

-- CreateIndex
CREATE UNIQUE INDEX "AttemptAnswer_attemptId_questionId_key" ON "AttemptAnswer"("attemptId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentResult_attemptId_key" ON "AssessmentResult"("attemptId");

-- CreateIndex
CREATE INDEX "CodeExecutionJob_status_createdAt_idx" ON "CodeExecutionJob"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Resume_storageKey_key" ON "Resume"("storageKey");

-- CreateIndex
CREATE INDEX "Resume_userId_status_idx" ON "Resume"("userId", "status");

-- CreateIndex
CREATE INDEX "Resume_userId_createdAt_idx" ON "Resume"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "ResumeVersion_resumeId_idx" ON "ResumeVersion"("resumeId");

-- CreateIndex
CREATE UNIQUE INDEX "ResumeVersion_resumeId_versionNumber_key" ON "ResumeVersion"("resumeId", "versionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ResumeExtractedProfile_resumeVersionId_key" ON "ResumeExtractedProfile"("resumeVersionId");

-- CreateIndex
CREATE INDEX "ResumeAnalysis_resumeVersionId_idx" ON "ResumeAnalysis"("resumeVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "ResumeAnalysisCategory_analysisId_category_key" ON "ResumeAnalysisCategory"("analysisId", "category");

-- CreateIndex
CREATE INDEX "ResumeRecommendation_analysisId_idx" ON "ResumeRecommendation"("analysisId");

-- CreateIndex
CREATE INDEX "ResumeRewriteSuggestion_analysisId_idx" ON "ResumeRewriteSuggestion"("analysisId");

-- CreateIndex
CREATE INDEX "JobDescription_userId_createdAt_idx" ON "JobDescription"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "JobMatch_resumeVersionId_idx" ON "JobMatch"("resumeVersionId");

-- CreateIndex
CREATE INDEX "JobMatch_jobDescriptionId_idx" ON "JobMatch"("jobDescriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "JobMatch_resumeVersionId_jobDescriptionId_key" ON "JobMatch"("resumeVersionId", "jobDescriptionId");

-- CreateIndex
CREATE INDEX "SkillGap_resumeVersionId_skill_idx" ON "SkillGap"("resumeVersionId", "skill");

-- CreateIndex
CREATE INDEX "SkillGap_resumeVersionId_targetRole_idx" ON "SkillGap"("resumeVersionId", "targetRole");

-- CreateIndex
CREATE INDEX "ResumeProcessingJob_resumeId_type_idx" ON "ResumeProcessingJob"("resumeId", "type");

-- CreateIndex
CREATE INDEX "ResumeProcessingJob_resumeVersionId_type_idx" ON "ResumeProcessingJob"("resumeVersionId", "type");

-- CreateIndex
CREATE INDEX "ResumeProcessingJob_status_createdAt_idx" ON "ResumeProcessingJob"("status", "createdAt");

-- CreateIndex
CREATE INDEX "MockInterviewSession_userId_status_idx" ON "MockInterviewSession"("userId", "status");

-- CreateIndex
CREATE INDEX "MockInterviewSession_userId_createdAt_idx" ON "MockInterviewSession"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "MockInterviewQuestion_sessionId_idx" ON "MockInterviewQuestion"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "MockInterviewQuestion_sessionId_sequenceNumber_key" ON "MockInterviewQuestion"("sessionId", "sequenceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "MockInterviewAnswer_idempotencyKey_key" ON "MockInterviewAnswer"("idempotencyKey");

-- CreateIndex
CREATE INDEX "MockInterviewAnswer_sessionId_questionId_idx" ON "MockInterviewAnswer"("sessionId", "questionId");

-- CreateIndex
CREATE INDEX "MockInterviewAnswer_userId_idx" ON "MockInterviewAnswer"("userId");

-- CreateIndex
CREATE INDEX "MockInterviewEvaluation_sessionId_idx" ON "MockInterviewEvaluation"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "MockInterviewEvaluation_answerId_key" ON "MockInterviewEvaluation"("answerId");

-- CreateIndex
CREATE UNIQUE INDEX "MockInterviewReport_sessionId_key" ON "MockInterviewReport"("sessionId");

-- CreateIndex
CREATE INDEX "MockInterviewReport_userId_idx" ON "MockInterviewReport"("userId");

-- CreateIndex
CREATE INDEX "MockInterviewGenerationJob_sessionId_type_idx" ON "MockInterviewGenerationJob"("sessionId", "type");

-- CreateIndex
CREATE INDEX "MockInterviewGenerationJob_status_createdAt_idx" ON "MockInterviewGenerationJob"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "VoiceSession_sessionId_key" ON "VoiceSession"("sessionId");

-- CreateIndex
CREATE INDEX "VoiceSession_sessionId_idx" ON "VoiceSession"("sessionId");

-- CreateIndex
CREATE INDEX "VoiceCapture_voiceSessionId_questionId_idx" ON "VoiceCapture"("voiceSessionId", "questionId");

-- CreateIndex
CREATE INDEX "VoiceCapture_voiceSessionId_createdAt_idx" ON "VoiceCapture"("voiceSessionId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "VoiceTranscript_captureId_key" ON "VoiceTranscript"("captureId");

-- CreateIndex
CREATE INDEX "TranscriptSegment_transcriptId_idx" ON "TranscriptSegment"("transcriptId");

-- CreateIndex
CREATE UNIQUE INDEX "TranscriptSegment_transcriptId_index_key" ON "TranscriptSegment"("transcriptId", "index");

-- CreateIndex
CREATE UNIQUE INDEX "VoiceAnalysis_captureId_key" ON "VoiceAnalysis"("captureId");

-- CreateIndex
CREATE INDEX "VoiceAnalysis_captureId_idx" ON "VoiceAnalysis"("captureId");

-- CreateIndex
CREATE INDEX "VoiceProcessingJob_sessionId_type_idx" ON "VoiceProcessingJob"("sessionId", "type");

-- CreateIndex
CREATE INDEX "VoiceProcessingJob_status_createdAt_idx" ON "VoiceProcessingJob"("status", "createdAt");

-- CreateIndex
CREATE INDEX "VoiceProcessingJob_captureId_idx" ON "VoiceProcessingJob"("captureId");

-- CreateIndex
CREATE INDEX "VoiceConsentLog_userId_createdAt_idx" ON "VoiceConsentLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "VoiceUsageRecord_userId_createdAt_idx" ON "VoiceUsageRecord"("userId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "CommunityTopic_name_key" ON "CommunityTopic"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CommunityTopic_slug_key" ON "CommunityTopic"("slug");

-- CreateIndex
CREATE INDEX "UserFollowedTopic_userId_idx" ON "UserFollowedTopic"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserFollowedTopic_userId_topicId_key" ON "UserFollowedTopic"("userId", "topicId");

-- CreateIndex
CREATE INDEX "CommunityPost_topicId_createdAt_idx" ON "CommunityPost"("topicId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "CommunityPost_authorId_createdAt_idx" ON "CommunityPost"("authorId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "CommunityPost_isPinned_createdAt_idx" ON "CommunityPost"("isPinned", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "CommunityComment_postId_createdAt_idx" ON "CommunityComment"("postId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "CommunityComment_parentId_createdAt_idx" ON "CommunityComment"("parentId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "PostReaction_postId_idx" ON "PostReaction"("postId");

-- CreateIndex
CREATE INDEX "PostReaction_userId_idx" ON "PostReaction"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PostReaction_postId_userId_reaction_key" ON "PostReaction"("postId", "userId", "reaction");

-- CreateIndex
CREATE INDEX "SavedCommunityPost_userId_createdAt_idx" ON "SavedCommunityPost"("userId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "SavedCommunityPost_userId_postId_key" ON "SavedCommunityPost"("userId", "postId");

-- CreateIndex
CREATE INDEX "CommunityReport_targetType_targetId_idx" ON "CommunityReport"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "CommunityReport_status_idx" ON "CommunityReport"("status");

-- CreateIndex
CREATE INDEX "CommunityReport_reporterId_idx" ON "CommunityReport"("reporterId");

-- CreateIndex
CREATE INDEX "UserFollow_followerId_idx" ON "UserFollow"("followerId");

-- CreateIndex
CREATE INDEX "UserFollow_followingId_idx" ON "UserFollow"("followingId");

-- CreateIndex
CREATE UNIQUE INDEX "UserFollow_followerId_followingId_key" ON "UserFollow"("followerId", "followingId");

-- CreateIndex
CREATE INDEX "UserBlock_blockerId_idx" ON "UserBlock"("blockerId");

-- CreateIndex
CREATE INDEX "UserBlock_blockedId_idx" ON "UserBlock"("blockedId");

-- CreateIndex
CREATE UNIQUE INDEX "UserBlock_blockerId_blockedId_key" ON "UserBlock"("blockerId", "blockedId");

-- CreateIndex
CREATE UNIQUE INDEX "StudyGroup_slug_key" ON "StudyGroup"("slug");

-- CreateIndex
CREATE INDEX "StudyGroupMembership_userId_idx" ON "StudyGroupMembership"("userId");

-- CreateIndex
CREATE INDEX "StudyGroupMembership_groupId_role_idx" ON "StudyGroupMembership"("groupId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "StudyGroupMembership_groupId_userId_key" ON "StudyGroupMembership"("groupId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "StudyGroupInvitation_token_key" ON "StudyGroupInvitation"("token");

-- CreateIndex
CREATE INDEX "StudyGroupInvitation_groupId_inviteeId_idx" ON "StudyGroupInvitation"("groupId", "inviteeId");

-- CreateIndex
CREATE INDEX "StudyGroupInvitation_inviterId_idx" ON "StudyGroupInvitation"("inviterId");

-- CreateIndex
CREATE INDEX "StudyGroupJoinRequest_groupId_status_idx" ON "StudyGroupJoinRequest"("groupId", "status");

-- CreateIndex
CREATE INDEX "StudyGroupJoinRequest_userId_status_idx" ON "StudyGroupJoinRequest"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "StudyGroupJoinRequest_groupId_userId_key" ON "StudyGroupJoinRequest"("groupId", "userId");

-- CreateIndex
CREATE INDEX "GroupDiscussion_groupId_createdAt_idx" ON "GroupDiscussion"("groupId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "GroupDiscussion_isPinned_createdAt_idx" ON "GroupDiscussion"("isPinned", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "GroupDiscussionReply_discussionId_createdAt_idx" ON "GroupDiscussionReply"("discussionId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "GroupDiscussionReply_parentId_createdAt_idx" ON "GroupDiscussionReply"("parentId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "GroupMessage_groupId_createdAt_idx" ON "GroupMessage"("groupId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "GroupMessage_senderId_idx" ON "GroupMessage"("senderId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupPinnedItem_groupId_itemType_itemId_key" ON "GroupPinnedItem"("groupId", "itemType", "itemId");

-- CreateIndex
CREATE INDEX "GroupResource_groupId_resourceType_idx" ON "GroupResource"("groupId", "resourceType");

-- CreateIndex
CREATE INDEX "GroupResource_addedById_idx" ON "GroupResource"("addedById");

-- CreateIndex
CREATE INDEX "StudySession_groupId_startTime_idx" ON "StudySession"("groupId", "startTime");

-- CreateIndex
CREATE INDEX "StudySession_startTime_idx" ON "StudySession"("startTime");

-- CreateIndex
CREATE INDEX "StudySessionAttendance_userId_sessionId_idx" ON "StudySessionAttendance"("userId", "sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "StudySessionAttendance_sessionId_userId_key" ON "StudySessionAttendance"("sessionId", "userId");

-- CreateIndex
CREATE INDEX "GroupChallenge_groupId_idx" ON "GroupChallenge"("groupId");

-- CreateIndex
CREATE INDEX "GroupChallenge_startDate_endDate_idx" ON "GroupChallenge"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "GroupChallengeParticipation_userId_challengeId_idx" ON "GroupChallengeParticipation"("userId", "challengeId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupChallengeParticipation_challengeId_userId_key" ON "GroupChallengeParticipation"("challengeId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "CommunityPreference_userId_key" ON "CommunityPreference"("userId");

-- CreateIndex
CREATE INDEX "CareerGoal_userId_status_idx" ON "CareerGoal"("userId", "status");

-- CreateIndex
CREATE INDEX "CareerGoal_userId_createdAt_idx" ON "CareerGoal"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "CareerRoadmap_userId_status_idx" ON "CareerRoadmap"("userId", "status");

-- CreateIndex
CREATE INDEX "CareerRoadmap_userId_createdAt_idx" ON "CareerRoadmap"("userId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "RoadmapVersion_roadmapId_version_key" ON "RoadmapVersion"("roadmapId", "version");

-- CreateIndex
CREATE INDEX "RoadmapMilestone_roadmapId_idx" ON "RoadmapMilestone"("roadmapId");

-- CreateIndex
CREATE UNIQUE INDEX "RoadmapMilestone_roadmapId_order_key" ON "RoadmapMilestone"("roadmapId", "order");

-- CreateIndex
CREATE INDEX "RoadmapTask_roadmapId_status_idx" ON "RoadmapTask"("roadmapId", "status");

-- CreateIndex
CREATE INDEX "RoadmapTask_roadmapId_milestoneId_idx" ON "RoadmapTask"("roadmapId", "milestoneId");

-- CreateIndex
CREATE INDEX "RoadmapTask_roadmapId_dueDate_idx" ON "RoadmapTask"("roadmapId", "dueDate");

-- CreateIndex
CREATE INDEX "RoadmapTaskPrerequisite_taskId_idx" ON "RoadmapTaskPrerequisite"("taskId");

-- CreateIndex
CREATE INDEX "RoadmapTaskPrerequisite_prerequisiteId_idx" ON "RoadmapTaskPrerequisite"("prerequisiteId");

-- CreateIndex
CREATE UNIQUE INDEX "RoadmapTaskPrerequisite_taskId_prerequisiteId_key" ON "RoadmapTaskPrerequisite"("taskId", "prerequisiteId");

-- CreateIndex
CREATE INDEX "SkillEvidenceRecord_userId_skillId_idx" ON "SkillEvidenceRecord"("userId", "skillId");

-- CreateIndex
CREATE INDEX "SkillEvidenceRecord_userId_category_idx" ON "SkillEvidenceRecord"("userId", "category");

-- CreateIndex
CREATE INDEX "SkillEvidenceRecord_userId_evidenceType_idx" ON "SkillEvidenceRecord"("userId", "evidenceType");

-- CreateIndex
CREATE INDEX "LearningResource_resourceType_difficulty_idx" ON "LearningResource"("resourceType", "difficulty");

-- CreateIndex
CREATE INDEX "LearningResource_skillTags_idx" ON "LearningResource"("skillTags");

-- CreateIndex
CREATE INDEX "LearningResource_verificationStatus_idx" ON "LearningResource"("verificationStatus");

-- CreateIndex
CREATE INDEX "UserResourceInteraction_userId_timestamp_idx" ON "UserResourceInteraction"("userId", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "UserResourceInteraction_resourceId_interactionType_idx" ON "UserResourceInteraction"("resourceId", "interactionType");

-- CreateIndex
CREATE UNIQUE INDEX "UserResourceInteraction_userId_resourceId_interactionType_key" ON "UserResourceInteraction"("userId", "resourceId", "interactionType");

-- CreateIndex
CREATE INDEX "RoadmapRecommendation_userId_status_idx" ON "RoadmapRecommendation"("userId", "status");

-- CreateIndex
CREATE INDEX "RoadmapRecommendation_roadmapId_status_idx" ON "RoadmapRecommendation"("roadmapId", "status");

-- CreateIndex
CREATE INDEX "SkillGapRecord_userId_skillId_idx" ON "SkillGapRecord"("userId", "skillId");

-- CreateIndex
CREATE INDEX "SkillGapRecord_roadmapId_priority_idx" ON "SkillGapRecord"("roadmapId", "priority");

-- CreateIndex
CREATE INDEX "SkillGapRecord_userId_classification_idx" ON "SkillGapRecord"("userId", "classification");

-- CreateIndex
CREATE INDEX "RoadmapRecommendationEngine_userId_createdAt_idx" ON "RoadmapRecommendationEngine"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "ReadinessIndicator_userId_targetRole_idx" ON "ReadinessIndicator"("userId", "targetRole");

-- CreateIndex
CREATE UNIQUE INDEX "ReadinessIndicator_userId_targetRole_rubricVersion_key" ON "ReadinessIndicator"("userId", "targetRole", "rubricVersion");

-- CreateIndex
CREATE INDEX "RoadmapAdaptationLog_roadmapId_createdAt_idx" ON "RoadmapAdaptationLog"("roadmapId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "LearningStreak_userId_key" ON "LearningStreak"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_userId_type_channel_key" ON "NotificationPreference"("userId", "type", "channel");

-- CreateIndex
CREATE INDEX "InAppNotification_userId_readAt_createdAt_idx" ON "InAppNotification"("userId", "readAt", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "GamificationProfile_userId_key" ON "GamificationProfile"("userId");

-- CreateIndex
CREATE INDEX "XPTransaction_userId_createdAt_idx" ON "XPTransaction"("userId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "XPTransaction_userId_sourceRecordId_sourceRecordType_activi_key" ON "XPTransaction"("userId", "sourceRecordId", "sourceRecordType", "activityType");

-- CreateIndex
CREATE UNIQUE INDEX "AchievementDefinition_identifier_key" ON "AchievementDefinition"("identifier");

-- CreateIndex
CREATE INDEX "UserAchievement_userId_status_idx" ON "UserAchievement"("userId", "status");

-- CreateIndex
CREATE INDEX "UserAchievement_achievementDefinitionId_idx" ON "UserAchievement"("achievementDefinitionId");

-- CreateIndex
CREATE UNIQUE INDEX "UserAchievement_userId_achievementDefinitionId_key" ON "UserAchievement"("userId", "achievementDefinitionId");

-- CreateIndex
CREATE UNIQUE INDEX "ChallengeDefinition_identifier_key" ON "ChallengeDefinition"("identifier");

-- CreateIndex
CREATE INDEX "UserChallenge_userId_status_idx" ON "UserChallenge"("userId", "status");

-- CreateIndex
CREATE INDEX "UserChallenge_challengeDefinitionId_idx" ON "UserChallenge"("challengeDefinitionId");

-- CreateIndex
CREATE UNIQUE INDEX "UserChallenge_userId_challengeDefinitionId_key" ON "UserChallenge"("userId", "challengeDefinitionId");

-- CreateIndex
CREATE INDEX "LearningStreakHistory_userId_date_idx" ON "LearningStreakHistory"("userId", "date" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "LearningStreakHistory_userId_date_key" ON "LearningStreakHistory"("userId", "date");

-- CreateIndex
CREATE INDEX "WeeklyGoal_userId_periodStart_periodEnd_idx" ON "WeeklyGoal"("userId", "periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "PersonalBest_userId_metricType_idx" ON "PersonalBest"("userId", "metricType");

-- CreateIndex
CREATE UNIQUE INDEX "PersonalBest_userId_metricType_achievedAt_key" ON "PersonalBest"("userId", "metricType", "achievedAt");

-- CreateIndex
CREATE INDEX "LeaderboardEntry_scope_periodStart_periodEnd_rank_idx" ON "LeaderboardEntry"("scope", "periodStart", "periodEnd", "rank");

-- CreateIndex
CREATE UNIQUE INDEX "LeaderboardEntry_scope_periodStart_periodEnd_userId_key" ON "LeaderboardEntry"("scope", "periodStart", "periodEnd", "userId");

-- CreateIndex
CREATE INDEX "GamificationEvent_userId_createdAt_idx" ON "GamificationEvent"("userId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "CareerOpportunity_slug_key" ON "CareerOpportunity"("slug");

-- CreateIndex
CREATE INDEX "CareerOpportunity_companyId_status_idx" ON "CareerOpportunity"("companyId", "status");

-- CreateIndex
CREATE INDEX "CareerOpportunity_type_status_idx" ON "CareerOpportunity"("type", "status");

-- CreateIndex
CREATE INDEX "CareerOpportunity_workArrangement_status_idx" ON "CareerOpportunity"("workArrangement", "status");

-- CreateIndex
CREATE INDEX "CareerOpportunity_postedDate_idx" ON "CareerOpportunity"("postedDate" DESC);

-- CreateIndex
CREATE INDEX "CareerOpportunity_applicationDeadline_idx" ON "CareerOpportunity"("applicationDeadline");

-- CreateIndex
CREATE INDEX "CareerOpportunity_status_isRemote_isEntryLevel_idx" ON "CareerOpportunity"("status", "isRemote", "isEntryLevel");

-- CreateIndex
CREATE INDEX "CareerOpportunity_location_idx" ON "CareerOpportunity"("location");

-- CreateIndex
CREATE UNIQUE INDEX "OpportunitySource_slug_key" ON "OpportunitySource"("slug");

-- CreateIndex
CREATE INDEX "OpportunitySource_type_isActive_idx" ON "OpportunitySource"("type", "isActive");

-- CreateIndex
CREATE INDEX "OpportunitySource_permission_idx" ON "OpportunitySource"("permission");

-- CreateIndex
CREATE INDEX "OpportunitySourceSync_sourceId_startedAt_idx" ON "OpportunitySourceSync"("sourceId", "startedAt" DESC);

-- CreateIndex
CREATE INDEX "OpportunitySourceSync_status_idx" ON "OpportunitySourceSync"("status");

-- CreateIndex
CREATE INDEX "OpportunityChangeHistory_opportunityId_changedAt_idx" ON "OpportunityChangeHistory"("opportunityId", "changedAt" DESC);

-- CreateIndex
CREATE INDEX "SavedOpportunity_userId_createdAt_idx" ON "SavedOpportunity"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "SavedOpportunity_opportunityId_idx" ON "SavedOpportunity"("opportunityId");

-- CreateIndex
CREATE INDEX "DismissedOpportunity_userId_createdAt_idx" ON "DismissedOpportunity"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "OpportunityMatch_userId_overallScore_idx" ON "OpportunityMatch"("userId", "overallScore" DESC);

-- CreateIndex
CREATE INDEX "OpportunityMatch_userId_category_idx" ON "OpportunityMatch"("userId", "category");

-- CreateIndex
CREATE INDEX "OpportunityMatch_opportunityId_idx" ON "OpportunityMatch"("opportunityId");

-- CreateIndex
CREATE UNIQUE INDEX "OpportunityMatch_userId_opportunityId_key" ON "OpportunityMatch"("userId", "opportunityId");

-- CreateIndex
CREATE UNIQUE INDEX "JobSearchPreference_userId_key" ON "JobSearchPreference"("userId");

-- CreateIndex
CREATE INDEX "SavedJobSearch_userId_isDefault_idx" ON "SavedJobSearch"("userId", "isDefault");

-- CreateIndex
CREATE INDEX "JobDescriptionAnalysis_userId_createdAt_idx" ON "JobDescriptionAnalysis"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "JobDescriptionAnalysis_resumeVersionId_idx" ON "JobDescriptionAnalysis"("resumeVersionId");

-- CreateIndex
CREATE INDEX "JobDescriptionAnalysis_jobDescriptionId_idx" ON "JobDescriptionAnalysis"("jobDescriptionId");

-- CreateIndex
CREATE INDEX "JobSkillRequirement_analysisId_isRequired_idx" ON "JobSkillRequirement"("analysisId", "isRequired");

-- CreateIndex
CREATE INDEX "JobApplication_userId_status_idx" ON "JobApplication"("userId", "status");

-- CreateIndex
CREATE INDEX "JobApplication_userId_applicationDate_idx" ON "JobApplication"("userId", "applicationDate" DESC);

-- CreateIndex
CREATE INDEX "JobApplication_userId_nextFollowUpDate_idx" ON "JobApplication"("userId", "nextFollowUpDate");

-- CreateIndex
CREATE INDEX "JobApplication_opportunityId_idx" ON "JobApplication"("opportunityId");

-- CreateIndex
CREATE INDEX "JobApplication_companyId_idx" ON "JobApplication"("companyId");

-- CreateIndex
CREATE INDEX "ApplicationStatusHistory_applicationId_changedAt_idx" ON "ApplicationStatusHistory"("applicationId", "changedAt" DESC);

-- CreateIndex
CREATE INDEX "ApplicationNote_applicationId_createdAt_idx" ON "ApplicationNote"("applicationId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "ApplicationReminder_applicationId_dueDate_idx" ON "ApplicationReminder"("applicationId", "dueDate");

-- CreateIndex
CREATE INDEX "ApplicationReminder_dueDate_isCompleted_idx" ON "ApplicationReminder"("dueDate", "isCompleted");

-- CreateIndex
CREATE INDEX "ApplicationEvent_applicationId_eventDate_idx" ON "ApplicationEvent"("applicationId", "eventDate" DESC);

-- CreateIndex
CREATE INDEX "ApplicationEvent_eventDate_idx" ON "ApplicationEvent"("eventDate");

-- CreateIndex
CREATE INDEX "ApplicationAttachment_applicationId_idx" ON "ApplicationAttachment"("applicationId");

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreparationGoal" ADD CONSTRAINT "PreparationGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPreference" ADD CONSTRAINT "UserPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailVerificationToken" ADD CONSTRAINT "EmailVerificationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentSource" ADD CONSTRAINT "ContentSource_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentSource" ADD CONSTRAINT "ContentSource_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentSource" ADD CONSTRAINT "ContentSource_processId_fkey" FOREIGN KEY ("processId") REFERENCES "InterviewProcess"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentSource" ADD CONSTRAINT "ContentSource_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentSource" ADD CONSTRAINT "ContentSource_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "Experience"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewProcess" ADD CONSTRAINT "InterviewProcess_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionOption" ADD CONSTRAINT "QuestionOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionTag" ADD CONSTRAINT "QuestionTag_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionTag" ADD CONSTRAINT "QuestionTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionCompany" ADD CONSTRAINT "QuestionCompany_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionCompany" ADD CONSTRAINT "QuestionCompany_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Experience" ADD CONSTRAINT "Experience_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedQuestion" ADD CONSTRAINT "SavedQuestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedQuestion" ADD CONSTRAINT "SavedQuestion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportJob" ADD CONSTRAINT "ImportJob_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportRecord" ADD CONSTRAINT "ImportRecord_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "ImportJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeSession" ADD CONSTRAINT "PracticeSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeSessionQuestion" ADD CONSTRAINT "PracticeSessionQuestion_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "PracticeSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeSessionQuestion" ADD CONSTRAINT "PracticeSessionQuestion_generatedQuestionId_fkey" FOREIGN KEY ("generatedQuestionId") REFERENCES "GeneratedPracticeQuestion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPracticeAnswer" ADD CONSTRAINT "UserPracticeAnswer_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "PracticeSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnswerEvaluation" ADD CONSTRAINT "AnswerEvaluation_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "UserPracticeAnswer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedPracticeQuestion" ADD CONSTRAINT "GeneratedPracticeQuestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreparationPlan" ADD CONSTRAINT "PreparationPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreparationPlanVersion" ADD CONSTRAINT "PreparationPlanVersion_planId_fkey" FOREIGN KEY ("planId") REFERENCES "PreparationPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreparationPlanTask" ADD CONSTRAINT "PreparationPlanTask_planId_fkey" FOREIGN KEY ("planId") REFERENCES "PreparationPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIUsageRecord" ADD CONSTRAINT "AIUsageRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentSection" ADD CONSTRAINT "AssessmentSection_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentQuestion" ADD CONSTRAINT "AssessmentQuestion_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentQuestion" ADD CONSTRAINT "AssessmentQuestion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentAttempt" ADD CONSTRAINT "AssessmentAttempt_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentAttempt" ADD CONSTRAINT "AssessmentAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttemptAnswer" ADD CONSTRAINT "AttemptAnswer_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "AssessmentAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentResult" ADD CONSTRAINT "AssessmentResult_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "AssessmentAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resume" ADD CONSTRAINT "Resume_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumeVersion" ADD CONSTRAINT "ResumeVersion_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumeExtractedProfile" ADD CONSTRAINT "ResumeExtractedProfile_resumeVersionId_fkey" FOREIGN KEY ("resumeVersionId") REFERENCES "ResumeVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumeAnalysis" ADD CONSTRAINT "ResumeAnalysis_resumeVersionId_fkey" FOREIGN KEY ("resumeVersionId") REFERENCES "ResumeVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumeAnalysisCategory" ADD CONSTRAINT "ResumeAnalysisCategory_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "ResumeAnalysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumeRecommendation" ADD CONSTRAINT "ResumeRecommendation_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "ResumeAnalysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumeRewriteSuggestion" ADD CONSTRAINT "ResumeRewriteSuggestion_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "ResumeAnalysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobDescription" ADD CONSTRAINT "JobDescription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobMatch" ADD CONSTRAINT "JobMatch_resumeVersionId_fkey" FOREIGN KEY ("resumeVersionId") REFERENCES "ResumeVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobMatch" ADD CONSTRAINT "JobMatch_jobDescriptionId_fkey" FOREIGN KEY ("jobDescriptionId") REFERENCES "JobDescription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillGap" ADD CONSTRAINT "SkillGap_resumeVersionId_fkey" FOREIGN KEY ("resumeVersionId") REFERENCES "ResumeVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumeProcessingJob" ADD CONSTRAINT "ResumeProcessingJob_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MockInterviewSession" ADD CONSTRAINT "MockInterviewSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MockInterviewSession" ADD CONSTRAINT "MockInterviewSession_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MockInterviewSession" ADD CONSTRAINT "MockInterviewSession_resumeVersionId_fkey" FOREIGN KEY ("resumeVersionId") REFERENCES "ResumeVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MockInterviewQuestion" ADD CONSTRAINT "MockInterviewQuestion_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "MockInterviewSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MockInterviewAnswer" ADD CONSTRAINT "MockInterviewAnswer_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "MockInterviewSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MockInterviewAnswer" ADD CONSTRAINT "MockInterviewAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "MockInterviewQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MockInterviewAnswer" ADD CONSTRAINT "MockInterviewAnswer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MockInterviewEvaluation" ADD CONSTRAINT "MockInterviewEvaluation_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "MockInterviewSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MockInterviewEvaluation" ADD CONSTRAINT "MockInterviewEvaluation_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "MockInterviewQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MockInterviewEvaluation" ADD CONSTRAINT "MockInterviewEvaluation_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "MockInterviewAnswer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MockInterviewReport" ADD CONSTRAINT "MockInterviewReport_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "MockInterviewSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MockInterviewReport" ADD CONSTRAINT "MockInterviewReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MockInterviewGenerationJob" ADD CONSTRAINT "MockInterviewGenerationJob_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "MockInterviewSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoiceSession" ADD CONSTRAINT "VoiceSession_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "MockInterviewSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoiceCapture" ADD CONSTRAINT "VoiceCapture_voiceSessionId_fkey" FOREIGN KEY ("voiceSessionId") REFERENCES "VoiceSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoiceTranscript" ADD CONSTRAINT "VoiceTranscript_captureId_fkey" FOREIGN KEY ("captureId") REFERENCES "VoiceCapture"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TranscriptSegment" ADD CONSTRAINT "TranscriptSegment_transcriptId_fkey" FOREIGN KEY ("transcriptId") REFERENCES "VoiceTranscript"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoiceAnalysis" ADD CONSTRAINT "VoiceAnalysis_captureId_fkey" FOREIGN KEY ("captureId") REFERENCES "VoiceCapture"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoiceProcessingJob" ADD CONSTRAINT "VoiceProcessingJob_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "VoiceSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoiceProcessingJob" ADD CONSTRAINT "VoiceProcessingJob_captureId_fkey" FOREIGN KEY ("captureId") REFERENCES "VoiceCapture"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoiceConsentLog" ADD CONSTRAINT "VoiceConsentLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoiceUsageRecord" ADD CONSTRAINT "VoiceUsageRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFollowedTopic" ADD CONSTRAINT "UserFollowedTopic_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFollowedTopic" ADD CONSTRAINT "UserFollowedTopic_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "CommunityTopic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityPost" ADD CONSTRAINT "CommunityPost_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "CommunityTopic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityPost" ADD CONSTRAINT "CommunityPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityPost" ADD CONSTRAINT "CommunityPost_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityComment" ADD CONSTRAINT "CommunityComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "CommunityPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityComment" ADD CONSTRAINT "CommunityComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityComment" ADD CONSTRAINT "CommunityComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "CommunityComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostReaction" ADD CONSTRAINT "PostReaction_postId_fkey" FOREIGN KEY ("postId") REFERENCES "CommunityPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostReaction" ADD CONSTRAINT "PostReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedCommunityPost" ADD CONSTRAINT "SavedCommunityPost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedCommunityPost" ADD CONSTRAINT "SavedCommunityPost_postId_fkey" FOREIGN KEY ("postId") REFERENCES "CommunityPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityReport" ADD CONSTRAINT "CommunityReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityReport" ADD CONSTRAINT "CommunityReport_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFollow" ADD CONSTRAINT "UserFollow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFollow" ADD CONSTRAINT "UserFollow_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBlock" ADD CONSTRAINT "UserBlock_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBlock" ADD CONSTRAINT "UserBlock_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyGroupMembership" ADD CONSTRAINT "StudyGroupMembership_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "StudyGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyGroupMembership" ADD CONSTRAINT "StudyGroupMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyGroupInvitation" ADD CONSTRAINT "StudyGroupInvitation_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "StudyGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyGroupInvitation" ADD CONSTRAINT "StudyGroupInvitation_inviteeId_fkey" FOREIGN KEY ("inviteeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyGroupInvitation" ADD CONSTRAINT "StudyGroupInvitation_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyGroupJoinRequest" ADD CONSTRAINT "StudyGroupJoinRequest_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "StudyGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyGroupJoinRequest" ADD CONSTRAINT "StudyGroupJoinRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyGroupJoinRequest" ADD CONSTRAINT "StudyGroupJoinRequest_respondedById_fkey" FOREIGN KEY ("respondedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupDiscussion" ADD CONSTRAINT "GroupDiscussion_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "StudyGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupDiscussion" ADD CONSTRAINT "GroupDiscussion_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupDiscussion" ADD CONSTRAINT "GroupDiscussion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupDiscussionReply" ADD CONSTRAINT "GroupDiscussionReply_discussionId_fkey" FOREIGN KEY ("discussionId") REFERENCES "GroupDiscussion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupDiscussionReply" ADD CONSTRAINT "GroupDiscussionReply_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupDiscussionReply" ADD CONSTRAINT "GroupDiscussionReply_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "GroupDiscussionReply"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMessage" ADD CONSTRAINT "GroupMessage_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "StudyGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMessage" ADD CONSTRAINT "GroupMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupPinnedItem" ADD CONSTRAINT "GroupPinnedItem_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "StudyGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupPinnedItem" ADD CONSTRAINT "GroupPinnedItem_pinnedById_fkey" FOREIGN KEY ("pinnedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupResource" ADD CONSTRAINT "GroupResource_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "StudyGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupResource" ADD CONSTRAINT "GroupResource_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "LearningResource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupResource" ADD CONSTRAINT "GroupResource_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudySession" ADD CONSTRAINT "StudySession_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "StudyGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudySession" ADD CONSTRAINT "StudySession_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudySessionAttendance" ADD CONSTRAINT "StudySessionAttendance_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "StudySession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudySessionAttendance" ADD CONSTRAINT "StudySessionAttendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupChallenge" ADD CONSTRAINT "GroupChallenge_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "StudyGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupChallenge" ADD CONSTRAINT "GroupChallenge_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupChallengeParticipation" ADD CONSTRAINT "GroupChallengeParticipation_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "GroupChallenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupChallengeParticipation" ADD CONSTRAINT "GroupChallengeParticipation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityPreference" ADD CONSTRAINT "CommunityPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerGoal" ADD CONSTRAINT "CareerGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerRoadmap" ADD CONSTRAINT "CareerRoadmap_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerRoadmap" ADD CONSTRAINT "CareerRoadmap_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "CareerGoal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoadmapVersion" ADD CONSTRAINT "RoadmapVersion_roadmapId_fkey" FOREIGN KEY ("roadmapId") REFERENCES "CareerRoadmap"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoadmapMilestone" ADD CONSTRAINT "RoadmapMilestone_roadmapId_fkey" FOREIGN KEY ("roadmapId") REFERENCES "CareerRoadmap"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoadmapTask" ADD CONSTRAINT "RoadmapTask_roadmapId_fkey" FOREIGN KEY ("roadmapId") REFERENCES "CareerRoadmap"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoadmapTask" ADD CONSTRAINT "RoadmapTask_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "RoadmapMilestone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoadmapTaskPrerequisite" ADD CONSTRAINT "RoadmapTaskPrerequisite_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "RoadmapTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoadmapTaskPrerequisite" ADD CONSTRAINT "RoadmapTaskPrerequisite_prerequisiteId_fkey" FOREIGN KEY ("prerequisiteId") REFERENCES "RoadmapTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillEvidenceRecord" ADD CONSTRAINT "SkillEvidenceRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserResourceInteraction" ADD CONSTRAINT "UserResourceInteraction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserResourceInteraction" ADD CONSTRAINT "UserResourceInteraction_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "LearningResource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoadmapRecommendation" ADD CONSTRAINT "RoadmapRecommendation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoadmapRecommendation" ADD CONSTRAINT "RoadmapRecommendation_roadmapId_fkey" FOREIGN KEY ("roadmapId") REFERENCES "CareerRoadmap"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillGapRecord" ADD CONSTRAINT "SkillGapRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillGapRecord" ADD CONSTRAINT "SkillGapRecord_roadmapId_fkey" FOREIGN KEY ("roadmapId") REFERENCES "CareerRoadmap"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoadmapRecommendationEngine" ADD CONSTRAINT "RoadmapRecommendationEngine_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoadmapRecommendationEngine" ADD CONSTRAINT "RoadmapRecommendationEngine_roadmapId_fkey" FOREIGN KEY ("roadmapId") REFERENCES "CareerRoadmap"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadinessIndicator" ADD CONSTRAINT "ReadinessIndicator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoadmapAdaptationLog" ADD CONSTRAINT "RoadmapAdaptationLog_roadmapId_fkey" FOREIGN KEY ("roadmapId") REFERENCES "CareerRoadmap"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningStreak" ADD CONSTRAINT "LearningStreak_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InAppNotification" ADD CONSTRAINT "InAppNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GamificationProfile" ADD CONSTRAINT "GamificationProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "XPTransaction" ADD CONSTRAINT "XPTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_achievementDefinitionId_fkey" FOREIGN KEY ("achievementDefinitionId") REFERENCES "AchievementDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserChallenge" ADD CONSTRAINT "UserChallenge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserChallenge" ADD CONSTRAINT "UserChallenge_challengeDefinitionId_fkey" FOREIGN KEY ("challengeDefinitionId") REFERENCES "ChallengeDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningStreakHistory" ADD CONSTRAINT "LearningStreakHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyGoal" ADD CONSTRAINT "WeeklyGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalBest" ADD CONSTRAINT "PersonalBest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaderboardEntry" ADD CONSTRAINT "LeaderboardEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GamificationEvent" ADD CONSTRAINT "GamificationEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerOpportunity" ADD CONSTRAINT "CareerOpportunity_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerOpportunity" ADD CONSTRAINT "CareerOpportunity_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "OpportunitySource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunitySourceSync" ADD CONSTRAINT "OpportunitySourceSync_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "OpportunitySource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunityChangeHistory" ADD CONSTRAINT "OpportunityChangeHistory_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "CareerOpportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedOpportunity" ADD CONSTRAINT "SavedOpportunity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedOpportunity" ADD CONSTRAINT "SavedOpportunity_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "CareerOpportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DismissedOpportunity" ADD CONSTRAINT "DismissedOpportunity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DismissedOpportunity" ADD CONSTRAINT "DismissedOpportunity_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "CareerOpportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunityMatch" ADD CONSTRAINT "OpportunityMatch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunityMatch" ADD CONSTRAINT "OpportunityMatch_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "CareerOpportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobSearchPreference" ADD CONSTRAINT "JobSearchPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedJobSearch" ADD CONSTRAINT "SavedJobSearch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobDescriptionAnalysis" ADD CONSTRAINT "JobDescriptionAnalysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobDescriptionAnalysis" ADD CONSTRAINT "JobDescriptionAnalysis_resumeVersionId_fkey" FOREIGN KEY ("resumeVersionId") REFERENCES "ResumeVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobDescriptionAnalysis" ADD CONSTRAINT "JobDescriptionAnalysis_jobDescriptionId_fkey" FOREIGN KEY ("jobDescriptionId") REFERENCES "JobDescription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobSkillRequirement" ADD CONSTRAINT "JobSkillRequirement_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "JobDescriptionAnalysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "CareerOpportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_resumeVersionId_fkey" FOREIGN KEY ("resumeVersionId") REFERENCES "ResumeVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_mockInterviewSessionId_fkey" FOREIGN KEY ("mockInterviewSessionId") REFERENCES "MockInterviewSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationStatusHistory" ADD CONSTRAINT "ApplicationStatusHistory_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "JobApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationNote" ADD CONSTRAINT "ApplicationNote_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "JobApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationReminder" ADD CONSTRAINT "ApplicationReminder_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "JobApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationEvent" ADD CONSTRAINT "ApplicationEvent_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "JobApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationAttachment" ADD CONSTRAINT "ApplicationAttachment_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "JobApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
