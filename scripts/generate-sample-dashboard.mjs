import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const { createWorkspace } = await import(pathToFileURL(path.join(root, "packages/core/dist/index.js")).href);
const { analyzeWorkspace } = await import(pathToFileURL(path.join(root, "packages/analytics-engine/dist/index.js")).href);
const { buildDailyPlan, buildWeeklyPlan, detectWeakAreas } = await import(
  pathToFileURL(path.join(root, "packages/recommendation-engine/dist/index.js")).href
);

const workspace = createWorkspace({
  goal: "cp",
  preferredLanguage: "cpp",
  codeforcesHandle: "demo_user",
  leetcodeHandle: "demo_user",
  targetCompanies: ["amazon", "google"],
  interviewTimelineDays: 60
});

if (workspace.problems[0]) {
  workspace.problems[0] = { ...workspace.problems[0], status: "solved", title: "Two Sum" };
}
workspace.mistakes.push({
  id: "mistake-demo",
  title: "Forgot modulo on prefix sum",
  category: "overflow",
  description: "Use long long for prefix sums",
  fix: "Cast before add",
  createdAt: new Date().toISOString().slice(0, 10)
});

const payload = {
  workspace,
  analytics: analyzeWorkspace(workspace),
  today: buildDailyPlan(workspace, workspace.profile),
  weekly: buildWeeklyPlan(workspace, workspace.profile),
  weakAreas: detectWeakAreas(workspace)
};

const outDir = path.join(root, "apps/web-dashboard/public");
mkdirSync(outDir, { recursive: true });
writeFileSync(path.join(outDir, "sample-dashboard-data.json"), JSON.stringify(payload, null, 2));
console.log("Wrote sample-dashboard-data.json");
