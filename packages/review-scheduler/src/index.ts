import type { Problem, ReviewItem } from "@cp-forge/schemas";
import { addDays, isoDate, stableId } from "@cp-forge/utils";

export const reviewIntervals = [1, 3, 7, 14, 30] as const;

export const scheduleReviews = (problems: Problem[], start = isoDate()): ReviewItem[] =>
  problems
    .filter((problem) => problem.status === "solved" || problem.status === "review_later" || problem.confidence < 60)
    .flatMap((problem) =>
      reviewIntervals.slice(0, problem.confidence >= 80 ? 3 : 5).map((interval) => ({
        id: stableId("review", problem.id, interval),
        problemId: problem.id,
        reason:
          problem.confidence < 60
            ? "Low confidence solved problem should be revisited before new problems."
            : "Spaced repetition keeps solved problems warm.",
        interval,
        dueDate: addDays(start, interval),
        completed: false
      }))
    );

export const dueReviews = (reviews: ReviewItem[], today = isoDate()): ReviewItem[] =>
  reviews.filter((review) => !review.completed && review.dueDate <= today);

export const completeReview = (reviews: ReviewItem[], id: string, completedAt = isoDate()): ReviewItem[] =>
  reviews.map((review) => (review.id === id ? { ...review, completed: true, completedAt } : review));
