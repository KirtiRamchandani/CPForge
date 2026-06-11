import type { Problem } from "@cp-forge/schemas";
import { CodeforcesApiClient } from "./index.js";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const leetcodeRating = (difficulty: string) => {
  const key = difficulty.toLowerCase();
  if (key === "easy") return 900;
  if (key === "medium") return 1300;
  if (key === "hard") return 1700;
  return 1200;
};

export interface FeedManifest {
  updatedAt: string;
  codeforces?: FeedPlatformManifest;
  leetcode?: FeedPlatformManifest;
}

export interface FeedPlatformManifest {
  fetchedAt: string;
  count: number;
  newSinceLastFetch: number;
  sampleNew: string[];
}

export interface ProblemFeedCache {
  fetchedAt: string;
  platform: string;
  count: number;
  problems: Problem[];
}

export const mapLeetCodeQuestion = (question: {
  title: string;
  titleSlug: string;
  difficulty: string;
  topicTags?: Array<{ name: string; slug: string }>;
  isPaidOnly?: boolean;
}): Problem => {
  const topics = (question.topicTags ?? []).map((tag) => tag.slug ?? slugify(tag.name));
  const difficulty = String(question.difficulty ?? "unknown").toLowerCase();
  return {
    id: `leetcode-${question.titleSlug}`,
    platform: "leetcode",
    platformId: question.titleSlug,
    title: question.title,
    url: `https://leetcode.com/problems/${question.titleSlug}/`,
    difficulty,
    rating: leetcodeRating(difficulty),
    topics,
    patterns: topics.slice(0, 2),
    companies: [],
    level: difficulty === "easy" ? "beginner" : difficulty === "hard" ? "advanced" : "intermediate",
    status: "unseen",
    attempts: 0,
    confidence: 0,
    notes: "",
    mistakes: [],
    source: "leetcode-api"
  };
};

export const mapCodeforcesApiProblem = (problem: {
  contestId: number;
  index: string;
  name: string;
  rating?: number;
  tags?: string[];
  type?: string;
}): Problem => {
  const rating = problem.rating ?? 1100;
  const contestId = problem.contestId;
  const index = problem.index;
  const topics = (problem.tags ?? []).map((tag) => tag.toLowerCase().replace(/\s+/g, "-"));
  return {
    id: `codeforces-${contestId}${index}-${slugify(problem.name)}`,
    platform: "codeforces",
    platformId: `${contestId}${index}`,
    title: problem.name,
    url: `https://codeforces.com/problemset/problem/${contestId}/${index}`,
    difficulty: String(rating),
    rating,
    topics,
    patterns: topics.slice(0, 2),
    companies: [],
    level: rating < 1200 ? "newbie" : rating < 1600 ? "specialist" : rating < 1900 ? "expert" : "candidate-master",
    status: "unseen",
    attempts: 0,
    confidence: 0,
    notes: "",
    mistakes: [],
    source: "codeforces-api"
  };
};

export async function fetchCodeforcesFeed(client = new CodeforcesApiClient()): Promise<Problem[]> {
  const result = (await client.problemsetProblems()) as {
    problems?: Array<Parameters<typeof mapCodeforcesApiProblem>[0]>;
  };
  return (result.problems ?? [])
    .filter((p) => p.type === "PROGRAMMING")
    .map(mapCodeforcesApiProblem)
    .sort((a, b) => (a.rating ?? 0) - (b.rating ?? 0));
}

export async function fetchLeetCodeFeed(options: { includePaid?: boolean; pageSize?: number } = {}): Promise<Problem[]> {
  const includePaid = options.includePaid ?? false;
  const pageSize = options.pageSize ?? 100;
  const endpoint = "https://leetcode.com/graphql";
  const query = `
    query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
      questionList(categorySlug: $categorySlug, limit: $limit, skip: $skip, filters: $filters) {
        totalNum
        data {
          title
          titleSlug
          difficulty
          topicTags { name slug }
          isPaidOnly
        }
      }
    }`;

  const all: Problem[] = [];
  let skip = 0;
  let total = Infinity;

  while (skip < total) {
    await sleep(1200);
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        referer: "https://leetcode.com/problemset/",
        "user-agent": "CP-Forge/0.2 (local-first problem feed)"
      },
      body: JSON.stringify({
        query,
        variables: { categorySlug: "", limit: pageSize, skip, filters: {} }
      })
    });
    if (!response.ok) throw new Error(`LeetCode HTTP ${response.status}`);
    const body = (await response.json()) as {
      errors?: Array<{ message: string }>;
      data?: {
        questionList?: {
          total?: number;
          totalNum?: number;
          questions?: Array<Parameters<typeof mapLeetCodeQuestion>[0]>;
          data?: Array<Parameters<typeof mapLeetCodeQuestion>[0]>;
        };
      };
    };
    if (body.errors?.length) throw new Error(body.errors[0]?.message ?? "LeetCode GraphQL error");
    const block = body.data?.questionList;
    if (!block) throw new Error("LeetCode returned empty problem list");
    total = block.totalNum ?? block.total ?? 0;
    const batch = (block.data ?? block.questions ?? [])
      .filter((q) => includePaid || !q.isPaidOnly)
      .map(mapLeetCodeQuestion);
    all.push(...batch);
    skip += pageSize;
    if ((block.data ?? block.questions ?? []).length === 0) break;
  }

  const bySlug = new Map<string, Problem>();
  for (const problem of all) bySlug.set(problem.platformId, problem);
  return [...bySlug.values()].sort((a, b) => (a.rating ?? 0) - (b.rating ?? 0));
}

export const diffNewProblemIds = (previousIds: string[], next: Problem[]): string[] => {
  const prev = new Set(previousIds);
  return next.filter((p) => !prev.has(p.id)).map((p) => p.id);
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
