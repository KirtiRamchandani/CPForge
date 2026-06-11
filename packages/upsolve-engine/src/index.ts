import type { Priority, Problem, UpsolveItem } from "@cp-forge/schemas";
import { isoDate, stableId } from "@cp-forge/utils";

export const priorityRank: Record<Priority, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1
};

export const buildUpsolveQueue = (problems: Problem[], weakTopics: string[], today = isoDate()): UpsolveItem[] =>
  problems
    .filter((problem) => problem.status === "attempted" || problem.status === "upsolve" || problem.attempts >= 2)
    .map((problem) => {
      const weakTag = problem.topics.some((topic) => weakTopics.includes(topic));
      const priority: Priority = problem.attempts >= 3 ? "critical" : weakTag ? "high" : "medium";
      return {
        id: stableId("upsolve", problem.id),
        problemId: problem.id,
        reason: weakTag
          ? "Attempted but unsolved in a weak topic; upsolving this repairs a repeated gap."
          : "Attempted but unsolved problems are the highest-signal practice.",
        priority,
        addedAt: today,
        completed: false
      };
    })
    .sort((a, b) => priorityRank[b.priority] - priorityRank[a.priority]);

export const prioritizeUpsolve = (items: UpsolveItem[]): UpsolveItem[] =>
  [...items].sort((a, b) => priorityRank[b.priority] - priorityRank[a.priority]);
