import { z } from "zod";

/** Form inputs arrive as strings. Empty string means "not provided". */
const clean = (v: unknown) => (typeof v === "string" ? (v.trim() === "" ? undefined : v.trim()) : v);
const toNumber = (v: unknown) => (v === "" || v === null || v === undefined ? undefined : Number(v));

export const optionalText = (max: number) => z.preprocess(clean, z.string().max(max, `Use ${max} characters or fewer`).optional());
export const requiredText = (min: number, max: number, message: string) =>
  z.preprocess(clean, z.string({ message }).min(min, message).max(max, `Use ${max} characters or fewer`));
export const optionalInt = (min: number, max: number) =>
  z.preprocess(
    toNumber,
    z.number().int("Enter a whole number").min(min, `Enter ${min} or more`).max(max, `Enter ${max} or less`).optional(),
  );
export const requiredInt = (min: number, max: number, message = "Enter a number") =>
  z.preprocess(
    toNumber,
    z.number({ message }).int("Enter a whole number").min(min, `Enter ${min} or more`).max(max, `Enter ${max} or less`),
  );

export const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Enter your email")
  .max(254, "Email is too long")
  .email("Enter a valid email address");
export const nameField = z.string().trim().min(2, "Enter your full name").max(80, "Name is too long");
export const passwordField = z
  .string()
  .min(10, "Use at least 10 characters")
  .max(128, "Use 128 characters or fewer")
  .regex(/[A-Za-z]/, "Include at least one letter")
  .regex(/[0-9]/, "Include at least one number");

export const careerStageField = z.enum(["STUDENT", "FRESHER", "PROFESSIONAL"], { message: "Choose your career stage" });
export const educationLevelField = z.enum(["HIGH_SCHOOL", "DIPLOMA", "BACHELORS", "MASTERS", "DOCTORATE", "OTHER"], {
  message: "Choose your education level",
});
export const experienceLevelField = z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"], { message: "Choose your experience level" });
export const GOAL_VALUES = [
  "TECHNICAL_INTERVIEWS",
  "APTITUDE_REASONING",
  "CODING_DSA",
  "BEHAVIORAL_HR",
  "SYSTEM_DESIGN",
  "COMMUNICATION",
  "CAREER_TRANSITION",
] as const;
export const goalCategoryField = z.enum(GOAL_VALUES, { message: "Choose a valid goal" });

/** Accepts an array or a comma separated string. Duplicates are removed. */
export const goalsField = z.preprocess(
  (v) =>
    typeof v === "string"
      ? v
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : (v ?? []),
  z
    .array(goalCategoryField)
    .max(GOAL_VALUES.length)
    .transform((a) => [...new Set(a)]),
);
export const skillsField = z.preprocess(
  (v) =>
    typeof v === "string"
      ? v
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : (v ?? []),
  z
    .array(z.string().max(40, "Each skill must be 40 characters or fewer"))
    .max(10, "Add up to 10 skills")
    .transform((a) => [...new Set(a)]),
);
