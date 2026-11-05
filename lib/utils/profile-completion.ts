import type { DevUser } from "@/lib/data/dev-store";
import { groupOf } from "@/lib/permissions";

/** Each check is a real field. The label becomes an explainable "next step" when it is missing. */
export function profileChecks(u: Pick<DevUser, "careerStage" | "profile" | "goals">): { label: string; done: boolean }[] {
  const p = u.profile;
  const common = [
    { label: "Add your preferred career domain", done: !!p.careerDomain },
    { label: "Add your target role", done: !!p.targetRole },
    { label: "Choose your experience level", done: !!p.experienceLevel },
  ];
  const stage =
    u.careerStage && groupOf(u.careerStage) === "professional"
      ? [
          { label: "Add your current role", done: !!p.currentRole },
          { label: "Add your years of experience", done: p.yearsOfExperience !== undefined },
          { label: "List skills you want to improve", done: p.skillsToImprove.length > 0 },
        ]
      : [
          { label: "Add your education level", done: !!p.educationLevel },
          { label: "Add your degree or specialization", done: !!p.degree },
          { label: "Add your graduation year", done: p.graduationYear !== undefined },
          { label: "Add your primary programming language", done: !!p.primaryProgrammingLanguage },
        ];
  return [...common, ...stage, { label: "Choose at least one preparation goal", done: u.goals.length > 0 }];
}

export function profileCompletion(u: Pick<DevUser, "careerStage" | "profile" | "goals">) {
  const checks = profileChecks(u);
  const done = checks.filter((c) => c.done).length;
  return {
    percent: Math.round((done / checks.length) * 100),
    remaining: checks.length - done,
    total: checks.length,
    missing: checks.filter((c) => !c.done).map((c) => c.label),
  };
}
