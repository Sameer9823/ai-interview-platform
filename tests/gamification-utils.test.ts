import { describe, expect, it } from "vitest";
import { calculateLevel, calculateProgressToNextLevel, XP_RULES, LEVEL_THRESHOLDS } from "@/lib/gamification";
import { ACHIEVEMENT_DEFINITIONS } from "@/lib/gamification/achievements";

const T0 = LEVEL_THRESHOLDS[0]!;
const T1 = LEVEL_THRESHOLDS[1]!;
const T4 = LEVEL_THRESHOLDS[4]!;
const T97 = LEVEL_THRESHOLDS[97]!;
const T98 = LEVEL_THRESHOLDS[98]!;
const T99 = LEVEL_THRESHOLDS[99]!;

describe("XP rules", () => {
  it("assigns XP to known activity types", () => {
    expect(XP_RULES.PRACTICE_SESSION_COMPLETED).toBe(10);
    expect(XP_RULES.ASSESSMENT_COMPLETED).toBe(20);
    expect(XP_RULES.MOCK_INTERVIEW_COMPLETED).toBe(30);
    expect(XP_RULES.WEEKLY_GOAL_ACHIEVED).toBe(100);
    expect(XP_RULES.STREAK_MILESTONE_REACHED).toBe(75);
  });

  it("does not define XP for unknown activities", () => {
    expect(XP_RULES["UNKNOWN_ACTIVITY"]).toBeUndefined();
  });
});

describe("level calculation", () => {
  it("starts at level 1 with zero XP", () => {
    expect(calculateLevel(0)).toBe(1);
    expect(calculateLevel(1)).toBe(1);
    expect(calculateLevel(99)).toBe(1);
  });

  it("levels up as XP crosses thresholds", () => {
    expect(calculateLevel(T0)).toBe(2);
    expect(calculateLevel(T0 + 1)).toBe(2);
    expect(calculateLevel(T1)).toBe(3);
    expect(calculateLevel(T4)).toBe(6);
  });

  it("reaches level 100 at the highest threshold", () => {
    expect(calculateLevel(T97)).toBe(99);
    expect(calculateLevel(T98)).toBe(100);
    expect(calculateLevel(T99)).toBe(101);
    expect(calculateLevel(Number.MAX_SAFE_INTEGER)).toBe(101);
  });
});

describe("progress to next level", () => {
  it("returns 0 percent at level 1", () => {
    const progress = calculateProgressToNextLevel(0);
    expect(progress.current).toBe(0);
    expect(progress.next).toBe(T0);
    expect(progress.progress).toBe(0);
  });

  it("returns 0 percent when exactly at a threshold (start of new level)", () => {
    const xp = T0;
    const progress = calculateProgressToNextLevel(xp);
    expect(progress.current).toBe(T0);
    expect(progress.progress).toBe(0);
  });

  it("approaches 100 percent just before the next threshold", () => {
    const xp = T1 - 1;
    const progress = calculateProgressToNextLevel(xp);
    expect(progress.current).toBe(T0);
    expect(progress.next).toBe(T1);
    expect(progress.progress).toBeGreaterThan(0);
    expect(progress.progress).toBeLessThan(100);
  });

  it("clamps progress between 0 and 100", () => {
    expect(calculateProgressToNextLevel(0).progress).toBeGreaterThanOrEqual(0);
    expect(calculateProgressToNextLevel(0).progress).toBeLessThanOrEqual(100);
  });

  it("computes partial progress correctly", () => {
    const xp = T0 + 50;
    const progress = calculateProgressToNextLevel(xp);
    expect(progress.progress).toBeGreaterThan(0);
    expect(progress.progress).toBeLessThan(100);
  });
});

describe("achievement definitions", () => {
  it("includes the First Assessment achievement", () => {
    const first = ACHIEVEMENT_DEFINITIONS.find((a) => a.identifier === "first_assessment");
    expect(first).toBeDefined();
    expect(first?.category).toBe("GETTING_STARTED");
    expect(first?.xpReward).toBe(50);
    expect(first?.criteriaJson).toMatchObject({ type: "count", activityType: "ASSESSMENT_COMPLETED", minCount: 1 });
  });

  it("includes the Week Warrior streak achievement", () => {
    const ww = ACHIEVEMENT_DEFINITIONS.find((a) => a.identifier === "week_warrior");
    expect(ww).toBeDefined();
    expect(ww?.category).toBe("CONSISTENCY");
    expect(ww?.criteriaJson).toMatchObject({ type: "streak", minStreak: 7 });
  });

  it("includes level-based achievements", () => {
    const l5 = ACHIEVEMENT_DEFINITIONS.find((a) => a.identifier === "level_5");
    const l10 = ACHIEVEMENT_DEFINITIONS.find((a) => a.identifier === "level_10");
    expect(l5?.criteriaJson).toMatchObject({ type: "level", minLevel: 5 });
    expect(l10?.criteriaJson).toMatchObject({ type: "level", minLevel: 10 });
  });

  it("includes XP milestone achievement", () => {
    const xp1k = ACHIEVEMENT_DEFINITIONS.find((a) => a.identifier === "xp_1000");
    expect(xp1k).toBeDefined();
    expect(xp1k?.criteriaJson).toMatchObject({ type: "total_xp", minXP: 1000 });
    expect(xp1k?.xpReward).toBe(100);
  });

  it("includes assessment pass achievement", () => {
    const passed5 = ACHIEVEMENT_DEFINITIONS.find((a) => a.identifier === "passed_5");
    expect(passed5).toBeDefined();
    expect(passed5?.criteriaJson).toMatchObject({ type: "assessment_passed", minCount: 5 });
  });

  it("has displayOrder values that allow stable sorting", () => {
    const orders = ACHIEVEMENT_DEFINITIONS.map((a) => a.displayOrder);
    const sorted = [...orders].sort((a, b) => a - b);
    expect(orders).toEqual(sorted);
  });

  it("does not have duplicate identifiers", () => {
    const ids = ACHIEVEMENT_DEFINITIONS.map((a) => a.identifier);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("every achievement has required fields filled", () => {
    for (const def of ACHIEVEMENT_DEFINITIONS) {
      expect(def.identifier).toBeTruthy();
      expect(def.name).toBeTruthy();
      expect(def.description).toBeTruthy();
      expect(def.category).toBeTruthy();
      expect(def.icon).toBeTruthy();
      expect(def.criteriaJson).toEqual(expect.objectContaining({ type: expect.any(String) }));
      expect(def.xpReward).toBeGreaterThanOrEqual(0);
      expect(typeof def.displayOrder).toBe("number");
    }
  });
});
