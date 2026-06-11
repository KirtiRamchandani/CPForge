import type { WorkspaceData } from "@cp-forge/schemas";
import { groupBy } from "@cp-forge/utils";

export interface AnalyticsSnapshot {
  solvedCount: number;
  attemptedCount: number;
  reviewDueCount: number;
  upsolveCount: number;
  strongTopics: string[];
  weakTopics: string[];
  topicDistribution: Record<string, number>;
  platformDistribution: Record<string, number>;
  mistakeDistribution: Record<string, number>;
  readinessScore: number;
  solveStreakDays: number;
  weeklyActivity: Record<string, number>;
  ratingProgress: Record<string, number>;
}

export const analyzeWorkspace = (workspace: WorkspaceData): AnalyticsSnapshot => {
  const solved = workspace.problems.filter((problem) => problem.status === "solved" || problem.status === "mastered");
  const attempted = workspace.problems.filter((problem) => problem.attempts > 0);
  const topicDistribution = countMany(solved.flatMap((problem) => problem.topics));
  const mistakeDistribution = countMany(workspace.mistakes.map((mistake) => mistake.category));
  const platformDistribution = Object.fromEntries(
    Object.entries(groupBy(workspace.problems, (problem) => problem.platform)).map(([platform, problems]) => [
      platform,
      problems.length
    ])
  );
  const strongTopics = Object.entries(topicDistribution)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([topic]) => topic);
  const weakTopics = Object.entries(mistakeDistribution)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([topic]) => topic);
  const readinessScore = Math.min(
    95,
    Math.round(
      solved.length * 3 +
        strongTopics.length * 8 -
        weakTopics.length * 4 +
        Math.min(10, computeSolveStreak(workspace)) * 2
    )
  );

  const weeklyActivity = buildWeeklyActivity(workspace);
  const ratingProgress = buildRatingProgress(workspace);

  return {
    solvedCount: solved.length,
    attemptedCount: attempted.length,
    reviewDueCount: workspace.reviews.filter((review) => !review.completed).length,
    upsolveCount: workspace.upsolve.filter((item) => !item.completed).length,
    strongTopics,
    weakTopics,
    topicDistribution,
    platformDistribution,
    mistakeDistribution,
    readinessScore: Math.max(12, readinessScore),
    solveStreakDays: computeSolveStreak(workspace),
    weeklyActivity,
    ratingProgress
  };
};

export interface StuckDiagnosis {
  summary: string;
  reasons: string[];
}

export const buildStuckDiagnosis = (workspace: WorkspaceData): StuckDiagnosis => {
  const analytics = analyzeWorkspace(workspace);
  const reasons: string[] = [];
  const weakTopicCount = new Set(workspace.mistakes.flatMap((m) => [m.topic, m.pattern].filter(Boolean))).size;

  if (analytics.solvedCount > 0 && analytics.weakTopics.length === 0) {
    reasons.push("You are solving problems but not logging mistakes, so CP Forge cannot see what to fix.");
  }
  if (analytics.upsolveCount > 3) {
    reasons.push("Your upsolve queue is growing faster than you clear it.");
  }
  if (analytics.reviewDueCount > 2) {
    reasons.push("Review debt is high; spaced repetition is falling behind.");
  }
  if (weakTopicCount > 0 && analytics.solvedCount / Math.max(1, weakTopicCount) < 3) {
    reasons.push("You avoid weak topics and keep adding new problems instead.");
  }
  if (analytics.attemptedCount > analytics.solvedCount * 2) {
    reasons.push("Too many attempts per solve — slow down and upsolve before opening new problems.");
  }
  if (reasons.length === 0) {
    reasons.push("Keep logging mistakes and completing reviews so CP Forge can refine your plan.");
  }

  return {
    summary: "You are stuck because growth signals are uneven across solve, review, and mistake tracking.",
    reasons: reasons.slice(0, 5)
  };
};

const countMany = (items: string[]): Record<string, number> =>
  items.reduce<Record<string, number>>((counts, item) => {
    counts[item] = (counts[item] ?? 0) + 1;
    return counts;
  }, {});

const computeSolveStreak = (workspace: WorkspaceData): number => {
  const days = workspace.problems
    .map((problem) => problem.solvedAt?.slice(0, 10))
    .filter((day): day is string => Boolean(day));
  if (!days.length) return 0;
  const unique = [...new Set(days)].sort();
  let streak = 1;
  for (let index = unique.length - 1; index > 0; index -= 1) {
    const current = new Date(`${unique[index]}T00:00:00.000Z`);
    const previous = new Date(`${unique[index - 1]}T00:00:00.000Z`);
    const diff = (current.getTime() - previous.getTime()) / 86_400_000;
    if (diff === 1) streak += 1;
    else break;
  }
  return streak;
};

const buildWeeklyActivity = (workspace: WorkspaceData): Record<string, number> => {
  const counts: Record<string, number> = {};
  for (const problem of workspace.problems) {
    const day = problem.solvedAt?.slice(0, 10) ?? problem.lastAttemptedAt?.slice(0, 10);
    if (!day) continue;
    counts[day] = (counts[day] ?? 0) + 1;
  }
  return counts;
};

const buildRatingProgress = (workspace: WorkspaceData): Record<string, number> => {
  const cf = workspace.problems.filter((problem) => problem.platform === "codeforces" && problem.rating);
  const buckets: Record<string, number> = {};
  for (const problem of cf) {
    const bucket = `${Math.floor((problem.rating ?? 800) / 200) * 200}-${Math.floor((problem.rating ?? 800) / 200) * 200 + 199}`;
    buckets[bucket] = (buckets[bucket] ?? 0) + 1;
  }
  return buckets;
};
