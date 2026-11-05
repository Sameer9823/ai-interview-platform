import { emptyProfile, type Profile } from "./dev-store";

type Raw = Record<string, unknown>;
const text = (v: unknown) => (typeof v === "string" && v !== "" ? v : undefined);
const int = (v: unknown) => (typeof v === "number" ? v : undefined);

/** Picks only known profile fields from validated data. Anything else is dropped. */
export function toProfile(data: Raw): Profile {
  return {
    ...emptyProfile(),
    careerDomain: text(data.careerDomain),
    targetRole: text(data.targetRole),
    experienceLevel: text(data.experienceLevel),
    educationLevel: text(data.educationLevel),
    degree: text(data.degree),
    graduationYear: int(data.graduationYear),
    primaryProgrammingLanguage: text(data.primaryProgrammingLanguage),
    currentRole: text(data.currentRole),
    yearsOfExperience: int(data.yearsOfExperience),
    skillsToImprove: Array.isArray(data.skillsToImprove) ? (data.skillsToImprove as string[]) : [],
  };
}
