import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bank = JSON.parse(readFileSync(path.join(root, "packages/sheet-engine/src/generated-problems.json"), "utf8"));
let cf = [];
try {
  cf = JSON.parse(readFileSync(path.join(root, "datasets/cf-problemset-cache.json"), "utf8")).problems;
} catch {
  cf = [];
}

const header = "id,platform,title,url,difficulty,rating,topics,patterns,companies,level,status";

const writeCsv = (filePath, rows) => {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(
    filePath,
    [header, ...rows.map((p) => csvRow(p))].join("\n")
  );
};

const csvRow = (p) =>
  [
    p.id,
    p.platform,
    `"${String(p.title).replace(/"/g, '""')}"`,
    p.url,
    p.difficulty,
    p.rating ?? "",
    (p.topics ?? []).join(";"),
    (p.patterns ?? []).join(";"),
    (p.companies ?? []).join(";"),
    p.level ?? "",
    p.status ?? "unseen"
  ].join(",");

const byRating = (min, max) => cf.filter((p) => (p.rating ?? 0) >= min && (p.rating ?? 0) <= max).slice(0, 200);

const sheets = [
  ["sheets/dsa/beginner-dsa.csv", bank.filter((p) => p.level === "easy" || (p.rating ?? 9999) < 1200)],
  ["sheets/dsa/blind-75-style.csv", bank.filter((p) => p.source?.includes("blind") || p.companies.length > 0).slice(0, 75)],
  ["sheets/dsa/neetcode-style.csv", bank.slice(0, 150)],
  ["sheets/dsa/a2z-dsa.csv", bank],
  ["sheets/dsa/revision-dsa.csv", bank.filter((p) => p.status === "solved" || p.patterns.length > 0)],
  ["sheets/dsa/interview-master.csv", bank.filter((p) => p.companies.length > 0)],
  ["sheets/cp/codeforces-800-1000.csv", byRating(800, 1000)],
  ["sheets/cp/codeforces-1000-1200.csv", byRating(1000, 1200)],
  ["sheets/cp/codeforces-1200-1500.csv", byRating(1200, 1500)],
  ["sheets/cp/codeforces-1500-1800.csv", byRating(1500, 1800)],
  ["sheets/cp/codeforces-1800-2100.csv", byRating(1800, 2100)],
  ["sheets/cp/codeforces-2100-plus.csv", byRating(2100, 4000)],
  ["sheets/cp/icpc-sheet.csv", cf.filter((p) => (p.rating ?? 0) >= 1600).slice(0, 100)],
  ["sheets/cp/dp-for-cp.csv", cf.filter((p) => (p.topics ?? []).some((t) => t.includes("dp"))).slice(0, 120)],
  ["sheets/cp/graphs-for-cp.csv", cf.filter((p) => (p.topics ?? []).some((t) => /graph|tree|dfs|bfs/i.test(t))).slice(0, 120)],
  ["sheets/placement/7-day-oa-crash.csv", bank.slice(0, 21)],
  ["sheets/placement/15-day-interview-crash.csv", bank.slice(0, 45)],
  ["sheets/placement/30-day-dsa.csv", bank.slice(0, 90)],
  ["sheets/placement/60-day-interview.csv", bank.slice(0, 120)],
  ["sheets/placement/90-day-placement.csv", bank],
  ["sheets/placement/180-day-cp.csv", cf.slice(0, 180)]
];

for (const [rel, rows] of sheets) {
  writeCsv(path.join(root, rel), rows.length ? rows : bank.slice(0, 10));
  console.log(`Wrote ${rel} (${rows.length || 10} rows)`);
}
