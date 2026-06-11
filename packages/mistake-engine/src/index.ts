import type { Mistake, MistakeCategory, Priority } from "@cp-forge/schemas";
import { groupBy, isoDate, stableId } from "@cp-forge/utils";

export const mistakeCategories: MistakeCategory[] = [
  "overflow",
  "off-by-one",
  "wrong complexity",
  "bad greedy proof",
  "wrong DP state",
  "missed base case",
  "missed edge case",
  "binary search boundary",
  "modulo negative",
  "recursion depth",
  "graph indexing",
  "not clearing data",
  "priority queue stale state",
  "visited array bug",
  "wrong comparator",
  "integer division",
  "floating point precision",
  "wrong sorting order",
  "forgot multiple test cases",
  "wrong answer due to constraints",
  "TLE due to poor complexity",
  "MLE due to memory"
];

export const createMistake = (input: {
  problemId: string;
  title: string;
  category: MistakeCategory;
  topic?: string;
  pattern?: string;
  severity?: Priority;
  description?: string;
  fix?: string;
}): Mistake => ({
  id: stableId("mistake", input.problemId, input.category, Date.now()),
  problemId: input.problemId,
  title: input.title,
  category: input.category,
  topic: input.topic,
  pattern: input.pattern,
  severity: input.severity ?? "medium",
  description: input.description ?? "",
  fix: input.fix ?? "",
  createdAt: isoDate()
});

export const mistakeStats = (mistakes: Mistake[]) => ({
  total: mistakes.length,
  unresolved: mistakes.filter((mistake) => !mistake.resolvedAt).length,
  byCategory: mapLengths(groupBy(mistakes, (mistake) => mistake.category)),
  byTopic: mapLengths(groupBy(mistakes.filter((mistake) => Boolean(mistake.topic)), (mistake) => mistake.topic ?? "unknown")),
  byPattern: mapLengths(
    groupBy(mistakes.filter((mistake) => Boolean(mistake.pattern)), (mistake) => mistake.pattern ?? "unknown")
  )
});

const mapLengths = <T>(groups: Record<string, T[]>): Record<string, number> =>
  Object.fromEntries(Object.entries(groups).map(([key, items]) => [key, items.length]));
