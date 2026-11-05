import { z } from "zod";
import {
  careerStageField,
  educationLevelField,
  experienceLevelField,
  goalsField,
  optionalInt,
  optionalText,
  requiredInt,
  requiredText,
  skillsField,
} from "./common";

const thisYear = new Date().getFullYear();

/** Fields every career stage provides. Preferred language is fixed to English for now. */
export const commonProfileShape = {
  careerDomain: requiredText(2, 80, "Enter your preferred career domain"),
  targetRole: requiredText(2, 80, "Enter your target role"),
  experienceLevel: experienceLevelField,
};
export const studentProfileShape = {
  educationLevel: educationLevelField,
  degree: requiredText(2, 100, "Enter your degree or specialization"),
  graduationYear: optionalInt(1990, thisYear + 8),
  primaryProgrammingLanguage: optionalText(40),
};
export const professionalProfileShape = {
  currentRole: optionalText(80),
  yearsOfExperience: requiredInt(0, 60, "Enter your years of experience"),
  skillsToImprove: skillsField,
};

const student = <S extends "STUDENT" | "FRESHER">(stage: S) =>
  z.object({ careerStage: z.literal(stage), ...commonProfileShape, ...studentProfileShape, goals: goalsField });
const professional = z.object({
  careerStage: z.literal("PROFESSIONAL"),
  ...commonProfileShape,
  ...professionalProfileShape,
  goals: goalsField,
});

/** Validates the whole onboarding payload. Career stage selects which fields apply. */
export const onboardingSchema = z.discriminatedUnion("careerStage", [student("STUDENT"), student("FRESHER"), professional]);
export const careerStageSchema = z.object({ careerStage: careerStageField });

export type OnboardingInput = z.infer<typeof onboardingSchema>;
