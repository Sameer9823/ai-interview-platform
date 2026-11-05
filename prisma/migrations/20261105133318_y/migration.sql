-- CreateEnum
CREATE TYPE "SkillEvidenceSource" AS ENUM ('RESUME_ANALYSIS', 'USER_CONFIRMED', 'PRACTICE_EVALUATION', 'ASSESSMENT_RESULT', 'CODING_EVALUATION', 'MOCK_INTERVIEW', 'BEHAVIORAL_INTERVIEW', 'VOICE_INTERVIEW', 'SELF_REPORTED', 'ROADMAP_TASK', 'JOB_DESCRIPTION_ANALYSIS', 'OPPORTUNITY_MATCH', 'COMPANY_QUESTION', 'EXTERNAL_CERTIFICATION');

-- CreateEnum
CREATE TYPE "ReadinessLevel" AS ENUM ('NOT_ASSESSED', 'GETTING_STARTED', 'DEVELOPING', 'DEMONSTRATED', 'CONSISTENTLY_DEMONSTRATED');

-- CreateEnum
CREATE TYPE "ReadinessDimension" AS ENUM ('TECHNICAL_SKILLS', 'PROBLEM_SOLVING', 'APTITUDE', 'COMMUNICATION', 'BEHAVIORAL_INTERVIEW', 'ROLE_SPECIFIC_KNOWLEDGE', 'RESUME_PRESENTATION', 'PRACTICAL_ASSESSMENT', 'INTERVIEW_PRACTICE_CONSISTENCY');

-- CreateEnum
CREATE TYPE "RecommendationType" AS ENUM ('LEARN_CONCEPT', 'PRACTICE_QUESTIONS', 'TAKE_ASSESSMENT', 'COMPLETE_CODING_EXERCISE', 'IMPROVE_RESUME', 'PERFORM_MOCK_INTERVIEW', 'COMPLETE_ROADMAP_TASK', 'REVIEW_MISTAKES', 'PREPARE_FOR_OPPORTUNITY', 'UPDATE_GOALS', 'PRACTICE_BEHAVIORAL', 'PRACTICE_VOICE', 'COMPLETE_MILESTONE', 'REVIEW_WEAK_TOPICS');

-- CreateEnum
CREATE TYPE "RecommendationPriority" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'OPTIONAL');

-- CreateEnum
CREATE TYPE "CareerReportStatus" AS ENUM ('DRAFT', 'GENERATING', 'COMPLETED', 'FAILED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "RoleFrameworkStatus" AS ENUM ('DRAFT', 'ACTIVE', 'DEPRECATED', 'ARCHIVED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SkillEvidenceClassification" ADD VALUE 'CONSISTENTLY_DEMONSTRATED';
ALTER TYPE "SkillEvidenceClassification" ADD VALUE 'PARTIALLY_DEMONSTRATED';
ALTER TYPE "SkillEvidenceClassification" ADD VALUE 'INSUFFICIENT_EVIDENCE';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SkillEvidenceType" ADD VALUE 'VOICE_INTERVIEW';
ALTER TYPE "SkillEvidenceType" ADD VALUE 'ROADMAP_TASK';
ALTER TYPE "SkillEvidenceType" ADD VALUE 'JOB_DESCRIPTION_ANALYSIS';
ALTER TYPE "SkillEvidenceType" ADD VALUE 'OPPORTUNITY_MATCH';
ALTER TYPE "SkillEvidenceType" ADD VALUE 'COMPANY_QUESTION';
ALTER TYPE "SkillEvidenceType" ADD VALUE 'EXTERNAL_CERTIFICATION';

-- CreateTable
CREATE TABLE "CareerIntelligenceSnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetRole" TEXT,
    "careerStage" "CareerStage",
    "overallScore" DOUBLE PRECISION,
    "evidenceCoverage" DOUBLE PRECISION,
    "snapshotData" JSONB NOT NULL,
    "methodologyVersion" TEXT NOT NULL DEFAULT '1.0',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareerIntelligenceSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillEvidenceAggregate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "skillName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "classification" "SkillEvidenceClassification" NOT NULL,
    "proficiencyScore" DOUBLE PRECISION,
    "confidence" DOUBLE PRECISION,
    "totalEvidenceCount" INTEGER NOT NULL DEFAULT 0,
    "demonstratedCount" INTEGER NOT NULL DEFAULT 0,
    "selfReportedCount" INTEGER NOT NULL DEFAULT 0,
    "lastDemonstratedAt" TIMESTAMP(3),
    "lastAssessedAt" TIMESTAMP(3),
    "evidenceSources" JSONB NOT NULL DEFAULT '[]',
    "sourceRecordIds" TEXT[],
    "targetRoles" TEXT[],
    "rubricVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SkillEvidenceAggregate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoleFramework" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" "RoleFrameworkStatus" NOT NULL DEFAULT 'DRAFT',
    "currentVersion" INTEGER NOT NULL DEFAULT 1,
    "methodologyVersion" TEXT NOT NULL DEFAULT '1.0',
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoleFramework_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoleFrameworkVersion" (
    "id" TEXT NOT NULL,
    "frameworkId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "changeReason" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoleFrameworkVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoleSkillRequirement" (
    "id" TEXT NOT NULL,
    "frameworkId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "skillName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "importance" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "expectedProficiency" DOUBLE PRECISION NOT NULL DEFAULT 70.0,
    "prerequisites" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "evidenceTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "assessmentRecommendations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "practiceRecommendations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoleSkillRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillPrerequisite" (
    "id" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "skillName" TEXT NOT NULL,
    "prerequisiteId" TEXT NOT NULL,
    "prerequisiteName" TEXT NOT NULL,
    "relationshipType" TEXT NOT NULL DEFAULT 'REQUIRED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SkillPrerequisite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReadinessAssessment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetRole" TEXT NOT NULL,
    "careerStage" "CareerStage",
    "frameworkId" TEXT,
    "overallReadiness" "ReadinessLevel" NOT NULL,
    "overallScore" DOUBLE PRECISION NOT NULL,
    "dimensionResults" JSONB NOT NULL,
    "evidenceCoverage" JSONB NOT NULL,
    "limitations" TEXT,
    "methodologyVersion" TEXT NOT NULL DEFAULT '1.0',
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReadinessAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReadinessDimensionDetail" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "dimension" "ReadinessDimension" NOT NULL,
    "level" "ReadinessLevel" NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "evidenceCount" INTEGER NOT NULL,
    "demonstratedSkills" TEXT[],
    "missingSkills" TEXT[],
    "selfReportedSkills" TEXT[],
    "needsAssessment" TEXT[],
    "explanation" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReadinessDimensionDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillGapAnalysis" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetRole" TEXT NOT NULL,
    "frameworkId" TEXT,
    "gaps" JSONB NOT NULL,
    "prioritizedGaps" JSONB NOT NULL,
    "methodologyVersion" TEXT NOT NULL DEFAULT '1.0',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SkillGapAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareerRecommendation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "RecommendationType" NOT NULL,
    "priority" "RecommendationPriority" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "evidence" JSONB NOT NULL DEFAULT '[]',
    "targetSkillId" TEXT,
    "targetSkillName" TEXT,
    "targetRole" TEXT,
    "relatedFrameworkId" TEXT,
    "suggestedActions" JSONB NOT NULL DEFAULT '[]',
    "estimatedMinutes" INTEGER,
    "expectedOutcome" TEXT,
    "route" TEXT,
    "actionLabel" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "dismissedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "methodologyVersion" TEXT NOT NULL DEFAULT '1.0',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareerRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareerReport" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetRole" TEXT NOT NULL,
    "status" "CareerReportStatus" NOT NULL DEFAULT 'DRAFT',
    "reportVersion" INTEGER NOT NULL DEFAULT 1,
    "methodologyVersion" TEXT NOT NULL DEFAULT '1.0',
    "reportData" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3),
    "generatedBy" TEXT,
    "pdfStorageKey" TEXT,
    "pdfGeneratedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareerReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareerReportVersion" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "changeReason" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CareerReportVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScoringMethodologyVersion" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "rulesJson" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScoringMethodologyVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareerIntelligenceSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "defaultTargetRole" TEXT,
    "preferredFrameworkId" TEXT,
    "notificationEnabled" BOOLEAN NOT NULL DEFAULT true,
    "autoGenerateReports" BOOLEAN NOT NULL DEFAULT false,
    "reportFrequency" TEXT,
    "includeVoiceMetrics" BOOLEAN NOT NULL DEFAULT false,
    "privacyLevel" TEXT NOT NULL DEFAULT 'PRIVATE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareerIntelligenceSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CareerIntelligenceSnapshot_userId_targetRole_idx" ON "CareerIntelligenceSnapshot"("userId", "targetRole");

-- CreateIndex
CREATE INDEX "CareerIntelligenceSnapshot_userId_createdAt_idx" ON "CareerIntelligenceSnapshot"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "SkillEvidenceAggregate_userId_category_idx" ON "SkillEvidenceAggregate"("userId", "category");

-- CreateIndex
CREATE INDEX "SkillEvidenceAggregate_userId_classification_idx" ON "SkillEvidenceAggregate"("userId", "classification");

-- CreateIndex
CREATE INDEX "SkillEvidenceAggregate_userId_proficiencyScore_idx" ON "SkillEvidenceAggregate"("userId", "proficiencyScore" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "SkillEvidenceAggregate_userId_skillId_key" ON "SkillEvidenceAggregate"("userId", "skillId");

-- CreateIndex
CREATE UNIQUE INDEX "RoleFramework_identifier_key" ON "RoleFramework"("identifier");

-- CreateIndex
CREATE INDEX "RoleFrameworkVersion_frameworkId_idx" ON "RoleFrameworkVersion"("frameworkId");

-- CreateIndex
CREATE UNIQUE INDEX "RoleFrameworkVersion_frameworkId_version_key" ON "RoleFrameworkVersion"("frameworkId", "version");

-- CreateIndex
CREATE INDEX "RoleSkillRequirement_frameworkId_importance_idx" ON "RoleSkillRequirement"("frameworkId", "importance" DESC);

-- CreateIndex
CREATE INDEX "RoleSkillRequirement_frameworkId_category_idx" ON "RoleSkillRequirement"("frameworkId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "RoleSkillRequirement_frameworkId_skillId_key" ON "RoleSkillRequirement"("frameworkId", "skillId");

-- CreateIndex
CREATE INDEX "SkillPrerequisite_skillId_idx" ON "SkillPrerequisite"("skillId");

-- CreateIndex
CREATE INDEX "SkillPrerequisite_prerequisiteId_idx" ON "SkillPrerequisite"("prerequisiteId");

-- CreateIndex
CREATE UNIQUE INDEX "SkillPrerequisite_skillId_prerequisiteId_key" ON "SkillPrerequisite"("skillId", "prerequisiteId");

-- CreateIndex
CREATE INDEX "ReadinessAssessment_userId_targetRole_idx" ON "ReadinessAssessment"("userId", "targetRole");

-- CreateIndex
CREATE INDEX "ReadinessAssessment_userId_generatedAt_idx" ON "ReadinessAssessment"("userId", "generatedAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "ReadinessAssessment_userId_targetRole_methodologyVersion_key" ON "ReadinessAssessment"("userId", "targetRole", "methodologyVersion");

-- CreateIndex
CREATE INDEX "ReadinessDimensionDetail_assessmentId_idx" ON "ReadinessDimensionDetail"("assessmentId");

-- CreateIndex
CREATE UNIQUE INDEX "ReadinessDimensionDetail_assessmentId_dimension_key" ON "ReadinessDimensionDetail"("assessmentId", "dimension");

-- CreateIndex
CREATE INDEX "SkillGapAnalysis_userId_targetRole_idx" ON "SkillGapAnalysis"("userId", "targetRole");

-- CreateIndex
CREATE INDEX "SkillGapAnalysis_userId_createdAt_idx" ON "SkillGapAnalysis"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "CareerRecommendation_userId_status_idx" ON "CareerRecommendation"("userId", "status");

-- CreateIndex
CREATE INDEX "CareerRecommendation_userId_priority_createdAt_idx" ON "CareerRecommendation"("userId", "priority", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "CareerRecommendation_userId_targetRole_idx" ON "CareerRecommendation"("userId", "targetRole");

-- CreateIndex
CREATE INDEX "CareerRecommendation_targetSkillId_idx" ON "CareerRecommendation"("targetSkillId");

-- CreateIndex
CREATE INDEX "CareerReport_userId_targetRole_idx" ON "CareerReport"("userId", "targetRole");

-- CreateIndex
CREATE INDEX "CareerReport_userId_createdAt_idx" ON "CareerReport"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "CareerReportVersion_reportId_idx" ON "CareerReportVersion"("reportId");

-- CreateIndex
CREATE UNIQUE INDEX "CareerReportVersion_reportId_version_key" ON "CareerReportVersion"("reportId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "ScoringMethodologyVersion_version_key" ON "ScoringMethodologyVersion"("version");

-- CreateIndex
CREATE INDEX "ScoringMethodologyVersion_isActive_idx" ON "ScoringMethodologyVersion"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "CareerIntelligenceSettings_userId_key" ON "CareerIntelligenceSettings"("userId");

-- AddForeignKey
ALTER TABLE "CareerIntelligenceSnapshot" ADD CONSTRAINT "CareerIntelligenceSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillEvidenceAggregate" ADD CONSTRAINT "SkillEvidenceAggregate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleFrameworkVersion" ADD CONSTRAINT "RoleFrameworkVersion_frameworkId_fkey" FOREIGN KEY ("frameworkId") REFERENCES "RoleFramework"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleSkillRequirement" ADD CONSTRAINT "RoleSkillRequirement_frameworkId_fkey" FOREIGN KEY ("frameworkId") REFERENCES "RoleFramework"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadinessAssessment" ADD CONSTRAINT "ReadinessAssessment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadinessAssessment" ADD CONSTRAINT "ReadinessAssessment_frameworkId_fkey" FOREIGN KEY ("frameworkId") REFERENCES "RoleFramework"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadinessDimensionDetail" ADD CONSTRAINT "ReadinessDimensionDetail_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "ReadinessAssessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillGapAnalysis" ADD CONSTRAINT "SkillGapAnalysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillGapAnalysis" ADD CONSTRAINT "SkillGapAnalysis_frameworkId_fkey" FOREIGN KEY ("frameworkId") REFERENCES "RoleFramework"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerRecommendation" ADD CONSTRAINT "CareerRecommendation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerReport" ADD CONSTRAINT "CareerReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerReportVersion" ADD CONSTRAINT "CareerReportVersion_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "CareerReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerIntelligenceSettings" ADD CONSTRAINT "CareerIntelligenceSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
