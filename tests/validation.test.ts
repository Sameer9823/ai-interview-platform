import { describe, expect, it } from "vitest";
import { signUpSchema, signInSchema, changePasswordSchema, deleteAccountSchema } from "@/lib/validation/auth";
import { fieldErrors } from "@/lib/utils/form";
import { onboardingSchema } from "@/lib/validation/onboarding";
import { profileSchemaFor, preferencesSchema, goalsSchema } from "@/lib/validation/profile";

const validSignUp = {
  name: "Asha Raman",
  email: "  Asha@Example.com ",
  password: "correct horse 42",
  confirmPassword: "correct horse 42",
  acceptTerms: true,
};

describe("sign up", () => {
  it("accepts valid input and normalizes the email", () => {
    const r = signUpSchema.safeParse(validSignUp);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.email).toBe("asha@example.com");
  });
  it("carries no role or career stage, so none can be injected at sign up", () => {
    const r = signUpSchema.safeParse({ ...validSignUp, careerStage: "PROFESSIONAL", platformRole: "ADMIN", role: "RECRUITER" });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data).not.toHaveProperty("platformRole");
      expect(r.data).not.toHaveProperty("role");
      expect(r.data).not.toHaveProperty("careerStage");
    }
  });
  it("rejects weak passwords", () => {
    for (const p of ["short1", "onlyletterslong", "1234567890123"])
      expect(signUpSchema.safeParse({ ...validSignUp, password: p, confirmPassword: p }).success).toBe(false);
  });
  it("rejects mismatched passwords, missing terms, bad email and tiny names", () => {
    expect(signUpSchema.safeParse({ ...validSignUp, confirmPassword: "different 42 pass" }).success).toBe(false);
    expect(signUpSchema.safeParse({ ...validSignUp, acceptTerms: false }).success).toBe(false);
    expect(signUpSchema.safeParse({ ...validSignUp, email: "not-an-email" }).success).toBe(false);
    expect(signUpSchema.safeParse({ ...validSignUp, name: "A" }).success).toBe(false);
  });
  it("gives readable messages", () => {
    const r = signUpSchema.safeParse({ ...validSignUp, email: "nope" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0]?.message).toBe("Enter a valid email address");
  });
});

describe("error messages people actually see", () => {
  const msg = (r: { success: boolean; error?: { issues: { message: string; path: (string | number)[] }[] } }, key: string) =>
    r.error?.issues.find((i) => i.path[0] === key)?.message;
  it("terms, delete confirmation and stage have friendly wording", () => {
    expect(msg(signUpSchema.safeParse({ ...validSignUp, acceptTerms: false }), "acceptTerms")).toBe("Accept the terms to continue");
    expect(msg(signUpSchema.safeParse({ ...validSignUp, acceptTerms: undefined }), "acceptTerms")).toBeTruthy();
    expect(msg(deleteAccountSchema.safeParse({ password: "x", confirmation: "delete" }), "confirmation")).toBe("Type DELETE to confirm");
    expect(
      msg(changePasswordSchema.safeParse({ currentPassword: "a", newPassword: "short", confirmPassword: "short" }), "newPassword"),
    ).toBe("Use at least 10 characters");
  });
  it("every failing field in a bad onboarding payload has a non empty message", () => {
    const r = onboardingSchema.safeParse({ careerStage: "STUDENT" });
    expect(r.success).toBe(false);
    if (!r.success) for (const i of r.error.issues) expect(i.message.length).toBeGreaterThan(0);
  });
});

describe("sign in and password changes", () => {
  it("requires email and password", () => {
    expect(signInSchema.safeParse({ email: "", password: "" }).success).toBe(false);
    expect(signInSchema.safeParse({ email: "a@b.co", password: "x" }).success).toBe(true);
  });
  it("blocks reusing the current password", () => {
    expect(
      changePasswordSchema.safeParse({
        currentPassword: "same pass 1234",
        newPassword: "same pass 1234",
        confirmPassword: "same pass 1234",
      }).success,
    ).toBe(false);
  });
  it("requires typing DELETE exactly", () => {
    expect(deleteAccountSchema.safeParse({ password: "x", confirmation: "delete" }).success).toBe(false);
    expect(deleteAccountSchema.safeParse({ password: "x", confirmation: "DELETE" }).success).toBe(true);
  });
});

const studentBase = {
  careerStage: "STUDENT",
  careerDomain: "Software engineering",
  targetRole: "Backend developer",
  experienceLevel: "BEGINNER",
  educationLevel: "BACHELORS",
  degree: "Computer Science",
};
const proBase = {
  careerStage: "PROFESSIONAL",
  careerDomain: "Data and AI",
  targetRole: "ML engineer",
  experienceLevel: "ADVANCED",
  yearsOfExperience: "6",
};

describe("onboarding", () => {
  it("accepts a student and a fresher with only required fields, blanks become undefined", () => {
    for (const careerStage of ["STUDENT", "FRESHER"]) {
      const r = onboardingSchema.safeParse({ ...studentBase, careerStage, graduationYear: "", primaryProgrammingLanguage: "" });
      expect(r.success).toBe(true);
      if (r.success && r.data.careerStage !== "PROFESSIONAL") {
        expect(r.data.graduationYear).toBeUndefined();
        expect(r.data.primaryProgrammingLanguage).toBeUndefined();
        expect(r.data.goals).toEqual([]);
      }
    }
  });
  it("turns a tampered career stage into a readable message", () => {
    const r = onboardingSchema.safeParse({ ...studentBase, careerStage: "RECRUITER" });
    expect(r.success).toBe(false);
    if (!r.success) expect(fieldErrors(r.error).careerStage).toBe("Choose your career stage");
  });
  it("rejects an unknown career stage, including RECRUITER", () => {
    expect(onboardingSchema.safeParse({ ...studentBase, careerStage: "RECRUITER" }).success).toBe(false);
    expect(onboardingSchema.safeParse({ ...studentBase, careerStage: undefined }).success).toBe(false);
  });
  it("requires the common and stage specific required fields", () => {
    expect(onboardingSchema.safeParse({ ...studentBase, targetRole: "" }).success).toBe(false);
    expect(onboardingSchema.safeParse({ ...studentBase, degree: "" }).success).toBe(false);
    expect(onboardingSchema.safeParse({ ...studentBase, experienceLevel: "EXPERT" }).success).toBe(false);
    expect(onboardingSchema.safeParse({ ...proBase, yearsOfExperience: "" }).success).toBe(false);
  });
  it("bounds graduation year and years of experience, and allows zero years", () => {
    expect(onboardingSchema.safeParse({ ...studentBase, graduationYear: "2027" }).success).toBe(true);
    expect(onboardingSchema.safeParse({ ...studentBase, graduationYear: "1850" }).success).toBe(false);
    expect(onboardingSchema.safeParse({ ...proBase, yearsOfExperience: "0" }).success).toBe(true);
    expect(onboardingSchema.safeParse({ ...proBase, yearsOfExperience: "75" }).success).toBe(false);
  });
  it("parses comma separated skills and goals, removes duplicates, limits size", () => {
    const r = onboardingSchema.safeParse({
      ...proBase,
      skillsToImprove: "System design, SQL, system design ,",
      goals: "SYSTEM_DESIGN,BEHAVIORAL_HR,SYSTEM_DESIGN",
    });
    expect(r.success).toBe(true);
    if (r.success && r.data.careerStage === "PROFESSIONAL") {
      expect(r.data.skillsToImprove).toEqual(["System design", "SQL", "system design"]);
      expect(r.data.goals).toEqual(["SYSTEM_DESIGN", "BEHAVIORAL_HR"]);
    }
    expect(onboardingSchema.safeParse({ ...proBase, skillsToImprove: Array.from({ length: 11 }, (_, i) => `s${i}`) }).success).toBe(false);
  });
  it("rejects invalid goal categories", () => {
    expect(onboardingSchema.safeParse({ ...studentBase, goals: ["HACKING"] }).success).toBe(false);
  });
  it("strips fields that do not belong to the career stage", () => {
    const r = onboardingSchema.safeParse({ ...proBase, educationLevel: "BACHELORS", platformRole: "ADMIN" });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data).not.toHaveProperty("educationLevel");
      expect(r.data).not.toHaveProperty("platformRole");
    }
  });
});

describe("profile, goals and preferences", () => {
  it("chooses the schema from the server side stage", () => {
    expect(profileSchemaFor("FRESHER").safeParse({ name: "Asha Raman", ...studentBase }).success).toBe(true);
    expect(profileSchemaFor("PROFESSIONAL").safeParse({ name: "Asha Raman", ...proBase }).success).toBe(true);
    expect(profileSchemaFor("PROFESSIONAL").safeParse({ name: "Asha Raman", ...studentBase }).success).toBe(false);
  });
  it("validates goals", () => {
    expect(goalsSchema.safeParse({ goals: ["CODING_DSA", "COMMUNICATION"] }).success).toBe(true);
    expect(goalsSchema.safeParse({ goals: [] }).success).toBe(true);
    expect(goalsSchema.safeParse({ goals: ["NOPE"] }).success).toBe(false);
  });
  it("validates preferences", () => {
    expect(preferencesSchema.safeParse({ theme: "DARK", emailNotifications: true, productUpdates: false }).success).toBe(true);
    expect(preferencesSchema.safeParse({ theme: "NEON", emailNotifications: true, productUpdates: false }).success).toBe(false);
  });
});
