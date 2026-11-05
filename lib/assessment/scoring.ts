import "server-only";

export interface ScoreResult {
  totalScore: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
}

export function computeScore(answers: { marks: number; correct: boolean }[], passingScore: number, maxScore: number): ScoreResult {
  const total = answers.reduce((s, a) => s + (a.correct ? a.marks : 0), 0);
  const pct = maxScore > 0 ? (total / maxScore) * 100 : 0;
  return { totalScore: total, maxScore, percentage: pct, passed: pct >= passingScore };
}
