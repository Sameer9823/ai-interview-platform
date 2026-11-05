import { emptyProfile, type Profile } from "./dev-store";
import type { ExperienceLevel, EducationLevel } from "@prisma/client";

type Raw = Record<string, unknown>;
const text = (v: unknown) => (typeof v === "string" && v !== "" ? v : undefined);
const int = (v: unknown) => (typeof v === "number" ? v : undefined);
const experienceLevel = (v: unknown): ExperienceLevel | undefined => {
  if (typeof v !== "string" || v === "") return undefined;
  return v as ExperienceLevel;
};
const educationLevel = (v: unknown): EducationLevel | undefined => {
  if (typeof v !== "string" || v === "") return undefined;
  return v as EducationLevel;
};

/** Picks only known profile fields from validated data. Anything else is dropped. */
export function toProfile(data: Raw): Profile {
  return {
    ...emptyProfile(),
    careerDomain: text(data.careerDomain),
    targetRole: text(data.targetRole),
    experienceLevel: experienceLevel(data.experienceLevel),
    educationLevel: educationLevel(data.educationLevel),
    degree: text(data.degree),
    graduationYear: int(data.graduationYear),
    primaryProgrammingLanguage: text(data.primaryProgrammingLanguage),
    currentRole: text(data.currentRole),
    yearsOfExperience: int(data.yearsOfExperience),
    skillsToImprove: Array.isArray(data.skillsToImprove) ? (data.skillsToImprove as string[]) : [],
  };
}
