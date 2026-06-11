import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { diffProblemIds, fetchCodeforcesProblemset, fetchLeetCodeProblemset, writeFeedManifest } from "./lib/problem-feed-shared.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cfOut = path.join(root, "datasets", "cf-problemset-cache.json");
const lcOut = path.join(root, "datasets", "leetcode-problemset-cache.json");
const manifestFile = path.join(root, "datasets", "feed-manifest.json");

function readPreviousIds(file) {
  if (!fs.existsSync(file)) return [];
  try {
    return (JSON.parse(fs.readFileSync(file, "utf8")).problems ?? []).map((p) => p.id);
  } catch {
    return [];
  }
}

function writeCache(file, problems, platform) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(
    file,
    JSON.stringify({ fetchedAt: new Date().toISOString(), platform, count: problems.length, problems }, null, 2) + "\n",
    "utf8"
  );
}

async function main() {
  const flags = new Set(process.argv.slice(2));
  const cfOnly = flags.has("--cf");
  const lcOnly = flags.has("--leetcode");
  const runAll = !cfOnly && !lcOnly;

  let manifest = { updatedAt: new Date().toISOString(), codeforces: {}, leetcode: {} };
  if (fs.existsSync(manifestFile)) {
    try {
      manifest = { ...manifest, ...JSON.parse(fs.readFileSync(manifestFile, "utf8")) };
    } catch {
      /* ignore */
    }
  }

  if (runAll || cfOnly) {
    console.log("Refreshing Codeforces problemset...");
    const prev = readPreviousIds(cfOut);
    const cfProblems = await fetchCodeforcesProblemset();
    const newIds = diffProblemIds(prev, cfProblems);
    writeCache(cfOut, cfProblems, "codeforces");
    manifest.codeforces = {
      fetchedAt: new Date().toISOString(),
      count: cfProblems.length,
      newSinceLastFetch: newIds.length,
      sampleNew: newIds.slice(0, 8)
    };
    console.log(`  Codeforces: ${cfProblems.length} total, ${newIds.length} new`);
  }

  if (runAll || lcOnly) {
    console.log("Refreshing LeetCode catalog...");
    const prev = readPreviousIds(lcOut);
    const lcProblems = await fetchLeetCodeProblemset({ includePaid: false });
    const newIds = diffProblemIds(prev, lcProblems);
    writeCache(lcOut, lcProblems, "leetcode");
    manifest.leetcode = {
      fetchedAt: new Date().toISOString(),
      count: lcProblems.length,
      newSinceLastFetch: newIds.length,
      sampleNew: newIds.slice(0, 8)
    };
    console.log(`  LeetCode: ${lcProblems.length} total, ${newIds.length} new`);
  }

  manifest.updatedAt = new Date().toISOString();
  writeFeedManifest(manifestFile, manifest);

  const publicManifest = path.join(root, "apps/web-dashboard/public/feed-manifest.json");
  fs.mkdirSync(path.dirname(publicManifest), { recursive: true });
  fs.copyFileSync(manifestFile, publicManifest);

  console.log("Regenerating search indexes and curated bank...");
  const { spawnSync } = await import("node:child_process");
  const steps = [
    ["node", ["scripts/generate-cf-search-index.mjs"]],
    ["node", ["scripts/generate-leetcode-search-index.mjs"]],
    ["node", ["scripts/sync-problem-bank.mjs"]]
  ];
  for (const [cmd, args] of steps) {
    const result = spawnSync(cmd, args, { cwd: root, stdio: "inherit", shell: process.platform === "win32" });
    if (result.status !== 0) process.exit(result.status ?? 1);
  }

  console.log("Problem feeds refreshed.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
