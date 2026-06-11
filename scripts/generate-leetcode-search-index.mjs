import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cacheFile = path.join(root, "datasets/leetcode-problemset-cache.json");
const outFile = path.join(root, "apps/web-dashboard/public/leetcode-search-index.json");

if (!existsSync(cacheFile)) {
  console.log("LeetCode cache missing — run: node scripts/fetch-leetcode-problemset.mjs");
  process.exit(0);
}

const cache = JSON.parse(readFileSync(cacheFile, "utf8"));
const index = (cache.problems ?? []).map((p) => ({
  id: p.id,
  t: p.title,
  u: p.url,
  d: p.difficulty,
  r: p.rating ?? 0,
  tp: (p.topics ?? []).slice(0, 4)
}));

mkdirSync(path.dirname(outFile), { recursive: true });
writeFileSync(outFile, JSON.stringify({ count: index.length, fetchedAt: cache.fetchedAt, problems: index }));
console.log(`Wrote leetcode-search-index.json (${index.length} problems)`);
