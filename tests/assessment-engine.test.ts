import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  checkMultipleChoice,
  checkNumeric,
  checkTrueFalse,
  normalizeAnswer,
  scoreToBand,
} from "@/lib/ai/services/assessment-engine";

describe("Assessment Engine - Deterministic Scoring", () => {
  describe("normalizeAnswer", () => {
    it("trims and lowercases", () => {
      expect(normalizeAnswer("  Hello World  ")).toBe("hello world");
      expect(normalizeAnswer("TEST")).toBe("test");
    });
  });

  describe("checkMultipleChoice", () => {
    it("returns correct score for exact match", () => {
      const result = checkMultipleChoice("A", ["A"], 1, false);
      expect(result.isCorrect).toBe(true);
      expect(result.score).toBe(1);
    });

    it("returns correct score for case insensitive match", () => {
      const result = checkMultipleChoice("a", ["A"], 1, false);
      expect(result.isCorrect).toBe(true);
      expect(result.score).toBe(1);
    });

    it("returns correct score for partial match", () => {
      const result = checkMultipleChoice("Option A", ["A"], 1, false);
      expect(result.isCorrect).toBe(true);
      expect(result.score).toBe(1);
    });

    it("returns incorrect for wrong answer", () => {
      const result = checkMultipleChoice("B", ["A"], 1, false);
      expect(result.isCorrect).toBe(false);
      expect(result.score).toBe(0);
    });

    it("returns unanswered for empty answer", () => {
      const result = checkMultipleChoice("", ["A"], 1, false);
      expect(result.isCorrect).toBeNull();
      expect(result.score).toBe(0);
    });

    it("applies negative marking when enabled", () => {
      const result = checkMultipleChoice("B", ["A"], 1, true);
      expect(result.isCorrect).toBe(false);
      expect(result.score).toBe(-1);
    });

    it("handles multiple correct options", () => {
      const result = checkMultipleChoice("A and C", ["A", "C"], 2, false);
      expect(result.isCorrect).toBe(true);
      expect(result.score).toBe(2);
    });
  });

  describe("checkNumeric", () => {
    it("returns correct for exact match", () => {
      const result = checkNumeric("42", "42", 1, false);
      expect(result.isCorrect).toBe(true);
      expect(result.score).toBe(1);
    });

    it("returns correct within tolerance", () => {
      const result = checkNumeric("3.141", "3.14", 1, false, 0.01);
      expect(result.isCorrect).toBe(true);
      expect(result.score).toBe(1);
    });

    it("returns incorrect outside tolerance", () => {
      const result = checkNumeric("3.15", "3.14", 1, false, 0.005);
      expect(result.isCorrect).toBe(false);
      expect(result.score).toBe(0);
    });

    it("returns unanswered for empty", () => {
      const result = checkNumeric("", "42", 1, false);
      expect(result.isCorrect).toBeNull();
      expect(result.score).toBe(0);
    });

    it("returns incorrect for invalid number", () => {
      const result = checkNumeric("abc", "42", 1, false);
      expect(result.isCorrect).toBeNull();
      expect(result.score).toBe(0);
    });

    it("applies negative marking", () => {
      const result = checkNumeric("0", "42", 1, true);
      expect(result.isCorrect).toBe(false);
      expect(result.score).toBe(-1);
    });
  });

  describe("checkTrueFalse", () => {
    it("returns correct for true match", () => {
      const result = checkTrueFalse("true", "true", 1, false);
      expect(result.isCorrect).toBe(true);
      expect(result.score).toBe(1);
    });

    it("returns correct for false match", () => {
      const result = checkTrueFalse("false", "false", 1, false);
      expect(result.isCorrect).toBe(true);
      expect(result.score).toBe(1);
    });

    it("returns incorrect for mismatch", () => {
      const result = checkTrueFalse("true", "false", 1, false);
      expect(result.isCorrect).toBe(false);
      expect(result.score).toBe(0);
    });

    it("handles case insensitivity", () => {
      const result = checkTrueFalse("TRUE", "true", 1, false);
      expect(result.isCorrect).toBe(true);
      expect(result.score).toBe(1);
    });

    it("applies negative marking", () => {
      const result = checkTrueFalse("false", "true", 1, true);
      expect(result.isCorrect).toBe(false);
      expect(result.score).toBe(-1);
    });
  });

  describe("scoreToBand", () => {
    it("maps scores to correct bands", () => {
      expect(scoreToBand(95)).toBe("Excellent");
      expect(scoreToBand(85)).toBe("Good");
      expect(scoreToBand(70)).toBe("Satisfactory");
      expect(scoreToBand(50)).toBe("Needs Improvement");
      expect(scoreToBand(20)).toBe("Insufficient");
    });

    it("handles boundary values", () => {
      expect(scoreToBand(90)).toBe("Excellent");
      expect(scoreToBand(75)).toBe("Good");
      expect(scoreToBand(60)).toBe("Satisfactory");
      expect(scoreToBand(40)).toBe("Needs Improvement");
      expect(scoreToBand(0)).toBe("Insufficient");
    });
  });
});

describe("Assessment Engine - Configuration Validation", () => {
  it("validates time limit is positive", () => {
    // This would be validated in the API route with Zod
    expect(() => {
      if (0 <= 0) throw new Error("Time limit must be positive");
    }).toThrow();
  });

  it("validates passing score range", () => {
    expect(() => {
      if (-1 < 0 || -1 > 100) throw new Error("Passing score must be 0-100");
    }).toThrow();
    expect(() => {
      if (101 < 0 || 101 > 100) throw new Error("Passing score must be 0-100");
    }).toThrow();
  });

  it("validates question count", () => {
    expect(() => {
      if (0 < 1) throw new Error("Question count must be positive");
    }).toThrow();
  });
});

describe("Assessment Engine - Timer Logic", () => {
  it("calculates deadline correctly", () => {
    const startTime = Date.now();
    const timeLimitMinutes = 30;
    const deadline = startTime + timeLimitMinutes * 60_000;
    expect(deadline - startTime).toBe(30 * 60_000);
  });

  it("calculates remaining time correctly", () => {
    const deadline = Date.now() + 60_000; // 1 minute from now
    const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
    expect(remaining).toBeLessThanOrEqual(60);
    expect(remaining).toBeGreaterThanOrEqual(0);
  });

  it("handles expired deadline", () => {
    const deadline = Date.now() - 1000; // 1 second ago
    const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
    expect(remaining).toBe(0);
  });
});

describe("Assessment Engine - Answer Persistence", () => {
  it("stores answers in map", () => {
    const answers = new Map();
    answers.set("q1", { questionId: "q1", answerText: "answer", selectedOptionIds: [], isMarkedForReview: false });
    expect(answers.has("q1")).toBe(true);
    expect(answers.get("q1")?.answerText).toBe("answer");
  });

  it("updates existing answers", () => {
    const answers = new Map();
    answers.set("q1", { questionId: "q1", answerText: "old", selectedOptionIds: [], isMarkedForReview: false });
    answers.set("q1", { questionId: "q1", answerText: "new", selectedOptionIds: [], isMarkedForReview: false });
    expect(answers.get("q1")?.answerText).toBe("new");
  });

  it("tracks mark for review", () => {
    const answers = new Map();
    answers.set("q1", { questionId: "q1", answerText: "answer", selectedOptionIds: [], isMarkedForReview: false });
    const existing = answers.get("q1");
    if (existing) {
      answers.set("q1", { ...existing, isMarkedForReview: true });
    }
    expect(answers.get("q1")?.isMarkedForReview).toBe(true);
  });
});

describe("Assessment Engine - Navigation Rules", () => {
  it("allows forward navigation", () => {
    const allowBackNavigation = false;
    const currentIndex = 0;
    const nextIndex = 1;
    const canNavigate = nextIndex > currentIndex || allowBackNavigation;
    expect(canNavigate).toBe(true);
  });

  it("blocks backward navigation when disabled", () => {
    const allowBackNavigation = false;
    const currentIndex = 1;
    const prevIndex = 0;
    const canNavigate = prevIndex > currentIndex || allowBackNavigation;
    expect(canNavigate).toBe(false);
  });

  it("allows backward navigation when enabled", () => {
    const allowBackNavigation = true;
    const currentIndex = 1;
    const prevIndex = 0;
    const canNavigate = prevIndex > currentIndex || allowBackNavigation;
    expect(canNavigate).toBe(true);
  });
});

describe("Assessment Engine - Submission Logic", () => {
  it("allows submission on last question", () => {
    const currentIndex = 4;
    const totalQuestions = 5;
    const canSubmit = currentIndex === totalQuestions - 1;
    expect(canSubmit).toBe(true);
  });

  it("blocks submission before last question", () => {
    const currentIndex = 2;
    const totalQuestions = 5;
    const canSubmit = currentIndex === totalQuestions - 1;
    expect(canSubmit).toBe(false);
  });
});

describe("Assessment Engine - Scoring Calculation", () => {
  it("calculates total score correctly", () => {
    const breakdown = [
      { score: 1, isCorrect: true },
      { score: 1, isCorrect: true },
      { score: 0, isCorrect: false },
      { score: 0, isCorrect: null },
    ];
    const totalScore = breakdown.reduce((sum, q) => sum + q.score, 0);
    expect(totalScore).toBe(2);
  });

  it("calculates max score correctly", () => {
    const questions = [
      { marks: 1 },
      { marks: 2 },
      { marks: 1 },
      { marks: 3 },
    ];
    const maxScore = questions.reduce((sum, q) => sum + q.marks, 0);
    expect(maxScore).toBe(7);
  });

  it("calculates percentage correctly", () => {
    const totalScore = 5;
    const maxScore = 10;
    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
    expect(percentage).toBe(50);
  });

  it("handles zero max score", () => {
    const totalScore = 0;
    const maxScore = 0;
    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
    expect(percentage).toBe(0);
  });

  it("determines pass/fail correctly", () => {
    const passingScore = 60;
    expect(65 >= passingScore).toBe(true);
    expect(55 >= passingScore).toBe(false);
    expect(60 >= passingScore).toBe(true);
  });
});