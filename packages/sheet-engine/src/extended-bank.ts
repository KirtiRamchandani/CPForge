import fs from "node:fs";
import path from "node:path";
import type { Problem } from "@cp-forge/schemas";
import { problemBank } from "./index.js";

let cachedExtended: Problem[] | undefined;

const loadCacheFile = (file: string, map: Map<string, Problem>, source: string) => {
  if (!fs.existsSync(file)) return;
  try {
    const raw = JSON.parse(fs.readFileSync(file, "utf8")) as { problems?: Problem[] };
    for (const problem of raw.problems ?? []) {
      if (problem?.id) map.set(problem.id, { ...problem, source: problem.source ?? source });
    }
  } catch {
    // ignore corrupt cache
  }
};

export const extendedProblemBank = (repoRoot: string, workspaceRoot = process.cwd()): Problem[] => {
  if (cachedExtended) return cachedExtended;
  const map = new Map<string, Problem>();
  for (const problem of problemBank) map.set(problem.id, problem);

  loadCacheFile(path.join(repoRoot, "datasets", "cf-problemset-cache.json"), map, "codeforces-api");
  loadCacheFile(path.join(repoRoot, "datasets", "leetcode-problemset-cache.json"), map, "leetcode-api");
  loadCacheFile(path.join(workspaceRoot, ".cpforge", "cache", "cf-problemset.json"), map, "codeforces-api");
  loadCacheFile(path.join(workspaceRoot, ".cpforge", "cache", "leetcode-problemset.json"), map, "leetcode-api");

  cachedExtended = [...map.values()];
  return cachedExtended;
};

export const resetExtendedCache = (): void => {
  cachedExtended = undefined;
};
