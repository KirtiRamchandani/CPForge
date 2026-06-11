import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetchLeetCodeProblemset, writeFeedManifest } from "./lib/problem-feed-shared.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outFile = path.join(root, "datasets", "leetcode-problemset-cache.json");
const manifestFile = path.join(root, "datasets", "feed-manifest.json");

async function main() {
  console.log("Fetching LeetCode problem catalog (public GraphQL, free problems)...");
  const problems = await fetchLeetCodeProblemset({ includePaid: false, pageSize: 100, minIntervalMs: 1200 });

  let previousIds = [];
  if (fs.existsSync(outFile)) {
    try {
      previousIds = (JSON.parse(fs.readFileSync(outFile, "utf8")).problems ?? []).map((p) => p.id);
    } catch {
      /* ignore */
    }
  }
  const newIds = problems.filter((p) => !previousIds.includes(p.id)).map((p) => p.id);

  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(
    outFile,
    JSON.stringify({ fetchedAt: new Date().toISOString(), count: problems.length, problems }, null, 2) + "\n",
    "utf8"
  );

  let manifest = { updatedAt: new Date().toISOString(), codeforces: {}, leetcode: {} };
  if (fs.existsSync(manifestFile)) {
    try {
      manifest = { ...manifest, ...JSON.parse(fs.readFileSync(manifestFile, "utf8")) };
    } catch {
      /* ignore */
    }
  }
  manifest.updatedAt = new Date().toISOString();
  manifest.leetcode = {
    fetchedAt: new Date().toISOString(),
    count: problems.length,
    newSinceLastFetch: newIds.length,
    sampleNew: newIds.slice(0, 8)
  };
  writeFeedManifest(manifestFile, manifest);

  console.log(`Saved ${problems.length} LeetCode problems (${newIds.length} new) → ${path.relative(root, outFile)}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
