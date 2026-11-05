import { z } from "zod";
import { goalsField, nameField } from "./common";
import { commonProfileShape, professionalProfileShape, studentProfileShape } from "./onboarding";

export const studentProfileSchema = z.object({ name: nameField, ...commonProfileShape, ...studentProfileShape });
export const professionalProfileSchema = z.object({ name: nameField, ...commonProfileShape, ...professionalProfileShape });

/** Pick the schema from the server side career stage. Never from a form field. */
export function profileSchemaFor(stage: "STUDENT" | "FRESHER" | "PROFESSIONAL") {
  return stage === "PROFESSIONAL" ? professionalProfileSchema : studentProfileSchema;
}

export const goalsSchema = z.object({ goals: goalsField });

export const preferencesSchema = z.object({
  theme: z.enum(["SYSTEM", "LIGHT", "DARK"], { message: "Choose a theme" }),
  emailNotifications: z.boolean(),
  productUpdates: z.boolean(),
  timezone: z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : v), z.string().max(64).optional()),
});
