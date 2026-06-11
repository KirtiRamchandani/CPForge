import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outFile = path.join(root, "datasets", "cf-problemset-cache.json");
const minIntervalMs = 2100;

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  const body = await response.json();
  if (body.status !== "OK") throw new Error(body.comment ?? "Codeforces API error");
  return body.result;
}

function mapCfProblem(problem) {
  const contestId = problem.contestId;
  const index = problem.index;
  const rating = problem.rating ?? estimateRating(problem);
  return {
    id: `codeforces-${contestId}${index}-${slugify(problem.name)}`,
    platform: "codeforces",
    platformId: `${contestId}${index}`,
    title: problem.name,
    url: `https://codeforces.com/problemset/problem/${contestId}/${index}`,
    difficulty: String(rating),
    rating,
    topics: (problem.tags ?? []).map((tag) => tag.toLowerCase().replace(/\s+/g, "-")),
    patterns: mapPatterns(problem.tags ?? []),
    companies: [],
    level: rating < 1200 ? "newbie" : rating < 1600 ? "specialist" : rating < 1900 ? "expert" : "candidate-master",
    status: "unseen",
    attempts: 0,
    confidence: 0,
    notes: "",
    mistakes: [],
    source: "codeforces-api"
  };
}

function estimateRating(problem) {
  if (problem.rating) return problem.rating;
  const tags = (problem.tags ?? []).join(" ").toLowerCase();
  if (tags.includes("implementation")) return 900;
  if (tags.includes("dp")) return 1500;
  if (tags.includes("graphs")) return 1400;
  return 1100;
}

function mapPatterns(tags) {
  const lower = tags.map((t) => t.toLowerCase());
  if (lower.some((t) => t.includes("dp"))) return ["dynamic programming"];
  if (lower.some((t) => t.includes("binary search"))) return ["binary search"];
  if (lower.some((t) => t.includes("graphs") || t.includes("dfs") || t.includes("bfs"))) return ["graphs"];
  if (lower.some((t) => t.includes("greedy"))) return ["greedy"];
  return lower.slice(0, 2);
}

async function main() {
  console.log("Fetching Codeforces problemset (single public API call)...");
  await new Promise((r) => setTimeout(r, minIntervalMs));
  const result = await fetchJson("https://codeforces.com/api/problemset.problems");
  const problems = (result.problems ?? [])
    .filter((p) => p.type === "PROGRAMMING")
    .map(mapCfProblem)
    .sort((a, b) => (a.rating ?? 0) - (b.rating ?? 0));

  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(
    outFile,
    JSON.stringify(
      {
        fetchedAt: new Date().toISOString(),
        count: problems.length,
        problems
      },
      null,
      2
    ) + "\n",
    "utf8"
  );
  console.log(`Saved ${problems.length} Codeforces problems to ${path.relative(root, outFile)}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
