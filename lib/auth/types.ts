import type { CareerStage } from "@/lib/permissions";

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  careerStage: CareerStage | null;
  passwordHash: string;
  emailVerified: boolean;
  onboardingDone: boolean;
  platformRole: "NONE" | "ADMIN";
  profile: {
    careerDomain?: string;
    targetRole?: string;
    preferredLanguage: "en";
    experienceLevel?: string;
    educationLevel?: string;
    degree?: string;
    graduationYear?: number;
    primaryProgrammingLanguage?: string;
    currentRole?: string;
    yearsOfExperience?: number;
    skills: string[];
    skillsToImprove: string[];
  };
  goals: string[];
  prefs: { theme: "LIGHT" | "DARK" | "SYSTEM"; emailNotifications: boolean; productUpdates: boolean };
  activity: { id: string; title: string; at: string }[];
  notifications: { id: string; title: string; at: string; read: boolean }[];
}