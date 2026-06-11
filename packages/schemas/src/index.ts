import { z } from "zod";

export const platformSchema = z.enum([
  "codeforces",
  "leetcode",
  "atcoder",
  "codechef",
  "cses",
  "gfg",
  "hackerrank",
  "interviewbit",
  "custom"
]);

export const problemStatusSchema = z.enum([
  "unseen",
  "solving",
  "solved",
  "attempted",
  "skipped",
  "upsolve",
  "review_later",
  "favorite",
  "revisit",
  "mastered"
]);

export const masteryStatusSchema = z.enum([
  "locked",
  "unseen",
  "in_progress",
  "completed",
  "review_due",
  "mastered",
  "weak",
  "strong"
]);

export const prioritySchema = z.enum(["critical", "high", "medium", "low"]);

export const problemSchema = z.object({
  id: z.string(),
  platform: platformSchema,
  platformId: z.string(),
  title: z.string(),
  url: z.string().url().or(z.string().startsWith("file:")),
  difficulty: z.string().default("unknown"),
  rating: z.number().int().positive().optional(),
  topics: z.array(z.string()).default([]),
  patterns: z.array(z.string()).default([]),
  companies: z.array(z.string()).default([]),
  level: z.string().default("unknown"),
  status: problemStatusSchema.default("unseen"),
  attempts: z.number().int().nonnegative().default(0),
  confidence: z.number().min(0).max(100).default(0),
  notes: z.string().default(""),
  mistakes: z.array(z.string()).default([]),
  reviewDate: z.string().optional(),
  solvedAt: z.string().optional(),
  lastAttemptedAt: z.string().optional(),
  qualityRating: z.number().min(1).max(5).optional(),
  source: z.string().default("static")
});

export const mistakeCategorySchema = z.enum([
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
]);

export const mistakeSchema = z.object({
  id: z.string(),
  problemId: z.string(),
  title: z.string(),
  category: mistakeCategorySchema,
  topic: z.string().optional(),
  pattern: z.string().optional(),
  severity: prioritySchema.default("medium"),
  description: z.string().default(""),
  fix: z.string().default(""),
  createdAt: z.string(),
  resolvedAt: z.string().optional(),
  reviewDate: z.string().optional()
});

export const reviewItemSchema = z.object({
  id: z.string(),
  problemId: z.string(),
  reason: z.string(),
  interval: z.number().int().positive(),
  dueDate: z.string(),
  completed: z.boolean().default(false),
  completedAt: z.string().optional()
});

export const upsolveItemSchema = z.object({
  id: z.string(),
  problemId: z.string(),
  reason: z.string(),
  priority: prioritySchema,
  addedAt: z.string(),
  completed: z.boolean().default(false),
  completedAt: z.string().optional()
});

export const roadmapNodeSchema = z.lazy(() =>
  z.object({
    id: z.string(),
    title: z.string(),
    description: z.string().default(""),
    type: z.enum(["root", "topic", "pattern", "problem", "checkpoint", "company", "level"]),
    status: masteryStatusSchema.default("unseen"),
    progress: z.number().min(0).max(100).default(0),
    children: z.array(roadmapNodeSchema).default([]),
    prerequisites: z.array(z.string()).default([]),
    linkedProblems: z.array(z.string()).default([]),
    linkedSheets: z.array(z.string()).default([]),
    notes: z.string().default("")
  })
) as unknown as z.ZodType<RoadmapNode>;

export const recommendationSchema = z.object({
  id: z.string(),
  type: z.enum(["problem", "review", "upsolve", "mistake", "roadmap", "contest", "company"]),
  title: z.string(),
  reason: z.string(),
  priority: prioritySchema,
  action: z.string(),
  estimatedTime: z.string().default("45min"),
  problemId: z.string().optional()
});

export const profileSchema = z.object({
  name: z.string().default("CP Forge User"),
  preferredLanguage: z.string().default("cpp"),
  dailyAvailableMinutes: z.number().int().positive().default(90),
  goal: z.string().default("cp"),
  targetCompanies: z.array(z.string()).default([]),
  codeforcesHandle: z.string().optional(),
  leetcodeHandle: z.string().optional(),
  atcoderHandle: z.string().optional(),
  codechefHandle: z.string().optional(),
  currentDsaLevel: z.string().default("beginner"),
  currentCpLevel: z.string().default("newbie"),
  targetCpRating: z.number().int().positive().optional(),
  interviewTimelineDays: z.number().int().positive().default(45),
  aiAssistEnabled: z.boolean().default(false)
});

export const workspaceDataSchema = z.object({
  profile: profileSchema,
  problems: z.array(problemSchema).default([]),
  mistakes: z.array(mistakeSchema).default([]),
  reviews: z.array(reviewItemSchema).default([]),
  upsolve: z.array(upsolveItemSchema).default([]),
  contests: z.array(z.record(z.unknown())).default([]),
  mindmaps: z.array(roadmapNodeSchema).default([])
});

export type Platform = z.infer<typeof platformSchema>;
export type ProblemStatus = z.infer<typeof problemStatusSchema>;
export type MasteryStatus = z.infer<typeof masteryStatusSchema>;
export type Priority = z.infer<typeof prioritySchema>;
export type Problem = z.infer<typeof problemSchema>;
export type MistakeCategory = z.infer<typeof mistakeCategorySchema>;
export type Mistake = z.infer<typeof mistakeSchema>;
export type ReviewItem = z.infer<typeof reviewItemSchema>;
export type UpsolveItem = z.infer<typeof upsolveItemSchema>;
export type Recommendation = z.infer<typeof recommendationSchema>;
export type Profile = z.infer<typeof profileSchema>;
export type WorkspaceData = z.infer<typeof workspaceDataSchema>;

export interface RoadmapNode {
  id: string;
  title: string;
  description: string;
  type: "root" | "topic" | "pattern" | "problem" | "checkpoint" | "company" | "level";
  status: MasteryStatus;
  progress: number;
  children: RoadmapNode[];
  prerequisites: string[];
  linkedProblems: string[];
  linkedSheets: string[];
  notes: string;
}

export const emptyWorkspace = (profile?: Partial<Profile>): WorkspaceData =>
  workspaceDataSchema.parse({
    profile: { ...profileSchema.parse({}), ...profile },
    problems: [],
    mistakes: [],
    reviews: [],
    upsolve: [],
    contests: [],
    mindmaps: []
  });
