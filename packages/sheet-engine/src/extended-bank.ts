import fs from "node:fs";
import path from "node:path";
import type { Problem } from "@cp-forge/schemas";
import { problemBank } from "./index.js";

let cachedExtended: Problem[] | undefined;

export const extendedProblemBank = (repoRoot: string): Problem[] => {
  if (cachedExtended) return cachedExtended;
  const map = new Map<string, Problem>();
  for (const problem of problemBank) map.set(problem.id, problem);

  const cacheFile = path.join(repoRoot, "datasets", "cf-problemset-cache.json");
  if (fs.existsSync(cacheFile)) {
    try {
      const raw = JSON.parse(fs.readFileSync(cacheFile, "utf8")) as { problems?: Problem[] };
      for (const problem of raw.problems ?? []) {
        if (problem?.id) map.set(problem.id, { ...problem, source: problem.source ?? "codeforces-api" });
      }
    } catch {
      // ignore corrupt cache
    }
  }

  cachedExtended = [...map.values()];
  return cachedExtended;
};

export const resetExtendedCache = (): void => {
  cachedExtended = undefined;
};
