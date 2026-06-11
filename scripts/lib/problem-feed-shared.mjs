import fs from "node:fs";
import path from "node:path";

export const slugify = (value) =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export const leetcodeRating = (difficulty) => {
  const key = String(difficulty ?? "").toLowerCase();
  if (key === "easy") return 900;
  if (key === "medium") return 1300;
  if (key === "hard") return 1700;
  return 1200;
};

export const mapLeetCodeQuestion = (question) => {
  const topics = (question.topicTags ?? []).map((tag) => tag.slug ?? slugify(tag.name ?? ""));
  return {
    id: `leetcode-${question.titleSlug}`,
    platform: "leetcode",
    platformId: question.titleSlug,
    title: question.title,
    url: `https://leetcode.com/problems/${question.titleSlug}/`,
    difficulty: String(question.difficulty ?? "unknown").toLowerCase(),
    rating: leetcodeRating(question.difficulty),
    topics,
    patterns: topics.slice(0, 2),
    companies: [],
    level:
      String(question.difficulty ?? "").toLowerCase() === "easy"
        ? "beginner"
        : String(question.difficulty ?? "").toLowerCase() === "hard"
          ? "advanced"
          : "intermediate",
    status: "unseen",
    attempts: 0,
    confidence: 0,
    notes: "",
    mistakes: [],
    source: "leetcode-api",
    paidOnly: Boolean(question.isPaidOnly)
  };
};

export const mapCfProblem = (problem) => {
  const contestId = problem.contestId;
  const index = problem.index;
  const rating = problem.rating ?? estimateCfRating(problem);
  return {
    id: `codeforces-${contestId}${index}-${slugify(problem.name)}`,
    platform: "codeforces",
    platformId: `${contestId}${index}`,
    title: problem.name,
    url: `https://codeforces.com/problemset/problem/${contestId}/${index}`,
    difficulty: String(rating),
    rating,
    topics: (problem.tags ?? []).map((tag) => tag.toLowerCase().replace(/\s+/g, "-")),
    patterns: mapCfPatterns(problem.tags ?? []),
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

function estimateCfRating(problem) {
  if (problem.rating) return problem.rating;
  const tags = (problem.tags ?? []).join(" ").toLowerCase();
  if (tags.includes("implementation")) return 900;
  if (tags.includes("dp")) return 1500;
  if (tags.includes("graphs")) return 1400;
  return 1100;
}

function mapCfPatterns(tags) {
  const lower = tags.map((t) => t.toLowerCase());
  if (lower.some((t) => t.includes("dp"))) return ["dynamic programming"];
  if (lower.some((t) => t.includes("binary search"))) return ["binary search"];
  if (lower.some((t) => t.includes("graphs") || t.includes("dfs") || t.includes("bfs"))) return ["graphs"];
  if (lower.some((t) => t.includes("greedy"))) return ["greedy"];
  return lower.slice(0, 2);
}

export async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchCodeforcesProblemset(minIntervalMs = 2100) {
  await sleep(minIntervalMs);
  const response = await fetch("https://codeforces.com/api/problemset.problems");
  if (!response.ok) throw new Error(`Codeforces HTTP ${response.status}`);
  const body = await response.json();
  if (body.status !== "OK") throw new Error(body.comment ?? "Codeforces API error");
  return (body.result.problems ?? [])
    .filter((p) => p.type === "PROGRAMMING")
    .map(mapCfProblem)
    .sort((a, b) => (a.rating ?? 0) - (b.rating ?? 0));
}

export async function fetchLeetCodeProblemset(options = {}) {
  const includePaid = options.includePaid ?? false;
  const pageSize = options.pageSize ?? 100;
  const minIntervalMs = options.minIntervalMs ?? 1200;
  const endpoint = options.endpoint ?? "https://leetcode.com/graphql";
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

  const all = [];
  let skip = 0;
  let total = Infinity;

  while (skip < total) {
    await sleep(minIntervalMs);
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        referer: "https://leetcode.com/problemset/",
        "user-agent": "CP-Forge/0.2 (local-first problem feed; +https://github.com/KirtiRamchandani/CPForge)"
      },
      body: JSON.stringify({
        query,
        variables: { categorySlug: "", limit: pageSize, skip, filters: {} }
      })
    });
    if (!response.ok) throw new Error(`LeetCode HTTP ${response.status}`);
    const body = await response.json();
    if (body.errors?.length) throw new Error(body.errors[0]?.message ?? "LeetCode GraphQL error");
    const block = body.data?.questionList ?? body.data?.problemsetQuestionList;
    if (!block) throw new Error("LeetCode returned empty problem list");
    total = block.totalNum ?? block.total ?? 0;
    const rows = block.data ?? block.questions ?? [];
    const batch = rows
      .filter((q) => includePaid || !q.isPaidOnly)
      .map(mapLeetCodeQuestion);
    all.push(...batch);
    skip += pageSize;
    if (rows.length === 0) break;
  }

  const bySlug = new Map();
  for (const problem of all) bySlug.set(problem.platformId, problem);
  return [...bySlug.values()].sort((a, b) => (a.rating ?? 0) - (b.rating ?? 0));
}

export function diffProblemIds(previousIds, nextProblems) {
  const prev = new Set(previousIds ?? []);
  return nextProblems.filter((p) => !prev.has(p.id)).map((p) => p.id);
}

export function writeFeedManifest(file, manifest) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}
